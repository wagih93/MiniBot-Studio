const DEFAULT_SERVICE_WORKER_PATH = '/service-worker.js';

function isServiceWorkerSupported(serviceWorkerContainer) {
  return Boolean(serviceWorkerContainer) && typeof serviceWorkerContainer.register === 'function';
}

export async function registerOfflineSupport({
  serviceWorkerContainer = globalThis.navigator?.serviceWorker,
  serviceWorkerPath = DEFAULT_SERVICE_WORKER_PATH,
  logger = globalThis.console
} = {}) {
  if (!isServiceWorkerSupported(serviceWorkerContainer)) {
    return {
      registered: false,
      reason: 'unsupported'
    };
  }

  try {
    const registration = await serviceWorkerContainer.register(serviceWorkerPath);
    return {
      registered: true,
      registration
    };
  } catch (error) {
    if (logger && typeof logger.warn === 'function') {
      logger.warn('Failed to register offline support service worker.', error);
    }

    return {
      registered: false,
      reason: 'registration-failed',
      error
    };
  }
}
