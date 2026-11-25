// @vitest-environment jsdom
/**
 * Voie c68-tests (25.11) : les tests ROUGES des règles R70 à R76 tirées du test en ligne du tour 68 (voies/critique-68/RESULTAT.md ; BUGS.md C68-1 à C68-13 et les C67 rouverts).
 * Écrits depuis les RÈGLES (voies/c68-tests/DOSSIER.md) avant tout correctif : celui qui corrige n'écrit pas le test (L17).
 *
 * POURQUOI CE FICHIER EXISTE (L11, L28) : c67Regles était vert et 9 C67 sont revenus rouverts en ligne, parce que ses tests jugeaient l'IA SIMULÉE. Ici, chaque test de
 * rangement (R70) MONTE `CarnetsVue`, tape la phrase dans le champ de la liste, et l'appel `aiTask` simulé RENVOIE la VRAIE réponse de l'IA relevée en ligne le 25.11
 * (tests/fixtures/c68/rangement-1.json à -6.json : { phrase, requete, reponse }, carnets du contexte anonymisés). `iaSimulee` n'est jamais appelée ; le carnet-cible
 * que la vraie réponse désigne (`carnetId`) existe dans le magasin, reconstruit depuis le contexte réel de la requête. Aucun réseau, aucun Gemini (AiClient lève s'il est appelé).
 *
 *  - R70 (C68-1, C68-12, C67-2) : la carte « rangé pour toi » SUIT la réponse : titre court de l'IA (jamais la phrase), carnet cible existant proposé, chemin, genre, état, tâche proposée ;
 *    OK pose ce que la carte propose.
 *  - R71 (C68-2, C67-4) : le coût en tête d'un problème = la retenue ou une fourchette des pistes ouvertes, jamais la somme ; une option écartée sort du calcul.
 *  - R72 (C68-3, C67-5) : le Résolu dit le vrai chemin (pas « À ranger »), la retenue, les options fermées.
 *  - R73 (C68-4) : la ligne d'un résolu dans la liste dit la retenue et l'état, jamais « à comparer · 540 ».
 *  - R74 (C68-5, C68-6, C68-7) : la raison tapée à l'écart s'affiche ; un toucher sur Veille = une bulle, même après écarter puis reprendre ; les phrases « condenseur A/B » deviennent des options.
 *  - R75 (C68-8, C68-10, C68-11) : la relecture (essayé, problème ≠ titre, chemin, retour au problème) ; le menu du domaine propose les sous-domaines ; l'arbre (jauge, état, repli).
 *  - R76 (C68-9) : À faire : coût à droite, un projet du Planning déjà passé n'est pas « Cette semaine », l'appui long s'ouvre au toucher.
 * Non couvert ici : C68-13 (« Réalisés 0 » avec 6 résolus) vit dans StocksTab / App (hors src/ui/carnets, interdit à c68-fix) : à jouer par la voie onglets (voir RESULTAT.md).
 * Limites : jsdom ne mesure aucune boîte (la jauge se juge à ses 4 éléments `<i>`, le texte au contenu) ; le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI, fixtureSuivi } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { changerOption, resoudre, retenirOption, suiviDe } from '../../src/domain/carnets/suivi';
import { filDe } from '../../src/domain/carnets/fil';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { resumeJetons } from '../../src/ui/carnets/filRegles';
import rangement1 from '../fixtures/c68/rangement-1.json';
import rangement2 from '../fixtures/c68/rangement-2.json';
import rangement3 from '../fixtures/c68/rangement-3.json';
import rangement4 from '../fixtures/c68/rangement-4.json';
import rangement5 from '../fixtures/c68/rangement-5.json';
import rangement6 from '../fixtures/c68/rangement-6.json';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

type Item = ReturnType<typeof fixtureSuivi>[number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const LE = '2026-11-25T09:00:00.000Z';
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const boutonTexte = (re: RegExp, racine: ParentNode = document): HTMLElement | undefined =>
  [...racine.querySelectorAll<HTMLElement>('button, [role="tab"], [role="menuitem"], [role="menuitemradio"]')].find(b => re.test(lu(b)) || re.test(b.getAttribute('aria-label') ?? ''));
const appliquer = (items: Item[], r: { ok: boolean; ecritures?: unknown; raison?: string }): Item[] => {
  if (!r.ok) throw new Error(`opération refusée : ${r.raison}`);
  return appliquerEcritures(items as never, r.ecritures as never) as Item[];
};
const doc = (items: Item[], id: string): CarnetDoc => lireCarnets(items as never, { archives: true }).find(c => c.id === id)!;

interface Montage { appels?: AppelsIA; ouvrir?: string; mode?: string; finances?: { plans: never[]; transactions: never[]; payments: never[] } }
function monter(items: Item[], o: Montage = {}) {
  const magasin = magasinMemoire(items as never[]);
  const r = render(<CarnetsVue magasin={magasin} finances={o.finances ?? { plans: [], transactions: [], payments: [] }} mode={(o.mode ?? 'simule') as never}
    {...(o.appels ? { appels: o.appels } : {})} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never}
    {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} />);
  return { magasin, ...r };
}

/* ------------------------------------------------------------------------------------------------ les vraies réponses (R70) */

