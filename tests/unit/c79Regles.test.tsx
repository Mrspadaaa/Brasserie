// @vitest-environment jsdom
/**
 * Voie c79-tests (25.11) : les tests ROUGES des règles R110 à R112, écrits AVANT tout correctif (celui qui corrige n'écrit pas le test, L17).
 * Source : voies/c79-releve/RESULTAT.md (EXA encore là : 1, 2, 4, 5, 6, 7, 9, 10, 11 sur 11 au tour 79) et BUGS.md (lignes EXA-n).
 * Données : les VRAIS documents de ses 12 carnets ZZ (tests/fixtures/c79/*.json), chargés tels quels dans le magasin et montés par CarnetsVue (un geste réel).
 * Seules exceptions, dites au test : la proposition de l'IA qu'on rejoue (SIMULÉE : la forme de `propositionsSuivi`, les valeurs que la tâche écrite porte), un carnet « Chambre froide »
 * réduit à la note que dit le message du frigo (EXA-2), une phrase « semaine du 14 déc. » (variante de la phrase réelle d'EXA-11).
 * Aucun réseau, aucun Gemini (AiClient lève s'il est appelé). jsdom ne mesure aucune boîte : EXA-1 (feuille ⋯ sous l'en-tête, position en pixels) reste à voir en ligne.
 *
 *  - R110 (EXA-11, EXA-9 ; 3e retour après C71-1 et C73-1) : une tâche dont la phrase dit une date garde CETTE date ; la carte la dit, « À faire » la range par sa vraie date et la dit ;
 *    une donnée déjà fausse (30.11 « mois », 23.11 « semaine ») s'affiche avec la date de la phrase, ou « date à revoir ».
 *  - R111 : EXA-2 (supprimer ne retire pas la note d'un autre carnet), EXA-4 (carte Reclasser sur la levure), EXA-5 (nom court d'une option), EXA-6 (toute bulle a son ⋯),
 *    EXA-7 (carte Résolu : picto et remède), EXA-10 (« Pourquoi … ? » seulement quand le fil ne le dit pas).
 *  - R112 : EXA-3 (Reclasser du malt, ancien format) et EXA-8 (Ajouter, brouillon).
 *
 * POURQUOI LES TESTS DE c70, c71 ET c73 ÉTAIENT VERTS ALORS QUE LES DEUX TÂCHES ÉTAIENT FAUSSES EN LIGNE (faux verts, L28 : « une vraie pièce, champ par champ ») :
 *  1. Leurs phrases portaient le mois en TOUTES LETTRES (« avant le 12 décembre », « la semaine du 14 décembre »). Les phrases du brasseur disent « déc. » (« avant le 31 déc. », « le samedi 6 déc. au matin ») :
 *     `tacheDatee` lit un nom de mois entier, jamais « déc. », et ne lit pas un jour sans marqueur (« le samedi 6 déc. au matin ») ni « dans 2 semaines ».
 *  2. Leur oracle posait une phrase ET une proposition qui disaient la même date : jamais une proposition de l'IA qui contredit la phrase (30.11 « mois », 23.11 « semaine »), qui est ce que l'IA écrit en vrai.
 *  3. Leur liste « À faire » lisait une tâche construite à la main, jamais celle que « À faire » écrit depuis la carte : la chaîne proposition → geste → donnée → liste n'était pas jouée.
 *  4. La ligne de la liste ne disait la date que sous « Un jour » (`quandDite`) : une tâche rangée « Fin du mois » ou « Cette semaine » ne la dit jamais, et aucun test ne lisait la ligne entière.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets, lireMessages } from '../../src/domain/carnets/modele';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: true, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { cleanup(); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof magasinMemoire>[0][number];
/** Le jour du relevé en ligne (mercredi 25.11.2026) : « maintenant » de la vue. */
const MAINT = () => new Date('2026-11-25T12:00:00.000Z');
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

