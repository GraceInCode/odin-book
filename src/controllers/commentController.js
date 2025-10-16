const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createComment = async (req, res, next) => {
    try {
        const { content, postId } = req.body;
        const parsedPostId = parseInt(postId, 10);
        if (!content || content.trim() === '' || isNaN(parsedPostId)) {
            req.flash('error', 'Invalid comment.');
            return res.redirect(req.headers.referer || '/posts');
        }

        await prisma.comment.create({
            data: {
                content: content.trim(),
                userId: req.user.id,
                postId: parsedPostId,
            },
        });

        req.flash('success', 'Commented!');
        return res.redirect(req.headers.referer || '/posts');
    } catch (err) {
        next(err);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        const commentId = parseInt(req.params.commentId, 10);
        if (isNaN(commentId)) {
            req.flash('error', 'Invalid comment.');
            return res.redirect(req.headers.referer || '/posts');
        }

        await prisma.comment.delete({
            where: { id: commentId },
        });

        req.flash('success', 'Comment deleted.');
        return res.redirect(req.headers.referer || '/posts');
    } catch (err) {
        next(err);
    }
};