import Matter from 'matter-js';
import { AttackSideIndex, FallRule } from '../types/game';
import {
  ATTACK_SIDES,
  BASE_DENSITY,
  BASE_RESTITUTION,
  PEN_LENGTH,
  PEN_WIDTH,
  SUB_DT,
} from './constants';

const { Engine, Bodies, Body, Composite } = Matter;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export function angDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export function launchSpeed(powerNormalized: number, sideIndex: AttackSideIndex): number {
  const side = ATTACK_SIDES[sideIndex] || ATTACK_SIDES[1];
  return (2 + 30 * powerNormalized) * side.mult;
}

export function contactPoint(
  position: { x: number; y: number },
  angle: number,
  sideIndex: AttackSideIndex
): { x: number; y: number } {
  const side = ATTACK_SIDES[sideIndex] || ATTACK_SIDES[1];
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const offset = side.offset * PEN_LENGTH;
  return {
    x: position.x + ax * offset,
    y: position.y + ay * offset,
  };
}

export function applyLaunch(
  body: Matter.Body,
  angle: number,
  powerNormalized: number,
  sideIndex: AttackSideIndex
): void {
  const side = ATTACK_SIDES[sideIndex] || ATTACK_SIDES[1];
  const v = launchSpeed(powerNormalized, sideIndex);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);

  Body.setVelocity(body, { x: ux * v, y: uy * v });

  const ax = Math.cos(body.angle);
  const ay = Math.sin(body.angle);
  const rx = ax * side.offset * PEN_LENGTH;
  const ry = ay * side.offset * PEN_LENGTH;
  const J = body.mass * v;

  // Angular torque from strike offset
  const angularVel = (rx * uy * J - ry * ux * J) / body.inertia;
  Body.setAngularVelocity(body, angularVel);
}

export function segOf(
  pos: { x: number; y: number },
  ang: number
): [{ x: number; y: number }, { x: number; y: number }] {
  const half = PEN_LENGTH / 2 - PEN_WIDTH / 2;
  const cx = Math.cos(ang) * half;
  const cy = Math.sin(ang) * half;
  return [
    { x: pos.x - cx, y: pos.y - cy },
    { x: pos.x + cx, y: pos.y + cy },
  ];
}

export function segClosest(
  p1: { x: number; y: number },
  q1: { x: number; y: number },
  p2: { x: number; y: number },
  q2: { x: number; y: number }
): [number, number, number] {
  const d1x = q1.x - p1.x;
  const d1y = q1.y - p1.y;
  const d2x = q2.x - p2.x;
  const d2y = q2.y - p2.y;
  const rx = p1.x - p2.x;
  const ry = p1.y - p2.y;

  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  const c = d1x * rx + d1y * ry;
  const b = d1x * d2x + d1y * d2y;
  const den = a * e - b * b;

  let s = den > 1e-9 ? clamp((b * f - c * e) / den, 0, 1) : 0;
  let t = (b * s + f) / e;

  if (t < 0) {
    t = 0;
    s = clamp(-c / a, 0, 1);
  } else if (t > 1) {
    t = 1;
    s = clamp((b - c) / a, 0, 1);
  }

  const c1x = p1.x + d1x * s;
  const c1y = p1.y + d1y * s;
  const c2x = p2.x + d2x * t;
  const c2y = p2.y + d2y * t;

  return [Math.hypot(c1x - c2x, c1y - c2y), (c1x + c2x) / 2, (c1y + c2y) / 2];
}

export function isOffDesk(
  body: Matter.Body,
  deskWidth: number,
  deskHeight: number,
  rule: FallRule
): boolean {
  if (rule === 'center') {
    const p = body.position;
    return p.x < 0 || p.y < 0 || p.x > deskWidth || p.y > deskHeight;
  }
  for (const v of body.vertices) {
    if (v.x < 0 || v.y < 0 || v.x > deskWidth || v.y > deskHeight) {
      return true;
    }
  }
  return false;
}

