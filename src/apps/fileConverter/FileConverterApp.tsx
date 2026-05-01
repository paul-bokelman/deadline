import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Dropdown from '@/components/shared/Dropdown/Dropdown';
import Icon from '@/components/shared/Icon/Icon';
import { getDynamicDesktopItems } from '@/system/desktop/dynamicDesktopItems';
import { useGameState } from '@/game/state';
import { FileTypeId } from '@/types/FileType';
import { AppProps } from '@/types/App';
import { ShellItem } from '@/types/Shell';

const panelStyle: JSX.CSSProperties = {
  padding: '8px',
  backgroundColor: 'var(--plastic)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const boxStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
  padding: '8px',
};

const headerStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 8px',
  color: '#ffffff',
  background:
    'linear-gradient(90deg, var(--dialog-blue) 0%, #0050a8 68%, var(--dialog-gray) 100%)',
  boxShadow: 'var(--bevel-raised)',
};

const paperPanelStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  padding: '8px',
};

const conversionFlowStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 42px 1fr',
  gap: '8px',
  alignItems: 'stretch',
  marginTop: '8px',
};

const fileCardStyle: JSX.CSSProperties = {
  ...paperPanelStyle,
  minWidth: 0,
};

const arrowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-family-sys)',
  fontSize: '24px',
  fontWeight: 700,
  color: 'var(--dialog-blue)',
};

const statusStyle: JSX.CSSProperties = {
  marginTop: '8px',
  padding: '6px 8px',
  backgroundColor: '#ffffe1',
  boxShadow: 'var(--bevel-sunken)',
};

const conversionOptions: Array<{ id: FileTypeId; label: string }> = [
  { id: 'notepadDoc', label: 'Text Document (.txt)' },
  { id: 'jpegFile', label: 'JPEG Image (.jpeg)' },
  { id: 'pngFile', label: 'PNG Image (.png)' },
  { id: 'bmpFile', label: 'Bitmap Image (.bmp)' },
  { id: 'wordpadDoc', label: 'WordPad Document (.rtf)' },
  { id: 'videoFile', label: 'Video File (.avi)' },
  { id: 'waveFile', label: 'Wave Audio (.wav)' },
  { id: 'midiFile', label: 'MIDI Audio (.mid)' },
  { id: 'msDosApp', label: 'MS-DOS Application (.exe)' },
  { id: 'helpFile', label: 'Help File (.hlp)' },
  { id: 'cdTrack', label: 'CD Track (.cda)' },
];

const fileTypeToExtension: Record<FileTypeId, string> = {
  bmpFile: 'bmp',
  cdTrack: 'cda',
  helpFile: 'hlp',
  jpegFile: 'jpeg',
  midiFile: 'mid',
  msDosApp: 'exe',
  notepadDoc: 'txt',
  pngFile: 'png',
  videoFile: 'avi',
  waveFile: 'wav',
  wordpadDoc: 'rtf',
};

const replaceExtension = (fileName: string, nextExtension: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex <= 0) return `${fileName}.${nextExtension}`;
  return `${fileName.slice(0, dotIndex)}.${nextExtension}`;
};

const FileConverterApp: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  const { flags, setFlags } = useGameState();
  const desktopFiles = useMemo<ShellItem[]>(
    () => getDynamicDesktopItems(flags).filter((item) => item.type === 'file'),
    [flags]
  );
  const [selectedFileId, setSelectedFileId] = useState<string>(
    desktopFiles[0]?.id ?? ''
  );
  const [targetType, setTargetType] = useState<FileTypeId>('pngFile');
  const [statusMessage, setStatusMessage] = useState('');

  const selectedFile = useMemo(
    () => desktopFiles.find((entry) => entry.id === selectedFileId) ?? null,
    [desktopFiles, selectedFileId]
  );

  useEffect(() => {
    if (!desktopFiles.length) {
      setSelectedFileId('');
      return;
    }
    if (!desktopFiles.some((entry) => entry.id === selectedFileId)) {
      setSelectedFileId(desktopFiles[0]?.id ?? '');
    }
  }, [desktopFiles, selectedFileId]);

  const canConvert =
    !!selectedFile &&
    selectedFile.type === 'file' &&
    selectedFile.fileTypeId !== targetType;

  const targetOptionLabel =
    conversionOptions.find((option) => option.id === targetType)?.label ??
    targetType;

  return (
    <div data-window-fit style={panelStyle}>
      <div style={headerStyle}>
        <Icon iconId="quickView" size={24} />
        <div>
          <div style={{ fontWeight: 700 }}>File Converter</div>
          <div style={{ fontSize: '11px' }}>
            Enterprise-grade filename optimism module
          </div>
        </div>
      </div>

      <div style={boxStyle}>
        <div style={{ fontWeight: 700 }}>Conversion Wizard</div>
        <div style={{ marginTop: '4px' }}>
          Change a file extension and hope reality follows along. Files found:{' '}
          <b>{desktopFiles.length}</b>
        </div>

        <div style={conversionFlowStyle}>
          <div style={fileCardStyle}>
            <div style={{ fontWeight: 700, marginBottom: '5px' }}>Source</div>
            <div style={{ marginBottom: '4px' }}>File:</div>
            <Dropdown
              id="file-converter-file-select"
              emptyLabel="No files available"
              selected={selectedFileId}
              onChange={(value) => setSelectedFileId(value)}
              options={desktopFiles.map((entry) => ({
                value: entry.id,
                label: entry.name,
              }))}
            />
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Current costume:{' '}
              <b>
                {selectedFile && selectedFile.type === 'file'
                  ? selectedFile.fileTypeId
                  : 'none'}
              </b>
            </div>
          </div>

          <div style={arrowStyle}>-&gt;</div>

          <div style={fileCardStyle}>
            <div style={{ fontWeight: 700, marginBottom: '5px' }}>Target</div>
            <div style={{ marginBottom: '4px' }}>Pretend it is now:</div>
            <Dropdown
              id="file-converter-target-select"
              selected={targetType}
              onChange={(value) => setTargetType(value as FileTypeId)}
              options={conversionOptions.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
            />
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              New label: <b>{targetOptionLabel}</b>
            </div>
          </div>
        </div>

        <div style={statusStyle}>
          {selectedFile
            ? canConvert
              ? 'Ready. The file has no idea what is about to happen.'
              : 'Source and target already match. Even this app has limits.'
            : 'Select a file to begin the ceremonial renaming.'}
        </div>

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            disabled={!canConvert}
            label="Convert"
            onClick={() => {
              if (!selectedFile || selectedFile.type !== 'file') return;
              const nextExtension = fileTypeToExtension[targetType];
              const nextName = replaceExtension(
                selectedFile.name,
                nextExtension
              );
              setFlags({
                dynamicFileTypeOverrides: {
                  ...(flags.dynamicFileTypeOverrides ?? {}),
                  [selectedFile.id]: targetType,
                },
                dynamicFileNameOverrides: {
                  ...(flags.dynamicFileNameOverrides ?? {}),
                  [selectedFile.id]: nextName,
                },
              });
              setStatusMessage(
                `Converted ${selectedFile.name} to ${nextName}. Computers believe what filenames tell them.`
              );
            }}
          />
          <Button label="Close" onClick={closeWindow} />
        </div>
        {!!statusMessage && <div style={statusStyle}>{statusMessage}</div>}
      </div>
    </div>
  );
};

export default FileConverterApp;
