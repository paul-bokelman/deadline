import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { getDynamicDesktopItems } from '../../system/desktop/dynamicDesktopItems';
import { useGameState } from '../../game/state';
import { AppProps } from '../../types/App';
import { ShellItem } from '../../types/Shell';
import Icon from '../../components/shared/Icon/Icon';

const panelStyle: JSX.CSSProperties = {
  margin: '8px',
  padding: '10px',
  backgroundColor: 'var(--button-highlight)',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
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

const selectStyle: JSX.CSSProperties = {
  marginTop: '6px',
  width: '100%',
  maxWidth: '520px',
};

const REQUIRED_REPORT_FILE_ID = 'q3-real-report';
const REQUIRED_REPORT_FILE_NAME = 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_REAL_v3.txt';

type CaptchaId =
  | 'mailbox_system'
  | 'wingdings_letters'
  | 'audio_goose_word'
  | 'audio_jungle_animal'
  | 'clock_time'
  | 'slider_96'
  | 'color_pick';

type CaptchaResult = { ok: true } | { ok: false; message: string };

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

const choiceGridStyle: JSX.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginTop: '8px',
};

const smallMutedStyle: JSX.CSSProperties = {
  color: 'var(--button-shadow)',
  textShadow: '1px 1px 0 var(--button-highlight)',
  fontFamily: 'monospace',
  fontSize: '12px',
};

const pickThree = <T,>(items: T[], seed: number): T[] => {
  // deterministic-ish shuffle based on seed
  const arr = [...items];
  let x = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const j = x % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
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
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
};

