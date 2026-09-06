import { WaterIons, WaterSource, SaltId, AcidId } from '../types';

/**
 * Chimie de l'eau de brassage.
 *
 * ⚠️ Ce que ça remplace : `calculateWaterSalts` devinait ses cibles avec
 * `style.includes('stout')`, ne connaissait que trois sels, ignorait
 * l'alcalinité résiduelle, ne séparait pas l'empâtage du rinçage et
 * n'autorisait à écarter aucun additif. C'était un calcul de démonstration, pas
 * un outil de brasseur.
 *
 * Aucune bibliothèque npm n'existe pour ça — les outils de référence
 * (Bru'n Water, Brewer's Friend, moneaudebrassage) sont des tableurs ou des
 * sites fermés. Le calcul est donc écrit ici. Il est fini, documenté, et
 * couvert par `scripts/check-water.mjs`.
 *
 * DÉCISION MÉTIER : on ne prédit PAS le pH d'empâtage depuis le grain — la
 * donnée par malt n'est pas publiée de façon fiable. On vise l'**alcalinité
 * résiduelle**, qui est le levier réel, et le pH se mesure à la cuve.
 */

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
 * À quelle fraction d'un seuil son avertissement commence à valoir.
 *
 * 0.8 : la dernière marche avant la faute. Assez tôt pour reculer d'un demi-
 * gramme, assez tard pour ne pas crier au loup — 120 ppm de sodium sur un
 * seuil de 150, c'est le moment où la question se pose vraiment.
 */
export const CAUTION_APPROACH = 0.8;

export interface SaltCaution {
  id: SaltId;
  /** La phrase à afficher, valeur atteinte comprise quand il y a un seuil. */
  text: string;
  /** Vrai quand le seuil est franchi, pas seulement approché. */
  franchi: boolean;
}

/**
 * Les avertissements de sel qui ont lieu d'être, ici et maintenant.
 *
 * ⚠️ C'est une décision de DOMAINE, pas d'affichage : « ce sodium-là est-il
 * assez haut pour qu'on en parle » se teste, et se testait mal dans du JSX.
 * L'écran n'a plus qu'à rendre la liste.
 *
 * Trois conditions pour qu'un avertissement paraisse : le sel est pesé, il
 * n'est pas écarté, et — s'il annonce un seuil — ce seuil est approché. Un fait
 * de manipulation (l'hydratation du CaCl₂, l'insolubilité de la craie) n'a pas
 * de seuil : il vaut dès le premier gramme.
 */
export function saltCautions(
  doses: Partial<Record<SaltId, number>> | undefined,
  disabled: SaltId[] | undefined,
  wort: WaterIons,
  totalWaterL: number
): SaltCaution[] {
  const off = new Set(disabled ?? []);
  const out: SaltCaution[] = [];

  SALT_IDS.forEach((id) => {
    const def = SALTS[id];
    if (!def.caution || off.has(id)) return;
    const grams = doses?.[id] ?? 0;
    if (!Number.isFinite(grams) || grams <= 0) return;

    const seuil = def.cautionThreshold;
    if (!seuil) {
      out.push({ id, text: def.caution, franchi: false });
      return;
    }

    /*
     * L'ion non suivi ne vit que dans la dose : `WaterIons` ne lui a pas de
     * champ, c'est tout l'objet de `untracked`.
     */
    const atteint =
      seuil.ion === 'untracked'
        ? totalWaterL > 0 && def.untracked
          ? (grams * def.untracked.ppmPerGramPerLitre) / totalWaterL
          : 0
        : (wort?.[seuil.ion] ?? 0);

    if (!Number.isFinite(atteint) || atteint < seuil.ppm * CAUTION_APPROACH) return;
    out.push({
      id,
      text: `${seuil.label} à ${Math.round(atteint)} ppm — ${def.caution}`,
      franchi: atteint > seuil.ppm
    });
  });

  return out;
}

/**
 * Les sels qui remontent l'alcalinité.
 *
 * ⚠️ Ils vont ENTIÈREMENT dans l'eau d'empâtage. L'alcalinité n'a de sens que
 * face aux phosphates du malt ; au rinçage, il n'y a pas de grain, et le
 * bicarbonate qu'on y verse est aussitôt neutralisé par l'acide de rinçage —
 * on achetait et pesait deux produits pour qu'ils s'annulent.
 */
export const ALKALINE_SALTS: SaltId[] = ['nahco3', 'caco3', 'chaux'];

/** AR maximale que le solveur prête à la craie, en ppm de CaCO₃ (voir étape 6). */
export const CHALK_RA_CAP_PPM = 75;

const isAlkaline = (id: SaltId) => ALKALINE_SALTS.includes(id);

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

// --- Profils cibles -----------------------------------------------------------

export interface TargetProfile extends WaterIons {
  id: string;
  name: string;
  /** Ce que ce profil fait à la bière. */
  purpose: string;
}

/**
 * Les eaux de brassage historiques, plus deux profils modernes.
 * Valeurs publiées, en ppm.
 *
 * ⚠️ DOCUMENTAIRES. Le solveur ne s'en sert pas : il vise les fourchettes par
 * style de `waterStyles.ts`. Elles servent de repère de lecture, pas de cible.
 */
export const TARGET_PROFILES: TargetProfile[] = [
  { id: 'pilsen', name: 'Pilsen', ca: 7, mg: 2, na: 2, so4: 5, cl: 5, hco3: 15,
    purpose: 'Eau presque pure — lagers délicates, Pils, Helles.' },
  { id: 'dublin', name: 'Dublin', ca: 118, mg: 4, na: 12, so4: 55, cl: 19, hco3: 160,
    purpose: 'Alcaline — supporte les malts torréfiés des stouts et porters.' },
  { id: 'burton', name: 'Burton-on-Trent', ca: 275, mg: 40, na: 25, so4: 610, cl: 35, hco3: 270,
    purpose: 'Très sulfatée — IPA tranchantes, amertume sèche.' },
  { id: 'munich', name: 'Munich', ca: 76, mg: 18, na: 2, so4: 10, cl: 2, hco3: 200,
    purpose: 'Maltée et douce — Dunkel, Bock, Märzen.' },
  { id: 'vienne', name: 'Vienne', ca: 200, mg: 60, na: 8, so4: 125, cl: 12, hco3: 120,
    purpose: 'Équilibrée sur les ambrées.' },
  { id: 'londres', name: 'Londres', ca: 52, mg: 32, na: 86, so4: 32, cl: 34, hco3: 104,
    purpose: 'Bitters et milds anglais.' },
  { id: 'dortmund', name: 'Dortmund', ca: 225, mg: 40, na: 60, so4: 120, cl: 60, hco3: 180,
    purpose: 'Minérale et équilibrée — Export.' },
  { id: 'neipa', name: 'NEIPA moderne', ca: 150, mg: 10, na: 10, so4: 100, cl: 200, hco3: 0,
    purpose: 'Chlorure dominant (2:1) — rondeur, amertume douce, houblon juteux.' },
  { id: 'westcoast', name: 'West Coast', ca: 150, mg: 10, na: 10, so4: 300, cl: 60, hco3: 0,
    purpose: 'Sulfate dominant (5:1) — amertume franche et sèche.' },
  { id: 'equilibre', name: 'Équilibré', ca: 100, mg: 8, na: 15, so4: 100, cl: 100, hco3: 40,
    purpose: 'Point de départ neutre quand le style ne commande rien.' }
];

// --- Calculs ------------------------------------------------------------------

const ZERO: WaterIons = { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 };

/** Eau osmosée : considérée comme pure. */
export const RO_WATER: WaterIons = { ...ZERO };

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
const CA_DIVISOR = 1.4;
const MG_DIVISOR = 1.7;

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

/** Alcalinité résiduelle apportée par 1 g de sel dans 1 L, effets croisés compris. */
export function netRaPerGramPerLitre(id: SaltId): number {
  const i = saltIons(id);
  return (
    alkalinityAsCaCO3(i.hco3 ?? 0) - (i.ca ?? 0) / CA_DIVISOR - (i.mg ?? 0) / MG_DIVISOR
  );
}

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
const RA_CENTRE_BY_EBC: Array<[ebc: number, centre: number]> = [
  [6, -30], // pâle    — Pils, Helles, Blonde
  [21, 30], // ambrée  — Pale ale, IPA
  [45, 90], // brune   — Brown ale, Dunkel, Bock
  [80, 150] // noire   — Stout, Porter, Impériale
];

/** Demi-largeur de la fenêtre : elle valait 30 ppm dans les quatre paliers. */
const RA_BAND_HALF = 30;

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

// --- Lire un profil d'eau écrit en toutes lettres -----------------------------

/**
 * Les noms sous lesquels un ion se présente dans une recette.
 *
 * ⚠️ L'ordre compte : les libellés LONGS d'abord. « calcium » avant « ca »,
 * sans quoi « calcium 110 » se ferait manger par le motif court et laisserait
 * « lcium 110 » derrière lui. Et le symbole court exige une frontière de mot
 * des deux côtés — sinon le « Ca » de « CaCl₂ » passerait pour du calcium.
 */
const ION_PATTERNS: Array<[ion: keyof WaterIons, motif: RegExp]> = [
  ['ca', /\b(?:calcium|ca)\s*(?:2\+|²⁺|\+\+)?\s*(?:ions?)?\s*[:=]?\s*/i],
  ['mg', /\b(?:magn[ée]sium|magnesium|mg)\s*(?:2\+|²⁺|\+\+)?\s*(?:ions?)?\s*[:=]?\s*/i],
  ['na', /\b(?:sodium|na)\s*(?:\+|⁺)?\s*(?:ions?)?\s*[:=]?\s*/i],
  ['so4', /\b(?:sulfates?|sulphates?|so\s?4|so₄)\s*(?:2-|²⁻|--)?\s*[:=]?\s*/i],
  ['cl', /\b(?:chlorures?|chlorides?|cl)\s*(?:-|⁻)?\s*[:=]?\s*/i],
  [
    'hco3',
    // « TAC » (titre alcalimétrique complet, analyses suisses et françaises),
    // « Karbonathärte » / « KH » (analyses allemandes) désignent la même chose.
    /\b(?:bicarbonates?|hydrog[ée]nocarbonates?|hco\s?3|hco₃|alcalinit[ée]|alkalinity|carbonates?|tac|karbonath[äa]rte|kh)\s*(?:-|⁻)?\s*[:=]?\s*/i
  ]
];

export interface ParsedWaterTarget {
  ions: WaterIons;
  /** Les ions réellement TROUVÉS dans le texte. Les autres restent à zéro. */
  found: Array<keyof WaterIons>;
  /** L'alcalinité était-elle donnée en CaCO₃ plutôt qu'en HCO₃ ? */
  alkalinityAsCaCO3: boolean;
  /**
   * L'unité dans laquelle l'alcalinité était écrite.
   *
   * ⚠️ Les analyses suisses donnent le TAC en °fH, les allemandes en °dH.
   * 1 °fH = 10 mg/L de CaCO₃ = 12.2 ppm de HCO₃⁻ ; 1 °dH = 17.85 mg/L de
   * CaCO₃ = 21.8 ppm. Lire « 20.5 °fH » comme 20.5 ppm divisait l'alcalinité
   * de Fribourg par douze.
   */
  alkalinityUnit: 'hco3' | 'caco3' | 'fH' | 'dH';
}

/**
 * Lit un profil d'eau collé depuis une recette.
 *
 * ⚠️ Volontairement LOCAL et déterministe. Une recette qui donne son eau
 * l'écrit presque toujours de la même façon — « Ca 110 · Mg 5 · Na 12 · SO4 200
 * · Cl 55 · HCO3 0 » —, et faire un aller-retour réseau pour ça serait plus
 * lent, hors-ligne impossible, et exposerait à une valeur inventée là où il n'y
 * a rien à inventer. L'IA reste le RECOURS quand ce lecteur ne trouve rien.
 *
 * ⚠️ Deux pièges que le motif naïf ne voit pas :
 *
 * 1. **« mg/L » n'est pas du magnésium.** C'est l'unité, et elle suit chaque
 *    valeur. Un motif « mg » suivi d'un nombre attrapait donc le chiffre du
 *    VOISIN de gauche.
 * 2. **L'alcalinité s'écrit souvent en CaCO₃.** « Alkalinity 50 as CaCO3 » vaut
 *    61 ppm de bicarbonate, pas 50. Confondre les deux fausse la cible d'un
 *    cinquième et, en cascade, la dose d'acide.
 */
