import { h, FunctionComponent, JSX } from 'preact';
import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Window from '@/components/shared/Window/Window';
import OpenWindowsContext from '@/context/OpenWindowsContext';
import { useGameState } from '@/game/state';
import {
  getSubmittedElapsedMs,
  setSubmittedElapsedMs,
} from '@/system/runTimer/runTimer';
import {
  getLeaderboardInsertionRank,
  loadLeaderboard,
  NAME_MAX_LENGTH,
  sanitizeLeaderboardName,
  setLeaderboardPlayerEntry,
  submitLeaderboardEntry,
} from '@/system/leaderboard/runtime';
import { isApiConfigured } from '@/system/api/client';
import { Z_INDEX_TIERS } from '@/system/zIndex';
import { playTadaSfx } from '@/utils/audio/osSfx';

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
    .slice(0, NAME_MAX_LENGTH);

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
  const { focusOnWindow, openApp, unMinimizeWindow, windows } = useContext(
    OpenWindowsContext
  );
  const [coords, setCoords] = useState({ x: 240, y: 150 });
  const [nameInput, setNameInput] = useState('');
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVisible = stage === 'win';

  useEffect(() => {
    if (!isVisible) return;
    playTadaSfx();
    // Pre-load the leaderboard so the rank preview reflects current data.
    void loadLeaderboard();
  }, [isVisible]);

  const elapsedMs = Math.max(0, getSubmittedElapsedMs() ?? 0);
  const elapsedLabel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);
  const insertionRank = useMemo(() => getLeaderboardInsertionRank(elapsedMs), [
    elapsedMs,
  ]);

  const message = useMemo(
    () => 'Submission accepted. You beat the deadline.',
    []
  );

  const openLeaderboardApp = (): void => {
    const existingLeaderboard = windows.find(
      (window) => window.app.id === 'leaderboard'
    );
    if (existingLeaderboard) {
      unMinimizeWindow(existingLeaderboard.id);
      focusOnWindow(existingLeaderboard.id);
      return;
    }
    openApp({ appId: 'leaderboard' });
  };

  const goToLeaderboard = (): void => {
    setNameInput('');
    setSubmitStatus(null);
    setStage('desktop_intro');
    openLeaderboardApp();
  };

  const finish = async (rawName: string): Promise<void> => {
    if (isSubmitting) return;
    const sanitized = sanitizeLeaderboardName(rawName);

    if (!isApiConfigured()) {
      // Offline / API not configured: keep the legacy local-only behavior.
      setLeaderboardPlayerEntry(sanitized, elapsedMs);
      goToLeaderboard();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Submitting...');
    const result = await submitLeaderboardEntry(sanitized);
    setIsSubmitting(false);

    if (result.ok) {
      // Replace local elapsed with the server-computed authoritative value.
      setSubmittedElapsedMs(result.ms);
      goToLeaderboard();
      return;
    }

    if (result.error.code === 'NAME_TAKEN') {
      setSubmitStatus('That name is already taken. Try another.');
      inputRef.current?.focus();
      return;
    }
    if (result.error.code === 'BAD_NAME') {
      setSubmitStatus('Name must be 1\u20136 letters or numbers.');
      inputRef.current?.focus();
      return;
    }
    if (result.error.code === 'ALREADY_SUBMITTED') {
      setSubmitStatus('This run was already submitted.');
      return;
    }
    setSubmitStatus(`Submission failed: ${result.error.message}`);
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
          onClickClose={() => void finish(nameInput)}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          size={{ x: 420, y: 264 }}
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
                  maxLength={NAME_MAX_LENGTH}
                  placeholder="AAA"
                  value={nameInput}
                  onInput={(event) => {
                    const target = event.currentTarget as HTMLInputElement;
                    const next = sanitizeDraft(target.value ?? '');
                    setNameInput(next);
                    if (submitStatus) setSubmitStatus(null);
                  }}
                  autoFocus
                />
                <span style={countStyle}>
                  {nameInput.length}/{NAME_MAX_LENGTH}
                </span>
              </div>
              <div
                style={{ fontSize: '10px', color: '#666666', marginTop: '4px' }}
              >
                Alphanumeric only. Uppercase. Max {NAME_MAX_LENGTH}.
              </div>
              {submitStatus && (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#a00000',
                    marginTop: '6px',
                  }}
                >
                  {submitStatus}
                </div>
              )}
            </div>
            <div style={actionsStyle}>
              <Button
                disabled={isSubmitting}
                label="Skip"
                onClick={() => void finish('AAA')}
              />
              <Button
                hasFocus
                disabled={isSubmitting || nameInput.length === 0}
                label={
                  <span>
                    <u>S</u>ubmit
                  </span>
                }
                onClick={() => void finish(nameInput)}
              />
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};

export default WinStageLayer;
