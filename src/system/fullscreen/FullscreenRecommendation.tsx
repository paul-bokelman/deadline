import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import Window from '../../components/shared/Window/Window';
import Button from '../../components/shared/Button/Button';
import { gameEventBus } from '../../game/events';

const WIDTH = 340;
const HEIGHT = 140;

const FullscreenRecommendation: FunctionComponent = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    return gameEventBus.on('game:rebooted', () => {
      setIsVisible(true);
    });
  }, []);

  const coords = useMemo(
    () => ({
      x: Math.max(0, Math.round((window.innerWidth - WIDTH) / 2)),
      y: Math.max(0, Math.round((window.innerHeight - HEIGHT) / 2) - 40),
    }),
    []
  );

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 99000,
      }}
    >
      <Window
        coords={coords}
        getBoundingElement={() => document.body}
        iconId="warning"
        isDraggable={false}
        isResizeable={false}
        onClickClose={() => setIsVisible(false)}
        showMaximizeButton={false}
        size={{ x: WIDTH, y: HEIGHT }}
        style={{ pointerEvents: 'auto' }}
        title="Fullscreen recommended"
        zIndex={99001}
      >
        <div style={{ padding: '10px' }}>
          <div
            style={{
              padding: '10px',
              backgroundColor: 'var(--button-highlight)',
              boxShadow:
                'var(--border-sunken-outer), var(--border-sunken-inner)',
            }}
          >
            Game is best experienced in full screen.
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <Button label="OK" onClick={() => setIsVisible(false)} />
          </div>
        </div>
      </Window>
    </div>
  );
};

export default FullscreenRecommendation;
