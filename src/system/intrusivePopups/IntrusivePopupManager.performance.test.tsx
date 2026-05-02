import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gameEventBus } from '@/game/events';
import { GameStateProvider } from '@/game/state';
import IntrusivePopupManager from './IntrusivePopupManager';

const popupRenderCounts = vi.hoisted(() => ({
  byId: new Map<string, number>(),
}));

vi.mock('./sfx', () => ({
  createIntrusivePopupLoopSfx: () => null,
  playIntrusivePopupCloseSfx: vi.fn(),
  playIntrusivePopupSpawnSfx: vi.fn(),
  stopIntrusivePopupLoopSfx: vi.fn(),
}));

vi.mock('@/data/intrusivePopupConfigs', () => ({
  createRandomIntrusivePopupConfig: () => ({
    behavior: {
      bounceSpeedPxPerSecond: 120,
    },
    iconId: 'warning',
    id: 'benchmark-popup',
    size: { height: 120, width: 160 },
    title: 'Benchmark Popup',
  }),
}));

vi.mock('./IntrusivePopupWindow', () => ({
  default: function MockIntrusivePopupWindow({
    onWindowElement,
    popup,
  }: {
    onWindowElement?: (element: HTMLDivElement | null) => void;
    popup: { id: string };
  }) {
    popupRenderCounts.byId.set(
      popup.id,
      (popupRenderCounts.byId.get(popup.id) ?? 0) + 1
    );
    return <div data-popup-id={popup.id} ref={onWindowElement} />;
  },
}));

const renderManager = (): HTMLDivElement => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    render(
      <GameStateProvider>
        <IntrusivePopupManager />
      </GameStateProvider>,
      container
    );
  });
  return container;
};

describe('IntrusivePopupManager performance', () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    popupRenderCounts.byId.clear();
    rafCallbacks = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(
      () => undefined
    );
  });

  afterEach(() => {
    render(null, document.body);
    document.body.innerHTML = '';
    gameEventBus.clear();
    vi.restoreAllMocks();
  });

  it('does not re-render bouncing popups every animation frame', () => {
    renderManager();

    act(() => {
      gameEventBus.emit('popup:test_spawn_random', { x: 0, y: 0 });
    });

    const popupId = Array.from(popupRenderCounts.byId.keys())[0];
    expect(popupId).toBeTruthy();
    const rendersAfterSpawn = popupRenderCounts.byId.get(popupId) ?? 0;

    for (let i = 0; i < 8; i += 1) {
      const callback = rafCallbacks.shift();
      expect(callback).toBeTruthy();
      act(() => {
        callback?.(1000 + i * 16);
      });
    }

    expect(popupRenderCounts.byId.get(popupId)).toBe(rendersAfterSpawn);
  });
});
