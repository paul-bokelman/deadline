import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import Dropdown from '../../components/shared/Dropdown/Dropdown';
import { getDynamicDesktopItems } from '../../system/desktop/dynamicDesktopItems';
import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import {
  getPortalLoginEmail,
  hasPortalPassword,
  requestPortalPasswordReset,
  validatePortalCredentials,
} from '../../system/portalAuth/portalAuth';
import {
  markRunSubmitted,
  recordCheckpoint,
} from '../../system/runTimer/runTimer';
import { playErrorSfx } from '../../utils/audio/osSfx';
import { AppProps } from '../../types/App';
import { ShellItem } from '../../types/Shell';

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  height: 'calc(100% - 16px)',
  boxSizing: 'border-box',
  overflowY: 'auto',
};

const buttonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '4px 10px',
  marginRight: '8px',
};

const disabledButtonStyle: JSX.CSSProperties = {
  ...buttonStyle,
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
};

const textInputStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '3px 6px',
  fontFamily: 'monospace',
  width: '260px',
  maxWidth: '100%',
};

const captchaPanelStyle: JSX.CSSProperties = {
  marginTop: '10px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
};

const MICRO_GRID_DIMENSION = 16;
const MICRO_TILE_SIZE = 8;
const MICRO_TILE_GAP = 1;
const MICRO_GRID_PADDING = 6;
const MICRO_GRID_OUTER_SIZE =
  MICRO_GRID_DIMENSION * MICRO_TILE_SIZE +
  (MICRO_GRID_DIMENSION - 1) * MICRO_TILE_GAP +
  MICRO_GRID_PADDING * 2;
const FLEE_BOX_WIDTH = 138;
const FLEE_BOX_HEIGHT = 28;
const FLEE_TRIGGER_RADIUS = 9999;
const FLEE_MIN_RADIUS = 0.001;
const FLEE_MAX_PUSH = 72;

const tinyGridStyle: JSX.CSSProperties = {
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

const chartGridStyle: JSX.CSSProperties = {
  marginTop: '8px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
};

const smallMutedStyle: JSX.CSSProperties = {
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
  fontFamily: 'monospace',
  fontSize: '12px',
};

const REQUIRED_REPORT_FILE_ID = 'q3-real-report';
const REQUIRED_REPORT_FILE_NAME =
  'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.png';
const REQUIRED_REPORT_FILE_TYPE = 'pngFile';
const PORTAL_RESET_EMAIL_ID = 'corp-password-reset-link';
const PORTAL_RESET_EVENT_ID = 'portal:password-reset:sent';

type StroopColor = { name: string; css: string };

const STROOP_COLORS: StroopColor[] = [
  { name: 'red', css: '#c00000' },
  { name: 'green', css: '#2f9f2f' },
  { name: 'blue', css: '#1f4ad1' },
  { name: 'yellow', css: '#b39600' },
  { name: 'purple', css: '#6b2f9f' },
  { name: 'orange', css: '#c96b00' },
];

type CaptchaId =
  | 'stroop_trap'
  | 'micro_pixel_grid'
  | 'bear_market'
  | 'fleeing_checkbox'
  | 'circle_game';

type MarketChart = {
  id: string;
  points: number[];
  bearish: boolean;
};

const CAPTCHA_LIVES_TOTAL = 3;

const marketCharts: MarketChart[] = [
  { id: 'ch-1', points: [12.2, 12.1, 12.25, 12.0, 11.95, 11.9], bearish: true },
  {
    id: 'ch-2',
    points: [10.4, 10.55, 10.5, 10.65, 10.6, 10.75],
    bearish: false,
  },
  { id: 'ch-3', points: [13.1, 13.0, 13.05, 12.9, 12.85, 12.8], bearish: true },
  { id: 'ch-4', points: [9.8, 9.7, 9.85, 9.75, 9.9, 9.95], bearish: false },
  {
    id: 'ch-5',
    points: [11.5, 11.45, 11.35, 11.4, 11.25, 11.2],
    bearish: true,
  },
  { id: 'ch-6', points: [8.9, 8.95, 8.85, 9.0, 8.95, 9.05], bearish: false },
  {
    id: 'ch-7',
    points: [12.7, 12.65, 12.7, 12.5, 12.45, 12.35],
    bearish: true,
  },
  {
    id: 'ch-8',
    points: [10.9, 10.8, 10.95, 10.9, 11.0, 11.05],
    bearish: false,
  },
  { id: 'ch-9', points: [11.9, 12.0, 11.85, 11.8, 11.75, 11.7], bearish: true },
];

const crosswalkTargetCells = (() => {
  const cells = new Set<number>();
  let x = 0x96f00d;
  while (cells.size < 45) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const idx = x % 256;
    cells.add(idx);
  }
  return cells;
})();

