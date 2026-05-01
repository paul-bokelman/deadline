import { h, FunctionComponent, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

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

const scrollFrameStyle: JSX.CSSProperties = {
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '10px',
  height: '100%',
  overflowY: 'auto',
  fontFamily: 'monospace',
  lineHeight: 1.35,
  whiteSpace: 'pre-wrap',
};

const scrollWrapStyle: JSX.CSSProperties = {
  flex: 1,
  minHeight: 0,
  position: 'relative',
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

const SCROLLBAR_GUTTER_PX = 18;

const TARGET_WORD_COUNT = 68000;

const legalWordBank = [
  'whereas',
  'party',
  'license',
  'compliance',
  'policy',
  'safeguard',
  'acknowledges',
  'operational',
  'obligation',
  'workflow',
  'record',
  'provision',
  'governance',
  'enterprise',
  'security',
  'synchronization',
  'documentation',
  'validation',
  'standard',
  'agreement',
  'term',
  'condition',
  'assumes',
  'responsibility',
  'maintenance',
  'performance',
  'notification',
  'review',
  'approval',
  'reasonable',
  'commercial',
  'effort',
  'retention',
  'framework',
  'restriction',
  'applicable',
  'jurisdiction',
  'implementation',
  'protocol',
  'continuity',
  'recovery',
  'remediation',
  'mandatory',
  'monitoring',
  'attestation',
  'acknowledgment',
  'software',
  'environment',
  'continuation',
  'authorized',
  'statement',
];

const buildVeryLongEula = (): string => {
  const words: string[] = [];
  let index = 0;
  while (words.length < TARGET_WORD_COUNT) {
    words.push(legalWordBank[index % legalWordBank.length] ?? 'agreement');
    index += 1;
  }

  const lines: string[] = [
    'END USER LICENSE AGREEMENT (EXPANDED COMPLIANCE EDITION)',
    '',
    `This document intentionally contains approximately ${TARGET_WORD_COUNT.toLocaleString()} words.`,
    '',
  ];
  const wordsPerSection = 180;
  for (let offset = 0; offset < words.length; offset += wordsPerSection) {
    const sectionNumber = Math.floor(offset / wordsPerSection) + 1;
    lines.push(`SECTION ${sectionNumber}`);
    lines.push(
      `${words
        .slice(offset, Math.min(words.length, offset + wordsPerSection))
        .join(' ')}.`
    );
    lines.push('');
  }

  return lines.join('\n');
};

const EulaApp: FunctionComponent<AppProps> = () => {
  const { rebootGame } = useGameState();
  const [isFullyScrolled, setIsFullyScrolled] = useState(false);

  const eulaText = useMemo(() => {
    return buildVeryLongEula();
  }, []);

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700 }}>End User License Agreement</div>
      <div style={{ fontSize: '12px' }}>
        You must scroll through the entire agreement to continue.
      </div>
      <div style={scrollWrapStyle}>
        <div
          style={scrollFrameStyle}
          onScroll={(event) => {
            const element = event.currentTarget as HTMLDivElement;
            const maxScrollTop = element.scrollHeight - element.clientHeight;
            if (maxScrollTop <= 0) {
              setIsFullyScrolled(true);
              return;
            }
            if (element.scrollTop >= maxScrollTop - 2) {
              setIsFullyScrolled(true);
            }
          }}
        >
          {eulaText}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${SCROLLBAR_GUTTER_PX}px`,
            // Transparent blocker keeps scrollbar visible but non-interactive.
            backgroundColor: 'transparent',
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          disabled={!isFullyScrolled}
          style={isFullyScrolled ? buttonStyle : disabledButtonStyle}
          onClick={rebootGame}
        >
          Agree with Terms
        </button>
      </div>
    </div>
  );
};

export default EulaApp;
