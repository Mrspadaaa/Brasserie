import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { get, load, plain } from './yeast-catalogue/fetch.mjs';
const out = resolve('.codex-remote-attachments/yeast-catalogue/inventories');
await mkdir(out, { recursive: true });
const items = data => Array.isArray(data.content) ? data.content.flatMap(x => x.data?.content_archive_items ?? []) : [];
async function archive(id, name, host, initial, allMarkets = false) {
  const report = { id, name, type: 'lallemand', inventoryReceipts: [], products: [], errors: [] };
  const save = () => writeFile(resolve(out, id + '.json'), JSON.stringify(report, null, 2));
  try {
    const first = await get(host + initial), root = JSON.parse(first.body);
    const endpoints = [host + initial];
    if (allMarkets) for (const [market, locales] of Object.entries(root.market_language_links)) {
      const locale = locales.en ? 'en' : locales.fr ? 'fr' : Object.keys(locales)[0];
      const page = new URL(locales[locale]).pathname.split('/').filter(Boolean).at(-1);
      endpoints.push(`${host}/api/content?locale=${locale}&market=${market}&page=${page}`);
    }
    if (id === 'lallemand-distilling') endpoints.push(`${host}/api/content?locale=en&market=eu&page=cutting-edge-yeasts`);
    const unique = new Map();
    for (const url of new Set(endpoints)) {
      try {
        const r = await get(url); const rows = items(JSON.parse(r.body));
        if (!rows.length) throw Error('No archive items');
        report.inventoryReceipts.push(r.receipt);
        for (const row of rows) {
          const p = row.content_archive_item_data, slug = p.content_archive_item_slug ?? new URL(p.content_archive_item_page_link).pathname.split('/').filter(Boolean).at(-1);
          if (!unique.has(slug)) unique.set(slug, { url: p.content_archive_item_page_link, name: plain(p.content_archive_item_title), inventoryUrl: url, inventory: { id: slug, body_html: p.content_archive_item_excerpt, tags: Object.values(row.content_archive_item_filters ?? {}).flatMap(x => Object.keys(x)), documents: p.content_archive_item_quick_links ?? [] }, markets: [] });
          unique.get(slug).markets.push(new URL(url).searchParams.get('market'));
        }
      } catch (e) { report.errors.push({ url, error: e.message }); }
    }
    report.products = [...unique.values()]; report.discovered = unique.size; await save();
    console.log(`${id}: ${unique.size} references in ${report.inventoryReceipts.length} inventories`);
    let count = 0;
    for (const p of report.products) {
      try {
        const segments = new URL(p.url).pathname.split('/').filter(Boolean), locale = segments[0], market = segments[1], page = segments.at(-1);
        const api = `${host}/api/content?locale=${locale}&market=${market}&page=${page}${id === 'lallemand-wine' ? '&productbaseurl=' + segments.slice(2).join('/') : ''}`;
        const r = await get(api), detail = JSON.parse(r.body);
        if (detail.errorCode || !detail.content?.information) throw Error('Product detail unavailable');
        p.detail = detail.content; p.receipt = r.receipt;
      } catch (e) { p.error = e.message; report.errors.push({ url: p.url, error: e.message }); }
      count++; if (count % 20 === 0) { await save(); console.log(`${id}: ${count}/${unique.size}`); }
    }
  } catch (e) { report.errors.push({ error: e.message }); }
  report.finishedAt = new Date().toISOString(); await save(); console.log(`${id}: done ${report.products.length}; ${report.errors.length} errors`);
}
async function brewing() {
  const id = 'lallemand-brewing', host = 'https://shop-us.lallemandbrewing.com', report = { id, name: 'Lallemand Brewing', type: 'lallemand-shop', inventoryReceipts: [], products: [], errors: [] };
  const save = () => writeFile(resolve(out, id + '.json'), JSON.stringify(report, null, 2));
  try {
    for (let page = 1; page <= 4; page++) {
      const url = `${host}/brewing-yeast/${page === 1 ? '' : '?page=' + page}`, r = await get(url);
      const data = JSON.parse(load(r.body)('#initialReduxState').text()).page;
      report.inventoryReceipts.push(r.receipt);
      for (const p of data.products ?? []) if (!report.products.some(x => x.inventory.id === p.id)) report.products.push({ url: host + p.url, name: p.title, inventory: p, inventoryUrl: url });
    }
    report.discovered = report.products.length; await save();
    for (const p of report.products) { try { p.receipt = (await get(p.url)).receipt; } catch (e) { p.error = e.message; report.errors.push({ url: p.url, error: e.message }); } }
  } catch (e) { report.errors.push({ error: e.message }); }
  report.finishedAt = new Date().toISOString(); await save(); console.log(`${id}: ${report.products.length}`);
}
const selected = process.argv.find(a => a.startsWith('--sources='))?.slice(10).split(',');
await Promise.all([
  ...(!selected || selected.includes('wine') ? [archive('lallemand-wine', 'Lallemand Wine', 'https://www.lallemandwine.com', '/api/content?locale=en&market=united-states&page=wine-yeasts', true)] : []),
  ...(!selected || selected.includes('distilling') ? [archive('lallemand-distilling', 'Lallemand Distilling', 'https://lallemanddistilling.com', '/api/content?locale=en&market=eu&page=yeasts')] : []),
  ...(!selected || selected.includes('brewing') ? [brewing()] : []),
]);
