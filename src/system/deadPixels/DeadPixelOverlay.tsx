import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { gameEventBus } from '../../game/events';

// Editable tuning values.
const FIRST_DEAD_PIXEL_DELAY_MS = 30_000;
const DEAD_PIXEL_SPAWN_INTERVAL_MS = 8_000;
const DEAD_PIXEL_SIZE_PX = 2;

interface DeadPixel {
  id: number;
  x: number;
  y: number;
  color: string;
}

const overlayStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 999999,
  pointerEvents: 'none',
};

const DeadPixelOverlay: FunctionComponent = () => {
  const [deadPixels, setDeadPixels] = useState<DeadPixel[]>([]);
  const firstSpawnTimeoutIdRef = useRef<number | null>(null);
  const spawnIntervalIdRef = useRef<number | null>(null);

  const spawnDeadPixel = () => {
    const maxX = Math.max(0, window.innerWidth - DEAD_PIXEL_SIZE_PX);
    const maxY = Math.max(0, window.innerHeight - DEAD_PIXEL_SIZE_PX);
    const x = Math.round(Math.random() * maxX);
    const y = Math.round(Math.random() * maxY);
    const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
      Math.random() * 256
    )}, ${Math.floor(Math.random() * 256)})`;
    setDeadPixels((current) => [...current, { id: Date.now() + Math.random(), x, y, color }]);
  };

  useEffect(() => {
    const clearSpawnTimers = () => {
      if (firstSpawnTimeoutIdRef.current !== null) {
        window.clearTimeout(firstSpawnTimeoutIdRef.current);
        firstSpawnTimeoutIdRef.current = null;
      }
      if (spawnIntervalIdRef.current !== null) {
        window.clearInterval(spawnIntervalIdRef.current);
        spawnIntervalIdRef.current = null;
      }
    };

    const beginSpawning = () => {
      spawnDeadPixel();
      spawnIntervalIdRef.current = window.setInterval(
        spawnDeadPixel,
        DEAD_PIXEL_SPAWN_INTERVAL_MS
      );
    };

    const scheduleFirstSpawn = () => {
      firstSpawnTimeoutIdRef.current = window.setTimeout(
        beginSpawning,
        FIRST_DEAD_PIXEL_DELAY_MS
      );
    };

    scheduleFirstSpawn();

    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setDeadPixels([]);
      clearSpawnTimers();
      scheduleFirstSpawn();
    });

    return () => {
      clearSpawnTimers();
      unsubscribeRebooted();
    };
  }, []);

  const deadPixelElements = useMemo(
    () =>
      deadPixels.map((deadPixel) => (
        <div
          key={deadPixel.id}
          style={{
            position: 'absolute',
            left: `${deadPixel.x}px`,
            top: `${deadPixel.y}px`,
            width: `${DEAD_PIXEL_SIZE_PX}px`,
            height: `${DEAD_PIXEL_SIZE_PX}px`,
            backgroundColor: deadPixel.color,
            pointerEvents: 'auto',
          }}
        />
      )),
    [deadPixels]
  );

  return <div style={overlayStyle}>{deadPixelElements}</div>;
};

export default DeadPixelOverlay;
