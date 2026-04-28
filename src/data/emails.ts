import type { GameFlags } from '../game/state';
import { Q3_ATTACHMENT_PASSWORD } from './passwords';

export type EmailAccountId = 'corpMail' | 'personalMail' | 'corpMailLegacy';
export type EmailFolder = 'inbox' | 'promotions' | 'spam' | 'sent' | 'trash';

export interface EmailAttachment {
  id: string;
  fileName: string;
  isMalwareTrap?: boolean;
  isRealAttachment?: boolean;
}

export interface EmailDeliveryRule {
  requiresFlags?: Array<keyof GameFlags>;
}

export interface EmailRecord {
  id: string;
  accountId: EmailAccountId;
  folder: EmailFolder;
  sender: string;
  subject: string;
  timestamp: string;
  preview: string;
  body: string;
  encryptedWithPassword?: string;
  encryptedLockedBody?: string;
  attachments?: EmailAttachment[];
  loadDelayMs?: number;
  isMalwareTrap?: boolean;
  deliveryRule?: EmailDeliveryRule;
  requiresGameFlag?: keyof GameFlags;
}

export interface EmailAccountDefinition {
  id: EmailAccountId;
  label: string;
}

export const emailAccounts: EmailAccountDefinition[] = [
  { id: 'corpMail', label: 'CorpMail' },
  { id: 'personalMail', label: 'PersonalMail' },
  { id: 'corpMailLegacy', label: 'CorpMail 2 (Legacy)' },
];

