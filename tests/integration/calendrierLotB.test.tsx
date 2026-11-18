/**
 * Lot B des choix du 18.11 (SPEC-BRASSEUR, « Courbe et frise : deux axes de temps » et « Glisser qui zoome la courbe ; cacher la courbe »),
 * un point par bloc :
 * 1. D387, CAL-DEUX-AXES : un interrupteur de l'en-tête aligne la courbe sur la frise (même x pour une même date, toutes périodes et vue Jour) ;
 *    éteint, l'année et le cadre ; le chiffre « à dépenser » garde sa règle ; le choix se garde ;
 * 2. D388, CAL-ZOOM-GLISSER : pendant le glisser, la courbe zoomée sur les colonnes de la frise, l'avant en pointillé, « si tu lâches en Sxx :
 *    … → … », l'écart, la colonne d'arrivée ; au lâcher elle revient ;
 * 3. D389, CAL-CACHER-COURBE : un bouton de l'en-tête cache la courbe ; seule la bande de l'axe reste ; un second toucher la rend ; gardé.
 */
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const etat = vi.hoisted(() => ({
  profile: { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-01-01', amountCents: 400_000, confirmed: true } } as unknown
}));
vi.mock('../../src/services/financeService', () => {
  const FinanceService = {
    getPayments: () => [], getPlans: () => [], getProfile: () => etat.profile, getAssets: () => [], getClosings: () => [],
    snapshot: () => ({ profile: etat.profile, plans: [], payments: [], assets: [], closings: [] }), savePlan: () => undefined
  };
  return { FinanceService };
});
import { EnTeteCalendrier, type EnTeteCalendrierProps, type ModeleEnTete } from '../../src/ui/calendrier/entete/EnTete';
import { periodeDeFenetre, type FenetreSemaines } from '../../src/ui/calendrier/entete/Fenetre';
import { ajouterJours, semainesDe } from '../../src/domain/calendrier';
import { courbeCaisse, courbeDecalee, creuxDepuis, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { alignerSemaines, xDeDate } from '../../src/ui/calendrier/entete/alignement';
import { chf } from '../../src/ui/calendrier/entete/Courbe';
import { colonnesDeLAxe } from '../../src/ui/calendrier/echelle';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';

const LUNDI0 = '2026-11-16'; // S47
const jour = (s: number) => ajouterJours(LUNDI0, s * 7 + 2);
const mouvements: MouvementCaisse[] = [
  { id: 'm0', jour: jour(0), centimes: -14800, nom: 'Malt' },
  { id: 'm4', jour: jour(4), centimes: 91000, nom: 'Marché de Noël', choseId: 'c-noel' },
  { id: 'm12', jour: jour(12), centimes: -90000, nom: 'Hotte' },
  { id: 'm21', jour: jour(21), centimes: -280000, nom: 'Embouteilleuse' },
  { id: 'm32', jour: jour(32), centimes: 245000, nom: 'Festival' }
];
const courbe = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements, mises: [] })!;
const modele = (): ModeleEnTete => ({ semaines: semainesDe(LUNDI0, 52), courbe, creux: creuxDepuis(courbe), retards: [], sansDate: [], icones: [] });

