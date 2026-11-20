// Ma levure, retour du brasseur du 19.11 (trois captures à 390, étape Levure 4/7) : « Il y a énormément de problème, même en terme de fluidité ».
// Sa recette : une lager, White Labs Munich Lager Yeast 500g (vendue par Lallemand Brewing), choisie après Andechs Lager (Brewing Science
// Institute), OG 1,026, deux paliers 19 °C puis 4 °C. Chaque test échouait sur la version qu'il a vue (LEV-1 à LEV-7, work/missions/BUGS.md).
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { doseDuFabricant, identiteLevure } from '../../../src/ui/etapeLevure/MaLevure';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign } from '../../../src/domain/yeastRecipeDesign';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { Recherche } from '../../../src/ui/etapeLevure/useRechercheDonnee';
import type { YeastChoiceChange } from '../../../src/ui/YeastRecipeChoice';
import { jourDeZurich } from '../../../src/services/enrichissementReglages';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

const MUNICH = 'yeast-lallemand-brewing-18635-06-13';
const refs = yeastReferences([]);
const munich = refs.find(r => r.id === MUNICH)!;
const andechs = refs.find(r => r.name === 'Brewing Science Institute · Andechs Lager')!;
/** La recette des captures (fixture : aucune donnée réelle). */
const lager = (): TrialRecipe => ({
  id: 'zz-lager-1911', name: 'ZZ TEST — Lager', style: '4A', volumeL: 25, boilMin: 60, ogTarget: 1.026, efficiencyPct: 75, colorEbc: 12,
  fermentables: [{ name: 'Pilsner', weightKg: 2.75, kind: 'grain', use: 'empatage', colorEbc: 4, potentialPpg: 37 }],
  hops: [{ name: 'Hallertau', alpha: 4, weightG: 60, stage: 'boil', timeMin: 60 }],
  yeast: { name: munich.name, hopIndexId: MUNICH, lab: 'Lallemand Brewing' },
  fermentation: [{ name: 'Fermentation principale', kind: 'primaire', tempC: 19, days: 10 }, { name: 'Garde froide', kind: 'garde', tempC: 4, days: 5 }],
} as unknown as TrialRecipe);
const changement = (r: TrialRecipe): YeastChoiceChange => ({ source: 'catalogue' as never, startedAt: Date.now(),
  from: { yeast: { name: andechs.name, hopIndexId: andechs.id } } as never, to: { yeast: structuredClone(r.yeast) } as never });

function Banc({ depart = lager(), changes = [] as TrialRecipe[], recherche, avecChangement = false }: { depart?: TrialRecipe; changes?: TrialRecipe[]; recherche?: Recherche; avecChangement?: boolean }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()}
    onChange={next => { changes.push(next); setRecipe(next); return next; }}
    stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={avecChangement ? changement(depart) : undefined} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} recherche={recherche} />;
}

describe('LEV-1 · le nom ne mêle plus deux marques', () => {
  it('« Lallemand Brewing · White Labs Munich Lager Yeast 500g » : la souche sans fabricant ni conditionnement, White Labs vendue par Lallemand', () => {
    render(<Banc />);
    const nom = document.querySelector('.lv-nom')!.textContent!;
    expect(nom).not.toMatch(/Lallemand/);
    expect(nom).not.toMatch(/500\s?g/);
    expect(nom).toMatch(/Munich Lager/);
    expect(document.querySelector('.lv-sub-t')!.textContent).toMatch(/White Labs · vendue par Lallemand/);
  });
  it('règle : le préfixe fabricant, le conditionnement, la marque d’un autre laboratoire', () => {
    expect(identiteLevure('Lallemand Brewing · White Labs Munich Lager Yeast Sachet 11g (Box of 25)', 'Lallemand Brewing')).toEqual({ nom: 'White Labs Munich Lager Yeast', marque: 'White Labs', vendeur: 'Lallemand' });
    expect(identiteLevure('Brewing Science Institute · Andechs Lager').nom).toBe('Andechs Lager');
    expect(identiteLevure('LalBrew Verdant IPA', 'Lallemand Brewing')).toEqual({ nom: 'LalBrew Verdant IPA', marque: 'Lallemand' });
    expect(identiteLevure('SafAle US-05', 'Fermentis')).toEqual({ nom: 'SafAle US-05', marque: 'Fermentis' });
  });
});

describe('LEV-2 · le bandeau du changement nomme la levure remplacée, sans se lire comme une troisième', () => {
  it('« Avant : Andechs Lager », pas « Depuis Brewing Science Institute · Andechs Lager »', () => {
    render(<Banc avecChangement />);
    const bandeau = document.querySelector('[data-lv="annuler"]')!.textContent!;
    expect(bandeau).toMatch(/Avant : Andechs Lager · non enregistré/);
    expect(bandeau).not.toMatch(/Depuis|Brewing Science Institute ·/);
  });
});

