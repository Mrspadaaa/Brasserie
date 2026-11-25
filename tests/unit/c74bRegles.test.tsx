// @vitest-environment jsdom
/**
 * Voie c74b-tests (25.11) : les tests ROUGES des règles R92 à R97, tirées de ses plaintes du 25.11 matin et des constats de reel-73 et critique-73 (work/missions/2026-11-23-reprise-soir/voies/c74b-tests/DOSSIER.md ;
 * DEFAUTS-RECURRENTS § CHAMP-CARNET-REPLIE, CARNET-SES-DONNEES-EXISTANTES, NOTE-PAS-ARTICLE ; captures plaintes/2026-11-25-*.jpg). Écrits depuis les RÈGLES, avant tout correctif : celui qui corrige n'écrit pas le test (L17).
 * Données : tests/fixtures/c74b/anciens.ts, des carnets à la FORME de ses vieux carnets (articles sans conditionnement ni offres, fil en messages `brut`, import du Planning par `carnetDeTache`), jamais seulement des carnets neufs (L28).
 * Par le composant (CarnetsVue monté, un geste réel). Aucun réseau, aucun Gemini (AiClient jette s'il est appelé). Limites : jsdom ne mesure aucune boîte ; R92 lit les VRAIES feuilles de style (`getComputedStyle`, règles hors @media)
 * et un modèle de hauteur (Tailwind : border-box) ; le rendu à 390 px reste à voir en ligne.
 *
 *  - R92 : le champ « Ajouter à … » au repos est une ligne (≤ 44 px) ; texte, photo et micro actifs d'un seul toucher ; il grandit avec le texte et redevient une ligne vide.
 *  - R93 : un article lu avant les correctifs : CHF/kg recalculé (73,80) ou « à relire », jamais « ? » ; un rang sans base n'est pas « 1 » ; Choisir sur un prix au gramme ne part jamais à « 0,10 CHF ».
 *  - R94 : α sans chasse fixe espacée (« 10–15 % ») ; pas de bloc Offre vide (l'étage de gestes ne se loge pas sous une ligne vide) ; une valeur dite une fois par écran ; Choisir de Chambre froide tient sur un écran.
 *  - R95 : un lien du fil est un lien court (domaine + titre), jamais l'adresse brute (gclid, utm) ; un fil ancien en bulles brutes est rangé à l'ouverture par l'analyse LOCALE sans rien écrire ; le titre n'est pas redit en 1re bulle.
 *  - R96 : une note qui cite un montant reste une note ; un constat n'est jamais un Critère ; « Résolu » écrit propose le Résolu ; un budget du Planning n'est pas un Critère ; Quand = la date du Planning, partout ; « prix ? » jamais si le budget est connu.
 *  - R97 : C73-1 « semaine du 14 décembre » garde sa date ; C73-2 une piste seule garde son prix ; C73-3 « essayé » ne dit que les options écartées ; C73-4 une phrase, une seule trace du constat ; C73-5 repli local : « Balance neuve », 140 CHF, jeton piste ;
 *    C73-6 le bandeau hors ligne se retire au retour en ligne.
 * Normalisation : le texte lu ET l'attendu passent par `sans` (NFKC, espaces insécables réunis, apostrophes droites, accents et casse ôtés).
 */
import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { analyserLigne } from '../../src/domain/carnets/analyseLocale';
import { echeanceDite } from '../../src/domain/carnets/tacheDatee';
import { changerOption, resoudre, retenirOption } from '../../src/domain/carnets/suivi';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { AFaire } from '../../src/ui/carnets/AFaire';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { ficheResolu } from '../../src/ui/carnets/filRegles';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';
import * as F from '../fixtures/c74b/anciens';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: true, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); document.head.querySelectorAll('style[data-c74b]').forEach(s => s.remove()); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof appliquerEcritures>[0][number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
/** Le texte vu : sans les parties cachées au regard (`.cn-cache`), sans le contenu des champs. */
const vu = (e: Element): string => { const c = e.cloneNode(true) as Element; c.querySelectorAll('.cn-cache, textarea, input, script, style').forEach(n => n.remove()); return lu(c); };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };
const reponseIA = (lignes: Array<Record<string, unknown>>): AppelsIA => ({ async ranger() { return { ok: true, data: { lignes } }; }, async lire() { throw new Error('aucun lien dans ces phrases'); } });

interface Montage { appels?: AppelsIA; ouvrir?: string; horsLigne?: boolean; ecrire?: (p: FinancialPlan) => void }
function monter(items: Item[], o: Montage = {}) {
  const magasin = magasinMemoire(items as never[]);
  const vue = (hl: boolean) => (
    <CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={o.appels ?? horsLigne} aides={aidesCarnet('simule' as never, {})}
      maintenant={MAINT} ecrirePlan={((p: FinancialPlan) => o.ecrire?.(p)) as never} {...(hl ? { horsLigne: true } : {})} {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} />
  );
  const r = render(vue(!!o.horsLigne));
  return { magasin, ...r, enLigne: () => r.rerender(vue(false)) };
}
const carnetDe = (m: { magasin: ReturnType<typeof magasinMemoire> }, id: string): CarnetDoc => lireCarnets(m.magasin.lire() as never, { archives: true }).find(c => c.id === id)!;
async function taper(phrase: string) {
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: phrase } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(600);
}
const rangs = () => [...document.querySelectorAll('button.cn-tab-ligne')] as HTMLElement[];
const ligneDe = (re: RegExp) => rangs().find(l => re.test(sans(lu(l))))!;
const celluleKg = (l: Element) => { const cs = [...l.querySelectorAll('[role="cell"][data-col]')]; return lu(cs[cs.length - 1]); };
const celluleAlpha = (l: Element) => lu(l.querySelector('[role="cell"][data-col="0"]'));
/** Ouvre la fiche d'un article du tableau (un toucher sur sa ligne). */
async function ouvrirFiche(re: RegExp) { fireEvent.click(ligneDe(re)); await attendre(40); }
async function ouvrirChoisir() {
  const b = [...document.querySelectorAll('button')].find(x => /^choisir/i.test(lu(x)));
  expect(b, 'le bouton « Choisir » de la fiche').toBeTruthy();
  fireEvent.click(b!);
  await attendre(40);
  return document.querySelector('.cn-choisir') as HTMLElement;
}
const BRAU = /citra 13/;
const MOTLER = /citra® \(us\)|citra\(r\) \(us\)|motler|pellets exemple/;
/** Une espace de chaque côté d'un tiret entre deux nombres (« 10 - 15 », « 10 % - 15 % ») : la chasse fixe espacée de la plainte. */
const FOURCHETTE_ESPACEE = /\d\s*%?\s+[-–]\s+\d/;

