// Voie x1-amertume-creep (mission 2026-10-25-integration-houblons, 26.10) : ce que Dryhopper doit dire d'un ajout à froid
// en plus de l'arôme. Ses mots sur sa capture (Cascade, 21C, 4 g/L, dry hop après, 3 j), sous la barre IBU, côté ébullition :
// « Amertume, hop creep ? Résineux ? ». Trois lectures, sans interface :
//  1. amertumeAFroid : l'équivalent d'amertume après le dry hop (humulinones apportées + iso-α adsorbé), par dryHopBitterness
//     (functions/src/hopBitternessCore.ts, Maye, Smith et Leker 2016) : jamais copié ici, jamais un IBU mesuré ;
//  2. hopCreepDe : un risque qualitatif (nul, faible, moyen, fort) avec sa règle, ses seuils et leurs sources ;
//  3. famillesProchesDeLaLimite : les familles que le style n'attend pas et que l'ajout approche de leur borne haute, ou dépasse.
// Rien ici ne change un module existant ; aucun nombre sans source : l'inconnu est dit, jamais compté pour 0.
import type { HopRange, HopSource } from '../../../../functions/src/hopIndexSchema';
import type { HopBitternessScience } from '../../../../functions/src/hopBitternessSchema';
import { dryHopBitterness, type DryBitternessResult } from '../../../../functions/src/hopBitternessCore';
import { bitternessScience } from '../../hopBitterness';
import { hopRef } from './data';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { cransOf } from './levels';
import { source as sourcePouvoir, type AjoutPouvoir, type RecettePouvoir, type SourceRef } from './pouvoir';
import { MOMENTS_SIMULES, simulerCas, type AjoutSimule, type MomentSimule } from './profil-simule';
import { recipeIbu, type Addition, type MomentId, type Recipe } from './recipe';
import { getStyleScale } from './style/scale';
import type { Tasting } from './tasting';
import { valueVerdict, type ValueVerdict } from './style/verdict';

const FROID: MomentId[] = ['dryActive', 'dryPost'];
const estFroid = (a: Pick<Addition, 'moment'>) => FROID.includes(a.moment);
const sansCetAjout = (recipe: Recipe, ajout: Addition): Addition[] => recipe.additions.filter((a) => a.id !== ajout.id);

// ---------- 1. Amertume au dry hop ----------
export const AMERTUME_FROID_RULE = [
  'Équivalent d’amertume (mg/L éq. iso-α), jamais un IBU mesuré : IBU à chaud × part d’iso-α retenue + humulinones apportées × 0,66 (Maye, Smith et Leker 2016, MBAA TQ 53(1), tableaux 1 à 6).',
  'Les IBU à chaud sont ceux de la recette (recipeIbu : Tinseth, BrewingMath.hopIbu) sans les ajouts à froid ; leur plage vient de la plage d’alpha de chaque houblon. Un alpha inconnu laisse l’équivalent incalculé : aucun IBU à chaud n’est supposé.',
  'Dose à cru cumulée de la recette (tous les ajouts à froid) : des ajouts partagent le même scénario, les diviser ne crée ni extraction ni incertitude en plus.',
  'Hors du domaine des essais (dose cumulée au-delà de 2 lb/bbl, soit 7,73 g/L ; science absente, désactivée ou invalide) : le statut « incomplete » et la raison du modèle, aucune valeur.',
  'Plage de scénarios (enveloppe de 5 essais pellets Cascade et Centennial à 16 °C, 1 à 5 j), sans intervalle statistique ; humulinones : deux compositions de lot publiées (0,26–0,35 %), des hypothèses.',
];
export interface AmertumeAFroid {
  /** Celui du modèle : « conditional » (calculé, sous conditions) ou « incomplete » (aucune valeur). */
  statut: DryBitternessResult['status'];
  /** Dose à cru cumulée de la recette, ajout compris (g/L) ; null si masse ou volume manquent. */
  doseGL: number | null;
  /** IBU à chaud (plage d’alpha) et au centre de l’alpha ; null si un ajout à chaud est incomplet. */
  ibuChaud: { plage: HopRange; centre: number } | null;
  /** Équivalent d’amertume final et son écart avec les IBU à chaud, en mg/L éq. iso-α : plage de scénarios, alpha en plage. */
  equivalentFinal: HopRange | null;
  delta: HopRange | null;
  /** Les mêmes, l’alpha au centre : la plage ne vient alors que des scénarios et des humulinones. */
  equivalentFinalAuCentre: HopRange | null;
  deltaAuCentre: HopRange | null;
  humulinonesMgL: HopRange | null;
  raisons: string[];
  /** Les essais retenus (un par scénario) : part d’iso-α retenue et part retrouvée. */
  scenarios: DryBitternessResult['scenarios'];
  version: string | null;
  source: HopSource | null;
  nature: string;
}
export const NATURE_AMERTUME_FROID = 'Équivalent d’amertume (mg/L éq. iso-α), plage de scénarios : ce n’est pas l’IBU du test de laboratoire.';

