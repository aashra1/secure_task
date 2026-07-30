process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.CAPTCHA_SITE_KEY = '';
process.env.CAPTCHA_SECRET_KEY = '';
process.env.GOOGLE_CLIENT_ID = '';
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-bytes-long';
process.env.SALT_ROUNDS = '4';
process.env.LOGIN_MAX_ATTEMPTS = '15';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

let mongo;
jest.setTimeout(30000);
beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
afterEach(async () => {
  if (mongoose.connection.db) await mongoose.connection.db.dropDatabase();
});

const csrf = async (agent) => {
  const res = await agent.get('/health');
  return res.headers['set-cookie'][0].split(';')[0].split('=').slice(1).join('=');
};

test('captcha config is disabled when no secret is configured', async () => {
  const res = await request(app).get('/api/auth/captcha-config');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ siteKey: null });
});

test('google config is disabled when no client ID is configured', async () => {
  const res = await request(app).get('/api/auth/google-config');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ clientId: null });
});

test('google login requires a credential', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  const res = await agent.post('/api/auth/google').set('x-csrf-token', token).send({});
  expect(res.status).toBe(400);
});

test('register rejects weak passwords', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  const res = await agent.post('/api/auth/register').set('x-csrf-token', token).send({
    email: 'student@example.com',
    password: 'weak',
    profile: { name: 'Student' }
  });
  expect(res.status).toBe(400);
});

test('register accepts strong passwords', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  const res = await agent.post('/api/auth/register').set('x-csrf-token', token).send({
    email: 'student@example.com',
    password: 'Str0ng!Pass12',
    profile: { name: 'Student' }
  });
  expect(res.status).toBe(201);
});

test('state-changing requests require a valid CSRF token', async () => {
  const res = await request(app).post('/api/auth/register').send({
    email: 'csrf@example.com',
    password: 'Str0ng!Pass12',
    profile: { name: 'CSRF' }
  });
  expect(res.status).toBe(403);
});

test('JWTs are only returned in HttpOnly SameSite cookies', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  await agent.post('/api/auth/register').set('x-csrf-token', token).send({
    email: 'cookies@example.com',
    password: 'Str0ng!Pass12',
    profile: { name: 'Cookies' }
  });
  const res = await agent.post('/api/auth/login').set('x-csrf-token', token).send({
    email: 'cookies@example.com',
    password: 'Str0ng!Pass12'
  });
  expect(res.status).toBe(200);
  expect(res.body.accessToken).toBeUndefined();
  expect(res.body.refreshToken).toBeUndefined();
  expect(res.headers['set-cookie']).toEqual(expect.arrayContaining([
    expect.stringMatching(/^accessToken=.*HttpOnly.*SameSite=Strict/),
    expect.stringMatching(/^refreshToken=.*HttpOnly.*SameSite=Strict/)
  ]));
});

test('login returns 429 after 15 failed attempts and locks the account', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  await agent.post('/api/auth/register').set('x-csrf-token', token).send({
    email: 'locked@example.com',
    password: 'Str0ng!Pass12',
    profile: { name: 'Locked' }
  });
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const res = await agent.post('/api/auth/login').set('x-csrf-token', token).send({
      email: 'locked@example.com',
      password: 'Wr0ng!Pass12'
    });
    expect(res.status).toBe(401);
  }
  const limited = await agent.post('/api/auth/login').set('x-csrf-token', token).send({
    email: 'locked@example.com',
    password: 'Str0ng!Pass12'
  });
  expect(limited.status).toBe(429);
});
