/**
 * Banc du compagnon brasseur : modèle et réflexion par rôle (mission 2026-11-14-gemini4, voie g2).
 *
 * Sa demande (14.11) : « surtout regarde pour l'aide au brasseur ». Le compagnon (`functions/src/brewerHarness.ts`) appelle Gemini pour trois
 * rôles : `analysis` (la boucle d'outils qui rédige le conseil), `review` (la relecture indépendante) et `research` (recherche web des
 * fournisseurs et des références). En production, tout part en 3.8 à la réflexion basse (la recherche de référence en Flash-Lite, `models.ts`).
 *
 * Ici, une CELLULE remplace le modèle et la réflexion de chaque rôle au niveau du transport, sans toucher à la production :
 *   `analysis=gemini-4-argon@low;review=gemini-4-hydrogen@medium`  (un rôle absent garde la production ; `prod` = aucune modification).
 * Modèles et niveaux permis : ceux de `banc-lecture-modeles.ts` (sources de g1 : 3.8 low/medium/high ; Hydrogen low…xhigh ; Argon, Carbon low…high).
 *
 * Garde-fous : une ligne de journal par appel, écrite juste après lui, dans le journal COMMUN de la mission (g1 y écrit aussi : la somme est relue
 * avant chaque appel) ; arrêt net au plafond de la mission, de la voie g2 ou de la passe ; arrêt immédiat au premier HTTP 429 « spending cap » ;
 * un coût inconnu n'est jamais 0 (la réserve est comptée). Les sorties ne contiennent que des fixtures synthétiques (brewerCases.mjs).
 *
 * Commande type (une cellule, sept cas, deux fils) :
 *   npx vite-node --config vitest.config.ts scripts/banc-compagnon.ts -- --payant --confirm-paid-ai --cellule "analysis=gemini-4-argon@low"
 *     --cas edit-recipe,low-ph --out work/missions/2026-11-14-gemini4/voies/g2/sorties --plafond-passe 0.5
 * Sans coût : `--simuler` (transport fabriqué, aucun réseau, aucune clé).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { geminiRestBody, runBrewerHarness, type Generate } from '../functions/src/brewerHarness';
import { parseGeminiError } from '../functions/src/geminiErrors';
import { GEMINI_LITE_MODEL, GEMINI_MODEL } from '../functions/src/models';
import { TARIFS_GEMINI4, estGemini4, parseFort, type Fort } from './banc-lecture-modeles';
// @ts-ignore — module JavaScript sans types
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans types
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';
// @ts-ignore — module JavaScript sans types
import { cases as CAS_FIXTURES, context as contexteFixture } from './fixtures/brewerCases.mjs';

export const MISSION_DIR = 'work/missions/2026-11-14-gemini4';
export const JOURNAL_MISSION = `${MISSION_DIR}/journal-gemini.md`;
export const PLAFOND_MISSION_CHF = 9.5;
export const PLAFOND_G2_CHF = 3.5;
/** Prix de la requête de recherche web comptée par la production (`geminiCosts.ts` : 14 $ le millier × 1,25). */
const MICRO_CHF_PAR_REQUETE_WEB = 17_500;

export type Role = 'analysis' | 'review' | 'research';
export const ROLES: readonly Role[] = ['analysis', 'review', 'research'];
export interface Cellule { id: string; roles: Partial<Record<Role, Fort>> }

