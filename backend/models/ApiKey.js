import mongoose from "mongoose";
import crypto from "crypto";

const apiKeySchema = new mongoose.Schema(
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
    key: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString("hex")
    },
    name: String,
    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active"
    },
    rateLimit: { type: Number, default: 1000 }, // requests per day
    requestCount: { type: Number, default: 0 },
    lastUsed: Date,
    expiresAt: Date,
    rotatedAt: Date,
    metadata: {
      description: String,
      environment: { type: String, enum: ["dev", "prod"], default: "dev" }
    }
  },
  { timestamps: true }
);

apiKeySchema.index({ userId: 1, status: 1 });
apiKeySchema.index({ key: 1 });

export default mongoose.model("ApiKey", apiKeySchema); 