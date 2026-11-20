// @vitest-environment jsdom
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { ajouterJours, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import * as ModuleRangee from '../../src/ui/calendrier/frise/Rangee';
import { colonneCourante, distinguerHomonymes } from '../../src/ui/calendrier/frise/Rangee';
const require_ = (_: string) => ModuleRangee;
import { iconeChose } from '../../src/ui/calendrier/frise/Marque';
import { Barrel, BottleWine, Repeat, TrendingUp } from 'lucide-react';

/* CAL-PASSE, voie G3 : écarts de version (V-15 icône du format, V-16 colonne de la semaine, V-21 loyer en une barre, V-19 et f doublon) */
const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
afterEach(cleanup);

const chose = (p: Partial<ChoseCalendrier> & Pick<ChoseCalendrier, 'id' | 'rangee' | 'titre'>): ChoseCalendrier => ({
  debut: JOUR, fin: JOUR, source: { genre: 'plan', id: p.id, origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan', id: p.id }, deplacable: true, ...p
} as ChoseCalendrier);

describe('V-15 : l’icône d’une vente dit son format (lu dans le titre, jamais deviné)', () => {
  it('fût, bouteille/carton, consigne ou récurrent ; sinon la flèche générique', () => {
    const v = (titre: string, source?: ChoseCalendrier['source']) => iconeChose(chose({ id: titre, rangee: 'ventes', titre, ...(source ? { source } : {}) }));
    expect(v('Dédé, 1 fût')).toBe(Barrel);
    expect(v('3 fûts La Cigogne')).toBe(Barrel);
    expect(v('Épicerie du Bourg, 2 cartons')).toBe(BottleWine);
    expect(v('Auberge, 260 bouteilles')).toBe(BottleWine);
    expect(v('Retour consigne fûts')).toBe(Barrel);
    expect(v('Consigne Brasserie')).toBe(Repeat);
    expect(v('Abonnement', { genre: 'plan', id: 'x', origine: 'recurring', statut: 'active' })).toBe(Repeat);
    expect(v('Noël privés')).toBe(TrendingUp);
  });
});

describe('V-16 : la colonne de la semaine en cours', () => {
  const sem = (n: number) => ({ debut: ajouterJours(L, n * 7), fin: ajouterJours(L, n * 7 + 6), etiquette: `S${n}` });
  it('une colonne de semaine ; les sept jours en vue Jour ; la colonne du mois en vue Mois ; null hors vue', () => {
    expect(colonneCourante([sem(-1), sem(0), sem(1)], ajouterJours(L, 2))).toEqual({ debut: 1, n: 1 });
    const jours = Array.from({ length: 14 }, (_, i) => ({ debut: ajouterJours(L, i - 3), fin: ajouterJours(L, i - 3), etiquette: `j${i}` }));
    expect(colonneCourante(jours, ajouterJours(L, 2))).toEqual({ debut: 3, n: 7 });
    expect(colonneCourante([{ debut: '2026-11-01', fin: '2026-11-30', etiquette: 'nov.' }, { debut: '2026-12-01', fin: '2026-12-31', etiquette: 'déc.' }], JOUR)).toEqual({ debut: 0, n: 1 });
    expect(colonneCourante([sem(3), sem(4)], JOUR)).toBeNull();
  });
  it('au banc, chaque rangée porte la colonne teintée de la semaine en cours, à toutes les échelles', () => {
    render(<BancCalendrier aujourdhui={JOUR} sansChrome />);
    const rangees = document.querySelectorAll('section[data-rangee]');
    expect(rangees.length).toBe(7);
    const avec = [...rangees].filter(r => r.querySelector('[data-col-now]'));
    expect(avec.length).toBe(7);
  });
});

describe('f et V-19 : aucune ligne en double dans une rangée', () => {
  const caddie = (id: string, debut: string) => chose({ id, rangee: 'brassins', titre: 'Emballage · Jhhh', debut, fin: debut, brassinLie: id });
  it('deux caddies homonymes à deux jours : le jour les distingue', () => {
    const r = distinguerHomonymes([caddie('a', '2026-12-21'), caddie('b', '2026-12-28')]);
    expect(r.map(c => c.titre)).toEqual(['Emballage · Jhhh · 21 déc.', 'Emballage · Jhhh · 28 déc.']);
    expect(new Set(r.map(c => c.titre)).size).toBe(2);
  });
  it('au même jour : le rang les distingue, chaque id et chaque ouverture restent', () => {
    const r = distinguerHomonymes([caddie('a', '2026-12-21'), caddie('b', '2026-12-21')]);
    expect(r.map(c => c.titre)).toEqual(['Emballage · Jhhh · 21 déc. (1/2)', 'Emballage · Jhhh · 21 déc. (2/2)']);
    expect(r.map(c => c.id)).toEqual(['a', 'b']);
  });
  it('un caddie seul, ou deux titres différents : rien ne change', () => {
    const seul = [caddie('a', '2026-12-21')];
    expect(distinguerHomonymes(seul)).toBe(seul);
  });
  it('rendu : deux caddies « Emballage · Jhhh » dans la rangée Brassins ne portent jamais le même nom', () => {
    const { Rangee, MESURES_PORTRAIT } = require_('Rangee');
    const colonnes = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: `S${47 + i}` }));
    render(<Rangee id="brassins" choses={[caddie('a', ajouterJours(L, 8)), caddie('b', ajouterJours(L, 8))]} colonnes={colonnes} largeurColonne={60} largeur={360} mesures={MESURES_PORTRAIT}
      masquee={false} cause={null} epingles={[]} etoiles={[]} partMax={0} onAjouter={() => undefined} onBasculerMasque={() => undefined} onSixSemaines={() => undefined} barre={{ onToucher: () => undefined, onAppuiLong: () => undefined, onGlisse: () => undefined, onLacheGlisse: () => undefined, onBord: () => undefined, onLacheBord: () => undefined, onRefus: () => undefined }} aujourdhui={JOUR} />);
    const noms = [...document.querySelectorAll('[data-brassin-lie]')].map(e => e.getAttribute('aria-label') ?? '');
    expect(noms).toHaveLength(2);
    expect(new Set(noms).size).toBe(2);
  });
});

describe('V-21 : le loyer mensuel est une seule barre « −400 / mois » à toute échelle', () => {
  it('en 6 semaines, au banc : une seule chose « Loyer du local » dans Papiers', () => {
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ periode: () => ({ genre: 'dates', du: L, au: ajouterJours(L, 6 * 7 - 1) }) } as never} />);
    const loyers = [...document.querySelectorAll('section[data-rangee="papiers"] [data-chose]')].filter(e => /^Loyer du local/.test(e.getAttribute('aria-label') ?? ''));
    expect(loyers).toHaveLength(1);
    expect(document.querySelector('section[data-rangee="papiers"]')!.textContent).toContain('−400 / mois');
  });
});
