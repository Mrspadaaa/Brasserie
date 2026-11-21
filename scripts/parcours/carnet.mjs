#!/usr/bin/env node
// PARCOURS CARNET (21.11) — le Carnet joué AU DOIGT sur un BUILD, avec des données qui imitent celles du brasseur.
// Même méthode que scripts/parcours/calendrier.mjs : « le bug fixing a trop focus sur le code et pas assez sur du vrai bug… test de
// vision, de workflow, d'intégration, d'interaction, de visuel ».
//
//   node scripts/parcours/carnet.mjs <dossier-captures> [--build <dossier>] [--ref <tag>]
//     sans option : construit l'arbre de travail (`vite build` avec scripts/parcours/vite.parcours.config.mjs) dans un dossier temporaire ;
//     --build     : réutilise un build déjà fait par cette config ;
//     --ref <tag> : construit ce tag dans une copie temporaire (git worktree dans os.tmpdir(), node_modules en jonction, retirée à la fin).
//   Sortie : « PARCOURS CARNET OK » (code 0) ou « PARCOURS CARNET ECHEC » + la liste des étapes en échec (code 1) ; captures dans le dossier.
//
// Données : fixtures/carnet.mjs (19 projets du Planning dont 5 faits, carnets génériques « ZZ TEST — … », À venir, Réalisé, un brassin au
// Calendrier, une dépense aux Finances). L'IA est la réponse SIMULÉE du banc (`?dev-local`) : jamais Gemini. 390×844 tactile (CDP :
// touchscreen.tap), jamais element.click() ; un passage à 1280×800 à la souris (événements réels). Chaque étape : un texte attendu, un
// compte, aucun texte < 12 px, aucune ancienne vue (« Réfléchir à mes projets », puces Tout/Bières/Contacts/À faire), une capture nommée.
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
const { fixtureCarnet } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'carnet.mjs')).href);
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-carnet'));
fs.mkdirSync(sortie, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const echecs = []; const notes = [];
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };

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
if (echecs.length) { console.log(`PARCOURS CARNET ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS CARNET OK');

// ───────────── le parcours ─────────────
async function jouer(dir) {
  const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
    r.setHeader('content-type', T[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r);
  });
  await new Promise((o) => srv.listen(0, '127.0.0.1', o));
  const url = `http://127.0.0.1:${srv.address().port}/?dev-local&finance-demo=parcours-carnet`;
  const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const fx = fixtureCarnet(RACINE, aujourdhui);
    const attendu = fx.ids;
    const erreursPage = [];
    let p = null; let tactile = true; let nomPasse = '390';

    async function ouvrirPage(largeur, hauteur, tact) {
      if (p) await p.close().catch(() => {});
      p = await nav.newPage(); tactile = tact; nomPasse = String(largeur);
      await p.setViewport(tact ? { width: largeur, height: hauteur, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { width: largeur, height: hauteur, deviceScaleFactor: 1 });
      await p.evaluateOnNewDocument((j) => { if (!localStorage.getItem('parcours-carnet:fixture')) localStorage.setItem('parcours-carnet:fixture', j); }, JSON.stringify(fx.entrees));
      p.on('pageerror', (e) => erreursPage.push(String(e).slice(0, 200)));
    }
    const cap = (nom) => p.screenshot({ path: path.join(sortie, `${nomPasse}-${nom}.png`) });

    // ── gestes : un toucher réel (CDP) à 390, un clic réel de souris à 1280 ; l'élément doit être CE qui reçoit le geste ──
    const SEL = 'button,[role=button],[role=menuitem],[role=tab],[role=option],a,textarea,input';
    const trouver = (txt, { exact = false, sel = SEL, i = 0, parent = '' } = {}) => p.evaluate((t, ex, s, i, par) => {
      const n = (x) => String(x).replace(/\s+/g, ' ').trim();
      const liste = [...document.querySelectorAll(s)].filter((e) => {
        const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false;
        if (par && !n(e.parentElement?.innerText ?? '').includes(par)) return false;
        const l = e.getAttribute('aria-label') ?? ''; const x = n(e.innerText ?? ''); const ph = e.getAttribute('placeholder') ?? '';
        return ex ? (l === t || x === t) : (l.startsWith(t) || x.startsWith(t) || ph.startsWith(t));
      });
      const e = liste[i]; if (!e) return null;
      let r = e.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 90) { e.scrollIntoView({ block: 'center' }); r = e.getBoundingClientRect(); }
      const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, bien: !!h && (e === h || e.contains(h) || h.contains(e)), recouvert: h ? `${h.tagName.toLowerCase()}${h.className ? '.' + String(h.className).slice(0, 30) : ''}` : null, w: r.width, h: r.height };
    }, txt, exact, sel, i, parent);
    const frapper = async (x, y) => { if (tactile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await sleep(700); };
    async function toucher(txt, o = {}) {
      let c = await trouver(txt, o);
      if (!c) throw new Error(`introuvable : « ${txt} »`);
      await sleep(120); c = await trouver(txt, o);
      if (!c.bien) { await p.evaluate(() => window.scrollTo(0, 1e7)); await sleep(200); c = await trouver(txt, o); }
      if (!c.bien) throw new Error(`« ${txt} » est recouvert par ${c.recouvert}`);
      await frapper(c.x, c.y);
    }
    async function toucherSel(sel) {
      const c = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
      if (!c) throw new Error(`introuvable : ${sel}`);
      await sleep(150); await frapper(c.x, c.y);
    }
    const texte = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    const present = (txt, o = {}) => trouver(txt, o).then((c) => !!c);
    const taper = async (t) => { await p.keyboard.type(t, { delay: 8 }); await sleep(250); };
    const entree = async () => { await p.keyboard.press('Enter'); await sleep(1800); };
    const champActif = () => p.evaluate(() => document.activeElement?.tagName === 'TEXTAREA' ? document.activeElement.placeholder : null);
    /** Le champ du bas (textarea) : on le touche, on vérifie qu'il a le focus. */
    async function focaliserChamp() {
      await p.evaluate(() => window.scrollTo(0, 1e7)); await sleep(250);
      const c = await trouver('', { sel: 'textarea' });
      if (!c) throw new Error('champ du bas introuvable');
      if (!c.bien) throw new Error(`champ du bas recouvert par ${c.recouvert}`);
      await frapper(c.x, c.y);
      if (!(await champActif())) throw new Error('le toucher sur le champ du bas ne lui donne pas le focus');
    }

    // ── vérifications communes à chaque étape ──
    async function verifier(etape, { contient = [], absent = [], carnets = null } = {}) {
      const t = await texte();
      const manque = contient.filter((c) => !(c instanceof RegExp ? c.test(t) : t.includes(c)));
      if (manque.length) return echec(etape, `texte attendu absent : ${manque.map(String).join(' ; ')} (écran : « ${t.slice(0, 160)} »)`);
      const present0 = absent.filter((c) => (c instanceof RegExp ? c.test(t) : t.includes(c)));
      if (present0.length) return echec(etape, `texte qui ne devrait pas être là : ${present0.map(String).join(' ; ')}`);
      const v = await p.evaluate(() => {
        const out = { petits: [], ancien: [], carnets: document.querySelectorAll('[data-carnets]').length };
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const vus = new Set();
        while (w.nextNode()) {
          const n = w.currentNode; const s = n.textContent.replace(/\s+/g, ' ').trim(); if (!s) continue;
          const e = n.parentElement; if (!e || vus.has(e)) continue; vus.add(e);
          const r = e.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
          const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          if (parseFloat(cs.fontSize) < 12) out.petits.push(`« ${s.slice(0, 24)} » ${cs.fontSize}`);
        }
        if (/Réfléchir à mes projets/.test(document.body.innerText)) out.ancien.push('« Réfléchir à mes projets »');
        const bts = [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.innerText.replace(/\s+/g, ' ').trim());
        const racine = document.querySelector('.atp') ?? document.querySelector('[data-carnets]');
        if (racine) {
          const dedans = [...racine.querySelectorAll('button')].map((b) => b.innerText.replace(/\s+/g, ' ').trim());
          for (const m of ['Bières', 'Contacts']) if (dedans.includes(m)) out.ancien.push(`puce « ${m} »`);
          if (dedans.includes('Tout') && dedans.includes('À faire')) out.ancien.push('puces Tout / À faire');
        }
        void bts;
        return out;
      });
      if (v.ancien.length) return echec(etape, `ancienne vue du carnet : ${v.ancien.join(', ')}`);
      if (v.petits.length) return echec(etape, `${v.petits.length} texte(s) sous 12 px : ${v.petits.slice(0, 4).join(' ; ')}`);
      if (carnets !== null && (v.carnets > 0) !== carnets) return echec(etape, carnets ? 'aucun écran du Carnet (CarnetsVue, [data-carnets]) monté' : 'le Carnet est monté là où il ne devrait pas');
      ok(etape, `${contient.length} texte(s) attendu(s), aucun texte < 12 px, aucune ancienne vue`);
    }
    async function etape(nom, fn) {
      try { await fn(); } catch (e) { echec(nom, String(e.message ?? e).slice(0, 300)); await cap(`KO-${nom.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}`).catch(() => {}); }
    }
    /** Page neuve : le magasin recopié (`parcours-carnet:cache`) est vidé, chaque étape repart de la fixture ; `garder` : il est relu (rechargement). */
    const demarrer = async (garder = false) => {
      if (!garder) await p.evaluate(() => { try { localStorage.removeItem('parcours-carnet:cache'); } catch { /* page vierge */ } }).catch(() => {});
      await p.goto(url, { waitUntil: 'load' });
      await p.waitForSelector('nav button', { timeout: 90000 }).catch(async (e) => { await cap('erreur-demarrage').catch(() => {}); throw new Error(`l'application ne démarre pas (${e.message.slice(0, 60)}) ; erreurs : ${erreursPage.slice(0, 2).join(' | ')}`); });
      await sleep(1500);
    };
    const versAtelier = async () => { await toucher('Brassins', { exact: true, sel: 'nav button' }).catch(() => toucher('Brassins')); await toucher('Atelier R&D'); };
    const surListe = () => p.evaluate(() => document.querySelector('[data-carnets]')?.getAttribute('data-vue') ?? null);
    const nomsListe = ['À comparer', 'Idée'];
    const attendreListe = async () => { for (let k = 0; k < 20; k++) { if ((await surListe()) === 'liste') return; await sleep(300); } throw new Error(`la liste du Carnet ne s'affiche pas (vue : ${await surListe()})`); };
    const contenuListe = [nomsListe[0], /Idée\s*\d+/, /Faits\s*5/];
    const ouvrirCarnetDeListe = async (titre) => { await toucher(titre); for (let k = 0; k < 20; k++) { if ((await surListe()) === 'carnet') return; await sleep(300); } throw new Error(`le carnet « ${titre} » ne s'ouvre pas (vue : ${await surListe()})`); };
    const noteBouton = (t) => `Note : ${t}`;
    /** Visible tel quel, sans défiler : dans l'écran, au-dessus du champ du bas, et c'est lui qui reçoit le doigt (CRN). */
    const visibleTel = (txt, sel = 'button,[role=menuitem]') => p.evaluate((t, s) => {
      const n = (x) => String(x).replace(/s+/g, ' ').trim();
      const e = [...document.querySelectorAll(s)].find((x) => n(x.innerText) === t && x.getBoundingClientRect().width > 0);
      if (!e) return { ok: false, pourquoi: 'absent' };
      const r = e.getBoundingClientRect(); const champ = document.querySelector('.cn-champ-zone')?.getBoundingClientRect();
      const bas = Math.min(innerHeight, champ ? champ.top : innerHeight);
      const h = document.elementFromPoint(r.x + r.width / 2, Math.min(r.y + r.height / 2, innerHeight - 1));
      const dessus = !!h && (h === e || e.contains(h));
      return { ok: r.bottom <= bas + 1 && r.top >= 0 && dessus, pourquoi: `y ${Math.round(r.top)}–${Math.round(r.bottom)}, champ du bas à ${Math.round(bas)}, au doigt : ${h ? h.tagName.toLowerCase() + '.' + String(h.className).slice(0, 24) : 'rien'}` };
    }, txt, sel);
    const nbBoutons = (txt) => p.evaluate((t) => [...document.querySelectorAll('button')].filter((b) => b.innerText.replace(/s+/g, ' ').trim() === t && b.getBoundingClientRect().width > 0).length, txt);

    // ══════════ 390 ══════════
    await ouvrirPage(390, 844, true);

    // 0. la fixture est celle du brasseur
    await etape('00 fixture', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await cap('00-liste-atelier');
      await verifier('00 fixture', { contient: [...contenuListe, 'Frigo + congel', 'Sol — matières premières'], carnets: true });
      const n = fx.ids.nbCarnetsPlanning;
      if (n !== 19 || fx.ids.planningFaits.length !== 5) echec('00 fixture', `19 projets du Planning dont 5 faits attendus, fixture : ${n} dont ${fx.ids.planningFaits.length}`);
    });

    // 1. le champ du bas est atteignable sur la liste (à l'ouverture, sans défiler)
    await etape('01 champ du bas atteignable', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      const m = await p.evaluate(() => { const t = document.querySelector('.cn-champ-zone textarea, .cn textarea'); if (!t) return null; const r = t.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, Math.min(r.y + r.height / 2, innerHeight - 1)); return { y: Math.round(r.y), bas: Math.round(r.bottom), H: innerHeight, couvert: !(h && (t === h || t.contains(h) || h.contains(t))), par: h ? String(h.className).slice(0, 30) : '' }; });
      if (!m) throw new Error('champ du bas absent de la liste');
      if (m.couvert) throw new Error(`à l'ouverture de la liste, le champ « Une idée, un besoin… » (y ${m.y}–${m.bas} sur ${m.H}) est recouvert par la barre du bas (${m.par}) : il faut défiler jusqu'en bas pour le toucher`);
      ok('01 champ du bas atteignable', `y ${m.y}–${m.bas} sur ${m.H}`);
    });

    // 2. les entrées : le Carnet s'ouvre depuis CHAQUE porte
    await etape('02 porte Brassins › Atelier', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await cap('02-porte-atelier');
      await verifier('02 porte Brassins › Atelier', { contient: contenuListe, carnets: true });
    });
    await etape('03 porte Menu Plus', async () => {
      await demarrer(); await toucher('Plus : saisie'); await cap('03a-menu-plus');
      await toucher('Atelier R&D', { sel: 'button' }); await attendreListe(); await cap('03b-porte-plus');
      await verifier('03 porte Menu Plus', { contient: contenuListe, carnets: true });
    });
    await etape('04 porte ⌘K', async () => {
      await demarrer(); await toucher('Rechercher'); await sleep(500);
      await taper('carnet'); await sleep(600); await cap('04a-palette');
      const ligne = await trouver('Aller à · Carnet', { sel: 'div,button,[role=option],li' });
      if (!ligne) throw new Error('la palette ne propose pas « Aller à · Carnet · Atelier R&D »');
      await frapper(ligne.x, ligne.y); await attendreListe(); await cap('04b-porte-palette');
      await verifier('04 porte ⌘K', { contient: contenuListe, carnets: true });
    });
    await etape('05 porte + Nouvelle idée', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await toucher('Actions rapides'); await cap('05a-actions');
      await toucher('Nouvelle idée'); await sleep(500);
      if (!(await champActif())) throw new Error('« Nouvelle idée » ne donne pas le focus au champ du Carnet');
      await cap('05b-nouvelle-idee');
      await verifier('05 porte + Nouvelle idée', { contient: ['Une idée'], carnets: true });
    });
    await etape('06 porte Stocks › Matériel › Carnets', async () => {
      await demarrer(); await toucher('Stocks', { exact: true, sel: 'nav button' }).catch(() => toucher('Stocks'));
      await toucher('Matériel', { exact: true }); await toucher('Carnets 20'); await attendreListe(); await cap('06-porte-stocks');
      await verifier('06 porte Stocks › Matériel › Carnets', { contient: [...contenuListe, /Carnets\s*20/], carnets: true });
    });
    await etape('07 porte Calendrier (ampoule d\'une semaine)', async () => {
      await demarrer(); await toucher('Calendrier', { exact: true, sel: 'nav button' }).catch(() => toucher('Calendrier'));
      await toucher('±'); await cap('07a-calendrier');
      await toucherSel('[data-bande-semaines] [data-semaine] .ent-ic svg.lucide-lightbulb');
      for (let k = 0; k < 20; k++) { if ((await surListe()) === 'carnet') break; await sleep(300); }
      await cap('07b-porte-calendrier');
      if ((await surListe()) !== 'carnet') throw new Error(`l'ampoule d'idée ne mène pas à un carnet ouvert (vue : ${await surListe()})`);
      await verifier('07 porte Calendrier', { contient: [/Frigo \+ congel|Extincteur|Armoire|Sol|Hotte|Achat|Conformité/], carnets: true });
    });
    await etape('08 porte Bord › Agenda › Gérer → Calendrier', async () => {
      await demarrer(); await toucher('Bord', { exact: true, sel: 'nav button' }).catch(() => {});
      await toucher('Gérer'); await sleep(800); await cap('08-porte-bord');
      /* Bord › Agenda montre des tâches datées : leur vue choisie est le Calendrier (h1, décision D1 du pilote, 20.11), jamais l'ancien « À faire ». */
      await verifier('08 porte Bord', { contient: [/Calendrier/], absent: [/Réfléchir à mes projets/] });
    });

    // 3. les gestes dans un carnet du Planning (Frigo + congel : T-13, en cours)
    await etape('10 ouvrir un projet du Planning', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await ouvrirCarnetDeListe('Frigo + congel'); await cap('10-projet-planning');
      await verifier('10 ouvrir un projet du Planning', { contient: ['Frigo + congel', 'À faire du 01.08.2026 au 01.05.2027', 'Budget du Planning : 400 CHF'], carnets: true });
    });
    await etape('11 ajouter une note', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel');
      await focaliserChamp(); await taper('prendre un modèle à 2 portes, 180 cm'); await cap('11a-note-tapee'); await entree(); await cap('11b-note-ajoutee');
      if (!(await present('Note : Prendre un modèle à 2 portes', {}))) throw new Error('la note tapée n\'apparaît pas dans le carnet');
      await verifier('11 ajouter une note', { contient: ['Prendre un modèle à 2 portes, 180 cm', /Notes\s*2/], carnets: true });
      // relue après rechargement : le magasin recopié par la fixture garde ce qui a été écrit
      await demarrer(true); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel'); await cap('11c-apres-rechargement');
      await verifier('11 la note survit au rechargement', { contient: ['Prendre un modèle à 2 portes, 180 cm'], carnets: true });
    });
    await etape('12 modifier la note', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel');
      await focaliserChamp(); await taper('prendre un modèle à 2 portes'); await entree();
      await toucher('Note : Prendre un modèle à 2 portes'); await cap('12a-feuille-note');
      await toucher('Modifier', { sel: 'button' }); await sleep(500);
      const dans = await p.evaluate(() => document.activeElement?.tagName === 'TEXTAREA' ? document.activeElement.value : null);
      if (dans === null || !/modèle à 2 portes/i.test(dans)) throw new Error(`Modifier ne met pas la note dans le champ du bas (valeur : ${JSON.stringify(dans)})`);
      await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
      await taper('prendre un modèle à 2 portes, classe A'); await cap('12b-note-en-edition'); await entree(); await cap('12c-note-modifiee');
      await verifier('12 modifier la note', { contient: [/prendre un modèle à 2 portes, classe A/i], absent: [/Prendre un modèle à 2 portes,? actions/], carnets: true });
    });
    await etape('13 modifier le titre', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel');
      await toucher('Renommer', { exact: true }); await sleep(500); await cap('13a-renommer');
      if (!(await champActif())) throw new Error('Renommer ne donne pas le focus à un champ');
      await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control');
      await taper('Frigo et congélateur'); await entree(); await cap('13b-titre-modifie');
      await verifier('13 modifier le titre', { contient: ['Frigo et congélateur'], carnets: true });
    });
    await etape('14 supprimer une note puis Annuler', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel');
      await focaliserChamp(); await taper('acheter des clayettes'); await entree();
      await toucher('Note : Acheter des clayettes'); await toucher('Supprimer', { exact: true, sel: '[role=menuitem]' }); await sleep(500); await cap('14a-note-supprimee');
      if (await present('Note : Acheter des clayettes')) throw new Error('la note supprimée est encore là');
      if (!(await present('Annuler', { exact: true, parent: 'Note supprimée' }))) throw new Error('aucun « Annuler » dans la bande « Note supprimée »');
      // le brasseur voit alors deux « Annuler » (celui de « Note ajoutée » reste en haut) : on touche celui de la suppression
      const nAnnuler = await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Annuler' && b.getBoundingClientRect().width > 0).length);
      void nAnnuler; /* CRN-3 : un seul Annuler, contrôlé par son étape */
      await toucher('Annuler', { exact: true, parent: 'Note supprimée' }); await sleep(600); await cap('14b-note-rendue');
      if (!(await present('Note : Acheter des clayettes'))) throw new Error('Annuler ne rend pas la note');
      await verifier('14 supprimer une note puis Annuler', { contient: ['Acheter des clayettes'], carnets: true });
    });
    await etape('15 créer un carnet (note tapée sur la liste)', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await focaliserChamp(); await taper('pompe de transfert : 3 m³/h suffisent ?'); await cap('15a-tapee'); await entree(); await cap('15b-carnet-cree');
      if ((await surListe()) !== 'carnet') throw new Error(`après la saisie, aucun carnet n'est ouvert (vue : ${await surListe()})`);
      await verifier('15 créer un carnet', { contient: [/[Pp]ompe de transfert/], carnets: true });
      await toucher('Carnets', { exact: true }); await attendreListe();
      await verifier('15 le carnet créé est dans la liste', { contient: [/[Pp]ompe de transfert/, ...contenuListe], carnets: true });
    });
    await etape('16 note en vrac et lien collé (IA simulée)', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await focaliserChamp(); await taper('https://exemple.invalid/v1'); await entree(); await sleep(1500); await cap('16a-lien-lu');
      if ((await surListe()) !== 'carnet') throw new Error(`le lien collé n'ouvre pas de carnet (vue : ${await surListe()})`);
      await verifier('16 lien collé', { contient: ['exemple.invalid'], carnets: true });
      await toucher('Carnets', { exact: true }); await attendreListe();
      await focaliserChamp(); await taper('ZZ TEST — demander au ferblantier le diamètre de l\'évier, jeudi'); await entree(); await cap('16b-vrac-rangee');
      await verifier('16 note en vrac rangée', { contient: [/ferblantier/], carnets: true });
    });
    await etape('17 ranger : archiver un carnet réalisé', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await ouvrirCarnetDeListe('ZZ TEST — Embouteillage');
      await toucher('Plus', { exact: true }); await toucher('Supprimer l'); await cap('17a-carte-supprimer');
      if (!(await present('Archiver'))) throw new Error('un carnet dont le plan est réalisé ne propose pas « Archiver »');
      await toucher('Archiver'); await attendreListe(); await cap('17b-archive');
      await verifier('17 ranger : archiver', { contient: ['Rangé ici'], carnets: true });
      if (await present('ZZ TEST — Embouteillage', { sel: 'button' })) throw new Error('le carnet rangé est encore dans la liste');
      await toucher('Annuler', { exact: true, parent: 'Rangé ici' }); await sleep(700); await cap('17c-rendu');
      if (!(await present('ZZ TEST — Embouteillage', { sel: 'button' }))) throw new Error('Annuler ne rend pas le carnet rangé');
    });
    await etape('18 supprimer un carnet puis Annuler', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await ouvrirCarnetDeListe('Armoire de rangement malte');
      await toucher('Plus', { exact: true }); await toucher('Supprimer l'); await sleep(400); await cap('18a-carte-supprimer');
      await toucher('Supprimer', { exact: true }); await attendreListe(); await cap('18b-supprime');
      if (await present('Armoire de rangement malte', { sel: 'button' })) throw new Error('le carnet supprimé est encore dans la liste');
      await toucher('Annuler', { exact: true }); await sleep(700); await cap('18c-rendu');
      await verifier('18 supprimer puis Annuler', { contient: ['Armoire de rangement malte'], carnets: true });
    });
    await etape('19 projet fait du Planning (archivé)', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await ouvrirCarnetDeListe('Sol, murs & évacuation'); await cap('19-projet-fait');
      await verifier('19 projet fait', { contient: ['Sol, murs & évacuation', 'Budget du Planning : 3 500 CHF'], carnets: true });
    });

    // 4. les liens du Carnet vers les autres écrans
    await etape('20 lien vers Matériel › À venir', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await ouvrirCarnetDeListe('ZZ TEST — Frigo de garde'); await cap('20a-frigo-a-venir');
      await verifier('20 carnet du Frigo', { contient: [/À venir/], carnets: true });
      await toucher('À venir · ZZ TEST');
      await sleep(800); await cap('20b-materiel-a-venir');
      await verifier('20 lien vers À venir', { contient: [/Frigo de garde/], absent: [] });
    });
    await etape('21 lien vers Matériel › Réalisés', async () => {
      await demarrer(); await versAtelier(); await attendreListe();
      await ouvrirCarnetDeListe('ZZ TEST — Embouteillage');
      await cap('21a-embouteillage');
      await verifier('21 carnet réalisé', { contient: [/[Rr]éalis|payé|Embouteillage/], carnets: true });
      await toucher('Réalisés · ZZ TEST');
      await sleep(800); await cap('21b-materiel-realises');
      await verifier('21 lien vers Réalisés', { contient: [/Embouteillage/] });
    });
    await etape('22 le brassin du Calendrier n\'a pas bougé', async () => {
      await demarrer(); await toucher('Calendrier', { exact: true, sel: 'nav button' }).catch(() => toucher('Calendrier'));
      const m = await p.evaluate(() => document.querySelector('[aria-label$="période, liste, tri et filtre"]') ? 1 : 0);
      if (!m) throw new Error('le menu de période du Calendrier est absent');
      await toucherSel('[aria-label$="période, liste, tri et filtre"]'); await toucher('3 mois'); await sleep(600); await cap('22-calendrier-3mois');
      const noms = await p.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')));
      if (!noms.some((l) => l.startsWith('Fruty,'))) throw new Error('le brassin « Fruty » a disparu du Calendrier');
      ok('22 Calendrier', 'brassin Fruty présent');
    });
    await etape('23 la dépense est aux Finances', async () => {
      await demarrer(); await toucher('Finances', { exact: true, sel: 'nav button' }).catch(() => toucher('Finances'));
      await sleep(800); await cap('23-finances');
      await verifier('23 dépense aux Finances', { contient: [/Brouwland/] });
    });

    // ══════════ CRN : les défauts de la vision au doigt (critique carnet 21.11, BUGS.md CRN-1 à CRN-21) ══════════
    await etape('CRN-1 menu d'une note entier, Supprimer visible', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel');
      await focaliserChamp(); await taper('prendre un modèle à 2 portes'); await entree();
      await toucher('Note : Prendre un modèle à 2 portes'); await sleep(500); await cap('crn01-menu-note');
      for (const m of ['Modifier', 'Supprimer']) { const v = await visibleTel(m, '[role=menu] [role=menuitem]'); if (!v.ok) throw new Error(`« ${m} » du menu de la note n'est pas visible au doigt (${v.pourquoi})`); }
      ok('CRN-1', 'Modifier et Supprimer visibles, au-dessus du champ');
    });
    await etape('CRN-3 un seul Annuler après la suppression d'une note', async () => {
      await demarrer(); await versAtelier(); await attendreListe(); await ouvrirCarnetDeListe('Frigo + congel');
      await focaliserChamp(); await taper('acheter des clayettes'); await entree();
      await toucher('Note : Acheter des clayettes'); await toucher('Supprimer', { exact: true, sel: '[role=menuitem]' }); await sleep(600); await cap('crn03-un-annuler');
      const n = await nbBoutons('Annuler');
      if (n !== 1) throw new Error(`${n} boutons « Annuler » visibles après la suppression d'une note`);
      ok('CRN-3', 'un seul Annuler, celui de « Note supprimée »');
    });
    // CRN-suite

    // ══════════ thèmes et grand écran ══════════
    const theme = async (nom) => { await toucher('Plus : saisie'); await toucher(nom, { exact: true }); await sleep(500); };
    await etape('30 thèmes 390 : liste et carnet ouvert, clair puis cave', async () => {
      await demarrer(); await theme('Clair'); await versAtelier(); await attendreListe(); await cap('30a-liste-clair');
      await ouvrirCarnetDeListe('Frigo + congel'); await cap('30b-carnet-clair');
      await demarrer(); await theme('Cave'); await versAtelier(); await attendreListe(); await cap('30c-liste-cave');
      await ouvrirCarnetDeListe('Frigo + congel'); await cap('30d-carnet-cave');
      await verifier('30 thèmes 390', { contient: ['Frigo + congel'], carnets: true });
    });

    await ouvrirPage(1280, 800, false);
    await etape('40 grand écran 1280 : liste et carnet ouvert, clair puis cave', async () => {
      await demarrer();
      await theme('Clair').catch(() => {});
      await versAtelier(); await attendreListe(); await cap('40a-liste-clair');
      await verifier('40 liste 1280', { contient: contenuListe, carnets: true });
      await ouvrirCarnetDeListe('Frigo + congel'); await cap('40b-carnet-clair');
      await verifier('40 carnet 1280', { contient: ['Frigo + congel', 'Budget du Planning : 400 CHF'], carnets: true });
      await demarrer(); await theme('Cave').catch(() => {}); await versAtelier(); await attendreListe(); await cap('40c-liste-cave');
      await ouvrirCarnetDeListe('Frigo + congel'); await cap('40d-carnet-cave');
      await focaliserChamp(); await taper('mesurer la niche'); await entree(); await cap('40e-note-1280');
      await verifier('40 note ajoutée à 1280', { contient: ['Mesurer la niche'], carnets: true });
    });
    if (erreursPage.length) console.log(`  note : ${erreursPage.length} erreur(s) de page, la première : ${erreursPage[0]}`);
    void attendu; void noteBouton;
  } finally { await nav.close().catch(() => {}); srv.close(); }
}
