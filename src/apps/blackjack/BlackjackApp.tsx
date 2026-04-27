import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';
import { useGameState } from '../../game/state';
import { gameEventBus } from '../../game/events';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

type Card = { rank: Rank; suit: Suit; id: string };

type RoundState = 'idle' | 'playerTurn' | 'dealerTurn' | 'done';
type Outcome = 'win' | 'lose' | 'push' | 'blackjack' | null;

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: 'calc(100% - 16px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const tableStyle: JSX.CSSProperties = {
  backgroundColor: '#0c5d2a',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  padding: '10px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const rowStyle: JSX.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const handStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
};

const cardStyle: JSX.CSSProperties = {
  width: '54px',
  height: '72px',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '4px',
  fontFamily: 'monospace',
  userSelect: 'none',
};

const cardBackStyle: JSX.CSSProperties = {
  ...cardStyle,
  backgroundColor: '#0b3d91',
  color: '#ffffff',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'monospace',
};

const actionsStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const smallButtonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '1px 6px',
  fontSize: '12px',
  lineHeight: 1.2,
};

const disabledSmallButtonStyle: JSX.CSSProperties = {
  ...smallButtonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 10px',
};

const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const selectStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '3px 6px',
  fontFamily: 'monospace',
};

const inputStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '1px 4px',
  fontFamily: 'monospace',
  width: '56px',
};

