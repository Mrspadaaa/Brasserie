import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EnTeteCalendrier, type EnTeteCalendrierProps, type ModeleEnTete } from '../../src/ui/calendrier/entete/EnTete';
import { periodeDeFenetre } from '../../src/ui/calendrier/entete/Fenetre';
import { ajouterJours, semainesDe } from '../../src/domain/calendrier';
import { courbeCaisse, creuxDepuis, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { Header } from '../../src/components/Header';
import { BancCalendrier } from '../../src/design/CalendrierPreview';

/**
 * Paquet G, lot A (19.11) : l'en-tête du calendrier, quatre défauts du brasseur, chacun prouvé seul. Échoue sur 7071a028c.
 * n° 1 CAL-PLACE-GACHEE a : courbe plate ≤ 44 px ; non plate, non alignée, 80 à 88 px (plancher CAL-GRAPH-PETIT) ; alignée, 110 px (inchangé).
 * n° 2 CAL-PLACE-GACHEE b : en portrait, une seule rangée d'axe : les mois DANS la courbe, en haut (w3s), aucun sous le tracé.
 * n° 7 CAL-ENTETE-CACHE : Header publie `--main-header-height` ; `.cal-entete-zone` s'y colle.
 * n° 8 CAL-RETOUR-PLEIN : en plein écran seulement, le bouton de retour porte `data-plein` et la classe d'accent.
 * Banc — données simulées : aucune donnée réelle, aucun appel réseau.
 */
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete (document as { fullscreenElement?: unknown }).fullscreenElement; });

const LUNDI0 = '2026-11-16';
const jour = (s: number) => ajouterJours(LUNDI0, s * 7 + 2);
const mouvements: MouvementCaisse[] = [
  { id: 'm0', jour: jour(0), centimes: -14800, nom: 'Malt' },
  { id: 'm4', jour: jour(4), centimes: 91000, nom: 'Marché de Noël' },
  { id: 'm21', jour: jour(21), centimes: -280000, nom: 'Embouteilleuse' },
  { id: 'm32', jour: jour(32), centimes: 245000, nom: 'Festival' }
];
const vivante = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements, mises: [] })!;
/* le jeu du brasseur : ses brassins sans coût connu, ni fête ni vente ni achat : le solde reste celui du départ (courbe plate) */
const plate = courbeCaisse({ depart: 403200, lundi0: LUNDI0, mouvements: [], mises: [] })!;

const modele = (c: typeof vivante): ModeleEnTete => ({ semaines: semainesDe(LUNDI0, 52), courbe: c, creux: creuxDepuis(c), retards: [], sansDate: [], icones: [] });
const props = (c: typeof vivante, extra: Partial<EnTeteCalendrierProps> = {}): EnTeteCalendrierProps => ({
  modele: modele(c), fenetre: { du: LUNDI0, semaines: 6 }, onFenetre: vi.fn(), periode: periodeDeFenetre({ du: LUNDI0, semaines: 6 }), onPeriode: vi.fn(),
  vue: 'semaines', onVue: vi.fn(), mouvements: false, onMouvements: vi.fn(), orientation: 'portrait', largeurColonne: 61, ...extra
});
const svgCourbe = (c: HTMLElement) => c.querySelector('.ent-cb svg.ent-svg') as SVGSVGElement;
const hauteurSvg = (c: HTMLElement) => Number(svgCourbe(c).getAttribute('height'));

describe('paquet G n° 1 — CAL-PLACE-GACHEE a : la courbe plate ne gâche pas la place', () => {
  it('portrait, courbe plate (solde constant) : le dessin fait 44 px au plus', () => {
    const { container } = render(<EnTeteCalendrier {...props(plate)} />);
    expect(hauteurSvg(container)).toBeLessThanOrEqual(44);
    expect(container.querySelector('.ent-cb')).toHaveAttribute('data-courbe-plate');
  });
  it('portrait, courbe non plate non alignée : 80 à 88 px (plancher CAL-GRAPH-PETIT)', () => {
    const { container } = render(<EnTeteCalendrier {...props(vivante)} />);
    const h = hauteurSvg(container);
    expect(h).toBeGreaterThanOrEqual(80);
    expect(h).toBeLessThanOrEqual(88);
    expect(container.querySelector('.ent-cb')).not.toHaveAttribute('data-courbe-plate');
  });
  it('alignée en portrait : 110 px, inchangé ; paysage : 90 px, inchangé', () => {
    const al = render(<EnTeteCalendrier {...props(vivante, { aligne: true, onAligne: () => undefined })} />);
    expect(hauteurSvg(al.container)).toBe(110);
    al.unmount();
    const pa = render(<EnTeteCalendrier {...props(plate, { orientation: 'paysage', fenetre: { du: LUNDI0, semaines: 13 }, periode: periodeDeFenetre({ du: LUNDI0, semaines: 13 }) })} />);
    expect(hauteurSvg(pa.container)).toBe(90);
  });
});

