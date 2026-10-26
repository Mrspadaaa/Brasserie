// Voie c3c (#180) : fiches NZ Hops (nzhops.co.nz, Nouvelle-Zélande), relues depuis le cache avec --offline.
// Pages produit Shopify : α en plage dans le titre, récoltes, fiche variété PDF (souvent une image : alors illisible, sans OCR).
// Voie c3e : les fiches PDF (images) sont transcrites par lecture visuelle dans transcriptions-nzhops.json (versionné, dans la voie) ;
// ce script les relit et ajoute une fiche `page: 'fiche-pdf'` par PDF, sans toucher aux fiches HTML.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseImplicite, cleChamp, decoder, ecrire, ecrireJournal, fiche, lignes, lire, lireValeur, racine, releveDe, robots, textePdf, champ } from './c3c-commun.mjs';
import { lireFichePdfHpa } from './hpa.mjs';

const ORIGINE = 'https://nzhops.co.nz';
export const TRANSCRIPTIONS = resolve(racine, 'work/missions/2026-10-25-integration-houblons/voies/c3e-pdf-images/transcriptions-nzhops.json');
export const SOURCE = { id: 'nzhops', nom: 'NZ Hops Ltd', hote: 'nzhops.co.nz', type: 'producteur (Nouvelle-Zélande)', conditions: 'robots.txt Shopify : /products/ permis ; /cart, /checkout, /account, /admin, filtres de collection interdits ; aucune licence lue ; fiches PDF (images) lues sur cdn.shopify.com (robots.txt : tout permis sauf deux scripts)', lecturePdf: 'fiches PDF en image : transcription par lecture visuelle (voie c3e), valeurs recopiées telles qu’imprimées, graphique radar non chiffré' };

/** Clés des lignes qui n'ont pas de nom canonique dans cleChamp. */
const CLES_SPECIALES = { 'other': 'autresComposes', 'floral-estery products': 'produitsFloralEsters', 'floral-estery compounds': 'produitsFloralEsters', 'citrus-piney products': 'produitsAgrumesResineux', 'citrus-piney compounds': 'produitsAgrumesResineux', 'other known compounds': 'autresComposesConnus', 'oxidation products': 'produitsOxydation', 'unknown compounds': 'composesInconnus', 'limonene': 'limonene', 'alpha ratio': 'rapportAlpha', 'humulene:caryophyllene ratio': 'rapportHumuleneCaryophyllene' };
const sansPoint = s => s.replace(/(^|[^\d])\.(\d)/g, (_, a, b) => `${a}0.${b}`);   // « .35-.6 » → « 0.35-0.6 »

/** Une ligne transcrite → { cle, valeur } selon c3-COMMUN § 3. `plage` est le texte imprimé (avec unité s'il y en a une). */
export function valeurTranscrite({ libelle, plage, moyenne = null, page, enPourcent = true }) {
  const l = libelle.trim(), cleBas = l.toLowerCase();
  const cle = CLES_SPECIALES[cleBas] ?? cleChamp(l);
  const v = lireValeur(sansPoint(plage));
  const sortie = { champ: l, brut: moyenne == null ? plage : `Mean ${moyenne} ; Range ${plage}`, valeur: v.valeur, min: v.min, max: v.max, unite: v.unite, base: null };
  if (/ratio/i.test(l)) sortie.unite = null;
  else if (sortie.unite == null && /m[lL]s?\s*\/\s*100/.test(l)) sortie.unite = 'mL/100 g';
  else if (sortie.unite == null && enPourcent) sortie.unite = '%';
  if (cle === 'huileTotale' && moyenne != null && /^[^(]*$/.test(l)) sortie.uniteNote = 'imprimée en % sous « Trait % » ; mL/100 g probable (la fiche Nelson Sauvin dit mls/100g)';
  const implicite = baseImplicite(cle);
  if (implicite && !(cle === 'huileTotale' && sortie.unite === '%')) sortie.baseImplicite = implicite;
  if (moyenne != null) {
    sortie.moyenne = Number(sansPoint(String(moyenne)));
    if (sortie.min != null && sortie.max != null && (sortie.moyenne < sortie.min || sortie.moyenne > sortie.max)) sortie.incoherence = 'moyenne hors de la plage imprimée';
  }
  sortie.transcrit = 'lecture visuelle';
  sortie.page = page;
  return { cle, valeur: sortie };
}

/** Une entrée du fichier de transcriptions → { champs, listes }. */
export function champsDeTranscription(e) {
  const champs = {};
  const ajoute = (libelle, plage, moyenne) => { const { cle, valeur } = valeurTranscrite({ libelle, plage, moyenne, page: e.page }); if (!(cle in champs)) champs[cle] = valeur; };
  if (e.format === 'tech') for (const [l, p] of Object.entries(e.tech)) ajoute(l, p, null);
  else for (const [l, [moy, plage]] of Object.entries(e.moyennePlage)) ajoute(l, plage, moy);
  const listes = { profilCourt: e.profilCourt ? [e.profilCourt] : [], ...e.listes };
  return { champs, listes };
}

/** Fiches `fiche-pdf` : une par PDF transcrit. `recu(url)` rend { releve, sha256 } du PDF en cache. */
export async function fichesDesPdf(doc, recu) {
  const fiches = [];
  for (const e of doc.fiches) {
    const r = await recu(e.pdf);
    const identiques = [];
    for (const u of e.pdfIdentiques ?? []) { const x = await recu(u); if (x.sha256 !== r.sha256) throw Error(`PDF annoncé identique mais différent : ${u}`); identiques.push(u); }
    const { champs, listes } = champsDeTranscription(e);
    fiches.push(fiche({ nom: e.nom, url: e.pdf, releve: r.releve, publie: null, champs, listes, extra: { page: 'fiche-pdf', transcrit: 'lecture visuelle', pagePdf: e.page, sha256Pdf: r.sha256, ...(identiques.length ? { pdfIdentiques: identiques } : {}), ...(e.doutes ? { doutes: e.doutes } : {}), ...(e.notes ? { notesPdf: e.notes } : {}), ...(e.enTete ? { enTetePdf: e.enTete } : {}) } }));
  }
  return fiches;
}

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
  // Fiches PDF en image : transcriptions (voie c3e). Chaque PDF passe par le cache (reçu sha256) et par le robots.txt de son hôte.
  const doc = JSON.parse(readFileSync(TRANSCRIPTIONS, 'utf8'));
  const rbCdn = await robots('https://cdn.shopify.com');
  const recu = async url => {
    if (!rbCdn(new URL(url).pathname)) throw Error(`robots.txt interdit : ${url}`);
    const b = await lire(url, { binaire: true });
    return { releve: releveDe(b), sha256: b.sha256 };
  };
  fiches.push(...await fichesDesPdf(doc, recu));
  ecrire(SOURCE, fiches);
  ecrireJournal('nzhops', [ORIGINE, 'https://cdn.shopify.com']);
  console.log(`Produits sans « % AA » (hors houblon) : ${hors.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
