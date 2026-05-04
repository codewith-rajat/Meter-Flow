import User from "../models/User.js";
import Billing from "../models/Billing.js";
import UsageLog from "../models/UsageLog.js";
import ApiKey from "../models/ApiKey.js";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { page = 1, limit = 20, role } = req.query;
    const skip = (Math.max(1, page) - 1) * limit;

    const query = {};
    if (role) query.role = role;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user details (admin or self)
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");
    const stats = await getUserStats(userId);

    res.json({ user, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user (admin)
export const updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userId } = req.params;
    const { role, plan } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role, plan },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Suspend/Unsuspend user
export const toggleUserStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Revoke all active keys
    await ApiKey.updateMany(
      { userId, status: "active" },
      { status: "revoked" }
    );

    res.json({ message: "User suspended - all API keys revoked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get system statistics
export const getSystemStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const [totalUsers, totalRequests, totalBilling, activeKeys] = await Promise.all([
      User.countDocuments(),
      UsageLog.countDocuments(),
      Billing.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      ApiKey.countDocuments({ status: "active" })
    ]);

    const totalBillingAmount = totalBilling[0]?.total || 0;

    res.json({
      users: {
        total: totalUsers,
        admins: await User.countDocuments({ role: "admin" }),
        owners: await User.countDocuments({ role: "api_owner" }),
        consumers: await User.countDocuments({ role: "consumer" })
      },
      requests: {
        total: totalRequests,
        today: await UsageLog.countDocuments({
          timestamp: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        })
      },
      billing: {
        totalPaid: totalBillingAmount,
        pending: await Billing.countDocuments({ status: "pending" }),
        unpaid: await Billing.countDocuments({ status: "unpaid" })
      },
      apiKeys: {
        active: activeKeys,
        revoked: await ApiKey.countDocuments({ status: "revoked" })
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get revenue stats
export const getRevenueStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { months = 12 } = req.query;

    const revenueData = await Billing.aggregate([
      {
        $match: {
          status: "paid",
          paidDate: {
            $gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$paidDate" }
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period: `Last ${months} months`,
      data: revenueData,
      total: revenueData.reduce((sum, m) => sum + m.revenue, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to get user stats
async function getUserStats(userId) {
  try {
    const [totalRequests, totalBilled, activeKeys] = await Promise.all([
      UsageLog.countDocuments({ userId }),
      Billing.aggregate([
        { $match: { userId, status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      ApiKey.countDocuments({ userId, status: "active" })
    ]);

    return {
      totalRequests,
      totalBilled: totalBilled[0]?.total || 0,
      activeKeys
    };
  } catch (err) {
    console.error("Error getting user stats:", err);
    return { totalRequests: 0, totalBilled: 0, activeKeys: 0 };
  }
}
