import { h, FunctionComponent, JSX } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { v4 as uuid } from 'uuid';

import IntrusivePopupWindow from './IntrusivePopupWindow';
import {
  ActiveIntrusivePopup,
  IntrusivePopupConfig,
  IntrusivePopupDecorationAction,
  IntrusivePopupDecorationButton,
} from './types';
import { createRandomIntrusivePopupConfig } from '../../data/intrusivePopupConfigs';
import { gameEventBus } from '../../game/events';
import {
  playIntrusivePopupCloseSfx,
  playIntrusivePopupHoverSfx,
  playIntrusivePopupSpawnSfx,
} from './sfx';

const MIN_STACKED_CLOSE_CLICKS = 1;
const MAX_STACKED_CLOSE_CLICKS = 3;
const TASKBAR_HEIGHT_PX = 28;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const randomFrom = <T,>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomAngleVelocity = (
  speedPxPerSecond: number
): { x: number; y: number } => {
  // Avoid "almost horizontal/vertical" angles that feel stuck.
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * speedPxPerSecond;
    const y = Math.sin(angle) * speedPxPerSecond;
    if (Math.abs(x) > speedPxPerSecond * 0.25 && Math.abs(y) > speedPxPerSecond * 0.25) {
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
  zIndex: 98650,
};

const managerBoundsStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};

