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
    /* tour 3, PCN-155 : les 6 pages de vendeur-N.ch sont illisibles (rien d'inventé) : l'idée reste Idée. Un lien lu ensuite la passe
       en À comparer : le statut suit la lecture (remplacerRangement → poser → statutApres). */
    expect(e().carnet.articles.every(a => a.lecture !== 'lue')).toBe(true);
    expect(e().status).toBe('idea');
    await m.envoyer('https://exemple.invalid/zz-test-isobarique-7-becs');
    expect(e().carnet.articles.some(a => a.lecture === 'lue')).toBe(true);
    expect(e().status).toBe('research');
    m.vue.unmount();
    const m2 = { ...m, ...monterSur(m.magasin) };
    /* Critique 5, n° 3 : écrit dans un carnet ouvert, une phrase va dans ce carnet (ou celui que le cadre nomme), jamais dans un carnet
       neuf dans son dos ; une idée neuve se crée depuis la liste. D-63 : chaque idée part donc de la liste (‹ Carnets, 1 geste, puis
       l'envoi : 2 gestes par ajout). */
    for (const phrase of ['frigo de garde pour fûts à 2 °C', 'ventilation de la salle de brassage contre la buée', 'évier inox 2 bacs']) {
      const retour = document.querySelector('.cn-retour') as HTMLElement | null;
      let g = 0;
      if (retour) { await act(async () => { fireEvent.click(retour); }); g += 1; }
      g += await m2.envoyer(phrase);
      expect(g).toBeLessThanOrEqual(2);
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

  it('G8 au banc : la fixture Ventilation se tait par défaut ; avec l’option g8 (`&g8=1`, critique 5 n° 21), elle montre la bulle « peut trancher » (calcul local, R44)', async () => {
    const defaut = monter(fixtureCarnets());
    const v0 = render(<CarnetsVue {...defaut.props} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await act(async () => { (v0.container.querySelector('.cn-champ textarea') as HTMLTextAreaElement).focus(); });
    expect(v0.container.textContent).not.toMatch(/peut trancher/);
    v0.unmount();
    const m = monter(fixtureCarnets({ g8: true }));
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

/** Un écran seul, ses appels IA au choix ; frappe et envoi dans son propre conteneur. */
function ecran(items: CreativeItem[], appels = appelsSimules('normal', 0), finances: FinancesCarnet = vides(), ouvrir?: string) {
  const magasin = magasinMemoire(items);
  const vue = render(<CarnetsVue magasin={magasin} finances={finances} mode="simule" appels={appels} aides={AIDES} {...(ouvrir ? { ouvrir: { id: ouvrir, at: 1 } } : {})} />);
  const champ = () => vue.container.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const taperEtEnvoyer = async (texte: string) => {
    fireEvent.change(champ(), { target: { value: texte } });
    await act(async () => { fireEvent.submit(champ().closest('form')!); });
  };
  const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
  const bandeau = () => vue.container.querySelector('.cn-bandeau[role="status"]');
  return { magasin, vue, taperEtEnvoyer, attendre, bandeau, carnets: () => lireCarnets(magasin.lire(), { archives: true }) };
}

describe('P1, P2, P3 (vision 1) : le bandeau suit le rangement final ; un lien seul ne devient jamais le titre', () => {
  it('lien collé depuis la liste, rangé par l’IA dans Ventilation : « Rangé dans Ventilation », le lien cité ; jamais « Carnet créé » ; Annuler défait le rangement réel', async () => {
    const e = ecran(fixtureCarnets(), appelsSimules('normal', 60));
    const ventil = () => e.carnets().find(c => c.id === ID_VENTILATION)!.carnet.articles.length;
    const avant = { articles: ventil(), carnets: e.carnets().length };
    const url = 'https://brewshop.invalid/hotte-inox-120';
    await e.taperEtEnvoyer(url);
    /* pendant : le carnet neuf porte le domaine, jamais l'URL brute ; aucun « Carnet créé » annoncé avant la fin */
    expect(e.carnets().some(c => c.title === url)).toBe(false);
    expect(e.vue.container.querySelector('.cn-titre')?.textContent).toBe('brewshop.invalid');
    expect(e.vue.container.textContent).not.toMatch(/Carnet créé/);
    await e.attendre(400);
    expect(ventil()).toBe(avant.articles + 1);
    expect(e.carnets().length).toBe(avant.carnets);
    expect(e.vue.container.querySelector('[data-vue="liste"]')).not.toBeNull();
    const b = e.bandeau()!;
    expect(b.getAttribute('data-sorte')).toBe('ailleurs');
    /* décision du pilote (critique 6) : le titre stocké, « ZZ TEST — » compris */
    expect(b.textContent).toMatch(/Rangé dans (ZZ TEST — )?Ventilation de la salle de brassage, à l'instant/);
    expect(b.textContent).toContain(url);
    expect(b.textContent).not.toMatch(/Carnet créé|votre phrase en titre/);
    expect(e.vue.container.querySelector('[aria-label="Carnet créé"]')).toBeNull();
    await act(async () => { fireEvent.click(within(b as HTMLElement).getByRole('button', { name: /Annuler/ })); });
    expect(ventil()).toBe(avant.articles);
    expect(e.carnets().length).toBe(avant.carnets);
    expect(e.magasin.lire().some(i => i.type === 'carnet-message' && i.title === url)).toBe(false);
  });

  it('une phrase depuis la liste que l’IA range dans le Frigo existant : le rangement de l’IA fait foi (D383, remplace corr2 m390-1 et P2) : pas de carnet neuf, « Rangé dans … Frigo », Annuler rend le Frigo d’avant', async () => {
    const e = ecran(fixtureCarnets());
    const avant = e.carnets().length;
    const frigo = JSON.stringify(e.carnets().find(c => c.id === ID_FRIGO));
    await e.taperEtEnvoyer('chambre froide pour garder 6 fûts');
    await e.attendre(40);
    /* l'IA simulée range deux critères dans le Frigo : le carnet neuf local, annoncé en attendant, disparaît */
    expect(e.carnets().length).toBe(avant);
    expect(JSON.stringify(e.carnets().find(c => c.id === ID_FRIGO))).not.toBe(frigo);
    expect(e.carnets().find(c => c.id === ID_FRIGO)!.carnet.criteres.some(k => /6 fûts/.test(k.texte))).toBe(true);
    expect(e.bandeau()?.getAttribute('data-sorte')).toBe('ailleurs');
    expect(e.bandeau()?.textContent).toMatch(/Rangé dans (ZZ TEST — )?Frigo/);
    expect(e.vue.container.textContent).not.toMatch(/Carnet créé/);
    await act(async () => { fireEvent.click(within(e.bandeau() as HTMLElement).getByRole('button', { name: /Annuler/ })); });
    expect(e.carnets().length).toBe(avant);
    expect(JSON.stringify(e.carnets().find(c => c.id === ID_FRIGO))).toBe(frigo);
  });

  it('la même phrase, IA en panne (hors ligne) : l’aperçu local reste, un carnet neuf « Carnet créé », le Frigo intact (D383)', async () => {
    const e = ecran(fixtureCarnets(), appelsSimules('echec', 0));
    const avant = e.carnets().length;
    const frigo = JSON.stringify(e.carnets().find(c => c.id === ID_FRIGO));
    await e.taperEtEnvoyer('chambre froide pour garder 6 fûts');
    await e.attendre(40);
    expect(e.carnets().length).toBe(avant + 1);
    expect(JSON.stringify(e.carnets().find(c => c.id === ID_FRIGO))).toBe(frigo);
    expect(e.bandeau()?.getAttribute('data-sorte')).toBe('cree');
    expect(e.vue.container.textContent).not.toMatch(/Rangé dans Frigo/);
  });

  it('une idée neuve depuis la liste : « ✓ Carnet créé », sa phrase citée « votre phrase en titre », le carnet ouvert (R11, g5:v04-4)', async () => {
    const e = ecran([]);
    await e.taperEtEnvoyer('embouteillage');
    await e.attendre(40);
    const b = e.bandeau()!;
    expect(b.getAttribute('data-sorte')).toBe('cree');
    expect(b.textContent).toMatch(/Carnet créé, en tête des Carnets/);
    expect(b.textContent).toMatch(/« embouteillage » · votre phrase en titre/);
    expect(e.vue.container.querySelector('[data-vue="carnet"]')).not.toBeNull();
    expect(e.carnets()).toHaveLength(1);
  });

  it('lien seul, IA en panne : carnet local au nom du site, « le site en titre », jamais « votre phrase en titre » (P3)', async () => {
    const e = ecran([], appelsSimules('echec', 0));
    const url = 'https://www.exemple.invalid/evier-2-bacs';
    await e.taperEtEnvoyer(url);
    await e.attendre(40);
    expect(e.carnets().map(c => c.title)).toEqual(['exemple.invalid']);
    const b = e.bandeau()!;
    expect(b.getAttribute('data-sorte')).toBe('cree');
    expect(b.textContent).toMatch(/le site en titre/);
    expect(b.textContent).not.toMatch(/votre phrase en titre/);
  });
});

describe('corr2-L1 (vision 2 : d1280-1, m390-1, m390-2, L4-7, d1280-3) : ce que le cadre « pendant » annonce est ce qui arrive après', () => {
  const autres = (e: ReturnType<typeof ecran>, ids: string[]) => JSON.stringify(e.carnets().filter(c => ids.includes(c.id)));
  const IDS = () => fixtureCarnets().filter(d => d.type === 'carnet').map(d => d.id);

  it('liste + phrase sans carnet proche + IA simulée OK : « ✓ Carnet créé », sa phrase en titre (préfixe gardé), un seul carnet neuf, aucun autre modifié', async () => {
    const e = ecran(fixtureCarnets());
    const avant = autres(e, IDS()), n = e.carnets().length;
    const phrase = 'ZZ TEST — doseur de sucre pour la refermentation';
    fireEvent.change(e.vue.container.querySelector('.cn-champ textarea')!, { target: { value: phrase } });
    expect(e.vue.container.textContent).toMatch(/Nouveau carnet/);
    expect(e.vue.container.textContent).not.toMatch(/Déjà un carnet proche/);
    await act(async () => { fireEvent.submit(e.vue.container.querySelector('.cn-champ form, form')!); });
    await e.attendre(40);
    expect(e.carnets()).toHaveLength(n + 1);
    expect(autres(e, IDS())).toBe(avant);
    const neuf = e.carnets().find(c => !IDS().includes(c.id))!;
    expect(neuf.title).toBe(phrase);
    const b = e.bandeau()!;
    expect(b.getAttribute('data-sorte')).toBe('cree');
    expect(b.textContent).toMatch(/Carnet créé, en tête des Carnets/);
    expect(b.textContent).toContain(`« ${phrase} » · votre phrase en titre`);
    expect(within(b as HTMLElement).getByRole('button', { name: /Annuler/ })).toBeTruthy();
    expect(e.vue.container.querySelector('[data-vue="carnet"]')).not.toBeNull();
  });

  it('IA lente (ia=lent) et bulle « Déjà un carnet proche » non touchée : « Carnet créé » pendant l’attente (aperçu) ; après l’IA, son rangement fait foi (Frigo) : « Rangé dans », aucun carnet neuf ; Annuler rend la liste d’avant (D383)', async () => {
    const e = ecran(fixtureCarnets(), appelsSimules('lent', 150));
    const avant = autres(e, IDS()), n = e.carnets().length;
    const phrase = 'ZZ TEST — rangement du frigo, plus de condensation au plafond';
    fireEvent.change(e.vue.container.querySelector('.cn-champ textarea')!, { target: { value: phrase } });
    expect(e.vue.container.textContent).toMatch(/Nouveau carnet/);
    await act(async () => { fireEvent.submit(e.vue.container.querySelector('form')!); });
    // pendant que l'IA tourne : l'aperçu local est déjà là, le carnet ouvert
    expect(e.bandeau()?.getAttribute('data-sorte')).toBe('cree');
    expect(e.vue.container.querySelector('[data-vue="carnet"]')).not.toBeNull();
    expect(e.carnets()).toHaveLength(n + 1);
    await e.attendre(400);
    // après : l'IA range le critère dans le Frigo, le carnet local resté vide a disparu
    expect(e.bandeau()?.getAttribute('data-sorte')).toBe('ailleurs');
    expect(e.bandeau()?.textContent).toMatch(/Rangé dans (ZZ TEST — )?Frigo/);
    expect(e.vue.container.textContent).not.toMatch(/Carnet créé/);
    expect(e.carnets()).toHaveLength(n);
    expect(e.carnets().find(c => c.id === ID_FRIGO)!.carnet.criteres.some(k => /condensation/i.test(k.texte))).toBe(true);
    // Annuler : la liste d'avant
    await act(async () => { fireEvent.click(within(e.bandeau() as HTMLElement).getByRole('button', { name: /Annuler/ })); });
    expect(e.carnets()).toHaveLength(n);
    expect(autres(e, IDS())).toBe(avant);
    expect(e.vue.container.querySelector('[data-vue="liste"]')).not.toBeNull();
    expect(e.magasin.lire().some(i => i.type === 'carnet-message' && i.title === phrase)).toBe(false);
  });

  it('IA lente puis en panne (hors ligne) : le carnet local de l’aperçu reste, « Carnet créé », et Annuler le retire (D383)', async () => {
    const e = ecran(fixtureCarnets(), appelsSimules('echec', 60));
    const avant = autres(e, IDS()), n = e.carnets().length;
    const phrase = 'ZZ TEST — rangement du frigo, plus de condensation au plafond';
    fireEvent.change(e.vue.container.querySelector('.cn-champ textarea')!, { target: { value: phrase } });
    await act(async () => { fireEvent.submit(e.vue.container.querySelector('form')!); });
    await e.attendre(200);
    expect(e.bandeau()?.getAttribute('data-sorte')).toBe('cree');
    expect(e.bandeau()?.textContent).toContain(`« ${phrase} » · votre phrase en titre`);
    expect(e.carnets()).toHaveLength(n + 1);
    expect(autres(e, IDS())).toBe(avant);
    await act(async () => { fireEvent.click(within(e.bandeau() as HTMLElement).getByRole('button', { name: /Annuler/ })); });
    expect(e.carnets()).toHaveLength(n);
    expect(autres(e, IDS())).toBe(avant);
  });

  it('Annuler pendant que l’IA tourne : l’IA est coupée, rien n’est réécrit après', async () => {
    const e = ecran(fixtureCarnets(), appelsSimules('lent', 150));
    const n = e.carnets().length;
    fireEvent.change(e.vue.container.querySelector('.cn-champ textarea')!, { target: { value: 'ZZ TEST — doseur de sucre' } });
    await act(async () => { fireEvent.submit(e.vue.container.querySelector('form')!); });
    await act(async () => { fireEvent.click(within(e.bandeau() as HTMLElement).getByRole('button', { name: /Annuler/ })); });
    await e.attendre(400);
    expect(e.carnets()).toHaveLength(n);
    expect(e.bandeau()).toBeNull();
  });

  it('note en vrac de 3 lignes : les effets sont dans les cibles annoncées ; compteur pendant = compteur après ; une ligne ne dit jamais son titre deux fois ; Annuler défait tout', async () => {
    const e = ecran(fixtureCarnets());
    const avant = autres(e, IDS()), n = e.carnets().length;
    const note = 'ZZ TEST — 2 bacs pour laver les fûts ; ZZ TEST — ajouter le sel ; ZZ TEST — prochain brassage jeudi';
    fireEvent.change(e.vue.container.querySelector('.cn-champ textarea')!, { target: { value: note } });
    const lire = () => [...e.vue.container.querySelectorAll('.cn-vrac-ligne')].map(li => ({
      texte: li.querySelector('.cn-sp > p')!.textContent!, cible: (li.querySelector('.cn-sp > p.cn-mut') ?? li.querySelector('.cn-sp > label.cn-puce > span'))!.textContent!.replace(' · aucun carnet proche', '')
    }));
    const tete = e.vue.container.querySelector('.cn-vrac .cn-cadre-tete')!.textContent!;
    const mPendant = Number(/(\d+) carnets?/.exec(tete)![1]);
    expect(tete).toMatch(/3 lignes/);
    const pendant = lire();
    expect(pendant).toHaveLength(3);
    for (const l of pendant) expect(l.cible.replace(/^→ /, '')).not.toBe(l.texte.replace(/^ZZ TEST — /, ''));
    await act(async () => { fireEvent.submit(e.vue.container.querySelector('form')!); });
    await e.attendre(40);
    const b = e.bandeau()!;
    expect(b.getAttribute('data-sorte')).toBe('vrac');
    expect(b.textContent).toContain(`3 lignes rangées dans ${mPendant} carnet${mPendant > 1 ? 's' : ''}`);
    expect(e.vue.container.querySelector('.cn-vrac-apres details.cn-origine')?.textContent).toContain(note);
    const apres = lire();
    /* critique 6, n° 1 (g5:v01-16) : après, la puce dit le carnet seul ; pendant, « → Nouveau carnet « X » » ou « → Nouveau carnet » (titré
       par la ligne même). On compare le carnet nommé, marque du banc retirée. */
    const sansBanc = (t: string) => t.replace(/^ZZ TEST — /, '');
    const nomme = (l: { texte: string; cible: string }) => {
      const c = l.cible.replace(/^→ /, '');
      const m = /^Nouveau carnet « (.*) »$/.exec(c);
      return sansBanc(m ? m[1] : c === 'Nouveau carnet' ? l.texte : c);
    };
    expect(apres.map(l => sansBanc(l.cible)).sort()).toEqual(pendant.map(nomme).sort());
    // dans le magasin : chaque ligne là où le cadre l'a dite
    const msg = e.magasin.lire().find(i => i.type === 'carnet-message' && i.title === note) as unknown as { carnetMessage: { effets: { carnetId: string; cible: string }[] } };
    const cibles = new Set(msg.carnetMessage.effets.filter(x => x.cible !== 'carnet').map(x => x.carnetId));
    expect(cibles.size).toBe(mPendant);
    const evier = e.carnets().find(c => c.id === 'ZZ-CARNET-EVIER')!;
    /* critique 8, n° 3 (décision du pilote a) : « 2 bacs » est une exigence, annoncée critère pendant ; rangée en note ou en critère selon
       ce que le cadre a annoncé, jamais perdue */
    if (pendant.some(l => /Évier/.test(l.cible))) expect([...evier.carnet.notes.map(x => x.texte), ...evier.carnet.criteres.map(x => x.texte)].some(x => /2 bacs/.test(x))).toBe(true);
    /* critique 6, n° 1 : un carnet neuf par objet ; on compte les carnets neufs annoncés */
    expect(e.carnets()).toHaveLength(n + new Set(pendant.filter(l => /Nouveau carnet/.test(l.cible)).map(l => l.cible)).size);
    await act(async () => { fireEvent.click(within(b as HTMLElement).getByRole('button', { name: /Annuler/ })); });
    expect(e.carnets()).toHaveLength(n);
    expect(autres(e, IDS())).toBe(avant);
  });

  it('d1280-3 : un lien seul collé depuis la liste qui ouvre un carnet prend le nom lu sur la page ; page illisible : son domaine', async () => {
    const e = ecran([], appelsSimules('normal', 60));
    await e.taperEtEnvoyer('https://exemple.invalid/plaque-froid/echangeur-30');
    /* pendant : le domaine en titre, le lien en clair dans le cadre (g5:v03-10) */
    expect(e.vue.container.querySelector('.cn-titre')?.textContent).toBe('exemple.invalid');
    expect(e.vue.container.textContent).toContain('exemple.invalid/plaque-froid/echangeur');
    await e.attendre(400);
    expect(e.carnets().map(c => c.title)).toEqual(['Échangeur à plaques 30 plaques']);
    expect(e.bandeau()?.textContent).toMatch(/le nom lu sur la page en titre/);
    cleanup();
    const f = ecran([]);
    await f.taperEtEnvoyer('https://inconnu.invalid/x');
    await f.attendre(40);
    expect(f.carnets().map(c => c.title)).toEqual(['inconnu.invalid']);
  });
});

describe('P9 (vision 1, m390 état 36) : la confirmation de suppression est à l’écran, sous le titre, avec le focus', () => {
  it('la carte prend la place du bandeau, avant Ce qui compte ; elle reçoit le focus et défile dans la vue ; le reste est estompé', async () => {
    const defile = vi.fn();
    const proto = HTMLElement.prototype as unknown as { scrollIntoView?: (o?: unknown) => void };
    const ancien = proto.scrollIntoView;
    proto.scrollIntoView = defile;
    try {
      const m = monter(fixtureCarnets(), { plans: fixturePlans(), transactions: [], payments: [] });
      const vue = render(<CarnetsVue {...m.props} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
      await m.toucher(within(vue.container).getByRole('button', { name: 'Plus' }));
      await m.toucher(within(vue.container).getByRole('menuitem', { name: /Supprimer/ }));
      const carte = vue.container.querySelector('.cn-supprimer') as HTMLElement;
      expect(carte).not.toBeNull();
      const page = vue.container.querySelector('article.cn-ouvert') as HTMLElement;
      expect(carte.parentElement).toBe(page);
      expect(page.classList.contains('cn-grise')).toBe(true);
      const enfants = [...page.children];
      const titre = enfants.findIndex(x => x.classList.contains('cn-titre-ligne'));
      const iCarte = enfants.indexOf(carte);
      /* critique 5 (h05-3) : « Ce qui compte » est une ligne « Critère : … » ; sa section porte ce nom accessible */
      const iCompte = enfants.findIndex(x => x.matches('.cn-critere-bloc, [aria-label="Ce qui compte"]') || x.querySelector('.cn-critere-bloc') !== null);
      expect(titre).toBeGreaterThanOrEqual(0);
      expect(iCarte).toBeGreaterThan(titre);
      expect(iCarte).toBeLessThan(iCompte);
      expect(document.activeElement).toBe(carte);
      expect(defile).toHaveBeenCalled();
      expect(within(carte).getByRole('button', { name: 'Garder' })).toBeTruthy();
    } finally {
      proto.scrollIntoView = ancien;
    }
  });
});

/* Critique 5, lot D, corrections 10 et 11 : décisions du pilote, jouées de bout en bout sur le banc (BancCarnets, fixture, IA simulée). */
describe('Critique 5 · 10 : « Garder à part » branché de bout en bout', () => {
  it('toucher la puce retire la proposition ; l’envoi écrit garderAPart ; la note reste séparée ; la même phrase ne repropose pas la fusion', async () => {
    const proto = Element.prototype as unknown as { scrollIntoView?: () => void };
    const ancien = proto.scrollIntoView;
    proto.scrollIntoView = () => {};
    try {
      const { PHRASE_DOUBLON } = await import('../../src/domain/carnets/fixture');
      const { lireMessages } = await import('../../src/domain/carnets/modele');
      const e = ecran(fixtureCarnets(), appelsSimules('normal', 20), vides(), ID_VENTILATION);
      const ventil = () => e.carnets().find(c => c.id === ID_VENTILATION)!;
      const n0 = ventil().carnet.notes.length;
      const champ = () => e.vue.container.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
      fireEvent.change(champ(), { target: { value: PHRASE_DOUBLON } });
      expect(e.vue.container.textContent).toContain('elles seront fusionnées');
      fireEvent.click(within(e.vue.container).getByRole('button', { name: 'Garder à part' }));
      expect(e.vue.container.textContent).not.toContain('elles seront fusionnées');
      await act(async () => { fireEvent.submit(champ().closest('form')!); });
      await e.attendre(150);
      const msg = lireMessages(e.magasin.lire()).find(m => m.carnetMessage.texte === PHRASE_DOUBLON)!;
      expect(msg.carnetMessage.gardeAPart).toBe(true);
      expect(ventil().carnet.notes.length).toBe(n0 + 1);
      expect(ventil().carnet.notes.some(n => (n.fusionDe ?? []).length > 0)).toBe(false);
      /* la même phrase, de nouveau : aucune proposition de fusion, et rien n'est fusionné en douce */
      fireEvent.change(champ(), { target: { value: PHRASE_DOUBLON } });
      expect(e.vue.container.textContent).not.toContain('elles seront fusionnées');
      expect(within(e.vue.container).queryByRole('button', { name: 'Garder à part' })).toBeNull();
      await act(async () => { fireEvent.submit(champ().closest('form')!); });
      await e.attendre(150);
      expect(ventil().carnet.notes.length).toBe(n0 + 2);
      expect(ventil().carnet.notes.some(n => (n.fusionDe ?? []).length > 0)).toBe(false);
    } finally {
      proto.scrollIntoView = ancien;
    }
  });
});

describe('Critique 5 · 11 : « Note supprimée » disparaît après Annuler', () => {
  it('··· › Supprimer : « Note supprimée · Annuler » à sa place ; Annuler : la note revient et plus aucun bandeau de cette suppression', async () => {
    const proto = Element.prototype as unknown as { scrollIntoView?: () => void };
    const ancien = proto.scrollIntoView;
    proto.scrollIntoView = () => {};
    try {
      const e = ecran(fixtureCarnets(), appelsSimules('normal', 0), vides(), ID_VENTILATION);
      const ventil = () => e.carnets().find(c => c.id === ID_VENTILATION)!;
      const note = ventil().carnet.notes[0];
      fireEvent.click(within(e.vue.container).getByRole('button', { name: `Note : ${note.texte}, actions` }));
      fireEvent.click(within(e.vue.container).getByRole('menuitem', { name: /Supprimer/ }));
      expect(ventil().carnet.notes.some(n => n.id === note.id)).toBe(false);
      const b = e.vue.container.querySelector('.cn-bandeau[data-sorte="note-supprimee"]')!;
      expect(b).not.toBeNull();
      fireEvent.click(within(b as HTMLElement).getByRole('button', { name: /Annuler/ }));
      await e.attendre(20);
      expect(ventil().carnet.notes.some(n => n.id === note.id)).toBe(true);
      expect(e.vue.container.querySelector('.cn-bandeau[data-sorte="note-supprimee"]')).toBeNull();
      expect(e.vue.container.textContent).not.toMatch(/Note supprimée/);
      await e.attendre(20);
      expect(e.vue.container.querySelector('.cn-bandeau[data-sorte="note-supprimee"]')).toBeNull();
    } finally {
      proto.scrollIntoView = ancien;
    }
  });
});
