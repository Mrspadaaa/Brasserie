import { CA_DIVISOR, MG_DIVISOR } from './ions';




export interface RaBand {
  label: string;
  min: number;
  max: number;
  hint: string;
  /**
   * Ce qui COMMANDE cette fenêtre.
   *
   * ⚠️ Posé après une question de fond de Gaëtan : « on utilise beaucoup la
   * couleur EBC pour le calcul, mais est-ce vraiment correct ? Si ma hazy IPA
   * est plus sombre ou plus claire je m'en fiche. »
   *
   * Il a raison sur le principe, et l'app lui donnait déjà raison sans le dire.
   * La couleur n'est qu'un SUBSTITUT de l'acidité de la facture : c'est le
   * torréfié qui acidifie la maische, la teinte n'en est que le témoin. Quand
   * la facture est connue, c'est elle qui parle, et la couleur se tait. La
   * fenêtre portait déjà cette correction — mais l'écran affichait « bière
   * noire » dans tous les cas, ce qui donnait l'impression que la teinte
   * décidait de tout.
   *
   * Rien de tout cela ne touche au PROFIL DE GOÛT : calcium, magnésium,
   * sodium, sulfate et chlorure viennent du style choisi, et l'équilibre
   * SO₄ ⇄ Cl du houblonnage et du curseur. La couleur n'entre que dans
   * l'alcalinité.
   */
  from?: 'couleur' | 'facture';
}

/**
 * Le CENTRE de la fenêtre d'alcalinité, en ppm d'AR, selon la couleur.
 *
 * Quatre repères, un par classe de bière, posés au centre de la classe. Ce sont
 * exactement les centres des quatre paliers d'avant : une bière au milieu de sa
 * classe reçoit donc la même eau qu'avant, au ppm près.
 */
export const RA_CENTRE_BY_EBC: Array<[ebc: number, centre: number]> = [
  [6, -30], // pâle    — Pils, Helles, Blonde
  [21, 30], // ambrée  — Pale ale, IPA
  [45, 90], // brune   — Brown ale, Dunkel, Bock
  [80, 150] // noire   — Stout, Porter, Impériale
];

/** Demi-largeur de la fenêtre : elle valait 30 ppm dans les quatre paliers. */
export const RA_BAND_HALF = 30;

/**
 * Fenêtre d'alcalinité résiduelle visée, selon la COULEUR de la bière.
 *
 * Les malts torréfiés sont acides : plus la bière est foncée, plus elle
 * supporte — et réclame — une eau alcaline. C'est pour ça que Dublin brasse des
 * stouts et Pilsen des lagers pâles.
 *
 * ⚠️ UNE COURBE, PLUS QUATRE MARCHES.
 *
 * Question de Gaëtan : « on utilise beaucoup la couleur EBC pour le calcul,
 * mais est-ce vraiment correct ? Si ma hazy IPA est plus sombre ou plus claire
 * je m'en fiche. » Mesuré sur une Hazy IPA depuis l'osmosée, de part et d'autre
 * du seuil qui la traverse :
 *
 *   EBC 12  →  AR −60..0    aucun sel alcalin
 *   EBC 13  →  AR   0..60   3.9 g de bicarbonate, 36 ppm de sodium
 *
 * Un point d'EBC — c'est-à-dire rien, une estimation de couleur à ±20 % près —
 * et l'eau changeait de profil. Même marche à 30/31 et à 60/61 EBC. Or la
 * couleur n'est qu'un SUBSTITUT de l'acidité de la facture : rien dans la
 * chimie ne saute à 12 EBC, c'est le découpage en classes qui sautait.
 *
 * La fenêtre glisse donc continûment entre les quatre repères, largeur
 * constante. Au centre de chaque classe, le résultat est identique à l'ancien ;
 * ce sont les bières de bord de classe — les plus nombreuses — qui cessent de
 * basculer.
 *
 * Les ÉTIQUETTES gardent leurs seuils : « bière ambrée » reste une phrase
 * juste, et elle ne commande rien.
 */
