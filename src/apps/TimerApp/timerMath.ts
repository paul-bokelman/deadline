// Pure helpers for the deadline timer. Exported separately so they're
// trivially unit-testable without the surrounding Preact component.

export const DEADLINE_HOUR = 17; // 5:00 PM local
export const COUNTDOWN_MS = 15 * 60 * 1000;

export const formatCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`;
};

export const computeRemainingMsTo5pm = (now: Date): number => {
  const deadline = new Date(now);
  deadline.setHours(DEADLINE_HOUR, 0, 0, 0);
  return Math.max(0, deadline.getTime() - now.getTime());
};
