import { FileSystemDir, FileSystemFile } from './FileSystem';
import { IconId } from './Icon';
import { OpenWindowsContextType } from '../context/OpenWindowsContext';

export const appIds = [
  'antiVirus',
  'draftDocumentLink',
  'eula',
  'fileConverter',
  'systemPerformance',
  'clickMeReset',
  'explorer',
  'help',
  'notepad',
  'quickView',
  'recycleBinViewer',
  'shutdown',
  'timer',
  'corpMail',
  'personalMail',
  'corpMailLegacy',
  'netVoiceCall',
  'winRarInstaller',
  'zipArchive',
  'portal',
  'blackjack',
  'leaderboard',
  'bank',
  'worldWideWeb',
  'minesweeper',
  'remoteDesktopCableFix',
] as const;

export type AppId = typeof appIds[number];

export type App = {
  id: AppId;
  iconId: IconId;
  isDraggable?: boolean;
  isResizeable?: boolean;
  name: string;
  size?: { width: number; height: number };
  sizeMode?: 'fixed' | 'content';
};

export type AppList = { [key in AppId]: App };

export interface AppProps {
  closeWindow: () => void;
  openApp: OpenWindowsContextType['openApp'];
  workingDir?: FileSystemDir;
  workingFile?: FileSystemFile;
}