const PERSONAL_INBOX: EmailRecord[] = [
  {
    id: 'personal-001',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'mom@familymail.com',
    subject: 'Did you eat lunch?',
    timestamp: '09:04',
    preview: 'Please stop skipping meals at work.',
    body: 'Hey. Please eat lunch and drink water. Call me tonight.',
  },
  {
    id: 'personal-002',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'no-reply@amazon.com',
    subject: 'Your order has shipped',
    timestamp: '09:12',
    preview: 'Package arrives tomorrow by 8 PM.',
    body: 'Your package is in transit. Tracking updates may be delayed.',
  },
  {
    id: 'personal-003',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'notifications@reddit.com',
    subject: '10 new replies to your post',
    timestamp: '09:18',
    preview: 'Internet strangers are yelling again.',
    body: 'Your post is trending in r/techsupportgore.',
  },
  {
    id: 'personal-004',
    accountId: 'personalMail',
    folder: 'promotions',
    sender: 'promo@streamflix.tv',
    subject: 'Come back for 40% off',
    timestamp: '09:29',
    preview: 'We miss your subscription money.',
    body: 'Special offer expires at midnight.',
  },
  {
    id: 'personal-005',
    accountId: 'personalMail',
    folder: 'spam',
    sender: 'winner@mega-prizes.cc',
    subject: 'YOU WON AN IPAD!!!',
    timestamp: '09:30',
    preview: 'Open attachment to claim now.',
    body: 'Congratulations! Run the attached tool to validate your identity.',
    attachments: [
      {
        id: 'personal-005-attachment-1',
        fileName: 'Claim_iPad_NOW.exe',
        isMalwareTrap: true,
      },
    ],
  },
  {
    id: 'personal-006',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'calendar@events.mail',
    subject: 'Dinner with Sam moved',
    timestamp: '09:44',
    preview: 'Moved to Thursday 7:30 PM.',
    body: 'Location unchanged. Traffic will be bad.',
  },
  {
    id: 'personal-007',
    accountId: 'personalMail',
    folder: 'spam',
    sender: 'security@free-antivirus.help',
    subject: 'Critical virus detected',
    timestamp: '09:51',
    preview: 'Install emergency cleaner immediately.',
    body: 'Your machine is infected. Launch attachment for instant cleanup.',
    attachments: [
      {
        id: 'personal-007-attachment-1',
        fileName: 'EmergencyCleaner.scr',
        isMalwareTrap: true,
      },
    ],
  },
  {
    id: 'personal-008',
    accountId: 'personalMail',
    folder: 'promotions',
    sender: 'offers@airline.example',
    subject: 'Weekend fares from $89',
    timestamp: '10:02',
    preview: 'Pretend you have free time.',
    body: 'Sale ends tonight.',
  },
  {
    id: 'personal-009',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'billing@internetprovider.net',
    subject: 'Autopay receipt',
    timestamp: '10:15',
    preview: 'Payment processed successfully.',
    body: 'Thank you. Nothing exciting happened.',
  },
  {
    id: 'personal-010',
    accountId: 'personalMail',
    folder: 'spam',
    sender: 'noreply@gift-card-bonus.biz',
    subject: 'Gift card payout enclosed',
    timestamp: '10:22',
    preview: 'Attach and run to redeem.',
    body: 'Double your gift card instantly with attached activator.',
    attachments: [
      {
        id: 'personal-010-attachment-1',
        fileName: 'GiftCardActivator.com',
        isMalwareTrap: true,
      },
    ],
  },
  {
    id: 'personal-011',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'friend@oldmail.net',
    subject: 'Board game night?',
    timestamp: '10:31',
    preview: 'Friday still good?',
    body: 'Bring snacks. No spreadsheets allowed.',
  },
  {
    id: 'personal-012',
    accountId: 'personalMail',
    folder: 'trash',
    sender: 'newsletter@dailynews.example',
    subject: 'Morning digest',
    timestamp: '10:46',
    preview: 'Unread. Moved to trash.',
    body: 'A lot happened that you are ignoring.',
  },
  {
    id: 'personal-013',
    accountId: 'personalMail',
    folder: 'inbox',
    sender: 'notifications@bank.fake',
    subject: 'Invoice correction attached',
    timestamp: '10:51',
    preview: 'Please review attachment',
    body: 'Update account records with attached correction patch.',
    attachments: [
      {
        id: 'personal-013-attachment-1',
        fileName: 'invoice_patch.exe',
        isMalwareTrap: true,
      },
    ],
  },
  {
    id: 'personal-014',
    accountId: 'personalMail',
    folder: 'sent',
    sender: 'you@personal.mail',
    subject: 'Re: landlord docs',
    timestamp: '11:01',
    preview: 'Sent signed PDF.',
    body: 'Attached the signed lease addendum. Thanks.',
  },
  {
    id: 'personal-015',
    accountId: 'personalMail',
    folder: 'promotions',
    sender: 'shop@keyboardclub.com',
    subject: 'New keycaps drop',
    timestamp: '11:12',
    preview: 'Limited stock in neon colors.',
    body: 'Only 250 sets available worldwide.',
  },
  {
    id: 'personal-016',
    accountId: 'personalMail',
    folder: 'spam',
    sender: 'support@urgent-repair.cn',
    subject: 'Open this to remove lag',
    timestamp: '11:18',
    preview: 'Performance booster attached.',
    body: 'Run attachment for instant speed optimization.',
    attachments: [
      {
        id: 'personal-016-attachment-1',
        fileName: 'FPS_Booster.bat',
        isMalwareTrap: true,
      },
    ],
  },
];

