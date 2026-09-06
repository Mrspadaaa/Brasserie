import React, { useState } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { RecipeAutoComplete } from '../../src/ui/RecipeAutoComplete';
import { Fermentable, HopIngredient, YeastSpec } from '../../src/types';

/**
 * « Je veux aussi dans le récap pouvoir demander à l'IA de tout autocompléter. »
 *
 * ⚠️ Deux règles tenues d'`AiAssist`, et ce sont elles que ces tests protègent :
 *
 *   - **rien n'est écrit avant validation** — on montre ce qui va l'être, avec
 *     sa source, et le brasseur décide ;
 *   - **on ne remplit QUE les cases vides**. Un chiffre saisi à la main gagne
 *     toujours : le brasseur a le sachet devant lui, le modèle a une fiche
 *     produit générique. Écraser l'alpha d'un lot par celui de la variété fait
 *     une amertume fausse sans que rien ne le signale.
 */

const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({
  AiClient: { run: (...args: unknown[]) => run(...args) }
}));

afterEach(() => {
  cleanup();
  run.mockReset();
});

const FICHE = (over: Record<string, unknown>) => ({
  ok: true,
  data: { found: true, name: 'X', source: 'Fiche fabricant', ...over }
});

function monter(init: {
  fermentables?: Fermentable[];
  hops?: HopIngredient[];
  yeast?: YeastSpec;
  onLearnIngredient?: (name: string, facts: any) => void;
  stockItems?: any[];
}) {
  const vu: { f: Fermentable[]; h: HopIngredient[]; y: YeastSpec } = {
    f: [],
    h: [],
    y: { name: '', form: 'sèche', qty: 1, unit: 'sachet' }
  };

  const Hote: React.FC = () => {
    const [f, setF] = useState<Fermentable[]>(init.fermentables ?? []);
    const [h, setH] = useState<HopIngredient[]>(init.hops ?? []);
    const [y, setY] = useState<YeastSpec>(
      init.yeast ?? { name: '', form: 'sèche', qty: 1, unit: 'sachet' }
    );
    vu.f = f;
    vu.h = h;
    vu.y = y;
    return (
      <RecipeAutoComplete
        onLearnIngredient={init.onLearnIngredient}
        stockItems={init.stockItems}
        fermentables={f}
        onFermentables={setF}
        hops={h}
        onHops={setH}
        yeast={y}
        onYeast={setY}
      />
    );
  };
  render(<Hote />);
  return vu;
}

const GRAIN_SANS_COULEUR: Fermentable = {
  name: 'Maris Otter',
  weightKg: 5,
  kind: 'grain',
  use: 'empatage'
};

