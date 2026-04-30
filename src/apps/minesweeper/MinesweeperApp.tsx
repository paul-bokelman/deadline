import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
type FaceMood = 'normal' | 'dead' | 'cool';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

const WIDTH = 9;
const HEIGHT = 9;
const MINES = 10;
const CELL_SIZE_PX = 26;

const appStyle: JSX.CSSProperties = {
  height: '100%',
  padding: '10px',
  backgroundColor: '#c0c0c0',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
};

const frameStyle: JSX.CSSProperties = {
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '8px',
  backgroundColor: '#c0c0c0',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const statusRowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  backgroundColor: '#c0c0c0',
  padding: '6px',
};

const digitStyle: JSX.CSSProperties = {
  width: '54px',
  height: '34px',
  backgroundColor: '#000000',
  color: '#ff2d2d',
  fontFamily: '"Courier New", monospace',
  fontSize: '30px',
  lineHeight: '34px',
  textAlign: 'center',
  letterSpacing: '1px',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  userSelect: 'none',
};

const smileyButtonStyle: JSX.CSSProperties = {
  width: '34px',
  height: '34px',
  border: 'none',
  backgroundColor: '#c0c0c0',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  padding: 0,
};

const boardStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${WIDTH}, ${CELL_SIZE_PX}px)`,
  gridTemplateRows: `repeat(${HEIGHT}, ${CELL_SIZE_PX}px)`,
  justifyContent: 'center',
  alignContent: 'start',
  backgroundColor: '#bdbdbd',
  padding: '4px',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
};

const createEmptyBoard = (): Cell[][] =>
  Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

const forEachNeighbor = (
  row: number,
  col: number,
  callback: (nextRow: number, nextCol: number) => void
) => {
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow < 0 || nextRow >= HEIGHT || nextCol < 0 || nextCol >= WIDTH) {
        continue;
      }
      callback(nextRow, nextCol);
    }
  }
};

const plantMinesAndCountAdjacencies = (
  baseBoard: Cell[][],
  safeRow: number,
  safeCol: number
): Cell[][] => {
  const board = baseBoard.map((row) => row.map((cell) => ({ ...cell })));
  const allPositions = Array.from({ length: WIDTH * HEIGHT }, (_, index) => ({
    row: Math.floor(index / WIDTH),
    col: index % WIDTH,
  })).filter((position) => {
    return !(position.row === safeRow && position.col === safeCol);
  });

  for (let i = allPositions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = allPositions[i];
    allPositions[i] = allPositions[j];
    allPositions[j] = tmp;
  }

  allPositions.slice(0, MINES).forEach(({ row, col }) => {
    board[row][col].isMine = true;
  });

  for (let row = 0; row < HEIGHT; row += 1) {
    for (let col = 0; col < WIDTH; col += 1) {
      if (board[row][col].isMine) continue;
      let mineCount = 0;
      forEachNeighbor(row, col, (nextRow, nextCol) => {
        if (board[nextRow][nextCol].isMine) mineCount += 1;
      });
      board[row][col].adjacentMines = mineCount;
    }
  }

  return board;
};

const revealConnectedCells = (board: Cell[][], startRow: number, startCol: number) => {
  const queue: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    const key = `${next.row}:${next.col}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = board[next.row][next.col];
    if (cell.isFlagged || cell.isRevealed) continue;
    cell.isRevealed = true;

    if (cell.adjacentMines !== 0 || cell.isMine) continue;

    forEachNeighbor(next.row, next.col, (neighborRow, neighborCol) => {
      const neighbor = board[neighborRow][neighborCol];
      if (!neighbor.isRevealed && !neighbor.isFlagged) {
        queue.push({ row: neighborRow, col: neighborCol });
      }
    });
  }
};

const revealAllMines = (board: Cell[][]): Cell[][] =>
  board.map((row) =>
    row.map((cell) =>
      cell.isMine
        ? {
            ...cell,
            isRevealed: true,
          }
        : cell
    )
  );

const hasPlayerWon = (board: Cell[][]): boolean =>
  board.every((row) =>
    row.every((cell) => (cell.isMine ? true : cell.isRevealed))
  );

