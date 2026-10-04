import { hopMeasurementError, type HopMeasurement, type HopSource } from '../../../functions/src/hopIndexSchema';

/** Context states deliberately do not encode a strain name, aroma target or recipe default. */
export type FermentationState = 'active' | 'finished' | 'noViableYeast' | 'unknown';
export type HopAdditionKind = 'mash' | 'boil' | 'whirlpool' | 'fermentation' | 'dryHop' | 'postFermentation' | 'other' | 'unknown';
export type HopAdditionState = 'planned' | 'completed' | 'unknown';
export type HopDocumentaryActivity = 'positive' | 'negative' | 'unknown';
export type HopQualitativeEvidence = 'documented' | 'notDetected' | 'unknown';
export type HopDecisionStage = 'fermentation' | 'conditioning' | 'packaged' | 'other' | 'unknown';

export interface HopAdditionContext {
  kind: HopAdditionKind;
  state: HopAdditionState;
  contactHours?: number | null;
  temperatureC?: number | null;
}

export interface HopBiotransformationInput {
  /** Presentation metadata only. It never selects a rule or a scientific coefficient. */
  subjectLabel?: string;
  /** Selected hop material measurements; their units, bases, kind and provenance stay intact. */
  hopMeasurements?: readonly HopMeasurement[];
  /** Documentary activity for the selected yeast. Positive/negative is not a beer yield. */
  yeast?: { betaLyase?: HopDocumentaryActivity; source?: HopSource };
  fermentation?: { state?: FermentationState; temperatureC?: number | null };
  additions?: readonly HopAdditionContext[];
  stage?: HopDecisionStage;
  /** Qualitative assessment of the material, not a variety-wide property. */
  hopDextrinEnzymeActivity?: HopDocumentaryActivity;
  hopDextrinEnzymeSource?: HopSource;
  fermentableDextrins?: HopQualitativeEvidence;
  fermentableDextrinsSource?: HopSource;
  /** Hop geraniol conjugates are not represented by the current HopAnalyte catalogue. */
  geraniolPrecursorEvidence?: HopQualitativeEvidence;
  geraniolPrecursorSource?: HopSource;
}

export interface HopBiotransformationSource {
  id: string;
  citation: HopSource;
  /** Set only for a primary source actually checked during this implementation. */
  checkedOn?: '2026-09-30';
  /** Experimental scope retained beside every source-backed mechanism. */
  scope: string;
  limitation: string;
}

export type MechanismStatus = 'contextuallyRelevant' | 'conditional' | 'unknown' | 'notCurrentlyActive';
export type HopMechanismId = 'thiolRelease' | 'geraniolToCitronellol' | 'fermentationAroma' | 'hopCreep';

export interface HopMechanismFinding {
  id: HopMechanismId;
  title: string;
  /** Relevance of investigating this pathway in the supplied context, never its yield. */
  status: MechanismStatus;
  statusMeaning: string;
  statement: string;
  reasons: string[];
  conditions: string[];
  unknownsThatCouldChangeDecision: string[];
  alternativesWithoutBiotransformation: string[];
  evidence: HopBiotransformationSource[];
  suppliedMeasurements: HopMeasurement[];
  /** Keeps the documentary observation distinct from mechanism relevance and output. */
  yeastBetaLyaseActivity?: HopDocumentaryActivity;
  /** Present only on the separate hop-creep finding. */
  refermentationContext?: 'possibleInThisContext' | 'notCurrentWithoutViableYeast' | 'unknown';
}

export interface HopBiotransformationComparisonPlan {
  scope: 'futureOrPairedTrial' | 'existingSamplesOrFutureTrial';
  question: string;
  keepComparable: string[];
  compare: string[];
  record: string[];
  limit: string;
}

export interface HopBiotransformationAssessment {
  schemaVersion: 'hop-biotransformation-v1';
  subjectLabel?: string;
  findings: HopMechanismFinding[];
  alternativesWithoutBiotransformation: string[];
  comparisonPlan: HopBiotransformationComparisonPlan;
  limits: string[];
}

