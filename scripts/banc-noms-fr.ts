/**
 * Banc de la désignation en français par un appel à part, texte seul (voie f5b-traduire, 01.11 ; D271, D275, D278, D279).
 *
 * Csv8F (mettre `nameFr` dans la lecture) a été payé et jugé : PERTE (la lecture elle-même change). Ici la lecture ne bouge pas : on prend les lignes
 * FINALES d'une sortie du banc (par défaut la production rejouée, `banc-d272b-hl`, variante `Csv8+N`), on en tire le nom de base par `lireOptions`
 * (options, état, supplément et suffixe d'unité déjà retirés par le code, voie f1), et UN appel texte seul par pièce (ni image, ni montant) rend leur français.
 * Deux modèles se comparent : `gemini-3.5-flash-lite` et `gemini-3.8-flash`, réflexion au plus bas.
 *
 * Réutilise du banc de lecture (importé, jamais recopié) : le budget et son plafond de passe, le journal, le transport réel, les modèles, la garde
 * `--confirm-paid-ai`, le prêt d'appels (`--reprendre`), le juge `jugerNomFr` et son lexique. Les paires (nom de base, nom français) portent des noms d'achat :
 * elles restent dans le dossier de sortie (H13-reels, hors Git) ; le tableau publiable ne porte que des comptes.
 *
 *   npx tsx scripts/banc-noms-fr.ts --simuler [--lot impaires|paires] [--docs doc1,doc3]
 *   npx tsx scripts/banc-noms-fr.ts --estimer [--lot impaires]
 *   npx tsx scripts/banc-noms-fr.ts --payant --budget-chf 24.5 --plafond-passe 1 --lot impaires --confirm-paid-ai [--reprendre <sortie>]
 *   npx tsx scripts/banc-noms-fr.ts --juger <sortie>        (rejuge une sortie déjà payée, sans réseau)
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { lireOptions } from '../src/ui/depense/optionsDuNom';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';
import {
  BUDGET_CAP_CHF, Budget, BudgetStop, CAS_FILES, DEFAULT_PASS_CAP_CHF, LEXIQUE_FR, LITE_MODEL, MISSION_JOURNAL, REELS_DIR, STRONG_MODEL,
  UNITE_SUFFIXE, appendJournal, canonMot, casPath, genreOfCase, loadCases, motsDe, realTransport, spentInJournal, type BenchCase, type Reading, type Transport
} from './banc-lecture-facture';
import { jetonsGardes, jugerNomFr, type DefautNomFr } from './banc-lecture-facture-juger';
// @ts-ignore — module JavaScript sans déclarations
import { readLocalKey } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans déclarations
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Constantes : la consigne, le schéma, les deux modèles
// ---------------------------------------------------------------------------------------------------------------------
export type ModeleTag = 'lite' | '38';
export const MODELES: Record<ModeleTag, string> = { lite: LITE_MODEL, '38': STRONG_MODEL };
export const SOURCE_PAR_DEFAUT = path.join(REELS_DIR, 'banc-d272b-hl');
export const VARIANTE_SOURCE = 'Csv8+N';
const TIMEOUT_MS = 45_000;

/**
 * La consigne système. Les exemples sont INVENTÉS : aucun n'est tiré des 14 pièces du banc (L20, « overfit ») ; les mots de la liste viennent de la voie.
 * L'appel ne voit ni l'image ni un montant : il reçoit des noms de base déjà débarrassés des options, de l'état et du suffixe d'unité.
 */
export const SYSTEME_NOMS_FR = `Tu traduis en français des désignations d'articles d'une facture de brasserie (allemand, anglais, français ou italien). Tu ne vois ni le document ni aucun montant.
Entrée : une liste d'objets { i, base, kind, stockCategory }. Sortie : pour chaque entrée, { i, nameFr } avec le même i, dans le même ordre, et rien d'autre.
nameFr est la désignation de base en français :
- Traduis tous les mots ordinaires : matière, usage, forme, couleur, frais (Malz, Hopfen, Hefe, Schlauch, Deckel, Porto, Verpackung, Zuschlag…), même dans une désignation en partie en français ou en anglais.
- Garde tels quels : marque et nom propre, variété de houblon, souche et code de levure, ® et ™, références, codes, nombres, dimensions et contenances (« 5x8mm », « 30 L »). Un chiffre ou un code qui suit un nom fait partie du nom : ne le coupe pas et ne l'abrège pas.
- Une désignation déjà en français, ou faite seulement d'un nom propre ou d'un code, se rend à l'identique.
- N'ajoute ni ne retire aucune information : pas d'option, d'état du produit, d'unité, d'explication ni de parenthèse.
- La même désignation reçoit toujours la même traduction.
- kind et stockCategory servent seulement à lever une ambiguïté de sens ; ne les recopie pas.
Exemples inventés : « Flaschenbürste Neo-7 » → « Goupillon pour bouteilles Neo-7 » ; « Sirup-Pumpe mit Deckel 12x3mm » → « Pompe à sirop avec couvercle 12x3mm » ; « Brew Kettle Lid 40 cm » → « Couvercle de marmite 40 cm » ; « MALTEX® Edel 7 » → « MALTEX® Noble 7 » ; « Joint torique 12x2mm » → « Joint torique 12x2mm ».`;

export const NOMS_SCHEMA = {
  type: 'OBJECT',
  properties: { noms: { type: 'ARRAY', items: { type: 'OBJECT', properties: { i: { type: 'INTEGER' }, nameFr: { type: 'STRING' } }, required: ['i', 'nameFr'] } } },
  required: ['noms']
};

