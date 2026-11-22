#!/usr/bin/env node
// PARCOURS SAISIE-MAIN (22.11, défaut SAISIE-SENS-RECURRENT) — « je peux même pas dire si c'est une vente ou un achat » ;
// « un versement de loyer et dire que c'est reçurent. Pareil pour un apport ou un abonnement ». Sa maquette : v01s (D426).
//
//   node scripts/parcours/saisie-main.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--tailles 390x844,390x660]
//   Sortie : « PARCOURS SAISIE-MAIN OK » (code 0) ou « PARCOURS SAISIE-MAIN ECHEC (n) » + la liste (code 1).
//
// Build de test (`vite.parcours.config.mjs`, `?dev-local`, fixture « ZZ TEST » des chaînes ; jamais seedData.ts). Au doigt, 390 tactile.
// Depuis le + › « Écriture », pour chaque cas, une page neuve :
//   (a) loyer payé chaque mois, (b) apport reçu (validé par Entrée), (c) abonnement mensuel, (d) achat ponctuel.
//   S1  le genre se touche (tuile) et ouvre le clavier sur le montant (le champ montant a le focus, jamais type="number") ;
//   S2  ≤ 3 touchers APRÈS le montant jusqu'à l'enregistrement ;
//   S3  l'écriture est au magasin avec son sens : kind (expense / contribution), paiement du bon sens ; loyer et abonnement :
//       une prévision récurrente mensuelle active, la pièce liée à son échéance (planId, occurrenceId) ;
//   S4  la confirmation dit l'effet : l'apport « en caisse » (Banque) et Mon mois « inchangé » ; le récurrent montre ses prochaines échéances ;
//   S5  Finances › Opérations montre la pièce (son montant) ; Finances › Prévisions montre l'échéance du mois suivant (récurrents).
// Rouge attendu sur en-ligne/2026-11-22-tour9 (« Écriture » ouvre « Nouvelle dépense » : aucune tuile de genre).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const { lancerBanc, pageNeuve, sleep } = await import(pathToFileURL(path.join(ICI, 'chaines-outils.mjs')).href);
const { fixtureChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'chaines.mjs')).href);
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--tailles'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-saisie-main'));
fs.mkdirSync(sortie, { recursive: true });
const TAILLES = { '390x844': [390, 844], '390x660': [390, 660] };
const tailles = (opt('tailles') ?? '390x844').split(',');
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

const CAS = [
  { id: 'a-loyer', genre: 'loyer', tape: '401', cents: 40100, kind: 'expense', dir: 'out', mensuel: true, valider: 'toucher' },
  { id: 'b-apport', genre: 'apport', tape: '2001', cents: 200100, kind: 'contribution', dir: 'in', mensuel: false, valider: 'entree' },
  { id: 'c-abo', genre: 'abo', tape: '29,9', cents: 2990, kind: 'expense', dir: 'out', mensuel: true, valider: 'toucher' },
  { id: 'd-achat', genre: 'achat', tape: '86,5', cents: 8650, kind: 'expense', dir: 'out', mensuel: false, valider: 'toucher' }
];
const chf = (c) => `${Math.floor(c / 100).toLocaleString('de-CH').replace(/[’']/g, ' ')},${String(c % 100).padStart(2, '0')}`;

function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = []; let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'saisie-main-build-'));
    aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `saisie-main-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^\.env(\..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
      for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : "de l'arbre de travail"} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('parcours', String(e.stack ?? e).slice(0, 700)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) { if (process.env.PARCOURS_GARDER) console.log(`build gardé : ${d}`); else fs.rmSync(d, { recursive: true, force: true }); }
}
if (echecs.length) { console.log(`PARCOURS SAISIE-MAIN ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS SAISIE-MAIN OK');

/** Touche (au doigt) le premier élément visible du sélecteur ; défile s'il le faut. */
async function toucherSel(s, sel, att = 700) {
  const c = await s.p.evaluate((q) => {
    const e = [...document.querySelectorAll(q)].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    if (!e) return null;
    let r = e.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) { e.scrollIntoView({ block: 'center' }); r = e.getBoundingClientRect(); }
    return [r.x + r.width / 2, r.y + r.height / 2];
  }, sel);
  if (!c) throw new Error(`introuvable : ${sel}`);
  await sleep(100);
  await s.p.touchscreen.tap(c[0], c[1]);
  await sleep(att);
}