function feuillesReelles(): void {
  const st = document.createElement('style');
  st.setAttribute('data-c74b', '');
  st.textContent = ['carnets.css', 'carnets-fil.css', 'carnets-liste.css', 'carnets-decider.css', 'fiche-article.css'].map(f => readFileSync(`src/ui/carnets/${f}`, 'utf8')).join('\n');
  document.head.appendChild(st);
}
/** La bordure DÉCLARÉE de `.cn-champ` dans la feuille réelle (jsdom lit mal le raccourci `border: 1.5px solid var(…)`). */
function bordureDeclaree(): number {
  let largeur = 0;
  postcss.parse(readFileSync('src/ui/carnets/carnets.css', 'utf8')).walkRules(r => { if (r.selector === '.cn-champ') r.walkDecls('border', d => { largeur = parseFloat(d.value) || 0; }); });
  return largeur;
}
const px = (v: string | undefined): number => { const n = parseFloat(v ?? ''); return Number.isFinite(n) ? n : NaN; };

/* =========================================================================================================== R92 : le champ replié */

/**
 * R92 (CHAMP-CARNET-REPLIE) : « Le chat tout le temps ouvert, ça peut juste être un mini champs text qui se déplie avec les 2 actionnable tout le temps actifs ??? » ; « Le champs text aussi toujours actif, je veux pas + d'action pour écrire ».
 * Défaut relevé : le champ « Ajouter à … » et son entourage font ≈ 70 px en permanence. Règle : au repos une ligne ≤ 44 px ; texte, photo, micro actifs d'un toucher ; il grandit avec le texte ; vide, il redevient une ligne.
 */
function Champ({ depart = '' }: { depart?: string }) {
  const [t, setT] = useState(depart);
  return <div data-carnets="true"><ChampCarnet valeur={t} onChange={setT} onEnvoyer={() => setT('')} titreCarnet="ZZ TEST — houblons citra" onPhoto={() => {}} /></div>;
}
/** La hauteur du cadre du champ (la `form.cn-champ`) : max(min-height, contenu + marges intérieures + bordures), border-box (Tailwind). Les feuilles réelles, hors @media. */
function hauteurChamp(form: Element): { total: number; detail: string } {
  const cs = getComputedStyle(form);
  const bordure = bordureDeclaree();
  const pad = px(cs.paddingTop) + px(cs.paddingBottom);
  const enfants = [...form.children].filter(e => !(e as HTMLElement).hidden && e.tagName !== 'INPUT' && e.tagName !== 'LABEL') as HTMLElement[];
  const contenu = Math.max(0, ...enfants.map(e => { const c = getComputedStyle(e); return Math.max(px(c.height) || 0, px(c.minHeight) || 0); }));
  const total = Math.max(px(cs.minHeight) || 0, contenu + pad + 2 * bordure);
  return { total, detail: `min-height ${cs.minHeight}, contenu ${contenu}, marges ${pad}, bordures ${2 * bordure}` };
}
describe('R92 · CHAMP-CARNET-REPLIE : le champ au repos est une ligne, texte photo micro actifs', () => {
  it('au repos, le cadre du champ fait 44 px au plus (le test en ligne : une bande de ≈ 70 px)', () => {
    feuillesReelles();
    const { container } = render(<Champ />);
    const form = container.querySelector('form.cn-champ')!;
    const h = hauteurChamp(form);
    expect(h.total, `hauteur du champ au repos : ${h.total} px (${h.detail})`).toBeLessThanOrEqual(44);
  });
  it('la bande entière (champ + marges de sa zone) ne dépasse pas 60 px au repos : elle ne cache pas le fil', () => {
    feuillesReelles();
    const { container } = render(<Champ />);
    const zone = container.querySelector('.cn-champ-zone')!;
    const z = getComputedStyle(zone);
    const bande = hauteurChamp(container.querySelector('form.cn-champ')!).total + px(z.paddingTop) + px(z.paddingBottom);
    expect(bande, `bande : ${bande} px (marges de la zone ${z.paddingTop} + ${z.paddingBottom})`).toBeLessThanOrEqual(60);
  });
  it('garde : un seul toucher sur le champ suffit pour écrire (zone de texte active, sans bouton « écrire » ni « + » avant)', () => {
    const { container } = render(<Champ />);
    const t = container.querySelector('textarea')!;
    expect(t.disabled || t.readOnly).toBe(false);
    expect(t.getAttribute('rows')).toBe('1');
    fireEvent.focus(t);
    fireEvent.change(t, { target: { value: 'une phrase' } });
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('une phrase');
    expect(container.querySelector('.cn-envoi, .cn-envoi-mot')).toBeTruthy(); /* l'envoi n'apparaît qu'avec du texte */
  });
  it('au repos, la photo et le micro sont là et actifs d\'un toucher (aucun bouton à ouvrir avant)', () => {
    const { container } = render(<Champ />);
    const photo = bouton(/^photo$/, container);
    const micro = bouton(/dicter/, container);
    expect(photo && !photo.disabled, 'photo active').toBe(true);
    expect(micro && !micro.disabled, 'micro actif').toBe(true);
    expect(container.querySelector('.cn-envoi-mot'), 'pas de bouton d\'envoi au repos').toBeNull();
  });
  it('le champ grandit avec le texte : plusieurs lignes, il passe en mode « plein » (hauteur libre), et vide il redevient une ligne', () => {
    feuillesReelles();
    const { container } = render(<Champ />);
    const t = () => container.querySelector('textarea') as HTMLTextAreaElement;
    const repos = hauteurChamp(container.querySelector('form.cn-champ')!).total;
    fireEvent.change(t(), { target: { value: 'ligne un\nligne deux\nligne trois' } });
    const form = container.querySelector('form.cn-champ')!;
    expect(form.className).toMatch(/cn-champ-plein/);
    const cs = getComputedStyle(t());
    expect(cs.height === 'auto' || /content/.test(cs.getPropertyValue('field-sizing')) || /content/.test(`${t().getAttribute('style') ?? ''}`), `le champ plein a une hauteur libre (hauteur ${cs.height})`).toBe(true);
    fireEvent.change(t(), { target: { value: '' } });
    expect(container.querySelector('form.cn-champ')!.className).not.toMatch(/cn-champ-plein/);
    expect(t().getAttribute('style') ?? '', 'aucune hauteur laissée en ligne').not.toMatch(/height/);
    expect(hauteurChamp(container.querySelector('form.cn-champ')!).total, 'redevenu une ligne').toBe(repos);
  });
});

