// @vitest-environment jsdom
/**
 * Voie note-tests (25.11) : les tests ROUGES des règles N1 à N5 (NOTE-EXPLOITEE, LIEN-PAS-PRODUIT ; work/missions/2026-11-24-carnet-personas/note/SYNTHESE.md ;
 * DEFAUTS-RECURRENTS.md). Écrits depuis les RÈGLES, avant tout correctif : celui qui corrige n'écrit pas le test.
 * Ses mots : « J'ai ajouté une note, l'ia devrait en faire qqch » ; « un lien peut être ajouté sans que ce soit un produit à comparer, comme par exemple un lien sur les frais d'envoi ».
 *
 * Par le composant : CarnetsVue monté sur un carnet de houblons ZZ (MotlerHops .fr, Hopfenmarkt .ch), la note tapée dans le champ du carnet, l'IA et la lecture des
 * pages INJECTÉES (`AppelsIA`) : aucun réseau, aucun Gemini. Les réponses de l'IA sont SIMULÉES, à la forme de functions/src/carnetIA.ts plus `articleId` (contrat de N1) :
 * tests/fixtures/note/carnet.ts ; DEMANDE RELEVE dans RESULTAT.md (aucune réponse réelle relevée pour ces cas).
 *
 *  - N1 : l'IA rattache la note à l'article dont elle parle, en citant le passage ; le contexte envoyé porte l'id et le domaine des articles ; un articleId inconnu,
 *         une citation absente du texte, ou deux articles qui correspondent : aucun rattachement.
 *  - N2 : le rattachement est un fait visible sur la ligne de l'article, sa fiche et Comparer (« ta note », la date), à côté de « en stock » (les deux gardés), annulable d'un toucher.
 *         Le MOT et l'endroit exacts restent à lui (mini maquettes) : le test lit « ta note », le sujet (dispo, qualité, délai) et la date, jamais une place ni un rang.
 *  - N3 : ses mots restent ses mots (jamais la réécriture de l'IA) ; « semble » ne devient jamais une certitude ; aucun score de confiance.
 *  - N4 : une vérification est PROPOSÉE (« Vérifier la dispo chez MotlerHops ») avec Relire ; jamais lancée seule (une lecture est facturée).
 *  - N5 : un lien d'information (frais d'envoi, conditions, guide) n'entre jamais dans Articles ni Comparer ; les frais d'envoi d'un vendeur s'appliquent à SES articles.
 *
 * Pas de surapprentissage : trois notes de formes différentes (dispo, qualité, délai), trois pages d'information. Un test déjà vert est marqué « garde-fou » avec sa raison.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets, type CarnetDoc } from '../../src/domain/carnets/modele';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import type { ContexteRangerCarnet, PageLue } from '../../functions/src/carnetIA';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { DOMAINE_HOPFEN, DOMAINE_MOTLER, ID_HOPFEN, ID_HOUBLONS, ID_MOTLER, NOTES, PAGES_INFO, houblonsDeuxSitesFr, houblonsZZ, pageInfoLue, reponseLien, reponseNote, type CasNote } from '../fixtures/note/carnet';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

beforeEach(() => {
  Element.prototype.scrollIntoView = function () {} as never;
  window.scrollTo = (() => {}) as never;
  Element.prototype.scrollTo = (() => {}) as never;
  localStorage.clear(); sessionStorage.clear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

/* ------------------------------------------------------------------------------------------------ outils */

const MAINT = () => new Date(MAINTENANT_SUIVI);
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const sansPlans = { plans: [] as FinancialPlan[], transactions: [], payments: [] };

/** Le fait d'une note sur un article : « ta note » (les mots de la règle N2). */
const TA_NOTE = /ta note/;
/** La date de saisie, 24 nov. : « ta note, 24 nov. ». */
const LE_24 = /24 nov/;

interface Montage {
  magasin: ReturnType<typeof magasinMemoire>;
  contextes: ContexteRangerCarnet[];
  lectures: string[];
}
interface Scenario {
  /** SIMULÉE : ce que l'IA rend pour le message. */
  ia: (contexte: ContexteRangerCarnet) => unknown;
  /** SIMULÉE : la page lue d'une adresse. */
  pages?: Record<string, PageLue>;
}