interface Releve {
  phrase: string;
  requete: { data: { task: string; context: { texte: string; carnets: Array<{ id: string; titre: string; criteres: Array<{ texte: string }>; articles: Array<{ nom?: string }>; notes: Array<{ id: string; texte: string }>; genre: string; etat: string; domaine?: string }> } } };
  reponse: { result: { ok: boolean; data: { lignes: Array<Record<string, unknown>> } } };
}
const RELEVES: Releve[] = [rangement1, rangement2, rangement3, rangement4, rangement5, rangement6] as unknown as Releve[];

/** Les carnets du contexte RÉEL de la requête (anonymisés), remis dans le magasin tels que l'app les avait : ceux que la vraie réponse désigne existent. */
function itemsDeLaRequete(r: Releve): Item[] {
  return r.requete.data.context.carnets.map((c, i) => ({
    id: c.id, type: 'carnet', title: c.titre, status: 'idea',
    carnet: {
      version: 1, creeLe: `2026-11-${String(1 + (i % 20)).padStart(2, '0')}T08:00:00.000Z`, phrase: c.titre,
      criteres: c.criteres.map((k, j) => ({ id: `${c.id}-K${j}`, texte: k.texte, origine: 'vous' })),
      facons: [],
      articles: c.articles.map((a, j) => ({ id: `${c.id}-A${j}`, nom: a.nom ?? '', lecture: 'lue', valeurs: {}, origine: 'vous' })),
      /* « Carnet réel 3 » est un projet du PLANNING (relevé c68, écart 2) : l'anonymisation a retiré sa note de dates, remise ici pour que le carnet soit ce qu'il était */
      notes: [...c.notes.map(n => ({ id: n.id, texte: n.texte, genre: 'note' })), ...(c.id === 'CARNET-REEL-3' ? [{ id: 'NOTE-PLANNING-3', texte: 'À faire du 01.12.2026 au 15.01.2027 (Planning, Structure)', genre: 'a-faire' }] : [])],
      photos: [],
      genre: { valeur: c.genre, origine: 'ia' },
      ...(c.domaine ? { domaine: { valeur: c.domaine, origine: 'ia' } } : {}),
      suivi: { etat: c.etat, evenements: [] }
    }
  })) as unknown as Item[];
}

/** L'appel `aiTask` simulé : renvoie la VRAIE réponse relevée (`reponse.result.data`), note la requête ; `lire` ne sert pas (aucun lien dans ces phrases). */
function appelAvecLaVraieReponse(r: Releve) {
  const vus: unknown[] = [];
  const appels: AppelsIA = {
    async ranger(contexte) { vus.push(contexte); return { ok: r.reponse.result.ok, data: r.reponse.result.data }; },
    async lire() { throw new Error('aucun lien dans ces phrases'); }
  };
  return { appels, vus };
}

/** La phrase tapée dans le champ de la liste (le geste de la saisie rapide), Entrée ; rend la feuille « rangé pour toi » et ce qu'elle dit, lu AVANT tout nettoyage. */
async function taperLaPhrase(r: Releve) {
  const { appels, vus } = appelAvecLaVraieReponse(r);
  const m = monter(itemsDeLaRequete(r), { appels });
  await attendre(60);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: r.phrase } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(500);
  const feuille = document.querySelector('[data-feuille-rangement]');
  const carte = feuille?.querySelector('.cnl-carte-ia') ?? null;
  return { ...m, vus, feuille, carte, titre: lu(carte?.querySelector('.cnl-t')), chemin: lu(carte?.querySelector('.cnl-sub')), jetons: lu(carte?.querySelector('.cnl-jetons')), tache: lu(carte?.querySelector('.cnl-tache')), texte: lu(carte) };
}

/* =========================================================================================================== R70 */

