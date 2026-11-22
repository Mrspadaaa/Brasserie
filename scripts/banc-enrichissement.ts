/**
 * Banc de l'enrichissement des fiches d'ingredients (voie EI, mission 2026-11-08-enrichissement).
 *
 * Le brasseur (08.11) : « VITE_ENRICHISSEMENT_IA. Bien tester ca budget 10chf ». L'enrichissement est eteint en production
 * (`enrichissementReglages.ts`) ; allume, l'app appelle la tache serveur `lookupIngredient` (recherche Google ancree, `source` obligatoire,
 * « un champ non trouve reste absent ») pour completer la fiche d'un malt, d'un sucre ou d'une levure du stock. Ce banc mesure ce que cette
 * tache rend sur 38 produits publics (`verite.json`) : juste, dans la plage, faux, INVENTE, source citee, introuvable a raison ou a tort,
 * cout et duree par appel (`banc-enrichissement-juger.ts`).
 *
 * LE MEME CHEMIN QUE LA PRODUCTION, sans copie :
 *   · la requete : `requeteDe` (`enrichissementRequete.ts`, tiree de la file) ; la porte « identifiable » et le catalogue des levures, idem ;
 *   · la consigne et le schema : `ingredientLookupDefinition(kind)` (`functions/src/prompts.ts`) ;
 *   · le texte de l'utilisateur et le corps de la requete : `userTextOf` et `geminiBody` (`functions/src/geminiBody.ts`, que `ai.ts` appelle) ;
 *   · le modele, la reflexion et les tentatives : `geminiAttempts('lookupIngredient', 'fast')` et `TIERS` (`models.ts`) ;
 *   · le chiffrage et le reglement : `quoteGeminiCost` et `observedGeminiCostDetails` (`geminiCosts.ts`) ;
 *   · le refus d'une reponse coupee ou bouclee : `unusableGeminiOutput` ; la garde des levures : `yeastLookupResultError` ;
 *   · l'adaptation cote client : `valeursDeReponse` (`enrichissementCatalogues.ts`), `adaptYeastLookupResult` et `sanitizeFacts`.
 * Ce que le banc ne passe pas : le serveur `aiTask` (connexion Firebase) et le budget mensuel du serveur. Le banc appelle l'API Gemini
 * directement, avec sa propre garde de budget, comme `banc-lecture-facture.ts`.
 *
 * Un houblon n'est JAMAIS cherche par la procedure f4 (une valeur typique n'est pas l'alpha du lot, `ficheCle.ts`, M2). Le banc l'appelle quand meme
 * par le chemin « assistant » (le bouton « Completer avec l'IA » de `AiAssist.tsx`, qui envoie `kind: 'houblon'`) pour mesurer ce que le modele
 * rendrait, et verifie que `valeursDeReponse` n'ecrit rien pour lui.
 *
 * Quatre modes. `--simuler` (defaut) : aucun reseau, aucune cle, reponses fabriquees depuis la verite avec quelques fautes fabriquees pour
 * eprouver le juge. `--estimer` : le cout de la passe, sans reseau ni cle. `--payant --budget-chf <x> --plafond-passe <x> --confirm-paid-ai` :
 * vrais appels Gemini, cle lue par `readLocalKey` (jamais affichee), cout reserve avant chaque appel (au pire, 20 requetes de recherche comprises),
 * arret net au budget, une ligne de journal juste apres chaque appel. Le journal est a part de celui de la lecture des factures :
 * `work/missions/2026-11-08-enrichissement/journal-gemini.md`, plafond total 10 CHF.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --simuler
 *   npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --estimer
 *   npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --payant --budget-chf 10 --plafond-passe 5 --confirm-paid-ai
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingredientLookupDefinition } from '../functions/src/prompts';
import { TIERS, assertGeminiModel, geminiAttempts } from '../functions/src/models';
import { DEFAULT_MAX_OUTPUT_TOKENS, geminiBody, userTextOf } from '../functions/src/geminiBody';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';
import { geminiAnswerText, unusableGeminiOutput } from '../functions/src/geminiResponse';
import { yeastLookupResultError } from '../functions/src/yeastLookupResult';
import { GeminiApiError, parseGeminiError } from '../functions/src/geminiErrors';
import { AI_ATTEMPT_TIMEOUT_MS } from '../functions/src/aiTaskDeadline';
import { adaptYeastLookupResult, sanitizeFacts, type IngredientFacts } from '../src/domain/ingredientFacts';
import { nomPropre } from '../src/domain/stock/donnees';
import { cleFiche, type Famille as FamilleCle } from '../src/domain/stock/ficheCle';
import { ficheLevureDe, type ReferenceLevure } from '../src/domain/stock/ficheLevure';
import { isReadableUnit } from '../src/services/ingredientIdentity';
import { identifiable, requeteDe } from '../src/services/enrichissementRequete';
import { valeursDeReponse } from '../src/services/enrichissementCatalogues';
import { ESTIMATION_CHF_PIRE, ESTIMATION_CHF_PROBABLE, ESTIMATION_CHF_RESERVE } from '../src/services/enrichissementReglages';
import type { RequeteFiche } from '../src/services/enrichissement';
import type { TravailFiche } from '../src/services/enrichissementStore';
import { jugerTout, tableauMarkdown, type Appel, type ProduitVerite, type Tentative, type Verite } from './banc-enrichissement-juger';
// @ts-ignore — module JavaScript sans declarations
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans declarations
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

// ─── Constantes ──────────────────────────────────────────────────────────────────────────────

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MISSION_DIR = path.join(ROOT, 'work/missions/2026-11-08-enrichissement');
export const MISSION_JOURNAL = path.join(MISSION_DIR, 'journal-gemini.md');
export const VERITE_FILE = path.join(MISSION_DIR, 'verite.json');
/** « budget 10 CHF » (08.11) : le plafond TOTAL de la voie, journal compris ; le banc n'accepte pas plus. */
export const BUDGET_CAP_CHF = 10;
/** Une passe ne depense pas plus que cela, sauf `--plafond-passe` plus bas ou plus haut (jamais au-dessus du budget). */
export const DEFAULT_PASS_CAP_CHF = 3;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
/** La tache et son niveau, comme `executantDeRecherche` (`enrichissement.ts`) : `lookupIngredient`, `tier: 'fast'`. */
export const TACHE = 'lookupIngredient';
export const NIVEAU = 'fast' as const;
/** Estimation PAR APPEL, non mesuree : jetons 25 000 entree (resultats de recherche compris) et 6 000 sortie, 5 requetes de recherche. */
export const ESTIMATION_HAUTE_CHF = 0.2;