const citations: Record<string, HopBiotransformationSource> = {
  samia2024: {
    id: 'samia-2024-thiol-fermentation',
    citation: {
      title: 'Fermentation temperature impacts polyfunctional thiol biotransformation in beer',
      author: 'Samia, Shayevitz, Fischborn et Shellhammer', year: 2024, kind: 'research',
      reference: 'https://brewingscience.de/index.php/brewingscience/article/view/241',
      locator: 'BrewingScience 77(7/8), publié le 29 août 2024 ; protocole et résultats p. 1–2.',
    },
    checkedOn: '2026-09-30',
    scope: 'Essais pilote pale ale 1,4 hL ; Cascade au début de l’ébullition et au whirlpool, sans dry-hop ; cinq levures commerciales et fermentations à 15, 22 et 30 °C ; analyse chimique et panel descriptif de 22 personnes.',
    limitation: 'Un houblon, une matrice et les conditions de cet essai. Les teneurs les plus élevées de 3SH chez Diamond ne donnaient pas le caractère fruité/tropical le plus élevé ; aucune température, souche ou réponse sensorielle n’est transférée comme règle générale.',
  },
  michel2019: {
    id: 'michel-2019-yeast-beta-lyase',
    citation: {
      title: 'Screening of brewing yeast β-lyase activity and release of hop volatile thiols from precursors during fermentation',
      author: 'Michel et al.', year: 2019, kind: 'research',
      reference: 'https://brewingscience.de/index.php/brewingscience/article/download/255/163',
      locator: 'BrewingScience 72(11/12), p. 179–186 ; résumé, méthodes et résultats du criblage.',
    },
    checkedOn: '2026-09-30',
    scope: '148 souches de trois espèces criblées ; fermentations de bière ensuite conduites avec six souches et mesures de 3MH et 4MMP.',
    limitation: 'Le milieu de criblage avait une faible valeur prédictive de l’activité ; les réponses variaient avec la souche. L’étude ne fournit pas de conversion universelle entre activité β-lyase et concentration ou perception en bière.',
  },
  samia2025: {
    id: 'samia-2025-nitrogen-strain-thiols',
    citation: {
      title: 'Wort Nitrogen and Yeast Strain Drive Thiol Release, Flavor Expression, and Fermentation Performance in Beer',
      author: 'Samia, Shayevitz, Fischborn et Shellhammer', year: 2025, kind: 'research',
      reference: 'https://doi.org/10.1080/03610470.2025.2530859',
      locator: 'Journal of the American Society of Brewing Chemists 83(4), p. 429–441 ; cinq souches, trois niveaux FAN, souche Verdant avec IRC7 désactivé.',
    },
    checkedOn: '2026-09-30',
    scope: 'Fermentations pilote avec Cascade ; essais de souches et d’azote FAN dans les conditions publiées.',
    limitation: 'Une étude de souche, de moût et de houblon déterminés : elle montre des dépendances et une activité thiol maintenue dans la souche IRC7 knockout, sans établir le mécanisme ni le rendement d’une levure donnée hors de cet essai.',
  },
  takoi2017: {
    id: 'takoi-2017-monoterpene-fermentation',
    citation: {
      title: 'Systematic Analysis of Behaviour of Hop-Derived Monoterpene Alcohols During Fermentation and New Classification of Geraniol-Rich Flavour Hops',
      author: 'Takoi et al.', year: 2017, kind: 'research',
      reference: 'https://brewingscience.de/index.php/brewingscience/article/download/332/238',
      locator: 'BrewingScience 70, p. 177–190 ; méthodes et figures sur 42 matières houblonnées.',
    },
    checkedOn: '2026-09-30',
    scope: '42 variétés comparées en houblonnage tardif pilote (0,8 g/L) puis fermentation lager à 10–12 °C ; linalol, géraniol, β-citronellol et autres monoterpènes suivis.',
    limitation: 'Le comportement variait entre échantillons et profils de précurseurs. Les valeurs, noms de variétés, dose et calendrier de cet essai ne sont pas des coefficients pour un lot ou procédé courant.',
  },
  kirkpatrick2018: {
    id: 'kirkpatrick-2018-hop-creep',
    citation: {
      title: 'A Cultivar-Based Screening of Hops for Dextrin Degrading Enzymatic Potential',
      author: 'Kirkpatrick et Shellhammer', year: 2018, kind: 'research',
      reference: 'https://doi.org/10.1080/03610470.2018.1546091',
      locator: 'Journal of the American Society of Brewing Chemists 76(4), p. 247–256 ; publié en ligne le 22 janvier 2019.',
    },
    checkedOn: '2026-09-30',
    scope: 'Criblage d’enzymes et mesure de dégradation de dextrines/sucres dans des bières dry-hopped avec 30 cultivars.',
    limitation: 'Les différences ne prédisent pas l’activité du lot présent ; pratiques de culture, récolte, traitement et âge demandaient plus d’étude. Pas de délai ou seuil de stabilisation universel.',
  },
};