describe('R70 (C68-1, C67-2) : la carte « rangé pour toi » SUIT la vraie réponse de l\'IA, champ par champ', () => {
  describe.each([
    { n: 2, nom: 'fusible (problème, carnetNeuf, Brassage › Électricité, noté)', titre: 'Fusible plaque saute avec la pompe', chemin: 'Brasserie › Brassage › Électricité', jeton: /nouveau problème/, etat: 'Noté', tache: null },
    { n: 4, nom: 'étiquettes (problème, carnetNeuf, Conditionnement › Étiquettes, je cherche)', titre: 'Étiquettes qui se décollent au frigo', chemin: 'Brasserie › Conditionnement › Étiquettes', jeton: /nouveau problème/, etat: 'Je cherche', tache: null },
    { n: 5, nom: 'fermenteur (achat, carnetNeuf, Fermentation, tâche proposée)', titre: 'Deuxième fermenteur 30 L', chemin: 'Brasserie › Fermentation', jeton: /nouveau carnet · achat/, etat: null, tache: 'Acheter un deuxième fermenteur 30 L' },
    { n: 6, nom: 'bière de Noël (idée, titre et carnetNeuf, Brassage › Recettes)', titre: 'Bière de Noël à la cannelle', chemin: 'Brasserie › Brassage › Recettes', jeton: /nouveau carnet · idée/, etat: null, tache: null }
  ])('rangement-$n : $nom', ({ n, titre, chemin, jeton, etat, tache }) => {
    let s: Awaited<ReturnType<typeof taperLaPhrase>>;
    beforeAll(async () => { s = await taperLaPhrase(RELEVES[n - 1]); cleanup(); }, 30000);

    it('la requête envoyée est bien celle de la phrase tapée (le test joue la vraie conversation)', () => {
      expect((s.vus[0] as { texte?: string })?.texte).toBe(RELEVES[n - 1].phrase);
    });
    it('la feuille « rangé pour toi » est posée sur la liste', () => { expect(s.feuille, 'la feuille').toBeTruthy(); expect(s.carte, 'la carte').toBeTruthy(); });
    it('le titre est le titre court que l\'IA propose, jamais la phrase entière', () => {
      expect(s.titre, 'le titre de la carte').toContain(titre);
      expect(s.titre, 'jamais la phrase').not.toMatch(/c68/);
    });
    it('le chemin dit « domaine › sous-domaine » de l\'IA', () => { expect(s.chemin).toContain(chemin); });
    it('le genre posé par l\'IA', () => { expect(s.jetons).toMatch(jeton); });
    if (etat) it(`l'état proposé : « ${etat} »`, () => { expect(s.jetons).toContain(etat); });
    if (tache) it('la tâche que l\'IA propose est sur la carte', () => { expect(s.tache).toContain(tache); });
  });

  describe.each([
    { n: 1, nom: 'vapeur : l\'IA désigne le carnet existant « trop de vapeur au brassage »', cible: 'trop de vapeur au brassage' },
    { n: 3, nom: 'sol époxy : l\'IA désigne un carnet existant (Carnet réel 3)', cible: 'Carnet réel 3' }
  ])('rangement-$n : $nom', ({ n, cible }) => {
    let s: Awaited<ReturnType<typeof taperLaPhrase>>;
    beforeAll(async () => { s = await taperLaPhrase(RELEVES[n - 1]); cleanup(); }, 30000);

    it('la carte nomme le carnet que l\'IA désigne', () => { expect(s.texte, `carte : « ${s.texte} »`).toContain(cible); });
    it('la carte ne dit pas « nouveau carnet » : l\'IA a désigné un carnet existant', () => { expect(s.texte).not.toMatch(/nouveau carnet/); });
    it('le carnet existant est proposé ou retenu (« Rattacher à … ? » / « rattaché »), jamais la phrase entière en titre', () => {
      expect(s.texte, `carte : « ${s.texte} »`).toMatch(/rattach(é|er à)/i);
      expect(s.titre, 'jamais la phrase en titre').not.toMatch(/c68/);
    });
  });

  it('C68-12 : OK sur la carte du fermenteur pose la tâche que la carte propose (elle n\'attend plus dans le carnet)', async () => {
    const s = await taperLaPhrase(RELEVES[4]);
    expect(s.tache, 'la carte propose bien une tâche').toContain('Acheter un deuxième fermenteur 30 L');
    fireEvent.click(boutonTexte(/^OK$/, s.feuille!)!);
    await attendre(200);
    const taches = lireCarnets(s.magasin.lire() as never).flatMap(c => (c.carnet.taches ?? []).map(t => t.texte));
    expect(taches.some(t => /fermenteur 30 L/i.test(t)), `tâches écrites : ${JSON.stringify(taches)}`).toBe(true);
  }, 30000);
});

/* ------------------------------------------------------------------------------------------------ le problème de la vapeur, tel qu'en ligne */

const ID_V = 'ZZ-C68-VAPEUR';
const PHRASE_V = 'ZZ TEST — c68 trop de buée au plafond pendant l’ébullition, ça goutte sur le malt';
const TITRE_V = 'ZZ TEST — c68 vapeur au brassage';
const HOTTE = 'Hotte + extracteur au plafond, budget 200 CHF';
const nov = (jour: number, h = 12) => `2026-11-${String(jour).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00.000Z`;

/**
 * L'état relevé en ligne (cap/C6-options.txt) : le problème « Je cherche », UNE option (la hotte, 200 CHF) ; « condenseur A, 690 CHF » et « condenseur B, 540 CHF, plus en
 * stock » sont des phrases devenues des articles, avec leur montant en jeton SANS option visée (le jeton de la hotte, lui, vise la hotte). Ni catégorie ni domaine posés
 * (« Rangé : À ranger » en ligne). `domaine`, `categorie` : ce que le test pose en plus.
 */
