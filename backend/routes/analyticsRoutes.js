import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getDashboard,
  getDetailedAnalytics,
  getApiKeyStats,
  getRealtimeMetrics,
  exportAnalytics
} from "../controllers/analyticsController.js";

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Dashboard and analytics
router.get("/dashboard", getDashboard);
router.get("/detailed", getDetailedAnalytics);
router.get("/realtime", getRealtimeMetrics);
router.get("/export", exportAnalytics);
router.get("/key/:keyId", getApiKeyStats);

export default router;
