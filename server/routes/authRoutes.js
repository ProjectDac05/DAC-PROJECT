const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", protect, AuthController.logout);
router.post("/refresh-token", AuthController.refreshToken);

// Protected routes
router.get("/me", protect, AuthController.getMe);
router.patch("/update-me", protect, AuthController.updateMe);
router.patch("/change-password", protect, AuthController.changePassword);

module.exports = router;