export function targetRaForColor(ebc: number | null): RaBand {
  if (ebc === null) {
    return {
      /*
       * ⚠️ L'étiquette entre dans des phrases : « pour une ${label} ». Avec
       * « couleur inconnue », le solveur écrivait « pour une couleur inconnue »,
       * qui ne se dit pas. Toutes les étiquettes doivent donc désigner une
       * BIÈRE, pas une propriété.
       */
      label: 'bière de couleur inconnue',
      min: -30,
      max: 60,
      hint: 'Renseigne la couleur des malts pour resserrer la cible.'
    };
  }

  const e = Math.max(0, ebc);
  let centre = RA_CENTRE_BY_EBC[RA_CENTRE_BY_EBC.length - 1][1];
  if (e <= RA_CENTRE_BY_EBC[0][0]) {
    centre = RA_CENTRE_BY_EBC[0][1];
  } else {
    for (let i = 1; i < RA_CENTRE_BY_EBC.length; i += 1) {
      const [e1, c1] = RA_CENTRE_BY_EBC[i];
      if (e <= e1) {
        const [e0, c0] = RA_CENTRE_BY_EBC[i - 1];
        centre = c0 + ((c1 - c0) * (e - e0)) / (e1 - e0);
        break;
      }
    }
  }
  centre = Math.round(centre);

  const [label, hint] =
    e <= 12
      ? ['bière pâle', 'Pils, Helles, Blonde.']
      : e <= 30
        ? ['bière ambrée', 'Pale ale, IPA, ambrée.']
        : e <= 60
          ? ['bière brune', 'Brown ale, Dunkel, Bock.']
          : ['bière noire', 'Stout, Porter, Impériale.'];

  return { label, min: centre - RA_BAND_HALF, max: centre + RA_BAND_HALF, hint };
}

// --- pH d'empâtage estimé depuis la facture de grain --------------------------

/**
 * ⚠️ REVIREMENT ASSUMÉ (04.09.2026, à la demande de Gaëtan).
 *
 * L'en-tête de ce fichier posait : « on ne prédit PAS le pH d'empâtage depuis
 * le grain ». La raison tenait : la donnée par malt n'est pas publiée de façon
 * fiable, et un chiffre faux est pire que pas de chiffre. Elle tient toujours.
 *
 * Ce qui change, c'est l'usage. On ne remplace pas la mesure à la cuve, et on
 * ne laisse PAS cette estimation commander une goutte d'acide de plus : elle ne
 * peut que RELÂCHER la cible, jamais la durcir. Ce qu'elle apporte, c'est la
 * seule chose que la couleur ne saura jamais dire — deux bières de la même
 * teinte n'ont pas la même acidité. Le malt acidulé en est le cas d'école : 5
 * EBC, invisible à la couleur, et 1 % de la facture déplace le pH de 0.1.
 *
 * Marge annoncée : ±0.15 pH. C'est beaucoup, et c'est dit à l'écran.
 */

/**
 * pH d'une maische de ce seul malt en eau distillée, selon sa couleur.
 *
 * Interpolation entre six repères de la littérature brassicole (Troester,
 * Bies). Les valeurs foncées sont celles de malts torréfiés du commerce ; un
 * malt caramel très clair tombera un peu haut, ce que la marge couvre.
 */
export const DI_PH_BY_EBC: Array<[ebc: number, ph: number]> = [
  [8, 5.75], // pilsner, pale, blé
  [20, 5.65], // vienne, munich clair
  [60, 5.5], // munich foncé, caramel clair
  [150, 5.25], // caramel moyen
  [400, 4.95], // caramel foncé, chocolat clair
  [900, 4.7] // torréfié, black, orge rôtie
];

export function diPhForEbc(ebc: number): number {
  const e = Math.max(0, ebc);
  if (e <= DI_PH_BY_EBC[0][0]) return DI_PH_BY_EBC[0][1];
  for (let i = 1; i < DI_PH_BY_EBC.length; i += 1) {
    const [e1, p1] = DI_PH_BY_EBC[i];
    if (e <= e1) {
      const [e0, p0] = DI_PH_BY_EBC[i - 1];
      return p0 + ((p1 - p0) * (e - e0)) / (e1 - e0);
    }
  }
  return DI_PH_BY_EBC[DI_PH_BY_EBC.length - 1][1];
}

