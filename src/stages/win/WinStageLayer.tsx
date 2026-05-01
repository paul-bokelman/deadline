import { Fragment, FunctionComponent, h } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { useGameState } from '@/game/state';
import { gameEventBus } from '@/game/events';
import {
  clearRunSession,
  getSubmittedElapsedMs,
  setSubmittedElapsedMs,
} from '@/system/runTimer/runTimer';
import {
  NAME_MAX_LENGTH,
  sanitizeLeaderboardName,
  setLeaderboardPlayerEntry,
  submitLeaderboardEntry,
} from '@/system/leaderboard/runtime';
import { isApiConfigured } from '@/system/api/client';
import { Z_INDEX_TIERS } from '@/system/zIndex';
import { lockMasterMute } from '@/utils/audio/masterVolume';

const BSOD_FAKEOUT_MS = 2200;
const VICTORY_LOOP_AUDIO_URL = '/audio/win/jazz.mp3';

const rootStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'auto',
  zIndex: Z_INDEX_TIERS.bluescreen + 1200,
  background: '#0000aa',
  color: '#ffffff',
  fontFamily: 'var(--font-family-sys)',
  padding: '38px 44px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const fakeStopStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  letterSpacing: '0.3px',
};

const blockStyle: CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
  maxWidth: '980px',
};

const menuRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '6px',
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

type Phase = 'fake_bsod' | 'victory_prompt';
type Action = 'submit' | 'skip' | 'reboot';

const ACTIONS: Array<{ id: Action; label: string }> = [
  { id: 'submit', label: 'Submit' },
  { id: 'skip', label: 'Skip' },
  { id: 'reboot', label: 'Reboot' },
];