/** L’amertume d’une bière après un ajout à froid, avec ses IBU à chaud.
 * `options.science` : la révision que l’hôte a chargée, `bitternessScience(knowledge)` de src/domain/hopBitterness.ts, où une
 * modification enregistrée prime sur la graine (même désactivée : l’hôte passe alors `undefined` et le modèle dit « absente,
 * désactivée ou invalide »). Option absente : la graine livrée avec l’app (src/data/hopBitternessBootstrap.json, activée). */
export function amertumeAFroid(recipe: Recipe, ajout: Addition, options: { science?: HopBitternessScience | undefined } = {}): AmertumeAFroid {
  const science = 'science' in options ? options.science : bitternessScience();
  const base: AmertumeAFroid = { statut: 'incomplete', doseGL: null, ibuChaud: null, equivalentFinal: null, delta: null, equivalentFinalAuCentre: null, deltaAuCentre: null,
    humulinonesMgL: null, raisons: [], scenarios: [], version: science?.version ?? null, source: science?.source ?? null, nature: NATURE_AMERTUME_FROID };
  if (!estFroid(ajout)) return { ...base, raisons: ['Ajout à chaud : son amertume est dans les IBU de la recette (Tinseth) ; l’amertume à cru ne s’applique qu’au dry hop.'] };
  const autres = sansCetAjout(recipe, ajout);
  const chauds = autres.filter((a) => !estFroid(a));
  const grams = [...autres.filter(estFroid), ajout].reduce((s, a) => s + a.grams, 0);
  const ibu = recipeIbu({ ...recipe, additions: chauds });
  if (ibu.unknown.length) {
    const noms = ibu.unknown.map((id) => { const a = chauds.find((x) => x.id === id); return a ? (hopRef(a.hopKey)?.name ?? a.hopKey) : id; });
    return { ...base, doseGL: recipe.volumeL > 0 ? grams / recipe.volumeL : null,
      raisons: [`IBU à chaud incomplets (alpha inconnu : ${noms.join(', ')}) : l’équivalent d’amertume après le dry hop n’est pas calculé, aucun IBU n’est supposé.`] };
  }
  const input = { grams, volumeL: recipe.volumeL };
  const m = dryHopBitterness({ ...input, hotIbu: { min: ibu.min, max: ibu.max } }, science);
  const c = dryHopBitterness({ ...input, hotIbu: { min: ibu.value, max: ibu.value } }, science);
  const raisons = [...m.reasons];
  if (m.status === 'conditional') {
    const j = (ajout as AjoutPouvoir).dureeJours, t = (ajout as AjoutPouvoir).temperatureC;
    if (j != null && (j < 1 || j > 5)) raisons.push(`Contact de ${j} j : hors des essais (1 à 5 j).`);
    if (t != null && Math.abs(t - 16) > 2) raisons.push(`Contact à ${t} °C : les essais sont à 16 °C.`);
  }
  return { ...base, statut: m.status, doseGL: m.doseGL, ibuChaud: { plage: { min: ibu.min, max: ibu.max }, centre: ibu.value },
    equivalentFinal: m.finalEquivalent, delta: m.deltaEquivalent, equivalentFinalAuCentre: c.finalEquivalent, deltaAuCentre: c.deltaEquivalent,
    humulinonesMgL: m.humulinonesMgL, raisons, scenarios: m.scenarios, version: m.version };
}

// ---------- 2. Hop creep ----------
export type RisqueCreep = 'nul' | 'faible' | 'moyen' | 'fort';
/** Seuils de la règle ; chacun nomme la donnée publiée qui l’ancre (clés de composes-houblon.json). Les niveaux eux-mêmes sont une
 * convention du prototype [H], à valider par le brasseur : aucune étude ne publie un seuil de « risque faible, moyen, fort ». */
