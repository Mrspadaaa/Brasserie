// @vitest-environment jsdom
/**
 * Voie r54 (25.11) : C66-4 de bout en bout, par le composant. Fiche d'un houblon (Hopfenmarkt, vendu au sachet et au kilo), « je prends » coché à 1 kg (62,20),
 * bouton Choisir, écran Choisir, validation : l'entrée À venir (le plan écrit) porte 1 kg et 62,20, pas le sachet de 100 g (6,70). Puis C66-1 : Retirer depuis la feuille
 * Articles, l'Annuler du retour est visible (feuille fermée) et rend l'article. Fixture : tests/fixtures/c66/carnets.json ; aucun Gemini.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, type Article, type CarnetDoc, type Valeur } from '../../src/domain/carnets/modele';
import { choisir, planDepuisChoix, planSuitChoix } from '../../src/domain/carnets/operations';
import { prixChoisiCentimes } from '../../src/domain/carnets/prixChoisi';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix { id: string; nom: string; vendeur: string; pays: string; dispo: string; lignes: Ligne[]; prixCentimes?: number; devise?: string; taxe?: 'ht' | 'ttc'; change?: { taux: number; date: string; source: 'BCE' }; conditionnement?: { valeur: number; unite: string }; offres?: unknown[] }
const F66 = JSON.parse(readFileSync('tests/fixtures/c66/carnets.json', 'utf8')) as { pellets: { titre: string; articles: ArticleFix[] } };
const TITRE = F66.pellets.titre;
const ID = 'ZZ-R54-PELLETS';

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const numerique = !!e.unite && /^[\d,.]+$/.test(e.valeur);
    sortie[e.nom] = (numerique ? { valeur: Number(e.valeur.replace(',', '.')), unite: e.unite, origine: 'page' } : { valeur: e.valeur, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' }) as Valeur;
  }
  return sortie;
};
/** Le carnet de houblons du test en ligne, sans Brau (deux vendeurs lisibles : Hopfenmarkt en francs, MotlerHops en euros). */
function pellets(): CarnetDoc {
  const b = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...b, id: ID, title: TITRE,
    carnet: {
      ...b.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: F66.pellets.articles.filter(a => a.id !== 'B1').map(a => ({
        id: a.id, nom: a.nom, domaine: 'boutique-exemple.test', url: `https://www.boutique-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays, valeurs: valeursDe(a.lignes),
        ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes, devise: a.devise ?? 'CHF', taxe: a.taxe ?? 'ttc' } : {}),
        ...(a.change ? { change: a.change } : {}), ...(a.conditionnement ? { conditionnement: a.conditionnement } : {}), ...(a.offres ? { offres: a.offres } : {})
      }) as Article)
    }
  } as CarnetDoc;
}

const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const bouton = (re: RegExp, racine: ParentNode = document) => [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const appels: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

async function monter(plans: FinancialPlan[] = []) {
  const autres = fixtureCarnets().filter(i => i.id !== ID);
  const magasin = magasinMemoire([pellets() as never, ...autres]);
  const ecrits: FinancialPlan[] = [];
  render(<CarnetsVue magasin={magasin} finances={{ plans, transactions: [], payments: [] }} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID, at: 1 }}
    ecrirePlan={(pl: FinancialPlan) => { ecrits.push(pl); }} />);
  await attendre(60);
  return { magasin, ecrits };
}
const carnetDe = (m: ReturnType<typeof magasinMemoire>) => lireCarnets(m.lire()).find(c => c.id === ID)!;

async function ouvrirFicheHopfenmarkt() {
  fireEvent.click([...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''))!);
  await attendre(30);
  const feuille = document.querySelector('[role="dialog"][aria-modal="true"]')!;
  expect(feuille, 'la feuille Articles').toBeTruthy();
  const carte = [...feuille.querySelectorAll('button')].find(b => /citra hopfenpellets/.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`)) && !/retirer|deplacer/.test(sans(b.getAttribute('aria-label') ?? '')));
  expect(carte, 'la carte Hopfenmarkt s\'ouvre').toBeTruthy();
  fireEvent.click(carte!);
  await attendre(30);
}

describe('R54 (C66-4) : de la fiche à À venir, la quantité cochée et son prix', () => {
  beforeEach(() => poserQuantitePour(TITRE, 1));

  it('fiche : Choisir · Hopfenmarkt, 1 kg → écran Choisir à 62,20 → valider : le choix et le plan À venir portent 1 kg et 62,20 (pas 6,70)', async () => {
    const { magasin, ecrits } = await monter();
    await ouvrirFicheHopfenmarkt();
    const choisirFiche = bouton(/^choisir · hopfenmarkt, 1 kg/);
    expect(choisirFiche, 'le bouton de la fiche dit la quantité cochée').toBeTruthy();
    fireEvent.click(choisirFiche!);
    await attendre(30);
    const ecran = document.querySelector('.cn-choisir')!;
    expect(ecran, 'l\'écran Choisir').toBeTruthy();
    const texte = sans(ecran.textContent ?? '');
    expect(texte, texte).toMatch(/citra hopfenpellets/);
    expect(texte, texte).toMatch(/62,20/);
    expect(texte, texte).not.toMatch(/6,70/);
    expect(texte, texte).toMatch(/part dans a venir.*62,20/);
    fireEvent.click(bouton(/^choisir chez hopfenmarkt/, ecran)!);
    await attendre(60);
    const c = carnetDe(magasin);
    expect(c.carnet.choix?.articleId).toBe('HM');
    expect(c.carnet.choix?.quantite).toEqual({ kg: 1, libelle: '1 kg' });
    expect(c.carnet.choix?.prixCentimes).toBe(6220);
    expect(c.estimatedCost).toBe(62.2);
    expect(prixChoisiCentimes(c)).toBe(6220);
    const plan = ecrits.at(-1);
    expect(plan, 'une entrée À venir écrite').toBeTruthy();
    expect(plan!.amountCents, 'le prix du kilo').toBe(6220);
    expect(plan!.upgrade?.purchaseCents).toBe(6220);
    expect(plan!.notes, 'la quantité').toBe('1 kg');
  });

  it('Choisir depuis Comparer (aucune quantité) : le prix reste celui de l\'article, rien d\'inventé', () => {
    const d = pellets();
    const r = choisir([d as never], { carnetId: ID, articleId: 'HM', pourquoi: 'le moins cher', le: '2026-11-25T10:00:00.000Z' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c = lireCarnets(r.ecritures.filter(e => e.op === 'put').map(e => (e as { doc: never }).doc))[0];
    expect(c.carnet.choix?.quantite).toBeUndefined();
    expect(c.carnet.choix?.prixCentimes).toBeUndefined();
    expect(planDepuisChoix(c, { le: '2026-11-25T10:00:00.000Z' })!.amountCents).toBe(670);
  });

  it('un plan déjà posé suit le choix : le prix du kilo remplace celui du sachet', () => {
    const d = pellets();
    const r = choisir([d as never], { carnetId: ID, articleId: 'HM', pourquoi: 'pour 1 kg', le: '2026-11-25T10:00:00.000Z', quantite: { kg: 1, libelle: '1 kg' }, prixCentimes: 6220 });
    if (!r.ok) throw new Error(r.raison);
    const c = lireCarnets(r.ecritures.filter(e => e.op === 'put').map(e => (e as { doc: never }).doc))[0];
    const vieux = planDepuisChoix({ ...c, carnet: { ...c.carnet, choix: { ...c.carnet.choix!, quantite: undefined, prixCentimes: undefined } } } as CarnetDoc, { le: '2026-11-25T10:00:00.000Z' })!;
    expect(vieux.amountCents).toBe(670);
    const suivi = planSuitChoix(vieux, c);
    expect(suivi.amountCents).toBe(6220);
    expect(suivi.upgrade?.purchaseCents).toBe(6220);
  });
});

describe('R51 (C66-1) : Retirer depuis la feuille Articles', () => {
  it('l\'Annuler du retour est visible (la feuille se ferme) et rend l\'article', async () => {
    const { magasin } = await monter();
    fireEvent.click([...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''))!);
    await attendre(30);
    const feuille = document.querySelector('[role="dialog"][aria-modal="true"]')!;
    fireEvent.click(bouton(/retirer l'article « citra® \(us\)/, feuille)!);
    await attendre(30);
    expect(carnetDe(magasin).carnet.articles.map(a => a.id)).toEqual(['HM']);
    expect(document.querySelector('[role="dialog"][aria-modal="true"]'), 'la feuille ne recouvre plus le retour').toBeNull();
    const annuler = [...document.querySelectorAll('button')].find(b => /^\s*annuler\s*$/i.test(b.textContent ?? '') && /article retire/.test(sans(b.parentElement?.textContent ?? '')));
    expect(annuler, 'Annuler visible').toBeTruthy();
    fireEvent.click(annuler!);
    await attendre(30);
    expect(carnetDe(magasin).carnet.articles.map(a => a.id).sort()).toEqual(['HM', 'M1']);
  });
});
