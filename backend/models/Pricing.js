import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      required: true,
      enum: ["free", "pro", "enterprise", "custom"]
    },
    description: String,
    monthlyPrice: { type: Number, default: 0 },
    requestLimit: { type: Number, required: true },
    pricePerRequest: { type: Number, default: 0 },
    features: [String],
    rateLimitPerMinute: { type: Number, default: 100 },
    rateLimitPerDay: { type: Number, default: 10000 },
    maxApiKeys: { type: Number, default: 5 },
    analyticsRetention: { type: Number, default: 30 }, // days
    supportLevel: {
      type: String,
      enum: ["none", "email", "priority", "dedicated"],
      default: "email"
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("Pricing", pricingSchema);
