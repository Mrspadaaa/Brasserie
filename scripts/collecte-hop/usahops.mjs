// Voie c3c (#180) : USA Hops / Hop Growers of America (usahops.org), relu depuis le cache avec --offline.
// Deux lots : le « Sensory Finder » (/hop-finder/ : variété × catégories d'arôme) et les avis de sortie USDA-ARS (PDF : Vera, Thora, Triumph).
// Le « Variety Manual » n'est pas publié sur le site (ni dans le plan de site) : rien à collecter de ce côté.
import { fileURLToPath } from 'node:url';
import { champ, decoder, ecrire, ecrireJournal, fiche, lignes, lire, releveDe, robots, textePdf } from './c3c-commun.mjs';

const ORIGINE = 'https://www.usahops.org';
export const SOURCE = { id: 'usahops', nom: 'USA Hops / Hop Growers of America', hote: 'www.usahops.org', type: 'association de producteurs (États-Unis)', conditions: 'robots.txt : tout permis (Disallow vide) ; aucune licence lue ; pages et PDF publics' };

/** Sensory Finder : { categories: {char_4: 'Citrus', …}, varietes: [{ nom, categories: [...] }] }. */
export function lireSensoryFinder(html) {
  const categories = {};
  for (const m of html.matchAll(/data-filter="(char_\d+)"[\s\S]*?<p>([^<]+)<\/p>/g)) categories[m[1]] = decoder(m[2]).trim();
  const varietes = [];
  for (const m of html.matchAll(/<div id="sync-mix-\d+-main" class="mix([^"]*)">\s*([^<]+?)\s*<\/div>/g)) {
    const cats = [...m[1].matchAll(/char_\d+/g)].map(x => categories[x[0]]).filter(Boolean);
    varietes.push({ nom: decoder(m[2]).replace(/[®™]/g, '').trim(), categories: cats });
  }
  return { categories, varietes };
}

const nombre = '(\\d+(?:\\.\\d+)?)';
const unPlus = (texte, re) => { const m = re.exec(texte); return m ? m : null; };

/** Valeurs chiffrées de l'avis USDA-ARS « Vera » (texte du PDF). Essai en parcelle et essai chez le producteur sont distingués. */
export function lireAvisVera(texte) {
  const t = texte.replace(/\s+/g, ' ');
  const champs = {};
  const met = (cle, libelle, m, i, contexte) => { if (!m) return; const c = champ(libelle, m[i]); c.valeur.brut = m[0].slice(0, 120); c.valeur.contexte = contexte; champs[cle] = c.valeur; };
  const parcelle = 'essai en parcelle (Prosser, 2023-2024)', ferme = 'essai chez le producteur (WA, ID, 2022-)';
  const a = unPlus(t, new RegExp(`alpha-acids \\(${nombre} in small plot trials[^)]*?and ${nombre}% on-farm\\)`));
  if (a) { met('alpha', 'Alpha acids (%)', a, 1, parcelle); met('alphaFerme', 'Alpha acids (%)', a, 2, ferme); }
  const b = unPlus(t, new RegExp(`beta acids \\(${nombre}% in small plot trials, and ${nombre}% on-farm\\)`));
  if (b) { met('beta', 'Beta acids (%)', b, 1, parcelle); met('betaFerme', 'Beta acids (%)', b, 2, ferme); }
  const h = unPlus(t, new RegExp(`produced ${nombre} mL/100g oil in small plot trials and ${nombre} mL/100g on-farm`));
  if (h) { met('huileTotale', 'Total oil (mL/100g)', h, 1, parcelle); met('huileTotaleFerme', 'Total oil (mL/100g)', h, 2, ferme); }
  met('cohumulone', 'Co-humulone (% of alpha acids)', unPlus(t, new RegExp(`co-humulone in the alpha acids \\(${nombre}%\\)`)), 1, parcelle);
  met('linalol', 'Linalool (%)', unPlus(t, new RegExp(`linalool \\(${nombre}%\\)`)), 1, parcelle);
  met('farnesene', 'Farnesene (%)', unPlus(t, new RegExp(`farnesene \\(${nombre}%\\)`)), 1, parcelle);
  met('caryophyllene', 'Caryophyllene (%)', unPlus(t, new RegExp(`caryophyllene \\(${nombre}%\\)`)), 1, parcelle);
  met('humulene', 'Humulene (%)', unPlus(t, new RegExp(`Humul+u?ene \\(${nombre}%\\)`)), 1, parcelle);
  met('geraniol', 'Geraniol (%)', unPlus(t, new RegExp(`geraniol \\(${nombre}%\\)`)), 1, parcelle);
  met('myrcene', 'Myrcene (%)', unPlus(t, new RegExp(`myrcene \\(${nombre}%\\)`)), 1, parcelle);
  met('betaPinene', 'b-Pinene (%)', unPlus(t, new RegExp(`b-pinene \\(${nombre}%\\)`)), 1, parcelle);
  const y = unPlus(t, new RegExp(`Yield of USDA-ARS Vera ranged from ${nombre}-${nombre} kg/ha when mature`));
  if (y) { const c = champ('Yield (kg/ha)', `${y[1]}-${y[2]}`); c.valeur.unite = 'kg/ha'; c.valeur.brut = y[0].slice(0, 120); c.valeur.contexte = 'plantes adultes (2+ ans), chez le producteur'; champs.rendement = c.valeur; }
  const alias = [...new Set([...t.matchAll(/\b(HRC ?0?0?3|W1108-333)\b/g)].map(x => x[1]))];
  return { champs, alias, listes: { aromes: /tropical, stone[- ]fruit, and citrus/i.test(t) ? ['tropical', 'stone fruit', 'citrus'] : [] } };
}

