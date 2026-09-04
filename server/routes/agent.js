import { Router } from 'express';
import { runBuyerAgentCheckout } from '../services/aiAgentService.js';
import Merchant from '../models/Merchant.js';
import { getReadableCatalog } from '../services/catalogService.js';
import { createCatalogChatReply } from '../services/llmPlannerService.js';

const router = Router();

router.post('/checkout', async (req, res, next) => {
  try {
    const result = await runBuyerAgentCheckout(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/chat', async (req, res, next) => {
  try {
    const { merchantId, message, history = [] } = req.body;
    if (!merchantId || !message?.trim()) return res.status(400).json({ message: 'merchantId and message are required' });
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
    const catalog = await getReadableCatalog(merchantId);
    res.json(await createCatalogChatReply({ catalog, message: message.trim(), history }));
  } catch (error) {
    next(error);
  }
});

export default router;
