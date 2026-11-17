import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue, type FinancesCarnet } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets, type CarnetDoc } from '../../src/domain/carnets/modele';
import { fixtureCarnets, fixturePlanRealise, fixturePlans, ID_FRIGO, ID_EMBOUTEILLAGE, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { enregistrementIdee } from '../../src/domain/calendrierAjout';
import { plusMenuFor } from '../../src/domain/plusEcran';
import type { CreativeItem } from '../../src/types';
import type { FinancialPlan } from '../../src/domain/finance/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
/* Gemini jamais : un espion sur la passerelle prouve qu'aucun appel réel ne part (IA simulée, sans délai). */
const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...a: unknown[]) => run(...a) } }));

afterEach(() => { cleanup(); run.mockReset(); });

const AIDES = aidesCarnet('simule', {});
const ETEINTES = aidesCarnet('production', {});
const vides = (): FinancesCarnet => ({ plans: [], transactions: [], payments: [] });

function monter(items: CreativeItem[] = [], finances: FinancesCarnet = vides(), aides = AIDES) {
  const magasin = magasinMemoire(items);
  const plans: FinancialPlan[] = [];
  const props = { magasin, finances, mode: 'simule' as const, appels: appelsSimules('normal', 0), aides, ecrirePlan: (p: FinancialPlan) => { plans.push(p); } };
  const vue = render(<CarnetsVue {...props} />);
  let gestes = 0;
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  /** Un ajout : la frappe (pas un geste), puis l'envoi (1 geste). Rend le nombre de gestes de cet ajout. */
  const envoyer = async (texte: string) => {
    const avant = gestes;
    fireEvent.change(champ(), { target: { value: texte } });
    await act(async () => { fireEvent.submit(champ().closest('form')!); gestes += 1; });
    await act(async () => { await new Promise(r => setTimeout(r, 20)); });
    return gestes - avant;
  };
  const toucher = async (el: Element) => { await act(async () => { fireEvent.click(el); gestes += 1; }); };
  const carnets = () => lireCarnets(magasin.lire(), { archives: true });
  const carnet = (re: RegExp) => carnets().find(c => re.test(c.title)) as CarnetDoc;
  return { magasin, plans, vue, envoyer, toucher, carnets, carnet, props, gestes: () => gestes };
}

describe('D2 CARNET-COEUR : de zéro, magasin mémoire vide, IA simulée', () => {
  it('embouteillage, deux façons, le critère, 6 liens, une note ; comparer ; puis frigo, ventilation, évier ; au plus 2 gestes par ajout', async () => {
    const m = monter([]);
    const ajouts: number[] = [];
    ajouts.push(await m.envoyer('embouteillage'));
    const e = () => m.carnet(/embouteillage/i);
    expect(e()).toBeTruthy();
    expect(e().carnet.phrase).toBe('embouteillage');
    ajouts.push(await m.envoyer('système isobarique'));
    ajouts.push(await m.envoyer('système par gravité'));
    ajouts.push(await m.envoyer('il faut minimiser l’oxygène'));
    expect(e().carnet.criteres.some(k => /oxyg/i.test(k.texte))).toBe(true);
    for (let i = 1; i <= 6; i++) ajouts.push(await m.envoyer(`https://vendeur-${i}.ch/isobarique-${i}-becs`));
    expect(e().carnet.articles.length).toBe(6);
    ajouts.push(await m.envoyer('penser à demander le SAV suisse'));
    const d = e().carnet;
    expect(d.notes.length + d.facons.length + d.criteres.length).toBeGreaterThanOrEqual(3);
    /* chaque message est gardé tel quel (le fil, R25) */
    const textes = m.magasin.lire().filter(i => i.type === 'carnet-message').map(i => i.title);
    expect(textes).toContain('système isobarique');
    expect(textes).toContain('penser à demander le SAV suisse');
    expect(Math.max(...ajouts)).toBeLessThanOrEqual(2);
    /* Comparer : le tableau existe dès le 2e article (R26) */
    expect(e().status).toBe('research');
    m.vue.unmount();
    const m2 = { ...m, ...monterSur(m.magasin) };
    for (const phrase of ['frigo de garde pour fûts à 2 °C', 'ventilation de la salle de brassage contre la buée', 'évier inox 2 bacs']) {
      expect(await m2.envoyer(phrase)).toBeLessThanOrEqual(2);
    }
    const noms = (re: RegExp) => (lireCarnets(m.magasin.lire()).find(c => re.test(c.title))?.carnet.criteres ?? []).map(k => k.caracteristique?.nom ?? k.texte);
    expect(lireCarnets(m.magasin.lire()).length).toBeGreaterThanOrEqual(4);
    expect(noms(/frigo/i).join()).not.toBe(noms(/ventil/i).join());
    expect(run).not.toHaveBeenCalled();
  });
});

