import React, { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { Combobox, ComboOption } from '../../src/ui/Combobox';
import { NumericField } from '../../src/ui/NumericField';
import { QuantityStepper } from '../../src/ui/QuantityStepper';
import { SegmentedControl } from '../../src/ui/SegmentedControl';
import { CycleTag } from '../../src/ui/CycleTag';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { AppConfig, Recipe, StockItem } from '../../src/types';

/**
 * Les trois pannes de saisie constatées sur téléphone.
 *
 * Chaque bloc reproduit le geste réel qui échouait, pas l'implémentation qui le
 * corrige : si la correction est refaite autrement un jour, ces tests doivent
 * continuer à décrire ce que le brasseur fait avec son pouce.
 */

/** Fait croire à l'application qu'elle tourne sur un écran tactile. */
function pretendTouchDevice(coarse: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('pointer: coarse') ? coarse : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia;
}

const OPTIONS: ComboOption[] = Array.from({ length: 20 }, (_, i) => ({
  value: `REF-${i}`,
  label: `Malt ${i}`,
  detail: `${i} kg en stock`
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Combobox — défiler la liste au doigt', () => {
  beforeEach(() => pretendTouchDevice(true));

  /**
   * ⚠️ LE BUG SIGNALÉ. Les options se choisissaient sur `pointerdown`, avec
   * `preventDefault()`. Or un geste de défilement COMMENCE par un `pointerdown`
   * sur une option : essayer de faire défiler la liste sélectionnait l'article
   * touché en premier et refermait tout, sans qu'on ait jamais pu atteindre
   * celui qu'on cherchait.
   */
  it('ne sélectionne rien quand le doigt glisse pour faire défiler', () => {
    const onChange = vi.fn();
    render(<Combobox value="" onChange={onChange} options={OPTIONS} />);

    fireEvent.focus(screen.getByRole('combobox'));
    const option = screen.getByText('Malt 3');

    // Le doigt se pose sur une option, puis remonte de 80 px : c'est un
    // défilement, pas un choix.
    fireEvent.pointerDown(option, { pointerType: 'touch', clientX: 100, clientY: 300 });
    fireEvent.pointerUp(option, { pointerType: 'touch', clientX: 100, clientY: 220 });
    fireEvent.click(option);

    expect(onChange).not.toHaveBeenCalled();
    // Et la liste doit rester ouverte : c'est tout l'intérêt d'avoir défilé.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('sélectionne quand le doigt se pose et se relève au même endroit', () => {
    const onChange = vi.fn();
    render(<Combobox value="" onChange={onChange} options={OPTIONS} />);

    fireEvent.focus(screen.getByRole('combobox'));
    const option = screen.getByText('Malt 3');

    fireEvent.pointerDown(option, { pointerType: 'touch', clientX: 100, clientY: 300 });
    fireEvent.pointerUp(option, { pointerType: 'touch', clientX: 102, clientY: 303 });
    expect(onChange).not.toHaveBeenCalled();
    expect(option).toBeInTheDocument();
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('REF-3');
  });

  it('tolère le tremblement du doigt — 3 px restent un appui', () => {
    const onChange = vi.fn();
    render(<Combobox value="" onChange={onChange} options={OPTIONS} />);

    fireEvent.focus(screen.getByRole('combobox'));
    const option = screen.getByText('Malt 5');

    fireEvent.pointerDown(option, { pointerType: 'touch', clientX: 100, clientY: 300 });
    fireEvent.pointerUp(option, { pointerType: 'touch', clientX: 100, clientY: 297 });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('REF-5');
  });

  it('choisit toujours à la souris, où le clic reste immédiat', () => {
    pretendTouchDevice(false);
    const onChange = vi.fn();
    render(<Combobox value="" onChange={onChange} options={OPTIONS} />);

    fireEvent.focus(screen.getByRole('combobox'));
    const option = screen.getByText('Malt 7');

    fireEvent.pointerDown(option, { pointerType: 'mouse', clientX: 50, clientY: 80 });
    fireEvent.pointerUp(option, { pointerType: 'mouse', clientX: 50, clientY: 80 });
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('REF-7');
  });

  /**
   * Sur mobile, le premier clic ouvre la liste sans déclencher le clavier.
   * Un re-clic sur le champ ouvert déverrouille la saisie.
   */
  it('n\'ouvre pas le clavier au premier toucher sur mobile, mais au re-clic', () => {
    render(<Combobox value="" onChange={() => {}} options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('readonly');

    // 1er clic : ouvre la liste (reste readonly)
    fireEvent.click(input);
    expect(input).toHaveAttribute('readonly');

    // 2ème clic (reclick) : active la recherche et le clavier
    fireEvent.click(input);
    expect(input).not.toHaveAttribute('readonly');
  });
});

/** Petit hôte pour observer un champ contrôlé comme le fait un vrai écran. */
const HostedNumericField: React.FC<{
  initial?: number;
  onValue?: (n: number) => void;
  keyboard?: 'auto' | 'pad';
}> = ({ initial = 0, onValue, keyboard = 'auto' }) => {
  const [v, setV] = useState(initial);
  return (
    <NumericField
      label="Montant"
      value={v}
      keyboard={keyboard}
      onChange={(n) => {
        setV(n);
        onValue?.(n);
      }}
    />
  );
};

describe('NumericField — taper un nombre au doigt', () => {
  beforeEach(() => pretendTouchDevice(true));

  /**
   * ⚠️ LE BUG QUI PERDAIT DE L'ARGENT. `<input type="number">` refuse la
   * virgule : `e.target.value` revenait vide, et `parseFloat(v) || 0`
   * enregistrait zéro. Un achat de 12,50 CHF entrait en compta à 0.00.
   */
  it('lit « 12,50 » comme 12.50 et non comme zéro', () => {
    const onValue = vi.fn();
    render(<HostedNumericField onValue={onValue} />);

    fireEvent.change(screen.getByLabelText('Montant'), { target: { value: '12,50' } });
    expect(onValue).toHaveBeenLastCalledWith(12.5);
  });

  it('lit aussi le point, pour qui tape au pavé numérique', () => {
    const onValue = vi.fn();
    render(<HostedNumericField onValue={onValue} />);

    fireEvent.change(screen.getByLabelText('Montant'), { target: { value: '12.50' } });
    expect(onValue).toHaveBeenLastCalledWith(12.5);
  });

  /**
   * ⚠️ La frappe intermédiaire. Le champ se réécrivait à chaque caractère :
   * « 12, » redevenait « 12 » et l'on ne pouvait jamais saisir les décimales.
   */
  it('garde la virgule affichée le temps de taper les décimales', () => {
    render(<HostedNumericField />);
    const input = screen.getByLabelText('Montant') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '12,' } });
    expect(input.value).toBe('12,');

    fireEvent.change(input, { target: { value: '12,5' } });
    expect(input.value).toBe('12,5');
  });

  /**
   * ⚠️ L'effacement. Vider le champ le remettait instantanément à « 0 », si
   * bien qu'on ne pouvait pas effacer pour saisir autre chose.
   */
  it('laisse le champ vide quand on efface pour retaper', () => {
    render(<HostedNumericField initial={30} />);
    const input = screen.getByLabelText('Montant') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: '4' } });
    expect(input.value).toBe('4');
  });

  it('n\'applique les bornes qu\'à la sortie du champ', () => {
    const onValue = vi.fn();
    render(
      <NumericField label="Volume" value={0} min={10} max={100} onChange={onValue} />
    );
    const input = screen.getByLabelText('Volume');

    // En route vers 15, le « 1 » ne doit pas être remonté à 10 : sinon la
    // valeur 15 est inatteignable.
    fireEvent.change(input, { target: { value: '1' } });
    expect(onValue).toHaveBeenLastCalledWith(1);

    fireEvent.change(input, { target: { value: '15' } });
    expect(onValue).toHaveBeenLastCalledWith(15);
  });

  it('ramène dans les bornes une fois la saisie terminée', () => {
    const onValue = vi.fn();
    render(<NumericField label="Volume" value={0} min={10} max={100} onChange={onValue} />);
    const input = screen.getByLabelText('Volume');

    fireEvent.change(input, { target: { value: '250' } });
    fireEvent.blur(input);
    expect(onValue).toHaveBeenLastCalledWith(100);
  });

  /**
   * Saisie mobile : le clavier natif du système s'ouvre avec inputmode decimal,
   * sans verrou readonly.
   */
  it('ouvre le clavier numérique natif sur mobile sans verrou readonly', () => {
    render(<HostedNumericField keyboard="pad" />);
    const input = screen.getByLabelText('Montant');
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });

  it('permet la saisie directe au clavier', () => {
    const onValue = vi.fn();
    render(<HostedNumericField onValue={onValue} />);

    const input = screen.getByLabelText('Montant');
    fireEvent.change(input, { target: { value: '12,5' } });
    fireEvent.blur(input);

    expect(onValue).toHaveBeenLastCalledWith(12.5);
  });

  it('garde le clavier normal sur ordinateur', () => {
    pretendTouchDevice(false);
    render(<HostedNumericField />);
    expect(screen.getByLabelText('Montant')).not.toHaveAttribute('readonly');
  });
});

