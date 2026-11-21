// Fixture VENDRE — données simulées, rien de la vraie brasserie. Dates relatives.
const MS = 86400000, iso = d => d.toISOString().slice(0, 10);
export const aj = (j, n) => iso(new Date(Date.parse(`${j}T12:00:00Z`) + n * MS));
const ch = j => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;
export function fixtureVendre(auj) {
  const E = []; const add = (name, id, data) => E.push({ name, id, data: { ...data, id } });
  const at = `${aj(auj, -30)}T08:00:00.000Z`;
  const rs = (nom) => ({ name: nom, volumeL: 100, ogTarget: 1.052, fermentables: [{ name: 'Malt pale', weightKg: 20, kind: 'grain' }], hops: [{ name: 'Citra', weightG: 200, stage: 'boil', time: 60 }], yeast: { name: 'SafAle US-05', qty: 2, unit: 'sachet' }, fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 14 }] });
  const b = (id, name, jour, status, extra = {}) => ({ id, name, style: name, volumeL: 100, brewDate: ch(jour), actualBrewDate: ch(jour), plannedBrewDate: ch(jour), status, gravityLog: [], recipeRef: `R-${id}`, stockAccountingVersion: 1, recipeSnapshot: rs(name), ...extra });
  const batches = [
    b('LOT-PA', 'Pale Ale', aj(auj, -45), 'conditionne', { packaging: { bottles33: 120, bottles75: 0, kegIds: ['F-001', 'F-002', 'F-004'] }, volumePackagedL: 99.6, packagingDate: ch(aj(auj, -20)) }),
    b('LOT-NE', 'NEIPA', aj(auj, -60), 'termine', { packaging: { bottles33: 0, bottles75: 24, kegIds: ['F-003'] }, volumePackagedL: 48, packagingDate: ch(aj(auj, -35)) }),
    b('LOT-SA', 'Saison', aj(auj, -8), 'fermentation', { gravityLog: [{ date: aj(auj, -6), sg: 1.03, tempC: 20 }] })
  ];
  for (const x of batches) { add('batches', x.id, x); add('recipes', x.recipeRef, { id: x.recipeRef, name: x.name, style: x.name, volumeL: 100, ingredients: [] }); }
  const H = (d, quoi, detail) => ({ date: ch(d), quoi, ...(detail ? { detail } : {}) });
  const fut = (id, cap, state, extra = {}) => add('kegs', id, { capacityL: cap, state, ...extra });
  fut('F-001', 20, 'plein', { batchRef: 'LOT-PA', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: ch(aj(auj, -20)), historique: [H(aj(auj, -90), 'ajoute'), H(aj(auj, -20), 'rempli', 'Pale Ale LOT-PA')] });
  fut('F-002', 20, 'plein', { batchRef: 'LOT-PA', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: ch(aj(auj, -20)), historique: [H(aj(auj, -90), 'ajoute'), H(aj(auj, -20), 'rempli', 'Pale Ale LOT-PA')] });
  fut('F-003', 30, 'plein', { batchRef: 'LOT-NE', beerName: 'NEIPA', style: 'NEIPA', fillDate: ch(aj(auj, -35)), historique: [H(aj(auj, -35), 'rempli', 'NEIPA LOT-NE')] });
  fut('F-004', 20, 'livre', { batchRef: 'LOT-PA', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: ch(aj(auj, -20)), clientId: 'CL-CIGOGNE', clientName: 'La Cigogne', deliveryDate: ch(aj(auj, -18)), historique: [H(aj(auj, -20), 'rempli', 'Pale Ale LOT-PA'), H(aj(auj, -18), 'livre', 'La Cigogne')] });
  fut('F-005', 20, 'propre', { historique: [H(aj(auj, -5), 'lave')] });
  const adr = { rue: 'Rue du Lac', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' };
  add('clients', 'CL-CIGOGNE', { name: 'La Cigogne', type: 'Pro', contact: 'Paul', phone: '', email: '', adresse: adr, address: 'Rue du Lac 4, 1700 Fribourg' });
  add('clients', 'CL-PONT', { name: 'Café du Pont', type: 'Pro', contact: '', phone: '', email: '' });
  add('clients', 'CL-MARIE', { name: 'Marie Dupont', type: 'Privé', contact: '', phone: '', email: '' });
  const t = (prod, biere, fid, vol, prix) => add('tarifs', prod.toLowerCase().replace(/[^a-z0-9]+/g, '-'), { product: prod, biere, format: { id: fid, volumeL: vol }, priceHT: prix });
  t('Pale Ale 33 cl', 'Pale Ale', '33cl', 0.33, 4.5); t('Pale Ale fût 20 L', 'Pale Ale', 'fut', 20, 140); t('NEIPA 75 cl', 'NEIPA', '75cl', 0.75, 12);
  add('transactions', 'F-2026-001', { date: aj(auj, -18), description: 'Facture La Cigogne', category: 'recettes', subcategory: 'Facture client', amountHT: 140, amountTTC: 140, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'income', amountCents: 14000, vendor: 'La Cigogne', invoiceNumber: 'F-2026-001', lines: [], paymentStatus: 'unpaid', dueDate: aj(auj, 12), recordedAt: `${aj(auj, -18)}T09:00:00.000Z` } });
  add('financialPlans', 'P-VENTE-CIG', { title: 'La Cigogne, 2 fûts', date: aj(auj, 10), amountCents: 28000, direction: 'in', category: 'recettes', source: 'manual', status: 'active', batchId: 'LOT-PA', clientId: 'CL-CIGOGNE', createdAt: at });
  add('financialProfiles', 'current', { canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: `${auj.slice(0, 4)}-01-01`, openingCash: { date: `${auj.slice(0, 4)}-01-01`, amountCents: 250000, confirmed: true } });
  return E;
}
