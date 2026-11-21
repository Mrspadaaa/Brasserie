import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lirePosee } from '../../src/ui/calendrier/frise/posee';
import { cleanup, render } from '@testing-library/react';
import { ajouterJours, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { Frise } from '../../src/ui/calendrier/frise/Frise';
import { ligneDeCoupe, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { degagerDuVolant } from '../../src/ui/calendrier/frise/DetailChose';

/*
 * Paquet G du calendrier, lot B (19.11), LISTE.md n° 3 et n° 4.
 * n° 3 CAL-PLACE-GACHEE c : Fêtes, Ventes, Achats « vide » prenaient chacune une rangée ; elles se rangent sur une même ligne compacte.
 * n° 4 CAL-FICHE-CACHE-BARRE : la fiche s'ouvrait en fin de rangée (d'autres barres entre elle et la barre touchée), puis le défilement
 * faisait passer la barre touchée sous l'en-tête collé.
 */

const L = lundiDe('2026-11-16');
const colonnes: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: `S${47 + i}` }));

const chose = (id: string, rangee: ChoseCalendrier['rangee'], titre: string, deSem: number, aSem: number): ChoseCalendrier => ({
  id, rangee, titre, debut: ajouterJours(L, deSem * 7), fin: ajouterJours(L, aSem * 7 + 6), centimes: -10000,
  source: { genre: 'plan', id: `p-${id}`, origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true
} as unknown as ChoseCalendrier);

const rien = () => undefined;
const monter = (choses: ChoseCalendrier[], extra: Partial<React.ComponentProps<typeof Frise>> = {}) => render(
  <Frise
    choses={choses} colonnes={colonnes} paysage={false} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]}
    drag={null} onAjouter={rien} onBasculerMasque={rien} largeurRepli={360}
    barre={{ onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien }}
    {...extra}
  />
);
afterEach(() => cleanup());

describe('n° 3 : les rangées vides consécutives sur une même ligne compacte', () => {
  it('Fêtes, Ventes, Achats vides : un seul groupe, trois +, trois noms, trois œils, dans l’ordre', () => {
    /* Brassins et Travaux pleins, Fêtes, Ventes, Achats vides (le jeu « brasseur ») ; Activités et Papiers vides aussi */
    monter([chose('b1', 'brassins', 'Blonde', 0, 3), chose('t1', 'travaux', 'Sols', 1, 1)]);
    const groupes = [...document.querySelectorAll<HTMLElement>('[data-rangees-vides]')];
    expect(groupes.map(g => g.getAttribute('data-rangees-vides'))).toEqual(['fetes ventes achats', 'activites papiers']);
    const g = groupes[0];
    expect([...g.querySelectorAll('section[data-rangee]')].map(s => s.getAttribute('data-rangee'))).toEqual(['fetes', 'ventes', 'achats']);
    expect([...g.querySelectorAll('button[data-plus]')].map(b => b.getAttribute('aria-label'))).toEqual(['Ajouter dans Fêtes', 'Ajouter dans Ventes', 'Ajouter dans Achats']);
    expect([...g.querySelectorAll('.cal-nom')].map(h => h.textContent)).toEqual(['Fêtes', 'Ventes', 'Achats']);
    expect([...g.querySelectorAll('button.cal-oeil')].map(b => b.getAttribute('aria-label'))).toEqual(['Masquer Fêtes', 'Masquer Ventes', 'Masquer Achats']);
    expect(g.querySelectorAll('.cal-vide')).toHaveLength(3);
    /* CAL-VIDES-EN-LIGNE (21.11) : chaque rangée dit son « vide », sur sa propre ligne ; plus de « vides » commun */
    expect([...g.querySelectorAll('.cal-vide')].map(m => m.textContent)).toEqual(['vide', 'vide', 'vide']);
    expect(g.querySelectorAll('[data-vides-mot]')).toHaveLength(0);
    /* rien n'est retiré : les sept rangées, dans leur ordre */
    expect([...document.querySelectorAll('section[data-rangee]')].map(s => s.getAttribute('data-rangee'))).toEqual(['brassins', 'fetes', 'ventes', 'achats', 'travaux', 'activites', 'papiers']);
    expect(document.querySelectorAll('.cal-vide')).toHaveLength(5);
  });

  it('une rangée non vide entre deux vides donne deux groupes ; une rangée pleine n’est jamais dans un groupe', () => {
    monter([chose('b1', 'brassins', 'Blonde', 0, 3), chose('v1', 'ventes', 'Fût', 2, 2), chose('t1', 'travaux', 'Sols', 1, 1), chose('pa', 'papiers', 'Loyer', 0, 0)]);
    const groupes = [...document.querySelectorAll<HTMLElement>('[data-rangees-vides]')].map(g => g.getAttribute('data-rangees-vides'));
    expect(groupes).toEqual(['fetes', 'achats', 'activites']);
    for (const r of ['brassins', 'ventes', 'travaux', 'papiers']) expect(document.querySelector(`section[data-rangee="${r}"]`)!.closest('[data-rangees-vides]'), r).toBeNull();
  });

  it('une rangée masquée par l’œil n’est pas « vide » : elle garde sa place à elle', () => {
    monter([chose('b1', 'brassins', 'Blonde', 0, 3)], { masquees: ['ventes'] });
    expect([...document.querySelectorAll<HTMLElement>('[data-rangees-vides]')].map(g => g.getAttribute('data-rangees-vides'))).toEqual(['fetes', 'achats travaux activites papiers']);
  });
});

