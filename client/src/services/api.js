import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
});

export async function fetchMerchantSummary(merchantId) {
  const { data } = await api.get(`/merchant/summary/${merchantId}`);
  return data;
}

export async function runAgentCheckout(payload) {
  const { data } = await api.post('/agent/checkout', payload);
  return data;
}
