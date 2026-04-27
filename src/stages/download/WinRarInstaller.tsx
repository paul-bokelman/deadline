import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';
import { useGameState } from '../../game/state';

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

const WinRarInstaller: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    setFlag,
    triggerSkypeCall,
  } = useGameState();
  const [phase, setPhase] = useState<InstallerPhase>('installing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (flags.hasWinRarInstalled) {
      setPhase('done');
      setProgress(100);
    }
  }, [flags.hasWinRarInstalled]);

  useEffect(() => {
    if (phase !== 'installing') return;
    const startedAt = Date.now();
    const durationMs = 4000;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(
        100,
        Math.round((elapsed / durationMs) * 100)
      );
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
        setPhase('updatePrompt');
      }
    }, 120);

    return () => window.clearInterval(intervalId);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'updating') return;
    setProgress(0);
    const startedAt = Date.now();
    const durationMs = 3000;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(
        100,
        Math.round((elapsed / durationMs) * 100)
      );
      setProgress(nextProgress);
      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
        setPhase('complete');
        setFlag('hasWinRarInstalled', true);
        setFlag('hasZipFile', false);
        setFlag('zipExtractionLevel', 1);
        setFlag('zipGarbageBatch', 0);

        if (!hasEventFired('download:it_guy_angry_1:scheduled')) {
          markEventFired('download:it_guy_angry_1:scheduled');
          window.setTimeout(() => {
            triggerSkypeCall('it_guy_angry_1');
          }, 3000);
        }
      }
    }, 120);

    return () => window.clearInterval(intervalId);
  }, [
    phase,
    hasEventFired,
    markEventFired,
    setFlag,
    triggerSkypeCall,
    closeWindow,
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
