import 'dotenv/config';
import mongoose from 'mongoose';
import Merchant from './models/Merchant.js';
import Product from './models/Product.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/razorpay_ai_commerce');
await Merchant.deleteMany({});
await Product.deleteMany({});

const merchant = await Merchant.create({
  name: 'Orbit Skincare',
  razorpayAccountId: 'acc_test_orbit',
  monthlyRevenueTarget: 750000
});

const serum = await Product.create({
  merchantId: merchant._id,
  name: 'Vitamin C Serum',
  description: 'Daily brightening serum for repeat skincare buyers.',
  price: 129900,
  tags: ['skincare', 'hero-product']
});

const sunscreen = await Product.create({
  merchantId: merchant._id,
  name: 'Mineral Sunscreen',
  description: 'SPF 50 sunscreen commonly purchased with Vitamin C Serum.',
  price: 79900,
  tags: ['skincare', 'cross-sell']
});

serum.crossSellProductIds = [sunscreen._id];
await serum.save();

console.log({ merchantId: merchant._id.toString(), productIds: [serum._id.toString(), sunscreen._id.toString()] });
await mongoose.disconnect();
