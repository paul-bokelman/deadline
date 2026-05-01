import { appList } from './appList';
import { FileSystemDir } from '../types/FileSystem';

const rootFs = {
  name: 'Explorer',
  iconId: appList.explorer.iconId,
  type: 'dir',
  dir: {
    Desktop: {
      name: 'Desktop',
      type: 'dir',
      dir: {
        '4-Recycle Bin': {
          name: 'Recycle Bin',
          type: 'dir',
          dirType: 'recycleBin',
          iconId: 'binEmpty',
          dir: {},
        },
        '5-CorpMail.app.ts': {
          type: 'app',
          appId: 'corpMail',
          name: 'CorpMail',
        },
        '6-PersonalMail.app.ts': {
          type: 'app',
          appId: 'personalMail',
          name: 'PersonalMail',
        },
        '7-Notes.app.ts': {
          type: 'app',
          appId: 'notepad',
          name: 'Notes',
        },
        Password_Vault: {
          type: 'dir',
          name: 'PasswordVault',
          iconId: 'passwordVault',
          dir: {
            '1-I': {
              type: 'dir',
              name: 'I',
              dir: {
                '1-DoNotOpen': {
                  type: 'dir',
                  name: 'DoNotOpen',
                  dir: {},
                },
              },
            },
            '2-II': {
              type: 'dir',
              name: 'II',
              dir: {
                '1-DoNotOpen': {
                  type: 'dir',
                  name: 'DoNotOpen',
                  dir: {},
                },
              },
            },
            '3-III': {
              type: 'dir',
              name: 'III',
              dir: {
                '1-DoNotOpen': {
                  type: 'dir',
                  name: 'DoNotOpen',
                  dir: {},
                },
              },
            },
            '4-IV': {
              type: 'dir',
              name: 'IV',
              dir: {
                '1-cat': { type: 'dir', name: 'cat', dir: {} },
                '2-fish': { type: 'dir', name: 'fish', dir: {} },
                '3-hamster': { type: 'dir', name: 'hamster', dir: {} },
                '4-turtle': { type: 'dir', name: 'turtle', dir: {} },
                '5-iguana': { type: 'dir', name: 'iguana', dir: {} },
                '6-cow': { type: 'dir', name: 'cow', dir: {} },
                '7-camel': { type: 'dir', name: 'camel', dir: {} },
                '8-beaver': {
                  type: 'dir',
                  name: 'beaver',
                  dir: {
                    '1-Barcelona': {
                      type: 'dir',
                      name: 'Barcelona',
                      dir: {
                        '1-Encryption Key.txt': {
                          type: 'file',
                          name: 'Encryption Key',
                          fileTypeId: 'notepadDoc',
                          content:
                            'Encryption Key\n==============\n\nUse this encryption key to download the document:\nAAAA-BBBB-CCCC-DDDD',
                        },
                      },
                    },
                    '2-France': { type: 'dir', name: 'France', dir: {} },
                    '3-Bejing': { type: 'dir', name: 'Bejing', dir: {} },
                    '4-Mumbai': { type: 'dir', name: 'Mumbai', dir: {} },
                    '5-Hollywood': {
                      type: 'dir',
                      name: 'Hollywood',
                      dir: {},
                    },
                    '6-Lima': { type: 'dir', name: 'Lima', dir: {} },
                  },
                },
              },
            },
          },
        },
      },
    },
    'Explorer.ts': {
      type: 'app',
      appId: 'explorer',
      name: 'Explorer',
    },
    'Notepad.app.ts': {
      type: 'app',
      appId: 'notepad',
    },
  },
} as const;

const typedRootFs: FileSystemDir = rootFs as typeof rootFs;

export { rootFs };
export default typedRootFs;
