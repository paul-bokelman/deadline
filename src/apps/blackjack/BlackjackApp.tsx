/**
 * BlackJack 96 — port of the design at /Users/pab/Downloads/designs/blackjack.jsx
 * into the deadline OS shell.
 *
 * The native <Window> chrome (titlebar, surface frame, resize handle) is
 * provided by the OS — this component only fills the windowMain body.
 *
 * Bankroll is sourced from the shared `flags.bankBalance` (the wallet) so
 * blackjack losses drain the same pot used by AntiVirus / WinRAR / etc.
 * The bailout / reboot system in src/game/state.tsx handles bankruptcy.
 */

import { h, Fragment, FunctionComponent, JSX } from 'preact';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'preact/hooks';

import MenuBar from '@/components/shared/MenuBar/MenuBar';
import StatusBar from '@/components/shared/StatusBar/StatusBar';
import { AppProps } from '@/types/App';
import { useGameState } from '@/game/state';
import { gameEventBus } from '@/game/events';
import {
  playBlackjackChipsInSfx,
  playBlackjackDealCardSfx,
  playBlackjackLoseSfx,
  playBlackjackWinSfx,
} from '@/utils/audio/blackjackSfx';

import chipRedUrl from '@/assets/images/blackjack/chip_red.png';
import chipBlueUrl from '@/assets/images/blackjack/chip_blue.png';
import chipGoldUrl from '@/assets/images/blackjack/chip_gold.png';

import style from './BlackjackApp.module.css';

// ─── Card model ───────────────────────────────────────────────────
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
type CardModel = { rank: Rank; suit: Suit };

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];
const SUIT_COLOR: Record<Suit, 'red' | 'black'> = {
  '♠': 'black',
  '♣': 'black',
  '♥': 'red',
  '♦': 'red',
};

const DECK_COUNT = 4; // 4 decks → 208 cards, matches the design's status strip

