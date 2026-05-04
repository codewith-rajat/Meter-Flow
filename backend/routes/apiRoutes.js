import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  // API Key routes
  createKey,
  getKeys,
  getKeyById,
  revokeKey,
  rotateKey,
  updateKey,
  // API routes
  createAPI,
  getAPIs,
  getAPIById,
  updateAPI,
  deleteAPI
} from "../controllers/apiController.js";

const router = express.Router();

// API Key Management
router.post("/keys", protect, createKey);
router.get("/keys", protect, getKeys);
router.get("/keys/:id", protect, getKeyById);
router.delete("/keys/:id", protect, revokeKey);
router.post("/keys/:id/rotate", protect, rotateKey);
router.put("/keys/:id", protect, updateKey);

// API Management
router.post("/", protect, createAPI);
router.get("/", protect, getAPIs);
router.get("/:id", protect, getAPIById);
router.put("/:id", protect, updateAPI);
router.delete("/:id", protect, deleteAPI);

export default router;