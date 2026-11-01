import {
  ajouterCoupure, finirUneLecture, phraseCoupure, pointLectureCoupee, reconcileInvoiceVision,
  type CauseCoupure, type InvoiceScanResult
} from './invoiceVisionReview.js';

/**
 * La lecture de facture en production : C★v8 + N du banc (D247, mission 2026-11-01-bascule-lecture).
 *
 *   - deux lectures Flash-Lite en parallèle (consignes 1 et 2, 8 192 jetons de sortie) ;
 *   - la 3.8 (consigne 3) quand elles divergent (`needsThird`) OU quand une Flash-Lite manque : coupée, refusée, en délai (`needsThirdLite`) ;
 *   - le résultat : les VALEURS de la 3.8 quand elle tranche, le STATUT et les constats du vote à trois, les points de désaccord en plus
 *     (`finalOfStarVote`) ; sinon le repli `finalOfLite` : une Flash-Lite lisible et la 3.8 votent à deux, aucune Flash-Lite lisible, la 3.8
 *     seule en « unavailable » à un lecteur ; jamais « Lecture indisponible » quand la 3.8 a lu ;
 *   - N : la devise en code ISO (`isoCurrency`), appliquée à chaque lecture avant la normalisation (voir `ai.ts`).
 *
 * Module pur : aucun réseau, aucune base. Le banc (`scripts/banc-lecture-facture.ts`) reste l'oracle ; chaque fonction ci-dessous est le
 * portage à l'identique de la sienne (même nom), sans la durée ni le coût, que la production n'a pas à compter ici. Le test de parité
 * (`tests/unit/invoiceScanVote.test.ts`) rejoue les deux sur les mêmes lectures, champ par champ.
 */

/**
 * N : la devise comme code ISO. « Fr. », « SFr. », « CHF. » (point, espaces, casse ignorés) deviennent « CHF » ; tout autre texte
 * reste tel quel (une devise étrangère n'est jamais devinée).
 */
export function isoCurrency(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const key = value.replace(/[\s.]/g, '').toUpperCase();
  return key === 'FR' || key === 'SFR' || key === 'CHF' ? 'CHF' : value;
}

/** Une lecture déjà faite : exploitable (`normalized`) ou non, et pourquoi (`cause` : sortie, délai, ou null pour une autre erreur). */
export interface LectureVote { normalized?: InvoiceScanResult; cause: CauseCoupure | null }
export interface VoteFinal { result: any | null; failure?: string; used: LectureVote[] }

const finish = (result: any, used: LectureVote[], failure?: string): VoteFinal => ({ result, ...(failure ? { failure } : {}), used });

/** La 3ᵉ lecture est-elle appelée par la réconciliation de ces deux lectures ? */
export function needsThird(r1: LectureVote, r2: LectureVote): boolean {
  return !!(r1.normalized && r2.normalized) && reconcileInvoiceVision([r1.normalized, r2.normalized]).needsCorrection;
}
/** La 3.8 est aussi appelée quand une lecture Flash-Lite manque (coupée, refusée, délai). */
export const needsThirdLite = (l1: LectureVote, l2: LectureVote): boolean => !l1.normalized || !l2.normalized || needsThird(l1, l2);

/** Une seule lecture exploitable sur deux : « unavailable » à un lecteur, avec la coupure dite telle quelle. */
function singleOfTwo(good: LectureVote, failed: LectureVote | undefined) {
  const why = failed?.cause ?? null;
  const finding = why ? phraseCoupure(why) : 'La double lecture n’a pas abouti. Vérifie les informations et les montants sur le justificatif.';
  const single = finirUneLecture(good.normalized!);
  return { ...single, review: { status: 'unavailable', readers: 1, correctedFields: [] as string[], findings: [finding] },
    ...(why ? { points: [...single.points, pointLectureCoupee(why, finding)] } : {}), issues: [...single.issues, finding] };
}

/** Deux lectures puis, si elles divergent, la 3ᵉ : le vote de la production d'avant, sur des lectures déjà faites. */
export function finalOfTwo(r1: LectureVote, r2: LectureVote, third?: LectureVote): VoteFinal {
  const both = [r1, r2];
  const good = both.filter(read => read.normalized);
  if (!good.length) return finish(null, both, 'aucune lecture exploitable');
  if (good.length === 1) return finish(singleOfTwo(good[0], both.find(read => !read.normalized)), both);
  let reconciled = reconcileInvoiceVision([r1.normalized!, r2.normalized!]);
  const used = [...both];
  if (reconciled.needsCorrection) {
    if (third) used.push(third);
    if (third?.normalized) reconciled = reconcileInvoiceVision([r1.normalized!, r2.normalized!, third.normalized]);
    else ajouterCoupure(reconciled.result as any, third?.cause ?? 'delai-saute', phraseCoupure('delai-saute'));
  }
  return finish({ ...reconciled.result, review: reconciled.review, issues: [...new Set([...reconciled.result.issues, ...reconciled.review.findings])] }, used);
}

