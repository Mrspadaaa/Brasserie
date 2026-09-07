import React from 'react';
import { ChevronDown, Container } from 'lucide-react';
import { BrewhouseProfile, BrewDayState, Recipe, RecipeSnapshot } from '../types';
import { equipmentCheck, roPackages, r1 } from '../domain/brewEquipment';
import { actualWater } from '../domain/brewAssist';
import { effectiveFermentables } from '../domain/brewCompanion';
import './brew-equipment.css';

export function BrewEquipmentSummary({
  recipe,
  profile,
  state,
  stepId
}: {
  recipe: Recipe | RecipeSnapshot;
  profile?: BrewhouseProfile;
  state?: BrewDayState;
  stepId?: string;
}) {
  const rig = profile ?? recipe.brewhouse,
    e = rig?.equipment;
  if (!e) return null;
  const s = state ?? { steps: [], currentIndex: 0 };
  const mash = actualWater(recipe, s, 'mash'),
    sparge = actualWater(recipe, s, 'sparge');
  const grain = effectiveFermentables(recipe, s)
    .filter((f) => f.kind === 'grain' && f.use === 'empatage')
    .reduce((sum, f) => sum + f.weightKg, 0);
  const finalReading = (s.readings ?? [])
    .filter((r) => r.kind === 'volume' && r.stepId === 'ensemencement')
    .sort((a, b) => b.at - a.at)[0];
  const check = equipmentCheck(e, {
    volumeL: finalReading?.value ?? recipe.volumeL,
    grainKg: grain,
    mashL: mash.litres,
    spargeL: sparge.litres,
    preBoilHotL: recipe.preBoilHotL
  });
  if (!check) return null;
  const waterStage =
    !stepId || ['eau', 'sparge', 'concassage'].includes(stepId) || /^mash/.test(stepId);
  const finalStage = !stepId || ['eau', 'ensemencement', 'refroidissement'].includes(stepId);
  const warning =
    (waterStage && check.mashTooFull) ||
    ((!stepId || stepId === 'eau' || /boil|preboil/.test(stepId)) && check.boilTooFull) ||
    (finalStage && check.fermenterTooFull);
  const packs =
    !mash.invalidMix && !sparge.invalidMix ? roPackages(mash.roL + sparge.roL, e.roPackL) : null;
  return (
    <details className={`equipment-summary ${warning ? 'has-warning' : ''}`}>
      <summary>
        <span>
          <Container size={17} /> Mon matériel
        </span>
        <span>
          {warning ? 'Volume à revoir' : `${check.maxFermenterL} L de moût`}{' '}
          <ChevronDown size={15} />
        </span>
      </summary>
      <div className="equipment-summary-body">
        {waterStage && (
          <>
            <p>
              <strong>
                Cuve : ≈ {check.occupiedL} / {e.kettleWorkingL} L utiles
              </strong>
              <br />
              {mash.litres} L d’eau + {r1(grain)} kg de grain, dilatation à chaud incluse. La
              capacité totale de {e.kettleCapacityL} L n’est pas un volume d’eau à verser.
            </p>
            {check.mashTooFull && (
              <p className="equipment-warning">
                La maische dépasse la limite utile. Avant de verser, réduis le volume du brassin ou
                reporte une partie de l’eau au rinçage puis recalcule son traitement. Après
                empâtage, ne retire pas du moût pour corriger la coupe.
              </p>
            )}
            {!check.thinEnough && (
              <p className="equipment-warning">
                Maische sous 2,5 L/kg : vérifie la circulation du panier. Un brassin plus petit sera
                plus adapté.
              </p>
            )}
            {sparge.litres > 0 && (
              <p>
                <strong>Rinçage à {recipe.mash?.spargeTempC ?? 76} °C</strong>
                <br />
                {check.spargeLoads === 1
                  ? `${sparge.litres} L · une chauffe`
                  : `${sparge.litres} L en ${check.spargeLoads} chauffes : ${check.loads.join(' + ')} L`}
                . Maximum {check.spargeFillL} L à froid dans le sparger {e.spargeCapacityL} L,
                dilatation réservée.{' '}
                {check.spargeLoads > 1
                  ? 'Traite chaque charge proportionnellement et contrôle sa température.'
                  : ''}
              </p>
            )}
            {packs && (
              <p>
                <strong>
                  {packs.count} pack{packs.count > 1 ? 's' : ''} de {packs.packL} L d’osmosée
                </strong>
                <br />
                Verser {packs.requiredL} L : {Number(mash.roL.toFixed(2))} L empâtage +{' '}
                {Number(sparge.roL.toFixed(2))} L rinçage. Garder {packs.remainingL} L dans les
                packs.
              </p>
            )}
          </>
        )}
        {recipe.preBoilHotL != null && (
          <p>
            Collecte visée :{' '}
            <strong>
              {recipe.preBoilL} L à froid ≈ {recipe.preBoilHotL} L à ébullition
            </strong>
            .{' '}
            {check.boilTooFull
              ? 'Ce volume dépasse la limite utile de la cuve.'
              : 'Ne dépasse pas le repère de remplissage en chauffant.'}
          </p>
        )}
        {finalStage && (
          <p className={check.fermenterTooFull ? 'equipment-warning' : ''}>
            <strong>Fermenteur : {check.maxFermenterL} L de moût maximum prévu</strong>
            <br />
            {e.fermenterCapacityL} L totaux, {e.fermenterHeadspacePct} % réservés à la mousse.{' '}
            {check.fermenterTooFull
              ? 'Répartis le surplus dans un autre fermenteur désinfecté ou réduis la recette avant brassage.'
              : `Pour ${recipe.volumeL} L visés, il reste ${r1(e.fermenterCapacityL - recipe.volumeL)} L de place.`}
          </p>
        )}
        {!e.workingVolumeConfirmed && (
          <small>
            Limite utile de cuve provisoire, à vérifier dans Paramètres → Brasserie → Matériel.
          </small>
        )}
      </div>
    </details>
  );
}