export const COUT = (micro: number) => (micro / 1e6).toFixed(4);

// ─── Verite et requete ───────────────────────────────────────────────────────────────────────

export function chargerVerite(file: string = VERITE_FILE): Verite {
  const v = JSON.parse(readFileSync(file, 'utf8')) as Verite;
  const ids = new Set<string>();
  for (const p of v.produits) {
    if (ids.has(p.id)) throw new Error(`Verite : l'identifiant ${p.id} est repete.`);
    ids.add(p.id);
  }
  return v;
}

const FAMILLE_CLE: Record<ProduitVerite['famille'], FamilleCle> = { malt: 'malt', houblon: 'houblon', levure: 'levure' };
const CONTEXTE = { malt: 'Malt', houblon: 'Houblon', levure: 'Levure' } as const;

/** Le travail de la file pour une ligne de justificatif : ce que `travauxDeLaSaisie` aurait range pour cette saisie. */
export function travailDe(p: ProduitVerite): TravailFiche {
  const famille = FAMILLE_CLE[p.famille];
  const unite = p.saisie.unite && isReadableUnit(p.saisie.unite) ? p.saisie.unite.trim().toLowerCase() : undefined;
  const nom = famille === 'levure' ? p.saisie.description.trim() : nomPropre(p.saisie.description, CONTEXTE[p.famille], { unit: unite, quantity: p.saisie.quantite });
  const sucre = /sucre|sugar|dextrose|candi/i.test(p.saisie.description);
  return {
    ref: `MP-banc-${p.id}`, submissionId: 'banc', transactionId: 'TX-banc', uid: 'banc', famille,
    ligne: {
      description: p.saisie.description.trim(), nomPropre: nom, unit: p.saisie.unite ?? '', ...(p.saisie.quantite !== undefined ? { quantity: p.saisie.quantite } : {}),
      ...(p.saisie.reference ? { reference: p.saisie.reference } : {}), ...(p.saisie.fournisseur ? { fournisseur: p.saisie.fournisseur } : {}),
      kind: 'ingredient', ...(sucre ? { stockCategory: 'Sucre' } : {}), lu: {},
    },
    s6: { cas: 'inconnu' }, cle: cleFiche(famille, nom), etat: 'attend', essais: { joursEchec: [] }, creeLe: '2026-11-08T00:00:00.000Z', annonce: false,
  };
}

export interface Garde { decision: Appel['garde']['decision']; raison: string }
/** Ce que la procedure f4 ferait de ce travail avant tout appel (`traiterTravail`, etapes 1 et 2 pour la levure et le malt, houblon : jamais). */
export function gardeDe(t: TravailFiche, references: readonly ReferenceLevure[]): Garde {
  if (t.famille === 'houblon') return { decision: 'aucune-recherche', raison: 'houblon : jamais de recherche en ligne, jamais d\'alpha (M2)' };
  if (t.famille === 'levure') {
    const f = ficheLevureDe(t.ligne.description, references);
    if (f.cas === 'sur' || f.cas === 'aControler') return { decision: 'catalogue', raison: `le catalogue des levures la rend (${f.cas})` };
    if (f.cas === 'ambigu') return { decision: 'ambigu', raison: 'plusieurs levures du catalogue : a controler, aucun appel' };
    return { decision: 'recherche', raison: 'absente du catalogue : recherche en ligne' };
  }
  return identifiable(t) ? { decision: 'recherche', raison: 'malt identifiable (fabricant ou marque ecrits)' } : { decision: 'nonIdentifiable', raison: 'malt sans fabricant ni marque : a saisir, aucun appel' };
}

/** La requete envoyee a la tache : celle de `requeteDe` pour un malt, un sucre ou une levure ; celle de `AiAssist` pour un houblon. */
export function requetePour(t: TravailFiche): RequeteFiche & { kind: 'malt' | 'levure' | 'houblon' } {
  if (t.famille === 'houblon') {
    const nom = t.ligne.nomPropre.trim();
    return { kind: 'houblon', name: nom, instruction: `houblon : ${nom}`, context: { kind: 'houblon', name: nom, manquant: ['acides alpha'] } } as RequeteFiche & { kind: 'houblon' };
  }
  const trous = t.famille === 'levure' ? ['yeastAttenuationPct', 'yeastTempMinC', 'yeastTempMaxC', 'yeastLab'] as const : ['colorEbc', 'potentialPpg'] as const;
  return requeteDe(t, trous) as RequeteFiche & { kind: 'malt' | 'levure' };
}

