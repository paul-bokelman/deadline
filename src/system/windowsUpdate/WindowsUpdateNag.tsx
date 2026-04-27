import { h, FunctionComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';

import Button from '../../components/shared/Button/Button';
import Window from '../../components/shared/Window/Window';
import { useUpdateScheduler } from './useUpdateScheduler';

const DUE_TIME_TEXT = '5:00 PM';

const formatCountdown = (ms: number): string => {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutesPart = Math.floor(seconds / 60)
    .toString()
    .padStart(1, '0');
  const secondsPart = (seconds % 60).toString().padStart(2, '0');
  return `${minutesPart}:${secondsPart}`;
};

const WindowsUpdateNag: FunctionComponent = () => {
  const {
    countdownMs,
    isNagVisible,
    onRebootNow,
  } = useUpdateScheduler();
  const boundsRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 420, y: 56 });
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isNagVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 98500,
      }}
    >
      <div
        ref={boundsRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {!isMinimized ? (
          <Window
            coords={coords}
            getBoundingElement={() => boundsRef.current}
            iconId="warning"
            isDraggable
            isResizeable={false}
            onClickClose={() => undefined}
            onClickMinimize={() => setIsMinimized(true)}
            onMoved={(nextCoords) => setCoords(nextCoords)}
            size={{ x: 360, y: 170 }}
            showCloseButton={false}
            showMaximizeButton={false}
            style={{ pointerEvents: 'auto' }}
            title="Project Deadline"
            zIndex={98501}
          >
            <div style={{ padding: '8px' }}>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--button-highlight)',
                  boxShadow:
                    'var(--border-sunken-outer), var(--border-sunken-inner)',
                  fontFamily: 'monospace',
                }}
              >
                Due at <b>{DUE_TIME_TEXT}</b> — time remaining:{' '}
                <b>{formatCountdown(countdownMs)}</b>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Button label="Reboot Now" onClick={onRebootNow} />
              </div>
            </div>
          </Window>
        ) : (
          <div
            style={{
              position: 'absolute',
              right: '10px',
              bottom: '42px',
              pointerEvents: 'auto',
              zIndex: 98501,
            }}
          >
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              style={{
                border: 'none',
                backgroundColor: 'var(--surface)',
                boxShadow:
                  'var(--border-raised-outer), var(--border-raised-inner)',
                padding: '4px 10px',
                fontFamily: 'var(--font-family-sys)',
              }}
              title="Restore Project Deadline"
            >
              Project Deadline ({formatCountdown(countdownMs)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WindowsUpdateNag;
