import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    actor: { type: String, enum: ['buyer_agent', 'merchant_agent', 'payment_gateway', 'human'], required: true },
    action: { type: String, required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    boundedBy: { type: Object, default: {} },
    explanation: { type: String, required: true },
    input: { type: Object, default: {} },
    output: { type: Object, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', AuditLogSchema);
