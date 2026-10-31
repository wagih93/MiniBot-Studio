export const robotDesignOptions = Object.freeze(['classic', 'explorer', 'turbo']);
export const robotColorOptions = Object.freeze(['blue', 'green', 'purple']);

export const defaultRobotAppearance = Object.freeze({
  design: robotDesignOptions[0],
  color: robotColorOptions[0]
});

function normalizeOption(option, validOptions, fallbackValue) {
  return validOptions.includes(option) ? option : fallbackValue;
}

export function normalizeRobotAppearance(appearance) {
  const candidate = appearance && typeof appearance === 'object' ? appearance : {};
  return {
    design: normalizeOption(candidate.design, robotDesignOptions, defaultRobotAppearance.design),
    color: normalizeOption(candidate.color, robotColorOptions, defaultRobotAppearance.color)
  };
}
