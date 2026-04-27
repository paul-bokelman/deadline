import { h, FunctionComponent, JSX } from 'preact';
import { useState } from 'preact/hooks';

import Button from '../../components/shared/Button/Button';
import Window from '../../components/shared/Window/Window';

interface DownloadDialogProps {
  onReboot: () => void;
  onStartDownload: () => void;
}

const bodyStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  margin: '0 0 6px',
  padding: '10px',
};

const actionsStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
};

type ConfirmDialogState = 'none' | 'reboot' | 'cancel-first' | 'cancel-second';

const DownloadDialog: FunctionComponent<DownloadDialogProps> = ({
  onReboot,
  onStartDownload,
}: DownloadDialogProps) => {
  const [coords, setCoords] = useState({ x: 230, y: 120 });
  const [confirmDialogState, setConfirmDialogState] =
    useState<ConfirmDialogState>('none');

  const handleReboot = () => {
    setConfirmDialogState('reboot');
  };

  const handleClose = () => {
    setConfirmDialogState('cancel-first');
  };

  const handleConfirmYes = () => {
    if (confirmDialogState === 'reboot') {
      setConfirmDialogState('none');
      onReboot();
      return;
    }

    if (confirmDialogState === 'cancel-first') {
      setConfirmDialogState('cancel-second');
      return;
    }

    if (confirmDialogState === 'cancel-second') {
      setConfirmDialogState('none');
      onStartDownload();
    }
  };

  const getConfirmMessage = (): string => {
    if (confirmDialogState === 'reboot') {
      return 'Are you sure you want to reboot? Unsaved progress will be lost.';
    }
    if (confirmDialogState === 'cancel-first') {
      return 'Are you sure you want to cancel?';
    }
    return 'Really cancel? Your download will be lost.';
  };

  const getConfirmYesLabel = (): string => {
    if (confirmDialogState === 'cancel-second') return 'Yes, cancel';
    return 'Yes';
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 98000,
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <Window
          coords={coords}
          iconId="program"
          isDraggable
          isResizeable={false}
          onClickClose={handleClose}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          size={{ x: 360, y: 170 }}
          title="Download File"
          zIndex={99998}
        >
          <div style={{ padding: '8px' }}>
            <div style={bodyStyle}>
              Download request received. Choose an action to continue.
            </div>
            <div style={actionsStyle}>
              <Button label="Download" onClick={handleReboot} />
              <Button label="Reboot" onClick={handleReboot} />
            </div>
          </div>
        </Window>
      </div>
      {confirmDialogState !== 'none' && (
        <div style={{ pointerEvents: 'auto' }}>
          <Window
            coords={{ x: 280, y: 180 }}
            iconId="warning"
            isDraggable={false}
            isResizeable={false}
            onClickClose={() => setConfirmDialogState('none')}
            size={{ x: 360, y: 145 }}
            title="Confirm"
            zIndex={99999}
          >
            <div style={{ padding: '8px' }}>
              <div style={bodyStyle}>{getConfirmMessage()}</div>
              <div style={actionsStyle}>
                <Button
                  label={getConfirmYesLabel()}
                  onClick={() => handleConfirmYes()}
                />
                <Button
                  label="No"
                  onClick={() => setConfirmDialogState('none')}
                />
              </div>
            </div>
          </Window>
        </div>
      )}
    </div>
  );
};

export default DownloadDialog;