const pickThree = <T,>(items: T[], seed: number): T[] => {
  const arr = [...items];
  let x = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr.slice(0, 3);
};

const shuffleWithSeed = <T,>(items: T[], seed: number): T[] => {
  const arr = [...items];
  let x = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j] as T;
    arr[j] = tmp as T;
  }
  return arr;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const toCircleAccuracy = (points: { x: number; y: number }[]): number => {
  if (points.length < 24) return 0;
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const radii = points.map((p) => Math.hypot(p.x - cx, p.y - cy));
  const mean = radii.reduce((sum, r) => sum + r, 0) / radii.length;
  if (mean <= 1) return 0;
  const variance =
    radii.reduce((sum, r) => sum + (r - mean) * (r - mean), 0) / radii.length;
  const stdDev = Math.sqrt(variance);
  const start = points[0];
  const end = points[points.length - 1];
  if (!start || !end) return 0;
  const closurePenalty = Math.hypot(end.x - start.x, end.y - start.y) / mean;
  const wobblePenalty = stdDev / mean;
  const raw = 100 - wobblePenalty * 180 - closurePenalty * 40;
  return Math.round(clamp(raw, 0, 100));
};

const MarketChartTile: FunctionComponent<{ chart: MarketChart }> = ({
  chart,
}) => {
  const maxY = Math.max(...chart.points);
  const minY = Math.min(...chart.points);
  const spread = Math.max(1, maxY - minY);
  const plotPoints = chart.points.map((value, index) => {
    const x = 8 + index * 16;
    const y = 56 - ((value - minY) / spread) * 42;
    return { x, y, value };
  });

  return (
    <svg width="100%" height="72" viewBox="0 0 96 64">
      <rect x="0" y="0" width="96" height="64" fill="#ffffff" />
      <line x1="0" y1="56" x2="96" y2="56" stroke="#909090" strokeWidth="1" />
      <line x1="8" y1="0" x2="8" y2="64" stroke="#909090" strokeWidth="1" />
      {plotPoints.slice(0, -1).map((point, index) => {
        const next = plotPoints[index + 1];
        if (!next) return null;
        const delta = next.value - point.value;
        const stroke =
          delta > 0 ? '#0a8a0a' : delta < 0 ? '#b00000' : '#666666';
        return (
          <line
            key={`${chart.id}-seg-${index}`}
            x1={point.x}
            y1={point.y}
            x2={next.x}
            y2={next.y}
            stroke={stroke}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
};

const PixelHeart: FunctionComponent<{ lost?: boolean }> = ({
  lost = false,
}) => {
  const fill = lost ? '#8a8a8a' : '#c00000';
  const shadow = lost ? '#5b5b5b' : '#7c0000';
  return (
    <svg
      width="24"
      height="22"
      viewBox="0 0 24 22"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path
        d="M3 2 H9 V4 H11 V2 H21 V8 H19 V10 H17 V12 H15 V14 H13 V16 H11 V14 H9 V12 H7 V10 H5 V8 H3 Z"
        fill={fill}
        stroke="#000000"
        strokeWidth="1"
      />
      <rect x="5" y="4" width="2" height="2" fill={shadow} />
      <rect x="15" y="4" width="2" height="2" fill={shadow} />
      <rect x="11" y="14" width="2" height="1" fill="#000000" />
    </svg>
  );
};

const PortalApp: FunctionComponent<AppProps> = ({ closeWindow }: AppProps) => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    rebootGame,
    setFlags,
    setStage,
  } = useGameState();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState(getPortalLoginEmail());
  const [loginPassword, setLoginPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [captchaStatus, setCaptchaStatus] = useState<string | null>(null);
  const [captchaSeed, setCaptchaSeed] = useState<number>(() => Date.now());
  const [captchaSteps, setCaptchaSteps] = useState<CaptchaId[]>(() =>
    pickThree<CaptchaId>(
      [
        'stroop_trap',
        'micro_pixel_grid',
        'bear_market',
        'fleeing_checkbox',
        'circle_game',
      ],
      Date.now()
    )
  );
  const [captchaIdx, setCaptchaIdx] = useState(0);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [captchaLivesRemaining, setCaptchaLivesRemaining] = useState(
    CAPTCHA_LIVES_TOTAL
  );

  const [stroopMode, setStroopMode] = useState<'background' | 'ink'>(
    'background'
  );
  const [stroopInput, setStroopInput] = useState('');
  const [stroopWord, setStroopWord] = useState('BLUE');
  const [stroopInkColor, setStroopInkColor] = useState<StroopColor>(
    STROOP_COLORS[0] ?? { name: 'red', css: '#c00000' }
  );
  const [stroopBgColor, setStroopBgColor] = useState<StroopColor>(
    STROOP_COLORS[1] ?? { name: 'green', css: '#2f9f2f' }
  );
  const [microSelections, setMicroSelections] = useState<Set<number>>(
    new Set()
  );
  const [bearOrder, setBearOrder] = useState<MarketChart[]>([]);
  const [bearSelections, setBearSelections] = useState<Set<string>>(new Set());
  const [fleeCheckboxPos, setFleeCheckboxPos] = useState({ x: 85, y: 48 });
  const [circlePoints, setCirclePoints] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [isCircleDrawing, setIsCircleDrawing] = useState(false);
  const [circleAccuracy, setCircleAccuracy] = useState<number | null>(null);
  const circleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const captchaStep = captchaSteps[captchaIdx] ?? null;

  const resetCaptchas = (nextSeed?: number) => {
    const seed = nextSeed ?? Date.now();
    setCaptchaSeed(seed);
    setCaptchaSteps(
      pickThree<CaptchaId>(
        [
          'stroop_trap',
          'micro_pixel_grid',
          'bear_market',
          'fleeing_checkbox',
          'circle_game',
        ],
        seed
      )
    );
    setCaptchaIdx(0);
    setCaptchaPassed(false);
    setCaptchaStatus(null);
    setStroopInput('');
    setMicroSelections(new Set());
    setBearSelections(new Set());
    setCirclePoints([]);
    setCircleAccuracy(null);
  };

  const failCaptcha = (message: string) => {
    playErrorSfx();
    const nextLives = captchaLivesRemaining - 1;
    if (nextLives <= 0) {
      setCaptchaLivesRemaining(0);
      setCaptchaStatus('Verification failed. Security lockout engaged.');
      window.setTimeout(() => rebootGame(), 700);
      return;
    }
    setCaptchaLivesRemaining(nextLives);
    setCaptchaStatus(`${message} Life lost. Restarting verification...`);
    window.setTimeout(() => resetCaptchas(Date.now()), 650);
  };

  const passStep = () => {
    setCaptchaStatus(null);
    if (captchaIdx >= 2) {
      setCaptchaPassed(true);
      recordCheckpoint('portal_captcha_cleared');
      return;
    }
    setCaptchaIdx((i) => i + 1);
  };

  useEffect(() => {
    if (!captchaStep) return;
    setCaptchaStatus(null);
    if (captchaStep === 'stroop_trap') {
      setStroopMode(
        (captchaSeed + captchaIdx) % 2 === 0 ? 'background' : 'ink'
      );
      setStroopInput('');
      const wordColor =
        STROOP_COLORS[(captchaSeed >>> 1) % STROOP_COLORS.length];
      const inkColor =
        STROOP_COLORS[(captchaSeed >>> 4) % STROOP_COLORS.length];
      let bgColor = STROOP_COLORS[(captchaSeed >>> 7) % STROOP_COLORS.length];
      if (bgColor?.name === inkColor?.name) {
        const inkIndex = STROOP_COLORS.findIndex(
          (color) => color.name === inkColor?.name
        );
        bgColor =
          STROOP_COLORS[(inkIndex + 1) % STROOP_COLORS.length] ??
          STROOP_COLORS[0];
      }
      setStroopWord((wordColor?.name ?? 'blue').toUpperCase());
      setStroopInkColor(inkColor ?? STROOP_COLORS[0]);
      setStroopBgColor(bgColor ?? STROOP_COLORS[1]);
    }
    if (captchaStep === 'micro_pixel_grid') {
      setMicroSelections(new Set());
    }
    if (captchaStep === 'bear_market') {
      setBearOrder(
        shuffleWithSeed(marketCharts, captchaSeed + captchaIdx * 77)
      );
      setBearSelections(new Set());
    }
    if (captchaStep === 'fleeing_checkbox') {
      setFleeCheckboxPos({ x: 85, y: 48 });
    }
    if (captchaStep === 'circle_game') {
      setCirclePoints([]);
      setCircleAccuracy(null);
      setIsCircleDrawing(false);
    }
  }, [captchaIdx, captchaSeed, captchaStep]);

  const desktopFiles = useMemo<ShellItem[]>(() => {
    return getDynamicDesktopItems(flags).filter((item) => item.type === 'file');
  }, [flags]);

  const selectedFile = useMemo(() => {
    return desktopFiles.find((f) => f.id === selectedFileId) ?? null;
  }, [desktopFiles, selectedFileId]);

  const isCorrectFileSelected = useMemo(() => {
    if (!selectedFile) return false;
    if (selectedFile.type !== 'file') return false;
    if (selectedFile.id === REQUIRED_REPORT_FILE_ID) {
      return selectedFile.fileTypeId === REQUIRED_REPORT_FILE_TYPE;
    }
    return (
      selectedFile.name === REQUIRED_REPORT_FILE_NAME &&
      selectedFile.fileTypeId === REQUIRED_REPORT_FILE_TYPE
    );
  }, [selectedFile]);

  const canSubmit = useMemo(() => {
    return (
      flags.hasFinalReportFile &&
      !flags.hasSubmittedFinalReport &&
      !!selectedFile &&
      isCorrectFileSelected &&
      captchaPassed
    );
  }, [
    flags.hasFinalReportFile,
    flags.hasSubmittedFinalReport,
    isCorrectFileSelected,
    selectedFile,
    captchaPassed,
  ]);

  const handleSubmit = () => {
    if (flags.hasSubmittedFinalReport) return;
    if (isSubmitting) return;
    if (!selectedFile) {
      setStatus('Select a file to upload.');
      return;
    }
    if (!isCorrectFileSelected) {
      setStatus('Upload rejected: final document must be a PNG file.');
      return;
    }
    if (!captchaPassed) {
      setStatus('Complete human verification before submitting.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Uploading document...');

    window.setTimeout(() => {
      setFlags({ hasSubmittedFinalReport: true });
      markRunSubmitted();
      setStatus('Submission accepted. You beat the deadline.');
      setIsSubmitting(false);

      window.setTimeout(() => {
        setStage('win');
        closeWindow();
      }, 700);
    }, 900);
  };

  useEffect(() => {
    if (captchaStep !== 'circle_game') return;
    const canvas = circleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (circlePoints.length === 0) {
      ctx.strokeStyle = '#c0c0c0';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (circlePoints.length > 1) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(circlePoints[0]?.x ?? 0, circlePoints[0]?.y ?? 0);
      for (let i = 1; i < circlePoints.length; i += 1) {
        const p = circlePoints[i];
        if (!p) continue;
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }, [captchaStep, circlePoints]);

  const getCanvasPoint = (
    event: JSX.TargetedPointerEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  };

  const handlePortalLogin = () => {
    setAuthStatus(null);
    if (!hasPortalPassword()) {
      setAuthStatus(
        'No active password is set. Use Reset Password to receive a link in Spam.'
      );
      return;
    }
    if (!validatePortalCredentials(loginEmail, loginPassword)) {
      setAuthStatus('Invalid email or password.');
      return;
    }
    setIsAuthenticated(true);
  };

  const handleSendResetLink = () => {
    const normalized = resetEmail.trim().toLowerCase();
    const hasEmailShape = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized);
    if (!hasEmailShape) {
      setResetStatus('Enter a valid email address.');
      return;
    }

    requestPortalPasswordReset(normalized);
    setLoginEmail(normalized);
    setResetStatus('Email reset sent.');

    if (hasEventFired(PORTAL_RESET_EVENT_ID)) return;
    markEventFired(PORTAL_RESET_EVENT_ID);
    gameEventBus.emit('email:delivered', { emailId: PORTAL_RESET_EMAIL_ID });
    recordCheckpoint('email_sent');
  };

  return (
    <div style={panelStyle}>
      {!isAuthenticated && (
        <div>
          <div style={{ fontWeight: 700 }}>CorpPortal Sign-In</div>
          <div style={{ marginTop: '8px', ...smallMutedStyle }}>
            Enter portal email and password to continue.
          </div>
          <div style={{ marginTop: '10px' }}>
            <div>Email</div>
            <input
              style={textInputStyle}
              value={loginEmail}
              onInput={(event) =>
                setLoginEmail(
                  (event.currentTarget as HTMLInputElement).value ?? ''
                )
              }
              placeholder="email@domain.com"
            />
          </div>
          <div style={{ marginTop: '8px' }}>
            <div>Password</div>
            <input
              type="password"
              style={textInputStyle}
              value={loginPassword}
              onInput={(event) =>
                setLoginPassword(
                  (event.currentTarget as HTMLInputElement).value ?? ''
                )
              }
              placeholder="password"
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <button
              style={buttonStyle}
              type="button"
              onClick={handlePortalLogin}
            >
              Sign In
            </button>
            <button onClick={closeWindow} style={buttonStyle} type="button">
              Close
            </button>
          </div>
          {authStatus && <div style={{ marginTop: '8px' }}>{authStatus}</div>}

          <div style={{ marginTop: '14px', ...captchaPanelStyle }}>
            <div style={{ fontWeight: 700 }}>Reset Password</div>
            <div style={{ marginTop: '6px', ...smallMutedStyle }}>
              Enter an email to send reset link. Link will be delivered to Spam.
            </div>
            <div style={{ marginTop: '8px' }}>
              <input
                style={textInputStyle}
                value={resetEmail}
                onInput={(event) =>
                  setResetEmail(
                    (event.currentTarget as HTMLInputElement).value ?? ''
                  )
                }
                placeholder="email@domain.com"
              />
            </div>
            <div style={{ marginTop: '8px' }}>
              <button
                style={buttonStyle}
                type="button"
                onClick={handleSendResetLink}
              >
                Send Reset Link
              </button>
            </div>
            {resetStatus && (
              <div style={{ marginTop: '8px' }}>{resetStatus}</div>
            )}
          </div>
        </div>
      )}
      {isAuthenticated && (
        <div>
          <div style={{ fontWeight: 700 }}>CorpPortal</div>
          <div style={{ marginTop: '8px' }}>
            Destination:{' '}
            <span style={{ fontFamily: 'monospace' }}>boss@10.0.0.1</span>
          </div>

          <div style={{ marginTop: '10px' }}>
            <div>Required file:</div>
            <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
              {REQUIRED_REPORT_FILE_NAME} (must be .png)
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <div>Select file to upload:</div>
            <div style={{ marginTop: '6px', width: '100%', maxWidth: '520px' }}>
              <Dropdown
                id="portal-file-select"
                selected={selectedFileId}
                disabled={flags.hasSubmittedFinalReport || isSubmitting}
                onChange={(value) => {
                  setSelectedFileId(value);
                  setStatus(null);
                }}
                options={[
                  { value: '', label: '(choose a file)' },
                  ...desktopFiles.map((file) => ({
                    value: file.id,
                    label: file.name,
                  })),
                ]}
              />
            </div>
            {selectedFile && (
              <div style={{ marginTop: '6px' }}>
                Selected:{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {selectedFile.name}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '12px' }}>
            <button
              onClick={handleSubmit}
              style={
                canSubmit && !isSubmitting ? buttonStyle : disabledButtonStyle
              }
              disabled={flags.hasSubmittedFinalReport || isSubmitting}
              type="button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button onClick={closeWindow} style={buttonStyle} type="button">
              Close
            </button>
          </div>

          {!flags.hasSubmittedFinalReport && (
            <div style={captchaPanelStyle}>
              <div style={{ fontWeight: 700 }}>
                Human Verification (
                {captchaPassed ? 'complete' : `step ${captchaIdx + 1}/3`})
              </div>
              <div style={{ marginTop: '6px', ...smallMutedStyle }}>
                Failing any step restarts verification.
              </div>
              <div
                style={{
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {Array.from(
                  { length: CAPTCHA_LIVES_TOTAL },
                  (_unused, index) => (
                    <PixelHeart
                      key={`captcha-heart-${index}`}
                      lost={index >= captchaLivesRemaining}
                    />
                  )
                )}
              </div>

              {!captchaPassed && captchaStep === 'stroop_trap' && (
                <div style={{ marginTop: '10px' }}>
                  <div>
                    {stroopMode === 'background'
                      ? 'Type the background color.'
                      : 'Type the ink color.'}
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      width: '240px',
                      padding: '18px 10px',
                      textAlign: 'center',
                      fontWeight: 700,
                      color: stroopInkColor.css,
                      backgroundColor: stroopBgColor.css,
                      boxShadow: 'var(--border-field)',
                      userSelect: 'none',
                    }}
                  >
                    {stroopWord}
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      style={textInputStyle}
                      value={stroopInput}
                      onInput={(event) =>
                        setStroopInput(
                          (event.currentTarget as HTMLInputElement).value ?? ''
                        )
                      }
                      placeholder={
                        stroopMode === 'background'
                          ? 'Background color...'
                          : 'Ink color...'
                      }
                    />
                    <button
                      style={buttonStyle}
                      type="button"
                      onClick={() => {
                        const answer = stroopInput.trim().toLowerCase();
                        const expected =
                          stroopMode === 'background'
                            ? stroopBgColor.name
                            : stroopInkColor.name;
                        if (answer === expected) passStep();
                        else failCaptcha('Wrong color interpretation.');
                      }}
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}

              {!captchaPassed && captchaStep === 'micro_pixel_grid' && (
                <div style={{ marginTop: '10px' }}>
                  <div>Select all required tiles in this 16x16 grid.</div>
                  <div style={{ marginTop: '6px', ...smallMutedStyle }}>
                    Selected: {microSelections.size} / 45
                  </div>
                  <div style={tinyGridStyle}>
                    {Array.from(
                      { length: MICRO_GRID_DIMENSION * MICRO_GRID_DIMENSION },
                      (_unused, idx) => {
                        const isCrosswalk = crosswalkTargetCells.has(idx);
                        const isSelected = microSelections.has(idx);
                        return (
                          <button
                            key={`micro-${idx}`}
                            type="button"
                            onClick={() => {
                              if (!isCrosswalk) {
                                failCaptcha('Wrong tile selected.');
                                return;
                              }
                              setMicroSelections((current) => {
                                const next = new Set(current);
                                if (next.has(idx)) next.delete(idx);
                                else next.add(idx);
                                return next;
                              });
                            }}
                            style={{
                              width: `${MICRO_TILE_SIZE}px`,
                              height: `${MICRO_TILE_SIZE}px`,
                              border: 'none',
                              padding: 0,
                              backgroundColor: isSelected
                                ? '#3b6cff'
                                : isCrosswalk
                                ? '#f4f4f4'
                                : '#636363',
                              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.22)',
                            }}
                            aria-label="micro-grid-cell"
                          />
                        );
                      }
                    )}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      style={buttonStyle}
                      type="button"
                      onClick={() => {
                        const exactlyMatches =
                          microSelections.size === crosswalkTargetCells.size &&
                          [...crosswalkTargetCells].every((idx) =>
                            microSelections.has(idx)
                          );
                        if (exactlyMatches) passStep();
                        else failCaptcha('Required tile selection incomplete.');
                      }}
                    >
                      Verify Grid
                    </button>
                  </div>
                </div>
              )}

              {!captchaPassed && captchaStep === 'bear_market' && (
                <div style={{ marginTop: '10px' }}>
                  <div>Select all squares indicating a bearish trend.</div>
                  <div style={chartGridStyle}>
                    {bearOrder.map((chart) => {
                      const selected = bearSelections.has(chart.id);
                      return (
                        <button
                          key={chart.id}
                          type="button"
                          onClick={() => {
                            setBearSelections((current) => {
                              const next = new Set(current);
                              if (next.has(chart.id)) next.delete(chart.id);
                              else next.add(chart.id);
                              return next;
                            });
                          }}
                          style={{
                            border: 'none',
                            padding: '4px',
                            backgroundColor: selected ? '#c9d7ff' : '#e3e3e3',
                            boxShadow:
                              'var(--border-raised-outer), var(--border-raised-inner)',
                          }}
                        >
                          <MarketChartTile chart={chart} />
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <button
                      style={buttonStyle}
                      type="button"
                      onClick={() => {
                        const bearishIds = new Set(
                          bearOrder
                            .filter((chart) => chart.bearish)
                            .map((chart) => chart.id)
                        );
                        const exact =
                          bearSelections.size === bearishIds.size &&
                          [...bearishIds].every((id) => bearSelections.has(id));
                        if (exact) passStep();
                        else failCaptcha('Incorrect market trend picks.');
                      }}
                    >
                      Verify Charts
                    </button>
                  </div>
                </div>
              )}

              {!captchaPassed && captchaStep === 'fleeing_checkbox' && (
                <div style={{ marginTop: '10px' }}>
                  <div>
                    Click <em>I am not a robot</em>.
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      maxWidth: '520px',
                      height: '240px',
                      position: 'relative',
                      backgroundColor: '#ffffff',
                      boxShadow: 'var(--border-field)',
                      overflow: 'hidden',
                    }}
                    onMouseMove={(event) => {
                      const area = event.currentTarget as HTMLDivElement;
                      const bounds = area.getBoundingClientRect();
                      const mx = event.clientX - bounds.left;
                      const my = event.clientY - bounds.top;
                      setFleeCheckboxPos((prev) => {
                        const areaWidth = Math.max(
                          bounds.width,
                          FLEE_BOX_WIDTH + 1
                        );
                        const areaHeight = Math.max(
                          bounds.height,
                          FLEE_BOX_HEIGHT + 1
                        );
                        const centerX = prev.x + FLEE_BOX_WIDTH / 2;
                        const centerY = prev.y + FLEE_BOX_HEIGHT / 2;
                        const dx = centerX - mx;
                        const dy = centerY - my;
                        const distance = Math.hypot(dx, dy);
                        if (
                          distance > FLEE_TRIGGER_RADIUS ||
                          distance < FLEE_MIN_RADIUS
                        ) {
                          return prev;
                        }
                        const push =
                          ((FLEE_TRIGGER_RADIUS - distance) /
                            FLEE_TRIGGER_RADIUS) *
                          FLEE_MAX_PUSH;
                        const jitter = ((mx + my + distance) % 2) * 18 - 9;
                        const nx = prev.x + (dx / distance) * push;
                        const ny = prev.y + (dy / distance) * push + jitter;
                        return {
                          x: clamp(nx, 0, areaWidth - FLEE_BOX_WIDTH),
                          y: clamp(ny, 0, areaHeight - FLEE_BOX_HEIGHT),
                        };
                      });
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => passStep()}
                      style={{
                        position: 'absolute',
                        left: `${fleeCheckboxPos.x}px`,
                        top: `${fleeCheckboxPos.y}px`,
                        marginRight: 0,
                        border: 'none',
                        backgroundColor: 'var(--surface)',
                        boxShadow:
                          'var(--border-raised-outer), var(--border-raised-inner)',
                        padding: '6px 8px',
                        fontSize: '12px',
                        fontFamily: 'sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#ffffff',
                          boxShadow: 'var(--border-field)',
                        }}
                      />
                      I am not a robot
                    </button>
                  </div>
                </div>
              )}

              {!captchaPassed && captchaStep === 'circle_game' && (
                <div style={{ marginTop: '10px' }}>
                  <div>Draw a circle above 80% accuracy.</div>
                  <canvas
                    ref={circleCanvasRef}
                    width={220}
                    height={220}
                    style={{
                      marginTop: '8px',
                      width: '220px',
                      height: '220px',
                      backgroundColor: '#ffffff',
                      boxShadow: 'var(--border-field)',
                      touchAction: 'none',
                    }}
                    onPointerDown={(event) => {
                      const point = getCanvasPoint(event);
                      setCirclePoints([point]);
                      setIsCircleDrawing(true);
                      setCircleAccuracy(null);
                    }}
                    onPointerMove={(event) => {
                      if (!isCircleDrawing) return;
                      const point = getCanvasPoint(event);
                      setCirclePoints((current) => [...current, point]);
                    }}
                    onPointerUp={() => {
                      setIsCircleDrawing(false);
                    }}
                    onPointerLeave={() => {
                      setIsCircleDrawing(false);
                    }}
                  />
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <button
                      style={buttonStyle}
                      type="button"
                      onClick={() => {
                        const accuracy = toCircleAccuracy(circlePoints);
                        setCircleAccuracy(accuracy);
                        if (accuracy >= 80) passStep();
                        else
                          failCaptcha(
                            `Circle accuracy ${accuracy}%. Need 80%+.`
                          );
                      }}
                    >
                      Verify Circle
                    </button>
                    <span style={{ fontFamily: 'monospace' }}>
                      Accuracy: {circleAccuracy ?? '--'}%
                    </span>
                  </div>
                </div>
              )}

              {captchaStatus && (
                <div style={{ marginTop: '10px' }}>{captchaStatus}</div>
              )}
              {!captchaPassed && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    style={buttonStyle}
                    type="button"
                    onClick={() => resetCaptchas(Date.now())}
                  >
                    Restart Verification
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '12px', minHeight: '18px' }}>
            {flags.hasSubmittedFinalReport ? (
              <span>Already submitted.</span>
            ) : (
              <span
                style={{
                  color: !flags.hasFinalReportFile
                    ? 'maroon'
                    : selectedFileId && !isCorrectFileSelected
                    ? 'maroon'
                    : 'inherit',
                }}
              >
                {!flags.hasFinalReportFile
                  ? 'Missing required file. Extract the archive first.'
                  : !selectedFileId
                  ? 'Select the correct file to enable upload.'
                  : isCorrectFileSelected
                  ? 'Ready to submit.'
                  : 'Incorrect file selected (must be the final report in PNG format).'}
              </span>
            )}
          </div>

          {status && <div style={{ marginTop: '6px' }}>{status}</div>}
        </div>
      )}
    </div>
  );
};

export default PortalApp;