describe('QuantityStepper — réceptionner une marchandise', () => {
  beforeEach(() => pretendTouchDevice(true));

  it('permet la saisie directe au clavier sur mobile', () => {
    render(<QuantityStepper value={0} onChange={() => {}} unit="kg" label="Quantité" />);
    const input = screen.getByLabelText('Quantité');
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });

  it('accepte la virgule dans la quantité', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={0} onChange={onChange} unit="kg" label="Quantité" />);

    fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: '2,5' } });
    expect(onChange).toHaveBeenLastCalledWith(2.5);
  });

  /*
   * ⚠️ TROIS FAUTES CUMULÉES, signalées mot pour mot : « les boutons + et −
   * semblent pas bien fonctionner », « l'appui prolongé ne fonctionne pas bien ».
   *
   * 1. La répétition capturait `value` au démarrage de l'intervalle. Chaque tic
   *    recalculait donc `value + pas` depuis la MÊME valeur : garder le doigt
   *    appuyé ajoutait un pas, puis réécrivait ce même résultat indéfiniment.
   * 2. Le `click` de relâchement partait EN PLUS des tics : on visait 25 kg et
   *    on obtenait 25.5.
   * 3. `pointerleave` coupait la répétition au moindre glissement du doigt.
   */
  it('⚠️ l’appui long accumule vraiment, et n’ajoute pas un pas au relâchement', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<QuantityStepper value={0} onChange={onChange} unit="kg" label="Quantité" />);
    const plus = screen.getByRole('button', { name: 'Ajouter 0.5 kg' });

    fireEvent.pointerDown(plus, { pointerId: 1 });
    // 400 ms d'attente, puis trois tics de 90 ms.
    act(() => {
      vi.advanceTimersByTime(400 + 90 * 3);
    });
    fireEvent.pointerUp(plus, { pointerId: 1 });
    fireEvent.click(plus);

    // Les trois tics s'AJOUTENT — et le clic final ne compte pas une quatrième fois.
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([0.5, 1, 1.5]);
    vi.useRealTimers();
  });

  it('un appui SIMPLE ajoute exactement un pas fin', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<QuantityStepper value={2} onChange={onChange} unit="kg" label="Quantité" />);
    const plus = screen.getByRole('button', { name: 'Ajouter 0.5 kg' });

    fireEvent.pointerDown(plus, { pointerId: 1 });
    act(() => {
      vi.advanceTimersByTime(120); // relâché avant le seuil de répétition
    });
    fireEvent.pointerUp(plus, { pointerId: 1 });
    fireEvent.click(plus);

    expect(onChange.mock.calls.map((c) => c[0])).toEqual([2.5]);
    vi.useRealTimers();
  });

  it('les paliers descendent aussi — et se bloquent au minimum', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={0} onChange={onChange} unit="kg" label="Quantité" />);
    expect(screen.getByRole('button', { name: 'Retirer 5 kg' })).toBeDisabled();

    cleanup();
    render(<QuantityStepper value={12} onChange={onChange} unit="kg" label="Quantité" />);
    fireEvent.click(screen.getByRole('button', { name: 'Retirer 5 kg' }));
    expect(onChange).toHaveBeenLastCalledWith(7);
  });

  it('masque les paliers en mode compact, pour tenir dans une liste', () => {
    const { rerender } = render(
      <QuantityStepper value={0} onChange={() => {}} unit="kg" label="Quantité" />
    );
    // ⚠️ Les paliers vont désormais DANS LES DEUX SENS, et laissent le pas fin
    // aux boutons − et + : sur du kg, ce sont −5 −1 +1 +5.
    expect(screen.getByRole('button', { name: 'Ajouter 1 kg' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirer 5 kg' })).toBeInTheDocument();

    rerender(
      <QuantityStepper value={0} onChange={() => {}} unit="kg" label="Quantité" compact />
    );
    expect(screen.queryByRole('button', { name: 'Ajouter 1 kg' })).toBeNull();
    // Les ± restent : l'ajustement fin ne dépend pas des paliers.
    expect(screen.getByRole('button', { name: 'Ajouter 0.5 kg' })).toBeInTheDocument();
  });
});

/**
 * Fait croire à l'application qu'un clavier de `height` pixels est ouvert.
 *
 * jsdom n'implémente pas `visualViewport` — la seule source qui bouge avec le
 * clavier. Sans ce bouchon, la densité resterait éternellement « compact » et
 * les tests ne verraient jamais le cas qui compte.
 */
function pretendKeyboard(height: number) {
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: {
      height: window.innerHeight - height,
      offsetTop: 0,
      addEventListener: () => {},
      removeEventListener: () => {}
    }
  });
}

