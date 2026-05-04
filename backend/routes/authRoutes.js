import express from "express";
import {
  signup,
  login,
  refreshToken,
  getProfile,
  updateProfile
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;