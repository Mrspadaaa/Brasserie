// Calculs purs de la liste en bandes (p3c-3) : quel groupe, quels sous-totaux, quelle ligne est du port. Aucun React, aucun service.
// Règles du plan : R2 (un seul ensemble de lignes affichées), R3 (l'inconnu n'est jamais 0), centimes entiers partout, unités jamais additionnées entre elles.

import { familleDe, NOMS_FAMILLES, ORDRE_FAMILLES, type FamilleCle } from './familles';

/** Une bande par famille (D262c, D262d) : malts, houblons, levures, sucres, additifs, matériel, emballage, nettoyage, consommables, services, autres. */
export type GroupeCle = FamilleCle;
export const NOMS_GROUPES: Record<GroupeCle, string> = NOMS_FAMILLES;
export const ORDRE_GROUPES: readonly GroupeCle[] = ORDRE_FAMILLES;
/** Les jetons de l'app qui teintent chaque famille (quatre ont une couleur par thème dans p3c.css : `dp-p3c-pt-<clé>`, `dp-p3c-fi-<clé>`) : la pastille de l'en-tête (et la barre du récap) et le filet de gauche des rangées. Le fond de l'en-tête est dans p3c.css (`dp-p3c-t-<clé>`). */
export const POINT_FAMILLE: Record<GroupeCle, string> = {
  malt: 'bg-ebc-gold', houblon: 'bg-hop', levure: 'bg-area-finances', sucre: 'bg-ebc-amber', additif: 'bg-area-agenda', materiel: 'bg-water', emballage: 'dp-p3c-pt-emballage',
  nettoyage: 'dp-p3c-pt-nettoyage', consommable: 'dp-p3c-pt-consommable', service: 'dp-p3c-pt-service', autres: 'bg-cave-400',
};
export const FILET_FAMILLE: Record<GroupeCle, string> = {
  malt: 'border-l-4 border-l-ebc-gold', houblon: 'border-l-4 border-l-hop', levure: 'border-l-4 border-l-area-finances', sucre: 'border-l-4 border-l-ebc-amber',
  additif: 'border-l-4 border-l-area-agenda', materiel: 'border-l-4 border-l-water', emballage: 'border-l-4 dp-p3c-fi-emballage', nettoyage: 'border-l-4 dp-p3c-fi-nettoyage',
  consommable: 'border-l-4 dp-p3c-fi-consommable', service: 'border-l-4 dp-p3c-fi-service', autres: 'border-l-4 border-l-cave-400',
};

/** La forme minimale dont le critère du port a besoin (VOIE.md, décision 7). */
export interface LigneMin { id: string; kind: string; amount?: number }

/** Un montant de ligne valide : nombre fini ≥ 0, en centimes entiers (2,005 n'en est pas un). */
export const montantValide = (a: number | undefined): a is number => typeof a === 'number' && Number.isFinite(a) && a >= 0 && Math.abs(a * 100 - Math.round(a * 100)) < 1e-6;
export const centimes = (a: number): number => Math.round(a * 100);
export const fr2 = (cents: number): string => (cents / 100).toFixed(2).replace('.', ',');

/**
 * Le critère du port, en UN seul endroit : une ligne est du port si `kind === 'shipping'`, si son montant est valide (≥ 0, centimes entiers)
 * ET si toutes les lignes ne sont pas du port. Sinon elle reste une rangée ordinaire (bande « Autres »), visible et corrigeable.
 */
export function lignesDePort(lines: readonly LigneMin[]): ReadonlySet<string> {
  if (lines.length > 0 && lines.every(l => l.kind === 'shipping')) return new Set();
  return new Set(lines.filter(l => l.kind === 'shipping' && montantValide(l.amount)).map(l => l.id));
}
/** « dont port » : somme en centimes entiers des lignes de port ; `null` quand il n'y en a aucune (un port à 0,00 est un port connu). */
export function portCents(lines: readonly LigneMin[], port: ReadonlySet<string>): number | null {
  if (port.size === 0) return null;
  return lines.filter(l => port.has(l.id)).reduce((s, l) => s + centimes(l.amount as number), 0);
}
/**
 * La famille d'une ligne : le contexte que l'identité a lu (`Malt`, `Houblon`, `Levure`), puis le `kind` de la lecture, le nom imprimé, la catégorie de
 * stock lue sur la ligne et celle de l'article rattaché (voir `familles.ts` pour l'ordre). « Autres » ne reçoit que l'inclassable.
 * Les arguments absents ou d'un autre type sont ignorés (`['Malt', …].map(groupeDe)` passe un rang et un tableau).
 */
