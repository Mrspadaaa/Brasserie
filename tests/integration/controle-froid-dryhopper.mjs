// Contrôle Chrome (p5-dryhopper-froid, son choix D du 26.10 : « La meilleure D · trois mini graphes ») : dans Dryhopper, au dry hop, les
// trois mini graphes (amertume, creep, limite) sont dans l'espace qu'il a barré, sous la bande IBU ; aucun n'en chevauche un autre ni
// la légende voisine ; le rail reste en dessous ; chaque cellule s'ouvre au toucher (la feuille repousse le rail) et se referme au
// second ; la hauteur ne saute pas d'un jour à l'autre ; aux moments chauds l'écran reste celui d'avant.
// Rouge sur HEAD (rien n'est dessiné), puis OK. Ce n'est pas un test vitest : il lance Chrome sur l'app (fixture locale, Gemini
// jamais appelé, réseau hors localhost coupé).
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5262 --strictPort" --port 5262 --env VITE_HOP_V4=on -- node tests/integration/controle-froid-dryhopper.mjs
// Recette de m5 : Nugget 20 g à 60′, Cascade 80 g dans 20 L (4 g/L), dry hop après, 3 j, style 21C, US-05.
// Sortie : « FROID OK » ou « FROID ECHEC n » (code 1) ; captures dans %TEMP%/controle-froid-dryhopper.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const SORTIE = path.join(os.tmpdir(), 'controle-froid-dryhopper');
fs.mkdirSync(SORTIE, { recursive: true });
const port = process.env.WITH_SERVER_PORTS;
if (!port) { console.log('FROID ECHEC 1\n - lance-le par scripts/with_server.mjs (WITH_SERVER_PORTS absent)'); process.exit(1); }
const base = `http://localhost:${port}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const CLE = 'laffinee_recipe_draft_v1:dev-local:apercu-etape-houblons';
const echecs = [];
const ko = (m) => echecs.push(m);

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await page.click('[data-role="dose-plus"]');
await dormir(1500);
await page.evaluate((cle) => {
  const e = JSON.parse(localStorage.getItem(cle));
  const hops = [{ name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }];
  for (const r of [e.draft.recipe, e.draft.details]) Object.assign(r, { name: 'Hazy du jeudi', style: '21C', hops, ogTarget: 1.058, colorEbc: 8 });
  e.draft.step = 'houblons'; e.draft.recipe.id = e.draft.details.id = 'REC-A2';
  localStorage.setItem(cle.replace('apercu-etape-houblons', 'new'), JSON.stringify(e));
}, CLE);
await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 120000 });
await dormir(1500);
await page.evaluate(() => window.__hopPile.open({ view: 'hopTiming', additionId: 'a2' }));
await page.waitForSelector('[data-ecran="dryhopper"] [data-bandeau]', { timeout: 120000 });
await dormir(1800);

const MESURE = () => {
  const q = (s) => document.querySelector(s);
  // Les hauteurs se lisent depuis le haut du dessin : un défilement de la page (le clic d'un jour) ne compte pas pour un saut.
  const oy = q('.pq-dry-svg')?.getBoundingClientRect().y ?? 0;
  const b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y - oy, w: r.width, h: r.height, r: r.right, b: r.bottom - oy }; };
  const cels = Object.fromEntries(['amer', 'creep', 'limite'].map((k) => [k, b(q(`[data-froid="${k}"]`))]));
  const feuille = b(q('[data-froid-feuille]'));
  const legende = [...document.querySelectorAll('.pq-dry-svg text.pq-dry-lb')].find((t) => /levure active/.test(t.textContent));
  const ibu = q('.pq-dry-svg [data-role="bande-ibu"]');
  return {
    cels, feuille, rail: b(q('.pq-dry-rail')), legende: b(legende), ibu: b(ibu), bars: b(q('.pq-dry-bars')),
    pied: b(q('[data-pied="annuler"]')), svg: b(q('.pq-dry-svg')),
    texte: Object.fromEntries(['amer', 'creep', 'limite'].map((k) => [k, (q(`[data-froid="${k}"]`)?.textContent ?? '').replace(/\s+/g, ' ').trim()])),
    pictos: document.querySelectorAll('[data-froid="limite"] svg[data-famille]').length,
    colonnes: document.querySelectorAll('[data-froid="limite"] [data-froid-colonne]').length,
    points: q('[data-froid="creep"]')?.getAttribute('data-points') ?? null,
    jauge: q('[data-froid="creep"] [data-froid-jauge]')?.getAttribute('data-froid-jauge') ?? null,
    feuilleTexte: (q('[data-froid-feuille]')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    dessus: document.querySelectorAll('[data-froid]').length,
  };
};
const croise = (a, c) => a && c && a.x < c.r - 0.5 && c.x < a.r - 0.5 && a.y < c.b - 0.5 && c.y < a.b - 0.5;

// 1. Au repos : « après · 3 j ».
const repos = await page.evaluate(MESURE);
await page.screenshot({ path: path.join(SORTIE, 'repos.png') });
const noms = ['amer', 'creep', 'limite'];
for (const k of noms) if (!repos.cels[k] || repos.cels[k].w < 20 || repos.cels[k].h < 20) ko(`repos : la cellule « ${k} » n'est pas dessinée`);
if (noms.every((k) => repos.cels[k])) {
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (croise(repos.cels[noms[i]], repos.cels[noms[j]])) ko(`repos : « ${noms[i]} » chevauche « ${noms[j]} »`);
  for (const k of noms) {
    const c = repos.cels[k];
    if (repos.legende && croise(c, repos.legende)) ko(`repos : « ${k} » chevauche la légende « levure active »`);
    if (c.b > repos.rail.y + 0.5) ko(`repos : « ${k} » descend sur le rail (bas ${c.b.toFixed(1)} > rail ${repos.rail.y.toFixed(1)})`);
    if (repos.ibu && c.y < repos.ibu.b - 4) ko(`repos : « ${k} » recouvre la bande IBU (haut ${c.y.toFixed(1)} < bas de la bande ${repos.ibu.b.toFixed(1)})`);
    if (repos.legende && c.r > repos.legende.x + 0.5) ko(`repos : « ${k} » dépasse à droite sur la légende (${c.r.toFixed(1)} > ${repos.legende.x.toFixed(1)})`);
  }
  // Les mots : l'amertume dit « ? » (signe non établi) et trois nombres, le creep « moyen », la limite 4 pictos.
  if (!/amer\s*\?/.test(repos.texte.amer)) ko(`repos : la cellule amertume ne dit pas « amer ? » (${repos.texte.amer})`);
  if (!/22/.test(repos.texte.amer) || !/28/.test(repos.texte.amer) || !/34/.test(repos.texte.amer)) ko(`repos : la plage d'amertume ne porte pas 22, 28 et 34 (${repos.texte.amer})`);
  if (!/moyen/.test(repos.texte.creep) || repos.jauge !== '2') ko(`repos : le creep n'est pas « moyen » sur 2 crans (${repos.texte.creep}, jauge ${repos.jauge})`);
  if (repos.pictos !== 4 || repos.colonnes !== 4) ko(`repos : la limite montre ${repos.pictos} pictos et ${repos.colonnes} colonnes (attendu 4 et 4 : végétal, herbacé, résineux, floral)`);
}

