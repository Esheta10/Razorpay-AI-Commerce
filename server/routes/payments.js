import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { logAudit } from '../utils/audit.js';

const router = Router();

router.post('/webhook/test', async (req, res, next) => {
  try {
    const { transactionId, event, paymentId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    transaction.status = event === 'payment.captured' ? 'paid' : 'failed';
    transaction.razorpayPaymentId = paymentId || transaction.razorpayPaymentId;
    await transaction.save();

    await logAudit({
      merchantId: transaction.merchantId,
      transactionId: transaction._id,
      actor: 'payment_gateway',
      action: `webhook_${event}`,
      explanation: 'A simulated Razorpay webhook updated the transaction state.',
      input: req.body,
      output: { status: transaction.status }
    });

    res.json({ ok: true, transaction });
  } catch (error) {
    next(error);
  }
});

export default router;
