/* Jeu clairsemé commun du contrôle des renvois (CP-18, voie rvA) : les ÉTATS où la vraie app a des manques, tous ensemble.
   Base = `financeDemoEntries('reel')` (une seule vente, aucun solde de départ, brassin conditionné sans chiffrage, tarifs sans format, nom brut « Ssr »),
   plus ce que la base ne porte pas : un solde non confirmé (variante), un brassin sans litres ni densité, des ingrédients en stock sans facture (donc sans prix),
   un projet de matériel non daté, un paiement à confirmer, une pièce sans date, un matériel aux valeurs incomplètes, aucun inventaire.
   Rien n'est réel : noms, montants d'exemple. Aucun réseau, aucun Gemini. */
import { financeDemoEntries } from '../../src/dev/financeDemo';

export const ASOF = '2026-11-09';
export type Entree = { name: string; id: string; data: any };

export interface OptionsClairseme { /** `absent` : aucun solde de départ ; `nonConfirme` : un solde noté mais « à confirmer ». */ solde?: 'absent' | 'nonConfirme' }

export function clairseme({ solde = 'absent' }: OptionsClairseme = {}): Entree[] {
  const at = `${ASOF}T10:00:00.000Z`;
  const entrees: Entree[] = financeDemoEntries('reel').entries.map(e => ({ ...e }));
  const ajoute = (name: string, id: string, data: any) => entrees.push({ name, id, data });
  const profil = entrees.find(e => e.name === 'financialProfiles');
  if (profil && solde === 'nonConfirme') profil.data = { ...profil.data, openingCash: { date: '2026-01-01', amountCents: 480000, confirmed: false } };

  /* Un brassin conditionné SANS litres nets ni densité : pas de coût du litre, pas de titre. */
  ajoute('batches', 'CLAIR-LOT-4', { id: 'CLAIR-LOT-4', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '2026-09-15', status: 'conditionne', malts: [], hops: [],
    recipeSnapshot: { name: 'Pale Ale', style: 'Pale Ale', volumeL: 30, fermentables: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [{ name: 'Citra', weightG: 60, timing: 'ébullition', minutes: 60 }], yeast: { name: 'US05', qty: 1, unit: 'sachet', form: 'sèche' } } });
  /* Ingrédients en stock mais jamais facturés : ni prix ni valeur estimable. */
  ajoute('stockItems', 'CLAIR-S1', { id: 'CLAIR-S1', ref: 'CLAIR-S1', kind: 'rawMaterials', name: 'Pilsner', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 5 });
  ajoute('stockItems', 'CLAIR-S2', { id: 'CLAIR-S2', ref: 'CLAIR-S2', kind: 'rawMaterials', name: 'Citra', category: 'Houblon', unit: 'g', currentStock: 500, minStock: 100 });
  ajoute('stockItems', 'CLAIR-S3', { id: 'CLAIR-S3', ref: 'CLAIR-S3', kind: 'rawMaterials', name: 'Bouteilles 33 cl', category: 'Emballage', unit: 'pièce', currentStock: 300, minStock: 50 });
  /* Un projet de matériel non daté (CP-13) et un matériel aux valeurs incomplètes. */
  ajoute('financialPlans', 'CLAIR-PROJET', { id: 'CLAIR-PROJET', title: 'Nouvelle cuve de brassage', date: '', amountCents: 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: at });
  ajoute('financialAssets', 'CLAIR-IMMO', { id: 'CLAIR-IMMO', name: 'Chaudière', acquisitionDate: '2025-03-01', inServiceDate: '2025-03-01', acquisitionCents: 0, businessUsePct: 100, category: 'tanks', method: 'declining', ratePct: 20,
    openingYear: 2026, openingValueCents: 0, openingConfirmed: false, firstYearFraction: 1 });
  /* Une charge payée mais sans paiement noté (à confirmer) et une pièce sans date. */
  const tx = (id: string, description: string, centimes: number, extra: Record<string, unknown> = {}, patch: Record<string, unknown> = {}) => ({ id, date: '2026-10-12', description, amountHT: centimes / 100, amountTTC: centimes / 100, tvaAmount: 0, tvaRate: 0, category: 'divers', subcategory: '',
    finance: { version: 1, kind: 'expense', amountCents: centimes, vendor: 'Fournisseur', lines: [], paymentStatus: 'paid', recordedAt: at, ...extra }, ...patch });
  ajoute('transactions', 'CLAIR-T1', tx('CLAIR-T1', 'Électricité octobre', 8400, { paymentStatus: 'paid' }));
  ajoute('transactions', 'CLAIR-T2', tx('CLAIR-T2', 'Facture sans date', 3000, { paymentStatus: 'unpaid' }, { date: '' }));
  return entrees;
}

/** Les mêmes données, rangées par collection (la forme des props de l'Annuel, des brassins et du stock). */
export function parCollection(entrees: Entree[], name: string): any[] { return entrees.filter(e => e.name === name).map(e => e.data); }