/* =========================================================================================================== R93 : ses données lues avant les correctifs */

describe('R93 · CARNET-SES-DONNEES-EXISTANTES (cause A) : un article ancien montre son CHF/kg recalculé ou « à relire », jamais « ? »', () => {
  beforeEach(() => poserQuantitePour(F.TITRE_CITRA, 1));
  async function citra() { const m = monter([F.citraAncien() as Item], { ouvrir: F.ID_CITRA }); await attendre(80); return m; }

  it('tableau : MotlerHops (3,72 € les 50 g lus dans « Poids ») dit 73,80 CHF/kg (ou « à relire »), pas « ? » (la fiche dit « 50 g · 73,80 CHF/kg »)', async () => {
    await citra();
    const c = celluleKg(ligneDe(MOTLER));
    expect(c, `cellule CHF/kg de MotlerHops : « ${c} »`).not.toBe('?');
    expect(sans(c), `cellule : « ${c} »`).toMatch(/73[,.]8|^74$|relire/);
  });
  it('tableau : Brau (prix « dès 0,10 » sans quantité) ne dit pas « ? » nu : une valeur recalculée ou « à relire »', async () => {
    await citra();
    const c = celluleKg(ligneDe(BRAU));
    expect(c, `cellule CHF/kg de Brau : « ${c} »`).not.toBe('?');
    expect(sans(c), `cellule : « ${c} »`).toMatch(/relire|\d/);
  });
  it('la fiche et le tableau disent la même chose : le CHF/kg de la fiche MotlerHops est celui du tableau', async () => {
    await citra();
    const tab = celluleKg(ligneDe(MOTLER));
    await ouvrirFiche(MOTLER);
    const fiche = lu(document.querySelector('.cn-offres'));
    const m = /(\d[\d  ]*[.,]\d+)\s*CHF\/kg/.exec(fiche);
    expect(m, `la fiche dit son CHF/kg : « ${fiche} »`).toBeTruthy();
    expect(sans(tab), `tableau « ${tab} » ≠ fiche « ${m?.[1]} »`).toContain(sans(m![1]).replace(/\s/g, '').slice(0, 4));
  });
  it('rang : une ligne dont le CHF/kg est inconnu n\'est jamais « 1 » ; le 1er est celui dont la base est connue (MotlerHops, 73,80)', async () => {
    await citra();
    const brau = ligneDe(BRAU), motler = ligneDe(MOTLER);
    expect(brau.querySelector('.cn-rang-1'), 'Brau (sans base) est classé 1er').toBeNull();
    expect(motler.querySelector('.cn-rang-1'), 'MotlerHops (base connue) est 1er').toBeTruthy();
  });
  it('deux houblons sans AUCUNE quantité : aucun n\'est classé « 1 » sur un CHF/kg qui n\'existe pas', async () => {
    poserQuantitePour(F.TITRE_SANS_BASE, 1);
    monter([F.houblonsSansBase() as Item], { ouvrir: F.ID_SANS_BASE });
    await attendre(80);
    const l = rangs();
    expect(l.length).toBe(2);
    expect(l.some(x => x.querySelector('.cn-rang-1')), `un rang « 1 » sans base (cellules CHF/kg : ${l.map(celluleKg).join(' | ')})`).toBe(false);
  });
  it('deux houblons sans AUCUNE quantité : la colonne CHF/kg ne recopie pas le prix du sachet (4,20 · 4,50) : l\'inconnu est « ? » ou « à relire »', async () => {
    poserQuantitePour(F.TITRE_SANS_BASE, 1);
    monter([F.houblonsSansBase() as Item], { ouvrir: F.ID_SANS_BASE });
    await attendre(80);
    const kg = rangs().map(celluleKg);
    expect(kg.every(c => c === '?' || /relire/.test(sans(c))), `cellules CHF/kg : ${kg.join(' | ')} (prix lus : 4,50 et 4,20 CHF, sans quantité)`).toBe(true);
  });
  it('Comparer : la ligne CHF/kg de MotlerHops dit sa valeur (73,80) ou « à relire », jamais « ? »', async () => {
    await citra();
    fireEvent.click([...document.querySelectorAll('button')].find(b => /^comparer$/i.test(lu(b)))!);
    await attendre(40);
    const tetes = [...document.querySelectorAll('thead th')].slice(1).map(x => sans(lu(x)));
    const iM = tetes.findIndex(t => MOTLER.test(t));
    const ligne = [...document.querySelectorAll('tbody tr')].find(tr => /chf\/kg|au kilo|prix/.test(sans(tr.querySelector('th')?.textContent ?? '')));
    expect(ligne, 'une ligne « CHF/kg » dans Comparer').toBeTruthy();
    const cs = [...ligne!.querySelectorAll('td')].map(x => lu(x));
    expect(iM, `colonnes : ${tetes.join(' | ')}`).toBeGreaterThanOrEqual(0);
    expect(cs[iM], `ligne « ${lu(ligne!.querySelector('th'))} » : ${cs.join(' | ')}`).not.toBe('?');
  });
  it('Choisir sur Brau (prix du gramme gardé « 0,10 ») : l\'écran Choisir et sa phrase « Part dans À venir » ne disent jamais 0,10 CHF', async () => {
    await citra();
    await ouvrirFiche(BRAU);
    const phrase = lu([...document.querySelectorAll('button')].find(b => /^choisir/i.test(lu(b)))?.nextElementSibling);
    expect(phrase, `fiche : « ${phrase} »`).not.toMatch(/0[,.]10/);
    const ecran = await ouvrirChoisir();
    expect(lu(ecran), `Choisir : « ${lu(ecran).slice(0, 300)} »`).not.toMatch(/0[,.]10/);
  });
  it('Choisir sur MotlerHops : la carte de Brau (rang 2) ne dit pas « 0,10 » non plus', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    expect(lu(ecran), `Choisir : « ${lu(ecran).slice(0, 400)} »`).not.toMatch(/0[,.]10/);
  });
  it('valider « Choisir chez … » sur Brau n\'envoie pas 0,10 CHF (10 centimes) dans À venir', async () => {
    const plans: FinancialPlan[] = [];
    monter([F.citraAncien() as Item], { ouvrir: F.ID_CITRA, ecrire: p => plans.push(p) });
    await attendre(80);
    await ouvrirFiche(BRAU);
    const ecran = await ouvrirChoisir();
    fireEvent.click(bouton(/^choisir chez/, ecran)!);
    await attendre(80);
    const dernier = plans.at(-1);
    expect(dernier?.amountCents, `plan À venir écrit : ${JSON.stringify(dernier && { amountCents: dernier.amountCents })}`).not.toBe(10);
  });
});

