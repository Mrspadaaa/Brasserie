// API publique du moteur v4 (pure, typée, sans réseau ni stockage), liée au moteur par défaut (fixtures). Voir ENGINE.md.
// Chaque fonction lit les données du moteur actif (data.ts, courant) : creerMoteur (moteur.ts) les lie à des données injectées.
export { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
export { STOCK, CATALOGUE, STOCK_SOURCE, hopRef, type StockHop, type CatalogueHop, type HopRef } from './data';
export {
  MOMENTS, searchDoses, recipeIbu, additionIbu, gramsForIbu, ibuPerGram, recipeProfile, yeastInfo, matrixContext,
  type MomentId, type Moment, type Recipe, type Addition, type FamilyEstimate, type Profile, type RecipeProfile, type YeastInfo, type MatrixContext, type Ibu,
} from './recipe';
export { hopProfile, styleFit, citations, describeFamilies, familyWords, type FamilyWords, REFERENCE, stockKeys, type HopProfile, type StyleFit, type FitClass, type Citation, type Reference, type DescriptionLevel, type FamilyDescription } from './hops';
export { tastingFrom, situateBeer, levelRange, tastingMention, TASTING_USAGE, type Tasting, type TastingAxis, type PerceivedLevel, type SituatedFamily } from './tasting';
export { offModelLeads, type OffModelLead } from './leads';
export { readBeer, readingSummary, voiesSummary, gapSummary, type ReadingEntry, type ReadingVerdict } from './reading';
export { quickAdds, quickAddKey, QUICK_ADD_RULE, type QuickAdd } from './quickAdd';
export { ibuByMoment, momentCatalogue, IBU_MOMENTS, ibuTables, TABLES_RULE, DRY_HOP_DAY, MINUTES_5, BOIL_LENGTHS, WP_TEMPERATURES, WP_MINUTES, densityFactors, type IbuAtMoment, type MomentInfo, type IbuTables } from './ibuMoments';
export { loadedRecipe, recipeLines, shoppingList, buildFromEmpty, LOADED_RECIPE_RULE, CONSTRUCTION_RULE } from './cases';
export { hopRole, hopAlpha, roleFromAlpha, ROLE_RULE, type HopRoleValue, type HopAlpha } from './roles';
export {
  substitutes, oilScales, RANKING as SUBSTITUTION_RANKING, SUBSTITUTION_METHOD, WEIGHTS as SUBSTITUTION_WEIGHTS, PALIERS as SUBSTITUTION_PALIERS,
  type Substitute, type SubstitutionOptions, type SubstitutionResult, type SubstitutionContext, type SubstitutionWeights,
} from './substitution';
export { additionEffect } from './voies';
export { NO_GOUTS, GOUTS_RULE, goutsSets, type Gouts, type GoutEntry } from './gouts';
export { yeastDoubleImpact, yeastChangeEffect, yeastSignals, CHARACTERIZED_YEASTS, type YeastDoubleImpact, type YeastSignal } from './yeast';
export { afterLevelsDelta, ROUE_AROMES, beerContinuous, targetContinuous, afterContinuous, CONTINU_RULE } from './levels';
export { hopSheet, sheetKeys, type HopSheetContext } from './fiches';
export { beerCrans, targetCrans, afterCrans, CRANS_RULE, type CransPosition, type TargetCrans, type AfterCrans } from './levels';
export { beerLevels, targetLevels, afterLevels, ficheLevels, classOf, LEVEL_RULE, type Level, type BeerLevel, type TargetLevel, type AfterLevel, type FicheLevel } from './levels';
export { proposeVoies, compareVoies, compareRankKeys, applyVoie, RANKING, type Direction, type Voie, type VoieType, type Action, type VoieResult, type FamilyEffect, type DirectedTarget, type StyleOverflow } from './voies';
export { getStyleScale, documentedStyleCodes, SCALE_PARAMETERS, type StyleScale, type FamilyScale, type FamilyStatus } from './style/scale';
export { valueVerdict, gapVerdict, trackPosition, trackShare, type ValueVerdict, type GapVerdict, type EstimateLike } from './style/verdict';
export { toleranceScale, styleMasking, ecartTolerances, TOLERANCE_RULE, type Apriori, type FamilyTolerance, type ToleranceScale, type Masking } from './tolerance';
export {
  pouvoirAjout, pouvoirRecette, profilParMoment, signauxFamilles, comparerFamilles, comparerComposes, sensPlages, verifications, lire as lirePouvoirSeuil, texte as textePlage, source as sourcePouvoir,
  COMPOSES, TERPENES, THIOLS, MOMENTS_POUVOIR, FACTEUR_ELEVE, MENTION_RAPPORT, MENTION_SIGNAL, BASE_COMMUNE, POUVOIR_RULE, DONNEES_POUVOIR,
  type ComposeId, type Niveau, type Plage, type Grandeur, type SourceRef, type SeuilApplique, type Lecture, type Drapeau, type BaseCommune, type PouvoirCompose, type MarqueurFamille,
  type SignalFamille, type LecturePouvoir, type PouvoirAjout, type PouvoirComposeRecette, type PouvoirRecette, type AjoutPouvoir, type RecettePouvoir, type Sens, type ComparaisonFamille,
  type ProfilMoment, type Verification,
} from './pouvoir';
export { cransOf, classeDegustee } from './levels';
export {
  simulerCas, profilAvant, echelleSimulee, styleSimule, points as pointsSimules, activiteAncre, partExtraite, biotransfoLevure, formeDe, courbeDe, ajoutPouvoirDe,
  sourceSimulee, arrondi as arrondiSimule, largeur as largeurSimulee,
  MOMENTS_SIMULES, MENTION_SIMULE, PROFIL_RULE, CORRESPONDANCE, MESURES_COMPOSES,
  type MomentSimule, type CompSim, type Confiance, type ValeurFamille, type ProfilFamilles, type DeltaFamille, type AjoutSimule, type DrapeauSimule,
  type MesureReelle, type ApportHoublon, type CasSimule, type CasEntree,
} from './profil-simule';