const buildShoe = (): CardModel[] => {
  const shoe: CardModel[] = [];
  for (let d = 0; d < DECK_COUNT; d += 1) {
    for (const s of SUITS) {
      for (const r of RANKS) shoe.push({ rank: r, suit: s });
    }
  }
  // Fisher–Yates
  for (let i = shoe.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
};

const handValue = (hand: CardModel[]): number => {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') {
      total += 11;
      aces += 1;
    } else if (c.rank === 'J' || c.rank === 'Q' || c.rank === 'K') {
      total += 10;
    } else {
      total += parseInt(c.rank, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
};

const isBlackjack = (h: CardModel[]): boolean =>
  h.length === 2 && handValue(h) === 21;

const formatMoney = (n: number): string =>
  '$' + Math.round(n).toLocaleString('en-US');

/** Round to nearest $5, floored at $5 (matches design's niceBet). */
const niceBet = (n: number): number => Math.max(5, Math.round(n / 5) * 5);

// ─── Phase model ──────────────────────────────────────────────────
type Phase = 'betting' | 'playing' | 'dealer' | 'settled';
type Outcome = 'win' | 'lose' | 'push' | 'bj' | null;

// ─── Sub-components ───────────────────────────────────────────────
interface CardProps {
  card?: CardModel;
  hidden?: boolean;
}

const Card: FunctionComponent<CardProps> = ({ card, hidden }: CardProps) => {
  if (hidden || !card) {
    return <div className={style.cardBack} />;
  }
  const colorClass =
    SUIT_COLOR[card.suit] === 'red' ? style.cardRed : style.cardBlack;
  return (
    <div className={`${style.card} ${colorClass}`}>
      <div className={style.cardCornerTop}>
        <div className={style.cardRank}>{card.rank}</div>
        <div className={style.cardSuitCorner}>{card.suit}</div>
      </div>
      <div className={style.cardPipBig}>{card.suit}</div>
      <div className={style.cardCornerBottom}>
        <div className={style.cardRank}>{card.rank}</div>
        <div className={style.cardSuitCorner}>{card.suit}</div>
      </div>
    </div>
  );
};

interface HandProps {
  cards: CardModel[];
  hideHole: boolean;
  score: number | null;
  scoreState: 'bust' | 'bj' | '';
  label: string;
}

const Hand: FunctionComponent<HandProps> = ({
  cards,
  hideHole,
  score,
  scoreState,
  label,
}: HandProps) => {
  const bubbleClass =
    scoreState === 'bust'
      ? `${style.scoreBubble} ${style.scoreBubbleBust}`
      : scoreState === 'bj'
      ? `${style.scoreBubble} ${style.scoreBubbleBj}`
      : style.scoreBubble;
  return (
    <div>
      <div className={style.handLabelRow}>
        <span className={style.feltLabel}>{label}</span>
        {score !== null && <span className={bubbleClass}>{score}</span>}
      </div>
      <div className={style.hand}>
        {cards.map((c, i) => (
          <Card
            // Position-based key is fine — cards never reorder mid-hand.
            // eslint-disable-next-line react/no-array-index-key
            key={`${label}-${i}`}
            card={c}
            hidden={hideHole && i === 1}
          />
        ))}
      </div>
    </div>
  );
};

interface ChipBtnProps {
  imgUrl: string;
  label: string;
  title: string;
  onClick: () => void;
  onPointerDown?: () => void;
  disabled?: boolean;
}

const ChipBtn: FunctionComponent<ChipBtnProps> = ({
  imgUrl,
  label,
  title,
  onClick,
  onPointerDown,
  disabled,
}: ChipBtnProps) => (
  <button
    type="button"
    className={style.chipBtn}
    onClick={onClick}
    onPointerDown={disabled ? undefined : onPointerDown}
    disabled={disabled}
    title={title}
  >
    <img className={style.chipBtnImg} src={imgUrl} alt="" />
    <span className={style.chipLabel}>{label}</span>
  </button>
);

// ─── Main game component ──────────────────────────────────────────
const BlackjackApp: FunctionComponent<AppProps> = () => {
  const { flags, setFlags } = useGameState();
  const bankroll = flags.bankBalance;

  const [shoe, setShoe] = useState<CardModel[]>(() => buildShoe());
  const [phase, setPhase] = useState<Phase>('betting');
  const [bet, setBet] = useState<number>(0);
  const [player, setPlayer] = useState<CardModel[]>([]);
  const [dealer, setDealer] = useState<CardModel[]>([]);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [moneyFx, setMoneyFx] = useState<'flash' | 'loss' | null>(null);
  const [tableShake, setTableShake] = useState(false);

  // Refs to hold the latest values for async dealer playout / settlement,
  // since setTimeout callbacks otherwise capture stale state.
  const shoeRef = useRef(shoe);
  shoeRef.current = shoe;
  const betRef = useRef(bet);
  betRef.current = bet;

  // Track whether a hand is currently in progress so we emit the
  // events the bailout system listens to in src/game/state.tsx.
  const hasActiveHandRef = useRef(false);

  /** Chips SFX on pointerdown runs before click; dedupe when startRound runs ms later. */
  const lastChipsSfxAtRef = useRef(0);
  const triggerChipsInSfx = useCallback((): void => {
    const now = Date.now();
    if (now - lastChipsSfxAtRef.current < 220) return;
    lastChipsSfxAtRef.current = now;
    playBlackjackChipsInSfx();
  }, []);

  useEffect(() => {
    const inProgress = phase === 'playing' || phase === 'dealer';
    if (inProgress && !hasActiveHandRef.current) {
      hasActiveHandRef.current = true;
      gameEventBus.emit('blackjack:hand_started', { at: Date.now() });
    } else if (!inProgress && hasActiveHandRef.current) {
      hasActiveHandRef.current = false;
      gameEventBus.emit('blackjack:hand_finished', { at: Date.now() });
    }
  }, [phase]);

  useEffect(
    () => () => {
      if (hasActiveHandRef.current) {
        hasActiveHandRef.current = false;
        gameEventBus.emit('blackjack:hand_finished', { at: Date.now() });
      }
    },
    []
  );

  // Pop one card off the shoe; reshuffle when it gets thin.
  const drawFrom = (s: CardModel[]): [CardModel, CardModel[]] => {
    const local = s.length < 15 ? buildShoe() : s;
    const [c, ...rest] = local;
    return [c, rest];
  };

  // Atomic settlement: takes the final hands and adjusts bankroll.
  const settleRound = (
    finalPlayer: CardModel[],
    finalDealer: CardModel[],
    betAmt: number
  ): void => {
    const pv = handValue(finalPlayer);
    const dv = handValue(finalDealer);
    const pBJ = isBlackjack(finalPlayer);
    const dBJ = isBlackjack(finalDealer);

    let result: Exclude<Outcome, null>;
    let payout = 0; // amount returned to bankroll, includes bet on win/push

    if (pBJ && dBJ) {
      result = 'push';
      payout = betAmt;
    } else if (pBJ) {
      result = 'bj';
      payout = betAmt + Math.round(betAmt * 1.5); // 3:2
    } else if (dBJ) {
      result = 'lose';
      payout = 0;
    } else if (pv > 21) {
      result = 'lose';
      payout = 0;
    } else if (dv > 21) {
      result = 'win';
      payout = betAmt * 2;
    } else if (pv > dv) {
      result = 'win';
      payout = betAmt * 2;
    } else if (pv < dv) {
      result = 'lose';
      payout = 0;
    } else {
      result = 'push';
      payout = betAmt;
    }

    setFlags({ bankBalance: flags.bankBalance + payout });
    setOutcome(result);
    setPhase('settled');

    if (result === 'win' || result === 'bj') {
      playBlackjackWinSfx();
      setMoneyFx('flash');
    } else if (result === 'lose') {
      playBlackjackLoseSfx();
      setMoneyFx('loss');
      setTableShake(true);
      window.setTimeout(() => setTableShake(false), 350);
    }
    window.setTimeout(() => setMoneyFx(null), 900);
  };

  const startRound = (betAmount: number): void => {
    if (betAmount <= 0 || betAmount > bankroll) return;

    triggerChipsInSfx();

    let s = shoe;
    const draw = (): CardModel => {
      const [c, rest] = drawFrom(s);
      s = rest;
      return c;
    };
    const p1 = draw();
    const d1 = draw();
    const p2 = draw();
    const d2 = draw();
    const playerHand = [p1, p2];
    const dealerHand = [d1, d2];

    setShoe(s);
    setBet(betAmount);
    setFlags({ bankBalance: bankroll - betAmount });
    setPlayer(playerHand);
    setDealer(dealerHand);
    setOutcome(null);
    setPhase('playing');

    // Natural blackjack — auto-settle after a beat.
    if (isBlackjack(playerHand) || isBlackjack(dealerHand)) {
      window.setTimeout(() => {
        // Reveal dealer's hole card by transitioning out of 'playing' first.
        setPhase('dealer');
        window.setTimeout(
          () => settleRound(playerHand, dealerHand, betAmount),
          250
        );
      }, 700);
    }
  };

  const onHit = (): void => {
    if (phase !== 'playing') return;
    const [c, nextShoe] = drawFrom(shoeRef.current);
    const newHand = [...player, c];
    setShoe(nextShoe);
    setPlayer(newHand);
    playBlackjackDealCardSfx();
    if (handValue(newHand) >= 21) {
      // bust or 21 — auto-stand.
      window.setTimeout(() => stand(newHand), 350);
    }
  };

  const stand = (overrideHand?: CardModel[]): void => {
    if (phase !== 'playing' && !overrideHand) return;
    const ph = overrideHand || player;
    setPhase('dealer');

    // Capture the current dealer hand and play it out.
    const dealerSnapshot = [...dealer];
    let s = shoeRef.current;
    let d = dealerSnapshot;

    const playOut = (): void => {
      // Dealer hits to 17 (stands on all 17, including soft).
      const v = handValue(d);
      if (v < 17) {
        const [c, nextShoe] = drawFrom(s);
        s = nextShoe;
        d = [...d, c];
        setShoe(s);
        setDealer(d);
        playBlackjackDealCardSfx();
        window.setTimeout(playOut, 600);
      } else {
        window.setTimeout(() => settleRound(ph, d, betRef.current), 500);
      }
    };
    window.setTimeout(playOut, 500);
  };

  const nextRound = (): void => {
    setPlayer([]);
    setDealer([]);
    setOutcome(null);
    setBet(0);
    setPhase('betting');
  };

  // ─── Derived UI state ──────────────────────────────────────────
  const playerScore: number | null = player.length ? handValue(player) : null;
  const dealerScore: number | null = dealer.length
    ? phase === 'playing'
      ? handValue([dealer[0]])
      : handValue(dealer)
    : null;

  const playerScoreState: 'bust' | 'bj' | '' =
    playerScore !== null && playerScore === 21 && player.length === 2
      ? 'bj'
      : playerScore !== null && playerScore > 21
      ? 'bust'
      : '';
  const dealerScoreState: 'bust' | 'bj' | '' =
    phase !== 'playing' &&
    dealerScore !== null &&
    dealerScore === 21 &&
    dealer.length === 2
      ? 'bj'
      : dealerScore !== null && dealerScore > 21
      ? 'bust'
      : '';

  const broke = bankroll <= 0 && phase === 'betting';

  const status =
    phase === 'betting'
      ? broke
        ? 'Out of money. Hold on, the phone is ringing\u2026'
        : 'Place your bet.'
      : phase === 'playing'
      ? 'Your turn. Hit or stand?'
      : phase === 'dealer'
      ? 'Dealer is playing\u2026'
      : outcome === 'bj'
      ? 'Blackjack! Pays 3:2.'
      : outcome === 'win'
      ? 'You win!'
      : outcome === 'lose'
      ? handValue(player) > 21
        ? 'Bust. House wins.'
        : 'House wins.'
      : outcome === 'push'
      ? 'Push. Bet returned.'
      : '';

  const bannerText: string | null =
    outcome === 'bj'
      ? 'BLACKJACK!'
      : outcome === 'win'
      ? 'YOU WIN'
      : outcome === 'lose'
      ? handValue(player) > 21
        ? 'BUST'
        : 'YOU LOSE'
      : outcome === 'push'
      ? 'PUSH'
      : null;

  const bannerClass: string =
    outcome === 'bj'
      ? `${style.banner} ${style.bannerBlackjack}`
      : outcome === 'win'
      ? `${style.banner} ${style.bannerWin}`
      : outcome === 'lose'
      ? `${style.banner} ${style.bannerLose}`
      : outcome === 'push'
      ? `${style.banner} ${style.bannerPush}`
      : style.banner;

  // Bet sizes recomputed on every render off the live bankroll.
  const betSizes = useMemo(
    () => [
      {
        key: 'red' as const,
        amount: niceBet(bankroll * 0.1),
        imgUrl: chipRedUrl,
        sub: '10%',
      },
      {
        key: 'blue' as const,
        amount: niceBet(bankroll * 0.25),
        imgUrl: chipBlueUrl,
        sub: '25%',
      },
      {
        key: 'gold' as const,
        amount: bankroll, // ALL IN — no rounding floor
        imgUrl: chipGoldUrl,
        sub: 'ALL IN',
      },
    ],
    [bankroll]
  );
  const defaultDealAmount = betSizes[1].amount;

  // ─── Render ────────────────────────────────────────────────────
  const moneyMeterClass = `${style.moneyMeter}${
    moneyFx === 'flash'
      ? ' ' + style.moneyMeterFlash
      : moneyFx === 'loss'
      ? ' ' + style.moneyMeterLoss
      : ''
  }`;

  const settledFooter = ((): JSX.Element | null => {
    if (phase !== 'settled') return null;
    if (outcome === 'bj') {
      return (
        <span className={style.actionFooterMoneyWin}>
          {`+${formatMoney(Math.round(bet * 1.5))} (3:2)`}
        </span>
      );
    }
    if (outcome === 'win') {
      return (
        <span className={style.actionFooterMoneyWin}>
          {`+${formatMoney(bet)}`}
        </span>
      );
    }
    if (outcome === 'push') {
      return <span className={style.actionFooterMoney}>±$0</span>;
    }
    return (
      <span className={style.actionFooterMoneyLoss}>
        {`\u2212${formatMoney(bet)}`}
      </span>
    );
  })();

  return (
    <div className={style.app}>
      <MenuBar options={['File', 'Game', 'Options', 'Help']} />

      {/* Bank display strip */}
      <div className={style.moneyStrip}>
        <div className={style.moneyGroup}>
          <span className={style.moneyLabel}>Bankroll:</span>
          <div className={moneyMeterClass}>{formatMoney(bankroll)}</div>
        </div>
        <div className={style.moneyGroup}>
          <span className={style.moneyLabel}>Bet:</span>
          <div className={style.moneyMeterSmall}>
            {bet > 0 ? formatMoney(bet) : '—'}
          </div>
        </div>
      </div>

      {/* Felt table */}
      <div className={`${style.felt}${tableShake ? ' ' + style.shake : ''}`}>
        <div className={style.dealerRow}>
          <Hand
            cards={dealer}
            hideHole={phase === 'playing'}
            score={dealer.length ? dealerScore : null}
            scoreState={dealerScoreState}
            label="DEALER"
          />
          <div className={style.feltLabel} style={{ marginTop: '6px' }}>
            BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON ALL 17
          </div>
        </div>

        <div className={style.spacer}>
          {bet > 0 && phase !== 'betting' && !bannerText && (
            <div className={style.chipStack}>
              {[0, 1, 2].map((i) => (
                <img
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className={style.chipStackImg}
                  src={
                    i === 2 ? chipGoldUrl : i === 1 ? chipBlueUrl : chipRedUrl
                  }
                  alt=""
                  style={{ top: `${18 - i * 4}px` }}
                />
              ))}
            </div>
          )}
          {bannerText && <div className={bannerClass}>{bannerText}</div>}
        </div>

        <div className={style.playerRow}>
          <Hand
            cards={player}
            hideHole={false}
            score={player.length ? playerScore : null}
            scoreState={playerScoreState}
            label="YOU"
          />
        </div>
      </div>

      {/* Action bar */}
      <div className={style.actionBar}>
        {phase === 'betting' && !broke && (
          <Fragment>
            <span className={style.actionLabel}>Deal amount:</span>
            <div className={style.chipRow}>
              {betSizes.map((b) => (
                <ChipBtn
                  key={b.key}
                  imgUrl={b.imgUrl}
                  label={formatMoney(b.amount)}
                  title={`${formatMoney(b.amount)} — ${b.sub}`}
                  onClick={() => startRound(b.amount)}
                  onPointerDown={triggerChipsInSfx}
                  disabled={b.amount <= 0 || b.amount > bankroll}
                />
              ))}
            </div>
            <div className={style.actionFiller} />
            <button
              type="button"
              className={`${style.btn} ${style.btnDefault}`}
              onClick={() => startRound(defaultDealAmount)}
              onPointerDown={
                defaultDealAmount <= 0 || defaultDealAmount > bankroll
                  ? undefined
                  : triggerChipsInSfx
              }
              disabled={defaultDealAmount <= 0 || defaultDealAmount > bankroll}
            >
              <span>
                <u>D</u>eal
              </span>
            </button>
          </Fragment>
        )}

        {phase === 'playing' && (
          <Fragment>
            <button
              type="button"
              className={`${style.btn} ${style.btnDefault}`}
              onClick={onHit}
            >
              <span>
                <u>H</u>it
              </span>
            </button>
            <button type="button" className={style.btn} onClick={() => stand()}>
              <span>
                <u>S</u>tand
              </span>
            </button>
            <div className={style.actionFiller} />
            <span className={style.actionFooterText}>
              Press a button to continue.
            </span>
          </Fragment>
        )}

        {phase === 'dealer' && (
          <Fragment>
            <button type="button" className={style.btn} disabled>
              <span>
                <u>H</u>it
              </span>
            </button>
            <button type="button" className={style.btn} disabled>
              <span>
                <u>S</u>tand
              </span>
            </button>
            <div className={style.actionFiller} />
            <span className={style.actionFooterText}>Dealer playing…</span>
          </Fragment>
        )}

        {phase === 'settled' && (
          <Fragment>
            <button
              type="button"
              className={`${style.btn} ${style.btnDefault}`}
              onClick={nextRound}
            >
              <span>
                <u>N</u>ext Round
              </span>
            </button>
            <div className={style.actionFiller} />
            {settledFooter}
          </Fragment>
        )}

        {broke && (
          <Fragment>
            <div className={style.actionFiller} />
            <span className={style.actionFooterText}>
              Out of money. Hold tight…
            </span>
          </Fragment>
        )}
      </div>

      <StatusBar textLeft={status} textRight={`Shoe: ${shoe.length} cards`} />
    </div>
  );
};

export default BlackjackApp;
