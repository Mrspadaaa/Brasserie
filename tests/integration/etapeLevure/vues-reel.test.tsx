// Les trois vues branchées sur l'API RÉELLE de d1 (src/domain/levure), sans API passée en prop : ce que le brasseur verra.
// Les gestes sont ceux des maquettes c6b, s5a et s7a ; les valeurs, celles du catalogue embarqué (fixture du dépôt, aucune donnée du brasseur).
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { yeastReferences, type YeastReference } from '../../../src/domain/yeastReferences';
import { Chercher } from '../../../src/ui/etapeLevure/Chercher';
import { Comparer } from '../../../src/ui/etapeLevure/Comparer';
import { Suggerer } from '../../../src/ui/etapeLevure/Suggerer';
import type { PropsVue } from '../../../src/ui/etapeLevure/props';

vi.setConfig({ testTimeout: 60_000 });
afterEach(cleanup);
const trouver = (re: RegExp): YeastReference => yeastReferences([], { includeCatalogue: true }).find((y) => re.test(y.name))!;
const reperes = { temperatureC: 19, abvVise: 7, ogVisee: 1.066 };

function Hote({ vue, init = [] as string[], spy = {} as Partial<PropsVue> }: { vue: 'chercher' | 'comparer' | 'suggerer'; init?: string[]; spy?: Partial<PropsVue> }) {
  const [comparees, setComparees] = useState<string[]>(init);
  const p: PropsVue = {
    base: trouver(/US-05/), reperes, comparees, onChoisir: vi.fn(), onComparees: (ids) => { spy.onComparees?.(ids); setComparees(ids); }, onVue: vi.fn(), onChercherDonnee: spy.onChercherDonnee,
  };
  return vue === 'chercher' ? <Chercher {...p} /> : vue === 'comparer' ? <Comparer {...p} /> : <Suggerer {...p} />;
}

describe('les vues sur l’API de d1', () => {
  it('Chercher : « 1056 » tapé, la carte de la levure tapée puis US-05 en tête de la liste (ordre c4)', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    await u.type(screen.getByLabelText('Nom, fabricant ou code'), '1056');
    expect(screen.getByRole('region', { name: /Levure tapée : .*1056/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proche de 1056/ })).toBeInTheDocument();
    const premier = document.querySelector('.ra-rayon-ici [data-levure]') as HTMLElement;
    expect(premier.textContent).toMatch(/US-05/);
    const titres = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent ?? '');
    expect(titres[0]).toMatch(/^Vendue CH · FR · DE/);
    expect(titres[1]).toMatch(/^Fabricant présent en Europe/);
  });

  it('Chercher : trois filtres posés (famille, °C, sans STA1) donnent un compte, et le retirer rend la liste', async () => {
    const u = userEvent.setup();
    render(<Hote vue="chercher" />);
    await u.click(screen.getByRole('button', { name: /^Filtres : bière/ }));
    const feuille = await screen.findByRole('dialog');
    expect(within(feuille).getAllByRole('button').filter((b) => b.hasAttribute('data-filtre'))).toHaveLength(18);
    await u.click(within(feuille).getByRole('button', { name: /^Famille/ }));
    await u.click(within(feuille).getAllByRole('checkbox')[0]);
    await u.click(feuille.querySelector('[data-filtre="temperature"]') as HTMLElement);
    await u.click(within(feuille).getAllByRole('button', { pressed: false }).find((b) => b.classList.contains('ra-col') && /15–18|18–22/.test(b.getAttribute('aria-label') ?? ''))!);
    await u.click(within(feuille).getByRole('button', { name: /^Sans STA1/ }));
    await u.click(within(feuille).getByRole('switch'));
    await u.click(within(feuille).getByRole('button', { name: /^Voir/ }));
    const phrase = document.querySelector('[data-booster="phrase-filtres"]') as HTMLElement;
    const n = Number((phrase.querySelector('b') as HTMLElement).textContent!.replace(/\s/g, ''));
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(1309);
    expect(phrase.querySelectorAll('.ra-mot')).toHaveLength(3);
    // les vendues ici dont la fiche ne dit rien de STA1 : en pâle, « ⌕ STA1 ? », hors du compte
    expect(screen.getAllByRole('button', { name: 'STA1 ? : chercher' }).length).toBeGreaterThan(0);
    for (const x of [...phrase.querySelectorAll('.ra-mot-x')]) await u.click(x as HTMLElement);
    expect(document.querySelector('[data-booster="phrase-filtres"]')).toBeNull();
  });

  it('Comparer : les colonnes, les effets avant la fiche, « ⌕ » appelle onChercherDonnee', async () => {
    const u = userEvent.setup();
    const onChercherDonnee = vi.fn();
    render(<Hote vue="comparer" init={[trouver(/Verdant/).id]} spy={{ onChercherDonnee }} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    const lignes = [...document.querySelectorAll('[data-ligne]')].map((l) => l.getAttribute('data-ligne'));
    expect(lignes.slice(0, 4)).toEqual(['esters', 'phenols', 'houblon', 'sucres']);
    const inconnues = screen.getAllByRole('button', { name: /chercher$/ });
    expect(inconnues.length).toBeGreaterThan(0);
    await u.click(inconnues[0]);
    expect(onChercherDonnee).toHaveBeenCalledTimes(1);
  });

  it('Suggérer : 12 axes, « − » sur Atténuation, les vendues ici d’abord, le levier de l’API', async () => {
    const u = userEvent.setup();
    render(<Hote vue="suggerer" />);
    expect(document.querySelectorAll('[data-axe]')).toHaveLength(12);
    await u.click(screen.getByRole('button', { name: /^Moins de atténuation/ }));
    const carte = document.querySelector('[data-axe="attenuation"]') as HTMLElement;
    expect(carte).toHaveClass('lvv-grand');
    expect(carte.textContent).toMatch(/empâtage/);
    const titres = [...document.querySelectorAll('.lvv-gh')].map((g) => g.textContent ?? '');
    expect(titres[0]).toMatch(/^Vendue CH · FR · DE/);
    expect(document.querySelector('.lvv-liste .lvv-srow')?.textContent).toMatch(/1084|1007/);
  });
});
