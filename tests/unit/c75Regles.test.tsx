// @vitest-environment jsdom
/**
 * Voie c75-tests (25.11) : les tests ROUGES des règles R98 à R102, écrits AVANT tout correctif (celui qui corrige n'écrit pas le test, L17).
 * Données : les VRAIS documents de ses carnets, relevés dans le cache Firestore de l'app en ligne (voie c75-releve) et anonymisés :
 * tests/fixtures/c75/{zz-malt-pilsner,zz-pompe,houblons-citra,embouteillage-planning}.json, chargés TELS QUELS (carnet, messages, plan) dans le magasin.
 * Aucune fixture « à la forme » : les défauts sont DANS ces données (article « 4 CHF de plus le sac », critère « La pompe… brûlante », « Commandé 2 sacs » rangé « à acheter »,
 * « Résolu » coupé en note, Citra sans prix pour 1 kg, plan du 26.04 au 04.07.2027).
 * Par le composant (CarnetsVue monté, un geste réel). Aucun réseau, aucun Gemini (AiClient jette s'il est appelé). jsdom ne mesure aucune boîte : le rendu à 390 px reste à voir en ligne.
 *
 *  - R98  : un carnet ancien mal rangé montre « Reclasser ce carnet ? » qui dit ce qui change ; UN toucher applique, Annuler rend ; rien n'est écrit sans ce toucher.
 *  - R99  : sans toucher, l'écran n'affiche pas l'erreur comme un fait (pas de veille ni de Choisir sur l'« article » né d'une note ; pas de « critère » né d'une phrase).
 *  - R100 : Citra, sans prix pour 1 kg : aucun « Choisir · 1 kg » ; la table des conditionnements connus ; Choisir porte le conditionnement qui a un prix, son prix exact jusqu'à À venir.
 *  - R101 : Embouteillage : Quand dit la date comme À faire ; jamais une semaine sans année hors de l'année en cours.
 *  - R102 : les autres R73-n et R75-n rouverts par reel-75, sur ces documents quand ils les concernent.
 *    Non couverts ici (aucun de ces documents ne les porte, ou jsdom ne les mesure pas) : R73-8, R73-10, R73-12, R73-14, R73-15, R73-18 (mise en page : à voir en ligne), R73-17 et R75-7 (liens de Frigo
 *    et de l'armoire malte : aucun document relevé), R75-3 (tableau de Chambre froide), R73-19 à R73-21 (ZZ à retirer), R73-30 (ordre de la liste : DÉCISION À PRENDRE, voir RESULTAT.md), R73-31.
 * Normalisation : le texte lu ET l'attendu passent par `sans` (NFKC, espaces insécables réunis, apostrophes droites, accents et casse ôtés).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets, type CarnetDoc } from '../../src/domain/carnets/modele';
import { genreDe, suiviDe } from '../../src/domain/carnets/suivi';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { AFaire } from '../../src/ui/carnets/AFaire';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: true, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof magasinMemoire>[0][number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

const NOMS = ['zz-malt-pilsner', 'zz-pompe', 'houblons-citra', 'embouteillage-planning'] as const;
type Nom = typeof NOMS[number];
interface Releve { carnet: Item & { id: string; title: string; carnet: { articles: Array<{ nom: string }> } }; messages: Item[]; articles: unknown[]; plan: FinancialPlan | null }
/** Le document réel, tel qu'il est dans le fichier (aucune retouche). */
const releve = (nom: Nom): Releve => JSON.parse(readFileSync(`tests/fixtures/c75/${nom}.json`, 'utf8')) as Releve;

