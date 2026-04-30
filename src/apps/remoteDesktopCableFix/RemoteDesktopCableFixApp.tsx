import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import { AppProps } from '../../types/App';

import style from './RemoteDesktopCableFixApp.module.css';

type Dir = 'N' | 'E' | 'S' | 'W';
type TileType = 'empty' | 'straight' | 'elbow' | 'tee' | 'cross' | 'end';

type TileDef = {
  type: TileType;
  rotation: 0 | 1 | 2 | 3;
  fixed?: boolean;
};

const COMPLETED_EVENT_ID = 'remote_cable_fix:completed';

const BOARD_W = 9;
const BOARD_H = 9;

const START = { x: 0, y: 4 };
const END = { x: BOARD_W - 1, y: 4 };

const rotateDir = (dir: Dir, steps: number): Dir => {
  const order: Dir[] = ['N', 'E', 'S', 'W'];
  const idx = order.indexOf(dir);
  return order[(idx + steps + 4) % 4]!;
};

const baseConnections = (type: TileType): Dir[] => {
  switch (type) {
    case 'straight':
      return ['N', 'S'];
    case 'elbow':
      return ['N', 'E'];
    case 'tee':
      return ['N', 'E', 'W'];
    case 'cross':
      return ['N', 'E', 'S', 'W'];
    case 'end':
      return ['E'];
    default:
      return [];
  }
};

const connectionsFor = (tile: TileDef): Set<Dir> => {
  const base = baseConnections(tile.type);
  const rotated = base.map((d) => rotateDir(d, tile.rotation));
  return new Set(rotated);
};

const opposite = (dir: Dir): Dir => {
  switch (dir) {
    case 'N':
      return 'S';
    case 'S':
      return 'N';
    case 'E':
      return 'W';
    case 'W':
      return 'E';
  }
};

const step = (x: number, y: number, dir: Dir): { x: number; y: number } => {
  switch (dir) {
    case 'N':
      return { x, y: y - 1 };
    case 'S':
      return { x, y: y + 1 };
    case 'E':
      return { x: x + 1, y };
    case 'W':
      return { x: x - 1, y };
  }
};

const inBounds = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < BOARD_W && y < BOARD_H;

const buildSolvedBoard = (): TileDef[] => {
  const empty = (): TileDef => ({ type: 'empty', rotation: 0 });
  const board: TileDef[] = Array.from({ length: BOARD_W * BOARD_H }, empty);

  const at = (x: number, y: number) => y * BOARD_W + x;
  const set = (x: number, y: number, tile: TileDef) => {
    board[at(x, y)] = tile;
  };

  // Start and end endpoints.
  set(START.x, START.y, { type: 'end', rotation: 0, fixed: true });
  set(END.x, END.y, { type: 'end', rotation: 2, fixed: true });

  // A gnarly, leakless network with lots of forced rotations.
  // Main spine across center with detours.
  set(1, 4, { type: 'tee', rotation: 1 });
  set(2, 4, { type: 'straight', rotation: 1 });
  set(3, 4, { type: 'elbow', rotation: 2 });
  set(3, 5, { type: 'tee', rotation: 2 });
  set(3, 6, { type: 'straight', rotation: 0 });
  set(3, 7, { type: 'elbow', rotation: 3 });
  set(2, 7, { type: 'straight', rotation: 1 });
  set(1, 7, { type: 'elbow', rotation: 0 });
  set(1, 6, { type: 'tee', rotation: 3 });
  set(0, 6, { type: 'elbow', rotation: 1 });
  set(0, 5, { type: 'straight', rotation: 0 });
  set(0, 3, { type: 'elbow', rotation: 0 });
  set(1, 3, { type: 'straight', rotation: 1 });
  set(2, 3, { type: 'elbow', rotation: 2 });
  set(2, 2, { type: 'tee', rotation: 0 });
  set(3, 2, { type: 'straight', rotation: 1 });
  set(4, 2, { type: 'elbow', rotation: 2 });
  set(4, 3, { type: 'straight', rotation: 0 });
  set(4, 4, { type: 'tee', rotation: 1 });
  set(5, 4, { type: 'elbow', rotation: 1 });
  set(5, 3, { type: 'tee', rotation: 0 });
  set(6, 3, { type: 'elbow', rotation: 2 });
  set(6, 2, { type: 'straight', rotation: 0 });
  set(6, 1, { type: 'elbow', rotation: 3 });
  set(5, 1, { type: 'tee', rotation: 2 });
  set(5, 2, { type: 'straight', rotation: 0 });
  set(7, 1, { type: 'elbow', rotation: 1 });
  set(7, 2, { type: 'tee', rotation: 1 });
  set(8, 2, { type: 'elbow', rotation: 2 });
  set(8, 3, { type: 'straight', rotation: 0 });
  set(8, 4, { type: 'elbow', rotation: 3 });
  set(7, 4, { type: 'straight', rotation: 1 });
  set(6, 4, { type: 'tee', rotation: 3 });

  // Upper-left cluster.
  set(1, 2, { type: 'elbow', rotation: 1 });
  set(1, 1, { type: 'tee', rotation: 2 });
  set(0, 1, { type: 'elbow', rotation: 1 });
  set(0, 2, { type: 'straight', rotation: 0 });
  set(2, 1, { type: 'straight', rotation: 1 });
  set(3, 1, { type: 'elbow', rotation: 2 });
  set(3, 0, { type: 'straight', rotation: 1 });
  set(4, 0, { type: 'elbow', rotation: 1 });
  set(4, 1, { type: 'tee', rotation: 3 });

  // Bottom-right cluster.
  set(6, 5, { type: 'elbow', rotation: 0 });
  set(6, 6, { type: 'tee', rotation: 3 });
  set(7, 6, { type: 'straight', rotation: 1 });
  set(8, 6, { type: 'elbow', rotation: 2 });
  set(8, 7, { type: 'straight', rotation: 0 });
  set(8, 8, { type: 'elbow', rotation: 3 });
  set(7, 8, { type: 'tee', rotation: 2 });
  set(7, 7, { type: 'straight', rotation: 0 });
  set(6, 7, { type: 'elbow', rotation: 0 });
  set(6, 8, { type: 'straight', rotation: 1 });
  set(5, 8, { type: 'elbow', rotation: 1 });
  set(5, 7, { type: 'tee', rotation: 0 });
  set(5, 6, { type: 'straight', rotation: 0 });
  set(5, 5, { type: 'elbow', rotation: 3 });

  return board;
};