/**
 * Pouvoir tampon relatif d'un malt : les torréfiés résistent bien davantage que
 * les malts de base, et pèsent donc plus lourd dans la moyenne que leur seule
 * masse ne le dirait.
 */
export function bufferForEbc(ebc: number): number {
  return 1 + Math.min(1.2, Math.max(0, ebc) / 500);
}

/** Le malt acidulé ne se reconnaît qu'au nom : sa couleur est celle d'un pale. */
export const ACIDULATED = /acidul|sauermalz|sour\s*malt|acid\s*malt/i;

export interface MashPhEstimate {
  /** Assez de couleurs renseignées pour dire quelque chose ? */
  known: boolean;
  /** pH de cette facture de grain en eau distillée. */
  phDistilled: number;
  /** pH attendu dans la cuve, alcalinité résiduelle comprise. */
  phPredicted: number;
  /** Marge annoncée, en pH. */
  uncertainty: number;
  /** Part de malt acidulé dans la facture, en %. */
  acidulatedPct: number;
  /** Dans la fenêtre 5.2–5.5 ? `-1` en dessous, `1` au-dessus. */
  position: -1 | 0 | 1;
  note: string;
}

/** La fenêtre de pH d'empâtage que vise un brasseur, quelle que soit la bière. */
export const MASH_PH_BAND = { min: 5.2, max: 5.5, target: 5.4 };

/**
 * De combien l'alcalinité résiduelle remonte le pH de la maische.
 *
 * ⚠️ Le rapport eau/grain compte autant que l'AR : la même eau sur une maische
 * mince apporte plus d'alcalinité par kilo de malt, donc décale davantage. Un
 * modèle qui l'ignorait donnait le même pH à 3 et à 4.5 L/kg.
 *
 *   ΔpH = (AR / 50) · (L/kg) / B      AR en ppm CaCO₃ (50 mg = 1 meq), B en meq/(kg·pH)
 *
 * ⚠️ B valait 35 (le « 1750 » = 50 × 35), présomption de Kolbach pour un malt
 * de base. Les mesures modernes (Riffe) donnent 45.5 ; la règle de Troester
 * (« 10 °dH d'AR → 0.2 pH à 4 L/kg ») en implique 71. À 35, l'app exagérait
 * l'effet de l'eau de Fribourg de 0.06 à 0.14 pH. On retient 45.
 */
export const MALT_BUFFER_MEQ_PER_KG_PH = 45;

export const RA_PH_DIVISOR = 50 * MALT_BUFFER_MEQ_PER_KG_PH;

export function phShiftFromRa(ra: number, mashRatioLPerKg: number): number {
  const safeRa = Number.isFinite(ra) ? ra : 0;
  const ratio = Number.isFinite(mashRatioLPerKg) && mashRatioLPerKg > 0 ? Math.min(8, mashRatioLPerKg) : 3.5;
  const shift = (safeRa * ratio) / RA_PH_DIVISOR;
  return Number.isFinite(shift) ? Math.max(-0.6, Math.min(0.6, shift)) : 0;
}

/**
 * Le pH que devrait donner cette facture de grain dans cette eau.
 *
 * Ne comptent que les fermentescibles qui PASSENT PAR LA MAISCHE : le sucre de
 * l'ébullition et le lactose n'ont ni acidité ni pouvoir tampon, et les
 * compter dans la moyenne diluait le résultat sans raison.
 */
