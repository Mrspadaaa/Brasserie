/**
 * Montage commun des tests de procédure de f4 (à importer APRÈS les `vi.mock` du fichier de test) : magasin mémoire, horloge, utilisateur,
 * catalogue des houblons de la fixture, recherche simulée (Gemini jamais appelé), interrupteur forcé.
 */
import { vi } from 'vitest';
import * as f4 from '../../../../src/services/enrichissement';
import { createMemoryFichesStore } from '../../../../src/services/enrichissementStore';
import { setEnrichissementIA, type EtatIA } from '../../../../src/services/enrichissementReglages';
import { DONNEES_FIXTURE } from '../../../../src/domain/hopIndex/v4/data';
import * as entry from '../../../../src/services/purchaseEntry';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';
import type { RequeteFiche } from '../../../../src/services/enrichissement';
import type { AiResponse } from '../../../../src/services/aiClient';
import type { IngredientFacts } from '../../../../src/domain/ingredientFacts';

export const SOURCE_AMBRE = 'Fiche technique de la Malterie du Banc';
export const URL_AMBRE = 'https://malterie-du-banc.test/ambre-60';
/** Les réponses brutes rejouées (format d'`aiTask`) ; tout autre produit : `found: false`. */
export function reponseSimulee(req: RequeteFiche): AiResponse<IngredientFacts> {
  if (req.kind === 'malt' && /ambre/i.test(req.name)) return { ok: true, model: 'rejeu-f4', data: { found: true, name: 'Ambre 60', source: SOURCE_AMBRE, sourceUrl: URL_AMBRE, colorEbc: 60, potentialPpg: 33 } as IngredientFacts };
  if (req.kind === 'malt' && /m[üu]nchner/i.test(req.name)) return { ok: true, model: 'rejeu-f4', data: { found: true, source: 'Fiche du Banc — Münchner', colorEbc: 22, potentialPpg: 37 } as IngredientFacts };
  if (req.kind === 'levure' && /banc 7/i.test(req.name)) return { ok: true, model: 'rejeu-f4', data: { found: true, name: 'Levure du Banc 7', source: 'Fiche de la levure du Banc', sourceUrl: 'https://levures-du-banc.test/7', lab: 'Levures du Banc', form: 'sèche', tempMinC: 15, tempMaxC: 22 } as IngredientFacts };
  return { ok: true, model: 'rejeu-f4', data: { found: false } as IngredientFacts };
}

export interface Banc {
  store: ReturnType<typeof createMemoryFichesStore>;
  recherche: ReturnType<typeof vi.fn>;
  horloge: { ms: number };
}
export function monter(options: { ia?: EtatIA; recherche?: (req: RequeteFiche) => Promise<AiResponse<IngredientFacts>>; cataloguesEnEchec?: { n: number } } = {}): Banc {
  const store = createMemoryFichesStore();
  const horloge = { ms: Date.parse('2026-11-01T09:00:00.000Z') };
  const recherche = vi.fn(options.recherche ?? (async (req: RequeteFiche) => reponseSimulee(req)));
  f4.setEnrichissementStore(store);
  f4.setUtilisateurFiche(async () => 'uid-banc');
  f4.setHorlogeFiche(() => horloge.ms);
  f4.setRechercheFiche(recherche as unknown as f4.RechercheFiche);
  f4.setCataloguesFiche(async () => {
    if (options.cataloguesEnEchec && options.cataloguesEnEchec.n > 0) { options.cataloguesEnEchec.n--; throw new Error('import du catalogue en échec (banc)'); }
    const m = await import('../../../../src/services/enrichissementCatalogues');
    return { ...m, cataloguePleinHoublons: async () => DONNEES_FIXTURE.catalogue };
  });
  setEnrichissementIA(options.ia ?? 'emulateur');
  return { store, recherche, horloge };
}
export function demonter(): void {
  f4.setEnrichissementStore(undefined); f4.setUtilisateurFiche(null); f4.setHorlogeFiche(null); f4.setRechercheFiche(null); f4.setCataloguesFiche(null);
  setEnrichissementIA(null);
}

let compteur = 0;
export const ligne = (id: string, description: string, unit: string, quantity: number, more: Partial<PurchaseLineDraft> = {}): PurchaseLineDraft =>
  ({ id, description, kind: 'ingredient', amount: 10, quantity, unit, stockAction: 'new', equipmentAction: 'none', ...more });
export const saisie = (lines: PurchaseLineDraft[]): PurchaseDraft => ({
  submissionId: `f4-banc-${String(++compteur).padStart(5, '0')}`, date: '01.11.2026', vendor: 'Fournisseur du Banc', invoiceNumber: `B-${compteur}`, description: 'Achat du banc',
  duplicateConfirmed: true,
  category: 'brassage', amount: Math.round(lines.reduce((s, l) => s + (l.amount ?? 0) * 100, 0)) / 100, lines, paymentStatus: 'unpaid', paymentMethod: 'bank',
  paymentDate: '', dueDate: '', sourceCurrency: 'CHF',
} as PurchaseDraft);

/** « Confirmer » tel que le pilote le branchera : `savePurchase`, puis `planifierEnrichissement` ; puis la file jusqu'au repos. */
export async function confirmer(draft: PurchaseDraft, options: { tourner?: boolean } = {}): Promise<string> {
  const tx = entry.savePurchase(draft);
  f4.planifierEnrichissement(draft);
  await f4.enrichissementAuRepos();
  if (options.tourner !== false) { await f4.runEnrichissement('banc'); await f4.enrichissementAuRepos(); }
  return tx;
}
export const travail = async (banc: Banc, ref: string) => banc.store.travaux.get(ref);
