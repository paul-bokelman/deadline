export interface IconPosition {
  left: number;
  top: number;
}

export interface DragState {
  primaryFileId: string;
  draggedFileIds: string[];
  startPositions: Record<string, IconPosition>;
  deltaX: number;
  deltaY: number;
  pointerStartX: number;
  pointerStartY: number;
  pointerId: number;
  hasMoved: boolean;
}

export interface SelectionBoxState {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  isActive: boolean;
}

export interface IconRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
