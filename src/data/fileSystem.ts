import { appList } from './appList';
import { FileSystemDir } from '../types/FileSystem';
import { createFs, getDirFromPath } from '../utils/win96/FileSystemUtils';

const mergeGlobRecords = (
  ...records: Array<Record<string, unknown>>
): Record<string, unknown> => Object.assign({}, ...records);

export const floppyDriveFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fileSystems/A/**/*.ts', { eager: true }),
    import.meta.glob('../assets/fileSystems/A/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fileSystems/A/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fileSystems/A'
);
export const cdDriveFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fileSystems/D/**/*.ts', { eager: true }),
    import.meta.glob('../assets/fileSystems/D/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fileSystems/D/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fileSystems/D'
);
export const hardDriveFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fileSystems/C/**/*.ts', { eager: true }),
    import.meta.glob('../assets/fileSystems/C/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fileSystems/C/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fileSystems/C'
);
export const controlPanelFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fileSystems/Control Panel/**/*.ts', {
      eager: true,
    }),
    import.meta.glob('../assets/fileSystems/Control Panel/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fileSystems/Control Panel/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fileSystems/Control Panel'
);
export const printersFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fileSystems/Printers/**/*.ts', {
      eager: true,
    }),
    import.meta.glob('../assets/fileSystems/Printers/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fileSystems/Printers/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fileSystems/Printers'
);
export const dialUpNetworkFs = createFs(
  mergeGlobRecords(
    import.meta.glob('../assets/fileSystems/Dial-Up Networking/**/*.ts', {
      eager: true,
    }),
    import.meta.glob('../assets/fileSystems/Dial-Up Networking/**/*.{jpg,png}', {
      eager: true,
      import: 'default',
    }),
    import.meta.glob('../assets/fileSystems/Dial-Up Networking/**/*.txt', {
      eager: true,
      query: '?raw',
      import: 'default',
    })
  ),
  '../assets/fileSystems/Dial-Up Networking'
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
          toAppId: 'myComputer',
          type: 'shortcut',
        },
        printers: {
          name: 'Printers',
          iconId: 'printers',
          type: 'dir',
          dir: {},
        },
        taskbar: {
          appId: appList.taskbar.id,
          type: 'app',
        },
      },
    },
    find: {
      name: 'Find',
      iconId: 'find',
      type: 'dir',
      dir: {
        findFiles: {
          name: 'Files or Folders...',
          iconId: appList.find.iconId,
          appId: appList.find.id,
          type: 'app',
        },
        findComputers: {
          name: 'Computers...',
          iconId: appList.findComputer.iconId,
          appId: appList.findComputer.id,
          type: 'app',
        },
      },
    },
    help: {
      appId: appList.help.id,
      type: 'app',
    },
    run: {
      appId: appList.run.id,
      type: 'app',
    },
    shutdown: {
      appId: appList.shutdown.id,
      type: 'app',
    },
  },
} as const;

export const myComputerFs = {
  name: 'My Computer',
  iconId: appList.myComputer.iconId,
  type: 'dir',
  dir: {
    'A:': floppyDriveFs,
    'C:': hardDriveFs,
    'D:': cdDriveFs,
    controlPanel: controlPanelFs,
    printers: printersFs,
    dialUpNetwork: dialUpNetworkFs,
  },
} as const;

const typedMyComputerFs: FileSystemDir = myComputerFs as typeof myComputerFs;

export default typedMyComputerFs;