const statusMeaning: Record<MechanismStatus, string> = {
  contextuallyRelevant: 'Les propriétés fournies concordent avec une voie documentée dans une étude ; cela ne confirme ni rendement, concentration finale ni perception.',
  conditional: 'Une voie est documentée, mais au moins une condition ou une observation qui changerait sa pertinence reste manquante ou discordante.',
  unknown: 'Les données fournies ne permettent pas de décider si cette voie est pertinente ; absence de mesure ne signifie ni zéro ni impossibilité.',
  notCurrentlyActive: 'L’état déclaré exclut une transformation métabolique en cours par des cellules de levure viables ; il ne retire pas les composés déjà formés et ne nie pas les autres transformations.',
};

type SignalState = 'reportedPositive' | 'reportedZero' | 'belowLimit' | 'intervalIncludesZero' | 'unclassified' | 'unreported' | 'mixedReports';
type MeasurementSignalState = Exclude<SignalState, 'unreported' | 'mixedReports'>;
interface MeasurementSignal {
  measurement: HopMeasurement;
  state: MeasurementSignalState;
  validationError?: string;
}
interface SignalSummary {
  state: SignalState;
  entries: MeasurementSignal[];
  conflictingAnalytes: HopMeasurement['analyte'][];
  incomparableAnalytes: HopMeasurement['analyte'][];
}

const thiolPrecursors = new Set<HopMeasurement['analyte']>(['3mhCys', '3mhGsh', '3mhGluCys', '3mhCysGly', '4mmpCys', '4mmpGsh']);
const freeThiols = new Set<HopMeasurement['analyte']>(['3mhFree', '3mhaFree', '4mmpFree', '3s4mpFree']);
const terpeneAnalytes = new Set<HopMeasurement['analyte']>(['geraniol', 'citronellol']);
const geraniolAnalyte = new Set<HopMeasurement['analyte']>(['geraniol']);
const citronellolAnalyte = new Set<HopMeasurement['analyte']>(['citronellol']);

function signalOf(measurements: readonly HopMeasurement[], analytes: ReadonlySet<HopMeasurement['analyte']>): SignalSummary {
  const selected = measurements.filter(measurement => analytes.has(measurement.analyte));
  if (selected.length === 0) return { state: 'unreported', entries: [], conflictingAnalytes: [], incomparableAnalytes: [] };
  const entries: MeasurementSignal[] = selected.map(measurement => {
    const validationError = hopMeasurementError(measurement);
    if (validationError) return { measurement, state: 'unclassified', validationError };
    if (measurement.kind === 'below') return { measurement, state: 'belowLimit' };
    if (measurement.kind === 'unknown') return { measurement, state: 'unclassified' };
    if (measurement.kind === 'point') {
      return { measurement, state: measurement.value! > 0 ? 'reportedPositive' : 'reportedZero' };
    }
    if (measurement.kind === 'range' && measurement.range) {
      if (measurement.range.min > 0) return { measurement, state: 'reportedPositive' };
      if (measurement.range.max === 0) return { measurement, state: 'reportedZero' };
      return { measurement, state: 'intervalIncludesZero' };
    }
    return { measurement, state: 'unclassified' };
  });

  // A positive Cys-3MH and a zero Cys-4MMP concern different molecules. Only
  // measurements of the same analyte in a comparable unit/base/method can
  // contradict one another.
  const comparisonGroups = new Map<string, MeasurementSignal[]>();
  const analyteScopes = new Map<HopMeasurement['analyte'], Set<string>>();
  for (const entry of entries) {
    if (entry.validationError) continue;
    const { analyte, unit, basis, method } = entry.measurement;
    const scope = JSON.stringify([analyte, unit, basis, method ?? null]);
    const group = comparisonGroups.get(scope) ?? [];
    group.push(entry);
    comparisonGroups.set(scope, group);
    const scopes = analyteScopes.get(analyte) ?? new Set<string>();
    scopes.add(scope);
    analyteScopes.set(analyte, scopes);
  }
  const conflictingAnalytes = [...new Set([...comparisonGroups.values()].filter(group =>
    group.some(entry => entry.state === 'reportedPositive') && group.some(entry => entry.state === 'reportedZero'))
    .map(group => group[0].measurement.analyte))];
  const incomparableAnalytes = [...analyteScopes.entries()].filter(([, scopes]) => scopes.size > 1).map(([analyte]) => analyte);
  let state: SignalState;
  if (conflictingAnalytes.length) state = 'mixedReports';
  else if (entries.some(entry => entry.state === 'reportedPositive')) state = 'reportedPositive';
  else if (entries.every(entry => entry.state === 'reportedZero')) state = 'reportedZero';
  else if (entries.some(entry => entry.state === 'belowLimit')) state = 'belowLimit';
  else if (entries.some(entry => entry.state === 'intervalIncludesZero')) state = 'intervalIncludesZero';
  else state = 'unclassified';
  return { state, entries, conflictingAnalytes, incomparableAnalytes };
}

