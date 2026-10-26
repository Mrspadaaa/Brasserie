// Les données du brasseur envoyées au worker de l'app (w1, D115), sans renvoyer à chaque geste ce qui n'a pas changé.
// `donneesClonables()` (donnees.ts) donne tout ce qui diffère des fixtures : stock, dégustation, et le catalogue complet de c7 (505 variétés, descripteurs dépliés).
// Le catalogue est le gros morceau, et il ne change qu'à son arrivée : mais `configurerDonnees` est rappelée à chaque geste sur une dose (le brouillon change). Le renvoyer
// à chaque fois coûterait une copie structurée de plusieurs centaines de ko sur le fil principal, justement ce que le worker doit épargner. Le premier envoi le porte ;
// les suivants le marquent « inchangé » (`catalogueInchange`) tant que le tableau est le même (identité), et le worker garde le sien.
import type { CatalogueHop } from '../../../domain/hopIndex/v4';
import { donnees, donneesClonables, configurerDonneesClonables, type DonneesClonables } from './donnees';

/** Le message `donnees` de l'app : les données clonables, et `catalogueInchange` quand le catalogue et les fiches sont ceux du message précédent. */
export type DonneesApp = DonneesClonables & { catalogueInchange?: true };

/** Côté page : la fabrique des messages. Chaque appel rend les données à envoyer maintenant ; null : non clonables (le worker n'est pas employé). */
export function preparerEnvoi(
  lire: () => DonneesClonables | null = donneesClonables,
  courantes: () => { catalogue: CatalogueHop[]; fiches: CatalogueHop[] } = donnees,
): () => DonneesApp | null {
  let envoye: { catalogue: CatalogueHop[]; fiches: CatalogueHop[] } | null = null;
  return () => {
    const c = lire();
    if (c === null) return null;
    const { catalogue, fiches } = courantes();
    const inchange = !!envoye && envoye.catalogue === catalogue && envoye.fiches === fiches;
    envoye = { catalogue, fiches };
    if (!inchange || (!c.catalogue && !c.fiches)) return c;
    const { catalogue: _c, fiches: _f, ...reste } = c;
    void _c; void _f;
    return { ...reste, catalogueInchange: true };
  };
}

/** Côté worker : applique un message `donnees` ; un catalogue « inchangé » reprend celui du message précédent. */
export function recevoirDonnees(configurer: (c: DonneesClonables) => void = configurerDonneesClonables): (message: unknown) => void {
  let gardes: Pick<DonneesClonables, 'catalogue' | 'fiches'> = {};
  return (message) => {
    const { catalogueInchange, ...c } = message as DonneesApp;
    if (catalogueInchange) configurer({ ...c, ...gardes });
    else { gardes = { ...(c.catalogue ? { catalogue: c.catalogue } : {}), ...(c.fiches ? { fiches: c.fiches } : {}) }; configurer(c); }
  };
}
