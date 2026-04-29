import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

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
  isNagVisible: boolean;
  onDismissNag: () => void;
  onRemindLater: () => void;
  onRebootNow: () => void;
}

const REMINDER_DELAY_MIN_MS = 50_000;
const REMINDER_DELAY_MAX_MS = 70_000;

const randomReminderDelayMs = (): number =>
  Math.floor(
    REMINDER_DELAY_MIN_MS +
      Math.random() * (REMINDER_DELAY_MAX_MS - REMINDER_DELAY_MIN_MS)
  );

export const useUpdateScheduler = (): UseUpdateSchedulerResult => {
  const { flags, rebootGame, setFlags, stage } = useGameState();
  const [isNagVisible, setIsNagVisible] = useState(false);

  const isEligible =
    stageOrder[stage] >=
    stageOrder[systemConfig.windowsUpdate.enabledAfterStage];

  const activateWindowsUpdate = useCallback(() => {
    setFlags({ windowsUpdateActive: true, windowsUpdateRebootAt: null });
  }, [setFlags]);

  useEffect(() => {
    if (!systemConfig.windowsUpdate.enabled) {
      setIsNagVisible(false);
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null)
        setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
      return;
    }

    if (!isEligible) {
      setIsNagVisible(false);
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null)
        setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
      return;
    }

    if (!flags.windowsUpdateActive) activateWindowsUpdate();
  }, [
    flags.windowsUpdateActive,
    flags.windowsUpdateRebootAt,
    isEligible,
    activateWindowsUpdate,
    setFlags,
  ]);

  useEffect(() => {
    if (
      !systemConfig.windowsUpdate.enabled ||
      !isEligible ||
      !flags.windowsUpdateActive
    ) {
      setIsNagVisible(false);
      return;
    }

    if (isNagVisible) return;

    const timeoutId = window.setTimeout(() => {
      setIsNagVisible(true);
    }, randomReminderDelayMs());

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [flags.windowsUpdateActive, isEligible, isNagVisible]);

  const onDismissNag = useCallback(() => {
    setIsNagVisible(false);
  }, []);

  const rebootForUpdate = useCallback(() => {
    setIsNagVisible(false);
    setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
    rebootGame();
  }, [rebootGame, setFlags]);

  return useMemo(
    () => ({
      isNagVisible,
      onDismissNag,
      onRemindLater: rebootForUpdate,
      onRebootNow: rebootForUpdate,
    }),
    [isNagVisible, onDismissNag, rebootForUpdate]
  );
};
