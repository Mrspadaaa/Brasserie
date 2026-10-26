// Contrôle Chrome de la feuille Valeurs de Comparer (voie c2-comparer-valeurs, L13) : Nelson Sauvin, Citra, Mosaic, 390 × 844
// (puis 1280 × 800 avec --large). Données : le fixture du banc `?dev-local&etape=houblons` (aucune donnée réelle).
// Vérifie (1) qu'aucun texte ne déborde de sa cellule ni ne recouvre la colonne voisine, (2) qu'aucun mot d'un nom de ligne
// n'est coupé, (3) qu'aucune cellule « inconnu » n'existe là où le catalogue porte la valeur.
// o1 (D154, 26.10) : la composition des huiles a une ligne par huile nommée (farnésène, linalol, géraniol quand un houblon comparé a
// une valeur), aucun titre de groupe ne nomme une huile qui a sa ligne, et la somme des bas des plages d'un houblon ne dépasse pas 100 % + 2 (celle des hauts ne descend pas sous 100 % − 2).
// d3b (#180) : la somme des MILIEUX n'est plus la bonne mesure : l'enveloppe de 18 sources (farnésène 0,1–10,7 % de Nelson Sauvin) fait des plages
// qui, prises en leur milieu, dépassent 100 % sans aucun double compte ; la cohérence d'une composition en intervalles est bas ≤ 100 ≤ haut.
// `--trio saaz` compare Saaz, Citra et Hallertau Blanc au lieu de Nelson Sauvin, Citra et Mosaic ; `--trio riche` compare Galaxy, Cascade et Enigma
// (sélinène, géraniol, thiols dans complements.json).
// d3b (#180) : les valeurs de complements.json (18 sources) entrent dans la composition et le tableau ; le sélinène a sa ligne quand un houblon
// comparé l'a ; l'écran n'est montré qu'une fois les compléments arrivés (aucune valeur qui change sous le doigt).
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
const TRIO = argv.includes('--trio') ? argv[argv.indexOf('--trio') + 1] : 'nelson';
const HOUBLONS = TRIO === 'riche' ? ['beermaverick-galaxy', 'beermaverick-cascade', 'beermaverick-enigma'] : TRIO === 'saaz' ? ['beermaverick-saaz-cz', 'beermaverick-citra', 'beermaverick-hallertau-blanc'] : ['beermaverick-nelson-sauvin', 'beermaverick-citra', 'beermaverick-mosaic'];
const { browser, page, journal } = await ouvrir(large ? { largeur: 1280, hauteur: 800, mobile: false } : { largeur: 390, hauteur: 844 });
const echecs = [];
const complements = JSON.parse(fs.readFileSync(path.join(process.env.CATALOGUE_RACINE ?? RACINE, 'src/data/hopV4/complements.json'), 'utf8')).varietes;
// Une enveloppe de complements.json avec une borne haute : compose() la rend en plage (une borne seule reste inconnue en composition).
const deComplements = (id, c) => { const e = complements[id]?.c?.[c]?.e; return !!e && e[1] != null; };
const fiches = JSON.parse(fs.readFileSync(path.join(process.env.CATALOGUE_RACINE ?? RACINE, 'src/data/hopV4/composes-houblon.json'), 'utf8')).varietes;
const deFiche = (id, c) => (fiches[id]?.composes?.[c]?.valeurs ?? []).some((v) => (!v.portee || v.portee === 'variété') && v.plage.some((x) => x != null));
const ok = (c, m) => { if (!c) echecs.push(m); console.log(c ? 'OK   ' : 'ECHEC', m); };

