import { h, FunctionComponent } from 'preact';

import { AppProps } from '../../types/App';
import { useGameState } from '../../game/state';
import {
  getLeaderboardViewModel,
  LeaderboardEntry,
} from '../../system/leaderboard/runtime';
import starBadgeUrl from '../../assets/img/leaderboard/star_badge_32.png';
import style from './LeaderboardApp.module.css';

const formatTime = (ms: number): string => {
  const total = Math.floor(ms / 10);
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  const pad = (n: number, d = 2): string => String(n).padStart(d, '0');
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
};

const getInitial = (name: string): string => {
  const cleaned = name.replace(/[^A-Z0-9]/g, '');
  return cleaned[0] || '?';
};

interface PodiumProps {
  entry?: LeaderboardEntry;
  rank: 1 | 2 | 3;
  height: number;
}

const PodiumColumn: FunctionComponent<PodiumProps> = ({
  entry,
  rank,
  height,
}: PodiumProps) => {
  const medalClass =
    rank === 1
      ? style.medalGold
      : rank === 2
      ? style.medalSilver
      : style.medalBronze;
  const rankClass =
    rank === 1
      ? style.rankGold
      : rank === 2
      ? style.rankSilver
      : style.rankBronze;

  return (
    <div className={style.podiumCol}>
      <div className={style.podiumAvatar}>
        <span>{entry ? getInitial(entry.name) : '?'}</span>
        <span className={`${style.podiumMedal} ${medalClass}`}>{rank}</span>
      </div>
      <div className={style.podiumName}>{entry ? entry.name : '—'}</div>
      <div className={style.podiumTime}>
        {entry ? formatTime(entry.ms) : '--:--.--'}
      </div>
      <div className={style.podiumBlock} style={{ height: `${height}px` }}>
        <span className={`${style.podiumRank} ${rankClass}`}>{rank}</span>
      </div>
    </div>
  );
};

const LeaderboardApp: FunctionComponent<AppProps> = () => {
  const { rebootGame } = useGameState();
  const { board, youIndex } = getLeaderboardViewModel();

  const youEntry = youIndex >= 0 ? board[youIndex] : null;
  const top = board.slice(0, 3);

  return (
    <div className={style.app}>
      <div className={style.hero}>
        <img className={style.heroBadge} src={starBadgeUrl} alt="" />
        <div>
          <div className={style.heroTitle}>GAME OVER</div>
          <div className={style.heroSub}>
            {youEntry
              ? `You placed #${youIndex + 1} of ${
                  board.length
                }. Time: ${formatTime(youEntry.ms)}`
              : `No submitted run yet. ${board.length} entries loaded.`}
          </div>
        </div>
      </div>

      <div className={style.podiumStage}>
        <PodiumColumn entry={top[1]} rank={2} height={62} />
        <PodiumColumn entry={top[0]} rank={1} height={92} />
        <PodiumColumn entry={top[2]} rank={3} height={42} />
      </div>

      <div className={style.tableWrap}>
        <div className={style.tableTitle}>All players</div>
        <div className={style.tableInset}>
          <div className={style.list}>
            <table>
              <colgroup>
                <col style={{ width: '34px' }} />
                <col />
                <col style={{ width: '90px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th style={{ textAlign: 'right' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {board.map((entry, idx) => (
                  <tr
                    key={`${entry.name}-${entry.ms}-${idx}`}
                    className={idx === youIndex ? style.rowYou : ''}
                  >
                    <td className={style.rankCell}>{idx + 1}</td>
                    <td>
                      {entry.name}
                      {idx === youIndex ? ' ◀ YOU' : ''}
                    </td>
                    <td className={style.timeCell}>{formatTime(entry.ms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={style.actions}>
        <div />
        <button
          className={`${style.btn} ${style.btnDefault}`}
          onClick={rebootGame}
          type="button"
        >
          <u>R</u>eboot
        </button>
      </div>

      <div className={style.statusBar}>
        <span className={style.statusCellLeft}>
          {board.length} entries · sorted by time (asc.)
        </span>
        <span className={style.statusCellRight}>Local Scores</span>
      </div>
    </div>
  );
};

export default LeaderboardApp;