export interface AppelPrepare { travail: TravailFiche; requete: ReturnType<typeof requetePour>; garde: Garde; route: ReturnType<typeof geminiAttempts>; userText: string; system: string; body: Record<string, unknown>[] }
/** Tout ce qui part, sans rien envoyer : le corps de chaque tentative (3.8 puis 3.8, `geminiAttempts`). */
export function preparer(p: ProduitVerite, references: readonly ReferenceLevure[]): AppelPrepare {
  const travail = travailDe(p);
  const requete = requetePour(travail);
  const def = ingredientLookupDefinition((requete.context as { kind?: unknown }).kind);
  const userText = userTextOf(requete.instruction, requete.context);
  const route = geminiAttempts(TACHE, NIVEAU);
  const body = route.map(({ thinkingLevel }) => geminiBody({
    systemPrompt: def.system, userText, schema: def.schema as Record<string, unknown>,
    settings: { temperature: TIERS[NIVEAU].temperature, thinkingLevel }, grounded: def.grounded, maxOutputTokens: def.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
  }));
  return { travail, requete, garde: gardeDe(travail, references), route, userText, system: def.system, body };
}

// ─── Budget et journal ───────────────────────────────────────────────────────────────────────

export class BudgetStop extends Error { constructor(message: string) { super(message); this.name = 'BudgetStop'; } }
export class Budget {
  reserved = 0;
  readonly startMicro: number;
  /** `limitMicro` : le plafond TOTAL (journal compris) ; `passCapMicro` : le plafond de CETTE passe. */
  constructor(readonly limitMicro: number, public spentMicro = 0, readonly passCapMicro?: number) { this.startMicro = spentMicro; }
  passMicro(): number { return this.spentMicro - this.startMicro + this.reserved; }
  reserve(micro: number): number {
    if (this.spentMicro + this.reserved + micro > this.limitMicro)
      throw new BudgetStop(`Budget atteint : ${COUT(this.spentMicro)} CHF depenses, ${COUT(this.reserved)} CHF reserves, cet appel en reserverait ${COUT(micro)} sur ${(this.limitMicro / 1e6).toFixed(2)} CHF. Arret net.`);
    if (this.passCapMicro !== undefined && this.passMicro() + micro > this.passCapMicro)
      throw new BudgetStop(`Plafond de passe atteint : ${COUT(this.spentMicro - this.startMicro)} CHF depenses par cette passe, cet appel en reserverait ${COUT(micro)} sur ${(this.passCapMicro / 1e6).toFixed(2)} CHF. Arret net avant le depassement.`);
    this.reserved += micro;
    return micro;
  }
  /** Cout inconnu (delai, reseau) : la reserve entiere est comptee, jamais zero. */
  settle(reserved: number, actual: number | null) { this.reserved -= reserved; this.spentMicro += actual ?? reserved; }
}

const JOURNAL_HEAD = [
  '# Journal des appels Gemini du banc de l\'enrichissement (voie EI, 08.11)', '',
  'Une ligne par tentative, ecrite juste apres elle. Aucune valeur : des produits publics. Couts au tarif provisionne de `geminiCosts.ts` (1,25 CHF/USD, 20 requetes de recherche reservees, requetes lues dans la reponse), pas une facture. Plafond total : 10 CHF. Journal a part de celui de la lecture des factures.', '',
  '| date | produit | essai | modele | duree | entree | sortie | recherches | cout CHF | cumul CHF | etat |', '|---|---|---|---|---|---|---|---|---|---|---|', '',
].join('\n');
const chf6 = (micro: number) => (micro / 1e6).toFixed(6);
export function appendJournal(file: string, id: string, essai: number, t: Tentative, cumulMicro: number, simule: boolean) {
  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file)) writeFileSync(file, JOURNAL_HEAD);
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  appendFileSync(file, `| ${date} | ${id} | ${essai} | ${t.model} | ${t.ms} ms | ${t.entree ?? '?'} | ${t.sortie ?? '?'} | ${t.recherches ?? '?'} | ${chf6(t.coutMicro)} | ${chf6(cumulMicro)} | ${t.etat}${simule ? ' SIMULÉ' : ''} |\n`);
}
/** Depense deja journalisee par les passes payantes (colonne « cout CHF »), les lignes SIMULÉ exclues. */
export function spentInJournal(file: string): number {
  if (!existsSync(file)) return 0;
  let micro = 0;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const cells = line.split('|').map(cell => cell.trim());
    if (cells.length < 12 || !/^\d{4}-\d{2}-\d{2}/.test(cells[1] ?? '') || /SIMULÉ/.test(line)) continue;
    const cost = Number(cells[9]);
    if (Number.isFinite(cost)) micro += Math.round(cost * 1e6);
  }
  return micro;
}

// ─── Transport ───────────────────────────────────────────────────────────────────────────────

export type Transport = (model: string, body: Record<string, unknown>, meta: { id: string; essai: number }, signal: AbortSignal) => Promise<{ json: any; ms: number }>;
export function realTransport(key: string, fetchImpl: typeof fetch = fetch): Transport {
  return async (model, body, _meta, signal) => {
    assertGeminiModel(model);
    const started = Date.now();
    const response = await fetchImpl(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const erreur = parseGeminiError(response.status, model, json, response.headers.get('retry-after'));
      const motif = redact(String((json as any)?.error?.message ?? '').slice(0, 300), key);
      if (motif) console.error(`Gemini HTTP ${response.status} (${model}) : ${motif}`);
      throw erreur;
    }
    return { json, ms: Date.now() - started };
  };
}

/** Les jetons de l'outil de recherche sont une entree de plus (`toolUsePromptTokenCount`) : comptes, par prudence, comme au banc de lecture. */
export function withToolTokens(json: any): any {
  const usage = json?.usageMetadata;
  const extra = usage?.toolUsePromptTokenCount;
  if (!usage || typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) return json;
  return { ...json, usageMetadata: { ...usage, promptTokenCount: (usage.promptTokenCount ?? 0) + extra, totalTokenCount: (usage.totalTokenCount ?? 0) } };
}