const requetes = [];
page.on('requestfinished', (r) => { if (/complements[^/]*.json/.test(r.url())) requetes.push(r.url().split('/').pop().slice(0, 50)); });
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
ok(noms.length === 3, 'trois colonnes : ' + noms.join(', '));

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
  // 3b. en-tête : écart entre le texte de deux noms voisins (au moins 8 px, sinon le nom passe à la ligne entre deux mots).
  const entete = [...feuille.querySelectorAll('.pq-comparer-vh > span')].slice(1).map((sp) => {
    const t = rectsTexte(sp); return { nom: sp.textContent.trim(), g: Math.min(...t.map((r) => r.g)), d: Math.max(...t.map((r) => r.d)) };
  });
  const ecarts = entete.slice(1).map((e, i) => ({ entre: entete[i].nom + ' | ' + e.nom, px: Math.round((e.g - entete[i].d) * 10) / 10 }));
  // 4. cellules inconnues, par ligne de composé.
  const inconnus = {};
  for (const row of feuille.querySelectorAll('.pq-comparer-vg[data-compose]')) {
    const k = row.getAttribute('data-compose');
    inconnus[k] = [...row.querySelectorAll(':scope > .pq-comparer-vc')].map((c) => c.classList.contains('pq-comparer-vc-inc'));
  }
  return { ecarts, debord, recouv, coupes: [...new Set(coupes)], inconnus, nbEtiq: etiq.length, nbLignes: feuille.querySelectorAll('.pq-comparer-vg').length };
});

console.log('lignes de la feuille :', mesure.nbLignes, '· étiquettes IBU :', mesure.nbEtiq);
ok(mesure.nbEtiq > 0, 'la ligne IBU aux étapes est rendue');
ok(mesure.debord.length === 0, 'aucune cellule ne déborde (scrollWidth ≤ clientWidth + 1)' + (mesure.debord.length ? ' : ' + JSON.stringify(mesure.debord.slice(0, 6)) : ''));
ok(mesure.recouv.length === 0, 'aucun texte ne sort de sa cellule ni ne recouvre la colonne voisine' + (mesure.recouv.length ? ' : ' + JSON.stringify(mesure.recouv.slice(0, 6)) : ''));
console.log('écarts entre noms d’en-tête :', JSON.stringify(mesure.ecarts));
ok(mesure.ecarts.length === 2 && mesure.ecarts.every((e) => e.px >= 8), 'au moins 8 px entre deux noms d’en-tête : ' + mesure.ecarts.map((e) => e.px).join(' / ') + ' px');
ok(mesure.coupes.length === 0, 'aucun mot coupé' + (mesure.coupes.length ? ' : ' + mesure.coupes.join(', ') : ''));

// « inconnu » seulement si aucune source n'a la valeur : le catalogue du moteur fait foi pour ces quatre lignes.
const attendu = { geraniol: (v, id) => deComplements(id, 'geraniol') || (deFiche(id, 'geraniol')), huile: (v) => v.oil ?? v.hs?.totalOil, myrcene: (v) => v.oils?.myrcene, humulene: (v) => v.oils?.humulene, caryophyllene: (v) => v.oils?.caryophyllene, linalol: (v) => v.hsLinalool?.range };
for (const [cle, lit] of Object.entries(attendu)) {
  const ligne = mesure.inconnus[cle];
  ok(!!ligne && ligne.length === 3, `la ligne ${cle} existe avec 3 cellules`);
  if (!ligne) continue;
  HOUBLONS.forEach((id, i) => {
    const v = catalogue.find((x) => x.id === id);
    const a = !!lit(v, id);
    ok(!(a && ligne[i]), `${cle} · ${noms[i]} : ${a ? 'le catalogue a la valeur' : 'aucune source'} → ${ligne[i] ? 'inconnu' : 'valeur affichée'}`);
  });
}
ok(!HOUBLONS.some((id, i) => !catalogue.find((x) => x.id === id)?.oils && !mesure.inconnus.myrcene?.[i]), 'pas de valeur inventée sans source');

