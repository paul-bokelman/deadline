import { h, FunctionComponent, JSX } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';

import { AppProps } from '../../types/App';
import { gameEventBus } from '../../game/events';

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
  | 'winrarDownload';

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

const WorldWideWebApp: FunctionComponent<AppProps> = ({ openApp }: AppProps) => {
  const [historyStack, setHistoryStack] = useState<BrowserPage[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [typedAddress, setTypedAddress] = useState('http://worldwideweb.home/');
  const [searchQuery, setSearchQuery] = useState('');
  const page = historyStack[historyIndex] ?? 'home';

  const navigateTo = (nextPage: BrowserPage) => {
    setHistoryStack((current) => [...current.slice(0, historyIndex + 1), nextPage]);
    setHistoryIndex((current) => current + 1);
  };

  const navigateForUrl = (rawUrl: string) => {
    const q = rawUrl.trim().toLowerCase();
    if (!q) return;
    if (q.includes('news')) return navigateTo('news');
    if (q.includes('weather') || q.includes('weeather')) return navigateTo('weather');
    if (q.includes('stocks')) return navigateTo('stocks');
    if (q.includes('sports')) return navigateTo('sports');
    if (q.includes('history')) return navigateTo('history');
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
    if (page === 'search') return `worldwideweb://search?q=${encodeURIComponent(searchQuery)}`;
    if (page === 'winrarDownload') return 'http://download.winrar-online.example/';
    return 'http://worldwideweb.home/';
  }, [page, searchQuery]);

  useEffect(() => {
    setTypedAddress(pageAddress);
  }, [pageAddress]);

  const handleBack = () => {
    setHistoryIndex((current) => Math.max(0, current - 1));
  };

  const handleForward = () => {
    setHistoryIndex((current) => Math.min(historyStack.length - 1, current + 1));
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
  }, []);

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
          <div style={{ color: '#555', fontSize: '12px', marginBottom: '10px' }}>
            Afternoon Edition | City Desk, Tech Desk, and Office Drama
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={sectionCardStyle}>
              <b>Top Story:</b> Local intern accidentally replies-all and
              launches a 60-person workplace book club called "PDF Fighters."
            </div>
            <div style={sectionCardStyle}>
              <b>Business:</b> Man claims coffee is a personality trait, receives
              promotion and free branded mug.
            </div>
            <div style={sectionCardStyle}>
              <b>Science:</b> Researchers confirm office printer can detect fear
              from 30 feet away and jams proactively.
            </div>
          </div>
          <ul style={storyListStyle}>
            <li>Transit update: escalator now mostly moving in one direction.</li>
            <li>City council debates if "snack break" should be tax-deductible.</li>
            <li>Opinion: Auto-correct has gone rogue and must be negotiated with.</li>
            <li>Classifieds: Slightly haunted fax machine, best offer.</li>
          </ul>
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
            <b>3-Day Forecast</b>
            <ul style={storyListStyle}>
              <li>Tue: Sunny with occasional inbox storms (74F / 60F)</li>
              <li>Wed: Cloudy, chance of surprise meetings (69F / 57F)</li>
              <li>Thu: Thunder and scattered panic, then calm (71F / 58F)</li>
            </ul>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#2a5a6a' }}>
            Pollen: medium | UV: moderate | Umbrella confidence index: 63%
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
          <ul style={storyListStyle}>
            <li>Fantasy tip: Start anyone who "looked focused in warmups."</li>
            <li>Hot take: Defense wins championships, offense wins attention.</li>
            <li>Merch alert: Foam fingers now available in "Serious Beige."</li>
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
          <div style={{ fontSize: '12px', color: '#6a3d45', marginBottom: '8px' }}>
            Last cleared: never | Sync status: unfortunately enabled
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              boxShadow: 'var(--border-sunken-outer), var(--border-sunken-inner)',
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
        <div style={{ lineHeight: 1.6 }}>
          <h2 style={{ marginTop: 0 }}>Search Results</h2>
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
                  Download `WinRAR_installer.exe` online to open `.zip` archives.
                </div>
              </div>
            )}
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
          <div style={{ ...sectionCardStyle, marginBottom: '10px' }}>
            <b>Version:</b> 6.66 trial edition <br />
            <b>File:</b> WinRAR_installer.exe <br />
            <b>Size:</b> 2.4 MB
          </div>
          <div style={{ ...sectionCardStyle, marginBottom: '10px' }}>
            Need to open compressed files? Download WinRAR here.
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

    return (
      <div style={{ lineHeight: 1.6 }}>
        <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          World Wide Web
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#333333',
            marginBottom: '16px',
          }}
        >
          Welcome to your browser. Search is not connected yet.
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
          <button style={browserButtonStyle} onClick={() => navigateTo('home')} type="button">
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
            onInput={(e) => setTypedAddress((e.currentTarget as HTMLInputElement).value)}
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

