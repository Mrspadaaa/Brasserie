import Dexie, { type Table } from 'dexie';
import { AiClient, type AiRequest, type AiResponse } from './aiClient';
import { NOMS_MAX_ENTREES, cleBase } from '../domain/nomsBase';
import { lireOptions } from '../ui/depense/optionsDuNom';

/**
 * La désignation en français des lignes d'une facture (voie f5c-noms-prod ; D271, D275, D278, D280).
 *
 * Un appel TEXTE SEUL à la tâche `traduireNoms` d'aiTask, à part de la lecture et sans l'attendre : il porte les noms de base
 * (`lireOptions(...).base`, options, état et suffixe d'unité déjà retirés), dédoublonnés ; ni image, ni montant, ni quantité, ni unité.
 * `gemini-3.8-flash` répond (routage du serveur, `functions/src/models.ts`). Consigne et schéma : ceux du banc `scripts/banc-noms-fr.ts`.
 *
 * Honnêteté : un nom français n'est qu'un libellé de plus. Hors ligne, en échec ou sur une réponse illisible, RIEN n'est posé : le nom imprimé
 * reste, sans exception vers l'appelant, sans nouvel essai. Une traduction n'est jamais une donnée de facture (montant, quantité, unité).
 *
 * Une table locale (Dexie, base à part `laffinee-noms`, jamais la version de la base principale) garde chaque traduction par clé de base
 * (`cleBase`) : une base déjà vue ne rappelle rien. Une traduction tapée par le brasseur (`par: 'brasseur'`) n'est jamais écrasée par l'IA.
 */

/** Une traduction gardée. `le` : l'instant où elle a été posée (ISO 8601, UTC). */
export interface NomEnregistre { cle: string; nameFr: string; le: string; par: 'ia' | 'brasseur' }

/**
 * La table des traductions. Toute opération peut échouer (IndexedDB fermée, quota) : l'appelant la traite alors comme une table absente.
 * `poser` rend l'entrée qui reste en table : une écriture `ia` ne remplace jamais une entrée `brasseur` (atomique) ; une écriture `brasseur` remplace tout.
 */
export interface TableNoms {
  lire(cle: string): Promise<NomEnregistre | undefined>;
  poser(entree: NomEnregistre): Promise<NomEnregistre>;
  oublier(cle: string): Promise<void>;
}

export const NOMS_DATABASE_NAME = 'laffinee-noms';
const DEXIE_SCHEMA_VERSION = 1;

class NomsDatabase extends Dexie {
  noms!: Table<NomEnregistre, string>;
  constructor(name: string) {
    super(name);
    this.version(DEXIE_SCHEMA_VERSION).stores({ noms: 'cle' });
  }
}

/** La table Dexie, dans sa base à part ; `null` sans IndexedDB (jsdom, node, navigation privée refusée). Modèle : `createDexieProofStore`. */
export function creerTableDexie(name = NOMS_DATABASE_NAME): TableNoms | null {
  if (typeof indexedDB === 'undefined') return null;
  let db: NomsDatabase | undefined;
  const open = () => (db ??= new NomsDatabase(name));
  return {
    lire: async cle => open().noms.get(cle),
    poser: async entree => {
      const base = open();
      return base.transaction('rw', base.noms, async () => {
        const actuelle = await base.noms.get(entree.cle);
        if (entree.par === 'ia' && actuelle?.par === 'brasseur') return actuelle;
        await base.noms.put(entree);
        return entree;
      });
    },
    oublier: async cle => { await open().noms.delete(cle); }
  };
}

/** Une table en mémoire : les tests, ou tout contexte sans IndexedDB qui voudrait tout de même garder. Même règle que la table Dexie. */
export function creerTableMemoire(): TableNoms & { rows: Map<string, NomEnregistre> } {
  const rows = new Map<string, NomEnregistre>();
  return {
    rows,
    lire: async cle => { const row = rows.get(cle); return row ? { ...row } : undefined; },
    poser: async entree => {
      const actuelle = rows.get(entree.cle);
      if (entree.par === 'ia' && actuelle?.par === 'brasseur') return { ...actuelle };
      rows.set(entree.cle, { ...entree });
      return { ...entree };
    },
    oublier: async cle => { rows.delete(cle); }
  };
}

