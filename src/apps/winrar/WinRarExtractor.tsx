import { h, FunctionComponent, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';
import { gameEventBus } from '../../game/events';
import { getZipNameForLevel } from '../../game/download/archive';
import { useGameState } from '../../game/state';

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: 'calc(100% - 16px)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  minHeight: 0,
  overflowY: 'auto',
};

const groupStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  padding: '8px',
  minHeight: 0,
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 8px',
  margin: '4px 4px 0 0',
};

const disabledStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const pickerListStyle: JSX.CSSProperties = {
  marginTop: '6px',
  flex: 1,
  minHeight: 80,
  overflowY: 'auto',
  backgroundColor: '#ffffff',
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
});

type ProgramOption = {
  id: string;
  label: string;
  requiresInstall?: boolean;
  isExtractor?: boolean;
};

const WinRarExtractor: FunctionComponent<AppProps> = () => {
  const { flags, setFlag } = useGameState();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [hasConfirmedProgram, setHasConfirmedProgram] = useState(false);
  const [uiStatusMessage, setUiStatusMessage] = useState<string | null>(null);

  const programOptions = useMemo<ProgramOption[]>(
    () => [
      { id: 'media-player', label: 'Media Player' },
      { id: 'paint-98', label: 'Paint 98' },
      { id: 'hex-viewer', label: 'Hex Viewer' },
      { id: 'minesweeper', label: 'Minesweeper' },
      { id: 'wordpad', label: 'WordPad' },
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
    () => programOptions.find((option) => option.id === selectedProgramId) ?? null,
    [programOptions, selectedProgramId]
  );

  const handleFakeProgram = (program: string) => {
    setUiStatusMessage(
      `${program} cannot open this archive. Install WinRAR to continue.`
    );
  };

  const handleExtract = () => {
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
      setUiStatusMessage('WinRAR is not installed yet.');
      setHasConfirmedProgram(false);
      return;
    }
    setUiStatusMessage('WinRAR selected. Ready to extract.');
    setHasConfirmedProgram(true);
  };

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700 }}>Open With</div>
      <div style={{ marginTop: '6px' }}>
        Choose the program to open:
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
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            style={selectedProgram ? buttonStyle : disabledStyle}
            disabled={!selectedProgram}
            onClick={confirmProgramSelection}
          >
            Use selected program
          </button>
        </div>
      </div>
      <div style={groupStyle}>
        {hasConfirmedProgram && selectedProgram?.isExtractor ? (
          <div>
            <div style={{ marginBottom: '8px' }}>
              WinRAR selected for extraction.
            </div>
            {flags.hasZipFile ? (
              <button onClick={handleExtract} style={buttonStyle} type="button">
                Extract to Desktop
              </button>
            ) : (
              <div>No archive is currently available.</div>
            )}
          </div>
        ) : (
          <div style={{ color: 'var(--button-shadow)' }}>
            Select and confirm WinRAR to enable extraction.
          </div>
        )}
      </div>
      {flags.hasFinalReportFile && (
        <div style={{ marginTop: '10px' }}>
          Extraction complete. Final report files are now on the desktop.
        </div>
      )}
      {!flags.hasWinRarInstalled && (
        <div style={{ marginTop: '8px', color: 'maroon' }}>
          WinRAR must be installed first.
        </div>
      )}
      {uiStatusMessage && (
        <div
          style={{
            marginTop: '8px',
            backgroundColor: 'var(--surface)',
            boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
            padding: '6px 8px',
            fontFamily: 'monospace',
          }}
        >
          {uiStatusMessage}
        </div>
      )}
    </div>
  );
};

export default WinRarExtractor;