const MinesweeperApp: FunctionComponent<AppProps> = () => {
  const [board, setBoard] = useState<Cell[][]>(createEmptyBoard);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (status !== 'playing') return undefined;
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [status]);

  const flaggedCount = useMemo(
    () =>
      board.reduce(
        (total, row) =>
          total + row.reduce((rowTotal, cell) => rowTotal + (cell.isFlagged ? 1 : 0), 0),
        0
      ),
    [board]
  );
  const minesLeft = MINES - flaggedCount;

  const reset = () => {
    setBoard(createEmptyBoard());
    setStatus('idle');
    setElapsedSeconds(0);
  };

  const revealCell = (row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;
    const currentCell = board[row][col];
    if (currentCell.isFlagged || currentCell.isRevealed) return;

    const nextBoard =
      status === 'idle'
        ? plantMinesAndCountAdjacencies(board, row, col)
        : board.map((boardRow) => boardRow.map((cell) => ({ ...cell })));

    if (status === 'idle') {
      setStatus('playing');
    }

    const nextCell = nextBoard[row][col];
    if (nextCell.isMine) {
      nextCell.isRevealed = true;
      setBoard(revealAllMines(nextBoard));
      setStatus('lost');
      return;
    }

    revealConnectedCells(nextBoard, row, col);

    if (hasPlayerWon(nextBoard)) {
      setBoard(nextBoard);
      setStatus('won');
      return;
    }

    setBoard(nextBoard);
  };

  const toggleFlag = (row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;
    const cell = board[row][col];
    if (cell.isRevealed) return;

    const nextBoard = board.map((boardRow) => boardRow.map((nextCell) => ({ ...nextCell })));
    nextBoard[row][col].isFlagged = !nextBoard[row][col].isFlagged;
    setBoard(nextBoard);
  };

  const getStatusFace = (): FaceMood => {
    if (status === 'won') return 'cool';
    if (status === 'lost') return 'dead';
    return 'normal';
  };

  const renderFace = (mood: FaceMood): JSX.Element => {
    const eyeStyle = { fill: '#000000' };
    return (
      <svg
        aria-hidden
        height="22"
        shapeRendering="crispEdges"
        style={{ imageRendering: 'pixelated' }}
        viewBox="0 0 22 22"
        width="22"
      >
        <rect fill="#000000" height="22" width="22" x="0" y="0" />
        <rect fill="#ffff00" height="20" width="20" x="1" y="1" />
        <rect fill="#f5cb00" height="18" width="18" x="2" y="2" />
        <rect fill="#ffff33" height="14" width="14" x="4" y="4" />

        {mood === 'dead' ? (
          <>
            <rect {...eyeStyle} height="1" width="3" x="5" y="7" />
            <rect {...eyeStyle} height="1" width="3" x="14" y="7" />
            <rect {...eyeStyle} height="1" width="1" x="6" y="6" />
            <rect {...eyeStyle} height="1" width="1" x="6" y="8" />
            <rect {...eyeStyle} height="1" width="1" x="15" y="6" />
            <rect {...eyeStyle} height="1" width="1" x="15" y="8" />
            <rect fill="#000000" height="1" width="8" x="7" y="14" />
          </>
        ) : (
          <>
            <rect {...eyeStyle} height="3" width="3" x="6" y="7" />
            <rect {...eyeStyle} height="3" width="3" x="13" y="7" />
            <rect fill="#000000" height="1" width="10" x="6" y="14" />
            <rect fill="#000000" height="1" width="1" x="6" y="13" />
            <rect fill="#000000" height="1" width="1" x="15" y="13" />
            {mood === 'cool' && (
              <>
                <rect fill="#000000" height="3" width="5" x="4" y="6" />
                <rect fill="#000000" height="3" width="5" x="13" y="6" />
                <rect fill="#000000" height="1" width="4" x="9" y="7" />
              </>
            )}
          </>
        )}
      </svg>
    );
  };

  const formatDisplayNumber = (value: number): string => {
    const clamped = Math.max(-99, Math.min(999, value));
    const abs = Math.abs(clamped);
    const padded = String(abs).padStart(3, '0');
    return clamped < 0 ? `-${String(abs).padStart(2, '0')}` : padded;
  };

  const getCellNumberColor = (value: number): string => {
    if (value === 1) return '#0000ff';
    if (value === 2) return '#007b00';
    if (value === 3) return '#ff0000';
    if (value === 4) return '#000080';
    if (value === 5) return '#800000';
    if (value === 6) return '#008080';
    if (value === 7) return '#000000';
    return '#808080';
  };

  const getCellStyle = (cell: Cell): JSX.CSSProperties => {
    const isRevealed = cell.isRevealed || (status === 'lost' && cell.isMine);
    return {
      width: `${CELL_SIZE_PX}px`,
      height: `${CELL_SIZE_PX}px`,
      border: 'none',
      fontWeight: 700,
      fontFamily: '"Tahoma", "MS Sans Serif", var(--font-family-ui)',
      fontSize: '18px',
      lineHeight: 1,
      cursor: isRevealed ? 'default' : 'pointer',
      backgroundColor: isRevealed ? '#c0c0c0' : '#c0c0c0',
      boxShadow: isRevealed
        ? 'inset 1px 1px 0 #8d8d8d'
        : 'var(--border-raised-outer), var(--border-raised-inner)',
      color: getCellNumberColor(cell.adjacentMines),
      padding: 0,
      display: 'grid',
      placeItems: 'center',
    };
  };

  return (
    <div style={appStyle}>
      <div style={frameStyle}>
        <div style={statusRowStyle}>
          <div style={digitStyle}>{formatDisplayNumber(minesLeft)}</div>
          <button
            onClick={reset}
            style={smileyButtonStyle}
            title="New Game"
            type="button"
          >
            {renderFace(getStatusFace())}
          </button>
          <div style={digitStyle}>{formatDisplayNumber(elapsedSeconds)}</div>
        </div>

        <div style={boardStyle}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const showMine = cell.isRevealed && cell.isMine;
              const showNumber =
                cell.isRevealed && !cell.isMine && cell.adjacentMines > 0;
              const content = cell.isFlagged
                ? '⚑'
                : showMine
                ? '✹'
                : showNumber
                ? String(cell.adjacentMines)
                : '';

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    toggleFlag(rowIndex, colIndex);
                  }}
                  style={getCellStyle(cell)}
                  type="button"
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MinesweeperApp;
