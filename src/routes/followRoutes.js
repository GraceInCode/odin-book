const express = require('express');
const followController = require('../controllers/followController');
const { isAuthenticated } = require('../middleware/auth');
const { isNotGuest } = require('../middleware/isNotGuest');
const { body } = require('express-validator');

const router = express.Router();


router.post('/', isAuthenticated, isNotGuest,
    body('followedId').trim().isInt().notEmpty().withMessage('Followed ID required'),
    followController.createFollow); // Send request
router.put('/:followerId', isAuthenticated, followController.updateFollow); // Accept/reject request
router.delete('/:followedId', isAuthenticated, followController.deleteFollow); // Unfollow
router.get('/requests', isAuthenticated, followController.getPendingRequests);
module.exports = router;