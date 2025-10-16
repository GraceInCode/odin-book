const express = require('express');
const postController = require('../controllers/postController');
const { isAuthenticated } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { isNotGuest } = require('../middleware/isNotGuest');
const multer = require('multer');
const upload = multer({
    dest: 'uploads/', // Temp
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Not an image'), false);
    }
}); 

const router = express.Router();

router.get('/', isAuthenticated, postController.getFeed); // posts feed
router.post('/', isAuthenticated, upload.single('image'), isNotGuest,
    body('content').trim().notEmpty().withMessage('Content required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect('/');
        }
        next();
    },
    postController.createPost); // posts create
router.get('/:id', isAuthenticated, postController.getPost); // single post

module.exports = router;