import React, { useState } from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { SaltSolver, WaterState } from '../../src/ui/SaltSolver';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { defaultConfig } from '../../src/services/storage';
import { AppConfig, Recipe, StockItem } from '../../src/types';

/**
 * MONKEY TESTING : on tape au hasard, partout, et on regarde ce qui casse.
 *
 * ⚠️ Ce que ça attrape et que le reste ne voit pas. Les autres tests décrivent
 * des PARCOURS — on ouvre l'atelier, on pose un volume, on dose un sel. Ils
 * suivent tous l'ordre dans lequel un écran a été pensé. Les pannes, elles,
 * vivent dans les enchaînements que personne n'a imaginés : couper le rinçage
 * pendant qu'une feuille est ouverte, changer de style entre deux frappes,
 * écarter un sel puis vider son champ, faire tourner une pastille quatre fois
 * en écrasant le champ qu'elle vient de faire apparaître.
 *
 * TROIS RÈGLES DE CONSTRUCTION, sans lesquelles un monkey ne sert à rien :
 *
 *   1. **Il est REJOUABLE.** Le tirage vient d'une graine fixe. Un échec donne
 *      un numéro de graine et un journal d'actions : on relance exactement la
 *      même séquence pour la corriger. Un monkey qui échoue une fois sur dix
 *      sans qu'on puisse le refaire est une perte de temps.
 *   2. **Il ne teste pas la logique, il teste la SURVIE.** On ne vérifie pas
 *      que 4.5 g de gypse donnent 80 ppm de calcium — d'autres tests le font.
 *      On vérifie que l'écran reste debout et n'affiche jamais d'absurdité.
 *   3. **Il journalise ce qu'il fait.** Sans le journal, un échec dit « ça a
 *      planté » et rien de plus.
 */

afterEach(cleanup);

/** Générateur déterministe — même graine, même séquence, toujours. */
function alea(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ce qu'un pouce distrait tape vraiment dans un champ. */
const TEXTES = [
  '',
  '0',
  '5',
  '12,5',
  '12.5',
  '-3',
  'abc',
  '999999999999',
  '1e9',
  '  ',
  '0012',
  '1,2,3',
  '-'
];

/** Ce que l'écran ne doit jamais montrer, quelle que soit la séquence. */
const INTERDIT = /NaN|undefined|Infinity|\[object Object\]/;

/**
 * Les cris de React qui signalent un vrai défaut, pas du bruit.
 *
 * ⚠️ Sans ça le monkey est à moitié aveugle : React n'ARRÊTE pas le rendu quand
 * un champ passe de contrôlé à non contrôlé, il écrit une ligne dans la console
 * et continue. C'est pourtant la panne exacte que décrit « le champ ne répond
 * pas comme il faut » — le champ garde la dernière frappe, ignore l'état, et
 * plus rien ne le remet d'aplomb. Idem pour deux clés identiques dans une liste :
 * React réutilise le mauvais nœud, et l'on tape dans le houblon d'à côté.
 */
const CRIS = [
  /changing an? (?:un)?controlled input/i,
  /same key/i,
  /unique "?key"?/i,
  /Received NaN/i,
  /`?value`? prop on `?input`? should not be null/i,
  /Maximum update depth/i
];

/**
 * Un tour de singe : une action au hasard sur un élément au hasard.
 * Rend la description de ce qui a été fait, pour le journal.
 */
function unTour(racine: HTMLElement, rnd: () => number): string {
  const cibles = [
    ...racine.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [role="switch"], [role="tab"], [role="option"], select'
    )
  ];
  if (cibles.length === 0) return 'aucune cible';

  const el = cibles[Math.floor(rnd() * cibles.length)];
  const nom =
    el.getAttribute('aria-label') ||
    el.id ||
    (el.textContent || '').trim().slice(0, 24) ||
    el.tagName;

  const geste = Math.floor(rnd() * 10);

  if (el.tagName === 'INPUT' && geste < 6) {
    const input = el as HTMLInputElement;
    if (input.type === 'range') {
      const min = Number(input.min || 0);
      const max = Number(input.max || 100);
      const v = String(min + rnd() * (max - min));
      fireEvent.change(input, { target: { value: v } });
      return `curseur ${nom} ← ${v.slice(0, 6)}`;
    }
    const t = TEXTES[Math.floor(rnd() * TEXTES.length)];
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: t } });
    if (geste < 4) fireEvent.blur(input);
    return `champ ${nom} ← « ${t} »`;
  }

  if (geste === 6) {
    fireEvent.pointerDown(el, { pointerId: 1 });
    fireEvent.pointerUp(el, { pointerId: 1 });
    return `pointeur ${nom}`;
  }
  if (geste === 7) {
    fireEvent.keyDown(el, { key: ['Enter', 'Escape', 'ArrowDown', 'Tab'][Math.floor(rnd() * 4)] });
    return `touche sur ${nom}`;
  }

  fireEvent.click(el);
  return `clic ${nom}`;
}

/** Ce qui doit rester vrai après CHAQUE action. */
function verifier(racine: HTMLElement, journal: string[]) {
  const fin = () => journal.slice(-12).join('\n  ');

  const faute = (racine.textContent ?? '').match(INTERDIT);
  if (faute) {
    throw new Error(`L'écran affiche « ${faute[0]} » après :\n  ${fin()}`);
  }

  /*
   * ⚠️ Le contenu d'un champ n'est PAS dans textContent — il vit dans la
   * propriété `value` du nœud. Un `<input value="NaN">` passe donc invisible au
   * contrôle du dessus alors que c'est précisément la panne qu'on chasse.
   */
  for (const input of racine.querySelectorAll<HTMLInputElement>('input')) {
    const v = input.value;
    if (v && INTERDIT.test(v)) {
      const nom = input.getAttribute('aria-label') || input.id || input.name || 'sans nom';
      throw new Error(`Le champ « ${nom} » contient « ${v} » après :\n  ${fin()}`);
    }
  }

  if (racine.children.length === 0) {
    throw new Error(`L'écran s'est vidé après :\n  ${fin()}`);
  }
}

