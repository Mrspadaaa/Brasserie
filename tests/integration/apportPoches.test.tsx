import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u-test' }), ensureDriveAccessToken: async () => 'jeton-simule' } }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<any>()), saveFinanceDocumentConfirmed: (...args: any[]) => state.drive(...args) }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}><h2>{title}</h2>{children}{footer}</div> : null }));
const state = vi.hoisted(() => ({ drive: vi.fn() }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { MovementSheet } from '../../src/ui/finance/MovementSheet';
import { createMemoryProofStore, listProofJobs, setProofFileStore, runProofQueue } from '../../src/services/proofQueue';
import { summarizeLedger, todayISO } from '../../src/domain/finance/ledger';
import { FinanceService } from '../../src/services/financeService';
import type { Transaction } from '../../src/types';

/* Apport ou prélèvement privé = m5ap-a : le sens, le montant, le compte et le justificatif de l'opération s'écrivent par les services existants
   (Dexie puis Firestore : ici le registre est simulé, jamais une donnée réelle ; Drive simulé aussi). */
let grandLivre: Transaction[], paiements: any[], profils: any[], enLigne: boolean;
const aujourdhui = todayISO();
const depenseOuVente = (id: string, kind: 'income' | 'expense', cents: number): Transaction => ({ id, date: aujourdhui, description: id, category: kind === 'income' ? 'recettes' : 'brassage', subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind, amountCents: cents, lines: [], paymentStatus: 'unpaid', recordedAt: '2026-01-01T00:00:00.000Z' } } as Transaction);
const pdf = (nom = 'releve.pdf') => new File(['%PDF-1.4\n'], nom, { type: 'application/pdf' });
const png = (nom = 'quittance.png') => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], nom, { type: 'image/png' });
const joindre = (etiquette: string, fichier: File) => fireEvent.change(screen.getByLabelText(etiquette), { target: { files: [fichier] } });
const saisir = (montant: string, motif: string) => {
  const champ = screen.getByLabelText('Montant (CHF)');
  fireEvent.change(champ, { target: { value: montant } }); fireEvent.blur(champ);
  fireEvent.change(screen.getByLabelText('Motif'), { target: { value: motif } });
};
const enregistre = () => grandLivre.filter(t => t.id.startsWith('MOUV-'));
const ouvrir = (onSaved = vi.fn()) => { render(<MovementSheet onClose={() => {}} onSaved={onSaved} />); return onSaved; };

beforeEach(() => {
  grandLivre = []; paiements = []; enLigne = true;
  profils = [{ id: 'current', openingCash: { date: '2026-01-01', amountCents: 50000, confirmed: true } }];
  setProofFileStore(createMemoryProofStore());
  state.drive.mockReset().mockResolvedValue(undefined);
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => enLigne);
  vi.spyOn(StorageService, 'isReady').mockReturnValue(true);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => grandLivre);
  vi.spyOn(StorageService, 'addTransaction').mockImplementation((tx: any) => { grandLivre = [...grandLivre, tx]; });
  vi.spyOn(StorageService, 'updateTransaction').mockImplementation((tx: any) => { grandLivre = grandLivre.map(t => t.id === tx.id ? tx : t); });
  vi.spyOn(FirestoreRepo, 'put').mockImplementation(((nom: string, _id: string, valeur: any) => { if (nom === 'financialPayments') paiements.push(valeur); }) as any);
  vi.spyOn(FirestoreRepo, 'all').mockImplementation(((nom: string) => nom === 'financialPayments' ? paiements : nom === 'financialProfiles' ? profils : []) as any);
  vi.spyOn(FirestoreRepo, 'documentWriteState').mockReturnValue({ operationId: 'op', status: 'confirmed' } as any);
  vi.spyOn(FirestoreRepo, 'waitForDocument').mockImplementation((async (nom: string, id: string, _t: number, identite?: (v: any) => boolean) => {
    const valeur: any = nom === 'transactions' ? grandLivre.find(t => t.id === id) : paiements.find(p => p.id === id);
    if (!valeur || (identite && !identite(valeur))) throw new Error('Identité inattendue');
    return valeur;
  }) as any);
});
afterEach(async () => { await new Promise(r => setTimeout(r, 60)); cleanup(); vi.restoreAllMocks(); setProofFileStore(undefined); });

