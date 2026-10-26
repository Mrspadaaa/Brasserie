// Dryhopper, son choix D du 26.10 (m5, « La meilleure D · trois mini graphes ») : ce que les trois mini graphes disent de l'ajout
// à froid (amertume au dry hop, hop creep, familles près de leur limite). Toutes les valeurs viennent de src/domain/hopIndex/v4/
// froid.ts (voie x1) : ici on les range pour le dessin, on n'en invente aucune. L'inconnu reste « ? », jamais 0.
// Fonction pure (testée sans rendu : tests/unit/hopIndexV4/froidDryhopper.test.ts).
import type { HopBitternessScience } from '../../../../functions/src/hopBitternessSchema';
import { hopRef } from '../../../domain/hopIndex/v4/data';
import type { FamilyId } from '../../../domain/hopIndex/v4/families';
import { amertumeAFroid, famillesProchesDeLaLimite, hopCreepDe, type FamilleProche, type RisqueCreep } from '../../../domain/hopIndex/v4/froid';
import type { Tasting } from '../../../domain/hopIndex/v4/tasting';
import { donnees, style } from '../parcours/adaptateur';
import { CONDITIONS } from '../parcours/conditions';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';

export type Intervalle = [number, number];
export type SigneAmer = '?' | '−' | '+';

export interface VueAmer {
  /** false : aucune valeur (modèle incomplet, IBU à chaud inconnu) ; `raisons` dit pourquoi. */
  calcule: boolean;
  /** IBU à chaud (centre) et équivalent d'amertume final (enveloppe des essais), en mg/L éq. iso-α. */
  chaud: number | null;
  tous: Intervalle | null;
  /** Les essais de la variété du houblon seule (3 essais Cascade pour Cascade) ; null si le modèle n'a pas cette variété. */
  variete: { nom: string; plage: Intervalle } | null;
  /** Les variétés des autres essais (« Centennial »). */
  autres: string[];
  /** Le signe de l'écart à l'IBU à chaud : « ? » tant que la plage de l'écart passe de part et d'autre de 0. */
  signe: SigneAmer;
  delta: Intervalle | null;
  deltaVariete: Intervalle | null;
  essais: number;
  source: string | null;
  raisons: string[];
  /** Les IBU à chaud de froid.ts (α du catalogue) diffèrent de ceux du bandeau (α du lot) de plus de 0,5 IBU. */
  ecartBandeau: boolean;
  /** Contact ou température hors des essais (« Contact de 7 j : hors des essais (1 à 5 j). ») : le jour tenu sort du domaine du modèle. */
  horsEssais: string[];
}
export interface VueCreep {
  statut: 'évalué' | 'sans objet';
  risque: RisqueCreep | null;
  /** Crans allumés sur 3 : faible 1, moyen 2, fort 3, nul 0. */
  crans: number;
  points: number | null;
  /** Une phrase sur le moment et la variété, les effets, le publié, les inconnus. */
  pourquoi: string;
  effets: string[];
  publie: Intervalle | null;
  inconnus: string[];
  sources: string[];
  plafonne: boolean;
}
export interface LigneLimite { famille: FamilyId; nom: string; valeur: number; borne: number; bande: Intervalle | null; depasse: boolean; statut: 'neutre' | 'indésirable'; verdict: FamilleProche['verdict'] }
export interface VueLimite {
  statut: 'évalué' | 'non simulé' | 'style non documenté';
  lignes: LigneLimite[];
  raisons: string[];
  mention: string;
}
export interface VueFroid { amer: VueAmer; creep: VueCreep; limite: VueLimite }

const NIVEAU: Record<RisqueCreep, number> = { nul: 0, faible: 1, moyen: 2, fort: 3 };
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const NOM_INCONNU: Record<string, string> = { levure: 'levure encore viable', temperature: 'température', duree: 'durée', variete: 'variété' };

/** Le plus petit et le plus grand « +N,NN » des chiffres publiés d'atténuation (H68, H84) : « +0,6 à +1,3 % vol. ». */
export function plagePubliee(textes: string[]): Intervalle | null {
  const v: number[] = [];
  for (const t of textes) for (const m of t.matchAll(/\+(\d+(?:[.,]\d+)?)/g)) v.push(Number(m[1].replace(',', '.')));
  return v.length ? [Math.min(...v), Math.max(...v)] : null;
}

export interface OptionsFroid { science?: HopBitternessScience | undefined; degustation?: Tasting | null; ibuBandeau?: number | null }

/** Les trois lectures de x1 pour l'ajout à froid `ajout` de `recette` (l'ajout y est compris). L'ajout porte sa durée de contact
 * en `jours` (parcours) : x1 la lit en `dureeJours` (même passage que adaptateur.versPouvoir). */
