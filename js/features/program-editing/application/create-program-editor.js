import {
  addProgramStep,
  clearProgram,
  clearProgramInsertPreview,
  createProgramEditorState,
  moveProgramStep,
  removeProgramStep,
  restoreProgramFromBlockTypes,
  setActiveProgramStep,
  setProgramInsertPreview
} from '../domain/program-editor.js';

export function createProgramEditor(initialAvailableBlockTypes = []) {
  let availableBlockTypes = [...initialAvailableBlockTypes];
  let state = createProgramEditorState();

  return {
    setAvailableBlockTypes(nextAvailableBlockTypes) {
      availableBlockTypes = Array.isArray(nextAvailableBlockTypes) ? [...nextAvailableBlockTypes] : [];
      state = clearProgram(state);
    },
    getProgramSteps() {
      return state.programSteps;
    },
    getProgramBlockTypes() {
      return state.programSteps.map((step) => step.blockType);
    },
    getPendingProgramInsertIndex() {
      return state.pendingProgramInsertIndex;
    },
    getPendingDraggedProgramStepId() {
      return state.pendingDraggedProgramStepId;
    },
    getPendingDraggedBlockType() {
      return state.pendingDraggedBlockType;
    },
    getActiveProgramStepId() {
      return state.activeProgramStepId;
    },
    reset() {
      state = clearProgram(state);
    },
    addProgramStep(blockType, insertIndex) {
      const result = addProgramStep(state, {
        blockType,
        insertIndex,
        availableBlockTypes
      });
      state = result.state;
      return result.added;
    },
    removeProgramStep(stepId) {
      const result = removeProgramStep(state, stepId);
      state = result.state;
      return result.removed;
    },
    moveProgramStep(stepId, insertIndex) {
      const result = moveProgramStep(state, stepId, insertIndex);
      state = result.state;
      return result.moved;
    },
    setProgramInsertPreview(insertIndex, draggedBlockType, draggedProgramStepId = null) {
      state = setProgramInsertPreview(state, insertIndex, draggedBlockType, draggedProgramStepId);
    },
    clearProgramInsertPreview() {
      state = clearProgramInsertPreview(state);
    },
    setActiveProgramStep(stepId) {
      state = setActiveProgramStep(state, stepId);
    },
    restoreProgram(blockTypes) {
      state = clearProgram(state);
      state = restoreProgramFromBlockTypes(state, blockTypes, availableBlockTypes);
      return state.programSteps.length > 0;
    }
  };
}
