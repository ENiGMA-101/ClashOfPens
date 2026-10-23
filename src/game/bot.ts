import { AttackSideIndex, BotSkill, InGamePlayer } from '../types/game';
import { ATTACK_SIDES } from './constants';
import { clamp, launchSpeed, simulateTrajectory } from './physics';

export interface BotPlan {
  aim: number;
  power: number; // 0..100
  side: AttackSideIndex;
  score: number;
}

export function planBotShot(
  botPlayer: InGamePlayer,
  alivePlayers: InGamePlayer[],
  deskWidth: number,
  deskHeight: number,
  deskFriction: number,
  skillLevel: BotSkill
): BotPlan {
  const skillParams = {
    easy: { err: 0.18, powerErr: 0.22, maxPower: 0.58, missRate: 0.32 },
    normal: { err: 0.08, powerErr: 0.12, maxPower: 0.76, missRate: 0.12 },
    sharp: { err: 0.03, powerErr: 0.06, maxPower: 0.95, missRate: 0.0 },
  }[skillLevel] || { err: 0.08, powerErr: 0.12, maxPower: 0.76, missRate: 0.12 };

  const mePos = botPlayer.body.position;
  const targets = alivePlayers
    .filter((q) => q.idx !== botPlayer.idx)
    .sort((a, b) => {
      const da = Math.hypot(a.body.position.x - mePos.x, a.body.position.y - mePos.y);
      const db = Math.hypot(b.body.position.x - mePos.x, b.body.position.y - mePos.y);
      return da - db;
    })
    .slice(0, 2);

  let bestPlan: BotPlan | null = null;

  for (const target of targets) {
    const tp = target.body.position;
    const baseAngle = Math.atan2(tp.y - mePos.y, tp.x - mePos.x);

    // Calculate how close the target is to the desk edge
    const distToEdge = Math.min(tp.x, deskWidth - tp.x, tp.y, deskHeight - tp.y);
    const edgeVulnerability = 1 - clamp(distToEdge / (Math.min(deskWidth, deskHeight) / 2), 0, 1);

    const otherBodies = alivePlayers
      .filter((q) => q.idx !== botPlayer.idx)
      .map((q) => ({ idx: q.idx, pos: q.body.position, angle: q.body.angle }));

    // Evaluate side attacks: Middle (1), Top (0), Bottom (2)
    const sidesToTest: AttackSideIndex[] = [1, 0, 2];
    const angleOffsets = [0, -0.07, 0.07, -0.14, 0.14];

    for (const sideIdx of sidesToTest) {
      for (const off of angleOffsets) {
        const testAngle = baseAngle + off;
        const sim = simulateTrajectory(
          { x: mePos.x, y: mePos.y, angle: botPlayer.body.angle },
          testAngle,
          1.0,
          sideIdx,
          otherBodies,
          deskWidth,
          deskHeight,
          deskFriction,
          'strict'
        );

        if (!sim.hit || sim.hit.targetIndex !== target.idx) continue;

        const fullSpeed = launchSpeed(1.0, sideIdx);
        const margin = sideIdx === 1 ? 95 : 65;
        const neededSpeed = fullSpeed * Math.min(1, (sim.hit.d + margin) / Math.max(1, sim.total));
        const normalizedPower = clamp(
          (neededSpeed / ATTACK_SIDES[sideIdx].mult - 2) / 30,
          0.12,
          skillParams.maxPower
        );

        // Self-preservation check: if our own trajectory exits desk, heavily penalize!
        const selfPreservationPenalty = sim.exit ? 4.0 : 0.0;

        const score =
          edgeVulnerability * 2.2 +
          (sideIdx === 1 ? 0.4 : 0.1) -
          Math.abs(off) * 2.8 -
          normalizedPower * 0.5 -
          selfPreservationPenalty +
          Math.random() * 0.8;

        if (!bestPlan || score > bestPlan.score) {
          bestPlan = {
            aim: testAngle,
            power: Math.round(normalizedPower * 100),
            side: sideIdx,
            score,
          };
        }
      }
    }
  }

  // Fallback if no clean line found
  if (!bestPlan) {
    const firstTarget = targets[0];
    const fallbackAngle = firstTarget
      ? Math.atan2(firstTarget.body.position.y - mePos.y, firstTarget.body.position.x - mePos.x)
      : 0;
    bestPlan = {
      aim: fallbackAngle,
      power: 45,
      side: 1,
      score: 0,
    };
  }

  // Apply skill variance / human-like imperfection
  if (Math.random() < skillParams.missRate) {
    bestPlan.aim += (Math.random() < 0.5 ? -1 : 1) * (0.15 + Math.random() * 0.2);
  }
  bestPlan.aim += (Math.random() - 0.5) * 2 * skillParams.err;
  bestPlan.power = Math.round(
    clamp(bestPlan.power + (Math.random() - 0.5) * 2 * skillParams.powerErr * 100, 15, 95)
  );

  return bestPlan;
}
