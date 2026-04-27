import { FunctionComponent, h, JSX } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import { OpenWindowsContextType } from '../../../context/OpenWindowsContext';
import { myComputerFs } from '../../../data/fileSystem';
import fileTypeList from '../../../data/fileTypeList';
import { gameEventBus } from '../../../game/events';
import { useGameState } from '../../../game/state';
import useShellFilesState from '../../../hooks/useShellFilesState';
import { getDynamicDesktopItems } from '../../../system/desktop/dynamicDesktopItems';
import { scrambleDesktop } from '../../../system/desktop/scrambleDesktop';
import ScreenshotWallpaper from '../../../system/wallpaper/ScreenshotWallpaper';
import { ShellItem } from '../../../types/Shell';
import { getDirFromPath } from '../../../utils/win96/FileSystemUtils';
import Icon from '../Icon/Icon';

import fileGridStyle from '../FileGrid/FileGrid.module.css';
import style from './Desktop.module.css';

const CELL_WIDTH = 80;
const CELL_HEIGHT = 80;
const ICON_PADDING_X = 4;
const ICON_PADDING_Y = 4;
const DRAG_THRESHOLD_PX = 4;
const FALLBACK_MAX_ROWS = 8;

interface IconPosition {
  col: number;
  row: number;
}

interface DragState {
  fileId: string;
  pointerStartX: number;
  pointerStartY: number;
  iconStartLeft: number;
  iconStartTop: number;
  ghostLeft: number;
  ghostTop: number;
  pointerId: number;
  hasMoved: boolean;
}

type Props = {
  background?: string;
  openApp: OpenWindowsContextType['openApp'];
};

const truncateMiddle = (value: string, maxChars = 22): string => {
  if (value.length <= maxChars) return value;
  const leftChars = Math.ceil((maxChars - 1) / 2);
  const rightChars = Math.floor((maxChars - 1) / 2);
  return `${value.slice(0, leftChars)}…${value.slice(
    value.length - rightChars
  )}`;
};

const cellKey = (col: number, row: number): string => `${col},${row}`;

const findFreeCell = (
  occupied: Set<string>,
  maxRows: number,
  preferred?: IconPosition
): IconPosition => {
  if (preferred && !occupied.has(cellKey(preferred.col, preferred.row))) {
    return preferred;
  }

  if (preferred) {
    for (let dist = 1; dist < 200; dist += 1) {
      for (let dc = -dist; dc <= dist; dc += 1) {
        for (let dr = -dist; dr <= dist; dr += 1) {
          if (Math.abs(dc) !== dist && Math.abs(dr) !== dist) continue;
          const c = preferred.col + dc;
          const r = preferred.row + dr;
          if (c < 0 || r < 0) continue;
          if (!occupied.has(cellKey(c, r))) return { col: c, row: r };
        }
      }
    }
  }

  let col = 0;
  let row = 0;
  while (occupied.has(cellKey(col, row))) {
    row += 1;
    if (row >= maxRows) {
      row = 0;
      col += 1;
    }
  }
  return { col, row };
};

