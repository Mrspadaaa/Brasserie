import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NumberInput } from './NumberInput';
import { formatDecimal, useHoldRepeat } from './numericInput';
import { WaterSource, SaltId, AcidId, WaterIons } from '../types';
import { describeSolveIssue } from '../domain/water/solverMessages';
import {
  SALTS,
  calculateWaterTreatment,
  SALT_IDS,
  SaltDef,
  ACIDS,
  ION_SYMBOL,
  ION_SYMBOL_SHORT,
  ION_LABEL,
  ION_ROLE,
  CAUTION_APPROACH,
  LACTATE_TASTE_THRESHOLD,
  saltCautions,
  dilute,
  alkalinityAsCaCO3,
  residualAlkalinity,
  targetRaForGrist,
  raSaltCeilingForGrist,
  alkalineSaltGoal,

  estimateMashPh,
  hopBalanceHint,
  MASH_PH_BAND,
  acidNeeded,
  lactateInBeer,
  sulfateChlorideRatio,
  rebalanceRatio,
  solveSalts,
  minimalDilution,
  splitDoses,
  IonBand
} from '../domain/water';
import {
  STYLE_WATERS,
  WATER_PROFILE_SOURCES,
  styleByCode,
  styleWaterForName,
  midpoint,
  styleFromTargetIons,
  StyleWater,
  IonRange
} from '../domain/waterStyles';
import { WaterTargetSheet, CustomTarget } from './WaterTargetSheet';
import { WaterAnalysisTable } from './WaterAnalysisTable';
import { WaterRadar } from './WaterRadar';
import { CycleTag } from './CycleTag';
import { RatioSlider } from './RatioSlider';
import { IonComparison } from './IonComparison';
import { DilutionField } from './DilutionField';
import { WaterAdditivesTable } from './WaterAdditivesTable';
import { Combobox } from './Combobox';
import { Field, InlineNum, inputClass } from './FormNav';
import {
  AlertTriangle,
  Minus,
  Plus,
  Link2,
  Link2Off,
  Droplets,
  Scale,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target
} from 'lucide-react';

/**
 * L'atelier de l'eau et des sels.
 *
 * Porté sur l'outil de référence que Gaëtan utilise, dans le même ordre :
 * analyse ➔ style ➔ profil visé et rapport ➔ comparaison ➔ empâtage et rinçage
 * ➔ correction minérale ➔ total des additifs. La sélection par commune est
 * volontairement absente : elle n'a pas d'équivalent suisse, et l'analyse se
 * saisit une fois pour toutes.
 *
 * Trois principes tenus de bout en bout :
 *
 * 1. **La cible est une fourchette, pas un point.** On regarde si l'on tombe
 *    dedans, pas si l'on colle à une valeur.
 * 2. **L'alcalinité ne se recopie pas du style.** Elle suit la couleur de la
 *    bière et se traite à l'acide, jamais au sel.
 * 3. **Empâtage et rinçage sont deux eaux.** Et pas seulement par le volume :
 *    les sels ALCALINS ne vont que dans la première. L'alcalinité n'a de sens
 *    que face aux phosphates du malt ; celle qu'on envoyait au rinçage était
 *    rachetée à l'acide trois lignes plus bas.
 */

export interface WaterState {
  /** Part d'osmosée de l'eau d'EMPÂTAGE, en %. */
  diRatioPct: number;
  /**
   * Part d'osmosée propre au RINÇAGE. Absent = il suit l'empâtage.
   *
   * ⚠️ Ce n'est pas un raffinement : couper le seul rinçage à 90 % d'osmosée
   * supprime presque toute l'alcalinité à neutraliser, donc l'acide et le
   * risque d'astringence — sans toucher à la maische, où l'alcalinité sert.
   */
  spargeDiRatioPct?: number;
  /** Tous les sels sont versés à l'empâtage (aucun sel au rinçage). Vrai par défaut. */
  allSaltsInMash?: boolean;
  /** Code BJCP du style d'eau visé. */
  styleCode: string;
  /**
   * Cible CHIFFRÉE saisie à la main, quand la recette donne son eau plutôt
   * qu'un style. Elle prend le pas sur `styleCode`.
   *
   * ⚠️ Une recette sur deux donne un profil en ppm et non un style BJCP. Il
   * fallait alors choisir le style le plus proche et viser une eau qui n'était
   * pas celle de la recette.
   */
  customTarget?: CustomTarget;
  doses: Partial<Record<SaltId, number>>;
  /** Exact per-water additions retained from a recipe, until doses are edited. */
  saltSplit?: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
  disabled: SaltId[];
  acidId: AcidId;
  mashWaterL: number;
  spargeWaterL: number;
  /** Rapport SO₄:Cl imposé à la main. Absent = milieu de fourchette du style. */
  ratioOverride?: number;
  /**
   * Doses d'acide imposées à la main, en mL (ou g pour le malt acidulé).
   *
   * ⚠️ Demandé ainsi : « je veux aussi pouvoir moi, modifier les acides pour
   * voir leur effets ». Elles étaient en lecture seule — déduites de
   * l'alcalinité à neutraliser — au motif qu'un millilitre de trop est une
   * erreur de calcul, pas une nuance. C'était sous-estimer ce qu'on fait d'une
   * commande : maintenant que la toile montre l'effet de l'acide sur le
   * bicarbonate, la déplacer À LA MAIN est le moyen le plus direct de
   * comprendre ce qu'elle change.
   *
   * Absent = la dose calculée. Le bouton de remise à zéro y revient.
   */
  acidOverride?: { mash?: number; sparge?: number };
  /** pH mesurés à la cuve — le calcul ne les prédit pas, il les consigne. */
  mashPh?: number;
  spargePh?: number;
}

/**
 * Ce que la RECETTE apprend à l'eau.
 *
 * ⚠️ L'atelier ne recevait que la couleur et le volume. Il ignorait donc trois
 * choses que la recette sait déjà, et que le brasseur, lui, prend en compte :
 * l'acidité de la facture de grain, la direction que le houblonnage donne au
 * goût, et d'où sortent les deux volumes d'eau. Tout est optionnel : l'atelier
 * s'ouvre aussi seul, depuis le banc d'essai.
 */
export interface WaterBrewContext {
  /** Used to offer the matching profile, without replacing a chosen target. */
  style?: string;
  /** La facture de grain — pour le pH d'empâtage estimé. */
  grist?: Array<{
    name?: string;
    weightKg?: number;
    kind?: string;
    use?: string;
    colorEbc?: number;
  }>;
  totalGristKg?: number;
  /** Les houblons — pour la direction de la balance SO₄ ⇄ Cl. */
  hops?: Array<{ weightG?: number; stage?: string; timeMin?: number }>;
  ibu?: number | null;
  og?: number | null;
  /** D'où sortent les volumes : moût à collecter, pertes, épaisseur. */
  volumes?: {
    preBoilVolumeL: number;
    grainAbsorptionL: number;
    boilOffL: number;
    hopLossL: number;
    mashRatioLPerKg: number;
  };
  boilMin?: number;
}

interface SaltSolverProps {
  source: WaterSource;
  onSourceChange: (source: WaterSource) => void;
  /** Couleur calculée de la bière — c'est elle qui fixe la cible d'alcalinité. */
  beerEbc: number | null;
  /** Volume en fermenteur — sert à dire si l'acide se goûtera dans la bière. */
  beerVolumeL: number;
  brew?: WaterBrewContext;
  /**
   * Reprendre l'épaisseur de maische à la main, en L/kg.
   *
   * L'atelier ne recalcule pas les volumes lui-même : il renvoie la consigne à
   * l'assistant, qui possède `BrewingMath.waterVolumes`. Un seul modèle.
   */
  onMashRatioChange?: (lPerKg: number) => void;
  state: WaterState;
  onChange: (next: WaterState) => void;
  /**
   * Le brassin se fait-il SANS eau de rinçage ?
   *
   * ⚠️ C'est une décision de procédé, pas une conséquence d'un volume à zéro.
   * La confondre avec `spargeWaterL > 0` faisait disparaître l'onglet Rinçage
   * au premier caractère effacé — voir le commentaire des deux champs de volume.
   */
  noSparge: boolean;
  onNoSpargeChange: (next: boolean) => void;
}

type Tab = 'empatage' | 'rincage';

/**
 * Deux feuilles, pas trois.
 *
 * ⚠️ Le profil vivait sur sa propre feuille, entre l'eau et les sels. La toile
 * y était donc invisible au moment PRÉCIS où elle sert : quand on pèse. On
 * tapait un gramme, on revenait en arrière pour voir ce que ça avait fait, on
 * repartait. La toile est désormais en tête de la feuille de pesée, au-dessus
 * des sels qui la déplacent.
 */
type MobileStep = 'eau' | 'sels';

/** L'ordre de lecture de la toile — repris ici pour les pastilles. */
const RADAR_IONS: Array<keyof WaterIons> = ['cl', 'so4', 'ca', 'mg', 'na', 'hco3'];

/**
 * Le nom court d'un sel — celui qu'on dit à voix haute devant la balance.
 *
 * ⚠️ Un tiers d'écran de téléphone fait cent dix pixels. « Chlorure de
 * calcium » n'y tient pas, et coupé au milieu il ne désigne plus rien. Ce sont
 * les noms d'atelier : personne ne dit « bicarbonate de sodium », on dit
 * « bicarbonate ». Le nom complet reste dans l'étiquette accessible du champ et
 * dans la fiche de pesée finale, où la place ne manque pas.
 */
const SALT_SHORT: Record<SaltId, string> = {
  gypse: 'Gypse',
  cacl2: 'CaCl₂',
  epsom: 'Epsom',
  mgcl2: 'MgCl₂',
  nacl: 'Sel',
  nahco3: 'Bicarb.',
  caco3: 'Craie',
  chaux: 'Chaux',
  kcl: 'KCl'
};

/**
 * Les acidifiants, en court — pour la pastille qui les fait tourner.
 *
 * « Acide lactique 80 % » ne tient pas dans une pastille posée à côté de deux
 * doses. Le nom complet reste sous la rangée, avec sa note : c'est là qu'on lit
 * ce qu'il vaut, pas dans l'étiquette qu'on appuie.
 */
const ACID_SHORT: Record<AcidId, string> = {
  lactique: 'Lactique',
  phosphorique: 'Phosphorique',
  maltAcidule: 'Malt acidulé'
};

/**
 * Une case de la grille des sels.
 *
 * ⚠️ Extraite en composant pour une raison technique qui a une conséquence
 * réelle : `useHoldRepeat` est un hook, et un hook ne peut pas vivre dans une
 * boucle. Les neuf cases partageaient donc une paire de boutons sans appui
 * long — il fallait neuf appuis pour poser 4.5 g de gypse.
 */
