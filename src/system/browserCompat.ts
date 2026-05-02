export const isSafariBrowser = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg/i.test(ua);
};

export const getSupportedAudioSource = (sources: string[]): string => {
  if (typeof Audio === 'undefined') return sources[0] ?? '';
  const audio = new Audio();
  const preferredSources = isSafariBrowser()
    ? [...sources].sort((a, b) => {
        const aIsMp3 = a.endsWith('.mp3') ? 0 : 1;
        const bIsMp3 = b.endsWith('.mp3') ? 0 : 1;
        return aIsMp3 - bIsMp3;
      })
    : sources;

  return (
    preferredSources.find((source) => {
      const extension = source.split('.').pop()?.toLowerCase();
      if (!extension) return false;
      if (extension === 'mp3') return audio.canPlayType('audio/mpeg') !== '';
      if (extension === 'm4a') return audio.canPlayType('audio/mp4') !== '';
      if (extension === 'wav') return audio.canPlayType('audio/wav') !== '';
      if (extension === 'webm') return audio.canPlayType('audio/webm') !== '';
      return true;
    }) ??
    preferredSources[0] ??
    ''
  );
};
