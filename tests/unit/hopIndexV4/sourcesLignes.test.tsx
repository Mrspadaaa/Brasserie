// @vitest-environment jsdom
// s1-sources-lignes (26.10), le contrôle (L05, L13) : sur tous les écrans qui montrent les sources d'une barre de valeur, jamais
// deux traits de même plage, et chaque plage qui diffère a son trait. Ses mots : « Bien montré les différents source, comme ici
// pour lotus, c'est déjà bien fait normalement mais pas oublier. Après si plusieurs sources disent la même chose pas besoin de
// toutes les montrer ».
// Écrans de la liste (cherchés dans src/ui : « traits fins », `tb-src`, lectures de hs, alpha, beta et des compléments) :
//  - Substituer : les rangées α, β et huiles (un trait par plage) : le seul écran qui dessine un trait par source ;
//  - Comparer, feuille Valeurs : α, β et huiles en UNE barre (l'enveloppe), les références écrites dessous : une seule fois chacune ;
//  - la feuille Sources de la fiche : un texte par source, la liste exhaustive qu'il a demandée (25.10), pas des barres.
// Les attendus viennent des données (catalogue et complements.json) par un calcul indépendant du code de l'écran.
// Rouge sur HEAD : Lotus α montre deux traits identiques (Beer Maverick et Hopsteiner), Galaxy α ne montre qu'un trait sur six
// plages. Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
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

import EcranSubstituerApp from '../../../src/ui/hopIndex/substituer/EcranApp';
import EcranComparerApp from '../../../src/ui/hopIndex/comparer/EcranApp';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import { chargerComplements, complementsCharges, type ChampComplement } from '../../../src/domain/hopIndex/v4/complements';
import { hopRef } from '../../../src/ui/hopIndex/parcours/v4';

const LOTUS = 'beermaverick-lotus', CITRA = 'beermaverick-citra', GALAXY = 'beermaverick-galaxy', MAGNUM_US = 'beermaverick-magnum-us', SOUTHERN_STAR = 'beermaverick-southern-star';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); poserPorteEtape(null); poserOuvreurCouche(null); delete window.__hopSubstituerOrdre; });

const recette = (nom: string, alpha: number) => ({
  id: 'REC-S1', name: 'Pale du jeudi', style: '18B', volumeL: 20, boilMin: 60, ogTarget: 1.056, colorEbc: 20, fermentables: [],
  hops: [{ name: nom, alpha, weightG: 40, stage: 'boil', timeMin: 60 }], yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
}) as unknown as Recipe;
const poser = (r: Recipe) => poserPorteEtape({ recipe: r, boilOg: 1.056, draftId: 'REC-S1', onChange: () => {} });

// ---------- Les attendus, calculés des données sans passer par le code de l'écran ----------
type Plage = [number, number];
const arrondi = (x: number) => Number(x.toFixed(2));
const cle = (r: Plage) => `${arrondi(r[0])}|${arrondi(r[1])}`;
/** Toutes les plages valides d'une barre : le catalogue (Beer Maverick, Hopsteiner), puis les valeurs valides de complements.json
 * (dans l'enveloppe, deux bornes). La fiche Hopsteiner des compléments est celle du catalogue : pas comptée deux fois. */
function plagesDe(id: string, champ: 'alpha' | 'beta' | 'myrcene' | 'humulene' | 'caryophyllene' | 'linalol'): Plage[] {
  const c = hopRef(id)!.catalogue;
  const bm = champ === 'alpha' ? c.alpha : champ === 'beta' ? c.beta : champ === 'linalol' ? null : c.oils[champ];
  const hs = champ === 'alpha' ? c.hs?.alpha : champ === 'beta' ? c.hs?.beta : champ === 'linalol' ? c.hsLinalool?.range : null;
  const comp = complementsCharges()!.valeursDe(c.id, champ as ChampComplement)
    .filter((v) => !v.horsEnveloppe && v.min != null && v.max != null && !(hs && v.source.id === 'hopsteiner')).map((v) => [v.min!, v.max!] as Plage);
  return [...(bm ? [bm] : []), ...(hs ? [hs] : []), ...comp];
}
const distinctes = (ps: Plage[]) => [...new Set(ps.map(cle))].sort();

