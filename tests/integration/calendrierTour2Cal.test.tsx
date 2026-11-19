import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { EnTeteCalendrier, type EnTeteCalendrierProps, type ModeleEnTete } from '../../src/ui/calendrier/entete/EnTete';
import { periodeDeFenetre } from '../../src/ui/calendrier/entete/Fenetre';
import { ajouterJours, etiquetteS, semainesDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { courbeCaisse, creuxDepuis, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { Header } from '../../src/components/Header';
import { MESURES_PORTRAIT, Rangee, disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { poserPleinCalendrier } from '../../src/ui/calendrier/pleinEcran';
import { REQUETE_PAYSAGE } from '../../src/ui/calendrier/useOrientation';

/**
 * Tour 2, lot cal (19.11, vision-1911/VERDICT.md : CAL-PLACE-GACHEE partiel, neufs n° 1 et n° 4). Chaque défaut prouvé seul ; échoue sur 6055c5e82.
 * n° 1 (bloquant, capture b19e2698, paysage 844 × 340) : l'en-tête de l'app tient sur une ligne de 40 px en paysage, la courbe descend à 60 px,
 *   et en plein écran du calendrier l'en-tête de l'app disparaît.
 * n° 2 (CAL-PLACE-GACHEE, portrait 390) : courbe non alignée, une seule rangée d'axe : aucun mois dans la courbe, la bande des semaines seule.
 * n° 3 (verdict n° 4) : le nom d'un brassin reste DANS sa barre (« IPA de printemps » n'est plus poussé dehors par « coût à venir »).
 * Banc — données simulées : aucune donnée réelle, aucun appel réseau.
 */
const origineMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.matchMedia = origineMatchMedia;
  poserPleinCalendrier(false);
  delete (document as { fullscreenElement?: unknown }).fullscreenElement;
});

/** Un téléphone couché : seule la requête du paysage répond vrai. */
const coucher = () => {
  window.matchMedia = ((q: string) => ({
    matches: q === REQUETE_PAYSAGE, media: q, onchange: null,
    addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined, dispatchEvent: () => false
  })) as unknown as typeof window.matchMedia;
};

const LUNDI0 = '2026-11-16';
const jour = (s: number) => ajouterJours(LUNDI0, s * 7 + 2);
const mouvements: MouvementCaisse[] = [
  { id: 'm0', jour: jour(0), centimes: -14800, nom: 'Malt' },
  { id: 'm4', jour: jour(4), centimes: 91000, nom: 'Marché de Noël' },
  { id: 'm21', jour: jour(21), centimes: -280000, nom: 'Embouteilleuse' }
];
const vivante = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements, mises: [] })!;
const plate = courbeCaisse({ depart: 403200, lundi0: LUNDI0, mouvements: [], mises: [] })!;
const modele = (c: typeof vivante): ModeleEnTete => ({ semaines: semainesDe(LUNDI0, 52), courbe: c, creux: creuxDepuis(c), retards: [], sansDate: [], icones: [] });
const props = (c: typeof vivante, extra: Partial<EnTeteCalendrierProps> = {}): EnTeteCalendrierProps => ({
  modele: modele(c), fenetre: { du: LUNDI0, semaines: 6 }, onFenetre: vi.fn(), periode: periodeDeFenetre({ du: LUNDI0, semaines: 6 }), onPeriode: vi.fn(),
  vue: 'semaines', onVue: vi.fn(), mouvements: false, onMouvements: vi.fn(), orientation: 'portrait', largeurColonne: 61, ...extra
});
const paysage13 = { orientation: 'paysage' as const, fenetre: { du: LUNDI0, semaines: 13 }, periode: periodeDeFenetre({ du: LUNDI0, semaines: 13 }) };
const svgCourbe = (c: HTMLElement) => c.querySelector('.ent-cb svg.ent-svg') as SVGSVGElement;
const enTeteApp = () => <Header globalTimeFilter={periodeDeFenetre({ du: LUNDI0, semaines: 6 })} onChangeGlobalTimeFilter={() => undefined} hidePeriod onGoHome={() => undefined} onOpenSearch={() => undefined} onOpenPlus={() => undefined} />;

