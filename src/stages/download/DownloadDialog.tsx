import { h, FunctionComponent, JSX } from 'preact';
import { useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Window from '@/components/shared/Window/Window';
import { Z_INDEX_TIERS } from '@/system/zIndex';

interface DownloadDialogProps {
  onReboot: () => void;
  onStartDownload: () => void;
}

const bodyStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  margin: '0 0 6px',
  padding: '10px',
};

const actionsStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
};

const DownloadDialog: FunctionComponent<DownloadDialogProps> = ({
  onReboot,
  onStartDownload,
}) => {
  const [coords, setCoords] = useState({ x: 230, y: 120 });
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setContainerEl}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: Z_INDEX_TIERS.progress,
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <Window
          coords={coords}
          getBoundingElement={() => containerEl}
          iconId="program"
          isDraggable
          isResizeable={false}
          onClickClose={onStartDownload}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          size={{ x: 360, y: 170 }}
          title="Download File"
          zIndex={Z_INDEX_TIERS.progress + 98}
        >
          <div style={{ padding: '8px' }}>
            <div style={bodyStyle}>
              Download request received. Choose an action to continue.
            </div>
            <div style={actionsStyle}>
              <Button label="Download" onClick={onReboot} />
              <Button label="Reboot" onClick={onReboot} />
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};

export default DownloadDialog;
