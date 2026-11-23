// @vitest-environment jsdom
/*
 * Banc réel de 25 liens (23.11, work/missions/2026-11-23-carnet-en-ligne/banc-liens/RAPPORT.md) :
 * BL-1 (bloquant) : 4 fois l'IA a rendu le carnetId d'un vrai carnet (« Frigo + congel ») pour un frigo collé dans un carnet ZZ ouvert, et
 * l'app l'a appliqué. Un lien collé DANS un carnet ouvert reste dans CE carnet ; le carnet de l'IA n'est qu'une proposition « Déplacer vers … ? ».
 * BL-2 : le bandeau dit où l'article est vraiment allé, et l'état de lecture réel après la réponse (GH-4 : « page non lue » faux).
 * BL-3 : aucun geste pour retirer un article ou le déplacer une fois le bandeau parti : le ⋯ de la ligne Articles, avec Annuler.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire, magasinSur } from '../../src/services/carnetsStore';
import type { CreativeItem } from '../../src/types';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { lireReponse, type PageLue } from '../../src/domain/carnets/ia';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
/* la vue ouverte se garde d'un montage à l'autre : chaque test part de la liste */
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

const LIEN = 'https://www.galaxus.ch/fr/s1/product/zz-test-ks340l-kuehlschrank';
const NOM = 'Kühlschrank KS340L';
const pageLue = (u: string): PageLue => ({ url: u, domaine: 'galaxus.ch', statut: 'lue', nom: NOM, prix: 445, devise: 'CHF', luLe: 1 } as PageLue);
const pageMuette = (u: string): PageLue => ({ url: u, domaine: 'galaxus.ch', statut: 'bloquee', luLe: 1 } as unknown as PageLue);
/* la réponse observée au banc : l'IA range le frigo dans le carnet existant qui parle de frigo, pas dans l'ouvert */
const versFrigo = { lignes: [{ sorte: 'article', texte: NOM, titre: NOM, url: LIEN, carnetId: ID_FRIGO, prix: 445, devise: 'CHF' }] };
/* lireLien prend au moins une seconde en vrai : l'écriture locale a le temps d'arriver au magasin */
const pause = () => new Promise(r => setTimeout(r, 20));
const appels = (page: (u: string) => PageLue = pageLue): AppelsIA => ({ async ranger() { await pause(); return { ok: true, data: versFrigo }; }, async lire(u) { await pause(); return page(u); } });

function monter(a: AppelsIA, ouvrir?: string) {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={a}
    aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} {...(ouvrir ? { ouvrir: { id: ouvrir, at: 1 } } : {})} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const carnet = (id: string) => lireCarnets(magasin.lire(), { archives: true }).find(c => c.id === id)!;
  return { magasin, champ, carnet };
}
const attendre = async (ms = 150) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const coller = async (champ: () => HTMLTextAreaElement, texte: string) => {
  fireEvent.change(champ(), { target: { value: texte } });
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(250);
};
const bandeau = () => document.querySelector('.cn-bandeau[role="status"]');
const aLien = (c: { carnet: { articles: readonly { url?: string }[] } }) => c.carnet.articles.some(a => a.url === LIEN);

describe('BL-1 : un lien collé dans un carnet ouvert reste dans ce carnet', () => {
  it('le garde garde la ligne dans l’ouvert ; le carnet de l’IA devient une suggestion', () => {
    const lignes = lireReponse(versFrigo, { texte: LIEN, carnets: [{ id: ID_VENTILATION, titre: 'Ventilation' }, { id: ID_FRIGO, titre: 'Frigo de garde' }], depuis: ID_VENTILATION, pages: [pageLue(LIEN)] });
    expect(lignes?.[0]).toMatchObject({ sorte: 'article', carnetId: ID_VENTILATION, carnetSuggere: ID_FRIGO });
  });

  it('dans l’app : l’article est dans l’ouvert, pas dans le carnet de l’IA ; « Déplacer vers … ? » le propose', async () => {
    const { champ, carnet } = monter(appels(), ID_VENTILATION);
    await attendre(30);
    await coller(champ, LIEN);
    expect(aLien(carnet(ID_VENTILATION))).toBe(true);
    expect(aLien(carnet(ID_FRIGO))).toBe(false);
    const b = bandeau()!;
    expect(b.textContent).toMatch(/rangé ici/i);
    const deplacer = screen.getByRole('button', { name: /Déplacer vers .*Frigo de garde/ });
    fireEvent.click(deplacer);
    await attendre(30);
    expect(aLien(carnet(ID_FRIGO))).toBe(true);
    expect(aLien(carnet(ID_VENTILATION))).toBe(false);
  });

  it('G21 inchangé : collé depuis la liste, le lien va dans le carnet de l’IA', async () => {
    const { champ, carnet } = monter(appels());
    await attendre(30);
    expect(document.querySelector('[data-carnets]')!.getAttribute('data-vue')).toBe('liste');
    await coller(champ, LIEN);
    expect(aLien(carnet(ID_FRIGO))).toBe(true);
  });
});