function vapeurEnLigne(o: { categorie?: boolean; domaine?: boolean; titre?: string } = {}): Item[] {
  const msg = (id: string, le: string, texte: string, et: Array<Record<string, unknown>>) => ({
    id, type: 'carnet-message', title: texte, status: 'done',
    carnetMessage: { texte, le, depuis: id === 'ZZ-C68-M1' ? 'liste' : ID_V, rangement: 'ia', effets: [{ carnetId: ID_V, cible: 'note', id: `${id}-N` }], etiquettes: et.map(e => ({ carnetId: ID_V, origine: 'ia', ...e })) }
  });
  const carnet = {
    id: ID_V, type: 'carnet', title: o.titre ?? TITRE_V, status: 'idea',
    carnet: {
      version: 1, creeLe: nov(25, 2), phrase: PHRASE_V, criteres: [],
      facons: [{ id: 'FH', nom: HOTTE, etat: 'ouverte', origine: 'ia', suivi: { etat: 'piste', historique: [{ etat: 'piste', le: nov(25, 3), origine: 'ia' }] } }],
      articles: [
        { id: 'AA', nom: 'Condenseur A', prixCentimes: 69000, devise: 'CHF', vendeur: 'Brouwland', dispo: 'en stock', lecture: 'lue', valeurs: {}, origine: 'vous' },
        { id: 'AB', nom: 'Condenseur B', prixCentimes: 54000, devise: 'CHF', lecture: 'illisible', valeurs: {}, origine: 'vous' }
      ],
      notes: [
        { id: 'ZZ-C68-M1-N', texte: PHRASE_V, genre: 'note', messageId: 'ZZ-C68-M1' }, { id: 'ZZ-C68-M2-N', texte: 'Piste : condenseur A, 690 CHF chez Brouwland', genre: 'note', messageId: 'ZZ-C68-M2' },
        { id: 'ZZ-C68-M3-N', texte: `Autre système : hotte + extracteur au plafond, budget 200 CHF`, genre: 'note', messageId: 'ZZ-C68-M3' }, { id: 'ZZ-C68-M4-N', texte: 'Condenseur B, 540 CHF, plus en stock', genre: 'note', messageId: 'ZZ-C68-M4' }
      ],
      photos: [], genre: { valeur: 'probleme', origine: 'ia' }, suivi: { etat: 'cherche', evenements: [] },
      ...(o.domaine ? { domaine: { valeur: 'brasserie', origine: 'ia' } } : {}), ...(o.categorie ? { categorie: { chemin: ['Brassage', 'Vapeur'], origine: 'ia' } } : {})
    }
  };
  return clone([
    carnet,
    msg('ZZ-C68-M1', nov(25, 2), PHRASE_V, [{ sorte: 'constat' }]),
    msg('ZZ-C68-M2', nov(25, 3), 'Piste : condenseur A, 690 CHF chez Brouwland', [{ sorte: 'piste' }, { sorte: 'cout', montantCentimes: 69000, devise: 'CHF' }]),
    msg('ZZ-C68-M3', nov(25, 4), 'Autre système : hotte + extracteur au plafond, budget 200 CHF', [{ sorte: 'piste', optionId: 'FH' }, { sorte: 'cout', montantCentimes: 20000, devise: 'CHF', optionId: 'FH' }]),
    msg('ZZ-C68-M4', nov(25, 5), 'Condenseur B, 540 CHF, plus en stock', [{ sorte: 'cout', montantCentimes: 54000, devise: 'CHF' }, { sorte: 'pas-trouve' }])
  ]) as unknown as Item[];
}
const ecarteeLaHotte = (items: Item[], raison?: string): Item[] => appliquer(items, changerOption(items as never, { carnetId: ID_V, faconId: 'FH', vers: 'ecartee', ...(raison ? { raison } : {}), le: LE }) as never);
const retenueLaHotte = (items: Item[]): Item[] => appliquer(items, retenirOption(items as never, { carnetId: ID_V, faconId: 'FH', le: LE }) as never);
const resolu = (items: Item[]): Item[] => appliquer(items, resoudre(items as never, { carnetId: ID_V, le: '2026-11-25T11:00:00.000Z', sorte: 'reparation' }) as never);
const totalEnTete = () => lu(document.querySelector('.cnp-total'));

/* =========================================================================================================== R71 */

