/**
 * Banc de la voie t2a (mission 2026-11-14-gemini4, tour 2) : import de recette, relecture, COA houblon, fiche de variété de houblon.
 * Une cellule = `modèle@réflexion` ; le corps est celui de la production (`geminiBody` + `TASKS`), seuls le modèle et la réflexion changent.
 * Vérité écrite AVANT les passes : `voies/t2a/cas-t2a.json`, règles de notation : `voies/t2a/VERITE.md`.
 *
 * RÈGLEMENT (décision du pilote, 14.11) : jetons + requêtes de recherche LUES dans la réponse (`groundingMetadata.webSearchQueries`),
 * au tarif officiel (14 $ les 1 000 requêtes, https://ai.google.dev/gemini-api/docs/pricing, lu le 14.11.2026 ; ×1,25 CHF/USD de provision = 0,0175 CHF).
 * Une réponse ancrée qui ne dit pas ses requêtes est comptée « ancrage non prouvé » : sa recherche éventuelle n'est pas facturée ici,
 * le tableau le dit (colonne dédiée) et la borne haute est donnée. Ce n'est jamais présenté comme une facture.
 * Argon et Carbon : tarif doublé le 1.12.2026 (`coutDecembre` de banc-lecture-modeles).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TASKS } from '../functions/src/prompts';
import { TIERS } from '../functions/src/models';
import { geminiBody, userTextOf } from '../functions/src/geminiBody';
import { geminiRestBody } from '../functions/src/brewerHarness';
import { assertModeleBanc, coutDecembre, estGemini4, parseFort, type Fort } from './banc-lecture-modeles';
import { coutAppel, envoyerReseau, reserveAppel, requetesWeb, sommeJournal, type EnvBanc } from './banc-compagnon';
import { percentile } from './banc-compagnon-grille';
import { readLocalKey } from './gemini-usage-bench-guard.mjs';
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

export const MISSION_DIR = 'work/missions/2026-11-14-gemini4';
export const VOIE_DIR = `${MISSION_DIR}/voies/t2a`;
export const JOURNAL_TOUR2 = `${MISSION_DIR}/journal-tour2.md`;
export const VOIE = 't2a';
export const PLAFOND_VOIE_CHF = 5;
export const PLAFOND_TOUR_CHF = 14.5;
export const MICRO_PAR_REQUETE = 17_500;
export const MENTION_TARIF = 'Argon et Carbon : 2 $ / 10 $ le million jusqu’au 30.11.2026, 4 $ / 20 $ dès le 1.12.2026 (tarif doublé) ; Hydrogen et 3.8 : 1,5 $ / 7,5 $, inchangés.';
/** Le plafond de sortie des cellules Gemini 4 : la réflexion compte dans la sortie (g1), et la production en met 8000 pour l'import et la relecture. */
export const SORTIE_QUATRE = 12_000;

export type Usage = 'import' | 'relecture' | 'coa' | 'variete';
export const USAGES: readonly Usage[] = ['import', 'relecture', 'coa', 'variete'];
const TACHE: Record<Usage, string> = { import: 'importRecipe', relecture: 'reviewRecipe', coa: 'readHopCoa', variete: 'lookupHopVariety' };
const ANCRE: Record<Usage, boolean> = { import: true, relecture: false, coa: false, variete: true };

type Json = Record<string, any>;
export interface Cas { id: string; usage: Usage; half: 'choix' | 'jugement'; instruction?: string; context?: unknown; file?: string; mimeType?: string; task?: string; expected: Json }

// ---------------------------------------------------------------------------------------------------------------------
// Cellules
// ---------------------------------------------------------------------------------------------------------------------
export interface Cellule { id: string; model: string; level: string }
const ALIAS: Record<string, string> = { prod: 'gemini-3.8-flash', '3.8': 'gemini-3.8-flash', lite: 'gemini-3.5-flash-lite', hy: 'gemini-4-hydrogen', hydrogen: 'gemini-4-hydrogen', ar: 'gemini-4-argon', argon: 'gemini-4-argon', ca: 'gemini-4-carbon', carbon: 'gemini-4-carbon' };
/** `hy@low`, `3.8@low`, `lite@minimal`, `gemini-4-argon@medium`. Un niveau refusé par le modèle ne part jamais (parseFort). */
export function parseCellule(texte: string): Cellule {
  const [nom, niveau = 'low'] = texte.split('@').map(x => x.trim().toLowerCase());
  const model = ALIAS[nom] ?? nom;
  if (model === 'gemini-3.5-flash-lite') {
    if (!['minimal', 'low', 'medium', 'high'].includes(niveau)) throw new Error(`Niveau ${niveau} refusé pour Flash-Lite.`);
    return { id: `lite@${niveau}`, model, level: niveau };
  }
  const fort: Fort = parseFort(`${model}@${niveau}`);
  const court = Object.entries(ALIAS).find(([k, v]) => v === model && k.length === 2)?.[0] ?? (model === 'gemini-3.8-flash' ? '3.8' : model);
  return { id: `${court}@${niveau}`, model, level: niveau };
}
const niveauApi = (c: Cellule) => estGemini4(c.model) ? c.level.toUpperCase() : c.level;

