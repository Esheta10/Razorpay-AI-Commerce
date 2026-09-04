import { Activity, IndianRupee, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/Card.jsx';

export function MerchantDashboard({ summary }) {
  const metrics = summary?.metrics || {};
  const cards = [
    {
      label: 'Recovered revenue',
      value: `₹${((metrics.paidRevenue || 0) / 100).toLocaleString('en-IN')}`,
      badge: '+18.4%',
      caption: 'Auto-resolved cart drop-offs',
      icon: IndianRupee,
      active: false,
      accent: 'text-[#5bedc4]'
    },
    {
      label: 'Agent transactions',
      value: metrics.transactionCount || 0,
      badge: 'Live Active',
      caption: 'Razorpay testnet settlement',
      icon: Activity,
      active: true,
      accent: 'text-[#77a7ff]'
    },
    {
      label: 'Failures recovered',
      value: metrics.recoveredFailures || 0,
      badge: '100% SLA',
      caption: 'Post-agent recovery attempts',
      icon: RefreshCcw,
      active: false,
      accent: 'text-[#7ed8ff]'
    },
    {
      label: 'Human approvals',
      value: metrics.approvalRequired || 0,
      badge: 'Gated Clear',
      caption: 'Guardrail threshold protected',
      icon: ShieldAlert,
      active: false,
      accent: 'text-[#9ca3ff]'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.label}
            className={metric.active ? 'border-[#20e7a8]/40 bg-[#0f1728]' : 'border-white/10 bg-[#0d1320]'}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                  metric.active ? 'bg-[#20e7a8]/10 text-[#20e7a8]' : 'bg-[#1d2b3e] text-slate-300'
                }`}
              >
                {metric.badge}
              </span>
            </div>

            <div className="mt-6 flex items-end justify-between gap-3">
              <p className="text-[32px] font-black leading-none tracking-[-0.04em] text-white">{metric.value}</p>
              <Icon className={`h-5 w-5 ${metric.accent}`} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-slate-300">
              <span>{metric.caption}</span>
              {metric.label === 'Recovered revenue' ? (
                <svg className="h-6 w-16 shrink-0 text-[#5bedc4]" viewBox="0 0 100 28" aria-hidden="true">
                  <path d="M3 21 L19 18 L32 23 L48 13 L61 15 L79 8 L97 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
                </svg>
              ) : (
                <span className="h-1.5 w-14 rounded-full bg-slate-600/80" />
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
