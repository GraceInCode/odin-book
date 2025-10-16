const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const { isNotGuest } = require('../middleware/isNotGuest');

const router = express.Router();

console.log('isNotGuest type:', typeof isNotGuest);

router.get('/register', (req, res) => res.render('auth/register'));
router.post('/register', isNotGuest,
    body('username').trim().isAlphanumeric().notEmpty().withMessage('Username required'),
    body('email').trim().isEmail().notEmpty().withMessage('Email required'),
    body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 8 characters long'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect('/auth/register');
        }
        next();
    },
    authController.registerUser);

router.get('/login', (req, res) => res.render('auth/login'));
router.post('/login', isNotGuest, passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: true
}),
authController.loginUser
);

router.post('/guest', authController.guestLogin);

router.get('/logout', authController.logoutUser);

module.exports = router;