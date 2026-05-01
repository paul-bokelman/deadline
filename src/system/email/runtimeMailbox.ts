import { allEmails } from '@/data/emails';
import { gameEventBus } from '@/game/events';
import { getGameDate } from '@/system/clock/gameClock';

export interface DeliveredEmailInstance {
  instanceId: string;
  emailId: string;
  deliveredAt: number;
  deliveredTimestamp?: string;
}

type MailboxListener = () => void;
const EVENT_DELIVERED_ONLY_EMAIL_IDS = new Set<string>([
  'corp-promotions-012-real',
  'corp-password-reset-link',
  'corp-password-reset-link-fake',
]);

const toTimestamp = (date: Date): string => {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;
  const hh = String(hours12).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${suffix}`;
};

const seedInstances = (): DeliveredEmailInstance[] =>
  allEmails
    .filter((email) => !EVENT_DELIVERED_ONLY_EMAIL_IDS.has(email.id))
    .map((email, index) => ({
      instanceId: `seed-${email.id}-${index}`,
      emailId: email.id,
      deliveredAt: index,
    }));

let deliveredInstances: DeliveredEmailInstance[] = seedInstances();
const listeners = new Set<MailboxListener>();
let counter = deliveredInstances.length;

const notifyListeners = (): void => {
  listeners.forEach((listener) => listener());
};

const addDeliveredEmailInstance = (emailId: string): void => {
  if (!allEmails.some((email) => email.id === emailId)) return;
  counter += 1;
  deliveredInstances = [
    ...deliveredInstances,
    {
      instanceId: `delivered-${emailId}-${counter}`,
      emailId,
      deliveredAt: Date.now() + counter,
      deliveredTimestamp: toTimestamp(getGameDate()),
    },
  ];
  notifyListeners();
};

gameEventBus.on('email:delivered', ({ emailId }) => {
  addDeliveredEmailInstance(emailId);
});

gameEventBus.on('game:rebooted', () => {
  deliveredInstances = seedInstances();
  counter = deliveredInstances.length;
  notifyListeners();
});

export const getDeliveredEmailInstances = (): DeliveredEmailInstance[] =>
  deliveredInstances;

export const subscribeRuntimeMailbox = (
  listener: MailboxListener
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
