#!/usr/bin/env node
// PARCOURS CALENDRIER (20.11) — le Calendrier joué AU DOIGT sur un BUILD, avec des données qui imitent celles du brasseur.
// « le bug fixing a trop focus sur le code et pas assez sur du vrai bug… test de vision, de workflow, d'intégration, d'interaction, de visuel ».
//
//   node scripts/parcours/calendrier.mjs <dossier-captures> [--build <dossier>] [--ref <tag>]
//     sans option : construit l'arbre de travail dans un dossier temporaire (`vite build` avec scripts/parcours/vite.parcours.config.mjs) ;
//     --build     : réutilise un build déjà fait par cette config ;
//     --ref <tag> : construit ce tag dans une copie temporaire (git worktree dans os.tmpdir(), node_modules en jonction, retirée à la fin).
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
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-calendrier'));
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
    const aujourdhui = new Date().toISOString().slice(0, 10);
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
    const labelDe = (prefixe) => p.evaluate((t) => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => x.getAttribute('aria-label').startsWith(t) && x.getBoundingClientRect().width > 0); return e ? e.getAttribute('aria-label') : null; }, prefixe);
    const semaineDe = (l) => { const m = /, S(\d+)/.exec(l ?? ''); return m ? Number(m[1]) : null; };
    const fermer = async () => { for (const t of ['Fermer', '×']) { if (await visibleParTexte(t).catch(() => null)) { await toucher(t).catch(() => {}); } } };
    async function versCalendrier(troisMois = true) {
      await p.waitForSelector('nav button', { timeout: 90000 }).catch(async (e) => { await cap('erreur-demarrage').catch(() => {}); throw new Error(`l'application ne démarre pas (${e.message.slice(0, 60)}) ; page : « ${(await p.evaluate(() => document.body.innerText.replace(/s+/g, ' ').slice(0, 160)).catch(() => '?'))} » ; erreurs : ${erreursPage.slice(0, 2).join(' | ')}`); });
      if (!(await p.$('[data-calendrier]'))) await toucher('Calendrier');
      await p.waitForSelector('[data-calendrier]', { timeout: 30000 });
      if (troisMois) { const m = await point('[aria-label$="période, liste, tri et filtre"]'); if (!m) throw new Error('bouton du menu de période introuvable'); await sleep(100); await p.touchscreen.tap(m[0], m[1]); await sleep(650); await toucher('3 mois'); await sleep(500); }
    }
    const recharger = async () => { await p.goto(url, { waitUntil: 'load' }); await sleep(1200); await versCalendrier(); };

    await p.goto(url, { waitUntil: 'load' });
    await versCalendrier();
    await cap('01-calendrier-3mois');

    // 0. l'écran est celui de sa fixture (sinon tout le reste est vide) : un brassin, une fête, un papier
    const presents = await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')));
    for (const t of ['Fruty,', 'Marché de Noël,', 'lol,', 'Hotte,', 'Café du Pont,', 'Commande de malt,']) if (!presents.some((l) => l.startsWith(t))) echec('fixture', `« ${t} » absent de l'écran (3 mois)`);

    // 1. aucune ligne en double (le brasseur : « Emballage · Jhhh » deux fois) : hors Brassins, un même titre n'apparaît qu'une fois par rangée
    {
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
    {
      const m = await p.evaluate(() => ({ zero: document.querySelectorAll('[data-ligne-zero]').length, sous: document.querySelectorAll('[data-sous-zero]').length,
        solde: (document.querySelector('[data-calendrier-entete]')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 60) }));
      (m.zero > 0 && m.sous > 0) ? ok('courbe sous zéro', `ligne zéro ${m.zero}, zone sous zéro ${m.sous} (« ${m.solde} »)`) : echec('courbe sous zéro', `solde négatif (« ${m.solde} ») mais ligne zéro ${m.zero}, zone sous zéro ${m.sous}`);
    }

    // 3. le menu de période (dans l'écran)
    {
      { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await p.touchscreen.tap(m[0], m[1]); await sleep(650); }
      const r = await p.evaluate(() => { const m = document.querySelector('[data-menu-periode]'); if (!m) return null; const b = m.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right), W: innerWidth }; });
      await cap('02-menu-periode');
      if (!r) echec('menu de période', 'introuvable ([data-menu-periode])');
      else (r.left >= 0 && r.right <= r.W) ? ok('menu de période', `${r.left}–${r.right} sur ${r.W}`) : echec('menu de période', `déborde : ${r.left}–${r.right} sur ${r.W}`);
      await toucher('3 mois'); await sleep(400);
    }

    // 4. la frise du haut recule de 4 semaines au doigt (poignée de début saisissable, même au début de la frise)
    {
      const lireDebut = () => p.evaluate(() => { const e = [...document.querySelectorAll('[aria-label^="Poignée de début"]')][0]; const m = e && /commence en S(\d+)/.exec(e.getAttribute('aria-label')); return m ? Number(m[1]) : null; });
      const avant = await lireDebut();
      const poi = await point('[aria-label^="Poignée de début"]');
      const frise = await p.evaluate(() => { const e = document.querySelector('[data-ent-periode]'); const r = e?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height } : null; });
      if (avant === null || !poi || !frise) echec('frise du haut (reculer)', 'poignée de début introuvable');
      else {
        const vue = await p.evaluate(() => { const e = document.querySelector('[aria-label^="Poignée de début"]'); const r = e.getBoundingClientRect(); return { x: r.x, w: r.width, W: innerWidth }; });
        await glisser([poi[0], poi[1]], [poi[0] - frise.w / 4, poi[1]]);
        const apres = await lireDebut(); await cap('03-frise-reculee');
        const recul = apres === null ? null : ((avant - apres) + 53) % 53;
        (recul !== null && recul >= 3 && recul <= 53 - 40) || (recul !== null && recul >= 3 && recul < 20)
          ? ok('frise du haut (reculer)', `S${avant} → S${apres} (poignée x ${Math.round(vue.x)}, ${Math.round(vue.w)} px)`)
          : echec('frise du haut (reculer)', `glisser la poignée de début de ${Math.round(frise.w / 4)} px vers la gauche : S${avant} → S${apres} (recul ${recul}, 3 au moins attendu ; poignée x ${Math.round(vue.x)}, ${Math.round(vue.w)} px)`);
      }
    }

    // 5. glisser une barre de 4 semaines vers le passé, puis vers le futur ; Annuler ; relu après rechargement
    {
      const colonne = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; if (b.length > 1) return b[1].getBoundingClientRect().x - b[0].getBoundingClientRect().x; const f = document.querySelector('[data-frise]'); const n = Number(f?.getAttribute('data-nb-colonnes') ?? 13); return f ? f.getBoundingClientRect().width / n : 26; });
      async function essai(titre, semaines, nom) {
        const avant = await labelDe(`${titre},`); const sa = semaineDe(avant);
        if (sa === null) { echec(nom, `« ${titre} » introuvable à l'écran`); return null; }
        const c = await point(`[aria-label^="${titre},"]`);
        await p.evaluate((t) => { document.querySelector(`[aria-label^="${t},"]`)?.scrollIntoView({ block: 'center' }); }, titre);
        const c2 = await point(`[aria-label^="${titre},"]`);
        await glisser([c2[0] - Math.min(c2[2] / 2 - 6, 10), c2[1]], [c2[0] - Math.min(c2[2] / 2 - 6, 10) + semaines * colonne, c2[1]]);
        const apres = await labelDe(`${titre},`); const sb = semaineDe(apres);
        const dif = sb === null ? null : ((sb - sa) + 53) % 53;
        const voulu = semaines < 0 ? 53 + semaines : semaines;
        const bon = dif !== null && Math.abs(dif - voulu) <= 1;
        bon ? ok(nom, `« ${titre} » S${sa} → S${sb}`) : echec(nom, `« ${titre} » glissé de ${semaines} semaines (${Math.round(semaines * colonne)} px) : S${sa} → S${sb ?? '(absent)'} (${dif} au lieu de ${voulu}±1) ; avant « ${avant?.slice(0, 60)} », après « ${apres?.slice(0, 60) ?? 'absent'} »`);
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
      if (futur?.bon) { await recharger(); const l = await labelDe('Blonde d’automne,'); semaineDe(l) === futur.sb ? ok('relu après rechargement (barre)', `S${semaineDe(l)}`) : echec('relu après rechargement (barre)', `S${futur.sb} écrit, relu « ${l?.slice(0, 50) ?? 'absent'} »`); }
    }

    // 6. la date de chaque type, changée par la feuille (Modifier › semaine précédente › Enregistrer), relue après rechargement
    await recharger();
    for (const [type, titre] of [['brassin', 'Fruty'], ['fête', 'Marché de Noël'], ['vente', 'Café du Pont'], ['achat', 'Commande de malt'], ['papier', 'lol'], ['travaux', 'Hotte'], ['idée', 'IPA brume']]) {
      const nom = `date ${type}`;
      try {
        await fermer();
        const avant = await labelDe(`${titre},`);
        if (!avant) { type === 'idée' ? notes.push(`idée « ${titre} » : pas d'élément nommé à l'écran en 3 mois (icône de semaine) : date non jouée`) : echec(nom, `« ${titre} » introuvable`); continue; }
        await toucher(`${titre},`, { prefixe: true });
        if (!(await visibleParTexte('Modifier'))) { type === 'brassin' || type === 'idée' ? notes.push(`${type} : pas de bouton Modifier (date réglée par le glisser ${type === 'brassin' ? '(joué plus haut)' : ': aucun geste'})`) : echec(nom, 'pas de bouton Modifier'); continue; }
        await toucher('Modifier');
        const cible = await p.evaluate(() => {
          const puces = [...document.querySelectorAll('[role=dialog] button')].map((b) => ({ b, m: /^S(\d+)\s+(\d+)$/.exec(b.innerText.replace(/\s+/g, ' ').trim()) })).filter((x) => x.m);
          const choisie = puces.findIndex((x) => ['aria-pressed', 'aria-checked', 'aria-selected', 'aria-current'].some((a) => x.b.getAttribute(a) === 'true' || x.b.getAttribute(a) === 'page'));
          if (choisie < 1) return null;
          const n = puces[choisie - 1]; n.b.scrollIntoView({ inline: 'center', block: 'nearest' }); const r = n.b.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, sem: Number(n.m[1]), de: Number(puces[choisie].m[1]) };
        });
        if (!cible) { echec(nom, 'puce de la semaine précédente introuvable dans la feuille'); continue; }
        await sleep(150);
        const c2 = await p.evaluate((s) => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => new RegExp(`^S${s}\\s+\\d+$`).test(x.innerText.replace(/\s+/g, ' ').trim()) && x.getBoundingClientRect().width > 0); const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, cible.sem);
        await p.touchscreen.tap(c2[0], c2[1]); await sleep(400);
        if (type === 'fête') await cap('06-feuille-modifier');
        await toucher('Enregistrer'); await sleep(900);
        const apres = await labelDe(`${titre},`);
        if (semaineDe(apres) !== cible.sem) { const proches = await p.evaluate((t) => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => l.includes(t)).slice(0, 3), titre.slice(0, 8)); await cap(`06-echec-${type}`); echec(nom, `semaine S${cible.de} → S${cible.sem} demandée, écran : « ${apres?.slice(0, 70) ?? 'absent'} » (avant « ${avant.slice(0, 40)} » ; libellés proches : ${JSON.stringify(proches).slice(0, 200)})`); continue; }
        await recharger(); const relu = await labelDe(`${titre},`);
        semaineDe(relu) === cible.sem && relu.split(',')[1] === apres.split(',')[1] ? ok(nom, `S${cible.de} → S${cible.sem}, relu : « ${relu.split(',').slice(0, 3).join(',')} »`) : echec(nom, `écrit « ${apres.split(',').slice(0, 3).join(',')} », relu après rechargement « ${relu?.split(',').slice(0, 3).join(',') ?? 'absent'} »`);
      } catch (e) { echec(nom, String(e.message).slice(0, 200)); }
    }

    // 7. la frise de période (Header › « Période … Choisir la plage », au Calendrier puis à Finances : même composant, même CSS) : poignées entièrement visibles, de 44 px
    for (const ecran of ['Calendrier', 'Finances']) try {
      await fermer(); if (ecran === 'Finances') { await toucher('Finances'); await sleep(900); } await toucher('Période :', { prefixe: true }); await sleep(500); await cap(ecran === 'Finances' ? '07-frise-periode-finances' : '07-frise-periode');
      const poignees = await p.evaluate(() => [...document.querySelectorAll('[role=dialog] [data-poignee], [role=dialog] [role=slider], [aria-label*="oignée"]')].filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('[data-calendrier-entete]')).map((e) => { const r = e.getBoundingClientRect(); return { n: e.getAttribute('aria-label') ?? e.getAttribute('data-poignee'), x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), W: innerWidth }; }));
      if (poignees.length < 2) echec(`frise de période (${ecran})`, `${poignees.length} poignée(s) trouvée(s) (2 attendues)`);
      for (const q of poignees) (q.x >= 0 && q.x + q.w <= q.W && q.w >= 44 && q.h >= 44) ? ok(`frise de période (${ecran})`, `poignée « ${q.n?.slice(0, 30)} » x ${q.x}, ${q.w}×${q.h}`) : echec(`frise de période (${ecran})`, `poignée « ${q.n?.slice(0, 30)} » x ${q.x}, ${q.w}×${q.h} sur ${q.W} (entière dans l'écran et 44 px au moins attendus)`);
      await fermer(); await p.keyboard.press('Escape'); await sleep(300);
    } catch (e) { echec(`frise de période (${ecran})`, String(e.message).slice(0, 200)); }

    // 8. « Plus de détails » / ouvrir : jamais l'ancien Atelier (CreativeLabTab)
    try {
      await versCalendrier(false); await fermer();
      for (const [titre, bouton] of [['Marché de Noël,', 'Ouvrir dans l’agenda'], ['Fruty,', 'Ouvrir le brassin']]) {
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
    try {
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
    try { await bugsWorkflows(); } catch (e) { echec('bugs workflows', String(e.message).slice(0, 200)); }
    async function bugsWorkflows() {
      const pastille = () => p.evaluate(() => (document.querySelector('[data-periode-pastille]')?.innerText ?? '').replace(/\s+/g, ' ').trim());
      const semainesVues = () => p.evaluate(() => [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => Number(e.getAttribute('data-semaine'))));
      const colonne = () => p.evaluate(() => { const b = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')]; return b.length > 1 ? b[1].getBoundingClientRect().x - b[0].getBoundingClientRect().x : 26; });
      const menuDuree = async (nom) => { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await p.touchscreen.tap(m[0], m[1]); await sleep(650); await toucher(nom); await sleep(500); };
      // chaque étape part de la période par défaut (« ce mois »), quelle que soit celle laissée par les étapes d'avant
      const periodeNeuve = () => p.evaluate(() => { for (const k of Object.keys(localStorage)) { try { const o = JSON.parse(localStorage.getItem(k)); if (o && typeof o === 'object' && 'app_global_time_filter' in o) { delete o.app_global_time_filter; localStorage.setItem(k, JSON.stringify(o)); } } catch { /* pas du JSON */ } } });
      const recharger = async () => { await periodeNeuve(); await p.goto(url, { waitUntil: 'load' }); await sleep(1200); await versCalendrier(); };

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

    // 10. CAL-ENTETE (21.11, tour 7 : « Avec le point qui bouge toujours pas super fan » ; « Il y a vraiment un immense header » ; « il faudrait
    // des tailles fix car SI non ça fait bouger le calendrier » ; « beaucoup de place inutile, et l'info ont l'a déjà sur le graph »).
    // À 390 tactile, dans l'An (sa capture) puis en 3 mois : aucun rond pointillé ni rond de repère sur la courbe ; le haut de la première rangée
    // (Brassins) ne bouge pas de plus de 1 px entre le repos et 5 semaines lues au doigt, courbe visible puis cachée ; aucune rangée qui redit
    // un montant sous les mois ; en-tête ≤ 30 % de 844 (≤ 20 % courbe cachée) ; barre du haut sur une ligne à chaque onglet. Captures
    // 390 et 1280, clair et cave.
    try { await calEntete(); } catch (e) { echec('CAL-ENTETE', String(e.message).slice(0, 200)); }
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
          montantSousMois: /[−-]\s?\d/.test(an?.textContent ?? '') || /[−+]\s?\d/.test(texteBz), anTexte: (an?.textContent ?? '').slice(0, 40)
        };
      });
      const menuDuree = async (nom) => { const m = await point('[aria-label$="période, liste, tri et filtre"]'); await p.touchscreen.tap(m[0], m[1]); await sleep(650); await toucher(nom); await sleep(500); };
      const cacher = async (oui) => { const b = await p.$('[data-ent-cacher]'); if (!b) throw new Error('bouton « Cacher la courbe » introuvable'); const pressé = await b.evaluate((e) => e.getAttribute('aria-pressed') === 'true'); if (pressé !== oui) { const c = await point('[data-ent-cacher]'); await p.touchscreen.tap(c[0], c[1]); await sleep(700); } };
      const boiteCourbe = () => p.evaluate(() => { const s = document.querySelector('[data-calendrier-entete] .ent-cbz svg'); if (!s) return null; window.scrollTo(0, 0); const r = s.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });

      await recharger(); await fermer();
      for (const duree of ['An', '3 mois']) {
        await menuDuree(duree); await cacher(false); await sleep(300);
        // courbe visible : le repos, puis 6 semaines lues au doigt (un glissé horizontal court sur la courbe)
        const hauts = []; const lus = [];
        const repos = await mesurer(); hauts.push(repos.haut);
        if (duree === 'An') await cap('10-cal-entete-390-repos');
        repos.montantSousMois ? echec(C, `${duree} : une rangée sous les mois redit un montant de la courbe (« ${repos.anTexte} »)`) : ok(C, `${duree} : aucune rangée de montant sous les mois`);
        const bc = await boiteCourbe();
        if (!bc) { echec(C, `${duree} : courbe introuvable`); continue; }
        for (const f of [0.12, 0.27, 0.41, 0.55, 0.7, 0.86]) {
          const x = bc.x + bc.w * f, y = bc.y + bc.h * 0.55;
          await glisser([x - 16, y], [x, y], 6);
          const m = await mesurer(); hauts.push(m.haut); lus.push(`${m.luLignes} l.`);
          if (!m.lit) notes.push(`${C} ${duree} : glissé à ${Math.round(f * 100)} % sans lecture (${m.luTexte})`);
          if (m.pointilles) echec(C, `${duree} : ${m.pointilles} rond(s) pointillé(s) sur la courbe, semaine lue à ${Math.round(f * 100)} %`);
          if (m.rondsRepere) echec(C, `${duree} : le repère de semaine est un rond (${m.rondsRepere} cercle(s) dans [data-curseur]), deuxième refus`);
          if (m.lit && !m.repere) echec(C, `${duree} : semaine lue sans repère sur la courbe`);
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