/** Avis de presse Thora (texte du PDF) : α moyen et thiols cités. */
export function lireAvisThora(texte) {
  const t = texte.replace(/\s+/g, ' ');
  const champs = {};
  const a = new RegExp(`alpha acids averaging ${nombre}%`).exec(t);
  if (a) { const c = champ('Alpha acids (%)', a[1]); c.valeur.brut = a[0]; c.valeur.contexte = 'moyenne annoncée'; champs.alpha = c.valeur; }
  const thiols = [...new Set([...(/thiols[^.]{0,80}?like ([^.]+?)(?: that|,? meet|\.)/i.exec(t)?.[1] ?? '').matchAll(/\b(4MMP|3S4MP|3MH|3SH)\b/g)].map(x => x[1]))];
  const ancien = /formerly known as (HQG\d+)/i.exec(t)?.[1];
  const alias = ancien ? [ancien] : [];
  return { champs, alias, listes: { thiols, aromes: ['passionfruit', 'guava', 'grapefruit', 'stone fruit'].filter(x => t.includes(x)) } };
}

const AVIS = [
  { nom: 'Vera', page: 'news/usda-ars-releases-of-vera-hop-variety', pdf: 'img/blog_pdf/499.pdf', lire: lireAvisVera },
  { nom: 'Thora', page: 'news/usda-release-of-thora-public-hop-variety', pdf: 'img/blog_pdf/502.pdf', lire: lireAvisThora },
  { nom: 'Triumph', page: 'news/usda-announces-release-of-triumph', pdf: 'img/blog_pdf/193.pdf', lire: () => ({ champs: {}, alias: ['2000009-033'], listes: {} }) },
];
const MOIS = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, (\d{4})\b/;

async function principal() {
  const rb = await robots(ORIGINE);
  const fiches = [];
  if (rb('/hop-finder/')) {
    const r = await lire(`${ORIGINE}/hop-finder/`);
    if (r) {
      const { varietes } = lireSensoryFinder(r.content);
      for (const v of varietes) fiches.push(fiche({ nom: v.nom, url: `${ORIGINE}/hop-finder/`, releve: releveDe(r), listes: { categoriesArome: v.categories }, extra: { page: 'sensory-finder' } }));
    }
  }
  for (const a of AVIS) {
    if (!rb(`/${a.page}`)) continue;
    const page = await lire(`${ORIGINE}/${a.page}`);
    const annee = page ? MOIS.exec(lignes(page.content).join(' '))?.[1] ?? null : null;
    const pdf = rb(`/${a.pdf}`) ? await lire(`${ORIGINE}/${a.pdf}`, { binaire: true }).catch(() => null) : null;
    const texte = pdf ? textePdf(pdf.octets) : '';
    const lu = texte.trim() ? a.lire(texte) : { champs: {}, alias: a.lire('').alias, listes: {} };
    fiches.push(fiche({ nom: a.nom, alias: lu.alias, url: pdf ? `${ORIGINE}/${a.pdf}` : `${ORIGINE}/${a.page}`, releve: releveDe(pdf ?? page ?? { retrievedAt: '' }), publie: annee ? Number(annee) : null, champs: lu.champs, listes: lu.listes, extra: { page: 'avis-usda', texteIllisible: !texte.trim() } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('usahops', [ORIGINE]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
