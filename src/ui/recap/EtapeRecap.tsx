import { Input, Textarea } from '../Input';
import { RecipeDisclosure, RecipeWaterVolumes } from '../RecipeDisclosure';
import { MaltDetails } from '../MaltDetails';
import { LearnIngredient } from '../../domain/ingredientFacts';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, Check, Droplets, ChevronDown, ShoppingCart, Scale, Copy, AlertTriangle } from 'lucide-react';
import { RecipeTextExport } from '../RecipeTextExport';
import type { BrewSheetProps, WaterRecap } from '../BrewSheet';
import type { ListedStyle } from '../../domain/brewingStyles';
import type { HopKnowledge } from '../../../functions/src/hopPredictionSchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { buildYeastCompanion } from '../../domain/yeastCompanion';
import type { RecipeReadiness, RecipeFieldIssue } from '../../domain/recipeValidation';
import { RecapEtat } from '../RecapEtat';
import { teinte as teinteEbc } from '../fermentescibles/modele';
import { plageEbc } from '../identite/plages';
import { ACIDS } from '../../domain/water/substances';
import { Piste, domaineSo4, Aromes, MiniCourbe, DEGRADE_EBC, fr, texteSuisse, type Plage } from './pistes';
import './recap.css';
import {
  Fermentable,
  HopIngredient,
  YeastSpec,
  TempStep,
  FermentationStep,
  WaterIons,
  SaltId,
  AcidId
} from '../../types';
import { Units } from '../../services/units';
import { HOP_STAGE } from '../../domain/hopStage';
import { patchIndexedHop } from '../../domain/hopIndex/recipeBindings';
import { ION_LABEL, SALTS } from '../../domain/water';
import { NumberInput } from '../NumberInput';
import { WaterAdditivesTable } from '../WaterAdditivesTable';
import { WaterRadar } from '../WaterRadar';
import { WaterTargetStatus } from '../water/WaterTargetStatus';
import { StyleWater } from '../../domain/waterStyles';
import { useDensity } from '../useViewport';
import { inputClass } from '../FormNav';
import { RecipeReview } from '../RecipeReview';
import { formatDecimal, messageRefus } from '../numericInput';
import { uniteAccordee } from '../../domain/fermentables/parts';
import { reglageQuantiteLevure } from '../../domain/levure/affichage';
import { besoinDeLaLevure } from '../etapeLevure/dose';
import { useYeastSupply } from '../../hooks/useYeastSupply';
import { yeastReferences } from '../../domain/yeastReferences';
import { resolveFermentationYeast } from '../../domain/fermentationScenario';
import { masseLigneRetenue } from '../../domain/bornesMetier';
import { EBULLITION_SAISIE_MAX, VOLUME_SAISIE_MAX } from '../identite/regles';

/** Preserve Units' conversion and rounding; only localize the displayed number. */
const formatQuantity = (quantity: number, unit: string) =>
  Number.isFinite(quantity) ? Units.format(quantity, unit).replace(/^(-?\d+)\.(\d+)/, '$1,$2') : `— ${unit}`;
const formatFixed = (value: number, digits: number) =>
  Number.isFinite(value) ? value.toFixed(digits).replace('.', ',') : '—';
const formatReading = (value: number) => formatDecimal(value) || '—';

/**
 * La fiche de brassage : tout ce qui compose la recette, sur un seul écran, et
 * TOUT modifiable là où c'est affiché.
 *
 * ⚠️ Ce qu'elle règle. Le récapitulatif était une liste de définitions en
 * lecture seule. Gaëtan : « je veux pas aller dans chaque sous-menu pour
 * adapter ». Corriger 100 g sur un houblon obligeait à remonter le fil
 * d'étapes, retrouver la ligne, la changer, redescendre — six gestes pour un
 * chiffre. Ici la valeur SE CHANGE À L'ENDROIT OÙ ON LA LIT.
 *
 * Deux règles de composition :
 *
 *   - Une ligne par ingrédient, hauteur adaptée au contenu : le nom se lit, les nombres se
 *     tapent. Les sections restent indépendantes : on doit pouvoir parcourir
 *     les volumes et pesées essentiels, puis ouvrir les détails utiles.
 *
 *   - Les champs n'ouvrent PAS le clavier du système (`pad`) : sur une fiche de
 *     vingt valeurs, le clavier passerait son temps à masquer celle d'après.
 *
 * Ce qui est CALCULÉ (part du grain, IBU d'un ajout) reste en lecture : c'est
 * une conséquence des saisies, pas une saisie.
 */

/** Une ligne de fiche : une étiquette à gauche, ce qu'on modifie à droite. */
const Row: React.FC<{
  label: React.ReactNode;
  hint?: React.ReactNode;
  onDelete?: () => void;
  children: React.ReactNode;
}> = ({ label, hint, onDelete, children }) => (
  <div className="py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2">
    <div className="min-w-0 flex-1">
      {/* BR-25 : le nom passe à la ligne (« Fermentation primaire » était coupé en « Fermentation prim… » à 390). */}
      <div className="text-sm sm:text-base text-cave-50 break-words leading-tight">{label}</div>
      {hint && <div className="text-sm text-cave-400 truncate leading-tight mt-0.5">{hint}</div>}
    </div>
    <div className="shrink-0 flex items-center gap-1 sm:gap-1.5">{children}</div>
    {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        aria-label="Retirer"
        className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-control -mr-1 text-cave-400 hover:text-alert transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    )}
  </div>
);

/** Champ numérique de fiche : étroit, avec son unité collée. */
const Cell: React.FC<{
  value: number | undefined;
  onValue: (n: any) => void;
  unit: string;
  width?: string;
  integer?: boolean;
  emptyValue?: number | undefined;
  min?: number;
  max?: number;
  label: string;
  /** Hors bornes, la saisie est refusée (valeur d'avant gardée, message) au lieu d'être ramenée à la borne : les lignes de houblon (TE-21, BR-42). */
  refuser?: boolean;
}> = (props) => {
  const { value, onValue, unit, width = 'w-[4.5rem] sm:w-20', integer, min, max, label } = props;
  // An erased required measure remains unavailable until the wizard validates it.
  const emptyValue = 'emptyValue' in props ? props.emptyValue : Number.NaN;
  // TE-21, BR-42 : une saisie hors bornes (α 150 %, −5 min, −1 g) était ramenée à la borne sans un mot. Elle est refusée : la valeur d'avant reste ET le dit (role="alert"), comme VI-9.
  const [refus, setRefus] = React.useState<string | null>(null);
  const idRefus = React.useId();
  return (
    <>
    <span className="flex items-baseline gap-1">
      <NumberInput
        value={value}
        onValue={onValue}
        integer={integer}
        emptyValue={emptyValue}
        min={min}
        max={max}
        rejeter={props.refuser}
        onRefus={(r) => setRefus(r ? messageRefus(r.saisi, r.retenu, { min, max, unite: unit.replace('%α', '%') }) : null)}
        aria-invalid={refus ? true : undefined}
        aria-describedby={refus ? idRefus : undefined}
        pad
        aria-label={label}
        className={`${width} min-h-touch px-1.5 sm:px-2 rounded-control bg-cave-950 border border-cave-700
                    font-mono font-semibold text-right text-sm sm:text-base text-cave-50
                    focus:outline-none focus:border-ebc-straw focus:ring-1 focus:ring-ebc-straw/40`}
      />
      <span className="reading-unit w-6 sm:w-8 text-sm shrink-0">{unit}</span>
    </span>
    {refus && <p id={idRefus} role="alert" className="basis-full w-full text-xs text-alert leading-snug">{refus}</p>}
    </>
  );
};

