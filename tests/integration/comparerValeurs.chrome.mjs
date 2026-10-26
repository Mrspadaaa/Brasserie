// Contrôle Chrome de la feuille Valeurs de Comparer (voie c2-comparer-valeurs, L13) : Nelson Sauvin, Citra, Mosaic, 390 × 844
// (puis 1280 × 800 avec --large). Données : le fixture du banc `?dev-local&etape=houblons` (aucune donnée réelle).
// Vérifie (1) qu'aucun texte ne déborde de sa cellule ni ne recouvre la colonne voisine, (2) qu'aucun mot d'un nom de ligne
// n'est coupé, (3) qu'aucune cellule « inconnu » n'existe là où le catalogue porte la valeur.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5201 --strictPort" --port 5201 --env VITE_HOP_V4=on -- node tests/integration/comparerValeurs.chrome.mjs [--large] [--captures <dossier>]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const argv = process.argv.slice(2);
const large = argv.includes('--large');
const dossier = argv.includes('--captures') ? path.resolve(argv[argv.indexOf('--captures') + 1]) : null;
if (dossier) fs.mkdirSync(dossier, { recursive: true });
// Le catalogue de la RACINE de l'arbre testé (WITH_SERVER_RACINE si le serveur tourne ailleurs) fait foi pour « le catalogue a la valeur ».
const catalogue = JSON.parse(fs.readFileSync(path.join(process.env.CATALOGUE_RACINE ?? RACINE, 'src/data/hopV4/proto-data.json'), 'utf8')).varieties;
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const HOUBLONS = ['beermaverick-nelson-sauvin', 'beermaverick-citra', 'beermaverick-mosaic'];
const { browser, page, journal } = await ouvrir(large ? { largeur: 1280, hauteur: 800, mobile: false } : { largeur: 390, hauteur: 844 });
const echecs = [];
const ok = (c, m) => { if (!c) echecs.push(m); console.log(c ? 'OK   ' : 'ECHEC', m); };

await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await dormir(800);
await page.evaluate((h) => window.__hopPile.open({ view: 'hopCompare', hops: h }), HOUBLONS);
await page.waitForSelector('[data-ecran="comparer"] [data-moment]', { timeout: 90000 });
await dormir(1200);
await page.click('[data-etat~="etat-comp-chimie"]');
await page.waitForSelector('.pq-comparer-vraies', { timeout: 30000 });
await dormir(1200);

const noms = await page.evaluate(() => [...document.querySelectorAll('.pq-comparer-vh > span')].slice(1).map((s) => s.textContent));
console.log('colonnes :', noms.join(' | '));
ok(noms.length === 3, 'trois colonnes (Nelson Sauvin, Citra, Mosaic) : ' + noms.join(', '));

const mesure = await page.evaluate(() => {
  const feuille = document.querySelector('.pq-comparer-vraies');
  const rect = (r) => ({ g: r.left, d: r.right, h: r.top, b: r.bottom });
  const rectsTexte = (el) => {
    const res = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      const r = document.createRange(); r.selectNodeContents(n);
      for (const q of r.getClientRects()) if (q.width > 0 && q.height > 0) res.push(rect(q));
    }
    return res;
  };
  // 1. débordement : chaque élément de la feuille qui a du texte propre, et chaque cellule de grille.
  const debord = [];
  for (const el of feuille.querySelectorAll('*')) {
    if (getComputedStyle(el).display === 'inline') continue;
    if (el.closest('svg')) continue;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) debord.push({ cls: el.className?.toString?.() ?? '', txt: el.textContent.trim().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth });
  }
  // 2. recouvrement : dans chaque rangée de grille, le texte d'une cellule doit rester dans sa cellule ; deux textes voisins ne se recouvrent pas.
  const recouv = [];
  for (const row of feuille.querySelectorAll('.pq-comparer-grille-tab')) {
    const cellules = [...row.children].filter((c) => c.tagName === 'SPAN');
    const boites = cellules.map((c) => ({ c, b: c.getBoundingClientRect(), t: rectsTexte(c) }));
    boites.forEach((x, i) => {
      for (const t of x.t) if (t.g < x.b.left - 1 || t.d > x.b.right + 1) recouv.push({ type: 'hors-cellule', cell: i, txt: x.c.textContent.trim().slice(0, 40), texte: [t.g, t.d].map(Math.round), cellule: [x.b.left, x.b.right].map(Math.round) });
      boites.slice(i + 1).forEach((y, j) => {
        for (const a of x.t) for (const b of y.t) {
          if (a.g < b.d - 0.5 && b.g < a.d - 0.5 && a.h < b.b - 0.5 && b.h < a.b - 0.5) recouv.push({ type: 'chevauche', entre: [i, i + 1 + j], a: x.c.textContent.trim().slice(0, 30), b: y.c.textContent.trim().slice(0, 30) });
        }
      });
    });
  }
  // IBU aux étapes : chaque étiquette (.pq-comparer-vi-l) reste dans sa colonne, et deux étiquettes ne se recouvrent pas.
  const etiq = [...feuille.querySelectorAll('.pq-comparer-vi-l')];
  etiq.forEach((e) => {
    const col = e.closest('.pq-comparer-vc').getBoundingClientRect();
    for (const t of rectsTexte(e)) if (t.g < col.left - 1 || t.d > col.right + 1) recouv.push({ type: 'etiquette-hors-colonne', txt: e.textContent.trim().slice(0, 40) });
  });
  // 3. mots coupés : chaque mot (séparé par des espaces) des noms de ligne, unités et étiquettes ne donne qu'un rectangle par ligne de texte.
  const coupes = [];
  const surfaces = [...feuille.querySelectorAll('.pq-comparer-vn, .pq-comparer-vh > span, .pq-comparer-vi-l, .pq-comparer-vi, .pq-comparer-vv, .pq-comparer-vnote, .pq-comparer-vsrc')];
  for (const s of surfaces) {
    const w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const re = /\S+/g; let m;
      while ((m = re.exec(n.textContent))) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const lignes = new Set([...r.getClientRects()].filter((q) => q.width > 0).map((q) => Math.round(q.top)));
        if (lignes.size > 1) coupes.push(m[0]);
      }
    }
  }
  // 4. cellules inconnues, par ligne de composé.
  const inconnus = {};
  for (const row of feuille.querySelectorAll('.pq-comparer-vg[data-compose]')) {
    const k = row.getAttribute('data-compose');
    inconnus[k] = [...row.querySelectorAll(':scope > .pq-comparer-vc')].map((c) => c.classList.contains('pq-comparer-vc-inc'));
  }
  return { debord, recouv, coupes: [...new Set(coupes)], inconnus, nbEtiq: etiq.length, nbLignes: feuille.querySelectorAll('.pq-comparer-vg').length };
});