function measurementReason(label: string, summary: SignalSummary): string {
  if (summary.state === 'unreported') return `${label} : aucune mesure fournie ; cela signifie inconnu, pas zéro.`;
  const detail = summary.entries.map(({ measurement, state, validationError }) => {
    const context = `${measurement.analyte} (${measurement.unit}, base ${measurement.basis}${measurement.method ? `, méthode ${measurement.method}` : ''})`;
    if (validationError) return `${context} : mesure invalide pour le schéma (${validationError}) ; aucune présence ou absence n’est déduite`;
    switch (state) {
      case 'reportedPositive': return `${context} : présence mesurée${measurement.kind === 'point' ? ` (${measurement.value})` : ` [${measurement.range?.min}, ${measurement.range?.max}]`}`;
      case 'reportedZero': return `${context} : valeur rapportée à zéro ; cela ne prouve pas l’absence générale de ce précurseur ou de voie`;
      case 'belowLimit': return measurement.limit == null
        ? `${context} : non-détection sous une limite non précisée`
        : `${context} : sous ${measurement.limit} (${measurement.limitKind ?? 'limite'}) ; non-détection non assimilée à une absence`;
      case 'intervalIncludesZero': return `${context} : intervalle [${measurement.range?.min}, ${measurement.range?.max}] incluant zéro ; présence non confirmée`;
      case 'unclassified': return `${context} : nature de la mesure inconnue ; aucune présence ou absence n’est déduite`;
    }
  });
  const conflicts = summary.conflictingAnalytes.length
    ? ` Contradiction non résolue pour le même analyte, unité, base et méthode : ${summary.conflictingAnalytes.join(', ')} ; aucune moyenne n’est faite.` : '';
  const incomparable = summary.incomparableAnalytes.length
    ? ` Rapports de ${summary.incomparableAnalytes.join(', ')} avec unités, bases ou méthodes différentes : conservés séparément, pas traités comme contradictoires.` : '';
  return `${label} : ${detail.join(' ; ')}.${conflicts}${incomparable}`;
}

function sourceIfPresent(source: HopSource | undefined, id: string): HopBiotransformationSource[] {
  if (!source) return [];
  return [{
    id, citation: source,
    scope: 'Source documentaire fournie avec le constat d’entrée par l’appelant.',
    limitation: 'Ce module ne revérifie pas la pièce transmise ; un constat documentaire ne prouve pas un rendement dans la bière ni une perception.',
  }];
}

function additionDescriptions(additions: readonly HopAdditionContext[] | undefined): string[] {
  if (!additions) return ['Le programme d’ajouts n’est pas fourni.'];
  if (additions.length === 0) return ['Aucun ajout n’est inscrit dans le programme fourni.'];
  return additions.map((addition, index) => {
    const details = [
      addition.state === 'unknown' ? 'état de réalisation inconnu' : addition.state === 'planned' ? 'prévu' : 'réalisé',
      Number.isFinite(addition.contactHours) ? `contact déclaré ${addition.contactHours} h` : undefined,
      Number.isFinite(addition.temperatureC) ? `température déclarée ${addition.temperatureC} °C` : undefined,
    ].filter((value): value is string => !!value);
    return `Ajout ${index + 1} (${addition.kind}) : ${details.join(', ')}. Ces valeurs décrivent le contexte fourni, sans seuil de conversion.`;
  });
}

function makeFinding(args: Omit<HopMechanismFinding, 'statusMeaning'>): HopMechanismFinding {
  return { ...args, statusMeaning: statusMeaning[args.status] };
}

