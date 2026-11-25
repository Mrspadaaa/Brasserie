// @vitest-environment jsdom
/**
 * Voie c70-tests (25.11) : les tests ROUGES des règles R81 à R83 tirées du test en ligne du tour 70 (voies/critique-70/RESULTAT.md ; BUGS.md C70-1 à C70-10).
 * Écrits depuis les RÈGLES (voies/c70-tests/DOSSIER.md) et les maquettes choisies (maquettes2/v01 : liste, afaire, saisie, resolu ; règle n° 1) avant tout correctif :
 * celui qui corrige n'écrit pas le test (L17). Aucun réseau, aucun Gemini (AiClient lève s'il est appelé).
 *
 *  - R81 (C70-1, B, 3e retour : C66-4, C67B-1) : le CHEMIN EXACT, joué par le composant monté (CarnetsVue) : carnet de houblons aux 2 liens Citra (MotlerHops en euros, Brau),
 *    Comparer « pour 1 kg », bouton « Choisir · MotlerHops, 1 kg », écran Choisir, valider, À venir : 1 kg et ≈40 CHF partout (jamais 50 g, ≈4 CHF, « à estimer »). r54 ne couvrait
 *    que la fiche ; ici le même geste est joué DEPUIS COMPARER, depuis la fiche (feuille Articles) et depuis la carte du carnet.
 *  - R82 : C70-2 (bornes du curseur = prix montrés), C70-4 (arbre par sous-domaine, noms), C70-5 (tâche datée), C70-6 (groupes de À faire), C70-7 (« ailleurs ? » absurde),
 *    C70-8 (commande client), C70-9 (valeurs lisibles), C70-10 (le dernier résolu visible).
 *  - R83 (C70-3) : ici seulement la part de l'app : quand la réponse de l'IA dit genre « problème », état « je cherche » et un chemin Brassage › Vapeur, la carte et le carnet créé le
 *    montrent tels quels (pas « idée », pas « Brasserie » seul). Ce que l'IA réelle dit se juge dans la voie c70-ia.
 * Réponses de l'IA : SIMULÉES, à la forme de la vraie réponse (tests/fixtures/c68/rangement-1.json, relevé en ligne le 25.11 ; champs ajoutés marqués « SIMULÉ »). Les phrases de ce tour
 * (hotte, ventilateur, mariage) n'ont pas de relevé réel : leurs lignes sont inventées, à la forme du schéma de ia.ts, et le disent.
 * Limites : jsdom ne mesure aucune boîte ; la mise en page (colonne étroite, bande défilante) se juge à la structure et aux feuilles de style réelles injectées.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS_SUIVI, MAINTENANT_SUIVI, fixtureCarnets, fixtureSuivi } from '../../src/domain/carnets/fixture';
import { lireCarnets, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { resoudre, retenirOption } from '../../src/domain/carnets/suivi';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { AFaire } from '../../src/ui/carnets/AFaire';
import { domaineParMots, sousDomaineParMots } from '../../src/ui/carnets/domaineMots';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ID_PELLETS, TITRE_PELLETS, pelletsTrois } from '../fixtures/c67b/pellets';
import rangement1 from '../fixtures/c68/rangement-1.json';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof appliquerEcritures>[0][number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const boutonSans = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const appelsHorsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };
const feuillesReelles = () => ['carnets.css', 'carnets-decider.css', 'fiche-article.css', 'carnets-fil.css', 'carnets-liste.css'].map(f => readFileSync(`src/ui/carnets/${f}`, 'utf8')).join('\n');
const poserFeuilles = () => { const st = document.createElement('style'); st.setAttribute('data-c70', ''); st.textContent = feuillesReelles(); document.head.appendChild(st); };
afterEach(() => document.head.querySelectorAll('style[data-c70]').forEach(s => s.remove()));

interface Montage { appels?: AppelsIA; ouvrir?: string; mode?: string; plans?: FinancialPlan[]; ecrire?: (p: FinancialPlan) => void }
function monter(items: Item[], o: Montage = {}) {
  const magasin = magasinMemoire(items as never[]);
  const r = render(<CarnetsVue magasin={magasin} finances={{ plans: o.plans ?? [], transactions: [], payments: [] }} mode={(o.mode ?? 'simule') as never}
    appels={o.appels ?? appelsHorsLigne} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={((p: FinancialPlan) => o.ecrire?.(p)) as never}
    {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} />);
  return { magasin, ...r };
}
const carnetDe = (m: { magasin: ReturnType<typeof magasinMemoire> }, id: string) => lireCarnets(m.magasin.lire() as never, { archives: true }).find(c => c.id === id)!;
async function taper(phrase: string) {
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: phrase } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(600);
}
const reponseIA = (lignes: Array<Record<string, unknown>>): AppelsIA => ({
  async ranger() { return { ok: true, data: { lignes } }; },
  async lire() { throw new Error('aucun lien dans ces phrases'); }
});

/* =========================================================================================================== R81 */

