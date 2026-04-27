import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

interface BiosScreenProps {
  onBoot: () => void;
}

interface BiosMenuItem {
  id: string;
  label: string;
  description: string;
  /**
   * If set, activating this item triggers the boot sequence.
   * Otherwise activation simply shows a stub message.
   */
  isBoot?: boolean;
}

const LEFT_ITEMS: BiosMenuItem[] = [
  {
    id: 'cmos',
    label: 'Standard CMOS Features',
    description: 'Time, Date, Hard Disk Type...',
  },
  {
    id: 'advanced-bios',
    label: 'Advanced BIOS Features',
    description: 'Boot sequence, virus warning, CPU cache settings...',
  },
  {
    id: 'advanced-chipset',
    label: 'Advanced Chipset Features',
    description: 'DRAM timing, AGP aperture, system BIOS cacheable...',
  },
  {
    id: 'peripherals',
    label: 'Integrated Peripherals',
    description: 'On-chip IDE, USB controller, serial / parallel ports...',
  },
  {
    id: 'power',
    label: 'Power Management Setup',
    description: 'ACPI suspend type, power button mode, wake-on-LAN...',
  },
  {
    id: 'pnp',
    label: 'PnP/PCI Configurations',
    description: 'Resources controlled by, IRQ assignments, PCI latency...',
  },
  {
    id: 'health',
    label: 'PC Health Status',
    description: 'CPU temperature, fan speeds, voltages...',
  },
];

const RIGHT_ITEMS: BiosMenuItem[] = [
  {
    id: 'voltage',
    label: 'Frequency/Voltage Control',
    description: 'CPU clock ratio, host clock, DRAM voltage...',
  },
  {
    id: 'fail-safe',
    label: 'Load Fail-Safe Defaults',
    description: 'Load default settings for stable system operation.',
  },
  {
    id: 'optimized',
    label: 'Load Optimized Defaults',
    description: 'Load default settings for optimal system performance.',
  },
  {
    id: 'supervisor',
    label: 'Set Supervisor Password',
    description: 'Change, set, or disable the supervisor password.',
  },
  {
    id: 'user',
    label: 'Set User Password',
    description: 'Change, set, or disable the user password.',
  },
  {
    id: 'save',
    label: 'Save & Exit Setup',
    description: 'Save data to CMOS and exit setup.',
    isBoot: true,
  },
  {
    id: 'exit',
    label: 'Exit Without Saving',
    description: 'Abandon all changes and exit setup.',
    isBoot: true,
  },
];

const BIOS_BLUE = '#0000a8';
const BIOS_RED = '#a80000';
const BIOS_CYAN = '#54fefe';
const BIOS_YELLOW = '#fefe54';
const BIOS_WHITE = '#ffffff';

const containerStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: BIOS_BLUE,
  color: BIOS_WHITE,
  fontFamily: 'var(--font-family-sys), monospace',
  fontSize: '18px',
  lineHeight: 1.3,
  zIndex: 200000,
  padding: '20px 32px',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  userSelect: 'none',
  cursor: 'default',
};

const titleBoxStyle: JSX.CSSProperties = {
  border: `1px solid ${BIOS_CYAN}`,
  textAlign: 'center',
  padding: '4px 0',
  marginBottom: '4px',
};

const menuFrameStyle: JSX.CSSProperties = {
  border: `1px solid ${BIOS_CYAN}`,
  display: 'flex',
  flexDirection: 'column',
  flex: '0 0 auto',
};

const menuColumnsStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1px 1fr',
  padding: '8px 0',
};

const dividerStyle: JSX.CSSProperties = {
  backgroundColor: BIOS_CYAN,
  width: '1px',
};

const helpRowStyle: JSX.CSSProperties = {
  borderTop: `1px solid ${BIOS_CYAN}`,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  padding: '8px 16px',
  columnGap: '16px',
};

const descriptionStyle: JSX.CSSProperties = {
  textAlign: 'center',
  marginTop: '12px',
};

const itemRowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 16px',
  color: BIOS_WHITE,
  cursor: 'default',
};

const triangleStyle: JSX.CSSProperties = {
  color: BIOS_YELLOW,
};

const gameTitleStyle: JSX.CSSProperties = {
  border: `1px solid ${BIOS_CYAN}`,
  backgroundColor: BIOS_RED,
  padding: '12px 16px',
  textAlign: 'center',
  marginBottom: '8px',
};

const startButtonStyle: JSX.CSSProperties = {
  border: `1px solid ${BIOS_CYAN}`,
  backgroundColor: BIOS_BLUE,
  color: BIOS_WHITE,
  fontFamily: 'var(--font-family-sys), monospace',
  fontSize: '18px',
  padding: '10px 18px',
  cursor: 'pointer',
};

const BiosScreen: FunctionComponent<BiosScreenProps> = ({
  onBoot,
}: BiosScreenProps) => {
  const [isStarting, setIsStarting] = useState(false);
  const columns = useMemo(() => [LEFT_ITEMS, RIGHT_ITEMS], []);
  const activeItem = columns[0][0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return;
      if (isStarting) return;
        event.preventDefault();
      setIsStarting(true);
      window.setTimeout(onBoot, 260);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarting, onBoot]);

  return (
    <div style={containerStyle}>
      <div style={gameTitleStyle}>
        <div style={{ color: BIOS_YELLOW }}>DEADLINE</div>
        <div style={{ marginTop: '4px' }}>
          You have one shot to submit the report in time.
        </div>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => {
              if (isStarting) return;
              setIsStarting(true);
              window.setTimeout(onBoot, 260);
            }}
            style={startButtonStyle}
            type="button"
          >
            {isStarting ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      </div>
      <div style={titleBoxStyle}>
        CMOS Setup Utility - Copyright (C) 1984-1999 Award Software
      </div>

      <div style={menuFrameStyle}>
        <div style={menuColumnsStyle}>
          <div>
            {LEFT_ITEMS.map((item) => (
              <div key={item.id} style={itemRowStyle}>
                <span style={triangleStyle}>▶</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={dividerStyle} />
          <div>
            {RIGHT_ITEMS.map((item) => (
              <div key={item.id} style={itemRowStyle}>
                <span style={triangleStyle}>▶</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={helpRowStyle}>
          <div>
            <div>Esc : Quit</div>
            <div>F10 : Save &amp; Exit Setup</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={triangleStyle}>↑ ↓ → ←</span>
            <span> : Select Item</span>
          </div>
        </div>
      </div>

      <div style={descriptionStyle}>
        {activeItem.description} Press Enter or click Start Game to continue.
      </div>
    </div>
  );
};

export default BiosScreen;
