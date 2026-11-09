// Les corrections du verdict du port (critique/VERDICT-port.md), chacune d'abord comme un test qui échoue : C1 (repère de l'alcool),
// M1 (la levure tapée dans « Ajouter à Comparer »), S1 (la référence en tête de Suggérer au repos), S4 (référence muette),
// S3 (visée hors plage), S5 (pas de doublon du levier), C5 (index sans trou). API simulée (vues-simule.ts) sauf C1 (recette de démonstration).
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { abvViseDe } from '../../../src/ui/etapeLevure/EtapeLevure';
import { Chercher } from '../../../src/ui/etapeLevure/Chercher';
import { Comparer } from '../../../src/ui/etapeLevure/Comparer';
import { Suggerer } from '../../../src/ui/etapeLevure/Suggerer';
import type { PropsVue } from '../../../src/ui/etapeLevure/props';
import { apiSimulee, levureDe, reperes } from './vues-simule';

vi.setConfig({ testTimeout: 60_000 });
afterEach(cleanup);

function Hote({ vue, init = [] as string[], rep = reperes }: { vue: 'chercher' | 'comparer' | 'suggerer'; init?: string[]; rep?: PropsVue['reperes'] }) {
  const [comparees, setComparees] = useState<string[]>(init);
  const p: PropsVue & { api: typeof apiSimulee } = { base: levureDe('us05'), reperes: rep, comparees, api: apiSimulee, onChoisir: vi.fn(), onComparees: setComparees, onVue: vi.fn() };
  return vue === 'chercher' ? <Chercher {...p} /> : vue === 'comparer' ? <Comparer {...p} /> : <Suggerer {...p} />;
}

describe('C1 : le repère de l’alcool vient de la recette', () => {
  it('sans cible saisie, l’alcool visé est celui que la recette annonce (OG et atténuation de la levure), pas rien', () => {
    const recette = recetteApercuEtapeLevure();
    const abv = abvViseDe({ ...recette, abvTarget: null }, yeastReferences([], { includeCatalogue: true }));
    expect(abv).toBeGreaterThan(6.5);
    expect(abv).toBeLessThan(7.6);
  });
  it('une cible saisie prime', () => {
    expect(abvViseDe({ ...recetteApercuEtapeLevure(), abvTarget: 5.2 }, [])).toBe(5.2);
  });
  it('avec le repère : le résumé, le ○ de l’index, le trait de l’histogramme et la bascule « ne garder que ≥ 7 % »', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    expect(screen.getByRole('button', { name: /Filtres : .*7 %/ })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /^Tolérance/ }));
    const f = await screen.findByRole('dialog');
    expect(f.querySelector('[data-filtre="tolerance"] .lvv-irp')).not.toBeNull();
    expect(f.querySelector('.lvv-reperl')).not.toBeNull();
    expect(within(f).getByRole('switch', { name: /ne garder que ≥ 7/ })).toBeInTheDocument();
  });
});

describe('M1 : la levure tapée en tête de « Ajouter à Comparer »', () => {
  it('taper « Verdant » rend Verdant, tapée par l’API, première', async () => {
    const u = userEvent.setup();
    render(<Hote vue="comparer" init={['pomona']} />);
    await u.click(screen.getByRole('button', { name: 'Ajouter une levure à comparer' }));
    const f = await screen.findByRole('dialog');
    await u.type(within(f).getByLabelText('Nom, fabricant ou code'), 'Verdant');
    const boutons = within(f).getAllByRole('button').filter((b) => b.closest('li'));
    expect(boutons[0].textContent).toMatch(/Verdant/);
  });
});

describe('S1 à S6 : Suggérer', () => {
  it('S1 : au repos, la liste s’ouvre sur « US-05 · ta levure · la référence », ⊕ grisé, puis les autres', () => {
    render(<Hote vue="suggerer" />);
    const premiere = document.querySelector('.lvv-srow') as HTMLElement;
    expect(premiere.textContent).toMatch(/US-05/);
    expect(premiere.textContent).toMatch(/ta levure/);
    expect(premiere.textContent).toMatch(/la référence/);
    expect(premiere.querySelector('.lvv-plusr')).toBeDisabled();
    expect((document.querySelectorAll('.lvv-srow')[1] as HTMLElement).textContent).not.toMatch(/ta levure/);
  });
  it('S4 : référence muette sur l’axe : les vendues ici documentées restent, la référence montre ses « ⌕ ? »', async () => {
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    await u.click(screen.getByRole('button', { name: /^Plus de thiols/ }));
    // US-05 est muette sur les thiols ; Verdant (thiols élevés, ici) est documentée : elle reste proposée
    expect(document.querySelector('[data-levure="verdant"]')).not.toBeNull();
    const base = document.querySelector('[data-levure="us05"]') as HTMLElement;
    expect(base).not.toBeNull();
    expect(base.textContent).toMatch(/ta levure/);
    expect(within(base).getByRole('button', { name: /thiols \? : chercher/ })).toBeInTheDocument();
  });
  it('S3 : une levure dont la plage ne couvre pas la conduite le dit en rouge (« 19 hors plage »)', async () => {
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    await u.click(screen.getByRole('button', { name: /^Plus de tolérance/ }));
    const ligne = document.querySelector('[data-levure="nova"]') as HTMLElement; // NovaLager 10–15 °C
    expect(ligne).not.toBeNull();
    expect(ligne.querySelector('.lvv-hors')?.textContent).toMatch(/19 hors plage/);
  });
  it('S5 : le levier sans preuve chiffrée ne double pas l’en-tête', async () => {
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    await u.click(screen.getByRole('button', { name: /^Moins de atténuation/ }));
    expect(document.querySelector('.lvv-levier')).toBeNull();
    expect(document.querySelector('[data-axe="attenuation"]')?.textContent).toMatch(/levier : empâtage/);
  });
  it('S6 : l’en-tête dit le volume : « 30 L · 19 °C »', () => {
    render(<Hote vue="suggerer" rep={{ ...reperes, volumeL: 30 }} />);
    expect(document.querySelector('.lvv-dep .lvv-ctx')?.textContent).toMatch(/30 L.*19 °C/);
  });
});

describe('C5 : l’index n’a pas de ligne muette', () => {
  it('chaque filtre sans compte porte « — » ou « estimé »', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    await u.click(screen.getByRole('button', { name: /^Filtres : / }));
    const f = await screen.findByRole('dialog');
    for (const b of f.querySelectorAll<HTMLElement>('[data-filtre]')) {
      if (b.dataset.filtre === 'boisson') continue;
      expect(b.querySelector('em'), b.dataset.filtre).not.toBeNull();
    }
  });
});
