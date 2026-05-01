import { FileSystemDir, FileSystemFile, FileSystemItem } from '@/types/FileSystem';

export const getDirFromPath = (
  path: string,
  currentDirNode: FileSystemDir
): FileSystemDir => {
  const pathArray = path.split('/').filter((p) => p.length);

  if (pathArray.length === 0) {
    return currentDirNode;
  }

  if (!(pathArray[0] in currentDirNode.dir)) {
    console.error(
      `"Folder "${pathArray[0]}" doesn't exist in "${currentDirNode.name}"`
    );
    return currentDirNode;
  }

  const nextNode = currentDirNode.dir[pathArray[0]];
  if (!('dir' in nextNode) || !('name' in nextNode)) {
    console.error(
      `"Item "${pathArray[0]}" in "${currentDirNode.name}" is not a folder.`
    );
    return currentDirNode;
  }

  const [, ...nextPathArray] = pathArray;
  const nextPath = nextPathArray.join('/');

  return getDirFromPath(nextPath, nextNode);
};

export const getFileFromPath = (
  path: string,
  currentNode: FileSystemItem
): FileSystemFile | null => {
  const pathArray = path.split('/').filter((p) => p.length);

  if (pathArray.length === 0) {
    return 'fileTypeId' in currentNode ? currentNode : null;
  }

  if (!('dir' in currentNode)) return null;
  const currentDirNode = currentNode as unknown as FileSystemDir;

  if (!(pathArray[0] in currentDirNode.dir)) return null;

  const nextNode = currentDirNode.dir[pathArray[0]];

  const [, ...nextPathArray] = pathArray;
  const nextPath = nextPathArray.join('/');

  return getFileFromPath(nextPath, nextNode);
};
