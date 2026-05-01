import { appList } from './appList';
import { FileSystemDir } from '../types/FileSystem';
import { createFs } from '../utils/win96/FileSystemUtils';

const mergeGlobRecords = (
  ...records: Array<Record<string, unknown>>
): Record<string, unknown> => Object.assign({}, ...records);

export const hardDriveFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fs/content/c-drive/**/*.ts', { eager: true }),
    import.meta.glob('../assets/fs/content/c-drive/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fs/content/c-drive/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fs/content/c-drive'
);
export const rootFs = {
  name: 'Explorer',
  iconId: appList.explorer.iconId,
  type: 'dir',
  dir: {
    'C:': hardDriveFs,
  },
} as const;

const typedRootFs: FileSystemDir = rootFs as typeof rootFs;

export default typedRootFs;
