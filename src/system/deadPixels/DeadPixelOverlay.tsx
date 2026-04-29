import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { systemConfig } from '../../data/systemConfig';

// Editable tuning values.
const DEAD_PIXEL_SIZE_PX = 2;
const DEAD_PIXEL_START_DELAY_MS = 20_000;
const DEAD_PIXEL_SCREEN_COVERAGE_RATIO = 0.4;

const generateRandomRgbCss = (): string => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
};

const overlayStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 50,
  pointerEvents: 'none',
};

const DeadPixelOverlay: FunctionComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const gameStartedAtMsRef = useRef<number>(Date.now());

  // Spawning state (kept in refs to avoid React re-renders per pixel).
  const isInitializedRef = useRef(false);
  const spawnStartAtMsRef = useRef<number>(0);
  const spawnEndAtMsRef = useRef<number>(0);
  const targetCellCountRef = useRef<number>(0);
  const selectedCellIndicesRef = useRef<Uint32Array | null>(null);
  const currentSpawnIndexRef = useRef<number>(0);
  const gridColsRef = useRef<number>(1);

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

  const resetSpawningSchedule = () => {
    gameStartedAtMsRef.current = Date.now();
    spawnStartAtMsRef.current =
      gameStartedAtMsRef.current + DEAD_PIXEL_START_DELAY_MS;
    spawnEndAtMsRef.current =
      gameStartedAtMsRef.current + systemConfig.windowsUpdate.countdownMs;

    isInitializedRef.current = false;
    targetCellCountRef.current = 0;
    selectedCellIndicesRef.current = null;
    currentSpawnIndexRef.current = 0;
    gridColsRef.current = 1;

    clearCanvas();
  };

  const initializeSpawnTargets = () => {
    if (isInitializedRef.current) return;

    setupCanvas();
    clearCanvas();

    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);

    const gridCols = Math.max(1, Math.floor(cssWidth / DEAD_PIXEL_SIZE_PX));
    const gridRows = Math.max(1, Math.floor(cssHeight / DEAD_PIXEL_SIZE_PX));
    const cellCount = gridCols * gridRows;
    const targetCells = Math.max(
      0,
      Math.min(
        cellCount,
        Math.floor(cellCount * DEAD_PIXEL_SCREEN_COVERAGE_RATIO)
      )
    );

    gridColsRef.current = gridCols;
    targetCellCountRef.current = targetCells;

    // Pick unique cells so our “40%” target is closer to reality.
    const selected = new Set<number>();
    while (selected.size < targetCells) {
      selected.add(Math.floor(Math.random() * cellCount));
    }

    const indices = new Uint32Array(targetCells);
    let i = 0;
    for (const v of selected) {
      indices[i] = v;
      i += 1;
      if (i >= targetCells) break;
    }
    selectedCellIndicesRef.current = indices;

    currentSpawnIndexRef.current = 0;
    isInitializedRef.current = true;
  };

  const drawDeadPixelCell = (cellIndex: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const gridCols = gridColsRef.current;
    const col = cellIndex % gridCols;
    const row = Math.floor(cellIndex / gridCols);

    const x = col * DEAD_PIXEL_SIZE_PX;
    const y = row * DEAD_PIXEL_SIZE_PX;

    ctx.fillStyle = generateRandomRgbCss();
    ctx.fillRect(x, y, DEAD_PIXEL_SIZE_PX, DEAD_PIXEL_SIZE_PX);
  };

  useEffect(() => {
    setupCanvas();
    resetSpawningSchedule();

    const tick = () => {
      const rafNow = Date.now();

      if (rafNow < spawnStartAtMsRef.current) {
        rafIdRef.current = window.requestAnimationFrame(tick);
        return;
      }

      initializeSpawnTargets();

      const targetCellCount = targetCellCountRef.current;
      if (targetCellCount <= 0) return;

      const spawnDurationMs = Math.max(
        1,
        spawnEndAtMsRef.current - spawnStartAtMsRef.current
      );

      const elapsedMs = Math.min(
        spawnDurationMs,
        Math.max(0, rafNow - spawnStartAtMsRef.current)
      );
      const ratio = elapsedMs / spawnDurationMs;

      // Linear ramp: reach the target by the end of the game.
      const desiredCount =
        rafNow >= spawnEndAtMsRef.current
          ? targetCellCount
          : Math.floor(targetCellCount * ratio);

      const currentCount = currentSpawnIndexRef.current;
      const toAdd = desiredCount - currentCount;
      if (toAdd > 0) {
        const indices = selectedCellIndicesRef.current;
        if (indices) {
          for (let i = 0; i < toAdd; i += 1) {
            const nextIndex = currentSpawnIndexRef.current;
            const cellIndex = indices[nextIndex];
            drawDeadPixelCell(cellIndex);
            currentSpawnIndexRef.current = nextIndex + 1;
          }
        }
      }

      const done =
        rafNow >= spawnEndAtMsRef.current &&
        currentSpawnIndexRef.current >= targetCellCount;
      if (!done) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = null;
      resetSpawningSchedule();
      rafIdRef.current = window.requestAnimationFrame(tick);
    });

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      unsubscribeRebooted();
    };
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
