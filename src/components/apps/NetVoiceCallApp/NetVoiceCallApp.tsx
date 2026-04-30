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
import Icon from '../../shared/Icon/Icon';
import {
  playCallOverSfx,
  playHangupSfx,
  playIncomingCallSfxLoop,
  stopCallOverSfx,
} from '../../../utils/audio/osSfx';
import { registerManagedAudio } from '../../../utils/audio/masterVolume';

import style from './NetVoiceCallApp.module.css';

const CALL_AUDIO_VOLUME = 0.9;
const AUTO_ACCEPT_DELAY_MS = 4000;
const AUTO_HANGUP_DELAY_MS = 2000;
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
  const callOverAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasEndedCallRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const call = activeNetVoiceCallId
    ? netVoiceCalls[activeNetVoiceCallId]
    : null;
  const caller = useMemo(() => (call ? netVoiceCallers[call.callerId] : null), [
    call,
  ]);

  const stopCallOverTone = useCallback(() => {
    stopCallOverSfx(callOverAudioRef.current);
    callOverAudioRef.current = null;
  }, []);

  const teardownCallNormalization = useCallback(() => {
    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
  }, []);

  const attachCallNormalization = useCallback(
    (audio: HTMLAudioElement) => {
      try {
        const contextCtor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!contextCtor) return;

        if (!audioContextRef.current) {
          const context = new contextCtor();
          const compressor = context.createDynamicsCompressor();
          compressor.threshold.value = -24;
          compressor.knee.value = 20;
          compressor.ratio.value = 10;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;

          const makeupGain = context.createGain();
          makeupGain.gain.value = 1.15;

          compressor.connect(makeupGain);
          makeupGain.connect(context.destination);

          audioContextRef.current = context;
          compressorRef.current = compressor;
        }

        const context = audioContextRef.current;
        const compressor = compressorRef.current;
        if (!context || !compressor) return;

        teardownCallNormalization();
        const source = context.createMediaElementSource(audio);
        source.connect(compressor);
        sourceNodeRef.current = source;

        if (context.state === 'suspended') {
          void context.resume().catch(() => undefined);
        }
      } catch {
        // If WebAudio is unavailable, keep default HTMLAudio playback.
      }
    },
    [teardownCallNormalization]
  );

  useEffect(() => {
    setIsAccepted(false);
    setIsAudioFinished(false);
    setRingCount(1);
    setCallDurationSec(0);
    hasEndedCallRef.current = false;
    stopCallOverTone();

    if (!activeNetVoiceCallId) return;

    const ringAudio = playIncomingCallSfxLoop();
    ringAudioRef.current = ringAudio;
    ringAudio.play().catch(() => undefined);

    return () => {
      ringAudio.pause();
      ringAudio.currentTime = 0;
    };
  }, [activeNetVoiceCallId, stopCallOverTone]);

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
      stopCallOverTone();
      callAudioRef.current?.pause();
      teardownCallNormalization();
    };
  }, [stopCallOverTone, teardownCallNormalization]);

  const handleAccept = useCallback(() => {
    if (isAccepted || !activeNetVoiceCallId || !call) return;

    setIsAccepted(true);
    ringAudioRef.current?.pause();
    if (ringAudioRef.current) ringAudioRef.current.currentTime = 0;

    const callAudio = new Audio(call.audioPath);
    registerManagedAudio(callAudio, CALL_AUDIO_VOLUME);
    attachCallNormalization(callAudio);
    callAudioRef.current = callAudio;
    callAudio.addEventListener(
      'ended',
      () => {
        stopCallOverTone();
        callOverAudioRef.current = playCallOverSfx();
        setIsAudioFinished(true);
      },
      { once: true }
    );
    callAudio.play().catch(() => setIsAudioFinished(true));

    gameEventBus.emit('netvoice:call_accepted', {
      callId: call.id,
      autoTriggerNextStage: call.autoTriggerNextStage ?? false,
    });
  }, [activeNetVoiceCallId, call, isAccepted]);

  const handleHangup = useCallback(
    (reason: 'hangup' | 'call_over' = 'hangup') => {
      if (!call) return;
      if (hasEndedCallRef.current) return;

      hasEndedCallRef.current = true;
      stopCallOverTone();
      playHangupSfx();
      ringAudioRef.current?.pause();
      if (ringAudioRef.current) ringAudioRef.current.currentTime = 0;
      callAudioRef.current?.pause();
      if (callAudioRef.current) callAudioRef.current.currentTime = 0;
      teardownCallNormalization();
      setIsAudioFinished(true);
      gameEventBus.emit('netvoice:call_ended', {
        callId: call.id,
        autoTriggerNextStage: call.autoTriggerNextStage ?? false,
        reason,
      });
    },
    [call, stopCallOverTone, teardownCallNormalization]
  );

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
      handleHangup('call_over');
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
      {caller.role && <div className={style.descriptionRole}>{caller.role}</div>}
      {caller.username && (
        <div className={style.descriptionUsername}>{caller.username}</div>
      )}
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
                <Icon iconId="trust00" size={16} />
              </span>
              <span className={style.actionButtonLabel}>Accept</span>
            </button>
            <button
              className={style.actionButton}
              onClick={() => handleHangup('hangup')}
              type="button"
            >
              <span className={style.iconDecline} aria-hidden="true">
                <Icon iconId="msgError0" size={16} />
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
              onClick={() => handleHangup('hangup')}
              type="button"
            >
              <span className={style.iconHangup} aria-hidden="true">
                <Icon iconId="restrict1" size={16} />
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
