import { WaterIons, AcidId } from '../../types';
import { ACIDS } from './substances';
import { residualAlkalinity, alkalinityAsCaCO3 } from './ions';
import { MASH_PH_BAND, RA_PH_DIVISOR } from './mashPh';

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
  if (!Number.isFinite(currentRa) || currentRa <= targetRa || mashWaterL <= 0) {
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
 * proportionnellement au rapport eau/grain — ΔpH = (ΔAR · ratio) / RA_PH_DIVISOR.
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

  if (!Number.isFinite(measuredPh) || !Number.isFinite(mashWaterL) || !(mashWaterL > 0))
    return { ...vide, known: false };
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
  if (!Number.isFinite(amount) || !Number.isFinite(litres) || !(amount > 0) || !(litres > 0))
    return ions;
  const balance = waterAcidBalance(ions, amount, acid, litres);
  return balance ? { ...ions, hco3: balance.hco3After } : ions;
}

/**
 * Bilan de l'eau seule : le HCO3 ne devient jamais négatif, mais l'acide
 * au-delà de sa neutralisation ne disparaît pas. Il peut encore agir sur
 * les tampons du malt ; ce bilan n'est ni une dose conseillée ni un pH du moût.
 * Repère métier : https://www.brunwater.com/articles/i-added-acid-to-my-water-and-my-ph-cratered
 */
export function waterAcidBalance(ions: WaterIons, amount: number, acid: AcidId, litres: number) {
  if (![ions.hco3, amount, litres].every(Number.isFinite) || ions.hco3 < 0 || amount < 0 || litres <= 0)
    return null;
  const strength = ACIDS[acid].hco3NeutralizedPerUnit;
  const neutralizationAmount = ions.hco3 * litres / strength;
  return {
    hco3After: Math.max(0, ions.hco3 - amount * strength / litres),
    neutralizationAmount,
    beyondWaterAmount: Math.max(0, amount - neutralizationAmount),
  };
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
export function bicarbonateFraction(ph: number): number {
  return 1 / (1 + Math.pow(10, 6.35 - ph));
}

/**
 * Part de l'alcalinité mesurée qu'il faut neutraliser pour atteindre `targetPh`
 * depuis `sourcePh`.
 *
 *   f = 1 − α₁(cible) / α₁(source),  α₁ = 1 / (1 + 10^(pKa₁ − pH))
 *
 * ⚠️ Le code retirait 100 % de l'alcalinité en annonçant viser pH 5.8. Retirer
 * la TOTALITÉ rapproche du point d'équivalence d'un titrage
 * d'alcalinité. Pour 5.8 il n'en faut retirer qu'environ 76 %, pour
 * 5.5 environ 87 % dans ce modèle : l'écart valait un surdosage d'environ 30 %.
 * Modèle carbonate simplifié à température ambiante, sans dégazage ni autres
 * tampons : le pH reste à mesurer, ce calcul ne remplace pas un titrage.
 */
export function alkalinityFractionToRemove(targetPh: number, sourcePh = 7.4): number {
  if (!Number.isFinite(targetPh) || !Number.isFinite(sourcePh)) return 0;
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
 * astringente. On l'acidifie donc **indépendamment de la maische**, avant que
 * cette eau ne traverse les drêches.
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
  if (!Number.isFinite(alk) || alk <= 0) return { ...base, amount: 0 };

  const toRemove = alk * alkalinityFractionToRemove(targetPh, sourcePh);
  const hco3ToRemove = (toRemove * 61) / 50;
  const mg = hco3ToRemove * spargeWaterL;
  return { ...base, amount: Math.round((mg / def.hco3NeutralizedPerUnit) * 10) / 10 };
}

/** A retained dose is an explicit quantity, including zero; invalid volumes cannot carry acid. */
export function retainAcidDose<T extends { amount: number }>(
  calculated: T,
  override: number | undefined,
  litres: number
): T {
  return {
    ...calculated,
    amount: !Number.isFinite(litres) || litres <= 0 ? 0
      : override != null && Number.isFinite(override) ? Math.max(0, override) : calculated.amount
  };
}

/** Shared by mineral planning and the final treatment, so manual sparge acid affects both. */
export function calculateSpargeTreatment(
  ions: WaterIons,
  litres: number,
  acid: AcidId,
  options: { sourcePh?: number; override?: number } = {}
) {
  const calculated = spargeAcidNeeded(ions, litres, acid, SPARGE_TARGET_PH, options.sourcePh ?? 7.4);
  const retained = retainAcidDose(calculated, acid === 'maltAcidule' ? 0 : options.override, litres);
  return { calculated, retained, ions: ionsAfterAcid(ions, retained.amount, acid, litres) };
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
  if (!Number.isFinite(totalMl) || totalMl <= 0 || !Number.isFinite(beerVolumeL) || beerVolumeL <= 0) return 0;
  return Math.round(((totalMl * 0.952) / beerVolumeL) * 100) / 100;
}
