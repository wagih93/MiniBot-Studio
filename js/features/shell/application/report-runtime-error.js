export function reportRuntimeError(logger, errorContext) {
  if (!logger || typeof logger.error !== 'function') {
    return;
  }

  logger.error({
    code: 'runtime.unexpected',
    ...errorContext
  });
}
