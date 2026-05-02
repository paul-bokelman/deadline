import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Icon from '@/components/shared/Icon/Icon';
import Window from '@/components/shared/Window/Window';
import WindowContent from '@/components/shared/WindowContent/WindowContent';
import { getDesktopViewportSize } from '@/system/viewport';
import { Z_INDEX_TIERS } from '@/system/zIndex';

const WIDTH = 360;
const HEIGHT = 204;

const SafariWarningWindow: FunctionComponent = () => {
  const boundsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [viewportSize, setViewportSize] = useState(getDesktopViewportSize);

  const coords = useMemo(
    () => ({
      x: Math.max(0, Math.round((viewportSize.width - WIDTH) / 2)),
      y: Math.max(0, Math.round((viewportSize.height - HEIGHT) / 2) - 30),
    }),
    [viewportSize.height, viewportSize.width]
  );

  useEffect(() => {
    const handleViewportChanged = () => {
      setViewportSize(getDesktopViewportSize());
    };

    window.addEventListener('resize', handleViewportChanged, {
      passive: true,
    });
    window.visualViewport?.addEventListener('resize', handleViewportChanged, {
      passive: true,
    });
    document.addEventListener('fullscreenchange', handleViewportChanged, {
      passive: true,
    });
    return () => {
      window.removeEventListener('resize', handleViewportChanged);
      window.visualViewport?.removeEventListener(
        'resize',
        handleViewportChanged
      );
      document.removeEventListener('fullscreenchange', handleViewportChanged);
    };
  }, []);

  if (!isVisible) return null;

  const body = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '10px',
          backgroundColor: 'var(--paper)',
          boxShadow: 'var(--bevel-sunken)',
          flex: '0 0 auto',
        }}
      >
        <div style={{ flex: '0 0 auto', paddingTop: '2px' }}>
          <Icon iconId="warning" size={32} />
        </div>
        <div style={{ lineHeight: 1.35 }}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>
            Safari compatibility warning
          </div>
          <div>
            Playing Deadline in Safari is not recommended. Safari can lag badly
            during calls, popups, dragging, and other busy moments.
          </div>
          <div style={{ marginTop: '8px' }}>
            For the smoothest experience, please play in Chrome.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        <Button label="Continue" onClick={() => setIsVisible(false)} />
      </div>
    </div>
  );

  return (
    <div
      ref={boundsRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: Z_INDEX_TIERS.systemOverlay + 600,
      }}
    >
      <Window
        coords={coords}
        getBoundingElement={() => boundsRef.current}
        iconId="warning"
        isDraggable
        isResizeable={false}
        onClickClose={() => setIsVisible(false)}
        showMaximizeButton={false}
        size={{ x: WIDTH, y: HEIGHT }}
        style={{ pointerEvents: 'auto' }}
        title="Browser warning"
        zIndex={Z_INDEX_TIERS.systemOverlay + 601}
      >
        <WindowContent body={body} />
      </Window>
    </div>
  );
};

export default SafariWarningWindow;
