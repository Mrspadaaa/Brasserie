import { WaterIons } from '../types';

/**
 * Fourchettes d'eau par style de bière.
 *
 * ⚠️ Différence de fond avec ce qui existait : une cible d'eau n'est PAS un
 * point, c'est une **fourchette**. Dire « vise 150 ppm de calcium » est faux ;
 * la vérité est « entre 80 et 180, et en dessous la levure floconne mal ».
 * C'est ce que montrent les secteurs verts d'un profil de brassage : la zone
 * dans laquelle l'eau doit tomber, pas la ligne qu'elle doit épouser.
 *
 * Les codes suivent la nomenclature BJCP, celle qu'on retrouve sur toutes les
 * recettes publiées.
 */

export interface IonRange {
  min: number;
  max: number;
}

export interface StyleWater {
  /** Code BJCP — « 21C », « 20C ». */
  code: string;
  name: string;
  ions: Record<keyof WaterIons, IonRange>;
  /** Fourchette du rapport sulfate / chlorure. */
  ratio: IonRange;
  /** Ce que l'eau doit faire à cette bière-là. */
  note: string;
}

const R = (min: number, max: number): IonRange => ({ min, max });

/**
 * Les styles que brasse la brasserie, plus les grands classiques.
 * Valeurs en ppm.
 *
 * ⚠️ Fourchettes REVUES à l'usage le 05.09.2026, après qu'une impériale s'est
 * vue proposer 6.8 g de sel de table et 160 ppm de calcium. Les règles qui
 * les gouvernent, toutes de pratique brassicole (Palmer & Kaminski, Brungard) :
 *
 *   - **Calcium** : 50 suffit à la levure et aux oxalates ; 100–150 seulement
 *     sur les bières houblonnées sèches. Une bière noire n'en veut pas plus de
 *     120 — le calcium arrive de toute façon avec le gypse et le CaCl₂.
 *   - **Magnésium** : minimum 0 partout. Le malt en apporte ; l'eau n'en
 *     ajoute que si le brasseur le demande.
 *   - **Sodium** : un PLAFOND de goût, pas une cible. Minimum 0, sauf là où
 *     le sel fait la recette (Gose) et une pincée sur les noires rondes.
 *   - **Sulfate** : haut sur les bières sèches et houblonnées, BAS sur les
 *     noires et les blanches — 30 à 80 ppm, pas 120. C'est l'erreur la plus
 *     fréquente des calculateurs : du gypse dans une stout.
 *   - **Chlorure** : le corps. Haut sur tout ce qui doit être rond — noires,
 *     NEIPA, blanches, et toutes les sans-alcool.
 *
 * **Sans-alcool (NOLO, codes `NA-…`).** Un moût à 1.020–1.035 avec 5 à 8 L
 * d'eau par kilo de malt : le corps que l'alcool ne fait plus, le chlorure et
 * un peu de sodium doivent le faire ; le sulfate durcirait une amertume que
 * rien n'enrobe ; et l'alcalinité pèse double par kilo de malt — d'où des
 * bicarbonates tenus bas, même sur la stout. Ces profils sont les déclinaisons
 * des styles pleins, poussées vers le rond et l'eau douce.
 */
