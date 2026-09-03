import { Router } from 'express';
import Merchant from '../models/Merchant.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

const router = Router();

router.get('/summary/:merchantId', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const merchant = await Merchant.findById(merchantId).lean();
    const products = await Product.find({ merchantId }).lean();
    const transactions = await Transaction.find({ merchantId }).sort({ createdAt: -1 }).limit(20).lean();
    const auditLogs = await AuditLog.find({ merchantId }).sort({ createdAt: -1 }).limit(40).lean();
    const paidRevenue = transactions.filter((tx) => ['paid', 'recovered'].includes(tx.status)).reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      merchant,
      products,
      transactions,
      auditLogs,
      metrics: {
        paidRevenue,
        transactionCount: transactions.length,
        recoveredFailures: transactions.filter((tx) => tx.status === 'recovered').length,
        approvalRequired: transactions.filter((tx) => tx.status === 'approval_required').length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const merchant = await Merchant.create(req.body);
    res.status(201).json(merchant);
  } catch (error) {
    next(error);
  }
});

router.post('/:merchantId/products', async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, merchantId: req.params.merchantId });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
