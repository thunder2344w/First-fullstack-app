const Message = require("../models/Message");
const User = require("../models/User");

exports.sendFriendRequest = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { email } = req.body;

        // find receiver
        const receiver = await User.findOne({ email });
        // const sender = await User.findById(senderId);

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (senderId === receiver._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a friend request to yourself",
            });
        }

        // check if already friend
        if (receiver.friends.some((id) => id.toString() === senderId)) {
            return res.status(400).json({
                success: false,
                message: "You are already friends",
            });
        }
        // check if request already sent
        if (receiver.friendRequests.some((id) => id.toString() === senderId)) {
            return res.status(400).json({
                success: false,
                message: "Request already sent",
            });
        }
        // Add sender to receiver's friendRequests
        receiver.friendRequests.push(senderId);
        // sender.sentRequests.push(email);
        await receiver.save();
        // await sender.save();

        res.status(200).json({
            success: true,
            message: "Friend request sent successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Accept or reject friend request

exports.respondToFriendRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { senderId, action } = req.body;
        // action = accept or reject

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // check if request exists
        if (!user.friendRequests.some((id) => id.toString() === senderId)) {
            return res.status(400).json({
                message: "Friend request not found",
            });
        }

        // remove request from friendRequests
        user.friendRequests = user.friendRequests.filter(
            (id) => id.toString() !== senderId
        );

        // if accepted - add both as friends
        if (action === "accept") {
            user.friends.push(senderId);

            const sender = await User.findById(senderId);
            sender.friends.push(userId);
            await sender.save();
        }

        await user.save();

        res.status(200).json({
            message:
                action === "accept"
                    ? "Friend request accepted"
                    : "Friend request rejected",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

// Get all incoming friend requests

exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate("friendRequests", "name email");

        if (!user) {
            return res.status(400).json({
                message: "User not found",
            });
        }

        res.status(200).json({
            friendRequests: user.friendRequests,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

// Get pending friend requests sent by Me(user)
exports.getSentRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        const users = await User.find({
            friendRequests: userId,
        }).select("name email");

        res.status(200).json({
            sentRequests: users,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

/**
 * Get logged-in user's friends list
 */
exports.getFriendsList = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate("friends", "name email");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const friendsWithNotifications = await Promise.all(
            user.friends.map(async (friend) => {
                const unreadCount = await Message.countDocuments({
                    sender: friend._id,
                    receiver: userId,
                    read: false,
                });

                return {
                    _id: friend._id,
                    name: friend.name,
                    email: friend.email,
                    unreadCount,
                };
            })
        );

        res.status(200).json({
            friends: friendsWithNotifications,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};

/**
 * Remove a friend (unfriend)
 */
exports.removeFriend = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;

        const user = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!user || !friend) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Remove each other from friends list
        user.friends = user.friends.filter(
            (id) => id.toString() !== friendId
        );

        friend.friends = friend.friends.filter(
            (id) => id.toString() !== userId
        );

        await user.save();
        await friend.save();

        res.status(200).json({
            message: "Friend removed successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error",
        });
    }
};