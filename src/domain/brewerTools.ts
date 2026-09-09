import { fermentationProposals, fermentationReadiness } from './fermentationPlanning';
import { BrewingMath } from '../services/brewingMath';
import {
  actualWater,
  boilScenario,
  waterScenario,
  thermalEstimate,
  rampExposure,
  wortRescue,
  pitchFeedback
} from './brewAssist';
import {
  brewIngredients,
  effectiveFermentables,
  maltAlternatives,
  boilMinutes
} from './brewCompanion';
import { computeBeerColor } from './beerColor';
import { saccharificationTemp } from './brewPrograms';
export { normalizeRecipe } from './recipeSnapshot';
export { refreshCompanionRecipe } from './brewerRecipeRefresh';
import { refreshCompanionRecipe } from './brewerRecipeRefresh';
export { reconcileRecipeWater, waterRelatedPath } from './recipeWater';
import { replanRecipeWater, recipeWaterSummary } from './recipeWater';
import { equipmentCheck, roPackages } from './brewEquipment';
import { acidCorrectionFromMeasuredPh, ACIDS, MASH_PH_BAND } from './water';
import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import type { Recipe, RecipeSnapshot, BrewDayState, AcidId } from '../types';
import { compareHopTasting, compareHopPredictions, rankHopTriplets, recipeForHopAnalysis, usableHopKnowledge } from '../../functions/src/hopPredictionCore';
import { predictHopRecipe, noloScopedPrediction } from '../../functions/src/hopRecipePrediction';
import { prepareHopRecipeInput } from './hopIndex/recipePrediction';
import { compactHopRecipeEvidence } from './hopIndex/companionPrediction';
import { assertHopTriplet, HopAxis, HopTriplet } from '../../functions/src/hopPredictionSchema';
import { HopRange } from '../../functions/src/hopIndexSchema';
import { searchHopVarieties } from '../../functions/src/hopIndexFacts';
import { hopIndexOverview } from '../../functions/src/hopCompanionContext';
import { activeFermentationScience, fermentationFinalGravity, fermentationLagerRest, fermentationLevers, fermentationProgramWarnings } from '../../functions/src/fermentationScienceCore';
import { FERMENTATION_GOALS, type FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { catalogueMatches } from './yeastCatalogue';
import { fermentationDose } from './fermentationGuide';
import { evaluateFermentationScenario } from './fermentationScenario';
import { evaluateNoloRecipe, noloScience, noloRecipeForBatch, rankNoloStrains, noloWaterModelIssue, noloInput } from './nolo';

const number = (
  a: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
  fallback?: number
): number => {
  const v = a[key] ?? fallback;
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max)
    throw new Error(`${key} : nombre requis entre ${min} et ${max}.`);
  return v;
};
const fmt = (v: number | null | undefined, digits = 1) =>
  v == null ? 'inconnu' : String(Number(v.toFixed(digits)));
const num = (description: string) => ({ type: 'NUMBER', description });
const str = (description: string, values?: string[]) => ({
  type: 'STRING',
  description,
  ...(values ? { enum: values } : {})
});
const bool = (description: string) => ({ type: 'BOOLEAN', description });
const tool = (
  name: string,
  description: string,
  properties: Record<string, unknown> = {},
  required: string[] = []
) => ({ name, description, parameters: { type: 'OBJECT', properties, required } });

