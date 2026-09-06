import { FinanceCategory } from '../types';
import { AiClient, AiTier } from './aiClient';

export interface ScannedInvoiceResult {
  vendor: string;
  date: string; // JJ.MM.AAAA
  amountHT: number;
  tvaRate: number; // 0, 0.026, 0.081
  tvaAmount: number;
  amountTTC: number;
  category: FinanceCategory;
  subcategory: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price?: number;
    stockCategory?: string;
  }>;
}

export interface ScanOutcome {
  /** `false` = aucun montant extrait. L'appelant DOIT passer en saisie manuelle. */
  ok: boolean;
  result?: ScannedInvoiceResult;
  proofDataUrl: string;
  fileName: string;
  mimeType: string;
  /** Modèle réellement utilisé, affiché pour garder le résultat traçable. */
  model?: string;
  elapsedMs?: number;
  /** Message affichable expliquant pourquoi l'extraction a échoué. */
  error?: string;
}

const FINANCE_CATEGORIES: FinanceCategory[] = [
  'brassage',
  'materiel',
  'nettoyage',
  'chargesFixes',
  'renovation',
  'divers'
];

const TVA_RATES = [0, 0.026, 0.081];

export const GeminiScannerService = {
  /** Conversion en Data URL — sert à conserver et afficher le justificatif. */
  async fileToDataUrl(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  normalizeMimeType(file: File): string {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return 'application/pdf';
    }
    return file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  },

  /**
   * Analyse un justificatif via la passerelle serveur.
   *
   * La clé Gemini ne passe PLUS par le navigateur : l'appel part vers une Cloud
   * Function qui la lit dans Secret Manager.
   *
   * En cas d'échec (IA non configurée, modèle indisponible, document illisible),
   * cette fonction ne fabrique JAMAIS de montant. Elle renvoie `ok: false` et le
   * justificatif, à charge de l'interface d'ouvrir une saisie manuelle VIDE.
   */
  async scanDocument(file: File, tier: AiTier = 'fast'): Promise<ScanOutcome> {
    const proofDataUrl = await this.fileToDataUrl(file);
    const mimeType = this.normalizeMimeType(file);

    const base = { proofDataUrl, fileName: file.name, mimeType };

    const response = await AiClient.run<any>({
      task: 'scanInvoice',
      tier,
      file
    });

    if (!response.ok || !response.data) {
      return {
        ...base,
        ok: false,
        error:
          response.error ||
          "Le document n'a pas pu être analysé. Saisis les montants à la main."
      };
    }

    const result = this.normalizeResult(response.data);

    // Garde-fou : sans montant exploitable, on considère le scan raté plutôt que
    // d'enregistrer une écriture à 0 CHF qui passerait inaperçue.
    if (result.amountHT <= 0 && result.amountTTC <= 0) {
      return {
        ...base,
        ok: false,
        model: response.model,
        error:
          "Le document a été lu mais aucun montant n'a pu en être extrait. Saisis-le à la main."
      };
    }

    return {
      ...base,
      ok: true,
      result,
      model: response.model,
      elapsedMs: response.elapsedMs
    };
  },

  /** Normalise et recoupe la réponse du modèle (jamais de valeur inventée). */
  normalizeResult(parsed: any): ScannedInvoiceResult {
    const rawRate = Number(parsed?.tvaRate);
    // On force le taux sur l'un des trois taux suisses valides.
    const tvaRate = TVA_RATES.includes(rawRate)
      ? rawRate
      : TVA_RATES.reduce((best, r) =>
          Math.abs(r - (rawRate || 0)) < Math.abs(best - (rawRate || 0)) ? r : best
        );

    let amountHT = Number(parsed?.amountHT) || 0;
    let amountTTC = Number(parsed?.amountTTC) || 0;

    // Recoupement : si un seul des deux montants a été lu, on déduit l'autre.
    if (amountHT <= 0 && amountTTC > 0) {
      amountHT = Math.round((amountTTC / (1 + tvaRate)) * 100) / 100;
    } else if (amountTTC <= 0 && amountHT > 0) {
      amountTTC = Math.round(amountHT * (1 + tvaRate) * 100) / 100;
    }

    const tvaAmount = Math.round((amountTTC - amountHT) * 100) / 100;
    const category: FinanceCategory = FINANCE_CATEGORIES.includes(parsed?.category)
      ? parsed.category
      : 'divers';

    return {
      vendor: String(parsed?.vendor || '').trim(),
      date: this.normalizeDate(parsed?.date),
      amountHT,
      tvaRate,
      tvaAmount: tvaAmount > 0 ? tvaAmount : 0,
      amountTTC,
      category,
      subcategory: String(parsed?.subcategory || '').trim(),
      description: String(parsed?.description || '').trim(),
      items: Array.isArray(parsed?.items)
        ? parsed.items
            .filter((it: any) => it?.name)
            .map((it: any) => ({
              name: String(it.name).trim(),
              quantity: Number(it.quantity) || 0,
              unit: String(it.unit || '').trim(),
              price: Number(it.price) || undefined,
              stockCategory: it.stockCategory ? String(it.stockCategory).trim() : undefined
            }))
        : []
    };
  },

  /** Ramène toute date lue au format JJ.MM.AAAA, ou renvoie '' si illisible. */
  normalizeDate(raw: any): string {
    const str = String(raw || '').trim();
    if (!str) return '';

    const dotted = str.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
    if (dotted) {
      const [, d, m, y] = dotted;
      const year = y.length === 2 ? `20${y}` : y;
      return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${year}`;
    }

    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const [, y, m, d] = iso;
      return `${d}.${m}.${y}`;
    }

    return '';
  }
};
