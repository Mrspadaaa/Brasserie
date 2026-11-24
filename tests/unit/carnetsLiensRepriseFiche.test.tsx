// @vitest-environment jsdom
/*
 * Reprise du 23.11 soir, voie « liens », la part de la fiche d'article :
 *   T26-2 : « Non publié par le vendeur : Volume » seulement pour un article qui a un volume (jamais un houblon, une levure, un malt) ;
 *           une page qui donne le volume le montre.
 *   T26-3 : la page est lue, sa photo ne l'est pas : la fiche dit « photo non lue ».
 * Aucun Gemini, aucun réseau.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FicheArticle, matiereSansVolume } from '../../src/ui/carnets/FicheArticle';
import type { ArticleV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(() => cleanup());
const LE = '2026-11-23T10:00:00.000Z';

const article = (nom: string, plus: Partial<ArticleV> = {}): ArticleV => ({
  id: 'A1', nom, url: 'https://exemple.ch/produit', domaine: 'exemple.ch', prixCentimes: 10000, devise: 'CHF', lecture: 'lue',
  valeurs: { Largeur: { valeur: '54', unite: 'cm', origine: 'page' }, Poids: { valeur: '38', unite: 'kg', origine: 'page' } }, ...plus
});
/* le carnet compare aussi un autre article qui publie un volume : c'est lui qui fait exister la colonne « Volume » (comme au test en ligne) */
const autre = (): ArticleV => ({ id: 'A2', nom: 'Cuve inox', prixCentimes: 90000, devise: 'CHF', lecture: 'lue', valeurs: { Volume: { valeur: 30, unite: 'l', origine: 'page' } } });
const carnetDe = (articles: ArticleV[]): ContenuCarnetV => ({
  creeLe: LE, phrase: 'x', facons: [], notes: [], photos: [], articles,
  criteres: [{ id: 'K0', texte: 'Volume', origine: 'vous' as const, caracteristique: { nom: 'Volume', sens: 'plus' as const } }]
});
const fiche = (a: ArticleV) => {
  const { container } = render(<FicheArticle article={a} carnet={carnetDe([a, autre()])} titreCarnet="ZZ" onRetour={() => undefined} onVeille={() => undefined} />);
  return { texte: container.textContent!.replace(/[  ]/g, ' '), container };
};

describe('T26-2 : « Non publié : Volume » n\'a de sens que pour un appareil', () => {
  it('un houblon, une levure, un malt : aucune mention du volume', () => {
    for (const nom of ['Citra (USA) 1 kg Hopfenpellets Typ 90', 'Mosaic Hopfenpellets', 'Brew Monk Levure sèche S-04', 'Malz Pilsner 25 kg', 'Fermentis SafAle US-05 yeast']) {
      const { texte } = fiche(article(nom));
      expect(texte, nom).not.toMatch(/Non publié/);
      expect(texte, nom).not.toMatch(/Volume/);
    }
  });
  it('un houblon reconnu à ses valeurs (alpha, récolte) même si son nom ne le dit pas', () => {
    const a = article('Mosaic T90', { valeurs: { Alpha: { valeur: '11.4%', origine: 'page' }, Erntejahr: { valeur: '2025', origine: 'page' } } });
    expect(matiereSansVolume(a)).toBe(true);
    expect(fiche(a).texte).not.toMatch(/Volume/);
  });
  it('un appareil, une cuve, un fermenteur : la mention reste (l\'inconnu est dit, jamais 0)', () => {
    for (const nom of ['Kibernetik KS240L', 'Brew Monk stainless steel fermenter 30 L']) {
      const { texte } = fiche(article(nom));
      expect(texte, nom).toContain('Non publié par le vendeur : Volume');
    }
  });
  it('la page donne le volume : il est repris et la mention disparaît', () => {
    const a = article('Kibernetik KS240L', { valeurs: { Volume: { valeur: '242', unite: 'l', origine: 'page' }, Largeur: { valeur: '54', unite: 'cm', origine: 'page' } } });
    const { texte } = fiche(a);
    expect(texte).toContain('242');
    expect(texte).not.toMatch(/Non publié/);
  });
  it('un houblon dont la page donne un volume le montre quand même (rien n\'est caché)', () => {
    const a = article('Mosaic Hopfenpellets', { valeurs: { Volume: { valeur: '50', unite: 'ml', origine: 'page' }, Alpha: { valeur: '11.4%', origine: 'page' } } });
    expect(fiche(a).texte).toContain('50');
  });
});

describe('T26-3 : une photo non lue se dit', () => {
  it('page lue, aucune photo : « photo non lue » sous le pictogramme', () => {
    const { texte, container } = fiche(article('Brew Monk fermenter 30 L'));
    expect(texte).toContain('photo non lue');
    expect(container.querySelector('[data-cadre="picto"] figcaption')?.textContent).toMatch(/photo non lue/);
    expect(container.querySelector('[data-cadre="picto"]')?.getAttribute('aria-hidden')).toBeNull();
  });
  it('une photo lue : pas de mention', () => {
    const { texte } = fiche(article('Kibernetik KS240L', { photo: 'https://static.exemple.ch/p.jpg', photos: ['https://static.exemple.ch/p.jpg'] }));
    expect(texte).not.toContain('photo non lue');
  });
  it('un article tapé à la main (sans lien) : pas de mention, rien n\'a été lu', () => {
    const { texte } = fiche(article('Hotte', { url: undefined, domaine: undefined, lecture: 'a-lire' }));
    expect(texte).not.toContain('photo non lue');
  });
});