describe('Densité — ce qui cède quand le clavier occupe l’écran', () => {
  beforeEach(() => pretendTouchDevice(true));
  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  });

  const FAMILLES = [
    { value: 'grain', label: 'Grain', hint: 'Passe par la maische.' },
    { value: 'sucre', label: 'Sucre', hint: 'Fermente à 100 %.' },
    { value: 'lactose', label: 'Lactose', hint: 'Ne fermente pas.' },
    { value: 'fruit', label: 'Fruit', hint: 'Apporte du sucre et de l’eau.' },
    { value: 'extrait', label: 'Extrait', hint: 'Sans empâtage.' }
  ];

  it('empile les familles en grille tant que la place ne manque pas', () => {
    render(
      <SegmentedControl
        label="Famille"
        layout="grid"
        value="grain"
        onChange={() => {}}
        options={FAMILLES}
      />
    );
    const group = screen.getByRole('radiogroup');
    expect(group.className).toContain('grid');
    // Les précisions restent : elles servent à choisir la famille.
    expect(screen.getByText('Passe par la maische.')).toBeInTheDocument();
  });

  /**
   * ⚠️ Cinq options sur deux colonnes font trois rangées, soit ~165 px — plus
   * que le formulaire qu'elles servent à remplir. Clavier ouvert, elles
   * passent sur une ligne qui défile, SANS qu'aucune option ne disparaisse.
   */
  it('replie les familles sur une ligne défilante quand le clavier est ouvert', () => {
    pretendKeyboard(330);
    render(
      <SegmentedControl
        label="Famille"
        layout="grid"
        value="grain"
        onChange={() => {}}
        options={FAMILLES}
      />
    );
    const group = screen.getByRole('radiogroup');
    expect(group.className).toContain('overflow-x-auto');
    expect(group.className).not.toContain('grid-cols');

    // Les cinq options restent atteignables : on gagne de la hauteur, pas des choix.
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    // Les précisions, elles, cèdent : elles doublaient la hauteur de chaque option.
    expect(screen.queryByText('Passe par la maische.')).toBeNull();
  });

  it('garde la grille sur ordinateur, clavier matériel ou non', () => {
    pretendTouchDevice(false);
    pretendKeyboard(330);
    render(
      <SegmentedControl
        label="Famille"
        layout="grid"
        value="grain"
        onChange={() => {}}
        options={FAMILLES}
      />
    );
    expect(screen.getByRole('radiogroup').className).toContain('grid');
  });
});