export const HOP_CREEP_SEUILS = {
  doseGL: { valeur: 10, ancre: 'Dose des essais publiés : 10 et 20 g/L (H68), 10 g/L (H84) ; entre 10 et 20 g/L l’effet de dose n’est pas significatif (p = 0,59, H68).', sources: ['H68', 'H84'] },
  jours: { valeur: 7, ancre: 'Durée de l’essai de référence : 7 j (H68) ; durée et température augmentent l’activité enzymatique (H80, relayé).', sources: ['H68', 'H80'] },
  temperatureC: { valeur: 20, ancre: 'Température de l’essai Cascade : 20 °C (H84) ; fin de refermentation en 8–10 j au chaud contre 14–15 j au froid (H85, relayé).', sources: ['H84', 'H85'] },
  /** Variétés que H68 place parmi les plus fortes. Les autres : non citées, donc inconnues, jamais « faibles ». */
  varietesFortes: { valeur: ['Cascade', 'Citra'], ancre: 'Cascade et Citra parmi les plus fortes, variétés d’Europe centrale plus faibles (H68, résumé lu et vérifié).', sources: ['H68'] },
  niveaux: { faible: 1, moyen: 2, fort: 4 },
} as const;
export const HOP_CREEP_RULE = [
  'Condition : pas de hop creep sans levure vivante (Kirkpatrick et Shellhammer 2018, H84 ; Stokholm et Shellhammer 2020). Levure déclarée non viable : risque nul. Ajout à chaud : sans objet, l’étude porte sur le dry hop.',
  'Points : moment (dry hop actif 2 ; après fermentation 1, la levure y est possible mais non établie ; après fermentation avec levure déclarée viable 2) + dose ≥ 10 g/L (1) + contact ≥ 7 j (1) + température ≥ 20 °C (1) + variété citée parmi les plus fortes, Cascade ou Citra (1).',
  'Niveau : 1 point faible ; 2 à 3 moyen ; 4 et plus fort. Une donnée absente (durée, température, viabilité) ne donne aucun point et reste listée dans « inconnus » : jamais comptée pour 0.',
  'Plafond : sous 10 g/L, hors de la dose des essais publiés, le niveau ne dépasse pas « moyen » ; la dose n’est pas un 0, c’est une plage non mesurée.',
  'Ampleur pour ce brassin : jamais chiffrée. Seuls les ordres de grandeur publiés (à 10 g/L, 7 j, levure ale : +0,57 à +1,3 % vol.) sont rendus, avec leur source et leurs conditions.',
  'Pas de valeur par variété : aucune donnée d’activité enzymatique par houblon au catalogue ; le lot réel décide (Kirkpatrick 2018 : les écarts de criblage ne prédisent pas un lot).',
];
export interface FacteurCreep { id: 'levure' | 'dose' | 'duree' | 'temperature' | 'variete'; libelle: string; valeur: string; connu: boolean; points: number | null; pourquoi: string; sources: SourceRef[] }
export interface EffetCreep {
  id: 'attenuation' | 'co2' | 'diacetyle';
  /** Ce que ça fait, en une phrase. */
  texte: string;
  /** Ordres de grandeur publiés, avec leurs conditions ; jamais une valeur pour ce brassin. */
  chiffresPublies: { texte: string; sources: SourceRef[] }[];
  /** Toujours null : l’ampleur pour ce brassin n’est pas chiffrée. */
  ampleur: null;
  sources: SourceRef[];
}
export interface HopCreep {
  statut: 'évalué' | 'sans objet';
  /** null seulement quand le statut est « sans objet ». */
  risque: RisqueCreep | null;
  points: number | null;
  plafonne: boolean;
  facteurs: FacteurCreep[];
  /** Ce qui manque et qui pourrait changer le niveau. */
  inconnus: string[];
  effets: EffetCreep[];
  raisons: string[];
  nature: string;
}
export const NATURE_CREEP = 'Risque qualitatif de refermentation par les enzymes du houblon : un niveau ordinal, jamais un point de densité ni un pourcentage pour ce brassin.';
const src = (...cles: string[]) => cles.map((c) => sourcePouvoir(c));
const fr = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
const STOKHOLM: SourceRef = { cle: 'Stokholm2020', titre: 'Stokholm et Shellhammer, Hop Creep — Technical Brief, Brewers Association, 2020', url: 'https://cdn.brewersassociation.org/wp-content/uploads/2020/05/Hop-Creep-%E2%80%93-Technical-Brief.pdf', annee: 2020, niveau: 'S', lecture: 'relayé (cité par yeastRecipeDesign.ts), non relu dans cette voie' };

