import { h, FunctionComponent } from 'preact';
import { useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Icon from '../Icon/Icon';
import maximizeIcon from '../../../assets/img/ui/maximize.svg';
import restoreIcon from '../../../assets/img/ui/restore.svg';
import { gameEventBus } from '../../../game/events';
import { useGameState } from '../../../game/state';
import OpenWindowsContext from '../../../context/OpenWindowsContext';
import { useIntrusivePopupCount } from '../../../system/intrusivePopups/useIntrusivePopupCount';
import { calculateUsedRamMb, MAX_RAM_MB } from '../../../system/performance/ramUsage';

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
  const { focusOnWindow, openApp, unMinimizeWindow, windows } =
    useContext(OpenWindowsContext);
  const popupCount = useIntrusivePopupCount();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayRetryCountRef = useRef(0);
  const autoplayRetryTimeoutRef = useRef<number | null>(null);
  const shouldAutoPlayGeneralMusicRef = useRef(true);
  const ramCrashTimeoutRef = useRef<number | null>(null);
  const hasBootloaderEndedRef = useRef(false);
  const hasStartupSfxEndedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRamCrashActive, setIsRamCrashActive] = useState(false);
  const [clockText, setClockText] = useState(formatTrayTime(getGameDate()));
  const totalWindowCount = windows.length + popupCount;
  const usedRamMb = useMemo(
    () => calculateUsedRamMb(totalWindowCount),
    [totalWindowCount]
  );
  const ramUsagePercent = (usedRamMb / MAX_RAM_MB) * 100;
  const isRamUsageCritical = ramUsagePercent >= 85;

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
      if (ramCrashTimeoutRef.current !== null) {
        window.clearTimeout(ramCrashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setIsRamCrashActive(false);
      if (ramCrashTimeoutRef.current !== null) {
        window.clearTimeout(ramCrashTimeoutRef.current);
        ramCrashTimeoutRef.current = null;
      }
    });
    return () => unsubscribeRebooted();
  }, []);

  useEffect(() => {
    if (isRamCrashActive) return;
    if (usedRamMb < MAX_RAM_MB) return;
    setIsRamCrashActive(true);
    shouldAutoPlayGeneralMusicRef.current = false;
    audioRef.current?.pause();
    if (ramCrashTimeoutRef.current !== null) {
      window.clearTimeout(ramCrashTimeoutRef.current);
    }
    ramCrashTimeoutRef.current = window.setTimeout(() => {
      ramCrashTimeoutRef.current = null;
      setIsRamCrashActive(false);
      rebootGame();
    }, 3000);
  }, [isRamCrashActive, rebootGame, usedRamMb]);

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

  const handleOpenSystemPerformance = () => {
    const existingWindow = windows.find(
      (window) => window.app.id === 'systemPerformance'
    );
    if (!existingWindow) {
      openApp({ appId: 'systemPerformance' });
      return;
    }
    if (existingWindow.isMinimized) {
      unMinimizeWindow(existingWindow.id);
      return;
    }
    focusOnWindow(existingWindow.id);
  };

  return (
    <div className={style.notificationArea}>
      {isRamCrashActive && (
        <div className={style.ramCrashOverlay}>
          <div>
            A fatal exception 0E has occurred at 0028:C0011E36 in VXD
            VMM(01) + 00010E36.
          </div>
          <div style={{ marginTop: '14px' }}>
            The current application will be terminated.
          </div>
          <div style={{ marginTop: '14px' }}>
            Memory manager detected an unrecoverable allocation fault.
          </div>
          <div>Available memory pool exceeded safe limits.</div>
          <div style={{ marginTop: '14px' }}>
            If this is the first time you've seen this Stop error screen,
            restart your computer.
          </div>
          <div>
            If this screen appears again, follow these steps:
          </div>
          <div>
            Check to make sure any new hardware or software is properly installed.
          </div>
          <div>
            Disable or remove newly installed components if this is a new install.
          </div>
          <div>
            Press F8 to select Advanced Startup Options and choose Safe Mode.
          </div>
          <div style={{ marginTop: '14px' }}>
            * Press any key to terminate the current application.
          </div>
          <div>* Press CTRL+ALT+DEL again to restart your computer.</div>
          <div style={{ marginTop: '14px' }}>Technical information:</div>
          <div>*** STOP: 0x0000008E (0xC0000005, 0x804E37B4, 0xF2B9F7A8, 0x00000000)</div>
          <div>*** RAM_LIMIT_OVERFLOW - Address F2B9F7A8 base at F2A00000, DateStamp 3d6dd67c</div>
          <div style={{ marginTop: '14px' }}>
            System is rebooting due to memory exhaustion...
          </div>
        </div>
      )}
      <button
        className={`${style.ramUsage} ${
          isRamUsageCritical ? style.ramUsageWarning : ''
        }`}
        onClick={handleOpenSystemPerformance}
        title="Open System Performance"
        type="button"
      >
        RAM {usedRamMb.toFixed(1)}/{MAX_RAM_MB.toFixed(1)} MB
      </button>
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
