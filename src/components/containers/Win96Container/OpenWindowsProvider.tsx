import { h, FunctionComponent, ComponentChildren } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { App } from '@/types/App';
import { IconId } from '@/types/Icon';
import { FileSystemDir, FileSystemFile } from '@/types/FileSystem';
import { appList } from '@/data/appList';
import OpenWindowsContext, {
  OpenWindow,
  OpenWindowsContextType,
} from '@/context/OpenWindowsContext';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { getAppIconId } from '@/utils/win96/AppIconUtils';
import {
  Z_INDEX_TIERS,
  allocateLeaderboardZIndex,
  allocateNormalZIndex,
  allocateVoiceCallZIndex,
  resetZIndexAllocators,
} from '@/system/zIndex';
import { getAppViewportSize, getDesktopViewportSize } from '@/system/viewport';

interface Props {
  children: ComponentChildren;
}

const TASKBAR_DOCK_HEIGHT = 28;
const MIN_WINDOW_HEIGHT = 150;
const MIN_WINDOW_WIDTH = 200;
const DEFAULT_WINDOW_WIDTH = 360;
const DEFAULT_WINDOW_HEIGHT = 300;
const WINDOW_SCREEN_MARGIN = 12;
const STARTUP_WINDOW_GAP_PX = 12;