interface Doc { id: string; title: string; type: string; carnet: Record<string, any> }
interface Releve { carnet: Doc; messages: Array<{ id: string; carnetMessage: Record<string, any> } & Item>; taches: unknown[] }
const NOMS = {
  assurance: 'zz-assurance-a-renouveler', co2: 'zz-co2-qui-baisse-vite', ecoulement: 'zz-ecoulement-qui-fuit', fete: 'zz-fete-de-la-biere', frigo: 'zz-frigo-de-garde-en',
  fusible: 'zz-inspection-electrique-fusible', levure: 'zz-levure-lente-a-demarrer', malt: 'zz-malt-pilsner-en-rupture', soufre: 'zz-odeur-de-soufre-dans', pompe: 'zz-pompe-qui-chauffe',
  cave: 'zz-ranger-la-cave', vapeur: 'zz-trop-de-vapeur-au'
} as const;
type Nom = keyof typeof NOMS;
/** Le document réel, tel qu'il est dans le fichier (aucune retouche). */
const releve = (nom: Nom): Releve => JSON.parse(readFileSync(`tests/fixtures/c79/${NOMS[nom]}.json`, 'utf8')) as Releve;

interface Montage { ouvrir?: boolean; plus?: Releve[]; items?: Item[] }
function monter(d: Releve, o: Montage = {}) {
  const tous = [d, ...(o.plus ?? [])];
  const magasin = magasinMemoire([...tous.flatMap(x => [x.carnet, ...x.messages]), ...(o.items ?? [])] as never[]);
  const r = render(
    <CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] } as never} mode={'simule' as never} appels={horsLigne} aides={aidesCarnet('simule' as never, {})}
      maintenant={MAINT} ecrirePlan={(() => {}) as never} {...(o.ouvrir === false ? {} : { ouvrir: { id: d.carnet.id, at: 1 } })} />
  );
  return { magasin, ...r };
}
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;

/** La tâche écrite par « À faire » est retirée du document réel et rendue à l'état de PROPOSITION de l'IA (SIMULÉE : la forme de `propositionsSuivi`, texte et date que la tâche écrite porte :
 *  l'IA propose la date de la semaine ou du mois en cours, jamais celle de la phrase). Le message, le carnet, tout le reste : le document réel. */
function enProposition(d: Releve, messageId: string, changer?: { phrase?: string }): Releve {
  const o = clone(d);
  const t = (o.carnet.carnet.taches ?? [])[0] as { id: string; texte: string; echeance: string; precision: string; origine: string };
  o.carnet.carnet.taches = [];
  o.carnet.carnet.suivi.evenements = o.carnet.carnet.suivi.evenements.filter((e: { sorte: string }) => e.sorte !== 'tache');
  const m = o.messages.find(x => x.id === messageId)!;
  if (changer?.phrase) m.carnetMessage.texte = changer.phrase;
  m.carnetMessage.propositionsSuivi = [{ sorte: 'tache', carnetId: o.carnet.id, texte: changer?.phrase ?? t.texte, echeance: t.echeance, precision: t.precision, origine: 'ia' }];
  return o;
}
const carte = () => document.querySelector('[data-proposition="tache"]') as HTMLElement | null;
async function accepterAFaire() {
  const c = carte();
  expect(c, `la carte « tâche proposée » est à l'écran : « ${lu(document.body).slice(0, 260)} »`).toBeTruthy();
  fireEvent.click(bouton(/^a faire$/, c!)!);
  await attendre(120);
}
async function ouvrirListeAFaire() {
  const retour = bouton(/^carnets$/);
  if (retour) { fireEvent.click(retour); await attendre(80); }
  const onglet = [...document.querySelectorAll('[role="tab"]')].find(b => /^a faire/.test(sans(lu(b)))) as HTMLElement | undefined;
  expect(onglet, `l'onglet « À faire » de la liste : « ${lu(document.body).slice(0, 200)} »`).toBeTruthy();
  fireEvent.click(onglet!);
  await attendre(80);
}
/** La ligne de la liste « À faire » qui porte ce texte : son groupe (clé), la ligne entière, et `dit` : ce que la sous-ligne ajoute AU TEXTE de la tâche (la date que la phrase porte déjà dans le texte ne compte pas : faux vert d'un premier jet). */
function ligneAFaire(re: RegExp): { groupe: string; ligne: string; dit: string; groupes: string } {
  const lignes = [...document.querySelectorAll('li.af-ligne')] as HTMLElement[];
  const l = lignes.find(x => re.test(sans(lu(x))));
  const groupes = [...document.querySelectorAll('section.af-groupe')].map(s => `${s.getAttribute('data-groupe')}[${[...s.querySelectorAll('li')].map(lu).join(' ; ')}]`).join(' | ');
  expect(l, `la ligne ${re} dans « À faire » : ${groupes || lu(document.body).slice(0, 220)}`).toBeTruthy();
  return { groupe: l!.closest('section.af-groupe')?.getAttribute('data-groupe') ?? '?', ligne: lu(l), dit: lu(l!.querySelector('.af-sous')) + ' ' + lu(l!.querySelector('.af-jeton')), groupes };
}

