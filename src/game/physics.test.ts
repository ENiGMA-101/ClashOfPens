import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  angDiff,
  launchSpeed,
  contactPoint,
  segOf,
  segClosest,
} from './physics';
import { PEN_LENGTH } from './constants';

test('clamp restricts numbers within min and max', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);
});

test('angDiff calculates shortest angular delta correctly', () => {
  assert.ok(Math.abs(angDiff(0, Math.PI / 2) - Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(angDiff(Math.PI, -Math.PI)) < 1e-6);
  assert.ok(Math.abs(angDiff(0, 3 * Math.PI / 2) - (-Math.PI / 2)) < 1e-6);
});

test('launchSpeed scales with power and side multiplier', () => {
  const speedTop = launchSpeed(0.5, 0); // Top strike has mult 1.08
  const speedMid = launchSpeed(0.5, 1); // Middle push has mult 0.92
  const speedBot = launchSpeed(0.5, 2); // Bottom slam has mult 1.22

  assert.ok(speedBot > speedTop, 'Bottom slam should have greater speed than top strike');
  assert.ok(speedTop > speedMid, 'Top strike should have greater speed than middle push');
  assert.ok(speedMid > 0, 'Speed must be positive');
});

test('contactPoint aligns with attack side offsets', () => {
  const centerPos = { x: 500, y: 300 };
  const angle = 0; // facing right (+x)

  const cpTop = contactPoint(centerPos, angle, 0); // offset +0.40 * 170 = +68
  const cpMid = contactPoint(centerPos, angle, 1); // offset 0
  const cpBot = contactPoint(centerPos, angle, 2); // offset -0.40 * 170 = -68

  assert.equal(cpMid.x, 500);
  assert.equal(cpMid.y, 300);
  assert.ok(Math.abs(cpTop.x - (500 + 0.40 * PEN_LENGTH)) < 1e-4);
  assert.ok(Math.abs(cpBot.x - (500 - 0.40 * PEN_LENGTH)) < 1e-4);
});

test('segment distance calculations identify close pens', () => {
  const p1 = { x: 100, y: 100 };
  const q1 = { x: 200, y: 100 };
  const p2 = { x: 150, y: 105 };
  const q2 = { x: 150, y: 200 };

  const [dist] = segClosest(p1, q1, p2, q2);
  assert.ok(dist <= 5.01, `Distance should be approx 5, got ${dist}`);
});
