import { WaterIons, WaterSource, SaltId, AcidId } from '../../types';
import { round1, ZERO, alkalinityAsCaCO3, CA_DIVISOR, MG_DIVISOR } from './ions';

/** Composition des produits utilisés pour le traitement de l’eau. */

// --- Sels ---------------------------------------------------------------------

export interface SaltDef {
  id: SaltId;
  name: string;
  formula: string;
  /** Ions apportés, en ppm, par 1 gramme dissous dans 1 litre. */
  ions: Partial<WaterIons>;
  /**
   * Part de la dose qui se dissout réellement. 1 par défaut.
   *
   * ⚠️ La craie ne se dissout pas dans une eau non carbonatée : la pratique
   * retient la MOITIÉ de l'effet. Cette fraction est appliquée par `saltIons`,
   * donc partout — solveur, doses affichées, ions atteints. Elle était écrite
   * dans l'avertissement du sel, mais nulle part dans le calcul.
   */
  solubility?: number;
  /**
   * Pureté réelle du produit pesé, 1 par défaut. Appliquée par `saltIons`.
   *
   * ⚠️ La table suppose un état d'hydratation précis (CaCl₂·2H₂O, MgCl₂·6H₂O).
   * Du CaCl₂ anhydre apporte 32 % de plus ; un dihydrate laissé ouvert, qui a
   * bu l'humidité, 10 à 20 % de moins ; une chaux carbonatée à l'air, moins
   * encore. Aucune balance ne voit cet écart — seul ce facteur le porte.
   */
  purity?: number;
  /** Ce que le sel apporte au goût, en une ligne. */
  effect: string;
  /**
   * Avertissement affiché à côté de la dose.
   *
   * Deux natures, et elles ne s'affichent pas pareil — voir `cautionThreshold`.
   * Sans seuil, c'est un fait de MANIPULATION : l'hydratation du chlorure de
   * calcium, l'insolubilité de la craie, la violence de la chaux. Vrai chaque
   * fois qu'on pèse ce sel, donc affiché chaque fois qu'on le pèse.
   */
  caution?: string;
  /**
   * Le seuil que l'avertissement annonce, quand c'en est un.
   *
   * ⚠️ Demandé ainsi : « tous les warnings de seuil, uniquement utiles quand
   * c'est vraiment le cas ». « Au-delà de 150 ppm de sodium, le goût devient
   * franchement salé » s'affichait dès le premier dixième de gramme de sel de
   * table — à 12 ppm de sodium. Une phrase juste, au mauvais moment : elle
   * décrit un danger qu'on n'approche pas, et la seule chose qu'elle apprend
   * au brasseur, c'est à ne plus lire les avertissements.
   *
   * Avec un seuil, l'avertissement ne paraît qu'à partir de
   * `CAUTION_APPROACH` × `ppm` — assez tôt pour qu'on puisse encore reculer,
   * assez tard pour vouloir dire quelque chose — et il porte alors la valeur
   * ATTEINTE, pas seulement la règle générale.
   *
   * `ion: 'untracked'` désigne l'ion que `WaterIons` ne porte pas : le
   * potassium du KCl, qui se calcule depuis la dose.
   */
  cautionThreshold?: { ion: keyof WaterIons | 'untracked'; ppm: number; label: string };
  /**
   * Ion apporté que le modèle ne sait PAS suivre, en ppm par g/L.
   * Le potassium du KCl n'a pas de champ dans `WaterIons` : plutôt que de le
   * passer sous silence, le solveur annonce ce qu'il verse.
   *
   * `maxPpm` est le seuil à ne pas franchir. ⚠️ Il existe parce qu'un seuil et
   * un interdit ne sont pas la même chose : le KCl était exclu D'OFFICE au
   * motif que le potassium se goûte au-delà de 50 ppm, alors qu'un plafond
   * suffit — c'est déjà ainsi que tous les autres sels sont bridés par les
   * ions qu'ils entraînent (`capFlavour`).
   */
  untracked?: { label: string; ppmPerGramPerLitre: number; maxPpm?: number };
}