// ---------------------------------------------------------------------------------------------------------------------
// Les lignes d'une pièce -> les entrées de l'appel (dédoublonnées par nom de base)
// ---------------------------------------------------------------------------------------------------------------------
export interface LigneSource { name?: unknown; variant?: unknown; unit?: unknown; kind?: unknown; stockCategory?: unknown }
export interface Entree { i: number; base: string; kind: string; stockCategory: string }
/** `entree` : le `i` de l'entrée qui porte la base de cette ligne (la première ligne de même base) ; null si la base est vide (rien à traduire). */
export interface PlanPiece { doc: string; lignes: Array<{ rang: number; base: string; entree: number | null }>; entrees: Entree[] }
/** Deux bases sont la même désignation si leur forme canonique (minuscules, sans accent, espaces réduits) est la même. */
export const cleBase = (base: string): string => canonMot(base).replace(/\s+/g, ' ').trim();

export function planPiece(doc: string, items: LigneSource[]): PlanPiece {
  const premiere = new Map<string, number>(), entrees: Entree[] = [];
  const lignes = items.map((ligne, rang) => {
    const base = lireOptions(String(ligne.name ?? ''), ligne.variant === undefined || ligne.variant === null ? undefined : String(ligne.variant), String(ligne.unit ?? '')).base.trim();
    if (!base) return { rang, base, entree: null };
    const cle = cleBase(base);
    if (!premiere.has(cle)) { premiere.set(cle, rang); entrees.push({ i: rang, base, kind: String(ligne.kind ?? ''), stockCategory: String(ligne.stockCategory ?? '') }); }
    return { rang, base, entree: premiere.get(cle)! };
  });
  return { doc, lignes, entrees };
}

/** Le plafond de sortie d'un appel : de quoi écrire chaque entrée avec la réflexion au plus bas, sans excès (la réserve du budget le compte en entier). */
export const maxSortie = (entrees: number): number => Math.min(8192, 600 + 36 * entrees);

