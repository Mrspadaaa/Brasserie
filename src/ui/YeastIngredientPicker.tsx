import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import type { StockItem, YeastSpec } from '../types';
import { yeastReferences, type YeastReference } from '../domain/yeastReferences';
import { normalizedYeastText, yeastIdentitySearchIndex, yeastSearchIndex, yeastSearchScore, type YeastSearchIndex } from '../domain/yeastCatalogue';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { normalize } from '../services/search';
import { Units } from '../services/units';
import { Combobox, type ComboOption } from './Combobox';
import { Input } from './Input';

type IndexedChoice = { option: ComboOption; identity: YeastSearchIndex };

const stockDetail = (item: StockItem) => [
  item.yeastLab && `Labo ${item.yeastLab}`,
  item.yeastStrain && `code ${item.yeastStrain}`,
  item.yeastForm && `forme ${item.yeastForm}`,
  `réf. article ${item.ref}`,
  item.supplier && `fournisseur ${item.supplier}`,
  `${Units.format(item.currentStock, item.unit)} en stock`
].filter(Boolean).join(' · ');

const quickStockDetail = (item: StockItem) => [
  item.yeastLab,
  item.yeastStrain && `code ${item.yeastStrain}`,
  `réf. ${item.ref}`,
  Units.format(item.currentStock, item.unit)
].filter(Boolean).join(' · ');

