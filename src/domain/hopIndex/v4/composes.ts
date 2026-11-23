// c8 : les composés des houblons (src/data/hopV4/composes-houblon.json, 80 ko bruts, 19 ko gzip) sortent du chunk des outils (budget B5).
// Ce module est tout petit et ne lit aucune donnée par import statique : il tient l'objet que lit pouvoir.ts et le chargement.
//
//  - `DONNEES_COMPOSES` : UN objet, d'identité stable. Vide avant l'arrivée, rempli (Object.assign) à l'arrivée : toute référence prise avant
//    (DONNEES_POUVOIR, la table de pouvoir.ts) voit donc les données sans être relue. Rien n'est jamais lu comme 0 : avant l'arrivée,
//    les tables sont absentes (undefined), pas vides de valeurs.
//  - `chargerComposes(importer)` : un seul chargement, partagé ; un échec n'est pas mémorisé (le suivant réessaie).
//  - `siComposesArrivent(f)` : même modèle que `siCataloguePleinArrive` (data.ts) ; appelle `f` une fois, tout de suite si c'est fait.
//  - L'ouverture d'un outil attend les composés avec le chunk des outils, en parallèle (chargement.ts) : un écran n'est jamais montré
//    avec des composés absents. Le préchargement au repos (precharge.ts) les amène bien avant.
//
// Qui lit les données sans passer par le chargeur asynchrone (tests Vitest, scripts, maquettes aux builds séparés, worker) les a en
// synchrone : `import.meta.glob` eager ci-dessous, SAUF dans le build de l'application (vite.config.ts pose VITE_COMPOSES_A_PART=on :
// le test est alors constant, Rollup retire la branche et le JSON n'entre plus dans le chunk des outils). Le worker (calcul.worker.ts)
// installe le fichier lui-même, par import statique, dans son propre bundle.

export type BrutComposes = Record<string, unknown>;

/** Les données de composes-houblon.json, d'identité stable : voir l'en-tête. Typées finement par pouvoir.ts. */
export const DONNEES_COMPOSES: BrutComposes = {};

/** Levée quand un calcul de composés est demandé avant l'arrivée des données (jamais une valeur par défaut). */
export class ComposesAbsents extends Error {
  constructor() { super('composes-houblon.json n’est pas encore chargé : aucun calcul de composés possible (jamais 0).'); this.name = 'ComposesAbsents'; }
}

let pret = false;
let enCours: Promise<BrutComposes> | null = null;
const ecouteurs: (() => void)[] = [];

/** Les composés, s'ils sont arrivés. */
export const composesCharges = (): BrutComposes | null => (pret ? DONNEES_COMPOSES : null);

/** Pose les données (arrivée du chargement, ou import statique du worker et des contextes synchrones). Sans effet sur l'identité de l'objet. */
export function installerComposes(brut: unknown): BrutComposes {
  const donnees = ((brut as { default?: unknown } | null)?.default ?? brut) as BrutComposes;
  Object.assign(DONNEES_COMPOSES, donnees);
  const premiere = !pret;
  pret = true;
  if (premiere) for (const f of ecouteurs.splice(0)) { try { f(); } catch (e) { console.error('composés : un abonné a échoué', e); } }
  return DONNEES_COMPOSES;
}

/** Appelle `f` une fois à l'arrivée des composés (tout de suite s'ils sont là) ; rend le désabonnement. */
export function siComposesArrivent(f: () => void): () => void {
  if (pret) { f(); return () => {}; }
  ecouteurs.push(f);
  return () => { const i = ecouteurs.indexOf(f); if (i >= 0) ecouteurs.splice(i, 1); };
}

/** Charge les composés (une seule fois). `importer` rend le module du fichier (avec ou sans `default`). Un échec n'est pas mémorisé. */
export function chargerComposes(importer: () => Promise<unknown>): Promise<BrutComposes> {
  if (pret) return Promise.resolve(DONNEES_COMPOSES);
  enCours ??= importer().then(installerComposes, (e) => { enCours = null; throw e; });
  return enCours;
}

/** Pour les tests : vide l'objet et oublie l'état (l'identité de l'objet ne change pas). */
export function oublierComposes(): void {
  for (const k of Object.keys(DONNEES_COMPOSES)) delete DONNEES_COMPOSES[k];
  pret = false; enCours = null; ecouteurs.length = 0;
}

// Contextes synchrones (voir l'en-tête). Dans le build de l'application, cette constante vaut {} et le JSON n'est pas importé.
const SYNCHRONE: Record<string, unknown> = import.meta.env.VITE_COMPOSES_A_PART === 'on'
  ? {}
  : import.meta.glob('../../../data/hopV4/composes-houblon.json', { eager: true, import: 'default' });
for (const brut of Object.values(SYNCHRONE)) installerComposes(brut);