interface Montage { ouvrir?: boolean; ecrire?: (p: FinancialPlan) => void; tous?: boolean }
function monter(nom: Nom, o: Montage = {}) {
  const d = releve(nom);
  const docs = o.tous ? NOMS.map(releve) : [d];
  poserQuantitePour(d.carnet.title, 1);
  const magasin = magasinMemoire(docs.flatMap(x => [x.carnet, ...x.messages]) as never[]);
  const plans = docs.flatMap(x => (x.plan ? [x.plan] : []));
  const r = render(
    <CarnetsVue magasin={magasin} finances={{ plans, transactions: [], payments: [] } as never} mode={'simule' as never} appels={horsLigne} aides={aidesCarnet('simule' as never, {})}
      maintenant={MAINT} ecrirePlan={((p: FinancialPlan) => o.ecrire?.(p)) as never} {...(o.ouvrir === false ? {} : { ouvrir: { id: d.carnet.id, at: 1 } })} />
  );
  return { magasin, id: d.carnet.id, plan: d.plan, ...r };
}
type M = ReturnType<typeof monter>;
const carnetDe = (m: M): CarnetDoc => lireCarnets(m.magasin.lire() as never, { archives: true }).find(c => c.id === m.id)!;
/** Ce qui compte du rangement d'un carnet : de quoi vérifier qu'Annuler rend exactement ce qu'il y avait. */
const etat = (m: M) => {
  const c = carnetDe(m);
  return JSON.parse(JSON.stringify({
    articles: c.carnet.articles.map(a => a.nom), notes: c.carnet.notes.map(n => [n.texte, n.genre]), criteres: c.carnet.criteres.map(k => k.texte),
    genre: genreDe(c), suivi: suiviDe(c).etat, facons: c.carnet.facons.map(f => f.nom)
  })) as { articles: string[]; notes: Array<[string, string]>; criteres: string[]; genre: string; suivi: string; facons: string[] };
};
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const rangs = () => [...document.querySelectorAll('button.cn-tab-ligne')] as HTMLElement[];
const ligneDe = (re: RegExp) => rangs().find(l => re.test(sans(lu(l))))!;
const MOTLER = /motler/;
const BRAU = /citra 13/;
const celluleKg = (l: Element) => { const cs = [...l.querySelectorAll('[role="cell"][data-col]')]; return lu(cs[cs.length - 1]); };
async function ouvrirFiche(re: RegExp) { const l = ligneDe(re); expect(l, `la ligne ${re} du tableau : ${rangs().map(lu).join(' | ')}`).toBeTruthy(); fireEvent.click(l); await attendre(50); }
async function ouvrirChoisir() {
  const b = bouton(/^choisir/);
  expect(b, 'le bouton « Choisir » de la fiche').toBeTruthy();
  fireEvent.click(b!);
  await attendre(50);
  return document.querySelector('.cn-choisir') as HTMLElement;
}
/** Une espace de chaque côté d'un tiret entre deux nombres : la chasse fixe espacée de ses plaintes. */
const FOURCHETTE_ESPACEE = /\d\s*%?\s+[-–]\s+\d/;
const ownText = (e: Element) => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ');
/** La carte « Reclasser ce carnet ? » : le plus petit élément qui porte ce titre ET un bouton « Reclasser ». null si absente. */
function carteReclasser(): HTMLElement | null {
  const titres = [...document.querySelectorAll('*')].filter(e => /reclasser ce carnet ?\?/.test(sans(ownText(e))) || /reclasser ce carnet ?\?/.test(sans(e.getAttribute('aria-label') ?? '')));
  for (const t of titres) { let e: Element | null = t; while (e && e !== document.body) { if (bouton(/^reclasser/, e)) return e as HTMLElement; e = e.parentElement; } }
  return null;
}
const mots = (e: Element | null) => sans(lu(e));
/** La carte, ou un échec qui le dit (sans elle, un geste sur « Reclasser » n'a rien à toucher). */
function carteOuEchec(): HTMLElement {
  const c = carteReclasser();
  expect(c, `aucune carte « Reclasser ce carnet ? » à l'écran : « ${lu(document.body).slice(0, 220)} »`).toBeTruthy();
  return c!;
}
/** UN toucher sur « Reclasser » : le geste unique de la règle R98. */
const toucherReclasser = () => { fireEvent.click(bouton(/^reclasser/, carteOuEchec())!); };

/* ======================================================================================================== R98 : reclasser un carnet ancien, d'un toucher */

/**
 * R98 (CARNET-SES-DONNEES-EXISTANTES) : ses carnets d'avant les correctifs gardent le mauvais rangement DANS la donnée (voies/c75-releve/RESULTAT.md). Un correctif d'affichage seul ne les répare pas :
 * le carnet montre une carte « Reclasser ce carnet ? » qui dit ce qui change ; UN toucher applique ; Annuler rend ; rien n'est écrit sans ce toucher ; aucune migration automatique.
 */