describe('LEV-3 · la conduite hors de la plage de la levure se cale d’un toucher', () => {
  it('19 °C pour une levure à 9–11 °C : alerte dans la bande, « → 11 °C » cale la primaire seule, « Rétablir » rend 19 °C', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc changes={changes} />);
    const cel = document.querySelector('[data-cel="temperature"]')!;
    expect(cel.hasAttribute('data-hors-plage')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /caler la fermentation principale à 11 °C/ }));
    const apres = changes.at(-1)!.fermentation!;
    expect(apres.map(p => p.tempC)).toEqual([11, 4]);                                  // la garde froide garde sa consigne
    expect(document.querySelector('[data-cel="temperature"]')!.hasAttribute('data-hors-plage')).toBe(false);
    fireEvent.click(document.querySelector('[data-lv="retablir"]')!);
    expect(changes.at(-1)!.fermentation!.map(p => p.tempC)).toEqual([19, 4]);
  });
});

describe('LEV-4 · FG et alcool cohérents avec l’atténuation de la fiche', () => {
  it('OG de la projection, atténuation 68–72 % : FG = OG − (OG − 1) × att., alcool ≈ (OG − FG) × 131,25', () => {
    const r = lager();
    const ev = evaluateYeastRecipeDesign(r, createYeastRecipeDraft(r, refs), refs);
    const og = ev.projection.og!, fg = ev.fg.range!, abv = ev.abv.range!;
    expect(fg.min).toBeCloseTo(og - (og - 1) * 0.72, 3);
    expect(fg.max).toBeCloseTo(og - (og - 1) * 0.68, 3);
    expect(abv.min).toBeGreaterThan((og - fg.max) * 131.25 - 0.15);
    expect(abv.max).toBeLessThan((og - fg.min) * 131.25 + 0.15);
  });
});

describe('LEV-5 · les données non documentées en une rangée, une seule recherche', () => {
  it('cinq inconnues : une rangée, un bouton ; un toucher = une recherche comptée une fois, chaque donnée en cours', async () => {
    let rendre: (r: Awaited<ReturnType<Recherche>>) => void = () => {};
    const lookup = vi.fn<Recherche>(() => new Promise(fin => { rendre = fin; }));
    render(<Banc recherche={lookup} />);
    expect(document.querySelectorAll('.lv-eff2 [data-genre="inconnu"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-axe-inconnu]').length).toBeGreaterThanOrEqual(4);
    const boutons = screen.getAllByRole('button', { name: /non documentés : chercher ces données/ });
    expect(boutons).toHaveLength(1);
    fireEvent.click(boutons[0]);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(`laffinee.rechercheDonnee.${jourDeZurich(Date.now())}`)).toBe('1');
    expect(document.querySelectorAll('[data-recherche="cours"]').length).toBeGreaterThanOrEqual(4);
    await React.act(async () => { rendre({ ok: true, facts: { technicalFacts: [{ key: 'pof', reported: 'négatif', source: 'test' } as never] } }); await Promise.resolve(); });
    expect(document.querySelector('[data-axe="phenols"] [data-recherche="a-confirmer"]')?.textContent).toMatch(/négatif/);
  });
});

describe('LEV-6 · la dose se lit sur la fiche du fabricant et se touche', () => {
  it('« 500g for up to 10 hL » à 25 L : « ≥ 13 g », pas « ? dose à saisir » ; toucher la dose ouvre son volet', async () => {
    render(<Banc />);
    const dose = document.querySelector('[data-lv="dose"]') as HTMLButtonElement;
    // 20.11 (r3 v05) : une brique de 500 g n'est pas un sachet ; l'en-tête dit « à choisir », la bande le conseil du fabricant.
    expect(dose.textContent).toBe('à choisir');
    expect(document.querySelector('[data-lv="bande-dose"]')!.textContent).toContain('≥ 13 g conseillé · sachet inconnu');
    fireEvent.click(dose);
    expect(await screen.findByText('éditeur dose (test)')).toBeTruthy();
  });
  it('règle : une plage en g/hL reste une plage ; sans fiche ni volume, rien', () => {
    const avec = (reported: string) => ({ ...munich, catalogue: { ...munich.catalogue!, facts: [{ key: 'pitchRate', reported } as never] } });
    expect(doseDuFabricant(avec('80-120 g/hL'), 20)).toMatchObject({ min: 16, max: 24 });
    expect(doseDuFabricant(avec('100 to 150 g/hl at ideally 12-15°C'), 30)).toMatchObject({ min: 30, max: 45 });
    expect(doseDuFabricant(avec('Directly pitchable into 5 gallons'), 20)).toBeUndefined();
    expect(doseDuFabricant(munich, undefined)).toBeUndefined();
  });
});

describe('LEV-7 · aucun volet empilé sous la carte (20.11, r4 v02)', () => {
  it('au repos, aucun volet ; « Offres » de la carte ouvre le produit et lui seul', async () => {
    render(<Banc />);
    expect(document.querySelectorAll('[data-repli]')).toHaveLength(0);
    fireEvent.click(document.querySelector('[data-lv="act-offres"]')!);
    expect([...document.querySelectorAll('[data-repli]')].map(d => d.getAttribute('data-repli'))).toEqual(['produit']);
  });
});
