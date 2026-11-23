/** Les trois choses qu'on supprime avec leurs liens : un fût, un brassin, un client. Chacune lit et écrit par le stockage ; le banc des fûts passe ses propres écritures. */
import type { Batch, Client, KegItem } from '../../types';
import { StorageService } from '../../services/storage';
import { liensDuBrassin, liensDuClient, liensDuFut, type DonneesLiens } from '../../domain/suppressionLiee';
import { nombreFr } from '../../domain/nombreAffiche';
import { litresVendus } from '../vente/brassinsVendables';
import type { ChoseASupprimer } from './SuppressionLiee';

const fusionner = (kegs: KegItem[], surcharge: ReadonlyMap<string, KegItem>): KegItem[] =>
  kegs.map((k) => surcharge.get(k.id) ?? k);

/** Les données qu'une sorte lit : un fût ne lit que les fûts ; un brassin ou un client lisent aussi les écritures (le stockage ; rien n'est lu en trop). */
function donnees(sorte: 'fut' | 'brassin' | 'client', kegs: KegItem[] | undefined, surcharge: ReadonlyMap<string, KegItem>, batch?: Batch): DonneesLiens {
  const tousLesFuts = fusionner(kegs ?? StorageService.getStocks().kegs, surcharge);
  if (sorte === 'fut') return { kegs: tousLesFuts, batches: [], clients: [], transactions: [] };
  const transactions = StorageService.getTransactions();
  return {
    kegs: tousLesFuts, transactions,
    batches: batch ? [batch] : [], clients: sorte === 'client' ? StorageService.getClients() : [],
    litresVendus: (id) => litresVendus(transactions, id)
  };
}

interface Reglages {
  /** Les fûts de l'hôte, quand ce n'est pas le stockage (le banc de développement). */
  kegs?: KegItem[];
  ecrireFut?: (keg: KegItem) => void;
  jour?: string;
  /** Après une suppression ou un archivage : l'hôte lâche la chose (la fiche ouverte ne doit pas revenir si on la rétablit). */
  apres?: () => void;
}
const lireFut = (o: Reglages) => (id: string) => (o.kegs ?? StorageService.getStocks().kegs).find((k) => k.id === id);
const ecrireFut = (o: Reglages) => o.ecrireFut ?? ((k: KegItem) => StorageService.updateKeg(k));

export function choseFut(
  keg: KegItem,
  o: Reglages & { supprimer?: () => void; retablir?: (keg: KegItem) => void; archiver?: (archive: boolean) => void } = {}
): ChoseASupprimer {
  return {
    sorte: 'fut', id: keg.id, nom: `${keg.id} · ${nombreFr(keg.capacityL, 1)} L`, court: keg.id, jour: o.jour,
    liens: (s) => liensDuFut(keg, donnees('fut', o.kegs, s)),
    lireFut: lireFut(o), ecrireFut: ecrireFut(o),
    supprimer: () => { (o.supprimer ?? (() => StorageService.deleteKeg(keg.id)))(); o.apres?.(); },
    // Le fût rétabli est celui de la fin de la feuille (rentré, vidé), pas celui d'avant les gestes.
    retablir: (s) => (o.retablir ?? ((k: KegItem) => StorageService.addKeg(k)))(s.get(keg.id) ?? keg),
    archiver: () => { (o.archiver ?? ((a) => StorageService.setArchivedEntity('fut', keg.id, a)))(true); o.apres?.(); },
    ressortir: () => (o.archiver ?? ((a) => StorageService.setArchivedEntity('fut', keg.id, a)))(false)
  };
}

export function choseBrassin(batch: Batch, o: Reglages = {}): ChoseASupprimer {
  return {
    sorte: 'brassin', id: batch.id, nom: `${batch.id} · ${batch.name}`, court: batch.id,
    liens: (s) => liensDuBrassin(batch, donnees('brassin', o.kegs, s, batch)),
    lireFut: lireFut(o), ecrireFut: ecrireFut(o),
    // Ce que l'ancienne confirmation disait déjà : supprimer n'est pas annuler, le stock consommé ne revient pas.
    avertissement: batch.status === 'planifie' ? undefined
      : 'Les ingrédients déjà consommés restent déstockés. Les éventuels retours d’ingrédients se consignent par une correction d’inventaire.',
    supprimer: () => StorageService.deleteBatch(batch.id),
    retablir: () => StorageService.addBatch(batch),
    archiver: () => { StorageService.setCatalogArchived('batch', batch.id, true); },
    ressortir: () => { StorageService.setCatalogArchived('batch', batch.id, false); }
  };
}

export function choseClient(client: Client, o: Reglages = {}): ChoseASupprimer {
  return {
    sorte: 'client', id: client.id, nom: client.name.trim() || client.id, court: client.name.trim() || client.id,
    liens: (s) => liensDuClient(client, donnees('client', o.kegs, s)),
    lireFut: lireFut(o), ecrireFut: ecrireFut(o),
    supprimer: () => StorageService.deleteClient(client.id),
    retablir: () => StorageService.updateClient(client),
    archiver: () => { StorageService.setArchivedEntity('client', client.id, true); },
    ressortir: () => { StorageService.setArchivedEntity('client', client.id, false); }
  };
}
