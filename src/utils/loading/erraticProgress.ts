export interface ErraticProgressOptions {
  maxDelayMs: number;
  maxIncrement: number;
  maxPauseMs: number;
  minDelayMs: number;
  minIncrement: number;
  minPauseMs: number;
  pauseChance: number;
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
      delayMs: Math.round(randomBetween(options.minPauseMs, options.maxPauseMs)),
      nextProgress: currentProgress,
      paused: true,
    };
  }

  const increment = randomBetween(options.minIncrement, options.maxIncrement);
  return {
    delayMs: Math.round(randomBetween(options.minDelayMs, options.maxDelayMs)),
    nextProgress: Math.min(target, currentProgress + increment),
    paused: false,
  };
};