describe('R98 · « Reclasser ce carnet ? » : ZZ malt pilsner (article « 4 CHF de plus le sac », « Commandé 2 sacs » rangé « à acheter »)', () => {
  it('le carnet réel montre la carte « Reclasser ce carnet ? » avec un bouton Reclasser', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    expect(carteReclasser(), `aucune carte « Reclasser ce carnet ? » : « ${lu(document.body).slice(0, 300)} »`).toBeTruthy();
  });
  it('la carte dit ce qui change : l\'article devient une note au montant relatif « +4 CHF le sac »', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    const t = mots(carteOuEchec());
    expect(t, `carte : « ${t} »`).toMatch(/article/);
    expect(t, `carte : « ${t} »`).toMatch(/\+\s?4(?:[.,]0+)?\s?chf/);
    expect(t, `carte : « ${t} »`).toMatch(/le sac/);
    expect(t, `carte : « ${t} »`).toMatch(/note|piste/);
  });
  it('la carte dit que « Commandé 2 sacs chez l\'autre » passe de « à acheter » à fait', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    const t = mots(carteOuEchec());
    expect(t, `carte : « ${t} »`).toMatch(/command/);
    expect(t, `carte : « ${t} »`).toMatch(/\bfait\b/);
  });
  it('rien n\'est écrit sans ce toucher : le magasin ne reçoit aucune écriture à l\'ouverture, ni après une attente', async () => {
    const m = monter('zz-malt-pilsner');
    await attendre(400);
    expect(carteReclasser(), 'la carte est proposée (sans elle, ce garde ne prouve rien)').toBeTruthy();
    expect(m.magasin.ecritures, 'ouvrir un carnet ne le réécrit pas').toHaveLength(0);
    expect(etat(m).articles, 'l\'article ancien est encore là, faute de geste').toHaveLength(1);
  });
  it('UN toucher sur « Reclasser » : plus aucun article, le montant relatif « +4 CHF » est gardé en note ou en piste, « Commandé » n\'est plus « à acheter »', async () => {
    const m = monter('zz-malt-pilsner');
    await attendre(150);
    const avant = etat(m);
    expect(avant.articles, 'départ : l\'article né de la note').toHaveLength(1);
    toucherReclasser();
    await attendre(120);
    const apres = etat(m);
    expect(apres.articles, `articles après : ${JSON.stringify(apres.articles)}`).toEqual([]);
    expect(JSON.stringify([apres.notes, apres.facons]), 'le montant relatif est gardé').toMatch(/\+\s?4(?:[.,]0+)?\s?CHF/);
    const commande = apres.notes.find(n => /command/i.test(n[0]));
    expect(commande, `notes : ${JSON.stringify(apres.notes)}`).toBeTruthy();
    expect(commande![1], 'un achat fait n\'est plus « à acheter »').not.toBe('a-acheter');
    expect(m.magasin.ecritures.length, 'le toucher écrit').toBeGreaterThan(0);
  });
  it('après le toucher, la carte a disparu et l\'écran ne montre plus d\'article, de veille ni de Choisir sur cette phrase', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    toucherReclasser();
    await attendre(150);
    expect(carteReclasser(), 'la carte reste après le toucher').toBeNull();
    expect(mots(document.body)).not.toMatch(/veille du prix|poser le prix/);
    expect(mots(document.body)).toMatch(/\+\s?4(?:[.,]0+)?\s?chf/);
  });
  it('Annuler rend : le carnet retrouve son article, ses notes et leurs genres exactement comme avant', async () => {
    const m = monter('zz-malt-pilsner');
    await attendre(150);
    const avant = etat(m);
    toucherReclasser();
    await attendre(120);
    const annuler = bouton(/^annuler/);
    expect(annuler, `aucun bouton Annuler après le toucher : « ${lu(document.body).slice(0, 300)} »`).toBeTruthy();
    fireEvent.click(annuler!);
    await attendre(120);
    expect(etat(m), 'Annuler remet le carnet comme il était').toEqual(avant);
  });
});

