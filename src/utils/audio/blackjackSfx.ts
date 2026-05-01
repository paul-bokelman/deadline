import { registerManagedAudio } from './masterVolume';

const PATHS = {
  chipsIn: '/audio/blackjack/chips-in.mp3',
  dealCard: '/audio/blackjack/deal-card.mp3',
  win: '/audio/blackjack/win.mp3',
  lose: '/audio/blackjack/lose.mp3',
} as const;

const playOneShot = (src: string, baseVolume: number): void => {
  const audio = new Audio(src);
  audio.preload = 'auto';
  registerManagedAudio(audio, baseVolume);
  void audio.play().catch(() => undefined);
};

export const playBlackjackChipsInSfx = (): void => {
  playOneShot(PATHS.chipsIn, 0.55);
};

export const playBlackjackDealCardSfx = (): void => {
  playOneShot(PATHS.dealCard, 0.5);
};

export const playBlackjackWinSfx = (): void => {
  playOneShot(PATHS.win, 0.55);
};

export const playBlackjackLoseSfx = (): void => {
  playOneShot(PATHS.lose, 0.5);
};
