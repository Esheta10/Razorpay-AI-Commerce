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
          <div key={log._id} className="rounded-md border border-stone-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-stone-100 p-2">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{log.action}</p>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{log.riskLevel}</span>
                </div>
                <p className="mt-1 text-sm text-stone-600">{log.explanation}</p>
                {log.boundedBy && Object.keys(log.boundedBy).length > 0 && (
                  <p className="mt-2 text-xs text-stone-500">Bounds: {JSON.stringify(log.boundedBy)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
