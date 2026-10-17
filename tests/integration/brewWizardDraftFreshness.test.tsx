import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { readRecipeDraft, recipeServerBase, serializeRecipeDraft, writeRecipeDraft, type RecipeWizardDraft } from '../../src/services/recipeDraft';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import type { Recipe, StockItem } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
// Rendu lent à la demande (B1-s) : `serializeRecipeDraft` est appelé pendant le rendu du créateur ; une attente active le
// rallonge. Sans réglage, la fonction d'origine est appelée telle quelle.
vi.mock('../../src/services/recipeDraft', async importOriginal => {
  const original = await importOriginal<typeof import('../../src/services/recipeDraft')>();
  return { ...original, serializeRecipeDraft: (draft: Parameters<typeof original.serializeRecipeDraft>[0]) => {
    const ms = (globalThis as { __slowRenderMs?: number }).__slowRenderMs ?? 0;
    if (ms > 0) { const until = Date.now() + ms; while (Date.now() < until) { /* rendu lent */ } }
    return original.serializeRecipeDraft(draft);
  } };
});

const KEY = 'fixture-owner:REC-FRESH';
const STORAGE_KEY = `laffinee_recipe_draft_v1:${KEY}`;
const saved = (): Recipe => ({ ...yeastFlowRecipe(), id: 'REC-FRESH', name: 'Version serveur' });
const draftOf = (recipe: Recipe, serverBase?: string): RecipeWizardDraft => ({
  recipe: { ...recipe, name: 'Version brouillon' }, details: {}, step: 'identite',
  water: { diRatioPct: 0, styleCode: 'NEIPA', doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 15, spargeWaterL: 10, allSaltsInMash: true },
  volumesEdited: false, waterProfileAuto: false, targetBasis: 'recipe', mashRatioOverride: null,
  ...(serverBase === undefined ? {} : { serverBase }),
});
const wizard = (seed?: Recipe) => render(<BrewWizard draftKey={KEY} seed={seed ? { recipe: seed } : undefined}
  config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
  onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
const title = () => document.getElementById('wz-title') as HTMLInputElement | null;
const raw = () => localStorage.getItem(STORAGE_KEY);
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

afterEach(() => { cleanup(); localStorage.clear(); });

describe('#97 reprise d’un brouillon local face à la version enregistrée', () => {
  it('serveur inchangé : reprise silencieuse, comme avant', async () => {
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(saved(), recipeServerBase(saved()))));
    wizard(saved());
    expect(await screen.findByText('Brouillon repris sur cet appareil.')).toBeTruthy();
    expect(title()?.value).toBe('Version brouillon');
    expect(screen.queryByRole('button', { name: 'Reprendre le brouillon' })).toBeNull();
  });

  it('serveur changé : choix explicite avant l’éditeur, brouillon intact tant que rien n’est choisi', async () => {
    const before = { ...saved(), name: 'Version de départ' };
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    const kept = raw();
    wizard(saved());
    expect(await screen.findByRole('heading', { name: 'La recette enregistrée a changé' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ouvrir la version enregistrée' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reprendre le brouillon' })).toBeTruthy();
    expect(title()).toBeNull();
    await settle();
    expect(raw()).toBe(kept);
  });

  it('« Ouvrir la version enregistrée » : contenu serveur ; brouillon gardé jusqu’à la première modification', async () => {
    const before = { ...saved(), name: 'Version de départ' };
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    const kept = raw();
    wizard(saved());
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir la version enregistrée' }));
    expect(title()?.value).toBe('Version serveur');
    allerEtape(/Houblons/);
    allerEtape(/Identité/);
    await settle();
    expect(raw()).toBe(kept);
    fireEvent.change(title()!, { target: { value: 'Version serveur corrigée' } });
    await waitFor(() => expect(readRecipeDraft(KEY)?.recipe.name).toBe('Version serveur corrigée'));
    expect(readRecipeDraft(KEY)?.serverBase).toBe(recipeServerBase(saved()));
  });

  it('« Reprendre le brouillon » : contenu du brouillon ; la version vue devient la base', async () => {
    const before = { ...saved(), name: 'Version de départ' };
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    wizard(saved());
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre le brouillon' }));
    expect(title()?.value).toBe('Version brouillon');
    await waitFor(() => expect(readRecipeDraft(KEY)?.serverBase).toBe(recipeServerBase(saved())));
    expect(readRecipeDraft(KEY)?.recipe.name).toBe('Version brouillon');
  });

  it('ancien brouillon sans empreinte : même choix, présenté comme non vérifié', async () => {
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(saved())));
    const kept = raw();
    wizard(saved());
    expect(await screen.findByRole('heading', { name: 'Brouillon à vérifier' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reprendre le brouillon' })).toBeTruthy();
    expect(title()).toBeNull();
    await settle();
    expect(raw()).toBe(kept);
  });

  it('sans recette enregistrée : reprise silencieuse d’un brouillon de nouvelle recette', async () => {
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(saved())));
    wizard();
    expect(await screen.findByText('Brouillon repris sur cet appareil.')).toBeTruthy();
    expect(title()?.value).toBe('Version brouillon');
  });
});

