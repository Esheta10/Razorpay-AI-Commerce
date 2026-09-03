import { nanoid } from 'nanoid';

export async function createRazorpayTestOrder({ amount, currency, receipt }) {
  return {
    id: `order_test_${nanoid(12)}`,
    entity: 'order',
    amount,
    amount_paid: 0,
    amount_due: amount,
    currency,
    receipt,
    status: 'created',
    attempts: 0
  };
}

export async function simulatePayment({ orderId, amount, failureMode }) {
  if (failureMode === 'timeout') {
    const error = new Error('Gateway timeout while confirming payment.');
    error.code = 'GATEWAY_TIMEOUT';
    throw error;
  }

  if (failureMode === 'decline') {
    return {
      ok: false,
      paymentId: null,
      orderId,
      amount,
      reason: 'card_declined',
      advice: 'Ask buyer agent to retry with UPI or a different card.'
    };
  }

  return {
    ok: true,
    paymentId: `pay_test_${nanoid(12)}`,
    orderId,
    amount,
    method: 'upi',
    captured: true
  };
}
