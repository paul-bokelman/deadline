export const PASSWORD_HINT_EMAIL_PASSWORD = '9troper';
export const Q3_ATTACHMENT_PASSWORD = 'deadline2026';
export const Q3_REPORT_KEY_LABEL = 'Q3 Report Encryption Key';
export const Q3_REPORT_KEY_RIDDLE =
  "I am the number of months in three quarters of a year, followed by the word that means 'the report you need', backwards.";

export interface PasswordEntry {
  label: string;
  password: string;
}

const baseLabels = [
  'Bank login',
  'WiFi',
  'Netflix',
  'Old forum',
  'Cloud backup',
  'Steam',
  'Gym portal',
  'Tax account',
  'Travel profile',
  'Photo vault',
  'Game launcher',
  'Dev server',
  'Router admin',
  'Insurance portal',
  'Payroll clone',
  'Expense app',
  'Archive zip',
  'Desktop lock',
  'Legacy VPN',
  'Calendar sync',
] as const;

const basePasswords = [
  'hunter2',
  'linksys123',
  'passw0rd!',
  'letmeinpls',
  'sunset_443',
  'toaster99',
  'october88',
  'coffee-time',
  'delta!delta',
  'monorail77',
  'raccoon4ever',
  'laserbeams',
  'wrench_204',
  'quietstorm',
  'pixel1989',
  'paperclip',
  'keyboardcat',
  'bluebucket',
  'night_owl',
  'raincheck',
] as const;

const pseudoRand = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const buildGeneratedPasswordEntries = (): PasswordEntry[] => {
  const random = pseudoRand(96_2026);
  const entries: PasswordEntry[] = [];

  for (let i = 0; i < 219; i += 1) {
    const labelPrefix = baseLabels[i % baseLabels.length];
    const label = `${labelPrefix} ${Math.floor(random() * 980 + 10)}`;
    const passwordPrefix = basePasswords[i % basePasswords.length];
    const suffix = Math.floor(random() * 9000 + 1000);
    entries.push({ label, password: `${passwordPrefix}${suffix}` });
  }

  entries.splice(137, 0, {
    label: Q3_REPORT_KEY_LABEL,
    password: Q3_REPORT_KEY_RIDDLE,
  });

  return entries;
};

export const importantPasswordEntries: PasswordEntry[] = buildGeneratedPasswordEntries();

export const importantPasswordsFileContent: string = importantPasswordEntries
  .map((entry) => `${entry.label}: ${entry.password}`)
  .join('\n');