function thiolFinding(input: HopBiotransformationInput): HopMechanismFinding {
  const measurements = input.hopMeasurements ?? [];
  const precursorSignal = signalOf(measurements, thiolPrecursors);
  const freeSignal = signalOf(measurements, freeThiols);
  const state = input.fermentation?.state ?? 'unknown';
  const betaLyase = input.yeast?.betaLyase ?? 'unknown';
  const reasons = [
    measurementReason('Précurseurs thiolés du houblon', precursorSignal),
    measurementReason('Thiols libres du houblon', freeSignal),
    `β-lyase de la levure : ${betaLyase === 'unknown' ? 'inconnue' : betaLyase === 'positive' ? 'activité déclarée positive' : 'activité déclarée négative'} ; cette propriété documentaire n’est pas une mesure de rendement.`,
    ...additionDescriptions(input.additions),
  ];
  let status: MechanismStatus;
  if (state === 'noViableYeast') status = 'notCurrentlyActive';
  else if (state === 'active' && precursorSignal.state === 'reportedPositive' && betaLyase === 'positive') status = 'contextuallyRelevant';
  else if (state === 'active' && (precursorSignal.state === 'reportedPositive' || precursorSignal.state === 'mixedReports' || betaLyase !== 'unknown')) status = 'conditional';
  else status = 'unknown';
  const unknowns = [
    ...(precursorSignal.state !== 'reportedPositive' ? ['Présence et quantité des conjugués de cette matière, avec leur méthode, unité et base.'] : []),
    ...(state !== 'active' ? ['Activité et viabilité de la levure au moment pertinent ; « terminé » ne confirme pas l’absence de cellules viables.'] : []),
    ...(betaLyase !== 'positive' ? ['Activité de la souche sur ces précurseurs dans cette matrice ; une activité négative ou inconnue n’exclut pas toutes les voies de libération.'] : []),
    'Conversion effective, transfert dans la bière et contribution sensorielle : aucun de ces résultats ne se calcule à partir du statut β-lyase seul.',
    ...(input.fermentation?.temperatureC == null ? ['Température de fermentation.'] : []),
  ];
  return makeFinding({
    id: 'thiolRelease', title: 'Libération de thiols à partir de précurseurs', status,
    statement: 'La levure peut libérer certains thiols depuis des précurseurs cystéinylés ou glutathionylés. Une souche β-lyase positive ne fournit pas un taux de conversion ni une intensité aromatique.',
    reasons,
    conditions: [
      'Précurseur pertinent présent dans le moût ou le houblon effectivement utilisé.',
      'Levure et milieu permettant une voie de libération pendant l’intervalle étudié.',
      'La libération et le résultat sensoriel doivent être mesurés séparément.',
      ...(input.additions?.some(addition => addition.kind === 'dryHop') ? [] : ['Le dry-hop n’est pas une condition nécessaire à la biotransformation : l’essai Samia 2024 a utilisé Cascade à l’ébullition et au whirlpool, sans dry-hop.']),
    ],
    unknownsThatCouldChangeDecision: unknowns,
    alternativesWithoutBiotransformation: ['Comparer une voie fondée sur des thiols libres mesurés dans la matière et la bière, levure maintenue constante ; ne pas convertir la mesure du houblon en dose ou teneur finale.'],
    evidence: [citations.michel2019, citations.samia2024, citations.samia2025, ...sourceIfPresent(input.yeast?.source, 'yeast-documentary-record')],
    suppliedMeasurements: measurements.filter(measurement => thiolPrecursors.has(measurement.analyte) || freeThiols.has(measurement.analyte)),
    yeastBetaLyaseActivity: betaLyase,
  });
}

