import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductionCatalog } from '../../src/ui/production/ProductionCatalog';
import { ClientsTab } from '../../src/components/tabs/ClientsTab';
import { StockRow } from '../../src/ui/StockRow';
import { StockDetailSheet } from '../../src/ui/StockDetailSheet';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Batch, Recipe, StockItem, Transaction } from '../../src/types';
import { todayISO } from '../../src/domain/finance/ledger';
import { DEFAULT_CATALOG_FILTERS } from '../../src/domain/productionCatalog';

vi.mock('../../src/services/firebase',()=>({db:{},functions:{}}));
vi.mock('../../src/ui/Sheet',()=>({Sheet:({open,title,children,footer,onClose}:any)=>open?<div role="dialog" aria-label={title}><button onClick={onClose}>Fermer</button>{children}{footer}</div>:null,ConfirmSheet:()=>null}));

beforeEach(()=>{
  vi.spyOn(window,'matchMedia').mockImplementation(query=>({matches:query==='(max-width: 639px)',media:query,onchange:null,addEventListener:()=>{},removeEventListener:()=>{},addListener:()=>{},removeListener:()=>{},dispatchEvent:()=>false}));
  window.history.replaceState({},'', '/?dev-local');
  FirestoreRepo.startSync();
  StorageService.setUiState('catalog-recipes-filters',{...DEFAULT_CATALOG_FILTERS});
  StorageService.setUiState('catalog-recipes-view','list');
  StorageService.setUiState('clients_subtab','crm');
  StorageService.setUiState('finances_workspace',undefined);
});
afterEach(()=>{cleanup();FirestoreRepo.stopSync();vi.restoreAllMocks();});

const recipes:Recipe[]=[{...fullRecipe,id:'MOBILE-IPA',name:'IPA du lac',style:'IPA'},{...fullRecipe,id:'MOBILE-STOUT',name:'Stout du soir',style:'Stout'},{...fullRecipe,id:'MOBILE-OLD',name:'Première recette',style:'IPA',archivedAt:'2025-12-31'}];
function catalog(){const onOpenRecipe=vi.fn(),onEditRecipe=vi.fn();render(<ProductionCatalog kind="recipes" recipes={recipes} batches={[]} globalTimeFilter="all" onOpenRecipe={onOpenRecipe} onEditRecipe={onEditRecipe} onOpenBatch={()=>{}} onOpenBrewDay={()=>{}}/>);return {onOpenRecipe,onEditRecipe};}

