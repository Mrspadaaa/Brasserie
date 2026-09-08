export type FinanceCategory = 
  | 'apports'
  | 'recettes'
  | 'brassage'
  | 'materiel'
  | 'nettoyage'
  | 'chargesFixes'
  | 'renovation'
  | 'divers';

export interface Transaction {
  id: string;
  date: string; // DD.MM.YYYY
  description: string;
  amountHT: number;
  tvaRate: number; // e.g. 0.026, 0.081, 0.0
  tvaAmount: number;
  amountTTC: number;
  category: FinanceCategory;
  subcategory: string;
  proofNotes?: string;
  proofUrl?: string; // Base64 data URL or Firebase Storage URL
  proofType?: string; // 'application/pdf', 'image/jpeg', etc.
  proofFileName?: string;
  syncedToDrive?: boolean;
  stockImpact?: Array<{
    itemRef: string;
    itemType: 'rawMaterials' | 'cleaning';
    itemName: string;
    addedQty: number;
    unit: string;
    previousStock: number;
    newStock: number;
  }>;
}

export interface StockItem {
  id: string;
  ref: string;
  name: string;
  category: string; // 'Malt', 'Houblon', 'Levure', 'Sucre', 'Emballage', 'CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent', 'Sols', 'EPI', 'Consommable'
  unit: string; // 'kg', 'g', 'sachet', 'L', 'boîte', 'rouleau'
  currentStock: number;
  minStock: number;
  maxStock?: number; // Maximum storage capacity (e.g. 50kg bag/silo)
  reorder: boolean;
  supplier?: string;
  /** Épinglé par Gaëtan : remonte en tête des listes, des autocomplétions et de la recherche. */
  favorite?: boolean;
  alphaPct?: number; // for hops e.g. 11.3%
  pricePerUnit?: number;

  /*
   * Caractéristiques techniques de l'article, recopiées UNE FOIS depuis la
   * fiche du fournisseur. Renseignées ici, elles suivent dans toutes les
   * recettes ; absentes, les calculs qui en dépendent s'affichent comme
   * incalculables plutôt que de sortir une valeur inventée.
   */

  /** Malt : couleur en EBC. Nécessaire au calcul de la couleur de la bière. */
  colorEbc?: number;
  /** Malt : potentiel d'extrait en PPG. Nécessaire à la prédiction de l'OG. */
  potentialPpg?: number;

  technicalSource?: string;

  /** Levure : laboratoire, souche, forme, atténuation, fourchette de fermentation. */
  yeastLab?: string;
  yeastStrain?: string;
  yeastForm?: 'sèche' | 'liquide' | 'levain';
  yeastAttenuationPct?: number;
  yeastTempMinC?: number;
  yeastTempMaxC?: number;
}

export interface EquipmentItem {
  id: string;
  ref: string;
  name: string;
  category: string; // 'Brassage', 'Mesure', 'Embouteillage', 'Stockage', 'Atelier'
  state: string; // 'Neuf', 'Bon', 'À entretenir', 'À réparer'
  purchaseDate?: string;
  purchasePrice?: number;
  maintenance?: string;
  notes?: string;
}

export type KegState = 'lavage' | 'propre' | 'plein' | 'livre';

export interface KegItem {
  id: string; // F-001, etc.
  capacityL: number;
  state: KegState;
  batchRef?: string;
  beerName?: string;
  style?: string;
  fillDate?: string;
  clientName?: string;
  notes?: string;
}

/**
 * Ce qu'un fermentescible devient dans la cuve.
 *
 * ⚠️ Ce que ça règle : tout ce qui apportait du sucre était rangé dans `malts`
 * et traité comme du grain entièrement fermentescible. Conséquence directe, la
 * densité finale d'une milk stout était FAUSSE : 500 g de lactose étaient
 * comptés comme du sucre que la levure allait manger, alors qu'elle n'en touche
 * pas un gramme. Même problème pour le sucre candi belge, qui ne peut pas non
 * plus s'ajouter en cours de fermentation quand il est rangé avec le grain.
 */
export type FermentableKind = 'grain' | 'sucre' | 'extrait' | 'fruit' | 'lactose';

/** Où le fermentescible entre. */
export type FermentableUse = 'empatage' | 'ebullition' | 'fermentation';

