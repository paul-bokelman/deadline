import { JSX } from 'preact';

export const rootStyle: JSX.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#c0c0c0',
};

export const toolbarStyle: JSX.CSSProperties = {
  padding: '6px',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  margin: '6px 6px 0 6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

export const navRowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

export const browserButtonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '3px 8px',
  fontSize: '12px',
};

export const addressInputStyle: JSX.CSSProperties = {
  flex: 1,
  minWidth: '180px',
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '3px 6px',
  fontFamily: 'monospace',
  fontSize: '12px',
};

export const pageStyle: JSX.CSSProperties = {
  margin: '6px',
  flex: 1,
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  padding: '14px',
  overflow: 'auto',
};

export const sectionCardStyle: JSX.CSSProperties = {
  padding: '10px',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  backgroundColor: '#f8f8f8',
};

export const storyListStyle: JSX.CSSProperties = {
  margin: '10px 0 0 0',
  paddingLeft: '18px',
  lineHeight: 1.55,
};

export const bannerStyle: JSX.CSSProperties = {
  padding: '8px 10px',
  marginBottom: '10px',
  background: 'linear-gradient(90deg, #1f4d8f 0%, #3f6cb8 65%, #6d8ad3 100%)',
  color: '#ffffff',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  fontSize: '12px',
  letterSpacing: '0.2px',
};

export const cardGridStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '10px',
};

export const statChipStyle: JSX.CSSProperties = {
  display: 'inline-block',
  padding: '3px 7px',
  marginRight: '6px',
  marginBottom: '6px',
  border: '1px solid #c9c9c9',
  backgroundColor: '#ffffff',
  fontSize: '11px',
  borderRadius: '12px',
};
