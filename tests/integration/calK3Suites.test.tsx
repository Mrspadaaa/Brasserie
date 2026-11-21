/**
 * K3-SUITES (21.11) : un brassin posé par la feuille du Calendrier est PLANIFIÉ, jamais commencé. Il dit son coût (estimé, ou « coût à venir »,
 * jamais 0) et ses jalons : brassage, fermentation, conditionnement. De bout en bout, sur la couche locale réelle (`portParDefaut()`, `?dev-local`) :
 * la recette du parcours (« Blonde d'automne », sans fermentation chiffrée ni budget) est posée aujourd'hui avec 28 j en cuve, puis relue.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Recipe } from '../../src/types';
import type { FinancialProfile } from '../../src/domain/finance/types';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { construireModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { appliquer, portParDefaut } from '../../src/ui/calendrier/ecritures';
import { brouillonVide, versEnregistrement, type ContexteAjout } from '../../src/domain/calendrierAjout';
import { hasBrewStarted } from '../../src/domain/batchSchedule';
import { lundiDe } from '../../src/domain/calendrier';

/* samedi 21 novembre 2026 (S47) */
const AUJ = '2026-11-21';
const PROFIL = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 900_000, confirmed: true } } as FinancialProfile;
const RECETTE = { id: 'ZZ-R-BLONDE', name: 'ZZ TEST — Blonde d’automne', style: 'Blonde', volumeL: 100, ingredients: [] } as unknown as Recipe;

const modele = () => construireModele({
  aujourdhui: AUJ, transactions: [], payments: [], plans: FinanceService.getPlans(), profile: PROFIL, assets: [], batches: StorageService.getBatches(), stockItems: [],
  items: StorageService.getCreativeItems(), recettes: [], reglages: REGLAGES_VIDES
});

beforeEach(() => { window.history.replaceState(null, '', '/?dev-local'); });

describe('K3-SUITES : un brassin posé est planifié', () => {
  it('posé aujourd’hui avec 28 j en cuve : pas commencé, « coût à venir », jalons brassage, fermentation, conditionnement', async () => {
    StorageService.addRecipe(RECETTE);
    const ctx: ContexteAjout = { aujourdhui: AUJ, recettes: [RECETTE], clients: [], plans: [], choses: [], idBrassin: () => 'ZZ-LOT-K3', maintenant: `${AUJ}T12:00:00.000Z` };
    const b = { ...brouillonVide('brassins', lundiDe(AUJ)), recetteId: RECETTE.id, tempsEnCuve: 28, debutChoisi: true };
    const conv = versEnregistrement(b, ctx);
    if (conv.ok === false) throw new Error(conv.raison);
    const e = conv.enregistrement;
    if (e.cible !== 'batch') throw new Error(e.cible);
    await appliquer([{ op: 'creer', collection: 'batches', document: e.document as unknown as { id: string } & Record<string, unknown>, recetteId: e.recetteId }], portParDefaut());

    const pose = StorageService.getBatches().find(x => x.id === 'ZZ-LOT-K3');
    expect(pose?.status).toBe('planifie');
    expect(hasBrewStarted(pose!)).toBe(false);

    const chose = modele().choses.find(c => c.source.genre === 'batch' && c.source.id === 'ZZ-LOT-K3');
    expect(chose).toBeDefined();
    expect(chose!.detail).toBe('planifié');
    expect(chose!.reste).toBeUndefined();
    /* coût : estimé (montant non nul) ou « coût à venir » en mots, jamais 0 */
    expect(chose!.centimes === undefined ? chose!.coutAVenir : chose!.centimes !== 0).toBe(true);
    expect((chose!.jalons ?? []).map(j => j.id)).toEqual(['brassage', 'fermentation', 'conditionnement']);
    const fermentation = chose!.jalons!.find(j => j.id === 'fermentation')!;
    expect(fermentation.ecart).toBe(1);
    expect(fermentation.glissable).toBe(false);
  });
});