/* ======================================================================================================== R110 : la tâche garde la date de sa phrase */

/** Chaque cas : le document réel, le message qui porte la phrase, ce que la phrase dit (jour, ou sa semaine), et les groupes où la tâche ne doit PAS être. */
const CAS_DATES = [
  { nom: 'assurance' as Nom, msg: 'MSG-c79-48', tache: /renouveler l'assurance/, dit: /\b(31|28)\s+d[ée]c/i, lib: '31 déc. (ou sa semaine, du 28)', pasDans: ['cette-semaine', 'fin-du-mois'], phrase: '« avant le 31 déc. »' },
  { nom: 'cave' as Nom, msg: 'MSG-c79-56', tache: /ranger la cave/, dit: /\b6\s+d[ée]c|sem\.?\s+du\s+30\s+nov/i, lib: '6 déc. (ou sa semaine, du 30 nov.)', pasDans: ['cette-semaine'], phrase: '« le samedi 6 déc. au matin »' },
  { nom: 'soufre' as Nom, msg: 'MSG-c79-60', tache: /sentir a nouveau avant la mise en fut/, dit: /\b(7|9)\s+d[ée]c/i, lib: '9 déc. (ou sa semaine, du 7)', pasDans: ['cette-semaine', 'fin-du-mois'], phrase: '« dans 2 semaines » (écrit le 25.11)' }
];

describe.each(CAS_DATES)('R110 · $nom : la tâche de $phrase garde sa date', c => {
  it('la carte « tâche proposée » dit la date de la phrase (la proposition de l\'IA, SIMULÉE, porte la semaine ou le mois en cours)', async () => {
    monter(enProposition(releve(c.nom), c.msg));
    await attendre(150);
    const k = carte();
    expect(k, `aucune carte « tâche proposée » : « ${lu(document.body).slice(0, 260)} »`).toBeTruthy();
    const ajoute = lu(k).split(lu(k!.querySelector('p'))).join(''); // la carte SANS le texte de la tâche : la date que le texte porte déjà ne compte pas
    expect(sans(ajoute), `la carte dit : « ${lu(k)} » ; ce qu'elle ajoute au texte : « ${ajoute} » ; attendu : ${c.lib}`).toMatch(c.dit);
  });
  it('chemin complet : proposition → « À faire » → donnée → liste « À faire » : la ligne est rangée par la date de la phrase et la dit', async () => {
    monter(enProposition(releve(c.nom), c.msg));
    await attendre(150);
    await accepterAFaire();
    await ouvrirListeAFaire();
    const l = ligneAFaire(c.tache);
    expect(sans(l.dit), `ligne : « ${l.ligne} » (groupe ${l.groupe}) ; sous le texte : « ${l.dit} » ; attendu : ${c.lib}`).toMatch(c.dit);
    expect(c.pasDans, `groupe « ${l.groupe} » : la date de la phrase (${c.lib}) n'est pas là`).not.toContain(l.groupe);
  }, 20000);
  it('la donnée déjà écrite fausse (rangée « mois » ou « semaine » du mois en cours) s\'affiche avec la date de la phrase, ou « date à revoir »', async () => {
    monter(releve(c.nom), { ouvrir: false });
    await attendre(150);
    await ouvrirListeAFaire();
    const l = ligneAFaire(c.tache);
    expect(sans(l.dit), `ligne : « ${l.ligne} » (groupe ${l.groupe}) ; sous le texte : « ${l.dit} » ; attendu : ${c.lib}, ou « date à revoir »`).toMatch(new RegExp(`${c.dit.source}|date a revoir`, 'i'));
    expect(c.pasDans, `groupe « ${l.groupe} » : une tâche dont la phrase dit ${c.lib} n'est pas là`).not.toContain(l.groupe);
  }, 20000);
});

describe('R110 · « semaine du 14 déc. » (SIMULÉ : variante de la phrase réelle d\'EXA-11, mois abrégé comme chez le brasseur)', () => {
  it('chemin complet : la tâche est rangée au 14 déc. et la ligne le dit, la proposition de l\'IA disant fin novembre', async () => {
    const d = enProposition(releve('assurance'), 'MSG-c79-48', { phrase: 'Renouveler l’assurance la semaine du 14 déc.' });
    monter(d);
    await attendre(150);
    await accepterAFaire();
    await ouvrirListeAFaire();
    const l = ligneAFaire(/renouveler l'assurance/);
    expect(sans(l.dit), `ligne : « ${l.ligne} » (groupe ${l.groupe}) ; sous le texte : « ${l.dit} »`).toMatch(/\b14\s+dec/i);
    expect(['cette-semaine', 'fin-du-mois'], `groupe « ${l.groupe} »`).not.toContain(l.groupe);
  }, 20000);
});

/* ======================================================================================================== R111 */

describe('R111 · EXA-6 : chaque bulle du fil a son ⋯ (modifier, supprimer), même rangée en façon, critère ou article, même mêlée', () => {
  it.each(['co2', 'ecoulement', 'fete', 'soufre', 'frigo'] as Nom[])('%s : aucune bulle du fil sans ⋯', async nom => {
    monter(releve(nom));
    await attendre(150);
    const sansPlus = [...document.querySelectorAll('[data-message]')].filter(b => lu(b.querySelector('.cnp-texte-court')) && !b.querySelector('button[aria-label$="actions"]')).map(b => lu(b.querySelector('.cnp-texte-court')));
    expect(sansPlus, 'bulles sans ⋯ (ni modifier, ni supprimer)').toEqual([]);
  });
});

describe('R111 · EXA-2 (B) : supprimer une bulle depuis un carnet ne retire pas la note d\'un autre carnet', () => {
  it('« Fûts déplacés dans la chambre froide en attendant. » (frigo, sa note vit dans « Chambre froide ») : Supprimer depuis le frigo laisse la note dans Chambre froide, ou le dit avant', async () => {
    /* SIMULÉ : « Chambre froide » (carnet de ses vrais carnets, non versé) réduit à la note que dit le message du frigo (NOTE-c79-20). */
    const chambre = { id: 'CARNET-c79-06', type: 'carnet', title: 'Chambre froide', status: 'idea', carnet: { version: 1, creeLe: '2026-11-01T08:00:00.000Z', phrase: 'Chambre froide', criteres: [], facons: [], articles: [], photos: [],
      genre: { valeur: 'achat', origine: 'ia' }, notes: [{ id: 'NOTE-c79-20', texte: 'Fûts déplacés dans la chambre froide en attendant.', messageId: 'MSG-c79-27', genre: 'note' }] } } as unknown as Item;
    const m = monter(releve('frigo'), { items: [chambre] });
    await attendre(150);
    const bulle = [...document.querySelectorAll('[data-message="MSG-c79-27"]')][0] as HTMLElement | undefined;
    expect(bulle, `la bulle du message dans le fil du frigo : « ${lu(document.body).slice(0, 300)} »`).toBeTruthy();
    const plus = bulle!.querySelector('button[aria-label$="actions"]') as HTMLElement | null;
    expect(plus, 'le ⋯ de cette bulle (sans lui, ni modifier ni supprimer : EXA-6)').toBeTruthy();
    fireEvent.click(plus!);
    await attendre(60);
    fireEvent.click(bouton(/^supprimer/)!);
    await attendre(120);
    const dit = sans(lu(document.body));
    const reste = lireCarnets(m.magasin.lire() as never, { archives: true }).find(x => x.id === 'CARNET-c79-06')?.carnet.notes.some(n => n.id === 'NOTE-c79-20');
    expect(reste || /chambre froide/.test(dit.replace(/dans la chambre froide en attendant/g, '')), `Chambre froide a perdu sa note sans que l'écran le dise : « ${dit.slice(0, 260)} »`).toBeTruthy();
  }, 20000);
});

describe('R111 · EXA-4 : la carte « Reclasser ce carnet ? » propose le critère né d\'une phrase (levure : « réhydrater la levure, ensemencer à 18 °C. »)', () => {
  it('la levure garde ce critère de la donnée ; la carte Reclasser est à l\'écran et nomme la phrase', async () => {
    const d = releve('levure');
    expect((d.carnet.carnet.criteres as Array<{ origine: string; texte: string }>).some(k => k.origine === 'locale' && /rehydrater/.test(sans(k.texte))), 'le document réel porte le critère né de la phrase').toBe(true);
    monter(d);
    await attendre(150);
    const cartes = [...document.querySelectorAll('*')].filter(e => /reclasser ce carnet ?\?/.test(sans([...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' '))));
    expect(cartes.length, `aucune carte « Reclasser ce carnet ? » : « ${lu(document.body).slice(0, 260)} »`).toBeGreaterThan(0);
    expect(sans(lu(cartes[0].parentElement)), 'la carte nomme la phrase ou son critère').toMatch(/rehydrater|ensemencer/);
  });
});

describe('R111 · EXA-5 : une option a un nom court, jamais la phrase entière (« Raccord gaz », « Steam condenser »)', () => {
  it.each(['co2', 'vapeur', 'levure'] as Nom[])('%s : hors des bulles du fil, l\'écran ne nomme aucune option par sa phrase de plus de 45 caractères', async nom => {
    const d = releve(nom);
    monter(d);
    await attendre(150);
    const facons = (d.carnet.carnet.facons as Array<{ nom: string }>).map(f => f.nom).filter(n => n.length > 45);
    expect(facons.length, 'le document réel porte une option nommée par sa phrase').toBeGreaterThan(0);
    const hors = document.body.cloneNode(true) as HTMLElement;
    hors.querySelectorAll('[data-message]').forEach(b => b.remove());
    const texte = lu(hors);
    expect(facons.filter(n => texte.includes(n)), `options nommées par toute leur phrase hors du fil : « ${texte.slice(0, 400)} »`).toEqual([]);
  });
});

describe('R111 · EXA-7 : la carte Résolu de la levure a le picto de la levure et le remède du fil', () => {
  it('le picto de l\'option fermée est celui de la levure (sachet), pas un frigo', async () => {
    monter(releve('levure'));
    await attendre(150);
    const p = document.querySelector('.cnp-resolu .cnp-fermees [data-picto]');
    expect(p, 'le picto de l\'option fermée').toBeTruthy();
    expect(p!.getAttribute('data-picto'), `picto « ${p!.getAttribute('data-picto')} » pour « Pistes : levure sèche… »`).toBe('sachet');
  });
  it('la carte Résolu dit le remède du fil (« Monté à 19 °C, la fermentation démarre le lendemain. »), comme la pompe dit « Fermé : … »', async () => {
    monter(releve('levure'));
    await attendre(150);
    const k = document.querySelector('.cnp-resolu .cnp-tampon');
    expect(k, 'la carte Résolu').toBeTruthy();
    expect(sans(lu(k)), `carte : « ${lu(k)} »`).toMatch(/monte a 19|19\s?°c|fermentation demarre/);
  });
});

describe('R111 · EXA-10 : « Pourquoi … ? Tes notes ne le disent pas » seulement quand le fil ne le dit pas', () => {
  it.each([
    ['co2', 'le fil dit « Test à l’eau savonneuse : bulles au raccord gaz. »'],
    ['vapeur', 'le fil dit « Humidificateur finalement pas utile. » et l\'option écartée porte « finalement pas utile »'],
    ['malt', 'la façon porte sa raison « en stock »']
  ] as Array<[Nom, string]>)('%s : %s', async (nom, _pourquoi) => {
    monter(releve(nom));
    await attendre(150);
    expect(sans(lu(document.body)), `écran : « ${lu(document.body).slice(0, 420)} »`).not.toMatch(/tes notes ne le disent pas/);
  });
  it('malt, carnet Résolu : aucune question « Pourquoi … ? » sur un carnet résolu', async () => {
    monter(releve('malt'));
    await attendre(150);
    expect(document.querySelector('.cnp-resolu'), 'le carnet est Résolu').toBeTruthy();
    expect(sans(lu(document.body)), `écran : « ${lu(document.body).slice(0, 420)} »`).not.toMatch(/pourquoi .* \?/);
  });
  it('malt, relecture « Résolus en 2026 » : « pourquoi » dit la raison « en stock », jamais « tes notes ne le disent pas »', async () => {
    monter(releve('malt'));
    await attendre(150);
    const relire = bouton(/^relire/);
    expect(relire, 'le bouton « Relire » des Résolus').toBeTruthy();
    fireEvent.click(relire!);
    await attendre(120);
    const t = sans(lu(document.body));
    expect(t, `relecture : « ${t.slice(0, 420)} »`).not.toMatch(/tes notes ne le disent pas/);
  });
});

/* ======================================================================================================== R112 */

/** La carte « Reclasser ce carnet ? » : le plus petit élément qui porte ce titre ET un bouton « Reclasser ». null si absente. */
function carteReclasser(): HTMLElement | null {
  const propre = (e: Element) => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ');
  const titres = [...document.querySelectorAll('*')].filter(e => /reclasser ce carnet ?\?/.test(sans(propre(e))));
  for (const t of titres) { let e: Element | null = t; while (e && e !== document.body) { if (bouton(/^reclasser/, e)) return e as HTMLElement; e = e.parentElement; } }
  return null;
}

describe('R112 · EXA-3 : Reclasser le malt d\'ancien format (document réel de c75, avant le tour 78) propose le problème, le résolu et la tâche', () => {
  /** L'état ancien n'existe plus en ligne (refait à la main au tour 78) : il est dans tests/fixtures/c75/zz-malt-pilsner.json, relevé en ligne le 25.11 et chargé tel quel. */
  const ancien = () => JSON.parse(readFileSync('tests/fixtures/c75/zz-malt-pilsner.json', 'utf8')) as Releve;
  it.each([
    ['« Idée » devient « Problème »', /probleme/],
    ['le carnet devient « Résolu » (« Commandé 2 sacs chez l\'autre, brassin maintenu. »)', /resolu/],
    ['« Brassin du 3 déc. à décaler » est proposé en tâche', /(tache|a faire).*decaler|decaler.*(tache|a faire)/]
  ] as Array<[string, RegExp]>)('la carte dit : %s', async (_dit, re) => {
    monter(ancien());
    await attendre(150);
    const k = carteReclasser();
    expect(k, `aucune carte « Reclasser ce carnet ? » : « ${lu(document.body).slice(0, 300)} »`).toBeTruthy();
    expect(sans(lu(k)), `carte : « ${lu(k)} »`).toMatch(re);
  });
});

describe('R112 · EXA-8 : « Ajouter » sous « Déjà un carnet proche » vide le brouillon ; la phrase n\'atterrit pas dans un autre carnet (écritures SIMULÉES : magasin en mémoire)', () => {
  async function ajouterLaPhraseDeLaCave() {
    monter(releve('cave'), { ouvrir: false, plus: [releve('soufre')] });
    await attendre(150);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: 'ZZ TEST — ranger la cave' } });
    await attendre(400);
    expect(lu(document.body), 'la liste dit « Déjà un carnet proche » (le document réel du carnet proche est monté)').toMatch(/Déjà un carnet proche : ZZ TEST — ranger la cave/);
    fireEvent.click([...document.querySelectorAll('button')].find(b => lu(b) === 'Ajouter')!);
    await attendre(500);
    return champ;
  }
  const retourListe = async () => { fireEvent.click(bouton(/^carnets$/)!); await attendre(300); };
  it('retour à la liste après « Ajouter » : le champ est vide (le brouillon est vidé, ou « Ajouter » a dit ce qu\'il fait)', async () => {
    await ajouterLaPhraseDeLaCave();
    await retourListe();
    const champ = document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    expect(champ.value, `champ de la liste : « ${champ.value} » ; brouillons : ${JSON.stringify(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))}`).toBe('');
  });
  it('un autre carnet (soufre) ne montre ni « va atterrir ici · tiré de votre phrase », ni la phrase dans son champ', async () => {
    await ajouterLaPhraseDeLaCave();
    await retourListe();
    const ligne = [...document.querySelectorAll('button')].find(b => /odeur de soufre/.test(lu(b)) && !/Ajouter/.test(lu(b)));
    expect(ligne, 'la ligne du soufre dans la liste').toBeTruthy();
    fireEvent.click(ligne!);
    await attendre(400);
    const champ = document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    expect(sans(lu(document.body)), `écran du soufre : « ${lu(document.body).slice(0, 380)} »`).not.toMatch(/va atterrir ici/);
    expect(champ.value, 'champ du soufre').toBe('');
  });
});

/* ======================================================================================================== sans objet : EXA-1 */
/**
 * EXA-1 (B) : « Modifier » à y −1 et « Changer en façon » à y 51 sous la barre Matériel/Carnets : c'est la POSITION de la feuille ⋯ dans la page à 390 px (`.cn-feuille-ancre`, `position:absolute; top:-10px`,
 * `useEntiere` ne corrige que le bas). jsdom ne calcule aucune boîte (getBoundingClientRect rend 0 partout) et n'applique pas le CSS de l'app : un test ici passerait ou échouerait quelle que soit la position.
 * Aucun test rouge honnête : à voir en ligne, à 390 px, avec `elementFromPoint` sur chaque geste de la feuille (la méthode de voies/exemples-a et c79-releve).
 */
