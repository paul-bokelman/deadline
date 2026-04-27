import { useEffect } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';

const PASSWORD_HINT_COMPLETED_EVENT_ID = 'password_hint_call:completed';
const PASSWORD_HINT_EMAIL_ID = 'corp-011-password-hint';

export const usePasswordHuntStage = (): void => {
  const { hasEventFired, markEventFired, setFlag } = useGameState();

  useEffect(() => {
    const unsubscribeCallEnded = gameEventBus.on(
      'skype:call_ended',
      ({ callId }) => {
        if (callId !== 'password_hint_assistant') return;
        if (hasEventFired(PASSWORD_HINT_COMPLETED_EVENT_ID)) return;

        markEventFired(PASSWORD_HINT_COMPLETED_EVENT_ID);
        setFlag('hasReceivedPasswordHintCall', true);

        const emailDing = new Audio('/audio/email_ding.mp3');
        emailDing.play().catch(() => undefined);

        gameEventBus.emit('email:delivered', {
          emailId: PASSWORD_HINT_EMAIL_ID,
        });
      }
    );

    return () => {
      unsubscribeCallEnded();
    };
  }, [hasEventFired, markEventFired, setFlag]);
};
