import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { AppProps } from '@/types/App';
import MenuBar from '@/components/shared/MenuBar/MenuBar';
import StatusBar from '@/components/shared/StatusBar/StatusBar';
import WindowContent from '@/components/shared/WindowContent/WindowContent';

import style from './RemoteDesktopCableFixApp.module.css';

type Dir = 'N' | 'E' | 'S' | 'W';
type TileType = 'empty' | 'straight' | 'elbow' | 'tee' | 'cross' | 'end';

type TileDef = {
  type: TileType;
  rotation: 0 | 1 | 2 | 3;
  fixed?: boolean;
};
type Coord = { x: number; y: number };

const COMPLETED_EVENT_ID = 'remote_cable_fix:completed';

const BOARD_W = 10;
const BOARD_H = 10;
const MIN_WRONG_ROTATIONS = 34;
const SCRAMBLE_ATTEMPTS = 123;
const TILE_SIZE = 36;

const START = { x: 0, y: 5 };
const END = { x: BOARD_W - 1, y: 5 };

const rotateDir = (dir: Dir, steps: number): Dir => {
  const order: Dir[] = ['N', 'E', 'S', 'W'];
  const idx = order.indexOf(dir);
  // (idx + steps + 4) % 4 is always in [0,3], so order[i] is always defined.
  return order[(idx + steps + 4) % 4] as Dir;
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

const sameConnections = (a: Set<Dir>, b: Set<Dir>): boolean => {
  if (a.size !== b.size) return false;
  for (const dir of a) {
    if (!b.has(dir)) return false;
  }
  return true;
};

const rotationForConnections = (
  type: Exclude<TileType, 'empty'>,
  dirs: Set<Dir>
): 0 | 1 | 2 | 3 => {
  for (let rotation = 0 as 0 | 1 | 2 | 3; rotation < 4; rotation += 1) {
    const con = connectionsFor({ type, rotation });
    if (sameConnections(con, dirs)) return rotation;
  }
  return 0;
};

const tileFromConnections = (dirs: Set<Dir>, fixed = false): TileDef => {
  if (dirs.size === 1) {
    return {
      type: 'end',
      rotation: rotationForConnections('end', dirs),
      fixed,
    };
  }
  if (dirs.size === 2) {
    const hasOppositePair =
      (dirs.has('N') && dirs.has('S')) || (dirs.has('E') && dirs.has('W'));
    const type: TileType = hasOppositePair ? 'straight' : 'elbow';
    return {
      type,
      rotation: rotationForConnections(type, dirs),
      fixed,
    };
  }
  if (dirs.size === 3) {
    return {
      type: 'tee',
      rotation: rotationForConnections('tee', dirs),
      fixed,
    };
  }
  return {
    type: 'cross',
    rotation: 0,
    fixed,
  };
};

const dirBetween = (a: Coord, b: Coord): Dir => {
  if (b.x === a.x + 1 && b.y === a.y) return 'E';
  if (b.x === a.x - 1 && b.y === a.y) return 'W';
  if (b.x === a.x && b.y === a.y + 1) return 'S';
  return 'N';
};

const buildSolvedBoard = (): TileDef[] => {
  const empty = (): TileDef => ({ type: 'empty', rotation: 0 });
  const board: TileDef[] = Array.from({ length: BOARD_W * BOARD_H }, empty);

  const at = (x: number, y: number) => y * BOARD_W + x;
  const connections = new Map<number, Set<Dir>>();
  const addConnection = (from: Coord, to: Coord) => {
    const fromKey = at(from.x, from.y);
    const toKey = at(to.x, to.y);
    const fromSet = connections.get(fromKey) ?? new Set<Dir>();
    const toSet = connections.get(toKey) ?? new Set<Dir>();
    fromSet.add(dirBetween(from, to));
    toSet.add(dirBetween(to, from));
    connections.set(fromKey, fromSet);
    connections.set(toKey, toSet);
  };

  const addPath = (points: Coord[]) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i];
      const to = points[i + 1];
      if (!from || !to) continue;
      addConnection(from, to);
    }
  };

  // One single winding route from host to gateway (no alternate branches).
  addPath([
    { x: 0, y: 5 },
    { x: 0, y: 6 },
    { x: 0, y: 7 },
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
    { x: 6, y: 7 },
    { x: 7, y: 7 },
    { x: 8, y: 7 },
    { x: 8, y: 6 },
    { x: 8, y: 5 },
    { x: 8, y: 4 },
    { x: 7, y: 4 },
    { x: 6, y: 4 },
    { x: 5, y: 4 },
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 2, y: 4 },
    { x: 1, y: 4 },
    { x: 1, y: 3 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 4, y: 2 },
    { x: 5, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 2 },
    { x: 8, y: 2 },
    { x: 8, y: 1 },
    { x: 7, y: 1 },
    { x: 6, y: 1 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
    { x: 8, y: 0 },
    { x: 9, y: 0 },
    { x: 9, y: 1 },
    { x: 9, y: 2 },
    { x: 9, y: 3 },
    { x: 9, y: 4 },
    { x: 9, y: 5 },
  ]);

  connections.forEach((dirs, index) => {
    const x = index % BOARD_W;
    const y = Math.floor(index / BOARD_W);
    const isFixed =
      (x === START.x && y === START.y) || (x === END.x && y === END.y);
    board[index] = tileFromConnections(dirs, isFixed);
  });

  return board;
};