export const SALTS: Record<SaltId, SaltDef> = {
  gypse: {
    id: 'gypse',
    name: 'Gypse',
    formula: 'CaSO₄·2H₂O',
    ions: { ca: 232.8, so4: 557.7 },
    effect: 'Accentue l’amertume, la rend sèche et tranchante.'
  },
  cacl2: {
    id: 'cacl2',
    name: 'Chlorure de calcium',
    formula: 'CaCl₂·2H₂O',
    ions: { ca: 272.6, cl: 482.3 },
    effect: 'Arrondit, épaissit la sensation de bouche, souligne le malt.',
    caution:
      'Dosé pour du dihydrate (CaCl₂·2H₂O). L’anhydre en apporte 32 % de plus ; un sachet ouvert qui a pris l’humidité, 10 à 20 % de moins.'
  },
  epsom: {
    id: 'epsom',
    name: 'Sel d’Epsom',
    formula: 'MgSO₄·7H₂O',
    ions: { mg: 98.6, so4: 389.6 },
    effect: 'Sulfate plus âpre que le gypse ; apporte le magnésium dont la levure a besoin.',
    caution: 'au-delà de 30, l’eau devient amère et laxative.',
    cautionThreshold: { ion: 'mg', ppm: 30, label: 'Magnésium' }
  },
  mgcl2: {
    id: 'mgcl2',
    name: 'Chlorure de magnésium',
    formula: 'MgCl₂·6H₂O',
    ions: { mg: 119.5, cl: 348.7 },
    effect: 'Rondeur, sans apporter de calcium.'
  },
  nacl: {
    id: 'nacl',
    name: 'Sel de table',
    formula: 'NaCl',
    ions: { na: 393.4, cl: 606.6 },
    effect: 'Rehausse la perception du malt. Indispensable à une Gose.',
    caution: 'au-delà de 150, le goût devient franchement salé.',
    cautionThreshold: { ion: 'na', ppm: 150, label: 'Sodium' }
  },
  nahco3: {
    id: 'nahco3',
    name: 'Bicarbonate de soude',
    formula: 'NaHCO₃',
    ions: { na: 273.7, hco3: 726.3 },
    effect: 'Remonte l’alcalinité — pour les bières très torréfiées dont le pH chute trop.',
    caution: 'et c’est lui qui l’apporte — il verse autant de sodium que d’alcalinité.',
    cautionThreshold: { ion: 'na', ppm: 150, label: 'Sodium' }
  },
  caco3: {
    id: 'caco3',
    name: 'Craie',
    formula: 'CaCO₃',
    // 1219 = 2 équivalents d'alcalinité par mole, exprimés en HCO₃⁻.
    ions: { ca: 400.4, hco3: 1219 },
    solubility: 0.5,
    effect: 'Remonte l’alcalinité en apportant du calcium.',
    /*
     * ⚠️ Avertissement durci après vérification des sources (05.09.2026). La
     * demi-solubilité que retient le calcul est une CONVENTION de brasseur, pas
     * une mesure : la craie met des heures à des jours à se dissoudre, quand un
     * empâtage dure une heure. Bru'n Water, à l'inverse, compte 100 % — mais en
     * exigeant qu'elle soit dissoute D'AVANCE. Les deux disent la même chose :
     * versée telle quelle dans la cuve, la craie n'apporte presque rien.
     */
    caution:
      'À peine soluble. Sans dissolution préalable à l’eau gazeuse, elle n’apporte presque rien en une heure d’empâtage — le calcul n’en compte déjà que la moitié. Préfère la chaux ou le bicarbonate.'
  },
  chaux: {
    id: 'chaux',
    name: 'Chaux éteinte',
    formula: 'Ca(OH)₂',
    /*
     * ⚠️ La chaux n'apporte pas de HCO₃⁻ : elle apporte 2 OH⁻ par mole, qui
     * consomment l'acidité de la maische exactement comme le ferait
     * l'alcalinité. On l'exprime donc dans la même unité que les autres —
     * 26.99 meq/L par g/L, soit 1647 ppm en équivalent HCO₃⁻ — pour qu'elle
     * entre dans le même calcul d'alcalinité résiduelle.
     *
     * Elle existe pour une raison précise : c'est la SEULE source d'alcalinité
     * sans sodium qui soit réellement soluble. Sur une impériale depuis
     * l'osmosée, le bicarbonate seul fait dépasser le sodium bien avant
     * d'atteindre la fenêtre d'alcalinité.
     */
    ions: { ca: 540.9, hco3: 1647 },
    effect: 'Remonte l’alcalinité sans sodium. La seule option des bières très foncées.',
    caution:
      'Base forte : dans la maische avec le grain, au dixième de gramme — jamais dans l’eau seule (elle y précipite le calcaire), jamais au rinçage. Elle se carbonate à l’air : si une goutte d’acide la fait mousser, c’est déjà de la craie.'
  },
  kcl: {
    id: 'kcl',
    name: 'Chlorure de potassium',
    formula: 'KCl',
    ions: { cl: 475.6 },
    untracked: { label: 'potassium', ppmPerGramPerLitre: 524.4, maxPpm: 50 },
    effect: 'Chlorure sans sodium ni calcium.',
    caution: 'au-delà de 50, le goût tourne au métallique. Le solveur s’arrête avant.',
    cautionThreshold: { ion: 'untracked', ppm: 50, label: 'Potassium' }
  }
};