// 2. Les trois feuilles : un toucher ouvre, la feuille repousse le rail et ne le recouvre pas ; le second toucher referme.
const hauteurRepos = repos.rail?.y ?? 0;
for (const k of noms) {
  if (!repos.cels[k]) continue;
  await page.click(`[data-froid="${k}"]`);
  await dormir(300);
  const o = await page.evaluate(MESURE);
  await page.screenshot({ path: path.join(SORTIE, `ouvert-${k}.png`) });
  if (!o.feuille) { ko(`${k} : le toucher n'ouvre aucune feuille`); continue; }
  if (o.rail.y < hauteurRepos + o.feuille.h - 1) ko(`${k} : la feuille ne repousse pas le rail (rail ${o.rail.y.toFixed(1)} pour ${hauteurRepos.toFixed(1)} + ${o.feuille.h.toFixed(1)})`);
  if (croise(o.feuille, o.rail)) ko(`${k} : la feuille recouvre le rail`);
  for (const c of noms) if (croise(o.feuille, o.cels[c])) ko(`${k} : la feuille recouvre la cellule « ${c} »`);
  if (!/^.{8,}/.test(o.feuilleTexte)) ko(`${k} : feuille vide`);
  if (k === 'amer' && o.feuilleTexte.split(' ').length > 45) ko(`amer : la feuille fait ${o.feuilleTexte.split(' ').length} mots (45 au plus)`);
  if (k === 'amer' && !/Signe non établi/.test(o.feuilleTexte)) ko('amer : la feuille ne dit pas « Signe non établi »');
  if (k === 'creep' && !/convention/.test(o.feuilleTexte)) ko('creep : la feuille ne dit pas que le niveau est une convention');
  if (k === 'creep' && !/ce brassin : \?/.test(o.feuilleTexte)) ko('creep : l\'ampleur pour ce brassin n\'est pas « ? »');
  await page.click(`[data-froid="${k}"]`);
  await dormir(250);
  const f = await page.evaluate(MESURE);
  if (f.feuille) ko(`${k} : le second toucher ne referme pas la feuille`);
  if (Math.abs(f.rail.y - hauteurRepos) > 0.5) ko(`${k} : le rail ne revient pas à sa place (${f.rail.y.toFixed(1)} pour ${hauteurRepos.toFixed(1)})`);
}

