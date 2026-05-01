import {
  FileSystemApp,
  FileSystemDir,
  FileSystemFile,
} from '@/types/FileSystem';
import { ShellItem } from '@/types/Shell';
import { appList } from '@/data/appList';
import fileTypeList from '@/data/fileTypeList';
import { getAppIconId } from './AppIconUtils';

export const getShellItems = (
  fileSystemDir: FileSystemDir,
  sorted = true
): ShellItem[] => {
  const gridFiles = Object.values(fileSystemDir.dir).map((item, i) => {
    if (item.type === 'app') {
      return getShellApp(item as FileSystemApp, i === 0);
    }
    if (item.type === 'file') {
      return getShellFile(item as FileSystemFile, i === 0);
    }
    //TODO : need to implement shortcuts :(

    // Else Dir
    return getShellDir(item as FileSystemDir, i === 0);
  });

  if (sorted) {
    const locale = new Intl.Collator('en', { sensitivity: 'base' });
    gridFiles.sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return locale.compare(a.name, b.name);
    });
  }

  return gridFiles;
};

const getShellApp = (
  fileSystemApp: FileSystemApp,
  hasSoftFocus: boolean
): ShellItem => {
  return {
    appId: fileSystemApp.appId,
    id: crypto.randomUUID(),
    iconId: fileSystemApp.iconId ?? getAppIconId(fileSystemApp.appId),
    hasFocus: false,
    hasSoftFocus,
    name: fileSystemApp.name
      ? fileSystemApp.name
      : appList[fileSystemApp.appId].name,
    type: 'app',
  };
};

const getShellDir = (
  fileSystemDir: FileSystemDir,
  hasSoftFocus: boolean
): ShellItem => ({
  fileSystemDir,
  id: crypto.randomUUID(),
  iconId: fileSystemDir.iconId ?? 'folderClosed',
  hasFocus: false,
  hasSoftFocus,
  name: fileSystemDir.name,
  type: 'dir',
});

const getShellFile = (
  fileSystemFile: FileSystemFile,
  hasSoftFocus: boolean
): ShellItem => ({
  fileSystemFile,
  fileTypeId: fileSystemFile.fileTypeId,
  id: crypto.randomUUID(),
  iconId: fileTypeList[fileSystemFile.fileTypeId].iconId,
  hasFocus: false,
  hasSoftFocus,
  name: fileSystemFile.name,
  type: 'file',
});
