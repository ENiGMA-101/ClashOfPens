import { TURN_TIME_LIMIT_SEC, TURN_WARNING_THRESHOLD_SEC } from './constants';

export interface TurnTimerState {
  remainingSeconds: number;
  isExpired: boolean;
  isWarningActive: boolean;
  formattedDisplay: string;
  progressPercent: number;
}

/**
 * Computes remaining turn time and threshold states.
 * - Max limit: 10 seconds.
 * - Warning active: after 6 seconds elapsed (<= 4s left).
 */
export function computeTurnTimer(
  elapsedSeconds: number,
  limitSeconds: number = TURN_TIME_LIMIT_SEC,
  warningThresholdSeconds: number = TURN_WARNING_THRESHOLD_SEC
): TurnTimerState {
  const safeElapsed = Math.max(0, elapsedSeconds);
  const remaining = Math.max(0, limitSeconds - safeElapsed);
  const isExpired = remaining <= 0;
  const isWarningActive = safeElapsed >= warningThresholdSeconds && !isExpired;
  const progressPercent = Math.max(0, Math.min(100, (remaining / limitSeconds) * 100));

  return {
    remainingSeconds: remaining,
    isExpired,
    isWarningActive,
    formattedDisplay: isExpired ? '0s' : `${Math.ceil(remaining)}s`,
    progressPercent,
  };
}

/**
 * Checks whether the clock tick sound should trigger for the current second countdown.
 * Only triggers after the warning threshold (e.g. after 6s elapsed, i.e. 4s, 3s, 2s, 1s remaining).
 */
export function shouldTriggerTick(
  remainingSeconds: number,
  lastTickSecond: number,
  warningSecondsLeft: number = TURN_TIME_LIMIT_SEC - TURN_WARNING_THRESHOLD_SEC
): { shouldTick: boolean; newTickSecond: number } {
  if (remainingSeconds <= 0) {
    return { shouldTick: false, newTickSecond: lastTickSecond };
  }

  const currentSecond = Math.ceil(remainingSeconds);
  if (currentSecond <= warningSecondsLeft && currentSecond !== lastTickSecond) {
    return { shouldTick: true, newTickSecond: currentSecond };
  }

  return { shouldTick: false, newTickSecond: lastTickSecond };
}
