// @vitest-environment jsdom
import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ChoseCalendrier } from '../../src/domain/calendrier';
import { courbeCaisse } from '../../src/domain/calendrierCaisse';
import { chf, sg } from '../../src/ui/calendrier/entete/Courbe';
import { DetailCreux } from '../../src/ui/calendrier/entete/DetailCreux';
import { LectureDetail } from '../../src/ui/calendrier/entete/LectureCourbe';
import { montantBarre } from '../../src/ui/calendrier/frise/Barre';
import { Marque } from '../../src/ui/calendrier/frise/Marque';
import { pastille, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { VueListe } from '../../src/ui/calendrier/frise/VueListe';
import { chf0 } from '../../src/ui/finance/UpgradeWorkspace';

/* C46-5 (rouvert en ligne, tour 49) : la carte d'un achat dit « −79,95 », la bulle de la ligne Achats disait « −80 ». La règle, pour tout montant d'une
   chose ou d'une somme de choses du Calendrier et d'À venir : les centimes s'écrivent dès qu'il y en a (79,95), un montant rond reste sans (80).
   Seuls restent arrondis les repères : graduations d'axe et soldes libres (« 1 920 CHF à dépenser », la courbe), qui ne sont le montant d'aucune chose. */

afterEach(cleanup);

const achat = (centimes: number, id = 'a1'): ChoseCalendrier => ({
  id, rangee: 'achats', titre: 'ZZ TEST — table', debut: '2026-11-25', fin: '2026-11-25', centimes,
  source: { genre: 'plan', id }, ouvre: { ecran: 'finances' }, deplacable: true
} as unknown as ChoseCalendrier);
const colonnes: Colonne[] = ['2026-11-23', '2026-11-30'].map((debut, i) => ({ debut, fin: i === 0 ? '2026-11-29' : '2026-12-06', etiquette: `S${48 + i}` }));
const courbe = () => courbeCaisse({
  depart: 200000, lundi0: '2026-11-23', nbSemaines: 8,
  mouvements: [{ id: 'm1', jour: '2026-11-25', centimes: -7995, nom: 'Table' }, { id: 'm2', jour: '2026-12-02', centimes: -8000, nom: 'Étagère' }]
})!;

describe('C46-5 : les centimes se disent partout où un montant est celui d\'une chose', () => {
  it('la bulle de la ligne Achats (pastille) : « −79,95 », pas « −80 », et son nom accessible de même', () => {
    const p = pastille('achats', [achat(-7995)], colonnes);
    expect(p.texte).toBe('−79,95');
    expect(p.lecture).toContain('solde −79,95');
    expect(pastille('achats', [achat(-8000)], colonnes).texte).toBe('−80');
  });
  it('la somme de deux choses garde ses centimes (−79,95 et −80 : −159,95)', () => {
    expect(pastille('achats', [achat(-7995), achat(-8000, 'a2')], colonnes).texte).toBe('−159,95');
  });
  it('le montant écrit à côté d\'une barre (montantBarre)', () => {
    expect(montantBarre(achat(-7995))).toBe('−79,95');
    expect(montantBarre(achat(-8000))).toBe('−80');
  });
  it('la marque d\'un achat d\'un jour', () => {
    const { container } = render(<Marque chose={achat(-7995)} centre={14} haut={0} largeurColonne={14} libelle={{ cote: 'droite', place: 200 }} onToucher={() => undefined} />);
    expect(container.textContent).toContain('−79,95');
    expect(container.textContent).not.toContain('−80');
  });
  it('la Liste', () => {
    const { container } = render(<VueListe choses={[achat(-7995)]} sansDate={[]} aujourdhui="2026-11-23" onChose={() => undefined} />);
    expect(container.textContent).toContain('−79,95');
  });
  it('sg (bande des semaines, détail, tendance, écart du glisser) : exact, 0 reste « 0 »', () => {
    expect(sg(-7995)).toBe('−79,95');
    expect(sg(7995)).toBe('+79,95');
    expect(sg(-8000)).toBe('−80');
    expect(sg(0)).toBe('0');
  });
  it('lire la courbe au doigt : chaque mouvement et « la semaine » avec leurs centimes', () => {
    const { container } = render(<LectureDetail courbe={courbe()} index={0} />);
    expect(container.textContent).toContain('−79,95');
    expect(container.textContent).not.toContain('−80 ');
  });
  it('les causes du creux : « Table −79,95 »', () => {
    const c = courbe();
    const { container } = render(<DetailCreux courbe={c.semaines} index={0} onFermer={() => undefined} />);
    expect(container.textContent).toContain('79,95');
    expect(container.textContent).not.toMatch(/Table[^0-9]*80\b/);
  });
  it('À venir (UpgradeWorkspace) : 79,95 reste 79,95, 80 reste 80', () => {
    expect(chf0(7995)).toBe('79,95');
    expect(chf0(8000)).toBe('80');
    expect(chf0(276365)).toBe('2 763,65');
  });
  it('repères : un solde libre et les graduations restent en francs entiers', () => {
    expect(chf(192005)).toBe('1 920');
  });
});

/* La règle sur tout le dossier : un formateur arrondi (`francs(`, `francsSignes(`) n'écrit que des repères. Chaque appel arrondi autorisé est nommé ici. */
const lister = (dir: string): string[] => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? lister(p) : /\.tsx?$/.test(f) ? [p] : []; });
describe('C46-5 : aucun formateur arrondi pour un montant de chose dans src/ui/calendrier', () => {
  const AUTORISES: Record<string, number> = {
    // Courbe.tsx : `chf` (solde libre, graduations, niveaux) est défini ici, un seul appel de `francs(`
    'src/ui/calendrier/entete/Courbe.tsx': 1,
    // DetailChose.tsx : « Libre de la semaine », un solde
    'src/ui/calendrier/frise/DetailChose.tsx': 1
  };
  it('les appels de francs( et francsSignes( restants sont des soldes ou des repères, listés', () => {
    const trouves: Record<string, number> = {};
    for (const f of lister('src/ui/calendrier')) {
      const n = (readFileSync(f, 'utf8').match(/(?<![A-Za-z])(francs|francsSignes)\(/g) ?? []).length;
      if (n) trouves[f.replace(/\\/g, '/')] = n;
    }
    expect(trouves).toEqual(AUTORISES);
  });
});
