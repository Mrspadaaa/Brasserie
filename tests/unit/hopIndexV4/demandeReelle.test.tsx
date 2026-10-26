// @vitest-environment jsdom
// Voie a2-demande-reelle (D84, D158) : jamais une demande inventée. La demande de test S1 de la maquette (18.10 : « plus floral,
// moins résineux ») s'affichait comme SA demande dans Comparer, Dryhopper, Levure et la puce « + floral » de Ma bière, sur toute
// recette (sa capture de Dryhopper : « floral ?, baies ?, résineux ? »). Règle, dans cet ordre : sa visée ; sinon sa dégustation ;
// sinon les familles attendues du style de la recette (« attendu en <code> »), sans « ta demande » ni « ta dégustation ».
// Recette de style 21C, sans visée ni dégustation, puis avec une visée posée. Stockage simulé : aucune donnée réelle, aucun Gemini.
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EcranComparerApp from '../../../src/ui/hopIndex/comparer/EcranApp';
import EcranTimingApp from '../../../src/ui/hopIndex/dryhopper/EcranApp';
import EtapeHoublons from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { configurerDonnees } from '../../../src/ui/hopIndex/parcours/donnees';
import { style } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { COURT } from '../../../src/ui/hopIndex/familyTokens';
import { critereDe, demandeDe, demandeDeDegustation, famillesDeLaDemande } from '../../../src/ui/hopIndex/comparer/demande';
import { tastingFrom } from '../../../src/domain/hopIndex/v4';

const RECETTE = {
  id: 'REC-A2', name: 'Hazy du jeudi', style: '21C', volumeL: 20, boilMin: 60, ogTarget: 1.058, colorEbc: 8,
  fermentables: [],
  hops: [
    { name: 'Nugget', alpha: 13, weightG: 20, stage: 'boil', timeMin: 60 },
    { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 },
  ],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const HOUBLONS = ['beermaverick-cascade', 'beermaverick-idaho-7', 'beermaverick-galaxy'];
const sc = style('21C');
const ATTENDUES = sc.order.filter((f) => sc.families[f].status === 'attendue');

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); poserVisee(null); configurerDonnees(); vi.unstubAllEnvs(); });

const poser = () => poserPorteEtape({ recipe: RECETTE, boilOg: 1.058, draftId: 'REC-A2', onChange: () => {} });
/** Ce que l'écran dit de sa demande, sans le nom d'une famille seul (les 12 familles s'affichent toujours). */
const DEMANDE_DITE = /ta demande|ta dégustation|plus floral|moins résineux|plus de floral|trop de résineux|trop résineuse/i;

describe('le style 21C a des familles attendues (la base du test)', () => {
  it('au moins une famille attendue, et ni floral ni résineux ne sont par hasard les seules', () => {
    expect(ATTENDUES.length).toBeGreaterThan(0);
    expect(ATTENDUES.join()).not.toBe('floral,resin');
  });
});

