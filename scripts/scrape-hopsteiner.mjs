// Public manufacturer sheets only. No credentials, no AI, no Firestore writes.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { load } = require('cheerio');
const cache = resolve('.codex-remote-attachments/hop-index/hopsteiner');
await mkdir(cache, { recursive: true });
const indexUrl = 'https://www.hopsteiner.de/en/products/all-hop-varieties';
const manifest = [];
async function page(url) {
  const file = resolve(cache, createHash('sha256').update(url).digest('hex') + '.html');
  let html, retrievedAt = null;
  try {
    if (!process.argv.includes('--refresh')) {
      html = await readFile(file, 'utf8');
      try { const receipt = JSON.parse(await readFile(file + '.json', 'utf8')); if (receipt.sha256 === createHash('sha256').update(html).digest('hex')) retrievedAt = receipt.retrievedAt; } catch { /* Older cache: retrieval date is not known. */ }
    }
  } catch { /* uncached */ }
  if (!html) {
    const response = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Brasserie-LAffinee-reference-index/1.0' } });
    if (!response.ok) throw Error(`${response.status}: ${url}`);
    html = await response.text(); retrievedAt = new Date().toISOString(); await writeFile(file, html);
    await writeFile(file + '.json', JSON.stringify({ url, retrievedAt, sha256: createHash('sha256').update(html).digest('hex') }, null, 2));
  }
  manifest.push({ url, retrievedAt, sha256: createHash('sha256').update(html).digest('hex') });
  return load(html);
}
const norm = value => value.replace(/\s+/g, ' ').trim();
const queue = [indexUrl], visited = new Set(), details = new Set();
while (queue.length) {
  const url = queue.shift(); if (visited.has(url)) continue; visited.add(url);
  const $ = await page(url);
  $('a[href]').each((_, a) => {
    const target = new URL($(a).attr('href'), url);
    if (target.origin !== new URL(indexUrl).origin) return;
    if (/^\/en\/products\/all-hop-varieties\/detail\/[^/]+$/.test(target.pathname)) details.add(target.href);
    if (target.pathname === new URL(indexUrl).pathname && target.searchParams.has('tx_solr[page]') && [...target.searchParams.keys()].length === 1) queue.push(target.href);
  });
}
const countries = { 'United States': 'États-Unis', Germany: 'Allemagne', 'United Kingdom': 'Royaume-Uni', England: 'Angleterre', Australia: 'Australie', 'New Zealand': 'Nouvelle-Zélande', Czechia: 'Tchéquie', Slovenia: 'Slovénie', Poland: 'Pologne' };
const tastes = { Citrusy: 'Agrumes', Fruity: 'Fruité', Herbal: 'Herbacé', Floral: 'Floral', Spicy: 'Épicé', Resinous: 'Résineux', Sugarlike: 'Doux', Misc: 'Autres' };
const measurements = [
  ['Alpha acids %', 'alpha', 'percentMass', 'asIs'], ['Beta acids %', 'beta', 'percentMass', 'asIs'],
  ['Total oil (ml/100g)', 'totalOil', 'ml100g', 'asIs'], ['Linalool % rel. of total oil', 'linalool', 'percentOil', 'oil']
];
const records = [], errors = [], quarantined = [];
const limitIndex = process.argv.indexOf('--limit'), limit = limitIndex < 0 ? Infinity : Number(process.argv[limitIndex + 1]);
if (!(limit > 0) || (Number.isFinite(limit) && !Number.isInteger(limit))) throw Error('--limit attend un entier positif.');
for (const url of [...details].sort().slice(0, limit)) {
  try {
    const $ = await page(url), name = norm($('main h1').first().text());
    if (!name) throw Error('Nom absent');
    const date = norm($('main').text()).match(/Last updated:\s*(\d{2})\/(\d{2})\/(\d{4})/);
    const year = date ? Number(date[3]) : null;
    const source = { title: `Fiche variétale ${name}`, author: 'Hopsteiner', year, kind: 'manufacturer', reference: url,
      locator: `${date ? `Mise à jour affichée ${date[1]}/${date[2]}/${date[3]}` : 'Date de mise à jour non publiée'}. Catalogue de variété ; aucune forme commerciale particulière n’est attestée.` };
    const cells = Object.fromEntries($('main dt').toArray().map(dt => [norm($(dt).text()), norm($(dt).next('dd').text())]));
    const analysis = measurements.flatMap(([label, analyte, unit, basis]) => {
      const text = cells[label]; if (!text) return [];
      const interval = text.match(/^(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)$/);
      const point = text.match(/^\d+(?:[.,]\d+)?$/);
      if (!interval && !point) {
        quarantined.push({ url, field: label, reason: `Valeur non convertie : ${text}` });
        return [{ analyte, unit, basis, kind: 'unknown', confidence: 'low', source: { ...source, locator: `${source.locator} Champ : ${label}.` }, note: `Texte publié à vérifier, sans conversion supposée : ${text}.` }];
      }
      const n = x => Number(x.replace(',', '.'));
      if (interval && (n(interval[1]) > n(interval[2]) || (unit.startsWith('percent') && n(interval[2]) > 100))) {
        quarantined.push({ url, field: label, reason: `Plage incohérente conservée en note, non utilisée : ${text}` });
        return [{ analyte, unit, basis, kind: 'unknown', confidence: 'low', source,
          note: `La fiche indique « ${text} » pour ${label}. Plage incohérente, à vérifier auprès du fabricant ; bornes non inversées ni corrigées automatiquement.` }];
      }
      return [{ analyte, unit, basis, ...(interval ? { kind: 'range', range: { min: n(interval[1]), max: n(interval[2]) } } : { kind: 'point', value: n(text) }),
        confidence: 'low', source: { ...source, locator: `${source.locator} Champ : ${label}.` }, note: 'Valeur variétale, pas analyse du lot acheté. Incertitude analytique non fournie ; aucune conversion entre % d’huile et masse de houblon.' }];
    });
    const tags = $('.c-hop-variety-header__tag').toArray().map(a => norm($(a).text())).map(t => tastes[t] ?? t);
    const descriptors = norm($('main h2').filter((_, h) => norm($(h).text()).toLowerCase() === 'aroma description').next('p').text());
    const descriptions = [];
    if (tags.length) descriptions.push({ text: `Familles déclarées sur houblon brut : ${tags.join(', ')}.`, context: 'rawHop', source });
    // Short descriptors only; never reproduce the manufacturer's prose or sensory chart numbers.
    if (descriptors && descriptors.split(/\s+/).length <= 18) descriptions.push({ text: `Descripteurs de la fiche (langue source) : ${descriptors}.`, context: 'rawHop', source });
    if (['low', 'medium', 'high'].includes(cells['Thiol impact'])) descriptions.push({ text: `Classe fabricant « Thiol impact » : ${{ low: 'faible', medium: 'moyenne', high: 'forte' }[cells['Thiol impact']]}. Elle concerne les thiols libres du houblon ; ce n’est ni un rendement de levure ni une intensité prédite en bière.`, context: 'rawHop', source });
    records.push({ id: `hopsteiner-${new URL(url).pathname.split('/').at(-1)}`, name, aliases: [], origin: countries[cells['Main growing country']] ?? cells['Main growing country'] ?? '', form: 'unknown', descriptions, analysis });
  } catch (e) { errors.push({ url, reason: e.message }); }
  if ((records.length + errors.length) % 20 === 0) console.log(`${records.length} fiches extraites…`);
}
if (!records.length) throw Error('Aucune fiche valide ; le catalogue existant est conservé.');
const pack = { hopVarieties: records, hopLots: [], hopKnowledge: [], hopPredictions: [], hopTastings: [] };
const sampled = process.argv.includes('--limit');
if (errors.length && !sampled) {
  await writeFile(resolve(cache, 'errors.json'), JSON.stringify(errors, null, 2));
  console.log(JSON.stringify(errors, null, 2));
  throw Error('Extraction incomplète : le catalogue complet existant est conservé. Consulter errors.json.');
}
await writeFile(sampled ? resolve(cache, 'sample.json') : resolve('src/data/hopManufacturerBootstrap.json'), JSON.stringify(pack, null, 2) + '\n');
await writeFile(resolve(cache, 'manifest.json'), JSON.stringify({ compiledAt: new Date().toISOString(), records: records.length, pages: manifest, quarantined, errors }, null, 2));
console.log(JSON.stringify({ discovered: details.size, extracted: records.length, missingYear: records.filter(r => r.analysis.some(m => m.source.year === null)).length, quarantined, errors }));
