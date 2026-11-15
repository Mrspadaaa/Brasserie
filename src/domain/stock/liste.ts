// La liste du Stock sous le mur : règles pures (maquette choisie sy/fA, barres à deux régimes de g6, pastilles d'état, tri, comptés de Recompter).
// Aucune écriture, aucune lecture de stockage : l'écran passe les articles, les besoins et les mouvements.
import type { StockItem } from '../../types';
import { rayonDuMur, type RayonMurNom } from './murRayon';
import { statutDurabilite } from './regles';
import type { ArticleACommander } from '../stockLevel';

/* ───────────── Barres à deux régimes (g6 : « à l'échelle jusqu'au coude, resserrée au-delà ») ───────────── */

export interface Graduation { q: number; texte: string; coude?: boolean }
export interface Echelle {
  rayon: RayonMurNom;
  /** Unité de la barre : la barre dit des kg (malts), des g (houblons), des sachets (levures). */
  unite: 'kg' | 'g' | 'sachets';
  coude: number;
  max: number;
  /** « à l'échelle, en sachets » ou « à l'échelle » ; « resserrée au-delà de 5 kg » pour la seconde moitié. */
  gauche: string;
  droite: string | null;
  graduations: Graduation[];
}

/** La part de la règle prise par le régime « à l'échelle » (le coude se trouve à 45 % de la largeur). */
export const PART_COUDE = 0.45;

export const ECHELLES: Record<RayonMurNom, Echelle> = {
  Malts: {
    rayon: 'Malts', unite: 'kg', coude: 5, max: 200, gauche: "à l'échelle", droite: '⫽ resserrée au-delà de 5 kg',
    graduations: [{ q: 0, texte: '0' }, { q: 1, texte: '1' }, { q: 2.5, texte: '2,5' }, { q: 5, texte: '5 kg', coude: true }, { q: 20, texte: '20' }, { q: 60, texte: '60' }, { q: 200, texte: '200' }],
  },
  Houblons: {
    rayon: 'Houblons', unite: 'g', coude: 250, max: 2000, gauche: "à l'échelle", droite: '⫽ resserrée au-delà de 250 g',
    graduations: [{ q: 0, texte: '0' }, { q: 100, texte: '100' }, { q: 250, texte: '250 g', coude: true }, { q: 500, texte: '500' }, { q: 1000, texte: '1 kg' }, { q: 2000, texte: '2 kg' }],
  },
  Levures: {
    rayon: 'Levures', unite: 'sachets', coude: 5, max: 20, gauche: "à l'échelle, en sachets", droite: '⫽ resserrée au-delà de 5 sachets',
    graduations: [{ q: 0, texte: '0' }, { q: 1, texte: '1' }, { q: 2, texte: '2' }, { q: 3, texte: '3' }, { q: 4, texte: '4' }, { q: 5, texte: '5', coude: true }, { q: 10, texte: '10' }, { q: 20, texte: '20' }],
  },
};

/** Position d'une quantité sur la règle (0 à 1) : linéaire jusqu'au coude, logarithmique au-delà, bornée à 1 au maximum de la règle. */
export function xBarre(q: number, e: Echelle): number {
  if (!Number.isFinite(q) || q <= 0) return 0;
  if (q <= e.coude) return PART_COUDE * q / e.coude;
  const x = PART_COUDE + (1 - PART_COUDE) * Math.log(q / e.coude) / Math.log(e.max / e.coude);
  return Math.min(1, x);
}

/** Où se trouve la coupure « ⫽ » dans la barre, en % de sa longueur ; null si la barre tient dans le régime « à l'échelle ». */
export function coupeBarre(q: number, e: Echelle): number | null {
  if (!Number.isFinite(q) || q <= e.coude) return null;
  return PART_COUDE / xBarre(q, e) * 100;
}

/** La quantité d'un article dans l'unité de sa règle ; null quand elle est inconnue (jamais 0). */
export function quantiteBarre(item: StockItem): number | null {
  const rayon = rayonDuMur(item);
  if (!rayon || !Number.isFinite(item.currentStock)) return null;
  const u = item.unit.trim().toLowerCase();
  if (rayon === 'Malts') return u === 'kg' ? item.currentStock : u === 'g' ? item.currentStock / 1000 : null;
  if (rayon === 'Houblons') return u === 'g' ? item.currentStock : u === 'kg' ? item.currentStock * 1000 : null;
  return item.currentStock; // levures : en sachets ou fioles
}

/* ───────────── Les états d'une ligne (pastilles de filtre) ───────────── */

