import { useContext, useEffect, useRef } from 'preact/hooks';

import { gameEventBus } from '@/game/events';
import OpenWindowsContext from '@/context/OpenWindowsContext';
import { AppId } from '@/types/App';

// When the player runs out of time, `usePeopleCallScheduler` triggers
// Harold's final call. This hook reacts to that call being accepted and
// unleashes the end-of-deadline chaos:
//   - 9s after pickup: 50-fly swarm
//   - 12s after pickup: screen shake begins, ramping cubically
//   - 13s after pickup: popup + random app-window spam (250ms cadence)
//   - ~18s after pickup: ~20 windows accumulated → 16MB RAM cap → BSOD;
//     shake auto-stops so it does not persist through the blue screen.
const HAROLD_LAST_CALL_ID = 'harold_second_call';

const FLY_SWARM_DELAY_MS = 9_000;
const FLY_SWARM_COUNT = 50;

const SPAM_DELAY_MS = 13_000;
const SPAM_INTERVAL_MS = 250;
// 0.8MB per window/popup × 16MB cap = ~20 to BSOD; spam more to be safe.
const SPAM_TICKS = 35;
// Roughly every 1 in N spam ticks opens an app window instead of a popup.
const APP_SPAWN_RATIO = 3;

const SHAKE_DELAY_MS = 12_000;
const SHAKE_DURATION_MS = 6_000;
const SHAKE_MAX_AMPLITUDE_PX = 56;
const SHAKE_MAX_ROTATION_DEG = 3;

// App IDs safe to randomly open: cosmetic / standalone, no progression hooks
// that fire on open (excludes shutdown, clickMeReset, explorer, mail, etc.).
const SPAMMABLE_APP_IDS: AppId[] = [
  'antiVirus',
  'fileConverter',
  'systemPerformance',
  'help',
  'notepad',
  'quickView',
  'recycleBinViewer',
  'bank',
  'minesweeper',
  'blackjack',
];

const pickRandom = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

export const useDeadlineChaosSequence = (): void => {
  const { openApp } = useContext(OpenWindowsContext);

  // OpenWindowsProvider's openApp is not memoized — listing it as an effect
  // dep would tear down our timers every time a window/popup spawns. Stash
  // the latest reference in a ref so the main effect runs exactly once.
  const openAppRef = useRef(openApp);
  useEffect(() => {
    openAppRef.current = openApp;
  }, [openApp]);

  useEffect(() => {
    let flyTimerId: number | null = null;
    let spamTimerId: number | null = null;
    let spamIntervalId: number | null = null;
    let shakeStartTimerId: number | null = null;
    let shakeRafId: number | null = null;

    const shakeTarget = document.body;
    const previousTransform = shakeTarget.style.transform;
    const previousWillChange = shakeTarget.style.willChange;

    const stopShake = () => {
      if (shakeRafId !== null) {
        window.cancelAnimationFrame(shakeRafId);
        shakeRafId = null;
      }
      shakeTarget.style.transform = previousTransform;
      shakeTarget.style.willChange = previousWillChange;
    };

    const startShake = () => {
      if (shakeRafId !== null) return;
      const startedAt = performance.now();
      shakeTarget.style.willChange = 'transform';
      const tick = (now: number) => {
        const elapsed = now - startedAt;
        if (elapsed >= SHAKE_DURATION_MS) {
          // Reached peak right at the crash — stop so the shake doesn't
          // persist through the BSOD overlay.
          stopShake();
          return;
        }
        const ramp = elapsed / SHAKE_DURATION_MS;
        // Ease-in cubic: gentle build, vicious acceleration into the crash.
        const intensity = ramp * ramp * ramp;
        const dx = (Math.random() * 2 - 1) * SHAKE_MAX_AMPLITUDE_PX * intensity;
        const dy = (Math.random() * 2 - 1) * SHAKE_MAX_AMPLITUDE_PX * intensity;
        const dr =
          (Math.random() * 2 - 1) * SHAKE_MAX_ROTATION_DEG * intensity;
        shakeTarget.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${dr.toFixed(3)}deg)`;
        shakeRafId = window.requestAnimationFrame(tick);
      };
      shakeRafId = window.requestAnimationFrame(tick);
    };

    const clearAllTimers = () => {
      if (flyTimerId !== null) {
        window.clearTimeout(flyTimerId);
        flyTimerId = null;
      }
      if (spamTimerId !== null) {
        window.clearTimeout(spamTimerId);
        spamTimerId = null;
      }
      if (spamIntervalId !== null) {
        window.clearInterval(spamIntervalId);
        spamIntervalId = null;
      }
      if (shakeStartTimerId !== null) {
        window.clearTimeout(shakeStartTimerId);
        shakeStartTimerId = null;
      }
    };

    const scheduleFlySwarm = () => {
      if (flyTimerId !== null) return;
      flyTimerId = window.setTimeout(() => {
        flyTimerId = null;
        gameEventBus.emit('fly:spawn_swarm', { count: FLY_SWARM_COUNT });
      }, FLY_SWARM_DELAY_MS);
    };

    const scheduleScreenShake = () => {
      if (shakeStartTimerId !== null) return;
      shakeStartTimerId = window.setTimeout(() => {
        shakeStartTimerId = null;
        startShake();
      }, SHAKE_DELAY_MS);
    };

    const scheduleWindowSpam = () => {
      if (spamTimerId !== null) return;
      spamTimerId = window.setTimeout(() => {
        spamTimerId = null;
        let ticks = 0;
        spamIntervalId = window.setInterval(() => {
          if (ticks >= SPAM_TICKS) {
            if (spamIntervalId !== null) {
              window.clearInterval(spamIntervalId);
              spamIntervalId = null;
            }
            return;
          }
          ticks += 1;
          if (ticks % APP_SPAWN_RATIO === 0) {
            openAppRef.current({ appId: pickRandom(SPAMMABLE_APP_IDS) });
          } else {
            gameEventBus.emit('popup:test_spawn_random', { x: 0, y: 0 });
          }
        }, SPAM_INTERVAL_MS);
      }, SPAM_DELAY_MS);
    };

    const unsubscribeAccepted = gameEventBus.on(
      'netvoice:call_accepted',
      ({ callId }) => {
        if (callId !== HAROLD_LAST_CALL_ID) return;
        scheduleFlySwarm();
        scheduleScreenShake();
        scheduleWindowSpam();
      }
    );

    // On reboot, abort any in-flight chaos so the next run starts clean.
    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      clearAllTimers();
      stopShake();
    });

    return () => {
      clearAllTimers();
      stopShake();
      unsubscribeAccepted();
      unsubscribeRebooted();
    };
  }, []);
};
