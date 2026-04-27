import { h, FunctionComponent, JSX } from 'preact';

import { AppProps } from '../../types/App';
import { gameEventBus } from '../../game/events';
import { getZipNameForLevel } from '../../game/download/archive';
import { useGameState } from '../../game/state';

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
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

const WinRarExtractor: FunctionComponent<AppProps> = () => {
  const { flags, setFlag } = useGameState();

  const handleFakeProgram = (program: string) => {
    window.alert(`${program} cannot open this archive.`);
  };

  const handleExtract = () => {
    gameEventBus.emit('malware:popup', {
      accountId: 'corpMail',
      source: 'attachment_open',
      sourceEmailId: 'zip-extract',
      subject: 'Zip extraction side effects',
    });

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

  if (!flags.hasWinRarInstalled) {
    return (
      <div style={panelStyle}>
        <div>What program should open this file?</div>
        <div>
          {['Notepad', 'Paint', 'Internet Explorer', 'Solitaire'].map(
            (program) => (
              <button
                key={program}
                onClick={() => handleFakeProgram(program)}
                style={buttonStyle}
                type="button"
              >
                {program}
              </button>
            )
          )}
        </div>
        <div style={{ marginTop: '8px' }}>
          <button disabled style={disabledStyle} type="button">
            WinRAR (not installed)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div>Archive: {getZipNameForLevel(flags.zipExtractionLevel)}</div>
      <div style={{ marginTop: '8px' }}>
        {flags.hasZipFile ? (
          <button onClick={handleExtract} style={buttonStyle} type="button">
            Extract to Desktop
          </button>
        ) : (
          <div>No archive is currently available.</div>
        )}
      </div>
      {flags.hasFinalReportFile && (
        <div style={{ marginTop: '10px' }}>
          Extraction complete. Final report files are now on the desktop.
        </div>
      )}
    </div>
  );
};

export default WinRarExtractor;
