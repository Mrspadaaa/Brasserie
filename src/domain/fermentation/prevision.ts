/**
 * E2 (D396, N5) : la densité « prévue » d'un lot en cuve pour aujourd'hui, lue sur la courbe « attendu » que la fiche dessine déjà
 * (`GrapheTemps`, pointillé « Attendu, pas mesuré ») : une courbe de Bézier quadratique du dernier relevé (jour dj) vers le haut de la bande FG,
 * point de contrôle au lendemain du relevé sur le haut de la bande, arrivée à dj + 3 (borné au dernier jour du graphique). Au-delà, le haut
 * de la bande. Aucun nouveau modèle (PORT, « État de l'art ») ; les quelques pixels de marge du dessin sont ignorés (moins d'un millième).
 * Sans FG visée, sans relevé après l'OG, déjà dans la bande, ou relevé du jour déjà fait : `null`. L'inconnu n'est jamais inventé : le geste
 * « Mesurer » part alors du dernier relevé.
 */
export interface EntreePrevision {
  /** Jour courant (J+n depuis le levurage). */
  n: number;
  nbJours: number;
  dernier: { jour: number; sg: number; og?: boolean } | null;
  fg: [number, number] | null;
}

export function densitePrevue({ n, nbJours, dernier, fg }: EntreePrevision): number | null {
  if (!fg || !dernier || dernier.og) return null;
  const haut = fg[1];
  const dj = dernier.jour;
  const fin = Math.min(nbJours - 1, dj + 3);
  if (!(dernier.sg > haut) || !(fin > dj) || !(n > dj)) return null;
  if (n >= fin) return arrondi(haut);
  // x(t) = (1−t)²·dj + 2(1−t)t·(dj+1) + t²·fin, croissant sur [0, 1] : t par dichotomie (même lecture que le dessin).
  let a = 0, b = 1;
  for (let k = 0; k < 40; k++) {
    const t = (a + b) / 2, u = 1 - t;
    if (u * u * dj + 2 * u * t * (dj + 1) + t * t * fin < n) a = t; else b = t;
  }
  const t = (a + b) / 2, u = 1 - t;
  return arrondi(u * u * dernier.sg + 2 * u * t * haut + t * t * haut);
}

const arrondi = (v: number) => Math.round(v * 1000) / 1000;

/** La prévision en millièmes, l'unité du curseur de densité (`EtatMesure.milli`) ; `null` comme `densitePrevue`. */
export function milliPrevu(e: EntreePrevision): number | null {
  const p = densitePrevue(e);
  return p === null ? null : Math.round(p * 1000);
}
