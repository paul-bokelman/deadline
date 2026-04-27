import { h, FunctionComponent, ComponentChildren, createContext } from 'preact';
import { useContext, useEffect, useMemo, useState } from 'preact/hooks';

import { gameEventBus } from './events';
import { SkypeCallId } from './skype/calls';

export type GameStage =
  | 'bios'
  | 'boot'
  | 'desktop_intro'
  | 'intro_call'
  | 'search_email'
  | 'password_hunt'
  | 'download'
  | 'post_bluescreen';

export interface GameFlags {
  hasReceivedIntroCall: boolean;
  hasEmailAccess: boolean;
  hasFoundRealEmail: boolean;
  hasReceivedPasswordHintCall: boolean;
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
  narrator: boolean;
  windowsUpdateActive: boolean;
  nextNagAt: number | null;
  isBluescreenSequenceActive: boolean;
  hasFoundCorrectEmail: boolean;
  hasInstalledWinRar: boolean;
  malwareLevel: 0 | 1 | 2 | 3;
  language: 'en' | 'zh';
}

export interface GameStateContextValue {
  stage: GameStage;
  flags: GameFlags;
  hasSeenInitialBios: boolean;
  firedEvents: Record<string, true>;
  activeSkypeCallId: SkypeCallId | null;
  setStage: (stage: GameStage) => void;
  setFlag: <K extends keyof GameFlags>(flag: K, value: GameFlags[K]) => void;
  setFlags: (partialFlags: Partial<GameFlags>) => void;
  markEventFired: (eventId: string) => void;
  hasEventFired: (eventId: string) => boolean;
  triggerSkypeCall: (callId: SkypeCallId) => void;
  completeInitialBios: () => void;
  resetGame: () => void;
}

const initialFlags: GameFlags = {
  hasReceivedIntroCall: false,
  hasEmailAccess: false,
  hasFoundRealEmail: false,
  hasReceivedPasswordHintCall: false,
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
  narrator: false,
  windowsUpdateActive: false,
  nextNagAt: null,
  isBluescreenSequenceActive: false,
  hasFoundCorrectEmail: false,
  hasInstalledWinRar: false,
  malwareLevel: 0,
  language: 'en',
};

const initialContextValue: GameStateContextValue = {
  stage: 'bios',
  flags: initialFlags,
  hasSeenInitialBios: false,
  firedEvents: {},
  activeSkypeCallId: null,
  setStage: () => undefined,
  setFlag: () => undefined,
  setFlags: () => undefined,
  markEventFired: () => undefined,
  hasEventFired: () => false,
  triggerSkypeCall: () => undefined,
  completeInitialBios: () => undefined,
  resetGame: () => undefined,
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
  const [stage, setStage] = useState<GameStage>('bios');
  const [flags, setFlagsState] = useState<GameFlags>(initialFlags);
  const [hasSeenInitialBios, setHasSeenInitialBios] = useState(false);
  const [firedEvents, setFiredEvents] = useState<Record<string, true>>({});
  const [
    activeSkypeCallId,
    setActiveSkypeCallId,
  ] = useState<SkypeCallId | null>(null);

  useEffect(() => {
    const unsubscribe = gameEventBus.on('skype:call_ended', () => {
      setActiveSkypeCallId(null);
    });

    return unsubscribe;
  }, []);

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

  const triggerSkypeCall: GameStateContextValue['triggerSkypeCall'] = (
    callId
  ) => {
    setActiveSkypeCallId(callId);
  };

  const completeInitialBios: GameStateContextValue['completeInitialBios'] = () => {
    setHasSeenInitialBios(true);
    setStage('desktop_intro');
  };

  const resetGame: GameStateContextValue['resetGame'] = () => {
    setStage(hasSeenInitialBios ? 'desktop_intro' : 'bios');
    setFlagsState(initialFlags);
    setFiredEvents({});
    setActiveSkypeCallId(null);
  };

  const contextValue = useMemo<GameStateContextValue>(
    () => ({
      stage,
      flags,
      hasSeenInitialBios,
      firedEvents,
      activeSkypeCallId,
      setStage,
      setFlag,
      setFlags,
      markEventFired,
      hasEventFired,
      triggerSkypeCall,
      completeInitialBios,
      resetGame,
    }),
    [stage, flags, hasSeenInitialBios, firedEvents, activeSkypeCallId]
  );

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = (): GameStateContextValue =>
  useContext(GameStateContext);
