import { h, Fragment, FunctionComponent } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import { AppProps } from '../../../types/App';
import { gameEventBus } from '../../../game/events';
import { useGameState } from '../../../game/state';
import { netVoiceCallers, netVoiceCalls } from '../../../game/netvoice/calls';
import MenuBar from '../../shared/MenuBar/MenuBar';
import StatusBar from '../../shared/StatusBar/StatusBar';
import WindowContent from '../../shared/WindowContent/WindowContent';

import style from './NetVoiceCallApp.module.css';

const RING_AUDIO_VOLUME = 0.5;
const CALL_AUDIO_VOLUME = 0.75;
const AUTO_ACCEPT_DELAY_MS = 5000;
const AUTO_HANGUP_DELAY_MS = 1000;
const RING_TICK_MS = 1700;

const MENU_OPTIONS = ['File', 'Edit', 'View', 'Call', 'Help'];

const formatRingCount = (count: number): string =>
  `Ring ${String(count).padStart(2, '0')}`;

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
};

const NetVoiceCallApp: FunctionComponent<AppProps> = () => {
  const { activeNetVoiceCallId } = useGameState();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  const [ringCount, setRingCount] = useState(1);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const callAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasEndedCallRef = useRef(false);

  const call = activeNetVoiceCallId
    ? netVoiceCalls[activeNetVoiceCallId]
    : null;
  const caller = useMemo(() => (call ? netVoiceCallers[call.callerId] : null), [
    call,
  ]);

  useEffect(() => {
    setIsAccepted(false);
    setIsAudioFinished(false);
    setRingCount(1);
    setCallDurationSec(0);
    hasEndedCallRef.current = false;

    if (!activeNetVoiceCallId) return;

    const ringAudio = new Audio('/audio/ring.mp3');
    ringAudio.loop = true;
    ringAudio.volume = RING_AUDIO_VOLUME;
    ringAudioRef.current = ringAudio;
    ringAudio.play().catch(() => undefined);

    return () => {
      ringAudio.pause();
      ringAudio.currentTime = 0;
    };
  }, [activeNetVoiceCallId]);

  useEffect(() => {
    if (!activeNetVoiceCallId || isAccepted) return;

    const interval = window.setInterval(() => {
      setRingCount((current) => Math.min(99, current + 1));
    }, RING_TICK_MS);

    return () => window.clearInterval(interval);
  }, [activeNetVoiceCallId, isAccepted]);

  useEffect(() => {
    if (!isAccepted) return;

    const interval = window.setInterval(() => {
      setCallDurationSec((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isAccepted]);

  useEffect(() => {
    return () => {
      callAudioRef.current?.pause();
    };
  }, []);

  const handleAccept = useCallback(() => {
    if (isAccepted || !activeNetVoiceCallId || !call) return;

    setIsAccepted(true);
    ringAudioRef.current?.pause();
    if (ringAudioRef.current) ringAudioRef.current.currentTime = 0;

    const callAudio = new Audio(call.audioPath);
    callAudio.volume = CALL_AUDIO_VOLUME;
    callAudioRef.current = callAudio;
    callAudio.addEventListener('ended', () => setIsAudioFinished(true), {
      once: true,
    });
    callAudio.play().catch(() => setIsAudioFinished(true));

    gameEventBus.emit('netvoice:call_accepted', {
      callId: call.id,
      autoTriggerNextStage: call.autoTriggerNextStage ?? false,
    });
  }, [activeNetVoiceCallId, call, isAccepted]);

  const handleHangup = useCallback(() => {
    if (!call) return;
    if (hasEndedCallRef.current) return;

    hasEndedCallRef.current = true;
    ringAudioRef.current?.pause();
    if (ringAudioRef.current) ringAudioRef.current.currentTime = 0;
    callAudioRef.current?.pause();
    if (callAudioRef.current) callAudioRef.current.currentTime = 0;
    setIsAudioFinished(true);
    gameEventBus.emit('netvoice:call_ended', {
      callId: call.id,
      autoTriggerNextStage: call.autoTriggerNextStage ?? false,
    });
  }, [call]);

  useEffect(() => {
    if (!activeNetVoiceCallId || isAccepted || !call) return;

    const autoAcceptTimer = window.setTimeout(() => {
      handleAccept();
    }, AUTO_ACCEPT_DELAY_MS);

    return () => {
      window.clearTimeout(autoAcceptTimer);
    };
  }, [activeNetVoiceCallId, call, handleAccept, isAccepted]);

  useEffect(() => {
    if (!isAudioFinished) return;

    const autoHangupTimer = window.setTimeout(() => {
      handleHangup();
    }, AUTO_HANGUP_DELAY_MS);

    return () => {
      window.clearTimeout(autoHangupTimer);
    };
  }, [handleHangup, isAudioFinished]);

  if (!activeNetVoiceCallId) {
    return <div className={style.empty}>No active call.</div>;
  }

  if (!call || !caller) {
    return <div className={style.empty}>Unknown call.</div>;
  }

  const description = (
    <div className={style.description}>
      <div className={style.descriptionRole}>{caller.role}</div>
      {caller.warning && (
        <div className={style.descriptionWarning}>{caller.warning}</div>
      )}
    </div>
  );

  const body = (
    <div className={style.panel}>
      <div className={style.contentRow}>
        <div className={style.avatarFrame}>
          <img alt={caller.name} src={caller.avatar} />
        </div>
        <div className={style.callInfo}>
          {!isAccepted ? (
            <div className={style.statusLabel}>Incoming voice call...</div>
          ) : (
            <div className={`${style.statusLabel} ${style.statusConnected}`}>
              <span className={style.statusDot}>{'\u2022'}</span> Connected
            </div>
          )}
          <div className={style.callerName}>{caller.name}</div>
          {description}
          {isAccepted && (
            <div className={style.durationRow}>
              <span className={style.durationLabel}>Duration:</span>
              <span className={style.durationValue}>
                {formatDuration(callDurationSec)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={style.actions}>
        {!isAccepted ? (
          <Fragment>
            <button
              className={`${style.actionButton} ${style.actionButtonPrimary}`}
              onClick={handleAccept}
              type="button"
            >
              <span className={style.iconAccept} aria-hidden="true">
                {'\u2713'}
              </span>
              <span className={style.actionButtonLabel}>Accept</span>
            </button>
            <button
              className={style.actionButton}
              onClick={handleHangup}
              type="button"
            >
              <span className={style.iconDecline} aria-hidden="true">
                {'\u2715'}
              </span>
              <span className={style.actionButtonLabel}>Decline</span>
            </button>
          </Fragment>
        ) : (
          <Fragment>
            <button className={style.actionButton} disabled type="button">
              <span className={style.actionButtonLabel}>Mute</span>
            </button>
            <button className={style.actionButton} disabled type="button">
              <span className={style.actionButtonLabel}>Hold</span>
            </button>
            <button
              className={`${style.actionButton} ${style.actionButtonPrimary}`}
              onClick={handleHangup}
              type="button"
            >
              <span className={style.iconHangup} aria-hidden="true">
                {'\u260E'}
              </span>
              <span className={style.actionButtonLabel}>Hang Up</span>
            </button>
          </Fragment>
        )}
      </div>
    </div>
  );

  const statusLeft = !isAccepted
    ? 'Awaiting response...'
    : 'Voice channel: 8kbps \u03BC-law';
  const statusRight = !isAccepted
    ? formatRingCount(ringCount)
    : `${caller.name} @ ${caller.address}`;

  return (
    <WindowContent
      menu={<MenuBar options={MENU_OPTIONS} />}
      body={body}
      footer={<StatusBar textLeft={statusLeft} textRight={statusRight} />}
    />
  );
};

export default NetVoiceCallApp;
