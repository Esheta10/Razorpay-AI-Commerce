import { Router } from 'express';
import { runBuyerAgentCheckout } from '../services/aiAgentService.js';

const router = Router();

router.post('/checkout', async (req, res, next) => {
  try {
    const result = await runBuyerAgentCheckout(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