export function parseWaterTarget(text: string): ParsedWaterTarget {
  const ions: WaterIons = { ...ZERO };
  const found: Array<keyof WaterIons> = [];
  // « mg/L », « mg/l », « mg / L » : l'unité, jamais l'ion.
  const propre = (text || '').replace(/\bmg\s*\/\s*(?:l|kg)\b/gi, ' ');

  const enCaCO3 =
    /(?:alcalinit|alkalinity|carbonate)[^\n;]{0,40}?(?:ca\s?co\s?3|caco₃|as\s+caco)/i.test(propre);
  // « TAC 20.5 °fH », « alcalinité 20,5 °f », « Karbonathärte 11.5 °dH ».
  // ⚠️ Pas « [^.] » comme borne de recherche : « 20.5 » contient un point.
  const enFH = /(?:alcalinit|alkalinity|carbonat|\btac\b|\bkh\b)[^\n;]{0,40}?°\s?f(?:h\b|\b)/i.test(propre);
  const enDH = /(?:alcalinit|alkalinity|carbonat|karbonat|\btac\b|\bkh\b)[^\n;]{0,40}?°\s?dh\b/i.test(propre);

  ION_PATTERNS.forEach(([ion, motif]) => {
    const re = new RegExp(motif.source + '(-?\\d+(?:[.,]\\d+)?)', 'i');
    const m = propre.match(re);
    if (!m) return;
    const v = parseFloat(m[1].replace(',', '.'));
    if (!Number.isFinite(v)) return;
    ions[ion] = Math.max(0, v);
    found.push(ion);
  });

  /*
   * L'alcalinité exprimée en CaCO₃ se convertit en bicarbonate : c'est l'unité
   * dans laquelle vit tout le reste de ce fichier.
   */
  let alkalinityUnit: ParsedWaterTarget['alkalinityUnit'] = 'hco3';
  if (found.includes('hco3')) {
    if (enFH) {
      alkalinityUnit = 'fH';
      ions.hco3 = round1(ions.hco3 * 12.2);
    } else if (enDH) {
      alkalinityUnit = 'dH';
      ions.hco3 = round1(ions.hco3 * 21.8);
    } else if (enCaCO3) {
      alkalinityUnit = 'caco3';
      ions.hco3 = round1((ions.hco3 * 61) / 50);
    }
  }

  return { ions, found, alkalinityAsCaCO3: alkalinityUnit !== 'hco3', alkalinityUnit };
}

// --- Le houblonnage penche la balance ----------------------------------------

/**
 * Où poser le curseur SO₄ ⇄ Cl DANS la fourchette du style, d'après le
 * houblonnage.
 *
 * ⚠️ Le houblon ne fixe pas la cible — le style le fait. Une stout est amère et
 * veut pourtant du chlorure ; une NEIPA porte trois cents grammes de houblon et
 * veut du chlorure aussi. Prendre l'amertume seule pour boussole envoyait donc
 * une milk stout vers le sulfate.
 *
 * Ce que le houblonnage dit vraiment, c'est **pour quoi** il est là. Deux
 * signaux, et rien d'autre :
 *
 *   BU:GU        — l'amertume rapportée à la densité. Une bière sèche et
 *                  tranchante la porte haut ; une bière ronde la porte bas.
 *   part amère   — la masse versée pour amériser (premier moût, ébullition
 *                  longue) face à celle versée pour le parfum (whirlpool, à
 *                  cru). C'est elle qui sépare une West Coast d'une NEIPA, que
 *                  le BU:GU seul confond.
 *
 * Le résultat ne sort JAMAIS de la fourchette du style : il ne fait qu'y
 * choisir une place. Le brasseur, lui, garde la main — le curseur passe outre.
 */
export function hopBalanceHint(
  hops: Array<{ weightG?: number; stage?: string; timeMin?: number }> | undefined,
  ibu: number | null,
  og: number | null,
  range: { min: number; max: number }
): { ratio: number; position: number; note: string } | null {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) return null;
  if (!ibu || !Number.isFinite(ibu) || ibu <= 0) return null;
  if (!og || !Number.isFinite(og) || og <= 1) return null;

  const list = (hops ?? []).filter((h) => Number.isFinite(h.weightG) && (h.weightG ?? 0) > 0);
  const gravityPoints = (og - 1) * 1000;
  if (list.length === 0 || gravityPoints <= 0) return null;

  const totalG = list.reduce((s, h) => s + (h.weightG ?? 0), 0);
  if (!Number.isFinite(totalG) || totalG <= 0) return null;

  /*
   * « Versé pour amériser » : le premier moût, et l'ébullition tenue au moins
   * un quart d'heure. Un ajout à 0 minute ne participe pas à l'amertume, il
   * participe à l'arôme — le compter parmi les amérisants faisait passer une
   * NEIPA pour une bière d'amertume.
   */
  const bitterG = list.reduce(
    (s, h) =>
      h.stage === 'firstWort' || (h.stage === 'boil' && Number.isFinite(h.timeMin) && (h.timeMin ?? 0) >= 15)
        ? s + (h.weightG ?? 0)
        : s,
    0
  );

  const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
  const buGu = ibu / gravityPoints;
  const bitterShare = bitterG / totalG;

  // 0.2 à 0.9 de BU:GU couvre tout ce qui se brasse ; 10 à 70 % de part amère
  // sépare l'aromatique pur du houblonnage d'amertume classique.
  const position =
    0.5 * clamp01((buGu - 0.2) / 0.7) + 0.5 * clamp01((bitterShare - 0.1) / 0.6);

  const ratio = Math.round((range.min + position * (range.max - range.min)) * 10) / 10;
  if (!Number.isFinite(ratio) || !Number.isFinite(position)) return null;

  /* Une seule ligne : elle vit sous la toile, où la place est comptée. */
  const chiffres = `BU:GU ${buGu.toFixed(2)}, ${Math.round(bitterShare * 100)} % amérisant`;
  const note =
    position >= 0.66
      ? `Houblonnage d’amertume — ${chiffres} : le sulfate tranche.`
      : position <= 0.33
        ? `Houblonnage d’arôme — ${chiffres} : le chlorure arrondit.`
        : `Houblonnage mixte — ${chiffres}.`;

  return { ratio, position, note };
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
const DI_PH_BY_EBC: Array<[ebc: number, ph: number]> = [
  [8, 5.75], // pilsner, pale, blé
  [20, 5.65], // vienne, munich clair
  [60, 5.5], // munich foncé, caramel clair
  [150, 5.25], // caramel moyen
  [400, 4.95], // caramel foncé, chocolat clair
  [900, 4.7] // torréfié, black, orge rôtie
];

function diPhForEbc(ebc: number): number {
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
function bufferForEbc(ebc: number): number {
  return 1 + Math.min(1.2, Math.max(0, ebc) / 500);
}

/** Le malt acidulé ne se reconnaît qu'au nom : sa couleur est celle d'un pale. */
const ACIDULATED = /acidul|sauermalz|sour\s*malt|acid\s*malt/i;

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
const RA_PH_DIVISOR = 50 * MALT_BUFFER_MEQ_PER_KG_PH;

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

/**
 * Acide nécessaire pour ramener l'alcalinité résiduelle dans sa fenêtre.
 *
 * ⚠️ Dosé sur l'eau d'EMPÂTAGE seule, et sur la composition de CETTE eau — les
 * sels alcalins ne sont versés qu'en elle. Calculer sur le volume total surdose
 * d'un facteur deux.
 */
export function acidNeeded(
  ions: WaterIons,
  mashWaterL: number,
  targetRa: number,
  acid: AcidId = 'lactique'
): { amount: number; unit: string; name: string } {
  /*
   * ⚠️ `NaN <= 0` VAUT FAUX — et c'est par là que la fiche de brassage se met
   * à annoncer « NaN mL ».
   *
   * Trouvé au balayage large : quatre fonctions se gardaient par `x <= 0`, ce
   * qui arrête bien un zéro et un négatif, et laisse passer un NaN comme un
   * Infinity. Un champ de volume vidé pour être retapé suffit à en produire un,
   * et le nombre traverse alors tout le calcul jusqu'à l'écran. Le solveur, lui,
   * se gardait déjà par `Number.isFinite` : c'est la même garde qu'il faut ici.
   *
   * Même correction dans `spargeAcidNeeded`, `lactateInBeer` et
   * `rebalanceRatio`.
   */
  if (!Number.isFinite(mashWaterL) || !Number.isFinite(targetRa)) {
    return { amount: 0, unit: ACIDS[acid].unit, name: ACIDS[acid].name };
  }
  const currentRa = residualAlkalinity(ions);
  if (currentRa <= targetRa || mashWaterL <= 0) {
    return { amount: 0, unit: ACIDS[acid].unit, name: ACIDS[acid].name };
  }
  // Retour de l'AR vers l'alcalinité, puis vers les mg de HCO₃ à neutraliser.
  const excessAlkalinityCaCO3 = currentRa - targetRa;
  const hco3ToRemove = (excessAlkalinityCaCO3 * 61) / 50;
  const mg = hco3ToRemove * mashWaterL;
  const def = ACIDS[acid];
  return {
    amount: Math.round((mg / def.hco3NeutralizedPerUnit) * 10) / 10,
    unit: def.unit,
    name: def.name
  };
}

/**
 * L'acide À AJOUTER MAINTENANT, une fois le pH relevé au pH-mètre à la cuve.
 *
 * ⚠️ Demandé ainsi : « je veux que l'on calcule si je dois ajouter de l'acide
 * ou pas… une fois au mash pendant le brassage ». Le relevé existait déjà et
 * affichait un écart, mais ne disait jamais quoi FAIRE de cet écart.
 *
 * ⚠️ Pourquoi ce calcul a le droit d'agir là où l'ESTIMATION n'en avait pas le
 * droit. Les notes d'`estimateMashPh` refusent explicitement de prescrire de
 * l'acide sur une prédiction, qui porte ±0.15 d'incertitude — corriger dessus
 * serait sur-acidifier une simple supposition. Un pH MESURÉ n'a plus cette
 * incertitude de modèle : c'est un fait de cuverie. Corriger dessus tient donc
 * la même règle à la lettre — on n'agit jamais que sur du mesuré.
 *
 * ⚠️ Ne se déclenche qu'AU-DESSUS de la fenêtre. En dessous, la maische est
 * déjà plus acide qu'il ne faut : il n'y a pas de sel qu'on ajoute à la cuve
 * pour remonter un pH, et ce n'est pas ce qu'on demande ici.
 *
 * LE MODÈLE, hérité de `phShiftFromRa` : l'alcalinité résiduelle déplace le pH
 * proportionnellement au rapport eau/grain — ΔpH = (ΔAR · ratio) / 1750.
 * Inversée, elle donne l'AR à retirer pour ramener le pH mesuré au milieu de
 * la fenêtre, puis cette AR se convertit en acide exactement comme
 * `acidNeeded` le fait pour l'AR calculée sur les ions — même conversion en
 * mg de HCO₃⁻, mêmes acides, mêmes unités. Une seule règle de conversion,
 * appliquée aux deux sources d'AR.
 */
export function acidCorrectionFromMeasuredPh(
  measuredPh: number,
  mashWaterL: number,
  mashRatioLPerKg: number,
  acid: AcidId = 'lactique'
): { known: boolean; amount: number; unit: string; name: string; deltaPh: number } {
  const def = ACIDS[acid];
  const vide = { known: true, amount: 0, unit: def.unit, name: def.name, deltaPh: 0 };

  if (!Number.isFinite(measuredPh) || !(mashWaterL > 0)) return { ...vide, known: false };
  if (measuredPh <= MASH_PH_BAND.max) return vide;

  /*
   * ⚠️ SANS RAPPORT EAU/GRAIN, ON NE CHIFFRE RIEN — on ne le devine surtout pas.
   *
   * La version précédente retombait silencieusement sur 3.5 L/kg quand la
   * facture de grain manquait (`mashRatioLPerKg` vaut alors 0). Elle annonçait
   * donc « ajoute 7.9 mL » avec l'aplomb d'un calcul, sur une épaisseur de
   * maische INVENTÉE. À 7 L/kg réels, la même mesure demande deux fois moins
   * d'acide : l'erreur ne se voit pas, et elle se boit.
   *
   * C'est la règle que `estimateMashPh` tient déjà en renvoyant `known: false`
   * plutôt qu'un pH sur une facture incomplète. Une dose d'acide mérite au
   * moins autant de prudence qu'une prédiction : mieux vaut dire qu'il manque
   * la facture de grain que de servir un millilitre faux.
   */
  if (!Number.isFinite(mashRatioLPerKg) || mashRatioLPerKg <= 0) {
    return { ...vide, known: false };
  }

  const deltaPh = Math.round((measuredPh - MASH_PH_BAND.target) * 100) / 100;
  const ratio = Math.min(8, mashRatioLPerKg);
  const extraRaCaCO3 = (deltaPh * RA_PH_DIVISOR) / ratio;
  const hco3ToRemove = (extraRaCaCO3 * 61) / 50;
  const mg = hco3ToRemove * mashWaterL;

  return {
    known: true,
    amount: Math.round((mg / def.hco3NeutralizedPerUnit) * 10) / 10,
    unit: def.unit,
    name: def.name,
    deltaPh
  };
}

/**
 * L'eau UNE FOIS L'ACIDE VERSÉ.
 *
 * ⚠️ Ce que ça règle : la toile montrait le bicarbonate d'AVANT traitement.
 * Sur l'eau de Fribourg, elle affichait donc « HCO₃ 250 ▲ » en ambre, hors
 * fourchette, alors que le plan prévoyait justement l'acide qui le ramène dans
 * sa cible. Un ion signalé en défaut en permanence, que le plan corrigeait
 * déjà — le brasseur voyait une alerte qu'aucun geste ne pouvait éteindre.
 *
 * Les sels APPORTENT des ions, l'acide en RETIRE un : les deux font partie de
 * la même correction, et l'eau qu'on verse est le résultat des deux.
 *
 * ⚠️ N'entre JAMAIS dans le calcul de la dose. `acidNeeded` se calcule sur
 * l'eau d'avant acide — c'est elle qu'il s'agit de corriger. Retirer l'acide
 * puis redoser dessus donnerait zéro à chaque tour : la fonction ci-dessous ne
 * sert qu'à MONTRER le résultat.
 */
export function ionsAfterAcid(
  ions: WaterIons,
  amount: number,
  acid: AcidId,
  litres: number
): WaterIons {
  if (!(amount > 0) || !(litres > 0)) return ions;
  const ppmRetires = (amount * ACIDS[acid].hco3NeutralizedPerUnit) / litres;
  return { ...ions, hco3: Math.max(0, ions.hco3 - ppmRetires) };
}

/**
 * pH visé pour l'eau de RINÇAGE.
 *
 * ⚠️ Une seule définition, et les appelants ne la recopient pas. Un chiffre de
 * procédé écrit à trois endroits finit par diverger : c'est exactement la panne
 * que cet audit a trouvée ailleurs — deux modèles de volume concurrents, dont
 * un seul était corrigé.
 */
export const SPARGE_TARGET_PH = 5.5;

/** Part du carbonate encore sous forme HCO₃⁻ à un pH donné (pKa₁ 6.35). */
function bicarbonateFraction(ph: number): number {
  return 1 / (1 + Math.pow(10, 6.35 - ph));
}

/**
 * Part de l'alcalinité mesurée qu'il faut neutraliser pour atteindre `targetPh`
 * depuis `sourcePh`.
 *
 *   f = 1 − α₁(cible) / α₁(source),  α₁ = 1 / (1 + 10^(pKa₁ − pH))
 *
 * ⚠️ Le code retirait 100 % de l'alcalinité en annonçant viser pH 5.8. Retirer
 * la TOTALITÉ, c'est atteindre le point d'équivalence d'un titrage
 * d'alcalinité, soit pH 4.3–4.5. Pour 5.8 il n'en faut retirer que 76 %, pour
 * 5.5 que 87 % : l'écart valait un surdosage d'environ 30 %.
 */
export function alkalinityFractionToRemove(targetPh: number, sourcePh = 7.4): number {
  const at = bicarbonateFraction(targetPh);
  const from = bicarbonateFraction(Math.max(sourcePh, targetPh));
  if (from <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - at / from));
}

