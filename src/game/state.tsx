import { h, FunctionComponent, ComponentChildren, createContext } from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'preact/hooks';

import { triggerBootLoaderScreen } from '../components/shared/BootLoaderScreen/BootLoaderScreen';
import { gameEventBus } from './events';
import { NetVoiceCallId } from './netvoice/calls';
import { playRebootSfx, playYouGotMailSfx } from '../utils/audio/osSfx';
import { FileTypeId } from '../types/FileType';
import { ensureRunStarted, resetRunTimer } from '../system/runTimer/runTimer';
import { BAILOUT_DEBOUNCE_MS, REBOOT_AFTER_CALL_MS } from '../system/timing';

export type GameStage =
  | 'bios'
  | 'boot'
  | 'desktop_intro'
  | 'intro_call'
  | 'search_email'
  | 'password_hunt'
  | 'download'
  | 'post_bluescreen'
  | 'win';

export interface GameFlags {
  hasReceivedIntroCall: boolean;
  hasEmailAccess: boolean;
  hasFoundRealEmail: boolean;
  hasUnlockedAttachment: boolean;
  hasDownloadStarted: boolean;
  hasDownloadFailed: boolean;
  hasZipFile: boolean;
  hasWinRarInstalled: boolean;
  hasFinalReportFile: boolean;
  zipExtractionLevel: 0 | 1 | 2 | 3;
  zipGarbageBatch: 0 | 1 | 2 | 3;
  hasReceivedPortalIntroCall: boolean;
  hasDesktopScrambled: boolean;
  windowsUpdateActive: boolean;
  windowsUpdateRebootAt: number | null;
  isBluescreenSequenceActive: boolean;
  hasFoundCorrectEmail: boolean;
  hasInstalledWinRar: boolean;
  malwareLevel: 0 | 1 | 2 | 3;
  hasSubmittedFinalReport: boolean;
  bankBalance: number;
  blackjackBalance: number;
  blackjackHandsInProgress: number;
  blackjackBailoutCount: 0 | 1 | 2 | 3;
  hasPurchasedWinRar: boolean;
  hasPurchasedAntiVirus: boolean;
  hasReceivedWinRarLinkEmail: boolean;
  dynamicFileTypeOverrides: Partial<Record<string, FileTypeId>>;
  dynamicFileNameOverrides: Partial<Record<string, string>>;
  recycledDesktopApps: Partial<Record<string, string>>;
}

export interface GameStateContextValue {
  stage: GameStage;
  flags: GameFlags;
  hasSeenInitialBios: boolean;
  firedEvents: Record<string, true>;
  activeNetVoiceCallId: NetVoiceCallId | null;
  isNetVoiceCallAccepted: boolean;
  setStage: (stage: GameStage) => void;
  setFlag: <K extends keyof GameFlags>(flag: K, value: GameFlags[K]) => void;
  setFlags: (partialFlags: Partial<GameFlags>) => void;
  markEventFired: (eventId: string) => void;
  hasEventFired: (eventId: string) => boolean;
  triggerNetVoiceCall: (callId: NetVoiceCallId) => void;
  completeInitialBios: () => void;
  rebootGame: () => void;
}

const initialFlags: GameFlags = {
  hasReceivedIntroCall: false,
  hasEmailAccess: true,
  hasFoundRealEmail: false,
  hasUnlockedAttachment: false,
  hasDownloadStarted: false,
  hasDownloadFailed: false,
  hasZipFile: false,
  hasWinRarInstalled: false,
  hasFinalReportFile: false,
  zipExtractionLevel: 0,
  zipGarbageBatch: 0,
  hasReceivedPortalIntroCall: false,
  hasDesktopScrambled: false,
  windowsUpdateActive: false,
  windowsUpdateRebootAt: null,
  isBluescreenSequenceActive: false,
  hasFoundCorrectEmail: false,
  hasInstalledWinRar: false,
  malwareLevel: 0,
  hasSubmittedFinalReport: false,
  bankBalance: 100,
  blackjackBalance: 0,
  blackjackHandsInProgress: 0,
  blackjackBailoutCount: 0,
  hasPurchasedWinRar: false,
  hasPurchasedAntiVirus: false,
  hasReceivedWinRarLinkEmail: false,
  dynamicFileTypeOverrides: {},
  dynamicFileNameOverrides: {},
  recycledDesktopApps: {},
};

