// Le recalcul client des points de ligne et de somme (voie l2-rapprochement, relais n° 4 de l1). Pur : aucune écriture, aucune valeur modifiée.
// Les règles sont CELLES DU SERVEUR : `lineMathCheck` et `sumCheck` viennent du module pur `functions/src/invoiceControls.ts` (une seule source).
// L'écran appelle `recomputeInvoicePoints` à chaque correction (quantité, prix, montant, total) ; il ne refait jamais ces règles.
import {
  PESE_PAR_CODE, SCAN_POINT_CODES, ligneDepuisId, lineMathCheck, peserPoint, signerPoint, sumCheck, totalAbsentPoint, totalsCheck,
  type ControlStatus, type ScanControls, type ScanPoint, type ScanSource, type ScanValue,
} from '../../../functions/src/invoiceControls';

export { PESE_PAR_CODE, SCAN_POINT_CODES, lineMathCheck, peserPoint, signerPoint, sumCheck };
export type InvoicePoint = ScanPoint;
export type InvoiceControls = ScanControls;
export type { ControlStatus, ScanSource, ScanValue };

/** Les points que le recalcul refait ; tous les autres (TVA, désaccords, pro-forma…) sont gardés tels quels. */
const RECALCULES = new Set<string>(['ligne-montant', 'ligne-prix-par-lot', 'somme-ecart', 'somme-incomplete', 'total-absent']);

export interface RecalculableLine { id: string; name: string; kind: string; quantity: number | null; unit: string; price?: number | null; amountTTC?: number | null }
export interface RecalculableScan {
  items: RecalculableLine[]; amountTTC: number | null; amountHT?: number | null; tvaAmount: number | null; linesLost?: number;
  points?: ScanPoint[]; controls?: ScanControls; review?: { status?: string };
}
export type StatutLecture = 'checked' | 'corrected' | 'disputed' | 'unavailable';

/** Reclasse un point calculé sur une ligne seule (rang 1) au rang de l'`id` de cette ligne (jamais sa position). */
function reclasser(point: ScanPoint, rang: number): ScanPoint {
  const change = (s: string) => s.split(':1:').join(`:${rang}:`);
  return {
    ...point, ligne: rang, cle: change(point.cle),
    champs: point.champs.map(c => (c.startsWith('items.1.') ? `items.${rang}.${c.slice('items.1.'.length)}` : c)),
    message: point.message.startsWith('Ligne 1 (') ? `Ligne ${rang} (${point.message.slice('Ligne 1 ('.length)}` : point.message,
  };
}
const posePese = (point: ScanPoint): ScanPoint => { const p: ScanPoint = { ...point, source: point.source ?? 'contrôle' }; p.pese = peserPoint(p); p.signature = signerPoint(p); return p; };

export interface ResultatRecalcul { points: ScanPoint[]; controls: ScanControls; statut: 'disputed' | 'ok' }
/** La marque d'un recalcul réel : seuls les objets rendus par `recomputeInvoicePoints` y entrent (non exportée, donc non forgeable). */
const RECALCULS_REELS = new WeakSet<object>();

