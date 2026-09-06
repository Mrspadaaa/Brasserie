import { WaterIons } from '../../types';


// --- Calculs ------------------------------------------------------------------

export const ZERO: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };

/** Mélange d'une source et d'osmosée. `diRatioPct` = part d'osmosée. */
export function dilute(source: WaterIons, diRatioPct: number): WaterIons {
  const safeDi = Number.isFinite(diRatioPct) ? diRatioPct : 0;
  const tap = Math.max(0, Math.min(100, 100 - safeDi)) / 100;
  const safeIon = (val: number | undefined) => (Number.isFinite(val) ? Math.max(0, val! * tap) : 0);
  return {
    ca: round1(safeIon(source?.ca)),
    mg: round1(safeIon(source?.mg)),
    na: round1(safeIon(source?.na)),
    so4: round1(safeIon(source?.so4)),
    cl: round1(safeIon(source?.cl)),
    hco3: round1(safeIon(source?.hco3))
  };
}

/** Somme de deux panneaux ioniques. */
export function addIons(a: WaterIons, b: WaterIons): WaterIons {
  return {
    ca: round1(a.ca + b.ca),
    mg: round1(a.mg + b.mg),
    na: round1(a.na + b.na),
    so4: round1(a.so4 + b.so4),
    cl: round1(a.cl + b.cl),
    hco3: round1(a.hco3 + b.hco3)
  };
}

/** Alcalinité totale exprimée en ppm de CaCO₃. */
export function alkalinityAsCaCO3(hco3: number): number {
  return round1((hco3 * 50) / 61);
}

/**
 * Diviseurs de Kolbach, pour des ppm d'ION BRUT.
 *
 * ⚠️ CORRECTION DE FOND. Le code portait 3.5 et 7, qui sont les diviseurs de la
 * formule d'origine — mais celle-ci prend les duretés calcique et magnésienne
 * EXPRIMÉES EN CaCO₃, pas les ppm d'ion. Or l'analyse d'eau, la table des sels
 * et tout le reste de ce fichier sont en ppm d'ion.
 *
 *   Ca en CaCO₃ = 2.497 × Ca ppm   ➔   2.497 / 3.5 = 1 / 1.402
 *   Mg en CaCO₃ = 4.118 × Mg ppm   ➔   4.118 / 7   = 1 / 1.700
 *
 * Appliquer 3.5 et 7 à des ppm d'ion sous-estimait la correction d'un facteur
 * 2.5 sur le calcium et 4.1 sur le magnésium : l'AR sortait trop haute, et
 * l'acide était surdosé de 33 % sur l'eau de Fribourg — jusqu'à 56 fois sur une
 * eau très calcique. Les 47 tests étaient au vert : ils figeaient la formule
 * fausse comme valeur attendue.
 */
export const CA_DIVISOR = 1.4;

export const MG_DIVISOR = 1.7;

/**
 * Alcalinité résiduelle (Kolbach), en ppm de CaCO₃.
 *
 * C'est LE chiffre qui compte : le calcium et le magnésium réagissent avec les
 * phosphates du malt et libèrent de l'acidité, ce qui annule une partie de
 * l'alcalinité. Une AR trop haute empêche la maische de descendre en pH.
 *
 *   AR = Alcalinité − Ca/1.4 − Mg/1.7   (ions en ppm)
 */
export function residualAlkalinity(ions: WaterIons): number {
  return round1(
    alkalinityAsCaCO3(ions.hco3) - ions.ca / CA_DIVISOR - ions.mg / MG_DIVISOR
  );
}

/**
 * Redistribue sulfate et chlorure pour atteindre un rapport visé, à somme
 * constante.
 *
 * C'est ce que fait le curseur SO₄ ⇄ Cl : on ne change pas la minéralité
 * totale, on déplace le curseur entre « amer et sec » et « rond et malté ».
 */
export function rebalanceRatio(target: WaterIons, ratio: number): WaterIons {
  const sum = target.so4 + target.cl;
  /* Même garde que `acidNeeded` : un NaN passe au travers de `<= 0`. */
  if (!Number.isFinite(sum) || !Number.isFinite(ratio) || sum <= 0 || ratio <= 0) return target;
  const cl = sum / (1 + ratio);
  return {
    ...target,
    so4: Math.round(sum - cl),
    cl: Math.round(cl)
  };
}

/** Ratio sulfate/chlorure, et ce qu'il annonce en bouche. */
export function sulfateChlorideRatio(ions: WaterIons): {
  ratio: number | null;
  label: string;
} {
  if (ions.cl <= 0) {
    return { ratio: null, label: 'aucun chlorure — amertume nue' };
  }
  const ratio = Math.round((ions.so4 / ions.cl) * 100) / 100;
  const label =
    ratio >= 3
      ? 'très houblonné, amertume sèche'
      : ratio >= 1.5
        ? 'houblonné'
        : ratio >= 0.8
          ? 'équilibré'
          : ratio >= 0.4
            ? 'malté, rond'
            : 'très malté, moelleux';
  return { ratio, label };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

