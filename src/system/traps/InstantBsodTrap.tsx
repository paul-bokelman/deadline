import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import { enterBsodAudioMode, exitBsodAudioMode } from '../../utils/audio/bsodAudioMode';
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
      }, 3000);
    });
  }, [rebootGame]);

  useEffect(() => {
    if (!isVisible) return;
    enterBsodAudioMode();
    return () => {
      exitBsodAudioMode();
    };
  }, [isVisible]);

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
      <div>A fatal exception 0xE0000008 has occurred at 0028:C0011E36.</div>
      <div style={{ marginTop: '16px' }}>
        The current application will be terminated.
      </div>
      <div style={{ marginTop: '16px' }}>
        If this is the first time you've seen this Stop error screen, restart
        your computer.
      </div>
      <div>
        If this screen appears again, disable recently installed software or
        drivers.
      </div>
      <div style={{ marginTop: '16px' }}>Technical information:</div>
      <div>*** STOP: 0x0000008E (0xC0000005, 0x804E37B4, 0xF2B9F7A8, 0x00000000)</div>
      <div>*** FUNWARE_KERNEL_PANIC - Address F2B9F7A8 base at F2A00000, DateStamp 3d6dd67c</div>
      <div style={{ marginTop: '16px' }}>
        The system detected malware and must restart.
      </div>
    </div>
  );
};

export default InstantBsodTrap;
