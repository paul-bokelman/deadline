import { h, FunctionComponent, JSX } from 'preact';
import { useCallback, useContext, useEffect, useState } from 'preact/hooks';

import OpenWindowsContext from '@/context/OpenWindowsContext';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { Z_INDEX_TIERS } from '@/system/zIndex';
import {
  enterBsodAudioMode,
  exitBsodAudioMode,
} from '@/utils/audio/bsodAudioMode';

type TransitionPhase = 'idle' | 'remote' | 'bluescreen' | 'rebooting' | 'done';

const ASSISTANT_CALL_EVENT_ID = 'transition:assistant_portal_intro:triggered';
const ASSISTANT_CALL_COMPLETED_EVENT_ID =
  'transition:assistant_portal_intro:done';
const CLEANUP_CALL_EVENT_ID = 'transition:it_guy_cleanup:triggered';

const bannerStyle: JSX.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '10px',
  padding: '5px 10px',
  color: '#ffffff',
  backgroundColor: '#7b0000',
  boxShadow: 'var(--bevel-raised)',
  zIndex: Z_INDEX_TIERS.bluescreen + 60,
  fontWeight: 'bold',
};

const fakeCursorStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: '14px',
  height: '14px',
  backgroundColor: 'var(--paper)',
  border: '1px solid #000000',
  transform: 'rotate(45deg)',
  zIndex: Z_INDEX_TIERS.bluescreen + 70,
  pointerEvents: 'none',
};

const bluescreenStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#001e9f',
  color: '#ffffff',
  padding: '24px',
  zIndex: Z_INDEX_TIERS.bluescreen + 100,
  fontFamily: 'var(--font-family-sys)',
  fontSize: '18px',
  lineHeight: 1.6,
};

const rebootStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#000000',
  color: '#6ec4ff',
  zIndex: Z_INDEX_TIERS.bluescreen + 110,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-family-sys)',
};

const BluescreenSequence: FunctionComponent = () => {
  const { openApp } = useContext(OpenWindowsContext);
  const {
    flags,
    hasEventFired,
    markEventFired,
    rebootGame,
    setFlag,
    triggerNetVoiceCall,
  } = useGameState();

  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [countdown, setCountdown] = useState(5);
  const [cursorPos, setCursorPos] = useState({ x: 120, y: 120 });
  const [isRemoteBannerVisible, setIsRemoteBannerVisible] = useState(false);

  const triggerAssistantCallIfNeeded = useCallback(() => {
    if (hasEventFired(ASSISTANT_CALL_EVENT_ID)) return;
    markEventFired(ASSISTANT_CALL_EVENT_ID);
    triggerNetVoiceCall('assistant_portal_intro');
  }, [hasEventFired, markEventFired, triggerNetVoiceCall]);

  useEffect(() => {
    if (!flags.hasFinalReportFile) return;
    triggerAssistantCallIfNeeded();
  }, [flags.hasFinalReportFile, triggerAssistantCallIfNeeded]);

  useEffect(() => {
    let cleanupTimerId: number | null = null;

    const unsubscribeReportOpened = gameEventBus.on(
      'file:real_report_opened',
      () => {
        triggerAssistantCallIfNeeded();
      }
    );

    const unsubscribeCallEnded = gameEventBus.on(
      'netvoice:call_ended',
      ({ callId }) => {
        if (callId === 'assistant_portal_intro') {
          if (hasEventFired(ASSISTANT_CALL_COMPLETED_EVENT_ID)) return;
          markEventFired(ASSISTANT_CALL_COMPLETED_EVENT_ID);
          setFlag('hasReceivedPortalIntroCall', true);

          if (cleanupTimerId !== null) window.clearTimeout(cleanupTimerId);
          cleanupTimerId = window.setTimeout(() => {
            if (hasEventFired(CLEANUP_CALL_EVENT_ID)) return;
            markEventFired(CLEANUP_CALL_EVENT_ID);
            triggerNetVoiceCall('it_guy_cleanup');
          }, 5000);
        }

        if (callId === 'it_guy_cleanup') {
          setIsRemoteBannerVisible(true);
          setFlag('isBluescreenSequenceActive', true);
          setPhase('remote');
        }
      }
    );

    return () => {
      if (cleanupTimerId !== null) window.clearTimeout(cleanupTimerId);
      unsubscribeReportOpened();
      unsubscribeCallEnded();
    };
  }, [setFlag, hasEventFired, markEventFired, triggerNetVoiceCall, triggerAssistantCallIfNeeded]);

  useEffect(() => {
    if (phase !== 'remote') return;

    const startedAt = Date.now();
    const durationMs = 4000;
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const x = 120 + progress * 520;
      const y = 120 + Math.sin(progress * Math.PI * 2) * 80;
      setCursorPos({ x, y });
    }, 90);

    const openTimerA = window.setTimeout(
      () => openApp({ appId: 'explorer' }),
      600
    );
    const openTimerB = window.setTimeout(
      () => openApp({ appId: 'corpMail' }),
      1550
    );
    const openTimerC = window.setTimeout(
      () => openApp({ appId: 'notepad' }),
      2700
    );
    const endTimer = window.setTimeout(() => {
      setPhase('bluescreen');
      setCountdown(5);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(openTimerA);
      window.clearTimeout(openTimerB);
      window.clearTimeout(openTimerC);
      window.clearTimeout(endTimer);
    };
  }, [phase, openApp]);

  useEffect(() => {
    if (phase !== 'bluescreen') return;

    enterBsodAudioMode();

    const intervalId = window.setInterval(() => {
      setCountdown((currentCount) => {
        if (currentCount <= 1) {
          window.clearInterval(intervalId);
          setPhase('rebooting');
          return 0;
        }
        return currentCount - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
      exitBsodAudioMode();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'rebooting') return;

    const timerId = window.setTimeout(() => {
      setIsRemoteBannerVisible(false);
      rebootGame();
    }, 2200);

    return () => window.clearTimeout(timerId);
  }, [phase, rebootGame]);

  return (
    <div>
      {isRemoteBannerVisible && (
        <div style={bannerStyle}>REMOTE SESSION ACTIVE — IT Support</div>
      )}

      {phase === 'remote' && (
        <div
          style={{
            ...fakeCursorStyle,
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
          }}
        />
      )}

      {phase === 'bluescreen' && (
        <div className="bsod-overlay" style={bluescreenStyle}>
          <div>A fatal error has occurred. ERROR: IT_GUY_MESSED_UP</div>
          <div style={{ marginTop: '16px' }}>
            The current application will be terminated.
          </div>
          <div>Press CTRL+ALT+DEL again to restart your computer.</div>
          <div style={{ marginTop: '16px' }}>
            If this is the first time you've seen this Stop error screen,
            restart your computer.
          </div>
          <div>
            Disable recently installed software if the problem continues.
          </div>
          <div style={{ marginTop: '16px' }}>Technical information:</div>
          <div>
            *** STOP: 0x0000008E (0xC0000005, 0x804E37B4, 0xF2B9F7A8,
            0x00000000)
          </div>
          <div>
            *** IT_GUY_MESSED_UP - Address F2B9F7A8 base at F2A00000, DateStamp
            3d6dd67c
          </div>
          <div style={{ marginTop: '16px' }}>
            The system will restart in {countdown} seconds...
          </div>
        </div>
      )}

      {phase === 'rebooting' && (
        <div className="bsod-overlay" style={rebootStyle}>
          <div>
            <div>Windows 96 is restarting...</div>
            <div style={{ marginTop: '12px' }}>Loading system modules...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BluescreenSequence;