const formatTime = (d: Date): string => {
  const hh = d.getHours();
  const mm = d.getMinutes();
  const hour12 = ((hh + 11) % 12) + 1;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  return `${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
};

const roundToNearest5Min = (d: Date): Date => {
  const rounded = new Date(d.getTime());
  const mins = rounded.getMinutes();
  const r = Math.round(mins / 5) * 5;
  rounded.setMinutes(r, 0, 0);
  return rounded;
};

const AnalogClock: FunctionComponent<{ time: Date }> = ({ time }) => {
  const w = 92;
  const cx = w / 2;
  const cy = w / 2;
  const radius = 38;
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const hourAngle = ((hours + minutes / 60) * 30 - 90) * (Math.PI / 180);
  const minAngle = (minutes * 6 - 90) * (Math.PI / 180);
  const hourLen = 18;
  const minLen = 28;
  const hx = cx + Math.cos(hourAngle) * hourLen;
  const hy = cy + Math.sin(hourAngle) * hourLen;
  const mx = cx + Math.cos(minAngle) * minLen;
  const my = cy + Math.sin(minAngle) * minLen;

  return (
    <svg
      width={w}
      height={w}
      viewBox={`0 0 ${w} ${w}`}
      style={{
        backgroundColor: '#ffffff',
        boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
      }}
    >
      <circle cx={cx} cy={cy} r={radius} fill="#f8f8f8" stroke="#000" />
      {/* no ticks by design */}
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#000" stroke-width="3" />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#000" stroke-width="2" />
      <circle cx={cx} cy={cy} r="2" fill="#000" />
    </svg>
  );
};

const playSpokenCaptcha = async (text: string): Promise<CaptchaResult> => {
  // Must be triggered from user gesture to reliably play.
  if (!('speechSynthesis' in window)) {
    return { ok: false, message: 'Speech synthesis not available in this browser.' };
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0;
  utter.pitch = 1.0;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
  return { ok: true };
};

const PortalApp: FunctionComponent<AppProps> = ({ closeWindow }: AppProps) => {
  const { flags, setFlags, setStage } = useGameState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [captchaStatus, setCaptchaStatus] = useState<string | null>(null);
  const [captchaSeed, setCaptchaSeed] = useState<number>(() => Date.now());
  const [captchaSteps, setCaptchaSteps] = useState<CaptchaId[]>(() =>
    pickThree<CaptchaId>(
      [
        'mailbox_system',
        'wingdings_letters',
        'audio_goose_word',
        'audio_jungle_animal',
        'clock_time',
        'slider_96',
        'color_pick',
      ],
      Date.now()
    )
  );
  const [captchaIdx, setCaptchaIdx] = useState(0);
  const [captchaPassed, setCaptchaPassed] = useState(false);

  // Captcha local states
  const [mailboxPhase, setMailboxPhase] = useState<'ask' | 'system'>('ask');
  const [wingTarget, setWingTarget] = useState('GJ7');
  const [wingInput, setWingInput] = useState('');
  const [wingGlyphs, setWingGlyphs] = useState<string[]>([]);
  const [audioExpected, setAudioExpected] = useState<string>('HONK');
  const [audioInput, setAudioInput] = useState('');
  const [clockOptions, setClockOptions] = useState<Date[]>([]);
  const [clockCorrectIndex, setClockCorrectIndex] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [colorTargetIndex, setColorTargetIndex] = useState<number>(0);
  const [colorOrder, setColorOrder] = useState<number[]>([]);

  const captchaStep = captchaSteps[captchaIdx] ?? null;

  const resetCaptchas = (nextSeed?: number) => {
    const seed = nextSeed ?? Date.now();
    setCaptchaSeed(seed);
    setCaptchaSteps(
      pickThree<CaptchaId>(
        [
          'mailbox_system',
          'wingdings_letters',
          'audio_goose_word',
          'audio_jungle_animal',
          'clock_time',
          'slider_96',
          'color_pick',
        ],
        seed
      )
    );
    setCaptchaIdx(0);
    setCaptchaPassed(false);
    setCaptchaStatus(null);
    // reset per-captcha UI
    setMailboxPhase('ask');
    setWingInput('');
    setAudioInput('');
    setSliderValue(0);
  };

  const failCaptcha = (message: string) => {
    setCaptchaStatus(`${message} Restarting verification...`);
    window.setTimeout(() => resetCaptchas(Date.now()), 600);
  };

  const passStep = () => {
    setCaptchaStatus(null);
    if (captchaIdx >= 2) {
      setCaptchaPassed(true);
      return;
    }
    setCaptchaIdx((i) => i + 1);
  };

  // Recompute per-step randomized targets when step changes / seed changes.
  useEffect(() => {
    if (!captchaStep) return;
    // mailbox/system
    if (captchaStep === 'mailbox_system') {
      setMailboxPhase('ask');
    }
    // wingdings letters
    if (captchaStep === 'wingdings_letters') {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const a = alphabet[(captchaSeed >>> 3) % alphabet.length];
      const b = alphabet[(captchaSeed >>> 9) % alphabet.length];
      const c = alphabet[(captchaSeed >>> 15) % alphabet.length];
      const target = `${a}${b}${c}`;
      setWingTarget(target);
      setWingInput('');
      // Make this captcha actually solvable without external wingdings knowledge:
      // show the glyphs, and also show a small "decode strip" for just these glyphs.
      setWingGlyphs(target.split(''));
    }
    // audio goose word
    if (captchaStep === 'audio_goose_word') {
      setAudioExpected('HONK');
      setAudioInput('');
    }
    // audio jungle animal
    if (captchaStep === 'audio_jungle_animal') {
      const animals = ['MONKEY', 'TIGER', 'SNAKE', 'PARROT'];
      const pick = animals[(captchaSeed >>> 7) % animals.length] ?? 'MONKEY';
      setAudioExpected(pick);
      setAudioInput('');
    }
    // clock time
    if (captchaStep === 'clock_time') {
      const now = roundToNearest5Min(new Date());
      const opt0 = new Date(now.getTime());
      const opt1 = new Date(now.getTime() + 5 * 60 * 1000);
      const opt2 = new Date(now.getTime() - 5 * 60 * 1000);
      const opts = [opt0, opt1, opt2];
      // shuffle
      const shuffled = pickThree(opts, captchaSeed);
      const correct = shuffled.findIndex((d) => d.getTime() === opt0.getTime());
      setClockOptions(shuffled);
      setClockCorrectIndex(correct < 0 ? 0 : correct);
    }
    if (captchaStep === 'slider_96') {
      setSliderValue(0);
    }
    if (captchaStep === 'color_pick') {
      const order = shuffleWithSeed([0, 1, 2, 3], captchaSeed);
      // color index 2 is blue in our palette below; find where it landed
      const target = Math.max(0, order.findIndex((c) => c === 2));
      setColorOrder(order);
      setColorTargetIndex(target);
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
    if (selectedFile.id === REQUIRED_REPORT_FILE_ID) return true;
    if (selectedFile.type !== 'file') return false;
    return selectedFile.name === REQUIRED_REPORT_FILE_NAME;
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
      setStatus('Upload rejected: incorrect document selected.');
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
      setStatus('Submission accepted. You beat the deadline.');
      setIsSubmitting(false);

      window.setTimeout(() => {
        setStage('win');
        closeWindow();
      }, 700);
    }, 900);
  };

  return (
    <div style={panelStyle}>
      <div style={{ fontWeight: 700 }}>Corp Submission Portal</div>
      <div style={{ marginTop: '8px' }}>
        Destination: <span style={{ fontFamily: 'monospace' }}>boss@10.0.0.1</span>
      </div>

      <div style={{ marginTop: '10px' }}>
        <div>Required file:</div>
        <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>
          {REQUIRED_REPORT_FILE_NAME}
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <div>Select file to upload:</div>
        <select
          onChange={(e) => {
            const next = (e.currentTarget as HTMLSelectElement).value;
            setSelectedFileId(next);
            setStatus(null);
          }}
          style={selectStyle}
          value={selectedFileId}
          disabled={flags.hasSubmittedFinalReport || isSubmitting}
        >
          <option value="">(choose a file)</option>
          {desktopFiles.map((file) => (
            <option key={file.id} value={file.id}>
              {file.name}
            </option>
          ))}
        </select>
        {selectedFile && (
          <div style={{ marginTop: '6px' }}>
            Selected: <span style={{ fontFamily: 'monospace' }}>{selectedFile.name}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px' }}>
        <button
          onClick={handleSubmit}
          style={canSubmit && !isSubmitting ? buttonStyle : disabledButtonStyle}
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
            Human Verification ({captchaPassed ? 'complete' : `step ${captchaIdx + 1}/3`})
          </div>
          <div style={{ marginTop: '6px', ...smallMutedStyle }}>
            Failing any step restarts verification.
          </div>

          {!captchaPassed && captchaStep === 'mailbox_system' && (
            <div style={{ marginTop: '10px' }}>
              {mailboxPhase === 'ask' ? (
                <div>
                  <div>Captcha: Click the mailbox icon.</div>
                  <div style={choiceGridStyle}>
                    {/* Intentionally no mailbox */}
                    <button
                      style={{ ...buttonStyle, marginRight: 0 }}
                      type="button"
                      onClick={() => {
                        setMailboxPhase('system');
                        setCaptchaStatus('No mailbox found. Click the system icon to continue.');
                      }}
                    >
                      <Icon iconId="myComputer" size={16} /> My Computer
                    </button>
                    <button
                      style={{ ...buttonStyle, marginRight: 0 }}
                      type="button"
                      onClick={() => {
                        setMailboxPhase('system');
                        setCaptchaStatus('No mailbox found. Click the system icon to continue.');
                      }}
                    >
                      <Icon iconId="notepad" size={16} /> Notepad
                    </button>
                    <button
                      style={{ ...buttonStyle, marginRight: 0 }}
                      type="button"
                      onClick={() => {
                        setMailboxPhase('system');
                        setCaptchaStatus('No mailbox found. Click the system icon to continue.');
                      }}
                    >
                      <Icon iconId="calc" size={16} /> Calculator
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div>Captcha: Click the system icon to continue.</div>
                  <div style={choiceGridStyle}>
                    <button
                      style={{ ...buttonStyle, marginRight: 0 }}
                      type="button"
                      onClick={() => passStep()}
                    >
                      <Icon iconId="briefcase" size={16} /> System
                    </button>
                    <button
                      style={{ ...buttonStyle, marginRight: 0 }}
                      type="button"
                      onClick={() => failCaptcha('Incorrect icon.')}
                    >
                      <Icon iconId="msn" size={16} /> Network
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!captchaPassed && captchaStep === 'wingdings_letters' && (
            <div style={{ marginTop: '10px' }}>
              <div>Captcha: Type the letters you see.</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: 'var(--border-field)',
                    padding: '8px 10px',
                    fontFamily: 'Wingdings, \"Wingdings 2\", \"Zapf Dingbats\", serif',
                    fontSize: '22px',
                    letterSpacing: '3px',
                    userSelect: 'none',
                  }}
                >
                  {wingTarget}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ ...smallMutedStyle }}>
                    Decode strip:
                    <span
                      style={{
                        marginLeft: '8px',
                        fontFamily:
                          'Wingdings, "Wingdings 2", "Zapf Dingbats", serif',
                        fontSize: '18px',
                        letterSpacing: '3px',
                      }}
                    >
                      {wingGlyphs.join('')}
                    </span>
                    <span style={{ marginLeft: '8px' }}>→</span>
                    <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>
                      {wingGlyphs.join('')}
                    </span>
                  </div>
                  <div style={{ ...smallMutedStyle }}>
                    (Yes, this is stupid. Corporate requirement.)
                  </div>
                </div>
                <input
                  style={textInputStyle}
                  value={wingInput}
                  onInput={(e) =>
                    setWingInput((e.currentTarget as HTMLInputElement).value ?? '')
                  }
                  placeholder="Type here..."
                />
                <button
                  style={buttonStyle}
                  type="button"
                  onClick={() => {
                    const got = wingInput.trim().toUpperCase();
                    const expected = wingTarget.trim().toUpperCase();
                    if (got === expected) passStep();
                    else failCaptcha('Incorrect letters.');
                  }}
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {!captchaPassed &&
            (captchaStep === 'audio_goose_word' ||
              captchaStep === 'audio_jungle_animal') && (
              <div style={{ marginTop: '10px' }}>
                <div>
                  {captchaStep === 'audio_goose_word'
                    ? 'Audio captcha (4 seconds of a goose): what word is being said?'
                    : 'Audio captcha (jungle noises): what animal is this?'}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    style={buttonStyle}
                    type="button"
                    onClick={async () => {
                      // For now we use speech synthesis to keep it fully working without bundling large audio assets.
                      const phrase =
                        captchaStep === 'audio_goose_word'
                          ? 'honk'
                          : audioExpected.toLowerCase();
                      const res = await playSpokenCaptcha(phrase);
                      if (!res.ok) setCaptchaStatus(res.message);
                      else setCaptchaStatus('Audio played. Type your answer.');
                    }}
                  >
                    Play Audio
                  </button>
                  <input
                    style={textInputStyle}
                    value={audioInput}
                    onInput={(e) =>
                      setAudioInput((e.currentTarget as HTMLInputElement).value ?? '')
                    }
                    placeholder="Your answer..."
                  />
                  <button
                    style={buttonStyle}
                    type="button"
                    onClick={() => {
                      const got = audioInput.trim().toUpperCase();
                      const expected =
                        captchaStep === 'audio_goose_word' ? 'HONK' : audioExpected;
                      if (got === expected) passStep();
                      else failCaptcha('Incorrect answer.');
                    }}
                  >
                    Verify
                  </button>
                </div>
                <div style={{ marginTop: '6px', ...smallMutedStyle }}>
                  Tip: keep your volume up.
                </div>
              </div>
            )}

          {!captchaPassed && captchaStep === 'clock_time' && (
            <div style={{ marginTop: '10px' }}>
              <div>Captcha: Select the current time.</div>
              <div style={{ marginTop: '6px', ...smallMutedStyle }}>
                (Analog clocks have no ticks and are very close.)
              </div>
              <div style={choiceGridStyle}>
                {clockOptions.map((t, idx) => (
                  <button
                    key={t.getTime()}
                    style={{ ...buttonStyle, marginRight: 0, padding: '6px' }}
                    type="button"
                    onClick={() => {
                      if (idx === clockCorrectIndex) passStep();
                      else failCaptcha('Incorrect time.');
                    }}
                  >
                    <AnalogClock time={t} />
                    <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
                      {formatTime(t)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!captchaPassed && captchaStep === 'slider_96' && (
            <div style={{ marginTop: '10px' }}>
              <div>Captcha: Drag the slider to 96 exactly.</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderValue}
                  onInput={(e) => setSliderValue(Number((e.currentTarget as HTMLInputElement).value))}
                  style={{ width: '260px' }}
                />
                <div style={{ fontFamily: 'monospace', width: '80px' }}>{sliderValue}</div>
                <button
                  style={buttonStyle}
                  type="button"
                  onClick={() => {
                    if (sliderValue === 96) passStep();
                    else failCaptcha('Slider not at 96.');
                  }}
                >
                  Verify
                </button>
              </div>
              <div style={{ marginTop: '6px', ...smallMutedStyle }}>
                Hint: arrow keys work after you click the slider.
              </div>
            </div>
          )}

          {!captchaPassed && captchaStep === 'color_pick' && (
            <div style={{ marginTop: '10px' }}>
              <div>Captcha: Click the blue square.</div>
              <div style={choiceGridStyle}>
                {colorOrder.map((colorIdx, idx) => {
                  const colors = ['#b00000', '#007000', '#0000b0', '#b0b000'];
                  const color = colors[colorIdx] ?? '#000';
                  return (
                    <button
                      key={`c-${idx}`}
                      style={{
                        ...buttonStyle,
                        marginRight: 0,
                        width: '88px',
                        height: '64px',
                        padding: 0,
                        backgroundColor: color,
                      }}
                      type="button"
                      onClick={() => {
                        const isBlue = idx === colorTargetIndex;
                        if (isBlue) passStep();
                        else failCaptcha('Wrong color.');
                      }}
                      aria-label="color-choice"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {captchaStatus && <div style={{ marginTop: '10px' }}>{captchaStatus}</div>}
          {!captchaPassed && (
            <div style={{ marginTop: '10px' }}>
              <button style={buttonStyle} type="button" onClick={() => resetCaptchas(Date.now())}>
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
                  : 'Incorrect file selected.'}
          </span>
        )}
      </div>

      {status && <div style={{ marginTop: '6px' }}>{status}</div>}
    </div>
  );
};

export default PortalApp;

