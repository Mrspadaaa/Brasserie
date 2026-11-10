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
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Tous' }), { key: 'ArrowRight' });
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
    expect(within(row).getByRole('link', { name: 'Appeler' })).toHaveAttribute('href', 'tel:+41791234567');
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

describe('Prix (c7c) : un seul endroit pour fixer un prix, sans rien perdre des tarifs existants', () => {
  it('Clients › Prix monte l’écran Prix : format, plus de tableau ; un ancien tarif sans format est lisible et invite à le compléter', () => {
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Prix' }));
    expect(screen.getByRole('group', { name: 'Format' })).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const aCompleter = screen.getByRole('group', { name: 'Tarifs à compléter' });
    expect(within(aCompleter).getByRole('button', { name: /Bouteille 75 cl · 6,00/ })).toBeVisible();
    expect(within(aCompleter).getByRole('button', { name: /Bouteille 33 cl · 2,50/ })).toBeVisible();
  });

  it.each([false, true])('bloque le raccourci clavier invalide et garde les formules avec une virgule décimale (coarse=%s)', coarse => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({ matches: coarse && query === '(pointer: coarse)', media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false }) as MediaQueryList);
    const saved = vi.fn();
    render(<TarifSheet item={{ product: '', biere: '', format: { id: '33cl', volumeL: 0.33 }, priceHT: Number.NaN }} config={{ ...defaultConfig, fiscal: { ...defaultConfig.fiscal, isTvaRegistered: true, tvaNormalRate: .081 } }} onClose={() => {}} onSave={saved} onDelete={() => {}} />);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Bière' }), { key: 'Enter', ctrlKey: true });
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').map(n => n.textContent).join(' ')).toContain('Indique la bière et le format');
    fireEvent.change(screen.getByRole('textbox', { name: 'Bière' }), { target: { value: 'Pale Ale' } });
    const prix = screen.getByRole('textbox', { name: 'Prix de vente HT (CHF)' });
    expect(prix.tagName).toBe(coarse ? 'TEXTAREA' : 'INPUT');
    fireEvent.change(prix, { target: { value: 'abc' } });
    expect(prix).toHaveAttribute('aria-invalid', 'true');
    expect(prix).toHaveAccessibleDescription(/Montant « abc » non reconnu/);
    fireEvent.keyDown(prix, { key: 'Enter', ctrlKey: true });
    expect(saved).not.toHaveBeenCalled();
    fireEvent.blur(prix);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Montant « abc » non reconnu');
    fireEvent.change(prix, { target: { value: '6,0' } });
    expect(prix).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.change(prix, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(saved).not.toHaveBeenCalled();
    expect(prix).toHaveAccessibleDescription('Champ vide : indique un montant de 0 à 10 000 CHF.');
    fireEvent.change(prix, { target: { value: '6,50' } });
    expect(screen.getByRole('status', { name: 'Prix TTC' })).toHaveTextContent('7,03 CHF');
    fireEvent.keyDown(prix, { key: 'Enter', ctrlKey: true });
    expect(saved).toHaveBeenCalledTimes(1);
    const sortie = saved.mock.calls[0][0];
    expect(sortie).toEqual(expect.objectContaining({ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 }, priceHT: 6.5 }));
    expect(sortie).not.toHaveProperty('emballageUnite'); // vide = à compléter, jamais 0
    expect(sortie).not.toHaveProperty('costTotal');
  });

  it('refuse un nom occupé et remplace la clé renommée sans dupliquer ni supprimer les voisins (tarif ancien, nom libre)', () => {
    const neighborBefore = StorageService.getTarifs().find(item => item.product === 'Bouteille 33 cl');
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Prix' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Tarifs à compléter' })).getByRole('button', { name: /Bouteille 75 cl/ }));
    expect(screen.getByRole('note')).toHaveTextContent('pas encore de bière ni de format');
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom actuel du tarif' }), { target: { value: 'BOUTEILLE-33-cl' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('alert')).toHaveTextContent('a déjà un tarif');
    expect(StorageService.getTarifs()).toHaveLength(2);
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom actuel du tarif' }), { target: { value: 'Bouteille 75 cl consignée' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(StorageService.getTarifs()).toHaveLength(2);
    expect(StorageService.getTarifs().map(item => item.product)).toEqual(expect.arrayContaining(['Bouteille 75 cl consignée', 'Bouteille 33 cl']));
    expect(StorageService.getTarifs().find(item => item.product === 'Bouteille 33 cl')).toEqual(neighborBefore);
    const renomme = StorageService.getTarifs().find(item => item.product === 'Bouteille 75 cl consignée')!;
    expect(renomme.costIngredients).toBe(2); // les champs hérités ne sont jamais effacés
    expect(renomme.format).toEqual({ id: '75cl', volumeL: 0.75 });
  });

  it('le journal d’un tarif enregistré ne dit pas « marge  % » (le coût n’est plus saisi)', () => {
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Prix' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Tarifs à compléter' })).getByRole('button', { name: /Bouteille 33 cl/ }));
    const logs: string[] = [];
    vi.spyOn(StorageService, 'logAction').mockImplementation((...a: unknown[]) => { logs.push(a.join(' | ')); });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(logs.join(' ')).toMatch(/Tarif Bouteille 33 cl/);
    expect(logs.join(' ')).not.toMatch(/marge/);
  });

  it('conserve le tarif quand la suppression est annulée', () => {
    const remove = vi.fn();
    render(<TarifSheet item={tarifs[0]} config={defaultConfig} onClose={() => {}} onSave={() => {}} onDelete={remove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le tarif Bouteille 75 cl' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la suppression' }));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Nom actuel du tarif' })).toHaveValue('Bouteille 75 cl');
  });

  it('garde la réduction visible et déplie les démarches ; aucun brassin = « — », jamais un 0,00 qui ressemble à un calcul', () => {
    showClients();
    fireEvent.click(screen.getByRole('button', { name: 'Impôt bière' }));
    const tax = within(screen.getByRole('region', { name: 'Impôt bière de l’année' }));
    expect(tax.getByText(/Aucun brassin en/)).toBeVisible();
    expect(tax.getByText('—')).toBeVisible();
    expect(tax.getByText(/réduction annuelle à confirmer/)).toBeVisible();
    expect(tax.getByText(/Barème par hectolitre/)).not.toBeVisible();
    fireEvent.click(tax.getByText('Comprendre le calcul et les démarches'));
    expect(tax.getByText(/Barème par hectolitre/)).toBeVisible();
    fireEvent.change(tax.getByRole('combobox', { name: 'Année de réserve OFDF' }), { target: { value: String(new Date().getFullYear() - 1) } });
    expect(tax.getByText(/Aucun brassin en/)).toBeVisible();
    expect(tax.getByRole('button', { name: 'Copier cette estimation' })).toBeVisible();
    expect(tax.getByRole('link', { name: 'Ouvrir Taxas' })).toHaveAttribute('href', 'https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation');
  });
});
