import React, { useState } from 'react';
import { allerEtape } from '../helpers/wizard';
import { describe, it, expect, afterEach } from 'vitest';
import { render as testingRender, screen, fireEvent, cleanup } from '@testing-library/react';
import { SaltSolver, WaterState } from '../../src/ui/SaltSolver';
import { QuantityStepper } from '../../src/ui/QuantityStepper';
import { NumberInput } from '../../src/ui/NumberInput';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { AppConfig, Recipe, StockItem } from '../../src/types';

/**
 * Fuzz de la SAISIE : on tape n'importe quoi, et on vérifie ce qui ne doit
 * JAMAIS arriver.
 *
 * ⚠️ Pourquoi ça existe. Gaëtan : « j'ai l'impression que pas mal de champs ne
 * répondent pas comme il faut ». Les tests existants décrivent des gestes
 * JUSTES — taper 24,5 dans un volume, appuyer sur un palier. Aucun ne décrit un
 * geste FAUX, et c'est pourtant là que les pannes vivent : un champ vidé pour
 * être retapé, une virgule sur un clavier français, un tiret resté d'un
 * copier-coller, un nombre à douze chiffres.
 *
 * Quatre invariants, valables pour tous les champs :
 *
 *   1. **Jamais NaN, undefined ou Infinity à l'écran.** Un « NaN g » sur une
 *      fiche de pesée, c'est un brassin perdu.
 *   2. **Jamais de valeur négative** là où la physique l'interdit — une dose,
 *      un volume, une masse.
 *   3. **La virgule vaut le point.** Le clavier d'un téléphone français envoie
 *      une virgule : c'est la saisie NORMALE ici, pas un cas limite.
 *   4. **Un champ n'écrit jamais dans un autre.** C'est la panne qui a déjà
 *      inversé les deux volumes d'eau.
 */

afterEach(cleanup);

/**
 * Ce qu'un pouce, un presse-papier et un clavier français produisent vraiment.
 * Rien d'exotique : que du saisissable.
 */
const HOSTILES = [
  '',
  ' ',
  'abc',
  '-5',
  '-',
  '.',
  ',',
  '1.',
  '1,',
  '1,5',
  '1.5',
  '0012',
  '12abc',
  '--3',
  '1,2,3',
  '1 000',
  '1e9',
  '999999999999',
  '0.0000001',
  ' 12'
];

