// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists.");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).send("User registered successfully.");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Server error.");
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("Invalid credentials.");
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials.");
    }

    // Generate token
    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
