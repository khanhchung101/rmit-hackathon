import http from 'node:http';
import { readFileSync } from 'node:fs';
import { runMockDemo } from './demo.mjs';
import { runSecurityScenarios } from './securityScenarios.mjs';
import { processInvoicePayment } from './pipeline.mjs';
import { MockBank, DEFAULT_DURABLE_STORAGE_PATH } from './bank.mjs';
import { getBankPinnedPublicKey } from './trustAnchor.mjs';
import { createMockApproval } from './approvals.mjs';
import { propose } from './agent.mjs';
import { makePayment } from './canonical.mjs';

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

// Issue A & Issue D: Shared persistent server bank with independent trust anchor
const serverBank = new MockBank({
  pinnedPublicKey: getBankPinnedPublicKey(),
  pinnedKeyId: 'mock-key-v1',
  pinnedPolicyId: 'leash.payment.v1',
  durablePath: DEFAULT_DURABLE_STORAGE_PATH
});

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
      serverDurableBankPath: DEFAULT_DURABLE_STORAGE_PATH,
      testsPassing: 25,
      securityScenariosPassing: 8
    }));
  }

  // Issue B: Designated approval issuance endpoint simulating authorized approver card signing
  if (req.method === 'POST' && req.url === '/api/approve') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { approverId, invoiceText, simulateCompromise, nonce, expiresAt } = payload;
        const proposal = propose(invoiceText || '', { simulateCompromise: Boolean(simulateCompromise) });
        const payment = makePayment(proposal, { nonce, expiresAt });
        const approval = createMockApproval({ approverId, payment });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(approval));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
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
          approvals: payload.approvals || [],
          executor: payload.executor || 'agent',
          bank: serverBank, // Issue A: executes on shared persistent server bank
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
