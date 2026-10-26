// Voie c3c (#180) : fiches houblons de BSG / RahrBSG (rahrbsg.com, ex bsgcraftbrewing.com), relues depuis le cache avec --offline.
// Les pages sont des produits VTEX : les spécifications (α, β, cohumulone, huile, catégories d'arôme) sont dans l'état JSON de la page.
import { fileURLToPath } from 'node:url';
import { champ, decoder, ecrire, ecrireJournal, fiche, lignes, lire, listeDe, releveDe, robots } from './c3c-commun.mjs';

const ORIGINE = 'https://www.rahrbsg.com';
export const SOURCE = { id: 'bsg', nom: 'BSG / RahrBSG Hops', hote: 'www.rahrbsg.com', type: 'distributeur (États-Unis)', conditions: 'robots.txt : Disallow /img/, /account/, /login/, /checkout/, /busca/, /quick-view/, /espiar/, /assets/, /arquivos/ ; aucune licence lue ; pages produits publiques' };

/** Spécifications d'une page produit VTEX : { nom: [valeurs] } (première occurrence de chaque nom). */
export function lireSpecs(html) {
  const specs = {};
  const re = /"name":"([^"]+)","originalName":"[^"]*","values":\{"type":"json","json":\[((?:"(?:[^"\\]|\\.)*"(?:,)?)*)\]/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1] in specs) continue;
    let valeurs; try { valeurs = JSON.parse(`[${m[2]}]`); } catch { continue; }
    specs[m[1]] = valeurs.map(String);
  }
  return specs;
}

/** Fiche d'un produit BSG de houblon (null si ce n'est pas un houblon avec α publié). */
export function lireProduitBsg(html) {
  const s = lireSpecs(html);
  if (!/^HOP$/i.test(s['Product Family']?.[0] ?? '') || !s['Alpha Acid']) return null;
  const champs = {};
  const prend = (nomSpec, libelle = nomSpec) => { const v = s[nomSpec]?.[0]; if (v == null) return; const c = champ(libelle, v); if (!(c.cle in champs)) champs[c.cle] = c.valeur; };
  prend('Alpha Acid'); prend('Beta Acid Range', 'Beta Acid'); prend('Co-Humulone as % of Alpha', 'Cohumulone (% of alpha acids)'); prend('Total Oil', 'Total Oil (mL/100g)');
  const apercu = s['Overview Description']?.[0] ? lignes(decoder(s['Overview Description'][0]).replace(/\\u003C/g, '<')) : [];
  const apres = re => apercu.map(x => re.exec(x)?.[1]).find(Boolean);
  const maturite = apres(/^Maturity:\s*(.+)$/i), rendement = apres(/^Yield:\s*(.+)$/i);
  if (maturite) champs.maturite = { champ: 'Maturity', brut: maturite, valeur: null, min: null, max: null, unite: null, base: null };
  if (rendement) { const c = champ('Yield', rendement); c.valeur.unite = /lbs?\s*\/\s*acre/i.test(rendement) ? 'lb/acre' : /kg\s*\/\s*ha/i.test(rendement) ? 'kg/ha' : null; champs.rendement = c.valeur; }
  const forme = /\b(T-?90|Enriched|Cryo|Whole|Leaf|Pellets?)\b/i.exec(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '')?.[1] ?? null;
  return {
    nom: s['Hop Variety']?.[0] ?? '', champs,
    listes: {
      categoriesArome: s['Hop Aroma Category'] ?? [], aromes: s['Hop Aroma Specification'] ? listeDe(s['Hop Aroma Specification'][0]) : [],
      origine: s['Country Of Origin'] ?? [], forme: forme ? [forme] : [], fournisseur: s['Supplier'] ?? [],
      fichePdf: [...(s['Technical Document']?.[0] ?? '').matchAll(/https:[^"\\]+\.pdf/g)].map(x => x[0].replace(/\\u002F/g, '/')),
    },
  };
}

async function principal() {
  const rb = await robots(ORIGINE);
  const index = await lire(`${ORIGINE}/sitemap.xml`);
  const sousPlans = [...index.content.matchAll(/<loc>([^<]*product[^<]*)<\/loc>/g)].map(x => x[1]);
  const urls = [];
  for (const sp of sousPlans) { const r = await lire(sp); if (r) urls.push(...[...r.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1])); }
  const cibles = urls.filter(u => /(pellets?|t-90|leaf|whole-cone|cryo|lupulin)/i.test(u) && !/(bag|oil|hopburst|hopzero|hopplus|hopsensation|extract|vacuum|dispenser)/i.test(u));
  const fiches = [], ignores = [];
  for (const url of cibles) {
    if (!rb(new URL(url).pathname)) continue;
    const r = await lire(url); if (!r) continue;
    const p = lireProduitBsg(r.content);
    if (!p || !p.nom) { ignores.push(url); continue; }
    fiches.push(fiche({ nom: p.nom, alias: [], url, releve: releveDe(r), publie: null, champs: p.champs, listes: p.listes, extra: { page: 'produit' } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('bsg', [ORIGINE]);
  console.log(`Candidats ${cibles.length} ; sans α ou hors houblon : ${ignores.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
