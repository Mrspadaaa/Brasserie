import {
  createHopDocumentaryCorpus,
  type HopDocumentaryClaim,
  type HopDocumentaryCorpus,
  type HopDocumentarySource,
} from './documentaryAnswerSchema';
import { HOP_ADVICE_DOCUMENTARY_EVIDENCE } from './adviceEvidence';

/** Stable source-claim IDs for the first curated documentary corpus. */
export const HOP_DOCUMENTARY_CLAIM_IDS = {
  SWEETNESS_BALANCE: 'sweetness-balance-is-perceived-not-sugar-removal',
  ISO_HOPSTEINER: 'iso-hopsteiner-exi-documentary-use',
  ISO_YCH_UNRESOLVED: 'iso-ych-examples-unresolved',
  BITTERNESS_PERCEPTION: 'bitterness-perception-is-not-ibu-only',
  PAIRING_HYPOTHESIS: 'blend-interactions-are-study-specific',
  LEXICAL_NOT_PAIRING: 'descriptor-cooccurrence-is-not-pairing-proof',
  CHEMISTRY_NOT_SENSORY: 'thiol-chemistry-does-not-equal-fruit-expression',
  NOLO_DIRECT_TRANSFER: 'nolo-volatile-transfer-is-matrix-specific',
  LF_SUAVA: 'lf23-suava-is-a-manufacturer-claim',
  LF_PRECURSORS: 'lf23-hot-side-precursors-are-a-mechanistic-claim',
  LF_NOLO_IDENTITY: 'lf23-proper-job-is-a-brewer-interview',
  HOP_CREEP: 'hop-creep-enzyme-and-yeast-are-distinct',
  CULTURE_CONTEXT: 'culture-evidence-is-strain-and-protocol-specific',
} as const;
export type HopDocumentaryClaimId = typeof HOP_DOCUMENTARY_CLAIM_IDS[keyof typeof HOP_DOCUMENTARY_CLAIM_IDS];

const CORPUS_VERSION = '2026-10-02.2';
const lallemandDocumentReference = 'urn:sha256:095f925ca5fc7f7b59b5b588d65010eb3c0d183f0f57be71e3adb781667f79c6';

