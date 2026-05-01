import { h, FunctionComponent, JSX } from 'preact';

import { useGameState } from '@/game/state';
import { AppProps } from '@/types/App';

const panelStyle: JSX.CSSProperties = {
  padding: '8px',
  backgroundColor: 'var(--plastic)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const rowStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const boxStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
  padding: '8px',
  fontFamily: 'monospace',
};

const ledgerStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  padding: '6px',
  fontFamily: 'monospace',
};

const gridStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
};

const smallMutedStyle: JSX.CSSProperties = {
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
  fontFamily: 'monospace',
  fontSize: '12px',
};

const WalletApp: FunctionComponent<AppProps> = () => {
  const { flags } = useGameState();
  const bank = flags.bankBalance;

  return (
    <div data-window-fit style={panelStyle}>
      <div style={{ fontWeight: 700 }}>America #1 Bank Online</div>
      <div style={gridStyle}>
        <div style={boxStyle}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>Checking</div>
          <div style={{ fontSize: '22px', fontWeight: 700 }}>${bank}</div>
          <div style={{ marginTop: '6px' }}>
            <div style={smallMutedStyle}>Account</div>
            <div>***-**{String((bank * 97) % 10000).padStart(4, '0')}</div>
          </div>
        </div>

        <div style={boxStyle}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>Status</div>
          <div>Online Banking: ENABLED</div>
          <div>Fraud Monitor: JUDGMENTAL</div>
          <div style={{ marginTop: '6px' }}>
            <span style={smallMutedStyle}>Message:</span> Your spending has been
            described internally as &quot;creative.&quot;
          </div>
        </div>
      </div>

      <div style={ledgerStyle}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>
          Recent Activity
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '4px 10px',
          }}
        >
          <div>ATM Withdrawal (probably)</div>
          <div>-$20</div>
          <div>Blackjack Table Transfer</div>
          <div>-$10</div>
          <div>&quot;Totally Safe Patch&quot; Subscription</div>
          <div>-$0</div>
          <div>Mom&apos;s Emergency Transfer</div>
          <div>+$100</div>
        </div>
        <div style={{ marginTop: '8px', ...smallMutedStyle }}>
          Rates subject to change. Self-respect not FDIC insured.
        </div>
      </div>

      <div style={rowStyle}>
        <div style={{ ...boxStyle, flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>
            Security Tip of the Day
          </div>
          <div>
            Do not store 1000 passwords in a file named{' '}
            <b>IMPORTANT_PASSWORDS_DON&apos;T_LOSE.txt</b>.
            <br />
            Use something discreet, like <b>passwords_final_REAL.xls</b>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletApp;
