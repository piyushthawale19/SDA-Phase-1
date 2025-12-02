import express from "express";
import User from "../models/user.model.js";
import { authUser } from "../middleware/auth.middleware.js";

const router = express.Router();


// routes/auth.js
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await user.isValidPassword(password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    const token = user.generateJWT();
    res.json({ user: { email: user.email, avatar: user.avatar, theme: user.theme }, token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET /auth/me
router.get("/me", authUser, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
