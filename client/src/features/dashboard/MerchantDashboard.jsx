import { IndianRupee, Activity, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Card } from '../../components/Card.jsx';

export function MerchantDashboard({ summary }) {
  const metrics = summary?.metrics || {};
  const cards = [
    { label: 'Recovered revenue', value: `INR ${((metrics.paidRevenue || 0) / 100).toLocaleString('en-IN')}`, icon: IndianRupee },
    { label: 'Agent transactions', value: metrics.transactionCount || 0, icon: Activity },
    { label: 'Failures recovered', value: metrics.recoveredFailures || 0, icon: RefreshCcw },
    { label: 'Human approvals', value: metrics.approvalRequired || 0, icon: ShieldAlert }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <Icon className="h-5 w-5 text-saffron" />
            <p className="mt-4 text-2xl font-bold">{metric.value}</p>
            <p className="text-sm text-stone-600">{metric.label}</p>
          </Card>
        );
      })}
    </div>
  );
}
