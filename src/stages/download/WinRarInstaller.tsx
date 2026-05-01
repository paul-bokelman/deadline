import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { AppProps } from '@/types/App';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { createLoadingSfxController } from '@/utils/audio/sfx';
import { getErraticProgressStep } from '@/utils/loading/erraticProgress';

type InstallerPhase =
  | 'installing'
  | 'purchase'
  | 'updatePrompt'
  | 'done';

const trackStyle: JSX.CSSProperties = {
  width: '100%',
  height: '18px',
  boxShadow: 'var(--border-field)',
  backgroundColor: 'var(--paper)',
  marginTop: '8px',
};

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-raised)',
  padding: '4px 8px',
  marginTop: '10px',
};

const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const WINRAR_PRICE = 300;

type ProgressBehavior = typeof getErraticProgressStep extends (
  ...args: infer A
) => infer _R
  ? A[2]
  : never;

const scaleProgressBehavior = (
  behavior: ProgressBehavior,
  {
    delayScale,
    incrementScale,
    pauseScale,
  }: { delayScale: number; incrementScale: number; pauseScale: number }
): ProgressBehavior => ({
  ...behavior,
  maxDelayMs: Math.max(1, Math.round(behavior.maxDelayMs * delayScale)),
  minDelayMs: Math.max(1, Math.round(behavior.minDelayMs * delayScale)),
  maxPauseMs: Math.max(1, Math.round(behavior.maxPauseMs * pauseScale)),
  minPauseMs: Math.max(1, Math.round(behavior.minPauseMs * pauseScale)),
  maxIncrement: behavior.maxIncrement * incrementScale,
  minIncrement: behavior.minIncrement * incrementScale,
});

const BASE_PROGRESS_BEHAVIOR = {
  maxDelayMs: 260,
  maxIncrement: 4.8,
  maxPauseMs: 3600,
  minDelayMs: 90,
  minIncrement: 0.6,
  minPauseMs: 1300,
  pauseChance: 0.2,
  stepSize: 2,
};

// "55% quicker" => ~45% of original duration.
const INSTALL_PROGRESS_BEHAVIOR = scaleProgressBehavior(
  BASE_PROGRESS_BEHAVIOR,
  {
    delayScale: 0.45,
    incrementScale: 1 / 0.45,
    pauseScale: 0.45,
  }
);

const WinRarInstaller: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  const { flags, rebootGame, setFlag, setFlags } = useGameState();
  const [phase, setPhase] = useState<InstallerPhase>(
    flags.hasPurchasedWinRar ? 'installing' : 'purchase'
  );
  const [progress, setProgress] = useState(0);
  const loadingSfxRef = useRef(createLoadingSfxController());

  useEffect(() => {
    if (flags.hasPurchasedWinRar && phase === 'purchase') {
      setPhase('installing');
    }
  }, [flags.hasPurchasedWinRar, phase]);

  useEffect(() => {
    if (phase === 'installing') {
      loadingSfxRef.current.start();
      return;
    }
    loadingSfxRef.current.stop();
  }, [phase]);

  useEffect(
    () => () => {
      loadingSfxRef.current.stop();
    },
    []
  );

  useEffect(() => {
    if (flags.hasWinRarInstalled) {
      setPhase('done');
      setProgress(100);
    }
  }, [flags.hasWinRarInstalled]);

  useEffect(() => {
    if (phase !== 'installing') return;

    setProgress(0);
    let timeoutId: number | null = null;
    let nextProgress = 0;

    const tick = () => {
      const step = getErraticProgressStep(
        nextProgress,
        100,
        INSTALL_PROGRESS_BEHAVIOR
      );
      nextProgress = step.nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setPhase('updatePrompt');
        setFlag('hasWinRarInstalled', true);
        gameEventBus.emit('popup:test_spawn_random', { x: 220, y: 140 });
        return;
      }

      timeoutId = window.setTimeout(tick, step.delayMs);
    };

    timeoutId = window.setTimeout(tick, 300);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [phase]);

  if (phase === 'done') {
    return (
      <div style={panelStyle}>
        WinRAR is installed and ready. You can close this installer.
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {phase === 'purchase' && (
        <div>
          <div style={{ fontWeight: 700 }}>WinRAR Download</div>
          <div style={{ marginTop: '8px' }}>
            Price: <b>${WINRAR_PRICE}</b>
          </div>
          <div style={{ marginTop: '8px' }}>
            Bank balance: <b>${flags.bankBalance}</b>
          </div>
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => {
                if (flags.bankBalance < WINRAR_PRICE) return;
                setFlags({
                  bankBalance: flags.bankBalance - WINRAR_PRICE,
                  hasPurchasedWinRar: true,
                });
              }}
              style={
                flags.bankBalance >= WINRAR_PRICE
                  ? buttonStyle
                  : disabledButtonStyle
              }
              disabled={flags.bankBalance < WINRAR_PRICE}
              type="button"
            >
              Buy & Download
            </button>
            <button onClick={closeWindow} style={buttonStyle} type="button">
              Cancel
            </button>
          </div>
          {flags.bankBalance < WINRAR_PRICE && (
            <div style={{ marginTop: '10px', color: 'maroon' }}>
              Insufficient funds.
            </div>
          )}
        </div>
      )}

      {phase === 'installing' && (
        <div>
          <div>Installing WinRAR...</div>
          <div style={trackStyle}>
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#000080',
              }}
            />
          </div>
        </div>
      )}

      {phase === 'updatePrompt' && (
        <div>
          <div>
            WinRAR is installed, but a suspicious "critical update" is being
            pushed. Clicking update will immediately reboot your machine.
          </div>
          <div style={{ marginTop: '8px' }}>
            Close this window with the titlebar <b>X</b> to continue safely.
          </div>
          <button onClick={rebootGame} style={buttonStyle} type="button">
            Update Now (Reboot)
          </button>
        </div>
      )}
    </div>
  );
};

export default WinRarInstaller;
