export function createLevelMetaView({
  levelHintElement,
  objectiveConditionElement,
  collectionSummaryElement,
  levelIndicatorElement,
  labels,
  playableLevelIds,
  getCollectedCollectibleCount
}) {
  function render(level) {
    const firstHint = level.hints[0] ?? labels.defaultHint;
    levelHintElement.textContent = `${labels.hintPrefix} ${firstHint}`;
    const needsAll = Boolean(level.successConditions.collectAllCollectibles);
    objectiveConditionElement.textContent = needsAll
      ? labels.defaultSuccess
      : `${labels.successPrefix} ${labels.reachGoalSuccess}`;
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

  return { render, updateLevelIndicator, updateCollectionSummary };
}

