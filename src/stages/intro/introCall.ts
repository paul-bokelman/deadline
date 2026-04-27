import { useEffect } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';

const INTRO_CALL_TRIGGER_EVENT_ID = 'intro_call:triggered';
const INTRO_CALL_COMPLETED_EVENT_ID = 'intro_call:completed';
const INTRO_EMAIL_ID = 'q3_report_instructions';

export const useIntroCallStage = (): void => {
  const {
    hasEventFired,
    markEventFired,
    setFlag,
    setStage,
    stage,
    triggerSkypeCall,
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
        triggerSkypeCall('intro_assistant');
      }, 2000);
    };

    const unsubscribeBootComplete = gameEventBus.on('boot:complete', () => {
      if (stage === 'desktop_intro') scheduleIntroCall();
    });

    if (stage === 'desktop_intro') {
      scheduleIntroCall();
    }

    const unsubscribeCallEnded = gameEventBus.on(
      'skype:call_ended',
      ({ callId }) => {
        if (callId !== 'intro_assistant') return;
        if (hasEventFired(INTRO_CALL_COMPLETED_EVENT_ID)) return;

        markEventFired(INTRO_CALL_COMPLETED_EVENT_ID);
        setFlag('hasReceivedIntroCall', true);
        setFlag('hasEmailAccess', true);
        setStage('search_email');

        const emailDing = new Audio('/audio/email_ding.mp3');
        emailDing.play().catch(() => undefined);

        gameEventBus.emit('email:delivered', { emailId: INTRO_EMAIL_ID });
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
    triggerSkypeCall,
    stage,
  ]);
};
