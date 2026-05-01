import { FunctionComponent, h, JSX } from 'preact';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import { OpenWindowsContextType } from '@/context/OpenWindowsContext';
import { myComputerFs } from '@/data/fileSystem';
import fileTypeList from '@/data/fileTypeList';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import useShellFilesState from '@/hooks/useShellFilesState';
import { getDynamicDesktopItems } from '@/system/desktop/dynamicDesktopItems';
import { scrambleDesktop } from '@/system/desktop/scrambleDesktop';
import { FileSystemApp } from '@/types/FileSystem';
import { ShellItem } from '@/types/Shell';
import { getDirFromPath } from '@/utils/win96/FileSystemUtils';
import Icon from '../Icon/Icon';

import fileGridStyle from '../FileGrid/FileGrid.module.css';
import style from './Desktop.module.css';

const CELL_WIDTH = 80;
const CELL_HEIGHT = 80;
const ICON_PADDING_X = 4;
const ICON_PADDING_Y = 4;
const DRAG_THRESHOLD_PX = 4;
const FALLBACK_DESKTOP_W = 800;
const FALLBACK_DESKTOP_H = 600;
const PASSWORD_VAULT_FOLDER_NAME = 'PasswordVault';

interface IconPosition {
  left: number;
  top: number;
}

interface DragState {
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

interface SelectionBoxState {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  isActive: boolean;
}

interface IconRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type Props = {
  background?: string;
  openApp: OpenWindowsContextType['openApp'];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const positionKey = (left: number, top: number): string => `${left}:${top}`;

const iconRectFromPosition = (
  position: IconPosition,
  width = 78,
  height = 74
): IconRect => ({
  left: position.left,
  top: position.top,
  right: position.left + width,
  bottom: position.top + height,
});

const rectsIntersect = (a: IconRect, b: IconRect): boolean =>
  !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );

const Desktop: FunctionComponent<Props> = ({
  background = '',
  openApp,
}: Props) => {
  const { flags, setFlags, rebootGame } = useGameState();
  const desktopWorkingDir = getDirFromPath('C:/Windows/Desktop', myComputerFs);
  const { files, focusOnFile, removeFocus } = useShellFilesState(
    desktopWorkingDir,
    false
  );
  const [focusedDynamicItemId, setFocusedDynamicItemId] = useState<
    string | null
  >(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const desktopItems = useMemo<ShellItem[]>(() => {
    const dynamicItems = getDynamicDesktopItems(flags);
    const recycledItemIds = flags.recycledDesktopApps ?? {};
    const mergedItems = [...files, ...dynamicItems]
      .filter((item) => {
        const isRecycleBin =
          item.type === 'dir' && item.fileSystemDir.dirType === 'recycleBin';
        if (isRecycleBin) return true;
        return !recycledItemIds[item.id];
      })
      .map((item) => {
        const isSelected = selectedIds.has(item.id);
        const isFocusedDynamic = item.id === focusedDynamicItemId;
        if (isSelected || isFocusedDynamic) {
          return { ...item, hasFocus: true, hasSoftFocus: true };
        }
        return item;
      });
    if (flags.hasDesktopScrambled) {
      return scrambleDesktop(mergedItems);
    }
    return mergedItems;
  }, [files, flags, focusedDynamicItemId, selectedIds]);
  const recycleBinItem = useMemo(
    () =>
      desktopItems.find(
        (item) =>
          item.type === 'dir' && item.fileSystemDir.dirType === 'recycleBin'
      ) ?? null,
    [desktopItems]
  );
  const passwordVaultItem = useMemo(
    () =>
      desktopItems.find(
        (item) =>
          item.type === 'dir' &&
          item.fileSystemDir.name === PASSWORD_VAULT_FOLDER_NAME
      ) ?? null,
    [desktopItems]
  );

  const desktopRef = useRef<HTMLDivElement>(null);
  const [iconPositions, setIconPositions] = useState<
    Record<string, IconPosition>
  >({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(
    null
  );
  const selectionBoxRef = useRef<SelectionBoxState | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef<number | null>(null);
  const pendingPointerEventRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [desktopSize, setDesktopSize] = useState<{ w: number; h: number }>({
    w: FALLBACK_DESKTOP_W,
    h: FALLBACK_DESKTOP_H,
  });
  const [isRecycleBinDropHover, setIsRecycleBinDropHover] = useState(false);
  const [isPasswordVaultDropHover, setIsPasswordVaultDropHover] = useState(
    false
  );

  useLayoutEffect(() => {
    const element = desktopRef.current;
    if (!element) return undefined;

    const updateSize = (): void => {
      const rect = element.getBoundingClientRect();
      setDesktopSize({
        w: Math.max(1, Math.floor(rect.width)),
        h: Math.max(1, Math.floor(rect.height)),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Auto-assign random positions to new items and prune stale entries.
  useEffect(() => {
    setIconPositions((current) => {
      const next: Record<string, IconPosition> = {};
      const ICON_W = CELL_WIDTH;
      const ICON_H = CELL_HEIGHT;
      const maxLeft = Math.max(ICON_PADDING_X, desktopSize.w - ICON_W);
      const maxTop = Math.max(ICON_PADDING_Y, desktopSize.h - ICON_H);
      const occupiedPositions = new Set<string>();

      const buildOrderedSlots = (): IconPosition[] => {
        const slots: IconPosition[] = [];
        for (let left = ICON_PADDING_X; left <= maxLeft; left += ICON_W) {
          for (let top = ICON_PADDING_Y; top <= maxTop; top += ICON_H) {
            slots.push({ left, top });
          }
        }
        return slots;
      };
      const orderedSlots = buildOrderedSlots();

      desktopItems.forEach((item) => {
        const existing = current[item.id];
        if (!existing) return;
        const clampedPosition = {
          left: clamp(existing.left, ICON_PADDING_X, maxLeft),
          top: clamp(existing.top, ICON_PADDING_Y, maxTop),
        };
        next[item.id] = clampedPosition;
        occupiedPositions.add(
          positionKey(clampedPosition.left, clampedPosition.top)
        );
      });

      desktopItems.forEach((item) => {
        if (next[item.id]) return;
        const availableSlot = orderedSlots.find(
          (slot) => !occupiedPositions.has(positionKey(slot.left, slot.top))
        );
        const fallbackPosition = {
          left: ICON_PADDING_X,
          top: ICON_PADDING_Y,
        };
        const nextPosition = availableSlot ?? fallbackPosition;
        next[item.id] = nextPosition;
        occupiedPositions.add(positionKey(nextPosition.left, nextPosition.top));
      });

      const currentIds = Object.keys(current);
      const nextIds = Object.keys(next);
      if (currentIds.length === nextIds.length) {
        const allMatch = nextIds.every((id) => {
          const a = current[id];
          const b = next[id];
          return !!a && !!b && a.left === b.left && a.top === b.top;
        });
        if (allMatch) return current;
      }

      return next;
    });
  }, [desktopItems, desktopSize.h, desktopSize.w]);

  useEffect(() => {
    const unsubscribeScatter = gameEventBus.on('desktop:scatter_icons', () => {
      setIconPositions(() => {
        const next: Record<string, IconPosition> = {};
        const ICON_W = CELL_WIDTH;
        const ICON_H = CELL_HEIGHT;
        const maxLeft = Math.max(ICON_PADDING_X, desktopSize.w - ICON_W);
        const maxTop = Math.max(ICON_PADDING_Y, desktopSize.h - ICON_H);

        const buildOrderedSlots = (): IconPosition[] => {
          const slots: IconPosition[] = [];
          for (let left = ICON_PADDING_X; left <= maxLeft; left += ICON_W) {
            for (let top = ICON_PADDING_Y; top <= maxTop; top += ICON_H) {
              slots.push({ left, top });
            }
          }
          return slots;
        };

        const slots = buildOrderedSlots();
        slots.sort(() => Math.random() - 0.5);

        desktopItems.forEach((item) => {
          const slot = slots.pop();
          next[item.id] =
            slot ??
            ({ left: ICON_PADDING_X, top: ICON_PADDING_Y } as IconPosition);
        });

        return next;
      });

      // Clear selection so the next interaction feels "fresh".
      setFocusedDynamicItemId(null);
      setSelectedIds(new Set());
      removeFocus();
    });

    return () => unsubscribeScatter();
  }, [desktopItems, desktopSize.h, desktopSize.w, removeFocus]);

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

  const recycleDesktopItems = useCallback(
    (items: ShellItem[]): boolean => {
      const selectedItems = items.filter((item) => {
        if (
          item.type === 'dir' &&
          item.fileSystemDir.dirType === 'recycleBin'
        ) {
          return false;
        }
        return true;
      });
      if (selectedItems.length === 0) return false;
      const nextRecycledItems = { ...(flags.recycledDesktopApps ?? {}) };
      selectedItems.forEach((item) => {
        nextRecycledItems[item.id] = item.name;
      });
      setFlags({ recycledDesktopApps: nextRecycledItems });
      setFocusedDynamicItemId(null);
      setSelectedIds(new Set());
      removeFocus();
      return true;
    },
    [flags.recycledDesktopApps, removeFocus, setFlags]
  );

  const moveAppsToPasswordVault = useCallback(
    (items: ShellItem[]): boolean => {
      if (!passwordVaultItem || passwordVaultItem.type !== 'dir') return false;
      const appsToMove = items.filter(
        (item): item is Extract<ShellItem, { type: 'app' }> =>
          item.type === 'app'
      );
      if (appsToMove.length === 0) return false;

      const desktopEntries = Object.entries(desktopWorkingDir.dir);
      const consumedDesktopKeys = new Set<string>();
      let movedCount = 0;

      appsToMove.forEach((appItem, index) => {
        const matchingDesktopEntry = desktopEntries.find(
          ([entryKey, entryValue]) => {
            if (consumedDesktopKeys.has(entryKey)) return false;
            if (entryValue.type !== 'app') return false;
            if (entryValue.appId !== appItem.appId) return false;
            if (entryValue.name && entryValue.name !== appItem.name)
              return false;
            return true;
          }
        );
        if (!matchingDesktopEntry) return;

        const [desktopEntryKey] = matchingDesktopEntry;
        consumedDesktopKeys.add(desktopEntryKey);
        delete desktopWorkingDir.dir[desktopEntryKey];

        const entryKey = `vaultedApp_${Date.now()}_${index}_${Math.random()
          .toString(36)
          .slice(2, 7)}`;
        const appEntry: FileSystemApp = {
          type: 'app',
          appId: appItem.appId,
          name: appItem.name,
        };
        passwordVaultItem.fileSystemDir.dir[entryKey] = appEntry;
        movedCount += 1;
      });

      if (movedCount === 0) return false;
      gameEventBus.emit('shell:directory_updated', {
        dir: passwordVaultItem.fileSystemDir,
      });
      gameEventBus.emit('shell:directory_updated', { dir: desktopWorkingDir });
      setFocusedDynamicItemId(null);
      setSelectedIds(new Set());
      removeFocus();
      return true;
    },
    [desktopWorkingDir, passwordVaultItem, removeFocus]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (selectedIds.size === 0) return;

      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement) {
        const tagName = activeElement.tagName;
        const isTextInput =
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          activeElement.isContentEditable;
        if (isTextInput) return;
      }

      const selectedItems = desktopItems.filter((item) =>
        selectedIds.has(item.id)
      );
      if (selectedItems.length === 0) return;

      if (recycleDesktopItems(selectedItems)) {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [desktopItems, recycleDesktopItems, selectedIds]);

  const clampToDesktop = useCallback(
    (left: number, top: number): { left: number; top: number } => {
      const ICON_W = CELL_WIDTH;
      const ICON_H = CELL_HEIGHT;
      const maxLeft = Math.max(ICON_PADDING_X, desktopSize.w - ICON_W);
      const maxTop = Math.max(ICON_PADDING_Y, desktopSize.h - ICON_H);
      return {
        left: clamp(left, ICON_PADDING_X, maxLeft),
        top: clamp(top, ICON_PADDING_Y, maxTop),
      };
    },
    [desktopSize.h, desktopSize.w]
  );

  const endDrag = useCallback((): void => {
    dragRef.current = null;
    pendingPointerEventRef.current = null;
    setIsRecycleBinDropHover(false);
    setIsPasswordVaultDropHover(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setDrag(null);
  }, []);

  const endSelectionBox = useCallback((): void => {
    selectionBoxRef.current = null;
    setSelectionBox(null);
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
    const rawDx = pointerX - current.pointerStartX;
    const rawDy = pointerY - current.pointerStartY;

    const hasMoved =
      current.hasMoved ||
      Math.abs(rawDx) > DRAG_THRESHOLD_PX ||
      Math.abs(rawDy) > DRAG_THRESHOLD_PX;
    if (!hasMoved) return;

    const ICON_W = CELL_WIDTH;
    const ICON_H = CELL_HEIGHT;
    const maxLeft = Math.max(ICON_PADDING_X, desktopSize.w - ICON_W);
    const maxTop = Math.max(ICON_PADDING_Y, desktopSize.h - ICON_H);

    let groupMinLeft = Infinity;
    let groupMinTop = Infinity;
    let groupMaxLeft = -Infinity;
    let groupMaxTop = -Infinity;
    current.draggedFileIds.forEach((id) => {
      const pos = current.startPositions[id];
      if (!pos) return;
      groupMinLeft = Math.min(groupMinLeft, pos.left);
      groupMinTop = Math.min(groupMinTop, pos.top);
      groupMaxLeft = Math.max(groupMaxLeft, pos.left);
      groupMaxTop = Math.max(groupMaxTop, pos.top);
    });
    if (!Number.isFinite(groupMinLeft) || !Number.isFinite(groupMinTop)) return;

    const minDx = ICON_PADDING_X - groupMinLeft;
    const maxDx = maxLeft - groupMaxLeft;
    const minDy = ICON_PADDING_Y - groupMinTop;
    const maxDy = maxTop - groupMaxTop;

    const dx = clamp(rawDx, minDx, maxDx);
    const dy = clamp(rawDy, minDy, maxDy);

    const updated: DragState = {
      ...current,
      hasMoved: true,
      deltaX: dx,
      deltaY: dy,
    };
    dragRef.current = updated;
    setDrag(updated);

    if (!recycleBinItem) {
      setIsRecycleBinDropHover(false);
    } else {
      const recycleBinPosition = iconPositions[recycleBinItem.id];
      if (!recycleBinPosition) {
        setIsRecycleBinDropHover(false);
      } else {
        const recycleRect = iconRectFromPosition(recycleBinPosition);
        const hover = updated.draggedFileIds.some((id) => {
          const draggedItem = desktopItems.find((item) => item.id === id);
          if (!draggedItem) return false;
          if (
            draggedItem.type === 'dir' &&
            draggedItem.fileSystemDir.dirType === 'recycleBin'
          ) {
            return false;
          }
          const startPos = updated.startPositions[id];
          if (!startPos) return false;
          const nextPos = clampToDesktop(startPos.left + dx, startPos.top + dy);
          return rectsIntersect(iconRectFromPosition(nextPos), recycleRect);
        });
        setIsRecycleBinDropHover(hover);
      }
    }

    if (!passwordVaultItem || passwordVaultItem.type !== 'dir') {
      setIsPasswordVaultDropHover(false);
      return;
    }
    const passwordVaultPosition = iconPositions[passwordVaultItem.id];
    if (!passwordVaultPosition) {
      setIsPasswordVaultDropHover(false);
      return;
    }
    const vaultRect = iconRectFromPosition(passwordVaultPosition);
    const isHoveringVault = updated.draggedFileIds.some((id) => {
      const draggedItem = desktopItems.find((item) => item.id === id);
      if (!draggedItem || draggedItem.type !== 'app') return false;
      const startPos = updated.startPositions[id];
      if (!startPos) return false;
      const nextPos = clampToDesktop(startPos.left + dx, startPos.top + dy);
      return rectsIntersect(iconRectFromPosition(nextPos), vaultRect);
    });
    setIsPasswordVaultDropHover(isHoveringVault);
  }, [
    clampToDesktop,
    desktopItems,
    desktopSize.h,
    desktopSize.w,
    iconPositions,
    passwordVaultItem,
    recycleBinItem,
  ]);

  const computeSelection = useCallback(
    (box: SelectionBoxState): Set<string> => {
      const desktopElement = desktopRef.current;
      if (!desktopElement) return new Set();
      const rect = desktopElement.getBoundingClientRect();
      const x1 = Math.min(box.startX, box.x) - rect.left;
      const y1 = Math.min(box.startY, box.y) - rect.top;
      const x2 = Math.max(box.startX, box.x) - rect.left;
      const y2 = Math.max(box.startY, box.y) - rect.top;

      const ICON_W = 78;
      const ICON_H = 74;
      const next = new Set<string>();
      desktopItems.forEach((item) => {
        const pos = iconPositions[item.id];
        if (!pos) return;
        const ix1 = pos.left;
        const iy1 = pos.top;
        const ix2 = pos.left + ICON_W;
        const iy2 = pos.top + ICON_H;
        const intersects = !(ix2 < x1 || ix1 > x2 || iy2 < y1 || iy1 > y2);
        if (intersects) next.add(item.id);
      });
      return next;
    },
    [desktopItems, iconPositions]
  );

  const startSelectionBox = useCallback(
    (event: PointerEvent) => {
      const desktopElement = desktopRef.current;
      if (!desktopElement) return;
      const start: SelectionBoxState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        isActive: false,
      };
      selectionBoxRef.current = start;
      setSelectionBox(start);
      setSelectedIds(new Set());
      setFocusedDynamicItemId(null);
      removeFocus();
      try {
        (event.currentTarget as HTMLElement).setPointerCapture?.(
          event.pointerId
        );
      } catch {
        // ignore
      }
    },
    [removeFocus]
  );

  const handleSelectionMove = useCallback(
    (event: PointerEvent) => {
      const current = selectionBoxRef.current;
      if (!current) return;
      if (event.pointerId !== current.pointerId) return;

      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      const isActive =
        current.isActive ||
        Math.abs(dx) > DRAG_THRESHOLD_PX ||
        Math.abs(dy) > DRAG_THRESHOLD_PX;

      const next: SelectionBoxState = {
        ...current,
        x: event.clientX,
        y: event.clientY,
        isActive,
      };
      selectionBoxRef.current = next;
      setSelectionBox(next);
      if (isActive) setSelectedIds(computeSelection(next));
    },
    [computeSelection]
  );

  const handleSelectionUp = useCallback(
    (event: PointerEvent) => {
      const current = selectionBoxRef.current;
      if (!current) return;
      if (event.pointerId !== current.pointerId) return;
      if (current.isActive) {
        armSuppressClick();
        setSelectedIds(computeSelection(current));
      }
      endSelectionBox();
    },
    [armSuppressClick, computeSelection, endSelectionBox]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent, file: ShellItem): void => {
      if (event.button !== 0) return;
      const desktopElement = desktopRef.current;
      if (!desktopElement) return;

      const isDynamicItem = !files.some(
        (candidate) => candidate.id === file.id
      );
      if (selectedIds.has(file.id) && selectedIds.size > 1) {
        // Keep multi-selection intact when dragging an already-selected item.
        setFocusedDynamicItemId(null);
      } else {
        setFocusedDynamicItemId(isDynamicItem ? file.id : null);
        setSelectedIds(new Set([file.id]));
        if (isDynamicItem) {
          removeFocus();
        } else {
          focusOnFile(file.id);
        }
      }

      const desktopRect = desktopElement.getBoundingClientRect();
      const position = iconPositions[file.id];
      if (!position) return;

      const groupIds =
        selectedIds.has(file.id) && selectedIds.size > 1
          ? Array.from(selectedIds)
          : [file.id];
      const startPositions: Record<string, IconPosition> = {};
      groupIds.forEach((id) => {
        const pos = iconPositions[id];
        if (pos) startPositions[id] = { left: pos.left, top: pos.top };
      });

      const startState: DragState = {
        primaryFileId: file.id,
        draggedFileIds: groupIds,
        startPositions,
        deltaX: 0,
        deltaY: 0,
        pointerStartX: event.clientX - desktopRect.left,
        pointerStartY: event.clientY - desktopRect.top,
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
    [files, focusOnFile, iconPositions, removeFocus, selectedIds]
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

      if (recycleBinItem) {
        const recycleBinPosition = iconPositions[recycleBinItem.id];
        if (recycleBinPosition) {
          const binRect = iconRectFromPosition(recycleBinPosition);

          const draggedItems = desktopItems.filter((item) =>
            finalState.draggedFileIds.includes(item.id)
          );
          const eligibleDraggedItems = draggedItems.filter((item) => {
            if (
              item.type === 'dir' &&
              item.fileSystemDir.dirType === 'recycleBin'
            ) {
              return false;
            }
            return true;
          });
          const isDroppedOnRecycleBin = eligibleDraggedItems.some((item) => {
            const startPos = finalState.startPositions[item.id];
            if (!startPos) return false;
            const nextPos = clampToDesktop(
              startPos.left + finalState.deltaX,
              startPos.top + finalState.deltaY
            );
            return rectsIntersect(iconRectFromPosition(nextPos), binRect);
          });
          if (
            isDroppedOnRecycleBin &&
            recycleDesktopItems(eligibleDraggedItems)
          ) {
            endDrag();
            return;
          }
        }
      }

      if (passwordVaultItem && passwordVaultItem.type === 'dir') {
        const passwordVaultPosition = iconPositions[passwordVaultItem.id];
        if (passwordVaultPosition) {
          const vaultRect = iconRectFromPosition(passwordVaultPosition);
          const draggedItems = desktopItems.filter((item) =>
            finalState.draggedFileIds.includes(item.id)
          );
          const appsDroppedOnVault = draggedItems.filter((item) => {
            if (item.type !== 'app') return false;
            const startPos = finalState.startPositions[item.id];
            if (!startPos) return false;
            const nextPos = clampToDesktop(
              startPos.left + finalState.deltaX,
              startPos.top + finalState.deltaY
            );
            return rectsIntersect(iconRectFromPosition(nextPos), vaultRect);
          });
          if (
            appsDroppedOnVault.length > 0 &&
            moveAppsToPasswordVault(appsDroppedOnVault)
          ) {
            endDrag();
            return;
          }
        }
      }

      setIconPositions((currentPositions) => {
        let changed = false;
        const next: Record<string, IconPosition> = { ...currentPositions };
        finalState.draggedFileIds.forEach((id) => {
          const startPos = finalState.startPositions[id];
          if (!startPos) return;
          const nextPos = clampToDesktop(
            startPos.left + finalState.deltaX,
            startPos.top + finalState.deltaY
          );
          const existing = currentPositions[id];
          if (!existing) return;
          if (existing.left !== nextPos.left || existing.top !== nextPos.top) {
            changed = true;
            next[id] = nextPos;
          }
        });
        return changed ? next : currentPositions;
      });
      endDrag();
    },
    [
      armSuppressClick,
      clampToDesktop,
      desktopItems,
      endDrag,
      flushPointerMove,
      iconPositions,
      moveAppsToPasswordVault,
      passwordVaultItem,
      recycleDesktopItems,
      recycleBinItem,
    ]
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
      setFocusedDynamicItemId(null);
      setSelectedIds(new Set());
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
      const isDynamicItem = !files.some(
        (candidate) => candidate.id === file.id
      );

      if (file.id === 'popup-launcher') {
        gameEventBus.emit('popup:test_spawn_random', {
          x: event.clientX,
          y: event.clientY,
        });
      }

      setFocusedDynamicItemId(isDynamicItem ? file.id : null);
      setSelectedIds(new Set([file.id]));
      focusOnFile(file.id);
    },
    [files, focusOnFile]
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

      if (file.id === 'popup-launcher') return;

      if (file.type === 'app') {
        if (file.id === 'click-me-reset') {
          rebootGame();
          return;
        }
        openApp({ appId: file.appId });
      }
      if (file.type === 'dir') {
        if (file.fileSystemDir.dirType === 'recycleBin') {
          openApp({ appId: 'recycleBinViewer' });
          return;
        }
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
    [openApp, rebootGame]
  );

  const handleIconDragStart = useCallback((event: DragEvent): void => {
    event.preventDefault();
  }, []);

  const renderIcon = (file: ShellItem): JSX.Element | null => {
    const position = iconPositions[file.id];
    if (!position) return null;

    const isInDragGroup =
      !!drag && drag.hasMoved && drag.draggedFileIds.includes(file.id);
    const startPos =
      isInDragGroup && drag ? drag.startPositions[file.id] : null;
    const renderedPos =
      isInDragGroup && drag && startPos
        ? clampToDesktop(
            startPos.left + drag.deltaX,
            startPos.top + drag.deltaY
          )
        : position;
    const isPrimaryDragged =
      !!drag && drag.hasMoved && drag.primaryFileId === file.id;
    const isRecycleBinHighlighted =
      file.type === 'dir' &&
      file.fileSystemDir.dirType === 'recycleBin' &&
      isRecycleBinDropHover;
    const isPasswordVaultHighlighted =
      file.type === 'dir' &&
      file.fileSystemDir.name === PASSWORD_VAULT_FOLDER_NAME &&
      isPasswordVaultDropHover;

    return (
      <div
        key={file.id}
        className={`${style.iconSlot} ${fileGridStyle.file} ${
          file.hasFocus ? fileGridStyle.focus : ''
        } ${file.hasSoftFocus ? fileGridStyle.softFocus : ''} ${
          isRecycleBinHighlighted || isPasswordVaultHighlighted
            ? `${fileGridStyle.focus} ${fileGridStyle.softFocus}`
            : ''
        }`}
        draggable={false}
        onClick={(event) => handleClickFile(event, file)}
        onDblClick={(event) => handleDblClickFile(event, file)}
        onDragStart={handleIconDragStart}
        onPointerCancel={handlePointerCancel}
        onPointerDown={(event) => handlePointerDown(event, file)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          left: `${renderedPos.left}px`,
          top: `${renderedPos.top}px`,
          color: 'white',
          opacity: isInDragGroup ? 0.7 : 1,
          zIndex: isPrimaryDragged ? 10 : 1,
          touchAction: 'none',
        }}
      >
        <div className={fileGridStyle.fileIcon} draggable={false}>
          <Icon iconId={file.iconId} size={32} />
        </div>
        <div className={fileGridStyle.fileLabel}>{file.name}</div>
      </div>
    );
  };

  return (
    <div
      className={style.desktop}
      data-desktop-root="true"
      onClick={handleDesktopClick}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement | null;
        const currentTarget = event.currentTarget as HTMLElement | null;
        if (!target || !currentTarget) return;
        if (target !== currentTarget) return; // only start marquee on empty desktop
        if (event.button !== 0) return;
        startSelectionBox(event);
      }}
      onPointerMove={handleSelectionMove}
      onPointerUp={handleSelectionUp}
      ref={desktopRef}
      style={{ background }}
    >
      <div className={style.iconLayer}>
        {desktopItems.map((item) => renderIcon(item))}
        {selectionBox && selectionBox.isActive && (
          <div
            className={style.selectionBox}
            style={{
              left: `${
                Math.min(selectionBox.startX, selectionBox.x) -
                (desktopRef.current?.getBoundingClientRect().left ?? 0)
              }px`,
              top: `${
                Math.min(selectionBox.startY, selectionBox.y) -
                (desktopRef.current?.getBoundingClientRect().top ?? 0)
              }px`,
              width: `${Math.abs(selectionBox.x - selectionBox.startX)}px`,
              height: `${Math.abs(selectionBox.y - selectionBox.startY)}px`,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Desktop;