/** `BANC_NOMS_FORME=production` : le corps tel qu'aiTask l'envoie (`Données :` devant le JSON, plafond fixe de `TASKS.traduireNoms`), pour mesurer cet écart. */
const FORME_PRODUCTION = process.env.BANC_NOMS_FORME === 'production';
export function buildNomsBody(entrees: Entree[], maxOutputTokens: number = FORME_PRODUCTION ? 600 + 36 * 35 : maxSortie(entrees.length)): Record<string, unknown> {
  return {
    systemInstruction: { parts: [{ text: SYSTEME_NOMS_FR }] },
    contents: [{ role: 'user', parts: [{ text: `${FORME_PRODUCTION ? 'Données :\n' : ''}${JSON.stringify({ entrees })}` }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: NOMS_SCHEMA, temperature: 0, maxOutputTokens, thinkingConfig: { thinkingLevel: 'LOW' } }
  };
}

/** Les noms rendus par Gemini : `i` -> `nameFr`. Un `i` absent, inconnu ou sans texte n'est pas une traduction (la base reste). Une réponse coupée ou illisible : aucune. */
export function parseNoms(response: any, entrees: readonly Entree[]): { noms: Array<{ i: number; nameFr: string }> | null; state: string } {
  const candidate = response?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') return { noms: null, state: candidate?.finishReason ? `coupée (${candidate.finishReason})` : 'illisible' };
  const text = (candidate.content?.parts ?? []).filter((part: any) => part.thought !== true && typeof part.text === 'string').map((part: any) => part.text).join('');
  let decoded: any;
  try { decoded = JSON.parse(text); } catch { return { noms: null, state: 'illisible' }; }
  if (!decoded || !Array.isArray(decoded.noms)) return { noms: null, state: 'illisible' };
  const known = new Set(entrees.map(entree => entree.i)), seen = new Set<number>(), noms: Array<{ i: number; nameFr: string }> = [];
  for (const nom of decoded.noms) {
    if (!Number.isInteger(nom?.i) || !known.has(nom.i) || seen.has(nom.i) || typeof nom?.nameFr !== 'string' || !nom.nameFr.trim()) continue;
    seen.add(nom.i); noms.push({ i: nom.i, nameFr: nom.nameFr.replace(/\s+/g, ' ').trim().slice(0, 160) });
  }
  return { noms, state: 'STOP' };
}

// ---------------------------------------------------------------------------------------------------------------------
// Les appels, leur sortie
// ---------------------------------------------------------------------------------------------------------------------
export interface Appel {
  doc: string; modele: ModeleTag; model: string; plan: PlanPiece; noms: Array<{ i: number; nameFr: string }> | null; ms: number;
  inputTokens: number | null; outputTokens: number | null; costMicroChf: number | null; state: string; lent?: boolean;
}
/** La traduction d'une ligne : celle de son entrée, sinon rien. */
export const nomFrDeLigne = (appel: Appel, ligne: PlanPiece['lignes'][number]): string | undefined => (ligne.entree === null ? undefined : appel.noms?.find(nom => nom.i === ligne.entree)?.nameFr);

// ---------------------------------------------------------------------------------------------------------------------
// Le juge : jugerNomFr sur la base, plus identité, chiffre, cohérence, manquant
// ---------------------------------------------------------------------------------------------------------------------
export type DefautTexte = DefautNomFr | 'identite' | 'chiffre' | 'incoherent' | 'manquant';
export const DEFAUTS_TEXTE: readonly DefautTexte[] = ['manquant', 'langue', 'marque', 'chiffre', 'option', 'unite', 'long', 'identite', 'incoherent'];
const inLexique = (word: string) => Object.prototype.hasOwnProperty.call(LEXIQUE_FR, word);
/** Des mots français courants du métier (canon) : une base qui en porte, sans mot du lexique étranger, est déjà en français. */
const MOTS_FRANCAIS: ReadonlySet<string> = new Set(['avec', 'pour', 'sans', 'de', 'du', 'des', 'le', 'la', 'les', 'en', 'et', 'au', 'aux', 'sur', 'dans', 'malt', 'houblon', 'houblons', 'levure', 'orge', 'blé', 'froment',
  'sac', 'tuyau', 'couvercle', 'bouchon', 'capsule', 'capsules', 'bouteille', 'bouteilles', 'joint', 'fût', 'fermenteur', 'supplément', 'emballage', 'livraison', 'frais', 'clair', 'foncé', 'fin', 'rond', 'percé',
  'silicone', 'fermentation', 'concassage', 'torréfié', 'torréfiée', 'grillée', 'sirop', 'pompe', 'marmite', 'nettoyant', 'brosse'].map(canonMot));
/** La base est-elle déjà du français ? (aucun mot du lexique étranger, au moins un mot français courant) Alors nameFr doit la recopier à l'identique. */
export function dejaFrancais(base: string): boolean {
  const mots = motsDe(base);
  return !mots.some(inLexique) && mots.some(mot => MOTS_FRANCAIS.has(mot));
}
/** Les nombres de 1 à 3 chiffres de la base (« 3 » de « … Spezial 3 », « 30 » de « 30 Liter ») : ils ne se coupent pas. */
const chiffresDe = (base: string): string[] => motsDe(base).filter(mot => /^\d{1,3}$/.test(mot));

/** Les défauts d'UNE traduction (sans la cohérence entre pièces) : `jugerNomFr` sur la base, puis identité et chiffre. */
export function jugerTraduction(base: string, nameFr: string | undefined): DefautTexte[] {
  if (!nameFr || !nameFr.trim()) return ['manquant'];
  let codes: DefautTexte[] = [...jugerNomFr({ name: base, nameFr, variant: '', unit: '' })];
  // Ce que la base porte déjà (deux-points d'un texte libre, « , 10gr » imprimé) n'est pas une faute de la traduction qui le recopie
  if (codes.includes('option') && jugerNomFr({ name: base, nameFr: base }).includes('option')) codes = codes.filter(code => code !== 'option');
  if (codes.includes('unite') && UNITE_SUFFIXE.test(base)) codes = codes.filter(code => code !== 'unite');
  if (dejaFrancais(base) && cleBase(nameFr) !== cleBase(base)) codes.push('identite');
  const mots = motsDe(nameFr);
  if (chiffresDe(base).some(chiffre => !mots.includes(chiffre))) codes.push('chiffre');
  return codes;
}

export interface PaireTexte { doc: string; modele: ModeleTag; rang: number; base: string; nameFr: string; defauts: DefautTexte[] }
export interface StatsTexte {
  appels: number; appelsSansReponse: number; lignes: number; sansDefaut: number; defauts: Record<DefautTexte, number>; parDoc: Record<string, { lignes: number; sansDefaut: number }>;
  parGenre: Record<string, { lignes: number; sansDefaut: number }>; ms: number[]; coutMicro: Array<number | null>; entrees: number[]; sorties: number[]; paires: PaireTexte[];
}
const vide = (): StatsTexte => ({ appels: 0, appelsSansReponse: 0, lignes: 0, sansDefaut: 0, defauts: { absent: 0, langue: 0, marque: 0, option: 0, unite: 0, long: 0, identite: 0, chiffre: 0, incoherent: 0, manquant: 0 }, parDoc: {}, parGenre: {},
  ms: [], coutMicro: [], entrees: [], sorties: [], paires: [] });

/** Le jugement par modèle. `genres` : pièce -> genre (photo, capture…), pour le tableau par genre. La cohérence : une même base rend un même français d'une pièce à l'autre (la plus fréquente fait référence, la première en cas d'égalité). */
export function jugerAppels(appels: readonly Appel[], genres: ReadonlyMap<string, string> = new Map()): Record<string, StatsTexte> {
  const out: Record<string, StatsTexte> = {};
  const parModele = new Map<ModeleTag, Appel[]>();
  for (const appel of appels) parModele.set(appel.modele, [...(parModele.get(appel.modele) ?? []), appel]);
  for (const [modele, liste] of parModele) {
    const stats = (out[modele] = vide());
    // 1. le verdict de chaque ligne
    const lignes: Array<PaireTexte & { cle: string; genre: string }> = [];
    for (const appel of liste) {
      stats.appels++; if (!appel.noms) stats.appelsSansReponse++;
      stats.ms.push(appel.ms); stats.coutMicro.push(appel.costMicroChf);
      if (appel.inputTokens !== null) stats.entrees.push(appel.inputTokens);
      if (appel.outputTokens !== null) stats.sorties.push(appel.outputTokens);
      for (const ligne of appel.plan.lignes) {
        if (ligne.entree === null) continue;
        const nameFr = nomFrDeLigne(appel, ligne);
        lignes.push({ doc: appel.doc, modele, rang: ligne.rang, base: ligne.base, nameFr: nameFr ?? '', defauts: jugerTraduction(ligne.base, nameFr), cle: cleBase(ligne.base), genre: genres.get(appel.doc) ?? 'inconnu' });
      }
    }
    // 2. la cohérence entre pièces
    const groupes = new Map<string, Array<typeof lignes[number]>>();
    for (const ligne of lignes) if (ligne.nameFr) groupes.set(ligne.cle, [...(groupes.get(ligne.cle) ?? []), ligne]);
    for (const groupe of groupes.values()) {
      // une voix par pièce : une base répétée dans une pièce ne pèse pas plus
      const comptes = new Map<string, number>(), voix = new Set<string>();
      for (const ligne of groupe) { const cle = `${ligne.doc}|${cleBase(ligne.nameFr)}`; if (voix.has(cle)) continue; voix.add(cle); comptes.set(cleBase(ligne.nameFr), (comptes.get(cleBase(ligne.nameFr)) ?? 0) + 1); }
      if (comptes.size < 2) continue;
      const reference = [...comptes].sort((a, b) => b[1] - a[1])[0][0];
      for (const ligne of groupe) if (cleBase(ligne.nameFr) !== reference) ligne.defauts.push('incoherent');
    }
    // 3. les comptes
    for (const ligne of lignes) {
      stats.lignes++;
      const bon = ligne.defauts.length === 0;
      if (bon) stats.sansDefaut++;
      for (const code of ligne.defauts) stats.defauts[code]++;
      const doc = (stats.parDoc[ligne.doc] ??= { lignes: 0, sansDefaut: 0 }), genre = (stats.parGenre[ligne.genre] ??= { lignes: 0, sansDefaut: 0 });
      doc.lignes++; genre.lignes++; if (bon) { doc.sansDefaut++; genre.sansDefaut++; }
      stats.paires.push({ doc: ligne.doc, modele, rang: ligne.rang, base: ligne.base, nameFr: ligne.nameFr, defauts: ligne.defauts });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Simulation : réponses fabriquées depuis les bases, et fautes fabriquées pour éprouver le juge
// ---------------------------------------------------------------------------------------------------------------------
export interface FauteTexte {
  id: string; doc: string; code: DefautTexte; note: string;
  /** Le rang (dans `entrees`) de l'entrée à fausser, ou -1 si cette pièce n'en a pas. */
  choisir: (entrees: Entree[], toutes: ReadonlyMap<string, PlanPiece>) => number;
  /** La fausse valeur ; null = l'entrée est omise de la réponse. */
  fausser: (base: string, bon: string) => string | null;
}
export const FAUTES_TEXTE: FauteTexte[] = [
  { id: 'texte-non-traduit', doc: 'doc5', code: 'langue', note: 'un mot allemand resté dans nameFr', choisir: entrees => entrees.findIndex(entree => motsDe(entree.base).some(inLexique)), fausser: base => base },
  { id: 'texte-marque-perdue', doc: 'doc6', code: 'marque', note: 'une marque ou une référence perdue', choisir: entrees => entrees.findIndex(entree => jetonsGardes(entree.base).length > 0), fausser: () => 'Article courant' },
  { id: 'texte-unite', doc: 'doc7', code: 'unite', note: 'un suffixe d’unité gardé', choisir: entrees => (entrees.length ? 0 : -1), fausser: (_base, bon) => `${bon}, Kg` },
  { id: 'texte-chiffre-perdu', doc: 'doc8', code: 'chiffre', note: 'un chiffre du nom coupé', choisir: entrees => entrees.findIndex(entree => chiffresDe(entree.base).length > 0),
    fausser: (base, bon) => { const chiffre = chiffresDe(base)[0]; return bon.split(/\s+/).filter(mot => canonMot(mot) !== chiffre).join(' ') || 'Article'; } },
  { id: 'texte-identite', doc: 'doc3', code: 'identite', note: 'une désignation déjà française retouchée', choisir: entrees => entrees.findIndex(entree => dejaFrancais(entree.base)), fausser: (_base, bon) => `${bon} remplacé` },
  { id: 'texte-incoherent', doc: 'doc12', code: 'incoherent', note: 'la même base, un autre français que dans la pièce 11', choisir: (entrees, toutes) => {
    const autre = toutes.get('doc11'); if (!autre) return -1;
    const cles = new Set(autre.entrees.map(entree => cleBase(entree.base)));
    return entrees.findIndex(entree => cles.has(cleBase(entree.base)));
  }, fausser: (_base, bon) => `${bon} bis` },
  { id: 'texte-manquant', doc: 'doc2', code: 'manquant', note: 'une entrée absente de la réponse', choisir: entrees => (entrees.length ? 0 : -1), fausser: () => null }
];
export interface FauteAppliquee { fault: string; doc: string; modele: ModeleTag; rang: number; code: DefautTexte; cle: string }
/** Le « français » du banc simulé : les mots du lexique sont remplacés, tout le reste (marque, nom propre, nombres, ponctuation) est recopié. */
export const traductionSimulee = (base: string): string => base.replace(/[\p{L}\p{N}]+/gu, mot => LEXIQUE_FR[canonMot(mot)] ?? mot);

/** La réponse fabriquée d'un appel : le « français » du banc (`fakeFrench`) pour chaque entrée, les fautes du plan appliquées. */
export function reponseSimulee(model: string, doc: string, modele: ModeleTag, plan: PlanPiece, toutes: ReadonlyMap<string, PlanPiece>, plan_fautes: readonly FauteTexte[], journal: FauteAppliquee[]): { json: any; ms: number } {
  const noms = plan.entrees.map(entree => ({ i: entree.i, nameFr: traductionSimulee(entree.base) }));
  const omis = new Set<number>();
  for (const faute of plan_fautes.filter(item => item.doc === doc)) {
    const at = faute.choisir(plan.entrees, toutes);
    if (at < 0) continue;
    const nouveau = faute.fausser(plan.entrees[at].base, noms[at].nameFr);
    if (nouveau === null) omis.add(at); else noms[at].nameFr = nouveau;
    if (!journal.some(entry => entry.fault === faute.id && entry.modele === modele)) journal.push({ fault: faute.id, doc, modele, rang: plan.entrees[at].i, code: faute.code, cle: cleBase(plan.entrees[at].base) });
  }
  const text = JSON.stringify({ noms: noms.filter((_nom, at) => !omis.has(at)) });
  const sortie = Math.round(text.length / 3.2), entree = Math.round((SYSTEME_NOMS_FR.length + JSON.stringify({ entrees: plan.entrees }).length) / 3);
  const fort = model === STRONG_MODEL;
  return {
    json: { modelVersion: model, candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text }] } }], usageMetadata: { promptTokenCount: entree, candidatesTokenCount: sortie, thoughtsTokenCount: 0, totalTokenCount: entree + sortie } },
    ms: (fort ? 2500 : 900) + sortie * (fort ? 6 : 3)
  };
}

