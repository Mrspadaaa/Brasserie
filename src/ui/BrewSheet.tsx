import { RecipeDisclosure, RecipeWaterVolumes } from './RecipeDisclosure';
import { MaltDetails } from './MaltDetails';
import { LearnIngredient } from '../domain/ingredientFacts';
import React, { useState } from 'react';
import { Trash2, AlertTriangle, Check, Droplets, ClipboardCopy } from 'lucide-react';
import {
  Fermentable,
  HopIngredient,
  YeastSpec,
  TempStep,
  FermentationStep,
  WaterIons,
  SaltId,
  AcidId
} from '../types';
import { Units } from '../services/units';
import { HOP_STAGE } from '../domain/hopStage';
import { patchIndexedHop } from '../domain/hopIndex/recipeBindings';
import { ION_LABEL, SALTS } from '../domain/water';
import { NumberInput } from './NumberInput';
import { WaterAdditivesTable } from './WaterAdditivesTable';
import { WaterRadar } from './WaterRadar';
import { WaterTargetStatus } from './water/WaterTargetStatus';
import { StyleWater } from '../domain/waterStyles';
import { useDensity } from './useViewport';
import { inputClass } from './FormNav';
import { RecipeReview } from './RecipeReview';

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
 *   - Une ligne par ingrédient, hauteur fixe : le nom se lit, les nombres se
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
      <div className="text-sm sm:text-base text-cave-100 truncate leading-tight">{label}</div>
      {hint && <div className="text-2xs sm:text-sm text-cave-500 truncate leading-tight mt-0.5">{hint}</div>}
    </div>
    <div className="shrink-0 flex items-center gap-1 sm:gap-1.5">{children}</div>
    {onDelete && (
      <button
        type="button"
        onClick={onDelete}
        aria-label="Retirer"
        className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-control -mr-1 text-cave-500 hover:text-alert transition-colors"
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
}> = (props) => {
  const { value, onValue, unit, width = 'w-[4.5rem] sm:w-20', integer, min, max, label } = props;
  const emptyValue = 'emptyValue' in props ? props.emptyValue : 0;
  return (
    <span className="flex items-baseline gap-1">
      <NumberInput
        value={value}
        onValue={onValue}
        integer={integer}
        emptyValue={emptyValue}
        min={min}
        max={max}
        pad
        aria-label={label}
        className={`${width} min-h-[34px] sm:min-h-touch px-1.5 sm:px-2 rounded-control bg-cave-950 border border-cave-700
                    font-mono font-semibold text-right text-sm sm:text-base text-cave-50
                    focus:outline-none focus:border-ebc-straw focus:ring-1 focus:ring-ebc-straw/40`}
      />
      <span className="reading-unit w-6 sm:w-8 text-2xs sm:text-sm shrink-0">{unit}</span>
    </span>
  );
};

/** Bloc titré de la fiche. Plus serré qu'une `Section` : il y en a huit. */
const Block: React.FC<{
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, aside, children }) => {
  return <RecipeDisclosure title={title} summary={aside}><div className="divide-y divide-cave-850">{children}</div></RecipeDisclosure>;
};

/** Tout ce que la fiche montre de l'eau, calculé par l'assistant. */
export interface WaterRecap {
  targetStatus?: React.ComponentProps<typeof WaterTargetStatus>;
  sourceName: string;
  styleName: string;
  mashWaterL: number;
  spargeWaterL: number;
  diRatioPct: number;
  spargeDiRatioPct: number;
  spargeLinked: boolean;
  mashOsmoseeL: number;
  spargeOsmoseeL: number;
  mashIons: WaterIons;
  spargeIons: WaterIons;
  /**
   * Le MOÛT, l'eau de départ et la cible — pour la toile.
   *
   * ⚠️ Le moût, pas la maische : c'est la bière que le style décrit. Tous trois
   * optionnels — un plan enregistré avant cette version n'en porte pas, et le
   * récapitulatif retombe alors sur la grille de chiffres plutôt que de
   * dessiner une toile fausse.
   */
  startIons?: WaterIons;
  wortIons?: WaterIons;
  style?: StyleWater;
  ra: number;
  raBand: { min: number; max: number; label: string };
  raSaltTarget?: number;
  ratio: { ratio: number | null; label: string };
  doses: Partial<Record<SaltId, number>>;
  split: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
  acidId: AcidId;
  mashAcid: { amount: number; unit: string };
  spargeAcid: { amount: number; unit: string; targetPh: number };
  disabled: SaltId[];
  allSaltsInMash?: boolean;
  mashPh?: number;
  spargePh?: number;
}

