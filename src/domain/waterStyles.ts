import { WaterIons, IonBand } from '../types';

/** Profils indicatifs de l’eau de traitement, avant extraction du malt et ébullition. */

export type IonRange = IonBand;

export interface StyleWater {
  /** Code BJCP — « 21C », « 20C ». */
  code: string;
  name: string;
  ions: Record<keyof WaterIons, IonRange>;
  /** An omitted ion in a personal target has no displayed target sector. */
  untargetedIons?: Array<keyof WaterIons>;
  /** Fourchette du rapport sulfate / chlorure. */
  ratio: IonRange;
  /** Ce que l'eau doit faire à cette bière-là. */
  note: string;
}

/** Sources et limites chiffrées : docs/water-style-audit.md.
 * BJCP définit le style sensoriel, pas ses concentrations minérales.
 * Nos plages sont des points de départ brassicoles, les NOLO des variantes maison.
 */
export const WATER_PROFILE_SOURCES = [
  { name: 'BJCP 2021 · styles', url: 'https://www.bjcp.org/bjcp-style-guidelines/' },
  { name: 'Bru’n Water · ions et pH', url: 'https://www.brunwater.com/water-knowledge' },
  {
    name: 'Brewer’s Friend · profils',
    url: 'https://www.brewersfriend.com/brewing-water-target-profiles/'
  }
];

/** All six selected ion ranges remain fixed when doses or the ratio change. */
export function styleIonRange(style: StyleWater, ion: keyof WaterIons): IonRange {
  return style.ions[ion];
}

const R = (min: number, max: number): IonRange => ({ min, max });