export interface ControleSimulation { present: number; trouvees: number; manquees: string[]; accusees: string[]; ok: boolean }
/** Chaque fausse traduction fabriquée est retrouvée sous son défaut, et aucune autre ligne n'est accusée. */
export function controlerSimulation(appels: readonly Appel[], fautes: readonly FauteAppliquee[], genres?: ReadonlyMap<string, string>): ControleSimulation {
  const stats = jugerAppels(appels, genres);
  let present = 0, trouvees = 0;
  const manquees: string[] = [], accusees: string[] = [], attendues = new Set<string>(), fausses = new Set<string>();
  for (const faute of fautes) {
    // toutes les lignes d'une pièce qui portent la base de l'entrée faussée partagent la faute
    const paires = (stats[faute.modele]?.paires ?? []).filter(item => item.doc === faute.doc && cleBase(item.base) === faute.cle);
    if (!paires.length) continue;
    present++; fausses.add(faute.cle); attendues.add(`${faute.modele}|${faute.doc}|${faute.cle}`);
    if (paires.some(paire => paire.defauts.includes(faute.code))) trouvees++; else manquees.push(`${faute.fault} (${faute.doc}, ${faute.modele})`);
  }
  for (const [modele, s] of Object.entries(stats)) for (const paire of s.paires) {
    const cle = cleBase(paire.base);
    if (attendues.has(`${modele}|${paire.doc}|${cle}`)) continue;
    // une base faussée dans une pièce est incohérente avec les autres pièces qui la portent : attendu
    const defauts = paire.defauts.filter(code => !(code === 'incoherent' && fausses.has(cle)));
    if (defauts.length) accusees.push(`${paire.doc} ${modele} ligne ${paire.rang + 1} : ${defauts.join(', ')}`);
  }
  return { present, trouvees, manquees, accusees, ok: present > 0 && trouvees === present && accusees.length === 0 };
}

