import { ShieldCheck, AlertTriangle, CreditCard, Bot } from 'lucide-react';

const icons = {
  buyer_agent: Bot,
  merchant_agent: ShieldCheck,
  payment_gateway: CreditCard,
  human: AlertTriangle
};

export function AuditTrailViewer({ logs }) {
  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const Icon = icons[log.actor] || ShieldCheck;
        return (
          <div key={log._id} className="rounded-lg border border-line bg-panelSoft p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-[#20263a] p-2">
                <Icon className="h-4 w-4 text-violet" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-white">{log.action}</p>
                  <span className="rounded-full bg-mint/10 px-2 py-0.5 text-xs font-extrabold text-mint">{log.riskLevel}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-400">{log.explanation}</p>
                {log.boundedBy && Object.keys(log.boundedBy).length > 0 && (
                  <p className="mt-2 font-mono text-xs text-slate-500">Bounds: {JSON.stringify(log.boundedBy)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
