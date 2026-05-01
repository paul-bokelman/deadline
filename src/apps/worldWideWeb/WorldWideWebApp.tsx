import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';
import { gameEventBus } from '../../game/events';
import { setPortalPassword } from '../../system/portalAuth/portalAuth';
import { recordCheckpoint } from '../../system/runTimer/runTimer';

const rootStyle: JSX.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#c0c0c0',
};

const toolbarStyle: JSX.CSSProperties = {
  padding: '6px',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  margin: '6px 6px 0 6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const navRowStyle: JSX.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const browserButtonStyle: JSX.CSSProperties = {
  border: 'none',
  backgroundColor: 'var(--surface)',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  padding: '3px 8px',
  fontSize: '12px',
};

const addressInputStyle: JSX.CSSProperties = {
  flex: 1,
  minWidth: '180px',
  border: 'none',
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-field)',
  padding: '3px 6px',
  fontFamily: 'monospace',
  fontSize: '12px',
};

const pageStyle: JSX.CSSProperties = {
  margin: '6px',
  flex: 1,
  backgroundColor: '#ffffff',
  boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
  padding: '14px',
  overflow: 'auto',
};

type BrowserPage =
  | 'home'
  | 'news'
  | 'weather'
  | 'stocks'
  | 'sports'
  | 'history'
  | 'search'
  | 'winrarDownload'
  | 'portalResetPassword';

type PasswordRuleResult = {
  id: string;
  label: string;
  passed: boolean;
};

const forbiddenFat32Chars = /[\\/:*?"<>|]/;

const getSignedNumbers = (input: string): number[] => {
  return (input.match(/[+-]?\d+(?:\.\d+)?/g) ?? [])
    .map((raw) => Number(raw))
    .filter((value) => Number.isFinite(value));
};

const isTwentyPercentMarkup = (first: number, second: number): boolean => {
  const expected = first * 1.2;
  const tolerance = Math.max(1e-8, Math.abs(expected) * 1e-6);
  return Math.abs(second - expected) <= tolerance;
};

const evaluatePasswordRules = (value: string): PasswordRuleResult[] => {
  const trimmed = value.trim();
  const numbers = getSignedNumbers(trimmed);
  const specialChars = (trimmed.match(/[^A-Za-z0-9\s]/g) ?? []).filter(
    (char) => !forbiddenFat32Chars.test(char)
  );
  const distinctSpecialChars = new Set(specialChars);
  const hasUppercaseLetter = /[A-Z]/.test(trimmed);
  const hasLowercaseLetter = /[a-z]/.test(trimmed);

  const hasArbitragePair = (() => {
    const regex = /([+-]?\d+(?:\.\d+)?)[A-Za-z]([+-]?\d+(?:\.\d+)?)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(trimmed)) !== null) {
      const first = Number(match[1] ?? NaN);
      const second = Number(match[2] ?? NaN);
      if (!Number.isFinite(first) || !Number.isFinite(second)) continue;
      if (isTwentyPercentMarkup(first, second)) return true;
    }
    return false;
  })();

  const vowelSet = new Set(['a', 'e', 'i', 'o', 'u']);
  const hasCaseParadox = (() => {
    for (const char of trimmed) {
      if (!/[A-Za-z]/.test(char)) continue;
      const lower = char.toLowerCase();
      if (vowelSet.has(lower)) {
        if (char !== lower) return false;
      } else if (char !== char.toUpperCase()) {
        return false;
      }
    }
    return true;
  })();

  const hasNoThreeCharPalindrome = (() => {
    for (let i = 0; i <= trimmed.length - 3; i += 1) {
      if (trimmed[i] === trimmed[i + 2]) return false;
    }
    return true;
  })();

  return [
    {
      id: 'min-10',
      label: 'Minimum 10 characters',
      passed: trimmed.length >= 10,
    },
    {
      id: 'two-specials',
      label: 'Must contain at least 2 different special characters.',
      passed: distinctSpecialChars.size >= 2,
    },
    {
      id: 'mixed-case',
      label: 'Must contain both uppercase and lowercase letters.',
      passed: hasUppercaseLetter && hasLowercaseLetter,
    },
    {
      id: 'zero-sum-ledger',
      label:
        'The numbers in your password must represent a perfectly hedged position: all digits used must sum to exactly zero.',
      passed:
        numbers.length === 0 ||
        Math.abs(numbers.reduce((sum, current) => sum + current, 0)) < 1e-9,
    },
    {
      id: 'arbitrage',
      label:
        'Must contain two numbers separated by a letter, where the second number is exactly a 20% markup of the first.',
      passed: hasArbitragePair,
    },
    {
      id: 'illegal-chars',
      label:
        'Must contain a special character, but cannot contain FAT32 restricted characters.',
      passed:
        /[^A-Za-z0-9]/.test(trimmed) && !forbiddenFat32Chars.test(trimmed),
    },
    {
      id: 'case-paradox',
      label: 'All consonants must be uppercase. All vowels must be lowercase.',
      passed: hasCaseParadox,
    },
    {
      id: 'palindrome-penalty',
      label:
        'Password cannot contain any 3-character palindrome (e.g. ABA or 121).',
      passed: hasNoThreeCharPalindrome,
    },
  ];
};

