import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';

describe('Authentication & Session Handling', () => {
  let app, req;

  before(() => {
    const env = setupTestEnvironment();
    app = env.app;
    req = env.request;
  });

  after(() => {
    teardownTestEnvironment();
  });

  const validUser = {
    name: 'Alice Sharma',
    email: 'alice@example.com',
    password: 'SecurePassword123'
  };

  it('registers a new user successfully with Argon2id and sets session cookie', async () => {
    const res = await req
      .post('/api/auth/register')
      .send(validUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, validUser.email.toLowerCase());
    assert.equal(res.body.user.name, validUser.name);
    assert.ok(res.body.csrfToken, 'CSRF token returned');
    assert.ok(!res.body.user.password_hash, 'Password hash must never be returned');

    // Cookie check
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies && cookies.length > 0, 'Set-Cookie header should be present');
    assert.ok(cookies[0].includes('et_session_id='), 'Session cookie present');
    assert.ok(cookies[0].includes('HttpOnly'), 'Cookie must be HttpOnly');
  });

  it('prevents duplicate email registration (409 Conflict)', async () => {
    const res = await req
      .post('/api/auth/register')
      .send(validUser);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('already exists'));
  });

  it('rejects registration with invalid or weak password', async () => {
    const res = await req
      .post('/api/auth/register')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'weak' // lacks length, uppercase, number
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.details, 'Validation details should be returned');
  });

  it('logs in an existing user with correct credentials and returns session', async () => {
    const res = await req
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: validUser.password
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, validUser.email);
    assert.ok(res.body.csrfToken);
  });

  it('returns generic 401 error on invalid password without leaking user existence', async () => {
    const res = await req
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: 'WrongPassword999'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid email or password.');
  });

  it('returns generic 401 error on nonexistent email without leaking user existence', async () => {
    const res = await req
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'SomePassword123'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Invalid email or password.');
  });

  it('rejects access to /api/auth/me without session cookie', async () => {
    const res = await req.get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('allows access to /api/auth/me with valid session cookie and logs out', async () => {
    const loginRes = await req
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const cookie = loginRes.headers['set-cookie'];

    const meRes = await req
      .get('/api/auth/me')
      .set('Cookie', cookie);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.user.email, validUser.email);

    // Logout
    const logoutRes = await req
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    assert.equal(logoutRes.status, 200);

    // Verify session invalidated
    const meAfterLogout = await req
      .get('/api/auth/me')
      .set('Cookie', cookie);

    assert.equal(meAfterLogout.status, 401);
  });
});
