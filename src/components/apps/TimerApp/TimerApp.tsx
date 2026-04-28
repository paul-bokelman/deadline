import { h, FunctionComponent, JSX } from 'preact';
import { useState } from 'preact/hooks';

import { AppProps } from '../../../types/App';
import useInterval from '../../../hooks/useInterval';
import WindowContent from '../../shared/WindowContent/WindowContent';
const DEADLINE_TEXT = '5:00 PM';
const COUNTDOWN_MS = 15 * 60 * 1000;

const panelStyle: JSX.CSSProperties = {
  margin: 0,
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: '100%',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'monospace',
  fontSize: '14px',
};

const timeStyle: JSX.CSSProperties = {
  fontSize: '14px',
  fontWeight: 400,
  marginTop: '8px',
};

const formatCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0'
  )}`;
};

const TimerApp: FunctionComponent<AppProps> = () => {
  const [deadlineAt] = useState(() => Date.now() + COUNTDOWN_MS);
  const [remainingMs, setRemainingMs] = useState(COUNTDOWN_MS);

  useInterval(() => {
    setRemainingMs(Math.max(0, deadlineAt - Date.now()));
  }, 1000);

  return (
    <WindowContent
      body={
        <div style={panelStyle}>
          <div>
            Due at <b>{DEADLINE_TEXT}</b>
          </div>
          <div style={{ marginTop: '6px' }}>Time remaining:</div>
          <div style={timeStyle}>{formatCountdown(remainingMs)}</div>
        </div>
      }
    />
  );
};

export default TimerApp;
