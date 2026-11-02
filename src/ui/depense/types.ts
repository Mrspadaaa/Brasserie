// Le contrat du banc de développement (type seulement : aucun import de la fixture ici, donc rien de simulé dans `dist/`).
import type { ScanOutcome } from '../../services/geminiScanner';
import type { PurchaseDraft } from '../../services/purchaseEntry';
import type { DriveProofReceipt } from '../../services/financeDocuments';
import type { StockItem, EquipmentItem, KegItem } from '../../types';
import type { FinanceTransaction } from '../../domain/finance/types';

export interface ApercuDepense {
  /** La lecture simulée (Gemini n'est jamais appelé) ; `ok:false` pour l'état 5. */
  outcome: ScanOutcome;
  fichier: { name: string; size: number; type: string };
  stocks: { rawMaterials: StockItem[]; cleaning: StockItem[]; equipment: EquipmentItem[]; kegs: KegItem[] };
  transactions: FinanceTransaction[];
  /** 1 à 9 (4, 4b, 7, 7b se jouent aux gestes) : 1 lecture en cours, 5 erreur, 6 Drive pas connecté, 8 doublon, 9 hors ligne. */
  etat: string;
  drive: 'ok' | 'non';
  reseau: boolean;
  /** Banc du QR (développement seulement) : un VRAI fichier fictif (image ou PDF portant un QR-facture), lu par le vrai décodeur dans le navigateur ; la lecture Gemini reste simulée. */
  qrFichier?: { url: string; name: string; type: string };
  /** Banc du QR (développement seulement) : un résultat de lecture SIMULÉ (aucun décodage), pour un état qu'aucune pièce ne produit proprement (QR non conforme). */
  qrSimule?: import('../../services/qrLecture').ResultatQr;
  /**
   * Lenteur D (développement seulement, SIMULÉ) : le morceau provisoire (les deux premières lectures), puis le final `delaiMs` plus tard ; `delaiMs: null` : le final n'arrive jamais (l'attente reste).
   * `final` peut être `ok:false` (la fin de partie). Sans `provisoire`, la lecture est celle d'aujourd'hui (`outcome`, un seul écran).
   */
  provisoire?: ScanOutcome;
  final?: ScanOutcome;
  delaiMs?: number | null;
  /** SIMULÉ : remplace l'enregistrement réel (aucune écriture, aucun Drive) ; rend un reçu fabriqué. */
  enregistrer: (draft: PurchaseDraft) => Promise<DriveProofReceipt | undefined>;
}
