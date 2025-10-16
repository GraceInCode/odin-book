const express = require('express');
const userController = require('../controllers/userController');
const { isAuthenticated, isOwnProfile } = require('../middleware/auth');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const upload = multer({
    dest: 'uploads/', // Temp
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Not an image'), false);
    }
}); 

router.get('/', isAuthenticated, userController.getUsers); // users index
router.get('/:id', isAuthenticated, userController.getProfile); // user profile
router.get('/:id/edit', isAuthenticated, isOwnProfile, userController.getEditProfile); // Form
router.put('/:id', isAuthenticated, isOwnProfile, upload.single('profilePicture'), 
  body('bio').trim().optional().isLength({ max: 200 }).withMessage('Bio too long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.redirect(`/users/${req.params.id}/edit`);
    }
    next();
  },
  userController.updateProfile); // Update

  
console.log('isAuthenticated type:', typeof isAuthenticated); // Should be 'function'
console.log('getUsers type:', typeof userController.getUsers); // Should be 'function'


module.exports = router;