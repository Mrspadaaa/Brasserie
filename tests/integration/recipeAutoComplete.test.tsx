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

describe('Compléter les données manquantes avec l’IA', () => {
  it('isole deux malts homonymes par référence et ne réutilise pas la fiche du premier lot', async () => {
    const learn = vi.fn();
    run.mockImplementation(({ context }) => Promise.resolve(FICHE({
      colorEbc: context.stockItemRef === 'M-A' ? 6 : 9, potentialPpg: 38
    })));
    const vu = monter({ fermentables: [
      { ...GRAIN_SANS_COULEUR, stockItemRef: 'M-A' },
      { ...GRAIN_SANS_COULEUR, stockItemRef: 'M-B' }
    ], stockItems: [
      { id: 'doc-a', ref: 'M-A', name: 'Maris Otter', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 0, reorder: false, supplier: 'A' },
      { id: 'doc-b', ref: 'M-B', name: 'Maris Otter', category: 'Malt', unit: 'kg', currentStock: 3, minStock: 0, reorder: false, supplier: 'B' }
    ], onLearnIngredient: learn });
    fireEvent.click(screen.getByRole('button', { name: /Compléter les données/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls.map(([request]) => request.context.stockItemRef).sort()).toEqual(['M-A', 'M-B']);
    expect(vu.f.map(item => item.colorEbc)).toEqual([6, 9]);
    expect(learn.mock.calls.map(([, facts]) => facts.ref).sort()).toEqual(['M-A', 'M-B']);
  });

  it('ne reprend pas l’alpha d’un autre lot homonyme et laisse le lot inconnu à saisir', async () => {
    const vu = monter({ hops: [
      { name: 'Cascade', stockItemRef: 'H-A', weightG: 10, alpha: 0, stage: 'boil', timeMin: 15 },
      { name: 'Cascade', stockItemRef: 'H-B', weightG: 10, alpha: 0, stage: 'boil', timeMin: 15 }
    ], stockItems: [
      { id: 'doc-a', ref: 'H-A', name: 'Cascade', category: 'Houblon', unit: 'g', currentStock: 30, minStock: 0, reorder: false, alphaPct: 6 },
      { id: 'doc-b', ref: 'H-B', name: 'Cascade', category: 'Houblon', unit: 'g', currentStock: 30, minStock: 0, reorder: false }
    ] });
    await waitFor(() => expect(vu.h.map(item => item.alpha)).toEqual([6, 0]));
    expect(screen.queryByRole('button', { name: /Compléter les données/ })).not.toBeInTheDocument();
    expect(run).not.toHaveBeenCalled();
  });

  it('ne réutilise pas le premier stock homonyme quand une ancienne recette n’a pas de référence', async () => {
    run.mockResolvedValue(FICHE({ alphaPct: 14 }));
    const vu = monter({ hops: [{ name: 'Cascade', weightG: 20, alpha: 0, stage: 'boil', timeMin: 15 }], stockItems: [
      { id: 'doc-a', ref: 'H-A', name: 'Cascade', category: 'Houblon', unit: 'g', currentStock: 30, minStock: 0, reorder: false, alphaPct: 6, technicalSource: 'Étiquette A' },
      { id: 'doc-b', ref: 'H-B', name: 'Cascade', category: 'Houblon', unit: 'g', currentStock: 30, minStock: 0, reorder: false, alphaPct: 8, technicalSource: 'Étiquette B' }
    ] });
    await waitFor(() => expect(vu.h[0].alpha).toBe(0));
    fireEvent.click(screen.getByRole('button', { name: /Compléter les données/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(run).toHaveBeenCalledOnce();
    expect(vu.h[0].alpha).toBe(14);
  });

  it('conserve une atténuation fabricant en plage sans demander une valeur exacte à l’IA', async () => {
    const vu = monter({ yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 11.5, unit: 'g', lab: 'Fermentis', fermTempMinC: 18, fermTempMaxC: 26 } });
    await waitFor(() => expect(screen.queryByRole('button', { name: /Compléter les données/ })).not.toBeInTheDocument());
    expect(vu.y.attenuationPct).toBeUndefined();
    expect(screen.queryByRole('button', { name: /Compléter les données/ })).not.toBeInTheDocument();
    expect(run).not.toHaveBeenCalled();
  });
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
    await waitFor(() => expect(vu.f[0].potentialPpg).toBe(38));
    expect(run).not.toHaveBeenCalled();
    expect(vu.f[0]).toMatchObject({ colorEbc: 6, potentialPpg: 38 });
  });
  it('retire l’ancien échec de recherche après correction manuelle des données', async () => {
    run.mockRejectedValue(new Error('offline'));
    const props = { hops: [], yeast: { name: '' } as YeastSpec, onFermentables: vi.fn(), onHops: vi.fn(), onYeast: vi.fn() };
    const { rerender } = render(<RecipeAutoComplete {...props} fermentables={[GRAIN_SANS_COULEUR]} />);
    fireEvent.click(screen.getByRole('button', { name: /Compléter les données/ }));
    await screen.findByText(/Recherche interrompue/);
    rerender(<RecipeAutoComplete {...props} fermentables={[{ ...GRAIN_SANS_COULEUR, colorEbc: 6, potentialPpg: 38 }]} />);
    expect(screen.queryByText(/Recherche interrompue/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Compléter les données/ })).not.toBeInTheDocument();
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('persiste les fiches acceptées et complète une température maxi manquante', async () => {
    const learn = vi.fn();
    run.mockResolvedValue(FICHE({ tempMaxC: 24, lab: 'Fermentis' }));
    const vu = monter({
      yeast: {
        name: 'Souche de contrôle non référencée',
        form: 'sèche',
        qty: 1,
        unit: 'sachet',
        lab: '',
        attenuationPct: 81,
        fermTempMinC: 18
      },
      onLearnIngredient: learn
    });
    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(vu.y.fermTempMaxC).toBe(24);
    expect(vu.y.lab).toBe('Fermentis');
    expect(learn).toHaveBeenCalledWith(
      'Souche de contrôle non référencée',
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
    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(run).toHaveBeenCalledTimes(1);
    expect(vu.h.map((h) => h.alpha)).toEqual([12, 12]);
  });
  it('ne propose pas des champs étrangers à la fiche demandée et libère le bouton après échec', async () => {
    run.mockResolvedValue(FICHE({ alphaPct: 12 }));
    monter({ fermentables: [GRAIN_SANS_COULEUR] });
    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    await screen.findByText(/Rien de publié retrouvé/);
    expect(screen.queryByText(/Reprendre ces valeurs/)).toBeNull();
    run.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    await screen.findByText(/Recherche interrompue/);
    expect(screen.getByRole('button', { name: /Compléter les données/ })).toBeEnabled();
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
    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    const other = { ...GRAIN_SANS_COULEUR, name: 'Autre malt' };
    rerender(<RecipeAutoComplete {...props} fermentables={[other]} />);
    resolve!(FICHE({ colorEbc: 6, potentialPpg: 38 }));
    await waitFor(() => expect(screen.queryByText(/Reprendre ces valeurs/)).not.toBeInTheDocument());
    expect(onF).not.toHaveBeenCalled();
    expect(learn).not.toHaveBeenCalled();
  });
  it('ignore une réponse si la fiche du même article change pendant la recherche', async () => {
    let resolve!: (value: any) => void;
    run.mockReturnValue(new Promise(r => { resolve = r; }));
    const onF = vi.fn();
    const stock = { id: 'doc-a', ref: 'M-A', name: 'Maris Otter', category: 'Malt', unit: 'kg',
      currentStock: 2, minStock: 0, reorder: false, supplier: 'Malterie A' };
    const props = { fermentables: [{ ...GRAIN_SANS_COULEUR, stockItemRef: 'M-A' }], onFermentables: onF,
      hops: [], onHops: vi.fn(), yeast: { name: '' } as YeastSpec, onYeast: vi.fn() };
    const view = render(<RecipeAutoComplete {...props} stockItems={[stock]} />);
    fireEvent.click(screen.getByRole('button', { name: /Compléter les données/ }));
    view.rerender(<RecipeAutoComplete {...props} stockItems={[{ ...stock, supplier: 'Malterie B' }]} />);
    resolve(FICHE({ colorEbc: 6, potentialPpg: 38 }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reprendre ces valeurs' })).not.toBeInTheDocument());
    expect(onF).not.toHaveBeenCalled();
  });
  it('oublie une ancienne fiche en cache si le fournisseur change avant validation', async () => {
    run.mockResolvedValueOnce(FICHE({ colorEbc: 6, potentialPpg: 38 }))
      .mockResolvedValueOnce(FICHE({ colorEbc: 9, potentialPpg: 38 }));
    const onF = vi.fn();
    const stock = { id: 'doc-a', ref: 'M-A', name: 'Maris Otter', category: 'Malt', unit: 'kg',
      currentStock: 2, minStock: 0, reorder: false, supplier: 'Malterie A' };
    const props = { fermentables: [{ ...GRAIN_SANS_COULEUR, stockItemRef: 'M-A' }], onFermentables: onF,
      hops: [], onHops: vi.fn(), yeast: { name: '' } as YeastSpec, onYeast: vi.fn() };
    const view = render(<RecipeAutoComplete {...props} stockItems={[stock]} />);
    fireEvent.click(screen.getByRole('button', { name: /Compléter les données/ }));
    await screen.findByRole('button', { name: 'Reprendre ces valeurs' });
    expect(onF).not.toHaveBeenCalled();
    view.rerender(<RecipeAutoComplete {...props} stockItems={[{ ...stock, supplier: 'Malterie B' }]} />);
    expect(screen.queryByRole('button', { name: 'Reprendre ces valeurs' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Compléter les données/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces valeurs' }));
    expect(run).toHaveBeenCalledTimes(2);
    expect(onF.mock.lastCall![0][0].colorEbc).toBe(9);
  });
  it('annule les recherches en attente et ignore leur réponse sans écrire', async () => {
    const pending: Array<(v:any)=>void> = [];
    run.mockImplementation(()=>new Promise(resolve=>pending.push(resolve)));
    const learn=vi.fn(),vu=monter({fermentables:Array.from({length:5},(_,i)=>({...GRAIN_SANS_COULEUR,name:'Malt QA '+i})),onLearnIngredient:learn});
    fireEvent.click(screen.getByRole('button',{name:/Compléter les données/}));
    expect(run).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole('button',{name:'Annuler la recherche'}));
    pending.forEach(resolve=>resolve(FICHE({colorEbc:6,potentialPpg:38})));
    await waitFor(()=>expect(screen.getByRole('button',{name:/Compléter les données/})).toBeEnabled());
    expect(run).toHaveBeenCalledTimes(3);
    expect(screen.queryByText(/Reprendre ces valeurs/)).not.toBeInTheDocument();
    expect(vu.f.every(f=>f.potentialPpg==null)).toBe(true);expect(learn).not.toHaveBeenCalled();
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
    expect(screen.queryByText(/Compléter les données manquantes avec l’IA/)).toBeNull();
  });

  it('annonce ce qui manque, ingrédient par ingrédient', () => {
    monter({ fermentables: [GRAIN_SANS_COULEUR] });
    expect(screen.getByText(/Données de fiche à compléter/)).toBeInTheDocument();
    expect(screen.getByText(/Maris Otter \(couleur EBC, potentiel PPG\)/)).toBeInTheDocument();
  });

  it('complète aussi la fiche à cru et conserve son contexte sans fabriquer une utilisation Tinseth', async () => {
    run.mockResolvedValue(FICHE({alphaPct:12}));
    const vu = monter({ hops: [{ name: 'Citra', alpha:0, weightG:85, stage:'dryHop', dayOffset:3, aromaContactHours:48, aromaTiming:'fermentation' }] });
    expect(screen.getByText(/À cru · alpha de fiche facultatif, hors du calcul IBU à chaud/)).toHaveTextContent('Citra');
    expect(screen.queryByText(/ingrédient incomplet/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    fireEvent.click(await screen.findByText(/Reprendre ces valeurs/));
    expect(run).toHaveBeenCalledTimes(1);
    expect(vu.h[0]).toMatchObject({alpha:12,weightG:85,stage:'dryHop',dayOffset:3,aromaContactHours:48,aromaTiming:'fermentation'});
  });
  it('présente l’alpha à chaud avant la fiche facultative à cru sans retirer la recherche groupée', () => {
    monter({ hops: [
      { name: 'Amérisant', alpha: 0, weightG: 20, stage: 'boil', timeMin: 20 },
      { name: 'Aromatique', alpha: 0, weightG: 40, stage: 'dryHop', dayOffset: 4 }
    ] });
    const panel = screen.getByRole('region', { name: 'Autocomplétion des ingrédients' });
    const hot = 'Pour calculer les IBU à chaud, documenter l’alpha du lot : Amérisant.';
    const dry = 'À cru · alpha de fiche facultatif, hors du calcul IBU à chaud : Aromatique.';
    expect(panel).toHaveTextContent(hot);
    expect(panel).toHaveTextContent(dry);
    expect(panel.textContent!.indexOf(hot)).toBeLessThan(panel.textContent!.indexOf(dry));
    expect(screen.getAllByRole('button', { name: /Compléter les données manquantes/ })).toHaveLength(1);
  });

  it('⚠️ montre la source et n’écrit rien avant validation', async () => {
    run.mockResolvedValue(FICHE({ name: 'Maris Otter', colorEbc: 7, potentialPpg: 38 }));
    const vu = monter({ fermentables: [GRAIN_SANS_COULEUR] });

    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
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

    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    await waitFor(() => expect(screen.getByText(/Reprendre ces valeurs/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Reprendre ces valeurs/));

    // Le houblon n'était pas dans les manques : son alpha reste celui du sachet.
    await waitFor(() => expect(vu.h[0].alpha).toBe(11.2));
  });

  it('dit ce qu’il n’a pas trouvé plutôt que de l’inventer', async () => {
    run.mockResolvedValue({ ok: true, data: { found: false, name: '', source: '' } });
    monter({ fermentables: [GRAIN_SANS_COULEUR] });

    fireEvent.click(screen.getByText(/Compléter les données manquantes avec l’IA/));
    await waitFor(() => expect(screen.getByText(/Rien de publié retrouvé/)).toBeInTheDocument());
    expect(screen.getByText(/à saisir à la main/)).toBeInTheDocument();
  });
});