export function estimateMashPh(
  fermentables: Array<{
    name?: string;
    weightKg?: number;
    kind?: string;
    use?: string;
    colorEbc?: number;
  }> | undefined,
  ra: number,
  mashRatioLPerKg: number
): MashPhEstimate {
  const vide: MashPhEstimate = {
    known: false,
    phDistilled: 0,
    phPredicted: 0,
    uncertainty: MASH_PH_UNCERTAINTY,
    acidulatedPct: 0,
    position: 0,
    note: 'Renseigne la couleur EBC des malts pour estimer le pH d’empâtage.'
  };

  const grains = (fermentables ?? []).filter(
    (f) =>
      (f.kind ?? 'grain') === 'grain' &&
      (f.use ?? 'empatage') === 'empatage' &&
      Number.isFinite(f.weightKg) &&
      (f.weightKg ?? 0) > 0
  );
  if (grains.length === 0) return vide;

  const totalKg = grains.reduce((s, f) => s + (f.weightKg ?? 0), 0);
  // Sans couleur, aucun malt ne peut être placé sur la courbe.
  const colored = grains.filter(
    (f) => f.colorEbc != null && Number.isFinite(f.colorEbc) && (f.colorEbc ?? 0) >= 0
  );
  if (
    !Number.isFinite(totalKg) ||
    totalKg <= 0 ||
    colored.reduce((s, f) => s + (f.weightKg ?? 0), 0) < totalKg * 0.6
  ) {
    return vide;
  }

  let acidulatedKg = 0;
  let sumWeighted = 0;
  let sumBuffer = 0;

  grains.forEach((f) => {
    const kg = f.weightKg ?? 0;
    const acidule = ACIDULATED.test(f.name ?? '');
    if (acidule) acidulatedKg += kg;
    /*
     * Le malt acidulé porte de l'acide lactique déjà formé : sa maische titre
     * vers 3.7, et il résiste comme un torréfié. C'est ce couple-là qui fait
     * qu'un pour cent de la facture déplace le pH d'un dixième.
     */
    const safeEbc = f.colorEbc != null && Number.isFinite(f.colorEbc) ? Math.max(0, f.colorEbc) : 6;
    const ph = acidule ? 3.7 : diPhForEbc(safeEbc);
    /*
     * ⚠️ Tampon 5.0 et non 3.5 : à 3.5, un pour cent de malt acidulé ne
     * déplaçait le pH que de 0.07, quand Weyermann publie « 1 % → −0.1 » et
     * que la fiche `ACIDS.maltAcidule` (20 mg de HCO₃ par g) donne −0.094 sur
     * le même tampon de base. Trois chiffres pour le même malt, c'était deux
     * de trop.
     */
    const buffer = acidule ? 5.0 : bufferForEbc(safeEbc);
    sumWeighted += kg * buffer * ph;
    sumBuffer += kg * buffer;
  });

  if (!Number.isFinite(sumBuffer) || sumBuffer <= 0 || !Number.isFinite(sumWeighted)) {
    return vide;
  }

  const rawDistilled = sumWeighted / sumBuffer;
  if (!Number.isFinite(rawDistilled)) return vide;
  const phDistilled = Math.round(rawDistilled * 100) / 100;
  const phShift = phShiftFromRa(ra, mashRatioLPerKg);
  const rawPredicted = phDistilled + phShift;
  if (!Number.isFinite(rawPredicted)) return vide;
  const phPredicted = Math.round(rawPredicted * 100) / 100;
  const acidulatedPct = totalKg > 0 ? Math.round((acidulatedKg / totalKg) * 1000) / 10 : 0;

  const position: -1 | 0 | 1 =
    phPredicted < MASH_PH_BAND.min ? -1 : phPredicted > MASH_PH_BAND.max ? 1 : 0;

  /*
   * ⚠️ LES NOTES DÉCRIVENT, ELLES NE PRESCRIVENT PAS.
   *
   * Celle du haut disait « Au-dessus de la fenêtre : c'est là que l'acide
   * sert. » — et la ligne de dose, juste en dessous à l'écran, annonçait
   * « rien à corriger ». Les deux ont raison chacune de leur côté, et
   * ensemble elles se contredisent.
   *
   * L'explication tient à une règle de sûreté posée explicitement : l'acide se
   * dose sur l'ALCALINITÉ RÉSIDUELLE, une grandeur mesurée, jamais sur cette
   * estimation-ci, qui porte ±0.15 d'incertitude. Une maische peut donc sortir
   * de la fenêtre de pH alors que son alcalinité est déjà dans sa cible : il
   * n'y a alors rien à verser, et la consigne est d'aller mesurer au brassin
   * plutôt que d'acidifier à l'aveugle.
   *
   * Les notes disent donc où l'on est, et laissent la ligne de dose dire ce
   * qu'on verse. Une seule voix par question.
   */
  const note =
    position === 1
      ? 'Au-dessus de la fenêtre — l’acide se dose sur l’alcalinité, pas sur cette estimation.'
      : position === -1
        ? 'Sous la fenêtre : cette maische est déjà acide toute seule.'
        : 'Dans la fenêtre.';

  return {
    known: true,
    phDistilled,
    phPredicted,
    uncertainty: MASH_PH_UNCERTAINTY,
    acidulatedPct,
    position,
    note
  };
}

