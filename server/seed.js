import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';
import Merchant from './models/Merchant.js';
import Product from './models/Product.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

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

const faceWash = await Product.create({
  merchantId: merchant._id,
  name: 'Gentle Face Wash',
  description: 'Low-foam cleanser that removes daily dirt without drying the skin.',
  price: 59900,
  tags: ['skincare', 'cleanser', 'face wash', 'sensitive skin']
});

const moisturizer = await Product.create({
  merchantId: merchant._id,
  name: 'Hyaluronic Moisturizer',
  description: 'Lightweight gel moisturizer for everyday hydration and a soft finish.',
  price: 89900,
  tags: ['skincare', 'moisturizer', 'hydration', 'dry skin']
});

const lipBalm = await Product.create({
  merchantId: merchant._id,
  name: 'Ceramide Lip Balm',
  description: 'Barrier-supporting lip balm for dry and chapped lips.',
  price: 34900,
  tags: ['lip care', 'dry lips', 'ceramide']
});

const eyeCream = await Product.create({
  merchantId: merchant._id,
  name: 'Caffeine Eye Cream',
  description: 'Cooling eye cream for a refreshed look around the eyes.',
  price: 69900,
  tags: ['skincare', 'eye care', 'caffeine', 'dark circles']
});

serum.crossSellProductIds = [sunscreen._id, moisturizer._id];
sunscreen.crossSellProductIds = [faceWash._id];
faceWash.crossSellProductIds = [moisturizer._id];
moisturizer.crossSellProductIds = [serum._id];
await Promise.all([serum.save(), sunscreen.save(), faceWash.save(), moisturizer.save()]);

console.log({
  merchantId: merchant._id.toString(),
  products: [serum, sunscreen, faceWash, moisturizer, lipBalm, eyeCream].map((product) => ({
    id: product._id.toString(),
    name: product.name,
    price: product.price
  }))
});
await mongoose.disconnect();
