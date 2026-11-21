// @vitest-environment jsdom
// Carnet, tour 3 du 19.11, voie f13, tour 2 (critique Opus, CRITIQUE.md : n° 1 à 7 et 9). L13 : rouge avant, vert après.
// Les hauteurs réelles se mesurent dans Chrome (voies/f13/mesure.mjs, clavier simulé `?keyboard=300`, 390×844 et 390×660) ; ici, la
// structure et les gestes qui les produisent.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as Champ from '../../src/ui/carnets/ChampCarnet';
import { CarnetOuvert, type CarnetV } from '../../src/ui/carnets/CarnetOuvert';
import { AIDES_ETEINTES } from '../../src/ui/carnets/EtatIA';
import * as Titre from '../../src/ui/carnets/titre';

const { ChampCarnet, titreQuiTient } = Champ;
const placeholderCarnet = (Champ as unknown as { placeholderCarnet?: (t: string, place: number, m: (s: string) => number) => string }).placeholderCarnet;
afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); });
const rien = () => undefined;
const texte = (e: Element) => (e.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const css = (f: string) => fs.readFileSync(path.resolve(__dirname, `../../src/ui/carnets/${f}`), 'utf8').replace(/\r\n/g, '\n');
const regles = (f: string) => [...css(f).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] }));
const regle = (f: string, sel: RegExp, decl: RegExp) => regles(f).some(r => sel.test(r.sel) && decl.test(r.decl));
const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 390, width: 390, height: bottom - top, x: 0, y: top, toJSON: () => ({}) });
const attendre = () => act(() => new Promise<void>(r => setTimeout(r, 60)));