describe('R98 · « Reclasser ce carnet ? » : ZZ pompe qui chauffe (critère « La pompe… brûlante », « Résolu » coupé en note, carnet resté « idée »)', () => {
  it('le carnet réel montre la carte « Reclasser ce carnet ? »', async () => {
    monter('zz-pompe');
    await attendre(150);
    expect(carteReclasser(), `aucune carte : « ${lu(document.body).slice(0, 300)} »`).toBeTruthy();
  });
  it('la carte dit : le critère devient un constat du problème ; « Résolu » devient l\'état Résolu ; l\'idée devient un problème', async () => {
    monter('zz-pompe');
    await attendre(150);
    const t = mots(carteOuEchec());
    expect(t, `carte : « ${t} »`).toMatch(/critere/);
    expect(t, `carte : « ${t} »`).toMatch(/constat/);
    expect(t, `carte : « ${t} »`).toMatch(/resolu/);
    expect(t, `carte : « ${t} »`).toMatch(/idee/);
    expect(t, `carte : « ${t} »`).toMatch(/probleme/);
  });
  it('rien n\'est écrit sans ce toucher : aucune écriture, le critère et la note « Résolu » sont encore là', async () => {
    const m = monter('zz-pompe');
    await attendre(400);
    expect(carteReclasser(), 'la carte est proposée').toBeTruthy();
    expect(m.magasin.ecritures).toHaveLength(0);
    const e = etat(m);
    expect(e.criteres).toHaveLength(1);
    expect(e.suivi, 'l\'état n\'est pas passé seul').not.toBe('resolu');
  });
  it('UN toucher : plus de critère ; la phrase de la pompe reste, comme constat ; l\'état est Résolu ; le genre est problème ; plus de note « Résolu » seule', async () => {
    const m = monter('zz-pompe');
    await attendre(150);
    toucherReclasser();
    await attendre(150);
    const e = etat(m);
    expect(e.criteres, `critères après : ${JSON.stringify(e.criteres)}`).toEqual([]);
    expect(JSON.stringify(carnetDe(m).carnet), 'le constat de la pompe n\'est pas perdu').toMatch(/brûlante/);
    expect(e.suivi, 'état').toBe('resolu');
    expect(e.genre, 'genre').toBe('probleme');
    expect(e.notes.map(n => n[0].trim().toLowerCase()), `notes : ${JSON.stringify(e.notes)}`).not.toContain('résolu');
    expect(e.notes.some(n => /vanne/.test(n[0])), 'la phrase de la vanne reste').toBe(true);
    expect(mots(document.body), 'plus de « Critère : La pompe… »').not.toMatch(/critere\s*:\s*la pompe/);
  });
  it('Annuler rend : critère, notes (dont « Résolu »), état et genre comme avant', async () => {
    const m = monter('zz-pompe');
    await attendre(150);
    const avant = etat(m);
    toucherReclasser();
    await attendre(120);
    const annuler = bouton(/^annuler/);
    expect(annuler, 'aucun bouton Annuler après le toucher').toBeTruthy();
    fireEvent.click(annuler!);
    await attendre(120);
    expect(etat(m)).toEqual(avant);
  });
});

describe('R98 · garde : un carnet bien rangé ne propose rien', () => {
  it('Houblons citra (articles lus, note, fil rangé) : aucune carte « Reclasser ce carnet ? »', async () => {
    monter('houblons-citra');
    await attendre(200);
    expect(carteReclasser(), 'une carte à tort sur un carnet bien rangé').toBeNull();
  });
});

/* ======================================================================================================== R99 : l'erreur n'est pas un fait */

/**
 * R99 (NOTE-PAS-ARTICLE) : tant qu'il n'a pas touché « Reclasser », l'écran n'affiche pas l'erreur de rangement comme un fait.
 */
describe('R99 · ZZ malt pilsner : la phrase « 4 CHF de plus le sac » n\'est ni un article, ni une veille, ni un Choisir', () => {
  it('aucune veille du prix ni « Poser le prix » ni « Choisir » sur l\'écran du carnet', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    const t = mots(document.body);
    expect(t, `écran : « ${t.slice(0, 400)} »`).not.toMatch(/veille du prix|poser le prix/);
    expect(bouton(/^choisir/), 'un bouton Choisir sur une phrase').toBeUndefined();
  });
  it('la rubrique « Articles 1 » avec la phrase en nom d\'article n\'est pas montrée', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    const t = mots(document.querySelector('.cn-ouvert') ?? document.body);
    expect(t, `écran : « ${t.slice(0, 400)} »`).not.toMatch(/articles\s*1(?!\d)/);
    expect(rangs().filter(l => /autre fournisseur/.test(sans(lu(l)))), 'une ligne d\'article née de la note').toHaveLength(0);
  });
  it('si la phrase reste une ligne, la toucher n\'ouvre aucune fiche avec Choisir ni veille', async () => {
    monter('zz-malt-pilsner');
    await attendre(150);
    const l = [...document.querySelectorAll('button, a')].find(b => /autre fournisseur/.test(sans(lu(b))) && !/reclasser/.test(sans(lu(b))));
    if (l) { fireEvent.click(l); await attendre(80); }
    expect(bouton(/^choisir/), 'Choisir sur l\'article né d\'une note').toBeUndefined();
    expect(mots(document.body)).not.toMatch(/veille du prix/);
  });
  it('la liste n\'affiche pas non plus « 4 CHF » comme le prix d\'un carnet né d\'une note', async () => {
    monter('zz-malt-pilsner', { ouvrir: false });
    await attendre(150);
    const ligne = [...document.querySelectorAll('.cnl-corps button, .cnl-corps li, .cnl-corps a')].find(e => /malt pilsner/.test(sans(lu(e))));
    expect(ligne, `liste : « ${lu(document.body).slice(0, 300)} »`).toBeTruthy();
    expect(mots(ligne!), `ligne : « ${lu(ligne!)} »`).not.toMatch(/4 chf/);
  });
});

