import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import { Z_INDEX_TIERS } from '../zIndex';

const bsodStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#001e9f',
  color: '#ffffff',
  padding: '24px',
  zIndex: Z_INDEX_TIERS.bluescreen + 120,
  fontFamily: 'var(--font-family-sys)',
  fontSize: '18px',
  lineHeight: 1.6,
  pointerEvents: 'all',
};

const InstantBsodTrap: FunctionComponent = () => {
  const { rebootGame } = useGameState();
  const [isVisible, setIsVisible] = useState(false);
  const rebootTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return gameEventBus.on('trap:instant_bsod', () => {
      if (rebootTimerRef.current !== null) {
        window.clearTimeout(rebootTimerRef.current);
      }

      setIsVisible(true);
      rebootTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
        rebootGame();
        rebootTimerRef.current = null;
      }, 700);
    });
  }, [rebootGame]);

  useEffect(() => {
    return () => {
      if (rebootTimerRef.current !== null) {
        window.clearTimeout(rebootTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div style={bsodStyle}>
      <div>A fatal exception 0xE0000008 has occurred.</div>
      <div style={{ marginTop: '16px' }}>
        The system detected malware and must restart.
      </div>
    </div>
  );
};

export default InstantBsodTrap;
