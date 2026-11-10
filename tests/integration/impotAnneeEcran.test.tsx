import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import type { Batch } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

const annee = new Date().getFullYear();
const lot = (id: string, nom: string, mois: string, og: string | undefined, litres: number): Batch =>
  ({ id, name: nom, style: 'Ale', volumeL: 200, volumePackagedL: litres, brewDate: `${annee}-${mois}-10`, status: 'termine', og, abv: '5' } as Batch);
/** La fixture de la maquette i1a. */
const fixture: Batch[] = [
  lot('B1', 'Blonde de janvier', '01', '1.046', 200), lot('B2', 'IPA de mars', '03', '1.062', 180), lot('B3', 'Saison de mai', '05', '1.052', 200),
  lot('B4', 'Blanche de juin', '06', '1.044', 220), lot('B5', 'Lager d’août', '08', '1.038', 200), lot('B6', 'Pale Ale de septembre', '09', undefined, 26.6)
];

const montrer = (batches: Batch[] = fixture) => {
  render(<ClientsTab clients={[]} batches={batches} tarifs={[]} config={defaultConfig} onOpenQuickAction={() => {}} />);
  return within(screen.getByRole('region', { name: 'Impôt bière de l’année' }));
};

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('clients_subtab', 'ofdf'); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Clients › Impôt bière : l’écran de la maquette i1a', () => {
  it('1. la réponse : litres, brassins, taux plein, et le total en fourchette tant qu’une densité manque', () => {
    const tax = montrer();
    expect(tax.getByRole('heading', { name: 'Cette année, je dois' })).toBeVisible();
    expect(tax.getByTestId('iaa-total')).toHaveTextContent('256,00 – 260,49 CHF');
    expect(tax.getByTestId('iaa-reponse')).toHaveTextContent('1 026,6 L · 6 brassins');
    expect(tax.getByText('taux plein')).toBeVisible();
  });

  it('2. la barre est découpée aux proportions des litres : légère, normale, forte, densité à noter', () => {
    const tax = montrer();
    const segments = within(tax.getByTestId('iaa-barre')).getAllByTestId(/^iaa-seg-/);
    expect(segments.map(s => s.getAttribute('data-testid'))).toEqual(['iaa-seg-legere', 'iaa-seg-normale', 'iaa-seg-forte', 'iaa-seg-inconnue']);
    expect(segments.map(s => s.style.width)).toEqual(['19.5%', '60.4%', '17.5%', '2.6%']);
    const legende = tax.getByTestId('iaa-legende');
    expect(legende).toHaveTextContent('légère 33,76');
    expect(legende).toHaveTextContent('normale 156,98');
    expect(legende).toHaveTextContent('forte 60,77');
    expect(legende).toHaveTextContent('densité à noter 4,49 – 8,98');
  });

  it('3. chaque brassin sur sa bande ; la densité manquante est hachurée, en fourchette, jamais 0', () => {
    const tax = montrer();
    const lignes = tax.getAllByTestId('iaa-ligne');
    expect(lignes).toHaveLength(6);
    expect(lignes.map(l => l.getAttribute('data-bande'))).toEqual(['normale', 'forte', 'normale', 'normale', 'legere', 'inconnue']);
    expect(lignes[0]).toHaveTextContent('Blonde de janvier');
    expect(lignes[0]).toHaveTextContent('11,4 °P · 200 L');
    expect(lignes[0]).toHaveTextContent('50,64');
    expect(lignes[3]).toHaveTextContent('11,0 °P · 220 L');
    expect(lignes[5]).toHaveTextContent('densité à noter · 26,6 L');
    expect(lignes[5]).toHaveTextContent('4,49 – 8,98');
    expect(lignes[5]).not.toHaveTextContent(/\b0,00\b/);
    expect(within(lignes[5]).getByTestId('iaa-pastille')).toHaveAttribute('data-hachure', 'oui');
  });

  it('4. un brassin touché ouvre sa feuille p2b, telle que choisie', async () => {
    const tax = montrer();
    fireEvent.click(tax.getByRole('button', { name: /Pale Ale de septembre/ }));
    expect(await screen.findByText('Combien par bière')).toBeVisible();
    expect(screen.getByTestId('ibr-regle')).toHaveAttribute('data-hachure', 'oui');
    fireEvent.click(screen.getByRole('button', { name: 'Noter la densité' }));
    await waitFor(() => expect(screen.queryByText('Combien par bière')).toBeNull());
    expect(await screen.findByLabelText('Rubriques du brassin', {}, { timeout: 8000 })).toBeVisible();
  });

  it('5. quand et à qui : déclarer sous 20 jours, payer sous 30, OFDF par Taxas, réduction à confirmer', () => {
    const tax = montrer();
    const quand = tax.getByTestId('iaa-quand');
    expect(quand).toHaveTextContent('si régime annuel');
    expect(quand).toHaveTextContent(new RegExp(`déclarer 20 janv\\. ${annee + 1}`));
    expect(quand).toHaveTextContent(new RegExp(`payer 30 janv\\. ${annee + 1}`));
    expect(tax.getByTestId('iaa-aqui')).toHaveTextContent('OFDF, par Taxas');
    expect(tax.getByRole('button', { name: /réduction petit brasseur : à confirmer/ })).toBeVisible();
  });

  it('6. « à confirmer › » demande Réglages par l’événement de la feuille ; sans écouteur, l’écran dit où aller', () => {
    const tax = montrer();
    const ecoute = vi.fn((event: Event) => event.preventDefault());
    window.addEventListener('affinee:ouvrir-reglages', ecoute);
    fireEvent.click(tax.getByRole('button', { name: /réduction petit brasseur/ }));
    window.removeEventListener('affinee:ouvrir-reglages', ecoute);
    expect(ecoute).toHaveBeenCalledTimes(1);
    expect((ecoute.mock.calls[0][0] as CustomEvent).detail).toEqual({ section: 'reserve-impot-biere' });
    fireEvent.click(tax.getByRole('button', { name: /réduction petit brasseur/ }));
    expect(tax.getByRole('status')).toHaveTextContent('Réserve impôt sur la bière');
  });

  it('7. Comprendre le barème se déplie : barème, réduction, régime, TVA ; fermé il est invisible', () => {
    const tax = montrer();
    expect(tax.getByText(/Barème par hectolitre/)).not.toBeVisible();
    fireEvent.click(tax.getByText('Comprendre le barème'));
    expect(tax.getByText('Barème par hectolitre : 16,88 CHF jusqu’à 10 °P ; 25,32 CHF de 10,1 à 14 °P ; 33,76 CHF dès 14,1 °P.')).toBeVisible();
    expect(tax.getByText(/TVA de la bière alcoolisée/)).toBeVisible();
  });

  it('8. année sans brassin : « Aucun brassin », total « — » (jamais 0,00), ni barre ni liste', () => {
    const tax = montrer();
    fireEvent.change(tax.getByRole('combobox', { name: 'Année de réserve OFDF' }), { target: { value: String(annee - 1) } });
    expect(tax.getByText(`Aucun brassin en ${annee - 1}`)).toBeVisible();
    expect(tax.getByRole('heading', { name: `En ${annee - 1}, je devais` })).toBeVisible();
    expect(tax.getByTestId('iaa-total')).toHaveTextContent('—');
    expect(tax.queryByTestId('iaa-barre')).toBeNull();
    expect(tax.queryAllByTestId('iaa-ligne')).toHaveLength(0);
    expect(tax.getByTestId('iaa-total')).not.toHaveTextContent('0,00');
  });

  it('9. Copier pour Taxas : le texte porte l’année, le total et la réserve ; le retour est dit', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: ecrire }, configurable: true });
    const tax = montrer();
    fireEvent.click(tax.getByRole('button', { name: 'Copier pour Taxas' }));
    await waitFor(() => expect(tax.getByRole('button', { name: 'Estimation copiée' })).toBeVisible());
    const texte = ecrire.mock.calls[0][0] as string;
    expect(texte).toContain(`IMPÔT SUR LA BIÈRE — ${annee}`);
    expect(texte).toContain('256,00 – 260,49 CHF');
    expect(texte).toContain('Taux plein');
  });

  it('10. copie refusée : l’écran le dit', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('non')) }, configurable: true });
    const tax = montrer();
    fireEvent.click(tax.getByRole('button', { name: 'Copier pour Taxas' }));
    await waitFor(() => expect(tax.getByRole('status')).toHaveTextContent('Copie refusée'));
  });

  it('11. les liens Taxas et Directives OFDF sont au pied', () => {
    const tax = montrer();
    expect(tax.getByRole('link', { name: 'Ouvrir Taxas' })).toHaveAttribute('href', 'https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation');
    expect(tax.getByRole('link', { name: 'Directives OFDF' })).toHaveAttribute('href', expect.stringContaining('bazg.admin.ch'));
  });

  it('12. aucune section de l’ancien écran ne reste à côté (remplacer, jamais fusionner)', () => {
    const tax = montrer();
    expect(tax.queryByText('Copier cette estimation')).toBeNull();
    expect(tax.queryByText(/Par brassin · règle des degrés/)).toBeNull();
    expect(tax.queryByText('Comprendre le calcul et les démarches')).toBeNull();
    expect(tax.getByText('Par brassin')).toBeVisible();
  });
});
