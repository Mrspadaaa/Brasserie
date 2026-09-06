import * as XLSX from 'xlsx';
import { StorageService } from './storage';
import { ClientStatsService } from './clientStats';

export const ExcelService = {
  exportToExcel() {
    const wb = XLSX.utils.book_new();

    // 1. Finances
    const txs = StorageService.getTransactions();
    const financesRows = txs.map((t) => ({
      'N°': t.id,
      Date: t.date,
      Description: t.description,
      'Montant HT (CHF)': t.amountHT,
      'TVA %': `${(t.tvaRate * 100).toFixed(1)}%`,
      'TVA (CHF)': t.tvaAmount,
      'Montant TTC (CHF)': t.amountTTC,
      Catégorie: t.category,
      'Sous-catégorie': t.subcategory,
      'Justificatif / Remarque': t.proofNotes || ''
    }));
    const wsFinances = XLSX.utils.json_to_sheet(financesRows);
    XLSX.utils.book_append_sheet(wb, wsFinances, 'Finances');

    // 2. Production
    const batches = StorageService.getBatches();
    const prodRows = batches.map((b) => ({
      'N° Lot': b.id,
      'Date brassage': b.brewDate,
      'Nom de la bière': b.name,
      Style: b.style,
      'Volume (L)': b.volumeL,
      'Densité initiale (OG)': b.og || '',
      'Densité finale (FG)': b.fg || '',
      'Alcool (%vol)': b.abv || '',
      'Date mise en bouteille': b.bottlingDate || '',
      Statut: b.status,
      Recette: b.recipeRef || ''
    }));
    const wsProd = XLSX.utils.json_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Production');

    // 3. Stocks
    const stocks = StorageService.getStocks();
    const stockRows = stocks.rawMaterials.map((s) => ({
      'Réf.': s.ref,
      Désignation: s.name,
      Catégorie: s.category,
      Unité: s.unit,
      'Stock actuel': s.currentStock,
      'Stock mini': s.minStock,
      'Réappro. nécessaire?': s.reorder ? 'OUI' : 'non',
      Fournisseur: s.supplier || ''
    }));
    const wsStocks = XLSX.utils.json_to_sheet(stockRows);
    XLSX.utils.book_append_sheet(wb, wsStocks, 'Stocks');

    // 4. Fûts (Kegs)
    const kegRows = stocks.kegs.map((k) => ({
      'N° Fût': k.id,
      'Capacité (L)': k.capacityL,
      État: k.state,
      'N° Lot': k.batchRef || '',
      Bière: k.beerName || '',
      Style: k.style || '',
      'Date remplissage': k.fillDate || '',
      Remarques: k.notes || ''
    }));
    const wsKegs = XLSX.utils.json_to_sheet(kegRows);
    XLSX.utils.book_append_sheet(wb, wsKegs, 'Fûts');

    // 5. Clients — les chiffres sont recalculés depuis les ventes réelles
    const clients = StorageService.getClients();
    const clientTxs = StorageService.getTransactions();
    const clientRows = clients.map((c) => {
      const stats = ClientStatsService.forClient(c, clientTxs);
      return {
        'N° Client': c.id,
        'Nom / Raison sociale': c.name,
        Type: c.type,
        Contact: c.contact,
        Téléphone: c.phone,
        Email: c.email,
        'Dernière commande': stats.lastOrder || '—',
        'Nb de ventes': stats.orderCount,
        'CA total (CHF)': stats.totalSales,
        Statut: stats.status
      };
    });
    const wsClients = XLSX.utils.json_to_sheet(clientRows);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clients');

    // 6. Tarifs
    const tarifs = StorageService.getTarifs();
    const wsTarifs = XLSX.utils.json_to_sheet(tarifs);
    XLSX.utils.book_append_sheet(wb, wsTarifs, 'Tarifs & Prix');

    // Download
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `L-Affinee_Admin_${dateStr}.xlsx`);
  }
};
