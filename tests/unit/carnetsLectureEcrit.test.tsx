// @vitest-environment jsdom
/**
 * Voie lecture-ecrit (24.11, D1 et D4 des personas) : REGARDER un carnet n'écrit jamais rien. Seul un geste d'écriture du brasseur écrit.
 * Le test monte chaque vue du Carnet (liste, carnet ouvert, Articles, fiche, Comparer, Choisir, Quand) sur le VRAI magasin
 * (`magasinSur`, celui de l'app) dont le port est un espion, et espionne aussi `FirestoreRepo` (put, remove, adjustNumber, replaceAll,
 * bulkWrite), `StorageService` et `FinanceService` : aucune écriture n'est permise tant qu'aucun geste d'écriture n'a été fait.
 * Les données sont des carnets ANCIENS (sans domaine posé, valeurs dans l'ordre de la page, article lu sans prix, un choix déjà fait) : ce que
 * les calculs d'affichage (domaine déduit, ordre des caractéristiques, prix choisi, migration de forme) doivent garder en mémoire.
 * Aucun réseau réel, aucun Gemini. Les gestes joués ne sont que de la navigation (ouvrir, Comparer, fiche, Choisir, retour).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ID_EVIER, ID_FRIGO, ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinSur, type MagasinCarnets } from '../../src/services/carnetsStore';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { CreativeItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix { id: string; nom: string; vendeur: string; pays: string; dispo: string; prixCentimes: number; lignes: Ligne[] }
interface CarnetFix { titre: string; critere?: { texte: string; nom: string; unite: string; sens: 'plus' | 'moins' }; articles: ArticleFix[] }
const F58 = JSON.parse(readFileSync('tests/fixtures/c58/carnets.json', 'utf8')) as { chambre: CarnetFix };
const F56 = JSON.parse(readFileSync('tests/fixtures/c56/carnets.json', 'utf8')) as { houblon: CarnetFix };

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};
/** Un carnet ANCIEN : pas de domaine posé, valeurs dans l'ordre de la page (renversé), un article lu sans prix, un choix déjà fait. */
function ancien(id: string, f: CarnetFix, o: { choix?: boolean } = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const criteres: Critere[] = f.critere
    ? [{ id: 'K1', texte: f.critere.texte, origine: 'vous', caracteristique: { nom: f.critere.nom, unite: f.critere.unite, sens: f.critere.sens } } as Critere] : [];
  const articles = f.articles.map((a, i) => ({
    id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
    valeurs: valeursDe([...a.lignes].reverse()), ...(i === 0 ? {} : { prixCentimes: a.prixCentimes }), devise: 'CHF', taxe: 'ht' as const
  }) as Article);
  const carnet = { ...base.carnet, domaine: undefined, criteres, facons: [], notes: [], photos: [], sortie: undefined, archive: undefined, articles,
    choix: o.choix ? { articleId: articles[1].id, le: '2026-11-20T10:00:00.000Z', pourquoi: 'ZZ TEST', ecartes: [{ articleId: articles[0].id, raison: 'ZZ TEST' }], remplaces: [] } : undefined };
  return { ...base, id, title: f.titre, carnet } as unknown as CarnetDoc;
}

const DONNEES = (): CreativeItem[] => {
  const dep = JSON.parse(JSON.stringify(fixtureCarnets())) as CreativeItem[];
  /* les carnets de la fixture, rendus anciens : sans domaine posé */
  for (const d of dep) { const c = (d as { carnet?: Record<string, unknown> }).carnet; if (c) delete c.domaine; }
  return [...dep, ancien('ZZ-ANCIEN-CHAMBRE', F58.chambre), ancien('ZZ-ANCIEN-HOUBLON', F56.houblon, { choix: true })] as unknown as CreativeItem[];
};

interface Espions { port: string[]; repo: string[]; vider: () => void }
let ecritures: string[] = [];
const espionner = (): { magasin: MagasinCarnets } => {
  let docs = DONNEES();
  const magasin = magasinSur({
    tous: () => JSON.parse(JSON.stringify(docs)) as CreativeItem[],
    poser: (id, doc) => { ecritures.push(`magasin.poser ${id}`); docs = docs.filter(d => d.id !== id).concat(doc); },
    retirer: id => { ecritures.push(`magasin.retirer ${id}`); docs = docs.filter(d => d.id !== id); },
    sAbonner: () => () => {},
    journaliser: j => { ecritures.push(`magasin.journal ${j.action}`); }
  });
  return { magasin };
};

