import { TempStep, FermentationStep, FermentPhaseKind } from '../types';

/**
 * Programmes d'empâtage et de fermentation, par ce qu'ils FONT.
 *
 * ⚠️ Ce que ça règle : l'assistant n'écrivait qu'un palier d'empâtage — 67 °C,
 * 60 min — et une seule phase de fermentation, quelle que soit la bière. Or
 * une lager n'est pas une ale qui dure plus longtemps :
 *
 *   • elle demande un **repos diacétyle** avant le froid, sans quoi le beurre
 *     reste dans la bière ;
 *   • puis des **semaines de garde** à 0-2 °C ;
 *   • et souvent des **paliers** d'empâtage, pas une infusion unique.
 *
 * Une belge forte, elle, demande une montée libre en température et un **ajout**
 * de sucre en cours de fermentation — l'ajouter à l'empâtage stresse la levure
 * et donne une bière qui ne sèche pas.
 */

// --- Empâtage -----------------------------------------------------------------

export interface MashProgram {
  id: string;
  name: string;
  /** Ce que le programme cherche à obtenir. */
  purpose: string;
  steps: TempStep[];
  spargeType: 'fly' | 'batch' | 'none';
}

export const MASH_PROGRAMS: MashProgram[] = [
  {
    id: 'infusion',
    name: 'Infusion simple',
    purpose: 'Le cas courant. Équilibre corps et fermentescibilité.',
    steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }],
    spargeType: 'batch'
  },
  {
    id: 'sec',
    name: 'Sec et atténué',
    purpose: 'Favorise la β-amylase : moût très fermentescible, bière sèche. Belges, saisons.',
    steps: [{ name: 'Saccharification', tempC: 63, durationMin: 75 }],
    spargeType: 'batch'
  },
  {
    id: 'corps',
    name: 'Corps rond',
    purpose: 'Laisse des dextrines : bière pleine en bouche. Stouts, milk stouts, NEIPA.',
    steps: [{ name: 'Saccharification', tempC: 68.5, durationMin: 60 }],
    spargeType: 'batch'
  },
  {
    id: 'lager',
    name: 'Paliers lager',
    purpose: 'Repos protéique puis double saccharification. Limpidité et tenue de mousse.',
    steps: [
      { name: 'Repos protéique', tempC: 52, durationMin: 20 },
      { name: 'β-amylase', tempC: 63, durationMin: 40 },
      { name: 'α-amylase', tempC: 72, durationMin: 20 },
      { name: 'Mashout', tempC: 76, durationMin: 10 }
    ],
    spargeType: 'fly'
  },
  {
    id: 'froment',
    name: 'Froment',
    purpose: 'Palier férulique pour les phénols de la weizen et de la witbier.',
    steps: [
      { name: 'Repos férulique', tempC: 45, durationMin: 15 },
      { name: 'β-amylase', tempC: 63, durationMin: 40 },
      { name: 'α-amylase', tempC: 72, durationMin: 20 },
      { name: 'Mashout', tempC: 76, durationMin: 10 }
    ],
    spargeType: 'batch'
  },
  {
    id: 'imperiale',
    name: 'Impériale',
    purpose: 'Empâtage épais et long, puis rinçage réduit — on cherche la densité, pas le rendement.',
    steps: [
      { name: 'Saccharification', tempC: 66, durationMin: 90 },
      { name: 'Mashout', tempC: 76, durationMin: 10 }
    ],
    spargeType: 'batch'
  }
];

/** Le palier où se fait la saccharification — celui qui pilote l'atténuation. */
export function saccharificationTemp(steps: TempStep[]): number | null {
  const inRange = steps.filter((s) => s.tempC >= 60 && s.tempC <= 72);
  if (inRange.length === 0) return null;
  // Le plus long des paliers de saccharification fait le gros du travail.
  return inRange.reduce((a, b) => (b.durationMin > a.durationMin ? b : a)).tempC;
}

// --- Fermentation -------------------------------------------------------------

export const PHASE_LABEL: Record<FermentPhaseKind, { label: string; hint: string; tone: string }> = {
  primaire: {
    label: 'Primaire',
    hint: 'La fermentation active. Tenir la température basse au départ.',
    tone: 'text-hop border-hop/40 bg-hop/10'
  },
  reposDiacetyle: {
    label: 'Repos diacétyle',
    hint: 'Remonter en température vers la fin : la levure reprend le diacétyle qu’elle a produit.',
    tone: 'text-ebc-straw border-ebc-straw/40 bg-ebc-straw/10'
  },
  garde: {
    label: 'Garde',
    hint: 'Au froid, plusieurs semaines. Clarifie et affine.',
    tone: 'text-water border-water/40 bg-water/10'
  },
  refermentation: {
    label: 'Refermentation',
    hint: 'En bouteille ou en fût, avec le sucre de reprise.',
    tone: 'text-ebc-amber border-ebc-amber/40 bg-ebc-amber/10'
  },
  ajout: {
    label: 'Ajout',
    hint: 'Houblon à cru, sucre, fruits — à une date précise de la fermentation.',
    tone: 'text-ebc-copper border-ebc-copper/40 bg-ebc-copper/10'
  }
};

export interface FermentProgram {
  id: string;
  name: string;
  purpose: string;
  steps: FermentationStep[];
}

