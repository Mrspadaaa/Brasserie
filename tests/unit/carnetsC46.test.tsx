// Voie carnet-c46 (24.11) : les défauts C46-1..6 du test en ligne du Carnet, tour 46.
import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlans, ID_FRIGO } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import * as ops from '../../src/domain/carnets/operations';
import { extrait } from '../../src/domain/carnets/recherche';
import { compterEtapes, lignesEtapes } from '../../src/domain/carnets/lecture';
import { RubriqueQuand } from '../../src/ui/carnets/RubriqueQuand';

const css = (f: string) => readFileSync(`src/ui/carnets/${f}`, 'utf8');
const F = fixtureCarnets(fixturePlans());

describe('C46-1 : « · budget » reste lisible sur la pastille pressée', () => {
  it('le mot en gris prend la couleur de la puce pressée (même contraste que le montant)', () => {
    expect(css('carnets.css')).toMatch(/\.cn-puce\[aria-pressed=true\]\s+\.cn-mut\s*\{[^}]*color:\s*inherit/);
  });
});

describe('C46-2 : la ligne citée par la recherche montre le mot entier', () => {
  const nom = '1800 x 1500 mm - 4,06 m³ - groupe frigorifique à air pulsé, isolation 80 mm, porte à charnières';
  const i = nom.indexOf('frigorifique');
  it('le mot trouvé tient dans la première ligne et la coupe se fait sur des espaces', () => {
    const e = extrait(nom, i, i + 'frigorifique'.length);
    expect(e.texte.slice(e.debut, e.fin)).toBe('frigorifique');
    expect(e.fin).toBeLessThanOrEqual(34);
    const sansPoints = e.texte.replace(/^…/, '').replace(/…$/, '');
    expect(nom).toContain(sansPoints);
    expect(nom[nom.indexOf(sansPoints) - 1] ?? ' ').toBe(' ');
    expect(nom[nom.indexOf(sansPoints) + sansPoints.length] ?? ' ').toMatch(/[ ,]/);
  });
  it('la ligne citée peut passer sur deux lignes (plus de nowrap + ellipse sur une seule)', () => {
    expect(css('carnets.css')).toMatch(/\.cn-liste \.cn-carnet-tx > \.cnd-cite\s*\{[^}]*white-space:\s*normal/);
  });
});

describe('C46-3 : l’avis « Au calendrier » ne se redit pas au retour sur le Calendrier', () => {
  it('un avis se dit une fois par geste', async () => {
    const { avisADire } = await import('../../src/domain/carnets/avisCalendrier');
    expect(avisADire(1700000000001)).toBe(true);
    expect(avisADire(1700000000001)).toBe(false);
    expect(avisADire(1700000000002)).toBe(true);
  });
  it('le Calendrier passe par cette règle avant de dire l’avis du geste', () => {
    expect(readFileSync('src/components/tabs/CalendrierTab.tsx', 'utf8')).toMatch(/avisADire\(v\.at\)/);
  });
});

describe('C46-4 : le prix choisi n’est plus dit « estimé »', () => {
  const choisi = (devise: string): CarnetDoc => {
    const f = lireCarnet(F.find(i => i.id === ID_FRIGO))!;
    const etat = F.map(i => (i.id === f.id ? ({ ...i, carnet: { ...i.carnet!, articles: i.carnet!.articles.map((a, k) => (k === 0 ? { ...a, prixCentimes: 7995, devise } : a)) } } as typeof i) : i));
    const a0 = lireCarnet(etat.find(i => i.id === f.id))!.carnet.articles[0];
    const r = ops.choisir(etat, { carnetId: f.id, articleId: a0.id, pourquoi: '', le: '2026-11-23T10:00:00.000Z' });
    if (!r.ok) throw new Error('refus');
    return (r.ecritures[0] as { doc: CarnetDoc }).doc;
  };
  it('le prix du carnet est celui de l’article choisi (francs) : il se reconnaît', async () => {
    const { prixChoisiCentimes } = await import('../../src/domain/carnets/prixChoisi');
    expect(prixChoisiCentimes(choisi('CHF'))).toBe(7995);
    expect(prixChoisiCentimes(choisi('EUR'))).toBeUndefined();
    const sans = lireCarnet(F.find(i => i.id === ID_FRIGO))!;
    expect(prixChoisiCentimes({ carnet: { ...sans.carnet, choix: undefined } })).toBeUndefined();
  });
  const rendu = (choisiOuiNon: boolean) => renderToStaticMarkup(<RubriqueQuand date="2026-12-21" precision="semaine" aujourdhui="2026-11-24" neuf={false} picto={16}
    onDater={() => undefined} onPrix={() => undefined} prix={{ centimes: 7995, choisi: choisiOuiNon }} />);
  it('la ligne Quand dit « 79,95 CHF » seul pour un prix choisi, « estimé » pour un estimé', () => {
    expect(rendu(true)).toContain('79,95 CHF');
    expect(rendu(true)).not.toContain('estimé');
    expect(rendu(false)).toContain('79,95 CHF estimé');
  });
});

describe('C46-6 : un seul total d’étapes, pendant et après la lecture', () => {
  const E = (nom: string, statut: 'trouve' | 'douteux' | 'absent', detail?: string) => ({ nom, statut, ...(detail ? { detail } : {}) }) as never;
  const etapes = [E('page', 'trouve', 'landi.ch'), E('donnees', 'trouve'), E('prix', 'trouve', '79,95 CHF'), E('photos', 'trouve'), E('caract', 'trouve'), E('controle', 'trouve')];
  it('le rangement (7e ligne pendant) ne change pas le total de six étapes', () => {
    const pendant = lignesEtapes(etapes, { rangement: true });
    const fin = lignesEtapes(etapes, { fini: true });
    expect(pendant.some(l => l.cle === 'rangement')).toBe(true);
    expect(compterEtapes(pendant).total).toBe(compterEtapes(fin).total);
    expect(compterEtapes(pendant).faites).toBe(compterEtapes(fin).faites);
    expect(compterEtapes(fin).total).toBe(6);
  });
});
