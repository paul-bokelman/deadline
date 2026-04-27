import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Window from '../../components/shared/Window/Window';
import { createLoadingSfxController } from '../../utils/audio/sfx';
import { getErraticProgressStep } from '../../utils/loading/erraticProgress';

interface ProgressBarWindowProps {
  onFailure: () => void;
}

const containerStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 98000,
};

const panelStyle: JSX.CSSProperties = {
  margin: '10px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
};

const trackStyle: JSX.CSSProperties = {
  width: '100%',
  height: '18px',
  boxShadow: 'var(--border-field)',
  backgroundColor: '#ffffff',
  marginTop: '8px',
};

const PROGRESS_BEHAVIOR = {
  maxDelayMs: 220,
  maxIncrement: 3.8,
  maxPauseMs: 3700,
  minDelayMs: 80,
  minIncrement: 0.4,
  minPauseMs: 1200,
  pauseChance: 0.24,
};

const ProgressBarWindow: FunctionComponent<ProgressBarWindowProps> = ({
  onFailure,
}: ProgressBarWindowProps) => {
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState('Preparing download...');
  const loadingSfxRef = useRef(createLoadingSfxController());

  useEffect(() => {
    loadingSfxRef.current.start();
    return () => {
      loadingSfxRef.current.stop();
    };
  }, []);

  useEffect(() => {
    let timeoutId: number | null = null;
    let waiting = false;

    const scheduleNext = (delayMs: number) => {
      timeoutId = window.setTimeout(tick, delayMs);
    };

    const tick = () => {
      if (waiting) return;

      setProgress((currentProgress) => {
        const target = cycle === 3 ? 100 : 99;
        const { delayMs, nextProgress, paused } = getErraticProgressStep(
          currentProgress,
          target,
          PROGRESS_BEHAVIOR
        );

        if (nextProgress >= target) {
          waiting = true;
          if (cycle === 1 || cycle === 2) {
            setStatus(
              cycle === 1
                ? 'Connection timed out. Retrying...'
                : 'Packet checksum mismatch. Restarting...'
            );
            window.setTimeout(() => {
              setProgress(0);
              setCycle(cycle === 1 ? 2 : 3);
              setStatus('Downloading...');
              waiting = false;
            }, 900);
          } else {
            setStatus('Download failed.');
            loadingSfxRef.current.stop();
            window.setTimeout(() => onFailure(), 2000);
          }
        } else {
          setStatus(paused ? 'Download paused...' : 'Downloading...');
          scheduleNext(delayMs);
        }

        return nextProgress;
      });
    };

    scheduleNext(350);

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [cycle, onFailure]);

  return (
    <div style={containerStyle}>
      <Window
        coords={{ x: 260, y: 190 }}
        iconId="program"
        isDraggable={false}
        isResizeable={false}
        onClickClose={() => undefined}
        size={{ x: 420, y: 140 }}
        title="Download Progress"
        zIndex={99997}
      >
        <div style={panelStyle}>
          <div>{status}</div>
          <div style={trackStyle}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#000080',
                transition: 'width 90ms linear',
              }}
            />
          </div>
          <div style={{ marginTop: '6px' }}>{Math.floor(progress)}%</div>
        </div>
      </Window>
    </div>
  );
};

export default ProgressBarWindow;
