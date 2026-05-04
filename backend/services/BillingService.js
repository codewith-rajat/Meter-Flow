import Billing from "../models/Billing.js";
import UsageLog from "../models/UsageLog.js";
import ApiKey from "../models/ApiKey.js";
import User from "../models/User.js";
import API from "../models/API.js";

export class BillingService {
  // Calculate usage for a specific period
  static async calculateUsage(userId, startDate, endDate) {
    const logs = await UsageLog.find({
      userId,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const successLogs = logs.filter(log => log.statusCode >= 200 && log.statusCode < 400);
    const errorLogs = logs.filter(log => log.statusCode >= 400);

    return {
      total: logs.length,
      successful: successLogs.length,
      failed: errorLogs.length,
      averageLatency: logs.length > 0 
        ? logs.reduce((sum, log) => sum + log.latency, 0) / logs.length 
        : 0,
      totalDataTransfer: logs.reduce((sum, log) => sum + (log.responseSize || 0), 0)
    };
  }

  // Calculate billing amount based on usage
  static calculateBillingAmount(totalRequests, plan = "free") {
    const planLimits = {
      free: { freeRequests: 1000, pricePerRequest: 0 },
      pro: { freeRequests: 5, pricePerRequest: 0.01 },  // $0.01 per request
      enterprise: { freeRequests: 100, pricePerRequest: 0.001 }  // $0.001 per request
    };

    const planConfig = planLimits[plan] || planLimits.free;
    const billableRequests = Math.max(0, totalRequests - planConfig.freeRequests);
    const amount = billableRequests * planConfig.pricePerRequest;

    return {
      totalRequests,
      freeRequests: Math.min(totalRequests, planConfig.freeRequests),
      paidRequests: billableRequests,
      amount: parseFloat(amount.toFixed(2)),
      pricePerRequest: planConfig.pricePerRequest
    };
  }

  // Generate invoice number
  static generateInvoiceNumber(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `INV-${userId}-${timestamp}-${random}`.toUpperCase();
  }

  // Create billing record for a user
  static async createBillingRecord(userId, startDate, endDate) {
    try {
      const user = await User.findById(userId);
      const usage = await this.calculateUsage(userId, startDate, endDate);

      // Get API breakdown with API details
      const logs = await UsageLog.find({
        userId,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }).populate("apiId");

      console.log("📊 Logs found:", logs.length);
      console.log("Logs:", logs.map(l => ({ apiId: l.apiId?._id, apiName: l.apiId?.name, plan: l.apiId?.plan })));

      // Group by API and calculate billing per API
      const apiBreakdown = {};
      let totalAmount = 0;

      for (const log of logs) {
        const endpoint = log.endpoint || "unknown";
        const apiId = log.apiId?._id?.toString() || "unknown";
        
        if (!apiBreakdown[apiId]) {
          apiBreakdown[apiId] = { 
            apiId, 
            apiName: log.apiId?.name || endpoint, 
            plan: log.apiId?.plan || "free",
            count: 0,
            totalRequests: 0
          };
        }
        apiBreakdown[apiId].count++;
        apiBreakdown[apiId].totalRequests++;
      }

      console.log("API Breakdown:", apiBreakdown);

      // Calculate amount for each API based on its plan
      const items = Object.values(apiBreakdown).map(item => {
        const billing = this.calculateBillingAmount(item.count, item.plan);
        const amount = billing.amount;
        totalAmount += amount;
        
        console.log(`💰 ${item.apiName} (${item.plan}): ${item.count} requests = $${amount}`);
        
        return {
          apiId: item.apiId === "unknown" ? null : item.apiId,
          apiName: item.apiName,
          requests: item.count,
          unitPrice: billing.pricePerRequest,
          total: parseFloat(amount.toFixed(2))
        };
      });

      const billingRecord = await Billing.create({
        userId,
        billingPeriod: { start: startDate, end: endDate },
        totalRequests: usage.successful,
        freeRequests: Object.values(apiBreakdown).reduce((sum, item) => {
          const billing = this.calculateBillingAmount(item.count, item.plan);
          return sum + billing.freeRequests;
        }, 0),
        paidRequests: Object.values(apiBreakdown).reduce((sum, item) => {
          const billing = this.calculateBillingAmount(item.count, item.plan);
          return sum + billing.paidRequests;
        }, 0),
        amount: parseFloat(totalAmount.toFixed(2)),
        invoiceNumber: this.generateInvoiceNumber(userId),
        items,
        status: "pending",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      });

      // Update user total billing
      user.totalBilling += totalAmount;
      user.totalRequests += usage.successful;
      await user.save();

      return billingRecord;
    } catch (error) {
      console.error("Error creating billing record:", error);
      throw error;
    }
  }

  // Get billing history
  static async getBillingHistory(userId, limit = 12) {
    return Billing.find({ userId })
      .sort({ "billingPeriod.start": -1 })
      .limit(limit);
  }

  // Mark billing as paid
  static async markAsPaid(billingId, transactionId, paymentMethod = "stripe") {
    return Billing.findByIdAndUpdate(
      billingId,
      {
        status: "paid",
        transactionId,
        paymentMethod,
        paidDate: new Date()
      },
      { new: true }
    );
  }
}

export default BillingService;
