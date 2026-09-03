import mongoose from 'mongoose';

const LineItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const TransactionSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    buyerAgentId: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'approval_required', 'payment_pending', 'paid', 'failed', 'recovered'],
      default: 'draft'
    },
    lineItems: { type: [LineItemSchema], default: [] },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentAttemptCount: { type: Number, default: 0 },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    failureReason: String,
    recoveryStrategy: String,
    gateDecision: {
      allowed: { type: Boolean, default: false },
      requiresHumanApproval: { type: Boolean, default: false },
      reasons: { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', TransactionSchema);
