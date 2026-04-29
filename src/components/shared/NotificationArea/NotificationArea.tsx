import { h, FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

import Icon from '../Icon/Icon';
import maximizeIcon from '../../../assets/img/ui/maximize.svg';
import restoreIcon from '../../../assets/img/ui/restore.svg';
import { gameEventBus } from '../../../game/events';
import { useGameState } from '../../../game/state';

import style from './NotificationArea.module.css';
import { getGameDate } from '../../../system/clock/gameClock';

const AUDIO_SOURCE_WEBM =
  'https://www.cameronsworld.net/sound/cameronsworld.webm';
const AUDIO_SOURCE_MP3 =
  'https://www.cameronsworld.net/sound/cameronsworld.mp3';

const formatTrayTime = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const NotificationArea: FunctionComponent = () => {
  const { rebootGame } = useGameState();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRetryCountRef = useRef(0);
  const autoplayRetryTimeoutRef = useRef<number | null>(null);
  const shouldAutoPlayGeneralMusicRef = useRef(true);
  const hasBootloaderEndedRef = useRef(false);
  const hasStartupSfxEndedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clockText, setClockText] = useState(formatTrayTime(getGameDate()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockText(formatTrayTime(getGameDate()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const canStartGeneralMusic = () =>
      hasBootloaderEndedRef.current && hasStartupSfxEndedRef.current;

    const requestGeneralMusicResume = (
      source: 'web_open' | 'bootloader_end' | 'user_interaction'
    ) => {
      if (!canStartGeneralMusic()) return;
      gameEventBus.emit('audio:resume_requested', { source });
    };

    const tryResumeAudio = (
      source: 'web_open' | 'bootloader_end' | 'user_interaction'
    ) => {
      void source;
      if (!canStartGeneralMusic()) return;
      const audio = audioRef.current;
      if (!audio || !audio.paused) return;
      audio.play().catch(() => {
        setIsPlaying(false);
        if (autoplayRetryCountRef.current >= 8) return;
        autoplayRetryCountRef.current += 1;
        if (autoplayRetryTimeoutRef.current !== null) {
          window.clearTimeout(autoplayRetryTimeoutRef.current);
        }
        autoplayRetryTimeoutRef.current = window.setTimeout(() => {
          tryResumeAudio('user_interaction');
        }, 350);
      });
    };

    const handleUserInteraction = () => {
      requestGeneralMusicResume('user_interaction');
    };

    const unsubscribeBootloaderStarted = gameEventBus.on(
      'bootloader:started',
      () => {
        hasBootloaderEndedRef.current = false;
        hasStartupSfxEndedRef.current = false;
        const audio = audioRef.current;
        if (!audio) return;
        audio.pause();
      }
    );
    const unsubscribeBootloaderEnded = gameEventBus.on(
      'bootloader:ended',
      () => {
        hasBootloaderEndedRef.current = true;
        const audio = audioRef.current;
        if (!audio) return;
        if (!shouldAutoPlayGeneralMusicRef.current) return;
        requestGeneralMusicResume('bootloader_end');
      }
    );
    const unsubscribeStartupSfxEnded = gameEventBus.on(
      'startup_sfx:ended',
      () => {
        hasStartupSfxEndedRef.current = true;
        const audio = audioRef.current;
        if (!audio) return;
        if (!shouldAutoPlayGeneralMusicRef.current) return;
        requestGeneralMusicResume('bootloader_end');
      }
    );
    const unsubscribeAudioResume = gameEventBus.on(
      'audio:resume_requested',
      ({ source }) => {
        tryResumeAudio(source);
      }
    );

    window.addEventListener('focus', handleUserInteraction, { passive: true });
    document.addEventListener('visibilitychange', handleUserInteraction, {
      passive: true,
    });
    document.addEventListener('pointerdown', handleUserInteraction, {
      passive: true,
    });
    document.addEventListener('keydown', handleUserInteraction, {
      passive: true,
    });

    return () => {
      unsubscribeBootloaderStarted();
      unsubscribeBootloaderEnded();
      unsubscribeStartupSfxEnded();
      unsubscribeAudioResume();
      window.removeEventListener('focus', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleUserInteraction);
      document.removeEventListener('pointerdown', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      if (autoplayRetryTimeoutRef.current !== null) {
        window.clearTimeout(autoplayRetryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const audio = new Audio(AUDIO_SOURCE_WEBM);
    audioRef.current = audio;
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.15;

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

    // Attempt autoplay only after boot flow gates are fully complete.
    hasBootloaderEndedRef.current = false;
    hasStartupSfxEndedRef.current = false;

    return () => {
      audio.pause();
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
    };
  }, []);

  const handleSoundToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      if (!hasBootloaderEndedRef.current || !hasStartupSfxEndedRef.current) {
        return;
      }
      shouldAutoPlayGeneralMusicRef.current = true;
      audio.play().catch(() => setIsPlaying(false));
      return;
    }

    shouldAutoPlayGeneralMusicRef.current = false;
    audio.pause();
  };

  const handleFullscreenToggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        return;
      }

      await document.exitFullscreen();
    } catch (e) {
      console.error('Failed to toggle fullscreen mode', e);
    }
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
      <button
        className={style.statusIcon}
        onClick={rebootGame}
        title="Reboot"
        type="button"
      >
        <Icon iconId="power" />
      </button>
      <button
        className={style.statusIcon}
        onClick={handleFullscreenToggle}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        type="button"
      >
        <img
          alt=""
          className={style.zoomIcon}
          src={isFullscreen ? restoreIcon : maximizeIcon}
        />
      </button>
      <div className={style.clock}>{clockText}</div>
    </div>
  );
};

export default NotificationArea;
