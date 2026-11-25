// @vitest-environment jsdom
/**
 * Voie c77-tests (25.11) : les tests ROUGES des règles R103 à R106, écrits AVANT tout correctif (celui qui corrige n'écrit pas le test, L17).
 * Source : work/missions/2026-11-23-reprise-soir/voies/reel-77/RESULTAT.md (lignes R77-n, R73-n et R75-n rouverts de BUGS.md).
 * Données : les VRAIS documents de ses carnets, tests/fixtures/c75/{houblons-citra,embouteillage-planning}.json, chargés TELS QUELS.
 * Les autres carnets (Frigo, Sol, projets de dates diverses, Chambre froide) sont construits en copiant la FORME EXACTE de ces documents (mêmes champs),
 * dates ou valeurs changées : tests/fixtures/c77/chambre-froide.json (champ `_releve` : d'où viennent les valeurs) ; les carnets datés sont copiés en mémoire d'embouteillage-planning.json.
 * Par le composant (CarnetsVue, AFaire montés, un geste réel). Aucun réseau, aucun Gemini. jsdom ne mesure aucune boîte : le rendu à 390 px reste à voir en ligne.
 *
 *  - R103 (R77-1) : dans Comparer, la ligne « prix CHF » dit le prix du conditionnement (≈3,7 CHF les 50 g), jamais le prix au kilo (73,8) ; le prix au kilo a sa propre ligne « CHF/kg ».
 *  - R104 (R77-2) : une valeur que le carnet montre (arômes lus) est la même sur la fiche et dans Comparer ; jamais « Non publié » / « ? » quand une autre surface la connaît.
 *  - R105 (R73-25, 2e retour : le correctif c75 n'a tenu que pour Embouteillage) : la RÈGLE, pas l'exemple : toute date hors de l'année en cours dit son année partout
 *    (Quand, À faire, liste des carnets), quelle que soit sa forme ; 6 formes + variantes ; et une date de l'année en cours ne dit pas l'année (« jamais l'année partout », CT4-A-13).
 *  - R106 : les autres R77-n (3 à 8) et les R73/R75 rouverts (R73-9, R73-10, R73-13, R75-3, R75-6) par le composant sur les documents.
 *    Non couverts ici (aucun document ne les porte, ou jsdom ne les mesure pas) : R73-8, R73-14, R73-15, R73-18 (mise en page), R73-12 (deux « 1 » : il faut un critère « Volume »),
 *    R73-17 et R75-7 (liens de Frigo et de l'armoire : aucun document relevé), R73-19 à R73-21 (ZZ à retirer de ses données), R73-23/24 sur Sol (aucun document), R73-30 et R73-31 (ordre de la liste).
 * Normalisation : le texte lu ET l'attendu passent par `sans` (NFKC, espaces insécables réunis, apostrophes droites, accents et casse ôtés).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';
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
afterEach(() => { cleanup(); vi.useRealTimers(); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof magasinMemoire>[0][number];
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const mots = (e: Element | null | undefined) => sans(lu(e));
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

interface Releve { carnet: Item & { id: string; title: string; carnet: { articles: Array<{ nom: string }> } }; messages: Item[]; articles: unknown[]; plan: FinancialPlan | null }
/** Le document réel (c75), tel qu'il est dans le fichier, ou celui construit à sa forme (c77). */
const releve = (dossier: 'c75' | 'c77', nom: string): Releve => JSON.parse(readFileSync(`tests/fixtures/${dossier}/${nom}.json`, 'utf8')) as Releve;
const citra = () => releve('c75', 'houblons-citra');
const embouteillage = () => releve('c75', 'embouteillage-planning');
const chambre = () => releve('c77', 'chambre-froide');

