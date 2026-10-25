// @vitest-environment jsdom
// Voie t12e-fiche-details (#184), points 1 et 2 : « autres N % » expliqué pour ce houblon (une ligne de calcul et la liste de ses
// mots, du même calcul que le chiffre) ; la feuille « Sources › » : la page Beer Maverick d'abord (champ `url` du catalogue, dans
// un nouvel onglet), les fiches fournisseurs ensuite, puis tout ce que le catalogue dit du houblon, chaque champ présent affiché.
// Données : les fixtures du moteur (proto-data.json) ; aucune donnée réelle, aucun appel Gemini.
import { cleanup, fireEvent, render } from '@testing-library/react';
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

import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { houblon } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { fiches } from '../../../src/ui/hopIndex/parcours/v4';
import { autresDe, compterAutres, ligneAutres, type MotsFiches } from '../../../src/ui/hopIndex/fiche/autres';
import { Autres } from '../../../src/ui/hopIndex/maBiere/briques';
import { liensDe, sourcesFiche } from '../../../src/ui/hopIndex/fiche/sources';
import { ContenuSources } from '../../../src/ui/hopIndex/fiche/SourcesFiche';
import { plage } from '../../../src/ui/hopIndex/nombres';

const RECETTE = {
  id: 'REC-T12E', name: 'Pale', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const recette = () => toHopRecipe(RECETTE, { boilOg: 1.066 }).recette;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

const LOTUS = 'beermaverick-lotus';

describe('« autres 44 % » : le chiffre et la liste viennent du même calcul', () => {
  it('Lotus : 44 % = 4 de ses 9 mots distincts, vanille (Beer Maverick) et vanilla (Hopsteiner) comptés une fois', () => {
    const h = houblon(LOTUS);
    const a = autresDe(LOTUS)!;
    expect(h.partSansFamille).toBe(0.44);
    expect(a.part).toBe(0.44);
    expect([a.n, a.total]).toEqual([4, 9]);
    expect(ligneAutres(a)).toBe('4 de ses 9 mots n’entrent dans aucune des 12 familles');
    // Les mots sont traduits (« vanilla » de Hopsteiner devient « vanille ») : un mot, deux fiches qui le disent.
    expect(a.mots.map((m) => m.mot)).toEqual(['vanille', 'crème', 'fruité', 'doux']);
    expect(a.mots.find((m) => m.mot === 'vanille')!.fiches).toEqual(['Beer Maverick', 'Hopsteiner']);
  });

  it('carte, fiche et « ? » : le même nombre et la même liste (une seule source de calcul)', () => {
    const h = houblon(LOTUS);
    const a = autresDe(LOTUS)!;
    expect(h.motsSansFamille).toEqual(a.mots.map((m) => m.mot));
    expect(h.motsSansFamille).toHaveLength(a.n);
    expect(new Set(h.motsSansFamille).size).toBe(h.motsSansFamille.length);
    const { container } = render(<div><Autres h={h} /></div>);
    fireEvent.click(container.querySelector('[data-role="autres-bouton"]')!);
    expect(container.querySelector('[data-role="autres-bouton"]')!.textContent).toContain('autres 44 %');
    expect([...container.querySelectorAll('li')].map((l) => l.getAttribute('data-mot'))).toEqual(h.motsSansFamille);
    expect(container.querySelector('[data-role="autres-explication"]')!.getAttribute('data-n')).toBe(String(a.n));
  });

  it('un mot hors familles cité par deux fiches (vanille / vanilla) est compté une fois, au numérateur et au dénominateur', () => {
    const trad = (m: string) => ({ vanilla: 'vanille' } as Record<string, string>)[m.toLowerCase()] ?? m.toLowerCase();
    const w: MotsFiches = {
      mots: { citrus: [{ source: 'BM', mots: ['orange'] }, { source: 'Hopsteiner', mots: ['Orange', 'citron'] }], floral: [{ source: 'BM', mots: ['floral'] }] },
      sansFamille: [{ source: 'BM', mot: 'vanille' }, { source: 'Hopsteiner', mot: 'vanilla' }, { source: 'BM', mot: 'crème' }],
    };
    const a = compterAutres(w, trad, ['citrus', 'floral'])!;
    expect(a.mots.map((m) => m.mot)).toEqual(['vanille', 'crème']);
    expect(a.mots[0].fiches).toEqual(['BM', 'Hopsteiner']);
    // 3 mots rattachés distincts (orange, citron, floral) + 2 sans famille distincts = 5 ; 2 / 5 = 40 %.
    expect([a.n, a.total, a.part]).toEqual([2, 5, 0.4]);
    // Un mot sans famille chez une fiche, rattaché chez l'autre une fois traduit : rattaché, compté une fois.
    const b = compterAutres({ mots: { citrus: [{ source: 'BM', mots: ['orange'] }] }, sansFamille: [{ source: 'Hopsteiner', mot: 'Orange' }, { source: 'Hopsteiner', mot: 'doux' }] }, trad, ['citrus'])!;
    expect([b.n, b.total]).toEqual([1, 2]);
    // Rien du tout : inconnu, jamais 0.
    expect(compterAutres({ mots: {}, sansFamille: [] }, trad, [])).toBeNull();
  });

  it('pour tout le catalogue : même part que la carte, et le nombre de mots listés vaut le numérateur', () => {
    let n = 0;
    for (const v of fiches()) {
      const h = houblon(v.id);
      const a = autresDe(v.id);
      if (h.partSansFamille == null) { expect(a, v.id).toBeNull(); continue; }
      n += 1;
      expect(a, v.id).not.toBeNull();
      expect(a!.part, v.id).toBe(h.partSansFamille);
      expect(a!.mots, v.id).toHaveLength(a!.n);
      expect(h.motsSansFamille, v.id).toEqual(a!.mots.map((m) => m.mot));
      expect(new Set(a!.mots.map((m) => m.mot)).size, v.id).toBe(a!.n);
      expect(Math.round(a!.n / a!.total * 100) / 100, v.id).toBe(h.partSansFamille);
    }
    expect(n).toBeGreaterThan(300);
  });

  it('un houblon hors des fiches du moteur : ni chiffre ni liste (jamais 0)', () => {
    expect(autresDe('inconnu:hallertau')).toBeNull();
  });

  it('au toucher de la mention, la ligne de calcul et la liste s’ouvrent ; un second toucher les referme', () => {
    const { container } = render(<div><Autres h={houblon(LOTUS)} /></div>);
    const b = container.querySelector<HTMLButtonElement>('[data-role="autres-bouton"]')!;
    expect(b.textContent).toContain('autres 44 %');
    expect(container.querySelector('[data-role="autres-explication"]')).toBeNull();
    fireEvent.click(b);
    const e = container.querySelector('[data-role="autres-explication"]')!;
    expect(e.querySelector('[data-role="autres-calcul"]')!.textContent).toBe('4 de ses 9 mots n’entrent dans aucune des 12 familles.');
    expect([...e.querySelectorAll('li')].map((l) => l.getAttribute('data-mot'))).toEqual(['vanille', 'crème', 'fruité', 'doux']);
    expect(b.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(b);
    expect(container.querySelector('[data-role="autres-explication"]')).toBeNull();
  });
});

describe('Sources › : les liens d’abord, puis tout ce que le catalogue dit du houblon', () => {
  const rendre = (cle: string) => {
    const s = sourcesFiche(cle)!;
    return { s, ...render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} />) };
  };

  it('le premier lien est la page Beer Maverick du houblon (champ url), dans un nouvel onglet', () => {
    for (const cle of [LOTUS, 'beermaverick-nugget', 'beermaverick-citra', 'beermaverick-nelson-sauvin', 'beermaverick-citra:cryo']) {
      const v = fiches().find((x) => x.id === cle.split(':')[0])!;
      const { container, unmount } = rendre(cle);
      const liens = container.querySelectorAll<HTMLAnchorElement>('[data-role="sources-liens"] a');
      expect(liens[0].getAttribute('href'), cle).toBe(v.url);
      expect(liens[0].getAttribute('data-role')).toBe('lien-beer-maverick');
      for (const a of liens) { expect(a.getAttribute('target')).toBe('_blank'); expect(a.getAttribute('rel')).toBe('noopener'); }
      // Les liens précèdent toute autre information : la liste est le premier bloc.
      expect(container.querySelector('[data-role="sources-feuille"]')!.firstElementChild!.getAttribute('data-role')).toBe('sources-liens');
      unmount();
    }
  });

  it('chaque fiche fournisseur qui a une adresse a son lien ; une source sans adresse a son nom et sa date, sans lien', () => {
    const { container } = rendre('beermaverick-nugget');
    const hrefs = [...container.querySelectorAll<HTMLAnchorElement>('[data-role="sources-liens"] a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://www.yakimachief.com/nugget.html');
    expect(hrefs).toContain('https://shop.hopsteiner.com/43209089.html');
    expect(new Set(hrefs).size).toBe(hrefs.length);
    // Un catalogue où une source n'a pas d'adresse : nom complet + date, jamais d'adresse inventée.
    const v = fiches().find((x) => x.id === LOTUS)!;
    const l = liensDe({ ...v, descriptions: [...v.descriptions, { text: 'Descripteurs : zeste.', context: 'rawHop', source: { title: 'Carnet de dégustation', author: 'Brasserie', year: 2024, kind: 'community', reference: 'carnet interne', locator: '' } }] } as never);
    const sans = l.find((x) => x.nom.includes('Carnet de dégustation'))!;
    expect(sans.url).toBeNull();
    expect(sans.annee).toBe(2024);
    expect(l.indexOf(sans)).toBe(l.length - 1);
    expect(l[0].url).toBe(v.url);
  });

  it('tous les houblons du catalogue : Beer Maverick en tête, sur son url', () => {
    for (const v of fiches()) {
      const l = liensDe(v);
      expect(l[0].auteur, v.id).toBe('Beer Maverick');
      expect(l[0].url, v.id).toBe(v.url);
    }
  });

  it('sur un houblon du catalogue, chaque champ présent est affiché (valeur, plage, source), l’inconnu s’écrit « ? »', () => {
    for (const cle of [LOTUS, 'beermaverick-nugget', 'beermaverick-citra', 'beermaverick-nelson-sauvin']) {
      const v = fiches().find((x) => x.id === cle)!;
      const { container, unmount } = rendre(cle);
      const t = container.textContent!.replace(/\s+/g, ' ');
      const a = (txt: string) => expect(t, `${cle} : ${txt}`).toContain(txt);
      a(v.name);
      for (const al of v.aliases) a(al);
      if (v.origin) a(v.origin);
      if (v.alpha) a(`${plage(v.alpha[0], v.alpha[1], 1)} %`);
      if (v.beta) a(`${plage(v.beta[0], v.beta[1], 1)} %`);
      if (v.oil) a(`${plage(v.oil[0], v.oil[1], 1)} mL/100 g`);
      if (v.hs?.alpha) a(`${plage(v.hs.alpha[0], v.hs.alpha[1], 1)} %`);
      if (v.hs?.beta) a(`${plage(v.hs.beta[0], v.hs.beta[1], 1)} %`);
      if (v.hs?.totalOil) a(`${plage(v.hs.totalOil[0], v.hs.totalOil[1], 1)} mL/100 g`);
      for (const k of ['myrcene', 'humulene', 'caryophyllene'] as const) { const r = v.oils[k]; if (r) a(`${plage(r[0], r[1], 1)} % de l’huile`); }
      if (v.hsLinalool) a(`${plage(v.hsLinalool.range[0], v.hsLinalool.range[1], 1)} % de l’huile`);
      if (v.hsThiol) a(`classe ${v.hsThiol.class}`);
      for (const tag of v.tagsFr) a(tag);
      for (const u of v.usage ?? []) { for (const st of u.styles) a(st); if (u.source) a(u.source); }
      if (v.hopsteinerId) a(v.hopsteinerId);
      a(v.id);
      // Les champs que le catalogue ne porte pas : « ? », jamais 0.
      const ligneDe = (nom: string) => [...container.querySelectorAll('.pq-fiche-rangee')].find((r) => r.textContent!.startsWith(nom))!;
      // d2-import-bm : ce que Beer Maverick publie s'affiche avec sa valeur ; ce qu'il ne publie pas reste « ? ».
      if (v.cohumulone) a(`${plage(v.cohumulone[0], v.cohumulone[1], 1)} % des α`);
      else expect(ligneDe('cohumulone').textContent, `${cle} : cohumulone`).toBe('cohumulone?');
      if (v.oils.farnesene) a(`${plage(v.oils.farnesene[0], v.oils.farnesene[1], 1)} % de l’huile`);
      if (v.oils.others) a(`${plage(v.oils.others[0], v.oils.others[1], 1)} % de l’huile`);
      if (v.bm?.hsi) expect(ligneDe('stockage (HSI)').textContent, `${cle} : HSI`).toContain('% perdus en 6 mois');
      else expect(ligneDe('stockage (HSI)').textContent, `${cle} : HSI`).toBe('stockage (HSI)?');
      // Le géraniol n'est séparé par aucune fiche chargée (Beer Maverick le range dans « autres huiles »).
      expect(ligneDe('géraniol').textContent, `${cle} : géraniol`).toBe('géraniol?');
      for (const st of v.bm?.styles ?? []) a(st);
      const nomBm = (x: string | { name: string }) => (typeof x === 'string' ? fiches().find((f) => f.id === `beermaverick-${x}`)!.name : x.name);
      for (const x of v.bm?.substituts ?? []) a(nomBm(x));
      for (const [x, n] of v.bm?.accords ?? []) a(`${nomBm(x)} ${n}`);
      // Les fiches : un lien par adresse, et leur nom complet visible.
      for (const l of sourcesFiche(cle)!.liens) a(l.nom);
      unmount();
    }
  });

  it('chaque valeur d’α, de β et d’huile porte sa source en lien vers sa page', () => {
    const { container, s } = rendre(LOTUS);
    const rangees = [...container.querySelectorAll('.pq-fiche-rangee')];
    const alphaBm = rangees.find((r) => /^α Beer Maverick/.test(r.textContent!))!;
    expect(alphaBm.querySelector('a')!.getAttribute('href')).toBe(s.alpha[0].url);
    expect(s.alpha[0].url).toBe(fiches().find((x) => x.id === LOTUS)!.url);
    const alphaHs = rangees.find((r) => /^α Hopsteiner/.test(r.textContent!))!;
    expect(alphaHs.querySelector('a')!.getAttribute('href')).toBe(fiches().find((x) => x.id === LOTUS)!.hs!.reference);
  });

  it('Nelson Sauvin : cohumulone 20–25 % des α et farnésène 0–1 % avec le lien de la page, les dates de la page et les listes de Beer Maverick', () => {
    const { container, s: sf } = rendre('beermaverick-nelson-sauvin');
    const rangees = [...container.querySelectorAll('.pq-fiche-rangee')];
    const url = 'https://beermaverick.com/hop/nelson-sauvin/';
    const coh = rangees.find((r) => /^cohumulone/.test(r.textContent!))!;
    expect(coh.textContent).toContain('20–25 % des α');
    expect(coh.querySelector('a')!.getAttribute('href')).toBe(url);
    const farn = rangees.find((r) => /^farnésène/.test(r.textContent!))!;
    expect(farn.textContent).toContain('0–1 % de l’huile');
    expect(farn.querySelector('a')!.getAttribute('href')).toBe(url);
    expect(rangees.find((r) => /^autres huiles/.test(r.textContent!))!.textContent).toContain('6–49 % de l’huile');
    // Le lien de la page d'abord, avec la date de modification publiée et la date de relevé.
    const premier = container.querySelector('[data-role="sources-liens"] li')!;
    expect(premier.querySelector('a')!.getAttribute('href')).toBe(url);
    expect(premier.textContent).toContain('modifiée 08.03.2023, relevée 08.09.2026');
    expect(sf.bm!.usage).toBe('arôme');
    const t = container.textContent!;
    for (const x of ['Hallertau Blanc', 'Enigma', 'Motueka', 'Riwaka', 'American Ale', 'IPA', 'Citra 8', '1:1 - 3:1', 'NZ Hops Ltd.', 'fruits tropicaux 2', 'petits fruits 4']) expect(t, x).toContain(x);
  });
  it('un houblon dont la cohumulone est « Unknown » chez Beer Maverick : « ? », jamais 0 ; un profil d’arôme absent n’est pas dessiné', () => {
    const inconnue = fiches().find((x) => !x.cohumulone)!;
    const { container } = rendre(inconnue.id);
    expect([...container.querySelectorAll('.pq-fiche-rangee')].find((r) => /^cohumulone/.test(r.textContent!))!.textContent).toBe('cohumulone?');
    const sansProfil = fiches().find((x) => x.bm && !x.bm.arome)!;
    const r2 = rendre(sansProfil.id);
    expect(r2.container.querySelector('[data-role="sources-profil-bm"]')).toBeNull();
  });

  it('trois cents houblons : la feuille se monte pour chacun, Beer Maverick en premier', () => {
    const vus: string[] = [];
    for (const v of fiches().filter((_, i) => i % 9 === 0)) {
      const { container, unmount } = rendre(v.id);
      const premier = container.querySelector<HTMLAnchorElement>('[data-role="sources-liens"] a');
      expect(premier?.getAttribute('href'), v.id).toBe(v.url);
      vus.push(v.id);
      unmount();
    }
    expect(vus.length).toBeGreaterThan(30);
  });
});
