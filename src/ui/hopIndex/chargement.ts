/**
 * Chargement à la demande des outils houblons v4 (#167). Aucun import statique du moteur ici : ce fichier est léger
 * et peut être importé par le démarrage (App.tsx) sans rien ajouter.
 */
export type Outils = typeof import('./outils');

let promesse: Promise<Outils> | null = null;
let charge: Outils | null = null;

/** Les outils, s'ils sont déjà là (préchargés ou ouverts) : l'écran n'a alors aucun état d'attente. */
export const outilsCharges = (): Outils | null => charge;

/** Charge le chunk des outils (une seule fois). Un échec réseau n'est pas mémorisé : l'ouverture suivante réessaie. */
export function chargerOutils(importer: () => Promise<Outils> = () => import('./outils')): Promise<Outils> {
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
