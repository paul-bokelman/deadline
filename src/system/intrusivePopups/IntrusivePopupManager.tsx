import { h, FunctionComponent, JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import IntrusivePopupWindow from './IntrusivePopupWindow';
import { ActiveIntrusivePopup, IntrusivePopupConfig } from './types';
import { createRandomIntrusivePopupConfig } from '@/data/intrusivePopupConfigs';
import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { allocateNormalZIndex } from '../zIndex';
import {
  createIntrusivePopupLoopSfx,
  playIntrusivePopupCloseSfx,
  playIntrusivePopupSpawnSfx,
  stopIntrusivePopupLoopSfx,
} from './sfx';
import { getDesktopViewportSize } from '../viewport';

const AMBIENT_SPAWN_EVERY_MS = 40_000;
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const randomAngleVelocity = (
  speedPxPerSecond: number
): { x: number; y: number } => {
  // Avoid "almost horizontal/vertical" angles that feel stuck.
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * speedPxPerSecond;
    const y = Math.sin(angle) * speedPxPerSecond;
    if (
      Math.abs(x) > speedPxPerSecond * 0.25 &&
      Math.abs(y) > speedPxPerSecond * 0.25
    ) {
      return { x, y };
    }
  }
  return {
    x: (Math.random() > 0.5 ? 1 : -1) * speedPxPerSecond * 0.7,
    y: (Math.random() > 0.5 ? 1 : -1) * speedPxPerSecond * 0.7,
  };
};

const managerLayerStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

const managerBoundsStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

interface PopupMotionState {
  coords: { x: number; y: number };
  pausedVelocity: { x: number; y: number } | null;
  velocity: { x: number; y: number } | null;
}

