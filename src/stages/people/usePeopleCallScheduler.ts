import { useEffect } from 'preact/hooks';

import { systemConfig } from '@/data/systemConfig';
import { NetVoiceCallId } from '@/game/netvoice/calls';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { pickRandom } from '@/utils/random';

const ALICE_HALFWAY_CALL_EVENT_ID = 'people:alice_halfway:triggered';
const HAROLD_FIRST_CALL_EVENT_ID = 'people:harold_first_call:triggered';
const HAROLD_SECOND_CALL_EVENT_ID = 'people:harold_second_call:triggered';
const HAROLD_FIRST_CALL_TARGET_SECONDS = 2 * 60;
const HALF_WAY_TARGET_SECONDS = Math.floor(
  systemConfig.windowsUpdate.countdownMs / 1000 / 2
);
const RANDOM_CALL_POOL: NetVoiceCallId[] = [
  'alice_greg_warning',
  'mom_www_issues',
  'mom_maryjane',
];

export const usePeopleCallScheduler = (): void => {
  const {
    activeNetVoiceCallId,
    flags,
    hasEventFired,
    markEventFired,
    stage,
    triggerNetVoiceCall,
  } = useGameState();

  useEffect(() => {
    const unsubscribe = gameEventBus.on(
      'deadline:seconds_remaining',
      ({ seconds }) => {
        if (!flags.hasReceivedIntroCall) return;
        if (stage === 'win') return;

        if (
          seconds <= HALF_WAY_TARGET_SECONDS &&
          !hasEventFired(ALICE_HALFWAY_CALL_EVENT_ID)
        ) {
          markEventFired(ALICE_HALFWAY_CALL_EVENT_ID);
          triggerNetVoiceCall('alice_halfway');
          return;
        }

        if (
          seconds <= HAROLD_FIRST_CALL_TARGET_SECONDS &&
          !hasEventFired(HAROLD_FIRST_CALL_EVENT_ID)
        ) {
          markEventFired(HAROLD_FIRST_CALL_EVENT_ID);
          triggerNetVoiceCall('harold_first_call');
          return;
        }

        if (seconds <= 0 && !hasEventFired(HAROLD_SECOND_CALL_EVENT_ID)) {
          markEventFired(HAROLD_SECOND_CALL_EVENT_ID);
          triggerNetVoiceCall('harold_second_call');
        }
      }
    );
    return () => unsubscribe();
  }, [
    flags.hasReceivedIntroCall,
    hasEventFired,
    markEventFired,
    stage,
    triggerNetVoiceCall,
  ]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!flags.hasReceivedIntroCall) return;
      if (stage === 'win') return;
      if (activeNetVoiceCallId !== null) return;

      const availableRandomCalls = RANDOM_CALL_POOL.filter(
        (callId) => !hasEventFired(`people:random:${callId}:triggered`)
      );
      if (availableRandomCalls.length === 0) return;

      // Small recurring chance while idle keeps this feeling organic.
      if (Math.random() >= 0.18) return;

      const selectedCallId = pickRandom(availableRandomCalls);
      if (!selectedCallId) return;
      markEventFired(`people:random:${selectedCallId}:triggered`);
      triggerNetVoiceCall(selectedCallId);
    }, 12000);

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
