/* Voie port-B (12.11) : la frise de p2c « La journée en frise, et le bilan visé ». Les mots viennent de work/missions/2026-11-11-brassage-zero/voies/p2/p2c/build.mjs.
   Scénario unifié : 13 h 05 (E1), 15 h 05 (E3), 16 h 19 (E2), 17 h 20 (E4). Aucun réseau. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BrewFrise,
  heureFrise,
  heuresDeLaFrise,
  positionFrise,
  rangerCote,
  etatDesPhases,
  type PlanFrise,
  type ReleveFrise
} from '../../src/ui/BrewFrise';

afterEach(cleanup);

const h = (hh: number, mm = 0) => new Date(2026, 10, 12, hh, mm).getTime();

const plan: PlanFrise = {
  debut: h(11, 45),
  finEstimee: h(17, 30),
  phases: [
    { area: 'preparation', debut: h(11, 45), fin: h(12, 50), ticks: [] },
    { area: 'mash', debut: h(12, 50), fin: h(14, 50), ticks: [h(13, 5), h(14, 5), h(14, 15)] },
    { area: 'boil', debut: h(14, 50), fin: h(16, 20), ticks: [h(15, 20)] },
    { area: 'finish', debut: h(16, 20), fin: h(17, 30), ticks: [h(16, 45)] }
  ],
  aCote: [
    { id: 'rincage', nom: 'rinçage 76 °C', heure: h(13, 50), fait: true },
    { id: 'levure', nom: 'levure', heure: h(15, 20), fait: false },
    { id: 'refroidisseur', nom: 'refroidisseur', heure: h(15, 55), fait: false }
  ],
  avanceMin: null
};

const releves = (etats: ReleveFrise['etat'][]): ReleveFrise[] =>
  [
    ['eau', 'Eau d’empâtage · ? °C', h(12, 50)],
    ['maische', 'Maische', h(13, 5)],
    ['ph', 'pH d’empâtage', h(13, 15)],
    ['avant', 'Avant ébullition', h(15, 5)],
    ['coupure', 'Densité à la coupure', h(16, 20)],
    ['og', 'OG et fermenteur', h(17, 10)]
  ].map(([id, nom, heure], i) => ({ id: id as string, nom: nom as string, heure: heure as number, etat: etats[i] }));

const E1 = releves(['manque', 'du', 'afaire', 'afaire', 'afaire', 'afaire']);
const E4 = releves(['manque', 'ok', 'ok', 'ecart', 'manque', 'ecart']);

const rendre = (surcharge: Partial<React.ComponentProps<typeof BrewFrise>> = {}) =>
  render(<BrewFrise plan={plan} releves={E1} maintenant={h(13, 5)} onPhase={() => undefined} {...surcharge} />);

describe('BrewFrise : les mots de p2c', () => {
  it('nomme les 4 phases en entier, « à côté » et « relevés »', () => {
    rendre();
    for (const nom of ['Préparer', 'Empâter', 'Ébullition', 'Refroidir']) {
      expect(screen.getByRole('button', { name: nom })).toBeTruthy();
    }
    expect(screen.getByText('à côté')).toBeTruthy();
    expect(screen.getByText('relevés')).toBeTruthy();
  });

  it('pose la pastille de l’heure : « 13 h 05 »', () => {
    const { container } = rendre();
    const pastille = container.querySelector('.fr-pastille') as HTMLElement;
    expect(pastille.textContent).toBe('13 h 05');
    expect(pastille.style.left).toBe('23.19%');
  });

  it('E1 : heures 12 h, 14 h … 17 h, sauf celle que la pastille couvre (13 h)', () => {
    const { container } = rendre();
    const heures = Array.from(container.querySelectorAll('.fr-heures span')).map((n) => n.textContent);
    expect(heures).toEqual(['12 h', '14 h', '15 h', '16 h', '17 h']);
  });

  it('E4 : pastille calée à droite, 12 h à 15 h seulement', () => {
    const { container } = rendre({ releves: E4, maintenant: h(17, 20) });
    const heures = Array.from(container.querySelectorAll('.fr-heures span')).map((n) => n.textContent);
    expect(heures).toEqual(['12 h', '13 h', '14 h', '15 h']);
    expect((container.querySelector('.fr-pastille') as HTMLElement).className).toContain('fr-droite');
  });

  it('la légende dit les cinq états, « dû maintenant » seulement si un relevé est dû', () => {
    const avec = rendre();
    const leg = avec.container.querySelector('.fr-legende') as HTMLElement;
    expect(Array.from(leg.querySelectorAll('span')).map((n) => n.textContent)).toEqual(['dans la cible', 'écart', 'à relever', 'pas relevé', 'dû maintenant']);
    avec.unmount();
    const sans = rendre({ releves: E4, maintenant: h(17, 20) });
    const leg2 = sans.container.querySelector('.fr-legende') as HTMLElement;
    expect(leg2.textContent).toContain('dans la cible');
    expect(leg2.textContent).toContain('écart');
    expect(leg2.textContent).toContain('à relever');
    expect(leg2.textContent).toContain('pas relevé');
    expect(leg2.textContent).not.toContain('dû maintenant');
  });

  it('les trois préparations « à côté » : rond vide, ou plein une fois faite', () => {
    const { container } = rendre();
    const cote = Array.from(container.querySelectorAll('.fr-cote .fr-ch'));
    expect(cote.map((n) => n.textContent)).toEqual(['rinçage 76 °C', 'levure', 'refroidisseur']);
    expect(cote.map((n) => n.classList.contains('fait'))).toEqual([true, false, false]);
  });

  it('un losange par relevé, son état en classe et dit en mots à la lecture d’écran', () => {
    const { container } = rendre();
    const losanges = Array.from(container.querySelectorAll('.fr-rel .fr-dm'));
    expect(losanges).toHaveLength(6);
    expect(losanges.map((n) => n.className.replace('fr-dm ', ''))).toEqual(['manque', 'du', 'afaire', 'afaire', 'afaire', 'afaire']);
    expect(losanges[1].getAttribute('aria-label')).toBe('Maische · 13 h 05 · dû maintenant');
  });
});

describe('BrewFrise : les gestes', () => {
  it('toucher un losange dit « nom · heure »', () => {
    rendre();
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Maische · 13 h 05/ }));
    expect(screen.getByRole('status').textContent).toBe('Maische · 13 h 05');
  });

  it('toucher une étiquette « à côté » dit « nom · heure »', () => {
    rendre();
    fireEvent.click(screen.getByRole('button', { name: 'levure' }));
    expect(screen.getByRole('status').textContent).toBe('levure · 15 h 20');
  });

  it('toucher une phase navigue ; une phase sans étape ne répond pas', () => {
    const onPhase = vi.fn();
    rendre({ onPhase, phasesIndisponibles: ['boil'] });
    fireEvent.click(screen.getByRole('button', { name: 'Empâter' }));
    expect(onPhase).toHaveBeenCalledWith('mash');
    const boil = screen.getByRole('button', { name: 'Ébullition' }) as HTMLButtonElement;
    expect(boil.disabled).toBe(true);
    fireEvent.click(boil);
    expect(onPhase).toHaveBeenCalledTimes(1);
  });

  it('la vue affichée est dite (aria-pressed, aria-current)', () => {
    rendre({ vue: 'mash' });
    const mash = screen.getByRole('button', { name: 'Empâter' });
    expect(mash.getAttribute('aria-pressed')).toBe('true');
    expect(mash.getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: 'Préparer' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('les libellés se remplacent (« Extraire » pour une extraction)', () => {
    rendre({ libelles: { mash: 'Extraire' } });
    expect(screen.getByRole('button', { name: 'Extraire' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Empâter' })).toBeNull();
  });

  it('une préparation sans heure connue n’est pas posée à une heure inventée', () => {
    const { container } = rendre({ plan: { ...plan, aCote: [...plan.aCote, { id: 'x', nom: 'eau de rinçage', heure: null, fait: false }] } });
    const sans = container.querySelector('.fr-cote-sans') as HTMLElement;
    expect(sans.textContent).toContain('eau de rinçage');
    expect(sans.textContent).toContain('?');
    expect(container.querySelectorAll('.fr-cote .fr-ch[style*="left"]')).toHaveLength(3);
  });

  it('aucun champ de saisie (jamais type="number")', () => {
    const { container } = rendre();
    expect(container.querySelector('input')).toBeNull();
  });
});

describe('BrewFrise : règles de calcul', () => {
  it('positionFrise : proportionnelle au temps, bornée à [0 %, 100 %]', () => {
    expect(positionFrise(h(11, 45), h(11, 45), h(17, 30))).toBe(0);
    expect(positionFrise(h(17, 30), h(11, 45), h(17, 30))).toBe(100);
    expect(positionFrise(h(13, 5), h(11, 45), h(17, 30))).toBeCloseTo(23.19, 2);
    expect(positionFrise(h(9, 0), h(11, 45), h(17, 30))).toBe(0);
    expect(positionFrise(h(20, 0), h(11, 45), h(17, 30))).toBe(100);
  });

  it('heureFrise : « 13 h 05 », minutes sur deux chiffres, heure locale', () => {
    expect(heureFrise(h(13, 5))).toBe('13 h 05');
    expect(heureFrise(h(9, 0))).toBe('9 h 00');
    expect(heureFrise(h(17, 20))).toBe('17 h 20');
  });

  it('heuresDeLaFrise : les heures pleines de la journée, sans celles que la pastille couvre', () => {
    expect(heuresDeLaFrise(h(11, 45), h(17, 30), h(13, 5)).map((x) => new Date(x).getHours())).toEqual([12, 14, 15, 16, 17]);
    expect(heuresDeLaFrise(h(11, 45), h(17, 30), h(17, 20)).map((x) => new Date(x).getHours())).toEqual([12, 13, 14, 15]);
  });

  it('etatDesPhases : par l’horloge, ou par la phase réellement en cours (ébullition en retard)', () => {
    const parHorloge = etatDesPhases(plan.phases, h(15, 5));
    expect(parHorloge.map((e) => e.etat)).toEqual(['past', 'past', 'cur', 'fut']);
    expect(parHorloge[2].avance).toBeCloseTo((15 / 90) * 100, 1);
    // 16 h 40 : l'horloge dirait « Refroidir » ; le brasseur est encore à l'ébullition
    const enRetard = etatDesPhases(plan.phases, h(16, 40), 'boil');
    expect(enRetard.map((e) => e.etat)).toEqual(['past', 'past', 'cur', 'fut']);
    expect(enRetard[2].avance).toBe(100);
  });

  it('rangerCote : deux étiquettes qui se touchent passent sur deux rangées, jamais l’une sur l’autre', () => {
    const lignes = rangerCote(
      [
        { id: 'a', texte: 'rinçage 76 °C', heure: h(13, 50) },
        { id: 'b', texte: 'levure', heure: h(14, 5) },
        { id: 'c', texte: 'refroidisseur', heure: h(15, 55) }
      ],
      { debut: h(11, 45), fin: h(17, 30), largeur: 320 }
    );
    const rangee = Object.fromEntries(lignes.map((l) => [l.id, l.rangee]));
    expect(rangee.a).toBe(0);
    expect(rangee.b).toBe(1);
    expect(rangee.c).toBe(0);
  });

  it('rangerCote : une étiquette qui sortirait à droite se cale à gauche de son heure', () => {
    const [l] = rangerCote([{ id: 'z', texte: 'refroidisseur', heure: h(17, 25) }], { debut: h(11, 45), fin: h(17, 30), largeur: 320 });
    expect(l.droite).toBe(true);
  });

  it('rangerCote : sans heure, aucune étiquette n’est posée', () => {
    expect(rangerCote([{ id: 'n', texte: 'x', heure: null }], { debut: h(11, 45), fin: h(17, 30), largeur: 320 })).toEqual([]);
  });
});

describe('BrewFrise : 14 px partout (contrôle du CSS)', () => {
  const css = readFileSync('src/ui/brew-frise.css', 'utf8');
  it('aucune taille de police sous 14 px', () => {
    const tailles = [...css.matchAll(/font(?:-size)?:\s*(?:[0-9]{3}\s+)?(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]));
    expect(tailles.length).toBeGreaterThan(3);
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(14);
    expect(css).not.toMatch(/font-size:\s*\.?\d+(?:\.\d+)?rem/);
  });
  it('un losange garde une zone de toucher d’au moins 32 px', () => {
    expect(css).toMatch(/\.fr-rel \.fr-dm::after\s*\{[^}]*inset:\s*-10px/);
  });
});
