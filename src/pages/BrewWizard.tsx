import { MaltDetails } from '../ui/MaltDetails';
import { applyHopFacts, applyYeastFacts, factsForStock } from '../domain/ingredientFacts';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NumberInput } from '../ui/NumberInput';
import {
  Recipe,
  StockItem,
  AppConfig,
  MaltIngredient,
  Fermentable,
  FermentableKind,
  HopIngredient,
  HopStage,
  YeastSpec,
  TempStep,
  FermentationStep,
  SaltId,
  WaterPlan,
  WaterSource,
  WaterIons
} from '../types';
import { Units } from '../services/units';
import { BrewingMath, kettleHopGrams } from '../services/brewingMath';
import { defaultBrewVolume, fermenterLimit } from '../domain/brewEquipment';
import { adaptRecipeEquipment } from '../domain/adaptRecipeEquipment';
import { normalizeRecipeImport } from '../domain/recipeImport';
import { BrewEquipmentSummary } from '../ui/BrewEquipmentSummary';
import { computeBeerColor } from '../domain/beerColor';
import { recipeToText } from '../domain/recipeText';
import { readRecipeFields } from '../domain/recipeTransfer';
import { HOP_STAGE, HOP_STAGES, describeMoment } from '../domain/hopStage';
import {
  MASH_PROGRAMS,
  FERMENT_PROGRAMS,
  PHASE_LABEL,
  mashProgramForStyle,
  fermentProgramForStyle,
  saccharificationTemp
} from '../domain/brewPrograms';
import {
  DEFAULT_WATER_SOURCE,
  calculateWaterTreatment,
  splitDoses,
  targetRaForGrist,
  raSaltCeilingForGrist,
  alkalineSaltGoal,
} from '../domain/water';
import { styleWaterForName, styleByCode, styleFromTargetIons } from '../domain/waterStyles';
import { PageShell, Section } from './PageShell';
import { useDensity, useCoarsePointer } from '../ui/useViewport';
import { FormNav, Field, InlineNum, TextInput, inputClass } from '../ui/FormNav';
import { SliderField } from '../ui/SliderField';
import { SegmentedControl } from '../ui/SegmentedControl';
import { DateField, swissToday } from '../ui/DateField';
import { QuantityStepper } from '../ui/QuantityStepper';
import { CycleTag } from '../ui/CycleTag';
import { PresetChips } from '../ui/PresetChips';
import { IngredientPicker } from '../ui/IngredientPicker';
import { Combobox } from '../ui/Combobox';
import { SaltSolver, WaterState } from '../ui/SaltSolver';
import { AiAssist } from '../ui/AiAssist';
import { BrewerChat } from '../ui/BrewerChat';
import { RecipeImportSheet, ImportedRecipe } from '../ui/RecipeImportSheet';
import { BrewSheet } from '../ui/BrewSheet';
import { RecipeAutoComplete } from '../ui/RecipeAutoComplete';
import { Trash2, Plus, Check, AlertTriangle, Beaker, ClipboardPaste, ClipboardList, Droplets, ChevronLeft } from 'lucide-react';

/** Un ancien malt, ramené à la forme typée : du grain, à l'empâtage. */
function asGrain(m: MaltIngredient): Fermentable {
  return { ...m, kind: m.kind ?? 'grain', use: m.use ?? 'empatage' };
}

/** Recompose une dose totale depuis la répartition empâtage / rinçage. */
function mergeDoses(
  mash: Partial<Record<SaltId, number>>,
  sparge: Partial<Record<SaltId, number>> = {}
): Partial<Record<SaltId, number>> {
  const out: Partial<Record<SaltId, number>> = {};
  new Set([...Object.keys(mash), ...Object.keys(sparge)]).forEach((k) => {
    const id = k as SaltId;
    out[id] = (mash[id] ?? 0) + (sparge[id] ?? 0);
  });
  return out;
}

/** Standard allocations keep following the volumes; only a custom split is frozen. */
function customSaltSplit(plan: Partial<WaterPlan>): WaterState['saltSplit'] {
  const split = { mash: plan.mash ?? {}, sparge: plan.sparge ?? {} };
  const normal = splitDoses(mergeDoses(split.mash, split.sparge), plan.mashWaterL ?? 0,
    plan.spargeWaterL ?? 0, plan.allSaltsInMash !== false);
  const same = (['mash', 'sparge'] as const).every(side =>
    Object.keys(normal[side]).length === Object.keys(split[side]).length &&
    Object.entries(split[side]).every(([k, g]) => Math.abs((normal[side][k] ?? 0) - g) < 1e-9));
  return same ? undefined : split;
}

/**
 * Ce qu'apporte chaque famille de fermentescible, et comment elle se comporte.
 *
 * ⚠️ C'est ici que se joue la correction la plus importante : le lactose ne
 * fermente PAS. Rangé avec le grain, il faisait annoncer une densité finale de
 * milk stout de plusieurs points trop basse — et donc un alcool trop haut.
 */
/**
 * L'ordre dans lequel les pastilles rotatives traversent ces énumérations.
 *
 * ⚠️ Il suit la FRÉQUENCE, pas l'alphabet : après « Grain », c'est « Sucre »
 * qu'on veut en un appui, pas « Extrait ». Et « empâtage » précède
 * « ébullition », qui précède « fermentation » — l'ordre du brassin.
 */
const FERMENTABLE_KINDS = ['grain', 'sucre', 'lactose', 'fruit', 'extrait'] as const;
const FERMENTABLE_USES = ['empatage', 'ebullition', 'fermentation'] as const;
const USE_LABEL: Record<Fermentable['use'], string> = {
  empatage: 'Empâtage',
  ebullition: 'Ébullition',
  fermentation: 'Fermentation'
};

/**
 * La couleur du MOMENT — et seule l'EXCEPTION est colorée.
 *
 * Deux règles, apprises en regardant le résultat plutôt qu'en le supposant.
 *
 * 1. **Le même moment porte la même couleur d'un ingrédient à l'autre.**
 *    L'ébullition est déjà rouge sur les houblons (`HOP_STAGE.boil`), la
 *    fermentation déjà verte (`HOP_STAGE.dryHop`). Donner d'autres teintes aux
 *    fermentescibles obligerait à apprendre deux codes pour une seule notion.
 *
 * 2. ⚠️ **L'empâtage reste NEUTRE, alors qu'il a droit à une couleur.** Premier
 *    essai : je lui avais donné la paille du grain. À l'écran, chaque carte
 *    portait alors deux pastilles paille — sa classe de couleur ET son moment —
 *    et sur une facture de quatre malts, huit pastilles de la même teinte. La
 *    couleur ne distinguait plus rien.
 *
 *    Or l'empâtage est le cas de NEUF lignes sur dix. Colorier le cas courant,
 *    c'est colorier le fond ; ce qu'on cherche du regard, c'est l'exception —
 *    le lactose qui part à l'ébullition, le sucre qu'on ajoute en fermentation.
 *    Ceux-là seuls s'allument, et l'œil tombe dessus.
 */
const USE_TONE: Record<Fermentable['use'], string> = {
  empatage: 'border-cave-700 text-cave-400',
  ebullition: 'text-alert border-alert/40 bg-alert/10',
  fermentation: 'text-hop border-hop/40 bg-hop/10'
};

/**
 * La couleur de la FAMILLE — une seule se distingue, et c'est voulu.
 *
 * Le lactose ne fermente pas : c'est la seule famille qui change la densité
 * finale au lieu de l'abaisser, et la seule erreur de classement qui se paie
 * en bouche. Il porte donc l'ambre d'avertissement. Les autres restent neutres,
 * parce que les colorier toutes reviendrait à n'en signaler aucune.
 */
const KIND_TONE: Record<FermentableKind, string> = {
  grain: 'border-cave-700 text-cave-300',
  sucre: 'border-cave-700 text-cave-300',
  lactose: 'text-ebc-amber border-ebc-amber/40 bg-ebc-amber/10',
  fruit: 'border-cave-700 text-cave-300',
  extrait: 'border-cave-700 text-cave-300'
};

/**
 * Les familles de fermentescibles, et le rayon du stock où les chercher.
 *
 * ⚠️ `stock` et `newCat` sont là pour réparer un vrai dégât. Le filtre était
 * écrit en ternaire — grain ? ['Malt','Céréale'] : ['Sucre','Additif','Malt'] —
 * donc `Malt` restait proposé dans TOUTES les familles. Choisir « Sucre » puis
 * ajouter un Maris Otter donnait un malt classé sucre, et choisir « Lactose »
 * donnait un malt à 0 % de fermentescibilité : la densité finale prévue montait
 * de plusieurs points sur un ingrédient qui, en réalité, fermente entièrement.
 * Le rayon de chaque famille est maintenant déclaré, et ne se recoupe pas.
 *
 * Les catégories nommées ici sont celles du stock (`AddStockItemModal`) : Malt,
 * Houblon, Levure, Sucre. Les autres sont tolérées pour un stock personnalisé.
 */
const KIND_DEF: Record<
  FermentableKind,
  {
    label: string;
    use: Fermentable['use'];
    fermentability: number;
    ppg?: number;
    hint: string;
    /** Rayons du stock proposés pour cette famille. */
    stock: string[];
    /** Catégorie donnée à un ingrédient créé depuis cette famille. */
    newCat: string;
  }
> = {
  grain: {
    label: 'Grain',
    use: 'empatage',
    fermentability: 100,
    hint: 'Passe par la maische.',
    stock: ['Malt', 'Céréale'],
    newCat: 'Malt'
  },
  sucre: {
    label: 'Sucre',
    use: 'ebullition',
    fermentability: 100,
    ppg: 46,
    hint: 'Entièrement fermentescible. Sèche la bière et monte l’alcool.',
    stock: ['Sucre'],
    newCat: 'Sucre'
  },
  lactose: {
    label: 'Lactose',
    use: 'ebullition',
    fermentability: 0,
    ppg: 35,
    hint: 'La levure n’y touche pas : il reste en bouche et remonte la densité finale.',
    stock: ['Sucre'],
    newCat: 'Sucre'
  },
  fruit: {
    label: 'Fruit',
    use: 'fermentation',
    fermentability: 90,
    ppg: 8,
    hint: 'Apporte peu de sucre et beaucoup d’eau. À ajouter en fermentation.',
    stock: ['Fruit', 'Additif'],
    newCat: 'Sucre'
  },
  extrait: {
    label: 'Extrait',
    use: 'ebullition',
    fermentability: 75,
    ppg: 36,
    hint: 'Moût concentré, déjà empâté.',
    stock: ['Extrait', 'Sucre'],
    newCat: 'Sucre'
  }
};

/**
 * Création d'une recette, pas à pas.
 *
 * ⚠️ Ce qu'il remplace : `CreateBatchModal` (497 l.) et `RecipeBrewModal`
 * (1244 l.), deux formulaires qui s'ouvraient PRÉ-REMPLIS de valeurs
 * inventées — « Target 30 g 60 min », « Malt Pale Ale 5 kg », « SafAle US-05 ».
 * Un brasseur pressé validait sans tout relire, et brassait une recette qui
 * n'était pas la sienne.
 *
 * Ici **rien n'est prérempli** : les listes démarrent vides et se remplissent
 * depuis le stock réel. Ce qui est calculé (EBC, OG, IBU) l'est en direct, et
 * s'annonce incalculable quand la donnée manque.
 *
 * ⚠️ L'ORDRE des étapes a changé : l'eau venait en deuxième, avant le grain.
 * C'était faux. La cible d'alcalinité dépend de la COULEUR de la bière, donc de
 * la facture de grain — on ne peut pas régler son eau avant de savoir ce qu'on
 * brasse. L'eau se traite désormais en avant-dernier, comme le fait un brasseur.
 */