// ---------------------------------------------------------------------------------------------------------------------
// Corps : celui de la production, avec le modèle et la réflexion de la cellule
// ---------------------------------------------------------------------------------------------------------------------
const fichier = (cas: Cas) => ({ data: readFileSync(cas.file!).toString('base64'), mimeType: cas.mimeType! });
/** Le client du COA (HopIndexPanel) envoie `{ fileName, variety }` en contexte : sans lui le texte de l'utilisateur serait vide. */
export const contexteDe = (cas: Cas): unknown => cas.context ?? (cas.usage === 'coa' && cas.file ? { fileName: path.basename(cas.file) } : undefined);
export function corpsCas(cas: Cas, cellule: Cellule): Json {
  const def: any = (TASKS as any)[cas.task ?? TACHE[cas.usage]];
  const reflexion = estGemini4(cellule.model) ? 'low' : cellule.level; // remplacé juste après : geminiBody ne connaît que les niveaux de la production
  const corps = geminiBody({
    systemPrompt: def.system, userText: userTextOf(cas.instruction, contexteDe(cas)), schema: def.schema, settings: { temperature: TIERS.fast.temperature, thinkingLevel: reflexion as any },
    file: cas.file ? fichier(cas) : undefined, grounded: !!def.grounded, maxOutputTokens: def.maxOutputTokens
  }) as Json;
  const config = { ...corps.generationConfig, thinkingConfig: { thinkingLevel: niveauApi(cellule) } };
  if (estGemini4(cellule.model) || cellule.level === 'high') config.maxOutputTokens = Math.max(Number(config.maxOutputTokens ?? 0), SORTIE_QUATRE);
  return { ...corps, generationConfig: config };
}

// ---------------------------------------------------------------------------------------------------------------------
// Notation (VERITE.md) : une note 0..1, des inutilisables, des inventés
// ---------------------------------------------------------------------------------------------------------------------
export interface Note { note: number | null; utilisable: boolean; inventes: number; critique: boolean; detail: string }
export const canon = (v: unknown) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const motif = (pattern: string, texte: unknown) => new RegExp(pattern, 'i').test(canon(texte));
const proche = (reel: unknown, attendu: number, tol: number) => typeof reel === 'number' && Math.abs(reel - attendu) <= Math.max(tol * Math.abs(attendu), 1e-9);
const procheAbs = (reel: unknown, attendu: number, delta: number) => typeof reel === 'number' && Math.abs(reel - attendu) <= delta;
const fraction = (oks: boolean[]) => oks.length ? oks.filter(Boolean).length / oks.length : 1;
const moyennePonderee = (parts: Array<[number, number | null]>) => {
  const utiles = parts.filter(([, v]) => v !== null) as Array<[number, number]>;
  const poids = utiles.reduce((s, [p]) => s + p, 0);
  return poids ? utiles.reduce((s, [p, v]) => s + p * v, 0) / poids : 0;
};
const arr = (v: unknown): Json[] => Array.isArray(v) ? v : [];

/** Le programme d'empâtage peut venir de `mashSteps`, de `mash.steps` ou de `steps` (le schéma de production prévoit les trois ; le serveur les rassemble). */
export const programmeEmpatage = (r: Json): Json[] => [...arr(r.mashSteps), ...arr(r.mash?.steps), ...arr(r.steps)];
/** Amendement du 14.11 (après la passe 1, appliqué à toutes les cellules) : un houblon cité une seconde fois sans alpha dans le texte peut rester sans alpha ; 3.5 reste accepté. */
export const alphaFacultatif = (e: Json, k: number): boolean => e.hops.slice(0, k).some((h: Json) => h.name === e.hops[k].name && h.alpha === e.hops[k].alpha);
export function noteImport(r: Json | undefined, e: Json, sourceTop = false): Note {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { note: 0, utilisable: false, inventes: 0, critique: true, detail: 'pas de JSON' };
  const fer = arr(r.fermentables), hops = arr(r.hops), paliers = programmeEmpatage(r), ajouts = arr(r.adjuncts);
  const identite = fraction([canon(r.name).includes(canon(e.name)), procheAbs(r.ogTarget, e.ogTarget, e.tolOg), procheAbs(r.fgTarget, e.fgTarget, e.tolOg)]);
  const volume = proche(r.volumeL, e.volumeL, 0.01);
  const okFer = e.fermentables.map((x: Json) => fer.some(i => motif(x.name, i?.name) && proche(i?.weightKg, x.weightKg, 0.02) && (!x.kind || i?.kind === x.kind)));
  const okHops = e.hops.map((x: Json, k: number) => hops.some(i => motif(x.name, i?.name) && proche(i?.weightG, x.weightG, 0.03) && (x.alpha === null ? (i?.alpha === null || i?.alpha === undefined || sourceTop) : procheAbs(i?.alpha, x.alpha, 0.05) || (alphaFacultatif(e, k) && (i?.alpha === null || i?.alpha === undefined)))
    && x.stages.includes(i?.stage) && (x.timeMin === undefined || i?.timeMin === x.timeMin) && (x.dayOffset === undefined || i?.dayOffset === x.dayOffset)));
  const levure = motif(e.yeast, `${r.yeast?.name ?? ''} ${r.yeast?.strain ?? ''}`);
  const mash = e.mashSteps.map((x: Json) => paliers.some(i => procheAbs(i?.tempC, x.tempC, 0.6) && i?.durationMin === x.durationMin));
  const ajoutsOk = e.adjuncts ? fraction(e.adjuncts.map((x: string) => ajouts.some(i => motif(x, `${i?.name} ${i?.notes ?? ''}`)))) : null;
  const inventes = Math.max(0, fer.length - e.nbFermentables) + Math.max(0, hops.length - e.nbHops)
    + e.hops.filter((x: Json) => x.alpha === null).reduce((s: number, x: Json) => s + hops.filter(i => motif(x.name, i?.name) && typeof i?.alpha === 'number' && !sourceTop).length, 0);
  const absent = okFer.some((ok: boolean) => !ok) && e.fermentables.some((x: Json, k: number) => !okFer[k] && !fer.some(i => motif(x.name, i?.name)));
  const note = moyennePonderee([[0.10, identite], [0.25, fraction(okFer)], [0.30, fraction(okHops)], [0.10, levure ? 1 : 0], [0.15, fraction(mash)], [0.10, ajoutsOk]]);
  const utilisable = volume && !absent;
  return { note, utilisable, inventes, critique: !utilisable, detail: `id ${identite.toFixed(2)} · vol ${r.volumeL} · fer ${okFer.filter(Boolean).length}/${okFer.length} · hops ${okHops.filter(Boolean).length}/${okHops.length} · levure ${levure ? 'ok' : 'non'} · paliers ${mash.filter(Boolean).length}/${mash.length}${inventes ? ` · ${inventes} inventé(s)` : ''}` };
}