export interface Fermentable {
  name: string;
  /** Masse en kilogrammes. Nom conservé depuis `MaltIngredient` : les anciennes
   *  recettes en base restent lisibles sans réécriture. */
  weightKg: number;
  /** Part de la facture de grain, calculée — ne compte que les `grain`. */
  pct?: number;
  kind: FermentableKind;
  use: FermentableUse;
  /**
   * Couleur en EBC, telle qu'imprimée sur la fiche technique du malteur. Sans
   * elle, la couleur de la bière est INCALCULABLE — on l'affiche alors comme
   * inconnue plutôt que d'inventer une teinte plausible.
   */
  colorEbc?: number;
  /** Potentiel d'extrait en points/livre/gallon (PPG). Même règle : sans lui, pas d'OG prédite. */
  potentialPpg?: number;
  /**
   * Part du sucre apporté que la levure peut réellement manger.
   * 100 % pour le saccharose et le candi, ~75 % pour un moût de malt,
   * **0 % pour le lactose**. C'est ce champ qui répare la densité finale.
   */
  fermentabilityPct?: number;
  /** Jour d'ajout quand `use === 'fermentation'` : candi étagé, purée de fruits. */
  dayOffset?: number;
}

/**
 * @deprecated Forme d'avant la distinction grain / sucre. Conservée pour lire
 * les recettes enregistrées ; `normalizeRecipe` les convertit à la lecture.
 */
export type MaltIngredient = Omit<Fermentable, 'kind' | 'use'> &
  Partial<Pick<Fermentable, 'kind' | 'use'>>;

/**
 * Le moment où le houblon entre dans le brassin. C'était une chaîne libre, et
 * l'éditeur de création ne la saisissait jamais : le moment se perdait, et le
 * calcul d'amertume traitait un houblonnage à cru comme une ébullition de
 * 60 minutes. D'où des IBU fantômes sur toutes les NEIPA.
 */
export type HopStage = 'firstWort' | 'boil' | 'whirlpool' | 'dryHop';

export interface HopIngredient {
  name: string;
  alpha: number;
  weightG: number;
  stage: HopStage;
  /** Ébullition et whirlpool : durée de contact en minutes. */
  timeMin?: number;
  /** Whirlpool / hop stand : température de contact, qui pilote l'isomérisation. */
  tempC?: number;
  /** Houblonnage à cru : jour depuis la mise en fermenteur (0 = à l'ensemencement). */
  dayOffset?: number;
  /** Ancien champ libre. Conservé en lecture pour les brassins déjà enregistrés. */
  step?: string;
  /** Explicit index association; never guessed from a partial ingredient name. */
  hopVarietyId?: string;
  hopLotId?: string;
  aromaTiming?: import('../../functions/src/hopPredictionSchema').HopTiming;
  aromaContactHours?: number;
  aromaTemperatureC?: number;
}

/**
 * La levure était un simple `yeastName: string` : ni forme, ni température, ni
 * durée, ni atténuation — donc rien à afficher sur une fiche et rien à prédire
 * pour la FG.
 */
export interface YeastSpec {
  name: string;
  hopIndexId?: string;
  /** Lallemand, White Labs, Fermentis, GigaYeast, Omega… */
  lab?: string;
  /** Référence de souche : US-05, WLP095, GY054. */
  strain?: string;
  form: 'sèche' | 'liquide' | 'levain';
  qty: number;
  unit: string; // 'sachet', 'mL', 'g'
  pitchTempC?: number;
  fermTempMinC?: number;
  fermTempMaxC?: number;
  /** Atténuation apparente annoncée, en %. Sert à prédire la FG. */
  attenuationPct?: number;
  fermentDays?: number;
  notes?: string;
}

/** Palier d'empâtage ou de fermentation. */
export interface TempStep {
  name: string;
  tempC: number;
  durationMin: number;
}

export interface MashProfile {
  steps: TempStep[];
  /** Rapport eau/grain en L/kg. */
  ratioLPerKg?: number;
  mashoutTempC?: number;
  mashoutDurationMin?: number;
  /** Vitesse indicative du système, distincte des durées de maintien. */
  heatingRateCPerMin?: number;
  spargeTempC?: number;
  spargeType?: 'fly' | 'batch' | 'none';
}

