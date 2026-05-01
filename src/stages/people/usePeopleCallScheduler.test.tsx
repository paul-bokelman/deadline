import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gameEventBus } from '@/game/events';
import { GameStateContextValue } from '@/game/state';
import { usePeopleCallScheduler } from './usePeopleCallScheduler';

const mockGameState = vi.hoisted(() => ({
  current: null as unknown as GameStateContextValue,
}));

vi.mock('@/game/state', async () => {
  const actual = await vi.importActual<typeof import('@/game/state')>(
    '@/game/state'
  );
  return {
    ...actual,
    useGameState: () => mockGameState.current,
  };
});

const SchedulerHarness = () => {
  usePeopleCallScheduler();
  return null;
};

const renderScheduler = (): HTMLDivElement => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(<SchedulerHarness />, container);
  });
  return container;
};

const createMockState = (
  overrides: Partial<GameStateContextValue> = {}
): GameStateContextValue => {
  const firedEvents = new Set<string>();
  const triggerNetVoiceCall = vi.fn();
  const markEventFired = vi.fn((eventId: string) => {
    firedEvents.add(eventId);
  });
  const hasEventFired = vi.fn((eventId: string) => firedEvents.has(eventId));

  return {
    activeNetVoiceCallId: null,
    completeInitialBios: vi.fn(),
    firedEvents: {},
    flags: {
      bankBalance: 100,
      blackjackBailoutCount: 0,
      blackjackBalance: 0,
      blackjackHandsInProgress: 0,
      dynamicFileNameOverrides: {},
      dynamicFileTypeOverrides: {},
      hasDesktopScrambled: false,
      hasDownloadFailed: false,
      hasDownloadStarted: false,
      hasEmailAccess: true,
      hasFinalReportFile: false,
      hasFoundCorrectEmail: false,
      hasFoundRealEmail: false,
      hasInstalledWinRar: false,
      hasPurchasedAntiVirus: false,
      hasPurchasedWinRar: false,
      hasReceivedIntroCall: true,
      hasReceivedPortalIntroCall: false,
      hasReceivedWinRarLinkEmail: false,
      hasSubmittedFinalReport: false,
      hasUnlockedAttachment: false,
      hasWinRarInstalled: false,
      hasZipFile: false,
      isBluescreenSequenceActive: false,
      malwareLevel: 0,
      recycledDesktopApps: {},
      windowsUpdateActive: false,
      windowsUpdateRebootAt: null,
      zipExtractionLevel: 0,
      zipGarbageBatch: 0,
    },
    hasEventFired,
    hasSeenInitialBios: true,
    isNetVoiceCallAccepted: false,
    markEventFired,
    rebootGame: vi.fn(),
    setFlag: vi.fn(),
    setFlags: vi.fn(),
    setStage: vi.fn(),
    stage: 'desktop_intro',
    triggerNetVoiceCall,
    ...overrides,
  };
};

describe('usePeopleCallScheduler', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    mockGameState.current = createMockState();
  });

  afterEach(() => {
    if (container) {
      act(() => render(null, container as HTMLDivElement));
      container.remove();
      container = null;
    }
    vi.useRealTimers();
  });

  it('triggers deadline milestone voice calls in gated order', () => {
    container = renderScheduler();

    act(() => gameEventBus.emit('deadline:seconds_remaining', { seconds: 0, remainingMs: 0 }));
    act(() => gameEventBus.emit('deadline:seconds_remaining', { seconds: 0, remainingMs: 0 }));
    act(() => gameEventBus.emit('deadline:seconds_remaining', { seconds: 0, remainingMs: 0 }));

    expect(mockGameState.current.triggerNetVoiceCall).toHaveBeenNthCalledWith(
      1,
      'alice_halfway'
    );
    expect(mockGameState.current.triggerNetVoiceCall).toHaveBeenNthCalledWith(
      2,
      'harold_first_call'
    );
    expect(mockGameState.current.triggerNetVoiceCall).toHaveBeenNthCalledWith(
      3,
      'harold_second_call'
    );
  });

  it('does not trigger milestone calls before the intro call has happened', () => {
    mockGameState.current = createMockState({
      flags: {
        ...createMockState().flags,
        hasReceivedIntroCall: false,
      },
    });
    container = renderScheduler();

    act(() => gameEventBus.emit('deadline:seconds_remaining', { seconds: 0, remainingMs: 0 }));

    expect(mockGameState.current.triggerNetVoiceCall).not.toHaveBeenCalled();
  });

  it('does not trigger milestone calls after the win stage', () => {
    mockGameState.current = createMockState({ stage: 'win' });
    container = renderScheduler();

    act(() => gameEventBus.emit('deadline:seconds_remaining', { seconds: 0, remainingMs: 0 }));

    expect(mockGameState.current.triggerNetVoiceCall).not.toHaveBeenCalled();
  });
});
