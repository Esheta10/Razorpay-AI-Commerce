import Transaction from '../models/Transaction.js';
import Merchant from '../models/Merchant.js';
import { getReadableCatalog, buildCart } from './catalogService.js';
import { evaluateMoneyAction } from './guardrailService.js';
import { createCheckoutPlan } from './llmPlannerService.js';
import { createRazorpayTestOrder } from '../utils/razorpayMock.js';
import { logAudit } from '../utils/audit.js';

export async function runBuyerAgentCheckout({ merchantId, buyerAgentId, message, requestedProductId, quantity = 1, paymentMethod = 'upi', failureMode = 'none' }) {
  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error('Merchant not found.');

  const catalog = await getReadableCatalog(merchantId);
  const plan = await createCheckoutPlan({ merchant, catalog, message });
  await logAudit({
    merchantId,
    actor: 'buyer_agent',
    action: 'catalog_read',
    explanation: 'Buyer agent read the merchant catalog before choosing a bounded cart.',
    input: { message },
    output: { productCount: catalog.length, plan }
  });

  const cart = buildCart({ catalog, requestedProductId, quantity });
  const gateDecision = evaluateMoneyAction({ merchant, cart, paymentMethod });
  const amount = cart.reduce((sum, item) => sum + item.total, 0);

  const transaction = await Transaction.create({
    merchantId,
    buyerAgentId,
    status: gateDecision.requiresHumanApproval ? 'approval_required' : 'draft',
    lineItems: cart,
    amount,
    currency: merchant.currency,
    gateDecision
  });

  await logAudit({
    merchantId,
    transactionId: transaction._id,
    actor: 'buyer_agent',
    action: 'money_action_gate_evaluated',
    riskLevel: gateDecision.allowed && !gateDecision.requiresHumanApproval ? 'low' : 'high',
    boundedBy: gateDecision.boundedBy,
    explanation: gateDecision.allowed
      ? 'The proposed checkout was checked against merchant-defined limits before payment.'
      : 'The proposed checkout was blocked because it violated merchant-defined limits.',
    input: { cart, paymentMethod },
    output: gateDecision
  });

  if (!gateDecision.allowed || gateDecision.requiresHumanApproval) {
    return {
      transaction,
      reply: 'I prepared the cart, but this order needs human review before payment.',
      nextAction: 'human_approval_required'
    };
  }

  const order = await createRazorpayTestOrder({
    amount,
    currency: merchant.currency,
    receipt: transaction._id.toString()
  });

  transaction.status = 'payment_pending';
  transaction.razorpayOrderId = order.id;
  transaction.paymentAttemptCount += 1;
  await transaction.save();

  await logAudit({
    merchantId,
    transactionId: transaction._id,
    actor: 'payment_gateway',
    action: 'razorpay_test_order_created',
    boundedBy: gateDecision.boundedBy,
    explanation: 'A Razorpay test-mode order was created only after the checkout gate passed.',
    input: { amount, currency: merchant.currency },
    output: order
  });

  return {
    transaction,
    reply: 'The Razorpay test order is ready. Complete payment through the secure Checkout window.',
    nextAction: 'open_razorpay_checkout'
  };
}
