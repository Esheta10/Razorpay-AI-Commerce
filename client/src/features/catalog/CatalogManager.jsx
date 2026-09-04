import { PackagePlus } from 'lucide-react';
import { Card } from '../../components/Card.jsx';

export function CatalogManager({ products }) {
  return (
    <Card className="bg-[#0d1320]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5 text-[#77a7ff]" />
          <h2 className="text-lg font-black text-white">Agent Catalog</h2>
        </div>
        <span className="rounded-full bg-[#20e7a8]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#20e7a8]">
          {products.length} indexed • sync 2s ago
        </span>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={product._id} className="grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded-xl bg-[#111b2f] p-3">
            <div className="relative h-16 w-14 overflow-hidden rounded-lg border border-white/5 bg-gradient-to-b from-[#202a3d] to-[#0c1320]">
              <div className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-t bg-slate-200" />
              <div
                className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-b-lg rounded-t ${
                  index % 3 === 0
                    ? 'h-9 w-5 bg-gradient-to-b from-[#fff5e7] via-[#f7b955] to-[#20202b]'
                    : index % 3 === 1
                      ? 'h-9 w-6 bg-gradient-to-b from-[#eaf8ff] via-[#77a7ff] to-[#182033]'
                      : 'h-7 w-8 rounded-t-xl bg-gradient-to-b from-[#ffeaf0] via-[#ff7d9c] to-[#25171f]'
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-bold text-white">{product.name}</p>
                <p className="shrink-0 text-sm font-black text-[#20e7a8]">₹{(product.price / 100).toLocaleString('en-IN')}</p>
              </div>
              <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-slate-400">{product.description}</p>
              <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8fe9c8]">
                {index === 0 ? 'Core Item' : 'Companion'} • agent-readable SKU
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