const HUILES: [string, 'myrcene' | 'humulene' | 'caryophyllene' | 'linalol'][] = [['Myrcène', 'myrcene'], ['Humulène', 'humulene'], ['Caryophyllène', 'caryophyllene'], ['Linalol', 'linalol']];

/** Monte Substituer sur l'original et impose ses deux remplaçants du face à face (le premier et le deuxième de la liste imposée). */
async function monterSubstituer(original: { nom: string; id: string }, faceAFace: string[]) {
  const autres = ['beermaverick-cascade', 'beermaverick-mosaic', 'beermaverick-centennial'].filter((x) => !faceAFace.includes(x) && x !== original.id);
  window.__hopSubstituerOrdre = [...faceAFace, ...autres].map((id, i) => ({ id, score: 90 - i }));
  poser(recette(original.nom, 13));
  const { container } = render(<EcranSubstituerApp hopKey={original.id} onClose={() => {}} />);
  await waitFor(() => expect(container.querySelector('[data-ecran="substituer"] [data-remplacant]')).not.toBeNull(), { timeout: 8000 });
  return container;
}

/** Ce qui ne va pas dans les rangées de mesure d'un écran Substituer monté, pour chaque houblon du face à face. */
function fautesSubstituer(container: HTMLElement, houblons: string[]): string[] {
  const fautes: string[] = [];
  const vus = new Set<string>();
  for (const id of houblons) {
    const nom = hopRef(id)!.name;
    const barres: [string, string, Plage[]][] = [
      ['alpha', `${nom} α`, plagesDe(id, 'alpha')], ['beta', `${nom} β`, plagesDe(id, 'beta')],
      ...HUILES.map(([n, k]) => [n, `${nom} ${n.toLowerCase()}`, plagesDe(id, k)] as [string, string, Plage[]]),
    ];
    for (const [mesure, lib, attendues] of barres) {
      const tb = [...container.querySelectorAll<HTMLElement>(`.pq-substituer-tb[data-mesure="${mesure}"]`)].find((e) => e.getAttribute('data-houblon') === nom);
      if (!attendues.length) { if (tb) fautes.push(`${lib} : aucune source, mais une barre est dessinée`); continue; }
      if (!tb) { fautes.push(`${lib} : la barre manque`); continue; }
      vus.add(`${id}|${mesure}`);
      const traits = [...tb.querySelectorAll<HTMLElement>('.pq-substituer-tb-src')];
      const lus = traits.map((t) => [Number(t.dataset.min), Number(t.dataset.max)] as Plage);
      const attendu = distinctes(attendues);
      // 1. Jamais deux traits de même plage : même position et même largeur à l'écran, ou mêmes bornes arrondies.
      const positions = traits.map((t) => `${t.style.left}|${t.style.width}`);
      if (new Set(positions).size !== positions.length) fautes.push(`${lib} : deux traits de même plage (${positions.length} traits, ${new Set(positions).size} positions)`);
      if (traits.length !== attendu.length) fautes.push(`${lib} : ${traits.length} traits pour ${attendu.length} plages distinctes (${attendues.length} sources)`);
      // 2. Chaque plage distincte a son trait.
      const lues = lus.map(cle).sort();
      if (JSON.stringify(lues) !== JSON.stringify(attendu)) fautes.push(`${lib} : traits ${lues.join(' ; ')} au lieu de ${attendu.join(' ; ')}`);
      // 3. Rien n'est caché pour gagner de la place : aucun « +n », les noms de toutes les sources au survol.
      if (/\+\s?\d/.test(tb.parentElement?.textContent ?? '')) fautes.push(`${lib} : un « +n »`);
      for (const t of traits) if (!t.getAttribute('title') || !t.dataset.sources) fautes.push(`${lib} : un trait sans le nom de ses sources`);
    }
  }
  if (!vus.size) fautes.push('aucune barre lue');
  return fautes;
}

