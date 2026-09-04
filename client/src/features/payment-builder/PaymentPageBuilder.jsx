import { AlertTriangle, CheckCircle2, ChevronDown, CircleDollarSign, Code2, ShieldCheck, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPaymentOrder, verifyPayment } from '../../services/api.js';

export function PaymentPageBuilder({ merchantId, products = [], selectedCartItems = [], onComplete }) {
  const [forceHighValue, setForceHighValue] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [failureState, setFailureState] = useState('idle');
  const [hitlApproved, setHitlApproved] = useState(false);
  const [hitlRejected, setHitlRejected] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');

  const cart = useMemo(() => {
    const selectedProducts = selectedCartItems.length > 0
      ? selectedCartItems.map((selectedItem) => ({
        product: products.find((product) => product._id === selectedItem.productId),
        quantity: selectedItem.quantity
      })).filter((item) => item.product)
      : products.slice(0, 2).map((product) => ({ product, quantity: 1 }));
    const items = selectedProducts.map(({ product, quantity }) => ({
      productId: product._id,
      sku: product.sku || product._id,
      name: product.name,
      qty: quantity,
      unitPrice: product.price
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    return { items, totalAmount };
  }, [products, selectedCartItems]);

  const strongTotal = forceHighValue ? 250000 : cart.totalAmount;
  const hitlRequired = strongTotal > 200000;
  const hitlPending = hitlRequired && !hitlApproved && !hitlRejected;
  const hitlState = hitlPending ? 'PENDING_APPROVAL' : hitlRejected ? 'REJECTED' : hitlRequired ? 'APPROVED' : 'NOT_REQUIRED';
  const humanGateLabel = hitlPending ? 'PENDING APPROVAL' : hitlRejected ? 'REJECTED' : hitlRequired ? 'APPROVED' : 'Not required';
  const paymentAmount = (strongTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const agentPayload = {
    protocol: 'AP2',
    protocol_version: '1.0',
    message_type: 'payment.authorization_request',
    transaction_id: 'tx_ai_98ds7f89ds',
    merchant_id: merchantId,
    agent: {
      agent_id: 'buyer-agent-demo-001',
      principal_id: 'usr_99812739',
      authorization_scope: 'bounded_spend'
    },
    order: {
      items: cart.items.map((item) => ({ sku: item.sku, name: item.name, quantity: item.qty, unit_price: item.unitPrice / 100 })),
      amount: Number((strongTotal / 100).toFixed(2)),
      currency: 'INR'
    },
    guardrails: {
      spend_cap: 2000,
      human_approval_threshold: 2000,
      hitl_status: hitlState,
      allowed_payment_methods: ['UPI', 'CARD']
    }
  };

  async function openRazorpayCheckout() {
    setPaymentError('');
    setPaymentState('creating');

    try {
      const scriptLoaded = await new Promise((resolve, reject) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Razorpay Checkout SDK could not be loaded.'));
        document.body.appendChild(script);
      });
      if (!scriptLoaded) throw new Error('Razorpay Checkout SDK could not be loaded.');

      const { keyId, order, transactionId } = await createPaymentOrder({
        merchantId,
        buyerAgentId: 'buyer-agent-demo-001',
        amount: strongTotal,
        currency: 'INR',
        items: cart.items.map((item) => ({ productId: item.productId, quantity: item.qty })),
        humanApprovalGranted: hitlApproved
      });

      const checkout = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Razorpay AI Commerce',
        description: 'Agent-authorized test checkout',
        order_id: order.id,
        handler: async (response) => {
          setPaymentState('verifying');
          try {
            await verifyPayment({ transactionId, ...response });
            setPaymentState('paid');
            await onComplete?.();
          } catch (error) {
            setPaymentError(error.response?.data?.message || error.message || 'Payment verification failed.');
            setPaymentState('error');
          }
        },
        modal: { ondismiss: () => setPaymentState('idle') },
        prefill: { email: 'buyer@example.com', contact: '9876543210' },
        theme: { color: '#8da2ff' }
      });
      checkout.on('payment.failed', (response) => {
        setPaymentError(response.error?.description || 'Razorpay reported a failed payment.');
        setPaymentState('error');
      });
      checkout.open();
    } catch (error) {
      setPaymentError(error.response?.data?.message || error.message || 'Unable to start Razorpay Checkout.');
      setPaymentState('error');
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1320] p-5 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Agent Commerce Review</p>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-white">Secure Payment</h2>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${hitlPending || hitlRejected ? 'bg-[#2a2313] text-[#f7c96e]' : 'bg-[#0f2b23] text-[#20e7a8]'}`}>
          <CheckCircle2 className="h-4 w-4" />
          {hitlPending ? 'Awaiting gate' : hitlRejected ? 'Payment blocked' : 'Verified'}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-[#101827] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">A. Order & Agent Context</h3>
              <span className="rounded-full bg-[#132a30] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#58f0c8]">Authorized</span>
            </div>

            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.sku} className="flex items-center justify-between rounded-xl bg-[#121d32] px-3 py-3">
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">{item.sku} • Qty {item.qty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">₹{(item.unitPrice / 100).toLocaleString('en-IN')}</p>
                    <p className="font-bold text-white">₹{(item.unitPrice / 100).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#131f32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Initiating Agent</p>
                <p className="mt-2 font-semibold text-white">UpsellBot-v2</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#131f32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Delegation Scope</p>
                <p className="mt-2 font-semibold text-white">Authorized by user up to ₹2,000</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101827] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">B. Financial & Gating Controls</h3>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${hitlPending || hitlRejected ? 'bg-[#2a2313] text-[#f7c96e]' : 'bg-[#0f2b23] text-[#20e7a8]'}`}>
                {hitlPending ? 'HITL GATE: PENDING APPROVAL' : hitlRejected ? 'HITL GATE: REJECTED' : 'Low Risk'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#121d32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Spend Cap</p>
                <p className="mt-2 font-semibold text-white">₹2,000.00</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#121d32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">HITL Gate</p>
                <p className="mt-2 font-semibold text-white">{humanGateLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#121d32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Risk Score</p>
                <p className="mt-2 font-semibold text-white">{hitlRequired ? '0.68 / Medium' : '0.23 / Low'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#121d32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Allowed Methods</p>
                <p className="mt-2 font-semibold text-white">UPI, Card</p>
              </div>
            </div>

            {hitlPending && (
              <div className="mt-4 rounded-xl border border-[#f7c96e]/35 bg-[#2a2313] p-4">
                <p className="font-semibold text-[#f7d98f]">Agent requested ₹2,500 (Exceeds ₹2,000 cap). Approve or Reject?</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() => { setHitlApproved(true); setHitlRejected(false); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#20e7a8]/30 bg-[#103125] px-4 py-3 text-sm font-bold text-[#9afad3]"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Approve Spend
                  </button>
                  <button
                    onClick={() => { setHitlRejected(true); setHitlApproved(false); }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#f7d8b6]/30 bg-[#3a2116] px-4 py-3 text-sm font-bold text-[#f6c98b]"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reject Spend
                  </button>
                </div>
              </div>
            )}
            {hitlRejected && (
              <div className="mt-4 rounded-xl border border-[#f7d8b6]/30 bg-[#3a2116] px-4 py-3 text-sm text-[#f6c98b]">
                Payment progression is locked because the human reviewer rejected this above-cap request.
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => { setForceHighValue((current) => !current); setHitlApproved(false); setHitlRejected(false); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#77a7ff]/30 bg-[#1b2943] px-4 py-3 text-sm font-bold text-[#badaff]"
              >
                {forceHighValue ? 'Reset to Normal Spend' : 'Simulate ₹2,500 Spend'}
              </button>
              {hitlPending && (
                <button
                  onClick={() => { setHitlApproved(true); setHitlRejected(false); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#20e7a8]/30 bg-[#103125] px-4 py-3 text-sm font-bold text-[#9afad3]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Approve Agent Spend
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101827] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">C. Execution & Payment Method</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#121d32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Gateway</p>
                <p className="mt-2 font-semibold text-white">Razorpay Test Mode</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#121d32] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Currency</p>
                <p className="mt-2 font-semibold text-white">INR</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={openRazorpayCheckout}
                disabled={forceHighValue || hitlPending || hitlRejected || paymentState === 'creating' || paymentState === 'verifying'}
                className="inline-flex items-center gap-2 rounded-xl border border-[#77a7ff]/30 bg-[#1b2943] px-4 py-3 text-sm font-bold text-[#badaff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {paymentState === 'creating' || paymentState === 'verifying' ? 'Processing...' : 'Authorize & Pay via Agent'}
              </button>
              <button
                onClick={() => { setFailureState('failed'); setShowFailure(true); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#f7d8b6]/30 bg-[#2f2314] px-4 py-3 text-sm font-bold text-[#f6c98b]"
              >
                <AlertTriangle className="h-4 w-4" />
                Trigger Graceful Failure Test
              </button>
            </div>
            {failureState === 'failed' && (
              <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                Error 422: Autonomous Token Expired. Payment progression paused safely.
              </p>
            )}
            {failureState === 'recovered' && (
              <p className="mt-3 rounded-lg border border-[#20e7a8]/30 bg-[#103125] px-3 py-2 text-sm text-[#9afad3]">
                Auto-Recovery: Delegation token refreshed and retry is ready. Zero revenue leakage.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-5">
          <h3 className="mb-5 text-[28px] font-black tracking-[-0.04em] text-white">Payment Details</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-lg font-medium text-slate-300">Amount</label>
              <div className="flex items-center rounded-xl border border-[#77a7ff]/35 bg-[#141f36] px-3 py-3">
                <span className="mr-2 text-xl text-[#77a7ff]">₹</span>
                <span className="text-lg font-semibold text-white">{paymentAmount}</span>
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-lg font-medium text-slate-300">Email</label>
              <input className="h-12 rounded-xl border border-white/10 bg-[#121d32] px-3 text-white outline-none" value="buyer@example.com" readOnly />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <label className="text-lg font-medium text-slate-300">Phone</label>
              <input className="h-12 rounded-xl border border-white/10 bg-[#121d32] px-3 text-white outline-none" value="9876543210" readOnly />
            </div>

          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#77a7ff]/30 bg-[#101e37] px-4 py-4">
            <div className="flex items-center gap-2 font-bold text-white">
              <CircleDollarSign className="h-5 w-5 text-[#77a7ff]" />
              Pay ₹{paymentAmount}
            </div>
            <button
                disabled={forceHighValue || hitlPending || hitlRejected}
              onClick={openRazorpayCheckout}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b7adff] to-[#8da2ff] px-5 py-3 text-sm font-bold text-[#080d17] shadow-[0_8px_22px_rgba(146,164,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {forceHighValue ? 'Return to Normal Spend' : paymentState === 'creating' ? 'Preparing...' : paymentState === 'verifying' ? 'Verifying...' : paymentState === 'paid' ? 'Paid' : 'Pay Now'}
            </button>
          </div>
          {paymentError && <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{paymentError}</p>}
          {paymentState === 'paid' && <p className="mt-3 rounded-lg border border-[#20e7a8]/30 bg-[#103125] px-3 py-2 text-sm text-[#9afad3]">Payment verified successfully in Razorpay test mode.</p>}

          <div className="mt-6 rounded-xl border border-white/10 bg-[#101827] p-3">
            <button
              onClick={() => setShowProtocol((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={showProtocol}
            >
              <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <Code2 className="h-4 w-4 text-[#77a7ff]" />
                Protocol Inspector
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showProtocol ? 'rotate-180' : ''}`} />
            </button>
            {showProtocol && (
              <div className="mt-3 rounded-lg border border-[#77a7ff]/20 bg-[#0c1424] p-3">
                <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                  <span className="rounded-full bg-[#1b2943] px-2 py-1 text-[#badaff]">AP2 / UAP</span>
                  <span className="rounded-full bg-[#1b2943] px-2 py-1 text-[#badaff]">Live Payload</span>
                </div>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-200">{JSON.stringify(agentPayload, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFailure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#f7d8b6]/30 bg-[#111827] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3b1f12] text-[#f7c98b]">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Failure Demo</p>
                  <h3 className="text-xl font-bold text-white">Error 422: Delegation Token Expired</h3>
                </div>
              </div>
              <button onClick={() => { setShowFailure(false); setFailureState('idle'); }} className="text-lg text-slate-400">×</button>
            </div>

            <div className="rounded-xl border border-[#f7d8b6]/30 bg-[#2a1d12] p-4 text-[#f6c98b]">
              {failureState === 'failed'
                ? 'Error 422: Autonomous Token Expired. The AI buyer was stopped before any money moved.'
                : '[Auto-Recovery: Fresh delegation token issued and checkout is ready to retry.]'}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => { setFailureState('recovered'); setShowFailure(false); setHitlApproved(true); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#20e7a8]/30 bg-[#103125] px-4 py-3 text-sm font-bold text-[#9afad3]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Agent Auto-Retried with Fresh Token
              </button>
              <button
                onClick={() => { setFailureState('recovered'); setShowFailure(false); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#7aa7ff]/30 bg-[#1b2943] px-4 py-3 text-sm font-bold text-[#dfeeff]"
              >
                <ShieldCheck className="h-4 w-4" />
                Rolled back state safely - Zero leakage
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
