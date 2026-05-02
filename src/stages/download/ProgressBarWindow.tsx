import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Window from '@/components/shared/Window/Window';
import { createLoadingSfxController } from '@/utils/audio/sfx';
import { getErraticProgressStep } from '@/utils/loading/erraticProgress';
import { getRandomDesktopWindowCoords } from '@/system/viewport';
import { Z_INDEX_TIERS } from '@/system/zIndex';

interface ProgressBarWindowProps {
  onClose: () => void;
  onFailure: () => void;
}

const containerStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: Z_INDEX_TIERS.progress,
};

const panelStyle: JSX.CSSProperties = {
  margin: '10px',
  padding: '10px',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
};

const trackStyle: JSX.CSSProperties = {
  width: '100%',
  height: '18px',
  boxShadow: 'var(--border-field)',
  backgroundColor: 'var(--paper)',
  marginTop: '8px',
};

const PROGRESS_BEHAVIOR = {
  // Tuned to land around ~12s total across all three cycles.
  maxDelayMs: 128,
  maxIncrement: 7.5,
  maxPauseMs: 1800,
  minDelayMs: 42,
  minIncrement: 0.8,
  minPauseMs: 525,
  pauseChance: 0.08,
  stepSize: 2,
};

const INITIAL_SIZE = { x: 420, y: 160 };

const ProgressBarWindow: FunctionComponent<ProgressBarWindowProps> = ({
  onClose,
  onFailure,
}: ProgressBarWindowProps) => {
  const [coords, setCoords] = useState(() =>
    getRandomDesktopWindowCoords(INITIAL_SIZE)
  );
  const [size, setSize] = useState(INITIAL_SIZE);
  const [isMaximized, setIsMaximized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState('Preparing download...');
  const timeoutIdsRef = useRef<number[]>([]);
  const loadingSfxRef = useRef(createLoadingSfxController());
  const containerRef = useRef<HTMLDivElement>(null);

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
            }, 250);
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

    scheduleNext(120);

    return () => {
      clearProgressTimeouts();
    };
  }, [cycle, onFailure]);

  return (
    <div ref={containerRef} style={containerStyle}>
      <div style={{ pointerEvents: 'auto' }}>
        <Window
          coords={coords}
          getBoundingElement={() => containerRef.current}
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
          zIndex={Z_INDEX_TIERS.progress + 97}
        >
          <div style={panelStyle}>
            <div>{status}</div>
            <div style={trackStyle}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: '#000080',
                  transition: 'width 140ms steps(6, end)',
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
