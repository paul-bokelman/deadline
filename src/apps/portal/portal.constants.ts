import { JSX } from 'preact';

export const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: 'calc(100% - 16px)',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

export const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 10px',
  marginRight: '8px',
};

export const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

export const textInputStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '3px 6px',
  fontFamily: 'monospace',
  width: '260px',
  maxWidth: '100%',
};

export const captchaPanelStyle: JSX.CSSProperties = {
  marginTop: '10px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
};

export const MICRO_GRID_DIMENSION = 16;
export const MICRO_TILE_SIZE = 8;
export const MICRO_TILE_GAP = 1;
export const MICRO_GRID_PADDING = 6;
export const MICRO_GRID_OUTER_SIZE =
  MICRO_GRID_DIMENSION * MICRO_TILE_SIZE +
  (MICRO_GRID_DIMENSION - 1) * MICRO_TILE_GAP +
  MICRO_GRID_PADDING * 2;
export const FLEE_BOX_WIDTH = 138;
export const FLEE_BOX_HEIGHT = 28;
export const FLEE_TRIGGER_RADIUS = 9999;
export const FLEE_MIN_RADIUS = 0.001;
export const FLEE_MAX_PUSH = 72;

export const tinyGridStyle: JSX.CSSProperties = {
  marginTop: '8px',
  display: 'grid',
  gridTemplateColumns: `repeat(${MICRO_GRID_DIMENSION}, ${MICRO_TILE_SIZE}px)`,
  gap: `${MICRO_TILE_GAP}px`,
  width: `${MICRO_GRID_OUTER_SIZE}px`,
  maxWidth: '100%',
  backgroundColor: '#3f3f3f',
  padding: `${MICRO_GRID_PADDING}px`,
  boxShadow: 'var(--border-field)',
};

export const chartGridStyle: JSX.CSSProperties = {
  marginTop: '8px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
};

export const smallMutedStyle: JSX.CSSProperties = {
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
  fontFamily: 'monospace',
  fontSize: '12px',
};

export const REQUIRED_REPORT_FILE_ID = 'q3-real-report';
export const REQUIRED_REPORT_FILE_NAME =
  'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.png';
export const REQUIRED_REPORT_FILE_TYPE = 'pngFile';
export const PORTAL_RESET_EMAIL_ID = 'corp-password-reset-link';
export const PORTAL_RESET_EVENT_ID = 'portal:password-reset:sent';

export const CAPTCHA_LIVES_TOTAL = 3;