const localSources: HopDocumentarySource[] = [
  {
    id: 'hopsteiner-exi-30', nature: 'manufacturerClaim',
    source: { title: 'Isomerized Hop Extract 30 %', author: 'Hopsteiner', year: 2024, kind: 'manufacturer',
      reference: 'https://pim.hopsteiner.de/en/products/exi', locator: 'Page EXI; mise à jour affichée 2024-08-08.' },
    locator: 'Specifications, Flavor, Utilization, Application et Analytical Methods.',
    readingLevel: 'primaryExcerpt', domain: 'Identité et emploi documentés du produit EXI; pas une réponse dans une bière cible.',
    limits: ['La voie ISO n’est pas l’un des six produits du runtime.', 'Le rendement dépend du procédé; dilution/précipitation et caractère doivent rester propres au dossier fabricant.'],
  },
  {
    id: 'ych-iso-2021', nature: 'manufacturerClaim',
    source: { title: 'ISO Product Data Sheet', author: 'Yakima Chief Hops', year: 2021, kind: 'manufacturer',
      reference: 'https://yakimachief.com/media/documents/ISO_Product_Data_Sheet.pdf', locator: 'Fiche révisée avril 2021.' },
    locator: 'Texte des pages 1–2 accessible via lecteur web; capture PDF refusée 404.',
    readingLevel: 'primaryExcerpt', domain: 'Fiche d’un produit ISO précis et repères internes non réconciliés.',
    limits: ['Les indications numériques se contredisent sous les unités rapportées.', 'Pas de téléchargement/capture visuelle reçu; aucun repère numérique ne devient formule activée.'],
  },
  {
    id: 'oladokun-2016-profiles', nature: 'research',
    source: { title: 'Oladokun et al. — acides du houblon, polyphénols et amertume perçue', author: 'Oladokun et al.', year: 2016, kind: 'research',
      reference: 'https://doi.org/10.1016/j.foodchem.2016.03.023', locator: 'Résumé original et section Materials accessibles dans l’index; page éditeur refusée 403.' },
    locator: '34 lagers commerciales; 10 choisies pour évaluation sensorielle selon diversité analytique.',
    readingLevel: 'primaryExcerpt', domain: 'Association entre profils acides/polyphénoliques et qualités temporelles d’amertume dans les produits étudiés.',
    limits: ['Comparaison observationnelle de bières différentes; pas de fonction universelle IBU→perception.', 'Pas de coefficient causal de compensation du sucré.'],
  },
  {
    id: 'oladokun-2017-aroma', nature: 'research',
    source: { title: 'Oladokun et al. — variété, arôme et caractère de l’amertume', author: 'Oladokun et al.', year: 2017, kind: 'research',
      reference: 'https://doi.org/10.1016/j.foodchem.2017.03.031', locator: 'Résumé original indexé; accès direct éditeur refusé 403.' },
    locator: 'Bières à base d’extrait de malt, trois variétés, comparaison d’arômes et panel entraîné.',
    readingLevel: 'primaryAbstract', domain: 'Interaction entre arôme et perception d’amertume dans le protocole publié.',
    limits: ['Données détaillées non récupérées.', 'Aucun effet sensoriel chiffré transposable à une autre recette.'],
  },
  {
    id: 'higgins-hayes-2020', nature: 'research',
    source: { title: 'Higgins & Hayes 2020 — expériences de perception en bière sans alcool (DOI 10.3390/nu12061560)',
      author: 'Higgins et Hayes', year: 2020, kind: 'research', reference: 'https://doi.org/10.3390/nu12061560',
      locator: 'Abstract et méthodes §2.1–2.2 du texte primaire accessible; résultats/figures complets non relus.' },
    locator: 'Trois expériences dans une bière commerciale sans alcool enrichie de stimuli amers; panels analysés n=51, 62 et 81.',
    readingLevel: 'primaryExcerpt', domain: 'Différenciation perceptuelle d’échantillons d’intensité amère comparable dans la matrice de l’étude.',
    limits: ['Ne teste pas une pastry stout utilisateur.', 'Les résultats/figures complets ne sont pas reçus; aucune dose du protocole n’est réutilisée.'],
  },
  {
    id: 'takoi-2016-blend', nature: 'research',
    source: { title: 'Takoi et al. — différences de composés aromatiques de houblon dans des bières late-hopped/dry-hopped',
      author: 'Takoi et al.', year: 2016, kind: 'research', reference: 'https://brewingscience.de/index.php/brewingscience/article/view/299',
      locator: 'Résumé; PDF pages imprimées 85–87, §2.1–2.2, lecture partielle via lecteur web.' },
    locator: 'Matières de récoltes 2007/2008, poudre ou T90 selon produit; moût pilote et essais de mélanges moléculaires en matrice modèle.',
    readingLevel: 'primaryExcerpt', domain: 'Interactions de composés observées dans les mélanges et préparations étudiés.',
    limits: ['Pas de somme ou moyenne universelle des profils.', 'Aucun bonus d’accord ou transfert garanti vers une recette différente.', 'Pas de copie PDF locale validée ni d’inspection locale complète des figures.'],
  },
  {
    id: 'garrido-2026-lexicon', nature: 'research',
    source: { title: 'Garrido-Bañuelos et al. — dimensions lexicales des bières houblonnées', author: 'Garrido-Bañuelos et al.',
      year: 2026, kind: 'research', reference: 'https://doi.org/10.1111/joss.70140', locator: 'Texte intégral éditeur, §2.1–2.2, §3.3, limites et Data Availability Statement.' },
    locator: 'Corpus de 1 893 descriptions commerciales Systembolaget; co-occurrences, analyses multivariées et graphes.',
    readingLevel: 'primaryFullText', domain: 'Associations lexicales dépendantes du corpus et de son traitement.',
    limits: ['Corpus brut annoncé sur demande mais non obtenu.', 'Ce n’est pas un essai causal de mélange ni une validation d’harmonie, d’intensité ou de remplacement.'],
  },
  {
    id: 'samia-2024-chemistry-sensory', nature: 'research',
    source: { title: 'Fermentation temperature impacts polyfunctional thiol biotransformation in beer',
      author: 'Samia, Shayevitz, Fischborn et Shellhammer', year: 2024, kind: 'research',
      reference: 'https://brewingscience.de/index.php/brewingscience/article/view/241',
      locator: 'Page éditeur et résumé EBC compagnon de deux pages; chimie/CATA reprises dans le dossier local.' },
    locator: 'Pale ale pilote 1,4 hL, Cascade côté chaud/whirlpool, sans dry-hop; cinq souches, trois températures, panel CATA de 22 personnes.',
    readingLevel: 'primaryExcerpt', domain: 'Comparaison chimique et sensorielle dans une bière, un houblon et un protocole précis.',
    limits: ['La souche avec plus de thiol mesuré n’a pas l’expression tropicale/fruitée la plus élevée.', 'CATA n’est pas une échelle universelle; pas de règle d’accord transférée.'],
  },
  {
    id: 'lallemand-lf23-p04-suava', nature: 'manufacturerClaim',
    source: { title: 'We Brew With You — édition 23 — Qualité, saveur et stabilité des bières à faible teneur en alcool et sans alcool',
      author: 'Lallemand Brewing', year: 2026, kind: 'manufacturer', reference: lallemandDocumentReference,
      locator: 'LF23-03, page 4 — Dry Suava Ale Yeast; SHA-256 du document 095f925ca5fc7f7b59b5b588d65010eb3c0d183f0f57be71e3adb781667f79c6.' },
    locator: 'LF23-03, page 4 — Dry Suava Ale Yeast.', readingLevel: 'providedMaterialSource',
    domain: 'Revendication produit fabricant et descripteurs de communication.',
    limits: ['Pas de dose, matrice, concentration, activité β-lyase ou comparaison quantitative.', 'Identité canonique du produit non résolue; ne pas créer HopDecisionMaterial depuis ce claim.'],
  },
  {
    id: 'lallemand-lf23-p09-hot-side', nature: 'manufacturerClaim',
    source: { title: 'We Brew With You — édition 23 — Qualité, saveur et stabilité des bières à faible teneur en alcool et sans alcool',
      author: 'Lallemand Brewing', year: 2026, kind: 'manufacturer', reference: lallemandDocumentReference,
      locator: 'LF23-14, page 9 — houblon côté chaud; SHA-256 du document 095f925ca5fc7f7b59b5b588d65010eb3c0d183f0f57be71e3adb781667f79c6.' },
    locator: 'LF23-14, page 9 — houblon côté chaud et précurseurs de thiols.', readingLevel: 'providedMaterialSource',
    domain: 'Claim mécanistique fabricant sur une voie chaud/levure.',
    limits: ['Souche, précurseur, rendement et protocole non détaillés.', 'Ne démontre pas une activité β-lyase positive de LoNa ni un gain universel.'],
  },
  {
    id: 'lallemand-lf23-p10-11-proper-job', nature: 'brewerInterview',
    source: { title: 'We Brew With You — édition 23 — Qualité, saveur et stabilité des bières à faible teneur en alcool et sans alcool',
      author: 'Lallemand Brewing; entretien de Georgina Young', year: 2026, kind: 'manufacturer', reference: lallemandDocumentReference,
      locator: 'LF23-18, pages 10–11 — Proper Job; SHA-256 du document 095f925ca5fc7f7b59b5b588d65010eb3c0d183f0f57be71e3adb781667f79c6.' },
    locator: 'LF23-18, pages 10–11 — Proper Job IPA 0,5 %.', readingLevel: 'providedMaterialSource',
    domain: 'Retour de brasseuse sur une identité de bière et une révision qualitative.',
    limits: ['Pas de recette complète, doses, rendements, mesure thiol ou panel chiffré.', 'Ne prouve pas le résultat pour une autre recette ou levure.'],
  },
];

