const { PrismaClient } = require('@prisma/client');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs').promises;

const prisma = new PrismaClient();

exports.createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content.trim()) {
      req.flash('error', 'Content required.');
      return res.redirect('/');
    }

    let imageUrl = null;
    if (req.file) {
      console.log('Uploading file:', req.file.path, 'with config:', process.env.CLOUDINARY_CLOUD_NAME); // Debug env
  const result = await cloudinary.uploader.upload(req.file.path, { folder: 'odin-book' });
      try {
        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'odin-book' });
        imageUrl = result.secure_url;
      } catch (uploadErr) {
        console.error('Image upload error:', uploadErr); // Dev log
        req.flash('error', 'Image upload failed. Try again.');
        return res.redirect('/');
      } finally {
        await fs.unlink(req.file.path).catch(() => {}); // Always clean
      }
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl,
        userId: req.user.id,
      },
    });

    req.flash('success', 'Post created!');
    res.redirect('/');
  } catch (err) {
    next(err);
  }
};

// Placeholder for feed - add now for completeness
exports.getFeed = async (req, res, next) => {
    try {
        // Get accepted following IDs
        const following = await prisma.follow.findMany({
            where: { followerId: req.user.id, status: 'ACCEPTED' },
            select: { followedId: true },
        });
        const followedIds = following.map(f => f.followedId);
        followedIds.push(req.user.id); // Include own posts

        // Fetch posts from those users, sorted recent, with includes
        const posts = await prisma.post.findMany({
            where: { userId: { in: followedIds } },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } }, // Author info
                likes: true,
                comments: { orderBy: { createdAt: 'desc' } },
            },
        });

        res.render('posts/index', { posts });
    } catch (err) {
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.id, 10);
        if (isNaN(postId)) {
            req.flash('error', 'Invalid post ID.');
            return res.redirect('/posts');
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } },
                likes: true,
                comments: {
                    include: { user: { select: { id: true, username: true } } }, // Nested: comment authors
                    orderBy: { createdAt: 'desc' },
                }, 
            },
        });

        if (!post) {
            req.flash('error', 'Post not found.');
            return res.redirect('/posts');
        }

        res.render('posts/show', { post });
        console.log('Fetched post comments:', post.comments.map(c => ({ id: c.id, user: c.user })));
    } catch (err) {
        next(err);
    }
};