import test from 'node:test';
import assert from 'node:assert/strict';
import { registerOfflineSupport } from '../../../js/features/offline/index.js';

test('registerOfflineSupport returns unsupported when service workers are unavailable', async () => {
  const warnings = [];
  const result = await registerOfflineSupport({
    serviceWorkerContainer: undefined,
    logger: {
      warn(message) {
        warnings.push(message);
      }
    }
  });

  assert.deepEqual(result, {
    registered: false,
    reason: 'unsupported'
  });
  assert.equal(warnings.length, 0);
});

test('registerOfflineSupport registers the default service worker path', async () => {
  const registrations = [];
  const expectedRegistration = { scope: '/' };
  const result = await registerOfflineSupport({
    serviceWorkerContainer: {
      async register(path) {
        registrations.push(path);
        return expectedRegistration;
      }
    }
  });

  assert.deepEqual(registrations, ['/service-worker.js']);
  assert.deepEqual(result, {
    registered: true,
    registration: expectedRegistration
  });
});

test('registerOfflineSupport logs and returns a failure result when registration throws', async () => {
  const registrationError = new Error('registration blocked');
  const warnings = [];
  const result = await registerOfflineSupport({
    serviceWorkerContainer: {
      async register() {
        throw registrationError;
      }
    },
    logger: {
      warn(message, error) {
        warnings.push({ message, error });
      }
    }
  });

  assert.equal(result.registered, false);
  assert.equal(result.reason, 'registration-failed');
  assert.equal(result.error, registrationError);
  assert.deepEqual(warnings, [{
    message: 'Failed to register offline support service worker.',
    error: registrationError
  }]);
});