const texteDefaut = (f: Json) => `${f?.topic ?? ''} ${f?.observation ?? ''} ${f?.suggestion ?? ''}`;
export function noteRelecture(r: Json | undefined, e: Json): Note {
  if (!r || typeof r !== 'object' || !Array.isArray(r.findings)) return { note: 0, utilisable: false, inventes: 0, critique: true, detail: 'pas de JSON ou findings absent' };
  const trouves = arr(e.defects).map(d => r.findings.some((f: Json) => motif(d.pattern, texteDefaut(f)) && d.severity.includes(f?.severity)));
  const bloquants = r.findings.filter((f: Json) => f?.severity === 'bloquant');
  const injustifies = bloquants.filter((f: Json) => !e.blockingAllowedPattern || !motif(e.blockingAllowedPattern, texteDefaut(f)));
  const sain = !arr(e.defects).length;
  const gout = r.findings.filter((f: Json) => ['gout', 'bloquant'].includes(f?.severity)).length;
  const manque = e.missingPattern ? (motif(e.missingPattern, `${arr(r.missing).join(' ')} ${r.findings.map(texteDefaut).join(' ')}`) ? 1 : 0) : null;
  const note = moyennePonderee([[1, 1], [4, sain ? null : fraction(trouves)], [2, injustifies.length ? 0 : 1], [1, manque], [1, sain ? (gout <= 1 ? 1 : 0) : null]]);
  return { note, utilisable: true, inventes: injustifies.length, critique: injustifies.length > 0, detail: `${trouves.filter(Boolean).length}/${trouves.length} défauts · ${bloquants.length} bloquant(s) dont ${injustifies.length} injustifié(s)${sain ? ` · ${gout} de goût ou pire` : ''}` };
}

const interdit = (a: Json, regles: Json[]) => regles.some(x => (!x.analyte || x.analyte === a?.analyte) && (!x.kind || x.kind === a?.kind) && (!x.unit || x.unit === a?.unit));
export function noteCoa(r: Json | undefined, e: Json): Note {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { note: 0, utilisable: false, inventes: 0, critique: true, detail: 'pas de JSON' };
  const analyses = arr(r.analysis);
  const ok = arr(e.analyses).map(x => analyses.some(a => a?.analyte === x.analyte && (proche(a?.value, x.value, 0.005) || proche(a?.limit, x.value, 0.005))));
  const intrus = analyses.filter(a => interdit(a, arr(e.forbidden))).length;
  const note = moyennePonderee([[1, r.found === e.found ? 1 : 0], [2, canon(r.lotNumber) === canon(e.lotNumber) ? 1 : 0], [2, r.harvestYear === e.harvestYear ? 1 : 0], [4, fraction(ok)], [3, intrus ? 0 : 1]]);
  return { note, utilisable: true, inventes: intrus, critique: intrus > 0 || r.found !== e.found, detail: `found ${r.found} · lot « ${r.lotNumber ?? ''} » · récolte ${r.harvestYear ?? '—'} · ${ok.filter(Boolean).length}/${ok.length} mesures · ${intrus} interdite(s)` };
}

export function noteVariete(r: Json | undefined, e: Json): Note {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return { note: 0, utilisable: false, inventes: 0, critique: true, detail: 'pas de JSON' };
  if (!e.found) {
    const inventes = arr(r.analysis).length + arr(r.descriptions).length;
    const note = moyennePonderee([[2, r.found === false ? 1 : 0], [3, inventes ? 0 : 1]]);
    return { note, utilisable: true, inventes, critique: r.found !== false || inventes > 0, detail: `found ${r.found} · ${inventes} élément(s) inventé(s)` };
  }
  const alpha = arr(r.analysis).filter(a => a?.analyte === 'alpha' && a?.unit === 'percentMass');
  const dansPlage = alpha.some(a => (typeof a?.value === 'number' && a.value >= e.alphaMin && a.value <= e.alphaMax) || (a?.range && a.range.min <= e.alphaMax && a.range.max >= e.alphaMin));
  const hors = alpha.filter(a => (typeof a?.value === 'number' && (a.value < e.alphaMin - 1 || a.value > e.alphaMax + 1))).length;
  const sourceCitee = /https?:\/\//.test(`${r.source ?? ''} ${arr(r.analysis).map(a => a?.source?.reference ?? '').join(' ')}`);
  const note = moyennePonderee([[3, r.found === true ? 1 : 0], [4, dansPlage ? 1 : 0], [3, sourceCitee ? 1 : 0]]);
  return { note, utilisable: true, inventes: hors, critique: r.found !== true, detail: `found ${r.found} · alpha ${dansPlage ? 'dans la plage' : 'absent ou hors plage'} · source ${sourceCitee ? 'citée' : 'non citée'}` };
}