/**
 * Acidification de l'eau de RINÇAGE.
 *
 * ⚠️ Ce qui manquait, et c'est un défaut de brassage réel : une eau de rinçage
 * alcaline extrait les tanins des drêches en fin de coulage — la bière ressort
 * astringente. On l'acidifie donc **indépendamment de la maische**, et sans que
 * le grain n'entre en jeu : il n'y a plus de grain à ce stade.
 *
 * ⚠️ La cible est 5.5 et non 5.8. La cuve de rinçage est OUVERTE à 76 °C : le
 * CO₂ dégaze et le pH remonte pendant le coulage. Viser 5.5 laisse la marge
 * pour ça sans jamais approcher le point d'équivalence.
 *
 * ⚠️ Le malt acidulé est REFUSÉ ici : c'est du grain, et il n'y a pas de grain
 * au rinçage. En rendre des grammes était une consigne inapplicable.
 */
export function spargeAcidNeeded(
  ions: WaterIons,
  spargeWaterL: number,
  acid: AcidId = 'lactique',
  targetPh = SPARGE_TARGET_PH,
  sourcePh = 7.4
): { amount: number; unit: string; name: string; targetPh: number; warning?: string } {
  const def = ACIDS[acid];
  const base = { unit: def.unit, name: def.name, targetPh };
  if (acid === 'maltAcidule') {
    return {
      ...base,
      amount: 0,
      warning:
        'Le malt acidulé s’ajoute au grain : il n’a rien à faire au rinçage. Choisis un acide liquide pour cette eau.'
    };
  }
  /* Même garde que `acidNeeded` : un NaN passe au travers de `<= 0`. */
  if (!Number.isFinite(spargeWaterL) || spargeWaterL <= 0) return { ...base, amount: 0 };

  const alk = alkalinityAsCaCO3(ions.hco3);
  if (alk <= 0) return { ...base, amount: 0 };

  const toRemove = alk * alkalinityFractionToRemove(targetPh, sourcePh);
  const hco3ToRemove = (toRemove * 61) / 50;
  const mg = hco3ToRemove * spargeWaterL;
  return { ...base, amount: Math.round((mg / def.hco3NeutralizedPerUnit) * 10) / 10 };
}

/**
 * Acide lactique laissé dans la bière, en g/L.
 *
 * ⚠️ La note du produit dit « au-delà de 5 mL pour 20 L, son goût se perçoit ».
 * Elle vaut par AJOUT ; personne ne somme l'empâtage et le rinçage. Sur une eau
 * calcaire, les deux cumulés franchissent le seuil de perception sans qu'aucune
 * des deux lignes n'ait l'air excessive.
 *
 * 1 mL d'acide lactique à 80 % pèse 1.19 g et titre 0.952 g d'acide pur.
 */