/** `prod` ou `analysis=gemini-4-argon@low;review=gemini-3.8-flash@medium` : un niveau que le modèle refuse est refusé net (jamais deviné). */
export function parseCellule(texte: string): Cellule {
  const brut = texte.trim();
  if (brut === 'prod' || brut === '') return { id: 'prod', roles: {} };
  const roles: Partial<Record<Role, Fort>> = {};
  for (const part of brut.split(/[;,]/).map(item => item.trim()).filter(Boolean)) {
    const [role, reglage] = part.split('=');
    if (!ROLES.includes(role as Role) || !reglage) throw new Error(`Cellule « ${part} » : écrire <rôle>=<modèle>@<niveau>, rôle parmi ${ROLES.join(', ')}.`);
    roles[role as Role] = parseFort(reglage);
  }
  const id = ROLES.filter(role => roles[role]).map(role => `${role}=${roles[role]!.model.replace('gemini-', '')}@${roles[role]!.thinking.toLowerCase()}`).join(';');
  return { id, roles };
}
export const slug = (texte: string) => texte.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/** Le rôle d'une requête, comme `eval-brewer.mjs` : la recherche porte l'outil web, la relecture le schéma `approved`, le reste est l'analyse. */
export function roleDe(body: any): Role {
  if (Array.isArray(body?.tools) && body.tools.some((tool: any) => tool?.googleSearch || tool?.google_search)) return 'research';
  return body?.generationConfig?.responseSchema?.properties?.approved ? 'review' : 'analysis';
}
/** Plafonds de sortie des cellules qui remplacent un rôle à une réflexion au-dessus de « low » : la réflexion compte dans la sortie (doc /thinking). */
export const PLANCHER_SORTIE: Record<Role, number> = { analysis: 8000, review: 5000, research: 5000 };

// ---------------------------------------------------------------------------------------------------------------------
// Coût : jetons relus de la réponse, au tarif du modèle qui l'a servie ; null si la réponse ne dit pas ses jetons (jamais zéro)
// ---------------------------------------------------------------------------------------------------------------------
const TARIFS_BASE: Record<string, readonly [number, number]> = {
  [GEMINI_MODEL]: [1_500_000, 7_500_000],
  [GEMINI_LITE_MODEL]: [300_000, 2_500_000]
};
export function tarifDe(model: string): readonly [number, number] {
  if (estGemini4(model)) return [TARIFS_GEMINI4[model].entree, TARIFS_GEMINI4[model].sortie];
  const base = TARIFS_BASE[model];
  if (!base) throw new Error(`Tarif inconnu pour ${model} : aucun appel.`);
  return base;
}
const micro = (tarif: readonly [number, number], entree: number, sortie: number) => Math.ceil((entree * tarif[0] + sortie * tarif[1]) * 5 / 4_000_000);
export function requetesWeb(response: any): number {
  const liste = response?.candidates?.[0]?.groundingMetadata?.webSearchQueries;
  return Array.isArray(liste) ? new Set(liste.filter((q: unknown) => typeof q === 'string' && q.trim())).size : 0;
}
export function coutAppel(model: string, response: any): number | null {
  const usage = response?.usageMetadata;
  const ok = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
  if (!usage || !ok(usage.promptTokenCount) || !ok(usage.candidatesTokenCount) || !ok(usage.thoughtsTokenCount ?? 0) || !ok(usage.totalTokenCount)) return null;
  const sortie = Math.max(usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0), usage.totalTokenCount - usage.promptTokenCount);
  return micro(tarifDe(model), usage.promptTokenCount, sortie) + requetesWeb(response) * MICRO_CHF_PAR_REQUETE_WEB;
}
/** La réserve d'un appel avant son envoi : entrée estimée (3 caractères le jeton), sortie au plafond, deux requêtes web si l'outil est là. */
export function reserveAppel(model: string, body: any, maxSortie: number): number {
  const entree = Math.ceil(JSON.stringify(body).length / 3);
  return micro(tarifDe(model), entree, maxSortie) + (roleDe(body) === 'research' ? 2 * MICRO_CHF_PAR_REQUETE_WEB : 0);
}

