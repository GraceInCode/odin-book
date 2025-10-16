const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

exports.createFollow = async (req, res, next) => {
    try {
        const followedId = parseInt(req.body.followedId, 10);
        if (isNaN(followedId) || followedId === req.user.id) {
            req.flash('error', 'Invalid follow request.');
            return res.redirect('/users');
        }

        // Check if exists (Prisma's unique constraint will error on duplicate, but check for status)
        const existing = await prisma.follow.findUnique({
            where: { followerId_followedId: { followerId: req.user.id, followedId } },
        });

        if (existing) {
            req.flash('error', 'Follow request already sent or accepted.');
            return res.redirect('/users');
        }

        await prisma.follow.create({
            data: {
                followerId: req.user.id,
                followedId,
                status: 'PENDING',
            },
        });

        req.flash('success', 'Follow request sent!');
        res.redirect('/users');
    } catch (err) {
        next(err);
    }
};

exports.updateFollow = async (req, res, next) => {
    try {
        const followerId = parseInt(req.params.followerId, 10); // For accept/reject: Requester's ID
        const status = req.body.status; // 'ACCEPTED' or 'REJECTED'

        if (isNaN(followerId) || !['ACCEPTED', 'REJECTED'].includes(status)) {
            req.flash('error', 'Invalid update.')
            return res.redirect('/users');
        }

        const follow = await prisma.follow.findUnique({
            where: { followerId_followedId: { followedId: req.user.id, followerId } },
        });

        if (!follow || follow.status !== 'PENDING') {
            req.flash('error', 'No pending request found.');
            return res.redirect('/users');
        }

        await prisma.follow.update({
            where: { followerId_followedId: { followedId: req.user.id, followerId } },
            data: { status },
        });

        req.flash('success', `Follow request ${status.toLowerCase()}!`);
        res.redirect('/users');
    } catch (err) {
        next(err);
    }
};

exports.deleteFollow = async (req, res, next) => {
    try {
        const followedId = parseInt(req.params.followedId, 10);

        if (isNaN(followedId)) {
            req.flash('error', 'Invalid unfollow.');
            return res.redirect('/users');
        }

        await prisma.follow.delete({
            where: { followerId_followedId: { followerId: req.user.id, followedId } },
        });

        req.flash('success', 'Unfollowed successfully.');
        res.redirect('/users');
    } catch (err) {
        next(err);
    }
}

exports.getPendingRequests = async (req, res, next) => {
    try {
        const requests = await prisma.follow.findMany({
            where: { followedId: req.user.id, status: 'PENDING' },
            include: { follower: { select: { id: true, username: true } } },
        });
        res.render('follows/requests', { requests });
    } catch (err) {
        next(err);
    }
}