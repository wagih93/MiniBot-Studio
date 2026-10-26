export function createAbortSignalDelay() {
  return function delay(milliseconds, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        const error = new Error('Execution cancelled');
        error.name = 'AbortError';
        reject(error);
        return;
      }

      const timeoutId = setTimeout(() => {
        if (signal) signal.removeEventListener('abort', handleAbort);
        resolve();
      }, milliseconds);

      function handleAbort() {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', handleAbort);
        const error = new Error('Execution cancelled');
        error.name = 'AbortError';
        reject(error);
      }

      if (signal) signal.addEventListener('abort', handleAbort, { once: true });
    });
  };
}
