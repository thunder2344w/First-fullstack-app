const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  sendMessage,
  getMessages,
} = require("../controllers/chatController");

router.post("/send", authenticateToken, sendMessage);
router.get("/:friendId", authenticateToken, getMessages);

module.exports = router;