// ---------------------------------------------------------------------------------------------------------------------
// Journal commun de la mission (g1 y écrit aussi) : mêmes colonnes que le banc de lecture, une ligne par appel
// ---------------------------------------------------------------------------------------------------------------------
const TETE_JOURNAL = [
  '# Journal des appels Gemini de la mission 2026-11-14-gemini4', '',
  'Une ligne par appel, écrite juste après lui. Aucune valeur des documents. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD, marge de sécurité), pas une facture.', '',
  '| date | doc | tirage | variante | lecture | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|', ''
].join('\n');
/** Dépense journalisée en micro-CHF, hors lignes simulées ; `prefixe` filtre la colonne « variante » (g2 écrit « g2:analysis »…). */
export function sommeJournal(fichier: string, prefixe?: string): number {
  if (!existsSync(fichier)) return 0;
  let total = 0;
  for (const ligne of readFileSync(fichier, 'utf8').split(/\r?\n/)) {
    const cellules = ligne.split('|').map(cellule => cellule.trim());
    if (cellules.length < 13 || !/^\d{4}-\d{2}-\d{2}/.test(cellules[1] ?? '') || /SIMULÉ/.test(ligne)) continue;
    if (prefixe && !(cellules[4] ?? '').startsWith(prefixe)) continue;
    const cout = Number(cellules[10]);
    if (Number.isFinite(cout)) total += Math.round(cout * 1e6);
  }
  return total;
}
export interface Appel {
  role: Role; model: string; level: string; ms: number; entree: number | null; sortie: number | null; coutMicro: number | null; reserveMicro: number;
  etat: string; requetesWeb: number;
}
function ecrireJournal(fichier: string, cas: string, index: number, appel: Appel, simule: boolean) {
  mkdirSync(path.dirname(fichier), { recursive: true });
  if (!existsSync(fichier)) writeFileSync(fichier, TETE_JOURNAL);
  const compte = appel.coutMicro ?? appel.reserveMicro;
  const cumul = sommeJournal(fichier) + (simule ? 0 : compte);
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const chf6 = (valeur: number) => (valeur / 1e6).toFixed(6);
  appendFileSync(fichier, `| ${date} | ${cas} | 1 | g2:${appel.role} | ${index} | ${appel.model}@${appel.level} | ${appel.ms} ms | ${appel.entree ?? '?'} | ${appel.sortie ?? '?'} | ${chf6(compte)} | ${chf6(cumul)} | ${appel.etat}${appel.coutMicro === null && !simule ? ' (coût inconnu : réserve comptée)' : ''}${simule ? ' (SIMULÉ)' : ''} |\n`);
}

