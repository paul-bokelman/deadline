import { useEffect } from 'preact/hooks';

import { allEmails, getEmailsForAccount } from '../../data/emails';
import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import { pickRandom, randomIntBetween } from '../../utils/random';

const MIN_DELAY_MS = 20_000;
const MAX_DELAY_MS = 60_000;

export const useEmailDripScheduler = (): void => {
  const { flags } = useGameState();

  useEffect(() => {
    if (!flags.hasEmailAccess) return undefined;

    let timerId: number | null = null;
    let stopped = false;

    const scheduleNext = () => {
      if (stopped) return;
      const delay = randomIntBetween(MIN_DELAY_MS, MAX_DELAY_MS);
      timerId = window.setTimeout(() => {
        const available = [
          ...getEmailsForAccount('corpMail', flags),
          ...getEmailsForAccount('personalMail', flags),
          ...getEmailsForAccount('corpMailLegacy', flags),
        ];
        const fallback = allEmails;
        const picked = pickRandom(available.length ? available : fallback);
        if (picked) {
          gameEventBus.emit('email:delivered', { emailId: picked.id });
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      stopped = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [flags]);
};