describe('la demande est lue, jamais inventée (module)', () => {
  const vide = { sc, visee: {}, points: () => null, demandeDegustee: {}, tasting: null };
  it('rien : les familles attendues du style, dites « attendu en 21C », sans flèche ni objectif', () => {
    const d = demandeDe(vide);
    expect(d.origine).toBe('style');
    expect(d.mot).toBe('attendu en 21C');
    expect(d.voulue).toBe(false);
    expect(d.plus).toEqual(ATTENDUES);
    expect(d.moins).toEqual([]);
    expect(d.visees).toEqual({});
  });
  it('une visée posée : « ta demande », dans le sens de la visée', () => {
    const d = demandeDe({ ...vide, visee: { berries: 2.5, resin: 0 }, points: (f) => (f === 'resin' ? 40 : null) });
    expect(d.origine).toBe('visee');
    expect(d.mot).toBe('ta demande');
    expect(d.plus).toEqual(['berries']);
    expect(d.moins).toEqual(['resin']);
  });
  it('une dégustation seule : « ta dégustation » (trop au-dessus de la bande : moins ; attendue perçue faible : plus)', () => {
    // Un style fictif dont la bande attendue commence haut (en 21C les attendues vont de 0 à 100 : rien n'y est « trop faible »).
    const fam = (status: string, band: [number, number]) => ({ status, band });
    const fictif = { code: 'XX', documented: true, order: ['floral', 'resin', 'spice'],
      families: { floral: fam('attendue', [40, 80]), resin: fam('neutre', [0, 30]), spice: fam('neutre', [0, 30]) } } as unknown as typeof sc;
    const t = tastingFrom({ floral: 'faible', resin: 'marqué', spice: 'faible' }, { origin: 'test', date: '2026-10-01', quote: null, source: 'test' });
    const lue = demandeDeDegustation(t, fictif);
    expect(lue.floral).toBe(1);   // attendue, perçue faible : sous sa bande
    expect(lue.resin).toBe(-1);   // neutre, perçue marquée : au-dessus de sa bande
    expect(lue.spice).toBeUndefined(); // faible (0 à 33) recouvre sa bande 0–30 : plage incertaine, rien n'est dit
    const d = demandeDe({ ...vide, sc: fictif, tasting: t });
    expect(d.origine).toBe('degustation');
    expect(d.mot).toBe('ta dégustation');
    expect(d.plus).toEqual(['floral']);
    expect(d.moins).toEqual(['resin']);
    // sur 21C réel, une famille neutre perçue marquée est « trop »
    expect(demandeDeDegustation(tastingFrom({ floral: 'marqué' }, { origin: 'test', date: '2026-10-01', quote: null, source: 'test' }), sc).floral).toBe(-1);
  });
  it('la visée passe avant la dégustation ; une dégustation muette ne demande rien', () => {
    const t = tastingFrom({}, { origin: 'test', date: '2026-10-01', quote: null, source: 'test' });
    expect(demandeDe({ ...vide, tasting: t }).origine).toBe('style');
    expect(demandeDe({ ...vide, tasting: t, visee: { citrus: 1.5 } }).origine).toBe('visee');
  });
  it('les familles montrées d\'abord : la demande, puis les attendues, 3 au plus, sans doublon', () => {
    const f = famillesDeLaDemande(demandeDe({ ...vide, visee: { berries: 2.5 } }), sc, 3);
    expect(f[0]).toBe('berries');
    expect(new Set(f).size).toBe(f.length);
    expect(f.length).toBe(3);
  });
});

describe('sans visée ni dégustation (recette 21C) : les écrans disent le style, jamais S1', () => {
  it('Comparer : « Ta bière » dit « attendu en 21C », ni flèche ni « ta demande » ; le critère part d\'une famille attendue', async () => {
    poser();
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="comparer"]')).not.toBeNull());
    const ta = container.querySelector('[data-element~="r6a-ta-stout"]')!;
    expect(ta.getAttribute('data-demande')).toBe('style');
    expect(ta.getAttribute('aria-label')).toMatch(/attendu en 21C/);
    expect(ta.getAttribute('aria-label')).not.toMatch(DEMANDE_DITE);
    expect(container.querySelector('.pq-comparer-dem')).toBeNull();
    expect(container.querySelector('[data-element~="r6a-ecarts"]')).toBeNull();
    const pastille = container.querySelector('[data-etat="etat-comp-critere"]')!;
    expect(pastille.getAttribute('aria-label')).toContain(critereDe(ATTENDUES[0], 1).nom);
    expect(container.textContent).not.toMatch(DEMANDE_DITE);
    // les familles attendues sont en gras (data-attendu), pas les autres
    const gras = [...container.querySelectorAll('.pq-comparer-rn[data-attendu]')].length;
    expect(gras).toBeGreaterThan(0);
    expect(gras).toBeLessThanOrEqual(ATTENDUES.length);
  });

  it('Dryhopper : « Face à ta bière », le bandeau et les courbes suivent les familles attendues, pas floral · baies · résineux', async () => {
    poser();
    const { container } = render(<EcranTimingApp additionId="a2" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="dryhopper"]')).not.toBeNull());
    const attendu = famillesDeLaDemande(demandeDe({ sc, visee: {}, points: () => null, demandeDegustee: {}, tasting: null }), sc, 3);
    const bandeau = [...container.querySelectorAll('[data-bandeau]')].map((e) => e.getAttribute('data-bandeau'));
    expect(bandeau).toEqual(attendu);
    const courbes = [...container.querySelectorAll('[data-courbe]')].map((e) => e.getAttribute('data-courbe')).sort();
    expect(courbes).toEqual([...attendu].sort());
    expect(container.querySelector('.pq-dry-fl')?.getAttribute('data-famille')).toBe(attendu[0]);
    expect(container.querySelector('[data-role="critere"]')?.getAttribute('title') ?? '').not.toMatch(/ta demande|plus floral, moins résineux/);
    expect(container.textContent).not.toMatch(DEMANDE_DITE);
    // les 12 barres : l'ordre du style (attendues d'abord)
    expect([...container.querySelectorAll('[data-barre]')].map((e) => e.getAttribute('data-barre'))).toEqual(sc.order);
  });

  it('Levure : la grille montre les familles attendues, pas floral · agrumes · résineux', async () => {
    poser();
    const { container } = render(<EcranTimingApp additionId="a2" step="yeast" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="levure"]')).not.toBeNull());
    const grille = container.querySelector('[data-role="ajout"]')!;
    const attendu = famillesDeLaDemande(demandeDe({ sc, visee: {}, points: () => null, demandeDegustee: {}, tasting: null }), sc, 3);
    for (const f of attendu) expect(grille.textContent).toContain(COURT[f]);
    for (const f of ['floral', 'citrus', 'resin'] as const) if (!attendu.includes(f)) expect(grille.textContent).not.toContain(COURT[f]);
    expect(container.textContent).not.toMatch(DEMANDE_DITE);
  });

  it('Ma bière : pas de puce « + floral » (ni aucune puce de demande) ; « Ouvrir l\'analyse » caché en production', async () => {
    vi.stubEnv('DEV', false);
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.058} draftId="REC-A2" onChange={() => {}} onAller={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="ma-biere"]')).not.toBeNull());
    expect([...container.querySelectorAll('[data-role^="pont-"]')].map((e) => e.textContent?.trim()).filter((t) => /^[+−] /.test(t ?? ''))).toEqual([]);
    expect(container.querySelector('[data-role="pont-floral"]')).toBeNull();
    expect(container.querySelector('[data-role="pont-biere"]')).toBeNull();
    expect(container.textContent).not.toMatch(/Ouvrir l.analyse/);
  });

  it('Ma bière en développement : l\'entrée de l\'analyse reste (pour la rebrancher)', async () => {
    vi.stubEnv('DEV', true);
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.058} draftId="REC-A2" onChange={() => {}} onAller={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="ma-biere"]')).not.toBeNull());
    expect(container.textContent).toMatch(/Ouvrir l.analyse/);
  });
});

