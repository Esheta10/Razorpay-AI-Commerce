import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'bypass-tunnel-reminder': 'true',
    'User-Agent': 'MERN-Frontend'
  }
});

export async function fetchMerchantSummary(merchantId) {
  const { data } = await api.get(`/merchant/summary/${encodeURIComponent(merchantId.trim())}`);
  if (!data.merchant) {
    throw new Error('Merchant not found. Run the seed command and use its merchant ID.');
  }
  return data;
}

export async function runAgentCheckout(payload) {
  const { data } = await api.post('/agent/checkout', payload);
  return data;
}

export async function chatWithCatalogAssistant(payload) {
  const { data } = await api.post('/agent/chat', payload);
  return data;
}

export async function createPaymentOrder(payload) {
  const { data } = await api.post('/payments/orders', payload);
  return data;
}

export async function verifyPayment(payload) {
  const { data } = await api.post('/payments/verify', payload);
  return data;
}
