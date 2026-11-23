// Read public documents as data. No upstream scraper code, AI, private API or database writes.
// Hors ligne : `--offline` lit le cache seul (HOP_SOURCE_CACHE règle son dossier) ; aucun téléchargement, et rien n'est écrit dans ce cache
// (manifeste et licences vont dans le dossier temporaire du système).
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { readHopSource, sourceCache, digest, offlineMode } from './hop-source-cache.mjs';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { load } = require('cheerio');
const norm = v => String(v ?? '').replace(/\s+/g, ' ').trim();
const pack = (rows, extra = {}) => ({ hopVarieties: rows, hopLots: [], hopKnowledge: [], hopPredictions: [], hopTastings: [], ...extra });
const manifest = { fetchedAt: new Date().toISOString(), sources: [], results: {}, excluded: [] };
function measurement(analyte, unit, basis, min, max, source, note, zeroIsMissing = false) {
  const usable = typeof min === 'number' && typeof max === 'number' && Number.isFinite(min) && Number.isFinite(max) && min >= 0 && min <= max && !(zeroIsMissing && min === 0 && max === 0) && (!unit.startsWith('percent') || max <= 100);
  if (!usable) {
    manifest.excluded.push({ reference: source.reference, locator: source.locator, analyte, min, max, reason: 'Bornes absentes, incohérentes ou zéro utilisé comme valeur par défaut dans l’agrégat.' });
    return { analyte, unit, basis, kind: 'unknown', source, confidence: 'low', note: `${note} Bornes brutes non utilisées : ${String(min)} / ${String(max)}.` };
  }
  return { analyte, unit, basis, kind: 'range', range: { min, max }, source, confidence: 'low', note };
}

