import { h, FunctionComponent, JSX } from 'preact';
import { useEffect } from 'preact/hooks';

import { AppProps } from '../../types/App';

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: 'calc(100% - 16px)',
};

const DraftDocumentLinkApp: FunctionComponent<AppProps> = ({
  closeWindow,
  openApp,
}: AppProps) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      openApp({ appId: 'draftDocumentLink' });
      closeWindow();
    }, 250);
    return () => window.clearTimeout(timeoutId);
  }, [closeWindow, openApp]);

  return <div style={panelStyle}>Resolving shortcut target...</div>;
};

export default DraftDocumentLinkApp;
