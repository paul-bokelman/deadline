import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Window from '../../components/shared/Window/Window';
import { createLoadingSfxController } from '../../utils/audio/sfx';
import { getErraticProgressStep } from '../../utils/loading/erraticProgress';

interface ProgressBarWindowProps {
  onClose: () => void;
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
  onClose,
  onFailure,
}: ProgressBarWindowProps) => {
  const [coords, setCoords] = useState({ x: 260, y: 190 });
  const [size, setSize] = useState({ x: 420, y: 160 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState('Preparing download...');
  const timeoutIdsRef = useRef<number[]>([]);
  const loadingSfxRef = useRef(createLoadingSfxController());

  const clearProgressTimeouts = () => {
    timeoutIdsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId)
    );
    timeoutIdsRef.current = [];
  };

  const scheduleProgressTimeout = (callback: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(callback, delayMs);
    timeoutIdsRef.current = [...timeoutIdsRef.current, timeoutId];
    return timeoutId;
  };

  const toggleMaximized = () => {
    setIsMaximized((currentIsMaximized) => !currentIsMaximized);
  };

  useEffect(() => {
    const loadingSfx = loadingSfxRef.current;

    loadingSfx.start();
    return () => {
      loadingSfx.stop();
    };
  }, []);

  useEffect(() => {
    let waiting = false;

    const scheduleNext = (delayMs: number) => {
      scheduleProgressTimeout(tick, delayMs);
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
            scheduleProgressTimeout(() => {
              setProgress(0);
              setCycle(cycle === 1 ? 2 : 3);
              setStatus('Downloading...');
              waiting = false;
            }, 900);
          } else {
            setStatus('Download failed.');
            loadingSfxRef.current.stop();
            scheduleProgressTimeout(() => onFailure(), 2000);
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
      clearProgressTimeouts();
    };
  }, [cycle, onFailure]);

  return (
    <div style={containerStyle}>
      <div style={{ pointerEvents: 'auto' }}>
        <Window
          coords={coords}
          iconId="program"
          isDraggable
          isMaximized={isMaximized}
          isResizeable
          onClickClose={onClose}
          onClickMaximize={() => setIsMaximized(true)}
          onClickRestore={() => setIsMaximized(false)}
          onDblClickTitleBar={toggleMaximized}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          onResized={(nextSize) => setSize(nextSize)}
          size={size}
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
    </div>
  );
};

export default ProgressBarWindow;
