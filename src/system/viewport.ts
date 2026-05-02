export interface AppViewportSize {
  height: number;
  width: number;
}

export const getAppViewportSize = (): AppViewportSize => {
  const fullscreenElement = document.fullscreenElement as HTMLElement | null;
  if (fullscreenElement) {
    const rect = fullscreenElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }
  }

  const visualViewport = window.visualViewport;
  return {
    width: Math.round(visualViewport?.width ?? window.innerWidth),
    height: Math.round(visualViewport?.height ?? window.innerHeight),
  };
};

export const getDesktopViewportSize = (): AppViewportSize => {
  const viewport = getAppViewportSize();
  const taskbarHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--taskbar-height'
    )
  );
  return {
    width: viewport.width,
    height: Math.max(
      1,
      viewport.height - (Number.isFinite(taskbarHeight) ? taskbarHeight : 28)
    ),
  };
};
