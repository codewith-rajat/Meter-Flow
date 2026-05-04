import mongoose from "mongoose";

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    apiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "API"
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true
    },
    apiKey: { type: String, required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, required: true },
    latency: { type: Number, required: true },
    requestSize: { type: Number, default: 0 },
    responseSize: { type: Number, default: 0 },
    ipAddress: String,
    userAgent: String,
    errorMessage: String,
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

usageLogSchema.index({ apiKey: 1, timestamp: -1 });
usageLogSchema.index({ userId: 1, timestamp: -1 });
usageLogSchema.index({ timestamp: -1 });
usageLogSchema.index({ statusCode: 1 });

export default mongoose.model("UsageLog", usageLogSchema);