// ---------- Extraction étendue (d2-import-bm, #180) ----------
// Des valeurs, des noms et des listes : jamais la prose de la page (origine, généalogie, statistiques). Un inconnu reste null ;
// « Unknown » et « 0-0 » sont inconnus, « 0-1 % » est une vraie plage. Les moyennes affichées (« avg ») ne sont pas importées.
const RE_PLAGE = /^(\d+(?:\.\d+)?|\.\d+)\s*(?:-\s*(\d+(?:\.\d+)?|\.\d+))?\s*%$/;
const RE_INDICE = /^(\d*\.?\d+)(?:\s*-\s*(\d*\.?\d+))?$/;
/** Une valeur en pour cent, « 20-25% » ou « 46% ». Rend { min, max, raw }, { inconnu: true } (Unknown, 0-0) ou { illisible: raw }. */
export function lirePourcent(brut) {
  const raw = norm(brut);
  if (!raw || /^unknown$/i.test(raw)) return { inconnu: true, raw };
  const m = raw.match(RE_PLAGE);
  if (!m) return { illisible: raw };
  const min = Number(m[1]), max = m[2] === undefined ? min : Number(m[2]);
  if (!(min <= max) || max > 100) return { illisible: raw };
  if (min === 0 && max === 0) return { inconnu: true, raw };
  return { min, max, raw };
}
const AXES_RADAR = [['Citrus', 'citrus'], ['Tropical Fruit', 'tropicalFruit'], ['Stone Fruit', 'stoneFruit'], ['Berry', 'berry'], ['Floral', 'floral'], ['Grassy', 'grassy'], ['Herbal', 'herbal'], ['Spice', 'spice'], ['Resin / Pine', 'resinPine']];
const PURPOSES = { aroma: 'aroma', bittering: 'bittering', dual: 'dual' };
export const pliage = v => String(v ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const idBM = href => { const m = String(href ?? '').match(/\/hop\/([^/]+)\/?$/); return m ? `beermaverick-${m[1]}` : null; };
const sectionApres = ($, re) => {
  const h = $('h2').toArray().find(x => re.test(norm($(x).text())));
  if (!h) return null;
  const nodes = []; let n = $(h).next();
  while (n.length && n[0].tagName !== 'h2') { nodes.push(n); n = n.next(); }
  return nodes;
};
/** Le dossier d'une page Beer Maverick : tout ce que la page publie en valeurs, noms et listes, relié à sa source.
 * `ids` : les identifiants du catalogue (un nom de houblon relié à son id quand il se résout, sinon gardé avec son nom). */
export function extraireFicheBM($, { url, name, source, updated, retrievedAt, sha256, html }, { ids, parNom }) {
  // Un lien /hop/<slug>/ vers une page du catalogue, sinon le nom écrit tel quel quand il désigne un seul houblon (nom ou code) ; sinon : nom seul.
  const relier = (id, nom) => (id && ids.has(id) ? id : (parNom.get(pliage(nom)) ?? []).length === 1 ? parNom.get(pliage(nom))[0] : null);
  const illisibles = [];
  const ligne = new Map();
  $('table tr').each((_, tr) => {
    const th = $(tr).find('th').first().clone(); const note = norm(th.find('small').text()); th.find('small,script').remove();
    const td = $(tr).find('td').first().clone(); const aPart = norm(td.find('small').text()); td.find('small,div,script').remove();
    const label = norm(th.text()).replace(/^›\s*/, '');
    if (!ligne.has(label)) ligne.set(label, { texte: norm(td.text()), aPart, note });
  });
  const pct = (label, champ) => {
    const c = ligne.get(label); if (!c) return null;
    const v = lirePourcent(c.texte);
    if (v.illisible) { illisibles.push({ champ, brut: v.illisible }); return null; }
    return v.inconnu ? null : { min: v.min, max: v.max, raw: v.raw };
  };
  const brut = label => ligne.get(label)?.texte ?? null;
  const purposeBrut = brut('Purpose:');
  const ratioBrut = brut('Alpha-Beta Ratio');
  const ratio = ratioBrut && /^\d+(?:\.\d+)?:\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?:\d+(?:\.\d+)?)?$/.test(ratioBrut) ? ratioBrut : null;
  if (ratioBrut && !ratio) illisibles.push({ champ: 'alphaBetaRatio', brut: ratioBrut });
  let hsi = null; const h = ligne.get('Hop Storage Index (HSI)');
  if (h) {
    const m = h.texte.match(/^(\d+(?:\.\d+)?)%\s*\((\w+)\)$/), r = h.aPart.match(RE_INDICE);
    if (m && r) hsi = { pct: Number(m[1]), classe: m[2], indice: [Number(r[1]), r[2] === undefined ? Number(r[1]) : Number(r[2])] };
    else illisibles.push({ champ: 'hsi', brut: `${h.texte} ${h.aPart}`.trim() });
  }
  // Styles de bière : les noms en gras du premier paragraphe de la section.
  const sStyles = sectionApres($, /^Beer Styles/);
  const styles = sStyles ? [...new Set(sStyles[0].find('b').toArray().map(b => norm($(b).text()).replace(/^and\s+/i, '')).filter(Boolean))] : null;
  // Substituts choisis par des brasseurs (liste), reliés à l'id du catalogue ; « aucun » est une liste vide, une section absente est null.
  const sSubs = sectionApres($, /Substitutions$/);
  let substituts = null;
  if (sSubs) {
    const ul = sSubs.find(n => n[0].tagName === 'ul');
    if (ul) substituts = ul.find('li').toArray().map(li => { const a = $(li).find('a').first(); const nom = norm($(li).text()); const id = idBM(a.attr('href')); return { id: relier(id, nom), name: nom }; }).filter(s => s.name);
    // Un houblon ne se remplace pas lui-même (la page de Zeus se cite) : écarté de la liste, et dit.
    const moi = `beermaverick-${new URL(url).pathname.split('/')[2]}`;
    if (substituts?.some(x => x.id === moi)) { illisibles.push({ champ: 'substituts', brut: `${name} (lui-même)` }); substituts = substituts.filter(x => x.id !== moi); }
    else if (sSubs.some(n => /There are no manually picked substitutions/i.test(n.text()))) substituts = [];
  }
  // Accords (Hop Pairings) : la fréquence relative publiée dans le graphique, reliée aux liens du paragraphe.
  const sPair = sectionApres($, /^Hop Pairings/);
  let accords = null;
  if (sPair) {
    const liens = new Map(sPair[0].find('a').toArray().map(a => [norm($(a).text()).toLowerCase(), idBM($(a).attr('href'))]));
    const bloc = html.split('id="commonChart"')[1]?.split('</script>')[0] ?? '';
    const m = bloc.match(/labels:\s*\[([^\]]*)\][\s\S]*?data:\s*\[([^\]]*)\]/);
    if (m) {
      const noms = [...m[1].matchAll(/'([^']*)'/g)].map(x => norm(x[1])), nb = m[2].split(',').map(x => x.trim()).filter(Boolean).map(Number);
      if (noms.length && noms.length === nb.length && nb.every(x => Number.isInteger(x) && x > 0)) {
        accords = noms.map((nom, i) => { const id = liens.get(nom.toLowerCase()) ?? null; return { id: relier(id, nom), name: nom, count: nb[i] }; });
      } else illisibles.push({ champ: 'accords', brut: bloc.slice(0, 120) });
    } else illisibles.push({ champ: 'accords', brut: 'graphique absent' });
  }
  // Profil d'arôme : radar à 9 axes, de 0 à 5. « All zero values mean there are no aroma values » : une liste vide ou tout à zéro
  // est null (jamais un profil plat de zéros). Une liste incomplète ou hors 0–5 est illisible, donc null aussi.
  let aroma = null;
  const r = html.match(/labels:\s*\[('Citrus'[^\]]*)\],\s*datasets:\s*\[\{\s*data:\s*\[([^\]]*)\]/);
  if (r) {
    const noms = [...r[1].matchAll(/'([^']*)'/g)].map(x => x[1]), vals = r[2].split(',').map(x => x.trim()).filter(Boolean);
    const bons = noms.join('|') === AXES_RADAR.map(a => a[0]).join('|') && vals.length === 9 && vals.every(x => /^[0-5]$/.test(x));
    if (vals.length === 0) aroma = null;
    else if (!bons) illisibles.push({ champ: 'aroma', brut: r[2] });
    else if (vals.some(x => Number(x) > 0)) aroma = Object.fromEntries(AXES_RADAR.map(([, cle], i) => [cle, Number(vals[i])]));
  }
  return {
    id: `beermaverick-${new URL(url).pathname.split('/')[2]}`, name, source, modifiedAt: updated ?? null, retrievedAt, sha256,
    purpose: PURPOSES[(purposeBrut ?? '').toLowerCase()] ?? null, ownership: brut('Ownership:') || null,
    cohumulone: pct('Co-Humulone as % of Alpha', 'cohumulone'), alphaBetaRatio: ratio,
    farnesene: pct('Farnesene', 'farnesene'), others: pct('All Others', 'others'),
    hsi, styles, substituts, accords, aroma, ...(illisibles.length ? { illisibles } : {}),
  };
}