/** A strain can be chosen before buying it. Stock and reference share one search. */
export function YeastIngredientPicker({ items, yeast, onStock, onReference, onCreate, personalChoice = false }: {
  items: StockItem[]; yeast: YeastSpec;
  onStock: (name: string, item?: StockItem) => void;
  onReference: (yeast: YeastReference) => void;
  onCreate: (name: string) => void;
  personalChoice?: boolean;
}) {
  const [manual, setManual] = useState(false), [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  // Empty personal choice: the catalogue search sits just above, so this one opens on demand.
  const [searchOpen, setSearchOpen] = useState(false);
  const emptyChoice = personalChoice && !yeast.name;
  const pickerRef = useRef<HTMLDivElement>(null);
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const references = useMemo(() => yeastReferences(saved), [saved]);
  const stock = useMemo(() => items.filter(i => i.category.toLocaleLowerCase('fr') === 'levure'), [items]);
  const readyStock = useMemo(() => stock.filter(i => i.currentStock > 0)
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'fr'))
    .slice(0, 3), [stock]);
  const indexedOptions = useMemo<IndexedChoice[]>(() => [
    ...stock.map(item => {
      const identity = yeastIdentitySearchIndex({ name: item.name, manufacturer: item.yeastLab, productCode: item.yeastStrain,
        // A stock reference identifies this article only. It never identifies a catalogue entry.
        aliases: [item.ref], descriptive: [item.supplier ?? ''] });
      return { identity, option: { value: `stock:${item.ref}`, label: item.name, group: 'Mon stock', favorite: item.favorite,
        detail: stockDetail(item), keywords: [...identity.keys, identity.text].join(' ') } };
    }),
    ...references.map(reference => {
      const identity = yeastSearchIndex(reference);
      return { identity, option: { value: `reference:${reference.id}`, label: reference.name, group: 'Catalogue documenté',
        detail: [reference.catalogue?.manufacturer && `Fabricant ${reference.catalogue.manufacturer}`,
          reference.catalogue?.productCode && `code ${reference.catalogue.productCode}`, reference.form]
          .filter(Boolean).join(' · '), keywords: [...identity.keys, identity.text].join(' ') } };
    })
  ], [stock, references]);
  const normalizedQuery = normalizedYeastText(searchQuery);
  const matchingOptions = useMemo(() => {
    if (!normalizedQuery) return indexedOptions;
    return indexedOptions.map((choice, order) => ({ choice, order, score: yeastSearchScore(choice.identity, normalizedQuery) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(result => result.choice);
  }, [indexedOptions, normalizedQuery]);
  // The shared Combobox keeps its keyboard/touch behavior. Its Fuse pass sees
  // the already ranked result set, so it cannot promote a descriptive product
  // ID above a manufacturer, name, code or alias match.
  const options = useMemo(() => matchingOptions.map(({ option }) => ({
    ...option,
    keywords: searchQuery.trim() ? normalize(searchQuery.trim()) : option.keywords
  })), [matchingOptions, searchQuery]);
  const currentStock = yeast.stockItemRef ? stock.find(item => item.ref === yeast.stockItemRef) : undefined;
  const currentReference = yeast.hopIndexId ? references.find(reference => reference.id === yeast.hopIndexId) : undefined;
  const value = currentStock ? `stock:${currentStock.ref}` : currentReference ? `reference:${currentReference.id}` : yeast.name;
  const currentIdentityNotice = currentStock && currentReference
    ? `Stock enregistré : article ${currentStock.ref}. Fiche catalogue enregistrée séparément : ${currentReference.catalogue?.manufacturer ?? currentReference.name}${currentReference.catalogue?.productCode ? ` · code ${currentReference.catalogue.productCode}` : ''}.`
    : yeast.stockItemRef && !currentStock ? `Article stock ${yeast.stockItemRef} absent de cette liste. Le nom reste conservé.`
      : yeast.hopIndexId && !currentReference ? `Référence catalogue ${yeast.hopIndexId} absente de cette liste. Le nom reste conservé.`
        : yeast.name.trim() && !yeast.stockItemRef && !yeast.hopIndexId ? 'Nom conservé sans référence de stock ni identifiant catalogue.' : '';
  const clearSearch = () => setSearchQuery('');
  const trackQuery = (event: ChangeEvent<HTMLDivElement>) => {
    const target = event.target;
    if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && target.getAttribute('role') === 'combobox')
      setSearchQuery(target.value);
  };
  const clearSearchOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if ((event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) && event.target.getAttribute('role') === 'combobox') clearSearch();
  };
  const clearSearchOnKey = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === 'Escape') clearSearch(); };
  const clearSearchOnAction = (event: MouseEvent<HTMLDivElement>) => {
    const label = (event.target as Element).closest('button')?.getAttribute('aria-label');
    if (label === 'Effacer la recherche' || label === 'Fermer la liste') clearSearch();
  };
  useEffect(() => {
    if (!searchQuery) return;
    const onOutsidePointer = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) clearSearch();
    };
    document.addEventListener('pointerdown', onOutsidePointer);
    return () => document.removeEventListener('pointerdown', onOutsidePointer);
  }, [searchQuery]);
  // A choice (or its undo) returns to the compact empty state.
  useEffect(() => { if (yeast.name) setSearchOpen(false); }, [yeast.name]);
  useEffect(() => {
    if (searchOpen) pickerRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
  }, [searchOpen]);
  // Only one of the two optional fields is open at a time.
  const toggleSearch = () => { clearSearch(); setManual(false); setSearchOpen(open => !open); };
  const toggleManual = () => { clearSearch(); setSearchOpen(false); setManual(open => !open); };
  const manualToggle = <button type="button" className="yeast-link" aria-expanded={manual} onClick={toggleManual}>Saisir une levure hors catalogue</button>;
  return <div ref={pickerRef} onChangeCapture={trackQuery} onBlurCapture={clearSearchOnBlur} onKeyDownCapture={clearSearchOnKey} onClickCapture={clearSearchOnAction}>
    {emptyChoice && readyStock.length > 0 && <div className="yc-stock-quick" role="group" aria-label="Levures disponibles dans mon stock">
      <span>Disponibles</span>{readyStock.map(item => <button key={item.ref} type="button" onClick={() => { clearSearch(); onStock(item.name, item); }}
        aria-label={`Choisir ${item.name}${item.yeastLab ? `, labo ${item.yeastLab}` : ''}${item.yeastStrain ? `, code ${item.yeastStrain}` : ''}, article ${item.ref}, ${Units.format(item.currentStock, item.unit)} en stock`}
        title={`${item.ref}${item.supplier ? ` · ${item.supplier}` : ''}`}>
        <span className="min-w-0">{item.name}</span><small>{quickStockDetail(item)}</small>
      </button>)}
    </div>}
    {emptyChoice && <div className="flex flex-wrap gap-x-4 gap-y-1">
      <button type="button" className="yeast-link" aria-expanded={searchOpen} onClick={toggleSearch}>
        {readyStock.length > 0 ? 'Chercher un autre lot ou une référence' : 'Chercher un lot ou une référence'}
      </button>
      {manualToggle}
    </div>}
    {(!emptyChoice || searchOpen) && <Combobox value={value} options={options} searchKeys={['keywords']} maxResults={40} compact
      ariaLabel="Souche de levure" placeholder="Nom, laboratoire, code ou réf. stock…"
      allowCreate={personalChoice && normalizedQuery.length > 1 && matchingOptions.length === 0}
      onCreate={candidate => { clearSearch(); onCreate(candidate); }}
      createLabel={candidate => personalChoice ? `Utiliser « ${candidate} » dans la recette` : `Créer « ${candidate} » (stock à zéro)`}
      onChange={selected => {
        const item = stock.find(row => `stock:${row.ref}` === selected);
        if (item) { clearSearch(); onStock(item.name, item); return; }
        const reference = references.find(row => `reference:${row.id}` === selected);
        if (reference) { clearSearch(); onReference(reference); }
      }} />}
    {currentIdentityNotice && <p className="mt-1 text-xs text-cave-400" role="status">{currentIdentityNotice}</p>}
    {personalChoice && !emptyChoice && manualToggle}
    {personalChoice && manual && <div className="yc-personal-entry"><label>Nom de la souche<Input aria-label="Nom de la levure personnelle" value={name} onChange={e => setName(e.target.value)} placeholder="Nom exact, labo ou code…" /></label><button type="button" disabled={!name.trim()} onClick={() => { onCreate(name.trim()); setManual(false); }}>Utiliser cette levure</button></div>}
  </div>;
}
