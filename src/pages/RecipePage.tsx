import React, { useMemo, useState } from 'react';
import { Recipe, Batch, HopIngredient, AppConfig } from '../types';
import { Units } from '../services/units';
import { BrewingMath } from '../services/brewingMath';
import { computeBeerColor, missingColorData } from '../domain/beerColor';
import { HOP_STAGE, groupByStage, describeMoment, normalizeHop } from '../domain/hopStage';
import { SALTS, SALT_IDS, ACIDS, ALKALINE_SALTS, savedWaterDisplay } from '../domain/water';
import { styleByCode, styleFromTargetIons } from '../domain/waterStyles';
import { WaterRadar } from '../ui/WaterRadar';
import { PHASE_LABEL } from '../domain/brewPrograms';
import { PageShell, Section } from './PageShell';
import { ConfirmSheet } from '../ui/Sheet';
import { Pencil, Copy, Trash2, FlaskConical, AlertTriangle } from 'lucide-react';

/**
 * La fiche recette — le document de référence.
 *
 * ⚠️ Ce que ça règle : une recette n'était consultable qu'à travers le
 * formulaire qui servait à la créer. Impossible de la LIRE — de vérifier d'un
 * coup d'œil sa couleur, la répartition de son grain, la contribution de chaque
 * houblon. C'est pourtant ce qu'on fait quatre-vingt-dix fois sur cent.
 *
 * Ce qui est affiché est CALCULÉ quand c'est calculable, et honnêtement vide
 * quand la donnée manque : un EBC exige la couleur de chaque malt, une OG
 * prédite exige leur potentiel d'extrait, un IBU exige l'alpha des houblons.
 * Aucun de ces chiffres n'est deviné — un nombre faux serait pire qu'une case
 * vide, parce qu'on brasserait dessus.
 */

import { BrewerChat } from '../ui/BrewerChat';

interface RecipePageProps {
  recipe: Recipe;
  /** Brassins issus de cette recette, pour confronter le visé au mesuré. */
  batches: Batch[];
  config: AppConfig;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBrew: () => void;
  onOpenBatch: (batch: Batch) => void;
}

/** Une des cinq mesures de tête. */
const Metric: React.FC<{
  label: string;
  value: string | null;
  hint?: string;
  /** Seconde lecture sous la valeur : cible annoncée, mesure réelle. */
  note?: string;
  swatch?: string;
  tone?: string;
}> = ({ label, value, hint, note, swatch, tone = 'text-cave-50' }) => (
  <div className="min-w-0">
    <div className="text-sm text-cave-500">{label}</div>
    {value ? (
      <>
        <div className="flex items-center gap-2">
          {swatch && (
            <span
              className={`w-4 h-4 rounded-full border border-cave-700 shrink-0 ${swatch}`}
              aria-hidden
            />
          )}
          <span className={`reading text-xl ${tone}`}>{value}</span>
        </div>
        {note && <div className="text-sm text-cave-500 leading-tight">{note}</div>}
      </>
    ) : (
      <div className="text-sm text-cave-600 leading-tight pt-1">{hint ?? 'incalculable'}</div>
    )}
  </div>
);

import { BrewEquipmentSummary } from '../ui/BrewEquipmentSummary';