describe('#97 navigation sans modification', () => {
  it('changer d’étape ne crée pas de brouillon ; la première modification le crée avec son empreinte', async () => {
    wizard(saved());
    allerEtape(/Houblons/);
    allerEtape(/Levure/);
    allerEtape(/Identité/);
    await settle();
    expect(raw()).toBeNull();
    fireEvent.change(title()!, { target: { value: 'Version serveur modifiée' } });
    await waitFor(() => expect(readRecipeDraft(KEY)?.recipe.name).toBe('Version serveur modifiée'));
    expect(readRecipeDraft(KEY)?.serverBase).toBe(recipeServerBase(saved()));
    allerEtape(/Houblons/);
    await waitFor(() => expect(readRecipeDraft(KEY)?.step).toBe('houblons'));
  });

  it('fermer après une simple navigation ne laisse aucun brouillon', async () => {
    const view = wizard(saved());
    allerEtape(/Houblons/);
    await settle();
    view.unmount();
    expect(raw()).toBeNull();
  });
});

/*
 * V3 n°1 (REV-WIZR, B1 et B2) : contrats repris des sondes du relecteur. Une modification vient d'un geste du
 * brasseur, quel qu'il soit (appui long, flèche, piste) ; un réglage automatique ne compte jamais, même après un toucher.
 */
const wait = (ms: number) => act(async () => { await new Promise(resolve => setTimeout(resolve, ms)); });
const malt = () => document.getElementById('wz-fermentable-0') as HTMLInputElement | null;
const maltPlus = () => within(malt()!.closest('.space-y-1') as HTMLElement).getAllByRole('button', { name: /^Ajouter .* kg$/ })[0];
const hold = async (button: HTMLElement) => {
  fireEvent.pointerDown(button, { button: 0 });
  await wait(1000);
  fireEvent.pointerUp(button, { button: 0 });
  fireEvent.click(button);
  await wait(0);
};
const allSteps = [/Fermentescibles/, /Houblons/, /Levure/, /^Paliers/, /Eau et sels/, /Récapitulatif/, /Identité/];

beforeAll(() => {
  // jsdom n'a pas la capture du pointeur ; le navigateur l'a.
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.setPointerCapture ??= () => undefined;
  proto.releasePointerCapture ??= () => undefined;
  proto.hasPointerCapture ??= () => false;
});

