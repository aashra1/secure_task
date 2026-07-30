process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.CAPTCHA_SITE_KEY = '';
process.env.CAPTCHA_SECRET_KEY = '';
process.env.SESSION_SECRET = 'test-session-secret-at-least-32-bytes-long';
process.env.SALT_ROUNDS = '4';

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

const csrf = (agent) => agent.get('/health').then((res) => res.headers['set-cookie'][0].split(';')[0].split('=')[1]);

test('task endpoints require authentication', async () => {
  const res = await request(app).get('/api/tasks');
  expect(res.status).toBe(401);
});

test('created tasks are sanitized', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  await agent.post('/api/auth/register').set('x-csrf-token', token).send({ email: 'a@b.com', password: 'Str0ng!Pass12', profile: { name: 'A' } });
  await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'a@b.com', password: 'Str0ng!Pass12' });
  const res = await agent.post('/api/tasks').set('x-csrf-token', token).send({ title: '<script>alert(1)</script>Task' });
  expect(res.status).toBe(201);
  expect(res.body.title).not.toContain('<script>');
});

test('file and attachment payloads are rejected', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent);
  await agent.post('/api/auth/register').set('x-csrf-token', token).send({ email: 'files@example.com', password: 'Str0ng!Pass12', profile: { name: 'Files' } });
  await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'files@example.com', password: 'Str0ng!Pass12' });
  const metadata = await agent.post('/api/tasks').set('x-csrf-token', token).send({
    title: 'Unsafe attachment',
    attachments: [{ filename: 'report.pdf', url: 'https://example.com/report.pdf' }]
  });
  expect(metadata.status).toBe(400);
  const multipart = await agent.post('/api/tasks').set('x-csrf-token', token).attach('file', Buffer.from('%PDF'), 'report.pdf');
  expect(multipart.status).toBe(415);
});

test('users cannot read, update, or delete another users task', async () => {
  const owner = request.agent(app);
  const attacker = request.agent(app);
  const ownerCsrf = await csrf(owner);
  const attackerCsrf = await csrf(attacker);
  await owner.post('/api/auth/register').set('x-csrf-token', ownerCsrf).send({ email: 'owner@example.com', password: 'Str0ng!Pass12', profile: { name: 'Owner' } });
  await owner.post('/api/auth/login').set('x-csrf-token', ownerCsrf).send({ email: 'owner@example.com', password: 'Str0ng!Pass12' });
  await attacker.post('/api/auth/register').set('x-csrf-token', attackerCsrf).send({ email: 'attacker@example.com', password: 'Str0ng!Pass12', profile: { name: 'Attacker' } });
  await attacker.post('/api/auth/login').set('x-csrf-token', attackerCsrf).send({ email: 'attacker@example.com', password: 'Str0ng!Pass12' });
  const created = await owner.post('/api/tasks').set('x-csrf-token', ownerCsrf).send({ title: 'Private task' });
  const id = created.body._id;
  expect((await attacker.get(`/api/tasks/${id}`)).status).toBe(404);
  expect((await attacker.put(`/api/tasks/${id}`).set('x-csrf-token', attackerCsrf).send({ title: 'Stolen' })).status).toBe(404);
  expect((await attacker.delete(`/api/tasks/${id}`).set('x-csrf-token', attackerCsrf)).status).toBe(404);
});
