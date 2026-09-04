import { useState } from 'react';
import { Bot, Plus, RotateCcw, Send } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { chatWithCatalogAssistant, runAgentCheckout } from '../../services/api.js';

export function ChatCheckout({ merchantId, products, onProductSelected, onSelectionReset, onComplete }) {
  const [message, setMessage] = useState('Buy the serum and add a sensible companion product.');
  const [failureMode, setFailureMode] = useState('none');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedProductId, setSuggestedProductId] = useState(null);
  const [chatError, setChatError] = useState('');

  async function submitCheckout() {
    setLoading(true);
    setChatError('');
    const selected = products.find((product) => product._id === suggestedProductId) || products[0];
    const buyerMessage = { role: 'buyer_agent', text: message };
    setConversation((items) => [...items, buyerMessage]);

    try {
      const result = await runAgentCheckout({
        merchantId,
        buyerAgentId: 'buyer-agent-demo-001',
        message,
        requestedProductId: selected?._id,
        quantity: 1,
        paymentMethod: 'upi',
        failureMode
      });
      setConversation((items) => [...items, { role: 'merchant_agent', text: result.reply }]);
      await onComplete();
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!message.trim()) return;
    setLoading(true);
    setChatError('');
    const buyerMessage = { role: 'buyer_agent', text: message.trim() };
    const nextHistory = [...conversation, buyerMessage];
    setConversation(nextHistory);
    try {
      const result = await chatWithCatalogAssistant({ merchantId, message: message.trim(), history: conversation });
      setSuggestedProductId(result.productId);
      setConversation((items) => [...items, { role: 'assistant', text: result.reply }]);
      setMessage('');
    } catch (error) {
      setChatError(error.response?.data?.message || error.message || 'The product assistant is unavailable.');
    } finally {
      setLoading(false);
    }
  }

  function addSuggestedProduct() {
    const product = products.find((item) => item._id === suggestedProductId);
    if (!product) return;
    onProductSelected(product._id);
    setMessage(`Add ${product.name} to my checkout.`);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1320] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#20e7a8] shadow-[0_0_18px_rgba(32,231,168,0.8)]" />
          <Bot className="h-5 w-5 text-[#77a7ff]" />
          <h2 className="text-lg font-black tracking-[-0.02em] text-white">Conversational Checkout Simulator</h2>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-black text-[#20e7a8]">
          <span className="tracking-[0.14em] text-slate-400">RZP Testnet v2.4</span>
          <Button variant="secondary" className="h-8 rounded-lg px-3 text-[11px]" onClick={() => { setConversation([]); setSuggestedProductId(null); setChatError(''); onSelectionReset(); }}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="mb-4 min-h-[220px] rounded-xl border border-white/5 bg-[#0b1220] p-4">
        {conversation.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-[#121b2e] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Buyer intent ingested</p>
              <span className="font-mono text-[11px] text-slate-500">09:41:08 UTC</span>
            </div>
            <p className="text-lg font-semibold text-white">“{message}”</p>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-[#20e7a8]">
              <span>Intent: Purchase + Smart Upsell</span>
              <span>Budget Guardrail: INR 5,000 max</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conversation.map((item, index) => (
              <div key={`${item.role}-${index}`} className={item.role === 'buyer_agent' ? 'text-right' : 'text-left'}>
                <span
                  className={`inline-block max-w-[82%] rounded-md px-3 py-2 text-sm ${
                    item.role === 'buyer_agent' ? 'bg-[#1f2940] text-slate-100' : 'bg-[#1a2d27] text-[#9afad3]'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}
        {suggestedProductId && (
          <Button variant="secondary" className="mt-3" onClick={addSuggestedProduct}>
            <Plus className="h-4 w-4" />
            Add recommended product
          </Button>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-[#20e7a8]/20 bg-[#122b24] px-4 py-3 text-sm font-medium text-[#9afad3]">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#20e7a8]/15 text-[#20e7a8]">✓</span>
          Checkout completed successfully in Razorpay test mode
        </div>
        <span className="rounded-full bg-[#20e7a8]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#20e7a8]">
          Autonomous settlement
        </span>
      </div>

      {chatError && <p className="mb-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{chatError}</p>}

      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
        <input
          className="h-11 rounded-xl border border-white/10 bg-[#0f1729] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-[#77a7ff]/40"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') sendMessage(); }}
        />
        <select
          className="h-11 rounded-xl border border-white/10 bg-[#0f1729] px-3 text-sm text-slate-100 outline-none focus:border-[#77a7ff]/40"
          value={failureMode}
          onChange={(event) => setFailureMode(event.target.value)}
        >
          <option value="none">Normal payment</option>
          <option value="timeout">Gateway timeout</option>
          <option value="decline">Card decline</option>
        </select>
        <Button onClick={sendMessage} disabled={loading || products.length === 0} className="h-11 rounded-xl px-4">
          {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Chat
        </Button>
        <Button variant="secondary" onClick={submitCheckout} disabled={loading || products.length === 0} className="h-11 rounded-xl px-4">
          Checkout
        </Button>
      </div>
    </div>
  );
}
