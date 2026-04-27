import {
  IconId,
  iconIds,
  IconList,
  IconSize,
  iconSizes,
  IconUrls,
} from '../types/Icon';
import smileyIcon from '../assets/img/interface/minesweeper_happy.png';

function importIcons(files: Record<string, string>) {
  const importedIcons = {} as IconList;
  Object.entries(files).forEach(([key, filePath]) => {
    const matches = key.match(/\/(\w*?)\/(\w*?)_(\d*?)\.png/);
    const iconId = matches ? (matches[1] as IconId) : '';
    const size = matches ? (parseInt(matches[3]) as IconSize) : null;
    if (iconId && size && iconSizes.includes(size)) {
      const iconUrls: IconUrls = importedIcons[iconId]
        ? {
            ...importedIcons[iconId],
            [size]: filePath,
          }
        : {
            [size]: filePath,
          };
      importedIcons[iconId as IconId] = iconUrls;
    }
  });
  importedIcons.smiley = {
    8: smileyIcon,
    16: smileyIcon,
    24: smileyIcon,
    32: smileyIcon,
  };
  const error = iconIds.some((iconId) => {
    if (!importedIcons[iconId])
      console.error(
        `Icon id "${iconId}" doesn't have an associated icon folder.`
      );
    return !importedIcons[iconId];
  });
  if (error) throw "Some Icon ids don't have an associated icon folder";
  return importedIcons;
}
export const iconList = importIcons(
  import.meta.glob('../assets/img/icons/**/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>
);