/** Le carnet du test en ligne : 2 liens Citra, MotlerHops (en euros, 3,72 € les 50 g, 40,69 € le kilo) et Brau (la vraie page lue le 23.11). Hopfenmarkt n'y est pas. */
function pelletsDeuxLiens(): Item[] {
  const c = pelletsTrois();
  const doc = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id !== 'HM') } };
  return [doc as never, ...fixtureCarnets().filter(i => i.id !== ID_PELLETS)] as Item[];
}
const UN_KG = /1 kg/;
const SUR_4_CHF = /≈\s?4\s?CHF/;
type Depuis = 'comparer' | 'fiche' | 'carte';
interface Parcours {
  boutonChoisir: string; ecranChoisir: string; apresValider: string; choix: CarnetDoc['carnet']['choix']; coutCarnet: number | undefined; plan: FinancialPlan | undefined;
  pistes: { valeurs: number[]; montres: number[] }; cellules: Array<{ texte: string; classe: string; police: string; coupe: string; ligne: string }>;
}
const nombres = (t: string): number[] => [...t.matchAll(/\d[\d  ']*(?:[.,]\d+)?/g)].map(m => Number(m[0].replace(/[^\d.,]/g, '').replace(',', '.'))).filter(n => Number.isFinite(n));
async function ouvrirFicheMotlerHopsParFeuille() {
  fireEvent.click([...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''))!);
  await attendre(30);
  const feuille = document.querySelector('[role="dialog"][aria-modal="true"]')!;
  const carte = [...feuille.querySelectorAll('button')].find(b => /motlerhops/.test(sans(b.textContent ?? '')) && !/retirer|deplacer/.test(sans(b.getAttribute('aria-label') ?? '')));
  expect(carte, 'la carte MotlerHops de la feuille Articles').toBeTruthy();
  fireEvent.click(carte!);
  await attendre(30);
}
/** Le geste du brasseur, depuis `depuis`, jusqu'à « Choisir chez MotlerHops » validé. Tout est lu au passage (texte brut) : l'écran démonté après le test n'est plus lisible. */
async function parcours(depuis: Depuis): Promise<Parcours> {
  poserQuantitePour(TITRE_PELLETS, 1);
  const ecrits: FinancialPlan[] = [];
  const m = monter(pelletsDeuxLiens(), { ouvrir: ID_PELLETS, ecrire: p => ecrits.push(p) });
  await attendre(60);
  if (depuis === 'comparer') {
    fireEvent.click([...document.querySelectorAll('button')].find(b => /^comparer$/i.test(lu(b)))!);
    await attendre(40);
  } else if (depuis === 'fiche') {
    await ouvrirFicheMotlerHopsParFeuille();
  } else {
    const carte = [...document.querySelectorAll('button')].find(b => /citra/i.test(lu(b)) && /motlerhops/i.test(lu(b)) && !b.hasAttribute('aria-haspopup'));
    expect(carte, 'la carte MotlerHops du carnet ouvert').toBeTruthy();
    fireEvent.click(carte!);
    await attendre(40);
  }
  const choisirBtn = [...document.querySelectorAll('button')].find(b => /^choisir/i.test(lu(b)));
  expect(choisirBtn, `bouton Choisir (depuis ${depuis}) : ${[...document.querySelectorAll('button')].map(b => lu(b)).filter(Boolean).join(' | ').slice(0, 300)}`).toBeTruthy();
  const boutonChoisir = lu(choisirBtn);
  fireEvent.click(choisirBtn!);
  await attendre(40);
  poserFeuilles();
  const ecran = document.querySelector('.cn-choisir')!;
  expect(ecran, 'l\'écran Choisir').toBeTruthy();
  const ecranChoisir = lu(ecran);
  const pistes = { valeurs: [] as number[], montres: [] as number[] };
  const copie = ecran.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-piste, .cn-reglette').forEach(p => { p.remove(); });
  pistes.montres = nombres(lu(copie));
  ecran.querySelectorAll('.cn-reglette-bornes, .cn-piste-legende').forEach(b => { pistes.valeurs.push(...nombres(lu(b))); });
  const cellules = [...ecran.querySelectorAll('.cn-place tbody td')].map(td => {
    const cs = getComputedStyle(td);
    return { texte: lu(td), classe: td.className, police: cs.fontFamily, coupe: `${cs.overflowWrap}|${cs.wordBreak}`, ligne: lu(td.parentElement?.querySelector('th')) };
  });
  fireEvent.click(boutonSans(/^choisir chez/, ecran)!);
  await attendre(80);
  const apresValider = lu(document.body);
  const c = carnetDe(m, ID_PELLETS);
  return { boutonChoisir, ecranChoisir, apresValider, choix: c.carnet.choix, coutCarnet: c.estimatedCost, plan: ecrits.at(-1), pistes, cellules };
}

describe.each([
  ['Comparer (le chemin du test en ligne, r54 ne le couvrait pas)', 'comparer' as Depuis],
  ['la fiche MotlerHops (feuille Articles)', 'fiche' as Depuis],
  ['la carte MotlerHops du carnet ouvert', 'carte' as Depuis]
])('R81 · C70-1 (C66-4, C67B-1 : 3e retour) : Choisir · MotlerHops, 1 kg depuis %s', (_nom, depuis) => {
  let p: Parcours;
  beforeEach(async () => { p = await parcours(depuis); }, 30000);

  it('le bouton dit la quantité : « Choisir · MotlerHops, 1 kg »', () => {
    expect(sans(p.boutonChoisir)).toMatch(/^choisir · motlerhops, 1 kg/);
  });
  it('l\'écran Choisir dit 1 kg et ≈40 CHF, jamais 50 g ni ≈4 CHF', () => {
    expect(p.ecranChoisir, p.ecranChoisir).toMatch(UN_KG);
    expect(p.ecranChoisir, p.ecranChoisir).toMatch(/≈\s?4\d(?:[.,]\d+)?\s?CHF|≈\s?3\d(?:[.,]\d+)?\s?CHF/);
    expect(p.ecranChoisir, p.ecranChoisir).not.toMatch(SUR_4_CHF);
    expect(p.ecranChoisir, p.ecranChoisir).not.toMatch(/\b50 g\b/);
  });
  it('« Part dans À venir » dit 1 kg et le prix du kilo (≈40), pas le sachet', () => {
    expect(p.ecranChoisir, p.ecranChoisir).toMatch(/Part dans À venir\s*:\s*≈\s?(3[5-9]|4[0-5])(?:[.,]\d+)?\s?CHF/);
  });
  it('valider : le choix du carnet porte 1 kg et ≈40 CHF (3900 à 4100 centimes), et le coût du carnet ≈40', () => {
    expect(p.choix?.articleId).toBe('M1');
    expect(p.choix?.quantite, JSON.stringify(p.choix)).toEqual({ kg: 1, libelle: '1 kg' });
    expect(p.choix?.prixCentimes ?? 0, JSON.stringify(p.choix)).toBeGreaterThanOrEqual(3900);
    expect(p.choix?.prixCentimes ?? 0, JSON.stringify(p.choix)).toBeLessThanOrEqual(4100);
    expect(p.coutCarnet ?? 0, `coût du carnet : ${p.coutCarnet}`).toBeGreaterThanOrEqual(39);
    expect(p.coutCarnet ?? 0).toBeLessThanOrEqual(41);
  });
  it('À venir : le plan écrit porte 1 kg et ≈40 CHF (pas « à estimer » : montant 0), sous le nom de l\'article et du vendeur', () => {
    expect(p.plan, 'un plan écrit pour À venir').toBeTruthy();
    expect(p.plan!.amountCents, JSON.stringify(p.plan)).toBeGreaterThanOrEqual(3900);
    expect(p.plan!.amountCents).toBeLessThanOrEqual(4100);
    expect(p.plan!.upgrade?.budgetKnown, 'le prix est connu : pas « à estimer »').not.toBe(false);
    expect(p.plan!.notes ?? '', 'la quantité du plan').toMatch(UN_KG);
    expect(sans(p.plan!.title), p.plan!.title).toMatch(/motlerhops/);
  });
  it('l\'écran Choisi (après valider) ne redit ni 50 g ni ≈4 CHF', () => {
    expect(p.apresValider).not.toMatch(SUR_4_CHF);
    expect(p.apresValider).not.toMatch(/\b50 g · 73,80/);
    expect(p.apresValider).not.toMatch(/à estimer/);
    expect(p.apresValider).toMatch(/≈\s?(3[5-9]|4[0-5])(?:[.,]\d+)?\s?CHF/);
  });
});

/* =========================================================================================================== R82 */

describe('R82 · C70-2 : les bornes du curseur de prix sont des prix montrés, à la même quantité', () => {
  it('depuis Comparer (Choisir sans quantité) : chaque borne « CHF/kg » du curseur est un prix d\'un article montré sur l\'écran (jamais « 68 » quand les articles disent 73,80 et 80 ; ou ≈40 et 80)', async () => {
    const p = await parcours('comparer');
    expect(p.pistes.valeurs.length, 'l\'écran Choisir porte un curseur de prix avec ses bornes').toBeGreaterThan(0);
    const montres = p.pistes.montres;
    const absentes = p.pistes.valeurs.filter(v => !montres.some(x => Math.abs(x - v) < 0.06));
    expect(absentes, `bornes du curseur : ${JSON.stringify(p.pistes.valeurs)} ; nombres montrés ailleurs sur l'écran : ${JSON.stringify([...new Set(montres)].slice(0, 30))}`).toEqual([]);
  }, 30000);
});

describe('R82 · C70-9 (C69-13 rouvert) : « Ses autres valeurs » — une valeur de texte est lisible : ni chasse fixe, ni mot coupé au milieu', () => {
  it('Prix et Arômes (Choisir depuis Comparer, feuilles de style réelles) : la valeur longue n\'est pas en police à chasse fixe (cn-mono) et ne se coupe pas n\'importe où (overflow-wrap: anywhere)', async () => {
    const p = await parcours('comparer');
    /* les valeurs de la colonne du milieu qui portent un libellé de ligne (Prix, Arômes…) ; la réglette (cellule sans libellé) n'est pas une valeur */
    const valeurs = p.cellules.filter(c => c.ligne !== '' && c.texte.length >= 12);
    expect(valeurs.map(c => c.ligne), `valeurs longues de Ses autres valeurs : ${JSON.stringify(p.cellules.map(c => c.texte))}`).toEqual(expect.arrayContaining(['Prix', 'Arômes']));
    /* un texte (des mots, pas des chiffres tabulaires) ne se met pas en police à chasse fixe */
    const textes = valeurs.filter(c => /\p{L}{5,}/u.test(c.texte));
    const monos = textes.filter(c => /cn-mono/.test(c.classe) || /mono/i.test(c.police));
    expect(monos.map(c => `${c.ligne} : ${c.texte}`), 'valeurs de texte en police à chasse fixe').toEqual([]);
    const coupees = valeurs.filter(c => /anywhere/.test(c.coupe) || /break-all/.test(c.coupe));
    expect(coupees.map(c => `${c.ligne} : ${c.texte} (${c.coupe})`), 'valeurs qui se coupent au milieu d\'un mot').toEqual([]);
  }, 30000);
});

describe('R82 · C70-4 (C69-10 en partie, maquette v01-liste) : l\'arbre replie ses carnets par sous-domaine, avec les noms ; jamais « Autres » muet', () => {
  const plat = (id: string, titre: string, extra: Record<string, unknown> = {}): Item => ({ id, type: 'carnet', title: titre, status: 'idea',
    carnet: { version: 1, creeLe: '2026-11-05T08:00:00.000Z', phrase: titre, criteres: [], facons: [], articles: [], notes: [], photos: [], domaine: { valeur: 'brasserie', origine: 'ia' }, ...extra } }) as unknown as Item;
  const art = (id: string, nom: string, prix: number) => ({ id, nom, prixCentimes: prix, devise: 'CHF', lecture: 'lue', valeurs: {}, origine: 'vous' });
  const items = () => clone([plat('ZZ-C70-HC', 'Houblons citra', { articles: [art('H1', 'Citra', 4000), art('H2', 'Citra 2', 8000)] }),
    plat('ZZ-C70-CF', 'Chambre froide', { articles: [art('C1', 'Froid 6 m³', 480000), art('C2', 'Froid 8 m³', 590000)] }),
    plat('ZZ-C70-FC', 'Frigo + congel', { criteres: [{ id: 'KB', texte: 'Budget 400 CHF', origine: 'vous' }] }),
    plat('ZZ-C70-EM', 'Embouteillage — station complète (2027)', { criteres: [{ id: 'KE', texte: 'Budget 2 500 CHF', origine: 'vous' }] })]) as Item[];
  it('aucun groupe replié ne s\'appelle « Autres » (sans sous-domaine ni nom) quand les titres disent leur partie (houblon, froid, embouteillage)', async () => {
    monter(items());
    await attendre(120);
    const groupes = [...document.querySelectorAll('.cnl-sd')].map(b => lu(b.querySelector('b')));
    expect(groupes, `groupes de l'arbre : ${JSON.stringify(groupes)}`).not.toContain('Autres');
  }, 20000);
  it('« Chambre froide » et « Frigo + congel » sont sous un même sous-domaine nommé (« Froid 2 » de la maquette)', async () => {
    monter(items());
    await attendre(120);
    const groupe = [...document.querySelectorAll('.cnl-sd')].find(b => /chambre froide|frigo/i.test(lu(b)) || /^(froid|fermentation)/i.test(lu(b.querySelector('b'))));
    expect(groupe, `groupes : ${JSON.stringify([...document.querySelectorAll('.cnl-sd')].map(b => lu(b)))}`).toBeTruthy();
    const section = groupe!.closest('section')!;
    const lignesDuGroupe = (g: Element) => { const noms: string[] = []; for (let n = g.nextElementSibling; n && !n.classList.contains('cnl-sd'); n = n.nextElementSibling) noms.push(lu(n)); return noms.join(' | ') + ' ' + lu(g); };
    const texte = lignesDuGroupe(groupe!);
    expect(texte, `groupe « ${lu(groupe!)} » : ${texte}`).toMatch(/Chambre froide/);
    expect(texte, texte).toMatch(/Frigo \+ congel/);
    expect(section).toBeTruthy();
  }, 20000);
  it('un groupe replié dit les noms de ses carnets (« moulin, embouteillage » de la maquette), pas seulement un nombre', async () => {
    monter(items());
    await attendre(120);
    const replies = [...document.querySelectorAll('.cnl-sd[aria-expanded="false"]')].filter(b => !b.classList.contains('cnl-sd-resolus'));
    expect(replies.length, 'au moins un groupe replié').toBeGreaterThan(0);
    const muets = replies.filter(b => !/\p{L}{3,}.*\p{L}{3,}/u.test(lu(b).replace(lu(b.querySelector('b')), '').replace(/\d+/g, '')));
    expect(muets.map(b => lu(b)), 'groupes repliés sans le nom d\'aucun de leurs carnets').toEqual([]);
  }, 20000);
});

describe('R82 · C70-5 (C69-9 en partie) : une tâche dite avec sa date garde sa date (« avant le 12 décembre », « en mai »)', () => {
  const vapeur = () => fixtureSuivi().filter(i => i.id === IDS_SUIVI.vapeur) as Item[];
  async function jouer(phrase: string, ligne: Record<string, unknown>) {
    const m = monter(vapeur(), { ouvrir: IDS_SUIVI.vapeur, appels: reponseIA([{ sorte: 'note', texte: phrase, genre: 'note', carnetId: IDS_SUIVI.vapeur, citation: phrase.toLowerCase(), ...ligne }]) });
    await attendre(100);
    await taper(phrase);
    /* la bulle « tâche proposée » du fil : « À faire » · « Plus tard » (relevé en ligne : « tâche proposée · À faire ») */
    const aFaire = [...document.querySelectorAll('button')].find(b => /^À faire$/.test(lu(b)) && /tâche proposée/.test(lu(b.parentElement?.parentElement?.parentElement ?? b)));
    expect(aFaire, 'la bulle « tâche proposée » offre « À faire »').toBeTruthy();
    fireEvent.click(aFaire!);
    await attendre(200);
    return carnetDe(m, IDS_SUIVI.vapeur).carnet.taches ?? [];
  }
  it('« appeler le chaudronnier pour poser la hotte avant le 12 décembre » (réponse IA simulée : tachePropose « semaine ») : la tâche est datée de décembre, pas de la semaine courante', async () => {
    const taches = await jouer('Appeler le chaudronnier pour poser la hotte avant le 12 décembre', { tachePropose: { quand: 'semaine', texte: 'Appeler le chaudronnier pour poser la hotte' } });
    const t = taches.find(x => /chaudronnier/i.test(x.texte));
    expect(t, `tâches du carnet : ${JSON.stringify(taches.map(x => x.texte))}`).toBeTruthy();
    expect(t!.echeance ?? '', `échéance posée : ${t!.echeance} (le 12 décembre 2026 tombe la semaine du 7)`).toMatch(/^2026-12-(0[1-9]|1[0-2])$/);
  }, 30000);
  it('« en mai » (réponse IA simulée : tachePropose « mois ») : la tâche est datée de mai 2027, pas « Un jour » ni novembre', async () => {
    const taches = await jouer('Prévoir la sono du mariage, en mai', { tachePropose: { quand: 'mois', texte: 'Prévoir la sono du mariage' } });
    const t = taches.find(x => /sono/i.test(x.texte));
    expect(t, `tâches du carnet : ${JSON.stringify(taches.map(x => x.texte))}`).toBeTruthy();
    expect(t!.echeance ?? '', `échéance posée : ${t!.echeance}`).toMatch(/^2027-05/);
  }, 30000);
});

describe('R82 · C70-6 (C69-8 en partie, maquette v01-afaire) : À faire n\'a que les groupes de la maquette : Cette semaine · Fin du mois · Un jour', () => {
  it('une tâche datée du mois suivant (7 déc.) n\'ouvre pas un groupe « Plus loin » : elle se range dans l\'un des trois groupes et ne se perd pas', () => {
    const items = clone(fixtureSuivi()) as Item[];
    const carnets = lireCarnets(items as never, { archives: true }).map(c => c.id !== IDS_SUIVI.ecoulement ? c
      : { ...c, carnet: { ...c.carnet, taches: [...(c.carnet.taches ?? []), { id: 'ZZ-C70-T-DEC', texte: 'Appeler le chaudronnier pour la hotte', echeance: '2026-12-07', precision: 'semaine', origine: 'locale', creeeLe: '2026-11-24T08:00:00.000Z' }] } } as CarnetDoc);
    const { container } = render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} messages={[]} onCocher={() => {}} onOuvrir={() => {}} onEcheance={() => {}} />);
    const titres = [...container.querySelectorAll('h3')].map(h => lu(h).replace(/\s*\d+\s*$/, ''));
    expect(titres, `groupes : ${JSON.stringify(titres)}`).not.toContain('Plus loin');
    expect(titres.filter(t => !['Cette semaine', 'Fin du mois', 'Un jour'].includes(t)), 'tout groupe hors de la maquette').toEqual([]);
    expect(lu(container), 'la tâche datée de décembre reste visible').toMatch(/Appeler le chaudronnier pour la hotte/);
  });
});

