const express = require('express');
const likeController = require('../controllers/likeController');
const { isAuthenticated } = require('../middleware/auth');
const { isNotGuest } = require('../middleware/isNotGuest');
const { body } = require('express-validator');

const router = express.Router();

router.post('/', isAuthenticated, isNotGuest,
    body('postId').trim().isInt().notEmpty().withMessage('Post ID required'),
    likeController.createLike);
router.delete('/:postId', isAuthenticated, likeController.deleteLike);

module.exports = router;