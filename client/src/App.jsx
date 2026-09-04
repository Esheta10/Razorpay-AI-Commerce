import { Copy, KeyRound, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './components/Button.jsx';
import { AuditTrailViewer } from './components/AuditTrailViewer.jsx';
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
  const [selectedCartItems, setSelectedCartItems] = useState([]);

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
        <section className="mx-auto mb-8 max-w-[900px] text-center">
          <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.05em] text-[#c8d2e5] drop-shadow-[0_4px_0_#18243d] md:text-7xl">
            Autonomous Agent
            <br />
            Commerce &amp; Connection
            <br />
            Recovery Engine
          </h1>
          <p className="mx-auto mt-5 max-w-[720px] text-sm leading-6 text-[#8f9db5] md:text-base">
            Grow trust revenue with explainable buyer agents, gated actions, automated recovery, and deterministic audit trails.
          </p>
        </section>

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
                onProductSelected={(item) => setSelectedCartItems((items) => {
                  const existingItem = items.find((selectedItem) => selectedItem.productId === item.productId);
                  return existingItem
                    ? items.map((selectedItem) => selectedItem.productId === item.productId ? { ...selectedItem, quantity: item.quantity } : selectedItem)
                    : [...items, item];
                })}
                onSelectionReset={() => setSelectedCartItems([])}
                onComplete={() => loadSummary()}
              />
              <CatalogManager products={summary.products} />
            </div>

            <div className="mt-6">
              <PaymentPageBuilder merchantId={merchantId} products={summary.products} selectedCartItems={selectedCartItems} onComplete={() => loadSummary()} />
              <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1320] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Explainable money actions</p>
                    <h2 className="mt-1 text-xl font-black text-white">Audit Trail</h2>
                  </div>
                  <span className="rounded-full bg-[#20e7a8]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#20e7a8]">{summary.auditLogs.length} logged</span>
                </div>
                <AuditTrailViewer logs={summary.auditLogs} />
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
