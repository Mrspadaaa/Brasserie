// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f5c (critique v4, suite de f5) : un test par constat, rouge sur le code d'avant (L13). n° 5 « Façons · 1 façon »
 * au-dessus d'une seule carte ; n° 6 « proposé par l'IA » deux fois puis redit par « classées par … » ; n° 7 « sous votre minimum de
 * 1 500 m³/h » sur 3 lignes et 4e colonne coupée à 390 ; n° 8 « Critère : tient 80 °C » sans « puis le débit » ; n° 9 « 11 700 CHF »
 * trois fois dans Réalisés, noms coupés par « … ». Fixture « ZZ TEST — … », calcul local, aucune IA.
 */
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VirtuosoMockContext } from 'react-virtuoso';
import { tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, fixturePlanRealise, ID_EMBOUTEILLAGE, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { Choisir } from '../../src/ui/carnets/Choisir';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import { AIDES_ETEINTES, type ArticleV, type CarnetV, type ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';

vi.mock('../../src/services/firestoreRepo', async () => {
  const qa = await import('../qa/hop-recipe/repo');
  return { ...qa, FirestoreRepo: { ...qa.FirestoreRepo, all: (name: string) => name === 'movements' ? [] : qa.FirestoreRepo.all(name) } };
});
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

afterEach(cleanup);
const rien = () => undefined;
const texte = (el: Element) => (el.textContent ?? '').replace(/[  ]/g, ' ');
const lire = (id: string): CarnetDoc => lireCarnet(fixtureCarnets().find(i => i.id === id))!;
const V = lire(ID_VENTILATION);
const B = lire(ID_EMBOUTEILLAGE);
const TITRE = 'ZZ TEST — Ventilation de la salle de brassage';
const articleV = (c: CarnetDoc, id: string) => c.carnet.articles.find(a => a.id === id) as unknown as ArticleV;
const comparerV = () => render(<Comparer titre={TITRE} statut="research" critere={V.carnet.criteres[0] as never} tableau={tableau(V)} onRetour={rien} onChoisir={rien} />);
const CSS_DECIDER = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-decider.css'), 'utf8');
const ouvrir = (c: CarnetV) => render(
  <CarnetOuvert carnet={c} aides={AIDES_ETEINTES} liens={[]} tableau={tableau(c.carnet as never) as never} onRetour={rien} onRenommer={rien}
    onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />);
const neuf = (x: Partial<ContenuCarnetV>): CarnetV => ({ id: 'n', title: 'ZZ TEST — Moulin à malt 2 cylindres, 150 kg/h', status: 'idea',
  carnet: { creeLe: '2026-11-19T08:00:00.000Z', phrase: 'Moulin à malt 2 cylindres, 150 kg/h', criteres: [], facons: [], articles: [], notes: [], photos: [], ...x } } as never);

describe('f5c n° 5 : « Façons · 1 façon » ne redit pas la carte unique', () => {
  it('une façon : pas de compte ; deux : « 2 façons » reste', () => {
    const un = ouvrir(neuf({ facons: [{ id: 'f1', nom: '2 cylindres', etat: 'ouverte' }] as never }));
    const tete = un.container.querySelector('section[aria-label="Façons"] .cn-rubrique-tete')!;
    expect(texte(tete)).not.toContain('1 façon');
    expect(texte(un.container)).toContain('2 cylindres');
    cleanup();
    const deux = ouvrir(neuf({ facons: [{ id: 'f1', nom: '2 cylindres', etat: 'ouverte' }, { id: 'f2', nom: '3 cylindres', etat: 'ouverte' }] as never }));
    expect(texte(deux.container.querySelector('section[aria-label="Façons"] .cn-rubrique-tete')!)).toContain('2 façons');
  });
});

describe('f5c n° 6 : Comparer dit la source une fois et ne redit pas les critères', () => {
  it('« proposé par l’IA » une seule fois ; « classées » ne garde que ce qui s’ajoute (le prix)', () => {
    const { container } = comparerV();
    const cqc = texte(container.querySelector('.cn-chaine')!);
    expect(cqc).toContain('tient 80 °C');
    expect(cqc).toContain('le débit');
    expect(cqc.split("proposé par l'IA").length - 1).toBe(1);
    expect(container.querySelector('.cn-cmp-classees')).toBeNull(); /* D419 A1 : la chaîne « Classé par » seule dit la règle */
  });
});

describe('f5c n° 7 : Comparer à 390', () => {
  it('« sous votre minimum » en forme courte d’une ligne, la phrase entière gardée (title, lecteur d’écran)', () => {
    const { container } = comparerV();
    const hors = container.querySelector('.cn-hors-seuil')!;
    expect(hors).toBeTruthy();
    const vu = texte(hors.querySelector('[aria-hidden]')!);
    expect(vu.length).toBeLessThanOrEqual(14);
    expect(vu).toContain('1 500');
    expect(hors.getAttribute('title')).toMatch(/sous votre minimum de 1 500/);
    expect(texte(hors.querySelector('.cn-cache')!)).toMatch(/sous votre minimum de 1 500/);
    expect(CSS_DECIDER).toMatch(/\.cn-hors-seuil \{[^}]*white-space: nowrap/);
  });
  describe('colonnes entières', () => {
    const avant = {
      cw: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth'),
      sw: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth'),
      ow: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
    };
    beforeEach(() => {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 342; } });
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get() { return 520; } });
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return this.tagName === 'TH' ? 85 : 342; } });
    });
    afterEach(() => {
      for (const [k, d] of [['clientWidth', avant.cw], ['scrollWidth', avant.sw], ['offsetWidth', avant.ow]] as const) {
        if (d) Object.defineProperty(HTMLElement.prototype, k, d); else delete (HTMLElement.prototype as never)[k];
      }
    });
    it('quand le tableau déborde, les colonnes d’articles se partagent la place : aucune colonne coupée au repos', () => {
      const { container } = comparerV();
      const zone = container.querySelector('.cn-tableau-zone') as HTMLElement;
      /* (342 − 85) / 3 = 85,67 → 3 colonnes de 85 px ; la 4e commence au bord */
      expect(zone.style.getPropertyValue('--cn-col')).toBe('85px');
      expect(CSS_DECIDER).toMatch(/var\(--cn-col\)/);
    });
  });
});

