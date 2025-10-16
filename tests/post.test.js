const request = require('supertest');
const app = require('../app.js');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const prisma = new PrismaClient();

describe('Post Routes', () => {
  let cookie;
  let userId;
  const testUsername = 'testuser_' + Date.now(); // Unique

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpw', SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        username: testUsername,
        email: 'testuser@example.com',
        password: hashedPassword,
      },
    });
    userId = user.id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: testUsername, password: 'testpw' });
    expect(loginRes.status).toBe(302);
    expect(loginRes.headers.location).toBe('/');
    cookie = loginRes.headers['set-cookie'];
  });

  afterAll(async () => {
    await prisma.post.deleteMany({ where: { content: 'Test post' } });
    await prisma.user.deleteMany({ where: { username: testUsername } });
    await prisma.$disconnect();
  });

  test('POST /posts creates post', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ content: 'Test post' })
      .set('Cookie', cookie);
    expect(res.status).toBe(302);

    const post = await prisma.post.findFirst({ where: { content: 'Test post' } });
    expect(post).not.toBeNull();
    expect(post.userId).toBe(userId);
  });

  test('GET /posts requires auth', async () => {
    const res = await request(app).get('/posts');
    expect(res.status).toBe(302);
  });
});