import mongoose from "mongoose";

const rateLimitLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    apiKeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
      required: true
    },
    apiKey: { type: String, required: true },
    limit: { type: Number, required: true },
    used: { type: Number, required: true },
    resetAt: { type: Date, required: true },
    violatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

rateLimitLogSchema.index({ apiKey: 1 });
rateLimitLogSchema.index({ userId: 1 });

export default mongoose.model("RateLimitLog", rateLimitLogSchema);
