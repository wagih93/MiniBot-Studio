import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudioFeedback } from '../../../js/features/shell/index.js';

function createAudioContextStub() {
  return {
    currentTime: 1,
    destination: {},
    closed: false,
    createOscillator() {
      return {
        type: 'sine',
        frequency: {
          setValueAtTime() {}
        },
        connect() {},
        start() {},
        stop() {},
        onended: null
      };
    },
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {}
        },
        connect() {}
      };
    },
    close() {
      this.closed = true;
    }
  };
}

test('createAudioFeedback plays sound effects only when enabled and outside cooldown', () => {
  const loggerEntries = [];
  let now = 1000;
  let audioContextCallCount = 0;

  const audioFeedback = createAudioFeedback({
    readLogger: () => ({
      warn(entry) {
        loggerEntries.push(entry);
      }
    }),
    now: () => now,
    createAudioContext: () => {
      audioContextCallCount += 1;
      return createAudioContextStub();
    }
  });

  assert.equal(audioFeedback.playSoundEffect('movement', { enabled: false }), false);
  assert.equal(audioContextCallCount, 0);

  assert.equal(audioFeedback.playSoundEffect('movement', { enabled: true }), true);
  assert.equal(audioContextCallCount, 1);

  now += 50;
  assert.equal(audioFeedback.playSoundEffect('movement', { enabled: true }), false);
  assert.equal(audioContextCallCount, 1);

  now += 60;
  assert.equal(audioFeedback.playSoundEffect('movement', { enabled: true }), true);
  assert.equal(audioContextCallCount, 2);
  assert.equal(loggerEntries.length, 0);
});

test('createAudioFeedback logs a warning when sound effect playback throws', () => {
  const loggerEntries = [];
  const audioFeedback = createAudioFeedback({
    readLogger: () => ({
      warn(entry) {
        loggerEntries.push(entry);
      }
    }),
    createAudioContext: () => ({
      createOscillator() {
        throw new Error('synthetic oscillator failure');
      }
    })
  });

  assert.equal(audioFeedback.playSoundEffect('movement', { enabled: true }), false);
  assert.equal(loggerEntries.length, 1);
  assert.equal(loggerEntries[0].code, 'runtime.warning');
});

test('createAudioFeedback speaks hints and instruction audio in Arabic when enabled', () => {
  class FakeSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text;
      this.lang = '';
    }
  }

  const speechCalls = [];
  const speechApi = {
    cancelled: 0,
    cancel() {
      this.cancelled += 1;
    },
    speak(utterance) {
      speechCalls.push({ text: utterance.text, lang: utterance.lang });
    }
  };

  const audioFeedback = createAudioFeedback({
    speechSynthesis: speechApi,
    SpeechSynthesisUtterance: FakeSpeechSynthesisUtterance
  });

  assert.equal(
    audioFeedback.speakHint('تلميح', { enabled: true, hintSpeechEnabled: true }),
    true
  );
  assert.equal(
    audioFeedback.speakInstruction('تعليمات', { enabled: true }),
    true
  );

  assert.equal(speechApi.cancelled, 2);
  assert.deepEqual(speechCalls, [
    { text: 'تلميح', lang: 'ar' },
    { text: 'تعليمات', lang: 'ar' }
  ]);
});

test('createAudioFeedback blocks spoken output when disabled or unsupported', () => {
  const audioFeedback = createAudioFeedback({
    speechSynthesis: null,
    SpeechSynthesisUtterance: null
  });

  assert.equal(
    audioFeedback.speakHint('تلميح', { enabled: true, hintSpeechEnabled: true }),
    false
  );
  assert.equal(audioFeedback.speakInstruction('تعليمات', { enabled: false }), false);
});
