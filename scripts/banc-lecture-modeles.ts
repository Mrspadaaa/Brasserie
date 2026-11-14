/**
 * Modèle et réflexion du rôle « 3.8 » au banc de lecture (mission 2026-11-14-gemini4, voie g1).
 *
 * Sa demande (14.11) : « Plutôt là où 3.8 était utilisé […] Vitesse et précision. Joue aussi avec le taux de réflexion ».
 * Le rôle de la 3.8 dans la production (`functions/src/ai.ts`) : la 3ᵉ lecture, qui tranche quand les deux Flash-Lite divergent ou qu'une manque.
 * Ici, `--fort <modèle>@<niveau>` remplace le modèle et le niveau de réflexion de TOUT appel qui part en `STRONG_MODEL` (3ᵉ lecture, et les 2
 * lectures de A) ; les lectures Flash-Lite ne bougent pas. La production (`functions/`) n'en reçoit rien : ni modèle, ni tarif.
 *
 * Source des identifiants, des tarifs et des niveaux : https://ai.google.dev/gemini-api/docs/models, /pricing et /thinking, lus le 14.11.2026.
 *   - `gemini-4-hydrogen` : 1,50 $ / 7,50 $ le million de jetons (entrée / sortie, réflexion comprise) ; niveaux low, medium, high (défaut), xhigh.
 *   - `gemini-4-argon` et `gemini-4-carbon` : 2,00 $ / 10,00 $ jusqu'au 30.11.2026, puis 4,00 $ / 20,00 $ à partir du 1.12.2026 ;
 *     niveaux low, medium (défaut), high. Pas de niveau « minimal » sur les modèles 4 ni sur la 3.8.
 *   - `gemini-3.8-flash` (témoin) : 1,50 $ / 7,50 $ ; niveaux low, medium (défaut), high.
 * Le tarif du banc est celui d'AUJOURD'HUI ; `TARIF_DECEMBRE` donne celui du 1.12 pour chiffrer la suite.
 */
import { observedGeminiCostDetails, quoteGeminiCost, type GeminiCostQuote } from '../functions/src/geminiCosts';
import { GEMINI_MODELS } from '../functions/src/models';

/** Un niveau de réflexion dans la forme de l'API generateContent (`thinkingConfig.thinkingLevel`) : la même casse que le banc (LOW, MEDIUM, HIGH). */
export type Reflexion = 'LOW' | 'MEDIUM' | 'HIGH' | 'XHIGH';

export interface TarifModele { entree: number; sortie: number; niveaux: readonly Reflexion[]; defaut: Reflexion }
/** Micro-dollars par million de jetons, comme `PRICES` de `geminiCosts.ts` (1 500 000 = 1,50 $). Seuls les modèles 4 sont chiffrés ici ; la 3.8 passe par la production. */
export const TARIFS_GEMINI4: Readonly<Record<string, TarifModele>> = {
  'gemini-4-hydrogen': { entree: 1_500_000, sortie: 7_500_000, niveaux: ['LOW', 'MEDIUM', 'HIGH', 'XHIGH'], defaut: 'HIGH' },
  'gemini-4-argon': { entree: 2_000_000, sortie: 10_000_000, niveaux: ['LOW', 'MEDIUM', 'HIGH'], defaut: 'MEDIUM' },
  'gemini-4-carbon': { entree: 2_000_000, sortie: 10_000_000, niveaux: ['LOW', 'MEDIUM', 'HIGH'], defaut: 'MEDIUM' }
};
/** Le tarif au 1.12.2026 pour Argon et Carbon (Hydrogen ne change pas) : sert à rechiffrer, jamais au budget d'aujourd'hui. */
export const TARIF_DECEMBRE: Readonly<Record<string, { entree: number; sortie: number }>> = {
  'gemini-4-hydrogen': { entree: 1_500_000, sortie: 7_500_000 },
  'gemini-4-argon': { entree: 4_000_000, sortie: 20_000_000 },
  'gemini-4-carbon': { entree: 4_000_000, sortie: 20_000_000 }
};
export const MODELES_GEMINI4: readonly string[] = Object.keys(TARIFS_GEMINI4);
/** Le modèle de la production qui sert de témoin et de gabarit de devis (même tarif, même plafond de sortie). */
const MODELE_GABARIT = 'gemini-3.8-flash';
const NIVEAUX_38: readonly Reflexion[] = ['LOW', 'MEDIUM', 'HIGH'];

export const estGemini4 = (model: string): boolean => Object.prototype.hasOwnProperty.call(TARIFS_GEMINI4, model);
/** Les modèles que le banc peut appeler : ceux de la production et les trois Gemini 4 (jamais un autre). */
export function assertModeleBanc(model: unknown): asserts model is string {
  if (typeof model === 'string' && (estGemini4(model) || (GEMINI_MODELS as readonly string[]).includes(model))) return;
  throw new Error(`Modèle Gemini refusé : seuls ${[...GEMINI_MODELS, ...MODELES_GEMINI4].join(', ')} sont autorisés au banc. Aucune requête n’est envoyée.`);
}