describe('R71 (C68-2, C67-4) : le coût en tête d\'un problème = la retenue ou la fourchette des pistes ; jamais la somme ; l\'écartée sort du calcul', () => {
  it('le résumé des jetons du fil (A 690, hotte 200, B 540) : jamais 690 + 540 + 200 = 1 430 CHF', () => {
    const r = resumeJetons(lireMessages(vapeurEnLigne() as never), ID_V);
    expect(r?.total?.centimes, 'total = somme de trois solutions exclusives').not.toBe(143000);
  });

  it('Je cherche, trois pistes : « ≈ 1 430 CHF » ne se lit nulle part, la fourchette 200 à 690 oui', async () => {
    monter(vapeurEnLigne(), { ouvrir: ID_V });
    await attendre(100);
    expect(lu(document.querySelector('.cn-ouvert')), 'le problème est ouvert').toMatch(/Condenseur/);
    expect(lu(document.querySelector('.cn-ouvert')), 'jamais la somme').not.toMatch(/1\s?430/);
    expect(totalEnTete(), 'la fourchette des pistes ouvertes').toMatch(/200\D{1,6}690/);
  }, 20000);

  it('la hotte écartée (avec sa raison) : son 200 sort du calcul, aucune somme en tête', async () => {
    monter(ecarteeLaHotte(vapeurEnLigne(), 'il faut refaire l’électricité'), { ouvrir: ID_V });
    await attendre(100);
    expect(lu(document.querySelector('.cn-ouvert')), 'jamais la somme').not.toMatch(/1\s?[234]30/);
    const t = totalEnTete();
    if (t) { expect(t, 'une option écartée ne compte plus').not.toMatch(/200/); expect(t).not.toMatch(/1\s?[234]30/); }
  }, 20000);

  it('la hotte retenue : le coût en tête est celui de la retenue (200), jamais la somme ni le prix d\'une piste', async () => {
    monter(retenueLaHotte(vapeurEnLigne()), { ouvrir: ID_V });
    await attendre(100);
    expect(lu(document.querySelector('.cn-ouvert')), 'jamais la somme').not.toMatch(/1\s?430/);
    const t = totalEnTete();
    if (t) { expect(t).toMatch(/200/); expect(t).not.toMatch(/690|540/); }
  }, 20000);
});

/* =========================================================================================================== R72 */

describe('R72 (C68-3, C67-5) : le Résolu dit le vrai chemin du carnet, la retenue, les options fermées', () => {
  const ouvrirResolu = async (items: Item[]) => { monter(items, { ouvrir: ID_V }); await attendre(100); return lu(document.querySelector('.cn-ouvert')); };

  it('un carnet rangé en Brasserie (le domaine se lit dans le sens) ne dit jamais « Rangé : À ranger »', async () => {
    const t = await ouvrirResolu(resolu(retenueLaHotte(vapeurEnLigne())));
    expect(t, 'le Résolu est affiché').toMatch(/Résolu/);
    expect(t, 'chemin').not.toMatch(/Rangé : À ranger/);
    expect(t, 'le domaine lu par les mots').toMatch(/Rangé : Brasserie/);
  }, 20000);

  it('catégorie posée (Brassage › Vapeur) : « Rangé : Brasserie › Brassage › Vapeur »', async () => {
    const t = await ouvrirResolu(resolu(retenueLaHotte(vapeurEnLigne({ categorie: true, domaine: true }))));
    expect(t).toMatch(/Rangé : Brasserie › Brassage › Vapeur/);
  }, 20000);

  it('le Résolu dit la retenue (la hotte, « Fermé grâce à » ou « retenu »), pas seulement « Résolu le jour même »', async () => {
    const t = await ouvrirResolu(resolu(retenueLaHotte(vapeurEnLigne())));
    expect(t, `Résolu : « ${t} »`).toMatch(/(Fermé|retenu|retenue|choisi)[^.]{0,80}Hotte \+ extracteur/i);
  }, 20000);

  it('les autres solutions essayées (condenseurs A et B) sont dites « pas pris » dans le Résolu', async () => {
    const t = await ouvrirResolu(resolu(retenueLaHotte(vapeurEnLigne())));
    expect(t, 'Condenseur A').toMatch(/Condenseur A.{0,16}pas pris/i);
    expect(t, 'Condenseur B').toMatch(/Condenseur B.{0,16}pas pris/i);
  }, 20000);

  it('une option écartée avec sa raison : le Résolu redit la raison à côté de l\'option', async () => {
    /* la hotte est écartée avec sa raison, puis le problème se résout autrement (la réparation) : la solution fermée garde la raison de l'écart */
    const t = await ouvrirResolu(resolu(ecarteeLaHotte(vapeurEnLigne(), 'il faut refaire l’électricité')));
    expect(t, `Résolu : « ${t} »`).toMatch(/Hotte \+ extracteur.{0,90}il faut refaire l’électricité/i);
  }, 20000);
});

/* =========================================================================================================== R73 */

