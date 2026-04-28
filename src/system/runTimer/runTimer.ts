let runStartedAtMs = Date.now();
let submittedElapsedMs: number | null = null;

export const resetRunTimer = (): void => {
  runStartedAtMs = Date.now();
  submittedElapsedMs = null;
};

export const markRunSubmitted = (): void => {
  submittedElapsedMs = Math.max(0, Date.now() - runStartedAtMs);
};

export const getSubmittedElapsedMs = (): number | null => submittedElapsedMs;
