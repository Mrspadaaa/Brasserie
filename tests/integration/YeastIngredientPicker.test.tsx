import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { StockItem } from '../../src/types';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { YeastIngredientPicker } from '../../src/ui/YeastIngredientPicker';

const memory = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => memory.rows }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getHopKnowledge: vi.fn() } }));
afterEach(() => { cleanup(); memory.rows = []; });

const source = yeastReferences().find(row => row.id === 'yeast-bootleg-2883')!;
const testReference = (id: string, name: string, manufacturer: string, productCode: string) => {
  const row = structuredClone(source);
  row.id = id; row.name = name; row.catalogue!.manufacturer = manufacturer;
  row.catalogue!.productId = `fixture-${id}`; row.catalogue!.productCode = productCode;
  row.catalogue!.aliases = [name, productCode]; row.catalogue!.facts = [];
  return row;
};
const stockItem = (reference: typeof source, ref = 'Y-LOT-7'): StockItem => ({
  id: `doc-${ref}`, ref, name: reference.name, category: 'Levure', unit: 'sachet', currentStock: 2,
  minStock: 0, reorder: false, supplier: 'Dépôt local', yeastLab: reference.catalogue!.manufacturer,
  yeastStrain: reference.catalogue!.productCode ?? undefined, yeastForm: 'sèche'
});
const openSearch = (query: string) => {
  if (!screen.queryByRole('combobox', { name: 'Souche de levure' })) {
    fireEvent.click(screen.getByRole('button', { name: /Chercher (?:un autre |un )?lot ou une référence/ }));
  }
  const field = screen.getByRole('combobox', { name: 'Souche de levure' });
  fireEvent.click(field);
  if (query) fireEvent.change(field, { target: { value: query } });
  return field;
};
const sourceOption = (group: string, discriminator = '') => screen.getAllByRole('option')
  .find(option => (option.getAttribute('aria-label') ?? '').includes(`· ${group} ·`)
    && (!discriminator || (option.getAttribute('aria-label') ?? '').includes(discriminator)))!;

