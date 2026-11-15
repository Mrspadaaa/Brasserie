// Récapitulatif m2 (mission recette, voie port-recap) : la liste de contrôle et ses pistes portée dans l'assistant (étape 7/7) + RC-2.
// Rouge sur HEAD : `src/ui/recap/*` n'existe pas (import absent), et l'ancien récapitulatif n'a ni liste de rangées, ni piste, ni toile dans la rangée Eau.
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import { brewingStyles } from '../../src/domain/brewingStyles';
import { styleWaterForReference, styleIonRange } from '../../src/domain/waterStyles';
import { inferYeastRecipeStyle } from '../../src/domain/yeastRecipeDesign';
import { styleNomme } from '../../src/ui/recap/styleRecette';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const styles = brewingStyles();

describe('RC-2 : le style écrit en code atteint l’eau et la levure', () => {
  it('un code BJCP seul devient le nom du style qu’il désigne', () => {
    expect(styleNomme('21A', styles)).toBe('American IPA');
    expect(styleNomme(' 21a ', styles)).toBe('American IPA');
  });

  it('un nom, un alias, un code inconnu ou un texte libre restent tels quels', () => {
    expect(styleNomme('American IPA', styles)).toBe('American IPA');
    expect(styleNomme('West Coast IPA', styles)).toBe('West Coast IPA');
    expect(styleNomme('ZZ99', styles)).toBe('ZZ99');
    expect(styleNomme('Ma bière du jeudi', styles)).toBe('Ma bière du jeudi');
    expect(styleNomme('', styles)).toBe('');
  });

  it('l’eau vise 21A (SO₄ 175–300), pas « Équilibré » (50–120)', () => {
    expect(styleWaterForReference('21A').code).not.toBe('21A');
    const eau = styleWaterForReference(styleNomme('21A', styles));
    expect(eau.code).toBe('21A');
    expect(styleIonRange(eau, 'so4')).toMatchObject({ min: 175, max: 300 });
  });

  it('la levure reconnaît la famille du style (plus de « Style non reconnu »)', () => {
    const recette = (style: string) => ({ style, name: '', hops: [], fermentables: [], yeast: { name: 'US-05' } }) as never;
    expect(inferYeastRecipeStyle(recette('21A'))).toBe('unknown');
    expect(inferYeastRecipeStyle(recette(styleNomme('21A', styles)))).toBe('clean-ale');
  });
});

