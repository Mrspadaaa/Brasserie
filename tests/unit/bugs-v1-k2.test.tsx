/** @vitest-environment jsdom */
// Tour 2 de la voie v1 (critique k2, 20.11) : points 24 à 28.
//  24/26 : la tuile Vendre dit POURQUOI elle est « à vérifier », en mots, sans infobulle, et distingue les deux causes ;
//  27    : les noms de mois de l'escalier (Prévisions, 12 mois) ne se touchent pas ;
//  28    : la bulle d'un lot de sorties se lit en mots (« 2 fois », « au moins »), sans « ×2 » ni « ≥ ».
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { noteDeTuile } from '../../src/domain/tarifs/tuileVente';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';
import { EscalierSvg, texteLot, texteEtiquette } from '../../src/ui/finance/previsions/EscalierSvg';
import { largeurTexte } from '../../src/ui/finance/previsions/placement';

describe('k2 · 24 et 26 — la note de la tuile Vendre', () => {
  it('prix aberrant : le mot dit « tarif à corriger », la raison donne le prix au litre et l\'endroit', () => {
    const n = noteDeTuile({ suspect: true, prixTarif: 569.5, volumeL: 0.75, capaciteSupposee: false });
    expect(n?.mot).toBe('tarif à corriger');
    expect(n?.raison).toMatch(/569,50/);
    expect(n?.raison).toMatch(/759,33 CHF le litre/);
    expect(n?.raison).toMatch(/Atelier › Tarifs/);
  });
  it('fût sans fût lié : un autre mot (« capacité supposée »), une autre raison', () => {
    const n = noteDeTuile({ suspect: false, prixTarif: 120, volumeL: 20, capaciteSupposee: true });
    expect(n?.mot).toBe('capacité supposée');
    expect(n?.raison).toMatch(/aucun fût lié/i);
    expect(n?.raison).toMatch(/20 L/);
  });
  it('les deux causes ne portent jamais le même libellé, ni « à vérifier » seul', () => {
    const a = noteDeTuile({ suspect: true, prixTarif: 569.5, volumeL: 0.75, capaciteSupposee: false })!;
    const b = noteDeTuile({ suspect: false, prixTarif: null, volumeL: 20, capaciteSupposee: true })!;
    expect(a.mot).not.toBe(b.mot);
    expect(`${a.mot}${b.mot}`).not.toMatch(/^à vérifier$/);
  });
  it('rien à dire : pas de note', () => {
    expect(noteDeTuile({ suspect: false, prixTarif: 3, volumeL: 0.33, capaciteSupposee: false })).toBeNull();
  });
});

const sortie = (id: string, date: string, cents: number, label: string, extra: Partial<ForecastItem> = {}): ForecastItem =>
  ({ id, date, label, amountCents: cents, direction: 'out', source: 'brew', category: 'divers', planId: id, ...extra });

describe('k2 · 28 — la bulle d\'un lot se lit en mots', () => {
  const a = sortie('a', '2026-11-20', 4000, 'Pale Ale · achats', { partial: ['houblon'] }), b = sortie('b', '2026-11-20', 2640, 'IPA · achats', { partial: ['houblon'] });
  it('un lot partiel : « (2 fois) » et « au moins », ni ×2 ni ≥', () => {
    const t = texteLot([a, b]);
    expect(t).toMatch(/\(2 fois\)/);
    expect(t).toMatch(/au moins 66,40/);
    expect(t).not.toMatch(/[×≥]/);
  });
  it('un lot exact : « (2 fois) » et le montant', () => {
    const t = texteLot([{ ...a, partial: undefined }, { ...b, partial: undefined }]);
    expect(t).toMatch(/\(2 fois\) −66,40|\(2 fois\) -66,40/);
    expect(t).not.toMatch(/[×≥]/);
  });
  it('des mots différents : « 2 sorties au moins … »', () => {
    const t = texteLot([a, sortie('c', '2026-11-20', 40000, 'Loyer', { source: 'recurring' })]);
    expect(t).toMatch(/^2 sorties au moins 440/);
    expect(t).not.toMatch(/[×≥]/);
  });
  it('une récurrence regroupée : « (9 fois) », pas « ×9 »', () => {
    const i = sortie('l', '2026-12-25', 40000, 'Loyer', { source: 'recurring' });
    expect(texteEtiquette(i, { n: 9, premierId: 'l', jour: '25' })).toBe('loyer −400 (9 fois), le 25');
  });
});

describe('k2 · 27 — les noms de mois ne se touchent pas', () => {
  for (const largeur of [320, 366, 390, 430]) {
    it(`12 mois à ${largeur} px : au moins 4 px entre deux noms`, () => {
      const asOf = '2026-11-20', fin = '2027-11-19';
      const e = construireEscalier({ departCents: null, items: [sortie('a', '2026-11-20', 6640, 'Pale Ale · achats', { partial: ['houblon'] })], debut: asOf, fin });
      const { container, unmount } = render(<EscalierSvg e={e} largeur={largeur} asOf={asOf} onEtiquette={() => {}} onRestes={() => {}} mesure={(t, c, m) => Math.ceil(largeurTexte(t, c, m))} />);
      const boites = [...container.querySelectorAll('.prv-mois')].map(t => {
        const w = Math.ceil(largeurTexte(t.textContent ?? '', 12)), x = Number(t.getAttribute('x'));
        return { nom: t.textContent ?? '', g: x - w / 2, d: x + w / 2 };
      }).sort((p, q) => p.g - q.g);
      unmount();
      expect(boites.length).toBeGreaterThanOrEqual(4);
      for (let i = 1; i < boites.length; i++) expect(boites[i].g - boites[i - 1].d, `${boites[i - 1].nom} / ${boites[i].nom}`).toBeGreaterThanOrEqual(4);
    });
  }
});
