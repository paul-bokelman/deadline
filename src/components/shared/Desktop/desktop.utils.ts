import {
  CELL_HEIGHT,
  CELL_WIDTH,
  ICON_HITBOX_HEIGHT,
  ICON_HITBOX_WIDTH,
  ICON_PADDING_X,
  ICON_PADDING_Y,
} from './desktop.constants';
import { IconPosition, IconRect } from './desktop.types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const positionKey = (left: number, top: number): string => `${left}:${top}`;

export const iconRectFromPosition = (
  position: IconPosition,
  width = ICON_HITBOX_WIDTH,
  height = ICON_HITBOX_HEIGHT
): IconRect => ({
  left: position.left,
  top: position.top,
  right: position.left + width,
  bottom: position.top + height,
});

export const rectsIntersect = (a: IconRect, b: IconRect): boolean =>
  !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

export const getDesktopMaxBounds = (desktopWidth: number, desktopHeight: number) => ({
  maxLeft: Math.max(ICON_PADDING_X, desktopWidth - CELL_WIDTH),
  maxTop: Math.max(ICON_PADDING_Y, desktopHeight - CELL_HEIGHT),
});