interface Montage { ouvrir?: boolean; ecrire?: (p: FinancialPlan) => void; auj?: string; sansPoser?: boolean }
function monter(d: Releve, o: Montage = {}) {
  if (!o.sansPoser) poserQuantitePour(d.carnet.title, 1);
  const magasin = magasinMemoire([d.carnet, ...d.messages] as never[]);
  const plans = d.plan ? [d.plan] : [];
  const instant = () => new Date(o.auj ? `${o.auj}T12:00:00.000Z` : MAINTENANT_SUIVI);
  return render(
    <CarnetsVue magasin={magasin} finances={{ plans, transactions: [], payments: [] } as never} mode={'simule' as never} appels={horsLigne} aides={aidesCarnet('simule' as never, {})}
      maintenant={instant} ecrirePlan={((p: FinancialPlan) => o.ecrire?.(p)) as never} {...(o.ouvrir === false ? {} : { ouvrir: { id: d.carnet.id, at: 1 } })} />
  );
}
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const rangs = () => [...document.querySelectorAll('button.cn-tab-ligne')] as HTMLElement[];
const ligneDe = (re: RegExp) => rangs().find(l => re.test(sans(lu(l))))!;
const MOTLER = /motler/;
const BRAU = /citra 13/;
async function ouvrirFiche(re: RegExp) { const l = ligneDe(re); expect(l, `la ligne ${re} du tableau : ${rangs().map(lu).join(' | ')}`).toBeTruthy(); fireEvent.click(l); await attendre(50); }
async function ouvrirChoisir() {
  const b = bouton(/^choisir/);
  expect(b, 'le bouton « Choisir » de la fiche').toBeTruthy();
  fireEvent.click(b!);
  await attendre(50);
  return document.querySelector('.cn-choisir') as HTMLElement;
}
async function ouvrirComparer() {
  const b = bouton(/^comparer$/);
  expect(b, 'le bouton « Comparer » du carnet').toBeTruthy();
  fireEvent.click(b!);
  await attendre(60);
}
/** Une ligne du tableau de Comparer par son en-tête (« prix CHF », « Arômes »…) : ses cellules, dans l'ordre des colonnes (article 1, article 2). */
function ligneComparer(re: RegExp): { entete: string; cellules: HTMLElement[] } | null {
  for (const tr of document.querySelectorAll('table.cn-tableau-comparer tbody tr')) {
    const th = tr.querySelector('th[scope="row"]');
    if (th && re.test(sans(lu(th)))) return { entete: lu(th), cellules: [...tr.querySelectorAll('td')] as HTMLElement[] };
  }
  return null;
}
const entetesComparer = () => [...document.querySelectorAll('table.cn-tableau-comparer tbody tr th[scope="row"]')].map(t => lu(t));

/* ======================================================================================================== R103 : Comparer, « prix CHF » = le prix du conditionnement */

/**
 * R103 (R77-1, B) : « prix CHF » affiche ≈73,8 pour MotlerHops : c'est le prix au KILO ; le sachet de 50 g coûte ≈3,69 CHF (fiche, Choisir). Un brasseur lit « 73,8 CHF ».
 * Règle : la ligne « prix CHF » dit le prix de ce qu'on achète (≈3,7 CHF les 50 g) ; le prix au kilo a sa ligne « CHF/kg » ; une seule unité par ligne.
 */
describe('R103 · Comparer (Houblons citra) : « prix CHF » est le prix du conditionnement, le prix au kilo a sa ligne', () => {
  it('la ligne « prix CHF » de MotlerHops ne dit pas 73,8 (le prix au kilo)', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/^prix/);
    expect(l, `lignes de Comparer : ${entetesComparer().join(' | ')}`).toBeTruthy();
    expect(lu(l!.cellules[0]), `ligne « ${l!.entete} » : « ${lu(l!.cellules[0])} »`).not.toMatch(/73[,.]8/);
  });
  it('la ligne « prix CHF » de MotlerHops dit le prix du sachet : ≈3,7 CHF (3,69 ou 3,72), les 50 g', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/^prix/);
    expect(l, `lignes de Comparer : ${entetesComparer().join(' | ')}`).toBeTruthy();
    expect(lu(l!.cellules[0]), `ligne « ${l!.entete} » : « ${lu(l!.cellules[0])} »`).toMatch(/3[,.]6\d|3[,.]7\d/);
  });
  it('le prix au kilo (≈73,8) a sa propre ligne, nommée « CHF/kg »', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/chf\s*\/\s*kg|au kilo|par kg/);
    expect(l, `aucune ligne « CHF/kg » : ${entetesComparer().join(' | ')}`).toBeTruthy();
    expect(lu(l!.cellules[0]), `ligne « ${l!.entete} » : « ${lu(l!.cellules[0])} »`).toMatch(/73[,.]8/);
  });
  it('une ligne, une unité : la ligne qui porte 73,8 ne s\'appelle pas « prix CHF » tout court', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const portent = [...document.querySelectorAll('table.cn-tableau-comparer tbody tr')].filter(tr => /73[,.]8/.test(lu(tr.querySelector('td')))).map(tr => lu(tr.querySelector('th')));
    expect(portent.length, `aucune ligne ne porte 73,8 : ${entetesComparer().join(' | ')}`).toBeGreaterThan(0);
    for (const e of portent) expect(sans(e), `la ligne qui porte 73,8 s'appelle « ${e} »`).toMatch(/kg/);
  });
});

/* ======================================================================================================== R104 : une valeur, une source de vérité */

