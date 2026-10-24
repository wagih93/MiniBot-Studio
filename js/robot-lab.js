const statusElement = document.querySelector('#status');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop-button');
const resetButton = document.querySelector('#reset-button');

let activeRunToken = 0;

const statusByState = {
  idle: 'الحالة: جاهز',
  running: 'الحالة: الروبوت يتحرك',
  stopped: 'الحالة: تم الإيقاف',
  complete: 'الحالة: اكتمل التشغيل',
  reset: 'الحالة: تمت الإعادة'
};

function setStatus(state) {
  statusElement.dataset.state = state;
  statusElement.textContent = statusByState[state];
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runRobotSession(runToken) {
  setStatus('running');
  await delay(120);
  if (runToken !== activeRunToken) {
    return;
  }
  setStatus('complete');
}

playButton.addEventListener('click', () => {
  activeRunToken += 1;
  void runRobotSession(activeRunToken);
});

stopButton.addEventListener('click', () => {
  activeRunToken += 1;
  setStatus('stopped');
});

resetButton.addEventListener('click', () => {
  activeRunToken += 1;
  setStatus('reset');
});

setStatus('idle');