const LEGACY_CORP_MAIL: EmailRecord[] = [
  {
    id: 'legacy-001',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'calendar@corp.internal',
    subject: 'Meeting reminder: Q1 retrospective',
    timestamp: '07:10',
    preview: 'This invite expired 86 days ago.',
    body: 'Legacy calendar event. Do not reply.',
  },
  {
    id: 'legacy-002',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'ops-notify@corp.internal',
    subject: 'Printer migration phase 1 complete',
    timestamp: '07:24',
    preview: 'No action required.',
    body: 'Legacy infrastructure notice.',
  },
  {
    id: 'legacy-003',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'finance-archive@corp.internal',
    subject: 'Expense report policy 2019',
    timestamp: '07:31',
    preview: 'Superseded document.',
    body: 'This policy has been replaced.',
  },
  {
    id: 'legacy-004',
    accountId: 'corpMailLegacy',
    folder: 'promotions',
    sender: 'vendor-webinar@crmtool.com',
    subject: 'Watch yesterday webinar replay',
    timestamp: '07:52',
    preview: 'Replay link expired.',
    body: 'The recording is unavailable in your region.',
  },
  {
    id: 'legacy-005',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'hr@corp.internal',
    subject: 'Out of office: Janet Wells',
    timestamp: '08:01',
    preview: 'OOO auto-response',
    body: 'I am out of office through last Tuesday.',
  },
  {
    id: 'legacy-006',
    accountId: 'corpMailLegacy',
    folder: 'sent',
    sender: 'you@corp.internal',
    subject: 'Re: Legacy mailbox shutdown',
    timestamp: '08:08',
    preview: 'Please decommission mailbox.',
    body: 'Following up on closure timeline.',
  },
  {
    id: 'legacy-007',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'infra@corp.internal',
    subject: 'FW: RE: FW: conference room lock code',
    timestamp: '08:14',
    preview: 'The code changed again.',
    body: 'Please disregard previous code.',
  },
  {
    id: 'legacy-008',
    accountId: 'corpMailLegacy',
    folder: 'spam',
    sender: 'newsletter@b2b-data.example',
    subject: 'Buy 100k executive leads',
    timestamp: '08:28',
    preview: 'Definitely not approved.',
    body: 'Bulk lead list offer.',
  },
  {
    id: 'legacy-009',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'calendar@corp.internal',
    subject: 'Invite cancelled: Migration sync',
    timestamp: '08:33',
    preview: 'Organizer cancelled this event.',
    body: 'No replacement meeting planned.',
  },
  {
    id: 'legacy-010',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'qa@corp.internal',
    subject: 'Test message - ignore',
    timestamp: '08:42',
    preview: 'legacy route validation',
    body: 'Please ignore this validation email.',
  },
  {
    id: 'legacy-011',
    accountId: 'corpMailLegacy',
    folder: 'promotions',
    sender: 'events@cloudvendor.io',
    subject: 'Claim your free expo pass',
    timestamp: '08:50',
    preview: 'Offer expired yesterday.',
    body: 'This pass can no longer be redeemed.',
  },
  {
    id: 'legacy-012',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'security@corp.internal',
    subject: 'Password policy update (archived)',
    timestamp: '09:02',
    preview: 'Reference only.',
    body: 'This is an archived policy version.',
  },
  {
    id: 'legacy-013',
    accountId: 'corpMailLegacy',
    folder: 'trash',
    sender: 'bot@calendar-sync.local',
    subject: 'Sync failed for mailbox LEGACY_2',
    timestamp: '09:11',
    preview: 'Error code 0xA2',
    body: 'Mailbox is pending retirement.',
  },
  {
    id: 'legacy-014',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'admin@corp.internal',
    subject: 'Legacy VPN cert expires soon',
    timestamp: '09:15',
    preview: 'No longer required.',
    body: 'This environment is deprecated.',
  },
  {
    id: 'legacy-015',
    accountId: 'corpMailLegacy',
    folder: 'inbox',
    sender: 'noreply@corp.internal',
    subject: 'Calendar digest',
    timestamp: '09:28',
    preview: 'No meetings today.',
    body: 'You have no events in this mailbox.',
  },
  {
    id: 'legacy-016',
    accountId: 'corpMailLegacy',
    folder: 'spam',
    sender: 'hello@ai-seo.example',
    subject: 'Rank #1 overnight',
    timestamp: '09:34',
    preview: 'cold pitch',
    body: 'Auto-generated growth marketing pitch.',
  },
];