// ---------------------------------------------------------------------------------------------------------------- l'écran
const KEY = 'fixture-owner:REC-RC2';
const wizard = (style = '21A', extra: Record<string, unknown> = {}) => render(<BrewWizard draftKey={KEY} seed={{ recipe: { ...yeastFlowRecipe(), id: 'REC-RC2', style, ...extra } }}
  config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
  onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
const recap = (style?: string) => { const v = wizard(style); allerEtape(/^Récap/); return v; };
const liste = () => screen.getByRole('list', { name: 'Étapes de la recette' });
const rangee = (id: string) => liste().querySelector<HTMLElement>(`[data-rangee="${id}"]`)!;
const piste = (nom: string) => liste().querySelector<HTMLElement>(`[data-piste="${nom}"]`)!;
const aria = (nom: string) => piste(nom).getAttribute('aria-label') ?? '';
const nombre = (s: string) => Number(s.replace(',', '.'));

afterEach(() => { cleanup(); localStorage.clear(); });

describe('Récap m2 : les éléments de la maquette, au repos', () => {
  it('montre le verdict, six rangées dans l’ordre des étapes, la pesée et les sorties', () => {
    recap();
    const ver = document.querySelector('[data-element="m2-verdict"]')!;
    expect(ver.textContent).toMatch(/Enregistrable|Non enregistrable/);
    const rangs = [...liste().querySelectorAll<HTMLElement>('[data-rangee]')];
    expect(rangs.map(r => r.getAttribute('data-rangee'))).toEqual(['identite', 'fermentescibles', 'houblons', 'levure', 'paliers', 'eau']);
    expect(rangs.every(r => r.querySelector('summary'))).toBe(true);
    expect(screen.getByRole('button', { name: 'À peser : revoir l’eau' })).toBeInTheDocument();
    for (const nom of ['Copier le texte de la recette', 'Demander la relecture']) expect(screen.getByRole('button', { name: nom })).toBeInTheDocument();
    expect(document.querySelector('.rc2-plus summary')).toBeTruthy();
  });

  it('chaque rangée porte la piste de son style : EBC, IBU, FG, Alcool, SO₄ (plage du style 21A lue du référentiel)', () => {
    recap();
    for (const nom of ['EBC', 'IBU', 'FG', 'Alcool', 'SO₄']) expect(piste(nom), nom).toBeTruthy();
    expect(aria('IBU')).toMatch(/21A 40–70/);
    expect(aria('EBC')).toMatch(/21A 12–28/);
    expect(aria('FG')).toMatch(/21A 1,008–1,014/);
    expect(aria('Alcool')).toMatch(/21A 5,5–7,5 %/);
    expect(aria('SO₄')).toMatch(/Sulfate \d+ ppm, .*21A 175–300 ppm/);
  });

  it('RC-2 : une recette au style « 21A » en code atteint l’eau (cible 21A) et la levure (famille reconnue)', () => {
    recap('21A');
    expect(rangee('identite').textContent).toContain('American IPA');
    expect(rangee('identite').querySelector('[aria-label="style 21A"]')).toBeTruthy();
    expect(aria('SO₄')).toMatch(/21A 175–300/);
    expect(document.body.textContent).not.toMatch(/Style non reconnu/);
  });

  it('les valeurs sous les rangées sont celles du moteur : EBC et IBU égaux au bandeau', () => {
    recap();
    const bandeau = document.querySelector('.recipe-metrics')!.textContent!;
    const ebcBandeau = nombre(/EBC\s*([\d,]+)/.exec(bandeau)![1]);
    // Le bandeau dit « — » quand le moteur n’a pas d’IBU (jamais 0) : la piste dit alors « inconnu ».
    const ibuBandeau = /IBU(?: chaud)?\s*~?([\d,]+|—)/.exec(bandeau)![1];
    expect(nombre(/EBC ([\d,]+),/.exec(aria('EBC'))![1])).toBeCloseTo(ebcBandeau, 0);
    expect(/^IBU (\d+|inconnu),/.exec(aria('IBU'))![1]).toBe(ibuBandeau === '—' ? 'inconnu' : ibuBandeau);
  });

  it('une valeur inconnue n’est jamais 0 : aucune piste n’affiche NaN, undefined ou un zéro inventé', () => {
    recap();
    for (const nom of ['FG', 'Alcool', 'EBC', 'IBU', 'SO₄']) expect(`${piste(nom).textContent} ${aria(nom)}`, nom).not.toMatch(/NaN|undefined|Infinity/);
  });
});

describe('Récap m2 : la toile de l’eau dans la rangée Eau', () => {
  it('montre la toile d’ions dans le résumé de la rangée (pas dans un repli), avec ses six ions nommés, une seule fois', () => {
    recap();
    const toile = rangee('eau').querySelector('summary [data-element="m2-toile-eau"]')!;
    expect(toile).toBeTruthy();
    const svg = toile.querySelector('svg[role="img"]')!;
    expect(svg).toBeTruthy();
    for (const ion of ['Cl', 'SO₄', 'Ca', 'Mg', 'Na', 'HCO₃']) expect(svg.textContent, ion).toContain(ion);
    expect(rangee('eau').querySelectorAll('[data-element="m2-toile-eau"]')).toHaveLength(1);
  });
});

describe('Récap m2 : aucune fonction de l’ancien récapitulatif n’est perdue', () => {
  it('Identité : nom, style, volume, ébullition, carbonatation', () => {
    recap();
    for (const nom of ['Nom de la recette', 'Style', 'Volume', 'Ébullition', 'Carbonatation visée']) expect(screen.getByLabelText(nom), nom).toBeInTheDocument();
  });

  it('Malts, houblons, levure, paliers, eau : champs de masse, α, durée, quantité, atténuation, température, litres', () => {
    recap();
    expect(screen.getAllByLabelText(/^Masse de /).length).toBeGreaterThan(1);
    expect(screen.getAllByLabelText(/^Alpha de /).length).toBeGreaterThan(0);
    for (const nom of ['Quantité de levure', 'Atténuation', 'Durée de fermentation', 'Eau d’empâtage', 'Eau de rinçage']) expect(screen.getByLabelText(nom), nom).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Température du palier /).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /^Retirer / }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('button', { name: 'Retourner à l’atelier de l’eau' })).toBeInTheDocument();
    expect(screen.getByText('pH et chimie détaillée')).toBeInTheDocument();
  });

  it('corriger une masse dans la rangée la change (la fiche reste éditable sur place)', () => {
    recap();
    const champ = screen.getAllByLabelText(/^Masse de /)[0] as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '9' } });
    fireEvent.blur(champ);
    expect((screen.getAllByLabelText(/^Masse de /)[0] as HTMLInputElement).value).toMatch(/^9/);
  });

  it('Export, relecture, budget, texte complet : atteignables ; Fermentation et Déroulé s’ouvrent par Plus', () => {
    recap();
    expect(screen.getByRole('button', { name: 'Copier la recette en texte' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Faire relire la recette' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estimer le budget/ })).toBeInTheDocument();
    expect(screen.getByText('Texte complet et fichier .txt')).toBeInTheDocument();
    expect(screen.getByLabelText('Déroulé')).toBeInTheDocument();
    const plus = document.querySelector<HTMLElement>('.rc2-plus')!;
    const fermentation = document.querySelector<HTMLDetailsElement>('[data-aux="fermentation"] details')!;
    expect(fermentation.open).toBe(false);
    fireEvent.click(within(plus).getByRole('button', { name: 'Fermentation' }));
    expect(fermentation.open).toBe(true);
    const deroule = document.querySelector<HTMLDetailsElement>('[data-aux="deroule"] details')!;
    fireEvent.click(within(plus).getByRole('button', { name: 'Déroulé' }));
    expect(deroule.open).toBe(true);
  });

  it('Brasser (Plus) existe en plus des deux boutons du pied, qui restent ceux de l’assistant', () => {
    recap();
    expect(screen.getByRole('button', { name: 'Brasser maintenant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer la recette' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer et préparer un brassin' })).toBeInTheDocument();
  });
});

describe('Récap m2 : le geste de la Levure', () => {
  it('la rangée se déplie en place : unité (sachet | g), quantité au curseur, « Aller à Levure 4/7 »', () => {
    recap();
    rangee('levure').querySelector('details')!.open = true;
    const unite = within(rangee('levure')).getByRole('radiogroup', { name: 'Unité de la levure' });
    fireEvent.click(within(unite).getByRole('radio', { name: 'g' }));
    expect(within(unite).getByRole('radio', { name: 'g' })).toHaveAttribute('aria-checked', 'true');
    const curseur = within(rangee('levure')).getByLabelText('Curseur de quantité de levure') as HTMLInputElement;
    fireEvent.change(curseur, { target: { value: '40' } });
    expect((screen.getByLabelText('Quantité de levure') as HTMLInputElement).value).toMatch(/^40/);
    fireEvent.click(within(rangee('levure')).getByRole('button', { name: /^Aller à Levure/ }));
    expect(screen.getByRole('main', { name: 'Levure' })).toBeInTheDocument();
  });
});

// Corrections du 15.11 (pilote, capture 390 clair) : pistes à 0 px, vide sous le contenu, bouton « Plus » cassé.
// Cause des pistes : `recipe-wizard.css` (`[data-recipe-section] > summary > span` en baseline) l'emportait sur `recap.css` ; jsdom ne charge pas de CSS,
// donc la largeur réelle se prouve au banc Chrome (journal.json : pistes 156 px) ; ici : la structure, et la garde de la source CSS.
const css = readFileSync(`${process.cwd()}/src/ui/recap/recap.css`, 'utf8');
const pct = (s: string) => Number.parseFloat(s);

describe('Récap m2 : les pistes ont leur bande, leur point ou leur plage (pas un point seul)', () => {
  it('chaque piste porte sa bande du style (position et largeur > 0, dans 0–100 %) et, selon sa nature, un curseur ou une plage', () => {
    recap();
    for (const nom of ['EBC', 'IBU', 'FG', 'Alcool', 'SO₄']) {
      const p = piste(nom);
      const piste_ = p.querySelector<HTMLElement>('.rc2-tr')!;
      const bande = piste_.querySelector<HTMLElement>('u')!;
      expect(bande, `${nom} : bande du style`).toBeTruthy();
      expect(pct(bande.style.width), `${nom} : largeur de la bande`).toBeGreaterThan(0);
      expect(pct(bande.style.left) + pct(bande.style.width)).toBeLessThanOrEqual(100.01);
      const curseur = piste_.querySelector('b'); const plage = piste_.querySelector('s');
      // Une valeur inconnue n'a ni point ni plage (jamais 0) et le dit : sur la fixture, l'IBU de la Hefeweizen est inconnu.
      if (!/inconnu/.test(aria(nom))) expect(curseur || plage, `${nom} : point de la recette ou plage`).toBeTruthy();
      expect(p.querySelector('em')!.textContent).toBe(nom);
      expect(p.querySelector('.rc2-pg, .rc2-pv')!.textContent).toMatch(/\d|—/);
    }
    expect(piste('EBC').querySelector('.rc2-tr')!.className).toContain('rc2-ebc');
    // Plage FG / alcool de la levure : présente quand le moteur la connaît (au banc Chrome : 1,012–1,015 et 6,9–7,2 %), absente et dite « inconnu(e) » sinon, jamais 0.
    for (const nom of ['FG', 'Alcool']) {
      const plage = piste(nom).querySelector('.rc2-tr s');
      if (/inconnu/.test(aria(nom))) expect(plage).toBeNull(); else expect(plage).toBeTruthy();
    }
    expect(piste('SO₄').querySelector('.rc2-pd')!.textContent).toMatch(/^\d+$/);
  });

  it('la source CSS tient la pose des pistes contre `recipe-wizard.css` : rangée ≥ 52 px et colonne des pistes étirée, sous le préfixe `.rc2.rc2`', () => {
    expect(css).toMatch(/\.rc2\.rc2 details\.rc2-det > summary \{[^}]*min-height: 52px/);
    expect(css).toMatch(/\.rc2\.rc2 details\.rc2-det > summary > \.rc2-n \{[^}]*align-items: stretch/);
    expect(css).toMatch(/\.rc2-pi \{[^}]*grid-template-columns: 40px minmax\(0, 1fr\) 84px/);
  });
});

describe('Récap m2 : rien de caché ne garde sa hauteur', () => {
  it('la relecture est masquée par `display: none` (classe `rc2-cache`), jamais par visibility ni une hauteur gardée ; elle apparaît au toucher de « Relire »', () => {
    recap();
    const relec = document.querySelector<HTMLElement>('[data-rc2-relecture]')!;
    expect(relec.className).toContain('rc2-cache');
    expect(document.querySelectorAll('.rc2-cache').length).toBe(1);
    for (const el of document.querySelectorAll<HTMLElement>('[data-element="m2-recap"] *')) {
      expect(el.style.visibility, el.className).not.toBe('hidden');
      expect(el.style.height, el.className).not.toMatch(/^[1-9]\d{2,}px$/);
    }
    expect(css).not.toMatch(/visibility:\s*hidden/);
    expect(css).toMatch(/\.rc2\.rc2 \.rc2-cache \{ display: none; \}/);
    expect(css).toMatch(/\.rc2-aux:not\(:has\(details\[open\]\)\) \{ display: none; \}/);
    fireEvent.click(screen.getByRole('button', { name: 'Demander la relecture' }));
    expect(document.querySelector('[data-rc2-relecture]')!.className).not.toContain('rc2-cache');
  });

  it('les sections Fermentation, Stock et Déroulé sont des zones `rc2-aux` (display: none tant qu’aucune n’est ouverte)', () => {
    recap();
    for (const aux of ['fermentation', 'deroule']) expect(document.querySelector(`.rc2-aux[data-aux="${aux}"]`)).toBeTruthy();
    expect(document.querySelectorAll('.rc2-aux details[open]').length).toBe(0);
  });
});

describe('Récap m2 : la rangée Paliers', () => {
  it('deux paliers : « 67 °C 60′ mash-out 76 °C » et une mini-courbe qui les décrit (valeurs de la recette, pas de la maquette)', () => {
    wizard('21A', { mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }, { name: 'Mash-out', tempC: 76, durationMin: 10 }] } });
    allerEtape(/^Récap/);
    const texte = rangee('paliers').querySelector('.rc2-n > span')!.textContent!.replace(/\s+/g, ' ').trim();
    expect(texte.replace(/\s/g, '')).toBe('67°C60′mash-out76°C');
    const courbe = rangee('paliers').querySelector('svg[role="img"]')!;
    expect(courbe.getAttribute('aria-label')).toMatch(/67 °C.*76 °C/);
    expect(courbe.querySelector('path')!.getAttribute('d')!.split('L').length).toBeGreaterThanOrEqual(5);
  });
});

describe('Récap m2 : « Texte · Relire · Plus · à commander » sur une ligne', () => {
  it('les quatre sorties sont frères dans la même rangée, dans cet ordre, « Plus » sans chevron de fond ni pleine largeur', () => {
    recap();
    const out = document.querySelector<HTMLElement>('[data-element="m2-sorties"]')!;
    const noms = [...out.children].filter(e => !e.hasAttribute('hidden')).map(e => (e.tagName === 'DETAILS' ? e.querySelector('summary')!.textContent : e.textContent)!.trim().replace(/\s+/g, ' '));
    expect(noms[0]).toBe('Texte'); expect(noms[1]).toBe('Relire'); expect(noms[2]).toBe('Plus');
    expect(noms[3]).toMatch(/\d+ à commander/);
    expect(css).not.toMatch(/\.rc2-plus \{[^}]*flex-basis: 100%/);
    expect(css).toMatch(/\.rc2\.rc2 \.rc2-plus > summary[^{]*\{[^}]*background-image: none/);
  });
});
