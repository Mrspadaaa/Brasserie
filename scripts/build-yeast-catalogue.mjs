import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cacheDir, sha } from './yeast-catalogue/fetch.mjs';
import { catalogueHash, classify, parseProduct, PARSER_VERSION } from './yeast-catalogue/parse.mjs';
const input = resolve('.codex-remote-attachments/yeast-catalogue/inventories');
const records = new Map(), coverage = [];
const slug = s => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const known = new Map();
for (const file of ['hopYeastBootstrap', 'hopStudyBootstrap', 'hopTrialBootstrap', 'hopSolverBootstrap', 'fermentationGuideBootstrap']) {
  const data = JSON.parse(await readFile(`src/data/${file}.json`, 'utf8'));
  for (const row of (Array.isArray(data) ? data : data.hopKnowledge).filter(k => k.kind === 'yeast')) known.set(row.id, row);
}
export function recordId(config, product, parsed) {
  if (config.id === 'white-labs' && parsed.code) return 'white-labs-' + slug(parsed.code);
  if (config.id === 'wyeast' && parsed.code) return 'wyeast-' + slug(parsed.code);
  if (config.id === 'fermentis') {
    if (/safale-us-05/.test(product.url)) return 'fermentis-us05';
    if (/safale-w-68/.test(product.url)) return 'fermentis-w68';
  }
  if (config.id === 'lallemand-brewing' || /^LalBrew\b/i.test(parsed.name)) {
    if (/Munich\s*Classic/i.test(parsed.name)) return 'lallemand-munich-classic';
    const match = parsed.name.match(/LalBrew[\s®™]*(CBC-1|BRY-97|Nottingham|London|Windsor|Diamond|Verdant(?:\s+IPA)?|Pomona|Abbaye|Belle Saison|Voss|NovaLager|Wit|New England|Farmhouse|LoNa|House Ale)/i);
    if (match) return 'lalbrew-' + slug(match[1]).replace('bry-97', 'bry97').replace(/^verdant$/, 'verdant-ipa');
  }
  return `yeast-${config.id}-${slug(String(product.inventory?.id ?? product.url.split('/').filter(Boolean).at(-1))).slice(0,85)}`;
}
function receipt(r) { return { url: r.url, retrievedAt: r.retrievedAt, sha256: r.sha256, etag: r.etag ?? null, lastModified: r.lastModified ?? null }; }
for (const file of (await readdir(input)).filter(f => f.endsWith('.json')).sort()) {
  const config = JSON.parse(await readFile(resolve(input, file), 'utf8'));
  const report = { id: config.id, manufacturer: config.name, discovered: config.discovered ?? config.products.length, references: 0, detailed: 0, excluded: [], errors: [...config.errors], complete: !!config.finishedAt, inventorySources: config.inventoryReceipts.map(receipt) };
  for (const p of config.products) {
    if (!classify(config, p)) { report.excluded.push({ name: p.name, url: p.url, reason: 'Produit sans culture isolée : accessoire, nutriment seul, service ou coffret commercial.' }); continue; }
    let html = '', parsed;
    if (p.receipt) try { html = await readFile(resolve(cacheDir, sha(p.receipt.url) + '.body'), 'utf8'); if (sha(html) !== p.receipt.sha256) throw Error('Cache hash mismatch'); } catch (e) { report.errors.push({ url: p.url, error: e.message }); }
    try { parsed = parseProduct(config, p, html); }
    catch (e) { report.errors.push({ url: p.url, error: e.message }); parsed = parseProduct({ ...config, id: 'fallback', type: 'fallback' }, p, ''); }
    if (config.id === 'fermentis' && (parsed.categories.some(c => /Beer styles|nutrient|enzyme|clarif|Fermentation aids|Functional products/i.test(c)) || /^(?:Spring|ViniLiquid)/i.test(parsed.name))) { report.excluded.push({ name: parsed.name, url: p.url, reason: 'Catégorie fabricant : style, nutriment ou enzyme, sans levure vivante.' }); continue; }
    const inventoryReceipt = config.inventoryReceipts.find(r => r.url === p.inventoryUrl) ?? config.inventoryReceipts[0];
    const receipts = [inventoryReceipt, p.receipt].filter(Boolean).map(receipt);
    if (!receipts.length) { report.errors.push({ url: p.url, error: 'No verifiable retrieval receipt' }); continue; }
    const id = recordId(config, p, parsed);
    const gaps = ['Rendement de libération des thiols et intensités sensorielles non calibrés.'];
    if (p.error) gaps.push('Fiche détaillée indisponible à la collecte ; inventaire conservé.');
    if (!parsed.facts.some(f => f.key === 'temperature')) gaps.push('Fenêtre de fermentation non extraite.');
    if (!parsed.facts.some(f => f.key === 'pof')) gaps.push('Statut POF non documenté dans les champs extraits.');
    const manufacturer=/^LalBrew\b/i.test(parsed.name)?'Lallemand Brewing':config.name;
    const catalogue = { manufacturer, productId: String(p.inventory?.id ?? p.url), productCode: parsed.code || null,
      aliases: [...new Set([parsed.name, p.name, parsed.code].filter(Boolean))], categories: parsed.categories, status: 'listed', facts: parsed.facts,
      documents: parsed.documents, retrievals: receipts, publishedAt: p.inventory?.published_at ?? null, pageUpdatedAt: p.inventory?.updated_at ?? null,
      parserVersion: PARSER_VERSION, contentSha256: '', gaps };
    const row = { ...(known.get(id) ?? { id, kind: 'yeast', name: `${manufacturer} · ${parsed.name}`, betaLyase: 'unknown', source: parsed.source, ...(parsed.form ? { form: parsed.form } : {}) }), catalogue };
    if (records.has(id)) {
      const old = records.get(id).catalogue;
      // Explicit manufacturer-branded resale, never a guessed strain equivalence.
      const useManufacturerPage=config.id==='lallemand-brewing';
      catalogue.manufacturer = useManufacturerPage?manufacturer:old.manufacturer;
      catalogue.productId = useManufacturerPage?catalogue.productId:old.productId;
      for (const field of ['aliases', 'categories', 'gaps']) catalogue[field] = [...new Set([...old[field], ...catalogue[field]])];
      for (const field of ['facts', 'documents', 'retrievals']) catalogue[field] = [...new Map([...old[field], ...catalogue[field]].map(x => [JSON.stringify(x), x])).values()];
      if(!useManufacturerPage){row.name = records.get(id).name;row.source = records.get(id).source;}
      if(records.get(id).form)row.form=records.get(id).form;
    }
    if(catalogue.facts.some(f=>f.key==='temperature'))catalogue.gaps=catalogue.gaps.filter(g=>g!=='Fenêtre de fermentation non extraite.');
    if(catalogue.facts.some(f=>f.key==='pof'))catalogue.gaps=catalogue.gaps.filter(g=>g!=='Statut POF non documenté dans les champs extraits.');
    catalogue.contentSha256 = catalogueHash(catalogue); records.set(id, row); report.references++;
    if (parsed.facts.length) report.detailed++;
  }
  coverage.push(report);
}
await mkdir('src/data', { recursive: true });
const rows = [...records.values()].sort((a,b) => a.id.localeCompare(b.id));
await writeFile('src/data/yeastCatalogueBootstrap.json', JSON.stringify(rows, null, 2) + '\n');
await mkdir('docs/research/yeast-catalogue', { recursive: true });
await writeFile('docs/research/yeast-catalogue/coverage.json', JSON.stringify({ generatedAt: new Date().toISOString(), parserVersion: PARSER_VERSION, records: rows.length, manufacturers: coverage }, null, 2) + '\n');
console.log(JSON.stringify({ records: rows.length, facts: rows.reduce((s,r)=>s+r.catalogue.facts.length,0), coverage: coverage.map(c=>({id:c.id,records:c.references,detailed:c.detailed,excluded:c.excluded.length,errors:c.errors.length,complete:c.complete})) }, null, 2));
