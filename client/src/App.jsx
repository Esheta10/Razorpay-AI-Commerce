import { Copy, KeyRound, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './components/Button.jsx';
import { ChatCheckout } from './features/chat-checkout/ChatCheckout.jsx';
import { CatalogManager } from './features/catalog/CatalogManager.jsx';
import { MerchantDashboard } from './features/dashboard/MerchantDashboard.jsx';
import { PaymentPageBuilder } from './features/payment-builder/PaymentPageBuilder.jsx';
import { fetchMerchantSummary } from './services/api.js';

const demoMerchantId = import.meta.env.VITE_DEMO_MERCHANT_ID || '';

export default function App() {
  const [merchantId, setMerchantId] = useState(demoMerchantId);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  async function loadSummary(id = merchantId) {
    if (!id) return;
    try {
      setError('');
      setSummary(await fetchMerchantSummary(id));
    } catch (requestError) {
      const responseMessage = requestError.response?.data?.error;
      setError(responseMessage || requestError.message || 'Unable to reach the backend.');
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <main className="min-h-screen bg-[#070d18] text-slate-100">
      <div className="mx-auto max-w-[1280px] px-4 py-7 md:px-6">
        <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0d1320]/90 px-4 py-3 shadow-[0_18px_45px_rgba(3,7,18,0.45)] backdrop-blur-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/5 bg-[#101827] px-3 py-2">
            <KeyRound className="h-4 w-4 shrink-0 text-[#7daaef]" />
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">MERCHANT_ID:</span>
            <input
              className="w-full min-w-0 border-0 bg-transparent font-mono text-[11px] tracking-[0.08em] text-[#dfe9ff] outline-none placeholder:text-slate-500"
              placeholder="Paste merchant ID"
              value={merchantId}
              onChange={(event) => setMerchantId(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-10 w-10 rounded-lg px-0" aria-label="Copy merchant id">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={() => loadSummary()} className="h-10 rounded-lg px-4">
              <Play className="h-4 w-4" />
              Simulate Agent
            </Button>
          </div>
        </header>

        {error && <p className="mx-auto mt-4 max-w-[1240px] rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        {summary && (
          <div className="mx-auto mt-8 max-w-[1240px]">
            <MerchantDashboard summary={summary} />

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
              <ChatCheckout
                merchantId={merchantId}
                products={summary.products}
                onProductSelected={(productId) => setSelectedProductIds((ids) => ids.includes(productId) ? ids : [...ids, productId])}
                onSelectionReset={() => setSelectedProductIds([])}
                onComplete={() => loadSummary()}
              />
              <CatalogManager products={summary.products} />
            </div>

            <div className="mt-6">
              <PaymentPageBuilder merchantId={merchantId} products={summary.products} selectedProductIds={selectedProductIds} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
