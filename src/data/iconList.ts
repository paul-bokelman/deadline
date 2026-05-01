import { IconId, iconIds, IconList, IconSize, iconSizes } from '../types/Icon';

const ICONS = import.meta.glob('../assets/images/icons/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const parseIconFileName = (
  path: string
): { iconId: IconId; size: IconSize | null } => {
  const fileName = path.split('/').pop() ?? '';
  const lastUnderscore = fileName.lastIndexOf('_');
  const extensionIndex = fileName.lastIndexOf('.png');

  if (lastUnderscore <= 0 || extensionIndex <= lastUnderscore) {
    throw new Error(`Invalid icon filename format: ${fileName}`);
  }

  const iconId = fileName.slice(0, lastUnderscore);
  const size = Number.parseInt(
    fileName.slice(lastUnderscore + 1, extensionIndex),
    10
  );

  if (!iconIds.includes(iconId as IconId)) {
    throw new Error(`Unknown icon id in filename: ${fileName}`);
  }
  if (!iconSizes.includes(size as IconSize)) {
    return { iconId: iconId as IconId, size: null };
  }

  return { iconId: iconId as IconId, size: size as IconSize };
};

const createIconList = (): IconList => {
  const iconList = {} as IconList;

  for (const [path, url] of Object.entries(ICONS)) {
    const { iconId, size } = parseIconFileName(path);
    if (size === null) continue;
    iconList[iconId] = {
      ...iconList[iconId],
      [size]: url,
    };
  }

  for (const iconId of iconIds) {
    if (!iconList[iconId]) {
      throw new Error(`Missing icon files for iconId: ${iconId}`);
    }
  }

  return iconList;
};

export const iconList = createIconList();