const Desktop: FunctionComponent<Props> = ({
  background = '',
  openApp,
}: Props) => {
  const { flags } = useGameState();
  const { files, focusOnFile, removeFocus } = useShellFilesState(
    getDirFromPath('C:/Windows/Desktop', myComputerFs),
    false
  );
  const desktopItems = useMemo<ShellItem[]>(() => {
    const mergedItems = [...files, ...getDynamicDesktopItems(flags)];
    if (flags.hasDesktopScrambled) {
      return scrambleDesktop(mergedItems);
    }
    return mergedItems;
  }, [files, flags]);

  const desktopRef = useRef<HTMLDivElement>(null);
  const [iconPositions, setIconPositions] = useState<
    Record<string, IconPosition>
  >({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef<number | null>(null);
  const pendingPointerEventRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [maxRows, setMaxRows] = useState<number>(FALLBACK_MAX_ROWS);

  useLayoutEffect(() => {
    const element = desktopRef.current;
    if (!element) return undefined;

    const updateMaxRows = (): void => {
      const rect = element.getBoundingClientRect();
      const rows = Math.max(
        1,
        Math.floor((rect.height - ICON_PADDING_Y) / CELL_HEIGHT)
      );
      setMaxRows(rows);
    };

    updateMaxRows();

    const observer = new ResizeObserver(updateMaxRows);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Auto-assign positions to new items, prune stale entries, and reflow
  // anything that lands outside the desktop after a resize. Bails out
  // when the result is shape-identical to avoid spurious re-renders.
  useEffect(() => {
    setIconPositions((current) => {
      const next: Record<string, IconPosition> = {};
      const occupied = new Set<string>();

      desktopItems.forEach((item) => {
        const existing = current[item.id];
        if (
          existing &&
          existing.row < maxRows &&
          !occupied.has(cellKey(existing.col, existing.row))
        ) {
          next[item.id] = existing;
          occupied.add(cellKey(existing.col, existing.row));
        }
      });

      desktopItems.forEach((item) => {
        if (next[item.id]) return;
        const cell = findFreeCell(occupied, maxRows);
        next[item.id] = cell;
        occupied.add(cellKey(cell.col, cell.row));
      });

      const currentIds = Object.keys(current);
      const nextIds = Object.keys(next);
      if (currentIds.length === nextIds.length) {
        const allMatch = nextIds.every((id) => {
          const a = current[id];
          const b = next[id];
          return !!a && !!b && a.col === b.col && a.row === b.row;
        });
        if (allMatch) return current;
      }

      return next;
    });
  }, [desktopItems, maxRows]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (suppressClickTimeoutRef.current !== null) {
        window.clearTimeout(suppressClickTimeoutRef.current);
      }
    };
  }, []);

  const cellToPixel = useCallback(
    (cell: IconPosition): { left: number; top: number } => ({
      left: ICON_PADDING_X + cell.col * CELL_WIDTH,
      top: ICON_PADDING_Y + cell.row * CELL_HEIGHT,
    }),
    []
  );

  const pixelToCell = useCallback(
    (pixelLeft: number, pixelTop: number): IconPosition => {
      const rawCol = (pixelLeft - ICON_PADDING_X) / CELL_WIDTH;
      const rawRow = (pixelTop - ICON_PADDING_Y) / CELL_HEIGHT;
      return {
        col: Math.max(0, Math.round(rawCol)),
        row: Math.max(0, Math.round(rawRow)),
      };
    },
    []
  );

  const endDrag = useCallback((): void => {
    dragRef.current = null;
    pendingPointerEventRef.current = null;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setDrag(null);
  }, []);

  const armSuppressClick = useCallback((): void => {
    suppressClickRef.current = true;
    if (suppressClickTimeoutRef.current !== null) {
      window.clearTimeout(suppressClickTimeoutRef.current);
    }
    // Self-clear in case no click event ever follows the pointerup
    // (e.g. capture released over a different element).
    suppressClickTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimeoutRef.current = null;
    }, 250);
  }, []);

  const flushPointerMove = useCallback((): void => {
    rafIdRef.current = null;
    const pending = pendingPointerEventRef.current;
    pendingPointerEventRef.current = null;
    const current = dragRef.current;
    const desktopElement = desktopRef.current;
    if (!pending || !current || !desktopElement) return;

    const desktopRect = desktopElement.getBoundingClientRect();
    const pointerX = pending.x - desktopRect.left;
    const pointerY = pending.y - desktopRect.top;
    const dx = pointerX - current.pointerStartX;
    const dy = pointerY - current.pointerStartY;

    const hasMoved =
      current.hasMoved ||
      Math.abs(dx) > DRAG_THRESHOLD_PX ||
      Math.abs(dy) > DRAG_THRESHOLD_PX;
    if (!hasMoved) return;

    const updated: DragState = {
      ...current,
      hasMoved: true,
      ghostLeft: current.iconStartLeft + dx,
      ghostTop: current.iconStartTop + dy,
    };
    dragRef.current = updated;
    setDrag(updated);
  }, []);

  const previewDropCell = useMemo<IconPosition | null>(() => {
    if (!drag || !drag.hasMoved) return null;
    return pixelToCell(drag.ghostLeft, drag.ghostTop);
  }, [drag, pixelToCell]);

  const handlePointerDown = useCallback(
    (event: PointerEvent, file: ShellItem): void => {
      if (event.button !== 0) return;
      const desktopElement = desktopRef.current;
      if (!desktopElement) return;

      const desktopRect = desktopElement.getBoundingClientRect();
      const position = iconPositions[file.id];
      if (!position) return;

      const { left, top } = {
        left: ICON_PADDING_X + position.col * CELL_WIDTH,
        top: ICON_PADDING_Y + position.row * CELL_HEIGHT,
      };

      const startState: DragState = {
        fileId: file.id,
        pointerStartX: event.clientX - desktopRect.left,
        pointerStartY: event.clientY - desktopRect.top,
        iconStartLeft: left,
        iconStartTop: top,
        ghostLeft: left,
        ghostTop: top,
        pointerId: event.pointerId,
        hasMoved: false,
      };

      dragRef.current = startState;
      setDrag(startState);

      try {
        (event.currentTarget as HTMLElement).setPointerCapture?.(
          event.pointerId
        );
      } catch {
        // setPointerCapture can throw if the pointer is no longer active.
      }
    },
    [iconPositions]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent): void => {
      const current = dragRef.current;
      if (!current) return;
      if (event.pointerId !== current.pointerId) return;

      pendingPointerEventRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushPointerMove);
      }
    },
    [flushPointerMove]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent): void => {
      const current = dragRef.current;
      if (!current) return;
      if (event.pointerId !== current.pointerId) return;

      // Apply any pending move synchronously so the drop uses the latest pos.
      if (pendingPointerEventRef.current && rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
        flushPointerMove();
      }

      const finalState = dragRef.current;
      if (!finalState || !finalState.hasMoved) {
        endDrag();
        return;
      }

      armSuppressClick();

      const targetCell = pixelToCell(finalState.ghostLeft, finalState.ghostTop);
      setIconPositions((currentPositions) => {
        const occupied = new Set<string>();
        Object.entries(currentPositions).forEach(([id, pos]) => {
          if (id === finalState.fileId) return;
          occupied.add(cellKey(pos.col, pos.row));
        });

        const placement = findFreeCell(occupied, maxRows, targetCell);
        const existing = currentPositions[finalState.fileId];
        if (
          existing &&
          existing.col === placement.col &&
          existing.row === placement.row
        ) {
          return currentPositions;
        }
        return { ...currentPositions, [finalState.fileId]: placement };
      });
      endDrag();
    },
    [armSuppressClick, endDrag, flushPointerMove, maxRows, pixelToCell]
  );

  const handlePointerCancel = useCallback(
    (event: PointerEvent): void => {
      const current = dragRef.current;
      if (!current) return;
      if (event.pointerId !== current.pointerId) return;
      // If a drag actually occurred, suppress the upcoming click; otherwise
      // let click pass through normally.
      if (current.hasMoved) armSuppressClick();
      endDrag();
    },
    [armSuppressClick, endDrag]
  );

  const handleDesktopClick = useCallback(
    (event: MouseEvent): void => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        if (suppressClickTimeoutRef.current !== null) {
          window.clearTimeout(suppressClickTimeoutRef.current);
          suppressClickTimeoutRef.current = null;
        }
        return;
      }
      const target = event.target as HTMLElement | null;
      const currentTarget = event.currentTarget as HTMLElement | null;
      if (!target || !currentTarget) return;
      if (target !== currentTarget && !currentTarget.contains(target)) return;
      // iconLayer has pointer-events: none, so a click on empty desktop space
      // bubbles here directly. Anything that originated on an icon stops
      // propagation in handleClickFile.
      removeFocus();
    },
    [removeFocus]
  );

  const handleClickFile = useCallback(
    (event: MouseEvent, file: ShellItem): void => {
      event.preventDefault();
      event.stopPropagation();
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        if (suppressClickTimeoutRef.current !== null) {
          window.clearTimeout(suppressClickTimeoutRef.current);
          suppressClickTimeoutRef.current = null;
        }
        return;
      }
      focusOnFile(file.id);
    },
    [focusOnFile]
  );

  const handleDblClickFile = useCallback(
    (event: MouseEvent, file: ShellItem): void => {
      event.preventDefault();
      event.stopPropagation();
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        if (suppressClickTimeoutRef.current !== null) {
          window.clearTimeout(suppressClickTimeoutRef.current);
          suppressClickTimeoutRef.current = null;
        }
        return;
      }

      if (file.type === 'app') openApp({ appId: file.appId });
      if (file.type === 'dir') {
        openApp({ appId: 'myComputer', workingDir: file.fileSystemDir });
      }
      if (file.type === 'file') {
        const isRealReport =
          file.id === 'q3-real-report' ||
          file.fileSystemFile.content.includes('Q3 REPORT');
        if (isRealReport) {
          gameEventBus.emit('file:real_report_opened', {
            fileId: file.id,
            fileName: file.name,
          });
        }

        openApp({
          appId: fileTypeList[file.fileTypeId].appId,
          workingFile: file.fileSystemFile,
        });
      }
    },
    [openApp]
  );

  const handleIconDragStart = useCallback((event: DragEvent): void => {
    event.preventDefault();
  }, []);

  const renderIcon = (file: ShellItem): JSX.Element | null => {
    const position = iconPositions[file.id];
    if (!position) return null;

    const isBeingDragged = !!drag && drag.fileId === file.id && drag.hasMoved;
    const { left, top } = cellToPixel(position);
    const renderedLeft = isBeingDragged && drag ? drag.ghostLeft : left;
    const renderedTop = isBeingDragged && drag ? drag.ghostTop : top;

    return (
      <div
        key={file.id}
        className={`${style.iconSlot} ${fileGridStyle.file} ${
          file.hasFocus ? fileGridStyle.focus : ''
        } ${file.hasSoftFocus ? fileGridStyle.softFocus : ''}`}
        draggable={false}
        onClick={(event) => handleClickFile(event, file)}
        onDblClick={(event) => handleDblClickFile(event, file)}
        onDragStart={handleIconDragStart}
        onPointerCancel={handlePointerCancel}
        onPointerDown={(event) => handlePointerDown(event, file)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${renderedLeft}px`,
          top: `${renderedTop}px`,
          color: 'white',
          opacity: isBeingDragged ? 0.7 : 1,
          zIndex: isBeingDragged ? 10 : 1,
          touchAction: 'none',
        }}
      >
        <div className={fileGridStyle.fileIcon} draggable={false}>
          <Icon iconId={file.iconId} size={32} />
        </div>
        <div className={fileGridStyle.fileLabel}>
          {truncateMiddle(file.name)}
        </div>
      </div>
    );
  };

  const dropTargetPosition =
    previewDropCell !== null ? cellToPixel(previewDropCell) : null;

  return (
    <div
      className={style.desktop}
      onClick={handleDesktopClick}
      ref={desktopRef}
      style={{ background }}
    >
      {flags.hasDesktopScrambled && <ScreenshotWallpaper />}
      <div className={style.iconLayer}>
        {desktopItems.map((item) => renderIcon(item))}
        {dropTargetPosition && (
          <div
            className={style.dropTarget}
            style={{
              left: `${dropTargetPosition.left}px`,
              top: `${dropTargetPosition.top}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Desktop;