describe('Substituer : un trait par plage qui diffère (α, β, huiles)', () => {
  it('Lotus et Citra au face à face, Galaxy à remplacer : aucun trait en double, aucune plage sans trait', async () => {
    await chargerComplements();
    const container = await monterSubstituer({ nom: 'Galaxy', id: GALAXY }, [LOTUS, CITRA]);
    expect(fautesSubstituer(container, [GALAXY, LOTUS, CITRA])).toEqual([]);
  }, 30000);

  it('Magnum (US) et Southern Star au face à face, Nugget à remplacer', async () => {
    await chargerComplements();
    const container = await monterSubstituer({ nom: 'Nugget', id: 'beermaverick-nugget' }, [MAGNUM_US, SOUTHERN_STAR]);
    expect(fautesSubstituer(container, ['beermaverick-nugget', MAGNUM_US, SOUTHERN_STAR])).toEqual([]);
  }, 30000);

  it('Lotus : la rangée β garde ses deux plages (5–6 et 5,5–6), la rangée α n\'a qu\'un trait', async () => {
    await chargerComplements();
    const container = await monterSubstituer({ nom: 'Nugget', id: 'beermaverick-nugget' }, [LOTUS, CITRA]);
    const tb = (m: string) => [...container.querySelectorAll<HTMLElement>(`.pq-substituer-tb[data-mesure="${m}"]`)].find((e) => e.getAttribute('data-houblon') === 'Lotus')!;
    expect([...tb('beta').querySelectorAll<HTMLElement>('.pq-substituer-tb-src')].map((t) => [t.dataset.min, t.dataset.max])).toEqual([['5', '6'], ['5.5', '6']]);
    expect([...tb('alpha').querySelectorAll('.pq-substituer-tb-src')]).toHaveLength(1);
    // Le survol du trait de Lotus 13–17 nomme les trois sources qui s'accordent.
    expect(tb('alpha').querySelector('.pq-substituer-tb-src')!.getAttribute('title')).toBe('Beer Maverick, Hopsteiner, Charles Faram : 13–17');
  }, 30000);
});

describe('Comparer, feuille Valeurs : une barre par houblon, les références de toutes ses sources, une fois chacune', () => {
  it('α et β de Lotus, Citra et Galaxy : une barre, l\'enveloppe de toutes les sources, aucune référence en double', async () => {
    await chargerComplements();
    poser(recette('Nugget', 13));
    const { container } = render(<EcranComparerApp houblons={[LOTUS, CITRA, GALAXY]} onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-dock="valeurs"]')).not.toBeNull(), { timeout: 8000 });
    fireEvent.click(container.querySelector('[data-dock="valeurs"]')!);
    await waitFor(() => expect(document.querySelector('.pq-comparer-vraies')).not.toBeNull());
    const lignes = [...document.querySelectorAll<HTMLElement>('.pq-comparer-vraies .pq-comparer-vg')];
    const fautes: string[] = [];
    // Les deux premières rangées de valeurs : α puis β ; trois colonnes, dans l'ordre des houblons.
    (['alpha', 'beta'] as const).forEach((champ, i) => {
      const cellules = [...lignes[i].querySelectorAll<HTMLElement>('.pq-comparer-vc')];
      if (cellules.length !== 3) fautes.push(`${champ} : ${cellules.length} colonnes`);
      [LOTUS, CITRA, GALAXY].forEach((id, j) => {
        const c = cellules[j];
        const barres = c.querySelectorAll('.pq-comparer-vb > i:not(.pq-comparer-vlot)');
        if (barres.length !== 1) fautes.push(`${champ} ${id} : ${barres.length} barres`);
        const refs = (c.querySelector('.pq-comparer-vr')?.textContent ?? '').replace(/ · .*/, '').split(' ').filter(Boolean);
        if (new Set(refs).size !== refs.length) fautes.push(`${champ} ${id} : une référence en double (${refs.join(' ')})`);
        const ps = plagesDe(id, champ);
        const lo = Math.min(...ps.map((p) => p[0])), hi = Math.max(...ps.map((p) => p[1]));
        const texte = c.querySelector('.pq-comparer-vv')?.textContent ?? '';
        const nombres = (texte.match(/\d+(?:,\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.')));
        if (nombres[0] !== arrondi(lo) || nombres[1] !== arrondi(hi)) fautes.push(`${champ} ${id} : « ${texte} » au lieu de ${lo}–${hi}`);
        if (champ === 'alpha' && id === GALAXY && !refs.includes('BH')) fautes.push(`${champ} ${id} : BarthHaas manque (${refs.join(' ')})`);
      });
    });
    expect(fautes).toEqual([]);
  }, 30000);
});
