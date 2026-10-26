import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionStatusView } from '../../../js/features/program-execution/index.js';

function makeElement(init = {}) {
  return {
    dataset: {}, textContent: '',
    setAttribute() {},
    ...init
  };
}

const labels = {
  idle: 'الحالة: جاهز',
  running: 'الحالة: الروبوت يتحرك',
  stopped: 'الحالة: تم الإيقاف',
  blockSelectedPrefix: 'الحالة: تم اختيار'
};

test('createExecutionStatusView sets dataset.state and textContent on setStatus', () => {
  const statusElement = makeElement();
  const view = createExecutionStatusView({ statusElement, labels });
  view.setStatus('idle');
  assert.equal(statusElement.dataset.state, 'idle');
  assert.equal(statusElement.textContent, labels.idle);
});

test('createExecutionStatusView setStatus with unknown state uses state as text', () => {
  const statusElement = makeElement();
  const view = createExecutionStatusView({ statusElement, labels });
  view.setStatus('unknownState');
  assert.equal(statusElement.dataset.state, 'unknownState');
  assert.equal(statusElement.textContent, 'unknownState');
});

test('createExecutionStatusView setBlockSelected sets idle state with label prefix', () => {
  const statusElement = makeElement();
  const view = createExecutionStatusView({ statusElement, labels });
  view.setBlockSelected('تقدّم خطوة');
  assert.equal(statusElement.dataset.state, 'idle');
  assert.ok(statusElement.textContent.includes('تقدّم خطوة'));
});
