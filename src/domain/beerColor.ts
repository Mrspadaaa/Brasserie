import { MaltIngredient } from '../types';

/**
 * Couleur de la bière, calculée depuis la facture de grain.
 *
 * L'échelle `ebc-*` du système de design a été dessinée sur la vraie référence
 * bière — paille, or, ambre, cuivre, brun, stout. Elle n'avait jusqu'ici aucune
 * donnée à représenter : la couleur n'était calculée nulle part. C'est ce
 * module qui la lui donne.
 *
 * ⚠️ Règle absolue : si un seul malt n'a pas sa couleur renseignée, on renvoie
 * `null`. Un EBC calculé sur une facture incomplète serait faux, et un chiffre
 * faux est pire qu'une case vide.
 */

export interface BeerColor {
  /** Standard Reference Method — l'échelle américaine. */
  srm: number;
  /** European Brewery Convention — celle qu'on lit en Europe. */
  ebc: number;
  /** Nom de la teinte, dans l'échelle du système de design. */
  band: ColorBand;
  /** Classe Tailwind du fond de la pastille. */
  swatch: string;
  /** Description en français. */
  label: string;
}

export type ColorBand = 'straw' | 'gold' | 'amber' | 'copper' | 'brown' | 'stout';

/**
 * Bornes EBC de chaque teinte. Les valeurs suivent la référence brassicole
 * courante ; les noms sont exactement ceux de `tailwind.config.js`.
 */
const BANDS: Array<{ band: ColorBand; maxEbc: number; label: string; swatch: string }> = [
  { band: 'straw', maxEbc: 8, label: 'Paille', swatch: 'bg-ebc-straw' },
  { band: 'gold', maxEbc: 14, label: 'Dorée', swatch: 'bg-ebc-gold' },
  { band: 'amber', maxEbc: 26, label: 'Ambrée', swatch: 'bg-ebc-amber' },
  { band: 'copper', maxEbc: 40, label: 'Cuivrée', swatch: 'bg-ebc-copper' },
  { band: 'brown', maxEbc: 60, label: 'Brune', swatch: 'bg-ebc-brown' },
  { band: 'stout', maxEbc: Infinity, label: 'Noire', swatch: 'bg-ebc-stout' }
];

const LB_PER_KG = 2.2046226;
const GAL_PER_L = 0.26417205;
/** L'EBC vaut 1.97 fois le SRM ; le degré Lovibond des malteurs suit le SRM. */
const EBC_PER_SRM = 1.97;

export function bandForEbc(ebc: number): { band: ColorBand; label: string; swatch: string } {
  return BANDS.find((b) => ebc <= b.maxEbc) ?? BANDS[BANDS.length - 1];
}

/**
 * Équation de Morey, la plus utilisée pour prédire la couleur d'une bière :
 *
 *   MCU = Σ (couleur °L × masse en livres) ÷ volume en gallons
 *   SRM = 1.4922 × MCU^0.6859
 *
 * Renvoie `null` dès qu'une couleur de malt manque, ou que le volume est nul.
 */
export function computeBeerColor(malts: MaltIngredient[], volumeL: number): BeerColor | null {
  if (!volumeL || volumeL <= 0 || !Number.isFinite(volumeL)) return null;
  if (!malts || malts.length === 0) return null;
  if (
    malts.some(
      (m) =>
        m.colorEbc == null ||
        !Number.isFinite(m.colorEbc) ||
        m.colorEbc < 0 ||
        m.weightKg == null ||
        !Number.isFinite(m.weightKg) ||
        m.weightKg < 0
    )
  ) {
    return null;
  }

  const volumeGal = volumeL * GAL_PER_L;

  const mcu = malts.reduce((sum, m) => {
    const lovibond = (m.colorEbc as number) / EBC_PER_SRM;
    const weightLb = m.weightKg * LB_PER_KG;
    return sum + (lovibond * weightLb) / volumeGal;
  }, 0);

  if (!Number.isFinite(mcu) || mcu < 0) return null;

  const srm = 1.4922 * Math.pow(mcu, 0.6859);
  if (!Number.isFinite(srm) || srm < 0) return null;
  const ebc = srm * EBC_PER_SRM;
  if (!Number.isFinite(ebc) || ebc < 0) return null;
  const { band, label, swatch } = bandForEbc(ebc);

  return {
    srm: Math.round(srm * 10) / 10,
    ebc: Math.round(ebc * 10) / 10,
    band,
    label,
    swatch
  };
}

/** Ce qui manque pour pouvoir calculer la couleur — pour le dire précisément. */
export function missingColorData(malts: MaltIngredient[]): string[] {
  return malts.filter((m) => m.colorEbc == null).map((m) => m.name);
}

/* ---------------------------------------------------------------------------
 * La couleur d'un MALT, qui n'est pas celle d'une bière
 * ------------------------------------------------------------------------ */

/**
 * Classe un malt par sa couleur.
 *
 * ⚠️ Pourquoi une seconde échelle. `bandForEbc` décrit une BIÈRE FINIE, et sa
 * dernière borne s'arrête à 60 EBC : au-delà, la bière est noire et il n'y a
 * plus rien à distinguer. Un malt, lui, va de 3 EBC pour un pilsner à 1400 pour
 * un black patent. Passé par l'échelle bière, un crystal à 120 EBC et une orge
 * torréfiée à 1300 tomberaient tous deux dans « Noire » — deux ingrédients qui
 * ne jouent pourtant pas du tout le même rôle dans la facture.
 *
 * Les quatre classes sont celles des catalogues de malteurs, et répondent à la
 * question que le brasseur se pose en lisant sa liste : est-ce que ça porte la
 * densité, la couleur, ou le grillé ?
 */
export type MaltGrade = 'base' | 'ambre' | 'brun' | 'torrefie';

const MALT_GRADES: Array<{
  grade: MaltGrade;
  maxEbc: number;
  label: string;
  hint: string;
  tone: string;
}> = [
  {
    grade: 'base',
    maxEbc: 20,
    label: 'Base',
    hint: 'Porte la densité. C’est le gros de la facture.',
    tone: 'text-ebc-straw border-ebc-straw/40 bg-ebc-straw/10'
  },
  {
    grade: 'ambre',
    maxEbc: 120,
    label: 'Ambré',
    hint: 'Caramel et couleur, sans amertume de grillé.',
    tone: 'text-ebc-amber border-ebc-amber/40 bg-ebc-amber/10'
  },
  {
    grade: 'brun',
    maxEbc: 500,
    label: 'Brun',
    hint: 'Fruits secs et couleur soutenue. Quelques pour cent suffisent.',
    tone: 'text-ebc-brown border-ebc-brown/50 bg-ebc-brown/15'
  },
  {
    grade: 'torrefie',
    maxEbc: Infinity,
    label: 'Torréfié',
    hint: 'Café et cacao, très astringent. Se dose en dizaines de grammes.',
    tone: 'text-cave-300 border-cave-600 bg-cave-800'
  }
];

/** La classe d'un malt, ou `null` si sa couleur n'est pas renseignée. */
export function maltGrade(
  ebc: number | null | undefined
): { grade: MaltGrade; label: string; hint: string; tone: string } | null {
  if (ebc == null || !Number.isFinite(ebc) || ebc < 0) return null;
  return MALT_GRADES.find((g) => ebc <= g.maxEbc) ?? MALT_GRADES[MALT_GRADES.length - 1];
}
