import {
  ajouterCoupure, alignerLignes, finirUneLecture, phraseCoupure, pointLectureCoupee, reconcileInvoiceVision, ressemblanceNoms, voterChampControle, voterComptage,
  type CauseCoupure, type InvoiceScanResult
} from './invoiceVisionReview.js';
import { choisirDate, dateDeLecture, normalizeInvoiceScan } from './invoiceScanCore.js';
import { signerPoint } from './invoiceControls.js';
export { ressemblance, ressemblanceNoms } from './invoiceVisionReview.js';

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
    return finish(singleResult(finirUneLecture(lectureFusionnee(r1.normalized, r2.normalized, third.normalized)), 3), [r1, r2, third]);
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
  const disagreements = desaccordsDuVote(vote.result, r1.normalized, r2.normalized, third.normalized);
  const result = { ...star.result, ...phrasesDuVote(vote.result, star.result), points: [...star.result.points, ...disagreements] };
  dateDuVoteEtoile(result, [r1.normalized!, r2.normalized!, third.normalized]);
  return { ...star, result };
}
/**
 * Les désaccords du vote à trois, au rang des lignes de la lecture fusionnée. Ceux d'une ligne portent le rang de la lecture de base de la réconciliation
 * (la première, ou la deuxième quand elle seule s'accorde avec la 3.8) : ils passent au rang de leur colonne ; un désaccord sur une ligne qui n'est pas
 * gardée n'est pas montré (jeu en ligne 7 n° 8 : « Voir le désaccord » ouvrait une autre ligne). Exportée pour le banc : une seule règle.
 */
export function desaccordsDuVote(vote: any, a: InvoiceScanResult, b: InvoiceScanResult, c: InvoiceScanResult): any[] {
  const base = vote.review?.correctedFields?.includes('items') ? 1 : 0;
  const colonneDe = new Map<number, number>();
  colonnesDeTrois(a, b, c).forEach((col, k) => { if (col[base] !== null) colonneDe.set(col[base]! + 1, k + 1); });
  return (vote.points ?? []).filter((point: any) => point.source === 'désaccord')
    .filter((point: any) => typeof point.ligne !== 'number' || colonneDe.has(point.ligne)).map((point: any) => (typeof point.ligne === 'number' ? renumeroterPoint(point, colonneDe) : point));
}
function renumeroterPoint(point: any, vers: ReadonlyMap<number, number>): any {
  const n = (k: number) => vers.get(k) ?? k;
  const { signature: _ancienne, ...reste } = { ...point, ligne: n(point.ligne), ...(Array.isArray(point.lignes) ? { lignes: point.lignes.map((k: number) => n(k)) } : {}),
    champs: (point.champs ?? []).map((c: string) => c.replace(/^items.(d+)./, (_m: string, k: string) => `items.${n(Number(k))}.`)),
    cle: String(point.cle).replace(/:(d+):/, (_m: string, k: string) => `:${n(Number(k))}:`) };
  return { ...reste, signature: signerPoint(reste) };
}
/**
 * LT-2 : la 3.8 tranche seule, mais deux lectures qui ne diffèrent que par l'année cèdent à l'année à 4 chiffres, puis à la date plausible aujourd'hui.
 * Exportée pour le banc (`scripts/banc-lecture-facture.ts`), qui rejoue C★v sur des lectures déjà payées : une seule règle, jamais une copie (09.11 : le banc
 * gardait 07.11.2025 sur doc21 là où la production garde 2026).
 */
