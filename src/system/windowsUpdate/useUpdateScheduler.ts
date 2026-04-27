import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

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

interface UseUpdateSchedulerResult {
  countdownMs: number;
  isNagVisible: boolean;
  onRebootNow: () => void;
}

export const useUpdateScheduler = (): UseUpdateSchedulerResult => {
  const {
    flags,
    rebootGame,
    setFlags,
    stage,
  } = useGameState();
  const [countdownMs, setCountdownMs] = useState(
    systemConfig.windowsUpdate.countdownMs
  );

  const countdownIntervalRef = useRef<number | null>(null);
  const hasTriggeredRebootRef = useRef(false);

  const isEligible =
    stageOrder[stage] >=
    stageOrder[systemConfig.windowsUpdate.enabledAfterStage];
  const isNagVisible = flags.windowsUpdateActive;

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startRebootTimer = useCallback(() => {
    const rebootAt = Date.now() + systemConfig.windowsUpdate.countdownMs;
    hasTriggeredRebootRef.current = false;
    setCountdownMs(systemConfig.windowsUpdate.countdownMs);
    setFlags({
      windowsUpdateActive: true,
      windowsUpdateRebootAt: rebootAt,
    });
  }, [setFlags]);

  useEffect(() => {
    if (!isEligible) {
      clearCountdownInterval();
      hasTriggeredRebootRef.current = false;
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null) {
        setFlags({
          windowsUpdateActive: false,
          windowsUpdateRebootAt: null,
        });
      }
      return;
    }

    if (!flags.windowsUpdateActive || flags.windowsUpdateRebootAt === null) {
      startRebootTimer();
    }
  }, [
    isEligible,
    flags.windowsUpdateActive,
    flags.windowsUpdateRebootAt,
    clearCountdownInterval,
    setFlags,
    startRebootTimer,
  ]);

  useEffect(() => {
    const rebootAt = flags.windowsUpdateRebootAt;
    if (!isNagVisible || rebootAt === null) {
      clearCountdownInterval();
      return;
    }

    clearCountdownInterval();
    const tick = () => {
      const remainingMs = Math.max(0, rebootAt - Date.now());
      setCountdownMs(remainingMs);
      if (remainingMs > 0 || hasTriggeredRebootRef.current) return;

      hasTriggeredRebootRef.current = true;
      clearCountdownInterval();
      setFlags({
        windowsUpdateActive: false,
        windowsUpdateRebootAt: null,
      });
      rebootGame();
    };

    tick();
    countdownIntervalRef.current = window.setInterval(tick, 1_000);
    return clearCountdownInterval;
  }, [
    isNagVisible,
    flags.windowsUpdateRebootAt,
    clearCountdownInterval,
    rebootGame,
    setFlags,
  ]);

  const onRebootNow = useCallback(() => {
    hasTriggeredRebootRef.current = true;
    setFlags({
      windowsUpdateActive: false,
      windowsUpdateRebootAt: null,
    });
    rebootGame();
  }, [rebootGame, setFlags]);

  useEffect(() => {
    return () => {
      clearCountdownInterval();
    };
  }, [clearCountdownInterval]);

  return useMemo(
    () => ({
      countdownMs,
      isNagVisible,
      onRebootNow,
    }),
    [countdownMs, isNagVisible, onRebootNow]
  );
};
