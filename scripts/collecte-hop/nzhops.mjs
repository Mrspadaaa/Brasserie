// Voie c3c (#180) : fiches NZ Hops (nzhops.co.nz, Nouvelle-Zélande), relues depuis le cache avec --offline.
// Pages produit Shopify : α en plage dans le titre, récoltes, fiche variété PDF (souvent une image : alors illisible, sans OCR).
import { fileURLToPath } from 'node:url';
import { champ, decoder, ecrire, ecrireJournal, fiche, lignes, lire, releveDe, robots, textePdf } from './c3c-commun.mjs';
import { lireFichePdfHpa } from './hpa.mjs';

const ORIGINE = 'https://nzhops.co.nz';
export const SOURCE = { id: 'nzhops', nom: 'NZ Hops Ltd', hote: 'nzhops.co.nz', type: 'producteur (Nouvelle-Zélande)', conditions: 'robots.txt Shopify : /products/ permis ; /cart, /checkout, /account, /admin, filtres de collection interdits ; aucune licence lue' };

/** Page produit : { nom, alpha, accroche, recoltes, fiches PDF } ; null si le titre n'a pas de « (a-b% AA) ». */
export function lireProduitNz(html) {
  const l = lignes(html);
  const i = l.findIndex(x => /^\([^)]*%\s*AA\)$/i.test(x));
  if (i < 1) return null;
  const alpha = champ('Alpha acids (AA)', /\(([^)]*?)\s*AA\)/i.exec(l[i])[1]);
  const accroche = l[i + 1] && l[i + 1].length <= 120 && !/:$/.test(l[i + 1]) ? l[i + 1] : null;
  const c = l.findIndex(x => /^crop year$/i.test(x));
  const recoltes = c < 0 ? [] : l.slice(c + 1, c + 8).filter(x => /^20\d\d$/.test(x));
  const pdfs = [...html.matchAll(/href="(https:\/\/cdn\.shopify\.com\/[^"]*Variety_Sheet_English\.pdf[^"]*)"/gi)].map(x => decoder(x[1]));
  return { nom: l[i - 1].replace(/[®™]/g, '').trim(), alpha: alpha.valeur, accroche, recoltes: [...new Set(recoltes)], pdfs: [...new Set(pdfs)] };
}

async function principal() {
  const rb = await robots(ORIGINE);
  const index = await lire(`${ORIGINE}/sitemap.xml`);
  const sousPlan = decoder([...index.content.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)][0]?.[1] ?? '');
  const plan = sousPlan ? await lire(sousPlan) : null;
  const urls = plan ? [...plan.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => decoder(x[1])).filter(u => /\/products\//.test(u)) : [];
  const fiches = [], hors = [];
  for (const url of urls) {
    if (!rb(new URL(url).pathname)) continue;
    const r = await lire(url); if (!r) continue;
    const p = lireProduitNz(r.content);
    if (!p) { hors.push(url); continue; }
    const champs = { alpha: p.alpha };
    let pdf = null;
    for (const u of p.pdfs.slice(0, 1)) {
      const b = await lire(u, { binaire: true }).catch(e => { if (/arrêté/.test(e.message)) throw e; return null; });
      const t = b ? textePdf(b.octets) : '';
      if (t.trim()) pdf = { url: u, ...lireFichePdfHpa(t), releve: releveDe(b) };
    }
    if (pdf) for (const [k, v] of Object.entries(pdf.champs)) if (!(k in champs)) champs[k] = v;
    fiches.push(fiche({ nom: p.nom, url, releve: releveDe(r), publie: null, champs, listes: { profilCourt: p.accroche ? [p.accroche] : [], recoltes: p.recoltes, fichePdf: p.pdfs, descripteurs: pdf?.descripteurs ?? [] }, extra: { page: 'produit', fichePdfLisible: !!pdf } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('nzhops', [ORIGINE, 'https://cdn.shopify.com']);
  console.log(`Produits sans « % AA » (hors houblon) : ${hors.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
