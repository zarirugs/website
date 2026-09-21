import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const migrations = path.join(root, '../db/migrations');
  for (const file of readdirSync(migrations).filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(path.join(migrations, file), 'utf8'));
  for (const [id, category] of [['front', 'category-heritage'], ['back', 'category-heritage'], ['other', 'category-contemporary']]) {
    sqlite.prepare("INSERT INTO media_assets (id, name, source_type, image_url, category_id) VALUES (?, ?, 'url', ?, ?)").run(id, id, `https://example.com/${id}.jpg`, category);
  }
  const database = {
    prepare(sql) {
      const statement = { sql, args: [], bind(...args) { return { ...statement, args }; }, async first() { return sqlite.prepare(sql).get(...this.args) ?? null; }, async all() { return { results: sqlite.prepare(sql).all(...this.args) }; }, async run() { return sqlite.prepare(sql).run(...this.args); } };
      return statement;
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try { for (const s of statements) sqlite.prepare(s.sql).run(...s.args); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  let authorized = true;
  function load(file) {
    const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const loaded = { exports: {} };
    new Function('require', 'module', 'exports', source)((id) => {
      if (id === '@/lib/server/guard') return { authenticatedAdminContext: async () => authorized ? { database } : null };
      if (id.startsWith('@/')) return load(path.join(root, id.slice(2) + '.ts'));
      return require(id);
    }, loaded, loaded.exports);
    return loaded.exports;
  }
  return { sqlite, list: load(path.join(root, 'app/api/products/route.ts')), item: load(path.join(root, 'app/api/products/[sku]/route.ts')), deny() { authorized = false; } };
}
const request = (body, method = 'POST') => new Request('http://localhost/api/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const details = { sku: 'TEST-RUG', name: 'Test rug', categoryId: 'category-heritage', stock: 2, reorderLevel: 0, imageIds: ['front', 'back'] };

test('create, reload, reorder and clear a product gallery', async () => {
  const f = fixture();
  try {
    assert.equal((await f.list.POST(request(details))).status, 201);
    async function product() { const response = await f.list.GET(new Request('http://localhost/api/products')); assert.equal(response.status, 200); return (await response.json()).products.find(p => p.sku === details.sku); }
    assert.deepEqual((await product()).imageIds, ['front', 'back']);
    const patch = body => f.item.PATCH(request(body, 'PATCH'), { params: Promise.resolve({ sku: details.sku }) });
    assert.equal((await patch({ imageIds: ['back', 'front'], isVisible: false })).status, 200);
    assert.deepEqual((await product()).imageIds, ['back', 'front']);
    assert.equal((await product()).mediaAssetId, 'back');
    assert.equal((await patch({ stock: 3 })).status, 200);
    assert.equal((await product()).isVisible, false);
    assert.equal((await patch({ imageIds: [] })).status, 200);
    assert.deepEqual((await product()).imageIds, []);
    assert.equal((await product()).mediaAssetId, null);
  } finally { f.sqlite.close(); }
});
test('invalid galleries do not replace saved photos and unauthenticated writes fail', async () => {
  const f = fixture();
  try {
    assert.equal((await f.list.POST(request(details))).status, 201);
    for (const ids of [['front', 'other'], ['front', 'front'], ['missing']]) {
      assert.equal((await f.item.PATCH(request({ imageIds: ids }, 'PATCH'), { params: Promise.resolve({ sku: details.sku }) })).status, 400);
    }
    assert.deepEqual(f.sqlite.prepare('SELECT media_asset_id FROM product_images WHERE sku = ? ORDER BY sort_order').all(details.sku).map(i => i.media_asset_id), ['front', 'back']);
    f.deny();
    assert.equal((await f.list.POST(request(details))).status, 401);
    assert.equal((await f.item.PATCH(request({ imageIds: [] }, 'PATCH'), { params: Promise.resolve({ sku: details.sku }) })).status, 401);
  } finally { f.sqlite.close(); }
});
