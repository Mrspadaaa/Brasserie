// Voie c3c (#180) : fiches Crosby Hops (crosbyhops.com), relues depuis le cache avec --offline.
// Deux sortes de pages : /hops/varieties/<x> (valeurs de brassage, styles, accords) et /products/<code> (arômes, cohumulone, conservation).
import { fileURLToPath } from 'node:url';
import { champsDepuisLignes, decoder, ecrire, ecrireJournal, fiche, lignes, lire, listeDe, releveDe, robots } from './c3c-commun.mjs';

const ORIGINE = 'https://www.crosbyhops.com';
export const SOURCE = { id: 'crosbyhops', nom: 'Crosby Hops', hote: 'www.crosbyhops.com', type: 'producteur (États-Unis)', conditions: 'robots.txt : tout permis sauf /email/, /confirmation/, /gated-downloads/, /blog/*, /hs/* ; aucune licence lue ; pages publiques' };

const titre = html => {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
  const t = h1 ?? /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '';
  return lignes(`<p>${t}</p>`)[0]?.replace(/\s*[|–-]\s*Crosby.*$/i, '').replace(/[®™]/g, '').trim() ?? '';
};
/** Entre deux intitulés d'une suite de lignes. */
const entre = (l, debut, fins) => {
  const i = l.findIndex(x => debut.test(x)); if (i < 0) return [];
  const j = l.findIndex((x, k) => k > i && fins.some(f => f.test(x)));
  return l.slice(i + 1, j < 0 ? undefined : j);
};

/** /hops/varieties/<x> */
export function lireVarieteCrosby(html) {
  const l = lignes(html);
  if (!l.some(x => /^brewing values$/i.test(x))) return null;
  const valeurs = entre(l, /^brewing values$/i, [/^sensory analysis$/i, /^just brew it/i]);
  const champs = champsDepuisLignes(valeurs);
  const ligneStyles = l.find(x => /^beer styles\b/i.test(x));
  const accords = entre(l, /^pairings$/i, [/^brewing values$/i])[0];
  const profil = entre(l, /^profile$/i, [/^beer styles/i, /^pairings$/i])[0];
  return {
    nom: titre(html), champs,
    listes: {
      formats: entre(l, /^available formats$/i, [/^characteristics$/i]).flatMap(x => listeDe(x.replace(/[®™]/g, ''))),
      caracteres: entre(l, /^characteristics$/i, [/^profile$/i]).slice(0, 8),
      profilCourt: profil && profil.length <= 120 ? [profil] : [],
      styles: ligneStyles ? listeDe(ligneStyles.replace(/^beer styles\s*/i, '')) : [],
      accords: accords ? listeDe(accords) : [],
    },
  };
}

/** /products/<code> */
export function lireProduitCrosby(html) {
  const l = lignes(html);
  if (!l.some(x => /^aroma profile$/i.test(x)) && !l.some(x => /^alpha$/i.test(x))) return null;
  const champs = champsDepuisLignes(l);
  const aromes = entre(l, /^aroma profile$/i, [/^alpha$/i, /^beta$/i])[0];
  return { nom: titre(html), champs, listes: { aromes: aromes ? listeDe(aromes) : [] } };
}

async function principal() {
  const rb = await robots(ORIGINE);
  const plan = await lire(`${ORIGINE}/sitemap.xml`);
  const urls = [...plan.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decoder(x[1]));
  const cibles = urls.filter(u => /\/hops\/varieties\/[^/]+$/.test(u) || /\/products\/[^/]+$/.test(u));
  const fiches = [], sansDonnees = [];
  for (const url of cibles) {
    if (!rb(new URL(url).pathname)) continue;
    const r = await lire(url); if (!r) continue;
    const variete = /\/hops\/varieties\//.test(url);
    const p = variete ? lireVarieteCrosby(r.content) : lireProduitCrosby(r.content);
    if (!p || !p.nom) { sansDonnees.push(url); continue; }
    fiches.push(fiche({ nom: p.nom, url, releve: releveDe(r), publie: null, champs: p.champs, listes: p.listes, extra: { page: variete ? 'variete' : 'produit', code: variete ? null : url.split('/').pop() } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('crosbyhops', [ORIGINE]);
  console.log(`Pages sans données chiffrées (${sansDonnees.length}) : ${sansDonnees.slice(0, 5).join(' ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