const scrambleRotations = (tiles: TileDef[]): TileDef[] => {
  return tiles.map((t) => {
    if (t.type === 'empty' || t.fixed) return t;
    const nextRotation = (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3) ?? 0;
    return { ...t, rotation: nextRotation };
  });
};

const computeNetworkState = (
  tiles: TileDef[]
): { isConnected: boolean; hasLeaks: boolean; energized: Set<number> } => {
  const energized = new Set<number>();

  const idx = (x: number, y: number) => y * BOARD_W + x;
  const tileAt = (x: number, y: number) => tiles[idx(x, y)]!;

  // Traverse from START.
  const q: Array<{ x: number; y: number }> = [{ x: START.x, y: START.y }];
  energized.add(idx(START.x, START.y));
  while (q.length) {
    const cur = q.shift()!;
    const t = tileAt(cur.x, cur.y);
    const con = connectionsFor(t);
    con.forEach((dir) => {
      const n = step(cur.x, cur.y, dir);
      if (!inBounds(n.x, n.y)) return;
      const nt = tileAt(n.x, n.y);
      if (nt.type === 'empty') return;
      const ncon = connectionsFor(nt);
      if (!ncon.has(opposite(dir))) return;
      const ni = idx(n.x, n.y);
      if (energized.has(ni)) return;
      energized.add(ni);
      q.push(n);
    });
  }

  const isConnected = energized.has(idx(END.x, END.y));

  // Leak check: every connector must be matched by a neighbor connector.
  let hasLeaks = false;
  for (let y = 0; y < BOARD_H; y += 1) {
    for (let x = 0; x < BOARD_W; x += 1) {
      const t = tileAt(x, y);
      if (t.type === 'empty') continue;
      const con = connectionsFor(t);
      con.forEach((dir) => {
        const n = step(x, y, dir);
        if (!inBounds(n.x, n.y)) {
          hasLeaks = true;
          return;
        }
        const nt = tileAt(n.x, n.y);
        if (nt.type === 'empty') {
          hasLeaks = true;
          return;
        }
        const ncon = connectionsFor(nt);
        if (!ncon.has(opposite(dir))) {
          hasLeaks = true;
        }
      });
      if (hasLeaks) break;
    }
    if (hasLeaks) break;
  }

  return { isConnected, hasLeaks, energized };
};

const WireGlyph: FunctionComponent<{
  tile: TileDef;
  energized: boolean;
}> = ({ tile, energized }) => {
  if (tile.type === 'empty') return <div className={style.glyph} />;
  const con = connectionsFor(tile);
  const wireClass = energized ? `${style.wire} ${style.wireHot}` : style.wire;
  return (
    <div className={style.glyph} aria-hidden="true">
      <div className={energized ? `${style.wireCenter} ${style.wireHot}` : style.wireCenter} />
      {con.has('N') && <div className={`${style.wireN} ${wireClass}`} />}
      {con.has('S') && <div className={`${style.wireS} ${wireClass}`} />}
      {con.has('W') && <div className={`${style.wireW} ${wireClass}`} />}
      {con.has('E') && <div className={`${style.wireE} ${wireClass}`} />}
    </div>
  );
};

