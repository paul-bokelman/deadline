import { describe, expect, it } from 'vitest';

import {
  PASSWORD_HINT_EMAIL_PASSWORD,
  Q3_ATTACHMENT_PASSWORD,
  Q3_REPORT_KEY_LABEL,
  Q3_REPORT_KEY_RIDDLE,
  importantPasswordEntries,
  importantPasswordsFileContent,
} from './passwords';

describe('passwords data', () => {
  it('exports the email password hint and Q3 attachment password', () => {
    expect(PASSWORD_HINT_EMAIL_PASSWORD).toMatch(/^\S+$/);
    expect(Q3_ATTACHMENT_PASSWORD).toMatch(/^\S+$/);
  });

  it('generates a deterministic snapshot of password entries (220 total incl. Q3 key)', () => {
    expect(importantPasswordEntries).toHaveLength(220);
  });

  it('embeds the Q3 report key riddle entry inside the generated list', () => {
    const match = importantPasswordEntries.find(
      (entry) => entry.label === Q3_REPORT_KEY_LABEL
    );
    expect(match).toBeDefined();
    expect(match?.password).toBe(Q3_REPORT_KEY_RIDDLE);
  });

  it('renders the file content with one entry per line', () => {
    const lines = importantPasswordsFileContent.split('\n');
    expect(lines).toHaveLength(importantPasswordEntries.length);
    expect(lines[0]).toMatch(/.+:\s\S+/);
  });
});
