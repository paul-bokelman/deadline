import { h, FunctionComponent } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import { appComponents } from '@/apps/appComponents';
import OpenWindowsContext, { OpenWindow } from '@/context/OpenWindowsContext';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import Window from '@/components/shared/Window/Window';

import style from './WindowsContainer.module.css';

const WindowsContainer: FunctionComponent = () => {
  const {
    closeWindow,
    autoFitWindow,
    focusOnWindow,
    maximizeWindow,
    minimizeWindow,
    moveWindow,
    openApp,
    resizeWindow,
    unMaximizeWindow,
    windows,
  } = useContext(OpenWindowsContext);
  const { isNetVoiceCallAccepted } = useGameState();
  const [isDeadlineUrgent, setIsDeadlineUrgent] = useState(false);

  useEffect(() => {
    return gameEventBus.on('deadline:seconds_remaining', ({ seconds }) => {
      setIsDeadlineUrgent(seconds > 0 && seconds <= 60);
    });
  }, []);

  const getAppComponent = (window: OpenWindow) => {
    const component = appComponents[window.app.id];
    return component
      ? h(component, {
          closeWindow: () => closeWindow(window.id),
          key: window.id,
          openApp,
          workingDir: window.workingDir,
          workingFile: window.workingFile,
        })
      : null;
  };

  return (
    <div className={style.windowsContainer}>
      {windows.map((window) => {
        const isNetVoiceCallWindow = window.app.id === 'netVoiceCall';
        if (window.isMinimized && !isNetVoiceCallWindow) return null;

        const canClose =
          !isNetVoiceCallWindow && (window.showCloseButton ?? true);
        const canMinimize = window.canMinimize ?? true;
        const canMaximize = window.canMaximize ?? true;
        const showMaximizeButton = window.showMaximizeButton ?? true;
        const windowTitle = isNetVoiceCallWindow
          ? `NetVoice \u2013 ${
              isNetVoiceCallAccepted ? 'Connected' : 'Incoming Call'
            }`
          : window.title;

        return (
          <Window
            coords={window.coords}
            iconId={window.iconId}
            key={window.id}
            isDraggable={window.isDraggable}
            isInactive={!window.hasFocus}
            isMaximized={window.isMaximized}
            isResizeable={window.isResizeable}
            isUrgent={window.app.id === 'timer' && isDeadlineUrgent}
            onClickClose={
              canClose ? () => closeWindow(window.id) : () => undefined
            }
            onClickMaximize={
              canMaximize ? () => maximizeWindow(window.id) : undefined
            }
            onClickMinimize={
              canMinimize ? () => minimizeWindow(window.id) : undefined
            }
            onClickRestore={
              canMaximize ? () => unMaximizeWindow(window.id) : undefined
            }
            onDblClickTitleBar={() => {
              if (!canMaximize) return;
              if (window.isMaximized) {
                unMaximizeWindow(window.id);
              } else {
                maximizeWindow(window.id);
              }
            }}
            onMouseDown={() => {
              focusOnWindow(window.id);
            }}
            onMoved={(coords) => moveWindow(window.id, coords)}
            onResized={(size) =>
              window.isResizeable ? resizeWindow(window.id, size) : undefined
            }
            onAutoSized={(size) => autoFitWindow(window.id, size)}
            showCloseButton={canClose}
            showMaximizeButton={showMaximizeButton}
            size={window.size}
            sizeMode={window.sizeMode}
            style={window.isMinimized ? { display: 'none' } : undefined}
            title={windowTitle}
            zIndex={window.zIndex}
          >
            {getAppComponent(window)}
          </Window>
        );
      })}
    </div>
  );
};

export default WindowsContainer;
