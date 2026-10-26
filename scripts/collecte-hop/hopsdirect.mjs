// Voie c3c (#180) : fiches Hops Direct (hopsdirect.com, ferme de Yakima), relues depuis le cache avec --offline.
// Pages produit Shopify de houblons en cônes (leaf) ou en granulés : α du lot, année de récolte, styles, substituts.
import { fileURLToPath } from 'node:url';
import { champ, decoder, ecrire, ecrireJournal, fiche, lignes, lire, listeDe, releveDe, robots } from './c3c-commun.mjs';

const ORIGINE = 'https://hopsdirect.com';
export const SOURCE = { id: 'hopsdirect', nom: 'Hops Direct', hote: 'hopsdirect.com', type: 'ferme et revendeur (États-Unis)', conditions: 'robots.txt Shopify : /products/ permis ; /cart, /checkout, /account, /admin interdits ; aucune licence lue' };

/** Page produit : { nom, forme, recolte, alpha, styles, substituts, accroche } ; null si pas d'α publié. */
export function lireProduitHopsDirect(html) {
  const l = lignes(html);
  const iTitre = l.findIndex(x => /^.+ - \d{4} (leaf|pellets?|t-?90 pellets?)$/i.test(x));
  const iAlpha = l.findIndex(x => /^alpha acid:/i.test(x));
  if (iTitre < 0 || iAlpha < 0) return null;
  const m = /^(.+?) - (\d{4}) (.+)$/i.exec(l[iTitre]);
  // Les noms de houblon sont des liens : le texte s'étale sur plusieurs lignes, jusqu'au prochain titre.
  const apres = re => { const i = l.findIndex(x => re.test(x)); if (i < 0) return null; const fin = l.findIndex((x, k) => k > i && /^(domestic|share|typical|possible|shop|regular price)/i.test(x)); return l.slice(i + 1, fin < 0 ? i + 4 : fin).join(' ').replace(/\s+,/g, ',').trim() || null; };
  const accroche = l[iAlpha + 1] && l[iAlpha + 1].length <= 120 ? l[iAlpha + 1] : null;
  const styles = apres(/^typical brewing style$/i), substituts = apres(/^possible substitution$/i);
  const casse = m[1].toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
  return {
    nom: casse.replace(/[®™]/g, '').replace(/\s+/g, ' ').trim(), forme: m[3], recolte: Number(m[2]), alpha: champ('Alpha Acid', l[iAlpha].replace(/^alpha acid:\s*/i, '')).valeur,
    styles: styles ? listeDe(styles.replace(/\band\b/gi, ',')) : [], substituts: substituts ? listeDe(substituts.replace(/\s*\.\s+(Farm|Grown).*$/i, '').replace(/\bor\b/gi, ',')).map(x => x.replace(/[®™]/g, '').trim()).filter(x => x.length >= 3 && !/farm|grown|crop/i.test(x)) : [], accroche,
  };
}

async function principal() {
  const rb = await robots(ORIGINE);
  const index = await lire(`${ORIGINE}/sitemap.xml`);
  const sousPlan = decoder([...index.content.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)][0]?.[1] ?? '');
  const plan = sousPlan ? await lire(sousPlan) : null;
  const urls = plan ? [...plan.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decoder(x[1])).filter(u => /\/products\/[^/]*(leaf|pellet)/i.test(u)) : [];
  const fiches = [], hors = [];
  for (const url of urls) {
    if (!rb(new URL(url).pathname)) continue;
    const r = await lire(url); if (!r) continue;
    const p = lireProduitHopsDirect(r.content);
    if (!p) { hors.push(url); continue; }
    fiches.push(fiche({ nom: p.nom, url, releve: releveDe(r), publie: p.recolte, champs: { alpha: { ...p.alpha, contexte: `lot ${p.recolte}` } }, listes: { styles: p.styles, substituts: p.substituts, forme: [p.forme], profilCourt: p.accroche ? [p.accroche] : [] }, extra: { page: 'produit' } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('hopsdirect', [ORIGINE]);
  console.log(`Candidats ${urls.length} ; sans α publié : ${hors.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
