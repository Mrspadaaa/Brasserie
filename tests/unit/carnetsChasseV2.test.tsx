// @vitest-environment jsdom
/**
 * Chasse Carnet V2 (21.11) : chaque test est rouge sur en-ligne/2026-11-21-tour8 et vert sur l'arbre.
 * CRP-1 (maillons 2 et 3, prix de la page), CRP-2 et CRB-9 (lecture), CRW-3 (plan daté), 
 * CRN-ONGLET-RETOUR (l'onglet actif « Carnet » ramène à la liste). Gemini simulé, fixtures « ZZ TEST ».
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue, depuisIA } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { lireReponse, type PageLue } from '../../src/domain/carnets/ia';
import { planDepuisChoix } from '../../src/domain/carnets/operations';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => cleanup());

const LIEN = 'https://exemple.invalid/zz-test-chambre-froide';
const page = (o: Partial<PageLue> = {}): PageLue => ({ url: LIEN, domaine: 'exemple.invalid', statut: 'lue', nom: 'Chambre froide 6 m³', prix: 1980, devise: 'CHF', ...o } as PageLue);
const ctx = (pages: PageLue[]) => ({ texte: `ZZ TEST ${LIEN}`, carnets: [], pages });
const reponse = { lignes: [{ sorte: 'article', texte: 'Chambre froide', url: LIEN, titre: 'Chambre froide' }] };
const pageMuette = (u: string) => ({ url: u, domaine: 'exemple.invalid', statut: 'illisible', luLe: 0 }) as unknown as PageLue;

describe('CRP-1 maillon 2 : le prix lu sur la page de la ligne arrive à l\'article', () => {
  it('page lue 1980 CHF, aucun prix rendu par l\'IA : 198000 centimes, source page', () => {
    const l = lireReponse(reponse, ctx([page()]))![0];
    expect(l.prixCentimes).toBe(198000);
    expect(l.devise).toBe('CHF');
    expect(l.prixSource).toBe('page');
  });
  it('« dès » est porté ; sans devise, page illisible ou prix 0 : aucun prix, jamais 0', () => {
    expect((lireReponse(reponse, ctx([page({ prixDes: true })]))![0] as { prixDes?: boolean }).prixDes).toBe(true);
    expect(lireReponse(reponse, ctx([page({ devise: undefined })]))![0].prixCentimes).toBeUndefined();
    expect(lireReponse(reponse, ctx([page({ statut: 'illisible' })]))![0].prixCentimes).toBeUndefined();
    expect(lireReponse(reponse, ctx([page({ prix: 0 })]))![0].prixCentimes).toBeUndefined();
  });
});

describe('CRP-1 maillon 3 : depuisIA reprend le prix de la page', () => {
  it('une ligne sans prixCentimes mais avec une page lue', () => {
    const l = { sorte: 'article', texte: 'x', url: LIEN, origine: 'exemple', page: page({ prixDes: true }) } as never;
    const a = depuisIA(l, { carnetId: 'c' }) as { prixCentimes?: number; devise?: string; prixDes?: boolean };
    expect(a.prixCentimes).toBe(198000);
    expect(a.devise).toBe('CHF');
    expect(a.prixDes).toBe(true);
  });
});

describe('CRP-2 et CRB-9 : lecture des articles déjà stockés', () => {
  const doc = (titre: string, nom: string, valeurs: Record<string, unknown>) => ({
    id: 'ZZ-C', type: 'carnet', title: titre, status: 'research', createdAt: '2026-11-01', updatedAt: '2026-11-01',
    carnet: { version: 1, creeLe: '2026-11-01T00:00:00Z', phrase: titre, criteres: [], facons: [], notes: [], photos: [],
      articles: [{ id: 'A', nom, lecture: 'lue', valeurs }] }
  }) as never;
  it('préfixe du carnet retiré, entités décodées, « Couleur : » nettoyé ; le magasin reste intact', () => {
    const brut = [doc('Chambre froide', 'Chambre froide - Modèle 6 m³', { 'Épaisseur de l&apos;isolation': { valeur: '80', origine: 'page' }, 'Couleur : ': { valeur: 'blanc', origine: 'page' } })];
    const a = lireCarnets(brut)[0].carnet.articles[0];
    expect(a.nom).toBe('Modèle 6 m³');
    expect(Object.keys(a.valeurs).sort()).toEqual(['Couleur', 'Épaisseur de l\'isolation']);
    expect((brut[0] as { carnet: { articles: { nom: string }[] } }).carnet.articles[0].nom).toBe('Chambre froide - Modèle 6 m³');
  });
  it('un nom autre ou égal au titre : inchangé', () => {
    expect(lireCarnets([doc('Chambre froide', 'Cellule 6 m³', {})])[0].carnet.articles[0].nom).toBe('Cellule 6 m³');
    expect(lireCarnets([doc('Chambre froide', 'Chambre froide', {})])[0].carnet.articles[0].nom).toBe('Chambre froide');
  });
});

describe('CRW-3 : le plan tiré d\'un article sans prix a une date', () => {
  const carnet = (prix?: number) => ({
    id: 'ZZ-C', title: 'Chambre froide', carnet: { articles: [{ id: 'A', nom: 'X', ...(prix !== undefined ? { prixCentimes: prix, devise: 'CHF' } : {}) }],
      choix: { articleId: 'A', pourquoi: 'ok', le: '2026-11-21', ecartes: [], remplaces: [] } } }) as never;
  it('prix inconnu : 1er du mois dans 3 mois (fin d\'année comprise), « à chercher », 0 en stockage', () => {
    const p = planDepuisChoix(carnet(), { le: '2026-11-21T10:00:00.000Z' })!;
    expect(p.date).toBe('2027-02-01');
    expect(p.amountCents).toBe(0);
    expect(p.upgrade).toMatchObject({ budgetKnown: false, stage: 'research', datePrecision: 'month' });
  });
  it('prix connu : montant inchangé', () => {
    const p = planDepuisChoix(carnet(240000), { le: '2026-03-05T00:00:00.000Z' })!;
    expect(p.amountCents).toBe(240000);
    expect(p.upgrade).toMatchObject({ budgetKnown: true, stage: 'ready' });
  });
});

function monter(appels: AppelsIA, extra: Record<string, unknown> = {}) {
  const magasin = magasinMemoire(fixtureCarnets());
  const vue = (p: Record<string, unknown>) => <CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appels}
    aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} {...p} />;
  const r = render(vue(extra));
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  return { magasin, champ, carnets: () => lireCarnets(magasin.lire()), rerender: (p: Record<string, unknown>) => r.rerender(vue(p)) };
}
const attendre = async (ms = 150) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };

describe('CRN-ONGLET-RETOUR : l\'onglet actif ramène à la liste', () => {
  it('carnet ouvert, `racine` change : la liste revient ; le texte tapé reste dans le champ', async () => {
    const appels: AppelsIA = { async ranger() { return { ok: false }; }, async lire(u) { return pageMuette(u); } };
    const { champ, rerender } = monter(appels, { ouvrir: { id: ID_VENTILATION, at: 1 } });
    await attendre(30);
    const vue = () => document.querySelector('[data-carnets]')!.getAttribute('data-vue');
    expect(vue()).toBe('carnet');
    fireEvent.change(champ(), { target: { value: 'ZZ TEST brouillon en cours' } });
    rerender({ ouvrir: { id: ID_VENTILATION, at: 1 }, racine: 2 });
    await attendre(30);
    expect(champ().value).toBe('ZZ TEST brouillon en cours');
    expect(vue()).toBe('liste');
  });
});
