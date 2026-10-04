import { HOP_ADVICE_DOCUMENTARY_EVIDENCE } from './adviceEvidence';
import { createHopDocumentaryCorpus, type HopDocumentaryClaim, type HopDocumentaryCorpus, type HopDocumentarySource } from './documentaryAnswerSchema';
import { HOP_DOCUMENTARY_CLAIM_IDS, getHopDocumentaryCorpus } from './documentaryEvidence';
import { hopAdviceContentReference } from './adviceContentReference';
import { getColdHopBuCalibration } from './coldIbuReference';
import { getHopCommercialProduct } from './products';
import type { HopUse } from './types';

const PROPERTY_ADVICE_CORPUS_VERSION = '2026-10-03.2';

/** Stable IDs for property-level arguments. Values may alias an exact curated V1 claim. */
export const PROPERTY_ADVICE_CLAIM_IDS = {
  PROCESS_ROLES: 'property-process-role-and-profile-are-distinct',
  DIRECT_AROMA_TRANSFER: 'property-direct-aroma-is-study-specific',
  COLD_BITTERNESS: 'property-cold-contact-bu-reference-is-bounded',
  PERCEPTION_NOT_IBU: HOP_DOCUMENTARY_CLAIM_IDS.BITTERNESS_PERCEPTION,
  ACIDITY_NOT_PH: 'property-ph-is-not-titratable-acidity-or-sour-perception',
  CULTURE_PATHWAY: HOP_DOCUMENTARY_CLAIM_IDS.LF_PRECURSORS,
  CULTURE_LIMITS: HOP_DOCUMENTARY_CLAIM_IDS.CULTURE_CONTEXT,
  CHEMISTRY_NOT_SENSORY: HOP_DOCUMENTARY_CLAIM_IDS.CHEMISTRY_NOT_SENSORY,
  MATERIAL_CHARACTERIZATION: 'property-material-characterization-is-documentary',
  BLEND_COMPARISON: HOP_DOCUMENTARY_CLAIM_IDS.PAIRING_HYPOTHESIS,
  LEXICAL_NOT_PROFILE: HOP_DOCUMENTARY_CLAIM_IDS.LEXICAL_NOT_PAIRING,
  SWEETNESS_IS_PERCEPTION: HOP_DOCUMENTARY_CLAIM_IDS.SWEETNESS_BALANCE,
  PRODUCT_CRYO: 'property-product-cryo-documentary-uses',
  PRODUCT_HYPERBOOST: 'property-product-hyperboost-documentary-uses',
  PRODUCT_SPECTRUM: 'property-product-spectrum-documentary-uses',
  PRODUCT_INCOGNITO: 'property-product-incognito-documentary-uses',
  PRODUCT_LUPOMAX: 'property-product-lupomax-documentary-uses',
} as const;

export type PropertyAdviceClaimId = typeof PROPERTY_ADVICE_CLAIM_IDS[keyof typeof PROPERTY_ADVICE_CLAIM_IDS];

export interface HopPropertyAdviceProductPath {
  id: string;
  name: string;
  uses: HopUse[];
  claimIds: string[];
  description: string;
  qualification: string[];
}

const corpusV1 = getHopDocumentaryCorpus();
const sources: HopDocumentarySource[] = structuredClone(corpusV1.sources);
const claims: HopDocumentaryClaim[] = structuredClone(corpusV1.claims);
const sourceIdByCanonical = new Map(sources.map(row => [
  hopAdviceContentReference('hop-documentary-equality-v1', row.source), row.id,
]));
const sourceIds = new Set(sources.map(row => row.id));
const claimIds = new Set(claims.map(row => row.id));

function addSource(candidate: HopDocumentarySource): string {
  const canonical = hopAdviceContentReference('hop-documentary-equality-v1', candidate.source);
  const existingId = sourceIdByCanonical.get(canonical);
  if (existingId) return existingId;
  if (sourceIds.has(candidate.id)) throw new Error(`ID de source propriété dupliqué: ${candidate.id}`);
  sources.push(structuredClone(candidate));
  sourceIds.add(candidate.id);
  sourceIdByCanonical.set(canonical, candidate.id);
  return candidate.id;
}

function addClaim(claim: HopDocumentaryClaim): void {
  if (claimIds.has(claim.id)) throw new Error(`ID de claim propriété dupliqué: ${claim.id}`);
  claims.push(structuredClone(claim));
  claimIds.add(claim.id);
}