function monterSur(magasin: ReturnType<typeof magasinMemoire>) {
  render(<CarnetsVue magasin={magasin} finances={vides()} mode="simule" appels={appelsSimules('normal', 0)} aides={AIDES} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  return {
    envoyer: async (texte: string) => {
      fireEvent.change(champ(), { target: { value: texte } });
      await act(async () => { fireEvent.submit(champ().closest('form')!); });
      await act(async () => { await new Promise(r => setTimeout(r, 20)); });
      return 1;
    }
  };
}

describe('D3 et D7 : sortie vers À venir, liens, Suppression v2', () => {
  it('pastille « À venir · … » sur le Frigo envoyé (R47), et un seul plan par idée (clé idempotente)', async () => {
    const m = monter(fixtureCarnets(), { plans: fixturePlans(), transactions: [], payments: [] });
    const vue = render(<CarnetsVue {...m.props} ouvrir={{ id: ID_FRIGO, at: 1 }} />);
    expect(within(vue.container).getAllByText(/À venir · /).length).toBeGreaterThan(0);
  });

  it('Suppression v2 : « 1 lien le retient », « Garder le plan sans ce carnet », puis Supprimer s’allume ; le plan n’est jamais écrit', async () => {
    const m = monter(fixtureCarnets(), { plans: fixturePlans(), transactions: [], payments: [] });
    const vue = render(<CarnetsVue {...m.props} ouvrir={{ id: ID_FRIGO, at: 1 }} />);
    /* le menu ··· de l'idée ouverte, puis « Supprimer l'idée » (R23) */
    await m.toucher(within(vue.container).getByRole('button', { name: 'Plus' }));
    await m.toucher(within(vue.container).getByRole('menuitem', { name: /Supprimer/ }));
    expect(within(vue.container).getByText(/1 lien le retient/)).toBeTruthy();
    const supprimer = () => within(vue.container).getAllByRole('button', { name: /^Supprimer/ }).pop() as HTMLButtonElement;
    expect(supprimer().disabled).toBe(true);
    await m.toucher(within(vue.container).getByRole('button', { name: /Garder le plan sans ce carnet/ }));
    expect(supprimer().disabled).toBe(false);
    await m.toucher(supprimer());
    expect(lireCarnets(m.magasin.lire()).some(c => c.id === ID_FRIGO)).toBe(false);
    expect(m.magasin.ecritures.every(w => w.op === 'remove' || w.doc.type === 'carnet' || w.doc.type === 'carnet-message')).toBe(true);
    expect(m.plans).toHaveLength(0);
  });

  it('plan réalisé (dépense payée) : « Archiver » seul ; l’idée quitte la liste et se rouvre par son id (Réalisés › Ouvrir le carnet)', async () => {
    const r = fixturePlanRealise();
    const m = monter(r.items, { plans: r.plans, transactions: r.transactions, payments: r.payments });
    const vue = render(<CarnetsVue {...m.props} ouvrir={{ id: ID_EMBOUTEILLAGE, at: 1 }} />);
    /* le menu ··· de l'idée ouverte, puis « Supprimer l'idée » (R23) */
    await m.toucher(within(vue.container).getByRole('button', { name: 'Plus' }));
    await m.toucher(within(vue.container).getByRole('menuitem', { name: /Supprimer/ }));
    expect(within(vue.container).queryByText(/Garder le plan sans ce carnet/)).toBeNull();
    await m.toucher(within(vue.container).getByRole('button', { name: /Archiver/ }));
    expect(lireCarnets(m.magasin.lire()).some(c => c.id === ID_EMBOUTEILLAGE)).toBe(false);
    expect(lireCarnets(m.magasin.lire(), { archives: true }).find(c => c.id === ID_EMBOUTEILLAGE)?.carnet.sortie).toBeTruthy();
    vue.rerender(<CarnetsVue {...m.props} ouvrir={{ id: ID_EMBOUTEILLAGE, at: 2 }} />);
    expect(vue.container.querySelector('[data-vue="carnet"]')).not.toBeNull();
  });

  it('G8 au banc : la fixture Ventilation montre la bulle « peut trancher » (calcul local, R44)', async () => {
    const m = monter(fixtureCarnets());
    const vue = render(<CarnetsVue {...m.props} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await act(async () => { (vue.container.querySelector('.cn-champ textarea') as HTMLTextAreaElement).focus(); });
    expect(vue.container.textContent).toMatch(/peut trancher/);
  });

  it('aides : au banc toutes vraies ; éteintes comme en production sans VITE_CARNET_AIDES', () => {
    expect(Object.values(AIDES).every(Boolean)).toBe(true);
    expect(Object.values(ETEINTES).some(Boolean)).toBe(false);
  });
});

describe('D4 et R28 : le + sur Carnets', () => {
  it('Stocks › Matériel › Carnets porte « Nouvelle idée » en action, sans porte en double', () => {
    const menu = plusMenuFor('stocks', 'carnets' as never, {});
    expect(menu.chemin).toBe('Stocks › Matériel › Carnets');
    expect(menu.action?.label).toBe('Nouvelle idée');
    expect(menu.autres).toHaveLength(0);
    expect(menu.partout.map(e => e.label)).not.toContain('Nouvelle idée');
  });
});

describe('D9 (R48) : l’idée du calendrier arrive au carnet', () => {
  it('« ZZ TEST — doseur de sucre » en S47 : un carnet de plus, aucun recipe-idea ; Carnets le montre en état Idée, sa phrase en titre', () => {
    const r = enregistrementIdee('ZZ TEST — doseur de sucre', '2026-11-18', { nouvelId: p => `${p}-S47` });
    expect(r.ok).toBe(true);
    const doc = (r.ok ? r.enregistrement.document : null) as unknown as CreativeItem;
    expect(doc.type).toBe('carnet');
    expect(doc.date).toBe('2026-11-16');
    const m = monter([doc]);
    expect(m.magasin.lire().filter(i => i.type === 'recipe-idea')).toHaveLength(0);
    expect(m.vue.container.textContent).toMatch(/doseur de sucre/);
    expect(m.vue.container.textContent).toMatch(/Idée/);
    const appui = enregistrementIdee('ZZ TEST — doseur de sucre', '2026-11-25', {});
    expect(appui.ok && (appui.enregistrement.document as { date?: string }).date).toBe('2026-11-23');
  });
});
