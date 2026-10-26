// Témoin négatif de check:engine (B3, voie p8, 23.10) : une variable de module, jamais l'environnement du processus.
// Le moteur tourne aussi dans le navigateur (maquette, puis l'app) où l'objet `process` de Node n'existe pas : il ne
// lit donc aucune variable d'environnement. Les tests la posent (tests/temoin.ts, depuis V4_TEMOIN_NEGATIF) ; ailleurs elle
// reste vide et le moteur calcule normalement.
//   'bande'        : élargit la bande floral de 3A à 0–100 (style/scale.ts) ;
//   'substitution' : poids de substitution tous nuls (substitution.ts) ;
//   'tolerance'    : a priori moyen de la tolérance inconnu (tolerance.ts).
export type TemoinNegatif = '' | 'bande' | 'substitution' | 'tolerance';

let actif: string = '';

/** Pose le témoin négatif (chaîne vide ou null : aucun). */
export function poserTemoinNegatif(nom: string | null | undefined): void {
  actif = nom ?? '';
}

/** Le témoin négatif actif ('' le plus souvent). */
export const temoinNegatif = (): string => actif;
