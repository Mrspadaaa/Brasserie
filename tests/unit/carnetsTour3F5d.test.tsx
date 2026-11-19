// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f5d (suite de f5b et f5c) :
 * n° 4  : champ G8 au focus, page en haut (390) : la page défilait de la hauteur de la bulle, le titre passait sous la barre
 *         À venir / Carnets / Réalisés. Elle ne défile que si elle était en bas (la bulle recouvrirait la dernière ligne).
 * n° 10 : la 2e pompe (meilleur débit, 40 contre 25 L/min) restait « moins bien que la 1re sur tout » à l'écran : le domaine ne pose
 *         plus `moinsBienQue` (7160b51e8), mais le repli de `moinsBienQueDe` (Comparer.tsx) recalculait sur les seules colonnes de critère.
 * n° 11 : un lien collé seul, cité « votre phrase : « https://… » » : c'est un lien, il se dit « votre lien ».
 * Fixture « ZZ TEST — … », IA simulée : aucun appel réel.
 */
import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { LigneRangee } from '../../src/ui/carnets/LigneRangee';
import { CarnetOuvert, texteMoinsBien } from '../../src/ui/carnets/CarnetOuvert';
import { moinsBienQueDe } from '../../src/ui/carnets/Comparer';
import { AIDES_ETEINTES, type CarnetV, type ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { tableau, type Colonne } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type DonneesCarnet } from '../../src/domain/carnets/modele';

vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));

afterEach(cleanup);
const rien = () => undefined;
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ');

describe('f5d n° 4 : la bulle G8 ne pousse pas le titre sous la barre quand la page est en haut', () => {
  const sugg = { critere: 'pas trop de bruit', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' };
  /* le défileur : un parent en overflow auto (jsdom n'a pas de scrollingElement) ; 390 × 660, page de 2 000 px */
  let boite: HTMLDivElement;
  const page = (scrollTop: number) => {
    boite = document.createElement('div');
    boite.style.overflowY = 'auto';
    document.body.appendChild(boite);
    const scrollBy = vi.fn();
    Object.defineProperty(boite, 'scrollTop', { configurable: true, value: scrollTop });
    Object.defineProperty(boite, 'clientHeight', { configurable: true, value: 660 });
    Object.defineProperty(boite, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(boite, 'scrollBy', { configurable: true, value: scrollBy });
    return scrollBy;
  };
  const hauteur = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  const bulle44 = () => Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return (this as HTMLElement).classList?.contains('cn-bulle') ? 44 : 0; } });
  afterEach(() => { if (hauteur) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', hauteur); boite?.remove(); });
  const focaliser = () => {
    const { container } = render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} suggestion={sugg as never} />, { container: boite });
    fireEvent.focus(container.querySelector('textarea')!);
    expect(container.querySelector('.cn-bulle')).not.toBeNull();
  };
  it('page en haut : aucun défilement (le titre reste sous les yeux)', () => {
    bulle44();
    const scrollBy = page(0);
    focaliser();
    expect(scrollBy).not.toHaveBeenCalled();
  });
  it('page en bas : elle défile de la bulle et de son écart, la dernière ligne reste visible', () => {
    bulle44();
    const scrollBy = page(2000 - 660);
    focaliser();
    expect(scrollBy).toHaveBeenCalledWith({ top: 44 + 8 });
  });
});

describe('f5d n° 10 : la 2e pompe, meilleur débit, n’est pas « moins bien que la 1re sur tout » à l’écran', () => {
  const art = (id: string, t: number, d: number, prix: number): Article => ({ id, nom: id, lecture: 'lue', prixCentimes: prix * 100, devise: 'CHF',
    valeurs: { 'température max': { valeur: t, unite: '°C', origine: 'exemple' }, 'débit': { valeur: d, unite: 'L/min', origine: 'exemple' } } });
  const magnetique = art('Pompe magnétique 12 V', 100, 25, 245);
  const inox = art('Pompe de transfert inox', 90, 40, 690);
  const V = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
  const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });
  const carnetPompe = (articles: Article[]) => avec(V, { facons: [], choix: undefined, articles,
    criteres: [{ id: 'K1', texte: 'Supporter le moût chaud', origine: 'ia', caracteristique: { nom: 'température max', unite: '°C', sens: 'plus' } }] });
  it('le domaine fait foi : ni rang du dominant ni texte, au tableau du carnet comme dans Comparer', () => {
    const t = tableau(carnetPompe([magnetique, inox]))!;
    expect(t.colonnes.map((k: Colonne) => k.nom)).toEqual(['température max', 'débit']);
    const l = t.lignes.find(x => x.articleId === inox.id)!;
    expect(moinsBienQueDe(t as never, l as never)).toBeNull();
    expect(texteMoinsBien(t as never, l as never)).toBeNull();
  });
  it('à débit égal, la 2e reste « moins bien que la 1re sur tout » (le domaine le pose)', () => {
    const t = tableau(carnetPompe([magnetique, art('Pompe de transfert inox', 90, 25, 690)]))!;
    const l = t.lignes.find(x => x.articleId === 'Pompe de transfert inox')!;
    expect(moinsBienQueDe(t as never, l as never)).toBe(1);
    expect(texteMoinsBien(t as never, l as never)).toMatch(/moins bien que la 1re sur tout/);
  });
});

describe('f5d n° 11 : un lien collé seul se cite « votre lien », jamais « votre phrase »', () => {
  const URL = 'https://exemple.invalid/pompe-magnetique';
  it('ligne rangée (Article rangé ici)', () => {
    const { container } = render(<LigneRangee sorte="article" phrase={URL} onAnnuler={rien}><p>carte</p></LigneRangee>);
    expect(texte(container)).toContain(`votre lien : « ${URL} »`);
    expect(texte(container)).not.toContain('votre phrase');
  });
  it('une phrase reste « votre phrase »', () => {
    const { container } = render(<LigneRangee phrase="pompe pour transférer le moût chaud" onAnnuler={rien}><p>carte</p></LigneRangee>);
    expect(texte(container)).toContain('votre phrase : « pompe pour transférer le moût chaud »');
  });
  it('carnet ouvert dont la phrase est un lien', () => {
    const c: CarnetV = { id: 'n', title: 'ZZ TEST — Pompe de transfert', status: 'idea',
      carnet: { creeLe: '2026-11-15T08:00:00.000Z', phrase: URL, criteres: [], facons: [], articles: [], notes: [], photos: [] } as ContenuCarnetV };
    const { container } = render(<CarnetOuvert carnet={c} aides={AIDES_ETEINTES} liens={[]} tableau={null} onRetour={rien} onRenommer={rien}
      onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    expect(texte(container)).toContain(`votre lien : « ${URL} »`);
    expect(texte(container)).not.toContain('votre phrase');
  });
});