const SUGG = { critere: 'pas trop de bruit', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' };

describe('n° 1 et 2 (CARNET-CLAV) : clavier ouvert, la dernière note se place d’elle-même juste au-dessus du champ, entière', () => {
  /* la vue des carnets : la zone qui défile (notes dedans, la dernière en bas, cachée), puis la zone du champ, comme dans l'app */
  const monter = async (clavier: number, extra: Partial<React.ComponentProps<typeof ChampCarnet>> = {}) => {
    window.history.replaceState(null, '', clavier ? `/?keyboard=${clavier}` : '/');
    const r = render(
      <div data-carnets="">
        <div className="defile" style={{ overflowY: 'auto' }}><div className="cn-note">a</div><div className="cn-note">dernière</div></div>
        <ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="ZZ TEST — Ventilation" suggestion={SUGG} {...extra} />
      </div>);
    const defile = r.container.querySelector<HTMLElement>('.defile')!;
    Object.defineProperty(defile, 'scrollHeight', { configurable: true, value: 1400 });
    Object.defineProperty(defile, 'clientHeight', { configurable: true, value: 430 });
    const scrollBy = vi.fn();
    (defile as unknown as { scrollBy: unknown }).scrollBy = scrollBy;
    const notes = r.container.querySelectorAll<HTMLElement>('.cn-note');
    notes[0].getBoundingClientRect = () => rect(1000, 1060);
    notes[1].getBoundingClientRect = () => rect(1086, 1147);
    const zone = r.container.querySelector<HTMLElement>('.cn-champ-zone')!;
    zone.getBoundingClientRect = () => rect(435, 544);
    act(() => { r.container.querySelector('textarea')!.focus(); });
    await attendre();
    return scrollBy;
  };

  it('clavier ouvert, champ pris : l’app fait défiler de quoi poser la dernière note 12 px au-dessus du champ (ligne entière, pas coupée)', async () => {
    /* comme dans l'app (CarnetsVue) : « Ajouter » dans un carnet ouvert */
    const s = await monter(300, { libelleEnvoi: 'Ajouter' });
    expect(s).toHaveBeenCalled();
    /* 1147 − (435 − 12) = 724 */
    expect(s.mock.calls.at(-1)![0]).toMatchObject({ top: 724 });
  });

  it('clavier fermé : rien ne défile (sa maquette au repos)', async () => {
    expect(await monter(0)).not.toHaveBeenCalled();
  });

  it('pendant une modification (« Enregistrer ») : le cadre garde sa place, rien ne défile', async () => {
    expect(await monter(300, { libelleEnvoi: 'Enregistrer' })).not.toHaveBeenCalled();
  });
});

describe('n° 3 : la bulle G8 dit entre quoi et quoi, en deux lignes serrées au plus, jamais coupée au milieu d’un mot', () => {
  it('clavier ouvert : plus aucune règle d’une ligne tronquée (« Hotte in… ») sur la bulle', () => {
    const clavier = regles('carnets-fil.css').filter(r => /data-clavier/.test(r.sel) && /\.cn-bulle|cnf-aides-ligne/.test(r.sel));
    expect(clavier.some(r => /white-space:\s*nowrap|text-overflow:\s*ellipsis/.test(r.decl))).toBe(false);
    expect(regle('carnets-fil.css', /\.cn-champ-zone\[data-clavier\]\s+\.cnf-aides-ligne\b/, /flex-wrap:\s*nowrap/)).toBe(false);
  });

  it('formes de la bulle, de la plus longue à la plus courte : chacune garde les deux noms, coupés sur un mot avec « … » au plus', () => {
    const formes = (Champ as unknown as { formesBulle?: (s: typeof SUGG) => string[] }).formesBulle;
    expect(typeof formes).toBe('function');
    const f = formes!(SUGG);
    expect(f[0]).toBe('« pas trop de bruit » tranche entre Hotte inox + extracteur et Extracteur mural seul');
    expect(f.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < f.length; i++) expect(f[i].length).toBeLessThan(f[i - 1].length);
    for (const x of f) {
      expect(x).toMatch(/Hotte/);
      expect(x).toMatch(/Extracteur/);
      /* jamais « Hotte in… » : un « … » suit toujours un mot entier des noms */
      for (const m of x.matchAll(/(\S+)…/g)) expect(`${SUGG.a} ${SUGG.b}`.split(/\s+/)).toContain(m[1]);
    }
  });

  it('clavier ouvert : la bulle rendue garde le texte entier en jsdom (aucune mesure : la forme longue)', () => {
    window.history.replaceState(null, '', '/?keyboard=300');
    const r = render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="ZZ TEST — Ventilation" suggestion={SUGG} />);
    act(() => { r.container.querySelector('textarea')!.focus(); });
    expect(texte(r.container.querySelector('.cn-bulle')!)).toContain('tranche entre Hotte inox + extracteur et Extracteur mural seul');
  });
});

const neuf = (title: string): CarnetV => ({ id: 'n', title, status: 'idea', carnet: { creeLe: '2026-11-17T08:00:00.000Z', phrase: 'embouteillage', criteres: [], facons: [], articles: [], notes: [], photos: [] } });
const monterNeuf = (title = 'embouteillage', vient = true) => render(<CarnetOuvert carnet={neuf(title)} aides={AIDES_ETEINTES} liens={[]} tableau={null} vientDEtreCree={vient}
  bandeau={<div className="cn-bandeau" data-sorte="cree"><div className="cn-bandeau-tete">✓ Carnet créé, en tête des Carnets · Annuler</div><p className="cn-cite">« embouteillage » · votre phrase en titre</p></div>}
  onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />).container;

describe('n° 4 : titre affiché avec sa majuscule initiale, sa phrase citée telle quelle, données inchangées', () => {
  it('titreAffiche : « embouteillage » → « Embouteillage » ; un titre déjà écrit ne bouge pas', () => {
    const f = (Titre as { titreAffiche?: (t: string) => string }).titreAffiche;
    expect(typeof f).toBe('function');
    expect(f!('embouteillage')).toBe('Embouteillage');
    expect(f!('évier inox')).toBe('Évier inox');
    expect(f!('ZZ TEST — Ventilation')).toBe('ZZ TEST — Ventilation');
    expect(f!('')).toBe('');
  });

  it('carnet ouvert : « Embouteillage » en titre, « « embouteillage » · votre phrase en titre » gardée', () => {
    const c = monterNeuf();
    expect(texte(c.querySelector('h2.cn-titre')!)).toBe('Embouteillage');
    expect(texte(c)).toContain('« embouteillage » · votre phrase en titre');
  });
});

