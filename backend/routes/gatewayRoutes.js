import express from "express";
import axios from "axios";
import { validateKey, applyRateLimit } from "../middlewares/apiGateway.js";
import UsageLog from "../models/UsageLog.js";
import ApiKey from "../models/ApiKey.js";
import API from "../models/API.js";

const router = express.Router();

// Gateway middleware
router.use(validateKey);
router.use(applyRateLimit);

// Proxy all requests to configured external APIs
router.all("/:apiName/*", async (req, res) => {
  const start = Date.now();
  let api = null;

  try {
    const { apiName } = req.params;
    const userId = req.user._id; // From validateKey middleware
    
    // Find API by name AND user
    api = await API.findOne({ name: apiName, userId });
    if (!api) {
      return res.status(404).json({ error: "API not found", apiName });
    }

    const targetUrl = api.baseUrl || "https://jsonplaceholder.typicode.com";
    const remainingPath = req.params[0] || "";
    const url = targetUrl + "/" + remainingPath + (req.url.includes("?") ? "?" + req.url.split("?")[1] : "");

    // Build request headers
    const headers = {
      ...req.headers,
      host: new URL(targetUrl).host
    };
    delete headers["x-api-key"];
    delete headers["x-target-url"];

    const response = await axios({
      method: req.method,
      url,
      data: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      headers,
      timeout: 30000,
      maxRedirects: 5
    });

    const latency = Date.now() - start;
    const responseSize = JSON.stringify(response.data).length;

    // Log usage
    await UsageLog.create({
      userId: req.user._id,
      apiId: api._id,  // Add API ID
      apiKeyId: req.apiKey._id,
      apiKey: req.apiKey.key,
      endpoint: req.path,
      method: req.method,
      statusCode: response.status,
      latency,
      responseSize,
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    // Update API key stats
    await ApiKey.findByIdAndUpdate(req.apiKey._id, {
      lastUsed: new Date(),
      $inc: { requestCount: 1 }
    });

    // Add gateway headers
    res.setHeader("X-Gateway-Latency", latency);
    res.setHeader("X-Forwarded-By", "MeterFlow");

    res.status(response.status).json(response.data);
  } catch (err) {
    const latency = Date.now() - start;
    const statusCode = err.response?.status || 500;
    const errorMessage = err.message || "Unknown error";

    console.error("Gateway error:", err.message);

    // Log failed request only if api exists
    if (api) {
      try {
        await UsageLog.create({
          userId: req.user._id,
          apiId: api._id,
          apiKeyId: req.apiKey._id,
          apiKey: req.apiKey.key,
          endpoint: req.path,
          method: req.method,
          statusCode,
          latency,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          errorMessage
        });
      } catch (logErr) {
        console.error("Error logging failed request:", logErr);
      }
    }

    res.status(statusCode).json({
      error: "Gateway error",
      message: errorMessage,
      code: err.code || "GATEWAY_ERROR"
    });
  }
});

export default router;