/**
 * R104 (R77-2, B) : le carnet affiche « Arômes lus sur les pages : citron vert, mangue, fruits tropicaux » (lus sur la fiche de Brau, même variété Citra) ; la fiche MotlerHops dit
 * « Non publié par le vendeur : Arômes » sans puce, et Comparer met « ? » en Arômes pour MotlerHops. Règle : une valeur que le carnet montre est la même sur la fiche et dans Comparer.
 */
describe('R104 · Houblons citra : les arômes que le carnet montre sont sur la fiche et dans Comparer', () => {
  it('(le carnet les montre : « Arômes lus sur les pages » — l\'endroit déjà juste)', async () => {
    monter(citra()); await attendre(150);
    const bloc = document.querySelector('.cn-aromes');
    expect(mots(bloc), `bloc Arômes du carnet : « ${lu(bloc)} »`).toMatch(/citron vert.*mangue/);
  });
  it('la fiche MotlerHops ne dit pas « Non publié par le vendeur : Arômes »', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(MOTLER);
    expect(mots(document.body), `fiche : « ${lu(document.body).slice(0, 700)} »`).not.toMatch(/non publie par le vendeur\s*:?\s*aromes/);
  });
  it('la fiche MotlerHops montre les puces d\'arômes de la variété (citron vert, mangue)', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(MOTLER);
    expect(mots(document.body), `fiche : « ${lu(document.body).slice(0, 700)} »`).toMatch(/citron vert/);
  });
  it('Comparer : la cellule Arômes de MotlerHops n\'est pas « ? » : elle dit les arômes que l\'autre surface connaît', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/^aromes/);
    expect(l, `lignes de Comparer : ${entetesComparer().join(' | ')}`).toBeTruthy();
    expect(lu(l!.cellules[0]), `Arômes de MotlerHops : « ${lu(l!.cellules[0])} »`).not.toMatch(/^\?$/);
    expect(mots(l!.cellules[0]), `Arômes de MotlerHops : « ${lu(l!.cellules[0])} »`).toMatch(/citron vert/);
  });
  it('la même valeur partout : les arômes de chaque article, dans Comparer, sont ceux de sa fiche', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/^aromes/);
    const cellules = [mots(l!.cellules[0]), mots(l!.cellules[1])];
    cleanup();
    for (const [i, re] of [MOTLER, BRAU].entries()) {
      monter(citra()); await attendre(150);
      await ouvrirFiche(re);
      const fiche = mots(document.body);
      expect(cellules[i].replace(/^\?$/, ''), `Comparer, article ${i + 1} : « ${cellules[i]} »`).toBeTruthy();
      expect(fiche, `fiche de l'article ${i + 1} : « ${fiche.slice(0, 500)} » ; Comparer : « ${cellules[i]} »`).toContain(cellules[i].split(',')[0].trim());
      cleanup();
    }
  });
});

/* ======================================================================================================== R105 : la date, la règle sur toutes ses formes */

/**
 * R105 (R73-25, 2e retour : le correctif c75 n'a tenu que pour Embouteillage, surapprentissage). RÈGLE : toute date hors de l'année en cours dit son année partout
 * (Quand, À faire, liste des carnets), quelle que soit sa forme : semaine, plage, date seule, mois, Planning importé ou non. Une date de l'année en cours ne dit pas l'année.
 *
 * Le contrôle ne connaît AUCUNE chaîne attendue : il lit chaque date écrite sur l'écran (semaine « S17 », « 1 mai », « vers sept. », « fin mars »), la rattache au jour que le carnet porte
 * (les `candidats`), et exige l'année de CE jour (l'année ISO, celle du jeudi, pour une semaine) quand elle n'est pas l'année « d'aujourd'hui ».
 */