export const groupeDe = (contexte: string | undefined, kind?: unknown, description?: unknown, stockCategory?: unknown, categorieArticle?: unknown): GroupeCle =>
  familleDe({
    contexte, kind: typeof kind === 'string' ? kind : undefined, nom: typeof description === 'string' ? description : undefined,
    stockCategory: typeof stockCategory === 'string' ? stockCategory : undefined, categorieArticle: typeof categorieArticle === 'string' ? categorieArticle : undefined,
  });

/** Une ligne affichée, avec ce dont les sous-totaux ont besoin (le groupe d'une mouture rattachable est celui de son malt). */
export interface LigneBande {
  id: string; groupe: GroupeCle; amount?: number; quantity?: number; unit: string; uniteLisible: boolean;
  /** Vrai : une mouture posée en pastille sur son malt (comptée dans la bande du malt, pas dans ses quantités). */
  mouture: boolean;
  /** Nombre de sachets certain de la ligne (conversion sûre), sinon `undefined`. */
  sachets?: number;
}
export interface QteGroupe { unite: string; n: number; inconnue: boolean }
export interface Bande {
  cle: GroupeCle; nom: string; ids: string[]; moutureIds: string[]; qte: QteGroupe[]; eqb?: string; cents: number;
  /** Au moins un montant absent : le sous-total n'est qu'un minimum (suffixe « + ? »). */
  incomplet: boolean;
}

const normUnite = (u: string) => u.trim().toLowerCase();
function quantites(lignes: readonly LigneBande[]): QteGroupe[] {
  const parUnite = new Map<string, { n: number; formes: Map<string, number> }>();
  let inconnu = 0;
  for (const l of lignes) {
    if (!l.uniteLisible || l.quantity === undefined) { inconnu += l.quantity ?? 0; continue; }
    const cle = normUnite(l.unit), e = parUnite.get(cle) ?? { n: 0, formes: new Map<string, number>() };
    e.n += l.quantity; e.formes.set(l.unit.trim(), (e.formes.get(l.unit.trim()) ?? 0) + 1); parUnite.set(cle, e);
  }
  const sortie: QteGroupe[] = [...parUnite.values()].map(e => ({ unite: [...e.formes.entries()].sort((a, b) => b[1] - a[1])[0][0], n: Math.round(e.n * 1e6) / 1e6, inconnue: false }));
  const aPart = lignes.some(l => !l.uniteLisible || l.quantity === undefined);
  if (aPart) sortie.push({ unite: '?', n: Math.round(inconnu * 1e6) / 1e6, inconnue: true });
  return sortie;
}
/** Les bandes (ordre fixe : malt, houblon, levure, autres) ; une bande sans ligne n'existe pas. L'ordre dans la bande est celui du papier. */
export function bandes(lignes: readonly LigneBande[]): Bande[] {
  const sortie: Bande[] = [];
  for (const cle of ORDRE_GROUPES) {
    const dans = lignes.filter(l => l.groupe === cle);
    if (!dans.length) continue;
    const propres = dans.filter(l => !l.mouture);
    const cents = dans.reduce((s, l) => s + (l.amount === undefined || !Number.isFinite(l.amount) ? 0 : centimes(l.amount)), 0);
    const sachets = cle === 'levure' && propres.length > 0 && propres.every(l => l.sachets !== undefined) ? propres.reduce((s, l) => s + (l.sachets as number), 0) : undefined;
    sortie.push({
      cle, nom: NOMS_GROUPES[cle], ids: propres.map(l => l.id), moutureIds: dans.filter(l => l.mouture).map(l => l.id), qte: quantites(propres),
      ...(sachets !== undefined ? { eqb: `= ${sachets} sachet${sachets > 1 ? 's' : ''}` } : {}), cents, incomplet: dans.some(l => l.amount === undefined || !Number.isFinite(l.amount)),
    });
  }
  return sortie;
}
/** « 18 Kg », « 270 g + 30 ? » : le texte de la colonne des quantités d'un sous-total. */
export const texteQte = (q: readonly QteGroupe[]): string => q.map(e => (e.inconnue ? `${e.n ? `${String(e.n).replace('.', ',')} ` : ''}?` : `${String(e.n).replace('.', ',')} ${e.unite}`)).join(' + ');

/** Le numéro d'une rangée en ordre Papier : son rang dans le brouillon (un port écarté laisse un trou, comme les libellés « ligne n »). */
export function numerosPapier(lines: readonly LigneMin[], port: ReadonlySet<string>): Map<string, number> {
  const m = new Map<string, number>();
  lines.forEach((l, i) => { if (!port.has(l.id)) m.set(l.id, i + 1); });
  return m;
}
