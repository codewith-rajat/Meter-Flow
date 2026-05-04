import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

export const signup = async (req, res) => {
  try {
    const { email, password, name, role = "api_owner" } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role,
      plan: "free"
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message || "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      token,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const token = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};