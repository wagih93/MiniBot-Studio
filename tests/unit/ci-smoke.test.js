import test from 'node:test';
import assert from 'node:assert/strict';

test('ci baseline smoke test passes', () => {
  assert.equal(2 + 2, 4);
});