/* =========================================================================================================== R94 : le rendu des valeurs */

describe('R94 · cause B (rendu) : α serré, pas d\'Offre vide, une valeur dite une fois, Choisir qui tient', () => {
  beforeEach(() => poserQuantitePour(F.TITRE_CITRA, 1));
  async function citra() { monter([F.citraAncien() as Item], { ouvrir: F.ID_CITRA }); await attendre(80); }

  it('tableau : l\'α « 10 – 15 » se lit serré, sans espaces autour du tiret ni chasse fixe (« 10  -  15 »)', async () => {
    await citra();
    const cel = ligneDe(MOTLER).querySelector('[role="cell"][data-col="0"]')!;
    expect(lu(cel), `α du tableau : « ${lu(cel)} »`).not.toMatch(FOURCHETTE_ESPACEE);
    expect(sans(lu(cel)), 'écrit « 10–15 »').toMatch(/^10\s?–\s?15$/);
    expect(cel.querySelector('.cn-mono'), 'une fourchette n\'est pas en chasse fixe').toBeNull();
  });
  it('fiche : l\'α de MotlerHops (tête et Caractéristiques) est écrit « 10–15 % », jamais « 10 - 15 % » espacé', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const t = vu(document.body);
    expect(t, `fiche : « ${t.slice(0, 400)} »`).not.toMatch(FOURCHETTE_ESPACEE);
    expect(sans(t)).toMatch(/10\s?–\s?15\s?%/);
  });
  it('Choisir : « Ses autres valeurs » écrit l\'α « 10–15 % », pas « 10 % - 15 % »', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    expect(lu(ecran), `Choisir : « ${lu(ecran).slice(0, 400)} »`).not.toMatch(FOURCHETTE_ESPACEE);
  });
  it('bloc Offre : l\'étage « gestes » (modifier, Ouvrir) ne tombe pas sous une ligne pleine largeur : le corps ne prend pas toute la ligne (≈ 60 px vides, 4 fiches)', async () => {
    feuillesReelles();
    await citra();
    await ouvrirFiche(MOTLER);
    const offre = document.querySelector('.cn-offres .cn-offre')!;
    const corps = offre.querySelector('.cn-offre-corps')!;
    const gestes = offre.querySelector('.cn-offre-gestes');
    expect(gestes, 'les gestes de l\'Offre').toBeTruthy();
    const base = getComputedStyle(corps).flexBasis || getComputedStyle(corps).getPropertyValue('flex');
    expect(`${base} ${getComputedStyle(corps).getPropertyValue('flex')}`, 'le corps de l\'Offre réclame 100 % de la ligne : les gestes passent dessous, avec le vide').not.toMatch(/100%/);
  });
  it('garde-fou (déjà juste en jsdom : la boîte vide de la plainte est une affaire de mise en page, vue en ligne) : aucune partie de l\'Offre n\'est un élément vide', async () => {
    await citra();
    await ouvrirFiche(BRAU);
    const vides = [...document.querySelectorAll('.cn-offres [class*="cn-offre"]')].filter(e => !lu(e) && !e.querySelector('button, a, svg, img, input'));
    expect(vides.map(e => e.className), 'éléments vides dans le bloc Offre').toEqual([]);
  });
  it('une valeur dite une fois par écran : l\'α de Brau (13,6) n\'est pas redit dans « Caractéristiques » après la tête de fiche', async () => {
    await citra();
    await ouvrirFiche(BRAU);
    const t = vu(document.querySelector('.cn-fiche') ?? document.body);
    const fois = (t.match(/13,6/g) ?? []).length;
    expect(fois, `« 13,6 » dit ${fois} fois : « ${t.slice(0, 400)} »`).toBeLessThanOrEqual(1);
  });
  it('une valeur dite une fois par écran : la fiche MotlerHops ne dit pas l\'α deux fois (tête et Caractéristiques)', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const t = vu(document.querySelector('.cn-fiche') ?? document.body);
    const fois = (t.match(/10\s*%?\s*[-–]\s*15/g) ?? []).length;
    expect(fois, `fourchette α dite ${fois} fois : « ${t.slice(0, 400)} »`).toBeLessThanOrEqual(1);
  });
  it('Choisir : le prix de MotlerHops (3,72 €) n\'est pas dit deux fois (la ligne, puis « Prix 3,72 EUR »)', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    const t = lu(ecran.querySelector('.cn-choisir-cadre') ?? ecran);
    const fois = (t.match(/3[,.]72/g) ?? []).length;
    expect(fois, `« 3,72 » dit ${fois} fois : « ${t.slice(0, 500)} »`).toBeLessThanOrEqual(1);
  });
  it('Choisir : le « pourquoi » proposé ne redit pas seulement le vendeur et la dispo déjà dits au-dessus (« En stock, MotlerHops. »)', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    const champ = ecran.querySelector('textarea') as HTMLTextAreaElement | null;
    const pourquoi = sans(champ?.value ?? lu(ecran.querySelector('.cn-pourquoi')));
    expect(pourquoi.length, 'un pourquoi est proposé').toBeGreaterThan(0);
    expect(pourquoi, `pourquoi : « ${pourquoi} »`).not.toMatch(/^en stock,\s*[^.]{0,40}\(?[a-z]{0,3}\)?\.?$/);
  });
  it('Choisir de Chambre froide (20 caractéristiques) tient sur un écran : « Ses autres valeurs » n\'en recopie pas plus de 8 lignes', async () => {
    monter([F.chambreAncienne() as Item], { ouvrir: F.ID_CHAMBRE });
    await attendre(80);
    fireEvent.click(rangs()[0]);
    await attendre(40);
    const ecran = await ouvrirChoisir();
    const lignes = ecran.querySelectorAll('table.cn-place tbody tr:not(.cn-place-reglette)').length;
    expect(lignes, `${lignes} lignes de valeurs dans Choisir (390 × 844 : une dizaine de lignes de 34 px sous le choix)`).toBeLessThanOrEqual(8);
  });
});

