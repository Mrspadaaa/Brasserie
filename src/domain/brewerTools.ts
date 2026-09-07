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
import { equipmentCheck, roPackages } from './brewEquipment';
import { acidCorrectionFromMeasuredPh, ACIDS, MASH_PH_BAND } from './water';
import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import type { RecipeSnapshot, BrewDayState, AcidId } from '../types';

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
  tool(
    'inspect_brewery',
    'Lire recette et IDs ingrédients, matériel, stock disponible, eau, journal horodaté ou fermentation. Les valeurs prévues ne sont pas des relevés.',
    {
      section: str('Section', ['recipe', 'equipment', 'stock', 'water', 'journal', 'fermentation'])
    },
    ['section']
  ),
  tool(
    'calculate_recipe',
    'Calculer OG, FG, IBU, couleur, eau, encombrement et mousse avec les modèles de l’application. Redimensionnement facultatif simulé.',
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
  const r = c.recipe as RecipeSnapshot | undefined;
  const result = (label: string, data: unknown, facts: string[] = [], limits: string[] = []) => ({
    name,
    label,
    data,
    facts,
    limits
  });
  if (name === 'inspect_brewery') {
    const sections: Record<string, unknown> = {
      recipe: r ? { recipe: r, ingredientIds: brewIngredients(r) } : null,
      equipment: { current: c.equipment, recipeEquipment: r?.brewhouse, material: c.material },
      stock: c.inventory,
      water: { plan: r?.waterPlan, sources: c.waterSources },
      journal: { confirmed: c.journal, localNotConfirmed: c.localJournal, now: c.now },
      fermentation: c.batch ?? null
    };
    if (!(String(a.section) in sections)) throw new Error('Section inconnue.');
    return result('Contexte de la brasserie', sections[String(a.section)], [], c.provenance);
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
  if (name === 'calculate_recipe') {
    const rig = r.brewhouse ?? c.equipment;
    const volumeL = number(a, 'volumeL', 0.1, 500, r.volumeL);
    if (volumeL !== r.volumeL && !rig)
      throw new Error('Profil matériel nécessaire au redimensionnement.');
    const recipe =
      volumeL === r.volumeL
        ? r
        : BrewingMath.scaleRecipe({ ...r, id: 'simulation' }, volumeL, rig, rig).scaledRecipe;
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
    const equipment = water
      ? equipmentCheck(rig?.equipment, {
          volumeL,
          grainKg: recipe.totalGristKg,
          mashL: water.mashWaterL,
          spargeL: water.spargeWaterL,
          preBoilHotL: recipe.preBoilHotL
        })
      : null;
    return result(
      'Recette · simulation',
      { volumeL, og, fg, ibu, color, water, equipment },
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
      abv: og && sg ? BrewingMath.calculateABV(og, sg) : null,
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
      'Les bulles ne prouvent ni anomalie ni fin de fermentation. Confirmer la stabilité par plusieurs densités espacées, surtout après houblonnage à cru ; respecter la plage de la souche.'
    ]
  );
}
