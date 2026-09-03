import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import agentRoutes from './routes/agent.js';
import merchantRoutes from './routes/merchant.js';
import paymentRoutes from './routes/payments.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'razorpay-ai-commerce-server' });
});

app.use('/api/agent', agentRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/payments', paymentRoutes);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/razorpay_ai_commerce')
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  });
