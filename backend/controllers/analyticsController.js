import AnalyticsService from "../services/AnalyticsService.js";
import RateLimitService from "../services/RateLimitService.js";

// Get comprehensive dashboard
export const getDashboard = async (req, res) => {
  try {
    // req.user is full user object from authMiddleware with _id field
    const userId = req.user._id;
    
    const [stats, topEndpoints, statusDist, peakTimes, rateLimitStats] = await Promise.all([
      AnalyticsService.getDashboardStats(userId),
      AnalyticsService.getTopEndpoints(userId, 5),
      AnalyticsService.getStatusCodeDistribution(userId, 30),
      AnalyticsService.getPeakUsageTimes(userId, 7),
      RateLimitService.getRateLimitStats(userId, "day").catch(() => null)
    ]);

    res.json({
      stats: stats || { totalRequests: 0, avgLatency: 0, errorRate: 0, requestsByDay: [] },
      topEndpoints: topEndpoints || [],
      statusDistribution: statusDist || [],
      peakTimes: peakTimes || [],
      rateLimitStats
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ 
      error: err.message,
      stats: { totalRequests: 0, avgLatency: 0, errorRate: 0, requestsByDay: [] },
      topEndpoints: [],
      statusDistribution: [],
      peakTimes: []
    });
  }
};

// Get detailed analytics
export const getDetailedAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30, period = "day" } = req.query;

    const [requests, avgLatency, errorRate, endpoints] = await Promise.all([
      AnalyticsService.getRequestsByDay(userId, new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
      AnalyticsService.getAverageLatency(userId, new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
      AnalyticsService.getErrorRate(userId, new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
      AnalyticsService.getTopEndpoints(userId, 20)
    ]);

    res.json({
      period: `Last ${days} days`,
      metrics: {
        totalRequests: requests.reduce((sum, r) => sum + r.requests, 0),
        averageLatency: parseFloat(avgLatency.toFixed(2)),
        errorRate: parseFloat(errorRate.toFixed(2))
      },
      requestsByDay: requests,
      topEndpoints: endpoints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get API key performance
export const getApiKeyStats = async (req, res) => {
  try {
    const { keyId } = req.params;

    const apiKey = await db.collection("apikeys").findOne({ _id: keyId });

    if (!apiKey) {
      return res.status(404).json({ error: "API key not found" });
    }

    const performance = await AnalyticsService.getApiKeyPerformance(apiKey.key);

    res.json(performance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get real-time metrics
export const getRealtimeMetrics = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get last hour metrics
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await db.collection("usagelogs").aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" }
          },
          requests: { $sum: 1 },
          avgLatency: { $avg: "$latency" },
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
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json({
      period: "Last Hour",
      metrics: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export analytics as CSV
export const exportAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const logs = await db.collection("usagelogs").find({
      userId: req.user._id,
      timestamp: { $gte: start, $lte: end }
    }).toArray();

    if (format === "csv") {
      const csv = convertToCSV(logs);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=analytics.csv");
      res.send(csv);
    } else {
      res.json(logs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to convert to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      }).join(",")
    )
  ].join("\n");

  return csv;
}
