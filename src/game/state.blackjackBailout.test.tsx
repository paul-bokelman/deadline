import { h, render } from 'preact';
import { useEffect } from 'preact/hooks';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gameEventBus } from './events';
import {
  GameStateContextValue,
  GameStateProvider,
  useGameState,
} from './state';

const StateProbe = ({
  onState,
}: {
  onState: (state: GameStateContextValue) => void;
}) => {
  const state = useGameState();

  useEffect(() => {
    onState(state);
  }, [onState, state]);

  return null;
};

const renderProvider = (onState: (state: GameStateContextValue) => void) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(
      <GameStateProvider>
        <StateProbe onState={onState} />
      </GameStateProvider>,
      container
    );
  });
  return container;
};

describe('GameStateProvider blackjack bailout calls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    render(null, document.body);
    document.body.innerHTML = '';
    gameEventBus.clear();
    vi.useRealTimers();
  });

  it('queues a bailout call behind the active call instead of waiting for another re-check', () => {
    let latestState: GameStateContextValue | null = null;
    renderProvider((state) => {
      latestState = state;
    });
    const getState = (): GameStateContextValue => {
      if (!latestState) throw new Error('Game state was not captured');
      return latestState;
    };

    act(() => {
      getState().triggerNetVoiceCall('alice_halfway');
    });
    expect(getState().activeNetVoiceCallId).toBe('alice_halfway');

    act(() => {
      getState().setFlags({ bankBalance: 0, blackjackBalance: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(getState().activeNetVoiceCallId).toBe('alice_halfway');

    act(() => {
      gameEventBus.emit('netvoice:call_ended', {
        autoTriggerNextStage: false,
        callId: 'alice_halfway',
        reason: 'call_over',
      });
    });

    expect(getState().activeNetVoiceCallId).toBe('mom_bailout_1');
  });
});
