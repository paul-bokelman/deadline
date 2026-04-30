// Origin-based CORS using an allow-list from Worker vars.

export const buildCorsHeaders = (
  request: Request,
  allowedOriginsCsv: string
): HeadersInit => {
  const origin = request.headers.get('Origin');
  const allowed = allowedOriginsCsv
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const isAllowed = origin !== null && allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
};

export const preflight = (
  request: Request,
  allowedOriginsCsv: string
): Response =>
  new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request, allowedOriginsCsv),
  });