export const brewerToolDeclarations = [
  tool('lookup_yeast_reference', 'Rechercher toutes les levures par nom, code, alias ou arôme. Retourne les faits et sources séparés, sans assimiler deux souches ou inventer une caractéristique manquante.', { query: str('Nom, code, arôme ou ID exact') }, ['query']),
  tool('fermentation_advice', 'Conduites documentées par objectif et souche : paliers, leviers qualitatifs, sources, limites, dose et DF en plage. Ne prédit pas une intensité d’ester ou de phénol. Lecture seule ; tout changement de recette passe par propose_changes.', {
    goal: str('Objectif', [...FERMENTATION_GOALS]), yeastId: str('ID exact facultatif ; défaut souche associée à la recette'),
    og: num('DI SG du scénario, facultative ; prévue ou mesurée à distinguer dans la réponse'), sg: num('Densité actuelle corrigée SG, facultative')
  }, ['goal']),
  tool('lookup_hop_reference', 'Rechercher les fiches et COA complets par nom, alias, région ou ID exact. Renvoie chaque source séparément ; aucune fusion de plages.', { query: str('Nom, alias ou ID de variété/lot') }, ['query']),
  tool('predict_hop_aroma', 'Sans triplets explicites, simuler la recette du contexte : ajouts réels, souche unique, paliers, profil global expérimental et chimie disponible. Les plages du cumul sont conditionnelles au modèle, sans couverture statistique des interactions. Avec triplets explicites, classer des alternatives indépendantes ; ne pas les assembler. Aucun chiffre inventé.', {
    triplets: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      varietyId: str('ID exact de variété'), lotId: str('ID exact de lot, facultatif'), yeastId: str('ID exact de levure'), timing: str('Moment biologique', ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation']),
      doseGL: num('Dose g/L'), temperatureC: num('Température °C'), contactHours: num('Contact heures'), matrixId: str('ID de la matrice documentée')
    }, required: ['varietyId', 'yeastId', 'timing', 'doseGL', 'temperatureC', 'contactHours', 'matrixId'] } },
    target: { type: 'ARRAY', items: { type: 'OBJECT', properties: { axisId: str('ID de l’axe'), min: num('Borne basse'), max: num('Borne haute') }, required: ['axisId', 'min', 'max'] } }
  }),
  tool('compare_hop_tasting', 'Comparer une dégustation à sa prédiction figée, avec ses anciennes sources et coefficients.', { tastingId: str('ID exact de dégustation') }, ['tastingId']),
  tool(
    'inspect_brewery',
    'Lire recette et IDs ingrédients, matériel, stock disponible, eau, journal horodaté ou fermentation. Les valeurs prévues ne sont pas des relevés.',
    {
      section: str('Section', ['recipe', 'equipment', 'stock', 'water', 'journal', 'fermentation', 'hopIndex'])
    },
    ['section']
  ),
  tool(
    'calculate_recipe',
    'Calculer la recette actuelle. Avec volumeL, simuler une mise à l’échelle COMPLÈTE : ingrédients ET eau recalculés. Les valeurs ingredients et water du scénario doivent toutes être proposées pour le reproduire ; changer seulement volumeL ne suffit pas. recommendedWater calcule le besoin d’eau, distinct des volumes saisis.',
    { volumeL: num('Volume froid souhaité en fermenteur, L ; facultatif') }
  ),
  tool(
    'simulate_boil',
    'Simuler durée ébullition, ajout de houblon à +N minutes DEPUIS LE DÉBUT, IBU et concentration. Jamais une écriture.',
    {
      minutes: num('Durée totale minutes'),
      hopId: str('ID hop-N dans inspect_brewery'),
      elapsedMin: num('Instant +N depuis début ébullition'),
      evaporationLh: num('Évaporation chaude observée en L/h, facultatif')
    },
    ['minutes']
  ),
  tool(
    'plan_recipe_water',
    'Recalculer ensemble osmosée/réseau, sels et acides de la recette. availableRoL est le stock MAXIMUM total (ex 10 L), pas 10 L dans chaque cuve. Préserve les volumes de brassage et les doses manuelles. Pour appliquer, propose uniquement waterPlan.roLimitL et les autres ENTRÉES voulues : propose_changes ajoute les dépendances automatiquement. Ne recopier ni les pourcentages ni les doses calculées. Avant préparation seulement ; ne remplace pas des sels déjà versés.',
    { availableRoL: num('Litres d’osmosée disponibles au total ; facultatif') }
  ),
  tool(
    'simulate_water',
    'Bilan mélange réel ou hypothétique osmosée/réseau, ions, rattrapage avant traitement, packs disponibles. Empâtage et rinçage séparés.',
    {
      side: str('Compartiment', ['mash', 'sparge']),
      roL: num('Litres osmosée présents dans ce compartiment')
    },
    ['side', 'roL']
  ),
  tool(
    'estimate_temperature',
    'Projection thermique depuis les relevés du journal. Limite du refroidisseur, stagnation, dépassement, exposition de rampe. Ne démarre pas un palier.',
    {
      stepId: str('Étape du journal, défaut étape courante'),
      targetC: num('Consigne °C'),
      coolantC: num('Température eau froide °C, si connue')
    },
    ['targetC']
  ),
  tool(
    'heating_power',
    'Borne basse physique eau seule sans pertes : volume, départ, cible, puissance. Ce n’est PAS une ETA réelle ni une garantie d’ébullition.',
    {
      volumeL: num('Volume réel eau/moût L'),
      fromC: num('Température mesurée °C'),
      targetC: num('Cible °C'),
      watts: num('Puissance électrique disponible W')
    },
    ['volumeL', 'fromC', 'targetC', 'watts']
  ),
  tool(
    'rescue_gravity',
    'Bilan sucre avec paire volume/densité confirmée du journal. Option nouvelle paire explicitement fournie par le brasseur, ramenée à 20°C. Inclut les sucres ajoutés plus tard.',
    {
      stepId: str('Étape concernée'),
      targetOg: num('SG cible, ex1.060'),
      volumeL: num('Nouveau volume L fourni, facultatif'),
      sg: num('Nouvelle densité SG fournie, facultatif'),
      at20C: bool('Le brasseur confirme volume et SG ramenés à20°C')
    },
    ['stepId', 'targetOg']
  ),
  tool(
    'check_ph',
    'Évaluer pH d’empâtage. Aucun dosage à pH bas, sans mesure refroidie fiable ou avec pH-mètre en panne. Correction haute limitée au modèle et concentration exacte confirmée.',
    {
      ph: num('pH mesuré'),
      reliable: bool('Mesure fiable avec étalonnage confirmé'),
      roomTemp: bool('Échantillon refroidi confirmé'),
      acid: str('Acide optionnel', ['lactique', 'phosphorique']),
      concentrationPct: num('Concentration % lue sur le flacon, facultatif')
    },
    ['ph', 'reliable', 'roomTemp']
  ),
  tool(
    'malt_substitutes',
    'Comparer les malts réellement en stock avec le modèle existant ; couleur proche ne garantit pas le même goût.',
    { grainIndex: num('Index du grain 0-based'), amountKg: num('Masse à remplacer kg') },
    ['grainIndex', 'amountKg']
  ),
  tool(
    'fermentation_check',
    'Température vs souche, atténuation apparente, alcool estimé et derniers relevés. Corriger réfractomètre post-fermentation avec OG et Brix bruts si fournis. Ne conclut pas à la fin sur les bulles.',
    {
      tempC: num('Température bière °C si mesurée'),
      og: num('OG mesurée SG'),
      sg: num('Densité actuelle au densimètre SG'),
      brix: num('Brix bruts au réfractomètre ; nécessite OG')
    }
  )
];

