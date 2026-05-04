import mongoose from "mongoose";

const billingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  invoiceNumber: {
    type: String,
    sparse: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  billingPeriod: {
    start: Date,
    end: Date
  },
  dueDate: Date,
  paidAt: Date,
  paymentMethod: String,
  stripePaymentIntentId: String,
  totalRequests: {
    type: Number,
    default: 0
  },
  freeRequests: {
    type: Number,
    default: 0
  },
  paidRequests: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  },
  items: {
    type: [
      {
        apiId: mongoose.Schema.Types.ObjectId,
        apiName: String,
        requests: Number,
        freeRequests: Number,
        paidRequests: Number,
        pricePerRequest: Number,
        amount: Number
      }
    ],
    default: []
  },
  apis: {
    type: [
      {
        apiName: {
          type: String,
          default: "unknown"
        },
        requests: {
          type: Number,
          default: 0
        },
        paidRequests: {
          type: Number,
          default: 0
        }
      }
    ],
    default: [] // 🔥 VERY IMPORTANT
  }
}, { timestamps: true });

const Billing = mongoose.model("Billing", billingSchema);

export default Billing;