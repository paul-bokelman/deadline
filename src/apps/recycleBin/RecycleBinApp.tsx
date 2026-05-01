import { h, FunctionComponent } from 'preact';
import { useMemo } from 'preact/hooks';

import Button from '@/components/shared/Button/Button';
import Icon from '@/components/shared/Icon/Icon';
import WindowContent from '@/components/shared/WindowContent/WindowContent';
import { useGameState } from '@/game/state';
import { AppProps } from '@/types/App';

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
            height: '100%',
            boxSizing: 'border-box',
            background: 'var(--plastic)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              borderBottom: '1px solid var(--button-shadow)',
              boxShadow: 'inset 0 -1px 0 var(--paper)',
            }}
          >
            <Button
              disabled={recycledItems.length === 0}
              label="Recover"
              onClick={() => setFlags({ recycledDesktopApps: {} })}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              background: 'var(--plastic)',
            }}
          >
            <Icon iconId="folderOpen" size={32} />
            <div style={{ fontWeight: 700 }}>Recycle Bin</div>
          </div>
          <div
            style={{
              boxShadow: 'var(--bevel-sunken)',
              background: 'var(--paper)',
              minHeight: 0,
              flex: 1,
              overflowY: 'auto',
              padding: '6px',
              margin: '0 6px 6px',
            }}
          >
            {recycledItems.length === 0 ? (
              <div style={{ padding: '4px' }}>This folder is empty.</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
                  gap: '8px',
                }}
              >
                {recycledItems.map((itemName, index) => (
                  <div
                    key={`${itemName}-${index}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      minHeight: '68px',
                      textAlign: 'center',
                    }}
                  >
                    <Icon iconId="folderClosed" size={32} />
                    <div
                      style={{
                        maxWidth: '92px',
                        overflowWrap: 'anywhere',
                        lineHeight: '13px',
                      }}
                    >
                      {itemName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              padding: '2px',
              background: 'var(--plastic)',
            }}
          >
            <div
              style={{
                flex: 1,
                padding: '2px 6px',
                boxShadow: 'var(--bevel-status-well)',
              }}
            >
              Ready
            </div>
          </div>
        </div>
      }
    />
  );
};

export default RecycleBinApp;
