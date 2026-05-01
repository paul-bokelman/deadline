import { h, FunctionComponent, ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';

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

const TASKBAR_DOCK_HEIGHT = 28;
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

const clampWindowCoordsToViewport = (
  coords: { x: number; y: number },
  size: { x: number; y: number }
) => {
  const minX = 0;
  const minY = 0;
  const maxX = Math.max(minX, globalThis.innerWidth - size.x);
  const maxY = Math.max(
    minY,
    globalThis.innerHeight - TASKBAR_DOCK_HEIGHT - size.y
  );
  return {
    x: Math.max(minX, Math.min(coords.x, maxX)),
    y: Math.max(minY, Math.min(coords.y, maxY)),
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
  const timerSize = clampWindowSizeToViewport({
    x: timerApp.size ? timerApp.size.width : 300,
    y: timerApp.size ? timerApp.size.height : 300,
  });
  return [
    {
      app: timerApp,
      canMaximize: true,
      canMinimize: true,
      coords: clampWindowCoordsToViewport({ x: 420, y: 56 }, timerSize),
      hasFocus: true,
      iconId: getAppIconId(timerApp.id),
      id: crypto.randomUUID(),
      isDraggable: timerApp.isDraggable ?? true,
      isMaximized: false,
      isMinimized: false,
      isResizeable: timerApp.isResizeable ?? true,
      showCloseButton: false,
      showMaximizeButton: true,
      size: timerSize,
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
    const translatedAppName = app.name;
    if (workingFile && workingFile.name) {
      return `${workingFile.name} - ${translatedAppName}`;
    }
    if (workingDir) return workingDir.name;
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
      for (let i = 0; i < 3; i += 1) {
        gameEventBus.emit('popup:test_spawn_random', {
          x: 80 + Math.round(Math.random() * 280),
          y: 60 + Math.round(Math.random() * 180),
        });
      }
      return;
    }

    if (appId === 'myComputer' && workingDir?.name === 'DoNotOpen') {
      rebootGame();
      return;
    }
    const isProjectDeadlineWindow = appId === 'timer';
    const isEulaWindow = appId === 'eula';
    const isNetVoiceCallWindow = appId === 'netVoiceCall';

    setOpenWindows((windows) => {
      const app = appList[appId];
      const iconId = getWindowIconId(app, workingDir);
      const title = getWindowTitle(app, workingDir, workingFile);
      const eulaWidth = Math.round(window.innerWidth * 0.8);
      const eulaHeight = Math.round(window.innerHeight * 0.8);
      const eulaSize = clampWindowSizeToViewport({ x: eulaWidth, y: eulaHeight });
      const defaultSize = getDefaultWindowSize(app);
      const eulaCoords = {
        x: Math.round((window.innerWidth - eulaSize.x) / 2),
        y: Math.round((window.innerHeight - TASKBAR_DOCK_HEIGHT - eulaSize.y) / 2),
      };
      const randomCoords = clampWindowCoordsToViewport(
        {
          x: 50 + Math.round(Math.random() * 200),
          y: 50 + Math.round(Math.random() * 200),
        },
        defaultSize
      );
      const zIndex = allocateZIndexForAppId(appId);
      const existingWindows = windows.map((window) => ({
        ...window,
        hasFocus: false,
      }));
      return [
        ...existingWindows,
        {
          app,
          canMaximize: !isNetVoiceCallWindow,
          canMinimize: !isEulaWindow,
          iconId,
          id: crypto.randomUUID(),
          coords: isEulaWindow
            ? clampWindowCoordsToViewport(eulaCoords, eulaSize)
            : randomCoords,
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
          showMaximizeButton: !isNetVoiceCallWindow,
          size: isEulaWindow
            ? eulaSize
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
        return {
          ...window,
          coords,
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