describe('R73 (C68-4) : la ligne d\'un résolu dans la liste dit la retenue et l\'état, jamais « à comparer · 540 »', () => {
  it('filtre « résolus » : la ligne du problème résolu (hotte retenue, 200 CHF) dit 200 CHF et Résolu', async () => {
    monter(resolu(retenueLaHotte(vapeurEnLigne())));
    await attendre(100);
    fireEvent.click(document.querySelector('.cnl-case[data-etat="resolu"]')!);
    await attendre(60);
    const ligne = [...document.querySelectorAll('.cnl-pb')].find(l => /vapeur au brassage/.test(lu(l)));
    expect(ligne, 'la ligne du résolu dans le filtre').toBeTruthy();
    const t = lu(ligne);
    expect(t, 'l\'état').toMatch(/Résolu/);
    expect(t, 'jamais « à comparer » sur un résolu').not.toMatch(/à comparer/);
    expect(t, 'jamais le prix d\'un article hors stock jamais choisi').not.toMatch(/540/);
    expect(t, 'la retenue et son coût').toMatch(/200\s?CHF/);
  }, 20000);
});

/* =========================================================================================================== R74 */

/** Ouvre l'option dont le nom commence par `nom`, puis touche le geste `geste` (Piste, Veille, Retenir, Écarter). */
async function geste(nom: RegExp, g: RegExp) {
  fireEvent.click(boutonTexte(new RegExp(`^${nom.source}.*, changer$`))!);
  await attendre(30);
  fireEvent.click(boutonTexte(g, document.querySelector('.cnp-opt-gestes') ?? document)!);
  await attendre(60);
}

describe('R74 (C68-5, C68-6, C68-7) : raison d\'écart, veille, options', () => {
  it('C68-5 : « Écarter » avec la raison tapée « il faut refaire l\'électricité » : la raison s\'affiche avec l\'écart', async () => {
    monter(vapeurEnLigne(), { ouvrir: ID_V });
    await attendre(100);
    await geste(/Hotte/, /^Écarter$/);
    const champ = document.querySelector<HTMLInputElement>('input[aria-label="Raison de l\'écart"]');
    expect(champ, 'le champ de la raison').toBeTruthy();
    fireEvent.change(champ!, { target: { value: 'il faut refaire l’électricité' } });
    fireEvent.click(document.querySelector<HTMLElement>('form.cnp-raison button[type="submit"]')!);
    await attendre(150);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t, 'l\'option est écartée').toMatch(/écart/i);
    expect(t, 'la raison tapée se lit').toContain('il faut refaire l’électricité');
  }, 20000);

  it('C68-6 : Veille, puis écarter, puis reprendre l\'option : toujours UNE bulle « veille demandée » pour elle', async () => {
    monter(vapeurEnLigne(), { ouvrir: ID_V });
    await attendre(100);
    await geste(/Hotte/, /^Veille$/);
    const bulles = () => [...document.querySelectorAll('[data-evenement="veille"]')].filter(e => /Hotte/.test(lu(e))).length;
    expect(bulles(), 'une bulle après le premier toucher').toBe(1);
    await geste(/Hotte/, /^Écarter$/);
    fireEvent.click(document.querySelector<HTMLElement>('form.cnp-raison button[type="submit"]')!);
    await attendre(100);
    await geste(/Hotte/, /^(Piste|Retenir)$/);
    expect(bulles(), 'une seule bulle après écarter puis reprendre').toBe(1);
  }, 30000);

  it('C68-6 (domaine) : veille, écart, reprise : un seul événement de veille dans le fil pour l\'option', () => {
    let it = vapeurEnLigne();
    it = appliquer(it, changerOption(it as never, { carnetId: ID_V, faconId: 'FH', vers: 'veille', le: nov(25, 6) }) as never);
    it = appliquer(it, changerOption(it as never, { carnetId: ID_V, faconId: 'FH', vers: 'ecartee', le: nov(25, 7) }) as never);
    it = appliquer(it, changerOption(it as never, { carnetId: ID_V, faconId: 'FH', vers: 'piste', le: nov(25, 8) }) as never);
    const c = doc(it, ID_V);
    const fil = filDe(c, lireMessages(it as never));
    const veilles = fil.jours.flatMap(j => j.entrees).filter(e => e.sorte === 'evenement' && e.evenement.sorte === 'veille' && e.evenement.optionId === 'FH');
    expect(veilles.length, `événements de veille : ${suiviDe(c).evenements.map(e => e.sorte).join(',')}`).toBe(1);
  });

  it('C68-7 : « Piste : condenseur A, 690 CHF chez Brouwland » et « Condenseur B, 540 CHF, plus en stock » tapés dans le problème deviennent des options du problème', async () => {
    const base = vapeurEnLigne().filter(i => !['AA', 'AB'].includes(i.id));
    const items = clone(base).map(i => { if (i.id === ID_V) (i as unknown as { carnet: { articles: unknown[] } }).carnet.articles = []; return i; });
    const m = monter(items, { ouvrir: ID_V, mode: 'eteint' });
    await attendre(100);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    for (const phrase of ['Piste : condenseur A, 690 CHF chez Brouwland', 'Condenseur B, 540 CHF, plus en stock']) {
      fireEvent.change(champ(), { target: { value: phrase } });
      await attendre(30);
      fireEvent.keyDown(champ(), { key: 'Enter' });
      await attendre(300);
    }
    const c = lireCarnets(m.magasin.lire() as never).find(x => x.id === ID_V)!;
    const noms = c.carnet.facons.map(f => f.nom);
    expect(noms.some(n => /condenseur a/i.test(n)), `options : ${JSON.stringify(noms)}`).toBe(true);
    expect(noms.some(n => /condenseur b/i.test(n)), `options : ${JSON.stringify(noms)}`).toBe(true);
    expect(lu(document.querySelector('.cn-ouvert')), 'jamais « lu sur la page » pour une phrase de ses notes').not.toMatch(/lu sur la page/i);
  }, 30000);

  it('C68-7 : un article « pas trouvé » / plus en stock n\'est jamais 1er du tableau, et n\'est pas rangé sous la hotte', async () => {
    monter(vapeurEnLigne(), { ouvrir: ID_V });
    await attendre(100);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t, 'Comparer : B n\'est pas 1er').not.toMatch(/rang · article[^]*?\b1\b\s*Condenseur B/);
    expect(t, 'les condenseurs ne sont pas des articles rangés sous « Hotte… aucun article encore »').not.toMatch(/aucun article encore/);
  }, 20000);
});

