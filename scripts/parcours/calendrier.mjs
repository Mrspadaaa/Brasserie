#!/usr/bin/env node
// PARCOURS CALENDRIER (20.11) — le Calendrier joué AU DOIGT sur un BUILD, avec des données qui imitent celles du brasseur.
// « le bug fixing a trop focus sur le code et pas assez sur du vrai bug… test de vision, de workflow, d'intégration, d'interaction, de visuel ».
//
//   node scripts/parcours/calendrier.mjs <dossier-captures> [--build <dossier>] [--ref <tag>]
//     sans option : construit l'arbre de travail dans un dossier temporaire (`vite build` avec scripts/parcours/vite.parcours.config.mjs) ;
//     --build     : réutilise un build déjà fait par cette config ;
//     --ref <tag> : construit ce tag dans une copie temporaire (git worktree dans os.tmpdir(), node_modules en jonction, retirée à la fin).
//     --etape <a,b> : seules ces étapes V-CAL (G3, RENOMMER-EVT, C1-GLISSER, D2-CAL, K2, K3-SUITES, TRAVAUX-SANS-MONTANT, CRN-11, CRN-20, CAL-ENTETE), après la fixture.
//     G3_SEMAINE=<n> (variable d'environnement) : G3 ne cherche sa case vide que dans la semaine n (rejouer un cas vu, ex. S2 en 3 mois).
//   Sortie : « PARCOURS CALENDRIER OK » (code 0) ou « PARCOURS CALENDRIER ECHEC » + la liste des échecs (code 1) ; captures dans le dossier.
//
// Le build de test est un build avec `import.meta.env.DEV` vrai : c'est ce qui ouvre `?dev-local` ; la fixture entre par
// `fixtures/entree-app.mjs`, branché par la config Vite de test seulement (rien dans src/, rien dans la livraison, localhost seulement).
// 390×844 tactile (CDP Input.dispatchTouchEvent / touchscreen.tap), jamais element.click().
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--etape'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-calendrier'));
/* `--etape G3,K2` : seules ces étapes V-CAL (21.11) se jouent, après le contrôle de la fixture ; sans option, tout le parcours, puis elles */
const seules = opt('etape') ? opt('etape').split(',').map((x) => x.trim()).filter(Boolean) : null;
const tout = !seules;
const joue = (nom) => !seules || seules.includes(nom);
fs.mkdirSync(sortie, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = []; const notes = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = [];
let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'parcours-build-'));
    aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `parcours-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      /* la configuration Firebase publique (VITE_FIREBASE_*) vit dans des .env non suivis : la copie du tag les reprend, sans quoi l'application ne démarre pas */
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : 'de l\'arbre de travail'} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 500)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) { if (process.env.PARCOURS_GARDER) console.log(`build gardé : ${d}`); else fs.rmSync(d, { recursive: true, force: true }); }
}
for (const n of notes) console.log(`  note : ${n}`);
if (echecs.length) { console.log(`PARCOURS CALENDRIER ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS CALENDRIER OK');

