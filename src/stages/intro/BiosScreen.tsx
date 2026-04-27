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

const bootOverlayStyle: JSX.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: '#000000',
  color: '#cccccc',
  fontFamily: 'var(--font-family-sys), monospace',
  fontSize: '18px',
  padding: '24px',
  zIndex: 200001,
  whiteSpace: 'pre-wrap',
};

const itemRowStyle = (isSelected: boolean): JSX.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 16px',
  backgroundColor: isSelected ? BIOS_RED : 'transparent',
  color: isSelected ? BIOS_WHITE : BIOS_WHITE,
  cursor: 'pointer',
});

const triangleStyle: JSX.CSSProperties = {
  color: BIOS_YELLOW,
};

const BOOT_LINES: string[] = [
  'Award Modular BIOS v4.51PG, An Energy Star Ally',
  'Copyright (C) 1984-1999, Award Software, Inc.',
  '',
  'Saving CMOS settings... OK',
  'Detecting IDE Primary Master ... DEADLINE-HDD',
  'Detecting IDE Primary Slave  ... None',
  'Detecting IDE Secondary Master ... CD-ROM',
  '',
  'Booting from Hard Disk...',
  'Starting Windows 96...',
];

const BiosScreen: FunctionComponent<BiosScreenProps> = ({
  onBoot,
}: BiosScreenProps) => {
  const [selectedColumn, setSelectedColumn] = useState<0 | 1>(0);
  const [selectedRow, setSelectedRow] = useState(0);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLineCount, setBootLineCount] = useState(0);

  const columns = useMemo(() => [LEFT_ITEMS, RIGHT_ITEMS], []);
  const activeItem = columns[selectedColumn][selectedRow];

  useEffect(() => {
    if (isBooting) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      const currentColumn = columns[selectedColumn];

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedRow((current) => {
          const next = current - 1;
          return next < 0 ? currentColumn.length - 1 : next;
        });
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedRow((current) => {
          const next = current + 1;
          return next >= currentColumn.length ? 0 : next;
        });
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedColumn((current) => (current === 0 ? 1 : 0));
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeItem.isBoot) {
          setIsBooting(true);
        }
        return;
      }

      if (event.key === 'F10') {
        event.preventDefault();
        setIsBooting(true);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setIsBooting(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, columns, isBooting, selectedColumn]);

  useEffect(() => {
    if (!isBooting) return undefined;

    let lineIndex = 0;
    setBootLineCount(0);

    const intervalId = window.setInterval(() => {
      lineIndex += 1;
      if (lineIndex >= BOOT_LINES.length) {
        window.clearInterval(intervalId);
        window.setTimeout(onBoot, 600);
      }
      setBootLineCount(lineIndex);
    }, 220);

    return () => window.clearInterval(intervalId);
  }, [isBooting, onBoot]);

  const renderItem = (
    item: BiosMenuItem,
    columnIndex: 0 | 1,
    rowIndex: number
  ): JSX.Element => {
    const isSelected =
      selectedColumn === columnIndex && selectedRow === rowIndex;
    return (
      <div
        key={item.id}
        onClick={() => {
          setSelectedColumn(columnIndex);
          setSelectedRow(rowIndex);
        }}
        onDblClick={() => {
          if (item.isBoot) setIsBooting(true);
        }}
        style={itemRowStyle(isSelected)}
      >
        <span style={triangleStyle}>▶</span>
        <span>{item.label}</span>
      </div>
    );
  };

  if (isBooting) {
    return (
      <div style={bootOverlayStyle}>
        {BOOT_LINES.slice(0, bootLineCount + 1).map((line, index) => (
          <div key={index}>{line || '\u00a0'}</div>
        ))}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={titleBoxStyle}>
        CMOS Setup Utility - Copyright (C) 1984-1999 Award Software
      </div>

      <div style={menuFrameStyle}>
        <div style={menuColumnsStyle}>
          <div>
            {LEFT_ITEMS.map((item, index) => renderItem(item, 0, index))}
          </div>
          <div style={dividerStyle} />
          <div>
            {RIGHT_ITEMS.map((item, index) => renderItem(item, 1, index))}
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

      <div style={descriptionStyle}>{activeItem.description}</div>
    </div>
  );
};

export default BiosScreen;
