import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { lirePosee } from '../../src/ui/calendrier/frise/posee';
import { cleanup, render } from '@testing-library/react';
import { ajouterJours, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { Frise } from '../../src/ui/calendrier/frise/Frise';
import { MESURES_PAYSAGE, MESURES_PAYSAGE_BRASSINS, MESURES_PORTRAIT_BRASSINS, type Colonne } from '../../src/ui/calendrier/frise/Rangee';

/*
 * Voie 1 de la correction des défauts Calendrier (20.11) : PC-147 et PC-146 (844 × 390, critique des corrections PC n° 2, 3 et 6).
 * Quatre brassins se chevauchent dans le temps, donc sur quatre lignes. En paysage la ligne de 20 px ne laissait que 2 px entre deux barres de
 * brassin : le pied et les jalons de l'une (5,5 px sous la barre) et la zone de toucher de 24 px de la suivante se recouvraient, et le doigt posé
 * sur le bord ou le jalon de la Blonde tombait sur le Stout. L'espace entre deux brassins (18.11) tient en paysage : 8 px au moins.
 * La géométrie des doigts se joue au vrai rendu : scripts/agents/vision-calendrier.mjs, états V1b et V1c.
 */

const L = lundiDe('2026-11-16');
const colonnes: Colonne[] = Array.from({ length: 13 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: `S${47 + i}` }));
const chose = (id: string, rangee: ChoseCalendrier['rangee'], titre: string, deSem: number, aSem: number): ChoseCalendrier => ({
  id, rangee, titre, debut: ajouterJours(L, deSem * 7), fin: ajouterJours(L, aSem * 7 + 6), centimes: -10000,
  source: { genre: 'plan', id: `p-${id}`, origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true
} as unknown as ChoseCalendrier);
const rien = () => undefined;
const monter = (choses: ChoseCalendrier[], paysage: boolean) => render(
  <Frise
    choses={choses} colonnes={colonnes} paysage={paysage} ordre={[]} masquees={[]} filtre={null} epingles={[]} etoiles={[]}
    drag={null} onAjouter={rien} onBasculerMasque={rien} largeurRepli={844}
    barre={{ onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien }}
  />
);
afterEach(() => cleanup());

const hautsDeBarres = (rangee: string): number[] => [...document.querySelectorAll<HTMLElement>(`section[data-rangee="${rangee}"] .cal-barre`)]
  .map(b => lirePosee(b.style).y).filter(Number.isFinite).sort((a, b) => a - b);
const ecarts = (h: number[]) => h.slice(1).map((x, i) => x - h[i]);

describe('PC-147 : l’espace entre deux brassins en paysage', () => {
  const brassins = [chose('b1', 'brassins', 'Saison', 0, 5), chose('b2', 'brassins', 'IPA', 0, 4), chose('b3', 'brassins', 'Blonde', 1, 5), chose('b4', 'brassins', 'Stout', 1, 4)];

  it('844 × 390 : deux barres de brassin voisines laissent 8 px d’espace au moins (ligne ≥ barre + 8)', () => {
    monter(brassins, true);
    const h = hautsDeBarres('brassins');
    expect(h.length).toBe(4);
    for (const e of ecarts(h)) expect(e).toBeGreaterThanOrEqual(MESURES_PAYSAGE_BRASSINS.barre + 8);
  });

  it('les autres rangées du paysage gardent leurs 20 px (la place gagnée en lignes), et le portrait ne change pas', () => {
    expect(MESURES_PAYSAGE.ligne).toBe(20);
    monter([chose('t1', 'travaux', 'Sols', 0, 4), chose('t2', 'travaux', 'Colle', 0, 3)], true);
    const h = hautsDeBarres('travaux');
    expect(h.length).toBe(2);
    for (const e of ecarts(h)) expect(e).toBe(MESURES_PAYSAGE.ligne);
    cleanup();
    monter(brassins, false);
    /* REPRISE-4 (b, 22.11) : en portrait aussi, le picto d'étape (4 px sous la barre) garde 2 px d'air avant la barre du dessous */
    expect(MESURES_PORTRAIT_BRASSINS.ligne).toBeGreaterThanOrEqual(MESURES_PORTRAIT_BRASSINS.barre + 6);
    for (const e of ecarts(hautsDeBarres('brassins'))) expect(e).toBe(MESURES_PORTRAIT_BRASSINS.ligne);
  });
});
