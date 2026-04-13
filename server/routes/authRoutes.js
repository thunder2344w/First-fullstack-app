const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    profile,
    logout,
} = require("../controllers/authController");

const authenticateToken = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", authenticateToken, profile);
router.post("/logout", logout);

module.exports = router;