export const STYLE_WATERS: StyleWater[] = [
  {
    code: '01A',
    name: 'American Light Lager',
    ions: { ca: R(30, 70), mg: R(0, 12), na: R(0, 25), so4: R(20, 60), cl: R(20, 60), hco3: R(0, 40) },
    ratio: R(0.8, 1.3),
    note: 'Eau très douce. Toute minéralité se goûte sur une bière aussi légère.'
  },
  {
    code: '05B',
    name: 'Kölsch',
    ions: { ca: R(40, 80), mg: R(0, 15), na: R(0, 25), so4: R(30, 80), cl: R(40, 80), hco3: R(0, 50) },
    ratio: R(0.8, 1.5),
    note: 'Douce et équilibrée : la finesse de la levure passe avant tout.'
  },
  {
    code: '05D',
    name: 'German Pils',
    ions: { ca: R(40, 90), mg: R(0, 15), na: R(0, 20), so4: R(40, 100), cl: R(20, 50), hco3: R(0, 40) },
    ratio: R(1.5, 2.5),
    note: 'Sulfate marqué pour la finale sèche, alcalinité proche de zéro.'
  },
  {
    code: '04A',
    name: 'Munich Helles',
    ions: { ca: R(40, 80), mg: R(0, 15), na: R(0, 25), so4: R(15, 45), cl: R(30, 70), hco3: R(0, 60) },
    ratio: R(0.4, 0.9),
    note: 'Chlorure dominant : rondeur maltée, amertume discrète.'
  },
  {
    code: '06C',
    name: 'Dunkles Bock',
    ions: { ca: R(50, 100), mg: R(0, 25), na: R(0, 40), so4: R(20, 60), cl: R(50, 110), hco3: R(60, 160) },
    ratio: R(0.3, 0.8),
    note: 'Alcalinité soutenue : les malts Munich et torréfiés acidifient la maische.'
  },
  {
    code: '08B',
    name: 'Schwarzbier',
    ions: { ca: R(50, 100), mg: R(0, 20), na: R(0, 40), so4: R(20, 60), cl: R(50, 110), hco3: R(60, 150) },
    ratio: R(0.3, 0.8),
    note: 'Noire mais lager : torréfié doux, sulfate bas, alcalinité modérée.'
  },
  {
    code: '10A',
    name: 'Weissbier',
    ions: { ca: R(40, 80), mg: R(0, 20), na: R(0, 40), so4: R(20, 60), cl: R(40, 90), hco3: R(0, 60) },
    ratio: R(0.4, 0.9),
    note: 'Douce, sans excès de calcium qui masquerait les phénols. Le sulfate durcit le blé.'
  },
  {
    code: '11C',
    name: 'Strong Bitter · ESB',
    ions: { ca: R(100, 180), mg: R(0, 20), na: R(10, 50), so4: R(150, 300), cl: R(40, 80), hco3: R(30, 120) },
    ratio: R(2.0, 4.0),
    note: 'L’eau de Burton, sulfatée et calcique : amertume minérale, finale sèche.'
  },
  {
    code: '13C',
    name: 'English Porter',
    ions: { ca: R(60, 120), mg: R(0, 25), na: R(0, 60), so4: R(30, 80), cl: R(70, 140), hco3: R(80, 180) },
    ratio: R(0.4, 0.9),
    note: 'Alcalinité pour tenir le torréfié sans astringence ; sulfate bas.'
  },
  {
    code: '15B',
    name: 'Irish Stout',
    ions: { ca: R(50, 110), mg: R(0, 25), na: R(10, 60), so4: R(30, 70), cl: R(70, 130), hco3: R(100, 200) },
    ratio: R(0.4, 0.8),
    note: 'L’eau de Dublin : alcaline, peu sulfatée. Le torréfié fait l’amertume.'
  },
  {
    code: '16A',
    name: 'Sweet Stout · Milk Stout',
    ions: { ca: R(60, 120), mg: R(0, 25), na: R(10, 70), so4: R(30, 70), cl: R(90, 160), hco3: R(100, 200) },
    ratio: R(0.3, 0.7),
    note: 'Chlorure et alcalinité hauts : rondeur, douceur, torréfié adouci.'
  },
  {
    code: '20C',
    name: 'Imperial Stout',
    ions: { ca: R(60, 130), mg: R(0, 30), na: R(10, 80), so4: R(30, 80), cl: R(80, 160), hco3: R(120, 250) },
    ratio: R(0.4, 0.9),
    note: 'La plus alcaline : sans elle, la maische d’une impériale tombe sous pH 5. Pas de gypse pour autant.'
  },
  {
    code: '18B',
    name: 'American Pale Ale',
    ions: { ca: R(60, 140), mg: R(0, 20), na: R(0, 50), so4: R(100, 200), cl: R(40, 90), hco3: R(0, 80) },
    ratio: R(1.5, 3.0),
    note: 'Sulfate net pour une amertume franche.'
  },
  {
    code: '21A',
    name: 'American IPA · West Coast',
    ions: { ca: R(80, 160), mg: R(0, 20), na: R(0, 50), so4: R(175, 300), cl: R(40, 80), hco3: R(0, 60) },
    ratio: R(3.0, 6.0),
    note: 'Très sulfatée. C’est l’eau de Burton, sans son alcalinité.'
  },
  {
    code: '21B',
    name: 'Black IPA',
    ions: { ca: R(80, 150), mg: R(0, 20), na: R(0, 40), so4: R(100, 200), cl: R(60, 110), hco3: R(40, 120) },
    ratio: R(1.5, 2.5),
    note: 'Une IPA qui a la couleur d’une stout : sulfate d’IPA, juste assez d’alcalinité pour le torréfié.'
  },
  {
    code: '21C',
    name: 'Hazy IPA · NEIPA',
    ions: { ca: R(70, 150), mg: R(0, 20), na: R(0, 50), so4: R(40, 100), cl: R(130, 220), hco3: R(0, 60) },
    ratio: R(0.3, 0.7),
    note: 'Chlorure dominant : bouche pleine, amertume douce, houblon juteux.'
  },
  {
    code: '23A',
    name: 'Berliner Weisse',
    ions: { ca: R(40, 90), mg: R(0, 15), na: R(0, 40), so4: R(20, 60), cl: R(40, 90), hco3: R(0, 30) },
    ratio: R(0.4, 0.9),
    note: 'Alcalinité quasi nulle : l’acidité lactique doit s’exprimer.'
  },
  {
    code: '27',
    name: 'Gose',
    ions: { ca: R(40, 90), mg: R(0, 15), na: R(60, 150), so4: R(20, 60), cl: R(90, 200), hco3: R(0, 40) },
    ratio: R(0.2, 0.5),
    note: 'Le sel fait partie de la recette : sodium et chlorure volontairement hauts, par le sel de table.'
  },
  {
    code: '24A',
    name: 'Witbier',
    ions: { ca: R(40, 90), mg: R(0, 20), na: R(0, 40), so4: R(30, 80), cl: R(50, 100), hco3: R(0, 60) },
    ratio: R(0.4, 0.9),
    note: 'Douce, pour laisser passer coriandre et zeste.'
  },
  {
    code: '24C',
    name: 'Bière de Garde',
    ions: { ca: R(50, 110), mg: R(0, 20), na: R(0, 50), so4: R(50, 120), cl: R(50, 110), hco3: R(20, 100) },
    ratio: R(0.7, 1.5),
    note: 'Équilibrée, légèrement maltée.'
  },
  {
    code: '25B',
    name: 'Saison',
    ions: { ca: R(50, 100), mg: R(0, 20), na: R(0, 40), so4: R(70, 150), cl: R(40, 90), hco3: R(0, 60) },
    ratio: R(1.2, 2.5),
    note: 'Sulfate pour la finale sèche et poivrée.'
  },
  {
    code: '26C',
    name: 'Belgian Tripel',
    ions: { ca: R(50, 100), mg: R(0, 15), na: R(0, 40), so4: R(50, 120), cl: R(40, 80), hco3: R(0, 60) },
    ratio: R(1.0, 2.0),
    note: 'Faible minéralité : la levure et le sucre candi doivent dominer.'
  },
  {
    code: '26D',
    name: 'Belgian Dark Strong',
    ions: { ca: R(60, 120), mg: R(0, 25), na: R(0, 60), so4: R(40, 100), cl: R(60, 120), hco3: R(50, 150) },
    ratio: R(0.6, 1.2),
    note: 'Un peu d’alcalinité pour les malts spéciaux, sans écraser le fruité.'
  },
  {
    code: 'NA-BLONDE',
    name: 'Sans alcool — blonde · pale ale',
    ions: { ca: R(50, 100), mg: R(0, 15), na: R(10, 40), so4: R(20, 60), cl: R(80, 150), hco3: R(0, 50) },
    ratio: R(0.3, 0.6),
    note: 'Moût mince : le chlorure et une pincée de sodium font le corps, le sulfate est tenu bas.'
  },
  {
    code: 'NA-IPA',
    name: 'Sans alcool — IPA',
    ions: { ca: R(60, 120), mg: R(0, 15), na: R(10, 40), so4: R(50, 120), cl: R(100, 180), hco3: R(0, 50) },
    ratio: R(0.4, 0.9),
    note: 'Chlorure dominant malgré le houblon : sans alcool ni corps, une amertume sulfatée devient râpeuse.'
  },
  {
    code: 'NA-WEISS',
    name: 'Sans alcool — Weissbier',
    ions: { ca: R(40, 80), mg: R(0, 15), na: R(10, 40), so4: R(20, 50), cl: R(80, 140), hco3: R(0, 50) },
    ratio: R(0.3, 0.6),
    note: 'Blanche mince : rondeur par le chlorure, peu de calcium pour laisser les phénols.'
  },
  {
    code: 'NA-STOUT',
    name: 'Sans alcool — stout · porter',
    ions: { ca: R(60, 120), mg: R(0, 20), na: R(20, 60), so4: R(20, 60), cl: R(100, 170), hco3: R(60, 150) },
    ratio: R(0.2, 0.5),
    note: 'Le torréfié sans le corps : chlorure et sodium hauts, alcalinité modérée — à 6 L/kg elle pèse double.'
  },
  {
    code: 'NA-LAGER',
    name: 'Sans alcool — lager',
    ions: { ca: R(40, 80), mg: R(0, 15), na: R(10, 30), so4: R(20, 60), cl: R(60, 120), hco3: R(0, 40) },
    ratio: R(0.4, 0.8),
    note: 'Lager mince et propre : eau douce, chlorure pour la bouche, rien qui dépasse.'
  },
  {
    code: '—',
    name: 'Équilibré (sans style)',
    ions: { ca: R(50, 120), mg: R(0, 20), na: R(0, 50), so4: R(50, 120), cl: R(50, 120), hco3: R(0, 100) },
    ratio: R(0.7, 1.4),
    note: 'Point de départ neutre quand le style ne commande rien de particulier.'
  }
];

