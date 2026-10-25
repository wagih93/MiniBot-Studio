export function createConsoleLogger() {
  return Object.freeze({
    warn(entry) {
      console.warn('[MiniBot Studio]', entry);
    },
    error(entry) {
      console.error('[MiniBot Studio]', entry);
    }
  });
}
