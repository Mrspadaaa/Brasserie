// Les données de Substituer (u4, son choix du 19.10), lues en direct dans le moteur v4, sans grille précalculée.
// - Les remplaçants : substitutes() du moteur (substitution calculée v1), au moment et à la dose de l'ajout, au style
//   de la recette, poids du contexte (60′ : arôme 0,2, huiles 0,2, amertume 0,6). u4 en montre huit : les cinq
//   premiers du catalogue et les trois premiers du stock (le premier du stock qui suffit toujours compris).
// - La plage de u4 : une composante inconnue s'ouvre de 0 à 100 avec les poids du moteur (calcul de l'écran, écrit
//   dans « Lire ces scores ») ; une composante connue reste celle du moteur. Rangés par le pire cas (bas de plage).
// - Le face à face : α, β et huiles par source (Beer Maverick, Hopsteiner et les 18 sources de complements.json, par
//   commun/sourcesMesures.ts) ; un trait par plage qui diffère, les sources d'accord n'en font qu'un (s1, commun/plagesSources.ts) ;
//   familles des fiches (niveau, N/M), mots et styles d'emploi des fiches : catalogue du moteur (hopRef).
import { useMemo } from 'react';
import type { FamilyId, SubstitutionOptions, SubstitutionResult } from '../../../domain/hopIndex/v4';
import { DONNEES_POUVOIR, familyWords, hopRef } from '../parcours/v4';
import { houblon, style, type HoublonLu } from '../parcours/adaptateur';
import { calcul } from '../parcours/calcul';
import { proposable } from '../parcours/donnees';
import { memo } from '../parcours/mesure';
import { useCalcul } from '../parcours/useCalcul';
import type { AjoutParcours, RecetteParcours } from '../parcours/types';
import { estGenerique, motAffiche } from '../fiche/traduction';
import { dedoublonnerPlages, enveloppeDesPlages, type SourcePlage, type TraitSource } from '../commun/plagesSources';
import { sourcesDeBarre } from '../commun/sourcesMesures';

export type EtatStock = 'acheter' | 'suffisant' | 'insuffisant' | 'epuise';
export const TEXTE_STOCK: Record<EtatStock, string> = { acheter: 'À acheter', suffisant: 'En stock, suffisant', insuffisant: 'En stock, insuffisant', epuise: 'Épuisé' };

export interface Candidat {
  cle: string; nom: string; h: HoublonLu;
  /** Score du moteur (poids renormalisés sur les composantes connues). */
  moteur: number; palier: string;
  composantes: { arome: number | null; huiles: number | null; amertume: number | null };
  /** Plage de u4 : bas = inconnue à 0, haut = inconnue à 100 ; égaux si tout est connu. */
  min: number; max: number;
  stock: EtatStock; libre: number | null;
  dose: { grams: number; min: number; max: number; regle: string };
  perd: FamilyId[]; gagne: FamilyId[];
  /** D'où il vient dans u4 : premiers du catalogue, ou premiers du stock. */
  vient: 'catalogue' | 'stock';
  rangMoteur: number;
  /** w1 (D102 A, D106 (3)) : à un moment d'amertume, la raison pour laquelle le moteur le fait reculer (produit d'arôme, usage « arôme », houblon aromatique) ; null sinon. Jamais le choix par défaut. */
  recule: string | null;
}
export interface Lecture {
  contexte: string; poids: { arome: number; huiles: number; amertume: number };
  candidats: Candidat[]; total: number; stockRangs: { nom: string; rang: number }[];
  /** Les 20 premiers remplaçants du moteur (clés, dans son ordre) : ce que l'IA reclasse (voie i2). Vide : rien à lui demander. */
  pool: string[];
}
/** Combien de remplaçants du moteur l'IA reçoit (functions/src/hopReclassCore.ts : TAILLE_POOL). */
const TAILLE_POOL = 20;

const etatDe = (s: { etat: string; suffisant: boolean | null }): EtatStock =>
  s.etat === 'à acheter' ? 'acheter' : s.etat === 'épuisé' ? 'epuise' : s.suffisant === false ? 'insuffisant' : 'suffisant';

