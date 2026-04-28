import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

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
  win: 8,
};

interface UseUpdateSchedulerResult {
  countdownMs: number;
  isNagVisible: boolean;
  onRemindLater: () => void;
  onRebootNow: () => void;
}

const REMIND_LATER_MS = 45_000;

export const useUpdateScheduler = (): UseUpdateSchedulerResult => {
  const { flags, rebootGame, setFlags, stage } = useGameState();
  const [countdownMs, setCountdownMs] = useState(
    systemConfig.windowsUpdate.countdownMs
  );
  const [snoozedUntil, setSnoozedUntil] = useState<number>(0);

  const countdownIntervalRef = useRef<number | null>(null);
  const hasTriggeredRebootRef = useRef(false);

  const isEligible =
    stageOrder[stage] >=
    stageOrder[systemConfig.windowsUpdate.enabledAfterStage];
  const isNagVisible =
    systemConfig.windowsUpdate.enabled &&
    flags.windowsUpdateActive &&
    Date.now() >= snoozedUntil;

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

  const deactivateWindowsUpdate = useCallback(() => {
    setFlags({
      windowsUpdateActive: false,
      windowsUpdateRebootAt: null,
    });
  }, [setFlags]);

  useEffect(() => {
    if (!systemConfig.windowsUpdate.enabled) {
      clearCountdownInterval();
      hasTriggeredRebootRef.current = false;
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null) {
        deactivateWindowsUpdate();
      }
      return;
    }

    if (!isEligible) {
      clearCountdownInterval();
      hasTriggeredRebootRef.current = false;
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null) {
        deactivateWindowsUpdate();
      }
      return;
    }

    if (!flags.windowsUpdateActive || flags.windowsUpdateRebootAt === null) {
      startRebootTimer();
    }
  }, [
    flags.windowsUpdateActive,
    flags.windowsUpdateRebootAt,
    isEligible,
    clearCountdownInterval,
    deactivateWindowsUpdate,
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
      deactivateWindowsUpdate();
      rebootGame();
    };

    tick();
    countdownIntervalRef.current = window.setInterval(tick, 1_000);
    return clearCountdownInterval;
  }, [
    isNagVisible,
    flags.windowsUpdateRebootAt,
    clearCountdownInterval,
    deactivateWindowsUpdate,
    rebootGame,
  ]);

  const onRebootNow = useCallback(() => {
    hasTriggeredRebootRef.current = true;
    deactivateWindowsUpdate();
    rebootGame();
  }, [deactivateWindowsUpdate, rebootGame]);

  const onRemindLater = useCallback(() => {
    setSnoozedUntil(Date.now() + REMIND_LATER_MS);
  }, []);

  useEffect(() => {
    return () => {
      clearCountdownInterval();
    };
  }, [clearCountdownInterval]);

  return useMemo(
    () => ({
      countdownMs,
      isNagVisible,
      onRemindLater,
      onRebootNow,
    }),
    [countdownMs, isNagVisible, onRemindLater, onRebootNow]
  );
};
