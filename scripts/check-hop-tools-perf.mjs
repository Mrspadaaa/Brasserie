// Contrôle BLOQUANT de la fluidité des outils houblons sur un jeu réaliste « beaucoup de données » (#166, D65, épopée #159).
// Ses mots : « La fluidité, l'optimisation de code est très importante vu qu'il y aura beaucoup de données !! »
//
// Usage (depuis la racine) : node scripts/check-hop-tools-perf.mjs [--temoin=lent] [--echelle=10] [--snapshot=bloquant]
//   (npm run check:hop-perf)
//
// Le jeu (scripts/bench-hop-v4.ts --volume) : 318 houblons, stock ×5 (80 articles), 10 recettes et 10 dégustations (SIMULÉES,
// graine fixe, aucune donnée réelle), snapshots répétés. Chaque calcul est classé par le MOMENT où il tourne (lu dans les
// écrans et dans le préchauffage de la Coquille, pas deviné) :
//   glisser  sous le doigt, pendant un cran de moment, de jours ou de dose : budget d'une image
//   toucher  à l'ouverture d'un outil ou d'une feuille, après le préchauffage au repos
//   repos    le préchauffage, découpé en tranches, et le premier écran
// Budgets de l'épopée #159 (sur un téléphone moyen) : glisser 16 ms en médiane et 33 ms au 95e ; toucher 100 ms ; écran 2,5 s.
// FACTEUR ×4 (hypothèse écrite : aucun vrai téléphone n'a été mesuré) : ce PC est supposé 4 fois plus rapide que le téléphone,
// donc chaque budget est divisé par 4 : glisser 4 ms (médiane) et 8 ms (95e), toucher 25 ms, tranche de repos 50 ms (budget d'une
// tâche au repos, non divisé), premier écran avec tout le préchauffage 625 ms.
// Juge : le 95e centile des dix cas (le plus lent des dix, quand n = 10) ; pour le glisser, la médiane ET le 95e.
// Un calcul est mesuré À FROID sur une entrée que le cache n'a jamais vue (L20) ; « (cache) » dit le contraire.
//
// --temoin=lent : un délai de 8 ms est injecté dans un calcul fait sous le doigt ; le contrôle DOIT alors échouer (preuve qu'il juge).
// --echelle=10  : en plus, le même jeu avec catalogue et stock ×10, RAPPORTÉ sans budget (ne change pas le verdict).
// --snapshot=bloquant : tient pour bloquante la relance des calculs sur des données identiques (T8, #169). Par défaut elle est
//   mesurée et dite, sans compter (la fabrique n'a pas encore d'empreinte des données).
// Sortie : une ligne par calcul (moment, nom, mesure, budget, OK ou DÉPASSÉ), puis PERF-OUTILS OK ou PERF-OUTILS ECHEC (n).
// Code de sortie : 0 (OK), 1 (échec).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (nom) => argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? null;
const TEMOIN = opt('temoin');
const ECHELLE = Number(opt('echelle') ?? 1);
const SNAPSHOT_BLOQUANT = opt('snapshot') === 'bloquant';

// ---------- Budgets (ms) : épopée #159 divisée par le facteur ×4 ----------
const FACTEUR = 4;
const B = {
  glisserMed: 16 / FACTEUR, glisserP95: 33 / FACTEUR, toucher: 100 / FACTEUR,
  tranche: 50, premierEcran: 2500 / FACTEUR,
};