describe('tour 2 n° 1 — paysage 844 × 340 : la frise commence avant 40 % de la hauteur', () => {
  it('téléphone couché : l’en-tête de l’app tient sur une ligne de 40 px, sans « Villars-sur-Glâne »', () => {
    coucher();
    const { container } = render(enTeteApp());
    const barre = container.querySelector('.app-titlebar') as HTMLElement;
    expect(barre).toHaveClass('h-10');
    expect(barre).not.toHaveClass('h-12');
    const lieu = [...container.querySelectorAll('span')].find(s => s.textContent === 'Villars-sur-Glâne') as HTMLElement;
    expect(lieu.className.split(/\s+/)).toContain('hidden');
    expect(lieu.className).not.toMatch(/sm:block/);
  });
  it('en paysage, la courbe non alignée descend à 60 px (la colonne du chiffre et des boutons)', () => {
    for (const c of [vivante, plate]) {
      const { container, unmount } = render(<EnTeteCalendrier {...props(c, paysage13)} />);
      expect(Number(svgCourbe(container).getAttribute('height'))).toBeLessThanOrEqual(60);
      unmount();
    }
  });
  it('plein écran du calendrier : l’en-tête de l’app disparaît ; il revient au retour et quand le calendrier part', () => {
    coucher();
    Object.defineProperty(document, 'fullscreenElement', { value: document.documentElement, configurable: true });
    const app = render(enTeteApp());
    const cal = render(<EnTeteCalendrier {...props(vivante, paysage13)} />);
    const header = app.container.querySelector('header') as HTMLElement;
    expect(header).toHaveAttribute('hidden');
    expect(header).toHaveClass('hidden');
    // le calendrier part (autre onglet) : l'en-tête revient
    cal.unmount();
    expect(header).not.toHaveAttribute('hidden');
    act(() => poserPleinCalendrier(true));
    expect(header).toHaveAttribute('hidden');
    act(() => poserPleinCalendrier(false));
    expect(header).not.toHaveAttribute('hidden');
  });
  it('hors plein écran, l’en-tête de l’app reste', () => {
    const app = render(enTeteApp());
    render(<EnTeteCalendrier {...props(vivante)} />);
    expect(app.container.querySelector('header')).not.toHaveAttribute('hidden');
  });
});

describe('tour 2 n° 2 — CAL-PLACE-GACHEE : une seule rangée d’axe quand la courbe n’est pas alignée', () => {
  for (const [nom, c, extra] of [['portrait non plate', vivante, {}], ['portrait plate', plate, {}], ['paysage', vivante, paysage13]] as const) {
    it(`${nom} : aucun mois dans la courbe ; la bande des semaines est la seule rangée d’axe`, () => {
      const { container } = render(<EnTeteCalendrier {...props(c, extra)} />);
      expect(svgCourbe(container).querySelectorAll('text.ent-mois')).toHaveLength(0);
      expect(container.querySelector('[data-bande-semaines]')).not.toBeNull();
    });
  }
  it('alignée sur la frise, la courbe garde ses mois (ceux de la frise), inchangé', () => {
    const { container } = render(<EnTeteCalendrier {...props(vivante, { aligne: true, onAligne: () => undefined })} />);
    expect(svgCourbe(container).querySelectorAll('text.ent-mois').length).toBeGreaterThan(0);
  });
});

describe('tour 2 n° 3 — le nom d’un brassin reste dans SA barre (verdict n° 4, jeu brasseur 390)', () => {
  const L = LUNDI0;
  const COLS: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
  /* comme le jeu brasseur : un brassin sans coût connu (« X · coût à venir »), sa durée du domaine */
  const brassin = (id: string, titre: string, s0: number, s1: number, duree: string): ChoseCalendrier => ({
    id, rangee: 'brassins', titre, etiquette: `${titre} · coût à venir`, coutAVenir: true, partiel: true, duree,
    debut: ajouterJours(L, s0 * 7 + 1), fin: ajouterJours(L, s1 * 7 + 3),
    source: { genre: 'batch', id, statut: 'planifie' }, ouvre: { ecran: 'brassin', id }, deplacable: true
  } as unknown as ChoseCalendrier);
  const ipa = brassin('IPA', 'IPA de printemps', 0, 3, 'J10 / 28 · prête 7 déc.');
  const porter = brassin('POR', 'Porter d’hiver', 3, 5, 'J0 / 35 · prête 11 janv.');
  const poser = (c: ChoseCalendrier) => disposer([c], COLS, 61, 366, { reserveDroite: 76 }).items[0];

  it('IPA de printemps (barre de 240 px) : le nom est dans la barre, la phrase entière cède', () => {
    const d = poser(ipa);
    expect(d.largeur).toBeGreaterThan(200);
    expect(d.cote).toBe('dedans');
  });
  it('Porter d’hiver (barre de 179 px) : le titre seul entre dans la barre ; « coût à venir » cède, pas le nom', () => {
    const d = poser(porter);
    expect(d.cote).toBe('dedans');
    expect(d.titreSeul).toBe(true);
  });
  it('rendu : chaque nom est dans une étiquette « dedans », Porter sans « coût à venir »', () => {
    const rien = () => undefined;
    const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };
    const { container } = render(<Rangee id="brassins" choses={[ipa, porter]} colonnes={COLS} largeurColonne={61} largeur={366} mesures={MESURES_PORTRAIT} vueLarge={false} reserveDroite={76}
      masquee={false} cause={null} epingles={[]} etoiles={[]} partMax={0} drag={null} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />);
    const dedans = [...container.querySelectorAll('.cal-lbl-dedans')].map(e => e.textContent ?? '');
    expect(dedans.some(t => t.startsWith('IPA de printemps'))).toBe(true);
    expect(dedans.some(t => t.startsWith('Porter d’hiver'))).toBe(true);
    expect(container.querySelectorAll('.cal-lbl-gauche, .cal-lbl-droite')).toHaveLength(0);
  });
  it('une barre trop courte pour le titre garde le nom contre elle (à côté), jamais coupé', () => {
    const court = brassin('AMB', 'Ambrée maison', 5, 5, 'J0 / 28 · prête 18 janv.');
    const d = poser(court);
    expect(d.cote).not.toBe('dedans');
  });
});