// ---------------------------------------------------------------------------------------------------------------------
// La source : les lignes finales d'une sortie du banc
// ---------------------------------------------------------------------------------------------------------------------
export interface Source { plans: PlanPiece[]; cas: BenchCase[] }
export function chargerSource(dir: string = SOURCE_PAR_DEFAUT, variante: string = VARIANTE_SOURCE): Source {
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8'));
  const plans: PlanPiece[] = [];
  for (const record of file.records) {
    const items = record.variants?.[variante]?.result?.items;
    if (Array.isArray(items) && record.tirage === 1) plans.push(planPiece(record.doc, items));
  }
  if (!plans.length) throw new Error(`Aucune ligne finale pour ${variante} dans ${dir}.`);
  let cas: BenchCase[] = [];
  try { cas = loadCases((file.meta?.casFiles ?? []).map((name: string) => CAS_FILES.find(candidate => path.basename(candidate) === name) ?? casPath(name))); } catch { cas = []; }
  return { plans, cas };
}
/** Impaires : pour choisir le réglage ; paires : pour le juger (L20). */
export function filtrerPieces(plans: PlanPiece[], lot: string | undefined, docs?: string[]): PlanPiece[] {
  const numero = (doc: string) => Number(doc.replace(/\D/g, ''));
  return plans.filter(plan => (!docs || docs.includes(plan.doc)) && (lot === 'impaires' ? numero(plan.doc) % 2 === 1 : lot === 'paires' ? numero(plan.doc) % 2 === 0 : true));
}

// ---------------------------------------------------------------------------------------------------------------------
// Budget : la réserve au pire d'un appel texte (entrée estimée de la requête, sortie au plafond)
// ---------------------------------------------------------------------------------------------------------------------
export function entreeEstimee(entrees: Entree[]): number { return Math.ceil(((SYSTEME_NOMS_FR.length + JSON.stringify({ entrees }).length) / 2.5) * 1.5); }
export function reserveTexte(model: string, entrees: Entree[]): number {
  const maxOut = maxSortie(entrees.length), input = entreeEstimee(entrees);
  const quote = quoteGeminiCost(model, { generationConfig: { maxOutputTokens: maxOut } });
  const worst = observedGeminiCostDetails(quote, { usageMetadata: { promptTokenCount: input, candidatesTokenCount: maxOut, thoughtsTokenCount: 0, totalTokenCount: input + maxOut } });
  if (!worst) throw new Error('Réserve indisponible : tarif inconnu.');
  return worst.chargedMicroChf;
}

export interface OptionsTexte {
  mode: 'simuler' | 'payant'; modeles: ModeleTag[]; lot?: string; docs?: string[]; out?: string; budgetChf?: number; plafondPasse?: number; source?: string; variante?: string; reprendre?: string;
}
export interface EstimationTexte { lignes: Array<{ modele: ModeleTag; appels: number; reserveMicro: number }>; appels: number; reserveMicro: number; text: string[] }
export function estimerTexte(plans: PlanPiece[], modeles: ModeleTag[], plafondPasse?: number, journalise = 0, prets: ReadonlySet<string> = new Set()): EstimationTexte {
  const lignes = modeles.map(modele => {
    let appels = 0, reserveMicro = 0;
    for (const plan of plans) { if (!plan.entrees.length || prets.has(`${plan.doc}|${modele}`)) continue; appels++; reserveMicro += reserveTexte(MODELES[modele], plan.entrees); }
    return { modele, appels, reserveMicro };
  });
  const appels = lignes.reduce((sum, ligne) => sum + ligne.appels, 0), reserveMicro = lignes.reduce((sum, ligne) => sum + ligne.reserveMicro, 0);
  const text = [`Estimation (aucun réseau, aucune clé) : ${plans.length} pièces, un appel texte seul par pièce et par modèle, réflexion LOW, bases dédoublonnées.`,
    ...lignes.map(ligne => `- ${MODELES[ligne.modele]} : ${ligne.appels} appels, réserve au pire ${(ligne.reserveMicro / 1e6).toFixed(4)} CHF.`),
    `Déjà journalisé ${(journalise / 1e6).toFixed(4)} CHF. La réserve compte la sortie au plafond de chaque appel : la dépense réelle est bien en dessous.`];
  if (plafondPasse !== undefined) text.push(`Plafond de passe ${plafondPasse} CHF : la réserve maximale ${reserveMicro <= plafondPasse * 1e6 ? 'tient dedans' : 'le dépasse (la passe s’arrêtera net avant le dépassement)'}.`);
  text.push(`BANC ESTIME ${(reserveMicro / 1e6).toFixed(4)} CHF ${appels} appels`);
  return { lignes, appels, reserveMicro, text };
}