type StepId =
  | 'identite'
  | 'fermentescibles'
  | 'houblons'
  | 'levure'
  | 'paliers'
  | 'eau'
  | 'recap';

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'identite', label: 'Identité' },
  { id: 'fermentescibles', label: 'Fermentescibles' },
  { id: 'houblons', label: 'Houblons' },
  { id: 'levure', label: 'Levure' },
  { id: 'paliers', label: 'Paliers' },
  { id: 'eau', label: 'Eau et sels' },
  { id: 'recap', label: 'Récapitulatif' }
];

export interface WizardSeed {
  title?: string;
  description?: string;
  /** Recette existante à modifier ou dupliquer. */
  recipe?: Recipe;
}

interface BrewWizardProps {
  seed?: WizardSeed;
  stockItems: StockItem[];
  config: AppConfig;
  knownStyles: string[];
  onClose: () => void;
  /** Crée un article de stock à zéro et renvoie l'article créé. */
  onCreateStockItem: (name: string, category: string, unit: string) => StockItem;
  /**
   * Retient durablement une fiche technique retrouvée par l'IA.
   *
   * ⚠️ Ce que ça règle, mot pour mot : « je veux aussi que quand l'IA va
   * chercher une info elle soit sauvegardée et réutilisable. L'EBC d'un malt ne
   * changera jamais ».
   *
   * Il avait raison sur les deux points. Ces valeurs sont des CONSTANTES
   * PHYSIQUES du produit — un Château Munich fait 25 EBC cette année comme
   * l'an prochain — et elles n'étaient écrites que dans la recette en cours.
   * Le brassin suivant repartait donc d'une fiche vide, redemandait la même
   * chose au même modèle, et repayait le même appel pour le même chiffre.
   *
   * Elles vont désormais à l'ARTICLE DE STOCK, qui est le bon porteur : c'est
   * lui qui représente le produit, indépendamment de la recette qui l'emploie.
   */
  onLearnIngredient: (name: string, facts: Partial<StockItem>) => void;
  onSave: (recipe: Recipe, thenBrew: boolean) => void;
  /** Enregistre l'analyse d'eau modifiée — elle sert à tous les brassins. */
  onSaveWaterSource: (source: WaterSource) => void;
}

