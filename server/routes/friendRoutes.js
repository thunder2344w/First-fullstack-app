const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { sendFriendRequest } = require("../controllers/friendController");
const { respondToFriendRequest } = require("../controllers/friendController");
const { getFriendRequests } = require("../controllers/friendController");
const { getFriendsList } = require("../controllers/friendController");
const { removeFriend } = require("../controllers/friendController");
const { getSentRequests } = require("../controllers/friendController");

router.post("/request", authenticateToken, sendFriendRequest);
router.post("/respond", authenticateToken, respondToFriendRequest);
router.get("/requests", authenticateToken, getFriendRequests);
router.get("/", authenticateToken, getFriendsList);
router.post("/remove", authenticateToken, removeFriend);
router.get("/sent", authenticateToken, getSentRequests);

module.exports = router;