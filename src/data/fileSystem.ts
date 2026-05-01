import { appList } from './appList';
import { FileSystemDir } from '../types/FileSystem';
import { createFs, getDirFromPath } from '../utils/win96/FileSystemUtils';

const mergeGlobRecords = (
  ...records: Array<Record<string, unknown>>
): Record<string, unknown> => Object.assign({}, ...records);

export const floppyDriveFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fs/content/a-drive/**/*.ts', { eager: true }),
    import.meta.glob('../assets/fs/content/a-drive/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fs/content/a-drive/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fs/content/a-drive'
);
export const cdDriveFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fs/content/d-drive/**/*.ts', { eager: true }),
    import.meta.glob('../assets/fs/content/d-drive/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fs/content/d-drive/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fs/content/d-drive'
);
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
export const startMenuFs = {
  name: 'Start Menu',
  type: 'dir',
  dir: {
    programs: getDirFromPath('Windows/StartMenu/Programs', hardDriveFs),
    documents: {
      name: 'Documents',
      iconId: 'documents',
      type: 'dir',
      dir: {
        readMe: {
          name: 'Readme',
          iconId: 'notepadDoc',
          fileTypeId: 'notepadDoc',
          content: '',
          type: 'file',
        },
      },
    },
    settings: {
      name: 'Settings',
      iconId: 'settings',
      type: 'dir',
      dir: {
        printers: {
          name: 'Printers',
          iconId: 'printers',
          type: 'dir',
          dir: {},
        },
      },
    },
    help: {
      appId: appList.help.id,
      type: 'app',
    },
    shutdown: {
      appId: appList.shutdown.id,
      type: 'app',
    },
  },
} as const;

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