export const BrewWizard: React.FC<BrewWizardProps> = ({
  seed,
  stockItems,
  config,
  knownStyles,
  onClose,
  onCreateStockItem,
  onLearnIngredient,
  onSave,
  onSaveWaterSource
}) => {
  const base = seed?.recipe;
  const [draftRecipeId] = useState(() => base?.id ?? `REC-${Date.now().toString(36).toUpperCase()}`);
  const [details, setDetails] = useState<Partial<Recipe>>(base ?? {});
  const brewhouse =
    config.brewhouses.find((b) => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];

  const [step, setStep] = useState<StepId>('identite');
  /* Clavier ouvert : le bandeau de mesures passe sur une seule ligne. */
  const density = useDensity();
  const tight = density === 'tight';
  /* Au doigt, le chrome se replie dans l'en-tête : l'écran est la ressource rare. */
  const compactChrome = density !== 'comfortable';
  const [importing, setImporting] = useState(false);

  // --- Étape 1 : identité ---------------------------------------------------
  const [name, setName] = useState(base?.name ?? seed?.title ?? '');
  const [style, setStyle] = useState(base?.style ?? '');
  const [volumeL, setVolumeL] = useState(base?.volumeL ?? defaultBrewVolume(brewhouse));
  const [equipmentNotice,setEquipmentNotice]=useState('');
  /**
   * Carbonatation visée, en volumes de CO2.
   *
   * Lue à l’import (« force carbonate to 2.5 volumes ») : c’est une consigne
   * chiffrée du procédé, qui se perdait dans le texte libre.
   */
  const [carboTarget, setCarboTarget] = useState<string>(base?.carboTarget ?? '');
  const [brewDate, setBrewDate] = useState(base?.brewDate ?? swissToday());
  const [boilMin, setBoilMin] = useState(base?.boilMin ?? 60);

  // --- Étape 2 : fermentescibles -------------------------------------------
  const [fermentables, setFermentables] = useState<Fermentable[]>(
    () => base?.fermentables ?? (base?.malts ?? []).map(asGrain)
  );
  const [addKind, setAddKind] = useState<FermentableKind>('grain');

  /**
   * Le rang dont la quantité doit prendre le focus, au clavier seulement.
   *
   * Remis à `null` dès que le focus est donné : sans ça, le champ se
   * re-focaliserait à chaque rendu et l'on ne pourrait plus en sortir.
   */
  const coarse = useCoarsePointer();
  const [focusFermentable, setFocusFermentable] = useState<number | null>(null);
  const [focusHop, setFocusHop] = useState<number | null>(null);

  /*
   * `autoFocus` de React ne s'applique qu'au MONTAGE du champ : le focus est
   * donc déjà donné quand cet effet passe. On efface l'index pour qu'un
   * remontage ultérieur de ce même rang — un changement de clé, un tri — ne
   * vienne pas reprendre le focus sous les doigts du brasseur.
   */
  useEffect(() => {
    if (focusFermentable !== null) setFocusFermentable(null);
  }, [focusFermentable]);
  useEffect(() => {
    if (focusHop !== null) setFocusHop(null);
  }, [focusHop]);

  // --- Étape 3 : houblons ---------------------------------------------------
  const [hops, setHops] = useState<HopIngredient[]>(base?.hops ?? []);
  const [hopStage, setHopStage] = useState<HopStage>('boil');

  // --- Étape 4 : levure -----------------------------------------------------
  const [yeast, setYeast] = useState<YeastSpec>(
    base?.yeast ?? { name: '', form: 'sèche', qty: 1, unit: 'sachet' }
  );

  // --- Étape 5 : paliers et fermentation ------------------------------------
  const [mashSteps, setMashSteps] = useState<TempStep[]>(
    () => base?.mash?.steps ?? mashProgramForStyle(base?.style ?? '').steps
  );
  const [spargeType, setSpargeType] = useState<'fly' | 'batch' | 'none'>(
    base?.mash?.spargeType ?? 'batch'
  );
  const [ferment, setFerment] = useState<FermentationStep[]>(
    () => base?.fermentation ?? fermentProgramForStyle(base?.style ?? '').steps
  );

  // --- Étape 6 : eau et sels ------------------------------------------------
  const [recipeWaterSource, setRecipeWaterSource] = useState<WaterSource | undefined>(base?.waterPlan?.sourceSnapshot);
  const waterSource =
    recipeWaterSource ??
    config.waterSources?.find((w) => w.id === base?.waterPlan?.sourceId) ??
    config.waterSources?.find((w) => w.id === config.activeWaterSourceId) ??
    config.waterSources?.[0] ??
    DEFAULT_WATER_SOURCE;

  const [water, setWater] = useState<WaterState>(() => ({
    diRatioPct: base?.waterPlan?.diRatioPct ?? base?.water?.diRatioPct ?? 50,
    // Absent = le rinçage suit l'empâtage. On ne le recopie surtout pas : la
    // valeur `undefined` porte l'information « lié ».
    spargeDiRatioPct: base?.waterPlan?.spargeDiRatioPct,
    // Le style d'eau se devine du style de bière saisi — c'est le point de
    // départ le plus juste, et il reste modifiable.
    styleCode: base?.waterPlan?.targetProfileId ?? styleWaterForName(base?.style ?? '').code,
    // Une cible chiffrée enregistrée reprend la main sur le style deviné du nom.
    customTarget: base?.waterPlan?.targetIons
      ? {
          name: base.waterPlan.targetName ?? 'Cible de la recette',
          ions: base.waterPlan.targetIons
        }
      : undefined,
    doses: base?.waterPlan?.mash
      ? mergeDoses(base.waterPlan.mash, base.waterPlan.sparge)
      : {},
    saltSplit: base?.waterPlan ? customSaltSplit(base.waterPlan) : undefined,
    disabled: base?.waterPlan?.disabled ?? [],
    acidId: base?.waterPlan?.acid?.id ?? 'lactique',
    acidOverride: base?.waterPlan?.acidOverride ?? (base?.waterPlan?.treatmentVersion === 2
      ? undefined : base?.waterPlan?.acid && { mash: base.waterPlan.acid.mash, sparge: base.waterPlan.acid.sparge }),
    mashWaterL: base?.waterPlan?.mashWaterL ?? 0,
    spargeWaterL: base?.waterPlan?.spargeWaterL ?? 0,
    allSaltsInMash: base?.waterPlan?.allSaltsInMash ?? true,
    // Les pH relevés à la cuve reviennent avec la recette : ce sont des mesures,
    // et elles se perdaient à chaque réouverture.
    mashPh: base?.waterPlan?.measuredPh,
    spargePh: base?.waterPlan?.measuredSpargePh
  }));

  // Follow the beer style until an explicit water profile is chosen. Saved
  // profiles (including the neutral profile) and numeric targets stay intentional.
  const waterProfileAuto = useRef(!base?.waterPlan?.targetProfileId && !base?.waterPlan?.targetIons);
  const changeStyle = (next: string) => {
    setStyle(next);
    if (waterProfileAuto.current) {
      setWater(w => ({ ...w, styleCode: styleWaterForName(next).code, ratioOverride: undefined }));
    }
  };

  /**
   * Les volumes ont-ils été posés à la main ?
   *
   * ⚠️ Tant que non, ils SUIVENT la facture de grain. L'ancien effet ne se
   * déclenchait qu'une fois, à la première saisie de grain : ajouter ensuite un
   * malt, changer le volume ou passer en BIAB laissait des volumes périmés — et
   * comme les sels se dosent au litre, des doses fausses.
   */
  const [volumesEdited, setVolumesEdited] = useState(
    () => (base?.waterPlan?.mashWaterL ?? 0) > 0
  );

  /**
   * L'épaisseur de maische, en L/kg, quand elle est reprise à la main.
   *
   * ⚠️ Elle ne vivait QUE dans le profil d'installation, qu'aucun écran ne sait
   * modifier. Or c'est elle qui décide du partage empâtage/rinçage : sur un
   * monocuve on empâte épais ou mince selon le panier, et le rinçage suit. La
   * laisser hors d'atteinte, c'était figer le volume de rinçage sur une valeur
   * que le brasseur ne reconnaissait pas.
   */
  const [mashRatioOverride, setMashRatioOverride] = useState<number | null>(
    base?.mash?.ratioLPerKg ?? null
  );

  const [notes, setNotes] = useState(base?.instructions ?? seed?.description ?? '');

  // --- Calculs en direct ----------------------------------------------------

  /** Le grain seul. Un brasseur ne met pas le sucre dans sa facture de grain. */
  const grains = useMemo(() => fermentables.filter((f) => f.kind === 'grain'), [fermentables]);
  const totalGrist = useMemo(() => grains.reduce((s, f) => s + f.weightKg, 0), [grains]);

  // La couleur ne vient que du grain : le sucre clair n'en apporte pas.
  const color = useMemo(() => computeBeerColor(grains, volumeL), [grains, volumeL]);

  const efficiency = details.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75;
  // Preserve the author's stated targets until their calculation inputs change.
  const metricKey = JSON.stringify([volumeL, boilMin, fermentables, hops, yeast, efficiency]);
  const [targetBasis, setTargetBasis] = useState(metricKey);
  const keepTargets = metricKey === targetBasis;
  const points = useMemo(
    () => BrewingMath.extractPoints(fermentables, volumeL, efficiency),
    [fermentables, volumeL, efficiency]
  );
  const ogPredicted = useMemo(
    () => BrewingMath.calculateOg(fermentables, volumeL, efficiency),
    [fermentables, volumeL, efficiency]
  );
  const og = ogPredicted ?? 0;

  const ibu = useMemo(
    () => (og > 1 ? BrewingMath.calculateTinsethIBU(hops, volumeL, og, boilMin) : null),
    [hops, volumeL, og, boilMin]
  );

  /** L'atténuation réelle dépend du palier de saccharification, pas seulement de la levure. */
  const mashTemp = useMemo(() => saccharificationTemp(mashSteps), [mashSteps]);
  const attenuation = useMemo(() => {
    if (!yeast.attenuationPct) return null;
    return mashTemp
      ? BrewingMath.attenuationForMashTemp(yeast.attenuationPct, mashTemp)
      : yeast.attenuationPct;
  }, [yeast.attenuationPct, mashTemp]);

  const fgPredicted = useMemo(
    () =>
      attenuation && og > 1
        ? BrewingMath.calculateFg(og, attenuation, points?.unfermentable ?? 0)
        : null,
    [attenuation, og, points]
  );

  const pitch = useMemo(
    () =>
      og > 1
        ? BrewingMath.pitchRate(og, volumeL, /lager|pils|helles|bock/i.test(style) ? 'lager' : 'ale')
        : null,
    [og, volumeL, style]
  );

  const gravityWarning = useMemo(
    () => (og > 1 ? BrewingMath.efficiencyAtGravity(efficiency, og) : null),
    [og, efficiency]
  );

  /**
   * Volumes d'eau, déduits du grain tant que Gaëtan ne les a pas posés.
   *
   * ⚠️ Deux corrections. Le calcul est celui de `BrewingMath.waterVolumes` — le
   * seul modèle, celui qui compte l'absorption du grain (~0.96 L/kg) ; la
   * version d'ici posait `rinçage = volume × 1.25 − empâtage` et l'oubliait,
   * soit 4.5 L d'écart sur 6 kg de grain. Et il se REJOUE quand la facture, le
   * volume ou le type de rinçage changent, au lieu de se figer au premier
   * remplissage.
   */
  /**
   * L'installation, épaisseur de maische reprise à la main si elle l'a été.
   *
   * ⚠️ Un seul objet, partagé par les TROIS appels à `waterVolumes` : le calcul
   * automatique, le recalcul du rinçage et l'écart affiché. Trois listes
   * d'arguments recopiées divergeaient à la première correction.
   */
  const rig = useMemo(
    () =>
      mashRatioOverride && mashRatioOverride > 0
        ? { ...brewhouse, mashRatioLPerKg: mashRatioOverride }
        : brewhouse,
    [brewhouse, mashRatioOverride]
  );

  /** Ce que le houblon boira dans la cuve — le houblonnage à cru en est exclu. */
  const kettleHopG = useMemo(() => kettleHopGrams(hops), [hops]);

  useEffect(() => {
    if (volumesEdited || totalGrist <= 0) return;
    const v = BrewingMath.waterVolumes(
      totalGrist,
      volumeL,
      rig,
      spargeType,
      boilMin,
      kettleHopG
    );
    setWater((w) =>
      w.mashWaterL === v.mashWaterL && w.spargeWaterL === v.spargeWaterL
        ? w
        : { ...w, mashWaterL: v.mashWaterL, spargeWaterL: v.spargeWaterL }
    );
  }, [totalGrist, volumeL, rig, spargeType, boilMin, kettleHopG, volumesEdited]);

  /**
   * Les deux doses d'acide, calculées ici pour être ENREGISTRÉES.
   *
   * Même chaîne que l'atelier de l'eau, et par les mêmes fonctions du domaine :
   * les sels alcalins ne comptent que dans l'eau d'empâtage, l'acide de rinçage
   * ne voit que l'eau de rinçage.
   */
  /**
   * Le plan d'eau COMPLET, calculé une fois pour tout le monde.
   *
   * ⚠️ Il ne servait qu'à enregistrer les deux doses d'acide. Le récapitulatif,
   * lui, n'affichait que trois volumes : le brasseur arrivait à la dernière
   * page sans savoir combien d'osmosée préparer, quel profil il visait, ni
   * quels sels peser — il fallait remonter à l'étape 6 pour les relire.
   */
  const waterRecap = useMemo(() => {
    const spargeDi = water.spargeDiRatioPct ?? water.diRatioPct;
    const allSaltsInMash = water.allSaltsInMash !== false;
    const band = targetRaForGrist(color?.ebc ?? null, grains,
      totalGrist > 0 ? water.mashWaterL / totalGrist : 0);
    const treatment = calculateWaterTreatment(waterSource, water, band);
    const alkaliGoal = alkalineSaltGoal(band, raSaltCeilingForGrist(grains,
      totalGrist > 0 ? water.mashWaterL / totalGrist : 0));
    const r1 = (n: number) => Math.round(n * 10) / 10;

    /* La cible saisie l'emporte sur le style de la liste — comme dans l'atelier. */
    const style = water.customTarget
      ? styleFromTargetIons(water.customTarget.ions, water.customTarget.name)
      : styleByCode(water.styleCode);

    return {
      sourceName: waterSource.name,
      styleName: style.name,
      style,
      sourceIons: waterSource,
      startIons: treatment.startTotal,
      wortIons: treatment.treatedTotal,
      mashWaterL: water.mashWaterL,
      spargeWaterL: water.spargeWaterL,
      diRatioPct: water.diRatioPct,
      spargeDiRatioPct: spargeDi,
      spargeLinked: water.spargeDiRatioPct === undefined,
      allSaltsInMash,
      /* Les litres d'osmosée à préparer, eau par eau. C'est la donnée qu'on
         emporte au bidon — le pourcentage ne se verse pas. */
      mashOsmoseeL: r1((water.mashWaterL * water.diRatioPct) / 100),
      spargeOsmoseeL: r1((water.spargeWaterL * spargeDi) / 100),
      mashIons: treatment.treated.mash,
      spargeIons: treatment.treated.sparge,
      ra: Math.round(treatment.raAfter),
      raBefore: Math.round(treatment.raBefore),
      raBand: band,
      raSaltTarget: alkaliGoal.limitedByGrist ? alkaliGoal.target : undefined,
      ratio: treatment.ratio,
      doses: water.doses,
      split: treatment.split,
      acidId: water.acidId,
      mashAcid: treatment.mashAcid,
      spargeAcid: treatment.spargeAcid,
      disabled: water.disabled,
      mashPh: water.mashPh,
      spargePh: water.spargePh
    };
  }, [waterSource, water, color, grains, totalGrist]);

  const waterAcid = useMemo(
    () => ({
      id: waterRecap.acidId,
      mash: waterRecap.mashAcid.amount,
      sparge: waterRecap.spargeAcid.amount
    }),
    [waterRecap]
  );

  /** Une saisie manuelle de volume fige les volumes : le grain ne les pilote plus. */
  const onWaterChange = (next: WaterState) => {
    if (next.styleCode !== water.styleCode || next.customTarget !== water.customTarget) {
      waterProfileAuto.current = false;
    }
    if (next.mashWaterL !== water.mashWaterL || next.spargeWaterL !== water.spargeWaterL) {
      setVolumesEdited(true);
    }
    if (next.allSaltsInMash !== water.allSaltsInMash || JSON.stringify(next.doses) !== JSON.stringify(water.doses)) {
      next = { ...next, saltSplit: undefined };
    }
    setWater(next);
  };

  /**
   * Couper ou remettre l'eau de rinçage, depuis l'atelier de l'eau.
   *
   * ⚠️ Le recalcul est FORCÉ, `volumesEdited` ou non. Le verrou a sa raison
   * d'être — le brasseur a le dernier mot sur un volume qu'il a posé — mais il
   * rendait ce réglage-ci inopérant : couper le rinçage après avoir touché un
   * volume ne faisait alors strictement rien, alors que c'est précisément le
   * changement qui doit reverser tout le volume dans la maische.
   */
  const setNoSparge = (next: boolean) => {
    setSpargeType(next ? 'none' : 'batch');
    const v = BrewingMath.waterVolumes(
      totalGrist,
      volumeL,
      rig,
      next ? 'none' : 'batch',
      boilMin,
      kettleHopG
    );
    if (v.mashWaterL > 0) {
      setWater((w) => ({ ...w, mashWaterL: v.mashWaterL, spargeWaterL: v.spargeWaterL }));
      setVolumesEdited(false);
    } else {
      // Sans grain, aucun volume à déduire : on se contente de vider le rinçage.
      setWater((w) => ({ ...w, spargeWaterL: next ? 0 : w.spargeWaterL }));
    }
  };

  /**
   * Ce que les volumes VAUDRAIENT d'après la facture de grain.
   *
   * ⚠️ Un volume saisi à la main fige le calcul — c'est normal, le brasseur a le
   * dernier mot. Mais s'il ajoute ensuite deux kilos de malt, les volumes ne
   * suivent plus, et comme les sels se dosent au litre, toutes les doses
   * deviennent silencieusement fausses. On ne réécrit rien : on montre l'écart
   * et on laisse un geste pour le corriger.
   */
  const suggestedVolumes = useMemo(
    () => BrewingMath.waterVolumes(totalGrist, volumeL, rig, spargeType, boilMin, kettleHopG),
    [totalGrist, volumeL, rig, spargeType, boilMin, kettleHopG]
  );

  /*
   * ⚠️ Le seuil était à 0.5 L, ce qui déclenchait une alerte pleine largeur
   * pour 18.5 contre 18.6 L — un dixième de litre, soit moins que ce qui reste
   * dans le tuyau. Une alerte qui se lève pour rien apprend à ne plus la lire.
   *
   * Un litre et demi, c'est le point où la minéralité bouge assez pour se
   * goûter : sur 30 L d'eau, 1.5 L d'écart, ce sont 5 % de concentration en
   * plus ou en moins sur TOUS les ions à la fois.
   */
  /*
   * ⚠️ ET LE TOTAL, pas seulement chaque champ. Comparés séparément, deux
   * écarts de 1.4 L passaient tous deux sous le seuil pendant que la somme
   * dérivait de 2.8 L. Or c'est le TOTAL qui décide du moût collecté avant
   * ébullition — le chiffre que la feuille d'eau affiche comme objectif. Deux
   * demi-fautes tolérées font une faute entière que personne ne signale.
   */
  const volumesStale =
    volumesEdited &&
    totalGrist > 0 &&
    (Math.abs(suggestedVolumes.mashWaterL - water.mashWaterL) > 1.5 ||
      Math.abs(suggestedVolumes.spargeWaterL - water.spargeWaterL) > 1.5 ||
      Math.abs(
        suggestedVolumes.mashWaterL +
          suggestedVolumes.spargeWaterL -
          (water.mashWaterL + water.spargeWaterL)
      ) > 1.5);

  /**
   * Ce qui manque en stock pour brasser cette recette.
   *
   * ⚠️ On CUMULE d'abord, on compare ensuite. Un même ingrédient revient
   * plusieurs fois dans une recette — le Citra d'une NEIPA est au whirlpool ET
   * à cru — mais il n'y a qu'un seul sachet dans le frigo. Comparer chaque
   * ligne au stock séparément laisse passer 40 g puis 60 g face à 70 g en
   * réserve : les deux tests réussissent, l'écran annonce « tout est
   * disponible », et il manque 30 g qu'on découvre le jour du houblonnage à
   * cru. C'est le besoin TOTAL qui doit tenir dans le stock.
   *
   * La clé de cumul porte le nom ET l'unité : deux ingrédients homonymes qui
   * ne se comptent pas pareil ne s'additionnent pas.
   */
  const shortages = useMemo(() => {
    const besoins = new Map<string, { name: string; needed: number; unit: string }>();
    const add = (ingName: string, qty: number, unit: string) => {
      if (!ingName) return;
      const cle = `${ingName.trim().toLowerCase()}|${unit}`;
      const deja = besoins.get(cle);
      if (deja) deja.needed += qty;
      else besoins.set(cle, { name: ingName.trim(), needed: qty, unit });
    };

    fermentables.forEach((f) => add(f.name, f.weightKg, 'kg'));
    hops.forEach((h) => add(h.name, h.weightG, 'g'));
    // La levure se compte en sachets : c'est le BESOIN calculé qu'on confronte
    // au stock, pas la quantité saisie — sous-ensemencer est un vrai risque.
    if (yeast.name) {
      add(yeast.name, pitch && yeast.unit === 'sachet' ? pitch.sachetsDry : yeast.qty, yeast.unit);
    }

    const need: Array<{ name: string; needed: number; unit: string; have: number }> = [];
    besoins.forEach((b) => {
      const item = stockItems.find((s) => s.name.toLowerCase() === b.name.toLowerCase());
      const have = item ? Units.convertOrSame(item.currentStock, item.unit, b.unit) : 0;
      if (have < b.needed) need.push({ ...b, have });
    });
    return need;
  }, [fermentables, hops, yeast, pitch, stockItems]);

  /*
   * Quel programme est en place ?
   *
   * ⚠️ On le RECONNAÎT au lieu de le retenir. Garder l'identifiant du dernier
   * programme chargé mentirait dès la première retouche : on charge « Paliers
   * lager », on remonte un palier de deux degrés, et la pastille continuerait
   * d'annoncer une lager alors que les paliers n'en sont plus. En comparant ce
   * qui est réellement saisi, la marque disparaît dès que le brasseur s'écarte
   * du programme — et revient s'il retombe dessus.
   *
   * La comparaison porte sur ce qui BRASSE : températures, durées, type de
   * rinçage. Le nom d'un palier est libre et ne change rien à la bière.
   */
  const activeMashProgram = useMemo(() => {
    const sig = (steps: TempStep[], sparge: string) =>
      `${steps.map((s) => `${s.tempC}/${s.durationMin}`).join('|')}#${sparge}`;
    const ici = sig(mashSteps, spargeType);
    return MASH_PROGRAMS.find((p) => sig(p.steps, p.spargeType) === ici)?.id ?? null;
  }, [mashSteps, spargeType]);

  const activeFermentProgram = useMemo(() => {
    const sig = (steps: FermentationStep[]) =>
      steps.map((s) => `${s.kind}/${s.tempC}/${s.days}`).join('|');
    const ici = sig(ferment);
    return FERMENT_PROGRAMS.find((p) => sig(p.steps) === ici)?.id ?? null;
  }, [ferment]);

  // --- Actions --------------------------------------------------------------
  const addFermentable = (ingName: string, item?: StockItem) => {
    if (!ingName || fermentables.some((f) => f.name === ingName && f.kind === addKind)) return;
    /*
     * ⚠️ AU CLAVIER, LE CURSEUR SUIT.
     *
     * Demandé ainsi : « pour les malts sur PC, je veux juste avoir à taper le
     * nom et la quantité au clavier ». Le nom se tapait déjà — la liste se
     * valide à Entrée — mais il fallait ensuite lâcher le clavier et aller
     * chercher le champ de poids à la souris. On mémorise donc le rang à
     * ouvrir, et sa quantité prend le focus dès qu’elle est montée.
     *
     * ⚠️ Uniquement au pointeur FIN. Sur un téléphone, donner le focus à un
     * champ fait monter le clavier par-dessus la liste qu’on vient d’utiliser :
     * ce qui accélère la saisie au clavier la gênerait au doigt.
     */
    if (!coarse) setFocusFermentable(fermentables.length);
    const def = KIND_DEF[addKind];
    setFermentables([
      ...fermentables,
      {
        name: ingName,
        // Zéro, pas une quantité plausible : c'est au brasseur de la poser.
        weightKg: 0,
        kind: addKind,
        use: def.use,
        fermentabilityPct: def.fermentability,
        colorEbc: item?.colorEbc ?? (addKind === 'grain' ? undefined : 0),
        potentialPpg: item?.potentialPpg ?? def.ppg,
        ...(def.use === 'fermentation' ? { dayOffset: 3 } : {})
      }
    ]);
  };

  const patchFermentable = (index: number, patch: Partial<Fermentable>) =>
    setFermentables(fermentables.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  /**
   * Reprend une recette collée.
   *
   * Ce qui a été lu écrase ; ce qui manque laisse en place ce qui existait
   * déjà. Un import ne doit jamais VIDER un champ que Gaëtan avait rempli.
   */
  const applyImport = (r: ImportedRecipe) => {
    const has = (key: string) => r.complete || (r.present.includes(key) &&
      (!Array.isArray(r[key]) || r[key].length > 0));
    const content = readRecipeFields(r);
    setDetails(previous => r.complete ? content : {
      ...previous, ...content,
      mash: content.mash ? { ...previous.mash, ...content.mash } : previous.mash,
      waterPlan: content.waterPlan ? { ...previous.waterPlan, ...content.waterPlan } : previous.waterPlan
    });
    if (r.name != null) setName(r.name);
    if (r.style != null) setStyle(r.style);
    if (r.volumeL != null) setVolumeL(r.volumeL);
    if (r.boilMin != null) setBoilMin(r.boilMin);
    if (r.brewDate != null || r.complete) setBrewDate(r.brewDate ?? '');
    if (has('fermentables')) setFermentables(r.fermentables);
    if (has('hops')) setHops(r.hops);
    if (r.yeast) setYeast(r.yeast);
    if (r.mashSteps.length || r.complete) setMashSteps(r.mashSteps);
    if (has('fermentation')) setFerment(r.fermentation);
    if (r.mash?.spargeType != null || r.complete) setSpargeType(r.mash?.spargeType ?? 'batch');
    if (r.mash?.ratioLPerKg != null || r.complete) setMashRatioOverride(r.mash?.ratioLPerKg ?? null);
    if (r.carboTarget != null || r.complete) setCarboTarget(r.carboTarget ?? '');
    else if (r.carboVolumes != null) setCarboTarget(r.carboVolumes + ' vol');
    if (r.instructions != null || r.waterNote || r.dryHopNote || r.complete) {
      setNotes([r.instructions, r.waterNote ? 'EAU — ' + r.waterNote : null,
        r.dryHopNote ? 'HOUBLONNAGE À CRU — ' + r.dryHopNote : null].filter(v => v != null).join('\n\n'));
    }
    const plan = r.waterPlan;
    if (r.complete) {
      waterProfileAuto.current = !plan?.targetProfileId && !plan?.targetIons && !r.waterTarget;
    } else if (plan?.targetProfileId != null || plan?.targetIons || r.waterTarget) {
      waterProfileAuto.current = false;
    }
    if (plan?.sourceSnapshot) setRecipeWaterSource(plan.sourceSnapshot);
    else if (plan?.sourceId) setRecipeWaterSource(config.waterSources?.find(source => source.id === plan.sourceId));
    else if (r.complete) setRecipeWaterSource(undefined);
    const mashL = plan?.mashWaterL ?? r.mashWaterL;
    const spargeL = plan?.spargeWaterL ?? r.spargeWaterL;
    if (mashL != null || spargeL != null || r.complete) setVolumesEdited(mashL != null || spargeL != null);
    const importedGrist = (has('fermentables') ? r.fermentables : fermentables)
      .filter(f => f.kind === 'grain').reduce((sum, f) => sum + f.weightKg, 0);
    setWater(w => {
      const next = r.complete ? {
        diRatioPct: 0, styleCode: styleWaterForName(r.style ?? '').code,
        doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 0, spargeWaterL: 0,
        allSaltsInMash: true
      } as WaterState : { ...w };
      if (r.style != null && waterProfileAuto.current && !next.customTarget) next.styleCode = styleWaterForName(r.style).code;
      if (mashL != null) next.mashWaterL = mashL;
      if (spargeL != null) next.spargeWaterL = spargeL;
      else if (r.preBoilL != null && mashL != null) next.spargeWaterL = Math.max(0, Math.round((r.preBoilL - mashL + importedGrist * 0.96) * 10) / 10);
      if (plan) {
        if (plan.diRatioPct != null) next.diRatioPct = plan.diRatioPct;
        if (plan.spargeDiRatioPct != null || r.complete) next.spargeDiRatioPct = plan.spargeDiRatioPct;
        if (plan.targetProfileId != null) next.styleCode = plan.targetProfileId;
        if (plan.allSaltsInMash != null) next.allSaltsInMash = plan.allSaltsInMash;
        else if (plan.sparge && Object.values(plan.sparge).some(g => g > 0)) next.allSaltsInMash = false;
        if (plan.mash || plan.sparge) {
          const split = { mash: plan.mash ?? {}, sparge: plan.sparge ?? {} };
          next.doses = mergeDoses(split.mash, split.sparge);
          next.saltSplit = customSaltSplit({ ...plan, mashWaterL: next.mashWaterL,
            spargeWaterL: next.spargeWaterL, allSaltsInMash: next.allSaltsInMash });
        }
        if (plan.disabled) next.disabled = plan.disabled;
        if (plan.acid) {
          next.acidId = plan.acid.id;
          next.acidOverride = plan.acidOverride ?? (plan.treatmentVersion === 2 ? undefined : { mash: plan.acid.mash, sparge: plan.acid.sparge });
        } else if (plan.acidOverride) next.acidOverride = plan.acidOverride;
        if (plan.measuredPh != null) next.mashPh = plan.measuredPh;
        if (plan.measuredSpargePh != null) next.spargePh = plan.measuredSpargePh;
        if (plan.targetIons) next.customTarget = { name: plan.targetName ?? 'Cible de la recette', ions: plan.targetIons };
      }
      if (r.waterTarget && Object.keys(r.waterTarget).length) {
        next.customTarget = { name: r.waterTargetName ?? 'Cible de la recette', ions: r.waterTarget };
        next.ratioOverride = undefined;
      }
      return next;
    });
    setTargetBasis(JSON.stringify([
      r.volumeL ?? volumeL, r.boilMin ?? boilMin,
      has('fermentables') ? r.fermentables : fermentables, has('hops') ? r.hops : hops,
      r.yeast ?? yeast, r.efficiencyPct ?? (r.complete ? brewhouse?.efficiencyPct ?? 75 : efficiency)
    ]));
    setStep('fermentescibles');
  };

  const addHop = (ingName: string, item?: StockItem) => {
    if (!ingName) return;
    // Même règle que les fermentescibles : au clavier, le poids prend le focus.
    if (!coarse) setFocusHop(hops.length);
    setHops([
      ...hops,
      {
        name: ingName,
        // L'alpha vient de l'article de stock — c'est celui du lot acheté.
        alpha: item?.alphaPct ?? 0,
        weightG: 0,
        stage: hopStage,
        ...(hopStage === 'boil' ? { timeMin: boilMin } : {}),
        ...(hopStage === 'whirlpool' ? { timeMin: 20, tempC: 80 } : {}),
        ...(hopStage === 'dryHop' ? { dayOffset: 3 } : {})
      }
    ]);
  };

  const patchHop = (index: number, patch: Partial<HopIngredient>) =>
    setHops(hops.map((h, i) => (i === index ? { ...h, ...patch } : h)));

  const selectYeast = (selectedName: string, item?: StockItem) => {
    setYeast(current => {
      if (current.name.trim().toLocaleLowerCase('fr') === selectedName.trim().toLocaleLowerCase('fr')) return current;
      const unit = item?.unit ?? 'sachet';
      return {
        ...current, name: selectedName, lab: item?.yeastLab, strain: item?.yeastStrain,
        form: item?.yeastForm ?? 'sèche', unit, qty: current.unit === unit ? current.qty : 1,
        attenuationPct: item?.yeastAttenuationPct,
        fermTempMinC: item?.yeastTempMinC, fermTempMaxC: item?.yeastTempMaxC,
        notes: undefined
      };
    });
  };

  const build = (): Recipe => ({
    id: draftRecipeId,
    version: base?.version,
    parentRecipeId: base?.parentRecipeId,
    name: name.trim(),
    style: style.trim(),
    volumeL,
    brewDate,
    boilMin,
    ogTarget: (keepTargets ? details.ogTarget : undefined) ?? ogPredicted ?? 0,
    // La densité finale tient compte de ce que la levure ne peut PAS manger.
    fgTarget: (keepTargets ? details.fgTarget : undefined) ?? fgPredicted ?? 0,
    abvTarget: keepTargets && details.abvTarget != null ? details.abvTarget :
      ogPredicted && fgPredicted
        ? BrewingMath.calculateABV(ogPredicted, fgPredicted)
        : 0,
    ibuTarget: (keepTargets ? details.ibuTarget : undefined) ?? ibu ?? undefined,
    colorEbc: details.colorEbc,
    efficiencyPct: details.efficiencyPct,
    preBoilL: rig?.equipment ? Math.round((water.mashWaterL+water.spargeWaterL-totalGrist*rig.equipment.grainAbsorptionLPerKg)*10)/10 : details.preBoilL,
    preBoilHotL: rig?.equipment ? Math.round((water.mashWaterL+water.spargeWaterL-totalGrist*rig.equipment.grainAbsorptionLPerKg)/(1-rig.equipment.coolingShrinkagePct/100)*10)/10 : details.preBoilHotL,
    brewhouse: rig?.equipment ? structuredClone(rig) : details.brewhouse,
    carboTarget: carboTarget.trim() || undefined,
    fermentables,
    totalGristKg: totalGrist,
    hops,
    yeast,
    adjuncts: details.adjuncts,
    mash: {
      steps: mashSteps,
      ratioLPerKg:
        totalGrist > 0 ? water.mashWaterL / totalGrist : mashRatioOverride ?? undefined,
      mashoutTempC: details.mash?.mashoutTempC ?? 76,
      mashoutDurationMin: details.mash?.mashoutDurationMin,
      heatingRateCPerMin: details.mash?.heatingRateCPerMin ?? rig?.equipment?.heatingRateCPerMin,
      spargeTempC: details.mash?.spargeTempC ?? 76,
      spargeType
    },
    waterPlan: {
      sourceId: waterSource.id,
      sourceSnapshot: { ...waterSource },
      treatmentVersion: 2,
      acidOverride: water.acidOverride,
      diRatioPct: water.diRatioPct,
      spargeDiRatioPct: water.spargeDiRatioPct,
      targetProfileId: water.styleCode,
      /*
       * ⚠️ La cible chiffrée et les DEUX eaux, figées avec le plan. Sans elles,
       * la fiche recette ne peut rien redessiner : il lui faudrait retrouver la
       * source dans la configuration et refaire tout le calcul — sur une analyse
       * qui a pu être corrigée depuis. Même principe que `recipeSnapshot`.
       */
      targetIons: water.customTarget?.ions,
      targetName: water.customTarget?.name,
      startIons: waterRecap.startIons,
      wortIons: waterRecap.wortIons,
      mashWaterL: water.mashWaterL,
      spargeWaterL: water.spargeWaterL,
      allSaltsInMash: water.allSaltsInMash !== false,
      ...waterRecap.split,
      /*
       * ⚠️ L'ACIDE, qui ne s'enregistrait pas. Le type le prévoyait, l'atelier
       * le calculait, l'écran l'affichait — et `build()` ne le recopiait pas.
       * Le brasseur arrivait à la cuve avec ses sels pesés et sans sa dose
       * d'acide, que la minuterie du jour ne pouvait pas lui rappeler.
       */
      acid: waterAcid,
      disabled: water.disabled,
      targetPh: details.waterPlan?.targetPh ?? 5.4,
      // Les pH relevés à la cuve : la seule boucle de retour du modèle.
      measuredPh: water.mashPh,
      measuredSpargePh: water.spargePh
    },
    fermentation: ferment,
    instructions: notes || undefined,
    steps: details.steps ?? [],
    notes: details.notes ?? [],
    notesCreation: details.notesCreation,
    favorite: base?.favorite
  });

  const hasMetrics = fermentables.length > 0 || hops.length > 0;

  /**
   * Ce que la durée d'ébullition COÛTE en eau, chiffré.
   *
   * ⚠️ L'indication disait « 60 min couvre la plupart des styles ; 75 à 90 pour
   * les recettes américaines ». Vrai, et inutile : ça ne se décide pas ici, ça
   * se lit sur la recette. Ce qu'un brasseur ne sait PAS de tête, c'est ce que
   * son quart d'heure de plus va lui coûter à la cuve — et c'est justement le
   * chiffre qui, depuis la correction du 04.09, dépend enfin de la durée.
   */
  const evaporationHint = useMemo(() => {
    const parHeure = brewhouse?.equipment?.boilOffLPerHour ?? (volumeL * (brewhouse?.boilOffRatePct ?? 10)) / 100;
    const perdu = Math.round(parHeure * (boilMin / 60) * 10) / 10;
    if (!(perdu > 0)) return undefined;
    return `${perdu} L évaporés — autant d’eau à prévoir en plus dans la cuve.`;
  }, [volumeL, boilMin, brewhouse]);
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const resizeForEquipment=()=>{
    try {
      if(!brewhouse)return;
      const resized=adaptRecipeEquipment(build(),brewhouse,defaultBrewVolume(brewhouse));
      applyImport(normalizeRecipeImport(resized,'local',true));
      setStep('identite');
      setEquipmentNotice(`Recette adaptée à ${resized.volumeL} L : ingrédients, eaux, sels et acide recalculés.`);
    }catch(e){setEquipmentNotice(e instanceof Error?e.message:'Adaptation impossible.');}
  };
  const canAdvance = step !== 'identite' || name.trim().length > 1;

  const go = (delta: 1 | -1) => {
    const next = STEPS[stepIndex + delta];
    if (next) setStep(next.id);
  };

  const mobileHeader = (
    <div className="px-2.5 py-1.5 flex items-center gap-2 bg-cave-950">
      {/* Bouton retour compact + Barre de progression des 6 étapes + Bouton Import */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="w-7 h-7 -ml-1 rounded-control flex items-center justify-center text-cave-400 hover:text-cave-50 active:bg-cave-850 shrink-0 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <nav aria-label="Étapes" className="flex-1 flex gap-1 items-center">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            aria-current={s.id === step ? 'step' : undefined}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-ebc-straw' : 'bg-cave-800'
            }`}
          >
            <span className="sr-only">{s.label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setImporting(true)}
        aria-label="Coller une recette"
        className="w-7 h-7 rounded-control flex items-center justify-center text-cave-400 hover:text-ebc-straw active:bg-cave-850 shrink-0 transition-colors"
      >
        <ClipboardPaste className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <PageShell
      title={base ? `Modifier « ${base.name} »` : 'Nouvelle recette'}
      subtitle={STEPS[stepIndex].label}
      onClose={onClose}
      mobileHeader={mobileHeader}
      /* Le fil d'étapes vit dans l'en-tête : il ne coûte plus une rangée. */
      progress={
        <nav aria-label="Étapes" className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              aria-current={s.id === step ? 'step' : undefined}
              className={`flex-1 h-1 sm:h-1.5 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-ebc-straw' : 'bg-cave-800'
              }`}
            >
              <span className="sr-only">{s.label}</span>
            </button>
          ))}
        </nav>
      }
      footer={
        step === 'recap' ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSave(build(), false)}
              className="flex-1 min-h-[40px] sm:min-h-touch rounded-control border border-cave-700
                         text-cave-100 text-xs sm:text-sm font-semibold transition-colors hover:bg-cave-850"
            >
              Enregistrer la recette
            </button>
            <button
              type="button"
              onClick={() => onSave(build(), true)}
              className="flex-1 min-h-[40px] sm:min-h-touch rounded-control bg-ebc-straw text-cave-950 text-xs sm:text-sm font-semibold transition-colors hover:brightness-105"
            >
              Lancer le brassin
            </button>
          </div>
        ) : undefined
      }
    >
      {/*
        ⚠️ LE BANDEAU DE MESURES, ENFIN SUR TÉLÉPHONE.

        Il portait `hidden sm:grid` : au doigt — c'est-à-dire toujours, en
        cuverie — on saisissait quatre malts et huit houblons SANS jamais voir
        bouger l'OG, l'IBU ou la couleur. Il fallait aller jusqu'au
        récapitulatif pour découvrir qu'on visait 1.075 au lieu de 1.061, et
        remonter quatre étapes.

        Sur mobile il tient sur UNE ligne, collée sous la barre d'étapes : ce
        sont les quatre chiffres qu'un brasseur regarde en composant sa facture,
        et rien d'autre.
      */}
      {hasMetrics && (
        <div
          className={`panel px-2.5 py-1.5 sm:px-4 sm:py-2.5 items-baseline justify-between gap-2
                     sm:grid sm:grid-cols-4 sm:gap-3 sm:items-stretch ${step === 'eau' ? 'hidden' : 'flex'}`}
        >
          <div className="flex items-baseline gap-1 sm:flex-col sm:gap-0">
            <span className="text-2xs text-cave-400">Grain</span>
            <span className="reading text-2xs sm:text-base">{Units.format(totalGrist, 'kg')}</span>
          </div>
          <div className="flex items-baseline gap-1 sm:flex-col sm:gap-0">
            <span className="text-2xs text-cave-400">OG</span>
            <span className="reading text-2xs sm:text-base text-ebc-straw">
              {ogPredicted ? ogPredicted.toFixed(3) : '—'}
            </span>
          </div>
          <div className="flex items-baseline gap-1 sm:flex-col sm:gap-0">
            <span className="text-2xs text-cave-400">IBU</span>
            <span className="reading text-2xs sm:text-base">{ibu ?? '—'}</span>
          </div>
          <div className="flex items-baseline gap-1 sm:flex-col sm:gap-0">
            <span className="text-2xs text-cave-400">EBC</span>
            <span className="flex items-center gap-1">
              {color && (
                <span
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-cave-700 ${color.swatch}`}
                  aria-hidden
                />
              )}
              <span className="reading text-2xs sm:text-base">{color?.ebc ?? '—'}</span>
            </span>
          </div>
        </div>
      )}

      <BrewerChat scope={{kind:'draft',id:draftRecipeId}} label={name || 'Nouvelle recette'} phase={STEPS[stepIndex].label} draft={build()} />
      {/* ---------------------------------------------------- ÉTAPE 1 */}
      {step === 'identite' && (
        <>
          {/*
            Le chemin le plus rapide vers une recette complète : la coller.
            Ressaisir quatre malts, huit ajouts de houblon avec leur moment, la
            levure et les paliers prend vingt minutes et se trompe.
          */}
          <button
            type="button"
            onClick={() => setImporting(true)}
            className="w-full min-h-[36px] sm:min-h-touch rounded-control border border-ebc-straw/50
                       text-ebc-straw text-xs sm:text-sm font-medium flex items-center justify-center gap-2 py-1.5"
          >
            <ClipboardPaste className="w-4 h-4 sm:w-5 sm:h-5" />
            Coller une recette trouvée
          </button>

          <Section title="Identité">
          <FormNav className="space-y-2.5 sm:space-y-3.5" onSubmit={() => go(1)}>
            <Field label="Nom de la bière" htmlFor="wz-title">
              <TextInput
                id="wz-title"
                name="recipe_title_label"
                placeholder="Milk Stout #2, NEIPA Tropicale…"
                value={name}
                onChange={setName}
              />
            </Field>

            <Field label="Style">
              <Combobox
                value={style}
                onChange={changeStyle}
                options={knownStyles.map((s) => ({ value: s, label: s }))}
                placeholder="NEIPA, Stout, Saison…"
                ariaLabel="Style de la bière"
                allowCreate
                onCreate={changeStyle}
                createLabel={(v) => `Nouveau style « ${v} »`}
              />
            </Field>

            <SliderField
              label="Volume en fermenteur"
              value={volumeL}
              onChange={setVolumeL}
              min={10}
              max={60}
              step={1}
              unit="L"
              readout={
                brewhouse && volumeL === brewhouse.volumeL
                  ? `installation « ${brewhouse.name} »`
                  : undefined
              }
              marks={[
                { value: 20, label: '20' },
                { value: 30, label: '30' },
                { value: 50, label: '50' }
              ]}
            />

            {brewhouse?.equipment&&<div className="space-y-2">
              <p className="text-sm text-water">Fermenteur {brewhouse.equipment.fermenterCapacityL} L · cible utile {fermenterLimit(brewhouse.equipment)} L, mousse réservée.</p>
              {volumeL!==defaultBrewVolume(brewhouse)&&<button type="button" className="equipment-button" onClick={resizeForEquipment}>Adapter la recette à {defaultBrewVolume(brewhouse)} L</button>}
              {equipmentNotice&&<p role="status" className="text-sm text-ebc-straw">{equipmentNotice}</p>}
              <BrewEquipmentSummary recipe={build()} profile={brewhouse}/>
            </div>}

            <SliderField
              label="Durée d’ébullition"
              value={boilMin}
              onChange={setBoilMin}
              min={30}
              max={120}
              step={5}
              unit="min"
              hint={evaporationHint}
              marks={[
                { value: 60, label: '60' },
                { value: 75, label: '75' },
                { value: 90, label: '90' }
              ]}
            />

            <DateField label="Date de brassage prévue" value={brewDate} onChange={setBrewDate} />
          </FormNav>
          </Section>
        </>
      )}

      {/* ---------------------------------------------------- ÉTAPE 2 */}
      {step === 'fermentescibles' && (
        <Section
          title="Fermentescibles"
          hint="La famille décide de ce que la levure pourra en faire — le lactose ne fermente pas, le sucre à 100 %."
        >
          <div className="space-y-2 sm:space-y-3">
            {/*
              ⚠️ Cinq cases en grille pesaient deux cent vingt pixels — le quart
              d'un écran de téléphone — pour un réglage qu'on touche une fois
              par recette, et qui vaut « grain » neuf fois sur dix. La pastille
              rotative tient sur la ligne de son propre texte, et l'explication
              de la famille courante se lit juste à côté au lieu d'en dessous.
            */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xs text-cave-400 shrink-0">Ajouter</span>
              <CycleTag<FermentableKind>
                name="Famille de fermentescible"
                value={addKind}
                options={FERMENTABLE_KINDS}
                onChange={setAddKind}
                label={(k) => KIND_DEF[k].label}
                tone={(k) => KIND_TONE[k]}
              />
              {!tight && (
                <span className="text-2xs text-cave-500 leading-snug min-w-0">
                  {KIND_DEF[addKind].hint}
                </span>
              )}
            </div>

            <IngredientPicker
              categories={KIND_DEF[addKind].stock}
              items={stockItems}
              value=""
              onChange={addFermentable}
              onCreate={(n) => {
                const created = onCreateStockItem(n, KIND_DEF[addKind].newCat, 'kg');
                addFermentable(created.name, created);
              }}
              placeholder={`Ajouter — ${KIND_DEF[addKind].label.toLowerCase()}…`}
              ariaLabel={`Ajouter un fermentescible de la famille ${KIND_DEF[addKind].label}`}
            />

            {fermentables.length === 0 ? (
              <p className="text-xs sm:text-sm text-cave-500 py-1">
                Rien encore. Le grain se pose ici, puis les sucres et le lactose si la recette
                en demande.
              </p>
            ) : (
              <ul className="space-y-1 sm:space-y-2">
                {fermentables.map((f, i) => {
                  return (
                    <li
                      key={`${f.name}-${f.kind}-${i}`}
                      className="panel p-1.5 sm:p-2.5 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm sm:text-base font-semibold text-cave-100 truncate">{f.name}</span>
                          {/*
                            ⚠️ La famille NE TOURNE PAS. Elle l'a fait un temps,
                            et c'était une faute : rien n'empêchait de classer un
                            Maris Otter en « lactose », ce qui le fait passer à
                            0 % de fermentescibilité et remonte la densité finale
                            prévue de plusieurs points — sur un malt qui, en
                            vrai, fermente entièrement. La famille se décide au
                            moment d'ajouter, où elle choisit le rayon du stock ;
                            ici elle se lit, et se corrige en retirant la ligne.

                            Ce qui la remplace pour un grain, c'est sa CLASSE DE
                            COULEUR. C'est l'information qu'on cherche en relisant
                            une facture de grain : base, ambré, brun ou torréfié
                            disent en un mot ce que le malt apporte, là où « 120
                            EBC » demande de connaître l'échelle par cœur.

                            Le MOMENT, lui, tourne — comme l'étape d'un houblon.
                          */}
                          <span className="flex items-center gap-1 flex-wrap mt-0.5">
                            {f.kind !== 'grain' && <span className="text-2xs text-cave-300">{KIND_DEF[f.kind].label}</span>}
                            <CycleTag
                              name={`Moment de ${f.name}`}
                              value={f.use}
                              options={FERMENTABLE_USES}
                              onChange={(u) => patchFermentable(i, { use: u })}
                              label={(u) => USE_LABEL[u]}
                              tone={(u) => USE_TONE[u]}
                            />
                            <span className="text-2xs text-cave-500 truncate">
                              {f.kind === 'grain'
                                ? totalGrist > 0
                                  ? `${((f.weightKg / totalGrist) * 100).toFixed(0)} % du grain`
                                  : ''
                                : `${f.fermentabilityPct ?? 100} % ferm.`}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-32 sm:w-36">
                            <QuantityStepper
                              label=""
                              value={f.weightKg}
                              onChange={(v) => patchFermentable(i, { weightKg: v })}
                              unit="kg"
                              category="Malt"
                              compact
                              autoFocus={!coarse && focusFermentable === i}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setFermentables(fermentables.filter((_, j) => j !== i))}
                            aria-label={`Retirer ${f.name}`}
                            className="w-8 h-8 rounded-control text-cave-500 hover:text-alert flex items-center justify-center shrink-0 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {f.use === 'fermentation' && (
                        <div className="pt-1 border-t border-cave-850">
                          <Field
                            label="Jour d’ajout en fermentation"
                            hint="Le sucre ajouté après le départ de la fermentation ne stresse pas la levure."
                          >
                            <NumberInput
                              min={0}
                              value={f.dayOffset ?? 0}
                              onValue={(v) =>
                                patchFermentable(i, { dayOffset: v })}
                              integer
                              pad
                              className={inputClass}
                            />
                          </Field>
                        </div>
                      )}

                      {f.kind === 'lactose' && f.weightKg > 0 && (
                        <p className="text-2xs sm:text-sm text-ebc-amber leading-snug">
                          Non fermentescible : il remonte la densité finale et reste en bouche.
                        </p>
                      )}

                      {f.kind === 'grain' && <MaltDetails malt={f}
                        onChange={patch => patchFermentable(i, patch)}
                        onLearnIngredient={onLearnIngredient} />}
                    </li>
                  );
                })}
              </ul>
            )}

            {gravityWarning?.note && (
              <p className="flex items-start gap-2 text-2xs sm:text-sm text-ebc-amber leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{gravityWarning.note}</span>
              </p>
            )}
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------- ÉTAPE 3 */}
      {step === 'houblons' && (
        <Section
          title="Houblons"
          hint="Un même houblon à deux moments fait DEUX lignes : 28 g au whirlpool et 85 g à cru ne sont pas 113 g."
        >
          <div className="space-y-2 sm:space-y-3">
            <SegmentedControl
              label="Moment d’ajout"
              layout="grid"
              value={hopStage}
              onChange={setHopStage}
              options={HOP_STAGES.map((s) => ({ value: s, label: HOP_STAGE[s].label }))}
            />
            {!tight && <p className="text-2xs sm:text-sm text-cave-500 leading-snug">{HOP_STAGE[hopStage].hint}</p>}

            <IngredientPicker
              categories={['Houblon']}
              items={stockItems}
              value=""
              onChange={addHop}
              onCreate={(n) => {
                const created = onCreateStockItem(n, 'Houblon', 'g');
                addHop(created.name, created);
              }}
              placeholder={`Ajouter un houblon en ${HOP_STAGE[hopStage].label.toLowerCase()}…`}
              ariaLabel={`Ajouter un houblon en ${HOP_STAGE[hopStage].label.toLowerCase()}`}
            />

            {hops.length === 0 ? (
              <p className="text-xs sm:text-sm text-cave-500 py-1">Aucun houblon.</p>
            ) : (
              <ul className="space-y-1.5 sm:space-y-2">
                {hops.map((h, i) => {
                  const style = HOP_STAGE[h.stage];
                  return (
                    <li key={`${h.name}-${h.stage}-${i}`} className="panel p-2 sm:p-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm sm:text-base font-semibold text-cave-100 truncate">{h.name}</span>
                          {/*
                            ⚠️ Le moment ne s'écrit plus DEUX FOIS. Quand la
                            carte porte ses champs — durée, température, jour —
                            ce sont eux la description : répéter « 20 min à
                            82 °C » juste au-dessus des deux champs qui portent
                            20 et 82 ne servait qu'à faire une ligne de plus.
                            La phrase ne reste que pour les moments qui n'ont
                            rien à régler.
                          */}
                          <span className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {/*
                              ⚠️ Le moment se CHANGE ici, d'un appui. Avant, se
                              tromper de moment obligeait à supprimer la ligne
                              et à la ressaisir depuis le sélecteur du haut —
                              nom, poids, alpha, tout. Or c'est l'erreur la plus
                              fréquente après un import.
                            */}
                            <CycleTag
                              name={`Moment de ${h.name}`}
                              value={h.stage}
                              options={HOP_STAGES}
                              onChange={(st) => patchHop(i, { stage: st })}
                              label={(st) => HOP_STAGE[st].label}
                              tone={(st) => HOP_STAGE[st].tone}
                            />
                            {!style.ask && (
                              <span className="text-2xs text-cave-400 truncate">
                                {describeMoment(h)}
                              </span>
                            )}
                            {style.bitters && h.alpha > 0 && og > 1 && (
                              <span className="text-2xs text-cave-300 font-mono">
                                {BrewingMath.hopIbu(h, volumeL, og, boilMin).toFixed(1)} IBU
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-32 sm:w-36">
                            <QuantityStepper
                              label=""
                              value={h.weightG}
                              onChange={(v) => patchHop(i, { weightG: v })}
                              unit="g"
                              category="Houblon"
                              compact
                              autoFocus={!coarse && focusHop === i}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setHops(hops.filter((_, j) => j !== i))}
                            aria-label={`Retirer ${h.name}`}
                            className="w-8 h-8 rounded-control text-cave-500 hover:text-alert flex items-center justify-center shrink-0 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/*
                        ⚠️ Trois `Field` empilés — étiquette, champ, indication —
                        faisaient neuf lignes sur une carte de houblon. Couchés,
                        ils tiennent sur une, et se lisent comme une phrase de
                        brasseur : « α 8.6 % · 20 min · 82 °C ».

                        Les indications supprimées disaient ce que l'étiquette
                        disait déjà (« Sur le sachet du lot », « Pilote
                        l'amertume »). Celle du jour en cuve, elle, apprend
                        quelque chose : elle passe en suffixe.
                      */}
                      {(style.bitters || style.ask) && (
                        <div className="flex items-center gap-2 pt-1 border-t border-cave-850">
                          {/*
                            ⚠️ LE CHAMP DISPARAISSAIT SOUS LE DOIGT.
                            Il était rendu sous condition `!h.alpha` : à la
                            première frappe, alpha cesse d'être nul, la
                            condition devient fausse et le champ se démonte —
                            AVANT que la sortie de champ ait pu borner la
                            valeur. Conséquences : on ne pouvait jamais écrire
                            « 12 » (le « 1 » faisait disparaître le champ), et
                            un « -5 » collé restait tel quel dans la recette,
                            où il RETRANCHAIT de l'amertume. Trouvé au fuzz de
                            saisie.

                            Il est maintenant toujours là sur les moments qui
                            amérisent — corriger un alpha faux est aussi
                            fréquent que d'en saisir un manquant — et l'ambre
                            ne signale que l'absence.
                          */}
                          {style.bitters && (
                            <div>
                              <InlineNum
                                label="α"
                                name={`Alpha de ${h.name} en pourcent`}
                                unit="%"
                                min={0}
                                max={100}
                                value={h.alpha}
                                onValue={(v) => patchHop(i, { alpha: v })}
                                missing={!h.alpha}
                              />
                            </div>
                          )}

                          {style.ask === 'time' && (
                            <div>
                              <InlineNum
                                label="fin −"
                                name={`Minutes avant la fin pour ${h.name}`}
                                unit="min"
                                min={0}
                                integer
                                value={h.timeMin ?? 0}
                                onValue={(v) => patchHop(i, { timeMin: v })}
                              />
                            </div>
                          )}

                          {style.ask === 'timeAndTemp' && (
                            <>
                              <div>
                                <InlineNum
                                  label="durée"
                                  name={`Durée de contact de ${h.name}`}
                                  unit="min"
                                  min={0}
                                  integer
                                  value={h.timeMin ?? 20}
                                  onValue={(v) => patchHop(i, { timeMin: v })}
                                />
                              </div>
                              <div>
                                <InlineNum
                                  label="à"
                                  name={`Température de whirlpool pour ${h.name}`}
                                  unit="°C"
                                  min={0}
                                  max={100}
                                  integer
                                  value={h.tempC ?? 80}
                                  onValue={(v) => patchHop(i, { tempC: v })}
                                />
                              </div>
                            </>
                          )}

                          {style.ask === 'day' && (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div>
                                <InlineNum
                                  label="jour"
                                  name={`Jour en cuve pour ${h.name}`}
                                  min={0}
                                  integer
                                  value={h.dayOffset ?? 0}
                                  onValue={(v) => patchHop(i, { dayOffset: v })}
                                />
                              </div>
                              <span className="text-2xs text-cave-500 shrink-0">
                                0 = à l’ensemencement
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Sans alpha, l'amertume de cette ligne ne compte pas. */}
                      <AiAssist
                        kind="houblon"
                        name={h.name}
                        missing={h.stage !== 'dryHop' && !h.alpha ? ['acides alpha'] : []}
                        onApply={(facts) => {
                          patchHop(i, applyHopFacts(h, facts));
                          onLearnIngredient(h.name, factsForStock('houblon', facts));
                        }}
                      />

                      {/*
                        ⚠️ « Aucune amertume — arôme seul » a disparu des cartes.
                        Elle s'écrivait sur CHACUN des houblons à cru : sur cette
                        NEIPA, trois fois la même phrase, à trois lignes
                        d'intervalle. C'est un fait général du houblonnage à cru,
                        pas une propriété de ce sachet-là — il est dit une fois,
                        dans le choix du moment.
                      */}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------- ÉTAPE 4 */}
      {step === 'levure' && (
        <Section title="Levure" hint="Souche, quantité, et la fenêtre de température à tenir.">
          <FormNav className="space-y-2.5 sm:space-y-3">
            <Field label="Souche">
              <IngredientPicker
                categories={['Levure']}
                items={stockItems}
                value={yeast.name}
                onChange={selectYeast}
                onCreate={(n) => {
                  const created = onCreateStockItem(n, 'Levure', 'sachet');
                  selectYeast(created.name, created);
                }}
                placeholder="US-05, Verdant IPA, WLP095…"
                /* Le placeholder énumère des exemples : il ne peut pas servir
                   de nom accessible, on le pose donc explicitement. */
                ariaLabel="Souche de levure"
              />
            </Field>

            <Field label="Forme de la levure">
              <SegmentedControl
                label="Forme de la levure"
                value={yeast.form}
                onChange={(f) =>
                  setYeast({
                    ...yeast,
                    form: f,
                    unit: f === 'liquide' ? 'flacon' : f === 'levain' ? 'L' : 'sachet'
                  })
                }
                options={[
                  { value: 'sèche', label: 'Sèche' },
                  { value: 'liquide', label: 'Liquide' },
                  { value: 'levain', label: 'Levain / Récup' }
                ]}
              />
            </Field>

            {/*
              ⚠️ Trois `Field` empilés deviennent trois lignes couchées.

              Chacun occupait un intitulé pleine largeur PUIS son champ en
              dessous — deux étages pour un nombre à deux chiffres. `InlineNum`
              pose le nom, le champ et l'unité sur la même ligne, comme sur les
              cartes de houblon.

              Le nom accessible vient d'`InlineNum` et non plus d'un `<label>`
              orphelin : `Field` posait bien « Quantité (sachet) », mais sans
              `htmlFor`, et le champ n'avait pas d'identifiant — les deux ne se
              connaissaient pas. Taper sur l'intitulé ne donnait donc pas le
              focus, ce qui au doigt se ressent comme un champ mort.
            */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <InlineNum
                label="Quantité"
                name={`Quantité de levure, en ${yeast.unit}`}
                unit={yeast.unit}
                min={0}
                value={yeast.qty}
                onValue={(v) => setYeast({ ...yeast, qty: v })}
              />
              <InlineNum
                label="Atténuation"
                name="Atténuation de la levure, en pourcent"
                unit="%"
                min={0}
                max={100}
                value={yeast.attenuationPct}
                onValue={(v) => setYeast({ ...yeast, attenuationPct: v })}
                missing={yeast.attenuationPct == null}
              />
            </div>

            <SliderField
              label="Température d’ensemencement"
              value={yeast.pitchTempC ?? 19}
              onChange={(v) => setYeast({ ...yeast, pitchTempC: v })}
              min={8}
              max={28}
              step={0.5}
              unit="°C"
              hint="Ensemencer plus chaud produit des faux-goûts."
            />

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <SliderField
                label="Fermentation — mini"
                value={yeast.fermTempMinC ?? 18}
                onChange={(v) => setYeast({ ...yeast, fermTempMinC: v })}
                min={8}
                max={30}
                step={0.5}
                unit="°C"
              />
              <SliderField
                label="Fermentation — maxi"
                value={yeast.fermTempMaxC ?? 22}
                onChange={(v) => setYeast({ ...yeast, fermTempMaxC: v })}
                min={8}
                max={30}
                step={0.5}
                unit="°C"
              />
            </div>

            <InlineNum
              label="Durée de fermentation"
              name="Durée de fermentation, en jours"
              unit="j"
              min={0}
              integer
              value={yeast.fermentDays}
              onValue={(v) => setYeast({ ...yeast, fermentDays: v })}
            />
          </FormNav>

          <AiAssist
            className="mt-2 sm:mt-3"
            kind="levure"
            name={yeast.name}
            missing={[
              yeast.attenuationPct == null ? 'atténuation' : null,
              yeast.fermTempMinC == null ? 'température minimale' : null,
              yeast.fermTempMaxC == null ? 'température maximale' : null,
              !yeast.lab ? 'laboratoire' : null
            ].filter(Boolean) as string[]}
            onApply={(f) => {
              setYeast(current => applyYeastFacts(current, f));
              onLearnIngredient(yeast.name, factsForStock('levure', f));
            }}
          />

          {pitch && (
            <div className="panel p-2.5 sm:p-3 mt-3 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm font-semibold text-cave-100">
                    Ensemencement
                  </span>
                  <span className="block text-2xs text-cave-400">
                    {pitch.degreesPlato} °P · {pitch.rate} M cell/mL/°P
                  </span>
                </span>
                <span className="reading text-base sm:text-xl text-ebc-straw shrink-0">
                  {pitch.cellsNeededB} Md
                </span>
              </div>

              <p
                className={`text-2xs sm:text-sm ${
                  yeast.unit === 'sachet' && yeast.qty < pitch.sachetsDry
                    ? 'text-ebc-amber'
                    : 'text-hop'
                }`}
              >
                {pitch.verdict}
              </p>

              {yeast.unit === 'sachet' && yeast.qty < pitch.sachetsDry && (
                <button
                  type="button"
                  onClick={() => setYeast({ ...yeast, qty: pitch.sachetsDry })}
                  className="w-full min-h-[34px] sm:min-h-touch rounded-control border border-ebc-straw/50
                             text-ebc-straw text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 py-1"
                >
                  <Beaker className="w-4 h-4" />
                  Passer à {pitch.sachetsDry} sachets
                </button>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ---------------------------------------------------- ÉTAPE 5 */}
      {step === 'paliers' && (
        <>
          <Section
            title="Empâtage"
            hint="Le palier de saccharification décide de la sécheresse de la bière."
          >
            <div className="space-y-2 sm:space-y-3">
              <PresetChips
                name="Programme d’empâtage"
                presets={MASH_PROGRAMS}
                id={(p) => p.id}
                label={(p) => p.name}
                purpose={(p) => p.purpose}
                activeId={activeMashProgram}
                onApply={(prog) => {
                  setMashSteps(prog.steps.map((s) => ({ ...s })));
                  setSpargeType(prog.spargeType);
                }}
              />

              <ul className="space-y-1.5">
                {mashSteps.map((s, i) => (
                  <li key={i} className="panel p-2 sm:p-2.5 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <TextInput
                        aria-label={`Nom du palier ${i + 1}`}
                        name={`mash_step_name_${i}`}
                        className={`${inputClass} flex-1 text-sm sm:text-base`}
                        value={s.name}
                        onChange={(val) =>
                          setMashSteps(
                            mashSteps.map((x, j) => (j === i ? { ...x, name: val } : x))
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setMashSteps(mashSteps.filter((_, j) => j !== i))}
                        aria-label={`Retirer le palier ${s.name}`}
                        className="w-8 h-8 rounded-control text-cave-500 hover:text-alert flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/*
                      ⚠️ Les deux champs portent un `aria-label` NOMMANT LE
                      PALIER. Trouvé en pilotant l'application : `Field` posait
                      bien une étiquette « Température (°C) », mais sans
                      `htmlFor`, et le champ n'avait pas d'identifiant — rien ne
                      les reliait. Deux conséquences, l'une invisible et l'autre
                      pas : au lecteur d'écran, les huit champs d'un empâtage à
                      quatre paliers s'annonçaient « champ de saisie », et
                      taper sur le libellé ne donnait pas le focus, ce qui sur
                      téléphone se ressent comme un champ qui ne répond pas.

                      Le nom porte le rang ET le nom du palier : « Température du
                      palier 2 — Saccharification ». Répété à l'identique, il
                      n'aurait rien désambiguïsé.
                    */}
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Température (°C)">
                        <NumberInput
                          aria-label={`Température du palier ${i + 1}${s.name ? ` — ${s.name}` : ''}, en degrés`}
                          min={0}
                          max={100}
                          value={s.tempC}
                          onValue={(v) =>
                            setMashSteps(
                              mashSteps.map((x, j) =>
                                j === i ? { ...x, tempC: v } : x
                              )
                            )}
                          pad
                          className={`${inputClass} font-mono text-center`}
                        />
                      </Field>
                      <Field label="Durée (min)">
                        <NumberInput
                          aria-label={`Durée du palier ${i + 1}${s.name ? ` — ${s.name}` : ''}, en minutes`}
                          min={0}
                          value={s.durationMin}
                          onValue={(v) =>
                            setMashSteps(
                              mashSteps.map((x, j) =>
                                j === i
                                  ? { ...x, durationMin: v }
                                  : x
                              )
                            )}
                          integer
                          pad
                          className={`${inputClass} font-mono text-center`}
                        />
                      </Field>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() =>
                  setMashSteps([...mashSteps, { name: 'Palier', tempC: 67, durationMin: 30 }])
                }
                className="w-full min-h-[36px] sm:min-h-touch rounded-control border border-cave-700
                           text-cave-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 py-1.5 hover:bg-cave-850 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un palier
              </button>

              <Field label="Rinçage">
                <SegmentedControl
                  label="Type de rinçage"
                  value={spargeType}
                  onChange={setSpargeType}
                  options={[
                    { value: 'batch', label: 'Par bacs' },
                    { value: 'fly', label: 'Continu' },
                    { value: 'none', label: 'Aucun' }
                  ]}
                />
              </Field>

              {attenuation != null && yeast.attenuationPct != null && (
                <p className="text-2xs sm:text-sm text-cave-400 leading-relaxed">
                  À {mashTemp} °C, atténuation attendue :{' '}
                  <span className="reading text-ebc-straw">{attenuation} %</span>
                  {fgPredicted ? ` · FG estimée ${fgPredicted.toFixed(3)}.` : '.'}
                </p>
              )}
            </div>
          </Section>

          <Section
            title="Fermentation"
            hint="Phases de fermentation et températures de consigne."
          >
            <div className="space-y-2 sm:space-y-3">
              <PresetChips
                name="Programme de fermentation"
                presets={FERMENT_PROGRAMS}
                id={(p) => p.id}
                label={(p) => p.name}
                purpose={(p) => p.purpose}
                activeId={activeFermentProgram}
                onApply={(prog) => setFerment(prog.steps.map((s) => ({ ...s })))}
              />

              <ul className="space-y-1.5">
                {ferment.map((s, i) => {
                  const phase = PHASE_LABEL[s.kind];
                  return (
                    <li key={i} className="panel p-2 sm:p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 flex-1">
                          <span
                            className={`inline-block text-2xs px-1.5 py-0.5 rounded-full border ${phase.tone}`}
                          >
                            {phase.label}
                          </span>
                          <span className="block text-sm sm:text-base text-cave-100 font-medium truncate mt-0.5">
                            {s.name}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setFerment(ferment.filter((_, j) => j !== i))}
                          aria-label={`Retirer ${s.name}`}
                          className="w-8 h-8 rounded-control text-cave-500 hover:text-alert flex items-center justify-center shrink-0 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {/*
                          Deux lignes couchées, comme les cartes de houblon. Le
                          nom porte la PHASE et non son rang : « Température de
                          Froid court » se distingue, « Température (°C) »
                          répété trois fois ne se distinguait pas.
                        */}
                        <InlineNum
                          label="T°"
                          name={`Température de la phase ${s.name || i + 1}, en degrés`}
                          unit="°C"
                          min={0}
                          value={s.tempC}
                          onValue={(v) =>
                            setFerment(ferment.map((x, j) => (j === i ? { ...x, tempC: v } : x)))
                          }
                        />
                        <InlineNum
                          label="Durée"
                          name={`Durée de la phase ${s.name || i + 1}, en jours`}
                          unit="j"
                          min={0}
                          integer
                          value={s.days}
                          onValue={(v) =>
                            setFerment(ferment.map((x, j) => (j === i ? { ...x, days: v } : x)))
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Section>
        </>
      )}

      {/* ---------------------------------------------------- ÉTAPE 6 */}
      {step === 'eau' && (
        <div className="!mt-0 space-y-2 sm:!mt-4 sm:panel sm:p-4 sm:space-y-3">
          <SaltSolver
            source={waterSource}
            onSourceChange={(source) => {
              setRecipeWaterSource(source);
              onSaveWaterSource(source);
            }}
            beerEbc={color?.ebc ?? null}
            beerVolumeL={volumeL}
            /*
             * ⚠️ Tout ce que la recette sait déjà et que l'eau ignorait :
             * l'acidité de la facture, la direction du houblonnage, et d'où
             * sortent les volumes. Chaque champ est vivant — changer un malt,
             * un houblon ou la durée d'ébullition redescend jusqu'aux sels.
             */
            brew={{
              style,
              grist: grains,
              totalGristKg: totalGrist,
              hops,
              ibu,
              og: ogPredicted,
              volumes: suggestedVolumes,
              boilMin
            }}
            onMashRatioChange={(lPerKg) => {
              setMashRatioOverride(lPerKg);
              // Le ratio REPREND la main sur les volumes : c'est une consigne,
              // pas une suggestion de plus à côté d'un volume figé.
              setVolumesEdited(false);
            }}
            state={water}
            onChange={onWaterChange}
            noSparge={spargeType === 'none'}
            onNoSpargeChange={setNoSparge}
          />

          {volumesStale && (
            <button
              type="button"
              onClick={() =>
                setWater((w) => ({
                  ...w,
                  mashWaterL: suggestedVolumes.mashWaterL,
                  spargeWaterL: suggestedVolumes.spargeWaterL
                }))
              }
              className="w-full mb-2 px-2 py-1.5 rounded-control border border-ebc-amber/40
                         bg-ebc-amber/10 text-left flex items-center gap-1.5"
            >
              {/*
                ⚠️ UNE ligne. Le bandeau en faisait cinq et disait trois fois la
                même chose : le titre annonçait l'écart, le corps répétait les
                volumes saisis (qui sont dans les champs, deux centimètres plus
                bas), puis rappelait pourquoi les sels se dosent au litre. Ne
                reste que ce qu'on ne peut PAS lire ailleurs — les volumes que
                le calcul propose — et le geste pour les prendre.
              */}
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-ebc-amber" />
              <span className="min-w-0 flex-1 text-2xs text-cave-200 leading-snug">
                Le calcul donne{' '}
                <span className="reading text-ebc-amber">
                  {suggestedVolumes.mashWaterL} / {suggestedVolumes.spargeWaterL} L
                </span>
              </span>
              <span className="shrink-0 text-2xs text-ebc-amber font-medium">recaler</span>
            </button>
          )}

          {/* L'aller-retour eau ⇄ fiche coûtait de remonter tout le fil d'étapes. */}
          <button
            type="button"
            onClick={() => setStep('recap')}
            className="w-full mt-4 min-h-[40px] sm:min-h-touch rounded-control border border-cave-700
                       text-cave-200 text-xs sm:text-sm flex items-center justify-center gap-2
                       transition-colors hover:bg-cave-850"
          >
            <ClipboardList className="w-4 h-4" />
            Retour à la fiche de brassage
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- RÉCAP */}
      {/*
        La fiche de brassage. Elle REMPLACE le récapitulatif en lecture seule :
        Gaëtan corrigeait un chiffre en remontant le fil d'étapes, en retrouvant
        la ligne, en la changeant, puis en redescendant — six gestes pour cent
        grammes de houblon. Ici chaque valeur se change là où elle se lit.

        Les chiffres calculés — OG, IBU, EBC — restent dans le bandeau du haut,
        visible à toutes les étapes : ils se mettent à jour pendant qu'on tape.
      */}
      {step === 'recap' && (
        <>
        {/*
          Un seul geste pour aller chercher tout ce qui manque encore — couleurs,
          potentiels, alphas, atténuation. Le bouton disparaît de lui-même quand
          la fiche est complète.
        */}
        <RecipeAutoComplete
          onLearnIngredient={onLearnIngredient}
          stockItems={stockItems}
          fermentables={fermentables}
          onFermentables={setFermentables}
          hops={hops}
          onHops={setHops}
          yeast={yeast}
          onYeast={setYeast}
        />
        <BrewSheet
          onLearnIngredient={onLearnIngredient}
          reviewData={{
            recipe: { ...build(), id: undefined },
            estimates: { og: ogPredicted, fg: fgPredicted, ibu, ebc: color?.ebc ?? null,
              efficiencyPct: efficiency, volumes: suggestedVolumes },
            waterTreatment: waterRecap,
            conventions: { ions: 'mg/L dans les eaux de traitement, avant extraction et ébullition',
              salts: 'grammes réellement retenus, répartis entre empâtage et rinçage',
              acid: 'doses retenues, concentration indiquée dans le nom du produit',
              ra: 'alcalinité résiduelle après acide, ppm CaCO3 ; approximation, pas un pH mesuré',
              hco3: 'repère indicatif du style ; ne commande pas seul un ajout alcalin' }
          }}
          name={name}
          onName={setName}
          style={style}
          onStyle={changeStyle}
          volumeL={volumeL}
          onVolumeL={setVolumeL}
          boilMin={boilMin}
          onBoilMin={setBoilMin}
          carboTarget={carboTarget}
          onCarboTarget={setCarboTarget}
          fermentables={fermentables}
          onFermentables={setFermentables}
          totalGristKg={totalGrist}
          hops={hops}
          onHops={setHops}
          hopIbu={(h) =>
            og > 1 ? BrewingMath.hopIbu(h, volumeL, og, boilMin) : null
          }
          yeast={yeast}
          onYeast={setYeast}
          mashSteps={mashSteps}
          onMashSteps={setMashSteps}
          fermentation={ferment}
          onFermentation={setFerment}
          mashWaterL={water.mashWaterL}
          onMashWaterL={(v) => {
            setVolumesEdited(true);
            setWater((w) => ({ ...w, mashWaterL: v }));
          }}
          spargeWaterL={water.spargeWaterL}
          onSpargeWaterL={(v) => {
            setVolumesEdited(true);
            setWater((w) => ({ ...w, spargeWaterL: v }));
          }}
          water={waterRecap}
          onEditWater={() => setStep('eau')}
          notes={notes}
          onNotes={setNotes}
          shortages={shortages}
          /*
            ⚠️ L'export part d'ICI et non de la fiche, parce que les grandeurs
            CALCULÉES — OG, FG, IBU, EBC, rendement — vivent dans l'assistant.
            Les recalculer dans la fiche les ferait diverger de ce que l'écran
            affiche : une recette exportée annonçant un IBU que l'application
            ne montre nulle part serait pire que pas d'export du tout.
          */
          onExportText={() =>
            recipeToText({
              recipe: build(),
              name,
              style,
              volumeL,
              boilMin,
              og: ogPredicted,
              fg: fgPredicted,
              abv:
                ogPredicted && fgPredicted
                  ? BrewingMath.calculateABV(ogPredicted, fgPredicted)
                  : null,
              ibu,
              ebc: color?.ebc ?? null,
              efficiencyPct: efficiency,
              carboTarget,
              mashRatioLPerKg: totalGrist > 0 ? water.mashWaterL / totalGrist : undefined,
              spargeType,
              adjuncts: details.adjuncts,
              fermentables,
              totalGristKg: totalGrist,
              hops,
              hopIbu: (h) => BrewingMath.hopIbu(h, volumeL, og, boilMin),
              yeast,
              mashSteps,
              fermentation: ferment,
              water: waterRecap && {
                ...waterRecap,
                sourceName: waterRecap.sourceName,
                styleName: waterRecap.styleName,
                mashWaterL: waterRecap.mashWaterL,
                spargeWaterL: waterRecap.spargeWaterL,
                mashOsmoseeL: waterRecap.mashOsmoseeL,
                spargeOsmoseeL: waterRecap.spargeOsmoseeL,
                wortIons: waterRecap.wortIons,
                doses: waterRecap.doses,
                acidId: waterRecap.acidId,
                mashAcid: waterRecap.mashAcid,
                spargeAcid: waterRecap.spargeAcid,
                ra: waterRecap.ra,
                mashPh: waterRecap.mashPh
              },
              notes
            })
          }
        />
        </>
      )}

      {/*
        ⚠️ RETOUR / SUIVANT NE SUIVENT PLUS.

        Ils vivaient dans la barre collée en bas de `PageShell` : cinquante-six
        pixels confisqués en permanence sur un écran de téléphone, pour deux
        boutons dont on ne se sert qu'une fois par étape — à la fin. Ils sont
        maintenant à LEUR place, au bas du contenu, et petits : on les atteint en
        finissant de dérouler la page, ce qu'on fait de toute façon.

        Le récapitulatif garde sa barre collée, lui : « Enregistrer » et
        « Lancer le brassin » sont la décision de la page, pas une navigation.
      */}
      {step !== 'recap' && (
        <nav className="flex gap-2 pt-1 pb-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={stepIndex === 0}
            className="min-h-touch-sm px-3 rounded-control border border-cave-800
                       text-cave-400 text-2xs disabled:opacity-30 transition-colors hover:bg-cave-850"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!canAdvance}
            className="flex-1 min-h-touch-sm rounded-control bg-ebc-straw text-cave-950
                       text-2xs font-semibold disabled:opacity-40 transition-colors hover:brightness-105"
          >
            {canAdvance ? `Suivant — ${STEPS[stepIndex + 1]?.label ?? ''}` : 'Donne un nom à la recette'}
          </button>
        </nav>
      )}

      {/*
        L'import remplit TOUT : fermentescibles typés, houblons avec leur moment,
        levure, paliers, fermentation, déroulé. Ce qui manque dans la recette est
        cherché par l'IA sur les fiches des fabricants, et ce qui reste
        introuvable est annoncé — jamais comblé.
      */}
      <RecipeImportSheet
        open={importing}
        onClose={() => setImporting(false)}
        onApply={applyImport}
      />
    </PageShell>
  );
};
