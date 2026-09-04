import dns from 'node:dns';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import agentRoutes from './routes/agent.js';
import merchantRoutes from './routes/merchant.js';
import paymentRoutes from './routes/payments.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const port = process.env.PORT || 8080;
const allowedOrigins = [process.env.CLIENT_ORIGIN].filter(Boolean);
const localDevOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || localDevOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    }
  })
);
app.use(express.json({
  verify(request, _response, buffer) {
    request.rawBody = buffer.toString('utf8');
  }
}));
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