export function dateDuVoteEtoile(result: { date?: unknown; dateCourte?: unknown }, lectures: ReadonlyArray<{ date?: string; dateCourte?: string }>): void {
  const date = choisirDate(lectures.map(dateDeLecture), String(result.date ?? ''));
  if (date !== (result.date ?? '')) { result.date = date; delete result.dateCourte; }
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
 * Mission 2026-11-10-fusion-lectures : quand la 3.8 tranche, la fusion des trois lectures se fait après alignement, par créneau (ROVER, Fiscus 1997),
 * pivot = la 3.8. Une colonne = une ligne vue par une ou plusieurs lectures (`alignerLignes`, Needleman-Wunsch). Elle est gardée si la 3.8 l'a, ou si les
 * deux Flash-Lite l'ont au même montant (deux tickets d'un règlement : la 3.8 qui ne lit qu'une page ne fait plus disparaître l'autre).
 * Les deux Flash-Lite ne sont pas des lecteurs indépendants (même modèle, même image : banc, doc25, toutes deux « 0,69 » pour 6,95) : leur accord ne
 * renverse la valeur de la 3.8 que sur une preuve. Le montant reste celui de la 3.8, sauf s'il manque, ou s'il est le montant d'accord d'une ligne VOISINE
 * (la 3.8 décalée d'un rang : jeu en ligne 6, « OPSHGE CHANTIER » à 8,50). Le triplet quantité, unité, prix est celui de la 3.8 quand elle le lit au montant
 * retenu ; sinon celui que les lectures lisent à ce montant (un « 1 » lu par les deux Flash-Lite n'est plus perdu quand la 3.8 ne l'écrit pas).
 * Le nom et la nature sont ceux de la 3.8 quand elle a la ligne.
 */
export type Colonne = [number | null, number | null, number | null];
export function colonnesDeTrois(a: InvoiceScanResult, b: InvoiceScanResult, c: InvoiceScanResult): Colonne[] {
  const p31 = alignerLignes(c.items, a.items), p32 = alignerLignes(c.items, b.items), p12 = alignerLignes(a.items, b.items);
  const cols: Colonne[] = c.items.map((_, k) => [p31.match.get(k) ?? null, p32.match.get(k) ?? null, k]);
  const pris1 = new Set(cols.flatMap(x => (x[0] === null ? [] : [x[0]]))), pris2 = new Set(cols.flatMap(x => (x[1] === null ? [] : [x[1]])));
  // Les lignes que les deux Flash-Lite lisent au même montant et que la 3.8 n'a pas : à leur place, après la colonne qui les précède dans la première lecture.
  for (const [i, j] of [...p12.match].sort((x, y) => x[0] - y[0])) {
    if (pris1.has(i) || pris2.has(j)) continue;
    const m = centimesDe(a.items[i]?.amountTTC);
    if (m === null || m !== centimesDe(b.items[j]?.amountTTC)) continue;
    let apres = -1;
    for (let k = cols.length - 1; k >= 0 && apres < 0; k--) if ((cols[k][0] !== null && cols[k][0]! < i) || (cols[k][0] === null && cols[k][1] !== null && cols[k][1]! < j)) apres = k;
    cols.splice(apres + 1, 0, [i, j, null]);
  }
  return cols;
}
function centimesDe(v: unknown): number | null { return typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null; }
const triplet = (l: any) => ({ quantity: l.quantity ?? null, unit: l.unit ?? '', price: l.price ?? null });
const cleTriplet = (t: { quantity: unknown; unit: unknown; price: unknown }) => `${centimesDe(t.quantity)}|${String(t.unit ?? '').trim().toLowerCase()}|${centimesDe(t.price)}`;
const tripletVide = (t: { quantity: unknown; price: unknown }) => t.quantity === null && t.price === null;
/** Le montant d'accord des deux Flash-Lite sur une colonne (les deux lisent la ligne au même montant), ou null. */
function accordLite(col: Colonne, L: any[][]): number | null {
  if (col[0] === null || col[1] === null) return null;
  const x = centimesDe(L[0][col[0]]?.amountTTC);
  return x !== null && x === centimesDe(L[1][col[1]]?.amountTTC) ? x : null;
}
/**
 * Voie f2 (jeu en ligne 8, bloquants 1 et 4) : le vote du NOM, par créneau. La 3.8 peut glisser les noms d'un rang sur une photo tachée (BAUHAUS : « SERRE-JOINT » sur le
 * montant de « CRATONS ») tandis que les montants sont justes ; le nom n'était pas voté, seulement le montant. Le nom des deux Flash-Lite l'emporte quand : elles lisent la
 * ligne au montant retenu et s'accordent entre elles (≥ 0,6) ; le nom de la 3.8 ne ressemble à aucun des deux (< 0,5) ; ET c'est le nom d'une ligne d'un AUTRE créneau,
 * lu par une Flash-Lite (≥ 0,6), la preuve d'un glissement. Une 3.8 qui traduit, complète ou corrige un nom sans en prendre un d'une autre ligne garde le sien (doc12, doc10) ;
 * trois lectures qui se contredisent : la 3.8 reste, aucune majorité n'est inventée. Rend la ligne de la première Flash-Lite (nom, nature, référence ensemble), ou null.
 */
const NOM_COMMUN = 0.6, NOM_ETRANGER = 0.5;
function ligneDuNomMajoritaire(cols: Colonne[], k: number, L: any[][], lignes: any[], montant: number | null): any | null {
  const [l1, l2, l3] = lignes;
  if (!l1 || !l2 || !l3 || montant === null || centimesDe(l1.amountTTC) !== montant || centimesDe(l2.amountTTC) !== montant) return null;
  if (ressemblanceNoms(l1.name, l2.name) < NOM_COMMUN || ressemblanceNoms(l3.name, l1.name) >= NOM_ETRANGER || ressemblanceNoms(l3.name, l2.name) >= NOM_ETRANGER) return null;
  const ailleurs = cols.some((c, j) => j !== k && [0, 1].some(r => c[r] !== null && ressemblanceNoms(l3.name, L[r][c[r]!]?.name) >= NOM_COMMUN));
  return ailleurs ? l1 : null;
}
/**
 * Voie f2 (bloquant 3, « prix perdu 28/28, unité 17/28 ») : un prix ou une unité NULS de la 3.8 ne l'emportent pas sur une valeur lue au même montant. Le prix : celui que deux autres
 * lectures lisent, sinon celui d'une seule qui tient (quantité × prix = montant). L'unité : celle que les autres lectures lisent sans se contredire (une contradiction : l'unité reste à préciser,
 * jamais devinée). Seules comptent les lectures de la MÊME quantité (une unité dit la quantité). La valeur que la 3.8 lit reste la sienne.
 */
function completerTriplet(t: ReturnType<typeof triplet>, autres: Array<ReturnType<typeof triplet>>, montant: number | null): ReturnType<typeof triplet> {
  const memeQte = autres.filter(x => t.quantity === null || x.quantity === t.quantity);
  let { quantity, unit, price } = t;
  if (price === null) {
    const prix = memeQte.filter(x => x.price !== null);
    const clePrix = (x: { price: unknown }) => centimesDe(x.price);
    const accord = prix.find(x => prix.filter(y => clePrix(y) === clePrix(x)).length >= 2) ?? (prix.length === 1 ? prix[0] : undefined);
    if (accord && montant !== null && Math.abs(Math.round((quantity ?? accord.quantity ?? 1) * (accord.price as number) * 100) - montant) <= 1) { price = accord.price; quantity = quantity ?? accord.quantity; }
  }
  if (!String(unit ?? '').trim()) {
    const unites = memeQte.map(x => String(x.unit ?? '').trim()).filter(Boolean);
    if (unites.length && unites.every(u => u.toLowerCase() === unites[0].toLowerCase())) unit = unites[0];
  }
  return { quantity, unit, price };
}
function ligneFusionnee(cols: Colonne[], k: number, L: any[][]): any {
  const col = cols[k], lignes = col.map((rang, r) => (rang === null ? null : L[r][rang]));
  let pivot = lignes[2] ?? lignes[0] ?? lignes[1];
  const accord = accordLite(col, L), a3 = lignes[2] ? centimesDe(lignes[2].amountTTC) : null;
  let montant = lignes[2] ? a3 : accord;
  if (lignes[2] && accord !== null && a3 !== accord) {
    // la 3.8 décalée : son montant est l'accord d'une colonne voisine (rang ± 1 ou 2), d'un autre nom. Le signe est symétrique (deux Flash-Lite décalées
    // ensemble le montrent aussi : banc doc25, il leur manque trois lignes) : il ne vaut que si les trois lectures ont le même nombre de lignes, à une près.
    const comparables = L.every(liste => Math.abs(liste.length - L[2].length) <= 1);
    const voisine = [-2, -1, 1, 2].some(d => cols[k + d] && accordLite(cols[k + d], L) === a3 && ressemblanceNoms(lignes[2].name, (L[0][cols[k + d][0]!] ?? {}).name) < 0.6);
    if (a3 === null || (voisine && comparables)) montant = accord;
  }
  const montantLu = montant === null ? null : (lignes.find(l => l && centimesDe(l.amountTTC) === montant)!.amountTTC as number);
  const auMontant = lignes.map(l => (l && centimesDe(l.amountTTC) === montant && !tripletVide(triplet(l)) ? triplet(l) : undefined));
  const lus = auMontant.filter((t): t is ReturnType<typeof triplet> => Boolean(t));
  const tient = (t: { quantity: any; price: any }) => t.price !== null && montant !== null && Math.abs(Math.round((t.quantity ?? 1) * t.price * 100) - montant) <= 1;
  const choisi = auMontant[2] ?? lus.find(t => lus.filter(u => cleTriplet(u) === cleTriplet(t)).length >= 2) ?? (lus.length === 1 && tient(lus[0]) ? lus[0] : undefined);
  // le nom voté (jeu en ligne 8) : le nom des deux Flash-Lite quand la 3.8 a glissé ; le triplet reste celui qui se lit à ce montant
  const ligneDuNom = ligneDuNomMajoritaire(cols, k, L, lignes, montant);
  if (ligneDuNom) pivot = ligneDuNom;
  const complet = auMontant[2] && choisi ? completerTriplet(choisi, lus.filter(t => t !== auMontant[2]), montant) : choisi;
  return { ...pivot, amountTTC: montantLu, ...(complet ?? triplet(pivot)) };
}
/** La lecture fusionnée des trois, normalisée de nouveau (la normalisation est idempotente : ses contrôles portent sur les valeurs gardées). */
export function lectureFusionnee(a: InvoiceScanResult, b: InvoiceScanResult, c: InvoiceScanResult, colonnes = colonnesDeTrois(a, b, c)): InvoiceScanResult {
  const L = [a.items, b.items, c.items] as any[][];
  const items = colonnes.map((_, k) => ligneFusionnee(colonnes, k, L));
  const lu = (champ: string) => [a, b, c].map(x => ((x as any)[champ] === undefined ? undefined : (x as any)[champ]));
  // Le total de la 3.8, sauf si les deux Flash-Lite lisent un autre total d'accord et que la somme des lignes gardées l'égale (au centime) sans égaler
  // celui de la 3.8 : la 3.8 n'a lu qu'une partie (Sun Store : la page 2, 14,60 pour un règlement de 163,85).
  const somme = items.reduce((t, it) => t + (centimesDe(it.amountTTC) ?? 0), 0), tA = centimesDe(a.amountTTC);
  const total = tA !== null && tA === centimesDe(b.amountTTC) && tA !== centimesDe(c.amountTTC) && somme === tA && somme !== centimesDe(c.amountTTC) ? a.amountTTC : c.amountTTC;
  // L'en-tête chiffré (HT, TVA, bloc) vient d'une lecture dont le total est le total retenu : la 3.8 d'abord.
  const donneur: any = [c, a, b].find(x => centimesDe(x.amountTTC) === centimesDe(total)) ?? c;
  const sortie: any = { ...c, items, amountTTC: total ?? null, amountHT: donneur.amountHT, tvaAmount: donneur.tvaAmount, tvaRate: donneur.tvaRate, vat: donneur.vat };
  for (const champ of ['amountPaid', 'terminalAmount']) { const v = voterChampControle(lu(champ)); if (v === undefined) delete sortie[champ]; else sortie[champ] = v; }
  // Un comptage n'est gardé que si toutes les lectures qui le portent lisent le même nombre (`voterComptage`).
  // Le nombre de lignes annoncé (`printedLineCount`) est un comptage comme les autres (jeu en ligne 8 : « annoncés 23 » d'une lecture seule, sur un ticket qui n'en imprime aucun).
  for (const champ of ['countedAmounts', 'countedEans', 'printedItemCount', 'printedLineCount']) {
    const v = voterComptage(lu(champ));
    if (v === undefined) delete sortie[champ]; else sortie[champ] = v;
  }
  if (sortie.countedAmounts !== (c as any).countedAmounts) delete sortie.countedAmountsConfirmed;
  return normalizeInvoiceScan(sortie) as InvoiceScanResult;
}

/**
 * D308 : pour chaque ligne FINALE, le rang de sa ligne dans le provisoire, ou null si elle n'y est pas. Le provisoire est la réconciliation des deux
 * Flash-Lite, dont les lignes sont celles de la première lecture, dans son ordre : le rang est donc celui de la colonne dans la première lecture
 * (provenance exacte, aucun second rapprochement). Sans 3.8 lisible, le même aligneur rapproche les deux listes.
 */
/** Les rangs provisoires des lignes finales d'une fusion à trois : la colonne de chaque ligne (provenance) ; si la normalisation a changé le nombre de lignes, l'aligneur. */
function rangsDuFinal(provisoire: any[], final: any[], a: InvoiceScanResult, b: InvoiceScanResult, c: InvoiceScanResult): Array<number | null> {
  const cols = colonnesDeTrois(a, b, c);
  return cols.length === final.length && provisoire.length === a.items.length ? cols.map(col => col[0]) : rangsProvisoires(provisoire, final);
}
export function rangsProvisoires(provisoire: any[], final: any[]): Array<number | null> {
  const paire = alignerLignes(provisoire, final);
  const rangDe = new Map<number, number>([...paire.match].map(([p, f]) => [f, p]));
  return final.map((_, f) => rangDe.get(f) ?? null);
}

/**
 * p2 (jeu en ligne 4, 10.11) : deux tickets Sun Store lus comme deux pages d'UNE dépense, « Total EFT 163,85 » imprimé sur les deux. Les deux Flash-Lite lisent les 7 lignes et 163,85 ; la 3.8, qui tranche SEULE (C★),
 * rend la page 2 seule : 5 lignes, 149,25, TVA 0,00. Le client voit la perte tant que le flux provisoire est là (« pas retrouvée »), mais le résultat gardé au cache ne la dit plus : relu plus tard, la dépense
 * affiche 149,25 sans aucune trace. Ce que la 3.8 retire est donc écrit dans le résultat lui-même : les lignes que les deux premières lectures avaient et que la 3.8 n'a pas (rapprochement de production,
 * `alignerLignes`), et, avec elles, le total et la TVA d'avant quand la 3.8 les change. Additif : aucune valeur du résultat n'est modifiée ici, le client décide (Garder / Retirer).
 */
export interface Retirees { lignes: Array<{ rang: number; ligne: any }>; amountTTC?: number | null; tvaAmount?: number | null }
/**
 * Voie f2 (jeu en ligne 8, bloquant 5 : « Rabais total −2,58 · pas retrouvée · Garder / Retirer ») : une ligne qui n'est pas un article n'est jamais « retirée ». Même règle que le client
 * (`rangsHorsPiece`, `src/domain/finance/controlesPiece.ts`, dont `functions/` ne peut rien importer) : un total, un sous-total, un règlement, un montant en devise (par la désignation) ; un
 * RABAIS GLOBAL, remise dont le montant est la somme d'au moins deux autres remises de la liste (−0,68 et −1,90 font le « Rabais total » de −2,58, à un centime). Preuve par la somme, jamais par
 * le montant seul : une remise unique reste une remise. Rangs de la liste donnée (base 0).
 */
const HORS_ARTICLE = /^\s*(?:montant\s+en\s+(?:eur|euro|usd)|betrag\s+in\s+(?:eur|euro|usd)|eur|euro|usd|sous[- ]?total|zwischensumme|zwischentotal|subtotal|total|summe|twint|eft|e[- ]?payment|maestro|visa|mastercard|postcard|v[- ]?pay|especes|espèces|bargeld|cash|r[uü]ckgeld|monnaie\s+rendue|rendu|pay[ée]|bezahlt|zahlung)(?![a-zà-ÿ])/i;
export function rangsHorsPiece(items: Array<{ name?: unknown; kind?: unknown; amountTTC?: unknown; price?: unknown; quantity?: unknown }>): Set<number> {
  const hors = new Set<number>();
  items.forEach((l, i) => { if (HORS_ARTICLE.test(String(l.name ?? ''))) hors.add(i); });
  const montant = (l: { amountTTC?: unknown; price?: unknown; quantity?: unknown }) => centimesDe(l.amountTTC) ?? (centimesDe(l.price) !== null && (l.quantity === null || l.quantity === undefined || l.quantity === 1) ? centimesDe(l.price) : null);
  const remises = items.map((l, i) => ({ i, c: (l.kind === 'discount' || (montant(l) ?? 0) < 0) && !hors.has(i) ? montant(l) : null })).filter((x): x is { i: number; c: number } => x.c !== null);
  for (const r of remises) {
    const pool = remises.filter(x => x.i !== r.i).slice(0, 12);
    if (pool.length < 2) continue;
    for (let masque = 1; masque < (1 << pool.length); masque++) {
      let n = 0, somme = 0;
      for (let k = 0; k < pool.length; k++) if (masque & (1 << k)) { n++; somme += pool[k].c; }
      if (n >= 2 && Math.abs(somme - r.c) <= 1) { hors.add(r.i); break; }
    }
  }
  return hors;
}
export function retireesParLaTroisieme(l1: LectureVote, l2: LectureVote, third: LectureVote | undefined, final: any): Retirees | null {
  if (!l1.normalized || !l2.normalized || !third?.normalized || !needsThird(l1, l2)) return null;
  const provisoire = provisoireDeDeux(l1, l2);
  if (!provisoire) return null;
  // Les lignes du provisoire sont celles de la première lecture : une ligne est retirée si aucune colonne gardée ne la contient (même table que le flux).
  const rapprochees = new Set(rangsDuFinal(provisoire.items, final.items ?? [], l1.normalized, l2.normalized, third.normalized).filter((r): r is number => r !== null));
  // Un total, un sous-total, un règlement ou un rabais global (somme d'autres rabais du provisoire) n'est pas une ligne perdue : ni écrit, ni proposé (jeu en ligne 8, bloquant 5).
  const horsPiece = rangsHorsPiece(provisoire.items);
  const lignes = provisoire.items.map((ligne: any, rang: number) => ({ rang, ligne })).filter((x: { rang: number }) => !rapprochees.has(x.rang) && !horsPiece.has(x.rang));
  const centimes = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null);
  const total = centimes(provisoire.amountTTC) !== null && centimes(provisoire.amountTTC) !== centimes(final.amountTTC);
  const tva = centimes(provisoire.tvaAmount) !== null && centimes(provisoire.tvaAmount) !== centimes(final.tvaAmount);
  // Seules les LIGNES retirées déclenchent l'écriture (une donnée perdue) ; un total ou une TVA que la 3.8 corrige seul reste, comme avant, une correction ordinaire (le banc `scripts/banc-lecture-facture.ts`, oracle de parité, ne l'écrit pas).
  if (!lignes.length) return null;
  return { lignes, ...(total ? { amountTTC: provisoire.amountTTC } : {}), ...(tva ? { tvaAmount: provisoire.tvaAmount } : {}) };
}

