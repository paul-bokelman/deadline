import { h, FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

import { gameEventBus } from '@/game/events';
import { AppProps } from '@/types/App';

const appStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '8px',
  padding: '10px',
  background: 'var(--plastic)',
  boxSizing: 'border-box' as const,
  fontFamily: 'var(--font-family-ui)',
};

const panelStyle = {
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  padding: '8px',
  lineHeight: 1.45,
};

const buttonStyle = {
  border: 'none',
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-raised)',
  padding: '5px 10px',
  minWidth: '88px',
};

const ClickMeApp: FunctionComponent<AppProps> = ({ closeWindow }: AppProps) => {
  const [clickCount, setClickCount] = useState(0);

  const handleClickMe = () => {
    setClickCount((current) => current + 1);
    const burstCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < burstCount; i += 1) {
      gameEventBus.emit('popup:test_spawn_random', {
        x: 80 + Math.round(Math.random() * 320),
        y: 60 + Math.round(Math.random() * 220),
      });
    }
  };

  return (
    <div style={appStyle}>
      <div style={panelStyle}>
        <div style={{ fontSize: '20px' }}>FunWare Smiley Utility 96 :)</div>
        <div style={{ marginTop: '4px' }}>
          Harmless fun mode enabled. No blue screens, just a little chaos.
        </div>
      </div>
      <div style={panelStyle}>
        <div>Clicks: {clickCount}</div>
        <div style={{ marginTop: '4px' }}>
          Each click may spawn one or two random desktop popups.
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleClickMe} style={buttonStyle} type="button">
          Click Me :)
        </button>
        <button onClick={closeWindow} style={buttonStyle} type="button">
          Close
        </button>
      </div>
    </div>
  );
};

export default ClickMeApp;
