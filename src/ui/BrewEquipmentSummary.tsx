import React from 'react';
import { ChevronDown, Container } from 'lucide-react';
import type { BrewhouseProfile, BrewDayState, Recipe, RecipeSnapshot } from '../types';
import { equipmentCheck, roPackages } from '../domain/brewEquipment';
import { fermenterRecommendation } from '../domain/fermenterPlanning';
import { actualWater } from '../domain/brewAssist';
import { effectiveFermentables } from '../domain/brewCompanion';
import './brew-equipment.css';

const litres = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

export function BrewEquipmentSummary({ recipe, profile, state, stepId, onAcceptSpargeException }: {
  recipe: Recipe | RecipeSnapshot;
  profile?: BrewhouseProfile;
  state?: BrewDayState;
  stepId?: string;
  onAcceptSpargeException?: () => void;
}) {
  // Launched batches keep their frozen installation when live settings change.
  const rig = recipe.brewhouse ?? profile;
  const e = rig?.equipment;
  if (!e) return null;
  const s = state ?? { steps: [], currentIndex: 0 };
  const mash = actualWater(recipe, s, 'mash'), sparge = actualWater(recipe, s, 'sparge');
  const grain = effectiveFermentables(recipe, s)
    .filter(f => f.kind === 'grain' && f.use === 'empatage').reduce((sum, f) => sum + f.weightKg, 0);
  const finalReading = (s.readings ?? []).filter(r => r.kind === 'volume' && r.stepId === 'ensemencement' && r.roomTemp === true && Number.isFinite(r.value) && r.value > 0)
    .sort((a, b) => b.at - a.at)[0];
  const filling = finalReading?.value ?? recipe.volumeL;
  const recommendation = fermenterRecommendation(recipe, e);
  const hasMash = recipe.waterPlan?.mashWaterL != null || s.additions?.['water-mash']?.amount != null;
  const hasSparge = recipe.waterPlan?.spargeWaterL != null || s.additions?.['water-sparge']?.amount != null;
  const check = equipmentCheck(e, {
    volumeL: filling, grainKg: grain, mashL: mash.litres, spargeL: sparge.litres,
    preBoilHotL: recipe.preBoilHotL, preferences: rig?.preferences,
    fermenterHeadspacePct: recommendation?.headspacePct
  });
  if (!check) return <section className="equipment-summary equipment-plan" aria-label="Volumes et matériel"><p role="alert">Calcul matériel indisponible : vérifie les capacités et les volumes saisis.</p></section>;
  const waterStage = !stepId || ['eau', 'sparge', 'concassage'].includes(stepId) || /^mash/.test(stepId);
  const finalStage = !stepId || ['eau', 'ensemencement', 'refroidissement'].includes(stepId);
  const boilStage = !stepId || stepId === 'eau' || /boil|preboil/.test(stepId);
  const warning = waterStage && hasMash && check.mashTooFull || boilStage && check.boilTooFull || finalStage && check.fermenterTooFull || waterStage && hasSparge && check.spargeTooMuch;
  const exception = waterStage && hasSparge && check.spargeStatus === 'exception';
  const exceptionAccepted = recipe.installation?.spargeExceptionAccepted &&
    recipe.waterPlan?.spargeWaterL != null && Math.abs(sparge.litres - recipe.waterPlan.spargeWaterL) < .01;
  const packs = hasMash && hasSparge && !mash.invalidMix && !sparge.invalidMix ? roPackages(mash.roL + sparge.roL, e.roPackL) : null;
  const waterChanged = !!s.additions?.['water-mash'] || !!s.additions?.['water-sparge'];
  return (
    <section className={`equipment-summary equipment-plan ${warning ? 'has-warning' : ''}`} aria-label="Volumes et matériel">
      <header className="equipment-plan-heading">
        <span><Container size={15} aria-hidden="true" /> Volumes et matériel</span>
        <span className={warning ? 'text-alert-strong' : exception ? 'text-attention' : 'text-cave-400'}>{warning ? 'À revoir' : exception ? 'Appoint nécessaire' : 'Repères prévus'}</span>
      </header>
      <dl className="equipment-plan-values">
        {waterStage && <>
          <div><dt>Empâtage · à froid</dt><dd>{hasMash ? `${litres(mash.litres)} L` : 'À renseigner'}</dd></div>
          {hasMash && <div className="equipment-plan-secondary"><dt>Avec les grains · à chaud</dt><dd>{litres(check.occupiedL)} / {litres(e.kettleWorkingL)} L</dd></div>}
          <div><dt>Rinçage · à chaud</dt><dd>{hasSparge ? `${litres(check.spargeHotL)} L` : 'À renseigner'}</dd></div>
          {hasSparge && sparge.litres > 0 && <div className="equipment-plan-secondary"><dt>À préparer à froid</dt><dd>{litres(sparge.litres)} L</dd></div>}
          {hasSparge && check.spargeAuxiliaryHotL > 0 && <div className="equipment-plan-secondary"><dt>Principal + appoint · à chaud</dt><dd>{litres(check.spargeMainHotL)} + {litres(check.spargeAuxiliaryHotL)} L</dd></div>}
        </>}
        {recipe.preBoilHotL != null && boilStage && <div><dt>Avant ébullition · à chaud</dt><dd>{litres(recipe.preBoilHotL)} / {litres(e.kettleWorkingL)} L</dd></div>}
        {finalStage && <>
          <div><dt>Fermenteur · {finalReading ? 'mesuré' : 'prévu'}</dt><dd>{litres(filling)} / {litres(e.fermenterCapacityL)} L</dd></div>
          <div className="equipment-plan-secondary"><dt>Espace libre</dt><dd>{litres(check.headspaceL)} L · {litres(Math.max(0, check.headspaceL) / e.fermenterCapacityL * 100)} %</dd></div>
        </>}
      </dl>
      {waterStage && hasMash && check.mashTooFull && <p className="equipment-plan-warning" role="alert">Empâtage trop volumineux. Réduis le brassin ou redistribue l’eau avant brassage, puis recalcule son traitement.</p>}
      {boilStage && check.boilTooFull && <p className="equipment-plan-warning" role="alert">La collecte avant ébullition dépasse la limite utile de la cuve.</p>}
      {waterStage && hasMash && !check.thinEnough && <p className="equipment-plan-warning">Maische sous 2,5 L/kg : vérifie la circulation du panier.</p>}
      {waterStage && hasSparge && check.spargeTooMuch && <p className="equipment-plan-warning" role="alert">Rinçage impossible : {litres(check.spargeHotL)} L à chaud, maximum {litres(check.spargeMaximumHotL!)} L. Réduis le brassin ou revois la répartition.</p>}
      {exception && <div className="equipment-plan-warning" role="status">
        <p>Bouilloire annexe : {litres(check.spargeAuxiliaryHotL)} L à chaud en plus du principal. {check.spargeMaximumHotL != null ? `Maximum total ${litres(check.spargeMaximumHotL)} L.` : 'Capacité de l’appoint à vérifier.'}</p>
        {exceptionAccepted ? <p>Exception acceptée pour cette recette.</p>
          : onAcceptSpargeException ? <button type="button" className="equipment-button" onClick={onAcceptSpargeException}>Prévoir cet appoint</button>
            : <p>Confirme cet appoint avant de préparer l’eau.</p>}
      </div>}
      {finalStage && check.fermenterTooFull && <p className="equipment-plan-warning" role="alert">Le volume atteint la capacité totale. Répartis le surplus dans un autre fermenteur ou réduis la recette avant brassage.</p>}
      {finalStage && !check.fermenterTooFull && check.fermenterAboveRecommendation && <p className="equipment-plan-warning">Remplissage au-dessus du repère de {litres(check.maxFermenterL)} L. Ajuste la réserve pour cette recette ou réduis le remplissage.</p>}
      {finalStage && recommendation && <p className="equipment-plan-note">Réserve {litres(recommendation.headspacePct)} % · {recommendation.basis === 'manufacturer' ? 'notice de la levure' : recommendation.basis === 'manual' ? 'choix de la recette' : recommendation.basis === 'profile' ? 'repère personnel' : 'repère provisoire ajustable'}.</p>}
      {finalStage && recommendation?.belowDocumentedRecommendation && <p className="equipment-plan-warning">Ton choix est inférieur aux {recommendation.documentedHeadspacePct} % conseillés pour cette levure.</p>}
      <details className="equipment-plan-details">
        <summary><span>Repères et osmosée</span><ChevronDown size={14} aria-hidden="true" /></summary>
        <div>
          {waterStage && <p>{waterChanged ? 'Volumes ajustés dans le journal ; vérifier ce qui a effectivement été versé.' : 'Volumes prévus, aucune mesure d’eau supposée.'} {hasMash && grain > 0 ? `Empâtage à ${litres(mash.litres / grain)} L/kg.` : ''} Les volumes à chaud sont estimés.</p>}
          {waterStage && hasSparge && <p>Budget de rinçage habituel : {litres(check.spargePreferredHotL)} L à chaud. Principal disponible : {litres(e.spargeCapacityL)} L à chaud. L’appoint utilise la bouilloire annexe.</p>}
          {packs && <p><strong>{packs.count} pack{packs.count > 1 ? 's' : ''} de {litres(packs.packL)} L d’osmosée</strong> · verser {litres(packs.requiredL)} L ({litres(mash.roL)} + {litres(sparge.roL)} L). Garder {litres(packs.remainingL)} L dans les packs.</p>}
          {recommendation && <p>{recommendation.reason} {recommendation.source && <a href={recommendation.source.reference} target="_blank" rel="noreferrer">Notice {recommendation.source.author}</a>}</p>}
          {!e.workingVolumeConfirmed && <p>Limite utile de cuve provisoire ({litres(e.kettleWorkingL)} L), à confirmer dans Mon installation. Capacité totale : {litres(e.kettleCapacityL)} L.</p>}
        </div>
      </details>
    </section>
  );
}
