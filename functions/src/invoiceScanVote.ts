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
  dateDuVoteEtoile(result, [r1.normalized!, r2.normalized!, third.normalized]);
  return { ...star, result };
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
 * D308 : pour chaque ligne FINALE, le rang de sa ligne dans le provisoire, ou null si la 3.8 l'ajoute. Le rapprochement est celui de la production
 * (`alignerLignes` : référence, nom, puis chiffres, jamais la seule position : ce sont les ANCRES).
 * p3 (jeu en ligne 5, BAUHAUS : « GANTS DE TRAVAIL » posé sur « METRE AUGA » à un autre montant) : problème d'école, l'alignement de deux séquences autour d'ancres communes (diff, Needleman-Wunsch).
 * L'ancien repli (même longueur totale, ligne sans paire au même rang des deux côtés) devinait des paires dès que les deux listes avaient le même nombre de lignes, sans regarder si l'espace entre deux ancres
 * avait le même nombre de lignes de chaque côté : sur une photo tachée (10 lignes sans paire de chaque côté) il rapprochait des lignes sans rapport et décalait les corrections. Le repli se fait DANS UN INTERVALLE
 * entre deux ancres voisines (dans l'ordre des deux listes) : les lignes sans paire de l'intervalle se rapprochent une à une, dans l'ordre, seulement s'il y en a le même nombre des deux côtés (le doc13 du banc :
 * la 3.8 change le nom et le montant d'une ligne entre deux lignes sûres). Sinon aucune paire : celle du provisoire est « retirée », celle du final « ajoutée », sans correction inventée.
 */
const SEUIL_NOM = 0.7, SEUIL_NOM_MONTANT_EGAL = 0.5, SEUIL_UNE_PAIRE = 0.5;
const texteDeNom = (v: unknown): string => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Ressemblance de deux noms : 1 − (distance de Levenshtein / longueur du plus long), sur le texte sans accents ni ponctuation. 0 si l'un est vide. */
export function ressemblance(a: unknown, b: unknown): number {
  const x = texteDeNom(a), y = texteDeNom(b);
  if (!x || !y) return 0;
  let precedente = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const courante = [i];
    for (let j = 1; j <= y.length; j++) courante[j] = Math.min(precedente[j] + 1, courante[j - 1] + 1, precedente[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    precedente = courante;
  }
  return 1 - precedente[y.length] / Math.max(x.length, y.length);
}
export function rangsProvisoires(provisoire: any[], final: any[]): Array<number | null> {
  const paire = alignerLignes(provisoire, final);
  const rangDe = new Map<number, number>([...paire.match].map(([p, f]) => [f, p]));
  const rangs: Array<number | null> = final.map((_, f) => rangDe.get(f) ?? null);
  const sansPaire = new Set(paire.orphansBase);
  let precedenteF = -1, precedenteP = -1; // la dernière ancre (rang final, rang provisoire)
  const intervalle = (finF: number, finP: number) => {
    const deF: number[] = []; for (let f = precedenteF + 1; f < finF; f++) if (rangs[f] === null) deF.push(f);
    const deP: number[] = []; for (let p = precedenteP + 1; p < finP; p++) if (sansPaire.has(p)) deP.push(p);
    if (!deF.length || !deP.length) return;
    // Une seule ligne sans paire de chaque côté : la même ligne dont la 3.8 a changé le nom et le montant ensemble (doc13) SEULEMENT si la pièce n'a que cette ligne ou si les noms se ressemblent : entre deux ancres,
    // la position seule rapprochait « PINCEAU PLAT » de « ROBAN DE MASQUAGE » (BAUHAUS, banc : deux lignes sans rapport, montants 3,40 et 4,50).
    if (deF.length === 1 && deP.length === 1) { if ((final.length === 1 && provisoire.length === 1) || ressemblance(final[deF[0]]?.name, provisoire[deP[0]]?.name) >= SEUIL_UNE_PAIRE) rangs[deF[0]] = deP[0]; return; }
    // Plusieurs : jamais la position (elle décale tout). Seule une ressemblance du nom lu (une faute d'OCR corrigée : BNOSEE / BROSSE) rapproche, la plus forte d'abord, une paire à la fois.
    const candidats = deF.flatMap(f => deP.map(p => ({ f, p, s: ressemblance(final[f]?.name, provisoire[p]?.name), memeMontant: final[f]?.amountTTC === provisoire[p]?.amountTTC })))
      .filter(c => c.s >= SEUIL_NOM || (c.memeMontant && c.s >= SEUIL_NOM_MONTANT_EGAL)).sort((a, b) => b.s - a.s);
    const prisF = new Set<number>(), prisP = new Set<number>();
    for (const c of candidats) if (!prisF.has(c.f) && !prisP.has(c.p)) { rangs[c.f] = c.p; prisF.add(c.f); prisP.add(c.p); }
  };
  for (let f = 0; f < final.length; f++) {
    const p = rangDe.get(f);
    if (p === undefined || p <= precedenteP) continue; // une ancre qui revient en arrière n'ouvre aucun intervalle sûr
    intervalle(f, p);
    precedenteF = f; precedenteP = p;
  }
  intervalle(final.length, provisoire.length);
  return rangs;
}

/**
 * p2 (jeu en ligne 4, 10.11) : deux tickets Sun Store lus comme deux pages d'UNE dépense, « Total EFT 163,85 » imprimé sur les deux. Les deux Flash-Lite lisent les 7 lignes et 163,85 ; la 3.8, qui tranche SEULE (C★),
 * rend la page 2 seule : 5 lignes, 149,25, TVA 0,00. Le client voit la perte tant que le flux provisoire est là (« pas retrouvée »), mais le résultat gardé au cache ne la dit plus : relu plus tard, la dépense
 * affiche 149,25 sans aucune trace. Ce que la 3.8 retire est donc écrit dans le résultat lui-même : les lignes que les deux premières lectures avaient et que la 3.8 n'a pas (rapprochement de production,
 * `alignerLignes`), et, avec elles, le total et la TVA d'avant quand la 3.8 les change. Additif : aucune valeur du résultat n'est modifiée ici, le client décide (Garder / Retirer).
 */
export interface Retirees { lignes: Array<{ rang: number; ligne: any }>; amountTTC?: number | null; tvaAmount?: number | null }
export function retireesParLaTroisieme(l1: LectureVote, l2: LectureVote, third: LectureVote | undefined, final: any): Retirees | null {
  if (!l1.normalized || !l2.normalized || !third?.normalized || !needsThird(l1, l2)) return null;
  const provisoire = provisoireDeDeux(l1, l2);
  if (!provisoire) return null;
  // p3 : la même table que le flux (`rangsProvisoires`) : une ligne que le repli rapproche est corrigée par la 3.8, pas retirée.
  const rapprochees = new Set(rangsProvisoires(provisoire.items, final.items ?? []).filter((r): r is number => r !== null));
  const lignes = provisoire.items.map((ligne: any, rang: number) => ({ rang, ligne })).filter((x: { rang: number }) => !rapprochees.has(x.rang));
  const centimes = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) : null);
  const total = centimes(provisoire.amountTTC) !== null && centimes(provisoire.amountTTC) !== centimes(final.amountTTC);
  const tva = centimes(provisoire.tvaAmount) !== null && centimes(provisoire.tvaAmount) !== centimes(final.tvaAmount);
  // Seules les LIGNES retirées déclenchent l'écriture (une donnée perdue) ; un total ou une TVA que la 3.8 corrige seul reste, comme avant, une correction ordinaire (le banc `scripts/banc-lecture-facture.ts`, oracle de parité, ne l'écrit pas).
  if (!lignes.length) return null;
  return { lignes, ...(total ? { amountTTC: provisoire.amountTTC } : {}), ...(tva ? { tvaAmount: provisoire.tvaAmount } : {}) };
}

/**
 * p3 relance 1 (jeu en ligne 6, BAUHAUS : « OPSHGE CHANTIER » à 8,50 posé sur « CRATONS DE CHARPENTTER · 3,10 », 8 lignes au nom d'une voisine) : preuve sur les lectures réelles du banc (`analyse-decalage-sortie.txt`,
 * 113 tirages à trois lectures, aucun appel) : c'est la 3.8 elle-même, pas le rapprochement : sur le ticket BAUHAUS tâché (doc24) et un second ticket de la même boutique (doc25), jusqu'à 12 lignes sur 29 de sa lecture portent le montant
 * d'une ligne VOISINE ; ailleurs, aucune. Quand elle tranche seule (C★), ses lignes remplacent celles des deux Flash-Lite, qui s'accordaient sur ces lignes.
 * Détection (pas de modèle de plus) : une ligne de la 3.8 dont le nom est retrouvé (ressemblance ≥ 0,6) dans CHACUNE des deux Flash-Lite, les deux lignes retrouvées s'accordant sur le montant, alors que le montant de la 3.8 diffère
 * de ce montant d'accord ET est celui d'une ligne voisine (rang ± 1 à 2, d'un autre nom) dans chacune des deux. Alors le montant, le prix, la quantité et l'unité d'accord des deux Flash-Lite remplacent ceux de la 3.8 :
 * le nom (sa lecture, meilleure) reste. Une correction de nom ne change jamais le montant d'une ligne. Rend les rangs redressés.
 */
export function redresserDecalage(final: any, l1: LectureVote, l2: LectureVote): { items: any[]; redressees: number[] } {
  const items: any[] = final?.items ?? [];
  if (!l1.normalized || !l2.normalized || !items.length) return { items, redressees: [] };
  const lites = [l1.normalized.items as any[], l2.normalized.items as any[]];
  const montant = (x: any) => (typeof x?.amountTTC === 'number' && Number.isFinite(x.amountTTC) ? Math.round(x.amountTTC * 100) : null);
  // Le raisonnement par les voisines ne vaut que si les trois listes ont une structure comparable (à une ligne près) : deux Flash-Lite qui ont perdu des lignes (doc25, tirage p5 : 18 et 21 pour 22) se décalent elles-mêmes.
  if (lites.some(liste => Math.abs(liste.length - items.length) > 1)) return { items, redressees: [] };
  const redressees: number[] = [];
  const sortie = items.map((it, i) => {
    const a3 = montant(it);
    if (a3 === null) return it;
    const proches = lites.map(liste => liste.map((x, j) => ({ j, s: ressemblance(it.name, x?.name) })).sort((p, q) => q.s - p.s)[0]);
    if (proches.some(p => !p || p.s < 0.6)) return it;
    const [pa, pb] = proches, xa = lites[0][pa.j], xb = lites[1][pb.j], aF = montant(xa);
    // les deux Flash-Lite s'accordent sur la ligne ET sur son rang : deux listes de longueurs différentes n'ont pas les mêmes voisines (doc25, tirage p5 : la 3.8 avait raison contre deux listes décalées entre elles)
    if (aF === null || aF !== montant(xb) || aF === a3 || pa.j !== pb.j) return it;
    const voisine = (liste: any[], p: { j: number }) => [-2, -1, 1, 2].some(dj => liste[p.j + dj] && montant(liste[p.j + dj]) === a3 && ressemblance(liste[p.j + dj].name, it.name) < 0.6);
    if (!voisine(lites[0], pa) || !voisine(lites[1], pb)) return it;
    redressees.push(i);
    return { ...it, amountTTC: xa.amountTTC, price: xa.price ?? null, quantity: xa.quantity ?? null, unit: xa.unit ?? it.unit };
  });
  return { items: sortie, redressees };
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
  if (third?.normalized) { const { items, redressees } = redresserDecalage(final.result, l1, l2); if (redressees.length) final.result = { ...final.result, items }; }
  const retirees = retireesParLaTroisieme(l1, l2, third, final.result);
  if (retirees) final.result = { ...final.result, retirees };
  if (!provisoire) return final.result;
  // La 3.8 a lu : ses lignes se rapprochent de celles du provisoire. Elle a échoué : le final EST le provisoire (plus la coupure), chaque rang est le sien.
  const rangs = third?.normalized ? rangsProvisoires(provisoire.items, final.result.items) : final.result.items.map((_: unknown, rang: number) => rang);
  return { ...final.result, items: final.result.items.map((ligne: any, rang: number) => ({ ...ligne, rangProvisoire: rangs[rang] })) };
}