describe('avec une visée posée : les écrans la prennent, avec leurs libellés (« ta demande »)', () => {
  it('Comparer : « Ta bière » dit « plus de baies (ta demande) », la flèche monte, le critère part de baies', async () => {
    poserVisee({ berries: 2.5 });
    poser();
    const { container } = render(<EcranComparerApp houblons={HOUBLONS} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="comparer"]')).not.toBeNull());
    const ta = container.querySelector('[data-element~="r6a-ta-stout"]')!;
    expect(ta.getAttribute('data-demande')).toBe('visee');
    expect(ta.getAttribute('aria-label')).toMatch(/plus de baies \(ta demande\)/);
    expect(container.querySelector('[data-famille-ligne="berries"] .pq-comparer-dem [aria-label="ta demande : plus de baies"]')).not.toBeNull();
    expect(container.querySelector('[data-etat="etat-comp-critere"]')!.getAttribute('aria-label')).toContain('baies');
  });

  it('Dryhopper : « Face à ta bière » prend la famille visée', async () => {
    poserVisee({ berries: 2.5 });
    poser();
    const { container } = render(<EcranTimingApp additionId="a2" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="dryhopper"]')).not.toBeNull());
    expect(container.querySelector('.pq-dry-fl')?.getAttribute('data-famille')).toBe('berries');
    expect([...container.querySelectorAll('[data-bandeau]')][0].getAttribute('data-bandeau')).toBe('berries');
  });

  it('Levure : la grille commence par la famille visée', async () => {
    poserVisee({ berries: 2.5 });
    poser();
    const { container } = render(<EcranTimingApp additionId="a2" step="yeast" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="levure"]')).not.toBeNull());
    expect(container.querySelector('[data-role="ajout"]')!.textContent).toContain(COURT.berries);
  });

  it('Ma bière : la puce vient de la visée (« + baies »), et suit quand la visée change', async () => {
    vi.stubEnv('DEV', false);
    poserVisee({ berries: 2.5 });
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.058} draftId="REC-A2" onChange={() => {}} onAller={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="ma-biere"]')).not.toBeNull());
    expect(container.querySelector('[data-role="pont-berries"]')?.textContent).toMatch(/^\+ baies/);
    act(() => { poserVisee(null); });
    await waitFor(() => expect(container.querySelector('[data-role="pont-berries"]')).toBeNull());
  });
});
