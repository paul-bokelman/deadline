import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Window from '@/components/shared/Window/Window';
import { Z_INDEX_TIERS } from '../zIndex';
import { useUpdateScheduler } from './useUpdateScheduler';

const POPUP_WIDTH = 360;
const POPUP_HEIGHT = 196;
const TOP_MARGIN = 14;
const RIGHT_MARGIN = 14;

const panelStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  margin: '0 0 8px',
  padding: '10px',
};

const actionsStyle: JSX.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
};

const progressTrackStyle: JSX.CSSProperties = {
  width: '100%',
  height: '16px',
  boxShadow: 'var(--border-field)',
  backgroundColor: 'var(--paper)',
  marginTop: '8px',
};

const WindowsUpdateNag: FunctionComponent = () => {
  const boundsRef = useRef<HTMLDivElement>(null);
  const {
    isNagVisible,
    isDownloadingUpdate,
    onDismissNag,
    onDownloadUpdate,
  } = useUpdateScheduler();

  const popupCoords = useMemo(
    () => ({
      x: Math.max(0, window.innerWidth - POPUP_WIDTH - RIGHT_MARGIN),
      y: TOP_MARGIN,
    }),
    []
  );
  const [coords, setCoords] = useState(popupCoords);
  const [size, setSize] = useState({ x: POPUP_WIDTH, y: POPUP_HEIGHT });
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!isNagVisible) return;
    setCoords({
      x: Math.max(0, window.innerWidth - size.x - RIGHT_MARGIN),
      y: TOP_MARGIN,
    });
  }, [isNagVisible, size.x]);

  useEffect(() => {
    if (!isDownloadingUpdate) {
      setDownloadProgress(0);
      return;
    }

    setDownloadProgress(0);
    const frame = window.requestAnimationFrame(() => {
      setDownloadProgress(100);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isDownloadingUpdate]);

  if (!isNagVisible) return null;

  return (
    <div
      ref={boundsRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: Z_INDEX_TIERS.systemOverlay,
      }}
    >
      <Window
        coords={coords}
        getBoundingElement={() => boundsRef.current}
        iconId="warning"
        isResizeable={false}
        onClickClose={onDismissNag}
        onClickMinimize={onDismissNag}
        onMoved={setCoords}
        onResized={setSize}
        showMaximizeButton={false}
        size={size}
        style={{
          pointerEvents: 'auto',
        }}
        title="WinRAR Update Available"
        zIndex={Z_INDEX_TIERS.systemOverlay + 1}
      >
        <div style={{ padding: '8px' }}>
          <div style={panelStyle}>
            <div>A WinRAR update is available.</div>
            <div style={{ marginTop: '6px' }}>
              Click <b>Download</b> to install the update and reboot.
            </div>

            {isDownloadingUpdate && (
              <div style={{ marginTop: '8px' }}>
                <div>Downloading update...</div>
                <div style={progressTrackStyle}>
                  <div
                    style={{
                      width: `${downloadProgress}%`,
                      height: '100%',
                      backgroundColor: '#000080',
                      transition: 'width 3000ms linear',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <div style={actionsStyle}>
            <Button
              disabled={isDownloadingUpdate}
              label={isDownloadingUpdate ? 'Downloading...' : 'Download'}
              onClick={onDownloadUpdate}
            />
          </div>
        </div>
      </Window>
    </div>
  );
};

export default WindowsUpdateNag;