export function lactateInBeer(totalMl: number, beerVolumeL: number): number {
  /* Même garde que `acidNeeded` : un NaN passe au travers de `<= 0`. */
  if (!Number.isFinite(totalMl) || !Number.isFinite(beerVolumeL) || beerVolumeL <= 0) return 0;
  return Math.round(((totalMl * 0.952) / beerVolumeL) * 100) / 100;
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

// --- Solveur ------------------------------------------------------------------

/** Fourchette d'un ion. Structurellement identique à `IonRange` de `waterStyles`. */
export interface IonBand {
  min: number;
  max: number;
}

export interface SolveInput {
  /** Eau de départ de l'EMPÂTAGE, après dilution à l'osmosée. */
  start: WaterIons;
  /**
   * Eau de départ du RINÇAGE. Absente : la même que `start`.
   *
   * ⚠️ Le solveur ne la connaissait pas et jugeait le moût comme si les deux
   * eaux étaient pareilles. Or la pratique recommandée coupe le rinçage à
   * 90 % d'osmosée : sur une porter depuis Fribourg, il voyait 130 ppm de
   * calcium dans le moût quand il y en avait 99, plafonnait les sels sur cette
   * eau fantôme et laissait le calcium 6 ppm sous la cible en accusant l'eau
   * de départ.
   */
  startSparge?: WaterIons;
  /**
   * AR au-delà de laquelle la FACTURE n'a plus besoin de sels alcalins
   * (`raForGrist`). Absente : la bande de couleur commande seule.
   */
  raCeiling?: number | null;
  /** Le point visé : milieu de fourchette du style, rééquilibré par le curseur. */
  target: WaterIons;
  /**
   * Fourchettes du style. Ce sont elles qui PLAFONNENT chaque sel : la cible
   * est un point, la fourchette est la limite à ne pas franchir.
   */
  ranges: Record<keyof WaterIons, IonBand>;
  /** Volume total traité — les sels de saveur s'y dosent. */
  totalWaterL: number;
  /** Volume d'empâtage — les sels alcalins s'y dosent, et n'y vont QUE là. */
  mashWaterL: number;
  disabled?: SaltId[];
  /** Fenêtre d'alcalinité résiduelle, dérivée de la couleur de la bière. */
  targetRa?: RaBand;
  /** Rapport SO₄:Cl voulu, pour répartir le complément de calcium. */
  ratio?: number;
  /**
   * Tous les sels sont-ils versés dans la maische ?
   *
   * ⚠️ LE SOLVEUR L'IGNORAIT, et c'est une faute de fond trouvée à l'audit du
   * 05.09.2026. Il modélisait l'eau d'empâtage comme « sels de saveur au volume
   * TOTAL + sels alcalins au volume d'empâtage », ce qui n'est vrai qu'en
   * répartition proportionnelle. Or l'app recommande — et enregistre par
   * défaut — l'inverse : tout dans la maische.
   *
   * Conséquence chiffrée sur 18.5 L d'empâtage et 12.5 de rinçage : le calcium
   * réel de la maische est 1.68 fois celui que voyait le solveur. Il
   * SURESTIMAIT donc l'alcalinité résiduelle de 33 ppm, et sous-dosait les sels
   * alcalins d'autant sur les bières foncées — celles-là mêmes qui en ont
   * besoin. Le plafond de calcium des sels alcalins était faussé du même
   * facteur, dans le sens du dépassement.
   *
   * L'acide, lui, n'était pas touché : l'écran le calcule sur `waterFromPlan`,
   * qui a toujours été juste.
   */
  allSaltsInMash?: boolean;
}

export interface SolveResult {
  /** Doses en grammes pour le volume TOTAL traité. */
  doses: Partial<Record<SaltId, number>>;
  /** Ce que devient l'eau d'empâtage — sels de saveur ET alcalins. */
  achievedMash: WaterIons;
  /** Ce que devient l'eau de rinçage — sels de saveur seuls. */
  achievedSparge: WaterIons;
  /**
   * Le MOÛT, les deux eaux réunies.
   *
   * ⚠️ C'est LUI que la fourchette du style borne — c'est la bière qu'on boit.
   * La maische peut légitimement la dépasser quand tous les sels y sont
   * versés : la même masse tient dans un volume plus petit. Ne disposer que de
   * l'eau d'empâtage faisait juger la cible sur la mauvaise eau, et les
   * contrôles criaient au dépassement sur un moût parfaitement dans la cible.
   */
  achievedWort: WaterIons;
  /** Ce que le solveur n'a pas pu atteindre, dit franchement. */
  unreachable: string[];
}

/**
 * Propose les doses pour aller de l'eau de départ vers la fourchette du style.
 *
 * **Le principe, et il a changé.** Chaque sel apporte plusieurs ions : le doser
 * sur celui qu'on vise fait déborder les autres. La version précédente traitait
 * ce problème sel par sel — un plafond avait été ajouté sur le magnésium après
 * un dépassement de sulfate, un autre aurait suivi pour le sodium. C'est la
 * règle elle-même qui manquait :
 *
 *   **aucun sel n'est jamais dosé au-delà de ce que le PLUS CONTRAINT de ses
 *   ions peut absorber sans sortir de la fourchette du style.**
 *
 * Appliquée à tous les sels, elle rend le dépassement impossible par
 * construction. Il ne reste que des MANQUES, et un manque s'annonce.
 *
 * **L'ordre suit la contrainte, pas le tableau :**
 *
 *   1. sulfate (gypse) ;
 *   2. chlorure (CaCl₂, sinon MgCl₂, sinon KCl) ;
 *   3. plancher de calcium — complété au rapport SO₄:Cl voulu ;
 *   4. plancher de magnésium, réparti au même rapport ;
 *   5. alcalinité, sur l'eau d'empâtage seule ;
 *   6. plancher de sodium (NaCl) — après le bicarbonate, qui en apporte déjà.
 *
 * Sodium et magnésium ne visent que le MINIMUM du style : ce sont des
 * plafonds de goût, pas des objectifs (voir le commentaire avant l'étape 1).
 *
 * **Pourquoi le magnésium en dernier.** C'est l'arbitrage inverse de la version
 * précédente, et il est délibéré : le magnésium de l'eau est facultatif — le
 * malt en apporte déjà une centaine de ppm au moût — alors que le calcium est
 * fonctionnel (floculation de la levure, précipitation des oxalates, pH de
 * maische). Servir le magnésium d'abord mangeait la marge de sulfate et de
 * chlorure dont le calcium avait besoin, et laissait une Pils à 31 ppm de
 * calcium sans rien dire.
 *
 * **L'alcalinité ne se copie PAS du profil cible.** L'eau de Burton titre
 * 270 ppm de bicarbonate, mais personne ne remonte l'alcalinité pour brasser
 * une IPA : on la traite à l'acide. Elle se règle sur la COULEUR de la bière.
 *
 * On ne RETIRE jamais d'ion : aucun sel ne fait baisser une concentration. La
 * seule façon de descendre est de diluer à l'osmosée.
 */
export function solveSalts(input: SolveInput): SolveResult {
  const { totalWaterL } = input || {};
  const start: WaterIons = {
    ca: Number.isFinite(input?.start?.ca) ? Math.max(0, input.start.ca) : 0,
    mg: Number.isFinite(input?.start?.mg) ? Math.max(0, input.start.mg) : 0,
    na: Number.isFinite(input?.start?.na) ? Math.max(0, input.start.na) : 0,
    so4: Number.isFinite(input?.start?.so4) ? Math.max(0, input.start.so4) : 0,
    cl: Number.isFinite(input?.start?.cl) ? Math.max(0, input.start.cl) : 0,
    hco3: Number.isFinite(input?.start?.hco3) ? Math.max(0, input.start.hco3) : 0
  };
  const target: WaterIons = {
    ca: Number.isFinite(input?.target?.ca) ? Math.max(0, input.target.ca) : 0,
    mg: Number.isFinite(input?.target?.mg) ? Math.max(0, input.target.mg) : 0,
    na: Number.isFinite(input?.target?.na) ? Math.max(0, input.target.na) : 0,
    so4: Number.isFinite(input?.target?.so4) ? Math.max(0, input.target.so4) : 0,
    cl: Number.isFinite(input?.target?.cl) ? Math.max(0, input.target.cl) : 0,
    hco3: Number.isFinite(input?.target?.hco3) ? Math.max(0, input.target.hco3) : 0
  };
  const ranges = input?.ranges ?? ({} as Record<keyof WaterIons, IonBand>);
  /* ⚠️ Un appelant sans fourchettes ne doit pas planter : bande ouverte. */
  const rangeMax = (ion: keyof WaterIons): number => {
    const m = ranges?.[ion]?.max;
    return m != null && Number.isFinite(m) ? m : Infinity;
  };
  const rangeMin = (ion: keyof WaterIons): number => {
    const m = ranges?.[ion]?.min;
    return m != null && Number.isFinite(m) ? m : 0;
  };
  const off = new Set(input?.disabled ?? []);
  const doses: Partial<Record<SaltId, number>> = {};
  const unreachable: string[] = [];

  if (!totalWaterL || !Number.isFinite(totalWaterL) || totalWaterL <= 0) {
    return {
      doses,
      achievedMash: start,
      achievedSparge: start,
      achievedWort: start,
      /*
       * ⚠️ « Volume nul. » ne disait pas quoi faire. C'est pourtant l'état de
       * DÉPART de tout nouveau brassin : l'assistant ouvre l'atelier avant que
       * les volumes soient posés, et le brasseur y arrive donc toujours.
       */
      unreachable: [
        'Aucune eau à traiter : pose d’abord les volumes d’empâtage et de rinçage. Les sels et l’acide se dosent au litre.'
      ]
    };
  }

  const mashL = Number.isFinite(input?.mashWaterL) && (input.mashWaterL ?? 0) > 0 ? input.mashWaterL : totalWaterL;
  /*
   * ⚠️ Lu UNE fois, et « absent = vrai » comme partout ailleurs. Le lire à deux
   * endroits avec deux valeurs par défaut différentes — ce que faisait la
   * première version de cette correction — donnait un solveur qui raisonnait en
   * répartition proportionnelle mais rendait des eaux calculées tout à
   * l'empâtage. Le pire des deux mondes.
   */
  const allInMash = input.allSaltsInMash !== false;
  const spargeL = Math.max(0, totalWaterL - mashL);

  const startSparge: WaterIons = input.startSparge
    ? {
        ca: Number.isFinite(input.startSparge.ca) ? Math.max(0, input.startSparge.ca) : 0,
        mg: Number.isFinite(input.startSparge.mg) ? Math.max(0, input.startSparge.mg) : 0,
        na: Number.isFinite(input.startSparge.na) ? Math.max(0, input.startSparge.na) : 0,
        so4: Number.isFinite(input.startSparge.so4) ? Math.max(0, input.startSparge.so4) : 0,
        cl: Number.isFinite(input.startSparge.cl) ? Math.max(0, input.startSparge.cl) : 0,
        hco3: Number.isFinite(input.startSparge.hco3) ? Math.max(0, input.startSparge.hco3) : 0
      }
    : start;

  /* Ce que les DEUX eaux de départ apportent au moût, une fois réunies. */
  const startWort: WaterIons = { ...ZERO };
  (Object.keys(startWort) as Array<keyof WaterIons>).forEach((ion) => {
    startWort[ion] = round1((start[ion] * mashL + startSparge[ion] * spargeL) / totalWaterL);
  });

  /* `running` = le MOÛT visé : les sels de saveur dosés au volume total. C'est
   * lui que le style borne, parce que c'est lui qu'on boit.
   * `mashExtra` = ce que les sels ALCALINS ajoutent, à l'empâtage seulement. */
  const running: WaterIons = { ...startWort };
  const mashExtra: WaterIons = { ...ZERO };

  /**
   * De combien la maische est plus CONCENTRÉE que le moût.
   *
   * ⚠️ Vaut 1 en répartition proportionnelle — les sels de saveur y sont à la
   * même concentration dans les deux eaux. Mais quand tout part à l'empâtage,
   * la même masse de sel tient dans le seul volume de maische : sur 18.5 L
   * d'empâtage pour 31 au total, la maische titre 1.68 fois plus. C'est ce
   * facteur qui manquait, et il fausse l'alcalinité résiduelle — donc la dose
   * de sels alcalins et leur plafond de calcium.
   */
  const mashFactor = allInMash && mashL > 0 ? totalWaterL / mashL : 1;

  const currentMash = (): WaterIons => {
    const out = { ...ZERO };
    (Object.keys(out) as Array<keyof WaterIons>).forEach((ion) => {
      // Seuls les SELS se concentrent ; l'eau de départ de la maische, elle,
      // est déjà là — et ce n'est pas celle du moût quand le rinçage est coupé.
      out[ion] = round1(start[ion] + (running[ion] - startWort[ion]) * mashFactor);
    });
    return addIons(out, mashExtra);
  };

  /**
   * Le MOÛT — l'empâtage et le rinçage une fois réunis dans la cuve.
   *
   * ⚠️ C'est LUI que la fourchette du style borne, et pas la maische : le style
   * décrit la bière qu'on boit. Les deux ne se confondent que dans le cas
   * proportionnel — d'où deux vues, et non plus une seule qui servait aux deux
   * usages. S'en tenir à la maische pour juger le sulfate ferait crier au
   * dépassement sur une eau qui, dans le verre, est en plein dans la cible.
   *
   * Les sels alcalins, versés dans la seule maische, s'y retrouvent dilués au
   * prorata du volume qu'elle représente.
   */
  const currentWort = (): WaterIons => {
    const share = totalWaterL > 0 ? Math.min(1, mashL / totalWaterL) : 1;
    const out = { ...ZERO };
    (Object.keys(out) as Array<keyof WaterIons>).forEach((ion) => {
      out[ion] = round1(running[ion] + mashExtra[ion] * share);
    });
    return out;
  };

  const need = (ion: keyof WaterIons) => Math.max(0, target[ion] - running[ion]);

  /**
   * Grammes de `id` qui tiennent SOUS le maximum de chacun de ses ions.
   * C'est la règle centrale : elle s'applique à tous les sels, sans exception.
   */
  const capFlavour = (id: SaltId, grams: number): number => {
    let g = Math.max(0, grams);
    const ions = saltIons(id);
    (Object.keys(ions) as Array<keyof WaterIons>).forEach((ion) => {
      const perGram = (ions[ion] ?? 0) / totalWaterL;
      if (perGram <= 0) return;
      const room = Math.max(0, rangeMax(ion) - running[ion]);
      g = Math.min(g, room / perGram);
    });

    /*
     * ⚠️ L'ion NON SUIVI est bridé lui aussi. Le potassium du KCl n'a pas de
     * champ dans `WaterIons`, donc la boucle ci-dessus l'ignorait : rien ne
     * l'empêchait de dépasser le seuil où il se goûte. C'est ce trou qui
     * justifiait d'exclure le KCl d'office — un interdit à la place d'un
     * plafond. Le plafond posé, l'interdit n'a plus lieu d'être.
     *
     * On raisonne sur la dose CUMULÉE : `running` ne porte pas le potassium,
     * c'est donc la dose déjà versée de ce sel qui compte.
     */
    const un = SALTS[id].untracked;
    if (un?.maxPpm != null) {
      const perGram = un.ppmPerGramPerLitre / totalWaterL;
      if (perGram > 0) {
        const dejaPpm = ((doses[id] ?? 0) * un.ppmPerGramPerLitre) / totalWaterL;
        g = Math.min(g, Math.max(0, un.maxPpm - dejaPpm) / perGram);
      }
    }
    return g;
  };

  /*
   * ⚠️ On TRONQUE au dixième de gramme, on n'arrondit pas. La balance ne pèse
   * pas plus fin, mais arrondir au plus proche peut franchir le plafond qu'on
   * vient de calculer : c'est ce qui faisait sortir le chlorure d'une lager à
   * 62 ppm pour un maximum de 60. Tronquer garde la garantie « jamais
   * au-dessus », au prix d'un dixième de gramme sous la cible.
   */
  const applyFlavour = (id: SaltId, grams: number): number => {
    const g = Math.floor(Math.max(0, grams) * 10) / 10;
    if (g <= 0.05) return 0;
    doses[id] = round1((doses[id] ?? 0) + g);
    const ions = saltIons(id);
    (Object.keys(ions) as Array<keyof WaterIons>).forEach((ion) => {
      running[ion] = round1(running[ion] + ((ions[ion] ?? 0) * g) / totalWaterL);
    });
    return g;
  };

  /**
   * Plafond d'un sel ALCALIN.
   *
   * ⚠️ Le bicarbonate n'est PAS plafonné par la fourchette de HCO₃ du style, et
   * c'est délibéré : l'alcalinité se règle sur la couleur de la bière, jamais
   * sur le profil — elle serait sinon bornée par un chiffre qui n'est là qu'à
   * titre descriptif. Ce qui est plafonné, c'est le sodium et le calcium qu'ils
   * traînent : ceux-là se goûtent.
   */
  const capAlkaline = (id: SaltId, grams: number): number => {
    let g = Math.max(0, grams);
    const ions = saltIons(id);
    /*
     * ⚠️ Plafonné sur le MOÛT, et non sur la maische. La fourchette du style
     * décrit la bière ; ce qui compte, c'est donc ce que le sodium de la chaux
     * ou du bicarbonate pèsera une fois les deux eaux réunies.
     *
     * Le comparer à la seule maische, comme le faisait le code, était deux fois
     * trop sévère sur un brassin à 20 L d'empâtage pour 30 au total : la chaux
     * se trouvait bloquée par un plafond de calcium qui n'existe pas dans le
     * verre, et une impériale depuis l'osmosée n'atteignait plus sa fenêtre
     * d'alcalinité. Le solveur annonçait alors « diminue la part d'osmosée »
     * pour un obstacle qu'il avait lui-même inventé.
     */
    const wort = currentWort();
    (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
      const perGram = (ions[ion] ?? 0) / totalWaterL;
      if (perGram <= 0) return;
      const room = Math.max(0, rangeMax(ion) - wort[ion]);
      g = Math.min(g, room / perGram);
    });
    return g;
  };

  const applyAlkaline = (id: SaltId, grams: number): number => {
    const g = Math.floor(Math.max(0, grams) * 10) / 10;
    if (g <= 0.05) return 0;
    doses[id] = round1((doses[id] ?? 0) + g);
    const ions = saltIons(id);
    (Object.keys(ions) as Array<keyof WaterIons>).forEach((ion) => {
      mashExtra[ion] = round1(mashExtra[ion] + ((ions[ion] ?? 0) * g) / mashL);
    });
    return g;
  };

  const first = (...ids: SaltId[]): SaltId | undefined => ids.find((id) => !off.has(id));

  /*
   * ⚠️ SODIUM ET MAGNÉSIUM NE SONT PAS DES CIBLES, CE SONT DES PLAFONDS.
   *
   * Le solveur visait le milieu de leur fourchette comme pour le sulfate ou
   * le chlorure. Sur une impériale, ça donnait 6.8 g de sel de table pour
   * « atteindre » 50 ppm de sodium, puis 6.8 g de bicarbonate qui en
   * apportaient autant : 80 ppm, pile au plafond, et l'alerte « c'est lui qui
   * sale » sur un sel que personne n'avait demandé. Personne ne sale une stout ;
   * le sodium arrive en sous-produit du bicarbonate, et le magnésium, le malt
   * l'apporte. Gaëtan l'a vu à l'écran avant que le calcul ne le dise.
   *
   * On ne verse donc ces deux-là que jusqu'au MINIMUM du style — une Gose
   * (Na ≥ 60) reste salée, une stout (Na ≥ 20) ne l'est plus — et le sel de
   * table passe APRÈS l'alcalinité, pour compter le sodium du bicarbonate.
   */

  /** Sodium jusqu'au plancher du style, par le sel de table. */
  const doseSodium = () => {
    /*
     * ⚠️ UNE PINCÉE, PAS ZÉRO — et pas le milieu de fourchette non plus.
     *
     * On visait `min(cible, plancher du style)`, et le plancher vaut 0 partout
     * sauf sur une Gose : le sodium sortait donc à 0 ppm sur eau osmosée. La
     * règle venait d’un vrai défaut — 6.8 g de sel de table dans une impériale
     * pour « atteindre » 50 ppm — mais elle a corrigé l’excès par l’absence.
     * Un gramme et demi de sel dans 30 L, c’est 20 ppm : c’est ce que fait un
     * brasseur sur une stout ou une NEIPA, et c’est quatre fois sous le seuil
     * où le sodium se goûte.
     *
     * Le plancher du style reste prioritaire quand il est plus haut : une Gose
     * en veut 60, et ce n’est pas une pincée.
     */
    const naFloor = Math.min(target.na, rangeMin('na'));
    const naNeeded = Math.max(0, naFloor - currentWort().na);
    // Sous 5 ppm, ce serait 0.3 g de sel : la balance ne le pèse pas, le palais non plus.
    if (naNeeded < 5) return;
    if (!off.has('nacl')) {
      const wanted = (naNeeded * totalWaterL) / saltIons('nacl').na!;
      /*
       * ⚠️ LE PLAFOND PEUT RAMENER LA DOSE SOUS LA BALANCE.
       *
       * Le garde-fou du dessus regarde le BESOIN — « sous 5 ppm, ce serait
       * 0.3 g » —, pas ce qui reste possible une fois le chlorure du sel
       * confronté à son propre plafond. Sur une IPA anglaise depuis l'osmosée,
       * le besoin valait 10 ppm de sodium et le chlorure n'en laissait passer
       * que la moitié : 0.4 g sur la fiche de pesée. La même règle que pour les
       * chlorures s'applique — sous un demi-gramme, on ne pèse pas.
       */
      const capped = capFlavour('nacl', wanted);
      if (capped >= 0.5) applyFlavour('nacl', capped);
    } else {
      unreachable.push(`Sodium : +${Math.round(naNeeded)} ppm hors d’atteinte (sel écarté).`);
    }
  };

  /*
   * 0. Quand le SEL FAIT LA RECETTE (Gose : sodium ≥ 60), il passe en
   *    premier : c'est lui qui doit apporter le chlorure, pas le CaCl₂ — sinon
   *    le chlorure de calcium prend toute la place et le sel bute sur le
   *    plafond de chlorure avec le sodium encore sous son plancher.
   */
  const saltIsTheRecipe = rangeMin('na') >= 40;
  if (saltIsTheRecipe) doseSodium();

  // 1. Sulfate — gypse.
  const so4Needed = need('so4');
  if (so4Needed > 0) {
    if (!off.has('gypse')) {
      const wanted = (so4Needed * totalWaterL) / saltIons('gypse').so4!;
      applyFlavour('gypse', capFlavour('gypse', wanted));
    } else if (so4Needed > 10) {
      unreachable.push(`Sulfate : +${Math.round(so4Needed)} ppm hors d’atteinte (gypse écarté).`);
    }
  }

  // 2. Chlorure — CaCl₂, sinon MgCl₂, sinon KCl.
  /*
   * ⚠️ En CASCADE, pas « le premier disponible ». Sur l'eau de Fribourg
   * (85 ppm de calcium), le CaCl₂ bute sur le plafond de calcium bien avant
   * le chlorure visé : une porter sortait à 59 ppm de chlorure pour 105, une
   * blonde sans alcool à 35 pour 115 — sans un mot. On enchaîne alors le
   * MgCl₂ (jusqu'au plafond de magnésium), puis le sel de table (jusqu'au
   * plafond de sodium — c'est ce que fait un brasseur sur eau dure), puis le
   * KCl. Et si ça ne suffit toujours pas, on le dit : c'est l'osmosée.
   */
  const clWanted = need('cl');
  if (clWanted > 0) {
    const applyChloride = (source: SaltId, ppm: number, minGrams = 0) => {
      const wanted = (ppm * totalWaterL) / saltIons(source).cl!;
      const capped = capFlavour(source, wanted);
      if (capped < minGrams) return;
      const given = applyFlavour(source, capped);
      const un = SALTS[source].untracked;
      if (given > 0 && un) {
        unreachable.push(
          `${SALTS[source].name} : ${given} g apportent aussi ${Math.round(
            (un.ppmPerGramPerLitre * given) / totalWaterL
          )} ppm de ${un.label}, que le calcul ne suit pas. ${SALTS[source].caution ?? ''}`.trim()
        );
      }
    };

    // Vers la CIBLE : le chlorure de calcium, sinon ce qui reste.
    const primary = first('cacl2', 'mgcl2', 'kcl');
    if (primary) applyChloride(primary, clWanted);

    /*
     * Vers le MINIMUM seulement, avec les sels de second rang. Viser le milieu
     * de fourchette avec eux mettait 1.2 g de sel de table dans une Pils sur
     * eau de Fribourg : un brasseur préfère un chlorure un peu court à une
     * lager salée.
     *
     * ⚠️ LE KCl ENTRE EN DERNIER, sous le plafond de son potassium.
     *
     * Il était exclu D'OFFICE, au motif que « beaucoup de brasseurs l'écartent »
     * et que le potassium se goûte au-delà de 50 ppm. Gaëtan : « je comprends
     * pas pourquoi ce sel assez banal est exclus ». En chiffrant son cas, la
     * raison ne tient pas : sur son Kölsch il manquait 17 ppm de chlorure, soit
     * 1.11 g de KCl sur 31 L — 18.7 ppm de potassium, pour un seuil à 50. On
     * peut monter jusqu'à 45 ppm de chlorure avant de l'atteindre.
     *
     * Le garde-fou était donc un SEUIL, et le code en avait fait un INTERDIT.
     * `capFlavour` plafonne maintenant l'ion non suivi comme il plafonne les
     * autres : le KCl s'arrête tout seul avant que le potassium se goûte, et
     * n'a plus besoin d'être banni.
     *
     * Il reste servi en DERNIER — après le chlorure de magnésium et le sel de
     * table — parce qu'il demeure le moins courant des trois, et son potassium
     * est annoncé par le mécanisme `untracked`. Qui n'en veut pas l'éteint.
     */
    /*
     * ⚠️ LE KCl PASSE EN TÊTE DES REMPLAÇANTS, ET IL VISE LA CIBLE.
     *
     * Signalé ainsi : « le KCl semble toujours pas toujours être ajouté ».
     * Mesuré sur les 29 styles × 5 eaux : il n'entrait QUE si le chlorure de
     * calcium ET le chlorure de magnésium étaient éteints tous les deux. Sur le
     * Kölsch de Fribourg, tous sels allumés, il sortait à 0.5 g — pendant que le
     * MgCl₂ était poussé à 15 ppm de magnésium, le plafond du style, pour aller
     * chercher du chlorure.
     *
     * Deux règles se retournaient contre lui, et aucune n'était écrite pour lui.
     *
     * 1. **L'ORDRE.** Il venait après le magnésium et le sodium au motif qu'il
     *    est « le moins courant des trois ». C'est un argument d'habitude, pas
     *    de chimie : de ces trois passagers, le potassium est le seul que le
     *    malt fournit déjà par centaines de ppm au moût, et le seul dont
     *    l'apport par l'eau soit négligeable devant lui. Le solveur saturait
     *    donc un ion QU'ON GOÛTE — le magnésium devient amer — avant de toucher
     *    celui qu'on ne goûte pas. C'est l'inverse qu'il faut faire.
     *
     * 2. **LE PLANCHER RESTE.** J'ai essayé de le lever pour lui — viser la
     *    cible plutôt que le minimum, au motif que son plafond de 50 ppm le
     *    borne déjà. Mesuré, c'est pire : sur une stout irlandaise depuis
     *    Fribourg, le plan passait à SIX sels, dont 0.3 g de sel de table et
     *    0.2 g de bicarbonate. Le KCl butait sur son potassium à mi-chemin, et
     *    les suivants venaient chacun gratter le reste. Le plancher n'était
     *    donc pas seulement une prudence sur le sodium : c'est lui qui empêche
     *    la liste de courses de se morceler. Personne ne pèse six sels pour une
     *    stout.
     *
     * Le sel de table reste en dernier : c'est le plus goûté des trois, et il
     * ne sert que les styles qui l'accueillent.
     */
    (['kcl', 'mgcl2', 'nacl'] as SaltId[]).forEach((source) => {
      if (off.has(source) || source === primary) return;
      // Le sel de table ne complète que les styles qui ACCUEILLENT le sodium
      // (noires, rondes, sans-alcool, Gose) : jamais une Pils ni une Kölsch.
      if (source === 'nacl' && rangeMin('na') < 10) return;
      /*
       * ⚠️ ET LE MAGNÉSIUM NE MONTE PAS AU-DELÀ DU PLANCHER POUR PORTER DU
       * CHLORURE.
       *
       * C'est la règle que le fichier applique déjà au sodium et au sel
       * d'Epsom — « le magnésium ne vise que le PLANCHER du style » —, et le
       * chlorure de magnésium y échappait : `capFlavour` ne le bornait qu'au
       * MAXIMUM. Sur le Kölsch de Fribourg, il montait donc à 15 ppm de
       * magnésium, le plafond du style, uniquement pour transporter du
       * chlorure, alors que le KCl attendait derrière avec un passager que
       * personne ne goûte. Le magnésium de l'eau n'est pas un besoin : le malt
       * en apporte déjà de quoi nourrir la levure.
       */
      let toFloor = rangeMin('cl') - running.cl;
      if (source === 'mgcl2') {
        const mg = saltIons('mgcl2');
        // Le chlorure que porte le magnésium encore disponible jusqu'au plancher.
        const porte = Math.max(0, rangeMin('mg') - running.mg) * (mg.cl! / mg.mg!);
        toFloor = Math.min(toFloor, porte);
      }
      if (toFloor <= 3) return;
      // Sous un demi-gramme (plafond compris), ça ne se pèse pas et ça ne se goûte pas.
      applyChloride(source, toFloor, 0.5);
    });

    const belowFloor = rangeMin('cl') - running.cl;
    if (!primary && clWanted > 10) {
      unreachable.push(
        `Chlorure : +${Math.round(clWanted)} ppm hors d’atteinte (tous les chlorures écartés).`
      );
    } else if (belowFloor > 10) {
      unreachable.push(
        `Chlorure : ${Math.round(belowFloor)} ppm sous le minimum du style — calcium, magnésium et sodium sont au plafond. Coupe l’eau à l’osmosée pour faire de la place.`
      );
    }
  }

  /*
   * 3. PLANCHER DE CALCIUM.
   *
   * ⚠️ Le calcium n'était JAMAIS une cible : il n'arrivait qu'en sous-produit
   * du gypse et du chlorure de calcium, et le solveur ne signalait que les
   * excès, jamais les manques. Une Imperial Stout depuis l'osmosée sortait à
   * 71 ppm pour 120 visés, sans un mot. Le calcium fait floculer la levure,
   * précipite les oxalates et entre directement dans l'alcalinité résiduelle.
   *
   * On complète au rapport SO₄:Cl voulu, pour ne pas déplacer le goût en
   * corrigeant la minéralité. Part du calcium à faire venir du gypse :
   *
   *   f = (Cl/Ca)·r / [ (SO₄/Ca) + (Cl/Ca)·r ]
   */
  /*
   * ⚠️ LA CIBLE, PLUS LE PLANCHER.
   *
   * Tant que le magnésium et le sodium n’entraient pas, le calcium arrivait à
   * sa cible tout seul : c’est le gypse et le CaCl₂ qui portaient tout le
   * sulfate et tout le chlorure, et leur calcium venait avec. Cette étape-ci
   * ne servait donc que de filet, et viser le plancher suffisait.
   *
   * Dès que l’Epsom, le MgCl₂ et le sel de table prennent leur part des
   * anions, le gypse et le CaCl₂ en versent moins — et le calcium tombait à
   * 0.39 de sa fourchette, avec 81 plans au plancher. Le filet doit donc viser
   * ce qu’on veut vraiment : la cible. Le calcium est le seul de ces ions qui
   * soit FONCTIONNEL — sous 40 ppm la levure floconne mal — et il ne se
   * sacrifie pas pour loger les autres.
   */
  const caFloor = rangeMin('ca');
  if (running.ca < caFloor) {
    /*
     * On vise 2 ppm AU-DESSUS du plancher. La dose est tronquée au dixième de
     * gramme et la répartition empâtage/rinçage arrondit une seconde fois :
     * viser le plancher pile laissait le calcium un cheveu en dessous, et le
     * message d'alerte partait pour un écart de 1 ppm. Le plafond de la
     * fourchette borne ce dépassement volontaire comme n'importe quel autre.
     */
    const missing = caFloor + 2 - running.ca;
    const gypseOk = !off.has('gypse');
    const cacl2Ok = !off.has('cacl2');

    if (!gypseOk && !cacl2Ok) {
      unreachable.push(
        `Calcium : ${Math.round(running.ca)} ppm, il en faut au moins ${caFloor} — gypse et chlorure de calcium tous deux écartés.`
      );
    } else {
      const r = input.ratio ?? (target.cl > 0 ? target.so4 / target.cl : 1);
      const so4PerCa = saltIons('gypse').so4! / saltIons('gypse').ca!;
      const clPerCa = saltIons('cacl2').cl! / saltIons('cacl2').ca!;
      let fGypse = (clPerCa * r) / (so4PerCa + clPerCa * r);
      if (!gypseOk) fGypse = 0;
      if (!cacl2Ok) fGypse = 1;

      if (gypseOk && fGypse > 0) {
        const g = (missing * fGypse * totalWaterL) / saltIons('gypse').ca!;
        applyFlavour('gypse', capFlavour('gypse', g));
      }
      if (cacl2Ok && fGypse < 1) {
        const g = (missing * (1 - fGypse) * totalWaterL) / saltIons('cacl2').ca!;
        applyFlavour('cacl2', capFlavour('cacl2', g));
      }
    }
  }


  /*
   * 4. MAGNÉSIUM, jusqu'au plancher du style.
   *
   * Les deux sels qui l'apportent traînent autre chose : l'Epsom du sulfate, le
   * MgCl₂ du chlorure. On retient celui qui peut en livrer le plus sans sortir
   * de la fourchette, et on dit ce qui manque — sans dramatiser : le malt
   * apporte déjà l'essentiel du magnésium du moût.
   */
  /*
   * ⚠️ CETTE LIGNE NE PART JAMAIS, ET C'EST VOULU — pour l'instant.
   *
   * `rangeMin('mg')` vaut ZÉRO dans les VINGT-NEUF styles sans exception :
   * `mg: R(0, …)` partout. Le besoin sort donc toujours à zéro, et l'étape
   * entière est inerte. Mesuré sur 261 plans (29 styles × 3 eaux × 3 taux
   * d'osmosée) : zéro plan reçoit du magnésium.
   *
   * Gaëtan l'a vu — « le solveur n'ajoute quasiment jamais de magnésium, on
   * devrait viser un profil cohérent et dans la moyenne, pas le minimum de
   * chaque ion » — et le constat est juste. Le reste du profil, lui, est déjà
   * centré : Ca 0.57, SO₄ 0.56, Na 0.50, Cl 0.37 de leur fourchette.
   *
   * MAIS ON NE MONTE PAS LE MAGNÉSIUM SANS MONTER LE SULFATE OU LE CHLORURE :
   * il n'entre que par l'Epsom ou le MgCl₂. Quatre configurations ont été
   * essayées et mesurées, aucune n'est gratuite :
   *
   *   configuration                 Ca    Mg    Na   SO₄    Cl   ce qui cède
   *   celle-ci                    0.57  0.15  0.50  0.56  0.37   Mg et Na à 0
   *   Mg au milieu, Ca au plancher 0.40  0.49  0.50  0.57  0.44   le calcium
   *   + sodium dosé en amont       0.44  0.49  0.55  0.64  0.49   le calcium
   *   + calcium à sa cible         0.73  0.49  0.57  0.83  0.72   le sulfate
   *
   * La dernière pousse le sulfate à 0.96 de médiane, au ras du plafond, et la
   * troisième fait osciller le choix chaux/bicarbonate entre 46 et 48 %
   * d'osmosée — une instabilité qui reste à corriger avant d'y toucher.
   *
   * Arbitrage de Gaëtan le 06.09.2026 : on ne change rien pour l'instant, on y
   * revient après un brassin. Le jour où l'on tranche, c'est ICI que ça se
   * joue : viser `target.mg` — le milieu — au lieu du plancher.
   */
  const mgNeeded = Math.max(0, Math.min(target.mg, rangeMin('mg')) - running.mg);
  if (mgNeeded > 1) {
    const epsomOk = !off.has('epsom');
    const mgcl2Ok = !off.has('mgcl2');
    if (!epsomOk && !mgcl2Ok) {
      unreachable.push(
        `Magnésium : +${Math.round(mgNeeded)} ppm hors d’atteinte (Epsom et chlorure de magnésium écartés).`
      );
    } else {
      /*
       * ⚠️ Le choix se faisait « au sel qui tient le plus de GRAMMES sous le
       * plafond » — donc presque toujours l'Epsom, qui en demande davantage
       * par ppm de magnésium — et l'ion accompagnateur montait jusqu'au maximum
       * du style. Sur une eau équilibrée depuis l'osmosée, le curseur demandait
       * SO₄:Cl 1.05 et le moût sortait à 1.53 : le magnésium défaisait la
       * commande de goût que le brasseur venait de donner.
       *
       * On répartit donc les deux sels au rapport voulu, exactement comme le
       * plancher de calcium (étape 4) : f_epsom = (Cl/Mg)·r / [(SO₄/Mg) + (Cl/Mg)·r].
       * Le plafond du style borne toujours chacun.
       */
      const r = input.ratio ?? (target.cl > 0 ? target.so4 / target.cl : 1);
      const so4PerMg = saltIons('epsom').so4! / saltIons('epsom').mg!;
      const clPerMg = saltIons('mgcl2').cl! / saltIons('mgcl2').mg!;
      let fEpsom = (clPerMg * r) / (so4PerMg + clPerMg * r);
      if (!epsomOk) fEpsom = 0;
      if (!mgcl2Ok) fEpsom = 1;

      /*
       * ⚠️ LE MAGNÉSIUM PREND LE JEU QUI RESTE, IL N'EN CRÉE PAS.
       *
       * Il n'entre jamais seul : l'Epsom traîne du sulfate, le MgCl₂ du
       * chlorure. Les borner au PLAFOND du style — ce que fait `capFlavour` —
       * ne suffit pas, parce que le sulfate et le chlorure ont déjà atteint
       * leur CIBLE aux étapes 1 et 2 : tout ce que le magnésium ajoute par
       * dessus est un dépassement de la commande de goût. Mesuré : le sulfate
       * passait de 0.56 à 0.73 de sa fourchette, un quart de plage de plus,
       * sur des styles où l'on cherche justement à le tenir bas.
       *
       * J'ai d'abord essayé de doser le magnésium AVANT le sulfate et le
       * chlorure. Le sulfate revenait à 0.57, mais le calcium tombait de 0.57
       * à 0.39 — les sels de magnésium consommaient le budget d'anions dont le
       * gypse et le CaCl₂ ont besoin pour porter leur calcium. Or le calcium
       * est le seul de ces ions qui soit FONCTIONNEL : la levure floculle mal
       * en dessous de 40 ppm. Il ne se sacrifie pas au profit d'un ion que le
       * malt fournit déjà.
       *
       * J'ai aussi essayé de le borner au JEU restant — l'écart entre le
       * sulfate atteint et sa cible. Le jeu est nul par construction, puisque
       * les étapes 1 et 2 viennent d'atteindre cette cible : le magnésium
       * retombait à 3 plans sur 261, c'est-à-dire à rien.
       *
       * ⚠️ CE QUI TRANCHE : la répartition se fait AU RAPPORT DEMANDÉ. Le
       * sulfate et le chlorure montent donc ENSEMBLE, dans la proportion que
       * le brasseur vient de régler — la balance ne bouge pas, seul le niveau
       * minéral monte. Mesuré : sulfate 0.56 → 0.73, chlorure 0.37 → 0.58, et
       * le rapport SO₄:Cl inchangé. Le chlorure, qui traînait au bas de sa
       * fourchette, s'en trouve mieux centré qu'avant.
       *
       * Un niveau minéral plus haut, à balance constante, tous les ions dans
       * leur fourchette : c'est exactement ce qui était demandé — « un profil
       * cohérent et dans la moyenne, pas juste le minimum de chaque ion ». Le
       * plafond du style reste la seule borne, et c'est `capFlavour` qui le
       * tient.
       */
      /*
       * ⚠️ ET L'EPSOM NE DÉPASSE PAS LA CIBLE DE SULFATE — lui seul.
       *
       * Sans cette borne, une brune sortait à 94 ppm de sulfate : le magnésium
       * y arrivait par l'Epsom, qui traîne du sulfate, et le plafond du style
       * (large) le laissait passer. C'est l'erreur que ce fichier nomme en
       * en-tête comme « la plus fréquente des calculateurs : du gypse dans une
       * stout ».
       *
       * L'asymétrie avec le chlorure est voulue, et elle est celle du goût :
       * un excès de sulfate durcit et assèche — il se remarque tout de suite
       * sur une noire ou une blanche ; un excès de chlorure arrondit, et la
       * fourchette du style suffit à le tenir. On borne donc l'un à sa CIBLE
       * et l'autre à son PLAFOND.
       */
      /*
       * ⚠️ ON CHERCHE D'ABORD CE QUE LA BALANCE AUTORISE, ON DOSE ENSUITE.
       *
       * Première version : borner l'Epsom au sulfate visé et laisser le MgCl₂
       * aller à son plafond. Le sulfate restait sage, mais le rapport SO₄:Cl
       * glissait de 1.04 à 0.87 — 16 % vers le chlorure. C'est précisément le
       * réglage que le brasseur vient de faire au curseur : il ne se déplace
       * pas pour loger un ion que le malt fournit déjà.
       *
       * On calcule donc combien de magnésium CHAQUE côté peut porter, on en
       * déduit le magnésium possible EN GARDANT LA PROPORTION, et on dose les
       * deux sels à ce niveau-là. Le côté qui sature le premier commande, et le
       * rapport reste exactement celui qui a été demandé.
       */
      if (epsomOk && fEpsom > 0) {
        const g = (mgNeeded * fEpsom * totalWaterL) / saltIons('epsom').mg!;
        applyFlavour('epsom', capFlavour('epsom', g));
      }
      if (mgcl2Ok && fEpsom < 1) {
        const g = (mgNeeded * (1 - fEpsom) * totalWaterL) / saltIons('mgcl2').mg!;
        applyFlavour('mgcl2', capFlavour('mgcl2', g));
      }
      const left = Math.max(0, Math.min(target.mg, rangeMin('mg')) - running.mg);
      if (left > 3) {
        unreachable.push(
          `Magnésium : ${Math.round(left)} ppm de moins que visé — en ajouter ferait sortir le sulfate ou le chlorure de la fourchette. Sans gravité : le malt en apporte l’essentiel.`
        );
      }
    }
  }

  /*
   * 5. ALCALINITÉ — pilotée par la couleur, sur l'eau d'EMPÂTAGE seule.
   *
   * ⚠️ Deux corrections. Le sodium du bicarbonate n'était jamais confronté à sa
   * cible : une impériale sortait à 116 ppm pour 50 visés. Et la dose partait
   * sur le volume TOTAL, donc au rinçage aussi — où `spargeAcidNeeded`
   * calculait ensuite l'acide pour détruire l'alcalinité qu'on venait d'y
   * verser. Deux produits achetés et pesés pour s'annuler.
   *
   * La dose tient compte de l'effet croisé : le calcium de la craie et de la
   * chaux annule une partie de l'alcalinité qu'elles apportent. C'est
   * `netRaPerGramPerLitre` qui le chiffre — 964 ppm d'AR par g/L pour la chaux,
   * 596 pour le bicarbonate, 357 pour la craie à sa solubilité réelle.
   */
  const band = input.targetRa;
  if (band) {
    const ra = residualAlkalinity(currentMash());
    /*
     * ⚠️ La facture PLAFONNE la couleur. Une bande « bière noire » réclamait
     * 120 ppm d'AR à une stout ordinaire qui, d'après sa propre facture, n'en
     * voulait aucun : 4.3 g de chaux et un pH prédit à 5.71. La couleur ne
     * sait pas si le noir vient de 3 % de malt noir ou de 25 % de torréfié.
     * On verse des sels jusqu'au plus bas des deux, jamais au-delà.
     */
    /*
     * ⚠️ LE PLAFOND EST BORNÉ PAR SA PROPRE MARGE, ET PAR ZÉRO.
     *
     * Signalé ainsi : « pour une stout ou une impériale, avec de l'eau très
     * osmosée, Doser n'ajoute pas de HCO₃ ». Vérifié sur une facture de stout
     * irlandaise (4.2 kg de pale, 0.5 de torréfié, 0.6 de flocons) à 3.5 L/kg :
     *
     *   pH en eau distillée   5.56   →  plafond de facture  −103 ppm
     *   fenêtre de la couleur                                120 à 180 ppm
     *   ancienne cible = min(120, −103)                      −103 ppm
     *   AR après gypse et CaCl₂                               −91 ppm
     *
     * −91 était déjà « au-dessus » de −103 : le solveur n'avait rien à faire et
     * ne versait pas un gramme de bicarbonate, sans un mot, pendant que la
     * toile allumait l'alarme du HCO₃ à zéro pour une fenêtre 100–200.
     *
     * La correction n'est PAS dans le solveur : elle est dans ce qu'on lui
     * passe. `raCeiling` vaut désormais `raSaltCeilingForGrist`, qui vise le
     * HAUT de la fenêtre de pH au lieu de son milieu — « jusqu'où peut-on
     * suivre la couleur sans faire monter la maische trop haut ». Le même
     * `min` s'applique, mais sur un plafond qui veut dire ce qu'il faut :
     * la stout irlandaise passe de −103 à −39, l'impériale de −51 à +12, et
     * les deux reçoivent leur bicarbonate.
     *
     * ⚠️ ON NE PLANCHÉISE PAS À ZÉRO. Un plafond négatif n'est pas une
     * aberration à corriger : il dit que CETTE facture veut une eau à AR
     * négative — le calcium du gypse et du chlorure de calcium, déjà versés
     * pour le goût, la lui donnent. La forcer à zéro « pour que la toile soit
     * verte » ferait monter la maische au-dessus de 5.5 : c'est le pH qui
     * commande, pas la couleur.
     */
    const saltTarget =
      input.raCeiling != null && Number.isFinite(input.raCeiling)
        ? Math.min(band.min, input.raCeiling)
        : band.min;

    /*
     * ⚠️ ET ON LE DIT. C'est la moitié du défaut signalé — l'autre moitié.
     *
     * Quand la facture retient l'alcalinité sous la fenêtre de la couleur, le
     * bicarbonate reste bas ; la toile, elle, allume son alarme, parce qu'elle
     * compare au STYLE. Le brasseur voit donc un axe en alerte, appuie sur
     * Doser pour le corriger, et il ne se passe rien. Le calcul était
     * défendable, le silence ne l'était pas : un écart visible sans raison
     * visible se lit comme une panne.
     */
    if (band.max > 0 && saltTarget < band.min - 5) {
      unreachable.push(
        `Alcalinité tenue à ${saltTarget} ppm au lieu des ${band.min} que demanderait la couleur : au-delà, TA facture ferait monter la maische au-dessus de pH ${MASH_PH_BAND.max}. Le HCO₃ restera donc sous la fourchette du style — c’est le pH qui commande, pas la teinte. Mesure-le à l’empâtage (±${MASH_PH_UNCERTAINTY} sur l’estimation).`
      );
    }
    /*
     * ⚠️ ON N'ACHÈTE PAS D'ALCALINITÉ POUR ATTEINDRE UNE CIBLE NÉGATIVE.
     *
     * Une IPA depuis l'osmosée avec 165 ppm de calcium tombe à −100 d'AR : le
     * solveur y versait 1.8 g de chaux « pour remonter à −60 ». Aucun brasseur
     * ne fait ça — une maische pâle à pH 5.3 se corrige, s'il le faut, en
     * retirant du calcium, pas en achetant de l'alcalinité.
     *
     * ⚠️ La règle s'énonçait « fenêtre pâle », c'est-à-dire `band.max <= 0` :
     * elle lisait l'ÉTIQUETTE de la classe de couleur. Depuis que la fenêtre
     * glisse continûment, cette lecture-là basculerait à 6 EBC au lieu de 12 —
     * on remplacerait une marche par une autre. Le vrai critère n'a jamais été
     * la teinte : c'est le SIGNE du plancher demandé. Tant qu'il est négatif,
     * il n'y a rien à acheter ; c'est le travail de l'acide, à l'étape d'après.
     *
     * Et c'est bien `band.min`, PAS `saltTarget`. Le second porte déjà le
     * plafond de la facture, qui est souvent négatif sur une bière noire — une
     * stout irlandaise sort à −39. Le lire ici rendrait exactement le défaut
     * qu'on vient de corriger : plus un gramme de bicarbonate sur une stout.
     * Le plancher dit ce que la bière DEMANDE ; le plafond dit jusqu'où on peut
     * le suivre. Deux questions, deux nombres.
     *
     * La transition est continue : à 21 EBC le plancher vaut 0, et le premier
     * sel alcalin ne sert donc à monter que jusqu'à 0. Rien ne saute.
     */
    if (band.min >= 0 && ra < saltTarget - 5) {
      // La craie n'entre en lice que si la chaux est écartée : Brungard la
      // tient pour « contributeur d'alcalinité peu fiable », à éviter.
      const candidates = (['nahco3', 'chaux', 'caco3'] as SaltId[]).filter(
        (id) => !off.has(id) && (id !== 'caco3' || off.has('chaux'))
      );

      if (candidates.length === 0) {
        unreachable.push(
          `Alcalinité : +${Math.round(saltTarget - ra)} ppm d’AR hors d’atteinte (sels alcalins écartés).`
        );
      } else {
        /*
         * On sert le sel le plus efficace d'abord, puis on COMPLÈTE avec les
         * autres. Chacun bute sur un ion différent — la chaux sur le calcium,
         * le bicarbonate sur le sodium — et s'arrêter au premier laissait une
         * impériale 36 ppm sous sa fenêtre alors que le second avait encore de
         * la marge.
         */
        const used = new Set<SaltId>();
        for (let pass = 0; pass < candidates.length; pass += 1) {
          const gap = saltTarget - residualAlkalinity(currentMash());
          // Un deuxième sel ne se pèse que si l'écart le mérite encore.
          if (gap <= (pass === 0 ? 0 : 5)) break;

          let best: SaltId | undefined;
          let bestGrams = 0;
          let bestRa = 0;
          candidates
            .filter((id) => !used.has(id))
            .forEach((id) => {
              const perGram = netRaPerGramPerLitre(id);
              if (perGram <= 0) return;
              let usable = capAlkaline(id, (gap * mashL) / perGram);
              /*
               * ⚠️ Craie : Brungard constate qu'elle ne remonte le pH que de
               * 0.1 à 0.2, quelle que soit la dose, même dans la maische.
               * Sa demi-solubilité n'est qu'une convention ; on plafonne ce
               * qu'on lui prête à ~75 ppm d'AR (≈ +0.15 pH à 3.5 L/kg).
               */
              if (id === 'caco3') usable = Math.min(usable, (CHALK_RA_CAP_PPM * mashL) / perGram);
              const delivered = (usable * perGram) / mashL;
              if (delivered > bestRa) {
                bestRa = delivered;
                bestGrams = usable;
                best = id;
              }
            });

          /*
           * ⚠️ LE DIXIÈME DE GRAMME EST UNE EXCEPTION DE LA CHAUX, PAS UNE
           * RÈGLE GÉNÉRALE.
           *
           * La règle disait « un premier sel se pèse dès 0.1 g » pour tous, en
           * s'appuyant sur un chiffre qui ne vaut que pour la chaux : 0.1 g de
           * chaux, c'est bien 5 ppm d'AR. Le même dixième de gramme de
           * bicarbonate en vaut 3, et de craie 1.8 — autant dire rien. Le
           * balayage l'a attrapé sur une stout irlandaise : 0.3 g de
           * bicarbonate, soit 9 ppm d'AR, soit 0.014 pH. Personne ne sort une
           * balance pour ça, et la ligne apparaissait quand même sur la fiche
           * de pesée.
           *
           * Le demi-gramme redevient donc la règle, et la chaux garde son
           * dixième — c'est le seul sel assez concentré pour le mériter.
           */
          if (!best || bestGrams < (best === 'chaux' ? 0.1 : 0.5)) break;
          used.add(best);
          applyAlkaline(best, bestGrams);
        }

        const left = saltTarget - residualAlkalinity(currentMash());
        if (left > 10) {
          unreachable.push(
            `Alcalinité résiduelle : ${Math.round(left)} ppm sous la fenêtre — en remonter davantage ferait sortir le sodium ou le calcium de la fourchette. Diminue la part d’osmosée, ou accepte un pH de maische un peu bas.`
          );
        }
      }
    } else if (ra > band.max + 5) {
      unreachable.push(
        `Alcalinité résiduelle à ${Math.round(ra)} ppm pour une ${band.label} — vise ${band.min} à ${band.max}. À traiter à l’acide, pas au sel.`
      );
    }
  }

  /*
   * 6. SODIUM, en dernier et jusqu'au plancher seulement — le bicarbonate en
   *    a peut-être déjà apporté assez. Le sel de table traîne du chlorure :
   *    `capFlavour` le retient sous le maximum du style.
   */
  if (!saltIsTheRecipe) doseSodium();

  /*
   * 7. Ce qui reste hors fourchette.
   *
   * ⚠️ Le message d'excès accusait la source même quand c'était le solveur qui
   * avait causé le dépassement — « seule l'osmosée peut faire baisser » sur une
   * eau de départ QUI ÉTAIT DÉJÀ de l'osmosée pure. On distingue désormais les
   * deux cas, et le plafonnement rend le second presque impossible.
   *
   * ⚠️ Le seuil d'alerte était `max(20, cible × 0.5)` : sur une Pils visant
   * 5 ppm de sulfate, rien ne s'affichait avant 25 ppm, cinq fois la cible.
   * C'est la fourchette du style qui tranche maintenant, pas un pourcentage.
   */
  /*
   * Tolérance de 2 ppm : les doses sont tronquées au dixième de gramme, puis
   * réparties entre les deux eaux avec un second arrondi au dixième. Un
   * dixième de gramme de gypse dans 20 L pèse déjà 1.4 ppm de sulfate. En
   * dessous de 2 ppm, on parle du bruit de la balance, pas d'un écart de
   * brassage.
   */
  /*
   * ⚠️ LES MIETTES S'EN VONT — une seule fois, à la fin, sur le plan complet.
   *
   * Trouvé au balayage large : sur 435 plans, huit portaient une pesée
   * impossible — 0.1 g de gypse, 0.2 à 0.4 g de chlorure de calcium. Aucune
   * balance de brasserie ne les distingue de zéro, et 0.1 g de gypse dans 30 L
   * pèse 1.9 ppm de sulfate : c'est le bruit de la mesure, pas un geste.
   *
   * La règle existait déjà — mais à QUATRE endroits (les chlorures de second
   * rang, le sel de table, les sels alcalins), chacun avec sa formulation, et
   * elle manquait aux deux sels les plus employés. Quatre copies d'une règle
   * finissent toujours par diverger : celle-ci diverge en laissant passer.
   *
   * Elle vit donc ici, en un seul endroit, APRÈS le dernier dosage. C'est le
   * seul point où la dose FINALE est connue : le gypse est versé en deux fois
   * (le sulfate, puis le rééquilibrage SO₄ ⇄ Cl), et un plancher posé à chaque
   * appel interdirait un complément de 0.3 g sur une dose de 3 g qui, elle, se
   * pèse très bien.
   *
   * On RETIRE plutôt qu'on arrondit vers le haut : verser moins que demandé est
   * une erreur plus petite que verser plus, et les messages de l'étape suivante
   * diront ce qui manque encore.
   */
  const MIN_PESEE_G = 0.5;
  /* La chaux fait exception : 0.1 g pèse déjà 5 ppm d'alcalinité résiduelle. */
  const MIN_PESEE_PAR_SEL: Partial<Record<SaltId, number>> = { chaux: 0.1 };
  SALT_IDS.forEach((id) => {
    const g = doses[id] ?? 0;
    if (g <= 0 || g >= (MIN_PESEE_PAR_SEL[id] ?? MIN_PESEE_G)) return;
    delete doses[id];
    /* Un sel alcalin ne va qu'à l'empâtage : on défait où l'on avait fait. */
    const alcalin = ALKALINE_SALTS.includes(id);
    const panneau = alcalin ? mashExtra : running;
    const litres = alcalin ? mashL : totalWaterL;
    const ions = saltIons(id);
    (Object.keys(ions) as Array<keyof WaterIons>).forEach((ion) => {
      panneau[ion] = round1(panneau[ion] - ((ions[ion] ?? 0) * g) / litres);
    });
  });

  const NOISE_PPM = 2;
  /* ⚠️ Le MOÛT, pas la maische : c'est la bière que le style décrit. */
  const finalWort = currentWort();
  (['so4', 'cl', 'na', 'ca', 'mg'] as Array<keyof WaterIons>).forEach((ion) => {
    const value = finalWort[ion];
    const max = rangeMax(ion);
    if (value > max + NOISE_PPM) {
      unreachable.push(
        startWort[ion] > max
          ? `${ION_LABEL[ion]} : ${Math.round(value)} ppm contre ${max} au maximum du style — l’eau de départ en apporte déjà ${Math.round(startWort[ion])}. Seule l’osmosée peut faire baisser.`
          : `${ION_LABEL[ion]} : ${Math.round(value)} ppm, au-dessus du maximum de ${max} du style.`
      );
    }
  });

  /*
   * Le calcium est le seul ion dont le MANQUE se dit toujours : il est
   * fonctionnel, là où le magnésium ou le sodium ne sont qu'affaire de goût.
   * Une seule fois, cela dit — l'étape 4 a pu déjà en nommer la cause, et trois
   * lignes disant la même chose se lisent comme du bruit.
   */
  if (
    finalWort.ca < rangeMin('ca') - NOISE_PPM &&
    !unreachable.some((m) => m.startsWith('Calcium'))
  ) {
    unreachable.push(
      `Calcium : ${Math.round(finalWort.ca)} ppm pour un minimum de ${rangeMin('ca')} — sous 40 ppm la levure floconne mal et les oxalates restent en solution.`
    );
  }

  /*
   * ⚠️ `allSaltsInMash` était oublié ici aussi : les deux eaux rendues par le
   * solveur décrivaient une répartition proportionnelle même quand tout partait
   * à l'empâtage. Elles ne servaient qu'aux contrôles, mais un chiffre juste
   * ailleurs et faux ici finit toujours par être lu.
   */
  const water = waterFromPlan(start, doses, input.mashWaterL, spargeL, startSparge, allInMash);

  return {
    doses,
    achievedMash: water.mash,
    achievedSparge: water.sparge,
    achievedWort: finalWort,
    unreachable
  };
}

