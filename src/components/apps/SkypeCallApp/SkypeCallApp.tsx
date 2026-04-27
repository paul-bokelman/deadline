import { h, FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { AppProps } from '../../../types/App';
import { gameEventBus } from '../../../game/events';
import { useGameState } from '../../../game/state';
import { skypeCalls } from '../../../game/skype/calls';

import style from './SkypeCallApp.module.css';

const SkypeCallApp: FunctionComponent<AppProps> = () => {
  const { activeSkypeCallId } = useGameState();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  const ringAudioRef = useRef<HTMLAudioElement | null>(null);
  const callAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsAccepted(false);
    setIsAudioFinished(false);

    if (!activeSkypeCallId) return;

    const ringAudio = new Audio('/audio/ring.mp3');
    ringAudio.loop = true;
    ringAudioRef.current = ringAudio;
    ringAudio.play().catch(() => undefined);

    return () => {
      ringAudio.pause();
      ringAudio.currentTime = 0;
    };
  }, [activeSkypeCallId]);

  useEffect(() => {
    return () => {
      callAudioRef.current?.pause();
    };
  }, []);

  if (!activeSkypeCallId) {
    return <div className={style.empty}>No active call.</div>;
  }

  const call = skypeCalls[activeSkypeCallId];
  if (!call) return <div className={style.empty}>Unknown call.</div>;

  const handleAccept = () => {
    if (isAccepted) return;

    setIsAccepted(true);
    ringAudioRef.current?.pause();
    if (ringAudioRef.current) ringAudioRef.current.currentTime = 0;

    const callAudio = new Audio(call.audioPath);
    callAudioRef.current = callAudio;
    callAudio.addEventListener('ended', () => setIsAudioFinished(true), {
      once: true,
    });
    callAudio.play().catch(() => setIsAudioFinished(true));

    gameEventBus.emit('skype:call_accepted', {
      callId: call.id,
      autoTriggerNextStage: call.autoTriggerNextStage ?? false,
    });
  };

  const handleHangup = () => {
    if (!isAudioFinished) return;

    callAudioRef.current?.pause();
    gameEventBus.emit('skype:call_ended', {
      callId: call.id,
      autoTriggerNextStage: call.autoTriggerNextStage ?? false,
    });
  };

  return (
    <div className={style.root}>
      <div className={style.header}>Skype Incoming Call</div>
      <div className={style.panel}>
        {!isAccepted && (
          <div>
            <div className={style.infoRow}>
              <img alt={call.callerName} src={call.callerAvatar} />
              <div>
                <div>Incoming call from</div>
                <div className={style.caller}>{call.callerName}</div>
              </div>
            </div>
            <div className={style.actions}>
              <button onClick={handleAccept} type="button">
                Accept
              </button>
              <button disabled type="button">
                Decline
              </button>
            </div>
          </div>
        )}

        {isAccepted && (
          <div>
            <div className={style.infoRow}>
              <img alt={call.callerName} src={call.callerAvatar} />
              <div>
                <div className={style.caller}>
                  In Call with {call.callerName}
                </div>
                <div>
                  {isAudioFinished
                    ? 'Call finished. You can now hang up.'
                    : 'Call in progress...'}
                </div>
              </div>
            </div>
            <div className={style.actions}>
              <button
                disabled={!isAudioFinished}
                onClick={handleHangup}
                type="button"
              >
                Hang Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkypeCallApp;