/* =========================================================================================================== R95 : le fil et les liens */

describe('R95 · cause C : liens courts dans le fil, fil ancien rangé à l\'ouverture sans écriture', () => {
  it('un lien collé (gclid, utm) est un lien court dans le fil : domaine et titre de l\'article, jamais l\'adresse brute', async () => {
    monter(F.citraAvecFil() as Item[], { ouvrir: F.ID_CITRA });
    await attendre(100);
    const fil = vu(document.querySelector('.cn-ouvert') ?? document.body);
    expect(fil, `fil : « ${fil.slice(0, 500)} »`).not.toMatch(/gclid|utm_|https?:\/\//);
    expect(sans(fil), 'le lien court garde le domaine').toContain('pellets-exemple.test');
  });
  it('l\'adresse de 400 caractères de Chambre froide ne s\'étale pas : le fil ne porte aucune ligne de plus de 90 caractères sans espace', async () => {
    monter(F.chambreAvecFil() as Item[], { ouvrir: F.ID_CHAMBRE });
    await attendre(100);
    const fil = vu(document.querySelector('.cn-ouvert') ?? document.body);
    const longs = fil.split(/\s+/).filter(mot => mot.length > 90);
    expect(longs.length, `mots de plus de 90 caractères : ${longs.map(l => l.slice(0, 40) + '…').join(' | ')}`).toBe(0);
    expect(fil).not.toMatch(/gclid|utm_/);
  });
  it('un fil ancien (5 bulles brutes) : son titre n\'est pas redit dans une 1re bulle', async () => {
    monter(F.filBrutMalt() as Item[], { ouvrir: F.ID_MALT });
    await attendre(100);
    const corps = vu(document.querySelector('.cn-ouvert') ?? document.body);
    const titre = F.PHRASES_MALT[0];
    const fois = corps.split(titre).length - 1;
    expect(fois, `le titre est dit ${fois} fois (titre + 1re bulle) : « ${corps.slice(0, 300)} »`).toBeLessThanOrEqual(1);
  });
  it('un fil ancien est rangé à l\'ouverture par l\'analyse LOCALE : « Autre fournisseur… » devient une option du problème', async () => {
    monter(F.filBrutMalt() as Item[], { ouvrir: F.ID_MALT });
    await attendre(150);
    const options = document.querySelector('section.cnp-options');
    expect(options, `aucune section d'options : « ${vu(document.body).slice(0, 400)} »`).toBeTruthy();
    expect(sans(lu(options)), `options : « ${lu(options)} »`).toContain('autre fournisseur');
  });
  it('un fil ancien : « Commandé 2 sacs chez l\'autre » est proposé en état « Résolu » (rien n\'est passé seul)', async () => {
    const m = monter(F.filBrutMalt() as Item[], { ouvrir: F.ID_MALT });
    await attendre(150);
    expect(sans(vu(document.querySelector('.cn-ouvert') ?? document.body)), 'une proposition Résolu à l\'écran').toMatch(/resolu/);
    expect(carnetDe(m, F.ID_MALT).carnet.suivi?.etat ?? 'rien', 'l\'état n\'est pas écrit sans son geste').not.toBe('resolu');
  });
  it('un fil ancien : « Brassin du 3 déc. à décaler » est proposé en tâche', async () => {
    monter(F.filBrutMalt() as Item[], { ouvrir: F.ID_MALT });
    await attendre(150);
    expect(sans(vu(document.querySelector('.cn-ouvert') ?? document.body)), 'une tâche proposée à l\'écran').toMatch(/tache/);
  });
  it('garde : rien n\'est écrit tant que le rangement local n\'est pas validé par son geste', async () => {
    const m = monter(F.filBrutMalt() as Item[], { ouvrir: F.ID_MALT });
    await attendre(250);
    expect(m.magasin.ecritures, 'ouvrir un carnet ne l\'écrit pas').toHaveLength(0);
  });
});

/* =========================================================================================================== R96 : note pas article, import du Planning */

describe('R96 · NOTE-PAS-ARTICLE (cause E) : une note reste une note ; l\'import du Planning se lit juste', () => {
  const NOTE_MONTANT = 'Autre fournisseur : en stock, 4 CHF de plus le sac.';
  const CONSTAT = 'La pompe de recirculation est brûlante après 30 min d’empâtage.';
  const RESOLU = 'La vanne d’entrée était à moitié fermée : on règle le débit à la sortie maintenant. Résolu.';

  it('la fonction : une phrase d\'écart de prix (« 4 CHF de plus le sac ») n\'est pas un article', () => {
    expect(analyserLigne(NOTE_MONTANT).sorte).not.toBe('article');
  });
  it('la fonction : une phrase de constat n\'est pas un critère', () => {
    expect(analyserLigne(CONSTAT).sorte).not.toBe('critere');
  });
  it('le geste : « Autre fournisseur : … 4 CHF de plus le sac. » tapée dans le problème (IA éteinte) ne crée aucun article, aucune veille, aucun Choisir', async () => {
    const m = monter([F.problemeVide('malt pilsner en rupture') as Item], { ouvrir: F.ID_PROBLEME });
    await attendre(100);
    await taper(NOTE_MONTANT);
    const c = carnetDe(m, F.ID_PROBLEME);
    expect(c.carnet.articles.map(a => a.nom), 'articles nés de la phrase').toEqual([]);
    expect(vu(document.body), 'aucune offre ni Choisir sur une phrase').not.toMatch(/Veille du prix|Choisir ·|Poser le prix/);
    expect(lu(document.body)).toContain('4 CHF');
  }, 30000);
  it('le geste : la même phrase, l\'IA simulée la rendant en « note » avec un montant : toujours aucun article', async () => {
    const m = monter([F.problemeVide('malt pilsner en rupture') as Item], {
      ouvrir: F.ID_PROBLEME, appels: reponseIA([{ sorte: 'note', texte: NOTE_MONTANT, genre: 'note', carnetId: F.ID_PROBLEME, citation: sans(NOTE_MONTANT) }])
    });
    await attendre(100);
    await taper(NOTE_MONTANT);
    expect(carnetDe(m, F.ID_PROBLEME).carnet.articles).toEqual([]);
  }, 30000);
  it('le geste : un constat tapé dans le problème n\'entre pas dans ses Critères (« Critère : La pompe de recirculation est brûlante… »)', async () => {
    const m = monter([F.problemeVide() as Item], { ouvrir: F.ID_PROBLEME });
    await attendre(100);
    await taper(CONSTAT);
    expect(carnetDe(m, F.ID_PROBLEME).carnet.criteres.map(k => k.texte), 'critères nés d\'un constat').toEqual([]);
    expect(vu(document.body)).not.toMatch(/Critère\s*:\s*La pompe/);
  }, 30000);
  it('le geste : « … Résolu. » écrit dans la phrase propose de passer le problème à Résolu, sans le passer seul', async () => {
    const m = monter([F.problemeVide() as Item], { ouvrir: F.ID_PROBLEME });
    await attendre(100);
    const nbResolu = () => [...document.querySelectorAll('button')].filter(b => /resolu/.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))).length;
    const avant = nbResolu(); /* le sélecteur d'état du carnet porte déjà un « Résolu » */
    await taper(RESOLU);
    expect(nbResolu(), `aucune proposition Résolu de plus (${avant} avant) : « ${vu(document.body).slice(0, 400)} »`).toBeGreaterThan(avant);
    expect(carnetDe(m, F.ID_PROBLEME).carnet.suivi?.etat, 'proposé, pas passé').not.toBe('resolu');
  }, 30000);

  describe('un carnet importé du Planning (3 sept.)', () => {
    const importe = () => F.importPlanning() as Item[];
    it('le budget (« Budget du Planning : 850 CHF ») est dit « Budget 850 CHF », jamais « Critère : Budget du Planning »', async () => {
      monter(importe(), { ouvrir: F.ID_EMBOUTEILLAGE });
      await attendre(100);
      const t = vu(document.querySelector('.cn-ouvert') ?? document.body);
      expect(t, `carnet : « ${t.slice(0, 300)} »`).not.toMatch(/Crit[eè]re\s*:?\s*Budget du Planning/i);
      expect(sans(t)).toMatch(/budget\s*:?\s*850/);
    });
    it('Quand dit la date du Planning (début 1 mai 2027) : « mai 2027 », pas « vers avr. » ni « S26 »', async () => {
      monter(importe(), { ouvrir: F.ID_EMBOUTEILLAGE });
      await attendre(100);
      const quand = [...document.querySelectorAll('button')].find(b => /^quand\b/i.test(lu(b)));
      expect(quand, 'la ligne Quand du carnet').toBeTruthy();
      expect(sans(lu(quand)), `Quand : « ${lu(quand)} »`).toMatch(/mai/);
      expect(sans(lu(quand))).toMatch(/2027/);
      expect(sans(lu(quand))).not.toMatch(/avr|s26|s17/);
    });
    it('Quand ne dit pas « prix ? » quand le budget (850 CHF) est connu', async () => {
      monter(importe(), { ouvrir: F.ID_EMBOUTEILLAGE });
      await attendre(100);
      const quand = [...document.querySelectorAll('button')].find(b => /^quand\b/i.test(lu(b)));
      expect(sans(lu(quand)), `Quand : « ${lu(quand)} »`).not.toMatch(/prix \?/);
      expect(sans(lu(quand))).toMatch(/850/);
    });
    it('À faire dit la même date que Quand : l\'étape « À faire du 01.05.2027 » est rangée au 1 mai 2027, pas à la « sem. du 26 avr. 2027 »', () => {
      const carnets = lireCarnets(importe() as never, { archives: true }).filter(c => c.id === F.ID_EMBOUTEILLAGE);
      const { container } = render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} messages={[]} onCocher={() => {}} onOuvrir={() => {}} onEcheance={() => {}} />);
      const t = sans(lu(container));
      expect(t, `À faire : « ${t.slice(0, 300)} »`).toMatch(/mai 2027/);
      expect(t).not.toMatch(/avr/);
    });
  });
});

