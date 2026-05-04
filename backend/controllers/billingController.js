import UsageLog from "../models/UsageLog.js";
import ApiKey from "../models/ApiKey.js";
import Billing from "../models/Billing.js";
import User from "../models/User.js";
import BillingService from "../services/BillingService.js";
import AnalyticsService from "../services/AnalyticsService.js";

// Get current billing info
export const getBilling = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    // Get current month's unpaid invoices
    const now = new Date();
    // Create a date at the start of current month in UTC
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    console.log("📊 Billing Query:", {
      userId,
      now: now.toISOString(),
      currentMonthStart: currentMonthStart.toISOString()
    });

    // First check if there's a PAID invoice for this month (show 0 amount)
    const paidInvoice = await Billing.findOne({
      userId: userId,
      createdAt: { $gte: currentMonthStart },
      status: 'paid'
    });

    if (paidInvoice) {
      // If invoice is paid, return 0 amount due
      return res.json({
        totalRequests: paidInvoice.totalRequests || 0,
        freeRequests: paidInvoice.freeRequests || 0,
        paidRequests: paidInvoice.paidRequests || 0,
        amount: 0, // 🔥 PAID - AMOUNT IS ZERO
        plan: user.plan,
        pricePerRequest: 0,
        apis: paidInvoice.items || [],
        invoiceId: paidInvoice._id,
        invoiceStatus: paidInvoice.status
      });
    }
    
    const unPaidInvoice = await Billing.findOne({
      userId: userId,
      createdAt: { $gte: currentMonthStart },
      status: 'pending'
    })

    // If there's an unpaid invoice for this month WITH items, use it
    if (unPaidInvoice && unPaidInvoice.items && unPaidInvoice.items.length > 0) {
      let totalRequests = 0;
      let totalFree = 0;
      let totalPaid = 0;
      let maxPrice = 0;

      // Parse items from unpaid invoice
      const apis = unPaidInvoice.items.map(item => {
        totalRequests += item.requests;
        totalFree += item.freeRequests;
        totalPaid += item.paidRequests;
        
        if (item.pricePerRequest > maxPrice) {
          maxPrice = item.pricePerRequest;
        }

        return {
          apiId: item.apiId?._id?.toString() || "unknown",
          apiName: item.apiName,
          plan: item.plan,
          requests: item.requests,
          freeRequests: item.freeRequests,
          paidRequests: item.paidRequests,
          amount: item.amount,
          pricePerRequest: item.pricePerRequest
        };
      });

      return res.json({
        totalRequests,
        freeRequests: totalFree,
        paidRequests: totalPaid,
        amount: unPaidInvoice.amount, // Use invoice amount (which is zero after payment)
        plan: user.plan,
        pricePerRequest: maxPrice,
        apis,
        invoiceId: unPaidInvoice._id,
        invoiceStatus: unPaidInvoice.status
      });
    }

    // No unpaid invoice - calculate from usage logs for current month
    const logs = await UsageLog.find({
      userId: userId,
      timestamp: { $gte: currentMonthStart }
    }).populate("apiId");

    console.log("📝 UsageLogs found:", logs.length, {
      query: { userId: userId.toString(), timestamp: { $gte: currentMonthStart } },
      userId_type: typeof userId,
      userId_value: userId.toString(),
      sample: logs.slice(0, 2).map(l => ({ 
        _id: l._id, 
        userId: l.userId?.toString(),
        endpoint: l.endpoint, 
        timestamp: l.timestamp,
        statusCode: l.statusCode 
      }))
    });

    // Also count ALL logs for this user (debug)
    const allLogs = await UsageLog.find({ userId }).select('timestamp userId');
    console.log("🔍 Total logs for this user (all time):", allLogs.length);

    // Group by API and calculate per-API billing
    const apiBreakdown = {};
    let totalAmount = 0;
    let totalRequests = logs.length;
    let totalFree = 0;
    let totalPaid = 0;
    let maxPrice = 0;

    for (const log of logs) {
      const apiId = log.apiId?._id?.toString() || "unknown";
      const plan = log.apiId?.plan || "free";
      
      if (!apiBreakdown[apiId]) {
        apiBreakdown[apiId] = { 
          apiName: log.apiId?.name || "Unknown API",
          plan,
          count: 0
        };
      }
      apiBreakdown[apiId].count++;
    }

    // Calculate billing for each API
    const apis = [];
    for (const [apiId, data] of Object.entries(apiBreakdown)) {
      const billing = BillingService.calculateBillingAmount(data.count, data.plan);
      totalAmount += billing.amount;
      totalFree += billing.freeRequests;
      totalPaid += billing.paidRequests;
      
      // Track the highest price tier
      if (billing.pricePerRequest > maxPrice) {
        maxPrice = billing.pricePerRequest;
      }
      
      apis.push({
        apiId,
        apiName: data.apiName,
        plan: data.plan,
        requests: data.count,
        freeRequests: billing.freeRequests,
        paidRequests: billing.paidRequests,
        amount: billing.amount,
        pricePerRequest: billing.pricePerRequest
      });
    }

    console.log("💰 Billing calculation:", {
      totalRequests,
      totalFree,
      totalPaid,
      totalAmount,
      maxPrice,
      apis
    });

    res.json({
      totalRequests,
      freeRequests: totalFree,
      paidRequests: totalPaid,
      amount: parseFloat(totalAmount.toFixed(2)),
      plan: user.plan,
      pricePerRequest: maxPrice, // Use highest tier price for display
      apis
    });
  } catch (err) {
    console.error("Error getting billing:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get billing history
export const getBillingHistory = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const userId = req.user._id;

    const history = await BillingService.getBillingHistory(userId, parseInt(limit));

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoice by ID
export const getInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const invoice = await Billing.findById(req.params.id);

    if (!invoice || invoice.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate invoice (Admin or manual trigger)
export const generateInvoice = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const userId = req.user._id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate required" });
    }

    console.log("Generating invoice for user:", userId, "Period:", startDate, "-", endDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if there's already a PAID invoice for this month
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    const paidInvoice = await Billing.findOne({
      userId: userId,
      createdAt: { $gte: currentMonthStart },
      status: 'paid'
    });

    if (paidInvoice) {
      return res.status(400).json({ 
        error: "Invoice already paid for this month",
        message: "You cannot generate a new invoice until the next billing period"
      });
    }

    // Check if there's already a PENDING invoice for this month
    const pendingInvoice = await Billing.findOne({
      userId: userId,
      createdAt: { $gte: currentMonthStart },
      status: 'pending'
    });

    if (pendingInvoice) {
      // Return existing pending invoice instead of creating a new one
      return res.status(200).json({ 
        message: "Invoice already exists for this month",
        invoice: pendingInvoice
      });
    }

    const billingRecord = await BillingService.createBillingRecord(userId, start, end);
    console.log("Invoice created:", billingRecord);

    res.status(201).json(billingRecord);
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

// Mark invoice as paid
export const markInvoiceAsPaid = async (req, res) => {
  try {
    const { transactionId, paymentMethod = "stripe" } = req.body;
    const userId = req.user._id;

    const invoice = await Billing.findById(req.params.id);

    if (!invoice || invoice.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const updated = await BillingService.markAsPaid(req.params.id, transactionId, paymentMethod);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get usage stats
export const getUsageStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const stats = await AnalyticsService.getDashboardStats(userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get top endpoints
export const getTopEndpoints = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user._id;
    const endpoints = await AnalyticsService.getTopEndpoints(userId, parseInt(limit));
    res.json(endpoints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get status code distribution
export const getStatusDistribution = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;
    const distribution = await AnalyticsService.getStatusCodeDistribution(
      userId,
      parseInt(days)
    );
    res.json(distribution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get peak usage times
export const getPeakTimes = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.user._id;
    const peakTimes = await AnalyticsService.getPeakUsageTimes(userId, parseInt(days));
    res.json(peakTimes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};