/** Plages maison : sources et limites dans docs/water-style-audit.md. */
export const STYLE_WATERS: StyleWater[] = [
  {
    code: '01A',
    name: 'American Light Lager',
    ions: {
      ca: R(30, 70),
      mg: R(0, 12),
      na: R(0, 25),
      so4: R(20, 60),
      cl: R(20, 60),
      hco3: R(0, 40)
    },
    ratio: R(0.8, 1.3),
    note: 'Eau très douce. Toute minéralité se goûte sur une bière aussi légère.'
  },
  {
    code: '05B',
    name: 'Kölsch',
    ions: {
      ca: R(40, 80),
      mg: R(0, 15),
      na: R(0, 25),
      so4: R(30, 80),
      cl: R(40, 80),
      hco3: R(0, 50)
    },
    ratio: R(0.8, 1.5),
    note: 'Douce et équilibrée : la finesse de la levure passe avant tout.'
  },
  {
    code: '05D',
    name: 'German Pils',
    ions: {
      ca: R(40, 90),
      mg: R(0, 15),
      na: R(0, 20),
      so4: R(40, 100),
      cl: R(20, 50),
      hco3: R(0, 40)
    },
    ratio: R(1.5, 2.5),
    note: 'Sulfate marqué pour la finale sèche, alcalinité proche de zéro.'
  },
  {
    code: '04A',
    name: 'Munich Helles',
    ions: {
      ca: R(40, 80),
      mg: R(0, 15),
      na: R(0, 25),
      so4: R(15, 45),
      cl: R(30, 70),
      hco3: R(0, 60)
    },
    ratio: R(0.4, 0.9),
    note: 'Chlorure dominant : rondeur maltée, amertume discrète.'
  },
  {
    code: '06C',
    name: 'Dunkles Bock',
    ions: {
      ca: R(50, 100),
      mg: R(0, 25),
      na: R(0, 40),
      so4: R(20, 60),
      cl: R(50, 110),
      hco3: R(60, 160)
    },
    ratio: R(0.3, 0.8),
    note: 'Profil rond pour les malts Munich. L’alcalinité dépend de la maische, pas de la teinte seule.'
  },
  {
    code: '08B',
    name: 'Schwarzbier',
    ions: {
      ca: R(50, 100),
      mg: R(0, 20),
      na: R(0, 40),
      so4: R(20, 60),
      cl: R(50, 110),
      hco3: R(60, 150)
    },
    ratio: R(0.3, 0.8),
    note: 'Noire mais lager : torréfié doux, sulfate bas, alcalinité modérée.'
  },
  {
    code: '10A',
    name: 'Weissbier',
    ions: {
      ca: R(40, 80),
      mg: R(0, 20),
      na: R(0, 40),
      so4: R(20, 60),
      cl: R(40, 90),
      hco3: R(0, 60)
    },
    ratio: R(0.4, 0.9),
    note: 'Minéralisation modérée pour laisser s’exprimer le blé et la levure.'
  },
  {
    code: '11C',
    name: 'Strong Bitter · ESB',
    ions: {
      ca: R(100, 180),
      mg: R(0, 20),
      na: R(10, 50),
      so4: R(150, 300),
      cl: R(40, 80),
      hco3: R(30, 120)
    },
    ratio: R(2.0, 4.0),
    note: 'Variante sèche et sulfatée ; une ESB plus ronde peut demander moins de sulfate.'
  },
  {
    code: '13C',
    name: 'English Porter',
    ions: {
      ca: R(60, 120),
      mg: R(0, 25),
      na: R(0, 60),
      so4: R(30, 80),
      cl: R(70, 140),
      hco3: R(80, 180)
    },
    ratio: R(0.4, 0.9),
    note: 'Variante ronde, sulfate modéré. Ajuster l’alcalinité aux malts réellement empâtés.'
  },
  {
    code: '15B',
    name: 'Irish Stout',
    ions: {
      ca: R(50, 110),
      mg: R(0, 25),
      na: R(10, 60),
      so4: R(30, 70),
      cl: R(70, 130),
      hco3: R(100, 200)
    },
    ratio: R(0.4, 0.8),
    note: 'Torréfié net et finale sèche. Ce profil privilégie une minéralisation peu sulfatée.'
  },
  {
    code: '16A',
    name: 'Sweet Stout · Milk Stout',
    ions: {
      ca: R(60, 120),
      mg: R(0, 25),
      na: R(10, 70),
      so4: R(30, 70),
      cl: R(90, 160),
      hco3: R(100, 200)
    },
    ratio: R(0.3, 0.7),
    note: 'Chlorure dominant pour accompagner la rondeur ; le lactose et l’atténuation font la douceur.'
  },
  {
    code: '20C',
    name: 'Imperial Stout',
    ions: {
      ca: R(60, 130),
      mg: R(0, 30),
      na: R(10, 80),
      so4: R(30, 80),
      cl: R(80, 160),
      hco3: R(120, 250)
    },
    ratio: R(0.4, 0.9),
    note: 'Variante ronde d’impériale. Le besoin de bicarbonate dépend des malts et du pH, pas du nom du style.'
  },
  {
    code: '18B',
    name: 'American Pale Ale',
    ions: {
      ca: R(60, 140),
      mg: R(0, 20),
      na: R(0, 50),
      so4: R(100, 200),
      cl: R(40, 90),
      hco3: R(0, 80)
    },
    ratio: R(1.5, 3.0),
    note: 'Sulfate net pour une amertume franche.'
  },
  {
    code: '21A',
    name: 'American IPA · West Coast',
    ions: {
      ca: R(80, 160),
      mg: R(0, 20),
      na: R(0, 50),
      so4: R(175, 300),
      cl: R(40, 80),
      hco3: R(0, 60)
    },
    ratio: R(3.0, 6.0),
    note: 'Variante West Coast sèche : sulfate dominant, chlorure modéré.'
  },
  {
    code: '21B',
    name: 'Black IPA',
    ions: {
      ca: R(80, 150),
      mg: R(0, 20),
      na: R(0, 40),
      so4: R(100, 200),
      cl: R(60, 110),
      hco3: R(40, 120)
    },
    ratio: R(1.5, 2.5),
    note: 'Finale d’IPA sèche, torréfié discret. Une couleur noire n’impose pas une eau de stout.'
  },
  {
    code: '21C',
    name: 'Hazy IPA · NEIPA',
    ions: {
      ca: R(70, 150),
      mg: R(0, 20),
      na: R(0, 50),
      so4: R(40, 100),
      cl: R(130, 220),
      hco3: R(0, 60)
    },
    ratio: R(0.3, 0.7),
    note: 'Chlorure dominant : bouche pleine, amertume douce, houblon juteux.'
  },
  {
    code: '23A',
    name: 'Berliner Weisse',
    ions: {
      ca: R(40, 90),
      mg: R(0, 15),
      na: R(0, 40),
      so4: R(20, 60),
      cl: R(40, 90),
      hco3: R(0, 30)
    },
    ratio: R(0.4, 0.9),
    note: 'Alcalinité quasi nulle : l’acidité lactique doit s’exprimer.'
  },
  {
    code: '23G',
    name: 'Gose',
    ions: {
      ca: R(40, 90),
      mg: R(0, 15),
      na: R(60, 150),
      so4: R(20, 60),
      cl: R(90, 200),
      hco3: R(0, 40)
    },
    ratio: R(0.2, 0.5),
    note: 'Peu amère, acidulée, sel discret. Tenir aussi compte du sel ajouté comme ingrédient de recette.'
  },
  {
    code: '24A',
    name: 'Witbier',
    ions: {
      ca: R(40, 90),
      mg: R(0, 20),
      na: R(0, 40),
      so4: R(30, 80),
      cl: R(50, 100),
      hco3: R(0, 60)
    },
    ratio: R(0.4, 0.9),
    note: 'Douce, pour laisser passer coriandre et zeste.'
  },
  {
    code: '24C',
    name: 'Bière de Garde',
    ions: {
      ca: R(50, 110),
      mg: R(0, 20),
      na: R(0, 50),
      so4: R(50, 120),
      cl: R(50, 110),
      hco3: R(20, 100)
    },
    ratio: R(0.7, 1.5),
    note: 'Équilibrée, légèrement maltée.'
  },
  {
    code: '25B',
    name: 'Saison',
    ions: {
      ca: R(50, 100),
      mg: R(0, 20),
      na: R(0, 40),
      so4: R(70, 150),
      cl: R(40, 90),
      hco3: R(0, 60)
    },
    ratio: R(1.2, 2.5),
    note: 'Sulfate pour soutenir la finale sèche ; le poivré vient surtout de la levure.'
  },
  {
    code: '26C',
    name: 'Belgian Tripel',
    ions: {
      ca: R(50, 100),
      mg: R(0, 15),
      na: R(0, 40),
      so4: R(50, 120),
      cl: R(40, 80),
      hco3: R(0, 60)
    },
    ratio: R(1.0, 2.0),
    note: 'Minéralisation modérée, finale sèche ; fruité et épices de la levure au premier plan.'
  },
  {
    code: '26D',
    name: 'Belgian Dark Strong',
    ions: {
      ca: R(60, 120),
      mg: R(0, 25),
      na: R(0, 60),
      so4: R(40, 100),
      cl: R(60, 120),
      hco3: R(50, 150)
    },
    ratio: R(0.6, 1.2),
    note: 'Équilibre souple pour le fruité et les malts. Le sucre foncé ne justifie pas, seul, du bicarbonate.'
  },
  {
    code: 'NA-BLONDE',
    name: 'Sans alcool — blonde · pale ale',
    ions: {
      ca: R(50, 100),
      mg: R(0, 15),
      na: R(10, 40),
      so4: R(20, 60),
      cl: R(80, 150),
      hco3: R(0, 50)
    },
    ratio: R(0.3, 0.6),
    note: 'Variante maison : chlorure dominant pour soutenir la bouche. À adapter au procédé sans alcool.'
  },
  {
    code: 'NA-IPA',
    name: 'Sans alcool — IPA',
    ions: {
      ca: R(60, 120),
      mg: R(0, 15),
      na: R(10, 40),
      so4: R(50, 120),
      cl: R(100, 180),
      hco3: R(0, 50)
    },
    ratio: R(0.4, 0.9),
    note: 'Variante maison : bouche ronde et houblon aromatique. Le ratio ne remplace pas l’équilibre de la recette.'
  },
  {
    code: 'NA-WEISS',
    name: 'Sans alcool — Weissbier',
    ions: {
      ca: R(40, 80),
      mg: R(0, 15),
      na: R(10, 40),
      so4: R(20, 50),
      cl: R(80, 140),
      hco3: R(0, 50)
    },
    ratio: R(0.3, 0.6),
    note: 'Variante maison de blanche sans alcool : minéralisation modérée, chlorure dominant.'
  },
  {
    code: 'NA-STOUT',
    name: 'Sans alcool — stout · porter',
    ions: {
      ca: R(60, 120),
      mg: R(0, 20),
      na: R(20, 60),
      so4: R(20, 60),
      cl: R(100, 170),
      hco3: R(60, 150)
    },
    ratio: R(0.2, 0.5),
    note: 'Variante maison ronde ; vérifier le pH avec les malts et le volume réel d’empâtage.'
  },
  {
    code: 'NA-LAGER',
    name: 'Sans alcool — lager',
    ions: {
      ca: R(40, 80),
      mg: R(0, 15),
      na: R(10, 30),
      so4: R(20, 60),
      cl: R(60, 120),
      hco3: R(0, 40)
    },
    ratio: R(0.4, 0.8),
    note: 'Variante maison : eau douce, chlorure pour soutenir la bouche, à adapter au procédé.'
  },
  {
    code: '—',
    name: 'Équilibré (sans style)',
    ions: {
      ca: R(50, 120),
      mg: R(0, 20),
      na: R(0, 50),
      so4: R(50, 120),
      cl: R(50, 120),
      hco3: R(0, 100)
    },
    ratio: R(0.7, 1.4),
    note: 'Point de départ neutre quand le style ne commande rien de particulier.'
  }
];

