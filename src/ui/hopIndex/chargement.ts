/**
 * Chargement à la demande des outils houblons v4 (#167). Aucun import statique du moteur ici : ce fichier est léger
 * et peut être importé par le démarrage (App.tsx) sans rien ajouter.
 */
export type Outils = typeof import('./outils');

let promesse: Promise<Outils> | null = null;
let charge: Outils | null = null;

/** Les outils, s'ils sont déjà là (préchargés ou ouverts) : l'écran n'a alors aucun état d'attente. */
export const outilsCharges = (): Outils | null => charge;

/** c8 : le chunk des outils ET les composés (composes-houblon.json, morceau à part, 19 ko gzip), demandés ensemble : l'un n'attend pas l'autre.
 * Les outils ne sont « chargés » qu'une fois les composés posés : aucun écran ne voit des composés absents (jamais un faux zéro). Les imports
 * dynamiques ne comptent pas dans la fermeture du budget B5 (scripts/check-hop-budget.mjs). Hors build de l'application (maquettes, scripts),
 * le fichier est déjà installé en synchrone et cette étape se résout aussitôt. */
export function importerOutilsEtComposes(
  importerOutils: () => Promise<Outils> = () => import('./outils'),
  importerFichier: () => Promise<unknown> = () => import('../../data/hopV4/composes-houblon.json'),
): Promise<Outils> {
  const fichier = importerFichier();
  fichier.catch(() => {}); // l'erreur remonte par la chaîne ci-dessous ; pas de rejet « non géré » si le fichier échoue avant le module
  return Promise.all([importerOutils(), import('../../domain/hopIndex/v4/composes')])
    .then(([o, c]) => c.chargerComposes(() => fichier).then(() => o));
}

/** Charge le chunk des outils (une seule fois). Un échec réseau n'est pas mémorisé : l'ouverture suivante réessaie. */
export function chargerOutils(importer: () => Promise<Outils> = importerOutilsEtComposes): Promise<Outils> {
  if (!promesse) {
    promesse = importer().then(
      (o) => { charge = o; return o; },
      (e) => { promesse = null; throw e; }
    );
  }
  return promesse;
}

/** Pour les tests : oublie l'état mémorisé. */
export function oublierOutils(): void { promesse = null; charge = null; }
