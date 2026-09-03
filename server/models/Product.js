import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    inventory: { type: Number, default: 20 },
    tags: { type: [String], default: [] },
    crossSellProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Product', ProductSchema);
