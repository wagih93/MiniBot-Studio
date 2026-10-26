export function createBlockToolboxView({
  blockListElement,
  labels,
  programEditor,
  isRunInProgress,
  onBlockSelected,
  onTouchAdd
}) {
  let blockButtons = [];

  function getSelectedBlockType() {
    for (const button of blockButtons) {
      if (button.dataset.selected === 'true') return button.dataset.blockType;
    }
    return null;
  }

  function clearSelection() {
    for (const button of blockButtons) button.dataset.selected = 'false';
  }

  function setEnabled(enabled) {
    for (const button of blockButtons) button.disabled = !enabled;
  }

  function createButton(blockType) {
    const blockLabel = labels.labelsByType[blockType] ?? blockType;
    const blockIcon = labels.iconsByType?.[blockType] ?? '⬜';
    let lastPointerType = 'mouse';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `block-${blockType}`;
    button.classList.add('block-item', `block-item--${blockType}`);
    button.draggable = true;
    button.dataset.label = blockLabel;
    button.dataset.blockType = blockType;
    button.setAttribute('aria-label', blockLabel);
    button.dataset.selected = 'false';

    const icon = document.createElement('span');
    icon.classList.add('block-item__icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = blockIcon;

    const label = document.createElement('span');
    label.classList.add('block-item__label');
    label.textContent = blockLabel;

    button.append(icon, label);

    button.addEventListener('pointerdown', (e) => { lastPointerType = e.pointerType; });
    button.addEventListener('click', () => {
      clearSelection();
      button.dataset.selected = 'true';
      onBlockSelected(blockType, blockLabel);
      if (lastPointerType === 'touch') onTouchAdd(blockType);
    });
    button.addEventListener('dragstart', (e) => {
      programEditor.setProgramInsertPreview(programEditor.getPendingProgramInsertIndex(), blockType, null);
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', blockType); }
    });
    button.addEventListener('dragend', () => { programEditor.clearProgramInsertPreview(); });

    return button;
  }

  function render(availableBlocks) {
    programEditor.setAvailableBlockTypes(availableBlocks);
    blockButtons = availableBlocks.map((blockType) => createButton(blockType));
    blockListElement.replaceChildren(...blockButtons);
  }

  return { render, getSelectedBlockType, clearSelection, setEnabled };
}
