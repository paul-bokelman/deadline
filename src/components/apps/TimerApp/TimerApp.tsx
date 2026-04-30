import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { AppProps } from '../../../types/App';
import useInterval from '../../../hooks/useInterval';
import WindowContent from '../../shared/WindowContent/WindowContent';
import { gameEventBus } from '../../../game/events';

const DEADLINE_TEXT = '5:00 PM';
const COUNTDOWN_MS = 15 * 60 * 1000;
const BASE_WIDTH = 360;
const BASE_HEIGHT = 200;

const panelStyle: JSX.CSSProperties = {
  margin: 0,
  padding: '10px',
  backgroundColor: 'var(--surface)',
  height: '100%',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'monospace',
  fontSize: '14px',
  gap: '8px',
};

const cardStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  padding: '8px',
};

const timerDisplayStyle: JSX.CSSProperties = {
  ...cardStyle,
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '6px',
};

const progressTrackStyle: JSX.CSSProperties = {
  ...cardStyle,
  padding: '2px',
  height: '18px',
};

const timeLargeStyle: JSX.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '1px',
  lineHeight: 1,
};

const urgencyStyle: JSX.CSSProperties = {
  fontSize: '12px',
  color: 'var(--button-shadow)',
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [layoutScale, setLayoutScale] = useState(1);
  const progressRatio = Math.max(0, Math.min(1, remainingMs / COUNTDOWN_MS));
  const progressPercent = Math.round(progressRatio * 100);

  useInterval(() => {
    setRemainingMs(Math.max(0, deadlineAt - Date.now()));
  }, 1000);

  useEffect(() => {
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    gameEventBus.emit('deadline:seconds_remaining', { seconds, remainingMs });
  }, [remainingMs]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !('ResizeObserver' in globalThis)) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const widthScale = entry.contentRect.width / BASE_WIDTH;
      const heightScale = entry.contentRect.height / BASE_HEIGHT;
      const nextScale = Math.max(0.62, Math.min(1, Math.min(widthScale, heightScale)));
      setLayoutScale(nextScale);
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const scaledPanelStyle: JSX.CSSProperties = {
    ...panelStyle,
    padding: `${Math.round(10 * layoutScale)}px`,
    fontSize: `${Math.max(10, Math.round(14 * layoutScale))}px`,
    gap: `${Math.max(4, Math.round(8 * layoutScale))}px`,
  };

  const scaledCardStyle: JSX.CSSProperties = {
    ...cardStyle,
    padding: `${Math.max(4, Math.round(8 * layoutScale))}px`,
  };

  const scaledTimerDisplayStyle: JSX.CSSProperties = {
    ...timerDisplayStyle,
    ...scaledCardStyle,
    gap: `${Math.max(3, Math.round(6 * layoutScale))}px`,
  };

  const scaledProgressTrackStyle: JSX.CSSProperties = {
    ...progressTrackStyle,
    ...scaledCardStyle,
    padding: `${Math.max(1, Math.round(2 * layoutScale))}px`,
    height: `${Math.max(12, Math.round(18 * layoutScale))}px`,
  };

  const scaledTimeLargeStyle: JSX.CSSProperties = {
    ...timeLargeStyle,
    fontSize: `${Math.max(16, Math.round(24 * layoutScale))}px`,
  };

  const scaledUrgencyStyle: JSX.CSSProperties = {
    ...urgencyStyle,
    fontSize: `${Math.max(9, Math.round(12 * layoutScale))}px`,
  };

  return (
    <WindowContent
      body={
        <div ref={panelRef} style={scaledPanelStyle}>
          <div
            style={{
              ...scaledCardStyle,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              rowGap: `${Math.max(3, Math.round(4 * layoutScale))}px`,
            }}
          >
            <div>
              Due at <b>{DEADLINE_TEXT}</b>
            </div>
            <div style={{ fontWeight: 700 }}>{progressPercent}%</div>
          </div>
          <div style={scaledTimerDisplayStyle}>
            <div style={{ fontWeight: 700 }}>Time Remaining</div>
            <div style={scaledTimeLargeStyle}>{formatCountdown(remainingMs)}</div>
            <div style={scaledUrgencyStyle}>
              {remainingMs <= 60_000 ? 'Final minute.' : 'Deadline approaching.'}
            </div>
          </div>
          <div style={scaledProgressTrackStyle}>
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor:
                  remainingMs <= 60_000 ? '#7b0000' : 'var(--dialog-blue)',
                boxShadow: 'inset 1px 1px 0 var(--button-highlight)',
              }}
            />
          </div>
        </div>
      }
    />
  );
};

export default TimerApp;