/**
 * La marge annoncée de l'estimation de pH, en points de pH.
 *
 * Elle était écrite en dur à deux endroits ; elle sert maintenant aussi à
 * borner ce que l'estimation a le droit de retrancher aux sels alcalins, et
 * une marge qu'on invoque doit avoir un seul nom.
 */
export const MASH_PH_UNCERTAINTY = 0.15;

/**
 * L'AR qui poserait cette facture au milieu de la fenêtre de pH — l'inverse
 * exact de `phShiftFromRa`. `null` quand la facture ne dit rien.
 *
 * ⚠️ Deux usages, deux sens. Vers le HAUT, elle relâche la fenêtre d'acide
 * (`targetRaForGrist`). Vers le BAS, elle plafonne les SELS alcalins que le
 * solveur verse : une bande « bière noire » commandait 120 ppm d'AR à une
 * stout ordinaire dont la facture, à 5.47 en eau distillée, n'en voulait
 * aucun — 4.3 g de chaux pour un pH prédit à 5.71. Retenir moins de sel n'est
 * pas durcir l'acide : la garantie « jamais une goutte de plus » tient.
 *
 * ⚠️ ELLE PEUT ÊTRE NÉGATIVE, et c'est le piège. Une facture de stout titre
 * 5.56 en eau distillée d'après ce modèle : la fonction rend alors −103, et le
 * solveur, qui prenait `min(bande.min, plafond)`, se donnait pour cible −103
 * d'AR sur une bière dont le style en demande +120. Résultat signalé par
 * Gaëtan : « pour une stout ou une impériale sur eau très osmosée, Doser
 * n'ajoute pas de HCO₃ » — pas un gramme, et pas un mot d'explication, pendant
 * que la toile allumait l'alarme du bicarbonate. C'est le solveur qui borne
 * désormais, voir l'étape 5.
 */
/**
 * Le plafond des SELS ALCALINS que cette facture supporte.
 *
 * ⚠️ CE N'EST PAS `raForGrist`, et les confondre était le défaut. Signalé
 * ainsi : « pour une stout ou une impériale, avec de l'eau très osmosée, Doser
 * n'ajoute pas de HCO₃ ». Le solveur plafonnait les sels alcalins avec
 * `raForGrist`, qui vise le MILIEU de la fenêtre de pH (5.4) — c'est-à-dire
 * l'AR qui poserait la maische pile au centre. Sur une facture de stout à 5.56
 * en eau distillée, ce milieu réclame une AR de −103 : le solveur se donnait
 * donc pour cible −103 sur une bière dont le style demande +120, ne versait pas
 * un gramme de bicarbonate, et n'en disait rien pendant que la toile allumait
 * l'alarme du HCO₃.
 *
 * Or on ne cherche pas ici à poser la maische au centre : on cherche à savoir
 * JUSQU'OÙ l'on peut suivre la couleur sans sortir la maische de sa fenêtre.
 * C'est donc le HAUT (5.5) qu'il faut viser, et le plafond devient l'AR qui
 * mène la maische à la limite haute — pas un pixel plus loin.
 *
 * Sur les trois factures mesurées, la différence entre les deux lectures :
 *
 *   facture                  pH distillée   `raForGrist`   ce plafond-ci
 *   stout irlandaise             5.56           −103            −39
 *   impériale                    5.48            −51            +12
 *   stout du test unitaire       5.47            −47            +16
 *
 * Les trois reçoivent maintenant du bicarbonate, et les trois posent la maische
 * à 5.50 — le haut de la fenêtre, ce qui est exactement le contrat.
 *
 * `floor` et non `round` : une borne haute s'arrondit vers le bas, sans quoi
 * la moitié des cas la franchit d'un demi-ppm.
 */
