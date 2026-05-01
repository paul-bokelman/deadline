// Domain-narrow selector hooks. Prefer these over `useGameState()` so
// consumers explicitly declare which slice of game state they depend on.
//
// These are read-through wrappers around the consolidated GameStateContext
// today. The seam exists so future commits can swap in real per-domain
// providers without touching consumers.

export { useRunState } from './useRunState';
export type { RunStateView } from './useRunState';

export { useNetVoice } from './useNetVoice';
export type { NetVoiceView } from './useNetVoice';

export { useEconomy } from './useEconomy';
export type { EconomyView } from './useEconomy';

export { useProgression } from './useProgression';
export type { ProgressionView } from './useProgression';

export { useMalware } from './useMalware';
export type { MalwareView } from './useMalware';
