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
import { chf, moisHorsReserves } from '../../src/ui/calendrier/entete/Courbe';
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
    const inter = screen.getByRole('button', { name: 'Aligner la courbe sur la frise' });
    expect(inter.getAttribute('aria-pressed')).toBe('false');
    // Frise B, R4 : éteint, la courbe se trace dans la vue de la fenêtre (ses deux bouts à 56 px des bords), ses semaines comprises.
    expect(semainesCourbe(container)).toEqual(expect.arrayContaining(['47', '48', '49', '50', '51', '52']));
    expect(container.querySelector('.ent-cadre')).not.toBeNull();
    const chiffre = cle();
    fireEvent.click(inter);
    expect(onAligne).toHaveBeenCalledWith(true);
    rerender(<Banc aligne onAligne={onAligne} />);
    expect(screen.getByRole('button', { name: 'Aligner la courbe sur la frise' }).getAttribute('aria-pressed')).toBe('true');
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
    fireEvent.click(screen.getByRole('button', { name: 'Aligner la courbe sur la frise' }));
    expect(StorageService.getUiState('calendrier_courbe_alignee', false)).toBe(true);
    cleanup();
    render(<BancCalendrier aujourdhui="2026-11-16" sansChrome />);
    expect(screen.getByRole('button', { name: 'Aligner la courbe sur la frise' }).getAttribute('aria-pressed')).toBe('true');
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

describe('Lot C n° 7 : en paysage, alignée et zoomée sur toute la largeur de l’en-tête (jouable)', () => {
  const boites = () => vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const r = (left: number, top: number, w: number, h: number) => ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
    if (this.hasAttribute('data-frise')) return r(12, 165, 820, 500);
    if (this.hasAttribute('data-calendrier-entete')) return r(12, 36, 820, 120);
    if (this.classList.contains('ent-cbz')) return r(226, 36, 606, 90);
    return r(0, 0, 0, 0);
  });
  const avecFrise = () => { const f = document.createElement('div'); f.setAttribute('data-frise', ''); document.body.appendChild(f); return () => f.remove(); };

  it('alignée : l’en-tête passe en une colonne (rangée du chiffre au-dessus), la courbe 90 px (paquet D n° 6) ; éteinte, la colonne du chiffre revient', () => {
    const { container, rerender } = render(<Banc orientation="paysage" aligne onAligne={() => undefined} />);
    const ent = container.querySelector('[data-calendrier-entete]')!;
    expect(ent).toHaveAttribute('data-aligne', 'oui');
    expect(ent).toHaveAttribute('data-bouton-al');
    /* paquet E n° 2 : 92 px, la rangée du chiffre (28 px) posée sur celle des mois, le tracé dessous (E10 : 119 px d'en-tête au banc) */
    expect(container.querySelector('.ent-cbz svg.ent-svg')?.getAttribute('height')).toBe('92');
    rerender(<Banc orientation="paysage" aligne={false} onAligne={() => undefined} />);
    expect(ent).not.toHaveAttribute('data-aligne');
    /* tour 2 n° 1 (paysage 844 × 340) : éteinte, la courbe a la hauteur de la colonne du chiffre, 60 px (avant : 90) */
    expect(container.querySelector('.ent-cbz svg.ent-svg')?.getAttribute('height')).toBe('60');
  });

  it('paquet E n° 2 (E10) : alignée en paysage, la rangée du chiffre se pose sur celle des mois ; le tracé commence sous elle, les mois évitent le chiffre et les boutons', () => {
    /* Tour 3 T2-1 : la courbe alignée n'écrit plus ses mois par défaut (la bande des semaines est l'axe) ; l'option les remet, c'est elle qu'on place ici. */
    const { container } = render(<Banc orientation="paysage" aligne onAligne={() => undefined} moisCourbeAlignee />);
    const svg = container.querySelector('.ent-cbz svg.ent-svg')!;
    /* les mois sur la ligne du milieu de la rangée de 28 px (y = 19), pas sur une rangée à eux au-dessus du tracé (y = 13) */
    const mois = [...svg.querySelectorAll('text.ent-mois')];
    expect(mois.length).toBeGreaterThan(0);
    mois.forEach(m => expect(m.getAttribute('y')).toBe('19'));
    /* aucun point du tracé dans la rangée du chiffre */
    [...svg.querySelectorAll('circle.ent-pt')].forEach(p => expect(Number(p.getAttribute('cy'))).toBeGreaterThanOrEqual(30));
    expect(moisHorsReserves([{ x: 140, texte: 'déc.' }, { x: 455, texte: 'janv.' }, { x: 705, texte: 'févr.' }], [[12, 217], [591, 816]], 820, () => 30))
      .toEqual([{ x: 227, texte: 'déc.', trait: false }, { x: 455, texte: 'janv.', trait: true }]);
  });

  it('pendant le glisser, la courbe zoomée couvre tout l’en-tête : sa largeur, sa hauteur, ses semaines sur les colonnes de la frise', () => {
    boites();
    const retirer = avecFrise();
    const apres = courbeDecalee(courbe, 'c-noel', 7);
    const { container } = render(<Banc orientation="paysage" largeurColonne={820 / 13} apercu={{ courbe: apres, lache: ajouterJours(LUNDI0, 35) }} />);
    const tout = container.querySelector<HTMLElement>('[data-zoom-tout]')!;
    expect(tout).not.toBeNull();
    expect(tout.style.height).toBe('120px');
    const svg = tout.querySelector('svg.ent-zoom')!;
    expect(svg.getAttribute('width')).toBe('820');
    // Une seule courbe zoomée : pas de seconde dans la colonne de la courbe.
    expect(container.querySelectorAll('[data-zoom-ligne]')).toHaveLength(1);
    expect(tout.querySelector('[data-zoom-ligne]')?.textContent).toMatch(/si tu lâches en S52/);
    retirer();
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