/** Bloc titré de la fiche. Plus serré qu'une `Section` : il y en a huit. */
export type RangeeId = 'identite' | 'fermentescibles' | 'houblons' | 'levure' | 'paliers' | 'eau';

/** Ce que la rangée m2 montre fermée : tout est tiré du moteur et de l'état de l'assistant par `EtapeRecap`. */
interface ResumeRangee {
  /** Nombre de repères manquants de l'étape (0 : coche). */
  manques: number;
  /** Étape sans aucune donnée : coche remplacée par un cercle tireté. */
  vide?: boolean;
  nom: string;
  texte: React.ReactNode;
  pistes?: React.ReactNode;
  droite?: React.ReactNode;
  /** Sous le résumé, pleine largeur de la rangée (la toile de l'eau). */
  toile?: React.ReactNode;
  /** Corps ajouté avant la fiche (le geste de la Levure). */
  geste?: React.ReactNode;
}
const RecapCtx = createContext<Partial<Record<RangeeId, ResumeRangee>>>({});

/** Même garde que `RecipeDisclosure` : une saisie refusée ou invalide ouvre la rangée qui la porte, jamais cachée dans un repli. */
function useReveleErreurs(ref: React.RefObject<HTMLDetailsElement>) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reveler = () => {
      if (!node.querySelector('[aria-invalid="true"],[role="alert"]')) return;
      let section: HTMLDetailsElement | null = node;
      while (section) { section.open = true; section = section.parentElement?.closest('details') ?? null; }
    };
    reveler();
    const observer = new MutationObserver(reveler);
    observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-invalid', 'role'] });
    return () => observer.disconnect();
  }, [ref]);
}

/**
 * Une rangée de la liste m2 : un <details> dont le résumé est la rangée (coche, nom, mini-piste, chevron) et dont le corps est la fiche d'aujourd'hui,
 * rendue à l'avance (fermée, elle reste dans la page : rien du récapitulatif n'est perdu).
 */
const Rangee: React.FC<{ id: RangeeId; title: string; children: React.ReactNode }> = ({ id, title, children }) => {
  const r = useContext(RecapCtx)[id];
  const ref = useRef<HTMLDetailsElement>(null);
  useReveleErreurs(ref);
  if (!r) return null;
  return (
    <div role="listitem" className="rc2-li" data-rangee={id}>
      <details ref={ref} data-recipe-section={title} data-booster={`rangee-${id}`} className={`rc2-det${id === 'levure' ? ' rc2-rlev' : ''}${id === 'houblons' ? ' rc2-rhop' : ''}`}
        onInvalidCapture={event => { event.currentTarget.open = true; }}>
        <summary>
          <span className="rc2-titre">{title}</span>
          <span className={`rc2-st${r.manques > 0 ? ' rc2-a' : ''}${r.vide ? ' rc2-vide' : ''}`} aria-label={r.manques > 0 ? `${r.manques} repère${r.manques > 1 ? 's' : ''}` : 'complet'}>
            {r.manques === 0 && !r.vide && <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />}
          </span>
          <span className="rc2-n"><strong aria-hidden="true">{r.nom}</strong><span>{r.texte}</span>{r.pistes && <span className="rc2-pis">{r.pistes}</span>}</span>
          <span className="rc2-x">{r.droite}</span>
          <ChevronDown className="rc2-chev w-4 h-4" aria-hidden="true" />
        </summary>
        {r.toile}
        {r.geste && <div className="rc2-dep" data-element={`m2-depli-${id}`}>{r.geste}</div>}
        <div className="rc2-corps divide-y divide-cave-850">{children}</div>
      </details>
    </div>
  );
};

/**
 * Les six étapes (Identité … Eau) sont des rangées de la liste m2 ; Fermentation, Stock et Déroulé n'ont pas de rangée dans m2 : ils restent des sections
 * rendues à l'avance, invisibles tant qu'on ne les ouvre pas (Plus › Fermentation / Déroulé, pastille « à commander »).
 */
const Block: React.FC<{
  id?: RangeeId;
  aux?: 'fermentation' | 'stock' | 'deroule';
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, aux, title, aside, children }) => {
  if (id) return <Rangee id={id} title={title}>{children}</Rangee>;
  return <div className="rc2-aux" data-aux={aux}><RecipeDisclosure title={title} summary={aside}><div className="divide-y divide-cave-850">{children}</div></RecipeDisclosure></div>;
};


/** Ce que l'assistant ajoute à la fiche d'aujourd'hui pour la liste m2 : le style, le moteur (IBU, EBC, FG, alcool), l'état de la recette, les gestes de sortie. */
export interface EtapeRecapProps extends Omit<BrewSheetProps, 'reviewData'> {
  reviewData?: Record<string, unknown>;
  recipeForCompanion: TrialRecipe;
  knowledge: HopKnowledge[];
  styleRepere?: ListedStyle;
  readiness: RecipeReadiness;
  etapeLabel: (issue: RecipeFieldIssue) => string;
  onCorriger: (issue: RecipeFieldIssue) => void;
  onAllerEtape: (id: 'identite' | 'fermentescibles' | 'houblons' | 'levure' | 'paliers' | 'eau') => void;
  ibu: number | null;
  ebc: number | null;
  fgRange?: Plage | null;
  abvRange?: Plage | null;
  /** « Brasser » du menu Plus : enregistrer et préparer un brassin. */
  onBrasser: () => void;
  /** Dans Plus : l'estimation du budget et l'atelier NOLO (composants d'aujourd'hui). */
  budget?: React.ReactNode;
  atelierNolo?: React.ReactNode;
  /** Sous le verdict : l'aperçu NOLO et l'avis d'eau d'aujourd'hui. */
  sousVerdict?: React.ReactNode;
}