describe('La pastille rotative', () => {
  /*
   * ⚠️ Demandé mot pour mot : « j'aimerais que si j'appuie dessus ça change et
   * fait une rotation ». Ce qu'elle remplace sur une carte d'ingrédient : un
   * sélecteur pleine largeur avec son étiquette, répété huit fois.
   */
  const MOMENTS = ['firstWort', 'boil', 'whirlpool', 'dryHop'] as const;
  const NOMS: Record<(typeof MOMENTS)[number], string> = {
    firstWort: 'Premier moût',
    boil: 'Ébullition',
    whirlpool: 'Whirlpool',
    dryHop: 'À cru'
  };

  const Hote: React.FC = () => {
    const [v, setV] = useState<(typeof MOMENTS)[number]>('firstWort');
    return (
      <CycleTag
        name="Moment"
        value={v}
        options={MOMENTS}
        onChange={setV}
        label={(x) => NOMS[x]}
      />
    );
  };

  it('⚠️ tourne EN BOUCLE : après la dernière valeur, on revient à la première', () => {
    render(<Hote />);
    const tag = () => screen.getByRole('button');
    const vu: string[] = [tag().textContent!.trim()];
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(tag());
      vu.push(tag().textContent!.trim());
    }
    expect(vu).toEqual(['Premier moût', 'Ébullition', 'Whirlpool', 'À cru', 'Premier moût']);
  });

  /*
   * ⚠️ Sans nom accessible, un lecteur d'écran annonce « bouton Ébullition » :
   * on ne sait ni ce que l'étiquette désigne, ni qu'appuyer la change.
   */
  it('⚠️ dit ce qu’elle désigne ET ce que l’appui va faire', () => {
    render(<Hote />);
    expect(
      screen.getByRole('button', { name: /Moment : Premier moût — appuyer pour passer à Ébullition/ })
    ).toBeInTheDocument();
  });
});

