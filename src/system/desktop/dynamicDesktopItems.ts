import { appList } from '../../data/appList';
import fileTypeList from '../../data/fileTypeList';
import { getZipNameForLevel } from '../../game/download/archive';
import { GameFlags } from '../../game/state';
import { AppId } from '../../types/App';
import { FileSystemFile } from '../../types/FileSystem';
import { FileTypeId } from '../../types/FileType';
import { ShellItem } from '../../types/Shell';

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
  content: string
): ShellItem => {
  const fileSystemFile: FileSystemFile = {
    content,
    fileTypeId,
    name,
    type: 'file',
  };

  return {
    fileSystemFile,
    fileTypeId,
    hasFocus: false,
    hasSoftFocus: false,
    iconId: fileTypeList[fileTypeId].iconId,
    id,
    name,
    type: 'file',
  };
};

export const getDynamicDesktopItems = (flags: GameFlags): ShellItem[] => {
  const dynamicItems: ShellItem[] = [
    createAppShellItem('click-me-reset', 'clickMeReset', 'click me'),
  ];

  if (flags.hasReceivedPasswordHintCall) {
    dynamicItems.push(
      createAppShellItem(
        'important-passwords-file',
        'importantPasswordsFile',
        'IMPORTANT_PASSWORDS.txt'
      )
    );
  }

  if (flags.hasZipFile) {
    dynamicItems.push(
      createAppShellItem(
        'q3-zip-archive',
        'zipArchive',
        getZipNameForLevel(flags.zipExtractionLevel)
      )
    );
  }

  if (flags.hasZipFile && !flags.hasWinRarInstalled) {
    dynamicItems.push(
      createAppShellItem(
        'winrar-installer',
        'winRarInstaller',
        'WinRAR_installer.exe'
      )
    );
  }

  if (flags.zipGarbageBatch >= 1) {
    dynamicItems.push(
      createFileShellItem(
        'garbage-1',
        'msDosApp',
        'totally_safe_patch.exe',
        'binary-gibberish'
      ),
      createFileShellItem(
        'garbage-2',
        'notepadDoc',
        'desktop-cache.tmp',
        'cache=###\ninvalid=true\n'
      ),
      createFileShellItem(
        'garbage-3',
        'notepadDoc',
        'invoice_scan.tmp',
        'TEMP DATA BLOCK ###'
      )
    );
  }

  if (flags.zipGarbageBatch >= 2) {
    dynamicItems.push(
      createFileShellItem(
        'garbage-4',
        'msDosApp',
        'hotfix_install.exe',
        'binary-junk'
      ),
      createFileShellItem(
        'garbage-5',
        'notepadDoc',
        'debug_dump.tmp',
        'E2 A9 FF 0A 8D 11'
      )
    );
  }

  if (flags.zipGarbageBatch >= 3 || flags.hasFinalReportFile) {
    dynamicItems.push(
      createFileShellItem(
        'wingdings-1',
        'notepadDoc',
        'quarterly_symbols_1.txt',
        '☞ ✖ ✈ ☼ ♣ ♠ ☯ ✉ ☢'
      ),
      createFileShellItem(
        'wingdings-2',
        'notepadDoc',
        'quarterly_symbols_2.txt',
        '✎ ☠ ✿ ♫ ⚑ ☺ ✂ ❖'
      ),
      createFileShellItem(
        'wingdings-3',
        'notepadDoc',
        'quarterly_symbols_3.txt',
        '❂ ☎ ✕ ⚙ ☾ ☍ ✱ ☄'
      )
    );
  }

  if (flags.zipGarbageBatch >= 3 || flags.hasFinalReportFile) {
    dynamicItems.push(
      createFileShellItem(
        'q3-real-report',
        'notepadDoc',
        'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.txt',
        'Q3 REPORT\n\nRevenue was stable across core product lines while support costs rose due to legacy migration work. Gross margin held within expected range after temporary hosting spikes in July.\n\nCustomer retention improved in enterprise accounts, but expansion revenue lagged forecast in the mid-market segment. Sales cycle length increased by roughly two weeks as procurement review tightened.\n\nOperationally, incident count fell quarter-over-quarter, though mean time to recovery remains above target in off-hours windows. Recommended action for Q4: prioritize deployment automation and account handoff playbooks.'
      )
    );
  }

  return dynamicItems;
};
