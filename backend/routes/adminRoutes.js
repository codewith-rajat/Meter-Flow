import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getUserDetails,
  updateUser,
  toggleUserStatus,
  getSystemStats,
  getRevenueStats
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication
router.use(protect);

// User management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUser);
router.post("/users/:userId/suspend", toggleUserStatus);

// System stats
router.get("/stats", getSystemStats);
router.get("/revenue", getRevenueStats);

export default router;
