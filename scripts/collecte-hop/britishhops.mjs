// Collecte des fiches de la British Hop Association (britishhops.org.uk/varieties/…) — voie c3b-europe, #180.
// Relance tout depuis le cache avec --offline ; sans l'option, télécharge poliment (robots.txt, 1 requête/s) ce qui manque.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { lire } from './europe-commun.mjs';
import { ecrireSortie, nettoyer, poserChamp, rattacher } from './europe-champs.mjs';

const HOTE = 'https://www.britishhops.org.uk';
const SOURCE = {
  nom: 'British Hop Association',
  hote: 'www.britishhops.org.uk',
  type: 'association de producteurs (UK) — fiches variété publiques',
  conditions: 'Pages publiques lues, robots.txt respecté. Aucune licence ouverte lue ; page « Terms & Conditions » non consultée dans cette étape. © British Hop Association.',
  methodes: 'Fiche : « Total Oils » est publié en « % » (et non en mL/100 g) : unité gardée telle quelle, base non précisée. Composés en % déduits comme part de l’huile. « Flavour Intensity » sur 10.',
};
const txt = e => nettoyer(e?.textContent ?? '');

/** Analyse le HTML d'une fiche variété de la BHA. Fonction pure (testée sur du HTML synthétique). */
export function analyserFiche(html, JSDOM) {
  const d = new JSDOM(html).window.document;
  const h1 = d.querySelector('h1');
  if (!d.querySelector('.analysis')) return null;
  const nomEcrit = txt(h1) || null;
  const champs = {};
  for (const r of d.querySelectorAll('.analysis .row')) {
    const l = txt(r.querySelector('.label')), v = txt(r.querySelector('.value'));
    if (!l) continue;
    const cle = poserChamp(champs, l, v);
    // « Total Oils » est en % chez la BHA (pas en mL/100 g) : on ne prête pas l'unité du vocabulaire commun.
    if (cle === 'huile_totale') Object.assign(champs[cle], { unite: /%/.test(v) ? '%' : null, base: null, baseLue: false });
  }
  const intensite = txt(d.querySelector('.flavour-intensity .content p'));
  if (intensite) champs.intensite_arome = { nom: 'Flavour Intensity', brut: `${intensite} /10`, valeur: Number.isFinite(Number(intensite)) ? Number(intensite) : null, min: null, max: null, unite: null, base: '/10', baseLue: true };
  const h2Carac = [...d.querySelectorAll('h2')].find(h => /^characteristics$/i.test(txt(h)));
  const carac = txt(h2Carac?.parentElement?.querySelector('.content'));
  const sortie = txt(d.querySelector('.breeding .content')).match(/released in\s+((?:19|20)\d{2})/i)?.[1] || null;
  return {
    nomEcrit, nom: (nomEcrit || '').replace(/[®™]/g, '').trim(), champs,
    listes: { descripteurs: carac ? carac.replace(/\.$/, '').split(',').map(nettoyer).filter(Boolean) : [], sortie: sortie ? [sortie] : [] },
  };
}

export async function collecter() {
  const require = createRequire(import.meta.url);
  const { JSDOM } = require('jsdom');
  const liste = await lire(`${HOTE}/varieties/`, {});
  if (!liste) throw Error('Liste des variétés illisible');
  const slugs = [...new Set([...liste.content.matchAll(/href="https:\/\/www\.britishhops\.org\.uk\/varieties\/([a-z0-9-]+)\/"/g)].map(m => m[1]))].sort();
  const fiches = [], nonLues = [];
  for (const slug of slugs) {
    const url = `${HOTE}/varieties/${slug}/`, e = {};
    const page = await lire(url, e);
    if (!page) { nonLues.push({ url, raison: e.raison }); continue; }
    const f = analyserFiche(page.content, JSDOM);
    if (!f) { nonLues.push({ url, raison: 'pas de tableau « Analysis »' }); continue; }
    const r = await rattacher(f.nom, [slug]);
    fiches.push({ nom: f.nom, nomEcrit: f.nomEcrit, alias: [], varietyId: r.varietyId, rattachement: { via: r.via, candidats: r.candidats }, url, releve: page.retrievedAt, publie: null, champs: f.champs, listes: f.listes });
  }
  return { fiches, nonLues };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { fiches, nonLues } = await collecter();
  const sortie = await ecrireSortie('britishhops', { ...SOURCE, nonLues }, fiches);
  console.log(JSON.stringify({ source: 'britishhops', fiches: sortie.nbFiches, fichiers: sortie.fichiers, nonLues: nonLues.length, rattachees: fiches.filter(f => f.varietyId).length, sha256: sortie.sha256 }));
}