// ─── Un appel, comme aiTask ──────────────────────────────────────────────────────────────────

export interface BancDeps { transport: Transport; budget: Budget; journalPath: string; simule: boolean; outDir: string; log: (line: string) => void; prete?: (id: string, essai: number) => { json: any; ms: number } | undefined }

const lireJson = (texte: string) => JSON.parse(texte.replace(/```json/g, '').replace(/```/g, '').trim());

/**
 * Les tentatives de `aiTask` pour `lookupIngredient` : 3.8, puis une seule nouvelle tentative sur 3.8 si le service flanche. Une reponse coupee
 * ou bouclee (`unusableGeminiOutput`) n'est pas redemandee ; un delai non plus ; un refus du fournisseur qui ne se contourne pas non plus.
 */
export async function appeler(p: ProduitVerite, prep: AppelPrepare, deps: BancDeps): Promise<Appel> {
  const { requete, travail, garde, route, body } = prep;
  const kind = requete.kind;
  const tentatives: Tentative[] = [];
  const debut = Date.now();
  let reponse: Record<string, any> | null = null, erreur: string | undefined, refusLevure: string | undefined;
  for (const [index, { model }] of route.entries()) {
    const quote = quoteGeminiCost(model, body[index]);
    const reserved = deps.budget.reserve(quote.reservedMicroChf);
    const started = Date.now();
    let reglee = false;
    const regler = (cout: number | null) => { if (!reglee) { reglee = true; deps.budget.settle(reserved, cout); } };
    let tentative: Tentative;
    try {
      const signal = AbortSignal.timeout(AI_ATTEMPT_TIMEOUT_MS);
      const pret = deps.prete?.(p.id, index + 1);
      const answer = pret ?? await deps.transport(model, quote.body, { id: p.id, essai: index + 1 }, signal);
      const details = observedGeminiCostDetails(quote, withToolTokens(answer.json));
      regler(details?.chargedMicroChf ?? null);
      writeFileSync(path.join(deps.outDir, 'raw', `${p.id}-${index + 1}.json`), JSON.stringify(answer.json));
      const usage = answer.json?.usageMetadata ?? {};
      const mesure = {
        model, ms: answer.ms, entree: typeof usage.promptTokenCount === 'number' ? usage.promptTokenCount + (usage.toolUsePromptTokenCount ?? 0) : null,
        sortie: typeof usage.candidatesTokenCount === 'number' ? usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0) : null,
        recherches: details ? details.searchQueries : null, coutMicro: details?.chargedMicroChf ?? reserved, reserveMicro: reserved, ...(deps.simule ? { simule: true } : {}),
      };
      const inutilisable = unusableGeminiOutput(answer.json);
      const texte = geminiAnswerText(answer.json);
      if (inutilisable) { tentative = { ...mesure, etat: 'inutilisable' }; erreur = inutilisable.message; tentatives.push(tentative); deps.log(`  ${p.id} essai ${index + 1} : reponse inutilisable (${inutilisable.reason}), pas de nouvel essai.`); appendJournal(deps.journalPath, p.id, index + 1, tentative, deps.budget.spentMicro, deps.simule); break; }
      if (!texte) { tentative = { ...mesure, etat: 'vide' }; erreur = 'Aucun contenu renvoye.'; tentatives.push(tentative); appendJournal(deps.journalPath, p.id, index + 1, tentative, deps.budget.spentMicro, deps.simule); continue; }
      let brute: Record<string, any>;
      try { brute = lireJson(texte); } catch { tentative = { ...mesure, etat: 'illisible' }; erreur = 'Reponse illisible.'; tentatives.push(tentative); appendJournal(deps.journalPath, p.id, index + 1, tentative, deps.budget.spentMicro, deps.simule); continue; }
      tentative = { ...mesure, etat: 'ok' };
      tentatives.push(tentative);
      appendJournal(deps.journalPath, p.id, index + 1, tentative, deps.budget.spentMicro, deps.simule);
      reponse = brute; erreur = undefined;
      break;
    } catch (error: any) {
      if (error instanceof BudgetStop) throw error;
      // HTTP refuse (le fournisseur a repondu une erreur) : rien n'est facture, comme au banc de lecture. Delai ou coupure reseau : la reponse a pu l'etre, la reserve est comptee.
      const http = error instanceof GeminiApiError ? error.httpStatus : undefined;
      regler(http !== undefined ? 0 : null);
      const delai = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      tentative = { model, ms: Date.now() - started, etat: delai ? 'delai' : http !== undefined ? 'http' : 'reseau', ...(http !== undefined ? { httpStatus: http } : {}), entree: null, sortie: null, recherches: null,
        coutMicro: http !== undefined ? 0 : reserved, reserveMicro: reserved, ...(deps.simule ? { simule: true } : {}) };
      tentatives.push(tentative);
      appendJournal(deps.journalPath, p.id, index + 1, tentative, deps.budget.spentMicro, deps.simule);
      erreur = redact(String(error?.message ?? error).slice(0, 200), 'cle-absente');
      if (delai || (error instanceof GeminiApiError && !error.canTryAnotherModel)) break;
    }
  }
  // La duree d'un appel est celle de ses tentatives (l'attente du fournisseur), pas celle de l'analyse locale.
  const coutMicro = tentatives.reduce((s, t) => s + t.coutMicro, 0), ms = tentatives.reduce((s, t) => s + t.ms, 0) || Date.now() - debut;
  const base = { id: p.id, famille: p.famille, kind, nom: travail.ligne.nomPropre, chemin: (p.famille === 'houblon' ? 'assistant' : 'f4') as Appel['chemin'], garde, tentatives, coutMicro, ms };
  if (!reponse) return { ...base, etat: 'echec', ...(erreur ? { erreur } : {}) };
  // Cote serveur puis cote client : la garde des fiches de levure refuse une reponse sans source documentaire (`aiTask`, `AiClient.run`).
  if (kind === 'levure') { refusLevure = yeastLookupResultError(reponse); }
  const brute = reponse as IngredientFacts;
  const facts = refusLevure ? null : sanitizeFacts(kind === 'levure' ? adaptYeastLookupResult(brute) : brute);
  const ecrit = refusLevure ? undefined : valeursDeReponse(travail.famille, brute);
  return { ...base, etat: 'repondu', reponse, facts, ecritF4: ecrit ? { valeurs: ecrit.valeurs as Record<string, unknown>, source: ecrit.source, ...(ecrit.url ? { url: ecrit.url } : {}), deduit: ecrit.deduit as Record<string, string> } : null, ...(refusLevure ? { refusLevure } : {}) };
}