describe('R99 · ZZ pompe qui chauffe : le constat n\'est pas présenté comme critère de choix', () => {
  it('aucune ligne « Critère : La pompe de recirculation est brûlante… »', async () => {
    monter('zz-pompe');
    await attendre(150);
    const t = mots(document.body);
    expect(t, `écran : « ${t.slice(0, 400)} »`).not.toMatch(/critere\s*:?\s*la pompe/);
  });
  it('aucune mention « calculé sur place » collée à un critère né d\'une phrase', async () => {
    monter('zz-pompe');
    await attendre(150);
    const t = mots(document.body);
    expect(t, `écran : « ${t.slice(0, 400)} »`).not.toMatch(/critere[^]{0,160}calcule sur place/);
  });
});

/* ======================================================================================================== R100 : Citra, un seul prix pour 50 g */

/**
 * R100 (R73-4, R73-5 ; CARNET-SES-DONNEES-EXISTANTES) : l'article MotlerHops n'a qu'UN prix (3,72 € pour 50 g) ; « Poids » dit « 50 g, 250 g et 500 g » en un texte ; rien ne dit 1 kg.
 * Sa maquette v01-fiche montre la table « je prends · prix · CHF/kg ». Sans prix pour un conditionnement, on le dit (« prix à relire ») et on propose Relire.
 */