export function raSaltCeilingForGrist(
  fermentables: Parameters<typeof estimateMashPh>[0],
  mashRatioLPerKg: number
): number | null {
  const est = estimateMashPh(fermentables, 0, mashRatioLPerKg);
  if (!est.known) return null;
  const ratio = mashRatioLPerKg > 0 ? Math.min(8, mashRatioLPerKg) : 3.5;
  return Math.floor(((MASH_PH_BAND.max - est.phDistilled) * RA_PH_DIVISOR) / ratio);
}

export function raForGrist(
  fermentables: Parameters<typeof estimateMashPh>[0],
  mashRatioLPerKg: number
): number | null {
  const est = estimateMashPh(fermentables, 0, mashRatioLPerKg);
  if (!est.known) return null;
  const ratio = mashRatioLPerKg > 0 ? Math.min(8, mashRatioLPerKg) : 3.5;
  return Math.round(((MASH_PH_BAND.target - est.phDistilled) * RA_PH_DIVISOR) / ratio);
}

/**
 * La fenêtre d'AR, retraduite en BICARBONATE pour une eau donnée.
 *
 * ⚠️ Signalé ainsi : « le HCO₃ n'est pas toujours dans la cible ». Vérifié dans
 * l'app sur une Gose, et le même écran disait deux choses contraires sur la
 * même grandeur :
 *
 *   panneau d'alcalinité   « Après l'acide : −15 ppm — dans la cible. »   ✓
 *   toile et tableau       « HCO₃⁻ éq. 45, cible 0–40 »          ✗ en ambre
 *
 * Les deux jugeaient l'alcalinité de la même eau après le même acide. Le
 * panneau la juge sur l'ALCALINITÉ RÉSIDUELLE — qui retranche le calcium et le
 * magnésium, parce que ce sont eux qui acidifient la maische. La toile la
 * jugeait sur le bicarbonate BRUT du profil de style, un chiffre statique qui
 * ignore le calcium. Sur une eau calcaire, les deux ne peuvent pas tomber
 * d'accord : mesuré sur 145 combinaisons style × eau, 37 % finissaient hors de
 * la fourchette du style alors que l'AR, elle, était sur sa cible.
 *
 * Or c'est l'AR que l'acide vise, et c'est elle qui décide du pH. La fourchette
 * de bicarbonate du profil n'est qu'un raccourci d'auteur de guide de style, et
 * le solveur ne s'en sert jamais. C'est donc elle qui cède.
 *
 * On inverse la définition de Kolbach :
 *
 *   AR   = alcalinité − Ca/1.4 − Mg/1.7          (en ppm de CaCO₃)
 *   d'où   alcalinité = AR + Ca/1.4 + Mg/1.7
 *   et     HCO₃       = alcalinité × 61/50
 *
 * La fenêtre obtenue dépend donc de l'eau qu'on regarde — c'est le but. Sur la
 * Gose ci-dessus (Ca 68, Mg 5), la fenêtre d'AR −46..14 devient 7 à 80 ppm de
 * HCO₃, et les 45 ppm affichés y tombent : l'axe dit enfin la même chose que le
 * panneau.
 *
 * ⚠️ On la calcule sur l'eau REPRÉSENTÉE, pas sur la maische. La cible d'AR est
 * une grandeur de maische, mais la toile montre le moût ; dériver la fenêtre du
 * calcium du moût est ce qui rend l'axe cohérent avec ce qu'il trace. La
 * question qu'il pose devient : « cette eau-là, une fois son propre calcium
 * retranché, tombe-t-elle dans la fenêtre visée ? »
 */