/** Le milieu de fourchette — ce que vise le solveur. */
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
  return STYLE_WATERS.find((s) => s.code === code) ?? STYLE_WATERS[STYLE_WATERS.length - 1];
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
export function styleFromTargetIons(
  ions: WaterIons,
  name = 'Cible de la recette'
): StyleWater {
  const band = (v: number): IonRange => {
    const marge = Math.max(10, Math.abs(v) * 0.2);
    return { min: Math.max(0, Math.round(v - marge)), max: Math.round(v + marge) };
  };

  /*
   * Le rapport SO₄:Cl vient du point lui-même, avec la même marge. Sans
   * chlorure, la fourchette n'a pas de sens : on retombe sur l'équilibre, et
   * le curseur reste libre.
   */
  const r = ions.cl > 0 ? ions.so4 / ions.cl : 1;
  const ratio: IonRange = {
    min: Math.max(0, Math.round(r * 0.8 * 10) / 10),
    max: Math.round(r * 1.2 * 10) / 10
  };

  return {
    code: CUSTOM_STYLE_CODE,
    name,
    ions: {
      ca: band(ions.ca),
      mg: band(ions.mg),
      na: band(ions.na),
      so4: band(ions.so4),
      cl: band(ions.cl),
      hco3: band(ions.hco3)
    },
    ratio,
    note: `Cible saisie : Ca ${Math.round(ions.ca)} · Mg ${Math.round(ions.mg)} · Na ${Math.round(
      ions.na
    )} · SO₄ ${Math.round(ions.so4)} · Cl ${Math.round(ions.cl)} · HCO₃ ${Math.round(
      ions.hco3
    )} ppm, à ±20 %.`
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
  if (/irish|dry stout|guinness/.test(s)) return by('15B');
  if (/k[öo]lsch/.test(s)) return by('05B');
  if (/schwarz/.test(s)) return by('08B');
  if (/bitter|\besb\b/.test(s)) return by('11C');
  if (/neipa|hazy|juicy|new england/.test(s)) return by('21C');
  if (/west coast|american ipa|\bipa\b/.test(s)) return by('21A');
  if (/pale ale|\bapa\b/.test(s)) return by('18B');
  if (/imperial|russian|barleywine/.test(s)) return by('20C');
  if (/milk|sweet stout|pastry|lactose/.test(s)) return by('16A');
  if (/porter/.test(s)) return by('13C');
  if (/stout/.test(s)) return by('20C');
  if (/pils/.test(s)) return by('05D');
  if (/helles|light lager/.test(s)) return by('04A');
  if (/bock|dunkel|m[äa]rzen/.test(s)) return by('06C');
  if (/weizen|weiss|hefe/.test(s)) return by('10A');
  if (/wit|blanche/.test(s)) return by('24A');
  if (/gose/.test(s)) return by('27');
  if (/berliner|sour|acidul/.test(s)) return by('23A');
  if (/saison|farmhouse/.test(s)) return by('25B');
  if (/tripel|golden strong/.test(s)) return by('26C');
  if (/quadrupel|dubbel|dark strong|belg/.test(s)) return by('26D');
  if (/garde/.test(s)) return by('24C');
  if (/lager/.test(s)) return by('01A');
  return by('—');
}