export function recomputeInvoicePoints(scan: RecalculableScan): ResultatRecalcul {
  // Le rang d'une ligne vient de son `id` (`line-7`) ; une ligne ajoutée sans id connu prend le rang suivant le plus grand.
  let suivant = Math.max(0, ...scan.items.map(i => ligneDepuisId(i.id) ?? 0)) + 1;
  const lignes = scan.items.map(item => ({ item: { ...item, price: item.price ?? null, amountTTC: item.amountTTC ?? null }, rang: ligneDepuisId(item.id) ?? suivant++ }));
  const rangs = new Set(lignes.map(l => l.rang));

  const comptes: ScanControls['lines'] = { checked: 0, failed: 0, skipped: 0, skippedIds: [] };
  const neufs: ScanPoint[] = [];
  for (const { item, rang } of lignes) {
    const r = lineMathCheck([item]);
    comptes.checked += r.lines.checked; comptes.failed += r.lines.failed; comptes.skipped += r.lines.skipped; comptes.skippedIds.push(...r.lines.skippedIds);
    neufs.push(...r.points.map(p => reclasser(p, rang)));
  }
  const total = sumCheck(lignes.map(l => l.item), scan.amountTTC, scan.amountHT ?? null, scan.linesLost ?? 0);
  const enRang = (c: string) => {
    if (!c.startsWith('items.')) return c;
    const parts = c.split('.'), position = Number(parts[1]);
    return lignes[position - 1] ? [parts[0], lignes[position - 1].rang, ...parts.slice(2)].join('.') : c;
  };
  for (const p of total.points) {
    const lignesRang = p.lignes?.map(position => lignes[position - 1]?.rang ?? position);
    neufs.push({ ...p, champs: p.champs.map(enRang), ...(lignesRang ? { lignes: lignesRang } : {}) });
  }

  // Le total saisi lève ou pose `total-absent` ; HT + TVA = TTC est refait avec la règle du serveur (relecture l2, point 5).
  // tvaAmount est obligatoire ; s'il manque quand même à l'exécution, le point ht-tva-ttc du serveur est gardé (jamais retiré faute de donnée).
  const refaitTotaux = scan.tvaAmount !== undefined;
  const absent = totalAbsentPoint(scan.amountTTC), totaux = totalsCheck(scan.amountHT ?? null, scan.tvaAmount ?? null, scan.amountTTC);
  if (absent) neufs.push(absent);
  if (refaitTotaux && totaux.point) neufs.push(totaux.point);

  // Les points gardés : ni refaits, ni attachés à une ligne qui a disparu.
  const gardes = (scan.points ?? []).filter(p => !RECALCULES.has(p.code) && !(refaitTotaux && p.code === 'ht-tva-ttc') && (p.ligne === null || p.ligne === undefined || rangs.has(p.ligne)));
  const points = [...gardes, ...neufs.map(posePese)];
  const controls: ScanControls = {
    vat: { statut: 'non-verifiable', base: null }, ...(scan.controls ?? {}),
    lines: comptes, sum: total.sum, ...(refaitTotaux ? { totals: totaux.totals } : { totals: scan.controls?.totals ?? { statut: 'non-verifiable' as const } }),
  };
  const resultat: ResultatRecalcul = { points, controls, statut: points.some(peserPoint) ? 'disputed' : 'ok' };
  RECALCULS_REELS.add(resultat);
  return resultat;
}

/** Le statut à afficher. `points` ou `controls` absents veulent dire « non contrôlé », jamais « aucun point » : au mieux « à confirmer » tant que le recalcul n'a pas tourné (P9). */
export function statutDeLecture(scan: { review?: { status?: string }; points?: ScanPoint[]; controls?: unknown }, recalcul?: ResultatRecalcul): StatutLecture {
  const status = scan.review?.status;
  if (status === undefined || status === 'unavailable') return 'unavailable';
  // Le plancher se lève sur un recalcul RÉEL : le résultat que `recomputeInvoicePoints` a rendu (marque que seul ce calcul pose). Un booléen, un
  // objet recopié ou forgé ne la lève pas. Les points du recalcul sont alors ceux qui comptent (ceux du serveur sont périmés par la correction).
  if (recalcul !== undefined && RECALCULS_REELS.has(recalcul)) return recalcul.points.some(peserPoint) ? 'disputed' : status === 'corrected' ? 'corrected' : 'checked';
  if (scan.points === undefined || scan.controls === undefined) return 'disputed';
  // Plancher : un serveur qui dit « à confirmer » n'est jamais affiché vérifié par des points qu'il n'a peut-être pas tous posés (format l1 déjà
  // en ligne), tant que le recalcul client n'a pas posé les siens.
  if (status === 'disputed') return 'disputed';
  if (scan.points.some(peserPoint)) return 'disputed';
  return status === 'corrected' ? 'corrected' : 'checked';
}
