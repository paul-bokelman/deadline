import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Scalable ambient critter overlay. Defaults to a fly that crawls between
 * random points on screen, occasionally walks off-screen and re-enters from
 * a random edge. Click to fire `onClick`.
 *
 * Built so future variants (cockroach, spider, ant, ...) can plug in by
 * overriding asset / size / pacing props.
 */

export interface BackgroundCritterProps {
  /** Image URL. */
  assetUrl: string;
  /** Sprite size in CSS pixels (square bounding box). */
  sizePx?: number;
  /**
   * Degrees to add to the computed rotation so the sprite's "head" lines up
   * with the direction of motion. The included fly art faces upper-left
   * (~-45deg from up), so the default offset is +45.
   */
  assetFacingOffsetDeg?: number;
  /** Walking speed in CSS pixels per second. */
  walkSpeedPx?: number;
  /** Pause duration range (ms) at each waypoint. */
  pauseMsRange?: [number, number];
  /** Chance per pause that the critter twitches in place. */
  twitchProbability?: number;
  /**
   * Curviness of the path, expressed as max perpendicular offset of the
   * bezier control point relative to the segment length. 0 = straight.
   */
  curveAmount?: number;
  /** Chance per waypoint to walk off-screen instead of picking a new point. */
  offscreenChance?: number;
  /** Time spent fully off-screen before re-entering (ms). */
  offscreenAwayMsRange?: [number, number];
  /** Heading smoothing per second (1 = instant, lower = smoother). */
  rotationLerpRate?: number;
  /** Looping ambient audio URL, played while critter is on-screen. */
  audioUrl?: string;
  /** Audio volume (0..1). */
  audioVolume?: number;
  /** Initial position; defaults to center of viewport on first mount. */
  initialPosition?: { x: number; y: number };
  /** zIndex; defaults to sit above almost everything. */
  zIndex?: number;
  /** Click handler. */
  onClick?: () => void;
  /** Reset trigger - changing this nonce restarts behavior. */
  resetNonce?: number;
  /**
   * Time the critter stays hidden off-screen after a (re)spawn before its
   * first appearance. Useful to delay first sighting after game start.
   */
  spawnDelayMs?: number;
  /**
   * When true, hides the critter and pauses audio without disturbing the
   * underlying behavior loop. Use for blocking overlays (bluescreen, boot).
   */
  forceHidden?: boolean;
}

type Mode = 'walking' | 'paused' | 'twitching' | 'offscreen';

interface Vec2 {
  x: number;
  y: number;
}

const randInRange = ([lo, hi]: [number, number]) =>
  lo + Math.random() * (hi - lo);

const randomPointInViewport = (margin: number): Vec2 => {
  const w = Math.max(margin * 2 + 1, window.innerWidth);
  const h = Math.max(margin * 2 + 1, window.innerHeight);
  return {
    x: margin + Math.random() * (w - margin * 2),
    y: margin + Math.random() * (h - margin * 2),
  };
};

const randomOffscreenTarget = (_from: Vec2, distance: number): Vec2 => {
  const edge = Math.floor(Math.random() * 4);
  const w = window.innerWidth;
  const h = window.innerHeight;
  switch (edge) {
    case 0:
      return { x: Math.random() * w, y: -distance };
    case 1:
      return { x: w + distance, y: Math.random() * h };
    case 2:
      return { x: Math.random() * w, y: h + distance };
    default:
      return { x: -distance, y: Math.random() * h };
  }
};

const randomEntryPoint = (margin: number): Vec2 => {
  const edge = Math.floor(Math.random() * 4);
  const w = window.innerWidth;
  const h = window.innerHeight;
  switch (edge) {
    case 0:
      return { x: Math.random() * w, y: -margin };
    case 1:
      return { x: w + margin, y: Math.random() * h };
    case 2:
      return { x: Math.random() * w, y: h + margin };
    default:
      return { x: -margin, y: Math.random() * h };
  }
};

