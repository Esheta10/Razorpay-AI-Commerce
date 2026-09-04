import crypto from 'node:crypto';

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt(payload, type) {
  const header = { alg: 'ES256', typ: type, kid: 'orbit-ap2-demo-key-1' };
  const encodedHeader = encode(header);
  const encodedPayload = encode(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), privateKey).toString('base64url');
  return `${signingInput}.${signature}`;
}

export function createAp2Mandates({ merchant, transactionId, cart, amount, currency }) {
  const now = Math.floor(Date.now() / 1000);
  const checkoutPayload = {
    order_id: transactionId,
    merchant: {
      id: merchant._id.toString(),
      name: merchant.name
    },
    line_items: cart.map((item, index) => ({
      id: item.productId.toString(),
      product: {
        id: item.productId.toString(),
        title: item.name,
        price: item.unitPrice / 100,
        currency
      },
      quantity: item.quantity
    })),
    total_price: amount / 100,
    currency
  };
  const checkoutJwt = signJwt(checkoutPayload, 'JWT');
  const checkoutHash = crypto.createHash('sha256').update(checkoutJwt).digest('base64url');
  const checkoutMandate = {
    vct: 'mandate.checkout.1',
    checkout_jwt: checkoutJwt,
    checkout_hash: checkoutHash,
    iat: now,
    exp: now + 900
  };
  const paymentMandate = {
    vct: 'mandate.payment.1',
    transaction_id: checkoutHash,
    payee: { id: merchant._id.toString(), name: merchant.name },
    payment_amount: { amount, currency },
    payment_instrument: { id: 'razorpay-checkout', type: 'card_or_upi', description: 'Selected in Razorpay Checkout' },
    iat: now,
    exp: now + 900
  };
  const paymentMandateJwt = signJwt(paymentMandate, 'JWT');

  return {
    protocol: 'AP2',
    version: '0.2',
    signature_algorithm: 'ES256',
    key_id: 'orbit-ap2-demo-key-1',
    verification: 'server-signed',
    checkout_mandate: checkoutMandate,
    payment_mandate: paymentMandate,
    payment_mandate_jwt: paymentMandateJwt
  };
}

export function getAp2PublicKey() {
  return publicKey.export({ format: 'jwk' });
}
