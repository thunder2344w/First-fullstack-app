const Message = require("../models/Message");
const User = require("../models/User");

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ message: "Receiver and message text are required" });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (!sender.friends.some((id) => id.toString() === receiverId)) {
      return res.status(403).json({ message: "You can only send messages to friends." });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
      read: false,
    });

    res.json({
      success: true,
      message: "Message sent",
      data: {
        _id: message._id,
        sender: { _id: sender._id, name: sender.name, email: sender.email },
        receiver: { _id: receiver._id, name: receiver.name, email: receiver.email },
        text: message.text,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        fromMe: true,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// get chat history api
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const user = await User.findById(userId);
    if (!user.friends.some((id) => id.toString() === friendId)) {
      return res.status(403).json({ message: "You can only view chats with friends." });
    }

    await Message.updateMany(
      { sender: friendId, receiver: userId, read: false },
      { read: true }
    );

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email")
      .populate("receiver", "name email");

    const responseData = messages.map((m) => ({
      _id: m._id,
      sender: m.sender,
      receiver: m.receiver,
      text: m.text,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      fromMe: m.sender._id.toString() === userId,
    }));

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
