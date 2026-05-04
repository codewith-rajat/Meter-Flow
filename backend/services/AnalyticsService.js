import UsageLog from "../models/UsageLog.js";

export class AnalyticsService {
  // Get dashboard stats
  static async getDashboardStats(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalRequests, avgLatency, errorRate, requestsByDay, activeApisCount] = await Promise.all([
      UsageLog.countDocuments({ userId, timestamp: { $gte: thirtyDaysAgo } }),
      this.getAverageLatency(userId, thirtyDaysAgo),
      this.getErrorRate(userId, thirtyDaysAgo),
      this.getRequestsByDay(userId, thirtyDaysAgo),
      this.getActiveApisCount(userId)
    ]);

    return {
      totalRequests,
      avgLatency: parseFloat(avgLatency.toFixed(2)),
      errorRate: parseFloat(errorRate.toFixed(2)),
      requestsByDay,
      activeApis: activeApisCount
    };
  }

  // Get active APIs count
  static async getActiveApisCount(userId) {
    try {
      const API = (await import("../models/API.js")).default;
      const count = await API.countDocuments({ userId });
      return count;
    } catch (err) {
      console.error('Error counting active APIs:', err);
      return 0;
    }
  }

  // Get average latency
  static async getAverageLatency(userId, startDate) {
    const result = await UsageLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgLatency: { $avg: "$latency" }
        }
      }
    ]);

    return result.length > 0 ? result[0].avgLatency : 0;
  }

  // Get error rate
  static async getErrorRate(userId, startDate) {
    const result = await UsageLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          errors: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $gte: ["$statusCode", 400] },
                    { $lt: ["$statusCode", 200] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          errorRate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $multiply: [{ $divide: ["$errors", "$total"] }, 100] }
            ]
          }
        }
      }
    ]);

    return result.length > 0 ? result[0].errorRate : 0;
  }

  // Get requests by day
  static async getRequestsByDay(userId, startDate) {
    const result = await UsageLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result.map(r => ({ date: r._id, requests: r.count }));
  }

  // Get top endpoints
  static async getTopEndpoints(userId, limit = 10) {
    const result = await UsageLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$endpoint",
          count: { $sum: 1 },
          avgLatency: { $avg: "$latency" },
          errorCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $gte: ["$statusCode", 400] },
                    { $lt: ["$statusCode", 200] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    return result;
  }

  // Get API key performance
  static async getApiKeyPerformance(apiKey) {
    const result = await UsageLog.aggregate([
      { $match: { apiKey } },
      {
        $group: {
          _id: "$apiKey",
          totalRequests: { $sum: 1 },
          avgLatency: { $avg: "$latency" },
          errorCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $gte: ["$statusCode", 400] },
                    { $lt: ["$statusCode", 200] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lastUsed: { $max: "$timestamp" }
        }
      }
    ]);

    return result.length > 0 ? result[0] : null;
  }

  // Get status code distribution
  static async getStatusCodeDistribution(userId, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await UsageLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$statusCode",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result.map(r => ({ statusCode: r._id, count: r.count }));
  }

  // Get peak usage times
  static async getPeakUsageTimes(userId, days = 7) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await UsageLog.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $hour: "$timestamp"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return result.map(r => ({ hour: r._id, requests: r.count }));
  }
}

export default AnalyticsService;