/** Panneau ionique d'une eau, en ppm (mg/L). */
export interface IonBand { min: number; max: number }

export interface WaterIons {
  ca: number;
  mg: number;
  na: number;
  so4: number;
  cl: number;
  hco3: number;
}

/**
 * Une eau disponible à la brasserie : le réseau, l'osmosée, une source.
 *
 * ⚠️ Saisie à la MAIN, depuis l'analyse du distributeur. Il n'existe aucune API
 * suisse d'analyse d'eau potable : Hub'Eau ne couvre que la France, et Fribourg
 * ne publie que la dureté. `note` garde la provenance de l'analyse pour qu'on
 * sache de quand elle date.
 */
export interface WaterSource extends WaterIons {
  id: string;
  name: string;
  ph?: number;
  note?: string;
  updatedAt?: string;
}

/** Sels de brassage disponibles. Chacun peut être refusé par le brasseur. */
export type SaltId =
  | 'gypse'
  | 'cacl2'
  | 'epsom'
  | 'mgcl2'
  | 'nacl'
  | 'nahco3'
  | 'caco3'
  /** Ca(OH)₂ — la seule source d'alcalinité soluble qui n'apporte pas de sodium. */
  | 'chaux'
  | 'kcl';

/** Acidifiants. Le malt acidulé se dose en grammes, les autres en millilitres. */
export type AcidId = 'lactique' | 'phosphorique' | 'maltAcidule';

/**
 * Le traitement d'eau d'une recette.
 *
 * ⚠️ Empâtage et rinçage sont SÉPARÉS, et l'acide ne se dose que sur
 * l'empâtage : l'erreur classique est de calculer l'acidification sur le volume
 * total, ce qui surdose d'un facteur deux.
 */
export interface WaterPlan {
  /** Saved constraint, across mash and sparge together. Absent = unrestricted. */
  roLimitL?: number;
  ratioOverride?: number;
  /** Refit unpinned salt and acid doses when the recipe inputs change. */
  autoTreatment?: boolean;
  saltOverrides?: { mash?: Partial<Record<SaltId, number>>; sparge?: Partial<Record<SaltId, number>> };
  sourceId: string;
  /** Analysis used for this recipe; later source edits must not change it. */
  sourceSnapshot?: WaterSource;
  /** v2 stores weighted treatment water AFTER the retained acid doses. */
  treatmentVersion?: 2;
  acidOverride?: { mash?: number; sparge?: number };
  /** Part d'eau osmosée mélangée à la source, en %. Vaut pour l'EMPÂTAGE. */
  diRatioPct: number;
  /**
   * Part d'osmosée propre à l'eau de RINÇAGE, quand elle est déliée.
   *
   * Absent = le rinçage suit l'empâtage. Le délier a une raison de métier :
   * une eau de rinçage très diluée n'a presque plus d'alcalinité à neutraliser,
   * donc plus d'acide à doser et plus de risque d'astringence — et cela ne
   * change rien à la maische, où l'alcalinité, elle, est utile.
   */
  spargeDiRatioPct?: number;
  /** Profil visé — un classique nommé, ou une cible personnelle. */
  targetProfileId?: string;
  /**
   * Cible CHIFFRÉE, quand la recette donne son eau en ppm plutôt qu'un style.
   * Présente, elle prime sur `targetProfileId`.
   */
  targetIons?: Partial<WaterIons>;
  targetName?: string;
  /**
   * Cache du profil moyen des eaux de traitement, avant/après sels et acide.
   * Si sourceSnapshot existe, l'affichage se recalcule depuis cette analyse
   * figée et les doses retenues, jamais depuis une analyse réseau ultérieure.
   */
  startIons?: WaterIons;
  wortIons?: WaterIons;
  mashWaterL: number;
  spargeWaterL: number;
  /**
   * Doses en grammes, par sel. Les sels alcalins sont ENTIÈREMENT dans `mash` :
   * l'alcalinité n'a de sens que face aux phosphates du malt.
   */
  mash: Partial<Record<SaltId, number>>;
  sparge: Partial<Record<SaltId, number>>;
  /** Tous les sels sont versés à l'empâtage (aucun sel au rinçage, rinçage ajusté à l'acide seul). */
  allSaltsInMash?: boolean;
  /**
   * Acidification, séparée par eau.
   *
   * ⚠️ Elle était CALCULÉE, AFFICHÉE, puis perdue : rien ne l'enregistrait, et
   * la minuterie du jour de brassage ne la rappelait donc jamais. Le brasseur
   * arrivait à la cuve avec ses sels pesés et sans sa dose d'acide.
   */
  acid?: { id: AcidId; mash: number; sparge: number };
  /** Additifs écartés : le solveur ne s'en sert pas et le dit. */
  disabled?: SaltId[];
  /** pH de maische visé, et celui réellement mesuré à la cuve. */
  targetPh: number;
  measuredPh?: number;
  /** pH mesuré dans l'eau de rinçage. Sans lui, rien ne recale la fenêtre d'AR. */
  measuredSpargePh?: number;
}