function effets(): EffetCreep[] {
  return [
    { id: 'attenuation', texte: 'Atténuation en plus : les enzymes du houblon dégradent des dextrines en sucres fermentescibles, que la levure refermente (densité finale plus basse, alcool plus haut).',
      chiffresPublies: [
        { texte: '10 g/L, 7 j, levure ale : +0,92 % vol. (T-90), +1,05 (cryo), +0,57 (cônes) ; 20 g/L : +0,90, effet de dose non significatif (p = 0,59)', sources: src('H68') },
        { texte: 'Cascade, 10 g/L, 20 °C : +1,3 % vol. (durée non lue, relayé)', sources: src('H84') },
        { texte: '+0,39 % vol. en 2 j (relayé)', sources: src('H35') },
      ], ampleur: null, sources: src('H68', 'H84', 'H35') },
    { id: 'co2', texte: 'CO₂ en plus : la refermentation des sucres libérés produit du CO₂, donc une pression et une carbonatation supérieures à celles visées si la bière est déjà fermée. Conséquence de la fermentation elle-même, non chiffrée.',
      chiffresPublies: [{ texte: '0,1 MPa de pression : fin de la refermentation allongée de 6 j (relayé)', sources: src('H85') }], ampleur: null, sources: [STOKHOLM, ...src('H85')] },
    { id: 'diacetyle', texte: 'Diacétyle possible : une refermentation tardive, sans temps de reprise, peut en relâcher ; à vérifier avant le conditionnement.',
      chiffresPublies: [{ texte: 'Diacétyle 25 → 200 ppb (relayé)', sources: src('H87') }], ampleur: null, sources: src('H87') },
  ];
}

