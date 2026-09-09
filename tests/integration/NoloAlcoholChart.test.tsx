import React from 'react';
import {afterEach,it,expect} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {BoundGraph,noloDisplayRangeLabel} from '../../src/ui/NoloAlcoholChart';
afterEach(cleanup);
it('montre la plage technique étroite avec une échelle et une cible identifiables',()=>{
  const bound={min:.398559,max:.399193,kind:'experimental' as const,confidence:'low' as const};
  const {container}=render(<BoundGraph bound={bound} target={.5}/>);
  expect(screen.getByText('0,39–0,40 % vol.')).toBeVisible();
  expect(screen.getByText(/incertitude expérimentale non chiffrée/)).toBeVisible();
  expect(screen.getByText('Cible 0,50 %')).toBeVisible();
  expect(screen.getByText('0 %')).toBeVisible();expect(screen.getByText('1 %')).toBeVisible();
  const band=container.querySelector('[data-nolo-band]')!;
  expect(Number(band.getAttribute('x1'))).toBeCloseTo(16+408*bound.min,10);
  expect(Number(band.getAttribute('x2'))).toBeCloseTo(16+408*bound.max,10);
});
it('ne dessine ni plage ni zéro pour une borne haute inconnue',()=>{
  const {container}=render(<BoundGraph bound={{min:0,max:null,kind:'unknown',confidence:'low'}} target={.5}/>);
  expect(screen.getByText('Données manquantes')).toBeVisible();
  expect(container.querySelector('svg')).toBeNull();
});
it('conserve un vrai zéro et ne masque pas un franchissement de 0,5 % par arrondi',()=>{
  expect(noloDisplayRangeLabel({min:0,max:0,kind:'measurement',confidence:'high'})).toBe('0,00–0,00 % vol.');
  expect(noloDisplayRangeLabel({min:.29,max:.29,kind:'measurement',confidence:'high'})).toBe('0,29–0,29 % vol.');
  expect(noloDisplayRangeLabel({min:.4999,max:.5001,kind:'experimental',confidence:'low'})).toBe('0,49–0,51 % vol.');
});
