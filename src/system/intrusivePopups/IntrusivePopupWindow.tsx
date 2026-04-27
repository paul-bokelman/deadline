import {
  h,
  FunctionComponent,
  ComponentChildren,
  JSX,
  RefObject,
} from 'preact';

import Window from '../../components/shared/Window/Window';
import { ActiveIntrusivePopup, IntrusivePopupDecorationAction } from './types';

interface Props {
  boundsRef: RefObject<HTMLDivElement>;
  children?: ComponentChildren;
  onDecorationAction: (
    popupId: string,
    action: IntrusivePopupDecorationAction
  ) => void;
  onDecorationHover: () => void;
  onMoved: (popupId: string, coords: { x: number; y: number }) => void;
  onPopupMouseDown: (popupId: string, event: MouseEvent) => void;
  popup: ActiveIntrusivePopup;
}

const shellStyle: JSX.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--surface)',
  position: 'relative',
  overflow: 'hidden',
};

const decorationLayerStyle: JSX.CSSProperties = {
  position: 'relative',
  height: '20px',
  margin: '4px 4px 0 4px',
};

const bodyStyle: JSX.CSSProperties = {
  margin: '2px 6px 6px 6px',
  padding: 0,
  flex: 1,
  backgroundColor: 'transparent',
  boxShadow: 'none',
  overflow: 'auto',
};

const IntrusivePopupWindow: FunctionComponent<Props> = ({
  boundsRef,
  children,
  onDecorationAction,
  onDecorationHover,
  onMoved,
  onPopupMouseDown,
  popup,
}: Props) => {
  return (
    <Window
      coords={popup.coords}
      getBoundingElement={() => boundsRef.current}
      iconId={popup.config.iconId}
      isDraggable
      isResizeable={false}
      onClickClose={() => undefined}
      onMoved={(coords) => onMoved(popup.id, coords)}
      showCloseButton={false}
      showMaximizeButton={false}
      size={{ x: popup.config.size.width, y: popup.config.size.height }}
      style={{ pointerEvents: 'auto' }}
      title={popup.config.title}
      zIndex={popup.zIndex}
    >
      <div
        onMouseDown={(event) => onPopupMouseDown(popup.id, event)}
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
        }}
      >
        <div style={decorationLayerStyle}>
          {popup.controls.map((control) => (
            <button
              key={`${popup.id}-${control.action}-${control.left}`}
              onMouseEnter={onDecorationHover}
              onClick={(event) => {
                event.stopPropagation();
                onDecorationAction(popup.id, control.action);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              style={{
                position: 'absolute',
                left: `${control.left}px`,
                top: `${control.top}px`,
                width: '16px',
                height: '14px',
                lineHeight: '12px',
                fontSize: '11px',
                border: 'none',
                backgroundColor: 'var(--surface)',
                boxShadow:
                  'var(--border-raised-outer), var(--border-raised-inner)',
                padding: 0,
                textAlign: 'center',
              }}
            >
              {control.symbol}
            </button>
          ))}
        </div>
        <div style={bodyStyle}>{children ?? null}</div>
      </div>
    </Window>
  );
};

export default IntrusivePopupWindow;
