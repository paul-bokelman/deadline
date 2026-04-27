import { h, FunctionComponent, JSX } from 'preact';

const rootStyle: JSX.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(135deg, rgba(0,70,90,0.95) 0%, rgba(0,40,70,0.95) 100%)',
  zIndex: 1,
  pointerEvents: 'none',
};

const fakeIconBaseStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: '88px',
  color: '#ffffff',
  fontSize: '11px',
  textAlign: 'center',
  pointerEvents: 'auto',
};

const fakeIcons = [
  { id: 'fake-1', x: 18, y: 22, label: 'Q3-Archive.zip' },
  { id: 'fake-2', x: 16, y: 126, label: 'Portal.url' },
  { id: 'fake-3', x: 18, y: 226, label: 'Notes.txt' },
  { id: 'fake-4', x: 120, y: 36, label: 'Draft.tmp' },
  { id: 'fake-5', x: 130, y: 140, label: 'Report.exe' },
];

const ScreenshotWallpaper: FunctionComponent = () => (
  <div style={rootStyle}>
    {fakeIcons.map((icon) => (
      <button
        key={icon.id}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        style={{
          ...fakeIconBaseStyle,
          left: `${icon.x}px`,
          top: `${icon.y}px`,
        }}
        type="button"
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            margin: '0 auto 4px',
            backgroundColor: 'rgba(240, 240, 255, 0.5)',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.25)',
          }}
        />
        <div>{icon.label}</div>
      </button>
    ))}
  </div>
);

export default ScreenshotWallpaper;