describe('paquet G n° 2 — CAL-PLACE-GACHEE b : une seule rangée d’axe en portrait', () => {
  for (const [nom, c] of [['non plate', vivante], ['plate', plate]] as const) {
    it(`${nom} : chaque mois est dans les 20 px du haut de la courbe, aucun sous le tracé`, () => {
      const { container } = render(<EnTeteCalendrier {...props(c)} />);
      const svg = svgCourbe(container);
      const mois = [...svg.querySelectorAll('text.ent-mois')];
      expect(mois.length).toBeGreaterThan(0);
      const haut = Math.min(...[...svg.querySelectorAll('circle.ent-pt')].map(p => Number(p.getAttribute('cy'))));
      for (const m of mois) {
        const y = Number(m.getAttribute('y'));
        // le texte de 14 px : sa boîte va de y − 11 à y + 3 ; elle tient dans les 20 px du haut, au-dessus du plus haut point du tracé
        expect(y + 3).toBeLessThanOrEqual(20);
        expect(y).toBeLessThan(haut);
      }
      // la bande des semaines reste (choisie) : c'est la seule rangée d'axe sous la courbe
      expect(container.querySelector('[data-bande-semaines]')).not.toBeNull();
    });
  }
});

describe('paquet G n° 8 — CAL-RETOUR-PLEIN : le retour du plein écran se voit', () => {
  it('plein écran : le bouton « Quitter le plein écran » porte data-plein et la classe d’accent', () => {
    Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true });
    const { getByRole } = render(<EnTeteCalendrier {...props(vivante, { orientation: 'paysage' })} />);
    const b = getByRole('button', { name: 'Quitter le plein écran' });
    expect(b).toHaveAttribute('data-plein');
    expect(b).toHaveClass('ent-pl--plein');
    expect(b.textContent).toBe('');
  });
  it('hors plein écran : le bouton reste discret (ni data-plein ni accent)', () => {
    const { getByRole } = render(<EnTeteCalendrier {...props(vivante)} />);
    const b = getByRole('button', { name: 'Plein écran' });
    expect(b).not.toHaveAttribute('data-plein');
    expect(b).not.toHaveClass('ent-pl--plein');
  });
});

describe('paquet G n° 7 — CAL-ENTETE-CACHE : la zone du calendrier se colle sous l’en-tête de l’app', () => {
  it('Header publie sa hauteur dans --main-header-height, et la retire en partant', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 390, bottom: 48, width: 390, height: 48, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
    const { unmount } = render(<Header globalTimeFilter={{ genre: 'tout' }} onChangeGlobalTimeFilter={() => undefined} hidePeriod onGoHome={() => undefined} onOpenSearch={() => undefined} />);
    expect(document.documentElement.style.getPropertyValue('--main-header-height')).toBe('48px');
    unmount();
    expect(document.documentElement.style.getPropertyValue('--main-header-height')).toBe('');
  });
  it('.cal-entete-zone colle à top: var(--main-header-height), plus à top-0', () => {
    const { container } = render(<BancCalendrier aujourdhui="2026-11-19" sansChrome />);
    const zone = container.querySelector('.cal-entete-zone') as HTMLElement;
    expect(zone).not.toBeNull();
    expect(zone.style.top).toContain('var(--main-header-height');
    expect(zone.className).not.toMatch(/\btop-0\b/);
    // en bas de page, la zone ne quitte pas sa place : la réserve sous la frise est un bloc du contenu, pas une marge intérieure de l'onglet
    const onglet = container.querySelector('.cal-tab') as HTMLElement;
    expect(onglet.className).not.toContain('pb-[');
    expect(onglet.lastElementChild).toHaveClass('cal-tab-fin');
  });
});
