import { h, FunctionComponent, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

import Button from '../../components/shared/Button/Button';
import Window from '../../components/shared/Window/Window';
import { useGameState } from '../../game/state';

const containerStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 99000,
};

const bodyStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  margin: '0 0 10px',
  padding: '10px',
};

const actionsStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
};

const WinStageLayer: FunctionComponent = () => {
  const { stage, rebootGame } = useGameState();
  const [coords, setCoords] = useState({ x: 240, y: 150 });

  const isVisible = stage === 'win';

  const message = useMemo(
    () =>
      'Submission received. Congratulations — you delivered the report before the deadline.',
    []
  );

  if (!isVisible) return null;

  return (
    <div style={containerStyle}>
      <div style={{ pointerEvents: 'auto' }}>
        <Window
          coords={coords}
          iconId="program"
          isDraggable
          isResizeable={false}
          onMoved={(nextCoords) => setCoords(nextCoords)}
          size={{ x: 520, y: 190 }}
          title="Success"
          zIndex={99999}
        >
          <div style={{ padding: '8px' }}>
            <div style={bodyStyle}>{message}</div>
            <div style={actionsStyle}>
              <Button label="Play Again" onClick={rebootGame} />
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
};

export default WinStageLayer;

