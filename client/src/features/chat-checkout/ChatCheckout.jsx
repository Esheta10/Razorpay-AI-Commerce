import { useState } from 'react';
import { Bot, Send, RotateCcw } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { runAgentCheckout } from '../../services/api.js';

export function ChatCheckout({ merchantId, products, onComplete }) {
  const [message, setMessage] = useState('Buy the serum and add a sensible companion product.');
  const [failureMode, setFailureMode] = useState('none');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  async function submitCheckout() {
    setLoading(true);
    const selected = products[0];
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

  return (
    <div className="rounded-md border border-stone-200 bg-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bot className="h-5 w-5" />
        <h2 className="text-lg font-bold">Conversational checkout simulator</h2>
      </div>
      <div className="mb-4 min-h-40 space-y-3 rounded-md bg-white p-4">
        {conversation.length === 0 ? (
          <p className="text-sm text-stone-500">Start a buyer-agent checkout to see gated actions and recovery behavior.</p>
        ) : (
          conversation.map((item, index) => (
            <div key={`${item.role}-${index}`} className={item.role === 'buyer_agent' ? 'text-right' : 'text-left'}>
              <span className="inline-block max-w-[80%] rounded-md bg-stone-100 px-3 py-2 text-sm">{item.text}</span>
            </div>
          ))
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input
          className="h-10 rounded-md border border-stone-300 px-3"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <select className="h-10 rounded-md border border-stone-300 px-3" value={failureMode} onChange={(event) => setFailureMode(event.target.value)}>
          <option value="none">Normal payment</option>
          <option value="timeout">Gateway timeout</option>
          <option value="decline">Card decline</option>
        </select>
        <Button onClick={submitCheckout} disabled={loading || products.length === 0}>
          {loading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Run
        </Button>
      </div>
    </div>
  );
}
