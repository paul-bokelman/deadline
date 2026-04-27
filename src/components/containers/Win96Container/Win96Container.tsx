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
import IntrusivePopupManager from '../../../system/intrusivePopups/IntrusivePopupManager';
import { I18nProvider } from '../../../system/i18n';
import BluescreenSequence from '../../../stages/transition/BluescreenSequence';
import WinStageLayer from '../../../stages/win/WinStageLayer';
import Narrator from '../../../system/narrator/Narrator';
import WindowsUpdateNag from '../../../system/windowsUpdate/WindowsUpdateNag';
import BootLoaderScreen from '../../shared/BootLoaderScreen/BootLoaderScreen';
import { playClickSfx } from '../../../utils/audio/sfx';

import style from './Win96Container.module.css';

const NetVoiceCallWindowSync: FunctionComponent = () => {
  const { activeNetVoiceCallId } = useGameState();
  const { closeWindow, openApp, windows } = useContext(OpenWindowsContext);

  useEffect(() => {
    const netVoiceWindows = windows.filter(
      (window) => window.app.id === 'netVoiceCall'
    );

    if (activeNetVoiceCallId && netVoiceWindows.length === 0) {
      openApp({ appId: 'netVoiceCall' });
      return;
    }

    if (!activeNetVoiceCallId && netVoiceWindows.length > 0) {
      netVoiceWindows.forEach((window) => closeWindow(window.id));
    }
  }, [activeNetVoiceCallId, windows, openApp, closeWindow]);

  return null;
};

const Win96Container: FunctionComponent = () => {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      playClickSfx();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  return (
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
                <WinStageLayer />
                <MalwarePopupManager />
                <IntrusivePopupManager />
                <WindowsUpdateNag />
                <Narrator />
                <NetVoiceCallWindowSync />
                <GameScenarioController />
              </div>
              <div className={style.taskbarView}>
                <TaskbarContainer />
              </div>
              <BootLoaderScreen />
            </OpenWindowsProvider>
          </I18nProvider>
        </GameStateProvider>
      </div>
    </div>
  );
};

export default Win96Container;