// 3. Les jours : même hauteur, mêmes cellules (les valeurs suivent le jour, la mise en page ne saute pas).
const parJour = {};
for (const j of [1, 2, 3, 7]) {
  await page.click(`.pq-dry-jr [data-jour="${j}"]`);
  await dormir(250);
  const m = await page.evaluate(MESURE);
  parJour[j] = { rail: m.rail?.y, points: m.points, creep: m.texte.creep, amer: m.texte.amer, boites: noms.map((k) => m.cels[k] && [m.cels[k].x, m.cels[k].y, m.cels[k].w, m.cels[k].h].map((v) => Math.round(v * 10) / 10)) };
  if (!m.cels.amer) { ko(`${j} j : les cellules disparaissent`); continue; }
  if (Math.abs(m.rail.y - hauteurRepos) > 0.5) ko(`${j} j : saut de mise en page (rail ${m.rail.y.toFixed(1)} pour ${hauteurRepos.toFixed(1)})`);
  for (const k of noms) if (m.cels[k].h !== repos.cels[k].h || m.cels[k].w !== repos.cels[k].w) ko(`${j} j : la cellule « ${k} » change de taille`);
}
// Le creep suit le jour : 7 j compte 1 point de plus que 3 j (durée ≥ 7 j, H68) ; sinon le jour tenu n'est pas lu.
if (!(Number(parJour[7].points) > Number(parJour[3].points))) ko(`le creep ne suit pas le jour : ${parJour[3].points} point(s) à 3 j, ${parJour[7].points} à 7 j (attendu plus à 7 j)`);

// 4. Aux moments chauds, l'écran reste A (aucune cellule dessinée), mais la place des cellules est réservée : le rail est ce que son
// doigt glisse, il ne bouge pas de plus d'1 px d'une étape à l'autre (D149 : un rail qui bouge sous le doigt est refusé).
const chaud = {};
for (const [seg, nom] of [[0, 'ébullition'], [1, 'whirlpool'], [2, 'actif'], [3, 'après']]) {
  await page.click(`.pq-dry-seg [data-etape="${seg}"]`);
  await dormir(400);
  const m = await page.evaluate(MESURE);
  chaud[nom] = { dessus: m.dessus, rail: m.rail?.y };
  if (seg === 0) await page.screenshot({ path: path.join(SORTIE, 'ebullition.png') });
  if (seg < 2 && m.dessus) ko(`${nom} : ${m.dessus} élément(s) de froid dessinés (attendu aucun)`);
  if (seg >= 2 && !m.dessus) ko(`${nom} : les mini graphes manquent au dry hop`);
  if (m.rail == null || Math.abs(m.rail.y - hauteurRepos) > 1) ko(`${nom} : le rail est à ${m.rail?.y?.toFixed(1)} px du haut du dessin, pas à ${hauteurRepos.toFixed(1)} (±1 px) : il bouge sous le doigt`);
}
await page.click('.pq-dry-seg [data-etape="3"]');
await dormir(400);

