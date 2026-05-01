import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Window from '@/components/shared/Window/Window';
import { Z_INDEX_TIERS } from '../zIndex';
import { useUpdateScheduler } from './useUpdateScheduler';

const POPUP_WIDTH = 280;
const POPUP_HEIGHT = 132;
const TOP_MARGIN = 14;
const RIGHT_MARGIN = 14;

const WindowsUpdateNag: FunctionComponent = () => {
  const boundsRef = useRef<HTMLDivElement>(null);
  const {
    isNagVisible,
    onDismissNag,
    onRemindLater,
    onRebootNow,
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

  useEffect(() => {
    if (!isNagVisible) return;
    setCoords({
      x: Math.max(0, window.innerWidth - size.x - RIGHT_MARGIN),
      y: TOP_MARGIN,
    });
  }, [isNagVisible, size.x]);

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
        isResizeable
        onClickClose={onDismissNag}
        onClickMinimize={onDismissNag}
        onMoved={setCoords}
        onResized={setSize}
        showMaximizeButton={false}
        size={size}
        style={{
          pointerEvents: 'auto',
        }}
        title="Required Windows Update"
        zIndex={Z_INDEX_TIERS.systemOverlay + 1}
      >
        <div style={{ padding: '8px' }}>
          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--paper)',
              boxShadow: 'var(--bevel-sunken)',
            }}
          >
            Required Windows update.
            <br />
            Restart required.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Button label="Remind me later" onClick={onRemindLater} />
            <Button label="Update now" onClick={onRebootNow} />
          </div>
        </div>
      </Window>
    </div>
  );
};

export default WindowsUpdateNag;
