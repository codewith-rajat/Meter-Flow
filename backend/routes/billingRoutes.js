import express from "express";
import {
  getBilling,
  getBillingHistory,
  generateInvoice
} from "../controllers/billingController.js";

import { protect } from "../middlewares/authMiddleware.js"; // ✅ ADD THIS

const router = express.Router();

// ✅ APPLY MIDDLEWARE HERE
router.get("/", protect, getBilling);
router.get("/history", protect, getBillingHistory);
router.post("/generate", protect, generateInvoice);

export default router;