export type EtatLigne = 'manque' | 'bas' | 'epuise' | 'compter' | 'ddm';
export const ETATS: ReadonlyArray<{ id: EtatLigne; mot: string }> = [
  { id: 'manque', mot: 'manque' }, { id: 'bas', mot: 'bas' }, { id: 'epuise', mot: 'épuisés' }, { id: 'compter', mot: 'à compter' }, { id: 'ddm', mot: 'DDM' },
];
/**
 * Le résumé d'un rayon plié (maquette g6) : chaque état présent, avec son nombre, dans les mots des pastilles ; les articles sont nommés quand ils sont
 * deux au plus (« manque 1 : Avoine floconnée · épuisés 1 : Maris Otter · bas 3 »). Chaîne vide sans article ; « rien à signaler » quand aucun état ne s'allume.
 */
export function resumeRayon(items: ReadonlyArray<StockItem>, infos: ReadonlyMap<string, InfoLigne>): string {
  if (items.length === 0) return '';
  const ordre: EtatLigne[] = ['manque', 'epuise', 'bas', 'compter', 'ddm'];
  const parties = ordre.flatMap((etat) => {
    const concernes = items.filter((i) => infos.get(i.ref)?.etats.includes(etat));
    if (concernes.length === 0) return [];
    const mot = ETATS.find((e) => e.id === etat)!.mot;
    return [concernes.length <= 2 ? `${mot} ${concernes.length} : ${concernes.map((i) => i.name).join(', ')}` : `${mot} ${concernes.length}`];
  });
  return parties.length ? parties.join(' · ') : 'rien à signaler';
}

export type ClasseLigne = 'assez' | 'seuil' | 'manque' | 'bas' | 'epuise' | 'compter' | 'ddm' | 'sans';

export interface InfoLigne {
  etats: EtatLigne[];
  classe: ClasseLigne;
  /** Le manque est un plancher (« au moins ») : sa quantité d'une source est inconnue. */
  manqueAuMoins: boolean;
  /** Niveau du pot : part remplie (0 à 1) et place du seuil (0 à 1) ; null = pas de pot (quantité inconnue). */
  pot: { rempli: number; seuil: number | null } | null;
}

/**
 * Les états d'un article, d'une seule règle pour la liste, ses pastilles et Recompter.
 * - épuisé : quantité connue ≤ 0 ; à compter : quantité inconnue (jamais 0) ;
 * - manque : l'article est dans « À commander » avec un manque, connu ou plancher ;
 * - bas : stock positif au seuil renseigné ou dessous, sans manque (un seuil absent n'est pas 0) ;
 * - DDM : levure dont la date de durabilité est dépassée ou à 30 jours.
 */
export function infoLigne(item: StockItem, aCommander: ReadonlyMap<string, ArticleACommander>, aujourdhui: string): InfoLigne {
  const rayon = rayonDuMur(item);
  const inconnu = !Number.isFinite(item.currentStock) || ((rayon === 'Malts' || rayon === 'Houblons') && quantiteBarre(item) === null);
  const etats: EtatLigne[] = [];
  const cmd = aCommander.get(item.ref);
  const seuil = typeof item.minStock === 'number' && item.minStock > 0 ? item.minStock : null;
  const epuise = !inconnu && item.currentStock <= 0;
  if (inconnu) etats.push('compter');
  if (epuise) etats.push('epuise');
  const manque = !inconnu && !!cmd && (cmd.missing > 0 || cmd.auMoins);
  if (manque) etats.push('manque');
  const bas = !inconnu && !epuise && !manque && seuil !== null && item.currentStock <= seuil;
  if (bas) etats.push('bas');
  const st = rayon === 'Levures' ? statutDurabilite(item.yeastLot?.expiresOn, aujourdhui).statut : 'inconnu';
  if (st === 'perime' || st === 'bientot') etats.push('ddm');
  const classe: ClasseLigne = inconnu ? 'compter' : epuise ? 'epuise' : manque ? 'manque' : bas ? 'bas' : seuil !== null ? 'assez' : 'sans';
  const echelleMax = seuil !== null ? Math.max(item.currentStock, seuil * 2.5) : null;
  const pot = inconnu ? null : seuil !== null && echelleMax
    ? { rempli: Math.max(0, Math.min(1, item.currentStock / echelleMax)), seuil: seuil / echelleMax }
    : { rempli: item.currentStock > 0 ? 0.5 : 0, seuil: null };
  return { etats, classe, manqueAuMoins: manque && !!cmd?.auMoins, pot };
}

export interface ComptesEtats { manque: number; manquePlus: number; bas: number; epuise: number; compter: number; ddm: number }
/** Les compteurs des pastilles : « manque 3 + 1 ? » = 3 manques connus et 1 plancher (« au moins »). */
export function compterEtats(infos: ReadonlyArray<InfoLigne>): ComptesEtats {
  const c: ComptesEtats = { manque: 0, manquePlus: 0, bas: 0, epuise: 0, compter: 0, ddm: 0 };
  for (const i of infos) {
    if (i.etats.includes('manque')) { if (i.manqueAuMoins) c.manquePlus++; else c.manque++; }
    if (i.etats.includes('bas')) c.bas++;
    if (i.etats.includes('epuise')) c.epuise++;
    if (i.etats.includes('compter')) c.compter++;
    if (i.etats.includes('ddm')) c.ddm++;
  }
  return c;
}