export const SALT_IDS = Object.keys(SALTS) as SaltId[];

/**
 * Les sels qui remontent l'alcalinité.
 *
 * ⚠️ Ils vont ENTIÈREMENT dans l'eau d'empâtage. L'alcalinité n'a de sens que
 * face aux phosphates du malt ; au rinçage, il n'y a pas de grain, et le
 * bicarbonate qu'on y verse est aussitôt neutralisé par l'acide de rinçage —
 * on achetait et pesait deux produits pour qu'ils s'annulent.
 */
export const ALKALINE_SALTS: SaltId[] = ['nahco3', 'caco3', 'chaux'];

export const isAlkaline = (id: SaltId) => ALKALINE_SALTS.includes(id);

/** Ions réellement apportés par 1 g dans 1 L, solubilité comprise. */
export function saltIons(id: SaltId): Partial<WaterIons> {
  const def = SALTS[id];
  const f = (def.solubility ?? 1) * (def.purity ?? 1);
  if (f === 1) return def.ions;
  const out: Partial<WaterIons> = {};
  (Object.keys(def.ions) as Array<keyof WaterIons>).forEach((ion) => {
    out[ion] = round1((def.ions[ion] ?? 0) * f);
  });
  return out;
}

// --- Acides -------------------------------------------------------------------

/**
 * Seuil d'ALERTE de l'acide lactique dans la bière finie, en g/L.
 *
 * ⚠️ 0.3 et non 0.4. La perception se situe entre les deux selon les buveurs et
 * le style ; on alerte au bas de la fourchette, pour laisser au brasseur le
 * temps de changer d'acide. L'écran disait « il se goûte vers 0.4 » alors que
 * l'alerte partait à 0.3 : le chiffre annoncé n'était pas celui qui
 * déclenchait, et on ne pouvait pas savoir lequel croire.
 */
export const LACTATE_TASTE_THRESHOLD = 0.3;

export interface AcidDef {
  id: AcidId;
  name: string;
  unit: 'mL' | 'g';
  /** Milligrammes d'alcalinité (exprimée en HCO₃⁻) neutralisés par unité. */
  hco3NeutralizedPerUnit: number;
  /**
   * Ce qu'il faut savoir de cet acide pour le CHOISIR ou le manipuler.
   *
   * Vrai quelle que soit la dose, donc affiché quelle que soit la dose. Ce qui
   * ne dépend que de la dose vit dans `taste`.
   */
  note: string;
  /**
   * Le seuil de perception, quand l'acide en a un.
   *
   * ⚠️ « Son goût commence à se percevoir vers 0.3 g par litre » s'affichait
   * sous la rangée d'acide en permanence, y compris à 0.04 g/L — huit fois sous
   * le seuil. Demandé : « uniquement utile quand c'est vraiment le cas ».
   *
   * Il ne paraît donc que dans la MARCHE D'APPROCHE, entre
   * `CAUTION_APPROACH` × `gPerL` et le seuil lui-même. Au-delà, ce n'est plus
   * une note : c'est l'alerte du solveur qui parle, et une seule voix suffit
   * par question.
   */
  taste?: { gPerL: number; text: string };
}

