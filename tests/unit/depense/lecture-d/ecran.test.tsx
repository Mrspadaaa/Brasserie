// @vitest-environment jsdom
/**
 * Voie e-ecran (lenteur D, D308) : l'écran « Nouvelle dépense » qui arrive dès les deux lectures rapides (le provisoire), puis fusionne la 3.8 (« sa saisie l'emporte »).
 * Témoins 5 à 14 de PLAN § 5 E, plus ses choix : la ligne ajoutée (1 B, D314), la ligne pas retrouvée (2 D, D313) et « Tout valider » (B, D316), le total corrigé et la 3.8 qui n'arrive jamais (défauts A, D315).
 * Lectures FICTIVES (Brauhaus Ouest, `lecturesLenteur` de apercuDev.ts), le flux est simulé : `scanDocument` rend le morceau à `onProvisoire`, puis le final quand le test le décide. Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], saved: vi.fn(), scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { apercuDepense, lecturesLenteur, type VarianteLenteur } from '../../../../src/ui/depense/apercuDev';

const sortie = (result: any, extra: Record<string, unknown> = {}) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result, ...extra });
const porte = () => { let ouvre!: () => void; const promesse = new Promise<void>(r => { ouvre = r; }); return { promesse, ouvre }; };

/**
 * Joue une lecture : le morceau provisoire part tout de suite, le final quand `arrive()` est appelé. `patch` retouche les deux lectures (test sur mesure) ; `final` remplace la valeur rendue (ok:false…) ; `sans` : aucun morceau.
 * Les unités du sucre sont posées pour que l'enregistrement ne soit pas bloqué par une unité à préciser (la maquette les laisse « ? » : ce test n'y regarde pas).
 */
