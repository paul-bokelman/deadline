import { h, FunctionComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';

import Button from '../../components/shared/Button/Button';
import Window from '../../components/shared/Window/Window';
import { useUpdateScheduler } from './useUpdateScheduler';

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
        <Window
          coords={coords}
          getBoundingElement={() => boundsRef.current}
          iconId="warning"
          isDraggable
          isResizeable={false}
          onClickClose={() => undefined}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          size={{ x: 340, y: 160 }}
          showCloseButton={false}
          showMaximizeButton={false}
          style={{ pointerEvents: 'auto' }}
          title="Windows Update"
          zIndex={98501}
        >
          <div style={{ padding: '8px' }}>
            <div
              style={{
                padding: '10px',
                backgroundColor: 'var(--button-highlight)',
                boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
              }}
            >
              Windows will reboot in {formatCountdown(countdownMs)} to install
              updates.
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <Button label="Reboot Now" onClick={onRebootNow} />
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};

export default WindowsUpdateNag;
