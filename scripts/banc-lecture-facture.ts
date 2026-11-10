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
 * Voie k5-vision (01.11) : « Qqch du genre [dsh-vision-toolkit] ferait sens adapté à nos modèles et besoin ? » — cinq gestes de vision de plus,
 * mesurés contre la production (le détail et leurs outils : `banc-lecture-bandes.ts`, `banc-lecture-zoom.ts`) :
 *   Csv8  C★v dont les deux Flash-Lite ont 8 192 jetons de sortie (le repli `finalOfLite` se mesure au passage) ;
 *   Avl   C★v dont les deux Flash-Lite ont l'outil d'exécution de code (zoom intégré, comme Av sur la 3.8) ;
 *   Pv    un PDF de N pages : N lectures Flash-Lite en parallèle (une par page, tout le PDF joint), recollées dans l'ordre des pages ;
 *   Bv    une image haute (hauteur ≥ 2 × largeur) coupée en bandes sur des rangées vides, une lecture Flash-Lite par bande, recollées ;
 *   Zv    comme C★v, mais sur un désaccord de total, date, n° ou montant de ligne, la 3.8 localise la zone et ne relit que ce champ.
 * Le budget cumulé monte à 24,5 CHF (D242) ; `--plafond-passe` (3 CHF par défaut) arrête une passe avant de le dépasser.
 *
 * Voie f5-noms-fr (01.11, D271, D275) : « Ça traduits en français et fait le bon lien ».
 *   Csv8F  C★v8 dont les deux Flash-Lite ET la 3.8 rendent en plus `nameFr` par article : la désignation en français, marque et nom propre gardés,
 *          sans option ni unité (champ facultatif du schéma, une phrase de plus dans la consigne système ; `name` reste l'imprimé). Sa 3.8 est à elle
 *          (jamais prêtée ni partagée : celle de la production ne porte pas `nameFr`). Le champ ne survit pas à `normalizeInvoiceScan` ni au rapprochement
 *          (la production n'en reçoit rien) : le banc le garde à côté de chaque lecture (`Reading.namesFr`) et le rattache aux lignes du résultat final
 *          (`withNamesFr`) pour que le juge (`banc-lecture-facture-juger.ts`, section « noms en français ») le lise. Avec N : `Csv8F+N` (= Csv8+N+F).
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
import { dateDuVoteEtoile, phrasesDuVote } from '../functions/src/invoiceScanVote';
import { liteConsigne } from './banc-lecture-consignes-lite';
import { ALLEGEES, preparerAllegement } from './banc-lecture-alleger';
import {
  OutilManquant, bandNote, imageSize, jimpBander, estimateBandCount, isTall, loadJimp, loadPdfRenderer, mergeDecoded, pageNote, sizeBander, type BandPart, type Bander
} from './banc-lecture-bandes';
import {
  LOCATE_SCHEMA, MAX_ZOOM_TARGETS, REREAD_SCHEMA, ZOOM_MAX_OUT, buildZoomBody, fakeCropper, jimpCropper, locatePrompt, parseBox, parseZoomValue, patchDecoded, rereadPrompt, zoomJson, zoomTargets,
  type Cropper, type ZoomTarget
} from './banc-lecture-zoom';
// @ts-ignore — module JavaScript sans déclarations
import { readLocalKey, redact } from './gemini-usage-bench-guard.mjs';
// @ts-ignore — module JavaScript sans déclarations
import { requirePaidAiTestOptIn } from './paid-ai-test-guard.mjs';

// ---------------------------------------------------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------------------------------------------------
export const STRONG_MODEL: string = SCAN_MODEL;
export const LITE_MODEL: string = GEMINI_LITE_MODEL;
/**
 * Accord du brasseur : 5 CHF (D234), puis 20 CHF de plus (D242) = 25 CHF CUMULÉS ; le banc en garde 0,5 de marge (coût réel relu après coup,
 * tarif provisionné à 1,25 CHF/USD). Le budget d'une passe compte le déjà journalisé : c'est un plafond de cumul.
 */
export const BUDGET_CAP_CHF = 24.5;
/** Une passe ne dépense pas plus que cela (D242 : 3 CHF au plus par passe), sauf `--plafond-passe` plus bas. */
export const DEFAULT_PASS_CAP_CHF = 3;
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

export type VariantId = 'A' | 'B' | 'C' | 'Cp' | 'Cs' | 'Csv' | 'Csp' | 'Lm' | 'Lh' | 'Lp' | 'Hv' | 'Sv' | 'Uv' | 'Av' | 'Tv' | 'Csv8' | 'Avl' | 'Pv' | 'Bv' | 'Zv' | 'Csv8F';
/** Toutes les variantes connues, dans l'ordre des tableaux. */
export const VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp', 'Cs', 'Csv', 'Csp', 'Lm', 'Lh', 'Lp', 'Hv', 'Sv', 'Uv', 'Av', 'Tv', 'Csv8', 'Avl', 'Pv', 'Bv', 'Zv', 'Csv8F'];
/** Les quatre de k1 : ce que le banc lit quand `--variantes` n'est pas donné. */
export const K1_VARIANTS: readonly VariantId[] = ['A', 'B', 'C', 'Cp'];
export const VARIANT_LABEL: Record<VariantId, string> = {
  A: 'A production', B: 'B une lecture d’abord', C: 'C Flash-Lite ×2 puis 3.8', Cp: 'C′ C gardée par les contrôles',
  Cs: 'C★ la 3.8 tranche seule', Csv: 'C★v valeurs de la 3.8, statut du vote', Csp: 'C★′ C★ gardée par les contrôles', Lm: 'Lm C★v réflexion medium', Lh: 'Lh C★v réflexion high', Lp: 'Lp C★v consigne Flash-Lite',
  Hv: 'Hv C★v consigne après les images, sans température', Sv: 'Sv Hv + schéma du banc', Uv: 'Uv Sv + images ULTRA_HIGH', Av: 'Av C★v + 3.8 avec exécution de code', Tv: 'Tv Hv + tuiles',
  Csv8: 'C★v8 C★v, sortie Flash-Lite 8 192', Avl: 'Avl C★v, Flash-Lite avec exécution de code', Pv: 'Pv PDF lu page par page', Bv: 'Bv image haute lue par bandes', Zv: 'Zv C★v, la 3.8 ne relit que la zone en cause',
  Csv8F: 'Csv8F C★v8 + désignation en français (nameFr)'
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
export type Group = 'A' | 'C' | 'Lm' | 'Lh' | 'Lp' | 'Hv' | 'Sv' | 'Uv' | 'Tv' | 'Csv8' | 'Avl' | 'Pv' | 'Bv' | 'Csv8F';
/**
 * Av n'a pas de lectures 1 et 2 à lui : ce sont celles de C ; seule sa 3ᵉ lecture (3.8 avec exécution de code) lui est propre.
 * Zv non plus : ses deux lectures sont celles de C ; seule sa 3ᵉ lecture (la zone en cause) lui est propre.
 */
export const GROUP_OF: Record<VariantId, Group> = { A: 'A', B: 'A', C: 'C', Cp: 'C', Cs: 'C', Csv: 'C', Csp: 'C', Lm: 'Lm', Lh: 'Lh', Lp: 'Lp', Hv: 'Hv', Sv: 'Sv', Uv: 'Uv', Av: 'C', Tv: 'Tv', Csv8: 'Csv8', Avl: 'Avl', Pv: 'Pv', Bv: 'Bv', Zv: 'C', Csv8F: 'Csv8F' };
/** Les groupes qui lisent à leur compte deux lectures Flash-Lite puis concluent comme C★v. */
export const LITE_GROUPS = ['Lm', 'Lh', 'Lp', 'Hv', 'Sv', 'Uv', 'Tv', 'Csv8', 'Avl', 'Pv', 'Bv', 'Csv8F'] as const;
export type LiteGroup = typeof LITE_GROUPS[number];
/** Les groupes de k5 : la 3.8 est aussi appelée quand une lecture Flash-Lite manque (coupée), comme C — c'est ainsi que le repli `finalOfLite` joue. */
export const FULL_VOTE_GROUPS: ReadonlySet<string> = new Set(['Csv8', 'Avl', 'Pv', 'Bv', 'Csv8F']);
/** Pv et Bv : leurs deux lectures sont chacune la réunion de lectures partielles (une par page ou par bande), lancées ensemble. */
export const PARTIAL_GROUPS: ReadonlySet<string> = new Set(['Pv', 'Bv']);
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
  /** Csv8F : le schéma et la consigne système portent `nameFr` (la 3.8 de la variante aussi). */
  nameFr?: boolean;
}
/**
 * Csv8F : la phrase ajoutée à la consigne SYSTÈME (après celle de `name`, qui reste l'imprimé). Le contrat du champ : français, marque et nom propre
 * tels quels, ni option ni état ni unité ni explication. Les options (état du malt, supplément) et l'unité sont lues par le code, pas ici (voie f1).
 */
export const NAME_FR_NOTE = 'nameFr est la désignation de l’article en français (le document peut être en allemand, anglais, français ou italien) : traduis les mots communs, garde tels quels la marque et les noms propres (« CARABELGE® », « Styrian Goldings », « Wyeast 3787 Belgian High Gravity »), sans option, sans état du produit, sans unité ni suffixe d’unité (« , Kg »), sans explication. Une désignation déjà en français ou faite d’un seul nom propre se recopie. name reste, lui, la désignation imprimée exacte.';
/** Le schéma de production avec `nameFr` ajouté aux propriétés d'une ligne, hors de `required` (champ facultatif). La production n'est jamais modifiée. */
export function schemaWithNameFr(schema: any = TASKS.scanInvoice.schema): any {
  const clone = JSON.parse(JSON.stringify(schema));
  clone.properties.items.items.properties.nameFr = { type: 'STRING', description: 'Désignation en français, marque et nom propre gardés, sans option ni unité' };
  return clone;
}
/**
 * Lexique du banc (canon : minuscules, sans accent) : des mots d'allemand, d'anglais et d'italien que `nameFr` ne doit plus contenir, avec leur
 * équivalent français. Une seule source pour la simulation (qui « traduit » ainsi) et pour le juge (qui refuse ce qui reste). Aucun mot qui est aussi
 * du français (malt, pilsner, tank, fine, extrait) : un nom propre ou un mot déjà français n'est jamais pris pour une faute. Un indice, pas une traduction :
 * le vrai verdict est la lecture des paires par le pilote.
 */
export const LEXIQUE_FR: Readonly<Record<string, string>> = {
  und: 'et', mit: 'avec', ohne: 'sans', fur: 'pour', fuer: 'pour', von: 'de', zum: 'pour', zur: 'pour', deckel: 'couvercle', rund: 'rond', fein: 'fin', grob: 'gros', sack: 'sac',
  hopfensack: 'sac à houblon', hopfen: 'houblon', malz: 'malt', hefe: 'levure', schlauch: 'tuyau', dichtung: 'joint', flasche: 'bouteille', flaschen: 'bouteilles',
  kronkorken: 'capsules', verschluss: 'bouchon', gartank: 'fermenteur', garbehalter: 'fermenteur', liter: 'L', stuck: 'pièce',
  with: 'avec', and: 'et', without: 'sans', for: 'pour', lid: 'couvercle', round: 'rond', bag: 'sac', hops: 'houblons', hop: 'houblon', yeast: 'levure', hose: 'tuyau',
  gasket: 'joint', bottle: 'bouteille', bottles: 'bouteilles', caps: 'capsules', stopper: 'bouchon', fermenter: 'fermenteur', fermentor: 'fermenteur',
  con: 'avec', senza: 'sans', per: 'pour', di: 'de', della: 'de la', del: 'du', coperchio: 'couvercle', tondo: 'rond', sacco: 'sac', luppolo: 'houblon',
  lievito: 'levure', tubo: 'tuyau', bottiglia: 'bouteille', tappo: 'bouchon', fermentatore: 'fermenteur', malto: 'malt',
  // f5b : les mots restés en allemand dans la passe Csv8F (D279)
  zuschlag: 'supplément', verpackung: 'emballage', versand: 'expédition', weizen: 'blé', gerste: 'orge', spezial: 'spécial', hell: 'clair', dunkel: 'foncé', fass: 'fût',
  weizenmalz: 'malt de blé', gerstenmalz: 'malt d’orge', rauchmalz: 'malt fumé', roggenmalz: 'malt de seigle', hafermalz: 'malt d’avoine', rostmalz: 'malt torréfié',
  rostgerste: 'orge torréfiée', silikon: 'silicone', silikonschlauch: 'tuyau en silicone', dichtungsring: 'joint', wheat: 'blé', barley: 'orge', roasted: 'torréfié'
};
/** Un mot ramené à sa forme de comparaison : minuscules, sans accent. */
export const canonMot = (word: string): string => word.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Les mots d'une désignation (lettres et chiffres), en canon. */
export const motsDe = (text: string): string[] => canonMot(text).split(/[^a-z0-9]+/).filter(Boolean);
/** La « traduction » du banc simulé : un mot du lexique devient son équivalent, le reste (marque, nom propre) est gardé tel quel ; le suffixe d'unité imprimé (« , Kg ») tombe. */
export function fakeFrench(name: string): string {
  const kept = name.replace(/\[[^\]]*\]/g, ' ').replace(/\s+$/, '').replace(UNITE_SUFFIXE, '').replace(/[\p{L}\p{N}]+/gu, word => (OPTION_MOTS.has(canonMot(word)) ? ' ' : LEXIQUE_FR[canonMot(word)] ?? word));
  const clean = kept.replace(/\s+/g, ' ').replace(/[\s,:;]+$/, '').trim();
  // Une ligne qui EST une option (« Schrotung ») se recopie : rien d'autre à lui faire dire
  return clean || name.trim();
}
/** Le suffixe d'unité que la désignation imprimée recopie parfois (« , Kg », « , 1 Kg », « ; Stk ») : séparateur puis unité, en fin de texte. Le juge refuse qu'il survive dans `nameFr`. */
export const UNITE_SUFFIXE = /(?<!\d)\s*[,;]\s*(?:\d+(?:[.,]\d+)?\s*)?(?:kg|g|gr|gramm|gram|l|lt|liter|litre|stk|stuck|stück|st|pce|pc|pcs|pz|piece|pièce|x)\.?\s*$/i;
/** Des mots d'option ou d'état du produit (canon) : ils vivent dans `variant` et dans l'état lu par le code, pas dans `nameFr`. */
export const OPTION_MOTS: ReadonlySet<string> = new Set(['geschrotet', 'ungeschrotet', 'gemahlen', 'ungemahlen', 'schrotung', 'mischung', 'einzelprodukt', 'crushed', 'uncrushed', 'milled', 'macinato', 'concasse', 'moulu', 'mahlgrad']);
/** La phrase du banc ajoutée à la consigne 3 d'Av : zoomer avant de lire les montants. */
export const AV_NOTE = 'Tu disposes d’un outil d’exécution de code. Avant de lire les montants, zoome sur le tableau des lignes (recadre et agrandis l’image) pour lire chaque cellule ; puis réponds par le seul JSON demandé.';
/** Le réglage d'un appel. La 3ᵉ lecture est la 3.8 de production (consigne 3), quel que soit le groupe qui la demande — sauf celle d'Av. */
/** Les groupes du banc mesurés avant le 02.11 gardent le plafond de sortie de leur mesure ; la 3.8 de production suit `SCAN_MAX_OUTPUT`. */
const BANC_MAX_OUT = 5100;
export function callSpec(group: string, lecture: 1 | 2 | 3): CallSpec {
  // Csv8F : les trois lectures portent `nameFr`, et rien d'autre ne change (Flash-Lite à 8 192 jetons comme Csv8, 3.8 au plafond de production)
  if (group === 'Csv8F') return { model: lecture === 3 ? STRONG_MODEL : LITE_MODEL, prompt: INVOICE_SCAN_PROMPTS[lecture - 1], thinking: 'LOW', maxOut: lecture === 3 ? SCAN_MAX_OUTPUT : LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_MS, nameFr: true };
  if (lecture === 3 && group === 'Av') return { model: STRONG_MODEL, prompt: `${INVOICE_SCAN_PROMPTS[2]}\n\n${AV_NOTE}`, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS, codeExecution: true };
  if (lecture === 3) return { model: STRONG_MODEL, prompt: INVOICE_SCAN_PROMPTS[2], thinking: 'LOW', maxOut: SCAN_MAX_OUTPUT, timeoutMs: TIMEOUT_MS };
  const prompt = INVOICE_SCAN_PROMPTS[lecture - 1];
  switch (group) {
    case 'Hv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: BANC_MAX_OUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true };
    case 'Sv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true, svSchema: true };
    case 'Uv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true, svSchema: true, ultraHigh: true };
    case 'Tv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: BANC_MAX_OUT, timeoutMs: TIMEOUT_MS, promptAfter: true, noTemperature: true, tiles: true };
    case 'A': return { model: STRONG_MODEL, prompt, thinking: 'LOW', maxOut: BANC_MAX_OUT, timeoutMs: TIMEOUT_MS };
    case 'C': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: BANC_MAX_OUT, timeoutMs: TIMEOUT_MS };
    case 'Lm': return { model: LITE_MODEL, prompt, thinking: 'MEDIUM', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS };
    case 'Lh': return { model: LITE_MODEL, prompt, thinking: 'HIGH', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS };
    case 'Lp': return { model: LITE_MODEL, prompt: liteConsigne(lecture), thinking: 'LOW', maxOut: BANC_MAX_OUT, timeoutMs: TIMEOUT_MS };
    // k5 : Csv8 = C avec 8 192 jetons de sortie ; Avl = C avec l'outil d'exécution de code (le zoom intégré d'Av, sur Flash-Lite) ;
    // Pv et Bv = C, une lecture par page ou par bande (leur phrase de rang s'ajoute au corps, voir `partNote`).
    case 'Csv8': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_MS };
    case 'Avl': return { model: LITE_MODEL, prompt: `${prompt}\n\n${AV_NOTE}`, thinking: 'LOW', maxOut: LITE_RAISED_OUTPUT, timeoutMs: TIMEOUT_THINKING_MS, codeExecution: true };
    case 'Pv':
    case 'Bv': return { model: LITE_MODEL, prompt, thinking: 'LOW', maxOut: BANC_MAX_OUT, timeoutMs: TIMEOUT_MS };
    default: throw new Error(`Groupe inconnu : ${group}`);
  }
}