const cleR = (r: RecetteParcours, a: AjoutParcours) => `${r.styleCode}|${r.volumeL}|${r.og}|${r.boilMin}|${a.hopKey}|${a.moment}|${a.grams}|${r.additions.map((x) => x.hopKey + ':' + x.grams).join(',')}`;

/** La demande au moteur : au moment et à la dose de l'ajout, au style de la recette, tout le classement (u4 lit le stock). */
const optionsDe = (recette: RecetteParcours, a: AjoutParcours): SubstitutionOptions =>
  ({ moment: a.moment, grams: a.grams, recipe: recette, style: style(recette.styleCode), stockFirst: false });

/** Les huit remplaçants de u4 et la règle du moteur, pour un ajout. `res` : le classement déjà rendu par le client
 * asynchrone (useRemplacants) ; absent, il est demandé au client (tout de suite sur le fil principal). */
export const lireRemplacants = memo<[RecetteParcours, AjoutParcours, SubstitutionResult?, (readonly string[])?], Lecture>('substituer-u4', (r, a, _res, ia) => cleR(r, a) + cleOrdre() + (ia ? `|ia:${ia.join(',')}` : ''), (recette, a, res, ia) =>
  composer(res ?? calcul().lire('substitutes', a.hopKey, optionsDe(recette, a)) ?? sansReponse(a), ia));

/** Le client n'a pas de réponse immédiate (worker) : on n'invente rien, l'écran garde son dernier résultat (useRemplacants). */
function sansReponse(a: AjoutParcours): never { throw new Error(`remplaçants de ${a.hopKey} : pas de réponse immédiate du client`); }

/** Les remplaçants de u4 par le client asynchrone (#165) : tout de suite sur le fil principal ; d'un worker, la lecture
 * d'avant reste jusqu'à la réponse (aucun état d'attente). `a` null : rien de demandé, null. */
