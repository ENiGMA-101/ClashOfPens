import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePlacement,
  generateRandomBotPlacement,
  getSuggestedPlacement,
  isPenInsideTable,
  MIN_STARTING_DISTANCE,
  PEN_OVERLAP_DISTANCE,
  SAFE_BOUNDARY_MARGIN,
  PenPlacement,
} from './placement';
import { TABLE_PRESETS, resolveTableDimensions } from './tableConfig';

test('isPenInsideTable returns true when pen is safely centered on School Bench', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  assert.equal(isPenInsideTable({ x: 600, y: 325 }, 0, deskWidth, deskHeight), true);
  assert.equal(isPenInsideTable({ x: 300, y: 325 }, Math.PI / 2, deskWidth, deskHeight), true);
  assert.equal(isPenInsideTable({ x: 900, y: 325 }, -Math.PI / 2, deskWidth, deskHeight), true);
});

test('isPenInsideTable detects pen extending outside left, right, top, or bottom boundary', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  // Center near left edge with horizontal orientation (length 170 extends across x < 0)
  assert.equal(isPenInsideTable({ x: 40, y: 325 }, 0, deskWidth, deskHeight), false);
  // Center near right edge
  assert.equal(isPenInsideTable({ x: 1180, y: 325 }, 0, deskWidth, deskHeight), false);
  // Center near top edge with vertical orientation
  assert.equal(isPenInsideTable({ x: 600, y: 40 }, Math.PI / 2, deskWidth, deskHeight), false);
  // Center near bottom edge with vertical orientation
  assert.equal(isPenInsideTable({ x: 600, y: 620 }, Math.PI / 2, deskWidth, deskHeight), false);
});

test('validatePlacement rejects pen extending beyond borders', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  const result = validatePlacement({ x: 20, y: 325, angle: 0 }, [], deskWidth, deskHeight);
  assert.equal(result.valid, false);
  assert.match(result.reason || '', /outside the playable table/i);
});

test('validatePlacement rejects overlapping pens', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  const existing: PenPlacement[] = [{ x: 300, y: 325, angle: Math.PI / 2 }];

  // Almost identical position
  const result = validatePlacement({ x: 305, y: 328, angle: Math.PI / 2 }, existing, deskWidth, deskHeight);
  assert.equal(result.valid, false);
  assert.match(result.reason || '', /cannot overlap/i);
});

test('validatePlacement rejects pens placed too close together', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  const existing: PenPlacement[] = [{ x: 300, y: 325, angle: Math.PI / 2 }];

  // Distance 40px is below MIN_STARTING_DISTANCE
  const result = validatePlacement({ x: 335, y: 325, angle: Math.PI / 2 }, existing, deskWidth, deskHeight);
  assert.equal(result.valid, false);
  assert.match(result.reason || '', /too close to another pen/i);
});

test('validatePlacement accepts valid separated pens on School Bench', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  const existing: PenPlacement[] = [{ x: 264, y: 325, angle: Math.PI / 2 }];

  const result = validatePlacement({ x: 936, y: 325, angle: -Math.PI / 2 }, existing, deskWidth, deskHeight);
  assert.equal(result.valid, true);
  assert.equal(result.reason, undefined);
});

test('generateRandomBotPlacement places pen safely inside playable boundaries across all table presets', () => {
  for (const preset of TABLE_PRESETS) {
    const dims = resolveTableDimensions(preset, false);
    const humanPlacement: PenPlacement[] = [
      {
        x: dims.width * 0.22,
        y: dims.height * 0.5,
        angle: Math.PI / 2,
      },
    ];

    // Test with pseudo-RNG
    let seed = 42;
    const seededRng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const botPlacement = generateRandomBotPlacement(
      humanPlacement,
      dims.width,
      dims.height,
      seededRng,
      1,
      2
    );

    const val = validatePlacement(botPlacement, humanPlacement, dims.width, dims.height);
    assert.equal(
      val.valid,
      true,
      `Bot placement must be valid for ${preset.name}, reason: ${val.reason}`
    );
  }
});

test('AI Match Flow: Bot placement generated after human confirms avoids human and edges', () => {
  const deskWidth = 1200;
  const deskHeight = 650;
  const confirmedHumanPlacement: PenPlacement = {
    x: 280,
    y: 320,
    angle: Math.PI / 2,
  };

  for (let i = 0; i < 20; i++) {
    const bot = generateRandomBotPlacement(
      [confirmedHumanPlacement],
      deskWidth,
      deskHeight,
      Math.random,
      1,
      2
    );

    const val = validatePlacement(bot, [confirmedHumanPlacement], deskWidth, deskHeight);
    assert.equal(val.valid, true, `Bot attempt ${i} must be valid: ${val.reason}`);
    assert.ok(bot.x > 450, `Bot should spawn safely across the School Bench runway (got x=${bot.x})`);
  }
});

test('getSuggestedPlacement returns valid inside positions for School Bench', () => {
  const deskWidth = 1200;
  const deskHeight = 650;

  const p1 = getSuggestedPlacement(0, 2, deskWidth, deskHeight);
  const p2 = getSuggestedPlacement(1, 2, deskWidth, deskHeight);

  assert.equal(isPenInsideTable(p1, p1.angle, deskWidth, deskHeight), true);
  assert.equal(isPenInsideTable(p2, p2.angle, deskWidth, deskHeight), true);

  const val = validatePlacement(p2, [p1], deskWidth, deskHeight);
  assert.equal(val.valid, true);
});
