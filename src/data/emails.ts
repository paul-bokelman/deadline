import type { GameFlags } from '../game/state';

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
  bodyHtml?: string;
  encryptedWithPassword?: string;
  encryptedLockedBody?: string;
  attachments?: EmailAttachment[];
  loadDelayMs?: number;
  isMalwareTrap?: boolean;
  malwarePopupBurstCountOnEmailOpen?: number;
  malwarePopupBurstCountOnAttachmentOpen?: number;
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
const EMAIL_ACCESS_RULE: EmailDeliveryRule = {
  requiresFlags: ['hasEmailAccess'],
};

const twoDigits = (value: number): string => value.toString().padStart(2, '0');
const three = (value: number): string => value.toString().padStart(3, '0');

const toClock = (offset: number): string => {
  const hour = 7 + Math.floor(offset / 60);
  const minute = offset % 60;
  return `${twoDigits(hour)}:${twoDigits(minute)}`;
};

const richBody = (paragraphs: string[], bullets: string[] = []): string => {
  const bulletMarkup =
    bullets.length > 0
      ? `<ul>${bullets.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '';
  return `<div><p>${paragraphs.join('</p><p>')}</p>${bulletMarkup}</div>`;
};

const personalSenders = [
  'mom@familymail.com',
  'sam@groupchat.zone',
  'nora@oldmail.net',
  'danny@garageband.club',
  'exwife@seriouslyfine.com',
  'coach@weekendwarriors.org',
  'landlord@brickhouse.pm',
  'cousin@familymail.com',
  'bookclub@threads.local',
  'roommate@apartment.life',
];

const personalSubjects = [
  'Dinner plan keeps mutating',
  'You left your jacket and your dignity',
  'Please confirm this chaotic weekend plan',
  'Your plant is alive (barely)',
  'Family group chat update',
  'Board game rematch invitation',
  'Can you feed my cat tonight?',
  'Emergency: who took the charger',
  'Reminder about the awkward reunion',
  'You still owe me tacos',
];

const personalBodyTemplates = [
  {
    p1: 'I know this sounds dramatic, but today turned into three mini-disasters before noon.',
    p2: 'Not urgent unless you are available to laugh about it later.',
    bullets: [
      'One errand became five errands.',
      'Coffee was spilled, dignity was not recovered.',
      'Please reply with either advice or memes.',
    ],
  },
  {
    p1: 'Quick life update: I am pretending to be organized and it is barely working.',
    p2: 'If you are free this week, I need a second opinion on a questionable plan.',
    bullets: [
      'Schedule moved again.',
      'I probably forgot one detail.',
      'Bring snacks if this becomes a meeting.',
    ],
  },
  {
    p1: 'Small favor request, medium chaos level, large appreciation in advance.',
    p2: 'You always answer with common sense, so I am cashing in that reputation.',
    bullets: [
      'No money needed.',
      'Might involve carrying one heavy box.',
      'Will trade for dinner.',
    ],
  },
];

const corpInboxBodyTemplates = [
  {
    p1: 'Quarterly alignment update: timeline is stable, morale is unstable, and the printer has chosen violence again.',
    p2: 'Action is only required if your name appears in the ownership table or if you are emotionally invested in chaos.',
    bullets: [
      'Status: green-ish with suspicious yellow undertones.',
      'Owner: Program Ops + one intern fueled by cold brew.',
      'Next checkpoint: tomorrow at 10:00 unless another fire drill appears.',
    ],
  },
  {
    p1: 'Following up on the 47-message thread nobody asked for: scope is clearer and blast radius is now merely theatrical.',
    p2: 'Please avoid reply-all unless your blocker has an ETA, a screenshot, and at least one witness.',
    bullets: [
      'Risk moved from "panic" to "nervous chuckle."',
      'Security review is pending because legal wants one more comma.',
      'Metrics dashboard now refreshes hourly and judges silently.',
    ],
  },
  {
    p1: 'This memo replaces yesterday\'s memo, which replaced Monday\'s memo, which legally never happened.',
    p2: 'Updated rollout sequencing is below and has been approved by governance, vibes, and a random number generator.',
    bullets: [
      'Wave 1: brave volunteers and accidental early adopters.',
      'Wave 2: full department rollout with ceremonial keyboard cleaning.',
      'Wave 3: organization-wide launch plus mandatory deep breathing.',
    ],
  },
];

const promoBodyTemplates = [
  {
    p1: 'This campaign includes product updates, workflow shortcuts, and one suspiciously enthusiastic webinar host named Trent.',
    p2: 'Ninety percent is marketing glitter, ten percent is useful, and one percent is legally confusing.',
    bullets: [
      'Live session with Q&A and accidental oversharing.',
      'Template bundle included (23 duplicates, 2 gems).',
      'Coupon expires at midnight or whenever our server blinks.',
    ],
  },
  {
    p1: 'Congratulations, you were selected for a limited productivity trial by a spreadsheet that definitely has feelings.',
    p2: 'If you ignore this email, one growth analyst will stare at a dashboard in silence for 20 minutes.',
    bullets: [
      'Free tier for 30 days and one emotional support tooltip.',
      'Manager approval may be required unless they are on vacation.',
      'One-click team import (three clicks in practice).',
    ],
  },
  {
    p1: 'Release recap includes feature highlights, migration notes, and customer quotes that sound suspiciously AI-generated.',
    p2: 'Skim this if your team owns dashboards, onboarding, or anxiety.',
    bullets: [
      'Improved role permissions with 14 new checkboxes.',
      'New export wizard wearing old bugs in a new hat.',
      'Setup time reduced by 40% (source: vibes and one benchmark).',
    ],
  },
];

const q3ScamOpeners = [
  'Per finance escalation and three alarming emojis, this is the corrected quarter package demanded by leadership.',
  'Compliance says your previous upload failed checksum, spellcheck, and destiny. Re-submit now.',
  'Executive desk requested latest revision before close of business and before Greg notices.',
  'Automated records sync rejected your file, your font choices, and your confidence.',
];

const promoBrands = [
  'streamflix.tv',
  'flightflash.example',
  'keyboardclub.com',
  'warehouse-deals.io',
  'retroshoes.shop',
  'mealprep.zone',
];

const malwareDomains = [
  'urgent-scan-now.biz',
  'office-security.help',
  'gift-upgrade.cc',
  'driver-optimizer.pro',
  'antivirus-delivery.top',
  'q3-export-mail.net',
];

const buildPersonalEmails = (): EmailRecord[] => {
  return Array.from({ length: 70 }, (_, index) => {
    const id = index + 1;
    const folder: EmailFolder =
      id % 7 === 0
        ? 'spam'
        : id % 5 === 0
          ? 'promotions'
          : id % 11 === 0
            ? 'sent'
            : id % 13 === 0
              ? 'trash'
              : 'inbox';
    const sender =
      folder === 'promotions'
        ? `offers@${promoBrands[id % promoBrands.length]}`
        : folder === 'spam'
          ? `notice@${malwareDomains[id % malwareDomains.length]}`
          : personalSenders[id % personalSenders.length];
    const isMalware = folder === 'spam' || id % 9 === 0;
    const subject =
      isMalware
        ? `ALERT: verify account package #${4000 + id}`
        : folder === 'promotions'
          ? `Limited offer ${30 + (id % 60)}% off`
          : personalSubjects[id % personalSubjects.length];
    const malwareUrl = `http://cdn.${malwareDomains[id % malwareDomains.length]}/patch_${id}.exe`;
    const paragraphs = isMalware
      ? [
          'Your personal mailbox has been flagged for suspicious behavior, excessive memes, and one illegal amount of glitter.',
          'Use the secure downloader below to remove 19 threats and one deeply cursed browser extension.',
        ]
      : [
          `${personalBodyTemplates[id % personalBodyTemplates.length]?.p1} - ${sender.split('@')[0]}.`,
          personalBodyTemplates[id % personalBodyTemplates.length]?.p2 ??
            'Reply when you can. This one is not urgent, just dramatic.',
        ];
    return {
      id: `personal-${three(id)}`,
      accountId: 'personalMail',
      folder,
      sender,
      subject,
      timestamp: toClock(100 + id * 3),
      preview: isMalware
        ? 'Urgent fake security drama with a sketchy download.'
        : 'A chaotic personal update that somehow got longer.',
      body: isMalware
        ? `Critical action required. Download: ${malwareUrl}`
        : `Message from ${sender}.`,
      bodyHtml: isMalware
        ? richBody(paragraphs, [
            `Secure cleanup package: <a href="${malwareUrl}">Download SecurityPatch_${id}.exe</a>`,
            '<a href="http://identity-checker.invalid/confirm">Confirm billing identity</a>',
          ])
        : richBody(
            paragraphs,
            personalBodyTemplates[id % personalBodyTemplates.length]?.bullets ?? [
              'Bring snacks if you are coming.',
              'Do not mention what happened last Friday.',
            ]
          ),
      isMalwareTrap: isMalware,
      attachments: isMalware
        ? [
            {
              id: `personal-${three(id)}-attachment-1`,
              fileName: `cleanup_bundle_${id}.scr`,
              isMalwareTrap: true,
            },
          ]
        : undefined,
    };
  });
};

