import {
  canMoveForward,
  moveForward,
  turnLeft,
  turnRight
} from '../../robot-simulation/index.js';
import { updateObjectiveProgress } from '../domain/objective-tracker.js';
import { validateProgram } from '../domain/program-validation.js';

function emit(onEvent, event) {
  if (typeof onEvent === 'function') {
    onEvent(event);
  }
}

function cloneObjectiveProgress(objectiveProgress) {
  return {
    totalCollectibles: objectiveProgress.totalCollectibles,
    collectedCollectibleKeys: new Set(objectiveProgress.collectedCollectibleKeys),
    recentlyCollectedCollectibleKey: objectiveProgress.recentlyCollectedCollectibleKey
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
    initialObjectiveProgress,
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
      objectiveProgress: initialObjectiveProgress
    };
  }

  if (instructionSequence.length === 0) {
    emit(onEvent, { type: 'statusChanged', status: 'complete' });
    return {
      status: 'complete',
      robotState: initialRobotState,
      objectiveProgress: initialObjectiveProgress
    };
  }

  let robotState = { ...initialRobotState };
  let objectiveProgress = cloneObjectiveProgress(initialObjectiveProgress);
  const stepDelayMilliseconds = executionConfig.stepDelayMilliseconds;
  const maxStepsPerRun = executionConfig.maxStepsPerRun;
  let executedInstructionCount = 0;

  async function executeInstructionSequence(sequence) {
    for (const instruction of sequence) {
      if (signal?.aborted) {
        return { terminal: true, status: 'aborted' };
      }

      if (executedInstructionCount >= maxStepsPerRun) {
        emit(onEvent, { type: 'statusChanged', status: 'stepLimitExceeded' });
        return { terminal: true, status: 'stepLimitExceeded' };
      }

      executedInstructionCount += 1;
      emit(onEvent, { type: 'activeStepChanged', stepId: instruction.stepId });

      if (instruction.blockType === 'start') {
        continue;
      }

      if (instruction.blockType === 'if') {
        if (instruction.condition !== 'pathBlocked') {
          emit(onEvent, { type: 'statusChanged', status: 'unsupported' });
          return { terminal: true, status: 'unsupported' };
        }
        if (canMoveForward(level, robotState)) {
          continue;
        }
        const nestedInstructions = Array.isArray(instruction.body) ? instruction.body : [];
        const nestedResult = await executeInstructionSequence(nestedInstructions);
        if (nestedResult.terminal) {
          return nestedResult;
        }
        continue;
      }

      if (instruction.blockType === 'moveForward') {
        if (!canMoveForward(level, robotState)) {
          emit(onEvent, { type: 'statusChanged', status: 'blocked' });
          return { terminal: true, status: 'blocked' };
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
          return { terminal: true, status: 'aborted' };
        }

        const progress = updateObjectiveProgress(level, objectiveProgress, robotState);
        objectiveProgress = progress.objectiveProgress;
        emit(onEvent, { type: 'robotUpdated', robotState, animation: null });
        emit(onEvent, { type: 'objectiveUpdated', objectiveProgress });

        if (progress.collectedCollectibleKey) {
          emit(onEvent, { type: 'statusChanged', status: 'collected' });
          const canContinueAfterCollection = await waitWithAbort(delay, 180, signal);
          if (!canContinueAfterCollection || signal?.aborted) {
            return { terminal: true, status: 'aborted' };
          }
        }

        if (progress.isObjectiveComplete) {
          emit(onEvent, { type: 'statusChanged', status: 'levelComplete' });
          return { terminal: true, status: 'levelComplete' };
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
          return { terminal: true, status: 'aborted' };
        }

        emit(onEvent, { type: 'robotUpdated', robotState, animation: null });
        continue;
      }

      emit(onEvent, { type: 'statusChanged', status: 'unsupported' });
      return { terminal: true, status: 'unsupported' };
    }

    return { terminal: false, status: 'complete' };
  }

  const executionResult = await executeInstructionSequence(instructionSequence);
  if (executionResult.terminal) {
    return {
      status: executionResult.status,
      robotState,
      objectiveProgress
    };
  }

  emit(onEvent, { type: 'statusChanged', status: 'complete' });
  return {
    status: 'complete',
    robotState,
    objectiveProgress
  };
}
