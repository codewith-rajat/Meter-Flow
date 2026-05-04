import User from "../models/User.js";
import Pricing from "../models/Pricing.js";

// Get all available plans
export const getPlans = async (req, res) => {
  try {
    const plans = await Pricing.find({ isActive: true }).sort({ monthlyPrice: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current user plan
export const getCurrentPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const plan = await Pricing.findOne({ planName: user.plan });

    res.json({
      currentPlan: plan,
      user: {
        email: user.email,
        plan: user.plan,
        totalRequests: user.totalRequests,
        totalBilling: user.totalBilling
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upgrade plan
export const upgradePlan = async (req, res) => {
  try {
    const { planName } = req.body;

    const plan = await Pricing.findOne({ planName });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan: planName },
      { new: true }
    ).select("-password");

    res.json({
      message: `Plan upgraded to ${planName}`,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Downgrade plan
export const downgradePlan = async (req, res) => {
  try {
    const { planName } = req.body;

    const plan = await Pricing.findOne({ planName });
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { plan: planName },
      { new: true }
    ).select("-password");

    res.json({
      message: `Plan downgraded to ${planName}`,
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create custom plan (admin only)
export const createCustomPlan = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const pricing = await Pricing.create(req.body);
    res.status(201).json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update plan (admin only)
export const updatePlan = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { planName } = req.params;
    const pricing = await Pricing.findOneAndUpdate(
      { planName },
      req.body,
      { new: true, runValidators: true }
    );

    if (!pricing) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
