process.env.JWT_SECRET = 'test-access-secret-at-least-32-bytes-long';
process.env.JWT_REFRESH_SECRET = 'different-refresh-secret-at-least-32-bytes';
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-bytes-long';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.CAPTCHA_SECRET_KEY = '';

const request = require('supertest');
const app = require('../src/app');

test('rejects forwarded host header poisoning', async () => {
  const res = await request(app).get('/health').set('x-forwarded-host', 'evil.example');
  expect(res.status).toBe(400);
});

test('rejects an untrusted Host header', async () => {
  const res = await request(app).get('/health').set('host', 'evil.example');
  expect(res.status).toBe(400);
});

test('rejects MongoDB operators and dotted keys', async () => {
  const agent = request.agent(app);
  const initial = await agent.get('/health');
  const token = initial.headers['set-cookie'][0].split(';')[0].split('=').slice(1).join('=');
  const operator = await agent.post('/api/auth/login').set('x-csrf-token', token).send({
    email: { $ne: null },
    password: 'anything'
  });
  expect(operator.status).toBe(400);
  expect(operator.body.message).toBe('Invalid request structure');
});

test('security headers include a restrictive API CSP', async () => {
  const res = await request(app).get('/health');
  expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['x-powered-by']).toBeUndefined();
});
