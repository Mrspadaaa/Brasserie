// @vitest-environment jsdom
// Voie t11-communs (#168) : les composants communs de la maquette vivent dans src/ui/hopIndex/ (une seule copie).
// Ici : leur rendu (pictos au trait, couleurs des familles, jeton d'un houblon, barre au style, marques d'honnêteté) et la
// garde de structure (ils n'importent ni la maquette, ni son alias, ni le moteur, ni l'adaptateur).
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { COULEURS, COURT, FAMILIES, ROUE } from '../../../src/ui/hopIndex/familyTokens';
import { JeuPictos, Picto } from '../../../src/ui/hopIndex/Pictos';
import { Alpha, JetonHoublon } from '../../../src/ui/hopIndex/JetonHoublon';
import { BarreStyle } from '../../../src/ui/hopIndex/BarreStyle';
import { Inconnu, Simule } from '../../../src/ui/hopIndex/Marques';
import { nombre, plage, signe } from '../../../src/ui/hopIndex/nombres';
import type { FamilleAffichee, HoublonAffiche } from '../../../src/ui/hopIndex/lecturesAffichees';

afterEach(cleanup);

describe('familyTokens : les 12 familles, une seule table', () => {
  it('chaque famille a son nom court, ses trois couleurs et une place dans la roue', () => {
    expect(FAMILIES).toHaveLength(12);
    expect([...ROUE].sort()).toEqual([...FAMILIES].sort());
    expect(ROUE[0]).toBe('citrus');
    for (const f of FAMILIES) {
      expect(COURT[f], f).toMatch(/\S/);
      for (const k of ['base', 'texte', 'fond'] as const) expect(COULEURS[f][k], `${f}.${k}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(COURT.spice).toBe('Épicé');
    expect(COURT.stoneFruit).toBe('Noyau');
  });
});

describe('Pictos : un symbole au trait par famille', () => {
  it('le jeu pose les 12 symboles p-<famille>, et <Picto> y renvoie', () => {
    const { container } = render(<><JeuPictos />{FAMILIES.map((f) => <Picto key={f} famille={f} />)}</>);
    for (const f of FAMILIES) {
      expect(container.querySelector(`symbol#p-${f}`), `symbole p-${f}`).not.toBeNull();
      const svg = container.querySelector(`svg[data-famille="${f}"]`)!;
      expect(svg.getAttribute('aria-label')).toBe(COURT[f]);
      expect(svg.querySelector('use')!.getAttribute('href')).toBe(`#p-${f}`);
      expect(svg.getAttribute('width')).toBe('16');
    }
  });
  it('sans nom, le picto est décoratif', () => {
    const { container } = render(<Picto famille="citrus" nomme={false} taille={24} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.hasAttribute('aria-label')).toBe(false);
    expect(svg.getAttribute('width')).toBe('24');
  });
  it('« épicé » (cannelle et clou croisés, 23.10) a son dessin', () => {
    const { container } = render(<JeuPictos />);
    expect(container.querySelector('symbol#p-spice')!.innerHTML.length).toBeGreaterThan(50);
  });
});

const citra: HoublonAffiche = { cle: 'citra', nom: 'Citra', alpha: { valeur: 12.5, plage: [11, 13], horsFiches: false }, role: { mot: 'mixte' }, stock: 250 };

describe('JetonHoublon : nom, α, rôle, stock en icône (L04)', () => {
  it('écrit le nom, l\'α avec sa plage, le rôle en mot et l\'icône de stock', () => {
    const { container } = render(<JetonHoublon h={citra} couleur="#ff0000" />);
    const jeton = container.querySelector('[data-jeton-houblon="citra"]')!;
    expect(jeton.textContent).toContain('Citra');
    expect(jeton.querySelector('[data-role="alpha"]')!.textContent).toContain('α 12,5%');
    expect(jeton.querySelector('[data-role="alpha"]')!.textContent).toContain('11');
    expect(jeton.querySelector('[data-role="role"]')!.textContent).toBe('mixte');
    expect(jeton.querySelector('[aria-label="en stock"]')).not.toBeNull();
    expect(jeton.textContent).not.toMatch(/250/);
  });
  it('un α hors des fiches est marqué « ≠ » ; un α inconnu s\'écrit « α ? », jamais 0', () => {
    const hors = render(<Alpha h={{ ...citra, alpha: { valeur: 15, plage: [11, 13], horsFiches: true } }} />);
    expect(hors.container.textContent).toContain('≠');
    cleanup();
    const inconnu = render(<Alpha h={{ ...citra, alpha: null }} />);
    expect(inconnu.container.textContent).toBe('α ?');
  });
  it('sans stock, pas d\'icône', () => {
    const { container } = render(<JetonHoublon h={{ ...citra, stock: null }} court />);
    expect(container.querySelector('[aria-label="en stock"]')).toBeNull();
  });
});

const famille = (o: Partial<FamilleAffichee> = {}): FamilleAffichee => ({ famille: 'citrus', statut: 'attendue', bande: [20, 60], valeur: { bas: 30, centre: 40, haut: 50 }, horsStyle: null, raison: null, ...o });

describe('BarreStyle : une barre à la couleur de la famille ; l\'inconnu est hachuré, jamais 0', () => {
  it('à l\'échelle du style, la bande occupe la moitié gauche et la valeur se place sur la bande haute', () => {
    const { container } = render(<BarreStyle apres={famille()} avant={famille({ valeur: { bas: 10, centre: 30, haut: 40 } })} valeur="~+4" />);
    const barre = container.querySelector('[data-barre="citrus"]')!;
    expect(barre.getAttribute('data-echelle')).toBe('style');
    expect((barre.querySelector('[data-role="zone"]') as HTMLElement).style.width).toBe('50%');
    expect((barre.querySelector('[data-role="apres"]') as HTMLElement).style.width).toBe('33.3%');
    expect(barre.querySelector('[data-role="avant"]')).not.toBeNull();
    expect(barre.textContent).toContain('Agrumes');
    expect(barre.textContent).toContain('~+4');
    expect(barre.querySelector('[data-inconnu]')).toBeNull();
  });
  it('en absolu, la piste va de 0 à 110', () => {
    const { container } = render(<BarreStyle apres={famille({ valeur: { bas: 50, centre: 55, haut: 60 } })} echelle="absolu" />);
    expect((container.querySelector('[data-role="apres"]') as HTMLElement).style.width).toBe('50%');
  });
  it('une valeur inconnue : piste hachurée, aucune barre, la raison au survol', () => {
    const { container } = render(<BarreStyle apres={famille({ valeur: null, raison: 'houblon sans fiche' })} />);
    const piste = container.querySelector('[data-inconnu]')!;
    expect(piste.className).toContain('pq-hachure');
    expect(piste.getAttribute('title')).toBe('houblon sans fiche');
    expect(container.querySelector('[data-role="apres"]')).toBeNull();
  });
  it('hors style : le mot l\'écrit', () => {
    const { container } = render(<BarreStyle apres={famille({ horsStyle: 'au-dessus' })} />);
    expect(container.textContent).toContain('hors style');
  });
});

describe('Marques d\'honnêteté et nombres', () => {
  it('le simulé porte « ~ », l\'inconnu « ? » hachuré avec sa raison', () => {
    const { container } = render(<><Simule valeur={23} ecart /><Simule valeur={24.4} /><Inconnu raison="pas mesuré" /></>);
    const texte = container.textContent!;
    expect(texte).toContain('~+23');
    expect(texte).toContain('~24');
    const inconnu = container.querySelector('[data-inconnu]')!;
    expect(inconnu.textContent).toBe('?');
    expect(inconnu.getAttribute('aria-label')).toBe('inconnu : pas mesuré');
  });
  it('virgule décimale, signe typographique, plage', () => {
    expect(nombre(12.5, 1)).toBe('12,5');
    expect(signe(4, 0)).toMatch(/^\+\s?4$/);
    expect(signe(-4, 0)).toMatch(/^[−-]\s?4$/);
    expect(plage(11, 13)).toContain('11');
  });
});

describe('garde de structure : des composants autonomes, une seule copie', () => {
  const dossier = path.resolve(__dirname, '../../../src/ui/hopIndex');
  const communs = ['BarreStyle.tsx', 'JetonHoublon.tsx', 'Pictos.tsx', 'Legende.tsx', 'LigneContexte.tsx', 'Marques.tsx', 'Pont.tsx', 'gestes.ts', 'nombres.ts', 'familyTokens.ts', 'lecturesAffichees.ts'];
  it('aucun n\'importe la maquette, l\'alias @app, la coquille, l\'adaptateur ni le moteur en entier', () => {
    for (const f of communs) {
      const src = fs.readFileSync(path.join(dossier, f), 'utf8');
      const imports = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
      for (const i of imports) {
        expect(i, `${f} : ${i}`).not.toMatch(/prototypes|^@app\/|coquille|\/moteur$|domain\/hopIndex\/v4$|v4\/adapter/);
      }
    }
  });
  it('plus de copie dans la maquette', () => {
    const maquette = path.resolve(__dirname, '../../../prototypes/houblons-v4/parcours/src/commun');
    for (const f of ['BarreStyle.tsx', 'JetonHoublon.tsx', 'Pictos.tsx', 'Legende.tsx', 'LigneContexte.tsx', 'Marques.tsx', 'Pont.tsx', 'gestes.ts', 'nombres.ts', 'familles.ts']) {
      expect(fs.existsSync(path.join(maquette, f)), f).toBe(false);
    }
  });
});