// ───────────── le parcours ─────────────
async function jouer(dir) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-calendrier`;
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  try {
    const p = await nav.newPage();
    await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    /* aujourd'hui à Zurich, comme l'app (feda55906 pour l'outil e2e) : en UTC, entre minuit et 1 h, c'était la veille ; un lundi, la fixture partait
       d'une semaine trop tôt (23.11, 00:50 : vert par chance, rouge à 01:10 sur le même commit) */
    const aujourdhui = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
    const fx = fixtureCalendrier(aujourdhui);
    await p.evaluateOnNewDocument((j) => { if (!localStorage.getItem('parcours-calendrier:fixture')) localStorage.setItem('parcours-calendrier:fixture', j); }, JSON.stringify(fx.entrees));
    const erreursPage = []; p.on('pageerror', (e) => erreursPage.push(String(e).slice(0, 200))); p.on('console', (m) => { if (m.type() === 'error') erreursPage.push(`console: ${m.text().slice(0, 240)}`); });
    const cdp = await p.createCDPSession();
    const cap = (nom) => p.screenshot({ path: path.join(sortie, `${nom}.png`) });

    // gestes
    const point = (sel, i = 0) => p.evaluate((s, i) => { const e = [...document.querySelectorAll(s)][i]; if (!e) return null; e.scrollIntoView({ block: 'center', inline: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height]; }, sel, i);
    const visibleParTexte = (txt, { prefixe = false, dans = 'button,[role=button],[role=menuitem],[role=option],[role=tab],[data-chose-id],[data-barre],[data-poignee]', i = 0 } = {}) => p.evaluate((t, p0, d, i) => {
      const n = (s) => String(s).replace(/\s+/g, ' ').trim();
      const e = [...document.querySelectorAll(d)].filter((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; const l = e.getAttribute('aria-label') ?? ''; const x = n(e.innerText ?? ''); return p0 ? (l.startsWith(t) || x.startsWith(t)) : (l === t || x === t); })[i];
      if (!e) return null; let r = e.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 70 || r.left < 0 || r.right > innerWidth) { e.scrollIntoView({ block: 'center', inline: 'center' }); r = e.getBoundingClientRect(); } return [r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, r.left, r.right];
    }, txt, prefixe, dans, i);
    async function toucher(txt, o = {}) {
      if (!(await visibleParTexte(txt, o))) throw new Error(`introuvable : « ${txt} »`);
      await sleep(120); const c = await visibleParTexte(txt, o); await p.touchscreen.tap(c[0], c[1]); await sleep(650);
    }
    async function glisser([x0, y0], [x1, y1], pas = 14) {
      const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, y0) });
      await sleep(60);
      for (let k = 1; k <= pas; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + ((x1 - x0) * k) / pas, y0 + ((y1 - y0) * k) / pas) }); await sleep(16); }
      await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(700);
    }
    /** La fenêtre de la frise : première et dernière semaine, largeur de colonne, bords. */
    const fenetreLue = () => p.evaluate(() => {
      const s = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; const f = document.querySelector('[data-frise]')?.getBoundingClientRect();
      const col = s.length > 1 ? s[1].getBoundingClientRect().x - s[0].getBoundingClientRect().x : 26;
      const l = Math.max(0, f?.left ?? 0), r = Math.min(innerWidth, f?.right ?? innerWidth);
      return { col, n: s.length, left: l, right: r, txt: `S${s[0]?.getAttribute('data-semaine')}–S${s.at(-1)?.getAttribute('data-semaine')} (${s.length} col. de ${col.toFixed(1)} px, ${Math.round(l)}–${Math.round(r)})` };
    });
    /**
     * Le point de prise d'une barre `b` ([cx, cy, w, h]) et celui du lâcher, pour la glisser de `n` colonnes sans que le doigt entre dans la
     * bande de défilement (R7 : 40 px de chaque bord de la frise ; y lâcher le doigt fait défiler la fenêtre, comme le veut la frise B).
     * Prise au centre moins 10 px si possible, sinon décalée dans la barre (6 px de son bord au moins) ; marge de 8 px avant la bande.
     */
    const prise = (b, n, f) => {
      const BANDE = 40 + 8, dx = n * f.col, gauche = b[0] - b[2] / 2 + 6, droite = b[0] + b[2] / 2 - 6;
      let x0 = b[0] - Math.min(b[2] / 2 - 6, 10);
      if (x0 + dx > f.right - BANDE) x0 = f.right - BANDE - dx;
      if (x0 + dx < f.left + BANDE) x0 = f.left + BANDE - dx;
      x0 = Math.max(gauche, Math.min(droite, x0));
      return [x0, x0 + dx];
    };
    const labelDe = (prefixe) => p.evaluate((t) => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => x.getAttribute('aria-label').startsWith(t) && x.getBoundingClientRect().width > 0); return e ? e.getAttribute('aria-label') : null; }, prefixe);
    const semaineDe = (l) => { const m = /, S(\d+)/.exec(l ?? ''); return m ? Number(m[1]) : null; };
    const fermer = async () => { for (const t of ['Fermer', '×']) { if (await visibleParTexte(t).catch(() => null)) { await toucher(t).catch(() => {}); } } };
    async function versCalendrier(troisMois = true) {
      await p.waitForSelector('nav button', { timeout: 90000 }).catch(async (e) => { await cap('erreur-demarrage').catch(() => {}); throw new Error(`l'application ne démarre pas (${e.message.slice(0, 60)}) ; page : « ${(await p.evaluate(() => document.body.innerText.replace(/s+/g, ' ').slice(0, 160)).catch(() => '?'))} » ; erreurs : ${erreursPage.slice(0, 2).join(' | ')}`); });
      if (!(await p.$('[data-calendrier]'))) await toucher('Calendrier');
      await p.waitForSelector('[data-calendrier]', { timeout: 30000 });
      if (troisMois) { const m = await point('[aria-label$="période, liste, tri et filtre"]'); if (!m) throw new Error('bouton du menu de période introuvable'); await sleep(100); await p.touchscreen.tap(m[0], m[1]); await sleep(650); await toucher('3 mois'); await sleep(500); }
    }
    /* CAL-PERIODE-APP-FIXE : la fenêtre locale revient telle quelle au rechargement, et c'est elle qu'on relit. La rechoisir en « 3 mois » la
       raccourcissait depuis son début : après le recul de l'étape 4 (S44 → S40, 17 sem.), S40–S52 ; en fin de mois (le 23.11 : « Nov. » part
       de S44, aujourd'hui S48), la barre glissée en S53 et le Marché de Noël (S53) sortaient de l'écran, lus « absent ». La fenêtre gardée
       se contrôle à chaque rechargement. */
    const recharger = async () => {
      const avant = await fenetreLue();
      await p.goto(url, { waitUntil: 'load' }); await sleep(1200); await versCalendrier(false);
      const apres = (await fenetreLue()).txt;
      /* hors du Calendrier (une autre page ouverte), pas de fenêtre à comparer : le Calendrier rouvert la montre, gardée */
      if (avant.n && apres !== avant.txt) echec('fenêtre gardée au rechargement', `${avant.txt} avant, ${apres} après`);
    };

    await p.goto(url, { waitUntil: 'load' });
    await versCalendrier();
    await cap('01-calendrier-3mois');

    // 0. l'écran est celui de sa fixture (sinon tout le reste est vide) : un brassin, une fête, un papier
    const presents = await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')));
    for (const t of ['Fruty,', 'Marché de Noël,', 'lol,', 'Hotte,', 'Café du Pont,', 'Commande de malt,']) if (!presents.some((l) => l.startsWith(t))) echec('fixture', `« ${t} » absent de l'écran (3 mois)`);

    // 1. aucune ligne en double (le brasseur : « Emballage · Jhhh » deux fois) : hors Brassins, un même titre n'apparaît qu'une fois par rangée
    if (tout) {
      const lignes = await p.evaluate(() => [...document.querySelectorAll('[data-rangee]')].map((r) => ({ rangee: r.getAttribute('data-rangee'), titres: [...r.querySelectorAll('[aria-label]')].filter((e) => e.getBoundingClientRect().width > 0 && /, (S\d+|\d+ \S+)/.test(e.getAttribute('aria-label'))).map((e) => e.getAttribute('aria-label')) })));
      const doubles = [];
      for (const r of lignes) {
        const compte = new Map();
        for (const l of r.titres) { const cle = /brassin/i.test(r.rangee ?? '') ? l : l.split(',')[0]; compte.set(cle, (compte.get(cle) ?? 0) + 1); }
        for (const [k, n] of compte) if (n > 1) doubles.push(`${r.rangee} › ${k.slice(0, 50)} ×${n}`);
      }
      doubles.length ? echec('ligne en double', doubles.join(' ; ')) : ok('ligne en double', 'aucune');
      const brut = await p.evaluate(() => [...document.querySelectorAll('[data-chose-id]')].map((e) => e.getAttribute('data-chose-id')));
      const idsDoubles = brut.filter((x, i) => brut.indexOf(x) !== i);
      if (idsDoubles.length) echec('ligne en double', `même data-chose-id deux fois : ${[...new Set(idsDoubles)].join(', ')}`);
    }

    // 2. la courbe sous la ligne zéro (solde de départ négatif)
    if (tout) {
      const m = await p.evaluate(() => ({ zero: document.querySelectorAll('[data-ligne-zero]').length, sous: document.querySelectorAll('[data-sous-zero]').length,
        solde: (document.querySelector('[data-calendrier-entete]')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 60) }));
      (m.zero > 0 && m.sous > 0) ? ok('courbe sous zéro', `ligne zéro ${m.zero}, zone sous zéro ${m.sous} (« ${m.solde} »)`) : echec('courbe sous zéro', `solde négatif (« ${m.solde} ») mais ligne zéro ${m.zero}, zone sous zéro ${m.sous}`);
    }

    // 3. le menu de période (dans l'écran)
    if (tout) {
      { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await p.touchscreen.tap(m[0], m[1]); await sleep(650); }
      const r = await p.evaluate(() => { const m = document.querySelector('[data-menu-periode]'); if (!m) return null; const b = m.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), W: innerWidth }; });
      await cap('02-menu-periode');
      if (!r) echec('menu de période', 'introuvable ([data-menu-periode])');
      else (r.left >= 0 && r.right <= r.W) ? ok('menu de période', `${r.left}–${r.right} sur ${r.W}`) : echec('menu de période', `déborde : ${r.left}–${r.right} sur ${r.W}`);
      await toucher('3 mois'); await sleep(400);
    }

    // 4. la frise du haut recule de 4 semaines au doigt (poignée de début saisissable, même au début de la frise)
    if (tout) {
      const lireDebut = () => p.evaluate(() => { const e = [...document.querySelectorAll('[aria-label^="Poignée de début"]')][0]; const m = e && /commence en S(\d+)/.exec(e.getAttribute('aria-label')); return m ? Number(m[1]) : null; });
      const avant = await lireDebut();
      const poi = await point('[aria-label^="Poignée de début"]');
      const frise = await p.evaluate(() => { const e = document.querySelector('[data-ent-periode]'); const r = e?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; });
      if (avant === null || !poi || !frise) echec('frise du haut (reculer)', 'poignée de début introuvable');
      else {
        const vue = await p.evaluate(() => { const e = document.querySelector('[aria-label^="Poignée de début"]'); const r = e.getBoundingClientRect(); return { x: r.x, w: r.width, W: innerWidth }; });
        await glisser([poi[0], poi[1]], [poi[0] - frise.w / 2, poi[1]]); /* R6 (d5fae0f37) : le début s'étire seul, après 6 px de seuil : un demi-bandeau pour reculer d'au moins 3 semaines */
        const apres = await lireDebut(); await cap('03-frise-reculee');
        const recul = apres === null ? null : ((avant - apres) + 53) % 53;
        (recul !== null && recul >= 3 && recul <= 53 - 40) || (recul !== null && recul >= 3 && recul < 20)
          ? ok('frise du haut (reculer)', `S${avant} → S${apres} (poignée x ${Math.round(vue.x)}, ${Math.round(vue.w)} px)`)
          : echec('frise du haut (reculer)', `glisser la poignée de début de ${Math.round(frise.w / 2)} px vers la gauche : S${avant} → S${apres} (recul ${recul}, 3 au moins attendu ; poignée x ${Math.round(vue.x)}, ${Math.round(vue.w)} px)`);
      }
    }

    // 5. glisser une barre de 4 semaines vers le passé, puis vers le futur ; Annuler ; relu après rechargement
    if (tout) {
      const colonne = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; if (b.length > 1) return b[1].getBoundingClientRect().x - b[0].getBoundingClientRect().x; const f = document.querySelector('[data-frise]'); const n = Number(f?.getAttribute('data-nb-colonnes') ?? 13); return f ? f.getBoundingClientRect().width / n : 26; });
      async function essai(titre, semaines, nom) {
        const avant = await labelDe(`${titre},`); const sa = semaineDe(avant);
        if (sa === null) { echec(nom, `« ${titre} » introuvable à l'écran`); return null; }
        const c = await point(`[aria-label^="${titre},"]`);
        await p.evaluate((t) => { document.querySelector(`[aria-label^="${t},"]`)?.scrollIntoView({ block: 'center' }); }, titre);
        const c2 = await point(`[aria-label^="${titre},"]`);
        const f0 = await fenetreLue();
        const [x0, x1] = prise(c2, semaines, { ...f0, col: colonne });
        await glisser([x0, c2[1]], [x1, c2[1]]);
        const apres = await labelDe(`${titre},`); const sb = semaineDe(apres);
        const dif = sb === null ? null : ((sb - sa) + 53) % 53;
        const voulu = semaines < 0 ? 53 + semaines : semaines;
        const bon = dif !== null && Math.abs(dif - voulu) <= 1;
        bon ? ok(nom, `« ${titre} » S${sa} → S${sb}`) : echec(nom, `« ${titre} » glissé de ${semaines} semaines (${Math.round(semaines * colonne)} px, doigt ${Math.round(x0)} → ${Math.round(x1)}) : S${sa} → S${sb ?? '(absent)'} (${dif} au lieu de ${voulu}±1) ; fenêtre avant ${f0.txt}, après ${(await fenetreLue()).txt} ; avant « ${avant?.slice(0, 60)} », après « ${apres?.slice(0, 60) ?? 'absent'} »`);
        return { sa, sb, bon };
      }
      const passe = await essai('Hefe', -4, 'glisser une barre 4 semaines au passé');
      await cap('04-barre-passe');
      if (await visibleParTexte('Annuler').catch(() => null)) {
        await toucher('Annuler'); const l = await labelDe('Hefe,');
        passe && semaineDe(l) === passe.sa ? ok('Annuler (passé)', `S${semaineDe(l)}`) : echec('Annuler (passé)', `après Annuler : « ${l?.slice(0, 50)} », S${passe?.sa} attendu`);
      } else echec('Annuler (passé)', 'aucun bouton Annuler après le glisser');
      const futur = await essai('Blonde d’automne', 4, 'glisser une barre 4 semaines au futur');
      await cap('05-barre-futur');
      if (futur?.bon) { await recharger(); const l = await labelDe('Blonde d’automne,'); semaineDe(l) === futur.sb ? ok('relu après rechargement (barre)', `S${semaineDe(l)}`) : echec('relu après rechargement (barre)', `S${futur.sb} écrit, relu « ${l?.slice(0, 50) ?? 'absent'} » ; fenêtre ${(await fenetreLue()).txt}`); }
    }

    // 6. la date de chaque type, changée par la feuille (Modifier › semaine précédente › Enregistrer), relue après rechargement
    if (tout) await recharger();
    if (tout) for (const [type, titre] of [['brassin', 'Fruty'], ['fête', 'Marché de Noël'], ['vente', 'Café du Pont'], ['achat', 'Commande de malt'], ['papier', 'lol'], ['travaux', 'Hotte'], ['idée', 'IPA brume']]) {
      const nom = `date ${type}`;
      try {
        await fermer();
        const avant = await labelDe(`${titre},`);
        if (!avant) { type === 'idée' ? notes.push(`idée « ${titre} » : pas d'élément nommé à l'écran en 3 mois (icône de semaine) : date non jouée`) : echec(nom, `« ${titre} » introuvable (fenêtre ${(await fenetreLue()).txt})`); continue; }
        await toucher(`${titre},`, { prefixe: true });
        if (!(await visibleParTexte('Modifier'))) { type === 'brassin' || type === 'idée' ? notes.push(`${type} : pas de bouton Modifier (date réglée par le glisser ${type === 'brassin' ? '(joué plus haut)' : ': aucun geste'})`) : echec(nom, 'pas de bouton Modifier'); continue; }
        await toucher('Modifier');
        /* feuille d'ajout à la frise (1bdd349db, 40fff908a, a9d6e79f6) : plus de puces de semaines ; la date se change par la rangée des jours
           (« Jour » pour une date seule, « Jour du début » pour une fenêtre) : le geste du brasseur reste de toucher un autre jour, et Enregistrer */
        const posJour = (voulu) => p.evaluate((v) => {
          const g = document.querySelector('[role=dialog] [data-feuille-jours="debut"]') ?? document.querySelector('[role=dialog] [data-feuille-jours]'); if (!g) return null;
          g.scrollIntoView({ block: 'center' });
          const l = [...g.querySelectorAll('[data-jour]')], i = l.findIndex((x) => x.getAttribute('aria-pressed') === 'true'); if (i < 0) return null;
          const n = v ? l.find((x) => x.getAttribute('data-jour') === v) : [l[i + 1], l[i - 1]].find((x) => x && !x.disabled); if (!n) return null;
          const r = n.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, jour: n.getAttribute('data-jour'), de: l[i].getAttribute('data-jour') };
        }, voulu);
        const cible = await posJour(null);
        if (!cible) { echec(nom, 'rangée des jours de la feuille introuvable (ou aucun autre jour à toucher)'); continue; }
        await sleep(150);
        const c2 = await posJour(cible.jour);
        await p.touchscreen.tap(c2.x, c2.y); await sleep(400);
        if (type === 'fête') await cap('06-feuille-modifier');
        await toucher('Enregistrer'); await sleep(900);
        const apres = await labelDe(`${titre},`);
        if (!apres || apres === avant) { await cap(`06-echec-${type}`); echec(nom, `jour ${cible.de} → ${cible.jour} demandé, l'élément n'a pas changé : « ${apres?.slice(0, 90) ?? 'absent'} »`); continue; }
        await recharger(); const relu = await labelDe(`${titre},`);
        relu === apres ? ok(nom, `${cible.de} → ${cible.jour}, relu : « ${relu.split(',').slice(0, 3).join(',')} »`) : echec(nom, `écrit « ${apres.split(',').slice(0, 3).join(',')} », relu après rechargement « ${relu?.split(',').slice(0, 3).join(',') ?? 'absent'} »`);
      } catch (e) { echec(nom, String(e.message).slice(0, 200)); }
    }

    // 7. la frise de période (Header › « Période … Choisir la plage », au Calendrier puis à Finances : même composant, même CSS) : poignées entièrement visibles, de 44 px
    if (tout) for (const ecran of ['Calendrier', 'Finances']) try {
      await fermer(); if (ecran === 'Finances') { await toucher('Finances'); await sleep(900); } await toucher('Période :', { prefixe: true }); await sleep(500); await cap(ecran === 'Finances' ? '07-frise-periode-finances' : '07-frise-periode');
      const poignees = await p.evaluate(() => [...document.querySelectorAll('[role=dialog] [data-poignee], [role=dialog] [role=slider], [aria-label*="oignée"]')].filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('[data-calendrier-entete]')).map((e) => { const r = e.getBoundingClientRect(); return { n: e.getAttribute('aria-label') ?? e.getAttribute('data-poignee'), x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), W: innerWidth }; }));
      if (poignees.length < 2) echec(`frise de période (${ecran})`, `${poignees.length} poignée(s) trouvée(s) (2 attendues)`);
      for (const q of poignees) (q.x >= 0 && q.x + q.w <= q.W && q.w >= 44 && q.h >= 44) ? ok(`frise de période (${ecran})`, `poignée « ${q.n?.slice(0, 30)} » x ${q.x}, ${q.w}×${q.h}`) : echec(`frise de période (${ecran})`, `poignée « ${q.n?.slice(0, 30)} » x ${q.x}, ${q.w}×${q.h} sur ${q.W} (entière dans l'écran et 44 px au moins attendus)`);
      await fermer(); await p.keyboard.press('Escape'); await sleep(300);
    } catch (e) { echec(`frise de période (${ecran})`, String(e.message).slice(0, 200)); }

    // 8. « Plus de détails » / ouvrir : jamais l'ancien Atelier (CreativeLabTab)
    if (tout) try {
      await versCalendrier(false); await fermer();
      for (const [titre, bouton] of [['Marché de Noël,', 'Ouvrir dans l’agenda'], ['Fruty,', 'Ouvrir le brassin']]) {
        /* CAL-PERIODE-APP-FIXE (22.11) : la fenêtre du Calendrier repart de la période de l'app à chaque ouverture ; la chose se rejoint par › (4 pas au plus) */
        for (let n = 0; n < 4 && !(await visibleParTexte(titre, { prefixe: true })); n++) {
          const c = await p.evaluate(() => { const e = document.querySelector('button[aria-label="Période suivante"]'); if (!e || e.disabled) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
          if (!c) break; await p.touchscreen.tap(c[0], c[1]); await sleep(900);
        }
        await toucher(titre, { prefixe: true });
        const b = await visibleParTexte(bouton, { prefixe: true });
        if (!b) {
          // 945655a90 (voie R) : une fête ouvre sa feuille sur place (Modifier), plus « Ouvrir dans l'agenda » : c'est le choix, pas un manque
          if (bouton === 'Ouvrir dans l’agenda' && await visibleParTexte('Modifier')) ok('Plus de détails', `${titre.slice(0, -1)} : Modifier sur place, plus d'« Ouvrir dans l'agenda » (945655a90)`);
          else notes.push(`« ${bouton} » absent sur ${titre}`);
          await fermer(); continue;
        }
        await toucher(bouton, { prefixe: true }); await sleep(900);
        const t = await p.evaluate(() => [...document.querySelectorAll('h1,h2,[role=heading]')].map((h) => h.innerText.trim()).filter(Boolean).slice(0, 6));
        /^atelier/i.test(t.join(' ')) || t.some((x) => /^Atelier/i.test(x)) ? echec('Plus de détails', `${bouton} (${titre}) monte l'ancien Atelier : ${t.join(' | ')}`) : ok('Plus de détails', `${bouton} → ${t.join(' | ').slice(0, 60) || '(écran sans titre)'}`);
        await cap(`08-ouvrir-${titre.slice(0, 4)}`);
        await p.goBack().catch(() => {}); await sleep(900);
        if (!(await p.$('[data-calendrier]'))) {
          echec('retour au Calendrier (CT4A-12)', `après « ${bouton} », le retour n'amène pas au Calendrier (page : ${p.url().slice(0, 50) || 'vide'})`);
          // le retour a pu sortir de l'application (page blanche) : on repart de l'URL, sinon les étapes suivantes ne démarrent plus
          if (!p.url().startsWith(url.split('?')[0])) { await p.goto(url, { waitUntil: 'load' }); await sleep(1200); }
          await versCalendrier(false).catch(() => {});
        }
        await fermer();
      }
    } catch (e) { echec('Plus de détails', String(e.message).slice(0, 200)); }

    // 9. l'écran contre sa maquette choisie (scripts/agents/controle-base.mjs de Brasserie, chantier « calendrier »)
    if (tout) try {
      await versCalendrier(); await fermer(); await sleep(400);
      // page vivante : le + volant (G7), la première barre (G8), les filtres de premier plan (G3), puis le menu (G4 : « Trier les rangées »)
      const live = {};
      const mes = await p.evaluate(() => {
        const H = innerHeight, W = innerWidth, nav = document.querySelector('nav.nav-principale, nav'); const navTop = nav ? nav.getBoundingClientRect().top : H;
        const fixes = [...document.querySelectorAll('button,a,[role=button]')].filter((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (c.position === 'fixed' || (e.closest('div') && getComputedStyle(e.closest('div')).position === 'fixed')) && !e.closest('nav'); })
          .map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText ?? '').trim().slice(0, 12), l: (e.getAttribute('aria-label') ?? '').slice(0, 30), cx: Math.round(r.left + r.width / 2), bas: Math.round(navTop - r.bottom), w: Math.round(r.width) }; });
        const barres = [...document.querySelectorAll('[data-chose-id]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getBoundingClientRect().top).filter((t) => t > 0);
        return { H, W, navTop, fixes, premiere: barres.length ? Math.min(...barres) : null, filtres: document.querySelectorAll('[data-filtre],[class*="chip"]').length };
      });
      const plus = mes.fixes.find((q) => /^\+|ajout|ajouter|rapide|nouveau|cr[ée]er/i.test(`${q.t} ${q.l}`)) ?? mes.fixes.sort((a, b) => a.bas - b.bas)[0];
      live.plus = plus ? { ok: plus.cx > (mes.W * 2) / 3 && plus.bas >= 4 && plus.bas <= 24, detail: `+ « ${plus.t || plus.l} » centre x ${plus.cx}/${mes.W}, ${plus.bas} px au-dessus des onglets (attendu : tiers droit, 4–24 px)` } : { ok: false, detail: 'aucun bouton volant trouvé' };
      live.compact = mes.premiere == null ? { ok: false, detail: 'aucune barre visible' } : { ok: mes.premiere / mes.H <= 0.3, detail: `première barre à ${Math.round(mes.premiere)} px (${Math.round((100 * mes.premiere) / mes.H)} % de ${mes.H}, attendu ≤ 30 %)` };
      live.filtres = `${mes.filtres} filtre(s)/pastille(s) au premier plan ; « Filtrer par type » est dans le menu de période`;
      const m = await point('[aria-label$="période, liste, tri et filtre"]');
      if (m) { await p.touchscreen.tap(m[0], m[1]); await sleep(650); }
      const menu = await p.evaluate(() => { const v = (t) => [...document.querySelectorAll('button,[role=menuitem]')].some((e) => e.getBoundingClientRect().width > 0 && (e.innerText ?? '').trim().startsWith(t)); return { trier: v('Trier les rangées'), filtrer: v('Filtrer par type') }; });
      live.menuTrier = { ok: menu.trier, detail: menu.trier ? '« Trier les rangées » dans le menu de période' : '« Trier les rangées » absent du menu de période' };
      if (menu.filtrer) live.filtres += ' (présent)';
      await p.keyboard.press('Escape'); await sleep(300); await fermer();

      const page = await p.evaluate(() => {
        const css = [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch { return ''; } }).join('\n');
        return `<!doctype html><html lang="fr" ${[...document.documentElement.attributes].map((a) => `${a.name}="${a.value}"`).join(' ')}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="${document.body.className}">${document.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g, '')}</body></html>`;
      });
      const snap = path.join(sortie, 'ecran-calendrier-instantane.html'); fs.writeFileSync(snap, page);
      const brasserie = path.resolve(process.env.BRASSERIE_RACINE ?? path.join(RACINE, '..', 'Brasserie'));
      const cb = path.join(brasserie, 'scripts', 'agents', 'controle-base.mjs');
      if (!fs.existsSync(cb)) notes.push(`controle-base.mjs introuvable (${cb}) : maquette non comparée`);
      else {
        const r = spawnSync(process.execPath, [cb, 'calendrier', snap], { cwd: brasserie, encoding: 'utf8' });
        const sortieCb = (r.stdout + r.stderr).split('\n'); fs.writeFileSync(path.join(sortie, 'controle-base.txt'), sortieCb.join('\n'));
        // Gardes dont l'instantané statique ne peut pas juger (menu fermé, + volant hors du HTML, ordre des rangées de la fixture) :
        // elles se lisent sur la page vivante (live, plus bas). G3 (filtres au premier plan) et G8 (compacité) sont des écarts à décider : notes, KO avec PARCOURS_STRICT=1.
        const ko = sortieCb.filter((l) => /\sKO\s/.test(l));
        const idKo = (l) => (/\sKO\s+(G\d+)/.exec(l) ?? [])[1];
        const vivantes = { G4: live.menuTrier, G7: live.plus, G8: live.compact };
        const reste = ko.filter((l) => !(idKo(l) in vivantes) && idKo(l) !== 'G3');
        for (const l of ko.filter((l) => idKo(l) in vivantes)) { const v = vivantes[idKo(l)]; v.ok ? ok(`maquette choisie (${idKo(l)} lu sur la page vivante)`, v.detail) : echec(`maquette choisie (${idKo(l)})`, v.detail); }
        for (const l of ko.filter((l) => idKo(l) === 'G3')) {
          const msg = `${l.trim().slice(0, 150)} ; vivant : ${live.filtres}`;
          process.env.PARCOURS_STRICT ? echec(`maquette choisie (${idKo(l)})`, msg) : notes.push(`écart à décider, ${msg}`);
        }
        reste.length ? echec('maquette choisie (controle-base)', reste.map((l) => l.trim().slice(0, 110)).join(' ;; ')) : (ko.length === 0 && r.status !== 0 ? echec('maquette choisie (controle-base)', sortieCb.slice(-3).join(' ')) : ok('maquette choisie (controle-base)', `${sortieCb.find((l) => /^BASE/.test(l)) ?? ''} ; ${ko.length - reste.length} garde(s) relue(s) sur la page vivante`));
      }
    } catch (e) { echec('maquette choisie', String(e.message).slice(0, 200)); }

    // 9b. Bugs des workflows du 21.11 (Brasserie work/missions/2026-11-21-workflows-app/SYNTHESE.md § 1) : B8, B9, B11, puis B3.
    if (tout) try { await bugsWorkflows(); } catch (e) { echec('bugs workflows', String(e.message).slice(0, 200)); }
    // 9c. V-CAL (21.11, W0c) : G3, RENOMMER-EVT, C1-GLISSER, D2-CAL, K2, K3-SUITES, TRAVAUX-SANS-MONTANT ; `--etape` les choisit
    try { await etapesVcal(); } catch (e) { echec('V-CAL', String(e.message).slice(0, 200)); }
    async function bugsWorkflows() {
      const pastille = () => p.evaluate(() => (document.querySelector('[data-periode-pastille]')?.innerText ?? '').replace(/\s+/g, ' ').trim());
      const semainesVues = () => p.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => Number(e.getAttribute('data-semaine'))));
      const colonne = () => p.evaluate(() => { const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; return b.length > 1 ? b[1].getBoundingClientRect().x - b[0].getBoundingClientRect().x : 26; });
      const menuDuree = async (nom) => { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await p.touchscreen.tap(m[0], m[1]); await sleep(650); await toucher(nom); await sleep(500); };
      // chaque étape part de la période par défaut (« ce mois »), quelle que soit celle laissée par les étapes d'avant
      const periodeNeuve = () => p.evaluate(() => { for (const k of Object.keys(localStorage)) { try { const o = JSON.parse(localStorage.getItem(k)); if (o && typeof o === 'object' && 'app_global_time_filter' in o) { delete o.app_global_time_filter; localStorage.removeItem('laffinee.calendrier.fenetre-locale'); localStorage.setItem(k, JSON.stringify(o)); } } catch { /* pas du JSON */ } } });
      const recharger = async () => { await periodeNeuve(); await p.goto(url, { waitUntil: 'load' }); await sleep(1200); await versCalendrier(); };

      // B8 / WFP-3 : une barre lâchée une semaine avant la semaine courante se dessine là où le doigt l'a lâchée (pas sur aujourd'hui)
      await recharger(); await fermer();
      {
        const poi = await point('[aria-label^="Poignée de début"]');
        const frise = await p.evaluate(() => { const r = document.querySelector('[data-ent-periode]')?.getBoundingClientRect(); return r ? r.width : 0; });
        if (poi && frise) await glisser([poi[0], poi[1]], [poi[0] - frise / 4, poi[1]]);
        const vues = await semainesVues();
        const titre = 'Blonde d’automne';
        const avant = await labelDe(`${titre},`); const sa = semaineDe(avant);
        const courante = await p.evaluate(() => Number(document.querySelector('[data-bande-semaines] [data-courant="oui"]')?.getAttribute('data-semaine') ?? NaN));
        const cible = courante === 1 ? 52 : courante - 1;
        if (sa === null || !vues.includes(cible)) echec('B8 barre au passé', `préalable : « ${titre} » ${avant ? `en S${sa}` : 'absente'}, S${cible} ${vues.includes(cible) ? 'visible' : `hors des semaines vues (${vues.join(',')})`}`);
        else {
          const ecart = ((cible - sa) - 53) % 53; // vers le passé, en semaines (négatif)
          await p.evaluate((t) => { document.querySelector(`[aria-label^="${t},"]`)?.scrollIntoView({ block: 'center' }); }, titre);
          const c = await point(`[aria-label^="${titre},"]`); const col = await colonne();
          const x0 = c[0] - Math.min(c[2] / 2 - 6, 10);
          await glisser([x0, c[1]], [x0 + ecart * col, c[1]]);
          const apres = await labelDe(`${titre},`); const sb = semaineDe(apres);
          await cap('09b-b8-barre-semaine-passee');
          sb === cible ? ok('B8 barre au passé', `« ${titre} » S${sa} → S${sb}, dessinée où le doigt l'a lâchée`)
            : echec('B8 barre au passé', `« ${titre} » lâchée en S${cible} (semaine avant la courante S${courante}), dessinée en S${sb ?? '(absente)'} : « ${apres?.slice(0, 70)} »`);
          if (await visibleParTexte('Annuler').catch(() => null)) await toucher('Annuler');
        }
      }

      // B8 / WFP-4 : un glisser tenu au bord fait défiler la fenêtre, mais la période de l'app ne bouge que par le brasseur (ni après le lâcher, ni au rechargement)
      await recharger(); await fermer();
      {
        const p0 = await pastille();
        // pendant le glisser, la courbe montre l'aperçu (sans cadre ni poignée) : la fenêtre se lit à la première colonne de la bande des semaines
        const debut = () => p.evaluate(() => { const e = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].find((x) => x.getBoundingClientRect().width > 0); return e ? Number(e.getAttribute('data-semaine')) : null; });
        const d0 = await debut();
        const titre = 'Fruty';
        await p.evaluate((t) => { document.querySelector(`[aria-label^="${t},"]`)?.scrollIntoView({ block: 'center' }); }, titre);
        const c = await point(`[aria-label^="${titre},"]`);
        const bord = await p.evaluate(() => { const r = document.querySelector('[data-frise]')?.getBoundingClientRect(); return r ? Math.min(innerWidth, r.right) - 4 : innerWidth - 4; });
        if (!c) echec('B8 période', `« ${titre} » introuvable`);
        else {
          const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
          const x0 = c[0] - Math.min(c[2] / 2 - 6, 10);
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0, c[1]) }); await sleep(60);
          for (let k = 1; k <= 14; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x0 + ((bord - x0) * k) / 14, c[1]) }); await sleep(16); }
          for (let k = 0; k < 16; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(bord - (k % 2), c[1]) }); await sleep(180); }
          const d1 = await debut();
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
          const p1 = await pastille();
          await cap('09b-b8-periode-apres-glisser');
          if (await visibleParTexte('Annuler').catch(() => null)) await toucher('Annuler');
          await p.goto(url, { waitUntil: 'load' }); await sleep(1200); await versCalendrier(false);
          const p2 = await pastille();
          if (d1 === d0) notes.push(`B8 période : la fenêtre n'a pas défilé au bord (S${d0} → S${d1}) : défilement non joué`);
          (p1 === p0 && p2 === p0) ? ok('B8 période', `« ${p0} » après le glisser au bord (fenêtre S${d0} → S${d1}) et après rechargement`)
            : echec('B8 période', `période « ${p0} » devenue « ${p1} » après un glisser au bord (fenêtre S${d0} → S${d1}), « ${p2} » après rechargement`);
        }
      }

      // B9 / WFP-2 : en 6 semaines, la lecture de la courbe au doigt reste dans les semaines montrées
      await recharger(); await fermer();
      {
        await menuDuree('6 sem.');
        const b = await p.$('[data-ent-cacher]');
        if (b && await b.evaluate((e) => e.getAttribute('aria-pressed') === 'true')) { const q = await point('[data-ent-cacher]'); await p.touchscreen.tap(q[0], q[1]); await sleep(700); }
        const vues = await semainesVues();
        const bc = await p.evaluate(() => { const s = document.querySelector('[data-calendrier-entete] .ent-cbz svg'); if (!s) return null; window.scrollTo(0, 0); const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
        if (!bc) echec('B9 lecture de la courbe', 'courbe introuvable');
        else {
          // Hors des poignées (leurs zones de prise de 44 px), le doigt lit ; un départ qui tomberait sur une prise passe juste à côté (D395 :
          // le doigt lit les semaines de la fenêtre sur toute la largeur ; seules les poignées tirent la fenêtre).
          const prises = await p.evaluate(() => [...document.querySelectorAll('[data-calendrier-entete] [data-poignee]')].map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, genre: e.getAttribute('data-poignee') }; }).filter((z) => z.r > z.l));
          // les deux zones se touchent quand la fenêtre est étroite : on sort de leur union, du côté le plus proche qui reste dans la courbe
          const union = prises.length ? { l: Math.min(...prises.map((z) => z.l)), r: Math.max(...prises.map((z) => z.r)) } : null;
          const libre = (x) => (!union || x < union.l - 2 || x > union.r + 2 ? x : (x - union.l < union.r - x && union.l - 6 > bc.x) || union.r + 6 > bc.x + bc.w - 4 ? union.l - 6 : union.r + 6);
          const lu = () => p.evaluate(() => (document.querySelector('[data-calendrier-entete] .ent-lu')?.innerText ?? '').replace(/\s+/g, ' ').trim());
          const lus = [];
          for (const [a, z] of [[0.3, 0.85], [0.1, 0.2], [0.5, 0.6], [0.8, 0.95]]) {
            const x0 = libre(bc.x + bc.w * a), x1 = Math.min(bc.x + bc.w - 2, x0 + bc.w * (z - a));
            await glisser([x0, bc.y + bc.h * 0.55], [x1, bc.y + bc.h * 0.55], 8);
            const t = await lu();
            const m = /S(\d+)/.exec(t); lus.push({ a, z, s: m ? Number(m[1]) : null, t: t.slice(0, 40), x0: Math.round(((x0 - bc.x) / bc.w) * 100) });
            if (a === 0.3) await cap('09b-b9-lecture-courbe');
          }
          const fenetreApres = await semainesVues();
          const dehors = lus.filter((l) => l.s === null || !vues.includes(l.s));
          (dehors.length || fenetreApres.join() !== vues.join()) ? echec('B9 lecture de la courbe', `semaines montrées S${vues[0]}–S${vues[vues.length - 1]} (après : S${fenetreApres[0]}–S${fenetreApres[fenetreApres.length - 1]}) ; lu ${dehors.map((l) => `départ ${l.x0} % : « ${l.t} »`).join(' ; ')}`)
            : ok('B9 lecture de la courbe', `semaines lues ${lus.map((l) => `S${l.s} (départ ${l.x0} %)`).join(', ')} dans S${vues[0]}–S${vues[vues.length - 1]}, hors des ${prises.length} poignées`);
          // et la poignée de fin tire toujours la fenêtre : un départ sur elle ne lit pas, il allonge la fenêtre
          const fin = prises.find((z) => z.genre === 'fin');
          if (!fin) notes.push('B9 : poignée de fin absente (fenêtre en année ?)');
          else {
            await fermer();
            const xf = (fin.l + fin.r) / 2;
            await glisser([xf, bc.y + bc.h * 0.55], [Math.min(bc.x + bc.w - 2, xf + 40), bc.y + bc.h * 0.55], 8);
            await sleep(500);
            const tire = await semainesVues();
            tire.join() !== vues.join() ? ok('B9 poignée de fin', `un départ sur la poignée tire la fenêtre : S${vues[0]}–S${vues[vues.length - 1]} → S${tire[0]}–S${tire[tire.length - 1]}`)
              : echec('B9 poignée de fin', `départ sur la poignée de fin : fenêtre inchangée S${vues[0]}–S${vues[vues.length - 1]}`);
          }
        }
        await fermer();
      }

      // B11 / WFV-3 : la vente encaissée aujourd'hui (caisse : pièce payée + paiement) est une chose de la rangée Ventes
      await recharger(); await fermer();
      {
        const v = await p.evaluate(() => [...document.querySelectorAll('[data-rangee="ventes"] [aria-label], [data-rangee="ventes"][aria-label]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.getAttribute('aria-label')).filter((l) => l.startsWith('Vente 6 × Pale Ale')));
        await cap('09b-b11-rangee-ventes');
        v.length ? ok('B11 vente du jour', `rangée Ventes : « ${v[0].slice(0, 60)} »`) : echec('B11 vente du jour', '« Vente 6 × Pale Ale », encaissée aujourd\'hui, absente de la rangée Ventes');
      }

      // TOUCHER-FANTOME (21.11, tour7) : toucher « La Cigogne, 3 fûts » a ANNULÉ la vente (« Vente annulée · S51 ») : le clic que le navigateur
      // émet après le lâcher tombait sur « Annuler la vente » du détail ouvert sous le doigt. Un toucher qui ouvre un détail ne déclenche jamais
      // ce qui y apparaît : le détail est ouvert, la vente est toujours là, aucun message.
      await recharger(); await fermer();
      {
        const titre = 'La Cigogne, 3 fûts';
        try {
          await toucher(`${titre},`, { prefixe: true });
          await sleep(300);
          const lu = await p.evaluate((t) => ({
            message: [...document.querySelectorAll('[role=status]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '),
            detail: !!document.querySelector(`[aria-label="Détail : ${t}"]`),
            present: [...document.querySelectorAll('[aria-label]')].some((e) => e.getAttribute('aria-label').startsWith(`${t},`))
          }), titre);
          await cap('09b-toucher-fantome');
          const annulee = /annulée|retirée?|supprimée?/i.test(lu.message) || !lu.present;
          if (annulee) {
            echec('TOUCHER-FANTOME', `toucher « ${titre} » a déclenché un bouton du détail ouvert sous le doigt (message : « ${lu.message.slice(0, 70) || 'aucun'} » ; vente ${lu.present ? 'présente' : 'disparue'})`);
            await toucher('Annuler').catch(() => {});
          } else if (!lu.detail) echec('TOUCHER-FANTOME', `toucher « ${titre} » n'ouvre pas son détail (message : « ${lu.message.slice(0, 70) || 'aucun'} »)`);
          else ok('TOUCHER-FANTOME', `détail ouvert, vente intacte${lu.message ? ` (message : « ${lu.message.slice(0, 50)} »)` : ''}`);
        } catch (e) { echec('TOUCHER-FANTOME', String(e.message).slice(0, 120)); }
      }

      // WFV-14 : « Facturer » sur une vente prévue ouvre la caisse, son client choisi (la caisse propose alors d'en solder la promesse, B5),
      // jamais la liste de Finances (« à encaisser 420,00 », aucune vente créée)
      await recharger(); await fermer();
      {
        const titre = 'La Cigogne, 3 fûts';
        try {
          await toucher(`${titre},`, { prefixe: true });
          await cap('09b-wfv14-detail');
          const boutons = await p.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '));
          if (!(await visibleParTexte('Facturer', { prefixe: true }))) throw new Error(`détail de « ${titre} » sans « Facturer » (boutons : ${boutons.slice(0, 100)})`);
          await toucher('Facturer', { prefixe: true });
          const caisse = await p.waitForSelector('#caisse-titre', { timeout: 8000 }).then(() => true).catch(() => false);
          await sleep(400);
          const lu = await p.evaluate(() => ({
            client: [...document.querySelectorAll('.cs-av[aria-pressed="true"]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).join(' | '),
            ecran: (document.querySelector('[role=dialog] h2, main h1, main h2')?.textContent ?? '').trim()
          }));
          await cap('09b-wfv14-facturer');
          (caisse && /La Cigogne/.test(lu.client)) ? ok('WFV-14 Facturer', `la caisse s'ouvre, client « ${lu.client} »`)
            : echec('WFV-14 Facturer', caisse ? `caisse ouverte sans son client (choisi : « ${lu.client || 'aucun'} »)` : `« Facturer » sur « ${titre} » n'ouvre pas la caisse (écran : « ${lu.ecran.slice(0, 50)} »)`);
          if (caisse) await toucher('Fermer').catch(() => {});
        } catch (e) { echec('WFV-14 Facturer', String(e.message).slice(0, 120)); }
      }

      // B3 / WFR-11 : un brassin planifié dont la levure n'a pas de nom (recette figée avec la seule référence de stock, forme réelle) ne fait pas
      // tomber l'écran. Injecté dans le cache de la fixture le temps de l'étape, puis retiré.
      {
        const CLE = 'parcours-calendrier:cache';
        const avant = await p.evaluate((k) => localStorage.getItem(k), CLE);
        const jour = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const suisse = `${jour.slice(8, 10)}.${jour.slice(5, 7)}.${jour.slice(0, 4)}`;
        const lot = { id: 'B-ZZ-LEVURE', name: 'ZZ TEST levure sans nom', style: 'IPA', volumeL: 100, brewDate: '', plannedBrewDate: suisse, status: 'planifie', gravityLog: [], recipeRef: 'R-ZZ-LEVURE', stockAccountingVersion: 1,
          recipeSnapshot: { name: 'ZZ TEST levure sans nom', volumeL: 100, ogTarget: 1.055, fermentables: [{ name: 'Malt pilsner', weightKg: 20, kind: 'grain' }], hops: [], yeast: { stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 12 }] } };
        await p.evaluate((k, l) => { const t = JSON.parse(localStorage.getItem(k) ?? '[]'); t.push({ name: 'batches', id: l.id, data: l }); localStorage.setItem(k, JSON.stringify(t)); }, CLE, lot);
        try {
          await p.goto(url, { waitUntil: 'load' }); await sleep(1200);
          await p.waitForSelector('nav button', { timeout: 90000 });
          if (!(await p.$('[data-calendrier]'))) await toucher('Calendrier').catch(() => {});
          const ouvert = await p.waitForSelector('[data-calendrier]', { timeout: 15000 }).then(() => true).catch(() => false);
          const texte = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 120));
          await cap('09b-b3-levure-sans-nom');
          const nomme = ouvert && (await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].some((e) => e.getAttribute('aria-label').startsWith('ZZ TEST levure sans nom'))));
          ouvert ? ok('B3 écran ouvert', `levure sans nom : Calendrier ouvert${nomme ? ', le brassin y est' : ' (brassin hors de la fenêtre)'}`) : echec('B3 écran ouvert', `brassin dont la levure n'a pas de nom : « ${texte} »`);
        } finally {
          await p.evaluate((k, a) => { if (a === null) localStorage.removeItem(k); else localStorage.setItem(k, a); }, CLE, avant);
        }
      }
    }

    // 9c. V-CAL (21.11) : les étapes du port (Brasserie work/missions/2026-11-21-workflows-app/PORT.md, W0c), rouges sur en-ligne/2026-11-21-tour7.
    async function etapesVcal() {
      const CLE = 'parcours-calendrier:cache';
      const lireCache = () => p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]'), CLE);
      const nouveaux = (avant, apres, ...colls) => apres.filter((e) => colls.includes(e.name) && !avant.some((a) => a.name === e.name && a.id === e.id));
      const periodeNeuve = () => p.evaluate(() => { for (const k of Object.keys(localStorage)) { try { const o = JSON.parse(localStorage.getItem(k)); if (o && typeof o === 'object' && 'app_global_time_filter' in o) { delete o.app_global_time_filter; localStorage.removeItem('laffinee.calendrier.fenetre-locale'); localStorage.setItem(k, JSON.stringify(o)); } } catch { /* pas du JSON */ } } });
      const rechargerV = async () => { await periodeNeuve(); await p.goto(url, { waitUntil: 'load' }); await sleep(1200); await versCalendrier(); await fermer(); };
      const message = () => p.evaluate(() => [...document.querySelectorAll('[role=status]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' | '));
      const feuille = () => p.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].find((e) => e.getBoundingClientRect().width > 0); return d ? d.innerText.replace(/\s+/g, ' ').trim() : null; });
      const clavierOuvert = () => p.evaluate(() => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); });
      const taper = async (x, y, texte) => { await p.touchscreen.tap(x, y); await sleep(300); await p.evaluate(() => document.activeElement?.select?.()); await p.keyboard.type(texte, { delay: 15 }); await sleep(300); };
      const toucherSel = async (sel) => { const c = await point(sel); if (!c) throw new Error(`introuvable : ${sel}`); await sleep(120); const c2 = await point(sel); await p.touchscreen.tap(c2[0], c2[1]); await sleep(800); };
      const ouvrirFeuilleRangee = (id) => toucherSel(`[data-plus="${id}"]`);
      /** Le champ du nom de la feuille d'ajout (« Nom » ou « Autre nom ») : marqué pour le retrouver, sa valeur et son centre. */
      const champNom = async () => { for (let k = 0; k < 12; k++) { const r = await champNom0(); if (r) return r; await sleep(250); } return null; };
      const champNom0 = () => p.evaluate(() => {
        const ds = [...document.querySelectorAll('[role=dialog]')].filter((e) => e.getBoundingClientRect().width > 0); if (!ds.length) return null;
        const d = { querySelectorAll: (s) => ds.flatMap((x) => [...x.querySelectorAll(s)]) };
        /* au doigt, `Input` rend une ligne en <textarea data-single-line> (Input.tsx) : les deux balises comptent */
        const i = [...d.querySelectorAll('input,textarea')].find((x) => /^(Autre nom|Nom)$/.test((x.closest('label')?.querySelector('span')?.textContent ?? '').trim()) || x.hasAttribute('data-feuille-nom'))
          ?? [...d.querySelectorAll('input:not([type]),input[type=text],textarea[data-single-line]')].find((x) => x.getBoundingClientRect().width > 0 && x.getAttribute('inputmode') !== 'decimal');
        if (!i) return null; i.scrollIntoView({ block: 'center' }); const r = i.getBoundingClientRect(); return { valeur: i.value, x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      const annulerSiPossible = async () => { if (await visibleParTexte('Annuler').catch(() => null)) await toucher('Annuler').catch(() => {}); };
      const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      const auj = new Date().toISOString().slice(0, 10);

      // G3 (D396, PI-1) : toucher la case vide d'une semaine à venir dans la piste Travaux crée « Travaux · S<n> » d'emblée (nom posé, sans
      // feuille ni clavier) ; un message propose Annuler, qui la retire.
      /* Indépendante de l'ordre (21.11) : après les sections 1 à 10, la piste peut porter d'autres choses, une chose rester choisie ou un
         message couvrir le bas ; le nom posé peut être pris (« Travaux · S48 · 2 », nomParDefaut). D'où : état propre (rechargement, Échap,
         aucun dialogue), une case dont le point touché EST la piste (le geste n'agit que sur son vide, Rangee `toucherVide`), et le nom libre. */
      if (joue('G3')) try {
        await rechargerV();
        for (let k = 0; k < 3; k++) { await p.keyboard.press('Escape').catch(() => {}); await sleep(150); }
        await fermer();
        const avant = await lireCache();
        if (process.env.G3_SEMAINE) await p.evaluate((s) => { window.__G3_SEMAINE = s; }, process.env.G3_SEMAINE);
        const chercher = () => p.evaluate(() => {
          const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const lanes = [...document.querySelectorAll('[data-lane="travaux"]')].filter((l) => vis(l) && !l.classList.contains('cal-lane-jours'));
          if (!lanes.length) return { err: 'piste Travaux introuvable ([data-lane="travaux"], hors vue jours)' };
          const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].filter(vis);
          if (!b.length) return { err: 'bande des semaines introuvable (vue mois ?)' };
          const i = b.findIndex((e) => e.getAttribute('data-courant') === 'oui');
          for (const lane of lanes) {
            lane.scrollIntoView({ block: 'center' });
            const L = lane.getBoundingClientRect();
            /* plusieurs hauteurs : une ligne de la piste peut être prise, une autre libre */
            for (const fy of [0.5, 0.25, 0.75]) {
              const y = L.top + L.height * fy;
              for (let k = Math.max(1, i + 1); k < b.length; k++) {
                const r = b[k].getBoundingClientRect(); const x = r.left + r.width / 2;
                if (x < L.left + 4 || x > L.right - 4) continue;
                if (window.__G3_SEMAINE && b[k].getAttribute('data-semaine') !== window.__G3_SEMAINE) continue;
                /* la case est vide sous tout le doigt, diagonales comprises : Chrome ajuste un toucher vers la cible voisine (touch adjustment).
                   21.11 : en S2 (3 mois), le point était à 2 px en diagonale de la zone de la poignée de « Sols : colle et joints »
                   (.cal-grip::before, alors 12 px hors de la barre ; 22 px depuis R3) ; la croix de 5 points la manquait, le toucher la prenait. Grille 7 × 5. */
                const pas = [-22, -15, -8, 0, 8, 15, 22].flatMap((dx) => [-12, -6, 0, 6, 12].map((dy) => [dx, dy]));
                if (pas.some(([dx, dy]) => document.elementFromPoint(x + dx, y + dy) !== lane)) continue;
                return { x, y, n: Number(b[k].getAttribute('data-semaine')) };
              }
            }
          }
          return { err: `aucune case vide de Travaux dans les semaines vues (${lanes.length} piste(s))` };
        });
        let cible = await chercher();
        if (cible.err) { await rechargerV(); cible = await chercher(); }
        if (cible.err) throw new Error(cible.err);
        await p.touchscreen.tap(cible.x, cible.y); await sleep(1000);
        const voulu = new RegExp(`^Travaux · S${cible.n}( · \\d+)?$`);
        const f = await feuille(); const msg = await message(); const apres = await lireCache();
        const neuf = nouveaux(avant, apres, 'creativeItems', 'financialPlans').find((e) => voulu.test(e.data.title ?? ''));
        const titre = neuf?.data.title ?? `Travaux · S${cible.n}`;
        const ecran = neuf ? await labelDe(`${titre},`) : null;
        await cap('09c-g3-case-touchee');
        const autres = nouveaux(avant, apres, 'creativeItems', 'financialPlans').map((e) => `${e.name}:${e.data.title ?? e.data.name ?? e.id}@${e.data.date ?? e.data.startDate ?? e.data.dueDate ?? '?'}`);
        if (!neuf) echec('G3', `toucher la case vide S${cible.n} de Travaux ne crée rien${f ? ` (une feuille s'ouvre : « ${f.slice(0, 60)} »)` : ''}${autres.length ? ` ; créé : ${autres.join(', ').slice(0, 120)}` : ''}${msg ? ` ; message : « ${msg.slice(0, 80)} »` : ''}`);
        else if (!ecran) echec('G3', `créé « ${titre} » (${neuf.name}), absent de la frise`);
        else if (!/Annuler/.test(msg) && !(await visibleParTexte('Annuler').catch(() => null))) echec('G3', `« ${titre} » créé sans message Annuler (message : « ${msg.slice(0, 60)} »)`);
        else {
          await toucher('Annuler'); await sleep(600);
          const reste = (await lireCache()).some((e) => e.id === neuf.id);
          reste ? echec('G3', `Annuler ne retire pas « ${titre} »`) : ok('G3', `« ${titre} » créé d'un toucher (${neuf.name}), Annuler le retire`);
        }
      } catch (e) { echec('G3', String(e.message).slice(0, 160)); }

      // RENOMMER-EVT (PI-5) : le détail de « Ranger la réserve » : toucher le titre ouvre un champ sur place, « ZZ TEST Nom » + Entrée renomme,
      // relu dans le cache et sur la frise, clavier fermé.
      if (joue('RENOMMER-EVT')) try {
        await rechargerV();
        await toucher('Ranger la réserve,', { prefixe: true }); await sleep(300);
        const t = await p.evaluate(() => {
          const d = document.querySelector('[aria-label="Détail : Ranger la réserve"]') ?? [...document.querySelectorAll('[aria-label^="Détail"]')].find((e) => e.getBoundingClientRect().width > 0);
          if (!d) return null;
          const e = [...d.querySelectorAll('*')].filter((x) => x.getBoundingClientRect().width > 0 && (x.innerText ?? '').trim() === 'Ranger la réserve').pop();
          if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
        });
        if (!t) throw new Error('détail ouvert sans titre « Ranger la réserve »');
        await p.touchscreen.tap(t[0], t[1]); await sleep(500);
        const champ = await p.evaluate(() => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') ? a.value : null; });
        await cap('09c-renommer-evt-champ');
        if (champ !== 'Ranger la réserve') echec('RENOMMER-EVT', `toucher le titre n'ouvre pas de champ sur place (${champ === null ? 'aucun champ' : `champ « ${champ} »`})`);
        else {
          await p.evaluate(() => document.activeElement?.select?.()); await p.keyboard.type('ZZ TEST Nom', { delay: 15 }); await p.keyboard.press('Enter'); await sleep(900);
          const ouvert = await clavierOuvert();
          const doc = (await lireCache()).find((e) => e.id === 'CR-RANGER');
          const ecran = await labelDe('ZZ TEST Nom,');
          await cap('09c-renommer-evt-apres');
          (!ouvert && doc?.data.title === 'ZZ TEST Nom' && ecran) ? ok('RENOMMER-EVT', 'titre touché, tapé, Entrée : relu dans le cache et sur la frise, clavier fermé')
            : echec('RENOMMER-EVT', `après Entrée : cache « ${doc?.data.title} », frise ${ecran ? 'oui' : 'non'}, clavier ${ouvert ? 'ouvert' : 'fermé'}`);
        }
        await fermer();
      } catch (e) { echec('RENOMMER-EVT', String(e.message).slice(0, 160)); }

      // C1-GLISSER (D393, K1) : la feuille d'ajout n'a plus le carrousel des semaines ; à sa place les horizons. « 3 mois » d'un toucher dit
      // « vers <mois+3> » ; Ajouter pose la chose dans ce mois ; sa semaine se règle ensuite au glisser sur la frise.
      if (joue('C1-GLISSER')) try {
        await rechargerV();
        await ouvrirFeuilleRangee('activites');
        const lu = await p.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].find((e) => e.getBoundingClientRect().width > 0); if (!d) return null; return { carrousel: d.querySelectorAll('.cal-f-semaines [data-semaine], .cal-f-semaines button').length, horizon: [...d.querySelectorAll('button')].some((b) => b.getBoundingClientRect().width > 0 && b.innerText.trim() === '3 mois') }; });
        await cap('09c-c1-feuille');
        if (!lu) throw new Error('« Ajouter dans Activités » n\'ouvre pas de feuille');
        if (lu.carrousel) echec('C1-GLISSER', `la feuille d'ajout garde le carrousel des semaines (${lu.carrousel} puces)`);
        if (!lu.horizon) echec('C1-GLISSER', 'aucun horizon « 3 mois » dans la feuille d\'ajout');
        else {
          const c = await p.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].find((e) => e.getBoundingClientRect().width > 0); const b = [...d.querySelectorAll('button')].find((x) => x.innerText.trim() === '3 mois'); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
          await p.touchscreen.tap(c[0], c[1]); await sleep(500);
          const m = MOIS[(Number(auj.slice(5, 7)) - 1 + 3) % 12];
          const f = await feuille();
          if (!new RegExp(`vers ${m.replace('.', '\\.')}`).test(f ?? '')) echec('C1-GLISSER', `« 3 mois » touché : « vers ${m} » absent de la feuille`);
          const nom = await champNom();
          if (nom) await taper(nom.x, nom.y, 'ZZ TEST Horizon');
          const avant = await lireCache();
          await toucherSel('[role=dialog] [data-ajouter]'); await sleep(600);
          const neuf = nouveaux(avant, await lireCache(), 'creativeItems').find((e) => e.data.title === 'ZZ TEST Horizon');
          if (!neuf) echec('C1-GLISSER', `Ajouter après « 3 mois » ne crée rien (refus : « ${(await feuille())?.slice(-60) ?? ''} »)`);
          else {
            const moisPose = MOIS[Number(String(neuf.data.date).slice(5, 7)) - 1];
            if (moisPose !== m) echec('C1-GLISSER', `posée le ${neuf.data.date} (${moisPose}), ${m} attendu`);
            const sa = semaineDe(await labelDe('ZZ TEST Horizon,'));
            if (sa === null) echec('C1-GLISSER', `« ZZ TEST Horizon » posée le ${neuf.data.date} mais absente de la frise : sa semaine ne se règle pas au glisser`);
            else {
              await p.evaluate(() => document.querySelector('[aria-label^="ZZ TEST Horizon,"]')?.scrollIntoView({ block: 'center' })); await sleep(300);
              const f0 = await fenetreLue();
              const b = await point('[aria-label^="ZZ TEST Horizon,"]');
              const [x0, x1] = prise(b, -1, f0);
              await cap('09c-c1-avant');
              const nbCol = (t) => Number(/\((\d+) col\./.exec(t)?.[1] ?? 0), bornes = (t) => /S(\d+)–S(\d+)/.exec(t)?.slice(1, 3).join('–');
              await glisser([x0, b[1]], [x1, b[1]]);
              const sb = semaineDe(await labelDe('ZZ TEST Horizon,'));
              const f1 = await fenetreLue();
              const pose = (await lireCache()).find((e) => e.id === neuf.id)?.data.date ?? null;
              const semIso = (d) => { const j = new Date(`${d}T12:00:00Z`); j.setUTCDate(j.getUTCDate() + 3 - ((j.getUTCDay() + 6) % 7)); const q = new Date(Date.UTC(j.getUTCFullYear(), 0, 4, 12)); q.setUTCDate(q.getUTCDate() + 3 - ((q.getUTCDay() + 6) % 7)); return 1 + Math.round((j - q) / (7 * 864e5)); };
              await cap('09c-c1-glisse');
              /* CAL-BARRE-BORD (VISION-tour9 n° 2, 21.11 : « je tire un évènement en dehors ça doit agrandir l'échelle ») : une barre tirée vers le bord
                 AGRANDIT la fenêtre au lieu de la faire glisser (plus de colonnes, côté opposé au glisser gardé, ici la fin) ; la date posée est celle de l'étiquette. */
              const w0 = /S(\d+)–S(\d+)/.exec(f0.txt), w1 = /S(\d+)–S(\d+)/.exec(f1.txt);
              const finGardee = !!(w0 && w1 && w0[2] === w1[2]);
              const grandie = nbCol(f1.txt) > nbCol(f0.txt);
              const dateOk = !!(pose && sb !== null && semIso(pose) === sb);
              (sb !== null && sb < sa && grandie && finGardee && dateOk)
                ? ok('C1-GLISSER', `« 3 mois » → vers ${m}, posée S${sa}, tirée vers la gauche : S${sb} (${pose}), fenêtre agrandie ${bornes(f0.txt)} → ${bornes(f1.txt)} (${nbCol(f0.txt)} → ${nbCol(f1.txt)} col.), sans carrousel`)
                : echec('C1-GLISSER', `tirée vers la gauche : S${sa} → S${sb ?? '(absente)'} (posée le ${pose}) ; doigt ${Math.round(x0)} → ${Math.round(x1)} ; fenêtre avant ${f0.txt}, après ${f1.txt} ; attendu : agrandie, fin gardée, date = étiquette`);
            }
            await annulerSiPossible();
          }
        }
        await fermer();
      } catch (e) { echec('C1-GLISSER', String(e.message).slice(0, 160)); }

      // D2-CAL (D393) : feuille Travaux, nom « ZZ TEST Pompe » → la puce « … Pompe … : 420 » (dernier achat semblable, estimé) ; Garder,
      // Ajouter : un plan de 420 CHF.
      if (joue('D2-CAL')) try {
        await rechargerV();
        await ouvrirFeuilleRangee('travaux');
        const nom = await champNom(); if (!nom) { await cap('09c-d2-sans-nom'); const diag = await p.evaluate(() => `${document.querySelectorAll('[role=dialog]').length} dialog ; inputs : ${[...document.querySelectorAll('input')].map((x) => `${x.type}/${x.getBoundingClientRect().width | 0}/${x.closest('[role=dialog]') ? 'D' : '-'}/${(x.closest('label')?.innerText ?? '').slice(0, 12)}`).join(' ')}`); throw new Error(`champ du nom introuvable dans la feuille Travaux (${diag})`); }
        await taper(nom.x, nom.y, 'ZZ TEST Pompe');
        await p.keyboard.press('Tab').catch(() => {}); await sleep(400);
        const puce = await p.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] [data-prix-semblable]')].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') ?? '') + ' ' + e.innerText.replace(/\s+/g, ' '), x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        await cap('09c-d2-puce');
        if (!puce || !/Pompe/.test(puce.t) || !/420/.test(puce.t)) echec('D2-CAL', puce ? `puce « ${puce.t.slice(0, 70)} » sans « Pompe … 420 »` : 'aucune puce de prix semblable ([data-prix-semblable]) après « ZZ TEST Pompe »');
        else {
          await p.touchscreen.tap(puce.x, puce.y); await sleep(500);
          const avant = await lireCache();
          await toucherSel('[role=dialog] [data-ajouter]'); await sleep(600);
          if (await feuille() && await visibleParTexte('Oui,', { prefixe: true }).catch(() => null)) { await toucher('Oui,', { prefixe: true }); await sleep(600); }
          const neuf = nouveaux(avant, await lireCache(), 'financialPlans', 'creativeItems').find((e) => (e.data.title ?? '').startsWith('ZZ TEST Pompe'));
          (neuf && neuf.data.amountCents === 42000) ? ok('D2-CAL', `« ${puce.t.trim().slice(0, 50)} » gardé : plan de 420 CHF`)
            : echec('D2-CAL', neuf ? `créé ${neuf.name} à ${neuf.data.amountCents ?? neuf.data.estimatedCost} (42000 attendu)` : 'Garder puis Ajouter ne crée rien');
          await annulerSiPossible();
        }
        await fermer();
      } catch (e) { echec('D2-CAL', String(e.message).slice(0, 160)); }

      // K2 (T4) : Carnet › projet daté › « Au calendrier » : le Calendrier s'ouvre, la semaine du projet visible et centrée.
      if (joue('K2')) try {
        await rechargerV();
        const projet = (await lireCache()).find((e) => e.id === 'CARNET-ZZ-K2');
        if (!projet) throw new Error('fixture : projet CARNET-ZZ-K2 absent du cache');
        const nav = async (t) => { const b0 = await p.evaluate((t) => { const b = [...document.querySelectorAll('nav button')].find((e) => (e.innerText ?? '').includes(t) && e.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, t); if (!b0) throw new Error(`onglet ${t} introuvable`); await p.touchscreen.tap(b0[0], b0[1]); await sleep(900); };
        await nav('Brassins');
        /* CRN-10 (01cd598c9) : l'onglet dit « Atelier » (« Atelier R&D » avant) ; le préfixe trouve les deux */
        await toucher('Atelier', { prefixe: true }); await sleep(600);
        await toucher(projet.data.title, { prefixe: true, dans: 'button,[role=button],a,[data-carnet-id],li,article' }); await sleep(800);
        await toucher('Au calendrier', { prefixe: true }); await sleep(1200);
        const ouvert = await p.waitForSelector('[data-calendrier]', { timeout: 8000 }).then(() => true).catch(() => false);
        // semaine ISO : le jeudi de la semaine, compté depuis le jeudi de la semaine du 4 janvier
        const j = new Date(`${projet.data.date}T12:00:00Z`); j.setUTCDate(j.getUTCDate() + 3 - ((j.getUTCDay() + 6) % 7));
        const q = new Date(Date.UTC(j.getUTCFullYear(), 0, 4, 12)); q.setUTCDate(q.getUTCDate() + 3 - ((q.getUTCDay() + 6) % 7));
        const n = 1 + Math.round((j - q) / (7 * 864e5));
        const col = ouvert ? await p.evaluate((n) => { const e = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].find((x) => Number(x.getAttribute('data-semaine')) === n && x.getBoundingClientRect().width > 0); const vues = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].filter((x) => x.getBoundingClientRect().width > 0).map((x) => x.getAttribute('data-semaine')); if (!e) return { vues }; const r = e.getBoundingClientRect(); return { cx: r.x + r.width / 2, W: innerWidth, vues }; }, n) : null;
        await cap('09c-k2-au-calendrier');
        if (!ouvert) echec('K2', '« Au calendrier » n\'ouvre pas le Calendrier');
        else if (!col.cx) echec('K2', `S${n} (projet du ${projet.data.date}) hors des semaines montrées (S${col.vues[0]}–S${col.vues[col.vues.length - 1]})`);
        else (col.cx >= col.W * 0.2 && col.cx <= col.W * 0.8) ? ok('K2', `Calendrier ouvert, S${n} à x ${Math.round(col.cx)} sur ${col.W}`) : echec('K2', `S${n} visible mais au bord (x ${Math.round(col.cx)} sur ${col.W})`);
      } catch (e) { echec('K2', String(e.message).slice(0, 160)); }

      // K3-SUITES (T4, attendu du pilote) : un brassin posé (+ › Poser un brassin, une recette, Ajouter) montre son coût estimé et ses suites
      // (fermentation, conditionnement) sans autre geste.
      if (joue('K3-SUITES')) try {
        await rechargerV();
        const avant = await lireCache();
        const fab = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((e) => { const r = e.getBoundingClientRect(); if (!(r.width > 0) || e.closest('nav')) return false; let x = e; while (x && x !== document.body) { if (getComputedStyle(x).position === 'fixed') return true; x = x.parentElement; } return false; }).find((e) => /^\+|ajout|ajouter|nouveau|cr[ée]er/i.test(`${e.innerText ?? ''} ${e.getAttribute('aria-label') ?? ''}`.trim())); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
        if (fab) { await p.touchscreen.tap(fab[0], fab[1]); await sleep(700); }
        if (await p.$('[data-page-action="brassin"]')) await toucherSel('[data-page-action="brassin"]'); else await ouvrirFeuilleRangee('brassins');
        const recette = await p.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] [data-puce="recette"]')].find((e) => e.getBoundingClientRect().width > 0); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { nom: b.innerText.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        if (!recette) throw new Error('aucune puce de recette dans la feuille « Poser un brassin »');
        await p.touchscreen.tap(recette.x, recette.y); await sleep(400);
        await toucherSel('[role=dialog] [data-ajouter]'); await sleep(1200);
        const neuf = nouveaux(avant, await lireCache(), 'batches')[0];
        if (!neuf) throw new Error(`« ${recette.nom} » : Ajouter ne pose aucun brassin`);
        const lu = await p.evaluate((id) => {
          const bar = [...document.querySelectorAll('[data-chose-id]')].find((e) => (e.getAttribute('data-chose-id') ?? '').endsWith(id) && e.getBoundingClientRect().width > 0);
          const messages = [...document.querySelectorAll('[role=status]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).join(' | ');
          return { bar: !!bar, phases: bar ? [...bar.querySelectorAll('[data-phase]')].map((e) => e.getAttribute('data-phase')) : [], label: bar?.getAttribute('aria-label') ?? '', texte: bar ? bar.innerText.replace(/\s+/g, ' ') : '', messages };
        }, neuf.id);
        await cap('09c-k3-brassin-pose');
        const suites = ['fermentation', 'conditionnement'].filter((ph) => !lu.phases.includes(ph));
        const dit = `${lu.label} ${lu.texte} ${lu.messages}`;
        const cout = /co[uû]t estim[ée]+[^|]*?\d[\d'’ ]*(,\d+)?\s*CHF|co[uû]t à venir/i.exec(dit);
        if (!lu.bar) echec('K3-SUITES', `« ${recette.nom} » posé (${neuf.id}) mais absent de la frise`);
        else if (suites.length || !cout) echec('K3-SUITES', `« ${recette.nom} » posé : ${suites.length ? `sans ${suites.join(' ni ')} (phases : ${lu.phases.join(', ') || 'aucune'})` : ''}${!cout ? `${suites.length ? ' ; ' : ''}coût estimé non dit (« ${dit.slice(0, 90)} »)` : ''}`);
        else ok('K3-SUITES', `« ${recette.nom} » posé : phases ${lu.phases.join(', ')} ; « ${cout[0].slice(0, 40)} »`);
        await annulerSiPossible();
      } catch (e) { echec('K3-SUITES', String(e.message).slice(0, 160)); }

      // TRAVAUX-SANS-MONTANT (D401) : « Ajouter dans Activités » et « Ajouter dans Travaux », le nom posé, Ajouter SANS montant : créés.
      // Des Travaux sans montant sont une activité marquée `travaux: true` (jamais un plan à 0 CHF).
      if (joue('TRAVAUX-SANS-MONTANT')) for (const [id, nomR] of [['activites', 'Activités'], ['travaux', 'Travaux']]) try {
        await rechargerV();
        await ouvrirFeuilleRangee(id);
        const nom = await champNom();
        const avant = await lireCache();
        await toucherSel('[role=dialog] [data-ajouter]'); await sleep(700);
        const refus = await p.evaluate(() => document.querySelector('[role=dialog] [data-refus]')?.innerText ?? '');
        const neufs = nouveaux(avant, await lireCache(), 'creativeItems', 'financialPlans');
        await cap(`09c-sans-montant-${id}`);
        const pose = nom?.valeur ?? '';
        const neuf = neufs[0];
        const zero = neufs.find((e) => e.name === 'financialPlans' && !e.data.amountCents);
        if (!/· S\d+/.test(pose)) echec('TRAVAUX-SANS-MONTANT', `${nomR} : aucun nom posé dans la feuille (champ « ${pose} »)`);
        if (!neuf) echec('TRAVAUX-SANS-MONTANT', `${nomR} : Ajouter sans montant ne crée rien (« ${refus.slice(0, 60)} »)`);
        else if (zero) echec('TRAVAUX-SANS-MONTANT', `${nomR} : un plan à 0 CHF (${zero.id}) : l'inconnu n'est jamais 0`);
        else if (id === 'travaux' && !(neuf.name === 'creativeItems' && neuf.data.travaux === true)) echec('TRAVAUX-SANS-MONTANT', `Travaux sans montant écrit en ${neuf.name} sans \`travaux: true\` (D401)`);
        else ok('TRAVAUX-SANS-MONTANT', `${nomR} : « ${neuf.data.title} » créé sans montant (${neuf.name}${neuf.data.travaux ? ', travaux' : ''})`);
        if (neuf) await annulerSiPossible();
        await fermer();
      } catch (e) { echec('TRAVAUX-SANS-MONTANT', `${nomR} : ${String(e.message).slice(0, 150)}`); }

      // CRN-11 et CRN-20 (BUGS.md, critique Carnet du 21.11) : la période que le Calendrier « 3 mois » écrit dans l'app se lit dans la barre du
      // haut des autres écrans. CRN-11 : à 390, sur le Carnet et Finances, la barre reste sur une ligne (nom, période, loupe et duo G A au même
      // niveau, 52 px au plus, rien ne déborde) ; « 26.10.26–24.01.27 » chassait le duo sur une 2e ligne. CRN-20 : à 1280, la même période se dit
      // avec les mêmes caractères en clair et en cave (« — » en clair contre « → » en cave), et le séparateur se dessine pareil.
      const navOnglet = async (t, tactile = true) => {
        const b0 = await p.evaluate((t) => { const b = [...document.querySelectorAll('nav button')].find((e) => (e.innerText ?? '').includes(t) && e.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, t);
        if (!b0) throw new Error(`onglet « ${t} » introuvable`);
        tactile ? await p.touchscreen.tap(b0[0], b0[1]) : await p.mouse.click(b0[0], b0[1]); await sleep(900);
      };
      const versCarnet = async (tactile = true) => {
        await navOnglet('Brassins', tactile);
        const a = await p.evaluate(() => { const b = [...document.querySelectorAll('button,[role=tab]')].find((e) => /^Atelier/.test((e.innerText ?? '').trim()) && e.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
        if (!a) throw new Error('sous-onglet « Atelier » introuvable');
        tactile ? await p.touchscreen.tap(a[0], a[1]) : await p.mouse.click(a[0], a[1]); await sleep(900);
      };
      const barreHaut = () => p.evaluate(() => {
        window.scrollTo(0, 0);
        const h = document.querySelector('header'); if (!h || !h.getBoundingClientRect().height) return null;
        const vis = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? { c: Math.round(b.top + b.height / 2), d: Math.round(b.right) } : null; };
        const ce = h.querySelector('[data-periode-pastille] .pr-ce');
        return { h: Math.round(h.getBoundingClientRect().height), W: innerWidth, nom: vis(h.querySelector('.app-brand-name')), periode: vis(h.querySelector('[data-periode-pastille]')), recherche: vis(h.querySelector('[aria-label^="Rechercher"]')), avatars: vis(h.querySelector('[data-plus-duo]')), deborde: h.scrollWidth > h.clientWidth + 1, texte: (ce?.innerText ?? '').replace(/\s+/g, ' ').trim() };
      });
      if (joue('CRN-11')) try {
        await rechargerV();
        const avant = await barreHaut();
        for (const [ecran, aller] of [['Carnet', () => versCarnet()], ['Finances', () => navOnglet('Finances')]]) {
          await aller();
          const b = await barreHaut();
          if (!b) { echec('CRN-11', `${ecran} : barre du haut introuvable`); continue; }
          const parts = Object.entries({ nom: b.nom, periode: b.periode, recherche: b.recherche, avatars: b.avatars }).filter(([, v]) => v);
          const centres = parts.map(([, v]) => v.c);
          const uneLigne = b.periode && b.avatars && b.recherche && Math.max(...centres) - Math.min(...centres) <= 6 && b.h <= 52 && !b.deborde && Math.max(...parts.map(([, v]) => v.d)) <= b.W;
          await cap(`crn11-${ecran.toLowerCase()}-390`);
          uneLigne ? ok('CRN-11', `${ecran} après « 3 mois » (Calendrier « ${avant?.texte ?? '?'} ») : barre sur une ligne, ${b.h} px, période « ${b.texte} »`)
            : echec('CRN-11', `${ecran} après « 3 mois » : barre du haut de ${b.h} px, ${parts.map(([k, v]) => `${k} y${v.c}`).join(', ')}${b.periode ? '' : ', période absente'}${b.deborde ? ', déborde' : ''} (période « ${b.texte} »)`);
        }
      } catch (e) { echec('CRN-11', String(e.message).slice(0, 200)); }
      if (joue('CRN-20')) try {
        await rechargerV();
        const themeAvant = await p.evaluate(() => localStorage.getItem('laffinee.theme'));
        const lus = {};
        try {
          await p.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
          for (const theme of ['clair', 'cave']) {
            await p.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme);
            /* CAL-PERIODE-APP-FIXE (22.11) : le Calendrier n'écrit plus la période de l'app ; la plage à flèche se pose donc par la barre de l'app (sa valeur stockée), comme ses choix « Période… » */
            await p.evaluate(() => { for (const k of Object.keys(localStorage)) { try { const o = JSON.parse(localStorage.getItem(k)); if (o && typeof o === 'object' && 'app_global_time_filter' in o) { o.app_global_time_filter = 'range-2026-10-26_2027-01-24'; localStorage.setItem(k, JSON.stringify(o)); } } catch { /* clé étrangère */ } } });
            await p.goto(url, { waitUntil: 'load' }); await sleep(1200);
            await p.waitForSelector('nav button', { timeout: 90000 });
            await versCarnet(false); await sleep(300);
            const lu = await p.evaluate(() => {
              const ce = document.querySelector('header [data-periode-pastille] .pr-ce');
              const l = ce?.querySelector('.pr-long') ?? ce;
              if (!l) return null;
              /* le séparateur : un élément `.pr-sep` (dessin), sinon le caractère « → » du texte (sa boîte par un Range) */
              let r = l.querySelector('.pr-sep')?.getBoundingClientRect() ?? null;
              if (!r) {
                const w = document.createTreeWalker(l, NodeFilter.SHOW_TEXT);
                for (let n = w.nextNode(); n && !r; n = w.nextNode()) { const i = n.data.search(/[→—–]/); if (i >= 0) { const g = document.createRange(); g.setStart(n, i); g.setEnd(n, i + 1); r = g.getBoundingClientRect(); } }
              }
              const st = getComputedStyle(l);
              return { texte: l.innerText.replace(/\s+/g, ' ').trim(), police: st.fontFamily.split(',')[0], couleur: st.color, sep: r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null };
            });
            /* CRN-20 se voit, il ne se lit pas dans le texte (le même « → » des deux côtés) : en clair, la pointe de la flèche, gris clair sur
               blanc à 14 px, s'efface et le trait se lit « — ». On compte les pixels encrés de la pointe (le tiers droit du séparateur) : un pixel
               est encré s'il s'écarte du fond d'au moins la moitié de l'écart entre le fond et la couleur du texte. */
            if (lu?.sep) {
              const clip = { x: Math.floor(lu.sep.x), y: Math.floor(lu.sep.y), width: Math.ceil(lu.sep.w) + 1, height: Math.ceil(lu.sep.h) };
              const b64 = await p.screenshot({ clip, encoding: 'base64' });
              lu.encre = await p.evaluate(async (b64, couleur) => {
                const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
                const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
                const d = x.getImageData(0, 0, c.width, c.height).data;
                const L = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const fond = L(d[0], d[1], d[2]); const [fr, fg, fb] = couleur.match(/\d+/g).map(Number); const texte = L(fr, fg, fb);
                const seuil = Math.abs(texte - fond) / 2;
                let pointe = 0, tout = 0; const lignes = new Set();
                for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
                  const k = (j * c.width + i) * 4; if (Math.abs(L(d[k], d[k + 1], d[k + 2]) - fond) < seuil) continue;
                  tout++; if (i >= c.width * 0.6) { pointe++; lignes.add(j); }
                }
                return { pointe, lignes: lignes.size, tout };
              }, b64, lu.couleur);
            }
            lus[theme] = lu;
            await cap(`crn20-carnet-1280-${theme}`);
          }
        } finally {
          await p.evaluate((a) => { if (a === null) localStorage.removeItem('laffinee.theme'); else localStorage.setItem('laffinee.theme', a); }, themeAvant);
          await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
        }
        const [a, b] = [lus.clair, lus.cave];
        if (!a || !b) echec('CRN-20', `période introuvable dans la barre du haut (clair ${a ? 'lue' : 'absente'}, cave ${b ? 'lue' : 'absente'})`);
        else if (a.texte !== b.texte) echec('CRN-20', `la période ne se dit pas pareil : clair « ${a.texte} », cave « ${b.texte} »`);
        else if (!a.encre || !b.encre) echec('CRN-20', `séparateur introuvable dans « ${a.texte} » (clair ${a.encre ? 'lu' : 'absent'}, cave ${b.encre ? 'lu' : 'absent'})`);
        else {
          const dit = (e) => `pointe ${e.pointe} px sur ${e.lignes} lignes, ${e.tout} px en tout`;
          const faute = [['clair', a.encre], ['cave', b.encre]].filter(([, e]) => e.pointe < 4 || e.lignes < 3).map(([t, e]) => `${t} : ${dit(e)}`);
          faute.length ? echec('CRN-20', `« ${a.texte} » : la pointe de la flèche ne se voit pas, le séparateur se lit « — » (${faute.join(' ; ')})`)
            : ok('CRN-20', `« ${a.texte} » en clair comme en cave, flèche entière (clair ${dit(a.encre)} ; cave ${dit(b.encre)})`);
        }
      } catch (e) { echec('CRN-20', String(e.message).slice(0, 200)); }
    }

    // 10. CAL-ENTETE (21.11, tour 7 : « Avec le point qui bouge toujours pas super fan » ; « Il y a vraiment un immense header » ; « il faudrait
    // des tailles fix car SI non ça fait bouger le calendrier » ; « beaucoup de place inutile, et l'info ont l'a déjà sur le graph »).
    // À 390 tactile, dans l'An (sa capture) puis en 3 mois : aucun rond pointillé ni rond de repère sur la courbe ; le haut de la première rangée
    // (Brassins) ne bouge pas de plus de 1 px entre le repos et 5 semaines lues au doigt, courbe visible puis cachée ; aucune rangée qui redit
    // un montant sous les mois ; en-tête ≤ 30 % de 844 (≤ 20 % courbe cachée) ; barre du haut sur une ligne à chaque onglet. Captures
    // 390 et 1280, clair et cave.
    if (tout || joue('CAL-ENTETE')) try { await calEntete(); } catch (e) { echec('CAL-ENTETE', String(e.message).slice(0, 200)); }
    async function calEntete() {
      const C = 'CAL-ENTETE';
      const mesurer = () => p.evaluate(() => {
        window.scrollTo(0, 0); for (const e of document.querySelectorAll('main, [data-calendrier]')) if (e.scrollTop) e.scrollTop = 0;
        const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const ent = document.querySelector('[data-calendrier-entete]');
        const rg = [...document.querySelectorAll('[data-calendrier] [data-rangee]')].find((e) => vis(e) && !ent?.contains(e));
        const pointilles = ent ? [...ent.querySelectorAll('circle')].filter((c) => { const s = getComputedStyle(c).strokeDasharray; return vis(c) && s && s !== 'none'; }).length : 0;
        const lu = ent?.querySelector('.ent-lu');
        const an = document.querySelector('[data-bande-annee]');
        const bz = ent?.querySelector('.ent-bz'); let texteBz = '';
        if (bz) { const c = bz.cloneNode(true); c.querySelectorAll('.ent-live').forEach((x) => x.remove()); texteBz = c.textContent ?? ''; }
        return {
          haut: rg ? Math.round(rg.getBoundingClientRect().top * 10) / 10 : null, rangee: rg ? (rg.innerText ?? '').trim().split('\n')[0].slice(0, 20) : null,
          pointilles, rondsRepere: ent ? [...ent.querySelectorAll('[data-curseur] circle')].filter(vis).length : 0, repere: !!ent?.querySelector('[data-curseur]'),
          lit: !!ent?.querySelector('.ent-lit'), luLignes: lu ? (lu.innerText ?? '').split('\n').filter((l) => l.trim()).length : 0, luTexte: lu ? (lu.innerText ?? '').replace(/\s+/g, ' ').slice(0, 60) : '',
          montantSousMois: /[−-]\s?\d/.test(an?.textContent ?? '') || /[−+]\s?\d/.test(texteBz), anTexte: (an?.textContent ?? '').slice(0, 40), bz: texteBz.replace(/\s+/g, ' ').slice(0, 90)
        };
      });
      const menuDuree = async (nom) => { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await p.touchscreen.tap(m[0], m[1]); await sleep(650); await toucher(nom); await sleep(500); };
      const cacher = async (oui) => { const b = await p.$('[data-ent-cacher]'); if (!b) throw new Error('bouton « Cacher la courbe » introuvable'); const pressé = await b.evaluate((e) => e.getAttribute('aria-pressed') === 'true'); if (pressé !== oui) { const c = await point('[data-ent-cacher]'); await p.touchscreen.tap(c[0], c[1]); await sleep(700); } };
      const boiteCourbe = () => p.evaluate(() => { const s = document.querySelector('[data-calendrier-entete] .ent-cbz svg'); if (!s) return null; window.scrollTo(0, 0); const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });

      await recharger(); await fermer();
      /* « ± » est un réglage du brasseur gardé par appareil (calendrier_mouvements) : K2 (« Au calendrier » d'une idée, T4) le met à « oui » et il
         reste jusqu'ici. Rangée de montants (−63, +900…) et haut de 30 px de plus sont alors voulus ; ce contrôle part du défaut, ± éteint. */
      if (await p.$('.ent-mb[aria-pressed="true"]')) { const c = await point('.ent-mb'); await p.touchscreen.tap(c[0], c[1]); await sleep(600); }
      for (const duree of ['An', '3 mois']) {
        await menuDuree(duree); await cacher(false); await sleep(300);
        // courbe visible : le repos, puis 6 semaines lues au doigt (un glissé horizontal court sur la courbe)
        const hauts = []; const lus = [];
        const repos = await mesurer(); hauts.push(repos.haut);
        if (duree === 'An') await cap('10-cal-entete-390-repos');
        repos.montantSousMois ? echec(C, `${duree} : une rangée sous les mois redit un montant de la courbe (« ${repos.anTexte} » ; bande « ${repos.bz} »)`) : ok(C, `${duree} : aucune rangée de montant sous les mois`);
        const bc = await boiteCourbe();
        if (!bc) { echec(C, `${duree} : courbe introuvable`); continue; }
        for (const f of [0.12, 0.27, 0.41, 0.55, 0.7, 0.86]) {
          const x = bc.x + bc.w * f, y = bc.y + bc.h * 0.55;
          await glisser([x - 16, y], [x, y], 6);
          const m = await mesurer(); hauts.push(m.haut); lus.push(`${m.luLignes} l.`);
          if (!m.lit) notes.push(`${C} ${duree} : glissé à ${Math.round(f * 100)} % sans lecture (${m.luTexte})`);
          if (m.pointilles) echec(C, `${duree} : ${m.pointilles} rond(s) pointillé(s) sur la courbe, semaine lue à ${Math.round(f * 100)} %`);
          if (m.rondsRepere) echec(C, `${duree} : le repère de semaine est un rond (${m.rondsRepere} cercle(s) dans [data-curseur]), deuxième refus`);
          /* CAL-BARRE-INUTILE (b17062ff5, 21.11 « barre inutile ») : le repère n'existe que pendant le geste (vérifié par geste.mjs) ; doigt levé, le détail reste, le repère disparaît */
          if (m.repere) echec(C, `${duree} : le repère de semaine reste dessiné sur la courbe au doigt levé (CAL-BARRE-INUTILE)`);
          if (duree === 'An' && f === 0.7) await cap('10-cal-entete-390-lecture');
        }
        const ecart = Math.max(...hauts) - Math.min(...hauts);
        ecart <= 1 ? ok(C, `${duree}, courbe visible : « ${repos.rangee} » tient (écart ${ecart} px sur ${hauts.length} états ; panneau ${lus.join(', ')})`)
          : echec(C, `${duree}, courbe visible : le haut de « ${repos.rangee} » bouge de ${ecart} px (${hauts.join(' / ')} ; panneau ${lus.join(', ')})`);
        repos.haut !== null && repos.haut <= 0.3 * 844 ? ok(C, `${duree} : en-tête ${repos.haut} px (≤ ${Math.round(0.3 * 844)})`) : echec(C, `${duree} : en-tête ${repos.haut} px, plus de 30 % de 844 (${Math.round(0.3 * 844)})`);
        // courbe cachée : le repos, puis 5 touchers sur la bande de l'axe (date d'une semaine) ; le haut ne bouge pas
        await fermer(); await cacher(true);
        const h2 = []; const r2 = await mesurer(); h2.push(r2.haut);
        if (duree === 'An') await cap('10-cal-entete-390-cachee');
        const bande = await p.evaluate(() => { const b = document.querySelector('[data-calendrier-entete] .ent-bz'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
        if (bande) for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) { await p.touchscreen.tap(bande.x + bande.w * f, bande.y + Math.min(bande.h / 2, 14)); await sleep(500); h2.push((await mesurer()).haut); }
        const e2 = Math.max(...h2) - Math.min(...h2);
        e2 <= 1 ? ok(C, `${duree}, courbe cachée : « ${r2.rangee} » tient (écart ${e2} px sur ${h2.length} états)`) : echec(C, `${duree}, courbe cachée : le haut bouge de ${e2} px (${h2.join(' / ')})`);
        r2.haut !== null && r2.haut <= 0.2 * 844 ? ok(C, `${duree}, courbe cachée : en-tête ${r2.haut} px (≤ ${Math.round(0.2 * 844)})`) : echec(C, `${duree}, courbe cachée : en-tête ${r2.haut} px, plus de 20 % de 844 (${Math.round(0.2 * 844)})`);
        await fermer(); await cacher(false);
      }

      // la barre du haut sur une seule ligne, à chaque onglet (elle est commune à toute l'app)
      const barre = () => p.evaluate(() => {
        window.scrollTo(0, 0);
        const h = document.querySelector('header'); if (!h || h.hidden || !h.getBoundingClientRect().height) return null;
        const vis = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? { c: Math.round(b.top + b.height / 2), d: Math.round(b.right) } : null; };
        return { h: Math.round(h.getBoundingClientRect().height), W: innerWidth, nom: vis(h.querySelector('.app-brand-name')), periode: vis(h.querySelector('[data-periode-pastille]')), recherche: vis(h.querySelector('[aria-label^="Rechercher"]')), avatars: vis(h.querySelector('[data-plus-duo]')), deborde: h.scrollWidth > h.clientWidth + 1 };
      });
      for (const onglet of ['Bord', 'Finances', 'Calendrier', 'Brassins', 'Stocks', 'Clients']) {
        const b0 = await p.evaluate((t) => { const b = [...document.querySelectorAll('nav button')].find((e) => (e.innerText ?? '').includes(t) && e.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, onglet);
        if (!b0) { echec(C, `onglet « ${onglet} » introuvable`); continue; }
        await p.touchscreen.tap(b0[0], b0[1]); await sleep(900);
        const b = await barre();
        if (!b) { notes.push(`${C} : pas de barre du haut sur ${onglet}`); continue; }
        const parts = Object.entries({ nom: b.nom, periode: b.periode, recherche: b.recherche, avatars: b.avatars }).filter(([, v]) => v);
        const centres = parts.map(([, v]) => v.c);
        const uneLigne = b.nom && b.recherche && b.avatars && Math.max(...centres) - Math.min(...centres) <= 6 && b.h <= 52 && !b.deborde && Math.max(...parts.map(([, v]) => v.d)) <= b.W;
        if (onglet === 'Calendrier' || !uneLigne) await cap(`10-barre-${onglet}`);
        uneLigne ? ok(C, `barre du haut sur une ligne (${onglet}, ${b.h} px)`) : echec(C, `barre du haut (${onglet}) : ${b.h} px de haut, ${parts.map(([k, v]) => `${k} y${v.c}`).join(', ')}${b.nom ? '' : ', nom absent'}${b.deborde ? ', déborde' : ''}`);
      }

      // captures : 390 cave et clair, 1280 clair et cave (repos, lecture, courbe cachée)
      for (const [L, theme] of [[390, 'cave'], [390, 'clair'], [1280, 'clair'], [1280, 'cave']]) {
        const tactile = L < 600;
        await p.setViewport({ width: L, height: 844, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
        await p.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme);
        await p.goto(url, { waitUntil: 'load' }); await sleep(1200);
        await p.waitForSelector('nav button', { timeout: 90000 });
        const nv = await p.evaluate(() => { const b = [...document.querySelectorAll('nav button')].find((e) => (e.innerText ?? '').includes('Calendrier') && e.getBoundingClientRect().width > 0); const r = b?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; });
        if (!(await p.$('[data-calendrier]')) && nv) { tactile ? await p.touchscreen.tap(nv[0], nv[1]) : await p.mouse.click(nv[0], nv[1]); }
        await p.waitForSelector('[data-calendrier]', { timeout: 30000 }); await sleep(700);
        const nom = `10-cal-entete-${L}-${theme}`;
        await cap(`${nom}-repos`);
        const bc = await boiteCourbe();
        if (bc) {
          const x = bc.x + bc.w * 0.7, y = bc.y + bc.h * 0.55;
          if (tactile) await glisser([x - 16, y], [x, y], 6);
          else { await p.mouse.move(x - 16, y); await p.mouse.down(); for (let k = 1; k <= 6; k++) { await p.mouse.move(x - 16 + (16 * k) / 6, y); await sleep(16); } await p.mouse.up(); await sleep(600); }
          await cap(`${nom}-lecture`);
          if (L === 1280) { const m = await mesurer(); if (m.pointilles || m.rondsRepere) echec(C, `1280 ${theme} : rond sur la courbe (${m.pointilles} pointillé(s), ${m.rondsRepere} au repère)`); }
        }
      }
      await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    }

    if (erreursPage.length) notes.push(`erreurs de page (${erreursPage.length}) : ${erreursPage[0]}`);
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth) || echec('débordement', 'scrollWidth > innerWidth à 390');
  } finally { await nav.close(); srv.close(); }
}
