import { useEffect } from 'preact/hooks';

import { useGameState } from '@/game/state';

const FLY_VOICE_LINE_EVENT_ID = 'fly:voice_line:triggered';

export const useFlyVoiceLineScheduler = (): void => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    triggerNetVoiceCall,
  } = useGameState();

  useEffect(() => {
    if (!flags.hasConverterOutputBatch) return;
    if (hasEventFired(FLY_VOICE_LINE_EVENT_ID)) return;

    markEventFired(FLY_VOICE_LINE_EVENT_ID);
    triggerNetVoiceCall('fly_random');
  }, [
    flags.hasConverterOutputBatch,
    hasEventFired,
    markEventFired,
    triggerNetVoiceCall,
  ]);
};