const LEGACY_CORP_MAIL: EmailRecord[] = Array.from({ length: 20 }, (_, index) => {
  const id = index + 1;
  const folder: EmailFolder =
    id % 9 === 0 ? 'spam' : id % 6 === 0 ? 'promotions' : id % 8 === 0 ? 'trash' : 'inbox';
  return {
    id: `legacy-${three(id)}`,
    accountId: 'corpMailLegacy',
    folder,
    sender:
      folder === 'spam'
        ? `sales-bot${id}@legacy-funnels.biz`
        : folder === 'promotions'
          ? `events${id}@legacy-vendor.io`
          : `archive-${id}@corp.internal`,
    subject:
      folder === 'spam'
        ? `Legacy mailbox optimization offer #${id}`
        : `Archive notice ${id}: mailbox migration memo`,
    timestamp: toClock(20 + id * 4),
    preview: 'Legacy mailbox clutter with detailed but outdated context.',
    body: 'Legacy notice.',
    bodyHtml: richBody(
      [
        'This legacy mailbox was retired three times and still refuses to leave.',
        'Messages here are stale, duplicated, and occasionally sent by a haunted autoresponder.',
      ],
      [
        'Do not submit current quarter data via this mailbox unless you enjoy consequences.',
        'Forward only if requested by Security or a time traveler.',
      ]
    ),
  };
});

