import { BrowserPage } from './worldWideWeb.data';

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

export const evaluatePasswordRules = (value: string): PasswordRuleResult[] => {
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
    { id: 'min-10', label: 'Minimum 10 characters', passed: trimmed.length >= 10 },
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
      passed: /[^A-Za-z0-9]/.test(trimmed) && !forbiddenFat32Chars.test(trimmed),
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

export const getPageAddress = (page: BrowserPage, searchQuery: string): string => {
  if (page === 'news') return 'http://daily-beeper.net/news';
  if (page === 'weather') return 'http://cloud.oracle/weather';
  if (page === 'stocks') return 'http://stonks-4-u.biz/market';
  if (page === 'sports') return 'http://sports-yelling.example/live';
  if (page === 'history') return 'worldwideweb://history';
  if (page === 'search') {
    return `worldwideweb://search?q=${encodeURIComponent(searchQuery)}`;
  }
  if (page === 'winrarDownload') return 'http://download.winrar-online.example/';
  if (page === 'portalResetPassword') {
    return 'http://identity.corp.internal/reset-password';
  }
  return 'http://worldwideweb.home/';
};

export const resolvePageForUrl = (rawUrl: string): BrowserPage | null => {
  const q = rawUrl.trim().toLowerCase();
  if (!q) return null;
  if (q.includes('news')) return 'news';
  if (q.includes('weather') || q.includes('weeather')) return 'weather';
  if (q.includes('stocks')) return 'stocks';
  if (q.includes('sports')) return 'sports';
  if (q.includes('history')) return 'history';
  if (q.includes('reset-password')) return 'portalResetPassword';
  if (q.includes('home')) return 'home';
  if (
    q.includes('win-rar.com') ||
    q.includes('winrar') ||
    q.includes('.rar') ||
    q.includes('rar')
  ) {
    return 'winrarDownload';
  }
  return 'search';
};

export type { PasswordRuleResult };
