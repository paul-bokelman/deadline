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
export const controlPanelFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fs/content/control-panel/**/*.ts', {
      eager: true,
    }),
    import.meta.glob('../assets/fs/content/control-panel/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fs/content/control-panel/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fs/content/control-panel'
);
export const printersFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fs/content/printers/**/*.ts', {
      eager: true,
    }),
    import.meta.glob('../assets/fs/content/printers/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fs/content/printers/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fs/content/printers'
);
export const dialUpNetworkFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fs/content/dial-up-networking/**/*.ts', {
      eager: true,
    }),
    import.meta.glob(
      '../assets/fs/content/dial-up-networking/**/*.{jpg,png}',
      {
        eager: true,
        import: 'default',
      }
    ),
    import.meta.glob('../assets/fs/content/dial-up-networking/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fs/content/dial-up-networking'
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
        controlPanel: {
          iconId: 'controlPanel',
          dirPath: 'controlPanel',
          name: 'Control Panel',
          toAppId: 'explorer',
          type: 'shortcut',
        },
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
