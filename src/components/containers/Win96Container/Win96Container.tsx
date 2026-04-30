import { h, FunctionComponent, JSX } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import DesktopContainer from '../DesktopContainer/DesktopContainer';
import TaskbarContainer from '../TaskbarContainer/TaskbarContainer';
import WindowsContainer from '../WindowsContainer/WindowsContainer';
import OpenWindowsProvider from './OpenWindowsProvider';
import { GameStateProvider, useGameState } from '../../../game/state';
import GameScenarioController from '../../../game/scenario/GameScenarioController';
import OpenWindowsContext from '../../../context/OpenWindowsContext';
import DownloadStageLayer from '../../../stages/download/DownloadStageLayer';
import IntrusivePopupManager from '../../../system/intrusivePopups/IntrusivePopupManager';
import BluescreenSequence from '../../../stages/transition/BluescreenSequence';
import WinStageLayer from '../../../stages/win/WinStageLayer';
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

const taskManagerBackdropStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 8_000_000,
};

const taskManagerWindowStyle: JSX.CSSProperties = {
  width: '420px',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '10px',
  fontFamily: 'var(--font-family-ui)',
};

const fakeBsodStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#001e9f',
  color: '#ffffff',
  zIndex: 8_000_100,
  padding: '24px',
  fontFamily: 'var(--font-family-sys)',
  fontSize: '18px',
  lineHeight: 1.6,
};

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

const CtrlAltDelTaskManagerTrap: FunctionComponent = () => {
  const { rebootGame } = useGameState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCrashing, setIsCrashing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlAltDel =
        event.ctrlKey &&
        event.altKey &&
        (event.key === 'Delete' || event.code === 'Delete');
      if (!isCtrlAltDel) return;
      if (event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      setIsDialogOpen(true);
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    if (!isCrashing) return undefined;
    const rebootTimerId = window.setTimeout(() => {
      rebootGame();
      setIsCrashing(false);
      setIsDialogOpen(false);
    }, 1800);
    return () => window.clearTimeout(rebootTimerId);
  }, [isCrashing, rebootGame]);

  if (isCrashing) {
    return (
      <div style={fakeBsodStyle}>
        <div>A fatal exception has occurred. TASKMAN_ENDTASK_FAULT</div>
        <div style={{ marginTop: '16px' }}>
          The system is shutting down to prevent damage...
        </div>
      </div>
    );
  }

  if (!isDialogOpen) return null;

  return (
    <div style={taskManagerBackdropStyle}>
      <div style={taskManagerWindowStyle}>
        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Task Manager</div>
        <div style={{ marginBottom: '8px' }}>
          One or more applications are not responding.
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            boxShadow: 'var(--border-field)',
            padding: '8px',
            marginBottom: '10px',
            fontFamily: 'monospace',
          }}
        >
          WIN96.EXE (Not Responding)
        </div>
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
        >
          <button
            type="button"
            style={{
              border: 'none',
              backgroundColor: 'var(--surface)',
              boxShadow:
                'var(--border-raised-outer), var(--border-raised-inner)',
              padding: '4px 8px',
            }}
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            style={{
              border: 'none',
              backgroundColor: 'var(--surface)',
              boxShadow:
                'var(--border-raised-outer), var(--border-raised-inner)',
              padding: '4px 8px',
            }}
            onClick={() => {
              setIsDialogOpen(false);
              const mediaElements = Array.from(
                document.querySelectorAll('audio, video')
              ) as HTMLMediaElement[];
              mediaElements.forEach((mediaElement) => {
                mediaElement.pause();
              });
              setIsCrashing(true);
            }}
          >
            End Task
          </button>
        </div>
      </div>
    </div>
  );
};

const Win96Container: FunctionComponent = () => {
  const [isMirrored, setIsMirrored] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    const updateAppViewportVars = () => {
      const vv = window.visualViewport;
      const width = Math.round(vv?.width ?? window.innerWidth);
      const height = Math.round(vv?.height ?? window.innerHeight);
      root.style.setProperty('--app-width', `${width}px`);
      root.style.setProperty('--app-height', `${height}px`);
    };

    updateAppViewportVars();

    window.addEventListener('resize', updateAppViewportVars, { passive: true });
    window.visualViewport?.addEventListener('resize', updateAppViewportVars, {
      passive: true,
    });
    window.visualViewport?.addEventListener('scroll', updateAppViewportVars, {
      passive: true,
    });
    document.addEventListener('fullscreenchange', updateAppViewportVars, {
      passive: true,
    });

    return () => {
      window.removeEventListener('resize', updateAppViewportVars);
      window.visualViewport?.removeEventListener(
        'resize',
        updateAppViewportVars
      );
      window.visualViewport?.removeEventListener(
        'scroll',
        updateAppViewportVars
      );
      document.removeEventListener('fullscreenchange', updateAppViewportVars);
    };
  }, []);

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
              <SaveHotkeyTrap />
              <CtrlAltDelTaskManagerTrap />
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
        </GameStateProvider>
      </div>
    </div>
  );
};

export default Win96Container;