/**
 * Quand une lecture Flash-Lite manque et que la 3.8 a lu : jamais « Lecture indisponible ». Une Flash-Lite lisible et la 3.8 votent à
 * deux ; aucune Flash-Lite lisible, la 3.8 seule, « unavailable » à un lecteur.
 */
export function finalOfLite(r1: LectureVote, r2: LectureVote, third?: LectureVote): VoteFinal {
  if ((r1.normalized && r2.normalized) || !third?.normalized) return finalOfTwo(r1, r2, third);
  const good = [r1, r2].find(read => read.normalized), failed = [r1, r2].find(read => !read.normalized);
  if (!good) return finish(singleOfTwo(third, failed), [r1, r2, third]);
  return finish(finalOfTwo(good, third).result, [r1, r2, third]);
}

/** Le résultat d'une lecture seule : « disputed » si un point pèse, « checked » sinon (la 3.8 qui tranche seule). */
function singleResult(single: ReturnType<typeof finirUneLecture>, readers = 1): any {
  const weighing = single.points.filter(point => point.pese);
  return { ...single, review: { status: weighing.length ? 'disputed' : 'checked', readers, correctedFields: [] as string[], findings: [...new Set(weighing.map(point => point.message))].slice(0, 50) }, issues: single.issues };
}

/** C★ : quand la 3.8 est appelée et lisible sur un désaccord, son résultat TRANCHE SEUL. Sinon le repli `finalOfLite`. */
function finalOfStar(r1: LectureVote, r2: LectureVote, third?: LectureVote): VoteFinal {
  if (r1.normalized && r2.normalized && third?.normalized && needsThird(r1, r2))
    return finish(singleResult(finirUneLecture(third.normalized), 3), [r1, r2, third]);
  return finalOfLite(r1, r2, third);
}

/**
 * C★v : les VALEURS de la 3.8 quand elle tranche, mais le STATUT du vote à trois : dès que les lectures ont divergé sur un champ qui pèse,
 * le résultat reste « disputed » et garde les phrases du vote. Les points du vote qui sont des désaccords entre lectures s'ajoutent à
 * ceux de la 3.8 seule. Sans 3.8 appelée, c'est `finalOfLite`.
 */
export function finalOfStarVote(r1: LectureVote, r2: LectureVote, third?: LectureVote): VoteFinal {
  const star = finalOfStar(r1, r2, third);
  if (star.used.length < 3 || !third?.normalized || !r1.normalized || !r2.normalized) return star;
  const vote = finalOfTwo(r1, r2, third);
  const disagreements = (vote.result.points ?? []).filter((point: any) => point.source === 'désaccord');
  return { ...star, result: { ...star.result, review: { ...vote.result.review }, issues: vote.result.issues, points: [...star.result.points, ...disagreements] } };
}

/** Ce que la lecture de facture demande à l'extérieur (réseau, budget, délai) : l'ordre des appels, lui, est ici. */
export interface Csv8Io {
  /** Lecture Flash-Lite 1 ou 2 (consigne 1 ou 2), normalisée (N comprise) ; rejette si coupée, refusée ou en délai. */
  readLite(lecture: 1 | 2): Promise<InvoiceScanResult>;
  /** La 3.8 (consigne 3), normalisée (N comprise). */
  readStrong(): Promise<InvoiceScanResult>;
  /** Pourquoi une lecture a été coupée (limite de sortie, délai), ou null. */
  causeOf(reason: unknown): CauseCoupure | null;
  /** Le délai global est atteint : la 3.8 n'est plus appelée, et la coupure se dit « delai-saute ». */
  deadlineReached(): boolean;
}

/**
 * C★v8 : deux Flash-Lite en parallèle (chaque appel en cours est attendu avant de rendre la main : le budget ferme son registre après),
 * la 3.8 sur désaccord ou lecture manquante, le résultat de `finalOfStarVote`. Rien de lisible nulle part : l'erreur de la première
 * lecture remonte, comme avant.
 */
export async function lireCsv8(io: Csv8Io): Promise<any> {
  const attempts = await Promise.allSettled([io.readLite(1), io.readLite(2)]);
  const asRead = (attempt: PromiseSettledResult<InvoiceScanResult>): LectureVote =>
    attempt.status === 'fulfilled' ? { normalized: attempt.value, cause: null } : { cause: io.causeOf(attempt.reason) };
  const [l1, l2] = attempts.map(asRead);
  let third: LectureVote | undefined;
  if (needsThirdLite(l1, l2) && !io.deadlineReached()) {
    try { third = { normalized: await io.readStrong(), cause: null }; } catch (error) { third = { cause: io.causeOf(error) }; }
  }
  const final = finalOfStarVote(l1, l2, third);
  if (final.result === null) throw (attempts.find(attempt => attempt.status === 'rejected') as PromiseRejectedResult).reason;
  return final.result;
}
