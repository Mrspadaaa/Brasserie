import {
  ajouterCoupure, alignerLignes, finirUneLecture, phraseCoupure, pointLectureCoupee, reconcileInvoiceVision,
  type CauseCoupure, type InvoiceScanResult
} from './invoiceVisionReview.js';
import { choisirDate, dateDeLecture } from './invoiceScanCore.js';

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
  const result = { ...star.result, ...phrasesDuVote(vote.result, star.result), points: [...star.result.points, ...disagreements] };
  // LT-2 : la 3.8 tranche seule, mais deux lectures qui ne diffèrent que par l'année cèdent à l'année à 4 chiffres, puis à la date plausible aujourd'hui.
  const date = choisirDate([r1, r2, third].map(l => dateDeLecture(l.normalized!)), String(star.result.date ?? ''));
  if (date !== (star.result.date ?? '')) { result.date = date; delete result.dateCourte; }
  return { ...star, result };
}
/**
 * D272b : les phrases du vote, sans ses contrôles de calcul. Ceux-ci portent sur le mélange des trois lectures, alors que les valeurs gardées sont
 * celles de la 3.8, dont les contrôles sont déjà dans son résultat (le 01.11, deux Flash-Lite sans la ligne de port faisaient dire « Écart 29,99 CHF »
 * à côté d'une somme juste). Ce qu'une lecture a signalé reste (source « modèle » : une quantité illisible) ; les phrases de la 3.8 s'ajoutent.
 */
export function phrasesDuVote(vote: any, star: any): { issues: string[]; review: any } {
  const calculs = new Set<string>((vote.points ?? []).filter((point: any) => (point.source ?? 'contrôle') === 'contrôle').map((point: any) => point.message));
  const garder = (phrases: string[] = [], siennes: string[] = []) => [...new Set([...phrases.filter(phrase => !calculs.has(phrase)), ...siennes])];
  return { issues: garder(vote.issues, star.issues), review: { ...vote.review, findings: garder(vote.review?.findings, star.review?.findings) } };
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
  /**
   * D308 (lenteur D) : le premier écran. Appelé une fois, entre la fin des deux Flash-Lite et le départ de la 3.8, seulement quand les deux sont
   * lisibles et que la 3.8 va partir. Jamais attendu : la 3.8 ne le retient pas. Un échec (levée ou promesse rejetée) ne change rien à la lecture ;
   * une levée dit aussi que le morceau n'est pas parti, donc le final ne porte aucun `rangProvisoire`.
   */
  provisoire?(result: any): unknown;
}

/**
 * D308 : le premier écran de la lecture : le rapprochement de `finalOfTwo` des deux Flash-Lite, SANS la coupure (« delai-saute ») : la 3.8 n'a pas échoué,
 * elle est en cours. Deux lecteurs, marqué `provisoire: true`. Rien d'autre ne change : mêmes points, mêmes phrases, même ordre de lignes (celui de la
 * première lecture) que `finalOfTwo` quand la 3.8 échoue. Copie neuve : `finalOfTwo` ajoute plus tard sa coupure au final, jamais à ce morceau.
 */
export function provisoireDeDeux(r1: LectureVote, r2: LectureVote): any | null {
  if (!r1.normalized || !r2.normalized) return null;
  const reconciled = reconcileInvoiceVision([r1.normalized, r2.normalized]);
  return { ...reconciled.result, review: { ...reconciled.review, readers: 2 },
    issues: [...new Set([...reconciled.result.issues, ...reconciled.review.findings])], provisoire: true };
}

/**
 * D308 : pour chaque ligne FINALE, le rang de sa ligne dans le provisoire, ou null si la 3.8 l'ajoute. Le rapprochement est celui de la production
 * (`alignerLignes` : référence, nom, puis chiffres, jamais la seule position). Repli par la position (PLAN § 2 bis) : quand les deux listes ont la même
 * longueur, une ligne sans paire des deux côtés au même rang est la même ligne dont la 3.8 a changé le nom et le montant ensemble (doc13 du banc).
 */
export function rangsProvisoires(provisoire: any[], final: any[]): Array<number | null> {
  const paire = alignerLignes(provisoire, final);
  const rangDe = new Map<number, number>([...paire.match].map(([p, f]) => [f, p]));
  const repli = provisoire.length === final.length;
  return final.map((_, f) => rangDe.get(f) ?? (repli && paire.orphansBase.includes(f) && paire.orphansOther.includes(f) ? f : null));
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
  let third: LectureVote | undefined, provisoire: any | null = null;
  if (needsThirdLite(l1, l2) && !io.deadlineReached()) {
    // D308 : le premier écran part avant la 3.8 et ne l'attend pas. Seulement si les deux Flash-Lite sont lisibles ; sinon on attend la 3.8.
    if (io.provisoire && l1.normalized && l2.normalized) {
      try {
        const morceau = provisoireDeDeux(l1, l2), sorti = io.provisoire(morceau);
        if (sorti && typeof (sorti as Promise<unknown>).catch === 'function') (sorti as Promise<unknown>).catch(() => undefined);
        provisoire = morceau;
      } catch { provisoire = null; }
    }
    try { third = { normalized: await io.readStrong(), cause: null }; } catch (error) { third = { cause: io.causeOf(error) }; }
  }
  const final = finalOfStarVote(l1, l2, third);
  if (final.result === null) throw (attempts.find(attempt => attempt.status === 'rejected') as PromiseRejectedResult).reason;
  if (!provisoire) return final.result;
  // La 3.8 a lu : ses lignes se rapprochent de celles du provisoire. Elle a échoué : le final EST le provisoire (plus la coupure), chaque rang est le sien.
  const rangs = third?.normalized ? rangsProvisoires(provisoire.items, final.result.items) : final.result.items.map((_: unknown, rang: number) => rang);
  return { ...final.result, items: final.result.items.map((ligne: any, rang: number) => ({ ...ligne, rangProvisoire: rangs[rang] })) };
}
