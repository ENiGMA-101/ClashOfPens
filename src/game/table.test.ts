import test from 'node:test';
import assert from 'node:assert';
import {
  TABLE_PRESETS,
  getTableConfig,
  resolveTableDimensions,
  getTableSpawnPositions,
} from './tableConfig';

test('Table presets include School Bench, square, practice small, and championship', () => {
  const ids = TABLE_PRESETS.map((t) => t.id);
  assert.ok(ids.includes('school_bench'), 'Must include school_bench');
  assert.ok(ids.includes('square_table'), 'Must include square_table');
  assert.ok(ids.includes('practice_small'), 'Must include practice_small');
  assert.ok(ids.includes('championship_table'), 'Must include championship_table');
  assert.ok(ids.includes('custom_table'), 'Must include custom_table');

  const defaultTable = getTableConfig('school_bench');
  assert.strictEqual(defaultTable.name, 'School Bench');
  assert.strictEqual(defaultTable.baseWidth, 1200);
  assert.strictEqual(defaultTable.baseHeight, 650);

  // large_rectangle legacy alias resolves to school_bench
  const legacyTable = getTableConfig('large_rectangle');
  assert.strictEqual(legacyTable.name, 'School Bench');
});

test('Square table preserves 1:1 aspect ratio in both portrait and landscape', () => {
  const square = getTableConfig('square_table');
  const portraitDims = resolveTableDimensions(square, true);
  const landscapeDims = resolveTableDimensions(square, false);

  assert.strictEqual(portraitDims.width, portraitDims.height);
  assert.strictEqual(landscapeDims.width, landscapeDims.height);
  assert.strictEqual(portraitDims.width, 780);
});

test('School Bench maintains landscape rectangular aspect ratio without vertical swap', () => {
  const bench = getTableConfig('school_bench');
  const dims = resolveTableDimensions(bench, true);
  assert.strictEqual(dims.width, 1200);
  assert.strictEqual(dims.height, 650);
  assert.ok(dims.width > dims.height, 'School bench must remain wider than tall');
});

test('Custom table respects safe bounds', () => {
  const custom = getTableConfig('custom_table', { width: 300, height: 1600 });
  // clamped between 500 and 1350 for width, 450 and 1000 for height
  assert.strictEqual(custom.baseWidth, 500);
  assert.strictEqual(custom.baseHeight, 1000);
});

test('Spawn positions for 2 players place pens symmetrically across the table', () => {
  const spawns = getTableSpawnPositions(1200, 650, 2, false);
  assert.strictEqual(spawns.length, 2);
  assert.ok(spawns[0].x < 600);
  assert.ok(spawns[1].x > 600);
  assert.strictEqual(spawns[0].y, 325);
  assert.strictEqual(spawns[1].y, 325);
});
