import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyFilters, productMatches, sortProducts } from '../lib/store/shop-catalog.ts';

const rug = (sku, pricePaise, attributes = {}) => ({ sku, pricePaise, name: sku, description: null, categorySlug: 'heritage', image: '', stock: 1, ...attributes });
test('filters combine across groups and allow alternatives within a group', () => {
  const p = rug('a', 6000000, { sizes: ['6 × 9 ft'], colors: ['Blue'], materials: ['Wool'], weave: 'Hand-knotted' });
  assert.ok(productMatches(p, { ...emptyFilters, color: ['Blue', 'Red'], size: ['6 × 9 ft'], material: ['Wool'], weave: ['Hand-knotted'], price: ['₹50,000 – ₹1,00,000'] }));
  assert.equal(productMatches(p, { ...emptyFilters, color: ['Blue'], material: ['Silk'] }), false);
  assert.equal(productMatches(rug('unknown', null), { ...emptyFilters, material: ['Wool'] }), false);
});
test('price boundaries do not overlap and unpriced pieces never count as free', () => {
  for (const [amount, expected] of [[0, 0], [4999999, 0], [5000000, 1], [9999999, 1], [10000000, 2], [null, 3]]) {
    const bands = ['Under ₹50,000', '₹50,000 – ₹1,00,000', '₹1,00,000 and above', 'Price on request'];
    assert.deepEqual(bands.map((band) => productMatches(rug('p', amount), { ...emptyFilters, price: [band] })), bands.map((_, index) => index === expected));
  }
});
test('price sorting puts unpriced pieces last in both directions without mutating catalog', () => {
  const products = [rug('unknown', null), rug('high', 10000000), rug('low', 5000000)];
  assert.deepEqual(sortProducts(products, 'price-asc').map(p => p.sku), ['low', 'high', 'unknown']);
  assert.deepEqual(sortProducts(products, 'price-desc').map(p => p.sku), ['high', 'low', 'unknown']);
  assert.equal(products[0].sku, 'unknown');
});
test('new arrivals and popularity use catalog evidence with stable ties', () => {
  const products = [rug('old', null, { createdAt: '2025-01-01T00:00:00Z', popularity: 8 }), rug('new', null, { createdAt: '2026-01-01T00:00:00Z', popularity: 2 }), rug('missing', null)];
  assert.equal(sortProducts(products, 'newest')[0].sku, 'new');
  assert.equal(sortProducts(products, 'popular')[0].sku, 'old');
  assert.deepEqual(sortProducts(products, 'featured'), products);
});
