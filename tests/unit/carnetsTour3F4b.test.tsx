// @vitest-environment jsdom
// Carnet, tour 3 du 19.11, voie f4b : constats de la vision locale (v1, v2). Un test par constat (L13 : rouge avant, vert après).
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { tableau as calculerTableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { AIDES_ETEINTES, type CarnetV } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);
const rien = () => undefined;
const F = fixtureCarnets();
const lire = (id: string): CarnetDoc => lireCarnet(F.find(i => i.id === id))!;
const css = (f: string) => fs.readFileSync(path.resolve(__dirname, `../../src/ui/carnets/${f}`), 'utf8');
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ');
/** Le bloc `@media (max-width: 899px) { … }` (accolades comptées). */
const blocMedia = (src: string, requete: string): string => {
  const i = src.indexOf(`@media (${requete})`);
  if (i < 0) return '';
  let n = 0;
  for (let j = src.indexOf('{', i); j < src.length; j++) {
    if (src[j] === '{') n++;
    else if (src[j] === '}' && --n === 0) return src.slice(i, j + 1);
  }
  return '';
};
const ouvrir = (c: CarnetDoc, x: Partial<React.ComponentProps<typeof CarnetOuvert>> = {}) => render(
  <CarnetOuvert carnet={c as unknown as CarnetV} aides={AIDES_ETEINTES} liens={[]} tableau={calculerTableau(c.carnet as never) as never} onRetour={rien} onRenommer={rien}
    onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} {...x} />);

describe('PCN-54 : le picto de l’article tient dans son cadre à 390', () => {
  it('à moins de 900 px, le dessin est borné par la hauteur du cadre (104 px)', () => {
    const m = blocMedia(css('carnets.css'), 'max-width: 899px');
    const r = /\.cn-fiche \.cn-vignette-fiche svg\s*\{[^}]*max-height:\s*(\d+)px/.exec(m);
    expect(r, 'règle « .cn-fiche .cn-vignette-fiche svg { max-height } » dans le bloc 899').not.toBeNull();
    expect(Number(r![1])).toBeLessThanOrEqual(96);
  });
});

describe('PCN-103 : la bulle G8 dit entre quoi, sans « … »', () => {
  const sugg = { critere: 'pas trop de bruit', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' };
  it('le texte nomme les deux candidats, sans « peut »', () => {
    const { container } = render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} suggestion={sugg as never} />);
    fireEvent.focus(container.querySelector('textarea')!);
    const b = container.querySelector('.cn-bulle')!;
    expect(b).not.toBeNull();
    expect(texte(b)).toContain('« pas trop de bruit » tranche entre Hotte inox + extracteur et Extracteur mural seul');
    expect(texte(b)).not.toContain('peut trancher');
  });
  it('la bulle passe sur deux lignes (jamais d’ellipse sur une seule)', () => {
    const fil = css('carnets-fil.css');
    const r = /\.cnf-aides-ligne > \.cn-bulle > span:last-child\s*\{([^}]*)\}/.exec(fil);
    expect(r).not.toBeNull();
    expect(r![1]).not.toMatch(/white-space:\s*nowrap/);
    expect(r![1]).toMatch(/-webkit-line-clamp:\s*2/);
    expect(fil).not.toMatch(/\.cnf-aides-ligne > \.cn-bulle\s*\{\s*white-space:\s*nowrap/);
  });
});

describe('PCN-108, PCN-132 (G20, g5:v06-11) : au 2e article, le tableau est à l’écran, le dépôt dit sous lui', () => {
  const V = lire(ID_VENTILATION);
  const depose = V.carnet.articles[1];
  it('l’article déposé est une ligne du tableau, pas une carte complète au-dessus', () => {
    const { container } = ouvrir(V, { rangee: { cible: 'article', id: depose.id, rang: '2e', onAnnuler: rien } });
    const tab = container.querySelector('.cn-tab')!;
    expect(tab).not.toBeNull();
    expect(texte(tab)).toContain(depose.nom!);
    expect(container.querySelector('.cn-rangee .cn-carte-complete, .cn-rangee [data-variante="complete"]')).toBeNull();
    const rangee = container.querySelector('.cn-rangee')!;
    expect(rangee).not.toBeNull();
    /* le bandeau « Article rangé ici · 2e » vient après le tableau (v06-11 : « Pompe magnétique rangée, 2e · Annuler » sous le tableau) */
    expect(tab.compareDocumentPosition(rangee) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(texte(rangee)).toMatch(/2e/);
  });
});

describe('PCN-113 : hors ligne, le carnet neuf dit que l’IA le range au retour, sans rubriques vides', () => {
  const neuf: CarnetV = { id: 'n', title: 'acheter 2 sachets de levure', status: 'idea',
    carnet: { creeLe: '2026-11-19T08:00:00.000Z', phrase: 'acheter 2 sachets de levure', criteres: [], facons: [], articles: [], notes: [], photos: [] } } as never;
  const monter = (ia: 'hors-ligne' | 'eteinte' | null) => render(<CarnetOuvert carnet={neuf} aides={AIDES_ETEINTES} liens={[]} tableau={null} vientDEtreCree iaIndisponible={ia}
    onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
  it('hors ligne : « au retour du réseau », ni « Façons · aucune », ni « Notes · aucune », ni « Photos · aucune »', () => {
    const t = texte(monter('hors-ligne').container);
    expect(t).toMatch(/au retour du réseau/);
    for (const r of ['Ce qui compte · rien encore', 'Façons · aucune', 'Articles · aucun', 'Photos · aucune', 'Notes · aucune']) expect(t).not.toContain(r);
  });
  it('en ligne : les rubriques de g5:v04-4 restent', () => {
    expect(texte(monter(null).container)).toContain('Façons · aucune');
  });
});

describe('v1-neuf 3, v2-neuf 5 : la puce proposée ne colle pas à la ligne d’état', () => {
  it('.cnf-proposees a une marge basse', () => {
    const r = /\.cnf-proposees\s*\{([^}]*)\}/.exec(css('carnets-fil.css'));
    expect(r).not.toBeNull();
    expect(r![1]).toMatch(/margin-bottom:\s*([89]|1\d)px/);
  });
});

describe('v1-neuf 5 : « À comparer » a une seule couleur (g05-1, g01-8 : vert)', () => {
  it('la pastille de statut et la rubrique de la liste prennent le même aplat', () => {
    const r = /\.cn-statut-research\s*\{([^}]*)\}/.exec(css('carnets.css'));
    expect(r).not.toBeNull();
    expect(r![1]).toContain('var(--c-zonebg)');
    expect(r![1]).toContain('var(--c-zonet)');
  });
});

describe('v1-neuf 6 : « votre phrase en titre » ne paraît jamais seul sous le tableau', () => {
  it('Frigo (titre = sa phrase), avec tableau : rien sous le tableau ; le titre est la phrase', () => {
    const c = lire(ID_FRIGO);
    const { container } = ouvrir(c);
    expect(container.querySelector('.cn-tab')).not.toBeNull();
    expect(texte(container)).not.toContain('votre phrase en titre');
    expect(texte(container.querySelector('.cn-titre')!).toLowerCase()).toContain(c.carnet.phrase.toLowerCase());
  });
  it('sans tableau, la mention reste sous le titre (L4-5)', () => {
    const c = lire(ID_FRIGO);
    const { container } = ouvrir(c, { tableau: null });
    expect(texte(container)).toContain('votre phrase en titre');
  });
});
