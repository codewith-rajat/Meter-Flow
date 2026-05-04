import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import { initRedis } from "./config/redis.js";
import { requestLogger, errorLogger, performanceLogger } from "./middlewares/httpLogger.js";
import authRoutes from "./routes/authRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import gatewayRoutes from "./routes/gatewayRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(performanceLogger);
app.use(requestLogger);

// Database connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/meterflow")
  .then(() => console.log("✓ MongoDB Connected"))
  .catch(err => console.log("✗ MongoDB Error:", err));

// Initialize Redis
initRedis().then(() => {
  console.log("✓ Redis initialized");
}).catch(err => {
  console.log("⚠ Redis initialization warning:", err.message);
});

// Routes
app.use("/auth", authRoutes);
app.use("/api", apiRoutes);
app.use("/gateway", gatewayRoutes);
app.use("/billing", billingRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/admin", adminRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("", paymentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    statusCode: err.status || 500
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 MeterFlow Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
});

export default app;