const WinStageLayer: FunctionComponent = () => {
  const { stage, rebootGame } = useGameState();
  const [phase, setPhase] = useState<Phase>('fake_bsod');
  const [nameInput, setNameInput] = useState('');
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const [isBootloaderActive, setIsBootloaderActive] = useState(false);

  const isVisible = stage === 'win';

  useEffect(() => {
    if (!isVisible) return;
    setPhase('fake_bsod');
    setNameInput('');
    setSubmitStatus(null);
    setIsSubmitting(false);
    setSelectedIndex(0);
    const timeoutId = window.setTimeout(() => {
      setPhase('victory_prompt');
    }, BSOD_FAKEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isVisible]);

  useEffect(() => {
    const offStarted = gameEventBus.on('bootloader:started', () => {
      setIsBootloaderActive(true);
    });
    const offEnded = gameEventBus.on('bootloader:ended', () => {
      setIsBootloaderActive(false);
    });
    return () => {
      offStarted();
      offEnded();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || phase !== 'victory_prompt') return;
    const intervalId = window.setInterval(() => {
      setIsCursorVisible((current) => !current);
    }, 460);
    return () => window.clearInterval(intervalId);
  }, [isVisible, phase]);

  useEffect(() => {
    if (!isVisible) return;
    const releaseMute = lockMasterMute();
    return () => {
      releaseMute();
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const audio = new Audio(VICTORY_LOOP_AUDIO_URL);
    audio.loop = true;
    audio.volume = 0.8;

    let gestureUnlockAttached = false;
    const unlock = () => {
      void audio.play();
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('pointerdown', unlock, true);
    };
    const tryStart = () => {
      audio.play().catch(() => {
        if (gestureUnlockAttached) return;
        gestureUnlockAttached = true;
        window.addEventListener('keydown', unlock, true);
        window.addEventListener('pointerdown', unlock, true);
      });
    };

    tryStart();

    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      audio.pause();
      audio.currentTime = 0;
    });

    return () => {
      unsubscribeRebooted();
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('pointerdown', unlock, true);
    };
  }, [isVisible]);

  const elapsedMs = Math.max(0, getSubmittedElapsedMs() ?? 0);
  const elapsedLabel = useMemo(() => formatTime(elapsedMs), [elapsedMs]);

  const rebootToFreshRun = (): void => {
    clearRunSession();
    rebootGame();
  };

  const submitAndReboot = async (): Promise<void> => {
    if (isSubmitting) return;
    const sanitized = sanitizeLeaderboardName(nameInput);
    if (!sanitized) {
      setSubmitStatus('Enter a valid handle first (letters/numbers).');
      return;
    }

    if (!isApiConfigured()) {
      setLeaderboardPlayerEntry(sanitized, elapsedMs);
      rebootToFreshRun();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Submitting score to leaderboard...');

    let result: Awaited<ReturnType<typeof submitLeaderboardEntry>>;
    try {
      result = await submitLeaderboardEntry(sanitized);
    } catch (error) {
      setIsSubmitting(false);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Unexpected network failure.';
      setSubmitStatus(`Submission failed: ${message}`);
      return;
    }

    setIsSubmitting(false);

    if (result.ok) {
      setSubmittedElapsedMs(result.ms);
      setSubmitStatus('Submission successful. Rebooting...');
      window.setTimeout(() => rebootToFreshRun(), 250);
      return;
    }

    if (result.error.code === 'NAME_TAKEN') {
      setSubmitStatus('Handle already taken. Try another.');
      return;
    }
    if (result.error.code === 'BAD_NAME') {
      setSubmitStatus('Handle must be 1-6 letters or numbers.');
      return;
    }
    if (result.error.code === 'ALREADY_SUBMITTED') {
      setSubmitStatus('This run was already submitted. Rebooting...');
      window.setTimeout(() => rebootToFreshRun(), 500);
      return;
    }
    setSubmitStatus(`Submission failed: ${result.error.message}`);
  };

  const runAction = (action: Action): void => {
    if (phase !== 'victory_prompt') return;
    if (action === 'submit') {
      void submitAndReboot();
      return;
    }
    rebootToFreshRun();
  };

  useEffect(() => {
    if (!isVisible || phase !== 'victory_prompt') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isSubmitting) {
        // Keep the UI stable while submission is in flight.
        if (event.key === 'Enter') {
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex((current) =>
          (current - 1 + ACTIONS.length) % ACTIONS.length
        );
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex((current) => (current + 1) % ACTIONS.length);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        runAction(ACTIONS[selectedIndex].id);
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        setNameInput((current) => current.slice(0, -1));
        if (submitStatus) setSubmitStatus(null);
        return;
      }
      if (event.key.length === 1) {
        const next = sanitizeDraft(nameInput + event.key);
        if (next !== nameInput) {
          setNameInput(next);
          if (submitStatus) setSubmitStatus(null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVisible, phase, nameInput, selectedIndex, submitStatus, isSubmitting]);

  if (!isVisible || isBootloaderActive) return null;

  return (
    <div style={rootStyle}>
      <div style={fakeStopStyle}>
        {phase === 'fake_bsod'
          ? 'A fatal exception 0E has occurred at 0028:C0011E36'
          : 'ON TIME: An immeasurably impressive feat has occurred'}
      </div>

      {phase === 'fake_bsod' ? (
        <div style={blockStyle}>
          {'The current application will be terminated.\n\n'}
          {'* Press any key to terminate the current application.\n'}
          {'* Press CTRL+ALT+DEL again to restart your computer.\n\n'}
          {'Error: DEADLINE_OVERFLOW at module WIN96KRN.EXE\n'}
          {'Collecting crash dump...'}
        </div>
      ) : (
        <Fragment>
          <div style={blockStyle}>
            {`System panic aborted: competence detected.\n\n`}
            {`Enter your handle and lock in your run:\n`}
            {`TIME  ${elapsedLabel}`}
          </div>

          <div style={blockStyle}>
            {'HANDLE  '}
            <span>{nameInput}</span>
            <span
              style={{
                display: 'inline-block',
                width: '1ch',
                marginLeft: '2px',
              }}
            >
              {isCursorVisible ? '_' : ' '}
            </span>
          </div>

          <div style={menuRowStyle}>
            {ACTIONS.map((action, index) => (
              <span
                key={action.id}
                style={{
                  padding: '5px 7px',
                  background: index === selectedIndex ? '#ffffff' : 'transparent',
                  color: index === selectedIndex ? '#0000aa' : '#ffffff',
                  fontWeight: index === selectedIndex ? 700 : 400,
                }}
              >
                {action.label}
              </span>
            ))}
          </div>

          <div style={blockStyle}>
            {'Arrow keys: choose action | Type: handle | Enter: confirm'}
            {submitStatus ? `\n${submitStatus}` : ''}
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default WinStageLayer;
