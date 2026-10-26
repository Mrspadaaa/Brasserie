// Voie c3c (#180) : fiches Indie Hops (indiehops.com, Oregon), relues depuis le cache avec --offline.
import { fileURLToPath } from 'node:url';
import { champsDepuisLignes, cle, ecrire, ecrireJournal, fiche, lignes, lire, releveDe, robots } from './c3c-commun.mjs';

const ORIGINE = 'https://indiehops.com';
export const SOURCE = { id: 'indiehops', nom: 'Indie Hops', hote: 'indiehops.com', type: 'producteur (États-Unis)', conditions: 'robots.txt : Disallow /wp-admin/ seulement ; aucune licence lue ; pages publiques' };

/** Page /hops/<x> : bloc « Chemistry », formes, année de sortie. */
export function lireVarieteIndie(html) {
  const l = lignes(html);
  const i = l.findIndex(x => /^chemistry$/i.test(x));
  if (i < 0) return null;
  const j = l.findIndex((x, k) => k > i && /^origins?$/i.test(x));
  const bloc = l.slice(i + 1, j < 0 ? i + 20 : j);
  const champs = champsDepuisLignes(bloc, { libelles: /^(alpha|beta|co-?humulone|total oil|myrcene|humulene|caryophyllene|farnesene|linalool|geraniol|selinene|pinene)/i });
  // Un libellé sans valeur lue (ex. Farnesene vide) reste null, jamais 0.
  for (let k = 0; k < bloc.length; k++) {
    if (/^(farnesene|linalool|geraniol|selinene|humulene|caryophyllene|myrcene)/i.test(bloc[k])) {
      const c = champsDepuisLignes([bloc[k], bloc[k + 1] ?? ''], { libelles: /./ });
      const cleCh = Object.keys(c)[0];
      if (!cleCh) {
        const kk = champsDepuisLignes([bloc[k], '-'], { libelles: /./ });
        for (const [a, b] of Object.entries(kk)) if (!(a in champs)) champs[a] = { ...b, brut: '' };
      }
    }
  }
  const ib = l.findIndex(x => /^brewing profile$/i.test(x));
  const titre = (/<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? '').replace(/^\s*Indie Hops\s*/i, '').replace(/\s*[-–]\s*Indie Hops.*$/i, '').replace(/[®™]/g, '').trim();
  const nom = ib > 0 && l[ib - 1].length <= 40 ? l[ib - 1].replace(/[®™]/g, '').trim() : titre;
  const a = l.findIndex(x => /^forms$/i.test(x));
  const formes = a < 0 ? [] : l.slice(a + 1, a + 6).filter(x => !/^(list|salmon|brewing notes)/i.test(x)).slice(0, 4);
  const sortie = l.map(x => /\brelease[^()]*\((\d{4})\)/i.exec(x)?.[1]).find(Boolean) ?? null;
  return { nom, champs, publie: sortie ? Number(sortie) : null, listes: { formes } };
}

async function principal() {
  const rb = await robots(ORIGINE);
  const plan = await lire(`${ORIGINE}/hops-sitemap.xml`);
  const urls = [...plan.content.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x => x[1]);
  const fiches = [], sans = [];
  for (const url of urls) {
    if (!rb(new URL(url).pathname)) continue;
    const r = await lire(url); if (!r) continue;
    const p = lireVarieteIndie(r.content);
    if (!p) { sans.push(url); continue; }
    const mots = new URL(url).pathname.split('/').pop().split('-');
    const depuisUrl = mots.map(m => m.length <= 2 ? m.toUpperCase() : m[0].toUpperCase() + m.slice(1)).join(' ');
    const nom = cle(depuisUrl).endsWith(cle(p.nom)) && cle(depuisUrl).length > cle(p.nom).length ? depuisUrl.slice(0, depuisUrl.length - p.nom.length) + p.nom : p.nom;
    fiches.push(fiche({ nom, url, releve: releveDe(r), publie: p.publie, champs: p.champs, listes: p.listes, extra: { page: 'variete' } }));
  }
  ecrire(SOURCE, fiches);
  ecrireJournal('indiehops', [ORIGINE]);
  console.log(`Pages sans bloc chimique : ${sans.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await principal();