export async function main() {
  const fetchData = async url => { const { content, ...receipt } = await readHopSource(url); manifest.sources.push(receipt); return { content, receipt }; };
  const lim = process.argv.indexOf('--limit'), limit = lim < 0 ? Infinity : Number(process.argv[lim + 1]);
  const onlyAt = process.argv.indexOf('--only'), only = onlyAt < 0 ? 'all' : process.argv[onlyAt + 1];
  if (!(limit > 0) || !['all', 'git', 'beer'].includes(only)) throw Error('Arguments : --only git|beer ; --limit entier positif.');
  // Hors ligne, le cache est en lecture seule : les fichiers de travail vont dans le dossier temporaire.
  const sortie = offlineMode() ? resolve(tmpdir(), 'affinee-hop-scrape') : sourceCache;
  await mkdir(sortie, { recursive: true });
  const ecrire = async (name, contenu, nombre) => {
    // A sampling run must never replace a complete checked catalogue.
    const target = Number.isFinite(limit) ? resolve(sortie, `${name}-sample.json`) : resolve('src/data', name);
    await writeFile(target, JSON.stringify(contenu, null, 2) + '\n');
    manifest.results[name] = { records: nombre, file: target };
  };
  // Un pack est installé tel quel par l'app (une collection par clé, validée par backupCore) : il ne porte que ses collections.
  const save = (name, rows) => ecrire(name, pack(rows), rows.length);
  if (only === 'all' || only === 'git') {
    const repos = [
      { owner: 'kasperg3/HopDatabase', revision: 'cf9aad4b59fe7c30441550ef703e095f8b1116ab', file: 'website/public/data/hops.json', output: 'hopDatabaseBootstrap.json', prefix: 'hopdb' },
      { owner: 'stuartraetaylor/hops-json', revision: '655499ffda7166abff83f52f8012390ffc1107f7', file: 'hops.json', output: 'hopLegacyBootstrap.json', prefix: 'hopsjson' }
    ];
    for (const repo of repos) {
      const reference = `https://github.com/${repo.owner}/blob/${repo.revision}/${repo.file}`;
      const rows = JSON.parse(await fetchData(`https://raw.githubusercontent.com/${repo.owner}/${repo.revision}/${repo.file}`));
      const license = await fetchData(`https://raw.githubusercontent.com/${repo.owner}/${repo.revision}/LICENSE`);
      await writeFile(resolve(sortie, `${repo.prefix}-LICENSE.txt`), license);
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
    const index = 'https://beermaverick.com/hops/', $index = load((await fetchData(index)).content);
    const urls = [...new Set($index('a[href]').toArray().map(a => new URL($index(a).attr('href'), index)).filter(u => u.origin === new URL(index).origin && /^\/hop\/[^/]+\/$/.test(u.pathname)).map(u => u.href))].sort();
    const queue = urls.slice(0, limit), records = [], pages = [], errors = [];
    async function worker() {
      while (queue.length) {
        const url = queue.shift();
        try {
          const { content: html, receipt } = await fetchData(url);
          const $ = load(html), name = norm($('h1').first().text()).replace(/\s+Hop$/, '');
          if (!name) throw Error('Nom absent');
          const updated = $('meta[property="article:modified_time"]').attr('content');
          const source = { title: `Beer Maverick · ${name}`, author: 'Beer Maverick', year: /^\d{4}-\d{2}-\d{2}T/.test(updated ?? '') ? Number(updated.slice(0, 4)) : null,
            kind: 'community', reference: url, locator: `${updated ? `Dernière modification publiée : ${updated}.` : 'Date non publiée.'} Agrégat de plages historiques de fournisseurs ; ni récolte précise ni analyse de lot.` };
          const cells = $('table tr').toArray().map(tr => {
            const label = $(tr).find('th').first().clone(); label.find('small,script').remove();
            const value = $(tr).find('td').first().clone(); value.find('small,div,script').remove();
            return [norm(label.text()).replace(/^›\s*/, ''), norm(value.text())];
          });
          const mapping = [[/^Alpha Acid/, 'alpha', 'percentMass', 'unknown'], [/^Beta Acid/, 'beta', 'percentMass', 'unknown'], [/^Total Oils \(mL\/100g\)/, 'totalOil', 'ml100g', 'unknown'], [/^Myrcene$/, 'myrcene', 'percentOil', 'oil'], [/^Humulene$/, 'humulene', 'percentOil', 'oil'], [/^Caryophyllene$/, 'caryophyllene', 'percentOil', 'oil']];
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
          pages.push({ url, name, source, updated, retrievedAt: receipt.retrievedAt, sha256: receipt.sha256, html });
        } catch (e) { errors.push({ url, reason: e.message }); }
        if ((records.length + errors.length) % 25 === 0) console.log(`Beer Maverick : ${records.length} fiches extraites…`);
      }
    }
    // Three bounded public reads at a time, with no retry against an access denial.
    await Promise.all([worker(), worker(), worker()]);
    if (!records.length) throw Error('Aucune fiche Beer Maverick accessible.');
    if (errors.length && !Number.isFinite(limit)) {
      await writeFile(resolve(sortie, 'community-errors.json'), JSON.stringify(errors, null, 2));
      throw Error('Extraction incomplète : le catalogue complet existant est conservé. Consulter community-errors.json.');
    }
    // Dossier étendu de chaque page, lu dans la même page en cache : valeurs citées, listes reliées aux ids du catalogue.
    const ids = new Set(records.map(r => r.id)), parNom = new Map();
    for (const r of records) for (const n of [r.name, ...r.aliases]) { const k = pliage(n); if (k && !(parNom.get(k) ?? []).includes(r.id)) parNom.set(k, [...(parNom.get(k) ?? []), r.id]); }
    const fiches = pages.map(p => extraireFicheBM(load(p.html), p, { ids, parNom })).sort((a, b) => a.id.localeCompare(b.id));
    for (const f of fiches) for (const i of f.illisibles ?? []) manifest.excluded.push({ reference: f.source.reference, field: i.champ, raw: i.brut, reason: 'Valeur Beer Maverick non lisible : laissée inconnue.' });
    await save('hopBeerMaverickBootstrap.json', records.sort((a, b) => a.id.localeCompare(b.id)));
    // Les dossiers étendus ne sont pas un pack : fichier à part, jamais envoyé à l'installation (r180).
    await ecrire('hopBeerMaverickFiches.json', fiches, fiches.length);
    manifest.results.beerMaverick = { discovered: urls.length, extracted: records.length, errors };
  }
  await writeFile(resolve(sortie, 'community-manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest.results, null, 2));
}
// Lancé en ligne de commande ; importé (tests), le module ne fait rien.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
