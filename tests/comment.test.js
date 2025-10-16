const request = require('supertest');
const app = require('../app.js');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const prisma = new PrismaClient();

describe('Comment Routes', () => {
  let cookie;
  let testPostId;
  let userId;
  const testUsername = 'testuser_' + Date.now();
  const testEmail = 'test_' + Date.now() + '@example.com';

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('testpw', SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        username: testUsername,
        email: testEmail,
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

    const postRes = await request(app)
      .post('/posts')
      .send({ content: 'Test for comment' })
      .set('Cookie', cookie);
    expect(postRes.status).toBe(302);

    const testPost = await prisma.post.findFirst({ where: { content: 'Test for comment' } });
    testPostId = testPost ? testPost.id : null;
    expect(testPostId).not.toBeNull();
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({ where: { content: 'Test comment' } });
    await prisma.post.deleteMany({ where: { content: 'Test for comment' } });
    await prisma.user.deleteMany({ where: { username: testUsername } });
    await prisma.$disconnect();
  });

  test('POST /comments creates comment', async () => {
    const res = await request(app)
      .post('/comments')
      .send({ postId: testPostId, content: 'Test comment' })
      .set('Cookie', cookie);
    expect(res.status).toBe(302);

    const comment = await prisma.comment.findFirst({ where: { content: 'Test comment' } });
    expect(comment).not.toBeNull();
    expect(comment.postId).toBe(testPostId);
    expect(comment.userId).toBe(userId);
  });
});