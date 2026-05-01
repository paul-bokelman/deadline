import { h, FunctionComponent, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import { AppProps } from '@/types/App';
import { gameEventBus } from '@/game/events';
import { getZipNameForLevel } from '@/game/download/archive';
import { useGameState } from '@/game/state';

const REMOTE_FIX_SHOWN_EVENT_ID = 'winrar:remote_fix:shown';
const REMOTE_FIX_COMPLETED_EVENT_ID = 'remote_cable_fix:completed';

const panelStyle: JSX.CSSProperties = {
  padding: '8px',
  backgroundColor: 'var(--plastic)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minHeight: 0,
  overflowY: 'auto',
};

const groupStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
  padding: '8px',
  minHeight: 0,
};

const pickerListStyle: JSX.CSSProperties = {
  marginTop: '6px',
  flex: 1,
  minHeight: 112,
  overflowY: 'auto',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--border-field)',
  padding: '4px',
};

const pickerRowStyle = (isSelected: boolean): JSX.CSSProperties => ({
  width: '100%',
  border: 'none',
  textAlign: 'left',
  padding: '4px 6px',
  marginBottom: '2px',
  backgroundColor: isSelected ? 'var(--dialog-blue)' : 'transparent',
  color: isSelected ? '#ffffff' : 'inherit',
  fontFamily: 'var(--font-family-ui)',
});

type ProgramOption = {
  id: string;
  label: string;
  requiresInstall?: boolean;
  isExtractor?: boolean;
};

const WinRarExtractor: FunctionComponent<AppProps> = ({
  openApp,
}: AppProps) => {
  const { flags, hasEventFired, markEventFired, setFlag } = useGameState();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );
  const [hasConfirmedProgram, setHasConfirmedProgram] = useState(false);
  const [uiStatusMessage, setUiStatusMessage] = useState<string | null>(null);

  const programOptions = useMemo<ProgramOption[]>(
    () => [
      { id: 'media-player', label: 'Media Player' },
      { id: 'paint-98', label: 'Paint 98' },
      { id: 'hex-viewer', label: 'Hex Viewer' },
      { id: 'minesweeper', label: 'Minesweeper' },
      {
        id: 'winrar',
        label: flags.hasWinRarInstalled ? 'WinRAR' : 'WinRAR (not installed)',
        requiresInstall: true,
        isExtractor: true,
      },
    ],
    [flags.hasWinRarInstalled]
  );

  const selectedProgram = useMemo(
    () =>
      programOptions.find((option) => option.id === selectedProgramId) ?? null,
    [programOptions, selectedProgramId]
  );

  const handleFakeProgram = (program: string) => {
    setUiStatusMessage(
      `${program} stared at the archive and blinked. Install WinRAR to continue.`
    );
  };

  const handleExtract = () => {
    if (!flags.hasWinRarInstalled) {
      setUiStatusMessage(
        flags.hasReceivedWinRarLinkEmail
          ? 'WinRAR is not installed yet.\nA download link has been emailed to you, which is how software worked before joy.'
          : 'WinRAR is not installed yet. This archive is wearing a tiny locked hat.'
      );
      return;
    }

    if (!hasEventFired(REMOTE_FIX_COMPLETED_EVENT_ID)) {
      if (!hasEventFired(REMOTE_FIX_SHOWN_EVENT_ID)) {
        markEventFired(REMOTE_FIX_SHOWN_EVENT_ID);
      }
      openApp({ appId: 'remoteDesktopCableFix' });
      setUiStatusMessage(
        'Extraction paused: Remote desktop cable disconnected.\nThe cable is remote, but the problem is local to your day.'
      );
      return;
    }

    gameEventBus.emit('popup:test_spawn_random', { x: 180, y: 120 });
    gameEventBus.emit('popup:test_spawn_random', { x: 240, y: 180 });

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
  };

  const confirmProgramSelection = () => {
    if (!selectedProgram) return;
    if (selectedProgram.id !== 'winrar') {
      handleFakeProgram(selectedProgram.label);
      setHasConfirmedProgram(false);
      return;
    }
    if (!flags.hasWinRarInstalled) {
      if (!flags.hasReceivedWinRarLinkEmail) {
        setFlag('hasReceivedWinRarLinkEmail', true);
        gameEventBus.emit('email:delivered', {
          emailId: 'corp-winrar-download-link',
        });
        gameEventBus.emit('email:delivered', {
          emailId: 'corp-winrar-download-link-fake',
        });
      }
      setUiStatusMessage(
        flags.hasReceivedWinRarLinkEmail
          ? 'WinRAR selected.\nClick Extract to Desktop and pretend this is normal.'
          : 'WinRAR selected.\nDownload link sent to your email. The real installer is probably the second one. Probably.'
      );
      setHasConfirmedProgram(true);
      return;
    }
    setUiStatusMessage('WinRAR selected. Tiny books successfully recognized.');
    setHasConfirmedProgram(true);
  };

  return (
    <div data-window-fit style={panelStyle}>
      <div style={{ fontWeight: 700 }}>Open With</div>
      <div>
        Choose the program that should panic at:
        <span style={{ fontFamily: 'monospace', marginLeft: '6px' }}>
          {getZipNameForLevel(flags.zipExtractionLevel)}
        </span>
      </div>
      <div
        style={{
          ...groupStyle,
          display: 'flex',
          flexDirection: 'column',
          flex: '1 1 180px',
        }}
      >
        <div style={{ fontWeight: 700 }}>Registered Programs</div>
        <div style={pickerListStyle}>
          {programOptions.map((option) => (
            <button
              key={option.id}
              style={pickerRowStyle(option.id === selectedProgramId)}
              type="button"
              onClick={() => {
                setSelectedProgramId(option.id);
                setHasConfirmedProgram(false);
                setUiStatusMessage(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
          }}
        >
          <Button
            disabled={!selectedProgram}
            label="Use selected program"
            onClick={confirmProgramSelection}
          />
        </div>
      </div>
      <div style={groupStyle}>
        {hasConfirmedProgram && selectedProgram?.isExtractor ? (
          <div>
            <div style={{ marginBottom: '8px' }}>
              WinRAR selected. Archive morale is low.
            </div>
            {flags.hasZipFile ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                <Button label="Extract to Desktop" onClick={handleExtract} />
              </div>
            ) : (
              <div>No archive is currently available. It escaped.</div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--button-shadow)' }}>
            Select and confirm WinRAR to unlock the compressed nonsense.
          </div>
        )}
      </div>
      {flags.hasFinalReportFile && (
        <div style={{ marginTop: '10px' }}>
          Extraction complete. Final report files are now on the desktop, where
          important business belongs.
        </div>
      )}
      {!flags.hasWinRarInstalled && (
        <div style={{ marginTop: '8px', color: 'maroon' }}>
          WinRAR must be installed first. The archive refuses to speak to
          amateurs.
        </div>
      )}
      {uiStatusMessage && (
        <div
          style={{
            marginTop: '8px',
            backgroundColor: 'var(--plastic)',
            boxShadow: 'var(--bevel-group)',
            padding: '6px 8px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {uiStatusMessage}
        </div>
      )}
    </div>
  );
};

export default WinRarExtractor;
