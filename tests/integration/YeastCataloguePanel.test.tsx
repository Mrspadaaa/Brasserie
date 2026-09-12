import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
const memory=vi.hoisted(()=>({rows:[] as any[]}));
vi.mock('../../src/hooks/useLiveData',()=>({useStorageValue:(get:()=>unknown)=>get()}));
vi.mock('../../src/services/storage',()=>({StorageService:{getHopKnowledge:()=>memory.rows}}));
import { YeastCataloguePanel } from '../../src/ui/YeastCataloguePanel';
afterEach(cleanup);
describe('Catalogue utilisable pendant la création',()=>{
  it('recherche au-delà de la première page et attend un choix explicite',()=>{
    memory.rows=catalogue;const onSelect=vi.fn();render(<YeastCataloguePanel onSelect={onSelect}/>);
    expect(onSelect).not.toHaveBeenCalled();expect(screen.getAllByRole('article')).toHaveLength(12);
    fireEvent.change(screen.getByLabelText('Nom, code ou arôme documenté'),{target:{value:'WLP300'}});
    expect(screen.getAllByRole('article')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:/White Labs WLP300/}));
    expect(screen.getByRole('img',{name:/Fermentation : 20.*22/})).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Choisir cette culture'}));
    expect(onSelect.mock.calls[0][0].id).toBe('white-labs-wlp300');
  });
  it('reste consultable sans pouvoir appliquer dans une vue de lecture',()=>{
    memory.rows=catalogue.filter(r=>r.id==='white-labs-wlp300');render(<YeastCataloguePanel/>);
    fireEvent.click(screen.getByRole('button',{name:/White Labs WLP300/}));
    expect(screen.queryByRole('button',{name:'Choisir cette culture'})).not.toBeInTheDocument();
    expect(screen.getByText(/Rendement de libération des thiols : inconnu/)).toBeInTheDocument();
  });
});
