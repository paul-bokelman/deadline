// Single source of truth for in-game email addresses + servers, used by
// the email client and any code that needs to render player-facing email
// metadata. Keep new account ids in sync with `EmailAccountId` in
// src/data/emails.ts.

import { EmailAccountId } from './emails';

export const EMAIL_ADDRESS_BY_ACCOUNT: Record<EmailAccountId, string> = {
  corpMail: 'conner.work@aol.com',
  personalMail: 'connerdabeast@aol.com',
  corpMailLegacy: 'you@legacy.corp.internal',
};

export const EMAIL_SERVER_BY_ACCOUNT: Record<EmailAccountId, string> = {
  corpMail: 'POP3: corp.internal',
  personalMail: 'POP3: personalmail.com',
  corpMailLegacy: 'POP3: legacy.corp.internal',
};

export const PORTAL_DEFAULT_EMAIL = 'conner.work@aol.com';
