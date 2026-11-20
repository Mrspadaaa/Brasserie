import { describe, expect, it } from 'vitest';
import { ajouterJours, etiquetteS, type ChoseCalendrier } from '../../src/domain/calendrier';
import { disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { largeurTexte } from '../../src/ui/calendrier/frise/Marque';

/**
 * CAL-PASSE Q n° 8 (21.11, critique de vision : « le + cache le −420 de Brouwland », « pas brassée », « prête 23 nov. », « Ttt · coût à venir »).
 * Le + volant est fixe, à droite, hors de la frise : il couvre 76 px au bout de la frise à 390. L'invariant, pour toute chose posée par `disposer` :
 * aucun texte (nom, montant, durée) ne passe dans la zone du + : une étiquette à droite finit avant `bord`, une étiquette à gauche d'une chose
 * sous le + finit avant `bord`, un nom écrit dans la barre tient entre le début de la barre et `bord` (la part sous le + est déclarée en `reserveDedans`).
 * Décision du pilote : rien sous le + ; quand le bout d'une barre passe sous le +, le nom passe à côté.
 * Banc — données simulées, aucun réseau.
 */
const L = '2026-11-16';
const LARGEUR = 390, RESERVE = 76, BORD = LARGEUR - RESERVE, LC = LARGEUR / 6;
const COLS: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));

const brassin = (id: string, titre: string, s0: number, s1: number, duree: string): ChoseCalendrier => ({
  id, rangee: 'brassins', titre, etiquette: `${titre} · coût à venir`, coutAVenir: true, partiel: true, duree,
  debut: ajouterJours(L, s0 * 7 + 1), fin: ajouterJours(L, s1 * 7 + 3),
  source: { genre: 'batch', id, statut: 'planifie' }, ouvre: { ecran: 'brassin', id }, deplacable: true
} as unknown as ChoseCalendrier);
const achat = (id: string, titre: string, centimes: number, jour: number): ChoseCalendrier => ({
  id, rangee: 'achats', titre, debut: ajouterJours(L, jour), fin: ajouterJours(L, jour), centimes,
  source: { genre: 'plan', id, origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true
} as ChoseCalendrier);

const poser = (c: ChoseCalendrier) => disposer([c], COLS, LC, LARGEUR, { reserveDroite: RESERVE }).items[0];

/** Ce qui doit tenir pour une chose posée : l'emprise des textes finit avant le +. */
function verifier(c: ChoseCalendrier): string[] {
  const d = poser(c);
  const fautes: string[] = [];
  const o0 = d.gauche, o1 = d.gauche + d.largeur;
  if (d.cote === 'droite' && o1 + 6 + d.place > BORD + 1) fautes.push(`${c.id} : étiquette à droite finit à ${Math.round(o1 + 6 + d.place)} > ${BORD}`);
  if (d.cote === 'gauche' && o0 - 6 - (d.retrait ?? 0) > BORD + 1) fautes.push(`${c.id} : étiquette à gauche finit à ${Math.round(o0 - 6 - (d.retrait ?? 0))} > ${BORD}`);
  if (d.cote === 'dedans' && !d.marque) {
    const sous = Math.max(0, o1 - Math.max(o0, BORD));
    if ((d.reserveDedans ?? 0) !== sous) fautes.push(`${c.id} : part sous le + ${sous} px, déclarée ${d.reserveDedans ?? 0}`);
    if (d.largeur - sous - 16 < largeurTexte(c.titre)) fautes.push(`${c.id} : le nom (${Math.round(largeurTexte(c.titre))} px) ne tient pas dans ${d.largeur - sous - 16} px avant le +`);
  }
  return fautes;
}

describe('CAL-PASSE Q n° 8 : rien sous le + volant, à 390 (76 px de réserve)', () => {
  it('une barre de brassin, de n’importe quelle semaine à n’importe quelle longueur : nom, montant et durée finissent avant le +', () => {
    const fautes: string[] = [];
    for (let s0 = 0; s0 < 6; s0++) for (let s1 = s0; s1 < 6; s1++) fautes.push(...verifier(brassin(`B${s0}${s1}`, 'Porter d’hiver', s0, s1, 'J0 / 35 · prête 11 janv.')));
    expect(fautes).toEqual([]);
  });

  it('Brouwland · malt −420 : à chaque jour des six semaines, l’étiquette finit avant le +', () => {
    const fautes: string[] = [];
    for (let j = 0; j < 42; j++) fautes.push(...verifier(achat(`A${j}`, 'Brouwland · malt', -42000, j)));
    expect(fautes).toEqual([]);
  });

  it('un nom long (« Commande groupée de malt −540 ») dans la dernière colonne reste hors de la zone du +', () => {
    const fautes: string[] = [];
    for (let j = 28; j < 42; j++) fautes.push(...verifier(achat(`C${j}`, 'Commande groupée de malt', -54000, j)));
    expect(fautes).toEqual([]);
  });

  it('la part de barre sous le + est déclarée : zéro quand la barre finit avant, le reste quand elle passe dessous', () => {
    const avant = poser(brassin('AV', 'Hefe', 0, 1, 'pas brassée · prête 23 nov.'));
    expect(avant.reserveDedans ?? 0).toBe(0);
    const dessous = poser(brassin('DE', 'Ttt', 3, 5, 'J0 / 28 · prête 28 déc.'));
    const fin = dessous.gauche + dessous.largeur;
    expect(fin).toBeGreaterThan(BORD);
    /* le nom passe à côté (« gauche ») ou reste dedans en déclarant la part sous le + */
    if (dessous.cote === 'dedans') expect(dessous.reserveDedans).toBeCloseTo(fin - Math.max(dessous.gauche, BORD), 5);
    else expect(dessous.cote).toBe('gauche');
  });
});
