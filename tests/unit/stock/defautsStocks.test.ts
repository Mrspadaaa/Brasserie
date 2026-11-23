// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Batch, Recipe, StockItem } from '../../../src/types';

/**
 * Voie d-stocks (mission 2026-11-08-defauts) : une règle par famille de défauts, jouée sur le domaine ET sur le service d'écriture.
 * Dépôt Firestore remplacé par un dépôt en mémoire (même gabarit que tests/integration/storage.test.ts) ; aucun réseau, aucun Gemini.
 */

const store = new Map<string, Map<string, Record<string, unknown>>>();
const fakeRepo = {
  all: <T>(name: string): T[] => Array.from(store.get(name)?.entries() ?? []).map(([__docId, doc]) => ({ ...doc, __docId }) as T),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: (name: string, id: string, field: string, delta: number, extra: Record<string, unknown> = {}) => {
    const current = store.get(name)?.get(id) ?? {};
    fakeRepo.put(name, id, { ...extra, [field]: (Number(current[field]) || 0) + delta }, { merge: true });
  },
  remove: (name: string, id: string) => { store.get(name)?.delete(id); },
  startSync: () => {}, isReady: () => true, subscribe: () => () => {}, consumeError: () => null, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));

const { StorageService } = await import('../../../src/services/storage');
const regles = await import('../../../src/domain/stock/regles');
const { pendingStockSummary, allocatedBatches, computeStockLevel } = await import('../../../src/domain/stockLevel');
const { disponibilites } = await import('../../../src/domain/stock/disponibilite');
/** Le manque d'un article pour des brassins : l'unique disponibilité (R1), sans recette écrite. */
const shortfall = (a: StockItem, batches: Batch[]): number => disponibilites([a], batches, []).parArticle.get(a.ref)!.manque ?? Number.NaN;

const article = (over: Partial<StockItem> = {}): StockItem => ({
  id: 'RM-1', ref: 'MP-001', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 5, reorder: false, ...over
});

beforeEach(() => { store.clear(); });

describe('AM-54 — correction d’inventaire : le motif suit le signe de l’écart', () => {
  it('un compté supérieur au théorique n’admet ni casse, ni perte, ni don', () => {
    expect(regles.motifsAdmis(2)).toEqual(['comptage', 'saisie']);
    expect(regles.motifsAdmis(-2)).toEqual(['comptage', 'casse', 'perte', 'saisie', 'don']);
  });
  it('verifierCorrection refuse un gain « casse », un négatif et un non-nombre', () => {
    const a = article();
    expect(regles.verifierCorrection(a, 30, 'casse')).toMatchObject({ ok: false });
    expect(regles.verifierCorrection(a, 30, 'comptage')).toEqual({ ok: true, ecart: 5 });
    expect(regles.verifierCorrection(a, -1, 'comptage')).toMatchObject({ ok: false });
    expect(regles.verifierCorrection(a, NaN, 'comptage')).toMatchObject({ ok: false });
    expect(regles.verifierCorrection(a, 20, 'casse')).toEqual({ ok: true, ecart: -5 });
  });
  it('le service n’écrit rien quand le motif est incohérent ou le compté négatif', () => {
    StorageService.addStockItem('rawMaterials', article());
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', 30, 'perte')).toBeNull();
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', -3, 'comptage')).toBeNull();
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(25);
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', 30, 'saisie')).toEqual({ delta: 5 });
    expect(StorageService.getStocks().rawMaterials[0].currentStock).toBe(30);
  });
  it('R4 (k2) : l’inventaire écrit un mouvement (avant, écart, après, motif, date), un gain sans motif de perte aussi', () => {
    StorageService.addStockItem('rawMaterials', article({ currentStock: 25 }));
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', 30, 'comptage', 'rayon du fond')).toEqual({ delta: 5 });
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', 20, 'casse')).toEqual({ delta: -10 });
    expect(StorageService.adjustInventory('rawMaterials', 'MP-001', 30, 'perte')).toBeNull(); // un gain n'est pas une perte (AM-54)
    const mouvements = [...(store.get('movements')?.values() ?? [])].filter(m => m.type === 'inventory-adjustment');
    expect(mouvements).toHaveLength(2); // le refus n'écrit rien
    expect(mouvements[0]).toMatchObject({ stockItemRef: 'MP-001', previousStock: 25, delta: 5, newStock: 30, reasonCode: 'comptage', note: 'rayon du fond' });
    expect(mouvements[1]).toMatchObject({ previousStock: 30, delta: -10, newStock: 20, reasonCode: 'casse' });
    expect(String(mouvements[0].date)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mouvements[0].reason).toBeTruthy();
  });
  it('la correction remet à jour le drapeau « à commander »', () => {
    StorageService.addStockItem('rawMaterials', article({ currentStock: 25, minStock: 5 }));
    StorageService.adjustInventory('rawMaterials', 'MP-001', 4, 'casse');
    expect(StorageService.getStocks().rawMaterials[0].reorder).toBe(true);
  });
});

