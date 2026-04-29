import { h, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import BackgroundFly from './BackgroundFly';
import flyAssetUrl from '../../assets/img/ambient/fly_final.png';
import { useGameState } from '../../game/state';
import { gameEventBus } from '../../game/events';
import { Z_INDEX_TIERS } from '../zIndex';

const FLY_AUDIO_URL = '/audio/ambient/fly_buzzing.mp3';
const FIRST_APPEARANCE_DELAY_MS = 120_000;

const BackgroundFlyOverlay: FunctionComponent = () => {
  const { rebootGame, flags } = useGameState();
  const [resetNonce, setResetNonce] = useState(0);
  const [isBootloaderActive, setIsBootloaderActive] = useState(false);

  useEffect(() => {
    const off1 = gameEventBus.on('game:rebooted', () => {
      setResetNonce((n) => n + 1);
    });
    const off2 = gameEventBus.on('bootloader:started', () => {
      setIsBootloaderActive(true);
    });
    const off3 = gameEventBus.on('bootloader:ended', () => {
      setIsBootloaderActive(false);
    });
    return () => {
      off1();
      off2();
      off3();
    };
  }, []);

  const forceHidden =
    isBootloaderActive || flags.isBluescreenSequenceActive === true;

  return (
    <BackgroundFly
      assetUrl={flyAssetUrl}
      audioUrl={FLY_AUDIO_URL}
      audioVolume={0.126}
      sizePx={43}
      assetFacingOffsetDeg={45}
      walkSpeedPx={48}
      pauseMsRange={[500, 2200]}
      twitchProbability={0.45}
      curveAmount={0.35}
      offscreenChance={0.1}
      offscreenAwayMsRange={[7_000, 20_000]}
      rotationLerpRate={6}
      onClick={() => rebootGame()}
      resetNonce={resetNonce}
      spawnDelayMs={FIRST_APPEARANCE_DELAY_MS}
      forceHidden={forceHidden}
      zIndex={Z_INDEX_TIERS.ambientCritter}
    />
  );
};

export default BackgroundFlyOverlay;