function Banc(p: Partial<EnTeteCalendrierProps>) {
  const [fen, setFen] = useState<FenetreSemaines>({ du: LUNDI0, semaines: 6 });
  const [mv, setMv] = useState(false);
  return (
    <EnTeteCalendrier modele={modele()} fenetre={fen} onFenetre={setFen} periode={periodeDeFenetre(fen)} onPeriode={() => undefined}
      vue="semaines" onVue={() => undefined} mouvements={mv} onMouvements={setMv} orientation="portrait" largeurColonne={65} {...p} />
  );
}
const semainesCourbe = (c: HTMLElement) => (c.querySelector('.ent-cb')?.getAttribute('data-courbe-semaines') ?? '').split(' ').filter(Boolean);
const cle = () => screen.getByRole('button', { name: /CHF à dépenser/ }).getAttribute('aria-label');

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('1. D387 : la courbe alignée sur la frise, ou l’année', () => {
  it('l’interrupteur est dans l’en-tête ; éteint, l’année et le cadre ; allumé, les seules semaines de la frise, sans cadre ; le chiffre ne change pas', () => {
    const onAligne = vi.fn();
    const { container, rerender } = render(<Banc aligne={false} onAligne={onAligne} />);
    const inter = screen.getByRole('switch', { name: 'Aligner la courbe sur la frise' });
    expect(inter.getAttribute('aria-checked')).toBe('false');
    expect(semainesCourbe(container)).toHaveLength(52);
    expect(container.querySelector('.ent-cadre')).not.toBeNull();
    const chiffre = cle();
    fireEvent.click(inter);
    expect(onAligne).toHaveBeenCalledWith(true);
    rerender(<Banc aligne onAligne={onAligne} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    expect(semainesCourbe(container)).toEqual(['47', '48', '49', '50', '51', '52']);
    expect(container.querySelector('.ent-cb')?.hasAttribute('data-courbe-alignee')).toBe(true);
    expect(container.querySelector('.ent-cadre')).toBeNull();
    expect(cle()).toBe(chiffre);
  });

  it('même x pour une même date : semaines, vue Jour, semaine dépliée, Mois (6 mois), et paysage (décalage)', () => {
    const semaines = semainesDe(LUNDI0, 52).map(s => ({ debut: s.debut, numero: s.numero }));
    const lundis = semaines.map(s => s.debut);
    const mois = [] as { debut: string; fin: string; court: string }[];
    for (let m = 0; m < 8; m++) {
      const d = new Date(Date.UTC(2026, 10 + m, 1)), f = new Date(Date.UTC(2026, 11 + m, 0));
      mois.push({ debut: d.toISOString().slice(0, 10), fin: f.toISOString().slice(0, 10), court: String(m) });
    }
    const cas = [
      { echelle: 'semaine' as const, nombre: 6, deplie: null },
      { echelle: 'jour' as const, nombre: 2, deplie: null },
      { echelle: 'semaine' as const, nombre: 6, deplie: ajouterJours(LUNDI0, 14) },
      { echelle: 'mois' as const, nombre: 26, deplie: null }
    ];
    for (const c of cas) {
      const cols = colonnesDeLAxe({ echelle: c.echelle, semaines, mois, du: LUNDI0, nombre: c.nombre, deplie: c.deplie });
      const lc = 390 / cols.length;
      const al = alignerSemaines(lundis, cols, lc, 0, 390)!;
      // chaque bord de semaine tombe au x de son lundi dans la frise (±2 px), dans la largeur
      al.abscisses.forEach((x, k) => {
        const attendu = Math.max(0, Math.min(390, xDeDate(cols, lc, ajouterJours(lundis[al.debut], 7 * k))));
        expect(Math.abs(x - attendu)).toBeLessThanOrEqual(2);
      });
      // vue Jour : un lundi est au bord de sa colonne de jour ; la semaine fait 7 colonnes
      if (c.echelle === 'jour') expect(al.abscisses).toEqual([0, 195, 390]);
    }
    // paysage : la courbe commence 222 px après la frise ; les semaines sous la colonne du chiffre ne se tracent pas
    const cols13 = colonnesDeLAxe({ echelle: 'semaine', semaines, mois, du: LUNDI0, nombre: 13, deplie: null });
    const al = alignerSemaines(lundis, cols13, 60, -222, 558)!;
    expect(al.debut).toBe(3);
    expect(al.abscisses[1]).toBeCloseTo(4 * 60 - 222, 5);
  });

  it('le choix se garde sur l’appareil (préférence locale)', () => {
    render(<BancCalendrier aujourdhui="2026-11-16" sansChrome />);
    fireEvent.click(screen.getByRole('switch', { name: 'Aligner la courbe sur la frise' }));
    expect(StorageService.getUiState('calendrier_courbe_alignee', false)).toBe(true);
    cleanup();
    render(<BancCalendrier aujourdhui="2026-11-16" sansChrome />);
    expect(screen.getByRole('switch', { name: 'Aligner la courbe sur la frise' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('2. D388 : pendant le glisser, la courbe zoomée comme le jouable', () => {
  it('« si tu lâches en S52 : S51 … → … », l’écart, la colonne d’arrivée ; sans aperçu, la courbe revient', () => {
    const apres = courbeDecalee(courbe, 'c-noel', 7);
    const { container, rerender } = render(<Banc apercu={{ courbe: apres, lache: ajouterJours(LUNDI0, 35) }} />);
    expect(screen.getByRole('img', { name: /La courbe zoomée/ })).toBeInTheDocument();
    expect(container.querySelector('[data-zoom-aligne]')).not.toBeNull();
    const ligne = container.querySelector('[data-zoom-ligne]')!;
    const avant51 = courbe.semaines[4].libre, apres51 = apres.semaines[4].libre;
    expect(apres51 - avant51).toBe(-91000);
    expect(ligne.textContent).toMatch(/avant/);
    expect(ligne.textContent).toMatch(/si tu lâches en S52 : S51 [\d\s ’'−-]+ → [\d\s ’'−-]+$/);
    expect(ligne.querySelector('b')?.textContent).toBe(chf(apres51));
    expect(container.querySelector('[data-zoom-ecart]')?.textContent).toMatch(/^−910$/);
    expect(container.querySelector('[data-zoom-lache]')).not.toBeNull();
    expect(container.querySelector('.ent-avant')).not.toBeNull();
    rerender(<Banc />);
    expect(container.querySelector('[data-zoom-ligne]')).toBeNull();
    expect(screen.queryByRole('img', { name: /La courbe zoomée/ })).toBeNull();
  });
});

describe('3. D389 : cacher la courbe', () => {
  it('le bouton cache la courbe ; la bande de l’axe reste ; un second toucher la rend', () => {
    const onCourbeCachee = vi.fn();
    const { container, rerender } = render(<Banc courbeCachee={false} onCourbeCachee={onCourbeCachee} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cacher la courbe' }));
    expect(onCourbeCachee).toHaveBeenCalledWith(true);
    rerender(<Banc courbeCachee onCourbeCachee={onCourbeCachee} />);
    expect(container.querySelector('.ent-cbz .ent-cb')).toBeNull();
    expect(container.querySelector('[data-bande-semaines]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Montrer la courbe' }));
    expect(onCourbeCachee).toHaveBeenLastCalledWith(false);
  });

  it('le choix se garde sur l’appareil', () => {
    render(<BancCalendrier aujourdhui="2026-11-16" sansChrome />);
    fireEvent.click(screen.getByRole('button', { name: 'Cacher la courbe' }));
    expect(StorageService.getUiState('calendrier_courbe_cachee', false)).toBe(true);
    expect(document.querySelector('.ent-cbz .ent-cb')).toBeNull();
    cleanup();
    render(<BancCalendrier aujourdhui="2026-11-16" sansChrome />);
    expect(screen.getByRole('button', { name: 'Montrer la courbe' })).toBeInTheDocument();
  });
});
