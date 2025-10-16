const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');

const prisma = new PrismaClient();

exports.getProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      req.flash('error', 'Invalid user ID.');
      return res.redirect('/users');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: { orderBy: { createdAt: 'desc' }, include: { likes: true, comments: true } },
        followers: { where: { status: 'ACCEPTED' }, include: { follower: { select: { id: true, username: true, profilePicture: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/users');
    }

    const isOwnProfile = user.id === req.user.id;
    // Fallback if profilePicture missing
    user.profilePicture = user.profilePicture || `/default-avatar.png`; // Local fallback

    res.render('users/profile', { user, isOwnProfile });
  } catch (err) {
    next(err);
  }
};

// Similar update for getUsers if needed
exports.getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { followers: true, following: true },
    });
    const followMap = new Map();
    if (req.user) {
      const follows = await prisma.follow.findMany({ where: { followerId: req.user.id } });
      follows.forEach(f => followMap.set(f.followedId, f.status));
    }
    users.forEach(user => {
      user.profilePicture = user.profilePicture || `/default-avatar.png`; // Fallback
    });
    res.render('users/index', { users, followMap, currentUserId: req.user?.id });
  } catch (err) {
    next(err);
  }
};

exports.getEditProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.render('users/edit', { user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { bio } = req.body;
    let profilePicture = req.user.profilePicture; // Keep existing if no new

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'odin-book/profiles' });
      profilePicture = result.secure_url;
      await fs.unlink(req.file.path).catch(() => {});
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { bio, profilePicture },
    });

    req.flash('success', 'Profile updated!');
    res.redirect(`/users/${req.user.id}`);
  } catch (err) {
    console.error('Profile update error:', err); // Dev log
    req.flash('error', 'Update failed.');
    res.redirect(`/users/${req.user.id}/edit`);
  }
};