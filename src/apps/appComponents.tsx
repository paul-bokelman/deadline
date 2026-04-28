import { h, FunctionComponent } from 'preact';

import AntiVirusApp from './antiVirus/AntiVirusApp';
import DraftDocumentLinkApp from './draftDocumentLink/DraftDocumentLinkApp';
import EulaApp from './eula/EulaApp';
import FileConverterApp from './fileConverter/FileConverterApp';
import TipOfDayApp from './tipOfDay/TipOfDayApp';
import EmailClient from './email/EmailClient';
import BlackjackApp from './blackjack/BlackjackApp';
import WalletApp from './wallet/WalletApp';
import PasswordsFile from './notepad/PasswordsFile';
import PortalApp from './portal/PortalApp';
import RecycleBinApp from './recycleBin/RecycleBinApp';
import WinRarExtractor from './winrar/WinRarExtractor';
import WorldWideWebApp from './worldWideWeb/WorldWideWebApp';
import WinRarInstaller from '../stages/download/WinRarInstaller';
import { AppId, AppProps } from '../types/App';
import MyComputerApp from '../components/apps/MyComputerApp/MyComputerApp';
import NotepadApp from '../components/apps/NotepadApp/NotepadApp';
import QuickViewApp from '../components/apps/QuickViewApp/QuickViewApp';
import NetVoiceCallApp from '../components/apps/NetVoiceCallApp/NetVoiceCallApp';
import TimerApp from '../components/apps/TimerApp/TimerApp';
import VoidApp from '../components/apps/VoidApp/VoidApp';

const CorpMailApp: FunctionComponent<AppProps> = () => (
  <EmailClient accountId="corpMail" accountLabel="CorpMail" />
);

const PersonalMailApp: FunctionComponent<AppProps> = () => (
  <EmailClient accountId="personalMail" accountLabel="PersonalMail" />
);

const CorpMailLegacyApp: FunctionComponent<AppProps> = () => (
  <EmailClient accountId="corpMailLegacy" accountLabel="CorpMail 2 (Legacy)" />
);

const ImportantPasswordsFileApp: FunctionComponent<AppProps> = () => (
  <PasswordsFile />
);

export const appComponents: Record<AppId, FunctionComponent<AppProps>> = {
  antiVirus: AntiVirusApp,
  draftDocumentLink: DraftDocumentLinkApp,
  eula: EulaApp,
  fileConverter: FileConverterApp,
  tipOfDay: TipOfDayApp,
  calc: VoidApp,
  cdPlayer: VoidApp,
  clickMeReset: VoidApp,
  defrag: VoidApp,
  exchange: VoidApp,
  explorer: VoidApp,
  find: VoidApp,
  findComputer: VoidApp,
  findMsn: VoidApp,
  help: VoidApp,
  hyperterminal: VoidApp,
  mediaPlayer: VoidApp,
  msn: VoidApp,
  msDos: VoidApp,
  msPaint: VoidApp,
  myComputer: MyComputerApp,
  notepad: NotepadApp,
  phoneDialer: VoidApp,
  register: VoidApp,
  quickView: QuickViewApp,
  recycleBinViewer: RecycleBinApp,
  run: VoidApp,
  scandisk: VoidApp,
  shutdown: VoidApp,
  soundRecorder: VoidApp,
  taskbar: VoidApp,
  timer: TimerApp,
  corpMail: CorpMailApp,
  personalMail: PersonalMailApp,
  corpMailLegacy: CorpMailLegacyApp,
  netVoiceCall: NetVoiceCallApp,
  importantPasswordsFile: ImportantPasswordsFileApp,
  winRarInstaller: WinRarInstaller,
  zipArchive: WinRarExtractor,
  volumeControl: VoidApp,
  wordpad: VoidApp,
  portal: PortalApp,
  blackjack: BlackjackApp,
  bank: WalletApp,
  worldWideWeb: WorldWideWebApp,
};
