import {
  canMoveForward,
  moveForward,
  turnLeft,
  turnRight
} from '../../robot-simulation/index.js';
import { updateChallengeProgress } from '../domain/objective-tracker.js';
import { validateProgram } from '../domain/program-validation.js';

function emit(onEvent, event) {
  if (typeof onEvent === 'function') {
    onEvent(event);
  }
}

function cloneChallengeState(challengeState) {
  return {
    totalGoals: challengeState.totalGoals,
    collectedGoalKeys: new Set(challengeState.collectedGoalKeys),
    recentlyCollectedGoalKey: challengeState.recentlyCollectedGoalKey
  };
}

function isAbortError(error) {
  return typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError';
}

async function waitWithAbort(delay, milliseconds, signal) {
  if (milliseconds <= 0) {
    return true;
  }

  try {
    await delay(milliseconds, signal);
    return true;
  } catch (error) {
    if (isAbortError(error)) {
      return false;
    }
    throw error;
  }
}

export async function runProgram(options) {
  const {
    level,
    instructionSequence,
    initialRobotState,
    initialChallengeState,
    executionConfig,
    delay,
    signal,
    onEvent
  } = options;

  const validationFailure = validateProgram(level, instructionSequence);
  if (validationFailure) {
    emit(onEvent, { type: 'statusChanged', status: validationFailure });
    return {
      status: validationFailure,
      robotState: initialRobotState,
      challengeState: initialChallengeState
    };
  }

  if (instructionSequence.length === 0) {
    emit(onEvent, { type: 'statusChanged', status: 'complete' });
    return {
      status: 'complete',
      robotState: initialRobotState,
      challengeState: initialChallengeState
    };
  }

  let robotState = { ...initialRobotState };
  let challengeState = cloneChallengeState(initialChallengeState);
  const stepDelayMilliseconds = executionConfig.stepDelayMilliseconds;
  const maxStepsPerRun = executionConfig.maxStepsPerRun;

  for (let stepNumber = 0; stepNumber < instructionSequence.length; stepNumber += 1) {
    if (signal?.aborted) {
      return { status: 'aborted', robotState, challengeState };
    }

    if (stepNumber >= maxStepsPerRun) {
      emit(onEvent, { type: 'statusChanged', status: 'stepLimitExceeded' });
      return { status: 'stepLimitExceeded', robotState, challengeState };
    }

    const instruction = instructionSequence[stepNumber];
    emit(onEvent, { type: 'activeStepChanged', stepId: instruction.stepId });

    if (instruction.blockType === 'start') {
      continue;
    }

    if (instruction.blockType === 'moveForward') {
      if (!canMoveForward(level, robotState)) {
        emit(onEvent, { type: 'statusChanged', status: 'blocked' });
        return { status: 'blocked', robotState, challengeState };
      }

      robotState = moveForward(robotState);
      emit(onEvent, {
        type: 'robotUpdated',
        robotState,
        animation: {
          kind: 'move',
          row: robotState.row,
          column: robotState.column,
          direction: robotState.direction
        }
      });
      emit(onEvent, { type: 'statusChanged', status: 'running' });
      const canContinue = await waitWithAbort(delay, stepDelayMilliseconds, signal);
      if (!canContinue || signal?.aborted) {
        return { status: 'aborted', robotState, challengeState };
      }

      const progress = updateChallengeProgress(level, challengeState, robotState);
      challengeState = progress.challengeState;
      emit(onEvent, { type: 'robotUpdated', robotState, animation: null });
      emit(onEvent, { type: 'challengeUpdated', challengeState });

      if (progress.collectedGoalKey) {
        emit(onEvent, { type: 'statusChanged', status: 'collected' });
        const canContinueAfterCollection = await waitWithAbort(delay, 180, signal);
        if (!canContinueAfterCollection || signal?.aborted) {
          return { status: 'aborted', robotState, challengeState };
        }
      }

      if (progress.isComplete) {
        emit(onEvent, { type: 'statusChanged', status: 'levelComplete' });
        return { status: 'levelComplete', robotState, challengeState };
      }

      continue;
    }

    if (instruction.blockType === 'turnRight' || instruction.blockType === 'turnLeft') {
      const direction = instruction.blockType === 'turnRight' ? 'right' : 'left';
      robotState = direction === 'right' ? turnRight(robotState) : turnLeft(robotState);
      emit(onEvent, {
        type: 'robotUpdated',
        robotState,
        animation: {
          kind: 'turn',
          row: robotState.row,
          column: robotState.column,
          turnDirection: direction
        }
      });
      emit(onEvent, { type: 'statusChanged', status: 'running' });
      const canContinue = await waitWithAbort(delay, stepDelayMilliseconds, signal);
      if (!canContinue || signal?.aborted) {
        return { status: 'aborted', robotState, challengeState };
      }

      emit(onEvent, { type: 'robotUpdated', robotState, animation: null });
      continue;
    }

    emit(onEvent, { type: 'statusChanged', status: 'unsupported' });
    return { status: 'unsupported', robotState, challengeState };
  }

  emit(onEvent, { type: 'statusChanged', status: 'complete' });
  return {
    status: 'complete',
    robotState,
    challengeState
  };
}
