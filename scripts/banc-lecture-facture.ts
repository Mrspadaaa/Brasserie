/**
 * Banc de lecture des factures (voie k1-banc, mission 2026-11-01-banc-lecture ; décisions D233, D234).
 *
 * La question du brasseur (01.11) : « deux lectures en parallèle de 3.5 flash et, si ça diverge, une relecture par 3.8 ? ».
 * Quatre façons de lire, mesurées sur ses 7 vraies factures (H13-reels/, hors Git) :
 *   A  production : 2 lectures 3.8 en parallèle (consignes 1 et 2), 3ᵉ lecture 3.8 (consigne 3) si elles divergent, vote ;
 *   B  une lecture d'abord (H13) : la lecture 1 seule ; un contrôle arithmétique en échec appelle la lecture 2, une divergence la 3 ;
 *      CALCULÉ HORS LIGNE à partir des appels de A (mêmes appels, mêmes consignes), durée = somme séquentielle ;
 *   C  sa proposition : 2 lectures Flash-Lite en parallèle (consignes 1 et 2), puis une lecture 3.8 (consigne 3) si elles divergent ;
 *      la 3ᵉ lecture de A est réutilisée quand elle existe ; sinon un appel 3.8 neuf ;
 *   C′ comme C, et un contrôle arithmétique en échec appelle aussi la 3.8 (hors ligne ; un appel 3.8 neuf n'est fait que
 *      si ni A ni C n'ont de 3ᵉ lecture à lui prêter).
 *
 * Rien ici ne copie une consigne ni un tarif : les consignes viennent de `functions/src/invoiceScanPrompts.ts`, la consigne système
 * et le schéma de `TASKS.scanInvoice`, le rapprochement de `invoiceVisionReview.ts`, les coûts de `geminiCosts.ts`.
 *
 * Voie k2-reglages (01.11) : « 3.5 Flash-Lite, il y a pas moyen de le faire mieux fonctionner ? ». Cinq variantes de plus :
 *   C★   comme C, mais quand la 3.8 est appelée, son résultat TRANCHE SEUL (plus de vote à trois) ;
 *   C★′  comme C′ (la 3.8 aussi quand l'arithmétique échoue), puis elle tranche seule ;
 *   Lm   C★′ avec les deux lectures Flash-Lite en réflexion `medium`, plafond de sortie relevé à 8 192 ;
 *   Lh   comme Lm en `high` ;
 *   Lp   C★′, Flash-Lite `low`, avec la consigne propre à Flash-Lite (`banc-lecture-consignes-lite.ts`, jamais envoyée à A).
 * Et N : une normalisation de code (devise « Fr. », « SFr. », « CHF. » → « CHF ») appliquée à chaque lecture, pour toutes les
 * variantes (suffixe « +N »), sans appel de plus. `--reprendre <sortie k1>` prête les appels déjà payés (même document, même
 * tirage, même réglage) : ni payés une deuxième fois, ni journalisés.
 *
 * Trois modes. `--simuler` (défaut) : aucun réseau, aucune clé lue, réponses fabriquées depuis la vérité et quelques fautes
 * fabriquées pour éprouver le jugement. `--hors-ligne --reprendre <dossier>` : aucun réseau, aucune clé, les variantes se
 * recalculent depuis des appels déjà payés (une lecture absente est une erreur, jamais un appel). `--payant --budget-chf 3.5
 * --confirm-paid-ai` : vrais appels Gemini, clé lue par `readLocalKey` (jamais affichée), coût réservé avant chaque appel (sortie
 * au plafond de CET appel), arrêt net au budget, une ligne de journal par appel, juste après lui. Les sorties (réponses brutes,
 * résultats) portent des données personnelles : H13-reels/banc-k*-*, jamais ailleurs, jamais dans Git. Le journal et le tableau
 * publiable ne contiennent aucune valeur des documents.
 *
 * Voie k4-harness (01.11) : « le système qui permet d'améliorer et compare » — chaque geste du rapport est un réglage du banc.
 *   Lm, Lh, Lp  ramenées sur C★v (la 3.8 tranche les valeurs, le statut du vote est gardé ; l'arithmétique n'appelle plus la 3.8) ;
 *   Hv  C★v dont les deux lectures Flash-Lite placent la consigne APRÈS les images et n'envoient plus `temperature` ;
 *   Sv  Hv avec le schéma de sortie du banc (`banc-lecture-schema.ts`) et son convertisseur vers le format de production ;
 *   Uv  Sv avec chaque image des lectures Flash-Lite en résolution ULTRA_HIGH (réglage par part ; un PDF reste inchangé) ;
 *   Av  C★v dont la 3ᵉ lecture est la 3.8 avec l'outil d'exécution de code (« Agentic Vision »), non partagée ;
 *   Tv  Hv sur l'image entière plus deux tuiles qui se recouvrent (cas à une seule image), découpées par Chrome.
 * Plusieurs fichiers par cas (`files`), PDF, une seule 3.8 par (document, tirage), réserve de budget selon la taille réelle, `--estimer`.
 * La production (`functions/`) n'en reçoit rien : la bascule est le choix du brasseur, après le banc.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --variantes Cs,Csp,Lm,Lh,Lp --out <dossier>
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --hors-ligne --reprendre <sortie k1> --variantes A,B,C,Cp,Cs,Csp --normaliser
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 3.5 --reprendre <sortie k1> --variantes Lm,Lh,Lp --normaliser --confirm-paid-ai
 */
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TASKS } from '../functions/src/prompts';
import { SCAN_MAX_ITEMS, SCAN_MAX_OUTPUT, SCAN_MODEL, countPdfPages, normalizeInvoiceScan, validateInvoiceFile, type InvoiceFile } from '../functions/src/invoiceScanCore';
import { SV_SCHEMA, productionToSv, schemaProblems, svSystem, svToProduction } from './banc-lecture-schema';
import { GEMINI_LITE_MODEL, assertGeminiModel } from '../functions/src/models';
import { INVOICE_SCAN_PROMPTS } from '../functions/src/invoiceScanPrompts';
import {
  ScanReadCutError, ajouterCoupure, finirUneLecture, phraseCoupure, pointLectureCoupee, reconcileInvoiceVision,
  type CauseCoupure, type InvoiceScanResult
} from '../functions/src/invoiceVisionReview';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';
import { liteConsigne } from './banc-lecture-consignes-lite';
// @ts-ignore — module JavaScript sans déclarations
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans déclarations
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------------------------------------------------
export const STRONG_MODEL: string = SCAN_MODEL;
export const LITE_MODEL: string = GEMINI_LITE_MODEL;
/** Accord du brasseur (D234) : 5 CHF ; le banc en garde 0,5 de marge (coût réel relu après coup, tarif provisionné à 1,25 CHF/USD). */
export const BUDGET_CAP_CHF = 4.5;
/** Entrée au pire pour la réserve : ~2 000 jetons observés (image HAUTE résolution + consignes) au banc d'octobre, ×3 de marge. */
export const RESERVE_INPUT_TOKENS = 6000;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MISSION_DIR = path.join(ROOT, 'work/missions/2026-11-01-banc-lecture');
export const MISSION_JOURNAL = path.join(MISSION_DIR, 'journal-gemini.md');
export const REELS_DIR = path.join(ROOT, 'work/finalisation-tickets-2026-10-08/H13-reels');
/** Les cas lus par défaut : les trois de k1 et `cas-4.json` (écrit par le pilote) s'il existe ; son absence n'est jamais une erreur. */
export const CAS_FILES = ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json'].map(name => path.join(REELS_DIR, name)).filter((file, index) => index < 3 || existsSync(file));

/**
 * Réserve d'entrée selon la taille réelle du ou des fichiers (jetons) : une base (système + consigne + schéma), puis par image 2 × le coût
 * nominal de sa résolution (HAUTE 1 120, ULTRA_HAUTE 2 240) et par page de PDF 2 × 1 120. Jamais moins que le forfait de k1.
 */
export const RESERVE_BASE_TOKENS = 2000;
export const IMAGE_TOKENS = { HIGH: 1120, ULTRA_HIGH: 2240 } as const;
export const PDF_PAGE_TOKENS = 1120;
export const RESERVE_MARGIN = 2;
/** Un appel avec l'outil d'exécution de code relit l'image à chaque tour : entrée réservée × 3. */
export const CODE_EXEC_INPUT_FACTOR = 3;
/** Points d'origine `controle` qui pèsent et qui disent « l'arithmétique de cette lecture ne tient pas » (B et C′). Jamais la date absente. */
export const ARITH_CODES: ReadonlySet<string> = new Set(['ligne-montant', 'somme-ecart', 'tva-incoherente', 'ht-tva-ttc', 'total-absent']);

export type VariantId = 'A' | 'B' | 'C' | 'Cp' | 'Cs' | 'Csv' | 'Csp' | 'Lm' | 'Lh' | 'Lp' | 'Hv' | 'Sv' | 'Uv' | 'Av' | 'Tv';
/** Toutes les variantes connues, dans l'ordre des tableaux. */
export const VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp', 'Cs', 'Csv', 'Csp', 'Lm', 'Lh', 'Lp', 'Hv', 'Sv', 'Uv', 'Av', 'Tv'];
/** Les quatre de k1 : ce que le banc lit quand `--variantes` n'est pas donné. */
export const K1_VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp'];
export const VARIANT_LABEL: Record<VariantId, string> = {
  A: 'A production', B: 'B une lecture d’abord', C: 'C Flash-Lite ×2 puis 3.8', Cp: 'C′ C gardée par les contrôles',
  Cs: 'C★ la 3.8 tranche seule', Csv: 'C★v valeurs de la 3.8, statut du vote', Csp: 'C★′ C★ gardée par les contrôles', Lm: 'Lm C★v réflexion medium', Lh: 'Lh C★v réflexion high', Lp: 'Lp C★v consigne Flash-Lite',
  Hv: 'Hv C★v consigne après les images, sans température', Sv: 'Sv Hv + schéma du banc', Uv: 'Uv Sv + images ULTRA_HIGH', Av: 'Av C★v + 3.8 avec exécution de code', Tv: 'Tv Hv + tuiles'
};
/** Suffixe d'une variante lue avec la normalisation de code (N) : `Cs+N`. */
export const N_SUFFIX = '+N';
export const isNId = (id: string) => id.endsWith(N_SUFFIX);
export const baseOfId = (id: string): VariantId => (isNId(id) ? id.slice(0, -N_SUFFIX.length) : id) as VariantId;
export const variantLabel = (id: string) => `${VARIANT_LABEL[baseOfId(id)] ?? id}${isNId(id) ? ' + N' : ''}`;
/** Ordre d'affichage : l'ordre de VARIANTS, chaque variante suivie de sa version N. */
export function orderVariants(ids: Iterable<string>): string[] {
  const rank = (id: string) => VARIANTS.indexOf(baseOfId(id)) * 2 + (isNId(id) ? 1 : 0);
  return [...ids].sort((a, b) => rank(a) - rank(b));
}

