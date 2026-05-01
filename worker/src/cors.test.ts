import { describe, expect, it } from 'vitest';

import { buildCorsHeaders, preflight } from './cors';

const ALLOWED = 'https://example.com,https://deadline.pab.dev';

// happy-dom strips `Origin` from Request headers (CORS forbidden header), so
// we use a minimal request stub matching what `buildCorsHeaders` actually
// reads (only `request.headers.get('Origin')`).
const requestWith = (origin: string | null): Request => {
  const stub = {
    headers: {
      get: (name: string): string | null =>
        name.toLowerCase() === 'origin' ? origin : null,
    },
  };
  return stub as unknown as Request;
};

describe('buildCorsHeaders', () => {
  it('echoes an allowed origin when present in the allow-list', () => {
    const headers = buildCorsHeaders(
      requestWith('https://deadline.pab.dev'),
      ALLOWED
    ) as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://deadline.pab.dev'
    );
    expect(headers['Vary']).toBe('Origin');
  });

  it('returns the literal "null" when origin is not in the allow-list', () => {
    const headers = buildCorsHeaders(
      requestWith('https://malicious.test'),
      ALLOWED
    ) as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe('null');
  });

  it('returns the literal "null" when origin header is missing', () => {
    const headers = buildCorsHeaders(requestWith(null), ALLOWED) as Record<
      string,
      string
    >;
    expect(headers['Access-Control-Allow-Origin']).toBe('null');
  });

  it('trims whitespace in the allow-list CSV', () => {
    const headers = buildCorsHeaders(
      requestWith('https://deadline.pab.dev'),
      ' https://example.com , https://deadline.pab.dev '
    ) as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe(
      'https://deadline.pab.dev'
    );
  });
});

describe('preflight', () => {
  it('responds 204 with CORS headers', () => {
    const res = preflight(requestWith('https://deadline.pab.dev'), ALLOWED);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
