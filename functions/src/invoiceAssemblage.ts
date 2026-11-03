/**
 * D380, D381 : l'assemblage d'une longue pièce lue en morceaux. Aucune IA, aucun coût : les résultats des morceaux (chacun lu par le vote habituel,
 * `scanInvoice` avec `morceau`) → une seule lecture au format de production.
 *
 * « On peut pas se permettre de perdre ou "gagner" de l'information » (03.11) : aucun texte n'est comparé pour retirer un doublon. Chaque article a
 * un seul propriétaire, le morceau où est sa première ligne (`zone: 'dedans'`) ; les articles vus au-delà des traits (`avant`, `apres`) ne servent qu'à
 * recouper la jonction des deux côtés. Une jonction qui ne concorde pas, une coupe à travers une ligne, un morceau manquant : jamais silencieux.
 * L'en-tête vient du premier morceau, les totaux du dernier ; les contrôles (somme des lignes = total imprimé, q × prix, lignes annoncées) tournent
 * sur le tout ; les désaccords de lecture d'une ligne suivent sa ligne au rang global.
 */
import { normalizeInvoiceScan } from './invoiceScanCore.js';
import { finirUneLecture } from './invoiceVisionReview.js';
import { signerPoint, type ScanPoint } from './invoiceControls.js';
import { jonctionConcorde, mergeDecoded } from './invoiceMorceaux.js';

/** Garde-fou du transport (jamais un plafond de lignes : 400 morceaux de 25 lignes). */
export const MORCEAUX_MAX = 400;
const EN_TETE = new Set(['vendor', 'date', 'currency', 'invoiceNumber', 'orderNumber', 'documentType', 'paymentEvidence', 'proForma', 'category']);
const TOTAUX = new Set(['amountHT', 'tvaRate', 'tvaAmount', 'amountTTC', 'vat']);

/** Les morceaux reçus du client : des objets dans l'ordre, chacun avec ses lignes et son rang `morceau: { k, n }` ; aucun ne manque. */
export function morceauxRecus(context: unknown): any[] {
  const parties = (context as { parties?: unknown } | null)?.parties;
  if (!Array.isArray(parties) || parties.length < 1 || parties.length > MORCEAUX_MAX || parties.some(p => !p || typeof p !== 'object' || Array.isArray(p) || !Array.isArray((p as any).items)))
    throw new Error(`Assemblage : 1 à ${MORCEAUX_MAX} morceaux lus attendus.`);
  parties.forEach((p: any, i) => {
    if (p.morceau?.k !== i + 1 || p.morceau?.n !== parties.length) throw new Error(`Assemblage : le morceau ${i + 1} sur ${parties.length} manque ou n'est pas à sa place.`);
  });
  return parties;
}

const zoneDe = (item: any) => (item?.zone === 'avant' || item?.zone === 'apres' ? item.zone : 'dedans');
const sansZone = ({ zone: _zone, ...item }: any) => item;

/** Décale un point de lecture d'une ligne du morceau vers son rang global (cellules `items.<i>` comprises), signature refaite. */
function decaler(point: ScanPoint, rang: number, local: number): ScanPoint {
  const champs = point.champs.map(c => c.replace(/^items\.(\d+)\./, (_, i) => `items.${Number(i) - local + rang}.`));
  const p = { ...point, ligne: rang, lignes: point.lignes?.map(l => l - local + rang), champs, cle: `${point.code}:${rang}:${point.champ}` };
  return { ...p, signature: signerPoint(p) };
}

/** Un point de l'assemblage lui-même (jonction, coupe) : il pèse, il ne bloque pas l'enregistrement, le brasseur le voit avec ses lignes. */
function pointAssemblage(quoi: string, lignes: number[], message: string): ScanPoint {
  const ligne = lignes[0] ?? null;
  const p: ScanPoint = {
    code: 'lignes-non-rapprochees', gravite: 'ecart', origine: 'controle', enjeu: 'argent', bloque: false, pese: true, champ: 'items',
    champs: lignes.map(l => `items.${l}.amountTTC`), ligne, lignes, cle: `lignes-non-rapprochees:${ligne ?? '-'}:${quoi}`,
    regle: 'chaque article est lu une fois, dans un seul morceau', lu: null, calcule: null, ecart: null, unite: 'lignes', message,
  };
  return { ...p, signature: signerPoint(p) };
}