const sectionCardStyle: JSX.CSSProperties = {
  padding: '10px',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  backgroundColor: '#f8f8f8',
};

const storyListStyle: JSX.CSSProperties = {
  margin: '10px 0 0 0',
  paddingLeft: '18px',
  lineHeight: 1.55,
};

const bannerStyle: JSX.CSSProperties = {
  padding: '8px 10px',
  marginBottom: '10px',
  background: 'linear-gradient(90deg, #1f4d8f 0%, #3f6cb8 65%, #6d8ad3 100%)',
  color: '#ffffff',
  boxShadow: 'var(--border-raised-outer), var(--border-raised-inner)',
  fontSize: '12px',
  letterSpacing: '0.2px',
};

const cardGridStyle: JSX.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '10px',
};

const statChipStyle: JSX.CSSProperties = {
  display: 'inline-block',
  padding: '3px 7px',
  marginRight: '6px',
  marginBottom: '6px',
  border: '1px solid #c9c9c9',
  backgroundColor: '#ffffff',
  fontSize: '11px',
  borderRadius: '12px',
};

const embarrassingHistoryEntries = [
  '2:11 PM - "how do i get my ex back fast"',
  '2:10 PM - "how to seem unbothered but actually bothered"',
  '2:09 PM - "how to get a six pack in 1 week no exercise"',
  '2:08 PM - "can confidence be purchased online"',
  '2:07 PM - "apology text templates that sound accidental"',
  '2:06 PM - "best revenge glow up timeline realistic"',
  '2:05 PM - "can i become mysterious by wearing black turtlenecks"',
  '2:04 PM - "how to look busy when boss walks by"',
  '2:03 PM - "is soup a beverage legal definition"',
  '2:02 PM - "cheap abs in 7 days guaranteed"',
  '2:01 PM - "how to unsend a message from 2004"',
  '2:00 PM - "does my plant think im dramatic"',
  '1:59 PM - "how to accidentally post gym selfie"',
  '1:58 PM - "can i put confidence on my resume"',
  '1:57 PM - "haircut that says i read books"',
  '1:56 PM - "how to apologize but still win argument"',
  '1:55 PM - "why did i wave at someone i dont know"',
  '1:54 PM - "is 3 coffees breakfast"',
  '1:53 PM - "how long can i fake liking jazz"',
  '1:52 PM - "how to stop typing lol in serious emails"',
  '1:51 PM - "can i become left handed for aesthetic"',
  '1:50 PM - "how to look rich in grocery store"',
  '1:49 PM - "do sunglasses hide panic"',
  '1:48 PM - "how to delete memory of karaoke"',
  '1:47 PM - "best excuses for owning 14 throw pillows"',
  '1:46 PM - "can i gain muscle by thinking hard"',
  '1:45 PM - "what is business casual for emotional support hoodie"',
  '1:44 PM - "how to text hey without seeming desperate"',
  '1:43 PM - "is it illegal to overuse ellipses..."',
  '1:42 PM - "how to recover from saying you too to waiter"',
  '1:41 PM - "how to politely reject pyramid scheme aunt"',
  '1:40 PM - "do i need protein shake to open jars"',
  '1:39 PM - "is 11 alarms a personality trait"',
  '1:38 PM - "how to stop buying self help books i dont read"',
  '1:37 PM - "quickest path to mysterious villain energy"',
  '1:36 PM - "can i list vibes as a skill"',
  '1:35 PM - "how to ask for raise using interpretive dance"',
  '1:34 PM - "why did i say love you on customer support call"',
  '1:33 PM - "can mirrors be gaslighting me"',
  '1:32 PM - "how to become morning person by friday"',
  '1:31 PM - "how to remove glitter from car seats permanently"',
  '1:30 PM - "best fake hobbies for first dates"',
  '1:29 PM - "is 2am cereal dinner acceptable"',
  '1:28 PM - "how to train jawline while watching tv"',
  '1:27 PM - "can i reset my reputation in new zip code"',
  '1:26 PM - "why does my voice crack when ordering coffee"',
  '1:25 PM - "how to wear chain without becoming magician"',
  '1:24 PM - "can i get six pack from laughing hard"',
  '1:23 PM - "how to recover from seen at 1:23 PM"',
  '1:22 PM - "is confidence just good posture"',
  '1:21 PM - "how to stop saying no worries when there are worries"',
  '1:20 PM - "how to win argument with autocorrect"',
  '1:19 PM - "is soup still beverage if chunky"',
  '1:18 PM - "how to make playlist that implies emotional stability"',
  '1:17 PM - "how to tell barber just a little off means little"',
  '1:16 PM - "can i meal prep charisma"',
  '1:15 PM - "how to look athletic in elevator"',
  '1:14 PM - "how to flirt without sounding like a chatbot"',
  '1:13 PM - "can i invoice my ex for emotional labor"',
  '1:12 PM - "best way to return to gym after 4 years"',
  '1:11 PM - "how to become hot by next tuesday"',
] as const;