/**
 * ⚠️ `hco3` se lit « ALCALINITÉ », pas « bicarbonate ».
 *
 * Le champ porte l'alcalinité totale exprimée en équivalent HCO₃⁻, et tous ses
 * contributeurs ne sont pas du bicarbonate : la craie compte 2 équivalents par
 * mole, et la chaux n'apporte aucun HCO₃⁻ du tout — elle apporte des OH⁻, qui
 * neutralisent l'acidité de la maische exactement pareil. Étiqueter la colonne
 * « Bicarbonate » était déjà approximatif pour la craie ; avec la chaux, ce
 * serait faux.
 */
export const ION_LABEL: Record<keyof WaterIons, string> = {
  ca: 'Calcium',
  mg: 'Magnésium',
  na: 'Sodium',
  so4: 'Sulfate',
  cl: 'Chlorure',
  hco3: 'Alcalinité'
};

/**
 * Le symbole chimique — celui qui est écrit sur le sac et sur l'analyse.
 *
 * ⚠️ Il vivait en double, dans la toile et dans le tableau de comparaison. Deux
 * listes de six chaînes qui doivent dire la même chose finissent par diverger.
 */
export const ION_SYMBOL: Record<keyof WaterIons, string> = {
  ca: 'Ca²⁺',
  mg: 'Mg²⁺',
  na: 'Na⁺',
  so4: 'SO₄²⁻',
  cl: 'Cl⁻',
  hco3: 'HCO₃⁻'
};