describe('R82 · C70-7 : « ailleurs ? » ne propose pas de rattacher une piste sans rapport (ventilateur mural / malt pilsner)', () => {
  it('« autre piste : un ventilateur mural, 150 CHF, mais plus en stock chez le fournisseur », tapée dans le problème vapeur, l\'IA (réponse SIMULÉE, forme de ia.ts) désigne le carnet « malt pilsner en rupture » : aucune proposition « Rattacher à … »', async () => {
    const items = fixtureSuivi().filter(i => [IDS_SUIVI.vapeur, IDS_SUIVI.malt].includes(i.id as never)) as Item[];
    const malt = lireCarnets(items as never, { archives: true }).find(c => c.id === IDS_SUIVI.malt)!;
    expect(malt.title, 'le carnet voisin de l\'essai est celui du malt en rupture').toMatch(/malt/i);
    const phrase = 'ZZ TEST — c70 autre piste : un ventilateur mural, 150 CHF, mais plus en stock chez le fournisseur';
    const m = monter(items, { ouvrir: IDS_SUIVI.vapeur, appels: reponseIA([{ sorte: 'note', texte: phrase.replace('ZZ TEST — c70 ', ''), genre: 'note', carnetId: IDS_SUIVI.malt, citation: 'un ventilateur mural, 150 CHF, mais plus en stock chez le fournisseur' }]) });
    await attendre(100);
    await taper(phrase);
    const corps = lu(document.body);
    expect(corps, 'la bulle « ailleurs ? »').not.toMatch(/ailleurs \?/);
    expect(corps, `proposition de rattacher au carnet « ${malt.title} »`).not.toMatch(/Rattacher à[^?]{0,80}malt/i);
    expect(m).toBeTruthy();
  }, 30000);
});

