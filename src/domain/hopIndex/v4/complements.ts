// d3a-fusion (#180, D154) : les compléments des 18 sources de houblons, fusionnés par scripts/collecte-hop/fusion.mjs dans
// src/data/hopV4/complements.json. Ce module les lit : jamais au démarrage (import dynamique, à la demande), jamais par le moteur.
// Une valeur vient de sa source, avec son URL et son année si elle est publiée. L'enveloppe va du plus bas au plus haut des valeurs
// valides de même unité et de même base : jamais une moyenne. Un inconnu est absent (null / []), jamais 0.

/** libre : licence ouverte ou domaine public ; restreinte : des conditions demandent un accord écrit (accord de l'utilisateur, 26.10) ; inconnue : rien trouvé. */
export type DiffusionSource = 'libre' | 'restreinte' | 'inconnue';
export interface SourceComplement {
  id: string; nom: string; hote: string; type: string | null; diffusion: DiffusionSource;
  /** Ce qui a été lu des conditions de la source (page, phrase clé), pour la trace. */
  lu: string; decision?: string; releve: string | null;
}
/** Les champs fusionnés. Les composés de l'huile sont en % de l'huile ; α, β, polyphénols, xanthohumol en % de la masse. */
export const CHAMPS_COMPLEMENTS = [
  'alpha', 'beta', 'huile', 'cohumulone', 'colupulone', 'myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalol', 'geraniol', 'betaPinene', 'selinene',
  'undecanone2', 'esters_alcools_terpeniques', 'cetones', 'isobutyrates', 'monoterpenes', 'sesquiterpenes', 'polyphenols', 'xanthohumol', 'thiols',
  'intensite_arome', 'conservation', 'hsi', 'rendement', 'rapportHC', 'linalolAcide', 'resinesDures',
  'arome_citrusy', 'arome_fruity', 'arome_floral', 'arome_herbal', 'arome_spicy', 'arome_resinous', 'arome_sugarlike', 'arome_divers',
] as const;
export type ChampComplement = (typeof CHAMPS_COMPLEMENTS)[number];

/** Une valeur publiée par une source pour une variété. min ou max peut être null (« jusqu'à 2 % », « plus de… ») ; jamais 0 pour un inconnu. */
export interface ValeurSource {
  source: SourceComplement; min: number | null; max: number | null;
  /** Année publiée par la fiche, sinon null. */
  annee: number | null; url: string | null;
  /** Vrai : valeur gardée mais hors de l'enveloppe (unité ou base inconnue ou différente, valeur suspecte). */
  horsEnveloppe: boolean; suspect: boolean;
  /** Pourquoi elle est hors de l'enveloppe (texte), sinon null. */
  raison: string | null;
}
/** [min, max] : l'un des deux peut être null quand aucune valeur valide ne donne cette borne. */
export type EnveloppeComplement = [number | null, number | null];

/** Le contenu de complements.json (format compact : voir fusion.mjs). */
export interface ComplementsBrut {
  version: number;
  sources: SourceComplement[];
  champs: Record<string, { libelle: string; unite: string | null; base: string }>;
  raisons: Record<string, [string, string]>;
  varietes: Record<string, {
    /** Fiches : [index de la source, URL, année publiée]. */
    f: [number, string | null, number | null][];
    /** Par champ : enveloppe `e` et valeurs `v` = [index de fiche, min, max, code de raison?]. */
    c: Record<string, { e?: EnveloppeComplement; v: [number, number | null, number | null, string?][] }>;
  }>;
}

export interface Complements {
  sources: SourceComplement[];
  champs: ComplementsBrut['champs'];
  /** Les ids de variété qui ont au moins une valeur. */
  ids(): string[];
  valeursDe(id: string, champ: ChampComplement): ValeurSource[];
  enveloppeDe(id: string, champ: ChampComplement): EnveloppeComplement | null;
}

/** Fabrique la vue typée d'un contenu de complements.json (aussi utilisée sur un mini jeu dans les tests). */
export function lireComplements(brut: ComplementsBrut): Complements {
  const ids = Object.keys(brut.varietes).sort();
  return {
    sources: brut.sources,
    champs: brut.champs,
    ids: () => ids,
    valeursDe(id, champ) {
      const v = brut.varietes[id];
      const c = v?.c[champ];
      if (!v || !c) return [];
      return c.v.map(([fi, min, max, code]) => {
        const fiche = v.f[fi];
        const raison = code ? brut.raisons[code] : undefined;
        return {
          source: brut.sources[fiche[0]], min, max, annee: fiche[2], url: fiche[1],
          horsEnveloppe: !!code, suspect: raison?.[0] === 'suspect', raison: raison ? raison[1] : null,
        };
      });
    },
    enveloppeDe(id, champ) {
      const e = brut.varietes[id]?.c[champ]?.e;
      return e ? [e[0], e[1]] : null;
    },
  };
}

let charge: Complements | null = null;
let enCours: Promise<Complements> | null = null;
/** Charge les compléments à la demande (import dynamique : un morceau à part, absent du démarrage). Un seul chargement, partagé. */
export function chargerComplements(): Promise<Complements> {
  enCours ??= import('../../../data/hopV4/complements.json')
    .then((m) => (charge = lireComplements((m.default ?? m) as unknown as ComplementsBrut)))
    .catch((e) => { enCours = null; throw e; });
  return enCours;
}
/** Les compléments déjà chargés, sinon null (jamais de chargement implicite). */
export const complementsCharges = (): Complements | null => charge;
/** Valeurs d'une variété pour un champ, une par source et par fiche ; [] tant que les compléments ne sont pas chargés. */
export const valeursDe = (id: string, champ: ChampComplement): ValeurSource[] => charge?.valeursDe(id, champ) ?? [];
/** Enveloppe des valeurs valides ; null si inconnue ou si les compléments ne sont pas chargés. */
export const enveloppeDe = (id: string, champ: ChampComplement): EnveloppeComplement | null => charge?.enveloppeDe(id, champ) ?? null;