export const RecipePage: React.FC<RecipePageProps> = ({
  recipe,
  batches,
  config,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onBrew,
  onOpenBatch
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const waterDisplay = useMemo(() => savedWaterDisplay(recipe.waterPlan), [recipe.waterPlan]);

  const brewhouse =
    config.brewhouses.find((b) => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];

  const hops = useMemo(() => (recipe.hops ?? []).map(normalizeHop), [recipe.hops]);
  const grouped = useMemo(() => groupByStage(hops), [hops]);

  const fermentables = recipe.fermentables ?? [];
  /** La facture de GRAIN : le sucre n'y entre pas, ni pour la masse ni pour les %. */
  const grains = useMemo(() => fermentables.filter((f) => f.kind === 'grain'), [fermentables]);
  const others = useMemo(() => fermentables.filter((f) => f.kind !== 'grain'), [fermentables]);
  const totalGrist = useMemo(() => grains.reduce((s, f) => s + f.weightKg, 0), [grains]);

  // La couleur ne vient que du grain — un sucre clair n'en apporte pas.
  const color = useMemo(
    () => computeBeerColor(grains, recipe.volumeL),
    [grains, recipe.volumeL]
  );
  const colorMissing = useMemo(() => missingColorData(grains), [grains]);

  const points = useMemo(
    () =>
      BrewingMath.extractPoints(fermentables, recipe.volumeL, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75),
    [fermentables, recipe.volumeL, brewhouse, recipe.efficiencyPct]
  );
  const ogPredicted = useMemo(
    () => BrewingMath.calculateOg(fermentables, recipe.volumeL, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75),
    [fermentables, recipe.volumeL, brewhouse, recipe.efficiencyPct]
  );

  const og = recipe.ogTarget || ogPredicted || 0;

  /** IBU par houblon — c'est la répartition qui informe, pas seulement le total. */
  const ibuOf = (hop: HopIngredient) =>
    og > 1 ? BrewingMath.hopIbu(hop, recipe.volumeL, og, recipe.boilMin ?? 60) : 0;

  const ibuTotal = useMemo(
    () =>
      og > 1
        ? BrewingMath.calculateTinsethIBU(hops, recipe.volumeL, og, recipe.boilMin ?? 60)
        : null,
    [hops, recipe.volumeL, og, recipe.boilMin]
  );

  const hopsMissingAlpha = hops.filter((h) => h.stage !== 'dryHop' && !h.alpha).map((h) => h.name);

  const fgPredicted = recipe.yeast?.attenuationPct
    ? BrewingMath.calculateFg(og, recipe.yeast.attenuationPct, points?.unfermentable ?? 0)
    : null;
  const fg = recipe.fgTarget || fgPredicted;

  const abv = og > 1 && fg ? BrewingMath.calculateABV(og, fg) : null;

  const relatedBatches = batches.filter(
    (b) => b.recipeRef === recipe.id || b.recipeSnapshot?.sourceRecipeId === recipe.id
  );

  const dryHopTotal = hops
    .filter((h) => h.stage === 'dryHop')
    .reduce((s, h) => s + h.weightG, 0);

  return (
    <PageShell
      title={recipe.name}
      subtitle={[recipe.style, `${recipe.volumeL} L`, recipe.brewDate].filter(Boolean).join(' · ')}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Modifier la recette"
            className="touch-target rounded-control text-cave-300 hover:text-cave-50"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label="Dupliquer la recette"
            className="touch-target rounded-control text-cave-300 hover:text-cave-50"
          >
            <Copy className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Supprimer la recette"
            className="touch-target rounded-control text-cave-400 hover:text-alert"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </>
      }
      footer={
        <button
          type="button"
          onClick={onBrew}
          className="w-full min-h-touch rounded-control bg-ebc-straw text-cave-950
                     font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <FlaskConical className="w-5 h-5" />
          Lancer un brassin
        </button>
      }
    >
      <BrewerChat scope={{kind:'recipe',id:recipe.id}} label={recipe.name} phase="Recette" />
      {/* --- Les cinq mesures ------------------------------------------- */}
      <section className="panel p-4">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          <Metric
            label="OG"
            value={og > 1 ? og.toFixed(3) : null}
            hint="renseigne le potentiel des malts"
            tone="text-ebc-straw"
          />
          <Metric label="FG" value={fg ? fg.toFixed(3) : null} hint="renseigne l’atténuation" />
          {/*
            L'IBU affiché est CALCULÉ, pas recopié : il bouge quand on change un
            houblon. Quand la recette d'origine en annonce un autre, on montre
            les deux — les modèles d'amertume diffèrent d'un calculateur à
            l'autre, surtout sur le premier moût et le whirlpool, et masquer
            l'écart laisserait croire à une erreur.
          */}
          <Metric
            label="IBU"
            value={ibuTotal !== null ? String(ibuTotal) : null}
            hint="renseigne l’alpha des houblons"
            note={
              ibuTotal !== null &&
              recipe.ibuTarget &&
              Math.abs(recipe.ibuTarget - ibuTotal) > Math.max(5, ibuTotal * 0.1)
                ? `${recipe.ibuTarget} annoncé`
                : undefined
            }
          />
          <Metric
            label="EBC"
            value={color ? String(color.ebc) : null}
            hint="renseigne la couleur des malts"
            swatch={color?.swatch}
          />
          <Metric
            label="ABV"
            value={abv ? `${abv.toFixed(1)} %` : null}
            hint="dépend de l’OG et de la FG"
            tone="text-ebc-amber"
          />
        </div>

        {(colorMissing.length > 0 || hopsMissingAlpha.length > 0) && (
          <div className="mt-4 pt-3 border-t border-cave-800 space-y-1.5">
            {colorMissing.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-cave-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-ebc-amber" />
                <span>
                  Couleur EBC manquante sur {colorMissing.join(', ')} — elle figure sur la fiche
                  technique du malteur.
                </span>
              </p>
            )}
            {hopsMissingAlpha.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-cave-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-ebc-amber" />
                <span>
                  Taux d’alpha manquant sur {[...new Set(hopsMissingAlpha)].join(', ')} — sans lui,
                  leur amertume n’est pas comptée.
                </span>
              </p>
            )}
          </div>
        )}

        {color && (
          <p className="mt-3 text-sm text-cave-500">
            Couleur attendue : <span className="text-cave-200">{color.label}</span> — SRM {color.srm}.
          </p>
        )}
      </section>

      {/* --- Facture de grain -------------------------------------------- */}
      <Section
        title="Grain"
        hint={`${Units.formatDual(totalGrist, 'kg')} au total · ${
          (recipe.efficiencyPct ?? brewhouse?.efficiencyPct) != null ? `${recipe.efficiencyPct ?? brewhouse?.efficiencyPct} % d’efficacité` : 'efficacité inconnue'
        }`}
      >
        {grains.length === 0 ? (
          <p className="text-sm text-cave-500">Aucun malt renseigné.</p>
        ) : (
          <ul className="divide-y divide-cave-850">
            {grains.map((m, i) => {
              const pct = totalGrist > 0 ? (m.weightKg / totalGrist) * 100 : 0;
              return (
                <li key={`${m.name}-${i}`} className="py-2.5 flex items-baseline gap-3">
                  <span className="reading text-sm text-cave-500 w-12 shrink-0 text-right">
                    {pct.toFixed(0)} %
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base text-cave-100 truncate">{m.name}</span>
                    {m.colorEbc != null && (
                      <span className="block text-sm text-cave-500">{m.colorEbc} EBC</span>
                    )}
                  </span>
                  <span className="reading text-base text-cave-50 shrink-0">
                    {Units.format(m.weightKg, 'kg')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/*
        --- Sucres, lactose, fruits --------------------------------------
        Séparés du grain volontairement : ils n'entrent pas dans la facture de
        grain, n'apportent pas de couleur, et surtout ne fermentent pas tous.
      */}
      {others.length > 0 && (
        <Section
          title="Sucres et ajouts"
          hint={
            (points?.unfermentable ?? 0) > 2
              ? `${Math.round(points!.unfermentable)} points de densité que la levure ne peut pas manger — ils restent dans la bière.`
              : undefined
          }
        >
          <ul className="divide-y divide-cave-850">
            {others.map((f, i) => (
              <li key={`${f.name}-${i}`} className="py-2.5 flex items-baseline gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-cave-100 truncate">{f.name}</span>
                  <span className="block text-sm text-cave-500">
                    {f.use === 'fermentation'
                      ? `en fermentation, J+${f.dayOffset ?? 0}`
                      : f.use === 'ebullition'
                        ? 'à l’ébullition'
                        : 'à l’empâtage'}
                    {' · '}
                    {f.fermentabilityPct === 0
                      ? 'non fermentescible'
                      : `${f.fermentabilityPct ?? 100} % fermentescible`}
                  </span>
                </span>
                <span className="reading text-base shrink-0">
                  {Units.format(f.weightKg, 'kg')}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* --- Houblons, groupés par moment -------------------------------- */}
      <Section
        title="Houblons"
        hint={
          dryHopTotal > 0
            ? `dont ${Units.format(dryHopTotal, 'g')} à cru — sans effet sur l’amertume`
            : undefined
        }
      >
        {grouped.length === 0 ? (
          <p className="text-sm text-cave-500">Aucun houblon renseigné.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ stage, hops: list }) => {
              const style = HOP_STAGE[stage];
              const subtotal = list.reduce((s, h) => s + h.weightG, 0);
              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full border ${style.tone}`}
                    >
                      {style.label}
                    </span>
                    <span className="reading text-sm text-cave-500">
                      {Units.format(subtotal, 'g')}
                    </span>
                  </div>
                  <p className="text-sm text-cave-600 leading-snug">{style.hint}</p>

                  <ul className="divide-y divide-cave-850">
                    {list.map((h, i) => {
                      const ibu = style.bitters ? ibuOf(h) : 0;
                      return (
                        <li key={`${h.name}-${i}`} className="py-2 flex items-baseline gap-3">
                          <span className="min-w-0 flex-1">
                            <span className="block text-base text-cave-100 truncate">{h.name}</span>
                            <span className="block text-sm text-cave-500">
                              {describeMoment(h)}
                              {h.alpha ? ` · ${h.alpha} % AA` : ' · alpha inconnu'}
                            </span>
                          </span>
                          <span className="text-right shrink-0">
                            <span className="block reading text-base text-cave-50">
                              {Units.format(h.weightG, 'g')}
                            </span>
                            {style.bitters && (
                              <span className="block reading text-sm text-cave-500">
                                {h.alpha ? `${ibu.toFixed(1)} IBU` : '— IBU'}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* --- Levure ------------------------------------------------------ */}
      <Section title="Levure">
        {!recipe.yeast?.name ? (
          <p className="text-sm text-cave-500">Aucune levure renseignée.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-base text-cave-100">
              {recipe.yeast.lab && <span className="text-cave-400">{recipe.yeast.lab} </span>}
              {recipe.yeast.name}
              {recipe.yeast.strain && (
                <span className="text-cave-400"> · {recipe.yeast.strain}</span>
              )}
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <dt className="text-sm text-cave-500">Quantité</dt>
                <dd className="reading text-base">
                  {recipe.yeast.qty} {recipe.yeast.unit}
                  {recipe.yeast.qty > 1 ? 's' : ''}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-cave-500">Forme</dt>
                <dd className="text-base text-cave-100">{recipe.yeast.form}</dd>
              </div>
              <div>
                <dt className="text-sm text-cave-500">Ensemencement</dt>
                <dd className="reading text-base">
                  {recipe.yeast.pitchTempC != null ? `${recipe.yeast.pitchTempC} °C` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-cave-500">Fermentation</dt>
                <dd className="reading text-base">
                  {recipe.yeast.fermTempMinC != null && recipe.yeast.fermTempMaxC != null
                    ? `${recipe.yeast.fermTempMinC}–${recipe.yeast.fermTempMaxC} °C`
                    : '—'}
                </dd>
              </div>
            </dl>
            {recipe.yeast.notes && (
              <p className="text-sm text-cave-400 leading-snug">{recipe.yeast.notes}</p>
            )}
          </div>
        )}
      </Section>

      {/* --- Additifs ---------------------------------------------------- */}
      {recipe.adjuncts && recipe.adjuncts.length > 0 && (
        <Section title="Additifs">
          <ul className="divide-y divide-cave-850">
            {recipe.adjuncts.map((a, i) => (
              <li key={`${a.name}-${i}`} className="py-2 flex items-baseline gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-cave-100 truncate">{a.name}</span>
                  <span className="block text-sm text-cave-500">{a.step}</span>
                </span>
                <span className="reading text-base shrink-0">
                  {Units.format(a.amount, a.unit)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* --- Eau : le plan complet, empâtage et rinçage séparés ----------- */}
      {recipe.waterPlan && (
        <Section
          title="Eau et sels"
          /*
           * ⚠️ `targetProfileId` porte un CODE BJCP (« 21C »), et il était
           * cherché dans `TARGET_PROFILES`, dont les identifiants sont des noms
           * d'eaux historiques (« neipa », « burton »). Aucun ne correspondait
           * jamais : la fiche affichait « personnalisé » sur toutes les
           * recettes. C'est `styleByCode` qui connaît ces codes.
           */
          hint={`${Number(recipe.waterPlan.diRatioPct.toFixed(2))} % d’osmosée · ${
            recipe.waterPlan.targetIons
              ? recipe.waterPlan.targetName ?? 'cible de la recette'
              : styleByCode(recipe.waterPlan.targetProfileId).name
          }`}
        >
          <div className="space-y-3">
            <BrewEquipmentSummary recipe={recipe} profile={brewhouse}/>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-cave-500">Empâtage</div>
                <div className="reading text-base">{recipe.waterPlan.mashWaterL} L</div>
                {((recipe.waterPlan.diRatioPct ?? 0) > 0) && (
                  <div className="text-2xs text-cave-400 font-mono mt-0.5">
                    {Math.round((recipe.waterPlan.mashWaterL * (100 - (recipe.waterPlan.diRatioPct ?? 0))) / 10) / 10} L réseau · {Math.round((recipe.waterPlan.mashWaterL * (recipe.waterPlan.diRatioPct ?? 0)) / 10) / 10} L osmosée ({Number(recipe.waterPlan.diRatioPct.toFixed(2))} %)
                  </div>
                )}
              </div>
              <div>
                <div className="text-cave-500">Rinçage</div>
                <div className="reading text-base">{recipe.waterPlan.spargeWaterL} L</div>
                {recipe.waterPlan.spargeWaterL > 0 && (
                  (() => {
                    const spargeDi = recipe.waterPlan.spargeDiRatioPct ?? recipe.waterPlan.diRatioPct ?? 0;
                    if (spargeDi <= 0) return null;
                    const osmoseeL = Math.round((recipe.waterPlan.spargeWaterL * spargeDi) / 10) / 10;
                    const reseauL = Math.round((recipe.waterPlan.spargeWaterL - osmoseeL) * 10) / 10;
                    return (
                      <div className="text-2xs text-cave-400 font-mono mt-0.5">
                        {reseauL} L réseau · {osmoseeL} L osmosée ({Number(spargeDi.toFixed(2))} %)
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/*
              ⚠️ LA TOILE, redessinée depuis le plan FIGÉ — jamais recalculée.
              La fiche ne va pas rechercher la source dans la configuration :
              son analyse a pu être corrigée depuis, et la recette doit
              continuer de montrer l'eau sur laquelle elle a été pensée. Même
              principe que `Batch.recipeSnapshot`.

              Un plan enregistré avant cette version ne porte pas les deux
              eaux : on n'affiche alors rien plutôt qu'une toile fausse.
            */}
            {waterDisplay && (
              <WaterRadar
                start={waterDisplay.start}
                achieved={waterDisplay.achieved}
                style={
                  recipe.waterPlan.targetIons
                    ? styleFromTargetIons(
                        recipe.waterPlan.targetIons,
                        recipe.waterPlan.targetName ?? 'Cible de la recette'
                      )
                    : styleByCode(recipe.waterPlan.targetProfileId)
                }
              />
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-cave-500 text-left">
                    <th scope="col" className="font-normal py-1 pr-3">Sel</th>
                    <th scope="col" className="font-normal py-1 px-2 text-right">Empâtage</th>
                    <th scope="col" className="font-normal py-1 pl-2 text-right">Rinçage</th>
                  </tr>
                </thead>
                <tbody>
                  {SALT_IDS.filter(
                    (id) => (recipe.waterPlan!.mash[id] ?? 0) > 0 || (recipe.waterPlan!.sparge[id] ?? 0) > 0
                  ).map((id) => (
                    <tr key={id} className="border-t border-cave-850">
                      <th scope="row" className="font-normal py-1.5 pr-3 text-cave-200 text-left">
                        {SALTS[id].name}
                        {ALKALINE_SALTS.includes(id) && (
                          <span className="block text-xs text-cave-500">
                            alcalin — empâtage seul
                          </span>
                        )}
                      </th>
                      <td className="py-1.5 px-2 reading text-right">
                        {recipe.waterPlan!.mash[id] ?? 0} g
                      </td>
                      <td className="py-1.5 pl-2 reading text-cave-400 text-right">
                        {recipe.waterPlan!.sparge[id] ?? 0} g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recipe.waterPlan.allSaltsInMash !== false && recipe.waterPlan.spargeWaterL > 0 && (
              <div className="px-2.5 py-1 text-2xs text-hop bg-hop/10 rounded border border-hop/20 flex items-center justify-between">
                <span>Tous les sels versés à l’empâtage · Rinçage acidifié seul</span>
              </div>
            )}

            {recipe.waterPlan.acid && (
              <div className="space-y-1 text-base text-cave-100">
                {recipe.waterPlan.acid.mash > 0 && (
                  <p>
                    <span className="reading text-water">
                      {recipe.waterPlan.acid.mash} {ACIDS[recipe.waterPlan.acid.id].unit}
                    </span>{' '}
                    de {ACIDS[recipe.waterPlan.acid.id].name} dans l’eau d’empâtage, pour
                    l’alcalinité résiduelle.
                  </p>
                )}
                {recipe.waterPlan.acid.sparge > 0 && (
                  <p>
                    <span className="reading text-water">
                      {recipe.waterPlan.acid.sparge} {ACIDS[recipe.waterPlan.acid.id].unit}
                    </span>{' '}
                    dans l’eau de rinçage, pour ne pas extraire les tanins des drêches.
                  </p>
                )}
              </div>
            )}

            {(recipe.waterPlan.measuredPh || recipe.waterPlan.measuredSpargePh) && (
              <p className="text-sm text-cave-400">
                pH mesuré à la cuve :{' '}
                {recipe.waterPlan.measuredPh ? `maische ${recipe.waterPlan.measuredPh}` : ''}
                {recipe.waterPlan.measuredPh && recipe.waterPlan.measuredSpargePh ? ' · ' : ''}
                {recipe.waterPlan.measuredSpargePh
                  ? `rinçage ${recipe.waterPlan.measuredSpargePh}`
                  : ''}
                .
              </p>
            )}

            {recipe.waterPlan.disabled && recipe.waterPlan.disabled.length > 0 && (
              <p className="text-sm text-cave-500">
                Écartés : {recipe.waterPlan.disabled.map((d) => SALTS[d].name).join(', ')}.
              </p>
            )}
          </div>
        </Section>
      )}

      {/* --- Eau (ancien format, lu tel quel) ----------------------------- */}
      {!recipe.waterPlan && recipe.water?.salts && (
        <Section
          title="Eau"
          hint={`${recipe.water.sourceName} · ${recipe.water.diRatioPct} % d’osmosée`}
        >
          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <dt className="text-sm text-cave-500">Gypse</dt>
              <dd className="reading text-base">{recipe.water.salts.gypseG} g</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-500">CaCl₂</dt>
              <dd className="reading text-base">{recipe.water.salts.cacl2G} g</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-500">MgSO₄</dt>
              <dd className="reading text-base">{recipe.water.salts.mgso4G} g</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-500">Acide lactique</dt>
              <dd className="reading text-base">{recipe.water.salts.acidLacticMl} mL</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-500">pH visé</dt>
              <dd className="reading text-base text-water">{recipe.water.targetPh}</dd>
            </div>
          </dl>
        </Section>
      )}

      {/* --- Empâtage et fermentation ------------------------------------ */}
      {(recipe.mash?.steps?.length || recipe.fermentation?.length) && (
        <Section title="Paliers">
          <div className="space-y-4">
            {recipe.mash?.steps?.length > 0 && (
              <div>
                <h3 className="text-sm text-cave-500 mb-1.5">
                  Empâtage
                  {recipe.mash.ratioLPerKg ? ` · ${recipe.mash.ratioLPerKg} L/kg` : ''}
                  {recipe.mash.spargeType === 'fly'
                    ? ' · rinçage continu'
                    : recipe.mash.spargeType === 'batch'
                      ? ' · rinçage par bacs'
                      : ''}
                </h3>
                <ul className="divide-y divide-cave-850">
                  {[...recipe.mash.steps, ...(recipe.mash.mashoutTempC != null && !recipe.mash.steps.some(s=>/mash.?out/i.test(s.name) && s.tempC === recipe.mash.mashoutTempC) ? [{name:'Mash-out',tempC:recipe.mash.mashoutTempC,durationMin:recipe.mash.mashoutDurationMin ?? 10}] : [])].map((s, i) => (
                    <li key={i} className="py-2 flex items-baseline gap-3">
                      <span className="flex-1 text-base text-cave-100">{s.name}</span>
                      <span className="reading text-base text-water">{s.tempC} °C</span>
                      <span className="reading text-base text-cave-400 w-16 text-right">
                        {s.durationMin} min
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-water mt-2">Eau de rinçage : {recipe.mash.spargeTempC ?? 76} °C · les durées indiquent le maintien à la consigne.</p>
                {recipe.mash.heatingRateCPerMin != null && <p className="text-sm text-cave-400 mt-1">Repère de chauffe : {recipe.mash.heatingRateCPerMin.toFixed(2)} °C/min. La montée est suivie séparément dans le journal.</p>}
              </div>
            )}

            {recipe.fermentation && recipe.fermentation.length > 0 && (
              <div>
                <h3 className="text-sm text-cave-500 mb-1.5">Fermentation</h3>
                <ul className="divide-y divide-cave-850">
                  {recipe.fermentation.map((s, i) => {
                    // Le type de phase se lit d'un coup : repos diacétyle et
                    // garde ne sont pas de la fermentation primaire.
                    const phase = PHASE_LABEL[s.kind ?? 'primaire'];
                    return (
                      <li key={i} className="py-2 flex items-baseline gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block text-base text-cave-100 truncate">{s.name}</span>
                          <span className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-sm px-2 py-0.5 rounded-full border ${phase.tone}`}
                            >
                              {phase.label}
                            </span>
                            {s.note && (
                              <span className="text-sm text-cave-500 truncate">{s.note}</span>
                            )}
                          </span>
                        </span>
                        <span className="reading text-base text-water shrink-0">{s.tempC} °C</span>
                        <span className="reading text-base text-cave-400 w-16 text-right shrink-0">
                          {s.days ? `${s.days} j` : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* --- Déroulé ----------------------------------------------------- */}
      {recipe.instructions && (
        <Section title="Déroulé" hint="Tel qu’il figure sur la recette d’origine.">
          <p className="text-base text-cave-200 leading-relaxed whitespace-pre-line">
            {recipe.instructions}
          </p>
        </Section>
      )}

      {/* --- Brassins issus de cette recette ------------------------------ */}
      {relatedBatches.length > 0 && (
        <Section
          title="Brassins"
          hint="Ce qui est réellement sorti de la cuve, comparé à la cible."
        >
          <ul className="divide-y divide-cave-850">
            {relatedBatches.map((b) => {
              const measured = b.og ? parseFloat(b.og) : null;
              const gap =
                measured && og > 1
                  ? BrewingMath.brewEfficiency(og, measured, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75)
                  : null;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => onOpenBatch(b)}
                    className="w-full min-h-touch py-2.5 flex items-baseline gap-3 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base text-cave-100 truncate">
                        {b.id} — {b.name}
                      </span>
                      <span className="block text-sm text-cave-500">
                        {b.brewDate}
                        {gap ? ` · ${gap.realEfficiencyPct} % d’efficacité réelle` : ''}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block reading text-base">{b.og ?? '—'}</span>
                      {gap && (
                        <span
                          className={`block reading text-sm ${
                            Math.abs(gap.deltaPoints) <= 2 ? 'text-hop' : 'text-ebc-amber'
                          }`}
                        >
                          {gap.deltaPoints >= 0 ? '+' : ''}
                          {gap.deltaPoints} pts
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer cette recette ?"
        what={`${recipe.name} — ${recipe.style}, ${recipe.volumeL} L`}
        consequence={
          relatedBatches.length > 0
            ? `${relatedBatches.length} brassin${relatedBatches.length > 1 ? 's ont' : ' a'} été lancé${relatedBatches.length > 1 ? 's' : ''} depuis cette recette. Chacun garde sa propre copie figée : leur historique reste intact.`
            : 'La recette quitte le catalogue. La suppression est journalisée.'
        }
        confirmLabel="Supprimer la recette"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
      />
    </PageShell>
  );
};
