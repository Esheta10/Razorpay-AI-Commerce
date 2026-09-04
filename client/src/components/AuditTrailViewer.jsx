import { AlertTriangle, Bot, ChevronDown, CreditCard, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const icons = {
  buyer_agent: Bot,
  merchant_agent: ShieldCheck,
  payment_gateway: CreditCard,
  human: AlertTriangle
};

const actorStyles = {
  buyer_agent: { marker: 'border-[#20e7a8] bg-[#0f2b23] text-[#20e7a8]', card: 'border-[#20e7a8]/30', label: 'buyer agent' },
  merchant_agent: { marker: 'border-[#9c8cff] bg-[#201b3d] text-[#b7adff]', card: 'border-[#9c8cff]/30', label: 'merchant agent' },
  payment_gateway: { marker: 'border-[#77a7ff] bg-[#172844] text-[#9fc2ff]', card: 'border-[#77a7ff]/30', label: 'payment gateway' },
  human: { marker: 'border-[#f7c96e] bg-[#2a2313] text-[#f7c96e]', card: 'border-[#f7c96e]/30', label: 'human reviewer' }
};

function formatTimestamp(value) {
  if (!value) return 'just now';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function AuditTrailViewer({ logs }) {
  const [expandedLog, setExpandedLog] = useState(null);

  return (
    <div className="relative pl-8">
      <div className="absolute bottom-3 left-[13px] top-3 w-px bg-[#263653]" aria-hidden="true" />
      {logs.map((log, index) => {
        const Icon = icons[log.actor] || ShieldCheck;
        const style = actorStyles[log.actor] || actorStyles.merchant_agent;
        const isExpanded = expandedLog === log._id;
        return (
          <article key={log._id || `${log.action}-${index}`} className="relative pb-4 last:pb-0">
            <div className={`absolute -left-8 top-4 flex h-7 w-7 items-center justify-center rounded-full border ${style.marker}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className={`rounded-xl border bg-[#0b1220] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] ${style.card}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-mono text-sm font-bold text-white">{log.action}</p>
                    <span className="rounded-full bg-[#20e7a8]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#20e7a8]">{log.riskLevel || 'low'}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{style.label}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{formatTimestamp(log.createdAt)} UTC</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#132a30] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#58f0c8]">logged</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">{log.explanation}</p>

              {(log.boundedBy && Object.keys(log.boundedBy).length > 0) || log.input || log.output ? (
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                  className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] font-bold text-[#77a7ff]"
                  aria-expanded={isExpanded}
                >
                  View JSON bounds
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : null}

              {isExpanded && (
                <pre className="mt-3 max-h-52 overflow-auto rounded-lg border border-white/10 bg-[#080f1c] p-3 text-[10px] leading-5 text-slate-300">
                  {JSON.stringify({ boundedBy: log.boundedBy || {}, input: log.input || {}, output: log.output || {} }, null, 2)}
                </pre>
              )}
              </div>
          </article>
        );
      })}
    </div>
  );
}