export function hco3BandForRa(
  band: { min: number; max: number },
  ions: { ca: number; mg: number }
): { min: number; max: number } {
  const ca = Number.isFinite(ions?.ca) ? Math.max(0, ions.ca) : 0;
  const mg = Number.isFinite(ions?.mg) ? Math.max(0, ions.mg) : 0;
  const compense = ca / CA_DIVISOR + mg / MG_DIVISOR;
  const enHco3 = (ra: number) => Math.max(0, Math.round(((ra + compense) * 61) / 50));
  return { min: enHco3(band.min), max: enHco3(band.max) };
}

/**
 * L'AR que vise l'ACIDE : le milieu de la fenêtre.
 *
 * ⚠️ C'était le haut. Pour une bière pâle, le haut vaut 0 — et une facture
 * pilsner titre 5.75 en eau distillée : à AR 0, elle y reste. Palmer place le
 * haut de fenêtre d'une bière à 3–4 SRM entre −15 et −27. Viser le milieu
 * (−30) coûte 1.2 mL de lactique sur 20 L d'eau de Fribourg, et rend la
 * fenêtre à ce qu'elle prétend être : une fourchette, pas un plafond.
 */
export function raAcidTarget(band: RaBand): number {
  return Math.round((band.min + band.max) / 2);
}

/** Le rapport eau/grain pour lequel les fenêtres de `targetRaForColor` sont écrites. */
export const RA_BAND_REFERENCE_RATIO = 3.5;

/**
 * La même fenêtre, pour une maische plus MINCE.
 *
 * ⚠️ Kolbach est clair : à AR égale, une maische à 6 L/kg reçoit 1.7 fois plus
 * d'alcalinité par kilo de malt qu'à 3.5, et son pH monte d'autant. Les
 * fenêtres par couleur sont écrites pour 3.5 L/kg ; une bière sans alcool
 * empâtée à 6 L/kg avec « 120 à 180 » de bière noire prenait +0.3 pH au lieu
 * de +0.18. On divise donc la fenêtre par (ratio / 3.5) au-delà de 3.5 — jamais
 * en dessous : une maische épaisse ne réclame pas plus d'alcalinité, elle en
 * tolère juste davantage, et ce n'est pas une raison d'en verser.
 */
export function scaleBandForMashRatio(band: RaBand, mashRatioLPerKg: number): RaBand {
  if (!Number.isFinite(mashRatioLPerKg) || mashRatioLPerKg <= RA_BAND_REFERENCE_RATIO) return band;
  const f = RA_BAND_REFERENCE_RATIO / Math.min(8, mashRatioLPerKg);
  return { ...band, min: Math.round(band.min * f), max: Math.round(band.max * f) };
}

/**
 * La fenêtre d'alcalinité résiduelle, corrigée par ce que dit la facture.
 *
 * ⚠️ Elle ne peut que MONTER, jamais descendre — monter la cible d'AR, c'est
 * demander MOINS d'acide. C'est la garantie demandée : « je ne veux pas
 * sur-acidifier ». Une facture plus acide que sa couleur ne le laisse croire
 * (malt acidulé, beaucoup de caramel dans une bière claire) relâche la cible ;
 * une facture douce ne la durcit pas, on laisse la couleur trancher et le
 * pH-mètre arbitrer à la cuve.
 */
export function targetRaForGrist(
  ebc: number | null,
  fermentables: Parameters<typeof estimateMashPh>[0],
  mashRatioLPerKg: number
): RaBand {
  const band = scaleBandForMashRatio(targetRaForColor(ebc), mashRatioLPerKg);
  const raForTarget = raForGrist(fermentables, mashRatioLPerKg);
  if (raForTarget === null) return band;

  if (raForTarget <= band.max) return band;

  // Plafonnée à +60 ppm : au-delà, c'est l'estimation qu'il faut remettre en
  // cause, pas l'eau. Et la marge de ±0.15 pH vaut déjà ±60 ppm d'AR.
  const lift = Math.min(60, raForTarget - band.max);
  return {
    ...band,
    min: band.min + lift,
    max: band.max + lift,
    from: 'facture',
    hint: `Relevée de ${lift} ppm par ta facture : elle est plus acide que sa couleur ne le laisse croire — moins d’acide à verser.`
  };
}

