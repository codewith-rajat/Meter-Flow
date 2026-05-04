import mongoose from "mongoose";

const apiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: { type: String, required: true },
    description: String,
    baseUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "deprecated"],
      default: "active"
    },
    totalRequests: { type: Number, default: 0 },
    totalBilled: { type: Number, default: 0 },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },
    pricing: {
      free: { type: Number, default: 1000 }, // free requests per month
      pricePerRequest: { type: Number, default: 0.001 }
    },
    rateLimit: {
      requestsPerMinute: { type: Number, default: 100 },
      requestsPerDay: { type: Number, default: 10000 }
    },
    documentation: String,
    webhook: String,
    isPublic: { type: Boolean, default: false }
  },
  { timestamps: true }
);

apiSchema.index({ userId: 1 });
apiSchema.index({ status: 1 });

export default mongoose.model("API", apiSchema);
