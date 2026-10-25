const defaultExecutionOverrides = Object.freeze({});

const defaultRuntimeConfig = Object.freeze({
  initialLevelId: 'level-001',
  executionOverrides: defaultExecutionOverrides
});

function parseOptionalBoundedInteger(value, min, max) {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsedValue = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsedValue)) {
    return undefined;
  }

  if (parsedValue < min || parsedValue > max) {
    return undefined;
  }

  return parsedValue;
}

export function createRuntimeConfig(overrides = {}) {
  const initialLevelId = typeof overrides.initialLevelId === 'string' && overrides.initialLevelId.length > 0
    ? overrides.initialLevelId
    : defaultRuntimeConfig.initialLevelId;
  const executionOverrides = overrides.executionOverrides ?? {};

  const maximumStepsPerRun = parseOptionalBoundedInteger(executionOverrides.maximumStepsPerRun, 1, 300);
  const selectedBlockRepeatCount = parseOptionalBoundedInteger(
    executionOverrides.selectedBlockRepeatCount,
    1,
    300
  );
  const stepDelayMilliseconds = parseOptionalBoundedInteger(
    executionOverrides.stepDelayMilliseconds,
    0,
    500
  );
  const normalizedExecutionOverrides = {
    ...(maximumStepsPerRun === undefined ? {} : { maximumStepsPerRun }),
    ...(selectedBlockRepeatCount === undefined ? {} : { selectedBlockRepeatCount }),
    ...(stepDelayMilliseconds === undefined ? {} : { stepDelayMilliseconds })
  };

  return Object.freeze({
    initialLevelId,
    executionOverrides: Object.freeze(normalizedExecutionOverrides)
  });
}

export function createDefaultRuntimeConfig() {
  return defaultRuntimeConfig;
}
