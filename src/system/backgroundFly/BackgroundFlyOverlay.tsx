import { h, Fragment, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import BackgroundFly from './BackgroundFly';
import flyAssetUrl from '@/assets/images/ambient/fly_final.png';
import { useGameState } from '@/game/state';
import { gameEventBus } from '@/game/events';
import { Z_INDEX_TIERS } from '../zIndex';

const FLY_AUDIO_URL = '/audio/ambient/fly_buzzing.mp3';
const FIRST_APPEARANCE_DELAY_MS = 180_000;
const FLY_CALL_ACCEPT_SWARM_COUNT = 50;
const FLY_CALL_DECLINE_SWARM_COUNT = 70;

interface SwarmFly {
  id: string;
  initialPosition: { x: number; y: number };
  sizePx: number;
  walkSpeedPx: number;
}

const createOffscreenFlyPosition = (): { x: number; y: number } => {
  const margin = 64;
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0:
      return { x: Math.random() * window.innerWidth, y: -margin };
    case 1:
      return {
        x: window.innerWidth + margin,
        y: Math.random() * window.innerHeight,
      };
    case 2:
      return {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + margin,
      };
    default:
      return { x: -margin, y: Math.random() * window.innerHeight };
  }
};

const createSwarmFly = (): SwarmFly => ({
  id: crypto.randomUUID(),
  initialPosition: createOffscreenFlyPosition(),
  sizePx: 28 + Math.round(Math.random() * 22),
  walkSpeedPx: 38 + Math.random() * 42,
});

const BackgroundFlyOverlay: FunctionComponent = () => {
  const { rebootGame, flags } = useGameState();
  const [resetNonce, setResetNonce] = useState(0);
  const [isBootloaderActive, setIsBootloaderActive] = useState(false);
  const [swarmFlies, setSwarmFlies] = useState<SwarmFly[]>([]);

  useEffect(() => {
    const off1 = gameEventBus.on('game:rebooted', () => {
      setResetNonce((n) => n + 1);
      setSwarmFlies([]);
    });
    const off2 = gameEventBus.on('bootloader:started', () => {
      setIsBootloaderActive(true);
    });
    const off3 = gameEventBus.on('bootloader:ended', () => {
      setIsBootloaderActive(false);
    });
    const off4 = gameEventBus.on('netvoice:call_accepted', ({ callId }) => {
      if (callId !== 'fly_random') return;
      setSwarmFlies(
        Array.from({ length: FLY_CALL_ACCEPT_SWARM_COUNT }, () =>
          createSwarmFly()
        )
      );
    });
    const off5 = gameEventBus.on('netvoice:call_ended', ({ callId, reason }) => {
      if (callId !== 'fly_random') return;
      if (reason !== 'hangup') return;
      setSwarmFlies(
        Array.from({ length: FLY_CALL_DECLINE_SWARM_COUNT }, () =>
          createSwarmFly()
        )
      );
    });
    const off6 = gameEventBus.on('fly:spawn_swarm', ({ count }) => {
      const safeCount = Math.max(0, Math.floor(count));
      if (safeCount === 0) return;
      setSwarmFlies((prev) => [
        ...prev,
        ...Array.from({ length: safeCount }, () => createSwarmFly()),
      ]);
    });
    return () => {
      off1();
      off2();
      off3();
      off4();
      off5();
      off6();
    };
  }, []);

  const forceHidden =
    isBootloaderActive || flags.isBluescreenSequenceActive === true;

  return (
    <Fragment>
      <BackgroundFly
        assetUrl={flyAssetUrl}
        audioUrl={FLY_AUDIO_URL}
        audioVolume={0.084}
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
      {swarmFlies.map((fly) => (
        <BackgroundFly
          key={fly.id}
          assetUrl={flyAssetUrl}
          sizePx={fly.sizePx}
          assetFacingOffsetDeg={45}
          walkSpeedPx={fly.walkSpeedPx}
          pauseMsRange={[250, 1500]}
          twitchProbability={0.5}
          curveAmount={0.35}
          offscreenChance={0.05}
          offscreenAwayMsRange={[7_000, 20_000]}
          rotationLerpRate={6}
          onClick={() => rebootGame()}
          resetNonce={resetNonce}
          spawnDelayMs={0}
          forceHidden={forceHidden}
          initialPosition={fly.initialPosition}
          zIndex={Z_INDEX_TIERS.ambientCritter}
        />
      ))}
    </Fragment>
  );
};

export default BackgroundFlyOverlay;
