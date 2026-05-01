import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Dropdown from '@/components/shared/Dropdown/Dropdown';
import { getDynamicDesktopItems } from '@/system/desktop/dynamicDesktopItems';
import { useGameState } from '@/game/state';
import { FileTypeId } from '@/types/FileType';
import { AppProps } from '@/types/App';
import { ShellItem } from '@/types/Shell';

const panelStyle: JSX.CSSProperties = {
  width: '520px',
  height: '300px',
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
  padding: '10px',
  minHeight: 0,
};

const scrollBoxStyle: JSX.CSSProperties = {
  ...boxStyle,
  flex: 1,
  overflowY: 'auto',
};

const paperPanelStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  padding: '8px',
};

const conversionFlowStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 32px 1fr',
  gap: '8px',
  alignItems: 'stretch',
  marginTop: '8px',
};

const fileCardStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
  padding: '8px',
  minWidth: 0,
};

const arrowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-family-sys)',
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--dialog-blue)',
};

const statusStyle: JSX.CSSProperties = {
  marginTop: '8px',
  padding: '6px 8px',
  backgroundColor: '#ffffe1',
  boxShadow: 'var(--bevel-sunken)',
};

const notesStyle: JSX.CSSProperties = {
  marginTop: '6px',
  padding: '6px 8px',
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-status-well)',
};

const printPanelStyle: JSX.CSSProperties = {
  ...paperPanelStyle,
  marginTop: '8px',
};

const progressTrackStyle: JSX.CSSProperties = {
  height: '17px',
  marginTop: '8px',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--border-field)',
};

type ConversionStage = 'idle' | 'sentiment' | 'print' | 'printing' | 'complete';

const FINAL_REPORT_ID = 'q3-real-report';
const FINAL_REPORT_PNG_NAME =
  'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.png';

const PRINT_PROGRESS_MESSAGES = [
  'Spooling lies...',
  'Rasterizing blame...',
  'Flattening accountability...',
  'Exporting executive pixels...',
  'Creating backups nobody asked for...',
];

const conversionOptions: Array<{ id: FileTypeId; label: string }> = [
  { id: 'notepadDoc', label: 'Text Document (.txt)' },
  { id: 'jpegFile', label: 'JPEG Image (.jpeg)' },
  { id: 'pngFile', label: 'PNG Image (.png)' },
  { id: 'bmpFile', label: 'Bitmap Image (.bmp)' },
  { id: 'wordpadDoc', label: 'Executive Memo Lump (.rtf)' },
  { id: 'msDosApp', label: 'Virus (.vrs)' },
  { id: 'waveFile', label: 'Wave Audio (.wav)' },
];