/** Zv : le réglage des deux appels de zoom (localiser, relire) : la 3.8, réflexion LOW, sortie courte. */
export const ZOOM_SPEC: CallSpec = { model: STRONG_MODEL, prompt: '', thinking: 'LOW', maxOut: ZOOM_MAX_OUT, timeoutMs: TIMEOUT_MS };
/** Bv, sans pixels (estimation) : une entrée par partie à lire — les bandes estimées d'une image haute, les autres fichiers entiers. Vide : pas de parcours. */
export function estimatedBandFiles(files: InvoiceFile[]): InvoiceFile[][] {
  const dims = files.map(file => (file.mimeType.startsWith('image/') ? imageSize(Buffer.from(file.data, 'base64')) : null));
  if (!dims.some(size => size && isTall(size.width, size.height))) return [];
  return files.flatMap((file, index) => { const size = dims[index]; return Array.from({ length: size && isTall(size.width, size.height) ? estimateBandCount(size.width, size.height) : 1 }, () => [file]); });
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
  /** Plafond de dépense de CETTE passe, en CHF (D242 : 3 par défaut en mode payant). */
  plafondPasse?: number;
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
  let plafondPasse: number | undefined;
  if (value('--plafond-passe') !== undefined || payant) {
    plafondPasse = value('--plafond-passe') === undefined ? DEFAULT_PASS_CAP_CHF : Number(value('--plafond-passe'));
    if (!(plafondPasse > 0)) throw new Error('--plafond-passe attend un montant en CHF supérieur à 0.');
  }
  const cas = value('--cas')?.split(',').map(item => item.trim()).filter(Boolean);
  return { ...(plafondPasse !== undefined ? { plafondPasse } : {}), mode: payant ? 'payant' : horsLigne ? 'hors-ligne' : 'simuler', repeat, out: value('--out'), budgetChf, docs: value('--docs')?.split(',').map(item => item.trim()).filter(Boolean),
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
  /** Pv, Bv : la phrase de rang (page ou bande k sur N), ajoutée à la fin de la consigne. */
  note?: string;
  /** Csv8F : `nameFr` au schéma (facultatif) et sa phrase à la consigne système. */
  nameFr?: boolean;
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
  const notes = [list.length > 1 && !options.tilesNote ? multiCaptureNote(list.length) : '', options.tilesNote ? TILES_NOTE : '', options.freeJson ? FREE_JSON_NOTE : '', options.note ?? ''].filter(Boolean);
  const text = notes.length ? `${prompt}\n\n${notes.join('\n\n')}` : prompt;
  const media = list.map(file => (options.ultraHigh && file.mimeType !== 'application/pdf' ? { inlineData: file, mediaResolution: { level: 'MEDIA_RESOLUTION_ULTRA_HIGH' } } : { inlineData: file }));
  const parts = options.promptAfter ? [...media, { text }] : [{ text }, ...media];
  const schema = options.svSchema ? SV_SCHEMA : options.nameFr ? schemaWithNameFr() : TASKS.scanInvoice.schema;
  const system = options.svSchema ? svSystem(TASKS.scanInvoice.system) : options.nameFr ? `${TASKS.scanInvoice.system}\n${NAME_FR_NOTE}` : TASKS.scanInvoice.system;
  return {
    systemInstruction: { parts: [{ text: system }] },
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

export interface ReadMeta {
  id: string; doc: string; tirage: number; variant: string; lecture: 1 | 2 | 3; model: string; freeJson?: boolean;
  /** Pv, Bv : cette lecture est la partie k (page ou bande) sur n d'une lecture partielle. */
  part?: { k: number; n: number };
  /** Zv : un appel de zoom (étape `loc` : la boîte ; `lec` : la relecture) pour une cellule en désaccord. */
  zoom?: { cell: string; etape: 'loc' | 'lec' };
}
/** Les lectures qui suivent le schéma du banc (Sv, Uv ; jamais leur 3ᵉ lecture, qui est celle de la production). */
export const usesSvSchema = (meta: ReadMeta) => (meta.variant === 'Sv' || meta.variant === 'Uv') && meta.lecture !== 3;
/** La façon de lire la réponse d'un appel, selon qui l'a faite : l'outil d'exécution de code mêle texte, code et résultats (Av, 3ᵉ lecture ; Avl, lectures 1 et 2). */
export const parseOptionsOf = (meta: ReadMeta, codes: boolean): ParseOptions =>
  ({ codes, sv: usesSvSchema(meta), lastTextPart: (meta.variant === 'Av' && meta.lecture === 3) || (meta.variant === 'Avl' && meta.lecture !== 3), validate: !!meta.freeJson });
export interface Reading {
  meta: ReadMeta; ok: boolean; ms: number; normalized?: InvoiceScanResult; cause: CauseCoupure | null; error?: string;
  finishReason: string | null; inputTokens: number | null; outputTokens: number | null; costMicroChf: number | null; state: string;
  /** Lignes que la lecture a écrites au-delà du plafond de la production (35) : la normalisation les écarte. */
  overCap?: number;
  /** La réponse brute, gardée en mémoire pour relire la même lecture avec N ; jamais écrite dans results.json. */
  raw?: any;
  /** Appel prêté par une sortie précédente (`--reprendre`) : ni payé ni journalisé dans cette passe. */
  lent?: boolean;
  /** Appels réels que cette lecture réunit (Pv, Bv : une par partie ; zoom : localiser + relire de chaque cellule) ; absent = un seul. */
  calls?: number;
  /** Csv8F : le `nameFr` de chaque ligne de `normalized.items` (même rang ; « » si la lecture n'en a pas écrit). Absent pour toute autre variante. */
  namesFr?: string[];
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
    // Csv8F : `normalizeInvoiceScan` ne connaît pas `nameFr` (la production non plus) ; le banc le garde à côté, au même rang que les lignes normalisées.
    const frs = decoded.items.slice(0, SCAN_MAX_ITEMS).map((line: any) => (typeof line?.nameFr === 'string' ? line.nameFr.replace(/\s+/g, ' ').trim().slice(0, 200) : ''));
    return { ...base, ok: true, normalized: normalizeInvoiceScan(decoded), overCap: Math.max(0, decoded.items.length - SCAN_MAX_ITEMS), cause: null, state: 'STOP',
      ...(meta.variant === 'Csv8F' ? { namesFr: frs } : {}) };
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

/** Un appel de zoom (Zv) : ni une lecture de facture ni un schéma de production ; `raw` garde la réponse, `ok` dit seulement qu'elle est terminée (STOP). */
export function readingOfRaw(meta: ReadMeta, response: any, ms: number, costMicroChf: number | null): Reading {
  const finishReason: string | null = response?.candidates?.[0]?.finishReason ?? null, tokens = tokensOf(response), ok = finishReason === 'STOP';
  return { meta, ms, finishReason, inputTokens: tokens.input, outputTokens: tokens.output, costMicroChf, raw: response, ok, cause: ok ? null : 'sortie',
    state: ok ? 'STOP' : finishReason ? `coupée (${finishReason})` : 'illisible', ...(ok ? {} : { error: 'Réponse de zoom non terminée.' }) };
}

/** Une réponse synthétique au format de Gemini qui porte un objet déjà décodé : les lectures recollées (Pv, Bv) et le zoom (Zv) repassent ainsi par la même lecture et par N. */
export function syntheticResponse(decoded: unknown, usage: { input: number | null; output: number | null }): any {
  const input = usage.input ?? 0, output = usage.output ?? 0;
  return { modelVersion: 'banc-recollage', candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: JSON.stringify(decoded) }] } }],
    usageMetadata: { promptTokenCount: input, candidatesTokenCount: output, thoughtsTokenCount: 0, totalTokenCount: input + output } };
}

