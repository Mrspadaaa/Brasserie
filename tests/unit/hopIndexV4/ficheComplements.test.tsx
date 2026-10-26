// @vitest-environment jsdom
// d3b-affichage (#180) : la feuille « Sources › » de la fiche montre toutes les valeurs de complements.json, champ par champ : sa source,
// son année, le lien vers sa fiche ; les valeurs suspectes ou hors enveloppe restent dans le détail replié, marquées d'un signe, leur
// raison au survol ; les liens des fiches fournisseurs viennent après Beer Maverick. Données : les fichiers du dépôt.
import { cleanup, render } from '@testing-library/react';
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

import { CHAMPS_COMPLEMENTS, chargerComplements, valeursDe } from '../../../src/domain/hopIndex/v4/complements';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { houblon } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { complementsFiche, liensAvecComplements, sourcesFiche } from '../../../src/ui/hopIndex/fiche/sources';
import { ContenuSources } from '../../../src/ui/hopIndex/fiche/SourcesFiche';

const RECETTE = {
  id: 'REC-D3B', name: 'Pale', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const recette = () => toHopRecipe(RECETTE, { boilOg: 1.066 }).recette;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
});
afterEach(cleanup);

const HOUBLONS = ['beermaverick-nelson-sauvin', 'beermaverick-citra', 'beermaverick-mosaic', 'beermaverick-galaxy', 'beermaverick-hallertau-blanc', 'beermaverick-cascade'];

describe('Sources › avec les compléments des 18 sources', () => {
  it('chaque champ de complements.json présent pour un houblon s\'affiche dans Sources', async () => {
    const c = await chargerComplements();
    for (const cle of HOUBLONS) {
      const attendus = CHAMPS_COMPLEMENTS.filter((ch) => valeursDe(cle, ch).length > 0);
      expect(attendus.length, cle).toBeGreaterThan(8);
      const comp = complementsFiche(cle, c)!;
      const s = sourcesFiche(cle)!;
      const { container, unmount } = render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} comp={comp} />);
      const affiches = [...container.querySelectorAll('[data-champ]')].map((e) => e.getAttribute('data-champ'));
      expect([...affiches].sort(), cle).toEqual([...attendus].sort());
      // Chaque valeur de chaque source est là : une ligne par valeur, dans le détail replié ou en rangée seule.
      for (const ch of attendus) {
        const bloc = container.querySelector(`[data-champ="${ch}"]`)!;
        const n = valeursDe(cle, ch).length;
        const lignes = bloc.querySelectorAll('li[data-source]').length;
        if (n === 1 && !valeursDe(cle, ch)[0].horsEnveloppe) expect(bloc.querySelector('a, span'), `${cle} ${ch}`).not.toBeNull();
        else expect(lignes, `${cle} ${ch}`).toBe(n);
      }
      unmount();
    }
  });

  it('une valeur suspecte ou hors enveloppe reste dans le détail, marquée d\'un signe, sa raison au survol, et n\'entre pas dans l\'enveloppe', async () => {
    const c = await chargerComplements();
    const cle = 'beermaverick-nelson-sauvin';
    const comp = complementsFiche(cle, c)!;
    const s = sourcesFiche(cle)!;
    const { container } = render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} comp={comp} />);
    const huile = container.querySelector('details[data-champ="huile"]')!;
    const suspecte = [...huile.querySelectorAll('li[data-statut="suspect"]')];
    expect(suspecte.length).toBeGreaterThan(0);
    const signe = suspecte[0].querySelector('[role="img"]')!;
    expect(signe.getAttribute('title')).toMatch(/écartée de l’enveloppe : huile totale au-delà de 6/);
    // L'enveloppe écrite sur la rangée ne monte pas jusqu'à 10,1.
    const resume = huile.querySelector('summary')!.textContent!;
    expect(resume).not.toContain('10,1');
    expect(resume).toMatch(/0,9–2/);
    // Une valeur valide n'a pas de signe.
    for (const li of huile.querySelectorAll('li[data-statut="valide"]')) expect(li.querySelector('[role="img"]')).toBeNull();
    // Hors enveloppe pour l'unité absente : marquée aussi, raison au survol.
    const hors = container.querySelector('details[data-champ="alpha"] li[data-statut="hors-enveloppe"] [role="img"]')!;
    expect(hors.getAttribute('title')).toMatch(/unité non écrite/);
    // L'intensité d'arôme de Charles Faram est hors enveloppe (échelle non publiée) : « ? » sur la rangée, la valeur dans le détail.
    const intensite = container.querySelector('[data-champ="intensite_arome"]')!;
    expect(intensite.textContent).toContain('?');
    expect(intensite.querySelector('li[data-statut="hors-enveloppe"]')).not.toBeNull();
  });

  it('les nouveaux champs : polyphénols, xanthohumol, thiols, intensité, sélinène, rendement, conservation', async () => {
    const c = await chargerComplements();
    for (const [cle, champs] of [
      ['beermaverick-citra', ['polyphenols', 'thiols', 'intensite_arome', 'rendement', 'conservation']],
      ['beermaverick-galaxy', ['selinene']],
      ['beermaverick-hallertau-blanc', ['xanthohumol', 'polyphenols', 'thiols']],
    ] as [string, string[]][]) {
      const s = sourcesFiche(cle)!;
      const { container, unmount } = render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} comp={complementsFiche(cle, c)} />);
      for (const ch of champs) expect(container.querySelector(`[data-champ="${ch}"]`), `${cle} ${ch}`).not.toBeNull();
      unmount();
    }
  });

  it('les liens : Beer Maverick d\'abord, puis les fiches fournisseurs de complements.json, une fois par adresse', async () => {
    const c = await chargerComplements();
    const cle = 'beermaverick-citra';
    const s = sourcesFiche(cle)!;
    const comp = complementsFiche(cle, c)!;
    const liens = liensAvecComplements(s.liens, comp);
    expect(liens[0].auteur).toBe('Beer Maverick');
    const urls = liens.filter((l) => l.url).map((l) => l.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const l of comp.liens) if (l.url) expect(urls).toContain(l.url);
    // Les fiches sans adresse viennent après celles qui en ont.
    const premierSansUrl = liens.findIndex((l) => !l.url);
    if (premierSansUrl >= 0) expect(liens.slice(premierSansUrl).every((l) => !l.url)).toBe(true);
    const { container } = render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} comp={comp} />);
    const rendus = [...container.querySelectorAll<HTMLAnchorElement>('[data-role="sources-liens"] a')].map((a) => a.getAttribute('href'));
    expect(rendus[0]).toBe(s.liens[0].url);
    expect(rendus.length).toBe(urls.length);
  });

  it('sans les compléments (hors ligne, échec) : la feuille garde le catalogue, sans rangée des compléments', () => {
    const cle = 'beermaverick-citra';
    const s = sourcesFiche(cle)!;
    const { container } = render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} comp={null} />);
    expect(container.querySelectorAll('[data-champ]').length).toBe(0);
    expect(container.querySelector('[data-role="lien-beer-maverick"]')).not.toBeNull();
    // Le géraniol reste « ? » : aucune source ne le donne sans les compléments.
    expect(container.textContent).toContain('géraniol');
  });
});
