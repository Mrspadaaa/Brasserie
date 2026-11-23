// Lectures de pièce SIMULÉES (jamais Gemini) pour le PARCOURS CHAINES : ce que `scanInvoice` rendrait, à la forme du schéma de lecture.
// Une lecture par genre de pièce ; les dates suivent le jour du banc. Fournisseurs « ZZ TEST ». L'image donnée au sélecteur est `piece-simulee.png`.
export function lecturesChaines(aujourdhui) {
  const jour = (n) => new Date(Date.parse(`${aujourdhui}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
  return {
    // facture fournisseur à payer : le malt, le houblon, la levure (421,57 pour la « Commande de malt » prévue à 420)
    facture: { documentType: 'invoice', paymentEvidence: 'unpaid', paymentMethod: 'bank_transfer', vendor: 'ZZ TEST Brouwland', date: aujourdhui, currency: 'CHF', invoiceNumber: 'ZZ-BW-1142',
      amountHT: 389.98, tvaRate: 0.081, tvaAmount: 31.59, amountTTC: 421.57, category: 'brassage', description: 'Matières premières',
      items: [{ name: 'ZZ TEST Malt pilsner 25 kg', kind: 'stock', quantity: 1, unit: 'sac 25 kg', price: 49.5, amountTTC: 53.51, stockCategory: 'Malt' },
        { name: 'ZZ TEST Citra 2025', kind: 'stock', quantity: 500, unit: 'g', price: 0.62, amountTTC: 335.11, stockCategory: 'Houblon', alphaPct: 12.8 },
        { name: 'ZZ TEST US-05 11,5 g', kind: 'stock', quantity: 6, unit: 'sachet', price: 5.2, amountTTC: 32.95, stockCategory: 'Levure' }], issues: [] },
    // ticket payé par carte, une ligne sans article au stock
    ticket: { documentType: 'receipt', paymentEvidence: 'paid', paymentMethod: 'card', vendor: 'ZZ TEST Landi', date: jour(-3), currency: 'CHF', amountPaid: 24.9,
      amountHT: 23.03, tvaRate: 0.081, tvaAmount: 1.87, amountTTC: 24.9, category: 'nettoyage', description: 'Soude',
      items: [{ name: 'ZZ TEST Soude caustique 2 kg', kind: 'stock', quantity: 2, unit: 'kg', price: 12.45, amountTTC: 24.9, stockCategory: 'CIP alcalin' }], issues: [] },
    // facture de l'impôt sur la bière (OFDF), payée
    impot: { documentType: 'invoice', paymentEvidence: 'paid', paymentMethod: 'bank_transfer', vendor: 'ZZ TEST OFDF', date: aujourdhui, currency: 'CHF', invoiceNumber: 'ZZ-OFDF-Q4',
      amountHT: 37.37, tvaRate: 0, tvaAmount: 0, amountTTC: 37.37, category: 'chargesFixes', description: 'Impôt sur la bière', items: [], issues: [] },
    // facture de matériel payée, du mois dernier : la pompe à 450 (le projet « Pompe de transfert » est prévu à 450)
    pompe: { documentType: 'invoice', paymentEvidence: 'paid', paymentMethod: 'bank_transfer', vendor: 'ZZ TEST Brewferm', date: jour(-24), currency: 'CHF', invoiceNumber: 'ZZ-BF-77',
      amountHT: 416.28, tvaRate: 0.081, tvaAmount: 33.72, amountTTC: 450, category: 'materiel', description: 'Pompe de transfert',
      items: [{ name: 'ZZ TEST Pompe de transfert', kind: 'equipment', quantity: 1, unit: 'pce', price: 450, amountTTC: 450 }], issues: [] }
  };
}