const runtimeEvidenceIds = [
  'm-transfer-brendel-2020',
  'm-ab-sakamoto-2001', 'm-ab-dysvik-2020', 'm-ab-mahanta-2022',
  'm-hc-kirkpatrick-2018', 'm-hc-willemart-2025',
] as const;

const runtimeSources: HopDocumentarySource[] = runtimeEvidenceIds.map(id => {
  const evidence = HOP_ADVICE_DOCUMENTARY_EVIDENCE.find(row => row.id === id);
  if (!evidence) throw new Error(`Source runtime documentaire absente: ${id}`);
  return {
    id: evidence.id,
    nature: 'research' as const,
    source: structuredClone(evidence.source),
    locator: evidence.locator,
    readingLevel: evidence.readingLevel,
    domain: evidence.domain,
    limits: [...evidence.limits],
  };
});

const editorialMappingSource: HopDocumentarySource = {
  id: 'intent-perceived-sweetness-mapping-v1',
  nature: 'editorialMapping',
  source: {
    title: 'Contrat d’intention documentaire HopDecision', author: 'L’Affinée', year: 2026, kind: 'judgment',
    reference: 'local-contract:hop-intent-evidence-v1',
    locator: 'Rôles d’intention observation/seek/preserve/avoid; mapping de sémantique utilisateur uniquement.',
  },
  locator: 'Le mot « sucré » fourni par le brasseur est une perception/observation tant qu’aucune analyse ne la qualifie.',
  readingLevel: 'curatedMapping',
  domain: 'Interprétation de l’intention, pas preuve sensorielle ou chimique.',
  limits: ['Ne mesure ni le sucre résiduel ni une baisse de douceur.', 'Ne démontre pas qu’un changement d’amertume améliore la préférence.'],
};

