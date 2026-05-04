import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    name: String,
    role: {
      type: String,
      enum: ["admin", "api_owner", "consumer"],
      default: "api_owner"
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free"
    },
    isVerified: { type: Boolean, default: false },
    totalRequests: { type: Number, default: 0 },
    totalBilling: { type: Number, default: 0 },
    nextBillingDate: Date,
    rateLimitPerMinute: { type: Number, default: 100 },
    stripeCustomerId: String,
    subscribedAt: Date
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("User", userSchema);