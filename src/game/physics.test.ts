import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  angDiff,
  launchSpeed,
  contactPoint,
  segOf,
  segClosest,
  isOffDesk,
} from './physics';
import { PEN_LENGTH, MAX_SPEED, ATTACK_SIDES } from './constants';

test('clamp restricts numbers within min and max', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);
});

test('angDiff calculates shortest angular delta correctly', () => {
  assert.ok(Math.abs(angDiff(0, Math.PI / 2) - Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(angDiff(Math.PI, -Math.PI)) < 1e-6);
  assert.ok(Math.abs(angDiff(0, (3 * Math.PI) / 2) - -Math.PI / 2) < 1e-6);
});

test('launchSpeed scales progressively across 10%, 25%, 50%, 75%, and 100% power', () => {
  const powers = [0.1, 0.25, 0.5, 0.75, 1.0];
  for (let side = 0; side < 3; side++) {
    let lastSpeed = 0;
    for (const p of powers) {
      const spd = launchSpeed(p, side as any);
      assert.ok(spd > lastSpeed, `Speed should strictly increase with power at side ${side}`);
      assert.ok(spd <= MAX_SPEED, `Speed ${spd} must not exceed MAX_SPEED ${MAX_SPEED}`);
      assert.ok(spd >= 3.0, `Speed ${spd} must exceed minimum playable speed`);
      lastSpeed = spd;
    }
  }

  // Verify side balance: Bottom Slam gives heavier velocity, Middle Push is controlled, Top Strike is balanced
  const speedTop = launchSpeed(1.0, 0);
  const speedMid = launchSpeed(1.0, 1);
  const speedBot = launchSpeed(1.0, 2);

  assert.ok(speedBot > speedTop, 'Bottom slam should deliver higher momentum than top strike');
  assert.ok(speedTop > speedMid, 'Top strike should deliver higher speed than middle push');
  assert.ok(speedBot <= 28, 'Maximum speed should be calibrated under 28');
});

test('contactPoint aligns with attack side offsets', () => {
  const centerPos = { x: 500, y: 300 };
  const angle = 0; // facing right (+x)

  const cpTop = contactPoint(centerPos, angle, 0);
  const cpMid = contactPoint(centerPos, angle, 1);
  const cpBot = contactPoint(centerPos, angle, 2);

  assert.equal(cpMid.x, 500);
  assert.equal(cpMid.y, 300);
  assert.ok(Math.abs(cpTop.x - (500 + ATTACK_SIDES[0].offset * PEN_LENGTH)) < 1e-4);
  assert.ok(Math.abs(cpBot.x - (500 + ATTACK_SIDES[2].offset * PEN_LENGTH)) < 1e-4);
});

test('segment distance calculations identify close pens', () => {
  const p1 = { x: 100, y: 100 };
  const q1 = { x: 200, y: 100 };
  const p2 = { x: 150, y: 105 };
  const q2 = { x: 150, y: 200 };

  const [dist] = segClosest(p1, q1, p2, q2);
  assert.ok(dist <= 5.01, `Distance should be approx 5, got ${dist}`);
});

test('isOffDesk validates edge crossings accurately', () => {
  const deskW = 1000;
  const deskH = 600;

  // Safe pen well inside table
  const safeBody = {
    position: { x: 500, y: 300 },
    vertices: [
      { x: 420, y: 290 },
      { x: 580, y: 290 },
      { x: 580, y: 310 },
      { x: 420, y: 310 },
    ],
  } as any;
  assert.equal(isOffDesk(safeBody, deskW, deskH, 'strict'), false);
  assert.equal(isOffDesk(safeBody, deskW, deskH, 'center'), false);

  // Pen teetering close to edge with 1 tip slightly outside, but center well inside (not eliminated yet)
  const teeteringBody = {
    position: { x: 60, y: 300 },
    vertices: [
      { x: -10, y: 295 },
      { x: 130, y: 295 },
      { x: 130, y: 305 },
      { x: 20, y: 305 },
    ],
  } as any;
  assert.equal(isOffDesk(teeteringBody, deskW, deskH, 'strict'), false);
  assert.equal(isOffDesk(teeteringBody, deskW, deskH, 'center'), false);

  // Pen knocked over the edge (center of mass crossed 0)
  const knockedBody = {
    position: { x: -15, y: 300 },
    vertices: [
      { x: -95, y: 295 },
      { x: 65, y: 295 },
      { x: 65, y: 305 },
      { x: -95, y: 305 },
    ],
  } as any;
  assert.equal(isOffDesk(knockedBody, deskW, deskH, 'strict'), true);
  assert.equal(isOffDesk(knockedBody, deskW, deskH, 'center'), true);
});