/** @deprecated Forme d'avant l'atelier de l'eau. Lue par `normalizeRecipe`. */
export interface WaterProfile {
  sourceName: string;
  diRatioPct: number;
  salts: { gypseG: number; cacl2G: number; mgso4G: number; acidLacticMl: number };
  targetPh: number;
}

/**
 * Les phases d'une fermentation, typées.
 *
 * ⚠️ Une lager n'est pas une ale qui dure plus longtemps : elle demande un
 * **repos diacétyle** avant le froid, puis des semaines de **garde**. Une belge
 * forte demande une montée libre en température et un **ajout** de sucre en
 * cours de route. Sans ces types, le programme se réduisait à « 18 °C, 10 j »
 * pour toutes les bières.
 */
export type FermentPhaseKind =
  | 'primaire'
  | 'reposDiacetyle'
  | 'garde'
  | 'refermentation'
  | 'ajout';

export interface FermentationStep {
  kind: FermentPhaseKind;
  name: string;
  tempC: number;
  days: number;
  /** Pour `ajout` : ce qu'on met, et quand. Sucre candi, fruits, houblon à cru. */
  note?: string;
}

export interface AdjunctIngredient {
  name: string;
  amount: number;
  unit: string; // 'g', 'kg', 'mL', 'L', 'pastille', 'sachet', 'gousse'
  step: string; // 'Empattage', 'Ébullition', 'Whirlpool', 'Fermenteur'
  notes?: string;
}

export interface RecipeStep {
  step: string;
  tempC: number;
  durationMin: number;
  notes: string;
}

export interface Recipe {
  id: string;
  /** Organisation du carnet uniquement ; l'historique de production reste conservé. */
  archivedAt?: string | null;
  version?: number;
  parentRecipeId?: string;
  batchRef?: string;
  name: string;
  style: string;
  volumeL: number;
  brewDate?: string;
  ogTarget: number;
  fgTarget: number;
  abvTarget: number;
  ibuTarget?: number;
  carboTarget?: string;
  /** Values supplied by the recipe author, distinct from calculated estimates. */
  colorEbc?: number;
  efficiencyPct?: number;
  preBoilL?: number;
  /** Same planned wort at boiling temperature, when the equipment model is known. */
  preBoilHotL?: number;
  /** Frozen physical assumptions used to build this recipe. */
  brewhouse?: BrewhouseProfile;
  /**
   * Tout ce qui apporte du sucre : grains, sucres, lactose, fruits, extraits.
   * Le nom a changé de `malts` parce qu'un malt n'est pas un sucre — et que
   * les traiter pareil rendait la densité finale fausse.
   */
  fermentables: Fermentable[];
  /** @deprecated Ancien champ, lu par `normalizeRecipe`. Ne plus écrire. */
  malts?: MaltIngredient[];
  /** Masse de GRAIN seul — le sucre n'entre pas dans une facture de grain. */
  totalGristKg: number;
  hops: HopIngredient[];
  hopMatrixId?: string;
  /** Documentary brewing trial used as an anchor; never certifies model scope. */
  hopTrialId?: string;
  hopAromaTarget?: Record<string, import('../../functions/src/hopIndexSchema').HopRange>;
  hopSolverIntent?: import('../../functions/src/hopSolverSchema').HopSolverIntent;
  hopPredictionIds?: string[];
  adjuncts?: AdjunctIngredient[];
  yeast: YeastSpec;
  /** Frozen guide and adopted fermentation settings, independent of later catalogue edits. */
  yeastGuide?: import('../domain/fermentationGuide').FermentationGuideSnapshot;
  /** Durée d'ébullition. Les recettes américaines montent souvent à 75 ou 90 min. */
  boilMin?: number;
  mash?: MashProfile;
  /** Traitement d'eau complet. Se règle APRÈS le grain : la cible d'alcalinité
   *  dépend de la couleur de la bière. */
  waterPlan?: WaterPlan;
  /** @deprecated Ancien bloc eau, lu par `normalizeRecipe`. */
  water?: WaterProfile;
  fermentation?: FermentationStep[];
  /**
   * Le déroulé en texte libre, tel qu'il figure sur la recette d'origine
   * (« Step by Step » chez BYO). Recopié mot pour mot à l'import, jamais résumé.
   */
  instructions?: string;
  steps: RecipeStep[];
  notes: string[];
  notesCreation?: string;
  /** Épinglé par Gaëtan : remonte en tête des listes, des autocomplétions et de la recherche. */
  favorite?: boolean;
}