export function resolveCustomStrike(
  bodyA: Matter.Body,
  bodyB: Matter.Body,
  collisionPair: any,
  restitution: number
): number {
  const nn = collisionPair.collision.normal;
  let nx = nn.x;
  let ny = nn.y;

  if (
    (bodyB.position.x - bodyA.position.x) * nx +
      (bodyB.position.y - bodyA.position.y) * ny <
    0
  ) {
    nx = -nx;
    ny = -ny;
  }

  let cx = 0;
  let cy = 0;
  let count = 0;
  if (collisionPair.collision.supports) {
    for (const s of collisionPair.collision.supports) {
      if (s) {
        cx += s.x;
        cy += s.y;
        count++;
      }
    }
  }
  if (!count) {
    cx = (bodyA.position.x + bodyB.position.x) / 2;
    cy = (bodyA.position.y + bodyB.position.y) / 2;
  } else {
    cx /= count;
    cy /= count;
  }

  const va = Body.getVelocity(bodyA);
  const vb = Body.getVelocity(bodyB);
  const wa = Body.getAngularVelocity(bodyA);
  const wb = Body.getAngularVelocity(bodyB);

  const ra = { x: cx - bodyA.position.x, y: cy - bodyA.position.y };
  const rb = { x: cx - bodyB.position.x, y: cy - bodyB.position.y };

  const pa = { x: va.x - wa * ra.y, y: va.y + wa * ra.x };
  const pb = { x: vb.x - wb * rb.y, y: vb.y + wb * rb.x };

  const vn = (pb.x - pa.x) * nx + (pb.y - pa.y) * ny;
  if (vn >= 0) return 0;

  const ran = ra.x * ny - ra.y * nx;
  const rbn = rb.x * ny - rb.y * nx;

  const impulse =
    (-(1 + restitution) * vn) /
    (1 / bodyA.mass +
      1 / bodyB.mass +
      (ran * ran) / bodyA.inertia +
      (rbn * rbn) / bodyB.inertia);

  Body.setVelocity(bodyA, {
    x: va.x - (impulse * nx) / bodyA.mass,
    y: va.y - (impulse * ny) / bodyA.mass,
  });
  Body.setAngularVelocity(bodyA, wa - (ran * impulse) / bodyA.inertia);

  Body.setVelocity(bodyB, {
    x: vb.x + (impulse * nx) / bodyB.mass,
    y: vb.y + (impulse * ny) / bodyB.mass,
  });
  Body.setAngularVelocity(bodyB, wb + (rbn * impulse) / bodyB.inertia);

  return -vn;
}

export interface TrajectoryResult {
  path: Array<{ x: number; y: number; d: number }>;
  hit: {
    targetIndex: number;
    x: number;
    y: number;
    d: number;
    cx: number;
    cy: number;
    a: number;
  } | null;
  exit: { x: number; y: number; d: number } | null;
  endA: number;
  total: number;
}

let ghostEngine: Matter.Engine | null = null;

export function simulateTrajectory(
  attackerPos: { x: number; y: number; angle: number },
  angle: number,
  powerNormalized: number,
  sideIndex: AttackSideIndex,
  otherPlayers: Array<{ idx: number; pos: { x: number; y: number }; angle: number }>,
  deskWidth: number,
  deskHeight: number,
  frictionAir: number,
  fallRule: FallRule
): TrajectoryResult {
  if (!ghostEngine) {
    ghostEngine = Engine.create();
    ghostEngine.gravity.x = 0;
    ghostEngine.gravity.y = 0;
  }
  Composite.clear(ghostEngine.world, false);

  const side = ATTACK_SIDES[sideIndex] || ATTACK_SIDES[1];
  const ghostBody = Bodies.rectangle(
    attackerPos.x,
    attackerPos.y,
    PEN_LENGTH,
    PEN_WIDTH,
    {
      chamfer: { radius: 7 },
      frictionAir,
      friction: 0.12,
      frictionStatic: 0.2,
      restitution: BASE_RESTITUTION,
      density: BASE_DENSITY * side.dens,
      angle: attackerPos.angle,
    }
  );
  (ghostBody as any).deltaTime = SUB_DT;
  Composite.add(ghostEngine.world, ghostBody);

  applyLaunch(ghostBody, angle, powerNormalized, sideIndex);

  const others = otherPlayers.map((q) => ({
    idx: q.idx,
    seg: segOf(q.pos, q.angle),
  }));

  const path: Array<{ x: number; y: number; d: number }> = [
    { x: ghostBody.position.x, y: ghostBody.position.y, d: 0 },
  ];
  let hit: TrajectoryResult['hit'] = null;
  let exit: TrajectoryResult['exit'] = null;
  let dist = 0;

  for (let step = 0; step < 500; step++) {
    for (let sub = 0; sub < 2; sub++) {
      Engine.update(ghostEngine, SUB_DT);
    }
    const last = path[path.length - 1];
    dist += Math.hypot(ghostBody.position.x - last.x, ghostBody.position.y - last.y);
    const pt = { x: ghostBody.position.x, y: ghostBody.position.y, d: dist };
    path.push(pt);

    if (isOffDesk(ghostBody, deskWidth, deskHeight, fallRule)) {
      exit = pt;
      break;
    }

    const sg = segOf(ghostBody.position, ghostBody.angle);
    for (const o of others) {
      const r = segClosest(sg[0], sg[1], o.seg[0], o.seg[1]);
      if (r[0] < PEN_WIDTH) {
        hit = {
          targetIndex: o.idx,
          x: r[1],
          y: r[2],
          d: dist,
          cx: pt.x,
          cy: pt.y,
          a: ghostBody.angle,
        };
        break;
      }
    }
    if (hit) break;

    if (ghostBody.speed < 0.04 && Math.abs(ghostBody.angularVelocity) < 0.002) {
      break;
    }
  }

  return {
    path,
    hit,
    exit,
    endA: ghostBody.angle,
    total: dist,
  };
}