const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const JOUR_MS = 86_400_000;
const ms = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const lundi = (j: string) => iso(ms(j) - ((new Date(ms(j)).getUTCDay() + 6) % 7) * JOUR_MS);
const jeudi = (j: string) => iso(ms(lundi(j)) + 3 * JOUR_MS);
const anneeIso = (j: string) => jeudi(j).slice(0, 4);
const semaineIso = (j: string) => Math.floor((ms(jeudi(j)) - Date.UTC(+anneeIso(j), 0, 1)) / JOUR_MS / 7) + 1;
const fr = (j: string) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;
interface Jeton { texte: string; jour: string; dit?: string; attendu: string }
/** Les dates écrites dans `texte`, rattachées à un candidat ; `dit` : l'année écrite à côté, s'il y en a une ; `attendu` : l'année du jour que le carnet porte. */
function jetons(texte: string, candidats: string[]): Jeton[] {
  const t = texte.normalize('NFKC').replace(/[\s  ]+/g, ' ');
  const sortie: Jeton[] = [];
  const mois = MOIS.join('|');
  for (const m of t.matchAll(/(?<![A-Za-z0-9])S(\d{1,2})\b(?:\s+((?:19|20)\d{2})\b)?/g)) {
    const c = candidats.find(x => semaineIso(x) === +m[1]);
    if (c) sortie.push({ texte: m[0], jour: c, dit: m[2], attendu: anneeIso(c) });
  }
  for (const m of t.matchAll(new RegExp(`(?<!\\d)(\\d{1,2})(?:er)?\\s+(${mois})\\.?(?:\\s+((?:19|20)\\d{2})\\b)?`, 'gi'))) {
    const i = MOIS.findIndex(x => x === m[2].toLowerCase());
    const c = candidats.find(x => +x.slice(8, 10) === +m[1] && +x.slice(5, 7) - 1 === i);
    if (c) sortie.push({ texte: m[0], jour: c, dit: m[3], attendu: c.slice(0, 4) });
  }
  for (const m of t.matchAll(new RegExp(`\\b(?:vers|fin)\\s+(${mois})\\.?(?:\\s+((?:19|20)\\d{2})\\b)?`, 'gi'))) {
    const i = MOIS.findIndex(x => x === m[1].toLowerCase());
    const c = candidats.find(x => +x.slice(5, 7) - 1 === i);
    if (c) sortie.push({ texte: m[0], jour: c, dit: m[2], attendu: c.slice(0, 4) });
  }
  return sortie;
}
/** Les dates qui manquent d'année (hors de l'année d'aujourd'hui) ou qui disent la mauvaise. */
const sansAnnee = (texte: string, candidats: string[], auj: string) => jetons(texte, candidats).filter(j => j.attendu !== auj.slice(0, 4) && j.dit !== j.attendu);
/** Les dates de l'année d'aujourd'hui qui disent quand même leur année (« jamais l'année partout »). */
const anneeDeTrop = (texte: string, candidats: string[], auj: string) => jetons(texte, candidats).filter(j => j.attendu === auj.slice(0, 4) && j.dit !== undefined);

interface Cas {
  nom: string; /** « aujourd'hui » du cas (AAAA-MM-JJ) */ auj: string; titre: string; /** les jours que le carnet porte : tout ce qu'une surface peut dire */ candidats: string[];
  /** projet importé du Planning : du, au, date du plan (sa fin), précision du plan */
  planning?: { du: string; au: string; planDate: string; precision: 'day' | 'month' };
  /** carnet daté sans Planning : sa date, sa précision, et l'échéance de sa tâche (le lundi) */
  seul?: { date: string; precision: 'semaine' | 'mois' };
}
const CAS: Cas[] = [
  { nom: '1 · S17 2027 : projet du Planning (Frigo + congel : 01.08.2026 → 01.05.2027), vu en novembre 2026', auj: '2026-11-24', titre: 'Frigo + congel',
    candidats: ['2027-05-01', '2027-04-26', '2026-08-01', '2026-07-27'], planning: { du: '2026-08-01', au: '2027-05-01', planDate: '2027-05-01', precision: 'day' } },
  { nom: '2 · S50 2026 vue en 2027 : une semaine posée (sans Planning)', auj: '2027-02-03', titre: 'Peindre les murs', candidats: ['2026-12-07', '2026-12-10'], seul: { date: '2026-12-07', precision: 'semaine' } },
  { nom: '2b · S50 2025 vue en 2026 : un projet du Planning (Sol, murs)', auj: '2026-11-24', titre: 'Sol, murs', candidats: ['2025-12-10', '2025-12-08', '2025-12-01'],
    planning: { du: '2025-12-01', au: '2025-12-10', planDate: '2025-12-10', precision: 'day' } },
  { nom: '3 · plage à cheval sur deux années (14.12.2026 → 10.01.2027), avant son début', auj: '2026-11-24', titre: 'Cuve de garde', candidats: ['2026-12-14', '2027-01-10', '2027-01-04'],
    planning: { du: '2026-12-14', au: '2027-01-10', planDate: '2027-01-10', precision: 'day' } },
  { nom: '3b · plage à cheval sur deux années, commencée (aujourd\'hui 20.12.2026)', auj: '2026-12-20', titre: 'Cuve de garde', candidats: ['2026-12-14', '2027-01-10', '2027-01-04'],
    planning: { du: '2026-12-14', au: '2027-01-10', planDate: '2027-01-10', precision: 'day' } },
  { nom: '4 · une date seule (17.03.2027), une semaine posée', auj: '2026-11-24', titre: 'Acheter la pompe', candidats: ['2027-03-17', '2027-03-15'], seul: { date: '2027-03-17', precision: 'semaine' } },
  { nom: '4b · un mois seul (« vers mars »), 2027', auj: '2026-11-24', titre: 'Changer le joint', candidats: ['2027-03-15', '2027-03-31'], seul: { date: '2027-03-15', precision: 'mois' } },
  { nom: '6 · S53 2026 vue en 2027 (la semaine 53 existe en 2026)', auj: '2027-01-12', titre: 'Inventaire de fin d\'année', candidats: ['2026-12-28', '2027-01-01'], seul: { date: '2026-12-28', precision: 'semaine' } }
];
/** Les cas où l'année est CELLE d'aujourd'hui : elle ne se dit pas. */
const CAS_COURANTS: Cas[] = [
  { nom: '5 · semaine de l\'année en cours, sans année (S50 2026 vue en novembre 2026)', auj: '2026-11-24', titre: 'Changer les rails', candidats: ['2026-12-07', '2026-12-10'], seul: { date: '2026-12-07', precision: 'semaine' } },
  { nom: '6b · S53 2026 vue en 2026 (jamais « S53 2027 » : l\'année ISO est celle du jeudi)', auj: '2026-11-24', titre: 'Inventaire de fin d\'année', candidats: ['2026-12-28', '2027-01-01'], seul: { date: '2027-01-01', precision: 'semaine' } },
  { nom: '7 · un projet du Planning dans l\'année en cours (14.12.2026 → 20.12.2026)', auj: '2026-11-24', titre: 'Porte de la cave', candidats: ['2026-12-14', '2026-12-20'],
    planning: { du: '2026-12-14', au: '2026-12-20', planDate: '2026-12-20', precision: 'day' } }
];