const mikyskaSourceId = addSource({
  id: 'mikyksa-2018-jib494',
  nature: 'research',
  source: {
    title: 'Mikyška et al. — profils analytiques et sensoriels de houblons en bières mono-houblonnées',
    author: 'Mikyška et al.', year: 2018, kind: 'research', reference: 'https://doi.org/10.1002/jib.494',
    locator: 'Material and methods: Hops, Brewing trials, Sensory analysis; Tables 1, 6, 7, 9; Conclusion.',
  },
  locator: 'Douze échantillons, récolte 2014, cônes moulus, lager pilote 50 L RIBM95; chaudière vs chaudière + dry-hop.',
  readingLevel: 'primaryFullText',
  domain: 'Profils analytiques/sensoriels sous les emplois et le stockage décrits dans l’étude.',
  limits: ['Répétitions biologiques non établies par les sections lues.', 'Pas de calibration ou d’intervalle prédictif pour une autre bière.'],
});

const coldCalibration = getColdHopBuCalibration();
const coldSourceId = addSource({
  id: 'lafontaine-2018-table5-cold-bu',
  nature: 'research',
  source: structuredClone(coldCalibration.source),
  locator: 'Methods: Experimental design; Table 5, dry-hop rate (g/hL) and beer BU; calibration reçue `lafontaine-2018-table5-v1`.',
  readingLevel: coldCalibration.sourceReadingLevel,
  domain: 'BU spectrophotométrique Beer 23A dans une seule matrice/procédure de dry-hop statique.',
  limits: [...coldCalibration.limitations],
});

for (const evidenceId of ['m-ph-maye-2018', 'm-ph-schmick-2014']) {
  const evidence = HOP_ADVICE_DOCUMENTARY_EVIDENCE.find(row => row.id === evidenceId);
  if (!evidence) throw new Error(`Source pH reçue absente: ${evidenceId}`);
  addSource({
    id: evidence.id, nature: 'research', source: structuredClone(evidence.source), locator: evidence.locator,
    readingLevel: evidence.readingLevel, domain: evidence.domain, limits: [...evidence.limits],
  });
}

const materialMethodSourceId = addSource({
  id: 'property-material-characterization-method',
  nature: 'editorialMapping',
  source: {
    title: 'Méthode de caractérisation documentaire d’une matière houblon', author: 'L’Affinée', year: 2026,
    kind: 'judgment', reference: 'local-method:hop-material-characterization-v1',
    locator: 'Contrat champs omis et schéma de matière: conserver identité/source/forme/lot/conservation, puis relier chaque mesure à analyte, base, unité, méthode et locator.',
  },
  locator: 'Méthode d’enregistrement documentaire; elle n’établit pas une propriété sensorielle ni une qualité de brassage.',
  readingLevel: 'curatedMapping',
  domain: 'Qualité et provenance des informations de matière, pas profil aromatique.',
  limits: ['L’absence d’un champ garde unknown; la caractérisation ne mesure pas l’intensité.', 'Un échantillon public ou COA n’est pas le stock ni le lot détenu.'],
});

addClaim({
  id: PROPERTY_ADVICE_CLAIM_IDS.PROCESS_ROLES, version: '1',
  statement: 'Dans les brassins de comparaison Mikyška, l’emploi et le stockage participent aux profils observés; une charge alpha normalisée ne garde pas nécessairement la même matière, masse ou contribution aromatique.',
  sourceIds: [mikyskaSourceId], role: 'support',
  domain: 'Douze échantillons 2014 et emplois précis, en lager pilote 50 L.',
  transferConditions: ['Conserver variété, emploi et stockage qui définissent la comparaison.', 'Pour la bière cible, qualifier son lot, sa forme et son programme.'],
  forbiddenInferences: ['Même alpha n’implique pas même goût.', 'Aucun profil final d’un autre lot n’est prédit.'],
});

addClaim({
  id: PROPERTY_ADVICE_CLAIM_IDS.DIRECT_AROMA_TRANSFER, version: '2',
  statement: 'Les emplois chaudière et chaudière suivie de dry-hop étudiés par Mikyška ont été comparés sur leurs sorties analytiques et sensorielles dans les bières pilotes de l’étude.',
  sourceIds: [mikyskaSourceId], role: 'support',
  domain: 'Emplois chaudière/dry-hop et matières comparées dans la lager pilote de Mikyška.',
  transferConditions: ['Lier la source au stade, à la forme et à la matrice qui l’étayent.', 'Un comparatif de bière cible doit préserver un témoin sensoriel.',
    'Examiner un apport sans faire du succès biologique un préalable est une piste de conseil ; cette étude ne prouve pas une absence de cellules ni un effet biologique isolé.'],
  forbiddenInferences: ['Pas de rendement d’extraction ni de profil aromatique universel.', 'Le BU froid n’est ni une mesure d’arôme ni une amertume sensorielle.'],
});