/* =========================================================================================================== R97 : critique-73 (C73-1 à C73-6) */

describe('R97 · C73-1 : « la semaine du 14 décembre » garde sa date, pas « Fin du mois »', () => {
  it('echeanceDite lit « … la semaine du 14 décembre » : la semaine du 14 déc. 2026, précision semaine', () => {
    const e = echeanceDite('appeler l’installateur pour poser le condenseur la semaine du 14 décembre', MAINT());
    expect(e, 'la date dite est lue').toEqual({ echeance: '2026-12-14', precision: 'semaine' });
  });
  it('« le 14 décembre », « semaine du 14 décembre » sans marque « avant » : une date dite est lue', () => {
    expect(echeanceDite('poser la hotte semaine du 14 décembre', MAINT())?.echeance).toBe('2026-12-14');
  });
});

describe('R97 · C73-2 : une piste dite seule garde son prix (tuile et coût en tête)', () => {
  it('« une hotte inox avec extracteur, devis de 620 CHF » (IA éteinte) : la tuile dit 620 et le coût en tête 620 CHF', async () => {
    const m = monter([F.problemeVide('vapeur au brassage') as Item], { ouvrir: F.ID_PROBLEME });
    await attendre(100);
    await taper('une hotte inox avec extracteur, devis de 620 CHF');
    const c = carnetDe(m, F.ID_PROBLEME);
    const tuiles = lu(document.querySelector('section.cnp-options'));
    expect(tuiles, `options : ${JSON.stringify(c.carnet.facons.map(f => f.nom))} ; tuiles « ${tuiles} »`).toMatch(/620/);
    expect(lu(document.querySelector('.cnp-total')), 'coût en tête').toMatch(/620\s?CHF/);
  }, 30000);
  it('« piste : un poids étalon de 1 kg à 25 CHF » (IA éteinte) : la tuile dit 25 CHF', async () => {
    const m = monter([F.problemeVide('balance') as Item], { ouvrir: F.ID_PROBLEME });
    await attendre(100);
    await taper('piste : un poids étalon de 1 kg à 25 CHF');
    const tuiles = lu(document.querySelector('section.cnp-options'));
    expect(tuiles, `options : ${JSON.stringify(carnetDe(m, F.ID_PROBLEME).carnet.facons.map(f => f.nom))} ; tuiles « ${tuiles} »`).toMatch(/25\s?CHF/);
  }, 30000);
});

