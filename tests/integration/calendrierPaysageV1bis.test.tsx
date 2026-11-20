/**
 * Voie 1 bis (20.11) PC-149 : en paysage, le détail ouvert (par l'appui long sur une marque, qui amène aux 6 semaines, D-199) passait sous
 * l'en-tête collant : « Hotte −900 » et les libellés Semaine, Date, Libre cachés. `degagerDuVolant` ne défilait que vers le bas ; quand la
 * chose et son détail sont déjà SOUS l'en-tête (haut < bas de l'en-tête + 8), la page remonte juste assez pour les dégager.
 */
import { describe, expect, it, vi } from 'vitest';
import { degagerDuVolant } from '../../src/ui/calendrier/frise/DetailChose';

const boite = (top: number, height: number, left = 0, width = 844) => ({ top, bottom: top + height, left, right: left + width, width, height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;

function monter(opts: { enteteBas: number; barreTop: number; ficheTop: number; ficheH: number; avecVolant: boolean; innerHeight?: number }) {
  const racine: HTMLElement[] = [];
  const ajoute = (parent: HTMLElement, attr: Record<string, string>, classe?: string) => {
    const e = document.createElement('div'); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); if (classe) e.className = classe; parent.appendChild(e); return e;
  };
  const volant = opts.avecVolant ? ajoute(document.body, {}, 'floating-actions') : null;
  const entete = ajoute(document.body, { 'data-entete-zone': '' }); entete.style.position = 'sticky';
  const frise = ajoute(document.body, { 'data-frise': '' });
  const barre = ajoute(frise, { 'data-chose': 'h' });
  const det = ajoute(frise, { 'data-detail': 'h' });
  racine.push(...[volant, entete, frise].filter((x): x is HTMLElement => !!x));
  const H0 = window.innerHeight;
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: opts.innerHeight ?? 340 });
  const scrollBy = vi.fn();
  const avant = window.scrollBy;
  Object.defineProperty(window, 'scrollBy', { configurable: true, writable: true, value: scrollBy });
  const espion = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this === volant) return boite(250, 56, 780, 56);
    if (this === entete) return boite(0, opts.enteteBas);
    if (this === barre) return boite(opts.barreTop, 20);
    if (this === det) return boite(opts.ficheTop, opts.ficheH);
    return boite(0, 0);
  });
  return {
    det, scrollBy,
    fin: () => {
      espion.mockRestore();
      Object.defineProperty(window, 'scrollBy', { configurable: true, writable: true, value: avant });
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: H0 });
      racine.forEach(x => x.remove());
    }
  };
}

describe('PC-149 : le détail ouvert ne reste pas sous l’en-tête collant (paysage 844 × 340)', () => {
  it('chose et détail sous l’en-tête (bas 83) : la page remonte jusqu’à 8 px sous lui', () => {
    const m = monter({ enteteBas: 83, barreTop: 20, ficheTop: 44, ficheH: 150, avecVolant: true });
    try {
      const delta = degagerDuVolant(m.det);
      /* la chose touchée (haut 20) revient à 91 = 83 + 8 : remontée de 71 px */
      expect(delta).toBe(-71);
      expect(m.scrollBy).toHaveBeenCalledWith({ top: -71, left: 0, behavior: 'auto' });
    } finally { m.fin(); }
  });

  it('sans le + volant (rien à dégager en bas), le détail sous l’en-tête remonte aussi', () => {
    const m = monter({ enteteBas: 83, barreTop: 28, ficheTop: 52, ficheH: 150, avecVolant: false });
    try {
      expect(degagerDuVolant(m.det)).toBe(-63);
    } finally { m.fin(); }
  });

  it('chose déjà à 8 px au moins sous l’en-tête : la page ne remonte pas', () => {
    const m = monter({ enteteBas: 83, barreTop: 100, ficheTop: 124, ficheH: 100, avecVolant: true });
    try {
      expect(degagerDuVolant(m.det)).toBe(0);
      expect(m.scrollBy).not.toHaveBeenCalled();
    } finally { m.fin(); }
  });
});

/**
 * PC-157 : 844 × 340, Mois, 6 mois (Papiers) : l'icône « Impôt sur la bière · Porter d'hiver » (30 avr., dernier jour de la fenêtre) se posait
 * au centre de son jour, soit au bord droit de la frise : la moitié de l'icône dépassait (820–840 pour une frise qui s'arrête à 832) et était
 * coupée. Une marque reste ENTIÈRE dans la piste, au plus près de son jour ; même chose au bord gauche (1er jour de la fenêtre).
 */
import { disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

describe('PC-157 : une marque d’un jour au bord de la fenêtre reste entière dans la piste (Mois, 6 mois, paysage)', () => {
  const MOIS = [['2026-11-01', '2026-11-30'], ['2026-12-01', '2026-12-31'], ['2027-01-01', '2027-01-31'], ['2027-02-01', '2027-02-28'], ['2027-03-01', '2027-03-31'], ['2027-04-01', '2027-04-30']];
  const COLS: Colonne[] = MOIS.map(([debut, fin], i) => ({ debut, fin, etiquette: `M${i}` }));
  const LARGEUR = 820, COL = LARGEUR / 6;
  const impot = (id: string, jour: string): ChoseCalendrier => ({
    id, rangee: 'papiers', titre: `Impôt ${id}`, etiquette: `Impôt ${id} −24`, centimes: -24, debut: jour, fin: jour,
    source: { genre: 'plan', id, origine: 'auto' }, ouvre: { ecran: 'finances', id }, deplacable: true
  } as unknown as ChoseCalendrier);
  const poser = (c: ChoseCalendrier) => disposer([c], COLS, COL, LARGEUR, { paysage: true, vueLarge: true }).items[0];

  it('le 30 avr. (dernier jour) : l’icône de 28 px finit au plus à la droite de la piste', () => {
    const d = poser(impot('Porter', '2027-04-30'));
    expect(d.marque).toBe(true);
    expect(d.gauche + 28).toBeLessThanOrEqual(LARGEUR);
  });
  it('le 1er nov. (premier jour) : l’icône ne commence pas avant la piste', () => {
    const d = poser(impot('Tout premier', '2026-11-01'));
    expect(d.marque).toBe(true);
    expect(d.gauche).toBeGreaterThanOrEqual(0);
  });
  it('un jour au milieu de la fenêtre reste posé au centre de son jour (rien ne bouge)', () => {
    const d = poser(impot('Milieu', '2027-01-15'));
    expect(d.gauche).toBeGreaterThan(0);
    expect(d.gauche + 28).toBeLessThan(LARGEUR);
  });
});
