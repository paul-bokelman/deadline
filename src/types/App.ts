import { FileSystemDir, FileSystemFile } from './FileSystem';
import { IconId } from './Icon';
import { OpenWindowsContextType } from '../context/OpenWindowsContext';

export const appIds = [
  'antiVirus',
  'draftDocumentLink',
  'fileConverter',
  'calc',
  'cdPlayer',
  'clickMeReset',
  'defrag',
  'exchange',
  'explorer',
  'find',
  'findComputer',
  'findMsn',
  'help',
  'hyperterminal',
  'mediaPlayer',
  'msn',
  'msDos',
  'msPaint',
  'myComputer',
  'notepad',
  'phoneDialer',
  'register',
  'quickView',
  'run',
  'scandisk',
  'shutdown',
  'soundRecorder',
  'taskbar',
  'timer',
  'corpMail',
  'personalMail',
  'corpMailLegacy',
  'netVoiceCall',
  'importantPasswordsFile',
  'winRarInstaller',
  'zipArchive',
  'volumeControl',
  'wordpad',
  'portal',
  'blackjack',
  'bank',
  'worldWideWeb',
] as const;

export type AppId = typeof appIds[number];

export type App = {
  id: AppId;
  iconId: IconId;
  isDraggable?: boolean;
  isResizeable?: boolean;
  name: string;
  size?: { width: number; height: number };
};

export type AppList = { [key in AppId]: App };

export interface AppProps {
  closeWindow: () => void;
  openApp: OpenWindowsContextType['openApp'];
  workingDir?: FileSystemDir;
  workingFile?: FileSystemFile;
}