export function froidVue(recette: RecetteParcours, ajout: AjoutParcours, options: OptionsFroid = {}): VueFroid {
  const froid = { ...ajout, dureeJours: ajout.jours ?? CONDITIONS.jours };
  const recipe = { ...recette, additions: recette.additions.map((a) => (a.id === ajout.id ? froid : a)) };
  const sc = 'science' in options ? { science: options.science } : {};
  const a = amertumeAFroid(recipe, froid, sc);
  const c = hopCreepDe(recipe, froid);
  const l = famillesProchesDeLaLimite(recipe, froid, { ...(recette.yeastId ? { levure: recette.yeastId } : {}), degustation: options.degustation ?? null });

  // ---- Amertume : un IBU à chaud que l'app dit incalculable (densité, moment ou α du lot inconnus) n'est jamais supposé.
  const chauds = recette.additions.filter((x) => x.id !== ajout.id && x.moment !== 'dryActive' && x.moment !== 'dryPost');
  const inconnuApp = recette.ibuInconnu ?? chauds.find((x) => x.momentInconnu)?.momentInconnu ?? (chauds.some((x) => x.alphaLot === null) ? 'α du lot inconnu : l’IBU à chaud est incalculable' : null);
  const calcule = a.statut === 'conditional' && !!a.equivalentFinal && !!a.ibuChaud && !inconnuApp;
  const chaud = calcule ? a.ibuChaud!.centre : null;
  const tous: Intervalle | null = calcule ? [a.equivalentFinal!.min, a.equivalentFinal!.max] : null;
  const nomVar = hopRef(ajout.hopKey)?.catalogue.name ?? null;
  const prefixe = (id: string) => id.split('-')[0];
  const deLaVariete = nomVar ? a.scenarios.filter((s) => prefixe(s.experimentId) === sansAccent(nomVar)) : [];
  const variete = calcule && nomVar && deLaVariete.length && deLaVariete.length < a.scenarios.length
    ? { nom: nomVar, plage: [Math.min(...deLaVariete.map((s) => s.finalEquivalent.min)), Math.max(...deLaVariete.map((s) => s.finalEquivalent.max))] as Intervalle } : null;
  const autres = calcule ? [...new Set(a.scenarios.map((s) => prefixe(s.experimentId)).filter((p) => !nomVar || p !== sansAccent(nomVar)))].map(majuscule) : [];
  const delta: Intervalle | null = calcule && a.delta ? [a.delta.min, a.delta.max] : null;
  const deltaVariete: Intervalle | null = variete && chaud != null ? [variete.plage[0] - chaud, variete.plage[1] - chaud] : null;
  const signe: SigneAmer = !delta ? '?' : delta[1] < 0 ? '−' : delta[0] > 0 ? '+' : '?';
  const ecartBandeau = calcule && options.ibuBandeau != null && Math.abs(options.ibuBandeau - chaud!) > 0.5;
  const amer: VueAmer = {
    calcule, chaud, tous, variete, autres, signe, delta, deltaVariete, essais: a.scenarios.length,
    source: calcule && a.source ? `${a.source.author.split(',')[0]} ${a.source.year ?? ''}`.trim() : null,
    raisons: inconnuApp ? [inconnuApp] : a.raisons, ecartBandeau,
    horsEssais: calcule ? a.raisons.filter((r) => /^Contact/.test(r)) : [],
  };

  // ---- Hop creep.
  const evalue = c.statut === 'évalué' && c.risque != null;
  const fac = (id: string) => c.facteurs.find((f) => f.id === id);
  const vari = fac('variete');
  const moment = ajout.moment === 'dryActive' ? 'En fermentation, levure vivante' : 'Après fermentation';
  const forte = !!vari?.connu;
  const pourquoi = evalue
    ? `${moment}${forte ? `, et ${vari!.valeur} est cité parmi les plus actifs (${vari!.sources.map((s) => s.cle).join(', ')})` : `. ${vari?.valeur ?? 'Cette variété'} : activité non documentée`}.`
    : '';
  const effets = c.effets.map((e) => (e.id === 'attenuation' ? 'atténuation en plus' : e.id === 'co2' ? 'CO₂' : 'diacétyle possible'));
  // Seuls les chiffres publiés à 10 g/L (H68, H84) : le +0,39 % vol. de H35 est à 2 j, hors de cette dose.
  const publie = plagePubliee((c.effets.find((e) => e.id === 'attenuation')?.chiffresPublies ?? []).filter((p) => /10 g\/L/.test(p.texte)).map((p) => p.texte));
  // Les sources des facteurs qui ont donné un point (celles des facteurs à zéro ou inconnus ne soutiennent pas le niveau).
  const sources = [...new Set(c.facteurs.filter((f) => (f.points ?? 0) > 0).flatMap((f) => f.sources.map((s) => s.cle)).filter((k) => /^H\d+$/.test(k)))].sort();
  const creep: VueCreep = {
    statut: c.statut, risque: c.risque, crans: c.risque ? NIVEAU[c.risque] : 0, points: c.points, pourquoi, effets, publie,
    inconnus: c.facteurs.filter((f) => !f.connu && f.id !== 'variete').map((f) => NOM_INCONNU[f.id] ?? f.libelle.toLowerCase()), sources, plafonne: c.plafonne,
  };

  // ---- Familles près de leur limite (les plus loin au-dessus de la borne d'abord).
  const sc2 = style(recette.styleCode);
  const lignes: LigneLimite[] = l.familles.map((f) => ({ famille: f.famille, nom: f.nom, valeur: f.valeur, borne: f.borne, bande: sc2.families[f.famille].band ?? null, depasse: f.depasse, statut: f.statut, verdict: f.verdict }));
  return { amer, creep, limite: { statut: l.statut, lignes, raisons: l.raisons, mention: l.mention } };
}

/** Cache par état : un geste de rail revient sur des moments déjà calculés. */
const CACHE = new Map<string, VueFroid>();
export function froidVueCachee(recette: RecetteParcours, ajout: AjoutParcours, options: OptionsFroid = {}): VueFroid {
  const cle = JSON.stringify([recette.styleCode, recette.volumeL, recette.og, recette.boilMin, recette.yeastId, recette.ibuInconnu ?? null, recette.additions, 'science' in options ? (options.science?.version ?? 'x') : 'graine', options.ibuBandeau ?? null, options.degustation ? 1 : 0, donnees().degustation ? 1 : 0]);
  let v = CACHE.get(cle);
  if (!v) {
    if (CACHE.size > 60) CACHE.clear();
    v = froidVue(recette, ajout, options);
    CACHE.set(cle, v);
  }
  return v;
}
