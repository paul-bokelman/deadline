import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import Dropdown from '@/components/shared/Dropdown/Dropdown';
import { getDynamicDesktopItems } from '@/system/desktop/dynamicDesktopItems';
import { useGameState } from '@/game/state';
import { FileTypeId } from '@/types/FileType';
import { AppProps } from '@/types/App';
import { ShellItem } from '@/types/Shell';

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: 'calc(100% - 16px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const boxStyle: JSX.CSSProperties = {
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '10px',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 8px',
};

const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
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

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700 }}>File Converter</div>
      <div style={boxStyle}>
        <div>Select any file and convert its file type.</div>
        <div style={{ marginTop: '8px' }}>
          Files found: <b>{desktopFiles.length}</b>
        </div>
      </div>
      <div style={boxStyle}>
        <div style={{ marginBottom: '6px' }}>Choose file:</div>
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
        <div style={{ marginTop: '8px', marginBottom: '6px' }}>Convert to:</div>
        <Dropdown
          id="file-converter-target-select"
          selected={targetType}
          onChange={(value) => setTargetType(value as FileTypeId)}
          options={conversionOptions.map((option) => ({
            value: option.id,
            label: option.label,
          }))}
        />
        {selectedFile && selectedFile.type === 'file' && (
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            Current type: <b>{selectedFile.fileTypeId}</b>
          </div>
        )}
        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
          <button
            type="button"
            disabled={!canConvert}
            style={canConvert ? buttonStyle : disabledButtonStyle}
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
                `Converted ${selectedFile.name} to ${nextName}.`
              );
            }}
          >
            Convert
          </button>
          <button type="button" style={buttonStyle} onClick={closeWindow}>
            Close
          </button>
        </div>
        {!!statusMessage && (
          <div style={{ marginTop: '8px', color: '#006400' }}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileConverterApp;