/**
 * Mission 2026-11-10 (jeu en ligne 7 n° 1 : « Payé · TWINT ≠ imprimé 14,60 / 163,85 », deux tickets d'un règlement) : quand le terminal affiche le total de la
 * pièce, le règlement est ce montant ; un payé lu différent est celui d'un des tickets (les trois lectures du banc lisent 14,60 et le terminal 163,85).
 * Sans terminal lu, ou un terminal différent du total (paiement partagé, espèces rendues), le payé lu reste : jamais une valeur inventée.
 */
export function payeDuReglement<R>(result: R): R {
  const r: any = result;
  if (!r) return result;
  const c = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null);
  const terminal = c(r.terminalAmount), total = c(r.amountTTC), paye = c(r.amountPaid);
  return terminal !== null && terminal === total && paye !== null && paye !== total ? { ...r, amountPaid: r.terminalAmount } : result;
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
        const morceau = payeDuReglement(provisoireDeDeux(l1, l2)), sorti = io.provisoire(morceau);
        if (sorti && typeof (sorti as Promise<unknown>).catch === 'function') (sorti as Promise<unknown>).catch(() => undefined);
        provisoire = morceau;
      } catch { provisoire = null; }
    }
    try { third = { normalized: await io.readStrong(), cause: null }; } catch (error) { third = { cause: io.causeOf(error) }; }
  }
  const final = finalOfStarVote(l1, l2, third);
  if (final.result === null) throw (attempts.find(attempt => attempt.status === 'rejected') as PromiseRejectedResult).reason;
  final.result = payeDuReglement(final.result);
  const retirees = retireesParLaTroisieme(l1, l2, third, final.result);
  if (retirees) final.result = { ...final.result, retirees };
  if (!provisoire) return final.result;
  // La 3.8 a lu : ses lignes se rapprochent de celles du provisoire. Elle a échoué : le final EST le provisoire (plus la coupure), chaque rang est le sien.
  // La 3.8 a lu : chaque ligne finale est une colonne de la fusion, son rang provisoire est celui de sa ligne dans la première lecture (provenance exacte).
  const rangs = third?.normalized ? rangsDuFinal(provisoire.items, final.result.items, l1.normalized!, l2.normalized!, third.normalized) : final.result.items.map((_: unknown, rang: number) => rang);
  return { ...final.result, items: final.result.items.map((ligne: any, rang: number) => ({ ...ligne, rangProvisoire: rangs[rang] })) };
}