describe('R100 · Citra (MotlerHops) : jamais « 1 kg » inventé, la table des conditionnements connus', () => {
  async function fiche() { const m = monter('houblons-citra'); await attendre(150); await ouvrirFiche(MOTLER); return m; }

  it('aucun bouton « Choisir · … 1 kg » sur la fiche (rien dans la donnée ne dit 1 kg)', async () => {
    await fiche();
    const b = bouton(/^choisir/);
    expect(b, 'bouton Choisir').toBeTruthy();
    expect(sans(lu(b!)), `bouton : « ${lu(b!)} »`).not.toMatch(/1 kg/);
    expect(mots(document.body), 'aucun « 1 kg » nulle part sur la fiche').not.toMatch(/\b1 kg\b/);
  });
  it('la fiche montre la table des conditionnements connus : 50 g avec son prix (3,72 €), 250 g et 500 g « prix à relire »', async () => {
    await fiche();
    const t = mots(document.body);
    expect(t, `fiche : « ${t.slice(0, 500)} »`).toMatch(/(^|\D)50 g\D{0,80}3[,.]72/);
    expect(t, 'le prix de 50 g est aussi dit en CHF (≈ prix rendu)').toMatch(/(^|\D)50 g[^]{0,120}3[,.][4-7]\d?\s?chf|3[,.][4-7]\d?\s?chf[^]{0,40}50 g/);
    expect(t, `fiche : « ${t.slice(0, 500)} »`).toMatch(/(^|\D)250 g\D{0,60}prix a relire/);
    expect(t, `fiche : « ${t.slice(0, 500)} »`).toMatch(/(^|\D)500 g\D{0,60}prix a relire/);
  });
  it('la fiche propose Relire (le prix des autres conditionnements se lit sur la page)', async () => {
    await fiche();
    expect(bouton(/^relire/), `boutons : ${[...document.querySelectorAll('button')].map(b => lu(b)).join(' | ')}`).toBeTruthy();
  });
  it('« Choisir » porte le conditionnement qui a un prix (50 g), pas 1 kg ; la phrase « Part dans À venir » dit le prix exact, pas « ≈4 CHF »', async () => {
    await fiche();
    const b = bouton(/^choisir/)!;
    expect(sans(lu(b)), `bouton : « ${lu(b)} »`).toMatch(/(^|\D)50 g/);
    const phrase = mots(b.nextElementSibling);
    expect(phrase, `fiche : « ${phrase} »`).not.toMatch(/≈\s?4\s?chf|\b4 chf\b/);
    const ecran = await ouvrirChoisir();
    const t = mots(ecran);
    expect(t, `Choisir : « ${t.slice(0, 500)} »`).toMatch(/(^|\D)50 g/);
    expect(t, `Choisir : « ${t.slice(0, 500)} »`).not.toMatch(/≈\s?4\s?chf|\b4 chf\b|\b1 kg\b/);
    expect(t, 'part dans À venir : le prix exact de 50 g (3,69 CHF rendu)').toMatch(/part dans a venir[^]{0,200}3[,.]6\d/);
  });
  it('valider « Choisir chez MotlerHops » envoie dans À venir le prix exact de 50 g (≈ 3,69 CHF), pas 0, ni 4 CHF arrondi', async () => {
    const plans: FinancialPlan[] = [];
    monter('houblons-citra', { ecrire: p => plans.push(p) });
    await attendre(150);
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    fireEvent.click(bouton(/^choisir chez/, ecran)!);
    await attendre(120);
    const p = plans.at(-1);
    const cents = p?.amountCents ?? -1;
    expect(plans.length, 'un plan À venir est écrit').toBeGreaterThan(0);
    expect(cents, `montant écrit : ${cents} centimes (attendu ≈ 369 : 3,72 € × 0,9183 × 1,081)`).toBeGreaterThanOrEqual(366);
    expect(cents, `montant écrit : ${cents} centimes`).toBeLessThanOrEqual(372);
  });
  it('Comparer ne propose pas non plus « Choisir · MotlerHops, 1 kg »', async () => {
    monter('houblons-citra'); await attendre(150);
    fireEvent.click(bouton(/^comparer$/)!);
    await attendre(60);
    const b = bouton(/^choisir/);
    expect(b, 'bouton Choisir de Comparer').toBeTruthy();
    expect(sans(lu(b!)), `bouton : « ${lu(b!)} »`).not.toMatch(/1 kg/);
  });
  it('garde : le tableau garde le CHF/kg de MotlerHops (≈73,9, jamais « ? ») et « à relire » pour Brau', async () => {
    monter('houblons-citra'); await attendre(150);
    expect(celluleKg(ligneDe(MOTLER))).toMatch(/73[,.][89]/);
    expect(sans(celluleKg(ligneDe(BRAU)))).toMatch(/relire/);
  });
});

/* ======================================================================================================== R101 : Embouteillage, la date du Planning */

/**
 * R101 (R73-25 ; R75-8) : le plan porte `date` 2027-07-01 et `fenetre` du 2027-04-26 au 2027-07-04 ; le carnet `date` 2027-04-26 ; la note dit « À faire du 01.05.2027 au 01.07.2027 ».
 * Quand dit « S26 » (la semaine du 1er juillet 2027, sans année) quand À faire dit « dès le 1 mai 2027 ». Règle : Quand dit la date comme À faire ; jamais une semaine sans année hors de l'année en cours (2026).
 */