let tableDefaut: TableNoms | null | undefined;
/** La table de l'app : Dexie quand IndexedDB existe, sinon aucune. Créée au premier besoin. */
const tableParDefaut = (): TableNoms | null => (tableDefaut === undefined ? (tableDefaut = creerTableDexie()) : tableDefaut);

/** Ce que l'appel lit d'une ligne du brouillon : l'imprimé (nom, variante, unité), son genre, sa catégorie, son lien au stock. Rien d'autre n'est lu ni envoyé. */
export interface LigneANommer {
  name: string; variant?: string; unit?: string; kind?: string; stockCategory?: string;
  stockAction?: 'none' | 'new' | 'existing'; stockRef?: string;
}

export interface OptionsNoms {
  /** Le stock courant : une ligne `existing` dont `stockRef` y figure est reliée, le nom de l'article sert, rien n'est appelé pour elle. */
  stock?: readonly { ref: string; name?: string }[];
  /** Hors ligne : aucun appel (les bases déjà en table se servent quand même). */
  enLigne: boolean;
  /** Le client de la tâche ; par défaut `AiClient.run`. Les tests injectent un faux. */
  run?: (req: AiRequest) => Promise<AiResponse>;
  /** Absente : la table de l'app (Dexie, ou aucune sans IndexedDB). `null` : pas de table. */
  table?: TableNoms | null;
  maintenant?: () => Date;
}

const NOM_MAX = 160;
const estUnTexte = (valeur: unknown): valeur is string => typeof valeur === 'string';

/** Les couples (`i`, `nameFr`) valables d'une réponse : `i` entier connu, une fois, `nameFr` non vide. Tout le reste est ignoré. */
function lireReponse(data: unknown, connus: ReadonlySet<number>): Map<number, string> {
  const retenus = new Map<number, string>();
  const noms = data !== null && typeof data === 'object' ? (data as { noms?: unknown }).noms : undefined;
  if (!Array.isArray(noms)) return retenus;
  for (const nom of noms) {
    const i = (nom as { i?: unknown } | null)?.i, nameFr = (nom as { nameFr?: unknown } | null)?.nameFr;
    if (typeof i !== 'number' || !Number.isInteger(i) || !connus.has(i) || retenus.has(i) || !estUnTexte(nameFr)) continue;
    const propre = nameFr.replace(/\s+/g, ' ').trim().slice(0, NOM_MAX).trim();
    if (propre) retenus.set(i, propre);
  }
  return retenus;
}

/** Une opération de table qui échoue vaut une table absente : jamais d'exception vers l'appelant. */
async function sans<T>(operation: () => Promise<T>): Promise<T | undefined> {
  try { return await operation(); } catch { return undefined; }
}

interface Groupe { cle: string; base: string; kind: string; stockCategory: string; rangs: number[] }

/**
 * Le français des lignes d'une pièce : `Map<rang, nameFr>` (rang = position dans `lignes`). Une ligne absente de la Map garde son nom imprimé.
 * Un seul appel par pièce, au plus `NOMS_MAX_ENTREES` noms ; aucune exception ; aucun nouvel essai.
 */
