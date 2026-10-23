import test from 'node:test';
import assert from 'node:assert';
import {
  createNewSeries,
  commitSeriesMatchResult,
} from './seriesState';

test('Series initializes with 0 wins and 5 match slots', () => {
  const p1 = { id: 'p1', name: 'Player 1' };
  const p2 = { id: 'p2', name: 'Backbench Boss' };
  const series = createNewSeries(p1, p2, 'bo5');

  assert.strictEqual(series.format, 'bo5');
  assert.strictEqual(series.targetWins, 3);
  assert.strictEqual(series.player1.wins, 0);
  assert.strictEqual(series.player2.wins, 0);
  assert.strictEqual(series.currentSlot, 1);
  assert.strictEqual(series.isComplete, false);
  assert.strictEqual(series.slots.length, 5);
});

test('Drawn matches award no points and trigger a pending draw-replay in that slot', () => {
  const p1 = { id: 'p1', name: 'Player 1' };
  const p2 = { id: 'p2', name: 'Backbench Boss' };
  const series = createNewSeries(p1, p2, 'bo5');

  const { updatedSeries } = commitSeriesMatchResult(
    series,
    'match_slot1_initial',
    null,
    null
  );

  assert.strictEqual(updatedSeries.player1.wins, 0);
  assert.strictEqual(updatedSeries.player2.wins, 0);
  assert.strictEqual(updatedSeries.totalDraws, 1);
  assert.strictEqual(updatedSeries.currentSlot, 1);
  assert.strictEqual(updatedSeries.pendingDrawReplay, true);
  assert.strictEqual(updatedSeries.isComplete, false);
});

test('Decisive win clears draw replay, records win, and advances slot', () => {
  const p1 = { id: 'p1', name: 'Player 1' };
  const p2 = { id: 'p2', name: 'Backbench Boss' };
  const series = createNewSeries(p1, p2, 'bo5');

  const { updatedSeries } = commitSeriesMatchResult(
    series,
    'match_slot1_decisive',
    'p1',
    'Player 1'
  );

  assert.strictEqual(updatedSeries.player1.wins, 1);
  assert.strictEqual(updatedSeries.player2.wins, 0);
  assert.strictEqual(updatedSeries.pendingDrawReplay, false);
  assert.strictEqual(updatedSeries.currentSlot, 2);
  assert.strictEqual(updatedSeries.isComplete, false);
});

test('Reaching 3 wins concludes series as champion', () => {
  const p1 = { id: 'p1', name: 'Player 1' };
  const p2 = { id: 'p2', name: 'Backbench Boss' };
  let series = createNewSeries(p1, p2, 'bo5');

  series = commitSeriesMatchResult(series, 'm1', 'p1', 'Player 1').updatedSeries;
  series = commitSeriesMatchResult(series, 'm2', 'p2', 'Backbench Boss').updatedSeries;
  series = commitSeriesMatchResult(series, 'm3', 'p1', 'Player 1').updatedSeries;
  series = commitSeriesMatchResult(series, 'm4', 'p1', 'Player 1').updatedSeries;

  assert.strictEqual(series.player1.wins, 3);
  assert.strictEqual(series.player2.wins, 1);
  assert.strictEqual(series.isComplete, true);
  assert.strictEqual(series.championId, 'p1');
  assert.strictEqual(series.championName, 'Player 1');
});

test('Idempotency prevents duplicate win allocation on same matchInstanceId', () => {
  const p1 = { id: 'p1', name: 'Player 1' };
  const p2 = { id: 'p2', name: 'Backbench Boss' };
  const series = createNewSeries(p1, p2, 'bo5');

  const { updatedSeries: s1, wasNew: firstTime } = commitSeriesMatchResult(
    series,
    'dup_match_123',
    'p1',
    'Player 1'
  );
  assert.strictEqual(firstTime, true);
  assert.strictEqual(s1.player1.wins, 1);

  // Calling again with same ID
  const { updatedSeries: s2, wasNew: secondTime } = commitSeriesMatchResult(
    s1,
    'dup_match_123',
    'p1',
    'Player 1'
  );
  assert.strictEqual(secondTime, false);
  assert.strictEqual(s2.player1.wins, 1); // Not 2!
});
