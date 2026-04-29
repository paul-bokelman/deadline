import { appList } from '../../data/appList';
import { myComputerFs } from '../../data/fileSystem';
import { AppId } from '../../types/App';
import { FileSystemDir } from '../../types/FileSystem';
import { IconId } from '../../types/Icon';
import { getDirFromPath } from './FileSystemUtils';

const DESKTOP_PATH = 'C:/Windows/Desktop';

const dynamicDesktopAppIcons: Partial<Record<AppId, IconId>> = {};

/**
 * Register an icon override for an app that lives on the dynamic desktop
 * (i.e. desktop items not defined in the static filesystem).
 *
 * Once registered, windows opened for this app and its taskbar entry will
 * automatically use the same icon as its desktop shortcut.
 */
export const registerDynamicDesktopAppIcon = (
  appId: AppId,
  iconId: IconId
): void => {
  dynamicDesktopAppIcons[appId] = iconId;
};

const findStaticDesktopAppIcon = (appId: AppId): IconId | undefined => {
  const desktopDir: FileSystemDir | undefined = (() => {
    try {
      return getDirFromPath(DESKTOP_PATH, myComputerFs);
    } catch {
      return undefined;
    }
  })();
  if (!desktopDir) return undefined;
  for (const child of Object.values(desktopDir.dir)) {
    if (child.type === 'app' && child.appId === appId && child.iconId) {
      return child.iconId;
    }
  }
  return undefined;
};

/**
 * Returns the canonical icon for an app.
 *
 * Resolution order:
 *  1. An icon defined on the app's static-desktop shortcut (if any).
 *  2. An icon registered for the app's dynamic-desktop entry (if any).
 *  3. The app's default icon from `appList`.
 *
 * Use this in any place that renders a window-, taskbar-, or shell-icon
 * for an app so the desktop / window / taskbar icons always match.
 */
export const getAppIconId = (appId: AppId): IconId => {
  const staticIcon = findStaticDesktopAppIcon(appId);
  if (staticIcon) return staticIcon;
  const dynamicIcon = dynamicDesktopAppIcons[appId];
  if (dynamicIcon) return dynamicIcon;
  return appList[appId].iconId;
};
