import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gameEventBus } from '@/game/events';
import { GameStateContextValue } from '@/game/state';
import NetVoiceCallApp from './NetVoiceCallApp';

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

type AudioListener = () => void;

class MockAudio {
  static instances: MockAudio[] = [];

  currentTime = 0;
  duration = 1;
  loop = false;
  preload = '';
  src: string;
  volume = 1;
  listeners = new Map<string, AudioListener[]>();
  pause = vi.fn();
  play = vi.fn(() => Promise.resolve());
  load = vi.fn();

  constructor(src = '') {
    this.src = src;
    MockAudio.instances.push(this);
  }

  addEventListener(eventName: string, listener: AudioListener): void {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
  }

  dispatch(eventName: string): void {
    this.listeners.get(eventName)?.forEach((listener) => listener());
  }
}

const createMockState = (
  overrides: Partial<GameStateContextValue> = {}
): GameStateContextValue => ({
  activeNetVoiceCallId: 'intro_assistant',
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
    hasQueuedGregDrop: false,
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
  hasEventFired: vi.fn(() => false),
  hasSeenInitialBios: true,
  isNetVoiceCallAccepted: false,
  markEventFired: vi.fn(),
  rebootGame: vi.fn(),
  setFlag: vi.fn(),
  setFlags: vi.fn(),
  setStage: vi.fn(),
  stage: 'desktop_intro',
  triggerNetVoiceCall: vi.fn(),
  ...overrides,
});

describe('NetVoiceCallApp', () => {
  let container: HTMLDivElement;
  let originalAudio: typeof Audio;

  beforeEach(() => {
    vi.useFakeTimers();
    originalAudio = window.Audio;
    window.Audio = MockAudio as unknown as typeof Audio;
    MockAudio.instances = [];
    mockGameState.current = createMockState();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => render(null, container));
    container.remove();
    window.Audio = originalAudio;
    vi.useRealTimers();
  });

  it('renders the incoming voice dialog and starts the ringing audio loop', () => {
    act(() => {
      render(<NetVoiceCallApp closeWindow={vi.fn()} openApp={vi.fn()} />, container);
    });

    expect(container.textContent).toContain('Incoming voice call');
    expect(container.textContent).toContain('Alice');
    expect(MockAudio.instances[0]?.src).toBe('/audio/os/incoming_call.mp3');
    expect(MockAudio.instances[0]?.loop).toBe(true);
    expect(MockAudio.instances[0]?.play).toHaveBeenCalledTimes(1);
  });

  it('accepts the call, plays the call audio, and emits call accepted', () => {
    const accepted = vi.fn();
    const off = gameEventBus.on('netvoice:call_accepted', accepted);

    act(() => {
      render(<NetVoiceCallApp closeWindow={vi.fn()} openApp={vi.fn()} />, container);
    });

    const acceptButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Accept')
    );
    expect(acceptButton).toBeDefined();

    act(() => {
      acceptButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const ringAudio = MockAudio.instances[0];
    const callAudio = MockAudio.instances[1];

    expect(ringAudio?.pause).toHaveBeenCalled();
    expect(callAudio?.src).toBe('/audio/netvoice/people/alice-intro.mp3');
    expect(callAudio?.play).toHaveBeenCalledTimes(1);
    expect(accepted).toHaveBeenCalledWith({
      callId: 'intro_assistant',
      autoTriggerNextStage: false,
    });
    expect(container.textContent).toContain('Connected');

    off();
  });

  it('emits call ended after call audio finishes and auto-hangup runs', () => {
    const ended = vi.fn();
    const off = gameEventBus.on('netvoice:call_ended', ended);

    act(() => {
      render(<NetVoiceCallApp closeWindow={vi.fn()} openApp={vi.fn()} />, container);
    });
    const acceptButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Accept')
    );
    act(() => {
      acceptButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    act(() => {
      MockAudio.instances[1]?.dispatch('ended');
    });
    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(ended).toHaveBeenCalledWith({
      callId: 'intro_assistant',
      autoTriggerNextStage: false,
      reason: 'call_over',
    });

    off();
  });
});