// ---------------------------------------------------------------------------------------------------------------------
// La passe
// ---------------------------------------------------------------------------------------------------------------------
export interface DepsTexte { plans?: PlanPiece[]; transport?: Transport; readKey?: () => string | undefined; optIn?: (label: string, command: string) => void; journalPath?: string; log?: (line: string) => void; genres?: Map<string, string> }
export interface SortieTexte { outDir: string; appels: Appel[]; fautes: FauteAppliquee[]; stopped?: string; stats: Record<string, StatsTexte> }
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);

export async function runNomsFr(options: OptionsTexte, deps: DepsTexte = {}): Promise<SortieTexte> {
  const simule = options.mode === 'simuler', log = deps.log ?? (line => console.log(line));
  let genres = deps.genres ?? new Map<string, string>(), plans = deps.plans;
  if (!plans) { const source = chargerSource(options.source, options.variante); plans = source.plans; genres = new Map(source.cas.map(c => [c.id, genreOfCase(c)])); }
  const toutes = new Map(plans.map(plan => [plan.doc, plan]));
  const pieces = filtrerPieces(plans, options.lot, options.docs);
  if (!pieces.length) throw new Error('Aucune pièce à traduire.');
  const outDir = path.resolve(options.out ?? (simule ? path.join(tmpdir(), `noms-fr-sim-${stamp()}`) : path.join(REELS_DIR, `banc-f5b-${stamp()}`)));
  mkdirSync(path.join(outDir, 'raw'), { recursive: true });
  const journalPath = deps.journalPath ?? (simule ? path.join(outDir, 'journal-gemini.md') : MISSION_JOURNAL);
  const fautesLog: FauteAppliquee[] = [];

  let transport: Transport, budget: Budget;
  let restoreFetch = () => {};
  if (simule) {
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => { throw new Error('Réseau interdit en simulation.'); }) as typeof fetch;
    restoreFetch = () => { globalThis.fetch = realFetch; };
    const modeleDe = new Map(Object.entries(MODELES).map(([tag, model]) => [model, tag as ModeleTag]));
    transport = deps.transport ?? (async (model, _body, meta) => reponseSimulee(model, meta.doc, modeleDe.get(model)!, toutes.get(meta.doc)!, toutes, FAUTES_TEXTE, fautesLog));
    budget = new Budget(Number.MAX_SAFE_INTEGER);
  } else {
    (deps.optIn ?? ((label: string, command: string) => requirePaidAiTestOptIn({ label, command })))(
      `Banc des noms en français, texte seul (${pieces.length} pièces × ${options.modeles.join(' et ')}, budget ${options.budgetChf} CHF)`,
      `npx tsx scripts/banc-noms-fr.ts --payant --budget-chf ${options.budgetChf} --lot ${options.lot ?? 'toutes'} --confirm-paid-ai`);
    const key = (deps.readKey ?? (() => readLocalKey()))();
    if (!key) throw new Error('Aucune clé Gemini locale. Aucun appel.');
    const budgetChf = options.budgetChf ?? 0;
    if (!(budgetChf > 0 && budgetChf <= BUDGET_CAP_CHF)) throw new Error(`Le mode --payant exige --budget-chf <= ${BUDGET_CAP_CHF}. Aucun appel.`);
    transport = deps.transport ?? realTransport(key);
    const avant = spentInJournal(journalPath);
    budget = new Budget(Math.round(budgetChf * 1e6), avant, Math.round((options.plafondPasse ?? DEFAULT_PASS_CAP_CHF) * 1e6));
    log(`Plafond de la passe ${options.plafondPasse ?? DEFAULT_PASS_CAP_CHF} CHF ; budget ${budgetChf} CHF, déjà journalisé ${(avant / 1e6).toFixed(4)} CHF.`);
  }

  // Prêt : un appel déjà payé (même pièce, même modèle, mêmes entrées) d'une sortie précédente est rejoué, ni payé ni journalisé
  const prete = new Map<string, Appel>();
  if (options.reprendre) {
    const ancien = JSON.parse(readFileSync(path.join(path.resolve(options.reprendre), 'results.json'), 'utf8')) as { appels: Appel[] };
    for (const appel of ancien.appels) if (appel.noms) prete.set(`${appel.doc}|${appel.modele}`, appel);
  }

  const appels: Appel[] = [];
  let stopped: string | undefined, echecs = 0;
  const save = () => writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify({ meta: { mode: options.mode, modeles: options.modeles, lot: options.lot ?? 'toutes', source: options.source ?? 'banc-d272b-hl', variante: options.variante ?? VARIANTE_SOURCE,
    stopped: stopped ?? null, spentChf: simule ? null : budget.spentMicro / 1e6 }, appels, fautes: fautesLog }, null, 1)}\n`);

  const appeler = async (plan: PlanPiece, modele: ModeleTag): Promise<Appel> => {
    const model = MODELES[modele], base = { doc: plan.doc, modele, model, plan };
    const pret = prete.get(`${plan.doc}|${modele}`);
    if (pret && JSON.stringify(pret.plan.entrees) === JSON.stringify(plan.entrees)) return { ...pret, lent: true };
    const body = buildNomsBody(plan.entrees);
    const quote = quoteGeminiCost(model, body);
    const reserve = budget.reserve(reserveTexte(model, plan.entrees));
    const meta = { id: `NomsFr-${modele}`, doc: plan.doc, tirage: 1, variant: 'NomsFr', lecture: 1 as const, model };
    const debut = Date.now();
    let appel: Appel;
    try {
      const reponse = await transport(model, quote.body, meta, AbortSignal.timeout(TIMEOUT_MS));
      const cout = observedGeminiCostDetails(quote, reponse.json)?.chargedMicroChf ?? null, lu = parseNoms(reponse.json, plan.entrees);
      const usage = reponse.json?.usageMetadata ?? {};
      appel = { ...base, noms: lu.noms, ms: reponse.ms, inputTokens: usage.promptTokenCount ?? null, outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0), costMicroChf: cout, state: lu.state };
      writeFileSync(path.join(outDir, 'raw', `${plan.doc}-${modele}.json`), JSON.stringify(reponse.json));
    } catch (error: any) {
      appel = { ...base, noms: null, ms: Date.now() - debut, inputTokens: null, outputTokens: null, costMicroChf: typeof error?.httpStatus === 'number' ? 0 : null,
        state: typeof error?.httpStatus === 'number' ? `HTTP ${error.httpStatus}` : 'erreur' };
    }
    budget.settle(reserve, appel.costMicroChf);
    const pseudo: Reading = { meta, ok: appel.noms !== null, ms: appel.ms, cause: null, finishReason: null, inputTokens: appel.inputTokens, outputTokens: appel.outputTokens, costMicroChf: appel.costMicroChf, state: appel.state };
    appendJournal(journalPath, pseudo, budget.spentMicro, simule, appel.costMicroChf ?? reserve);
    echecs = appel.noms ? 0 : echecs + 1;
    if (echecs >= 3) throw new BudgetStop('Trois appels en échec d’affilée : arrêt net.');
    return appel;
  };

  try {
    for (const plan of pieces) {
      if (!plan.entrees.length) continue;
      try {
        const faits = [];
        for (const modele of options.modeles) faits.push(await appeler(plan, modele));
        appels.push(...faits);
        log(`${plan.doc} : ${plan.entrees.length} noms de base (sur ${plan.lignes.length} lignes) — ${faits.map(appel => `${appel.modele} ${Math.round(appel.ms / 100) / 10} s`).join(' · ')}`);
        save();
      } catch (error) {
        if (!(error instanceof BudgetStop)) throw error;
        stopped = error.message; log(`ARRÊT : ${stopped}`); break;
      }
    }
  } finally { restoreFetch(); }
  save();
  const stats = jugerAppels(appels, genres);
  return { outDir, appels, fautes: fautesLog, stopped, stats };
}

// ---------------------------------------------------------------------------------------------------------------------
// Le tableau publiable (comptes) et les paires (privées)
// ---------------------------------------------------------------------------------------------------------------------
const sec = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} s`);
const mediane = (valeurs: number[]) => { if (!valeurs.length) return null; const s = [...valeurs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const francs = (micro: number | null) => (micro === null ? '—' : (micro / 1e6).toFixed(4).replace('.', ','));
export function renderTexte(stats: Record<string, StatsTexte>): string[] {
  const ids = Object.keys(stats) as ModeleTag[];
  if (!ids.length) return ['Aucun appel.'];
  const nom = (tag: string) => MODELES[tag as ModeleTag] ?? tag;
  const L = (label: string, pick: (s: StatsTexte) => string) => `| ${label} | ${ids.map(id => pick(stats[id])).join(' | ')} |`;
  const lignes = ['## Désignation en français, texte seul — comptes seulement', '', `| | ${ids.map(nom).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`,
    L('Appels (sans réponse)', s => `${s.appels} (${s.appelsSansReponse})`), L('Lignes sans défaut / lignes', s => `${s.sansDefaut} / ${s.lignes}`)];
  for (const code of DEFAUTS_TEXTE) lignes.push(L(`défaut « ${code} »`, s => String(s.defauts[code])));
  lignes.push(L('Durée médiane par pièce', s => sec(mediane(s.ms))), L('Durée maximale par pièce', s => sec(s.ms.length ? Math.max(...s.ms) : null)),
    L('Jetons d’entrée / de sortie (médiane par pièce)', s => `${mediane(s.entrees) ?? '—'} / ${mediane(s.sorties) ?? '—'}`),
    L('Coût total (CHF)', s => francs(s.coutMicro.some(c => c === null) ? null : s.coutMicro.reduce<number>((sum, c) => sum + (c ?? 0), 0))));
  for (const id of ids) {
    lignes.push('', `### ${nom(id)} — par pièce et par genre (lignes sans défaut / lignes)`, '', '| pièce | lignes |', '|---|---|');
    for (const doc of Object.keys(stats[id].parDoc).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')))) lignes.push(`| ${doc} | ${stats[id].parDoc[doc].sansDefaut} / ${stats[id].parDoc[doc].lignes} |`);
    lignes.push('', ...Object.entries(stats[id].parGenre).map(([genre, c]) => `- ${genre} : ${c.sansDefaut} / ${c.lignes}`));
  }
  lignes.push('', 'Les règles sont des indices (lexique allemand, anglais, italien ; marque, chiffre, option, unité, identité, cohérence) : le verdict final est la lecture des paires (base, français) du fichier privé `noms-fr-texte-paires.json`.');
  return lignes;
}
export function ecrireSortie(sortie: SortieTexte) {
  writeFileSync(path.join(sortie.outDir, 'RESULTAT-NOMS-FR-TEXTE.md'), `${['# Désignation en français, texte seul — résultat', '', ...renderTexte(sortie.stats)].join('\n')}\n`);
  writeFileSync(path.join(sortie.outDir, 'noms-fr-texte-paires.json'), `${JSON.stringify(Object.fromEntries(Object.entries(sortie.stats).map(([modele, s]) => [modele, s.paires])), null, 1)}\n`);
}
export function resume(stats: Record<string, StatsTexte>): string[] {
  return Object.entries(stats).map(([modele, s]) => `${MODELES[modele as ModeleTag]} : ${s.sansDefaut}/${s.lignes} lignes sans défaut, ${DEFAUTS_TEXTE.map(code => `${code} ${s.defauts[code]}`).join(', ')}, durée médiane ${sec(mediane(s.ms))}, coût ${francs(s.coutMicro.some(c => c === null) ? null : s.coutMicro.reduce<number>((sum, c) => sum + (c ?? 0), 0))} CHF`);
}

// ---------------------------------------------------------------------------------------------------------------------
// Ligne de commande
// ---------------------------------------------------------------------------------------------------------------------
export function parseArgsTexte(argv: string[]): OptionsTexte & { estimer: boolean; juger?: string } {
  const args = argv.filter(arg => arg !== '--');
  const value = (flag: string) => { const at = args.indexOf(flag); return at >= 0 ? args[at + 1] : undefined; };
  const payant = args.includes('--payant'), simuler = args.includes('--simuler');
  if (payant && simuler) throw new Error('--payant et --simuler s’excluent.');
  const tags = (value('--modeles') ?? 'lite,38').split(',').map(item => item.trim()).filter(Boolean);
  const inconnus = tags.filter(tag => !(tag in MODELES));
  if (inconnus.length || !tags.length) throw new Error(`--modeles attend une liste parmi lite, 38 (reçu : ${inconnus.join(', ') || 'rien'}).`);
  const lot = value('--lot');
  if (lot !== undefined && !['impaires', 'paires', 'toutes'].includes(lot)) throw new Error('--lot attend impaires, paires ou toutes.');
  const budgetChf = value('--budget-chf') === undefined ? undefined : Number(value('--budget-chf'));
  const plafond = value('--plafond-passe') === undefined ? undefined : Number(value('--plafond-passe'));
  if (plafond !== undefined && !(plafond > 0)) throw new Error('--plafond-passe attend un montant en CHF supérieur à 0.');
  return { mode: payant ? 'payant' : 'simuler', modeles: [...new Set(tags)] as ModeleTag[], lot, docs: value('--docs')?.split(',').map(item => item.trim()).filter(Boolean), out: value('--out'), budgetChf,
    plafondPasse: plafond ?? (payant ? DEFAULT_PASS_CAP_CHF : undefined), source: value('--source'), variante: value('--variante'), reprendre: value('--reprendre'), estimer: args.includes('--estimer'), juger: value('--juger') };
}

/** Lancé seulement comme script (tsx : le nom du script est dans argv[1]) : jamais sous vitest. */
const isMain = () => !process.env.VITEST && /banc-noms-fr\.ts$/.test(process.argv[1] ?? '') && ['--simuler', '--payant', '--estimer', '--juger'].some(flag => process.argv.includes(flag));
if (isMain()) {
  (async () => {
    const options = parseArgsTexte(process.argv.slice(2));
    if (options.juger) {
      const dir = path.resolve(options.juger), file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { appels: Appel[]; fautes?: FauteAppliquee[] };
      const source = chargerSource(options.source, options.variante), genres = new Map(source.cas.map(c => [c.id, genreOfCase(c)]));
      const sortie: SortieTexte = { outDir: dir, appels: file.appels, fautes: file.fautes ?? [], stats: jugerAppels(file.appels, genres) };
      ecrireSortie(sortie); console.log(resume(sortie.stats).join('\n')); console.log(`Tableau : ${path.join(dir, 'RESULTAT-NOMS-FR-TEXTE.md')} ; paires privées : ${path.join(dir, 'noms-fr-texte-paires.json')}`);
      return;
    }
    if (options.estimer) {
      const { plans } = chargerSource(options.source, options.variante), pieces = filtrerPieces(plans, options.lot, options.docs);
      console.log(estimerTexte(pieces, options.modeles, options.plafondPasse, spentInJournal(MISSION_JOURNAL)).text.join('\n'));
      return;
    }
    const sortie = await runNomsFr(options);
    ecrireSortie(sortie);
    console.log(resume(sortie.stats).join('\n'));
    console.log(`Tableau : ${path.join(sortie.outDir, 'RESULTAT-NOMS-FR-TEXTE.md')} ; paires privées : ${path.join(sortie.outDir, 'noms-fr-texte-paires.json')}`);
    if (options.mode === 'simuler') {
      const source = chargerSource(options.source, options.variante), controle = controlerSimulation(sortie.appels, sortie.fautes, new Map(source.cas.map(c => [c.id, genreOfCase(c)])));
      if (controle.ok) console.log(`NOMS FR TEXTE SIMULE OK — ${controle.trouvees}/${controle.present} fausses traductions fabriquées retrouvées, aucune autre ligne accusée, aucun réseau.`);
      else { console.log(`NOMS FR TEXTE SIMULE ECHEC — retrouvées ${controle.trouvees}/${controle.present}, manquées : ${controle.manquees.join(' ; ') || 'aucune'}, accusées à tort : ${controle.accusees.join(' ; ') || 'aucune'}.`); process.exit(1); }
    }
  })().then(() => process.exit(0), error => { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
}