/**
 * Écoute les cris de React pendant une séquence.
 * Rend une fonction qui rétablit la console et lève si un cri a été poussé.
 */
function ecouterLaConsole(journal: string[]) {
  const vraiErreur = console.error;
  const cris: string[] = [];
  console.error = (...args: unknown[]) => {
    /*
     * React formate ses messages en `%s` + arguments. Les recoller tels quels
     * donne « two children with the same key, `%s` » — inexploitable. On
     * substitue pour lire LA clé en double, qui nomme la liste fautive.
     */
    const [modele, ...reste] = args;
    let i = 0;
    const msg =
      typeof modele === 'string'
        ? modele.replace(/%[sdoOi]/g, () => String(reste[i++] ?? ''))
        : args.map(String).join(' ');
    if (CRIS.some((r) => r.test(msg))) cris.push(msg.slice(0, 220));
    vraiErreur(...(args as []));
  };
  return () => {
    console.error = vraiErreur;
    if (cris.length > 0) {
      // Dédoublonné : un même défaut crie à chaque rendu, ça noierait le journal.
      const uniques = [...new Set(cris)];
      throw new Error(
        `React a crié ${cris.length} fois :\n  ${uniques.join('\n  ')}\n` +
          `Derniers gestes :\n  ${journal.slice(-12).join('\n  ')}`
      );
    }
  };
}

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
    const [noSparge, setNoSparge] = useState(false);
    return (
      <SaltSolver
        source={DEFAULT_WATER_SOURCE}
        onSourceChange={() => {}}
        beerEbc={12}
        beerVolumeL={30}
        brew={{
          grist: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage', colorEbc: 4 }],
          totalGristKg: 5,
          hops: [{ weightG: 30, stage: 'boil', timeMin: 60 }],
          ibu: 40,
          og: 1.05
        }}
        onMashRatioChange={() =>
          setState((s) => ({ ...s, mashWaterL: Math.max(1, s.mashWaterL) }))
        }
        state={state}
        onChange={setState}
        noSparge={noSparge}
        onNoSpargeChange={(off) => {
          setNoSparge(off);
          setState((s) => ({ ...s, spargeWaterL: off ? 0 : 10 }));
        }}
      />
    );
  };
  return render(<Hote />);
}

const RECETTE = {
  id: 'MONKEY',
  name: 'Essai',
  style: 'NEIPA',
  volumeL: 20,
  boilMin: 60,
  totalGristKg: 4,
  fermentables: [
    { name: 'Pilsner', weightKg: 4, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 37 },
    { name: 'Lactose', weightKg: 0.4, kind: 'lactose', use: 'ebullition' }
  ],
  hops: [
    { name: 'Magnum', weightG: 20, alpha: 12, stage: 'boil', timeMin: 60 },
    { name: 'Citra', weightG: 40, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 80 },
    { name: 'Citra', weightG: 60, alpha: 0, stage: 'dryHop', dayOffset: 3 }
  ],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' },
  mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], spargeType: 'batch' },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 7 }],
  steps: [],
  notes: []
} as unknown as Recipe;

function assistant() {
  return render(
    <BrewWizard
      seed={{ recipe: RECETTE }}
      stockItems={[]}
      config={{ ...defaultConfig, activeBrewhouseId: 'bh-30' } as AppConfig}
      knownStyles={['NEIPA', 'Stout']}
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
}

/** Lâche le singe sur un écran, et rend le journal si tout s'est bien passé. */
function lacherLeSinge(
  monter: () => { container: HTMLElement },
  graine: number,
  tours: number
) {
  const journal: string[] = [`graine ${graine}`];
  const rendreLaConsole = ecouterLaConsole(journal);
  try {
    const { container } = monter();
    const rnd = alea(graine);

    for (let i = 0; i < tours; i += 1) {
      try {
        journal.push(unTour(container, rnd));
      } catch (e) {
        throw new Error(
          `Le geste a jeté : ${(e as Error).message}\n  ${journal.slice(-12).join('\n  ')}`
        );
      }
      verifier(container, journal);
    }
  } catch (e) {
    /*
     * ⚠️ On rend la console SANS relayer les cris. Un `finally` qui lève écrase
     * l'erreur en cours : on perdrait le geste fautif — la vraie information —
     * au profit d'un avertissement React qui n'en est probablement que la
     * conséquence.
     */
    try {
      rendreLaConsole();
    } catch {
      /* le geste fautif prime */
    }
    throw e;
  }
  rendreLaConsole();
  return journal;
}

describe('Monkey — l’atelier de l’eau', () => {
  /*
   * Trois graines, pas une : une seule séquence ne visite qu'un chemin. Trois
   * suffisent à couvrir les enchaînements courants sans allonger la suite.
   */
  [1, 7, 42].forEach((graine) => {
    it(`survit à 250 gestes au hasard — graine ${graine}`, () => {
      const journal = lacherLeSinge(atelier, graine, 250);
      expect(journal.length).toBe(251);
    });
  });
});

describe('Monkey — l’assistant de recette', () => {
  [3, 11, 99].forEach((graine) => {
    it(`survit à 250 gestes au hasard — graine ${graine}`, () => {
      const journal = lacherLeSinge(assistant, graine, 250);
      expect(journal.length).toBe(251);
    });
  });
});