export function useRemplacants(recette: RecetteParcours, a: AjoutParcours | null, ordreIA: readonly string[] | null = null): Lecture | null {
  const args = useMemo(() => (a ? ([a.hopKey, optionsDe(recette, a)] as [string, SubstitutionOptions]) : null), [recette, a]);
  const recu = useCalcul('substitutes', args);
  const cleIA = ordreIA ? ordreIA.join(',') : '';
  return useMemo(() => {
    if (!recu || !a || !args) return null;
    // La réponse de la demande courante : mise en cache sous sa clé ; une réponse gardée d'avant : composée seule.
    const courante = calcul().cle('substitutes', recu.args) === calcul().cle('substitutes', args);
    return courante ? lireRemplacants(recette, a, recu.valeur, ordreIA ?? undefined) : composer(recu.valeur, ordreIA ?? undefined);
  }, [recu, args, cleIA]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Le face à face par défaut de u4 (w1, D102 A) : A = le premier sûr à acheter, B = le premier du stock qui suffit, et le choix est B (« il remplace par celui du stock »).
 * Un candidat reculé par le moteur (produit d'arôme, usage « arôme » : `recule`) n'est jamais B : « un brasseur n'amérise pas avec un produit d'arôme » (« 46 g de Nugget → 24 g de
 * Citra cryo » contredisait D102 A). Sans candidat du stock restant, le face à face prend le premier de la liste, hors stock ; un reculé n'y entre qu'à défaut de tout autre. */
export function faceAFaceParDefaut(cands: readonly Candidat[]): { compares: string[]; choix: string | null } {
  const B = cands.find((c) => c.stock === 'suffisant' && !c.recule) ?? null;
  const A = cands.find((c) => c.min === c.max && c !== B && c.stock !== 'suffisant') ?? cands.find((c) => c !== B) ?? null;
  // Sans B : le premier de la liste hors stock (à acheter, épuisé), puis, à défaut, le premier autre candidat non reculé, puis n'importe lequel (la liste n'a jamais un face à face vide).
  const horsStock = (c: Candidat) => c.stock === 'acheter' || c.stock === 'epuise';
  const B2 = B ?? cands.find((c) => c !== A && horsStock(c)) ?? cands.find((c) => c !== A && !c.recule) ?? cands.find((c) => c !== A) ?? null;
  return { compares: [A?.cle, B2?.cle].filter(Boolean) as string[], choix: B2?.cle ?? A?.cle ?? null };
}

/** `ordreIA` (voie i2) : les clés que l'IA a rangées en tête, dans son ordre. Les remplaçants viennent alors d'abord dans cet ordre,
 * puis les autres dans celui du moteur ; la liste garde ses huit (cinq du catalogue, trois du stock) et n'est plus rangée par le
 * pire cas. Les scores restent ceux du moteur ; le rang du stock (« 5e ») reste celui du moteur. */
function composer(res: SubstitutionResult, ordreIA?: readonly string[]): Lecture {
  const w = res.poids;
  const moteur = res.remplacants.filter((s) => proposable(s.key));
  const rangIA = new Map((ordreIA ?? []).map((k, i) => [k, i]));
  const tous = ordreIA?.length
    ? [...moteur.filter((s) => rangIA.has(s.key)).sort((x, y) => rangIA.get(x.key)! - rangIA.get(y.key)!), ...moteur.filter((s) => !rangIA.has(s.key))]
    : moteur;
  const versCandidat = (s: (typeof tous)[number], vient: Candidat['vient']): Candidat => {
    const c = s.composantes;
    const inconnues = (Object.keys(w) as (keyof typeof w)[]).filter((k) => c[k] === null);
    const base = (Object.keys(w) as (keyof typeof w)[]).reduce((t, k) => t + (c[k] ?? 0) * w[k], 0);
    const min = inconnues.length ? Math.round(base) : s.score;
    const max = inconnues.length ? Math.round(base + inconnues.reduce((t, k) => t + 100 * w[k], 0)) : s.score;
    return {
      cle: s.key, nom: s.name, h: houblon(s.key), moteur: s.score, palier: s.palier, composantes: c, min, max,
      stock: etatDe(s.stock), libre: s.stock.libre,
      dose: { grams: s.dose.grams, min: s.dose.min, max: s.dose.max, regle: s.dose.regle },
      perd: s.familles.perd.map((m) => m.family), gagne: s.familles.gagne.map((m) => m.family), vient, rangMoteur: s.rank,
      recule: s.amertumeDeconseillee ?? null,
    };
  };
  const catalogue = tous.filter((s) => s.stock.etat !== 'en stock').slice(0, 5).map((s) => versCandidat(s, 'catalogue'));
  const enStock = tous.filter((s) => s.stock.etat === 'en stock');
  let stock = enStock.slice(0, 3);
  const suffit = enStock.find((s) => s.stock.suffisant !== false);
  if (suffit && !stock.includes(suffit)) stock = [...stock.slice(0, 2), suffit];
  const huit = [...catalogue, ...stock.map((s) => versCandidat(s, 'stock'))];
  const place = new Map(tous.map((s, i) => [s.key, i]));
  const candidats = ordreIA?.length
    ? huit.sort((x, y) => place.get(x.cle)! - place.get(y.cle)!)
    : huit.sort((x, y) => y.min - x.min || y.max - x.max || x.nom.localeCompare(y.nom, 'fr'));
  const stockRangs = stock.map((s) => ({ nom: s.name, rang: moteur.indexOf(s) + 1 }));
  const pool = moteur.slice(0, TAILLE_POOL).map((s) => s.key);
  // Développement seulement : un ordre imposé (voie m3), pour montrer l'écran tel quel avec une autre liste.
  // Le bloc entier est derrière `import.meta.env.DEV` : le build le supprime avec son message (aucune trace dans `dist/`).
  if (import.meta.env.DEV) {
    const imp = ordreImpose();
    if (imp) {
      const parCle = new Map(tous.map((s) => [s.key, s]));
      const absents = imp.filter((o) => !parCle.has(o.id)).map((o) => o.id);
      if (absents.length) console.warn(`ordre imposé : absents des remplaçants du moteur, ignorés : ${absents.join(', ')}`);
      const pris = imp.flatMap((o) => { const s = parCle.get(o.id); return s ? [{ s, score: o.score }] : []; });
      const enStock = (s: (typeof tous)[number]) => s.stock.etat === 'en stock';
      return {
        contexte: res.contexte, poids: w, total: res.candidats,
        // Le score est celui de la colonne, un point (jamais une plage) ; tout le reste vient du moteur (stock, dose, familles).
        candidats: pris.map(({ s, score }) => ({ ...versCandidat(s, enStock(s) ? 'stock' : 'catalogue'), min: score, max: score })),
        stockRangs: pris.filter(({ s }) => enStock(s)).map(({ s }) => ({ nom: s.name, rang: tous.indexOf(s) + 1 })), pool: [],
      };
    }
  }
  return { contexte: res.contexte, poids: w, candidats, total: res.candidats, stockRangs, pool };
}

// ---------- Développement seulement : l'ordre imposé de la voie m3 (listes de remplaçants) ----------
/** Un remplaçant imposé : l'id de la variété (clé du moteur) et le score de sa colonne. */
export interface OrdreImpose { id: string; score: number }
declare global { interface Window { __hopSubstituerOrdre?: OrdreImpose[] } }
/** `window.__hopSubstituerOrdre` : sous `import.meta.env.DEV` seulement (remplacé par `false` au build : aucune trace dans `dist/`,
 * contrôlé par scripts/check-no-dev-auth.mjs). Une liste non vide remplace le classement du moteur ; sinon null. */
function ordreImpose(): OrdreImpose[] | null {
  if (import.meta.env.DEV) {
    const o = window.__hopSubstituerOrdre;
    return Array.isArray(o) && o.length ? o : null;
  }
  return null;
}
/** La clé de mémoire suit l'ordre imposé : un autre ordre, une autre lecture. Vide en production. */
function cleOrdre(): string {
  if (import.meta.env.DEV) { const o = ordreImpose(); return o ? `|ordre:${JSON.stringify(o)}` : ''; }
  return '';
}

/** Le stock de l'original (son lot au stock moins ce que la recette en prend). */
export function stockOriginal(h: HoublonLu, recette: RecetteParcours): EtatStock {
  if (h.stock == null) return 'acheter';
  const pris = recette.additions.filter((x) => x.hopKey === h.cle).reduce((t, x) => t + x.grams, 0);
  return h.stock <= 0 || h.stock - pris < 0 ? 'epuise' : 'suffisant';
}

// ---------- Les mesures du face à face, par source ----------
export type Intervalle = [number, number];
type CleHuile = 'myrcene' | 'humulene' | 'caryophyllene' | 'linalool';
export interface Mesures {
  /** `src` : toutes les sources (catalogue et compléments), une entrée chacune ; `traits` : ce qu'on dessine, un par plage
   * qui diffère (s1-sources-lignes, commun/plagesSources.ts). */
  alpha: { src: { qui: string; r: Intervalle }[]; traits: TraitSource[]; lot: { v: number; origine: 'lot' | 'article' } | null };
  beta: { src: { qui: string; r: Intervalle }[]; traits: TraitSource[] };
  /** L'enveloppe de toutes les sources de chaque huile (null : aucune source, jamais 0) ; ses traits dans `huilesTraits`. */
  huiles: Record<CleHuile, Intervalle | null>;
  huilesTraits: Record<CleHuile, TraitSource[]>;
  /** Mots des fiches (Beer Maverick d'abord) et styles d'emploi attestés par un fournisseur. */
  mots: string[]; motsSource: string; styles: string[]; stylesSource: string | null;
}
/** Les champs de barre de Substituer : l'huile « linalool » de l'écran est le « linalol » des sources. */
const CHAMP_HUILE: Record<CleHuile, 'myrcene' | 'humulene' | 'caryophyllene' | 'linalol'> = { myrcene: 'myrcene', humulene: 'humulene', caryophyllene: 'caryophyllene', linalool: 'linalol' };
export function mesures(h: HoublonLu): Mesures {
  const ref = hopRef(h.cle);
  const c = ref?.catalogue;
  const src = (champ: 'alpha' | 'beta') => sourcesDeBarre(h.cle, champ);
  const sortie = (l: SourcePlage[]) => l.map((s) => ({ qui: s.nom, r: s.r }));
  const huile = (k: CleHuile) => sourcesDeBarre(h.cle, CHAMP_HUILE[k]);
  const lotA = h.alpha && !/^plage/.test(h.alpha.source) ? { v: h.alpha.valeur, origine: /article/.test(h.alpha.source) ? 'article' as const : 'lot' as const } : null;
  const w = ref ? familyWords(ref.varietyId, ref.catalogue) : null;
  const tous = w ? [...new Set([...(c?.tagsFr ?? []), ...Object.values(w.mots).flatMap((l) => l.flatMap((x) => x.mots)), ...w.sansFamille.map((x) => x.mot)].map((m) => motAffiche(m)).filter((m): m is string => !!m))] : [];
  const usage = c?.usage?.find((u) => u.styles.length) ?? null;
  return {
    alpha: { src: sortie(src('alpha')), traits: dedoublonnerPlages(src('alpha')), lot: lotA },
    beta: { src: sortie(src('beta')), traits: dedoublonnerPlages(src('beta')) },
    huiles: { myrcene: enveloppeDesPlages(huile('myrcene')), humulene: enveloppeDesPlages(huile('humulene')), caryophyllene: enveloppeDesPlages(huile('caryophyllene')), linalool: enveloppeDesPlages(huile('linalool')) },
    huilesTraits: { myrcene: dedoublonnerPlages(huile('myrcene')), humulene: dedoublonnerPlages(huile('humulene')), caryophyllene: dedoublonnerPlages(huile('caryophyllene')), linalool: dedoublonnerPlages(huile('linalool')) },
    mots: (c?.tagsFr?.length ? c.tagsFr.map((m) => motAffiche(m)).filter((m): m is string => !!m) : tous).slice(0, 6), motsSource: c?.tagsFr?.length ? 'Beer Maverick' : 'fiches',
    styles: usage?.styles.slice(0, 3) ?? [], stylesSource: usage?.source ? usage.source.split(/[,—]/)[0].trim() : null,
  };
}

// ---------- D130 : ses mots hors des familles (« Les type spéciaux des houblons hors 16d ! ») ----------
/** Mots génériques ou noms de famille, qui ne disent rien de propre au houblon (flb5b : « fruité », « fruits tropicaux »). */
const GENERIQUE = /^(fruit(é|ée|y|s|ée?s)?|fruits? tropicaux|tropical|aromatique|arôme|houblon|doux|léger|intense|complexe|agréable)$/i;
/** Un mot qui n'est que le nom d'une famille, écrit autrement (« resiny ») : la famille le dit déjà, il n'est pas propre au houblon. */
const NOM_DE_FAMILLE = /^(r[ée]sin|citr|agrum|flor|fleur|herb|terr|earth|[ée]pic|spic|tropic|berr|bai|melon|noyau|stone|p[ée]pin|v[ée]g[ée]tal|green|pine|pin)/i;
// D160 : les traductions de mots de fiches restés en anglais ou en italien sont dans fiche/traduction.ts (une seule table).
/** Les mots de ses fiches qu'aucune famille ne range (sansFamille du moteur), sans doublon ni mot générique, et le nombre de
 * fiches qui les citent ; plus tous ses mots (rangés ou non), pour dire ce qu'il est seul à avoir face aux autres. */
export function motsHors(cle: string): { hors: { mot: string; fiches: number }[]; tous: Set<string> } {
  const ref = hopRef(cle);
  if (!ref) return { hors: [], tous: new Set() };
  const w = familyWords(ref.varietyId, ref.catalogue);
  const compte = new Map<string, { mot: string; fiches: Set<string> }>();
  for (const x of w.sansFamille) {
    const brut = x.mot.toLowerCase().trim();
    // D160 : la traduction et le tri des phrases qui ne sont pas des arômes sont ceux de la fiche (fiche/traduction.ts).
    const k = motAffiche(brut);
    if (!k || GENERIQUE.test(k) || estGenerique(k) || NOM_DE_FAMILLE.test(brut)) continue;
    const e = compte.get(k) ?? { mot: k, fiches: new Set<string>() };
    e.fiches.add(x.source); compte.set(k, e);
  }
  // Les mots rangés et les étiquettes se comparent traduits, comme `compte` : « nutmeg » d'une fiche et « muscade » d'une autre sont un mot.
  const fr = (m: string) => motAffiche(m) ?? m.toLowerCase().trim();
  const tous = new Set([...compte.keys(), ...Object.values(w.mots).flatMap((l) => l.flatMap((r) => r.mots.map(fr))), ...(ref.catalogue.tagsFr ?? []).map(fr)]);
  const hors = [...compte.values()].map((e) => ({ mot: e.mot, fiches: e.fiches.size })).sort((a, b) => b.fiches - a.fiches);
  return { hors, tous };
}

// ---------- D130 bis : la matrice des huiles (grammaire de flb5b) ----------
export type LigneHuile = 'totale' | 'myrcene' | 'humulene' | 'caryophyllene' | 'farnesene' | 'linalol' | 'geraniol';
export const LIGNES_HUILE: { id: LigneHuile; nom: string; unite: string }[] = [
  { id: 'totale', nom: 'huile totale', unite: 'mL/100 g' }, { id: 'myrcene', nom: 'myrcène', unite: '%' }, { id: 'humulene', nom: 'humulène', unite: '%' },
  { id: 'caryophyllene', nom: 'caryophyllène', unite: '%' }, { id: 'farnesene', nom: 'farnésène', unite: '%' }, { id: 'linalol', nom: 'linalol', unite: '%' },
  { id: 'geraniol', nom: 'géraniol', unite: '%' },
];
/** Les valeurs des fiches d'un houblon, en plage (enveloppe des sources), ou null quand aucune fiche ne la donne (jamais 0) :
 * src/data/hopV4/composes-houblon.json d'abord (8 variétés, toutes ses sources), sinon le catalogue (Beer Maverick ; linalol Hopsteiner). */
export function huilesDe(cle: string): Record<LigneHuile, Intervalle | null> {
  const ref = hopRef(cle);
  const c = ref?.catalogue;
  const v = (DONNEES_POUVOIR.varietes as Record<string, { huile?: { valeurs: { plage: Intervalle }[] | null }; composes?: Record<string, { valeurs: { plage: Intervalle }[] | null }> }> | undefined)?.[cle]; // c8 : composés absents avant leur arrivée (aucune fiche, jamais 0)
  const env = (vs: { plage: Intervalle }[] | null | undefined): Intervalle | null => (vs?.length ? [Math.min(...vs.map((x) => x.plage[0])), Math.max(...vs.map((x) => x.plage[1]))] : null);
  const env2 = (...rs: (Intervalle | null | undefined)[]): Intervalle | null => { const l = rs.filter((r): r is Intervalle => !!r); return l.length ? [Math.min(...l.map((r) => r[0])), Math.max(...l.map((r) => r[1]))] : null; };
  const de = (k: string) => env(v?.composes?.[k]?.valeurs);
  return {
    totale: env(v?.huile?.valeurs) ?? env2(c?.oil, c?.hs?.totalOil),
    myrcene: de('myrcene') ?? c?.oils.myrcene ?? null,
    humulene: de('humulene') ?? c?.oils.humulene ?? null,
    caryophyllene: de('caryophyllene') ?? c?.oils.caryophyllene ?? null,
    farnesene: de('farnesene'),
    linalol: de('linalol') ?? c?.hsLinalool?.range ?? null,
    geraniol: de('geraniol'),
  };
}
