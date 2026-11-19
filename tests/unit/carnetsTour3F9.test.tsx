// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f9 (après la critique v6) :
 * n° 1 — le carnet choisi disait « Critère : Moins de condensation au plafond : capter la buée » (le critère sans valeur à comparer) au
 *        lieu de « tient 80 °C, puis le débit », ceux qui ont classé le choix ;
 * n° 2 — Choisir à 390 : « sous votre minimum de 1 500 m³/h » écrit par-dessus « Gastro-Lüftung », le nom écrasé un mot par ligne ;
 * n° 3 — Comparer à 390 : un glissé du doigt décalait toute la page de 67 px (un texte caché du tableau débordait hors de sa zone).
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { Choisir } from '../../src/ui/carnets/Choisir';
import type { ArticleV } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);
const rien = () => undefined;
const texte = (el: Element) => (el.textContent ?? '').replace(/[\u00a0\u202f]/g, ' ');
const V: CarnetDoc = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
const TITRE = 'ZZ TEST — Ventilation de la salle de brassage';
const articleV = (id: string) => V.carnet.articles.find(a => a.id === id) as unknown as ArticleV;
const css = (f: string) => fs.readFileSync(path.resolve(__dirname, `../../src/ui/carnets/${f}`), 'utf8').replace(/\r\n/g, '\n');
const regle = (src: string, sel: string) => { const i = src.indexOf(`${sel} {`); return i < 0 ? '' : src.slice(i, src.indexOf('}', i)); };

describe('f9 n° 1 : le carnet choisi dit le critère qui a classé le choix', () => {
  it('« Critères : tient 80 °C, puis le débit », jamais « capter la buée » (sans valeur à comparer)', () => {
    render(<Choisir etape="choisi" titre={TITRE} carnet={V.carnet as never} critere={V.carnet.criteres[0] as never}
      choix={{ articleId: 'ZZ-V-A1', le: '2026-11-19T10:00:00.000Z', pourquoi: '' } as never} article={articleV('ZZ-V-A1')} ecartes={[]} onRetour={rien} />);
    const ligne = texte(screen.getByRole('img', { name: 'critère' }).parentElement!);
    expect(ligne).toContain('tient 80 °C, puis le débit');
    expect(ligne).not.toContain('capter la buée');
  });
});

describe('f9 n° 2 : Choisir, la liste reste lisible à 390', () => {
  it('le seuil se dit court sous la valeur (« < min. 1 500 »), la phrase entière pour le lecteur d’écran ; la colonne de droite est bornée', () => {
    const autres = ['ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4'].map((id, i) => ({ article: articleV(id), rang: i + 2 }));
    const { container } = render(<Choisir etape="choisir" titre={TITRE} carnet={V.carnet} article={articleV('ZZ-V-A1')} sur={4} valeurs={[]} autres={autres} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
    const hors = [...container.querySelectorAll('.cn-choisir .cn-article .cn-hors-seuil')];
    expect(hors.length).toBeGreaterThan(0);
    for (const h of hors) {
      expect(texte(h.querySelector('[aria-hidden]')!)).toMatch(/^< min\. 1 500$/);
      expect(texte(h.querySelector('.cn-cache')!)).toContain('sous votre minimum de 1 500');
    }
    const r = regle(css('carnets-decider.css'), '.cn-choisir .cn-article .cn-droite');
    expect(r).toMatch(/max-width:/);
    expect(r).toMatch(/flex: 0 0 auto/);
  });
});

describe('f9 n° 3 : Comparer à 390, seul le tableau défile', () => {
  it('la zone du tableau contient ses textes cachés (position: relative) : rien ne déborde dans la page', () => {
    expect(regle(css('carnets.css'), '.cn-tableau-zone')).toMatch(/position: relative/);
  });
});
