import test from 'node:test';
import assert from 'node:assert/strict';
import { reportRuntimeError } from '../../../js/features/shell/index.js';

test('reportRuntimeError forwards unexpected errors through the logger port', () => {
  const entries = [];
  const logger = {
    error(entry) {
      entries.push(entry);
    }
  };

  reportRuntimeError(logger, {
    context: 'run.session',
    message: 'Synthetic test error'
  });

  assert.equal(entries.length, 1);
  assert.equal(entries[0].code, 'runtime.unexpected');
  assert.equal(entries[0].context, 'run.session');
  assert.equal(entries[0].message, 'Synthetic test error');
});

test('reportRuntimeError is a no-op when the logger port is unavailable', () => {
  assert.doesNotThrow(() => {
    reportRuntimeError(null, { context: 'missing.logger', message: 'ignored' });
    reportRuntimeError({}, { context: 'missing.error.method', message: 'ignored' });
  });
});
