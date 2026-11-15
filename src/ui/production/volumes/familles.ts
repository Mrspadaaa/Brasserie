// Les bandes de familles d'arômes d'un houblon de la liste de pesée (e10c, k3 n° 5 : sans α). Source citée : le radar Beer
// Maverick du catalogue (`bm.arome`, 0 à 5 par famille, neuf axes). Une famille sans valeur n'est pas dessinée ; un houblon
// inconnu du catalogue n'a aucune bande (jamais une bande inventée). Chargé à la demande : le moteur houblons reste hors du
// paquet de l'onglet.
import type { FamilyId } from '../../../domain/hopIndex/v4/families';

export type FamillesDuHoublon = FamilyId[];

const norm = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Jusqu'à quatre familles par force décroissante (radar > 0), par nom ou alias de variété. */
export async function famillesDe(noms: string[]): Promise<Record<string, FamillesDuHoublon>> {
  const [{ courant }, { radarDe }, { ROUE }] = await Promise.all([
    import('../../../domain/hopIndex/v4/data'),
    import('../../../domain/hopIndex/v4/departage'),
    import('../../hopIndex/familyTokens')
  ]);
  const catalogue = [...courant().catalogueById.values()];
  const sortie: Record<string, FamillesDuHoublon> = {};
  for (const nom of new Set(noms)) {
    const n = norm(nom.replace(/\bcryo\b/i, ''));
    const hop = catalogue.find(h => norm(h.name) === n || h.aliases.some(a => norm(a) === n));
    if (!hop) continue;
    const forces = ROUE.map(f => ({ f, v: radarDe(hop, f) })).filter((x): x is { f: FamilyId; v: number } => x.v != null && x.v > 0);
    forces.sort((a, b) => b.v - a.v);
    if (forces.length) sortie[nom] = forces.slice(0, 4).map(x => x.f);
  }
  return sortie;
}
