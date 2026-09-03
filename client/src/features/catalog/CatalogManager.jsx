import { PackagePlus } from 'lucide-react';
import { Card } from '../../components/Card.jsx';

export function CatalogManager({ products }) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <PackagePlus className="h-5 w-5" />
        <h2 className="text-lg font-bold">Agent-readable catalog</h2>
      </div>
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product._id} className="rounded-md border border-stone-200 p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-stone-600">{product.description}</p>
              </div>
              <p className="shrink-0 font-semibold">INR {(product.price / 100).toLocaleString('en-IN')}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