/* ───────────── Le tri, écrit en clair ───────────── */

export type TriListe = 'defaut' | 'nom' | 'quantite' | 'manque';
export const TRIS: ReadonlyArray<{ id: TriListe; phrase: string }> = [
  { id: 'defaut', phrase: 'couleur (malts), amertume (houblons), date (levures)' },
  { id: 'nom', phrase: 'nom, A → Z' },
  { id: 'quantite', phrase: 'quantité, la plus grande d’abord' },
  { id: 'manque', phrase: 'manque, les plus à court d’abord' },
];
export const phraseTri = (t: TriListe): string => TRIS.find((x) => x.id === t)?.phrase ?? TRIS[0].phrase;

const nomFr = (a: StockItem, b: StockItem) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
/** Un nombre inconnu va en fin de liste, dans les deux sens : l'inconnu n'est jamais un 0 qui monte ou descend. */
const parNombre = (va: number | null, vb: number | null, sens: 1 | -1): number => (va == null && vb == null ? 0 : va == null ? 1 : vb == null ? -1 : (va - vb) * sens);

/** Trie une copie ; l'ordre « par défaut » est celui du métier de chaque rayon : EBC croissant, α décroissant, DDM la plus proche d'abord. */
export function trierArticles(items: ReadonlyArray<StockItem>, tri: TriListe, infos: ReadonlyMap<string, InfoLigne>): StockItem[] {
  const q = (i: StockItem) => (Number.isFinite(i.currentStock) ? i.currentStock : null);
  const ddm = (i: StockItem): number | null => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(i.yeastLot?.expiresOn ?? ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
  const defaut = (a: StockItem, b: StockItem): number => {
    const ra = rayonDuMur(a), rb = rayonDuMur(b);
    if (ra === 'Malts' && rb === 'Malts') return parNombre(a.colorEbc ?? null, b.colorEbc ?? null, 1) || nomFr(a, b);
    if (ra === 'Houblons' && rb === 'Houblons') return parNombre(a.alphaPct ?? null, b.alphaPct ?? null, -1) || nomFr(a, b);
    if (ra === 'Levures' && rb === 'Levures') return parNombre(ddm(a), ddm(b), 1) || nomFr(a, b);
    return nomFr(a, b);
  };
  const manque = (i: StockItem): number | null => { const x = infos.get(i.ref); return x?.etats.includes('manque') ? 0 : x?.etats.includes('epuise') ? 1 : x?.etats.includes('bas') ? 2 : 3; };
  const copie = [...items];
  if (tri === 'nom') return copie.sort(nomFr);
  if (tri === 'quantite') return copie.sort((a, b) => parNombre(q(a), q(b), -1) || nomFr(a, b));
  if (tri === 'manque') return copie.sort((a, b) => parNombre(manque(a), manque(b), 1) || nomFr(a, b));
  return copie.sort(defaut);
}

/* ───────────── Recompter : les comptés, rayon par rayon (q-a3s) ───────────── */

export type FamilleRecompter = 'Malts' | 'Houblons' | 'Levures' | 'Additifs' | 'Emballage' | 'Nettoyage';
export const FAMILLES_RECOMPTER: ReadonlyArray<FamilleRecompter> = ['Malts', 'Houblons', 'Levures', 'Additifs', 'Emballage', 'Nettoyage'];

export function familleRecompter(i: StockItem): FamilleRecompter {
  const r = rayonDuMur(i);
  if (r) return r;
  const c = i.category.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/^emballage/.test(c)) return 'Emballage';
  if (/^(cip|desinfectant|detergent|sols|epi|consommable)/.test(c)) return 'Nettoyage';
  return 'Additifs';
}

export interface MouvementComptage { type?: string; reasonCode?: string; stockItemRef?: string; itemRef?: string; date?: string; createdAt?: string; timestamp?: string }
/** Le jour (AAAA-MM-JJ) du dernier comptage de chaque article : un mouvement d'inventaire de motif « comptage ». Jamais un 0 : un article jamais compté est absent. */
export function derniersComptages(mouvements: ReadonlyArray<MouvementComptage>): Map<string, string> {
  const r = new Map<string, string>();
  for (const m of mouvements) {
    if (m.type !== 'inventory-adjustment' || m.reasonCode !== 'comptage') continue;
    const ref = m.stockItemRef ?? m.itemRef; const t = m.date ?? m.createdAt ?? m.timestamp ?? '';
    if (!ref || !/^\d{4}-\d{2}-\d{2}/.test(t)) continue;
    const jour = t.slice(0, 10);
    if (!r.has(ref) || jour > r.get(ref)!) r.set(ref, jour);
  }
  return r;
}
/** « 02.11 » depuis AAAA-MM-JJ. */
export const jourCourt = (iso: string): string => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
