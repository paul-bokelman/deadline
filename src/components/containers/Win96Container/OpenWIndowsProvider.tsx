import { h, FunctionComponent, ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { v4 as uuid } from 'uuid';

import { App } from '../../../types/App';
import { IconId } from '../../../types/Icon';
import { FileSystemDir, FileSystemFile } from '../../../types/FileSystem';
import { appList } from '../../../data/appList';
import OpenWindowsContext, {
  OpenWindow,
  OpenWindowsContextType,
} from '../../../context/OpenWindowsContext';
import { gameEventBus } from '../../../game/events';
import { useGameState } from '../../../game/state';
import { translateLiteralForLocale } from '../../../system/i18n';

interface Props {
  children: ComponentChildren;
}

const TASKBAR_DOCK_HEIGHT = 34;
const MIN_WINDOW_HEIGHT = 150;

const createInitialOpenWindows = (): OpenWindow[] => {
  const timerApp = appList.timer;
  return [
    {
      app: timerApp,
      canMaximize: true,
      canMinimize: true,
      coords: { x: 420, y: 56 },
      hasFocus: true,
      iconId: timerApp.iconId,
      id: uuid(),
      isDraggable: timerApp.isDraggable ?? true,
      isMaximized: false,
      isMinimized: false,
      isResizeable: timerApp.isResizeable ?? true,
      showCloseButton: false,
      showMaximizeButton: true,
      size: {
        x: timerApp.size ? timerApp.size.width : 300,
        y: timerApp.size ? timerApp.size.height : 300,
      },
      title: timerApp.name,
      zIndex: 0,
    },
  ];
};

const OpenWindowsProvider: FunctionComponent<Props> = ({ children }: Props) => {
  const { flags, rebootGame } = useGameState();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>(
    createInitialOpenWindows
  );

  const getBiggestZIndex = (windows: OpenWindow[]): number => {
    if (!windows.length) return -1;
    return windows.reduce(
      (acc, window) => (window.zIndex > acc ? window.zIndex : acc),
      0
    );
  };

  const getWindowTitle = (
    app: App,
    workingDir?: FileSystemDir,
    workingFile?: FileSystemFile
  ): string => {
    const translatedAppName = translateLiteralForLocale(
      flags.language,
      app.name
    );
    if (workingFile && workingFile.name) {
      return `${workingFile.name} - ${translatedAppName}`;
    }
    if (workingDir)
      return translateLiteralForLocale(flags.language, workingDir.name);
    return translatedAppName;
  };

  const getWindowIconId = (app: App, workingDir?: FileSystemDir): IconId => {
    if (app.id !== 'myComputer') return app.iconId;
    if (workingDir && workingDir.iconId) return workingDir.iconId;
    if (workingDir) return 'folderOpen';
    return app.iconId;
  };

  const openApp: OpenWindowsContextType['openApp'] = ({
    appId,
    workingDir,
    workingFile,
  }) => {
    if (appId === 'shutdown') {
      rebootGame();
      return;
    }

    if (appId === 'clickMeReset') {
      rebootGame();
      return;
    }
    const isProjectDeadlineWindow = appId === 'timer';
    const isEulaWindow = appId === 'eula';

    setOpenWindows((windows) => {
      const app = appList[appId];
      const iconId = getWindowIconId(app, workingDir);
      const title = getWindowTitle(app, workingDir, workingFile);
      const zIndex = getBiggestZIndex(windows) + 1;
      const eulaWidth = Math.round(window.innerWidth * 0.75);
      const eulaHeight = Math.round(window.innerHeight * 0.75);
      const eulaCoords = {
        x: Math.max(0, Math.round((window.innerWidth - eulaWidth) / 2)),
        y: Math.max(0, Math.round((window.innerHeight - eulaHeight) / 2)),
      };
      const existingWindows = windows.map((window) => ({
        ...window,
        hasFocus: false,
      }));
      return [
        ...existingWindows,
        {
          app,
          canMaximize: isProjectDeadlineWindow
            ? true
            : isEulaWindow
            ? false
            : app.isResizeable ?? true,
          canMinimize: isEulaWindow ? false : true,
          iconId,
          id: uuid(),
          coords: isEulaWindow
            ? eulaCoords
            : {
                x: 50 + Math.round(Math.random() * 200),
                y: 50 + Math.round(Math.random() * 200),
              },
          hasFocus: true,
          isDraggable: app.isDraggable ?? true,
          isMinimized: false,
          isMaximized: false,
          isResizeable: isEulaWindow
            ? false
            : isProjectDeadlineWindow
            ? true
            : app.isResizeable ?? true,
          showCloseButton: isEulaWindow ? false : !isProjectDeadlineWindow,
          showMaximizeButton: isEulaWindow ? false : true,
          size: {
            x: isEulaWindow ? eulaWidth : app.size ? app.size.width : 300,
            y: isEulaWindow ? eulaHeight : app.size ? app.size.height : 300,
          },
          title,
          workingDir,
          workingFile,
          zIndex,
        },
      ];
    });
  };

  const closeWindow = (id: string) => {
    setOpenWindows((windows) => windows.filter((window) => window.id !== id));
  };

  const focusOnWindow = (id: string) => {
    setOpenWindows((windows) => {
      const zIndex = getBiggestZIndex(windows) + 1;
      return windows.map((window) =>
        window.id === id
          ? { ...window, hasFocus: true, zIndex }
          : { ...window, hasFocus: false }
      );
    });
  };

  const maximizeWindow = (id: string) => {
    setOpenWindows((windows) => {
      return windows.map((window) =>
        window.id === id ? { ...window, isMaximized: true } : window
      );
    });
  };

  const minimizeWindow = (id: string) => {
    setOpenWindows((windows) => {
      return windows.map((window) =>
        window.id === id
          ? { ...window, hasFocus: false, isMinimized: true }
          : window
      );
    });
  };

  const moveWindow = (id: string, coords: { x: number; y: number }) => {
    setOpenWindows((windows) => {
      return windows.map((window) => {
        if (window.id !== id || window.isMaximized) return window;
        const maxY =
          globalThis.innerHeight - TASKBAR_DOCK_HEIGHT - MIN_WINDOW_HEIGHT;
        return {
          ...window,
          coords: {
            ...coords,
            y: Math.min(coords.y, maxY),
          },
        };
      });
    });
  };

  const resizeWindow = (id: string, size: { x: number; y: number }) => {
    setOpenWindows((windows) => {
      return windows.map((window) => {
        if (window.id !== id || window.isMaximized) return window;
        const maxAllowedHeight = Math.max(
          MIN_WINDOW_HEIGHT,
          globalThis.innerHeight - TASKBAR_DOCK_HEIGHT - window.coords.y
        );
        const clampedHeight = Math.max(
          MIN_WINDOW_HEIGHT,
          Math.min(size.y, maxAllowedHeight)
        );
        return {
          ...window,
          size: {
            ...size,
            y: clampedHeight,
          },
        };
      });
    });
  };

  const unMaximizeWindow = (id: string) => {
    setOpenWindows((windows) => {
      return windows.map((window) =>
        window.id === id ? { ...window, isMaximized: false } : window
      );
    });
  };

  const unMinimizeWindow = (id: string) => {
    setOpenWindows((windows) => {
      const zIndex = getBiggestZIndex(windows) + 1;
      return windows.map((window) =>
        window.id === id
          ? { ...window, hasFocus: true, isMinimized: false, zIndex }
          : { ...window, hasFocus: false }
      );
    });
  };

  useEffect(() => {
    setOpenWindows((windows) =>
      windows.map((window) => ({
        ...window,
        title: getWindowTitle(
          window.app,
          window.workingDir,
          window.workingFile
        ),
      }))
    );
  }, [flags.language]);

  useEffect(() => {
    return gameEventBus.on('game:rebooted', () => {
      setOpenWindows(createInitialOpenWindows());
    });
  }, []);

  return (
    <OpenWindowsContext.Provider
      value={{
        openApp,
        closeWindow,
        focusOnWindow,
        maximizeWindow,
        minimizeWindow,
        moveWindow,
        resizeWindow,
        unMaximizeWindow,
        unMinimizeWindow,
        windows: openWindows,
      }}
    >
      {children}
    </OpenWindowsContext.Provider>
  );
};

export default OpenWindowsProvider;
