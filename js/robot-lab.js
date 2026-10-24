import { arStrings } from './i18n/ar.js';

const statusElement = document.querySelector('#status');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop-button');
const resetButton = document.querySelector('#reset-button');

document.title = arStrings.pageTitle;
document.querySelector('#app-heading').textContent = arStrings.heading;
document.querySelector('#level-indicator').textContent = arStrings.levelIndicator;
document.querySelector('#start-button').textContent = arStrings.primaryActions.start;
document.querySelector('#continue-button').textContent = arStrings.primaryActions.continue;
document.querySelector('#parents-button').textContent = arStrings.primaryActions.parents;
document.querySelector('#movement-heading').textContent = arStrings.movementGuideHeading;
document.querySelector('#move-forward-label').textContent = arStrings.movement.forward;
document.querySelector('#turn-right-label').textContent = arStrings.movement.right;
document.querySelector('#turn-left-label').textContent = arStrings.movement.left;
playButton.textContent = arStrings.controls.play;
stopButton.textContent = arStrings.controls.stop;
resetButton.textContent = arStrings.controls.reset;

let activeRunToken = 0;

const statusByState = arStrings.status;

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
