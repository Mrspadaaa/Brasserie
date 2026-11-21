/**
 * Nom posé par défaut d'une chose créée (D396, G3 avec le nom de G1, 21.11 : « J'aime bien g1 et g3 »).
 * Motif standard des éditeurs (« Document sans titre », « nouveau dossier 2 ») : une base tirée du contexte, puis le numéro libre suivant.
 * Le nom posé se garde d'un toucher ou se renomme ; il n'est jamais un choix fait à la place du brasseur (PORT, État de l'art).
 *
 *   événement : la rangée et la semaine           → « Travaux · S47 », puis « Travaux · S47 · 2 »
 *   recette   : le style, numéroté                 → « IPA n° 3 » si « IPA n° 1 » et « IPA n° 2 » existent (k = plus grand + 1)
 *   matériel  : le projet du carnet, sinon la catégorie → « Pompe de brassage », « Matériel de mesure », puis « … 2 »
 *   client, idée : pas de nom par défaut (R12 : le texte EST la chose créée) → `null`
 *
 * Fonction pure, sans date ni horloge : la semaine est donnée par l'appelant (semaine ISO de la frise, `etiquetteS`).
 */

export type ContexteNom =
  | { genre: 'evenement'; rangee: string; semaine: number }
  | { genre: 'recette'; style?: string }
  | { genre: 'materiel'; projet?: string; categorie?: string }
  | { genre: 'client' }
  | { genre: 'idee' };

/** Comparaison des noms : sans accents, sans casse, espaces réduits (la normalisation déjà employée par l'Atelier). */
export const normaliserNom = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** « Matériel de mesure », « Matériel d'atelier », « Matériel » sans catégorie. */
export function baseMateriel(categorie?: string): string {
  const c = (categorie ?? '').trim();
  if (!c) return 'Matériel';
  const bas = c.charAt(0).toLocaleLowerCase('fr') + c.slice(1);
  return /^[aeiouyhàâéèêëîïôöûü]/i.test(bas) ? `Matériel d'${bas}` : `Matériel de ${bas}`;
}

/**
 * Le plus grand numéro déjà porté par « <base> n° k » (ou « no k », « nº k », « #k »), où qu'il soit dans le nom
 * (« ZZ TEST IPA n° 2 », « IPA n° 2 — Citra » comptent). 0 si aucun.
 */
export function plusGrandNumero(base: string, noms: readonly string[]): number {
  const b = echapper(normaliserNom(base));
  const re = new RegExp(`(?:^|[^a-z0-9])${b}\\s*(?:n\\s*[°º]|no\\.?|#)\\s*(\\d+)(?!\\d)`);
  let max = 0;
  for (const n of noms) {
    const m = normaliserNom(n).match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/** `base` s'il est libre, sinon `base<sep>2`, `base<sep>3`… (le premier libre). */
export function premierLibre(base: string, noms: readonly string[], sep = ' '): string {
  const pris = new Set(noms.map(normaliserNom));
  if (!pris.has(normaliserNom(base))) return base;
  for (let k = 2; ; k++) {
    const essai = `${base}${sep}${k}`;
    if (!pris.has(normaliserNom(essai))) return essai;
  }
}

/** Le nom posé d'une chose créée, ou `null` quand le nom est la chose elle-même (client, idée). */
export function nomParDefaut(ctx: ContexteNom, nomsExistants: readonly string[] = []): string | null {
  switch (ctx.genre) {
    case 'evenement': {
      const rangee = ctx.rangee.trim() || 'Événement';
      return premierLibre(`${rangee} · S${ctx.semaine}`, nomsExistants, ' · ');
    }
    case 'recette': {
      const base = (ctx.style ?? '').trim() || 'Recette';
      return `${base} n° ${plusGrandNumero(base, nomsExistants) + 1}`;
    }
    case 'materiel': {
      const projet = (ctx.projet ?? '').trim();
      return premierLibre(projet || baseMateriel(ctx.categorie), nomsExistants);
    }
    case 'client':
    case 'idee':
      return null;
  }
}