describe('R101 · Embouteillage (plan du 26.04 au 04.07.2027) : Quand dit la date de À faire, avec son année', () => {
  const quand = () => [...document.querySelectorAll('button')].find(b => /^quand\b/.test(sans(lu(b))));
  const DATE_DITE = /(1(er)? mai 2027|26 avr\.? ?[–-] ?4 juil\.? ?2027)/;

  it('Quand dit « dès le 1 mai 2027 » ou « 26 avr. – 4 juil. 2027 », comme À faire', async () => {
    monter('embouteillage-planning');
    await attendre(150);
    const q = quand();
    expect(q, 'la ligne Quand du carnet').toBeTruthy();
    expect(sans(lu(q!)), `Quand : « ${lu(q!)} »`).toMatch(DATE_DITE);
  });
  it('Quand ne dit jamais une semaine sans année (« S26 ») : 2027 n\'est pas l\'année en cours', async () => {
    monter('embouteillage-planning');
    await attendre(150);
    const t = sans(lu(quand()));
    expect(t, `Quand : « ${lu(quand())} »`).not.toMatch(/\bs\d{1,2}\b/);
  });
  it('À faire et Quand disent la même date : la date de l\'étape « À faire du 01.05.2027 » se retrouve dans Quand', async () => {
    const d = releve('embouteillage-planning');
    const carnets = lireCarnets([d.carnet, ...d.messages] as never, { archives: true }).filter(c => c.id === d.carnet.id);
    const { container } = render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} messages={[]} onCocher={() => {}} onOuvrir={() => {}} onEcheance={() => {}} />);
    const afaire = sans(lu(container));
    cleanup();
    expect(afaire, `À faire : « ${afaire.slice(0, 300)} »`).toMatch(/mai 2027/);
    monter('embouteillage-planning');
    await attendre(150);
    expect(sans(lu(quand())), `À faire dit « ${afaire.slice(0, 120)} », Quand dit « ${lu(quand())} »`).toMatch(/mai 2027|26 avr/);
  });
  it('le budget reste dit une fois, avec son espace des milliers : « 2 500 CHF » (Quand ne l\'écrit pas « 2500 »)', async () => {
    monter('embouteillage-planning');
    await attendre(150);
    expect(sans(lu(quand())), `Quand : « ${lu(quand())} »`).toMatch(/2 500 chf/);
    expect(sans(lu(quand()))).not.toMatch(/2500/);
  });
});

/* ======================================================================================================== R102 : les autres R73-n et R75-n rouverts */

describe('R102 · Houblons citra : fiche, Comparer, Choisir (R73-6, R73-7, R73-9, R73-11, R73-13, R75-4, R75-5, R75-6)', () => {
  async function citra() { const m = monter('houblons-citra'); await attendre(150); return m; }

  it('R73-6 : sa note « Semble difficile à obtenir sur le site français » est sur la fiche MotlerHops (rattachée à l\'article)', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    expect(mots(document.body), `fiche : « ${lu(document.body).slice(0, 500)} »`).toMatch(/difficile a obtenir/);
  });
  it('R73-6 (garde) : ni la note corrigée ni sa bulle d\'origine ne disparaissent du carnet (« Semble difficile… » / « Ça semble dur… »)', async () => {
    await citra();
    expect(mots(document.body), `carnet : « ${lu(document.body).slice(0, 400)} »`).toMatch(/difficile a obtenir|dur a obtenir/);
  });
  it('R73-7 : Comparer écrit l\'α « 10–15 % », serré, jamais « 10 % - 15 % »', async () => {
    await citra();
    fireEvent.click(bouton(/^comparer$/)!);
    await attendre(60);
    expect(lu(document.body), `Comparer : « ${lu(document.body).slice(0, 400)} »`).not.toMatch(FOURCHETTE_ESPACEE);
  });
  it('R73-11 : l\'en-tête de Comparer accorde « 5 différents »', async () => {
    await citra();
    fireEvent.click(bouton(/^comparer$/)!);
    await attendre(60);
    expect(lu(document.body), `Comparer : « ${lu(document.body).slice(0, 200)} »`).toMatch(/\d+ différents/);
  });
  it('R73-13 : le bouton Choisir de Comparer est vert et nommé comme celui de la fiche (cn-action-vert)', async () => {
    await citra();
    fireEvent.click(bouton(/^comparer$/)!);
    await attendre(60);
    const b = bouton(/^choisir/)!;
    expect(b, 'bouton Choisir de Comparer').toBeTruthy();
    expect(b.className, `classes : « ${b.className} »`).toMatch(/cn-action-vert/);
    expect(sans(lu(b))).toMatch(/motler|citra/);
  });
  it('R73-9 : au Choisir, « en stock » n\'est dit qu\'une fois et MotlerHops deux fois au plus (la ligne, le bouton)', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const t = mots(await ouvrirChoisir());
    expect((t.match(/en stock/g) ?? []).length, `« en stock » dit ${(t.match(/en stock/g) ?? []).length} fois : « ${t} »`).toBeLessThanOrEqual(1);
    expect((t.match(/motlerhops/g) ?? []).length, `« MotlerHops » dit ${(t.match(/motlerhops/g) ?? []).length} fois : « ${t} »`).toBeLessThanOrEqual(2);
  });
  it('R75-4 : le même prix au kilo s\'écrit pareil au tableau, sur la fiche et au Choisir (73,80 ou ≈73,9, pas les deux)', async () => {
    await citra();
    const tab = /(\d+[,.]\d+)/.exec(celluleKg(ligneDe(MOTLER)))?.[1] ?? '';
    await ouvrirFiche(MOTLER);
    const fiche = /(\d+[,.]\d+)\s*CHF\/kg/.exec(lu(document.body))?.[1] ?? '';
    expect(tab && fiche, `tableau « ${tab} », fiche « ${fiche} »`).toBeTruthy();
    expect(Math.abs(parseFloat(tab.replace(',', '.')) - parseFloat(fiche.replace(',', '.'))), `tableau ≈${tab}, fiche ${fiche} CHF/kg : deux écritures du même chiffre`).toBeLessThan(0.05);
  });
  it('R75-5 : « Choisir » sur Brau (prix à relire) le dit, et son pourquoi n\'est pas seulement le nom du vendeur', async () => {
    await citra();
    await ouvrirFiche(BRAU);
    const ecran = await ouvrirChoisir();
    const t = mots(ecran);
    expect(t, `Choisir : « ${t.slice(0, 500)} »`).toMatch(/prix a relire/);
    const champ = ecran.querySelector('textarea') as HTMLTextAreaElement | null;
    const pourquoi = sans(champ?.value ?? lu(ecran.querySelector('.cn-pourquoi')));
    expect(pourquoi, `pourquoi : « ${pourquoi} »`).not.toMatch(/^brau- und rauchshop\.?$/);
  });
  it('R73-3 (garde) : valider « Choisir chez … » sur Brau n\'envoie pas 10 centimes dans À venir', async () => {
    const plans: FinancialPlan[] = [];
    monter('houblons-citra', { ecrire: p => plans.push(p) });
    await attendre(150);
    await ouvrirFiche(BRAU);
    const ecran = await ouvrirChoisir();
    fireEvent.click(bouton(/^choisir chez/, ecran)!);
    await attendre(100);
    expect(plans.at(-1)?.amountCents, 'plan écrit').not.toBe(10);
  });
  it('R75-6 : la chasse fixe est réservée aux chiffres : « États-Unis » au Choisir n\'est pas en chasse fixe', async () => {
    await citra();
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    const mono = [...ecran.querySelectorAll('.cn-mono')].map(e => lu(e)).filter(t => /[a-zà-ÿ]{4,}/i.test(t));
    expect(mono, 'textes de mots en chasse fixe (.cn-mono) au Choisir').toEqual([]);
  });
});

