// Collecte des fiches du « Hop Oracle » de Charles Faram (charlesfaram.com/hop-oracle/…) — voie c3b-europe, #180.
// Relance tout depuis le cache avec --offline ; sans l'option, télécharge poliment (robots.txt, 1 requête/s) ce qui manque.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { lire } from './europe-commun.mjs';
import { ecrireSortie, nettoyer, poserChamp, rattacher } from './europe-champs.mjs';

const HOTE = 'https://charlesfaram.com';
export const SITEMAP = `${HOTE}/hop-oracle-sitemap.xml`;
const SOURCE = {
  nom: 'Charles Faram — Hop Oracle',
  hote: 'charlesfaram.com',
  type: 'négociant (UK) — fiches variété publiques',
  conditions: 'Pages publiques lues, robots.txt respecté (Disallow limités à /wp-admin/, /cdn-cgi/ et paramètres d’ajax). Aucune licence ouverte lue ; « Legal terms » non consultées dans cette étape. © Charles Faram 2026. Seules les pages sans préfixe régional (/hop-oracle/<variété>/) sont lues ; les versions /uk/, /ca/, /int/, /eu/ sont des copies du même contenu.',
  methodes: 'Fourchettes publiées par le négociant ; la base de l’huile (mL/100 g) et des composés (% de l’huile) est déduite de l’intitulé « Total Oil » / « Oil Composition ». « Flavour Intensity » : échelle non définie sur la page.',
};

const txt = e => nettoyer(e?.textContent ?? '');

/** « CharlesFaram-icon-citrus-06-pinkgrapefruit-1-300x300.png » → { famille: 'citrus', mot: 'pinkgrapefruit' }. */
export function lireIcone(src) {
  const m = String(src).split('/').pop().match(/icon-([a-z]+)-(\d+)-([a-z]+)/i);
  return m ? { famille: m[1].toLowerCase(), mot: m[3].toLowerCase() } : null;
}

/** Analyse le HTML d'une fiche du Hop Oracle. Fonction pure (testée sur du HTML synthétique). */
export function analyserFiche(html, JSDOM) {
  const d = new JSDOM(html).window.document;
  const h1 = d.querySelector('h1');
  if (!h1) return null;
  const premiere = nettoyer(h1.innerHTML.split(/<br\s*\/?>/i)[0].replace(/<[^>]+>/g, ''));
  const nomEcrit = premiere;
  const nom = premiere.replace(/[®™]/g, '').replace(/\s+hops?$/i, '').trim();
  const champs = {};
  let section = null;
  const cibles = d.querySelectorAll('.jet-listing-dynamic-field__content, h3.elementor-heading-title');
  for (const e of cibles) {
    if (e.tagName === 'H3') { section = txt(e); continue; }
    const t = txt(e);
    const i = t.indexOf(':');
    if (i < 1) continue;
    const libelle = t.slice(0, i).trim(), valeur = t.slice(i + 1).trim();
    const cle = poserChamp(champs, libelle, valeur);
    // « Oil Composition » : composés en % de l'huile, base lue du titre de section.
    if (/oil composition/i.test(section || '') && champs[cle].base === '% de l’huile') champs[cle].baseLue = true;
    if (/oil composition/i.test(section || '') && !champs[cle].base) { champs[cle].base = '% de l’huile'; champs[cle].baseLue = true; if (!champs[cle].unite && /%/.test(valeur)) champs[cle].unite = '%'; }
    if (section) champs[cle].section = section;
  }
  // Descripteurs : icônes « In The Beer » (familles) et « In The Rub » (mots), avec leur texte alternatif.
  const brut = html;
  const a = brut.indexOf('In THe Beer'), b = brut.indexOf('In The Rub'), c = brut.search(/Resources\s*(?:&amp;|&)\s*Help|More Information About/);
  const icones = (de, a2) => (de < 0 ? [] : [...brut.slice(de, a2 > de ? a2 : brut.length).matchAll(/<img[^>]*>/g)])
    .map(m => ({ alt: nettoyer((m[0].match(/\balt="([^"]*)"/) || [])[1] || ''), src: (m[0].match(/\bsrc="([^"]*)"/) || [])[1] || '' }))
    .filter(x => /icon-/i.test(x.src))
    .map(x => ({ alt: x.alt, ...lireIcone(x.src) }));
  const biere = icones(a, b), rub = icones(b, c > b ? c : -1);
  const ld = html.match(/"datePublished":"([^"]+)","dateModified":"([^"]+)"/);
  return {
    nom, nomEcrit, champs,
    listes: {
      descripteursBiere: biere.map(x => x.mot).filter(Boolean),
      famillesBiere: biere.map(x => x.famille).filter(Boolean),
      altBiere: biere.map(x => x.alt),
      descripteursRub: rub.map(x => x.mot).filter(Boolean),
      famillesRub: rub.map(x => x.famille).filter(Boolean),
      altRub: rub.map(x => x.alt),
    },
    publie: ld ? ld[1] : null, modifie: ld ? ld[2] : null,
  };
}

export async function collecter() {
  const require = createRequire(import.meta.url);
  const { JSDOM } = require('jsdom');
  const etat = {};
  const sm = await lire(SITEMAP, etat);
  if (!sm) throw Error(`Sitemap illisible : ${etat.raison}`);
  const urls = [...new Set([...sm.content.matchAll(/<loc>(https:\/\/charlesfaram\.com\/hop-oracle\/[^<]+)<\/loc>/g)].map(m => m[1]))].sort();
  const fiches = [], nonLues = [];
  for (const url of urls) {
    const e = {};
    const page = await lire(url, e);
    if (!page) { nonLues.push({ url, raison: e.raison }); continue; }
    const f = analyserFiche(page.content, JSDOM);
    if (!f) { nonLues.push({ url, raison: 'pas de titre (page sans fiche)' }); continue; }
    const slug = url.replace(/\/$/, '').split('/').pop();
    const r = await rattacher(f.nom, [slug.replace(/-hop$/, '')]);
    fiches.push({
      nom: f.nom, nomEcrit: f.nomEcrit, alias: [], varietyId: r.varietyId, rattachement: { via: r.via, candidats: r.candidats },
      url, releve: page.retrievedAt, publie: f.publie, modifie: f.modifie, champs: f.champs, listes: f.listes,
    });
  }
  return { fiches, nonLues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { fiches, nonLues } = await collecter();
  const sortie = await ecrireSortie('charlesfaram', { ...SOURCE, nonLues }, fiches);
  console.log(JSON.stringify({ source: 'charlesfaram', fiches: sortie.nbFiches, fichiers: sortie.fichiers, nonLues: nonLues.length, rattachees: fiches.filter(f => f.varietyId).length, sha256: sortie.sha256 }));
}