/** Somme de coûts dont l'un peut être inconnu : un coût inconnu rend la somme inconnue (jamais zéro). */
const sumCost = (values: Array<number | null>): number | null => (values.some(value => value === null) ? null : values.reduce((sum: number, value) => sum + (value ?? 0), 0));
const sumTokens = (values: Array<number | null>): number | null => (values.every(value => value === null) ? null : values.reduce((sum: number, value) => sum + (value ?? 0), 0));

/**
 * Pv, Bv : les lectures partielles d'une même passe (une par page ou par bande, lancées ensemble) en UNE lecture. Durée = la plus longue
 * (appels parallèles comptés une fois) ; coût et jetons = sommes. Toutes les parties exploitables : leur recollage (`mergeDecoded`) est relu
 * comme une lecture ordinaire. UNE partie coupée ou manquante : la lecture entière est inexploitable (un document sans une de ses pages
 * ne se vote pas), sa cause est celle de la première partie en défaut, la coupure par la sortie l'emportant sur le délai.
 */
export function mergeReadings(parts: Reading[], meta: ReadMeta, options: { dedupe: boolean }, codes = false): Reading {
  const ms = Math.max(0, ...parts.map(part => part.ms)), costMicroChf = sumCost(parts.map(part => part.costMicroChf));
  const inputTokens = sumTokens(parts.map(part => part.inputTokens)), outputTokens = sumTokens(parts.map(part => part.outputTokens));
  const lent = parts.length > 0 && parts.every(part => part.lent);
  const bad = parts.filter(part => !part.ok || !part.raw);
  if (!parts.length || bad.length) {
    const cut = bad.find(part => part.cause === 'sortie') ?? bad.find(part => part.cause !== null) ?? bad[0];
    return { meta, ok: false, ms, cause: cut?.cause ?? null, error: `${bad.length} partie(s) sur ${parts.length} sans lecture exploitable`, finishReason: cut?.finishReason ?? null,
      inputTokens, outputTokens, costMicroChf, state: cut?.state ?? 'illisible', calls: parts.length, ...(lent ? { lent: true } : {}) };
  }
  const decoded = mergeDecoded(parts.map(part => parseReadResponse(part.raw, parseOptionsOf(part.meta, false))), options);
  const merged = readingFromResponse(meta, syntheticResponse(decoded, { input: inputTokens, output: outputTokens }), ms, costMicroChf, codes);
  return { ...merged, calls: parts.length, ...(lent ? { lent: true } : {}) };
}

/**
 * Zv : les lectures d'un zoom (localiser, relire), groupées par cellule. Les cellules se traitent en parallèle, chacune en deux temps successifs :
 * durée = la plus longue cellule (la somme de ses appels), coût et jetons = sommes, appels = leur nombre.
 */
export function foldZoom(perCell: Reading[][]): { ms: number; costMicroChf: number | null; inputTokens: number | null; outputTokens: number | null; calls: number; lent: boolean } {
  const all = perCell.flat();
  return { ms: Math.max(0, ...perCell.map(reads => reads.reduce((sum, read) => sum + read.ms, 0))), costMicroChf: sumCost(all.map(read => read.costMicroChf)),
    inputTokens: sumTokens(all.map(read => read.inputTokens)), outputTokens: sumTokens(all.map(read => read.outputTokens)), calls: all.length, lent: all.length > 0 && all.every(read => read.lent) };
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
// ---------------------------------------------------------------------------------------------------------------------
// Voie k6-diagnostic (01.11) : QUELS CHAMPS des deux lectures divergent, et lesquels appellent la 3.8 (D261c : « 27 s pour une facture simple »).
// Un relevé de champs, jamais de valeurs : ni nom d'article ni montant. Il ne change ni `needsThird` ni le jugement ; il le rend lisible.
// Les règles du déclencheur sont celles de `reconcileInvoiceVision` (functions/src/invoiceVisionReview.ts : `triggered`, `controlTriggered`) ;
// `tests/unit/depense/banc-k6/troisieme-d261c.test.ts` vérifie que `declenche` coïncide avec `needsCorrection` sur le jeu de 20 paires.
// ---------------------------------------------------------------------------------------------------------------------
export interface Divergence {
  /** La cellule : `category`, `items.3.kind`, `items` (lignes sans vis-à-vis)… */
  champ: string; ligne: number | null; code: string; lectures: number[]; pese: boolean;
  /** Ce point appelle la 3.8 à lui seul (il suffirait ; d'autres peuvent la demander aussi). */
  declenche: boolean;
}
const TRIGGER_ITEM_FIELDS = new Set(['quantity', 'unit', 'amountTTC', 'kind', 'reference']);
const NO_TRIGGER_HEADER = new Set(['tvaAmount', 'tvaRate', 'vat']);
const MONEY_FIELDS = new Set(['quantity', 'price', 'amountTTC']);
const flat = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
const withinOneEdit = (a: string, b: string): boolean => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
};
/** Une coquille ou les mêmes mots dans un autre ordre (la règle de `sameName` de la production). */
const sameNameAs = (a: string, b: string): boolean => {
  const x = flat(a), y = flat(b), words = (s: string) => s.split(/[^a-z0-9]+/).filter(Boolean).sort().join(' ');
  return withinOneEdit(x, y) || words(x) === words(y);
};
export function releveDivergences(r1: InvoiceScanResult, r2: InvoiceScanResult): Divergence[] {
  const points = reconcileInvoiceVision([r1, r2]).result.points as any[];
  const out: Divergence[] = [], moneyCells = new Set<string>();
  for (const p of points) {
    if (p.code === 'ambiguite-ligne') { out.push({ champ: `items.${p.ligne}.ambiguity`, ligne: p.ligne ?? null, code: p.code, lectures: [], pese: !!p.pese, declenche: true }); continue; }
    if (p.source !== 'désaccord') continue;
    const champ: string = p.champs?.[0] ?? String(p.champ), field = champ.split('.').pop()!, ligne: number | null = p.ligne ?? null;
    const lectures = (p.valeurs ?? []).map((v: any) => v.lecture);
    if (p.code === 'lignes-non-rapprochees') { out.push({ champ: 'items', ligne: null, code: p.code, lectures, pese: !!p.pese, declenche: true }); continue; }
    if (MONEY_FIELDS.has(field) && champ !== 'items') moneyCells.add(champ);
    let declenche = false;
    if (p.pese) {
      if (ligne === null) declenche = champ !== 'items' && !NO_TRIGGER_HEADER.has(field);
      else if (field === 'name') { const [a, b] = (p.valeurs ?? []).map((v: any) => String(v.valeur ?? '')); declenche = !sameNameAs(a ?? '', b ?? ''); }
      else declenche = TRIGGER_ITEM_FIELDS.has(field);
    }
    out.push({ champ, ligne, code: p.code, lectures, pese: !!p.pese, declenche });
  }
  // Un écart de ligne ou de somme dont une cellule en cause diverge appelle aussi la 3.8 (`controlTriggered`).
  for (const p of points) {
    if ((p.code === 'ligne-montant' || p.code === 'somme-ecart') && (p.champs as string[]).some(c => moneyCells.has(c)))
      out.push({ champ: p.code === 'somme-ecart' ? 'amountTTC' : `items.${p.ligne}`, ligne: p.ligne ?? null, code: p.code, lectures: [], pese: !!p.pese, declenche: true });
  }
  return out;
}
/** Le résumé en une ligne du relevé (« kind×7, name×2, items »), pour le journal du banc : champs seulement. */
export const texteDivergences = (list: readonly Divergence[]): string => {
  const par = new Map<string, number>();
  for (const d of list) { const cle = `${d.declenche ? '!' : ''}${d.champ.replace(/^items\.\d+\./, '')}`; par.set(cle, (par.get(cle) ?? 0) + 1); }
  return [...par].map(([cle, n]) => (n > 1 ? `${cle}×${n}` : cle)).join(', ') || 'aucune';
};
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
  // D272b : les phrases du vote sans ses contrôles de calcul, comme la production (`phrasesDuVote`).
  const result = { ...star.result, ...phrasesDuVote(vote.result, star.result), points: [...star.result.points, ...disagreements] };
  // LT-2, comme la production (`dateDuVoteEtoile`) : avant le 09.11 le banc ne l'appliquait pas (doc21 : faux « corrigé » 07.11.2025 au banc m9).
  dateDuVoteEtoile(result, [r1.normalized, r2.normalized, third.normalized]);
  return { ...star, result };
}