export interface Fort { model: string; thinking: Reflexion }
/** `gemini-4-argon@medium` → { model, thinking: 'MEDIUM' }. Un niveau que le modèle n'accepte pas est refusé net (jamais deviné). */
export function parseFort(texte: string): Fort {
  const [model, niveau = ''] = texte.split('@');
  const modele = model.trim(), thinking = niveau.trim().toUpperCase() as Reflexion;
  if (!estGemini4(modele) && modele !== MODELE_GABARIT) throw new Error(`--fort attend un modèle parmi ${[MODELE_GABARIT, ...MODELES_GEMINI4].join(', ')} (reçu : ${modele || 'rien'}).`);
  const permis = estGemini4(modele) ? TARIFS_GEMINI4[modele].niveaux : NIVEAUX_38;
  if (!permis.includes(thinking)) throw new Error(`--fort ${modele}@… : niveaux acceptés ${permis.map(item => item.toLowerCase()).join(', ')} (reçu : ${niveau || 'rien'}). « minimal » n’existe ni sur la 3.8 ni sur les modèles 4.`);
  return { model: modele, thinking };
}
export const etiquetteFort = (fort: Fort): string => `${fort.model}@${fort.thinking.toLowerCase()}`;

/**
 * Plafond de sortie d'une lecture « fort » : la réflexion compte dans `maxOutputTokens` (notice Google, /thinking : un niveau haut peut épuiser le plafond
 * sur une extraction JSON). 12 000 est le maximum que le garde-fou de coût de la production accepte ; la 3.8 du banc de référence reste à 8 192.
 */
export const FORT_MAX_OUT = 12_000;
/** Délai d'un appel « fort » : 90 s, le délai des lectures avec réflexion du banc (la production, elle, coupe à son échéance). */
export const FORT_TIMEOUT_MS = 90_000;

// État du banc pour la passe en cours : posé par `runBench`, remis à zéro à sa fin.
let fortActif: Fort | null = null;
export const poserFort = (fort: Fort | null) => { fortActif = fort; };
export const fortCourant = (): Fort | null => fortActif;

const micro = (entree: number, sortie: number, jetonsEntree: number, jetonsSortie: number) => Math.ceil((jetonsEntree * entree + jetonsSortie * sortie) * 5 / 4_000_000);

/** Le devis d'un appel : la production chiffre un modèle 4 inconnu d'elle sur le gabarit 3.8 (même corps, mêmes contrôles), le modèle est remis ensuite. */
export function devisBanc(model: string, body: Record<string, unknown>): GeminiCostQuote {
  return estGemini4(model) ? { ...quoteGeminiCost(MODELE_GABARIT, body), model } : quoteGeminiCost(model, body);
}
/** Le coût relu d'une réponse, au tarif du modèle qui l'a servie ; null si la réponse ne dit pas ses jetons (jamais zéro). */
export function coutObserveBanc(quote: GeminiCostQuote, response: any): { chargedMicroChf: number } | null {
  if (!estGemini4(quote.model)) return observedGeminiCostDetails(quote, response);
  const usage = response?.usageMetadata;
  const ok = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
  if (!usage || !ok(usage.promptTokenCount) || !ok(usage.candidatesTokenCount) || !ok(usage.thoughtsTokenCount ?? 0) || !ok(usage.totalTokenCount)) return null;
  const sortie = Math.max(usage.candidatesTokenCount + (usage.thoughtsTokenCount ?? 0), usage.totalTokenCount - usage.promptTokenCount);
  const tarif = TARIFS_GEMINI4[quote.model];
  return { chargedMicroChf: micro(tarif.entree, tarif.sortie, usage.promptTokenCount, sortie) };
}
/** Le coût au pire d'un appel d'un modèle 4 (sortie au plafond) : la réserve du budget. */
export function reserveGemini4(model: string, maxOut: number, jetonsEntree: number): number {
  const tarif = TARIFS_GEMINI4[model];
  return micro(tarif.entree, tarif.sortie, jetonsEntree, maxOut);
}
/** Le même coût relu au tarif du 1.12.2026 (Argon et Carbon doublent) : pour dire ce que la suite coûterait. */
export function coutDecembre(model: string, jetonsEntree: number, jetonsSortie: number): number {
  const tarif = TARIF_DECEMBRE[model];
  return tarif ? micro(tarif.entree, tarif.sortie, jetonsEntree, jetonsSortie) : micro(1_500_000, 7_500_000, jetonsEntree, jetonsSortie);
}