/** Une ligne par calcul. juge : 'glisser' (médiane ET 95e), 'p95'. info : rapporté, jamais compté. */
const LIGNES = [
  { moment: 'glisser', id: 'glisser:cran-ma-biere', nom: 'un cran de moment ou de jours : Ma bière relue (cran jamais vu)', juge: 'glisser' },
  { moment: 'glisser', id: 'glisser:cran-apercu-levure', nom: 'un cran : aperçu de la levure (US-05 face à Pomona)', juge: 'glisser' },
  { moment: 'glisser', id: 'glisser:pas-de-dose', nom: 'un pas de dose du stepper de Ma bière (houblon dégusté, deux lectures)', juge: 'glisser' },
  { moment: 'glisser', id: 'glisser:cran-deja-calcule-cache', nom: 'un cran déjà calculé à l\'ouverture (cache)', juge: 'glisser' },

  { moment: 'toucher', id: 'toucher:dryhopper-frise-complete', nom: 'ouvrir Dryhopper : la frise complète (24 crans, non préchauffée)', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:levure-effets-4-souches', nom: 'ouvrir Levure : l\'effet des 4 souches', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:substituer-classement', nom: 'ouvrir Substituer : le classement du moteur (non préchauffé)', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:comparer-12-houblons', nom: 'ouvrir Comparer : 12 houblons côte à côte', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:comparer-jour-apres-jour', nom: 'Comparer, feuille « jour après jour » (12 houblons × 7 jours)', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:suggerer-sans-prechauffage', nom: 'ouvrir Suggérer par son adresse, sans préchauffage (visée jamais vue)', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:suggerer-prechauffe-cache', nom: 'ouvrir Suggérer après le préchauffage (cache)', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:ma-biere-apres-un-outil', nom: 'revenir sur Ma bière après un outil (recette changée)', juge: 'p95', budget: B.toucher },
  { moment: 'toucher', id: 'toucher:fiche-houblon', nom: 'ouvrir la fiche d\'un houblon', juge: 'p95', budget: B.toucher },

  { moment: 'repos', id: 'repos:creation-du-moteur', nom: 'créer le moteur sur les données', juge: 'p95', budget: B.tranche },
  { moment: 'repos', id: 'repos:premier-ecran-ma-biere', nom: 'premier écran : Ma bière lue', juge: 'p95', budget: B.tranche },
  { moment: 'repos', id: 'repos:tranche-voies-de-suggerer', nom: 'tranche de préchauffage : voies de Suggérer (proposer + leviers levure)', juge: 'p95', budget: B.tranche },
  { moment: 'repos', id: 'repos:voies-proposer', nom: '  dont proposer (composante de la tranche)', juge: 'p95', budget: B.tranche, info: true },
  { moment: 'repos', id: 'repos:voies-leviers-levure', nom: '  dont leviers levure (composante de la tranche)', juge: 'p95', budget: B.tranche, info: true },
  { moment: 'repos', id: 'repos:tranche-remplacants', nom: 'tranche de préchauffage : remplaçants d\'un ajout', juge: 'p95', budget: B.tranche },
  { moment: 'repos', id: 'repos:total-premier-ecran-et-prechauffage', nom: 'le tout : premier écran + tout le préchauffage', juge: 'p95', budget: B.premierEcran },

  { moment: 'repos', id: 'snapshot:creation-du-moteur', nom: 'snapshot identique : recréer le moteur sur des tableaux neufs', juge: 'p95', budget: B.tranche },
];
const SNAP_REF = 'snapshot:calcul-sur-le-meme-moteur';
const SNAP_RELANCE = 'snapshot:calcul-apres-donnees-identiques';

// ---------- Mesures : le banc du moteur ----------
function banc(args) {
  const vn = path.join(racine, 'node_modules', 'vite-node', 'vite-node.mjs');
  const r = spawnSync(process.execPath, [vn, 'scripts/bench-hop-v4.ts', '--', '--volume', ...args], { cwd: racine, encoding: 'utf8', timeout: 1500000, maxBuffer: 64 * 1024 * 1024 });
  const lignes = `${r.stdout ?? ''}`.trim().split('\n');
  try {
    const j = JSON.parse(lignes[lignes.length - 1]);
    if (!j.mesures || !Object.keys(j.mesures).length) throw new Error('aucune mesure');
    return j;
  } catch (e) {
    return { erreur: `le banc n'a rien mesuré (${e.message}) : code ${r.status}\n${`${r.stderr ?? ''}`.trim().split('\n').slice(-6).join('\n')}` };
  }
}

