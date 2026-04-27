import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';
import { useGameState } from '../../game/state';
import { createLoadingSfxController } from '../../utils/audio/sfx';
import { getErraticProgressStep } from '../../utils/loading/erraticProgress';

type InstallerPhase =
  | 'installing'
  | 'updatePrompt'
  | 'updating'
  | 'complete'
  | 'done';

const trackStyle: JSX.CSSProperties = {
  width: '100%',
  height: '18px',
  boxShadow: 'var(--border-field)',
  backgroundColor: '#ffffff',
  marginTop: '8px',
};

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 8px',
  marginTop: '10px',
};

const INSTALL_PROGRESS_BEHAVIOR = {
  maxDelayMs: 260,
  maxIncrement: 4.8,
  maxPauseMs: 3600,
  minDelayMs: 90,
  minIncrement: 0.6,
  minPauseMs: 1300,
  pauseChance: 0.2,
};

const WinRarInstaller: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    setFlag,
    triggerNetVoiceCall,
  } = useGameState();
  const [phase, setPhase] = useState<InstallerPhase>('installing');
  const [progress, setProgress] = useState(0);
  const loadingSfxRef = useRef(createLoadingSfxController());

  useEffect(() => {
    if (phase === 'installing' || phase === 'updating') {
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
        return;
      }

      timeoutId = window.setTimeout(tick, step.delayMs);
    };

    timeoutId = window.setTimeout(tick, 300);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'updating') return;

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
        setPhase('complete');
        setFlag('hasWinRarInstalled', true);
        setFlag('hasZipFile', false);
        setFlag('zipExtractionLevel', 1);
        setFlag('zipGarbageBatch', 0);

        if (!hasEventFired('download:it_guy_angry_1:scheduled')) {
          markEventFired('download:it_guy_angry_1:scheduled');
          window.setTimeout(() => {
            triggerNetVoiceCall('it_guy_angry_1');
          }, 3000);
        }
        return;
      }

      timeoutId = window.setTimeout(tick, step.delayMs);
    };

    timeoutId = window.setTimeout(tick, 300);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [
    phase,
    hasEventFired,
    markEventFired,
    setFlag,
    triggerNetVoiceCall,
  ]);

  if (phase === 'done') {
    return (
      <div style={panelStyle}>
        WinRAR is installed and ready. You can close this installer.
      </div>
    );
  }

  return (
    <div style={panelStyle}>
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
            WinRAR requires a software update before it can be used. Update now?
          </div>
          <button onClick={() => setPhase('updating')} style={buttonStyle}>
            Update Now
          </button>
        </div>
      )}

      {phase === 'updating' && (
        <div>
          <div>Updating...</div>
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

      {phase === 'complete' && (
        <div>
          <div>
            Update complete. ALL .ZIP FILES HAVE BEEN REMOVED FROM THIS COMPUTER
            FOR SECURITY REASONS.
          </div>
          <button onClick={closeWindow} style={buttonStyle}>
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default WinRarInstaller;
