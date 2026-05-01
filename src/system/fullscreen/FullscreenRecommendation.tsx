import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Window from '../../components/shared/Window/Window';
import Button from '../../components/shared/Button/Button';
import Icon from '../../components/shared/Icon/Icon';
import { Z_INDEX_TIERS } from '../zIndex';
import { gameEventBus } from '../../game/events';

const WIDTH = 340;
const HEIGHT = 172;

const FullscreenRecommendation: FunctionComponent = () => {
  const boundsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(
    document.fullscreenElement === null
  );

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
      x: Math.max(0, Math.round((window.innerWidth - WIDTH) / 2)),
      y: Math.max(0, Math.round((window.innerHeight - HEIGHT) / 2) - 40),
    }),
    []
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) setIsVisible(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
        size={{ x: WIDTH, y: HEIGHT }}
        style={{ pointerEvents: 'auto' }}
        title="Fullscreen recommended"
        zIndex={Z_INDEX_TIERS.systemOverlay + 501}
      >
        <div
          style={{
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--button-highlight)',
              boxShadow:
                'var(--border-sunken-outer), var(--border-sunken-inner)',
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
              marginTop: '10px',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              label={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <Icon iconId="windowsLogo" size={16} />
                  <span>OK</span>
                </span>
              }
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