// 5. La bulle du pouce (« ● 3 j ») tient entre le rail et la rangée des jours, sans toucher aucun bouton (le brasseur, 26.10 : « Pas
// super la superposition ici » ; sa maquette p4b2f : la bulle suit le pouce, à environ 2 px au-dessus de la rangée). Lue sans toucher
// le rail ; 390 et 1280 px ; ébullition, actif et après ; 1, 2, 3 et 7 j.
const BULLE = () => {
  const b = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, r: r.right, b: r.bottom }; };
  const pl = document.querySelector('.pq-dry-pl'), rail = document.querySelector('.pq-dry-rail');
  return { bulle: pl ? b(pl) : null, rail: rail ? b(rail) : null, jours: [...document.querySelectorAll('.pq-dry-jr button')].map((e) => ({ j: e.getAttribute('data-jour'), ...b(e) })), texte: pl?.textContent.trim() ?? null };
};
const bulles = {};
for (const [largeur, hauteur, mobile] of [[390, 844, true], [1280, 800, false]]) {
  await page.setViewport({ width: largeur, height: hauteur, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  // Changer de gabarit change toute la coquille (téléphone / ordinateur) : on rouvre Dryhopper sur le même brouillon.
  await page.goto(`${base}/?dev-local&etape=houblons&recette=vide`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-role="ligne-houblon"]', { timeout: 120000 });
  await dormir(1000);
  await page.evaluate(() => window.__hopPile.open({ view: 'hopTiming', additionId: 'a2' }));
  await page.waitForSelector('[data-ecran="dryhopper"] [data-bandeau]', { timeout: 120000 });
  await dormir(1500);
  const cas = [['ébullition', 0, null], ...[2, 3].flatMap((seg) => [1, 2, 3, 7].map((j) => [seg === 2 ? 'actif' : 'après', seg, j]))];
  for (const [nom, seg, j] of cas) {
    await page.click(`.pq-dry-seg [data-etape="${seg}"]`);
    if (j) await page.click(`.pq-dry-jr [data-jour="${j}"]`);
    await dormir(250);
    const m = await page.evaluate(BULLE);
    const cle = `${largeur} px, ${nom}${j ? `, ${j} j` : ''}`;
    bulles[cle] = m.bulle && { haut: +m.bulle.y.toFixed(1), bas: +m.bulle.b.toFixed(1), rangee: +Math.min(...m.jours.map((x) => x.y)).toFixed(1), rail: m.rail && +m.rail.b.toFixed(1) };
    if (!m.bulle) { ko(`${cle} : la bulle du pouce est absente`); continue; }
    for (const bt of m.jours) if (croise(m.bulle, bt)) ko(`${cle} : la bulle « ${m.texte} » (${m.bulle.y.toFixed(1)} à ${m.bulle.b.toFixed(1)}) coupe le bouton « ${bt.j} j » (haut ${bt.y.toFixed(1)})`);
    if (m.rail && m.bulle.y < m.rail.b - 1) ko(`${cle} : la bulle remonte sur le rail (haut ${m.bulle.y.toFixed(1)} < bas du rail ${m.rail.b.toFixed(1)})`);
    if (largeur === 390 && nom === 'après' && j === 3) await page.screenshot({ path: path.join(SORTIE, 'bulle-apres-3j.png') });
  }
}
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

const erreurs = journal.erreurs.filter((e) => !/Firestore|firebase|net::ERR/i.test(e));
if (erreurs.length) ko(`erreurs de page : ${erreurs.slice(0, 2).join(' | ')}`);
fs.writeFileSync(path.join(SORTIE, 'bilan.json'), JSON.stringify({ repos, parJour, chaud, bulles }, null, 1) + '\n');
console.log(JSON.stringify({ cellules: repos.cels, texte: repos.texte, parJour }));
await browser.close();
if (echecs.length) { console.log(`FROID ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('FROID OK');