/**
 * Copie figée d'une recette, portée par le brassin.
 *
 * Volontairement sans `id` ni `favorite` : ce n'est plus une recette qu'on
 * range, c'est le contenu réel d'une cuve à une date donnée.
 */
export type RecipeSnapshot = Omit<Recipe, 'id' | 'favorite' | 'batchRef' | 'archivedAt'> & {
  /** Recette d'origine, et sa date de copie. */
  sourceRecipeId?: string;
  capturedAt: string; // ISO
};

/** Une étape du déroulé du jour de brassage. */
export interface BrewDayStep {
  id: string;
  label: string;
  /** Ce qu'il faut faire, en une phrase. */
  detail?: string;
  durationMin: number;
  tempC?: number;
  /** Ajouts de houblon rattachés à cette étape, pour l'alarme. */
  hopNames?: string[];
  /**
   * Horloge murale du démarrage (`Date.now()`), pas un compteur de ticks :
   * verrouiller l'écran ou recharger la page ne doit pas fausser le compte.
   */
  startedAt?: number;
  doneAt?: number;
  pausedAt?: number;
  rampStartedAt?: number;
  /** Actual start of the hold, never shifted by pause/resume. */
  holdStartedAt?: number;
  /** Minutes écoulées depuis le début réel de l'ébullition. */
  boilElapsedMin?: number;
}

export interface BrewDayReading {
  id?: string;
  at: number;
  stepId?: string;
  kind: 'volume' | 'densite' | 'ph' | 'temperature';
  value: number;
  unit: string;
  note?: string;
  /** pH mesuré sur un échantillon refroidi, pas dans le moût chaud. */
  roomTemp?: boolean;
}

export interface BrewDayState {
  steps: BrewDayStep[];
  /** Index de l'étape en cours. */
  currentIndex: number;
  startedAt?: number;
  finishedAt?: number;
  revision?: number;
  savedAt?: number;
  /** Dernière version confirmée par le serveur, sans déduire les gestes manquants. */
  waterMix?: Partial<Record<'mash' | 'sparge', { roL: number }>>;
  hopElapsedMin?: Record<string, number>;
  coolingWaterC?: number;
  boilOffLPerHour?: number;
  /** Relevés horodatés saisis pendant le brassage. */
  readings?: BrewDayReading[];
  boilStartedAt?: number;
  /** Ajustement du jour, sans réécrire la recette. */
  boilDurationMin?: number;
  boilFinishedAt?: number;
  additions?: Record<string, { amount: number; doneAt?: number; replacement?: { name: string; potentialPpg?: number; colorEbc?: number } }>;
  preparations?: Record<string, boolean>;
  notes?: Array<{ id: string; at: number; stepId: string; text: string }>;
  acidCorrections?: Array<{ id: string; at: number; stepId: string; readingAt: number; acid: AcidId; amount: number }>;
  mashContext?: { waterL: number; gristKg: number; acid: AcidId };
}

