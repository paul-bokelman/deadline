import { h, FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Button from '../../components/shared/Button/Button';
import Window from '../../components/shared/Window/Window';
import { useUpdateScheduler } from './useUpdateScheduler';

const DUE_TIME_TEXT = '5:00 PM';
const INSTALLER_INTERRUPT_EVERY_MS = 75_000;
const INITIAL_DEADLINE_COORDS = { x: 420, y: 56 };
const INITIAL_INSTALL_COORDS = { x: 160, y: 140 };

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
    onRemindLater,
    onRebootNow,
  } = useUpdateScheduler();
  const boundsRef = useRef<HTMLDivElement>(null);
  const deadlineCoordsRef = useRef(INITIAL_DEADLINE_COORDS);
  const [coords, setCoords] = useState(INITIAL_DEADLINE_COORDS);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installCoords, setInstallCoords] = useState(INITIAL_INSTALL_COORDS);

  deadlineCoordsRef.current = coords;

  useEffect(() => {
    if (!isNagVisible) {
      setShowInstallPrompt(false);
      setIsMinimized(false);
      setCoords(INITIAL_DEADLINE_COORDS);
      setInstallCoords(INITIAL_INSTALL_COORDS);
    }
  }, [isNagVisible]);

  useEffect(() => {
    if (!isNagVisible) return;
    const intervalId = window.setInterval(() => {
      const base = deadlineCoordsRef.current;
      setInstallCoords({
        x: Math.min(Math.max(0, base.x + 40), 520),
        y: Math.min(Math.max(0, base.y + 52), 320),
      });
      setShowInstallPrompt(true);
      setIsMinimized(false);
    }, INSTALLER_INTERRUPT_EVERY_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isNagVisible]);

  if (!isNagVisible) return null;

  const handleRebootNow = () => {
    setShowInstallPrompt(false);
    setIsMinimized(false);
    onRebootNow();
  };

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
            title="Windows Update Reminder"
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
                <Button
                  label="Minimize"
                  onClick={() => {
                    setShowInstallPrompt(false);
                    setIsMinimized(true);
                    onRemindLater();
                  }}
                />
                <Button label="Reboot Now" onClick={handleRebootNow} />
              </div>
            </div>
          </Window>
        ) : (
          <div />
        )}
        {showInstallPrompt && (
          <Window
            coords={installCoords}
            getBoundingElement={() => boundsRef.current}
            iconId="warning"
            isDraggable
            isResizeable={false}
            onClickClose={() => undefined}
            onClickMinimize={() => {
              setShowInstallPrompt(false);
              setIsMinimized(true);
              onRemindLater();
            }}
            onMoved={(nextCoords) => setInstallCoords(nextCoords)}
            showCloseButton={false}
            showMaximizeButton={false}
            size={{ x: 360, y: 145 }}
            style={{ pointerEvents: 'auto' }}
            title="Windows Update Setup"
            zIndex={98505}
          >
            <div style={{ padding: '8px' }}>
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--button-highlight)',
                  boxShadow:
                    'var(--border-sunken-outer), var(--border-sunken-inner)',
                }}
              >
                A critical update is ready to install.
                <br />
                Installation reminder will keep appearing until reboot.
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Button
                  label="Minimize"
                  onClick={() => {
                    setShowInstallPrompt(false);
                    setIsMinimized(true);
                    onRemindLater();
                  }}
                />
                <Button label="Reboot now" onClick={handleRebootNow} />
              </div>
            </div>
          </Window>
        )}
      </div>
    </div>
  );
};

export default WindowsUpdateNag;
