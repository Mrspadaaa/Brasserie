// Téléchargement poli des pages publiques Hopsteiner (liste + fiches) vers le cache. Aucun contournement.
// Usage : node scripts/collecte-hop/hopsteiner-collecte.mjs  (en ligne ; le cache sert d'abord, rien n'est retéléchargé)
import { readHopSource } from '../hop-source-cache.mjs';
import { cachePath, HOTE, PAGES_ANNEXES, urlListe, urlFiche, liensFiches } from './hopsteiner.mjs';

const attente = ms => new Promise(r => setTimeout(r, ms));
const cache = cachePath();
let dernier = 0;
let bloque = null;

async function lire(url) {
  // Cache d'abord : pas de requête, pas d'attente.
  try { return await readHopSource(url, { cache, offline: true }); } catch { /* absent : à télécharger */ }
  if (bloque) throw Error(`Hôte arrêté (${bloque}) : ${url}`);
  const delta = Date.now() - dernier;
  if (delta < 1100) await attente(1100 - delta);
  dernier = Date.now();
  try { return await readHopSource(url, { cache, offline: false }); }
  catch (e) {
    const m = /\((\d{3})\)/.exec(e.message);
    if (m && ['401', '403', '429'].includes(m[1])) bloque = m[1];
    throw e;
  }
}

// robots.txt : lu à la main, il ne fait pas partie du cache des pages.
const robots = await (await fetch(`https://${HOTE}/robots.txt`, { headers: { 'User-Agent': 'LAffinee-Hop-Reference-Audit/1.0' } })).text();
console.log('robots.txt', HOTE, '\n' + robots);
const interdits = robots.split(/\r?\n/).filter(l => /^Disallow:/i.test(l)).map(l => l.split(':')[1].trim()).filter(Boolean);
const permis = url => !interdits.some(d => new URL(url).pathname.startsWith(d));

const slugs = new Set();
for (let page = 1; page <= 40; page++) {
  const url = urlListe(page);
  if (!permis(url)) { console.log('robots interdit', url); break; }
  let r;
  try { r = await lire(url); } catch (e) { console.log('ECHEC', url, e.message); break; }
  const trouves = liensFiches(r.content);
  const neufs = trouves.filter(s => !slugs.has(s));
  trouves.forEach(s => slugs.add(s));
  console.log(`liste p${page}: ${trouves.length} fiches, ${neufs.length} neuves`);
  if (!neufs.length) break;
}
let ok = 0, ko = 0;
for (const slug of [...slugs].sort()) {
  const url = urlFiche(slug);
  if (!permis(url)) { console.log('robots interdit', url); continue; }
  try { await lire(url); ok++; } catch (e) { ko++; console.log('ECHEC', slug, e.message); if (bloque) break; }
}
// Pages annexes : mentions légales (conditions) et pages publiques US (guides, publications). hopsteiner.us : robots Disallow vide.
for (const url of PAGES_ANNEXES) {
  if (new URL(url).host === HOTE && !permis(url)) { console.log('robots interdit', url); continue; }
  try { await lire(url); console.log('annexe ok', url); } catch (e) { console.log('ECHEC annexe', url, e.message); if (bloque) break; }
}
console.log(`fiches: ${ok} lues, ${ko} échecs, ${slugs.size} au total${bloque ? ', hôte arrêté sur ' + bloque : ''}`);