/**
 * Le même symbole SANS sa charge, pour les endroits où la place manque.
 *
 * ⚠️ Trouvé en testant à 320 px : dans un tiers d'écran, « SO₄²⁻ Ca²⁺ » se
 * coupait en « SO₄²⁻ C… » — on perdait le second ion du sel, c'est-à-dire la
 * moitié de l'information. Les exposants pèsent près d'un tiers de la largeur
 * et n'apprennent rien à qui lit une étiquette de sachet : « SO₄ Ca » désigne
 * exactement la même chose et tient.
 */
export const ION_SYMBOL_SHORT: Record<keyof WaterIons, string> = {
  ca: 'Ca',
  mg: 'Mg',
  na: 'Na',
  so4: 'SO₄',
  cl: 'Cl',
  hco3: 'HCO₃'
};

/**
 * Ce qu'un ion fait VRAIMENT, tout seul.
 *
 * ⚠️ CORRIGÉ. La première version collait un goût à chaque axe — « houblon »
 * sur le sulfate, « rondeur » sur le chlorure. C'est faux, et Gaëtan l'a relevé
 * tout de suite : aucun de ces deux ions ne se goûte seul. Ce qui se goûte,
 * c'est leur RAPPORT, et il a déjà son propre curseur. Écrire « houblon » sous
 * 43 ppm de sulfate laissait croire qu'en monter ferait une bière plus
 * houblonnée, alors que doubler les deux ensemble ne déplace rien du tout.
 *
 * Ce qui reste ici, ce sont les faits qui tiennent debout ion par ion : un
 * SEUIL, ou une fonction. Le calcium fait floculer et fait baisser le pH ; le
 * sodium se goûte passé 150 ppm ; le magnésium nourrit la levure et tourne amer
 * passé 30. Le sulfate et le chlorure, eux, renvoient au curseur.
 */
