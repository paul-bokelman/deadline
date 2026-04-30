import { h, FunctionComponent } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import DesktopContainer from '../DesktopContainer/DesktopContainer';
import TaskbarContainer from '../TaskbarContainer/TaskbarContainer';
import WindowsContainer from '../WindowsContainer/WindowsContainer';
import OpenWindowsProvider from './OpenWIndowsProvider';
import { GameStateProvider, useGameState } from '../../../game/state';
import GameScenarioController from '../../../game/scenario/GameScenarioController';
import OpenWindowsContext from '../../../context/OpenWindowsContext';
import DownloadStageLayer from '../../../stages/download/DownloadStageLayer';
import IntrusivePopupManager from '../../../system/intrusivePopups/IntrusivePopupManager';
import { I18nProvider } from '../../../system/i18n';
import BluescreenSequence from '../../../stages/transition/BluescreenSequence';
import WinStageLayer from '../../../stages/win/WinStageLayer';
import Narrator from '../../../system/narrator/Narrator';
import WindowsUpdateNag from '../../../system/windowsUpdate/WindowsUpdateNag';
import BootLoaderScreen, {
  triggerBootLoaderScreen,
} from '../../shared/BootLoaderScreen/BootLoaderScreen';
import { playClickSfx } from '../../../utils/audio/sfx';
import DeadPixelOverlay from '../../../system/deadPixels/DeadPixelOverlay';
import BackgroundFlyOverlay from '../../../system/backgroundFly/BackgroundFlyOverlay';
import { gameEventBus } from '../../../game/events';
import ClippyAssistant from '../../../system/clippy/ClippyAssistant';
import FullscreenRecommendation from '../../../system/fullscreen/FullscreenRecommendation';
import InstantBsodTrap from '../../../system/traps/InstantBsodTrap';

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

const BrowserNavigationSync: FunctionComponent = () => {
  const { openApp } = useContext(OpenWindowsContext);

  useEffect(() => {
    return gameEventBus.on('browser:navigate_to_url', ({ url }) => {
      openApp({ appId: 'worldWideWeb' });
      window.setTimeout(() => {
        gameEventBus.emit('browser:url_requested', { url });
      }, 40);
    });
  }, [openApp]);

  return null;
};

const SaveHotkeyTrap: FunctionComponent = () => {
  const { focusOnWindow, openApp, unMinimizeWindow, windows } = useContext(
    OpenWindowsContext
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (!isSaveShortcut) return;
      if (event.repeat) return;
      event.preventDefault();
      event.stopPropagation();

      const existingEulaWindow = windows.find(
        (window) => window.app.id === 'eula'
      );
      if (!existingEulaWindow) {
        openApp({ appId: 'eula' });
        return;
      }
      if (existingEulaWindow.isMinimized) {
        unMinimizeWindow(existingEulaWindow.id);
      } else {
        focusOnWindow(existingEulaWindow.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [focusOnWindow, openApp, unMinimizeWindow, windows]);

  return null;
};

const Win96Container: FunctionComponent = () => {
  const [isMirrored, setIsMirrored] = useState(false);

  useEffect(() => {
    void triggerBootLoaderScreen();
  }, []);

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

  useEffect(() => {
    const unsubscribeMirror = gameEventBus.on('screen:mirror_toggled', () => {
      setIsMirrored((current) => !current);
    });
    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setIsMirrored(false);
    });
    return () => {
      unsubscribeMirror();
      unsubscribeRebooted();
    };
  }, []);

  return (
    <div className={style.win96}>
      <div
        className={`${style.shell} ${isMirrored ? style.shellMirrored : ''}`}
      >
        <GameStateProvider>
          <I18nProvider>
            <OpenWindowsProvider>
              <div className={style.mainView}>
                <DesktopContainer />
                <WindowsContainer />
                <DownloadStageLayer />
                <BluescreenSequence />
                <WinStageLayer />
                <IntrusivePopupManager />
                <WindowsUpdateNag />
                <FullscreenRecommendation />
                <InstantBsodTrap />
                <ClippyAssistant />
                <Narrator />
                <SaveHotkeyTrap />
                <NetVoiceCallWindowSync />
                <BrowserNavigationSync />
                <GameScenarioController />
              </div>
              <div className={style.taskbarView}>
                <TaskbarContainer />
              </div>
              <BootLoaderScreen />
              <DeadPixelOverlay />
              <BackgroundFlyOverlay />
            </OpenWindowsProvider>
          </I18nProvider>
        </GameStateProvider>
      </div>
    </div>
  );
};

export default Win96Container;
