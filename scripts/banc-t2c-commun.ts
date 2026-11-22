/**
 * Socle des bancs de la voie t2c (mission 2026-11-14-gemini4, tour 2) : un appel Gemini au corps de la production, avec le modèle et la réflexion de la cellule,
 * journalisé dans le journal COMMUN du tour (`journal-tour2.md`, trois voies y écrivent). Une ligne par appel, écrite juste après lui.
 *
 * Garde-fous : le cumul du journal est relu AVANT chaque appel (arrêt si cumul + réserve dépasse 14,5 CHF, la voie 4,5 CHF ou la passe) ; premier HTTP 429
 * « spending cap » : arrêt net ; un coût inconnu n'est jamais 0 (la réserve est comptée) ; le modèle servi est vérifié ; les modèles hors liste blanche
 * (`assertModeleBanc`) ne partent pas. Aucune clé n'est écrite nulle part : `readLocalKey` la charge, `redact` la masque.
 */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assertModeleBanc, estGemini4, parseFort, type Fort } from './banc-lecture-modeles';
import { coutAppel, envoyerReseau, envoyerSimule, requetesWeb, reserveAppel, sommeJournal, type EnvBanc } from './banc-compagnon';
import { percentile } from './banc-compagnon-grille';
import { geminiRestBody } from '../functions/src/brewerHarness';

export const MISSION_DIR = 'work/missions/2026-11-14-gemini4';
export const JOURNAL_TOUR2 = `${MISSION_DIR}/journal-tour2.md`;
export const VOIE = 't2c';
export const PLAFOND_VOIE_CHF = 4.5;
export const PLAFOND_TOUR_CHF = 14.5;
/** Tarif de la production à la sortie de décembre : Argon et Carbon doublent le 1.12.2026 (Hydrogen et 3.8 ne changent pas). */
export const MENTION_TARIF = 'Argon et Carbon : 2 $ / 10 $ le million jusqu’au 30.11.2026, 4 $ / 20 $ dès le 1.12.2026 (tarif doublé) ; Hydrogen et 3.8 : 1,5 $ / 7,5 $, inchangés.';

const TETE_JOURNAL = [
  '# Journal des appels Gemini du tour 2 (mission 2026-11-14-gemini4)', '',
  'Une ligne par appel, écrite juste après lui. Aucune valeur des documents. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD, marge de sécurité), pas une facture.', '',
  '| date | doc | tirage | variante | lecture | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|', ''
].join('\n');

export interface Arret { raison?: string }
export interface EnvT2 {
  journal: string; plafondTourMicro: number; plafondVoieMicro: number; plafondPasseMicro: number; depensePasseMicro: number; arret: Arret; simule: boolean;
  envoyer: EnvBanc['envoyer']; cle?: string;
}
export class ArretT2 extends Error { constructor(readonly raison: string) { super(`Arrêt du banc : ${raison}`); } }

/** `gemini-4-hydrogen@low` ou `gemini-3.8-flash@high` ou `gemini-3.5-flash-lite@minimal` (le seul cas où `minimal` existe : la production le règle ainsi). */
export function parseReglage(texte: string): Fort & { id: string } {
  const [model, niveau = ''] = texte.split('@').map(item => item.trim());
  if (model === 'gemini-3.5-flash-lite') {
    if (!['minimal', 'low', 'medium', 'high'].includes(niveau.toLowerCase())) throw new Error(`Niveau ${niveau} refusé pour Flash-Lite.`);
    return { model, thinking: niveau.toUpperCase() as Fort['thinking'], id: `${model.replace('gemini-', '')}@${niveau.toLowerCase()}` };
  }
  const fort = parseFort(texte);
  return { ...fort, id: `${fort.model.replace('gemini-', '')}@${fort.thinking.toLowerCase()}` };
}

export function creerEnv(options: { simuler: boolean; payant: boolean; journal?: string; plafondPasse: number; plafondVoie?: number; plafondTour?: number; cle?: string }, envoyer: EnvBanc['envoyer']): EnvT2 {
  return {
    journal: options.journal ?? JOURNAL_TOUR2, plafondTourMicro: Math.round(Math.min(options.plafondTour ?? PLAFOND_TOUR_CHF, PLAFOND_TOUR_CHF) * 1e6),
    plafondVoieMicro: Math.round(Math.min(options.plafondVoie ?? PLAFOND_VOIE_CHF, PLAFOND_VOIE_CHF) * 1e6), plafondPasseMicro: Math.round(options.plafondPasse * 1e6),
    depensePasseMicro: 0, arret: {}, simule: options.simuler, envoyer, cle: options.cle
  };
}
export { envoyerReseau, envoyerSimule };

