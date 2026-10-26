import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlayerName } from './validation';

test('validatePlayerName accepts valid names', () => {
  const res = validatePlayerName('Tanvir', []);
  assert.equal(res.valid, true);
  assert.equal(res.cleanName, 'Tanvir');
  assert.equal(res.error, undefined);
});

test('validatePlayerName trims whitespace', () => {
  const res = validatePlayerName('   Rakib Hossain   ', []);
  assert.equal(res.valid, true);
  assert.equal(res.cleanName, 'Rakib Hossain');
});

test('validatePlayerName rejects empty or whitespace-only names', () => {
  const res1 = validatePlayerName('', [], 0);
  assert.equal(res1.valid, false);
  assert.ok(res1.error?.includes('empty'));

  const res2 = validatePlayerName('     ', [], 1);
  assert.equal(res2.valid, false);
  assert.ok(res2.error?.includes('empty'));
});

test('validatePlayerName limits length to 18 characters', () => {
  const longName = 'ThisNameIsWayTooLongForMatch';
  const res = validatePlayerName(longName, []);
  assert.equal(res.valid, false);
  assert.ok(res.error?.includes('18'));
});

test('validatePlayerName rejects control characters', () => {
  const badName = 'Player\x00One';
  const res = validatePlayerName(badName, []);
  assert.equal(res.valid, false);
  assert.ok(res.error?.includes('control'));
});

test('validatePlayerName detects duplicate names gracefully', () => {
  const res = validatePlayerName('Shanto', ['Shanto']);
  assert.equal(res.valid, false);
  assert.ok(res.error?.includes('already used'));

  // Case insensitive check
  const resCase = validatePlayerName('shanto', ['SHANTO']);
  assert.equal(resCase.valid, false);
});
