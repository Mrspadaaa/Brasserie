import type { RequeteFiche } from './enrichissement';
import type { TravailFiche } from './enrichissementStore';
import type { FicheLevure } from '../domain/stock/ficheLevure';
import { fabricantEcrit, marqueDe } from '../domain/stock/ficheCle';
import type { ChampFiche } from '../domain/stock/ficheValeurs';

/**
 * La requête de la procédure d'enrichissement et sa porte « produit identifiable » (voie f4-enrichir, PLAN § 3.5), tirées de
 * `enrichissementTravail.ts` pour que le banc (`scripts/banc-enrichissement.ts`) construise la MÊME requête que la production sans importer
 * le stock ni Firestore. Module pur : types seulement venus de la file, aucune écriture, aucun réseau.
 */

/** Le produit est-il assez nommé pour une recherche (PLAN § 3.5) ? */
export function identifiable(t: TravailFiche, levure?: FicheLevure): boolean {
  if (t.famille === 'levure') return levure?.cas === 'aucun';
  if (t.famille !== 'malt') return false;
  return Boolean(fabricantEcrit(t.ligne.nomPropre) || marqueDe(t.ligne.nomPropre) || (t.ligne.fournisseur && t.ligne.reference));
}
export const MANQUANT: Readonly<Record<'malt' | 'levure', Partial<Record<ChampFiche, string>>>> = {
  malt: { colorEbc: 'couleur EBC', potentialPpg: 'potentiel PPG' },
  levure: { yeastAttenuationPct: 'atténuation', yeastTempMinC: 'température minimale', yeastTempMaxC: 'température maximale', yeastLab: 'laboratoire' },
};
/** La requête : jamais son nom, son adresse ni un montant ; seulement le produit, le fournisseur et le code imprimé. */
export function requeteDe(t: TravailFiche, trous: readonly ChampFiche[]): RequeteFiche {
  const kind = t.famille === 'levure' ? 'levure' as const : 'malt' as const;
  const manquant = trous.map(c => MANQUANT[kind][c]).filter((x): x is string => Boolean(x));
  const type = kind === 'malt' ? (t.ligne.stockCategory?.toLowerCase().startsWith('suc') || /sucre|zucker|sugar|dextrose|candi/i.test(t.ligne.description) ? 'sucre' : 'grain') : undefined;
  const known = { ...(t.ligne.lu.origine ? { origin: t.ligne.lu.origine } : {}), ...(t.ligne.lu.ebc !== undefined ? { colorEbc: t.ligne.lu.ebc } : {}) };
  return {
    kind, name: t.ligne.nomPropre, instruction: `${kind} : ${t.ligne.nomPropre}`,
    context: { kind, ...(type ? { type } : {}), name: t.ligne.nomPropre, manquant, ...(t.ligne.fournisseur ? { supplier: t.ligne.fournisseur } : {}),
      ...(t.ligne.reference ? { reference: t.ligne.reference } : {}), known },
  };
}
