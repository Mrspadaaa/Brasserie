import { normalize } from '../../services/search';
import type { EcranId, PlusCle, PlusMenu, PlusTon } from '../../domain/plusEcran';

/**
 * Les règles de la recherche r3p2 (« le geste d'abord, au pouce »), sans écran : ce que la feuille montre d'abord (Aller à, Créer,
 * Reprendre, Ici), comment un résultat se classe, ce que « 3 de plus dans les archives » compte, comment se surlignent les lettres tapées.
 *
 * Aucune liste de gestes n'est refaite ici : « Ici » lit `plusMenuFor` (la table par écran du + de b1), la même que la feuille du +.
 */

export type TypeResultat = 'article' | 'recette' | 'brassin' | 'ecriture' | 'client';

/** Le type d'un résultat, lu sur le préfixe de son identifiant (`stk-`, `rec-`, `bat-`, `tx-`, `cli-`). */
export function typeDeId(id: string): TypeResultat | undefined {
  if (id.startsWith('stk-')) return 'article';
  if (id.startsWith('rec-')) return 'recette';
  if (id.startsWith('bat-')) return 'brassin';
  if (id.startsWith('tx-')) return 'ecriture';
  if (id.startsWith('cli-')) return 'client';
  return undefined;
}

export type GesteId = 'courses' | 'corriger' | 'brasser' | 'mesure' | 'piece';

/** Un geste de la ligne : seulement ce que l'app sait faire. « Ouvrir la fiche » est le `onSelect` de la ligne, pas un geste. */
export interface Geste {
  id: GesteId;
  label: string;
  run: () => void;
}

/** La touche d'un geste au 1280 : Alt + lettre (⌘R recharge la page, ⌘J ouvre les téléchargements). */
export const TOUCHE_GESTE: Record<GesteId, string> = { courses: 'C', corriger: 'I', brasser: 'B', mesure: 'M', piece: 'P' };

export const LIBELLE_GESTE_LONG: Record<GesteId, string> = {
  courses: 'Voir les courses',
  corriger: 'Corriger l’inventaire',
  brasser: 'Brasser cette recette',
  mesure: 'Prendre une mesure',
  piece: 'Voir la pièce'
};

/* ------------------------------------------------------------------ Ici ---- */

export interface LigneIci {
  cle: PlusCle | 'ecran';
  label: string;
  /** Précision de l'app (« sera LOT-004 », « 3 à commander ») ; absente quand l'app ne la sait pas. */
  hint?: string;
  /** L'action de l'écran, pleine : la même que la zone « Sur cet écran » du + . */
  primaire: boolean;
  ton: PlusTon;
}

/** Ce qu'un geste « depuis ici » dit en verbe (le + dit un nom, la recherche dit ce qu'on fait). */
export const VERBE: Record<PlusCle, string> = {
  estimer: 'Estimer un brassin',
  ecriture: 'Nouvelle écriture',
  facture: 'Entrer une facture',
  vente: 'Saisir une vente',
  brassin: 'Lancer un brassin',
  recette: 'Écrire une recette',
  idee: 'Noter une idée',
  courses: 'Voir les courses',
  houblon: 'Nouvelle variété',
  article: 'Nouvel article',
  fut: 'Nouveau fût',
  client: 'Nouveau client',
  tarif: 'Nouveau tarif',
  materiel: 'Nouveau matériel',
  densite: 'Saisir une densité'
};

/** Les quatre créations toujours au même endroit (« Créer », fixe) ; le Compagnon est la cinquième tuile, ajoutée à l'écran. */
export const CREER: PlusCle[] = ['ecriture', 'vente', 'recette', 'brassin'];

/**
 * « Ici » : l'action de l'écran d'abord (celle du + , pleine), puis les autres gestes de la table. Une création déjà dans « Créer »
 * n'est pas répétée : un seul endroit pour chacune.
 */
export function gestesIci(menu: PlusMenu): LigneIci[] {
  const lignes: LigneIci[] = [];
  if (menu.action) lignes.push({ cle: 'ecran', label: menu.action.label, hint: menu.action.hint, primaire: true, ton: menu.action.ton });
  for (const e of [...menu.autres, ...menu.ici]) {
    if (CREER.includes(e.cle)) continue;
    lignes.push({ cle: e.cle, label: VERBE[e.cle], hint: e.hint, primaire: false, ton: e.ton });
  }
  return lignes;
}

/* -------------------------------------------------------------- Aller à ---- */

export type DestinationId = EcranId | 'assistant' | 'journal' | 'reglages';

