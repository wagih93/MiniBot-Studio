const defaultSoundEffectProfiles = {
  movement: { frequency: 420, durationSeconds: 0.06, gain: 0.03, cooldownMilliseconds: 100 },
  collection: { frequency: 560, durationSeconds: 0.12, gain: 0.05, cooldownMilliseconds: 180 },
  success: { frequency: 720, durationSeconds: 0.2, gain: 0.08, cooldownMilliseconds: 220 }
};

function createDefaultAudioContext() {
  const AudioContextType = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (typeof AudioContextType !== 'function') {
    return null;
  }
  return new AudioContextType();
}

function createWarningLogger(readLogger) {
  return ({ message, error }) => {
    const logger = readLogger();
    if (logger?.warn) {
      logger.warn({
        code: 'runtime.warning',
        message,
        error: String(error)
      });
    }
  };
}

export function createAudioFeedback({
  readLogger = () => null,
  soundEffectProfiles = defaultSoundEffectProfiles,
  now = () => Date.now(),
  createAudioContext = createDefaultAudioContext,
  speechSynthesis = globalThis.speechSynthesis,
  SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance
} = {}) {
  const lastSoundEffectAtByType = new Map();
  const logWarning = createWarningLogger(readLogger);

  function playSoundEffect(effectType, { enabled = false } = {}) {
    if (!enabled) {
      return false;
    }

    const profile = soundEffectProfiles[effectType];
    if (!profile) {
      return false;
    }

    const currentTimestamp = now();
    const lastPlayedAt = lastSoundEffectAtByType.get(effectType) ?? 0;
    if (currentTimestamp - lastPlayedAt < profile.cooldownMilliseconds) {
      return false;
    }
    lastSoundEffectAtByType.set(effectType, currentTimestamp);

    const audioContext = createAudioContext();
    if (!audioContext) {
      return false;
    }

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(profile.frequency, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(profile.gain, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + profile.durationSeconds);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + profile.durationSeconds);
      oscillator.onended = () => {
        if (typeof audioContext.close === 'function') {
          void audioContext.close();
        }
      };
      return true;
    } catch (error) {
      logWarning({ message: 'Failed to play sound effect.', error });
      return false;
    }
  }

  function speakText(text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
      return false;
    }

    if (!speechSynthesis || typeof speechSynthesis.speak !== 'function' || typeof SpeechSynthesisUtterance !== 'function') {
      return false;
    }

    try {
      if (typeof speechSynthesis.cancel === 'function') {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'ar';
      speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      logWarning({ message: 'Failed to play spoken instruction.', error });
      return false;
    }
  }

  function speakHint(text, { enabled = false, hintSpeechEnabled = false } = {}) {
    if (!enabled || !hintSpeechEnabled) {
      return false;
    }

    return speakText(text);
  }

  function speakInstruction(text, { enabled = false } = {}) {
    if (!enabled) {
      return false;
    }

    return speakText(text);
  }

  function playLevelCompletionSound(options) {
    return playSoundEffect('success', options);
  }

  return Object.freeze({
    playSoundEffect,
    playLevelCompletionSound,
    speakHint,
    speakInstruction
  });
}