export const ACIDS: Record<AcidId, AcidDef> = {
  lactique: {
    id: 'lactique',
    name: 'Acide lactique 80 %',
    unit: 'mL',
    /*
     * ρ 1.19 × 0.80 ÷ 90.08 = 10.57 mmol/mL. À pH 5.4 (pKa 3.86) 97.2 % du
     * proton est cédé : 10.27 mmol × 61.02 = 627 mg de HCO₃⁻ neutralisés.
     * On retient 600 : à 80 %, 5 à 8 % de l'acide est engagé en dimères
     * lactoyl-lactate, qui ne titrent pas comme un monomère libre.
     */
    hco3NeutralizedPerUnit: 600,
    note: 'Le plus courant, et le moins cher.',
    taste: {
      gPerL: LACTATE_TASTE_THRESHOLD,
      text: 'son goût commence à se percevoir vers 0.3 g par litre de bière — empâtage et rinçage CUMULÉS.'
    }
  },
  phosphorique: {
    id: 'phosphorique',
    name: 'Acide phosphorique 75 %',
    unit: 'mL',
    /*
     * ⚠️ Corrigé de 830 à 750. ρ 1.579 × 0.75 ÷ 97.99 = 12.09 mmol/mL. À pH
     * d'empâtage, SEUL le premier proton est cédé (pKa₁ 2.15) ; le deuxième
     * (pKa₂ 7.20) ne l'est qu'à 1.6 % à pH 5.4, soit 1.015 équivalent.
     * 12.09 × 1.015 × 61.02 = 749. La valeur 830 supposait 1.13 équivalent,
     * qu'aucune concentration commerciale ne donne. Elle faussait de 20 % le
     * rapport entre les deux acides : changer d'acidifiant en cours de route
     * sous-dosait.
     */
    hco3NeutralizedPerUnit: 750,
    note: 'Sans goût propre, même à forte dose. Préféré sur les bières pâles et les fortes doses.'
  },
  maltAcidule: {
    id: 'maltAcidule',
    name: 'Malt acidulé',
    unit: 'g',
    // ~3 % d'acide lactique en masse : 1 g de malt ≈ 0.03 g d'acide pur.
    hco3NeutralizedPerUnit: 20,
    note: 'S’ajoute au grain. Compte-le dans la facture : il apporte aussi de l’extrait.'
  }
};

/** Ions apportés par un jeu de doses (grammes) dans un volume donné. */
export function ionsFromSalts(
  doses: Partial<Record<SaltId, number>>,
  volumeL: number
): WaterIons {
  if (!volumeL || !Number.isFinite(volumeL) || volumeL <= 0 || !doses) return { ...ZERO };
  const out = { ...ZERO };
  SALT_IDS.forEach((id) => {
    const grams = doses[id] ?? 0;
    if (!grams || !Number.isFinite(grams) || grams <= 0) return;
    const perLitre = grams / volumeL;
    const ions = saltIons(id);
    (Object.keys(ions) as Array<keyof WaterIons>).forEach((ion) => {
      const val = ions[ion] ?? 0;
      if (Number.isFinite(val)) {
        out[ion] += val * perLitre;
      }
    });
  });
  return {
    ca: round1(out.ca),
    mg: round1(out.mg),
    na: round1(out.na),
    so4: round1(out.so4),
    cl: round1(out.cl),
    hco3: round1(out.hco3)
  };
}

/** Alcalinité résiduelle apportée par 1 g de sel dans 1 L, effets croisés compris. */
export function netRaPerGramPerLitre(id: SaltId): number {
  const i = saltIons(id);
  return (
    alkalinityAsCaCO3(i.hco3 ?? 0) - (i.ca ?? 0) / CA_DIVISOR - (i.mg ?? 0) / MG_DIVISOR
  );
}

/** Eau par défaut : réseau fribourgeois, calcaire. Valeurs à confirmer par analyse. */
export const DEFAULT_WATER_SOURCE: WaterSource = {
  id: 'reseau',
  name: 'Réseau — Villars-sur-Glâne',
  ca: 85,
  mg: 14,
  na: 8,
  so4: 28,
  cl: 22,
  hco3: 250,
  ph: 7.4,
  note: 'Valeurs de départ, à remplacer par l’analyse du distributeur.'
};

