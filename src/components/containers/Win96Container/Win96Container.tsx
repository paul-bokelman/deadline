import { h, FunctionComponent } from 'preact';
import { useContext, useEffect } from 'preact/hooks';

import DesktopContainer from '../DesktopContainer/DesktopContainer';
import TaskbarContainer from '../TaskbarContainer/TaskbarContainer';
import WindowsContainer from '../WindowsContainer/WindowsContainer';
import OpenWindowsProvider from './OpenWIndowsProvider';
import { GameStateProvider, useGameState } from '../../../game/state';
import GameScenarioController from '../../../game/scenario/GameScenarioController';
import OpenWindowsContext from '../../../context/OpenWindowsContext';
import DownloadStageLayer from '../../../stages/download/DownloadStageLayer';
import MalwarePopupManager from '../../../system/malware/MalwarePopupManager';
import { I18nProvider } from '../../../system/i18n';
import BluescreenSequence from '../../../stages/transition/BluescreenSequence';
import Narrator from '../../../system/narrator/Narrator';
import WindowsUpdateNag from '../../../system/windowsUpdate/WindowsUpdateNag';
import BiosScreen from '../../../stages/intro/BiosScreen';

import style from './Win96Container.module.css';

const SkypeCallWindowSync: FunctionComponent = () => {
  const { activeSkypeCallId } = useGameState();
  const { closeWindow, openApp, windows } = useContext(OpenWindowsContext);

  useEffect(() => {
    const skypeWindows = windows.filter(
      (window) => window.app.id === 'skypeCall'
    );

    if (activeSkypeCallId && skypeWindows.length === 0) {
      openApp({ appId: 'skypeCall' });
      return;
    }

    if (!activeSkypeCallId && skypeWindows.length > 0) {
      skypeWindows.forEach((window) => closeWindow(window.id));
    }
  }, [activeSkypeCallId, windows, openApp, closeWindow]);

  return null;
};

const InitialBiosLayer: FunctionComponent = () => {
  const { hasSeenInitialBios, stage, completeInitialBios } = useGameState();

  if (hasSeenInitialBios) return null;
  if (stage !== 'bios' && stage !== 'boot') return null;

  return <BiosScreen onBoot={completeInitialBios} />;
};

const Win96Container: FunctionComponent = () => (
  <div className={style.win96}>
    <div className={style.shell}>
      <GameStateProvider>
        <I18nProvider>
          <OpenWindowsProvider>
            <div className={style.mainView}>
              <DesktopContainer />
              <WindowsContainer />
              <DownloadStageLayer />
              <BluescreenSequence />
              <MalwarePopupManager />
              <WindowsUpdateNag />
              <Narrator />
              <SkypeCallWindowSync />
              <GameScenarioController />
            </div>
            <div className={style.taskbarView}>
              <TaskbarContainer />
            </div>
            <InitialBiosLayer />
          </OpenWindowsProvider>
        </I18nProvider>
      </GameStateProvider>
    </div>
  </div>
);

export default Win96Container;
