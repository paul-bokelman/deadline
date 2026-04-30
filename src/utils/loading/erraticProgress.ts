export interface ErraticProgressOptions {
  maxDelayMs: number;
  maxIncrement: number;
  maxPauseMs: number;
  minDelayMs: number;
  minIncrement: number;
  minPauseMs: number;
  pauseChance: number;
  /**
   * Quantize progress to discrete jumps (in percent points).
   * Larger values feel more "choppy"/steppy.
   */
  stepSize?: number;
}

export interface ErraticProgressStep {
  delayMs: number;
  nextProgress: number;
  paused: boolean;
}

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

export const getErraticProgressStep = (
  currentProgress: number,
  target: number,
  options: ErraticProgressOptions
): ErraticProgressStep => {
  if (currentProgress >= target) {
    return {
      delayMs: options.minDelayMs,
      nextProgress: target,
      paused: false,
    };
  }

  if (Math.random() < options.pauseChance) {
    return {
      delayMs: Math.round(
        randomBetween(options.minPauseMs, options.maxPauseMs)
      ),
      nextProgress: currentProgress,
      paused: true,
    };
  }

  const increment = randomBetween(options.minIncrement, options.maxIncrement);
  const stepSize = options.stepSize ?? 1;
  const rawNext = Math.min(target, currentProgress + increment);
  const steppedNext =
    stepSize > 1
      ? Math.min(target, Math.ceil(rawNext / stepSize) * stepSize)
      : rawNext;
  return {
    delayMs: Math.round(randomBetween(options.minDelayMs, options.maxDelayMs)),
    nextProgress: steppedNext,
    paused: false,
  };
};
