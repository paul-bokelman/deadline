import { h, FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Icon from '../Icon/Icon';

import style from './NotificationArea.css';

const AUDIO_SOURCE_WEBM = 'https://www.cameronsworld.net/sound/cameronsworld.webm';
const AUDIO_SOURCE_MP3 = 'https://www.cameronsworld.net/sound/cameronsworld.mp3';

const formatTrayTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const NotificationArea: FunctionComponent = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [clockText, setClockText] = useState(formatTrayTime(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockText(formatTrayTime(new Date()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const audio = new Audio(AUDIO_SOURCE_WEBM);
    audioRef.current = audio;
    audio.loop = true;
    audio.preload = 'auto';

    const handleCanPlay = () => {
      setIsPlaying(!audio.paused);
    };

    const handleError = () => {
      if (audio.src !== AUDIO_SOURCE_MP3) {
        audio.src = AUDIO_SOURCE_MP3;
        audio.load();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Autoplay can be blocked by browser policy; icon click remains fallback.
    audio.play().catch(() => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  const handleSoundToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  };

  return (
    <div className={style.notificationArea}>
      <button
        className={style.statusIcon}
        onClick={handleSoundToggle}
        title={isPlaying ? 'Mute sound' : 'Play sound'}
        type="button"
      >
        <Icon iconId={isPlaying ? 'sound' : 'soundOff'} />
      </button>
      <div className={style.clock}>{clockText}</div>
    </div>
  );
};

export default NotificationArea;
