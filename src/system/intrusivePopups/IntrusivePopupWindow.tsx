import {
  h,
  FunctionComponent,
  ComponentChildren,
  JSX,
  RefObject,
} from 'preact';

import Window from '@/components/shared/Window/Window';
import { ActiveIntrusivePopup } from './types';
import { isSafariBrowser } from '../browserCompat';

interface Props {
  boundsRef: RefObject<HTMLDivElement>;
  children?: ComponentChildren;
  onClose: (popupId: string) => void;
  onPopupClick: (popupId: string) => void;
  onMoved: (popupId: string, coords: { x: number; y: number }) => void;
  onToggleMaximize: (popupId: string) => void;
  onPopupMouseDown: (popupId: string) => void;
  popup: ActiveIntrusivePopup;
  onWindowElement?: (element: HTMLDivElement | null) => void;
  windowRef?: RefObject<HTMLDivElement>;
}

const shellStyle: JSX.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--plastic)',
  position: 'relative',
  overflow: 'hidden',
};

const bodyStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: 0,
  flex: 1,
  backgroundColor: 'transparent',
  boxShadow: 'none',
  overflow: 'auto',
};

const IntrusivePopupWindow: FunctionComponent<Props> = ({
  boundsRef,
  children,
  onClose,
  onPopupClick,
  onMoved,
  onToggleMaximize,
  onPopupMouseDown,
  onWindowElement,
  popup,
  windowRef,
}: Props) => {
  return (
    <Window
      coords={popup.coords}
      getBoundingElement={() => boundsRef.current}
      iconId={popup.config.iconId}
      isDraggable
      isMaximized={popup.isMaximized}
      isResizeable={false}
      onWindowElement={onWindowElement}
      windowRef={windowRef}
      onClickClose={() => onClose(popup.id)}
      onClickMaximize={() => onToggleMaximize(popup.id)}
      onClickRestore={() => onToggleMaximize(popup.id)}
      onMouseDown={() => onPopupMouseDown(popup.id)}
      onMoved={(coords) => onMoved(popup.id, coords)}
      size={{ x: popup.config.size.width, y: popup.config.size.height }}
      style={{
        pointerEvents: 'auto',
        position: 'absolute',
        left: 0,
        top: 0,
      }}
      title={popup.config.title}
      zIndex={popup.zIndex}
    >
      <div
        onClick={() => onPopupClick(popup.id)}
        style={{
          ...shellStyle,
          backgroundColor: popup.config.backgroundImageUrl
            ? 'transparent'
            : shellStyle.backgroundColor,
          backgroundImage: popup.config.backgroundImageUrl
            ? `url(${popup.config.backgroundImageUrl})`
            : undefined,
          backgroundSize: popup.config.backgroundImageUrl
            ? '100% 100%'
            : undefined,
          backgroundPosition: popup.config.backgroundImageUrl
            ? 'center'
            : undefined,
          animation: isSafariBrowser()
            ? undefined
            : 'malwareFlash 0.8s steps(2, jump-none) infinite',
        }}
      >
        <div style={bodyStyle}>{children ?? null}</div>
      </div>
    </Window>
  );
};

export default IntrusivePopupWindow;
