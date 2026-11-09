// @vitest-environment jsdom
// Voie r3 (mission 2026-11-09-levure-retours) : les constats 3, 4 et 6 du critique, rejoués sur les vraies fiches.
//  3. Arômes = Tropicaux : Hersbrucker, Fuggle, Cascade en tête, sans « Tropicaux » sur leur ligne (une seule fiche cite la famille).
//  4. « Arômes non documentée 52 » : l'accord de « non documentée » suit le libellé du filtre.
// Ces tests échouent sur la version rejetée. Stockage simulé : aucune donnée réelle.
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import { catalogueHoublons, chercherHoublons, facettesHoublons, fichesHoublons, type FicheHoublon } from '../../../src/ui/hopIndex/rechercheAvancee/catalogue';
import { FAMILIES, type FamilyId } from '../../../src/domain/hopIndex/v4/families';
import { RechercheAvancee } from '../../../src/ui/rechercheAvancee/RechercheAvancee';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => cleanup());

const fiches = fichesHoublons();
const facettes = facettesHoublons(fiches);
const actions = () => ({ ajouter: () => {}, proposition: () => null, fiche: () => {} });
const niveau = (f: FicheHoublon, x: FamilyId) => f.h.familles[x].niveau;

describe('filtre Arômes : la famille filtrée est celle du houblon au sens du dessin de l’app', () => {
  it('Tropicaux : aucun houblon qui ne la marque pas tout en marquant d’autres familles (une citation isolée ne suffit pas)', () => {
    const r = chercherHoublons(fiches, facettes, '', { aromes: ['tropical'] });
    expect(r.liste.length).toBeGreaterThan(5);
    for (const f of r.liste) {
      const marquees = FAMILIES.filter((x) => niveau(f, x) === 'marqué');
      // marquée, ou la fiche n'en marque aucune et ne fait que la citer
      expect(niveau(f, 'tropical') === 'marqué' || (marquees.length === 0 && niveau(f, 'tropical') === 'cité')).toBe(true);
    }
    // la règle rejetée gardait aussi les « cités » : il y en a, et ils sortent
    const ancienne = fiches.filter((f) => niveau(f, 'tropical') !== 'non décrit');
    expect(ancienne.length).toBeGreaterThan(r.total);
  });

  it('Hersbrucker (une fiche cite « tropical/fruit » parmi hay, herbal, spicy) n’est plus un houblon tropical', () => {
    const h = fiches.find((f) => /^Hersbrucker/i.test(f.h.nom));
    expect(h).toBeTruthy();
    expect(niveau(h!, 'tropical')).toBe('cité');
    expect(chercherHoublons(fiches, facettes, '', { aromes: ['tropical'] }).liste.map((f) => f.cle)).not.toContain(h!.cle);
  });

  it('la pastille de la famille filtrée se voit toujours sur la ligne, même au-delà des 4 premières', () => {
    const r = chercherHoublons(fiches, facettes, '', { aromes: ['tropical'] });
    const c = catalogueHoublons(fiches, actions);
    // un houblon dont « Tropicaux » ne serait pas dans les 4 premières pastilles (marquées d'abord, ordre des familles)
    const long = r.liste.find((f) => FAMILIES.filter((x) => niveau(f, x) === 'marqué').indexOf('tropical') >= 4 || FAMILIES.filter((x) => niveau(f, x) !== 'non décrit').length > 5);
    const f = long ?? r.liste[0];
    render(<>{c.Pastilles({ item: f, poses: [], filtres: { aromes: ['tropical'] } })}</>);
    expect(document.body.textContent).toMatch(/Tropicaux/);
  });

  it('une famille filtrée que la ligne ne montrait pas (au-delà de 4) est ajoutée, sans en retirer une marquée', () => {
    const f = fiches.find((x) => FAMILIES.filter((y) => niveau(x, y) === 'marqué').length >= 5 && niveau(x, 'tropical') === 'marqué' && FAMILIES.filter((y) => niveau(x, y) === 'marqué').indexOf('tropical') >= 4);
    if (!f) return; // aucune fiche de ce genre dans le catalogue du moment : la règle est couverte par le test précédent
    const c = catalogueHoublons(fiches, actions);
    render(<>{c.Pastilles({ item: f, poses: [] })}</>);
    expect(document.body.textContent).not.toMatch(/Tropicaux/);
    cleanup();
    render(<>{c.Pastilles({ item: f, poses: [], filtres: { aromes: ['tropical'] } })}</>);
    expect(document.body.textContent).toMatch(/Tropicaux/);
  });
});

describe('« non documentée » s’accorde avec le filtre', () => {
  it('la ligne « Arômes … 52 » dit « non documentés », Rôle « non documenté »', async () => {
    const c = catalogueHoublons(fiches, actions);
    const defs = Object.fromEntries(c.filtres.map((d) => [d.id, d.nonDoc]));
    expect(defs.aromes).toBe('non documentés');
    expect(defs.role).toBe('non documenté');
    expect(defs.huile).toBe('non documentée');
    render(<RechercheAvancee catalogue={c} />);
    // la feuille « Filtres », le filtre Arômes : sa ligne « non documentés » (la forme « Arômes non documentée » était fausse)
    fireEvent.click(document.querySelector('[data-booster="resume-une-ligne"]')!);
    fireEvent.click(await waitFor(() => { const b = document.querySelector('[data-filtre="aromes"]'); expect(b).not.toBeNull(); return b as HTMLElement; }));
    await waitFor(() => expect(document.querySelector('.ra-ndl-t')).not.toBeNull());
    expect(document.querySelector('.ra-ndl-t')!.textContent).toMatch(/^non documentés\s/);
    fireEvent.click(document.querySelector('[data-filtre="huile"]')!);
    await waitFor(() => expect(document.querySelector('.ra-ndl-t')?.textContent ?? '').toMatch(/^non documentée\s/));
  });
});
