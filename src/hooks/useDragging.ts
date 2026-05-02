import { useEffect, useRef, useState } from 'preact/hooks';

import {
  Coords,
  hasTouchChanged,
  getMouseCoordsFromEvent,
  getTouchCoordsFromEvent,
  getFirstTouchIdFromEvent,
} from '../utils/DomUtils';
import { debounceWithRequestAnimationFrame } from '../utils/FunctionUtils';
import { getBounds, getBoundedOffset } from '../utils/BoundingUtils';

export interface Options {
  getBoundingElt?: () => HTMLElement | null;
  getDraggedElt?: () => HTMLElement | null;
  initialCoords?: Coords;
  isEnabled?: boolean;
  minCoordsValue?: Coords | null;
  onDragStart?: () => void;
  onDragStop?: (coords: Coords) => void;
}

const useDragging = (
  getHandleElt: () => HTMLElement | null,
  {
    getBoundingElt,
    getDraggedElt,
    initialCoords = { x: 0, y: 0 },
    isEnabled = true,
    minCoordsValue = null,
    onDragStart,
    onDragStop,
  }: Options
): Coords => {
  const originalElementCoords = useRef<Coords>({ x: 0, y: 0 });
  const originalMouseCoords = useRef<Coords>({ x: 0, y: 0 });
  const touchId = useRef<number | null>(null);
  const handleEltRef = useRef<HTMLElement | null>();
  const draggedEltRef = useRef<HTMLElement | null>();
  const boundingEltRef = useRef<HTMLElement | null>();

  const [coords, setCoords] = useState<Coords>(initialCoords);

  const getRenderedTranslateCoords = (): Coords | null => {
    const draggedElement = draggedEltRef.current;
    if (!draggedElement) return null;
    const transform = getComputedStyle(draggedElement).transform;
    if (!transform || transform === 'none') return null;
    const matrix3dMatch = transform.match(/^matrix3d\(([^)]+)\)$/);
    if (matrix3dMatch) {
      const parts = matrix3dMatch[1]
        .split(',')
        .map((part) => Number(part.trim()));
      if (parts.length < 16) return null;
      const x = parts[12];
      const y = parts[13];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    }

    const match = transform.match(/^matrix\(([^)]+)\)$/);
    if (!match) return null;
    const parts = match[1].split(',').map((part) => Number(part.trim()));
    if (parts.length < 6) return null;
    const [x, y] = parts.slice(4, 6);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  };

  useEffect(() => {
    setCoords(initialCoords);
    // Intentionally re-syncs only when the *initial* coords change (resets).
    // Including the full object would re-fire on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCoords.x, initialCoords.y]);

  useEffect(() => {
    if (!isEnabled) return;
    handleEltRef.current = getHandleElt();
    draggedEltRef.current = getDraggedElt
      ? getDraggedElt()
      : handleEltRef.current ?? null;
    boundingEltRef.current = getBoundingElt ? getBoundingElt() : null;
  });

  useEffect((): (() => void) => {
    addPointerStartEventListeners();
    return () => {
      if (!isEnabled) return;
      removePointerStartEventListeners();
      removePointerMoveEventListeners();
      removePointerStopEventListeners();
    };
    // Mount-only: handler functions are stable closures over refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPointerStartEventListeners = (): void => {
    if (!handleEltRef.current) return;
    handleEltRef.current.addEventListener('mousedown', handleOnMouseDown, {
      passive: false,
    });
    handleEltRef.current.addEventListener('touchstart', handleOnTouchStart, {
      passive: false,
    });
  };

  const addPointerMoveEventListeners = (): void => {
    document.addEventListener('mousemove', handleOnMouseMove, {
      passive: false,
    });
    document.addEventListener('touchmove', handleOnTouchMove, {
      passive: false,
    });
    document.addEventListener('mouseup', handleOnEnd, {
      passive: false,
    });
  };

  const addPointerStopEventListeners = (): void => {
    document.addEventListener('touchend', handleOnEnd, {
      passive: false,
    });
    document.addEventListener('touchcancel', handleOnEnd, {
      passive: false,
    });
  };

  const removePointerStartEventListeners = (): void => {
    if (!handleEltRef.current) return;
    handleEltRef.current.removeEventListener('mousedown', handleOnMouseDown);
    handleEltRef.current.removeEventListener('touchstart', handleOnTouchStart);
  };

  const removePointerMoveEventListeners = (): void => {
    document.removeEventListener('mousemove', handleOnMouseMove);
    document.removeEventListener('touchmove', handleOnTouchMove);
  };

  const removePointerStopEventListeners = (): void => {
    document.removeEventListener('mouseup', handleOnEnd);
    document.removeEventListener('touchend', handleOnEnd);
    document.removeEventListener('touchcancel', handleOnEnd);
  };

  const applyDragging = debounceWithRequestAnimationFrame(
    (mouseCoords: Coords) => {
      if (!handleEltRef.current) return;
      if (!draggedEltRef.current) return;
      const mouseOffsetX = mouseCoords.x - originalMouseCoords.current.x;
      const mouseOffsetY = mouseCoords.y - originalMouseCoords.current.y;
      const nextX = originalElementCoords.current.x + mouseOffsetX;
      const nextY = originalElementCoords.current.y + mouseOffsetY;

      const bounds = getBounds(
        draggedEltRef.current,
        boundingEltRef.current,
        minCoordsValue
      );
      const newCoords = getBoundedOffset({ x: nextX, y: nextY }, bounds);

      setCoords(() => newCoords);
    }
  );

  const handleOnTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    touchId.current = getFirstTouchIdFromEvent(e);
    if (touchId.current === null) return;

    const coords = getTouchCoordsFromEvent(e, touchId.current);
    if (coords) handleStart(coords);
  };

  const handleOnMouseDown = (e: MouseEvent): void => {
    e.preventDefault();
    const mouseCoords = getMouseCoordsFromEvent(e);
    handleStart(mouseCoords);
  };

  const handleStart = (mouseCoords: Coords): void => {
    removePointerStartEventListeners();
    addPointerMoveEventListeners();
    addPointerStopEventListeners();

    setCoords((elementCoords) => {
      originalElementCoords.current =
        getRenderedTranslateCoords() ?? elementCoords;
      originalMouseCoords.current = mouseCoords;
      return elementCoords;
    });

    if (onDragStart) onDragStart();
  };

  const handleOnMouseMove = (e: MouseEvent): void => {
    e.preventDefault();
    const mouseCoords = getMouseCoordsFromEvent(e);
    applyDragging(mouseCoords);
  };

  const handleOnTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (touchId.current === null || !hasTouchChanged(e, touchId.current))
      return;

    const touchCoords = getTouchCoordsFromEvent(e, touchId.current);
    if (touchCoords) applyDragging(touchCoords);
  };

  const handleOnEnd = (e: MouseEvent | TouchEvent): void => {
    e.preventDefault();

    removePointerMoveEventListeners();
    removePointerStopEventListeners();
    addPointerStartEventListeners();

    setCoords((currentCoords) => {
      if (onDragStop) onDragStop(currentCoords);
      return currentCoords;
    });
  };

  return coords;
};

export default useDragging;
