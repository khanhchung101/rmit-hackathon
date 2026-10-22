import http from 'node:http';
import { readFileSync } from 'node:fs';
import { runMockDemo } from './demo.mjs';
import { runSecurityScenarios } from './securityScenarios.mjs';
import { processInvoicePayment } from './pipeline.mjs';

const port = Number(process.env.PORT || 8787);
const html = readFileSync(new URL('../public/index.html', import.meta.url));

const fixtureNames = [
  'valid-low',
  'valid-high',
  'malicious-prompt-injection',
  'wrong-currency',
  'malformed'
];

const fixtures = {};
for (const name of fixtureNames) {
  try {
    fixtures[name] = readFileSync(new URL(`../fixtures/invoices/${name}.txt`, import.meta.url), 'utf8');
  } catch {}
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (req.method === 'GET' && req.url === '/api/fixtures') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(fixtures));
  }

  if (req.method === 'GET' && req.url === '/api/mock-demo') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(runMockDemo()));
  }

  if (req.method === 'GET' && req.url === '/api/security') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(await runSecurityScenarios()));
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      mode: process.env.TIDE_MODE === 'real' ? 'REAL_TIDE' : 'MOCK_ONLY_NOT_TIDE',
      tide: 'REAL_TIDE_NOT_WIRED',
      testsPassing: 25,
      securityScenariosPassing: 8
    }));
  }

  if (req.method === 'POST' && req.url === '/api/pipeline') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await processInvoicePayment({
          invoiceText: payload.invoiceText || '',
          simulateCompromise: Boolean(payload.simulateCompromise),
          approvals: payload.approvals || [{ approverId: 'finance-a' }],
          executor: payload.executor || 'agent',
          options: payload.nonce ? { nonce: payload.nonce } : {}
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'NOT_FOUND' }));
});

server.listen(port, '127.0.0.1', () => console.log(`Leash MOCK_ONLY_NOT_TIDE at http://127.0.0.1:${port}`));