const f1 = (x) => (Math.round(x * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ms = (x) => `${f1(x)} ms`;

function evaluer(m, ligne) {
  if (ligne.juge === 'glisser') {
    const ok = m.med <= B.glisserMed && m.p95 <= B.glisserP95;
    return { ok, mesure: `méd ${ms(m.med)} · p95 ${ms(m.p95)} (n=${m.n})`, budget: `méd ≤ ${f1(B.glisserMed)} · p95 ≤ ${f1(B.glisserP95)} ms` };
  }
  const ok = m.p95 <= ligne.budget;
  return { ok, mesure: `méd ${ms(m.med)} · p95 ${ms(m.p95)} (n=${m.n})`, budget: `p95 ≤ ${f1(ligne.budget)} ms` };
}

function rapporter(j, titre, { juger }) {
  console.log(`\n${titre}`);
  console.log(`  jeu : ${j.meta.catalogue} houblons · stock ${j.meta.stock} · ${j.meta.recettes} recettes · ${j.meta.degustations} dégustations (simulées) · empreinte ${j.meta.empreinteJeu} · tas ${f1(j.meta.memoireMo)} Mo`);
  let depasses = 0;
  const vus = new Set();
  for (const l of LIGNES) {
    const m = j.mesures[l.id];
    if (!m) continue;
    vus.add(l.id);
    const e = evaluer(m, l);
    const statut = !juger || l.info ? 'rapporté' : e.ok ? 'OK' : 'DÉPASSÉ';
    if (juger && !l.info && !e.ok) depasses++;
    console.log(`  ${l.moment.padEnd(7)} | ${l.nom} | ${e.mesure} | budget ${e.budget} | ${statut}`);
  }
  const apres = j.mesures[SNAP_RELANCE], ref = j.mesures[SNAP_REF];
  if (apres && ref) {
    const relance = apres.med > Math.max(1, 3 * ref.med);
    const bloquant = juger && SNAPSHOT_BLOQUANT;
    const statut = !relance ? 'OK' : bloquant ? 'DÉPASSÉ' : 'rapporté (T8, #169)';
    if (relance && bloquant) depasses++;
    console.log(`  repos   | snapshot identique : le premier calcul après recréation (${ms(apres.med)}, n=${apres.n}) face au même moteur rappelé (${ms(ref.med)}) | ${relance ? `×${f1(apres.med / Math.max(ref.med, 0.01))} : les calculs sont RELANCÉS, faute d'empreinte des données` : 'aucun calcul relancé'} | budget aucun calcul relancé | ${statut}`);
  }
  return { depasses, vus };
}

// ---------- Programme ----------
const cpu = os.cpus()[0]?.model?.trim() ?? 'processeur inconnu';
console.log('PERF-OUTILS : fluidité des outils houblons sur un jeu réaliste (#166)');
console.log(`  machine : ${cpu} · ${os.cpus().length} cœurs · Node ${process.version}`);
console.log(`  facteur ×${FACTEUR} (hypothèse écrite, aucun vrai téléphone mesuré) : budgets de l'épopée #159 divisés par ${FACTEUR} → glisser ${f1(B.glisserMed)} ms (méd) et ${f1(B.glisserP95)} ms (p95), toucher ${f1(B.toucher)} ms, tranche de repos ${B.tranche} ms, premier écran ${B.premierEcran} ms`);
if (TEMOIN) console.log(`  témoin « ${TEMOIN} » : un délai de 8 ms injecté dans un calcul sous le doigt (le contrôle doit échouer)`);

const args = TEMOIN ? [`--temoin=${TEMOIN}`, '--groupes=glisser'] : [];
const j = banc(args);
if (j.erreur) {
  console.log(`  ${j.erreur}`);
  console.log('PERF-OUTILS ECHEC (1)');
  process.exit(1);
}
const { depasses, vus } = rapporter(j, `Verdict sur le jeu ×1 (bloquant) — ${TEMOIN ? 'groupe glisser seul' : 'glisser, toucher, repos'}`, { juger: true });
if (!vus.size) {
  console.log('  aucune ligne du contrôle n\'a de mesure : le banc a changé de noms');
  console.log('PERF-OUTILS ECHEC (1)');
  process.exit(1);
}

if (ECHELLE > 1 && !TEMOIN) {
  const x = banc([`--echelle=${ECHELLE}`]);
  if (x.erreur) console.log(`\n  ×${ECHELLE} : ${x.erreur}`);
  else rapporter(x, `Rapporté à l'échelle ×${ECHELLE} (catalogue et stock ×${ECHELLE}) — non bloquant, sans verdict`, { juger: false });
}

if (depasses) {
  console.log(`\nPERF-OUTILS ECHEC (${depasses})`);
  process.exit(1);
}
console.log('\nPERF-OUTILS OK');
