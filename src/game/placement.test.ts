import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePlacement,
  generateRandomBotPlacement,
  getSuggestedPlacement,
  isPenInsideTable,
  MIN_STARTING_DISTANCE,
  PEN_OVERLAP_DISTANCE,
  PenPlacement,
} from './placement';
import { TABLE_PRESETS, resolveTableDimensions } from './tableConfig';

test('isPenInsideTable returns true when pen is safely centered', () => {
  const deskWidth = 1040;
  const deskHeight = 640;
  assert.equal(isPenInsideTable({ x: 500, y: 300 }, 0, deskWidth, deskHeight), true);
  assert.equal(isPenInsideTable({ x: 500, y: 300 }, Math.PI / 4, deskWidth, deskHeight), true);
});

test('isPenInsideTable detects pen extending outside left or right table boundary', () => {
  const deskWidth = 1040;
  const deskHeight = 640;
  // Center near left edge with horizontal orientation (length 170 extends across x < 0)
  assert.equal(isPenInsideTable({ x: 40, y: 300 }, 0, deskWidth, deskHeight), false);
  // Center near right edge
  assert.equal(isPenInsideTable({ x: 1020, y: 300 }, 0, deskWidth, deskHeight), false);
});

test('validatePlacement rejects pen extending beyond borders', () => {
  const deskWidth = 800;
  const deskHeight = 600;
  const result = validatePlacement({ x: 20, y: 300, angle: 0 }, [], deskWidth, deskHeight);
  assert.equal(result.valid, false);
  assert.match(result.reason || '', /outside the playable table/i);
});

test('validatePlacement rejects overlapping pens', () => {
  const deskWidth = 1000;
  const deskHeight = 800;
  const existing: PenPlacement[] = [{ x: 500, y: 400, angle: 0 }];

  // Almost identical position
  const result = validatePlacement({ x: 502, y: 402, angle: 0 }, existing, deskWidth, deskHeight);
  assert.equal(result.valid, false);
  assert.match(result.reason || '', /cannot overlap/i);
});

test('validatePlacement rejects pens placed too close together', () => {
  const deskWidth = 1000;
  const deskHeight = 800;
  const existing: PenPlacement[] = [{ x: 500, y: 400, angle: 0 }];

  // Distance 30px is between PEN_OVERLAP_DISTANCE (16) and MIN_STARTING_DISTANCE (65)
  const result = validatePlacement({ x: 500, y: 430, angle: 0 }, existing, deskWidth, deskHeight);
  assert.equal(result.valid, false);
  assert.match(result.reason || '', /too close to another pen/i);
});

test('validatePlacement accepts valid separated pens', () => {
  const deskWidth = 1000;
  const deskHeight = 800;
  const existing: PenPlacement[] = [{ x: 300, y: 400, angle: Math.PI / 2 }];

  const result = validatePlacement({ x: 700, y: 400, angle: Math.PI / 2 }, existing, deskWidth, deskHeight);
  assert.equal(result.valid, true);
  assert.equal(result.reason, undefined);
});

test('generateRandomBotPlacement places pen safely inside playable boundaries across table shapes', () => {
  for (const preset of TABLE_PRESETS) {
    for (const isPortrait of [false, true]) {
      const dims = resolveTableDimensions(preset, isPortrait);
      const humanPlacement: PenPlacement[] = [
        {
          x: dims.width * 0.3,
          y: dims.height * 0.5,
          angle: 0,
        },
      ];

      // Test with custom pseudo-RNG for repeatability
      let seed = 123456;
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
        `Bot placement must be valid for ${preset.id} (${isPortrait ? 'portrait' : 'landscape'}), reason: ${val.reason}`
      );
    }
  }
});

test('generateRandomBotPlacement works for 3-player match with multiple existing pens', () => {
  const deskWidth = 1000;
  const deskHeight = 700;
  const existing: PenPlacement[] = [
    { x: 300, y: 350, angle: 0 },
    { x: 700, y: 350, angle: Math.PI / 2 },
  ];

  const botPlacement = generateRandomBotPlacement(
    existing,
    deskWidth,
    deskHeight,
    Math.random,
    2,
    3
  );

  const val = validatePlacement(botPlacement, existing, deskWidth, deskHeight);
  assert.equal(val.valid, true, `Bot 3 placement should be valid: ${val.reason}`);
});

test('getSuggestedPlacement returns valid inside positions for both players', () => {
  const deskWidth = 1040;
  const deskHeight = 640;

  const p1 = getSuggestedPlacement(0, 2, deskWidth, deskHeight);
  const p2 = getSuggestedPlacement(1, 2, deskWidth, deskHeight);

  assert.equal(isPenInsideTable(p1, p1.angle, deskWidth, deskHeight), true);
  assert.equal(isPenInsideTable(p2, p2.angle, deskWidth, deskHeight), true);

  const val = validatePlacement(p2, [p1], deskWidth, deskHeight);
  assert.equal(val.valid, true);
});
