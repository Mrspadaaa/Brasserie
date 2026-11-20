// @vitest-environment jsdom
// Carnet, tour 3 du 19.11, voie f13, tour 3 (critique Opus, CRITIQUE-T2.md : n° 1 à 5, et le filet gris au-dessus du champ, absent de
// g5:v04-4). L13 : rouge avant, vert après. Les rendus se mesurent dans Chrome (voies/f13/mesure.mjs, suffixe t3) ; ici, la structure,
// les règles CSS et les gestes qui les produisent.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';

afterEach(() => { cleanup(); window.history.replaceState(null, '', '/'); });
const rien = () => undefined;
const src = (f: string) => fs.readFileSync(path.resolve(__dirname, `../../src/ui/carnets/${f}`), 'utf8').replace(/\r\n/g, '\n');
const regles = (f: string) => [...src(f).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] }));
const regle = (f: string, sel: RegExp, decl: RegExp) => regles(f).some(r => sel.test(r.sel) && decl.test(r.decl));
const decls = (f: string, sel: RegExp) => regles(f).filter(r => sel.test(r.sel)).map(r => r.decl).join(';');
const rect = (top: number, bottom: number) => ({ top, bottom, left: 0, right: 390, width: 390, height: bottom - top, x: 0, y: top, toJSON: () => ({}) });

describe('n° 1 : à 390, la bande va d’un bord à l’autre de l’écran, chevron, titre et encadré en retrait', () => {
  it('la zone qui défile porte une classe, et s’élargit aux bords de l’écran (contenu à sa place) quand elle montre la bande', () => {
    expect(src('CarnetsVue.tsx')).toMatch(/className="cn-defile"/);
    expect(regle('carnets.css', /^\.cn-defile:has\(.*\.cn-bande\)$/, /margin:\s*0 -12px/)).toBe(true);
    expect(regle('carnets.css', /^\.cn-defile:has\(.*\.cn-bande\)$/, /padding:\s*0 12px/)).toBe(true);
  });
  it('le titre et le chevron partent du même bord (le chevron rentre de l’air de son picto)', () => {
    expect(regle('carnets.css', /\.cn-bande .*\.cn-retour$/, /margin-left:\s*-\d+px/)).toBe(true);
  });
});

describe('n° 2 : l’encadré « Idée » garde son fond crème, opaque, même sur la bande teintée', () => {
  it('fond : la teinte ambre posée sur le fond de la page (jamais transparente sur le vert de la bande)', () => {
    expect(decls('carnets.css', /^\.cn-encadre-idee$/)).toMatch(/background:\s*linear-gradient\(var\(--c-attbg\),\s*var\(--c-attbg\)\),\s*var\(--c-bg\)/);
  });
});

describe('n° 3 : le titre du carnet tout juste créé a le poids de sa maquette', () => {
  it('« Embouteillage » à 26 px au moins dans la bande (21 px avant), 390 comme 1280', () => {
    const d = decls('carnets.css', /\.cn-bande \.cn-titre$/);
    const taille = Number(/font-size:\s*(\d+)px/.exec(d)?.[1] ?? 0);
    expect(taille).toBeGreaterThanOrEqual(26);
    expect(d).toMatch(/font-weight:\s*800/);
  });
});

describe('n° 4 : le champ dit le texte de sa maquette, aligné sur la liste ; plus de filet gris au-dessus', () => {
  it('carnet tout juste créé : « Écrire, ou coller un lien… » (g5:v04-4) ; le libellé dit toujours où ça va', () => {
    const r = render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="embouteillage" invite="Écrire, ou coller un lien…" />);
    const t = r.container.querySelector('textarea')!;
    expect(t.getAttribute('placeholder')).toBe('Écrire, ou coller un lien…');
    expect(r.container.querySelector('label')!.textContent).toBe('Ajouter à Embouteillage…');
  });
  it('CarnetsVue passe ce texte au carnet tout juste créé, pas ailleurs', () => {
    expect(src('CarnetsVue.tsx')).toMatch(/invite:\s*'Écrire, ou coller un lien…'/);
    expect(src('CarnetsVue.tsx')).toMatch(/vientDEtreCree === ouvert\.id/);
  });
  it('à 390, le champ part du bord de la liste (pas 12 px plus à droite)', () => {
    expect(regle('carnets-fil.css', /^\[data-carnets\]:not\(\[data-vue=liste\]\) > \.cn-champ-zone$/, /padding-left:\s*0/)).toBe(true);
  });
  it('à 390, le texte de la maquette tient : pictos du champ resserrés (gap 4 px)', () => {
    expect(regle('carnets-fil.css', /^\[data-carnets\]:not\(\[data-vue=liste\]\) \.cn-champ$/, /gap:\s*4px/)).toBe(true);
  });
  it('filet gris au-dessus du champ retiré (absent de g5:v04-4)', () => {
    expect(decls('carnets.css', /^\.cn-champ-zone$/)).not.toMatch(/border-top:\s*1px/);
  });
});

describe('n° 5 : clavier ouvert, le défilement automatique ne laisse aucune ligne tranchée en haut de la zone', () => {
  it('clavier ouvert, la zone qui défile garde 56 px en bas : de quoi défiler encore (la page finissait 5 px sous la dernière note)', () => {
    expect(regle('carnets-fil.css', /^\[data-carnets\]:has\(> \.cn-champ-zone\[data-clavier\]\) > \.cn-defile$/, /padding-bottom:\s*56px/)).toBe(true);
  });
  it('une ligne coupée par le haut de la zone après le défilement : l’app défile encore de quoi la cacher entière', async () => {
    window.history.replaceState(null, '', '/?keyboard=300');
    const r = render(
      <div data-carnets="">
        <div className="defile" style={{ overflowY: 'auto' }}>
          <span className="ligne">180 cm</span>
          <div className="cn-note">a</div><div className="cn-note">dernière</div>
        </div>
        <ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="ZZ TEST — Ventilation" libelleEnvoi="Ajouter" />
      </div>);
    const defile = r.container.querySelector<HTMLElement>('.defile')!;
    Object.defineProperty(defile, 'scrollHeight', { configurable: true, value: 1400 });
    Object.defineProperty(defile, 'clientHeight', { configurable: true, value: 430 });
    defile.getBoundingClientRect = () => rect(70, 500);
    const scrollBy = vi.fn();
    (defile as unknown as { scrollBy: unknown }).scrollBy = scrollBy;
    const notes = r.container.querySelectorAll<HTMLElement>('.cn-note');
    notes[0].getBoundingClientRect = () => rect(1000, 1060);
    notes[1].getBoundingClientRect = () => rect(1086, 1147);
    /* après 724 px de défilement, le haut de la zone (70) tombe à 794 du contenu : « 180 cm » (784–804) y serait coupé en deux */
    r.container.querySelector<HTMLElement>('.ligne')!.getBoundingClientRect = () => rect(784, 804);
    r.container.querySelector<HTMLElement>('.cn-champ-zone')!.getBoundingClientRect = () => rect(435, 544);
    act(() => { r.container.querySelector('textarea')!.focus(); });
    await act(() => new Promise<void>(res => setTimeout(res, 60)));
    expect(scrollBy).toHaveBeenCalled();
    /* 724 (dernière note 12 px au-dessus du champ) + 10 (la ligne coupée passe entière au-dessus du bord) */
    expect(scrollBy.mock.calls.at(-1)![0]).toMatchObject({ top: 734 });
  });
});
