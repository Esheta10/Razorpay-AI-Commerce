import Product from '../models/Product.js';

export async function getReadableCatalog(merchantId) {
  const products = await Product.find({ merchantId, active: true }).lean();
  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    inventory: product.inventory,
    tags: product.tags,
    crossSellProductIds: product.crossSellProductIds.map(String)
  }));
}

export function buildCart({ catalog, requestedProductId, quantity = 1 }) {
  const product = catalog.find((item) => item.id === requestedProductId) || catalog[0];
  if (!product) {
    throw new Error('Catalog is empty.');
  }

  const primary = {
    productId: product.id,
    name: product.name,
    quantity,
    unitPrice: product.price,
    total: product.price * quantity
  };

  const crossSell = catalog.find((item) => product.crossSellProductIds.includes(item.id));
  if (!crossSell) return [primary];

  return [
    primary,
    {
      productId: crossSell.id,
      name: crossSell.name,
      quantity: 1,
      unitPrice: crossSell.price,
      total: crossSell.price
    }
  ];
}