describe('#97 B1-s — une saisie dont le rendu est lent crée quand même le brouillon (sonde REV-WIZR wizrSlowRender)', () => {
  for (const ms of [250, 600]) {
    it(`saisie du nom avec un rendu de ${ms} ms (téléphone lent, grosse recette) : brouillon écrit`, async () => {
      const view = wizard(saved());
      const flags = globalThis as { __slowRenderMs?: number };
      const started = performance.now();
      flags.__slowRenderMs = ms;
      try { fireEvent.change(title()!, { target: { value: 'Version serveur modifiée lentement' } }); }
      finally { flags.__slowRenderMs = 0; }
      const renderMs = performance.now() - started;
      await wait(20);
      const shown = title()!.value;
      view.unmount();
      expect(renderMs).toBeGreaterThanOrEqual(ms);
      expect(shown).toBe('Version serveur modifiée lentement');
      expect(readRecipeDraft(KEY)?.recipe.name).toBe('Version serveur modifiée lentement');
    });
  }
});

describe('#97 V3 n°1 — tout geste réel du brasseur crée le brouillon (B1)', () => {
  it('appui long sur « + » (QuantityStepper) : brouillon écrit, fermer ne perd pas la quantité', async () => {
    const view = wizard(saved());
    allerEtape(/Fermentescibles/);
    await waitFor(() => expect(malt()).toBeTruthy());
    const before = malt()!.value;
    await hold(maltPlus());
    const after = malt()!.value;
    view.unmount();
    expect(after).not.toBe(before);
    expect(String(readRecipeDraft(KEY)?.recipe.fermentables[0]?.weightKg).replace('.', ',')).toBe(after);
  });

  it('appui long sur « Ajouter 0,5 g » d’un sel (useHoldRepeat de numericInput) : brouillon écrit', async () => {
    const view = wizard(saved());
    allerEtape(/Eau et sels/);
    const plus = (await screen.findAllByRole('button', { name: /^Ajouter 0,5 g de / }))[0];
    const field = screen.getByLabelText(plus.getAttribute('aria-label')!.replace(/^Ajouter 0,5 g de (.*)$/, 'Dose de $1 en grammes')) as HTMLInputElement;
    const before = field.value;
    await hold(plus);
    const after = field.value;
    view.unmount();
    expect(after).not.toBe(before);
    expect(readRecipeDraft(KEY)?.water.doses).toBeDefined();
    expect(Object.values(readRecipeDraft(KEY)!.water.doses).some(grams => grams > 0)).toBe(true);
  });

  it('flèche → au clavier sur « Type de rinçage » (SegmentedControl) : brouillon écrit', async () => {
    const view = wizard(saved());
    allerEtape(/Paliers/);
    const group = await screen.findByRole('radiogroup', { name: 'Type de rinçage' });
    const checked = () => within(group).getAllByRole('radio').find(radio => radio.getAttribute('aria-checked') === 'true')!;
    const before = checked().textContent;
    checked().focus();
    fireEvent.keyDown(checked(), { key: 'ArrowRight' });
    fireEvent.keyUp(document.activeElement ?? group, { key: 'ArrowRight' });
    await wait(0);
    expect(checked().textContent).not.toBe(before);
    view.unmount();
    expect(readRecipeDraft(KEY)?.recipe.mash?.spargeType).toBeDefined();
  });

  it('appui sur la piste SO₄ ⇄ Cl (RatioSlider) : brouillon écrit', async () => {
    const view = wizard(saved());
    allerEtape(/Eau et sels/);
    await wait(50);
    const track = document.querySelector('.ratio-track') as HTMLElement;
    expect(track).toBeTruthy();
    const before = (track.querySelector('input[type="range"]') as HTMLInputElement).value;
    fireEvent.pointerDown(track, { button: 0, clientX: 400 });
    fireEvent.pointerUp(track, { button: 0, clientX: 400 });
    fireEvent.click(track);
    await wait(0);
    const after = (document.querySelector('.ratio-track input[type="range"]') as HTMLInputElement).value;
    view.unmount();
    expect(after).not.toBe(before);
    expect(readRecipeDraft(KEY)?.water.ratioOverride).toBeDefined();
  });

  it('option de liste choisie par Entrée, événements natifs hors act : brouillon écrit', async () => {
    // Hors act(), React planifie son rendu comme dans le navigateur. Ce test ne reproduit pas le rendu tardif mesuré dans
    // Chrome (13 ms après Entrée, D7c) : le contrat « #97 ARB-97 — attribution sans horloge » (Entrée, rendu commencé
    // 300 ms plus tard) et le contrôle « #97 V3 B1-r » du banc émulateurs le discriminent.
    const view = render(<BrewWizard draftKey={KEY} seed={{ recipe: saved() }} config={defaultConfig} stockItems={[]}
      knownStyles={['Saison', 'Stout']} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
      onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    await wait(20);
    const input = screen.getByRole('combobox', { name: 'Style de la bière' }) as HTMLInputElement;
    const flags = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const actEnvironment = flags.IS_REACT_ACT_ENVIRONMENT;
    const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const key = (type: 'keydown' | 'keyup', value: string) => input.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true }));
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    flags.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      input.focus();
      await pause(20);
      let typed = '';
      for (const letter of 'Sai') {
        typed += letter;
        key('keydown', letter);
        setValue.call(input, typed);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        key('keyup', letter);
        await pause(30);
      }
      await pause(50);
      key('keydown', 'Enter');
      key('keyup', 'Enter');
      await pause(200);
    } finally { flags.IS_REACT_ACT_ENVIRONMENT = actEnvironment; }
    const shown = (screen.getByRole('combobox', { name: 'Style de la bière' }) as HTMLInputElement).value;
    view.unmount();
    expect(shown).toBe('Saison');
    expect(readRecipeDraft(KEY)?.recipe.style).toBe('Saison');
  });

  it('option de liste choisie par Entrée au clavier (Combobox du Style) : brouillon écrit (revue ciblée, B1-r)', async () => {
    const view = render(<BrewWizard draftKey={KEY} seed={{ recipe: saved() }} config={defaultConfig} stockItems={[]}
      knownStyles={['Saison', 'Stout']} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
      onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: 'Style de la bière' }) as HTMLInputElement;
    input.focus();
    let typed = '';
    for (const letter of 'Sai') {
      typed += letter;
      fireEvent.keyDown(input, { key: letter });
      fireEvent.change(input, { target: { value: typed } });
      fireEvent.keyUp(input, { key: letter });
    }
    await wait(20);
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyUp(input, { key: 'Enter' });
    await wait(20);
    const shown = (screen.getByRole('combobox', { name: 'Style de la bière' }) as HTMLInputElement).value;
    view.unmount();
    expect(shown).toBe('Saison');
    expect(readRecipeDraft(KEY)?.recipe.style).toBe('Saison');
  });
});

