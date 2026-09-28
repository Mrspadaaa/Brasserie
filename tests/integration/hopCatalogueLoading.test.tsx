import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const source=vi.hoisted(()=>({calls:0,rows:[{id:'reference',name:'Référence disponible'}],stored:[]}));
vi.mock('../../src/ui/hopIndex/guideVarieties',()=>({
  peekGuideVarieties:()=>++source.calls<=2 ? undefined : source.rows,
  loadGuideVarieties:()=>Promise.resolve(source.rows)
}));
vi.mock('../../src/services/storage',()=>({StorageService:{getHopVarieties:()=>source.stored,subscribe:()=>()=>{}}}));
import { useHopCatalogue } from '../../src/ui/hopIndex/useHopCatalogue';
afterEach(cleanup);
it('hydrates a catalogue that finishes loading between initial render and subscription effect',()=>{
  function View() { const data=useHopCatalogue();return <p>{data.loading?'Chargement':data.varieties[0]?.name}</p>; }
  source.calls=0;render(<View/>);
  expect(screen.getByText('Référence disponible')).toBeInTheDocument();
  expect(screen.queryByText('Chargement')).toBeNull();
});