describe('AM-55 — un article réservé par un brassin ou cité par une recette ne se supprime pas', () => {
  const recette = (over: Partial<Recipe> = {}): Recipe => ({ id: 'R1', name: 'Pils maison', style: 'Pilsner', volumeL: 20, fermentables: [{ name: 'Pilsner Malz', weightKg: 4, stockItemRef: 'MP-001' }], hops: [], ...over }) as unknown as Recipe;
  it('liensArticle trouve la recette par référence puis par nom', () => {
    const a = article();
    expect(regles.liensArticle(a, [], [recette()]).recettes).toEqual(['Pils maison']);
    expect(regles.liensArticle(a, [], [recette({ fermentables: [{ name: ' pilsner  MALZ ', weightKg: 1 }] } as Partial<Recipe>)]).recettes).toEqual(['Pils maison']);
    expect(regles.liensArticle(a, [], [recette({ fermentables: [{ name: 'Autre', weightKg: 1, stockItemRef: 'MP-002' }] } as Partial<Recipe>)]).recettes).toEqual([]);
  });
  it('le service refuse et garde l’article, puis l’accepte une fois la recette retirée', () => {
    StorageService.addStockItem('rawMaterials', article());
    StorageService.addRecipe(recette());
    const refus = StorageService.deleteStockItem('rawMaterials', 'MP-001');
    expect(refus.ok).toBe(false);
    expect(refus.refus).toMatch(/Pils maison/);
    expect(StorageService.getStocks().rawMaterials).toHaveLength(1);
    StorageService.deleteRecipe('R1');
    expect(StorageService.deleteStockItem('rawMaterials', 'MP-001').ok).toBe(true);
    expect(StorageService.getStocks().rawMaterials).toHaveLength(0);
  });
  it('un brassin qui réserve des ajouts retient aussi l’article', () => {
    const brassin = { id: 'B1', name: 'LOT-001', status: 'fermentation', stockConsumption: { appliedAt: 'x', items: [], pendingItems: [{ stockItemRef: 'MP-001', quantity: 1, unit: 'kg' }] } } as unknown as Batch;
    expect(regles.liensArticle(article(), [brassin], []).brassins).toEqual(['LOT-001']);
    expect(regles.motifNonSuppression(regles.liensArticle(article(), [brassin], []))).toMatch(/LOT-001/);
    expect(regles.motifNonSuppression({ brassins: [], recettes: [] })).toBe('');
  });
});

describe('AM-36 — brassin annulé : les ajouts restants sont libérés', () => {
  const pending = { stockItemRef: 'MP-001', quantity: 3, unit: 'kg' };
  const brassin = (status: string) => ({ id: 'B1', name: 'LOT-001', status, stockConsumption: { appliedAt: 'x', items: [], pendingItems: [pending] } }) as unknown as Batch;
  it('actif : 3 kg réservés ; annulé : plus rien de réservé, de dû ni de bloqué', () => {
    const a = article({ currentStock: 10 });
    expect(pendingStockSummary(a, [brassin('fermentation')]).knownQuantity).toBe(3);
    expect(pendingStockSummary(a, [brassin('annule')]).knownQuantity).toBe(0);
    expect(allocatedBatches(a, [brassin('annule')])).toEqual([]);
    expect(shortfall(a, [brassin('annule')])).toBe(0);
    expect(computeStockLevel(a, [brassin('annule')]).band).not.toBe('rupture');
  });
});

describe('AM-53 — « Enregistrer » ne remplace pas la quantité par une copie ancienne', () => {
  it('seuls les champs changés dans la fiche s’appliquent au document vivant', () => {
    const ouverte = article({ currentStock: 25, supplier: 'Weyermann' });
    const vivant = article({ currentStock: 40, supplier: 'Weyermann', nomsFacture: ['Pilsner malt'] }); // un achat de 15 kg est arrivé pendant l'édition
    const saisie = { ...ouverte, minStock: 8 };
    const fiche = regles.ficheAEnregistrer(vivant, ouverte, saisie);
    expect(fiche.currentStock).toBe(40);
    expect(fiche.minStock).toBe(8);
    expect(fiche.nomsFacture).toEqual(['Pilsner malt']);
  });
  it('kg → g convertit le stock VIVANT, pas la copie ouverte (25 kg + 15 kg reçus = 40 000 g)', () => {
    const ouverte = article({ currentStock: 25, minStock: 5 });
    const vivant = article({ currentStock: 40, minStock: 5 });
    const saisie = { ...ouverte, unit: 'g', currentStock: 25000, minStock: 5000 };
    const fiche = regles.ficheAEnregistrer(vivant, ouverte, saisie);
    expect(fiche.unit).toBe('g');
    expect(fiche.currentStock).toBe(40000);
    expect(fiche.minStock).toBe(5000);
  });
  it('un champ vidé dans la fiche disparaît', () => {
    const ouverte = article({ supplier: 'Weyermann' });
    const fiche = regles.ficheAEnregistrer(ouverte, ouverte, { ...ouverte, supplier: undefined });
    expect(fiche.supplier).toBeUndefined();
  });
  it('le service enregistre la fiche avec la quantité du moment', () => {
    StorageService.addStockItem('rawMaterials', article({ currentStock: 25 }));
    const ouverte = StorageService.getStocks().rawMaterials[0];
    StorageService.adjustInventory('rawMaterials', 'MP-001', 40, 'comptage'); // arrivée pendant l'édition
    StorageService.saveStockItemFiche('rawMaterials', ouverte, { ...ouverte, minStock: 9, reorder: false });
    const apres = StorageService.getStocks().rawMaterials[0];
    expect(apres.currentStock).toBe(40);
    expect(apres.minStock).toBe(9);
  });
  it('épingler n’écrase pas la quantité (fusion)', () => {
    StorageService.addStockItem('rawMaterials', article({ currentStock: 25 }));
    StorageService.toggleFavorite('stockItem', 'MP-001');
    const a = StorageService.getStocks().rawMaterials[0];
    expect(a.favorite).toBe(true);
    expect(a.currentStock).toBe(25);
  });
});