describe('R82 · C70-8 : une commande client n\'est pas du « Conditionnement » (sans IA : l\'analyse locale)', () => {
  const PHRASE = 'un client du marché veut 20 bouteilles de blanche pour un mariage en mai';
  it('la règle locale : « 20 bouteilles de blanche » demandées par un client ne disent pas l\'étape Conditionnement', () => {
    expect(sousDomaineParMots(PHRASE), `sous-domaine par mots : ${sousDomaineParMots(PHRASE)} (domaine : ${domaineParMots(PHRASE)})`).not.toBe('Conditionnement');
  });
  it('le carnet que la phrase crée (IA éteinte) n\'est pas rangé sous Brasserie › Conditionnement', async () => {
    const m = monter([], { mode: 'eteint' });
    await attendre(80);
    await taper(`ZZ TEST — c70 ${PHRASE}`);
    const neufs = lireCarnets(m.magasin.lire() as never, { archives: true });
    expect(neufs.length, 'la phrase crée un carnet').toBeGreaterThan(0);
    const rangement = neufs.map(c => `${c.carnet.domaine?.valeur ?? '—'} › ${(c.carnet.categorie?.chemin ?? []).join(' › ')}`);
    expect(rangement.filter(r => /Conditionnement/i.test(r)), `rangements : ${JSON.stringify(rangement)}`).toEqual([]);
  }, 30000);
});

