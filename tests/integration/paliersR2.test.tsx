/**
 * Étape Paliers : la maquette r2 choisie (courbe d'empâtage, fermentation en lecture) portée dans l'assistant.
 * Rouge sur HEAD : `src/ui/paliers/*` n'existe pas, et l'ancien écran (tableau « Temps et conduite », champs toujours
 * visibles) n'a ni colonne de palier, ni poignée, ni interrupteur de mash-out, ni carte Fermentation cliquable.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { readRecipeDraft } from '../../src/services/recipeDraft';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import {
  colonnesDe, courbeFermentation, dureeTotale, echelleTemp, repartir,
} from '../../src/ui/paliers/modele';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const KEY = 'fixture-owner:REC-PAL';
const wizard = () => render(<BrewWizard draftKey={KEY} seed={{ recipe: { ...yeastFlowRecipe(), id: 'REC-PAL' } }}
  config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
  onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
const ouvrir = () => { const v = wizard(); allerEtape(/^Paliers$/); return v; };
const carte = () => screen.getByRole('region', { name: 'Courbe d\'empâtage' });
const colonnes = () => within(carte()).getAllByRole('button', { name: /^Palier \d/ });
const toucher = (rang: number) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Palier ${rang} `) }));
const total = () => carte().querySelector('[data-booster="duree-totale"]')!.textContent!;

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Paliers r2 : éléments de la maquette, au repos', () => {
  it('montre la carte Courbe d’empâtage : programme, total, colonnes par palier, « + » en fin de courbe', () => {
    ouvrir();
    expect(within(carte()).getByRole('button', { name: 'Programme d’empâtage' })).toBeInTheDocument();
    expect(total()).toMatch(/\d+ min/);
    expect(colonnes().length).toBeGreaterThanOrEqual(1);
    expect(within(carte()).getByRole('button', { name: /^Palier 2 · Saccharification, 66 °C, 60 min$/ })).toBeInTheDocument();
    expect(within(carte()).getByRole('button', { name: 'Ajouter un palier' })).toBeInTheDocument();
    expect(within(carte()).getByRole('group', { name: /^Courbe : 44 °C pendant 15 minutes/ })).toBeInTheDocument();
  });

  it('au repos, ni poignée ni champ de palier : ils n’apparaissent qu’après le toucher', () => {
    ouvrir();
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(screen.queryByRole('textbox', { name: /^Température du palier 1/ })).toBeNull();
    expect(screen.queryByRole('textbox', { name: /^Durée du palier 1/ })).toBeNull();
  });

  it('porte la ligne Mash-out (interrupteur), le Rinçage et la ligne Ensemencement repliée', () => {
    ouvrir();
    expect(screen.getByRole('switch', { name: 'Mash-out' })).toBeInTheDocument();
    const rincage = screen.getByRole('radiogroup', { name: 'Type de rinçage' });
    for (const nom of ['Par bacs', 'Continu', 'Aucun']) expect(within(rincage).getByText(nom)).toBeInTheDocument();
    const ens = screen.getByRole('button', { name: /^Ensemencement/ });
    expect(ens).toHaveAttribute('aria-expanded', 'false');
  });

  it('la carte Fermentation est une lecture tirée de la Levure : la toucher ouvre l’étape Levure', () => {
    ouvrir();
    // Fixture : primaire 18 °C 10 j + garde 4 °C 7 j = 17 jours, même source que l’étape Levure.
    const fer = screen.getByRole('button', { name: /^Fermentation, 17 jours, en lecture/ });
    fireEvent.click(fer);
    expect(screen.getByRole('main', { name: 'Levure' })).toBeInTheDocument();
  });
});

describe('Paliers r2 : le geste sur la courbe', () => {
  it('toucher un palier montre ses deux poignées et ses champs ; le retoucher les range', () => {
    ouvrir();
    toucher(1);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByRole('slider', { name: /^Température du palier 1/ })).toHaveAttribute('aria-valuenow', '44');
    expect(screen.getByRole('slider', { name: /^Durée du palier 1/ })).toHaveAttribute('aria-valuenow', '15');
    expect(screen.getByRole('textbox', { name: /^Température du palier 1/ })).toHaveValue('44');
    expect(screen.getByRole('textbox', { name: /^Durée du palier 1/ })).toHaveValue('15');
    toucher(1);
    expect(screen.queryAllByRole('slider')).toHaveLength(0);
  });

  it('saisir une température change la colonne, le total et le brouillon', async () => {
    ouvrir();
    toucher(1);
    const champ = screen.getByRole('textbox', { name: /^Température du palier 1/ });
    fireEvent.change(champ, { target: { value: '65,5' } });
    fireEvent.blur(champ);
    expect(screen.getByRole('button', { name: /^Palier 1 · .*, 65,5 °C, 15 min$/ })).toBeInTheDocument();
    await waitFor(() => expect(readRecipeDraft(KEY)!.recipe.mash!.steps[0].tempC).toBe(65.5));
  });

  it('une poignée se règle au clavier (flèche haut : la température monte)', () => {
    ouvrir();
    toucher(1);
    const poignee = screen.getByRole('slider', { name: /^Température du palier 1/ });
    fireEvent.keyDown(poignee, { key: 'ArrowUp' });
    expect(Number(screen.getByRole('slider', { name: /^Température du palier 1/ }).getAttribute('aria-valuenow'))).toBeGreaterThan(44);
  });

  it('le nom du palier se renomme depuis le bandeau', () => {
    ouvrir();
    toucher(1);
    fireEvent.change(screen.getByLabelText('Nom du palier 1'), { target: { value: 'Repos long' } });
    expect(screen.getByRole('button', { name: /^Palier 1 · Repos long, 44 °C, 15 min$/ })).toBeInTheDocument();
  });

  it('« + » ajoute un palier (67 °C, 30 min) et le touche ; × le retire, « Annuler » le rend', () => {
    ouvrir();
    const avant = colonnes().length;
    fireEvent.click(within(carte()).getByRole('button', { name: 'Ajouter un palier' }));
    expect(colonnes()).toHaveLength(avant + 1);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    // 14.11 « régression d'action » : le palier touché se retire au toucher (×), comme aujourd'hui.
    fireEvent.click(screen.getByRole('button', { name: /^Retirer le palier / }));
    expect(colonnes()).toHaveLength(avant);
    fireEvent.click(screen.getByRole('button', { name: /^Annuler/ }));
    expect(colonnes()).toHaveLength(avant + 1);
  });

  it('l’interrupteur Mash-out pose puis retire la colonne de fin de courbe (RC-6 : c’est un palier réglable)', () => {
    ouvrir();
    const interrupteur = screen.getByRole('switch', { name: 'Mash-out' });
    const avant = colonnes().length;
    const etaitActif = interrupteur.getAttribute('aria-checked') === 'true';
    fireEvent.click(interrupteur);
    expect(screen.getByRole('switch', { name: 'Mash-out' }).getAttribute('aria-checked')).toBe(String(!etaitActif));
    expect(colonnes()).toHaveLength(avant + (etaitActif ? -1 : 1));
    fireEvent.click(screen.getByRole('switch', { name: 'Mash-out' }));
    expect(colonnes()).toHaveLength(avant);
    expect(screen.getByRole('switch', { name: 'Mash-out' }).getAttribute('aria-checked')).toBe(String(etaitActif));
  });

  it('le menu de programme applique « Paliers lager » : 4 paliers dont le mash-out, rinçage continu conservé de la recette', () => {
    ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Programme d’empâtage' }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Programme d’empâtage' })).getByRole('option', { name: /Paliers lager/ }));
    expect(colonnes()).toHaveLength(4);
    expect(screen.getByRole('button', { name: /^Palier 1 · Repos protéique, 52 °C, 20 min$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Programme d’empâtage' })).toHaveTextContent('Paliers lager');
    expect(screen.getByRole('switch', { name: 'Mash-out' })).toHaveAttribute('aria-checked', 'true');
  });

  it('une valeur effacée désigne le palier fautif et se signale sans NaN', () => {
    ouvrir();
    toucher(1);
    const champ = screen.getByRole('textbox', { name: /^Température du palier 1/ });
    fireEvent.change(champ, { target: { value: '' } });
    fireEvent.blur(champ);
    expect(screen.getByRole('button', { name: /^Palier 1 · .*, température à renseigner, 15 min$/ })).toBeInTheDocument();
    expect(carte()).not.toHaveTextContent(/NaN|undefined|Infinity/);
  });
});

describe('Paliers r2 : rinçage et ensemencement gardent leurs actions', () => {
  it('le type de rinçage se choisit', () => {
    ouvrir();
    const groupe = screen.getByRole('radiogroup', { name: 'Type de rinçage' });
    fireEvent.click(within(groupe).getByText('Aucun'));
    expect(within(screen.getByRole('radiogroup', { name: 'Type de rinçage' })).getByRole('radio', { name: 'Aucun' })).toBeChecked();
  });

  it('l’Ensemencement déplié porte les choix de refroidissement et le programme de fermentation', () => {
    ouvrir();
    const ens = screen.getByRole('button', { name: /^Ensemencement/ });
    fireEvent.click(ens);
    expect(ens).toHaveAttribute('aria-expanded', 'true');
    const corps = document.getElementById('pal-ens-corps')!;
    expect(within(corps).getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(corps.textContent).toMatch(/Programme de fermentation|Ale|Lager|NEIPA/);
  });
});

describe('Paliers r2 : le modèle de la courbe', () => {
  it('répartit les largeurs de la maquette (60 / 21 / 10 min) en ≈ 198 / 69 / 34 px, minimum tactile 34', () => {
    const l = repartir([{ minutes: 60, min: 34, nominal: 34 }, { minutes: 21, min: 24, nominal: 40 }, { minutes: 10, min: 34, nominal: 34 }]);
    expect(l[0]).toBeGreaterThan(190); expect(l[0]).toBeLessThan(205);
    expect(l[1]).toBeGreaterThan(64); expect(l[1]).toBeLessThan(74);
    expect(l[2]).toBeGreaterThanOrEqual(34);
    expect(l.reduce((s, w) => s + w, 0)).toBeLessThanOrEqual(300.01);
  });

  it('l’échelle des températures est 50-80 °C, élargie par dizaines si un palier sort (repos protéique, froment)', () => {
    expect(echelleTemp([52, 63, 72])).toEqual({ min: 50, max: 80 });
    expect(echelleTemp([45, 63, 72]).min).toBe(40);
    expect(echelleTemp([66, 85]).max).toBe(90);
    expect(echelleTemp([])).toEqual({ min: 50, max: 80 });
  });

  it('le total compte maintiens et montées ; une durée inconnue n’est jamais 0', () => {
    const cols = colonnesDe([
      { name: 'A', tempC: 52, durationMin: 20 }, { name: 'B', tempC: 63, durationMin: 40, rampMin: 5 }, { name: 'Mash-out', tempC: 76, durationMin: 10, rampMin: 6 },
    ], 3);
    expect(dureeTotale(cols)).toEqual({ minutes: 81, montees: true });
    expect(dureeTotale(colonnesDe([{ name: 'A', tempC: 52 }], 1)).minutes).toBeUndefined();
    expect(dureeTotale([]).minutes).toBeUndefined();
  });

  it('la courbe de fermentation en lecture : 19 °C 9 j puis 4 °C 3 j = 12 j, froid distingué ; un inconnu ne trace rien', () => {
    const c = courbeFermentation([{ tempC: 19, days: 9 }, { tempC: 4, days: 3 }]);
    expect(c.jours).toBe(12);
    expect(c.segments.map(s => s.froid)).toEqual([false, true]);
    expect(c.segments[0].x2 - c.segments[0].x1).toBeGreaterThan(c.segments[1].x2 - c.segments[1].x1);
    const vide = courbeFermentation([{ tempC: undefined, days: 5 }]);
    expect(vide.segments).toHaveLength(0);
  });
});

describe('Paliers r2 : corrections de la critique du 14.11 (n° 2, 3, 6, 8)', () => {
  const retirerBouton = () => screen.getByRole('button', { name: /^Retirer le palier / });

  it('n° 2 : le palier touché se retire par un « × » à cible de 44 px, nommé « Retirer le palier »', () => {
    ouvrir();
    toucher(1);
    expect(retirerBouton()).toHaveClass('pal-retirer');
    const css = readFileSync(resolve(__dirname, '../../src/ui/paliers/paliers.css'), 'utf8');
    // La règle qui compte est celle qui bat `.recipe-wizard button` (hauteur auto, 28 px mini) : mesurée à 28 px de haut avant (capture du 14.11).
    expect(css).toMatch(/\.recipe-wizard\.recipe-wizard \.pal-reg \.pal-retirer\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*min-height:\s*44px/);
    // Le mash-out (interrupteur) et un palier non touché n'ont pas de « × ».
    toucher(1);
    expect(screen.queryByRole('button', { name: /^Retirer le palier / })).toBeNull();
  });

  it('n° 3 : pendant le glissé de la température, le bandeau suit la bulle (valeur du doigt), puis le lâcher l’écrit', async () => {
    ouvrir();
    toucher(1);
    const poignee = screen.getByRole('slider', { name: /^Température du palier 1/ });
    expect(screen.getByRole('textbox', { name: /^Température du palier 1/ })).toHaveValue('44');
    fireEvent.pointerDown(poignee, { pointerId: 1, clientX: 100, clientY: 200 });
    fireEvent.pointerMove(poignee, { pointerId: 1, clientX: 100, clientY: 120 });
    const bulle = carte().querySelector('.pal-bulle')!.textContent!;
    const vu = Number(bulle.replace(/[^\d,]/g, '').replace(',', '.'));
    expect(vu).toBeGreaterThan(44);
    expect(screen.getByRole('textbox', { name: /^Température du palier 1/ })).toHaveValue(String(vu).replace('.', ','));
    expect(screen.getByRole('button', { name: /^Palier 1 · .*, 44 °C/ })).toBeInTheDocument(); // le brouillon n'est pas encore touché
    fireEvent.pointerUp(poignee, { pointerId: 1, clientX: 100, clientY: 120 });
    await waitFor(() => expect(readRecipeDraft(KEY)!.recipe.mash!.steps[0].tempC).toBe(vu));
  });

  it('n° 3 : pendant le glissé de la durée, le bandeau et le total suivent le doigt', () => {
    ouvrir();
    toucher(2);
    const avant = Number(total().replace(/[^\d]/g, ''));
    const poignee = screen.getByRole('slider', { name: /^Durée du palier 2/ });
    fireEvent.pointerDown(poignee, { pointerId: 1, clientX: 100, clientY: 272 });
    fireEvent.pointerMove(poignee, { pointerId: 1, clientX: 160, clientY: 272 });
    const bulle = Number(carte().querySelector('.pal-bulle')!.textContent!.replace(/[^\d]/g, ''));
    expect(bulle).toBeGreaterThan(60);
    expect(screen.getByRole('textbox', { name: /^Durée du palier 2/ })).toHaveValue(String(bulle));
    expect(Number(total().replace(/[^\d]/g, ''))).toBe(avant + (bulle - 60));
    fireEvent.pointerCancel(poignee, { pointerId: 1 });
    expect(screen.getByRole('textbox', { name: /^Durée du palier 2/ })).toHaveValue('60');
  });

  it('n° 6 : l’avis « retiré · Annuler » disparaît dès le geste suivant (ajout, toucher) ; il revient à un nouveau retrait', () => {
    ouvrir();
    fireEvent.click(within(carte()).getByRole('button', { name: 'Ajouter un palier' }));
    fireEvent.click(retirerBouton());
    expect(screen.getByRole('button', { name: /^Annuler/ })).toBeInTheDocument();
    fireEvent.click(within(carte()).getByRole('button', { name: 'Ajouter un palier' }));
    expect(screen.queryByRole('button', { name: /^Annuler le retrait/ })).toBeNull();
    expect(carte()).not.toHaveTextContent(/retiré/);
    // Un toucher suffit aussi.
    return new Promise<void>(fin => setTimeout(() => {
      fireEvent.click(retirerBouton());
      expect(screen.getByRole('button', { name: /^Annuler le retrait/ })).toBeInTheDocument();
      toucher(1);
      expect(screen.queryByRole('button', { name: /^Annuler le retrait/ })).toBeNull();
      fin();
    }, 600));
  });

  it('n° 8 : un palier seul sur l’axe garde sa durée, touché ou non', () => {
    ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Programme d’empâtage' }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Programme d’empâtage' })).getByRole('option', { name: /Infusion simple/ }));
    const interrupteur = screen.getByRole('switch', { name: 'Mash-out' });
    if (interrupteur.getAttribute('aria-checked') === 'true') fireEvent.click(interrupteur);
    expect(colonnes()).toHaveLength(1);
    const durees = () => [...carte().querySelectorAll('svg.pal-g text')].map(t => t.textContent);
    expect(durees()).toContain('60′');
    toucher(1);
    expect(durees()).toContain('60′'); // touché, il le garde (la maquette ne le retire que s'il y a d'autres colonnes)
  });
});
