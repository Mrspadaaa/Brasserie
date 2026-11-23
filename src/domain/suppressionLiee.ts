/**
 * Supprimer une chose liée (maquette suppression/v2, « les liens, un par un », choisie le 16.11) : règles pures.
 *
 * Une chose liée (fût, brassin, client) ne part jamais en cascade. On liste ce qui la retient ; chaque lien qui peut se régler porte son geste
 * (« Rentré », « Vidé ») ; un lien qui ne se règle pas (une vente, des bouteilles conditionnées) porte un cadenas : la chose ne peut qu'être archivée.
 * À zéro lien, Supprimer s'allume.
 *
 * Tout vient des données de l'app : un fût livré donne le client, un fût plein donne le lot. Ni consigne, ni cuve réservée, ni devis : l'app n'en
 * garde aucun, ils ne sont pas inventés.
 */
import type { Batch, Client, KegItem, Transaction } from '../types';
import { ClientStatsService } from '../services/clientStats';
import { montantChf } from './finance/ledger';
import { nombreFr } from './nombreAffiche';
import { remettreALaver, revenuPlein } from './stock/futsFiche';

export type SorteChose = 'fut' | 'brassin' | 'client';
export type GenreLien = 'fut' | 'client' | 'brassin' | 'facture' | 'stock';
export type TypeGeste = 'rentre' | 'vide';

export interface LienSuppression {
  /** Stable d'un calcul à l'autre : l'écran reconnaît un lien réglé à son absence. */
  id: string;
  genre: GenreLien;
  nom: string;
  detail: string;
  /** Absent : le lien ne se règle pas. */
  geste?: { type: TypeGeste; libelle: string; fait: string; futId: string };
  /** Le cadenas : ce que devient le lien si la chose est archivée. */
  garde?: string;
}

export interface DonneesLiens {
  kegs: KegItem[];
  batches: Batch[];
  clients: Client[];
  transactions: Transaction[];
  /** Litres notés vendus par la caisse pour un lot ; absent = inconnu. */
  litresVendus?: (batchId: string) => number;
}