export async function traduireLignes(lignes: readonly LigneANommer[], options: OptionsNoms): Promise<Map<number, string>> {
  const resultat = new Map<number, string>();
  try {
    const refs = new Set((options.stock ?? []).map(article => article.ref));
    const groupes = new Map<string, Groupe>();
    lignes.forEach((ligne, rang) => {
      // reliée à un article du stock : le nom de l'article sert, rien à traduire
      if (ligne.stockAction === 'existing' && ligne.stockRef !== undefined && refs.has(ligne.stockRef)) return;
      const base = lireOptions(String(ligne.name ?? ''), ligne.variant === undefined || ligne.variant === null ? undefined : String(ligne.variant), String(ligne.unit ?? '')).base.trim();
      if (!base) return;
      const cle = cleBase(base), groupe = groupes.get(cle);
      if (groupe) groupe.rangs.push(rang);
      else groupes.set(cle, { cle, base, kind: String(ligne.kind ?? ''), stockCategory: String(ligne.stockCategory ?? ''), rangs: [rang] });
    });
    if (!groupes.size) return resultat;

    const table = options.table === undefined ? tableParDefaut() : options.table;
    const poser = (groupe: Groupe, nameFr: string) => { for (const rang of groupe.rangs) resultat.set(rang, nameFr); };

    // 1. La table : une base déjà vue (par l'IA ou par le brasseur) n'appelle rien.
    const restantes: Groupe[] = [];
    for (const groupe of groupes.values()) {
      const connue = table ? await sans(() => table.lire(groupe.cle)) : undefined;
      if (connue && estUnTexte(connue.nameFr) && connue.nameFr.trim()) poser(groupe, connue.nameFr);
      else restantes.push(groupe);
    }
    if (!restantes.length || options.enLigne !== true) return resultat;

    // 2. Un appel texte seul : l'entrée est { i, base, kind, stockCategory }, `i` le premier rang de la base.
    const envoyees = restantes.slice(0, NOMS_MAX_ENTREES);
    const parI = new Map(envoyees.map(groupe => [groupe.rangs[0], groupe]));
    const entrees = envoyees.map(groupe => ({ i: groupe.rangs[0], base: groupe.base, kind: groupe.kind, stockCategory: groupe.stockCategory }));
    const run = options.run ?? (req => AiClient.run(req));
    const reponse = await run({ task: 'traduireNoms', tier: 'fast', context: { entrees } });
    if (!reponse?.ok) return resultat;

    // 3. Ce qui est valable est posé, et gardé pour la prochaine fois (jamais sur la traduction d'un brasseur).
    const maintenant = (options.maintenant ?? (() => new Date()))().toISOString();
    for (const [i, nameFr] of lireReponse(reponse.data, new Set(parI.keys()))) {
      const groupe = parI.get(i)!;
      const gardee = table ? await sans(() => table.poser({ cle: groupe.cle, nameFr, le: maintenant, par: 'ia' })) : undefined;
      poser(groupe, gardee?.nameFr?.trim() ? gardee.nameFr : nameFr);
    }
  } catch {
    // jamais d'exception vers l'appelant : ce qui est déjà posé reste, le reste garde le nom imprimé
  }
  return resultat;
}

/**
 * Le brasseur retouche le nom d'une ligne : sa traduction est gardée pour cette base (`par: 'brasseur'`), l'IA ne la remplace plus.
 * Un nom vidé retire l'entrée (la base pourra être retraduite). Ne lève jamais.
 */
export async function retenirNomBrasseur(ligne: Pick<LigneANommer, 'name' | 'variant' | 'unit'>, nameFr: string, options: { table?: TableNoms | null; maintenant?: () => Date } = {}): Promise<void> {
  try {
    const table = options.table === undefined ? tableParDefaut() : options.table;
    if (!table) return;
    const base = lireOptions(String(ligne.name ?? ''), ligne.variant === undefined || ligne.variant === null ? undefined : String(ligne.variant), String(ligne.unit ?? '')).base.trim();
    const cle = cleBase(base), nom = nameFr.replace(/\s+/g, ' ').trim().slice(0, NOM_MAX).trim();
    if (!cle) return;
    if (!nom) { await table.oublier(cle); return; }
    await table.poser({ cle, nameFr: nom, le: (options.maintenant ?? (() => new Date()))().toISOString(), par: 'brasseur' });
  } catch {
    // le nom reste sur la ligne ; la table n'a simplement pas retenu
  }
}