// ─── Simulation : des reponses fabriquees depuis la verite, et des fautes fabriquees pour eprouver le juge ──────────

/** Une faute par produit : elle doit etre vue par le juge (`tests/unit/banc-enrichissement.test.ts`). */
export const FAUTES: Record<string, string> = {
  p03: 'introuvable',            // Caramunch Typ 1 rendu « introuvable » : a tort
  p05: 'alpha-faux',             // Nelson Sauvin a 18 % : faux
  p08: 'moyenne-levure',         // US-05 : l'attenuation au milieu de la plage, comme un point : invente
  p09: 'source-blog',            // Nottingham cite un blog
  f04: 'chiffre-generique',      // « Pilsner Malz » recoit la couleur d'un Pilsner : attribue a tort
  f10: 'sans-source-chiffre',    // Melanoidin : une couleur sans source
  x01: 'fiche-inventee',         // Zorbax Super Pale 77 : une fiche pour un produit qui n'existe pas
  x02: 'alpha-de-citra',         // Citra Zeta recoit l'alpha de Citra
};
const milieu = (r: [number, number]) => Math.round(((r[0] + r[1]) / 2) * 10) / 10;
const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function reponseFabriquee(p: ProduitVerite, faute?: string): Record<string, unknown> {
  const a = p.attendu;
  const introuvable = (note: string) => ({ found: false, name: p.saisie.description, source: '', note, ...(p.famille === 'malt' ? { colorEbc: null, colorEbcMin: null, colorEbcMax: null, extractPct: null, potentialPpg: null } : {}), ...(p.famille === 'levure' ? { technicalFacts: [] } : {}) });
  if (faute === 'introuvable' || (!a.existe && faute !== 'fiche-inventee' && faute !== 'alpha-de-citra') || a.ambigu || a.horsPerimetre) {
    if (faute === 'chiffre-generique') return { found: true, name: 'Weyermann Pilsner Malt', source: 'Weyermann — fiche technique Pilsner Malt', sourceUrl: 'https://www.weyermann.de/product/weyermann-pilsner-malt/', colorEbc: null, colorEbcMin: 2.5, colorEbcMax: 4.5, extractPct: null, potentialPpg: null };
    return introuvable(a.ambigu ? 'Nom generique : indiquer le fabricant.' : 'Aucune fiche publiee trouvee.');
  }
  const fiche = p.fiche, src = fiche ? `${p.producteur ?? 'Producteur'} — fiche technique ${fiche.titre}` : 'Fiche du banc';
  const url = faute === 'source-blog' ? 'https://www.homebrewtalk.com/threads/nottingham.1/' : fiche?.url ?? 'https://www.weyermann.de/product/weyermann-pilsner-malt/';
  const champs = a.champs;
  if (p.famille === 'malt') {
    const plage = champs.colorEbc?.plage ?? [3, 5];
    if (faute === 'fiche-inventee') return { found: true, name: p.saisie.description, source: 'Zorbax Malting — fiche technique', sourceUrl: 'https://www.zorbax-malting.example/super-pale-77', colorEbc: null, colorEbcMin: 4, colorEbcMax: 6, extractPct: 80, potentialPpg: null };
    return { found: true, name: fiche?.titre ?? p.saisie.description, source: faute === 'sans-source-chiffre' ? ' ' : src, sourceUrl: url, colorEbc: null, colorEbcMin: plage[0], colorEbcMax: plage[1], extractPct: null, potentialPpg: null };
  }
  if (p.famille === 'houblon') {
    const plage = champs.alphaPct?.plage ?? [12, 13];
    const alpha = faute === 'alpha-faux' ? 18 : faute === 'alpha-de-citra' ? 12 : milieu(plage);
    return { found: true, name: fiche?.titre ?? p.saisie.description, source: faute === 'alpha-de-citra' ? 'Yakima Chief Hops — fiche Citra' : src, sourceUrl: faute === 'alpha-de-citra' ? 'https://www.yakimachief.com/hops/citra' : url, alphaPct: alpha };
  }
  const tf = (key: string, reported: string, min: number, max: number, unit: string) => ({ key, reported, range: { min, max }, unit, qualifier: min === max ? 'reportedPoint' : 'range', origin: 'ai', source: src, sourceUrl: url, retrievedAt: '2026-11-08' });
  const att = champs.attenuationPct?.plage, temp = champs.tempC?.plage, alc = champs.alcoholTolerancePct;
  const faits = [
    ...(att && faute !== 'moyenne-levure' ? [tf('attenuation', `${att[0]}-${att[1]} %`, att[0], att[1], '%')] : []),
    ...(temp ? [tf('temperature', `${temp[0]}-${temp[1]} °C`, temp[0], temp[1], '°C')] : []),
    ...(alc?.plage ? [tf('alcoholTolerance', `${alc.plage[0]}-${alc.plage[1]} % ABV`, alc.plage[0], alc.plage[1], '% ABV')] : alc?.valeur !== undefined ? [tf('alcoholTolerance', `${alc.valeur} % ABV`, alc.valeur, alc.valeur, '% ABV')] : []),
    { key: 'flocculation', reported: maj(champs.flocculation?.texte ?? 'medium'), origin: 'ai', source: src, sourceUrl: url, retrievedAt: '2026-11-08' },
  ];
  return {
    found: true, name: fiche?.titre ?? p.saisie.description, source: src, sourceUrl: url, retrievedAt: '2026-11-08', lab: p.producteur, form: champs.form?.texte, flocculation: maj(champs.flocculation?.texte ?? 'medium'),
    ...(temp ? { tempMinC: temp[0], tempMaxC: temp[1] } : {}), ...(faute === 'moyenne-levure' && att ? { attenuationPct: milieu(att) } : {}), technicalFacts: faits,
  };
}