function geraniolFinding(input: HopBiotransformationInput): HopMechanismFinding {
  const measurements = input.hopMeasurements ?? [];
  const geraniolSignal = signalOf(measurements, geraniolAnalyte);
  const citronellolSignal = signalOf(measurements, citronellolAnalyte);
  const state = input.fermentation?.state ?? 'unknown';
  const precursorEvidence = input.geraniolPrecursorEvidence ?? 'unknown';
  const substrateDocumented = geraniolSignal.state === 'reportedPositive' || precursorEvidence === 'documented';
  let status: MechanismStatus;
  if (state === 'noViableYeast') status = 'notCurrentlyActive';
  else if (state === 'active' && substrateDocumented) status = 'contextuallyRelevant';
  else if (substrateDocumented || state === 'active') status = 'conditional';
  else status = 'unknown';
  const reasons = [
    measurementReason('Géraniol libre', geraniolSignal),
    measurementReason('β-citronellol', citronellolSignal),
    `Précurseurs conjugués du géraniol : ${precursorEvidence === 'documented' ? 'documentés' : precursorEvidence === 'notDetected' ? 'non détectés dans l’analyse rapportée, ce qui ne prouve pas leur absence' : 'inconnus'}.`,
    ...additionDescriptions(input.additions),
  ];
  return makeFinding({
    id: 'geraniolToCitronellol', title: 'Transformation du géraniol en β-citronellol', status,
    statement: 'Des études de fermentation brassicole ont observé une baisse du géraniol et une hausse du β-citronellol ; cela ne prédit pas le résultat d’un lot sans mesures de départ et de fin.',
    reasons,
    conditions: [
      'Géraniol libre ou précurseur de géraniol dans la matière réellement utilisée.',
      'Fermentation et calendrier de contact comparables aux observations étudiées.',
      'Ne pas inférer la composition d’un lot depuis le nom de variété.',
    ],
    unknownsThatCouldChangeDecision: [
      ...(geraniolSignal.state !== 'reportedPositive' ? ['Géraniol libre mesuré dans la matière ou le moût, avec base et protocole.'] : []),
      ...(precursorEvidence === 'unknown' ? ['Présence de précurseurs conjugués du géraniol ; l’analyse d’analytes libres ne les établit pas.'] : []),
      ...(state !== 'active' ? ['Calendrier et viabilité de la levure ; les changements observés en stockage ne démontrent pas une voie universelle par levure vivante.'] : []),
      ...(input.fermentation?.temperatureC == null ? ['Température de fermentation et conditions de maturation.'] : []),
      'Géraniol et β-citronellol dans la bière finale, puis évaluation sensorielle séparée.',
    ],
    alternativesWithoutBiotransformation: ['Comparer un programme basé sur les composés libres mesurés (géraniol, β-citronellol), en gardant la levure constante ; le transfert et la rétention doivent être observés dans le contexte visé.'],
    evidence: [citations.takoi2017, ...sourceIfPresent(input.geraniolPrecursorSource, 'geraniol-precursor-record')],
    suppliedMeasurements: measurements.filter(measurement => terpeneAnalytes.has(measurement.analyte)),
  });
}

function fermentationAromaFinding(input: HopBiotransformationInput): HopMechanismFinding {
  const state = input.fermentation?.state ?? 'unknown';
  const status: MechanismStatus = state === 'active' ? 'contextuallyRelevant' : 'unknown';
  return makeFinding({
    id: 'fermentationAroma', title: 'Contribution propre de la fermentation', status,
    statement: 'Les composés et perceptions produits ou modifiés par la fermentation forment un axe distinct des composés issus du houblon ; une association sensorielle ne les attribue pas automatiquement à une transformation du houblon.',
    reasons: [
      `État fermentaire déclaré : ${state === 'unknown' ? 'inconnu' : state === 'noViableYeast' ? 'aucune levure viable actuellement' : state === 'active' ? 'fermentation active' : 'fermentation terminée'}.`,
      'Dans l’essai Samia 2024, souche et température allaient avec des profils chimiques/sensoriels différents ; la souche aux thiols les plus élevés n’avait pas le caractère fruité/tropical le plus élevé.',
    ],
    conditions: ['Comparer les marqueurs fermentaires et les composés houblon dérivés séparément.', 'Garder souche, température, matrice et protocole expérimentaux avec le résultat.'],
    unknownsThatCouldChangeDecision: [
      ...(input.yeast?.source ? [] : ['Souche ou culture et provenance de son profil documentaire.']),
      ...(input.fermentation?.temperatureC == null ? ['Température observée de fermentation.'] : []),
      'Profil mesuré des composés fermentaires et appréciation sensorielle de la bière concernée.',
    ],
    alternativesWithoutBiotransformation: ['Pour isoler la contribution fermentaire, comparer des échantillons appariés à programme de houblon identique et analyser les volatils fermentaires séparément ; cela n’implique pas un changement à appliquer au brassin.'],
    evidence: [citations.samia2024],
    suppliedMeasurements: [],
  });
}