describe('Vues quotidiennes sur téléphone',()=>{
  it('garde le catalogue visible et ouvre la recherche seulement à la demande',()=>{
    catalog();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Rechercher des recettes'}));
    fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Stout du soir'}});
    expect(screen.getAllByRole('article')).toHaveLength(1);
    // The visible input already explains this restriction; no second search banner.
    expect(screen.queryByRole('button',{name:/Vue filtrée/})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Fermer la recherche'}));
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('retrouve filtres, tri et archives sans les afficher au-dessus de chaque liste',()=>{
    catalog();
    expect(screen.queryByRole('combobox',{name:'Dossier des recettes'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Filtres avancés'}));
    const dialog=within(screen.getByRole('dialog'));
    expect(dialog.getByRole('combobox',{name:'Trier les recettes'})).toBeVisible();
    fireEvent.change(dialog.getByRole('combobox',{name:'Filtrer par style'}),{target:{value:'Stout'}});
    fireEvent.click(dialog.getByRole('button',{name:'Fermer'}));
    expect(screen.getByRole('button',{name:/Vue filtrée/})).toHaveTextContent('Stout');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:'Tout effacer'}));
    fireEvent.click(screen.getByRole('button',{name:'Filtres avancés'}));
    fireEvent.change(screen.getByRole('combobox',{name:'Dossier des recettes'}),{target:{value:'archived'}});
    fireEvent.click(screen.getByRole('button',{name:'Fermer'}));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('button',{name:'Ouvrir la recette Première recette'})).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Archives');
  });

  it('ouvre la recette directement et réserve les actions secondaires au dépliage',()=>{
    const actions=catalog();
    const card=within(screen.getByRole('article',{name:'Recette IPA du lac, version 1'}));
    expect(card.getByRole('button',{name:'Modifier la recette IPA du lac',hidden:true})).not.toBeVisible();
    fireEvent.click(card.getByRole('button',{name:'Ouvrir la recette IPA du lac'}));
    expect(actions.onOpenRecipe).toHaveBeenCalledWith(recipes[0]);
    fireEvent.click(card.getByText('Détails et actions'));
    fireEvent.click(card.getByRole('button',{name:'Modifier la recette IPA du lac'}));
    expect(actions.onEditRecipe).toHaveBeenCalledWith(recipes[0]);
    expect(card.getByRole('button',{name:/Ranger la recette/})).toBeVisible();
  });

  it('conserve les contacts, la facturation et la recherche vide dans le carnet client',()=>{
    render(<ClientsTab clients={[{id:'C1',name:'Auberge du Lac',type:'Pro',contact:'Marie',phone:'+41 79 123 45 67',email:'contact@example.test'}]} batches={[]} tarifs={[]} config={defaultConfig} onOpenQuickAction={()=>{}}/>);
    expect(screen.getByRole('group',{name:'Vue des clients'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Facturer',hidden:true})).not.toBeVisible();
    fireEvent.click(screen.getByText('Auberge du Lac'));
    expect(screen.getByRole('button',{name:'Facturer'})).toBeVisible();
    expect(screen.getByRole('link',{name:'Appeler'})).toHaveAttribute('href','tel:+41 79 123 45 67');
    fireEvent.change(screen.getByRole('searchbox'),{target:{value:'Introuvable'}});
    expect(screen.getByText('Aucun client ne correspond à ta recherche.')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Effacer la recherche'}));
    expect(screen.getByText('Auberge du Lac')).toBeVisible();
  });

  it('affiche quantité et couverture du stock et garde les besoins dans la fiche',()=>{
    const item:StockItem={id:'S1',ref:'S1',name:'Pilsner',category:'Malt',unit:'kg',currentStock:2,minStock:3,reorder:true};
    const batches:Batch[]=[{id:'LOT-S',name:'Brassin du samedi',style:'Pale Ale',volumeL:30,brewDate:todayISO(),status:'planifie',malts:[{name:'Pilsner',weightKg:6}]}];
    const open=vi.fn();const view=render(<StockRow item={item} batches={batches} onOpen={open} onQuickAdjust={()=>{}} onToggleFavorite={()=>{}}/>);
    expect(screen.queryByText(/Brassin du samedi/)).not.toBeInTheDocument();
    expect(screen.getByRole('meter')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Ouvrir Pilsner'}));expect(open).toHaveBeenCalledWith(item);
    view.unmount();render(<StockDetailSheet item={item} batches={batches} onClose={()=>{}} onSave={()=>{}} onDelete={()=>{}} onCorrectInventory={()=>{}} onToggleFavorite={()=>{}}/>);
    fireEvent.click(screen.getByText('Besoins des brassins · 1 brassin(s)'));
    expect(screen.getByText('Brassin du samedi')).toBeVisible();
    expect(screen.getByRole('button',{name:'Corriger l’inventaire'})).toBeVisible();
  });

  it('ouvre les finances sur la synthèse et conserve la recherche visible entre les quatre vues',()=>{
    const tx:Transaction={id:'T1',description:'Houblon Cascade',date:todayISO(),category:'brassage',subcategory:'',amountHT:50,amountTTC:50,tvaAmount:0,tvaRate:0};
    render(<FinancesTab transactions={[tx]} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={()=>{}}/>);
    const navigation=within(screen.getByRole('tablist',{name:'Finances'}));
    expect(navigation.getAllByRole('tab').map(tab=>tab.textContent)).toEqual(['Synthèse','Opérations','Prévisions','Annuel']);
    expect(navigation.getByRole('tab',{name:'Synthèse'})).toHaveAttribute('aria-selected','true');
    expect(screen.getByRole('heading',{name:'Situation financière'})).toBeVisible();
    fireEvent.click(navigation.getByRole('tab',{name:'Opérations'}));
    expect(screen.getByRole('textbox',{name:'Rechercher une opération'})).toBeVisible();
    expect(screen.getByLabelText('Période du journal')).toBeVisible();
    expect(screen.getByRole('button',{name:/Houblon Cascade/})).toBeVisible();
    expect(screen.getByRole('button',{name:'Archives',exact:true})).toBeVisible();
    fireEvent.change(screen.getByRole('textbox',{name:'Rechercher une opération'}),{target:{value:'Cascade'}});
    fireEvent.click(navigation.getByRole('tab',{name:'Prévisions'}));
    expect(screen.getByRole('heading',{name:'Prochaines échéances'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Budget d’un brassin'})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Ajouter une prévision'}));
    const plan=within(screen.getByRole('dialog',{name:'Prévoir une dépense'}));
    fireEvent.click(plan.getByRole('button',{name:'Fermer'}));
    fireEvent.click(navigation.getByRole('tab',{name:'Annuel'}));
    expect(screen.getByRole('heading',{name:'Bilan et impôts'})).toBeVisible();
    fireEvent.click(navigation.getByRole('tab',{name:'Opérations'}));
    expect(screen.getByRole('textbox',{name:'Rechercher une opération'})).toHaveValue('Cascade');
    expect(screen.getByRole('button',{name:/Houblon Cascade/})).toBeVisible();
  });
});
