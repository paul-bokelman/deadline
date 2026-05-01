import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { gameEventBus } from '@/game/events';
import { Z_INDEX_TIERS } from '../zIndex';

// Editable tuning values.
const DEAD_PIXEL_SIZE_PX = 2;
const DEAD_PIXEL_START_DELAY_MS = 60_000;
const DEAD_PIXEL_TARGET_COUNT = 3200;
const DEAD_PIXEL_SPAWN_INTERVAL_MS = 3000;

const generateRandomRgbCss = (): string => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
};

const overlayStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  // Sits in the "rest" band: above normal windows/popups, but below voice
  // calls, the fly, the bluescreen, and the bootloader.
  zIndex: Z_INDEX_TIERS.progress + 500,
  pointerEvents: 'none',
};

const DeadPixelOverlay: FunctionComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTimeoutIdRef = useRef<number | null>(null);
  const spawnIntervalIdRef = useRef<number | null>(null);

  const spawnedCountRef = useRef<number>(0);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;
    // Draw using CSS pixels; the transform maps CSS pixels to device pixels.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };

  const resetSpawningState = () => {
    spawnedCountRef.current = 0;
    clearCanvas();
  };

  const drawRandomDeadPixel = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const maxX = Math.max(0, window.innerWidth - DEAD_PIXEL_SIZE_PX);
    const maxY = Math.max(0, window.innerHeight - DEAD_PIXEL_SIZE_PX);
    const x = Math.floor(Math.random() * (maxX + 1));
    const y = Math.floor(Math.random() * (maxY + 1));

    ctx.fillStyle = generateRandomRgbCss();
    ctx.fillRect(x, y, DEAD_PIXEL_SIZE_PX, DEAD_PIXEL_SIZE_PX);
  };

  const stopSpawning = () => {
    if (startTimeoutIdRef.current !== null) {
      window.clearTimeout(startTimeoutIdRef.current);
      startTimeoutIdRef.current = null;
    }
    if (spawnIntervalIdRef.current !== null) {
      window.clearInterval(spawnIntervalIdRef.current);
      spawnIntervalIdRef.current = null;
    }
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const startSpawning = () => {
    stopSpawning();
    resetSpawningState();

    startTimeoutIdRef.current = window.setTimeout(() => {
      spawnIntervalIdRef.current = window.setInterval(() => {
        if (spawnedCountRef.current >= DEAD_PIXEL_TARGET_COUNT) {
          if (spawnIntervalIdRef.current !== null) {
            window.clearInterval(spawnIntervalIdRef.current);
            spawnIntervalIdRef.current = null;
          }
          return;
        }

        drawRandomDeadPixel();
        spawnedCountRef.current += 1;
      }, DEAD_PIXEL_SPAWN_INTERVAL_MS);
    }, DEAD_PIXEL_START_DELAY_MS);
  };

  useEffect(() => {
    setupCanvas();
    startSpawning();

    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setupCanvas();
      startSpawning();
    });

    return () => {
      stopSpawning();
      unsubscribeRebooted();
    };
    // Mount-only: setupCanvas/startSpawning/stopSpawning capture refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={overlayStyle}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default DeadPixelOverlay;