describe('n° 4 : la fiche s’ouvre juste sous la ligne de la barre touchée', () => {
  /* trois brassins sur les mêmes semaines : trois lignes dans la rangée */
  const trois = () => [chose('a', 'brassins', 'Ambrée', 0, 2), chose('b', 'brassins', 'Blonde d’automne', 0, 2), chose('c', 'brassins', 'Stout', 0, 2)];
  const detail = (c: ChoseCalendrier) => <div className="cal-det" data-detail={c.id} role="region" aria-label={`Détail : ${c.titre}`}>fiche</div>;
  const avant = (x: Element, y: Element) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  it('sélection du brassin de la ligne k : le détail suit la ligne k, avant toute barre d’une autre ligne plus bas', () => {
    monter(trois(), { selectionId: 'b', detail });
    const barres = [...document.querySelectorAll<HTMLElement>('section[data-rangee="brassins"] [data-barre]')];
    const ligneDe = (el: HTMLElement) => Math.round((lirePosee(el.style).y - 2) / 30) + (el.closest('[data-lane-suite]') ? 2 : 0);
    const b = barres.find(x => x.getAttribute('data-chose') === 'b')!;
    const k = ligneDe(b);
    const sous = document.querySelector<HTMLElement>('[data-detail-sous]')!;
    expect(sous).not.toBeNull();
    expect(sous.getAttribute('data-detail-sous')).toBe('b');
    expect(Number(sous.getAttribute('data-detail-ligne'))).toBe(k);
    expect(sous.querySelector('[data-detail="b"]')).not.toBeNull();
    /* la barre touchée est avant le détail ; toute barre posée plus bas est après lui */
    expect(avant(b, sous)).toBe(true);
    const plusBas = barres.filter(x => x !== b && !avant(x, sous));
    expect(plusBas.length).toBeGreaterThan(0);
    for (const x of barres.filter(x => x !== b)) {
      if (avant(x, sous)) expect(x.closest('[data-lane-suite]')).toBeNull();
      else expect(x.closest('[data-lane-suite]')).not.toBeNull();
    }
    /* les lignes suivantes gardent leur pas de 30 px dans la piste sous la fiche */
    const suite = document.querySelector<HTMLElement>('[data-lane-suite]')!;
    expect(parseFloat(suite.style.height)).toBe((3 - k - 1) * 30 + 2);
  });

  it('fiche fermée : une seule piste, les lignes à leur place', () => {
    monter(trois(), { detail });
    expect(document.querySelector('[data-detail-sous]')).toBeNull();
    expect(document.querySelector('[data-lane-suite]')).toBeNull();
    const tops = [...document.querySelectorAll<HTMLElement>('section[data-rangee="brassins"] [data-barre]')].map(x => lirePosee(x.style).y).sort((a, b) => a - b);
    expect(tops).toEqual([2, 32, 62]);
  });

  it('la coupe prend aussi la ligne d’une chose qui déborde sur la suivante (jamais une barre coupée)', () => {
    expect(ligneDeCoupe([{ ligne: 0 }, { ligne: 1, phraseBas: { ou: 'barre' } }, { ligne: 2 }], { ligne: 1 })).toBe(2);
    expect(ligneDeCoupe([{ ligne: 0 }, { ligne: 1 }, { ligne: 2 }], { ligne: 0 })).toBe(0);
  });
});

describe('n° 4 : degagerDuVolant ne fait jamais passer la barre touchée sous l’en-tête', () => {
  it('barre 10 px sous l’en-tête, fiche qui dépasse le + : le défilement laisse la barre sous l’en-tête', () => {
    const boite = (top: number, height: number, left = 0, width = 390) => ({ top, bottom: top + height, left, right: left + width, width, height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
    const volant = document.createElement('div'); volant.className = 'floating-actions'; document.body.appendChild(volant);
    const entete = document.createElement('div'); entete.setAttribute('data-entete-zone', ''); document.body.appendChild(entete);
    const frise = document.createElement('div'); frise.setAttribute('data-frise', ''); document.body.appendChild(frise);
    const barre = document.createElement('div'); barre.setAttribute('data-chose', 'b'); frise.appendChild(barre);
    const det = document.createElement('div'); det.setAttribute('data-detail', 'b'); frise.appendChild(det);
    const H0 = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 844 });
    const scrollBy = vi.fn();
    const avantScroll = window.scrollBy;
    Object.defineProperty(window, 'scrollBy', { configurable: true, writable: true, value: scrollBy });
    const ENTETE = 213;
    let BARRE = ENTETE + 10;
    let fiche = boite(BARRE + 34, 480);
    const espion = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this === volant) return boite(736, 56, 322, 56);
      if (this === entete) return boite(0, ENTETE);
      if (this === barre) return boite(BARRE, 26);
      if (this === det) return fiche;
      return boite(0, 0);
    });
    try {
      const delta = degagerDuVolant(det);
      expect(BARRE - delta).toBeGreaterThanOrEqual(ENTETE);
      expect(BARRE - delta).toBeGreaterThanOrEqual(ENTETE + 8);
      /* barre bien plus bas : la fiche se dégage du + entier, la barre reste sous l'en-tête */
      BARRE = 466; fiche = boite(500, 300); scrollBy.mockClear();
      const d2 = degagerDuVolant(det);
      expect(d2).toBe(Math.ceil(800 - 728));
      /* déjà dégagée du + : rien ne défile */
      fiche = boite(300, 300); scrollBy.mockClear();
      expect(degagerDuVolant(det)).toBe(0);
      expect(scrollBy).not.toHaveBeenCalled();
    } finally {
      espion.mockRestore();
      Object.defineProperty(window, 'scrollBy', { configurable: true, writable: true, value: avantScroll });
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: H0 });
      volant.remove(); entete.remove(); frise.remove();
    }
  });
});