export const LIBELLE_DESTINATION: Record<DestinationId, string> = {
  bord: 'Bord', finances: 'Finances', calendrier: 'Calendrier', brassins: 'Brassins', recettes: 'Recettes', atelier: 'Atelier R&D', volumes: 'Volumes',
  stock: 'Stock', courses: 'Courses', futs: 'Fûts', materiel: 'Matériel', houblons: 'Houblons',
  clients: 'Clients', impot: 'Impôt bière', tarifs: 'Prix', assistant: 'Assistant', journal: 'Journal', reglages: 'Réglages'
};

/** Les écrans d'une même rubrique : ils sont déjà en sous-onglets, mais la recherche y va d'un toucher. */
const FRERES: Partial<Record<EcranId, EcranId[]>> = {
  brassins: ['recettes', 'atelier', 'volumes'], recettes: ['brassins', 'atelier', 'volumes'],
  atelier: ['brassins', 'recettes', 'volumes'], volumes: ['brassins', 'recettes', 'atelier'],
  stock: ['courses', 'futs', 'materiel', 'houblons'], courses: ['stock', 'futs', 'materiel', 'houblons'],
  futs: ['stock', 'courses', 'materiel', 'houblons'], materiel: ['stock', 'courses', 'futs', 'houblons'],
  houblons: ['stock', 'courses', 'futs', 'materiel'],
  clients: ['impot', 'tarifs'], impot: ['clients', 'tarifs'], tarifs: ['clients', 'impot']
};

const AILLEURS: DestinationId[] = ['atelier', 'assistant', 'journal', 'reglages'];

/**
 * « Aller à » : les écrans voisins, puis ce qui n'a pas de place dans la barre. Jamais l'écran où l'on est, et jamais une destination
 * déjà proposée dans « Ici » (Courses, quand « Voir les courses » y est) : critique de r3p2, n° 1 et n° 4.
 */
export function destinationsAllerA(menu: PlusMenu, ici: LigneIci[]): DestinationId[] {
  const dejaIci = new Set<DestinationId>();
  if (ici.some(l => l.cle === 'courses')) dejaIci.add('courses');
  const vues = new Set<DestinationId>();
  const sortie: DestinationId[] = [];
  for (const id of [...(FRERES[menu.ecran] ?? []), ...AILLEURS]) {
    if (id === menu.ecran || dejaIci.has(id) || vues.has(id)) continue;
    vues.add(id);
    sortie.push(id);
  }
  return sortie;
}

/* ---------------------------------------------------------------- Récents -- */

const CLE_RECENTS = 'laffinee-recherche-recents';
const MAX_RECENTS = 3;

