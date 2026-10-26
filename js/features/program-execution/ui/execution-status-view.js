export function createExecutionStatusView({ statusElement, labels }) {
  function setStatus(state) {
    statusElement.dataset.state = state;
    statusElement.textContent = labels[state] ?? state;
  }

  function setBlockSelected(blockLabel) {
    statusElement.dataset.state = 'idle';
    statusElement.textContent = `${labels.blockSelectedPrefix} ${blockLabel}`;
  }

  return { setStatus, setBlockSelected };
}