function ecrire(env: EnvT2, doc: string, variante: string, lecture: number, modele: string, niveau: string, ms: number, entree: number | null, sortie: number | null, compte: number, etat: string, inconnu: boolean) {
  mkdirSync(path.dirname(env.journal), { recursive: true });
  // `wx` : trois voies écrivent ici, une seule crée l'en-tête (les deux autres échouent sans rien écraser).
  if (!existsSync(env.journal)) { try { writeFileSync(env.journal, TETE_JOURNAL, { flag: 'wx' }); } catch { /* créé entre-temps par une autre voie */ } }
  const cumul = sommeJournal(env.journal) + (env.simule ? 0 : compte);
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const chf6 = (valeur: number) => (valeur / 1e6).toFixed(6);
  appendFileSync(env.journal, `| ${date} | ${doc} | 1 | ${VOIE}:${variante} | ${lecture} | ${modele}@${niveau} | ${ms} ms | ${entree ?? '?'} | ${sortie ?? '?'} | ${chf6(compte)} | ${chf6(cumul)} | ${etat}${inconnu && !env.simule ? ' (coût inconnu : réserve comptée)' : ''}${env.simule ? ' (SIMULÉ)' : ''} |\n`);
}

export interface ResultatAppel { ok: boolean; payload?: any; ms: number; coutMicro: number; entree: number | null; sortie: number | null; etat: string; web: number; erreur?: string }
export interface DemandeAppel { doc: string; variante: string; lecture?: number; reglage: Fort; body: any; maxSortie?: number; timeoutMs?: number }

/** Le corps de la production, avec le modèle et la réflexion de la cellule ; le plafond de sortie monte quand la réflexion monte (elle compte dedans). */
export function corpsReglage(body: any, reglage: Fort, plancher = 0) {
  const niveau = reglage.thinking.toLowerCase();
  const config = { ...(body.generationConfig ?? {}), thinkingConfig: { thinkingLevel: niveau } };
  if (niveau !== 'low' && niveau !== 'minimal' && plancher) config.maxOutputTokens = Math.max(Number(config.maxOutputTokens ?? 0), plancher);
  return { ...body, generationConfig: config };
}

/** Un appel journalisé. Jamais de nouvelle tentative : une réponse manquée est une réponse manquée (elle compte dans les inutilisables). */
export async function appeler(env: EnvT2, demande: DemandeAppel): Promise<ResultatAppel> {
  if (env.arret.raison) throw new ArretT2(env.arret.raison);
  assertModeleBanc(demande.reglage.model);
  const modele = demande.reglage.model, niveau = demande.reglage.thinking.toLowerCase();
  const maxSortie = Number(demande.maxSortie ?? demande.body?.generationConfig?.maxOutputTokens ?? 8192);
  const reserve = reserveAppel(modele, demande.body, maxSortie);
  const total = sommeJournal(env.journal), voie = sommeJournal(env.journal, VOIE);
  const trop = total + reserve > env.plafondTourMicro ? `plafond du tour (${(env.plafondTourMicro / 1e6).toFixed(2)} CHF, cumul ${(total / 1e6).toFixed(3)})`
    : voie + reserve > env.plafondVoieMicro ? `plafond de la voie ${VOIE} (${(env.plafondVoieMicro / 1e6).toFixed(2)} CHF, cumul voie ${(voie / 1e6).toFixed(3)})`
    : env.depensePasseMicro + reserve > env.plafondPasseMicro ? `plafond de la passe (${(env.plafondPasseMicro / 1e6).toFixed(2)} CHF)` : '';
  if (trop) { env.arret.raison = trop; throw new ArretT2(trop); }
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), demande.timeoutMs ?? 90_000);
  const debut = Date.now();
  const lecture = demande.lecture ?? 1;
  try {
    // Le corps part tel quel vers l'API REST : mêmes clés que `geminiRestBody` (le corps d'un banc est déjà au format REST : systemInstruction, contents, generationConfig).
    const reponse = await env.envoyer(modele, geminiRestBody(demande.body) as Record<string, unknown>, controleur.signal);
    const ms = Date.now() - debut;
    if (reponse.status >= 400) {
      const message = String(reponse.payload?.error?.message ?? '');
      ecrire(env, demande.doc, demande.variante, lecture, modele, niveau, ms, null, null, 0, `HTTP ${reponse.status}`, false);
      if (reponse.status === 429 && /spending cap/i.test(message)) { env.arret.raison = 'HTTP 429 : plafond de dépense mensuel du projet Google'; throw new ArretT2(env.arret.raison); }
      if (reponse.status === 429) { env.arret.raison = 'HTTP 429 : limite de débit (arrêt, TOUR2.md)'; throw new ArretT2(env.arret.raison); }
      return { ok: false, ms, coutMicro: 0, entree: null, sortie: null, etat: `HTTP ${reponse.status}`, web: 0, erreur: message.slice(0, 160) };
    }
    const usage = reponse.payload?.usageMetadata;
    const entree = Number.isSafeInteger(usage?.promptTokenCount) ? usage.promptTokenCount : null;
    const sortie = usage ? (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0) : null;
    const cout = coutAppel(modele, reponse.payload);
    const compte = cout ?? reserve;
    env.depensePasseMicro += compte;
    let etat = String(reponse.payload?.candidates?.[0]?.finishReason ?? 'sans-fin');
    const servi = reponse.payload?.modelVersion;
    if (typeof servi === 'string' && !servi.includes(modele)) etat += ` (modèle servi : ${servi.slice(0, 40)})`;
    ecrire(env, demande.doc, demande.variante, lecture, modele, niveau, ms, entree, sortie, compte, etat, cout === null);
    return { ok: true, payload: reponse.payload, ms, coutMicro: compte, entree, sortie, etat, web: requetesWeb(reponse.payload) };
  } catch (erreur) {
    if (erreur instanceof ArretT2) throw erreur;
    const ms = Date.now() - debut;
    // Un délai ou une panne réseau : la réserve est comptée (la requête a pu être facturée), jamais zéro.
    env.depensePasseMicro += reserve;
    ecrire(env, demande.doc, demande.variante, lecture, modele, niveau, ms, null, null, reserve, controleur.signal.aborted ? 'délai' : `réseau : ${String((erreur as Error).message).slice(0, 80)}`, true);
    return { ok: false, ms, coutMicro: reserve, entree: null, sortie: null, etat: controleur.signal.aborted ? 'délai' : 'réseau', web: 0, erreur: String((erreur as Error).message).slice(0, 160) };
  } finally { clearTimeout(minuteur); }
}

