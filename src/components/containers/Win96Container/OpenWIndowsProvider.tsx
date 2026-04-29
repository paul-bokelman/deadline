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
import { getAppIconId } from '../../../utils/win96/AppIconUtils';
import {
  Z_INDEX_TIERS,
  allocateLeaderboardZIndex,
  allocateNormalZIndex,
  allocateVoiceCallZIndex,
  resetZIndexAllocators,
} from '../../../system/zIndex';

interface Props {
  children: ComponentChildren;
}

const TASKBAR_DOCK_HEIGHT = 34;
const MIN_WINDOW_HEIGHT = 150;
const MIN_WINDOW_WIDTH = 200;
const DEFAULT_WINDOW_WIDTH = 360;
const DEFAULT_WINDOW_HEIGHT = 300;
const WINDOW_SCREEN_MARGIN = 12;

const clampWindowSizeToViewport = (size: { x: number; y: number }) => {
  const maxWidth = Math.max(
    MIN_WINDOW_WIDTH,
    globalThis.innerWidth - WINDOW_SCREEN_MARGIN * 2
  );
  const maxHeight = Math.max(
    MIN_WINDOW_HEIGHT,
    globalThis.innerHeight - TASKBAR_DOCK_HEIGHT - WINDOW_SCREEN_MARGIN * 2
  );
  return {
    x: Math.max(MIN_WINDOW_WIDTH, Math.min(size.x, maxWidth)),
    y: Math.max(MIN_WINDOW_HEIGHT, Math.min(size.y, maxHeight)),
  };
};

const getDefaultWindowSize = (app: App): { x: number; y: number } => {
  const requestedSize = app.size
    ? { x: app.size.width, y: app.size.height }
    : { x: DEFAULT_WINDOW_WIDTH, y: DEFAULT_WINDOW_HEIGHT };
  return clampWindowSizeToViewport(requestedSize);
};

const createInitialOpenWindows = (): OpenWindow[] => {
  const timerApp = appList.timer;
  return [
    {
      app: timerApp,
      canMaximize: true,
      canMinimize: true,
      coords: { x: 420, y: 56 },
      hasFocus: true,
      iconId: getAppIconId(timerApp.id),
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
      zIndex: Z_INDEX_TIERS.normalBase,
    },
  ];
};

const OpenWindowsProvider: FunctionComponent<Props> = ({ children }: Props) => {
  const { rebootGame } = useGameState();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>(
    createInitialOpenWindows
  );

  const allocateZIndexForAppId = (appId: string): number => {
    if (appId === 'netVoiceCall') return allocateVoiceCallZIndex();
    if (appId === 'leaderboard') return allocateLeaderboardZIndex();
    return allocateNormalZIndex();
  };

  const getWindowTitle = (
    app: App,
    workingDir?: FileSystemDir,
    workingFile?: FileSystemFile
  ): string => {
    const translatedAppName = translateLiteralForLocale('en', app.name);
    if (workingFile && workingFile.name) {
      return `${workingFile.name} - ${translatedAppName}`;
    }
    if (workingDir) return translateLiteralForLocale('en', workingDir.name);
    return translatedAppName;
  };

  // Window + taskbar icons should match the app's desktop icon when one
  // exists; otherwise fall back to whatever icon the app declares.
  const getWindowIconId = (app: App, workingDir?: FileSystemDir): IconId => {
    if (app.id === 'myComputer') {
      if (workingDir && workingDir.iconId) return workingDir.iconId;
      if (workingDir) return 'folderOpen';
    }
    return getAppIconId(app.id);
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
      const eulaWidth = Math.round(window.innerWidth * 0.8);
      const eulaHeight = Math.round(window.innerHeight * 0.8);
      const eulaCoords = {
        x: Math.max(0, Math.round((window.innerWidth - eulaWidth) / 2)),
        y: Math.max(0, Math.round((window.innerHeight - eulaHeight) / 2)),
      };
      const defaultSize = getDefaultWindowSize(app);
      const zIndex = allocateZIndexForAppId(appId);
      const existingWindows = windows.map((window) => ({
        ...window,
        hasFocus: false,
      }));
      return [
        ...existingWindows,
        {
          app,
          canMaximize: true,
          canMinimize: !isEulaWindow,
          iconId,
          id: uuid(),
          coords: isEulaWindow
            ? eulaCoords
            : {
                x: 50 + Math.round(Math.random() * 200),
                y: 50 + Math.round(Math.random() * 200),
              },
          hasFocus: true,
          isDraggable: isEulaWindow ? false : app.isDraggable ?? true,
          isMinimized: false,
          isMaximized: false,
          isResizeable: isEulaWindow
            ? false
            : isProjectDeadlineWindow
            ? true
            : app.isResizeable ?? true,
          showCloseButton: isEulaWindow ? false : !isProjectDeadlineWindow,
          showMaximizeButton: true,
          size: isEulaWindow
            ? clampWindowSizeToViewport({ x: eulaWidth, y: eulaHeight })
            : defaultSize,
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
      const targetWindow = windows.find((window) => window.id === id);
      if (!targetWindow) return windows;
      const zIndex = allocateZIndexForAppId(targetWindow.app.id);
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
        const maxAllowedWidth = Math.max(
          MIN_WINDOW_WIDTH,
          globalThis.innerWidth - window.coords.x - WINDOW_SCREEN_MARGIN
        );
        const clampedHeight = Math.max(
          MIN_WINDOW_HEIGHT,
          Math.min(size.y, maxAllowedHeight)
        );
        const clampedWidth = Math.max(
          MIN_WINDOW_WIDTH,
          Math.min(size.x, maxAllowedWidth)
        );
        return {
          ...window,
          size: {
            ...size,
            x: clampedWidth,
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
      const targetWindow = windows.find((window) => window.id === id);
      if (!targetWindow) return windows;
      const zIndex = allocateZIndexForAppId(targetWindow.app.id);
      return windows.map((window) =>
        window.id === id
          ? { ...window, hasFocus: true, isMinimized: false, zIndex }
          : { ...window, hasFocus: false }
      );
    });
  };

  useEffect(() => {
    return gameEventBus.on('game:rebooted', () => {
      resetZIndexAllocators();
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
