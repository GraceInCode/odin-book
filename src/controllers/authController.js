const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

exports.registerUser = async (req, res, next) => {
    try {
        console.log('Register attempt:', req.body);
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/auth/register');
        }
        
        console.log('Checking for existing user...');
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            req.flash('error', 'Username already exists.');
            return res.redirect('/auth/register');
        }
        
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        console.log('Creating user...');
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
        
        console.log('User created, generating gravatar...');
        user.profilePicture = `https://www.gravatar.com/avatar/${require('crypto').createHash('md5').update(user.email.trim().toLowerCase()).digest('hex')}?d=identicon`;
        
        console.log('Updating profile picture...');
        await prisma.user.update({ where: { id: user.id }, data: { profilePicture: user.profilePicture } });
        
        console.log('Logging in user...');
        req.login(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }
            req.flash('success', 'Registration successful.');
            return res.redirect('/');
        });
    } catch (err) {
        console.error('Registration error:', err);
        console.error('Error stack:', err.stack);
        req.flash('error', 'Registration failed. Please try again.');
        return res.redirect('/auth/register');
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
    console.error('Guest login error:', err);
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