import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { EditClientModal } from '../../src/components/EditClientModal';
import { TarifSheet } from '../../src/ui/TarifSheet';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import type { Client, PricingItem, Transaction } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
// Le navigateur du pilote vérifie le rendu et le focus des feuilles réelles.
vi.mock('../../src/ui/Sheet', () => ({
  Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null,
  ConfirmSheet: ({ open, title, onConfirm, onClose }: any) => open ? <div role="dialog" aria-label={title}><button onClick={onClose}>Annuler la suppression</button><button onClick={onConfirm}>Confirmer la suppression</button></div> : null
}));

const clients: Client[] = [
  { id: 'C-1', name: 'Auberge du Lac', type: 'Pro', contact: 'Claire', phone: '+41 79 123 45 67', email: 'claire@example.test', notes: 'Entrée côté cave' },
  { id: 'C-2', name: 'Léon Martin', type: 'Privé', contact: '', phone: '', email: '' },
  { id: 'C-3', name: 'Café du Pont', type: 'Pro', contact: 'Marc', phone: '', email: '' }
];
const tarif = (product: string, priceHT: number): PricingItem => ({ product, costIngredients: 2, costFixed: 1, costLabor: 0, costTotal: 3, priceHT, marginCHF: priceHT - 3, marginPercent: (priceHT - 3) / priceHT * 100 });
const tarifs = [tarif('Bouteille 75 cl', 6), tarif('Bouteille 33 cl', 2.5)];
const showClients = (items = tarifs) => render(<ClientsTab clients={clients} batches={[]} tarifs={items} config={defaultConfig} onOpenQuickAction={() => {}} />);

beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.setUiState('clients_subtab', 'crm');
  StorageService.saveClients(clients);
  StorageService.saveTarifs(tarifs);
  StorageService.saveTransactions([0, 1, 2, 3].map(index => ({
    id: `CLIENT-TX-${index}`, description: index < 3 ? 'Auberge du Lac' : 'Café du Pont',
    date: new Date().toLocaleDateString('de-CH'), category: 'recettes', subcategory: '',
    amountHT: 50, amountTTC: 50, tvaAmount: 0, tvaRate: 0
  } as Transaction)));
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Carnet compact : retrouver, lire, corriger', () => {
  it.each([false, true])('combine recherche, type et statut puis rétablit les clients (mobile=%s)', mobile => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: mobile && query === '(max-width: 639px)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
    showClients();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un client' }), { target: { value: 'leon' } });
    expect(screen.getByText('Léon Martin')).toBeVisible();
    expect(screen.queryByText('Auberge du Lac')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Privés 1' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Statut du client' }), { target: { value: 'Fidèle' } });
    expect(screen.getByText('Aucun client ne correspond à ta recherche.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer les filtres' }));
    expect(screen.getByText('Auberge du Lac')).toBeVisible();
    expect(screen.getByText('Léon Martin')).toBeVisible();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Tous 3' }), { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Pro 2' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByText('Léon Martin')).not.toBeInTheDocument();
  });

  it('garde ventes et statut dans le résumé et révèle les coordonnées et actions', () => {
    showClients();
    const row = screen.getByText('Auberge du Lac').closest('details')!;
    const summary = within(row.querySelector('summary')!);
    expect(summary.getByText('Fidèle')).toBeVisible();
    expect(summary.getByText('150,00 CHF')).toBeVisible();
    expect(within(row).getByRole('button', { name: 'Facturer', hidden: true })).not.toBeVisible();
    fireEvent.click(screen.getByText('Auberge du Lac'));
    expect(within(row).getByRole('button', { name: 'Facturer' })).toBeVisible();
    expect(within(row).getByRole('link', { name: 'Appeler' })).toHaveAttribute('href', 'tel:+41 79 123 45 67');
    expect(within(row).getByRole('link', { name: 'claire@example.test' })).toHaveAttribute('href', 'mailto:claire@example.test');
    expect(within(row).getByText('Entrée côté cave')).toBeVisible();
  });

  it('explique un nom vide et un email invalide puis enregistre le type et les notes', () => {
    const saved = vi.fn();
    render(<EditClientModal isOpen client={{ ...clients[0], name: '', email: '', address: 'Rue de la Gare 2' }} onClose={() => {}} onSave={saved} />);
    expect(screen.getByRole('dialog', { name: 'Nouveau client' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Indique le nom du client.');
    expect(saved).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: /Nom \/ raison sociale/ }), { target: { value: '  Léon Martin  ' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Email de facturation' }), { target: { value: 'adresse-invalide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Vérifie l’adresse email');
    expect(saved).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Email de facturation' }), { target: { value: 'leon@example.test' } });
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Professionnel' }), { key: 'ArrowRight' });
    fireEvent.click(screen.getByText(/Notes et accès logistiques/));
    fireEvent.change(screen.getByRole('textbox', { name: 'Consignes de livraison' }), { target: { value: ' Livrer après 18 h ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ name: 'Léon Martin', type: 'Privé', email: 'leon@example.test', notes: 'Livrer après 18 h', address: 'Rue de la Gare 2' }));
  });
});

describe('Tarifs compacts : comparer et enregistrer sans perdre de données', () => {
  it('filtre une perte, atteint le tableau au clavier et réinitialise une recherche vide', async () => {
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Prix et marges' }));
    const table = screen.getByRole('table');
    expect(within(table).getByText('-0,50')).toBeVisible();
    expect(within(table).queryByText('+-0,50')).not.toBeInTheDocument();
    screen.getByRole('searchbox', { name: 'Rechercher un tarif' }).focus();
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Tous 2' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('region', { name: 'Comparaison des tarifs' })).toHaveFocus();
    fireEvent.click(screen.getByRole('radio', { name: 'Sans marge 1' }));
    expect(screen.queryByRole('button', { name: 'Modifier le tarif Bouteille 75 cl' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un tarif' }), { target: { value: 'Fût 50 L' } });
    expect(screen.getByText('Aucun tarif avec cette recherche ou ce filtre.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Tout effacer' }));
    expect(screen.getByRole('button', { name: 'Modifier le tarif Bouteille 75 cl' })).toBeVisible();
  });

  it.each([false, true])('bloque le raccourci clavier invalide et garde les formules avec une virgule décimale (coarse=%s)', coarse => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: coarse && query === '(pointer: coarse)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }));
    const saved = vi.fn();
    render(<TarifSheet item={tarif('', 6)} config={{ ...defaultConfig, fiscal: { ...defaultConfig.fiscal, isTvaRegistered: true, tvaNormalRate: .081 } }} onClose={() => {}} onSave={saved} onDelete={() => {}} />);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Produit et conditionnement' }), { key: 'Enter', ctrlKey: true });
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('au moins 2 caractères');
    fireEvent.change(screen.getByRole('textbox', { name: 'Produit et conditionnement' }), { target: { value: 'Fût 10 L' } });
    const ingredients = screen.getByRole('textbox', { name: 'Ingrédients (CHF)' });
    expect(ingredients.tagName).toBe(coarse ? 'TEXTAREA' : 'INPUT');
    // Partir d'un vrai montant : conserver 2 CHF après « abc » masquerait le bug.
    fireEvent.change(ingredients, { target: { value: 'abc' } });
    expect(ingredients).toHaveAttribute('aria-invalid', 'true');
    expect(ingredients).toHaveAccessibleDescription(/Montant « abc » non reconnu/);
    expect(screen.getByRole('status', { name: 'Coût de revient' })).toHaveTextContent('À renseigner');
    fireEvent.keyDown(ingredients, { key: 'Enter', ctrlKey: true });
    expect(saved).not.toHaveBeenCalled();
    fireEvent.blur(ingredients);
    fireEvent.keyDown(ingredients, { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Montant « abc » non reconnu');
    expect(ingredients).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(ingredients, { target: { value: '2,0' } });
    expect(ingredients).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.change(ingredients, { target: { value: '' } });
    expect(screen.getByRole('status', { name: 'Coût de revient' })).toHaveTextContent('À renseigner');
    fireEvent.keyDown(ingredients, { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).not.toHaveBeenCalled();
    expect(ingredients).toHaveAccessibleDescription('Indique un montant positif ou nul.');
    fireEvent.change(ingredients, { target: { value: '2,50' } });
    expect(ingredients).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('status', { name: 'Coût de revient' })).toHaveTextContent('3,50 CHF');
    expect(screen.getByRole('status', { name: 'Prix TTC' })).toHaveTextContent('6,49 CHF');
    fireEvent.keyDown(ingredients, { key: 'Enter', ctrlKey: true });
    expect(saved).toHaveBeenCalledTimes(1);
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ product: 'Fût 10 L', costIngredients: 2.5, costFixed: 1, costLabor: 0, costTotal: 3.5, priceHT: 6, marginCHF: 2.5, marginPercent: 41.7 }));
  });

  it('refuse un nom occupé et remplace la clé renommée sans dupliquer ni supprimer les voisins', () => {
    const neighborBefore = StorageService.getTarifs().find(item => item.product === 'Bouteille 33 cl');
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Prix et marges' }));
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le tarif Bouteille 75 cl' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Produit et conditionnement' }), { target: { value: 'BOUTEILLE-33-cl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('a déjà un tarif');
    expect(StorageService.getTarifs()).toHaveLength(2);
    fireEvent.change(screen.getByRole('textbox', { name: 'Produit et conditionnement' }), { target: { value: 'Bouteille 75 cl consignée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(StorageService.getTarifs()).toHaveLength(2);
    expect(StorageService.getTarifs().map(item => item.product)).toEqual(expect.arrayContaining(['Bouteille 75 cl consignée', 'Bouteille 33 cl']));
    expect(StorageService.getTarifs().find(item => item.product === 'Bouteille 33 cl')).toEqual(neighborBefore);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('conserve le tarif quand la suppression est annulée', () => {
    const remove = vi.fn();
    render(<TarifSheet item={tarifs[0]} config={defaultConfig} onClose={() => {}} onSave={() => {}} onDelete={remove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le tarif Bouteille 75 cl' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la suppression' }));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Produit et conditionnement' })).toHaveValue('Bouteille 75 cl');
  });

  it('garde les réserves OFDF visibles et déplie les démarches sans changer le montant', () => {
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Impôt sur la bière' }));
    const tax = within(screen.getByRole('region', { name: 'Réserve pour l’impôt sur la bière' }));
    expect(tax.getByText('0.00 CHF')).toBeVisible();
    expect(tax.getByText(/Réduction annuelle à confirmer/)).toBeVisible();
    expect(tax.getByText(/Barème par hectolitre/)).not.toBeVisible();
    fireEvent.click(tax.getByText('Comprendre le calcul et les démarches'));
    expect(tax.getByText(/Barème par hectolitre/)).toBeVisible();
    fireEvent.change(tax.getByRole('combobox', { name: 'Année de réserve OFDF' }), { target: { value: String(new Date().getFullYear() - 1) } });
    expect(tax.getByText('0.00 CHF')).toBeVisible();
    expect(tax.getByRole('button', { name: 'Copier cette estimation' })).toBeVisible();
    expect(tax.getByRole('link', { name: 'Ouvrir Taxas' })).toHaveAttribute('href', 'https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation');
  });
});
