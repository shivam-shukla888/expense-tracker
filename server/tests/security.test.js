import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';

describe('Application Security & Robustness', () => {
  let req;
  let userCookie, validCsrf;

  before(async () => {
    const env = setupTestEnvironment();
    req = env.request;

    const res = await req.post('/api/auth/register').send({
      name: 'Security User',
      email: 'security@example.com',
      password: 'Password123'
    });
    userCookie = res.headers['set-cookie'];
    validCsrf = res.body.csrfToken;
  });

  after(() => {
    teardownTestEnvironment();
  });

  it('rejects POST request when CSRF token is completely missing (403 Forbidden)', async () => {
    const res = await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .send({
        type: 'income',
        category: 'Salary',
        amount: 50000,
        description: 'Test Salary',
        date: '2026-10-01'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('CSRF'));
  });

  it('rejects POST request when CSRF token is invalid or spoofed (403 Forbidden)', async () => {
    const res = await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', 'spoofed-fake-token-12345')
      .send({
        type: 'income',
        category: 'Salary',
        amount: 50000,
        description: 'Test Salary',
        date: '2026-10-01'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('allows POST request when correct CSRF token is provided', async () => {
    const res = await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', validCsrf)
      .send({
        type: 'income',
        category: 'Salary',
        amount: 50000,
        description: 'Test Salary',
        date: '2026-10-01'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  it('enforces JSON payload size limit (rejects payloads exceeding 10kb with 413)', async () => {
    const hugeDescription = 'A'.repeat(15 * 1024); // 15 KB
    const res = await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', validCsrf)
      .send({
        type: 'expense',
        category: 'Other',
        amount: 100,
        description: hugeDescription,
        date: '2026-10-01'
      });

    assert.equal(res.status, 413);
  });

  it('verifies /api/health responds with healthy database status and uptime', async () => {
    const res = await req.get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'connected');
  });
});