// ---- d3b : une valeur venue de complements.json s'affiche, avec sa source ----
const frDec = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const cellulesComp = await page.evaluate(() => [...document.querySelectorAll('[data-role="composition-huiles"] .cmc-co-g')].map((g) => ({ id: g.getAttribute('data-compose'), cases: [...g.querySelectorAll('.cmc-co-l')].map((l) => ({ v: l.querySelector('.cmc-co-v').textContent, titre: l.getAttribute('title') })) })));
let nbComp = 0;
for (const champ of ['geraniol', 'selinene', 'linalol']) {
  const g = cellulesComp.find((x) => x.id === champ);
  HOUBLONS.forEach((id, i) => {
    const e = complements[id]?.c?.[champ]?.e;
    const sansAutre = champ === 'geraniol' || champ === 'selinene';
    if (!sansAutre || !e || e[1] == null || deFiche(id, champ)) return;
    nbComp++;
    const lo = e[0] ?? 0, hi = e[1];
    const attendue = hi >= 10 ? `${Math.round(lo)}–${Math.round(hi)} %` : `${frDec(lo)}–${frDec(hi)} %`;
    ok(g?.cases[i]?.v === attendue, `complements.json · ${champ} · ${noms[i]} : « ${g?.cases[i]?.v} » attendu « ${attendue} »`);
    ok(/ \(.*(BarthHaas|Hopsteiner|Charles Faram|Hopslist|HPA|Haas|USDA|Yakima|Crosby|Indie|NZ|BSG|HopDatabase|hops-json|British|USA|Hops Direct)/i.test(g?.cases[i]?.titre ?? ''), `complements.json · ${champ} · ${noms[i]} : la source est au survol : ${g?.cases[i]?.titre}`);
  });
}
ok(nbComp > 0 || TRIO === 'saaz', `complements.json : au moins une valeur de ce trio vient des compléments seuls (${nbComp})`);
// Rien ne change sous le doigt : au premier rendu de l'écran, le morceau des compléments était déjà arrivé (l'écran l'attend, 600 ms au plus).
const chunk = requetes;
console.log('morceau des compléments :', JSON.stringify(chunk));
ok(chunk.length === 1, 'le morceau complements est chargé à l’ouverture de Comparer (chargement à la demande)');

// ---- o1 : la composition des huiles, une ligne par huile nommée (D154) ----
// Une huile a une valeur pour un houblon si le catalogue (Beer Maverick, Hopsteiner) ou une fiche de composés la porte.
const aValeur = { farnesene: (v, id) => !!v.oils?.farnesene || deFiche(id, 'farnesene') || deComplements(id, 'farnesene'), linalol: (v, id) => !!v.hsLinalool?.range || deFiche(id, 'linalol') || deComplements(id, 'linalol'), geraniol: (v, id) => deFiche(id, 'geraniol') || deComplements(id, 'geraniol'), selinene: (v, id) => deComplements(id, 'selinene') };
const huiles = await page.evaluate(() => [...document.querySelectorAll('[data-role="composition-huiles"] .cmc-co-g')].map((g) => ({
  id: g.getAttribute('data-compose'),
  titre: g.querySelector('.cmc-co-n').textContent.toLowerCase(),
  aromes: g.querySelector('.cmc-co-n span')?.textContent.toLowerCase() ?? '',
  inconnus: [...g.querySelectorAll('.cmc-co-l')].map((l) => !!l.querySelector('.cmc-co-inc')),
  milieux: [...g.querySelectorAll('.cmc-co-l')].map((l) => { const m = l.querySelector('.cmc-co-mi'); return m ? parseFloat(m.style.left) : null; }),
  bornes: [...g.querySelectorAll('.cmc-co-l')].map((l) => { const b = l.querySelector('.cmc-co-fr'); return b ? [parseFloat(b.style.left), parseFloat(b.style.left) + parseFloat(b.style.width)] : null; }),
})));
const idsLignes = huiles.map((g) => g.id);
console.log('groupes de la composition :', idsLignes.join(', '));
const catHop = (id) => catalogue.find((x) => x.id === id);
for (const [oil, lit] of Object.entries(aValeur)) {
  const vals = HOUBLONS.map((id) => lit(catHop(id), id));
  const g = huiles.find((x) => x.id === oil);
  ok(vals.some(Boolean) === !!g, `composition · ${oil} : ${vals.some(Boolean) ? 'un houblon comparé a une valeur → ligne propre' : 'aucune valeur chez les houblons comparés → pas de ligne'}`);
  if (g) HOUBLONS.forEach((id, i) => ok(g.inconnus[i] === !vals[i], `composition · ${oil} · ${noms[i]} : ${vals[i] ? 'valeur affichée' : 'inconnu hachuré, jamais 0'}`));
}
const ORDRE = ['myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalol', 'geraniol', 'selinene', 'autres'];
ok(idsLignes.every((x, i) => i === 0 || ORDRE.indexOf(idsLignes[i - 1]) < ORDRE.indexOf(x)), 'composition · ordre de Beer Maverick puis linalol, géraniol, le reste en dernier : ' + idsLignes.join(' > '));
ok(idsLignes.length === new Set(idsLignes).size, 'composition · aucun groupe en double');
// Un titre de groupe ne nomme qu'une huile sans ligne propre : ni dans la composition, ni plus bas dans le tableau de chimie
// (« sauf si elles sont déjà séparées à un endroit », D154) ; le linalol et le géraniol y ont leur ligne.
const ailleurs = await page.evaluate(() => [...document.querySelectorAll('.pq-comparer-vraies .pq-comparer-vg[data-compose]')].map((r) => r.getAttribute('data-compose')));
const NOMS = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalol: 'linalol', geraniol: 'géraniol', selinene: 'sélinène' };
for (const g of huiles) {
  const nommees = Object.entries(NOMS).filter(([, n]) => g.aromes.includes(n)).map(([k]) => k);
  const avecLigne = nommees.filter((k) => idsLignes.includes(k) || ailleurs.includes(k));
  ok(avecLigne.length === 0, `composition · titre de « ${g.id} » (${g.aromes}) ${avecLigne.length ? 'nomme des huiles qui ont leur ligne : ' + avecLigne.join(', ') : 'ne nomme aucune huile qui a sa ligne'}`);
}
// Pas de double compte : la somme des bas des plages d'un houblon ne dépasse pas 100 % + 2 points, celle des hauts ne tombe pas sous 98 %.
HOUBLONS.forEach((id, i) => {
  const bas = huiles.reduce((s, g) => s + (g.bornes[i]?.[0] ?? 0), 0), haut = huiles.reduce((s, g) => s + (g.bornes[i]?.[1] ?? 0), 0);
  ok(bas <= 102 && haut >= 98, `composition · ${noms[i]} : somme des bas ${Math.round(bas * 10) / 10} % ≤ 102 et des hauts ${Math.round(haut * 10) / 10} % ≥ 98`);
});