/** Le risque de hop creep d’un ajout à froid. `levureViable` : la levure est-elle encore vivante dans la bière à ce moment (si on le sait). */
export function hopCreepDe(recipe: Recipe, ajout: Addition, options: { levureViable?: boolean } = {}): HopCreep {
  const base = { points: null, plafonne: false, facteurs: [], inconnus: [], effets: [], nature: NATURE_CREEP };
  if (!estFroid(ajout)) return { ...base, statut: 'sans objet', risque: null, raisons: ['Ajout à chaud : le hop creep concerne le houblon laissé en contact avec une bière contenant des dextrines, en dry hop (Kirkpatrick et Shellhammer 2018).'] };
  const a = ajout as AjoutPouvoir, S = HOP_CREEP_SEUILS;
  const doseGL = ajout.grams / recipe.volumeL, ref = hopRef(ajout.hopKey);
  const actif = ajout.moment === 'dryActive';
  const inconnus: string[] = [];
  const facteurs: FacteurCreep[] = [];
  // Levure.
  const viable = options.levureViable;
  const ptsLevure = viable === false ? 0 : actif || viable === true ? 2 : 1;
  facteurs.push({ id: 'levure', libelle: 'Levure vivante', connu: actif || viable !== undefined, points: ptsLevure,
    valeur: viable === false ? 'déclarée non viable' : actif ? 'dry hop en fermentation active : levure vivante' : viable === true ? 'après fermentation, levure déclarée viable' : 'après fermentation : levure possible, non établie',
    pourquoi: 'Pas de hop creep sans levure vivante ; « après fermentation » ne veut pas dire sans levure.', sources: src('H84', 'H68').concat([STOKHOLM]) });
  if (!actif && viable === undefined) inconnus.push('Levure encore viable après la fermentation : la déclarer (ou la retirer) tranche entre « nul » et « moyen ».');
  // Dose.
  const dosePts = doseGL >= S.doseGL.valeur ? 1 : 0;
  facteurs.push({ id: 'dose', libelle: 'Dose à cru', connu: Number.isFinite(doseGL), points: dosePts, valeur: `${fr(doseGL)} g/L`,
    pourquoi: doseGL >= S.doseGL.valeur ? `À partir de ${S.doseGL.valeur} g/L, la dose des essais publiés. ${S.doseGL.ancre}` : `Sous ${S.doseGL.valeur} g/L, hors de la dose des essais publiés : aucune mesure, ce n’est pas un zéro. ${S.doseGL.ancre}`, sources: src(...S.doseGL.sources) });
  // Durée.
  const j = a.dureeJours;
  facteurs.push({ id: 'duree', libelle: 'Durée de contact', connu: j != null, points: j == null ? null : j >= S.jours.valeur ? 1 : 0, valeur: j == null ? 'inconnue' : `${fr(j)} j`,
    pourquoi: j == null ? 'Durée non renseignée : aucun point.' : `${j >= S.jours.valeur ? `À partir de ${S.jours.valeur} j` : `Sous ${S.jours.valeur} j`}. ${S.jours.ancre}`, sources: src(...S.jours.sources) });
  if (j == null) inconnus.push('Durée de contact : plus elle est longue, plus l’activité enzymatique monte (H80).');
  // Température.
  const t = a.temperatureC;
  facteurs.push({ id: 'temperature', libelle: 'Température de contact', connu: t != null, points: t == null ? null : t >= S.temperatureC.valeur ? 1 : 0, valeur: t == null ? 'inconnue' : `${fr(t)} °C`,
    pourquoi: t == null ? 'Température non renseignée : aucun point.' : `${t >= S.temperatureC.valeur ? `À partir de ${S.temperatureC.valeur} °C` : `Sous ${S.temperatureC.valeur} °C`}. ${S.temperatureC.ancre}`, sources: src(...S.temperatureC.sources) });
  if (t == null) inconnus.push('Température de contact : l’activité monte avec elle (H80), la refermentation finit plus tôt au chaud (H85).');
  // Variété.
  const nom = ref?.catalogue.name ?? null;
  const forte = nom != null && (S.varietesFortes.valeur as readonly string[]).includes(nom);
  facteurs.push({ id: 'variete', libelle: 'Variété', connu: forte, points: forte ? 1 : null, valeur: nom ?? ajout.hopKey,
    pourquoi: forte ? S.varietesFortes.ancre : 'Variété non citée par l’étude de référence : inconnue, jamais « faible ». Aucune donnée d’activité enzymatique par houblon au catalogue.', sources: forte ? src(...S.varietesFortes.sources) : [] });
  if (!forte) inconnus.push(`${nom ?? ajout.hopKey} : activité enzymatique du lot non documentée ; elle décide plus que la variété (Kirkpatrick et Shellhammer 2018).`);
  const points = facteurs.reduce((s, f) => s + (f.points ?? 0), 0);
  let risque: RisqueCreep = viable === false ? 'nul' : points >= S.niveaux.fort ? 'fort' : points >= S.niveaux.moyen ? 'moyen' : 'faible';
  const plafonne = risque === 'fort' && doseGL < S.doseGL.valeur;
  if (plafonne) risque = 'moyen';
  const raisons = [
    viable === false ? 'Levure déclarée non viable : pas de hop creep sans levure vivante.' : `${points} point${points > 1 ? 's' : ''} sur 6 possibles : ${risque}.`,
    ...(plafonne ? [`Plafonné à « moyen » : ${fr(doseGL)} g/L est sous les ${S.doseGL.valeur} g/L des essais publiés.`] : []),
    'Le niveau est une convention ordinale du prototype, à valider par le brasseur ; l’ampleur pour ce brassin n’est pas chiffrée.',
  ];
  return { statut: 'évalué', risque, points, plafonne, facteurs, inconnus, effets: viable === false ? [] : effets(), raisons, nature: NATURE_CREEP };
}

// ---------- 3. Familles près de leur limite ----------
export const LIMITE_RULE = [
  'Familles que le style n’attend pas (neutres, indésirables) et que l’ajout fait monter : valeur simulée après l’ajout (centre, points 0–100, la dégustation primant) comparée à la borne haute de leur bande, celle de « Au style » (D68).',
  'Elle s’approche si la marge (borne − valeur) tient dans un cran du style (largeur de la bande ÷ 3, plancher 15 points : CRANS_RULE) ; elle dépasse si la valeur est au-dessus de la borne. « peutDepasser » : la borne haute de la plage dépasse la borne du style.',
  'Un apport sous 0,05 cran ne se juge pas (D67). Une famille non située par le modèle est listée à part : jamais comptée pour 0.',
  'Lecture absolue de la valeur contre la bande du style ; aucune normalisation au moment.',
];
export interface FamilleProche {
  famille: FamilyId; nom: string; statut: 'neutre' | 'indésirable';
  /** Valeur simulée après l’ajout (centre) et sa plage, en points 0–100. */
  valeur: number; plage: { bas: number; haut: number }; avant: number; apport: number;
  /** Borne haute de la bande du style, marge (borne − valeur ; négative quand elle dépasse) et cran du style. */
  borne: number; marge: number; cran: number;
  crans: number | null; verdict: ValueVerdict;
  depasse: boolean; approche: boolean; peutDepasser: boolean; dejaAuDessusAvant: boolean;
  source: 'simulé' | 'dégustation';
}
export interface ProchesDeLaLimite {
  statut: 'évalué' | 'non simulé' | 'style non documenté';
  style: { code: string; nom: string };
  /** Du plus loin au-dessus de la borne au plus proche d’elle. */
  familles: FamilleProche[];
  nonSituees: { famille: FamilyId; raison: string }[];
  raisons: string[];
  mention: string;
}
const r2 = (x: number) => Math.round(x * 100) / 100;
const LEVURE_DEFAUT = 'fermentis-us05';

