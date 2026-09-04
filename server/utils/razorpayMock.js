import crypto from 'node:crypto';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export async function createRazorpayTestOrder({ amount, currency, receipt }) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured on the server.');
  }

  return razorpay.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: 1
  });
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const signatureBuffer = Buffer.from(signature || '');
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  return signatureBuffer.length === expectedSignatureBuffer.length
    && crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
}
