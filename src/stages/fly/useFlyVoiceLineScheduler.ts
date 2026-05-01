import { useEffect, useRef } from 'preact/hooks';

import { useGameState } from '../../game/state';
import { getGameDate } from '../../system/clock/gameClock';

const FLY_VOICE_LINE_EVENT_ID = 'fly:voice_line:triggered';
const TICK_INTERVAL_MS = 60_000; // 1 minute
const START_DELAY_MS = 180_000; // 3 minutes
const TRIGGER_CHANCE = 0.25; // 25% per tick

export const useFlyVoiceLineScheduler = (): void => {
  const {
    activeNetVoiceCallId,
    flags,
    hasEventFired,
    markEventFired,
    stage,
    triggerNetVoiceCall,
  } = useGameState();
  const introStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!flags.hasReceivedIntroCall) {
      introStartedAtRef.current = null;
      return;
    }
    if (introStartedAtRef.current === null) {
      introStartedAtRef.current = getGameDate().getTime();
    }
  }, [flags.hasReceivedIntroCall]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!flags.hasReceivedIntroCall) return;
      if (stage === 'win') return;
      if (activeNetVoiceCallId !== null) return;
      if (hasEventFired(FLY_VOICE_LINE_EVENT_ID)) return;

      const introStartedAt = introStartedAtRef.current;
      if (introStartedAt === null) return;
      if (getGameDate().getTime() - introStartedAt < START_DELAY_MS) return;

      if (Math.random() >= TRIGGER_CHANCE) return;

      markEventFired(FLY_VOICE_LINE_EVENT_ID);
      triggerNetVoiceCall('fly_random');
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    activeNetVoiceCallId,
    flags.hasReceivedIntroCall,
    hasEventFired,
    markEventFired,
    stage,
    triggerNetVoiceCall,
  ]);
};
