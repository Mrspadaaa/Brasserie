// Read public documents as data. No upstream scraper code, AI, private API or database writes.
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { readHopSource, sourceCache, digest } from './hop-source-cache.mjs';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { load } = require('cheerio');
const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const pack = rows => ({ hopVarieties: rows, hopLots: [], hopKnowledge: [], hopPredictions: [], hopTastings: [] });
const manifest = { fetchedAt: new Date().toISOString(), sources: [], results: {}, excluded: [] };
const fetchData = async url => { const r = await readHopSource(url); const { content, ...receipt } = r; manifest.sources.push(receipt); return content; };
const lim = process.argv.indexOf('--limit'), limit = lim < 0 ? Infinity : Number(process.argv[lim + 1]);
const onlyAt = process.argv.indexOf('--only'), only = onlyAt < 0 ? 'all' : process.argv[onlyAt + 1];
if (!(limit > 0) || !['all', 'git', 'beer'].includes(only)) throw Error('Arguments : --only git|beer ; --limit entier positif.');
const save = async (name, rows) => {
  // A sampling run must never replace a complete checked catalogue.
  const target = Number.isFinite(limit) ? resolve(sourceCache, `${name}-sample.json`) : resolve('src/data', name);
  await writeFile(target, JSON.stringify(pack(rows), null, 2) + '\n');
  manifest.results[name] = { records: rows.length, file: target };
};
function measurement(analyte, unit, basis, min, max, source, note, zeroIsMissing = false) {
  const usable = typeof min === 'number' && typeof max === 'number' && Number.isFinite(min) && Number.isFinite(max) && min >= 0 && min <= max && !(zeroIsMissing && min === 0 && max === 0) && (!unit.startsWith('percent') || max <= 100);
  if (!usable) {
    manifest.excluded.push({ reference: source.reference, locator: source.locator, analyte, min, max, reason: 'Bornes absentes, incohérentes ou zéro utilisé comme valeur par défaut dans l’agrégat.' });
    return { analyte, unit, basis, kind: 'unknown', source, confidence: 'low', note: `${note} Bornes brutes non utilisées : ${String(min)} / ${String(max)}.` };
  }
  return { analyte, unit, basis, kind: 'range', range: { min, max }, source, confidence: 'low', note };
}
if (only === 'all' || only === 'git') {
  const repos = [
    { owner: 'kasperg3/HopDatabase', revision: 'cf9aad4b59fe7c30441550ef703e095f8b1116ab', file: 'website/public/data/hops.json', output: 'hopDatabaseBootstrap.json', prefix: 'hopdb' },
    { owner: 'stuartraetaylor/hops-json', revision: '655499ffda7166abff83f52f8012390ffc1107f7', file: 'hops.json', output: 'hopLegacyBootstrap.json', prefix: 'hopsjson' }
  ];
  for (const repo of repos) {
    const reference = `https://github.com/${repo.owner}/blob/${repo.revision}/${repo.file}`;
    const rows = JSON.parse(await fetchData(`https://raw.githubusercontent.com/${repo.owner}/${repo.revision}/${repo.file}`));
    const license = await fetchData(`https://raw.githubusercontent.com/${repo.owner}/${repo.revision}/LICENSE`);
    await writeFile(resolve(sourceCache, `${repo.prefix}-LICENSE.txt`), license);
    if (!Array.isArray(rows)) throw Error(`Format inattendu : ${repo.owner}`);
    const normalized = rows.slice(0, limit).map((r, i) => {
      const name = norm(r.name ?? r.Name); if (!name) throw Error(`Nom absent : ${repo.owner}, ligne ${i}`);
      const source = { title: `Référentiel ${repo.owner} · ${name}`, author: repo.owner, year: null, kind: 'community', reference,
        locator: `Révision ${repo.revision} ; entrée ${repo.prefix === 'hopdb' ? name : r.Id}. ${r.source ? `Agrégation déclarée : ${r.source}.` : 'Données issues de BrewDB selon le README.'} ${r.href ? `Lien fabricant indiqué par l’agrégat, non revérifié ici : ${r.href}` : ''}` };
      const note = 'Plage d’un agrégat communautaire, sans millésime ni protocole analytique. Année et unité non attestées dans ce fichier : aucune unité déduite de l’ordre de grandeur. Ce n’est pas un COA.';
      const fields = repo.prefix === 'hopdb' ? [['alpha', r.alpha_from, r.alpha_to], ['beta', r.beta_from, r.beta_to], ['totalOil', r.oil_from, r.oil_to]]
        : [['alpha', r.AlphaMin, r.AlphaMax], ['beta', r.BetaMin, r.BetaMax], ['totalOil', r.TotalOilMin, r.TotalOilMax]];
      const text = repo.prefix === 'hopdb' ? (Array.isArray(r.notes) ? r.notes.filter(v => typeof v === 'string').slice(0, 10).join(', ') : '') : norm(r.Aroma);
      const descriptions = [{ text: 'Référentiel communautaire. Les plages et descripteurs restent distincts des fiches fabricant, sans fusion ni moyenne entre sources.', context: 'unspecified', source }];
      if (text && text.split(/\s+/).length <= 22) descriptions.push({ text: `Descripteurs documentaires (langue source) : ${text}`, context: 'unspecified', source });
      return { id: `${repo.prefix}-${digest(`${name}:${r.Id ?? ''}`).slice(0, 18)}`, name, aliases: [], ...(r.country ? { origin: norm(r.country) } : {}), form: 'unknown', descriptions,
        analysis: fields.map(([analyte, min, max]) => measurement(analyte, 'unknown', 'unknown', min, max, source, note, true)) };
    });
    await save(repo.output, normalized); console.log(`${repo.owner} : ${normalized.length} fiches documentaires.`);
  }
}
if (only === 'all' || only === 'beer') {
  const index = 'https://beermaverick.com/hops/', $index = load(await fetchData(index));
  const urls = [...new Set($index('a[href]').toArray().map(a => new URL($index(a).attr('href'), index)).filter(u => u.origin === new URL(index).origin && /^\/hop\/[^/]+\/$/.test(u.pathname)).map(u => u.href))].sort();
  const queue = urls.slice(0, limit), records = [], errors = [];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      try {
        const $ = load(await fetchData(url)), name = norm($('h1').first().text()).replace(/\s+Hop$/, '');
        if (!name) throw Error('Nom absent');
        const updated = $('meta[property="article:modified_time"]').attr('content');
        const source = { title: `Beer Maverick · ${name}`, author: 'Beer Maverick', year: /^\d{4}-\d{2}-\d{2}T/.test(updated ?? '') ? Number(updated.slice(0, 4)) : null,
          kind: 'community', reference: url, locator: `${updated ? `Dernière modification publiée : ${updated}.` : 'Date non publiée.'} Agrégat de plages historiques de fournisseurs ; ni récolte précise ni analyse de lot.` };
        const cells = $('table tr').toArray().map(tr => {
          const label = $(tr).find('th').first().clone(); label.find('small,script').remove();
          const value = $(tr).find('td').first().clone(); value.find('small,div,script').remove();
          return [norm(label.text()).replace(/^›\s*/, ''), norm(value.text())];
        });
        const mapping = [[/^Alpha Acid/, 'alpha', 'percentMass', 'asIs'], [/^Beta Acid/, 'beta', 'percentMass', 'asIs'], [/^Total Oils \(mL\/100g\)/, 'totalOil', 'ml100g', 'asIs'], [/^Myrcene$/, 'myrcene', 'percentOil', 'oil'], [/^Humulene$/, 'humulene', 'percentOil', 'oil'], [/^Caryophyllene$/, 'caryophyllene', 'percentOil', 'oil']];
        const analysis = mapping.flatMap(([pattern, analyte, unit, basis]) => {
          const cell = cells.find(([label]) => pattern.test(label)); if (!cell) return [];
          const raw = cell[1], match = raw.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:%|mL)?$/i);
          const note = `Référence historique agrégée par Beer Maverick, non spécifique à une récolte. Champ : ${cell[0]}. Les moyennes affichées et scores de substitution ne sont pas importés.`;
          if (!match) {
            const point = raw.match(/^(\d+(?:\.\d+)?)\s*(?:%|mL)?$/i);
            if (point && Number.isFinite(Number(point[1])) && (!unit.startsWith('percent') || Number(point[1]) <= 100)) return [{ analyte, unit, basis, kind: 'point', value: Number(point[1]), source, confidence: 'low', note: `${note} Valeur ponctuelle publiée sans marge ; aucune plage ajoutée.` }];
            manifest.excluded.push({ reference: url, field: cell[0], raw, reason: 'Valeur non transcrite en intervalle.' });
            return [{ analyte, unit, basis, kind: 'unknown', source, confidence: 'low', note: `${note} Texte brut à vérifier : ${raw}.` }];
          }
          return [measurement(analyte, unit, basis, Number(match[1]), Number(match[2]), source, note)];
        });
        const tags = [...new Set($('a[href]').toArray().map(a => norm($(a).text())).filter(t => /^#[\w-]+$/.test(t)))].slice(0, 12);
        const descriptions = [{ text: 'Plages historiques agrégées : la source indique élargir certaines bornes lorsque des fournisseurs se contredisent. Aucune moyenne avec les autres références de l’index.', context: 'unspecified', source }];
        if (tags.length) descriptions.push({ text: `Tags documentaires : ${tags.join(', ')}.`, context: 'unspecified', source });
        const country = cells.find(([label]) => label === 'Country:')?.[1];
        const aliases = cells.filter(([label]) => ['International Code:', 'Cultivar/Brand ID:'].includes(label)).map(([, value]) => value).filter(Boolean);
        records.push({ id: `beermaverick-${new URL(url).pathname.split('/')[2]}`, name, aliases, ...(country ? { origin: country } : {}), form: 'unknown', descriptions, analysis });
      } catch (e) { errors.push({ url, reason: e.message }); }
      if ((records.length + errors.length) % 25 === 0) console.log(`Beer Maverick : ${records.length} fiches extraites…`);
    }
  }
  // Three bounded public reads at a time, with no retry against an access denial.
  await Promise.all([worker(), worker(), worker()]);
  if (!records.length) throw Error('Aucune fiche Beer Maverick accessible.');
  if (errors.length && !Number.isFinite(limit)) {
    await writeFile(resolve(sourceCache, 'community-errors.json'), JSON.stringify(errors, null, 2));
    throw Error('Extraction incomplète : le catalogue complet existant est conservé. Consulter community-errors.json.');
  }
  await save('hopBeerMaverickBootstrap.json', records.sort((a, b) => a.id.localeCompare(b.id)));
  manifest.results.beerMaverick = { discovered: urls.length, extracted: records.length, errors };
}
await writeFile(resolve(sourceCache, 'community-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest.results, null, 2));
