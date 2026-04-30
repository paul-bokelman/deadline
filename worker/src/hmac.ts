// HMAC-SHA256 helpers for run tokens.

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const fromBase64Url = (input: string): Uint8Array => {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const importKey = async (secret: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
};

const payloadFor = (runId: string, startedAtMs: number): string =>
  `${runId}|${startedAtMs}`;

export const signRunToken = async (
  secret: string,
  runId: string,
  startedAtMs: number
): Promise<string> => {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadFor(runId, startedAtMs))
  );
  return toBase64Url(new Uint8Array(sig));
};

const constantTimeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] as number) ^ (b[i] as number);
  }
  return diff === 0;
};

export const verifyRunToken = async (
  secret: string,
  runId: string,
  startedAtMs: number,
  token: string
): Promise<boolean> => {
  try {
    const expected = await signRunToken(secret, runId, startedAtMs);
    return constantTimeEqual(fromBase64Url(expected), fromBase64Url(token));
  } catch {
    return false;
  }
};
