const express = require("express");
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.patch("/password", protect, changePassword);

module.exports = router;