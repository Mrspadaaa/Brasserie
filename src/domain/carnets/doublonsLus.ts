/**
 * C65-6 / C66-6 : une page de houblon dit la même caractéristique sous plusieurs noms (« Année de récolte », « Récolte » et « Ernte » ; « Alpha » et « Acides alpha » ;
 * « Forme » et « Forme de houblon » ; « Pays de la récolte » et « Pays de récolte » ; « Conditionnement » et « Taille de l'emballage »). Le brasseur lit UNE ligne par
 * caractéristique, en français (observé en ligne : trois fois la récolte, dont une en allemand).
 *
 * Règle : dans une même famille de noms, les lignes qui disent la MÊME valeur se réunissent en une, à la place de la première, sous le nom français de la famille ; deux
 * valeurs qui se contredisent (12,8 % et 13 %) restent deux lignes : on ne choisit pas à la place de la page. Un nom allemand seul se dit en français. Un nom que la liste ne
 * connaît pas n'est jamais touché. Aucune valeur n'est inventée : la ligne gardée est une ligne lue.
 */
interface LigneLue { nom: string; valeur: unknown; unite?: string }

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

interface Famille { nom: string; noms: RegExp;  }

const FAMILLES: readonly Famille[] = [
  { nom: 'Année de récolte', noms: /^(?:annee de recolte|recolte|ernte|erntejahr|crop(?: year)?|harvest(?: year)?|millesime)$/ },
  { nom: 'Alpha', noms: /^(?:acides? alpha|alpha|alpha-?saeure|alphasaeure|alpha acids?)$/ },
  { nom: 'Bêta', noms: /^(?:acides? beta|beta|beta-?saeure|betasaeure|beta acids?)$/ },
  { nom: 'Forme', noms: /^(?:forme|forme de houblon|forme du houblon|hopfenform|hop form|form)$/ },
  { nom: 'Pays', noms: /^(?:pays|pays de la recolte|pays de recolte|pays d'origine|pays de production|herkunftsland|anbauland|country of origin)$/ },
  { nom: 'Conditionnement', noms: /^(?:conditionnement|taille de l'emballage|taille d'emballage|emballage|verpackungsgroesse|packungsgroesse|gebindegroesse|packaging)$/ }
];

const cleValeur = (l: LigneLue): string => `${String(l.valeur).replace(',', '.').trim().toLowerCase()}|${(l.unite ?? '').trim().toLowerCase()}`;
/* l'allemand écrit « ä » : après `sansAccent`, « a » ; on garde les deux écritures du « ss »/« ß » */
const normaliserNom = (nom: string) => sansAccent(nom).replace(/ß/g, 'ss');

/** Les lignes lues, une par caractéristique : les doublons de même valeur réunis, les noms étrangers dits en français. L'ordre de la page est gardé. */
export function reunirDoublons<T extends LigneLue>(lignes: readonly T[]): T[] {
  const sortie: Array<T | null> = [...lignes];
  const familleDe = (l: LigneLue) => FAMILLES.find(f => f.noms.test(normaliserNom(l.nom)));
  for (const f of FAMILLES) {
    const membres = sortie.map((l, i) => ({ l, i })).filter((x): x is { l: T; i: number } => x.l !== null && familleDe(x.l) === f);
    const vus = new Map<string, number>();
    for (const m of membres) {
      const k = cleValeur(m.l);
      if (!vus.has(k)) { vus.set(k, m.i); continue; }
      sortie[m.i] = null;
      const garde = sortie[vus.get(k)!] as T;
      if (garde.nom !== f.nom) sortie[vus.get(k)!] = { ...garde, nom: f.nom };
    }
    /* un nom allemand seul reste tel que la page l'écrit (Erntejahr, Total oil : carnetsTour25Client) ; « Ernte » seul se dit « Récolte » */
    const seul = membres.filter(m => sortie[m.i] !== null);
    if (f.nom === 'Année de récolte' && seul.length === 1 && normaliserNom((sortie[seul[0].i] as T).nom) === 'ernte') sortie[seul[0].i] = { ...(sortie[seul[0].i] as T), nom: 'Récolte' };
  }
  return sortie.filter((l): l is T => l !== null);
}
