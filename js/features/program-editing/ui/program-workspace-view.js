export function createProgramWorkspaceView({
  programWorkspaceElement,
  programListElement,
  programDemoElement,
  getProgramEditor,
  getBlockPresentation,
  deleteStepLabel,
  emptyProgramLabel,
  repeatBodyEmptyLabel,
  repeatCountTemplate,
  isRunInProgress,
  isFirstLevel,
  onInvalidDrop,
  onProgramChanged,
  onProgramRemoved,
  onProgramReordered,
  onAddToBody,
  onRemoveFromBody
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
    if (isContainerStep(step)) {
      return createContainerStepElement(step, activeProgramStepId);
    }
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

  function createContainerStepElement(step, activeProgramStepId) {
    const presentation = getBlockPresentation(step.blockType);
    const isBodyActive = Array.isArray(step.body) && step.body.some((s) => String(s.id) === String(activeProgramStepId));
    const stepElement = document.createElement('li');
    stepElement.classList.add('program-step', 'program-step--container', `program-step--${step.blockType}`);
    stepElement.dataset.stepId = String(step.id);
    stepElement.dataset.active = (isBodyActive || String(step.id) === String(activeProgramStepId)) ? 'true' : 'false';

    const headerEl = document.createElement('div');
    headerEl.classList.add('program-step__container-header');

    const iconEl = document.createElement('span');
    iconEl.classList.add('program-step__icon');
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = presentation.icon;

    const labelEl = document.createElement('span');
    labelEl.classList.add('program-step__label');
    if (step.blockType === 'repeat') {
      const count = Number.isInteger(step.repeatCount) ? step.repeatCount : 3;
      labelEl.textContent = (repeatCountTemplate ?? '').replace('{count}', String(count));
    } else {
      labelEl.textContent = presentation.label;
    }

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.classList.add('program-step__remove');
    removeBtn.setAttribute('aria-label', `${deleteStepLabel} ${presentation.label}`);
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => {
      if (getProgramEditor().removeProgramStep(step.id)) { onProgramRemoved(); }
      render();
    });

    headerEl.append(iconEl, labelEl, removeBtn);
    stepElement.append(headerEl);

    const bodyList = document.createElement('ul');
    bodyList.classList.add('program-step__body');
    if (!Array.isArray(step.body) || step.body.length === 0) {
      const empty = document.createElement('li');
      empty.classList.add('program-step__body-empty');
      empty.textContent = repeatBodyEmptyLabel ?? '';
      bodyList.append(empty);
    } else {
      for (const bodyStep of step.body) {
        const bodyPresentation = getBlockPresentation(bodyStep.blockType);
        const bodyEl = document.createElement('li');
        bodyEl.classList.add('program-step', 'program-step--body');
        bodyEl.dataset.stepId = String(bodyStep.id);
        bodyEl.dataset.active = String(bodyStep.id) === String(activeProgramStepId) ? 'true' : 'false';
        const bIcon = document.createElement('span');
        bIcon.classList.add('program-step__icon');
        bIcon.setAttribute('aria-hidden', 'true');
        bIcon.textContent = bodyPresentation.icon;
        const bLabel = document.createElement('span');
        bLabel.classList.add('program-step__label');
        bLabel.textContent = bodyPresentation.label;
        const bRemove = document.createElement('button');
        bRemove.type = 'button';
        bRemove.classList.add('program-step__remove');
        bRemove.setAttribute('aria-label', `${deleteStepLabel} ${bodyPresentation.label}`);
        bRemove.textContent = '✕';
        bRemove.addEventListener('click', () => {
          if (typeof onRemoveFromBody === 'function') onRemoveFromBody(step.id, bodyStep.id);
          render();
        });
        bodyEl.append(bIcon, bLabel, bRemove);
        bodyList.append(bodyEl);
      }
    }
    stepElement.append(bodyList);

    if (!isRunInProgress()) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.classList.add('program-step__add-to-body');
      addBtn.setAttribute('aria-label', '+');
      addBtn.textContent = '+';
      addBtn.addEventListener('click', () => {
        if (typeof onAddToBody === 'function') onAddToBody(step.id);
      });
      stepElement.append(addBtn);
    }
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

function isContainerStep(step) {
  return step?.blockType === 'repeat' || step?.blockType === 'if';
}