// L'encadré « X en a plus » lit les mêmes valeurs que le tableau : « ? » seulement si une cellule du tableau est inconnue ou n'a qu'une borne.
const CLE_LIGNE = { 'myrcène': 'myrcene', 'linalol': 'linalol', 'géraniol': 'geraniol', 'humulène': 'humulene', 'caryophyllène': 'caryophyllene', '4MMP': '4MMP', 'huile totale': 'huile' };
const lireEncadre = () => page.evaluate(() => {
  const h = document.querySelector('.pq-comparer-plus-h');
  if (!h) return null;
  const noms = [...h.querySelectorAll('b')].map((b) => b.textContent.trim());
  const entetes = [...document.querySelectorAll('.pq-comparer-vh > span')].slice(1).map((x) => x.textContent.trim());
  const lignes = [...document.querySelectorAll('.pq-comparer-plus-l')].map((l) => {
    const nom = l.querySelector('.pq-comparer-plus-n').textContent.replace(/­/g, '').trim();
    return { nom, texte: l.querySelector('.pq-comparer-plus-r').textContent.trim() };
  });
  return { noms, entetes, lignes };
});
const tableau = () => page.evaluate(() => {
  const out = {};
  for (const row of document.querySelectorAll('.pq-comparer-vraies .pq-comparer-vg[data-compose]')) {
    out[row.getAttribute('data-compose')] = [...row.querySelectorAll(':scope > .pq-comparer-vc')].map((c) => ({ inconnu: c.classList.contains('pq-comparer-vc-inc'), borne: /^[<>]/.test(c.querySelector('.pq-comparer-vv')?.textContent.trim() ?? '') }));
  }
  return out;
});
const verifierEncadre = async (tag) => {
  const e = await lireEncadre(), t = await tableau();
  ok(!!e && e.lignes.length === 7, `encadré ${tag} : 7 lignes (6 composés + huile totale)`);
  if (!e) return;
  const iA = e.entetes.indexOf(e.noms[0]), iB = e.entetes.indexOf(e.noms[1]);
  ok(iA >= 0 && iB >= 0, `encadré ${tag} : ${e.noms.join(' / ')} retrouvés dans les colonnes`);
  for (const l of e.lignes) {
    const cle = CLE_LIGNE[l.nom], cA = t[cle]?.[iA], cB = t[cle]?.[iB];
    if (!cA || !cB) { ok(false, `encadré ${tag} : ligne « ${l.nom} » sans ligne de tableau`); continue; }
    const manque = cA.inconnu || cB.inconnu || cA.borne || cB.borne;
    ok(l.texte.startsWith('?') === manque, `encadré ${tag} · ${l.nom} : « ${l.texte} » (tableau : ${manque ? 'donnée manquante ou borne seule' : 'deux plages'})`);
    if (l.texte.startsWith('?')) ok(/borne seule/.test(l.texte) === !(cA.inconnu || cB.inconnu), `encadré ${tag} · ${l.nom} : « borne seule » seulement si les deux valeurs existent`);
  }
};
await page.evaluate(() => document.querySelector('.pq-comparer-plus-c')?.scrollIntoView({ block: 'start' }));
await verifierEncadre('1');
const echange = await page.$('.pq-comparer-plus-h .pq-comparer-rond');
if (echange) { await echange.click(); await dormir(500); await verifierEncadre('2 (après ⇄)'); }
if (dossier) {
  const tag = large ? '1280' : '390';
  const sc = await page.evaluateHandle(() => { let x = document.querySelector('.pq-comparer-vraies'); while (x && !(x.scrollHeight > x.clientHeight + 5 && /(auto|scroll)/.test(getComputedStyle(x).overflowY))) x = x.parentElement; return x; });
  const aller = async (sel, bloc = 'start') => { await page.evaluate((s, b) => document.querySelector(s)?.scrollIntoView({ block: b }), sel, bloc); await dormir(500); };
  await sc.evaluate((x) => { x.scrollTop = 0; }); await dormir(400);
  await page.screenshot({ path: path.join(dossier, `haut-${tag}.png`) });
  await aller('[data-role="composition-huiles"]');
  await page.screenshot({ path: path.join(dossier, `composition-${tag}.png`) });
  await (await page.$('[data-role="composition-huiles"]')).screenshot({ path: path.join(dossier, `composition-entiere-${tag}.png`) });
  await aller('.pq-comparer-chim [data-compose="myrcene"]');
  await page.screenshot({ path: path.join(dossier, `chimie-${tag}.png`) });
  for (const c of ["myrcene", "linalol", "geraniol"]) { await aller(`.pq-comparer-chim .pq-comparer-vg[data-compose="${c}"]`, 'center'); await (await page.$(`.pq-comparer-chim .pq-comparer-vg[data-compose="${c}"]`)).screenshot({ path: path.join(dossier, `ligne-${c}-${tag}.png`) }); }
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
