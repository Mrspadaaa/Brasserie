// Voie c3c (#180) : fiches Hop Products Australia (hops.com.au), relues depuis le cache avec --offline.
// Pages lues : hops/ (liste : région, descripteurs, α, huile), pages de variétés australiennes (données analytiques),
// fiches PDF des variétés importées (tableau complet : β, cohumulone, huile détaillée, polyphénols).
import { fileURLToPath } from 'node:url';
import { champ, cle, ecrire, ecrireJournal, fiche, lignes, lire, listeDe, releveDe, robots, textePdf } from './c3c-commun.mjs';

const ORIGINE = 'https://hops.com.au';
export const SOURCE = { id: 'hpa', nom: 'Hop Products Australia (HPA)', hote: 'hops.com.au', type: 'producteur (Australie)', conditions: 'robots.txt : tout permis sauf /wp-admin/ ; aucune licence lue sur les pages de variétés ; pages et PDF publics' };

/** Une page de variété HPA → { nom, champs, listes } (null si elle n'a pas de bloc « ANALYTICAL DATA »). */
export function lireVarieteHpa(html) {
  const titre = /<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '';
  const nom = lignes(`<p>${titre}</p>`)[0]?.replace(/\s*[-–]\s*HPA\s*$/i, '').replace(/®|™/g, '').trim();
  const l = lignes(html);
  const debut = l.findIndex(x => /^analytical data$/i.test(x));
  if (debut < 0) return null;
  const fin = l.findIndex((x, i) => i > debut && /^back to all hops$/i.test(x));
  const champs = {};
  const bloc = l.slice(debut + 1, fin < 0 ? undefined : fin);
  for (let i = 0; i + 1 < bloc.length; i += 2) {
    const { cle: k, valeur } = champ(bloc[i], bloc[i + 1]);
    if (!(k in champs)) champs[k] = valeur;
  }
  const apres = (re, n = 1) => { const i = l.findIndex(x => re.test(x)); return i < 0 ? null : l[i + n] ?? null; };
  const ascendance = apres(/^ancestry$/i), styles = apres(/^recommended beer styles$/i);
  return { nom, champs, listes: { ascendance: ascendance ? listeDe(ascendance) : [], styles: styles ? listeDe(styles) : [] } };
}

const LIBELLE = /^(alpha|beta|cohumulone|colupulone|total oils?|myrcene|humulene|caryophyllene|farnesene|linalool|geraniol|selinene|citronellol|nerol|pinene|total polyphenols|xanthohumol|hsi|storage)\b/i;
/** Fiche PDF d'un houblon importé (tableau « Alpha (%)    8.0-11.0 »), texte de pdftotext. */
// Voie c3g : en mode colonnes (-layout), une cellule vide (« — ») décale les valeurs d'une ligne : sur la fiche Mosaic le myrcène prenait
// l'huile totale, l'humulène le myrcène, etc. `brut` (pdftotext -raw, ordre de lecture) garde chaque libellé avec sa valeur ; les colonnes
// ne servent plus qu'à repérer la ligne des arômes, isolée entre deux blancs.
const lireLigneTableau = t => {
  if (!LIBELLE.test(t)) return null;
  const m = /^([A-Za-z][A-Za-z ]*?\*?(?:\s*\([^)]*\))?)\s*(?=$|[\d<>—–~-])(.*)$/.exec(t); if (!m) return null;
  const libelle = m[1].trim();
  if (libelle.length > 45 || /[.:]/.test(libelle) || !/^[A-Z]/.test(libelle)) return null;   // une phrase du texte, pas une ligne du tableau
  return { libelle, brut: (m[2] ?? '').trim() };
};
const VALEUR_SEULE = /^(?:[<>~]\s*)?\d[\d.,]*(?:\s*[–-]\s*\d[\d.,]*)?\s*(?:%|ml\/100\s?g)?$|^[—–-]+$/i;
const poser = (champs, libelle, brut) => {
  const { cle: k, valeur } = champ(libelle, brut);
  if (valeur.valeur === 0) { valeur.valeur = null; valeur.zeroPublie = true; }   // « 0 » seul : l'inconnu n'est jamais 0
  if (!(k in champs) || champs[k].brut === '') champs[k] = valeur;
};
function tableauPdf(texte) {
  const l = texte.split(/\r?\n/).map(x => x.replace(/\s+$/, ''));
  const champs = {};
  let premier = -1;
  const lus = l.map(x => lireLigneTableau(x.trim()));
  lus.forEach((p, i) => { if (!p) return; if (premier < 0) premier = i; poser(champs, p.libelle, p.brut); });
  // Fiches à blocs (« Myrcene / Humulene / … » puis « 50 – 55% / 7 – 8% / … ») : les libellés sans valeur d'une même suite reçoivent les valeurs qui suivent, dans l'ordre.
  for (let i = 0; i < lus.length; i++) {
    if (!lus[i] || lus[i].brut !== '') continue;
    let j = i; const libs = [];
    while (j < lus.length && lus[j] && lus[j].brut === '') libs.push(lus[j++].libelle);
    const vals = [];
    for (let k = j; k < l.length && vals.length < libs.length && VALEUR_SEULE.test(l[k].trim()); k++) vals.push(l[k].trim());
    if (libs.length > 1 && vals.length === libs.length) libs.forEach((lib, n) => poser(champs, lib, vals[n]));
    i = j - 1;
  }
  return { l, champs, premier };
}
export function lireFichePdfHpa(texte, brut = null) {
  const { l, premier, champs: champsColonnes } = tableauPdf(texte);
  const champs = brut ? tableauPdf(brut).champs : champsColonnes;
  const isolee = (i) => l[i].trim() && !l[i - 1]?.trim() && !l[i + 1]?.trim();   // la ligne des arômes est seule entre deux blancs
  let avant = null;
  for (let i = premier - 1; i > 0 && !avant; i--) if (isolee(i) && /,/.test(l[i]) && l[i].trim().length <= 160) avant = l[i].trim();
  return { champs, descripteurs: avant ? listeDe(avant) : [] };
}

