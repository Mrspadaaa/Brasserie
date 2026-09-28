import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RecipeDisclosure } from '../../src/ui/RecipeDisclosure';
afterEach(cleanup);
const toggle = (node: HTMLDetailsElement, open: boolean) => act(() => {
  node.open=open;fireEvent(node,new Event('toggle'));
});

it('does not render a deferred report before its first disclosure, then retains its state on closing/reopening', () => {
  const renders=vi.fn();
  function Report() {
    renders(); const [count,setCount]=useState(0);
    return <button onClick={()=>setCount(value=>value+1)}>Scénario {count}</button>;
  }
  render(<RecipeDisclosure title="Rapport" summary="Données de la recette" deferContent><Report/></RecipeDisclosure>);
  expect(screen.getByText('Données de la recette')).toBeInTheDocument();
  expect(renders).not.toHaveBeenCalled();
  const details=screen.getByText('Rapport').closest('details')!;
  toggle(details,true);fireEvent.click(screen.getByRole('button',{name:'Scénario 0'}));
  toggle(details,false);expect(screen.getByText('Scénario 1')).toBeInTheDocument();
  toggle(details,true);expect(screen.getByRole('button',{name:'Scénario 1'})).toBeInTheDocument();
});

it('keeps eager validation as the default and opens an error arriving in a previously mounted closed report', async () => {
  const view=render(<RecipeDisclosure title="Préparation"><p role="alert">Valeur à corriger</p></RecipeDisclosure>);
  expect(screen.getByText('Préparation').closest('details')).toHaveAttribute('open');
  view.unmount();
  function Harness() {
    const [error,setError]=useState(false);
    return <><button onClick={()=>setError(true)}>Nouvelle erreur</button><RecipeDisclosure title="Lecture" deferContent>
      {error ? <p role="alert">Référence modifiée</p> : <p>Valeurs enregistrées</p>}
    </RecipeDisclosure></>;
  }
  render(<Harness/>);
  const details=screen.getByText('Lecture').closest('details')!;
  toggle(details,true);toggle(details,false);
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Nouvelle erreur'}));await Promise.resolve();});
  expect(details).toHaveAttribute('open');expect(screen.getByRole('alert')).toHaveTextContent('Référence modifiée');
});