function hopCreepFinding(input: HopBiotransformationInput): HopMechanismFinding {
  const additions = input.additions;
  const coldHopAdditions = additions?.filter(addition => ['dryHop', 'fermentation', 'postFermentation'].includes(addition.kind)) ?? [];
  const hasHopAddition = coldHopAdditions.length > 0;
  const hasResolvedHopAddition = coldHopAdditions.some(addition => addition.state !== 'unknown');
  const unresolvedHopAddition = hasHopAddition && !hasResolvedHopAddition;
  const hasDryHop = coldHopAdditions.some(addition => addition.kind === 'dryHop' && addition.state !== 'unknown');
  const state = input.fermentation?.state ?? 'unknown';
  const enzymeActivity = input.hopDextrinEnzymeActivity ?? 'unknown';
  const dextrins = input.fermentableDextrins ?? 'unknown';
  const hasHopContext = hasHopAddition || enzymeActivity === 'positive';
  const noRecordedColdHop = additions !== undefined && !hasHopAddition && additions.every(addition => addition.kind !== 'unknown');
  let status: MechanismStatus = hasHopContext ? 'conditional' : 'unknown';
  if (hasResolvedHopAddition && enzymeActivity === 'positive' && dextrins === 'documented' && state === 'active') {
    status = hasDryHop ? 'contextuallyRelevant' : 'conditional';
  }
  const refermentationContext = state === 'noViableYeast' ? 'notCurrentWithoutViableYeast'
    : state === 'active' && hasResolvedHopAddition && dextrins === 'documented' ? 'possibleInThisContext' : 'unknown';
  const reasons = [
    hasDryHop ? 'Un dry-hop prévu ou réalisé est décrit dans le programme fourni.'
      : hasResolvedHopAddition ? `Un ajout de houblon à l’étape ${coldHopAdditions.find(addition => addition.state !== 'unknown')!.kind} est décrit. Le corpus de référence étudie spécifiquement le dry-hop ; ce contact n’est pas converti en résultat de même ampleur.`
        : unresolvedHopAddition ? 'Un ajout de houblon en phase fermentation, post-fermentation ou dry-hop figure au programme, mais son état prévu/réalisé reste inconnu.'
          : noRecordedColdHop ? 'Aucun ajout de houblon en phase fermentation, post-fermentation ou dry-hop ne figure dans le programme décrit ; cela ne prouve pas l’absence d’enzymes dans la matière.'
            : 'Le programme ne permet pas d’établir un contact de houblon en phase froide.',
    `Activité enzymatique dextrinase du houblon pour la matière concernée : ${enzymeActivity === 'unknown' ? 'inconnue' : enzymeActivity === 'positive' ? 'documentée positive' : 'documentée négative'} ; aucune propriété n’est attribuée au nom de variété seul.`,
    `Dextrines fermentescibles : ${dextrins === 'unknown' ? 'inconnues' : dextrins === 'documented' ? 'présence documentée' : 'non détectées sous la portée de l’analyse rapportée'}.`,
    state === 'noViableYeast' ? 'Sans levure viable déclarée, la reprise fermentaire par la levure n’est pas en cours ; une éventuelle hydrolyse enzymatique n’est pas assimilée à une refermentation.' : `État de fermentation déclaré : ${state}.`,
    ...(additions?.length ? additionDescriptions(additions) : []),
  ];
  return makeFinding({
    id: 'hopCreep', title: 'Dégradation enzymatique des dextrines et hop creep', status,
    statement: 'Des enzymes du houblon peuvent produire des sucres fermentescibles en dégradant des dextrines lors d’un contact houblonné. La preuve primaire citée porte sur le dry-hop ; ce phénomène de procédé reste distinct d’une transformation aromatique par la levure.',
    reasons,
    conditions: ['Contact d’un houblon dont l’activité enzymatique pertinente est réelle.', 'Dextrines disponibles dans la matrice.', 'Pour une reprise fermentaire : levure viable capable de fermenter les sucres libérés.'],
    unknownsThatCouldChangeDecision: [
      ...(!hasHopAddition && enzymeActivity !== 'positive' ? ['Présence et portée d’un contact de houblon en phase froide ; l’étude citée porte sur le dry-hop.'] : []),
      ...(hasResolvedHopAddition && !hasDryHop ? ['L’ajout fermentation/post-fermentation n’est pas un dry-hop explicite ; portée du résultat pour cette forme et ce contact à établir.'] : []),
      ...(unresolvedHopAddition ? ['État de réalisation de l’ajout de houblon en phase froide décrit.'] : []),
      ...(enzymeActivity === 'unknown' ? ['Activité enzymatique de la matière/hop lot réellement utilisée ; les différences de criblage entre cultivars ne donnent pas celle d’un lot.'] : []),
      ...(dextrins === 'unknown' ? ['Présence de dextrines disponibles dans cette bière.'] : []),
      ...(state !== 'active' && state !== 'noViableYeast' ? ['Viabilité de la levure et capacité à fermenter d’éventuels sucres libérés.'] : []),
      ...(input.stage === 'packaged' ? ['Stabilité du produit conditionné, si elle a été mesurée ; aucun délai universel n’est déduit.'] : []),
      'Variabilité du lot, de la récolte et du traitement du houblon ; aucun délai de stabilisation n’est calculé.',
    ],
    alternativesWithoutBiotransformation: ['Traiter l’hydrolyse des dextrines comme une question distincte de l’arôme : sur un essai futur, comparer avec/sans le contact houblonné concerné et suivre sucres, densité et refermentation, sans en déduire un délai universel.'],
    evidence: [citations.kirkpatrick2018,
      ...sourceIfPresent(input.hopDextrinEnzymeSource, 'hop-enzyme-record'),
      ...sourceIfPresent(input.fermentableDextrinsSource, 'beer-dextrin-record')],
    suppliedMeasurements: [],
    refermentationContext,
  });
}

