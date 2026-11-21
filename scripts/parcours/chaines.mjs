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
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--etape'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-chaines'));
fs.mkdirSync(sortie, { recursive: true });
const seules = opt('etape') ? opt('etape').split(',') : null;
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

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
/** Recette neuve par l'assistant : « Actions rapides » → « Recette », nom, volume (si dit), malts du stock (Caramünch laissé tel quel si `caramel` est faux). */
async function recetteNeuve(s, { nom = 'ZZ TEST Brune', volume = null, caramel = true, pils = true } = {}) {
  await s.toucher('Actions rapides'); await s.toucher('Recette'); await sleep(800);
  await s.ecrire('textarea[name=recipe_title_label]', nom);
  if (volume != null) await s.ecrire('textarea[aria-label="Volume en fermenteur"]', String(volume));
  await s.toucher('Suivant', { prefixe: true }); await sleep(800);
  await s.toucher('ZZ TEST Caramünch', { contient: true }); await sleep(700);
  if (caramel) await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Caramünch"]', '0.6');
  if (pils) { await s.toucher('ZZ TEST Malt pilsner', { contient: true }); await sleep(700); await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Malt pilsner"]', '5'); }
}
/** De l'étape Malts à l'étape Levure (Houblons passé), puis la levure du catalogue (dose par défaut posée par l'application). */
async function leveureCatalogue(s) {
  await s.toucher('Suivant', { prefixe: true }); await sleep(700);
  await s.toucher('Suivant', { prefixe: true }); await sleep(800);
  await s.ecrire('textarea[placeholder="Chercher une levure"]', 'US-05'); await sleep(900);
  await s.toucher('SafAle US-05', { contient: true }); await sleep(900);
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
      if (!/ZZ TEST IPA/.test(t) || !/Commencer aujourd/.test(t)) return echec('B2', `la page du jour de brassage ne s'ouvre pas (écran : ${t.slice(0, 160)})`);
      ok('B2', 'la page du jour de brassage s\'ouvre (Conduite, « Commencer aujourd’hui »)');
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
      const lignes = await s.p.evaluate(() => [...document.querySelectorAll('[data-chose-id]')].map((e) => (e.getAttribute('aria-label') || e.innerText || '').replace(/s+/g, ' ').slice(0, 80)));
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
      ok('B11', 'la Pale Ale (conditionnée) et la NEIPA (terminée) sont listées');
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
      const s = await pageNeuve(banc, fixtureChaines(aujourdhui).entrees, sortie);
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
