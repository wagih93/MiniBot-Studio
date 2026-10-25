export function createProgramEditorState({
  programSteps = [],
  nextProgramStepId = 1,
  pendingDraggedBlockType = null,
  pendingDraggedProgramStepId = null,
  pendingProgramInsertIndex = null,
  activeProgramStepId = null
} = {}) {
  return {
    programSteps: [...programSteps],
    nextProgramStepId,
    pendingDraggedBlockType,
    pendingDraggedProgramStepId,
    pendingProgramInsertIndex,
    activeProgramStepId
  };
}

export function clearProgram(state) {
  return {
    ...state,
    programSteps: [],
    nextProgramStepId: 1,
    pendingDraggedBlockType: null,
    pendingDraggedProgramStepId: null,
    pendingProgramInsertIndex: null,
    activeProgramStepId: null
  };
}

export function setActiveProgramStep(state, stepId) {
  return {
    ...state,
    activeProgramStepId: stepId
  };
}

export function setProgramInsertPreview(state, insertIndex, draggedBlockType, draggedProgramStepId = null) {
  return {
    ...state,
    pendingProgramInsertIndex: insertIndex,
    pendingDraggedBlockType: draggedBlockType,
    pendingDraggedProgramStepId: draggedProgramStepId
  };
}

export function clearProgramInsertPreview(state) {
  return {
    ...state,
    pendingProgramInsertIndex: null,
    pendingDraggedBlockType: null,
    pendingDraggedProgramStepId: null
  };
}

export function addProgramStep(state, { blockType, insertIndex, availableBlockTypes }) {
  if (!isAvailableBlockType(blockType, availableBlockTypes)) {
    return { state, added: false };
  }

  const normalizedInsertIndex = normalizeInsertIndex(insertIndex, state.programSteps.length);
  const newStep = { id: state.nextProgramStepId, blockType };
  const nextProgramSteps = [...state.programSteps];
  nextProgramSteps.splice(normalizedInsertIndex, 0, newStep);

  return {
    state: {
      ...state,
      programSteps: nextProgramSteps,
      nextProgramStepId: state.nextProgramStepId + 1,
      pendingProgramInsertIndex: null,
      pendingDraggedBlockType: null,
      pendingDraggedProgramStepId: null
    },
    added: true
  };
}

export function removeProgramStep(state, stepId) {
  const stepIndex = state.programSteps.findIndex((step) => String(step.id) === String(stepId));
  if (stepIndex < 0) {
    return { state, removed: false };
  }

  const nextProgramSteps = [...state.programSteps];
  nextProgramSteps.splice(stepIndex, 1);
  return {
    state: {
      ...state,
      programSteps: nextProgramSteps
    },
    removed: true
  };
}

export function moveProgramStep(state, stepId, insertIndex) {
  const sourceIndex = state.programSteps.findIndex((step) => String(step.id) === String(stepId));
  if (sourceIndex < 0) {
    return { state, moved: false };
  }

  const nextProgramSteps = [...state.programSteps];
  const [stepToMove] = nextProgramSteps.splice(sourceIndex, 1);
  const normalizedInsertIndex = normalizeInsertIndex(insertIndex, nextProgramSteps.length);
  nextProgramSteps.splice(normalizedInsertIndex, 0, stepToMove);

  return {
    state: {
      ...state,
      programSteps: nextProgramSteps,
      pendingProgramInsertIndex: null,
      pendingDraggedProgramStepId: null
    },
    moved: true
  };
}

export function restoreProgramFromBlockTypes(state, blockTypes, availableBlockTypes) {
  const filteredBlockTypes = Array.isArray(blockTypes)
    ? blockTypes.filter((blockType) => isAvailableBlockType(blockType, availableBlockTypes))
    : [];

  const nextProgramSteps = filteredBlockTypes.map((blockType, index) => ({
    id: state.nextProgramStepId + index,
    blockType
  }));

  return {
    ...state,
    programSteps: nextProgramSteps,
    nextProgramStepId: state.nextProgramStepId + nextProgramSteps.length
  };
}

function normalizeInsertIndex(insertIndex, listLength) {
  if (!Number.isInteger(insertIndex)) {
    return listLength;
  }

  if (insertIndex < 0) {
    return 0;
  }

  if (insertIndex > listLength) {
    return listLength;
  }

  return insertIndex;
}

function isAvailableBlockType(blockType, availableBlockTypes) {
  return Array.isArray(availableBlockTypes) && availableBlockTypes.includes(blockType);
}
