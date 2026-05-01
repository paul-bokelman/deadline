import { FunctionComponent, h, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Icon from '@/components/shared/Icon/Icon';
import { getZipNameForLevel } from '@/game/download/archive';
import { useGameState } from '@/game/state';
import { AppProps } from '@/types/App';
import { IconId } from '@/types/Icon';

const panelStyle: JSX.CSSProperties = {
  width: 352,
  padding: '14px 16px 12px',
  backgroundColor: 'var(--plastic)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  minHeight: 0,
  overflow: 'hidden',
};

const introStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '14px',
};

const pickerListStyle: JSX.CSSProperties = {
  height: 150,
  overflowY: 'auto',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--border-field)',
  padding: '0px',
};

const pickerRowStyle = (isSelected: boolean): JSX.CSSProperties => ({
  width: 160,
  border: 'none',
  textAlign: 'left',
  padding: '6px',
  backgroundColor: isSelected ? 'var(--dialog-blue)' : 'transparent',
  color: isSelected ? '#ffffff' : 'inherit',
  fontFamily: 'var(--font-family-ui)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 50,
});

const buttonRowStyle: JSX.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
};

type ProgramOption = {
  id: string;
  label: string;
  iconId: IconId;
};

const truncateMiddle = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value;
  const edgeLength = Math.max(1, Math.floor((maxLength - 3) / 2));
  const start = value.slice(0, edgeLength);
  const end = value.slice(value.length - edgeLength);
  return `${start}...${end}`;
};

const OpenWith: FunctionComponent<AppProps> = ({
  openApp,
  closeWindow,
}: AppProps) => {
  const { flags, rebootGame } = useGameState();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );

  const programOptions = useMemo<ProgramOption[]>(
    () => [
      { id: 'media-player', label: 'Media Player', iconId: 'videoFile' },
      { id: 'paint-98', label: 'Paint', iconId: 'bmpFile' },
      { id: 'hex-viewer', label: 'Hex Viewer', iconId: 'notepadDoc' },
      { id: 'minesweeper', label: 'Minesweeper', iconId: 'minesweeper' },
      {
        id: 'winrar',
        label: flags.hasWinRarInstalled ? 'WinRAR' : 'WinRAR (not installed)',
        iconId: 'winRar3',
      },
    ],
    [flags.hasWinRarInstalled]
  );

  const selectedProgram = useMemo(
    () =>
      programOptions.find((option) => option.id === selectedProgramId) ?? null,
    [programOptions, selectedProgramId]
  );

  const zipDisplayName = useMemo(
    () => truncateMiddle(getZipNameForLevel(flags.zipExtractionLevel), 28),
    [flags.zipExtractionLevel]
  );

  const confirmProgramSelection = (program: ProgramOption | null) => {
    if (!program) return;
    if (program.id !== 'winrar') {
      rebootGame();
      return;
    }
    if (!flags.hasWinRarInstalled) {
      return;
    }
    openApp({ appId: 'winRarArchive' });
    closeWindow();
  };

  return (
    <div data-window-fit style={panelStyle}>
      <div style={introStyle}>
        <Icon iconId="zipFile" size={32} />
        <div style={{ lineHeight: 1.55 }}>
          <div>Choose the program you want to use to open this file:</div>
          <div>
            File:
            <span style={{ fontFamily: 'monospace', marginLeft: '6px' }}>
              {zipDisplayName}
            </span>
          </div>
        </div>
      </div>

      <div style={pickerListStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, max-content)',
            columnGap: 0,
          }}
        >
          {programOptions.map((option) => (
            <button
              key={option.id}
              style={pickerRowStyle(option.id === selectedProgramId)}
              type="button"
              onClick={() => {
                setSelectedProgramId(option.id);
              }}
              onDblClick={() => confirmProgramSelection(option)}
            >
              <Icon iconId={option.iconId} size={32} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={buttonRowStyle}>
        <Button label="Cancel" onClick={closeWindow} />
        <Button
          disabled={
            !selectedProgram ||
            (selectedProgram.id === 'winrar' && !flags.hasWinRarInstalled)
          }
          label="OK"
          onClick={() => confirmProgramSelection(selectedProgram)}
        />
      </div>
    </div>
  );
};

export default OpenWith;