export const FERMENT_PROGRAMS: FermentProgram[] = [
  {
    id: 'ale',
    name: 'Ale',
    purpose: 'Le cas courant. Fermentation haute, deux semaines.',
    steps: [
      { kind: 'primaire', name: 'Fermentation primaire', tempC: 19, days: 10 },
      { kind: 'garde', name: 'Maturation', tempC: 4, days: 5 }
    ]
  },
  {
    id: 'neipa',
    name: 'NEIPA',
    purpose: 'Houblonnage à cru pendant la fermentation active, pour la biotransformation.',
    steps: [
      { kind: 'primaire', name: 'Fermentation primaire', tempC: 19, days: 4 },
      { kind: 'ajout', name: 'Premier houblonnage à cru', tempC: 19, days: 3, note: 'Fermentation encore active — biotransformation.' },
      { kind: 'ajout', name: 'Second houblonnage à cru', tempC: 19, days: 3, note: 'En fin de fermentation.' },
      { kind: 'garde', name: 'Froid court', tempC: 4, days: 2, note: 'Court : l’oxygène et le temps tuent les arômes.' }
    ]
  },
  {
    id: 'lager',
    name: 'Lager',
    purpose: 'Fermentation basse, repos diacétyle, puis longue garde à froid.',
    steps: [
      { kind: 'primaire', name: 'Fermentation basse', tempC: 11, days: 14 },
      { kind: 'reposDiacetyle', name: 'Repos diacétyle', tempC: 18, days: 2, note: 'Vers 70 % d’atténuation, pas avant.' },
      { kind: 'garde', name: 'Garde', tempC: 1, days: 35, note: 'Descendre d’environ 2 °C par jour.' }
    ]
  },
  {
    id: 'belge',
    name: 'Belge forte',
    purpose: 'Montée libre en température et sucre ajouté en cours de route.',
    steps: [
      { kind: 'primaire', name: 'Départ frais', tempC: 18, days: 3 },
      { kind: 'ajout', name: 'Sucre candi', tempC: 22, days: 1, note: 'À l’ajout, la fermentation est déjà lancée : la levure ne se stresse pas.' },
      { kind: 'primaire', name: 'Montée libre', tempC: 26, days: 10, note: 'Laisser monter seul — c’est ce qui fait les esters belges.' },
      { kind: 'garde', name: 'Maturation', tempC: 4, days: 21 }
    ]
  },
  {
    id: 'imperiale',
    name: 'Impériale',
    purpose: 'Fermentation longue et garde de plusieurs mois.',
    steps: [
      { kind: 'primaire', name: 'Fermentation primaire', tempC: 20, days: 21 },
      { kind: 'garde', name: 'Garde longue', tempC: 8, days: 60, note: 'Elle s’améliore pendant des mois.' }
    ]
  },
  {
    id: 'saison',
    name: 'Saison',
    purpose: 'Montée franche en température pour finir très sec.',
    steps: [
      { kind: 'primaire', name: 'Départ', tempC: 22, days: 3 },
      { kind: 'primaire', name: 'Montée', tempC: 30, days: 14, note: 'La saison aime la chaleur — jusqu’à 32 °C sans défaut.' },
      { kind: 'garde', name: 'Maturation', tempC: 4, days: 7 }
    ]
  },
  {
    id: 'acidulee',
    name: 'Acidulée',
    purpose: 'pH visé bas, fermentation courte et fraîche.',
    steps: [
      { kind: 'primaire', name: 'Fermentation primaire', tempC: 20, days: 7 },
      { kind: 'garde', name: 'Maturation', tempC: 3, days: 7 }
    ]
  }
];

/** Programme de fermentation par défaut, déduit du style saisi. */
export function fermentProgramForStyle(style: string): FermentProgram {
  const s = (style || '').toLowerCase();
  const pick = (id: string) => FERMENT_PROGRAMS.find((p) => p.id === id)!;

  if (/neipa|hazy|juicy/.test(s)) return pick('neipa');
  if (/lager|pils|helles|bock|m[äa]rzen|dunkel|schwarz/.test(s)) return pick('lager');
  if (/tripel|quadrupel|dubbel|belg|strong dark|abbaye/.test(s)) return pick('belge');
  if (/imperial|russian|barleywine|barley wine/.test(s)) return pick('imperiale');
  if (/saison|farmhouse|bi[èe]re de garde/.test(s)) return pick('saison');
  if (/sour|gose|berliner|lambic|acidul|kettle/.test(s)) return pick('acidulee');
  return pick('ale');
}

/** Programme d'empâtage par défaut, déduit du style saisi. */
export function mashProgramForStyle(style: string): MashProgram {
  const s = (style || '').toLowerCase();
  const pick = (id: string) => MASH_PROGRAMS.find((p) => p.id === id)!;

  if (/lager|pils|helles|bock|m[äa]rzen|dunkel/.test(s)) return pick('lager');
  if (/weizen|weiss|weiß|witbier|blanche|froment|hefe/.test(s)) return pick('froment');
  if (/imperial|russian|barleywine|quadrupel/.test(s)) return pick('imperiale');
  if (/tripel|saison|dubbel|belg/.test(s)) return pick('sec');
  if (/neipa|stout|porter|milk|pastry/.test(s)) return pick('corps');
  return pick('infusion');
}
