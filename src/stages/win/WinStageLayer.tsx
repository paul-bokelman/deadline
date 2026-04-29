import { h, FunctionComponent, JSX } from 'preact';
import { useContext, useMemo, useRef, useState } from 'preact/hooks';

import Button from '../../components/shared/Button/Button';
import Window from '../../components/shared/Window/Window';
import OpenWindowsContext from '../../context/OpenWindowsContext';
import { useGameState } from '../../game/state';
import { getSubmittedElapsedMs } from '../../system/runTimer/runTimer';
import {
  getLeaderboardInsertionRank,
  sanitizeLeaderboardName,
  setLeaderboardPlayerEntry,
} from '../../system/leaderboard/runtime';
import { Z_INDEX_TIERS } from '../../system/zIndex';
import { playTadaSfx } from '../../utils/audio/osSfx';

const containerStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: Z_INDEX_TIERS.leaderboard,
};

const bodyStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  margin: '0 0 10px',
  padding: '10px',
};

const actionsStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
};

const inputStyle: JSX.CSSProperties = {
  width: '100%',
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '4px 6px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontFamily: 'var(--font-family-ui)',
  fontSize: '13px',
};

const countStyle: JSX.CSSProperties = {
  width: '36px',
  textAlign: 'right',
  fontSize: '10px',
  color: '#666666',
};

const sanitizeDraft = (raw: string): string =>
  (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);

const formatTime = (ms: number): string => {
  const total = Math.floor(ms / 10);
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  const pad = (n: number, d = 2): string => String(n).padStart(d, '0');
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
};

const WinStageLayer: FunctionComponent = () => {
  const { stage, setStage } = useGameState();
  const { focusOnWindow, openApp, unMinimizeWindow, windows } = useContext(OpenWindowsContext);
  const [coords, setCoords] = useState({ x: 240, y: 150 });
  const [nameInput, setNameInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isVisible = stage === 'win';

  const elapsedMs = Math.max(0, getSubmittedElapsedMs() ?? 0);
  const elapsedLabel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);
  const insertionRank = useMemo(() => getLeaderboardInsertionRank(elapsedMs), [
    elapsedMs,
  ]);

  const message = useMemo(
    () => 'Submission accepted. You beat the deadline.',
    []
  );

  const finish = (rawName: string) => {
    const sanitized = sanitizeLeaderboardName(rawName);
    setLeaderboardPlayerEntry(sanitized, elapsedMs);
    playTadaSfx();
    setNameInput('');
    setStage('desktop_intro');
    const existingLeaderboard = windows.find((window) => window.app.id === 'leaderboard');
    if (existingLeaderboard) {
      unMinimizeWindow(existingLeaderboard.id);
      focusOnWindow(existingLeaderboard.id);
      return;
    }
    openApp({ appId: 'leaderboard' });
  };

  if (!isVisible) return null;

  return (
    <div style={containerStyle}>
      <div style={{ pointerEvents: 'auto' }}>
        <Window
          coords={coords}
          iconId="leaderboard"
          isDraggable
          isResizeable={false}
          onClickClose={() => finish(nameInput)}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          size={{ x: 420, y: 248 }}
          title="New High Score!"
          zIndex={Z_INDEX_TIERS.leaderboard + 99}
        >
          <div style={{ padding: '8px' }}>
            <div style={bodyStyle}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}
              >
                You placed #{insertionRank} on the leaderboard.
              </div>
              <div style={{ marginBottom: '8px' }}>{message}</div>
              <div
                style={{
                  marginBottom: '10px',
                  fontSize: '11px',
                  color: '#444444',
                }}
              >
                Time:{' '}
                <span
                  style={{
                    fontFamily: 'var(--font-family-sys)',
                    background: '#000000',
                    color: '#00ff66',
                    padding: '1px 6px',
                  }}
                >
                  {elapsedLabel}
                </span>
              </div>
              <label
                htmlFor="leaderboard-name"
                style={{
                  fontSize: '11px',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Enter your <u>n</u>ame:
              </label>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <input
                  id="leaderboard-name"
                  ref={inputRef}
                  style={inputStyle}
                  maxLength={5}
                  placeholder="AAA"
                  value={nameInput}
                  onInput={(event) => {
                    const target = event.currentTarget as HTMLInputElement;
                    const next = sanitizeDraft(target.value ?? '');
                    setNameInput(next);
                  }}
                  autoFocus
                />
                <span style={countStyle}>{nameInput.length}/5</span>
              </div>
              <div
                style={{ fontSize: '10px', color: '#666666', marginTop: '4px' }}
              >
                Alphanumeric only. Uppercase. Max 5.
              </div>
            </div>
            <div style={actionsStyle}>
              <Button label="Skip" onClick={() => finish('AAA')} />
              <Button
                hasFocus
                label={
                  <span>
                    <u>S</u>ubmit
                  </span>
                }
                onClick={() => finish(nameInput)}
              />
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};

export default WinStageLayer;
