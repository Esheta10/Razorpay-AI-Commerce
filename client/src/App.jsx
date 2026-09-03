import { useEffect, useState } from 'react';
import { AuditTrailViewer } from './components/AuditTrailViewer.jsx';
import { ChatCheckout } from './features/chat-checkout/ChatCheckout.jsx';
import { CatalogManager } from './features/catalog/CatalogManager.jsx';
import { MerchantDashboard } from './features/dashboard/MerchantDashboard.jsx';
import { fetchMerchantSummary } from './services/api.js';

const demoMerchantId = import.meta.env.VITE_DEMO_MERCHANT_ID || '';

export default function App() {
  const [merchantId, setMerchantId] = useState(demoMerchantId);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

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
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 md:px-8">
      <header className="mb-6 border-b border-stone-300 pb-5">
        <p className="text-sm font-bold uppercase tracking-wide text-saffron">Razorpay AI Buildathon</p>
        <h1 className="mt-1 text-3xl font-black md:text-5xl">AI Growth & Agentic Commerce</h1>
        <p className="mt-2 max-w-3xl text-stone-700">
          Grow merchant revenue with an explainable buyer agent, gated money actions, test-mode payment recovery, and a visual audit trail.
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className="h-10 min-w-80 rounded-md border border-stone-300 bg-white px-3"
          placeholder="Seed backend, then paste merchant id"
          value={merchantId}
          onChange={(event) => setMerchantId(event.target.value)}
        />
        <button className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-white" onClick={() => loadSummary()}>
          Load merchant
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>

      {summary && (
        <div className="space-y-6">
          <MerchantDashboard summary={summary} />
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <ChatCheckout merchantId={merchantId} products={summary.products} onComplete={() => loadSummary()} />
            <CatalogManager products={summary.products} />
          </div>
          <section>
            <h2 className="mb-3 text-xl font-bold">Visual audit trail</h2>
            <AuditTrailViewer logs={summary.auditLogs} />
          </section>
        </div>
      )}
    </main>
  );
}