const guideLexiconMappingSource: HopDocumentarySource = {
  id: 'hop-recipe-guide-lexicon-mapping',
  nature: 'editorialMapping',
  source: {
    title: 'Lexique documentaire du guide de recette', author: 'L’Affinée', year: 2026, kind: 'judgment',
    reference: 'src/data/hopRecipeGuideBootstrap.json',
    locator: 'Choix éditorial du 8 septembre 2026 : rapprochement de mots français/anglais vers les familles locales. Aucun poids, seuil, rendement, score sensoriel ni prédiction de bière. Les mentions génériques « fruité/fruity » ne sont pas affectées à une famille de fruits particulière.',
  },
  locator: 'Snapshot exact de HopGuideFamily.source; cette source commune est partagée par les 12 familles du bootstrap local.',
  readingLevel: 'curatedMapping',
  domain: 'Correspondance lexicale éditoriale entre termes et familles locales.',
  limits: ['Le mapping décrit un vocabulaire, pas un goût mesuré.', 'Les termes génériques « fruité/fruity » ne sont pas affectés à une famille de fruits particulière.'],
};

const claims: HopDocumentaryClaim[] = [
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.SWEETNESS_BALANCE, version: '1',
    statement: 'Une demande « trop sucrée » peut être traitée comme perception rapportée à équilibrer; elle ne mesure pas le sucre et aucune intervention ne promet de le retirer.',
    sourceIds: [editorialMappingSource.id], role: 'context', domain: 'Sémantique de l’intention utilisateur; séparée d’une mesure analytique.',
    transferConditions: ['Conserver le texte et l’origine utilisateur.', 'Demander si la cible est l’intensité perçue, la préférence ou une analyse des sucres.'],
    forbiddenInferences: ['Ne pas inférer une teneur en sucre.', 'Ne pas promettre qu’une hausse d’amertume retire ou quantifie le sucre.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.ISO_HOPSTEINER, version: '1',
    statement: 'La page EXI documente une solution de sels d’iso-alpha annoncée à 30 ± 2 % massiques, un alpha résiduel inférieur à 0,6 %, et un emploi de correction d’amertume après fermentation; ce sont des caractéristiques produit, pas une instruction de dose.',
    sourceIds: ['hopsteiner-exi-30'], role: 'support', domain: 'Produit ISO exact, source documentaire uniquement.',
    transferConditions: ['Garder l’identité EXI et les conditions de page.', 'Demander volume, accès, étape et objectif si un essai séparé doit être qualifié.'],
    forbiddenInferences: ['Ne pas assimiler iso-alpha à alpha de houblon.', 'Ne pas appliquer Tinseth ou une dose/ratio non qualifié.', 'Ne pas déclarer EXI disponible dans le runtime ou dans le stock.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.ISO_YCH_UNRESOLVED, version: '1',
    statement: 'La fiche YCH ISO présente des indications de dosage qui ne concordent pas sous les unités rapportées; la référence numérique reste non résolue.',
    sourceIds: ['ych-iso-2021'], role: 'limit', domain: 'Fiche d’un produit YCH distinct de Hopsteiner EXI.',
    transferConditions: ['Conserver la contradiction telle que documentée.', 'Une résolution de source est requise avant toute utilisation quantitative.'],
    forbiddenInferences: ['Ne pas activer l’une des indications.', 'Ne pas les moyenner, les corriger ou les transférer à EXI.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.BITTERNESS_PERCEPTION, version: '1',
    statement: 'Les études de perception retenues distinguent intensité, qualité temporelle, arôme et préférence; leurs protocoles ne donnent pas de fonction universelle IBU→perception.',
    sourceIds: ['oladokun-2016-profiles', 'oladokun-2017-aroma', 'higgins-hayes-2020'], role: 'support',
    domain: 'Perception sensorielle dans les lagers, bières à base d’extrait et bière sans alcool étudiées.',
    transferConditions: ['Identifier le caractère visé et le stade d’accès.', 'Toute conclusion de préférence sur une bière cible demande une comparaison sensorielle propre à cette bière.'],
    forbiddenInferences: ['Ne pas déduire une baisse chiffrée de douceur depuis les IBU.', 'Ne pas extrapoler les protocoles à une pastry stout ou autre matrice.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.PAIRING_HYPOTHESIS, version: '1',
    statement: 'Les mélanges étudiés motivent une hypothèse de composition et une comparaison; les interactions observées ne certifient pas une harmonie universelle.',
    sourceIds: ['takoi-2016-blend'], role: 'support', domain: 'Essais et matrices spécifiques de Takoi et al.',
    transferConditions: ['Nommer les candidats réellement fournis et leurs contextes.', 'Présenter une comparaison comme hypothèse rejetable.'],
    forbiddenInferences: ['Aucun bonus numérique de synergie.', 'Aucune garantie banane/tropicale ou de somme linéaire des profils.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.LEXICAL_NOT_PAIRING, version: '1',
    statement: 'Le graphe Garrido décrit les co-occurrences de son corpus commercial, tandis que le guide local fournit un mapping éditorial de mots vers des familles; ni l’un ni l’autre n’est un essai de mélange ou une preuve d’accord.',
    sourceIds: ['garrido-2026-lexicon', guideLexiconMappingSource.id], role: 'limit',
    domain: 'Corpus commercial traité et crosswalk lexical local; deux objets descriptifs distincts.',
    transferConditions: ['Conserver le corpus et le traitement Garrido comme contexte.', 'Présenter le guide comme mapping éditorial seulement.', 'Ne pas substituer réseau ou mapping à la formulation utilisateur.'],
    forbiddenInferences: ['Pas d’harmonie, d’intensité, d’équivalence de remplacement ou d’obligation de maximiser des termes associés.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.CHEMISTRY_NOT_SENSORY, version: '1',
    statement: 'Dans l’essai Samia 2024, la souche avec plus de thiol mesuré ne correspond pas à l’expression tropicale/fruitée la plus forte; chimie et perception sont des sorties distinctes.',
    sourceIds: ['samia-2024-chemistry-sensory'], role: 'limit', domain: 'Cascade, pale ale pilote, cinq souches, trois températures et CATA.',
    transferConditions: ['Restreindre ce constat au protocole publié.', 'Demander une observation ou un essai apparié pour la bière cible.'],
    forbiddenInferences: ['Un claim thiol/β-lyase ne promet pas un profil fruité.', 'Ne pas transférer une souche, température ou intensité hors protocole.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.NOLO_DIRECT_TRANSFER, version: '1',
    statement: 'Brendel 2020 documente un transfert/rétention temporel de certains volatils dans une bière sans alcool précise; ce n’est pas la libération de précurseurs par levure vivante.',
    sourceIds: ['m-transfer-brendel-2020'], role: 'support', domain: 'Essai de banc HMB T90 2015 dans matrice commerciale sans alcool.',
    transferConditions: ['Conserver produit, matrice, analytes et chronologie de l’étude.', 'Pour comparer, identifier la matrice et les échantillons de la bière cible.'],
    forbiddenInferences: ['Pas de délai ou rendement universel.', 'Pas de conclusion sur co-culture, acidité, houblon maison ou thiols libérés par levure.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.LF_SUAVA, version: '1',
    statement: 'LF23-03 est une revendication fabricant associant le produit Dry Suava à une expression de thiols et aux descripteurs raisin blanc, cassis, goyave et fruits tropicaux; elle ne donne pas de mesure quantitative.',
    sourceIds: ['lallemand-lf23-p04-suava'], role: 'context', domain: 'Page 4 de We Brew With You, édition 23.',
    transferConditions: ['Résoudre l’identité canonique du produit avant de la rattacher à une matière.', 'Présenter les descripteurs comme claims de source, distincts d’une observation de bière.'],
    forbiddenInferences: ['Ne pas attribuer β-lyase positive, rendement, intensité ni arôme banane.', 'Ne pas créer produit ou ID matière à partir du nom seul.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.LF_PRECURSORS, version: '1',
    statement: 'LF23-14 propose une voie mécanistique par précurseurs côté chaud; la souche, le précurseur, le protocole et le rendement ne sont pas précisés.',
    sourceIds: ['lallemand-lf23-p09-hot-side'], role: 'context', domain: 'Page 9 de We Brew With You, édition 23.',
    transferConditions: ['Une piste d’étude exige produit/culture, substrat et matrice précisés.', 'Ne pas confondre claim fabricant et preuve d’activité dans la bière cible.'],
    forbiddenInferences: ['Ne pas l’appliquer comme gain de thiols, β-lyase ou préférence aromatique.', 'Ne pas inférer un effet de LoNa.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.LF_NOLO_IDENTITY, version: '1',
    statement: 'LF23-18 rapporte LoNa et une révision du profil de Proper Job 0,5 % après comparaison à l’identité visée; l’entretien associe le pamplemousse rose au Chinook et cite aussi Cascade et Willamette, sans recette mesurée.',
    sourceIds: ['lallemand-lf23-p10-11-proper-job'], role: 'context', domain: 'Pages 10–11 de We Brew With You, édition 23.',
    transferConditions: ['L’utiliser comme exemple de démarche qualitative et de retour brasseur.', 'Comparer une cible réelle à une référence que l’utilisateur précise.'],
    forbiddenInferences: ['Pas de preset LoNa/Chinook/Cascade/Willamette.', 'Pas de dose, rendement, causalité garantie ou profil reproductible.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.HOP_CREEP, version: '1',
    statement: 'Le potentiel enzymatique du houblon et une refermentation ultérieure sont distincts; celle-ci suppose des sucres disponibles et une levure viable qui peut les fermenter.',
    sourceIds: ['m-hc-kirkpatrick-2018', 'm-hc-willemart-2025'], role: 'limit', domain: 'Études de potentiel enzymatique et essai stérile résumés dans le dossier reçu.',
    transferConditions: ['Qualifier produit/lot, matrice, fermentation/sucres et viabilité au contact.', 'Un statut terminé ne dit pas à lui seul si des cellules viables subsistent.'],
    forbiddenInferences: ['Ne pas inférer atténuation, CO₂, diacétyle ou stabilité depuis une enzyme seule.', 'Pas de délai ou seuil universel.'],
  },
  {
    id: HOP_DOCUMENTARY_CLAIM_IDS.CULTURE_CONTEXT, version: '1',
    statement: 'Les résultats sur résistance/stress et co-fermentation concernent les souches, substrats et montages publiés; ils ne qualifient pas automatiquement une autre culture mixte ni son arôme.',
    sourceIds: ['m-ab-sakamoto-2001', 'm-ab-dysvik-2020', 'm-ab-mahanta-2022'], role: 'limit',
    domain: 'HorA d’un isolat L. brevis, co-fermentation précise et résumé Mahanta pour le couple d’espèces étudié.',
    transferConditions: ['Identifier culture/souches, exposition et matrice de la bière visée.', 'Mahanta reste au niveau résumé/extraits indexés; garder son niveau de lecture.'],
    forbiddenInferences: ['Ne pas inférer tolérance/inhibition de la co-culture utilisateur.', 'Ne pas inférer libération de thiols, arôme ni rendement depuis le nom des espèces.'],
  },
];

const corpus: HopDocumentaryCorpus = createHopDocumentaryCorpus({
  version: CORPUS_VERSION,
  sources: [...localSources, ...runtimeSources, editorialMappingSource, guideLexiconMappingSource],
  claims,
});

/** Returns a detached, validated snapshot of the explicitly curated source corpus. */
export function getHopDocumentaryCorpus(): HopDocumentaryCorpus {
  return structuredClone(corpus);
}