addClaim({
  id: PROPERTY_ADVICE_CLAIM_IDS.COLD_BITTERNESS, version: '1',
  statement: 'Une courbe BU de contact froid est disponible pour le protocole Lafontaine 2018; le dry-hop n’est donc pas présumé à zéro BU, mais cette référence n’est pas une loi de bière cible.',
  sourceIds: [coldSourceId], role: 'support',
  domain: 'Cascade whole-cone 2015, pale ale filtrée, contact statique 24 h, plage thermique observée du protocole.',
  transferConditions: ['Conserver BU spectrophotométrique Beer 23A distinct de note sensorielle.', 'N’utiliser la référence numérique que dans son domaine déclaré; sinon, demander mesure ou qualification appropriée.'],
  forbiddenInferences: ['Pas de BU ou IBU final de la bière utilisateur.', 'Pas de score ou intensité d’amertume perçue.'],
});

addClaim({
  id: PROPERTY_ADVICE_CLAIM_IDS.ACIDITY_NOT_PH, version: '1',
  statement: 'Les séries de dry-hop reçues portent sur le pH mesuré dans des bières données; pH, acidité titrable et sensation acidulée sont des propriétés distinctes.',
  sourceIds: ['m-ph-maye-2018', 'm-ph-schmick-2014'], role: 'limit',
  domain: 'Cascade ou bières commerciales dans les protocoles post-fermentation des études; bière sour/faible alcool non établie.',
  transferConditions: ['Si l’acidité change le choix, préciser pH, acidité titrable ou sensation et la matrice.', 'Mesures avant/après et emploi doivent être liés à la bière réelle.'],
  forbiddenInferences: ['Ne pas calculer pH ou TA depuis une variété, un emploi ou un nom de culture.', 'Une hausse de pH dans un essai ne prouve ni sourness ni baisse d’acidité titrable ici.'],
});

addClaim({
  id: PROPERTY_ADVICE_CLAIM_IDS.MATERIAL_CHARACTERIZATION, version: '1',
  statement: 'Documenter identité/source, forme, lot/conservation et mesures avec analyte, base, unité, méthode et locator permet de qualifier une matière pour une comparaison; c’est une méthode d’enregistrement, pas une mesure d’arôme.',
  sourceIds: [materialMethodSourceId], role: 'context',
  domain: 'Caractérisation documentaire d’une matière et qualification de ses valeurs analytiques.',
  transferConditions: ['Relier toute mesure au lot/échantillon réellement choisi.', 'Garder unknown pour les champs ou bases que la source ne précise pas.'],
  forbiddenInferences: ['Pas d’humidité, alpha, huiles, forme ou intensité inférés d’un nom ou d’une absence.', 'Aucun transfert d’un COA/échantillon public au stock de la brasserie.'],
});