export interface BrewSheetProps {
  onLearnIngredient?: LearnIngredient;
  reviewData?: unknown;
  name: string;
  onName: (v: string) => void;
  style: string;
  onStyle: (v: string) => void;
  volumeL: number;
  onVolumeL: (v: number) => void;
  boilMin: number;
  onBoilMin: (v: number) => void;
  carboTarget: string;
  onCarboTarget: (v: string) => void;

  fermentables: Fermentable[];
  onFermentables: (v: Fermentable[]) => void;
  totalGristKg: number;

  hops: HopIngredient[];
  onHops: (v: HopIngredient[]) => void;
  /** IBU d'un ajout, calculé par l'appelant — la fiche ne calcule rien. */
  hopIbu: (h: HopIngredient) => number | null;

  yeast: YeastSpec;
  onYeast: (v: YeastSpec) => void;

  mashSteps: TempStep[];
  onMashSteps: (v: TempStep[]) => void;

  fermentation: FermentationStep[];
  onFermentation: (v: FermentationStep[]) => void;

  mashWaterL: number;
  onMashWaterL: (v: number) => void;
  spargeWaterL: number;
  onSpargeWaterL: (v: number) => void;

  /**
   * Le plan d'eau au complet, en lecture.
   *
   * ⚠️ La fiche n'affichait que trois volumes. Tout le reste — litres d'osmosée
   * à préparer, profil visé, ions atteints, sels et acides à peser — n'existait
   * qu'à l'étape 6. Le brasseur validait donc sa recette sans jamais revoir la
   * moitié de ce qu'il allait verser dans la cuve.
   */
  water?: WaterRecap;
  /** Ramène à l'atelier de l'eau, d'un geste. */
  onEditWater?: () => void;

  notes: string;
  onNotes: (v: string) => void;

  /** Ce qui manque au stock, calculé par l'appelant. */
  shortages: Array<{ name: string; have: number; needed: number; unit: string }>;

  /**
   * Rend la recette entière en texte brut, prête à coller.
   *
   * ⚠️ Fournie par l'appelant et non construite ici : la fiche n'a pas les
   * grandeurs CALCULÉES — OG, IBU, EBC, rendement — qui vivent dans
   * l'assistant. Les recalculer ici les ferait diverger de ce que l'écran
   * affiche, ce qui est la pire façon de se tromper.
   */
  onExportText?: () => string;
}