/** Le transport simule : aucune connexion ; la reponse a la forme d'une reponse Gemini ancree (jetons, requetes de recherche). */
export function transportSimule(verite: Verite, avecFautes: boolean): Transport {
  const parId = new Map(verite.produits.map(p => [p.id, p]));
  return async (_model, _body, meta) => {
    const p = parId.get(meta.id);
    if (!p) throw new Error(`Simulation : produit ${meta.id} inconnu.`);
    const rep = reponseFabriquee(p, avecFautes ? FAUTES[p.id] : undefined);
    const texte = JSON.stringify(rep);
    return { ms: 6000 + (meta.id.charCodeAt(1) % 7) * 500, json: {
      candidates: [{ finishReason: 'STOP', content: { parts: [{ text: texte }] }, groundingMetadata: { webSearchQueries: ['q1 ' + p.saisie.description, 'q2 ' + p.saisie.description, 'q3 fiche technique'] } }],
      usageMetadata: { promptTokenCount: 1500, toolUsePromptTokenCount: 14000, candidatesTokenCount: Math.ceil(texte.length / 3), thoughtsTokenCount: 600, totalTokenCount: 16100 + Math.ceil(texte.length / 3) },
    } };
  };
}

// ─── Options ─────────────────────────────────────────────────────────────────────────────────

export interface BancOptions {
  mode: 'simuler' | 'payant'; estimer: boolean; budgetChf?: number; plafondPasse?: number; out?: string; verite?: string; cas?: string[]; groupes?: string[]; familles?: string[];
  selonGarde: boolean; sansFautes: boolean; reprendre?: string;
}
export function parseArgs(argv: string[]): BancOptions {
  const args = argv.filter(arg => arg !== '--');
  const value = (flag: string) => { const at = args.indexOf(flag); return at >= 0 ? args[at + 1] : undefined; };
  const liste = (flag: string) => value(flag)?.split(',').map(x => x.trim()).filter(Boolean);
  const payant = args.includes('--payant'), simuler = args.includes('--simuler');
  if (payant && simuler) throw new Error('--payant et --simuler s’excluent.');
  let budgetChf: number | undefined;
  if (payant) {
    budgetChf = Number(value('--budget-chf'));
    if (!(budgetChf > 0 && budgetChf <= BUDGET_CAP_CHF)) throw new Error(`Le mode --payant exige --budget-chf <= ${BUDGET_CAP_CHF} (accord du 08.11 : 10 CHF au total). Aucun appel.`);
  }
  let plafondPasse: number | undefined;
  if (payant || value('--plafond-passe') !== undefined) {
    plafondPasse = value('--plafond-passe') === undefined ? DEFAULT_PASS_CAP_CHF : Number(value('--plafond-passe'));
    if (!(plafondPasse > 0)) throw new Error('--plafond-passe attend un montant en CHF superieur a 0.');
    if (payant && budgetChf !== undefined && plafondPasse > budgetChf) throw new Error('--plafond-passe ne peut pas depasser --budget-chf.');
  }
  return { mode: payant ? 'payant' : 'simuler', estimer: args.includes('--estimer'), ...(budgetChf !== undefined ? { budgetChf } : {}), ...(plafondPasse !== undefined ? { plafondPasse } : {}),
    ...(value('--out') ? { out: value('--out') } : {}), ...(value('--verite') ? { verite: value('--verite') } : {}), ...(liste('--cas') ? { cas: liste('--cas') } : {}),
    ...(liste('--groupe') ? { groupes: liste('--groupe') } : {}), ...(liste('--famille') ? { familles: liste('--famille') } : {}),
    selonGarde: args.includes('--selon-garde'), sansFautes: args.includes('--sans-fautes'), ...(value('--reprendre') ? { reprendre: value('--reprendre') } : {}) };
}

export function choisir(verite: Verite, o: Pick<BancOptions, 'cas' | 'groupes' | 'familles'>): ProduitVerite[] {
  const inconnus = (o.cas ?? []).filter(id => !verite.produits.some(p => p.id === id));
  if (inconnus.length) throw new Error(`--cas : produit(s) inconnu(s) ${inconnus.join(', ')}.`);
  return verite.produits.filter(p => (!o.cas || o.cas.includes(p.id)) && (!o.groupes || o.groupes.includes(p.groupe)) && (!o.familles || o.familles.includes(p.famille)));
}

async function referencesLevures(): Promise<ReferenceLevure[]> { return (await import('../src/services/enrichissementLevures')).referencesLevures(); }

