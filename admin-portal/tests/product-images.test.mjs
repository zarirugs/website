import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImageIds, validProductImages, replaceProductImages } from '../lib/server/product-images.ts';

test('gallery input validates limits, types and duplicate IDs', () => {
  assert.deepEqual(parseImageIds([' one ', 'two']), ['one', 'two']);
  assert.deepEqual(parseImageIds([]), []);
  for (const value of [null, 'one', [''], [2], ['one', ' one '], Array.from({ length: 13 }, (_, i) => String(i))]) {
    assert.equal(parseImageIds(value), null);
  }
});
test('gallery rejects missing, non-photographic or other-category media', async () => {
  const database = { prepare(sql) {
    assert.match(sql, /category_id = \?/);
    assert.match(sql, /source_type IN/);
    return { bind(category, ...ids) {
      assert.equal(category, 'heritage');
      return { async all() { return { results: ids.filter(id => id === 'allowed').map(id => ({ id })) }; } };
    } };
  } };
  assert.equal(await validProductImages(database, ['allowed'], 'heritage'), true);
  assert.equal(await validProductImages(database, ['allowed', 'other'], 'heritage'), false);
  assert.equal(await validProductImages(database, [], 'heritage'), true);
});
test('replacing gallery builds ordered statements for the same atomic batch', () => {
  const database = { prepare(sql) { return { bind(...args) { return { sql, args }; } }; } };
  const statements = replaceProductImages(database, 'RUG-1', ['back', 'front']);
  assert.match(statements[0].sql, /DELETE FROM product_images/);
  assert.deepEqual(statements.map(s => s.args), [['RUG-1'], ['RUG-1', 'back', 0], ['RUG-1', 'front', 1]]);
  assert.equal(replaceProductImages(database, 'RUG-1', []).length, 1);
});