const IntrusivePopupManager: FunctionComponent = () => {
  const [activePopups, setActivePopups] = useState<ActiveIntrusivePopup[]>([]);
  const boundsRef = useRef<HTMLDivElement>(null);
  const latestCursorRef = useRef<{ x: number; y: number } | null>(null);
  const zIndexRef = useRef(98651);
  const timeoutIdsRef = useRef<number[]>([]);

  const getBounds = useCallback((): { height: number; width: number } => {
    const rect = boundsRef.current?.getBoundingClientRect();
    return {
      width: rect?.width ?? window.innerWidth,
      height: rect?.height ?? Math.max(0, window.innerHeight - TASKBAR_HEIGHT_PX),
    };
  }, []);

  const createDecorationButtons = useCallback(
    (config: IntrusivePopupConfig): IntrusivePopupDecorationButton[] => {
      const rightSlot = config.size.width - 24;
      const midSlot = config.size.width - 42;
      const leftSlot = config.size.width - 60;

      if (!config.behavior.scrambledDecorations) {
        return [
          { action: 'minimize', left: leftSlot, symbol: '-', top: 0 },
          { action: 'maximize', left: midSlot, symbol: '^', top: 0 },
          { action: 'close', left: rightSlot, symbol: 'x', top: 0 },
        ];
      }

      const closeSlot = Math.random() > 0.5 ? leftSlot : midSlot;
      const maximizeSlot = closeSlot === leftSlot ? midSlot : leftSlot;

      return [
        { action: 'minimize', left: rightSlot, symbol: '-', top: 0 },
        {
          action: 'maximize',
          left: maximizeSlot,
          symbol: '^',
          top: Math.random() > 0.5 ? 1 : 0,
        },
        {
          action: 'close',
          left: closeSlot,
          symbol: 'x',
          top: Math.random() > 0.5 ? 1 : 0,
        },
      ];
    },
    []
  );

  const createPopup = useCallback(
    (
      config: IntrusivePopupConfig,
      cursor?: { x: number; y: number } | null
    ): ActiveIntrusivePopup => {
      const bounds = getBounds();
      const maxX = Math.max(0, bounds.width - config.size.width);
      const maxY = Math.max(0, bounds.height - config.size.height);

      let x = Math.round(Math.random() * maxX);
      let y = Math.round(Math.random() * maxY);

      if (config.behavior.spawnMode === 'cursorExact' && cursor) {
        x = clamp(Math.round(cursor.x), 0, maxX);
        y = clamp(Math.round(cursor.y), 0, maxY);
      }

      const speed = config.behavior.bounceSpeedPxPerSecond;
      const velocity =
        typeof speed === 'number' && speed > 0
          ? randomAngleVelocity(speed)
          : null;

      const stackedCloseClicks = clamp(
        Math.round(config.behavior.stackedCloseClicks ?? 1),
        MIN_STACKED_CLOSE_CLICKS,
        MAX_STACKED_CLOSE_CLICKS
      );
      const now = Date.now();
      const spontaneousMs = config.behavior.spontaneousReplaceEveryMs;
      const autoSpawnSeconds = config.behavior.autoSpawnEverySeconds;

      return {
        id: uuid(),
        config,
        controls: createDecorationButtons(config),
        coords: { x, y },
        closeClicksRemaining: stackedCloseClicks,
        nextAutoSpawnAt:
          typeof autoSpawnSeconds === 'number' && autoSpawnSeconds > 0
            ? now + autoSpawnSeconds * 1000
            : null,
        nextSpontaneousAt:
          typeof spontaneousMs === 'number' && spontaneousMs > 0
            ? now + spontaneousMs
            : null,
        shouldSnapOnNextClick: !!config.behavior.snapUnderCursorOnNextClick,
        velocity,
        zIndex: zIndexRef.current++,
      };
    },
    [createDecorationButtons, getBounds]
  );

  const spawnPopup = useCallback(
    (
      cursor?: { x: number; y: number } | null,
      config: IntrusivePopupConfig = createRandomIntrusivePopupConfig()
    ) => {
      playIntrusivePopupSpawnSfx();
      setActivePopups((current) => [...current, createPopup(config, cursor)]);
    },
    [createPopup]
  );

  const spawnRandomPopup = useCallback(
    (cursor?: { x: number; y: number } | null) => {
      spawnPopup(cursor, createRandomIntrusivePopupConfig());
    },
    [spawnPopup]
  );

  const scheduleAmbientSpawn = useCallback(() => {
    const delayMs = randomInt(20_000, 35_000);
    const timeoutId = window.setTimeout(() => {
      const baseConfig = createRandomIntrusivePopupConfig();
      const dvdMode = Math.random() < 1 / 3;
      const config = dvdMode
        ? {
            ...baseConfig,
            behavior: {
              ...baseConfig.behavior,
              spawnMode: 'random' as const,
              // "DVD logo" mode: fast bounce + hard-to-close
              bounceSpeedPxPerSecond: randomInt(260, 420),
              stackedCloseClicks: 3,
              scrambledDecorations: true,
              closeOtherPopupOnCloseClick: true,
            },
          }
        : baseConfig;

      spawnPopup(latestCursorRef.current, config);
      scheduleAmbientSpawn();
    }, delayMs);
    timeoutIdsRef.current.push(timeoutId);
  }, [spawnPopup]);

  const scheduleRecursiveSpawn = useCallback(
    (delayMs: number) => {
      const timeoutId = window.setTimeout(() => {
        spawnRandomPopup(latestCursorRef.current);
      }, delayMs);
      timeoutIdsRef.current.push(timeoutId);
    },
    [spawnRandomPopup]
  );

  const closePopupWithRules = useCallback(
    (popupId: string) => {
      const recursiveSpawnDelays: number[] = [];
      let didClose = false;

      setActivePopups((current) => {
        const clickedPopup = current.find((popup) => popup.id === popupId);
        if (!clickedPopup) return current;

        if (clickedPopup.closeClicksRemaining > 1) {
          return current.map((popup) =>
            popup.id === popupId
              ? {
                  ...popup,
                  closeClicksRemaining: popup.closeClicksRemaining - 1,
                }
              : popup
          );
        }

        let targetPopupId = popupId;

        if (clickedPopup.config.behavior.closeOtherPopupOnCloseClick) {
          const otherPopups = current.filter((popup) => popup.id !== popupId);
          if (otherPopups.length > 0) {
            targetPopupId = randomFrom(otherPopups).id;
          }
        }

        const targetPopup = current.find((popup) => popup.id === targetPopupId);
        if (!targetPopup) return current;

        const recursiveDelay =
          targetPopup.config.behavior.recursiveRespawnDelayMs;
        if (typeof recursiveDelay === 'number' && recursiveDelay >= 0) {
          recursiveSpawnDelays.push(recursiveDelay);
        }

        didClose = true;
        gameEventBus.emit('popup:closed', { popupId: targetPopup.id });
        return current.filter((popup) => popup.id !== targetPopup.id);
      });

      if (didClose) {
        playIntrusivePopupCloseSfx();
      }

      recursiveSpawnDelays.forEach((delay) => {
        scheduleRecursiveSpawn(delay);
      });
    },
    [scheduleRecursiveSpawn]
  );

  const handlePopupMouseDown = useCallback(
    (popupId: string, event: MouseEvent) => {
      latestCursorRef.current = { x: event.clientX, y: event.clientY };
      let spawnedCount = 0;

      setActivePopups((current) => {
        const sourcePopup = current.find((popup) => popup.id === popupId);
        if (!sourcePopup) return current;

        const hydraSpawnCount =
          sourcePopup.config.behavior.hydraSpawnCount ?? 0;
        if (hydraSpawnCount <= 0) return current;

        spawnedCount = hydraSpawnCount;
        const spawned = Array.from({ length: hydraSpawnCount }, () =>
          createPopup(
            createRandomIntrusivePopupConfig(),
            latestCursorRef.current
          )
        );
        return [...current, ...spawned];
      });

      if (spawnedCount > 0) {
        playIntrusivePopupSpawnSfx();
      }
    },
    [createPopup]
  );

  const handleDecorationAction = useCallback(
    (popupId: string, action: IntrusivePopupDecorationAction) => {
      if (action === 'close') {
        closePopupWithRules(popupId);
        return;
      }

      if (action === 'maximize' || action === 'minimize') {
        setActivePopups((current) => {
          const bounds = getBounds();
          return current.map((popup) => {
            if (popup.id !== popupId) return popup;

            const maxX = Math.max(0, bounds.width - popup.config.size.width);
            const maxY = Math.max(0, bounds.height - popup.config.size.height);

            return {
              ...popup,
              coords: {
                x: clamp(
                  popup.coords.x + (Math.random() > 0.5 ? 22 : -22),
                  0,
                  maxX
                ),
                y: clamp(
                  popup.coords.y + (Math.random() > 0.5 ? 22 : -22),
                  0,
                  maxY
                ),
              },
              zIndex: zIndexRef.current++,
            };
          });
        });
      }
    },
    [closePopupWithRules, getBounds]
  );

  const handlePopupMoved = useCallback(
    (popupId: string, coords: { x: number; y: number }) => {
      setActivePopups((current) => {
        const popup = current.find((candidate) => candidate.id === popupId);
        if (!popup) return current;

        const bounds = getBounds();
        const maxX = Math.max(0, bounds.width - popup.config.size.width);
        const maxY = Math.max(0, bounds.height - popup.config.size.height);

        return current.map((candidate) =>
          candidate.id === popupId
            ? {
                ...candidate,
                coords: {
                  x: clamp(Math.round(coords.x), 0, maxX),
                  y: clamp(Math.round(coords.y), 0, maxY),
                },
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
      (payload) => {
        const cursor = { x: payload.x, y: payload.y };
        latestCursorRef.current = cursor;
        spawnRandomPopup(cursor);
      }
    );

    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setActivePopups([]);
    });

    return () => {
      unsubscribeTestSpawn();
      unsubscribeRebooted();
    };
  }, [spawnRandomPopup]);

  useEffect(() => {
    scheduleAmbientSpawn();
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIdsRef.current = [];
    };
  }, [scheduleAmbientSpawn]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      latestCursorRef.current = { x: event.clientX, y: event.clientY };
      const target = event.target;
      const isDesktopClick =
        target instanceof HTMLElement &&
        !!target.closest('[data-desktop-root="true"]');

      let didSpawn = false;

      setActivePopups((current) => {
        if (!current.length) return current;

        const bounds = getBounds();
        const spawned: ActiveIntrusivePopup[] = [];
        let hasChanges = false;

        const updatedPopups = current.map((popup) => {
          let nextPopup = popup;

          if (popup.shouldSnapOnNextClick) {
            const maxX = Math.max(0, bounds.width - popup.config.size.width);
            const maxY = Math.max(0, bounds.height - popup.config.size.height);
            nextPopup = {
              ...nextPopup,
              coords: {
                x: clamp(event.clientX, 0, maxX),
                y: clamp(event.clientY, 0, maxY),
              },
              shouldSnapOnNextClick: false,
              zIndex: zIndexRef.current++,
            };
            hasChanges = true;
          }

          const desktopChance = popup.config.behavior.desktopClickSpawnChance;
          if (
            isDesktopClick &&
            typeof desktopChance === 'number' &&
            desktopChance > 0 &&
            Math.random() < desktopChance
          ) {
            spawned.push(
              createPopup(
                createRandomIntrusivePopupConfig(),
                latestCursorRef.current
              )
            );
            didSpawn = true;
            hasChanges = true;
          }

          return nextPopup;
        });

        if (!hasChanges && spawned.length === 0) return current;
        return [...updatedPopups, ...spawned];
      });

      if (didSpawn) {
        playIntrusivePopupSpawnSfx();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [createPopup, getBounds]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      let didSpawn = false;

      setActivePopups((current) => {
        if (!current.length) return current;

        const spawned: ActiveIntrusivePopup[] = [];
        let hasChanges = false;

        const updatedPopups = current.map((popup) => {
          let nextPopup = popup;

          if (
            nextPopup.nextSpontaneousAt !== null &&
            now >= nextPopup.nextSpontaneousAt
          ) {
            const replacement = createPopup(nextPopup.config, null);
            const replaceEveryMs =
              nextPopup.config.behavior.spontaneousReplaceEveryMs ?? 500;
            nextPopup = {
              ...nextPopup,
              coords: replacement.coords,
              controls: replacement.controls,
              closeClicksRemaining: replacement.closeClicksRemaining,
              shouldSnapOnNextClick: !!nextPopup.config.behavior
                .snapUnderCursorOnNextClick,
              zIndex: replacement.zIndex,
              nextSpontaneousAt: now + replaceEveryMs,
            };
            hasChanges = true;
          }

          if (
            nextPopup.nextAutoSpawnAt !== null &&
            now >= nextPopup.nextAutoSpawnAt
          ) {
            spawned.push(
              createPopup(
                createRandomIntrusivePopupConfig(),
                latestCursorRef.current
              )
            );
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
        playIntrusivePopupSpawnSfx();
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [createPopup]);

  useEffect(() => {
    let rafId = 0;
    let previousTimestamp = performance.now();

    const tick = (timestamp: number) => {
      const deltaSeconds = Math.min(
        0.05,
        (timestamp - previousTimestamp) / 1000
      );
      previousTimestamp = timestamp;

      setActivePopups((current) => {
        if (!current.some((popup) => popup.velocity)) return current;

        const bounds = getBounds();
        let hasChanges = false;

        const next = current.map((popup) => {
          if (!popup.velocity) return popup;

          const maxX = Math.max(0, bounds.width - popup.config.size.width);
          const maxY = Math.max(0, bounds.height - popup.config.size.height);
          const velocity = { ...popup.velocity };

          let nextX = popup.coords.x + velocity.x * deltaSeconds;
          let nextY = popup.coords.y + velocity.y * deltaSeconds;

          if (nextX <= 0 || nextX >= maxX) {
            velocity.x *= -1;
            nextX = clamp(nextX, 0, maxX);
          }

          if (nextY <= 0 || nextY >= maxY) {
            velocity.y *= -1;
            nextY = clamp(nextY, 0, maxY);
          }

          if (
            Math.round(nextX) !== popup.coords.x ||
            Math.round(nextY) !== popup.coords.y ||
            velocity.x !== popup.velocity.x ||
            velocity.y !== popup.velocity.y
          ) {
            hasChanges = true;
            return {
              ...popup,
              coords: { x: Math.round(nextX), y: Math.round(nextY) },
              velocity,
            };
          }

          return popup;
        });

        return hasChanges ? next : current;
      });

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [getBounds]);

  useEffect(() => {
    return () => undefined;
  }, []);

  return (
    <div style={managerLayerStyle}>
      <div ref={boundsRef} style={managerBoundsStyle}>
        {activePopups.map((popup) => (
          <IntrusivePopupWindow
            boundsRef={boundsRef}
            key={popup.id}
            onDecorationAction={handleDecorationAction}
            onDecorationHover={playIntrusivePopupHoverSfx}
            onMoved={handlePopupMoved}
            onPopupMouseDown={handlePopupMouseDown}
            popup={popup}
          />
        ))}
      </div>
    </div>
  );
};

export default IntrusivePopupManager;