// ---------------------------------------------------------------------------------------------------------------------
// Transport : applique la cellule, respecte les plafonds, journalise
// ---------------------------------------------------------------------------------------------------------------------
export interface Arret { raison?: string }
export interface EnvBanc {
  journal: string; plafondMissionMicro: number; plafondG2Micro: number; plafondPasseMicro: number;
  depensePasseMicro: number; arret: Arret; simule: boolean;
  /** Le transport réseau : injecté par les tests ; par défaut `fetch` vers generateContent. */
  envoyer: (model: string, restBody: Record<string, unknown>, signal: AbortSignal) => Promise<{ status: number; payload: any; retryAfter?: string | null }>;
  cle?: string;
}
export class ArretBanc extends Error {
  constructor(readonly raison: string) { super(`Arrêt du banc : ${raison}`); }
}
/** Le corps réellement envoyé : modèle et réflexion de la cellule pour ce rôle, plancher de sortie quand la réflexion monte. */
export function corpsPourCellule(role: Role, model: string, body: any, cellule: Cellule): { model: string; body: any; level: string } {
  const regle = cellule.roles[role];
  const niveauHarnais = String(body?.generationConfig?.thinkingConfig?.thinkingLevel ?? 'défaut');
  if (!regle) return { model, body, level: niveauHarnais };
  const niveau = regle.thinking.toLowerCase();
  const config = { ...(body.generationConfig ?? {}), thinkingConfig: { thinkingLevel: niveau } };
  if (niveau !== 'low') config.maxOutputTokens = Math.max(Number(config.maxOutputTokens ?? 0), PLANCHER_SORTIE[role]);
  return { model: regle.model, body: { ...body, generationConfig: config }, level: niveau };
}
export function creerTransport(env: EnvBanc, cellule: Cellule, cas: string, appels: Appel[], reviewBodies?: unknown[]): Generate {
  return async (model, bodyHarnais, signal) => {
    if (env.arret.raison) throw new ArretBanc(env.arret.raison);
    const role = roleDe(bodyHarnais);
    const { model: modele, body, level } = corpsPourCellule(role, model, bodyHarnais, cellule);
    const maxSortie = Number((body as any)?.generationConfig?.maxOutputTokens ?? 8192);
    const reserve = reserveAppel(modele, body, maxSortie);
    const total = sommeJournal(env.journal), g2 = sommeJournal(env.journal, 'g2');
    const trop = total + reserve > env.plafondMissionMicro ? `plafond de la mission (${(env.plafondMissionMicro / 1e6).toFixed(2)} CHF)`
      : g2 + reserve > env.plafondG2Micro ? `plafond de la voie g2 (${(env.plafondG2Micro / 1e6).toFixed(2)} CHF)`
      : env.depensePasseMicro + reserve > env.plafondPasseMicro ? `plafond de la passe (${(env.plafondPasseMicro / 1e6).toFixed(2)} CHF)` : '';
    if (trop) { env.arret.raison = trop; throw new ArretBanc(trop); }
    if (reviewBodies && role === 'review') reviewBodies.push(bodyHarnais);
    const debut = Date.now();
    const fiche: Appel = { role, model: modele, level, ms: 0, entree: null, sortie: null, coutMicro: null, reserveMicro: reserve, etat: '', requetesWeb: 0 };
    const index = appels.length + 1;
    appels.push(fiche);
    let reponse: { status: number; payload: any; retryAfter?: string | null };
    try {
      reponse = await env.envoyer(modele, geminiRestBody(body as Record<string, unknown>) as Record<string, unknown>, signal);
    } catch (erreur) {
      fiche.ms = Date.now() - debut;
      fiche.etat = signal.aborted ? 'délai' : `réseau : ${String((erreur as Error).message).slice(0, 80)}`;
      fiche.coutMicro = null;
      ecrireJournal(env.journal, cas, index, fiche, env.simule);
      env.depensePasseMicro += reserve;
      throw erreur;
    }
    fiche.ms = Date.now() - debut;
    if (reponse.status >= 400) {
      const message = String(reponse.payload?.error?.message ?? '');
      fiche.etat = `HTTP ${reponse.status}`;
      fiche.coutMicro = 0; // refusé avant génération : non facturé (le journal de g1 note 0 pour ses 429)
      ecrireJournal(env.journal, cas, index, fiche, env.simule);
      if (reponse.status === 429 && /spending cap/i.test(message)) { env.arret.raison = 'HTTP 429 : plafond de dépense mensuel du projet Google'; throw new ArretBanc(env.arret.raison); }
      throw parseGeminiError(reponse.status, modele, reponse.payload, reponse.retryAfter ?? null);
    }
    const usage = reponse.payload?.usageMetadata;
    fiche.entree = Number.isSafeInteger(usage?.promptTokenCount) ? usage.promptTokenCount : null;
    fiche.sortie = usage ? (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0) : null;
    fiche.requetesWeb = requetesWeb(reponse.payload);
    fiche.coutMicro = coutAppel(modele, reponse.payload);
    fiche.etat = String(reponse.payload?.candidates?.[0]?.finishReason ?? 'sans-fin');
    env.depensePasseMicro += fiche.coutMicro ?? reserve;
    ecrireJournal(env.journal, cas, index, fiche, env.simule);
    // Le modèle de la réponse doit être celui demandé (le banc ne se fie pas au seul corps envoyé).
    const servi = reponse.payload?.modelVersion;
    if (typeof servi === 'string' && !servi.includes(modele)) fiche.etat += ` (modèle servi : ${servi.slice(0, 40)})`;
    return reponse.payload;
  };
}
export function envoyerReseau(cle: string): EnvBanc['envoyer'] {
  return async (model, restBody, signal) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle }, body: JSON.stringify(restBody), signal
    });
    const payload = await res.json().catch(() => undefined);
    return { status: res.status, payload, retryAfter: res.headers.get('retry-after') };
  };
}
/** Transport fabriqué (`--simuler`, tests) : un conseil valide à la première analyse, une relecture favorable, une recherche courte. Aucun réseau. */
export function envoyerSimule(): EnvBanc['envoyer'] {
  return async (_model, restBody: any) => {
    const role = roleDe(restBody);
    const usage = { promptTokenCount: 1200, candidatesTokenCount: 150, thoughtsTokenCount: 50, totalTokenCount: 1400 };
    if (role === 'review') return { status: 200, payload: { usageMetadata: usage, candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] } };
    if (role === 'research') return { status: 200, payload: { usageMetadata: usage, candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Source simulée.' }] }, groundingMetadata: { webSearchQueries: ['requête simulée'] } }] } };
    const conseil = { level: 'info', summary: 'Réponse simulée.', action: 'Aucune action.', why: 'Test du banc.', watch: '', question: '', evidenceIds: [] };
    return { status: 200, payload: { usageMetadata: usage, candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ functionCall: { name: 'finish_advice', args: conseil } }] } }] } };
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Un cas, une cellule
// ---------------------------------------------------------------------------------------------------------------------
export interface ResultatCas {
  cas: string; cellule: string; ok: boolean; erreur?: string; ms: number; appels: Appel[];
  advice?: any; proposal?: any; trace?: any[]; evidence?: any[]; review?: any; tools?: string[]; question: string;
  reviewBodies?: unknown[]; model?: string; reviewModel?: string;
}
export const coutCas = (r: Pick<ResultatCas, 'appels'>) => r.appels.reduce((somme, appel) => somme + (appel.coutMicro ?? appel.reserveMicro), 0);
export async function jouerCas(scenario: any, cellule: Cellule, env: EnvBanc): Promise<ResultatCas> {
  const c = contexteFixture();
  if (scenario.phase) { c.phase = scenario.phase; c.batch = { status: scenario.phase, volumeL: 24, gravityLog: [] }; }
  if (scenario.fermentables) c.recipe.fermentables = scenario.fermentables;
  if (scenario.editableTargets) c.editableTargets = scenario.editableTargets;
  const appels: Appel[] = [], reviewBodies: unknown[] = [];
  const debut = Date.now();
  try {
    const result: any = await runBrewerHarness(c, scenario.question, scenario.history ?? [], creerTransport(env, cellule, scenario.id, appels, reviewBodies), { mode: 'auto' });
    return {
      cas: scenario.id, cellule: cellule.id, ok: true, ms: Date.now() - debut, appels, question: scenario.question, advice: result.advice, proposal: result.proposal,
      trace: result.trace, evidence: result.evidence, review: result.review, tools: result.trace.map((t: any) => t.name), reviewBodies, model: result.model, reviewModel: result.reviewModel
    };
  } catch (erreur) {
    const message = redact((erreur as Error).message, env.cle).slice(0, 300);
    return { cas: scenario.id, cellule: cellule.id, ok: false, erreur: message, ms: Date.now() - debut, appels, question: scenario.question, reviewBodies };
  }
}

