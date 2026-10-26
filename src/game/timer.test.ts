import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTurnTimer, shouldTriggerTick } from './timer';
import { TURN_TIME_LIMIT_SEC, TURN_WARNING_THRESHOLD_SEC } from './constants';

test('computeTurnTimer correctly initializes at 0s elapsed', () => {
  const state = computeTurnTimer(0);
  assert.equal(state.remainingSeconds, 10);
  assert.equal(state.isExpired, false);
  assert.equal(state.isWarningActive, false);
  assert.equal(state.formattedDisplay, '10s');
  assert.equal(state.progressPercent, 100);
});

test('computeTurnTimer does not activate warning before 6 seconds', () => {
  const at3s = computeTurnTimer(3.0);
  assert.equal(at3s.remainingSeconds, 7.0);
  assert.equal(at3s.isWarningActive, false);
  assert.equal(at3s.isExpired, false);

  const at5s = computeTurnTimer(5.5);
  assert.equal(at5s.remainingSeconds, 4.5);
  assert.equal(at5s.isWarningActive, false);
  assert.equal(at5s.isExpired, false);
});

test('computeTurnTimer activates warning after 6 seconds elapsed', () => {
  const at6s = computeTurnTimer(6.0);
  assert.equal(at6s.remainingSeconds, 4.0);
  assert.equal(at6s.isWarningActive, true);
  assert.equal(at6s.isExpired, false);

  const at8s = computeTurnTimer(8.2);
  assert.ok(Math.abs(at8s.remainingSeconds - 1.8) < 1e-4);
  assert.equal(at8s.isWarningActive, true);
  assert.equal(at8s.isExpired, false);
});

test('computeTurnTimer marks expired when elapsed reaches or exceeds 10s', () => {
  const at10s = computeTurnTimer(10.0);
  assert.equal(at10s.remainingSeconds, 0);
  assert.equal(at10s.isExpired, true);
  assert.equal(at10s.isWarningActive, false);
  assert.equal(at10s.formattedDisplay, '0s');

  const past10s = computeTurnTimer(12.5);
  assert.equal(past10s.remainingSeconds, 0);
  assert.equal(past10s.isExpired, true);
});

test('shouldTriggerTick only triggers after 6 seconds elapsed (<= 4s remaining) and once per integer second', () => {
  let lastTick = 10;

  // Before 6s (remaining > 4s): no ticks
  let check = shouldTriggerTick(7.5, lastTick);
  assert.equal(check.shouldTick, false);
  assert.equal(check.newTickSecond, 10);

  check = shouldTriggerTick(4.2, lastTick);
  assert.equal(check.shouldTick, false);
  assert.equal(check.newTickSecond, 10);

  // At 6.1s elapsed (remaining 3.9s): ceil is 4 -> Tick!
  check = shouldTriggerTick(3.9, lastTick);
  assert.equal(check.shouldTick, true);
  assert.equal(check.newTickSecond, 4);
  lastTick = check.newTickSecond;

  // Still within 4s ceil: no duplicate tick
  check = shouldTriggerTick(3.4, lastTick);
  assert.equal(check.shouldTick, false);
  assert.equal(check.newTickSecond, 4);

  // Crosses into 3s (remaining 2.9s): Tick!
  check = shouldTriggerTick(2.9, lastTick);
  assert.equal(check.shouldTick, true);
  assert.equal(check.newTickSecond, 3);
  lastTick = check.newTickSecond;

  // Crosses into 2s (remaining 1.9s): Tick!
  check = shouldTriggerTick(1.9, lastTick);
  assert.equal(check.shouldTick, true);
  assert.equal(check.newTickSecond, 2);
  lastTick = check.newTickSecond;

  // Crosses into 1s (remaining 0.9s): Tick!
  check = shouldTriggerTick(0.9, lastTick);
  assert.equal(check.shouldTick, true);
  assert.equal(check.newTickSecond, 1);
  lastTick = check.newTickSecond;

  // At 0s: no more clock ticks (buzzer timeout handled separately)
  check = shouldTriggerTick(0, lastTick);
  assert.equal(check.shouldTick, false);
});