const SaltCell: React.FC<{
  id: SaltId;
  def: SaltDef;
  grams: number;
  off: boolean;
  active: boolean;
  ions: Array<keyof WaterIons>;
  achievedTotal: WaterIons;
  style: StyleWater;
  onDose: (v: number) => void;
  onToggle: (id: SaltId) => void;
  onActivate: (id: SaltId) => void;
}> = ({ id, def, grams, off, active, ions, achievedTotal, style, onDose, onToggle, onActivate }) => {
  /* Le pas de la balance : un demi-gramme, arrondi au dixième. */
  const presse = useHoldRepeat(grams, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10)
  );
  return (
        <li
          key={id}
          /*
           * ⚠️ `onPointerDown` et non `onClick` : au doigt, on veut que
           * la toile s'allume au CONTACT, avant même le relâchement —
           * c'est ce contact qui va faire tourner la molette du stepper.
           * `onFocusCapture` couvre le clavier et le lecteur d'écran.
           */
          onPointerDown={() => onActivate(id)}
          onPointerEnter={() => onActivate(id)}
          onFocusCapture={() => onActivate(id)}
          className={`px-1 py-0.5 sm:p-1 rounded-control border transition-all min-w-0 ${
            off
              ? 'bg-cave-950/40 border-cave-850/60 opacity-45'
              : active
                ? 'bg-cave-850 border-ebc-straw/60'
                : grams > 0
                  ? 'bg-cave-900/80 border-ebc-straw/30'
                  : 'bg-cave-900/50 border-cave-800'
          }`}
        >
          <div className="flex items-center sm:items-start justify-between gap-1 min-w-0">
            <div className="min-w-0 flex-1">
              {/* Le nom court : « Chlorure de calcium » ne tient pas
                  dans un tiers d'écran, et la formule le désigne mieux
                  qu'un nom coupé au milieu. */}
              <span className="block text-2xs font-semibold text-cave-100 leading-none truncate">
                {SALT_SHORT[id]}
              </span>
              <span className="sr-only sm:not-sr-only sm:block text-[0.6875rem] leading-none text-cave-500 font-mono truncate">
                {ions.map((ion) => ION_SYMBOL_SHORT[ion]).join(' ')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!off}
              aria-label={`${def.name} — ${off ? 'écarté' : 'autorisé'}`}
              onClick={() => onToggle(id)}
              /*
               * ⚠️ 28×16 À L'ŒIL, 44×32 AU DOIGT — mesuré, pas estimé.
               *
               * L'interrupteur dessiné fait SEIZE pixels de haut. C'est ce qui
               * décide qu'un sel entre ou non dans le calcul, et il est posé à
               * quelques pixels du stepper de la même case, lui-même voisin de
               * ceux des huit autres sels. Viser 16 px entre deux commandes qui
               * ne font pas du tout la même chose, avec un pouce, sur une
               * grille 3×3 — c'est la faute de conception la plus coûteuse de
               * cet écran : on croit ajouter un demi-gramme et on écarte le sel.
               *
               * On ne le grossit PAS : la grille 3×3 serrée a été demandée
               * explicitement pour tout voir d'un écran. `p-2 -m-2` étend la
               * seule zone cliquable de 8 px sur les quatre côtés, sans
               * déplacer un pixel à l'écran.
               */
              className="shrink-0 px-1 py-0.5 sm:p-2 sm:-m-1.5 sm:-mr-2"
            >
              <span
                className={`block w-7 h-4 rounded-full relative transition-colors ${
                  off ? 'bg-cave-700' : 'bg-hop'
                }`}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 rounded-full bg-cave-50 transition-all"
                  style={{ left: off ? 2 : 14 }}
                />
              </span>
            </button>
          </div>

          <div className="flex items-stretch mt-1">
            <button
              type="button"
              disabled={off || grams <= 0}
              {...presse(-0.5)}
              aria-label={`Retirer 0.5 g de ${def.name}`}
              className="w-7 h-8 shrink-0 rounded-l-control bg-cave-800 active:bg-cave-700
                         text-cave-100 flex items-center justify-center disabled:opacity-30"
            >
              <Minus className="w-3 h-3" />
            </button>
            <NumberInput
              aria-label={`Dose de ${def.name} en grammes`}
              min={0}
              value={grams}
              onValue={onDose}
              pad
              className="w-full min-w-0 h-8 bg-cave-950 border-y border-cave-700
                         reading text-2xs font-semibold text-center focus:outline-none focus:border-ebc-straw
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              disabled={off}
              {...presse(0.5)}
              aria-label={`Ajouter 0.5 g de ${def.name}`}
              className="w-7 h-8 shrink-0 rounded-r-control bg-cave-800 active:bg-cave-700
                         text-cave-100 flex items-center justify-center disabled:opacity-30"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </li>
  );
};

/**
 * Une dose d'ACIDE, réglable au doigt.
 *
 * ⚠️ Demandé ainsi : « pour les acides je veux pouvoir sur mobile les modifier
 * sans devoir avoir à ouvrir le clavier ». Le champ seul obligeait à taper : le
 * clavier montait, recouvrait la toile, et l'on perdait de vue exactement ce
 * qu'on cherchait à faire bouger. Les mêmes ± que les sels, au même pas de
 * lecture — et le champ reste tapable pour poser une valeur d'un coup.
 *
 * Pas de 0.5 : c'est la graduation d'une pipette de brasseur, et la même que
 * celle des sels, pour que le pouce n'ait qu'un geste à apprendre.
 */
