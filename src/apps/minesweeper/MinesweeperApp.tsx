import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

const WIDTH = 9;
const HEIGHT = 9;
const MINES = 10;

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  height: 'calc(100% - 16px)',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const statusRowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '8px 10px',
  fontFamily: 'monospace',
};

const resetButtonStyle: JSX.CSSProperties = {
  border: 'none',
  background:
    'radial-gradient(circle at 35% 35%, #fff2ad 0 25%, #ffd84f 26% 100%)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  minWidth: '38px',
  height: '28px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: 'monospace',
  fontWeight: 700,
  borderRadius: '4px',
};

const boardStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(${WIDTH}, 1fr)`,
  gap: '2px',
  backgroundColor: 'var(--button-shadow)',
  padding: '2px',
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

  const getStatusFace = () => {
    if (status === 'won') return 'B-)';
    if (status === 'lost') return 'X-(';
    return ':-)';
  };

  const getCellStyle = (cell: Cell): JSX.CSSProperties => {
    const isRevealed = cell.isRevealed || (status === 'lost' && cell.isMine);
    return {
      width: '100%',
      aspectRatio: '1 / 1',
      border: 'none',
      fontWeight: 700,
      fontFamily: 'var(--font-family-sys)',
      cursor: isRevealed ? 'default' : 'pointer',
      backgroundColor: isRevealed ? '#d6d6d6' : 'var(--surface)',
      boxShadow: isRevealed
        ? 'inset 1px 1px 0 #a0a0a0'
        : 'var(--border-raised-outer), var(--border-raised-inner)',
      color:
        cell.adjacentMines === 1
          ? '#0000ff'
          : cell.adjacentMines === 2
          ? '#007b00'
          : cell.adjacentMines === 3
          ? '#cc0000'
          : cell.adjacentMines >= 4
          ? '#1b1b8a'
          : '#000000',
    };
  };

  return (
    <div style={panelStyle}>
      <div style={statusRowStyle}>
        <div>Mines: {Math.max(0, MINES - flaggedCount)}</div>
        <button onClick={reset} style={resetButtonStyle} type="button">
          {getStatusFace()}
        </button>
        <div>Time: {elapsedSeconds}s</div>
      </div>

      <div style={boardStyle}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const showMine = cell.isRevealed && cell.isMine;
            const showNumber = cell.isRevealed && !cell.isMine && cell.adjacentMines > 0;
            const content = cell.isFlagged
              ? '🚩'
              : showMine
              ? '💣'
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

      <div
        style={{
          backgroundColor: '#ffffff',
          boxShadow: 'var(--border-field)',
          padding: '8px',
          fontSize: '12px',
        }}
      >
        Left click to reveal. Right click to place a flag.
      </div>
    </div>
  );
};

export default MinesweeperApp;