const bezierAt = (
  p0: Vec2,
  p1: Vec2,
  p2: Vec2,
  t: number
): { pos: Vec2; tan: Vec2 } => {
  const u = 1 - t;
  const pos = {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
  const tan = {
    x: 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
  };
  return { pos, tan };
};

const buildSegment = (
  from: Vec2,
  to: Vec2,
  curveAmount: number
): { p0: Vec2; p1: Vec2; p2: Vec2 } => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = (Math.random() * 2 - 1) * curveAmount * len;
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  return {
    p0: from,
    p1: { x: mid.x + nx * offset, y: mid.y + ny * offset },
    p2: to,
  };
};

const headingDegFromVec = (v: Vec2, facingOffsetDeg: number): number => {
  if (v.x === 0 && v.y === 0) return 0;
  return (Math.atan2(v.x, -v.y) * 180) / Math.PI + facingOffsetDeg;
};

const shortestAngleDelta = (current: number, target: number): number => {
  let d = ((target - current) % 360 + 540) % 360 - 180;
  return d;
};

const BackgroundFly: FunctionComponent<BackgroundCritterProps> = ({
  assetUrl,
  sizePx = 28,
  assetFacingOffsetDeg = 45,
  walkSpeedPx = 55,
  pauseMsRange = [400, 1800],
  twitchProbability = 0.4,
  curveAmount = 0.35,
  offscreenChance = 0.12,
  offscreenAwayMsRange = [6_000, 18_000],
  rotationLerpRate = 6,
  audioUrl,
  audioVolume = 0.25,
  initialPosition,
  zIndex = 9_999_999,
  onClick,
  resetNonce = 0,
  spawnDelayMs = 0,
  forceHidden = false,
}) => {
  const [, forceRender] = useState(0);

  const posRef = useRef<Vec2>(
    initialPosition ?? {
      x: Math.max(10, window.innerWidth / 2),
      y: Math.max(10, window.innerHeight / 2),
    }
  );
  const headingDegRef = useRef<number>(0);
  const visibleRef = useRef<boolean>(true);
  const modeRef = useRef<Mode>('paused');
  const segmentRef = useRef<{
    p0: Vec2;
    p1: Vec2;
    p2: Vec2;
    t: number;
  } | null>(null);
  const phaseEndsAtRef = useRef<number>(0);
  const twitchHeadingTargetRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const forceHiddenRef = useRef<boolean>(forceHidden);
  forceHiddenRef.current = forceHidden;

  const beginWalkTo = (target: Vec2) => {
    segmentRef.current = {
      ...buildSegment(posRef.current, target, curveAmount),
      t: 0,
    };
    modeRef.current = 'walking';
  };

  const beginPause = (now: number) => {
    modeRef.current = 'paused';
    phaseEndsAtRef.current = now + randInRange(pauseMsRange);
    if (Math.random() < twitchProbability) {
      modeRef.current = 'twitching';
      twitchHeadingTargetRef.current =
        headingDegRef.current + (Math.random() * 60 - 30);
    }
  };

  const isExitingRef = useRef<boolean>(false);

  const pickNextDestination = () => {
    if (Math.random() < offscreenChance) {
      const target = randomOffscreenTarget(posRef.current, sizePx * 2);
      segmentRef.current = {
        ...buildSegment(posRef.current, target, curveAmount * 0.5),
        t: 0,
      };
      modeRef.current = 'walking';
      isExitingRef.current = true;
      return;
    }
    beginWalkTo(randomPointInViewport(sizePx));
  };

  const reenterFromEdge = () => {
    posRef.current = randomEntryPoint(sizePx);
    headingDegRef.current = 0;
    visibleRef.current = true;
    isExitingRef.current = false;
    beginWalkTo(randomPointInViewport(sizePx));
  };

  useEffect(() => {
    posRef.current = initialPosition ?? {
      x: Math.max(10, window.innerWidth / 2),
      y: Math.max(10, window.innerHeight / 2),
    };
    isExitingRef.current = false;
    headingDegRef.current = 0;
    segmentRef.current = null;
    if (spawnDelayMs > 0) {
      visibleRef.current = false;
      modeRef.current = 'offscreen';
      phaseEndsAtRef.current = performance.now() + spawnDelayMs;
    } else {
      visibleRef.current = true;
      modeRef.current = 'paused';
      phaseEndsAtRef.current = performance.now() + 100;
    }
    forceRender((n) => n + 1);
  }, [resetNonce]);

  useEffect(() => {
    if (!audioUrl) return undefined;
    const audio = new Audio(audioUrl);
    audio.loop = true;
    audio.volume = audioVolume;
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, audioVolume]);

  useEffect(() => {
    lastFrameMsRef.current = performance.now();

    const tick = (nowMs: number) => {
      const dtMs = Math.min(64, nowMs - lastFrameMsRef.current);
      lastFrameMsRef.current = nowMs;
      const dt = dtMs / 1000;

      const mode = modeRef.current;

      if (mode === 'offscreen') {
        if (nowMs >= phaseEndsAtRef.current) {
          reenterFromEdge();
        }
      } else if (mode === 'paused') {
        if (nowMs >= phaseEndsAtRef.current) {
          pickNextDestination();
        }
      } else if (mode === 'twitching') {
        const dh = shortestAngleDelta(
          headingDegRef.current,
          twitchHeadingTargetRef.current
        );
        headingDegRef.current += dh * Math.min(1, rotationLerpRate * 2 * dt);
        if (Math.abs(dh) < 1) {
          twitchHeadingTargetRef.current =
            headingDegRef.current + (Math.random() * 40 - 20);
        }
        if (nowMs >= phaseEndsAtRef.current) {
          pickNextDestination();
        }
      } else if (mode === 'walking' && segmentRef.current) {
        const seg = segmentRef.current;
        const sample = bezierAt(seg.p0, seg.p1, seg.p2, seg.t);
        const tangentLen = Math.hypot(sample.tan.x, sample.tan.y) || 1;
        const dt_t = (walkSpeedPx * dt) / tangentLen;
        seg.t += dt_t;

        if (seg.t >= 1) {
          posRef.current = seg.p2;
          segmentRef.current = null;
          if (isExitingRef.current) {
            visibleRef.current = false;
            isExitingRef.current = false;
            modeRef.current = 'offscreen';
            phaseEndsAtRef.current = nowMs + randInRange(offscreenAwayMsRange);
          } else {
            beginPause(nowMs);
          }
        } else {
          posRef.current = sample.pos;
          const targetHeading = headingDegFromVec(
            sample.tan,
            assetFacingOffsetDeg
          );
          const dh = shortestAngleDelta(headingDegRef.current, targetHeading);
          headingDegRef.current += dh * Math.min(1, rotationLerpRate * dt);
        }
      }

      const audio = audioRef.current;
      if (audio) {
        const shouldPlay = visibleRef.current && !forceHiddenRef.current;
        if (shouldPlay && audio.paused) {
          audio.play().catch(() => undefined);
        } else if (!shouldPlay && !audio.paused) {
          audio.pause();
        }
      }

      forceRender((n) => (n + 1) % 1_000_000);
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    walkSpeedPx,
    rotationLerpRate,
    assetFacingOffsetDeg,
    curveAmount,
    offscreenChance,
    sizePx,
  ]);

  const containerStyle: JSX.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  const spriteStyle: JSX.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: `${sizePx}px`,
    height: `${sizePx}px`,
    transform: `translate(${posRef.current.x - sizePx / 2}px, ${
      posRef.current.y - sizePx / 2
    }px) rotate(${headingDegRef.current}deg)`,
    transformOrigin: '50% 50%',
    pointerEvents:
      visibleRef.current && !forceHidden && onClick ? 'auto' : 'none',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    visibility:
      visibleRef.current && !forceHidden ? 'visible' : 'hidden',
    imageRendering: 'auto',
  };

  return (
    <div style={containerStyle} aria-hidden="true">
      <img
        src={assetUrl}
        alt=""
        draggable={false}
        style={spriteStyle}
        onClick={(event) => {
          if (!onClick) return;
          event.stopPropagation();
          onClick();
        }}
      />
    </div>
  );
};

export default BackgroundFly;