export function noter(cas: Cas, json: Json | undefined): Note {
  switch (cas.usage) {
    case 'import': return noteImport(json, cas.expected, typeof json?.source === 'string' && json.source.trim().length > 3);
    case 'relecture': return noteRelecture(json, cas.expected);
    case 'coa': return noteCoa(json, cas.expected);
    default: return noteVariete(json, cas.expected);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Réponse : texte visible, JSON, ancrage
// ---------------------------------------------------------------------------------------------------------------------
export const texteVisible = (payload: any): string => arr(payload?.candidates?.[0]?.content?.parts).filter(p => typeof p?.text === 'string' && !p.thought).map(p => p.text).join('').trim();
export function jsonDe(payload: any): { json?: Json; raison?: string } {
  if (String(payload?.candidates?.[0]?.finishReason ?? '') === 'MAX_TOKENS') return { raison: 'coupée (MAX_TOKENS)' };
  const brut = texteVisible(payload).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!brut) return { raison: 'vide' };
  try { return { json: JSON.parse(brut) }; } catch { return { raison: 'JSON invalide' }; }
}
/** « lu N » : la réponse dit ses requêtes ; « non prouvé » : usage ancré dont la réponse n'a pas `webSearchQueries` ; « sans objet » : usage non ancré. */
export function ancrageDe(usage: Usage, payload: any): 'sans objet' | 'non prouvé' | `lu ${number}` {
  if (!ANCRE[usage]) return 'sans objet';
  const liste = payload?.candidates?.[0]?.groundingMetadata?.webSearchQueries;
  return Array.isArray(liste) ? `lu ${requetesWeb(payload)}` : 'non prouvé';
}

// ---------------------------------------------------------------------------------------------------------------------
// Journal commun du tour 2 : une ligne par appel, écrite juste après lui
// ---------------------------------------------------------------------------------------------------------------------
const TETE = ['# Journal des appels Gemini du tour 2 (mission 2026-11-14-gemini4)', '', 'Une ligne par appel, écrite juste après lui. Aucune valeur des documents. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD, marge de sécurité), pas une facture.', '',
  '| date | doc | tirage | variante | lecture | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |', '|---|---|---|---|---|---|---|---|---|---|---|---|', ''].join('\n');
export function ecrireJournal(fichierJournal: string, ligne: { doc: string; usage: string; cellule: Cellule; ms: number; entree: number | null; sortie: number | null; microChf: number; etat: string; simule: boolean }) {
  mkdirSync(path.dirname(fichierJournal), { recursive: true });
  if (!existsSync(fichierJournal)) { try { writeFileSync(fichierJournal, TETE, { flag: 'wx' }); } catch { /* créé entre-temps par une autre voie */ } }
  const cumul = sommeJournal(fichierJournal) + (ligne.simule ? 0 : ligne.microChf);
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const chf = (v: number) => (v / 1e6).toFixed(6);
  appendFileSync(fichierJournal, `| ${date} | ${ligne.doc} | 1 | ${VOIE}:${ligne.usage} | 1 | ${ligne.cellule.model}@${ligne.cellule.level} | ${ligne.ms} ms | ${ligne.entree ?? '?'} | ${ligne.sortie ?? '?'} | ${chf(ligne.microChf)} | ${chf(cumul)} | ${ligne.etat}${ligne.simule ? ' (SIMULÉ)' : ''} |\n`);
}

// ---------------------------------------------------------------------------------------------------------------------
// Un appel, une mesure
// ---------------------------------------------------------------------------------------------------------------------
export interface Mesure {
  cas: string; usage: Usage; half: string; cellule: string; ok: boolean; ms: number; microChf: number; microDecembre: number; entree: number | null; sortie: number | null;
  etat: string; ancrage: string; note: number | null; utilisable: boolean; inventes: number; detail: string; reponse?: string; erreur?: string;
}
export interface Env {
  journal: string; plafondTourMicro: number; plafondVoieMicro: number; plafondPasseMicro: number; depensePasseMicro: number; arret: { raison?: string }; simule: boolean;
  envoyer: EnvBanc['envoyer']; workers: number;
}
export class Arret extends Error { constructor(readonly raison: string) { super(`Arrêt du banc : ${raison}`); } }

export async function jouer(env: Env, cas: Cas, cellule: Cellule): Promise<Mesure> {
  if (env.arret.raison) throw new Arret(env.arret.raison);
  assertModeleBanc(cellule.model);
  const corps = corpsCas(cas, cellule);
  const maxSortie = Number(corps.generationConfig.maxOutputTokens);
  const reserve = reserveAppel(cellule.model, corps, maxSortie);
  const total = sommeJournal(env.journal), voie = sommeJournal(env.journal, VOIE);
  const trop = total + reserve > env.plafondTourMicro ? `plafond du tour (${(env.plafondTourMicro / 1e6).toFixed(2)} CHF, cumul ${(total / 1e6).toFixed(3)})`
    : voie + reserve > env.plafondVoieMicro ? `plafond de la voie ${VOIE} (${(env.plafondVoieMicro / 1e6).toFixed(2)} CHF, cumul voie ${(voie / 1e6).toFixed(3)})`
    : env.depensePasseMicro + reserve > env.plafondPasseMicro ? `plafond de la passe (${(env.plafondPasseMicro / 1e6).toFixed(2)} CHF)` : '';
  if (trop) { env.arret.raison = trop; throw new Arret(trop); }
  const base = { cas: cas.id, usage: cas.usage, half: cas.half, cellule: cellule.id };
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), 90_000);
  const debut = Date.now();
  try {
    const reponse = await env.envoyer(cellule.model, geminiRestBody(corps) as Json, controleur.signal);
    const ms = Date.now() - debut;
    if (reponse.status >= 400) {
      const message = String(reponse.payload?.error?.message ?? '');
      ecrireJournal(env.journal, { doc: cas.id, usage: cas.usage, cellule, ms, entree: null, sortie: null, microChf: 0, etat: `HTTP ${reponse.status}`, simule: env.simule });
      if (reponse.status === 429) { env.arret.raison = /spending cap/i.test(message) ? 'HTTP 429 : plafond de dépense mensuel du projet Google' : 'HTTP 429 : limite de débit'; throw new Arret(env.arret.raison); }
      return { ...base, ok: false, ms, microChf: 0, microDecembre: 0, entree: null, sortie: null, etat: `HTTP ${reponse.status}`, ancrage: 'sans objet', note: 0, utilisable: false, inventes: 0, detail: `HTTP ${reponse.status}`, erreur: message.slice(0, 200) };
    }
    const usage = reponse.payload?.usageMetadata;
    const entree = Number.isSafeInteger(usage?.promptTokenCount) ? usage.promptTokenCount : null;
    const sortie = usage ? (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0) : null;
    const cout = coutAppel(cellule.model, reponse.payload); // jetons + requêtes lues
    const compte = cout ?? reserve;
    env.depensePasseMicro += compte;
    const ancrage = ancrageDe(cas.usage, reponse.payload);
    const fin = String(reponse.payload?.candidates?.[0]?.finishReason ?? 'sans-fin');
    const servi = reponse.payload?.modelVersion;
    const etat = `${fin}${typeof servi === 'string' && !servi.includes(cellule.model) ? ` (modèle servi : ${servi.slice(0, 40)})` : ''}${ancrage === 'non prouvé' ? ' · ancrage non prouvé' : ''}${cout === null ? ' (coût inconnu : réserve comptée)' : ''}`;
    ecrireJournal(env.journal, { doc: cas.id, usage: cas.usage, cellule, ms, entree, sortie, microChf: compte, etat, simule: env.simule });
    const { json, raison } = jsonDe(reponse.payload);
    const verdict = json ? noter(cas, json) : { note: 0, utilisable: false, inventes: 0, critique: true, detail: raison ?? 'sans JSON' };
    const decembre = entree !== null && sortie !== null && estGemini4(cellule.model) ? coutDecembre(cellule.model, entree, sortie) + requetesWeb(reponse.payload) * MICRO_PAR_REQUETE : compte;
    return { ...base, ok: true, ms, microChf: compte, microDecembre: decembre, entree, sortie, etat, ancrage, note: verdict.note, utilisable: verdict.utilisable, inventes: verdict.inventes, detail: verdict.detail, reponse: texteVisible(reponse.payload).slice(0, 60000) };
  } catch (erreur) {
    if (erreur instanceof Arret) throw erreur;
    const ms = Date.now() - debut;
    env.depensePasseMicro += reserve; // un délai ou une panne : la requête a pu être facturée, jamais zéro
    const etat = controleur.signal.aborted ? 'délai' : `réseau : ${String((erreur as Error).message).slice(0, 80)}`;
    ecrireJournal(env.journal, { doc: cas.id, usage: cas.usage, cellule, ms, entree: null, sortie: null, microChf: reserve, etat: `${etat} (coût inconnu : réserve comptée)`, simule: env.simule });
    return { ...base, ok: false, ms, microChf: reserve, microDecembre: reserve, entree: null, sortie: null, etat, ancrage: 'sans objet', note: 0, utilisable: false, inventes: 0, detail: etat };
  } finally { clearTimeout(minuteur); }
}