describe('#97 V3 n°1 — un réglage automatique ne crée ni ne remplace de brouillon (B2)', () => {
  it('toucher le nom sans rien taper, puis parcourir toutes les étapes (Récapitulatif compris) : aucun brouillon', async () => {
    const view = wizard(saved());
    fireEvent.pointerDown(title()!, { button: 0 });
    fireEvent.pointerUp(title()!, { button: 0 });
    fireEvent.click(title()!);
    for (const step of allSteps) { allerEtape(step); await wait(20); }
    await wait(50);
    expect(raw()).toBeNull();
    view.unmount();
    expect(raw()).toBeNull();
  });

  it('brouillon mis de côté intact après « Ouvrir la version enregistrée », un toucher et toutes les étapes', async () => {
    const before = { ...saved(), name: 'Version de départ' };
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    const kept = raw();
    const view = wizard(saved());
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir la version enregistrée' }));
    fireEvent.pointerDown(title()!, { button: 0 });
    fireEvent.pointerUp(title()!, { button: 0 });
    fireEvent.click(title()!);
    for (const step of allSteps) { allerEtape(step); await wait(20); }
    await wait(50);
    expect(raw()).toBe(kept);
    expect(screen.getByText(/Version enregistrée ouverte/)).toBeTruthy();
    view.unmount();
    expect(raw()).toBe(kept);
  });

  it.each([
    ['sans brouillon antérieur', false, false],
    ['après « Ouvrir la version enregistrée »', true, false],
    ['après « Ouvrir la version enregistrée », props renouvelées pendant l’enregistrement (comme l’App)', true, true],
  ])('%s : toucher, toutes les étapes, vraie modification puis enregistrement : brouillon effacé', async (_label, setAside, appLike) => {
    if (setAside) {
      const before = { ...saved(), name: 'Version de départ' };
      writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    }
    const editor = (recipe: Recipe, save: (recipe: Recipe) => Promise<void>) => <BrewWizard draftKey={KEY} seed={{ recipe }}
      config={{ ...defaultConfig }} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={save} onCreateStockItem={vi.fn()}
      onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />;
    const onSave = vi.fn(async (recipe: Recipe) => {
      await new Promise(resolve => setTimeout(resolve, 30));
      // The app re-renders the editor with the confirmed recipe and fresh arrays before the promise resolves.
      if (appLike) { view.rerender(editor(JSON.parse(JSON.stringify(recipe)), onSave)); await new Promise(resolve => setTimeout(resolve, 30)); }
    });
    const view = render(editor(saved(), onSave));
    if (setAside) fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir la version enregistrée' }));
    fireEvent.pointerDown(title()!, { button: 0 });
    fireEvent.pointerUp(title()!, { button: 0 });
    fireEvent.click(title()!);
    for (const step of allSteps) { allerEtape(step); await wait(20); }
    allerEtape(/Fermentescibles/);
    await waitFor(() => expect(malt()).toBeTruthy());
    fireEvent.change(malt()!, { target: { value: '7' } });
    await wait(20);
    expect(readRecipeDraft(KEY)?.recipe.fermentables[0]?.weightKg).toBe(7);
    allerEtape(/Récapitulatif/);
    await wait(50);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    await wait(100);
    expect(onSave).toHaveBeenCalledOnce();
    expect(raw()).toBeNull();
    view.unmount();
    expect(raw()).toBeNull();
  });

  it('complément automatique arrivé pendant l’enregistrement (stock renouvelé par l’App) : brouillon effacé quand même', async () => {
    // Banc ×6 (ARB-97) : un réglage automatique rendu entre le clic et la fin de l'enregistrement laissait le brouillon.
    const stock = [{ id: 'doc-mandarina', ref: 'H-MB', name: 'Mandarina Bavaria', category: 'Houblon', unit: 'g',
      currentStock: 100, minStock: 0, reorder: false, alphaPct: 8.5 }] as StockItem[];
    const seeded = saved();
    seeded.hops = seeded.hops.map(hop => hop.name === 'Mandarina Bavaria' ? { ...hop, stockItemRef: 'H-MB' } : hop);
    const editor = (stockItems: StockItem[], save: (recipe: Recipe) => Promise<void>) => <BrewWizard draftKey={KEY}
      seed={{ recipe: seeded }} config={defaultConfig} stockItems={stockItems} knownStyles={[]} onClose={vi.fn()} onSave={save}
      onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />;
    const onSave = vi.fn(async (_recipe: Recipe) => {
      if (onSave.mock.calls.length > 1) return;
      view.rerender(editor(stock, onSave));
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    const view = render(editor([], onSave));
    fireEvent.change(title()!, { target: { value: 'Version modifiée' } });
    allerEtape(/Récapitulatif/);
    await wait(50);
    expect(readRecipeDraft(KEY)?.recipe.name).toBe('Version modifiée');
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    await wait(150);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0].hops[1].alpha).toBe(0);
    const left = raw();
    const leftAlpha = readRecipeDraft(KEY)?.recipe.hops[1]?.alpha;
    // The completion did reach the editor after the click: a second save carries it.
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    await wait(20);
    expect(onSave.mock.calls[1]?.[0].hops[1].alpha).toBe(8.5);
    expect(left, `brouillon laissé : alpha ${leftAlpha}`).toBeNull();
    view.unmount();
  });

  it('« Ouvrir la version enregistrée », Récapitulatif puis « Enregistrer » sans modifier : brouillon mis de côté intact', async () => {
    const before = { ...saved(), name: 'Version de départ' };
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    const kept = raw();
    const onSave = vi.fn(async (_recipe: Recipe) => { await new Promise(resolve => setTimeout(resolve, 30)); });
    const view = render(<BrewWizard draftKey={KEY} seed={{ recipe: saved() }} config={defaultConfig} stockItems={[]}
      knownStyles={[]} onClose={vi.fn()} onSave={onSave} onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()}
      onSaveWaterSource={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir la version enregistrée' }));
    allerEtape(/Récapitulatif/);
    await wait(50);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette' }));
    await wait(100);
    expect(onSave).toHaveBeenCalledOnce();
    expect(raw()).toBe(kept);
    view.unmount();
    expect(raw()).toBe(kept);
  });

  it('après une vraie modification, le brouillon porte aussi les compléments automatiques', async () => {
    const view = wizard(saved());
    fireEvent.change(title()!, { target: { value: 'Version modifiée' } });
    for (const step of allSteps) { allerEtape(step); await wait(20); }
    await wait(50);
    view.unmount();
    const stored = readRecipeDraft(KEY)!;
    expect(stored.recipe.name).toBe('Version modifiée');
    // Le Récapitulatif complète la levure depuis les références locales : l'état complet est conservé.
    expect(saved().yeast.lab).toBeUndefined();
    expect(stored.recipe.yeast.lab).toBeTruthy();
  });
});

describe('#97 revue ciblée — Entrée sur un bouton de contenu qui n’écrit rien, puis complément automatique (B2-r)', () => {
  // Un bouton activé par Entrée agit dès le keydown (le navigateur envoie `click` aussitôt) ; jsdom ne le fait pas :
  // on rejoue keydown, click, l'appui humain, puis keyup.
  const enterOn = async (button: HTMLElement, heldMs: number) => {
    button.focus();
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);
    await wait(heldMs);
    fireEvent.keyUp(button, { key: 'Enter' });
    await wait(20);
  };

  for (const heldMs of [0, 80]) {
    it(`« Retour à la fiche de brassage » par Entrée (appui ${heldMs} ms) : Récapitulatif, aucun brouillon`, async () => {
      const view = wizard(saved());
      allerEtape(/Eau et sels/);
      await enterOn(await screen.findByRole('button', { name: /Retour à la fiche de brassage/ }), heldMs);
      expect(screen.queryByRole('button', { name: 'Enregistrer la recette' })).toBeTruthy();
      view.unmount();
      expect(raw()).toBeNull();
    });
  }

  it('brouillon mis de côté intact après Entrée sur « Retour à la fiche de brassage » (appui 80 ms)', async () => {
    const before = { ...saved(), name: 'Version de départ' };
    writeRecipeDraft(KEY, serializeRecipeDraft(draftOf(before, recipeServerBase(before))));
    const kept = raw();
    const view = wizard(saved());
    fireEvent.click(await screen.findByRole('button', { name: 'Ouvrir la version enregistrée' }));
    allerEtape(/Eau et sels/);
    await enterOn(await screen.findByRole('button', { name: /Retour à la fiche de brassage/ }), 80);
    view.unmount();
    expect(raw()).toBe(kept);
  });
});

