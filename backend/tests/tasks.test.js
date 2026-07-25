process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.FRONTEND_URL = 'http://localhost:3001';

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
  await agent.post('/api/auth/register').set('x-csrf-token', token).send({ email: 'a@b.com', password: 'Str0ng!Pass', profile: { name: 'A' } });
  await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'a@b.com', password: 'Str0ng!Pass' });
  const res = await agent.post('/api/tasks').set('x-csrf-token', token).send({ title: '<script>alert(1)</script>Task' });
  expect(res.status).toBe(201);
  expect(res.body.title).not.toContain('<script>');
});
