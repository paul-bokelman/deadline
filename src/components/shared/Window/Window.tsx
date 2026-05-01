import {
  h,
  FunctionComponent,
  ComponentChildren,
  JSX,
  createRef,
} from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import useDragging from '@/hooks/useDragging';
import TitleBar, { Props as TitleBarProps } from '../TitleBar/TitleBar';

import style from './Window.module.css';

type Props = TitleBarProps & {
  children: ComponentChildren;
  coords?: { x: number; y: number };
  dragHandleMode?: 'titleBar' | 'window';
  getBoundingElement?: () => HTMLElement | null;
  isDraggable?: boolean;
  isResizeable?: boolean;
  onMouseDown?: () => void;
  onAutoSized?: (size: { x: number; y: number }) => void;
  onMoved?: (coords: { x: number; y: number }) => void;
  onResized?: (size: { x: number; y: number }) => void;
  showCloseButton?: boolean;
  showMaximizeButton?: boolean;
  size?: { x: number; y: number };
  sizeMode?: 'fixed' | 'content';
  style?: JSX.CSSProperties;
  zIndex?: number;
};

const Window: FunctionComponent<Props> = ({
  coords,
  children = null,
  getBoundingElement,
  dragHandleMode = 'titleBar',
  iconId,
  isDraggable = true,
  isInactive = false,
  isMaximized = false,
  isResizeable = true,
  onClickMinimize,
  onClickMaximize,
  onClickRestore,
  onClickHelp,
  onClickClose,
  onAutoSized,
  onDblClickTitleBar,
  onMoved,
  onMouseDown,
  onResized,
  showCloseButton,
  showMaximizeButton,
  size = { x: 300, y: 300 },
  sizeMode = 'fixed',
  style: inlineStyle,
  title,
  zIndex = 0,
}: Props) => {
  const windowRef = createRef<HTMLDivElement>();
  const titleBarRef = createRef<HTMLDivElement>();
  const handleRef = createRef<HTMLDivElement>();
  const autoSizedRef = useRef(false);

  const getParentElement = (): HTMLElement | null => {
    return getBoundingElement
      ? getBoundingElement()
      : windowRef.current?.parentElement ?? null;
  };

  const getTitleBarElement = (): HTMLElement | null => {
    return titleBarRef.current ?? null;
  };

  const getDragHandleElement = (): HTMLElement | null => {
    if (dragHandleMode === 'window') return windowRef.current ?? null;
    return getTitleBarElement();
  };

  const getResizeHandleElement = (): HTMLElement | null => {
    return handleRef.current ?? null;
  };

  const handleOnMoved = (coords: { x: number; y: number }) => {
    if (!isMaximized && onMoved) onMoved(coords);
  };

  const handleOnResized = (coords: { x: number; y: number }) => {
    if (!isMaximized && onResized) onResized(coords);
  };

  const coordsState = useDragging(getDragHandleElement, {
    getBoundingElt: getParentElement,
    getDraggedElt: () => windowRef.current ?? null,
    initialCoords: coords,
    isEnabled: isDraggable,
    onDragStop: handleOnMoved,
  });

  const sizeState = useDragging(getResizeHandleElement, {
    getBoundingElt: getParentElement,
    initialCoords: size,
    isEnabled: isResizeable,
    minCoordsValue: { x: 200, y: 150 },
    onDragStop: handleOnResized,
  });

  useEffect(() => {
    if (sizeMode !== 'content') return;
    if (autoSizedRef.current) return;
    const windowElement = windowRef.current;
    const titleBarElement = titleBarRef.current;
    const fitElement = windowElement?.querySelector<HTMLElement>(
      '[data-window-fit]'
    );
    if (!windowElement || !titleBarElement || !fitElement || !onAutoSized) {
      return;
    }

    const frameWidth = windowElement.offsetWidth - windowElement.clientWidth;
    const chromeWidth = Math.max(
      0,
      windowElement.offsetWidth - fitElement.offsetWidth
    );
    const chromeHeight =
      titleBarElement.offsetHeight +
      Math.max(
        0,
        windowElement.offsetHeight -
          titleBarElement.offsetHeight -
          fitElement.offsetHeight
      ) +
      frameWidth;
    const nextSize = {
      x: Math.ceil(fitElement.scrollWidth + chromeWidth),
      y: Math.ceil(fitElement.scrollHeight + chromeHeight),
    };

    const hasMeaningfulSize = nextSize.x > 0 && nextSize.y > 0;
    const changed =
      Math.abs(nextSize.x - size.x) > 4 || Math.abs(nextSize.y - size.y) > 4;
    if (!hasMeaningfulSize || !changed) return;

    autoSizedRef.current = true;
    onAutoSized(nextSize);
  }, [onAutoSized, size.x, size.y, sizeMode, title]);

  return (
    <div
      className={`${style.window}`}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      ref={windowRef}
      style={{
        ...inlineStyle,
        height: isMaximized ? '100%' : `${sizeState.y}px`,
        transform: isMaximized
          ? 'none'
          : `translate3d(${coordsState.x}px, ${coordsState.y}px, 0px)`,
        width: isMaximized ? '100%' : `${sizeState.x}px`,
        zIndex,
      }}
    >
      <TitleBar
        iconId={iconId}
        innerRef={titleBarRef}
        isInactive={isInactive}
        isMaximized={isMaximized}
        onClickMinimize={onClickMinimize}
        onClickMaximize={onClickMaximize}
        onClickRestore={onClickRestore}
        onClickHelp={onClickHelp}
        onClickClose={onClickClose}
        onDblClickTitleBar={onDblClickTitleBar}
        showCloseButton={showCloseButton}
        showMaximizeButton={showMaximizeButton}
        title={title}
      />
      <div className={style.windowMain}>{children}</div>
      <div
        className={style.handle}
        ref={handleRef}
        style={{ visibility: isResizeable ? 'visible' : 'hidden' }}
      />
    </div>
  );
};

export default Window;
