import { h, FunctionComponent } from 'preact';
import { createRef } from 'preact';

import Button from '../../components/shared/Button/Button';
import useDragging from '../../hooks/useDragging';
import { useUpdateScheduler } from './useUpdateScheduler';

const formatCountdown = (ms: number): string => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
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
    onRemindLater,
    onRestartNow,
  } = useUpdateScheduler();
  const panelRef = createRef<HTMLDivElement>();
  const dragHandleRef = createRef<HTMLDivElement>();

  const getBoundingElement = () => panelRef.current?.parentElement ?? null;
  const getDragHandleElement = () => dragHandleRef.current ?? null;

  const coords = useDragging(getDragHandleElement, {
    getBoundingElt: getBoundingElement,
    initialCoords: { x: 420, y: 56 },
    isEnabled: isNagVisible,
  });

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
        ref={panelRef}
        style={{
          width: '320px',
          backgroundColor: 'var(--surface)',
          boxShadow: 'var(--border-window-outer), var(--border-window-inner)',
          padding: '3px',
          position: 'absolute',
          pointerEvents: 'auto',
          transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
        }}
      >
        <div
          ref={dragHandleRef}
          style={{
            background:
              'linear-gradient(90deg, var(--dialog-blue) 0%, var(--dialog-gray) 100%)',
            color: '#ffffff',
            fontWeight: 'bold',
            padding: '3px 6px',
            cursor: 'move',
          }}
        >
          Windows Update
        </div>
        <div
          style={{
            marginTop: '6px',
            padding: '10px',
            backgroundColor: 'var(--button-highlight)',
            boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
          }}
        >
          <div>
            Windows will restart in {formatCountdown(countdownMs)} to install
            updates.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Button label="Restart Now" onClick={onRestartNow} />
            <Button label="Remind me later" onClick={onRemindLater} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindowsUpdateNag;
