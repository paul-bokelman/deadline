import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { systemConfig } from '../../data/systemConfig';
import { GameStage, useGameState } from '../../game/state';

const stageOrder: Record<GameStage, number> = {
  bios: 0,
  boot: 1,
  desktop_intro: 2,
  intro_call: 3,
  search_email: 4,
  password_hunt: 5,
  download: 6,
  post_bluescreen: 7,
};

const getRandomInRange = (min: number, max: number): number => {
  return Math.floor(min + Math.random() * (max - min));
};

interface UseUpdateSchedulerResult {
  countdownMs: number;
  isNagVisible: boolean;
  onRestartNow: () => void;
  onRemindLater: () => void;
}

export const useUpdateScheduler = (): UseUpdateSchedulerResult => {
  const {
    activeNetVoiceCallId,
    flags,
    rebootGame,
    setFlag,
    stage,
  } = useGameState();
  const [countdownMs, setCountdownMs] = useState(
    systemConfig.windowsUpdate.countdownMs
  );

  const nextNagTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const pendingDelayMsRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);

  const isEligible =
    stageOrder[stage] >=
    stageOrder[systemConfig.windowsUpdate.enabledAfterStage];
  const isPaused = !!activeNetVoiceCallId || flags.isBluescreenSequenceActive;
  const isNagVisible = flags.windowsUpdateActive;

  const clearNextNagTimeout = () => {
    if (nextNagTimeoutRef.current !== null) {
      window.clearTimeout(nextNagTimeoutRef.current);
      nextNagTimeoutRef.current = null;
    }
  };

  const clearCountdownInterval = () => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const scheduleNextNag = (delayMs?: number) => {
    clearNextNagTimeout();

    const configuredDelayMs =
      delayMs ??
      getRandomInRange(
        systemConfig.windowsUpdate.nagIntervalMsRange.min,
        systemConfig.windowsUpdate.nagIntervalMsRange.max
      );
    pendingDelayMsRef.current = configuredDelayMs;
    setFlag('nextNagAt', Date.now() + configuredDelayMs);

    nextNagTimeoutRef.current = window.setTimeout(() => {
      pendingDelayMsRef.current = null;
      setFlag('windowsUpdateActive', true);
      setCountdownMs(systemConfig.windowsUpdate.countdownMs);
    }, configuredDelayMs);
  };

  useEffect(() => {
    if (!isEligible) {
      clearNextNagTimeout();
      clearCountdownInterval();
      pendingDelayMsRef.current = null;
      pauseStartedAtRef.current = null;
      if (flags.windowsUpdateActive) setFlag('windowsUpdateActive', false);
      if (flags.nextNagAt !== null) setFlag('nextNagAt', null);
      return;
    }

    if (isPaused) {
      if (pauseStartedAtRef.current === null) {
        pauseStartedAtRef.current = Date.now();
      }
      clearNextNagTimeout();
      clearCountdownInterval();
      return;
    }

    if (pauseStartedAtRef.current !== null) {
      if (pendingDelayMsRef.current !== null) {
        const elapsed = Date.now() - pauseStartedAtRef.current;
        pendingDelayMsRef.current = Math.max(
          1_000,
          pendingDelayMsRef.current - elapsed
        );
      }
      pauseStartedAtRef.current = null;
    }

    if (!isNagVisible && nextNagTimeoutRef.current === null) {
      scheduleNextNag(pendingDelayMsRef.current ?? undefined);
    }
  }, [
    isEligible,
    isPaused,
    isNagVisible,
    flags.windowsUpdateActive,
    flags.nextNagAt,
    setFlag,
  ]);

  useEffect(() => {
    if (!isNagVisible || isPaused) {
      clearCountdownInterval();
      return;
    }

    setFlag('nextNagAt', Date.now() + countdownMs);
    clearCountdownInterval();
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownMs((currentMs) => {
        const nextMs = Math.max(0, currentMs - 1_000);
        if (nextMs === 0) {
          clearCountdownInterval();
          rebootGame();
        }
        return nextMs;
      });
    }, 1_000);

    return clearCountdownInterval;
  }, [isNagVisible, isPaused, countdownMs, rebootGame, setFlag]);

  const onRestartNow = () => {
    rebootGame();
  };

  const onRemindLater = () => {
    setFlag('windowsUpdateActive', false);
    setFlag('nextNagAt', null);
    setCountdownMs(systemConfig.windowsUpdate.countdownMs);
    scheduleNextNag();
  };

  useEffect(() => {
    return () => {
      clearNextNagTimeout();
      clearCountdownInterval();
    };
  }, []);

  return useMemo(
    () => ({
      countdownMs,
      isNagVisible,
      onRestartNow,
      onRemindLater,
    }),
    [countdownMs, isNagVisible]
  );
};
