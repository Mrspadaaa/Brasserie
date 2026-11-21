#!/usr/bin/env node
// PARCOURS CHAINES (21.11) — les chaînes qui cassaient (PRODUIRE, VENDRE, ACHETER, Calendrier) rejouées AU DOIGT, 390×844 tactile,
// sur la fixture « ZZ TEST » (scripts/parcours/fixtures/chaines.mjs ; jamais seedData.ts). Une étape par bug, une page neuve par étape.
//
//   node scripts/parcours/chaines.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--etape B1[,B4…]]
//     sans option : construit l'arbre de travail (vite build, config de test) dans un dossier temporaire ;
//     --build     : réutilise un build déjà fait par cette config ;
//     --ref <tag> : construit ce tag dans une copie temporaire (git worktree dans os.tmpdir()) ; PARCOURS_GARDER=1 garde le build ;
//     --etape     : ne joue que ces étapes.
//   Sortie : « PARCOURS CHAINES OK » (code 0) ou « PARCOURS CHAINES ECHEC (n) » + la liste (code 1) ; captures dans le dossier.
// Un geste du doigt ne se contourne jamais : un champ qui ne se remplit pas au doigt est un bug à noter, pas à contourner.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const { lancerBanc, pageNeuve, sleep } = await import(pathToFileURL(path.join(ICI, 'chaines-outils.mjs')).href);
const { fixtureChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'chaines.mjs')).href);
const { lecturesChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'lectures.mjs')).href);
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--etape'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-chaines'));
fs.mkdirSync(sortie, { recursive: true });
const seules = opt('etape') ? opt('etape').split(',') : null;
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

// Helpers des étapes « port » : déclarés AVANT le parcours, qui s'exécute au chargement du module (sinon TDZ sur les const).
/** Libellés (aria-label ou texte) de tout ce qui se touche dans la page, dans l'ordre du document, hors de la fenêtre aussi. */
const libelles = (s, debut) => s.p.evaluate((d) => [...document.querySelectorAll('button,[role=button],[role=menuitem],[role=option]')]
  .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
  .map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim()).filter((t) => t.startsWith(d)), debut);
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const moisPlus = (aujourdhui, n) => MOIS_COURTS[(((Number(aujourdhui.slice(5, 7)) - 1 + n) % 12) + 12) % 12];
const nombre = (t) => Number(String(t).replace(/[’' ]/g, '').replace(',', '.'));

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = []; let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'chaines-build-'));
    aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `chaines-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      // le tag n'a pas le banc : on lui prête celui de l'arbre de travail (config Vite de test, point d'entrée de fixture)
      fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
      for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
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
if (echecs.length) { console.log(`PARCOURS CHAINES ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS CHAINES OK');

// ───────────── gestes communs ─────────────
/** Recette neuve par l'assistant : « Actions rapides » → « Recette », nom, volume (si dit), malts du stock (Caramünch effacé à 0 kg si `caramel` est faux). */
async function recetteNeuve(s, { nom = 'ZZ TEST Brune', volume = null, caramel = true, pils = true } = {}) {
  await s.toucher('Actions rapides'); await s.toucher('Recette'); await sleep(800);
  await s.ecrire('textarea[name=recipe_title_label]', nom);
  if (volume != null) await s.ecrire('textarea[aria-label="Volume en fermenteur"]', String(volume));
  await s.toucher('Suivant', { prefixe: true }); await sleep(800);
  await s.toucher('ZZ TEST Caramünch', { contient: true }); await sleep(700);
  // N1 (v04) pose le malt avec une quantité : sans `caramel`, le brasseur l’efface à la main (malt à 0 kg, B4).
  await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Caramünch"]', caramel ? '0.6' : '0');
  if (pils) { await s.toucher('ZZ TEST Malt pilsner', { contient: true }); await sleep(700); await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Malt pilsner"]', '5'); }
}
/** De l'étape Malts à l'étape Levure (Houblons passé), puis la levure du catalogue (dose par défaut posée par l'application). */
async function leveureCatalogue(s) {
  await s.toucher('Suivant', { prefixe: true }); await sleep(700);
  await s.toucher('Suivant', { prefixe: true }); await sleep(800);
  await s.ecrire('textarea[placeholder="Chercher une levure"]', 'US-05'); await sleep(900);
  // tour7 ne liste que la puce du stock « ZZ TEST US-05 » à cette recherche : elle pose la même levure, l'étape juge ensuite ce qui suit
  const cat = await s.trouver('SafAle US-05', { contient: true }).catch(() => null);
  await s.toucher(cat ? 'SafAle US-05' : 'ZZ TEST US-05', { contient: true }); await sleep(900);
}
/** PD-2 : « Actions rapides » → « Facture, photo ou PDF » → « Photographier » : la pièce simulée de l'étape est lue (aucun Gemini), la feuille s'ouvre sur la lecture. */
async function lirePiece(s) {
  await s.toucher('Actions rapides'); await s.toucher('Facture', { prefixe: true }); await sleep(600);
  await s.piece('Photographier', { prefixe: true });
}
/** PD-2 : Confirmer la lecture, fermer l'accusé s'il reste. */
async function confirmerPiece(s) {
  await s.toucher('Confirmer', { prefixe: true, att: 3500 }); await sleep(1500);
  if (await s.visible('OK', {})) await s.toucher('OK', { att: 1200 });
}
/** PD-2 : tout ce que la page dit, textes et étiquettes (un libellé de rangée du Calendrier est une étiquette). */
function ditPage(s) { return s.p.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))].join(' | ')); }
/** PD-2 : le chiffre du Calendrier, « 1 010 CHF à dépenser sans passer sous 0 », en CHF ; null s'il manque. */
async function aDepenser(s) {
  await s.onglet('Calendrier'); await sleep(1500);
  const m = /([\d’'\s  ]+)\s*CHF à dépenser/.exec(await ditPage(s));
  return m ? nombre(m[1].replace(/[  ]/g, ' ')) : null;
}
/** PD-2 : le Calendrier sur 6 mois (menu de période), pour voir ce qui tombe en janvier. */
async function calendrierSurSixMois(s) {
  await s.onglet('Calendrier'); await sleep(1200);
  await s.toucher('période, liste, tri et filtre', { dans: '[aria-label$="période, liste, tri et filtre"]', contient: true }); await sleep(650);
  await s.toucher('6 mois'); await sleep(900);
}
/** Vente de 2 fûts de Pale Ale à La Cigogne (pro, facture QR) jusqu'au panier : « Actions rapides » → « Vente » → puce client → tuile « fût 20 L » ×2. */
async function panierDeuxFuts(s) {
  await s.toucher('Actions rapides'); await s.toucher('Vente'); await sleep(900);
  await s.toucher('La Cigogne', { contient: true, dans: '.cs-av' }); await sleep(400);
  await s.toucher('fût 20 L', { contient: true }); await s.toucher('fût 20 L', { contient: true });
}
/** Facturer (ou Encaisser) puis fermer ce qui reste ouvert. */
async function facturer(s) {
  await s.toucher('^Facturer', { regex: true, att: 3000 });
  if (await s.visible('OK', {})) await s.toucher('OK', { att: 1200 });
}
async function versRecap(s) { for (let i = 0; i < 3; i++) { await s.toucher('Suivant', { prefixe: true }); await sleep(750); } }
/** Appui long (≥ 650 ms, au même point) sur un élément : touchStart, attente, touchEnd par CDP — un doigt qui reste, comme `usePointeur.ts` (500 ms) l'attend. */
async function appuiLong(s, txt, o = {}, ms = 700) {
  const c = await s.trouver(txt, o);
  if (!c) throw new Error(`introuvable pour l'appui long : « ${txt} » (écran : ${(await s.texte(200))})`);
  const cdp = await s.p.createCDPSession();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c[0], y: c[1] }] });
  await sleep(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach().catch(() => {});
  await sleep(600);
}
/** La vente de `n` fois la tuile « 33 cl » au comptoir, payée en espèces. */
async function venteComptoir33(s, n) {
  await s.toucher('Actions rapides'); await s.toucher('Vente'); await sleep(900);
  // la tuile de la caisse, pas le reste « 120 × 33 cl » de la carte de Brassins restée dessous (B1 : le doigt tombait sur la tuile fût)
  for (let i = 0; i < n; i++) await s.toucher('33 cl', { dans: '.cs-tiles button', contient: true, att: 250 });
  await s.toucher('Espèces', { att: 500 });
  await s.toucher('^Encaisser', { regex: true, att: 3000 });
  for (const f of ['OK', 'Fermer']) { if (await s.visible(f, {})) await s.toucher(f, { i: -1, att: 900 }); }
}

