import { h, FunctionComponent, JSX } from 'preact';

import Button from '@/components/shared/Button/Button';
import { gameEventBus } from '@/game/events';
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

const boxStyle: JSX.CSSProperties = {
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
  padding: '8px',
};

const meterStyle: JSX.CSSProperties = {
  marginTop: '6px',
  padding: '6px 8px',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  fontFamily: 'monospace',
};

const rowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  marginTop: '8px',
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
    <div data-window-fit style={panelStyle}>
      <div style={{ fontWeight: 700 }}>Corporate Anti-Virus Center</div>

      <div style={boxStyle}>
        <div>
          Protection status:{' '}
          <b style={{ color: hasPermanentProtection ? '#006400' : '#7a0000' }}>
            {hasPermanentProtection ? 'BOTHERING POPUPS' : 'MOSTLY DECORATIVE'}
          </b>
        </div>
        <div style={meterStyle}>
          Threats detected: 14 cookies, 2 toolbars, 1 suspicious attitude.
        </div>
      </div>

      <div style={boxStyle}>
        <div style={{ fontWeight: 700 }}>Purchase Protection</div>
        <div style={{ marginTop: '6px' }}>
          Available budget: <b>${flags.bankBalance}</b>
        </div>
        <div style={rowStyle}>
          <div>One-time popup cleanup. Wipes today&apos;s shame.</div>
          <Button
            disabled={!canAffordOneTimeClear}
            label={`Clean ($${ONE_TIME_CLEAR_PRICE})`}
            onClick={() => {
              if (!canAffordOneTimeClear) return;
              setFlags({
                bankBalance: (flags.bankBalance ?? 0) - ONE_TIME_CLEAR_PRICE,
              });
              gameEventBus.emit('popup:clear_all', { source: 'antivirus_app' });
            }}
          />
        </div>
        <div style={rowStyle}>
          <div>Permanent protection. Legally, probably not insurance.</div>
          <Button
            disabled={!canAffordPermanentDisable || hasPermanentProtection}
            label={`Protect ($${PERMANENT_DISABLE_PRICE})`}
            onClick={() => {
              if (!canAffordPermanentDisable || hasPermanentProtection) return;
              setFlags({
                bankBalance: (flags.bankBalance ?? 0) - PERMANENT_DISABLE_PRICE,
                hasPurchasedAntiVirus: true,
              });
              gameEventBus.emit('popup:clear_all', { source: 'antivirus_app' });
            }}
          />
        </div>
        {!canAffordOneTimeClear && !canAffordPermanentDisable && (
          <div style={{ marginTop: '10px', color: 'maroon' }}>
            Insufficient funds. The virus is fiscally disappointed.
          </div>
        )}
        {hasPermanentProtection && (
          <div style={{ marginTop: '10px', color: '#006400' }}>
            Permanent protection is active. Popups have been asked firmly to
            stop.
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button label="Close" onClick={closeWindow} />
      </div>
    </div>
  );
};

export default AntiVirusApp;