const suits: Suit[] = ['♠', '♥', '♦', '♣'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const isRedSuit = (s: Suit): boolean => s === '♥' || s === '♦';

const buildDeck = (seed: number): Card[] => {
  const deck: Card[] = [];
  let n = seed >>> 0;
  for (let d = 0; d < 6; d += 1) {
    for (const suit of suits) {
      for (const rank of ranks) {
        n = (n * 1664525 + 1013904223) >>> 0;
        deck.push({ rank, suit, id: `${d}-${rank}-${suit}-${n}` });
      }
    }
  }
  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i -= 1) {
    n = (n * 1103515245 + 12345) >>> 0;
    const j = n % (i + 1);
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
};

const cardValue = (rank: Rank): number => {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
  return Number(rank);
};

const scoreHand = (hand: Card[]): number => {
  let total = 0;
  let aces = 0;
  hand.forEach((c) => {
    total += cardValue(c.rank);
    if (c.rank === 'A') aces += 1;
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

const BlackjackApp: FunctionComponent<AppProps> = (_props: AppProps) => {
  const { flags, setFlags } = useGameState();
  const seedRef = useRef<number>(Date.now());
  const deckRef = useRef<Card[]>(buildDeck(seedRef.current));
  const discardRef = useRef<Card[]>([]);
  const hasActiveHandRef = useRef(false);
  const tableAfterBetRef = useRef<number>(0);

  const [roundState, setRoundState] = useState<RoundState>('idle');
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [hideDealerHole, setHideDealerHole] = useState(true);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [message, setMessage] = useState('Click Deal to start.');
  const [handSize, setHandSize] = useState(10);
  const [currentBet, setCurrentBet] = useState<number | null>(null);
  const [depositInput, setDepositInput] = useState('10');
  const [withdrawInput, setWithdrawInput] = useState('10');

  const bank = flags.bankBalance;
  const table = flags.blackjackBalance;

  useEffect(() => {
    const inProgress = roundState === 'playerTurn' || roundState === 'dealerTurn';
    if (inProgress && !hasActiveHandRef.current) {
      hasActiveHandRef.current = true;
      gameEventBus.emit('blackjack:hand_started', { at: Date.now() });
      return;
    }
    if (!inProgress && hasActiveHandRef.current) {
      hasActiveHandRef.current = false;
      gameEventBus.emit('blackjack:hand_finished', { at: Date.now() });
    }
  }, [roundState]);

  useEffect(() => {
    return () => {
      if (hasActiveHandRef.current) {
        hasActiveHandRef.current = false;
        gameEventBus.emit('blackjack:hand_finished', { at: Date.now() });
      }
    };
  }, []);

  const playerScore = useMemo(() => scoreHand(playerHand), [playerHand]);
  const dealerScore = useMemo(
    () => scoreHand(hideDealerHole ? dealerHand.slice(0, 1) : dealerHand),
    [dealerHand, hideDealerHole]
  );

  const deckRemaining = deckRef.current.length;

  const betOptions = useMemo(() => {
    const base = [5, 10, 25, 50, 100];
    const filtered = base.filter((b) => b <= table);
    if (!filtered.includes(handSize) && handSize <= table) filtered.push(handSize);
    return filtered.sort((a, b) => a - b);
  }, [handSize, table]);

  const clampAmount = (value: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
  };

  const depositAmount = useMemo(() => clampAmount(depositInput), [depositInput]);
  const withdrawAmount = useMemo(
    () => clampAmount(withdrawInput),
    [withdrawInput]
  );
  const canDeposit = depositAmount > 0 && depositAmount <= bank;
  const canWithdraw = withdrawAmount > 0 && withdrawAmount <= table;

  const handleDeposit = () => {
    if (!canDeposit) return;
    setFlags({
      bankBalance: bank - depositAmount,
      blackjackBalance: table + depositAmount,
    });
    setMessage(`Deposited $${depositAmount} to table.`);
  };

  const handleWithdraw = () => {
    if (!canWithdraw) return;
    setFlags({
      bankBalance: bank + withdrawAmount,
      blackjackBalance: table - withdrawAmount,
    });
    setMessage(`Withdrew $${withdrawAmount} back to bank.`);
  };

  const drawCard = (): Card => {
    if (deckRef.current.length < 20) {
      discardRef.current = [];
      seedRef.current = (seedRef.current + 1) >>> 0;
      deckRef.current = buildDeck(seedRef.current);
      setMessage('Shuffling new shoe...');
    }
    const card = deckRef.current.pop();
    if (!card) {
      seedRef.current = (seedRef.current + 7) >>> 0;
      deckRef.current = buildDeck(seedRef.current);
      return deckRef.current.pop() as Card;
    }
    return card;
  };

  const resetRound = () => {
    discardRef.current.push(...dealerHand, ...playerHand);
    setDealerHand([]);
    setPlayerHand([]);
    setHideDealerHole(true);
    setOutcome(null);
    setCurrentBet(null);
    setRoundState('idle');
    setMessage('Click Deal to start.');
  };

  const endRound = (
    nextOutcome: Outcome,
    nextMessage: string,
    payoutMultiplier: number
  ) => {
    setOutcome(nextOutcome);
    setRoundState('done');
    setMessage(nextMessage);
    setHideDealerHole(false);

    if (currentBet !== null) {
      const payout = Math.round(currentBet * payoutMultiplier);
      setFlags({ blackjackBalance: tableAfterBetRef.current + payout });
    }
  };

  const auto21Check = (finalDealer: Card[], finalPlayer: Card[]) => {
    const p = scoreHand(finalPlayer);
    const d = scoreHand(finalDealer);
    if (p === 21 && d === 21) return endRound('push', 'Both hit 21. Push.', 1);
    if (p === 21) return endRound('win', '21. You win.', 2);
    if (d === 21) return endRound('lose', 'Dealer hit 21.', 0);
    return null;
  };

  const settle = (finalDealer: Card[], finalPlayer: Card[]) => {
    const auto = auto21Check(finalDealer, finalPlayer);
    if (auto) return auto;

    const p = scoreHand(finalPlayer);
    const d = scoreHand(finalDealer);
    if (p > 21) return endRound('lose', 'Bust. Dealer wins.', 0);
    if (d > 21) return endRound('win', 'Dealer busts. You win.', 2);
    if (p === d) return endRound('push', 'Push.', 1);
    if (p > d) return endRound('win', 'You win.', 2);
    return endRound('lose', 'Dealer wins.', 0);
  };

  const dealerPlay = (startingDealer: Card[], startingPlayer: Card[]) => {
    setRoundState('dealerTurn');
    setHideDealerHole(false);
    setMessage('Dealer plays...');

    let currentDealer = [...startingDealer];
    const step = () => {
      const auto = auto21Check(currentDealer, startingPlayer);
      if (auto) return;

      const d = scoreHand(currentDealer);
      if (d >= 17) {
        setDealerHand(currentDealer);
        settle(currentDealer, startingPlayer);
        return;
      }
      currentDealer = [...currentDealer, drawCard()];
      setDealerHand(currentDealer);
      window.setTimeout(step, 350);
    };

    window.setTimeout(step, 350);
  };

  const handleDeal = () => {
    if (roundState !== 'idle' && roundState !== 'done') return;
    if (table <= 0) {
      setMessage('Deposit money to the table to play.');
      return;
    }
    const bet = Math.max(1, Math.min(handSize, table));
    setCurrentBet(bet);
    tableAfterBetRef.current = table - bet;
    setFlags({ blackjackBalance: table - bet });

    setOutcome(null);
    setMessage('Dealing...');
    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();
    const nextPlayer = [p1, p2];
    const nextDealer = [d1, d2];
    setPlayerHand(nextPlayer);
    setDealerHand(nextDealer);
    setHideDealerHole(true);

    const pScore = scoreHand(nextPlayer);
    const dScore = scoreHand(nextDealer);
    if (pScore === 21 && dScore === 21) {
      endRound('push', 'Both hit 21. Push.', 1);
      return;
    }
    if (pScore === 21) {
      endRound('blackjack', '21. You win.', 2);
      return;
    }
    if (dScore === 21) {
      endRound('lose', 'Dealer hit 21.', 0);
      return;
    }

    setRoundState('playerTurn');
    setMessage('Your move.');
  };

  const handleHit = () => {
    if (roundState !== 'playerTurn') return;
    const next = [...playerHand, drawCard()];
    setPlayerHand(next);
    const s = scoreHand(next);
    if (s === 21) {
      endRound('win', '21. You win.', 2);
      return;
    }
    if (s > 21) endRound('lose', 'Bust. Dealer wins.', 0);
    else setMessage('Hit or Stand?');
  };

  const handleStand = () => {
    if (roundState !== 'playerTurn') return;
    dealerPlay(dealerHand, playerHand);
  };

  const renderCard = (card: Card): JSX.Element => {
    const red = isRedSuit(card.suit);
    return (
      <div key={card.id} style={cardStyle}>
        <div style={{ color: red ? '#a00000' : '#000000' }}>
          {card.rank}
          {card.suit}
        </div>
        <div style={{ textAlign: 'right', color: red ? '#a00000' : '#000000' }}>
          {card.suit}
          {card.rank}
        </div>
      </div>
    );
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700 }}>Blackjack</div>
        <div style={{ fontFamily: 'monospace' }}>
          Bank: ${bank} | Table: ${table}{' '}
          {currentBet !== null ? `| Hand: $${currentBet}` : ''} | Shoe: {deckRemaining}
        </div>
      </div>

      <div style={tableStyle}>
        <div style={rowStyle}>
          <div style={{ color: '#ffffff', fontWeight: 700 }}>
            Dealer {hideDealerHole ? `(showing ${dealerScore})` : `(${scoreHand(dealerHand)})`}
          </div>
          <div style={handStyle}>
            {dealerHand.map((c, idx) => {
              if (idx === 1 && hideDealerHole && roundState !== 'done') {
                return (
                  <div key={c.id} style={cardBackStyle}>
                    ##
                  </div>
                );
              }
              return renderCard(c);
            })}
          </div>
        </div>

        <div style={rowStyle}>
          <div style={{ color: '#ffffff', fontWeight: 700 }}>
            You ({playerScore})
          </div>
          <div style={handStyle}>{playerHand.map(renderCard)}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', minHeight: '18px' }}>{message}</div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>Dep</div>
        <input
          style={inputStyle}
          value={depositInput}
          disabled={roundState !== 'idle' && roundState !== 'done'}
          onInput={(e) =>
            setDepositInput((e.currentTarget as HTMLInputElement).value ?? '')
          }
        />
        <button
          type="button"
          onClick={handleDeposit}
          style={canDeposit ? smallButtonStyle : disabledSmallButtonStyle}
          disabled={!canDeposit || (roundState !== 'idle' && roundState !== 'done')}
        >
          Deposit
        </button>

        <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>W/D</div>
        <input
          style={inputStyle}
          value={withdrawInput}
          disabled={roundState !== 'idle' && roundState !== 'done'}
          onInput={(e) =>
            setWithdrawInput((e.currentTarget as HTMLInputElement).value ?? '')
          }
        />
        <button
          type="button"
          onClick={handleWithdraw}
          style={canWithdraw ? smallButtonStyle : disabledSmallButtonStyle}
          disabled={
            !canWithdraw || (roundState !== 'idle' && roundState !== 'done')
          }
        >
          Withdraw
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'monospace' }}>Hand size:</span>
          <select
            style={selectStyle}
            value={handSize}
            disabled={roundState !== 'idle' && roundState !== 'done'}
            onChange={(e) => setHandSize(Number((e.currentTarget as HTMLSelectElement).value))}
          >
            {betOptions.map((b) => (
              <option key={b} value={b}>
                ${b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={actionsStyle}>
        <button
          onClick={handleDeal}
          style={
            roundState === 'idle' || roundState === 'done'
              ? buttonStyle
              : disabledButtonStyle
          }
          disabled={!(roundState === 'idle' || roundState === 'done') || table <= 0}
          type="button"
        >
          Deal
        </button>
        <button
          onClick={handleHit}
          style={roundState === 'playerTurn' ? buttonStyle : disabledButtonStyle}
          disabled={roundState !== 'playerTurn'}
          type="button"
        >
          Hit
        </button>
        <button
          onClick={handleStand}
          style={roundState === 'playerTurn' ? buttonStyle : disabledButtonStyle}
          disabled={roundState !== 'playerTurn'}
          type="button"
        >
          Stand
        </button>
        <button
          onClick={resetRound}
          style={
            roundState !== 'dealerTurn' ? buttonStyle : disabledButtonStyle
          }
          disabled={roundState === 'dealerTurn'}
          type="button"
        >
          New Round
        </button>
      </div>

      {outcome && (
        <div style={{ textAlign: 'center', fontFamily: 'monospace' }}>
          Outcome: {outcome.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default BlackjackApp;

