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

// Session middleware - Fixed for Prisma
const { Pool } = require('pg');

// Create a separate connection pool for sessions
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('Session secret set:', !!process.env.SESSION_SECRET);

app.use(session({
  store: new pgSession({
    pool: sessionPool,
    tableName: 'session', // Lowercase to match PostgreSQL convention
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // HTTPS only in production
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

// Global error handler - Fixed for server-rendered app
app.use((err, req, res, next) => {
  console.error('Error caught by global handler:');
  console.error(err.stack);
  
  if (!res.headersSent) {
    // For server-rendered apps, redirect with flash message instead of JSON
    req.flash('error', 'Something went wrong. Please try again.');
    
    // Redirect to appropriate page based on context
    const referer = req.get('referer');
    if (referer) {
      res.redirect(referer);
    } else {
      res.redirect('/');
    }
  } else {
    next(err); // Pass if headers already sent
  }
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