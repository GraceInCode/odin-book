const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

exports.registerUser = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        // Basic validation
        if (!username || !email || !password) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/auth/register');
        }
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            req.flash('error', 'Username already exists.');
            return res.redirect('/auth/register');
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
        user.profilePicture = `https://www.gravatar.com/avatar/${require('crypto').createHash('md5').update(user.email.trim().toLowerCase()).digest('hex')}?d=identicon`; // Fallback to identicon
        await prisma.user.update({ where: { id: user.id }, data: { profilePicture: user.profilePicture } });
        req.login(user, (err) => { // Auto login after register
            if (err) return next(err);
            req.flash('success', 'Registration successful.');
            return res.redirect('/');
        });
    } catch (err) {
        next(err);
    }
};

exports.loginUser = (req, res, next) => {
    // Passport handles auth; this is success handler
    req.flash('success', 'Login successful.');
    res.redirect('/');
}

exports.guestLogin = async (req, res, next) => {
  try {
    let guest = await prisma.user.findUnique({ where: { username: 'guest' } });
    if (!guest) {
      const hashedPassword = await bcrypt.hash('guestpw', SALT_ROUNDS);
      guest = await prisma.user.create({
        data: {
          username: 'guest',
          email: 'guest@example.com',
          password: hashedPassword,
          bio: 'Guest account - read-only',
        },
      });
    }
    req.login(guest, (err) => {
      if (err) return next(err);
      req.flash('success', 'Logged in as guest!');
      res.redirect('/');
    });
  } catch (err) {
    console.error('Guest login error:', err); // Dev log for stack
    next(err);
  }
};

exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success', 'Logged out successfully.');
        res.redirect('/auth/login');
    });
};