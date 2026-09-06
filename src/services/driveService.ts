import { FinanceCategory, Transaction } from '../types';

export class DriveService {
  /**
   * Map internal financial category to clean Drive directory name
   */
  static getCategoryFolderName(cat: FinanceCategory): string {
    switch (cat) {
      case 'recettes':
        return 'Ventes';
      case 'brassage':
        return 'Achats_Brassage';
      case 'materiel':
        return 'Achats_Materiel';
      case 'nettoyage':
        return 'Produits_Nettoyage';
      case 'chargesFixes':
        return 'Charges_Fixes';
      case 'renovation':
        return 'Local_Renovation';
      case 'apports':
        return 'Apports_Bancaires';
      case 'divers':
      default:
        return 'Frais_Divers';
    }
  }

  /**
   * Generates formatted Year-Month subfolder: '2026-05'
   */
  static getYearMonthFolder(dateStr: string): string {
    // Format: DD.MM.YYYY
    const parts = (dateStr || '').split('.');
    if (parts.length === 3) {
      const year = parts[2];
      const month = parts[1].padStart(2, '0');
      return `${year}-${month}`;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Sanitizes string for safe filename
   */
  static sanitizeName(str: string): string {
    return (str || 'Doc')
      .replace(/[\/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .trim();
  }

  /**
   * Formats exact filename according to Gaëtan's rule:
   * [JJ-MM-AAAA]_[Fournisseur_ou_Client]_[Montant]CHF.[ext]
   */
  static generateFileName(
    dateStr: string,
    vendorOrClient: string,
    amountCHF: number,
    ext: string = 'pdf'
  ): string {
    const safeDate = (dateStr || '01.01.2026').replace(/\./g, '-');
    const safeName = this.sanitizeName(vendorOrClient);
    const safeAmount = (amountCHF || 0).toFixed(2);
    const cleanExt = ext.replace(/^\./, '');
    return `${safeDate}_${safeName}_${safeAmount}CHF.${cleanExt}`;
  }

  /**
   * Generates the complete Google Drive hierarchy path:
   * e.g. "Achats_Brassage/2026-04/27-04-2026_Brau-Rauchshop_110.39CHF.pdf"
   */
  static generateDrivePath(tx: Partial<Transaction>, ext: string = 'pdf'): string {
    const catFolder = this.getCategoryFolderName(tx.category || 'brassage');
    const ymFolder = this.getYearMonthFolder(tx.date || '01.01.2026');
    const fileName = this.generateFileName(
      tx.date || '01.01.2026',
      tx.proofNotes || tx.description || 'Document',
      tx.amountTTC || tx.amountHT || 0,
      ext
    );
    return `${catFolder}/${ymFolder}/${fileName}`;
  }

  /**
   * Prepares and triggers export manifest / download for Google Drive
   */
  static exportDriveManifest(transactions: Transaction[]) {
    const lines = [
      'CHEMIN GOOGLE DRIVE,DATE,CATÉGORIE,DESCRIPTION,MONTANT HT,TVA,MONTANT TTC,JUSTIFICATIF PRÉSENT'
    ];

    transactions.forEach((tx) => {
      const drivePath = this.generateDrivePath(tx);
      const hasProof = Boolean(tx.proofUrl);
      lines.push(
        `"${drivePath}","${tx.date}","${this.getCategoryFolderName(tx.category)}","${tx.description.replace(/"/g, '""')}",${tx.amountHT},${(tx.tvaRate * 100).toFixed(1)}%,${tx.amountTTC},${hasProof ? 'OUI' : 'NON'}`
      );
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Arborescence_Google_Drive_L_Affinee_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