/** Le carnet de houblons, ouvert ; l'IA et la lecture des pages injectées et espionnées. */
function monter(doc: CarnetDoc, sc: Scenario): Montage {
  const contextes: ContexteRangerCarnet[] = [];
  const lectures: string[] = [];
  const appels: AppelsIA = {
    async ranger(contexte) { contextes.push(contexte); return { ok: true, data: sc.ia(contexte) }; },
    async lire(url) {
      lectures.push(url);
      const p = sc.pages?.[url];
      if (p) return p;
      return { url, domaine: new URL(url).hostname.replace(/^www\./, ''), statut: 'lue', nom: 'CITRA® (US)', prix: 3.72, devise: 'EUR', dispo: 'en-stock', luLe: 1 } as PageLue;
    }
  };
  const magasin = magasinMemoire([doc as never]);
  render(<CarnetsVue magasin={magasin} finances={sansPlans} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT}
    ouvrir={{ id: doc.id, at: 1 }} ecrirePlan={(() => {}) as never} />);
  return { magasin, contextes, lectures };
}
const carnetDe = (m: Montage): CarnetDoc => lireCarnets(m.magasin.lire()).find(c => c.id === ID_HOUBLONS)!;

/** Le geste : taper la note dans le champ du carnet ouvert, Entrée, laisser l'IA répondre, accepter la feuille de rangement s'il y en a une. */
async function taper(m: Montage, texte: string) {
  await attendre(60);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  expect(champ(), 'le champ du carnet ouvert').toBeTruthy();
  fireEvent.change(champ(), { target: { value: texte } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(700);
  const feuille = document.querySelector('[data-feuille-rangement]');
  const ok = feuille ? bouton(/^ok$/, feuille) : undefined;
  if (ok) { fireEvent.click(ok); await attendre(80); }
  void m;
}

async function monterEtTaper(cas: CasNote, doc: CarnetDoc = houblonsZZ(), ia: Scenario['ia'] = () => reponseNote(cas)) {
  const m = monter(doc, { ia });
  await taper(m, cas.texte);
  return m;
}

/** La feuille Articles du carnet ouvert. */
async function ouvrirArticles(): Promise<Element> {
  const pastille = [...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''));
  expect(pastille, 'la pastille « Articles » du carnet').toBeTruthy();
  fireEvent.click(pastille!);
  await attendre(40);
  const feuille = document.querySelector('[role="dialog"][aria-modal="true"]');
  expect(feuille, 'la feuille Articles').toBeTruthy();
  return feuille!;
}
const carteDe = (feuille: Element, vendeur: string): HTMLButtonElement | undefined =>
  [...feuille.querySelectorAll('button')].find(b => sans(b.textContent ?? '').includes(sans(vendeur)) && !/retirer|deplacer/.test(sans(b.getAttribute('aria-label') ?? ''))) as HTMLButtonElement | undefined;

/** La ligne (carte) d'un article dans la feuille Articles. */
async function ligneDe(vendeur: string): Promise<string> {
  const feuille = await ouvrirArticles();
  const carte = carteDe(feuille, vendeur);
  expect(carte, `la carte ${vendeur} de la feuille Articles`).toBeTruthy();
  return lu(carte!.closest('li, article, [data-article]') ?? carte);
}
/** La fiche d'un article (sa carte touchée). Rend la fiche. */
async function ficheDe(vendeur: string): Promise<Element> {
  const feuille = await ouvrirArticles();
  const carte = carteDe(feuille, vendeur);
  expect(carte, `la carte ${vendeur} de la feuille Articles`).toBeTruthy();
  fireEvent.click(carte!);
  await attendre(40);
  const fiche = document.querySelector('.cn-fiche');
  expect(fiche, `la fiche de ${vendeur}`).toBeTruthy();
  return fiche!;
}
/** Comparer : le texte de chaque colonne (en-tête et cellules). */
async function colonnesComparer(): Promise<string[]> {
  const lien = document.querySelector('.cn-comparer-lien') as HTMLElement | null;
  expect(lien, 'le lien « Comparer » du carnet').toBeTruthy();
  fireEvent.click(lien!);
  await attendre(60);
  const t = [...document.querySelectorAll('table')].find(x => x.querySelector('thead th[scope="col"]'));
  expect(t, 'le tableau de Comparer').toBeTruthy();
  const entetes = [...t!.querySelectorAll('thead th')];
  const lignes = [...t!.querySelectorAll('tbody tr')].map(tr => [...tr.children]).filter(c => c.every(x => !(x as HTMLTableCellElement).colSpan || (x as HTMLTableCellElement).colSpan === 1));
  return entetes.map((th, i) => [lu(th), ...lignes.map(c => lu(c[i]))].join(' | '));
}
const colonneDe = (cols: string[], nom: RegExp) => cols.find(c => nom.test(sans(c.split(' | ')[0]))) ?? '';

/** Les bribes que chaque article porte à l'écran pour s'y retrouver (nom lu, vendeur). */
const NOM: Record<string, RegExp> = { [ID_MOTLER]: /citra® \(us\)|motlerhops/, [ID_HOPFEN]: /hopfenpellets|hopfenmarkt/ };
const DISPO_PAGE = /en stock/;

/* ================================================================================================== N1 : l'IA rattache la note à l'article dont elle parle */

describe('N1 : l\'IA rattache une note à l\'article dont elle parle, en citant le passage qui le prouve', () => {
  it('le contexte envoyé à l\'IA porte, pour chaque article du carnet, son id et son domaine (prérequis : functions/src/carnetIA.ts n\'envoie que {nom, valeurs})', async () => {
    const m = await monterEtTaper(NOTES[0]);
    expect(m.contextes.length, 'l\'IA est appelée une fois').toBe(1);
    const carnet = m.contextes[0].carnets.find(c => c.id === ID_HOUBLONS);
    expect(carnet, 'le carnet ouvert est dans le contexte').toBeTruthy();
    const articles = carnet!.articles as unknown as Array<{ id?: string; domaine?: string }>;
    expect(articles.map(a => a.id).sort(), 'l\'id de chaque article').toEqual([ID_HOPFEN, ID_MOTLER].sort());
    expect(articles.find(a => a.id === ID_MOTLER)?.domaine ?? '', 'le domaine de MotlerHops').toContain(DOMAINE_MOTLER);
    expect(articles.find(a => a.id === ID_HOPFEN)?.domaine ?? '', 'le domaine de Hopfenmarkt').toContain(DOMAINE_HOPFEN);
  }, 20000);

  for (const cas of NOTES) {
    it(`forme « ${cas.forme} » (« ${cas.citation} » désigne ${cas.vendeur}) : la note est rattachée à cet article et à lui seul`, async () => {
      await monterEtTaper(cas);
      const feuille = await ouvrirArticles();
      const cible = lu(carteDe(feuille, cas.vendeur)!.closest('li, article, [data-article]') ?? carteDe(feuille, cas.vendeur)!);
      const autre = cas.articleId === ID_MOTLER ? 'Hopfenmarkt' : 'MotlerHops';
      const autreTexte = lu(carteDe(feuille, autre)!.closest('li, article, [data-article]') ?? carteDe(feuille, autre)!);
      expect(sans(cible), `la ligne de ${cas.vendeur} dit « ta note » : ${cible}`).toMatch(TA_NOTE);
      expect(sans(autreTexte), `la ligne de ${autre} ne dit rien de la note : ${autreTexte}`).not.toMatch(TA_NOTE);
    }, 20000);
  }

  /* Les trois gardes suivants passent déjà : aujourd'hui, RIEN n'est rattaché. Ils gardent le correctif de N1 d'un rattachement trop large. */
  it('garde-fou (déjà juste, à garder juste) : un articleId que le carnet ne contient pas n\'est rattaché à aucun article, la note reste dans le carnet', async () => {
    const cas = NOTES[0];
    const m = await monterEtTaper(cas, houblonsZZ(), () => reponseNote(cas, { articleId: 'ZZ-INCONNU' }));
    expect(m.contextes.length).toBe(1);
    const feuille = await ouvrirArticles();
    for (const v of ['MotlerHops', 'Hopfenmarkt']) expect(sans(lu(carteDe(feuille, v)!.closest('li, article, [data-article]') ?? carteDe(feuille, v)!)), v).not.toMatch(TA_NOTE);
    expect(carnetDe(m).carnet.notes.length, 'la note est rangée dans le carnet, à part').toBe(1);
  }, 20000);

  it('garde-fou (déjà juste, à garder juste) : une citation qui n\'est pas dans la phrase tapée n\'ouvre aucun rattachement', async () => {
    const cas = NOTES[0];
    const m = await monterEtTaper(cas, houblonsZZ(), () => reponseNote(cas, { citation: 'site hollandais' }));
    expect(m.contextes.length).toBe(1);
    const feuille = await ouvrirArticles();
    for (const v of ['MotlerHops', 'Hopfenmarkt']) expect(sans(lu(carteDe(feuille, v)!.closest('li, article, [data-article]') ?? carteDe(feuille, v)!)), v).not.toMatch(TA_NOTE);
    expect(carnetDe(m).carnet.notes.length, 'la note reste dans le carnet, à part').toBe(1);
  }, 20000);

  it('garde-fou (déjà juste, à garder juste) : « le site français » désigne DEUX articles (deux sites .fr) : aucun rattachement, même si l\'IA en désigne un', async () => {
    const cas = NOTES[0];
    const m = await monterEtTaper(cas, houblonsDeuxSitesFr());
    expect(m.contextes.length).toBe(1);
    const feuille = await ouvrirArticles();
    for (const v of ['MotlerHops', 'Houblons de Bretagne']) {
      const carte = carteDe(feuille, v);
      expect(carte, `la carte ${v}`).toBeTruthy();
      expect(sans(lu(carte!.closest('li, article, [data-article]') ?? carte!)), v).not.toMatch(TA_NOTE);
    }
    expect(carnetDe(m).carnet.notes.length, 'la note reste dans le carnet, à part').toBe(1);
  }, 20000);
});

/* ================================================================================================== N2 : le rattachement est un fait visible, annulable */

describe('N2 : le rattachement devient un fait visible (ligne, fiche, Comparer) à côté de « en stock », annulable d\'un toucher', () => {
  const dispo = NOTES[0];

  it('ligne de l\'article : « dispo douteuse · ta note, 24 nov. » ET « en stock » (les deux gardés) ; l\'autre article n\'a rien', async () => {
    await monterEtTaper(dispo);
    const t = sans(await ligneDe('MotlerHops'));
    expect(t, `le fait sur la ligne : ${t}`).toMatch(TA_NOTE);
    expect(t, 'le sujet : la dispo').toMatch(/dispo/);
    expect(t, 'douteuse, jamais un verdict').toMatch(/douteu/);
    expect(t, 'la date de sa note').toMatch(LE_24);
    expect(t, '« en stock » lu sur la page reste dit').toMatch(DISPO_PAGE);
  }, 20000);

  it('fiche de l\'article : le même fait, la date, et « en stock » toujours là', async () => {
    await monterEtTaper(dispo);
    const t = sans(lu(await ficheDe('MotlerHops')));
    expect(t, `le fait sur la fiche : ${t.slice(0, 300)}`).toMatch(TA_NOTE);
    expect(t).toMatch(/douteu/);
    expect(t).toMatch(LE_24);
    expect(t, '« en stock » lu sur la page reste dit').toMatch(DISPO_PAGE);
  }, 20000);

  it('Comparer : la colonne de l\'article dit le fait ; celle de l\'autre ne dit rien', async () => {
    await monterEtTaper(dispo);
    const cols = await colonnesComparer();
    const motler = sans(colonneDe(cols, NOM[ID_MOTLER]));
    const hopfen = sans(colonneDe(cols, NOM[ID_HOPFEN]));
    expect(motler, `colonnes : ${cols.map(c => c.slice(0, 60)).join(' // ')}`).not.toBe('');
    expect(motler, 'la colonne MotlerHops dit « ta note »').toMatch(TA_NOTE);
    expect(hopfen, 'la colonne Hopfenmarkt ne dit rien de la note').not.toMatch(TA_NOTE);
  }, 20000);

  for (const cas of NOTES) {
    it(`forme « ${cas.forme} » : la fiche de ${cas.vendeur} dit le fait (sujet, « ta note », date) ; celle de l'autre article, rien`, async () => {
      await monterEtTaper(cas);
      const t = sans(lu(await ficheDe(cas.vendeur)));
      expect(t, `la fiche de ${cas.vendeur} : ${t.slice(0, 300)}`).toMatch(TA_NOTE);
      expect(t, `le sujet « ${cas.forme} »`).toMatch(cas.sujet);
      expect(t, 'la date de sa note').toMatch(LE_24);
    }, 20000);
  }

  it('annulable d\'un toucher : le fait se retire, la note reste dans le carnet', async () => {
    const m = await monterEtTaper(dispo);
    const fiche = await ficheDe('MotlerHops');
    expect(sans(lu(fiche)), 'le fait est là').toMatch(TA_NOTE);
    const annuler = bouton(/annuler|retirer|detacher|enlever/, fiche);
    expect(annuler, 'un bouton pour annuler le rattachement, sur la fiche').toBeTruthy();
    fireEvent.click(annuler!);
    await attendre(60);
    expect(sans(lu(document.querySelector('.cn-fiche') ?? document.body)), 'le fait a disparu de la fiche').not.toMatch(TA_NOTE);
    expect(carnetDe(m).carnet.notes.length, 'la note n\'est pas supprimée avec lui').toBe(1);
  }, 20000);
});

/* ================================================================================================== N3 : ses mots, jamais une certitude, aucun score */

describe('N3 : sa phrase n\'est jamais réécrite ; « semble » ne devient jamais une certitude ; aucun score de confiance', () => {
  for (const cas of NOTES) {
    it(`forme « ${cas.forme} » : la fiche cite ses mots (« ${cas.motsDits} ») tels quels, pas la réécriture de l'IA`, async () => {
      await monterEtTaper(cas);
      const t = sans(lu(await ficheDe(cas.vendeur)));
      expect(t, `ses mots sur la fiche : ${t.slice(0, 300)}`).toContain(sans(cas.motsDits));
      expect(t, 'la réécriture de l\'IA (une certitude) ne s\'affiche pas').not.toContain(sans(cas.reecriture.replace(/\.$/, '')));
    }, 20000);
  }

  it('dispo : « semble » ne devient jamais « rupture » ni « épuisé » ; la dispo lue sur la page reste « en stock » (jamais effacée)', async () => {
    await monterEtTaper(NOTES[0]);
    const t = sans(lu(await ficheDe('MotlerHops')));
    expect(t, 'le fait existe (sinon rien à juger)').toMatch(TA_NOTE);
    const sansSaPhrase = t.replace(sans(NOTES[0].motsDits), ' ');
    expect(sansSaPhrase, 'aucun verdict hors de sa phrase').not.toMatch(/rupture|epuis|indisponible|plus disponible|plus de stock|n'a plus/);
    expect(t).toMatch(DISPO_PAGE);
  }, 20000);

  it('aucun score de confiance sur le fait (ni pourcentage, ni « confiance », ni « fiabilité »)', async () => {
    await monterEtTaper(NOTES[0]);
    const t = sans(lu(await ficheDe('MotlerHops')));
    expect(t, 'le fait existe (sinon rien à juger)').toMatch(TA_NOTE);
    const apresNote = t.slice(t.search(TA_NOTE));
    expect(apresNote.slice(0, 200), 'ni score ni jauge').not.toMatch(/confiance|fiabilit|probab|\d\s?%|sur de|certain/);
  }, 20000);
});

/* ================================================================================================== N4 : une vérification proposée, jamais lancée seule */

describe('N4 : une question à vérifier est proposée (« Vérifier la dispo chez MotlerHops », avec Relire de la page), jamais lancée seule (facturée)', () => {
  it('dispo : la proposition « Vérifier la dispo chez MotlerHops » est montrée avec un bouton Relire, et aucune lecture n\'est partie', async () => {
    const m = await monterEtTaper(NOTES[0]);
    const texte = sans(lu(document.body));
    expect(texte, 'la proposition de vérifier, chez le bon vendeur').toMatch(/verifier la dispo chez motlerhops/);
    const proposition = [...document.querySelectorAll('*')].filter(e => /verifier la dispo chez motlerhops/.test(sans(e.textContent ?? ''))).pop();
    const relire = proposition ? bouton(/relire/, proposition.closest('li, section, article, div') ?? proposition) : undefined;
    expect(relire, 'un bouton « Relire » dans la proposition').toBeTruthy();
    expect(m.lectures, 'jamais lancée seule').toEqual([]);
  }, 20000);

  it('dispo : toucher Relire dans la proposition lit la page de MotlerHops, une seule fois', async () => {
    const m = await monterEtTaper(NOTES[0]);
    const proposition = [...document.querySelectorAll('*')].filter(e => /verifier la dispo chez motlerhops/.test(sans(e.textContent ?? ''))).pop();
    expect(proposition, 'la proposition').toBeTruthy();
    const relire = bouton(/relire/, proposition!.closest('li, section, article, div') ?? proposition!);
    expect(relire, 'le bouton « Relire » de la proposition').toBeTruthy();
    fireEvent.click(relire!);
    await attendre(300);
    expect(m.lectures, 'la page de l\'article a été relue, une fois').toEqual([`https://www.${DOMAINE_MOTLER}/citra-pellets`]);
  }, 20000);

  it('délai : la proposition vérifie le délai chez MotlerHops (pas la dispo)', async () => {
    await monterEtTaper(NOTES[2]);
    expect(sans(lu(document.body)), 'une proposition de vérifier le délai ou la livraison, chez le bon vendeur').toMatch(/verifier (le delai|la livraison|les delais)[^.]{0,30}motlerhops/);
  }, 20000);

  for (const cas of NOTES) {
    it(`garde-fou (déjà juste, à garder juste) : forme « ${cas.forme} » : après le rattachement et une attente, aucune lecture n'est partie seule`, async () => {
      const m = await monterEtTaper(cas);
      await attendre(1000);
      expect(m.lectures, 'une lecture est facturée : elle ne part que sur son geste').toEqual([]);
    }, 20000);
  }
});

/* ================================================================================================== N5 : un lien d'information n'est pas un article */

describe('N5 : un lien d\'information (frais d\'envoi, conditions, guide) n\'entre jamais dans Articles ni Comparer ; les frais d\'un vendeur s\'appliquent à ses articles', () => {
  async function coller(p: (typeof PAGES_INFO)[number], comme: 'note' | 'article') {
    const m = monter(houblonsZZ(), { ia: () => reponseLien(p, comme), pages: { [p.url]: pageInfoLue(p) } });
    await taper(m, p.message);
    return m;
  }

  for (const p of PAGES_INFO) {
    for (const comme of ['note', 'article'] as const) {
      it(`${comme === 'note' ? 'garde-fou (déjà juste : la consigne actuelle range une page sans prix en note) : ' : ''}${p.forme} : l'IA le range en ${comme === 'note' ? 'note' : 'ARTICLE (le défaut du brasseur)'} ; il n'est jamais un article du carnet`, async () => {
        const m = await coller(p, comme);
        expect(m.contextes.length, 'l\'IA est appelée').toBeGreaterThan(0);
        const articles = carnetDe(m).carnet.articles;
        expect(articles.map(a => a.id).sort(), `les articles du carnet : ${articles.map(a => a.nom ?? a.url).join(' ; ')}`).toEqual([ID_HOPFEN, ID_MOTLER].sort());
        expect(articles.some(a => a.url === p.url), 'aucun article à l\'adresse de la page d\'information').toBe(false);
      }, 20000);
    }
    it(`${p.forme} : le lien est gardé comme information (une note qui porte son nom ou son adresse), pas perdu`, async () => {
      const m = await coller(p, 'article');
      const notes = carnetDe(m).carnet.notes.map(n => n.texte);
      expect(notes.some(t => t.includes(p.nom) || t.includes(p.url)), `les notes du carnet : ${notes.join(' ; ')}`).toBe(true);
    }, 20000);
    it(`${p.forme} : Comparer garde deux colonnes (jamais une colonne pour la page d'information)`, async () => {
      await coller(p, 'article');
      const cols = await colonnesComparer();
      expect(cols.length - 1, `colonnes de Comparer : ${cols.map(c => c.slice(0, 40)).join(' // ')}`).toBe(2);
    }, 20000);
  }

  const frais = PAGES_INFO[0];
  it('frais d\'envoi : le port de MotlerHops (7,50 €) devient un fait du vendeur appliqué à SON article ; Hopfenmarkt n\'en reçoit aucun (inconnu, jamais 0)', async () => {
    const m = await coller(frais, 'note');
    const articles = carnetDe(m).carnet.articles;
    const motler = articles.find(a => a.id === ID_MOTLER)!;
    const hopfen = articles.find(a => a.id === ID_HOPFEN)!;
    expect(motler.livraison, 'la livraison de l\'article MotlerHops').toMatchObject({ prixCentimes: 750, devise: 'EUR' });
    expect(hopfen.livraison, 'Hopfenmarkt : aucun port inventé').toBeUndefined();
  }, 20000);

  it('frais d\'envoi : Comparer dit le port 7,50 € sur la colonne de MotlerHops seule (le prix rendu)', async () => {
    await coller(frais, 'note');
    const cols = await colonnesComparer();
    expect(sans(colonneDe(cols, NOM[ID_MOTLER])), 'la colonne MotlerHops dit le port').toMatch(/7[.,]50/);
    expect(sans(colonneDe(cols, NOM[ID_HOPFEN])), 'la colonne Hopfenmarkt ne dit pas ce port').not.toMatch(/7[.,]50/);
  }, 20000);

  it('garde-fou (déjà juste, à garder juste) : des conditions de vente et un guide ne posent aucun port sur les articles', async () => {
    for (const p of PAGES_INFO.filter(x => x.forme !== 'frais')) {
      const m = await coller(p, 'note');
      for (const a of carnetDe(m).carnet.articles) expect(a.livraison, `${p.forme} : ${a.id}`).toBeUndefined();
      cleanup();
    }
  }, 30000);
});
