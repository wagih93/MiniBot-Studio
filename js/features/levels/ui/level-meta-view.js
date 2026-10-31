export function createLevelMetaView({
  levelHintElement,
  hintButtonElement,
  objectiveConditionElement,
  collectionSummaryElement,
  sensorStateElement,
  levelIndicatorElement,
  labels,
  playableLevelIds,
  getCollectedCollectibleCount
}) {
  let currentHintSteps = [labels.defaultHint];
  let currentHintIndex = 0;

  function setHintText(hintText) {
    levelHintElement.textContent = `${labels.hintPrefix} ${hintText}`;
  }

  function setHintControlState() {
    const hasHintSteps = currentHintSteps.length > 0;
    hintButtonElement.hidden = !hasHintSteps;
    hintButtonElement.disabled = !hasHintSteps;
  }

  function render(level) {
    const levelHints = Array.isArray(level.hints)
      ? level.hints.filter((hint) => typeof hint === 'string' && hint.length > 0)
      : [];

    currentHintSteps = levelHints.length > 0 ? levelHints : [labels.defaultHint];
    currentHintIndex = 0;
    setHintText(currentHintSteps[currentHintIndex]);
    setHintControlState();

    const needsAll = Boolean(level.successConditions.collectAllCollectibles);
    if (level.mode === 'freePlay') {
      objectiveConditionElement.textContent = `${labels.successPrefix} ${labels.freePlaySuccess}`;
      return;
    }

    objectiveConditionElement.textContent = needsAll
      ? labels.defaultSuccess
      : `${labels.successPrefix} ${labels.reachGoalSuccess}`;
  }

  function showNextHint({ speakHint } = {}) {
    if (currentHintSteps.length === 0) {
      setHintText(labels.defaultHint);
      return { hintText: labels.defaultHint, wasSpoken: false, hasMore: false };
    }

    if (currentHintIndex < currentHintSteps.length - 1) {
      currentHintIndex += 1;
    }

    const hintText = currentHintSteps[currentHintIndex];
    setHintText(hintText);
    const wasSpoken = typeof speakHint === 'function' ? speakHint(hintText) === true : false;

    return {
      hintText,
      wasSpoken,
      hasMore: currentHintIndex < currentHintSteps.length - 1
    };
  }

  function updateLevelIndicator(levelId) {
    const index = playableLevelIds.indexOf(levelId);
    levelIndicatorElement.textContent = index >= 0
      ? labels.levelIndicatorTemplate.replace('{current}', String(index + 1)).replace('{total}', String(playableLevelIds.length))
      : labels.levelIndicatorTemplate.replace('{current}', '1').replace('{total}', String(playableLevelIds.length));
  }

  function updateCollectionSummary(objectiveProgress) {
    const count = getCollectedCollectibleCount(objectiveProgress);
    collectionSummaryElement.textContent = `${labels.collectionPrefix} ${count}/${objectiveProgress.totalCollectibles}`;
  }

  function updateSensorState(sensorState) {
    if (!sensorStateElement) {
      return;
    }

    const sensorLabel = sensorState === 'blocked'
      ? labels.sensorBlocked
      : labels.sensorClear;
    sensorStateElement.textContent = `${labels.sensorPrefix} ${sensorLabel}`;
  }

  return { render, showNextHint, updateLevelIndicator, updateCollectionSummary, updateSensorState };
}
