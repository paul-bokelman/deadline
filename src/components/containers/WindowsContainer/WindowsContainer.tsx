import { h, FunctionComponent } from 'preact';
import { useContext } from 'preact/hooks';

import { appComponents } from '../../../apps/appComponents';
import OpenWindowsContext, {
  OpenWindow,
} from '../../../context/OpenWindowsContext';
import { useGameState } from '../../../game/state';
import Window from '../../shared/Window/Window';

import style from './WindowsContainer.module.css';

const WindowsContainer: FunctionComponent = () => {
  const {
    closeWindow,
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
        if (window.isMinimized) return null;

        const isNetVoiceCallWindow = window.app.id === 'netVoiceCall';
        const canClose =
          !isNetVoiceCallWindow && (window.showCloseButton ?? true);
        const canMinimize =
          !isNetVoiceCallWindow && (window.canMinimize ?? true);
        const canMaximize =
          !isNetVoiceCallWindow && (window.canMaximize ?? window.isResizeable);
        const showMaximizeButton =
          !isNetVoiceCallWindow && (window.showMaximizeButton ?? true);
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
              if (!window.isMaximized) focusOnWindow(window.id);
            }}
            onMoved={(coords) => moveWindow(window.id, coords)}
            onResized={(size) =>
              window.isResizeable ? resizeWindow(window.id, size) : undefined
            }
            showCloseButton={canClose}
            showMaximizeButton={showMaximizeButton}
            size={window.size}
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
