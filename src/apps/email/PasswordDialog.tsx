import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Z_INDEX_TIERS } from '../../system/zIndex';

interface PasswordDialogProps {
  isOpen: boolean;
  prompt: string;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (value: string) => void;
}

const overlayStyle: JSX.CSSProperties = {
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: Z_INDEX_TIERS.modal,
};

const dialogStyle: JSX.CSSProperties = {
  width: '420px',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-window-outer), var(--border-window-inner)',
  padding: '3px',
};

const titleStyle: JSX.CSSProperties = {
  background:
    'linear-gradient(90deg, var(--dialog-blue) 0%, var(--dialog-gray) 100%)',
  color: '#ffffff',
  fontWeight: 'bold',
  padding: '3px 6px',
  marginBottom: '8px',
};

const bodyStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 10px',
};

const PasswordDialog: FunctionComponent<PasswordDialogProps> = ({
  isOpen,
  prompt,
  errorMessage = null,
  onClose,
  onSubmit,
}: PasswordDialogProps) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => onSubmit(value.trim());

  return (
    <div style={overlayStyle}>
      <div role="dialog" aria-modal="true" style={dialogStyle}>
        <div style={titleStyle}>Encrypted File</div>
        <div style={bodyStyle}>
          <div>{prompt}</div>
          <input
            autoFocus
            onInput={(event) =>
              setValue((event.target as HTMLInputElement).value ?? '')
            }
            type="password"
            value={value}
          />
          {errorMessage && (
            <div style={{ color: '#9f0000' }}>{errorMessage}</div>
          )}
          <div
            style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}
          >
            <button onClick={onClose} style={buttonStyle} type="button">
              Close
            </button>
            <button onClick={handleSubmit} style={buttonStyle} type="button">
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordDialog;
