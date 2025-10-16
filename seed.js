const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
    // Delete existing data for clean seed
    await prisma.$transaction([
        prisma.like.deleteMany(),
        prisma.comment.deleteMany(),
        prisma.post.deleteMany(),
        prisma.follow.deleteMany(),
        prisma.user.deleteMany()
    ]);

    // Create 10 fake users with IDs
    const users = [];
    for (let i = 0; i < 10; i++) {
        const username = faker.internet.username();
        const email = faker.internet.email({ firstName: username });
        const password = await bcrypt.hash('password123', SALT_ROUNDS);
        const profilePicture = `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(email).digest('hex')}?d=identicon&s=200`;
        const user = await prisma.user.create({
            data: { username, email, password, profilePicture },
        });
        users.push(user); // Now includes id
    }
    console.log('Created 10 users');

    // Create follows (each user follows 3-5 random others, mix statuses)
    for (const user of users) {
        const numFollows = faker.number.int({ min: 3, max: 5 });
        const potentialFollowed = users.filter(u => u.id !== user.id); // No self follow
        const shuffled = faker.helpers.shuffle(potentialFollowed).slice(0, numFollows);

        for (const followed of shuffled) {
            const status = faker.helpers.arrayElement(['PENDING', 'ACCEPTED']);
            await prisma.follow.create({
                data: {
                    followerId: user.id,
                    followedId: followed.id,
                    status,
                },
            });
        }
    }
    console.log('Created follows with pending/accepted status');

    // Create posts (each user gets 5-10 posts)
    for (const user of users) {
        const numPosts = faker.number.int({ min: 5, max: 10 });
        for (let i = 0; i < numPosts; i++) {
            await prisma.post.create({
                data: {
                    content: faker.lorem.sentence(),
                    imageUrl: faker.helpers.maybe(() => faker.image.url(), { probability: 0.5 }) ?? null,
                    userId: user.id, // Now valid
                }
            });
        }
    }
    console.log('Created posts');

    // Fetch all posts for linking
    const posts = await prisma.post.findMany();

    // Create likes (each post gets 0-5 likes from random users)
    for (const post of posts) {
        const numLikes = faker.number.int({ min: 0, max: 5 });
        const likers = faker.helpers.shuffle(users).slice(0, numLikes);
        for (const liker of likers) {
            await prisma.like.create({
                data: {
                    userId: liker.id,
                    postId: post.id
                },
            });
        }
    }
    console.log('Created likes');

    // Create comments (each post gets 0-3 comments from random users)
    for (const post of posts) {
        const numComments = faker.number.int({ min: 0, max: 3 });
        const commenters = faker.helpers.shuffle(users).slice(0, numComments);
        for (const commenter of commenters) {
            await prisma.comment.create({
                data: {
                    content: faker.lorem.sentence(),
                    userId: commenter.id,
                    postId: post.id
                },
            });
        }
    }
    console.log('Seeding complete! Check the database for results.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });