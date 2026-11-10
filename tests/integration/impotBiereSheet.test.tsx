import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImpotBiereSheet, positionRegle, platoDuCurseur, FORMATS_IMPOT } from '../../src/ui/production/ImpotBiereSheet';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { BEER_TAX_SOURCE, BAREME_IMPOT_BIERE } from '../../src/domain/finance/swissBeerTax';
import type { Batch } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));

// Pale Ale de septembre : 26,6 L conditionnés, sans densité notée (la fixture de la maquette p2b).
const annee = new Date().getFullYear();
const brassin = (over: Partial<Batch> = {}): Batch => ({ id: 'B12', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, volumePackagedL: 26.6, brewDate: `15.09.${annee}`, status: 'fermentation', ...over } as Batch);

let plans: unknown[] = [];
let profile: Record<string, unknown> = { annualProductionL: 1200 };
let fiscal: Record<string, unknown> = {};
beforeEach(() => {
  plans = []; profile = { annualProductionL: 1200 }; fiscal = {};
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile, plans, payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => ({ ...defaultConfig, fiscal: { ...defaultConfig.fiscal, ...fiscal } }) as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = (batch: Batch = brassin(), onNoteDensity = vi.fn()) => {
  render(<ImpotBiereSheet batch={batch} onClose={() => {}} onNoteDensity={onNoteDensity} />);
  return { onNoteDensity };
};
const txt = (id: string) => screen.getByTestId(id).textContent!.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const curseur = (value: number) => fireEvent.change(screen.getByRole('slider', { name: 'Degrés Plato du brassin' }), { target: { value: String(value) } });

describe('p2b : la règle des degrés (repos, densité inconnue)', () => {
  it('1. montre la règle hachurée, le curseur « 12 °P · exemple », 6,74 CHF, les formats et l’année', () => {
    ouvrir();
    expect(txt('ibr-puce')).toBe('densité à noter ›');
    expect(screen.getByTestId('ibr-regle')).toHaveAttribute('data-hachure', 'oui');
    expect(txt('ibr-curseur')).toBe('12 °P · exemple');
    expect(txt('ibr-litres')).toBe('ce brassin · 26,6 L attendus (estimé)');
    expect(txt('ibr-resultat')).toBe('6,74 CHF');
    expect(txt('ibr-fmt-33cl')).toBe('33 cl 0,08 CHF');
    expect(txt('ibr-fmt-75cl')).toBe('75 cl 0,19 CHF');
    expect(txt('ibr-fmt-fut')).toBe('fût 20 L 5,06 CHF');
    expect(txt('ibr-annee')).toContain('Sur l’année, si 1 200 L à 12 °P');
    expect(txt('ibr-annee')).toContain('~ 303,84');
    expect(txt('ibr-annee')).toContain('estimé · exemple');
    expect(screen.getByTestId('ibr-bande-normale')).toHaveAttribute('aria-current', 'true');
  });

  it('2. le curseur à 15 °P (annexe) : bande forte, 8,98, 0,11 / 0,25 / 6,75, ~ 405,12', () => {
    ouvrir();
    curseur(150);
    expect(txt('ibr-curseur')).toBe('15 °P · exemple');
    expect(txt('ibr-resultat')).toBe('8,98 CHF');
    expect(txt('ibr-fmt-33cl')).toBe('33 cl 0,11 CHF');
    expect(txt('ibr-fmt-75cl')).toBe('75 cl 0,25 CHF');
    expect(txt('ibr-fmt-fut')).toBe('fût 20 L 6,75 CHF');
    expect(txt('ibr-annee')).toContain('~ 405,12');
    expect(screen.getByTestId('ibr-bande-forte')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('ibr-bande-normale')).not.toHaveAttribute('aria-current');
  });

  it('3. les bornes du barème : 10,0 légère, 10,1 normale, 14,0 normale, 14,1 forte', () => {
    ouvrir();
    curseur(100); expect(txt('ibr-resultat')).toBe('4,49 CHF'); expect(screen.getByTestId('ibr-bande-legere')).toHaveAttribute('aria-current', 'true');
    curseur(101); expect(txt('ibr-resultat')).toBe('6,74 CHF'); expect(screen.getByTestId('ibr-bande-normale')).toHaveAttribute('aria-current', 'true');
    curseur(140); expect(txt('ibr-resultat')).toBe('6,74 CHF'); expect(screen.getByTestId('ibr-bande-normale')).toHaveAttribute('aria-current', 'true');
    curseur(141); expect(txt('ibr-resultat')).toBe('8,98 CHF'); expect(screen.getByTestId('ibr-bande-forte')).toHaveAttribute('aria-current', 'true');
  });

  it('4. densité notée : pas d’hachures, °P réel sans « exemple » ; déplacé, c’est une simulation', () => {
    ouvrir(brassin({ og: '1.048' }));
    expect(txt('ibr-puce')).toBe('densité notée 1,048 · 11,9 °P');
    expect(screen.getByTestId('ibr-regle')).toHaveAttribute('data-hachure', 'non');
    expect(txt('ibr-curseur')).toBe('11,9 °P');
    expect(txt('ibr-resultat')).toBe('6,74 CHF');
    expect(screen.getByRole('button', { name: 'Corriger la densité' })).toBeVisible();
    curseur(150);
    expect(txt('ibr-curseur')).toBe('15 °P · simulation');
    expect(txt('ibr-resultat')).toBe('8,98 CHF');
  });

  it('5. densité absurde : « à vérifier », hachures, rien tiré de cette densité', () => {
    ouvrir(brassin({ og: '1.001' }));
    expect(txt('ibr-puce')).toBe('densité à vérifier ›');
    expect(screen.getByTestId('ibr-regle')).toHaveAttribute('data-hachure', 'oui');
    expect(txt('ibr-curseur')).toBe('12 °P · exemple');
  });

  it('6. litres inconnus : « — », jamais 0 ; les formats restent lisibles', () => {
    ouvrir(brassin({ volumePackagedL: undefined }));
    expect(txt('ibr-litres')).toBe('ce brassin · litres à noter ›');
    expect(txt('ibr-resultat')).toBe('—');
    expect(screen.getByTestId('ibr-regle').textContent).not.toMatch(/0,00/);
    expect(txt('ibr-fmt-33cl')).toBe('33 cl 0,08 CHF');
  });

  it('7. la chaîne des litres : net saisi du dernier instantané, volume à brasser ignoré, conditionné prioritaire', () => {
    const plan = (source: string, createdAt = '2026-09-01T10:00:00Z') => ({ id: `P${createdAt}`, createdAt, brewEstimate: { batchId: 'B12', netVolumeL: 27, netVolumeSource: source } });
    plans = [plan('saisi')];
    const { } = ouvrir(brassin({ volumePackagedL: undefined }));
    expect(txt('ibr-litres')).toBe('ce brassin · 27 L attendus (estimé)');
    expect(txt('ibr-resultat')).toBe('6,84 CHF');
    cleanup();
    plans = [plan('volume-a-brasser')];
    ouvrir(brassin({ volumePackagedL: undefined }));
    expect(txt('ibr-litres')).toBe('ce brassin · litres à noter ›');
    cleanup();
    plans = [{ id: 'ancien', createdAt: '2026-08-01T10:00:00Z', brewEstimate: { batchId: 'B12', netVolumeL: 30 } }];
    ouvrir(brassin({ volumePackagedL: undefined }));
    expect(txt('ibr-litres')).toBe('ce brassin · litres à noter ›');
    cleanup();
    plans = [plan('saisi')];
    ouvrir();
    // Un brassin pas encore conditionné n'a que des litres attendus, même si la fixture porte un conditionné (constat 17).
    expect(txt('ibr-litres')).toBe('ce brassin · 26,6 L attendus (estimé)');
    cleanup();
    ouvrir(brassin({ status: 'conditionne' }));
    expect(txt('ibr-litres')).toBe('ce brassin · 26,6 L conditionnés');
    expect(txt('ibr-resultat')).toBe('6,74 CHF');
  });

  it('8. réduction petit brasseur : confirmée pour l’année du brassin (date suisse), sinon taux plein, dit', () => {
    fiscal = { beerTaxAnnualReductionPct: 20, beerTaxReductionYear: annee };
    ouvrir();
    expect(txt('ibr-resultat')).toBe('5,39 CHF');
    expect(txt('ibr-fmt-33cl')).toBe('33 cl 0,07 CHF');
    expect(txt('ibr-annee')).toContain('~ 243,07');
    expect(screen.getByTestId('ibr-reduction')).toHaveTextContent('20 % confirmée');
    cleanup();
    fiscal = { beerTaxAnnualReductionPct: 20, beerTaxReductionYear: annee - 1 };
    ouvrir();
    expect(txt('ibr-resultat')).toBe('6,74 CHF');
    expect(screen.getByTestId('ibr-reduction')).toHaveTextContent('non confirmée · taux plein');
    cleanup();
    fiscal = { beerTaxAnnualReductionPct: 55, beerTaxReductionYear: annee };
    ouvrir();
    expect(txt('ibr-resultat')).toBe('6,74 CHF');
  });

  it('8b. l’année d’un brassin planifié se lit depuis sa date prévue en JJ.MM.AAAA', () => {
    fiscal = { beerTaxAnnualReductionPct: 20, beerTaxReductionYear: 2031 };
    ouvrir(brassin({ brewDate: '', plannedBrewDate: '12.03.2031' }));
    expect(txt('ibr-resultat')).toBe('5,39 CHF');
    expect(screen.getByTestId('ibr-reduction')).toHaveTextContent('20 % confirmée');
  });

  it('9. bière sans alcool : exonérée, 0,00 CHF (un cas connu, pas un inconnu)', () => {
    ouvrir(brassin({ og: '1.048', abv: '0.4%' }));
    expect(txt('ibr-puce')).toContain('exonéré');
    expect(txt('ibr-resultat')).toBe('0,00 CHF');
    expect(txt('ibr-fmt-33cl')).toBe('33 cl 0,00 CHF');
  });

  it('10. au-delà de 20 °P : curseur collé à droite, vrai °P écrit, bande forte', () => {
    ouvrir(brassin({ og: '1.100' }));
    expect(screen.getByTestId('ibr-curseur').style.left).toBe('100%');
    expect(txt('ibr-curseur')).toMatch(/^23,8 °P/);
    expect(screen.getByTestId('ibr-bande-forte')).toHaveAttribute('aria-current', 'true');
  });

  it('11. sans production annuelle au profil : « — », jamais 1 200 inventé', () => {
    profile = {};
    ouvrir();
    expect(txt('ibr-annee')).toContain('production annuelle à indiquer');
    expect(txt('ibr-annee')).not.toMatch(/1 200/);
    expect(txt('ibr-annee')).toContain('—');
  });

  it('12. Quand, À qui, liens', () => {
    ouvrir();
    expect(screen.getByText('à la sortie de cave')).toBeVisible();
    expect(txt('ibr-sortie')).toBe('aucune sortie notée');
    expect(screen.getByText('déclarer sous 20 j, payer sous 30')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Taxas' })).toHaveAttribute('href', 'https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation');
    expect(screen.getByRole('link', { name: 'Directives OFDF' })).toHaveAttribute('href', BEER_TAX_SOURCE);
  });

  it('12b. un brassin conditionné : la même carte, en mots exacts et sans alerte', () => {
    ouvrir(brassin({ status: 'conditionne' }));
    expect(txt('ibr-sortie')).toBe('aucune sortie rattachée');
    expect(screen.getByTestId('ibr-sortie')).toHaveAttribute('data-ton', 'neutre');
  });

  it('13. le barème vient de la donnée : bandes = BAREME_IMPOT_BIERE ; le réglage de taux plein n’est jamais lu', () => {
    fiscal = { beerTaxFullRatePerHl: 99 };
    ouvrir();
    expect(txt('ibr-bande-legere')).toContain('16,88');
    expect(txt('ibr-bande-normale')).toContain('25,32');
    expect(txt('ibr-bande-forte')).toContain('33,76');
    expect(BAREME_IMPOT_BIERE.map(b => b.chfParHl)).toEqual([16.88, 25.32, 33.76]);
    expect(document.body.textContent).not.toMatch(/\b99\b/);
  });

  it('14. aucun champ numérique ; le réglage est un curseur ; « Comprendre le barème » est un pli fermé', () => {
    ouvrir();
    expect(document.querySelector('input[type="number"]')).toBeNull();
    const slider = screen.getByRole('slider', { name: 'Degrés Plato du brassin' });
    expect(slider).toHaveAttribute('aria-valuetext', '12 degrés Plato, exemple');
    const pli = screen.getByText('Comprendre le barème').closest('details')!;
    expect(pli).not.toHaveAttribute('open');
    fireEvent.click(screen.getByText('Comprendre le barème'));
    expect(pli).toHaveAttribute('open');
    expect(within(pli).getByText(/dès 14,1 °P/)).toBeInTheDocument();
    expect(within(pli).getByText(/TVA/)).toBeInTheDocument();
  });

  it('15. Copier : texte des montants affichés, puis refus du navigateur dit', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: ecrire }, configurable: true });
    ouvrir(brassin({ og: '1.048' }));
    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));
    await waitFor(() => expect(ecrire).toHaveBeenCalled());
    const texte = ecrire.mock.calls[0][0] as string;
    expect(texte).toContain('Pale Ale de septembre');
    expect(texte).toContain('26,6 L');
    expect(texte).toContain('11,9 °P');
    expect(texte).toContain('6,74 CHF');
    cleanup();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('refus')) }, configurable: true });
    ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Copier' }));
    expect(await screen.findByText(/Copie refusée/)).toBeVisible();
  });

  it('16. « Noter la densité » appelle la fiche', () => {
    const { onNoteDensity } = ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Noter la densité' }));
    expect(onNoteDensity).toHaveBeenCalledTimes(1);
  });

  it('16b. sans densité notée, le curseur part de l’OG visée de la recette (visée recette, hachures gardées)', () => {
    ouvrir(brassin({ recipeSnapshot: { ogTarget: 1.062 } as never }));
    expect(txt('ibr-curseur')).toBe('15,2 °P · visée recette');
    expect(screen.getByTestId('ibr-regle')).toHaveAttribute('data-hachure', 'oui');
    expect(txt('ibr-puce')).toBe('densité à noter ›');
    expect(txt('ibr-resultat')).toBe('8,98 CHF');
  });
});

describe('p2b : fonctions pures', () => {
  it('19. positionRegle et platoDuCurseur', () => {
    expect(positionRegle(0)).toBe(0);
    expect(positionRegle(12)).toBe(60);
    expect(positionRegle(20)).toBe(100);
    expect(positionRegle(23.7)).toBe(100);
    expect(positionRegle(Number.NaN)).toBeNull();
    expect(platoDuCurseur(119)).toBe(11.9);
    expect(FORMATS_IMPOT.map(f => f.volumeL)).toEqual([0.33, 0.75, 20]);
  });
});

// CP-14 (10.11, « Ça semble pas vraiment fonctionné ?? ») : Milk Stout, densité notée 1,062, litres jamais notés, production annuelle absente.
describe('CP-14 : chaque manque de la feuille renvoie où le saisir', () => {
  const milkStout = () => brassin({ id: 'LOT-001', name: 'Milk Stout', og: '1.062', volumeL: 30, volumePackagedL: undefined, status: 'termine' });
  it('litres manquants : « litres à noter › » et le bouton « Noter les litres » ouvrent la fiche', () => {
    const { onNoteDensity } = ouvrir(milkStout());
    expect(screen.queryByRole('button', { name: 'Corriger la densité' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Noter les litres' }));
    fireEvent.click(screen.getByRole('button', { name: /litres à noter/ }));
    expect(onNoteDensity).toHaveBeenCalledTimes(2);
  });
  it('production annuelle absente : le renvoi ouvre « Solde et paramètres financiers », paramètres dépliés', async () => {
    profile = {};
    ouvrir(milkStout());
    fireEvent.click(screen.getByRole('button', { name: /production annuelle à indiquer/ }));
    expect((await screen.findAllByText('Solde et paramètres financiers', {}, { timeout: 8000 })).length).toBeGreaterThan(0);
    expect(screen.getByText('Paramètres des prévisions et des brassins').closest('details')).toHaveAttribute('open');
  });
});
