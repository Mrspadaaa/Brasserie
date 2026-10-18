// API publique du moteur v4 (pure, typée, sans réseau ni stockage). Voir ENGINE.md.
export { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
export { STOCK, CATALOGUE, STOCK_SOURCE, hopRef, type StockHop, type CatalogueHop, type HopRef } from './data';
export {
  MOMENTS, searchDoses, recipeIbu, additionIbu, gramsForIbu, ibuPerGram, recipeProfile, yeastInfo, matrixContext,
  type MomentId, type Moment, type Recipe, type Addition, type FamilyEstimate, type Profile, type RecipeProfile, type YeastInfo, type MatrixContext, type Ibu,
} from './recipe';
export { hopProfile, styleFit, citations, REFERENCE, stockKeys, type HopProfile, type StyleFit, type FitClass, type Citation, type Reference } from './hops';
export { proposeVoies, compareVoies, applyVoie, RANKING, type Direction, type Voie, type VoieType, type Action, type VoieResult, type FamilyEffect, type DirectedTarget } from './voies';
export { getStyleScale, documentedStyleCodes, SCALE_PARAMETERS, type StyleScale, type FamilyScale, type FamilyStatus } from '../style/scale';
export { valueVerdict, gapVerdict, trackPosition, trackShare, type ValueVerdict, type GapVerdict, type EstimateLike } from '../style/verdict';