export const EtapeRecap: React.FC<EtapeRecapProps> = ({
  recipeForCompanion,
  knowledge,
  styleRepere,
  readiness,
  etapeLabel,
  onCorriger,
  onAllerEtape,
  ibu,
  ebc,
  fgRange,
  abvRange,
  onBrasser,
  budget,
  atelierNolo,
  sousVerdict,
  onLearnIngredient,
  reviewData,
  yeastSummary,
  name,
  onName,
  style,
  onStyle,
  volumeL,
  onVolumeL,
  boilMin,
  onBoilMin,
  carboTarget,
  onCarboTarget,
  fermentables,
  onFermentables,
  totalGristKg,
  hops,
  onHops,
  hopIbu,
  yeast,
  onYeast,
  mashSteps,
  onMashSteps,
  fermentation,
  onFermentation,
  mashWaterL,
  onMashWaterL,
  spargeWaterL,
  onSpargeWaterL,
  water,
  onEditWater,
  notes,
  onNotes,
  onExportText,
  shortages
}) => {
  const tight = useDensity() === 'tight';
  const supply = useYeastSupply();
  // CT4-B-3 : la part du besoin que la dose écrite couvre (même calcul que la carte de dose de l'étape Levure : `besoinDeLaLevure`). Sous 100 %, la
  // coche « Enregistrable » reste (une dose basse s'enregistre) mais le Récap le dit. Inconnu (sans volume, sans sachet) : rien, jamais 0 %.
  const partDuBesoin = useMemo(() => {
    if (!(Number.isFinite(yeast.qty) && yeast.qty > 0) || !yeast.name.trim()) return undefined;
    try {
      const recette = { ...recipeForCompanion, yeast } as TrialRecipe;
      const levure = resolveFermentationYeast(recette as never, yeastReferences(knowledge));
      const besoin = besoinDeLaLevure(recette, supply, recette.ogTarget, levure);
      if (!besoin?.sachet || !(besoin.sachets !== undefined && besoin.sachets > 0)) return undefined;
      const u = (yeast.unit ?? '').toLocaleLowerCase('fr');
      const sachets = u === 'sachet' || u === 'pack' ? yeast.qty : u === 'g' && besoin.sachet.grammes ? yeast.qty / besoin.sachet.grammes : undefined;
      if (sachets === undefined) return undefined;
      const part = Math.round((sachets / besoin.sachets) * 100);
      return part < 100 ? part : undefined;
    } catch { return undefined; }
  }, [recipeForCompanion, yeast, knowledge, supply]);

  const patchFerm = (i: number, patch: Partial<Fermentable>) => {
    // BR-21 : une masse négative ne se retient pas, 10 t au plus. Un champ VIDÉ du récapitulatif reste une absence (NaN, « à renseigner »), comme tous ses
    // champs : jamais un 0 inventé ; `undefined` devient cette même absence.
    if ('weightKg' in patch) {
      const vide = patch.weightKg === undefined || Number.isNaN(patch.weightKg);
      const kg = vide ? Number.NaN : masseLigneRetenue(patch.weightKg);
      if (kg === null) return;
      patch = { ...patch, weightKg: kg };
    }
    onFermentables(fermentables.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  };
  const patchHop = (i: number, patch: Partial<HopIngredient>) =>
    onHops(hops.map((h, j) => (j === i ? patchIndexedHop(h, patch) : h)));

  const totalHopG = hops.reduce((s, h) => s + h.weightG, 0);
  const hasStockNeeds = fermentables.some(f => f.name.trim() && f.weightKg > 0)
    || hops.some(h => h.name.trim() && h.weightG > 0)
    || Boolean(yeast.name.trim() && yeast.qty > 0 && yeast.unit);
  const incompleteStockNeeds = fermentables.some(f => !f.name.trim() || !Number.isFinite(f.weightKg) || f.weightKg <= 0)
    || hops.some(h => !h.name.trim() || !Number.isFinite(h.weightG) || h.weightG <= 0)
    || Boolean(yeast.name.trim() && (!Number.isFinite(yeast.qty) || yeast.qty <= 0 || !yeast.unit));
  const stockShortages = shortages.filter(item => item.status !== 'unverified').length;
  const stockToVerify = shortages.length - stockShortages;
  const stockSummary = shortages.length > 0
    ? <span role="status" className="inline-flex max-w-full items-center gap-1 rounded-full border border-attention/40 bg-attention/10 px-1.5 py-px text-xs leading-tight text-attention">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{[stockShortages ? `${stockShortages} ingrédient${stockShortages > 1 ? 's' : ''} à commander` : '', stockToVerify ? `${stockToVerify} à vérifier` : ''].filter(Boolean).join(' · ')}</span>
      </span>
    : <span role="status" className="inline-flex max-w-full items-center gap-1 text-xs leading-tight text-cave-200">
        {hasStockNeeds && !incompleteStockNeeds && <Check className="w-3.5 h-3.5 shrink-0 text-hop" aria-hidden="true" />}
        {incompleteStockNeeds ? 'Besoins à compléter' : hasStockNeeds ? 'Stock suffisant' : 'Besoins à renseigner'}
      </span>;

  /*
   * Les houblons se lisent dans l'ordre de la JOURNÉE, pas dans celui où on les
   * a saisis : premier moût, ébullition, whirlpool, cru. C'est l'ordre dans
   * lequel on les pèsera.
   */
  const hopsInOrder = hops
    .map((h, index) => ({ h, index }))
    .sort((a, b) => HOP_STAGE[a.h.stage].order - HOP_STAGE[b.h.stage].order);

  // ------------------------------------------------------------------ la liste m2 : ce que chaque rangée montre fermée
  const racine = useRef<HTMLDivElement>(null);
  const [plusOuvert, setPlusOuvert] = useState(false);
  const [relireOuvert, setRelireOuvert] = useState(false);
  const [copie, setCopie] = useState(false);
  const manques = (id: RangeeId) => readiness.missing.filter(i => i.step === id).length + readiness.invalid.filter(i => i.step === id).length;
  const stats = styleRepere?.stats;
  const codeStyle = styleRepere?.code;
  const finie = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
  const plageTxt = (p: Plage | null | undefined, d: number) => !p ? '—' : p.min === p.max ? fr(p.min, d) : `${fr(p.min, d)}–${fr(p.max, d)}`;
  const posTxt = (v: number | null | undefined, p?: Plage) => !p || !finie(v) ? 'plage du style inconnue' : v < p.min ? 'sous la plage' : v > p.max ? 'au-dessus de la plage' : 'dans la plage';
  const plageEbcStyle = plageEbc(stats?.srm);
  const tete = hopsInOrder[0]?.h;
  const defTete = tete ? HOP_STAGE[tete.stage] : undefined;
  const tempsTete = tete && defTete && (defTete.ask === 'time' || defTete.ask === 'timeAndTemp') && finie(tete.timeMin) ? `${tete.timeMin}′` : '';
  const total = Math.round((mashWaterL + spargeWaterL) * 10) / 10;
  const so4 = water?.wortIons?.so4;
  const plageSo4: Plage | undefined = water?.style && !water.style.untargetedIons?.includes('so4') ? water.style.ions.so4 : undefined;
  const nomsMalts = fermentables.filter(f => f.name.trim()).map(f => f.name.trim());
  const qteLevure = finie(yeast.qty) && yeast.qty > 0 && yeast.unit ? `${yeast.qty.toLocaleString('fr-FR')} ${uniteAccordee(yeast.unit, yeast.qty)}` : '';
  const reglage = reglageQuantiteLevure(yeast.form, yeast.unit, yeast.qty);
  const pisteIbu = <Piste nom="IBU" domaine={{ min: 0, max: 100 }} plageStyle={stats?.ibu} point={ibu} droite={stats?.ibu ? texteSuisse(stats.ibu) : '—'}
    aria={`IBU ${finie(ibu) ? ibu : 'inconnu'}, ${posTxt(ibu, stats?.ibu)}${stats?.ibu ? ` ${codeStyle ?? 'style'} ${texteSuisse(stats.ibu)}` : ''}`} />;
  const rangees: Partial<Record<RangeeId, ResumeRangee>> = {
    identite: {
      manques: manques('identite'), nom: 'Identité',
      texte: <>{style.trim() || 'style à choisir'}<span className="rc2-m rc2-sp">{formatQuantity(volumeL, 'L')}</span>{!name.trim() && <span className="rc2-at rc2-sp">nom</span>}</>,
      droite: codeStyle ? <span className="rc2-sty" role="img" aria-label={`style ${codeStyle}`}><i />{codeStyle}</span> : undefined
    },
    fermentescibles: {
      manques: manques('fermentescibles'), vide: fermentables.length === 0, nom: 'Malts/sucres',
      texte: nomsMalts.length ? `${nomsMalts.slice(0, 2).join(', ')}${nomsMalts.length > 2 ? ` +${nomsMalts.length - 2}` : ''}` : 'aucun fermentescible',
      pistes: <Piste nom="EBC" domaine={{ min: 0, max: 50 }} plageStyle={plageEbcStyle} point={ebc} droite={plageEbcStyle ? texteSuisse(plageEbcStyle) : '—'}
        teinte={finie(ebc) ? { fond: teinteEbc(ebc) } : undefined}
        aria={`EBC ${finie(ebc) ? fr(ebc, 1) : 'inconnu'}, teinte du verre, ${posTxt(ebc, plageEbcStyle)}${plageEbcStyle ? ` ${codeStyle ?? 'style'} ${texteSuisse(plageEbcStyle)}` : ''}`} />
    },
    houblons: {
      manques: manques('houblons'), vide: hops.length === 0, nom: 'Houblons',
      texte: tete ? <>{tete.name}{finie(tete.alpha) && tete.alpha > 0 && <span className="rc2-m rc2-sp">{fr(tete.alpha, tete.alpha % 1 ? 1 : 0)} % α</span>}{finie(tete.weightG) && <span className="rc2-m rc2-sp">{tete.weightG} g</span>}{tempsTete && <span className="rc2-m rc2-sp">{tempsTete}</span>}{hops.length > 1 && <span className="rc2-sp">+{hops.length - 1}</span>}</> : 'aucun houblon',
      pistes: pisteIbu,
      droite: <Aromes hops={hopsInOrder.map(x => x.h)} />
    },
    levure: {
      manques: manques('levure'), vide: !yeast.name.trim(), nom: 'Levure',
      texte: yeast.name.trim() ? <>{yeast.name}{qteLevure ? <span className="rc2-m rc2-sp">{qteLevure}</span> : <span className="rc2-at rc2-sp">quantité, unité</span>}{partDuBesoin !== undefined && <span className="rc2-at rc2-sp">{partDuBesoin} % du besoin</span>}</> : <span className="rc2-at">à choisir</span>,
      pistes: <>
        <Piste nom="FG" domaine={{ min: 1, max: 1.024 }} plageStyle={stats?.fg} plageValeur={fgRange} droiteStyle="valeur" droite={fgRange ? plageTxt(fgRange, 3) : '— · voir Levure'}
          aria={`FG ${fgRange ? plageTxt(fgRange, 3) : 'inconnue'}${stats?.fg ? `, plage ${codeStyle ?? 'style'} ${texteSuisse(stats.fg, 3)}` : ''}`} />
        <Piste nom="Alcool" domaine={{ min: 4, max: 9 }} plageStyle={stats?.abv} plageValeur={abvRange} droiteStyle="valeur" droite={abvRange ? `${plageTxt(abvRange, 1)} %` : '— · voir Levure'}
          aria={`Alcool ${abvRange ? plageTxt(abvRange, 1) + ' %' : 'inconnu'}${stats?.abv ? `, plage ${codeStyle ?? 'style'} ${texteSuisse(stats.abv)} %` : ''}`} />
      </>,
      geste: <>
        <div className="rc2-p2">
          <span className="rc2-lb">Unité <b>1/2</b></span>
          <span className="rc2-seg" role="radiogroup" aria-label="Unité de la levure">
            {reglage.unites.map(u => <button key={u} type="button" role="radio" aria-checked={yeast.unit === u} onClick={() => onYeast({ ...yeast, unit: u as YeastSpec['unit'] })}>{u}</button>)}
          </span>
        </div>
        <div className="rc2-p2">
          <span className="rc2-lb">Quantité <b>2/2</b></span>
          <span className="rc2-sl">
            <input type="range" aria-label="Curseur de quantité de levure" min={reglage.min} max={reglage.max} step={reglage.step}
              value={finie(yeast.qty) ? yeast.qty : 0} onChange={e => onYeast({ ...yeast, qty: Number(e.target.value) })} />
          </span>
        </div>
        <button type="button" className="rc2-aller" data-booster="aller-etape" onClick={() => onAllerEtape('levure')}>Aller à Levure <span className="rc2-m">4/7</span></button>
      </>
    },
    paliers: {
      manques: manques('paliers'), vide: mashSteps.length === 0, nom: 'Paliers',
      texte: mashSteps.length ? <>{mashSteps.map((s, i) => <React.Fragment key={`${s.name}-${i}`}>{i > 0 && <span className="rc2-sp">{/mash/i.test(s.name) ? 'mash-out' : s.name}</span>}<span className={`rc2-m${i > 0 ? ' rc2-sp' : ''}`}>{finie(s.tempC) ? `${s.tempC} °C` : '— °C'}</span>{i === 0 && <span className="rc2-m rc2-sp">{finie(s.durationMin) ? `${s.durationMin}′` : '—′'}</span>}</React.Fragment>)}</> : 'aucun palier',
      droite: <span className="rc2-courbe"><MiniCourbe paliers={mashSteps} /></span>
    },
    eau: {
      manques: manques('eau'), nom: 'Eau',
      texte: <span className="rc2-m">{formatQuantity(total, 'L')}</span>,
      pistes: finie(so4) ? <Piste nom="SO₄" domaine={domaineSo4(plageSo4)} plageStyle={plageSo4} point={so4} etiquettePoint={String(Math.round(so4))}
        droite={plageSo4 ? texteSuisse(plageSo4) : '—'}
        aria={`Sulfate ${Math.round(so4)} ppm, ${posTxt(so4, plageSo4)}${plageSo4 ? ` ${water?.style?.code ?? 'style'} ${texteSuisse(plageSo4)} ppm` : ''}`} /> : undefined,
      toile: water?.style && water.wortIons && water.startIons
        ? <span className="rc2-toile" data-element="m2-toile-eau"><WaterRadar start={water.startIons} achieved={water.wortIons} style={water.style} fitToControls /></span> : undefined
    }
  };

  const ouvrirAux = (aux: 'fermentation' | 'stock' | 'deroule') => {
    const d = racine.current?.querySelector<HTMLDetailsElement>(`[data-aux="${aux}"] details`);
    if (!d) return;
    d.open = true;
    d.scrollIntoView?.({ block: 'nearest' });
  };
  // « Texte » et « Relire » déclenchent les composants d'aujourd'hui (copie, relecture, leurs messages et leurs erreurs) : une seule logique.
  const copier = () => {
    racine.current?.querySelector<HTMLButtonElement>('[data-rc2-export] button')?.click();
    window.setTimeout(() => {
      if (racine.current?.querySelector('[data-rc2-export] [role="alert"]')) setPlusOuvert(true);
      else { setCopie(true); window.setTimeout(() => setCopie(false), 2000); }
    }, 80);
  };
  const relire = () => {
    setRelireOuvert(true);
    racine.current?.querySelector<HTMLButtonElement>('[data-rc2-relecture] button')?.click();
  };
  const aCommander = shortages.filter(s => s.status !== 'unverified').length;
  const aVerifier = shortages.length - aCommander;
  const doses = water ? Object.values(water.doses).reduce<number>((s, g) => s + (g ?? 0), 0) : 0;
  const acide = water ? ACIDS[water.acidId] : undefined;
  const invalide = readiness.status === 'invalid';
  const donneesCompanion = { ...(reviewData ?? {}), yeastContext: buildYeastCompanion(recipeForCompanion, knowledge, { maxAlternatives: 3 }) };

  return (
    <RecapCtx.Provider value={rangees}>
    <div ref={racine} className="rc2" data-element="m2-recap">
      {/* --- Le verdict : une ligne, deux mots forts -------------------------- */}
      <div className="rc2-ver" data-element="m2-verdict">
        <span className={`rc2-ok${invalide ? ' rc2-non' : ''}`}>
          <i>{invalide ? '!' : <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />}</i>
          {invalide ? 'Non enregistrable' : 'Enregistrable'}
        </span>
        {readiness.missing.length > 0 && <span className="rc2-man" data-booster="compte-reperes"><b>{readiness.missing.length}</b> repère{readiness.missing.length > 1 ? 's' : ''}</span>}
      </div>
      <div className={invalide ? 'rc2-corr' : 'rc2-sr'}><RecapEtat readiness={readiness} etape={etapeLabel} onCorriger={onCorriger} /></div>
      {sousVerdict}

      <div role="list" aria-label="Étapes de la recette" className="rc2-liste" data-element="m2-liste">
      {/* --- Identité ------------------------------------------------------ */}
      <Block id="identite" title="Identité">
        <Row label="Nom">
          <Input
            type="text"
            name="brewsheet_beer_label"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={name}
            onChange={(e) => onName(e.target.value)}
            aria-label="Nom de la recette"
            className={`${inputClass} w-44 text-right`}
          />
        </Row>
        <Row label="Style">
          <Input
            type="text"
            name="brewsheet_beer_style"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={style}
            onChange={(e) => onStyle(e.target.value)}
            aria-label="Style"
            className={`${inputClass} w-44 text-right`}
          />
        </Row>
        <Row label="Volume">
          {/* Les mêmes garde-fous que les champs de l'étape Identité (regles.ts) : un zéro de trop est une faute de frappe,
              pas une règle à étendre jusqu'à l'absurde. Appliqués à la sortie du champ, comme les autres bornes de la fiche. */}
          <Cell label="Volume" value={volumeL} onValue={onVolumeL} unit="L" min={1} max={VOLUME_SAISIE_MAX} />
        </Row>
        <Row label="Ébullition">
          <Cell label="Ébullition" value={boilMin} onValue={onBoilMin} unit="min" integer min={0} max={EBULLITION_SAISIE_MAX} />
        </Row>
        <Row label="Carbonatation" hint="Ce que la recette annonce — « 2,5 vol ».">
          <Input
            type="text"
            name="brewsheet_carbo_target"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={carboTarget}
            onChange={(e) => onCarboTarget(e.target.value)}
            placeholder="2,5 vol"
            aria-label="Carbonatation visée"
            className={`${inputClass} w-28 text-right`}
          />
        </Row>
      </Block>

      {/* --- Fermentescibles ----------------------------------------------- */}
      <Block id="fermentescibles" title="Fermentescibles">
        {fermentables.length === 0 ? (
          <p className="py-2 text-sm text-cave-400">Aucun fermentescible.</p>
        ) : (
          fermentables.map((f, i) => (
            <div key={`${f.name}-${i}`} className="pb-1">
            <Row
              label={f.name}
              hint={
                <>
                  {f.kind === 'grain' && totalGristKg > 0
                    ? `${((f.weightKg / totalGristKg) * 100).toFixed(0)} % du grain`
                    : f.kind}

                </>
              }
              onDelete={() => onFermentables(fermentables.filter((_, j) => j !== i))}
            >
              <Cell
                label={`Masse de ${f.name}`}
                value={f.weightKg}
                onValue={(v) => patchFerm(i, { weightKg: v })}
                unit="kg"
                min={0}
              />
            </Row>
              {f.kind === 'grain' && <MaltDetails malt={f} onChange={patch => patchFerm(i, patch)}
                onLearnIngredient={onLearnIngredient} />}
            </div>
          ))
        )}
      </Block>

      {/* --- Houblons ------------------------------------------------------ */}
      <Block id="houblons" title="Houblons">
        {hops.length === 0 ? (
          <p className="py-2 text-sm text-cave-400">Aucun houblon.</p>
        ) : (
          hopsInOrder.map(({ h, index }) => {
            const def = HOP_STAGE[h.stage];
            const ibu = hopIbu(h);
            return (
              <div key={`${h.name}-${index}`} className="py-1.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-base text-cave-50 truncate leading-tight">
                      {h.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm leading-tight">
                      <span className={`px-1.5 rounded-full border text-sm ${def.tone}`}>
                        {def.label}
                      </span>
                      {/* L'amertume d'un ajout est une CONSÉQUENCE : jamais saisie. */}
                      <span className="text-cave-400">
                        {def.bitters
                          ? ibu !== null
                            ? `${formatFixed(ibu, 1)} IBU`
                            : 'IBU incalculable'
                          : 'effet à cru séparé'}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onHops(hops.filter((_, j) => j !== index))}
                    aria-label={`Retirer ${h.name}`}
                    className="shrink-0 touch-target -mr-2 text-cave-400 hover:text-alert transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <Cell
                    label={`Masse de ${h.name}`}
                    value={h.weightG}
                    onValue={(v) => patchHop(index, { weightG: v })}
                    unit="g"
                    integer
                    min={0}
                    refuser
                  />
                  <Cell
                    label={`Alpha de ${h.name}`}
                    value={h.alpha || undefined}
                    onValue={(v) => patchHop(index, { alpha: v ?? 0 })}
                    emptyValue={0}
                    unit="%α"
                    width="w-16"
                    min={0}
                    max={30}
                    refuser
                  />
                  {(def.ask === 'time' || def.ask === 'timeAndTemp') && (
                    <Cell
                      label={`Durée de ${h.name}`}
                      value={h.timeMin}
                      onValue={(v) => patchHop(index, { timeMin: v })}
                      emptyValue={undefined}
                      unit="min"
                      width="w-16"
                      integer
                      min={0}
                      refuser
                    />
                  )}
                  {def.ask === 'timeAndTemp' && (
                    <Cell
                      label={`Température de ${h.name}`}
                      value={h.tempC}
                      onValue={(v) => patchHop(index, { tempC: v })}
                      emptyValue={undefined}
                      unit="°C"
                      width="w-16"
                      min={0}
                      max={100}
                    />
                  )}
                  {def.ask === 'day' && (
                    <Cell
                      label={`Jour d’ajout de ${h.name}`}
                      value={h.dayOffset}
                      onValue={(v) => patchHop(index, { dayOffset: v })}
                      emptyValue={undefined}
                      unit="j"
                      width="w-16"
                      integer
                      min={0}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </Block>

      {/* --- Levure -------------------------------------------------------- */}
      <Block id="levure" title="Levure">
        {yeastSummary && <div className="py-1">{yeastSummary}</div>}
        {/* RL-1/RL-2 (recette en ligne 15.11) : la quantité se règle une seule fois, au curseur de la rangée (m2 : unité 1/2, quantité 2/2) ;
            le nom et la quantité sont dans le résumé de la rangée : la fiche ne les redit pas. Atténuation et durée restent (fiche d'aujourd'hui). */}
        <Row label="Atténuation" hint="Sert à prédire la densité finale.">
          <Cell
            label="Atténuation"
            value={yeast.attenuationPct}
            onValue={(v) => onYeast({ ...yeast, attenuationPct: v, attenuationBasis: v == null ? undefined : 'recipe' })}
            emptyValue={undefined}
            unit="%"
            width="w-16"
            min={0}
            max={100}
          />
        </Row>
        <Row label="Durée de fermentation">
          <Cell
            label="Durée de fermentation"
            value={yeast.fermentDays}
            onValue={(v) => onYeast({ ...yeast, fermentDays: v })}
            emptyValue={undefined}
            unit="j"
            width="w-16"
            integer
            min={0}
          />
        </Row>
      </Block>

      {/* --- Paliers ------------------------------------------------------- */}
      <Block id="paliers" title="Paliers d’empâtage">
        {mashSteps.length === 0 ? (
          <p className="py-2 text-sm text-cave-400">Aucun palier.</p>
        ) : (
          mashSteps.map((s, i) => (
            <Row
              key={`${s.name}-${i}`}
              label={s.name}
              onDelete={() => onMashSteps(mashSteps.filter((_, j) => j !== i))}
            >
              <Cell
                label={`Température du palier ${s.name}`}
                value={s.tempC}
                onValue={(v) =>
                  onMashSteps(mashSteps.map((x, j) => (j === i ? { ...x, tempC: v } : x)))
                }
                unit="°C"
                width="w-16"
                min={0}
                max={100}
              />
              <Cell
                label={`Durée du palier ${s.name}`}
                value={s.durationMin}
                onValue={(v) =>
                  onMashSteps(mashSteps.map((x, j) => (j === i ? { ...x, durationMin: v } : x)))
                }
                unit="min"
                width="w-16"
                integer
                min={0}
              />
            </Row>
          ))
        )}
      </Block>

      {/* --- Fermentation -------------------------------------------------- */}
      <Block aux="fermentation" title="Fermentation" aside={fermentation.length ? `${fermentation.length} phase${fermentation.length > 1 ? "s" : ""}` : "Conduite à définir"}>
        {fermentation.length === 0 ? (
          <p className="py-2 text-sm text-cave-400">Aucune phase.</p>
        ) : (
          fermentation.map((s, i) => (
            <Row
              key={`${s.name}-${i}`}
              label={s.name}
              hint={s.note}
              onDelete={() => onFermentation(fermentation.filter((_, j) => j !== i))}
            >
              <Cell
                label={`Température de ${s.name}`}
                value={s.tempC}
                onValue={(v) =>
                  onFermentation(fermentation.map((x, j) => (j === i ? { ...x, tempC: v } : x)))
                }
                unit="°C"
                width="w-16"
                min={-5}
                max={40}
              />
              <Cell
                label={`Durée de ${s.name}`}
                value={s.days}
                onValue={(v) =>
                  onFermentation(fermentation.map((x, j) => (j === i ? { ...x, days: v } : x)))
                }
                unit="j"
                width="w-16"
                integer
                min={0}
              />
            </Row>
          ))
        )}
      </Block>

      {/* --- Eau ----------------------------------------------------------- */}
      <Block id="eau" title="Eau">
        {water && <RecipeWaterVolumes totalL={mashWaterL + spargeWaterL} roL={water.mashOsmoseeL + water.spargeOsmoseeL} />}
        <Row label="Empâtage" hint={water ? `${formatReading(Number(water.diRatioPct.toFixed(2)))} % d’osmosée` : undefined}>
          <Cell
            label="Eau d’empâtage"
            value={mashWaterL}
            onValue={onMashWaterL}
            unit="L"
            min={0}
          />
        </Row>
        <Row
          label="Rinçage"
          hint={
            water
              ? water.spargeWaterL <= 0
                ? 'aucun — tout passe par la maische'
                : `${formatReading(Number(water.spargeDiRatioPct.toFixed(2)))} % d’osmosée${water.spargeLinked ? '' : ' · délié'}`
              : undefined
          }
        >
          <Cell
            label="Eau de rinçage"
            value={spargeWaterL}
            onValue={onSpargeWaterL}
            unit="L"
            min={0}
          />
        </Row>
        <Row label="Eau totale de brassage" hint="Empâtage + rinçage : volume total d’eau à engager.">
          <span className="reading text-base text-cave-200 pr-9">
            {formatQuantity(Math.round((mashWaterL + spargeWaterL) * 10) / 10, 'L')}
          </span>
        </Row>
        {totalGristKg > 0 && (
          <Row label="Moût avant ébullition estimé" hint="Après rétention des drêches (~0,96 L/kg).">
            <span className="reading text-base text-cave-200 pr-9">
              {formatQuantity(
                Math.max(0, Math.round((mashWaterL + spargeWaterL - totalGristKg * 0.96) * 10) / 10),
                'L'
              )}
            </span>
          </Row>
        )}

        {water && (
          <>
            {/*
              LE LITRAGE D'OSMOSÉE. C'est ce qu'on va chercher au bidon la veille
              du brassage : trois nombres, pas un pourcentage à convertir de tête
              devant la cuve.
            */}
            <Row
              label="Eau osmosée à préparer"
              hint={`${formatReading(water.mashOsmoseeL)} L empâtage + ${formatReading(water.spargeOsmoseeL)} L rinçage`}
            >
              <span className="reading text-base text-water pr-9">
                {formatQuantity(
                  Math.round((water.mashOsmoseeL + water.spargeOsmoseeL) * 10) / 10,
                  'L'
                )}
              </span>
            </Row>
            <Row
              label="Eau de réseau"
              hint={water.sourceName}
            >
              <span className="reading text-base text-cave-200 pr-9">
                {formatQuantity(
                  Math.round(
                    (mashWaterL + spargeWaterL - water.mashOsmoseeL - water.spargeOsmoseeL) * 10
                  ) / 10,
                  'L'
                )}
              </span>
            </Row>

            {/* --- Profil atteint ----------------------------------------- */}
            <div className="pt-2 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-cave-400">
                  Profil visé — {water.styleName}
                </span>
                <span className="text-sm text-cave-400 shrink-0">
                  {water.wortIons ? 'eau traitée, ppm' : 'eau d’empâtage, ppm'}
                </span>
              </div>

              {/*
                ⚠️ LA TOILE, et non plus six chiffres alignés.
                Le récapitulatif est la dernière page avant de lancer le
                brassin : c'est là qu'on vérifie d'un regard qu'on ne s'est pas
                trompé de style ou de sel. Six nombres nus demandent de
                connaître les six fourchettes par cœur ; la toile montre en une
                image ce qui tombe dedans et ce qui sort — et de quel côté.
              */}
              {/* La toile est dans la rangée Eau (résumé, pleine largeur) ; ici seulement le repli en chiffres quand elle manque. */}
              {water.style && water.wortIons && water.startIons ? null : (
                <dl className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                  {(Object.keys(ION_LABEL) as Array<keyof WaterIons>).map((ion) => (
                    <div key={ion}>
                      <dt className="text-sm text-cave-400 truncate">
                        {ION_LABEL[ion]}
                      </dt>
                      <dd className="reading text-sm sm:text-base text-cave-50">
                        {formatReading(Math.round(water.mashIons[ion]))}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <details><summary className="cursor-pointer min-h-touch text-sm text-water">pH et chimie détaillée</summary>
              {water.targetStatus && <WaterTargetStatus {...water.targetStatus} />}

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="text-cave-400">
                  Alcalinité résiduelle après acide{' '}
                  <span
                    className={`reading text-sm ${
                      water.raSaltTarget != null ? 'text-cave-50' : water.ra >= water.raBand.min && water.ra <= water.raBand.max
                        ? 'text-hop'
                        : 'text-ebc-amber'
                    }`}
                  >
                    {formatReading(water.ra)}
                  </span>{' '}
                  {water.raSaltTarget != null
                    ? `— repère pour les malts ≈ ${formatReading(water.raSaltTarget)} ppm (estimation de l’empâtage)`
                    : `— repère des malts ${formatReading(water.raBand.min)} à ${formatReading(water.raBand.max)} (${water.raBand.label})`}
                </span>
                <span className="text-cave-400">
                  SO₄:Cl{' '}
                  <span className="reading text-sm text-cave-200">
                    {water.ratio.ratio !== null ? formatFixed(water.ratio.ratio, 1) : '—'}
                  </span>{' '}
                  · {water.ratio.label}
                </span>
              </div>

              {(water.mashPh || water.spargePh) && (
                <p className="text-sm text-cave-400">
                  pH mesuré à la cuve :{' '}
                  {water.mashPh ? `maische ${formatDecimal(water.mashPh)}` : ''}
                  {water.mashPh && water.spargePh ? ' · ' : ''}
                  {water.spargePh ? `rinçage ${formatDecimal(water.spargePh)}` : ''}.
                </p>
              )}
              </details>
            </div>

            {/* --- Sels et acides à peser ---------------------------------- */}
            <div className="pt-2 space-y-1.5">
              <WaterAdditivesTable
                doses={water.doses}
                split={water.split}
                acidId={water.acidId}
                mashAcid={water.mashAcid}
                spargeAcid={water.spargeAcid}
                totalWaterL={Math.round((mashWaterL + spargeWaterL) * 10) / 10}
                hasSparge={water.spargeWaterL > 0}
                allSaltsInMash={water.allSaltsInMash}
                spargeTargetPh={water.spargeAcid.targetPh}
                compact
              />
              {water.disabled.length > 0 && (
                <p className="text-sm text-cave-400">
                  Écartés : {water.disabled.map((d) => SALTS[d].name).join(', ')}.
                </p>
              )}
            </div>

            {onEditWater && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onEditWater}
                  className="w-full min-h-touch rounded-control border border-water/40
                             text-water text-sm flex items-center justify-center gap-2
                             transition-colors hover:bg-cave-850"
                >
                  <Droplets className="w-4 h-4" />
                  Retourner à l’atelier de l’eau
                </button>
              </div>
            )}
          </>
        )}
      </Block>

      {/* --- Ce qui manque -------------------------------------------------- */}
      <Block aux="stock" title="Stock" aside={stockSummary}>
        {shortages.length === 0 ? (
          <p className="py-1 text-sm text-cave-200">
            {incompleteStockNeeds
              ? 'Complète les ingrédients et leurs quantités pour vérifier tout le stock.'
              : hasStockNeeds ? 'Tout est disponible pour brasser.' : 'Renseigne les ingrédients et leurs quantités pour vérifier le stock.'}
          </p>
        ) : (
          <table className="w-full table-fixed text-[13px] leading-snug">
            <caption className="sr-only">Disponibilités et vérifications pour les ingrédients de la recette</caption>
            <thead>
              <tr className="text-cave-400">
                <th scope="col" className="w-2/5 pb-1 pr-1 text-left font-normal break-words">Ingrédient</th>
                <th scope="col" className="pb-1 px-1 text-right font-normal break-words">Disponible</th>
                <th scope="col" className="pb-1 pl-1 text-right font-normal break-words">Nécessaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cave-850">
              {shortages.map(s => (
                // Nom + unité identifient le besoin cumulé par l’assistant.
                <tr key={`${s.name}-${s.unit}`} className="align-top">
                  <th scope="row" className="py-1.5 pr-1 text-left font-normal text-cave-50 [overflow-wrap:anywhere]">{s.name}{s.status === 'unverified' && <span className="block font-sans text-xs text-attention">{s.reason || 'Conditionnement à vérifier'}</span>}</th>
                  <td className="py-1.5 px-1 text-right font-mono tabular-nums text-cave-200 [overflow-wrap:anywhere]">{s.have == null ? 'À vérifier' : formatQuantity(s.have, s.haveUnit ?? s.unit)}</td>
                  <td className="py-1.5 pl-1 text-right font-mono tabular-nums text-cave-50 [overflow-wrap:anywhere]">{formatQuantity(s.needed, s.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Block>

      {/* --- Déroulé -------------------------------------------------------- */}
      <Block aux="deroule" title="Déroulé">
        {/*
          Le texte d'origine, recopié mot pour mot à l'import — traitement d'eau
          et calendrier de houblonnage à cru compris. C'est ce qu'on suit en
          cuverie quand un chiffre n'a pas trouvé sa case.
        */}
        <Textarea
          name="brewsheet_notes_timeline"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          rows={tight ? 4 : 8}
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          aria-label="Déroulé"
          placeholder="Concassage, empâtage, rinçage, ébullition, whirlpool, refroidissement…"
          className={`${inputClass} mt-2 py-2 leading-relaxed resize-y`}
        />
      </Block>
      </div>

      {/* --- À peser : sels et acide, un toucher ramène à l'atelier de l'eau ---- */}
      {water && (
        <button type="button" className="rc2-pes" data-element="m2-pesee" onClick={onEditWater} disabled={!onEditWater} aria-label="À peser : revoir l’eau">
          <Scale className="w-5 h-5" aria-hidden="true" />
          <p>
            <span>sels <b>{fr(doses, 1).replace(',0', '')} g</b></span>
            {acide && <span>{acide.name.split(' ')[0].toLowerCase()} <b>{water.spargeWaterL > 0 ? `${fr(water.mashAcid.amount, 1)}+${fr(water.spargeAcid.amount, 1)}` : fr(water.mashAcid.amount, 1)} {acide.unit}</b></span>}
          </p>
        </button>
      )}

      {/* --- Les sorties : Texte, Relire, Plus, achats ------------------------ */}
      <div className="rc2-out" data-element="m2-sorties">
        {onExportText && (
          <button type="button" className="rc2-o" data-booster="export-court" aria-label="Copier le texte de la recette" onClick={copier}>
            {copie ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}{copie ? 'Copié' : 'Texte'}
          </button>
        )}
        {onExportText && <button type="button" className="rc2-o" aria-label="Demander la relecture" onClick={relire}>Relire</button>}
        <details className="rc2-plus" open={plusOuvert} onToggle={e => { const d = e.currentTarget; setPlusOuvert(d.open); if (d.open) d.querySelector('div')?.scrollIntoView?.({ block: 'nearest' }); }}>
          <summary aria-label="Plus d’actions : budget, brasser, fermentation, déroulé, texte complet">Plus</summary>
          <div>
            <button type="button" onClick={onBrasser} aria-label="Brasser maintenant">Brasser</button>
            <button type="button" onClick={() => ouvrirAux('fermentation')}>Fermentation</button>
            <button type="button" onClick={() => ouvrirAux('deroule')}>Déroulé</button>
            {budget}
            {onExportText && <div className="rc2-plus-ex" data-rc2-export><RecipeTextExport buildText={onExportText} /></div>}
            {atelierNolo}
          </div>
        </details>
        {shortages.length > 0 && (
          <button type="button" className="rc2-ach" data-booster="pastille-achats" onClick={() => ouvrirAux('stock')}
            aria-label={`Achats : ${[aCommander ? `${aCommander} ingrédient${aCommander > 1 ? 's' : ''} à commander` : '', aVerifier ? `${aVerifier} à vérifier` : ''].filter(Boolean).join(', ')}`}>
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            {aCommander > 0 && <><b>{aCommander}</b> à commander</>}{aCommander > 0 && aVerifier > 0 && ' · '}{aVerifier > 0 && <><b>{aVerifier}</b> à vérifier</>}
          </button>
        )}
        {/* La relecture reçoit LE MÊME TEXTE que l'export (le modèle lit ce que le brasseur lit) ; consultative. Visible dès qu'on touche « Relire ». */}
        {onExportText && <div className={`rc2-relec${relireOuvert ? '' : ' rc2-cache'}`} data-rc2-relecture><RecipeReview buildText={onExportText} data={donneesCompanion} /></div>}
      </div>
    </div>
    </RecapCtx.Provider>
  );
};