const CORP_INBOX_NOISE: EmailRecord[] = [
  {
    id: 'corp-001',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'hr@corp.internal',
    subject: 'Benefits enrollment reminder',
    timestamp: '08:00',
    preview: 'Enrollment closes Friday.',
    body: 'Submit selections by end of week.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-002',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'facilities@corp.internal',
    subject: 'Lunch in the break room',
    timestamp: '08:06',
    preview: 'Sandwiches on table B.',
    body: 'First come first served.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-003',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'it-ops@corp.internal',
    subject: 'Password rotation notice',
    timestamp: '08:11',
    preview: 'Change required by 5 PM.',
    body: 'Use the password reset portal.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-004',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'calendar@corp.internal',
    subject: 'Reminder: Standup in 15 minutes',
    timestamp: '08:14',
    preview: 'Bring blockers.',
    body: 'Join the team room promptly.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-005',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'procurement@corp.internal',
    subject: 'New laptop request approved',
    timestamp: '08:17',
    preview: 'Delivery ETA 2 weeks.',
    body: 'Track status in Asset Portal.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-006',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'security@corp.internal',
    subject: 'Phishing simulation results',
    timestamp: '08:22',
    preview: 'Team score: 78%',
    body: 'Mandatory refresher scheduled.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-007',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'buildbot@corp.internal',
    subject: 'Nightly pipeline failed',
    timestamp: '08:25',
    preview: 'Module auth-gateway red.',
    body: 'Investigate failed integration tests.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-008',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'finance@corp.internal',
    subject: 'Expense reminder',
    timestamp: '08:31',
    preview: 'Submit receipts before month-end.',
    body: 'Late expenses will roll over.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-009',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'admin@corp.internal',
    subject: 'Fire drill at 3 PM',
    timestamp: '08:40',
    preview: 'Do not use elevators.',
    body: 'Meet at assembly point C.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-010',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'qa@corp.internal',
    subject: 'Regression run complete',
    timestamp: '08:49',
    preview: 'Two flaky tests quarantined.',
    body: 'See dashboard for details.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-011-password-hint',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'records@corp.internal',
    subject: 'Password for Q3 Report',
    timestamp: '11:39',
    preview: 'Encrypted message.',
    body: `Attachment password: ${Q3_ATTACHMENT_PASSWORD}`,
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-submission-portal-link',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'assistant_relay@corp.internal',
    subject: 'Submission Portal Link',
    timestamp: '12:08',
    preview: 'Open this portal to submit the report.',
    body:
      'Submission portal link:\nhttps://portal.corp.internal/submit\n\nUse your standard credentials. Deadline is unchanged.',
    requiresGameFlag: 'hasReceivedPortalIntroCall',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-winrar-download-link',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'it-helpdesk@corp.internal',
    subject: 'WinRAR download link',
    timestamp: '12:11',
    preview: 'Use this link to download WinRAR for the zip.',
    body:
      'Use the following URL to download WinRAR:\nhttp://download.winrar-online.example/\n\nOpen World Wide Web and paste/search this link. Then run WinRAR_installer.exe.',
    requiresGameFlag: 'hasReceivedWinRarLinkEmail',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
];

const q3SpamSenders = [
  'q3-report-fast@corp-mail.support',
  'finance-team@corp-reports.biz',
  'assistant-office@corp-internal.co',
  'delivery@secure-q3.info',
  'report-center@corp-notice.net',
  'it-relay@corp-gateway.cc',
  'noreply@urgent-report.today',
  'compliance@q3-desk.help',
];

const CORP_SPAM_FAKE_Q3: EmailRecord[] = Array.from(
  { length: 47 },
  (_, index) => {
    const spamId = index + 1;
    return {
      id: `corp-spam-q3-${spamId.toString().padStart(2, '0')}`,
      accountId: 'corpMail',
      folder: 'spam',
      sender: q3SpamSenders[index % q3SpamSenders.length],
      subject: 'RE: Q3 Report',
      timestamp: `10:${(spamId % 60).toString().padStart(2, '0')}`,
      preview: 'Reattached report. Open urgently.',
      body: 'This sender is not trusted. Attachment missing or suspicious.',
      isMalwareTrap: true,
      deliveryRule: { requiresFlags: ['hasEmailAccess'] },
    };
  }
);

const CORP_PROMOTIONS: EmailRecord[] = [
  {
    id: 'corp-promotions-001',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'premium@linkedin.com',
    subject: 'Upgrade to Premium Career',
    timestamp: '11:00',
    preview: 'See who viewed your profile.',
    body: 'Try one month free.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-002',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'tips@slack.com',
    subject: '5 Slack tips for focus',
    timestamp: '11:02',
    preview: 'Mute channels in one click.',
    body: 'Productivity content you will never read.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-003',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'newsletter@notion.so',
    subject: 'Template pack for teams',
    timestamp: '11:04',
    preview: 'New launch roadmap templates.',
    body: 'Duplicate into your workspace.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-004',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'launches@figma.com',
    subject: 'Design systems webinar',
    timestamp: '11:06',
    preview: 'Register for Thursday.',
    body: 'Seats are limited.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-005',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'events@atlassian.com',
    subject: 'Join Team Conference',
    timestamp: '11:08',
    preview: 'Hybrid attendance available.',
    body: 'Early bird closes tonight.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-006',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'partner@zoom.us',
    subject: 'Set up webinar in minutes',
    timestamp: '11:10',
    preview: 'Automated reminders now live.',
    body: 'Marketing feature announcement.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-007',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'academy@coursera.org',
    subject: 'Enroll in Data Storytelling',
    timestamp: '11:12',
    preview: 'Corporate discount applied.',
    body: 'Coupon expires in 48 hours.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-008',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'digest@devtool.io',
    subject: 'Release notes weekly',
    timestamp: '11:14',
    preview: 'Five updates this week.',
    body: 'Changelog summary.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-009',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'offers@cloudstorage.net',
    subject: 'Storage expansion promo',
    timestamp: '11:16',
    preview: 'Double quota for 90 days.',
    body: 'Terms and limits apply.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-010',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'community@stackshare.io',
    subject: 'Trending stacks this month',
    timestamp: '11:18',
    preview: 'See what teams use.',
    body: 'Editorial roundup.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-011',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'deals@officechair.example',
    subject: 'Ergonomic sale 20% off',
    timestamp: '11:20',
    preview: 'Back pain has entered the chat.',
    body: 'Finance may not approve this.',
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
  {
    id: 'corp-promotions-012-real',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'user_4471092@corp.internal',
    subject: 'Q3 Report - encrypted attachment',
    timestamp: '11:22',
    preview: 'Per your request, attached is the Q3 report.',
    body:
      'Per your request, attached is the Q3 report. File is encrypted. Password is in a separate email. - [auto-generated]',
    attachments: [
      {
        id: 'corp-promotions-012-real-attachment',
        fileName: 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_v3.docx',
        isRealAttachment: true,
      },
    ],
    deliveryRule: { requiresFlags: ['hasEmailAccess'] },
  },
];

export const allEmails: EmailRecord[] = [
  ...PERSONAL_INBOX,
  ...LEGACY_CORP_MAIL,
  ...CORP_INBOX_NOISE,
  ...CORP_SPAM_FAKE_Q3,
  ...CORP_PROMOTIONS,
];

export const getEmailsForAccount = (
  accountId: EmailAccountId,
  flags: GameFlags
): EmailRecord[] =>
  allEmails.filter((email) => {
    if (email.accountId !== accountId) return false;
    if (email.requiresGameFlag && flags[email.requiresGameFlag] !== true) {
      return false;
    }
    const requiredFlags = email.deliveryRule?.requiresFlags ?? [];
    return requiredFlags.every((flagKey) => flags[flagKey] === true);
  });