/**
 * Assess documented mechanisms and decision-changing unknowns without predicting
 * concentrations, sensory intensity, dose, yield or a universal fermentation time.
 * This function is deterministic and local: it performs no I/O or network access.
 */
export function assessHopBiotransformation(input: HopBiotransformationInput = {}): HopBiotransformationAssessment {
  const packaged = input.stage === 'packaged';
  return {
    schemaVersion: 'hop-biotransformation-v1',
    ...(input.subjectLabel ? { subjectLabel: input.subjectLabel } : {}),
    findings: [thiolFinding(input), geraniolFinding(input), fermentationAromaFinding(input), hopCreepFinding(input)],
    alternativesWithoutBiotransformation: [
      'Comparer une matière ou un programme selon les composés libres réellement mesurés, en maintenant la levure constante ; aucune conversion houblon→bière n’est supposée.',
      'Comparer un ajout prévu à un autre stade ou une matière de forme différente sur des essais appariés ; garder doses, transfert et rétention comme inconnus tant qu’ils ne sont pas mesurés.',
      'Pour un lot déjà conditionné, se limiter à la revue de données ou à des mesures déjà disponibles ; toute comparaison de conduite porte sur un brassin futur.',
    ],
    comparisonPlan: {
      scope: packaged ? 'existingSamplesOrFutureTrial' : 'futureOrPairedTrial',
      question: 'Dans le contexte visé, quels changements mesurés suivent le précurseur, le terpène, la fermentation propre ou le contact houblonné, lorsqu’on ne varie qu’un facteur pertinent ?',
      keepComparable: ['Même matrice et même lot/forme de houblon lorsque possible.', 'Même programme, calendrier et conditions de fermentation sauf le facteur comparé.', 'Conserver chaque unité, base, méthode, limite de détection, source et point de prélèvement.'],
      compare: ['Comparer une fermentation avec conditions documentées de levure à un témoin apparié, seulement si un essai est souhaité.', 'Séparer la voie fondée sur un composé libre mesuré de la voie dépendant d’un précurseur et d’une activité enzymatique.', 'Pour hop creep, comparer distinctement le contact houblonné et les sucres/densité ; ne pas fusionner ce résultat avec l’arôme.'],
      record: ['Précurseurs et composés libres avant/après, avec unités, bases, méthode et limites.', 'Température, état de fermentation, levure, forme, moment et durée de contact réellement consignés.', 'Composés fermentaires et observations sensorielles comme mesures distinctes.', 'Pour hop creep, sucres/dextrines, densité et observation de refermentation selon le protocole d’essai.'],
      limit: packaged
        ? 'Lot déclaré conditionné : cette évaluation ne propose aucune conduite de ce lot ; elle sert à examiner les données disponibles ou à concevoir une comparaison future.'
        : 'Un résultat ne vaut que pour la matrice, les matières et le protocole effectivement comparés. Aucun dosage, rendement, intensité ou délai universel n’est fourni.',
    },
    limits: [
      'Une mesure dans le houblon n’est pas une concentration dans la bière ; les conversions de matrice et de base ne sont pas calculées.',
      'Une activité β-lyase documentée ne détermine ni le taux de libération, ni la concentration finale, ni le caractère tropical.',
      'Une mesure absente ou sous limite ne prouve pas un zéro ; des rapports discordants restent distincts.',
      'Un profil sensoriel ou une cible aromatique n’est ni exigé ni inventé ; aucun score de potentiel biologique n’est calculé.',
      ...(packaged ? ['Les opérations du brassin conditionné ne sont ni réécrites ni modifiées par ce résultat.'] : []),
    ],
  };
}
