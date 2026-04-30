import { useEffect, useState } from 'preact/hooks';
import { FileSystemDir } from '../types/FileSystem';
import { ShellItem } from '../types/Shell';
import { getShellItems } from '../utils/win96/ShellUtils';
import { gameEventBus } from '../game/events';

export const useShellFilesState = (
  workingDir: FileSystemDir,
  sorted = true
): {
  files: ShellItem[];
  focusOnFile: (fileId: string) => void;
  removeFocus: () => void;
} => {
  const [files, setFiles] = useState<ShellItem[]>([]);

  const getShellItemIdentity = (item: ShellItem): string => {
    if (item.type === 'app') return `app:${item.appId}:${item.name}`;
    if (item.type === 'dir') {
      return `dir:${item.fileSystemDir.name}:${
        item.fileSystemDir.dirType ?? 'default'
      }`;
    }
    return `file:${item.fileTypeId}:${item.name}`;
  };

  const withPreservedIds = (
    previousItems: ShellItem[],
    nextItems: ShellItem[]
  ): ShellItem[] => {
    const previousByIdentity = new Map<string, ShellItem[]>();
    previousItems.forEach((item) => {
      const identity = getShellItemIdentity(item);
      const bucket = previousByIdentity.get(identity);
      if (bucket) {
        bucket.push(item);
        return;
      }
      previousByIdentity.set(identity, [item]);
    });

    return nextItems.map((item) => {
      const identity = getShellItemIdentity(item);
      const bucket = previousByIdentity.get(identity);
      if (!bucket || bucket.length === 0) return item;
      const previous = bucket.shift();
      if (!previous) return item;
      return {
        ...item,
        id: previous.id,
        hasFocus: previous.hasFocus,
        hasSoftFocus: previous.hasSoftFocus,
      };
    });
  };

  useEffect(() => {
    setFiles((previous) =>
      withPreservedIds(previous, getShellItems(workingDir, sorted))
    );
  }, [sorted, workingDir]);

  useEffect(() => {
    return gameEventBus.on('shell:directory_updated', ({ dir }) => {
      if (dir !== workingDir) return;
      setFiles((previous) =>
        withPreservedIds(previous, getShellItems(workingDir, sorted))
      );
    });
  }, [sorted, workingDir]);

  const focusOnFile = (fileId: string) => {
    setFiles((f) =>
      f.map((file) => ({
        ...file,
        hasFocus: file.id === fileId,
        hasSoftFocus: file.id === fileId,
      }))
    );
  };

  const removeFocus = () => {
    setFiles((f) =>
      f.map((file) => ({
        ...file,
        hasFocus: false,
        hasSoftFocus: file.hasFocus,
      }))
    );
  };

  return { files, focusOnFile, removeFocus };
};

export default useShellFilesState;
