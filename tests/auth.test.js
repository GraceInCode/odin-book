const request = require('supertest');
const app = require('../app.js');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const prisma = new PrismaClient();

describe('Auth Routes', () => {
  const testUsername = 'testuser_' + Date.now();

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpw', SALT_ROUNDS);
    await prisma.user.create({
      data: {
        username: testUsername,
        email: 'test@example.com',
        password: hashedPassword,
        bio: 'Test user'
      },
    });
  });

  test('GET / requires auth - redirects unauthed', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('POST /auth/login succeeds with valid creds', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: testUsername, password: 'testpw' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: testUsername } });
    await prisma.$disconnect();
  });
});