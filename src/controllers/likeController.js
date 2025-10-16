const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createLike = async (req, res, next) => {
    try {
        const postId = parseInt(req.body.postId, 10);
        if (isNaN(postId)) {
            req.flash('error', 'Invalid post.');
            return res.redirect(req.headers.referer || '/posts');
        }

        // Check existence (composite prevents duplicates, but explicit for flash)
        const existing = await prisma.like.findUnique({
            where: { userId_postId: { userId: req.user.id, postId } },
        });
        if (existing) {
            req.flash('error', 'Already liked.');
            return res.redirect(req.headers.referer || '/posts');
        }

        await prisma.like.create({
            data: { userId: req.user.id, postId },
        });

        req.flash('success', 'Liked!');
        return res.redirect(req.headers.referer || '/posts');
    } catch (err) {
        next(err);
    }
};

exports.deleteLike = async (req, res, next) => {
    try {
        const postId = parseInt(req.params.postId, 10);
        if (isNaN(postId)) {
            req.flash('error', 'Invalid post.');
            return res.redirect(req.headers.referer || '/posts');
        }

        await prisma.like.delete({
            where: { userId_postId: { userId: req.user.id, postId } },
        });

        req.flash('success', 'Unliked.');
        return res.redirect(req.headers.referer || '/posts');
    } catch (err) {
        next(err);
    }
};