/** Les familles non attendues par le style que cet ajout approche de leur borne haute, ou dépasse. */
export function famillesProchesDeLaLimite(recipe: Recipe, ajout: Addition, options: { levure?: string; degustation?: Tasting | null } = {}): ProchesDeLaLimite {
  const scale = getStyleScale(recipe.styleCode);
  const style = { code: scale.code, nom: scale.name };
  const mention = 'Simulé : couche de lecture sur le profil simulé (profil-simule.ts), pas une mesure.';
  if (!scale.documented) return { statut: 'style non documenté', style, familles: [], nonSituees: [], raisons: [scale.notice ?? 'Style sans bandes documentées.'], mention };
  if (!MOMENTS_SIMULES.includes(ajout.moment as MomentSimule)) return { statut: 'non simulé', style, familles: [], nonSituees: [],
    raisons: [`Le moteur simule l’arôme à ${MOMENTS_SIMULES.join(', ')} seulement : ${ajout.moment} n’est pas lu.`], mention };
  const a = ajout as AjoutPouvoir, raisons: string[] = [];
  const levure = options.levure ?? recipe.yeastId ?? LEVURE_DEFAUT;
  if (!options.levure && !recipe.yeastId) raisons.push(`Levure non renseignée : ${LEVURE_DEFAUT} supposée (défaut de l’outil) ; elle ne compte que pour un dry hop actif.`);
  if (estFroid(ajout) && a.dureeJours == null) raisons.push('Durée de contact non renseignée : 3 j supposés (défaut du moteur).');
  const simule: AjoutSimule = { id: ajout.id, houblon: ajout.hopKey, dose_gL: ajout.grams / recipe.volumeL, moment: ajout.moment as MomentSimule,
    jourDebut: ajout.day ?? null, jours: estFroid(ajout) ? (a.dureeJours ?? null) : null };
  const base = { ...recipe, additions: sansCetAjout(recipe, ajout) } as RecettePouvoir;
  const cas = simulerCas({ id: 'froid', titre: 'ajout', ajouts: [simule], levure, recette: base, degustation: options.degustation ?? null, complet: false });
  const familles: FamilleProche[] = [], nonSituees: ProchesDeLaLimite['nonSituees'] = [];
  for (const f of FAMILLES_ORDRE) {
    const fs = scale.families[f];
    if (fs.status === 'attendue' || !fs.band) continue;
    const ap = cas.apres[f], av = cas.avant[f];
    if (ap.inconnu && ap.haut === 0) { nonSituees.push({ famille: f, raison: ap.inconnu }); continue; }
    const apport = cas.delta[f].centre;
    if (apport < 0.05 * fs.cran) continue;
    const borne = fs.band[1], valeur = ap.centre, marge = borne - valeur;
    const depasse = valeur > borne, approche = !depasse && marge <= fs.cran;
    if (!depasse && !approche) continue;
    familles.push({ famille: f, nom: FAMILY_NAMES[f], statut: fs.status as 'neutre' | 'indésirable', valeur: r2(valeur), plage: { bas: r2(ap.bas), haut: r2(ap.haut) }, avant: r2(av.centre), apport: r2(apport),
      borne, marge: r2(marge), cran: r2(fs.cran), crans: cransOf(f, valeur, scale).crans, verdict: valueVerdict({ range: { min: ap.bas, max: ap.haut }, central: ap.centre }, fs).verdict,
      depasse, approche, peutDepasser: ap.haut > borne, dejaAuDessusAvant: av.centre > borne, source: ap.source });
  }
  familles.sort((x, y) => x.marge - y.marge || FAMILLES_ORDRE.indexOf(x.famille) - FAMILLES_ORDRE.indexOf(y.famille));
  return { statut: 'évalué', style, familles, nonSituees, raisons, mention };
}
const FAMILLES_ORDRE: readonly FamilyId[] = FAMILIES;
