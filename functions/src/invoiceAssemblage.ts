/**
 * D380, D381 : l'assemblage d'une longue pièce lue en morceaux. Aucune IA, aucun coût : les résultats des morceaux (chacun lu par le vote habituel,
 * `scanInvoice` avec `morceau`) → une seule lecture au format de production.
 *
 * « On peut pas se permettre de perdre ou "gagner" de l'information » (03.11). Les morceaux sont coupés dans le blanc, bord à bord, sans voisins
 * visibles : chaque ligne imprimée n'est vue que par un morceau. Rien n'est donc jamais retiré ni dédoublonné : les lignes sont mises bout à bout.
 * Seul recollage : une ligne marquée `suite` en haut d'un morceau (un article sur plusieurs lignes coupé entre elles) complète le dernier article
 * du morceau précédent, et c'est toujours signalé. Une coupe sans blanc, un morceau manquant : point qui pèse ou refus, jamais silencieux.
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
/** Ce qu'une suite d'article peut apporter à l'article qu'elle complète (seulement là où il est vide). */
const CHAMPS_DE_SUITE = ['quantity', 'unit', 'price', 'amountTTC', 'variant', 'reference', 'vatCode'];

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

/**
 * D381 : les bandes de contrôle des coupes, reçues du client : `{ k, items }` (la bande lue à cheval sur la coupe entre les morceaux k et k + 1)
 * ou `{ k, sautDePage: true }` (la coupe est un saut de page du PDF : rien à recouper).
 */
export function jonctionsRecues(context: unknown): Map<number, { items?: any[]; sautDePage?: boolean }> {
  const liste = (context as { jonctions?: unknown } | null)?.jonctions, carte = new Map<number, { items?: any[]; sautDePage?: boolean }>();
  if (!Array.isArray(liste)) return carte;
  for (const j of liste) if (j && Number.isSafeInteger(j.k) && (j.sautDePage === true || Array.isArray(j.items))) carte.set(j.k, j.sautDePage === true ? { sautDePage: true } : { items: j.items });
  return carte;
}

const vide = (v: unknown) => v === null || v === undefined || v === '';
const sansSuite = ({ suite: _suite, ...item }: any) => item;

/** Décale un point de lecture d'une ligne du morceau vers son rang global (cellules `items.<i>` comprises), signature refaite. */
function decaler(point: ScanPoint, rang: number, local: number): ScanPoint {
  const champs = point.champs.map(c => c.replace(/^items\.(\d+)\./, (_, i) => `items.${Number(i) - local + rang}.`));
  const p = { ...point, ligne: rang, lignes: point.lignes?.map(l => l - local + rang), champs, cle: `${point.code}:${rang}:${point.champ}` };
  return { ...p, signature: signerPoint(p) };
}

/** Un point de l'assemblage lui-même (suite recollée, coupe sans blanc) : il pèse, il ne bloque pas l'enregistrement, le brasseur le voit. */
function pointAssemblage(quoi: string, lignes: number[], message: string): ScanPoint {
  const ligne = lignes[0] ?? null;
  const p: ScanPoint = {
    code: 'lignes-non-rapprochees', gravite: 'ecart', origine: 'controle', enjeu: 'argent', bloque: false, pese: true, champ: 'items',
    champs: lignes.map(l => `items.${l}.amountTTC`), ligne, lignes, cle: `lignes-non-rapprochees:${ligne ?? '-'}:${quoi}`,
    regle: 'chaque ligne imprimée est lue une fois, dans un seul morceau', lu: null, calcule: null, ecart: null, unite: 'lignes', message,
  };
  return { ...p, signature: signerPoint(p) };
}

export function assemblerMorceaux(parties: any[], jonctions: Map<number, { items?: any[]; sautDePage?: boolean }> = new Map()): any {
  // Les lignes de chaque morceau mises bout à bout, et leur rang global ; une suite en tête complète le dernier article déjà gardé.
  const gardees: any[] = [], rangs: Array<Map<number, number>> = [], signales: ScanPoint[] = [];
  parties.forEach((part, k) => {
    const carte = new Map<number, number>();
    part.items.forEach((item: any, j: number) => {
      const enTete = part.items.slice(0, j).every((avant: any) => avant?.suite === true);
      if (item?.suite === true && enTete && gardees.length) {
        const cible = gardees[gardees.length - 1], rang = gardees.length;
        CHAMPS_DE_SUITE.forEach(champ => { if (vide(cible[champ]) && !vide(item[champ])) cible[champ] = item[champ]; });
        carte.set(j + 1, rang);
        signales.push(pointAssemblage(`suite-${k + 1}`, [rang],
          `Ligne ${rang} : article coupé entre les parties ${k} et ${k + 1}, recollé (${String(cible.name || 'sans désignation').slice(0, 60)}) : à vérifier sur le document.`));
        return;
      }
      gardees.push(sansSuite(item));
      carte.set(j + 1, gardees.length);
      if (item?.suite === true)
        signales.push(pointAssemblage(`suite-${k + 1}-${j + 1}`, [gardees.length],
          `Ligne ${gardees.length} : lue comme la suite d'un article sans article à compléter : à vérifier sur le document.`));
    });
    rangs.push(carte);
  });
  for (let k = 0; k + 1 < parties.length; k++) {
    const autour = [[...rangs[k].values()].at(-1), [...rangs[k + 1].values()][0]].filter((r): r is number => r !== undefined);
    // La bande de contrôle : lue à part, seulement comparée (une alerte, jamais une ligne changée).
    const bande = jonctions.get(k + 1);
    if (!bande?.sautDePage) {
      // Les lignes gardées du haut et du bas ; une suite recollée appartient au haut (son article y commence).
      const hauts = [...new Set(rangs[k].values())], dernierHaut = Math.max(0, ...hauts);
      const haut = hauts.map(r => gardees[r - 1]), bas = [...new Set(rangs[k + 1].values())].filter(r => r > dernierHaut).map(r => gardees[r - 1]);
      if (!bande?.items)
        signales.push(pointAssemblage(`jonction-${k + 1}`, autour, `Jonction des parties ${k + 1} et ${k + 2} non recoupée (bande de contrôle absente) : à vérifier sur le document.`));
      else if (!jonctionConcorde(bande.items, haut, bas))
        signales.push(pointAssemblage(`jonction-${k + 1}`, autour,
          `Jonction des parties ${k + 1} et ${k + 2} : la bande de contrôle ne retrouve pas les mêmes lignes de part et d'autre de la coupe${autour.length ? ` (lignes ${autour.join(' et ')})` : ''} : une ligne peut manquer ou être doublée, à vérifier sur le document.`));
    }
    if (parties[k].coupeForcee !== true) continue;
    signales.push(pointAssemblage(`coupe-${k + 1}`, autour,
      `Coupe entre les parties ${k + 1} et ${k + 2} sans espace blanc entre deux lignes${autour.length ? ` (lignes ${autour.join(' et ')})` : ''} : une ligne peut manquer ou être doublée, à vérifier sur le document.`));
  }
  const fusion = mergeDecoded(parties.map(part => ({ ...part, items: [] })), { dedupe: false });
  const lu: any = finirUneLecture(normalizeInvoiceScan({ ...fusion, items: gardees }));
  // Les désaccords de lecture : ceux d'une ligne suivent sa ligne ; l'en-tête vient du premier morceau, les totaux du dernier, le reste de tous.
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
  const points: ScanPoint[] = [...lu.points, ...desaccords, ...signales];
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