// Le brassage dure une journée : c'est un ÉVÉNEMENT (qui déstocke et enregistre
// l'OG mesurée), pas un état dans lequel un brassin séjourne. Il fait passer
// directement `planifie` ➔ `fermentation`.
export type BatchStatus =
  | 'planifie'
  | 'fermentation'
  | 'garde'
  | 'conditionne'
  | 'termine'
  | 'annule';

export interface BatchPackaging {
  bottles33: number;
  bottles75: number;
  kegIds: string[]; // fûts remplis avec ce brassin (F-001, …)
}

export interface Batch {
  id: string; // LOT-001
  favorite?: boolean;
  /** Masqué du carnet courant, disponible dans Archives et les analyses. */
  archivedAt?: string | null;
  brewDate: string;
  name: string;
  style: string;
  volumeL: number; // Volume VISÉ à la planification
  og?: string;
  fg?: string;
  abv?: string;
  bottlingDate?: string;
  status: BatchStatus;
  recipeRef?: string;
  /** Volume réellement récolté en cuve le jour du brassage (mesuré). */
  volumeBrewedL?: number;
  /** Conditionnement net obtenu. Source de vérité du volume produit. */
  packaging?: BatchPackaging;
  /**
   * Volume réellement conditionné, en litres — dérivé de `packaging`.
   * C'est CETTE valeur qui constitue l'assiette de l'impôt sur la bière,
   * jamais `volumeL` qui n'est qu'un objectif.
   */
  volumePackagedL?: number;
  malts?: MaltIngredient[];
  hops?: HopIngredient[];
  adjuncts?: AdjunctIngredient[];
  /** Ancien champ. Conservé en lecture ; `yeast` le remplace à l'écriture. */
  yeastName?: string;
  yeast?: YeastSpec;
  /**
   * La recette telle qu'elle était AU LANCEMENT du brassin.
   *
   * Sans cette copie, corriger une faute de frappe dans la recette réécrirait
   * rétroactivement ce qu'on croit avoir brassé six mois plus tôt, et deux
   * brassins du même nom deviendraient incomparables. `recipeRef` reste comme
   * provenance ; c'est le snapshot qui fait foi.
   */
  recipeSnapshot?: RecipeSnapshot;
  /** Déroulé du jour de brassage : minuteurs et étapes cochées. */
  brewDay?: BrewDayState;
  gravityLog?: Array<{ date: string; sg: number; tempC?: number; notes?: string }>;
  waterDilutionPct?: number; // e.g. 50 for 50-50 tap/DI
  waterSalts?: {
    gypseG: number;
    cacl2G: number;
    mgso4G: number;
    acidLacticMl: number;
    isApplied: boolean;
  };
  mashPhTarget?: number;
  mashPhActual?: number;
  carbonation?: {
    method: 'priming' | 'forced';
    targetCo2Vol: number;
    sugarG?: number;
    kegPressureBar?: number;
  };
  brewNotes?: string;
  notesCreation?: string; // Avant : inspiration & profil visé
  notesBrewDay?: string;  // Pendant : jour J, empattage, odeur whirlpool
  notesTasting?: string;  // Après : fermentation, garde, dégustation
}

export type ClientStatus = 'Fidèle' | 'Actif' | 'Prospect';

export interface Client {
  id: string; // CL-001
  name: string;
  type: 'Pro' | 'Privé';
  contact: string;
  phone: string;
  email: string;
  address?: string;
  notes?: string;
  /** Épinglé par Gaëtan : remonte en tête des listes, des autocomplétions et de la recherche. */
  favorite?: boolean;
}

/**
 * Chiffres client CALCULÉS depuis les ventes réelles, jamais saisis ni stockés —
 * sinon ils se périment dès la vente suivante.
 */
export interface ClientStats {
  totalSales: number;
  orderCount: number;
  lastOrder: string | null; // DD.MM.YYYY
  status: ClientStatus;
}

export interface GanttTask {
  id: string;
  category: string;
  description: string;
  cost: number;
  startDate: string;
  endDate: string;
  isMilestone: boolean;
  completed?: boolean;
}

export interface PricingItem {
  product: string;
  costIngredients: number;
  costLabor: number;
  costFixed: number;
  costTotal: number;
  priceHT: number;
  marginCHF: number;
  marginPercent: number;
}

