// s1-sources-lignes (26.10) : d'où viennent les sources d'une barre de valeur. Un seul endroit, lu par Substituer (traits fins
// par source) et par Comparer (rangées α et β, une enveloppe) : les deux écrans montrent donc les mêmes valeurs d'un houblon.
//  - Beer Maverick : le catalogue du moteur (`alpha`, `beta`, `oils`) ;
//  - Hopsteiner : la fiche reliée du catalogue (`hs.alpha`, `hs.beta`, `hsLinalool`) ;
//  - les 18 sources de complements.json (d3a), par `complementsCharges()` : seulement les valeurs valides, c'est-à-dire dans
//    l'enveloppe (ni suspectes, ni d'unité ou de base inconnue) et à deux bornes. Une borne ouverte (« jusqu'à 2 ») ne se dessine
//    pas en trait : elle reste dans la feuille Sources de la fiche. Tant que les compléments ne sont pas chargés : le catalogue seul.
// La fiche Hopsteiner du catalogue et la source `hopsteiner` des compléments sont la même fiche : quand le catalogue porte la
// valeur, celle des compléments n'est pas dessinée une seconde fois.
import { complementsCharges, type ChampComplement } from '../../../domain/hopIndex/v4/complements';
import { hopRef } from '../parcours/v4';
import { nomCourt, refDe } from '../fiche/complements-ui';
import type { Plage, SourcePlage } from './plagesSources';

export type ChampBarre = 'alpha' | 'beta' | 'myrcene' | 'humulene' | 'caryophyllene' | 'linalol';

const BM = { nom: 'Beer Maverick', ref: 'BM' } as const;
const HS = { nom: 'Hopsteiner', ref: 'HS' } as const;

/** Les valeurs des compléments d'une variété pour un champ : valides, à deux bornes (min ≤ max). */
function desComplements(id: string, champ: ChampComplement, sansHopsteiner: boolean): SourcePlage[] {
  const c = complementsCharges();
  if (!c) return [];
  return c.valeursDe(id, champ)
    .filter((v) => !v.horsEnveloppe && v.min != null && v.max != null && v.min <= v.max && !(sansHopsteiner && v.source.id === 'hopsteiner'))
    .map((v) => ({ nom: nomCourt(v), ref: refDe(v), r: [v.min!, v.max!] as Plage }));
}

/** Toutes les sources d'une barre pour un houblon (clé du moteur), du catalogue d'abord, puis les compléments : une entrée par
 * source et par fiche. Vide quand aucune source ne donne le champ (jamais 0). */
export function sourcesDeBarre(cle: string, champ: ChampBarre): SourcePlage[] {
  const ref = hopRef(cle);
  const c = ref?.catalogue;
  if (!ref || !c) return [];
  const bm: Plage | null | undefined = champ === 'alpha' ? c.alpha : champ === 'beta' ? c.beta : champ === 'linalol' ? null : c.oils?.[champ];
  const hs: Plage | null | undefined = champ === 'alpha' ? c.hs?.alpha : champ === 'beta' ? c.hs?.beta : champ === 'linalol' ? c.hsLinalool?.range : null;
  return [
    ...(bm ? [{ ...BM, r: bm }] : []),
    ...(hs ? [{ ...HS, r: hs }] : []),
    ...desComplements(c.id ?? cle, champ, !!hs),
  ];
}