/* ---------------------------------------------------------------------------
 * Le stock face à une recette qui répète un ingrédient
 * ------------------------------------------------------------------------ */

/** Une NEIPA qui emploie DEUX FOIS le même houblon — le cas qui a tout révélé. */
const RECETTE_NEIPA = {
    id: 'NEIPA',
    name: 'NEIPA',
    style: 'NEIPA',
    volumeL: 20,
    boilMin: 60,
    totalGristKg: 4,
    fermentables: [
      { name: 'Pilsner', weightKg: 4, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 37 }
    ],
    hops: [
      { name: 'Citra', weightG: 40, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 80 },
      { name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop', dayOffset: 3 }
    ],
    yeast: { name: 'US-05', form: 'seche', qty: 1, unit: 'sachet' },
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], spargeType: 'batch' },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 7 }],
    steps: [],
    notes: []
} as unknown as Recipe;

describe('Manques en stock', () => {
  const stock = (qty: number): StockItem[] =>
    [
      { id: 'h', ref: 'H', name: 'Citra', category: 'houblon', unit: 'g', currentStock: qty, minStock: 0, reorder: false },
      { id: 'm', ref: 'M', name: 'Pilsner', category: 'malt', unit: 'kg', currentStock: 25, minStock: 0, reorder: false },
      { id: 'l', ref: 'L', name: 'US-05', category: 'levure', unit: 'sachet', currentStock: 5, minStock: 0, reorder: false }
    ] as unknown as StockItem[];

  const ouvrirRecap = (qty: number) => {
    render(
      <BrewWizard
        seed={{ recipe: RECETTE_NEIPA }}
        stockItems={stock(qty)}
        config={{ ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig}
        knownStyles={['NEIPA']}
        onClose={() => {}}
        onCreateStockItem={() => null as unknown as StockItem}
        onLearnIngredient={() => {}}
        onSaveWaterSource={() => {}}
        onSave={() => {}}
      />
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Récapitulatif/ })[0]);
  };

  /*
   * ⚠️ LE défaut que le monkey a trouvé. Le Citra est au whirlpool ET à cru :
   * 40 g + 60 g = 100 g pour un seul sachet en réserve. En comparant chaque
   * ligne au stock séparément, 70 g couvraient « 40 » puis couvraient « 60 »,
   * et l'écran annonçait que tout était disponible. On ne s'en apercevait qu'au
   * houblonnage à cru, 30 g trop tard.
   */
  it('⚠️ cumule un houblon employé deux fois avant de le comparer au stock', () => {
    ouvrirRecap(70);
    expect(screen.getByText(/70 g \/ 100 g/)).toBeInTheDocument();
    expect(screen.queryByText(/Tout est disponible/)).not.toBeInTheDocument();
  });

  it('n’annonce le manque qu’une fois, avec le besoin total', () => {
    ouvrirRecap(70);
    expect(screen.getAllByText(/70 g \/ 100 g/)).toHaveLength(1);
    expect(screen.getByText(/70 g \/ 100 g/)).toBeInTheDocument();
  });

  it('se tait quand le stock couvre vraiment le besoin cumulé', () => {
    ouvrirRecap(120);
    expect(screen.getByText(/Tout est disponible/)).toBeInTheDocument();
  });
});

