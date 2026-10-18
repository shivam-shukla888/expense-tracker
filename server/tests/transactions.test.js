import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';

describe('Transaction Management & Data Isolation', () => {
  let req;
  let userACookie, userBCookie;
  let userACsrf, userBCsrf;

  before(async () => {
    const env = setupTestEnvironment();
    req = env.request;

    // Register User A
    const resA = await req.post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'Password123'
    });
    userACookie = resA.headers['set-cookie'];
    userACsrf = resA.body.csrfToken;

    // Register User B
    const resB = await req.post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'Password123'
    });
    userBCookie = resB.headers['set-cookie'];
    userBCsrf = resB.body.csrfToken;
  });

  after(() => {
    teardownTestEnvironment();
  });

  let createdTxId;

  it('allows User A to create an income transaction with integer paise accuracy', async () => {
    const res = await req
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .set('x-csrf-token', userACsrf)
      .send({
        type: 'income',
        category: 'Salary',
        amount: 75000.50,
        description: 'Monthly Developer Salary',
        date: '2026-10-01'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.transaction.amountPaise, 7500050);
    assert.equal(res.body.transaction.amount, 75000.50);
    assert.equal(res.body.transaction.type, 'income');
    assert.equal(res.body.transaction.category, 'Salary');
    createdTxId = res.body.transaction.id;
  });

  it('allows User A to create an expense transaction', async () => {
    const res = await req
      .post('/api/transactions')
      .set('Cookie', userACookie)
      .set('x-csrf-token', userACsrf)
      .send({
        type: 'expense',
        category: 'Food',
        amount: 1250.75,
        description: 'Organic groceries',
        date: '2026-10-05'
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.transaction.amountPaise, 125075);
    assert.equal(res.body.transaction.amount, 1250.75);
    assert.equal(res.body.transaction.type, 'expense');
  });

  it('allows User A to retrieve their created transaction', async () => {
    const res = await req
      .get(`/api/transactions/${createdTxId}`)
      .set('Cookie', userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.transaction.id, createdTxId);
    assert.equal(res.body.transaction.description, 'Monthly Developer Salary');
  });

  it('STRICT PRIVACY: prevents User B from accessing User A transaction (404 / Unauthorized)', async () => {
    const res = await req
      .get(`/api/transactions/${createdTxId}`)
      .set('Cookie', userBCookie);

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it('STRICT PRIVACY: prevents User B from updating User A transaction', async () => {
    const res = await req
      .put(`/api/transactions/${createdTxId}`)
      .set('Cookie', userBCookie)
      .set('x-csrf-token', userBCsrf)
      .send({ description: 'Hacked description' });

    assert.equal(res.status, 404);
  });

  it('STRICT PRIVACY: prevents User B from deleting User A transaction', async () => {
    const res = await req
      .delete(`/api/transactions/${createdTxId}`)
      .set('Cookie', userBCookie)
      .set('x-csrf-token', userBCsrf);

    assert.equal(res.status, 404);
  });

  it('allows User A to update their own transaction', async () => {
    const res = await req
      .put(`/api/transactions/${createdTxId}`)
      .set('Cookie', userACookie)
      .set('x-csrf-token', userACsrf)
      .send({
        amount: 80000,
        description: 'Monthly Developer Salary with Bonus'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.transaction.amountPaise, 8000000);
    assert.equal(res.body.transaction.description, 'Monthly Developer Salary with Bonus');
  });

  it('lists transactions with filters, pagination, and sorting', async () => {
    const res = await req
      .get('/api/transactions?type=income&page=1&limit=10')
      .set('Cookie', userACookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.totalRecords, 1);
  });

  it('handles SQL injection patterns safely in search queries', async () => {
    const sqlInjectionSearch = "Developer' OR '1'='1";
    const res = await req
      .get(`/api/transactions?search=${encodeURIComponent(sqlInjectionSearch)}`)
      .set('Cookie', userACookie);

    assert.equal(res.status, 200);
    // Should safely treat as literal string and not leak records
    assert.equal(res.body.data.length, 0);
  });

  it('allows User A to delete their transaction', async () => {
    const res = await req
      .delete(`/api/transactions/${createdTxId}`)
      .set('Cookie', userACookie)
      .set('x-csrf-token', userACsrf);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify deletion
    const verifyRes = await req
      .get(`/api/transactions/${createdTxId}`)
      .set('Cookie', userACookie);

    assert.equal(verifyRes.status, 404);
  });
});
