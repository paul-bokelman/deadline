import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import { systemConfig } from '@/data/systemConfig';
import { GameStage, useGameState } from '@/game/state';

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
  isDownloadingUpdate: boolean;
  onDismissNag: () => void;
  onDownloadUpdate: () => void;
}

const REBOOT_DELAY_MS = 3_000;

export const useUpdateScheduler = (): UseUpdateSchedulerResult => {
  const { flags, rebootGame, setFlags, stage } = useGameState();
  const [isNagVisible, setIsNagVisible] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const hasShownWinRarUpdateRef = useRef(false);
  const rebootTimeoutRef = useRef<number | null>(null);

  const isEligible =
    stageOrder[stage] >=
    stageOrder[systemConfig.windowsUpdate.enabledAfterStage];

  useEffect(() => {
    if (!systemConfig.windowsUpdate.enabled) {
      setIsNagVisible(false);
      setIsDownloadingUpdate(false);
      hasShownWinRarUpdateRef.current = false;
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null)
        setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
      return;
    }

    if (!isEligible) {
      setIsNagVisible(false);
      setIsDownloadingUpdate(false);
      hasShownWinRarUpdateRef.current = false;
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null)
        setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
      return;
    }

    if (!flags.hasWinRarInstalled) {
      setIsNagVisible(false);
      setIsDownloadingUpdate(false);
      hasShownWinRarUpdateRef.current = false;
      if (flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null) {
        setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
      }
      return;
    }

    if (!hasShownWinRarUpdateRef.current) {
      hasShownWinRarUpdateRef.current = true;
      setIsNagVisible(true);
      if (!flags.windowsUpdateActive || flags.windowsUpdateRebootAt !== null) {
        setFlags({ windowsUpdateActive: true, windowsUpdateRebootAt: null });
      }
    }
  }, [
    flags.hasWinRarInstalled,
    flags.windowsUpdateActive,
    flags.windowsUpdateRebootAt,
    isEligible,
    setFlags,
  ]);

  useEffect(() => {
    return () => {
      if (rebootTimeoutRef.current !== null) {
        window.clearTimeout(rebootTimeoutRef.current);
        rebootTimeoutRef.current = null;
      }
    };
  }, []);

  const onDismissNag = useCallback(() => {
    if (isDownloadingUpdate) return;
    setIsNagVisible(false);
  }, [isDownloadingUpdate]);

  const onDownloadUpdate = useCallback(() => {
    if (isDownloadingUpdate) return;
    setIsDownloadingUpdate(true);
    rebootTimeoutRef.current = window.setTimeout(() => {
      setIsDownloadingUpdate(false);
      setIsNagVisible(false);
      setFlags({ windowsUpdateActive: false, windowsUpdateRebootAt: null });
      rebootGame();
      rebootTimeoutRef.current = null;
    }, REBOOT_DELAY_MS);
  }, [isDownloadingUpdate, rebootGame, setFlags]);

  return useMemo(
    () => ({
      isNagVisible,
      isDownloadingUpdate,
      onDismissNag,
      onDownloadUpdate,
    }),
    [isDownloadingUpdate, isNagVisible, onDismissNag, onDownloadUpdate]
  );
};
