import { h, FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';

import WindowContent from '../../components/shared/WindowContent/WindowContent';
import { useGameState } from '../../game/state';
import { AppProps } from '../../types/App';

const RecycleBinApp: FunctionComponent<AppProps> = () => {
  const { flags, setFlags } = useGameState();

  const recycledItems = useMemo(
    () => Object.values(flags.recycledDesktopApps ?? {}),
    [flags.recycledDesktopApps]
  );

  return (
    <WindowContent
      body={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            height: '100%',
            boxSizing: 'border-box',
            padding: 10,
            background: 'var(--surface)',
          }}
        >
          <div
            style={{
              border: '2px inset var(--button-face)',
              padding: '6px 8px',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Recycle Bin Contents: {recycledItems.length}</span>
            <button
              type="button"
              disabled={recycledItems.length === 0}
              onClick={() => setFlags({ recycledDesktopApps: {} })}
              style={{
                border: 'none',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
                padding: '2px 8px',
                color:
                  recycledItems.length === 0 ? 'var(--button-shadow)' : 'inherit',
              }}
            >
              Recover All
            </button>
          </div>
          <div
            style={{
              border: '2px inset var(--button-face)',
              background: 'white',
              minHeight: 0,
              flex: 1,
              overflowY: 'auto',
              padding: '6px 8px',
              fontFamily: 'monospace',
            }}
          >
            {recycledItems.length === 0 ? (
              <div>Recycle Bin is empty.</div>
            ) : (
              recycledItems.map((itemName, index) => (
                <div key={`${itemName}-${index}`}>{itemName}</div>
              ))
            )}
          </div>
        </div>
      }
    />
  );
};

export default RecycleBinApp;
