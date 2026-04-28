import { h, FunctionComponent, JSX } from 'preact';

import { AppProps } from '../../types/App';

const panelStyle: JSX.CSSProperties = {
  margin: 0,
  padding: '10px',
  background:
    'linear-gradient(180deg, var(--button-highlight) 0%, #d9d9d9 100%)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: '100%',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 12px',
};

const cardStyle: JSX.CSSProperties = {
  flex: 1,
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: '10px',
  minHeight: 0,
};

const TipOfDayApp: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700, marginBottom: '8px' }}>Tip of the Day</div>
      <div style={cardStyle}>
        <div style={{ fontSize: '13px', lineHeight: 1.35 }}>
          Did you know? You can press Ctrl+S to save!
        </div>
        <div style={{ fontSize: '12px', color: '#404040' }}>
          Productivity hint provided by Corporate Optimization Suite.
        </div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={closeWindow} style={buttonStyle} type="button">
          OK
        </button>
      </div>
    </div>
  );
};

export default TipOfDayApp;
