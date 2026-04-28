import { useEffect, useRef } from 'preact/hooks';

import { systemConfig } from '../../data/systemConfig';
import { NetVoiceCallId } from '../../game/netvoice/calls';
import { useGameState } from '../../game/state';

const HALF_WAY_CALL_EVENT_ID = 'people:alice_halfway:triggered';
const RANDOM_CALL_POOL: NetVoiceCallId[] = [
  'alice_greg_warning',
  'mom_www_issues',
  'mom_maryjane',
];

const randomFrom = <T,>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

export const usePeopleCallScheduler = (): void => {
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
      introStartedAtRef.current = Date.now();
    }
  }, [flags.hasReceivedIntroCall]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!flags.hasReceivedIntroCall) return;
      if (stage === 'win') return;
      if (activeNetVoiceCallId !== null) return;
      const introStartedAt = introStartedAtRef.current;
      if (introStartedAt === null) return;

      const halfWayMs = Math.floor(systemConfig.windowsUpdate.countdownMs / 2);
      const hasReachedHalfWay = Date.now() - introStartedAt >= halfWayMs;
      if (hasReachedHalfWay && !hasEventFired(HALF_WAY_CALL_EVENT_ID)) {
        markEventFired(HALF_WAY_CALL_EVENT_ID);
        triggerNetVoiceCall('alice_halfway');
        return;
      }

      const availableRandomCalls = RANDOM_CALL_POOL.filter(
        (callId) => !hasEventFired(`people:random:${callId}:triggered`)
      );
      if (availableRandomCalls.length === 0) return;

      // Small recurring chance while idle keeps this feeling organic.
      if (Math.random() >= 0.18) return;

      const selectedCallId = randomFrom(availableRandomCalls);
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