// ─── --estimer ───────────────────────────────────────────────────────────────────────────────

export interface Estimation { appels: number; reserveMicro: number; reserveParAppelMicro: number; probable: [number, number]; haute: number; spentMicro: number; texte: string[] }
export function estimer(produits: ProduitVerite[], references: readonly ReferenceLevure[], o: Pick<BancOptions, 'selonGarde' | 'budgetChf' | 'plafondPasse'>, spentMicro: number): Estimation {
  const preps = produits.map(p => ({ p, prep: preparer(p, references) }));
  const retenus = preps.filter(({ prep }) => !o.selonGarde || prep.garde.decision === 'recherche');
  const reserves = retenus.map(({ prep }) => quoteGeminiCost(prep.route[0].model, prep.body[0]).reservedMicroChf);
  const reserveMicro = reserves.reduce((s, x) => s + x, 0);
  const n = retenus.length;
  const probable: [number, number] = [n * ESTIMATION_CHF_PROBABLE[0], n * ESTIMATION_CHF_PROBABLE[1]];
  const haute = n * ESTIMATION_HAUTE_CHF;
  const parGarde: Record<string, number> = {};
  for (const { prep } of preps) parGarde[prep.garde.decision] = (parGarde[prep.garde.decision] ?? 0) + 1;
  const parFamille: Record<string, number> = {};
  for (const { p } of retenus) parFamille[p.famille] = (parFamille[p.famille] ?? 0) + 1;
  const texte = [
    `Passe : ${produits.length} produits choisis, ${n} appel(s) ${o.selonGarde ? '(seulement ceux que la garde de f4 laisse partir)' : '(tous : la garde de f4 est notee, pas appliquee)'} ; par famille ${Object.entries(parFamille).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
    `Garde de f4 sur ces produits : ${Object.entries(parGarde).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
    `Chemin : ${TACHE}, niveau ${NIVEAU}, ${preps[0] ? `${preps[0].prep.route.length} tentatives au plus (${preps[0].prep.route.map(r => `${r.model}/${r.thinkingLevel}`).join(' puis ')})` : 'aucun produit'}, recherche Google ancree.`,
    `Reserve par appel (le pire que la garde compte avant l'appel : 20 requetes de recherche reservees, sortie au plafond) : ${COUT(n ? reserveMicro / n : 0)} CHF ; reserve maximale cumulee ${COUT(reserveMicro)} CHF si CHAQUE appel consommait toute sa reserve.`,
    `Probable (ESTIMATION non mesuree, enrichissementReglages.ts : ${ESTIMATION_CHF_PROBABLE[0]} a ${ESTIMATION_CHF_PROBABLE[1]} CHF par appel) : ${probable[0].toFixed(2)} a ${probable[1].toFixed(2)} CHF.`,
    `Haut realiste (ESTIMATION : ${ESTIMATION_HAUTE_CHF} CHF par appel = 25 000 jetons d'entree, 6 000 de sortie, 5 requetes de recherche) : ${haute.toFixed(2)} CHF. Pire de f4 : ${ESTIMATION_CHF_RESERVE} CHF reserves / ${ESTIMATION_CHF_PIRE} CHF au pire deux essais, par appel.`,
    `Deja journalise : ${COUT(spentMicro)} CHF${o.budgetChf === undefined ? '' : `, budget ${o.budgetChf} CHF (reste ${((o.budgetChf * 1e6 - spentMicro) / 1e6).toFixed(2)} CHF)`}.`,
  ];
  const limite = BUDGET_CAP_CHF * 1e6 - spentMicro;
  texte.push(haute * 1e6 <= limite ? `Le haut realiste (${haute.toFixed(2)} CHF) TIENT sous les ${BUDGET_CAP_CHF} CHF.` : `Le haut realiste (${haute.toFixed(2)} CHF) DEPASSE le reste du budget : lancer par etapes (--cas, --groupe).`);
  if (reserveMicro > limite) texte.push(`La reserve maximale cumulee depasse le budget : la garde s'arrete net a ${BUDGET_CAP_CHF} CHF, avant le depassement, mais ne laisse alors pas finir les derniers produits.`);
  if (o.plafondPasse !== undefined) texte.push(`Plafond de passe ${o.plafondPasse} CHF : la reserve maximale ${reserveMicro <= o.plafondPasse * 1e6 ? 'tient dedans' : 'le depasse (la passe s\'arretera net avant le depassement)'} ; le haut realiste ${haute <= o.plafondPasse ? 'tient dedans' : 'le depasse'}.`);
  texte.push(`BANC ESTIME probable ${probable[0].toFixed(2)}-${probable[1].toFixed(2)} CHF, haut ${haute.toFixed(2)} CHF, reserve max ${COUT(reserveMicro)} CHF, ${n} appels`);
  return { appels: n, reserveMicro, reserveParAppelMicro: n ? Math.round(reserveMicro / n) : 0, probable, haute, spentMicro, texte };
}

// ─── Une passe ───────────────────────────────────────────────────────────────────────────────

export interface Passe { appels: Appel[]; out: string; arret?: string; depenseMicro: number }
export async function runBench(options: BancOptions, deps: Partial<Pick<BancDeps, 'transport' | 'journalPath' | 'log'>> & { optIn?: (label: string, command: string) => void; readKey?: () => string | undefined; references?: ReferenceLevure[] } = {}): Promise<Passe> {
  const log = deps.log ?? ((line: string) => console.log(line));
  const verite = chargerVerite(options.verite);
  const produits = choisir(verite, options);
  if (!produits.length) throw new Error('Aucun produit choisi.');
  const simule = options.mode === 'simuler';
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const out = path.resolve(options.out ?? (simule ? path.join(tmpdir(), `banc-enrichissement-sim-${stamp}`) : path.join(MISSION_DIR, 'passes', stamp)));
  mkdirSync(path.join(out, 'raw'), { recursive: true });
  const journalPath = deps.journalPath ?? (simule ? path.join(out, 'journal-gemini.md') : MISSION_JOURNAL);
  const references = deps.references ?? await referencesLevures();

  let transport: Transport, budget: Budget, restoreFetch = () => {};
  if (simule) {
    // Aucun reseau, aucune cle : le fetch global lui-meme est coupe.
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => { throw new Error('Reseau interdit en simulation.'); }) as typeof fetch;
    restoreFetch = () => { globalThis.fetch = realFetch; };
    transport = deps.transport ?? transportSimule(verite, !options.sansFautes);
    budget = new Budget(Number.MAX_SAFE_INTEGER);
  } else {
    (deps.optIn ?? ((label: string, command: string) => requirePaidAiTestOptIn({ label, command })))(
      `Banc de l'enrichissement des fiches (${produits.length} produits, budget ${options.budgetChf} CHF, plafond de passe ${options.plafondPasse} CHF)`,
      `npx vite-node --config vitest.config.ts scripts/banc-enrichissement.ts -- --payant --budget-chf ${options.budgetChf} --plafond-passe ${options.plafondPasse} --confirm-paid-ai`);
    const key = (deps.readKey ?? (() => readLocalKey()))();
    if (!key) throw new Error('Aucune cle Gemini locale : ni GEMINI_API_KEY, ni le fichier de cle du poste (lu par readLocalKey). Aucun appel.');
    transport = deps.transport ?? realTransport(key);
    const avant = spentInJournal(journalPath);
    budget = new Budget(Math.round((options.budgetChf ?? 0) * 1e6), avant, Math.round((options.plafondPasse ?? DEFAULT_PASS_CAP_CHF) * 1e6));
    log(`Plafond de la passe ${options.plafondPasse} CHF (arret net avant le depassement).`);
    log(`Budget ${options.budgetChf} CHF, deja journalise ${COUT(avant)} CHF.`);
  }

  const pretes = options.reprendre ? new Map(produits.map(p => [p.id, [1, 2].map(e => path.join(options.reprendre!, 'raw', `${p.id}-${e}.json`))])) : undefined;
  const prete = pretes ? (id: string, essai: number) => { const f = pretes.get(id)?.[essai - 1]; return f && existsSync(f) ? { json: JSON.parse(readFileSync(f, 'utf8')), ms: 0 } : undefined; } : undefined;
  const appels: Appel[] = [];
  let arret: string | undefined;
  let echecsDAffilee = 0;
  try {
    for (const p of produits) {
      const prep = preparer(p, references);
      if (options.selonGarde && prep.garde.decision !== 'recherche') {
        appels.push({ id: p.id, famille: p.famille, kind: prep.requete.kind, nom: prep.travail.ligne.nomPropre, chemin: p.famille === 'houblon' ? 'assistant' : 'f4', garde: prep.garde, etat: 'non-appele', tentatives: [], coutMicro: 0, ms: 0 });
        continue;
      }
      let appel: Appel;
      try { appel = await appeler(p, prep, { transport, budget, journalPath, simule, outDir: out, log, ...(prete ? { prete } : {}) }); }
      catch (error) { if (error instanceof BudgetStop) { arret = error.message; log(arret); break; } throw error; }
      appels.push(appel);
      log(`${p.id} ${appel.nom} : ${appel.etat}${appel.reponse ? (appel.reponse.found ? ' (fiche)' : ' (introuvable)') : ''}, ${COUT(appel.coutMicro)} CHF, ${appel.ms} ms`);
      echecsDAffilee = appel.etat === 'echec' ? echecsDAffilee + 1 : 0;
      if (echecsDAffilee >= 3) { arret = 'Trois produits en echec d\'affilee : arret net (un fournisseur qui refuse en boucle ne se mesure pas).'; log(arret); break; }
    }
  } finally { restoreFetch(); }

  writeFileSync(path.join(out, 'appels.json'), JSON.stringify(appels, null, 2));
  const { juges, synthese } = jugerTout(verite, appels);
  writeFileSync(path.join(out, 'jugement.json'), JSON.stringify({ juges, synthese }, null, 2));
  writeFileSync(path.join(out, 'JUGEMENT.md'), tableauMarkdown(verite, juges, synthese));
  log(`JUGE ${synthese.appeles}/${synthese.produits} produits, ${synthese.inventes} inventes, ${synthese.violationsM2} violation(s) M2, ${synthese.introuvablesATort} introuvable(s) a tort, ${synthese.coutTotalChf.toFixed(4)} CHF`);
  log(`Passe ${simule ? 'SIMULEE ' : ''}terminee : ${appels.length} produits, ${COUT(budget.spentMicro - budget.startMicro)} CHF, dossier ${out}.`);
  return { appels, out, ...(arret ? { arret } : {}), depenseMicro: budget.spentMicro - budget.startMicro };
}

const isMain = () => !process.env.VITEST && (process.argv.includes('--simuler') || process.argv.includes('--payant') || process.argv.includes('--estimer'));
if (isMain()) {
  void (async () => {
    try {
      const options = parseArgs(process.argv.slice(2));
      if (options.estimer) {
        const verite = chargerVerite(options.verite);
        const e = estimer(choisir(verite, options), await referencesLevures(), options, spentInJournal(MISSION_JOURNAL));
        console.log(e.texte.join('\n'));
      } else await runBench(options);
      process.exit(0);
    } catch (error) { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
  })();
}