describe('f5c n° 8 : Choisir nomme tous les critères qui classent', () => {
  it('« Critères : tient 80 °C, puis le débit, proposé par l’IA »', () => {
    const autres = ['ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4'].map((id, i) => ({ article: articleV(V, id), rang: i + 2 }));
    render(<Choisir etape="choisir" titre={TITRE} carnet={V.carnet} article={articleV(V, 'ZZ-V-A1')} sur={4} valeurs={[]} autres={autres} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
    const retenus = texte(screen.getByRole('list', { name: 'Retenu' }));
    expect(retenus).toContain('tient 80 °C, puis le débit');
    expect(retenus.split("proposé par l'IA").length - 1).toBeLessThanOrEqual(1);
  });
});

/* n° 9 : Stocks › Matériel monté pour de vrai (StocksTab, magasin de QA, fixture « ZZ TEST — … »). */
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}><StocksTab stocks={stocks} batches={[]} /></VirtuosoMockContext.Provider>;
}
describe('f5c n° 9 : Réalisés et Embouteillage', () => {
  beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
  it('payé = prévu : « 11 700 CHF » une seule fois sur la carte, la ligne dit payé en entier au montant prévu', async () => {
    const { items, plans, transactions, payments } = fixturePlanRealise();
    seedQa({ creativeItems: items, financialPlans: plans, transactions, financialPayments: payments });
    StorageService.setUiState('stocks_subtab', 'materiel');
    StorageService.setUiState('stocks_materiel', 'realises');
    render(<Catalogue />);
    await act(async () => { await new Promise(res => setTimeout(res, 30)); });
    const colonne = document.querySelector('[data-colonne-materiel]') as HTMLElement;
    const carte = colonne.querySelector('.upgrade-item')!;
    expect(texte(carte).split('11 700 CHF').length - 1).toBe(1);
    expect(texte(carte.querySelector('[data-paye-prevu]')!)).toBe('Payé en entier, au montant prévu');
    expect(texte(carte)).not.toContain('comme prévu');
  });
  it('les noms du tableau du carnet sont entiers (deux articles de même nom se distinguent par leur vendeur)', () => {
    const { container } = ouvrir(B as unknown as CarnetV);
    const noms = [...container.querySelectorAll('.cn-tab-nom > span:first-child')];
    expect(noms.length).toBeGreaterThan(0);
    for (const n of noms) expect(n.className).not.toContain('cn-deux-lignes');
  });
});
