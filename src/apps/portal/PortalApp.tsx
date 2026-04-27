import { h, FunctionComponent, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import { getDynamicDesktopItems } from '../../system/desktop/dynamicDesktopItems';
import { useGameState } from '../../game/state';
import { AppProps } from '../../types/App';
import { ShellItem } from '../../types/Shell';

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
  padding: '4px 10px',
  marginRight: '8px',
};

const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const selectStyle: JSX.CSSProperties = {
  marginTop: '6px',
  width: '100%',
  maxWidth: '520px',
};

const REQUIRED_REPORT_FILE_ID = 'q3-real-report';
const REQUIRED_REPORT_FILE_NAME = 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.txt';

const PortalApp: FunctionComponent<AppProps> = ({ closeWindow }: AppProps) => {
  const { flags, setFlags, setStage } = useGameState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>('');

  const desktopFiles = useMemo<ShellItem[]>(() => {
    return getDynamicDesktopItems(flags).filter((item) => item.type === 'file');
  }, [flags]);

  const selectedFile = useMemo(() => {
    return desktopFiles.find((f) => f.id === selectedFileId) ?? null;
  }, [desktopFiles, selectedFileId]);

  const isCorrectFileSelected = useMemo(() => {
    if (!selectedFile) return false;
    if (selectedFile.id === REQUIRED_REPORT_FILE_ID) return true;
    if (selectedFile.type !== 'file') return false;
    return selectedFile.name === REQUIRED_REPORT_FILE_NAME;
  }, [selectedFile]);

  const canSubmit = useMemo(() => {
    return (
      flags.hasFinalReportFile &&
      !flags.hasSubmittedFinalReport &&
      !!selectedFile &&
      isCorrectFileSelected
    );
  }, [
    flags.hasFinalReportFile,
    flags.hasSubmittedFinalReport,
    isCorrectFileSelected,
    selectedFile,
  ]);

  const handleSubmit = () => {
    if (flags.hasSubmittedFinalReport) return;
    if (isSubmitting) return;
    if (!selectedFile) {
      setStatus('Select a file to upload.');
      return;
    }
    if (!isCorrectFileSelected) {
      setStatus('Upload rejected: incorrect document selected.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Uploading document...');

    window.setTimeout(() => {
      setFlags({ hasSubmittedFinalReport: true });
      setStatus('Submission accepted. You beat the deadline.');
      setIsSubmitting(false);

      window.setTimeout(() => {
        setStage('win');
        closeWindow();
      }, 700);
    }, 900);
  };

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700 }}>Corp Submission Portal</div>
      <div style={{ marginTop: '8px' }}>
        Destination: <span style={{ fontFamily: 'monospace' }}>boss@10.0.0.1</span>
      </div>

      <div style={{ marginTop: '10px' }}>
        <div>Required file:</div>
        <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
          {REQUIRED_REPORT_FILE_NAME}
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <div>Select file to upload:</div>
        <select
          onChange={(e) => {
            const next = (e.currentTarget as HTMLSelectElement).value;
            setSelectedFileId(next);
            setStatus(null);
          }}
          style={selectStyle}
          value={selectedFileId}
          disabled={flags.hasSubmittedFinalReport || isSubmitting}
        >
          <option value="">(choose a file)</option>
          {desktopFiles.map((file) => (
            <option key={file.id} value={file.id}>
              {file.name}
            </option>
          ))}
        </select>
        {selectedFile && (
          <div style={{ marginTop: '6px' }}>
            Selected: <span style={{ fontFamily: 'monospace' }}>{selectedFile.name}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px' }}>
        <button
          onClick={handleSubmit}
          style={canSubmit && !isSubmitting ? buttonStyle : disabledButtonStyle}
          disabled={flags.hasSubmittedFinalReport || isSubmitting}
          type="button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        <button onClick={closeWindow} style={buttonStyle} type="button">
          Close
        </button>
      </div>

      <div style={{ marginTop: '12px', minHeight: '18px' }}>
        {flags.hasSubmittedFinalReport ? (
          <span>Already submitted.</span>
        ) : (
          <span
            style={{
              color: !flags.hasFinalReportFile
                ? 'maroon'
                : selectedFileId && !isCorrectFileSelected
                  ? 'maroon'
                  : 'inherit',
            }}
          >
            {!flags.hasFinalReportFile
              ? 'Missing required file. Extract the archive first.'
              : !selectedFileId
                ? 'Select the correct file to enable upload.'
                : isCorrectFileSelected
                  ? 'Ready to submit.'
                  : 'Incorrect file selected.'}
          </span>
        )}
      </div>

      {status && <div style={{ marginTop: '6px' }}>{status}</div>}
    </div>
  );
};

export default PortalApp;