describe('Apport = m5ap-a : les deux poches, avec justificatif', () => {
  it('montre la maquette : Ta poche → La brasserie, le montant sur la flèche, le sens inverse, l’effet, Quand, compte, Motif, justificatif en pointillé', () => {
    ouvrir();
    expect(screen.getByRole('heading', { name: 'De ta poche à la brasserie' })).toBeVisible();
    expect(screen.getByText('Ta poche')).toBeVisible(); expect(screen.getByText('La brasserie')).toBeVisible();
    expect(screen.getByRole('button', { name: /Dans l’autre sens : je reprends/ })).toBeVisible();
    const montant = screen.getByLabelText('Montant (CHF)') as HTMLInputElement;
    expect(montant.getAttribute('type')).not.toBe('number'); expect(montant.getAttribute('inputmode')).toBe('decimal');
    expect(screen.getByRole('radio', { name: /^aujourd’hui · / })).toBeChecked();
    for (const compte of ['Banque', 'Espèces', 'TWINT', 'Autre']) expect(screen.getByRole('radio', { name: compte })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Banque' })).toBeChecked();
    expect(screen.getByText('Justificatif · relevé ou quittance')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Photo' })).toBeVisible(); expect(screen.getByRole('button', { name: 'Fichier ou PDF' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enregistrer l’apport' })).toBeVisible();
    expect(screen.getByText(/inchangé : un apport n’est pas une vente/)).toBeVisible();
  });

  it('l’effet se lit du registre : la caisse change de +120,50, ventes − dépenses reste à +23,20', () => {
    grandLivre = [depenseOuVente('VENTE-1', 'income', 100000), depenseOuVente('ACHAT-1', 'expense', 97680)];
    ouvrir(); saisir('120,50', 'Apport pour le malt');
    const effet = screen.getByLabelText('Effet de ce mouvement');
    expect(within(effet).getByText('+120,50')).toBeVisible();
    expect(within(effet).getByText('+23,20')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Dans l’autre sens/ }));
    expect(within(screen.getByLabelText('Effet de ce mouvement')).getByText('−120,50')).toBeVisible();
    expect(within(screen.getByLabelText('Effet de ce mouvement')).getByText('+23,20')).toBeVisible();
  });

  it('sans solde de départ confirmé, la caisse reste inconnue (jamais 0) ; sans montant, l’effet n’affiche rien d’inventé', () => {
    profils = [];
    ouvrir();
    const effet = screen.getByLabelText('Effet de ce mouvement');
    expect(within(effet).getByText('—')).toBeVisible();
    expect(effet).toHaveTextContent('caisse actuelle inconnue');
    saisir('50', 'Apport');
    expect(within(screen.getByLabelText('Effet de ce mouvement')).getByText('+50,00')).toBeVisible();
    expect(screen.getByLabelText('Effet de ce mouvement')).toHaveTextContent('caisse actuelle inconnue');
  });

  it('un apport avec justificatif : bon sens, bon montant, bon compte, son justificatif (file puis lien) ; le résultat du mois ne bouge pas', async () => {
    grandLivre = [depenseOuVente('VENTE-1', 'income', 100000)];
    const avant = summarizeLedger(grandLivre, [], FinanceService.getProfile());
    const onSaved = ouvrir(); saisir('120,50', 'Apport pour le malt de décembre');
    fireEvent.click(screen.getByRole('radio', { name: 'TWINT' }));
    joindre('Justificatif : fichier ou PDF', pdf());
    await screen.findByText(/✓ joint/);
    expect(screen.getByText('releve.pdf')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Photo' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’apport' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const [apport] = enregistre();
    expect(apport.finance?.kind).toBe('contribution'); expect(apport.finance?.amountCents).toBe(12050); expect(apport.amountTTC).toBe(120.5);
    expect(apport.description).toBe('Apport pour le malt de décembre'); expect(apport.date).toBe(aujourdhui);
    expect(paiements).toHaveLength(1);
    expect(paiements[0]).toMatchObject({ transactionId: apport.id, direction: 'in', amountCents: 12050, method: 'twint', date: aujourdhui });
    // Le justificatif est la pièce de l'opération : même identifiant, même écriture ; envoyé au Drive par la file, puis lié.
    await waitFor(() => expect(enregistre()[0].finance?.proofDocumentId).toBe(`proof-${apport.id}`), { timeout: 4000 });
    const lie = enregistre()[0];
    expect(lie.finance?.proofUpload).toBeUndefined(); expect(lie.finance?.proofOriginalFileName).toBe('releve.pdf'); expect(lie.proofType).toBe('application/pdf');
    expect(state.drive).toHaveBeenCalledOnce();
    const [envoye, annee] = state.drive.mock.calls[0];
    expect(envoye.id).toBe(`proof-${apport.id}`); expect(envoye.fileName).toBe(`${aujourdhui} Apport privé.pdf`); expect(annee).toBe(Number(aujourdhui.slice(0, 4)));
    expect(await listProofJobs()).toHaveLength(0);
    const apres = summarizeLedger(grandLivre, paiements, FinanceService.getProfile());
    expect(apres.contributionCents - avant.contributionCents).toBe(12050); expect(apres.incomeCents).toBe(avant.incomeCents); expect(apres.expenseCents).toBe(avant.expenseCents);
    expect(apres.cashCents).toBe(50000 + 12050);
  });

  it('un prélèvement avec justificatif : l’autre sens, la flèche inversée, le bon compte, la photo', async () => {
    const onSaved = ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Dans l’autre sens : je reprends/ }));
    expect(screen.getByRole('heading', { name: 'De la brasserie à ta poche' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Dans l’autre sens : j’apporte/ })).toBeVisible();
    expect(screen.getByText(/inchangé : un prélèvement n’est pas une dépense/)).toBeVisible();
    saisir('40', 'Prélèvement personnel');
    fireEvent.click(screen.getByRole('radio', { name: 'Espèces' }));
    joindre('Justificatif : photo', png());
    await screen.findByText(/✓ joint/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le prélèvement' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const [prelevement] = enregistre();
    expect(prelevement.finance?.kind).toBe('withdrawal'); expect(prelevement.finance?.amountCents).toBe(4000); expect(prelevement.subcategory).toBe('Prélèvement privé');
    expect(paiements[0]).toMatchObject({ transactionId: prelevement.id, direction: 'out', amountCents: 4000, method: 'cash' });
    await waitFor(() => expect(enregistre()[0].finance?.proofDocumentId).toBe(`proof-${prelevement.id}`), { timeout: 4000 });
    expect(state.drive.mock.calls[0][0].fileName).toBe(`${aujourdhui} Prélèvement privé.png`);
    expect(summarizeLedger(grandLivre, paiements, FinanceService.getProfile()).cashCents).toBe(50000 - 4000);
  });

  it('le renvoi « pas un achat de brasserie ? » ouvre le prélèvement, montant et motif posés', () => {
    render(<MovementSheet prefill={{ kind: 'withdrawal', amountCents: 1340, note: 'BENU Matran' }} onClose={() => {}} onSaved={() => {}} />);
    expect(screen.getByRole('heading', { name: 'De la brasserie à ta poche' })).toBeVisible();
    expect((screen.getByLabelText('Montant (CHF)') as HTMLInputElement).value).toBe('13,40');
    expect((screen.getByLabelText('Motif') as HTMLInputElement).value).toBe('BENU Matran');
  });

  it('sans justificatif : l’opération s’enregistre, sans lien ni envoi (le pointillé dit « sans pièce »)', async () => {
    const onSaved = ouvrir(); saisir('20', 'Apport de départ');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’apport' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const [apport] = enregistre();
    expect(apport.finance?.proofDocumentId).toBeUndefined(); expect(apport.finance?.proofUpload).toBeUndefined();
    expect(state.drive).not.toHaveBeenCalled(); expect(await listProofJobs()).toHaveLength(0);
  });

  it('un fichier refusé (format) se dit en clair et ne s’attache pas ; on peut retirer ou changer la pièce', async () => {
    ouvrir();
    joindre('Justificatif : fichier ou PDF', new File(['abc'], 'notes.txt', { type: 'text/plain' }));
    expect(await screen.findByText('Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.')).toBeVisible();
    expect(screen.queryByText(/✓ joint/)).toBeNull();
    joindre('Justificatif : fichier ou PDF', pdf('a.pdf'));
    await screen.findByText(/✓ joint/);
    expect(screen.queryByText('Choisis un JPG, PNG, WebP ou PDF de 4 Mo maximum.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));
    expect(screen.getByRole('button', { name: 'Photo' })).toBeVisible();
  });

  it('sans file locale, Drive confirme le fichier AVANT l’écriture ; si Drive refuse, rien n’est écrit', async () => {
    setProofFileStore(null);
    state.drive.mockRejectedValueOnce(Object.assign(new Error('Hors connexion : l’original n’a pas pu être envoyé sur Drive, donc rien n’est enregistré. Réessaie une fois en ligne.'), { code: 'unavailable' }));
    const onSaved = ouvrir(); saisir('30', 'Apport hors ligne');
    joindre('Justificatif : fichier ou PDF', pdf());
    await screen.findByText(/✓ joint/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’apport' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Hors connexion');
    expect(enregistre()).toHaveLength(0); expect(paiements).toHaveLength(0); expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’apport' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    const [apport] = enregistre();
    expect(apport.finance?.proofDocumentId).toBe(`proof-${apport.id}`); expect(apport.finance?.proofUpload).toBeUndefined();
    expect(state.drive).toHaveBeenCalledTimes(2);
  });

  it('l’avoir (remboursement) garde son formulaire d’avant', () => {
    const facture = { ...depenseOuVente('FACT-1', 'expense', 10000), description: 'Commande malt' };
    grandLivre = [facture];
    render(<MovementSheet original={facture} onClose={() => {}} onSaved={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Avoir ou remboursement' })).toBeVisible();
    expect(screen.getByLabelText('Comment appliquer cet avoir ?')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enregistrer ce mouvement' })).toBeVisible();
    expect(screen.queryByText('Ta poche')).toBeNull(); expect(screen.queryByText('Justificatif · relevé ou quittance')).toBeNull();
  });
});
void runProofQueue;