const WorldWideWebApp: FunctionComponent<AppProps> = ({
  openApp,
}: AppProps) => {
  const [historyStack, setHistoryStack] = useState<BrowserPage[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [typedAddress, setTypedAddress] = useState('http://worldwideweb.home/');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [maxVisibleRuleCount, setMaxVisibleRuleCount] = useState(1);
  const page = historyStack[historyIndex] ?? 'home';
  const resetRuleResults = useMemo(
    () => evaluatePasswordRules(resetPasswordInput),
    [resetPasswordInput]
  );

  const navigateTo = (nextPage: BrowserPage) => {
    setHistoryStack((current) => [
      ...current.slice(0, historyIndex + 1),
      nextPage,
    ]);
    setHistoryIndex((current) => current + 1);
  };

  const navigateForUrl = (rawUrl: string) => {
    const q = rawUrl.trim().toLowerCase();
    if (!q) return;
    if (q.includes('news')) return navigateTo('news');
    if (q.includes('weather') || q.includes('weeather'))
      return navigateTo('weather');
    if (q.includes('stocks')) return navigateTo('stocks');
    if (q.includes('sports')) return navigateTo('sports');
    if (q.includes('history')) return navigateTo('history');
    if (q.includes('reset-password')) return navigateTo('portalResetPassword');
    if (q.includes('home')) return navigateTo('home');
    if (
      q.includes('win-rar.com') ||
      q.includes('winrar') ||
      q.includes('.rar') ||
      q.includes('rar')
    ) {
      return navigateTo('winrarDownload');
    }
    setSearchQuery(rawUrl.trim());
    navigateTo('search');
  };

  const pageAddress = useMemo(() => {
    if (page === 'news') return 'http://daily-beeper.net/news';
    if (page === 'weather') return 'http://cloud.oracle/weather';
    if (page === 'stocks') return 'http://stonks-4-u.biz/market';
    if (page === 'sports') return 'http://sports-yelling.example/live';
    if (page === 'history') return 'worldwideweb://history';
    if (page === 'search')
      return `worldwideweb://search?q=${encodeURIComponent(searchQuery)}`;
    if (page === 'winrarDownload')
      return 'http://download.winrar-online.example/';
    if (page === 'portalResetPassword')
      return 'http://identity.corp.internal/reset-password';
    return 'http://worldwideweb.home/';
  }, [page, searchQuery]);

  useEffect(() => {
    setTypedAddress(pageAddress);
  }, [pageAddress]);

  const handleBack = () => {
    setHistoryIndex((current) => Math.max(0, current - 1));
  };

  const handleForward = () => {
    setHistoryIndex((current) =>
      Math.min(historyStack.length - 1, current + 1)
    );
  };

  const handleGo = () => {
    navigateForUrl(typedAddress);
  };

  useEffect(() => {
    gameEventBus.emit('audio:resume_requested', { source: 'web_open' });
  }, []);

  useEffect(() => {
    return gameEventBus.on('browser:url_requested', ({ url }) => {
      setTypedAddress(url);
      navigateForUrl(url);
    });
    // navigateForUrl is captured by closure; mount-only is correct here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page !== 'portalResetPassword') return;
    const firstFailedIdx = resetRuleResults.findIndex((rule) => !rule.passed);
    const progressiveVisibleCount =
      firstFailedIdx === -1 ? resetRuleResults.length : firstFailedIdx + 1;
    setMaxVisibleRuleCount((current) =>
      Math.max(current, progressiveVisibleCount)
    );
  }, [page, resetRuleResults]);

  const renderPage = (): JSX.Element => {
    if (page === 'news') {
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #f7f7ff 0%, #fefefe 30%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #d4d4e8',
          }}
        >
          <h2 style={{ marginTop: 0 }}>The Daily Beeper</h2>
          <div style={bannerStyle}>
            BREAKING: City productivity up 300% after someone removed "reply
            all" from every keyboard.
          </div>
          <div
            style={{ color: '#555', fontSize: '12px', marginBottom: '10px' }}
          >
            Afternoon Edition | City Desk, Tech Desk, and Office Drama
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={sectionCardStyle}>
              <b>Top Story:</b> Local intern accidentally replies-all and
              launches a 60-person workplace book club called "PDF Fighters."
            </div>
            <div style={sectionCardStyle}>
              <b>Business:</b> Man claims coffee is a personality trait,
              receives promotion and free branded mug.
            </div>
            <div style={sectionCardStyle}>
              <b>Science:</b> Researchers confirm office printer can detect fear
              from 30 feet away and jams proactively.
            </div>
            <div style={sectionCardStyle}>
              <b>Culture:</b> Museum unveils exhibit titled "Cords We Refused To
              Throw Away." Admission includes one free VGA cable.
            </div>
          </div>
          <ul style={storyListStyle}>
            <li>
              Transit update: escalator now mostly moving in one direction.
            </li>
            <li>
              City council debates if "snack break" should be tax-deductible.
            </li>
            <li>
              Opinion: Auto-correct has gone rogue and must be negotiated with.
            </li>
            <li>Classifieds: Slightly haunted fax machine, best offer.</li>
            <li>
              Investigations: Committee confirms office microwave has three
              settings: lava, ice, and "almost."
            </li>
            <li>
              Tech: Start-up launches AI that only says "have you tried turning
              it off and on again" but in seven languages.
            </li>
          </ul>
          <div style={{ marginTop: '12px' }}>
            <span style={statChipStyle}>Most-read topic: coffee policy</span>
            <span style={statChipStyle}>Public mood: cautiously dramatic</span>
            <span style={statChipStyle}>Typo index: elevated</span>
          </div>
        </div>
      );
    }

    if (page === 'weather') {
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #d8f2ff 0%, #edf9ff 40%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #b5deef',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Cloud Oracle Weather Center</h2>
          <div style={bannerStyle}>
            Severe Advisory: high probability of "I need to lie down for 5
            minutes" between 2:00 PM and forever.
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ ...sectionCardStyle, minWidth: '220px', flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#004a66' }}>NOW</div>
              <div style={{ fontSize: '28px', fontWeight: 700 }}>72F</div>
              <div>Partly sunny with a 100% chance of procrastination.</div>
            </div>
            <div style={{ ...sectionCardStyle, minWidth: '220px', flex: 1 }}>
              <div style={{ fontSize: '13px', color: '#004a66' }}>TONIGHT</div>
              <div>Low 61F, 40% chance of existential drizzle.</div>
              <div>Wind: mildly judgmental from the east at 9 mph.</div>
            </div>
          </div>
          <div style={{ ...sectionCardStyle, marginTop: '10px' }}>
            <b>Regional radar notes</b>
            <div style={{ marginTop: '6px' }}>
              North District: clear skies, suspiciously upbeat emails.
            </div>
            <div>Midtown: heavy cloud cover and moderate umbrella envy.</div>
            <div>
              Industrial Zone: 12% chance of frogs, 88% chance of rumors.
            </div>
          </div>
          <div style={{ ...sectionCardStyle, marginTop: '10px' }}>
            <b>3-Day Forecast</b>
            <ul style={storyListStyle}>
              <li>Tue: Sunny with occasional inbox storms (74F / 60F)</li>
              <li>Wed: Cloudy, chance of surprise meetings (69F / 57F)</li>
              <li>Thu: Thunder and scattered panic, then calm (71F / 58F)</li>
            </ul>
          </div>
          <div
            style={{ marginTop: '10px', fontSize: '12px', color: '#2a5a6a' }}
          >
            Pollen: medium | UV: moderate | Umbrella confidence index: 63%
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={statChipStyle}>Commuter mood: damp</span>
            <span style={statChipStyle}>Thunder drama score: 7/10</span>
            <span style={statChipStyle}>Sunset quality: cinematic</span>
          </div>
        </div>
      );
    }

    if (page === 'stocks') {
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #f3ffe9 0%, #fbfff7 40%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #d0e7bf',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Stonks 4 U Market Terminal</h2>
          <div style={bannerStyle}>
            LIVE ALERT: "buy low, panic medium, hold snacks" remains official
            strategy.
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            DOWJOKES: 42,069.12 (+0.62%) | NASYELL: 13,337.00 (-0.11%)
          </div>
          <div style={{ marginTop: '10px', display: 'grid', gap: '8px' }}>
            <div style={sectionCardStyle}>
              <b>LOL</b> +12.4% - surged after announcing absolutely nothing.
            </div>
            <div style={sectionCardStyle}>
              <b>MEH</b> -8.1% - CEO said "trust me bro" during earnings call.
            </div>
            <div style={sectionCardStyle}>
              <b>PIZZA</b> +0.3% - bullish lunch sentiment in all sectors.
            </div>
            <div style={sectionCardStyle}>
              <b>GYM</b> +5.5% - January resolutions still technically alive.
            </div>
          </div>
          <div style={{ ...sectionCardStyle, marginTop: '10px' }}>
            <b>Sector heat map (totally scientific)</b>
            <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
              Technology: [########--] +4.2%
            </div>
            <div style={{ fontFamily: 'monospace' }}>
              Snacks: [#########-] +6.8%
            </div>
            <div style={{ fontFamily: 'monospace' }}>
              Motivation: [###-------] -2.9%
            </div>
            <div style={{ fontFamily: 'monospace' }}>
              Vibes: [#######---] +2.4%
            </div>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            Analyst note: Diversify into cash, snacks, and emotional resilience.
          </div>
        </div>
      );
    }

    if (page === 'sports') {
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #fff5e8 0%, #fff9f2 40%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #f0d3ad',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Sports Yelling Network</h2>
          <div style={bannerStyle}>
            Pregame panel shouting level: 98 dB. Rational analysis pending.
          </div>
          <div style={{ ...sectionCardStyle, marginBottom: '10px' }}>
            <b>Final:</b> Metro Meteors 3, Downtown Falcons 2. Referees booed
            approximately 900 times.
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={sectionCardStyle}>
              <b>Post-game quote:</b> "We gave 110%." Math teachers remain
              deeply concerned.
            </div>
            <div style={sectionCardStyle}>
              <b>Locker room report:</b> Celebration involved nachos, confetti,
              and one dramatic karaoke performance.
            </div>
            <div style={sectionCardStyle}>
              <b>Upcoming:</b> Friday showdown against the River Rats, who have
              not lost since they switched to lucky socks.
            </div>
          </div>
          <div style={{ ...sectionCardStyle, marginTop: '10px' }}>
            <b>Stat Corner</b>
            <div>Shots on goal: 18-17</div>
            <div>Possession: 51% / 49%</div>
            <div>Questionable mustaches in crowd: 36</div>
            <div>Nachos consumed during overtime: classified</div>
          </div>
          <ul style={storyListStyle}>
            <li>Fantasy tip: Start anyone who "looked focused in warmups."</li>
            <li>
              Hot take: Defense wins championships, offense wins attention.
            </li>
            <li>Merch alert: Foam fingers now available in "Serious Beige."</li>
            <li>
              Betting line moved after mascot predicted outcome using a magic 8
              ball.
            </li>
          </ul>
        </div>
      );
    }

    if (page === 'history') {
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #ffeef1 0%, #fff7f8 40%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #efc8d0',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Browsing History</h2>
          <div style={bannerStyle}>
            Privacy status: ornamental. Your browser remembers what your soul
            wishes it forgot.
          </div>
          <div
            style={{ fontSize: '12px', color: '#6a3d45', marginBottom: '8px' }}
          >
            Last cleared: never | Sync status: unfortunately enabled
          </div>
          <div style={{ ...sectionCardStyle, marginBottom: '8px' }}>
            <b>Insights</b>
            <div>Most searched word: "how"</div>
            <div>Most visited category: self-improvement speedruns</div>
            <div>Peak search hour: 2:07 PM (post-email regret window)</div>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              boxShadow:
                'var(--border-sunken-outer), var(--border-sunken-inner)',
              backgroundColor: '#fff',
              padding: '10px',
            }}
          >
            {embarrassingHistoryEntries.map((entry) => (
              <div key={entry}>{entry}</div>
            ))}
          </div>
        </div>
      );
    }

    if (page === 'search') {
      const isLookingForWinRar =
        searchQuery.toLowerCase().includes('winrar') ||
        searchQuery.toLowerCase().includes('.rar') ||
        searchQuery.toLowerCase().includes('rar');
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #f9f8ff 0%, #ffffff 45%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #ddd8f4',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Search Results</h2>
          <div style={bannerStyle}>
            Powered by AskJeezMaybe (tm) - approximately accurate, emotionally
            supportive.
          </div>
          <div style={{ marginBottom: '10px', fontFamily: 'monospace' }}>
            Results for: <b>{searchQuery}</b>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {isLookingForWinRar && (
              <div style={sectionCardStyle}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('winrarDownload');
                  }}
                >
                  "Official WinRAR Download - Free Trial"
                </a>
                <div style={{ fontSize: '12px' }}>
                  Download `WinRAR_installer.exe` online to open `.zip`
                  archives.
                </div>
              </div>
            )}
            <div style={sectionCardStyle}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                "Local expert reveals 5-step morning routine (step 1 is waking
                up)"
              </a>
              <div style={{ fontSize: '12px' }}>
                Includes controversial bonus step: remembering where your keys
                are.
              </div>
            </div>
            <div style={sectionCardStyle}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                "How to get your life together in 24 hours"
              </a>
              <div style={{ fontSize: '12px' }}>
                Step 1: drink water. Step 2: panic less. Step 3: repeat.
              </div>
            </div>
            <div style={sectionCardStyle}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                "Top 10 habits of people who definitely have it figured out"
              </a>
              <div style={{ fontSize: '12px' }}>
                Number 4 is pretending to enjoy cold showers.
              </div>
            </div>
            <div style={sectionCardStyle}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                "Forum thread: Is soup a beverage?"
              </a>
              <div style={{ fontSize: '12px' }}>
                4,218 replies and zero consensus.
              </div>
            </div>
            <div style={sectionCardStyle}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                "Is typing 'per my last email' legally a threat?"
              </a>
              <div style={{ fontSize: '12px' }}>
                Legal analysis says no. HR analysis says maybe.
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (page === 'winrarDownload') {
      return (
        <div
          style={{
            lineHeight: 1.6,
            background:
              'linear-gradient(180deg, #f4f4ff 0%, #fcfcff 40%, #ffffff 100%)',
            padding: '10px',
            border: '1px solid #d8d8ee',
          }}
        >
          <h2 style={{ marginTop: 0 }}>WinRAR Online Download</h2>
          <div style={bannerStyle}>
            Trusted by 9 out of 10 people who have no idea where zip files go.
          </div>
          <div style={{ ...sectionCardStyle, marginBottom: '10px' }}>
            <b>Version:</b> 6.66 trial edition <br />
            <b>File:</b> WinRAR_installer.exe <br />
            <b>Size:</b> 2.4 MB
          </div>
          <div style={{ ...sectionCardStyle, marginBottom: '10px' }}>
            Need to open compressed files? Download WinRAR here.
          </div>
          <div style={{ ...sectionCardStyle, marginBottom: '10px' }}>
            <b>What you get</b>
            <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
              <li>Opens `.zip` and `.rar` archives</li>
              <li>Progress bars that feel meaningful</li>
              <li>A trial period that achieves legendary immortality</li>
            </ul>
          </div>
          <div style={cardGridStyle}>
            <div style={sectionCardStyle}>
              <b>User review:</b> "Installed it for one file, now we are
              family."
            </div>
            <div style={sectionCardStyle}>
              <b>System requirements:</b> 486 CPU, 16MB RAM, and belief.
            </div>
          </div>
          <button
            type="button"
            style={{ ...browserButtonStyle, fontWeight: 700 }}
            onClick={() => openApp({ appId: 'winRarInstaller' })}
          >
            Download WinRAR Installer
          </button>
        </div>
      );
    }

    if (page === 'portalResetPassword') {
      const allPassed = resetRuleResults.every((rule) => rule.passed);
      const visibleRuleCount = Math.min(
        resetRuleResults.length,
        maxVisibleRuleCount
      );
      const visibleRules = resetRuleResults.slice(0, visibleRuleCount);

      return (
        <div
          style={{
            lineHeight: 1.55,
            background:
              'linear-gradient(180deg, #eceff8 0%, var(--surface) 55%, #f8f9fc 100%)',
            padding: '8px',
            boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
          }}
        >
          <div
            style={{
              background:
                'linear-gradient(90deg, var(--dialog-blue) 0%, var(--dialog-gray) 100%)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '4px 8px',
              boxShadow:
                'var(--border-raised-outer), var(--border-raised-inner)',
            }}
          >
            Identity Services - Password Reset Wizard
          </div>
          <div
            style={{
              marginTop: '8px',
              backgroundColor: 'var(--button-highlight)',
              boxShadow:
                'var(--border-sunken-outer), var(--border-sunken-inner)',
              padding: '10px',
            }}
          >
            Enter a new password. As soon as one requirement is satisfied,
            another requirement is unlocked.
          </div>
          <div style={{ marginTop: '8px', ...sectionCardStyle }}>
            <b>Security advisory:</b> Due to policy changes after "Password123!"
            was used by the entire accounting floor, standards are now
            aggressively specific.
          </div>
          <div
            style={{
              marginTop: '8px',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--border-field)',
              padding: '10px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="text"
              value={resetPasswordInput}
              onInput={(event) => {
                setResetPasswordInput(
                  (event.currentTarget as HTMLInputElement).value
                );
                setResetStatus(null);
              }}
              style={{
                ...addressInputStyle,
                maxWidth: '430px',
              }}
              placeholder="New password..."
            />
            <button
              type="button"
              style={browserButtonStyle}
              onClick={() => {
                if (!allPassed) {
                  setResetStatus(
                    'Password does not satisfy all current requirements.'
                  );
                  return;
                }
                setPortalPassword(resetPasswordInput);
                recordCheckpoint('password_solved');
                setResetStatus(
                  'Password updated. Return to CorpPortal and sign in.'
                );
              }}
            >
              Set Password
            </button>
          </div>
          <div
            style={{
              marginTop: '8px',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--border-field)',
              padding: '10px',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
              Password requirements
            </div>
            <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
              {visibleRules.map((rule) => (
                <li
                  key={rule.id}
                  style={{
                    color: rule.passed ? '#006800' : '#8b0000',
                    marginBottom: '4px',
                  }}
                >
                  {rule.label}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#555' }}>
              Hint: This system was designed by three security engineers, one
              poet, and an options trader.
            </div>
          </div>
          {resetStatus && (
            <div
              style={{
                marginTop: '8px',
                backgroundColor: 'var(--button-highlight)',
                boxShadow:
                  'var(--border-raised-outer), var(--border-raised-inner)',
                padding: '8px 10px',
              }}
            >
              {resetStatus}
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ lineHeight: 1.6 }}>
        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          World Wide Web
        </div>
        <div style={bannerStyle}>
          Welcome to the Information Superhighway. Please keep arms and
          emotional baggage inside the browser at all times.
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#333333',
            marginBottom: '16px',
          }}
        >
          Welcome to your browser. Search is connected to vibes, rumors, and
          occasionally facts.
        </div>
        <div style={{ marginBottom: '12px' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('news');
            }}
          >
            News
          </a>{' '}
          |{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('weather');
            }}
          >
            Weather
          </a>{' '}
          |{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('stocks');
            }}
          >
            Stocks
          </a>{' '}
          |{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('sports');
            }}
          >
            Sports
          </a>{' '}
          |{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('history');
            }}
          >
            History
          </a>
        </div>
        <div style={cardGridStyle}>
          <div style={sectionCardStyle}>
            <b>Web Tip #1:</b> If a page says "free", the hidden cost is usually
            your attention span.
          </div>
          <div style={sectionCardStyle}>
            <b>Web Tip #2:</b> If a forum thread has 4000 replies, there is no
            winner.
          </div>
          <div style={sectionCardStyle}>
            <b>Web Tip #3:</b> Opening 27 tabs counts as project management.
          </div>
        </div>
        <div style={{ ...sectionCardStyle, lineHeight: 1.6 }}>
          <b>Today on the Web:</b> Markets are weird, weather is moody, sports
          are loud, and your history is legally questionable.
        </div>
      </div>
    );
  };

  return (
    <div style={rootStyle}>
      <div style={toolbarStyle}>
        <div style={navRowStyle}>
          <button
            disabled={historyIndex <= 0}
            onClick={handleBack}
            style={browserButtonStyle}
            type="button"
          >
            Back
          </button>
          <button
            disabled={historyIndex >= historyStack.length - 1}
            onClick={handleForward}
            style={browserButtonStyle}
            type="button"
          >
            Forward
          </button>
          <button style={browserButtonStyle} type="button">
            Refresh
          </button>
          <button style={browserButtonStyle} type="button">
            Stop
          </button>
          <button
            style={browserButtonStyle}
            onClick={() => navigateTo('home')}
            type="button"
          >
            Home
          </button>
          <button
            style={browserButtonStyle}
            onClick={() => navigateTo('history')}
            type="button"
          >
            History
          </button>
        </div>
        <div style={navRowStyle}>
          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            Address:
          </span>
          <input
            type="text"
            value={typedAddress}
            style={addressInputStyle}
            onInput={(e) =>
              setTypedAddress((e.currentTarget as HTMLInputElement).value)
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGo();
            }}
          />
          <button style={browserButtonStyle} type="button" onClick={handleGo}>
            Go
          </button>
        </div>
      </div>

      <div style={pageStyle}>{renderPage()}</div>
    </div>
  );
};

export default WorldWideWebApp;
