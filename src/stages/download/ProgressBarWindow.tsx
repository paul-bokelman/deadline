import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import Window from '../../components/shared/Window/Window';

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

const ProgressBarWindow: FunctionComponent<ProgressBarWindowProps> = ({
  onFailure,
}: ProgressBarWindowProps) => {
  const [progress, setProgress] = useState(0);
  const [cycle, setCycle] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState('Preparing download...');

  useEffect(() => {
    let intervalId: number | null = null;
    let waiting = false;

    intervalId = window.setInterval(() => {
      if (waiting) return;
      setProgress((currentProgress) => {
        const target = cycle === 3 ? 100 : 99;
        const nextProgress = Math.min(currentProgress + target / 60, target);

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
            }, 600);
          } else {
            setStatus('Download failed.');
            if (intervalId !== null) {
              window.clearInterval(intervalId);
            }
            window.setTimeout(() => onFailure(), 2000);
          }
        }

        return nextProgress;
      });
    }, 100);

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [cycle, onFailure]);

  useEffect(() => {
    if (cycle === 1 && progress < 99) setStatus('Downloading...');
  }, [cycle, progress]);

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