const AcidCell: React.FC<{
  label: string;
  name: string;
  unit: string;
  amount: number;
  force: boolean;
  onDose: (v: number) => void;
}> = ({ label, name, unit, amount, force, onDose }) => {
  const presse = useHoldRepeat(amount, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10)
  );
  return (
    <div className="min-w-0">
      <span className="block text-[0.6875rem] leading-tight text-cave-500 truncate">
        {label}
        {/* La pastille dit d'un coup d'œil que ce chiffre n'est plus celui du
            calcul — sans quoi une dose forcée se confond avec une dose déduite. */}
        {force && <span className="text-ebc-straw"> · à la main</span>}
      </span>
      <div className="flex items-stretch mt-0.5">
        <button
          type="button"
          disabled={amount <= 0}
          {...presse(-0.5)}
          /*
           * ⚠️ Le nom du BOUTON ne reprend pas celui du champ.
           *
           * Je leur avais donné « Retirer 0.5 mL — Dose d'acide lactique 80 %
           * à l'empâtage, en mL » : le nom du champ en entier, précédé du
           * verbe. Trois commandes de la rangée répondaient dès lors à la même
           * recherche — le test qui visait le champ en trouvait trois — et le
           * lecteur d'écran annonçait la phrase complète à chaque tabulation.
           * Le verbe, le pas, et le côté suffisent : c'est ce que dit l'écran.
           */
          aria-label={`Retirer 0.5 ${unit} — ${label}`}
          className="w-7 h-8 shrink-0 rounded-l-control bg-cave-800 active:bg-cave-700
                     text-cave-100 flex items-center justify-center disabled:opacity-30"
        >
          <Minus className="w-3 h-3" />
        </button>
        <NumberInput
          aria-label={name}
          min={0}
          value={amount}
          onValue={onDose}
          pad
          className={`w-full min-w-0 h-8 bg-cave-950 border-y reading text-2xs font-semibold
                      text-center focus:outline-none focus:border-ebc-straw
                      ${force ? 'border-ebc-straw/60 text-ebc-straw' : 'border-cave-700 text-water'}`}
        />
        <button
          type="button"
          {...presse(0.5)}
          aria-label={`Ajouter 0.5 ${unit} — ${label}`}
          className="w-7 h-8 shrink-0 rounded-r-control bg-cave-800 active:bg-cave-700
                     text-cave-100 flex items-center justify-center disabled:opacity-30"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const SaltSolver: React.FC<SaltSolverProps> = ({
  source,
  onSourceChange,
  beerEbc,
  beerVolumeL,
  brew,
  onMashRatioChange,
  state,
  onChange,
  noSparge,
  onNoSpargeChange
}) => {
  const set = (patch: Partial<WaterState>) => onChange({ ...state, ...patch });
  const [tab, setTab] = useState<Tab>('empatage');
  const [activeStep, setActiveStep] = useState<MobileStep>('eau');
  /** Le sel qu'on manipule — ses ions s'allument sur la toile. */
  /**
   * L'additif que le doigt touche — sel OU acide.
   *
   * ⚠️ Élargi à l'acide parce qu'il REJOINT la grille : « en plus des sels on
   * ajoute aussi les acides vu que c'est directement lié […] on voit
   * directement les changements dans le spidergraph ». Un seul mécanisme
   * d'activation, donc un seul comportement à comprendre.
   */
  const [activeSalt, setActiveSalt] = useState<SaltId | 'acide' | null>(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const workbenchRef = useRef<HTMLDivElement>(null);

  // Réserve les commandes à leur hauteur réelle, puis donne tout le reste au
  // Spider. Le cadre diffère entre atelier et assistant : pas de forfait en vh.
  useLayoutEffect(() => {
    const root = workbenchRef.current;
    const main = root?.closest('main');
    if (!root || !main) return;
    const measure = () => {
      if (window.innerWidth >= 640) {
        root.style.removeProperty('--water-radar-max-height');
        return;
      }
      const svg = root.querySelector<SVGSVGElement>('svg[role="img"]');
      if (!svg || !root.offsetHeight) return;
      const box = root.getBoundingClientRect();
      const controls = box.height - svg.getBoundingClientRect().height;
      // Le défilement ne doit pas faire grandir/rétrécir le graphique.
      const top = box.top + main.scrollTop;
      const available = main.getBoundingClientRect().bottom - top - controls - 8;
      root.style.setProperty('--water-radar-max-height', `${Math.max(160, Math.floor(available))}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(main);
    if (main.firstElementChild) observer.observe(main.firstElementChild);
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [activeStep]);

  const handleStepChange = (step: MobileStep) => {
    setActiveStep(step);
    if (typeof document !== 'undefined') {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    }
  };

  const totalWaterL = Math.round((state.mashWaterL + state.spargeWaterL) * 10) / 10;
  /* La cible saisie l'emporte sur le style de la liste. */
  const style = useMemo(
    () =>
      state.customTarget
        ? styleFromTargetIons(state.customTarget.ions, state.customTarget.name)
        : styleByCode(state.styleCode),
    [state.customTarget, state.styleCode]
  );
  const recipeStyle = styleWaterForName(brew?.style ?? '');
  const differentProfile = !state.customTarget && recipeStyle.code !== '—' && recipeStyle.code !== style.code;
  const start = useMemo(() => dilute(source, state.diRatioPct), [source, state.diRatioPct]);

  /** La part d'osmosée réellement appliquée au rinçage. */
  const spargeDi = state.spargeDiRatioPct ?? state.diRatioPct;
  const spargeLinked = state.spargeDiRatioPct === undefined;
  const startSparge = useMemo(() => dilute(source, spargeDi), [source, spargeDi]);

  /**
   * L'épaisseur de la maische, DÉDUITE de l'eau réellement posée.
   *
   * ⚠️ Pas une consigne stockée quelque part : le rapport de ce qui est dans la
   * cuve sur ce qui est dans le sac. Il bouge donc dès qu'on touche un volume
   * ou un malt, et le pH estimé bouge avec — c'est la même eau qui porte
   * l'alcalinité et qui la dilue.
   */
  const mashRatioLPerKg =
    brew?.totalGristKg && brew.totalGristKg > 0 ? state.mashWaterL / brew.totalGristKg : 0;

  /** Le détail des pertes, quand l'assistant le fournit. */
  const vol = brew?.volumes;

  const raBand = useMemo(
    () => targetRaForGrist(beerEbc, brew?.grist, mashRatioLPerKg),
    [beerEbc, brew?.grist, mashRatioLPerKg]
  );
  /** L'AR au-delà de laquelle la facture n'a plus besoin de sels alcalins. */
  const raCeiling = useMemo(
    () => raSaltCeilingForGrist(brew?.grist, mashRatioLPerKg),
    [brew?.grist, mashRatioLPerKg]
  );
  const alkaliGoal = alkalineSaltGoal(raBand, raCeiling);

  /** Si activé, tous les sels vont à l'empâtage (aucun sel au rinçage). */
  /*
   * ⚠️ ABSENT = VRAI, comme partout ailleurs. L'atelier lisait `?? false`
   * quand l'assistant lisait `!== false` : sur une recette sans le champ,
   * l'écran montrait l'interrupteur ÉTEINT et une répartition
   * proportionnelle, pendant que le plan enregistré disait « tout à
   * l'empâtage ». Deux vérités pour la même eau, et celle qu'on lit n'est pas
   * celle qu'on verse.
   */
  const allSaltsInMash = state.allSaltsInMash !== false;

  /**
   * Les DEUX eaux du plan.
   *
   * ⚠️ Il n'y en avait qu'une : `achieved`, calculée sur le volume total, qui
   * servait à la fois d'AR d'empâtage et de base de l'acide de rinçage. Comme
   * les sels alcalins (et tous les sels si `allSaltsInMash`) vont à l'empâtage,
   * les deux eaux n'ont plus la même composition — et c'est bien ce qu'on verse dans la cuve.
   */
  const treatment = useMemo(() => calculateWaterTreatment(source, state, raBand),
    [source, state, raBand]);
  const achievedMash = treatment.raw.mash;
  const achievedSparge = treatment.raw.sparge;
  const achievedTotal = treatment.total;

  const ra = residualAlkalinity(achievedMash);
  const ratio = sulfateChlorideRatio(achievedTotal);

  /** Le pH que devrait donner cette facture dans CETTE eau d'empâtage. */
  const phEstimate = useMemo(
    () => estimateMashPh(brew?.grist, treatment.mashPhRa, mashRatioLPerKg),
    [brew?.grist, treatment.mashPhRa, mashRatioLPerKg]
  );

  /**
   * Où le HOUBLONNAGE pose le curseur dans la fourchette du style.
   *
   * ⚠️ Il n'en sort jamais : le style commande la fourchette, le houblon ne
   * fait qu'y choisir une place. Une milk stout est amère et veut malgré tout
   * du chlorure — laisser l'amertume décider seule l'envoyait au sulfate.
   */
  const hopHint = useMemo(
    () => hopBalanceHint(brew?.hops, brew?.ibu ?? null, brew?.og ?? null, style.ratio),
    [brew?.hops, brew?.ibu, brew?.og, style.ratio]
  );

  /** La cible : ce que le houblonnage suggère, sinon le milieu de fourchette. */
  const wantedRatio =
    state.ratioOverride ?? hopHint?.ratio ?? (style.ratio.min + style.ratio.max) / 2;

  /** Proposition globale pour une consigne SO4/Cl ; indépendante des doses manuelles. */
  const planFor = useCallback(
    (ratio: number) => {
      const target = rebalanceRatio(state.customTarget ? { ...start, ...state.customTarget.ions } : midpoint(style), ratio);

      /*
       * Les plafonds du solveur.
       *
       * La fourchette du style borne chaque ion — c'est elle qui empêche un sel
       * de faire déborder ses ions accompagnateurs. Une exception : le curseur
       * SO₄ ⇄ Cl est une COMMANDE du brasseur. S'il demande un rapport que la
       * fourchette du style ne contient pas, la fourchette s'ouvre juste assez
       * pour l'honorer — sinon le curseur deviendrait inerte au-delà du style.
       */
      const ranges = {} as Record<keyof typeof style.ions, IonBand>;
      const outsideStyleRatio = ratio < style.ratio.min || ratio > style.ratio.max;
      (Object.keys(style.ions) as Array<keyof typeof style.ions>).forEach((ion) => {
        const band = style.ions[ion];
        ranges[ion] = outsideStyleRatio && (ion === 'so4' || ion === 'cl')
          ? { min: Math.min(band.min, target[ion]), max: Math.max(band.max, target[ion]) }
          : { ...band };
      });

      return solveSalts({
        start,
        startSparge,
        target,
        mineralTargetMode: state.customTarget ? 'target' : 'minimum',
        ranges,
        totalWaterL,
        mashWaterL: state.mashWaterL,
        disabled: state.disabled,
        targetRa: raBand,
        raCeiling,
        ratio,
        allSaltsInMash
      });
    },
    [style, start, startSparge, totalWaterL, state.mashWaterL, state.disabled, state.customTarget, raBand, raCeiling, allSaltsInMash]
  );

  const solution = useMemo(() => planFor(wantedRatio), [planFor, wantedRatio]);

  /**
   * Les doses affichées SONT-ELLES celles du solveur ?
   *
   * ⚠️ LE DÉFAUT QUE ÇA RÈGLE, constaté à l'écran. `solveSalts` part toujours de
   * l'eau de DÉPART et propose son propre plan : il ne regarde jamais
   * `state.doses`. Ses messages d'alerte décrivent donc la PROPOSITION, pas
   * l'eau qu'on a. Tant que le brasseur n'a pas appuyé sur « Doser » — ou dès
   * qu'il retouche un sel à la main — les deux divergent en silence, et l'écran
   * affiche deux chiffres pour une seule grandeur :
   *
   *   Panneau  « Alcalinité résiduelle — cible -60 à 0 ppm »   55
   *   Alerte   « Alcalinité résiduelle à 53 ppm … »            53
   *
   * Mesuré sur le banc : doses à la main (gypse 2, CaCl₂ 6) → panneau 55,
   * alerte 53 ; après « Doser » (gypse 3, CaCl₂ 4.8, MgCl₂ 1.5) → les deux à
   * 53. L'alerte annonçait l'eau d'un plan qui n'était pas appliqué.
   *
   * Les messages du solveur expliquent ce que LUI n'a pas pu atteindre (« en
   * ajouter ferait sortir le sodium de la fourchette ») : ils n'ont de sens que
   * si son plan est en place. On ne les montre donc que dans ce cas. Rien n'est
   * perdu quand il ne l'est pas : la toile et le panneau d'AR disent déjà, en
   * chiffres réels, où l'eau se trouve.
   *
   * Tolérance de 0.05 g : les doses sont arrondies au dixième de gramme.
   */
  const planApplied = useMemo(
    () =>
      SALT_IDS.every(
        (id) => Math.abs((state.doses[id] ?? 0) - (solution.doses[id] ?? 0)) < 0.05
      ),
    [state.doses, solution.doses]
  );

  /**
   * Le solveur n'a-t-il RIEN à proposer sur cette eau ?
   *
   * ⚠️ Ce n'est pas un cas limite exotique : il suffit qu'un ion du réseau
   * dépasse déjà le maximum du style. L'eau de Fribourg porte 85 ppm de
   * calcium ; un Kölsch en tolère 80. Aucun sel calcique ne peut alors entrer,
   * et comme presque tous en apportent, le plan sort vide.
   */
  const rienAProposer = useMemo(
    () => SALT_IDS.every((id) => !((solution.doses[id] ?? 0) > 0)),
    [solution.doses]
  );

  /**
   * Les ions de l'eau de DÉPART qui butent déjà sur le plafond du style.
   *
   * C'est la vraie raison du blocage, et elle se lit sur deux grandeurs
   * réelles — l'analyse et la fourchette — sans passer par le solveur. Elle
   * reste donc juste quelles que soient les doses saisies.
   *
   * ⚠️ Le BICARBONATE est exclu, bien qu'il dépasse souvent. Il ne bloque pas
   * l'ajout de sels : aucun sel n'en apporte sur une bière pâle, et c'est
   * l'acide qui le traite — une ligne s'en charge plus bas. Le citer ici
   * revenait à désigner comme coupable un ion que les sels ne touchent pas.
   * Ne restent que ceux qu'un sel ferait effectivement déborder.
   */
  const ionsAuPlafond = useMemo(
    () =>
      (['ca', 'mg', 'na', 'so4', 'cl'] as Array<keyof WaterIons>)
        .filter((ion) => style.ions[ion] && start[ion] > style.ions[ion].max)
        .map((ion) => `${ION_LABEL[ion].toLowerCase()} (${Math.round(start[ion])} pour ${style.ions[ion].max})`),
    [start, style]
  );

  /** La part d'osmosée la plus basse qui atteigne encore le style. */
  const justEnough = useMemo(() => {
    const target = rebalanceRatio(state.customTarget ? { ...start, ...state.customTarget.ions } : midpoint(style), wantedRatio);
    const ranges = {} as Record<keyof typeof style.ions, IonBand>;
    (Object.keys(style.ions) as Array<keyof typeof style.ions>).forEach((ion) => {
      ranges[ion] = {
        min: Math.min(style.ions[ion].min, target[ion]),
        max: Math.max(style.ions[ion].max, target[ion])
      };
    });
    return minimalDilution({
      source,
      target,
      mineralTargetMode: state.customTarget ? 'target' : 'minimum',
      ranges,
      totalWaterL,
      mashWaterL: state.mashWaterL,
      spargeWaterL: state.spargeWaterL,
      targetRa: raBand,
      raCeiling,
      ratio: wantedRatio,
      disabled: state.disabled,
      allSaltsInMash,
      acid: state.acidId,
      beerVolumeL,
      sourcePh: source.ph ?? 7.4
    });
  }, [style, wantedRatio, source, totalWaterL, state.mashWaterL, state.spargeWaterL, raBand, raCeiling, state.disabled, state.customTarget, allSaltsInMash, state.acidId, beerVolumeL]);

  /**
   * Tirer le curseur REFAIT la pesée, dans le même geste.
   *
   * ⚠️ Ce que ça écrase : les doses saisies à la main. C'est voulu — le curseur
   * est une commande de goût, et sa promesse est « je déplace la répartition
   * entre sulfate et chlorure ». Une commande qui ne commande rien tant qu'on
   * n'a pas trouvé le bouton qui la valide n'est pas une commande.
   */
  const applyRatio = (ratio: number) => {
    onChange({ ...state, ratioOverride: ratio, doses: planFor(ratio).doses });
  };

  const split = useMemo(
    () => treatment.split,
    [treatment]
  );

  /** La dose que le CALCUL propose — celle vers laquelle « recalculer » revient. */
  const mashAcidCalcule = treatment.mashAcidCalculated;
  const spargeAcidCalcule = treatment.spargeAcidCalculated;
  const mashAcid = treatment.mashAcid;
  const spargeAcid = treatment.spargeAcid;

  /** Le brasseur a-t-il posé une dose à la main ? */
  const acideForce =
    state.acidOverride?.mash != null || state.acidOverride?.sparge != null;
  const mashAcidDiffers = state.acidOverride?.mash != null && Math.abs(mashAcid.amount - mashAcidCalcule.amount) >= 0.05;

  /**
   * L'alcalinité résiduelle UNE FOIS L'ACIDE VERSÉ.
   *
   * ⚠️ Ce que ça règle, signalé ainsi : « parfois il est dit que la mixture est
   * alcaline et qu'il faut régler ça par les acides ; on a aucun visuel, vraie
   * info là-dessus, et augmenter les sels semble pas enlever le warning ».
   *
   * Les deux moitiés de la remarque sont justes, et c'est le même défaut :
   *
   *   • AUCUN VISUEL — le panneau montrait l'AR d'AVANT acide, en ambre, avec
   *     la dose juste en dessous. Rien ne disait où cette dose amenait l'eau.
   *   • LE WARNING NE PART PAS — et il ne pouvait pas partir : les sels ne
   *     traitent pas l'alcalinité (le calcium la baisse un peu, le reste non),
   *     c'est l'acide qui le fait. Le message le disait — « à traiter à
   *     l'acide, pas au sel » — mais restait affiché alors que l'acide était
   *     déjà dosé. Une alerte qu'aucun geste n'éteint.
   *
   * Même correction que pour le bicarbonate de la toile : on montre l'arrivée,
   * pas seulement le départ.
   */
  const raApresAcide = treatment.raAfter;
  /**
   * Où l'acide amène l'alcalinité : trop haut, juste, ou TROP BAS.
   *
   * ⚠️ La troisième issue est apparue avec les doses modifiables. Le test ne
   * regardait que la borne haute (`<= max`), si bien qu'une maische
   * sur-acidifiée à -78 ppm pour une fenêtre -60 à 0 s'annonçait « dans la
   * cible ». C'est précisément le sur-acidifiage que tout le reste s'interdit :
   * il ne se rattrape pas, et le pH tombé ne remonte pas. Maintenant que la
   * dose se pose à la main, l'écran doit le dire.
   */
  const placeAcide: 'haut' | 'juste' | 'bas' =
    raApresAcide > raBand.max + 5 ? 'haut' : raApresAcide < raBand.min - 5 ? 'bas' : 'juste';
  /** L'acide traite-t-il l'alcalinité haute ? (ce que reproche le solveur) */
  const acideSuffit = placeAcide !== 'haut';

  /**
   * Les messages du solveur RÉELLEMENT affichables.
   *
   * ⚠️ Calculés une seule fois, parce que le conteneur et la liste doivent
   * s'accorder : filtrer à l'affichage seulement laissait un cadre d'alerte
   * ambre parfaitement vide dès que le seul message était celui d'alcalinité.
   */
  const messagesSolveur = useMemo(
    () =>
      planApplied
        ? (solution.issues ?? [])
            .filter((issue) => issue.code !== 'grist' && !(acideSuffit && issue.code === 'alkalinity-high'))
            .map(describeSolveIssue)
        : [],
    [planApplied, solution.issues, acideSuffit]
  );

  /** L'alcalinité qui reste dans l'eau de rinçage — c'est elle qu'on acidifie. */
  const spargeAlkalinity = Math.round(alkalinityAsCaCO3(achievedSparge.hco3));

  /**
   * Le moût TEL QU'IL SERA, acide compris — c'est lui que la toile montre.
   *
   * ⚠️ Demandé ainsi : « on voit directement les changements dans le
   * spidergraph ». La toile affichait le bicarbonate d'AVANT traitement : sur
   * l'eau de Fribourg elle plantait un « HCO₃ 250 ▲ » ambre en permanence,
   * alors que le plan prévoyait justement l'acide qui le ramène dans sa cible.
   * Une alerte qu'aucun geste ne pouvait éteindre.
   *
   * ⚠️ SÉPARÉ de `achievedTotal`, et pas à sa place. L'original reste l'eau
   * d'AVANT acide, parce que c'est elle que `acidNeeded` corrige : doser sur
   * une eau déjà acidifiée donnerait zéro à chaque tour. Celui-ci ne sert qu'à
   * l'AFFICHAGE — toile et comparaison des ions.
   */
  const achievedTotalApresAcide = treatment.treatedTotal;

  /**
   * Ce que les deux acides CUMULÉS laissent dans la bière.
   *
   * ⚠️ La note du produit — « au-delà de 5 mL pour 20 L » — vaut par ajout.
   * Personne ne somme l'empâtage et le rinçage, et sur une eau calcaire les
   * deux ensemble franchissent le seuil de perception sans qu'aucune des deux
   * lignes n'ait l'air excessive.
   */
  const lactate =
    state.acidId === 'lactique'
      ? lactateInBeer(mashAcid.amount + spargeAcid.amount, beerVolumeL)
      : 0;

  /**
   * Les avertissements de sel qui ont lieu d'être — la décision est dans le
   * domaine, où elle se teste ; ici on ne fait que rendre.
   *
   * ⚠️ Sur `achievedTotalApresAcide`, l'eau RÉELLE du verre, et non la
   * proposition du solveur : c'est le sodium qu'on boira qu'on compare à
   * 150 ppm, pas celui d'un plan qu'on n'a peut-être pas appliqué.
   */

  // Les plages restent fixes ; le pH de la maische juge l’alcalinité.
  const cautions = useMemo(
    () => saltCautions(state.doses, state.disabled, achievedTotalApresAcide, totalWaterL),
    [state.doses, state.disabled, achievedTotalApresAcide, totalWaterL]
  );

  /**
   * La marche d'approche du seuil de goût de l'acide.
   *
   * Entre 80 % du seuil et le seuil : la note le rappelle. Au-delà, elle se
   * tait — l'alerte du bloc du dessous porte le même fait avec le chiffre
   * atteint, et deux voix sur la même question s'annulent.
   */
  const seuilGoutProche = useMemo(() => {
    const t = ACIDS[state.acidId].taste;
    return !!t && lactate >= t.gPerL * CAUTION_APPROACH && lactate <= t.gPerL;
  }, [state.acidId, lactate]);

  /**
   * Le calcium manque-t-il DANS LES DOSES SAISIES ?
   *
   * Le solveur juge sa proposition ; cette alerte-ci juge ce qui est réellement
   * dans la colonne. Elle se tait quand le solveur l'a déjà dit, sans quoi le
   * même manque s'affiche deux fois.
   *
   * ⚠️ « L'A DÉJÀ DIT » veut dire AFFICHÉ, pas seulement calculé. Depuis que les
   * messages du solveur sont masqués tant que son plan n'est pas appliqué
   * (`planApplied`), se taire sur leur simple existence faisait disparaître
   * l'avertissement des DEUX côtés : le solveur ne l'affichait pas, et celle-ci
   * se croyait redondante. Un calcium sous le minimum passait alors sous
   * silence, sur l'eau réellement dosée.
   */
  const caShort =
    totalWaterL > 0 &&
    achievedMash.ca < style.ions.ca.min &&
    !(planApplied && solution.unreachable.some((m) => m.startsWith('Calcium')));

  /**
   * Sans eau de rinçage — BIAB, empâtage à volume plein — l'onglet n'a pas lieu
   * d'être.
   *
   * ⚠️ C'était `state.spargeWaterL > 0`, et c'est la panne que Gaëtan décrit
   * comme « la quantité d'eau est inversée ». Vider le champ pour retaper
   * remonte `0` immédiatement ; l'onglet Rinçage disparaissait alors EN PLEINE
   * FRAPPE, le champ partagé se reliait à `mashWaterL`, et la frappe suivante
   * écrasait le volume d'EMPÂTAGE. La décision « pas de rinçage » est
   * maintenant explicite, et la saisie ne peut plus la déclencher.
   */
  const hasSparge = !noSparge;
  const activeTab: Tab = hasSparge ? tab : 'empatage';

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const mashOsmoseeL = round1((state.mashWaterL * state.diRatioPct) / 100);
  const mashReseauL = round1(state.mashWaterL - mashOsmoseeL);
  const spargeOsmoseeL = hasSparge ? round1((state.spargeWaterL * spargeDi) / 100) : 0;
  const spargeReseauL = hasSparge ? round1(state.spargeWaterL - spargeOsmoseeL) : 0;
  const totalOsmoseeL = round1(mashOsmoseeL + spargeOsmoseeL);
  const totalReseauL = round1(mashReseauL + spargeReseauL);

  /** Les ions qu'un sel déplace, dans l'ordre de lecture de la toile. */
  const ionsOf = (id: SaltId) => RADAR_IONS.filter((ion) => (SALTS[id].ions[ion] ?? 0) > 0);

  const bump = (id: SaltId, delta: number) => {
    const next = Math.max(0, Math.round(((state.doses[id] ?? 0) + delta) * 10) / 10);
    set({ doses: { ...state.doses, [id]: next } });
  };

  const toggleSalt = (id: SaltId) => {
    const off = state.disabled.includes(id);
    const disabled = off ? state.disabled.filter((d) => d !== id) : [...state.disabled, id];
    const doses = { ...state.doses };
    if (!off) delete doses[id];
    set({ disabled, doses });
  };

  const totalDosesGrams = Object.values(state.doses).reduce((acc, d) => acc + (d || 0), 0);

  return (
    <div className="space-y-2.5 sm:space-y-6">
      <WaterTargetSheet
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        value={state.customTarget}
        onSave={(t) => set({ customTarget: t, ratioOverride: undefined })}
        onRemove={
          state.customTarget
            ? () => set({ customTarget: undefined, ratioOverride: undefined })
            : undefined
        }
      />

      {/*
        L'aiguillage Eau ⇄ Sels, collé en haut au doigt.

        ⚠️ CE BANDEAU SE PAIE SUR LA GRAPPE. Étant collant, il ne prend pas de
        la hauteur de page — il prend de la hauteur VISIBLE : sur un téléphone
        de 767 px, ses 67 px laissaient 700 px à la toile, au curseur, aux sels
        et à l'acide, qui en faisaient 743. Les quarante-trois pixels manquants
        étaient là. Ramené à 48 : deux boutons de 36 px de haut, sous le
        plancher tactile de 44, mais ce sont deux cibles pleine largeur (163 px)
        qu'on ne rate pas — l'arbitrage se paie en largeur, pas en hauteur.
      */}
      <div className="sm:hidden sticky top-0 z-20 bg-cave-950/95 backdrop-blur-md pt-0 pb-0.5 border-b border-cave-800">
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-cave-900/90 rounded-control border border-cave-800">
          <button
            type="button"
            onClick={() => handleStepChange('eau')}
            className={`h-9 px-2 rounded-control flex items-center justify-center gap-1.5 transition-all ${
              activeStep === 'eau'
                ? 'bg-cave-800 text-ebc-straw font-medium shadow-sm border border-cave-700/70'
                : 'text-cave-400 hover:text-cave-200'
            }`}
          >
            <Droplets className="w-4 h-4 text-water shrink-0" />
            <span className="text-2xs font-semibold">1. Eau</span>
            <span className="text-2xs text-cave-400 reading truncate">{totalWaterL} L</span>
          </button>

          <button
            type="button"
            onClick={() => handleStepChange('sels')}
            className={`h-9 px-2 rounded-control flex items-center justify-center gap-1.5 transition-all ${
              activeStep === 'sels'
                ? 'bg-cave-800 text-ebc-straw font-medium shadow-sm border border-cave-700/70'
                : 'text-cave-400 hover:text-cave-200'
            }`}
          >
            <Scale className="w-4 h-4 text-hop shrink-0" />
            <span className="text-2xs font-semibold">2. Sels</span>
            <span className="text-2xs text-cave-400 reading truncate">{totalDosesGrams.toFixed(1)} g</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 🚰 FEUILLE 1 : L'EAU — analyse, style, volumes, coupe            */}
      {/* ================================================================= */}
      <div className={`space-y-4 ${activeStep === 'eau' ? 'block' : 'hidden sm:block'}`}>
        {/* En-tête de section Desktop */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cave-400 border-b border-cave-800 pb-1.5">
          <Droplets className="w-4 h-4 text-water" />
          <span>1 · L’eau — analyse, style et volumes</span>
        </div>

        {/*
          1. L'eau de départ — celle qui entre vraiment dans la cuve.

          ⚠️ On lui passe l'eau APRÈS COUPE, pas l'analyse brute. La feuille
          montrait les deux, l'une sous l'autre, sur les mêmes six ions : le
          réseau tel qu'il sort du robinet, puis le même réseau une fois dilué à
          l'osmosée. Deux rangs pour une seule information utile — ce qu'on
          verse. L'analyse brute reste sous « Modifier », où elle se saisit.
        */}
        <WaterAnalysisTable
          source={source}
          onChange={onSourceChange}
          display={{
            ions: start,
            caption:
              state.diRatioPct > 0
                ? `${source.name} · coupée à ${state.diRatioPct} % d’osmosée`
                : source.name
          }}
        />

        {/*
          ⚠️ LE TABLEAU DE COMPARAISON A ÉTÉ RETIRÉ D'ICI.

          Il montrait trois lignes — mon eau, la correction, la fourchette du
          style — sur six ions, en défilement horizontal (le HCO₃ tombait hors
          écran). C'est EXACTEMENT ce que la toile de la feuille des sels dit en
          image, et la toile a été copiée sur moneaudebrassage précisément pour
          remplacer ce genre de tableau. Deux représentations de la même donnée,
          dont la moins lisible occupait cent cinquante pixels.

          Ce qui le remplace tient dans le bloc d'analyse juste au-dessus, qui
          affiche désormais l'eau APRÈS COUPE et bouge en direct avec le
          curseur. La comparaison à la cible, elle, se lit sur la toile, à un
          appui d'ici.
        */}

        {/*
          ⚠️ CE BLOC A ÉTÉ SUPPRIMÉ PUIS REMIS. Je l'avais pris pour un doublon
          de la toile ; il ne l'est pas. La toile donne une forme, celui-ci
          donne des nombres et surtout l'ÉCART départ → corrigé, qui est ce
          qu'on lit devant la balance. Ce qui était vraiment en cause, c'était
          sa mise en COLONNES : six ions en six colonnes ne tiennent pas dans un
          téléphone, et le bicarbonate tombait hors écran. Il est revenu en
          rangs.
        */}
        <IonComparison start={treatment.startTotal} achieved={achievedTotalApresAcide} style={style} />

        {/* 3. Volumes & Procédé de Rinçage */}
        <div className="panel p-3 bg-cave-900/60 border border-cave-750 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-cave-800/80">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={hasSparge}
                aria-label={`Eau de rinçage — ${hasSparge ? 'utilisée' : 'aucune'}`}
                onClick={() => onNoSpargeChange(hasSparge)}
                /*
                 * ⚠️ 40×24 À L'ŒIL, 48×40 AU DOIGT.
                 *
                 * Mesuré sur l'écran : l'interrupteur faisait 24 px de haut.
                 * C'est la commande qui décide s'il y a un rinçage — elle
                 * change les deux volumes, la répartition des sels alcalins et
                 * la dose d'acide. La rater, ou la basculer par erreur d'un
                 * frôlement, coûte tout le plan d'eau.
                 *
                 * Plutôt que de le grossir — ce serait rendre les pixels
                 * gagnés ailleurs — on écarte la zone cliquable autour du
                 * dessin : `p-2 -m-2` ajoute 8 px de marge d'attrape sur les
                 * quatre côtés sans déplacer quoi que ce soit à l'écran.
                 */
                className="shrink-0 p-2 -m-2 rounded-full"
              >
                <span
                  className={`block w-10 h-6 rounded-full relative transition-colors ${
                    hasSparge ? 'bg-hop' : 'bg-cave-700'
                  }`}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-cave-50 transition-all"
                    style={{ left: hasSparge ? 18 : 2 }}
                  />
                </span>
              </button>
              {/*
                Le sous-titre expliquait, à chaque brassin, POURQUOI on sépare
                les deux eaux. C'est vrai, et ça s'apprend une fois. Quand le
                rinçage est coupé, en revanche, le dire reste utile : l'état est
                inhabituel, et il change ce que les champs en dessous veulent
                dire.
              */}
              <span className="text-xs sm:text-sm font-semibold text-cave-100">
                {hasSparge ? 'Eau de rinçage' : 'Sans rinçage — tout à l’empâtage'}
              </span>
            </div>
          </div>

          {/*
            ⚠️ Les deux volumes COUCHÉS, sur une seule ligne.

            Ils occupaient chacun un intitulé pleine largeur puis un champ
            pleine largeur en dessous — quatre étages pour deux nombres à trois
            caractères, soit un quart d'écran de téléphone. C'est la mise en
            page que les cartes de houblon et de fermentescible ont déjà quittée.

            ⚠️ Le « pH mesuré » est parti d'ici. Il n'a rien à faire entre deux
            volumes : ce n'est pas une consigne qu'on pose avant de brasser,
            c'est une MESURE qu'on relève à la cuve, et elle ne se comprend qu'à
            côté du pH estimé — où elle vit maintenant, en bas de la feuille.
          */}
          {/* ⚠️ `flex-wrap` : à 320 px les deux volumes ne tiennent pas sur une
              ligne et le « L » du rinçage était rogné par le bord du panneau.
              Ils passent à la ligne au lieu d'être coupés ; à 375 px et au-delà
              ils restent côte à côte. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <InlineNum
              label="Empâtage"
              name="Volume d’eau d’empâtage, en litres"
              unit="L"
              min={0}
              value={state.mashWaterL}
              onValue={(v) => set({ mashWaterL: v })}
            />
            {hasSparge && (
              <InlineNum
                label="Rinçage"
                name="Volume d’eau de rinçage, en litres"
                unit="L"
                min={0}
                value={state.spargeWaterL}
                onValue={(v) => set({ spargeWaterL: v })}
              />
            )}
          </div>

          {/*
            ⚠️ D'OÙ SORTENT CES DEUX VOLUMES.

            Ils s'affichaient nus. Un rinçage à 21 L pour un brassin de 30 —
            c'est ce que donnait l'ancien calcul — n'avait alors aucun moyen
            d'être contredit : rien ne disait ni ce qu'il fallait collecter, ni
            ce que le grain, la vapeur et le houblon avaient déjà pris. Les
            sels se dosant au litre, un volume faux est une minéralité fausse
            sur toute la ligne.
          */}
          {/*
            ⚠️ Sans grain, le partage est arbitraire — et il en avait l'air.
            L'épaisseur de maische se multiplie par la masse de grain : à zéro
            kilo, l'empâtage tombe à son plancher et le rinçage ramasse tout le
            reste. C'est ce qui donnait « 6 L d'empâtage pour 31.6 L de rinçage »
            sur une recette pas encore remplie. Le calcul n'est pas faux, il n'a
            simplement pas encore de quoi travailler : autant le dire.
          */}
          {hasSparge && (brew?.totalGristKg ?? 0) <= 0 && (
            <p className="text-2xs text-ebc-amber leading-snug">
              Aucun grain saisi : le partage empâtage / rinçage ne veut encore rien dire. Il se
              recalculera dès que la facture de grain sera posée.
            </p>
          )}

          {vol && vol.preBoilVolumeL > 0 && (
            <div className="rounded-control bg-cave-950/70 border border-cave-800 p-2.5 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xs sm:text-sm text-cave-400">
                  Moût à collecter avant ébullition
                </span>
                <span className="reading text-sm sm:text-base font-bold text-cave-100 shrink-0">
                  {vol.preBoilVolumeL} L
                </span>
              </div>
              {/*
                Une ligne, pas deux paragraphes : ce sont des CHIFFRES qu'on
                vient vérifier, pas une explication qu'on relit à chaque brassin.
              */}
              <p className="text-2xs text-cave-500 leading-snug">
                {beerVolumeL} L en cuve
                {vol.boilOffL > 0 && <> + {vol.boilOffL} évaporés</>}
                {vol.hopLossL > 0 && <> + {vol.hopLossL} au houblon</>}
                {vol.grainAbsorptionL > 0 && <> + {vol.grainAbsorptionL} aux drêches</>} + fond de
                cuve.
              </p>
            </div>
          )}

          {/*
            L'épaisseur de maische — la commande qui décide vraiment du partage.
            Elle ne vivait que dans le profil d'installation, qu'aucun écran ne
            sait modifier : le rinçage était donc un chiffre subi.
          */}
          {onMashRatioChange && hasSparge && (brew?.totalGristKg ?? 0) > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="w-mash-ratio" className="text-2xs sm:text-sm text-cave-300">
                  Épaisseur de maische
                </label>
                <span className="reading text-sm text-cave-100 shrink-0">
                  {mashRatioLPerKg.toFixed(1)}
                  <span className="reading-unit"> L/kg</span>
                </span>
              </div>
              <input
                id="w-mash-ratio"
                name="water_mash_ratio_range"
                type="range"
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                min={2.5}
                max={6}
                step={0.1}
                value={Math.min(6, Math.max(2.5, mashRatioLPerKg || 4.2))}
                onChange={(e) => onMashRatioChange(parseFloat(e.target.value))}
                className="w-full h-11 cursor-pointer appearance-none bg-transparent focus:outline-none
                           [&::-webkit-slider-runnable-track]:h-1.5
                           [&::-webkit-slider-runnable-track]:rounded-full
                           [&::-webkit-slider-runnable-track]:bg-cave-800
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-7
                           [&::-webkit-slider-thumb]:h-7
                           [&::-webkit-slider-thumb]:-mt-2.5
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-ebc-straw
                           [&::-webkit-slider-thumb]:border-2
                           [&::-webkit-slider-thumb]:border-cave-950
                           [&::-moz-range-track]:h-1.5
                           [&::-moz-range-track]:rounded-full
                           [&::-moz-range-track]:bg-cave-800
                           [&::-moz-range-thumb]:w-7
                           [&::-moz-range-thumb]:h-7
                           [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:bg-ebc-straw
                           [&::-moz-range-thumb]:border-2
                           [&::-moz-range-thumb]:border-cave-950"
              />
              {/* Le repère utile tient en quatre mots ; le mécanisme se voit
                  en bougeant le curseur. */}
              <p className="text-2xs text-cave-500 leading-snug">En monocuve, 4 à 4.5 L/kg.</p>
            </div>
          )}

        </div>

        {/* 4. Préparation des eaux (Réseau & Osmosée) */}
        <div className="panel p-3 bg-cave-900/60 border border-cave-750 space-y-3">
          {/*
            ⚠️ L'en-tête a sauté.

            Il tenait sur quatre lignes à 375 px : « Coupe d'eau (Réseau &
            Osmosée) » s'enroulait sur deux, et « Source : Réseau —
            Villars-sur-Glâne » sur deux autres. Or le titre ne disait rien que
            la ligne juste en dessous ne dise mieux — elle s'appelle « Osmosée —
            empâtage » — et le nom de la source apparaît déjà dans le bloc
            d'analyse, en haut de la feuille. C'était la TROISIÈME occurrence du
            même nom de réseau sur un seul écran.
          */}
          <h3 className="text-xs font-semibold text-cave-300 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-water shrink-0" />
            Coupe à l’osmosée
          </h3>

          {/*
            ⚠️ UNE SEULE COMMANDE tant que le rinçage suit l'empâtage.

            La coupe s'affichait toujours en deux blocs complets : deux curseurs,
            deux champs de litres, deux explications, plus un sous-titre qui
            répétait le volume de rinçage déjà saisi vingt pixels plus haut. Or
            le second est LIÉ au premier neuf fois sur dix — désactivé, grisé,
            et recopiant simplement sa valeur. On montrait donc, en pleine
            page, une commande qui ne commande rien.

            Le lien se dit maintenant sur une ligne, et le second curseur
            n'apparaît QUE délié, c'est-à-dire quand il sert vraiment.
          */}
          {/*
            ⚠️ L'osmosée coûte cher. Le bouton pose la part la plus BASSE qui
            atteigne encore le style — 0 % neuf fois sur dix sur une bière
            foncée — et dit ce qui l'a imposée sinon. Le rinçage est relié :
            une seule part, un seul bidon.
          */}
          <button
            type="button"
            onClick={() => set({ diRatioPct: justEnough.pct, spargeDiRatioPct: undefined })}
            disabled={totalWaterL <= 0}
            className="w-full text-2xs flex items-center gap-1.5 py-1.5 px-2 rounded-control bg-cave-800 border border-cave-700 hover:border-water transition-colors disabled:opacity-50"
          >
            <Droplets className="w-3.5 h-3.5 text-water shrink-0" />
            <span className="min-w-0 flex-1 text-left truncate text-cave-200">
              Juste ce qu’il faut d’osmosée
            </span>
            <span className="shrink-0 reading font-semibold text-water">{justEnough.pct} %</span>
          </button>
          {totalWaterL > 0 && (
            <p className="text-2xs text-cave-500 leading-snug">
              {/*
                ⚠️ LA PHRASE SUIT LA COUPE EN COURS. Signalé ainsi : « n'est
                plus dynamique comme il faut. Il est utile mais fait le
                correctement ».

                Elle ne bougeait pas d'un iota du curseur — et c'était
                mathématiquement normal : le minimum se calcule sur la SOURCE,
                pas sur l'eau coupée. Mais écrite au présent, elle devenait
                fausse à l'usage : à 90 % d'osmosée elle reprochait encore
                « calcium du réseau à 85 ppm pour 80 au maximum », un problème
                que la coupe avait déjà résolu.

                Les raisons, elles, restent justes : ce sont celles qui
                EMPÊCHENT DE DESCENDRE plus bas. La phrase le dit maintenant, et
                se situe par rapport à la coupe en place.
              */}
              {justEnough.pct === 0 ? (
                'Le réseau suffit tel quel : aucun ion ne dépasse le style, l’acide reste sous son seuil.'
              ) : state.diRatioPct > justEnough.pct ? (
                <>
                  Coupe en place {state.diRatioPct} %, minimum {justEnough.pct} % — descendre plus
                  bas buterait sur : {justEnough.reasons.join(' ; ')}.
                </>
              ) : state.diRatioPct === justEnough.pct ? (
                <>C’est le minimum : en dessous, {justEnough.reasons.join(' ; ')}.</>
              ) : (
                <>
                  Sous le minimum de {justEnough.pct} % — {justEnough.reasons.join(' ; ')}.
                </>
              )}
              {/*
                ⚠️ LES MILLILITRES PROSPECTIFS ONT ÉTÉ RETIRÉS D'ICI.

                Ce bloc annonçait « À 40 %, le bicarbonate restant passerait à
                l'acide : 2.8 mL à l'empâtage + 2.7 mL au rinçage » pendant que
                le tableau des additifs, sur le même écran, disait 3.2 et 4.5.
                Deux jeux de millilitres pour un seul acide : « le total acide
                ne représente pas du tout ça — c'est où les ingrédients en
                plus ? ».

                Les avoir passés au conditionnel ne suffisait pas. Le problème
                n'est pas la grammaire : c'est qu'une DOSE se lit sur la fiche
                de pesée, et nulle part ailleurs. Ce bloc garde son rôle — dire
                le taux minimal et POURQUOI il est imposé — et laisse les
                millilitres au seul endroit qui les verse.
              */}
            </p>
          )}

          <DilutionField
            label={hasSparge ? 'Osmosée — empâtage' : 'Part d’eau osmosée'}
            value={state.diRatioPct}
            onChange={(v) => set({ diRatioPct: v })}
            volumeL={hasSparge ? state.mashWaterL : totalWaterL}
          />

          {hasSparge && (
            <div className="pt-2 border-t border-cave-800 space-y-1.5">
              <button
                type="button"
                onClick={() =>
                  set({ spargeDiRatioPct: spargeLinked ? state.diRatioPct : undefined })
                }
                className="w-full text-2xs text-cave-300 hover:text-cave-100 flex items-center gap-1.5 py-1 px-2 rounded-control bg-cave-800 border border-cave-700 transition-colors"
              >
                {spargeLinked ? (
                  <>
                    <Link2 className="w-3.5 h-3.5 text-hop shrink-0" />
                    {/* « Rinçage identique — 12.5 L à 70 % osmosée » se coupait
                        à 375 px. Les deux chiffres suffisent : « identique »
                        dit déjà à quoi. */}
                    <span className="min-w-0 flex-1 text-left truncate">
                      Rinçage identique · {state.spargeWaterL} L
                    </span>
                    <span className="shrink-0 text-cave-400">délier</span>
                  </>
                ) : (
                  <>
                    <Link2Off className="w-3.5 h-3.5 text-ebc-amber shrink-0" />
                    <span className="min-w-0 flex-1 text-left truncate">
                      Rinçage réglé à part
                    </span>
                    <span className="shrink-0 text-cave-400">relier à {state.diRatioPct} %</span>
                  </>
                )}
              </button>

              {!spargeLinked && (
                <DilutionField
                  label="Osmosée — rinçage"
                  value={spargeDi}
                  onChange={(v) => set({ spargeDiRatioPct: v })}
                  volumeL={state.spargeWaterL}
                  hint="Très diluée à l’osmosée, l’eau de rinçage n’extrait pas de tanins."
                />
              )}
            </div>
          )}

          {/*
            ⚠️ Trois chiffres sur une ligne, pas un bandeau de trois cartes.
            Les mêmes valeurs occupaient un encadré à trois colonnes, chacune
            avec son émoji, son intitulé et son trait de séparation — quatre-
            vingts pixels pour ce qui se lit d'un coup d'œil ici. Et la ligne
            « Total … » juste au-dessus répétait déjà le troisième.
          */}
          {totalWaterL > 0 && (
            <p className="pt-2 border-t border-cave-800 text-2xs text-cave-500 flex flex-wrap gap-x-2">
              <span>
                Osmosée <span className="reading text-water font-semibold">{totalOsmoseeL} L</span>
              </span>
              <span>·</span>
              <span>
                Réseau <span className="reading text-cave-300">{totalReseauL} L</span>
              </span>
              <span>·</span>
              <span>
                Total <span className="reading text-ebc-straw font-semibold">{totalWaterL} L</span>
              </span>
            </p>
          )}
        </div>

        {/* 5. Onglets Empâtage / Rinçage & Alcalinité Résiduelle */}
        <div className="space-y-2">
          <div
            role="tablist"
            aria-label="Eau traitée"
            className="flex border-b border-cave-800"
            onKeyDown={(e) => {
              if (!hasSparge) return;
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                setTab(activeTab === 'empatage' ? 'rincage' : 'empatage');
              }
            }}
          >
            {((hasSparge ? ['empatage', 'rincage'] : ['empatage']) as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={activeTab === t}
                tabIndex={activeTab === t ? 0 : -1}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === t
                    ? 'text-cave-50 border-ebc-straw'
                    : 'text-cave-500 border-transparent hover:text-cave-300'
                }`}
              >
                {t === 'empatage' ? 'Empâtage' : 'Rinçage'}
              </button>
            ))}
          </div>

          {activeTab === 'empatage' ? (
            <div className="panel p-2.5 sm:p-3 space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs sm:text-sm text-cave-400">
                  {alkaliGoal.limitedByGrist
                    ? `Alcalinité résiduelle — objectif des sels ≈ ${alkaliGoal.target} ppm (`
                    : `Alcalinité résiduelle — cible ${raBand.min} à ${raBand.max} ppm (`}
                  {/*
                    ⚠️ DIRE CE QUI COMMANDE, pas seulement la teinte.

                    « On utilise beaucoup la couleur EBC pour le calcul, mais
                    est-ce vraiment correct ? » La réponse tenait déjà dans le
                    calcul — la facture corrige la couleur dès qu'on la
                    connaît — mais le panneau affichait « bière noire » dans
                    tous les cas, et laissait croire que la teinte décidait.
                    Elle n'est qu'un substitut de l'acidité du grain, employé
                    quand on n'a pas mieux.
                  */}
                  {alkaliGoal.limitedByGrist ? 'estimation du mash' : raBand.from === 'facture' ? 'd’après ta facture' : raBand.label})
                </span>
                {/*
                  ⚠️ LE GRAND CHIFFRE RESTE L'ALCALINITÉ DE L'EAU, pas celle
                  d'après acide — et ce choix s'est décidé sur un test qui a
                  échoué.

                  J'avais d'abord mis l'arrivée en gros. Or l'acide vise
                  précisément le milieu de la fenêtre : après lui, l'AR vaut
                  TOUJOURS la cible, quoi qu'on fasse. Doubler l'eau
                  d'empâtage ne la déplaçait plus d'un point. Un chiffre qui ne
                  bouge jamais n'apprend rien — c'est celui d'avant qui porte
                  l'information, et c'est lui qu'on lit.

                  L'arrivée passe donc sur la ligne du dessous, où elle répond à
                  l'autre moitié de la question : est-ce que la dose suffit.
                */}
                <span
                  className={`reading text-base sm:text-lg font-bold shrink-0 ${
                    alkaliGoal.limitedByGrist ? 'text-cave-100' : ra >= raBand.min && ra <= raBand.max ? 'text-hop' : 'text-ebc-amber'
                  }`}
                >
                  {Math.round(ra)}
                </span>
              </div>

              {/*
                ⚠️ « On a aucun visuel, vraie info là-dessus. » Voilà ce qui
                manquait : où la dose d'acide amène cette alcalinité. Sans cette
                ligne, le panneau montrait un défaut en ambre et une dose en
                dessous, sans jamais relier les deux.
              */}
              {Math.round(raApresAcide) !== Math.round(ra) && (
                <p className="text-2xs sm:text-sm leading-snug">
                  <span className="text-cave-500">Après l’acide : </span>
                  <span
                    className={`reading font-semibold ${
                      alkaliGoal.limitedByGrist ? 'text-cave-100' : placeAcide === 'juste' ? 'text-hop' : 'text-ebc-amber'
                    }`}
                  >
                    {Math.round(raApresAcide)} ppm
                  </span>
                  <span className="text-cave-500">
                    {alkaliGoal.limitedByGrist
                      ? ' — effet inclus dans l’estimation du pH ci-dessous.'
                      : placeAcide === 'juste'
                      ? ' — dans la cible.'
                      : placeAcide === 'haut'
                        ? ' — encore au-dessus : coupe davantage à l’osmosée.'
                        : ' — SOUS la cible d’alcalinité : vérifier le pH au brassage avant toute correction.'}
                  </span>
                </p>
              )}
              {/*
                ⚠️ Le pH ESTIMÉ, et sa marge affichée avec lui.
                Il ne commande rien : la fenêtre d'AR ne peut être que relâchée
                par la facture de grain, jamais durcie. C'est la garantie
                demandée — pas une goutte d'acide de plus qu'avant.
              */}
              {phEstimate.known ? (
                <>
                  <div className="flex items-baseline justify-between gap-3 pt-1 border-t border-cave-800">
                    {/* « pH d'empâtage estimé — fenêtre 5.2 à 5.5 » laissait le
                        « 5.5 » seul sur une seconde ligne, et repoussait la
                        valeur. Le tiret suffit à dire la fourchette. */}
                    <span className="text-2xs sm:text-sm text-cave-400">
                      pH estimé — cible {MASH_PH_BAND.min}–{MASH_PH_BAND.max}
                    </span>
                    <span
                      className={`reading text-sm sm:text-base font-bold shrink-0 ${
                        phEstimate.position === 0 ? 'text-hop' : 'text-ebc-amber'
                      }`}
                    >
                      {phEstimate.phPredicted.toFixed(2)}
                      <span className="reading-unit"> ±{phEstimate.uncertainty}</span>
                    </span>
                  </div>
                  <p className="text-2xs sm:text-sm text-cave-500 leading-snug">
                    Facture de grain seule : {phEstimate.phDistilled.toFixed(2)} en eau distillée
                    {phEstimate.acidulatedPct > 0 && (
                      <>
                        {' '}
                        · {phEstimate.acidulatedPct} % de malt acidulé, que la couleur ne voit pas
                      </>
                    )}
                    . {phEstimate.note}
                  </p>
                  {/*
                    ⚠️ CETTE PHRASE ÉTAIT CALCULÉE PUIS JETÉE.

                    `targetRaForGrist` rédige déjà « relevée de X ppm par ta
                    facture », et personne ne l'affichait : le champ `hint`
                    n'était rendu nulle part. C'est précisément la réponse à
                    « est-ce vraiment correct d'utiliser la couleur ? » — non,
                    et l'app le savait sans le dire.
                  */}
                  {raBand.from === 'facture' && (
                    <p className="text-2xs sm:text-sm text-hop leading-snug">{raBand.hint}</p>
                  )}
                </>
              ) : (
                <p className="text-2xs sm:text-sm text-cave-500 leading-snug">
                  Le pH d’empâtage ne se prédit pas d’ici : renseigne la couleur EBC des malts.
                  {/* Sans facture, la teinte est le seul indice qui reste — et
                      c'est le seul cas où elle commande pour de bon. */}{' '}
                  Sans elle, c’est la couleur seule qui fixe la cible d’alcalinité.
                </p>
              )}

              {/*
                ⚠️ LA DOSE D'ACIDE, ICI, EN MILLILITRES.

                Signalé ainsi : « j'ai besoin d'un outil pour calculer les ml
                d'acide à ajouter le jour du brassage à cette étape ». Elle
                était pourtant calculée — mais affichée dans le tableau des
                additifs, tout en bas de la feuille des sels. Au moment où
                l'écran annonce « alcalinité 68, cible −30 à 60 », le chiffre
                qui RÉPOND à cette phrase se trouvait à deux écrans de là.

                Une mesure et sa correction se lisent ensemble : l'écart à la
                cible et le nombre de millilitres qui le comble tiennent
                maintenant sur deux lignes voisines. Le tableau du bas garde sa
                fonction — c'est la fiche de pesée, tout y est rassemblé pour
                le jour du brassage.
              */}
              <div className="flex items-baseline justify-between gap-3 pt-1 border-t border-cave-800">
                <span className="text-2xs sm:text-sm text-cave-400 min-w-0">
                  {ACIDS[state.acidId].name} — à l’empâtage
                </span>
                {mashAcid.amount > 0 ? (
                  <span className="reading text-sm sm:text-base font-bold text-ebc-straw shrink-0">
                    {mashAcid.amount}
                    <span className="reading-unit"> {mashAcid.unit}</span>
                  </span>
                ) : (
                  <span className="text-2xs sm:text-sm text-hop shrink-0">rien à corriger</span>
                )}
              </div>

              {/*
                ⚠️ LE RELEVÉ DE pH A QUITTÉ CET ÉCRAN.

                Signalé ainsi : « le pH — Relevé le jour J, 0, écart -5.65 —
                ne sert strictement à rien dans la vue des eaux ». C'est juste,
                et le « 0 » le prouvait : le champ vide se lisait comme zéro et
                fabriquait un écart de -5.65 contre le pH estimé, un chiffre qui
                ne voulait rien dire.

                On ne mesure rien tant que l'eau n'a pas touché le grain. Le
                relevé, et le rattrapage d'acide qu'il commande, vivent
                désormais dans le JOUR DE BRASSAGE, à l'étape d'empâtage —
                minuteur en main, pH-mètre dans la cuve.
              */}

              {!hasSparge && (
                <p className="text-2xs sm:text-sm text-cave-500 leading-snug">
                  Aucun rinçage : toute l’eau passe par la maische, et tous les sels avec elle.
                </p>
              )}
            </div>
          ) : (
            <div className="panel p-2.5 sm:p-3 space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs sm:text-sm text-cave-400">
                  Alcalinité restante — cible pH {spargeAcid.targetPh}
                </span>
                <span
                  className={`reading text-base sm:text-lg font-bold shrink-0 ${
                    spargeAlkalinity <= 25 ? 'text-hop' : 'text-cave-100'
                  }`}
                >
                  {spargeAlkalinity} ppm
                </span>
              </div>
              {spargeAcid.amount > 0 ? (
                <p className="text-2xs sm:text-sm text-cave-300 leading-snug">
                  Soit{' '}
                  <span className="reading text-water font-semibold">
                    {spargeAcid.amount} {spargeAcid.unit}
                  </span>{' '}
                  d’{ACIDS[state.acidId].name.charAt(0).toLowerCase()}
                  {ACIDS[state.acidId].name.slice(1)} — ou davantage d’osmosée.
                </p>
              ) : (
                <p className="text-2xs sm:text-sm text-hop leading-snug">
                  Rien à acidifier : cette eau n’a plus d’alcalinité à neutraliser.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bouton Suivant sur Mobile */}
        <div className="sm:hidden pt-2">
          <button
            type="button"
            onClick={() => handleStepChange('sels')}
            className="w-full min-h-touch py-3 px-4 rounded-control bg-cave-850 hover:bg-cave-800 text-cave-100 text-sm font-medium flex items-center justify-center gap-2 border border-cave-750 transition-colors shadow-sm"
          >
            <span>Profil & pesée des sels</span>
            <ChevronRight className="w-4 h-4 text-ebc-straw" />
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ⚖️ FEUILLE 2 : LES SELS — la toile, la balance, la pesée          */}
      {/* ================================================================= */}
      <div className={`space-y-2 sm:space-y-4 ${activeStep === 'sels' ? 'block' : 'hidden sm:block'}`}>
        {/* En-tête de section Desktop */}
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cave-400 border-b border-cave-800 pb-1.5">
          <Scale className="w-4 h-4 text-hop" />
          <span>2 · Les sels — profil, balance SO₄ ⇄ Cl et pesée</span>
        </div>

        {/*
          La toile, puis le curseur, puis les sels. Cet ordre-là n'est pas
          décoratif : chacun des deux réglages du dessous déplace le dessin du
          dessus, et on doit voir bouger ce qu'on tire.
        */}
        {/*
          ⚠️ LE STYLE CIBLE, remonté ici. Il vivait sur la feuille de l'eau, à
          côté de l'analyse du réseau : depuis la pesée, on ne pouvait plus le
          changer sans repasser une feuille en arrière. Or c'est LUI la cible
          des sels — c'est lui qui dessine les six quartiers verts et qui borne
          le solveur. Il se règle donc là où l'on pèse.
        */}
        {/*
          ⚠️ LA GRAPPE — quatre pièces qui ne se lisent qu'ENSEMBLE.

          Cible+Doser, la toile, le curseur SO₄ ⇄ Cl, la grille des sels et la
          rangée d'acide : on pousse un demi-gramme et on regarde la forme
          bouger. Séparées, chacune perd ce qui la rend lisible.

          D'où l'espacement propre à ce bloc : quatre pixels au doigt au lieu
          des huit du reste de la feuille. Quatre intervalles, seize pixels
          rendus — de quoi faire passer la rangée d'acide au-dessus du pli sur
          un écran de 767 px. Au-dessus du point de rupture sm, la place ne
          manque plus et on revient à la respiration normale.
        */}
        <div ref={workbenchRef} className="space-y-1 pb-[env(safe-area-inset-bottom)] sm:pb-0 sm:space-y-4" aria-label="Profil et commandes de dosage">
        <div className="flex items-center gap-2 px-1">
          <label htmlFor="w-style" className="sr-only sm:not-sr-only text-2xs text-cave-400 shrink-0">
            Cible
          </label>
          <div className="min-w-0 flex-1">
            {/*
              ⚠️ Quand une cible chiffrée est posée, le sélecteur de style
              n'aurait aucun sens : il afficherait un code qui n'est plus celui
              qu'on vise. On montre alors la cible elle-même, et le bouton qui
              la rouvre.
            */}
            {state.customTarget ? (
              <button
                type="button"
                onClick={() => setTargetOpen(true)}
                className="w-full min-h-touch-sm px-3 rounded-control border border-ebc-straw/50
                           bg-cave-900 text-left flex items-center gap-2"
              >
                <Target className="w-4 h-4 text-ebc-straw shrink-0" />
                <span className="text-2xs text-cave-100 truncate">{style.name}</span>
                <span className="text-2xs text-cave-500 shrink-0 ml-auto">modifier</span>
              </button>
            ) : (
              <Combobox
                id="w-style"
                value={style.code}
                onChange={(code) => set({ styleCode: code, ratioOverride: undefined })}
                options={STYLE_WATERS.map((s) => ({
                  value: s.code,
                  label: s.code === '—' ? s.name : `${s.code} — ${s.name}`,
                  detail: s.note
                }))}
                placeholder="NEIPA, Pils, Imperial Stout…"
              />
            )}
          </div>

          {!state.customTarget && (
            <button
              type="button"
              onClick={() => setTargetOpen(true)}
              aria-label="Créer une cible d’eau chiffrée"
              title="La recette donne son eau en ppm ?"
              className="shrink-0 w-9 h-9 rounded-control border border-cave-700 text-cave-300
                         flex items-center justify-center hover:text-ebc-straw hover:border-cave-600"
            >
              <Target className="w-4 h-4" />
            </button>
          )}
          {/*
            La cible et son calcul, sur la même ligne. C'est la même phrase :
            « vise CE style » puis « donne-moi les doses ». La ligne de titre
            qu'ils occupaient chacun de leur côté valait cinquante pixels — ceux
            qui manquaient pour que la troisième rangée de sels passe.
          */}
          {/*
            « Doser » à l'écran, « Proposer les doses » au lecteur d'écran : le
            verbe seul se comprend à côté de la cible qu'il vise, et c'est tout
            ce que la ligne peut porter. Hors contexte, il ne veut plus rien
            dire — d'où le nom accessible complet.
          */}
          {/*
            ⚠️ « DOSER » NE DOIT JAMAIS EFFACER. Signalé ainsi : « le bouton
            doser fonctionne très mal ».

            Sur une eau dont un ion PLAFONNE déjà — Fribourg porte 85 ppm de
            calcium quand un Kölsch en tolère 80 — le solveur ne peut ajouter
            aucun sel calcique, et rend un plan VIDE. Le bouton appliquait ce
            vide : deux grammes de gypse et six de chlorure de calcium posés à
            la main disparaissaient d'un appui, sans avertissement et sans
            retour en arrière. Un bouton qui promet de doser et qui remet tout
            à zéro est pire qu'un bouton absent.

            Il se désactive donc quand il n'y a rien à proposer, et la ligne
            en dessous dit lequel des ions bloque.
          */}
          <button
            type="button"
            aria-label="Proposer les doses"
            disabled={totalWaterL <= 0 || (rienAProposer && !acideForce)}
            /*
              ⚠️ IL REND AUSSI L'ACIDE AU CALCUL. « Vérifie que le bouton de
              génération fonctionne comme il faut avec les acides aussi » — il
              ne le faisait pas : une dose d'acide posée à la main survivait à
              l'appui, et le « plan proposé » sortait moitié calculé, moitié
              forcé, sans que rien ne le dise. Doser propose un plan ENTIER.
            */
            onClick={() => set({ doses: rienAProposer ? state.doses : solution.doses, acidOverride: undefined })}
            className="shrink-0 h-9 px-2.5 rounded-control bg-ebc-straw text-cave-950 font-bold text-2xs
                       flex items-center gap-1 hover:bg-ebc-amber active:scale-[0.98] transition-all shadow-sm
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ebc-straw"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Doser
          </button>
        </div>


        <div className="panel px-1 py-0.5 sm:p-3 space-y-0 sm:space-y-1">
          <WaterRadar
            fitToControls
            start={treatment.startTotal}
            achieved={achievedTotalApresAcide}
            style={style}
            /* L'acide n'apporte pas d'ion : il en RETIRE un, le bicarbonate.
               C'est donc lui que la toile allume. */
            highlight={
              activeSalt === 'acide'
                ? (['hco3'] as Array<keyof WaterIons>)
                : activeSalt
                  ? ionsOf(activeSalt)
                  : undefined
            }
          />

        </div>

        {/* Consigne au doigt, lecture réelle ; une retouche de sel reprend la poignée. */}
        <RatioSlider
          value={wantedRatio}
          onChange={applyRatio}
          achieved={ratio.ratio}
          followingTarget={planApplied}
          ions={achievedTotalApresAcide}
          target={style.ratio}
        />


        {/*
          ⚠️ LA GRILLE 3×3 — neuf sels sur un seul écran de téléphone.

          Les cartes empilées faisaient 150 px chacune : il fallait dérouler
          quatre fois pour voir la pesée, et la toile disparaissait dès la
          deuxième. Or c'est ENSEMBLE que ces deux choses se lisent — on pousse
          un gramme, on regarde la forme bouger.

          Densité assumée, et sous les planchers du système de design : cibles
          de 34 px au lieu de 44, étiquettes à 11 px. Arbitrage explicite de
          Gaëtan — « si tout est plus petit c'est beaucoup mieux ». Le champ de
          saisie, lui, reste tapable : c'est par lui qu'on corrige une erreur de
          pouce, et les ± ne servent qu'à nuancer.
        */}
        <section className="space-y-1">
          <ul className="grid grid-cols-3 gap-x-1 gap-y-0.5">
            {SALT_IDS.map((id) => {
              const def = SALTS[id];
              const off = state.disabled.includes(id);
              const grams = state.doses[id] ?? 0;
              const active = activeSalt === id;
              return (
                <SaltCell
                  key={id}
                  id={id}
                  def={def}
                  grams={grams}
                  off={off}
                  active={active}
                  ions={ionsOf(id)}
                  achievedTotal={achievedTotal}
                  style={style}
                  onDose={(v) => set({ doses: { ...state.doses, [id]: v } })}
                  onToggle={toggleSalt}
                  onActivate={setActiveSalt}
                />
              );
            })}
          </ul>


          {/*
            --- L'ACIDE, DANS LE MÊME BLOC QUE LES SELS ----------------------

            ⚠️ Demandé ainsi : « en plus des sels on ajoute aussi les acides vu
            que c'est directement lié. Ça semble mieux, tout au même endroit. Et
            on voit directement les changements dans le spidergraph ».

            Il vivait en dessous, dans une liste déroulante séparée, alors qu'il
            fait partie de la même correction : les sels APPORTENT des ions,
            l'acide en RETIRE un. Séparer les deux revenait à couper le
            traitement en deux écrans.

            ⚠️ LES DOSES SE MODIFIENT À LA MAIN — je les avais faites en
            lecture seule, et c'était une erreur. Le raisonnement était « un
            millilitre de trop est une faute de calcul, pas une nuance ».
            Gaëtan : « je veux aussi pouvoir moi, modifier les acides pour voir
            leur effets ». Il a raison, et c'est la toile qui le rend évident :
            maintenant qu'elle montre l'acide agir sur le bicarbonate, DÉPLACER
            la dose est le moyen le plus direct de comprendre ce qu'elle change.

            Une dose posée à la main prime sur le calcul, et « recalculer » y
            revient — la même règle que le curseur SO₄ ⇄ Cl.

            Toucher la rangée allume le bicarbonate sur la toile, comme une case
            de sel allume les siens.
          */}
          <div
            onPointerDown={() => setActiveSalt('acide')}
            onPointerEnter={() => setActiveSalt('acide')}
            onFocusCapture={() => setActiveSalt('acide')}
            className={`rounded-control border p-1 transition-all ${
              activeSalt === 'acide'
                ? 'bg-cave-850 border-ebc-straw/60'
                : mashAcid.amount + spargeAcid.amount > 0
                  ? 'bg-cave-900/80 border-ebc-straw/30'
                  : 'bg-cave-900/50 border-cave-800'
            }`}
          >
            {/*
              ⚠️ TROIS COLONNES, PAS DEUX RANGÉES.

              L'acidifiant et ses doses tenaient sur deux étages : le tag
              au-dessus, les cases en dessous, chacune coiffée de son étiquette.
              Quatre-vingt-cinq pixels pour deux nombres — sur un écran où la
              toile en réclame deux cent quatre-vingts et où le bandeau collant
              en prend quarante-huit, c'était la pièce la plus chère au chiffre
              affiché.

              Le tag est étroit et haut de vingt-trois pixels ; les cases sont
              hautes de quarante-sept. Les poser CÔTE À CÔTE fait tenir la
              rangée dans la hauteur de la plus grande — cinquante-cinq au lieu
              de quatre-vingt-cinq — et rend au retour-au-calcul une place sous
              le tag, où il ne pousse plus rien.
            */}
            <div
              className={`grid gap-1 items-end ${
                hasSparge ? 'grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'
              }`}
            >
              <div className="min-w-0">
                <CycleTag<AcidId>
                  name="Acidifiant"
                  value={state.acidId}
                  options={Object.keys(ACIDS) as AcidId[]}
                  onChange={(id) => set({ acidId: id })}
                  label={(id) => ACID_SHORT[id]}
                  className="max-w-full min-w-0"
                />
                {/*
                  Le retour au calcul, visible SEULEMENT quand on s'en est
                  écarté. Sous le tag : la seule place de cette rangée qui ne
                  coûte rien, parce que le tag est plus court que les cases.
                */}
                {acideForce && (
                  <button
                    type="button"
                    onClick={() => set({ acidOverride: undefined })}
                    aria-label="Revenir aux doses d’acide calculées"
                    className="block max-w-full mt-0.5 text-left text-[0.625rem] leading-tight
                               text-ebc-straw hover:text-ebc-gold underline underline-offset-2 truncate"
                  >
                    Calcul : {formatDecimal(mashAcidCalcule.amount)}
                    {hasSparge && ` + ${formatDecimal(spargeAcidCalcule.amount)}`} {mashAcidCalcule.unit}
                  </button>
                )}
              </div>

              <AcidCell
                label="empâtage"
                name={`Dose d’${ACIDS[state.acidId].name.toLowerCase()} à l’empâtage, en ${mashAcid.unit}`}
                unit={mashAcid.unit}
                amount={mashAcid.amount}
                force={state.acidOverride?.mash != null}
                onDose={(v) => set({ acidOverride: { ...state.acidOverride, mash: v } })}
              />
              {hasSparge && (
                <AcidCell
                  label="rinçage"
                  name={`Dose d’${ACIDS[state.acidId].name.toLowerCase()} au rinçage, en ${spargeAcid.unit}`}
                  unit={spargeAcid.unit}
                  amount={spargeAcid.amount}
                  force={state.acidOverride?.sparge != null}
                  onDose={(v) => set({ acidOverride: { ...state.acidOverride, sparge: v } })}
                />
              )}
            </div>
          </div>
        </section>
        </div>

        {alkaliGoal.limitedByGrist && (
          <p className="px-1 text-2xs text-cave-300 leading-snug" aria-label="Objectif du bicarbonate">
            HCO₃ : {formatDecimal(achievedTotalApresAcide.hco3)} ppm sur l’eau totale ; {formatDecimal(Math.round(treatment.treated.mash.hco3 * 10) / 10)} à l’empâtage.
            {' '}Ajout automatique limité par l’estimation du mash. Avec ces doses : pH estimé {phEstimate.phPredicted.toFixed(2)} ±{phEstimate.uncertainty}, à vérifier au brassage.
            {!state.customTarget && ' La plage du style reste un repère, pas une dose à atteindre.'}
          </p>
        )}
        {achievedTotalApresAcide.mg === 0 && style.ions.mg.min === 0 && (brew?.totalGristKg ?? 0) > 0 && (
          <p className="px-1 text-2xs text-cave-400 leading-snug">
            Mg : 0 ppm dans l’eau. Ajout facultatif pour ce profil ; les malts en apportent au moût, hors de ce graphique.
          </p>
        )}
        {differentProfile && (
          <div className="px-1 text-2xs text-cave-300 leading-snug">
            Profil d’eau différent de la recette.{' '}
            <button type="button"
              onClick={() => set({ styleCode: recipeStyle.code, ratioOverride: undefined })}
              className="text-ebc-straw underline underline-offset-2 py-1">
              Utiliser {recipeStyle.name}
            </button>
          </div>
        )}
        {mashAcidDiffers && (
          <p role="status" className="px-1 text-2xs text-cave-300 leading-snug">
            Acide empâtage manuel : {formatDecimal(mashAcid.amount)} {mashAcid.unit} ; calcul : {formatDecimal(mashAcidCalcule.amount)} {mashAcidCalcule.unit}.
            {' '}HCO₃ de l’empâtage : {Math.round(achievedMash.hco3)} → {Math.round(treatment.treated.mash.hco3)} ppm.
          </p>
        )}

        {activeSalt && (
          <p className="text-2xs text-cave-300 leading-snug px-1">
            <span className="font-semibold text-ebc-straw">
              {activeSalt === 'acide' ? ACIDS[state.acidId].name : SALTS[activeSalt].name}
            </span> —{' '}
            {activeSalt === 'acide'
              ? 'Neutralise le bicarbonate ; vérifier la correction sur l’alcalinité de l’empâtage.'
              : SALTS[activeSalt].effect}
          </p>
        )}

        {/*
          ⚠️ TOUT CE QUI SUIT EST PASSÉ SOUS LA GRAPPE.

          Demandé ainsi : « je veux voir le spidergraph sel acide et slider
          SO4 Cl MÊME quand il y a des warning, errors ou autre ».

          Ces blocs — la raison d'un plan vide, les avertissements de sels, la
          note de l'acide, celle du houblonnage, les alertes — étaient SEMÉS
          ENTRE les commandes. Mesuré sur un téléphone de 767 px : chacun
          repoussait vers le bas la grille des sels ou la rangée d'acide, si
          bien qu'une alerte chassait de l'écran exactement les commandes qui
          servent à y répondre. Un avertissement qui cache son remède.

          La règle qui en découle, et qui vaut pour tout ajout futur : la
          grappe TOILE → CURSEUR → SELS → ACIDES est contiguë et ne se laisse
          traverser par rien. Ce qui commente, avertit ou récapitule vient
          après, et peut pousser tant qu'il veut.
        */}

        {/*
          La raison du blocage, tirée de l'eau de DÉPART et de la fourchette du
          style — deux grandeurs réelles, pas une trace du solveur. Elle reste
          donc vraie quelles que soient les doses saisies.

          ⚠️ DEUX CAUSES, DEUX PHRASES. Le message n'accusait que les ions au
          plafond. Mais un plan vide vient aussi — et plus souvent — de sels
          ÉCARTÉS à la main : dire « calcium au plafond » à quelqu'un qui a
          simplement tout éteint désigne le mauvais coupable, et l'envoie couper
          à l'osmosée pour rien.
        */}
        {rienAProposer && (
          <p className="text-2xs text-ebc-amber leading-snug px-1">
            {state.disabled.length >= SALT_IDS.length ? (
              'Rien à proposer : tous les sels sont écartés. Rallume ceux dont tu disposes.'
            ) : ionsAuPlafond.length > 0 ? (
              <>
                Rien à proposer : {ionsAuPlafond.join(', ')} déjà au plafond du style dans l'eau de
                départ. Aucun sel ne peut entrer sans l'aggraver — coupe à l'osmosée pour faire de
                la place.
              </>
            ) : (
              'Rien à proposer : cette eau tombe déjà dans la fourchette du style.'
            )}
          </p>
        )}

        {/*
          L'avertissement du sel ne tient pas dans une case d'un tiers d'écran,
          et il ne parle que des sels réellement pesés — c'est là qu'il compte.

          ⚠️ ET SEULEMENT QUAND C'EST LE CAS. « Au-delà de 150 ppm de sodium, le
          goût devient franchement salé » paraissait dès 0.1 g de sel de table,
          à douze ppm. C'est `saltCautions` qui tranche maintenant, avec la
          valeur atteinte : un avertissement qui ne se déclenche jamais apprend
          à ne plus lire les avertissements.
        */}
        {cautions.map((c) => (
          <p
            key={c.id}
            className={`text-2xs leading-snug px-1 ${c.franchi ? 'text-ebc-amber' : 'text-cave-400'}`}
          >
            {c.franchi ? '⚠️' : 'ℹ️'} {SALT_SHORT[c.id]} — {c.text}
          </p>
        ))}

        {/*
          Ce que fait l'acide choisi. Il commente la rangée du dessus ; il n'y
          est plus, parce qu'il la séparait de la grille des sels.

          Le seuil de goût, lui, ne s'invite que dans sa marche d'approche : au
          delà, c'est l'alerte du solveur qui le dit, plus fort et avec le
          chiffre réel.
        */}
        <p className="text-2xs text-cave-500 leading-snug px-1">
          {ACIDS[state.acidId].note}
          {seuilGoutProche && ` ${ACIDS[state.acidId].taste!.text}`}
        </p>
        {/*
          Ce que le HOUBLONNAGE dit de la direction à prendre. Il ne commande
          pas — le style tient la fourchette, le brasseur tient le curseur.
        */}
        {!state.customTarget && (
          <details className="text-2xs text-cave-400 px-1">
            <summary className="cursor-pointer py-1">Repères du profil · sources</summary>
            <p className="pt-1">{style.note}</p>
            <p className="pt-1">Plages indicatives pour l’eau, pas des normes BJCP. La zone HCO₃ est un repère fixe du profil. Le dosage des alcalins et de l’acide dépend de la maische et du pH.</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
              {WATER_PROFILE_SOURCES.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline text-water">{s.name}</a>)}
            </div>
          </details>
        )}
        {hopHint?.note && (
          <p className="text-2xs text-cave-500 leading-snug px-1">{hopHint.note}</p>
        )}
        {hopHint &&
          state.ratioOverride !== undefined &&
          Math.abs(state.ratioOverride - hopHint.ratio) >= 0.1 && (
            <button
              type="button"
              onClick={() => applyRatio(hopHint.ratio)}
              className="text-2xs text-ebc-straw hover:text-ebc-gold underline underline-offset-2 px-1"
            >
              Revenir au {hopHint.ratio} que dit le houblonnage
            </button>
          )}


        {/*
          Alertes et remarques.

          ⚠️ Celles du SOLVEUR (`unreachable`) ne s'affichent que si son plan est
          effectivement appliqué — voir `planApplied`. Les trois autres lisent
          l'eau réelle (`achievedMash`, `mashAcid`, `spargeAcid`) et restent donc
          vraies quelles que soient les doses saisies.
        */}
        {(messagesSolveur.length > 0 ||
          caShort ||
          lactate > LACTATE_TASTE_THRESHOLD ||
          spargeAcid.warning) && (
          <ul className="space-y-1.5 panel p-2.5 sm:p-3 bg-amber-950/20 border border-ebc-amber/40 rounded-control">
            {messagesSolveur.map((msg, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </li>
              ))}

            {caShort && (
              <li className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Calcium à {Math.round(achievedMash.ca)} ppm, le style en demande au moins{' '}
                  {style.ions.ca.min}. Sous 40 ppm la levure floconne mal et les oxalates restent en
                  solution.
                </span>
              </li>
            )}

            {lactate > LACTATE_TASTE_THRESHOLD && (
              <li className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Acide lactique cumulé : {lactate} g par litre de bière ({mashAcid.amount} +{' '}
                  {spargeAcid.amount} mL pour {beerVolumeL} L) — au-delà de{' '}
                  {LACTATE_TASTE_THRESHOLD}, il commence à se goûter. Passe au phosphorique, ou
                  coupe davantage à l’osmosée.
                </span>
              </li>
            )}

            {spargeAcid.warning && (
              <li className="flex items-start gap-2 text-xs text-ebc-amber leading-snug">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{spargeAcid.warning}</span>
              </li>
            )}
          </ul>
        )}

        {/*
          ⚠️ Ce réglage est passé SOUS la grille. Il décide de la répartition
          des doses entre les deux eaux — il n’a donc rien à faire avant
          qu’il y ait des doses, et il prenait cent dix pixels juste au-dessus
          de la pesée, ceux qui manquaient pour voir la toile et les neuf sels
          d’un seul écran.
        */}
        {/* Switch Tous les sels à l'empâtage (Recommandé) */}
        {hasSparge && (
          <div className="p-3 rounded-control bg-cave-900/80 border border-cave-750 flex items-start gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={allSaltsInMash}
              aria-label="Tous les sels à l’empâtage"
              onClick={() => set({ allSaltsInMash: !allSaltsInMash })}
              /* Même traitement que les autres interrupteurs : la zone
                 d'attrape s'écarte, le dessin ne bouge pas. */
              className="shrink-0 p-2 -m-2 mt-0 rounded-full"
            >
              <span
                className={`block w-10 h-6 rounded-full relative transition-colors ${
                  allSaltsInMash ? 'bg-hop' : 'bg-cave-700'
                }`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-cave-50 transition-all"
                  style={{ left: allSaltsInMash ? 18 : 2 }}
                />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-cave-100">
                  Tous les sels à l’empâtage
                </span>
                <span className="text-2xs text-hop bg-hop/15 px-1.5 py-0.5 rounded font-medium">
                  Recommandé
                </span>
              </div>
              <span className="block text-2xs sm:text-sm text-cave-400 leading-snug mt-0.5">
                {allSaltsInMash
                  ? '100 % des sels sont versés dans la cuve d’empâtage. L’eau de rinçage est ajustée uniquement à l’acide.'
                  : 'Répartition proportionnelle des sels entre empâtage et rinçage.'}
              </span>
            </div>
          </div>
        )}

        {/*
          7. (L'acidifiant a REJOINT la grille des sels, plus haut. Il n'y a
          plus de liste déroulante isolée : le produit se choisit sur la rangée
          qui affiche ses doses.)

          8. Tableau récapitulatif des additifs (fiche de pesée finale)
        */}
        <section className="space-y-2">
          <h2 className="text-xs sm:text-sm font-semibold text-cave-200">
            Total des additifs nécessaires
          </h2>
          <WaterAdditivesTable
            doses={state.doses}
            split={split}
            acidId={state.acidId}
            mashAcid={mashAcid}
            spargeAcid={spargeAcid}
            totalWaterL={totalWaterL}
            hasSparge={hasSparge}
            allSaltsInMash={allSaltsInMash}
            spargeTargetPh={spargeAcid.targetPh}
          />

          <p className="text-2xs sm:text-sm text-cave-500 leading-snug px-1">
            L’acide de l’empâtage vise l’alcalinité résiduelle de la bière ; celui du rinçage vise
            pH {spargeAcid.targetPh} pour ne pas extraire les tanins. Deux eaux, deux doses, deux
            moments — ils ne s’additionnent pas dans un même seau.
            {lactate > 0 && state.acidId === 'lactique' && (
              <> Dans la bière finie, cela fait {lactate} g/L d’acide lactique.</>
            )}
          </p>
        </section>

        {/* Navigation Mobile Retour */}
        <div className="sm:hidden pt-2">
          <button
            type="button"
            onClick={() => handleStepChange('eau')}
            className="w-full min-h-touch-sm py-2.5 px-3 rounded-control bg-cave-900 hover:bg-cave-850 text-cave-400 text-2xs flex items-center justify-center gap-1 border border-cave-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Revoir l’eau et les volumes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
