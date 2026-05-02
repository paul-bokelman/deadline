import { h, render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import OpenWindowsContext from '@/context/OpenWindowsContext';
import { GameStateProvider } from '@/game/state';
import OpenWindowsProvider from './OpenWindowsProvider';

const ActionIdentityProbe = ({
  onChange,
}: {
  onChange: (isSameAsPrevious: boolean) => void;
}) => {
  const { openApp, windows } = useContext(OpenWindowsContext);
  const previousOpenAppRef = useRef(openApp);

  useEffect(() => {
    if (windows.length <= 2) return;
    onChange(previousOpenAppRef.current === openApp);
    previousOpenAppRef.current = openApp;
  }, [onChange, openApp, windows.length]);

  return (
    <button type="button" onClick={() => openApp({ appId: 'notepad' })}>
      open
    </button>
  );
};

describe('OpenWindowsProvider performance', () => {
  afterEach(() => {
    render(null, document.body);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('keeps action callback identities stable when window state changes', () => {
    const identityChecks: boolean[] = [];
    const container = document.createElement('div');
    document.body.appendChild(container);

    act(() => {
      render(
        <GameStateProvider>
          <OpenWindowsProvider>
            <ActionIdentityProbe
              onChange={(isSameAsPrevious) => {
                identityChecks.push(isSameAsPrevious);
              }}
            />
          </OpenWindowsProvider>
        </GameStateProvider>,
        container
      );
    });

    const button = container.querySelector('button');
    expect(button).toBeTruthy();

    act(() => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(identityChecks).toEqual([true]);
  });
});