describe('Tout compléter avec l’IA', () => {
  it('réutilise les données déjà enregistrées sans nouvel appel IA', async () => {
    const vu = monter({
      fermentables: [GRAIN_SANS_COULEUR],
      stockItems: [
        {
          name: 'Maris Otter',
          category: 'Malt',
          colorEbc: 6,
          potentialPpg: 38,
          technicalSource: 'Catalogue du malteur'
        }
      ]
    });
    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(run).not.toHaveBeenCalled();
    expect(vu.f[0]).toMatchObject({ colorEbc: 6, potentialPpg: 38 });
  });
  it('persiste les fiches acceptées et complète une température maxi manquante', async () => {
    const learn = vi.fn();
    run.mockResolvedValue(FICHE({ tempMaxC: 24, lab: 'Fermentis' }));
    const vu = monter({
      yeast: {
        name: 'US-05',
        form: 'sèche',
        qty: 1,
        unit: 'sachet',
        lab: '',
        attenuationPct: 81,
        fermTempMinC: 18
      },
      onLearnIngredient: learn
    });
    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(vu.y.fermTempMaxC).toBe(24);
    expect(vu.y.lab).toBe('Fermentis');
    expect(learn).toHaveBeenCalledWith(
      'US-05',
      expect.objectContaining({ yeastTempMaxC: 24, yeastLab: 'Fermentis' })
    );
  });
  it('regroupe un même houblon et applique sa fiche aux deux ajouts', async () => {
    run.mockResolvedValue(FICHE({ alphaPct: 12 }));
    const vu = monter({
      hops: [
        { name: 'Citra', weightG: 30, alpha: 0, stage: 'boil' },
        { name: 'Citra', weightG: 40, alpha: 0, stage: 'whirlpool' }
      ]
    });
    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(run).toHaveBeenCalledTimes(1);
    expect(vu.h.map((h) => h.alpha)).toEqual([12, 12]);
  });
  it('ne propose pas des champs étrangers à la fiche demandée et libère le bouton après échec', async () => {
    run.mockResolvedValue(FICHE({ alphaPct: 12 }));
    monter({ fermentables: [GRAIN_SANS_COULEUR] });
    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    await screen.findByText(/Rien de publié retrouvé/);
    expect(screen.queryByText(/Reprendre ces valeurs/)).toBeNull();
    run.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    await screen.findByText(/Recherche interrompue/);
    expect(screen.getByRole('button', { name: /Tout compléter/ })).toBeEnabled();
  });
  it('ne remplit pas une autre ligne après suppression ou réorganisation pendant la recherche', async () => {
    let resolve: (v: any) => void;
    run.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const learn = vi.fn(),
      onF = vi.fn();
    const props = {
      hops: [],
      onHops: vi.fn(),
      yeast: { name: '' } as YeastSpec,
      onYeast: vi.fn(),
      onFermentables: onF,
      onLearnIngredient: learn
    };
    const { rerender } = render(
      <RecipeAutoComplete {...props} fermentables={[GRAIN_SANS_COULEUR]} />
    );
    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    const other = { ...GRAIN_SANS_COULEUR, name: 'Autre malt' };
    rerender(<RecipeAutoComplete {...props} fermentables={[other]} />);
    resolve!(FICHE({ colorEbc: 6, potentialPpg: 38 }));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(onF).toHaveBeenLastCalledWith([other]);
    expect(learn).not.toHaveBeenCalled();
  });
  it('ne s’affiche pas quand la fiche est déjà complète', () => {
    monter({
      fermentables: [{ ...GRAIN_SANS_COULEUR, colorEbc: 6, potentialPpg: 38 }],
      hops: [{ name: 'Citra', weightG: 30, stage: 'boil', alpha: 12 }],
      yeast: {
        name: 'US-05',
        form: 'sèche',
        qty: 1,
        unit: 'sachet',
        lab: 'Fermentis',
        attenuationPct: 81,
        fermTempMinC: 15,
        fermTempMaxC: 22
      }
    });
    expect(screen.queryByText(/Tout compléter avec l’IA/)).toBeNull();
  });

  it('annonce ce qui manque, ingrédient par ingrédient', () => {
    monter({ fermentables: [GRAIN_SANS_COULEUR] });
    expect(screen.getByText(/1 ingrédient incomplet/)).toBeInTheDocument();
    expect(screen.getByText(/Maris Otter \(couleur EBC, potentiel PPG\)/)).toBeInTheDocument();
  });

  it('⚠️ un houblon à cru n’amérise pas : on ne lui réclame pas son alpha', () => {
    monter({ hops: [{ name: 'Citra', weightG: 85, stage: 'dryHop' }] });
    expect(screen.queryByText(/Tout compléter avec l’IA/)).toBeNull();
  });

  it('⚠️ montre la source et n’écrit rien avant validation', async () => {
    run.mockResolvedValue(FICHE({ name: 'Maris Otter', colorEbc: 7, potentialPpg: 38 }));
    const vu = monter({ fermentables: [GRAIN_SANS_COULEUR] });

    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    await waitFor(() => expect(screen.getByText('Fiche fabricant')).toBeInTheDocument());

    // Vu, pas encore écrit.
    expect(vu.f[0].colorEbc).toBeUndefined();

    fireEvent.click(screen.getByText(/Reprendre ces valeurs/));
    await waitFor(() => expect(vu.f[0].colorEbc).toBe(7));
    expect(vu.f[0].potentialPpg).toBe(38);
  });

  it('⚠️ n’écrase JAMAIS une valeur déjà saisie', async () => {
    run.mockResolvedValue(
      FICHE({ name: 'Maris Otter', colorEbc: 6, potentialPpg: 38, alphaPct: 14 })
    );
    // L'alpha du lot acheté est 11.2 ; celui de la variété, 14.
    const vu = monter({
      fermentables: [GRAIN_SANS_COULEUR],
      hops: [{ name: 'Citra', weightG: 30, stage: 'boil', alpha: 11.2 }]
    });

    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    await waitFor(() => expect(screen.getByText(/Reprendre ces valeurs/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Reprendre ces valeurs/));

    // Le houblon n'était pas dans les manques : son alpha reste celui du sachet.
    await waitFor(() => expect(vu.h[0].alpha).toBe(11.2));
  });

  it('dit ce qu’il n’a pas trouvé plutôt que de l’inventer', async () => {
    run.mockResolvedValue({ ok: true, data: { found: false, name: '', source: '' } });
    monter({ fermentables: [GRAIN_SANS_COULEUR] });

    fireEvent.click(screen.getByText(/Tout compléter avec l’IA/));
    await waitFor(() => expect(screen.getByText(/Rien de publié retrouvé/)).toBeInTheDocument());
    expect(screen.getByText(/à saisir à la main/)).toBeInTheDocument();
  });
});
