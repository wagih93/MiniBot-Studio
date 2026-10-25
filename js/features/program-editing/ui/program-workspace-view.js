export function createProgramWorkspaceView({
  programWorkspaceElement,
  programListElement,
  programDemoElement,
  getProgramEditor,
  getBlockPresentation,
  deleteStepLabel,
  emptyProgramLabel,
  isRunInProgress,
  isFirstLevel,
  onInvalidDrop,
  onProgramChanged,
  onProgramRemoved,
  onProgramReordered
}) {
  function render() {
    const stepElements = [];
    const programEditor = getProgramEditor();
    const programSteps = programEditor.getProgramSteps();
    const pendingProgramInsertIndex = programEditor.getPendingProgramInsertIndex();
    const activeProgramStepId = programEditor.getActiveProgramStepId();

    if (programSteps.length === 0 && pendingProgramInsertIndex === null) {
      const emptyStateElement = document.createElement('li');
      emptyStateElement.classList.add('program-empty');
      emptyStateElement.textContent = emptyProgramLabel;
      stepElements.push(emptyStateElement);
    } else {
      for (let index = 0; index < programSteps.length; index += 1) {
        if (pendingProgramInsertIndex === index) {
          stepElements.push(createPlaceholderElement());
        }

        const step = programSteps[index];
        const stepElement = createStepElement(step, activeProgramStepId);
        stepElements.push(stepElement);
      }

      if (pendingProgramInsertIndex === programSteps.length) {
        stepElements.push(createPlaceholderElement());
      }
    }

    programListElement.replaceChildren(...stepElements);
    for (const removeButton of programListElement.querySelectorAll('.program-step__remove')) {
      removeButton.disabled = isRunInProgress();
    }

    programDemoElement.hidden = !(isFirstLevel() && programSteps.length === 0);
  }

  function attachInteractions() {
    programWorkspaceElement.addEventListener('dragover', (event) => {
      if (isRunInProgress()) {
        return;
      }

      const programEditor = getProgramEditor();
      const draggedProgramStepId =
        event.dataTransfer?.getData('application/x-program-step-id') ||
        programEditor.getPendingDraggedProgramStepId();
      const draggedBlockType =
        event.dataTransfer?.getData('text/plain') || programEditor.getPendingDraggedBlockType();
      if (!draggedProgramStepId && !draggedBlockType) {
        return;
      }

      event.preventDefault();
      const insertIndex = getProgramInsertIndex(event.clientY);
      programEditor.setProgramInsertPreview(insertIndex, draggedBlockType || null, draggedProgramStepId || null);
      render();
    });

    programWorkspaceElement.addEventListener('dragleave', (event) => {
      if (event.relatedTarget && programWorkspaceElement.contains(event.relatedTarget)) {
        return;
      }

      getProgramEditor().clearProgramInsertPreview();
      render();
    });

    programWorkspaceElement.addEventListener('drop', (event) => {
      event.preventDefault();
      if (isRunInProgress()) {
        getProgramEditor().clearProgramInsertPreview();
        render();
        return;
      }

      const programEditor = getProgramEditor();
      const droppedProgramStepId =
        event.dataTransfer?.getData('application/x-program-step-id') ||
        programEditor.getPendingDraggedProgramStepId();
      const droppedBlockType =
        event.dataTransfer?.getData('text/plain') || programEditor.getPendingDraggedBlockType();
      const insertIndex = programEditor.getPendingProgramInsertIndex() ?? programEditor.getProgramSteps().length;

      if (droppedProgramStepId) {
        const wasMoved = programEditor.moveProgramStep(droppedProgramStepId, insertIndex);
        if (wasMoved) {
          onProgramReordered();
        } else {
          onInvalidDrop();
          programEditor.clearProgramInsertPreview();
        }
        render();
        return;
      }

      if (!droppedBlockType) {
        onInvalidDrop();
        programEditor.clearProgramInsertPreview();
        render();
        return;
      }

      const wasAdded = programEditor.addProgramStep(droppedBlockType, insertIndex);
      if (wasAdded) {
        onProgramChanged();
      } else {
        onInvalidDrop();
        programEditor.clearProgramInsertPreview();
      }
      render();
    });
  }

  function createStepElement(step, activeProgramStepId) {
    const presentation = getBlockPresentation(step.blockType);
    const stepElement = document.createElement('li');
    stepElement.classList.add('program-step');
    stepElement.dataset.stepId = String(step.id);
    stepElement.dataset.active = String(step.id) === String(activeProgramStepId) ? 'true' : 'false';
    stepElement.draggable = true;

    const iconElement = document.createElement('span');
    iconElement.classList.add('program-step__icon');
    iconElement.setAttribute('aria-hidden', 'true');
    iconElement.textContent = presentation.icon;

    const labelElement = document.createElement('span');
    labelElement.classList.add('program-step__label');
    labelElement.textContent = presentation.label;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.classList.add('program-step__remove');
    removeButton.setAttribute('aria-label', `${deleteStepLabel} ${presentation.label}`);
    removeButton.textContent = '✕';
    removeButton.addEventListener('click', () => {
      const wasRemoved = getProgramEditor().removeProgramStep(step.id);
      if (wasRemoved) {
        onProgramRemoved();
      }
      render();
    });

    stepElement.addEventListener('dragstart', (event) => {
      getProgramEditor().setProgramInsertPreview(
        getProgramEditor().getPendingProgramInsertIndex(),
        null,
        String(step.id)
      );
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-program-step-id', String(step.id));
      }
    });

    stepElement.addEventListener('dragend', () => {
      getProgramEditor().clearProgramInsertPreview();
      render();
    });

    stepElement.append(iconElement, labelElement, removeButton);
    return stepElement;
  }

  function createPlaceholderElement() {
    const placeholderElement = document.createElement('li');
    placeholderElement.classList.add('program-placeholder');
    placeholderElement.setAttribute('aria-hidden', 'true');
    return placeholderElement;
  }

  function getProgramInsertIndex(clientY) {
    const stepElements = Array.from(programListElement.querySelectorAll('.program-step'));
    if (stepElements.length === 0) {
      return 0;
    }

    for (let index = 0; index < stepElements.length; index += 1) {
      const rect = stepElements[index].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return index;
      }
    }

    return stepElements.length;
  }

  return {
    attachInteractions,
    render
  };
}
