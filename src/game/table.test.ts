import test from 'node:test';
import assert from 'node:assert';
import {
  TABLE_PRESETS,
  getTableConfig,
  resolveTableDimensions,
  getTableSpawnPositions,
} from './tableConfig';

test('Table presets include large rectangle, square, practice small, and championship', () => {
  const ids = TABLE_PRESETS.map((t) => t.id);
  assert.ok(ids.includes('large_rectangle'), 'Must include large_rectangle');
  assert.ok(ids.includes('square_table'), 'Must include square_table');
  assert.ok(ids.includes('practice_small'), 'Must include practice_small');
  assert.ok(ids.includes('championship_table'), 'Must include championship_table');
  assert.ok(ids.includes('custom_table'), 'Must include custom_table');
});

test('Square table preserves 1:1 aspect ratio in both portrait and landscape', () => {
  const square = getTableConfig('square_table');
  const portraitDims = resolveTableDimensions(square, true);
  const landscapeDims = resolveTableDimensions(square, false);

  assert.strictEqual(portraitDims.width, portraitDims.height);
  assert.strictEqual(landscapeDims.width, landscapeDims.height);
  assert.strictEqual(portraitDims.width, 780);
});

test('Custom table respects safe bounds', () => {
  const custom = getTableConfig('custom_table', { width: 300, height: 1600 });
  // clamped between 500 and 1250
  assert.strictEqual(custom.baseWidth, 500);
  assert.strictEqual(custom.baseHeight, 1250);
});

test('Spawn positions for 2 players place pens symmetrically across the table', () => {
  const spawns = getTableSpawnPositions(1000, 600, 2, false);
  assert.strictEqual(spawns.length, 2);
  assert.ok(spawns[0].x < 500);
  assert.ok(spawns[1].x > 500);
  assert.strictEqual(spawns[0].y, 300);
  assert.strictEqual(spawns[1].y, 300);
});
