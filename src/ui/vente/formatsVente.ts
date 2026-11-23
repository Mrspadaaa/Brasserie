import type { Batch, KegItem, PricingItem } from '../../types';
import type { FormatVente } from '../../domain/finance/chaineLitre';

/** Les trois formats de la caisse (v3a). Le fût prend la capacité des fûts du brassin ; 20 L n'est qu'un repli « à vérifier ». */
export const FUT_REPLI_L = 20;
/** Des litres avec la virgule de l'app (« 0,33 », jamais « 0.33 »). */
export const litres = (n: number): string => String(n).replace('.', ',');
export const FORMATS_VENTE: FormatVente[] = [
  { id: '33cl', label: '33 cl', volumeL: 0.33 },
  { id: '75cl', label: '75 cl', volumeL: 0.75 },
  { id: 'fut', label: `fût ${litres(FUT_REPLI_L)} L`, volumeL: FUT_REPLI_L }
];

const sansAccent = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const normaliser = (t: string): string => sansAccent(t).replace(/\s+/g, ' ').trim();

/** Le format reconnu dans le nom d'un tarif (« Pale Ale 33 cl », « Fût 20 L »), sinon `null` : le tarif passe alors par « Autre ». */
export function formatDepuisTarif(product: string): '33cl' | '75cl' | 'fut' | null {
  const t = normaliser(product);
  if (/(^|\D)33\s*cl\b/.test(t)) return '33cl';
  if (/(^|\D)75\s*cl\b/.test(t)) return '75cl';
  if (/\bfut\b/.test(t)) return 'fut';
  return null;
}

/** Le nom de la bière dans un tarif : le nom sans le format (« Pale Ale 33 cl » → « pale ale »). */
export const biereDuTarif = (product: string): string => normaliser(product).replace(/\b33\s*cl\b|\b75\s*cl\b|\bfut\b(\s*\d+\s*l\b)?|\b(bouteilles?|canettes?|cartons?|futs?)\b/g, '').replace(/\s+/g, ' ').trim();

/**
 * Le tarif d'un format pour une bière : correspondance sur le format ET le nom de la bière (D3, REVUE-A 7). Un seul candidat → lui ;
 * aucun ou plusieurs → `null` (« prix ? » : le brasseur le donne sur la ligne libre, jamais 0).
 */
export function tarifDuFormat(tarifs: PricingItem[], formatId: string, nomBiere: string | undefined): PricingItem | null {
  const biere = normaliser(nomBiere ?? '');
  // Un tarif porté depuis l'écran Prix (c7c) écrit son format et sa bière : ils priment sur le nom ; un ancien tarif se lit du nom.
  const candidats = tarifs.filter(t => (t.format?.id ?? formatDepuisTarif(t.product)) === formatId).filter(t => {
    const part = t.biere ? normaliser(t.biere) : biereDuTarif(t.product);
    return !part || !biere || biere.includes(part) || part.includes(biere);
  });
  return candidats.length === 1 && Number.isFinite(candidats[0].priceHT) && candidats[0].priceHT > 0 ? candidats[0] : null;
}

export interface FormatDuBrassin { format: FormatVente; present: boolean; aVerifier: boolean }

/** Les formats d'un brassin : un format absent du conditionnement (0 bouteille de 75 cl) reste affiché mais atténué ; le fût prend la capacité de ses fûts. */
export function formatsDuBrassin(batch: Batch | undefined, kegs: KegItem[]): FormatDuBrassin[] {
  const p = batch?.packaging;
  const futs = (p?.kegIds ?? []).map(id => kegs.find(k => k.id === id)?.capacityL).filter((c): c is number => typeof c === 'number' && c > 0);
  const capacite = futs.length ? Math.max(...futs) : undefined;
  return [
    { format: FORMATS_VENTE[0], present: !batch || !p || p.bottles33 > 0, aVerifier: false },
    { format: FORMATS_VENTE[1], present: !batch || !p || p.bottles75 > 0, aVerifier: false },
    { format: { ...FORMATS_VENTE[2], volumeL: capacite ?? FUT_REPLI_L, label: `fût ${litres(capacite ?? FUT_REPLI_L)} L` }, present: !batch || !p || (p.kegIds?.length ?? 0) > 0, aVerifier: capacite === undefined }
  ];
}