/* ---------------------------------------------------------------------------
 * Aucun champ anonyme, sur AUCUNE étape
 * ------------------------------------------------------------------------ */

describe('Nommage des champs de l’assistant', () => {
  /*
   * ⚠️ Trouvé en pilotant l'application, pas par un test : les champs de
   * température et de durée des paliers n'avaient aucun nom accessible. `Field`
   * posait bien une étiquette « Température (°C) », mais sans `htmlFor`, et le
   * champ n'avait pas d'identifiant — les deux ne se connaissaient pas.
   *
   * Ça ne se voyait pas à l'œil, et pourtant ça se SENTAIT : taper sur le
   * libellé ne donnait pas le focus au champ. Sur téléphone, où la cible utile
   * est justement le texte au-dessus de la case, ça se vit comme « le champ ne
   * répond pas ».
   *
   * Un test équivalent existait, mais seulement pour l'atelier de l'eau. Il
   * n'avait donc rien vu. Celui-ci parcourt toutes les étapes.
   */
  /*
   * ⚠️ Écrit pour verrouiller les paliers, ce test a révélé le même défaut sur
   * quatre autres étapes : les champs de recherche des listes déroulantes
   * n'avaient aucun nom, et trois champs de la levure non plus. `Combobox` et
   * `IngredientPicker` prennent désormais un `ariaLabel`, et les champs de la
   * levure passent par `InlineNum`, qui porte le sien.
   *
   * ⚠️ Le `placeholder` ne remplace pas un nom : sur ces listes il est REMPLACÉ
   * par le libellé de l'option choisie, donc le nom du champ changerait à
   * chaque sélection. Sur l'étape Identité il valait « NEIPA, Stout, Saison… »
   * — une liste d'exemples, pas un nom.
   */
  const ETAPES = ['Identité', 'Fermentescibles', 'Houblons', 'Levure', 'Paliers', 'Récapitulatif'];

  ETAPES.forEach((etape) => {
    it(`⚠️ étape ${etape} — chaque champ porte un nom`, () => {
      const { container } = render(
        <BrewWizard
          seed={{ recipe: RECETTE_NEIPA }}
          stockItems={[]}
          config={{ ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig}
          knownStyles={['NEIPA']}
          onClose={() => {}}
          onCreateStockItem={() => null as unknown as StockItem}
          onLearnIngredient={() => {}}
        onSaveWaterSource={() => {}}
          onSave={() => {}}
        />
      );
      // Le fil d'étapes est rendu deux fois (mobile et bureau) : le premier suffit.
      fireEvent.click(screen.getAllByRole('button', { name: new RegExp(etape) })[0]);

      const anonymes = [...container.querySelectorAll('input')]
        .filter((i) => i.type !== 'hidden' && i.type !== 'range')
        .filter((i) => {
          const parId = i.id ? container.querySelector(`label[for="${CSS.escape(i.id)}"]`) : null;
          return !(i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || parId);
        })
        .map((i) => `${i.name || i.type} · ${i.className.slice(0, 30)}`);

      expect(anonymes).toEqual([]);
    });
  });
});

/* ---------------------------------------------------------------------------
 * Créer une valeur absente de la liste
 * ------------------------------------------------------------------------ */

describe('Combobox — créer une valeur inédite', () => {
  /*
   * ⚠️ SIGNALÉ AINSI : « je peux pas créer de nouveaux style… ».
   *
   * La création FONCTIONNAIT — `onCreate` partait, le style était posé dans
   * l'état. Mais le champ affichait `options.find(o => o.value === value)`,
   * c'est-à-dire l'option de la liste portant la valeur courante. Or une valeur
   * qu'on vient de créer n'est justement PAS dans la liste : le champ retombait
   * à vide, placeholder compris. Rien à l'écran ne disait que ça avait marché,
   * donc on retapait, et on recréait.
   *
   * Une liste qui autorise la création doit savoir afficher une valeur qu'elle
   * ne connaît pas.
   */
  const Hote: React.FC = () => {
    const [v, setV] = useState('');
    return (
      <Combobox
        value={v}
        onChange={setV}
        onCreate={setV}
        allowCreate
        options={[{ value: 'Pilsner', label: 'Pilsner' }]}
        placeholder="NEIPA, Stout, Saison…"
        ariaLabel="Style de la bière"
        createLabel={(s) => `Nouveau style « ${s} »`}
      />
    );
  };

  it('⚠️ la valeur créée RESTE affichée dans le champ', () => {
    render(<Hote />);
    const champ = screen.getByLabelText('Style de la bière') as HTMLInputElement;

    fireEvent.click(champ);
    fireEvent.click(champ);
    fireEvent.change(champ, { target: { value: 'Lager' } });

    fireEvent.click(screen.getByText(/Nouveau style « Lager »/));

    expect(champ.value).toBe('Lager');
  });

  it('une valeur choisie dans la liste s’affiche aussi', () => {
    render(<Hote />);
    const champ = screen.getByLabelText('Style de la bière') as HTMLInputElement;

    fireEvent.click(champ);
    fireEvent.click(champ);

    /*
     * Pose du doigt puis relevé au même endroit — les options ne se choisissent
     * PAS sur `click` : elles distinguent un appui d'un défilement en comparant
     * la position entre `pointerdown` et `pointerup`.
     */
    const option = screen.getByText('Pilsner');
    fireEvent.pointerDown(option, { pointerType: 'touch', clientX: 40, clientY: 90 });
    fireEvent.pointerUp(option, { pointerType: 'touch', clientX: 40, clientY: 90 });
    fireEvent.click(option);

    expect(champ.value).toBe('Pilsner');
  });
});

/* ---------------------------------------------------------------------------
 * Le clavier sur ordinateur, le doigt sur téléphone
 * ------------------------------------------------------------------------ */

describe('Ajout d’un fermentescible — où va le curseur', () => {
  /*
   * ⚠️ Demandé ainsi : « pour les malts sur PC, je veux juste avoir à taper le
   * nom et la quantité au clavier ». Le nom se tapait déjà — la liste se valide
   * à Entrée — mais il fallait ensuite lâcher le clavier pour aller cliquer le
   * champ de poids. La quantité prend donc le focus dès que la ligne est montée.
   *
   * ⚠️ Et SEULEMENT au pointeur fin. Sur un téléphone, donner le focus à un
   * champ fait monter le clavier système par-dessus la liste qu'on vient
   * d'utiliser : le même geste qui accélère la saisie au clavier la gênerait au
   * doigt. C'est la moitié la plus facile à casser des deux — d'où ce test.
   */
  const monterAssistant = () =>
    render(
      <BrewWizard
        seed={{ recipe: RECETTE_NEIPA }}
        stockItems={[]}
        config={{ ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig}
        knownStyles={['NEIPA']}
        onClose={() => {}}
        onCreateStockItem={(name, category, unit) =>
          ({
            id: name,
            ref: 'X',
            name,
            category,
            unit,
            currentStock: 0,
            minStock: 0,
            reorder: false
          }) as StockItem
        }
        onLearnIngredient={() => {}}
        onSaveWaterSource={() => {}}
        onSave={() => {}}
      />
    );

  const ajouterUnMalt = () => {
    fireEvent.click(screen.getAllByRole('button', { name: /Fermentescibles/ })[0]);
    const combo = screen.getByLabelText(/Ajouter un fermentescible/i) as HTMLInputElement;
    fireEvent.click(combo);
    fireEvent.click(combo);
    fireEvent.change(combo, { target: { value: 'Munich' } });
    fireEvent.keyDown(combo, { key: 'Enter' });
  };

  it('⚠️ sur ORDINATEUR, la quantité prend le focus — on enchaîne au clavier', () => {
    pretendTouchDevice(false);
    monterAssistant();
    ajouterUnMalt();

    expect(document.activeElement).toHaveAttribute('aria-label', 'Quantité en kg');
  });

  it('⚠️ sur TÉLÉPHONE, rien ne prend le focus — le clavier ne monte pas', () => {
    pretendTouchDevice(true);
    monterAssistant();
    ajouterUnMalt();

    expect(document.activeElement).not.toHaveAttribute('aria-label', 'Quantité en kg');
  });
});
