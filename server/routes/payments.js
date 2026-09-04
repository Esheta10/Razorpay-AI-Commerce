import { Router } from 'express';
import crypto from 'node:crypto';
import Transaction from '../models/Transaction.js';
import Merchant from '../models/Merchant.js';
import Product from '../models/Product.js';
import { evaluateMoneyAction } from '../services/guardrailService.js';
import { createRazorpayTestOrder, verifyRazorpayPaymentSignature } from '../utils/razorpayMock.js';
import { createAp2Mandates } from '../utils/ap2.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.post('/orders', async (req, res, next) => {
  try {
    const { merchantId, buyerAgentId = 'buyer-agent-demo-001', amount, currency = 'INR', receipt, items = [], paymentMethod = 'upi', humanApprovalGranted = false } = req.body;
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
    if (!Number.isInteger(amount) || amount <= 0) return res.status(400).json({ message: 'Amount must be a positive integer in paise' });

    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'At least one cart item is required' });
    const catalogProducts = await Product.find({ merchantId, active: true, _id: { $in: items.map((item) => item.productId) } }).lean();
    const cart = items.map((item) => {
      const product = catalogProducts.find((candidate) => candidate._id.toString() === item.productId);
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) return null;
      return { productId: product._id, name: product.name, quantity, unitPrice: product.price, total: product.price * quantity };
    });
    if (cart.some((item) => !item)) return res.status(400).json({ message: 'Cart contains an invalid product or quantity' });
    const calculatedAmount = cart.reduce((sum, item) => sum + item.total, 0);
    if (calculatedAmount !== amount) return res.status(400).json({ message: 'Payment amount does not match the catalog cart total' });
    const gateDecision = evaluateMoneyAction({ merchant, cart, paymentMethod });
    if (!gateDecision.allowed) return res.status(422).json({ message: 'Payment blocked by merchant guardrails', gateDecision });
    if (gateDecision.requiresHumanApproval && !humanApprovalGranted) return res.status(409).json({ message: 'Human approval is required before payment', gateDecision });

    const transaction = await Transaction.create({
      merchantId,
      buyerAgentId,
      lineItems: cart,
      amount,
      currency,
      status: 'payment_pending',
      paymentAttemptCount: 1,
      gateDecision
    });
    const ap2 = createAp2Mandates({ merchant, transactionId: transaction._id.toString(), cart, amount, currency });
    const order = await createRazorpayTestOrder({
      amount,
      currency,
      receipt: receipt || transaction._id.toString()
    });

    transaction.razorpayOrderId = order.id;
    await transaction.save();
    await logAudit({
      merchantId,
      transactionId: transaction._id,
      actor: 'payment_gateway',
      action: 'razorpay_order_created',
      boundedBy: gateDecision.boundedBy,
      explanation: 'A Razorpay test-mode order was created only after the server validated the exact catalog cart and guardrails.',
      input: { amount, currency, cart, paymentMethod, humanApprovalGranted },
      output: { orderId: order.id, ap2: { version: ap2.version, checkoutHash: ap2.checkout_mandate.checkout_hash } }
    });

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      order,
      transactionId: transaction._id,
      ap2
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { transactionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (!transactionId || !orderId || !paymentId || !signature || !verifyRazorpayPaymentSignature({ orderId, paymentId, signature })) {
      return res.status(400).json({ message: 'Invalid Razorpay payment signature' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.razorpayOrderId !== orderId) return res.status(404).json({ message: 'Transaction not found' });

    transaction.status = 'paid';
    transaction.razorpayPaymentId = paymentId;
    await transaction.save();
    await logAudit({
      merchantId: transaction.merchantId,
      transactionId: transaction._id,
      actor: 'payment_gateway',
      action: 'payment_verified',
      explanation: 'Razorpay Checkout payment signature was verified server-side.',
      input: { orderId, paymentId },
      output: { status: transaction.status }
    });
    res.json({ ok: true, transaction });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.get('x-razorpay-signature');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(req.rawBody || '')
      .digest('hex');
    const signatureBuffer = signature ? Buffer.from(signature) : Buffer.alloc(0);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const { event, payload } = req.body;
    const payment = payload?.payment?.entity;
    const orderId = payment?.order_id || payload?.order?.entity?.id;
    const transaction = await Transaction.findOne({ razorpayOrderId: orderId });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found for Razorpay order' });

    if (event === 'payment.authorized' || event === 'order.paid') transaction.status = 'paid';
    if (event === 'payment.failed') {
      transaction.status = 'failed';
      transaction.failureReason = payment?.error_description || 'payment_failed';
    }
    transaction.razorpayPaymentId = payment?.id || transaction.razorpayPaymentId;
    await transaction.save();

    await logAudit({
      merchantId: transaction.merchantId,
      transactionId: transaction._id,
      actor: 'payment_gateway',
      action: `webhook_${event}`,
      explanation: 'A signed Razorpay webhook updated the transaction state.',
      input: { event, orderId },
      output: { status: transaction.status }
    });

    res.json({ ok: true, transaction });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook/test', async (req, res, next) => {
  try {
    const { transactionId, event, paymentId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    transaction.status = event === 'payment.captured' ? 'paid' : 'failed';
    transaction.razorpayPaymentId = paymentId || transaction.razorpayPaymentId;
    await transaction.save();
    await logAudit({ merchantId: transaction.merchantId, transactionId: transaction._id, actor: 'payment_gateway', action: `webhook_${event}`, explanation: 'A simulated webhook updated the transaction state.', input: req.body, output: { status: transaction.status } });
    res.json({ ok: true, transaction });
  } catch (error) {
    next(error);
  }
});

export default router;
