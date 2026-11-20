import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ajouterJours, etiquetteS, type ChoseCalendrier } from '../../src/domain/calendrier';
import { MESURES_PORTRAIT, Rangee, type Colonne } from '../../src/ui/calendrier/frise/Rangee';

/**
 * CAL-PASSE Q n° 6 (21.11, critique de vision n° 6 : « après un geste, la barre garde sa ligne ; on ne perd pas ce qu'on vient de toucher »).
 * Le geste : tirer le BORD de Hefe (sa fin recule ou avance de quelques semaines) ; Hefe est alors plus longue que sa voisine Ssr, qui partage son
 * début. Le tri d'une rangée met la plus longue d'abord : sans mémoire, Hefe saute au-dessus de Ssr et le brasseur ne la retrouve plus sous son
 * doigt. Le rang d'origine (N1, ab2597a8a) fait garder à chaque chose sa ligne tant que la vue garde son échelle.
 * Preuve : échoue sur ab2597a8a^ (Rangee sans `rang`), passe sur HEAD (rejoué sur un arbre temporaire du commit précédent, rien remis à HEAD).
 * Banc — données simulées, aucun réseau.
 */
afterEach(cleanup);
const L = '2026-11-16';
const COLS: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
const brassin = (id: string, titre: string, s0: number, s1: number): ChoseCalendrier => ({
  id, rangee: 'brassins', titre, etiquette: titre, duree: 'pas brassée · prête 23 nov.',
  debut: ajouterJours(L, s0 * 7 + 1), fin: ajouterJours(L, s1 * 7 + 3),
  source: { genre: 'batch', id, statut: 'planifie' }, ouvre: { ecran: 'brassin', id }, deplacable: true
} as unknown as ChoseCalendrier);
const rien = () => undefined;
const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };
const rangee = (choses: ChoseCalendrier[]) => (
  <Rangee id="brassins" choses={choses} colonnes={COLS} largeurColonne={61} largeur={366} mesures={MESURES_PORTRAIT} vueLarge={false} reserveDroite={76}
    masquee={false} cause={null} epingles={[]} etoiles={[]} partMax={0} drag={null} onAjouter={rien} onBasculerMasque={rien} barre={gestes} />
);
const haut = (container: HTMLElement, id: string) => parseFloat((container.querySelector(`[data-chose="${id}"]`) as HTMLElement).style.top);

describe('CAL-PASSE Q n° 6 : le bord tiré, la barre garde sa ligne', () => {
  const ssr = brassin('SSR', 'Ssr', 0, 2);
  it('Hefe, courte, sous Ssr : on tire son bord, elle devient plus longue que Ssr et reste sur sa ligne', () => {
    const hefe = brassin('HEFE', 'Hefe', 0, 1);
    const { container, rerender } = render(rangee([hefe, ssr]));
    const avant = { hefe: haut(container, 'HEFE'), ssr: haut(container, 'SSR') };
    expect(avant.hefe).toBeGreaterThan(avant.ssr);
    rerender(rangee([brassin('HEFE', 'Hefe', 0, 4), ssr]));
    expect(haut(container, 'HEFE')).toBe(avant.hefe);
    expect(haut(container, 'SSR')).toBe(avant.ssr);
  });
  it('tirer le bord dans l’autre sens (Hefe raccourcie) : même ligne, aussi', () => {
    const { container, rerender } = render(rangee([brassin('HEFE', 'Hefe', 0, 3), ssr]));
    const avant = haut(container, 'HEFE');
    rerender(rangee([brassin('HEFE', 'Hefe', 0, 1), ssr]));
    expect(haut(container, 'HEFE')).toBe(avant);
  });
});
