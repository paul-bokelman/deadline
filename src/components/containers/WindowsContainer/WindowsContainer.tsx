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
              isNetVoiceCallWindow
                ? () => undefined
                : () => closeWindow(window.id)
            }
            onClickMaximize={
              window.isResizeable ? () => maximizeWindow(window.id) : undefined
            }
            onClickMinimize={
              isNetVoiceCallWindow ? undefined : () => minimizeWindow(window.id)
            }
            onClickRestore={
              window.isResizeable
                ? () => unMaximizeWindow(window.id)
                : undefined
            }
            onDblClickTitleBar={() => {
              if (!window.isResizeable) return;
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
            showCloseButton={!isNetVoiceCallWindow}
            showMaximizeButton={!isNetVoiceCallWindow}
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