const RemoteDesktopCableFixApp: FunctionComponent<AppProps> = ({ closeWindow }) => {
  const { flags, hasEventFired, markEventFired, setFlag } = useGameState();

  const [tiles, setTiles] = useState<TileDef[]>(() =>
    scrambleRotations(buildSolvedBoard())
  );
  const [attempts, setAttempts] = useState(0);

  const { isConnected, hasLeaks, energized } = useMemo(
    () => computeNetworkState(tiles),
    [tiles]
  );
  const isSolved = isConnected && !hasLeaks;

  useEffect(() => {
    if (!isSolved) return;
    if (hasEventFired(COMPLETED_EVENT_ID)) return;

    markEventFired(COMPLETED_EVENT_ID);
    if (!flags.hasReceivedWinRarLinkEmail) {
      setFlag('hasReceivedWinRarLinkEmail', true);
      gameEventBus.emit('email:delivered', { emailId: 'corp-winrar-download-link' });
      gameEventBus.emit('email:delivered', {
        emailId: 'corp-winrar-download-link-fake',
      });
      gameEventBus.emit('email:delivered', { emailId: 'corp-password-reset-link' });
    }

    const timer = window.setTimeout(() => {
      closeWindow();
    }, 850);
    return () => window.clearTimeout(timer);
  }, [closeWindow, flags.hasReceivedWinRarLinkEmail, hasEventFired, isSolved, markEventFired, setFlag]);

  const boardStyle: JSX.CSSProperties = {
    gridTemplateColumns: `repeat(${BOARD_W}, 42px)`,
    gridTemplateRows: `repeat(${BOARD_H}, 42px)`,
  };

  return (
    <div className={style.root}>
      <div className={style.header}>
        <div className={style.titleRow}>
          <div className={style.title}>Remote Desktop Cable Fix</div>
          <div className={style.subtitle}>
            Link is down. Rotate the cable tiles to restore network access.
          </div>
        </div>
        <div
          className={`${style.statusPill} ${isSolved ? style.statusOk : ''}`}
          title={isSolved ? 'CONNECTED' : 'DISCONNECTED'}
        >
          {isSolved ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
      </div>

      <div className={style.panel}>
        <div className={style.boardFrame}>
          <div className={style.board} style={boardStyle}>
            {tiles.map((tile, i) => {
              const x = i % BOARD_W;
              const y = Math.floor(i / BOARD_W);
              const isEmpty = tile.type === 'empty';
              const isFixed = !!tile.fixed;
              const isEnergized = energized.has(i);
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className={`${style.tile} ${isEmpty ? style.tileEmpty : ''} ${
                    isFixed ? style.tileFixed : ''
                  }`}
                  disabled={isEmpty || isFixed || isSolved}
                  onClick={() => {
                    if (isEmpty || isFixed || isSolved) return;
                    setAttempts((n) => n + 1);
                    setTiles((current) => {
                      const next = [...current];
                      const cur = next[i]!;
                      next[i] = {
                        ...cur,
                        rotation: (((cur.rotation + 1) % 4) as 0 | 1 | 2 | 3) ?? 0,
                      };
                      return next;
                    });
                  }}
                  aria-label={
                    isEmpty
                      ? 'Empty'
                      : isFixed
                        ? 'Endpoint'
                        : 'Rotate cable tile'
                  }
                  title={
                    isFixed
                      ? x === START.x && y === START.y
                        ? 'Remote host'
                        : 'Corp gateway'
                      : isEmpty
                        ? ''
                        : 'Click to rotate'
                  }
                >
                  <WireGlyph tile={tile} energized={isEnergized} />
                </button>
              );
            })}
          </div>
        </div>

        <div className={style.actions}>
          <div className={style.hintBox}>
            <div>
              <b>Goal:</b> Connect <b>Remote host</b> (left) to <b>Corp gateway</b>{' '}
              (right) with <b>no loose ends</b>.
            </div>
            <div style={{ marginTop: '4px' }}>
              Attempts: <b>{attempts}</b> {hasLeaks && !isSolved ? '| Leak detected' : ''}
            </div>
          </div>

          <div className={style.buttonRow}>
            <button
              type="button"
              className={`${style.btn} ${isSolved ? style.btnDisabled : ''}`}
              disabled={isSolved}
              onClick={() => {
                setAttempts(0);
                setTiles(scrambleRotations(buildSolvedBoard()));
              }}
              title="Scramble rotations"
            >
              Re-roll cables
            </button>
            <button type="button" className={style.btn} onClick={closeWindow}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoteDesktopCableFixApp;

