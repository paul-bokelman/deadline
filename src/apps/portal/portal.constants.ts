import { JSX } from 'preact';

export const panelStyle: JSX.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'var(--plastic)',
  overflow: 'hidden',
};

export const portalHeaderStyle: JSX.CSSProperties = {
  margin: '1px 1px 0',
  padding: '5px 8px',
  color: '#ffffff',
  background:
    'linear-gradient(90deg, var(--dialog-blue) 0%, #004a9f 62%, var(--dialog-gray) 100%)',
  boxShadow: 'var(--bevel-raised)',
};

export const portalHeaderTitleStyle: JSX.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  lineHeight: 1,
};

export const portalHeaderSubStyle: JSX.CSSProperties = {
  marginTop: '2px',
  fontSize: '11px',
};

export const toolbarStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '2px',
  alignItems: 'center',
  padding: '4px 6px',
  backgroundColor: 'var(--plastic)',
  borderBottom: '1px solid var(--button-shadow)',
  boxShadow: 'inset 0 -1px 0 var(--paper)',
};

export const toolbarItemStyle: JSX.CSSProperties = {
  padding: '2px 7px',
  boxShadow: 'var(--bevel-raised)',
  backgroundColor: 'var(--plastic)',
};

export const portalBodyStyle: JSX.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  padding: '6px',
  gap: '6px',
};

export const navPaneStyle: JSX.CSSProperties = {
  flex: '0 0 145px',
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
  padding: '6px',
  overflow: 'hidden',
};

export const navTitleStyle: JSX.CSSProperties = {
  marginBottom: '6px',
  fontWeight: 700,
};

export const navItemStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 4px',
  marginBottom: '2px',
};

export const navItemActiveStyle: JSX.CSSProperties = {
  ...navItemStyle,
  color: '#ffffff',
  backgroundColor: 'var(--dialog-blue)',
};

export const workspaceStyle: JSX.CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  padding: '8px',
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--bevel-sunken)',
  overflowY: 'auto',
};

export const groupBoxStyle: JSX.CSSProperties = {
  marginTop: '8px',
  padding: '8px',
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-group)',
};

export const groupTitleStyle: JSX.CSSProperties = {
  marginBottom: '6px',
  fontWeight: 700,
};

export const noticeStyle: JSX.CSSProperties = {
  padding: '6px 8px',
  backgroundColor: '#ffffe1',
  boxShadow: 'var(--bevel-sunken)',
};

export const statusBarStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '2px',
  padding: '2px',
  backgroundColor: 'var(--plastic)',
};

export const statusCellStyle: JSX.CSSProperties = {
  flex: 1,
  padding: '2px 6px',
  minHeight: '18px',
  boxShadow: 'var(--bevel-status-well)',
};

export const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--plastic)',
  boxShadow: 'var(--bevel-raised)',
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
  backgroundColor: 'var(--paper)',
  boxShadow: 'var(--border-field)',
  padding: '3px 6px',
  fontFamily: 'monospace',
  width: '260px',
  maxWidth: '100%',
};

export const captchaPanelStyle: JSX.CSSProperties = {
  ...groupBoxStyle,
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
export const PORTAL_RESET_FAKE_EMAIL_ID = 'corp-password-reset-link-fake';

export const CAPTCHA_LIVES_TOTAL = 3;