export interface BudgetLine {
  line: string;
  category?: FinanceCategory;
  row: number;
  months: number[]; // 12 values Jan-Dec
  totalPrevu: number;
  realiseYTD: number;
}

export interface BrewingEquipment {
  kettleCapacityL: number;
  /** Working volume including hot water and grain, below the rim. */
  kettleWorkingL: number;
  workingVolumeConfirmed?: boolean;
  spargeCapacityL: number;
  fermenterCapacityL: number;
  /** Percentage of the TOTAL vessel reserved for krausen. */
  fermenterHeadspacePct: number;
  roPackL: number;
  boilOffLPerHour: number;
  grainAbsorptionLPerKg: number;
  grainDisplacementLPerKg: number;
  coolingShrinkagePct: number;
  heatingRateCPerMin: number;
}

export interface BrewhouseProfile {
  id: string;
  name: string;
  volumeL: number;
  efficiencyPct: number;
  boilOffRatePct: number; // e.g. 10%/hr
  deadSpaceL: number;
  mashRatioLPerKg: number; // e.g. 3.0 L/kg
  equipment?: BrewingEquipment;
}

export interface AppConfig {
  company: {
    name: string;
    owner: string;
    uid: string;
    address: string;
    npa: string;
    canton: string;
    founded: string;
    activity: string;
    communeContact: string;
    iban?: string;
    bankName?: string;
  };
  fiscal: {
    /**
     * Assujettissement TVA. Sous le seuil de chiffre d'affaires
     * (`tvaThresholdTurnover`), la brasserie n'est PAS assujettie : elle ne
     * facture pas la TVA et ne la récupère pas. Les quittances ne doivent alors
     * afficher aucune ventilation TVA.
     */
    isTvaRegistered: boolean;
    tvaReducedRate: number; // 0.026
    tvaNormalRate: number; // 0.081
    tvaThresholdTurnover: number; // 100000 CHF
    /** Taux plein de l'impôt sur la bière, CHF/hl. À vérifier auprès de l'OFDF. */
    beerTaxFullRatePerHl: number;
    /** Plafond du régime petit brasseur, en HECTOLITRES de production annuelle. */
    beerTaxSmallBrewerMaxHl: number;
    /** Paliers de réduction dégressifs (production annuelle en hl). */
    beerTaxReliefTiersHl: Array<{ upToHl: number; reductionPct: number }>;
  };
  brewhouses: BrewhouseProfile[];
  activeBrewhouseId: string;
  /** Les eaux dont dispose la brasserie, saisies depuis l'analyse du distributeur. */
  waterSources?: WaterSource[];
  activeWaterSourceId?: string;
  geminiApiKey?: string;
  googleDriveFolderId?: string;
  security: {
    // Le verrou réel est l'authentification Google Firebase. Pas de second
    // code PIN décoratif stocké en clair.
    currentUser: 'Gaëtan' | 'Aricia';
  };
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO & formatted
  user: 'Gaëtan' | 'Aricia';
  action: string; // 'Création' | 'Modification' | 'Suppression' | 'Statut'
  category: 'Finances' | 'Production' | 'Stocks' | 'Clients' | 'Fûts' | 'Configuration';
  entityId: string;
  summary: string;
  details?: string;
}

export type TimeFilterPeriod = 
  | 'this-month' 
  | 'last-month' 
  | 'm-04'
  | 'm-01'
  | 'q1' 
  | 'q2' 
  | 'q3' 
  | 'q4' 
  | 'year' 
  | 'all';

export interface ExpenseTemplate {
  id: string;
  title: string;
  vendor: string;
  category: FinanceCategory;
  subcategory: string;
  tvaRate: number;
  defaultAmountHT?: number;
  description: string;
  /** Épinglé par Gaëtan : remonte en tête des listes, des autocomplétions et de la recherche. */
  favorite?: boolean;
}

export interface CreativeItem {
  id: string;
  type: 'equipment' | 'recipe-idea' | 'event' | 'pricing-test' | 'prospect';
  title: string;
  description?: string;
  status: 'idea' | 'research' | 'quote' | 'validated' | 'todo' | 'done';
  estimatedCost?: number;
  targetPrice?: number;
  date?: string;
  notes?: string;
  contactName?: string;
  contactPhone?: string;
}
