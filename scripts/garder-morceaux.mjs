#!/usr/bin/env node
/**
 * Protection de décalage (« skew protection ») avant un déploiement de l'hébergement : copie dans `dist/assets` les morceaux
 * de la version EN LIGNE qui manquent au nouveau build, pour qu'un onglet ouvert sur l'ancienne version charge encore ses écrans
 * (TE-34 / RO-1, 08.11 : « Impossible de charger cet écran », `Failed to fetch dynamically imported module …/RecipeStep-*.js`).
 *
 * Problème type : un client Vite garde les noms à empreinte de sa version ; Firebase Hosting remplace tout le site à chaque
 * déploiement. Méthode standard (Vercel, Netlify, guide Vite « Load Error Handling ») : servir aussi les fichiers de la version
 * précédente. Seule la version servie au moment du déploiement est gardée (pas d'accumulation) : un onglet plus vieux encore
 * reçoit l'avis « Nouvelle version · Recharger » (src/ui/NouvelleVersion.tsx).
 *
 * Lecture seule sur le site en ligne. Usage : node scripts/garder-morceaux.mjs <dist> [--site https://…]
 */
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2];
const site = (process.argv.includes('--site') ? process.argv[process.argv.indexOf('--site') + 1] : 'https://brasserie-l-affinee.web.app').replace(/\/$/, '');
if (!dist || !fs.existsSync(path.join(dist, 'index.html'))) { console.error('usage : garder-morceaux.mjs <dist>'); process.exit(2); }

const RE = /assets\/[A-Za-z0-9_.-]+\.(?:js|css|wasm)/g;
const lire = async (url) => { const r = await fetch(`${url}?v=${Date.now()}`); if (!r.ok) throw new Error(`${r.status} ${url}`); return Buffer.from(await r.arrayBuffer()); };

const html = (await lire(`${site}/index.html`)).toString('utf8');
const vus = new Set(), file = [...new Set(html.match(RE) ?? [])];
let copies = 0, dejaLa = 0, echecs = 0;
while (file.length) {
  const rel = file.shift();
  if (vus.has(rel)) continue;
  vus.add(rel);
  const cible = path.join(dist, rel);
  let contenu;
  if (fs.existsSync(cible)) { dejaLa++; contenu = rel.endsWith('.js') ? fs.readFileSync(cible) : null; }
  else {
    try { contenu = await lire(`${site}/${rel}`); fs.mkdirSync(path.dirname(cible), { recursive: true }); fs.writeFileSync(cible, contenu); copies++; }
    catch (e) { echecs++; console.error(`manque : ${rel} (${e.message})`); continue; }
  }
  // Les morceaux chargés à la demande sont cités par le code (`__vite__mapDeps`, `import("./X.js")`) : on les suit.
  if (contenu && rel.endsWith('.js')) {
    const texte = contenu.toString('utf8');
    for (const m of texte.match(RE) ?? []) if (!vus.has(m)) file.push(m);
    for (const m of texte.matchAll(/["'`]\.\/([A-Za-z0-9_.-]+\.(?:js|css|wasm))["'`]/g)) { const r = `assets/${m[1]}`; if (!vus.has(r)) file.push(r); }
  }
}
console.log(`MORCEAUX OK — version en ligne : ${vus.size} fichiers suivis, ${copies} copiés, ${dejaLa} déjà dans le build, ${echecs} introuvables`);
process.exit(echecs ? 1 : 0);