/** Le texte de la réponse (hors réflexion), pour les sorties JSON. */
export const texteReponse = (payload: any): string => (payload?.candidates?.[0]?.content?.parts ?? []).filter((p: any) => typeof p?.text === 'string' && !p.thought).map((p: any) => p.text).join('').trim();
export function jsonReponse(payload: any): { ok: boolean; valeur?: any; raison?: string } {
  if (String(payload?.candidates?.[0]?.finishReason ?? '') === 'MAX_TOKENS') return { ok: false, raison: 'coupée (MAX_TOKENS)' };
  const brut = texteReponse(payload).replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  if (!brut) return { ok: false, raison: 'vide' };
  try { return { ok: true, valeur: JSON.parse(brut) }; } catch { return { ok: false, raison: 'JSON invalide' }; }
}

/** Exécute des tâches avec au plus `n` en parallèle ; s'arrête à la première raison d'arrêt du banc. */
export async function enParallele<T>(taches: Array<() => Promise<T>>, n: number, env: EnvT2): Promise<T[]> {
  const sorties: T[] = []; let suivant = 0;
  const ouvrier = async () => { while (suivant < taches.length && !env.arret.raison) { const tache = taches[suivant++]; try { sorties.push(await tache()); } catch (erreur) { if (!(erreur instanceof ArretT2)) throw erreur; } } };
  await Promise.all(Array.from({ length: Math.max(1, n) }, ouvrier));
  return sorties;
}

export interface StatCellule { reglage: string; n: number; inutilisables: number; p50: number | null; p90: number | null; chfParAppel: number | null; appels: number }
/** Les mesures communes de chaque tableau : temps p50/p90, coût par appel, inutilisables. */
export function statCellule(reglage: string, lignes: Array<{ ms: number; coutMicro: number; utilisable: boolean }>): StatCellule {
  const secondes = lignes.map(l => l.ms / 1000);
  return { reglage, n: lignes.length, inutilisables: lignes.filter(l => !l.utilisable).length, p50: percentile(secondes, 0.5), p90: percentile(secondes, 0.9),
    chfParAppel: lignes.length ? lignes.reduce((s, l) => s + l.coutMicro, 0) / lignes.length / 1e6 : null, appels: lignes.length };
}
export const f2 = (v: number | null, d = 2) => v === null ? '—' : v.toFixed(d).replace('.', ',');
export const estQuatre = estGemini4;
