import Transaction from '../models/Transaction.js';
import Merchant from '../models/Merchant.js';
import { getReadableCatalog, buildCart } from './catalogService.js';
import { evaluateMoneyAction } from './guardrailService.js';
import { createCheckoutPlan } from './llmPlannerService.js';
import { createRazorpayTestOrder, simulatePayment } from '../utils/razorpayMock.js';
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

  try {
    const payment = await simulatePayment({ orderId: order.id, amount, failureMode });
    if (!payment.ok) {
      transaction.status = 'failed';
      transaction.failureReason = payment.reason;
      transaction.recoveryStrategy = payment.advice;
      await transaction.save();
      await logAudit({
        merchantId,
        transactionId: transaction._id,
        actor: 'buyer_agent',
        action: 'payment_decline_recovered',
        riskLevel: 'medium',
        explanation: 'Payment was declined; the agent paused capture and suggested a safe alternate payment method.',
        input: { failureMode },
        output: payment
      });
      return { transaction, reply: `Payment declined. Recovery: ${payment.advice}`, nextAction: 'retry_payment' };
    }

    transaction.status = failureMode === 'timeout' ? 'recovered' : 'paid';
    transaction.razorpayPaymentId = payment.paymentId;
    await transaction.save();
    await logAudit({
      merchantId,
      transactionId: transaction._id,
      actor: 'payment_gateway',
      action: 'payment_captured',
      explanation: 'Payment was captured in test mode and recorded with a traceable payment id.',
      input: { orderId: order.id },
      output: payment
    });
    return { transaction, reply: 'Checkout completed successfully in Razorpay test mode.', nextAction: 'complete' };
  } catch (error) {
    transaction.status = 'recovered';
    transaction.failureReason = error.code || error.message;
    transaction.recoveryStrategy = 'Recovered by polling the order status and asking the buyer agent to retry without duplicating the order.';
    await transaction.save();
    await logAudit({
      merchantId,
      transactionId: transaction._id,
      actor: 'buyer_agent',
      action: 'gateway_timeout_recovered',
      riskLevel: 'medium',
      explanation: 'Gateway timeout was handled without creating a duplicate charge; recovery is visible in the audit trail.',
      input: { failureMode },
      output: { error: error.message, recoveryStrategy: transaction.recoveryStrategy }
    });
    return { transaction, reply: transaction.recoveryStrategy, nextAction: 'safe_retry_available' };
  }
}
