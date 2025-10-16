require('dotenv').config(); // Load env vars first
const express = require('express');
const session = require('express-session');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { isAuthenticated } = require('./src/middleware/auth');
const pgSession = require('connect-pg-simple')(session);

const app = express();
const prisma = new PrismaClient(); // Singleton for efficiency

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

// Method override
const methodOverride = require('method-override');
app.use(methodOverride('_method')); // This checks query string
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


app.use((req, res, next) => {
  console.log(`Global after override: ${req.method} ${req.originalUrl} (body: ${JSON.stringify(req.body)})`);
  next();
});

// Set up view engine for server-rendered pages (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

const flash = require('connect-flash');
const passport = require('./src/config/passport');


// Session middleware
let store;
if (process.env.NODE_ENV === 'production') {
  store = new pgSession({
    pool: prisma.$pool
  });
}
app.use(session({
  store: new pgSession({
    pool: prisma.$pool, // Reuse Prisma connections (perf)
    tableName: 'Session' // Default
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // HTTPS only
  }
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Flash for messages
app.use(flash());

// Make user/flash available in views (global)
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Mount routes
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const userRoutes = require('./src/routes/userRoutes');
const followRoutes = require('./src/routes/followRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const likeRoutes = require('./src/routes/likeRoutes');

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/users', userRoutes);
app.use('/follows', followRoutes);
app.use('/comments', commentRoutes);
app.use('/likes', likeRoutes);

// Root route
app.get('/', isAuthenticated, (req, res) => {
    res.render('index');
})

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app; // Export for tests

if (require.main === module) { // Listen only if run directly
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
})