export const ION_ROLE: Record<keyof WaterIons, string> = {
  ca: 'levure, pH — mini 40',
  mg: 'nutriment — amer > 30',
  na: 'se goûte > 150',
  so4: 'sec — avec le Cl',
  cl: 'rond — avec le SO₄',
  hco3: 'remonte le pH'
};

/**
 * L'échelle radiale de la toile : UNE SEULE, en ppm, partagée par les six axes.
 *
 * ⚠️ TROISIÈME ET DERNIÈRE VERSION. Les deux précédentes se trompaient de
 * question :
 *
 *   1. Six maxima FIXES (400 ppm de sulfate, 300 de calcium) taillés pour les
 *      cas extrêmes : toute bière normale se recroquevillait dans le tiers
 *      central du disque.
 *   2. Un axe normalisé PAR STYLE, le maximum de chaque fourchette tombant aux
 *      70 % du rayon. La forme remplissait enfin le disque — mais les six
 *      quartiers verts devenaient identiques et occupaient chacun les
 *      deux tiers de leur secteur. Gaëtan : « les zones vertes semblent
 *      immenses ». Elles ne disaient plus rien : normalisée, une fenêtre de
 *      15 ppm de magnésium a exactement la même taille qu'une de 200 ppm de
 *      chlorure.
 *
 * Une échelle COMMUNE rend au vert son information : la fenêtre du magnésium
 * est un mince liseré près du centre, celle du chlorure une large bande. C'est
 * la vérité — ces ions ne vivent pas aux mêmes concentrations —, et c'est le
 * choix de moneaudebrassage, dont Gaëtan préfère la lecture.
 *
 * Ce qu'on fait MIEUX qu'eux : leur échelle s'arrête à 200 et tout ce qui
 * dépasse sort du cadre — leur propre capture montre une eau à 367 ppm de
 * bicarbonate dessinée hors du cercle. Ici l'échelle monte au multiple de 50
 * qui contient tout ce qu'on doit montrer. Rien ne sort jamais du disque.
 */