export function runBrewerTool(
  name: string,
  a: Record<string, unknown>,
  c: BrewerContext
): Omit<BrewerEvidence, 'id'> {
  if (!brewerToolDeclarations.some((t) => t.name === name)) throw new Error('Outil inconnu.');
  const state: BrewDayState = c.journal ?? { steps: [], currentIndex: 0 };
  const base = c.recipe as RecipeSnapshot | undefined;
  const effective = base && c.batch?.nolo ? { ...base, nolo: c.batch.nolo } : base;
  const r = effective?.nolo?.enabled && c.batch
    ? noloRecipeForBatch({ ...c.batch, recipeSnapshot: effective }) ?? effective : effective;
  const result = (label: string, data: unknown, facts: string[] = [], limits: string[] = []) => ({
    name,
    label,
    data,
    facts,
    limits
  });
  if (name === 'lookup_yeast_reference') {
    if (typeof a.query !== 'string' || !a.query.trim() || a.query.length > 200) throw Error('Nom, code ou arôme de levure requis.');
    if (!c.hopIndex) return result('Référentiel levure non chargé', null, [], ['Données indisponibles.']);
    const yeasts = c.hopIndex.knowledge.filter((k): k is HopYeast => { try { assertHopKnowledge(k); return k.kind === 'yeast'; } catch { return false; } });
    const exact = yeasts.find(k => k.id === a.query);
    const matches = exact ? [exact] : yeasts.filter(y => catalogueMatches(y, a.query as string));
    return result('Références de levures', { yeasts: matches.slice(0, 10), totalMatches: matches.length }, [], [
      'Descripteurs fabricant et analyses ne sont pas une prédiction de la bière. Faits contradictoires conservés séparément. POF, STA1, caractère diastatique et β-lyase distincts.',
      ...c.hopIndex.truncated, ...(matches.length > 10 ? ['Affiner le nom ou choisir un ID exact pour les autres résultats.'] : [])
    ]);
  }
  if (name === 'fermentation_advice') {
    if (!FERMENTATION_GOALS.includes(a.goal as FermentationGoal)) throw Error('Objectif de fermentation requis.');
    if (a.yeastId != null && (typeof a.yeastId !== 'string' || !a.yeastId.trim())) throw Error('Identifiant de levure invalide.');
    if (r?.nolo?.enabled) {
      const knowledge = c.hopIndex?.knowledge ?? [];
      const science = r.nolo.scienceSnapshot ?? noloScience(knowledge);
      const proposed = a.yeastId ? { ...r, yeast: { ...r.yeast, hopIndexId: a.yeastId as string } } : r;
      return result('Conduite NOLO · bilan commun', {
        nolo: evaluateNoloRecipe(proposed, knowledge),
        diagnostics: fermentationReadiness(proposed, knowledge),
        alternatives: science ? fermentationProposals(proposed, knowledge).map(p=>({version:p.version, yeastId:p.id, changes:p.changes, diagnostics:p.diagnostics, processFit:p.processFit, aromaFit:p.aromaFit, targetPlato:p.targetPlato, projection:p.result?.projection, projectionStatus:p.result?.projectionStatus, sources:p.sources, assumptions:p.assumptions, proposedFields:{yeast:p.recipe.yeast,fermentables:p.recipe.fermentables,mash:p.recipe.mash,fermentation:p.recipe.fermentation,waterPlan:p.recipe.waterPlan,carboTarget:p.recipe.carboTarget}})) : [],
        finalGravity: null, lagerRest: null
      }, [], ['Les données des souches et le bilan NOLO remplacent les conseils de bière alcoolisée. Une température ne devient pas un bonus banane ; aucune durée ne valide la fin ou la conservation.']);
    }
    const knowledge = c.hopIndex?.knowledge ?? [], science = activeFermentationScience(knowledge)[0];
    const goal = a.goal as FermentationGoal;
    const guides = knowledge.filter(k => { try { assertHopKnowledge(k); return k.kind === 'fermentation' && k.enabled; } catch { return false; } }).filter(k => k.kind === 'fermentation');
    const yeasts = knowledge.filter((k): k is HopYeast => { try { assertHopKnowledge(k); return k.kind === 'yeast'; } catch { return false; } })
      .map(y => ({ ...y, aliases: [...(guides.find(g => g.yeastId === y.id)?.aliases ?? []), ...(y.catalogue?.aliases ?? [])] }));
    const og = a.og == null ? r?.ogTarget : number(a, 'og', 1.001, 1.3);
    const scenario = r ? evaluateFermentationScenario({ ...r, ogTarget: og,
      yeast: a.yeastId ? { ...r.yeast, hopIndexId: a.yeastId as string } : r.yeast }, yeasts, guides) : undefined;
    const yeastId = (a.yeastId as string | undefined) ?? scenario?.yeast?.id ?? r?.yeast?.hopIndexId;
    const choices = guides.filter(g => (!yeastId || g.yeastId === yeastId) && g.plans.some(p => p.goal === goal));
    const current = guides.find(g => g.yeastId === yeastId);
    const sg = a.sg == null ? undefined : number(a, 'sg', .95, 1.3);
    return result('Conduite fermentaire documentée', {
      goal, yeastId: yeastId ?? null, scienceVersion: science?.version ?? null,
      guides: choices.map(g => ({ ...g, plans: g.plans.filter(p => p.goal === goal) })),
      doses: choices.map(g => ({ yeastId:g.yeastId, volumeL:r?.volumeL??null, estimate:fermentationDose(g,r?.volumeL??0)??null })),
      alternatives: guides.filter(g => g.plans.some(p => p.goal === goal)).map(g => ({ id:g.id, yeastId:g.yeastId, name:g.name, aroma:g.aroma })),
      levers: fermentationLevers(science, goal, yeastId), compounds: science?.compounds ?? [],
      benchmarks: science?.benchmarks.filter(b => b.yeastId === yeastId) ?? [],
      finalGravity: scenario?.fg ?? fermentationFinalGravity(current, og), lagerRest: fermentationLagerRest(science,current,og,sg),
      gravityContext: { og: og ?? null, origin: a.og == null ? 'cible prévue de recette, pas mesure' : 'DI fournie pour ce scénario, statut mesuré à confirmer' },
      programWarnings: scenario?.warnings ?? fermentationProgramWarnings(current, []), scenarioVersion: scenario?.version ?? null
    }, [], [
      'Plages de conduite et durées proposées : confiance faible, pas de couverture statistique ni de garantie de fin. Respecter la fenêtre fabricant et contrôler densité/VDK après le dernier ajout.',
      'Pas de concentration universelle d’ester, phénol, thiol, lactone ou défaut. Le modèle DM303 ne se transfère pas à cette recette.',
      ...(!science ? ['Aide scientifique absente, invalide ou désactivée.'] : []), ...(c.hopIndex?.truncated ?? [])
    ]);
  }
  if (name === 'inspect_brewery') {
    const sections: Record<string, unknown> = {
      recipe: r ? { recipe: r, ingredientIds: brewIngredients(r) } : null,
      equipment: { current: c.equipment, recipeEquipment: r?.brewhouse, material: c.material },
      stock: c.inventory,
      water: { plan: r?.waterPlan, sources: c.waterSources },
      journal: { confirmed: c.journal, localNotConfirmed: c.localJournal, now: c.now },
      fermentation: c.batch ?? null,
      hopIndex: hopIndexOverview(c.hopIndex)
    };
    if (!(String(a.section) in sections)) throw new Error('Section inconnue.');
    return result('Contexte de la brasserie', sections[String(a.section)], [], c.provenance);
  }
  if (name === 'lookup_hop_reference') {
    if (typeof a.query !== 'string' || !a.query.trim() || a.query.length > 200) throw Error('Nom ou identifiant de houblon requis.');
    const index = c.hopIndex;
    if (!index) return result('Index houblon non chargé', null, [], ['Données indisponibles.']);
    const query = a.query.trim(), fold = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
    const terms = fold(query).split(/\s+/);
    const exactLot = index.lots.find(l => l.id === query || l.lotNumber === query);
    const matchingLots = exactLot ? [exactLot] : index.lots.filter(l => !l.archived && terms.every(t => fold([l.name, l.lotNumber, l.growingRegion, l.grower, l.harvestYear].join(' ')).includes(t)));
    const lotVarieties = new Set(matchingLots.map(l => l.varietyId));
    const exact = index.varieties.find(v => v.id === (exactLot?.varietyId ?? query));
    const byName = searchHopVarieties(index.varieties, query);
    const matches = exact ? [exact] : [...new Map([...byName, ...index.varieties.filter(v => lotVarieties.has(v.id))].map(v => [v.id, v])).values()];
    const varieties = matches.slice(0, 10), ids = new Set(varieties.map(v => v.id));
    const lots = matchingLots.length ? matchingLots : index.lots.filter(l => ids.has(l.varietyId));
    return result('Références documentaires et COA', { varieties, lots: lots.slice(0, 20), totalMatches: matches.length, totalLots: lots.length }, [], [
      'Descripteurs documentaires : aucune intensité en bière sans calcul du triplet. Année de publication ≠ année de récolte.',
      ...index.truncated, ...(matches.length > 10 || lots.length > 20 ? ['Résultats limités : préciser le nom ou utiliser un identifiant exact.'] : [])
    ]);
  }
  if (name === 'predict_hop_aroma') {
    const data = c.hopIndex ?? { varieties: [], lots: [], knowledge: [], truncated: [] };
    let triplets: HopTriplet[] = [];
    if (a.triplets != null) {
      if (!Array.isArray(a.triplets) || a.triplets.length > 100) throw Error('Au maximum 100 triplets par calcul.');
      a.triplets.forEach(t => assertHopTriplet(t)); triplets = a.triplets as HopTriplet[];
    }
    let target: Record<string, HopRange> = r?.hopAromaTarget ?? {};
    if (a.target != null) {
      if (!Array.isArray(a.target) || a.target.length > 100) throw Error('Cible invalide.');
      target = Object.fromEntries(a.target.map(t => {
        if (!t || typeof t.axisId !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(t.axisId)) throw Error('Axe cible invalide.');
        return [t.axisId, { min: t.min, max: t.max }];
      }));
    }
    if (a.triplets == null && r) {
      const yeasts = usableHopKnowledge(data.knowledge).valid.filter((k): k is HopYeast => k.kind === 'yeast');
      const prepared = prepareHopRecipeInput(recipeForHopAnalysis(r, c.journal), data.varieties, yeasts);
      return result('Simulation de la recette complète', compactHopRecipeEvidence(predictHopRecipe(prepared.input, target, data)), prepared.proposed, [
        'Plages et confiance obligatoires. Valeur inconnue ≠ zéro. Enveloppe conditionnelle au modèle ; interactions du mélange non quantifiées, aucun taux de couverture statistique.',
        'Références dédupliquées : sourceRef → sourceDictionary ; sourceSetRef → sourceSets → sourceDictionary ; reasonSetRef → reasonSets. Aucune source, raison, année ou valeur numérique n’est supprimée.',
        'Quantités introduites distinctes des concentrations finales en bière ; aucun rendement de conversion inventé.',
        ...(data.truncated.length ? [`Catalogue partiel : ${data.truncated.join(', ')}.`] : [])
      ]);
    }
    const ranked = rankHopTriplets(triplets, target, data);
    return result('Houblon × levure × timing', r?.nolo?.enabled ? ranked.map(noloScopedPrediction).sort(compareHopPredictions) : ranked, [], [
      'Alternatives indépendantes : leurs graphes et scores ne constituent pas un profil de recette. Plages et confiance obligatoires. Valeur inconnue ≠ zéro.',
      ...(data.truncated.length ? [`Catalogue partiel : ${data.truncated.join(', ')}.`] : [])
    ]);
  }
  if (name === 'compare_hop_tasting') {
    const tasting = c.hopIndex?.tastings.find(t => t.id === a.tastingId);
    if (!tasting) return result('Dégustation introuvable', null, [], ['Observation non disponible dans le contexte chargé.']);
    const snapshot = c.hopIndex?.predictions.find(p => p.id === tasting.predictionId);
    return result('Écart aromatique historique', compareHopTasting(tasting, snapshot?.recipePrediction?.overall ?? snapshot?.prediction, snapshot?.evidence.knowledge.filter((k): k is HopAxis => k.kind === 'axis') ?? []), [], [snapshot?.recipePrediction ? 'Programme complet expérimental figé ; bande conditionnelle, interactions non quantifiées.' : 'Prédiction de l’ajout figé.', 'Écart perçu moins prévu, avec les deux marges ; aucune attribution causale automatique.']);
  }
  if (name === 'heating_power') {
    const volume = number(a, 'volumeL', 0.1, 500),
      from = number(a, 'fromC', 0, 100),
      target = number(a, 'targetC', 0, 100),
      watts = number(a, 'watts', 1, 50000);
    if (target <= from) throw new Error('La consigne doit dépasser la température actuelle.');
    const idealMinutes = (volume * 4.186 * (target - from)) / (watts / 1000) / 60;
    return result(
      'Chauffe · minimum théorique',
      { idealMinutes, volumeL: volume, fromC: from, targetC: target, watts },
      [
        `Au moins ${fmt(idealMinutes)} min pour ${volume} L, de ${from} à ${target} °C à ${watts} W.`
      ],
      [
        'Eau seule, aucune perte : la cuve, le grain, la densité et les déperditions rallongent ce minimum. Une puissance trop faible peut ne jamais atteindre la consigne. Ne pas extrapoler l’évaporation depuis la puissance nominale.'
      ]
    );
  }
  if (!r)
    throw new Error(
      'Recette manquante pour ce lot : demander les données utiles sans les inventer.'
    );
  if (name === 'plan_recipe_water') {
    if (!r.waterPlan) throw Error('Plan d’eau manquant.');
    if (
      c.journal?.startedAt ||
      Object.values(c.journal?.additions ?? {}).some((v: any) => v.doneAt)
    )
      throw Error(
        'Brassage commencé : utiliser simulate_water pour les quantités réelles et les ajouts déjà versés.'
      );
    const recipe = { ...structuredClone(r), id: 'simulation' };
    if (a.availableRoL != null) recipe.waterPlan.roLimitL = number(a, 'availableRoL', 0, 1000);
    if (!recipe.waterPlan.sourceSnapshot)
      recipe.waterPlan.sourceSnapshot = c.waterSources.find(
        (s) => s.id === recipe.waterPlan.sourceId
      );
    const { plan, warnings } = replanRecipeWater(recipe);
    recipe.waterPlan = plan;
    return result(
      'Eau · plan complet recalculé',
      { plan, ...recipeWaterSummary(recipe) },
      [
        'Volumes totaux conservés, osmosée limitée au stock indiqué, sels et acides recalculés par le solveur.'
      ],
      [
        ...warnings,
        'Prévision avant traitement. Le pH estimé n’est pas une mesure ; contrôler sur échantillon refroidi.'
      ]
    );
  }
  if (name === 'calculate_recipe') {
    const rig = r.brewhouse ?? c.equipment;
    const volumeL = number(a, 'volumeL', 0.1, 500, r.volumeL);
    if (volumeL !== r.volumeL && !rig && !r.nolo?.enabled)
      throw new Error('Profil matériel nécessaire au redimensionnement.');
    const scaled = volumeL !== r.volumeL;
    if (r.nolo?.enabled) {
      // A physical blend/dilution is an ordered NOLO operation. Scaling an already
      // measured beer as if it were a fresh grist would silently reuse its assay.
      const secondRunnings = r.nolo.process === 'secondRunnings';
      const scenario = { ...r, volumeL,
        nolo: scaled && secondRunnings && r.nolo.secondRunnings
          ? { ...r.nolo, secondRunnings: { ...r.nolo.secondRunnings, recoveredL: volumeL } } : r.nolo };
      return result('Recette NOLO · bilan commun', {
        volumeL, nolo: evaluateNoloRecipe(scenario, c.hopIndex?.knowledge ?? []),
        og: secondRunnings ? r.nolo.secondRunnings?.sg ?? null : r.ogTarget ?? null,
        fg: null, abv: null, recommendedWater: null,
        waterSummary: secondRunnings ? null : recipeWaterSummary(scenario),
        ingredients: { fermentables: r.fermentables, hops: r.hops, yeast: r.yeast }
      }, [], [
        'OG prévue ou mesurée sur le moût récupéré ; alcool et sucres évalués par le même bilan que l’écran NOLO.',
        ...(scaled ? ['Volume hypothétique seulement, ingrédients non redimensionnés. Décrire une dilution ou un assemblage dans les opérations NOLO ; les anciennes analyses ne valident pas ce nouveau scénario.'] : [])
      ]);
    }
    let scenario: Recipe = { ...structuredClone(r), id: 'simulation' };
    if (scaled) {
      const sizing = BrewingMath.scaleRecipe({ ...r, id: 'simulation' }, volumeL, rig, rig);
      scenario = sizing.scaledRecipe;
      // scaleRecipe returns its water volumes separately from scaledRecipe.
      // Keeping the old waterPlan here produced contradictory capacity checks.
      if (scenario.waterPlan)
        scenario.waterPlan = {
          ...scenario.waterPlan,
          mashWaterL: sizing.mashWaterL,
          spargeWaterL: sizing.spargeWaterL
        };
    }
    const recipe = refreshCompanionRecipe(scenario);
    const efficiency = recipe.efficiencyPct ?? rig?.efficiencyPct;
    const og =
      efficiency != null ? BrewingMath.calculateOg(recipe.fermentables, volumeL, efficiency) : null;
    const extract =
      efficiency != null
        ? BrewingMath.extractPoints(recipe.fermentables, volumeL, efficiency)
        : null;
    const mashTemp = saccharificationTemp(recipe.mash?.steps ?? []);
    const attenuation = recipe.yeast?.attenuationPct;
    const predictedAttenuation =
      attenuation && mashTemp
        ? BrewingMath.attenuationForMashTemp(attenuation, mashTemp)
        : attenuation;
    const fg =
      og != null && predictedAttenuation != null
        ? BrewingMath.calculateFg(og, predictedAttenuation, extract?.unfermentable)
        : null;
    const ibu =
      og && recipe.hops.every((h) => h.alpha > 0 || h.stage === 'dryHop')
        ? BrewingMath.calculateTinsethIBU(recipe.hops, volumeL, og, recipe.boilMin)
        : null;
    const color = computeBeerColor(recipe.fermentables, volumeL);
    const water = recipe.waterPlan;
    const recommendedWater = rig
      ? BrewingMath.waterVolumes(
          recipe.totalGristKg,
          volumeL,
          rig,
          recipe.mash?.spargeType ?? 'batch',
          recipe.boilMin,
          recipe.hops.filter((h) => h.stage !== 'dryHop').reduce((sum, h) => sum + h.weightG, 0)
        )
      : null;
    const preBoilL =
      water && rig?.equipment
        ? water.mashWaterL +
          water.spargeWaterL -
          recipe.totalGristKg * rig.equipment.grainAbsorptionLPerKg
        : recipe.preBoilL;
    const preBoilHotL =
      preBoilL != null && rig?.equipment
        ? preBoilL / (1 - rig.equipment.coolingShrinkagePct / 100)
        : recipe.preBoilHotL;
    const equipment = water
      ? equipmentCheck(rig?.equipment, {
          volumeL,
          grainKg: recipe.totalGristKg,
          mashL: water.mashWaterL,
          spargeL: water.spargeWaterL,
          preBoilHotL
        })
      : null;
    return result(
      'Recette · simulation',
      {
        scenario: scaled ? 'scaled_recipe' : 'current_recipe',
        volumeL,
        og,
        fg,
        ibu,
        color,
        water,
        waterSummary: recipeWaterSummary(recipe),
        equipment,
        recommendedWater,
        ingredients: { fermentables: recipe.fermentables, hops: recipe.hops, yeast: recipe.yeast },
        preBoilL,
        preBoilHotL
      },
      [
        `${volumeL} L · OG ${fmt(og, 3)} · FG ${fmt(fg, 3)} · ${fmt(ibu, 0)} IBU · ${fmt(color?.ebc)} EBC`,
        ...(equipment
          ? [
              `Cuve à l’empâtage : ${equipment.occupiedL} L · espace libre fermenteur : ${equipment.headspaceL} L.`
            ]
          : [])
      ],
      [
        'Valeurs prévisionnelles, pas des relevés. Limite utile de cuve provisoire si workingVolumeConfirmed=false.',
        'recommendedWater est un calcul de besoin, pas une quantité déjà saisie ou versée. Le preview reflète les doses proposées ; propose_changes recalcule le traitement si les entrées d’eau changent ou si autoTreatment est actif.',
        ...(scaled
          ? [
              'Ce scénario redimensionne les ingrédients et l’eau ensemble ; aucune modification du formulaire.'
            ]
          : []),
        ...(equipment &&
        (equipment.mashTooFull || equipment.boilTooFull || equipment.fermenterTooFull)
          ? [
              'Ce volume dépasse une limite du matériel : réduire ou répartir dans du matériel adapté.'
            ]
          : [])
      ]
    );
  }
  if (name === 'simulate_boil') {
    const minutes = number(a, 'minutes', 1, 480);
    const hopId = typeof a.hopId === 'string' ? a.hopId : undefined;
    if (hopId && !r.hops.some((_, i) => `hop-${i}` === hopId))
      throw new Error('Houblon inconnu : utiliser inspect_brewery.');
    if ((hopId == null) !== (a.elapsedMin == null))
      throw new Error('Fournir hopId et elapsedMin ensemble.');
    const v = boilScenario(
      r,
      state,
      minutes,
      hopId,
      hopId ? number(a, 'elapsedMin', 0, minutes) : undefined,
      a.evaporationLh == null ? undefined : number(a, 'evaporationLh', 0, 50)
    );
    return result(
      'Ébullition · simulation',
      v,
      [
        `${minutes} min au total${hopId ? ` · ${hopId} ajouté à +${a.elapsedMin} min` : ''}`,
        `Volume projeté ${fmt(v?.finalL)} L · SG ${fmt(v?.finalOg, 3)}`
      ],
      [
        'Le signe + désigne le temps depuis le début. IBU estimés, aucun chiffrage précis du goût ou de la couleur.',
        ...(v?.needsVolume
          ? ['Volume et densité pré-ébullition appariés manquants : concentration non calculable.']
          : [])
      ]
    );
  }
  if (name === 'simulate_water') {
    if (a.side !== 'mash' && a.side !== 'sparge') throw new Error('Choisir mash ou sparge.');
    const roL = number(a, 'roL', 0, 500),
      v = waterScenario(r, state, a.side, roL);
    if (!v) throw new Error('Plan eau absent ou osmosée supérieure au volume du compartiment.');
    return result(
      'Eau · simulation',
      { ...v, packs: roPackages(roL, c.equipment?.equipment?.roPackL ?? 5) },
      [
        `${fmt(v.roL)} L osmosée + ${fmt(v.tapL)} L réseau · ${fmt(v.actualPct)} % osmosée`,
        v.message
      ],
      [
        'Les ions sont estimés. Une correction du mélange ne retire pas les sels déjà ajoutés.',
        ...(v.treated || v.grainIn
          ? [
              'Eau traitée ou grain déjà introduit : ne pas appliquer le remplacement d’eau théorique.'
            ]
          : [])
      ]
    );
  }
  if (name === 'estimate_temperature') {
    const step =
      state.steps.find((s) => s.id === a.stepId) ??
      (a.stepId == null ? state.steps[state.currentIndex] : undefined);
    if (!step) throw new Error('Étape absente du journal.');
    const target = number(a, 'targetC', 0, 100),
      v = thermalEstimate(
        state,
        step,
        target,
        c.now,
        a.coolantC == null ? state.coolingWaterC : number(a, 'coolantC', 0, 100),
        r.mash?.heatingRateCPerMin
      );
    return result(
      'Température · projection',
      { ...v, ramp: rampExposure(state, step) },
      [
        v.message,
        ...('minutes' in v && v.minutes != null ? [`Projection : ${fmt(v.minutes)} min.`] : [])
      ],
      [
        'Une projection ne confirme pas la consigne ; remesurer. Rampe séparée du maintien, pas de raccourcissement automatique ni atténuation exacte déduite.'
      ]
    );
  }
  if (name === 'rescue_gravity') {
    const stepId = String(a.stepId),
      target = number(a, 'targetOg', 1.001, 1.3);
    let s = state;
    if (a.volumeL != null || a.sg != null) {
      if (a.at20C !== true) throw new Error('Confirmer volume et SG ramenés à20°C.');
      s = {
        ...state,
        readings: [
          ...(state.readings ?? []),
          { at: c.now, kind: 'volume', stepId, value: number(a, 'volumeL', 0.1, 500), unit: 'L' },
          { at: c.now, kind: 'densite', stepId, value: number(a, 'sg', 1, 1.3), unit: 'SG' }
        ]
      };
    }
    const v = wortRescue(s, stepId, target, r);
    return result(
      'Densité · bilan sucre',
      v,
      v ? [`Volume final théorique à ${target} : ${fmt(v.targetL)} L.`, v.message] : [],
      [
        'Paire récente au même stade nécessaire ; données de conversation simulées sans écriture. Vérifier les limites de cuve avant tout appoint.'
      ]
    );
  }
  if (name === 'check_ph') {
    const ph = number(a, 'ph', 0, 14);
    const noloWaterIssue = noloWaterModelIssue(r.nolo, noloInput(r).mashRatioLKg ?? 0);
    if (noloWaterIssue) return result('pH · mesure hors domaine du modèle', { ph, correction: null }, [], [noloWaterIssue]);
    if (!/mash|empât|sacchar|mais[c]?he/i.test(c.phase))
      return result(
        'pH · stade à préciser',
        { ph },
        [],
        [
          'Cet outil corrige uniquement la maische pendant l’empâtage. Ne pas appliquer la plage ni les doses d’empâtage à l’eau seule, au moût bouillant ou à une bière en fermentation. Préciser le stade et la nature de l’échantillon.'
        ]
      );
    const reliable = a.reliable === true && a.roomTemp === true;
    const band = MASH_PH_BAND;
    const facts = [
      `pH annoncé ${ph} · plage modèle ${band.min}–${band.max} sur échantillon refroidi.`
    ];
    if (!reliable)
      return result('pH · mesure à confirmer', { ph, reliable: false }, facts, [
        'Aucun dosage. Refroidir, homogénéiser, vérifier électrode et tampons. ATC corrige l’électrode, pas la variation chimique du pH avec la température.'
      ]);
    if (ph <= band.max)
      return result('pH · mesure', { ph, reliable: true, low: ph < band.min }, facts, [
        ph < band.min
          ? 'Ne pas ajouter d’acide. Pas de dose de base calculable sans capacité tampon ni essai contrôlé sur échantillon. L’eau de rinçage ne garantit pas le rattrapage.'
          : 'Pas de correction acide nécessaire dans la plage du modèle.'
      ]);
    const acid = a.acid as AcidId;
    const expected = acid === 'lactique' ? 80 : acid === 'phosphorique' ? 75 : undefined;
    if (!expected || a.concentrationPct !== expected)
      return result('pH · correction à préparer', { ph }, facts, [
        'Confirmer l’acide et sa concentration : modèle lactique80% ou phosphorique75%. Ne pas remplacer ces concentrations arbitrairement.'
      ]);
    const water = actualWater(r, state, 'mash').litres,
      grain = effectiveFermentables(r, state)
        .filter((f) => f.kind === 'grain')
        .reduce((s, f) => s + f.weightKg, 0);
    const correction = acidCorrectionFromMeasuredPh(ph, water, grain ? water / grain : 0, acid);
    return result('pH · estimation de correction', { ph, correction, acid: ACIDS[acid] }, facts, [
      'Modèle de tampon approximatif : préférer un essai sur échantillon, fractionner et remesurer après homogénéisation ; ne pas verser toute la dose estimée. Les ajouts déjà effectués doivent être consignés.'
    ]);
  }
  if (name === 'malt_substitutes') {
    const index = number(a, 'grainIndex', 0, r.fermentables.length - 1),
      kg = number(a, 'amountKg', 0.001, 100);
    if (!Number.isInteger(index)) throw new Error('Index entier requis.');
    return result(
      'Malts disponibles',
      maltAlternatives(r.fermentables[index], kg, c.inventory),
      [],
      [
        'Équivalence de couleur/extrait seulement ; vérifier fonction du malt, goût et disponibilité avant modification.'
      ]
    );
  }
  const og = a.og == null ? Number(c.batch?.og) || undefined : number(a, 'og', 1.001, 1.3);
  let sg = a.sg == null ? undefined : number(a, 'sg', 0.98, 1.3);
  if (a.brix != null) {
    if (!og) throw new Error('OG mesurée nécessaire pour corriger le réfractomètre.');
    sg = BrewingMath.calculateSeanTerrillRefractometer(og, number(a, 'brix', 0, 40));
  }
  const temp = a.tempC == null ? undefined : number(a, 'tempC', 0, 60);
  return result(
    'Fermentation · contrôle',
    {
      og,
      sg,
      apparentAttenuationPct: og && sg ? (100 * (og - sg)) / (og - 1) : null,
      abv: !r.nolo?.enabled && og && sg ? BrewingMath.calculateABV(og, sg) : null,
      ...(r.nolo?.enabled ? { nolo: evaluateNoloRecipe(r, c.hopIndex?.knowledge ?? []) } : {}),
      pitch: temp != null ? pitchFeedback(r, temp) : null,
      log: c.batch?.gravityLog ?? []
    },
    [
      ...(sg != null
        ? [
            `Densité ${a.brix != null ? 'corrigée réfractomètre' : 'au densimètre'} : ${fmt(sg, 3)} SG.`
          ]
        : [])
    ],
    [
      ...(r.nolo?.enabled ? ['NOLO : une différence de densités ne remplace pas une analyse d’alcool adaptée aux faibles teneurs.'] : []),
      'Les bulles ne prouvent ni anomalie ni fin de fermentation. Confirmer la stabilité par plusieurs densités espacées, surtout après houblonnage à cru ; respecter la plage de la souche.'
    ]
  );
}