/** Les derniers résultats ouverts depuis la recherche, du plus récent au plus ancien. Lecture sûre : un stockage illisible donne []. */
export function lireRecents(stockage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): string[] {
  try {
    const brut = stockage?.getItem(CLE_RECENTS);
    const liste: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? liste.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

/** Ajoute l'identifiant en tête (sans doublon) et garde les trois derniers. */
export function noterRecent(id: string, stockage: Pick<Storage, 'getItem' | 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage): string[] {
  const suite = [id, ...lireRecents(stockage).filter(x => x !== id)].slice(0, MAX_RECENTS);
  try { stockage?.setItem(CLE_RECENTS, JSON.stringify(suite)); } catch { /* quota ou mode privé : la mémoire du jour seule */ }
  return suite;
}

/* ----------------------------------------------------------- Classement ---- */

/** Un résultat prêt à classer : seulement ce que le classement lit. */
export interface Classable {
  id: string;
  label: string;
}

/** Le rang d'un libellé pour la requête : commence par (3), contient (2), trouvé ailleurs (1). Requête vide : 0. */
export function rang(label: string, requete: string): number {
  const q = normalize(requete.trim());
  if (!q) return 0;
  const l = normalize(label);
  return l === q ? 4 : l.startsWith(q) ? 3 : l.includes(q) ? 2 : 1;
}

const RUBRIQUE_TYPE: Record<string, TypeResultat> = { Stocks: 'article', Brassins: 'recette', Finances: 'ecriture', Clients: 'client', Bord: 'ecriture' };

/** Le type que l'écran d'ouverture fait passer devant (Stocks : les articles). */
export function typePrioritaire(menu: PlusMenu | undefined): TypeResultat | undefined {
  return menu ? RUBRIQUE_TYPE[menu.chemin.split(' › ')[0]] : undefined;
}

const ORDRE_TYPES: TypeResultat[] = ['article', 'brassin', 'recette', 'ecriture', 'client'];

/**
 * Les résultats de tous les types en une liste, du meilleur au moins bon : rang du libellé, puis le type de l'écran d'ouverture,
 * puis l'ordre des types. Le tri est stable : à égalité, l'ordre de la source (les écritures, de la plus récente à la plus ancienne).
 */
export function classer<T extends Classable>(items: T[], requete: string, prioritaire?: TypeResultat): T[] {
  const cle = (it: T) => {
    const t = typeDeId(it.id);
    return { r: rang(it.label, requete), p: t && t === prioritaire ? 1 : 0, o: t ? ORDRE_TYPES.indexOf(t) : ORDRE_TYPES.length };
  };
  return items
    .map((it, i) => ({ it, i, k: cle(it) }))
    .sort((a, b) => b.k.r - a.k.r || b.k.p - a.k.p || a.k.o - b.k.o || a.i - b.i)
    .map(x => x.it);
}

/* ------------------------------------------------------------ Surlignage --- */

export interface Segment { t: string; hit: boolean }

/**
 * Les lettres tapées, soulignées dans le texte (« cit » dans « Acide citrique »), insensibles aux accents. Chaque terme de la requête se
 * cherche dans le texte normalisé ; l'index se reporte sur le texte d'origine caractère par caractère, donc « Caramünch » reste juste.
 */
export function surligner(texte: string, requete: string): Segment[] {
  const termes = normalize(requete.trim()).split(/\s+/).filter(Boolean);
  if (!texte || !termes.length) return [{ t: texte, hit: false }];
  const caracteres = Array.from(texte);
  let normalise = '';
  const origine: number[] = [];
  caracteres.forEach((c, i) => {
    const n = normalize(c);
    for (let k = 0; k < n.length; k++) origine.push(i);
    normalise += n;
  });
  const marque = new Array<boolean>(caracteres.length).fill(false);
  for (const terme of termes) {
    let depuis = 0;
    for (;;) {
      const at = normalise.indexOf(terme, depuis);
      if (at < 0) break;
      for (let k = at; k < at + terme.length; k++) marque[origine[k]] = true;
      depuis = at + terme.length;
    }
  }
  const segments: Segment[] = [];
  caracteres.forEach((c, i) => {
    const dernier = segments[segments.length - 1];
    if (dernier && dernier.hit === marque[i]) dernier.t += c;
    else segments.push({ t: c, hit: marque[i] });
  });
  return segments;
}

export interface SegmentNombre { t: string; nombre: boolean }

/** Les nombres d'un texte en chiffres mono, l'unité et les mots restent en Source Sans (« 1,2 » mono, « kg » non). */
export function segmentsNombres(texte: string): SegmentNombre[] {
  const segments: SegmentNombre[] = [];
  const re = /\d+(?:[.,]\d+)*/g;
  let fin = 0;
  for (const m of texte.matchAll(re)) {
    const debut = m.index ?? 0;
    if (debut > fin) segments.push({ t: texte.slice(fin, debut), nombre: false });
    segments.push({ t: m[0], nombre: true });
    fin = debut + m[0].length;
  }
  if (fin < texte.length) segments.push({ t: texte.slice(fin), nombre: false });
  return segments;
}

/**
 * Date d'une écriture dans une ligne de résultat (r3p2 : « 09.11 ») : jour.mois dans l'année courante, jour.mois.aa sinon.
 * Une date que l'on ne sait pas lire reste telle quelle (jamais une date inventée).
 */
export function dateCourte(date: string, maintenant: Date = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  const jourMois = `${m[3]}.${m[2]}`;
  return Number(m[1]) === maintenant.getFullYear() ? jourMois : `${jourMois}.${m[1].slice(2)}`;
}

/**
 * La première ligne reliée d'une écriture, pour le détail d'un résultat (r3p2 : « Citra T90 1 kg »). Sans ligne : `undefined`,
 * l'appelant garde la sous-catégorie ; une quantité ou une unité inconnue n'est pas écrite.
 */
export function resumeLigneEcriture(t: { finance?: { lines?: ReadonlyArray<{ description?: string; quantity?: number; unit?: string }> } }): string | undefined {
  const ligne = t.finance?.lines?.[0];
  if (!ligne?.description) return undefined;
  const qte = ligne.quantity !== undefined && Number.isFinite(ligne.quantity) && ligne.unit ? `${ligne.quantity} ${ligne.unit}` : undefined;
  return [ligne.description, qte].filter(Boolean).join(' ');
}
