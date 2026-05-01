import fileTypeList from '@/data/fileTypeList';
import { myComputerFs } from '@/data/fileSystem';
import { getZipNameForLevel } from '@/game/download/archive';
import { GameFlags } from '@/game/state';
import { registerOnReboot } from '@/system/lifecycle';
import { AppId } from '@/types/App';
import { FileSystemFile } from '@/types/FileSystem';
import { FileTypeId } from '@/types/FileType';
import { IconId } from '@/types/Icon';
import { ShellItem } from '@/types/Shell';
import {
  getAppIconId,
  registerDynamicDesktopAppIcon,
} from '@/utils/win96/AppIconUtils';
import { getFileFromPath } from '@/utils/win96/FileSystemUtils';

const ATTACHMENT_KEY_FILE_PATH =
  'C:/Windows/Desktop/Password_Vault/4-IV/8-beaver/1-Barcelona/1-Encryption Key.txt';

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

const renderAttachmentKeyFileContent = (key: string): string => {
  return `Encryption Key
==============

Use this encryption key to download the document:
${key}`;
};

const syncAttachmentKeyFileContent = (): void => {
  const keyFile = getFileFromPath(ATTACHMENT_KEY_FILE_PATH, myComputerFs);
  if (!keyFile) return;
  keyFile.content = renderAttachmentKeyFileContent(attachmentDecryptionKey);
};

registerOnReboot(() => {
  attachmentDecryptionKey = createRandomAttachmentKey();
  syncAttachmentKeyFileContent();
});

export const getAttachmentDecryptionKeyFromDump = (): string => {
  syncAttachmentKeyFileContent();
  return attachmentDecryptionKey;
};

const createAppShellItem = (
  id: string,
  appId: AppId,
  name: string,
  iconId?: IconId
): ShellItem => {
  if (iconId) registerDynamicDesktopAppIcon(appId, iconId);
  return {
    appId,
    hasFocus: false,
    hasSoftFocus: false,
    iconId: iconId ?? getAppIconId(appId),
    id,
    name,
    type: 'app',
  };
};

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
    createAppShellItem(
      'funware-reset',
      'clickMeReset',
      'FunWare',
      'gameSpider0'
    ),
    createAppShellItem('click-me-reset', 'clickMeReset', 'Click Me', 'smiley'),
    createAppShellItem(
      'draft-document-link',
      'draftDocumentLink',
      'MyProgram.fun'
    ),
    createAppShellItem('file-converter', 'fileConverter', 'File Converter'),
    createAppShellItem(
      'system-performance',
      'systemPerformance',
      'System Performance'
    ),
    createAppShellItem('anti-virus', 'antiVirus', 'Antivirus'),
    createAppShellItem('submission-portal', 'portal', 'CorpPortal'),
    createAppShellItem('bank', 'bank', 'America #1 Bank'),
    createAppShellItem('blackjack', 'blackjack', 'BlackJack 96'),
    createAppShellItem('leaderboard', 'leaderboard', 'Leaderboard'),
    createAppShellItem('world-wide-web', 'worldWideWeb', 'World Wide Web'),
    createAppShellItem('minesweeper', 'minesweeper', 'Minesweeper'),
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

syncAttachmentKeyFileContent();