/** Ce que l'écran ne doit jamais montrer, quoi qu'on tape. */
const INTERDIT = /NaN|undefined|Infinity|\[object/;

const ETAT: WaterState = {
  diRatioPct: 50,
  styleCode: '21C',
  doses: { gypse: 2, cacl2: 4 },
  disabled: [],
  acidId: 'lactique',
  mashWaterL: 20,
  spargeWaterL: 10
};

function atelier() {
  const Hote: React.FC = () => {
    const [state, setState] = useState<WaterState>(ETAT);
    return (
      <SaltSolver
        source={DEFAULT_WATER_SOURCE}
        onSourceChange={() => {}}
        beerEbc={12}
        beerVolumeL={30}
        state={state}
        onChange={setState}
        noSparge={false}
        onNoSpargeChange={() => {}}
      />
    );
  };
  return render(<Hote />);
}

/** Tape une valeur puis quitte le champ, comme le fait un pouce. */
function saisir(champ: HTMLElement, valeur: string) {
  fireEvent.change(champ, { target: { value: valeur } });
  fireEvent.blur(champ);
}

describe('Fuzz — l’atelier de l’eau encaisse n’importe quelle saisie', () => {
  it('⚠️ aucun champ ne fait apparaître NaN, undefined ou Infinity', () => {
    const { container } = atelier();
    const champs = [...container.querySelectorAll('input')].filter(
      (i) => i.type !== 'range' && !i.disabled
    );
    expect(champs.length).toBeGreaterThan(8);

    const fautes: string[] = [];
    champs.forEach((champ) => {
      const nom = champ.getAttribute('aria-label') || champ.id || '?';
      HOSTILES.forEach((v) => {
        saisir(champ, v);
        const texte = container.textContent ?? '';
        if (INTERDIT.test(texte)) {
          fautes.push(`${nom} apres « ${v} » : ${texte.match(INTERDIT)![0]} dans l ecran`);
        }
        if (INTERDIT.test(champ.value)) {
          fautes.push(`${nom} apres « ${v} » affiche ${champ.value}`);
        }
      });
    });
    expect(fautes).toEqual([]);
    // This batch exercises hundreds of sequential React updates. Keep its
    // assertions intact while allowing the full suite's parallel CPU load.
  }, 30_000);

  it('⚠️ aucune dose de sel ne devient négative', () => {
    const { container } = atelier();
    const doses = [...container.querySelectorAll('input')].filter((i) =>
      (i.getAttribute('aria-label') || '').startsWith('Dose de')
    );
    expect(doses).toHaveLength(9);

    doses.forEach((champ) => {
      HOSTILES.forEach((v) => {
        saisir(champ, v);
        if (champ.value === '') return;
        expect(Number(champ.value.replace(',', '.'))).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('⚠️ aucun volume d’eau ne devient négatif', () => {
    atelier();
    [/Volume d’eau d’empâtage/i, /Volume d’eau de rinçage/i].forEach((re) => {
      const champ = screen.getByLabelText(re) as HTMLInputElement;
      HOSTILES.forEach((v) => {
        saisir(champ, v);
        if (champ.value === '') return;
        expect(Number(champ.value.replace(',', '.'))).toBeGreaterThanOrEqual(0);
      });
    });
  });

  /*
   * ⚠️ LA PANNE HISTORIQUE, remise à l'épreuve dans les deux sens : effacer un
   * volume pour le retaper passait par zéro, ce qui faisait disparaître l'onglet
   * Rinçage et redirigeait la frappe suivante vers l'EMPÂTAGE.
   */
  it('⚠️ malmener un volume ne touche jamais à l’autre', () => {
    atelier();
    const mash = () => screen.getByLabelText(/Volume d’eau d’empâtage/i) as HTMLInputElement;
    const sparge = () => screen.getByLabelText(/Volume d’eau de rinçage/i) as HTMLInputElement;

    HOSTILES.forEach((v) => {
      const avant = mash().value;
      saisir(sparge(), v);
      expect(mash().value).toBe(avant);
    });

    HOSTILES.forEach((v) => {
      const avant = sparge().value;
      saisir(mash(), v);
      expect(sparge().value).toBe(avant);
    });
  });

  /* La virgule est la saisie NORMALE sur un clavier de téléphone français. */
  it('la virgule vaut le point, sur tous les champs numériques', () => {
    const { container } = atelier();
    const champs = [...container.querySelectorAll('input')].filter(
      (i) =>
        i.type !== 'range' &&
        !i.disabled &&
        (i.getAttribute('inputmode') || '') !== 'search'
    );
    champs.forEach((champ) => {
      saisir(champ, '2,5');
      const virgule = champ.value;
      saisir(champ, '2.5');
      expect(virgule.replace(',', '.')).toBe(champ.value.replace(',', '.'));
    });
  });

  /* Le pourcentage d'osmosée est borné par la physique : 0 à 100. */
  it('⚠️ la part d’osmosée reste dans 0–100 quoi qu’on tape', () => {
    atelier();
    const champ = screen.getByLabelText(/Osmosée — empâtage$/i) as HTMLInputElement;
    ['-40', '250', '1e9', '999999', 'abc'].forEach((v) => {
      saisir(champ, v);
      if (champ.value === '') return;
      const n = Number(champ.value.replace(',', '.'));
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(100);
    });
  });
});

describe('Fuzz — les primitives numériques', () => {
  it('⚠️ NumberInput ne rend jamais NaN, et respecte ses bornes', () => {
    const Hote: React.FC = () => {
      const [v, setV] = useState<number | undefined>(5);
      return (
        <>
          <NumberInput aria-label="essai" value={v} onValue={setV} min={0} max={100} pad />
          <span data-testid="sortie">{String(v)}</span>
        </>
      );
    };
    render(<Hote />);
    const champ = screen.getByLabelText('essai') as HTMLInputElement;

    HOSTILES.forEach((h) => {
      saisir(champ, h);
      const sortie = screen.getByTestId('sortie').textContent ?? '';
      expect(sortie).not.toMatch(/NaN|Infinity/);
      if (sortie !== 'undefined' && sortie !== '') {
        const n = Number(sortie);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      }
    });
  });

  it('⚠️ QuantityStepper ne sort jamais de ses bornes, quoi qu’on tape', () => {
    const Hote: React.FC = () => {
      const [v, setV] = useState(10);
      return (
        <>
          <QuantityStepper value={v} onChange={setV} unit="kg" label="Essai" min={0} max={50} />
          <span data-testid="sortie">{String(v)}</span>
        </>
      );
    };
    render(<Hote />);
    const champ = screen.getByLabelText('Essai') as HTMLInputElement;

    HOSTILES.forEach((h) => {
      saisir(champ, h);
      const n = Number(screen.getByTestId('sortie').textContent);
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(50);
    });
  });
});

describe('Fuzz — l’assistant de recette', () => {
  /*
   * ⚠️ L'assistant porte le plus de champs de l'application : masses de grain,
   * poids de houblon, alpha, températures, jours en cuve, paliers. C'est de lui
   * que Gaëtan parle — « pas mal de champs ne répondent pas comme il faut ».
   *
   * Le montage est volontairement MINIMAL : ce fuzz ne juge pas la recette, il
   * vérifie qu'aucune frappe ne produit un écran cassé.
   */
  const config = {
    ...defaultConfig,
    brewhouses: defaultConfig.brewhouses,
    activeBrewhouseId: 'bh-30'
  } as AppConfig;

  const monterAssistant = () =>
    render(
      <BrewWizard
        seed={{ recipe: RECETTE_FUZZ }}
        stockItems={[]}
        config={config}
        knownStyles={['NEIPA', 'Stout']}
        onClose={() => {}}
        onCreateStockItem={(name, category, unit) =>
          ({ id: name, ref: 'X', name, category, unit, currentStock: 0, minStock: 0, reorder: false }) as StockItem
        }
        onLearnIngredient={() => {}}
        onSaveWaterSource={() => {}}
        onSave={() => {}}
      />
    );

  /** Parcourt les étapes et malmène chaque champ qu'elles portent. */
  const etapes = ['Identité', 'Fermentescibles', 'Houblons', 'Levure', 'Paliers'];

  it('⚠️ aucune étape ne fait apparaître NaN, undefined ou Infinity', () => {
    const { container } = monterAssistant();
    const fautes: string[] = [];

    etapes.forEach((etape) => {
      allerEtape(etape);

      [...container.querySelectorAll('input')]
        .filter((i) => i.type !== 'range' && !i.disabled)
        .forEach((champ) => {
          const nom = champ.getAttribute('aria-label') || champ.id || '?';
          HOSTILES.forEach((v) => {
            saisir(champ, v);
            const texte = container.textContent ?? '';
            if (INTERDIT.test(texte)) {
              fautes.push(`${etape} / ${nom} apres « ${v} » : ${texte.match(INTERDIT)![0]}`);
            }
          });
        });
    });

    expect(fautes.slice(0, 5)).toEqual([]);
  });

  /*
   * ⚠️ Une masse ou un poids NÉGATIF passe sans bruit jusqu'à la facture de
   * grain, où il retranche du malt. C'est la classe de faute la plus discrète :
   * l'OG baisse, et rien ne dit pourquoi.
   */
  it('⚠️ aucune masse ni aucun poids ne devient négatif', () => {
    const { container } = monterAssistant();

    etapes.forEach((etape) => {
      allerEtape(etape);

      [...container.querySelectorAll('input')]
        .filter((i) => {
          const nom = (i.getAttribute('aria-label') || '').toLowerCase();
          return /kg|gramme|poids|quantité|masse/.test(nom);
        })
        .forEach((champ) => {
          HOSTILES.forEach((v) => {
            saisir(champ, v);
            if (champ.value === '') return;
            expect(Number(champ.value.replace(',', '.'))).toBeGreaterThanOrEqual(0);
          });
        });
    });
  });

  /* Un pourcentage d'alpha au-delà de 100 n'existe pas. */
  it('⚠️ l’alpha d’un houblon reste dans 0–100', () => {
    monterAssistant();
    allerEtape('Houblons');

    screen.queryAllByLabelText(/^Alpha de/i).forEach((champ) => {
      ['-5', '250', '1e9', 'abc'].forEach((v) => {
        saisir(champ, v);
        const val = (champ as HTMLInputElement).value;
        if (val === '') return;
        const n = Number(val.replace(',', '.'));
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(100);
      });
    });
  });
});

/** Une recette minimale mais COMPLÈTE : chaque étape doit avoir des champs. */
const RECETTE_FUZZ = {
  id: 'FUZZ',
  name: 'Essai',
  style: 'NEIPA',
  volumeL: 20,
  boilMin: 60,
  totalGristKg: 4,
  fermentables: [{ name: 'Pilsner', weightKg: 4, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 37 }],
  hops: [
    { name: 'Magnum', weightG: 20, alpha: 0, stage: 'boil', timeMin: 60 },
    { name: 'Citra', weightG: 40, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 80 },
    { name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop', dayOffset: 3 }
  ],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' },
  mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], spargeType: 'batch' },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 7 }],
  steps: [],
  notes: []
} as unknown as Recipe;

// Open advanced salts for the existing numeric/chemistry regressions.
function render(...args:Parameters<typeof testingRender>){const view=testingRender(...args);
  for(const el of view.container.querySelectorAll('summary'))fireEvent.click(el);
  const unused=screen.queryByRole('button',{name:'Sels autorisés et inutilisés'});if(unused)fireEvent.click(unused);return view;
}