const IntrusivePopupManager: FunctionComponent = () => {
  const { flags } = useGameState();
  const hasAntiVirus = flags.hasPurchasedAntiVirus;
  const hasAntiVirusRef = useRef(hasAntiVirus);
  const [activePopups, setActivePopups] = useState<ActiveIntrusivePopup[]>([]);
  const boundsRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const popupLoopSfxRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const activePopupsRef = useRef<ActiveIntrusivePopup[]>([]);
  const popupMotionRef = useRef<Map<string, PopupMotionState>>(new Map());
  const popupWindowRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    activePopupsRef.current = activePopups;
  }, [activePopups]);

  useEffect(() => {
    hasAntiVirusRef.current = hasAntiVirus;
  }, [hasAntiVirus]);

  const getBounds = useCallback((): { height: number; width: number } => {
    const rect = boundsRef.current?.getBoundingClientRect();
    const viewport = getDesktopViewportSize();
    const fallbackWidth = viewport.width;
    const fallbackHeight = Math.max(0, viewport.height);
    return {
      width: rect && rect.width > 0 ? rect.width : fallbackWidth,
      height: rect && rect.height > 0 ? rect.height : fallbackHeight,
    };
  }, []);

  const createPopup = useCallback(
    (
      config: IntrusivePopupConfig,
      coords?: { x: number; y: number }
    ): ActiveIntrusivePopup => {
      const bounds = getBounds();
      const maxX = Math.max(0, bounds.width - config.size.width);
      const maxY = Math.max(0, bounds.height - config.size.height);

      const x =
        typeof coords?.x === 'number'
          ? clamp(Math.round(coords.x), 0, maxX)
          : Math.round(Math.random() * maxX);
      const y =
        typeof coords?.y === 'number'
          ? clamp(Math.round(coords.y), 0, maxY)
          : Math.round(Math.random() * maxY);

      const minBounceSpeed = config.behavior.bounceSpeedMinPxPerSecond;
      const maxBounceSpeed = config.behavior.bounceSpeedMaxPxPerSecond;
      const speed =
        typeof minBounceSpeed === 'number' &&
        typeof maxBounceSpeed === 'number' &&
        minBounceSpeed > 0 &&
        maxBounceSpeed > 0
          ? randomBetween(
              Math.min(minBounceSpeed, maxBounceSpeed),
              Math.max(minBounceSpeed, maxBounceSpeed)
            )
          : config.behavior.bounceSpeedPxPerSecond;
      const velocity =
        typeof speed === 'number' && speed > 0
          ? randomAngleVelocity(speed)
          : null;

      const now = Date.now();
      const spontaneousMs = config.behavior.spontaneousReplaceEveryMs;
      const autoSpawnSeconds = config.behavior.autoSpawnEverySeconds;

      return {
        id: crypto.randomUUID(),
        config,
        coords: { x, y },
        isMaximized: false,
        nextAutoSpawnAt:
          typeof autoSpawnSeconds === 'number' && autoSpawnSeconds > 0
            ? now + autoSpawnSeconds * 1000
            : null,
        nextSpontaneousAt:
          typeof spontaneousMs === 'number' && spontaneousMs > 0
            ? now + spontaneousMs
            : null,
        pausedVelocity: null,
        shouldSnapOnNextClick: false,
        velocity,
        zIndex: allocateNormalZIndex(),
      };
    },
    [getBounds]
  );

  const registerPopupMotion = useCallback((popup: ActiveIntrusivePopup) => {
    popupMotionRef.current.set(popup.id, {
      coords: { ...popup.coords },
      pausedVelocity: popup.pausedVelocity ? { ...popup.pausedVelocity } : null,
      velocity: popup.velocity ? { ...popup.velocity } : null,
    });
  }, []);

  const setPopupWindowRef = useCallback(
    (popupId: string, element: HTMLDivElement | null) => {
      if (element) {
        popupWindowRefsRef.current.set(popupId, element);
      } else {
        popupWindowRefsRef.current.delete(popupId);
      }
    },
    []
  );

  const spawnPopup = useCallback(
    (config: IntrusivePopupConfig = createRandomIntrusivePopupConfig()) => {
      if (hasAntiVirusRef.current) return;
      const popup = createPopup(config);
      registerPopupMotion(popup);
      playIntrusivePopupSpawnSfx();
      const loopAudio = createIntrusivePopupLoopSfx();
      if (loopAudio) {
        popupLoopSfxRef.current.set(popup.id, loopAudio);
        loopAudio.play().catch(() => {
          popupLoopSfxRef.current.delete(popup.id);
        });
      }
      setActivePopups((current) => [...current, popup]);
    },
    [createPopup, registerPopupMotion]
  );

  const spawnRandomPopup = useCallback(() => {
    spawnPopup(createRandomIntrusivePopupConfig());
  }, [spawnPopup]);

  const scheduleAmbientSpawn = useCallback(() => {
    if (hasAntiVirusRef.current) return;
    const timeoutId = window.setTimeout(() => {
      if (hasAntiVirusRef.current) return;
      spawnPopup(createRandomIntrusivePopupConfig());
      scheduleAmbientSpawn();
    }, AMBIENT_SPAWN_EVERY_MS);
    timeoutIdsRef.current.push(timeoutId);
  }, [spawnPopup]);

  const clearAllPopups = useCallback(() => {
    popupLoopSfxRef.current.forEach((audio) =>
      stopIntrusivePopupLoopSfx(audio)
    );
    popupLoopSfxRef.current.clear();
    popupMotionRef.current.clear();
    popupWindowRefsRef.current.clear();
    setActivePopups([]);
  }, []);

  useEffect(() => {
    if (!hasAntiVirus) return;

    timeoutIdsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId)
    );
    timeoutIdsRef.current = [];
    clearAllPopups();
  }, [clearAllPopups, hasAntiVirus]);

  const closePopup = useCallback((popupId: string) => {
    const loopAudio = popupLoopSfxRef.current.get(popupId);
    stopIntrusivePopupLoopSfx(loopAudio);
    popupLoopSfxRef.current.delete(popupId);
    popupMotionRef.current.delete(popupId);
    popupWindowRefsRef.current.delete(popupId);
    setActivePopups((current) =>
      current.filter((popup) => popup.id !== popupId)
    );
    gameEventBus.emit('popup:closed', { popupId });
    playIntrusivePopupCloseSfx();
  }, []);

  const handlePopupMouseDown = useCallback((popupId: string) => {
    const motion = popupMotionRef.current.get(popupId);
    if (motion) {
      motion.pausedVelocity = motion.velocity ?? motion.pausedVelocity;
      motion.velocity = null;
    }
    setActivePopups((current) =>
      current.map((popup) =>
        popup.id === popupId
          ? {
              ...popup,
              pausedVelocity: popup.velocity ?? popup.pausedVelocity,
              velocity: null,
              zIndex: allocateNormalZIndex(),
            }
          : popup
      )
    );
  }, []);

  const handlePopupClick = useCallback(
    (popupId: string) => {
      const spawnedPopupIds: string[] = [];

      setActivePopups((current) => {
        const sourcePopup = current.find((popup) => popup.id === popupId);
        if (!sourcePopup) return current;

        const hydraSpawnCount = sourcePopup.config.behavior.hydraSpawnCount;
        if (!hydraSpawnCount || hydraSpawnCount <= 0) return current;

        const spawned = Array.from({ length: hydraSpawnCount }, () => {
          const popup = createPopup(sourcePopup.config);
          registerPopupMotion(popup);
          spawnedPopupIds.push(popup.id);
          return popup;
        });

        return [...current, ...spawned];
      });

      // 50% chance: simulate "systems falling over" and scatter desktop icons.
      if (Math.random() < 0.5) {
        gameEventBus.emit('desktop:scatter_icons', {});
      }

      spawnedPopupIds.forEach((spawnedPopupId) => {
        playIntrusivePopupSpawnSfx();
        const loopAudio = createIntrusivePopupLoopSfx();
        if (!loopAudio) return;
        popupLoopSfxRef.current.set(spawnedPopupId, loopAudio);
        loopAudio.play().catch(() => {
          popupLoopSfxRef.current.delete(spawnedPopupId);
        });
      });
    },
    [createPopup, registerPopupMotion]
  );

  const togglePopupMaximize = useCallback((popupId: string) => {
    setActivePopups((current) =>
      current.map((popup) =>
        popup.id === popupId
          ? {
              ...popup,
              isMaximized: !popup.isMaximized,
              zIndex: allocateNormalZIndex(),
            }
          : popup
      )
    );
  }, []);

  const handlePopupMoved = useCallback(
    (popupId: string, coords: { x: number; y: number }) => {
      setActivePopups((current) => {
        const popup = current.find((candidate) => candidate.id === popupId);
        if (!popup) return current;

        const bounds = getBounds();
        const maxX = Math.max(0, bounds.width - popup.config.size.width);
        const maxY = Math.max(0, bounds.height - popup.config.size.height);

        const nextCoords = {
          x: clamp(Math.round(coords.x), 0, maxX),
          y: clamp(Math.round(coords.y), 0, maxY),
        };
        const motion = popupMotionRef.current.get(popupId);
        if (motion) motion.coords = nextCoords;

        return current.map((candidate) =>
          candidate.id === popupId
            ? {
                ...candidate,
                coords: nextCoords,
              }
            : candidate
        );
      });
    },
    [getBounds]
  );

  useEffect(() => {
    const unsubscribeTestSpawn = gameEventBus.on(
      'popup:test_spawn_random',
      () => {
        spawnRandomPopup();
      }
    );
    const unsubscribeClearAll = gameEventBus.on('popup:clear_all', () => {
      clearAllPopups();
    });

    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      clearAllPopups();
    });

    return () => {
      unsubscribeTestSpawn();
      unsubscribeClearAll();
      unsubscribeRebooted();
    };
  }, [clearAllPopups, spawnRandomPopup]);

  useEffect(() => {
    if (hasAntiVirus) return undefined;

    scheduleAmbientSpawn();
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIdsRef.current = [];
    };
  }, [hasAntiVirus, scheduleAmbientSpawn]);

  useEffect(() => {
    const resumePausedBouncing = () => {
      setActivePopups((current) =>
        current.map((popup) =>
          popup.pausedVelocity
            ? {
                ...popup,
                velocity: popup.pausedVelocity,
                pausedVelocity: null,
              }
            : popup
        )
      );
      popupMotionRef.current.forEach((motion) => {
        if (!motion.pausedVelocity) return;
        motion.velocity = motion.pausedVelocity;
        motion.pausedVelocity = null;
      });
    };

    window.addEventListener('mouseup', resumePausedBouncing);
    window.addEventListener('touchend', resumePausedBouncing);
    window.addEventListener('touchcancel', resumePausedBouncing);

    return () => {
      window.removeEventListener('mouseup', resumePausedBouncing);
      window.removeEventListener('touchend', resumePausedBouncing);
      window.removeEventListener('touchcancel', resumePausedBouncing);
    };
  }, []);

  useEffect(() => {
    if (hasAntiVirus) return undefined;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      let didSpawn = false;
      const spawnedPopupIds: string[] = [];

      setActivePopups((current) => {
        if (!current.length) return current;

        const spawned: ActiveIntrusivePopup[] = [];
        let hasChanges = false;

        const updatedPopups = current.map((popup) => {
          let nextPopup = popup;

          if (
            nextPopup.nextSpontaneousAt !== null &&
            now >= nextPopup.nextSpontaneousAt &&
            !nextPopup.velocity
          ) {
            const replacement = createPopup(nextPopup.config);
            const replaceEveryMs =
              nextPopup.config.behavior.spontaneousReplaceEveryMs ?? 500;
            const motion = popupMotionRef.current.get(nextPopup.id);
            if (motion) {
              motion.coords = { ...replacement.coords };
              motion.velocity = replacement.velocity
                ? { ...replacement.velocity }
                : null;
            }
            nextPopup = {
              ...nextPopup,
              coords: replacement.coords,
              isMaximized: false,
              shouldSnapOnNextClick: false,
              zIndex: replacement.zIndex,
              nextSpontaneousAt: now + replaceEveryMs,
            };
            hasChanges = true;
          }

          if (
            nextPopup.nextAutoSpawnAt !== null &&
            now >= nextPopup.nextAutoSpawnAt
          ) {
            const popup = createPopup(createRandomIntrusivePopupConfig());
            registerPopupMotion(popup);
            spawned.push(popup);
            const mostRecent = spawned[spawned.length - 1];
            if (mostRecent) spawnedPopupIds.push(mostRecent.id);
            didSpawn = true;
            const nextSeconds =
              nextPopup.config.behavior.autoSpawnEverySeconds ?? 10;
            nextPopup = {
              ...nextPopup,
              nextAutoSpawnAt: now + nextSeconds * 1000,
            };
            hasChanges = true;
          }

          return nextPopup;
        });

        if (!hasChanges && spawned.length === 0) return current;
        return [...updatedPopups, ...spawned];
      });

      if (didSpawn) {
        spawnedPopupIds.forEach((popupId) => {
          playIntrusivePopupSpawnSfx();
          const loopAudio = createIntrusivePopupLoopSfx();
          if (!loopAudio) return;
          popupLoopSfxRef.current.set(popupId, loopAudio);
          loopAudio.play().catch(() => {
            popupLoopSfxRef.current.delete(popupId);
          });
        });
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [createPopup, hasAntiVirus, registerPopupMotion]);

  useEffect(() => {
    if (hasAntiVirus) return undefined;
    if (activePopups.length === 0) return undefined;

    let rafId = 0;
    let previousTimestamp = performance.now();

    const tick = (timestamp: number) => {
      const deltaSeconds = Math.min(
        0.05,
        (timestamp - previousTimestamp) / 1000
      );
      previousTimestamp = timestamp;

      const popups = activePopupsRef.current;
      if (!popups.length) {
        return;
      }

      const bounds = getBounds();

      popups.forEach((popup) => {
        if (popup.isMaximized) return;
        const motion = popupMotionRef.current.get(popup.id);
        if (!motion?.velocity) return;

        const maxX = Math.max(0, bounds.width - popup.config.size.width);
        const maxY = Math.max(0, bounds.height - popup.config.size.height);
        const velocity = motion.velocity;

        let nextX = motion.coords.x + velocity.x * deltaSeconds;
        let nextY = motion.coords.y + velocity.y * deltaSeconds;

        if (nextX <= 0 || nextX >= maxX) {
          velocity.x *= -1;
          nextX = clamp(nextX, 0, maxX);
        }

        if (nextY <= 0 || nextY >= maxY) {
          velocity.y *= -1;
          nextY = clamp(nextY, 0, maxY);
        }

        const roundedX = Math.round(nextX);
        const roundedY = Math.round(nextY);
        if (roundedX === motion.coords.x && roundedY === motion.coords.y) {
          return;
        }

        motion.coords = { x: roundedX, y: roundedY };
        const popupWindow = popupWindowRefsRef.current.get(popup.id);
        if (!popupWindow) return;
        popupWindow.style.transform = `translate3d(${roundedX}px, ${roundedY}px, 0px)`;
      });

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [activePopups.length, getBounds, hasAntiVirus]);

  useEffect(() => {
    const popupLoopMap = popupLoopSfxRef.current;
    return () => {
      popupLoopMap.forEach((audio) => stopIntrusivePopupLoopSfx(audio));
      popupLoopMap.clear();
    };
  }, []);

  useEffect(() => {
    gameEventBus.emit('popup:count_changed', { count: activePopups.length });
  }, [activePopups.length]);

  return (
    <div style={managerLayerStyle}>
      <div ref={boundsRef} style={managerBoundsStyle}>
        {activePopups.map((popup) => (
          <IntrusivePopupWindow
            boundsRef={boundsRef}
            key={popup.id}
            onClose={closePopup}
            onPopupClick={handlePopupClick}
            onMoved={handlePopupMoved}
            onToggleMaximize={togglePopupMaximize}
            onPopupMouseDown={handlePopupMouseDown}
            popup={popup}
            onWindowElement={(element) => setPopupWindowRef(popup.id, element)}
          />
        ))}
      </div>
    </div>
  );
};

export default IntrusivePopupManager;