const plat = (s?: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
/** `02.11.2026` → `02.11` ; une date illisible reste telle quelle. */
const jourMois = (date?: string) => { const m = /^(\d{2})\.(\d{2})\.\d{4}$/.exec(date ?? ''); return m ? `${m[1]}.${m[2]}` : (date ?? ''); };
const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
const litres = (k: KegItem) => `${nombreFr(k.capacityL, 1)} L`;
const contientBiere = (k: KegItem) => k.state === 'plein' || k.state === 'livre';

const lienClientDuFut = (k: KegItem): LienSuppression => ({
  id: `client:${k.id}`, genre: 'client', nom: k.clientName?.trim() || 'Client non renseigné',
  detail: k.deliveryDate ? `l’a chez lui depuis le ${jourMois(k.deliveryDate)}` : 'l’a chez lui, date de livraison non enregistrée',
  geste: { type: 'rentre', libelle: 'Rentré', fait: 'rentré en cave', futId: k.id }
});

const lienLotDuFut = (k: KegItem): LienSuppression => ({
  id: `lot:${k.id}`, genre: 'brassin',
  nom: [k.batchRef, k.beerName].filter(Boolean).join(' · ') || 'Bière non renseignée',
  detail: `fût de ${litres(k)}, plein`,
  geste: { type: 'vide', libelle: 'Vidé', fait: 'vidé', futId: k.id }
});

/** Ce qui retient un fût : le client qui l'a, la bière qu'il contient. Un fût déjà supprimé n'a plus de lien. */
export function liensDuFut(keg: Pick<KegItem, 'id'>, d: DonneesLiens): LienSuppression[] {
  const k = d.kegs.find((x) => x.id === keg.id);
  if (!k) return [];
  const liens: LienSuppression[] = [];
  if (k.state === 'livre') liens.push(lienClientDuFut(k));
  if (contientBiere(k)) liens.push(lienLotDuFut(k));
  return liens;
}

/** Ce qui retient un brassin : ses fûts pleins ou livrés, ses bouteilles conditionnées, les écritures qui portent son lot. */
export function liensDuBrassin(batch: Pick<Batch, 'id'>, d: DonneesLiens): LienSuppression[] {
  const b = d.batches.find((x) => x.id === batch.id);
  if (!b) return [];
  const liens: LienSuppression[] = [];
  for (const k of d.kegs.filter((x) => x.batchRef === b.id && contientBiere(x))) {
    liens.push({
      id: `fut:${k.id}`, genre: 'fut', nom: `${k.id} · ${litres(k)}`,
      detail: k.state === 'livre' ? `plein, chez ${k.clientName?.trim() || 'un client non renseigné'}` : 'plein, en cave',
      geste: { type: 'vide', libelle: 'Vidé', fait: 'vidé', futId: k.id }
    });
  }
  const b33 = b.packaging?.bottles33 ?? 0, b75 = b.packaging?.bottles75 ?? 0;
  if (b33 + b75 > 0) {
    const nom = [b33 > 0 ? `${b33} bouteille${b33 > 1 ? 's' : ''} 33 cl` : '', b75 > 0 ? `${b75} bouteille${b75 > 1 ? 's' : ''} 75 cl` : ''].filter(Boolean).join(' + ');
    const vendus = d.litresVendus?.(b.id);
    const net = b.volumePackagedL;
    const reste = vendus !== undefined && net !== undefined && net > 0 ? Math.max(0, Math.round((net - vendus) * 10) / 10) : undefined;
    liens.push({
      id: 'stock', genre: 'stock', nom,
      detail: reste !== undefined ? `conditionnées · ${nombreFr(reste, 1)} L pas passés en caisse` : 'conditionnées, à vendre ou déjà vendues : l’app ne le sait pas',
      garde: 'gardent leur lot'
    });
  }
  const ecritures = d.transactions.filter((t) => t.finance?.batchId === b.id && !t.finance.voidedAt);
  if (ecritures.length) {
    const nums = ecritures.slice(0, 3).map((t) => t.finance?.invoiceNumber || t.id).join(', ');
    liens.push({
      id: 'compta', genre: 'facture', nom: pluriel(ecritures.length, 'écriture') + ' dans les comptes',
      detail: nums + (ecritures.length > 3 ? '…' : ''), garde: ecritures.length > 1 ? 'restent dans les comptes' : 'reste dans les comptes'
    });
  }
  return liens;
}

/** Ce qui retient un client : ses fûts livrés (à rentrer), ses ventes non annulées (restent dans les comptes). */
export function liensDuClient(client: Client, d: DonneesLiens): LienSuppression[] {
  const c = d.clients.find((x) => x.id === client.id) ?? client;
  const liens: LienSuppression[] = [];
  for (const k of d.kegs.filter((x) => x.state === 'livre' && (x.clientId ? x.clientId === c.id : plat(x.clientName) === plat(c.name)))) {
    liens.push({
      id: `fut:${k.id}`, genre: 'fut', nom: `${k.id} · ${litres(k)}`,
      detail: k.deliveryDate ? `chez lui depuis le ${jourMois(k.deliveryDate)}` : 'chez lui, date de livraison non enregistrée',
      geste: { type: 'rentre', libelle: 'Rentré', fait: 'rentré en cave', futId: k.id }
    });
  }
  const stats = ClientStatsService.forClient(c, d.transactions, d.clients);
  if (stats.orderCount > 0) {
    liens.push({
      id: 'ventes', genre: 'facture', nom: `${pluriel(stats.orderCount, 'vente')} · ${montantChf(stats.totalSales)} CHF`,
      detail: stats.orderCount > 1 ? 'non annulées' : 'non annulée', garde: stats.orderCount > 1 ? 'restent dans les comptes' : 'reste dans les comptes'
    });
  }
  return liens;
}

/** « Vidé » demande où est partie la bière : le motif entre dans l'historique du fût. Pas de mouvement de litres inventé : l'app ne suit pas le contenu d'un fût. */
export const MOTIFS_SORTIE = ['Vendus', 'Perdus, versés', 'Transvasés'] as const;
export type MotifSortie = typeof MOTIFS_SORTIE[number];

/** Le fût après le geste : rentré = revenu plein en cave, sa bière gardée ; vidé = à laver, sans bière ni client, avec le motif en détail. */
export function futApresGeste(keg: KegItem, type: TypeGeste, jour: string, motif?: MotifSortie): KegItem {
  return type === 'rentre' ? revenuPlein(keg, jour) : remettreALaver(keg, jour, `vidé${motif ? ` · ${motif.toLowerCase()}` : ''}`);
}

const liensChose =(sorte: SorteChose, chose: { id: string }, d: DonneesLiens): LienSuppression[] =>
  sorte === 'fut' ? liensDuFut(chose, d) : sorte === 'brassin' ? liensDuBrassin(chose, d) : liensDuClient(chose as Client, d);

/** Un lien réglé s'affiche barré avec son geste en passé ; il n'est plus dans le calcul courant. */
export interface LigneLien { lien: LienSuppression; regle: boolean }

export function lignesDesLiens(initiaux: LienSuppression[], courants: LienSuppression[]): LigneLien[] {
  const vivants = new Map(courants.map((l) => [l.id, l]));
  return initiaux.map((l) => ({ lien: vivants.get(l.id) ?? l, regle: !vivants.has(l.id) }));
}

export interface ResumeLiens {
  /** Liens qui retiennent encore la chose. */
  restants: number;
  /** Parmi eux, ceux qui ne se règlent pas : la chose ne peut qu'être archivée. */
  verrous: LienSuppression[];
  /** Zéro lien : Supprimer s'allume. */
  libre: boolean;
}

export function resumeLiens(lignes: LigneLien[]): ResumeLiens {
  const actifs = lignes.filter((x) => !x.regle).map((x) => x.lien);
  const verrous = actifs.filter((l) => !l.geste);
  return { restants: actifs.length, verrous, libre: actifs.length === 0 };
}
