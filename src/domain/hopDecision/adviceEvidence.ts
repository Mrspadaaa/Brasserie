import type { HopAdviceEvidenceSource } from './adviceSchema';

/**
 * Small register reusing the already-read M-pH, M-AB and M-HC dossiers. It is
 * deliberately scoped: entries record reported observations and their limits,
 * not a pH equation, culture inhibition rule, or biological prediction.
 */
export const HOP_ADVICE_DOCUMENTARY_EVIDENCE: HopAdviceEvidenceSource[] = [
  {
    id: 'm-ph-maye-2018',
    source: {
      title: 'Dry Hopping and Its Effect on Beer Bitterness, the IBU Test, and pH',
      author: 'John Paul Maye, Robert Smith et Jeremy Leker', year: 2018, kind: 'research',
      reference: 'https://hopsteiner.us/wp-content/uploads/2019/05/Dry-Hopping-and-its-Effects-on-Bitterness-IBU-pH-Brauwelt-2018-1-25.pdf',
      locator: 'Brauwelt International 2018/I, p. 25–29; PDF technique expérimentale d’auteurs fabricants.',
    },
    locator: 'Printed p. 28, « Dry Hopping and pH »; Cascade pellets, 0/1/2/3/4/6 lb/bbl, three days at 16 °C. p. 28–29 for the separate bitterness comparison.',
    readingLevel: 'primaryFullText',
    domain: 'dry-hop post-fermentation et pH mesuré',
    established: 'Dans cette série Cascade et cette matrice, les auteurs rapportent une hausse de pH mesuré approximativement linéaire; ils indiquent que l’amplitude dépend de la capacité tampon.',
    limits: [
      'Essai technique fabricant, une matrice et un calendrier; ce n’est pas un coefficient de dose transférable.',
      'Bière sour/acidifiée et faible alcool non établies; ni acidité titrable ni perception acidulée mesurées.',
      'Ne donne ni promesse d’arôme, ni conformité globale, ni résultat pour la situation fournie.',
    ],
  },
  {
    id: 'm-ph-schmick-2014',
    source: {
      title: 'Dry Hopping and its Effect on Beer pH',
      author: 'Matthew J. Schmick', year: 2014, kind: 'research',
      reference: 'https://www2.uwstout.edu/content/lib/thesis/2014/2014schmickm.pdf',
      locator: 'Mémoire MS UW–Stout; extraits indexés du résumé, chapitre III et Table 4.',
    },
    locator: 'Abstract; Chapter III: Methodology — Sample Selection/Sample Preparation; Chapter IV, extrait Table 4.',
    readingLevel: 'primaryExcerpt',
    domain: 'dry-hop post-fermentation et pH mesuré',
    established: 'Les extraits accessibles rapportent une hausse de pH dans quatre bières commerciales et six variétés de houblon T90, dont les plages observées varient entre bières/variétés.',
    limits: [
      'Le PDF complet et le tableau n’ont pas été inspectés visuellement; les passages consultés sont des extraits indexés.',
      'Aucune catégorie sour/acidifiée ou faible alcool identifiée; pas de modèle prédictif transférable.',
      'Ne démontre rien sur l’acidité titrable ou la perception acidulée.',
    ],
  },
  {
    id: 'm-transfer-brendel-2020',
    source: {
      title: 'Brendel et al. 2020 — étude de transfert de volatils en bière sans alcool',
      author: 'Brendel et al. (référence bibliographique du dossier; affichage incomplet)', year: 2020, kind: 'research',
      reference: 'https://doi.org/10.1002/ffj.3609',
      locator: 'Source primaire vérifiée par le pilote; dossier bio-procédé, faits-candidats.json/nolo-volatile-transfer-is-not-biotransformation.',
    },
    locator: 'Résumé du dossier parent-vérifié : méthodes et suivi de transfert sur sept jours; source réutilisée sans nouvelle ouverture.',
    readingLevel: 'dossierSummary',
    domain: 'transfert et rétention de certains volatils dans une matrice sans alcool',
    established: 'Dans ce seul essai de banc, les profils temporels différaient selon les composés et la matrice.',
    limits: [
      'Un produit HMB T90 2015 et une bière commerciale sans alcool; ce n’est pas le houblon ni la matrice de la situation fournie.',
      'Preuve de transfert/évolution de volatils, pas de conversion de précurseurs thiolés par levure vivante.',
      'Aucun délai optimal ou rendement universel n’est transférable.',
      'Dossier parent-vérifié réutilisé; pas de collecte ni réouverture dans J4-R01/R02.',
    ],
  },
  {
    id: 'm-ab-sakamoto-2001',
    source: {
      title: 'Hop resistance in the beer spoilage bacterium Lactobacillus brevis is mediated by the ATP-binding cassette multidrug transporter HorA',
      author: 'Sakamoto, Margolles, van Veen et Konings', year: 2001, kind: 'research',
      reference: 'https://journals.asm.org/doi/10.1128/JB.183.18.5371-5375.2001',
      locator: 'Journal of Bacteriology 183(18):5371–5375; méthodes « Bacterial strains and growth conditions », « Hop resistance »; résultats/Figure 2 et discussion.',
    },
    locator: 'Methods and Results/Fig. 2; study of a specific L. brevis isolate and heterologous HorA expression in L. lactis.',
    readingLevel: 'primaryFullText',
    domain: 'résistance de souches à des composés de houblon',
    established: 'Le travail porte sur HorA d’un isolat L. brevis précis; le test rapporté utilise des iso-α-acides et une expression de HorA dans L. lactis.',
    limits: [
      'N’établit pas HorA, tolérance ou inhibition pour une culture L. plantarum non identifiée.',
      'Ne teste pas S. pastorianus, leur co-culture ni l’ajout à froid de houblon brut.',
    ],
  },
  {
    id: 'm-ab-dysvik-2020',
    source: {
      title: 'Co-fermentation Involving Saccharomyces cerevisiae and Lactobacillus Species Tolerant to Brewing-Related Stress Factors for Controlled and Rapid Production of Sour Beer',
      author: 'Dysvik et al.', year: 2020, kind: 'research',
      reference: 'https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2020.00279/full',
      locator: 'Frontiers in Microbiology 11:279; méthodes « Yeast, Bacterial Strains and Growth Conditions », « Stress Experiments », « Small Scale Co-fermentations »; Figure 1 et discussion.',
    },
    locator: 'Primary full text; pure-culture stress assays and separate co-fermentation protocol.',
    readingLevel: 'primaryFullText',
    domain: 'interaction conditionnelle entre iso-α-acides et cultures lactiques',
    established: 'Une souche commerciale L. plantarum réagit différemment selon les conditions de stress et réussit une co-fermentation séparée avec S. cerevisiae sous leur protocole.',
    limits: [
      'Les essais de stress utilisent un extrait pré-isomérisé; ils ne prouvent pas une exposition équivalente avec des cônes crus ajoutés à froid.',
      'Les souches, matrice, milieu, éthanol et montage diffèrent de la situation fournie; aucune inhibition/tolérance du couple de cultures n’est prédite.',
    ],
  },
  {
    id: 'm-ab-mahanta-2022',
    source: {
      title: 'Sour beer production in India using a coculture of Saccharomyces pastorianus and Lactobacillus plantarum: optimization, microbiological, and biochemical profiling',
      author: 'Mahanta et al.', year: 2022, kind: 'research',
      reference: 'https://link.springer.com/article/10.1007/s42770-022-00691-8',
      locator: 'Brazilian Journal of Microbiology 53:947–958; résumé de l’éditeur et extraits indexés de texte primaire.',
    },
    locator: 'Publisher abstract; indexed excerpts for inoculation/methods and process-variable/optimization results.',
    readingLevel: 'primaryAbstract',
    domain: 'précédent de procédé avec un couple d’espèces documenté',
    established: 'Le résumé éditeur rapporte une co-fermentation de S. pastorianus et L. plantarum avec houblon comme facteur de procédé dans une bière cible à 6–8 % vol.',
    limits: [
      'Le plein texte et les suppléments n’ont pas été examinés; les extraits accessibles ne donnent pas de souche comparable à la situation fournie.',
      'Ne démontre pas une tolérance universelle, un effet à faible alcool, une exposition iso-α isolée, un résultat d’arôme ou une dose transférable.',
    ],
  },
  {
    id: 'm-hc-kirkpatrick-2018',
    source: {
      title: 'A Cultivar-Based Screening of Hops for Dextrin Degrading Enzymatic Potential',
      author: 'Kirkpatrick et Shellhammer', year: 2018, kind: 'research',
      reference: 'https://doi.org/10.1080/03610470.2018.1546091',
      locator: 'Journal of the American Society of Brewing Chemists 76(4):247–256; dossier bio-procédé, records hop-creep-enzymes-and-yeast-are-distinct et hop-creep-lot-process-variation.',
    },
    locator: 'Réutilisation du dossier bio-procédé déjà qualifié; criblage d’enzymes de 30 cultivars et limites de transfert lot/procédé.',
    readingLevel: 'dossierSummary',
    domain: 'hydrolyse dextrines et risque hop-creep',
    established: 'Le dossier distingue potentiel enzymatique du houblon et refermentation ultérieure, qui dépend de sucres disponibles et d’une levure viable capable de les utiliser.',
    limits: [
      'Un essai enzymatique seul ne prédit pas l’atténuation, CO₂, diacétyle ou stabilité du lot.',
      'Pas de seuil ou délai universel; l’activité dépend du lot, du format, du procédé et de la matrice.',
      'Preuve réutilisée sans réouverture ni nouvelle revue dans J4.',
    ],
  },
  {
    id: 'm-hc-willemart-2025',
    source: {
      title: 'Impact of Contact Time, Temperature, and Ethanol Content on Hop Creep-Related Enzymatic Activities in Beer',
      author: 'Willemart, Tanriverdi et Collin', year: 2025, kind: 'research',
      reference: 'https://doi.org/10.1080/03610470.2024.2432146',
      locator: 'Dossier bio-procédé, record creep-contact-and-ethanol-enzyme-only; article primaire publié en ligne le 16 janvier 2025.',
    },
    locator: 'Résumé du dossier : essai enzyme-only stérile; varie durée, température et éthanol dans quelques variétés/bières.',
    readingLevel: 'dossierSummary',
    domain: 'activité enzymatique sans cellules viables',
    established: 'Les conditions de contact modifiaient la libération enzymatique de sucres dans l’essai stérile décrit.',
    limits: [
      'L’essai accéléré à 50 °C et les matrices/formes testées ne sont pas une instruction de conduite.',
      'Ne prédit ni production de CO₂, ni atténuation, ni stabilité du lot; il faut distinguer enzyme seule et levure viable.',
      'Preuve réutilisée sans réouverture ni nouvelle revue dans J4.',
    ],
  },
];

const byId = new Map(HOP_ADVICE_DOCUMENTARY_EVIDENCE.map(row => [row.id, row]));

export function listHopAdviceEvidence(): HopAdviceEvidenceSource[] {
  return structuredClone(HOP_ADVICE_DOCUMENTARY_EVIDENCE);
}

export function hopAdviceEvidence(id: string): HopAdviceEvidenceSource | null {
  const source = byId.get(id);
  return source ? structuredClone(source) : null;
}