const initialContextValue: GameStateContextValue = {
  stage: 'desktop_intro',
  flags: initialFlags,
  hasSeenInitialBios: true,
  firedEvents: {},
  activeNetVoiceCallId: null,
  isNetVoiceCallAccepted: false,
  setStage: () => undefined,
  setFlag: () => undefined,
  setFlags: () => undefined,
  markEventFired: () => undefined,
  hasEventFired: () => false,
  triggerNetVoiceCall: () => undefined,
  completeInitialBios: () => undefined,
  rebootGame: () => undefined,
};

const GameStateContext = createContext<GameStateContextValue>(
  initialContextValue
);

interface GameStateProviderProps {
  children: ComponentChildren;
}

export const GameStateProvider: FunctionComponent<GameStateProviderProps> = ({
  children,
}: GameStateProviderProps) => {
  const [stage, setStageState] = useState<GameStage>('desktop_intro');
  const [flags, setFlagsState] = useState<GameFlags>(initialFlags);
  const [hasSeenInitialBios, setHasSeenInitialBiosState] = useState(true);
  const [firedEvents, setFiredEvents] = useState<Record<string, true>>({});
  const [
    activeNetVoiceCallId,
    setActiveNetVoiceCallIdState,
  ] = useState<NetVoiceCallId | null>(null);
  const [isNetVoiceCallAccepted, setIsNetVoiceCallAcceptedState] = useState(
    false
  );
  const queuedNetVoiceCallIdsRef = useRef<NetVoiceCallId[]>([]);

  const emitGameRebooted = () => {
    gameEventBus.emit('game:rebooted', { at: Date.now() });
  };

  const applyInitialGameState = () => {
    setStageState('desktop_intro');
    setFlagsState(initialFlags);
    setHasSeenInitialBiosState(true);
    setFiredEvents({});
    setActiveNetVoiceCallIdState(null);
    setIsNetVoiceCallAcceptedState(false);
    queuedNetVoiceCallIdsRef.current = [];
    resetRunTimer();
  };

  useEffect(() => {
    // Kick off the leaderboard run on first mount (parallels resetRunTimer
    // in applyInitialGameState which runs only on reboot).
    ensureRunStarted();
  }, []);

  useEffect(() => {
    const unsubscribeAccepted = gameEventBus.on(
      'netvoice:call_accepted',
      () => {
        setIsNetVoiceCallAcceptedState(true);
      }
    );
    const unsubscribeEnded = gameEventBus.on('netvoice:call_ended', () => {
      const nextQueuedCallId = queuedNetVoiceCallIdsRef.current.shift() ?? null;
      setActiveNetVoiceCallIdState(nextQueuedCallId);
      setIsNetVoiceCallAcceptedState(false);
    });

    return () => {
      unsubscribeAccepted();
      unsubscribeEnded();
    };
  }, []);

  useEffect(() => {
    const unsubscribeStarted = gameEventBus.on('blackjack:hand_started', () => {
      setFlagsState((current) => ({
        ...current,
        blackjackHandsInProgress: Math.max(
          0,
          (current.blackjackHandsInProgress ?? 0) + 1
        ),
      }));
    });
    const unsubscribeFinished = gameEventBus.on(
      'blackjack:hand_finished',
      () => {
        setFlagsState((current) => ({
          ...current,
          blackjackHandsInProgress: Math.max(
            0,
            (current.blackjackHandsInProgress ?? 0) - 1
          ),
        }));
      }
    );
    return () => {
      unsubscribeStarted();
      unsubscribeFinished();
    };
  }, []);

  useEffect(() => {
    if (flags.hasPurchasedWinRar) return undefined;
    const isBrokeNow = flags.bankBalance <= 0 && flags.blackjackBalance <= 0;
    if (!isBrokeNow) return undefined;
    if (activeNetVoiceCallId !== null) return undefined;

    // Small debounce to avoid races where a hand just started but the
    // blackjack "hand_started" event hasn't been processed/rendered yet.
    const timer = window.setTimeout(() => {
      const isStillBroke =
        flags.bankBalance <= 0 && flags.blackjackBalance <= 0;
      const noActiveHands = flags.blackjackHandsInProgress <= 0;
      if (!isStillBroke || !noActiveHands) return;
      if (activeNetVoiceCallId !== null) return;

      const bailoutCount = flags.blackjackBailoutCount ?? 0;
      const eventId = `blackjack:bailout:${bailoutCount}:triggered`;
      if (firedEvents[eventId]) return;
      setFiredEvents((current) => ({ ...current, [eventId]: true }));

      const nextCallId =
        bailoutCount === 0
          ? 'mom_bailout_1'
          : bailoutCount === 1
          ? 'mom_bailout_2'
          : 'greg_3rd_0';
      setActiveNetVoiceCallIdState(nextCallId);
      setIsNetVoiceCallAcceptedState(false);
    }, BAILOUT_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    activeNetVoiceCallId,
    firedEvents,
    flags.bankBalance,
    flags.blackjackBalance,
    flags.blackjackHandsInProgress,
    flags.blackjackBailoutCount,
    flags.hasPurchasedWinRar,
  ]);

  useEffect(() => {
    return gameEventBus.on('netvoice:call_ended', ({ callId }) => {
      if (callId !== 'mom_bailout_1' && callId !== 'mom_bailout_2') return;

      const eventId = `blackjack:bailout:${callId}:paid`;
      setFiredEvents((currentEvents) => {
        if (currentEvents[eventId]) return currentEvents;
        setFlagsState((currentFlags) => ({
          ...currentFlags,
          bankBalance: (currentFlags.bankBalance ?? 0) + 100,
          blackjackBailoutCount:
            callId === 'mom_bailout_1'
              ? 1
              : callId === 'mom_bailout_2'
              ? 2
              : currentFlags.blackjackBailoutCount ?? 0,
        }));
        return { ...currentEvents, [eventId]: true };
      });
    });
  }, []);

  const rebootGame = useCallback<GameStateContextValue['rebootGame']>(() => {
    queuedNetVoiceCallIdsRef.current = [];
    setActiveNetVoiceCallIdState(null);
    setIsNetVoiceCallAcceptedState(false);
    emitGameRebooted();
    void playRebootSfx();
    void triggerBootLoaderScreen({
      preFadeMs: 500,
    }).then(() => applyInitialGameState());
  }, []);

  useEffect(() => {
    return gameEventBus.on('email:delivered', () => {
      playYouGotMailSfx();
    });
  }, []);

  useEffect(() => {
    return gameEventBus.on('netvoice:call_ended', ({ callId }) => {
      if (
        callId !== 'greg_3rd_0' &&
        callId !== 'computer_heartless' &&
        callId !== 'harold_second_call'
      ) {
        return;
      }
      window.setTimeout(() => {
        rebootGame();
      }, REBOOT_AFTER_CALL_MS);
    });
  }, [rebootGame]);

  const setStage: GameStateContextValue['setStage'] = (nextStage) => {
    setStageState(nextStage);
  };

  const setFlag: GameStateContextValue['setFlag'] = (flag, value) => {
    setFlagsState((currentFlags) => ({ ...currentFlags, [flag]: value }));
  };

  const setFlags: GameStateContextValue['setFlags'] = (partialFlags) => {
    setFlagsState((currentFlags) => ({ ...currentFlags, ...partialFlags }));
  };

  const markEventFired: GameStateContextValue['markEventFired'] = (eventId) => {
    setFiredEvents((currentEvents) => {
      if (currentEvents[eventId]) return currentEvents;
      return { ...currentEvents, [eventId]: true };
    });
  };

  const hasEventFired: GameStateContextValue['hasEventFired'] = (eventId) => {
    return firedEvents[eventId] === true;
  };

  const triggerNetVoiceCall: GameStateContextValue['triggerNetVoiceCall'] = (
    callId
  ) => {
    setActiveNetVoiceCallIdState((currentCallId) => {
      if (currentCallId === null) {
        setIsNetVoiceCallAcceptedState(false);
        return callId;
      }
      queuedNetVoiceCallIdsRef.current.push(callId);
      return currentCallId;
    });
  };

  const completeInitialBios: GameStateContextValue['completeInitialBios'] = () => {
    setHasSeenInitialBiosState(true);
    setStage('desktop_intro');
  };

  const contextValue: GameStateContextValue = {
    stage,
    flags,
    hasSeenInitialBios,
    firedEvents,
    activeNetVoiceCallId,
    isNetVoiceCallAccepted,
    setStage,
    setFlag,
    setFlags,
    markEventFired,
    hasEventFired,
    triggerNetVoiceCall,
    completeInitialBios,
    rebootGame,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextValue =>
  useContext(GameStateContext);
