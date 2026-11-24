// @vitest-environment jsdom
/*
 * Tour 28 (23.11 soir, voie fix28-serveur), la part de la fiche d'article :
 *   T28-14 : la fiche d'un houblon dit d'abord l'alpha, la récolte, les huiles totales (en ml/100 g) ; le reste suit.
 * Aucun Gemini, aucun réseau.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import type { ArticleV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(() => cleanup());
const LE = '2026-11-23T10:00:00.000Z';
const v = (valeur: string, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });

/* L'ordre de la page (hopfenmarkt Mosaic, test en ligne du tour 28) : l'alpha venait après le farnésène et le caryophyllène. */
const mosaic = (valeurs: ArticleV['valeurs']): ArticleV => ({
  id: 'A1', nom: 'Mosaic Hopfenpellets', url: 'https://hopfenmarkt.ch/produkt/hopfen/mosaic', domaine: 'hopfenmarkt.ch', prixCentimes: 725, devise: 'CHF', lecture: 'lue', valeurs
});
const carnet = (a: ArticleV): ContenuCarnetV => ({ creeLe: LE, phrase: 'x', facons: [], notes: [], photos: [], articles: [a], criteres: [] });
const fiche = (a: ArticleV) => {
  const { container } = render(<FicheArticle article={a} carnet={carnet(a)} titreCarnet="ZZ" onRetour={() => undefined} onVeille={() => undefined} />);
  return container;
};
const noms = (c: HTMLElement) => [...c.querySelectorAll('dl.cn-carac dt')].map((x) => x.textContent);
const case_ = (c: HTMLElement, nom: string) => [...c.querySelectorAll('dl.cn-carac > div')].find((d) => d.querySelector('dt')?.textContent === nom)?.textContent?.replace(/[  ]/g, ' ');

describe('T28-14 : la fiche d\'un houblon commence par ce que le brasseur cherche', () => {
  const valeurs = {
    'Pays de récolte': v('USA'), 'Type de houblon': v('Houblon mixte'), Farnésène: v('0,2 %'), Caryophyllène: v('7,2 %'),
    Alpha: v('11,4 %'), Récolte: v('2025'), 'Huiles totales': v('0,8', 'ml/100 g'), Myrcène: v('47,9 %'), Bêta: v('3,4 %')
  };
  it('alpha, récolte, huiles totales en tête ; le reste garde l\'ordre de la page', () => {
    const n = noms(fiche(mosaic(valeurs)));
    expect(n.slice(0, 3)).toEqual(['Alpha', 'Récolte', 'Huiles totales']);
    expect(n.slice(3)).toEqual(['Pays de récolte', 'Type de houblon', 'Farnésène', 'Caryophyllène', 'Myrcène', 'Bêta']);
  });
  it('les noms de la page d\'avant (Alpha, Erntejahr, Total oil) passent aussi, et « 0.8ml » se dit « 0,8 ml/100 g »', () => {
    const c = fiche(mosaic({ Farnesene: v('0.2%'), Caryophyllene: v('7.2%'), Alpha: v('11.4%'), 'Total oil': v('0.8ml'), Erntejahr: v('2025') }));
    expect(noms(c).slice(0, 3)).toEqual(['Alpha', 'Erntejahr', 'Total oil']);
    expect(case_(c, 'Total oil')).toContain('0,8 ml/100 g');
  });
  it('un appareil n\'est pas touché : l\'ordre de la page reste', () => {
    const a: ArticleV = { id: 'A2', nom: 'Kibernetik KS240L', prixCentimes: 30200, devise: 'CHF', lecture: 'lue', valeurs: { Hauteur: v('143,5', 'cm'), Largeur: v('54', 'cm'), Poids: v('38', 'kg') } };
    expect(noms(fiche(a))).toEqual(['Hauteur', 'Largeur', 'Poids']);
  });
});
