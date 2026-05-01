// Narrow selector hook for netvoice call state. Use this in components
// that only care about the current call rather than reaching into the
// full GameStateContext.

import { useGameState } from '@/game/state';
import type { NetVoiceCallId } from '@/game/netvoice/calls';

export interface NetVoiceView {
  activeNetVoiceCallId: NetVoiceCallId | null;
  isNetVoiceCallAccepted: boolean;
  triggerNetVoiceCall: (callId: NetVoiceCallId) => void;
}

export const useNetVoice = (): NetVoiceView => {
  const {
    activeNetVoiceCallId,
    isNetVoiceCallAccepted,
    triggerNetVoiceCall,
  } = useGameState();
  return {
    activeNetVoiceCallId,
    isNetVoiceCallAccepted,
    triggerNetVoiceCall,
  };
};