export const BrewSheet: React.FC<BrewSheetProps> = ({
  onLearnIngredient,
  reviewData,
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
  /* Confirmation de copie : le presse-papier ne donne aucun retour visible. */
  const [copie, setCopie] = useState(false);

  const patchFerm = (i: number, patch: Partial<Fermentable>) =>
    onFermentables(fermentables.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const patchHop = (i: number, patch: Partial<HopIngredient>) =>
    onHops(hops.map((h, j) => (j === i ? patchIndexedHop(h, patch) : h)));

  const totalHopG = hops.reduce((s, h) => s + h.weightG, 0);

  /*
   * Les houblons se lisent dans l'ordre de la JOURNÉE, pas dans celui où on les
   * a saisis : premier moût, ébullition, whirlpool, cru. C'est l'ordre dans
   * lequel on les pèsera.
   */
  const hopsInOrder = hops
    .map((h, index) => ({ h, index }))
    .sort((a, b) => HOP_STAGE[a.h.stage].order - HOP_STAGE[b.h.stage].order);

  return (
    <div className={tight ? 'space-y-2' : 'space-y-3'}>
      {/* --- Identité ------------------------------------------------------ */}
      {water&&<RecipeWaterVolumes totalL={mashWaterL+spargeWaterL} roL={water.mashOsmoseeL+water.spargeOsmoseeL}/>}
      <Block title="Identité">
        <Row label="Nom">
          <input
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
          <input
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
          <Cell label="Volume" value={volumeL} onValue={onVolumeL} unit="L" min={1} />
        </Row>
        <Row label="Ébullition">
          <Cell label="Ébullition" value={boilMin} onValue={onBoilMin} unit="min" integer min={0} />
        </Row>
        <Row label="Carbonatation" hint="Ce que la recette annonce — « 2.5 vol ».">
          <input
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
            placeholder="2.5 vol"
            aria-label="Carbonatation visée"
            className={`${inputClass} w-28 text-right`}
          />
        </Row>
      </Block>

      {/* --- Fermentescibles ----------------------------------------------- */}
      <Block title="Fermentescibles" aside={Units.format(totalGristKg, 'kg')}>
        {fermentables.length === 0 ? (
          <p className="py-2 text-sm text-cave-500">Aucun fermentescible.</p>
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
      <Block title="Houblons" aside={Units.format(totalHopG, 'g')}>
        {hops.length === 0 ? (
          <p className="py-2 text-sm text-cave-500">Aucun houblon.</p>
        ) : (
          hopsInOrder.map(({ h, index }) => {
            const def = HOP_STAGE[h.stage];
            const ibu = hopIbu(h);
            return (
              <div key={`${h.name}-${index}`} className="py-1.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-base text-cave-100 truncate leading-tight">
                      {h.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm leading-tight">
                      <span className={`px-1.5 rounded-full border text-sm ${def.tone}`}>
                        {def.label}
                      </span>
                      {/* L'amertume d'un ajout est une CONSÉQUENCE : jamais saisie. */}
                      <span className="text-cave-500">
                        {def.bitters
                          ? ibu !== null
                            ? `${ibu.toFixed(1)} IBU`
                            : 'IBU incalculable'
                          : 'effet à cru séparé'}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onHops(hops.filter((_, j) => j !== index))}
                    aria-label={`Retirer ${h.name}`}
                    className="shrink-0 touch-target -mr-2 text-cave-600 hover:text-alert transition-colors"
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
                  />
                  <Cell
                    label={`Alpha de ${h.name}`}
                    value={h.alpha || undefined}
                    onValue={(v) => patchHop(index, { alpha: v ?? 0 })}
                    emptyValue={0}
                    unit="%AA"
                    width="w-16"
                    min={0}
                    max={30}
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
      <Block title="Levure" aside={yeast.lab ?? undefined}>
        <Row label={yeast.name || '—'} hint={yeast.strain}>
          <Cell
            label="Quantité de levure"
            value={yeast.qty}
            onValue={(v) => onYeast({ ...yeast, qty: v })}
            unit={yeast.unit}
            width="w-16"
            min={0}
          />
        </Row>
        <Row label="Atténuation" hint="Sert à prédire la densité finale.">
          <Cell
            label="Atténuation"
            value={yeast.attenuationPct}
            onValue={(v) => onYeast({ ...yeast, attenuationPct: v })}
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
      <Block title="Paliers d’empâtage">
        {mashSteps.length === 0 ? (
          <p className="py-2 text-sm text-cave-500">Aucun palier.</p>
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
      <Block title="Fermentation">
        {fermentation.length === 0 ? (
          <p className="py-2 text-sm text-cave-500">Aucune phase.</p>
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
      <Block
        title="Eau"
        aside={
          totalGristKg > 0
            ? `${(mashWaterL / totalGristKg).toFixed(1)} L/kg`
            : undefined
        }
      >
        <Row label="Empâtage" hint={water ? `${Number(water.diRatioPct.toFixed(2))} % d’osmosée` : undefined}>
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
                : `${Number(water.spargeDiRatioPct.toFixed(2))} % d’osmosée${water.spargeLinked ? '' : ' · délié'}`
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
          <span className="reading text-base text-cave-300 pr-9">
            {Units.format(Math.round((mashWaterL + spargeWaterL) * 10) / 10, 'L')}
          </span>
        </Row>
        {totalGristKg > 0 && (
          <Row label="Moût avant ébullition estimé" hint="Après rétention des drêches (~0.96 L/kg).">
            <span className="reading text-base text-cave-300 pr-9">
              {Units.format(
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
              hint={`${water.mashOsmoseeL} L empâtage + ${water.spargeOsmoseeL} L rinçage`}
            >
              <span className="reading text-base text-water pr-9">
                {Units.format(
                  Math.round((water.mashOsmoseeL + water.spargeOsmoseeL) * 10) / 10,
                  'L'
                )}
              </span>
            </Row>
            <Row
              label="Eau de réseau"
              hint={water.sourceName}
            >
              <span className="reading text-base text-cave-300 pr-9">
                {Units.format(
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
                <span className="text-2xs sm:text-sm text-cave-500">
                  Profil visé — {water.styleName}
                </span>
                <span className="text-2xs sm:text-sm text-cave-500 shrink-0">
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
              {water.style && water.wortIons && water.startIons ? (
                <WaterRadar
                  start={water.startIons}
                  achieved={water.wortIons}
                  style={water.style}
                />
              ) : (
                <dl className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                  {(Object.keys(ION_LABEL) as Array<keyof WaterIons>).map((ion) => (
                    <div key={ion}>
                      <dt className="text-2xs sm:text-sm text-cave-500 truncate">
                        {ION_LABEL[ion]}
                      </dt>
                      <dd className="reading text-sm sm:text-base text-cave-100">
                        {Math.round(water.mashIons[ion])}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <details><summary className="cursor-pointer min-h-touch text-sm text-water">pH et chimie détaillée</summary>
              {water.targetStatus && <WaterTargetStatus {...water.targetStatus} />}

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xs sm:text-sm">
                <span className="text-cave-500">
                  Alcalinité résiduelle après acide{' '}
                  <span
                    className={`reading text-sm ${
                      water.raSaltTarget != null ? 'text-cave-100' : water.ra >= water.raBand.min && water.ra <= water.raBand.max
                        ? 'text-hop'
                        : 'text-ebc-amber'
                    }`}
                  >
                    {water.ra}
                  </span>{' '}
                  {water.raSaltTarget != null
                    ? `— repère pour les malts ≈ ${water.raSaltTarget} ppm (estimation du mash)`
                    : `— repère des malts ${water.raBand.min} à ${water.raBand.max} (${water.raBand.label})`}
                </span>
                <span className="text-cave-500">
                  SO₄:Cl{' '}
                  <span className="reading text-sm text-cave-200">
                    {water.ratio.ratio !== null ? water.ratio.ratio.toFixed(1) : '—'}
                  </span>{' '}
                  · {water.ratio.label}
                </span>
              </div>

              {(water.mashPh || water.spargePh) && (
                <p className="text-2xs sm:text-sm text-cave-500">
                  pH mesuré à la cuve :{' '}
                  {water.mashPh ? `maische ${water.mashPh}` : ''}
                  {water.mashPh && water.spargePh ? ' · ' : ''}
                  {water.spargePh ? `rinçage ${water.spargePh}` : ''}.
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
                <p className="text-2xs sm:text-sm text-cave-500">
                  Écartés : {water.disabled.map((d) => SALTS[d].name).join(', ')}.
                </p>
              )}
            </div>

            {onEditWater && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onEditWater}
                  className="w-full min-h-[34px] sm:min-h-touch rounded-control border border-water/40
                             text-water text-xs sm:text-sm flex items-center justify-center gap-2
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
      <Block title="Stock">
        {shortages.length === 0 ? (
          <p className="py-2 flex items-center gap-2 text-base text-hop">
            <Check className="w-5 h-5 shrink-0" />
            Tout est disponible pour brasser.
          </p>
        ) : (
          shortages.map((s) => (
            // Nom + unité : c'est l'identité d'un besoin cumulé, le nom seul
            // dédoublait la ligne quand un houblon revenait deux fois.
            <div key={`${s.name}-${s.unit}`} className="py-2 flex items-baseline gap-2">
              <AlertTriangle className="w-4 h-4 text-ebc-amber shrink-0" />
              <span className="min-w-0 flex-1 text-base text-cave-100 truncate">{s.name}</span>
              <span className="reading text-sm text-cave-400 shrink-0">
                {Units.format(s.have, s.unit)} / {Units.format(s.needed, s.unit)}
              </span>
            </div>
          ))
        )}
      </Block>

      {/* --- Déroulé -------------------------------------------------------- */}
      <Block title="Déroulé">
        {/*
          Le texte d'origine, recopié mot pour mot à l'import — traitement d'eau
          et calendrier de houblonnage à cru compris. C'est ce qu'on suit en
          cuverie quand un chiffre n'a pas trouvé sa case.
        */}
        <textarea
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

      {/*
        --- Extraction -------------------------------------------------------

        ⚠️ Demandé ainsi : « à la fin de la recette une fois terminé je veux
        pouvoir les extraire au format texte ». En BAS de la fiche, donc, et
        nulle part ailleurs : c'est un geste de fin, quand tout est posé.

        Le presse-papier plutôt qu'un fichier téléchargé — c'est la convention
        déjà tenue par les stocks et les commandes, et c'est ce qui rend le
        texte utile : il part dans un message, un forum, ou l'import d'une
        autre application sans passer par le dossier Téléchargements.
      */}
      {onExportText && (
        <button
          type="button"
          onClick={() => {
            const texte = onExportText();
            navigator.clipboard?.writeText(texte);
            setCopie(true);
            window.setTimeout(() => setCopie(false), 2500);
          }}
          className="w-full min-h-touch-sm rounded-control border border-cave-700 text-cave-200
                     hover:border-ebc-straw hover:text-ebc-straw transition-colors
                     flex items-center justify-center gap-2 text-sm"
        >
          {copie ? (
            <>
              <Check className="w-4 h-4 text-hop" />
              Recette copiée — collez-la où vous voulez
            </>
          ) : (
            <>
              <ClipboardCopy className="w-4 h-4" />
              Copier la recette en texte
            </>
          )}
        </button>
      )}

      {/*
        La relecture reçoit LE MÊME TEXTE que l'export, volontairement : le
        modèle lit ce que Gaëtan lit, donc chaque remarque se vérifie ligne à
        ligne dans le presse-papier.
      */}
      {onExportText && <RecipeReview buildText={onExportText} data={reviewData} />}
    </div>
  );
};
