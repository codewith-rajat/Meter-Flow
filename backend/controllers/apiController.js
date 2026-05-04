import ApiKey from "../models/ApiKey.js";
import API from "../models/API.js";
import crypto from "crypto";

// API Key Management
export const createKey = async (req, res) => {
  try {
    const { name, apiId, environment = "dev", expiresIn } = req.body;
    
    console.log("Creating API key with:", { name, apiId, environment, userId: req.user._id });

    const apiKey = await ApiKey.create({
      userId: req.user._id,
      apiId: apiId || null,  // Make apiId optional
      name: name || `Key-${Date.now()}`,
      metadata: { environment },
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null
    });

    console.log("API key created:", apiKey);
    res.status(201).json(apiKey);
  } catch (err) {
    console.error("Error creating API key:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(keys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getKeyById = async (req, res) => {
  try {
    const key = await ApiKey.findById(req.params.id);

    if (!key || key.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Key not found" });
    }

    res.json(key);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const revokeKey = async (req, res) => {
  try {
    const key = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { status: "revoked" },
      { new: true }
    );

    if (!key || key.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Key not found" });
    }

    res.json({ message: "API key revoked", key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rotateKey = async (req, res) => {
  try {
    const oldKey = await ApiKey.findById(req.params.id);

    if (!oldKey || oldKey.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Key not found" });
    }

    // Create new key
    const newKey = await ApiKey.create({
      userId: req.user._id,
      apiId: oldKey.apiId,
      name: `${oldKey.name}-rotated`,
      metadata: oldKey.metadata
    });

    // Mark old key as revoked
    oldKey.status = "revoked";
    oldKey.rotatedAt = new Date();
    await oldKey.save();

    res.json({
      message: "Key rotated successfully",
      oldKey: oldKey._id,
      newKey
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateKey = async (req, res) => {
  try {
    const { name, rateLimit } = req.body;

    const key = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { name, rateLimit },
      { new: true, runValidators: true }
    );

    if (!key || key.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "Key not found" });
    }

    res.json(key);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// API Management
export const createAPI = async (req, res) => {
  try {
    const { name, description, baseUrl, plan = "free", pricing, rateLimit } = req.body;

    if (!name || !baseUrl) {
      return res.status(400).json({ error: "Name and baseUrl required" });
    }

    const api = await API.create({
      userId: req.user._id,
      name,
      description,
      baseUrl,
      plan,
      pricing,
      rateLimit
    });

    res.status(201).json(api);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAPIs = async (req, res) => {
  try {
    const apis = await API.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(apis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAPIById = async (req, res) => {
  try {
    const api = await API.findById(req.params.id);

    if (!api || api.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "API not found" });
    }

    res.json(api);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAPI = async (req, res) => {
  try {
    const { name, description, status, pricing, rateLimit } = req.body;

    const api = await API.findByIdAndUpdate(
      req.params.id,
      { name, description, status, pricing, rateLimit },
      { new: true, runValidators: true }
    );

    if (!api || api.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "API not found" });
    }

    res.json(api);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAPI = async (req, res) => {
  try {
    const api = await API.findByIdAndDelete(req.params.id);

    if (!api || api.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ error: "API not found" });
    }

    // Also revoke all associated keys
    await ApiKey.updateMany(
      { apiId: req.params.id },
      { status: "revoked" }
    );

    res.json({ message: "API deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};