export interface OptionsPasse { cellules: Cellule[]; cas: string[]; sortie: string; workers: number }
/** Joue chaque (cellule, cas) une fois. Un résultat déjà écrit n'est jamais rejoué ni repayé ; un arrêt du banc n'écrit rien pour le cas interrompu. */
export async function jouerPasse(options: OptionsPasse, env: EnvBanc, log: (ligne: string) => void = () => {}): Promise<ResultatCas[]> {
  const taches = options.cellules.flatMap(cellule => options.cas.map(id => ({ cellule, scenario: CAS_FIXTURES.find((c: any) => c.id === id) })));
  const inconnu = taches.find(tache => !tache.scenario);
  if (inconnu) throw new Error('Cas inconnu dans la sélection.');
  const resultats: ResultatCas[] = [];
  let suivant = 0;
  const ouvrier = async () => {
    while (suivant < taches.length && !env.arret.raison) {
      const { cellule, scenario } = taches[suivant++];
      const fichier = path.join(options.sortie, slug(cellule.id), `${scenario.id}.json`);
      if (existsSync(fichier)) { log(`déjà joué : ${cellule.id} / ${scenario.id}`); continue; }
      const resultat = await jouerCas(scenario, cellule, env);
      if (env.arret.raison && !resultat.ok) { log(`ARRÊT (${env.arret.raison}) pendant ${cellule.id} / ${scenario.id}`); break; }
      mkdirSync(path.dirname(fichier), { recursive: true });
      writeFileSync(fichier, JSON.stringify(resultat, null, 1));
      resultats.push(resultat);
      log(`${resultat.ok ? 'ok ' : 'ERR'} ${cellule.id} / ${scenario.id} : ${(resultat.ms / 1000).toFixed(1)} s, ${resultat.appels.length} appels, ${(coutCas(resultat) / 1e6).toFixed(4)} CHF${resultat.ok ? '' : ` — ${resultat.erreur}`}`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, options.workers) }, ouvrier));
  return resultats;
}