describe('R97 · C73-3 : Relire « essayé » ne dit que les options écartées', () => {
  function resolu(): CarnetDoc {
    const piste = (id: string, nom: string) => ({ id, nom, etat: 'ouverte', origine: 'ia', suivi: { etat: 'piste', historique: [{ etat: 'piste', le: '2026-11-25T03:00:00.000Z', origine: 'ia' }] } });
    const doc = { ...(clone(F.problemeVide('vapeur au brassage')) as object) } as unknown as { carnet: { facons: unknown[] } };
    doc.carnet.facons = [piste('FH', 'Hotte inox avec extracteur'), piste('FV', 'Ventilateur extracteur mural'), piste('FC', 'Condenseur de buées')];
    let items = [doc as unknown as Item];
    const ap = (r: { ok: boolean; ecritures?: unknown; raison?: string }) => { if (!r.ok) throw new Error(r.raison); items = appliquerEcritures(items as never, r.ecritures as never) as Item[]; };
    ap(changerOption(items as never, { carnetId: F.ID_PROBLEME, faconId: 'FV', vers: 'ecartee', raison: 'trop bruyant', le: '2026-11-25T04:00:00.000Z' }) as never);
    ap(retenirOption(items as never, { carnetId: F.ID_PROBLEME, faconId: 'FC', le: '2026-11-25T05:00:00.000Z' }) as never);
    ap(resoudre(items as never, { carnetId: F.ID_PROBLEME, le: '2026-11-25T06:00:00.000Z', sorte: 'reparation' }) as never);
    return lireCarnets(items as never, { archives: true }).find(c => c.id === F.ID_PROBLEME)!;
  }
  it('la hotte restée piste n\'a jamais été essayée : elle n\'est pas dans « essayé » ; le ventilateur écarté y est (non)', () => {
    const f = ficheResolu(resolu(), []);
    expect(f.essaye.some(e => /hotte/i.test(e)), `essayé : ${JSON.stringify(f.essaye)}`).toBe(false);
    expect(f.essaye.some(e => /ventilateur/i.test(e) && /non/i.test(e)), `essayé : ${JSON.stringify(f.essaye)}`).toBe(true);
  });
});

