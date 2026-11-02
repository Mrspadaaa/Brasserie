// @vitest-environment jsdom
/**
 * D366 : son choix B (D291, « dans la première vue, pouvoir choisir entre envoyé 1 ou plusieurs documents ») n'atteignait pas l'écran par les
 * vraies entrées. « Lire un justificatif » ouvrait d'office le sélecteur d'un seul fichier, et « Saisir une dépense » gardait « Joindre un
 * justificatif ». Sa plainte (02.11, soir) : « Pourquoi ça a pas été porté ??? ».
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { preparer, monter, bouton, screen } from './cadre';

vi.mock('../../../../src/services/storage', async () => (await import('./cadre')).storageMock());
vi.mock('../../../../src/services/financeService', async () => (await import('./cadre')).financeMock());
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./cadre')).firestoreMock());
vi.mock('../../../../src/services/geminiScanner', async () => (await import('./cadre')).scannerMock());
vi.mock('../../../../src/services/qrLecture', async () => (await import('./cadre')).qrMock());
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => (await import('./cadre')).purchaseMock(await importOriginal()));
vi.mock('../../../../src/services/pagesJustificatif', async importOriginal => (await import('./cadre')).pagesMock(await importOriginal()));
vi.mock('../../../../src/ui/useViewport', async importOriginal => (await import('./cadre')).viewportMock(await importOriginal()));
beforeEach(preparer);
afterEach(() => vi.restoreAllMocks());

describe('D366 — la première vue offre « Un document » | « Plusieurs » par les vraies entrées', () => {
  it('« Lire un justificatif » : aucun sélecteur ouvert d’office, la première vue montre le bouton coupé en deux', async () => {
    const clic = vi.spyOn(HTMLInputElement.prototype, 'click');
    await monter({ startWithScan: true });
    expect(clic).not.toHaveBeenCalled();
    expect(bouton('Un document')).toBeTruthy();
    expect(bouton('Plusieurs')).toBeTruthy();
  });
  it('« Saisir une dépense » : joindre un justificatif offre aussi « Plusieurs »', async () => {
    await monter({ startWithScan: false });
    expect(screen.getByRole('button', { name: /Joindre un justificatif/ })).toBeTruthy();
    expect(bouton('Plusieurs')).toBeTruthy();
  });
});