export function radarScaleMax(values: number[]): number {
  const plus = Math.max(0, ...values.filter((v) => Number.isFinite(v)));
  /*
   * ⚠️ PLAFONNÉE, et ce n'est pas de la coquetterie : le fuzz de saisie a fait
   * tomber l'écran sur « Invalid array length ». Taper 999999999999 dans une
   * dose de gypse donnait une concentration astronomique, donc une échelle
   * astronomique, donc une boucle d'anneaux de vingt milliards de tours.
   *
   * 2000 ppm : aucune eau de brassage n'en approche — Burton, la plus minérale
   * des eaux historiques, titre 610 ppm de sulfate. Au-delà, le plafonnement du
   * tracé et la flèche ▲ disent déjà la vérité, et le chiffre écrit au coin de
   * la toile la dit en entier.
   *
   * Plancher à 100 ppm : sous ça, les anneaux se toucheraient.
   */
  return Math.min(2000, Math.max(100, Math.ceil(plus / 50) * 50));
}

/**
 * Répartition des doses entre l'empâtage et le rinçage.
 *
 * ⚠️ Dans la plupart des brasseries, on ne dose pas de sels minéraux dans la
 * cuve d'eau de rinçage : tous les sels vont dans la maische (`allSaltsInMash: true`),
 * et le rinçage n'est ajusté qu'à l'acide.
 * Si `allSaltsInMash` est faux : les sels de saveur se répartissent au prorata des volumes,
 * et les sels ALCALINS vont entièrement à l'empâtage.
 */
export function splitDoses(
  doses: Partial<Record<SaltId, number>>,
  mashWaterL: number,
  spargeWaterL: number,
  /** ⚠️ VRAI par défaut : c'est la pratique recommandée, et ce que l'assistant enregistre. */
  allSaltsInMash: boolean = true
): { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> } {
  const total = mashWaterL + spargeWaterL;
  const mash: Partial<Record<SaltId, number>> = {};
  const sparge: Partial<Record<SaltId, number>> = {};
  if (total <= 0) return { mash, sparge };

  if (allSaltsInMash) {
    SALT_IDS.forEach((id) => {
      const g = doses[id];
      if (g && g > 0) {
        mash[id] = g;
      }
    });
    return { mash, sparge };
  }

  SALT_IDS.forEach((id) => {
    const g = doses[id];
    if (!g) return;
    if (isAlkaline(id)) {
      mash[id] = g;
      return;
    }
    const m = Math.round(g * (mashWaterL / total) * 10) / 10;
    mash[id] = m;
    const s = Math.round((g - m) * 10) / 10;
    if (s > 0) sparge[id] = s;
  });
  return { mash, sparge };
}

/**
 * Les deux eaux d'un plan : celle de l'empâtage et celle du rinçage.
 *
 * ⚠️ Ce ne sont pas deux fois la même. Les sels alcalins ne sont versés que
 * dans la première, et sur son seul volume. Tout ce qui lit une composition
 * d'eau passe par ici, pour qu'aucun écran ne calcule la sienne.
 *
 * ⚠️ `startSparge` : les deux eaux ne partent plus forcément du même point. On
 * coupe couramment le RINÇAGE à 90 % d'osmosée alors que l'empâtage reste sur
 * le réseau — c'est la façon la moins chère d'éviter l'astringence, et elle ne
 * coûte pas un millilitre d'acide. Absent, il vaut `start` : tous les appels
 * qui ne connaissent qu'une dilution restent justes.
 */
export function waterFromPlan(
  start: WaterIons,
  doses: Partial<Record<SaltId, number>>,
  mashWaterL: number,
  spargeWaterL: number,
  startSparge: WaterIons = start,
  /** ⚠️ VRAI par défaut — même convention que `splitDoses`. */
  allSaltsInMash: boolean = true
): { mash: WaterIons; sparge: WaterIons } {
  const total = mashWaterL + spargeWaterL;
  const { mash, sparge } = splitDoses(doses, mashWaterL, spargeWaterL, allSaltsInMash);
  return {
    mash: addIons(start, ionsFromSalts(mash, mashWaterL > 0 ? mashWaterL : total)),
    sparge: addIons(startSparge, ionsFromSalts(sparge, spargeWaterL))
  };
}

// --- Juste assez d'osmosée ----------------------------------------------------

export interface MinimalDilutionInput {
  source: WaterIons;
  target: WaterIons;
  ranges: Record<keyof WaterIons, IonBand>;
  totalWaterL: number;
  mashWaterL: number;
  spargeWaterL: number;
  targetRa: RaBand;
  raCeiling?: number | null;
  ratio?: number;
  disabled?: SaltId[];
  allSaltsInMash?: boolean;
  acid: AcidId;
  /** Litres de bière en cuve : c'est là que l'acide lactique se goûte. */
  beerVolumeL: number;
  sourcePh?: number;
}

export interface MinimalDilution {
  /** Part d'osmosée, en %, la même pour les deux eaux. */
  pct: number;
  /** Ce qui a imposé cette part. Vide : le réseau suffit tel quel. */
  reasons: string[];
  /**
   * Ce que l'acide neutralise ENCORE à cette part — le bicarbonate qui reste
   * n'est pas exempté, il est corrigé. Doses d'empâtage et de rinçage, dans
   * l'unité de l'acide choisi.
   */
  acid: { mash: number; sparge: number; unit: string; name: string; hco3Left: number };
}

/**
 * La part d'osmosée la plus BASSE qui permette encore d'atteindre le style.
 *
 * ⚠️ L'osmosée coûte cher, et « coupe à l'osmosée » était laissé au jugement :
 * on coupait à 50 % par habitude, ou à 100 % « pour être tranquille ». Or un
 * sel ne fait que MONTER une concentration : la seule raison de couper, c'est
 * un ion du réseau déjà AU-DESSUS du maximum du style — ou un acide lactique
 * qu'on goûterait. Rien d'autre. Sur une stout depuis Fribourg, c'est 0 %.
 *
 * On rejoue donc tout le calcul — dilution, sels, acides — de 0 à 100 % et on
 * s'arrête à la première part qui passe. Deux critères, et pas un de plus :
 *
 *   1. aucun ion du MOÛT au-dessus du maximum du style à cause du réseau ;
 *   2. l'acide lactique, empâtage et rinçage CUMULÉS, sous son seuil de
 *      perception — critère levé pour le phosphorique, qui ne se goûte pas.
 *
 * Le pas est de 5 % : on ne prépare pas 17.3 % d'osmosée dans un bidon.
 */
/** Bicarbonate qu'on accepte de neutraliser à l'acide au-delà du maximum du style, en ppm. */
export const HCO3_ACID_TOLERANCE_PPM = 100;

export function minimalDilution(input: MinimalDilutionInput): MinimalDilution {
  const total = input.totalWaterL;
  if (!total || !Number.isFinite(total) || total <= 0) {
    const def = ACIDS[input.acid];
    return { pct: 0, reasons: [], acid: { mash: 0, sparge: 0, unit: def.unit, name: def.name, hco3Left: 0 } };
  }

  const evaluate = (pct: number): string[] => {
    const start = dilute(input.source, pct);
    const solved = solveSalts({
      start,
      startSparge: start,
      target: input.target,
      ranges: input.ranges,
      totalWaterL: total,
      mashWaterL: input.mashWaterL,
      disabled: input.disabled,
      targetRa: input.targetRa,
      raCeiling: input.raCeiling,
      ratio: input.ratio,
      allSaltsInMash: input.allSaltsInMash
    });
    const reasons: string[] = [];

    (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>).forEach((ion) => {
      const max = input.ranges?.[ion]?.max;
      if (max == null || !Number.isFinite(max)) return;
      if (start[ion] > max + 2) {
        reasons.push(`${ION_LABEL[ion].toLowerCase()} du réseau à ${Math.round(input.source[ion])} ppm pour ${max} au maximum du style`);
      }
    });

    /*
     * ⚠️ Le bicarbonate compte AUSSI, dans la limite de ce que l'acide corrige
     * honnêtement. Sans ce critère, une Pils depuis Fribourg sortait à 0 %
     * d'osmosée au phosphorique : 250 ppm de bicarbonate « neutralisés », mais
     * l'anion de l'acide reste dans la bière (4 mmol/L de phosphate ou de
     * lactate), le calcium précipite en phosphate, et ce n'est plus une eau de
     * Pils. Au-delà de 100 ppm de HCO₃ au-dessus du maximum du style — ce que
     * n'importe quel brasseur corrige à l'acide sans y penser —, on coupe.
     * Sur une porter (max 180) ou une stout (250), Fribourg passe tel quel.
     */
    const hco3Max = input.ranges?.hco3?.max;
    if (hco3Max != null && Number.isFinite(hco3Max) && start.hco3 > hco3Max + HCO3_ACID_TOLERANCE_PPM) {
      reasons.push(
        `bicarbonate du réseau à ${Math.round(input.source.hco3)} ppm pour ${hco3Max} au maximum du style — l’acide n’en corrige raisonnablement que ${HCO3_ACID_TOLERANCE_PPM} de plus`
      );
    }

    if (input.acid === 'lactique' && input.beerVolumeL > 0) {
      const mash = acidNeeded(solved.achievedMash, input.mashWaterL, raAcidTarget(input.targetRa), 'lactique').amount;
      const sparge = spargeAcidNeeded(
        solved.achievedSparge,
        input.spargeWaterL,
        'lactique',
        SPARGE_TARGET_PH,
        input.sourcePh ?? 7.4
      ).amount;
      const lactate = lactateInBeer(mash + sparge, input.beerVolumeL);
      if (lactate > LACTATE_TASTE_THRESHOLD) {
        reasons.push(
          `acide lactique à ${lactate} g/L de bière (seuil ${LACTATE_TASTE_THRESHOLD}) — ou passe au phosphorique, qui ne se goûte pas`
        );
      }
    }
    return reasons;
  };

  /* Les doses d'acide à une part donnée : ce qui reste du bicarbonate y passe. */
  const acidAt = (pct: number): MinimalDilution['acid'] => {
    const start = dilute(input.source, pct);
    const solved = solveSalts({
      start,
      startSparge: start,
      target: input.target,
      ranges: input.ranges,
      totalWaterL: total,
      mashWaterL: input.mashWaterL,
      disabled: input.disabled,
      targetRa: input.targetRa,
      raCeiling: input.raCeiling,
      ratio: input.ratio,
      allSaltsInMash: input.allSaltsInMash
    });
    const mash = acidNeeded(solved.achievedMash, input.mashWaterL, raAcidTarget(input.targetRa), input.acid);
    const sparge = spargeAcidNeeded(
      solved.achievedSparge,
      input.spargeWaterL,
      input.acid,
      SPARGE_TARGET_PH,
      input.sourcePh ?? 7.4
    );
    return { mash: mash.amount, sparge: sparge.amount, unit: mash.unit, name: mash.name, hco3Left: start.hco3 };
  };

  const atZero = evaluate(0);
  if (atZero.length === 0) return { pct: 0, reasons: [], acid: acidAt(0) };

  for (let pct = 5; pct <= 100; pct += 5) {
    if (evaluate(pct).length === 0) return { pct, reasons: atZero, acid: acidAt(pct) };
  }
  return { pct: 100, reasons: atZero, acid: acidAt(100) };
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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