export async function passe(env: Env, taches: Array<{ cas: Cas; cellule: Cellule }>, sortie: string, log: (s: string) => void = () => {}): Promise<Mesure[]> {
  const mesures: Mesure[] = []; let suivant = 0;
  const ouvrier = async () => {
    while (suivant < taches.length && !env.arret.raison) {
      const { cas, cellule } = taches[suivant++];
      try {
        const m = await jouer(env, cas, cellule);
        mesures.push(m);
        mkdirSync(path.join(sortie, cellule.id.replace('@', '-')), { recursive: true });
        writeFileSync(path.join(sortie, cellule.id.replace('@', '-'), `${cas.id}.json`), JSON.stringify(m, null, 1));
        log(`${cellule.id} ${cas.id} : ${m.note === null ? '—' : m.note.toFixed(2)} ${m.utilisable ? '' : 'INUTILISABLE '}${(m.ms / 1000).toFixed(1)} s ${(m.microChf / 1e6).toFixed(4)} CHF [${m.ancrage}] ${m.detail}`);
      } catch (erreur) { if (!(erreur instanceof Arret)) throw erreur; }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, env.workers) }, ouvrier));
  return mesures;
}

/** Rejoue la notation sur la réponse enregistrée (les règles d'un amendement s'appliquent ainsi à toutes les cellules, sans nouvel appel). */
export function renoter(m: Mesure, cas: Cas[]): Mesure {
  const c = cas.find(x => x.id === m.cas);
  if (!c || !m.reponse) return m;
  const { json, raison } = jsonDe({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: m.reponse }] } }] });
  if (!json) return m; // réponse tronquée à l'enregistrement : on garde la note du jour de l'appel
  const n = noter(c, json);
  void raison;
  return { ...m, note: n.note, utilisable: n.utilisable, inventes: n.inventes, detail: n.detail };
}
/** Les mesures déjà écrites dans `sorties/` (relire un tableau sans rien rejouer). */
export function lireSorties(dossier: string): Mesure[] {
  if (!existsSync(dossier)) return [];
  return readdirSync(dossier, { withFileTypes: true }).filter(d => d.isDirectory()).flatMap(d =>
    readdirSync(path.join(dossier, d.name)).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(path.join(dossier, d.name, f), 'utf8')) as Mesure));
}

