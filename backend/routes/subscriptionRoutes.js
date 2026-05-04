import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getPlans,
  getCurrentPlan,
  upgradePlan,
  downgradePlan,
  createCustomPlan,
  updatePlan
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Public routes
router.get("/plans", getPlans);

// Protected routes
router.get("/current", protect, getCurrentPlan);
router.post("/upgrade", protect, upgradePlan);
router.post("/downgrade", protect, downgradePlan);

// Admin routes
router.post("/create", protect, createCustomPlan);
router.put("/:planName", protect, updatePlan);

export default router;