const productConfigs: Array<{
  id: string; claimId: PropertyAdviceClaimId; description: string; qualification: string[]; statement: string; readingLevel: HopDocumentarySource['readingLevel'];
}> = [
  { id: 'ych-cryo-hops', claimId: PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_CRYO, readingLevel: 'primaryExcerpt',
    description: 'Produit Cryo Hops à examiner dans les stades publiés pour ce produit; le repère T90 ne constitue pas une équivalence sensorielle.',
    qualification: ['Résoudre l’ID produit/variété/lot exact.', 'Le repère fabricant ne garantit ni l’alpha, ni l’IBU, ni l’arôme perçu.', 'Ne pas transférer la convention de masse comme dose pour cette bière.'],
    statement: 'Le dossier YCH décrit Cryo comme forme produit utilisable dans les emplois listés; sa convention de remplacement ne prouve pas l’égalité sensorielle ou d’amertume.' },
  { id: 'ych-hyperboost', claimId: PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_HYPERBOOST, readingLevel: 'primaryExcerpt',
    description: 'Extrait oil-boosted documenté pour fermentation active et whirlpool; la convention de remplacement publiée est limitée à son emploi dry-hop.',
    qualification: ['Garder fermentation active et whirlpool comme usages distincts.', 'Aucun ratio massique whirlpool n’est publié dans le dossier reçu.', 'Résoudre produit, stade et comparaison de bière avant une opération.'],
    statement: 'Le dossier fabricant nomme les emplois fermentation active/whirlpool; ses repères de remplacement ne se transfèrent pas d’un stade à l’autre.' },
  { id: 'hpa-spectrum', claimId: PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_SPECTRUM, readingLevel: 'providedMaterialSource',
    description: 'Extrait SPECTRUM documenté pour fermentation et post-fermentation, avec conditions de dosage et base propres au TDS.',
    qualification: ['Les alpha non-isomérisés peuvent contribuer à l’IBU analytique.', 'Post-fermentation, distinguer la voie de paillasse/échantillon d’un ajout au lot.', 'Le TDS ne prédit pas l’intensité aromatique ou la perception dans la bière cible.'],
    statement: 'Le TDS HPA documente des emplois de SPECTRUM et des précautions; cela ne garantit pas une amertume basse ou un profil aromatique.' },
  { id: 'hpa-incognito', claimId: PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_INCOGNITO, readingLevel: 'primaryExcerpt',
    description: 'Liquide variété-spécifique annoncé soluble pour whirlpool; l’IBU de calculateur dépend de l’alpha et de l’utilisation saisies.',
    qualification: ['Produit/documentation spécifiques au whirlpool.', 'Le résultat HPA est un scénario de calcul, pas une mesure ni un panel.', 'Résoudre la variété, l’alpha du produit et du lot avant toute estimation.'],
    statement: 'La page HPA documente une forme et un emploi whirlpool; le calculateur ne constitue pas une équivalence d’arôme ou de goût.' },
  { id: 'hpa-lupomax', claimId: PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_LUPOMAX, readingLevel: 'providedMaterialSource',
    description: 'Pellet enrichi de lupuline LUPOMAX, distinct de Cryo, avec emplois rapportés dans le TDS.',
    qualification: ['La forme partagée reste unknown pour ce produit enrichi.', 'Le coefficient du calculateur n’est pas un résultat de TDS ni une équivalence d’arôme.', 'Vérifier le lot et la valeur alpha réellement utilisée.'],
    statement: 'Le TDS distingue LUPOMAX comme pellet enrichi; les emplois/règles de masse du fabricant ne prédisent pas une sensation identique à T90 ou Cryo.' },
];

export interface PropertyAdviceProductPath {
  id: string;
  name: string;
  uses: HopUse[];
  claimIds: string[];
  description: string;
  qualification: string[];
}

export const PROPERTY_ADVICE_PRODUCT_PATHS: PropertyAdviceProductPath[] = productConfigs.map(config => {
  const product = getHopCommercialProduct(config.id);
  if (!product) throw new Error(`Produit commercial documentaire absent: ${config.id}`);
  const sourceId = addSource({
    id: `property-product-${product.id}`,
    nature: 'manufacturerClaim',
    source: structuredClone(product.source),
    locator: product.source.locator ?? `Fiche fabricant ${product.name}; locator absent dans le catalogue local.`,
    readingLevel: config.readingLevel,
    domain: `Identité/forme et emplois fabricant rapportés pour ${product.name}.`,
    limits: ['Claim documentaire de produit; aucune intensité ou faible amertume établie.', 'La disponibilité/stock et l’usage dans cette bière ne sont pas présumés.'],
  });
  addClaim({
    id: config.claimId, version: '1', statement: config.statement, sourceIds: [sourceId], role: 'context',
    domain: config.description,
    transferConditions: ['Garder la forme et le stade indiqués dans la fiche.', 'Résoudre la matière réelle et son analyse avant une qualification opérationnelle.'],
    forbiddenInferences: ['Aucune dose, ratio ou équivalence sensorielle transférée.', 'La fiche n’est pas une preuve de disponibilité ni un lot de stock.'],
  });
  return { id: product.id, name: product.name, uses: [...product.supportedUses], claimIds: [config.claimId],
    description: config.description, qualification: [...config.qualification] };
});

const propertyAdviceCorpus: HopDocumentaryCorpus = createHopDocumentaryCorpus({
  version: PROPERTY_ADVICE_CORPUS_VERSION,
  sources,
  claims,
});

/** Returns a new validated structural-V1 corpus with a distinct V2 content reference. */
export function getHopPropertyAdviceCorpus(): HopDocumentaryCorpus {
  return structuredClone(propertyAdviceCorpus);
}
