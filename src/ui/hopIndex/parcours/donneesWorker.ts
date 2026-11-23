// Les données du brasseur envoyées au worker de l'app (w1, D115), sans renvoyer à chaque geste ce qui n'a pas changé.
// `donneesClonables()` (donnees.ts) donne tout ce qui diffère des fixtures : stock, dégustation, et le catalogue complet de c7 (505 variétés, descripteurs dépliés).
// Le catalogue est le gros morceau, et il ne change qu'à son arrivée : mais `configurerDonnees` est rappelée à chaque geste sur une dose (le brouillon change). Le renvoyer
// à chaque fois coûterait une copie structurée de plusieurs centaines de ko sur le fil principal, justement ce que le worker doit épargner. Le premier envoi le porte ;
// les suivants le marquent « inchangé » (`catalogueInchange`) tant que le tableau est le même (identité), et le worker garde le sien.
// D120 (t2) : la typicité du style est le défaut de Suggérer. Le worker ne charge pas sa table lui-même : il ne saurait pas quand elle est là, et une réponse calculée sans elle reviendrait à la page.
// La page la charge (`lancerTypicite`, donnees.ts), puis l'envoie dans le message `donnees` qui suit, UNE fois (le worker la garde) : les messages sont traités dans l'ordre d'envoi, donc toute requête
// envoyée après lit la table. Seul le code de la typicité (`poserTypicite`) est dans le worker ; la table arrive par le message.
import type { CatalogueHop } from '../../../domain/hopIndex/v4';
import { tableTypicitePosee, type TableTypicite } from '../../../domain/hopIndex/v4/typicite-acces';
import { poserTypicite } from '../../../domain/hopIndex/v4/typicite';
import { donnees, donneesClonables, configurerDonneesClonables, type DonneesClonables } from './donnees';

/** Le message `donnees` de l'app : les données clonables, `catalogueInchange` quand le catalogue et les fiches sont ceux du message précédent, et `typicite` la première fois que la table est là. */
export type DonneesApp = DonneesClonables & { catalogueInchange?: true; typicite?: TableTypicite };

/** Côté page : la fabrique des messages. Chaque appel rend les données à envoyer maintenant ; null : non clonables (le worker n'est pas employé). */
export function preparerEnvoi(
  lire: () => DonneesClonables | null = donneesClonables,
  courantes: () => { catalogue: CatalogueHop[]; fiches: CatalogueHop[] } = donnees,
  table: () => TableTypicite | null = tableTypicitePosee,
): () => DonneesApp | null {
  let envoye: { catalogue: CatalogueHop[]; fiches: CatalogueHop[] } | null = null;
  let tableEnvoyee: TableTypicite | null = null;
  return () => {
    const c = lire();
    if (c === null) return null;
    const { catalogue, fiches } = courantes();
    const inchange = !!envoye && envoye.catalogue === catalogue && envoye.fiches === fiches;
    envoye = { catalogue, fiches };
    const t = table();
    const avecTable: { typicite?: TableTypicite } = t && t !== tableEnvoyee ? { typicite: t } : {};
    if (t) tableEnvoyee = t;
    if (!inchange || (!c.catalogue && !c.fiches)) return { ...c, ...avecTable };
    const { catalogue: _c, fiches: _f, ...reste } = c;
    void _c; void _f;
    return { ...reste, catalogueInchange: true, ...avecTable };
  };
}

/** Côté worker : applique un message `donnees` ; un catalogue « inchangé » reprend celui du message précédent ; une table de typicité est posée AVANT la configuration (qui vide les caches). */
export function recevoirDonnees(
  configurer: (c: DonneesClonables) => void = configurerDonneesClonables,
  poser: (t: TableTypicite) => void = poserTypicite,
): (message: unknown) => void {
  let gardes: Pick<DonneesClonables, 'catalogue' | 'fiches'> = {};
  return (message) => {
    const { catalogueInchange, typicite, ...c } = message as DonneesApp;
    if (typicite) poser(typicite);
    if (catalogueInchange) configurer({ ...c, ...gardes });
    else { gardes = { ...(c.catalogue ? { catalogue: c.catalogue } : {}), ...(c.fiches ? { fiches: c.fiches } : {}) }; configurer(c); }
  };
}