describe('MV-43, BR-76 — un seuil minimum plausible', () => {
  it('plafonne à une tonne, un million de grammes', () => {
    expect(regles.plafondSeuil('kg')).toBe(1000);
    expect(regles.plafondSeuil('g')).toBe(1_000_000);
    expect(regles.verifierSeuil(999_999, 'kg')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(99_999, 'kg')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(25, 'kg')).toEqual({ ok: true });
    expect(regles.verifierSeuil(0, 'kg')).toEqual({ ok: true });
    expect(regles.verifierSeuil(-1, 'kg')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(NaN, 'g')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(5_000, 'g')).toEqual({ ok: true });
  });
});

describe('AM-56 — durabilité', () => {
  it('périmé, bientôt, valide, inconnu — l’inconnu n’est jamais « valide »', () => {
    expect(regles.statutDurabilite('2026-11-07', '2026-11-08')).toEqual({ statut: 'perime', jours: -1 });
    expect(regles.statutDurabilite('2026-11-08', '2026-11-08')).toEqual({ statut: 'bientot', jours: 0 });
    expect(regles.statutDurabilite('2026-12-08', '2026-11-08').statut).toBe('bientot');
    expect(regles.statutDurabilite('2026-12-09', '2026-11-08').statut).toBe('valide');
    expect(regles.statutDurabilite(undefined, '2026-11-08').statut).toBe('inconnu');
    expect(regles.statutDurabilite('2026-02-31', '2026-11-08').statut).toBe('inconnu');
    expect(regles.statutDurabilite('08.11.2026', '2026-11-08').statut).toBe('inconnu');
  });
  it('les mots affichés', () => {
    expect(regles.libelleDurabilite('2026-11-05', '2026-11-08')).toEqual({ texte: 'Périmé depuis 3 j', perime: true });
    expect(regles.libelleDurabilite('2026-11-20', '2026-11-08')).toEqual({ texte: 'Périme dans 12 j', perime: false });
    expect(regles.libelleDurabilite('2027-06-01', '2026-11-08')).toBeNull();
    expect(regles.libelleDurabilite(undefined, '2026-11-08')).toBeNull();
  });
});

describe('TE-23, BR-71 — ce qu’on montre', () => {
  it('une référence de fiche apprise n’est jamais affichée', () => {
    expect(regles.refAffichable('FICHE-Houblon%3Aariana')).toBe('');
    expect(regles.refAffichable('MP-004')).toBe('MP-004');
    expect(regles.refAffichable(undefined)).toBe('');
  });
  it('BR-72 : quantités prévues lisibles comme sur une balance', () => {
    expect(regles.quantiteLue(123.45, 'g')).toBe('123 g');
    expect(regles.quantiteLue(56.88, 'g')).toBe('57 g');
    expect(regles.quantiteLue(4.123, 'kg')).toBe('4,12 kg');
    expect(regles.quantiteLue(4.5, 'g')).toBe('4,5 g');
    expect(regles.quantiteLue(0.4, 'kg')).toBe('400 g');
    expect(regles.quantiteLue(1500, 'g')).toBe('1,5 kg');
    expect(regles.quantiteLue(0.04, 'g')).not.toMatch(/^0 /); // non nul : jamais « 0 »
    expect(regles.quantiteLue(0, 'g')).toBe('0 g');
  });
  it('TE-50 : un zéro se dit « aucun »', () => {
    expect(regles.resumeIndexHoublon(136, 0, 0)).toEqual(['136 références', 'aucun lot']);
    expect(regles.resumeIndexHoublon(136, 3, 0)).toEqual(['136 références', '3 lots', 'aucun analysé']);
    expect(regles.resumeIndexHoublon(1, 1, 1)).toEqual(['1 référence', '1 lot', '1 analysé']);
  });
  it('la virgule suisse partout', () => {
    expect(regles.nombreFr(3.5, 1)).toBe('3,5');
    expect(regles.nombreFr(11.5, 2)).toBe('11,5');
    expect(regles.nombreFr(-0.5, 1)).toBe('-0,5');
    expect(regles.nombreFr(NaN)).toBe('');
  });
});