/* =========================================================================================================== R75 */

describe('R75 (C68-8, C68-10, C68-11) : relecture, menu du domaine, arbre', () => {
  const unResolu = (): Item[] => resolu(retenueLaHotte(vapeurEnLigne()));
  const relecture = async () => {
    monter(unResolu());
    await attendre(100);
    fireEvent.click(document.querySelector('.cnl-dn-resolus')!);
    await attendre(100);
    return lu(document.querySelector('.cnp-fiche'));
  };

  it('C68-8 : la fiche relue a une ligne « essayé » (les solutions pas prises)', async () => {
    const t = await relecture();
    expect(t, `fiche : « ${t} »`).toMatch(/essayé.{0,60}Condenseur/i);
  }, 20000);

  it('C68-8 : la ligne « problème » dit le constat (la phrase d\'origine), elle ne recopie pas le titre', async () => {
    const t = await relecture();
    expect(t, `fiche : « ${t} »`).toMatch(/problème.{0,20}trop de buée au plafond/i);
  }, 20000);

  it('C68-8 : la catégorie du résolu relu dit son chemin (Brasserie), jamais « À ranger »', async () => {
    const t = await relecture();
    expect(t).not.toMatch(/À ranger/);
    expect(t).toMatch(/Brasserie/);
  }, 20000);

  it('C68-8 : « ‹ Retour » depuis la relecture ramène au problème d\'où l\'on vient, pas à la liste', async () => {
    monter(unResolu(), { ouvrir: ID_V });
    await attendre(100);
    fireEvent.click(boutonTexte(/^Relire/)!);
    await attendre(100);
    expect(document.querySelector('.cnp-relecture'), 'la relecture est ouverte').toBeTruthy();
    fireEvent.click(document.querySelector('.cnl-retour')!);
    await attendre(100);
    expect(document.querySelector('.cnp-relecture'), 'plus de relecture').toBeFalsy();
    expect(lu(document.querySelector('.cn-ouvert')), 'le problème').toMatch(/vapeur au brassage/);
    expect(document.querySelector('.cnl-liste'), 'pas la liste').toBeFalsy();
  }, 20000);

  it('C68-10 : le menu du domaine d\'un problème sans catégorie propose domaine › sous-domaine (Brassage, Conditionnement)', async () => {
    monter(vapeurEnLigne(), { ouvrir: ID_V });
    await attendre(100);
    fireEvent.click(document.querySelector<HTMLElement>('.cnd-pastille')!);
    await attendre(40);
    const menu = lu(document.querySelector('.cnd-menu'));
    expect(menu, 'le menu est ouvert').toMatch(/Brasserie/);
    expect(menu, 'sous-domaine Brassage').toMatch(/Brassage/);
    expect(menu, 'sous-domaine Conditionnement').toMatch(/Conditionnement/);
  }, 20000);

  describe('C68-11 : l\'arbre, avec les carnets RÉELS (anonymisés) du contexte de la requête', () => {
    it('chaque carnet « Je cherche » ou « Décidé » de la liste porte sa jauge (4 pastilles), son état en mot et un dernier pas', async () => {
      monter(itemsDeLaRequete(RELEVES[0]));
      await attendre(100);
      const lignes = [...document.querySelectorAll('.cnl-pb')].filter(l => /Je cherche|Décidé/.test(lu(l.querySelector('.cnl-etat'))));
      expect(lignes.length, 'des lignes « Je cherche » dans la liste').toBeGreaterThanOrEqual(3);
      for (const l of lignes) {
        expect(l.querySelectorAll('.cnl-jauge i').length, `jauge de « ${lu(l)} »`).toBe(4);
        expect(lu(l.querySelector('.cnl-pas')).length, `dernier pas de « ${lu(l)} »`).toBeGreaterThan(2);
      }
    }, 20000);

    it('le filtre « je cherche » du coup d\'œil : chaque ligne montrée porte jauge, « Je cherche » et dernier pas', async () => {
      monter(itemsDeLaRequete(RELEVES[0]));
      await attendre(100);
      fireEvent.click(document.querySelector('.cnl-case[data-etat="cherche"]')!);
      await attendre(60);
      const lignes = [...document.querySelectorAll('.cnl-pb')];
      expect(lignes.length).toBeGreaterThanOrEqual(3);
      for (const l of lignes) {
        expect(l.querySelectorAll('.cnl-jauge i').length, `jauge de « ${lu(l)} »`).toBe(4);
        expect(lu(l.querySelector('.cnl-etat')), `état de « ${lu(l)} »`).toBe('Je cherche');
        expect(lu(l.querySelector('.cnl-pas')).length, `dernier pas de « ${lu(l)} »`).toBeGreaterThan(2);
      }
    }, 20000);

    it('les carnets à comparer (Carnet réel 1 et 2 : des articles à comparer, « Houblons citra » et « Chambre froide » en ligne) sont repliés par sous-domaine, pas à plat au repos', async () => {
      monter(itemsDeLaRequete(RELEVES[0]));
      await attendre(100);
      const plates = [...document.querySelectorAll('.cnl-pb.cnl-autre')].map(l => lu(l)).filter(t => /Carnet réel [12]\b/.test(t));
      expect(plates, `lignes à plat : ${JSON.stringify(plates)}`).toEqual([]);
    }, 20000);
  });
});