/** Le document du cas : la FORME exacte d'embouteillage-planning.json (carnet, plan, message), dates changées ; sans Planning : une tâche datée et la date sur le carnet. */
function documentDe(cas: Cas): Releve {
  const d = embouteillage();
  const o = JSON.parse(JSON.stringify(d).split('Embouteillage — station complète (2027)').join(cas.titre)) as Releve & { carnet: Record<string, unknown> & { carnet: Record<string, unknown> } };
  const carnet = o.carnet.carnet as Record<string, unknown> & { notes: Array<Record<string, unknown>> };
  if (cas.planning) {
    const p = cas.planning;
    let txt = JSON.stringify(o);
    txt = txt.split('01.05.2027').join(fr(p.du)).split('01.07.2027').join(fr(p.au));
    const r = JSON.parse(txt) as typeof o;
    const plan = r.plan as unknown as Record<string, unknown> & { upgrade: Record<string, unknown> };
    plan.date = p.planDate; plan.fenetre = { du: lundi(p.du), au: iso(ms(lundi(p.au)) + 6 * JOUR_MS) };
    plan.upgrade = { ...plan.upgrade, datePrecision: p.precision };
    (r.carnet as unknown as Record<string, unknown>).date = lundi(p.du);
    return r;
  }
  const s = cas.seul!;
  o.plan = null;
  delete carnet.sortie;
  carnet.notes = [];
  carnet.criteres = [];
  carnet.domaine = { valeur: 'local', origine: 'vous' };
  carnet.categorie = { chemin: ['Bâtiment'], origine: 'vous' };
  o.messages = [];
  carnet.taches = [{ id: 'TACHE-c77-91', texte: cas.titre, echeance: lundi(s.date), precision: s.precision, creeeLe: '2026-09-03T11:40:33.460190Z', origine: 'locale' }];
  (o.carnet as unknown as Record<string, unknown>).date = s.date;
  (o.carnet as unknown as Record<string, unknown>).precision = s.precision;
  return o;
}
const quandDuCarnet = () => [...document.querySelectorAll('button')].find(b => /^quand\b/.test(sans(lu(b))));
/** Le texte d'un élément, une espace entre deux éléments voisins (textContent colle « 2027 » à « au Planning »). */
function luMots(e: Element | null | undefined): string {
  if (!e) return '';
  const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
  const morceaux: string[] = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) morceaux.push(n.textContent ?? '');
  return morceaux.join(' ').replace(/[\s  ]+/g, ' ').trim();
}
function surfaceQuand(cas: Cas): string { cleanup(); monter(documentDe(cas), { auj: cas.auj, sansPoser: true }); return luMots(quandDuCarnet()); }
async function surfaceListe(cas: Cas): Promise<string> {
  cleanup(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${cas.auj}T12:00:00.000Z`));
  monter(documentDe(cas), { auj: cas.auj, ouvrir: false, sansPoser: true });
  await attendre(120);
  return luMots(document.querySelector('.cnl-corps'));
}
function surfaceAFaire(cas: Cas): string {
  cleanup();
  const d = documentDe(cas);
  const carnets = lireCarnets([d.carnet, ...d.messages] as never, { archives: true }).filter(c => c.id === d.carnet.id);
  const { container } = render(<AFaire carnets={carnets} maintenant={`${cas.auj}T12:00:00.000Z`} messages={[]} onCocher={() => {}} onOuvrir={() => {}} onEcheance={() => {}} />);
  return luMots(container);
}
const diteSans = (fs: Jeton[]) => fs.map(f => `« ${f.texte} » (le ${f.jour}) devrait dire ${f.attendu}${f.dit ? `, dit ${f.dit}` : ''}`).join(' ; ');

describe.each(CAS)('R105 · $nom', cas => {
  it('Quand : dit au moins une date, et son année quand elle n\'est pas l\'année en cours', () => {
    const t = surfaceQuand(cas);
    expect(jetons(t, cas.candidats).length, `Quand ne dit aucune date lisible : « ${t} »`).toBeGreaterThan(0);
    expect(diteSans(sansAnnee(t, cas.candidats, cas.auj)), `Quand : « ${t} »`).toBe('');
  });
  /* un projet du Planning est « Dans À venir » : sa ligne dit cela, pas sa date ; seul un carnet daté sans prix ni Planning dit sa date dans la liste */
  it.runIf(!!cas.seul)('la liste des carnets : sa ligne dit la date, avec son année quand elle n\'est pas l\'année en cours', async () => {
    const t = await surfaceListe(cas);
    expect(jetons(t, cas.candidats).length, `la ligne du carnet ne dit aucune date lisible : « ${t} »`).toBeGreaterThan(0);
    expect(diteSans(sansAnnee(t, cas.candidats, cas.auj)), `liste : « ${t} »`).toBe('');
  });
  it('À faire : ses dates disent leur année quand elle n\'est pas l\'année en cours', () => {
    const t = surfaceAFaire(cas);
    expect(diteSans(sansAnnee(t, cas.candidats, cas.auj)), `À faire : « ${t.slice(0, 300)} »`).toBe('');
  });
});

describe.each(CAS_COURANTS)('R105 · année en cours · $nom', cas => {
  it('Quand : dit la date, sans l\'année (jamais l\'année partout)', () => {
    const t = surfaceQuand(cas);
    expect(jetons(t, cas.candidats).length, `Quand ne dit aucune date lisible : « ${t} »`).toBeGreaterThan(0);
    expect(diteSans(anneeDeTrop(t, cas.candidats, cas.auj)), `Quand : « ${t} »`).toBe('');
    expect(diteSans(sansAnnee(t, cas.candidats, cas.auj)), `Quand : « ${t} »`).toBe('');
  });
  it.runIf(!!cas.seul)('la liste des carnets : sa ligne dit la date, sans l\'année', async () => {
    const t = await surfaceListe(cas);
    expect(jetons(t, cas.candidats).length, `la ligne du carnet ne dit aucune date lisible : « ${t} »`).toBeGreaterThan(0);
    expect(diteSans(anneeDeTrop(t, cas.candidats, cas.auj)), `liste : « ${t} »`).toBe('');
  });
  it('À faire : ses dates ne disent pas l\'année en cours', () => {
    const t = surfaceAFaire(cas);
    expect(diteSans(anneeDeTrop(t, cas.candidats, cas.auj)), `À faire : « ${t.slice(0, 300)} »`).toBe('');
  });
});

describe('R105 · le contrôle lui-même : il lit la règle, pas un exemple', () => {
  it('une semaine sans année est signalée hors de l\'année en cours, jamais dans l\'année en cours', () => {
    expect(sansAnnee('Quand · S17', ['2027-05-01'], '2026-11-24').length).toBe(1);
    expect(sansAnnee('Quand · S17 2027', ['2027-05-01'], '2026-11-24').length).toBe(0);
    expect(sansAnnee('Quand · S50', ['2026-12-07'], '2026-11-24').length).toBe(0);
    expect(anneeDeTrop('Quand · S50 2026', ['2026-12-07'], '2026-11-24').length).toBe(1);
  });
  it('S53 : l\'année d\'une semaine est celle de son jeudi (le 01.01.2027 est en S53 2026)', () => {
    expect(anneeIso('2027-01-01')).toBe('2026');
    expect(semaineIso('2027-01-01')).toBe(53);
    expect(sansAnnee('passé · S53', ['2026-12-28'], '2027-01-12').length).toBe(1);
    expect(sansAnnee('passé · S53 2026', ['2026-12-28'], '2027-01-12').length).toBe(0);
    expect(sansAnnee('S53 2027', ['2027-01-01'], '2027-06-01').length).toBe(1);
  });
  it('une date et un mois sont lus : « 1 mai », « vers sept. », « fin mars »', () => {
    expect(sansAnnee('dès le 1 mai', ['2027-05-01'], '2026-11-24').length).toBe(1);
    expect(sansAnnee('dès le 1 mai 2027', ['2027-05-01'], '2026-11-24').length).toBe(0);
    expect(sansAnnee('vers sept.', ['2027-09-15'], '2026-11-24').length).toBe(1);
    expect(sansAnnee('fin mars 2027', ['2027-03-29'], '2026-11-24').length).toBe(0);
  });
});

/* ======================================================================================================== R106 : les autres R77-n, R73-n et R75-n rouverts */

describe('R106 · R77-3 à R77-8 : Houblons citra, fiche, Choisir, fil', () => {
  it('R77-3 : sous Choisir de Brau, la carte de MotlerHops dit son prix avec l\'unité, le même que partout : ≈3,69 CHF (pas « 3,72 » nu)', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(BRAU);
    const ecran = await ouvrirChoisir();
    const carte = ecran.querySelector('.cn-article');
    expect(carte, 'la carte de l\'autre article sous Choisir').toBeTruthy();
    expect(mots(carte), `carte : « ${lu(carte)} »`).toMatch(/3,69\s?chf/);
    expect(mots(carte), `carte : « ${lu(carte)} »`).not.toMatch(/3,72(?!\s?(€|eur))/);
  });
  it('R77-4 : le même rang partout : Brau n\'a pas de rang au tableau (« ? »), sa carte sous Choisir de MotlerHops non plus', async () => {
    monter(citra()); await attendre(150);
    const rangTableau = lu(ligneDe(BRAU).querySelector('.cn-rang'));
    await ouvrirFiche(MOTLER);
    const ecran = await ouvrirChoisir();
    const rangCarte = lu(ecran.querySelector('.cn-article .cn-rang'));
    expect(rangCarte, `tableau : « ${rangTableau} », carte sous Choisir : « ${rangCarte} »`).toBe(rangTableau);
  });
  it('R77-5 : Comparer, la cellule « prix » d\'un article sans prix tient en « ? · à relire » : ni Relire ni Escalader dedans (ils sont sur la fiche)', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/^prix/);
    expect(l, `lignes de Comparer : ${entetesComparer().join(' | ')}`).toBeTruthy();
    const c = l!.cellules[1];
    expect(c.querySelectorAll('button').length, `cellule prix de Brau : « ${lu(c)} »`).toBe(0);
    expect(mots(c), `cellule prix de Brau : « ${lu(c)} »`).toMatch(/a relire/);
  });
  it('R77-7 : un seul nom de vendeur : celui du tableau est celui de la fiche et de Choisir (« Brau » partout, ou « Brau- und Rauchshop » partout)', async () => {
    monter(citra()); await attendre(150);
    const tableau = lu(ligneDe(BRAU).querySelector('.cn-tab-nom .cn-mut'));
    await ouvrirFiche(BRAU);
    const ecran = await ouvrirChoisir();
    const choisir = lu(ecran.querySelector('.cn-offre-nom .cn-mut'));
    expect(choisir, `tableau : « ${tableau} », Choisir : « ${choisir} »`).toBe(tableau);
    expect(mots(document.body), `nom du vendeur dans l'écran : « ${tableau} »`).toContain(sans(tableau));
  });
  it('R77-7 : le bouton vert « Choisir chez … » tient sur une ligne à 390 px (28 signes au plus)', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(BRAU);
    const ecran = await ouvrirChoisir();
    const b = bouton(/^choisir chez/, ecran)!;
    expect(b, 'bouton « Choisir chez … »').toBeTruthy();
    expect(lu(b).length, `bouton : « ${lu(b)} » (${lu(b).length} signes)`).toBeLessThanOrEqual(28);
  });
  it('R77-8 : sa note dans le fil dit à quoi elle est rattachée : « rattachée à MotlerHops » (sa maquette v01-carnet)', async () => {
    monter(citra()); await attendre(150);
    const bulle = document.querySelector('.cnp-b[data-message="MSG-c75-10"]');
    expect(bulle, 'la bulle de sa note « Ça semble dur à obtenir… »').toBeTruthy();
    expect(mots(bulle), `bulle : « ${lu(bulle)} »`).toMatch(/rattachee a motlerhops/);
  });
  it('R73-9 : sur la fiche MotlerHops, « TVA d\'import » et le prix au kilo (73,8) ne sont dits qu\'une fois', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(MOTLER);
    const t = mots(document.body);
    expect((t.match(/tva d'import/g) ?? []).length, `« TVA d'import » dit ${(t.match(/tva d'import/g) ?? []).length} fois : « ${t.slice(0, 700)} »`).toBeLessThanOrEqual(1);
    expect((t.match(/73,8/g) ?? []).length, `« 73,8 » dit ${(t.match(/73,8/g) ?? []).length} fois : « ${t.slice(0, 700)} »`).toBeLessThanOrEqual(1);
  });
  it('R73-9 : sur la fiche de Brau, les arômes sont dits une fois (les puces ou les Caractéristiques, pas les deux)', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(BRAU);
    const t = mots(document.body);
    expect((t.match(/citron vert/g) ?? []).length, `« citron vert » dit ${(t.match(/citron vert/g) ?? []).length} fois : « ${t.slice(0, 700)} »`).toBeLessThanOrEqual(1);
  });
});

describe('R106 · Chambre froide (document à la forme de houblons-citra) : liste, tableau, Choisir, Comparer', () => {
  const CHAMBRE = /cellule froide/;
  const choisirDe = async (re: RegExp) => { await ouvrirFiche(re); return ouvrirChoisir(); };

  it('R77-6 : sur la liste filtrée « je cherche », « 2 697,74 » se lit en entier : espace des milliers INSÉCABLE (la coupe ne tombe pas dans le nombre), jamais « 2697,7… »', async () => {
    monter(chambre(), { ouvrir: false }); await attendre(150);
    fireEvent.click(document.querySelector('.cnl-case[data-etat="cherche"]')!);
    await attendre(60);
    const brut = document.querySelector('.cnl-corps')?.textContent ?? '';
    expect(brut, `liste : « ${lu(document.querySelector('.cnl-corps'))} »`).not.toMatch(/2697/);
    expect(brut, `le prix de Chambre froide dans la liste (espace insécable ?) : « ${lu(document.querySelector('.cnl-corps'))} »`).toMatch(/2[  ]697,74/);
  });
  it('R75-3 : au tableau, le nom de l\'article tient sur deux lignes : 40 signes au plus (les dimensions vont à la fiche)', async () => {
    monter(chambre()); await attendre(150);
    const noms = rangs().map(l => lu(l.querySelector('.cn-tab-nom .cn-nom-entier')));
    expect(noms.length, `tableau : ${rangs().map(lu).join(' | ')}`).toBeGreaterThan(0);
    for (const n of noms) expect(n.length, `nom au tableau : « ${n} » (${n.length} signes)`).toBeLessThanOrEqual(40);
  });
  it('R75-6 : au Choisir, la chasse fixe est réservée aux chiffres : « 0 à 8 °C », « 550 Watt », « 1N~/PE » sont en police normale', async () => {
    monter(chambre()); await attendre(150);
    const ecran = await choisirDe(CHAMBRE);
    const unites = /°c|chf|eur|€|kg|mm|cm|m³|kw|hz|%|\bx\b|\bv\b|\bg\b|\bm\b/gi;
    const mono = [...ecran.querySelectorAll('.cn-mono')].map(e => lu(e)).filter(t => /[a-zà-ÿ]/i.test(t.replace(unites, '')));
    expect(mono, 'textes qui ne sont pas des chiffres, en chasse fixe (.cn-mono) au Choisir').toEqual([]);
  });
  it('R73-10 : au Choisir, le prix (2 697,74) n\'est pas dit plus de deux fois (le prix, la part dans À venir)', async () => {
    monter(chambre()); await attendre(150);
    const ecran = await choisirDe(CHAMBRE);
    const t = mots(ecran);
    const n = (t.match(/2 697,74/g) ?? []).length;
    expect(n, `« 2 697,74 » dit ${n} fois : « ${t} »`).toBeLessThanOrEqual(2);
  });
  it('R73-13 : le bouton Choisir de Comparer est vert et nommé (« Choisir · Gastro Held ») comme celui de la fiche', async () => {
    monter(chambre()); await attendre(150); await ouvrirComparer();
    const b = bouton(/^choisir/)!;
    expect(b, 'bouton Choisir de Comparer').toBeTruthy();
    expect(b.className, `classes : « ${b.className} »`).toMatch(/cn-action-vert/);
    expect(sans(lu(b)), `bouton : « ${lu(b)} »`).toMatch(/gastro|cellule/);
  });
});