describe('R82 · C70-10 (maquette v01-resolu) : « Résolus en 2026 · le dernier en vert » — le dernier est visible sans défiler', () => {
  const resolus = (): Item[] => {
    const base = fixtureSuivi() as Item[];
    const apres = (items: Item[], r: { ok: boolean; ecritures?: unknown; raison?: string }): Item[] => { if (!r.ok) throw new Error(`refusé : ${r.raison}`); return appliquerEcritures(items as never, r.ecritures as never) as Item[]; };
    const a = apres(base, retenirOption(base as never, { carnetId: IDS_SUIVI.vapeur, faconId: 'ZZ-SUIVI-VAPEUR-FH', le: '2026-11-25T09:00:00.000Z' }) as never);
    const b = apres(a, resoudre(a as never, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-25T11:00:00.000Z', sorte: 'reparation' }) as never);
    /* le test en ligne : 5 résolus dans l'année ; deux résolus de plus, clonés d'un résolu du jeu (titres et dates propres) */
    const modele = b.find(i => i.id === IDS_SUIVI.pompe)! as unknown as { id: string; title: string; carnet: { suivi: { resolu: { le: string } } } };
    const clones = ['2026-03-12', '2026-06-20'].map((jour, i) => { const k = clone(modele); k.id = `ZZ-C70-RESOLU-${i}`; k.title = `ZZ TEST — c70 résolu ${i + 1}`; k.carnet.suivi.resolu.le = `${jour}T12:00:00.000Z`; return k as unknown as Item; });
    return [...b, ...clones];
  };
  it('avec au moins 4 résolus dans l\'année, le dernier (data-dernier) est le premier de la bande, ou la bande est amenée sur lui (scrollIntoView / scrollLeft)', async () => {
    const items = resolus();
    const nb = lireCarnets(items as never, { archives: true }).filter(c => c.carnet.suivi?.etat === 'resolu' || !!c.carnet.archive).length;
    expect(nb, 'le jeu porte au moins 4 résolus (précondition)').toBeGreaterThanOrEqual(4);
    const amenes: Element[] = [];
    Element.prototype.scrollIntoView = function (this: Element) { amenes.push(this); } as never;
    let defile = 0;
    const d = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft');
    Object.defineProperty(Element.prototype, 'scrollLeft', { configurable: true, get() { return 0; }, set(v: number) { if (v > 0) defile++; } });
    try {
      monter(items, { ouvrir: IDS_SUIVI.vapeur });
      await attendre(150);
      const rang = document.querySelector('.cnp-tuiles-rang');
      expect(rang, 'la bande des résolus de l\'année').toBeTruthy();
      const tuiles = [...rang!.querySelectorAll('.cnp-tuile')];
      expect(tuiles.length, 'des tuiles').toBeGreaterThanOrEqual(4);
      const dernier = tuiles.find(t => t.hasAttribute('data-dernier'))!;
      const premier = tuiles[0] === dernier;
      const amene = amenes.includes(dernier) || defile > 0;
      expect(premier || amene, `le dernier (en vert) est la tuile n° ${tuiles.indexOf(dernier) + 1} sur ${tuiles.length}, dans une bande qui défile (overflow-x: auto) : il est hors de vue à 390 px ; ni premier, ni amené par scroll`).toBe(true);
    } finally {
      if (d) Object.defineProperty(Element.prototype, 'scrollLeft', d); else delete (Element.prototype as { scrollLeft?: number }).scrollLeft;
    }
  }, 30000);
});

/* =========================================================================================================== R83 */

interface Releve { phrase: string; requete: { data: { context: { carnets: Array<{ id: string; titre: string; criteres: Array<{ texte: string }>; articles: Array<{ nom?: string }>; notes: Array<{ id: string; texte: string }>; genre: string; etat: string; domaine?: string }> } } } }
const R1 = rangement1 as unknown as Releve;
/** Les carnets du contexte RÉEL de la requête de la phrase « vapeur » (anonymisés), remis dans le magasin tels que l'app les avait. */
const carnetsDuReleve = (r: Releve): Item[] => r.requete.data.context.carnets.map((c, i) => ({
  id: c.id, type: 'carnet', title: c.titre, status: 'idea',
  carnet: {
    version: 1, creeLe: `2026-11-${String(1 + (i % 20)).padStart(2, '0')}T08:00:00.000Z`, phrase: c.titre,
    criteres: c.criteres.map((k, j) => ({ id: `${c.id}-K${j}`, texte: k.texte, origine: 'vous' })), facons: [],
    articles: c.articles.map((a, j) => ({ id: `${c.id}-A${j}`, nom: a.nom ?? '', lecture: 'lue', valeurs: {}, origine: 'vous' })),
    notes: c.notes.map(n => ({ id: n.id, texte: n.texte, genre: 'note' })), photos: [],
    genre: { valeur: c.genre, origine: 'ia' }, ...(c.domaine ? { domaine: { valeur: c.domaine, origine: 'ia' } } : {}), suivi: { etat: c.etat, evenements: [] }
  }
})) as unknown as Item[];

describe('R83 · C70-3 (part de l\'app) : l\'IA dit « problème », « je cherche », Brassage › Vapeur : la carte et le carnet créé le montrent tels quels', () => {
  /* Réponse RÉELLE du 25.11 (rangement-1 : carnetId du voisin, aucun genre ni chemin) + les champs que la règle attend de l'IA, SIMULÉS : genreCarnet, chemin, etatPropose, domaine. */
  const ligneReelle = (R1 as unknown as { reponse: { result: { data: { lignes: Array<Record<string, unknown>> } } } }).reponse.result.data.lignes[0];
  const ligneAvecGenre = { ...ligneReelle, genreCarnet: 'probleme', chemin: ['Brassage', 'Vapeur'], etatPropose: 'cherche', domaine: 'brasserie' /* SIMULÉ */ };
  async function jouer() {
    const m = monter(carnetsDuReleve(R1), { appels: reponseIA([ligneAvecGenre]) });
    await attendre(60);
    await taper(R1.phrase);
    const feuille = document.querySelector('[data-feuille-rangement]');
    return { m, feuille, carte: lu(feuille?.querySelector('.cnl-carte-ia')) };
  }
  it('la carte « rangé pour toi » dit « nouveau problème · Je cherche » et le chemin Brasserie › Brassage › Vapeur (maquette v01-saisie), pas « nouveau carnet · idée »', async () => {
    const { carte } = await jouer();
    expect(carte, 'la carte est posée').toBeTruthy();
    expect(carte, carte).not.toMatch(/nouveau carnet · idée/);
    expect(carte, carte).toMatch(/nouveau problème/i);
    expect(carte, carte).toMatch(/Je cherche/i);
    expect(carte, carte).toMatch(/Brasserie\s*›\s*Brassage\s*›\s*Vapeur/);
  }, 30000);
  it('« Garder à part » : le carnet créé est un problème « je cherche », domaine Brasserie, catégorie Brassage › Vapeur (jamais « Idée », jamais « Brasserie » seul)', async () => {
    const { m, feuille } = await jouer();
    const gar = boutonSans(/^garder a part$/, feuille ?? document);
    expect(gar, 'la carte offre « Garder à part »').toBeTruthy();
    fireEvent.click(gar!);
    await attendre(250);
    const ids = new Set(carnetsDuReleve(R1).map(i => i.id));
    const neufs = lireCarnets(m.magasin.lire() as never, { archives: true }).filter(c => !ids.has(c.id));
    expect(neufs.length, `carnets neufs : ${JSON.stringify(neufs.map(c => c.title))}`).toBe(1);
    const c = neufs[0];
    expect(c.carnet.genre?.valeur, 'genre').toBe('probleme');
    expect(c.carnet.suivi?.etat, 'état').toBe('cherche');
    expect(c.carnet.domaine?.valeur, 'domaine').toBe('brasserie');
    expect(c.carnet.categorie?.chemin, 'catégorie').toEqual(['Brassage', 'Vapeur']);
  }, 30000);
});
