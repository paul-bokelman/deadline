import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Window from '@/components/shared/Window/Window';
import Button from '@/components/shared/Button/Button';
import { Z_INDEX_TIERS } from '../zIndex';
import { gameEventBus } from '@/game/events';
import { getDesktopViewportSize } from '../viewport';

const WIDTH = 312;
const HEIGHT = 156;

const FullscreenRecommendation: FunctionComponent = () => {
  const boundsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(
    document.fullscreenElement === null
  );
  const [size, setSize] = useState({ x: WIDTH, y: HEIGHT });
  const [viewportSize, setViewportSize] = useState(getDesktopViewportSize);

  useEffect(() => {
    return gameEventBus.on('game:rebooted', () => {
      setIsVisible(document.fullscreenElement === null);
    });
  }, []);

  useEffect(() => {
    gameEventBus.emit('fullscreen:recommendation_visibility', { isVisible });
    return () => {
      gameEventBus.emit('fullscreen:recommendation_visibility', {
        isVisible: false,
      });
    };
  }, [isVisible]);

  const coords = useMemo(
    () => ({
      x: Math.max(0, Math.round((viewportSize.width - WIDTH) / 2)),
      y: Math.max(0, Math.round((viewportSize.height - HEIGHT) / 2) - 40),
    }),
    [viewportSize.height, viewportSize.width]
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setViewportSize(getDesktopViewportSize());
      if (document.fullscreenElement) setIsVisible(false);
    };
    const handleViewportChanged = () => {
      setViewportSize(getDesktopViewportSize());
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleViewportChanged, { passive: true });
    window.visualViewport?.addEventListener('resize', handleViewportChanged, {
      passive: true,
    });
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleViewportChanged);
      window.visualViewport?.removeEventListener(
        'resize',
        handleViewportChanged
      );
    };
  }, []);

  if (!isVisible) return null;

  const handleOk = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsVisible(false);
    } catch (e) {
      console.error('Failed to enter fullscreen mode', e);
    }
  };

  return (
    <div
      ref={boundsRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: Z_INDEX_TIERS.systemOverlay + 500,
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
        size={size}
        sizeMode="content"
        style={{ pointerEvents: 'auto' }}
        title="Fullscreen recommended"
        zIndex={Z_INDEX_TIERS.systemOverlay + 501}
        onAutoSized={setSize}
      >
        <div
          data-window-fit
          style={{
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '282px',
              padding: '8px',
              backgroundColor: 'var(--paper)',
              boxShadow: 'var(--bevel-sunken)',
            }}
          >
            <div style={{ fontWeight: 700 }}>Heads up</div>
            <div style={{ marginTop: '6px' }}>
              Game is best experienced in full screen.
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              Use the fullscreen button in the bottom-right tray.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              label="OK"
              onClick={() => {
                handleOk();
              }}
            />
          </div>
        </div>
      </Window>
    </div>
  );
};

export default FullscreenRecommendation;
