import { describe, expect, it } from 'vitest';

import { signRunToken, verifyRunToken } from './hmac';

const SECRET = 'unit-test-secret-please-do-not-deploy';

describe('signRunToken / verifyRunToken', () => {
  it('signs and verifies a token round-trip', async () => {
    const token = await signRunToken(SECRET, 'run-1', 1_700_000_000_000);
    const ok = await verifyRunToken(SECRET, 'run-1', 1_700_000_000_000, token);
    expect(ok).toBe(true);
  });

  it('rejects tokens with a different runId', async () => {
    const token = await signRunToken(SECRET, 'run-1', 1_700_000_000_000);
    const ok = await verifyRunToken(SECRET, 'run-2', 1_700_000_000_000, token);
    expect(ok).toBe(false);
  });

  it('rejects tokens with a different startedAt', async () => {
    const token = await signRunToken(SECRET, 'run-1', 1_700_000_000_000);
    const ok = await verifyRunToken(SECRET, 'run-1', 1_700_000_000_001, token);
    expect(ok).toBe(false);
  });

  it('rejects tokens signed with a different secret', async () => {
    const token = await signRunToken(SECRET, 'run-1', 1_700_000_000_000);
    const ok = await verifyRunToken(
      'a-different-secret',
      'run-1',
      1_700_000_000_000,
      token
    );
    expect(ok).toBe(false);
  });

  it('rejects malformed tokens without throwing', async () => {
    const ok = await verifyRunToken(
      SECRET,
      'run-1',
      1_700_000_000_000,
      'not-a-real-token'
    );
    expect(ok).toBe(false);
  });

  it('produces base64url output (no +, /, or = chars)', async () => {
    const token = await signRunToken(SECRET, 'run-1', 1_700_000_000_000);
    expect(token).not.toMatch(/[+/=]/);
  });
});