// ---------------------------------------------------------------------------------------------------------------------
// Ligne de commande
// ---------------------------------------------------------------------------------------------------------------------
export function lireArgs(args: string[]) {
  const valeurs = (nom: string) => args.flatMap((arg, i) => (arg === nom && args[i + 1] !== undefined ? [args[i + 1]] : []));
  const une = (nom: string) => valeurs(nom)[0];
  const cellules = valeurs('--cellule').map(parseCellule);
  const nombre = (nom: string, defaut: number) => { const v = une(nom); const n = v === undefined ? defaut : Number(v); if (!(n > 0)) throw new Error(`${nom} attend un nombre positif.`); return n; };
  return {
    simuler: args.includes('--simuler'), payant: args.includes('--payant'), cellules,
    cas: (une('--cas') ?? CAS_FIXTURES.map((c: any) => c.id).join(',')).split(',').filter(Boolean),
    sortie: une('--out') ?? `${MISSION_DIR}/voies/g2/sorties`, journal: une('--journal') ?? JOURNAL_MISSION,
    plafondPasse: nombre('--plafond-passe', 0.5), plafondMission: Math.min(nombre('--plafond-mission', PLAFOND_MISSION_CHF), PLAFOND_MISSION_CHF),
    plafondG2: Math.min(nombre('--plafond-g2', PLAFOND_G2_CHF), PLAFOND_G2_CHF), workers: nombre('--workers', 2)
  };
}
export async function main(args: string[]) {
  const options = lireArgs(args);
  if (!options.cellules.length) throw new Error('Au moins une --cellule (ou « prod »).');
  const base = { arret: {} as Arret, depensePasseMicro: 0, plafondMissionMicro: Math.round(options.plafondMission * 1e6), plafondG2Micro: Math.round(options.plafondG2 * 1e6), plafondPasseMicro: Math.round(options.plafondPasse * 1e6) };
  let env: EnvBanc;
  if (options.simuler) env = { ...base, journal: path.join(options.sortie, 'journal-simule.md'), simule: true, envoyer: envoyerSimule() };
  else {
    if (!options.payant) throw new Error('Passe payante : ajouter --payant --confirm-paid-ai (ou --simuler).');
    requirePaidAiTestOptIn({ label: `Banc du compagnon brasseur (${options.cellules.map(c => c.id).join(' | ')} × ${options.cas.length} cas, passe ${options.plafondPasse} CHF)`, command: 'npx vite-node --config vitest.config.ts scripts/banc-compagnon.ts -- --payant --confirm-paid-ai --cellule <cellule> --cas <ids>' });
    const cle = readLocalKey();
    if (!cle) throw new Error('Aucune clé Gemini locale : aucun appel.');
    env = { ...base, journal: options.journal, simule: false, envoyer: envoyerReseau(cle), cle };
    console.log(`Journal commun : ${(sommeJournal(options.journal) / 1e6).toFixed(4)} CHF au total, dont g2 ${(sommeJournal(options.journal, 'g2') / 1e6).toFixed(4)} CHF. Plafonds : mission ${options.plafondMission}, g2 ${options.plafondG2}, passe ${options.plafondPasse}.`);
  }
  const resultats = await jouerPasse({ cellules: options.cellules, cas: options.cas, sortie: options.sortie, workers: options.workers }, env, ligne => console.log(ligne));
  const depense = resultats.reduce((somme, r) => somme + coutCas(r), 0);
  console.log(`${options.simuler ? 'SIMULÉ ' : ''}Passe terminée : ${resultats.length} cas joués, ${(depense / 1e6).toFixed(4)} CHF${env.arret.raison ? ` ; ARRÊT : ${env.arret.raison}` : ''}. Journal : ${(sommeJournal(env.journal) / 1e6).toFixed(4)} CHF au total.`);
  if (env.arret.raison) process.exitCode = 2;
}
// vite-node n'expose pas le nom du script dans argv : le banc se lance quand un de ses drapeaux est là (comme banc-lecture-facture.ts).
const estPrincipal = () => !process.env.VITEST && (process.argv.includes('--simuler') || process.argv.includes('--payant')) && process.argv.includes('--cellule');
if (estPrincipal()) main(process.argv.slice(2)).catch(erreur => { console.error(String(erreur?.message ?? erreur)); process.exitCode = 1; });