const scrambleRotations = (tiles: TileDef[]): TileDef[] => {
  return tiles.map((t) => {
    if (t.type === 'empty' || t.fixed) return t;
    const nextRotation = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
    return { ...t, rotation: nextRotation };
  });
};

const computeNetworkState = (
  tiles: TileDef[]
): { isConnected: boolean; hasLeaks: boolean; energized: Set<number> } => {
  const energized = new Set<number>();

  const idx = (x: number, y: number) => y * BOARD_W + x;
  const tileAt = (x: number, y: number): TileDef => {
    const tile = tiles[idx(x, y)];
    if (!tile) {
      throw new Error(`No tile at (${x}, ${y})`);
    }
    return tile;
  };

  // Traverse from START.
  const q: Array<{ x: number; y: number }> = [{ x: START.x, y: START.y }];
  energized.add(idx(START.x, START.y));
  while (q.length) {
    const cur = q.shift();
    if (!cur) break;
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

const buildChallengingScramble = (): TileDef[] => {
  const solved = buildSolvedBoard();
  const mutableTiles = solved.filter(
    (tile) => tile.type !== 'empty' && !tile.fixed
  ).length;
  const requiredWrongRotations = Math.min(MIN_WRONG_ROTATIONS, mutableTiles);
  let fallback = scrambleRotations(solved);

  for (let attempt = 0; attempt < SCRAMBLE_ATTEMPTS; attempt += 1) {
    const candidate = scrambleRotations(solved);
    const wrongRotations = candidate.reduce((count, tile, index) => {
      const solvedTile = solved[index];
      if (!solvedTile) return count;
      if (tile.type === 'empty' || tile.fixed) return count;
      return tile.rotation === solvedTile.rotation ? count : count + 1;
    }, 0);

    const { isConnected, hasLeaks } = computeNetworkState(candidate);
    if (
      wrongRotations >= requiredWrongRotations &&
      (!isConnected || hasLeaks)
    ) {
      return candidate;
    }
    fallback = candidate;
  }

  return fallback;
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
      {con.has('N') && <div className={`${style.wireN} ${wireClass}`} />}
      {con.has('S') && <div className={`${style.wireS} ${wireClass}`} />}
      {con.has('W') && <div className={`${style.wireW} ${wireClass}`} />}
      {con.has('E') && <div className={`${style.wireE} ${wireClass}`} />}
    </div>
  );
};

const RemoteDesktopCableFixApp: FunctionComponent<AppProps> = ({
  closeWindow,
}) => {
  const { hasEventFired, markEventFired } = useGameState();

  const [tiles, setTiles] = useState<TileDef[]>(() =>
    buildChallengingScramble()
  );
  const [attempts, setAttempts] = useState(0);
  const [hasSubmittedConnection, setHasSubmittedConnection] = useState(false);

  const { isConnected, hasLeaks, energized } = useMemo(
    () => computeNetworkState(tiles),
    [tiles]
  );
  const isRouteReady = isConnected && !hasLeaks;
  const isSolved = hasSubmittedConnection;

  useEffect(() => {
    if (!hasSubmittedConnection) return;
    if (hasEventFired(COMPLETED_EVENT_ID)) return;

    markEventFired(COMPLETED_EVENT_ID);
    gameEventBus.emit('email:delivered', {
      emailId: 'corp-password-reset-link',
    });

    const timer = window.setTimeout(() => {
      closeWindow();
    }, 850);
    return () => window.clearTimeout(timer);
  }, [closeWindow, hasEventFired, hasSubmittedConnection, markEventFired]);

  const boardStyle: JSX.CSSProperties = {
    gridTemplateColumns: `repeat(${BOARD_W}, ${TILE_SIZE}px)`,
    gridTemplateRows: `repeat(${BOARD_H}, ${TILE_SIZE}px)`,
  };

  const body = (
    <div className={style.root}>
      <div className={style.header}>
        <div className={style.titleRow}>
          <div className={style.title}>Remote Desktop Repair Utility</div>
          <div className={style.subtitle}>
            Extraction paused: remote session lost network link.
          </div>
        </div>
        <div
          className={`${style.statusPill} ${isSolved ? style.statusOk : ''} ${
            !isSolved && !isRouteReady ? style.statusDisconnected : ''
          }`}
          title={
            isSolved ? 'CONNECTED' : isRouteReady ? 'READY TO CONNECT' : 'DISCONNECTED'
          }
        >
          {isSolved ? 'CONNECTED' : isRouteReady ? 'READY TO CONNECT' : 'DISCONNECTED'}
        </div>
      </div>

      <div className={style.panel}>
        <div className={style.connectionBar}>
          <div
            className={`${style.connectionBarFill} ${isSolved ? style.connectionBarFillOn : ''}`}
          />
          <div className={style.connectionBarLabel}>
            {isSolved
              ? 'LINK ESTABLISHED'
              : isRouteReady
              ? 'PATH READY - PRESS CONNECT LINK'
              : 'LINK OFFLINE'}
          </div>
        </div>
        <div className={style.alertBox}>
          <div className={style.alertTitle}>Why this popped up</div>
          <div className={style.alertBody}>
            IT remote handoff failed. Restore one complete cable route from host
            to gateway to resume extraction.
          </div>
        </div>
        <div className={style.boardFrame}>
          <div className={style.legendRow}>
            <span className={style.legendItem}>
              <span className={style.legendDotLeft} /> Remote Host
            </span>
            <span className={style.legendItem}>
              <span className={style.legendDotRight} /> Corp Gateway
            </span>
          </div>
          <div className={style.board} style={boardStyle}>
            {tiles.map((tile, i) => {
              const x = i % BOARD_W;
              const y = Math.floor(i / BOARD_W);
              const isEmpty = tile.type === 'empty';
              const isFixed = !!tile.fixed;
              const isStart = isFixed && x === START.x && y === START.y;
              const isEnd = isFixed && x === END.x && y === END.y;
              const isEnergized = energized.has(i);
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  className={`${style.tile} ${isEmpty ? style.tileEmpty : ''} ${
                    isFixed ? style.tileFixed : ''
                  } ${isStart ? style.tileStart : ''} ${
                    isEnd ? style.tileEnd : ''
                  } ${isEnd && !isEnergized ? style.tileEndPending : ''} ${
                    isEnd && isEnergized ? style.tileEndConnected : ''
                  } ${isEnergized ? style.tileEnergized : ''}`}
                  disabled={isEmpty || isFixed || isSolved}
                  onClick={() => {
                    if (isEmpty || isFixed || isSolved) return;
                    setAttempts((n) => n + 1);
                    setTiles((current) => {
                      const next = [...current];
                      const cur = next[i];
                      if (!cur) return current;
                      next[i] = {
                        ...cur,
                        rotation: ((cur.rotation + 1) % 4) as 0 | 1 | 2 | 3,
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
            <div
              className={`${style.objectiveLine} ${
                isSolved ? style.objectiveDone : style.objectivePending
              }`}
            >
              <b>END GOAL:</b> Connect <b>Host</b> to <b>Gateway</b>. Press{' '}
              <b>Connect Link</b>.
            </div>
            <div className={style.hintSubline}>
              Attempts: <b>{attempts}</b>{' '}
              {hasLeaks && !isRouteReady ? '| Leak detected' : ''}
            </div>
          </div>

          <div className={style.buttonRow}>
            <button
              type="button"
              className={`${style.btn} ${!isRouteReady || isSolved ? style.btnDisabled : ''}`}
              disabled={!isRouteReady || isSolved}
              onClick={() => {
                if (!isRouteReady || isSolved) return;
                setHasSubmittedConnection(true);
              }}
              title="Submit network connection"
            >
              Connect Link
            </button>
            <button
              type="button"
              className={`${style.btn} ${isSolved ? style.btnDisabled : ''}`}
              disabled={isSolved}
              onClick={() => {
                setAttempts(0);
                setHasSubmittedConnection(false);
                setTiles(buildChallengingScramble());
              }}
              title="Scramble rotations"
            >
              Reset Board
            </button>
            <button type="button" className={style.btn} onClick={closeWindow}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <WindowContent
      menu={<MenuBar options={['File', 'Connection', 'Tools', 'Help']} />}
      body={body}
      footer={
        <StatusBar
          textLeft={
            isSolved
              ? 'Connection restored. Returning to extraction...'
              : isRouteReady
              ? 'Path is complete. Press Connect Link to continue.'
              : 'Resolve cable path to continue WinRAR extraction.'
          }
          textRight={isSolved ? 'Status: CONNECTED' : 'Status: DISCONNECTED'}
        />
      }
    />
  );
};

export default RemoteDesktopCableFixApp;