/* =========================================================================================================== R76 */

describe('R76 (C68-9) : À faire — coût à droite, un projet passé n\'est pas « Cette semaine », l\'appui long au toucher', () => {
  /** « Hotte recyclage » : un projet du Planning (tâche dérivée de sa note de dates), budget 200 CHF ; « Ancien projet » : fini en septembre ; un problème avec une tâche à 540 CHF. */
  const avecPlanning = (): Item[] => {
    const projet = (id: string, titre: string, du: string, au: string, budget?: string) => ({
      id, type: 'carnet', title: titre, status: 'idea',
      carnet: { version: 1, creeLe: '2026-11-01T12:00:00.000Z', phrase: titre, criteres: [], facons: [], articles: [], photos: [],
        notes: [{ id: `${id}-N1`, texte: `À faire du ${du} au ${au} (Planning, Structure)`, genre: 'a-faire' }, ...(budget ? [{ id: `${id}-N2`, texte: budget, genre: 'note' }] : [])] }
    });
    return clone([...fixtureSuivi(), projet('ZZ-C68-HOTTE', 'ZZ TEST — c68 Hotte recyclage', '01.12.2026', '15.01.2027', 'Budget 200 CHF'),
      projet('ZZ-C68-PASSE', 'ZZ TEST — c68 Ancien projet passé', '01.09.2026', '15.09.2026')]) as unknown as Item[];
  };
  const ouvrirAFaire = async () => {
    monter(avecPlanning());
    await attendre(100);
    fireEvent.click(boutonTexte(/^À faire/)!);
    await attendre(60);
  };
  const ligneDe = (re: RegExp) => [...document.querySelectorAll('li.af-ligne')].find(l => re.test(lu(l)));

  it('« Hotte recyclage » (budget 200 CHF) porte son coût dans sa ligne', async () => {
    await ouvrirAFaire();
    const l = ligneDe(/c68 Hotte recyclage/);
    expect(l, 'la ligne du projet').toBeTruthy();
    expect(lu(l), `ligne : « ${lu(l)} »`).toMatch(/200\s?CHF/);
  }, 20000);

  it('un projet du Planning terminé en septembre n\'est pas dans « Cette semaine »', async () => {
    await ouvrirAFaire();
    const cette = document.querySelector('[data-groupe="cette-semaine"]');
    expect(lu(cette), 'Cette semaine').not.toMatch(/Ancien projet passé/);
  }, 20000);

  it('appui long de 500 ms au TOUCHER (pointerdown touch, puis pointercancel du navigateur) : « Quand ? » s\'ouvre', async () => {
    await ouvrirAFaire();
    const ligne = ligneDe(/Acheter le condenseur B/);
    expect(ligne, 'une tâche écrite (non dérivée du Planning), « Acheter le condenseur B »').toBeTruthy();
    const corps = ligne!.querySelector('.af-corps')!;
    fireEvent.touchStart(corps);
    fireEvent.pointerDown(corps, { pointerType: 'touch' });
    fireEvent.pointerCancel(corps, { pointerType: 'touch' });
    await attendre(800);
    expect(document.querySelector('[role="dialog"][aria-label^="Quand"]'), 'la feuille « Quand ? »').toBeTruthy();
  }, 20000);
});
