import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopCommercialProduct, HopUse } from './types';

const reviewedOn = '2026-09-30';

const manufacturerSource = (
  author: string,
  title: string,
  reference: string,
  year: number | null,
  locator: string,
): HopSource => ({ title, author, year, kind: 'manufacturer', reference, locator });

const hpaCalculator = manufacturerSource(
  'Hop Products Australia',
  'Brewing Calculator',
  'https://hops.com.au/brewing-calculator/',
  null,
  'Calculateurs produit par usage; interactions et sorties vérifiées le 30 septembre 2026.',
);

const t90Uses = (): HopUse[] => ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];

/** Manufacturer-specific product conventions; no entry implies sensory equivalence. */
export const HOP_COMMERCIAL_PRODUCTS: HopCommercialProduct[] = [
  {
    id: 'ych-cryo-hops',
    name: 'Cryo Hops®',
    manufacturer: 'Yakima Chief Hops',
    form: 'cryo',
    supportedUses: t90Uses(),
    source: manufacturerSource(
      'Yakima Chief Hops',
      'Cryo Hops product page',
      'https://www.yakimachief.com/products/cryo-hops',
      null,
      'FAQ: conversion T-90 → Cryo, point de départ à la moitié du poids T-90. Contenu de page indexé le 30 septembre 2026; fetch direct temporairement limité à 429. Le PDF historique https://www.yakimachief.com/media/documents/Cryo_Hops_Product_Data_Sheet.pdf répond 404.',
    ),
    reviewedOn,
    cautions: [
      'Le rapport 40–50 % du poids T-90 est un départ de formulation, pas une équivalence d’alpha, d’IBU ou de goût.',
      'Les plages analytiques varient selon la variété et le lot; préférer le COA réellement utilisé.',
    ],
    replacement: {
      referenceForm: 'pelletT90',
      uses: t90Uses(),
      basis: 'manufacturerMassRatio',
      gramsPerGram: { min: 0.4, max: 0.5 },
      source: manufacturerSource(
        'Yakima Chief Hops',
        'Cryo Hops product page',
        'https://www.yakimachief.com/products/cryo-hops',
        null,
        'Dose de départ publiée: 40–50 % du poids T-90; direction documentée pour les emplois T-90. Page indexée le 30 septembre 2026; réponse directe 429.',
      ),
      limitations: [
        'Repère de masse fabricant; ne préserve ni la charge alpha du lot, ni les huiles, ni les IBU.',
        'Le résultat dépend de la variété, du lot, du stade et du procédé.',
      ],
    },
  },
  {
    id: 'ych-hyperboost',
    name: 'HyperBoost®',
    manufacturer: 'Yakima Chief Hops',
    form: 'extract',
    supportedUses: ['fermentation', 'whirlpool'],
    source: manufacturerSource(
      'Yakima Chief Hops',
      'HyperBoost® — Oil-Boosted Hop Extract',
      'https://www.yakimachief.com/products/hyperboost',
      null,
      'Usages publiés: ajout dry-hop en fermentation active et whirlpool. Index officiel consulté le 30 septembre 2026; fetch direct limité à 429.',
    ),
    reviewedOn,
    cautions: [
      'En dry-hop, le fabricant recommande HyperBoost pour 25–50 % de la charge et T-90 ou Cryo pour le reste.',
      'Jusqu’à 100 % de remplacement du whirlpool est cité, sans ratio massique équivalent publié pour ce stade.',
      'La dose varie selon le procédé, le matériel et le résultat visé; ne pas transférer le ratio dry-hop au whirlpool.',
    ],
    replacement: {
      referenceForm: 'pelletT90',
      uses: ['fermentation'],
      basis: 'manufacturerMassRatio',
      gramsPerGram: { min: 0.008, max: 0.01 },
      source: manufacturerSource(
        'Yakima Chief Hops',
        'HyperBoost® Technical One Sheet 2025',
        'https://www.yakimachief.com/media/wysiwyg/documents/HyperBoost_-_Technical_One_Sheet_2025.pdf',
        2025,
        'Dose dry-hop de départ publiée: 8–10 g HyperBoost à la place de 1 kg de T-90. Index officiel consulté le 30 septembre 2026; fetch direct limité à 429.',
      ),
      limitations: [
        'Le rapport est publié pour le dry-hop; la part conseillée de la charge est 25–50 %.',
        'Les fractions restantes sont en T-90 ou Cryo; aucun rapport HyperBoost/Cryo n’est transposé ici.',
      ],
      maxEquivalentFraction: 0.5,
    },
  },
  {
    id: 'hpa-spectrum',
    name: 'SPECTRUM',
    manufacturer: 'Hop Products Australia',
    form: 'extract',
    supportedUses: ['fermentation', 'postFermentation'],
    source: manufacturerSource(
      'Hop Products Australia',
      'SPECTRUM Technical Data Sheet, Rev. 8',
      'https://hops.com.au/downloads/data-sheet/innovative-hop-products/spectrum-tds.pdf',
      2024,
      'TDS approuvé le 20 juin 2024: catégorie extrait pour dry-hop, huile 3–10 mL/100 g, EBC 7.10; fermentation active/secondaire et conditionnement.',
    ),
    reviewedOn,
    cautions: [
      'Le TDS indique 1:5–1:8 par masse en fermentation et ≤1 g/L; pour l’après-fermentation il conseille de commencer à 0.05–0.1 g/L et de faire un essai de paillasse.',
      'Le calculateur HPA conseille ≤70 % pour le flavor matching; la page produit et le TDS indiquent jusqu’à 80 % dans d’autres contextes. Les consignes restent distinctes.',
      'Le dosage en bière claire est une voie séparée basée sur l’huile; elle n’est pas représentée par ce ratio massique.',
      'Le produit contient des alpha-acides non isomérisés: forte dose ou ajout tardif peut augmenter les IBU analytiques.',
    ],
    replacement: {
      referenceForm: 'pelletT90',
      uses: ['fermentation'],
      basis: 'manufacturerMassRatio',
      gramsPerGram: { min: 1 / 8, max: 1 / 5 },
      source: manufacturerSource(
        'Hop Products Australia',
        'Brewing Calculator — SPECTRUM, mass calculation',
        'https://hops.com.au/brewing-calculator/',
        null,
        'Scénario exécuté: 1 g/L T-90, remplacement 50 %, 1 000 L; sortie 0.08 g/L SPECTRUM et 0.5 g/L T-90 restant. Le TDS Rev. 8 publie 1:5–1:8 selon l’application.',
      ),
      limitations: [
        'Ratio du fabricant pour la fermentation; il ne prédit pas l’intensité sensorielle.',
        'La convention ne s’applique pas au dosage post-fermentation basé sur l’huile.',
      ],
      maxEquivalentFraction: 0.7,
      maxDoseGL: 1,
    },
  },
  {
    id: 'hpa-incognito',
    name: 'INCOGNITO®',
    manufacturer: 'Hop Products Australia',
    form: 'extract',
    supportedUses: ['whirlpool'],
    source: manufacturerSource(
      'Hop Products Australia',
      'INCOGNITO® product page',
      'https://hops.com.au/incognito/',
      null,
      'Liquide variété-spécifique soluble pour whirlpool; le fabricant annonce une force 5–6 fois celle des pellets T-90. Consulté le 30 septembre 2026.',
    ),
    reviewedOn,
    cautions: [
      'Le rapport de masse issu de la force annoncée ne garantit pas une égalité d’IBU; le calculateur demande alpha du produit, alpha T-90 et utilisation alpha de chaque matière.',
      'Scénario HPA exécuté: 5 g/L T-90, 50 % remplacé, alpha 10 % pour les deux, 1 000 L. Sortie INCOGNITO 0.43 g/L et 2.16 IBU, contre 12.5 IBU pour le T-90 restant.',
    ],
    replacement: {
      referenceForm: 'pelletT90',
      uses: ['whirlpool'],
      basis: 'manufacturerMassRatio',
      gramsPerGram: { min: 1 / 6, max: 1 / 5 },
      source: manufacturerSource(
        'Hop Products Australia',
        'INCOGNITO® product page',
        'https://hops.com.au/incognito/',
        null,
        'Repère fabricant publié: 5–6 fois la force T-90 pour l’ajout whirlpool. Consulté le 30 septembre 2026.',
      ),
      limitations: [
        'Repère de masse/force propre à INCOGNITO en whirlpool, pas une équivalence d’alpha ou d’IBU.',
        'Ajuster l’IBU avec les analyses alpha et utilisations affichées par le calculateur HPA.',
      ],
    },
  },
  {
    id: 'hpa-lupomax',
    name: 'LUPOMAX®',
    manufacturer: 'Hop Products Australia',
    // Enriched lupulin pellet is a distinct product form; the shared enum has no precise member for it.
    form: 'unknown',
    supportedUses: t90Uses(),
    source: manufacturerSource(
      'Hop Products Australia',
      'LUPOMAX® Technical Data Sheet, Rev. 3',
      'https://hops.com.au/downloads/data-sheet/innovative-hop-products/lupomax-tds.pdf',
      2021,
      'TDS approuvé le 19 avril 2021: pellets enrichis de lupuline, employés où T-90 est employé; meilleur usage en fin d’ébullition, whirlpool et dry-hop.',
    ),
    reviewedOn,
    cautions: [
      'LUPOMAX est un pellet enrichi de lupuline, distinct de Cryo; le repère de dosage ci-dessous compare ce produit au T-90.',
      'Le calculateur HPA a été exécuté sur deux scénarios et affichait 0.7 g LUPOMAX par gramme de portion T-90 remplacée. Cette convention de calculateur n’établit pas une équivalence sensorielle ou d’IBU.',
      'Le fabricant standardise l’alpha par variété mais le lot reste la référence analytique pour le calcul d’IBU.',
    ],
    replacement: {
      referenceForm: 'pelletT90',
      uses: t90Uses(),
      basis: 'manufacturerMassRatio',
      gramsPerGram: { min: 0.7, max: 0.7 },
      source: manufacturerSource(
        'Hop Products Australia',
        'Brewing Calculator — LUPOMAX',
        'https://hops.com.au/brewing-calculator/',
        null,
        'Deux scénarios: 1 g/L T-90, 50 % remplacé → 0.35 g/L LUPOMAX; 2 g/L, 25 % → 0.35 g/L. Ratio affiché 0.7 g/g de portion remplacée. Consulté le 30 septembre 2026.',
      ),
      limitations: [
        'Sortie du calculateur HPA; le TDS ne publie pas lui-même ce coefficient massique.',
        'Le rapport décrit une convention de masse, pas l’égalité d’alpha, d’huile ou de perception.',
      ],
    },
  },
  {
    id: 'hopsteiner-co2-extract',
    name: 'CO₂ Hop Extract',
    manufacturer: 'Hopsteiner',
    form: 'extract',
    supportedUses: ['boil'],
    source: manufacturerSource(
      'Hopsteiner',
      'CO₂ Hop Extract product range',
      'https://shop.hopsteiner.com/all-products/advanced-products/co2-extract',
      null,
      'Catalogue fabricant: les variétés listées sont conditionnées en boîtes de 150 g d’alpha; l’extrait s’emploie dans la chaudière. Consulté le 30 septembre 2026.',
    ),
    reviewedOn,
    cautions: [
      'Pas de ratio massique T-90 fixe. Le calculateur demande cible IBU, volume en BBL et efficacité; l’exemple exécuté à 30 IBU, 1 BBL et 30 % donne 11.734 g alpha.',
      'La page Hopsteiner qualifie les sorties d’approximations informatives et hypothétiques; elles ne prédisent ni l’arôme ni l’équivalence de produit.',
      'Le catalogue indique 150 g d’alpha par boîte; ne pas confondre cette capacité avec 150 g de masse d’extrait.',
    ],
  },
];

export function getHopCommercialProduct(id: string): HopCommercialProduct | undefined {
  return HOP_COMMERCIAL_PRODUCTS.find(product => product.id === id);
}