async function lire(variante: VarianteLenteur, o: { patch?: (r: any, final: boolean) => void; final?: (final: any) => any; sans?: boolean; rejet?: boolean; unites?: boolean } = {}) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final, jeton } = lecturesLenteur(variante), stocks = apercuDepense(`lenteur-${variante}`).stocks;
  (stocks as any).rawMaterials.forEach((a: any) => { a.currentStock = 1; });
  if (o.unites !== false) for (const r of [provisoire, final]) for (const i of r?.items ?? []) if (i.name === 'Sucre candi') i.unit = 'Kg';
  for (const r of [provisoire, final]) if (r) o.patch?.(r, r === final);
  const g = porte();
  state.scanned.mockImplementation(async (_f: any, _t: any, opts: any) => {
    if (provisoire && !o.sans) opts?.onProvisoire?.(sortie(provisoire, { jeton }));
    await g.promesse;
    if (o.rejet) throw new Error('réseau coupé');
    return o.final ? o.final(sortie(final)) : sortie(final);
  });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  // le justificatif : le banc d'écran remplace le stock ; ici le stock simulé est celui de storage (vide) : les lignes sont « nouvel article » d'office.
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  const arrive = async () => { await act(async () => { g.ouvre(); await g.promesse; await new Promise(r => setTimeout(r, 0)); }); };
  return { view, arrive };
}
const principal = (view: ReturnType<typeof render>) => view.container.querySelector<HTMLButtonElement>('button[data-primary]')!;
const ligne = (view: ReturnType<typeof render>, id: string) => view.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`);
const lignes = (view: ReturnType<typeof render>) => view.container.querySelectorAll('[data-purchase-line]');

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('E5, E6 : après le provisoire, l’écran arrive et « Confirmer » attend', () => {
  it('les lignes sont là, le fil et « Lectures ●●◌ » aussi ; « Confirmer » est désactivé avec la roue (aria « Vérification en cours ») ; « Fermer » reste actif', async () => {
    const { view } = await lire('lue');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(lignes(view)).toHaveLength(7);
    expect(view.container.querySelector('[data-dp="fil"]')).not.toBeNull();
    expect(view.container.querySelector('[data-dp="lectures-points"]')?.getAttribute('aria-label')).toBe('2 lectures sur 3');
    const bouton = principal(view);
    expect(bouton).toBeDisabled(); expect(bouton.getAttribute('aria-label')).toBe('Vérification en cours'); expect(bouton.querySelector('svg.animate-spin')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeEnabled(); // la feuille se ferme pendant la vérification
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull(); // rien n'est corrigé tant que la 3.8 n'est pas là
    fireEvent.click(bouton); expect(state.saved).not.toHaveBeenCalled(); // `save` refuse : un clic sur le bouton gris ne part pas
  });
  it('les champs restent modifiables pendant l’attente : sa saisie est prise', async () => {
    const { view } = await lire('lue');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.change(screen.getByLabelText('Quantité ligne 1'), { target: { value: '12' } });
    expect((screen.getByLabelText('Quantité ligne 1') as HTMLInputElement).value).toMatch(/12/);
    expect(principal(view)).toBeDisabled();
  });
});

describe('E7 : le final arrive : bouton noir, puce « N corrigées », valeurs bleues, ancienne valeur barrée', () => {
  it('le fil part, « Lectures 3/3 », la puce compte les rangées (3), l’ancienne valeur est « 10 Kg × 1,45 », et la fusion garde les rangées en place (m3)', async () => {
    const { view, arrive } = await lire('lue');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    const avant = ligne(view, 'line-1'); expect(avant).not.toBeNull();
    await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    expect(principal(view)).toBeEnabled();
    expect(principal(view).getAttribute('aria-label')).toBe('Confirmer et enregistrer');
    expect(view.container.querySelector('[data-dp="lectures-points"]')).toBeNull();
    const puce = view.container.querySelector<HTMLElement>('[data-va="corrigees"]')!;
    expect(puce.textContent).toMatch(/3\s*corrigées/); // Pilsner (deux cellules : 1), Sabro, Citra
    const pilsner = ligne(view, 'line-1')!;
    expect(pilsner.querySelector('[data-dp-avant]')?.textContent).toBe('10 Kg × 1,45');
    expect(pilsner.querySelector('[data-dp-qte]')?.getAttribute('data-dp-corrige')).toBe('1'); expect(pilsner.querySelector('[data-dp-prix]')?.getAttribute('data-dp-corrige')).toBe('1');
    expect(ligne(view, 'line-2')!.querySelector('[data-dp-corrige]')).toBeNull(); // Munich n'a rien : aucun bleu
    expect(ligne(view, 'line-4')!.querySelector('[data-dp-avant]')?.textContent).toMatch(/^30 \S+$/); // Sabro : l'unité qui change
    expect(ligne(view, 'line-1')).toBe(avant); // m3 : la fusion n'appelle jamais `applyOutcome` : la rangée n'est pas remontée (readCount)
  });
  it('E8 : une ligne qu’il a supprimée pendant l’attente ne revient pas', async () => {
    const { view, arrive } = await lire('lue');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.click(screen.getByLabelText('Retirer la ligne 3'));
    await waitFor(() => expect(ligne(view, 'line-3')).toBeNull());
    await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    expect(ligne(view, 'line-3')).toBeNull(); expect(lignes(view)).toHaveLength(6);
  });
  it('une cellule qu’il a tapée pendant l’attente reste la sienne, sans bleu ; l’autre cellule de la rangée est corrigée', async () => {
    const { view, arrive } = await lire('lue');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    fireEvent.change(screen.getByLabelText('Quantité ligne 1'), { target: { value: '12' } });
    await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    const r = ligne(view, 'line-1')!;
    expect((r.querySelector('[aria-label="Quantité ligne 1"]') as HTMLInputElement).value).toMatch(/12/);
    expect(r.querySelector('[data-dp-qte]')?.getAttribute('data-dp-corrige')).toBeNull(); expect(r.querySelector('[data-dp-prix]')?.getAttribute('data-dp-corrige')).toBe('1');
  });
});

describe('E9 et son choix 1 B : une ligne que la 3.8 ajoute', () => {
  it('une rangée de plus (id `line-${n+1}`), toute sur le bleu avec ↻, comptée dans la puce (4 corrigées)', async () => {
    const { view, arrive } = await lire('ajoutee');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(lignes(view)).toHaveLength(7);
    await arrive();
    await waitFor(() => expect(ligne(view, 'line-8')).not.toBeNull());
    const neuve = ligne(view, 'line-8')!;
    expect(neuve.getAttribute('data-dp-neuve')).toBe('1'); expect(neuve.querySelector('[data-dp-nom] [aria-label="ligne ajoutée par la 3e lecture"]')).not.toBeNull();
    expect(neuve.querySelector('[data-dp-avant]')).toBeNull(); // aucune ancienne valeur : elle est neuve
    expect(lignes(view)).toHaveLength(8);
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/4\s*corrigées/);
  });
});

describe('son choix 2 D : une ligne que la 3.8 ne lit plus', () => {
  it('barrée, hors des sommes, au bandeau ; « Confirmer » sans trancher : elle part (elle n’est pas enregistrée)', async () => {
    const { view, arrive } = await lire('perdue');
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(lignes(view)).toHaveLength(8);
    await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    const barree = view.container.querySelector<HTMLElement>('[data-dp-perdue="line-4"]')!;
    expect(barree).not.toBeNull(); expect(barree.textContent).toMatch(/Avoine maltée/); expect(barree.querySelector('.line-through')).not.toBeNull();
    expect(lignes(view)).toHaveLength(7); // hors du brouillon : ni sommes, ni compte
    const bandeau = view.container.querySelector<HTMLElement>('[data-dp="perdues"]')!;
    expect(bandeau.textContent).toMatch(/Avoine maltée/); expect(bandeau.textContent).toMatch(/pas retrouvée/); expect(bandeau.textContent).toMatch(/Tout valider/); // D329 : la file compte aussi les 3 corrections (4 éléments)
    expect(within(bandeau).getByRole('button', { name: /Garder/ })).toBeEnabled(); expect(within(bandeau).getByRole('button', { name: /Retirer/ })).toBeEnabled();
    expect(principal(view)).toBeEnabled();
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/4\s*corrigées/); // 3 + la ligne qui attend
    fireEvent.click(principal(view));
    await waitFor(() => expect(state.saved).toHaveBeenCalled());
    expect(state.saved.mock.calls[0][0].lines.map((l: any) => l.description)).not.toContain('Avoine maltée');
    expect(state.saved.mock.calls[0][0].lines).toHaveLength(7);
  });
  it('« Garder » la remet en rangée ordinaire à sa place, dans les sommes ; « Retirer » la fait partir', async () => {
    const garde = await lire('perdue'); await screen.findByRole('region', { name: 'Vérification du justificatif' }); await garde.arrive();
    await waitFor(() => expect(garde.view.container.querySelector('[data-dp="perdues"]')).not.toBeNull());
    fireEvent.click(within(garde.view.container.querySelector<HTMLElement>('[data-dp="perdues"]')!).getByRole('button', { name: /Garder/ }));
    await waitFor(() => expect(ligne(garde.view, 'line-4')).not.toBeNull());
    expect(garde.view.container.querySelector('[data-dp-perdue]')).toBeNull(); expect(garde.view.container.querySelector('[data-dp="perdues"]')!.textContent).not.toMatch(/Avoine/); // D329 : les corrections suivent
    expect(lignes(garde.view)).toHaveLength(8);
    expect(ligne(garde.view, 'line-4')!.textContent).toMatch(/Avoine maltée/);
    expect(garde.view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/3\s*corrigées/);
    cleanup(); state.scanned.mockReset();
    const retire = await lire('perdue'); await screen.findByRole('region', { name: 'Vérification du justificatif' }); await retire.arrive();
    await waitFor(() => expect(retire.view.container.querySelector('[data-dp="perdues"]')).not.toBeNull());
    fireEvent.click(within(retire.view.container.querySelector<HTMLElement>('[data-dp="perdues"]')!).getByRole('button', { name: /Retirer/ }));
    await waitFor(() => expect(retire.view.container.querySelector('[data-dp="perdues"]')!.textContent).not.toMatch(/Avoine/));
    expect(retire.view.container.querySelector('[data-dp-perdue]')).toBeNull(); expect(ligne(retire.view, 'line-4')).toBeNull(); expect(lignes(retire.view)).toHaveLength(7);
  });
});

describe('« Tout valider » (sa maquette B, D316) à deux lignes', () => {
  it('le bandeau défile (« 1/2 » puis « 2/2 »), « Tout valider » à côté ; Garder puis Retirer un à un', async () => {
    const { view, arrive } = await lire('perdues-2');
    await screen.findByRole('region', { name: 'Vérification du justificatif' }); await arrive();
    const bandeau = () => view.container.querySelector<HTMLElement>('[data-dp="perdues"]')!;
    await waitFor(() => expect(bandeau()).not.toBeNull());
    expect(bandeau().textContent).toMatch(/Avoine maltée/); expect(bandeau().querySelector('[data-dp-perdue-rang]')?.textContent).toBe('1/5'); expect(within(bandeau()).getByRole('button', { name: /Tout valider/ })).toBeEnabled();
    expect(view.container.querySelectorAll('[data-dp-perdue]')).toHaveLength(2);
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/5\s*corrigées/); // 3 + 2
    fireEvent.click(within(bandeau()).getByRole('button', { name: /Garder/ }));
    await waitFor(() => expect(bandeau().textContent).toMatch(/Amarillo/));
    expect(bandeau().querySelector('[data-dp-perdue-rang]')?.textContent).toBe('2/5'); expect(within(bandeau()).getByRole('button', { name: /Tout valider/ })).toBeEnabled();
    expect(ligne(view, 'line-4')).not.toBeNull(); expect(lignes(view)).toHaveLength(8);
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/4\s*corrigées/);
    fireEvent.click(within(bandeau()).getByRole('button', { name: /Retirer/ }));
    await waitFor(() => expect(view.container.querySelector('[data-dp="perdues"]')!.textContent).not.toMatch(/Amarillo/));
    expect(view.container.querySelector('[data-dp-perdue]')).toBeNull(); expect(lignes(view)).toHaveLength(8);
  });
  it('« Tout valider » : toutes les lignes pas retrouvées partent d’un toucher', async () => {
    const { view, arrive } = await lire('perdues-2');
    await screen.findByRole('region', { name: 'Vérification du justificatif' }); await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="perdues"]')).not.toBeNull());
    fireEvent.click(within(view.container.querySelector<HTMLElement>('[data-dp="perdues"]')!).getByRole('button', { name: /Tout valider/ }));
    await waitFor(() => expect(view.container.querySelector('[data-dp="perdues"]')).toBeNull());
    expect(view.container.querySelector('[data-dp-perdue]')).toBeNull(); expect(lignes(view)).toHaveLength(7);
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull(); // D354 : tout est accepté, la puce ne compte plus rien
  });
});

describe('le total corrigé (défaut A, D315)', () => {
  it('le champ d’en-tête que la 3.8 corrige est sur le bleu, l’ancien total barré à côté, et compte une fois dans la puce', async () => {
    const { view, arrive } = await lire('total');
    await screen.findByRole('region', { name: 'Vérification du justificatif' }); await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="total-avant"]')).not.toBeNull());
    expect(view.container.querySelector('[data-dp="total-avant"]')!.textContent).toBe('46,40');
    expect(view.container.querySelector('[data-dp="total-niveau"]')!.getAttribute('data-dp-corrige')).toBe('1');
    expect((screen.getByLabelText('Total TTC en CHF') as HTMLInputElement).value).toMatch(/48[,.]00/);
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/5\s*corrigées/); // Pilsner, Munich, Sabro, Citra + le total
    expect(ligne(view, 'line-2')!.querySelector('[data-dp-avant]')?.textContent).toBe('4 Kg × 1,80 · 7,20');
  });
});

describe('E12, E13 : sans 3.8 et 3.8 en échec', () => {
  it('E12 : le final arrive avec les valeurs du provisoire et le point « lecture coupée » : « 2 lectures » en attention, aucune puce, bouton noir', async () => {
    const { view, arrive } = await lire('echec');
    await screen.findByRole('region', { name: 'Vérification du justificatif' }); await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull();
    expect(view.container.querySelector('[data-dp="preuve"]')!.textContent).toMatch(/2[/]2/);
    expect(view.container.querySelector('[data-dp-chip]')?.getAttribute('aria-label') ?? '').not.toBe('');
    expect(view.container.textContent).toMatch(/Lecture coupée/);
    expect(principal(view)).toBeEnabled();
  });
  it('E13 : une pièce sans 3.8 (le final seul, aucun morceau) : aucun fil, bouton noir, « Lectures 2/2 » comme aujourd’hui', async () => {
    const { view, arrive } = await lire('sans-38', { sans: true });
    await arrive();
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(view.container.querySelector('[data-dp="fil"]')).toBeNull(); expect(view.container.querySelector('[data-dp="lectures-points"]')).toBeNull();
    expect(principal(view)).toBeEnabled(); expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull();
    expect(view.container.querySelector('[data-dp="preuve"]')!.textContent).toMatch(/Lectures\s*2\/2/);
  });
});

describe('E14 et la 3.8 qui n’arrive jamais (défaut A, D315) : la fin de partie', () => {
  it('le final rend `ok:false` après le morceau : le fil part, le bouton est noir, la forme est celle d’une 3.8 coupée (point « lecture coupée », « 2 lectures »)', async () => {
    const { view, arrive } = await lire('lue', { final: () => ({ ok: false, error: 'Lecture indisponible.', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }) });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(principal(view)).toBeDisabled();
    await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    expect(principal(view)).toBeEnabled();
    expect(view.container.querySelector('[data-dp="preuve"]')!.textContent).toMatch(/2[/]2/); expect(view.container.textContent).toMatch(/Lecture coupée/);
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull(); expect(lignes(view)).toHaveLength(7); // ses lignes et ses saisies restent
  });
  it('une erreur levée après le morceau ne laisse jamais le bouton gris', async () => {
    const { view, arrive } = await lire('lue', { rejet: true });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    await arrive();
    await waitFor(() => expect(principal(view)).toBeEnabled());
    expect(view.container.querySelector('[data-dp="fil"]')).toBeNull(); expect(lignes(view)).toHaveLength(7);
  });
});

describe('E11 (M6) : la traduction du provisoire qui arrive après la fusion est jetée ; un nom changé est retraduit', () => {
  it('le nom de base changé par la 3.8 efface `nameFr` et la seconde traduction ne porte que ce qui n’a pas de français', async () => {
    const traduction = porte();
    state.traduire.mockImplementationOnce(async () => { await traduction.promesse; return new Map([[0, 'Malt Pilsner FR (tard)']]); });
    const { view, arrive } = await lire('lue', { patch: (r, final) => { if (final) r.items[0].name = 'Pilsner Malz'; } });
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(state.traduire).toHaveBeenCalledTimes(1);
    await arrive();
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    await waitFor(() => expect(state.traduire).toHaveBeenCalledTimes(2));
    const envoyees = state.traduire.mock.calls[1][0] as any[];
    expect(envoyees.map(l => l.name)).toContain('Pilsner Malz'); // la ligne dont le nom a changé
    await act(async () => { traduction.ouvre(); await traduction.promesse; await new Promise(r => setTimeout(r, 0)); });
    expect(view.container.textContent).not.toMatch(/\(tard\)/); // la traduction du provisoire, arrivée après la fusion, est jetée par sa garde
  });
});
