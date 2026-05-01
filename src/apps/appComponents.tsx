import { h, FunctionComponent } from 'preact';

import AntiVirusApp from './antiVirus/AntiVirusApp';
import DraftDocumentLinkApp from './draftDocumentLink/DraftDocumentLinkApp';
import EulaApp from './eula/EulaApp';
import FileConverterApp from './fileConverter/FileConverterApp';
import SystemPerformanceApp from './systemPerformance/SystemPerformanceApp';
import EmailClient from './email/EmailClient';
import BlackjackApp from './blackjack/BlackjackApp';
import ClickMeApp from './clickMe/ClickMeApp';
import LeaderboardApp from './leaderboard/LeaderboardApp';
import WalletApp from './wallet/WalletApp';
import MinesweeperApp from './minesweeper/MinesweeperApp';
import PortalApp from './portal/PortalApp';
import RecycleBinApp from './recycleBin/RecycleBinApp';
import RemoteDesktopCableFixApp from './remoteDesktopCableFix/RemoteDesktopCableFixApp';
import WinRarExtractor from './winrar/WinRarExtractor';
import WorldWideWebApp from './worldWideWeb/WorldWideWebApp';
import WinRarInstaller from '../stages/download/WinRarInstaller';
import { AppId, AppProps } from '../types/App';
import ExplorerApp from './ExplorerApp/ExplorerApp';
import NotepadApp from './NotepadApp/NotepadApp';
import QuickViewApp from './QuickViewApp/QuickViewApp';
import NetVoiceCallApp from './NetVoiceCallApp/NetVoiceCallApp';
import TimerApp from './TimerApp/TimerApp';
import VoidApp from './VoidApp/VoidApp';

const CorpMailApp: FunctionComponent<AppProps> = () => (
  <EmailClient accountId="corpMail" accountLabel="CorpMail" />
);

const PersonalMailApp: FunctionComponent<AppProps> = () => (
  <EmailClient accountId="personalMail" accountLabel="PersonalMail" />
);

const CorpMailLegacyApp: FunctionComponent<AppProps> = () => (
  <EmailClient accountId="corpMailLegacy" accountLabel="CorpMail 2 (Legacy)" />
);

export const appComponents: Record<AppId, FunctionComponent<AppProps>> = {
  antiVirus: AntiVirusApp,
  draftDocumentLink: DraftDocumentLinkApp,
  eula: EulaApp,
  fileConverter: FileConverterApp,
  systemPerformance: SystemPerformanceApp,
  calc: VoidApp,
  clickMeReset: ClickMeApp,
  defrag: VoidApp,
  exchange: VoidApp,
  explorer: ExplorerApp,
  help: VoidApp,
  hyperterminal: VoidApp,
  msn: VoidApp,
  msDos: VoidApp,
  msPaint: VoidApp,
  notepad: NotepadApp,
  phoneDialer: VoidApp,
  register: VoidApp,
  quickView: QuickViewApp,
  recycleBinViewer: RecycleBinApp,
  scandisk: VoidApp,
  shutdown: VoidApp,
  timer: TimerApp,
  corpMail: CorpMailApp,
  personalMail: PersonalMailApp,
  corpMailLegacy: CorpMailLegacyApp,
  netVoiceCall: NetVoiceCallApp,
  winRarInstaller: WinRarInstaller,
  zipArchive: WinRarExtractor,
  wordpad: VoidApp,
  portal: PortalApp,
  blackjack: BlackjackApp,
  leaderboard: LeaderboardApp,
  bank: WalletApp,
  worldWideWeb: WorldWideWebApp,
  minesweeper: MinesweeperApp,
  remoteDesktopCableFix: RemoteDesktopCableFixApp,
};