/** Un groupe = une façon d'appeler : les variantes d'un même groupe partagent leurs lectures. */
export type Group = 'A' | 'C' | 'Lm' | 'Lh' | 'Lp' | 'Hv' | 'Sv' | 'Uv' | 'Tv';
/** Av n'a pas de lectures 1 et 2 à lui : ce sont celles de C ; seule sa 3ᵉ lecture (3.8 avec exécution de code) lui est propre. */
export const GROUP_OF: Record<VariantId, Group> = { A: 'A', B: 'A', C: 'C', Cp: 'C', Cs: 'C', Csv: 'C', Csp: 'C', Lm: 'Lm', Lh: 'Lh', Lp: 'Lp', Hv: 'Hv', Sv: 'Sv', Uv: 'Uv', Av: 'C', Tv: 'Tv' };
/** Les groupes qui lisent à leur compte deux lectures Flash-Lite puis concluent comme C★v. */
export const LITE_GROUPS = ['Lm', 'Lh', 'Lp', 'Hv', 'Sv', 'Uv', 'Tv'] as const;
export type LiteGroup = typeof LITE_GROUPS[number];
/** Plafond de sortie relevé de Lm et Lh seuls : la réflexion compte dans `maxOutputTokens`, `high` peut couper à 5 100. */
export const LITE_RAISED_OUTPUT = 8192;
const TIMEOUT_MS = 45_000, TIMEOUT_THINKING_MS = 90_000;
export type ThinkingLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export interface CallSpec {
  model: string; prompt: string; thinking: ThinkingLevel; maxOut: number; timeoutMs: number;
  /** Hv et suivantes : la consigne vient après les images. */
  promptAfter?: boolean;
  /** Hv et suivantes : aucun `temperature` n'est envoyé. */
  noTemperature?: boolean;
  /** Sv, Uv : le schéma de sortie du banc, et la conversion de la réponse vers le format de production. */
  svSchema?: boolean;
  /** Uv : chaque image part en ULTRA_HIGH. */
  ultraHigh?: boolean;
  /** Av : l'outil d'exécution de code. */
  codeExecution?: boolean;
  /** Tv : l'image entière et deux tuiles. */
  tiles?: boolean;
}
/** La phrase du banc ajoutée à la consigne 3 d'Av : zoomer avant de lire les montants. */
export const AV_NOTE = 'Tu disposes d’un outil d’exécution de code. Avant de lire les montants, zoome sur le tableau des lignes (recadre et agrandis l’image) pour lire chaque cellule ; puis réponds par le seul JSON demandé.';
/** Le réglage d'un appel. La 3ᵉ lecture est la 3.8 de production (consigne 3), quel que soit le groupe qui la demande — sauf celle d'Av. */
export function callSpec(group: string, lecture: 1 | 2 | 3): CallSpec {
  if (lecture === 3 && group === 'Av') return { model: STRONG_MODEL, prompt: `${INVOICE_SCAN_PROMPTS[2]}\n\n${AV_NOTE}`, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS, codeExecution: true };
  if (lecture === 3) return { model: STRONG_MODEL, prompt: INVOICE_SCAN_PROMPTS[2], thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
  const prompt = INVOICE_SCAN_PROMPTS[lecture - 1];
  switch (group) {
    case 'Hv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true };
    case 'Sv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true, svSchema: true };
    case 'Uv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true, svSchema: true, ultraHigh: true };
    case 'Tv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true, tiles: true };
    case 'A': return { model: STRONG_MODEL, prompt, thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
    case 'C': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
    case 'Lm': return { model: LITE_MODEL, prompt, thinking: 'MEDIUM', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS };
    case 'Lh': return { model: LITE_MODEL, prompt, thinking: 'HIGH', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS };
    case 'Lp': return { model: LITE_MODEL, prompt: liteConsigne(lecture), thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
    default: throw new Error(`Groupe inconnu : ${group}`);
  }
}

/** `files` : les fichiers d'un document en plusieurs captures, dans l'ordre (`file` est le premier). `expected.lignesInvisibles` : lignes visibles sur aucune capture. */
export interface BenchCase { id: string; file: string; files?: string[]; mimeType: string; expected: Record<string, any>; genre?: string }
export type Genre = 'photo' | 'capture' | 'plusieurs captures' | 'PDF';
export const GENRES: readonly Genre[] = ['photo', 'capture', 'plusieurs captures', 'PDF'];
/** Le genre de pièce d'un cas : `genre` s'il est écrit, sinon le PDF, le nombre de fichiers, puis le nom du fichier (« ecran » = capture, le reste = photo). */
export function genreOfCase(c: BenchCase): Genre {
  if (c.genre && (GENRES as readonly string[]).includes(c.genre)) return c.genre as Genre;
  const list = caseFiles(c);
  if (list.length > 1) return 'plusieurs captures';
  if (c.mimeType === 'application/pdf' || /\.pdf$/i.test(list[0] ?? '')) return 'PDF';
  return /ecran|screen|capture/i.test(path.basename(list[0] ?? '')) ? 'capture' : 'photo';
}
/** Les chemins des fichiers d'un cas, dans l'ordre. */
export const caseFiles = (c: BenchCase): string[] => (c.files?.length ? c.files : [c.file]);
const MIME_BY_EXT: Record<string, string> = { '.pdf': 'application/pdf', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
export const mimeOfPath = (file: string, fallback: string) => MIME_BY_EXT[path.extname(file).toLowerCase()] ?? fallback;
export interface BenchOptions {
  mode: 'simuler' | 'payant' | 'hors-ligne'; repeat: number; out?: string; budgetChf?: number; docs?: string[]; faults: boolean;
  /** Fichiers de cas (noms dans H13-reels ou chemins) au lieu de CAS_FILES. */
  cas?: string[];
  /** Av : demande le JSON dans le texte (pas de schéma imposé avec l'outil) et le valide par le schéma de production. */
  avSansSchema?: boolean;
  /** Variantes à lire (défaut : A, B, C, C′ comme k1). */
  variantes?: VariantId[];
  /** Dossier d'une sortie précédente dont les appels sont prêtés. */
  reprendre?: string;
  /** Ajoute, à chaque variante, sa version lue avec la normalisation de code (N). */
  normaliser?: boolean;
}
export class BudgetStop extends Error { constructor(message: string) { super(message); this.name = 'BudgetStop'; } }

export function loadCases(files: string[] = CAS_FILES): BenchCase[] {
  return files.flatMap(file => {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    return (Array.isArray(parsed) ? parsed : parsed.cases) as BenchCase[];
  });
}

/** Un nom de fichier de cas : un chemin absolu tel quel, sinon un nom dans H13-reels. */
export const casPath = (name: string) => (path.isAbsolute(name) ? name : path.join(REELS_DIR, name));

export interface EstimateOptions { estimer: boolean }
export function parseArgs(argv: string[]): BenchOptions & EstimateOptions {
  const args = argv.filter(arg => arg !== '--');
  const value = (flag: string) => { const at = args.indexOf(flag); return at >= 0 ? args[at + 1] : undefined; };
  const estimer = args.includes('--estimer');
  const payant = args.includes('--payant'), simuler = args.includes('--simuler'), horsLigne = args.includes('--hors-ligne');
  if ([payant, simuler, horsLigne].filter(Boolean).length > 1) throw new Error('--payant, --simuler et --hors-ligne s’excluent.');
  const reprendre = value('--reprendre');
  if (horsLigne && !reprendre) throw new Error('--hors-ligne exige --reprendre <dossier d’une sortie du banc> : sans appel, il ne peut que recalculer.');
  const variantes = value('--variantes')?.split(',').map(item => item.trim()).filter(Boolean) as VariantId[] | undefined;
  const unknown = (variantes ?? []).filter(id => !VARIANTS.includes(id));
  if (unknown.length || (variantes && !variantes.length)) throw new Error(`--variantes attend une liste parmi ${VARIANTS.join(', ')} (reçu : ${unknown.join(', ') || 'rien'}).`);
  const repeat = value('--repeat') === undefined ? 3 : Number(value('--repeat'));
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) throw new Error('--repeat attend un entier de 1 à 10.');
  let budgetChf: number | undefined;
  if (payant) {
    budgetChf = Number(value('--budget-chf'));
    if (!(budgetChf > 0 && budgetChf <= BUDGET_CAP_CHF)) throw new Error(`Le mode --payant exige --budget-chf <= ${BUDGET_CAP_CHF} (accord D234 : 5 CHF, marge comprise). Aucun appel.`);
  }
  const cas = value('--cas')?.split(',').map(item => item.trim()).filter(Boolean);
  return { mode: payant ? 'payant' : horsLigne ? 'hors-ligne' : 'simuler', repeat, out: value('--out'), budgetChf, docs: value('--docs')?.split(',').map(item => item.trim()).filter(Boolean),
    faults: !args.includes('--sans-fautes'), estimer, ...(cas?.length ? { cas } : {}), ...(args.includes('--av-sans-schema') ? { avSansSchema: true } : {}), ...(variantes ? { variantes: [...new Set(variantes)] } : {}), ...(reprendre ? { reprendre } : {}), ...(args.includes('--normaliser') ? { normaliser: true } : {}) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Corps de requête et lecture d'une réponse : la même chose que scanInvoiceSafely (functions/src/ai.ts)
// ---------------------------------------------------------------------------------------------------------------------
/** Le corps de `scanInvoiceSafely` (même clés, même ordre) pour une consigne de lecture. Le test le compare à celui de la production. */
export interface ReadBodyOptions {
  /** La consigne après les images (défaut : avant, comme la production). */
  promptAfter?: boolean;
  /** Faux : aucun `temperature` n'est envoyé (défaut : 0, comme la production). */
  temperature?: boolean;
  /** Le schéma de sortie du banc (Sv, Uv) au lieu de celui de la production. */
  svSchema?: boolean;
  /** Uv : chaque image (pas un PDF) porte sa résolution ULTRA_HIGH, par part. */
  ultraHigh?: boolean;
  /** Av : l'outil d'exécution de code. */
  codeExecution?: boolean;
  /** Av avec --av-sans-schema : ni `responseMimeType` ni schéma ; le JSON se demande dans le texte. */
  freeJson?: boolean;
  /** Tv : la phrase des tuiles (les images 2 et suivantes sont des agrandissements de la première). */
  tilesNote?: boolean;
}
/** La phrase du banc ajoutée à la consigne d'un cas à plusieurs fichiers (jamais à un cas à un fichier). Générique : aucune valeur. */
export const multiCaptureNote = (count: number) =>
  `Les ${count} images jointes sont des captures successives d’un même document, dans l’ordre de lecture ; elles peuvent se recouvrir. Chaque ligne imprimée ne se lit qu’une seule fois : si une ligne apparaît sur deux captures, ne la transcris qu’une fois.`;
/** Tv : les deux tuiles sont des agrandissements de la page entière (la première image), qui se recouvrent. */
export const TILES_NOTE = 'La première image est la page entière ; les deux images suivantes sont des agrandissements de la même page (sa partie haute, puis sa partie basse, qui se recouvrent). Ce sont les mêmes lignes imprimées : chaque ligne ne se lit qu’une seule fois.';
/** Le JSON demandé dans le texte quand l'outil d'exécution de code et le schéma ne vont pas ensemble. */
export const FREE_JSON_NOTE = `Réponds par un seul objet JSON, sans texte autour, conforme à ce schéma :\n${JSON.stringify(TASKS.scanInvoice.schema)}`;

/**
 * Le corps de `scanInvoiceSafely` (même clés, même ordre) pour une consigne de lecture, avec UNE part `inlineData` par fichier, dans l'ordre.
 * Un seul fichier et aucune option : exactement la production (le test le compare). Plusieurs fichiers : la phrase du banc s'ajoute à la consigne.
 */
export function buildReadBody(files: InvoiceFile | InvoiceFile[], prompt: string, maxOutputTokens: number = SCAN_MAX_OUTPUT, thinkingLevel: ThinkingLevel = 'LOW', options: ReadBodyOptions = {}): Record<string, unknown> {
  const list = Array.isArray(files) ? files : [files];
  const notes = [list.length > 1 && !options.tilesNote ? multiCaptureNote(list.length) : '', options.tilesNote ? TILES_NOTE : '', options.freeJson ? FREE_JSON_NOTE : ''].filter(Boolean);
  const text = notes.length ? `${prompt}\n\n${notes.join('\n\n')}` : prompt;
  const media = list.map(file => (options.ultraHigh && file.mimeType !== 'application/pdf' ? { inlineData: file, mediaResolution: { level: 'MEDIA_RESOLUTION_ULTRA_HIGH' } } : { inlineData: file }));
  const parts = options.promptAfter ? [...media, { text }] : [{ text }, ...media];
  const schema = options.svSchema ? SV_SCHEMA : TASKS.scanInvoice.schema;
  return {
    systemInstruction: { parts: [{ text: options.svSchema ? svSystem(TASKS.scanInvoice.system) : TASKS.scanInvoice.system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { ...(options.freeJson ? {} : { responseMimeType: 'application/json', responseSchema: schema }), ...(options.temperature === false ? {} : { temperature: 0 }), maxOutputTokens,
      mediaResolution: 'MEDIA_RESOLUTION_HIGH', thinkingConfig: { thinkingLevel } },
    ...(options.codeExecution ? { tools: [{ codeExecution: {} }] } : {})
  };
}

/**
 * N : la devise comme code ISO. « Fr. », « SFr. », « CHF. » (point, espaces, casse ignorés) deviennent « CHF » ; tout autre texte
 * reste tel quel (une devise étrangère n'est jamais devinée). Dans le banc seulement : la production n'en reçoit rien.
 */
export function isoCurrency(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.replace(/[\s.]/g, '').toUpperCase();
  return key === 'FR' || key === 'SFR' || key === 'CHF' ? 'CHF' : value;
}

/** Même lecture qu'en production : coupée (finishReason ≠ STOP) → ScanReadCutError ; vide ou hors forme → erreur. `codes` : N. */
export interface ParseOptions {
  /** N : la devise en code ISO. */
  codes?: boolean;
  /** Sv, Uv : la réponse suit le schéma du banc ; elle est convertie au format de production. */
  sv?: boolean;
  /** Av : l'outil d'exécution de code mêle texte, code et résultats ; seule la DERNIÈRE part texte est lue. */
  lastTextPart?: boolean;
  /** Av sans schéma imposé : le JSON lu dans le texte est validé par le schéma de production. */
  validate?: boolean;
}
/** Le texte JSON d'une part texte : sans balise de code. */
const unfence = (text: string) => text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
export function parseReadResponse(response: any, opts: boolean | ParseOptions = false): any {
  const options: ParseOptions = typeof opts === 'boolean' ? { codes: opts } : opts;
  const candidate = response?.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new ScanReadCutError(candidate?.finishReason ?? null);
  const texts: string[] = (candidate.content?.parts ?? []).filter((part: any) => part.thought !== true && typeof part.text === 'string').map((part: any) => part.text);
  const raw = options.lastTextPart ? unfence(texts[texts.length - 1] ?? '') : texts.join('');
  if (!raw || raw.length > 45000) throw new Error('Lecture non exploitable.');
  let decoded = JSON.parse(raw);
  if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || !Array.isArray(decoded.items)) throw new Error('Lecture non exploitable.');
  if (options.validate && schemaProblems(decoded, options.sv ? SV_SCHEMA : TASKS.scanInvoice.schema).length) throw new Error('Lecture non exploitable.');
  if (options.sv) decoded = svToProduction(decoded);
  if (options.codes) decoded.currency = isoCurrency(decoded.currency);
  return decoded;
}

export const causeOf = (reason: any): CauseCoupure | null =>
  reason instanceof ScanReadCutError ? 'sortie' : reason?.name === 'AbortError' || reason?.name === 'TimeoutError' ? 'delai' : null;

export interface ReadMeta { id: string; doc: string; tirage: number; variant: string; lecture: 1 | 2 | 3; model: string; freeJson?: boolean }
/** Les lectures qui suivent le schéma du banc (Sv, Uv ; jamais leur 3ᵉ lecture, qui est celle de la production). */
export const usesSvSchema = (meta: ReadMeta) => (meta.variant === 'Sv' || meta.variant === 'Uv') && meta.lecture !== 3;
/** La façon de lire la réponse d'un appel, selon qui l'a faite. */
export const parseOptionsOf = (meta: ReadMeta, codes: boolean): ParseOptions =>
  ({ codes, sv: usesSvSchema(meta), lastTextPart: meta.variant === 'Av' && meta.lecture === 3, validate: !!meta.freeJson });
export interface Reading {
  meta: ReadMeta; ok: boolean; ms: number; normalized?: InvoiceScanResult; cause: CauseCoupure | null; error?: string;
  finishReason: string | null; inputTokens: number | null; outputTokens: number | null; costMicroChf: number | null; state: string;
  /** Lignes que la lecture a écrites au-delà du plafond de la production (35) : la normalisation les écarte. */
  overCap?: number;
  /** La réponse brute, gardée en mémoire pour relire la même lecture avec N ; jamais écrite dans results.json. */
  raw?: any;
  /** Appel prêté par une sortie précédente (`--reprendre`) : ni payé ni journalisé dans cette passe. */
  lent?: boolean;
}

const tokensOf = (response: any) => {
  const usage = response?.usageMetadata ?? {};
  const n = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
  const candidates = n(usage.candidatesTokenCount), thoughts = n(usage.thoughtsTokenCount);
  return { input: n(usage.promptTokenCount), output: candidates === null ? null : candidates + (thoughts ?? 0) };
};

export function readingFromResponse(meta: ReadMeta, response: any, ms: number, costMicroChf: number | null, codes = false): Reading {
  const finishReason: string | null = response?.candidates?.[0]?.finishReason ?? null, tokens = tokensOf(response);
  const base = { meta, ms, finishReason, inputTokens: tokens.input, outputTokens: tokens.output, costMicroChf, raw: response };
  try {
    const decoded = parseReadResponse(response, parseOptionsOf(meta, codes));
    return { ...base, ok: true, normalized: normalizeInvoiceScan(decoded), overCap: Math.max(0, decoded.items.length - SCAN_MAX_ITEMS), cause: null, state: 'STOP' };
  } catch (error: any) {
    return { ...base, ok: false, cause: causeOf(error), error: String(error?.message ?? error).slice(0, 120), state: finishReason && finishReason !== 'STOP' ? `coupée (${finishReason})` : 'illisible' };
  }
}
export function readingFromError(meta: ReadMeta, error: any, ms: number, costMicroChf: number | null): Reading {
  const status = typeof error?.httpStatus === 'number' ? `HTTP ${error.httpStatus}` : causeOf(error) === 'delai' ? 'délai' : 'erreur';
  return { meta, ok: false, ms, cause: causeOf(error), error: String(error?.message ?? error).slice(0, 120), finishReason: null,
    inputTokens: null, outputTokens: null, costMicroChf, state: status };
}

/** La même lecture relue avec N (devise en code ISO) : même réponse, même durée, même coût. Une lecture sans réponse reste telle quelle. */
export function withCodesNormalized(read: Reading): Reading {
  if (!read.raw) return read;
  return { ...readingFromResponse(read.meta, read.raw, read.ms, read.costMicroChf, true), ...(read.lent ? { lent: true } : {}) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Les parcours (purs : aucun réseau). Mêmes appels que la production pour A ; B, C et C′ s'en déduisent.
// ---------------------------------------------------------------------------------------------------------------------
export interface Final { result: any | null; failure?: string; used: Reading[]; ms: number; costMicroChf: number; costUnknown: number }

export const hasArithmeticFailure = (points: Array<{ code: string; origine?: string; pese?: boolean }> | undefined) =>
  (points ?? []).some(point => point.origine === 'controle' && point.pese === true && ARITH_CODES.has(point.code));

/** La 3ᵉ lecture est-elle appelée par la réconciliation de ces deux lectures ? (A, et C avant sa 3.8) */
export function needsThird(r1: Reading, r2: Reading): boolean {
  return !!(r1.normalized && r2.normalized) && reconcileInvoiceVision([r1.normalized, r2.normalized]).needsCorrection;
}
/** C′ : les deux lectures concordent mais l'arithmétique du résultat réconcilié ne tient pas. */
export function arithmeticFailsOnTwo(r1: Reading, r2: Reading): boolean {
  return !!(r1.normalized && r2.normalized) && hasArithmeticFailure(reconcileInvoiceVision([r1.normalized, r2.normalized]).result.points as any);
}

/** Une seule lecture exploitable sur deux : « unavailable », comme `scanInvoiceSafely`. */
function singleOfTwo(good: Reading, failed: Reading | undefined) {
  const why = failed?.cause ?? null;
  const finding = why ? phraseCoupure(why) : 'La double lecture n’a pas abouti. Vérifie les informations et les montants sur le justificatif.';
  const single = finirUneLecture(good.normalized!);
  return { ...single, review: { status: 'unavailable', readers: 1, correctedFields: [] as string[], findings: [finding] },
    ...(why ? { points: [...single.points, pointLectureCoupee(why, finding)] } : {}), issues: [...single.issues, finding] };
}

function finish(result: any, used: Reading[], parallel: boolean, failure?: string): Final {
  const known = used.filter(read => read.costMicroChf !== null);
  const ms = !used.length ? 0 : parallel ? Math.max(...used.filter(read => read.meta.lecture !== 3).map(read => read.ms), 0) + used.filter(read => read.meta.lecture === 3).reduce((sum, read) => sum + read.ms, 0)
    : used.reduce((sum, read) => sum + read.ms, 0);
  return { result, ...(failure ? { failure } : {}), used, ms, costMicroChf: known.reduce((sum, read) => sum + (read.costMicroChf ?? 0), 0), costUnknown: used.length - known.length };
}

/** Deux lectures en parallèle puis, si elles divergent, la 3ᵉ : le code de `scanInvoiceSafely` (ai.ts) sur des lectures déjà faites. */
export function finalOfTwo(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  const both = [r1, r2];
  const good = both.filter(read => read.normalized);
  if (!good.length) return finish(null, both, true, 'aucune lecture exploitable (production : erreur « Lecture indisponible »)');
  if (good.length === 1) return finish(singleOfTwo(good[0], both.find(read => !read.normalized)), both, true);
  let reconciled = reconcileInvoiceVision([r1.normalized!, r2.normalized!]);
  const used = [...both];
  if (reconciled.needsCorrection || (force && third)) {
    if (third) used.push(third);
    if (third?.normalized) reconciled = reconcileInvoiceVision([r1.normalized!, r2.normalized!, third.normalized]);
    else if (reconciled.needsCorrection) ajouterCoupure(reconciled.result as any, third?.cause ?? 'delai-saute', phraseCoupure('delai-saute'));
  }
  return finish({ ...reconciled.result, review: reconciled.review, issues: [...new Set([...reconciled.result.issues, ...reconciled.review.findings])] }, used, true);
}

/** Le résultat d'une lecture seule : « disputed » si un point pèse, « checked » sinon (B, et la 3.8 qui tranche seule). */
function singleResult(single: ReturnType<typeof finirUneLecture>, readers = 1): any {
  const weighing = single.points.filter(point => point.pese);
  return { ...single, review: { status: weighing.length ? 'disputed' : 'checked', readers, correctedFields: [] as string[], findings: [...new Set(weighing.map(point => point.message))].slice(0, 50) }, issues: single.issues };
}

/** B : la lecture 1 seule ; un contrôle arithmétique en échec appelle la lecture 2, une divergence la 3. Durée = somme séquentielle. */
export function finalOfB(a1: Reading, a2: Reading, a3?: Reading): Final {
  if (a1.normalized) {
    const single = finirUneLecture(a1.normalized);
    if (!hasArithmeticFailure(single.points as any)) return finish(singleResult(single), [a1], false);
  }
  const two = finalOfTwo(a1, a2, a3);
  return finish(two.result, two.used, false, two.failure);
}

/** C′ : comme C, et l'arithmétique en échec appelle aussi la 3.8 (vote à trois). */
export const finalOfCprime = (l1: Reading, l2: Reading, third?: Reading): Final =>
  finalOfTwo(l1, l2, third, arithmeticFailsOnTwo(l1, l2));

/** C et sa famille : la 3.8 est appelée sur divergence, et aussi quand une lecture Flash-Lite manque (coupée, refusée). */
export const needsThirdLite = (l1: Reading, l2: Reading): boolean => !l1.normalized || !l2.normalized || needsThird(l1, l2);
/**
 * C quand une lecture Flash-Lite manque et que la 3.8 a lu : jamais « Lecture indisponible ». Une Flash-Lite lisible et la 3.8
 * votent à deux ; aucune Flash-Lite lisible, la 3.8 seule, « unavailable » à un lecteur (comme une lecture seule de la production).
 * Le 01.11, les deux Flash-Lite de doc8 (37 lignes) étaient coupées à 5 100 jetons et C rendait une panne.
 */
export function finalOfLite(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  if ((r1.normalized && r2.normalized) || !third?.normalized) return finalOfTwo(r1, r2, third, force);
  const good = [r1, r2].find(read => read.normalized), failed = [r1, r2].find(read => !read.normalized);
  if (!good) return finish(singleOfTwo(third, failed), [r1, r2, third], true);
  return finish(finalOfTwo(good, third).result, [r1, r2, third], true);
}

/**
 * C★ : deux lectures Flash-Lite ; quand la 3.8 est appelée (divergence, ou `force` : l'arithmétique échoue), son résultat TRANCHE
 * SEUL, il n'y a plus de vote à trois. Son statut est celui d'une lecture seule (comme B) : « checked » si aucun point ne pèse,
 * « disputed » sinon. Sans 3.8 exploitable (appel refusé, coupé, ou non prêté), le repli est le parcours de C (coupure comptée).
 */
export function finalOfStar(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  if (r1.normalized && r2.normalized && third?.normalized && (force || needsThird(r1, r2)))
    return finish(singleResult(finirUneLecture(third.normalized), 3), [r1, r2, third], true);
  return finalOfLite(r1, r2, third, force);
}
/**
 * C★v : les VALEURS de la 3.8 quand elle tranche (comme C★), mais le STATUT du vote à trois (comme C) : dès que les lectures ont
 * divergé sur un champ qui pèse, le résultat reste « disputed » et garde les phrases du vote. Sans 3.8 appelée, c'est C.
 * C'est le parcours de C★ dont la revue (statut, constats) est celle du rapprochement des trois lectures ; les points du vote
 * qui sont des désaccords entre lectures s'ajoutent à ceux de la 3.8 seule.
 */
export function finalOfStarVote(r1: Reading, r2: Reading, third?: Reading, force = false): Final {
  const star = finalOfStar(r1, r2, third, force);
  if (star.used.length < 3 || !third?.normalized || !r1.normalized || !r2.normalized) return star;
  const vote = finalOfTwo(r1, r2, third, force);
  const disagreements = (vote.result.points ?? []).filter((point: any) => point.source === 'désaccord');
  return { ...star, result: { ...star.result, review: { ...vote.result.review }, issues: vote.result.issues, points: [...star.result.points, ...disagreements] } };
}

/** C★′ : comme C★, et un contrôle arithmétique en échec sur les deux lectures appelle aussi la 3.8, qui tranche seule. */
export const finalOfStarPrime = (r1: Reading, r2: Reading, third?: Reading): Final => finalOfStar(r1, r2, third, arithmeticFailsOnTwo(r1, r2));

// ---------------------------------------------------------------------------------------------------------------------
// Toutes les variantes d'un parcours, déduites des lectures (pur : la boucle du banc, le hors-ligne et N passent par ici)
// ---------------------------------------------------------------------------------------------------------------------
export type ThirdFrom = 'A' | 'neuf' | 'k1' | 'C';
export interface DrawReads {
  a1?: Reading; a2?: Reading; a3?: Reading;
  l1?: Reading; l2?: Reading; cThird?: Reading; cpThird?: Reading;
  /** Av : la 3.8 avec exécution de code, propre à Av (jamais partagée). */
  avThird?: Reading;
  lite: Partial<Record<LiteGroup, { r1: Reading; r2: Reading; third?: Reading }>>;
}
export interface Derived { final: Final; thirdFrom?: ThirdFrom }
const thirdFromOf = (third?: Reading): ThirdFrom | undefined => (!third ? undefined : third.meta.variant === 'A' ? 'A' : third.lent ? 'k1' : 'neuf');

export function mapReads(reads: DrawReads, f: (read: Reading) => Reading): DrawReads {
  const m = (read?: Reading) => (read ? f(read) : undefined);
  const lite: DrawReads['lite'] = {};
  for (const group of LITE_GROUPS) { const entry = reads.lite[group]; if (entry) lite[group] = { r1: f(entry.r1), r2: f(entry.r2), third: m(entry.third) }; }
  return { a1: m(reads.a1), a2: m(reads.a2), a3: m(reads.a3), l1: m(reads.l1), l2: m(reads.l2), cThird: m(reads.cThird), cpThird: m(reads.cpThird), avThird: m(reads.avThird), lite };
}

/** Seules les variantes demandées (`want`) et dont les lectures sont là sont rendues. */
export function deriveVariants(reads: DrawReads, want: ReadonlySet<string>): Partial<Record<VariantId, Derived>> {
  const out: Partial<Record<VariantId, Derived>> = {};
  const { a1, a2, a3, l1, l2, cThird, cpThird } = reads;
  if (a1 && a2) {
    if (want.has('A')) out.A = { final: finalOfTwo(a1, a2, a3) };
    if (want.has('B')) out.B = { final: finalOfB(a1, a2, a3) };
  }
  if (l1 && l2) {
    const tf = thirdFromOf;
    if (want.has('C')) out.C = { final: finalOfLite(l1, l2, cThird), ...(cThird ? { thirdFrom: tf(cThird) } : {}) };
    if (want.has('Cp')) out.Cp = { final: finalOfCprime(l1, l2, cpThird), ...(cpThird ? { thirdFrom: tf(cpThird) } : {}) };
    if (want.has('Cs')) out.Cs = { final: finalOfStar(l1, l2, cThird), ...(cThird ? { thirdFrom: tf(cThird) } : {}) };
    if (want.has('Csv')) out.Csv = { final: finalOfStarVote(l1, l2, cThird), ...(cThird ? { thirdFrom: tf(cThird) } : {}) };
    if (want.has('Csp')) out.Csp = { final: finalOfStarPrime(l1, l2, cpThird), ...(cpThird ? { thirdFrom: tf(cpThird) } : {}) };
    // Av : les deux lectures de C, puis (divergence) la 3.8 avec exécution de code, qui tranche les valeurs comme dans C★v
    if (want.has('Av')) out.Av = { final: finalOfStarVote(l1, l2, reads.avThird), ...(reads.avThird ? { thirdFrom: 'neuf' as ThirdFrom } : {}) };
  }
  // Lm, Lh, Lp, Hv, Sv, Uv, Tv = C★v : la divergence seule appelle la 3.8, qui tranche les valeurs ; le statut du vote est gardé
  for (const group of LITE_GROUPS) {
    const entry = reads.lite[group];
    if (entry && want.has(group)) out[group] = { final: finalOfStarVote(entry.r1, entry.r2, entry.third), ...(entry.third ? { thirdFrom: thirdFromOf(entry.third) } : {}) };
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Budget : réservé AVANT chaque appel, au pire (sortie au plafond) ; coût réel relu après.
// ---------------------------------------------------------------------------------------------------------------------
/** Coût au pire d'un appel de ce modèle : les tarifs viennent de geminiCosts.ts (aucune copie). */
export function reservationMicro(model: string, maxOut: number = SCAN_MAX_OUTPUT, inputTokens: number = RESERVE_INPUT_TOKENS): number {
  const input = Math.max(inputTokens, RESERVE_INPUT_TOKENS);
  const quote = quoteGeminiCost(model, { generationConfig: { maxOutputTokens: maxOut } });
  const worst = observedGeminiCostDetails(quote, { usageMetadata: { promptTokenCount: input, candidatesTokenCount: maxOut, thoughtsTokenCount: 0, totalTokenCount: input + maxOut } });
  if (!worst) throw new Error('Réserve indisponible : tarif inconnu.');
  return worst.chargedMicroChf;
}

/** Le nombre de pages d'un PDF, compté dans ses octets ; illisible : le maximum accepté (4), jamais moins. */
export function pdfPages(file: InvoiceFile): number {
  try { return Math.max(1, countPdfPages(Buffer.from(file.data, 'base64')).pages); } catch { return 4; }
}
/**
 * L'entrée à réserver pour un appel : la base, puis chaque image (2 × son coût nominal, ULTRA_HIGH pour `ultraImages`) et chaque page de PDF
 * (2 × 1 120). Jamais moins que le forfait de k1 (6 000). `files` = ce que l'appel envoie vraiment.
 */
export function inputReserveTokens(files: InvoiceFile[], opts: { ultraImages?: boolean; codeExecution?: boolean } = {}): number {
  let total = RESERVE_BASE_TOKENS;
  for (const file of files) {
    total += file.mimeType === 'application/pdf' ? pdfPages(file) * PDF_PAGE_TOKENS * RESERVE_MARGIN
      : (opts.ultraImages ? IMAGE_TOKENS.ULTRA_HIGH : IMAGE_TOKENS.HIGH) * RESERVE_MARGIN;
  }
  return Math.max(RESERVE_INPUT_TOKENS, total) * (opts.codeExecution ? CODE_EXEC_INPUT_FACTOR : 1);
}
export class Budget {
  reserved = 0;
  constructor(readonly limitMicro: number, public spentMicro = 0) {}
  reserve(micro: number): number {
    if (this.spentMicro + this.reserved + micro > this.limitMicro)
      throw new BudgetStop(`Budget atteint : ${(this.spentMicro / 1e6).toFixed(4)} CHF dépensés, ${(this.reserved / 1e6).toFixed(4)} CHF réservés, cet appel en réserverait ${(micro / 1e6).toFixed(4)} sur ${(this.limitMicro / 1e6).toFixed(2)} CHF. Arrêt net.`);
    this.reserved += micro;
    return micro;
  }
  /** Coût inconnu (délai, réseau) : la réserve entière est comptée, jamais zéro. */
  settle(reserved: number, actual: number | null) { this.reserved -= reserved; this.spentMicro += actual ?? reserved; }
}

// ---------------------------------------------------------------------------------------------------------------------
// Journal : une ligne par appel, juste après lui, sans aucune valeur des documents
// ---------------------------------------------------------------------------------------------------------------------
const JOURNAL_HEAD = [
  '# Journal des appels Gemini du banc de lecture (k1-banc, D233 et D234)',
  '',
  'Une ligne par appel, écrite juste après lui. Aucune valeur des documents. Coûts au tarif provisionné de `geminiCosts.ts` (1,25 CHF/USD, marge de sécurité), pas une facture.',
  '',
  '| date | doc | tirage | variante | lecture | modèle | durée | entrée | sortie | coût CHF | cumul CHF | état |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ''
].join('\n');
const chf4 = (micro: number) => (micro / 1e6).toFixed(4);
/** Le journal garde le franc au micro près (6 décimales) : la passe suivante en relit la dépense sans arrondi. */
const chf6 = (micro: number) => (micro / 1e6).toFixed(6);
/** `chargedMicro` : ce que le budget a compté (le coût relu, ou la réserve entière quand la réponse n'a pas dit son coût). */
export function appendJournal(file: string, read: Reading, cumulMicro: number, simulated: boolean, chargedMicro: number | null = read.costMicroChf) {
  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file)) writeFileSync(file, JOURNAL_HEAD);
  const m = read.meta;
  const unknown = read.costMicroChf === null;
  appendFileSync(file, `| ${new Date().toISOString().slice(0, 19).replace('T', ' ')} | ${m.doc} | ${m.tirage} | ${m.variant === 'Cp' ? 'C′' : m.variant} | ${m.lecture} | ${m.model} | ${read.ms} ms | ${read.inputTokens ?? '?'} | ${read.outputTokens ?? '?'} | ${chf6(chargedMicro ?? 0)} | ${chf6(cumulMicro)} | ${read.state}${unknown ? ' (coût inconnu : réserve comptée)' : ''}${simulated ? ' (SIMULÉ)' : ''} |\n`);
}
/** Dépense déjà journalisée par les passes payantes précédentes (colonne « coût CHF »). */
export function spentInJournal(file: string): number {
  if (!existsSync(file)) return 0;
  let micro = 0;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const cells = line.split('|').map(cell => cell.trim());
    if (cells.length < 13 || !/^\d{4}-\d{2}-\d{2}/.test(cells[1] ?? '') || /SIMULÉ/.test(line)) continue;
    const cost = Number(cells[10]);
    if (Number.isFinite(cost)) micro += Math.round(cost * 1e6);
  }
  return micro;
}

// ---------------------------------------------------------------------------------------------------------------------
// Chemins dans un résultat (fautes fabriquées et jugement) : `date`, `items.3.unit`, `items.*.unit`
// ---------------------------------------------------------------------------------------------------------------------
export function valueAtPath(root: any, route: string): unknown {
  return route.split('.').reduce((node: any, key) => (node === null || node === undefined ? undefined : node[key]), root);
}
function expandPath(root: any, route: string): string[] {
  const keys = route.split('.');
  let paths: string[][] = [[]];
  for (const key of keys) {
    paths = paths.flatMap(prefix => {
      if (key !== '*') return [[...prefix, key]];
      const node = valueAtPath(root, prefix.join('.'));
      return Array.isArray(node) ? node.map((_: unknown, index: number) => [...prefix, String(index)]) : [];
    });
  }
  return paths.map(parts => parts.join('.'));
}
export function setAtPath(root: any, route: string, value: unknown) {
  const keys = route.split('.');
  const last = keys.pop()!;
  const parent = keys.length ? valueAtPath(root, keys.join('.')) : root;
  if (parent && typeof parent === 'object') (parent as any)[last] = value;
}

// ---------------------------------------------------------------------------------------------------------------------
// Simulation : réponses fabriquées depuis la vérité, et quelques fautes fabriquées pour éprouver le jugement
// ---------------------------------------------------------------------------------------------------------------------
export type Family = 'f1' | 'f2' | 'l1' | 'l2' | 's3' | 'm1' | 'm2' | 'h1' | 'h2' | 'p1' | 'p2' | 'v1' | 'v2' | 'w1' | 'w2' | 'u1' | 'u2' | 't1' | 't2';
export interface Fault { id: string; doc: string; tirage: number; families: Family[]; edits: Array<{ path: string; value?: unknown; delta?: number }>; cut?: boolean; note: string }
export interface AppliedFault { fault: string; doc: string; tirage: number; family: Family; path: string; wrongValue: unknown }

/** Plan de fautes (tirages 1 et 2 ; le 3ᵉ reste propre : il prouve que le jugement ne crie pas au loup). */
export const FAULT_PLAN: Fault[] = [
  { id: 'date-fausse', doc: 'doc5', tirage: 2, families: ['f1', 'f2'], edits: [{ path: 'date', value: '01.01.2000' }], note: 'les deux 3.8 lisent la même fausse date (aucun contrôle ne la voit : faux vert en A et B)' },
  { id: 'unite-x', doc: 'doc5', tirage: 1, families: ['l1', 'l2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux Flash-Lite inventent l’unité « x » sur toutes les lignes (faux vert en C et C′)' },
  { id: 'lite-divergent', doc: 'doc1', tirage: 1, families: ['l2'], edits: [{ path: 'items.2.quantity', value: 7 }], note: 'une lecture lite diverge : la 3.8 tranche' },
  { id: 'ligne-fausse', doc: 'doc6', tirage: 2, families: ['f1', 'f2'], edits: [{ path: 'items.3.amountTTC', delta: 1 }], note: 'deux 3.8 lisent le même montant de ligne faux : l’arithmétique le voit (alerte juste)' },
  { id: 'ttc-diverge', doc: 'doc3', tirage: 2, families: ['f1'], edits: [{ path: 'amountTTC', delta: 10 }], note: 'une 3.8 lit un autre total : la 3ᵉ lecture tranche' },
  { id: 'coupure-lite', doc: 'doc7', tirage: 2, families: ['l2'], edits: [], cut: true, note: 'une lecture lite est coupée par la limite de sortie' },
  // k2 : les fautes des nouvelles familles (réflexion medium, high, consigne Flash-Lite)
  { id: 'unite-x-medium', doc: 'doc5', tirage: 2, families: ['m1', 'm2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux Flash-Lite medium inventent l’unité « x » (faux vert en Lm : la 3.8 n’est pas appelée)' },
  { id: 'coupure-high', doc: 'doc7', tirage: 1, families: ['h1'], edits: [], cut: true, note: 'une lecture high est coupée, même au plafond relevé' },
  { id: 'ligne-fausse-lite', doc: 'doc6', tirage: 1, families: ['p1', 'p2'], edits: [{ path: 'items.3.amountTTC', delta: 1 }], note: 'les deux lectures à consigne Flash-Lite lisent un même montant de ligne faux : l’arithmétique appelle la 3.8, qui tranche seule' },
  { id: 'total-diverge-high', doc: 'doc3', tirage: 1, families: ['h2'], edits: [{ path: 'amountTTC', delta: 5 }], note: 'une lecture high lit un autre total : la 3.8 tranche seule' },
  { id: 'devise-abregee', doc: 'doc4', tirage: 3, families: ['l1', 'l2', 'm1', 'm2', 'p1', 'p2'], edits: [{ path: 'currency', value: 'Fr.' }], note: 'les deux Flash-Lite écrivent « Fr. » au lieu de « CHF » : N le rattrape, sans N le résultat est faux' },
  // k4 : les fautes des variantes de harness (consigne après les images, schéma du banc, ULTRA_HIGH, tuiles)
  { id: 'unite-x-harness', doc: 'doc5', tirage: 3, families: ['v1', 'v2', 'w1', 'w2', 'u1', 'u2', 't1', 't2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux lectures de Hv, Sv, Uv et Tv inventent l’unité « x » (faux vert : la 3.8 n’est pas appelée)' },
  { id: 'coupure-schema', doc: 'doc7', tirage: 3, families: ['w1'], edits: [], cut: true, note: 'une lecture au schéma du banc est coupée par la limite de sortie' },
  { id: 'total-diverge-schema', doc: 'doc3', tirage: 3, families: ['w2'], edits: [{ path: 'amountTTC', delta: 5 }], note: 'une lecture au schéma du banc lit un autre total : la 3.8 tranche, le vote garde « disputed »' }
];

const hashOf = (text: string) => createHash('sha256').update(text).digest().readUInt32BE(0);

export function truthToRaw(c: BenchCase): any {
  const e = c.expected, first = (value: any, fallback: any) => (Array.isArray(value) ? value.find((entry: unknown) => entry !== null && entry !== undefined && entry !== '') ?? fallback : value ?? fallback);
  const items: any[] = Array.isArray(e.items) ? e.items : [];
  return {
    vendor: first(e.vendor, '') || 'Fournisseur simulé', documentType: first(e.documentType, 'invoice'), date: first(e.date, ''), currency: first(e.currency, 'CHF'),
    invoiceNumber: first(e.invoiceNumber, ''), orderNumber: first(e.orderNumber, ''), amountHT: first(e.amountHT, null), tvaAmount: first(e.tvaAmount, null),
    amountTTC: first(e.amountTTC, null), tvaRate: first(e.tvaRate, null), paymentEvidence: first(e.paymentEvidence, 'unknown'), proForma: false,
    category: 'divers', subcategory: '', description: '', vat: [], printedLineCount: items.length, linesLost: 0, fieldWarnings: [], rejets: [],
    items: items.map(item => ({ name: item.name, kind: first(item.kind, 'other'), reference: '', variant: '', quantity: item.quantity ?? null, unit: first(item.unit, ''),
      price: item.price ?? null, amountTTC: item.amountTTC ?? null, stockCategory: '', evidence: '', ambiguity: '', vatCode: '', alphaPctLu: null }))
  };
}

const LITE_FAMILY: Record<string, string> = { Lm: 'm', Lh: 'h', Lp: 'p', Hv: 'v', Sv: 'w', Uv: 'u', Tv: 't' };
export const familyOf = (meta: ReadMeta): Family => meta.lecture === 3 ? 's3'
  : meta.model === LITE_MODEL ? (LITE_FAMILY[meta.variant] ? `${LITE_FAMILY[meta.variant]}${meta.lecture}` : meta.lecture === 1 ? 'l1' : 'l2') as Family
  : (meta.lecture === 1 ? 'f1' : 'f2');

/** Réflexion simulée (jetons de réflexion) par groupe : la vraie mesure vient du mode payant. */
const SIM_THOUGHTS: Record<string, number> = { Lm: 450, Lh: 1500 };

/** Réponse fabriquée d'un appel : déterministe (document, tirage, famille) ; une 3ᵉ lecture est la même pour A, C et C′. */
export function simulateResponse(c: BenchCase, meta: ReadMeta, plan: Fault[], log: AppliedFault[]): { json: any; ms: number } {
  const family = familyOf(meta), seed = hashOf(`${c.id}|${meta.tirage}|${family}`);
  const raw = truthToRaw(c);
  let cut = false;
  for (const fault of plan.filter(item => item.doc === c.id && item.tirage === meta.tirage && item.families.includes(family))) {
    if (fault.cut) cut = true;
    for (const edit of fault.edits) {
      for (const route of expandPath(raw, edit.path)) {
        const wrong = edit.delta !== undefined ? Number(((valueAtPath(raw, route) as number ?? 0) + edit.delta).toFixed(2)) : edit.value;
        setAtPath(raw, route, wrong);
        if (!log.some(entry => entry.fault === fault.id && entry.family === family && entry.path === route)) log.push({ fault: fault.id, doc: c.id, tirage: meta.tirage, family, path: route, wrongValue: wrong });
      }
    }
  }
  // Sv et Uv répondent au schéma du banc ; la lecture les reconvertit (le banc éprouve ainsi le convertisseur de bout en bout)
  const text = JSON.stringify(usesSvSchema(meta) ? productionToSv(raw) : raw), outputTokens = Math.round(text.length / 3.2);
  const inputTokens = 1900 + (seed % 140);
  const strong = meta.model !== LITE_MODEL;
  const thoughts = meta.lecture === 3 ? 0 : SIM_THOUGHTS[meta.variant] ?? 0, ceiling = callSpec(meta.variant, meta.lecture).maxOut;
  const json = {
    modelVersion: meta.model,
    candidates: [{ finishReason: cut ? 'MAX_TOKENS' : 'STOP', content: { role: 'model', parts: meta.variant === 'Av' && meta.lecture === 3
      // l'outil d'exécution de code : un commentaire, le code, son résultat, puis le JSON (seule la dernière part texte se lit)
      ? [{ text: 'Je zoome sur le tableau des lignes.' }, { executableCode: { language: 'PYTHON', code: 'crop()' } }, { codeExecutionResult: { outcome: 'OUTCOME_OK', output: 'ok' } }, { text }]
      : [{ text: cut ? text.slice(0, Math.floor(text.length / 2)) : text }] } }],
    usageMetadata: { promptTokenCount: inputTokens, candidatesTokenCount: cut ? ceiling - thoughts : outputTokens, thoughtsTokenCount: thoughts,
      totalTokenCount: inputTokens + (cut ? ceiling : outputTokens + thoughts) }
  };
  return { json, ms: (strong ? 7000 : 2500) + (seed % 2600) + Math.round((outputTokens + thoughts) * (strong ? 1.1 : 0.4)) };
}

// ---------------------------------------------------------------------------------------------------------------------
// Le banc
// ---------------------------------------------------------------------------------------------------------------------
export type Transport = (model: string, body: Record<string, unknown>, meta: ReadMeta, signal: AbortSignal) => Promise<{ json: any; ms: number }>;
export interface BenchDeps {
  cases?: BenchCase[]; readKey?: () => string | undefined; optIn?: (label: string, command: string) => void;
  transport?: Transport; journalPath?: string; log?: (line: string) => void; readFile?: (c: BenchCase) => InvoiceFile | InvoiceFile[]; plan?: Fault[];
  /** Prêt d'appels (sinon `options.reprendre`). */
  lender?: Lender;
  /** Tv : rend les deux tuiles d'une image (sinon Chrome, par puppeteer-core ; en simulation, l'image elle-même). */
  tiler?: Tiler;
}
/** Les deux tuiles qui se recouvrent d'une image : 60 % du haut, 60 % du bas, pleine résolution. */
export type Tiler = (file: InvoiceFile, caseId: string) => Promise<[InvoiceFile, InvoiceFile]>;
/** Les tuiles d'un cas se font pour une image seule (ni PDF ni plusieurs captures). */
export const isTileable = (files: InvoiceFile[]) => files.length === 1 && files[0].mimeType !== 'application/pdf';
export const TILE_SHARE = 0.6;
export interface VariantRecord { capLost?: number; ids: string[]; calls: number; ms: number; costMicroChf: number; costUnknown: number; result: any | null; failure?: string; thirdFrom?: ThirdFrom }
/** `variants` : les ids de variante lus (`Cs`, `Lm`…) et leurs versions N (`Cs+N`). */
export interface DrawRecord { doc: string; tirage: number; readings: Array<Omit<Reading, 'normalized' | 'raw'>>; variants: Record<string, VariantRecord> }

// ---------------------------------------------------------------------------------------------------------------------
// Prêt d'appels : une sortie précédente (k1) dont les lectures déjà payées sont rendues telles quelles
// ---------------------------------------------------------------------------------------------------------------------
export interface Loan { json: any; ms: number; costMicroChf: number | null; id: string }
/** Renvoie la première lecture prêtée parmi `ids` pour ce document et ce tirage. */
export type Lender = (doc: string, tirage: number, ids: readonly string[]) => Loan | undefined;
/** Les ids sous lesquels une 3ᵉ lecture 3.8 (consigne 3) a pu être faite : A3, C3, C′3, et celles de k2. */
export const THIRD_IDS: readonly string[] = ['A3', 'C3', 'Cp3', 'Lm3', 'Lh3', 'Lp3'];
export function loadLender(dir: string): Lender {
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] };
  const loans = new Map<string, Loan>();
  for (const record of file.records) {
    for (const read of record.readings) {
      const raw = path.join(dir, 'raw', `${record.doc}-t${record.tirage}-${read.meta.id}.json`);
      if (!existsSync(raw)) continue;
      loans.set(`${record.doc}|${record.tirage}|${read.meta.id}`, { json: JSON.parse(readFileSync(raw, 'utf8')), ms: read.ms, costMicroChf: read.costMicroChf, id: read.meta.id });
    }
  }
  return (doc, tirage, ids) => { for (const id of ids) { const loan = loans.get(`${doc}|${tirage}|${id}`); if (loan) return loan; } return undefined; };
}

export function realTransport(key: string, fetchImpl: typeof fetch = fetch): Transport {
  return async (model, body, _meta, signal) => {
    assertGeminiModel(model);
    const started = Date.now();
    const response = await fetchImpl(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Le motif de Google (sans la clé) : un refus 400 ne coûte rien, mais sans son motif il ne se corrige pas.
      const motif = redact(String((json as any)?.error?.message ?? '').slice(0, 400), key);
      if (motif) console.error(`Gemini HTTP ${response.status} (${model}) : ${motif}`);
      throw Object.assign(new Error(redact(`Gemini HTTP ${response.status}${motif ? ` : ${motif}` : ''}`, key)), { httpStatus: response.status });
    }
    return { json, ms: Date.now() - started };
  };
}

/** Les fichiers d'un cas, validés comme en production (4 Mo, 4 pages de PDF). En simulation et hors ligne, un fichier absent est remplacé par un faux (image ou PDF de deux pages). */
export function loadCaseFiles(c: BenchCase, fake: boolean): InvoiceFile[] {
  return caseFiles(c).map(name => {
    const full = path.isAbsolute(name) ? name : path.join(ROOT, name);
    const mimeType = mimeOfPath(name, c.mimeType);
    if (fake && !existsSync(full))
      return mimeType === 'application/pdf' ? { mimeType, data: Buffer.from('%PDF-1.4\n<< /Type /Pages /Count 2 >>\n<< /Type /Page >>\n<< /Type /Page >>\n').toString('base64') } : { mimeType, data: Buffer.from([255, 216, 255, 217]).toString('base64') };
    return validateInvoiceFile({ mimeType, data: readFileSync(full).toString('base64') });
  });
}

/** Av : l'outil d'exécution de code relit l'image dans ses tours ; ses jetons d'entrée s'ajoutent au prompt pour le coût. */
export function withToolTokens(json: any): any {
  const usage = json?.usageMetadata;
  const extra = usage?.toolUsePromptTokenCount;
  if (!usage || typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) return json;
  return { ...json, usageMetadata: { ...usage, promptTokenCount: (usage.promptTokenCount ?? 0) + extra, totalTokenCount: (usage.totalTokenCount ?? 0) } };
}

/** Les 3.8 partagées appelées plus d'une fois pour le même (document, tirage) : [] attendu. Les 3.8 d'Av sont comptées à part. */
export function thirdCallDuplicates(calls: Array<{ doc: string; tirage: number; variant: string; lecture: number }>): string[] {
  const seen = new Map<string, number>();
  for (const call of calls) if (call.lecture === 3) { const key = `${call.doc}|${call.tirage}|${call.variant === 'Av' ? 'Av' : 'partagée'}`; seen.set(key, (seen.get(key) ?? 0) + 1); }
  return [...seen].filter(([, n]) => n > 1).map(([key, n]) => `${key} ×${n}`);
}

/**
 * Tv : les deux tuiles d'une image (60 % du haut, 60 % du bas, pleine résolution, recouvrement de 20 %) découpées dans le canvas de Chrome par
 * puppeteer-core (déjà au dépôt, aucune dépendance neuve), mises en cache dans le dossier de la sortie.
 */
export function chromeTiler(cacheDir: string, chromePath: string = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'): Tiler {
  return async (file, caseId) => {
    mkdirSync(cacheDir, { recursive: true });
    const names = [path.join(cacheDir, `${caseId}-haut.jpg`), path.join(cacheDir, `${caseId}-bas.jpg`)];
    if (names.every(name => existsSync(name))) return names.map(name => ({ mimeType: 'image/jpeg', data: readFileSync(name).toString('base64') })) as [InvoiceFile, InvoiceFile];
    const puppeteer: any = await import('puppeteer-core');
    const browser = await (puppeteer.default ?? puppeteer).launch({ executablePath: chromePath, headless: true, args: ['--mute-audio', '--disable-extensions'] });
    try {
      const page = await browser.newPage();
      const crop = new Function('dataUrl', 'share', `return (async () => {
        const image = new Image(); image.src = dataUrl; await image.decode();
        const height = Math.round(image.naturalHeight * share), tops = [0, image.naturalHeight - height];
        return tops.map(top => { const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = height;
          canvas.getContext('2d').drawImage(image, 0, top, image.naturalWidth, height, 0, 0, image.naturalWidth, height); return canvas.toDataURL('image/jpeg', 0.95).split(',')[1]; });
      })()`);
      const tiles: string[] = await page.evaluate(crop as any, `data:${file.mimeType};base64,${file.data}`, TILE_SHARE);
      tiles.forEach((data, index) => writeFileSync(names[index], Buffer.from(data, 'base64')));
      return tiles.map(data => ({ mimeType: 'image/jpeg', data })) as [InvoiceFile, InvoiceFile];
    } finally { await browser.close(); }
  };
}

function stamp(date = new Date()) { return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15); }

export async function runBench(options: BenchOptions, deps: BenchDeps = {}): Promise<{ outDir: string; records: DrawRecord[]; stopped?: string; faults: AppliedFault[] }> {
  const simulated = options.mode === 'simuler', offline = options.mode === 'hors-ligne';
  const log = deps.log ?? (line => console.log(line));
  const cases = (deps.cases ?? loadCases(options.cas?.map(casPath))).filter(c => !options.docs || options.docs.includes(c.id));
  if (!cases.length) throw new Error('Aucun cas à lire.');
  const wanted: VariantId[] = options.variantes?.length ? [...options.variantes] : [...K1_VARIANTS];
  // B se déduit des lectures de A : demander B, c'est lire A.
  const want = new Set<string>(wanted);
  const groups = new Set<Group>(wanted.map(id => GROUP_OF[id]));
  const outDir = path.resolve(options.out ?? path.join(REELS_DIR, `banc-k4-${simulated ? 'sim-' : offline ? 'horsligne-' : ''}${stamp()}`));
  mkdirSync(path.join(outDir, 'raw'), { recursive: true });
  const journalPath = deps.journalPath ?? (simulated || offline ? path.join(outDir, 'journal-gemini.md') : MISSION_JOURNAL);
  const lender: Lender | undefined = deps.lender ?? (options.reprendre ? loadLender(path.resolve(options.reprendre)) : undefined);

  let transport: Transport;
  let budget: Budget;
  let restoreFetch = () => {};
  const faultLog: AppliedFault[] = [];
  const plan = options.faults ? deps.plan ?? FAULT_PLAN : [];
  if (simulated || offline) {
    // Aucun réseau, aucune clé : le fetch global lui-même est coupé pendant la simulation et le hors-ligne.
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => { throw new Error('Réseau interdit en simulation et hors ligne.'); }) as typeof fetch;
    restoreFetch = () => { globalThis.fetch = realFetch; };
    const byId = new Map(cases.map(c => [c.id, c]));
    transport = deps.transport ?? (async (_model, _body, meta) => simulateResponse(byId.get(meta.doc)!, meta, plan, faultLog));
    budget = new Budget(Number.MAX_SAFE_INTEGER);
  } else {
    (deps.optIn ?? ((label: string, command: string) => requirePaidAiTestOptIn({ label, command })))(
      `Banc de lecture des factures (${cases.length} documents × ${options.repeat} tirages, variantes ${wanted.join(',')}, budget ${options.budgetChf} CHF)`,
      `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf ${options.budgetChf} --variantes ${wanted.join(',')} --confirm-paid-ai`);
    const key = (deps.readKey ?? (() => readLocalKey()))();
    if (!key) throw new Error('Aucune clé Gemini locale : ni GEMINI_API_KEY, ni le fichier de clé du poste (lu par readLocalKey). Aucun appel.');
    transport = deps.transport ?? realTransport(key);
    const before = spentInJournal(journalPath);
    budget = new Budget(Math.round((options.budgetChf ?? 0) * 1e6), before);
    log(`Budget ${options.budgetChf} CHF, déjà journalisé ${chf4(before)} CHF.`);
  }

  const reserveByCall = new Map<string, number>();
  const reserveFor = (model: string, maxOut: number = SCAN_MAX_OUTPUT, inputTokens: number = RESERVE_INPUT_TOKENS) => {
    const key = `${model}@${maxOut}@${inputTokens}`;
    if (!reserveByCall.has(key)) reserveByCall.set(key, reservationMicro(model, maxOut, inputTokens));
    return reserveByCall.get(key)!;
  };
  let halt: string | undefined, consecutiveFailures = 0;
  const readFiles = (c: BenchCase): InvoiceFile[] => {
    if (deps.readFile) { const read = deps.readFile(c); return Array.isArray(read) ? read : [read]; }
    return loadCaseFiles(c, simulated || offline);
  };
  const tilesDir = path.join(outDir, 'tuiles');
  const tiler: Tiler = deps.tiler ?? (simulated || offline ? async file => [file, file] : chromeTiler(tilesDir));

  const records: DrawRecord[] = [];
  const reserveTable = Object.fromEntries([['a', callSpec('A', 1)], ['c', callSpec('C', 1)], ['lm', callSpec('Lm', 1)]].map(([name, spec]) => [name as string, reserveFor((spec as CallSpec).model, (spec as CallSpec).maxOut) / 1e6]));
  const meta0 = { mode: options.mode, repeat: options.repeat, startedAt: new Date().toISOString(), models: { strong: STRONG_MODEL, lite: LITE_MODEL }, budgetChf: options.budgetChf ?? null,
    variantes: wanted, normaliser: !!options.normaliser, reprendre: options.reprendre ? path.basename(path.resolve(options.reprendre)) : null,
    docs: cases.map(c => c.id), casFiles: (options.cas?.map(casPath) ?? CAS_FILES).map(file => path.basename(file)), reserve: reserveTable, faults: simulated && options.faults,
    avSansSchema: !!options.avSansSchema };
  const save = (stopped?: string) => {
    writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify({ meta: { ...meta0, finishedAt: new Date().toISOString(), stopped: stopped ?? null, spentChf: simulated || offline ? null : budget.spentMicro / 1e6 }, records }, null, 1)}\n`);
    if (simulated) writeFileSync(path.join(outDir, 'faults.json'), `${JSON.stringify({ plan, applied: faultLog }, null, 1)}\n`);
  };

  const readings: Reading[] = [];
  /** Un appel (ou son prêt). `group` règle le modèle, la consigne, la réflexion et le plafond de sortie (`callSpec`). */
  const thirdKeys = new Set<string>();
  /** `files` : ce que cet appel envoie (les tuiles de Tv comprises) ; `original` : les fichiers du cas, qui fixent la 3ᵉ lecture. */
  const doCall = async (c: BenchCase, files: InvoiceFile[], tirage: number, group: string, lecture: 1 | 2 | 3): Promise<Reading> => {
    if (halt) throw new BudgetStop(halt);
    const spec = callSpec(group, lecture), model = spec.model;
    const freeJson = !!options.avSansSchema && !!spec.codeExecution;
    const meta: ReadMeta = { id: `${group}${lecture}`, doc: c.id, tirage, variant: group, lecture, model, ...(freeJson ? { freeJson: true } : {}) };
    // Prêt : seuls les réglages de k1 (A, C standards, 3ᵉ lecture) se prêtent ; les autres lisent toujours neuf. La 3.8 d'Av n'est jamais prêtée.
    const loan = lender && (lecture === 3 && group !== 'Av' ? lender(c.id, tirage, THIRD_IDS) : group === 'A' || group === 'C' ? lender(c.id, tirage, [meta.id]) : undefined);
    // Une seule 3.8 (partagée) par document et par tirage : un second appel est une erreur du banc, jamais une dépense.
    if (lecture === 3 && !loan) {
      const key = `${c.id}|${tirage}|${group === 'Av' ? 'Av' : 'partagée'}`;
      if (thirdKeys.has(key)) throw new Error(`Banc : la 3.8 ${group === 'Av' ? 'd’Av' : 'partagée'} est appelée deux fois pour ${c.id}, tirage ${tirage}.`);
      thirdKeys.add(key);
    }
    if (loan) {
      const lent: Reading = { ...readingFromResponse(meta, loan.json, loan.ms, loan.costMicroChf), lent: true };
      readings.push(lent);
      return lent;
    }
    if (offline) throw new Error(`Hors ligne : la lecture ${meta.id} (${meta.doc}, tirage ${tirage}) manque dans la sortie prêtée ; aucun appel n’est permis.`);
    const body = buildReadBody(files, spec.prompt, spec.maxOut, spec.thinking, { promptAfter: spec.promptAfter, temperature: !spec.noTemperature, svSchema: spec.svSchema,
      ultraHigh: spec.ultraHigh, codeExecution: spec.codeExecution, freeJson, tilesNote: spec.tiles });
    // Le garde-fou de coût de la production refuse l'outil d'exécution de code : il chiffre le corps sans l'outil, qui est remis à l'envoi.
    const { tools, ...quotable } = body as Record<string, unknown> & { tools?: unknown };
    const quote = quoteGeminiCost(model, quotable);
    const reserved = budget.reserve(reserveFor(model, spec.maxOut, inputReserveTokens(files, { ultraImages: spec.ultraHigh, codeExecution: spec.codeExecution })));
    const started = Date.now();
    let read: Reading;
    try {
      const signal = AbortSignal.any([AbortSignal.timeout(100_000), AbortSignal.timeout(spec.timeoutMs)]);
      const answer = await transport(model, tools ? { ...quote.body, tools } : quote.body, meta, signal);
      const cost = observedGeminiCostDetails(quote, withToolTokens(answer.json))?.chargedMicroChf ?? null;
      read = readingFromResponse(meta, answer.json, answer.ms, cost);
      writeFileSync(path.join(outDir, 'raw', `${c.id}-t${tirage}-${meta.id}.json`), JSON.stringify(answer.json));
    } catch (error: any) {
      // HTTP refusé : rien n'est facturé. Délai ou coupure réseau : la réponse a pu être facturée, la réserve est comptée.
      read = readingFromError(meta, error, Date.now() - started, typeof error?.httpStatus === 'number' ? 0 : null);
    }
    budget.settle(reserved, read.costMicroChf);
    appendJournal(journalPath, read, budget.spentMicro, simulated, read.costMicroChf ?? reserved);
    // Une réponse reçue, même coupée (MAX_TOKENS) ou illisible, est un résultat mesuré ; seul un appel sans réponse (refus, délai) compte
    // vers l'arrêt net. Le 01.11, trois lectures coupées de doc8 (37 lignes) avaient arrêté la passe et privé le banc de ses six pièces neuves.
    consecutiveFailures = read.ok || read.finishReason !== null ? 0 : consecutiveFailures + 1;
    if (consecutiveFailures >= 3) halt = 'Trois appels en échec d’affilée : arrêt net (un fournisseur qui refuse en boucle ne se mesure pas).';
    readings.push(read);
    return read;
  };
  const parallel = async (jobs: Array<Promise<Reading>>): Promise<Reading[]> => {
    const settled = await Promise.allSettled(jobs);
    const failed = settled.find(item => item.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) throw failed.reason;
    return settled.map(item => (item as PromiseFulfilledResult<Reading>).value);
  };

  let stopped: string | undefined;
  const summary = (final: Final, extra: Partial<VariantRecord> = {}): VariantRecord => ({ ids: final.used.map(read => read.meta.id), calls: final.used.length, ms: final.ms,
    costMicroChf: final.costMicroChf, costUnknown: final.costUnknown, capLost: Math.max(0, ...final.used.map(read => read.overCap ?? 0)), result: final.result, ...(final.failure ? { failure: final.failure } : {}), ...extra });
  const shortId = (id: string) => id.replace('Cp', 'C′').replace('Cs', 'C★').replace('C★p', 'C★′').replace('C★v', 'C★v');

  try {
  outer: for (let tirage = 1; tirage <= options.repeat; tirage++) {
    for (const c of cases) {
      const files = readFiles(c);
      const before = readings.length;
      try {
        const reads: DrawReads = { lite: {} };
        // La 3ᵉ lecture (3.8, consigne 3) est unique par document et tirage : la première variante qui en a besoin l'obtient (prêt de k1,
        // sinon un appel neuf), les autres la réutilisent. Une 3.8 de A, quand A est lue, est la même. Elle lit toujours les fichiers du cas
        // (jamais les tuiles de Tv). Seule la 3.8 d'Av (exécution de code) est à part.
        let pool: Reading | undefined;
        const third = async (group: string): Promise<Reading> => { if (!pool) pool = await doCall(c, files, tirage, group, 3); return pool; };
        if (groups.has('A')) {
          // A : exactement la production (deux lectures 3.8 en parallèle, 3ᵉ si elles divergent)
          const [a1, a2] = await parallel([doCall(c, files, tirage, 'A', 1), doCall(c, files, tirage, 'A', 2)]);
          const a3 = needsThird(a1, a2) ? await third('A') : undefined;
          Object.assign(reads, { a1, a2, a3 });
        }
        if (groups.has('C')) {
          // C, C′, C★, C★v, C★′, Av : deux lectures lite en parallèle ; la 3.8 est prêtée par A (ou k1) si elle existe, sinon un appel neuf
          const [l1, l2] = await parallel([doCall(c, files, tirage, 'C', 1), doCall(c, files, tirage, 'C', 2)]);
          const cNeeds = needsThirdLite(l1, l2), cpNeeds = !cNeeds && arithmeticFailsOnTwo(l1, l2);
          Object.assign(reads, { l1, l2 });
          if (cNeeds) { if (wanted.some(id => GROUP_OF[id] === 'C' && id !== 'Av')) { reads.cThird = await third('C'); reads.cpThird = reads.cThird; } if (want.has('Av')) reads.avThird = await doCall(c, files, tirage, 'Av', 3); }
          else if (cpNeeds && (want.has('Cp') || want.has('Csp'))) reads.cpThird = await third('Cp');
        }
        for (const group of LITE_GROUPS) {
          if (!groups.has(group)) continue;
          // Tv : seulement pour une image seule ; sinon la variante n'a pas de parcours sur ce cas
          let sent = files;
          if (group === 'Tv') { if (!isTileable(files)) continue; sent = [files[0], ...await tiler(files[0], c.id)]; }
          // Lm, Lh, Lp, Hv, Sv, Uv, Tv = C★v : la divergence seule appelle la 3.8, qui tranche les valeurs (le statut du vote est gardé)
          const [r1, r2] = await parallel([doCall(c, sent, tirage, group, 1), doCall(c, sent, tirage, group, 2)]);
          reads.lite[group] = { r1, r2, ...(needsThird(r1, r2) ? { third: await third(group) } : {}) };
        }
        const variants: Record<string, VariantRecord> = {};
        const put = (suffix: string, derived: Partial<Record<VariantId, Derived>>) => {
          for (const id of orderVariants(Object.keys(derived))) { const d = derived[id as VariantId]!; variants[`${id}${suffix}`] = summary(d.final, d.thirdFrom ? { thirdFrom: d.thirdFrom } : {}); }
        };
        put('', deriveVariants(reads, want));
        // N : les mêmes lectures, la devise relue en code ISO ; aucun appel de plus (une 3.8 inutile devient simplement non demandée)
        if (options.normaliser) put(N_SUFFIX, deriveVariants(mapReads(reads, withCodesNormalized), want));
        records.push({ doc: c.id, tirage, readings: readings.slice(before).map(({ normalized: _n, raw: _r, ...rest }) => rest), variants });
        log(`${c.id} tirage ${tirage} : ${Object.keys(variants).map(id => `${shortId(id)} ${variants[id].calls} appel(s) ${Math.round(variants[id].ms / 100) / 10} s`).join(' · ')}`);
        save();
      } catch (error: any) {
        if (!(error instanceof BudgetStop)) throw error;
        stopped = error.message;
        log(`ARRÊT : ${stopped}`);
        break outer;
      }
    }
  }
  } finally { restoreFetch(); }
  save(stopped);
  log(simulated ? `Simulation terminée : ${records.length} parcours dans ${outDir} (aucun réseau).`
    : offline ? `Recalcul hors ligne terminé : ${records.length} parcours dans ${outDir} (aucun réseau, aucun appel).`
    : `Passe terminée : ${records.length} parcours, ${chf4(budget.spentMicro)} CHF au total journalisé, dossier ${outDir}.`);
  return { outDir, records, stopped, faults: faultLog };
}

// ---------------------------------------------------------------------------------------------------------------------
// --estimer : sans réseau ni clé, ce que coûterait une commande (au pire, réserve par appel)
// ---------------------------------------------------------------------------------------------------------------------
export interface EstimateLine { variant: string; model: string; fresh: number; lent: number; reservedMicro: number; note?: string }
export interface Estimate { lines: EstimateLine[]; thirds: EstimateLine[]; freshCalls: number; reservedMicro: number; spentMicro: number; text: string[] }

/** Coût moyen observé par appel et par modèle dans une sortie précédente (aucune valeur de document) : sert à la dépense PROBABLE de --estimer. */
export function observedAverages(dir: string): Record<string, number> {
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] };
  const sums: Record<string, { n: number; micro: number }> = {};
  for (const read of file.records.flatMap(record => record.readings)) if (read.costMicroChf !== null && read.costMicroChf > 0) { const entry = sums[read.meta.model] ?? { n: 0, micro: 0 }; entry.n++; entry.micro += read.costMicroChf; sums[read.meta.model] = entry; }
  return Object.fromEntries(Object.entries(sums).map(([model, entry]) => [model, entry.micro / entry.n]));
}

export function estimateBench(options: BenchOptions, cases: BenchCase[], lender?: Lender, spentMicro = 0, averages?: Record<string, number>): Estimate {
  const wanted: VariantId[] = options.variantes?.length ? [...options.variantes] : [...K1_VARIANTS];
  const groups = [...new Set(wanted.map(id => GROUP_OF[id]))];
  const reserve = (spec: CallSpec, files: InvoiceFile[]) => reservationMicro(spec.model, spec.maxOut, inputReserveTokens(files, { ultraImages: spec.ultraHigh, codeExecution: spec.codeExecution }));
  const lineFor = (variant: string, model: string, note?: string): EstimateLine => ({ variant, model, fresh: 0, lent: 0, reservedMicro: 0, ...(note ? { note } : {}) });
  const byGroup = new Map<string, EstimateLine>(), thirdLine = lineFor('3.8 partagée (au pire une par document et par tirage)', STRONG_MODEL), avLine = lineFor('Av : 3.8 avec exécution de code (au pire une par document et par tirage)', STRONG_MODEL);
  const missing: string[] = [];
  for (const group of groups) byGroup.set(group, lineFor(group, callSpec(group, 1).model));
  for (const c of cases) {
    const files = loadCaseFiles(c, true);
    if (caseFiles(c).some(name => !existsSync(path.isAbsolute(name) ? name : path.join(ROOT, name)))) missing.push(c.id);
    for (let tirage = 1; tirage <= options.repeat; tirage++) {
      let thirdPossible = false;
      for (const group of groups) {
        const line = byGroup.get(group)!;
        let sent = files;
        if (group === 'Tv') { if (!isTileable(files)) continue; sent = [files[0], files[0], files[0]]; }
        for (const lecture of [1, 2] as const) {
          const spec = callSpec(group, lecture);
          if (lender && (group === 'A' || group === 'C') && lender(c.id, tirage, [`${group}${lecture}`])) { line.lent++; continue; }
          line.fresh++; line.reservedMicro += reserve(spec, sent);
        }
        thirdPossible = true;
      }
      if (thirdPossible) {
        if (lender?.(c.id, tirage, THIRD_IDS)) thirdLine.lent++; else { thirdLine.fresh++; thirdLine.reservedMicro += reserve(callSpec('A', 3), files); }
      }
      if (wanted.includes('Av')) { avLine.fresh++; avLine.reservedMicro += reserve(callSpec('Av', 3), files); }
    }
  }
  const lines = [...byGroup.values()];
  const thirds = [thirdLine, ...(wanted.includes('Av') ? [avLine] : [])];
  const all = [...lines, ...thirds];
  const freshCalls = all.reduce((sum, line) => sum + line.fresh, 0), reservedMicro = all.reduce((sum, line) => sum + line.reservedMicro, 0);
  const sharing: Record<string, string> = { B: 'A', Cp: 'C', Cs: 'C', Csv: 'C', Csp: 'C', Av: 'C' };
  const text: string[] = [`Estimation (aucun réseau, aucune clé) : ${cases.length} documents × ${options.repeat} tirages, variantes ${wanted.join(',')}${options.normaliser ? ' (+N : aucun appel de plus)' : ''}.`];
  if (missing.length) text.push(`Fichiers absents sur ce poste (taille supposée d’une image) : ${missing.join(', ')}.`);
  for (const id of wanted) {
    const group = GROUP_OF[id], line = byGroup.get(group)!;
    text.push(sharing[id] ? `- ${id} (${VARIANT_LABEL[id]}) : lit les lectures de ${sharing[id]}, comptées une fois${id === 'Av' ? ` ; sa 3.8 propre : ${avLine.fresh} appels neufs au pire (${STRONG_MODEL}), réserve ${(avLine.reservedMicro / 1e6).toFixed(4)} CHF` : ''}.`
      : `- ${id} (${VARIANT_LABEL[id]}) : ${line.fresh} appels neufs, ${line.lent} prêtés (${line.model}), réserve ${(line.reservedMicro / 1e6).toFixed(4)} CHF.`);
  }
  text.push(`- ${thirdLine.variant} : ${thirdLine.fresh} appels neufs au pire, ${thirdLine.lent} prêtés (${STRONG_MODEL}), réserve ${(thirdLine.reservedMicro / 1e6).toFixed(4)} CHF.`);
  const byModel = new Map<string, { fresh: number; micro: number }>();
  for (const line of all) { const entry = byModel.get(line.model) ?? { fresh: 0, micro: 0 }; entry.fresh += line.fresh; entry.micro += line.reservedMicro; byModel.set(line.model, entry); }
  for (const [model, entry] of byModel) text.push(`- Par modèle : ${model} ${entry.fresh} appels neufs, réserve ${(entry.micro / 1e6).toFixed(4)} CHF.`);
  const budget = options.budgetChf === undefined ? null : Math.round(options.budgetChf * 1e6);
  text.push(`Réserve maximale ${(reservedMicro / 1e6).toFixed(4)} CHF ; déjà journalisé ${(spentMicro / 1e6).toFixed(4)} CHF${budget === null ? '' : `, budget ${options.budgetChf} CHF (${spentMicro + reservedMicro > budget ? 'le budget arrêtera la passe avant la fin si tout est consommé au pire' : 'tient au pire'})`}. La réserve compte la sortie au plafond de chaque appel : la dépense réelle est bien en dessous.`);
  if (averages) {
    const probable = all.reduce((sum, line) => sum + line.fresh * (averages[line.model] ?? 0) * (line === avLine ? 3 : 1), 0);
    text.push(`Dépense probable (indicative : appels neufs × coût moyen observé par modèle dans la sortie prêtée, ×3 pour Av, sans tenir compte des images supplémentaires de Sv, Uv, Tv ni des PDF) : environ ${(probable / 1e6).toFixed(2)} CHF.`);
  }
  text.push(`BANC ESTIME ${(reservedMicro / 1e6).toFixed(4)} CHF ${freshCalls} appels neufs`);
  return { lines, thirds, freshCalls, reservedMicro, spentMicro, text };
}

/** vite-node ne laisse pas le nom du script dans process.argv : le banc se lance avec --simuler, --hors-ligne, --payant ou --estimer, jamais sous vitest. */
const isMain = () => !process.env.VITEST && (process.argv.includes('--simuler') || process.argv.includes('--payant') || process.argv.includes('--hors-ligne') || process.argv.includes('--estimer'));
if (isMain()) {
  const options = parseArgs(process.argv.slice(2));
  if (options.estimer) {
    try {
      const cases = loadCases(options.cas?.map(casPath)).filter(c => !options.docs || options.docs.includes(c.id));
      const lender = options.reprendre ? loadLender(path.resolve(options.reprendre)) : undefined;
      console.log(estimateBench(options, cases, lender, spentInJournal(MISSION_JOURNAL), options.reprendre ? observedAverages(path.resolve(options.reprendre)) : undefined).text.join('\n'));
      process.exit(0);
    } catch (error) { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
  }
  const out = options.out ?? (options.mode === 'simuler' ? path.join(tmpdir(), `k4-sim-${stamp()}`) : undefined);
  runBench({ ...options, out }).then(() => process.exit(0), error => { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
}