const clampWindowSizeToViewport = (size: { x: number; y: number }) => {
  const viewport = getAppViewportSize();
  const maxWidth = Math.max(
    MIN_WINDOW_WIDTH,
    viewport.width - WINDOW_SCREEN_MARGIN * 2
  );
  const maxHeight = Math.max(
    MIN_WINDOW_HEIGHT,
    viewport.height - TASKBAR_DOCK_HEIGHT - WINDOW_SCREEN_MARGIN * 2
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
  const desktopViewport = getDesktopViewportSize();
  const minX = 0;
  const minY = 0;
  const maxX = Math.max(minX, desktopViewport.width - size.x);
  const maxY = Math.max(minY, desktopViewport.height - size.y);
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

let hasShownInitialLeaderboard = false;

const createInitialOpenWindows = (): OpenWindow[] => {
  const timerApp = appList.timer;
  const leaderboardApp = appList.leaderboard;
  const timerSize = clampWindowSizeToViewport({
    x: timerApp.size ? timerApp.size.width : 300,
    y: timerApp.size ? timerApp.size.height : 300,
  });
  const leaderboardSize = clampWindowSizeToViewport({
    x: leaderboardApp.size ? leaderboardApp.size.width : 300,
    y: leaderboardApp.size ? leaderboardApp.size.height : 300,
  });
  const defaultTimerCoords = clampWindowCoordsToViewport(
    { x: 420, y: 56 },
    timerSize
  );

  const timerWindow: OpenWindow = {
    app: timerApp,
    canMaximize: true,
    canMinimize: true,
    coords: defaultTimerCoords,
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
    sizeMode: timerApp.sizeMode,
    title: timerApp.name,
    zIndex: Z_INDEX_TIERS.normalBase,
  };

  if (hasShownInitialLeaderboard) return [timerWindow];

  hasShownInitialLeaderboard = true;
  const leaderboardWindow: OpenWindow = {
    app: leaderboardApp,
    canMaximize: true,
    canMinimize: true,
    coords: clampWindowCoordsToViewport(
      {
        x: Math.round((getDesktopViewportSize().width - leaderboardSize.x) / 2),
        y: Math.round(
          (getDesktopViewportSize().height - leaderboardSize.y) / 2
        ),
      },
      leaderboardSize
    ),
    hasFocus: false,
    iconId: getAppIconId(leaderboardApp.id),
    id: crypto.randomUUID(),
    isDraggable: leaderboardApp.isDraggable ?? true,
    isMaximized: false,
    isMinimized: false,
    isResizeable: leaderboardApp.isResizeable ?? true,
    showCloseButton: true,
    showMaximizeButton: true,
    size: leaderboardSize,
    sizeMode: leaderboardApp.sizeMode,
    title: leaderboardApp.name,
    zIndex: allocateLeaderboardZIndex(),
  };

  const timerToRightCoords = clampWindowCoordsToViewport(
    {
      x:
        leaderboardWindow.coords.x +
        leaderboardWindow.size.x +
        STARTUP_WINDOW_GAP_PX,
      y: leaderboardWindow.coords.y,
    },
    timerSize
  );
  timerWindow.coords = timerToRightCoords;

  return [leaderboardWindow, timerWindow];
};

const OpenWindowsProvider: FunctionComponent<Props> = ({ children }: Props) => {
  const { rebootGame } = useGameState();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>(
    createInitialOpenWindows
  );

  const allocateZIndexForAppId = useCallback((appId: string): number => {
    if (appId === 'netVoiceCall') return allocateVoiceCallZIndex();
    if (appId === 'leaderboard') return allocateLeaderboardZIndex();
    return allocateNormalZIndex();
  }, []);

  const getWindowTitle = useCallback(
    (
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
    },
    []
  );

  // Window + taskbar icons should match the app's desktop icon when one
  // exists; otherwise fall back to whatever icon the app declares.
  const getWindowIconId = useCallback((app: App, workingDir?: FileSystemDir):
    | IconId
    | undefined => {
    if (app.id === 'zipArchive') {
      return undefined;
    }
    if (app.id === 'explorer') {
      if (workingDir && workingDir.iconId) return workingDir.iconId;
      if (workingDir) return 'folderOpen';
    }
    return getAppIconId(app.id);
  }, []);

  const openApp: OpenWindowsContextType['openApp'] = useCallback(
    ({ appId, workingDir, workingFile }) => {
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

      if (appId === 'explorer' && workingDir?.name === 'DoNotOpen') {
        rebootGame();
        return;
      }
      const isProjectDeadlineWindow = appId === 'timer';
      const isEulaWindow = appId === 'eula';
      const isNetVoiceCallWindow = appId === 'netVoiceCall';
      const isOpenWithWindow = appId === 'zipArchive';
      const isWinRarArchiveWindow = appId === 'winRarArchive';
      const isCloseOnlyWindow = isOpenWithWindow || isWinRarArchiveWindow;

      setOpenWindows((windows) => {
        const app = appList[appId];
        const iconId = getWindowIconId(app, workingDir);
        const title = getWindowTitle(app, workingDir, workingFile);
        const appViewport = getAppViewportSize();
        const desktopViewport = getDesktopViewportSize();
        const eulaWidth = Math.round(appViewport.width * 0.8);
        const eulaHeight = Math.round(appViewport.height * 0.8);
        const eulaSize = clampWindowSizeToViewport({
          x: eulaWidth,
          y: eulaHeight,
        });
        const defaultSize = getDefaultWindowSize(app);
        const eulaCoords = {
          x: Math.round((desktopViewport.width - eulaSize.x) / 2),
          y: Math.round((desktopViewport.height - eulaSize.y) / 2),
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
            canMaximize: !isNetVoiceCallWindow && !isCloseOnlyWindow,
            canMinimize: !isEulaWindow && !isCloseOnlyWindow,
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
            showMaximizeButton: !isNetVoiceCallWindow && !isCloseOnlyWindow,
            showInTaskbar: !isOpenWithWindow,
            size: isEulaWindow ? eulaSize : defaultSize,
            sizeMode: app.sizeMode,
            title,
            workingDir,
            workingFile,
            zIndex,
          },
        ];
      });
    },
    [allocateZIndexForAppId, getWindowIconId, getWindowTitle, rebootGame]
  );

  const closeWindow = useCallback((id: string) => {
    setOpenWindows((windows) => windows.filter((window) => window.id !== id));
  }, []);

  const focusOnWindow = useCallback(
    (id: string) => {
      setOpenWindows((windows) => {
        const targetWindow = windows.find((window) => window.id === id);
        if (!targetWindow) return windows;
        const hasOnlyTargetFocused = windows.every((window) =>
          window.id === id ? window.hasFocus : !window.hasFocus
        );
        if (hasOnlyTargetFocused) return windows;
        const zIndex = allocateZIndexForAppId(targetWindow.app.id);
        return windows.map((window) =>
          window.id === id
            ? window.hasFocus && window.zIndex === zIndex
              ? window
              : { ...window, hasFocus: true, zIndex }
            : window.hasFocus
            ? { ...window, hasFocus: false }
            : window
        );
      });
    },
    [allocateZIndexForAppId]
  );

  const maximizeWindow = useCallback((id: string) => {
    setOpenWindows((windows) => {
      return windows.map((window) =>
        window.id === id ? { ...window, isMaximized: true } : window
      );
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setOpenWindows((windows) => {
      return windows.map((window) =>
        window.id === id
          ? { ...window, hasFocus: false, isMinimized: true }
          : window
      );
    });
  }, []);

  const moveWindow = useCallback(
    (id: string, coords: { x: number; y: number }) => {
      setOpenWindows((windows) => {
        return windows.map((window) => {
          if (window.id !== id || window.isMaximized) return window;
          return {
            ...window,
            coords,
          };
        });
      });
    },
    []
  );

  const resizeWindow = useCallback(
    (id: string, size: { x: number; y: number }) => {
      setOpenWindows((windows) => {
        return windows.map((window) => {
          if (window.id !== id || window.isMaximized) return window;
          const maxAllowedHeight = Math.max(
            MIN_WINDOW_HEIGHT,
            getDesktopViewportSize().height - window.coords.y
          );
          const maxAllowedWidth = Math.max(
            MIN_WINDOW_WIDTH,
            getDesktopViewportSize().width -
              window.coords.x -
              WINDOW_SCREEN_MARGIN
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
    },
    []
  );

  const autoFitWindow = useCallback(
    (id: string, size: { x: number; y: number }) => {
      setOpenWindows((windows) => {
        return windows.map((window) => {
          if (window.id !== id || window.isMaximized) return window;
          const nextSize = clampWindowSizeToViewport(size);
          return {
            ...window,
            coords: clampWindowCoordsToViewport(window.coords, nextSize),
            size: nextSize,
          };
        });
      });
    },
    []
  );

  const unMaximizeWindow = useCallback((id: string) => {
    setOpenWindows((windows) => {
      return windows.map((window) =>
        window.id === id ? { ...window, isMaximized: false } : window
      );
    });
  }, []);

  const unMinimizeWindow = useCallback(
    (id: string) => {
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
    },
    [allocateZIndexForAppId]
  );

  useEffect(() => {
    return gameEventBus.on('game:rebooted', () => {
      resetZIndexAllocators();
      setOpenWindows(createInitialOpenWindows());
    });
  }, []);

  useEffect(() => {
    const clampOpenWindows = () => {
      setOpenWindows((windows) => {
        let hasChanges = false;
        const nextWindows = windows.map((window) => {
          const nextSize = clampWindowSizeToViewport(window.size);
          const nextCoords = clampWindowCoordsToViewport(
            window.coords,
            nextSize
          );
          const didChange =
            nextSize.x !== window.size.x ||
            nextSize.y !== window.size.y ||
            nextCoords.x !== window.coords.x ||
            nextCoords.y !== window.coords.y;
          if (!didChange) return window;
          hasChanges = true;
          return {
            ...window,
            coords: nextCoords,
            size: nextSize,
          };
        });
        return hasChanges ? nextWindows : windows;
      });
    };

    window.addEventListener('resize', clampOpenWindows, { passive: true });
    window.visualViewport?.addEventListener('resize', clampOpenWindows, {
      passive: true,
    });
    document.addEventListener('fullscreenchange', clampOpenWindows, {
      passive: true,
    });
    return () => {
      window.removeEventListener('resize', clampOpenWindows);
      window.visualViewport?.removeEventListener('resize', clampOpenWindows);
      document.removeEventListener('fullscreenchange', clampOpenWindows);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      openApp,
      closeWindow,
      autoFitWindow,
      focusOnWindow,
      maximizeWindow,
      minimizeWindow,
      moveWindow,
      resizeWindow,
      unMaximizeWindow,
      unMinimizeWindow,
      windows: openWindows,
    }),
    [
      autoFitWindow,
      closeWindow,
      focusOnWindow,
      maximizeWindow,
      minimizeWindow,
      moveWindow,
      openApp,
      openWindows,
      resizeWindow,
      unMaximizeWindow,
      unMinimizeWindow,
    ]
  );

  return (
    <OpenWindowsContext.Provider value={contextValue}>
      {children}
    </OpenWindowsContext.Provider>
  );
};

export default OpenWindowsProvider;
