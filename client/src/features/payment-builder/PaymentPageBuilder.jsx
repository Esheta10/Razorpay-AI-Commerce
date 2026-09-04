import { AlertTriangle, CheckCircle2, CircleDollarSign, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPaymentOrder, verifyPayment } from '../../services/api.js';

export function PaymentPageBuilder({ merchantId, products = [], selectedProductIds = [] }) {
  const [forceHighValue, setForceHighValue] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [hitlApproved, setHitlApproved] = useState(false);
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');

  const cart = useMemo(() => {
    const selectedProducts = products.filter((product) => selectedProductIds.includes(product._id));
    const cartProducts = selectedProducts.length > 0 ? selectedProducts : products.slice(0, 2);
    const items = cartProducts.map((product) => ({
      sku: product.sku || product._id,
      name: product.name,
      qty: 1,
      unitPrice: product.price
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice, 0);
    return { items, totalAmount };
  }, [products, selectedProductIds]);

  const strongTotal = forceHighValue ? 250000 : cart.totalAmount;
  const hitlRequired = strongTotal > 200000;
  const hitlState = hitlRequired && !hitlApproved ? 'PENDING APPROVAL' : 'APPROVED';
  const humanGateLabel = hitlRequired ? 'PENDING APPROVAL' : 'Not required';
  const paymentAmount = (strongTotal / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        currency: 'INR'
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

  const payload = {
    transaction_id: 'tx_ai_98ds7f89ds',
    merchant_id: 'merchant_test_xyz',
    buyer_agent: {
      agent_id: 'UpsellBot-v2',
      authorized_principal_id: 'usr_99812739',
      delegation_token: hitlApproved ? 'jwt_sig_bounded_spending_limit_approved' : 'jwt_sig_bounded_spending_limit_pending'
    },
    order_details: {
      items: cart.items.map((item) => ({
        sku: item.sku,
        qty: item.qty,
        unit_price: Number((item.unitPrice / 100).toFixed(2)),
        name: item.name
      })),
      currency: 'INR',
      total_amount: Number((strongTotal / 100).toFixed(2))
    },
    guardrails: {
      max_authorized_amount: 2000,
      allowed_payment_methods: ['UPI', 'CARD'],
      requires_human_gate_above: 1000,
      hitl_gate_status: hitlState,
      risk_score: hitlRequired ? 'medium' : 'low'
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d1320] p-5 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Agent Commerce Review</p>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-white">Secure Payment</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0f2b23] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#20e7a8]">
          <CheckCircle2 className="h-4 w-4" />
          {hitlRequired && !hitlApproved ? 'Awaiting gate' : 'Verified'}
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
              <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${hitlRequired && !hitlApproved ? 'bg-[#2a2313] text-[#f7c96e]' : 'bg-[#0f2b23] text-[#20e7a8]'}`}>
                {hitlRequired && !hitlApproved ? 'HITL Gate: Pending Approval' : 'Low Risk'}
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

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setForceHighValue((current) => !current)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#77a7ff]/30 bg-[#1b2943] px-4 py-3 text-sm font-bold text-[#badaff]"
              >
                {forceHighValue ? 'Reset to Normal Spend' : 'Simulate ₹2,500 Spend'}
              </button>
              {hitlRequired && !hitlApproved && (
                <button
                  onClick={() => setHitlApproved(true)}
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
              <span className="inline-flex items-center gap-2 rounded-full bg-[#2a2b19] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f5d57a]">
                <Sparkles className="h-3.5 w-3.5" />
                Test Mode
              </span>
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
              <button className="inline-flex items-center gap-2 rounded-xl border border-[#77a7ff]/30 bg-[#1b2943] px-4 py-3 text-sm font-bold text-[#badaff]">
                <ShieldCheck className="h-4 w-4" />
                Authorize & Pay via Agent
              </button>
              <button
                onClick={() => setShowFailure(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[#f7d8b6]/30 bg-[#2f2314] px-4 py-3 text-sm font-bold text-[#f6c98b]"
              >
                <AlertTriangle className="h-4 w-4" />
                Trigger Graceful Failure Test
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1729] p-5">
          <div className="mb-4 rounded-xl border border-[#f8d98f]/30 bg-[#2f2915] px-3 py-3 text-sm text-[#f4d777]">
            Test Mode is on. Only test payments can be made for this payment page.
          </div>

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

          <div className="mt-6 rounded-xl border border-white/10 bg-[#101827] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Audit Trail</h3>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#0f2b23] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#20e7a8]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Logged
              </span>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#20e7a8]" /> Agent evaluated cart</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#20e7a8]" /> Budget constraint checked</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#20e7a8]" /> Delegation token validated</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#20e7a8]" /> Razorpay test API invoked</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-[#77a7ff]/30 bg-[#101e37] px-4 py-4">
            <div className="flex items-center gap-2 font-bold text-white">
              <CircleDollarSign className="h-5 w-5 text-[#77a7ff]" />
              Pay ₹{paymentAmount}
            </div>
            <button
              disabled={hitlRequired && !hitlApproved}
              onClick={openRazorpayCheckout}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#b7adff] to-[#8da2ff] px-5 py-3 text-sm font-bold text-[#080d17] shadow-[0_8px_22px_rgba(146,164,255,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {paymentState === 'creating' ? 'Preparing...' : paymentState === 'verifying' ? 'Verifying...' : paymentState === 'paid' ? 'Paid' : 'Pay Now'}
            </button>
          </div>
          {paymentError && <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{paymentError}</p>}
          {paymentState === 'paid' && <p className="mt-3 rounded-lg border border-[#20e7a8]/30 bg-[#103125] px-3 py-2 text-sm text-[#9afad3]">Payment verified successfully in Razorpay test mode.</p>}
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
              <button onClick={() => setShowFailure(false)} className="text-lg text-slate-400">×</button>
            </div>

            <div className="rounded-xl border border-[#f7d8b6]/30 bg-[#2a1d12] p-4 text-[#f6c98b]">
              The AI buyer attempted payment with a stale delegation token. The agent safely stopped the transaction before any money moved.
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => { setShowFailure(false); setHitlApproved(true); }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#20e7a8]/30 bg-[#103125] px-4 py-3 text-sm font-bold text-[#9afad3]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Agent Auto-Retried with Fresh Token
              </button>
              <button
                onClick={() => setShowFailure(false)}
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