/** La liste hops/ : une entrée par fiche PDF (nom), avec région, descripteurs, α et huile. */
export function lireListeHpa(html) {
  const sortie = [];
  const re = /href="([^"]*\/([^"/]*?)-Data-Sheet\.pdf)"/gi;
  let m, debut = 0;
  while ((m = re.exec(html))) {
    const morceau = html.slice(debut, m.index); debut = m.index + m[0].length;
    const l = lignes(morceau).slice(-8);
    const iRegion = l.findIndex(x => /^(Australia|Europe|United States|New Zealand)$/.test(x));
    const nom = decodeURIComponent(m[2]).replace(/^HPA-/, '').replace(/-/g, ' ').trim();
    const cherche = re2 => l.map(x => re2.exec(x)?.[1]).find(Boolean) ?? null;
    sortie.push({
      nom, pdf: m[1], region: iRegion >= 0 ? l[iRegion] : null, descripteurs: iRegion >= 0 && l[iRegion + 1] && !/^Alpha Acid/i.test(l[iRegion + 1]) ? listeDe(l[iRegion + 1]) : [],
      alpha: cherche(/^Alpha Acid:\s*(.*)$/i), huile: cherche(/^Total Oils?:\s*(.*)$/i),
    });
  }
  return sortie;
}

async function principal() {
  const rb = await robots(ORIGINE);
  const liste = await lire(`${ORIGINE}/hops/`);
  const entrees = lireListeHpa(liste.content);
  const plan = await lire(`${ORIGINE}/wp-sitemap-posts-post-1.xml`);
  const urls = [...plan.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
  const parCle = new Map(urls.map(u => [cle(new URL(u).pathname.replace(/\//g, '')), u]));
  const fiches = [], sansPage = [], sansPdf = [];
  for (const e of entrees) {
    const url = parCle.get(cle(e.nom)) ?? null;
    let page = null, lu = null, pdf = null;
    if (url && rb(new URL(url).pathname)) { lu = await lire(url); page = lu ? lireVarieteHpa(lu.content) : null; }
    if (!page) {
      sansPage.push(e.nom);
      if (e.pdf && rb(new URL(e.pdf).pathname)) {
        const r = await lire(e.pdf, { binaire: true }).catch(err => { if (/arrêté/.test(err.message)) throw err; return null; });
        if (r) { const t = textePdf(r.octets); if (t.trim()) pdf = { ...lireFichePdfHpa(t, textePdf(r.octets, { brut: true })), url: e.pdf, releve: releveDe(r) }; }
      }
      if (!pdf) sansPdf.push(e.nom);
    }
    const champs = { ...(page?.champs ?? {}), ...(pdf?.champs ?? {}) };
    if (!page && !pdf) {                               // la liste seule : α et huile du bandeau
      if (e.alpha) champs.alpha = champ('Alpha Acid', e.alpha).valeur;
      if (e.huile) champs.huileTotale = champ('Total Oils', e.huile).valeur;
    }
    fiches.push(fiche({
      nom: page?.nom || e.nom, alias: [e.nom], url: pdf ? pdf.url : lu ? url : `${ORIGINE}/hops/`, releve: pdf ? pdf.releve : releveDe(lu ?? liste), publie: null, champs,
      listes: { descripteurs: [...new Set([...e.descripteurs, ...(pdf?.descripteurs ?? [])])], ascendance: page?.listes.ascendance ?? [], styles: page?.listes.styles ?? [], region: e.region ? [e.region] : [], fichePdf: [e.pdf] },
      extra: { page: page ? 'variete' : pdf ? 'fiche-pdf' : 'liste' },
    }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('hpa', [ORIGINE]);
  console.log(`Pages de variété : ${entrees.length - sansPage.length} ; fiches PDF : ${sansPage.length - sansPdf.length} ; liste seule : ${sansPdf.join(', ') || '—'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