async function jouer(dir) {
  const banc = await lancerBanc(dir);
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const entrees = fixtureChaines(aujourdhui, { cuve: true, rayons: true }).entrees ?? fixtureChaines(aujourdhui, { cuve: true, rayons: true });
    const idsFixture = new Set(entrees.filter((e) => e.name === 'transactions').map((e) => e.id));
    for (const taille of tailles) for (const cas of CAS) {
      const C = `${cas.id} ${taille}`;
      const s = await pageNeuve(banc, entrees, sortie);
      try {
        const [w, h] = TAILLES[taille];
        await s.p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
        await s.demarrer();
        await s.toucher('Actions rapides', { dans: 'button[aria-label^="Actions rapides"]', prefixe: true });
        await sleep(500);
        await s.toucher('Écriture', { dans: '[role=menu] [role=menuitem]', prefixe: true, att: 1500 });
        await s.p.waitForSelector(`[data-saisie-genre="${cas.genre}"]`, { timeout: 8000 }).catch(() => null);
        await s.cap(`${cas.id}-${taille}-0-repos`);
        if (!(await s.p.$(`[data-saisie-genre="${cas.genre}"]`))) { echec(C, `S1 aucune tuile de genre « ${cas.genre} » (écran : ${(await s.texte(160))})`); continue; }
        await toucherSel(s, `[data-saisie-genre="${cas.genre}"]`, 500);
        const focus = await s.p.evaluate(() => { const a = document.activeElement; return a ? { montant: a.hasAttribute('data-saisie-montant'), type: a.getAttribute('type'), mode: a.getAttribute('inputmode') } : null; });
        if (!focus?.montant) echec(C, `S1 le genre n'ouvre pas le clavier sur le montant (focus : ${JSON.stringify(focus)})`);
        else if (focus.type === 'number' || focus.mode !== 'decimal') echec(C, `S1 montant en type=${focus.type} inputmode=${focus.mode}`);
        else ok(C, 'S1 genre → clavier sur le montant');
        if (!focus?.montant) await toucherSel(s, '[data-saisie-montant]', 300);
        await s.p.keyboard.type(cas.tape, { delay: 30 }); await sleep(300);
        // Après le montant : le rythme (s'il n'est pas déjà « Mois ») puis l'enregistrement.
        let apres = 0;
        if (cas.mensuel) {
          const pose = await s.p.evaluate(() => document.querySelector('[data-saisie-rythme="monthly"]')?.getAttribute('aria-pressed') === 'true');
          if (!pose) { await toucherSel(s, '[data-saisie-rythme="monthly"]', 400); apres++; }
        }
        await s.cap(`${cas.id}-${taille}-1-saisi`);
        if (cas.valider === 'entree') { await s.p.keyboard.press('Enter'); apres++; } else { await toucherSel(s, '[data-saisie-enregistrer]', 400); apres++; }
        if (apres > 3) echec(C, `S2 ${apres} touchers après le montant`); else ok(C, `S2 ${apres} toucher(s) après le montant`);
        const vu = await s.p.waitForSelector('[data-saisie-ok]', { timeout: 15000 }).then(() => true, () => false);
        await sleep(400);
        await s.cap(`${cas.id}-${taille}-2-confirmation`);
        if (!vu) { echec(C, `S4 pas de confirmation (écran : ${(await s.texte(240))})`); continue; }
        // S3 : le magasin
        const txs = (await s.store('transactions')).filter((t) => !idsFixture.has(t.id) && t.finance?.amountCents === cas.cents);
        const tx = txs[0];
        if (txs.length !== 1) { echec(C, `S3 ${txs.length} écriture(s) de ${chf(cas.cents)} au magasin`); continue; }
        const pays = (await s.store('financialPayments')).filter((p) => p.transactionId === tx.id);
        const pb = [];
        if (tx.finance.kind !== cas.kind) pb.push(`kind ${tx.finance.kind} au lieu de ${cas.kind}`);
        if (pays.length !== 1 || pays[0].direction !== cas.dir) pb.push(`paiement ${JSON.stringify(pays.map((p) => p.direction))} au lieu d'un « ${cas.dir} »`);
        if (cas.kind === 'contribution' && tx.category !== 'apports') pb.push(`catégorie ${tx.category}`);
        let plan = null;
        if (cas.mensuel) {
          plan = (await s.store('financialPlans')).find((p) => p.id === tx.finance.planId) ?? null;
          if (!plan) pb.push('aucune prévision liée');
          else {
            if (plan.recurrence?.frequency !== 'monthly' || plan.source !== 'recurring' || plan.status !== 'active' || plan.direction !== cas.dir) pb.push(`prévision ${JSON.stringify({ r: plan.recurrence, s: plan.source, st: plan.status, d: plan.direction })}`);
            if (tx.finance.occurrenceId !== `${plan.id}:${plan.date}`) pb.push(`échéance liée ${tx.finance.occurrenceId}`);
          }
        } else if (tx.finance.planId) pb.push(`un mouvement unique lié à une prévision (${tx.finance.planId})`);
        if (pb.length) echec(C, `S3 ${pb.join(' ; ')}`); else ok(C, `S3 ${tx.finance.kind} ${cas.dir}${plan ? `, prévision mensuelle « ${plan.title} » dès ${plan.date}` : ''}`);
        // S4 : la confirmation
        const conf = await s.p.evaluate(() => document.querySelector('[data-saisie-ok]')?.innerText.replace(/\s+/g, ' ') ?? '');
        const pb4 = [];
        if (cas.kind === 'contribution' && !(/Banque/.test(conf) && /inchangé/.test(conf))) pb4.push('l’apport ne dit pas « Banque » et Mon mois « inchangé »');
        if (cas.kind === 'expense' && /inchangé/.test(conf)) pb4.push('une dépense dit Mon mois « inchangé »');
        if (cas.mensuel) {
          const suiv = new Date(`${aujourdhui}T12:00:00Z`); suiv.setUTCMonth(suiv.getUTCMonth() + 1);
          const jjmm = `${String(suiv.getUTCDate()).padStart(2, '0')}.${String(suiv.getUTCMonth() + 1).padStart(2, '0')}`;
          if (!conf.includes(jjmm)) pb4.push(`prochaine échéance ${jjmm} absente`);
        }
        if (pb4.length) echec(C, `S4 ${pb4.join(' ; ')} (« ${conf.slice(0, 200)} »)`); else ok(C, 'S4 confirmation');
        // S5 : Finances
        await toucherSel(s, '[data-saisie-fermer]', 900);
        await s.toucher('Finances', { dans: 'nav button', prefixe: true, att: 1200 });
        await s.toucher('Opérations', { dans: 'button,[role=tab]', att: 1200 });
        const montant = chf(cas.cents);
        const ops = await s.texte(20000);
        await s.cap(`${cas.id}-${taille}-3-operations`);
        if (!ops.includes(montant) || !ops.includes(tx.description)) echec(C, `S5 Opérations ne montre pas « ${tx.description} » ${montant}`); else ok(C, `S5 Opérations : ${tx.description} ${montant}`);
        if (plan) {
          await s.toucher('Prévisions', { dans: 'button,[role=tab]', att: 1500 });
          const prev = await s.texte(30000);
          await s.cap(`${cas.id}-${taille}-4-previsions`);
          // La courbe nomme l'échéance par sa sorte (« loyer −401, 22.12 ») : on cherche le montant suivi de la date de l'échéance du mois suivant.
          const suiv = new Date(`${plan.date}T12:00:00Z`); suiv.setUTCMonth(suiv.getUTCMonth() + 1);
          const jjmm = `${String(suiv.getUTCDate()).padStart(2, '0')}.${String(suiv.getUTCMonth() + 1).padStart(2, '0')}`;
          const entier = String(Math.floor(cas.cents / 100));
          const re = new RegExp(`[−-]${entier}(,\\d{2})?, ${jjmm.replace('.', '\\.')}`);
          if (!re.test(prev)) echec(C, `S5 Prévisions ne montre pas l'échéance −${entier}…, ${jjmm}`); else ok(C, `S5 Prévisions : échéance ${prev.match(re)[0]}`);
        }
        if (s.erreurs.length) echec(C, `erreurs : ${s.erreurs.slice(0, 2).join(' | ')}`);
      } catch (e) { echec(C, String(e.message ?? e).slice(0, 300)); await s.cap(`${cas.id}-${taille}-erreur`).catch(() => {}); }
      finally { await s.fermer(); }
    }
  } finally { await banc.fermer(); }
}
