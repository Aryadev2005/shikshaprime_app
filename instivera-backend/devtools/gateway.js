#!/usr/bin/env node
/**
 * Local API gateway.
 *
 * The mobile app resolves ONE origin and appends /api/<service>/... to it.
 * Deployed, something in front of the VM fans that out to 16 upstreams; that
 * config is environment-only and is not in this repo. Locally each service
 * listens on its own port (SERVICE_PORT in its .env.development), so without a
 * gateway the app can only ever reach one of them.
 *
 * This is that missing piece, with no dependencies: it routes on the
 * /api/<service> prefix and streams everything else through untouched —
 * including multipart uploads, which several flows depend on.
 *
 *   node devtools/gateway.js            # listens on 4000
 *   PORT=8081 node devtools/gateway.js
 */
const http = require('http');

// Ports come from each service's .env.development (SERVICE_PORT).
const ROUTES = {
  '/api/identity': 9050,
  '/api/student': 9051,
  '/api/teacher': 9052,
  '/api/payment': 9053,
  '/api/chat': 9054,
  '/api/admission': 9041,
  '/api/fees-management': 9059,
};

const PORT = Number(process.env.PORT || 4000);
const UPSTREAM_HOST = process.env.UPSTREAM_HOST || '127.0.0.1';

// Longest prefix first, so /api/student never shadows a longer sibling.
const PREFIXES = Object.keys(ROUTES).sort((a, b) => b.length - a.length);

const upstreamFor = (url) => {
  const prefix = PREFIXES.find((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));
  return prefix ? { prefix, port: ROUTES[prefix] } : null;
};

const server = http.createServer((req, res) => {
  const target = upstreamFor(req.url);

  if (!target) {
    res.writeHead(502, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'error',
      message: `No local service is mapped to "${req.url}". Known prefixes: ${PREFIXES.join(', ')}`,
      data: null,
    }));
  }

  const started = Date.now();
  const proxied = http.request(
    { host: UPSTREAM_HOST, port: target.port, method: req.method, path: req.url, headers: req.headers },
    (upstream) => {
      console.log(`${req.method} ${req.url} -> :${target.port} ${upstream.statusCode} ${Date.now() - started}ms`);
      res.writeHead(upstream.statusCode, upstream.headers);
      upstream.pipe(res);
    },
  );

  proxied.on('error', (err) => {
    // Almost always "that service is not running yet" — say so plainly rather
    // than letting the app show a generic network failure.
    console.error(`${req.method} ${req.url} -> :${target.port} FAILED ${err.code}`);
    res.writeHead(503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      status: 'error',
      message: `${target.prefix} is mapped to 127.0.0.1:${target.port} but nothing answered there (${err.code}). Is that service running?`,
      data: null,
    }));
  });

  req.pipe(proxied);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`gateway listening on 0.0.0.0:${PORT}`);
  for (const p of PREFIXES) console.log(`  ${p.padEnd(24)} -> 127.0.0.1:${ROUTES[p]}`);
  console.log('\nPoint the app at this origin, e.g. EXPO_PUBLIC_API_URL=http://<your-lan-ip>:' + PORT);
});