export function assemblerMorceaux(parties: any[]): any {
  // Les lignes gardées (« dedans ») de chaque morceau et leur rang global ; rien d'autre n'est retiré.
  const gardees: any[] = [], rangs: Array<Map<number, number>> = [];
  const zones = parties.map(part => ({
    avant: part.items.filter((i: any) => zoneDe(i) === 'avant'), dedans: part.items.filter((i: any) => zoneDe(i) === 'dedans'), apres: part.items.filter((i: any) => zoneDe(i) === 'apres'),
  }));
  parties.forEach(part => {
    const carte = new Map<number, number>();
    part.items.forEach((item: any, j: number) => { if (zoneDe(item) === 'dedans') { gardees.push(sansZone(item)); carte.set(j + 1, gardees.length); } });
    rangs.push(carte);
  });
  const premier = (k: number) => rangs.slice(k).map(c => [...c.values()][0]).find(r => r !== undefined);
  const dernier = (k: number) => rangs.slice(0, k + 1).reverse().map(c => [...c.values()].at(-1)).find(r => r !== undefined);
  // D381 : chaque jonction recoupée des deux côtés ; une coupe à travers une ligne (aucune rangée blanche) signalée.
  const jonctions: ScanPoint[] = [];
  for (let k = 0; k + 1 < parties.length; k++) {
    const autour = [dernier(k), premier(k + 1)].filter((r): r is number => r !== undefined);
    if (!jonctionConcorde(zones[k], zones[k + 1]))
      jonctions.push(pointAssemblage(`jonction-${k + 1}`, autour,
        `Jonction des parties ${k + 1} et ${k + 2} : les deux lectures ne voient pas les mêmes articles autour de la coupe${autour.length ? ` (lignes ${autour.join(' et ')})` : ''} : une ligne peut manquer ou être doublée, à vérifier sur le document.`));
    if (parties[k].coupeForcee === true)
      jonctions.push(pointAssemblage(`coupe-${k + 1}`, autour,
        `Coupe entre les parties ${k + 1} et ${k + 2} sans espace blanc entre deux lignes${autour.length ? ` (lignes ${autour.join(' et ')})` : ''} : à vérifier sur le document.`));
  }
  const fusion = mergeDecoded(parties.map((part, k) => ({ ...part, items: zones[k].dedans })), { dedupe: false });
  const lu: any = finirUneLecture(normalizeInvoiceScan({ ...fusion, items: gardees }));
  // Les désaccords de lecture : ceux d'une ligne gardée suivent sa ligne ; l'en-tête vient du premier morceau, les totaux du dernier, le reste de tous.
  const cles = new Set<string>();
  const desaccords: ScanPoint[] = parties.flatMap((part, k) => (Array.isArray(part.points) ? part.points : []).flatMap((p: ScanPoint) => {
    if (p.origine !== 'lecture') return [];
    if (p.ligne === null) {
      const garde = EN_TETE.has(p.champ) ? k === 0 : TOTAUX.has(p.champ) ? k === parties.length - 1 : true;
      if (!garde || cles.has(p.cle)) return [];
      cles.add(p.cle);
      return [p];
    }
    const rang = rangs[k].get(p.ligne);
    return rang ? [decaler(p, rang, p.ligne)] : [];
  }));
  const points: ScanPoint[] = [...lu.points, ...desaccords, ...jonctions];
  const pesent = points.filter(p => p.pese);
  const revues = parties.map(p => p.review).filter(Boolean);
  const status = pesent.length ? 'disputed' : revues.some((r: any) => r.status === 'unavailable') ? 'unavailable' : 'checked';
  const findings = [...new Set(pesent.map(p => p.message))];
  return {
    ...lu, points,
    review: { status, readers: Math.min(...revues.map((r: any) => r.readers ?? 1), 3), correctedFields: [], findings },
    issues: [...new Set([...lu.issues, ...findings])], morceaux: parties.length,
  };
}