describe('n° 5, 6, 7 : portés de g5:v04-4', () => {
  it('n° 5 : tout juste créé, en-tête, titre et encadré sur une bande (fond teinté, filet dessous) ; ailleurs, pas de bande', () => {
    const c = monterNeuf();
    const bande = c.querySelector('.cn-bande')!;
    expect(bande).not.toBeNull();
    expect([...bande.children].map(x => x.className.split(' ')[0])).toEqual(['cn-tete', 'cn-titre-ligne', 'cn-encadre-idee']);
    expect(regle('carnets.css', /^\.cn-bande$/, /background:/)).toBe(true);
    expect(regle('carnets.css', /^\.cn-bande$/, /border-bottom:\s*1px solid var\(--c-line\)/)).toBe(true);
    cleanup();
    expect(monterNeuf('embouteillage', false).querySelector('.cn-bande')).toBeNull();
  });

  it('n° 6 : pictos des rubriques verts (couleur de la zone), 20 px, centrés sur leur libellé', () => {
    const c = monterNeuf();
    const svgs = [...c.querySelectorAll('.cn-rubrique-ligne .cn-rubrique-tete > svg')];
    expect(svgs.length).toBeGreaterThanOrEqual(1); /* V4 : plus de rubrique vide */
    for (const s of svgs) expect(s.getAttribute('width')).toBe('20');
    expect(regle('carnets.css', /^\.cn-rubrique-ligne \.cn-rubrique-tete$/, /align-items:\s*center/)).toBe(true);
    expect(regle('carnets.css', /^\.cn-rubrique-ligne \.cn-rubrique-tete > svg$/, /color:\s*var\(--c-zonet\)/)).toBe(true);
  });

  it('n° 7 : « votre phrase en titre » sous le cadre vert, en italique libre (le cadre n’entoure que « ✓ Carnet créé · Annuler »)', () => {
    expect(regle('carnets.css', /\.cn-bandeau\[data-sorte=["']?cree["']?\]$/, /border:\s*0/)).toBe(true);
    expect(regle('carnets.css', /\.cn-bandeau\[data-sorte=["']?cree["']?\]$/, /background:\s*(none|transparent)/)).toBe(true);
    expect(regle('carnets.css', /\.cn-bandeau\[data-sorte=["']?cree["']?\]\s*>\s*\.cn-bandeau-tete$/, /border:\s*1\.5px solid/)).toBe(true);
  });
});

describe('n° 9 : le placeholder « Ajouter à … » ne se coupe jamais net', () => {
  const mesurer = (s: string) => s.length * 10;
  it('un seul mot trop long pour la place (« Ajouter à embouteilla ») : « Ajouter ici… », qui tient ; jamais un mot coupé', () => {
    expect(typeof placeholderCarnet).toBe('function');
    const ph = placeholderCarnet!('Embouteillage', 200, mesurer);
    expect(ph).toBe('Ajouter ici…');
    expect(mesurer(ph)).toBeLessThanOrEqual(200);
  });
  it('titre qui tient : entier ; plusieurs mots : coupé sur un mot ; tout placeholder tient dans sa place', () => {
    expect(placeholderCarnet!('Embouteillage', 400, mesurer)).toBe('Ajouter à Embouteillage…');
    expect(placeholderCarnet!('Évier inox deux bacs', 220, mesurer)).toBe('Ajouter à Évier inox…');
    for (const place of [130, 160, 200, 260, 400]) for (const t of ['Embouteillage', 'ZZ TEST — Ventilation de la salle de brassage']) expect(mesurer(placeholderCarnet!(t, place, mesurer))).toBeLessThanOrEqual(place);
    expect(titreQuiTient('Évier inox deux bacs', 220, mesurer)).toBe('Évier inox…');
  });
});