describe('R102 · Embouteillage (import du Planning) : 1re bulle, pastille (R73-23, R73-24)', () => {
  it('R73-23 : le titre, les dates et « (Planning, Équipements) » ne sont pas redits dans le fil après l\'en-tête', async () => {
    monter('embouteillage-planning');
    await attendre(150);
    const t = mots(document.querySelector('.cn-ouvert') ?? document.body);
    const nTitre = t.split('embouteillage — station complete (2027)'.replace('—', '—')).length - 1;
    expect(nTitre, `le titre est dit ${nTitre} fois : « ${t.slice(0, 500)} »`).toBeLessThanOrEqual(1);
    const nPlanning = (t.match(/\(planning, equipements\)/g) ?? []).length;
    expect(nPlanning, `« (Planning, Équipements) » dit ${nPlanning} fois : « ${t.slice(0, 500)} »`).toBeLessThanOrEqual(1);
    expect((t.match(/budget du planning/g) ?? []).length, 'le budget du Planning n\'est pas recopié en vrac dans le fil').toBe(0);
  });
  it('R73-24 : un carnet « Dans À venir » ne porte pas la pastille « Idée · 3 sept. »', async () => {
    monter('embouteillage-planning');
    await attendre(150);
    const t = mots(document.body);
    expect(t, `écran : « ${t.slice(0, 300)} »`).toMatch(/dans a venir/);
    expect(t, `écran : « ${t.slice(0, 300)} »`).not.toMatch(/idee . 3 sept/);
  });
  it('R73-24 : le coup d\'œil de la liste compte Embouteillage (Dans À venir) parmi les « décidés »', async () => {
    monter('embouteillage-planning', { ouvrir: false, tous: true });
    await attendre(200);
    const decides = document.querySelector('.cnl-case[data-etat="decide"] b');
    expect(decides, `coup d'œil : « ${lu(document.body).slice(0, 200)} »`).toBeTruthy();
    expect(parseInt(lu(decides), 10), 'carnets décidés').toBeGreaterThanOrEqual(1);
  });
});
