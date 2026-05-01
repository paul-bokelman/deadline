import { FunctionComponent, h, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Icon from '@/components/shared/Icon/Icon';
import { getZipNameForLevel } from '@/game/download/archive';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { AppProps } from '@/types/App';

const REMOTE_FIX_SHOWN_EVENT_ID = 'winrar:remote_fix:shown';
const REMOTE_FIX_COMPLETED_EVENT_ID = 'remote_cable_fix:completed';

const panelStyle: JSX.CSSProperties = {
  width: 300,
  padding: '12px',
  backgroundColor: 'var(--plastic)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const fileRowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const fieldStyle: JSX.CSSProperties = {
  flex: 1,
  minWidth: 0,
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--border-field)',
  padding: '5px 7px',
  fontFamily: 'monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const buttonRowStyle: JSX.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
};

const WinRarArchive: FunctionComponent<AppProps> = ({
  closeWindow,
  openApp,
}) => {
  const { flags, hasEventFired, markEventFired, setFlag } = useGameState();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const zipName = useMemo(() => getZipNameForLevel(flags.zipExtractionLevel), [
    flags.zipExtractionLevel,
  ]);
  const extractionCount = Math.max(
    0,
    Math.min(2, flags.zipExtractionLevel - 1)
  );

  const handleDelete = () => {
    setFlag('hasZipFile', false);
    closeWindow();
  };

  const handleExtract = () => {
    if (!hasEventFired(REMOTE_FIX_COMPLETED_EVENT_ID)) {
      if (!hasEventFired(REMOTE_FIX_SHOWN_EVENT_ID)) {
        markEventFired(REMOTE_FIX_SHOWN_EVENT_ID);
      }
      openApp({ appId: 'remoteDesktopCableFix' });
      setStatusMessage('Extraction paused: remote desktop cable disconnected.');
      return;
    }

    gameEventBus.emit('popup:test_spawn_random', { x: 180, y: 120 });
    gameEventBus.emit('popup:test_spawn_random', { x: 240, y: 180 });
    setStatusMessage(null);

    if (flags.zipExtractionLevel <= 1) {
      setFlag('zipExtractionLevel', 2);
      setFlag('zipGarbageBatch', 1);
      return;
    }

    if (flags.zipExtractionLevel === 2) {
      setFlag('zipExtractionLevel', 3);
      setFlag('zipGarbageBatch', 2);
      return;
    }

    setFlag('hasZipFile', false);
    setFlag('zipGarbageBatch', 3);
    setFlag('hasFinalReportFile', true);
    closeWindow();
  };

  return (
    <div data-window-fit style={panelStyle}>
      <div style={fileRowStyle}>
        <Icon iconId="zipFile" size={32} />
        <div style={fieldStyle} title={zipName}>
          {zipName}
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            backgroundColor: 'var(--paper)',
            boxShadow: 'var(--border-field)',
            padding: '6px 8px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {statusMessage}
        </div>
      )}

      <div style={buttonRowStyle}>
        <Button label="Delete" onClick={handleDelete} />
        <Button
          label={`Extract (${extractionCount}/3)`}
          onClick={handleExtract}
        />
      </div>
    </div>
  );
};

export default WinRarArchive;