const CORP_INBOX_NOISE: EmailRecord[] = [
  ...Array.from({ length: 47 }, (_, index): EmailRecord => {
    const id = index + 1;
    const template = corpInboxBodyTemplates[id % corpInboxBodyTemplates.length];
    return {
      id: `corp-${three(id)}`,
      accountId: 'corpMail' as const,
      folder: 'inbox' as const,
      sender: [
        'hr@corp.internal',
        'facilities@corp.internal',
        'it-ops@corp.internal',
        'buildbot@corp.internal',
        'finance@corp.internal',
        'admin@corp.internal',
        'security@corp.internal',
      ][id % 7],
      subject: [
        'Benefits election reminder',
        'Office kitchen policy update',
        'Password rotation prompt',
        'Build monitor digest',
        'Expense policy change',
        'Floor access badge migration',
        'Mandatory anti-phishing refresher',
      ][id % 7],
      timestamp: toClock(50 + id * 2),
      preview: 'Routine internal corporate traffic with enough detail to read.',
      body: 'Routine internal message pretending to be normal.',
      bodyHtml: richBody(
        [template.p1, template.p2],
        template.bullets
      ),
      deliveryRule: EMAIL_ACCESS_RULE,
    };
  }),
  {
    id: 'corp-winrar-download-link',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'it-helpdesk@corp.internal',
    subject: 'WinRAR download link',
    timestamp: '12:11',
    preview: 'Use this link to download WinRAR for the zip.',
    body: 'Use this URL to download WinRAR: https://www.win-rar.com/',
    bodyHtml: richBody(
      [
        'Download WinRAR from the link below so this zip stops bullying everyone:',
        '<a href="https://www.win-rar.com/">https://www.win-rar.com/</a>',
      ],
      [
        'Use browser download page, then launch WinRAR installer.',
        'Do not use random third-party mirrors unless you enjoy mystery malware.',
      ]
    ),
    requiresGameFlag: 'hasReceivedWinRarLinkEmail',
    deliveryRule: EMAIL_ACCESS_RULE,
  },
  {
    id: 'corp-winrar-download-link-fake',
    accountId: 'corpMail',
    folder: 'inbox',
    sender: 'it-helpdesk-security@corp.internal',
    subject: 'WinRAR mirror (urgent fallback link)',
    timestamp: '12:12',
    preview: 'Fallback WinRAR link if the main site is slow.',
    body: 'Use fallback WinRAR mirror: https://winrar-secure-download-support.com/',
    bodyHtml: richBody(
      [
        'If the official site is slow, use this backup mirror immediately:',
        '<a href="https://winrar-secure-download-support.com/">https://winrar-secure-download-support.com/</a>',
      ],
      [
        'Mirror verified by "security relay".',
        'Install quickly so extraction can continue.',
      ]
    ),
    isMalwareTrap: true,
    malwarePopupBurstCountOnEmailOpen: 5,
    requiresGameFlag: 'hasReceivedWinRarLinkEmail',
    deliveryRule: EMAIL_ACCESS_RULE,
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
  { length: 35 },
  (_, index) => {
    const spamId = index + 1;
    const trapUrl = `http://q3-archive-fast${spamId}.corp-mail.support/Q3_Report_${2020 + (spamId % 6)}.zip`;
    return {
      id: `corp-spam-q3-${spamId.toString().padStart(2, '0')}`,
      accountId: 'corpMail',
      folder: 'spam',
      sender: q3SpamSenders[index % q3SpamSenders.length],
      subject: spamId % 2 === 0 ? 'RE: Q3 Report (Updated)' : 'Q3 Report - action needed',
      timestamp: `10:${(spamId % 60).toString().padStart(2, '0')}`,
      preview: 'Suspicious clone of a real report thread with fake urgency and panic seasoning.',
      body: `Urgent Q3 package mirror: ${trapUrl}`,
      bodyHtml: richBody(
        [
          q3ScamOpeners[spamId % q3ScamOpeners.length],
          'This thread mimics internal style but comes from an untrusted relay wearing a fake mustache.',
        ],
        [
          `<a href="${trapUrl}">Download Q3_Financials_Final_${spamId}.zip</a>`,
          '<a href="http://secure-q3-password-reset.help/">Reset attachment password</a>',
        ]
      ),
      isMalwareTrap: true,
      attachments: [
        {
          id: `corp-spam-q3-${twoDigits(spamId)}-attachment`,
          fileName: `Q3_Corrected_${spamId}.exe`,
          isMalwareTrap: true,
        },
      ],
      deliveryRule: EMAIL_ACCESS_RULE,
    };
  }
);

const CORP_PORTAL_PASSWORD_RESET_SPAM: EmailRecord = {
  id: 'corp-password-reset-link',
  accountId: 'corpMail',
  folder: 'spam',
  sender: 'noreply@identity.corp.internal',
  subject: 'Password reset requested',
  timestamp: '13:58',
  preview: 'Reset request received. Follow the secure link to set a new password.',
  body: 'Reset your password: http://identity.corp.internal/reset-password',
  bodyHtml: richBody(
    [
      'A password reset was requested for the CorpPortal account.',
      'If this was you, continue with the secure reset flow below.',
    ],
    [
      '<a href="http://identity.corp.internal/reset-password">Reset portal password</a>',
      'This email landed in spam because enterprise filters are having a day.',
    ]
  ),
  deliveryRule: EMAIL_ACCESS_RULE,
};

const CORP_PROMOTIONS: EmailRecord[] = [
  ...Array.from({ length: 24 }, (_, index): EmailRecord => {
    const id = index + 1;
    const template = promoBodyTemplates[id % promoBodyTemplates.length];
    const sender = [
      'premium@linkedin.com',
      'tips@slack.com',
      'newsletter@notion.so',
      'launches@figma.com',
      'events@atlassian.com',
      'partner@zoom.us',
      'academy@coursera.org',
      'digest@devtool.io',
    ][id % 8];
    return {
      id: `corp-promotions-auto-${three(id)}`,
      accountId: 'corpMail',
      folder: 'promotions',
      sender,
      subject: `Team productivity bundle ${id}`,
      timestamp: toClock(180 + id * 2),
      preview: 'Long-form promo mail with practical and absurd bullet points.',
      body: `Promotional bulletin from ${sender}.`,
      bodyHtml: richBody(
        [template.p1, template.p2],
        template.bullets
      ),
      deliveryRule: EMAIL_ACCESS_RULE,
    };
  }),
  {
    id: 'corp-promotions-012-real',
    accountId: 'corpMail',
    folder: 'promotions',
    sender: 'guantummy1_11@corp.internal',
    subject: 'Q3 REPORT !IMPORTANT!',
    timestamp: '11:22',
    preview: "Here's the Q3 report. PLEASEEEE get it to Harold before 5pm!!",
    body:
      "Here's the Q3 report. PLEASEEEE get it to Harold before 5pm!! If you don't we're seriously gonna be in some deep troubles.. OH, also, I encrypted the file with your favorite encryption key because I don't trust the intranet... PLEASE GET MOVING !!!!!",
    bodyHtml: richBody(
      [
        "Here's the Q3 report. PLEASEEEE get it to Harold before 5pm!! If you don't we're seriously gonna be in some deep troubles..",
        "OH, also, I encrypted the file with your favorite encryption key because I don't trust the intranet...",
        'PLEASE GET MOVING !!!!!',
      ],
      ['Attachment source: approved reporting relay', 'Message signature: auto-generated']
    ),
    attachments: [
      {
        id: 'corp-promotions-012-real-attachment',
        fileName: 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_v3.docx',
        isRealAttachment: true,
      },
    ],
    deliveryRule: { requiresFlags: ['hasEmailAccess', 'hasReceivedIntroCall'] },
  },
];

export const allEmails: EmailRecord[] = [
  ...buildPersonalEmails(),
  ...LEGACY_CORP_MAIL,
  ...CORP_INBOX_NOISE,
  ...CORP_SPAM_FAKE_Q3,
  CORP_PORTAL_PASSWORD_RESET_SPAM,
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