console.log('lignes de la feuille :', mesure.nbLignes, '· étiquettes IBU :', mesure.nbEtiq);
ok(mesure.nbEtiq > 0, 'la ligne IBU aux étapes est rendue');
ok(mesure.debord.length === 0, 'aucune cellule ne déborde (scrollWidth ≤ clientWidth + 1)' + (mesure.debord.length ? ' : ' + JSON.stringify(mesure.debord.slice(0, 6)) : ''));
ok(mesure.recouv.length === 0, 'aucun texte ne sort de sa cellule ni ne recouvre la colonne voisine' + (mesure.recouv.length ? ' : ' + JSON.stringify(mesure.recouv.slice(0, 6)) : ''));
ok(mesure.coupes.length === 0, 'aucun mot coupé' + (mesure.coupes.length ? ' : ' + mesure.coupes.join(', ') : ''));

// « inconnu » seulement si aucune source n'a la valeur : le catalogue du moteur fait foi pour ces quatre lignes.
const attendu = { myrcene: (v) => v.oils?.myrcene, humulene: (v) => v.oils?.humulene, caryophyllene: (v) => v.oils?.caryophyllene, linalol: (v) => v.hsLinalool?.range };
for (const [cle, lit] of Object.entries(attendu)) {
  const ligne = mesure.inconnus[cle];
  ok(!!ligne && ligne.length === 3, `la ligne ${cle} existe avec 3 cellules`);
  if (!ligne) continue;
  HOUBLONS.forEach((id, i) => {
    const v = catalogue.find((x) => x.id === id);
    const a = !!lit(v);
    ok(!(a && ligne[i]), `${cle} · ${noms[i]} : ${a ? 'le catalogue a la valeur' : 'aucune source'} → ${ligne[i] ? 'inconnu' : 'valeur affichée'}`);
  });
}
ok(!HOUBLONS.some((id, i) => !catalogue.find((x) => x.id === id)?.oils && !mesure.inconnus.myrcene?.[i]), 'pas de valeur inventée sans source');

if (dossier) {
  const tag = large ? '1280' : '390';
  const sc = await page.evaluateHandle(() => { let x = document.querySelector('.pq-comparer-vraies'); while (x && !(x.scrollHeight > x.clientHeight + 5 && /(auto|scroll)/.test(getComputedStyle(x).overflowY))) x = x.parentElement; return x; });
  const aller = async (sel, bloc = 'start') => { await page.evaluate((s, b) => document.querySelector(s)?.scrollIntoView({ block: b }), sel, bloc); await dormir(500); };
  await aller('[data-role="composition-huiles"]');
  await page.screenshot({ path: path.join(dossier, `composition-${tag}.png`) });
  await aller('.pq-comparer-chim [data-compose="myrcene"]');
  await page.screenshot({ path: path.join(dossier, `chimie-${tag}.png`) });
  await aller('[data-role="ibu-etapes"]', 'center');
  await page.screenshot({ path: path.join(dossier, `ibu-${tag}.png`) });
  await sc.evaluate((x) => { x.scrollTop = x.scrollHeight; }); await dormir(400);
  await page.screenshot({ path: path.join(dossier, `bas-${tag}.png`) });
}
const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
ok(erreurs.length === 0, 'aucune erreur de page' + (erreurs.length ? ' : ' + erreurs.slice(0, 3).join(' | ') : ''));
await browser.close();
console.log(echecs.length ? `COMPARER VALEURS ECHEC (${echecs.length})` : 'COMPARER VALEURS OK');
process.exitCode = echecs.length ? 1 : 0;