/** C★′ : comme C★, et un contrôle arithmétique en échec sur les deux lectures appelle aussi la 3.8, qui tranche seule. */
export const finalOfStarPrime = (r1: Reading, r2: Reading, third?: Reading): Final => finalOfStar(r1, r2, third, arithmeticFailsOnTwo(r1, r2));

/**
 * Csv8F : rattache `nameFr` aux lignes du résultat final. Pour chaque ligne, la première lecture de `sources` (la 3.8 si elle a tranché, puis les Flash-Lite)
 * qui a une ligne de même `name` et un `nameFr` non vide le donne ; une ligne de même rang est préférée, une même désignation ne sert qu'une fois par lecture.
 * Aucun `nameFr` n'est inventé : une ligne sans lecture qui le porte reste sans (le juge la compte « absente »). Le résultat de départ n'est pas modifié.
 */
export function withNamesFr(result: any, sources: ReadonlyArray<Reading | undefined>): any {
  if (!result || !Array.isArray(result.items)) return result;
  const lists = sources.filter((read): read is Reading => !!read?.namesFr && !!read.normalized);
  if (!lists.length) return result;
  const used = lists.map(() => new Set<number>());
  const items = result.items.map((line: any, rank: number) => {
    for (let s = 0; s < lists.length; s++) {
      const lines = lists[s].normalized!.items;
      const at = lines[rank]?.name === line.name && !used[s].has(rank) ? rank : lines.findIndex((other, k) => other.name === line.name && !used[s].has(k));
      if (at < 0) continue;
      used[s].add(at);
      const fr = lists[s].namesFr![at];
      if (fr) return { ...line, nameFr: fr };
    }
    return line;
  });
  return { ...result, items };
}

// ---------------------------------------------------------------------------------------------------------------------
// Toutes les variantes d'un parcours, déduites des lectures (pur : la boucle du banc, le hors-ligne et N passent par ici)
// ---------------------------------------------------------------------------------------------------------------------
export type ThirdFrom = 'A' | 'neuf' | 'k1' | 'C' | 'zoom';
export interface DrawReads {
  a1?: Reading; a2?: Reading; a3?: Reading;
  l1?: Reading; l2?: Reading; cThird?: Reading; cpThird?: Reading;
  /** Av : la 3.8 avec exécution de code, propre à Av (jamais partagée). */
  avThird?: Reading;
  /**
   * Zv : la 3ᵉ lecture. Le zoom : une lecture synthétique (la première lecture Flash-Lite avec les cellules en cause relues par la 3.8,
   * durée = la plus longue paire localiser + relire, coût = somme), ou, au repli, la 3.8 complète partagée.
   */
  zvThird?: Reading;
  /** Zv : les appels de zoom payés puis perdus (boîte absente, relecture illisible, outil absent) avant le repli : leur durée et leur coût comptent. */
  zvWasted?: Reading;
  lite: Partial<Record<LiteGroup, { r1: Reading; r2: Reading; third?: Reading }>>;
}
export interface Derived { final: Final; thirdFrom?: ThirdFrom }
const thirdFromOf = (third?: Reading): ThirdFrom | undefined => (!third ? undefined : third.meta.id === ZOOM_ID ? 'zoom' : third.meta.variant === 'A' ? 'A' : third.lent ? 'k1' : 'neuf');
/** L'id de la lecture synthétique d'un zoom : jamais une 3.8 complète, jamais prêtée. */
export const ZOOM_ID = 'Zv-zoom';

export function mapReads(reads: DrawReads, f: (read: Reading) => Reading): DrawReads {
  const m = (read?: Reading) => (read ? f(read) : undefined);
  const lite: DrawReads['lite'] = {};
  for (const group of LITE_GROUPS) { const entry = reads.lite[group]; if (entry) lite[group] = { r1: f(entry.r1), r2: f(entry.r2), third: m(entry.third) }; }
  return { a1: m(reads.a1), a2: m(reads.a2), a3: m(reads.a3), l1: m(reads.l1), l2: m(reads.l2), cThird: m(reads.cThird), cpThird: m(reads.cpThird), avThird: m(reads.avThird),
    zvThird: m(reads.zvThird), zvWasted: reads.zvWasted, lite };
}