/* Le magasin de l'app (Firestore) : une écriture ne se voit qu'à l'instantané suivant ; relu aussitôt, il rend l'état d'avant. */
function magasinDiffere(initial: readonly CreativeItem[]) {
  let vus = initial.map(d => JSON.parse(JSON.stringify(d)) as CreativeItem);
  const rappels = new Set<() => void>();
  const plus_tard = (f: () => void) => setTimeout(() => { f(); rappels.forEach(r => r()); }, 0);
  return magasinSur({
    tous: () => vus.map(d => JSON.parse(JSON.stringify(d)) as CreativeItem),
    poser: (id, doc) => { const copie = JSON.parse(JSON.stringify(doc)) as CreativeItem; plus_tard(() => { vus = [...vus.filter(d => d.id !== id), copie]; }); },
    retirer: id => plus_tard(() => { vus = vus.filter(d => d.id !== id); }),
    sAbonner: r => { rappels.add(r); return () => { rappels.delete(r); }; }
  });
}

describe('BL-2 : le bandeau dit l’état réel après la réponse', () => {
  it('page lue : jamais « page non lue »', async () => {
    const { champ } = monter(appels(), ID_VENTILATION);
    await attendre(30);
    await coller(champ, LIEN);
    expect(bandeau()!.textContent).not.toMatch(/non lue/);
    expect(bandeau()!.textContent).toMatch(/rangé ici/i);
  });

  it('GH-4 : avec le magasin Firestore (écriture vue plus tard), le bandeau suit la réponse, pas l’écriture locale', async () => {
    const magasin = magasinDiffere(fixtureCarnets());
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={appels()}
      aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await attendre(30);
    await coller(() => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement, LIEN);
    const art = lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!.carnet.articles.find(a => a.url === LIEN);
    expect(art?.lecture).toBe('lue');
    expect(bandeau()!.textContent).not.toMatch(/non lue/);
    expect(bandeau()!.textContent).toMatch(/rangé ici/i);
    expect(screen.getByRole('button', { name: /Déplacer vers .*Frigo de garde/ })).toBeTruthy();
  });

  it('page bloquée : « page non lue » et sa raison', async () => {
    const { champ } = monter(appels(pageMuette), ID_VENTILATION);
    await attendre(30);
    await coller(champ, LIEN);
    expect(bandeau()!.textContent).toMatch(/page non lue/);
  });
});

describe('BL-3 : retirer ou déplacer un article, avec Annuler', () => {
  const pret = async () => {
    const m = monter(appels(), ID_VENTILATION);
    await attendre(30);
    await coller(m.champ, LIEN);
    /* le bandeau parti : plus rien que la ligne Articles */
    fireEvent.click(screen.getByRole('button', { name: 'Articles, actions' }));
    return m;
  };

  it('Retirer l’enlève du carnet ; Annuler le remet', async () => {
    const { carnet } = await pret();
    fireEvent.click(screen.getByRole('button', { name: `Retirer l’article « ${NOM} »` }));
    await attendre(30);
    expect(aLien(carnet(ID_VENTILATION))).toBe(false);
    expect(bandeau()!.textContent).toMatch(/Article retiré/);
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    await attendre(30);
    expect(aLien(carnet(ID_VENTILATION))).toBe(true);
  });

  it('Déplacer vers un autre carnet ; Annuler le ramène', async () => {
    const { carnet } = await pret();
    fireEvent.click(screen.getByRole('button', { name: `Déplacer l’article « ${NOM} »` }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Frigo de garde/ }));
    await attendre(30);
    expect(aLien(carnet(ID_FRIGO))).toBe(true);
    expect(aLien(carnet(ID_VENTILATION))).toBe(false);
    expect(bandeau()!.textContent).toMatch(/Rangé dans .*Frigo de garde/);
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    await attendre(30);
    expect(aLien(carnet(ID_VENTILATION))).toBe(true);
    expect(aLien(carnet(ID_FRIGO))).toBe(false);
  });
});
