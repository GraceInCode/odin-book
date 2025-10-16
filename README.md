# Odin-Book

Social media clone (Facebook/X style) built with Node.js for course capstone.

## Tech Stack

- Node.js + Express
- PostgreSQL (Neon)
- Prisma ORM
- Passport.js (local)
- Express-session (PG store prod)

## Features

- Auth (register/login/guest)
- Profiles (Gravatar)
- Posts (text/image)
- Follows/likes/comments
- Feeds (posts/users)

## Setup

1. `npm i`
2. Neon DB, .env with DATABASE_URL/SESSION_SECRET
3. `npx prisma migrate dev`
4. `npm run dev`

## Tests

`npm test` (Supertest/Prisma)

Deployed: [link]