/*
 * ARB-97 (décision 78) : une modification ne dépend pas du moment où React la rend. Hors act(), React planifie comme
 * dans le navigateur ; une tâche longue retarde le début du rendu (téléphone lent, grosse recette). Sondes de l'arbitre
 * `ARB-97/probes/wizrLateRenderStart.test.tsx`, cas 1 et 2.
 */
describe('#97 ARB-97 — attribution sans horloge', () => {
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const busy = (ms: number) => { const until = Date.now() + ms; while (Date.now() < until) { /* tâche longue */ } };
  const withoutAct = async (run: () => Promise<void>) => {
    const flags = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const actEnvironment = flags.IS_REACT_ACT_ENVIRONMENT;
    flags.IS_REACT_ACT_ENVIRONMENT = false;
    try { await run(); } finally { flags.IS_REACT_ACT_ENVIRONMENT = actEnvironment; }
  };
  const pointer = (target: Element, type: 'pointerdown' | 'pointerup') =>
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, pointerType: 'touch' }));

  it('style choisi par Entrée, rendu commencé 300 ms plus tard : brouillon écrit', async () => {
    const view = render(<BrewWizard draftKey={KEY} seed={{ recipe: saved() }} config={defaultConfig} stockItems={[]}
      knownStyles={['Saison', 'Stout']} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
      onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    await withoutAct(async () => {
      await pause(20);
      const input = screen.getByRole('combobox', { name: 'Style de la bière' }) as HTMLInputElement;
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      const key = (type: 'keydown' | 'keyup', value: string) => input.dispatchEvent(new KeyboardEvent(type, { key: value, bubbles: true, cancelable: true }));
      input.focus();
      await pause(20);
      let typed = '';
      for (const letter of 'Sai') {
        typed += letter;
        key('keydown', letter); setValue.call(input, typed); input.dispatchEvent(new Event('input', { bubbles: true })); key('keyup', letter);
        await pause(30);
      }
      await pause(50);
      key('keydown', 'Enter');
      key('keyup', 'Enter');
      // Le choix est rendu dans une microtâche, après la fin de cette tâche : 300 ms plus tard.
      busy(300);
      await pause(60);
    });
    const shown = (screen.getByRole('combobox', { name: 'Style de la bière' }) as HTMLInputElement).value;
    view.unmount();
    expect(shown).toBe('Saison');
    expect(readRecipeDraft(KEY)?.recipe.style).toBe('Saison');
  });

  it('appui long relâché juste après le premier tic, fil bloqué 300 ms : le tic affiché est dans le brouillon', async () => {
    const view = wizard(saved());
    allerEtape(/Fermentescibles/);
    await waitFor(() => expect(malt()).toBeTruthy());
    const plus = maltPlus();
    const before = malt()!.value;
    let released = false;
    // Premier tic de `QuantityStepper` (setInterval de 90 ms après 400 ms) : relâcher dans la même tâche, puis bloquer
    // le fil 300 ms. La mise à jour du tic, planifiée par une minuterie, est rendue après.
    const originalSetInterval = window.setInterval;
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => originalSetInterval(() => {
      if (typeof handler === 'function') handler(...args);
      if (!released) { released = true; pointer(plus, 'pointerup'); busy(300); }
    }, timeout)) as typeof window.setInterval;
    try {
      await withoutAct(async () => {
        pointer(plus, 'pointerdown');
        for (let waited = 0; !released && waited < 3000; waited += 50) await pause(50);
        // Two more timers: an overdue timer runs before React's render task, the next one after it.
        await pause(50);
        await pause(50);
      });
    } finally { window.setInterval = originalSetInterval; }
    const after = malt()!.value;
    view.unmount();
    expect(released).toBe(true);
    expect(after).not.toBe(before);
    expect(String(readRecipeDraft(KEY)?.recipe.fermentables[0]?.weightKg).replace('.', ',')).toBe(after);
  });

  it('clic sur l’option déjà choisie de « Type de rinçage », puis Récapitulatif : aucun brouillon', async () => {
    const view = wizard(saved());
    allerEtape(/Paliers/);
    const group = await screen.findByRole('radiogroup', { name: 'Type de rinçage' });
    const checked = () => within(group).getAllByRole('radio').find(radio => radio.getAttribute('aria-checked') === 'true')!;
    const before = checked().textContent;
    fireEvent.pointerDown(checked(), { button: 0 });
    fireEvent.pointerUp(checked(), { button: 0 });
    fireEvent.click(checked());
    await wait(20);
    expect(checked().textContent).toBe(before);
    allerEtape(/Récapitulatif/);
    await wait(50);
    expect(raw()).toBeNull();
    view.unmount();
    expect(raw()).toBeNull();
  });
});