// ───────────── les étapes ─────────────
function listeEtapes() { return [
  {
    id: 'B1', titre: 'Recette neuve, brouillon repris → « Enregistrer et préparer » ouvre Brasser (WFR-1)',
    async joue(s) {
      await recetteNeuve(s, { volume: 24 });
      await leveureCatalogue(s);
      // le brasseur quitte l'application et revient : le brouillon est repris sur l'étape où il l'a laissé
      await s.p.goto(s.banc.url, { waitUntil: 'load' }); await sleep(2500);
      if (!(await s.attendre(/Brouillon repris sur cet appareil/, 15000))) return echec('B1', 'le brouillon n\'est pas repris');
      await versRecap(s);
      await s.cap('B1-1-recap');
      await s.toucher('Enregistrer et préparer un brassin'); await sleep(2500);
      await s.cap('B1-2-apres');
      const t = await s.texte(2500);
      if (/n’est pas figé|ne sont pas figées/.test(t)) return echec('B1', `refus « matériel pas figé » : ${t.match(/Le matériel[^.]*\.[^.]*\./)?.[0] ?? ''}`);
      if (/Avant de lancer/.test(t)) return echec('B1', `refus au lancement : ${t.match(/Avant de lancer[^F]{0,120}/)?.[0] ?? ''}`);
      if (!/Planifier/.test(t)) return echec('B1', `la feuille Brasser ne s'ouvre pas (écran : ${t.slice(0, 160)})`);
      ok('B1', 'la feuille Brasser s\'ouvre');
    }
  },
  {
    id: 'B2', titre: 'Brassins → « Brasser » sur un brassin planifié (levure nommée, instantané sans style) ouvre la feuille (WFR-9)',
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.cap('B2-1-liste');
      await s.toucher('Brasser · B-ZZ-PLAN', { prefixe: true }); await sleep(1800);
      await s.cap('B2-2-apres');
      const t = await s.texte(8000);
      if (/Écran indisponible/.test(t)) return echec('B2', `« Écran indisponible » (${s.erreurs[0] ?? 'sans erreur lue'})`);
      // N2 (21.11) : plus de « Commencer aujourd'hui » ; le jour J s'ouvre sur la Conduite (« Maintenant · relevé dû », « Terminer et continuer »)
      // et ne pose son début qu'au premier vrai geste. Un brassin planifié dans dix jours s'ouvre donc, intact, sans rien commencer.
      if (!/ZZ TEST IPA/.test(t) || !/Conduite/.test(t) || !/Terminer et continuer/.test(t)) return echec('B2', `la page du jour de brassage ne s'ouvre pas (écran : ${t.slice(0, 160)})`);
      if (/Commencer aujourd/.test(t)) return echec('B2', 'l\'ancien « Commencer aujourd’hui » est revenu (N2 le retire)');
      ok('B2', 'la page du jour de brassage s\'ouvre (Conduite, « Terminer et continuer », sans « Commencer aujourd’hui »)');
    }
  },
  {
    id: 'B4', titre: 'Récap : le malt du stock laissé à 0 kg est dit au récap, avec son bouton, avant « Enregistrer et préparer » (WFR-3, WFR-4)',
    async joue(s) {
      await recetteNeuve(s, { volume: 24, caramel: false });
      await leveureCatalogue(s);
      await versRecap(s);
      await s.cap('B4-1-recap');
      const t = await s.texte(9000);
      if (!/Quantité de ZZ TEST Caramünch Typ 2 : à compléter/.test(t)) return echec('B4', 'le récap ne dit pas ce qui bloque le lancement (malt à 0 kg) : « Enregistrable » seul');
      await s.toucher('Compléter · Malts/sucres', { prefixe: true }); await sleep(900);
      await s.cap('B4-2-etape-malts');
      if (!/Malts\/sucres — étape 2 sur 7/.test(await s.texte(1800))) return echec('B4', 'le bouton du récap n\'ouvre pas l\'étape Malts/sucres');
      ok('B4', 'le récap nomme le malt à 0 kg et son bouton ouvre l\'étape Malts/sucres');
    }
  },
  {
    id: 'D394', titre: 'Recette neuve sans toucher au volume : le défaut est le repère conseillé (24 L), « Enregistrer et préparer » ouvre Brasser',
    async joue(s) {
      await recetteNeuve(s, {}); // aucun volume écrit : c'est le défaut de l'application qui est jugé
      await leveureCatalogue(s);
      await versRecap(s);
      await s.cap('D394-1-recap');
      await s.toucher('Enregistrer et préparer un brassin'); await sleep(2500);
      await s.cap('D394-2-apres');
      const t = await s.texte(2500);
      if (/capacité physique du fermenteur/.test(t)) return echec('D394', `le volume par défaut atteint la capacité du fermenteur : ${t.match(/Avant de lancer[^F]{0,160}/)?.[0] ?? ''}`);
      if (/Avant de lancer/.test(t)) return echec('D394', `refus au lancement : ${t.match(/Avant de lancer[^F]{0,120}/)?.[0] ?? ''}`);
      if (!/Planifier/.test(t)) return echec('D394', `la feuille Brasser ne s'ouvre pas (écran : ${t.slice(0, 160)})`);
      const recettes = await s.store('recipes');
      const neuve = recettes.find((r) => /ZZ TEST Brune/.test(r.name ?? ''));
      if (!neuve || Math.abs(Number(neuve.volumeL) - 24) > 0.05) return echec('D394', `volume enregistré ${neuve?.volumeL ?? 'recette absente'} L au lieu de 24 L`);
      ok('D394', 'recette enregistrée à 24 L, la feuille Brasser s\'ouvre');
    }
  },
  {
    id: 'B6', titre: 'Vendre 2 fûts à La Cigogne : le panier dit quels fûts partent, la vente les livre (WFV-1)',
    async joue(s) {
      await panierDeuxFuts(s);
      await s.cap('B6-1-panier');
      const t0 = await s.texte(3000);
      if (!/Livre F-001, F-002/.test(t0)) return echec('B6', `le panier ne dit pas quels fûts partent (attendu « Livre F-001, F-002 ») : ${t0.slice(0, 200)}`);
      await facturer(s);
      await s.cap('B6-2-apres');
      const futs = await s.store('kegs');
      const etat = (id) => futs.find((k) => k.id === id);
      const mal = ['F-001', 'F-002'].filter((id) => etat(id)?.state !== 'livre' || etat(id)?.clientId !== 'CL-CIGOGNE' || !etat(id)?.deliveryDate);
      if (mal.length) return echec('B6', `fûts restés en cave après la vente : ${mal.map((id) => `${id}=${etat(id)?.state}`).join(', ')}`);
      if (etat('F-003')?.state !== 'plein') return echec('B6', `F-003 (autre bière) ne devait pas bouger : ${etat('F-003')?.state}`);
      ok('B6', 'F-001 et F-002 livrés à La Cigogne, F-003 intact');
    }
  },
  {
    id: 'B5', titre: 'La vente réelle solde la vente promise (+280) : un seul +280 au Calendrier, plan soldé (WFV-2)',
    async joue(s) {
      await panierDeuxFuts(s);
      const t0 = await s.texte(3000);
      const propose = /Solde la vente promise/.test(t0); // la proposition se juge, mais la chaîne se joue jusqu'au Calendrier (le double compte s'y voit)
      await s.cap('B5-1-panier');
      await facturer(s);
      await s.cap('B5-2-apres');
      const plan = (await s.store('financialPlans')).find((p) => p.id === 'P-VENTE-CIG');
      const tx = (await s.store('transactions')).find((t) => t.finance?.planId === 'P-VENTE-CIG');
      await s.toucher('Fermer', { i: -1 }); await sleep(900);
      await s.onglet('Calendrier'); await sleep(1800);
      await s.cap('B5-3-calendrier');
      const lignes = await s.p.evaluate(() => [...document.querySelectorAll('[data-rangee="ventes"] [data-chose-id]')].map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').slice(0, 80)));
      const promis = lignes.filter((l) => /Cigogne, 2 f/.test(l));
      if (promis.length || plan?.status !== 'completed' || !tx || !propose) return echec('B5', `la vente réelle ne solde pas la promesse : plan « ${plan?.status} », facture liée ${tx ? 'oui' : 'non'}, proposée au panier ${propose ? 'oui' : 'non'}, au Calendrier : ${promis[0] ?? 'absente'}`);
      ok('B5', `plan soldé, facture liée, rangée Ventes : ${lignes.length} chose(s), plus de « La Cigogne, 2 fûts »`);
    }
  },
  {
    id: 'B10', titre: 'La loupe trouve une chose du Calendrier (« Hotte ») et ouvre le Calendrier sur elle (WFR-9, B10)',
    async joue(s) {
      await s.toucher('Rechercher', { prefixe: true }); await sleep(900);
      await s.ecrire('[cmdk-input]', 'Hotte'); await sleep(900);
      await s.cap('B10-1-recherche');
      const t = await s.texte(2000);
      if (/Rien pour/.test(t) || !/ZZ TEST Hotte/.test(t)) return echec('B10', `la loupe ne trouve pas la chose « ZZ TEST Hotte » du Calendrier : ${t.match(/Rien pour[^.]{0,60}/)?.[0] ?? t.slice(0, 120)}`);
      await s.toucher('ZZ TEST Hotte', { contient: true }); await sleep(1800);
      await s.cap('B10-2-calendrier');
      const lignes = await s.p.evaluate(() => [...document.querySelectorAll('[data-chose-id]')].map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').slice(0, 80)));
      if (!lignes.some((l) => /Hotte/.test(l))) return echec('B10', `le résultat n'ouvre pas le Calendrier sur la chose (choses visibles : ${lignes.slice(0, 4).join(' | ') || 'aucune'})`);
      ok('B10', 'la loupe trouve « ZZ TEST Hotte » et le Calendrier l\'affiche');
    }
  },
  {
    id: 'B11', titre: 'Brassins montre les bières que la caisse vend (conditionnée, terminée) malgré la période « Nov. + en cours » (WFV-5, B11)',
    async joue(s) {
      await s.onglet('Brassins'); await sleep(1000);
      await s.cap('B11-1-liste');
      const t = await s.texte(3000);
      const manque = ['ZZ TEST Pale Ale', 'ZZ TEST NEIPA'].filter((n) => !t.includes(n));
      if (manque.length) return echec('B11', `la liste des brassins cache ce que la caisse vend : ${manque.join(', ')} (écran : ${t.slice(0, 160)})`);
      // 390 : le libellé de période (« + en cours, en vente ») et la feuille Filtres ne débordent pas (largeur de la fenêtre, jamais plus)
      const debord = await s.p.evaluate(() => [...document.querySelectorAll('.lst-fbtn, .lst-per, .lst-top button, .lst-segments button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).map((e) => (e.getAttribute('aria-label') || e.innerText || '').slice(0, 40)));
      if (debord.length) return echec('B11', `déborde de l’écran à 390 : ${debord.join(', ')}`);
      await s.toucher('Filtrer', { prefixe: true }); await sleep(900);
      await s.cap('B11-2-filtres');
      await s.p.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = e.scrollHeight; }); await sleep(500);
      await s.cap('B11-3-filtres-periode');
      const f = await s.texte(3000);
      if (!/Les en cours et en vente, toujours/.test(f)) return echec('B11', `la feuille Filtres ne dit pas « Les en cours et en vente, toujours » (écran : ${f.slice(0, 160)})`);
      const debordF = await s.p.evaluate(() => [...document.querySelectorAll('[role=dialog] *, .lst-segments *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).map((e) => (e.className?.toString?.() || e.tagName).slice(0, 40)).slice(0, 4));
      if (debordF.length) return echec('B11', `la feuille Filtres déborde à 390 : ${debordF.join(', ')}`);
      ok('B11', 'la Pale Ale (conditionnée) et la NEIPA (terminée) sont listées ; libellé et feuille Filtres tiennent à 390');
    }
  },
  {
    id: 'DOSE', titre: 'Levure hors catalogue : le « + » ouvre le champ des grammes, la dose se pose au doigt (11 g) et se garde (mesure du 21.11 : par conception, pas un bug)',
    async joue(s) {
      await recetteNeuve(s);
      await s.toucher('Suivant', { prefixe: true }); await sleep(700);
      await s.toucher('Suivant', { prefixe: true }); await sleep(800);
      // N1 levure (21.11) : la levure du stock « ZZ TEST US-05 » est reliée au catalogue (fiche SafAle US-05) ; elle se pose comme cette fiche, avec
      // sa dose en sachets. Une levure HORS catalogue est donc ce qui ne se trouve ni au catalogue ni au stock : le texte tapé sans résultat
      // ouvre « Mon stock ou saisie libre », « Utiliser cette levure » la pose, et la dose se saisit alors en grammes.
      await s.ecrire('textarea[placeholder="Chercher une levure"]', 'ZZ Levure Libre'); await sleep(900);
      await s.toucher('Mon stock ou saisie libre', { contient: true }); await sleep(900);
      await s.cap('DOSE-0-saisie-libre');
      await s.toucher('Utiliser cette levure', { att: 1200 }); await sleep(900);
      await s.toucher('Saisir la dose en grammes', { i: -1 }); await sleep(600);
      const champ = await s.p.evaluate(() => { const c = document.querySelector('input[aria-label="Dose en grammes"]'); return c ? { focus: document.activeElement === c } : null; });
      if (!champ) return echec('DOSE', 'le « + » de la dose (levure hors catalogue) n\'ouvre aucun champ : geste sans effet');
      await s.ecrire('input[aria-label="Dose en grammes"]', '11'); await sleep(300);
      await s.toucher('OK', { att: 1500 }); await sleep(700);
      await s.cap('DOSE-1-onze-grammes');
      const t = await s.texte(900);
      if (!/\b11 g\b/.test(t)) return echec('DOSE', `la dose saisie (11 g) n'est pas gardée (écran : ${t.slice(0, 200)})`);
      ok('DOSE', `le « + » ouvre le champ${champ.focus ? ' (au focus)' : ''}, 11 g saisis et gardés`);
    }
  },
  {
    id: 'WF2-8', titre: 'Budget d\'un brassin planifié : un geste reprend les prix du stock (estimés) et le coût du brassin n\'est plus « pas encore chiffré » (WF2-8)',
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Ouvrir le brassin B-ZZ-PLAN'); await sleep(1200);
      await s.toucher('Dossier'); await sleep(800);
      await s.toucher('Estimer le budget de ce brassin'); await sleep(1500);
      const avant = await s.texte(3000);
      if (!/Pas encore chiffré/.test(avant)) return echec('WF2-8', `départ inattendu : la chaîne ne dit pas « Pas encore chiffré » (${avant.slice(0, 120)})`);
      await s.toucher('Coût du brassin', { contient: true }); await sleep(1500);
      await s.cap('WF2-8-1-budget');
      if (!(await s.visible('Reprendre les', { contient: true }))) return echec('WF2-8', 'le budget ne propose pas de reprendre les prix du stock (pilsner 1,6 / Munich 1,9 / Citra 0,09 / US-05 4,5 sont au stock)');
      await s.toucher('Reprendre les', { contient: true }); await sleep(900);
      await s.cap('WF2-8-2-repris');
      const repris = await s.texte(3000);
      if (!/prix du stock repris/.test(repris) || !/estimés/.test(repris)) return echec('WF2-8', `les prix repris ne sont pas dits estimés (écran : ${repris.slice(0, 160)})`);
      await s.toucher('Enregistrer', { att: 3000 }); await sleep(1500);
      await s.cap('WF2-8-3-chaine');
      const plans = await s.store('financialPlans');
      const estim = plans.find((p) => p.brewEstimate?.batchId === 'B-ZZ-PLAN')?.brewEstimate;
      const pils = estim && Object.values(estim.prices ?? {}).find((p) => p.amount === 1.6);
      if (!pils || !/estim/.test(String(pils.note))) return echec('WF2-8', `l'estimation enregistrée ne porte pas le prix du stock du malt pilsner, marqué estimé (${estim ? JSON.stringify(Object.keys(estim.prices ?? {})) : 'aucune estimation'})`);
      const apres = await s.texte(3000);
      if (/Coût du brassin « ZZ TEST IPA »\s*Pas encore chiffré/.test(apres)) return echec('WF2-8', 'la chaîne dit encore « Pas encore chiffré » après l\'estimation enregistrée');
      ok('WF2-8', 'un geste reprend les prix du stock, dits estimés ; l\'estimation enregistrée les porte et la chaîne ne dit plus « Pas encore chiffré »');
    }
  },
  {
    id: 'WF2-1', titre: 'Jour de brassage : « Terminer et continuer » passe à l’étape suivante (levure liée au stock sans nom) (WF2-1)',
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Brasser · B-ZZ-JOUR', { prefixe: true }); await sleep(1800);
      if (await s.visible('Commencer aujourd', { contient: true })) { await s.toucher('Commencer aujourd', { contient: true }); await sleep(1500); }
      await s.cap('WF2-1-1-compagnon');
      for (let n = 0; n < 2; n++) {
        await s.toucher('Terminer et continuer', { att: 3000 }); await sleep(900);
        const t = await s.texte(2000);
        if (/Écran indisponible/.test(t)) { await s.cap(`WF2-1-2-indisponible`); return echec('WF2-1', `« Écran indisponible » au « Terminer et continuer » n° ${n + 1} (${s.erreurs[0] ?? 'sans erreur lue'})`); }
      }
      await s.cap('WF2-1-3-apres');
      const t = await s.texte(2000);
      if (!/Empâtage/.test(t) || !/Terminer et continuer|Commencer la montée/.test(t)) return echec('WF2-1', `le déroulé n'avance pas (écran : ${t.slice(0, 160)})`);
      ok('WF2-1', 'les deux premiers « Terminer et continuer » passent (Concassage puis Empâtage), levure liée au stock sans nom');
    }
  },
  {
    id: 'WFA-15', titre: 'La facture de malt (421,57) se lie d\'office à la « Commande de malt » prévue (420) : le Calendrier ne compte plus le malt deux fois (WFA-15)',
    async joue(s) {
      await s.toucher('Actions rapides'); await s.toucher('Écriture', { prefixe: true }); await sleep(900); await s.toucher('Saisir sans justificatif'); await sleep(1200);
      await s.cap('WFA-15-1-depense');
      await s.ecrire('[aria-label="Pour quoi ?"]', 'ZZ TEST malt pilsner'); await sleep(300);
      await s.ecrire('#purchase-total', '421.57'); await sleep(500);
      await s.toucher('Fournisseur', { contient: true }); await sleep(500);
      await s.ecrire('#purchase-vendor', 'ZZ TEST'); await sleep(500);
      await s.toucher('Lier à une dépense prévue', { contient: true }); await sleep(800);
      await s.cap('WFA-15-2-lien');
      const lie = await s.p.evaluate(() => { const c = document.querySelector('#purchase-plan'); return c ? c.options[c.selectedIndex]?.text ?? '' : null; });
      const pb = [];
      if (lie == null) return echec('WFA-15', `la feuille ne propose pas « Lier à une dépense prévue » (écran : ${(await s.texte(1500)).slice(0, 200)})`);
      if (!/Commande de malt/.test(lie)) pb.push(`la facture de 421,57 chez ZZ TEST ne se lie pas à la « Commande de malt » prévue (420) : lien « ${lie} »`);
      await s.toucher('Enregistrer', { prefixe: true, att: 3500 }); await sleep(1500);
      await s.cap('WFA-15-3-apres');
      const tx = (await s.store('transactions')).find((t) => /ZZ TEST malt pilsner/.test(t.description ?? ''));
      if (!tx) return echec('WFA-15', 'la dépense n’est pas enregistrée');
      if (tx.finance?.planId !== 'P-MALT') pb.push(`la dépense enregistrée n'est pas liée au plan P-MALT (planId : ${tx.finance?.planId ?? 'aucun'})`);
      if (await s.visible('OK', {})) await s.toucher('OK', { att: 1200 });
      await s.onglet('Calendrier'); await sleep(1800);
      await s.cap('WFA-15-4-calendrier');
      // tout ce que le Calendrier dit du malt : la facture (réelle) et la commande (prévue) ; les deux ensemble = le malt compté deux fois
      const dit = await s.p.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))].join(' | '));
      const prevue = /Commande de malt/.test(dit);
      if (/Impossible de charger cet écran/.test(dit)) pb.push('le Calendrier ne s’ouvre pas (« Impossible de charger cet écran »)');
      else if (prevue) pb.push('le Calendrier compte le malt deux fois : la facture de 421,57 est enregistrée ET « Commande de malt » (−420, prévue) reste au Calendrier');
      if (pb.length) return echec('WFA-15', pb.join(' ; '));
      ok('WFA-15', 'facture liée d’office à P-MALT ; plus de « Commande de malt » au Calendrier');
    }
  },
  {
    id: 'WFA-12', titre: 'Pompe « réalisée » sans achat lié : le geste demande d’abord, et garde le montant prévu (450 CHF) tant qu’aucun achat ne le solde (WFA-12)',
    async joue(s) {
      const dit = () => s.p.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))].join(' | '));
      await s.onglet('Stocks'); await sleep(800);
      await s.toucher('Matériel'); await sleep(700);
      await s.toucher('À venir', { prefixe: true }); await sleep(700);
      await s.toucher('ZZ TEST Pompe de transfert', { contient: true }); await sleep(1000);
      await s.cap('WFA-12-1-fiche');
      await s.toucher('Acheté', { prefixe: true }); await sleep(700);
      await s.toucher('Marquer comme réalisé', { dans: '.pjd-lien' }); await sleep(900);
      await s.cap('WFA-12-2-demande');
      const t = await s.texte(2500);
      const plan = () => s.store('financialPlans').then((ps) => ps.find((p) => p.id === 'P-POMPE'));
      if (!/aucun achat lié/.test(t)) return echec('WFA-12', `« Marquer comme réalisé » sans achat ne demande rien : le plan est « ${(await plan())?.status} » (les 450 CHF sortent de la prévision sans dépense)`);
      if ((await plan())?.status !== 'active') return echec('WFA-12', `le plan a changé avant la réponse : « ${(await plan())?.status} »`);
      await s.toucher('Garder'); await sleep(900);
      await s.cap('WFA-12-3-gardee');
      if ((await plan())?.status !== 'active') return echec('WFA-12', `« Garder » n’a pas gardé le plan au prévu : « ${(await plan())?.status} »`);
      await s.toucher('Fermer', { i: -1 }).catch(() => {}); await sleep(600);
      await s.onglet('Calendrier'); await sleep(1500);
      await s.cap('WFA-12-4-calendrier');
      if (!/Pompe de transfert/.test(await dit())) return echec('WFA-12', 'la Pompe a quitté le Calendrier alors qu’elle est gardée au prévu');
      ok('WFA-12', 'le geste demande (« aucun achat lié »), « Garder » laisse le plan actif et la Pompe au Calendrier');
    }
  },

  // ═════════ PD-2 (21.11) : une pièce solde son prévu, pour tous les genres, comme la caisse le fait pour la vente (WFD-1, WFD-3, WFD-4) ═════════
  {
    id: 'PD2-MALT', lecture: 'facture', titre: 'Facture d\'achat prévu (421,57) : la feuille propose « ✓ Solde l\'achat prévu », décochable ; enregistrée, « Commande de malt −420 » quitte le Calendrier (WFD-3, WFA-15)',
    async joue(s) {
      await lirePiece(s);
      await s.cap('PD2-MALT-1-lue');
      const sel = '[data-suite="prevu"]';
      if (!(await s.visible('achat prévu', { dans: sel, contient: true }))) return echec('PD2-MALT', `la feuille ne propose pas « ✓ Solde l'achat prévu » : la facture de 421,57 et la « Commande de malt » (−420) restent côte à côte (écran : ${(await s.texte(300))})`);
      const ligne = () => s.p.evaluate((q) => (document.querySelector(q)?.innerText ?? '').replace(/\s+/g, ' ').trim(), sel);
      const avant = await ligne();
      if (!/^✓ Solde l.achat prévu\s*«\s*ZZ TEST Commande de malt/.test(avant)) return echec('PD2-MALT', `la ligne ne nomme pas la Commande de malt, coche d'office : « ${avant} »`);
      await s.toucher('achat prévu', { dans: sel, contient: true }); await sleep(400);
      const decochee = await ligne();
      if (!/^Ne solde pas/.test(decochee)) return echec('PD2-MALT', `un toucher ne décoche pas la ligne : « ${decochee} »`);
      await s.toucher('achat prévu', { dans: sel, contient: true }); await sleep(400);
      if (!/^✓ Solde/.test(await ligne())) return echec('PD2-MALT', 'un second toucher ne la recoche pas');
      await s.cap('PD2-MALT-2-ligne');
      await confirmerPiece(s);
      const pb = [];
      const tx = (await s.store('transactions')).find((t) => /ZZ-BW-1142/.test(t.description ?? '') || t.finance?.invoiceNumber === 'ZZ-BW-1142');
      if (!tx) return echec('PD2-MALT', 'la facture n\'est pas enregistrée');
      if (tx.finance?.planId !== 'P-MALT') pb.push(`la facture n'est pas liée à P-MALT (planId : ${tx.finance?.planId ?? 'aucun'})`);
      const plan = (await s.store('financialPlans')).find((p) => p.id === 'P-MALT');
      if (plan?.status !== 'completed') pb.push(`la « Commande de malt » n'est pas soldée (état : ${plan?.status})`);
      await s.onglet('Calendrier'); await sleep(1800);
      await s.cap('PD2-MALT-3-calendrier');
      if (/Commande de malt/.test(await ditPage(s))) pb.push('le Calendrier garde « Commande de malt » (−420) à côté de la facture de 421,57');
      if (pb.length) return echec('PD2-MALT', pb.join(' ; '));
      ok('PD2-MALT', 'ligne « ✓ Solde l\'achat prévu » cochée d\'office et décochable ; facture liée à P-MALT, plan soldé, plus de « Commande de malt » au Calendrier');
    }
  },
  {
    id: 'PD2-POMPE', lecture: 'pompe', titre: 'Facture de matériel payée (pompe 450) : le projet passe dans Réalisés, « Pompe −450 » quitte le Calendrier, la caisse ne baisse pas deux fois (WFD-1)',
    async joue(s) {
      const caisse0 = await aDepenser(s);
      await s.onglet('Bord'); await sleep(500);
      await lirePiece(s);
      await s.cap('PD2-POMPE-1-lue');
      const sel = '[data-suite="prevu"]';
      if (!(await s.visible('achat prévu', { dans: sel, contient: true }))) return echec('PD2-POMPE', `la feuille ne propose pas « ✓ Solde l'achat prévu » pour le projet « Pompe de transfert » (450) (écran : ${(await s.texte(300))})`);
      const ligne = await s.p.evaluate((q) => (document.querySelector(q)?.innerText ?? '').replace(/\s+/g, ' ').trim(), sel);
      if (!/Pompe de transfert/.test(ligne)) return echec('PD2-POMPE', `la ligne ne nomme pas la Pompe de transfert : « ${ligne} »`);
      await confirmerPiece(s);
      const pb = [];
      const caisse1 = await aDepenser(s);
      await s.cap('PD2-POMPE-2-calendrier');
      if (/Pompe de transfert/.test(await ditPage(s))) pb.push('le Calendrier garde « Pompe de transfert −450 » en Travaux');
      if (caisse0 != null && caisse1 !== caisse0) pb.push(`« à dépenser » passe de ${caisse0} à ${caisse1} CHF : les 450 CHF sont comptés deux fois (la pièce payée et le prévu)`);
      await s.onglet('Stocks'); await sleep(800); await s.toucher('Matériel'); await sleep(900);
      await s.cap('PD2-POMPE-3-materiel');
      const t = await s.texte(1500);
      const venir = /À venir\s*(\d+)/.exec(t)?.[1], faits = /Réalisés\s*(\d+)/.exec(t)?.[1];
      if (venir !== '0') pb.push(`Matériel dit « À venir ${venir} » : le projet reste à venir (attendu 0)`);
      if (faits !== '1') pb.push(`Matériel dit « Réalisés ${faits} » (attendu 1)`);
      if (pb.length) return echec('PD2-POMPE', pb.join(' ; '));
      ok('PD2-POMPE', `projet réalisé (À venir 0 · Réalisés 1), plus de Pompe au Calendrier, « à dépenser » inchangé (${caisse1} CHF)`);
    }
  },
  {
    id: 'PD2-IMPOT', lecture: 'impot', titre: 'Facture de l\'impôt sur la bière (OFDF, payée) : elle solde l\'échéance d\'impôt de Papiers (WFD-4)',
    async joue(s) {
      await calendrierSurSixMois(s);
      if (!/Impôt sur la bière/.test(await ditPage(s))) return echec('PD2-IMPOT', 'avant la pièce, le Calendrier sur 6 mois n\'a aucun « Impôt sur la bière » : la fixture ne pose pas l\'échéance à solder');
      await s.onglet('Bord'); await sleep(500);
      await lirePiece(s);
      await s.cap('PD2-IMPOT-1-lue');
      const sel = '[data-suite="prevu"]';
      if (!(await s.visible('prévu', { dans: sel, contient: true }))) return echec('PD2-IMPOT', `la feuille ne propose pas de solder l'échéance d'impôt (écran : ${(await s.texte(300))})`);
      const ligne = await s.p.evaluate((q) => (document.querySelector(q)?.innerText ?? '').replace(/\s+/g, ' ').trim(), sel);
      if (!/Impôt sur la bière/.test(ligne)) return echec('PD2-IMPOT', `la ligne ne nomme pas l'impôt sur la bière : « ${ligne} »`);
      await confirmerPiece(s);
      await calendrierSurSixMois(s);
      await s.cap('PD2-IMPOT-2-calendrier');
      if (/Impôt sur la bière/.test(await ditPage(s))) return echec('PD2-IMPOT', 'le Calendrier garde « Impôt sur la bière » en Papiers alors que la facture de l\'impôt est payée');
      ok('PD2-IMPOT', 'la facture OFDF solde l\'échéance : plus d\'« Impôt sur la bière » en Papiers');
    }
  },

  // ═════════ La file « port » (W0b, 21.11) : les workflows tranchés (D393, D396), rouges sur tour7 et sur HEAD tant que rien n'est porté ═════════
  {
    id: 'A2', titre: 'Caisse : l\'appui long sur la tuile 33 cl propose 6 · 12 · 24 ; le toucher simple garde +1 (D393 A2, K5)', fixture: { sansJour: true },
    async joue(s) {
      await s.toucher('Actions rapides'); await s.toucher('Vente'); await sleep(900);
      await appuiLong(s, '33 cl', { contient: true });
      await s.cap('A2-1-appui-long');
      const dit = async (n) => s.visible(String(n), { dans: 'button,[role=menuitem],[role=option]' });
      const manque = []; for (const n of [6, 12, 24]) if (!(await dit(n))) manque.push(n);
      if (manque.length) return echec('A2', `l'appui long sur « 33 cl » ne propose pas ${manque.join(' · ')} (attendu 6 · 12 · 24) ; panier : ${((await s.texte(1500)).match(/rien dans le panier|\d+ × 33 cl/) ?? ['?'])[0]}`);
      const g0 = s.gestes();
      await s.toucher('24', { dans: 'button,[role=menuitem],[role=option]', att: 600 });
      await s.cap('A2-2-vingt-quatre');
      if (!/24 × 33 cl/.test(await s.texte(2500))) return echec('A2', 'le choix « 24 » ne pose pas 24 × 33 cl au panier');
      await s.toucher('33 cl', { contient: true, att: 500 }); // le toucher simple garde +1
      if (!/25 × 33 cl/.test(await s.texte(2500))) return echec('A2', 'le toucher simple n\'ajoute plus 1 bouteille (attendu 25 × 33 cl)');
      ok('A2', `24 bouteilles en ${s.gestes() - g0 + 1} geste(s) depuis l'appui long ; +1 au toucher simple`);
    }
  },
  {
    id: 'A2-75', titre: 'Caisse : l\'appui long vaut aussi sur la tuile 75 cl (6 · 12 · 24, « généralisé pour chaque cas ») ; 12 pose 12 bouteilles, le toucher simple garde +1', fixture: { sansJour: true },
    async joue(s) {
      await s.toucher('Actions rapides'); await s.toucher('Vente'); await sleep(900);
      await s.toucher('33 cl', { contient: true, att: 500 }); // une autre tuile au panier (badge 1) : le bloc ne doit pas sembler être le sien
      await appuiLong(s, '75 cl', { contient: true });
      await s.cap('A2-75-1-appui-long');
      const etats = await s.p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.cs-tiles .cs-t')].map((t) => [t.querySelector('b')?.textContent ?? '?', { actif: t.classList.contains('cs-has'), badge: !!t.querySelector('.cs-n') }])));
      if (!etats['75 cl']?.actif || etats['33 cl']?.actif || etats['33 cl']?.badge) return echec('A2-75', `ouvert depuis 75 cl, le bloc quantité ne dit pas sa tuile : ${JSON.stringify(etats)}`);
      const dit = async (n) => s.visible(String(n), { dans: 'button,[role=menuitem],[role=option]' });
      const manque = []; for (const n of [6, 12, 24]) if (!(await dit(n))) manque.push(n);
      if (manque.length) return echec('A2-75', `l'appui long sur « 75 cl » ne propose pas ${manque.join(' · ')} (attendu 6 · 12 · 24)`);
      await s.toucher('12', { dans: 'button,[role=menuitem],[role=option]', att: 600 });
      await s.cap('A2-75-2-douze');
      // Sans tarif, la tuile 75 cl ouvre la ligne à compléter (« prix ? ») : la quantité y est posée ; avec un tarif, le panier dit 12 × 75 cl.
      const lue = async () => {
        const champ = await s.p.evaluate(() => { const g = document.querySelector('[aria-label="Ligne libre"]'); return g?.querySelector('[aria-label="Quantité"]')?.value ?? null; /* Input rend un textarea d'une ligne */ });
        return champ ?? ((await s.texte(2500)).match(/(\d+) × 75 cl/) ?? [])[1] ?? null;
      };
      const q = await lue();
      if (q !== '12') return echec('A2-75', `le choix « 12 » ne pose pas 12 bouteilles de 75 cl (lu : ${q ?? 'rien'})`);
      if (await s.visible('Annuler', {})) await s.toucher('Annuler', { att: 400 });
      const avant = Number(((await s.texte(2500)).match(/(\d+) × 75 cl/) ?? [])[1] ?? 0);
      await s.toucher('75 cl', { contient: true, att: 500 });
      const pris = Number(await lue());
      if (pris !== avant + 1) return echec('A2-75', `le toucher simple sur 75 cl ne garde pas +1 (avant ${avant}, lu ${pris})`);
      ok('A2-75', '6 · 12 · 24 sur 75 cl ; 12 posé ; +1 au toucher simple');
    }
  },
  {
    id: 'B1-CARTE', titre: 'Brassins : la carte du brassin dit le reste à vendre (« 120 × 33 cl · 2 fûts »), la vente le baisse (114), le toucher sur le reste ouvre la vente (D393 B1, K6)', fixture: { sansJour: true },
    async joue(s) {
      const carte = async () => { const t = await s.texte(6000); return t.match(/LOT-PA\s*—?\s*(\d+) × 33 cl · (\d+) fûts?/); };
      await s.onglet('Brassins'); await sleep(1000);
      await s.cap('B1-1-avant');
      const a = await carte(); const pb = [];
      if (!a || Number(a[1]) !== 120 || Number(a[2]) !== 2) pb.push(`la carte de LOT-PA ne dit pas le reste à vendre « 120 × 33 cl · 2 fûts » (F-004 est livré) : « ${(await s.texte(6000)).match(/LOT-PA[^|]{0,60}/)?.[0] ?? 'carte absente'} »`);
      await venteComptoir33(s, 6);
      await s.onglet('Brassins'); await sleep(1000);
      await s.cap('B1-2-apres-vente');
      const b = await carte();
      // après vente : 114 × 33 cl, et les 2 fûts pleins restent (la vente de bouteilles ne livre aucun fût)
      if (!b || Number(b[1]) !== 114 || Number(b[2]) !== 2) pb.push(`après 6 × 33 cl vendues, la carte ne dit pas « 114 × 33 cl · 2 fûts » (lu : « ${(await s.texte(6000)).match(/LOT-PA[^|]{0,40}/)?.[0] ?? 'carte absente'} »)`);
      if (pb.length) return echec('B1', pb.join(' ; '));
      await s.toucher('114 × 33 cl', { contient: true, att: 1200 });
      await s.cap('B1-3-reste-touche');
      if (!/Vendre/.test(await s.texte(3000)) || !(await s.visible('Encaisser', { prefixe: true }))) return echec('B1', 'toucher le reste n\'ouvre pas la vente');
      const choisie = await s.p.evaluate(() => document.querySelector('.cs-bc[aria-pressed="true"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '');
      if (!/Pale Ale/.test(choisie)) return echec('B1', `la caisse ne s'ouvre pas sur la bière de la carte (choisie : « ${choisie || 'aucune'} »)`);
      // la NEIPA n'est pas la première bière de la caisse : son reste doit l'ouvrir sur elle, pas sur la Pale Ale
      await s.toucher('Fermer', { i: -1, att: 900 });
      await s.toucher('Vendre LOT-NE : reste', { prefixe: true, att: 1200 });
      const choisie2 = await s.p.evaluate(() => document.querySelector('.cs-bc[aria-pressed="true"]')?.innerText.replace(/\s+/g, ' ').trim() ?? '');
      await s.cap('B1-4-reste-neipa');
      if (!/NEIPA/i.test(choisie2)) return echec('B1', `le reste de la NEIPA ouvre la caisse sur « ${choisie2 || 'aucune'} »`);
      ok('B1', 'reste lu sur la carte (120 → 114 × 33 cl · 2 fûts), le toucher ouvre la vente sur la bière de la carte (Pale Ale, NEIPA)');
    }
  },
  {
    id: 'E2', titre: 'Mesurer : « 1,0xx prévu » vient de la courbe du lot, « Comme prévu » l\'enregistre d\'un toucher (D396 E2, N5)', fixture: { sansJour: true, cuve: true },
    async joue(s) {
      await s.onglet('Brassins'); await sleep(900);
      await s.toucher('Mesurer · B-ZZ-FERM', { prefixe: true }); await sleep(1500);
      await s.cap('E2-1-mesurer');
      const t = await s.texte(4000);
      const prevu = t.match(/(1[.,]\d{3})\s+prévu/);
      if (!(await s.visible('Comme prévu', { contient: true }))) return echec('E2', `le geste Mesurer ne propose pas « Comme prévu » (prévu lu : ${prevu ? prevu[1] : 'aucun'}) ; boutons : ${(await s.boutons()).slice(-8).join(' · ')}`);
      const p = prevu ? nombre(prevu[1]) : null;
      if (p == null || p < 1.010 || p > 1.022) return echec('E2', `« prévu » absent ou hors de la courbe (1,010 à 1,022) : ${prevu ? prevu[1] : 'rien lu'}`);
      await s.toucher('Comme prévu', { contient: true, att: 1200 });
      await s.cap('E2-2-enregistre');
      const lot = (await s.store('batches')).find((b) => b.id === 'B-ZZ-FERM');
      const dernier = lot?.gravityLog?.at(-1);
      if ((lot?.gravityLog?.length ?? 0) !== 3 || Math.abs(Number(dernier?.sg) - p) > 0.0006) return echec('E2', `« Comme prévu » n'a pas enregistré ${p} (relevés : ${JSON.stringify(lot?.gravityLog?.map((g) => g.sg))})`);
      ok('E2', `« ${prevu[1]} prévu » enregistré d'un toucher (3 relevés)`);
    }
  },
  {
    id: 'VR-1', titre: 'Recette neuve, un malt de spécialité seul (0,35 kg) : le plan d\'eau calculé par l\'installation ne crie pas « erreur de saisie » (VR-1, BUGS.md)', fixture: { sansJour: true },
    async joue(s) {
      await s.toucher('Actions rapides'); await s.toucher('Recette'); await sleep(800);
      await s.ecrire('textarea[name=recipe_title_label]', 'ZZ TEST Brune');
      await s.toucher('Suivant', { prefixe: true }); await sleep(900);
      await s.toucher('ZZ TEST Caramünch', { contient: true }); await sleep(700);
      // la masse que N1 propose aujourd'hui (0,35 kg), écrite pour que l'étape vaille aussi sur une version qui posait 0 kg
      await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Caramünch"]', '0.35'); await sleep(900);
      const t = await s.texte(8000);
      await s.cap('VR-1-malt-seul');
      if (/Eau d.empâtage[^.]*Erreur de saisie probable|Une valeur à corriger/.test(t))
        return echec('VR-1', `alerte d'eau sur une facture partielle : « ${(t.match(/Eau d.empâtage[^.]*\.[^.]*/) ?? t.match(/Une valeur à corriger[^\n]*/) ?? [''])[0].slice(0, 140)} »`);
      ok('VR-1', 'aucune alerte d\'eau sur le plan calculé');
    }
  },
  {
    id: 'N1', titre: 'Recette neuve : l\'ingrédient proposé par le contexte se pose juste d\'un toucher — malt avec une quantité, houblon du stock d\'abord, levure du stock (N1, v02-v06)', fixture: { sansJour: true },
    async joue(s) {
      const pb = [];
      await s.toucher('Actions rapides'); await s.toucher('Recette'); await sleep(800);
      await s.ecrire('textarea[name=recipe_title_label]', 'ZZ TEST Brune');
      await s.ecrire('textarea[aria-label="Style de la bière"]', 'American IPA'); await sleep(500);
      await s.toucher('American IPA'); await sleep(500);
      await s.toucher('Suivant', { prefixe: true }); await sleep(900);
      // malt : une quantité qui fait sens (v04)
      await s.toucher('ZZ TEST Caramünch', { contient: true }); await sleep(700);
      const masse = await s.p.evaluate(() => document.querySelector('textarea[aria-label^="Masse de ZZ TEST Caramünch"]')?.value ?? null);
      await s.cap('N1-1-malt');
      if (masse == null) pb.push('la ligne « ZZ TEST Caramünch » n\'apparaît pas après un toucher');
      else if (!(nombre(masse) > 0)) pb.push(`le malt du stock entre à ${masse || '0'} kg (une quantité sensée est attendue : le lancement est bloqué sinon)`);
      await s.toucher('Suivant', { prefixe: true }); await sleep(900);
      // houblon : ton stock d'abord, dose qui tient l'IBU (v03)
      const ajouts = await libelles(s, 'Ajouter ');
      await s.cap('N1-2-houblons');
      if (!/^Ajouter (ZZ TEST )?Citra(?![a-z])/.test(ajouts[0] ?? '')) pb.push(`le houblon proposé en premier n'est pas celui du stock (ZZ TEST Citra, α 12,5) : « ${(ajouts[0] ?? 'aucune proposition').slice(0, 70)} »`);
      else {
        const g = nombre((ajouts[0].match(/(\d+(?:[.,]\d+)?)\s*g\b/) ?? [])[1]);
        if (!(g > 0)) pb.push(`la proposition « ${ajouts[0].slice(0, 60)} » ne porte pas de dose`);
        await s.toucher(ajouts[0], { prefixe: true, att: 900 });
        if (!/12[,.]5/.test(await s.texte(5000))) pb.push('l\'α du lot en stock (12,5 %) n\'est pas posé sur la ligne de houblon');
      }
      await s.toucher('Suivant', { prefixe: true }); await sleep(900);
      // levure : la levure du style que tu as, posée d'un toucher (v05)
      await s.cap('N1-3-levure');
      const tl = await s.texte(5000);
      if (!/ton stock d.abord/i.test(tl) || !(await s.visible('Poser', { prefixe: true }))) pb.push('l\'étape Levure ne propose pas « ton stock d\'abord » avec un « Poser »');
      if (pb.length) return echec('N1', pb.join(' ; '));
      ok('N1', 'malt avec quantité, houblon du stock d\'abord (α 12,5), levure à « Poser »');
    }
  },
  {
    id: 'N3', titre: 'Rebrasser : « Tout relier à ton stock » relie les lignes d\'une recette passée d\'un toucher, α du lot posé (N3, v07)', fixture: { sansJour: true, rebrasser: true },
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Recettes', { prefixe: true }); await sleep(1000);
      await s.cap('N3-1-recettes');
      await s.toucher('ZZ TEST Blonde de juillet', { contient: true }); await sleep(1000);
      await s.cap('N3-2-recette');
      if (!(await s.visible('Tout relier', { contient: true }))) return echec('N3', `la recette « ZZ TEST Blonde de juillet » ne propose pas « Tout relier à ton stock » : ${(await s.texte(900)).match(/ZZ TEST Blonde de juillet[^|]{0,160}/)?.[0] ?? 'recette non ouverte'}`);
      await s.toucher('Tout relier', { contient: true, att: 1200 });
      await s.cap('N3-3-reliee');
      const t = await s.texte(5000);
      if (!/\d+ reliées?/.test(t)) return echec('N3', 'après « Tout relier », la recette ne dit pas combien de lignes sont reliées');
      if (!/12[,.]5/.test(t)) return echec('N3', 'l\'α du lot (12,5 %) n\'est pas posé sur le houblon relié (la recette porte 9 %)');
      ok('N3', 'lignes reliées d\'un toucher, α du lot posé');
    }
  },
  {
    id: 'N3-COURSES', titre: 'Rebrasser : « Ajouter aux courses » pose d\'un toucher les manques d\'une recette déjà brassée sur Courses de Stocks (N3, v07)', fixture: { sansJour: true, rebrasser: true },
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Recettes', { prefixe: true }); await sleep(1000);
      await s.toucher('ZZ TEST Blonde de juillet', { contient: true }); await sleep(1000);
      await s.cap('N3C-1-recette');
      if (!(await s.visible('Ajouter aux courses', { contient: true }))) return echec('N3-COURSES', `la recette brassée « ZZ TEST Blonde de juillet » ne propose pas « Ajouter aux courses » : ${(await s.texte(900)).match(/il manque[^|]{0,120}/)?.[0] ?? 'aucun manque dit'}`);
      await s.toucher('Ajouter aux courses', { contient: true, att: 1200 });
      await s.cap('N3C-2-ajoutee');
      if (!/Dans tes courses/.test(await s.texte(5000))) return echec('N3-COURSES', 'après « Ajouter aux courses », la fiche ne dit pas « Dans tes courses »');
      await s.toucher('Voir', { att: 1500 });
      await s.cap('N3C-3-courses');
      const t = await s.texte(8000);
      if (!/ZZ TEST Citra/.test(t) || !/Blonde de juillet/.test(t)) return echec('N3-COURSES', `Courses ne porte pas le Citra de « ZZ TEST Blonde de juillet » : ${t.slice(0, 220)}`);
      ok('N3-COURSES', '« Ajouter aux courses » → « Dans tes courses », Courses cite ZZ TEST Citra pour ZZ TEST Blonde de juillet');
    }
  },
  {
    id: 'N4', titre: 'Fût livré : « Ses 3 fûts sont revenus » rentre d\'un toucher tous les fûts du client, à la date du jour (N4, v11)', fixture: { sansJour: true, retours: true },
    async joue(s) {
      await s.onglet('Stocks'); await sleep(800);
      await s.toucher('Fûts', { dans: 'button,[role=tab]' }); await sleep(900);
      await s.toucher('Ouvrir le fût F-004'); await sleep(1000);
      await s.cap('N4-1-fut');
      if (!(await s.visible('^Ses \\d+ fûts sont revenus', { regex: true }))) return echec('N4', `la fiche du fût F-004 (livré à La Cigogne, 3 fûts dehors) ne propose pas « Ses 3 fûts sont revenus » ; boutons : ${(await s.boutons()).slice(-6).join(' · ')}`);
      const g0 = s.gestes();
      await s.toucher('^Ses \\d+ fûts sont revenus', { regex: true, att: 1200 });
      await s.cap('N4-2-revenus');
      const auj = (() => { const d = new Date(); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; })();
      const futs = await s.store('kegs');
      const pas = ['F-004', 'F-009', 'F-010'].filter((id) => { const k = futs.find((x) => x.id === id); const h = k?.historique?.at(-1); return !k || k.state === 'livre' || k.clientId || h?.quoi !== 'retour-vide' || h?.date !== auj; });
      if (pas.length) return echec('N4', `fûts pas rentrés (à laver, sans client, retour daté du ${auj}) : ${pas.join(', ')}`);
      ok('N4', `les 3 fûts de La Cigogne rentrés en ${s.gestes() - g0} geste, retour du ${auj}`);
    }
  },
  {
    id: 'K7', titre: 'Conditionner : la feuille propose les fûts qui tiennent le volume, lavage compris (« 2 à laver · marquer propres ») (K7, v10)', fixture: { sansJour: true, garde: true },
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Ouvrir le brassin B-ZZ-GARDE'); await sleep(1200);
      await s.toucher('Conditionner', { contient: true, att: 1200 });
      await s.cap('K7-1-feuille');
      const t = await s.texte(4000);
      if (!/2 à laver · marquer propres?/.test(t)) return echec('K7', `la feuille Conditionner (96 L, 2 fûts propres, 2 à laver) ne dit pas « 2 à laver · marquer propres » ; fûts proposés : ${[...new Set(t.match(/F-00\d/g) ?? [])].join(', ') || 'aucun'}`);
      await s.toucher('marquer propre', { contient: true, att: 1000 });
      await s.cap('K7-2-propres');
      const futs = await s.store('kegs');
      const mal = ['F-007', 'F-008'].filter((id) => futs.find((k) => k.id === id)?.state !== 'propre');
      if (mal.length) return echec('K7', `« marquer propres » n'a pas lavé ${mal.join(', ')}`);
      const apres = await s.texte(4000);
      const manque = ['F-005', 'F-006', 'F-007', 'F-008'].filter((id) => !apres.includes(id));
      if (manque.length) return echec('K7', `les quatre fûts ne sont pas proposés ensemble (absents : ${manque.join(', ')})`);
      ok('K7', 'la ligne « à laver · marquer propres » rend les 4 fûts proposés');
    }
  },
  {
    id: 'N2', titre: 'Jour J : commencer d\'office, « Tout pesé », eau d\'empâtage calculée pour 67 °C (70 à 78 °C, pas 55) (N2, v09)', fixture: { sansJour: false },
    async joue(s) {
      const pb = [];
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Brasser · B-ZZ-JOUR', { prefixe: true }); await sleep(1800);
      await s.cap('N2-1-ouverture');
      const lance = !(await s.visible('Commencer aujourd', { contient: true }));
      if (!lance) { pb.push('la page du jour attend « Commencer aujourd\'hui » : le brassin du jour ne commence pas d\'office'); await s.toucher('Commencer aujourd', { contient: true }); await sleep(1500); }
      const t = await s.texte(6000);
      const bloc = t.slice(Math.max(0, t.indexOf('Eau d’empâtage')), t.indexOf('Enregistrer') > 0 ? t.indexOf('Enregistrer') : undefined);
      const degres = [...bloc.matchAll(/pose (\d{2}[,.]\d)|(\d{2}[,.]\d)\s*°C/g)].map((m) => nombre(m[1] ?? m[2]));
      if (!degres.some((d) => d >= 70 && d <= 78)) pb.push(`l'eau d'empâtage n'est pas calculée pour 67 °C (grain 20 kg, 3 L/kg : ≈ 73 °C) : ${degres.length ? `proposée à ${degres.join(' / ')} °C` : '« ?°C », aucune valeur'}`);
      await s.p.evaluate(() => window.scrollBy(0, 400)); await sleep(400);
      await s.cap('N2-2-eau-et-pesee');
      if (!(await s.visible('Tout pesé', { contient: true }))) pb.push('aucun « Tout pesé » pour la pesée du jour');
      if (pb.length) return echec('N2', pb.join(' ; '));
      ok('N2', 'commence d\'office, eau ≈ 73 °C, « Tout pesé » présent');
    }
  },
  {
    id: 'N6', titre: 'Budget d\'un brassin : le coût du litre et la marge par 33 cl se lisent au même endroit (N6)', fixture: { sansJour: true, marge: true },
    async joue(s) {
      await s.onglet('Brassins'); await sleep(800);
      await s.toucher('Ouvrir le brassin B-ZZ-PLAN'); await sleep(1200);
      await s.toucher('Dossier'); await sleep(800);
      await s.toucher('Estimer le budget de ce brassin'); await sleep(1500);
      await s.toucher('Coût du brassin', { contient: true }); await sleep(1500);
      // la reprise des prix du stock (WF2-8) n'est pas ce que N6 juge : si elle est offerte, on la prend ; sinon le manque reste « marge » ou « CHF / L »
      if (await s.visible('Reprendre les', { contient: true })) { await s.toucher('Reprendre les', { contient: true }); await sleep(1000); }
      await s.cap('N6-1-budget');
      const t = await s.texte(6000);
      const pb = [];
      if (!/CHF\s*\/\s*L/.test(t)) pb.push('pas de coût du litre');
      if (!/marge/i.test(t) || !/par 33 cl/.test(t)) pb.push('aucune marge par 33 cl (tarif « ZZ TEST IPA 33 cl » à 4,80 HT au catalogue)');
      if (pb.length) return echec('N6', `${pb.join(' ; ')} ; écran : ${t.slice(0, 160)}`);
      ok('N6', 'coût du litre et marge par 33 cl lus ensemble');
    }
  },
  {
    id: 'K3-COURSES', titre: 'Courses : le manque d\'un brassin planifié (3 kg de Caramünch pour 0,6 au stock) est dit jusqu\'au prochain brassin, pas « rien cette semaine » (K3)', fixture: { sansJour: true, manques: true },
    async joue(s) {
      await s.toucher('Stocks', { dans: 'nav button', contient: true }); await sleep(800); // « 1 Stocks » : la pastille du manque précède le nom
      await s.toucher('Courses', { dans: 'button,[role=tab]' }); await sleep(1000);
      await s.cap('K3-1-courses');
      const t = await s.texte(5000);
      if (/rien cette semaine/.test(t) || !/Caramünch/.test(t)) return echec('K3-COURSES', `Courses ne dit pas le manque de « ZZ TEST Caramünch Typ 2 » (brassin « ZZ TEST Brune » dans 9 jours) : ${t.match(/\d+ manquent?[^|]{0,60}/)?.[0] ?? t.slice(120, 260)}`);
      if (!/2[,.]4\s*kg/.test(t)) return echec('K3-COURSES', 'Courses ne dit pas combien manque (2,4 kg)');
      ok('K3-COURSES', 'le manque du prochain brassin est dans Courses (2,4 kg de Caramünch)');
    }
  },
  {
    id: 'K4', titre: 'Une seule caisse : le Bord montre le point le plus bas à venir (−440 CHF), Finances lit le même chiffre (K4)', fixture: { sansJour: true, caisseBasse: true },
    async joue(s) {
      await s.onglet('Bord'); await sleep(1200);
      await s.cap('K4-1-bord');
      const bord = await s.texte(6000); const pb = [];
      if (!/plus bas/i.test(bord) || !/440/.test(bord)) pb.push(`le Bord ne montre pas le point le plus bas à venir (−440 CHF) : ${bord.match(/Finances[^|]{0,80}\|?[^|]{0,60}/)?.[0] ?? '…'}`);
      await s.onglet('Finances'); await sleep(900);
      await s.toucher('Prévisions', { prefixe: true }); await sleep(1500);
      await s.cap('K4-2-previsions');
      if (!/440/.test(await s.texte(6000))) pb.push('Finances › Prévisions ne dit pas le même point bas (−440)');
      if (pb.length) return echec('K4', pb.join(' ; '));
      ok('K4', 'Bord et Finances disent le même point le plus bas (−440)');
    }
  },
  {
    id: 'D405', titre: 'Une seule caisse : un brassin sans budget reprend l\'estimation de sa recette, et le Bord, Finances et le Calendrier disent le même point bas (D405)', fixture: { sansJour: true, caisseBasse: true, reprise: true },
    async joue(s) {
      const chf = (m) => (m ? -Math.abs(nombre(m[1])) : null); // les trois écrans disent un point bas sous zéro (−, ≈, « au plus » selon l'écran)
      await s.onglet('Bord'); await sleep(1200);
      await s.cap('D405-1-bord');
      const bord = chf((await s.texte(6000)).match(/Point le plus bas[^\d]{0,30}([\d’' ]+(?:[.,]\d+)?)/));
      await s.onglet('Finances'); await sleep(900);
      await s.toucher('Prévisions', { prefixe: true }); await sleep(1500);
      await s.cap('D405-2-previsions');
      const tf = await s.texte(8000);
      await s.onglet('Calendrier'); await sleep(1800);
      await s.cap('D405-3-calendrier');
      const tc = await s.texte(8000);
      const fin = chf(tf.match(/Jusqu.au [^|]{0,40}?[−-]\s?([\d’' ]+[.,]\d{2})/));
      const cal = chf(tc.match(/[−-]\s?([\d’' ]+)\s*CHF à dépenser/));
      const vus = `Bord ${bord ?? '—'}, Finances ${fin ?? '—'}, Calendrier ${cal ?? '—'}`;
      if ([bord, fin, cal].some((v) => v === null)) return echec('D405', `un écran ne dit pas son point bas (${vus})`);
      if (Math.round(bord) !== Math.round(fin) || Math.round(fin) !== Math.round(cal)) return echec('D405', `trois chiffres pour une caisse : ${vus}`);
      if (Math.round(fin) === -440) return echec('D405', `le budget repris de « ZZ TEST Pale » n'est compté nulle part (${vus})`);
      ok('D405', `le même point bas partout, budget repris compris : ${vus}`);
    }
  },
  {
    id: 'F2', titre: 'Recompter : rayon par rayon, « ✓ le reste du rayon » d\'un toucher ; les autres rayons restent « non comptés », jamais 0 (F2, N7)', fixture: { sansJour: true, rayons: true },
    async joue(s) {
      await s.onglet('Stocks'); await sleep(800);
      await s.toucher('Recompter'); await sleep(1000);
      await s.toucher('Compter', { i: 0, att: 900 });
      await s.cap('F2-1-rayon');
      if (!(await s.visible('le reste du rayon', { contient: true }))) return echec('F2', `le rayon ouvert ne propose pas « ✓ le reste du rayon » ; boutons : ${(await s.boutons()).slice(-8).join(' · ')}`);
      await s.toucher('le reste du rayon', { contient: true, att: 1000 });
      await s.cap('F2-2-rayon-fini');
      const t = await s.texte(5000);
      if (!/5\/5 comptés/.test(t)) return echec('F2', `« ✓ le reste du rayon » ne compte pas les 5 articles du rayon Malts (écran : ${t.match(/\d+\/\d+ compt[^|]{0,20}/g)?.join(' · ') ?? t.slice(0, 120)})`);
      if (!/0\/3 comptés/.test(t)) return echec('F2', 'le rayon Houblons (non touché) ne reste pas « 0/3 comptés »');
      ok('F2', 'le reste du rayon Malts compté d\'un toucher, Houblons toujours non compté');
    }
  },
  {
    id: 'C1-RECETTE', titre: 'Récap de la recette : « 3 mois » d\'un toucher dit « vers <mois+3> », et « Enregistrer et préparer » ouvre Brasser à ce mois (D393 C1, K1)', fixture: { sansJour: true },
    async joue(s) {
      const aujourdhui = new Date().toISOString().slice(0, 10);
      await recetteNeuve(s, {});
      await leveureCatalogue(s);
      await versRecap(s);
      await s.cap('C1-1-recap');
      if (!(await s.visible('3 mois', { contient: true }))) return echec('C1-RECETTE', `le récap n'offre aucun horizon « 3 mois » pour brasser ; boutons : ${(await s.boutons()).slice(-8).join(' · ')}`);
      await s.toucher('3 mois', { contient: true, att: 1000 });
      await s.cap('C1-2-trois-mois');
      const attendu = moisPlus(aujourdhui, 3);
      const mois = new RegExp(attendu.replace('.', '\\.'), 'i');
      if (!new RegExp(`vers\\s+${attendu.replace('.', '\\.')}`, 'i').test(await s.texte(6000))) return echec('C1-RECETTE', `« vers ${attendu} » n'apparaît pas après « 3 mois »`);
      await s.toucher('Enregistrer et préparer un brassin'); await sleep(2500);
      await s.cap('C1-3-brasser');
      const t = await s.texte(3000);
      if (!/Planifier/.test(t)) return echec('C1-RECETTE', `la feuille Brasser ne s'ouvre pas (écran : ${t.slice(0, 160)})`);
      if (!mois.test(t.match(/([^\n]{0,30})\s*la cuve et la cave/)?.[1] ?? t.slice(0, 400))) return echec('C1-RECETTE', `Brasser ne s'ouvre pas en ${attendu} : ${t.slice(0, 200)}`);
      ok('C1-RECETTE', `« 3 mois » → « vers ${attendu} » au récap, Brasser s'ouvre en ${attendu}`);
    }
  }
]; }

// ───────────── le parcours ─────────────
async function jouer(dir) {
  const banc = await lancerBanc(dir);
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    for (const e of listeEtapes()) {
      if (seules && !seules.includes(e.id)) continue;
      console.log(`${e.id} — ${e.titre}`);
      const s = await pageNeuve(banc, fixtureChaines(aujourdhui, { sansJour: e.id !== 'WF2-1', ...(e.fixture ?? {}) }).entrees, sortie, e.lecture ? { lecture: lecturesChaines(aujourdhui)[e.lecture] } : {});
      s.banc = banc;
      try {
        await s.demarrer();
        await e.joue(s);
        const fatales = s.erreurs.filter((x) => /^(?!console)/.test(x) || /Uncaught|TypeError|ReferenceError/.test(x));
        if (fatales.length) echec(e.id, `erreur de page : ${fatales[0]}`);
      } catch (err) { await s.cap(`${e.id}-echec`).catch(() => {}); echec(e.id, String(err.message ?? err).slice(0, 300)); }
      await s.fermer().catch(() => {});
    }
  } finally { await banc.fermer(); }
}
