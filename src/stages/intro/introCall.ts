import { useEffect } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';

const INTRO_CALL_TRIGGER_EVENT_ID = 'intro_call:triggered';
const INTRO_CALL_COMPLETED_EVENT_ID = 'intro_call:completed';
const INTRO_EMAIL_ID = 'corp-promotions-012-real';
const INTRO_CALL_DELAY_MS = 8000;
const INTRO_EMAIL_DELIVERY_DELAY_MS = 1000;

export const useIntroCallStage = (): void => {
  const {
    hasEventFired,
    markEventFired,
    setFlag,
    setStage,
    stage,
    triggerNetVoiceCall,
  } = useGameState();

  useEffect(() => {
    let introCallTimerId: number | null = null;

    const scheduleIntroCall = () => {
      if (hasEventFired(INTRO_CALL_TRIGGER_EVENT_ID)) return;
      if (introCallTimerId !== null) return;

      introCallTimerId = window.setTimeout(() => {
        introCallTimerId = null;
        if (hasEventFired(INTRO_CALL_TRIGGER_EVENT_ID)) return;
        markEventFired(INTRO_CALL_TRIGGER_EVENT_ID);
        setStage('intro_call');
        triggerNetVoiceCall('intro_assistant');
      }, INTRO_CALL_DELAY_MS);
    };

    const unsubscribeBootComplete = gameEventBus.on('boot:complete', () => {
      if (stage === 'desktop_intro') scheduleIntroCall();
    });

    if (stage === 'desktop_intro') {
      scheduleIntroCall();
    }

    const unsubscribeCallEnded = gameEventBus.on(
      'netvoice:call_ended',
      ({ callId }) => {
        if (callId !== 'intro_assistant') return;
        if (hasEventFired(INTRO_CALL_COMPLETED_EVENT_ID)) return;

        markEventFired(INTRO_CALL_COMPLETED_EVENT_ID);
        setFlag('hasEmailAccess', true);
        setStage('search_email');
        window.setTimeout(() => {
          setFlag('hasReceivedIntroCall', true);
          gameEventBus.emit('email:delivered', { emailId: INTRO_EMAIL_ID });
        }, INTRO_EMAIL_DELIVERY_DELAY_MS);
      }
    );

    return () => {
      if (introCallTimerId !== null) {
        window.clearTimeout(introCallTimerId);
      }
      unsubscribeBootComplete();
      unsubscribeCallEnded();
    };
  }, [
    hasEventFired,
    markEventFired,
    setFlag,
    setStage,
    triggerNetVoiceCall,
    stage,
  ]);
};
