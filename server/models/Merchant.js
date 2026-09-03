import mongoose from 'mongoose';

const MerchantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    razorpayAccountId: { type: String, required: true },
    currency: { type: String, default: 'INR' },
    growthGoal: {
      type: String,
      default: 'Increase average order value through explainable upsells.'
    },
    monthlyRevenueTarget: { type: Number, default: 500000 },
    guardrails: {
      maxOrderValue: { type: Number, default: 2500000 },
      maxSingleItemQuantity: { type: Number, default: 3 },
      requiresHumanApprovalAbove: { type: Number, default: 1000000 },
      allowedPaymentMethods: { type: [String], default: ['card', 'upi'] }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Merchant', MerchantSchema);