/** Centre géométrique des plages ; la politique de dosage vit dans water/profileTarget. */
export function midpoint(style: StyleWater): WaterIons {
  const mid = (r: IonRange) => Math.round((r.min + r.max) / 2);
  return {
    ca: mid(style.ions.ca),
    mg: mid(style.ions.mg),
    na: mid(style.ions.na),
    so4: mid(style.ions.so4),
    cl: mid(style.ions.cl),
    hco3: mid(style.ions.hco3)
  };
}

/** Où tombe une valeur dans sa fourchette : `-1` en dessous, `1` au-dessus. */
export function positionInRange(value: number, range: IonRange): number {
  if (value < range.min) return -1;
  if (value > range.max) return 1;
  return 0;
}

/** Part de la fourchette parcourue, bornée à [0, 1] — pour la barre de niveau. */
export function fillInRange(value: number, range: IonRange): number {
  if (range.max <= range.min) return 0.5;
  return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
}

/** Retrouve un style par son code, avec repli sur le profil neutre. */
export function styleByCode(code: string | undefined): StyleWater {
  // Anciennes recettes : 27 était le code de notre Gose (BJCP 2015).
  const current = code === '27' ? '23G' : code;
  return STYLE_WATERS.find((s) => s.code === current) ?? STYLE_WATERS[STYLE_WATERS.length - 1];
}

