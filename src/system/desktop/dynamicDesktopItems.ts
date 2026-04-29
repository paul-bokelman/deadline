import { appList } from '../../data/appList';
import fileTypeList from '../../data/fileTypeList';
import { getZipNameForLevel } from '../../game/download/archive';
import { gameEventBus } from '../../game/events';
import { GameFlags } from '../../game/state';
import { AppId } from '../../types/App';
import { FileSystemFile } from '../../types/FileSystem';
import { FileTypeId } from '../../types/FileType';
import { ShellItem } from '../../types/Shell';

export const ATTACHMENT_DECRYPTION_KEY_MARKER = '::ENCRYPTION_KEY::';

const createRandomAttachmentKey = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = () =>
    Array.from(
      { length: 4 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
  return `${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
};

let attachmentDecryptionKey = createRandomAttachmentKey();
let hasRebootHook = false;

const ensureRebootKeyRefresh = (): void => {
  if (hasRebootHook) return;
  hasRebootHook = true;
  gameEventBus.on('game:rebooted', () => {
    attachmentDecryptionKey = createRandomAttachmentKey();
  });
};

const funnySites = [
  'totallylegitbank.biz',
  'catfax.example',
  'hamsterhub.net',
  'wizardresume.io',
  'unicorn-auctions.com',
  'space-lawyers.org',
  'toaster.social',
  'passwords-r-us.invalid',
  'nacho-cloud.app',
  'spreadsheetsandchill.tv',
  'mildlyhaunted.house',
  'sock-tracker.ai',
  'doomscroll.news',
  'microwave.finance',
  'pizza-telemetry.dev',
  'hotdog-protocol.xyz',
  'corporate-vibes.biz',
  'antiques-on-mars.shop',
  'suspiciouscoupon.click',
  'keyboarddramaclub.com',
];

const makePseudoPassword = (n: number): string => {
  const a = (n * 1103515245 + 12345) >>> 0;
  const b = (a * 1664525 + 1013904223) >>> 0;
  const words = [
    'bananas',
    'monorail',
    'spoon',
    'pickle',
    'trombone',
    'glitter',
    'volcano',
    'pancake',
    'wizard',
    'laser',
    'sock',
    'muffin',
  ];
  const w1 = words[a % words.length];
  const w2 = words[b % words.length];
  const digits = String((a ^ b) % 10000).padStart(4, '0');
  return `${w1}-${w2}-${digits}!`;
};

export const generateFunnyPasswordDump = (): string => {
  ensureRebootKeyRefresh();
  const lines: string[] = [];
  lines.push('PASSWORD VAULT (DO NOT SHARE)\n');
  lines.push(
    'Reminder: do not reuse passwords. Also, stop naming files like this.\n'
  );
  lines.push('---\n');

  const hiddenIndex = 637; // 1-based entry where the key is "hidden"

  for (let i = 1; i <= 1000; i += 1) {
    const site = funnySites[i % funnySites.length];
    const user = `user_${String((i * 97) % 100000).padStart(5, '0')}`;
    const pass = makePseudoPassword(i);

    if (i === hiddenIndex) {
      lines.push(
        `${String(i).padStart(
          4,
          '0'
        )} | ${site} | ${user} | ${pass}  ${ATTACHMENT_DECRYPTION_KEY_MARKER}${attachmentDecryptionKey}`
      );
      continue;
    }

    lines.push(`${String(i).padStart(4, '0')} | ${site} | ${user} | ${pass}`);
  }

  lines.push('\n---\n');
  lines.push('EOF\n');
  return lines.join('\n');
};

export const getAttachmentDecryptionKeyFromDump = (): string => {
  ensureRebootKeyRefresh();
  const dump = generateFunnyPasswordDump();
  const markerIndex = dump.indexOf(ATTACHMENT_DECRYPTION_KEY_MARKER);
  if (markerIndex < 0) return '';
  const after = dump.slice(
    markerIndex + ATTACHMENT_DECRYPTION_KEY_MARKER.length
  );
  const key = after.split(/\s|\n/)[0] ?? '';
  return key.trim();
};

const createAppShellItem = (
  id: string,
  appId: AppId,
  name: string
): ShellItem => ({
  appId,
  hasFocus: false,
  hasSoftFocus: false,
  iconId: appList[appId].iconId,
  id,
  name,
  type: 'app',
});

const createFileShellItem = (
  id: string,
  fileTypeId: FileTypeId,
  name: string,
  content: string,
  overrideFileTypeId?: FileTypeId,
  overrideName?: string
): ShellItem => {
  const resolvedFileTypeId = overrideFileTypeId ?? fileTypeId;
  const resolvedName = overrideName ?? name;
  const fileSystemFile: FileSystemFile = {
    content,
    fileTypeId: resolvedFileTypeId,
    name: resolvedName,
    type: 'file',
  };

  return {
    fileSystemFile,
    fileTypeId: resolvedFileTypeId,
    hasFocus: false,
    hasSoftFocus: false,
    iconId: fileTypeList[resolvedFileTypeId].iconId,
    id,
    name: resolvedName,
    type: 'file',
  };
};

export const getDynamicDesktopItems = (flags: GameFlags): ShellItem[] => {
  const fileTypeOverrides = flags.dynamicFileTypeOverrides ?? {};
  const fileNameOverrides = flags.dynamicFileNameOverrides ?? {};
  const dynamicItems: ShellItem[] = [
    createAppShellItem('click-me-reset', 'clickMeReset', 'click me'),
    createAppShellItem(
      'draft-document-link',
      'draftDocumentLink',
      'Draft.Document.lnk'
    ),
    createAppShellItem('file-converter', 'fileConverter', 'File Converter'),
    createAppShellItem('anti-virus', 'antiVirus', 'Anti-Virus'),
    createAppShellItem('popup-launcher', 'timer', 'Popup'),
    createAppShellItem('submission-portal', 'portal', 'Submission Portal'),
    createAppShellItem('bank', 'bank', 'America #1 Bank'),
    createAppShellItem('blackjack', 'blackjack', 'BlackJack 96'),
    createAppShellItem('world-wide-web', 'worldWideWeb', 'World Wide Web'),
    createFileShellItem(
      'funny-password-dump',
      'notepadDoc',
      "IMPORTANT_PASSWORDS_DON'T_LOSE.txt",
      generateFunnyPasswordDump(),
      fileTypeOverrides['funny-password-dump'],
      fileNameOverrides['funny-password-dump']
    ),
  ];

  // Password hunting is disabled; do not surface the passwords file.

  if (flags.hasZipFile) {
    dynamicItems.push(
      createAppShellItem(
        'q3-zip-archive',
        'zipArchive',
        getZipNameForLevel(flags.zipExtractionLevel)
      )
    );
  }

  if (flags.zipGarbageBatch >= 1) {
    dynamicItems.push(
      createFileShellItem(
        'garbage-1',
        'msDosApp',
        'totally_safe_patch.exe',
        'binary-gibberish',
        fileTypeOverrides['garbage-1'],
        fileNameOverrides['garbage-1']
      ),
      createFileShellItem(
        'garbage-2',
        'notepadDoc',
        'desktop-cache.tmp',
        'cache=###\ninvalid=true\n',
        fileTypeOverrides['garbage-2'],
        fileNameOverrides['garbage-2']
      ),
      createFileShellItem(
        'garbage-3',
        'notepadDoc',
        'invoice_scan.tmp',
        'TEMP DATA BLOCK ###',
        fileTypeOverrides['garbage-3'],
        fileNameOverrides['garbage-3']
      )
    );
  }

  if (flags.zipGarbageBatch >= 2) {
    dynamicItems.push(
      createFileShellItem(
        'garbage-4',
        'msDosApp',
        'hotfix_install.exe',
        'binary-junk',
        fileTypeOverrides['garbage-4'],
        fileNameOverrides['garbage-4']
      ),
      createFileShellItem(
        'garbage-5',
        'notepadDoc',
        'debug_dump.tmp',
        'E2 A9 FF 0A 8D 11',
        fileTypeOverrides['garbage-5'],
        fileNameOverrides['garbage-5']
      )
    );
  }

  if (flags.zipGarbageBatch >= 3 || flags.hasFinalReportFile) {
    dynamicItems.push(
      createFileShellItem(
        'wingdings-1',
        'notepadDoc',
        'quarterly_symbols_1.txt',
        '☞ ✖ ✈ ☼ ♣ ♠ ☯ ✉ ☢',
        fileTypeOverrides['wingdings-1'],
        fileNameOverrides['wingdings-1']
      ),
      createFileShellItem(
        'wingdings-2',
        'notepadDoc',
        'quarterly_symbols_2.txt',
        '✎ ☠ ✿ ♫ ⚑ ☺ ✂ ❖',
        fileTypeOverrides['wingdings-2'],
        fileNameOverrides['wingdings-2']
      ),
      createFileShellItem(
        'wingdings-3',
        'notepadDoc',
        'quarterly_symbols_3.txt',
        '❂ ☎ ✕ ⚙ ☾ ☍ ✱ ☄',
        fileTypeOverrides['wingdings-3'],
        fileNameOverrides['wingdings-3']
      )
    );
  }

  if (flags.zipGarbageBatch >= 3 || flags.hasFinalReportFile) {
    dynamicItems.push(
      createFileShellItem(
        'q3-real-report',
        'notepadDoc',
        'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.txt',
        'Q3 REPORT\n\nRevenue was stable across core product lines while support costs rose due to legacy migration work. Gross margin held within expected range after temporary hosting spikes in July.\n\nCustomer retention improved in enterprise accounts, but expansion revenue lagged forecast in the mid-market segment. Sales cycle length increased by roughly two weeks as procurement review tightened.\n\nOperationally, incident count fell quarter-over-quarter, though mean time to recovery remains above target in off-hours windows. Recommended action for Q4: prioritize deployment automation and account handoff playbooks.',
        fileTypeOverrides['q3-real-report'],
        fileNameOverrides['q3-real-report']
      )
    );
  }

  return dynamicItems;
};
