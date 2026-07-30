process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.CAPTCHA_SITE_KEY = '';
process.env.CAPTCHA_SECRET_KEY = '';

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

test('captcha config is disabled when no secret is configured', async () => {
  const res = await request(app).get('/api/auth/captcha-config');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ siteKey: null });
});

test('register rejects weak passwords', async () => {
  const res = await request(app).post('/api/auth/register').set('x-csrf-token', 'x').set('Cookie', ['csrfToken=x']).send({
    email: 'student@example.com',
    password: 'weak',
    profile: { name: 'Student' }
  });
  expect(res.status).toBe(400);
});

test('register accepts strong passwords', async () => {
  const res = await request(app).post('/api/auth/register').set('x-csrf-token', 'x').set('Cookie', ['csrfToken=x']).send({
    email: 'student@example.com',
    password: 'Str0ng!Pass12',
    profile: { name: 'Student' }
  });
  expect(res.status).toBe(201);
});