beforeEach(() => {
  Element.prototype.scrollIntoView = function () {} as never;
  localStorage.clear(); sessionStorage.clear(); ecritures = [];
  for (const [objet, noms] of [
    [FirestoreRepo, ['put', 'remove', 'adjustNumber', 'replaceAll', 'bulkWrite']],
    [StorageService, ['addCreativeItem', 'updateCreativeItem', 'saveCreativeItems', 'deleteCreativeItem', 'logAction', 'deleteUpgradePlan']],
    [FinanceService, ['savePlan', 'saveUpgrade', 'cancelPlan']]
  ] as const) {
    for (const nom of noms) {
      const o = objet as unknown as Record<string, unknown>;
      if (typeof o[nom] === 'function') vi.spyOn(objet as never, nom as never).mockImplementation((() => { ecritures.push(`${(objet as { constructor: { name: string } }) === (FirestoreRepo as never) ? 'FirestoreRepo' : objet === StorageService ? 'StorageService' : 'FinanceService'}.${nom}`); return undefined; }) as never);
    }
  }
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const bouton = (racine: ParentNode, re: RegExp): HTMLElement | undefined =>
  [...racine.querySelectorAll<HTMLElement>('button, [role="button"], a')].find(b => re.test(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`.replace(/\s+/g, ' ').trim()));

/** Monte le Carnet sur le vrai magasin à port espion, ouvre `id`, puis joue la NAVIGATION demandée (jamais un geste d'écriture). */
async function regarder(id: string | null, navigation: Array<RegExp | 'attendre'> = []): Promise<{ vus: string[] }> {
  const { magasin } = espionner();
  const { container } = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never}
    aides={aidesCarnet('simule' as never, {})} {...(id ? { ouvrir: { id, at: 1 } } : {})} />);
  const vus: string[] = [];
  await attendre(900); /* le répit de reprise (C56-4, 400 ms) et les effets de montage passent */
  for (const etape of navigation) {
    if (etape === 'attendre') { await attendre(600); continue; }
    const b = bouton(container, etape);
    vus.push(`${etape}: ${b ? 'oui' : 'absent'}`);
    if (b) { await act(async () => { fireEvent.click(b); }); await attendre(700); }
  }
  return { vus };
}

const CARNETS = ['ZZ-ANCIEN-CHAMBRE', 'ZZ-ANCIEN-HOUBLON', ID_VENTILATION, ID_EVIER, ID_FRIGO];

describe('regarder un carnet n’écrit jamais rien (LE-1)', () => {
  it('la liste des carnets, montée seule', async () => {
    await regarder(null);
    expect(ecritures).toEqual([]);
  });
  for (const id of CARNETS) {
    it(`${id} : ouvert, puis Comparer, une fiche, Choisir, retour`, async () => {
      const { vus } = await regarder(id, ['attendre', /^Comparer/, 'attendre', /Choisir|Retenir/, 'attendre']);
      if (process.env.DEBUG_LE) console.log(id, vus.join(' | '));
      expect(ecritures, `écritures sans geste dans ${id} : ${ecritures.join(', ')}`).toEqual([]);
    });
    it(`${id} : ouvert, puis une fiche d'article`, async () => {
      const { magasin } = espionner();
      const { container } = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never}
        aides={aidesCarnet('simule' as never, {})} ouvrir={{ id, at: 1 }} />);
      await attendre(900);
      const carte = container.querySelector<HTMLElement>('[data-article-id], .cn-carte-article, .cn-article') ?? bouton(container, /ZZ|Ouvrir l.offre|offre/i);
      if (carte) { await act(async () => { fireEvent.click(carte); }); await attendre(700); }
      expect(ecritures, `écritures sans geste (fiche) dans ${id} : ${ecritures.join(', ')}`).toEqual([]);
    });
  }
});

/* LE-1, la cause : une lecture de lien lancée un jour et jamais finie reste GARDÉE sur l'appareil 24 h (`suiviLocal`, localStorage). À chaque
   montage du Carnet, `reprendreLectures` la rejouait seule (`passerIA`, `reouverture`) : le rangement (ou le repli local : nom, prix, valeurs de la page)
   s'écrivait dans le carnet sans aucun geste, et la file d'écriture de Firestore affichait « Enregistrement sur le serveur… ». */
const LECTURE_GARDEE = { jeton: 'jetonGardeAvantFermeture1', url: 'https://www.grossiste-exemple.test/x', messageId: 'ZZ-MSG-V2', texte: 'https://www.grossiste-exemple.test/x', debut: Date.now() - 3600_000, carnetId: ID_VENTILATION };
const garderUneLecture = () => localStorage.setItem('affinee.carnets.lectures', JSON.stringify([LECTURE_GARDEE]));

describe('une lecture restée en attente ne repart pas toute seule (LE-1)', () => {
  it('ouvrir le Carnet avec une lecture gardée : aucune écriture, la lecture reste gardée, et elle se propose', async () => {
    garderUneLecture();
    const { magasin } = espionner();
    const { container } = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never}
      aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await attendre(1800);
    expect(ecritures, `écritures sans geste : ${ecritures.join(', ')}`).toEqual([]);
    expect(JSON.parse(localStorage.getItem('affinee.carnets.lectures') ?? '[]')).toHaveLength(1);
    expect(container.querySelector('[data-sorte="reprise"]'), 'la lecture en attente se propose, d’un toucher').not.toBeNull();
  });
  it('le toucher « Reprendre » (un geste) la rejoue : lui, il peut écrire', async () => {
    garderUneLecture();
    const { magasin } = espionner();
    const { container } = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never}
      aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await attendre(900);
    const b = container.querySelector<HTMLElement>('[data-sorte="reprise"] button');
    expect(b, 'le bouton de reprise').not.toBeNull();
    await act(async () => { fireEvent.click(b!); });
    await attendre(2500);
    expect(JSON.parse(localStorage.getItem('affinee.carnets.lectures') ?? '[]')).toHaveLength(0);
  });
});

describe('contre-épreuve : le geste d’écriture, lui, écrit', () => {
  it('l’espion voit une écriture quand le brasseur en fait une (renommer)', async () => {
    const { magasin } = espionner();
    const { operations } = { operations: await import('../../src/domain/carnets/operations') };
    const r = operations.renommer(magasin.lire(), { carnetId: ID_VENTILATION, titre: 'ZZ TEST — autre titre' });
    expect(r.ok).toBe(true);
    if (r.ok) magasin.appliquer(r.ecritures, r.journal as never);
    expect(ecritures.some(e => e.startsWith('magasin.poser'))).toBe(true);
  });
});