const fileTypeToExtension: Record<FileTypeId, string> = {
  bmpFile: 'bmp',
  cdTrack: 'cda',
  helpFile: 'hlp',
  jpegFile: 'jpeg',
  midiFile: 'mid',
  msDosApp: 'vrs',
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
  const [conversionStage, setConversionStage] = useState<ConversionStage>(
    'idle'
  );
  const [hasReassuredFile, setHasReassuredFile] = useState(false);
  const [hasFlattenedAccountability, setHasFlattenedAccountability] = useState(
    false
  );
  const [printProgress, setPrintProgress] = useState(0);
  const [printMessageIndex, setPrintMessageIndex] = useState(0);

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

  useEffect(() => {
    setConversionStage('idle');
    setHasReassuredFile(false);
    setHasFlattenedAccountability(false);
    setPrintProgress(0);
    setPrintMessageIndex(0);
    setStatusMessage('');
  }, [selectedFileId, targetType]);

  useEffect(() => {
    if (conversionStage !== 'printing') return undefined;
    if (printProgress >= 100) return undefined;
    const timeoutId = window.setTimeout(() => {
      setPrintProgress((current) => Math.min(100, current + 20));
      setPrintMessageIndex((current) =>
        Math.min(PRINT_PROGRESS_MESSAGES.length - 1, current + 1)
      );
    }, 420);
    return () => window.clearTimeout(timeoutId);
  }, [conversionStage, printProgress]);

  useEffect(() => {
    if (
      conversionStage !== 'printing' ||
      printProgress < 100 ||
      !selectedFile
    ) {
      return;
    }
    const nextExtension = fileTypeToExtension[targetType];
    const nextName =
      selectedFile.id === FINAL_REPORT_ID
        ? FINAL_REPORT_PNG_NAME
        : replaceExtension(selectedFile.name, nextExtension);
    setFlags({
      dynamicFileTypeOverrides: {
        ...(flags.dynamicFileTypeOverrides ?? {}),
        [selectedFile.id]: targetType,
      },
      dynamicFileNameOverrides: {
        ...(flags.dynamicFileNameOverrides ?? {}),
        [selectedFile.id]: nextName,
      },
      hasConverterOutputBatch:
        targetType === 'pngFile' ? true : flags.hasConverterOutputBatch,
    });
    setStatusMessage(
      `Printed to PNG. Please do not ask how. Several files were created to support enterprise ambiguity.`
    );
    setConversionStage('complete');
  }, [
    conversionStage,
    flags,
    printProgress,
    selectedFile,
    setFlags,
    targetType,
  ]);

  const canConvert =
    !!selectedFile &&
    selectedFile.type === 'file' &&
    selectedFile.fileTypeId !== targetType;
  const isPngConversion = canConvert && targetType === 'pngFile';
  const isBusy = conversionStage === 'printing';
  const hasStartedPngFlow = conversionStage !== 'idle';
  const showSentimentPanel = hasStartedPngFlow;
  const showPrintPanel =
    conversionStage === 'print' ||
    conversionStage === 'printing' ||
    conversionStage === 'complete';

  const performSimpleConversion = () => {
    if (!selectedFile || selectedFile.type !== 'file') return;
    const nextExtension = fileTypeToExtension[targetType];
    const nextName = replaceExtension(selectedFile.name, nextExtension);
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
  };

  const handleConvertClick = () => {
    if (!canConvert || isBusy) return;
    if (!isPngConversion) {
      performSimpleConversion();
      return;
    }
    setConversionStage('sentiment');
    setStatusMessage(
      'Direct PNG conversion requires file emotional readiness.'
    );
  };

  return (
    <div data-window-fit style={panelStyle}>
      <div style={scrollBoxStyle}>
        <div style={{ fontWeight: 700 }}>Conversion Wizard</div>
        <div style={{ marginTop: '2px', color: 'var(--button-shadow)' }}>
          Enterprise-grade filename optimism module
        </div>
        <div style={{ marginTop: '4px' }}>
          Change a file extension and hope reality follows along.
        </div>

        <div style={conversionFlowStyle}>
          <div style={fileCardStyle}>
            <div style={{ fontWeight: 700, marginBottom: '5px' }}>Source</div>
            <Dropdown
              id="file-converter-file-select"
              emptyLabel="No files available"
              selected={selectedFileId}
              disabled={isBusy}
              onChange={(value) => setSelectedFileId(value)}
              options={desktopFiles.map((entry) => ({
                value: entry.id,
                label: entry.name,
              }))}
            />
          </div>

          <div style={arrowStyle}>-&gt;</div>

          <div style={fileCardStyle}>
            <div style={{ fontWeight: 700, marginBottom: '5px' }}>Target</div>
            <Dropdown
              id="file-converter-target-select"
              selected={targetType}
              disabled={isBusy}
              onChange={(value) => setTargetType(value as FileTypeId)}
              options={conversionOptions.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
            />
          </div>
        </div>

        <div style={statusStyle}>
          {conversionStage === 'sentiment'
            ? 'File sentiment detected. The source file is defensive and has requested a meeting.'
            : conversionStage === 'print'
            ? 'Direct conversion failed: IT disabled useful behavior after the Q2 incident.'
            : conversionStage === 'printing'
            ? PRINT_PROGRESS_MESSAGES[printMessageIndex]
            : selectedFile
            ? canConvert
              ? 'Ready. The file has no idea what is about to happen.'
              : 'Source and target already match. Even this app has limits.'
            : 'Select a file to begin the ceremonial renaming.'}
        </div>

        <div style={notesStyle}>
          <div style={{ fontWeight: 700 }}>Conversion Notes</div>
          <div style={{ marginTop: '4px' }}>
            Approved by File Services, Legal Adjacent, and one printer nobody
            can find.
          </div>
          <div style={{ marginTop: '3px', color: 'var(--button-shadow)' }}>
            Tip: PNG output may generate helpful decoys for audit confusion.
          </div>
        </div>

        {showSentimentPanel && (
          <div style={printPanelStyle}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
              File Sentiment Analysis
            </div>
            <div>Identity: deeply attached to current extension</div>
            <div>Mood: {hasReassuredFile ? 'suspicious' : 'brittle'}</div>
            <div>PNG readiness: denial</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <Button
                disabled={hasReassuredFile || conversionStage !== 'sentiment'}
                label="Reassure File"
                onClick={() => setHasReassuredFile(true)}
              />
              <Button
                disabled={conversionStage !== 'sentiment'}
                label="Respectfully Override Feelings"
                onClick={() => {
                  setConversionStage('print');
                  setStatusMessage(
                    'The file has been heard, ignored, and routed to Printing.'
                  );
                }}
              />
            </div>
          </div>
        )}

        {showPrintPanel && (
          <div style={printPanelStyle}>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
              Print to PNG
            </div>
            <div>Printer: HP DeskJet PNG-ifier 4000</div>
            <div>Port: LPT1: Definitely Real</div>
            <div>Paper size: Quarterly Report</div>
            <div>Orientation: Desperate</div>
            <div>Quality: Executive</div>
            <button
              disabled={isBusy || conversionStage === 'complete'}
              onClick={() =>
                setHasFlattenedAccountability((current) => !current)
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                padding: 0,
                border: 0,
                background: 'transparent',
                textAlign: 'left',
              }}
              type="button"
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '13px',
                  height: '13px',
                  background: 'var(--paper)',
                  boxShadow: 'var(--border-field)',
                  fontSize: '11px',
                  lineHeight: 1,
                }}
              >
                {hasFlattenedAccountability ? 'x' : ''}
              </span>
              <span>Flatten accountability</span>
            </button>
            {conversionStage === 'printing' && (
              <div style={progressTrackStyle}>
                <div
                  style={{
                    height: '100%',
                    width: `${printProgress}%`,
                    backgroundColor: 'var(--dialog-blue)',
                    transition: 'width 160ms steps(5, end)',
                  }}
                />
              </div>
            )}
            {conversionStage === 'complete' && (
              <div style={progressTrackStyle}>
                <div
                  style={{
                    height: '100%',
                    width: '100%',
                    backgroundColor: 'var(--dialog-blue)',
                  }}
                />
              </div>
            )}
            {conversionStage === 'print' && (
              <div style={{ marginTop: '8px' }}>
                <Button
                  disabled={!hasFlattenedAccountability}
                  label="Print to PNG"
                  onClick={() => {
                    setPrintProgress(0);
                    setPrintMessageIndex(0);
                    setConversionStage('printing');
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            paddingTop: 0,
          }}
        >
          <Button
            disabled={!canConvert || isBusy}
            label="Convert"
            onClick={handleConvertClick}
          />
          <Button label="Close" onClick={closeWindow} />
        </div>
        {!!statusMessage && <div style={statusStyle}>{statusMessage}</div>}
      </div>
    </div>
  );
};

export default FileConverterApp;