describe('Recherche stock et catalogue de levures', () => {
  it('classe le nom/code exact avant une mention dans les faits, sans cas spécial de produit', () => {
    const exact = testReference('fixture-ab12', 'Culture Boréale', 'Microbrasserie Nord', 'AB-12');
    const descriptive = testReference('fixture-description', 'Culture Australe', 'Atelier Sud', 'CD-34');
    descriptive.catalogue!.facts = [{ key: 'application', label: 'Comparaison témoin', reported: 'Un tableau cite AB12 comme exemple.', source: descriptive.source }];
    memory.rows = [descriptive, exact];
    render(<YeastIngredientPicker items={[]} yeast={{ name: '' }} onStock={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} personalChoice />);

    openSearch('AB12');
    const rows = screen.getAllByRole('option');
    expect(rows[0]).toHaveAccessibleName(/Culture Boréale.*Microbrasserie Nord|Culture Boréale.*AB-12/);
    expect(rows[0]).toHaveTextContent('code AB-12');
    expect(rows.some(row => /Culture Australe/.test(row.getAttribute('aria-label') ?? ''))).toBe(true);
  });

  it('garde homonymes stock/catalogue séparés et sélectionne une seule source explicite', () => {
    const reference = source, item = stockItem(reference);
    const onStock = vi.fn(), onReference = vi.fn(), onCreate = vi.fn();
    const props = { items: [item], onStock, onReference, onCreate, personalChoice: true };
    const view = render(<YeastIngredientPicker {...props} yeast={{ name: '' }} />);

    openSearch('BB 0022');
    const stock = sourceOption('Mon stock', item.ref), catalogue = sourceOption('Catalogue documenté', 'code BB0022');
    expect(screen.getAllByRole('option').some(option => option.getAttribute('aria-label')?.includes(item.ref))).toBe(true);
    expect(stock).toHaveTextContent(`code ${reference.catalogue!.productCode}`);
    expect(stock).toHaveTextContent(`réf. article ${item.ref}`);
    expect(stock).toHaveTextContent('Dépôt local');
    expect(catalogue).toHaveTextContent('Fabricant Bootleg Biology');
    expect(catalogue).toHaveTextContent('code BB0022');
    expect(catalogue).toHaveAttribute('aria-selected', 'false');
    expect(screen.queryByRole('option', { name: /Utiliser « BB 0022 »/ })).not.toBeInTheDocument();

    fireEvent.click(catalogue);
    expect(onReference).toHaveBeenCalledExactlyOnceWith(reference);
    expect(onStock).not.toHaveBeenCalled(); expect(onCreate).not.toHaveBeenCalled();

    cleanup();
    onReference.mockClear(); onStock.mockClear(); onCreate.mockClear();
    const second = render(<YeastIngredientPicker {...props} yeast={{ name: '' }} />);
    openSearch('bb0022');
    fireEvent.click(sourceOption('Mon stock', item.ref));
    expect(onStock).toHaveBeenCalledExactlyOnceWith(item.name, item);
    expect(onReference).not.toHaveBeenCalled(); expect(onCreate).not.toHaveBeenCalled();
    second.unmount();
  });

  it('ouvre la recherche de stock sur demande, garde la saisie exclusive et conserve les callbacks exacts', () => {
    const candidates = [
      testReference('fixture-a', 'Culture A', 'Labo A', 'QA-01'),
      testReference('fixture-b', 'Culture B', 'Labo B', 'QA-02'),
      testReference('fixture-c', 'Culture C', 'Labo C', 'QA-03'),
      testReference('fixture-z', 'Culture Z', 'Labo Z', 'QA-42'),
    ];
    memory.rows = candidates;
    const items = candidates.map((candidate, index) => stockItem(candidate, `Y-LOT-${index + 1}`));
    const onStock = vi.fn(), onReference = vi.fn(), onCreate = vi.fn();
    render(<>
      <input type="search" aria-label="Rechercher une levure" />
      <YeastIngredientPicker items={items} yeast={{ name: '' }} onStock={onStock} onReference={onReference} onCreate={onCreate} personalChoice />
    </>);

    expect(screen.getAllByRole('searchbox')).toHaveLength(1);
    expect(screen.queryByRole('combobox', { name: 'Souche de levure' })).not.toBeInTheDocument();
    const quick = screen.getByRole('group', { name: 'Levures disponibles dans mon stock' });
    const quickButtons = Array.from(quick.querySelectorAll('button'));
    expect(quickButtons).toHaveLength(3);
    expect(quickButtons.some(button => button.textContent?.includes('Culture Z'))).toBe(false);
    fireEvent.click(quickButtons[0]);
    expect(onStock).toHaveBeenCalledExactlyOnceWith(items[0].name, items[0]);
    onStock.mockClear();

    const searchToggle = screen.getByRole('button', { name: 'Chercher un autre lot ou une référence' });
    const freeToggle = screen.getByRole('button', { name: 'Saisir une levure hors catalogue' });
    fireEvent.click(searchToggle);
    expect(searchToggle).toHaveAttribute('aria-expanded', 'true');
    let field = screen.getByRole('combobox', { name: 'Souche de levure' });
    expect(field).toHaveFocus();
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);
    fireEvent.change(field, { target: { value: 'QA-42' } });
    expect(sourceOption('Mon stock', items[3].ref)).toBeVisible();

    fireEvent.keyDown(field, { key: 'Escape' });
    expect(field).toBeInTheDocument();
    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('aria-expanded', 'false');
    expect(searchToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    fireEvent.click(freeToggle);
    expect(searchToggle).toHaveAttribute('aria-expanded', 'false');
    expect(freeToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('combobox', { name: 'Souche de levure' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nom de la levure personnelle' })).toBeVisible();
    fireEvent.click(searchToggle);
    expect(freeToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: 'Nom de la levure personnelle' })).not.toBeInTheDocument();
    field = screen.getByRole('combobox', { name: 'Souche de levure' });
    expect(field).toHaveFocus();
    fireEvent.change(field, { target: { value: 'QA-42' } });
    fireEvent.click(sourceOption('Mon stock', items[3].ref));
    expect(onStock).toHaveBeenCalledExactlyOnceWith(items[3].name, items[3]);
    expect(onReference).not.toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('ne présélectionne jamais un article ou une fiche par nom seul', () => {
    const reference = source, item = stockItem(reference);
    const view = render(<YeastIngredientPicker items={[item]} yeast={{ name: reference.name }}
      onStock={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} personalChoice />);
    openSearch('BB0022');
    expect(sourceOption('Mon stock', item.ref)).toHaveAttribute('aria-selected', 'false');
    expect(sourceOption('Catalogue documenté', 'code BB0022')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('sans référence de stock ni identifiant catalogue');

    view.rerender(<YeastIngredientPicker items={[item]} yeast={{ name: reference.name, stockItemRef: item.ref }}
      onStock={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} personalChoice />);
    expect(sourceOption('Mon stock', item.ref)).toHaveAttribute('aria-selected', 'true');
    expect(sourceOption('Catalogue documenté', 'code BB0022')).toHaveAttribute('aria-selected', 'false');

    view.rerender(<YeastIngredientPicker items={[item]} yeast={{ name: reference.name, hopIndexId: reference.id }}
      onStock={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} personalChoice />);
    expect(sourceOption('Mon stock', item.ref)).toHaveAttribute('aria-selected', 'false');
    expect(sourceOption('Catalogue documenté', 'code BB0022')).toHaveAttribute('aria-selected', 'true');
  });

  it('recherche un productId homonyme comme indice, sans fusionner ses deux fabricants', () => {
    memory.rows = [];
    render(<YeastIngredientPicker items={[]} yeast={{ name: '' }} onStock={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: 'Souche de levure' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Chercher .*lot ou une référence/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Saisir une levure hors catalogue' })).not.toBeInTheDocument();
    openSearch('2883');
    const options = screen.getAllByRole('option');
    expect(options.some(row => row.getAttribute('aria-label')?.includes('Bootleg Biology'))).toBe(true);
    expect(options.some(row => row.getAttribute('aria-label')?.includes('Brewing Science Institute'))).toBe(true);
    expect(options.filter(row => row.getAttribute('aria-label')?.includes('Catalogue documenté')).length).toBeGreaterThanOrEqual(2);
  });

  it('conserve le chemin de saisie libre et ne le convertit pas en référence catalogue', () => {
    const onStock = vi.fn(), onReference = vi.fn(), onCreate = vi.fn();
    render(<YeastIngredientPicker items={[]} yeast={{ name: '' }} onStock={onStock} onReference={onReference} onCreate={onCreate} personalChoice />);
    fireEvent.click(screen.getByRole('button', { name: 'Saisir une levure hors catalogue' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom de la levure personnelle' }), { target: { value: 'Culture R-77 libre' } });
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette levure' }));
    expect(onCreate).toHaveBeenCalledExactlyOnceWith('Culture R-77 libre');
    expect(onStock).not.toHaveBeenCalled(); expect(onReference).not.toHaveBeenCalled();
  });

  it('propose une création depuis la recherche seulement quand aucune option ne correspond', () => {
    const onCreate = vi.fn();
    render(<YeastIngredientPicker items={[]} yeast={{ name: '' }} onStock={vi.fn()} onReference={vi.fn()} onCreate={onCreate} personalChoice />);
    openSearch('Culture R-77 libre');
    const create = screen.getByRole('option', { name: 'Utiliser « Culture R-77 libre » dans la recette' });
    fireEvent.click(create);
    expect(onCreate).toHaveBeenCalledExactlyOnceWith('Culture R-77 libre');
  });
});
