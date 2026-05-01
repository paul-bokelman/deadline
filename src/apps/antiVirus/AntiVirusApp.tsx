import { h, FunctionComponent, JSX } from 'preact';

import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import { AppProps } from '@/types/App';

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

const boxStyle: JSX.CSSProperties = {
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '10px',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 8px',
};

const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const ONE_TIME_CLEAR_PRICE = 25;
const PERMANENT_DISABLE_PRICE = 500;

const AntiVirusApp: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  const { flags, setFlags } = useGameState();
  const hasPermanentProtection = flags.hasPurchasedAntiVirus;
  const canAffordOneTimeClear =
    (flags.bankBalance ?? 0) >= ONE_TIME_CLEAR_PRICE;
  const canAffordPermanentDisable =
    (flags.bankBalance ?? 0) >= PERMANENT_DISABLE_PRICE;

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700 }}>Antivirus</div>

      <div style={boxStyle}>
        <div>
          Status:{' '}
          <b style={{ color: hasPermanentProtection ? '#006400' : '#7a0000' }}>
            {hasPermanentProtection ? 'PERMANENTLY BLOCKING' : 'STANDARD'}
          </b>
        </div>
        <div style={{ marginTop: '8px' }}>
          Choose one-time cleanup or permanent popup protection.
        </div>
      </div>

      <div style={boxStyle}>
        <div>
          Bank balance: <b>${flags.bankBalance}</b>
        </div>
        <div style={{ marginTop: '10px' }}>
          <button
            type="button"
            disabled={!canAffordOneTimeClear}
            style={canAffordOneTimeClear ? buttonStyle : disabledButtonStyle}
            onClick={() => {
              if (!canAffordOneTimeClear) return;
              setFlags({
                bankBalance: (flags.bankBalance ?? 0) - ONE_TIME_CLEAR_PRICE,
              });
              gameEventBus.emit('popup:clear_all', { source: 'antivirus_app' });
            }}
          >
            One-Time Clear (${ONE_TIME_CLEAR_PRICE})
          </button>
        </div>
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            disabled={!canAffordPermanentDisable || hasPermanentProtection}
            style={
              canAffordPermanentDisable && !hasPermanentProtection
                ? buttonStyle
                : disabledButtonStyle
            }
            onClick={() => {
              if (!canAffordPermanentDisable || hasPermanentProtection) return;
              setFlags({
                bankBalance: (flags.bankBalance ?? 0) - PERMANENT_DISABLE_PRICE,
                hasPurchasedAntiVirus: true,
              });
              gameEventBus.emit('popup:clear_all', { source: 'antivirus_app' });
            }}
          >
            Permanently Disable Popups (${PERMANENT_DISABLE_PRICE})
          </button>
        </div>
        {!canAffordOneTimeClear && !canAffordPermanentDisable && (
          <div style={{ marginTop: '10px', color: 'maroon' }}>
            Insufficient funds.
          </div>
        )}
        {hasPermanentProtection && (
          <div style={{ marginTop: '10px', color: '#006400' }}>
            Permanent protection is active.
          </div>
        )}
        <div style={{ marginTop: '10px' }}>
          <button type="button" style={buttonStyle} onClick={closeWindow}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AntiVirusApp;
