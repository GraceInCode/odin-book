const express = require('express');
const commentController = require('../controllers/commentController');
const { isAuthenticated } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { isNotGuest } = require('../middleware/isNotGuest');

const router = express.Router();

router.post('/', isAuthenticated, isNotGuest,
    body('content').trim().notEmpty().withMessage('Content required'),
    body('postId').trim().isInt().notEmpty().withMessage('Post ID required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', errors.array()[0].msg);
            return res.redirect(req.headers.referer || '/posts');
        }
        next();
    },
    commentController.createComment);
router.delete('/:commentId', isAuthenticated, commentController.deleteComment);

module.exports = router;