describe('R97 · C73-4 : une phrase (constat + piste), une seule trace du constat', () => {
  it('une phrase rangée en lignes par l\'IA (simulée) : le même constat n\'est pas écrit deux fois dans le problème', async () => {
    const CONSTAT = 'la balance de la salle de brassage affiche 200 g de trop';
    const PHRASE = `${CONSTAT} ; piste : un poids étalon de 1 kg à 25 CHF pour la recalibrer`;
    const appels = reponseIA([
      { sorte: 'note', texte: 'Un poids étalon de 1 kg à 25 CHF', genre: 'a-acheter', carnetId: F.ID_PROBLEME, citation: 'un poids étalon de 1 kg à 25 chf' },
      { sorte: 'note', texte: CONSTAT, genre: 'note', carnetId: F.ID_PROBLEME, citation: CONSTAT },
      { sorte: 'note', texte: CONSTAT, genre: 'note', carnetId: F.ID_PROBLEME, citation: CONSTAT }
    ]);
    const m = monter([F.problemeVide('balance') as Item], { ouvrir: F.ID_PROBLEME, appels });
    await attendre(100);
    await taper(PHRASE);
    const textes = carnetDe(m, F.ID_PROBLEME).carnet.notes.map(n => sans(n.texte));
    const doubles = textes.filter((t, i) => textes.indexOf(t) !== i);
    expect(doubles, `notes : ${JSON.stringify(textes)}`).toEqual([]);
  }, 30000);
});

describe('R97 · C73-5 : repli local hors ligne, « ou une balance neuve à 140 CHF » est une piste « Balance neuve »', () => {
  it('la piste s\'appelle « Balance neuve » (pas la phrase entière), porte 140 CHF et le jeton « piste »', async () => {
    const m = monter([F.problemeVide('balance') as Item], { ouvrir: F.ID_PROBLEME, horsLigne: true });
    await attendre(100);
    await taper('un poids étalon de 1 kg à 25 CHF');
    await taper('ou une balance neuve à 140 CHF');
    const c = carnetDe(m, F.ID_PROBLEME);
    const noms = c.carnet.facons.map(f => f.nom);
    expect(noms.some(n => /^balance neuve$/i.test(n.trim())), `options : ${JSON.stringify(noms)}`).toBe(true);
    expect(noms.some(n => /^ou /i.test(n.trim())), `une option porte la phrase entière : ${JSON.stringify(noms)}`).toBe(false);
    const jetons = lireMessages(m.magasin.lire() as never).flatMap(x => x.carnetMessage.etiquettes ?? []);
    expect(jetons.some(j => j.sorte === 'piste'), `jetons : ${JSON.stringify(jetons.map(j => j.sorte))}`).toBe(true);
    expect(sans(lu(document.querySelector('section.cnp-options'))), 'la tuile dit 140').toMatch(/140/);
  }, 40000);
});

describe('R97 · C73-6 : le bandeau « Hors ligne » se retire au retour en ligne', () => {
  it('une phrase tapée hors ligne : « Hors ligne : rangé sur place » ; en ligne, ce bandeau n\'est plus là', async () => {
    const m = monter([F.problemeVide('balance') as Item], { ouvrir: F.ID_PROBLEME, horsLigne: true });
    await attendre(100);
    await taper('un poids étalon de 1 kg à 25 CHF');
    expect(sans(lu(document.body)), 'garde : le bandeau hors ligne se montre hors ligne').toMatch(/hors ligne :/);
    m.enLigne();
    await attendre(200);
    expect(sans(lu(document.body)), 'le bandeau « Hors ligne : … » reste après le retour en ligne').not.toMatch(/hors ligne :/);
    expect(document.querySelector('[data-etat="hors-ligne"]')).toBeNull();
  }, 40000);
});