/** Zv : les appels de zoom perdus avant le repli s'ajoutent à la durée (le repli vient après eux) et au coût, comme un appel de plus. */
export function addWasted(final: Final, wasted?: Reading): Final {
  if (!wasted) return final;
  return { ...final, used: [...final.used, wasted], ms: final.ms + wasted.ms, costMicroChf: final.costMicroChf + (wasted.costMicroChf ?? 0), costUnknown: final.costUnknown + (wasted.costMicroChf === null ? 1 : 0) };
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
    // Zv : les deux lectures de C, puis (désaccord) la zone en cause relue par la 3.8, ou au repli la 3.8 complète ; les appels de zoom perdus comptent
    if (want.has('Zv')) {
      const final = finalOfStarVote(l1, l2, reads.zvThird);
      out.Zv = { final: final.used.length >= 3 ? addWasted(final, reads.zvWasted) : final, ...(reads.zvThird ? { thirdFrom: thirdFromOf(reads.zvThird) } : {}) };
    }
  }
  // Lm, Lh, Lp, Hv, Sv, Uv, Tv = C★v : la divergence seule appelle la 3.8, qui tranche les valeurs ; le statut du vote est gardé
  for (const group of LITE_GROUPS) {
    const entry = reads.lite[group];
    if (!entry || !want.has(group)) continue;
    const final = finalOfStarVote(entry.r1, entry.r2, entry.third);
    // Csv8F : `nameFr` rejoint le résultat final, pris de la 3.8 si elle a tranché, sinon des Flash-Lite (jamais ailleurs que dans le banc)
    const sources = final.used.length >= 3 ? [entry.third, entry.r1, entry.r2] : [entry.r1, entry.r2];
    out[group] = { final: group === 'Csv8F' ? { ...final, result: withNamesFr(final.result, sources) } : final, ...(entry.third ? { thirdFrom: thirdFromOf(entry.third) } : {}) };
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
  /** Ce qui était déjà dépensé au début de la passe : le plafond de passe ne compte que ce que cette passe dépense. */
  readonly startMicro: number;
  /** `passCapMicro` : le plafond de CETTE passe (D242 : 3 CHF au plus) ; indéfini = aucun (simulation). */
  constructor(readonly limitMicro: number, public spentMicro = 0, readonly passCapMicro?: number) { this.startMicro = spentMicro; }
  /** Ce que la passe a dépensé, réserves comprises. */
  passMicro(): number { return this.spentMicro - this.startMicro + this.reserved; }
  reserve(micro: number): number {
    if (this.spentMicro + this.reserved + micro > this.limitMicro)
      throw new BudgetStop(`Budget atteint : ${(this.spentMicro / 1e6).toFixed(4)} CHF dépensés, ${(this.reserved / 1e6).toFixed(4)} CHF réservés, cet appel en réserverait ${(micro / 1e6).toFixed(4)} sur ${(this.limitMicro / 1e6).toFixed(2)} CHF. Arrêt net.`);
    if (this.passCapMicro !== undefined && this.passMicro() + micro > this.passCapMicro)
      throw new BudgetStop(`Plafond de passe atteint : ${((this.spentMicro - this.startMicro) / 1e6).toFixed(4)} CHF dépensés par cette passe, ${(this.reserved / 1e6).toFixed(4)} CHF réservés, cet appel en réserverait ${(micro / 1e6).toFixed(4)} sur ${(this.passCapMicro / 1e6).toFixed(2)} CHF. Arrêt net avant le dépassement.`);
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
  appendFileSync(file, `| ${new Date().toISOString().slice(0, 19).replace('T', ' ')} | ${m.doc} | ${m.tirage} | ${m.variant === 'Cp' ? 'C′' : m.variant}${m.part ? ` p${m.part.k}/${m.part.n}` : ''}${m.zoom ? ` ${m.zoom.etape}` : ''} | ${m.lecture} | ${m.model} | ${read.ms} ms | ${read.inputTokens ?? '?'} | ${read.outputTokens ?? '?'} | ${chf6(chargedMicro ?? 0)} | ${chf6(cumulMicro)} | ${read.state}${unknown ? ' (coût inconnu : réserve comptée)' : ''}${simulated ? ' (SIMULÉ)' : ''} |\n`);
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
export type Family = 'f1' | 'f2' | 'l1' | 'l2' | 's3' | 'm1' | 'm2' | 'h1' | 'h2' | 'p1' | 'p2' | 'v1' | 'v2' | 'w1' | 'w2' | 'u1' | 'u2' | 't1' | 't2'
  | 'e1' | 'e2' | 'g1' | 'g2' | 'q1' | 'q2' | 'b1' | 'b2' | 'zl' | 'zr' | 'n1' | 'n2' | 'n3';
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
  { id: 'total-diverge-schema', doc: 'doc3', tirage: 3, families: ['w2'], edits: [{ path: 'amountTTC', delta: 5 }], note: 'une lecture au schéma du banc lit un autre total : la 3.8 tranche, le vote garde « disputed »' },
  // k5 : les gestes de vision (sortie relevée, exécution de code, pages, bandes, zoom ciblé)
  { id: 'unite-x-k5', doc: 'doc9', tirage: 1, families: ['e1', 'e2', 'g1', 'g2', 'q1', 'q2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux lectures de Csv8, Avl et Pv inventent l’unité « x » (faux vert : la 3.8 n’est pas appelée)' },
  // k7 (08.11) : BANC SIMULE ECHEC — la simulation ne produisait plus aucun faux vert. Cause : les vérités des pièces (dates non imprimées, lignes sans prix, totaux avec port)
  // fabriquent des réponses « propres » que la production déclare déjà à confirmer (`date-absente`, `somme-ecart`, `somme-incomplete`) : 13 pièces sur 14 sont `disputed` sans faute,
  // et les fautes des autres variantes tombent sur ces pièces déjà en alerte (doc9, doc5). Seule doc13 reste « vérifiée » à l'état propre. Cette faute y glisse une date fausse
  // MAIS plausible, la même dans les deux lectures : aucun contrôle de la production ne peut la voir (elle ne vérifie que l'absence ou la forme d'une date, jamais sa valeur).
  { id: 'date-plausible-propre', doc: 'doc13', tirage: 1, families: ['f1', 'f2', 'l1', 'l2', 'm1', 'm2', 'h1', 'h2', 'p1', 'p2', 'v1', 'v2', 'w1', 'w2', 'u1', 'u2', 't1', 't2', 'e1', 'e2', 'g1', 'g2', 'q1', 'q2', 'b1', 'b2'], edits: [{ path: 'date', value: '14.03.2026' }], note: 'les deux lectures de chaque variante lisent la même date plausible mais fausse sur une pièce par ailleurs « vérifiée » (faux vert que nul contrôle ne voit)' },
  { id: 'unite-x-bandes', doc: 'doc5', tirage: 3, families: ['b1', 'b2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux lectures par bandes inventent l’unité « x » sur chaque bande (faux vert en Bv)' },
  { id: 'coupure-sortie-relevee', doc: 'doc8', tirage: 1, families: ['e1'], edits: [], cut: true, note: 'une lecture à 8 192 jetons est coupée : la 3.8 est appelée (repli de finalOfLite)' },
  { id: 'coupure-page', doc: 'doc8', tirage: 2, families: ['q2'], edits: [], cut: true, note: 'les pages de la lecture 2 de Pv sont coupées : une page manquante rend la lecture entière inexploitable' },
  { id: 'total-diverge-zoom', doc: 'doc2', tirage: 1, families: ['l2'], edits: [{ path: 'amountTTC', delta: 3 }], note: 'les deux Flash-Lite divergent sur le seul total : Zv localise la zone et ne relit que ce champ' },
  { id: 'date-diverge-zoom', doc: 'doc4', tirage: 1, families: ['l1'], edits: [{ path: 'date', value: '01.01.2000' }], note: 'les deux Flash-Lite divergent sur la seule date : Zv zoome' },
  { id: 'ligne-diverge-zoom', doc: 'doc6', tirage: 3, families: ['l1'], edits: [{ path: 'items.0.amountTTC', delta: 2 }], note: 'les deux Flash-Lite divergent sur le seul montant de la première ligne : Zv zoome' },
  { id: 'total-diverge-sans-boite', doc: 'doc2', tirage: 2, families: ['l2'], edits: [{ path: 'amountTTC', delta: 4 }], note: 'divergence sur le total, et la 3.8 ne rend aucune boîte (réponse coupée) : Zv se replie sur la 3ᵉ lecture complète' },
  { id: 'zoom-sans-boite', doc: 'doc2', tirage: 2, families: ['zl'], edits: [], cut: true, note: 'la localisation du zoom est coupée : aucune boîte' },
  // f5 : Csv8F (désignation en français). Une faute de champ ordinaire (faux vert), puis quatre fautes de `nameFr` que seul le juge des noms voit
  { id: 'unite-x-noms-fr', doc: 'doc13', tirage: 1, families: ['n1', 'n2'], edits: [{ path: 'items.*.unit', value: 'x' }], note: 'les deux lectures de Csv8F inventent l’unité « x » (faux vert : la 3.8 n’est pas appelée)' },
  { id: 'lite-divergent-noms-fr', doc: 'doc1', tirage: 1, families: ['n2'], edits: [{ path: 'items.2.quantity', value: 7 }], note: 'une lecture de Csv8F diverge : sa 3.8 (avec nameFr) tranche' },
  { id: 'nom-fr-non-traduit', doc: 'doc5', tirage: 1, families: ['n1', 'n2', 'n3'], edits: [{ path: 'items.0.nameFr', value: 'Gärtank mit Deckel' }], note: 'nameFr resté en allemand' },
  { id: 'nom-fr-suffixe-unite', doc: 'doc6', tirage: 1, families: ['n1', 'n2', 'n3'], edits: [{ path: 'items.1.nameFr', value: 'Capsules, Stk' }], note: 'nameFr qui garde le suffixe d’unité' },
  { id: 'nom-fr-option', doc: 'doc4', tirage: 1, families: ['n1', 'n2', 'n3'], edits: [{ path: 'items.0.nameFr', value: 'Malt concassé [+CHF 0.10]' }], note: 'nameFr qui porte une option et un supplément' },
  { id: 'nom-fr-absent', doc: 'doc2', tirage: 1, families: ['n1', 'n2', 'n3'], edits: [{ path: 'items.0.nameFr', value: '' }], note: 'nameFr absent sur une ligne' }
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

const LITE_FAMILY: Record<string, string> = { Lm: 'm', Lh: 'h', Lp: 'p', Hv: 'v', Sv: 'w', Uv: 'u', Tv: 't', Csv8: 'e', Avl: 'g', Pv: 'q', Bv: 'b', Csv8F: 'n' };
export const familyOf = (meta: ReadMeta): Family => meta.zoom ? (meta.zoom.etape === 'loc' ? 'zl' : 'zr') : meta.lecture === 3 ? (meta.variant === 'Csv8F' ? 'n3' : 's3')
  : meta.model === LITE_MODEL ? (LITE_FAMILY[meta.variant] ? `${LITE_FAMILY[meta.variant]}${meta.lecture}` : meta.lecture === 1 ? 'l1' : 'l2') as Family
  : (meta.lecture === 1 ? 'f1' : 'f2');

/** Réflexion simulée (jetons de réflexion) par groupe : la vraie mesure vient du mode payant. */
const SIM_THOUGHTS: Record<string, number> = { Lm: 450, Lh: 1500 };

/** Réponse fabriquée d'un appel : déterministe (document, tirage, famille) ; une 3ᵉ lecture est la même pour A, C et C′. */
export function simulateResponse(c: BenchCase, meta: ReadMeta, plan: Fault[], log: AppliedFault[]): { json: any; ms: number } {
  const family = familyOf(meta), seed = hashOf(`${c.id}|${meta.tirage}|${family}${meta.part ? `|p${meta.part.k}` : ''}`);
  const raw = truthToRaw(c);
  // Csv8F : chaque ligne répond aussi `nameFr` (la « traduction » du lexique du banc) ; les fautes fabriquées la défont ensuite
  if (meta.variant === 'Csv8F') for (const line of raw.items) line.nameFr = fakeFrench(String(line.name ?? ''));
  if (meta.zoom) return simulateZoom(c, meta, plan, seed, raw);
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
  // Pv, Bv : la partie k sur n ne rend que ses lignes (et, pour une bande, la dernière ligne de la précédente : le recouvrement)
  const shown = meta.part ? slicePart(raw, meta.part, meta.variant === 'Bv') : raw;
  // Sv et Uv répondent au schéma du banc ; la lecture les reconvertit (le banc éprouve ainsi le convertisseur de bout en bout)
  const text = JSON.stringify(usesSvSchema(meta) ? productionToSv(shown) : shown), outputTokens = Math.round(text.length / 3.2);
  const inputTokens = 1900 + (seed % 140);
  const strong = meta.model !== LITE_MODEL;
  const thoughts = meta.lecture === 3 ? 0 : SIM_THOUGHTS[meta.variant] ?? 0, ceiling = callSpec(meta.variant, meta.lecture).maxOut;
  const json = {
    modelVersion: meta.model,
    candidates: [{ finishReason: cut ? 'MAX_TOKENS' : 'STOP', content: { role: 'model', parts: (meta.variant === 'Av' && meta.lecture === 3) || (meta.variant === 'Avl' && meta.lecture !== 3)
      // l'outil d'exécution de code : un commentaire, le code, son résultat, puis le JSON (seule la dernière part texte se lit)
      ? [{ text: 'Je zoome sur le tableau des lignes.' }, { executableCode: { language: 'PYTHON', code: 'crop()' } }, { codeExecutionResult: { outcome: 'OUTCOME_OK', output: 'ok' } }, { text }]
      : [{ text: cut ? text.slice(0, Math.floor(text.length / 2)) : text }] } }],
    usageMetadata: { promptTokenCount: inputTokens, candidatesTokenCount: cut ? ceiling - thoughts : outputTokens, thoughtsTokenCount: thoughts,
      totalTokenCount: inputTokens + (cut ? ceiling : outputTokens + thoughts) }
  };
  return { json, ms: (strong ? 7000 : 2500) + (seed % 2600) + Math.round((outputTokens + thoughts) * (strong ? 1.1 : 0.4)) };
}

/** Pv, Bv simulés : la partie k sur n d'une lecture. En-tête sur la première, totaux et paiement sur la dernière ; les autres champs restent vides ou null. */
export function slicePart(raw: any, part: { k: number; n: number }, overlap: boolean): any {
  const items: any[] = raw.items ?? [], from = Math.floor((part.k - 1) * items.length / part.n), to = Math.floor(part.k * items.length / part.n);
  const mine = items.slice(from, to), shown = overlap && part.k > 1 && from > 0 ? [items[from - 1], ...mine] : mine;
  const first = part.k === 1, last = part.k === part.n;
  return { ...raw, items: shown, printedLineCount: shown.length,
    vendor: first ? raw.vendor : '', date: first ? raw.date : '', currency: first ? raw.currency : '', invoiceNumber: first ? raw.invoiceNumber : '', orderNumber: first ? raw.orderNumber : '',
    amountHT: last ? raw.amountHT : null, tvaAmount: last ? raw.tvaAmount : null, amountTTC: last ? raw.amountTTC : null, tvaRate: last ? raw.tvaRate : null, vat: last ? raw.vat : [],
    paymentEvidence: last ? raw.paymentEvidence : 'unknown' };
}

/** Une cellule de la vérité telle que la relirait le zoom (texte) : `amountTTC`, `date`, `invoiceNumber`, `items.<rang>.amountTTC` (rang à partir de 1). */
export function truthCell(raw: any, cell: string): string {
  const line = /^items\.(\d+)\.amountTTC$/.exec(cell);
  const value = line ? raw.items?.[Number(line[1]) - 1]?.amountTTC : raw[cell];
  return typeof value === 'number' ? value.toFixed(2) : String(value ?? '');
}

/** Zv simulé : la localisation rend une boîte (ou une réponse coupée si la faute l'ordonne), la relecture rend la cellule de la vérité. */
function simulateZoom(c: BenchCase, meta: ReadMeta, plan: Fault[], seed: number, raw: any): { json: any; ms: number } {
  const family = familyOf(meta);
  const cut = plan.some(item => item.doc === c.id && item.tirage === meta.tirage && item.families.includes(family) && item.cut);
  const answer = meta.zoom!.etape === 'loc' ? { found: true, image: 1, box_2d: [300, 100, 340, 900] } : { value: truthCell(raw, meta.zoom!.cell) };
  const text = JSON.stringify(answer), output = Math.round(text.length / 3.2), input = 2500 + (seed % 140);
  return { json: { modelVersion: meta.model, candidates: [{ finishReason: cut ? 'MAX_TOKENS' : 'STOP', content: { role: 'model', parts: [{ text: cut ? text.slice(0, 6) : text }] } }],
    usageMetadata: { promptTokenCount: input, candidatesTokenCount: cut ? ZOOM_MAX_OUT : output, thoughtsTokenCount: 0, totalTokenCount: input + (cut ? ZOOM_MAX_OUT : output) } },
  ms: 3500 + (seed % 1500) + (meta.zoom!.etape === 'loc' ? 1500 : 0) };
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
  /** Bv : coupe les images hautes en bandes (sinon jimp ; en simulation et hors ligne, rien n'est coupé : les dimensions viennent des en-têtes). */
  bander?: Bander;
  /** Zv : recadre la zone en cause (sinon jimp, et pdf.js pour un PDF ; en simulation et hors ligne, l'image telle quelle). */
  cropper?: Cropper;
}
/** Pv : le nombre de pages d'un cas fait d'un seul PDF de 2 pages ou plus ; sinon 0 (la variante n'a pas de parcours sur ce cas). */
export function pdfPartCount(files: InvoiceFile[]): number {
  return files.length === 1 && files[0].mimeType === 'application/pdf' ? (pdfPages(files[0]) >= 2 ? pdfPages(files[0]) : 0) : 0;
}
/** Les deux tuiles qui se recouvrent d'une image : 60 % du haut, 60 % du bas, pleine résolution. */
export type Tiler = (file: InvoiceFile, caseId: string) => Promise<[InvoiceFile, InvoiceFile]>;
/** Les tuiles d'un cas se font pour une image seule (ni PDF ni plusieurs captures). */
export const isTileable = (files: InvoiceFile[]) => files.length === 1 && files[0].mimeType !== 'application/pdf';
export const TILE_SHARE = 0.6;
export interface VariantRecord { capLost?: number; ids: string[]; calls: number; ms: number; costMicroChf: number; costUnknown: number; result: any | null; failure?: string; thirdFrom?: ThirdFrom }
/** `variants` : les ids de variante lus (`Cs`, `Lm`…) et leurs versions N (`Cs+N`). */
export interface DrawRecord {
  doc: string; tirage: number; readings: Array<Omit<Reading, 'normalized' | 'raw'>>; variants: Record<string, VariantRecord>;
  /** k6 : par paire de lectures (`A` : deux 3.8 ; `C` : deux Flash-Lite ; un groupe lite : `Lm`…), les champs qui divergent (jamais de valeurs). */
  divergences?: Record<string, Divergence[]>;
}
/** Le relevé des divergences de chaque paire de lectures exploitables d'un tirage. */
export function divergencesDe(reads: DrawReads): Record<string, Divergence[]> {
  const pairs: Array<[string, Reading | undefined, Reading | undefined]> = [['A', reads.a1, reads.a2], ['C', reads.l1, reads.l2], ...LITE_GROUPS.map(group => [group, reads.lite[group]?.r1, reads.lite[group]?.r2] as [string, Reading | undefined, Reading | undefined])];
  const out: Record<string, Divergence[]> = {};
  for (const [name, a, b] of pairs) if (a?.normalized && b?.normalized) out[name] = releveDivergences(a.normalized, b.normalized);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Prêt d'appels : une sortie précédente (k1) dont les lectures déjà payées sont rendues telles quelles
// ---------------------------------------------------------------------------------------------------------------------
export interface Loan { json: any; ms: number; costMicroChf: number | null; id: string }
/** Renvoie la première lecture prêtée parmi `ids` pour ce document et ce tirage. */
export type Lender = (doc: string, tirage: number, ids: readonly string[]) => Loan | undefined;
/** Les ids sous lesquels une 3ᵉ lecture 3.8 (consigne 3) a pu être faite : A3, C3, C′3, et celles de k2. */
export const THIRD_IDS: readonly string[] = ['A3', 'C3', 'Cp3', 'Lm3', 'Lh3', 'Lp3', 'Hv3', 'Sv3', 'Uv3', 'Tv3', 'Csv83', 'Avl3', 'Pv3', 'Bv3'];
/** Une sortie précédente, ou plusieurs (séparées par une virgule, la première qui a la lecture la prête) : le hors ligne de k5 rejoue les passes de k4. */
export const reprendreDirs = (reprendre: string): string[] => reprendre.split(',').map(item => item.trim()).filter(Boolean).map(item => path.resolve(item));
export function loadLender(dirs: string | string[]): Lender {
  const loans = new Map<string, Loan>();
  for (const dir of Array.isArray(dirs) ? dirs : reprendreDirs(dirs)) {
    const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] };
    for (const record of file.records) {
      for (const read of record.readings) {
        const key = `${record.doc}|${record.tirage}|${read.meta.id}`, raw = path.join(dir, 'raw', `${record.doc}-t${record.tirage}-${read.meta.id}.json`);
        if (loans.has(key) || !existsSync(raw)) continue;
        loans.set(key, { json: JSON.parse(readFileSync(raw, 'utf8')), ms: read.ms, costMicroChf: read.costMicroChf, id: read.meta.id });
      }
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
    // k7 : une photo de plus de 4 Mo est envoyée allégée comme l'app le fait (`preparerAllegement`, banc-lecture-alleger.ts) ; sinon le fichier tel quel.
    return validateInvoiceFile(ALLEGEES.get(full) ?? { mimeType, data: readFileSync(full).toString('base64') });
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
export function thirdCallDuplicates(calls: Array<{ doc: string; tirage: number; variant: string; lecture: number; zoom?: unknown }>): string[] {
  const seen = new Map<string, number>();
  // Zv : les appels de zoom (localiser, relire) ne sont pas des 3.8 complètes ; seule sa 3.8 de repli est la partagée.
  for (const call of calls) if (call.lecture === 3 && !call.zoom) { const key = `${call.doc}|${call.tirage}|${call.variant === 'Av' || call.variant === 'Csv8F' ? call.variant : 'partagée'}`; seen.set(key, (seen.get(key) ?? 0) + 1); }
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
  if (!deps.readFile) await preparerAllegement(cases, undefined, log);
  const wanted: VariantId[] = options.variantes?.length ? [...options.variantes] : [...K1_VARIANTS];
  // B se déduit des lectures de A : demander B, c'est lire A.
  const want = new Set<string>(wanted);
  const groups = new Set<Group>(wanted.map(id => GROUP_OF[id]));
  const outDir = path.resolve(options.out ?? path.join(REELS_DIR, `banc-k4-${simulated ? 'sim-' : offline ? 'horsligne-' : ''}${stamp()}`));
  mkdirSync(path.join(outDir, 'raw'), { recursive: true });
  const journalPath = deps.journalPath ?? (simulated || offline ? path.join(outDir, 'journal-gemini.md') : MISSION_JOURNAL);
  const lender: Lender | undefined = deps.lender ?? (options.reprendre ? loadLender(reprendreDirs(options.reprendre)) : undefined);

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
    budget = new Budget(Math.round((options.budgetChf ?? 0) * 1e6), before, Math.round((options.plafondPasse ?? DEFAULT_PASS_CAP_CHF) * 1e6));
    log(`Plafond de la passe ${options.plafondPasse ?? DEFAULT_PASS_CAP_CHF} CHF (arrêt net avant le dépassement).`);
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
  const bander: Bander = deps.bander ?? (simulated || offline ? sizeBander : jimpBander(path.join(outDir, 'bandes')));
  const cropper: Cropper = deps.cropper ?? (simulated || offline ? fakeCropper : jimpCropper());

  const records: DrawRecord[] = [];
  const reserveTable = Object.fromEntries([['a', callSpec('A', 1)], ['c', callSpec('C', 1)], ['lm', callSpec('Lm', 1)]].map(([name, spec]) => [name as string, reserveFor((spec as CallSpec).model, (spec as CallSpec).maxOut) / 1e6]));
  const meta0 = { mode: options.mode, repeat: options.repeat, startedAt: new Date().toISOString(), models: { strong: STRONG_MODEL, lite: LITE_MODEL }, budgetChf: options.budgetChf ?? null,
    variantes: wanted, normaliser: !!options.normaliser, reprendre: options.reprendre ? reprendreDirs(options.reprendre).map(dir => path.basename(dir)).join(',') : null,
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
  /** Ce qu'un appel de k5 ajoute : sa partie (Pv, Bv) et sa phrase de rang, ou un appel de zoom tout fait (Zv : son id, son réglage, son corps). */
  interface CallExtra { part?: { k: number; n: number }; note?: string; zoom?: { cell: string; etape: 'loc' | 'lec'; id: string; spec: CallSpec; body: Record<string, unknown> } }
  const doCall = async (c: BenchCase, files: InvoiceFile[], tirage: number, group: string, lecture: 1 | 2 | 3, extra: CallExtra = {}): Promise<Reading> => {
    if (halt) throw new BudgetStop(halt);
    const spec = extra.zoom?.spec ?? callSpec(group, lecture), model = spec.model;
    const freeJson = !!options.avSansSchema && !!spec.codeExecution;
    const id = extra.zoom?.id ?? `${group}${lecture}${extra.part ? `-p${extra.part.k}` : ''}`;
    const meta: ReadMeta = { id, doc: c.id, tirage, variant: group, lecture, model, ...(freeJson ? { freeJson: true } : {}), ...(extra.part ? { part: extra.part } : {}),
      ...(extra.zoom ? { zoom: { cell: extra.zoom.cell, etape: extra.zoom.etape } } : {}) };
    // Prêt : en passe payante, seuls les réglages de k1 (A, C standards, 3ᵉ lecture) se prêtent ; les autres lisent toujours neuf. La 3.8 d'Av et
    // les appels de zoom ne se prêtent jamais. Hors ligne, tout ce que la sortie prêtée a gardé (même id) se rejoue, jamais un appel.
    const lend = (): Loan | undefined => {
      if (!lender) return undefined;
      if (extra.zoom || (lecture === 3 && (group === 'Av' || group === 'Csv8F'))) return offline ? lender(c.id, tirage, [meta.id]) : undefined;
      if (lecture === 3) return lender(c.id, tirage, THIRD_IDS);
      return offline || group === 'A' || group === 'C' ? lender(c.id, tirage, [meta.id]) : undefined;
    };
    const loan = lend();
    // Une seule 3.8 (partagée) par document et par tirage : un second appel est une erreur du banc, jamais une dépense.
    if (lecture === 3 && !loan && !extra.zoom) {
      const own = group === 'Av' || group === 'Csv8F';
      const key = `${c.id}|${tirage}|${own ? group : 'partagée'}`;
      if (thirdKeys.has(key)) throw new Error(`Banc : la 3.8 ${own ? `de ${group}` : 'partagée'} est appelée deux fois pour ${c.id}, tirage ${tirage}.`);
      thirdKeys.add(key);
    }
    if (loan) {
      const lent: Reading = { ...(extra.zoom ? readingOfRaw(meta, loan.json, loan.ms, loan.costMicroChf) : readingFromResponse(meta, loan.json, loan.ms, loan.costMicroChf)), lent: true };
      readings.push(lent);
      return lent;
    }
    if (offline) throw new Error(`Hors ligne : la lecture ${meta.id} (${meta.doc}, tirage ${tirage}) manque dans la sortie prêtée ; aucun appel n’est permis.`);
    const body = extra.zoom?.body ?? buildReadBody(files, spec.prompt, spec.maxOut, spec.thinking, { promptAfter: spec.promptAfter, temperature: !spec.noTemperature, svSchema: spec.svSchema,
      ultraHigh: spec.ultraHigh, codeExecution: spec.codeExecution, freeJson, tilesNote: spec.tiles, ...(spec.nameFr ? { nameFr: true } : {}), ...(extra.note ? { note: extra.note } : {}) });
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
      read = extra.zoom ? readingOfRaw(meta, answer.json, answer.ms, cost) : readingFromResponse(meta, answer.json, answer.ms, cost);
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

  /** Zv : les outils du recadrage sont-ils là (jimp, et pdf.js pour un PDF) ? Sinon la localisation ne se paie pas pour rien : repli direct. */
  const cropReady = async (files: InvoiceFile[]): Promise<boolean> => {
    if (deps.cropper || simulated || offline) return true;
    try { await loadJimp(); if (files.some(file => file.mimeType === 'application/pdf')) await loadPdfRenderer(); return true; }
    catch (error) { if (error instanceof OutilManquant) { log(`Zoom : ${error.message}`); return false; } throw error; }
  };
  /**
   * Zv : la 3ᵉ lecture par zoom ciblé, ou rien (`third` absent = repli sur la 3.8 complète). Il faut deux lectures Flash-Lite exploitables, des désaccords
   * qui pèsent TOUS sur le total TTC, la date, le n° ou le montant d'une ligne, et des outils de recadrage. Pour chaque cellule : la 3.8 localise la zone
   * (`box_2d`), le banc la recadre, la 3.8 la relit. Une boîte absente ou invalide, un recadrage impossible, une relecture illisible : repli, et les appels
   * déjà payés (`wasted`) comptent dans la durée et le coût de Zv. Succès : la première lecture Flash-Lite avec les cellules relues, au format d'une lecture.
   */
  const zoomRead = async (c: BenchCase, files: InvoiceFile[], tirage: number, l1: Reading, l2: Reading): Promise<{ third?: Reading; wasted?: Reading }> => {
    if (!l1.normalized || !l2.normalized || !l1.raw) return {};
    const found = zoomTargets(reconcileInvoiceVision([l1.normalized, l2.normalized]).result.points as any);
    if (!found) return {};
    const targets: ZoomTarget[] = found.map(target => ({ ...target, ...(target.line ? { lineName: l1.normalized!.items[target.line - 1]?.name } : {}) }));
    if (targets.some(target => target.line && !l1.normalized!.items[target.line - 1])) return {};
    if (!(await cropReady(files))) return {};
    const zoomSpec = ZOOM_SPEC;
    const perCell: Reading[][] = [], values: Array<number | string | null> = [];
    const settled = await Promise.allSettled(targets.map(async (target, index) => {
      const reads: Reading[] = [];
      perCell[index] = reads;
      values[index] = null;
      const locate = await doCall(c, files, tirage, 'Zv', 3, { zoom: { cell: target.cell, etape: 'loc', id: `Zv-loc-${target.cell}`, spec: zoomSpec, body: buildZoomBody(files, locatePrompt(target, files.length), LOCATE_SCHEMA) } });
      reads.push(locate);
      const located = locate.ok ? zoomJson(locate.raw) : null;
      const box = located && located.found !== false ? parseBox(located.box_2d) : null;
      if (!box) return;
      let crop;
      try { crop = await cropper(files, Number(located.image) || 1, box, c.id); } catch (error) { if (error instanceof OutilManquant) { log(`Zoom : ${error.message}`); return; } throw error; }
      if (!crop) return;
      const reread = await doCall(c, [crop.file], tirage, 'Zv', 3, { zoom: { cell: target.cell, etape: 'lec', id: `Zv-lec-${target.cell}`, spec: zoomSpec, body: buildZoomBody([crop.file], rereadPrompt(target), REREAD_SCHEMA) } });
      reads.push(reread);
      values[index] = reread.ok ? parseZoomValue(target.field, zoomJson(reread.raw)?.value) : null;
    }));
    const failed = settled.find(item => item.status === 'rejected') as PromiseRejectedResult | undefined;
    if (failed) throw failed.reason;
    const folded = foldZoom(perCell), meta: ReadMeta = { id: ZOOM_ID, doc: c.id, tirage, variant: 'Zv', lecture: 3, model: STRONG_MODEL };
    const lost = (): { wasted?: Reading } => ({ wasted: { meta: { ...meta, id: 'Zv-perdu' }, ok: false, ms: folded.ms, cause: null, finishReason: null, inputTokens: folded.inputTokens, outputTokens: folded.outputTokens,
      costMicroChf: folded.costMicroChf, state: 'zoom perdu', calls: folded.calls, ...(folded.lent ? { lent: true } : {}) } });
    if (values.some(value => value === null)) return lost();
    const patched = patchDecoded(parseReadResponse(l1.raw, parseOptionsOf(l1.meta, false)), targets.map((target, index) => ({ target, value: values[index]! })));
    if (!patched) return lost();
    const third = readingFromResponse(meta, syntheticResponse(patched, { input: folded.inputTokens, output: folded.outputTokens }), folded.ms, folded.costMicroChf);
    return { third: { ...third, calls: folded.calls, ...(folded.lent ? { lent: true } : {}) } };
  };

  let stopped: string | undefined;
  const summary = (final: Final, extra: Partial<VariantRecord> = {}): VariantRecord => ({ ids: final.used.map(read => read.meta.id), calls: final.used.reduce((sum, read) => sum + (read.calls ?? 1), 0), ms: final.ms,
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
          if (cNeeds) {
            if (wanted.some(id => GROUP_OF[id] === 'C' && id !== 'Av' && id !== 'Zv')) { reads.cThird = await third('C'); reads.cpThird = reads.cThird; }
            if (want.has('Av')) reads.avThird = await doCall(c, files, tirage, 'Av', 3);
            // Zv : le zoom d'abord ; au repli (boîte absente, relecture illisible, désaccord ailleurs), la 3.8 complète partagée
            if (want.has('Zv')) { const zoom = await zoomRead(c, files, tirage, l1, l2); reads.zvWasted = zoom.wasted; reads.zvThird = zoom.third ?? await third('Zv'); }
          }
          else if (cpNeeds && (want.has('Cp') || want.has('Csp'))) reads.cpThird = await third('Cp');
        }
        for (const group of LITE_GROUPS) {
          if (!groups.has(group)) continue;
          let r1: Reading, r2: Reading;
          if (PARTIAL_GROUPS.has(group)) {
            // Pv : une lecture par page (tout le PDF joint à chacune) ; Bv : une lecture par bande. Les deux lectures sont lancées ensemble.
            let partFiles: InvoiceFile[][] = [];
            if (group === 'Pv') partFiles = Array.from({ length: pdfPartCount(files) }, () => files);
            else {
              let parts: BandPart[] | null = null;
              try { parts = await bander(files, c.id); } catch (error) { if (!(error instanceof OutilManquant)) throw error; log(`${c.id} : ${error.message}`); }
              partFiles = (parts ?? []).map(part => [part.file]);
            }
            if (!partFiles.length) continue;   // aucun parcours sur ce cas (pas un PDF de 2 pages ou plus, aucune image haute, outil absent)
            const n = partFiles.length, noteOf = (k: number) => (group === 'Pv' ? pageNote(k, n) : bandNote(k, n));
            const all = await parallel(([1, 2] as const).flatMap(lecture => partFiles.map((partFile, index) => doCall(c, partFile, tirage, group, lecture, { part: { k: index + 1, n }, note: noteOf(index + 1) }))));
            const whole = (lecture: 1 | 2): ReadMeta => ({ id: `${group}${lecture}`, doc: c.id, tirage, variant: group, lecture, model: LITE_MODEL });
            r1 = mergeReadings(all.slice(0, n), whole(1), { dedupe: group === 'Bv' });
            r2 = mergeReadings(all.slice(n), whole(2), { dedupe: group === 'Bv' });
          } else {
            // Tv : seulement pour une image seule ; sinon la variante n'a pas de parcours sur ce cas
            let sent = files;
            if (group === 'Tv') { if (!isTileable(files)) continue; sent = [files[0], ...await tiler(files[0], c.id)]; }
            [r1, r2] = await parallel([doCall(c, sent, tirage, group, 1), doCall(c, sent, tirage, group, 2)]);
          }
          // Lm, Lh, Lp, Hv, Sv, Uv, Tv = C★v : la divergence seule appelle la 3.8, qui tranche les valeurs (le statut du vote est gardé).
          // Csv8, Avl, Pv, Bv : comme C, la 3.8 est aussi appelée quand une lecture manque (c'est le repli de `finalOfLite`).
          const needs = FULL_VOTE_GROUPS.has(group) ? needsThirdLite(r1, r2) : needsThird(r1, r2);
          // Csv8F : sa 3.8 lit aussi `nameFr` : la sienne, jamais la partagée ni une prêtée
          reads.lite[group] = { r1, r2, ...(needs ? { third: group === 'Csv8F' ? await doCall(c, files, tirage, group, 3) : await third(group) } : {}) };
        }
        const variants: Record<string, VariantRecord> = {};
        const put = (suffix: string, derived: Partial<Record<VariantId, Derived>>) => {
          for (const id of orderVariants(Object.keys(derived))) { const d = derived[id as VariantId]!; variants[`${id}${suffix}`] = summary(d.final, d.thirdFrom ? { thirdFrom: d.thirdFrom } : {}); }
        };
        put('', deriveVariants(reads, want));
        // N : les mêmes lectures, la devise relue en code ISO ; aucun appel de plus (une 3.8 inutile devient simplement non demandée)
        if (options.normaliser) put(N_SUFFIX, deriveVariants(mapReads(reads, withCodesNormalized), want));
        const divergences = divergencesDe(reads);
        records.push({ doc: c.id, tirage, readings: readings.slice(before).map(({ normalized: _n, raw: _r, ...rest }) => rest), variants, ...(Object.keys(divergences).length ? { divergences } : {}) });
        for (const [paire, list] of Object.entries(divergences)) log(`${c.id} tirage ${tirage} : divergences ${paire} : ${texteDivergences(list)} (! = appelle la 3.8)`);
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
  const zvLine = lineFor(`Zv : zoom de la 3.8 (au pire ${MAX_ZOOM_TARGETS} cellules × localiser + relire, par document et par tirage)`, STRONG_MODEL);
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
        // Pv : une lecture par page (tout le PDF joint) ; Bv : une lecture par bande (une image) ; sans parcours sur ce cas, rien n'est compté
        let sentParts: InvoiceFile[][] = [files];
        if (group === 'Tv') { if (!isTileable(files)) continue; sent = [files[0], files[0], files[0]]; sentParts = [sent]; }
        if (group === 'Pv') { const pages = pdfPartCount(files); if (!pages) continue; sentParts = Array.from({ length: pages }, () => files); }
        if (group === 'Bv') { sentParts = estimatedBandFiles(files); if (!sentParts.length) continue; }
        for (const lecture of [1, 2] as const) {
          const spec = callSpec(group, lecture);
          if (lender && (group === 'A' || group === 'C') && lender(c.id, tirage, [`${group}${lecture}`])) { line.lent++; continue; }
          for (const partFiles of sentParts) { line.fresh++; line.reservedMicro += reserve(spec, partFiles); }
        }
        // Csv8F a sa propre 3.8 (avec nameFr), comptée à part, jamais prêtée
        if (group === 'Csv8F') { thirdLine.fresh++; thirdLine.reservedMicro += reserve(callSpec('Csv8F', 3), files); } else thirdPossible = true;
      }
      if (thirdPossible) {
        if (lender?.(c.id, tirage, THIRD_IDS)) thirdLine.lent++; else { thirdLine.fresh++; thirdLine.reservedMicro += reserve(callSpec('A', 3), files); }
      }
      if (wanted.includes('Av')) { avLine.fresh++; avLine.reservedMicro += reserve(callSpec('Av', 3), files); }
      if (wanted.includes('Zv')) for (let cell = 0; cell < MAX_ZOOM_TARGETS; cell++) {
        zvLine.fresh += 2; zvLine.reservedMicro += reserve(ZOOM_SPEC, files) + reserve(ZOOM_SPEC, [{ mimeType: 'image/png', data: '' }]);
      }
    }
  }
  const lines = [...byGroup.values()];
  const thirds = [thirdLine, ...(wanted.includes('Av') ? [avLine] : []), ...(wanted.includes('Zv') ? [zvLine] : [])];
  const all = [...lines, ...thirds];
  const freshCalls = all.reduce((sum, line) => sum + line.fresh, 0), reservedMicro = all.reduce((sum, line) => sum + line.reservedMicro, 0);
  const sharing: Record<string, string> = { B: 'A', Cp: 'C', Cs: 'C', Csv: 'C', Csp: 'C', Av: 'C', Zv: 'C' };
  const text: string[] = [`Estimation (aucun réseau, aucune clé) : ${cases.length} documents × ${options.repeat} tirages, variantes ${wanted.join(',')}${options.normaliser ? ' (+N : aucun appel de plus)' : ''}.`];
  if (missing.length) text.push(`Fichiers absents sur ce poste (taille supposée d’une image) : ${missing.join(', ')}.`);
  for (const id of wanted) {
    const group = GROUP_OF[id], line = byGroup.get(group)!;
    text.push(sharing[id] ? `- ${id} (${VARIANT_LABEL[id]}) : lit les lectures de ${sharing[id]}, comptées une fois${id === 'Av' ? ` ; sa 3.8 propre : ${avLine.fresh} appels neufs au pire (${STRONG_MODEL}), réserve ${(avLine.reservedMicro / 1e6).toFixed(4)} CHF` : ''}${id === 'Zv' ? ` ; son zoom : ${zvLine.fresh} appels neufs au pire (${STRONG_MODEL}), réserve ${(zvLine.reservedMicro / 1e6).toFixed(4)} CHF` : ''}.`
      : `- ${id} (${VARIANT_LABEL[id]}) : ${line.fresh} appels neufs, ${line.lent} prêtés (${line.model}), réserve ${(line.reservedMicro / 1e6).toFixed(4)} CHF.`);
  }
  text.push(`- ${thirdLine.variant} : ${thirdLine.fresh} appels neufs au pire, ${thirdLine.lent} prêtés (${STRONG_MODEL}), réserve ${(thirdLine.reservedMicro / 1e6).toFixed(4)} CHF.`);
  const byModel = new Map<string, { fresh: number; micro: number }>();
  for (const line of all) { const entry = byModel.get(line.model) ?? { fresh: 0, micro: 0 }; entry.fresh += line.fresh; entry.micro += line.reservedMicro; byModel.set(line.model, entry); }
  for (const [model, entry] of byModel) text.push(`- Par modèle : ${model} ${entry.fresh} appels neufs, réserve ${(entry.micro / 1e6).toFixed(4)} CHF.`);
  const budget = options.budgetChf === undefined ? null : Math.round(options.budgetChf * 1e6);
  text.push(`Réserve maximale ${(reservedMicro / 1e6).toFixed(4)} CHF ; déjà journalisé ${(spentMicro / 1e6).toFixed(4)} CHF${budget === null ? '' : `, budget ${options.budgetChf} CHF (${spentMicro + reservedMicro > budget ? 'le budget arrêtera la passe avant la fin si tout est consommé au pire' : 'tient au pire'})`}. La réserve compte la sortie au plafond de chaque appel : la dépense réelle est bien en dessous.`);
  if (options.plafondPasse !== undefined) {
    const cap = Math.round(options.plafondPasse * 1e6);
    text.push(`Plafond de passe ${options.plafondPasse} CHF : la réserve maximale ${reservedMicro <= cap ? 'tient dedans' : 'le dépasse (la passe s’arrêtera net avant le dépassement)'}.`);
  }
  if (averages) {
    const probable = all.reduce((sum, line) => sum + line.fresh * (averages[line.model] ?? 0) * (line === avLine ? 3 : 1), 0);
    text.push(`Dépense probable (indicative : appels neufs × coût moyen observé par modèle dans la sortie prêtée, ×3 pour Av, sans tenir compte des images supplémentaires de Sv, Uv, Tv ni des PDF) : environ ${(probable / 1e6).toFixed(2)} CHF.`);
  }
  text.push(`BANC ESTIME ${(reservedMicro / 1e6).toFixed(4)} CHF ${freshCalls} appels neufs`);
  return { lines, thirds, freshCalls, reservedMicro, spentMicro, text };
}

/** vite-node ne laisse pas le nom du script dans process.argv : le banc se lance avec --simuler, --hors-ligne, --payant ou --estimer, jamais sous vitest. */
const isMain = () => !process.env.VITEST && !/banc-noms-fr/.test(process.argv[1] ?? '') && (process.argv.includes('--simuler') || process.argv.includes('--payant') || process.argv.includes('--hors-ligne') || process.argv.includes('--estimer'));
if (isMain()) {
  const options = parseArgs(process.argv.slice(2));
  if (options.estimer) {
    void (async () => {
      try {
        const cases = loadCases(options.cas?.map(casPath)).filter(c => !options.docs || options.docs.includes(c.id));
        await preparerAllegement(cases);
        const lender = options.reprendre ? loadLender(reprendreDirs(options.reprendre)) : undefined;
        console.log(estimateBench(options, cases, lender, spentInJournal(MISSION_JOURNAL), options.reprendre ? observedAverages(reprendreDirs(options.reprendre)[0]) : undefined).text.join('\n'));
        process.exit(0);
      } catch (error) { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); }
    })();
  } else {
    const out = options.out ?? (options.mode === 'simuler' ? path.join(tmpdir(), `k4-sim-${stamp()}`) : undefined);
    runBench({ ...options, out }).then(() => process.exit(0), error => { console.error(`BANC ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
  }
}
