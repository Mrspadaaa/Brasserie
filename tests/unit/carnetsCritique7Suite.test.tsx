// @vitest-environment jsdom
/**
 * Critique 7 (18.11), correctif chirurgical, suite : bloquants 5 à 7 et la limite du 2, chacun prouvé seul sur sa règle.
 */
import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlanRealise, fixturePlans, ID_EMBOUTEILLAGE, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { pourquoiDe, tableau } from '../../src/domain/carnets/comparer';
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import { rangDuLien } from '../../src/ui/carnets/CarnetsVue';
import { AIDES_ETEINTES, type CarnetV } from '../../src/ui/carnets/EtatIA';

import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import type { ContexteRangerCarnet } from '../../functions/src/carnetIA';

const rien = () => undefined;
void React;
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { etatSortie } from '../../src/domain/carnets/operations';
import { texteSortie } from '../../src/ui/carnets/EtatIA';

const doc = (items: ReturnType<typeof fixtureCarnets>, id: string): CarnetDoc => lireCarnet(items.find(d => d.id === id)!)!;

describe('critique 7, limite du n° 2 : une seule ligne à virgules', () => {
  type L = { texte: string; sorte: string; titre?: string; carnetId?: string; carnetNeuf?: string };
  const LIGNE = 'Sachets de levure x2, tient 80 °C pour la hotte';
  const tient80 = (ls: L[]) => ls.filter(l => /80\s*°C/.test(l.texte) && l.sorte !== 'idee' && l.sorte !== 'note');
  it('depuis la liste : « Tient 80 °C » ne va jamais dans un carnet des levures', () => {
    const ls = reponseSimulee({ texte: LIGNE, carnets: [], depuis: null, pages: [] } as unknown as ContexteRangerCarnet)!.lignes as L[];
    const t = tient80(ls);
    expect(t.length).toBeGreaterThan(0);
    for (const l of t) expect(`${l.titre ?? ''} ${l.carnetNeuf ?? ''}`).not.toMatch(/levure/i);
  });
  /* Ouvert (reprise) : l'IA simulée range la ligne entière, levures comprises, dans « Ventilation de la salle de brassage » ; et à la
     création, l'app tient la cible du carnet créé (CarnetsVue, `definitif`), non vérifiée ici. */
  it.todo('la ligne à virgules est découpée : les levures et la hotte dans deux carnets');
  it('écrit dans le carnet des levures : aucun critère « Tient 80 °C » ici', () => {
    const ctx = { texte: LIGNE, depuis: 'ZZ-LEV', pages: [], carnets: [{ id: 'ZZ-LEV', titre: 'Sachets de levure', criteres: [], facons: [], articles: [], notes: [] }] };
    const ls = reponseSimulee(ctx as unknown as ContexteRangerCarnet)!.lignes as L[];
    expect(tient80(ls).filter(l => !l.carnetNeuf && (!l.carnetId || l.carnetId === 'ZZ-LEV'))).toEqual([]);
  });
  it('« pour le moût » sur une seule idée garde son critère', () => {
    const ls = reponseSimulee({ texte: 'Échangeur à plaques qui tient 80 °C pour le moût', carnets: [], depuis: null, pages: [] } as unknown as ContexteRangerCarnet)!.lignes as L[];
    expect(ls.some(l => l.sorte === 'critere' && /80 °C/.test(l.texte))).toBe(true);
  });
});

describe('critique 7, n° 7 : le dépôt d’un lien dit son rang (G20, R26)', () => {
  it('la ligne rangée d’un article porte le rang calculé dans son bandeau', () => {
    const v = doc(fixtureCarnets(), ID_VENTILATION);
    const t = tableau(v)!;
    const rang = rangDuLien(t, 'ZZ-V-A2', v.carnet.articles);
    expect(rang).toBe('2e de sa façon, après Hotte inox 120 cm + moteur');
    const { container } = render(<CarnetOuvert carnet={v as unknown as CarnetV} aides={AIDES_ETEINTES} liens={[]} tableau={t as never}
      rangee={{ cible: 'article', id: 'ZZ-V-A2', rang: rang!, onAnnuler: rien }} onRetour={rien} onRenommer={rien} onSupprimer={rien}
      onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
    const bandeau = container.querySelector('.cn-rangee')!.textContent!;
    expect(bandeau).toContain('Article rangé ici, dans Hotte inox + extracteur · 2e de sa façon, après Hotte inox 120 cm + moteur');
    cleanup();
  });
  it('un lien sans façon dit sa place parmi les articles en lice', () => {
    const v = doc(fixtureCarnets(), ID_VENTILATION);
    const sansFacon = { ...v, carnet: { ...v.carnet, articles: v.carnet.articles.map(a => (a.id === 'ZZ-V-A2' ? { ...a, faconId: undefined } : a)) } };
    expect(rangDuLien(tableau(sansFacon)!, 'ZZ-V-A2', sansFacon.carnet.articles)).toMatch(/^\d+e sur \d+$/);
  });
});

describe('critique 7, n° 6 : le pourquoi se calcule sur les articles présents', () => {
  const ventilation = (garder?: string[]): CarnetDoc => {
    const d = doc(fixtureCarnets(), ID_VENTILATION);
    return garder ? { ...d, carnet: { ...d.carnet, articles: d.carnet.articles.filter(a => garder.includes(a.id)) } } : d;
  };
  it('deux hottes tiennent 80 °C : jamais « la seule », le plus gros débit des deux', () => {
    const p = pourquoiDe(ventilation(), 'ZZ-V-A1')!;
    expect(p).toBe('Le plus gros débit des deux à tenir 80 °C ; en stock, Inox Broye (CH).');
    expect(p).not.toMatch(/seule/);
  });
  it('face à un extracteur qui ne tient pas 80 °C : « la seule » redevient vraie', () => {
    expect(pourquoiDe(ventilation(['ZZ-V-A1', 'ZZ-V-A3']), 'ZZ-V-A1')).toBe('La seule à tenir 80 °C ; en stock, Inox Broye (CH).');
  });
});

describe('critique 7, n° 5 : estRealise gouverne la liste, la fiche et Choisir', () => {
  it('Embouteillage payé : réalisé, daté de sa facture, jamais « Dans À venir »', () => {
    const r = fixturePlanRealise();
    const e = etatSortie(doc(r.items, ID_EMBOUTEILLAGE), r.plans, r.transactions, r.payments);
    expect(e).toEqual({ sorte: 'realise', le: '2026-11-16' });
    const texte = texteSortie({ le: '2026-11-15T10:00:00.000Z', etat: e!.sorte, realiseLe: e!.le });
    expect(texte).toBe('Réalisé, payé le 16 nov.');
    expect(texte).not.toMatch(/À venir/);
  });
  it('Frigo sans dépense : à venir, daté de l’envoi', () => {
    const items = fixtureCarnets();
    const e = etatSortie(doc(items, ID_FRIGO), fixturePlans(), [], []);
    expect(e).toEqual({ sorte: 'a-venir', le: '2026-11-16T10:00:00.000Z' });
    expect(texteSortie({ le: e!.le, etat: e!.sorte })).toBe('Dans À venir depuis le 16 nov.');
  });
  it('sans sortie : rien ; plan payé sans facture datée : aucune date inventée', () => {
    const items = fixtureCarnets();
    expect(etatSortie(doc(items, ID_EMBOUTEILLAGE), fixturePlans(), [], [])).toBeNull();
    expect(texteSortie({ le: '', etat: 'realise', realiseLe: '' })).toBe('Réalisé, payé');
  });
});
