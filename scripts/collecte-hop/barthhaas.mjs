// Collecte des fiches BarthHaas (barthhaas.com/hops-and-products/hops/…) — voie c3b-europe, #180.
// Relance tout depuis le cache avec --offline ; sans l'option, télécharge poliment (robots.txt, 1 requête/s) ce qui manque.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { lire } from './europe-commun.mjs';
import { ecrireSortie, nettoyer, poserChamp, rattacher } from './europe-champs.mjs';

const HOTE = 'https://www.barthhaas.com';
export const INDEX_SITEMAP = `${HOTE}/sitemap.xml`;
const SOURCE = {
  nom: 'BarthHaas',
  hote: 'www.barthhaas.com',
  type: 'producteur / négociant (DE) — fiches variété publiques',
  conditions: 'Pages publiques lues, robots.txt respecté (User-agent * : pas de Disallow sur /hops-and-products/). Aucune licence ouverte lue ; pas de page de conditions consultée dans cette étape. © BarthHaas.',
  methodes: 'Site : α par titrage conductimétrique (EBC 7.4) en Europe, spectrophotométrie (ASBC Hops-6) aux États-Unis ; huile par chromatographie gazeuse (ASBC Hops-17, EBC 7.12). Valeurs = fourchette moyenne des 4 dernières années.',
};

const txt = e => nettoyer(e?.textContent ?? '');

/** Analyse le HTML d'une fiche variété. Fonction pure (testée sur du HTML synthétique). */
export function analyserFiche(html, JSDOM) {
  const d = new JSDOM(html).window.document;
  const main = d.querySelector('main') || d.body;
  const h1 = main.querySelector('h1');
  if (!h1) return null;
  const nomEcrit = txt(h1);
  const nom = nomEcrit.replace(/\s+Hops?$/i, '').replace(/[®™]/g, '').trim();
  const champs = {};
  for (const dt of main.querySelectorAll('dl dt')) {
    const dd = dt.nextElementSibling;
    if (!dd || dd.tagName !== 'DD') continue;
    const libelle = txt(dt);
    if (/^cultivation area$/i.test(libelle)) continue;
    poserChamp(champs, libelle, txt(dd));
  }
  const pays = [...main.querySelectorAll('dl dt')].filter(dt => /^cultivation area$/i.test(txt(dt))).map(dt => txt(dt.nextElementSibling));
  const hero = h1.parentElement;
  const code = txt(hero?.querySelector('p.text-display-4-bold')) || null;
  const origine = txt(hero?.querySelector('p.text-display-4:not(.text-display-4-bold)')) || null;
  const descripteurs = [...main.querySelectorAll('section.hn__detail ul.section-card-text__tastes li, .hp__hero ul.section-card-text__tastes li')]
    .map(li => ({ mot: txt(li), classe: li.getAttribute('class') || null })).filter(x => x.mot);
  // Ascendance : le <p> qui suit le titre « Ancestry ».
  let lignee = null;
  for (const p of main.querySelectorAll('p')) if (/^ancestry$/i.test(txt(p))) { lignee = txt(p.nextElementSibling) || null; break; }
  // Roses aromatiques : 12 axes, une valeur par axe (profil typique, puis profil d'une année).
  const libelles = (main.querySelector('[data-rose-labels]')?.getAttribute('data-rose-labels') || '').split(',').map(nettoyer).filter(Boolean);
  const roses = [];
  for (const c of main.querySelectorAll('canvas[id^="chart-area-wheel"]')) {
    const valeurs = (c.getAttribute('data-values') || '').split(',').map(v => (v.trim() === '' ? null : Number(v))).map(v => (Number.isFinite(v) ? v : null));
    const bloc = c.closest('.columns-item');
    const titre = txt(bloc?.querySelector('b.text-copy-1')) || null;
    const annee = titre?.match(/\b(19|20)\d{2}\b/)?.[0] || null;
    roses.push({ titre, annee, valeurs });
  }
  // Formes commerciales : cartes qui suivent « … also comes as ».
  const formes = [];
  const titreFormes = [...main.querySelectorAll('p')].find(p => /also comes as/i.test(txt(p)));
  if (titreFormes) {
    for (const h of main.querySelectorAll('.section-card-text__headline')) {
      if (titreFormes.compareDocumentPosition(h) & 4 /* FOLLOWING */) { const t = txt(h); if (t) formes.push(t); }
    }
  }
  const corps = txt(main);
  const periode = /last\s*(\d+)\s*years/i.exec(corps);
  return {
    nom, nomEcrit, code, origine, pays,
    champs,
    listes: {
      descripteurs: descripteurs.map(x => x.mot),
      familles: descripteurs.map(x => x.classe),
      lignee: lignee && !/^[-–—]*$/.test(lignee) ? [lignee] : [],
      formes,
      rose: { axes: libelles, profils: roses },
    },
    periodeAnalyses: periode ? `moyenne des ${periode[1]} dernières années` : null,
  };
}

export async function collecter() {
  const require = createRequire(import.meta.url);
  const { JSDOM } = require('jsdom');
  const etat = {};
  const index = await lire(INDEX_SITEMAP, etat);
  if (!index) throw Error(`Sitemap illisible : ${etat.raison}`);
  const sousCartes = [...index.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const urls = new Set();
  for (const u of sousCartes) {
    const p = await lire(u, {});
    if (p) for (const m of p.content.matchAll(/<loc>([^<]*\/hops-and-products\/hops\/[^<]+)<\/loc>/g)) urls.add(m[1].replace(/&amp;/g, '&'));
  }
  // La page « aperçu » liste aussi des variétés absentes du sitemap (Luna, Saaz Late).
  const apercu = await lire(`${HOTE}/hops-and-products/hop-varieties-overview`, {});
  if (apercu) for (const m of apercu.content.matchAll(/href="(\/hops-and-products\/hops\/[^"#?]+)"/g)) urls.add(HOTE + m[1]);
  const fiches = [], nonLues = [];
  for (const url of [...urls].sort()) {
    const e = {};
    const page = await lire(url, e);
    if (!page) { nonLues.push({ url, raison: e.raison }); continue; }
    const f = analyserFiche(page.content, JSDOM);
    if (!f) { nonLues.push({ url, raison: 'pas de titre (page sans fiche)' }); continue; }
    const r = await rattacher(f.nom, [f.code, f.nomEcrit].filter(Boolean));
    const { nomEcrit, code, origine, pays, periodeAnalyses, ...reste } = f;
    fiches.push({
      nom: f.nom, nomEcrit, alias: code ? [code] : [], code, varietyId: r.varietyId, rattachement: { via: r.via, candidats: r.candidats },
      url, releve: page.retrievedAt, publie: null, periodeAnalyses, origine, pays, champs: reste.champs, listes: reste.listes,
    });
  }
  nonLues.sort((a, b) => a.url.localeCompare(b.url));
  return { fiches, nonLues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { fiches, nonLues } = await collecter();
  const sortie = await ecrireSortie('barthhaas', { ...SOURCE, nonLues }, fiches);
  console.log(JSON.stringify({ source: 'barthhaas', fiches: sortie.nbFiches, fichiers: sortie.fichiers, nonLues: nonLues.length, rattachees: fiches.filter(f => f.varietyId).length, sha256: sortie.sha256 }));
}
