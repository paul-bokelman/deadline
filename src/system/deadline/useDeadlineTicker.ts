import { useEffect, useState } from 'preact/hooks';

import useInterval from '@/hooks/useInterval';
import { gameEventBus } from '@/game/events';
import { getGameDate } from '@/system/clock/gameClock';
import { computeRemainingMsTo5pm } from '@/apps/TimerApp/timerMath';

const getRemainingMsToDeadline = (): number =>
  computeRemainingMsTo5pm(getGameDate());

export const useDeadlineTicker = (): void => {
  const [remainingMs, setRemainingMs] = useState(getRemainingMsToDeadline);

  useInterval(() => {
    setRemainingMs(getRemainingMsToDeadline());
  }, 1000);

  useEffect(() => {
    const unsubscribeClockAdvanced = gameEventBus.on('clock:advanced', () => {
      setRemainingMs(getRemainingMsToDeadline());
    });
    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setRemainingMs(getRemainingMsToDeadline());
    });
    return () => {
      unsubscribeClockAdvanced();
      unsubscribeRebooted();
    };
  }, []);

  useEffect(() => {
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    gameEventBus.emit('deadline:seconds_remaining', { seconds, remainingMs });
  }, [remainingMs]);
};