// ---------------------------------------------------------------------------------------------------------------------
// Tableaux : `| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |`, première ligne = production
// ---------------------------------------------------------------------------------------------------------------------
const f = (v: number | null, d = 2) => v === null || Number.isNaN(v) ? '—' : v.toFixed(d).replace('.', ',');
export interface Ligne { cellule: string; n: number; qualite: number | null; inutilisables: number; inventes: number; p50: number | null; p90: number | null; chf: number | null; chfDecembre: number | null; nonProuve: number; ancres: number; appels: number }
export function ligneDe(cellule: string, mesures: Mesure[]): Ligne {
  const s = mesures.map(m => m.ms / 1000);
  const n = mesures.length;
  return { cellule, n, qualite: n ? mesures.reduce((a, m) => a + (m.note ?? 0), 0) / n : null, inutilisables: mesures.filter(m => !m.utilisable).length, inventes: mesures.reduce((a, m) => a + m.inventes, 0),
    p50: percentile(s, 0.5), p90: percentile(s, 0.9), chf: n ? mesures.reduce((a, m) => a + m.microChf, 0) / n / 1e6 : null, chfDecembre: n ? mesures.reduce((a, m) => a + m.microDecembre, 0) / n / 1e6 : null,
    nonProuve: mesures.filter(m => m.ancrage === 'non prouvé').length, ancres: mesures.filter(m => m.ancrage !== 'sans objet').length, appels: n };
}
export function verdictDe(ligne: Ligne, prod: Ligne, phase: 'choix' | 'jugement', quatre: boolean): string {
  if (ligne === prod) return 'production';
  const ecart = (ligne.qualite ?? 0) - (prod.qualite ?? 0);
  const motifs: string[] = [];
  if (ligne.inutilisables >= 1) motifs.push(`${ligne.inutilisables} inutilisable(s)`);
  if (ecart < -0.05) motifs.push(`qualité ${f(ecart)}`);
  if (prod.p50 !== null && ligne.p50 !== null && ligne.p50 > 2 * prod.p50) motifs.push(`p50 ×${f(ligne.p50 / prod.p50, 1)}`);
  const doublé = quatre && ligne.chfDecembre !== null && ligne.chf !== null && ligne.chfDecembre > ligne.chf * 1.05 ? ` ; ${f(ligne.chfDecembre, 4)} CHF/appel au 1.12 (tarif doublé)` : '';
  if (motifs.length) return `${phase === 'choix' ? 'éliminé' : 'moins bon'} (${motifs.join(', ')})${doublé}`;
  const relatif = prod.chf && ligne.chf !== null ? (ligne.chf / prod.chf - 1) * 100 : null;
  const coutTxt = relatif === null ? '—' : `${relatif > 0 ? '+' : ''}${f(relatif, 0)} %`;
  const etiquette = phase === 'choix' ? 'à approfondir' : ecart > 0.05 ? 'meilleur' : 'égal';
  return `${etiquette} (qualité ${ecart >= 0 ? '+' : ''}${f(ecart)}, CHF ${coutTxt})${doublé}`;
}
export function tableauUsage(usage: Usage, mesures: Mesure[], phase: 'choix' | 'jugement', ordre: string[]): string {
  const parCellule = new Map<string, Mesure[]>();
  for (const m of mesures.filter(x => x.usage === usage && x.half === phase)) parCellule.set(m.cellule, [...(parCellule.get(m.cellule) ?? []), m]);
  const cles = [...parCellule.keys()].sort((a, b) => (ordre.indexOf(a) + 1 || 99) - (ordre.indexOf(b) + 1 || 99));
  if (!cles.length) return '';
  const lignes = cles.map(c => ligneDe(c, parCellule.get(c)!));
  const prod = lignes[0];
  const ancre = ANCRE[usage];
  const tete = `| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel |${ancre ? ' ancrage non prouvé |' : ''} verdict |\n|---|---|---|---|---|---|${ancre ? '---|' : ''}---|`;
  const corps = lignes.map(l => `| ${l.cellule}${l === prod ? ' (production)' : ''} | ${f(l.qualite)} (${l.n} cas) | ${l.inutilisables}/${l.n} | ${f(l.p50, 1)} | ${f(l.p90, 1)} | ${f(l.chf, 4)} |${ancre ? ` ${l.nonProuve}/${l.ancres} |` : ''} ${verdictDe(l, prod, phase, estGemini4(parseCellule(l.cellule).model))} |`);
  return `${tete}\n${corps.join('\n')}`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Réponses fabriquées (--simuler) : tirées de la vérité, quelques fautes plantées (même cadence pour toutes les cellules)
// ---------------------------------------------------------------------------------------------------------------------
const nomLisible = (motifNom: unknown) => String(motifNom).replace(/\(([^|)]*)\|[^)]*\)/g, (_m, premier) => premier).split('|')[0];
const graine = (t: string) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
export function reponseSimulee(cas: Cas, cellule: Cellule, fauteForcee?: boolean): Json {
  const faute = fauteForcee ?? graine(cas.id + cellule.id) % 4 === 0;
  const e = cas.expected;
  let json: Json;
  if (cas.usage === 'import') {
    json = { name: e.name, style: 'Test', volumeL: faute ? e.volumeL * 3.785 : e.volumeL, ogTarget: e.ogTarget, fgTarget: e.fgTarget,
      fermentables: e.fermentables.map((x: Json) => ({ name: nomLisible(x.name), weightKg: x.weightKg, kind: x.kind ?? 'grain', use: 'empatage' })),
      hops: e.hops.map((x: Json) => ({ name: nomLisible(x.name), weightG: x.weightG, alpha: x.alpha === null ? (faute ? 8 : undefined) : x.alpha, stage: x.stages[0], timeMin: x.timeMin, dayOffset: x.dayOffset })),
      yeast: { name: nomLisible(e.yeast) }, mashSteps: e.mashSteps.map((x: Json) => ({ ...x, name: 'palier' })), adjuncts: (e.adjuncts ?? []).map((x: string) => ({ name: x, amount: 10, unit: 'g' })) };
  } else if (cas.usage === 'relecture') {
    const findings = arr(e.defects).map(d => ({ severity: d.severity[0], topic: d.id, observation: `${String(d.pattern).split('|')[0]} hors cible`, suggestion: 'corriger' }));
    if (faute) findings.push({ severity: 'bloquant', topic: 'divers', observation: 'remarque injustifiée', suggestion: '' });
    json = { verdict: 'ok', styleFit: 'ok', findings, missing: e.missingPattern ? ['alpha à compléter'] : [] };
  } else if (cas.usage === 'coa') {
    const analysis = e.analyses.map((x: Json) => ({ analyte: x.analyte, unit: 'percentMass', basis: 'asIs', kind: 'point', value: x.value }));
    if (faute) analysis.push({ analyte: 'hsi', unit: 'percentMass', basis: 'unknown', kind: 'point', value: 0.3 });
    json = { found: true, lotNumber: e.lotNumber, harvestYear: e.harvestYear, analysis };
  } else if (!e.found) json = { found: faute, source: '', name: '', aliases: [], form: 'unknown', analysis: [], descriptions: [] };
  else json = { found: true, source: 'https://exemple.test/citra', name: 'Citra', analysis: [{ analyte: 'alpha', unit: 'percentMass', value: faute ? 25 : 12, kind: 'point', source: { reference: 'https://exemple.test/citra' } }], descriptions: [] };
  const usageMeta = { promptTokenCount: 3000, candidatesTokenCount: 400, thoughtsTokenCount: 100, totalTokenCount: 3500 };
  const ancre = ANCRE[cas.usage] && graine(cas.id) % 2 === 0;
  return { usageMetadata: usageMeta, modelVersion: cellule.model, candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(json) }] }, ...(ancre ? { groundingMetadata: { webSearchQueries: ['requête simulée'] } } : {}) }] };
}
export function envoyerSimule(cellule: (modele: string) => Cellule, cas: Cas[]): EnvBanc['envoyer'] {
  // Le transport simulé retrouve le cas par la consigne du corps : un cas = une consigne unique.
  return async (model, restBody: any) => {
    const texte = JSON.stringify(restBody.contents);
    const parFichier = cas.find(c => c.file && texte.includes(readFileSync(c.file).toString('base64')));
    const parTexte = cas.find(c => !c.file && texte.includes(JSON.stringify(userTextOf(c.instruction, c.context)).slice(1, 100)));
    const trouve = parFichier ?? parTexte ?? cas[0];
    return { status: 200, payload: reponseSimulee(trouve, cellule(model)), retryAfter: null };
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------------
export function chargerCas(fichierCas = `${VOIE_DIR}/cas-t2a.json`): Cas[] { return JSON.parse(readFileSync(fichierCas, 'utf8')).cas as Cas[]; }
export function lireArgs(args: string[]) {
  const val = (nom: string) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };
  const liste = (nom: string) => (val(nom) ?? '').split(',').map(x => x.trim()).filter(Boolean);
  const nombre = (nom: string, defaut: number) => { const v = val(nom); const n = v === undefined ? defaut : Number(v); if (!(n > 0)) throw new Error(`${nom} attend un nombre positif.`); return n; };
  return {
    simuler: args.includes('--simuler'), payant: args.includes('--payant'), estimer: args.includes('--estimer'), tableau: args.includes('--tableau'),
    usages: (liste('--usages').length ? liste('--usages') : [...USAGES]) as Usage[], cas: liste('--cas'), cellules: liste('--cellules').map(parseCellule),
    moitie: (val('--moitie') ?? 'choix') as 'choix' | 'jugement' | 'tous', sortie: val('--out') ?? `${VOIE_DIR}/sorties`, journal: val('--journal') ?? JOURNAL_TOUR2,
    plafondPasse: nombre('--plafond-passe', 0.5), plafondVoie: Math.min(nombre('--budget-chf', PLAFOND_VOIE_CHF), PLAFOND_VOIE_CHF), workers: nombre('--workers', 3)
  };
}
export function planifier(cas: Cas[], options: Pick<ReturnType<typeof lireArgs>, 'usages' | 'cas' | 'cellules' | 'moitie'>) {
  const retenus = cas.filter(c => options.usages.includes(c.usage) && (!options.cas.length || options.cas.includes(c.id)) && (options.moitie === 'tous' || c.half === options.moitie));
  return retenus.flatMap(c => options.cellules.map(cellule => ({ cas: c, cellule })));
}
export async function main(args: string[]) {
  const options = lireArgs(args);
  const cas = chargerCas();
  if (options.tableau) {
    const mesures = lireSorties(options.sortie).map(m => renoter(m, cas));
    for (const usage of USAGES) for (const phase of ['choix', 'jugement'] as const) {
      const ordre = usage === 'coa' ? ['lite@minimal', '3.8@low', 'hy@low', 'ar@low', 'ca@low'] : ['3.8@low', 'lite@minimal', 'hy@low', 'ar@low', 'ca@low'];
      const t = tableauUsage(usage, mesures, phase, ordre); if (t) console.log(`\n### ${usage} — moitié ${phase}\n${t}`); }
    return;
  }
  if (!options.cellules.length) throw new Error('Au moins une --cellules (prod|lite|hy|ar|ca @ niveau).');
  const taches = planifier(cas, options);
  const reserveTotale = taches.reduce((s, t) => s + reserveAppel(t.cellule.model, corpsCas(t.cas, t.cellule), SORTIE_QUATRE), 0);
  console.log(`${taches.length} appels prévus ; réserve au pire ${(reserveTotale / 1e6).toFixed(2)} CHF (sortie au plafond) ; probable ≈ ${(taches.length * 0.03).toFixed(2)} CHF (jetons seuls, ≈ 0,03 CHF/appel).`);
  if (options.estimer) return;
  const base = { arret: {} as { raison?: string }, depensePasseMicro: 0, plafondTourMicro: Math.round(PLAFOND_TOUR_CHF * 1e6), plafondVoieMicro: Math.round(options.plafondVoie * 1e6), plafondPasseMicro: Math.round(options.plafondPasse * 1e6), workers: options.workers };
  let env: Env;
  if (options.simuler) env = { ...base, journal: path.join(options.sortie, 'journal-simule.md'), simule: true, envoyer: envoyerSimule(modele => options.cellules.find(c => c.model === modele) ?? options.cellules[0], cas) };
  else {
    if (!options.payant) throw new Error('Passe payante : ajouter --payant --confirm-paid-ai (ou --simuler).');
    requirePaidAiTestOptIn({ label: `Banc t2a (${options.cellules.map(c => c.id).join(' | ')}, ${taches.length} appels, passe ${options.plafondPasse} CHF)`, command: 'npx vite-node --config vitest.config.ts scripts/banc-t2a-usages.ts -- --payant --confirm-paid-ai --cellules <…>' });
    const cle = readLocalKey();
    if (!cle) throw new Error('Aucune clé Gemini locale : aucun appel.');
    env = { ...base, journal: options.journal, simule: false, envoyer: envoyerReseau(cle) };
    console.log(`Journal du tour : ${(sommeJournal(options.journal) / 1e6).toFixed(4)} CHF au total, dont t2a ${(sommeJournal(options.journal, VOIE) / 1e6).toFixed(4)} CHF. Plafonds : tour ${PLAFOND_TOUR_CHF}, voie ${options.plafondVoie}, passe ${options.plafondPasse}.`);
  }
  const mesures = await passe(env, taches, options.sortie, l => console.log(l));
  console.log(`${options.simuler ? 'SIMULÉ ' : ''}Passe terminée : ${mesures.length} appels, ${(mesures.reduce((s, m) => s + m.microChf, 0) / 1e6).toFixed(4)} CHF${env.arret.raison ? ` ; ARRÊT : ${env.arret.raison}` : ''}.`);
  const nonProuves = mesures.filter(m => m.ancrage === 'non prouvé').length;
  if (nonProuves) console.log(`Ancrage non prouvé : ${nonProuves}/${mesures.filter(m => m.ancrage !== 'sans objet').length} appels ancrés ; borne haute si une requête non lue était facturée par appel : +${((nonProuves * MICRO_PAR_REQUETE) / 1e6).toFixed(3)} CHF.`);
  if (env.arret.raison) process.exitCode = 2;
}
const estPrincipal = () => !process.env.VITEST && process.argv.includes('--cellules') && (process.argv.includes('--simuler') || process.argv.includes('--payant') || process.argv.includes('--estimer'))
  || (!process.env.VITEST && process.argv.includes('--tableau') && process.argv.includes('--out'));
if (estPrincipal()) main(process.argv.slice(2)).catch(erreur => { console.error(String(erreur?.message ?? erreur)); process.exitCode = 1; });