/** Le code que porte une cible saisie à la main plutôt que choisie dans la liste. */
export const CUSTOM_STYLE_CODE = '~';

/**
 * Une cible CHIFFRÉE devient une fourchette.
 *
 * ⚠️ Une recette qui donne son eau l'écrit en points, pas en fourchettes :
 * « Ca 110, SO₄ 200, Cl 55 ». Or tout l'atelier raisonne en zones — les
 * secteurs verts de la toile, les plafonds du solveur, le « dedans ou dehors ».
 * Il faut donc ouvrir une fenêtre autour du point, et le faire honnêtement.
 *
 * ±20 %, avec un plancher de ±10 ppm. Le pourcentage seul écraserait les
 * petites valeurs — ±20 % sur 5 ppm de magnésium donne une fenêtre de 2 ppm
 * qu'aucune balance ne sait viser, et le solveur passerait son temps à
 * annoncer un dépassement d'un demi-gramme. Le plancher règle ça.
 *
 * ⚠️ Le minimum ne descend jamais sous zéro : une eau ne contient pas −4 ppm
 * de sodium, et un minimum négatif rendrait le plancher de calcium inopérant.
 */
export function styleFromTargetIons(ions: Partial<WaterIons>, name = 'Cible de la recette'): StyleWater {
  const band = (v: number): IonRange => {
    const marge = Math.max(10, Math.abs(v) * 0.2);
    return { min: Math.max(0, Math.round(v - marge)), max: Math.round(v + marge) };
  };

  /*
   * Le rapport SO₄:Cl vient du point lui-même, avec la même marge. Sans
   * chlorure, la fourchette n'a pas de sens : on retombe sur l'équilibre, et
   * le curseur reste libre.
   */
  const r = ions.cl > 0 && ions.so4 != null ? ions.so4 / ions.cl : 1;
  const ratio: IonRange = {
    min: r == null ? 0 : Math.max(0, Math.round(r * 0.8 * 10) / 10),
    max: r == null ? 9 : Math.round(r * 1.2 * 10) / 10
  };

  return {
    code: CUSTOM_STYLE_CODE,
    name,
    untargetedIons: (['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const).filter(k => ions[k] == null),
    // Missing ions have no requested minimum; they must not become zero targets.
    ions: Object.fromEntries((['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as const).map(k => [k,
      ions[k] == null ? { min: 0, max: Math.max(...STYLE_WATERS.map(style => style.ions[k].max)) } : band(ions[k])
    ])) as Record<keyof WaterIons, IonRange>,
    ratio,
    note: `Cible saisie : ${Object.entries(ions).filter(([, v]) => v != null).map(([k, v]) => `${k} ${v}`).join(' · ')} ppm, à ±20 %. Les ions non renseignés restent sans cible minimale.`
  };
}

/** Devine le style d'eau depuis le nom du style de bière saisi dans la recette. */
export function styleWaterForName(name: string): StyleWater {
  const s = (name || '').toLowerCase();
  const by = (code: string) => STYLE_WATERS.find((x) => x.code === code)!;

  /*
   * ⚠️ Les SANS-ALCOOL d'abord : « stout sans alcool » contient « stout », et
   * tomberait sinon sur l'impériale. « NA » se lit en majuscules seulement —
   * « na » minuscule est dans « saisoNAle ».
   */
  if (
    /sans[ -]alcool|nolo|alcohol[ -]free|non[ -]alcoholic|low[ -]alcohol|alkoholfrei|alcoholvrij|analcoli|\b0[.,][05]\s?%|d[ée]salcoolis/.test(
      s
    ) ||
    /\bNA\b/.test(name || '')
  ) {
    if (/weizen|weiss|hefe|blanche|\bwit\b/.test(s)) return by('NA-WEISS');
    if (/stout|porter|noire|dark|schwarz/.test(s)) return by('NA-STOUT');
    if (/ipa|hazy|neipa|hop/.test(s)) return by('NA-IPA');
    if (/lager|pils|helles/.test(s)) return by('NA-LAGER');
    return by('NA-BLONDE');
  }

  /* Les noms COMPOSÉS avant les mots qu'ils contiennent : « black ipa » avant « ipa ». */
  if (/black ipa|cascadian/.test(s)) return by('21B');
  // Ne pas transformer un style absent du catalogue en un autre style BJCP.
  if (
    /irish red|barleywine|golden strong|dubbel|czech|bohemian|boh[èe]me|doppelbock|eisbock|dunkelweizen|weizenbock/.test(
      s
    )
  )
    return by('—');
  if (/irish stout|dry stout|guinness/.test(s)) return by('15B');
  if (/k[öo]lsch/.test(s)) return by('05B');
  if (/schwarz/.test(s)) return by('08B');
  if (/bitter|\besb\b/.test(s)) return by('11C');
  if (/neipa|hazy|juicy|new england/.test(s)) return by('21C');
  if (/west coast|american ipa|\bipa\b/.test(s)) return by('21A');
  if (/pale ale|\bapa\b/.test(s)) return by('18B');
  if (/(imperial|russian).*stout|stout.*imperial/.test(s)) return by('20C');
  if (/milk|sweet stout|pastry|lactose/.test(s)) return by('16A');
  if (/porter/.test(s)) return by('13C');
  if (/stout/.test(s)) return by('—');
  if (/pils/.test(s)) return by('05D');
  if (/american light lager|light lager/.test(s)) return by('01A');
  if (/helles/.test(s)) return by('04A');
  if (/dunkles bock|dunkel.*bock/.test(s)) return by('06C');
  if (/berliner/.test(s)) return by('23A');
  if (/weizen|weiss|hefe/.test(s)) return by('10A');
  if (/wit|blanche/.test(s)) return by('24A');
  if (/gose/.test(s)) return by('23G');
  if (/berliner|sour|acidul/.test(s)) return by('23A');
  if (/saison|farmhouse/.test(s)) return by('25B');
  if (/tripel/.test(s)) return by('26C');
  if (/quadrupel|dark strong/.test(s)) return by('26D');
  if (/garde/.test(s)) return by('24C');
  return by('—');
}

/** Current recipes use the versioned registry. The old name matcher remains only
 * for legacy consumers; it must not silently choose a profile for a new style. */
export function styleWaterForReference(name: string, ref?: BrewingStyleRef, styles?: ListedStyle[]): StyleWater {
  return styleByCode(resolveBrewingStyle(name,ref,styles)?.suggestions?.water ?? '—');
}
import { resolveBrewingStyle, type ListedStyle } from './brewingStyles';
import type { BrewingStyleRef } from '../../functions/src/brewingStyleSchema';
