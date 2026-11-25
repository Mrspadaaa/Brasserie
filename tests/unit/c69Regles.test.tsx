// @vitest-environment jsdom
/**
 * Voie c69-tests (25.11) : les tests ROUGES des règles R77 à R80 tirées du test en ligne du tour 69 (voies/critique-69/RESULTAT.md ; BUGS.md C69-1 à C69-13).
 * Écrits depuis les RÈGLES (voies/c69-tests/DOSSIER.md) avant tout correctif : celui qui corrige n'écrit pas le test (L17).
 *
 * Même méthode que c68Regles : on MONTE `CarnetsVue` ; pour le rangement, l'appel `aiTask` simulé RENVOIE la VRAIE réponse de l'IA relevée en ligne
 * (tests/fixtures/c68/rangement-*.json ; la phrase « vapeur » est rangement-1). Aucune réponse inventée : ce qui manque est écrit au RESULTAT (DEMANDE RELEVE).
 * Aucun réseau, aucun Gemini (AiClient lève s'il est appelé).
 *
 *  - R77 (C69-1, B)  : une phrase de problème matériel dont l'IA désigne un carnet existant (Rattacher) ne crée PAS d'abord un carnet « idée » au titre-phrase :
 *                      soit la carte propose le rattachement et RIEN n'est écrit avant le geste, soit un problème neuf au titre court et au chemin complet. Jamais les deux.
 *  - R78 (C69-2, B)  : Supprimer une note (bulle du fil) la retire VRAIMENT (composant, magasin, Firestore simulé), rechargement compris ; « Note supprimée » ne dit vrai
 *                      que si elle l'est ; Annuler la rend.
 *  - R79 (C69-3 à 6) : un problème : coût de la retenue, un jeton par valeur, picto/prix/disponibilité sur l'option, la ligne du résolu dans la liste.
 *  - R80 (C69-7 à 13): Réalisés, À faire, tâche datée tapée, arbre replié, Comparer, À venir, « Ses autres valeurs ».
 * Limites : jsdom ne mesure aucune boîte (colonnes étroites, débordement : jugés à la structure du DOM, le rendu réel à 390 px reste à voir en ligne).
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { MAINTENANT_SUIVI, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures, supprimerNote } from '../../src/domain/carnets/operations';
import { resoudre, retenirOption } from '../../src/domain/carnets/suivi';
import { resolusRealises } from '../../src/domain/carnets/realises';
import { coupDOeil } from '../../src/domain/carnets/arbre';
import { tableau } from '../../src/domain/carnets/comparer';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ID_PELLETS, TITRE_PELLETS, pelletsC67b, pelletsTrois } from '../fixtures/c67b/pellets';
import { filDe } from '../../src/domain/carnets/fil';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire, magasinSur, type MagasinCarnets, type PortFirestore } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import rangement1 from '../fixtures/c68/rangement-1.json';
import rangement2 from '../fixtures/c68/rangement-2.json';
import rangement4 from '../fixtures/c68/rangement-4.json';

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
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const boutonTexte = (re: RegExp, racine: ParentNode = document): HTMLElement | undefined =>
  [...racine.querySelectorAll<HTMLElement>('button, [role="tab"], [role="menuitem"], [role="menuitemradio"]')].find(b => re.test(lu(b)) || re.test(b.getAttribute('aria-label') ?? ''));

interface Montage { appels?: AppelsIA; ouvrir?: string; mode?: string; magasin?: MagasinCarnets }
function monter(items: Item[], o: Montage = {}) {
  const magasin = o.magasin ?? magasinMemoire(items as never[]);
  const r = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={(o.mode ?? 'simule') as never}
    {...(o.appels ? { appels: o.appels } : {})} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never}
    {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} />);
  return { magasin, ...r };
}

/** Un « Firestore » simulé : des documents par id, écriture document par document (poser / retirer), abonnés prévenus. Ce qu'il garde survit au démontage de l'écran : le rechargement. */
function firestoreSimule(initial: readonly Item[]) {
  const docs = new Map<string, Item>(initial.map(d => [d.id, clone(d)]));
  const abonnes = new Set<() => void>();
  const appels: string[] = [];
  const port: PortFirestore = {
    tous: () => [...docs.values()].map(clone),
    poser: (id, d) => { appels.push(`poser:${id}`); docs.set(id, clone(d as Item)); abonnes.forEach(a => a()); },
    retirer: id => { appels.push(`retirer:${id}`); docs.delete(id); abonnes.forEach(a => a()); },
    sAbonner: r => { abonnes.add(r); return () => { abonnes.delete(r); }; }
  };
  return { port, docs, appels, magasin: () => magasinSur(port) };
}

/* =========================================================================================================== R77 */

interface Releve {
  phrase: string;
  requete: { data: { context: { carnets: Array<{ id: string; titre: string; criteres: Array<{ texte: string }>; articles: Array<{ nom?: string }>; notes: Array<{ id: string; texte: string }>; genre: string; etat: string; domaine?: string }> } } };
  reponse: { result: { ok: boolean; data: { lignes: Array<Record<string, unknown>> } } };
}
/** Les carnets du contexte RÉEL de la requête (anonymisés), remis dans le magasin tels que l'app les avait. */
function itemsDeLaRequete(r: Releve): Item[] {
  return r.requete.data.context.carnets.map((c, i) => ({
    id: c.id, type: 'carnet', title: c.titre, status: 'idea',
    carnet: {
      version: 1, creeLe: `2026-11-${String(1 + (i % 20)).padStart(2, '0')}T08:00:00.000Z`, phrase: c.titre,
      criteres: c.criteres.map((k, j) => ({ id: `${c.id}-K${j}`, texte: k.texte, origine: 'vous' })), facons: [],
      articles: c.articles.map((a, j) => ({ id: `${c.id}-A${j}`, nom: a.nom ?? '', lecture: 'lue', valeurs: {}, origine: 'vous' })),
      notes: c.notes.map(n => ({ id: n.id, texte: n.texte, genre: 'note' })), photos: [],
      genre: { valeur: c.genre, origine: 'ia' }, ...(c.domaine ? { domaine: { valeur: c.domaine, origine: 'ia' } } : {}), suivi: { etat: c.etat, evenements: [] }
    }
  })) as unknown as Item[];
}
/** La phrase tapée dans le champ de la liste, Entrée ; l'appel `aiTask` simulé renvoie la VRAIE réponse. */
async function taperLaPhrase(r: Releve) {
  const vus: unknown[] = [];
  const appels: AppelsIA = {
    async ranger(contexte) { vus.push(contexte); return { ok: r.reponse.result.ok, data: r.reponse.result.data }; },
    async lire() { throw new Error('aucun lien dans ces phrases'); }
  };
  const avant = itemsDeLaRequete(r);
  const m = monter(avant, { appels });
  await attendre(60);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: r.phrase } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(500);
  const feuille = document.querySelector('[data-feuille-rangement]');
  const carte = feuille?.querySelector('.cnl-carte-ia') ?? null;
  const idsAvant = new Set(avant.map(i => i.id));
  const neufs = () => lireCarnets(m.magasin.lire() as never, { archives: true }).filter(c => !idsAvant.has(c.id));
  const notesDe = (id: string) => lireCarnets(m.magasin.lire() as never, { archives: true }).find(c => c.id === id)?.carnet.notes.length ?? 0;
  return { ...m, vus, feuille, carte, texte: lu(carte), neufs, notesDe, notesAvant: (id: string) => avant.find(i => i.id === id)!.carnet!.notes.length };
}

const R1 = rangement1 as unknown as Releve;
const PHRASE_ENTIERE = /ça coule sur les murs/;

describe('R77 (C69-1, B) : la phrase « vapeur » — l\'IA désigne un carnet existant (« trop de vapeur au brassage ») : jamais un carnet « idée » au titre-phrase ET la proposition de rattacher', () => {
  let s: Awaited<ReturnType<typeof taperLaPhrase>>;
  let proposeRattacher = false;
  let neufsAvantGeste: CarnetDoc[] = [];
  let notesAvantGeste = 0;
  beforeAll(async () => {
    s = await taperLaPhrase(R1);
    proposeRattacher = !!boutonTexte(/^Rattacher$/, s.feuille ?? document) || /Rattacher à ce carnet/.test(s.texte);
    neufsAvantGeste = s.neufs();
    notesAvantGeste = s.notesDe('CARNET-ZZ-7');
  }, 30000);

  it('la requête est bien celle de la phrase tapée (la vraie conversation est jouée)', () => {
    expect((s.vus[0] as { texte?: string })?.texte).toBe(R1.phrase);
  });
  it('la carte est posée et nomme le carnet voisin que l\'IA désigne', () => {
    expect(s.carte, 'la carte « rangé pour toi »').toBeTruthy();
    expect(s.texte).toContain('trop de vapeur au brassage');
  });
  it('JAMAIS LES DEUX : si la carte propose « Rattacher », aucun carnet neuf n\'a été créé avant le geste', () => {
    expect(proposeRattacher, 'la carte propose le rattachement (le cas de la réponse réelle)').toBe(true);
    expect(neufsAvantGeste.map(c => c.title), `carnets créés avant tout geste : ${JSON.stringify(neufsAvantGeste.map(c => c.title))}`).toEqual([]);
  });
  it('un carnet créé (s\'il en est) n\'a jamais la phrase entière pour titre : un titre court', () => {
    for (const c of neufsAvantGeste) {
      expect(c.title, 'titre du carnet créé').not.toMatch(PHRASE_ENTIERE);
      expect(c.title.length, 'titre court').toBeLessThanOrEqual(60);
    }
  });
  it('un carnet créé (s\'il en est) est un problème au chemin complet (domaine et catégorie), jamais « idée » nu sous « Brasserie »', () => {
    for (const c of neufsAvantGeste) {
      expect(c.carnet.genre?.valeur, `genre de « ${c.title} »`).toBe('probleme');
      expect(c.carnet.domaine?.valeur, 'domaine').toBeTruthy();
      expect(c.carnet.categorie?.chemin?.length ?? 0, 'catégorie (sous-domaine)').toBeGreaterThanOrEqual(1);
    }
  });
  it('RIEN n\'est écrit dans le carnet voisin avant le geste', () => {
    expect(notesAvantGeste).toBe(s.notesAvant('CARNET-ZZ-7'));
  });
  it('« Rattacher » (le geste) : la phrase va dans « trop de vapeur au brassage », et aucun carnet neuf ne reste', async () => {
    /* c69-fix : l'écran du beforeAll est démonté par le cleanup d'afterEach après le premier test ; le geste se joue sur un écran remonté */
    const s = await taperLaPhrase(R1);
    fireEvent.click(boutonTexte(/^Rattacher$/, s.feuille ?? document)!);
    await attendre(250);
    expect(s.neufs().map(c => c.title), 'aucun carnet à titre-phrase après le geste').toEqual([]);
    const cible = lireCarnets(s.magasin.lire() as never, { archives: true }).find(c => c.id === 'CARNET-ZZ-7')!;
    const messages = lireMessages(s.magasin.lire() as never);
    const dedans = cible.carnet.notes.some(n => /vapeur pendant l.ébullition/.test(n.texte)) || messages.some(m => /vapeur pendant l.ébullition/.test(m.carnetMessage.texte) && m.carnetMessage.effets.some(e => e.carnetId === 'CARNET-ZZ-7'));
    expect(dedans, 'la phrase est rangée dans le carnet voisin').toBe(true);
  }, 30000);
});

describe('R77 bis : « Garder à part » — le carnet qui naît est un problème neuf au titre court, jamais la phrase', () => {
  it('Garder à part : un carnet neuf au titre court (≠ phrase), problème', async () => {
    const s = await taperLaPhrase(R1);
    const gar = boutonTexte(/^Garder à part$/, s.feuille ?? document);
    expect(gar, 'la carte offre « Garder à part »').toBeTruthy();
    fireEvent.click(gar!);
    await attendre(250);
    const n = s.neufs();
    expect(n.length, `carnets neufs : ${JSON.stringify(n.map(c => c.title))}`).toBe(1);
    expect(n[0].title, 'jamais la phrase en titre').not.toMatch(PHRASE_ENTIERE);
    expect(n[0].title.length, 'titre court').toBeLessThanOrEqual(60);
  }, 30000);
});

describe('R77 ter : un problème NEUF (l\'IA ne désigne aucun carnet) : titre court et chemin complet (ce qui était juste reste juste)', () => {
  it.each([{ nom: 'fusible (rangement-2)', r: rangement2 as unknown as Releve, titre: /Fusible plaque/, chemin: ['Brassage', 'Électricité'] },
    { nom: 'étiquettes (rangement-4)', r: rangement4 as unknown as Releve, titre: /Étiquettes/, chemin: ['Conditionnement', 'Étiquettes'] }])('$nom', async ({ r, titre, chemin }) => {
    const s = await taperLaPhrase(r);
    const n = s.neufs();
    expect(n.length, 'un seul carnet neuf').toBe(1);
    expect(n[0].title).toMatch(titre);
    expect(n[0].title).not.toMatch(/c68/);
    expect(n[0].carnet.categorie?.chemin).toEqual(chemin);
    expect(n[0].carnet.domaine?.valeur).toBe('brasserie');
    expect(n[0].carnet.genre?.valeur).toBe('probleme');
    expect(s.carte?.textContent ?? '', 'la carte ne propose pas de rattacher').not.toMatch(/Rattacher à ce carnet/);
  }, 30000);
});

/* =========================================================================================================== R78 */

const ID_SOL = 'ZZ-C69-SOL';
const ID_MSG = 'ZZ-C69-MSG-MEMO';
const TEXTE_MEMO = 'ZZ TEST — c69 mémo : le sol époxy du local a bien tenu après le lavage';
const nov = (jour: number, h = 12) => `2026-11-${String(jour).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00.000Z`;

/** Un carnet de matières et d'outils (genre « idée », comme le Sol du brasseur) : 2 notes à lui, plus une note RANGÉE PAR LE MÉMO (son message reste dans le fil). */
function carnetSolAvecMemo(): Item[] {
  return clone([
    { id: ID_SOL, type: 'carnet', title: 'ZZ TEST — c69 sol, matières premières et outils', status: 'idea',
      carnet: { version: 1, creeLe: nov(1, 8), phrase: 'sol', criteres: [{ id: 'K1', texte: 'Résiste au lavage à l’eau chaude', origine: 'vous' }], facons: [], articles: [], photos: [],
        notes: [{ id: 'N-A', texte: 'Époxy deux composants, 14 CHF le kg', genre: 'note' }, { id: 'N-B', texte: 'Plinthe à reprendre côté fût', genre: 'note' }, { id: 'N-MEMO', texte: TEXTE_MEMO, genre: 'note', messageId: ID_MSG }],
        genre: { valeur: 'idee', origine: 'vous' } } },
    { id: ID_MSG, type: 'carnet-message', title: TEXTE_MEMO, status: 'done',
      carnetMessage: { texte: TEXTE_MEMO, le: nov(25, 3), depuis: 'liste', rangement: 'ia', effets: [{ carnetId: ID_SOL, cible: 'note', id: 'N-MEMO' }], etiquettes: [] } }
  ]) as unknown as Item[];
}
const bulleDuMemo = () => document.querySelector(`[data-message="${ID_MSG}"]`);
const bullesDu = (items: readonly Item[]) => {
  const c = lireCarnets(items as never, { archives: true }).find(x => x.id === ID_SOL)!;
  return filDe(c, lireMessages(items as never)).jours.flatMap(j => j.entrees).filter(e => (e.sorte === 'message' && e.message.id === ID_MSG) || (e.sorte === 'note' && e.note.id === 'N-MEMO'));
};
async function supprimerLaNoteDuMemo() {
  fireEvent.click(document.querySelector(`[aria-label^="Note : ${TEXTE_MEMO}"]`)!);
  await attendre(60);
  fireEvent.click(boutonTexte(/^Supprimer$/)!);
  await attendre(150);
}

describe('R78 (C69-2, B) : Supprimer une note (bulle du fil) la retire VRAIMENT, rechargement compris ; Annuler la rend', () => {
  it('le fil de départ montre la bulle du mémo (le test part de l\'état réel : note rangée par un message)', () => {
    expect(bullesDu(carnetSolAvecMemo()).length).toBe(1);
  });

  it('DOMAINE — supprimerNote : la bulle du mémo n\'est plus dans le fil du carnet une fois l\'écriture appliquée', () => {
    const items = carnetSolAvecMemo();
    const r = supprimerNote(items as never, { carnetId: ID_SOL, noteId: 'N-MEMO' });
    if (!r.ok) throw new Error(r.raison);
    const apres = appliquerEcritures(items as never, r.ecritures) as Item[];
    expect(lireCarnets(apres as never).find(c => c.id === ID_SOL)!.carnet.notes.map(n => n.id)).toEqual(['N-A', 'N-B']);
    expect(bullesDu(apres), 'la bulle du fil').toEqual([]);
  });

  it('FIRESTORE SIMULÉ — l\'écriture de la suppression retire la bulle des documents gardés, et un chargement neuf (autre magasin sur les mêmes documents) ne la revoit pas', () => {
    const fs = firestoreSimule(carnetSolAvecMemo());
    const m = fs.magasin();
    const r = supprimerNote(m.lire() as never, { carnetId: ID_SOL, noteId: 'N-MEMO' });
    if (!r.ok) throw new Error(r.raison);
    m.appliquer(r.ecritures, r.journal as never);
    const rechargeMagasin = fs.magasin();
    expect(bullesDu(rechargeMagasin.lire() as never), `écritures : ${fs.appels.join(', ')}`).toEqual([]);
    const reste = [...fs.docs.values()].filter(d => d.id === ID_MSG && (d as { carnetMessage?: { effets: Array<{ id: string }> } }).carnetMessage?.effets.some(e => e.id === 'N-MEMO'));
    expect(reste.map(d => d.id), 'le message rangé ne garde aucun effet vers la note supprimée').toEqual([]);
  });

  it('COMPOSANT — ··· › Supprimer : la bulle part de l\'écran', async () => {
    monter(carnetSolAvecMemo(), { ouvrir: ID_SOL });
    await attendre(100);
    expect(bulleDuMemo(), 'la bulle du mémo est là au départ').toBeTruthy();
    await supprimerLaNoteDuMemo();
    expect(bulleDuMemo(), 'la bulle ne reste pas à l\'écran').toBeFalsy();
    expect(lu(document.querySelector('.cn-ouvert')), 'le texte du mémo ne se lit plus nulle part').not.toContain('le sol époxy du local a bien tenu');
  }, 20000);

  it('COMPOSANT + MAGASIN — après Supprimer, la note n\'est plus dans le carnet ET la bulle n\'est plus dans le fil du magasin', async () => {
    const m = monter(carnetSolAvecMemo(), { ouvrir: ID_SOL });
    await attendre(100);
    await supprimerLaNoteDuMemo();
    const notes = lireCarnets(m.magasin.lire() as never).find(c => c.id === ID_SOL)!.carnet.notes.map(n => n.id);
    expect(notes).not.toContain('N-MEMO');
    expect(bullesDu(m.magasin.lire() as never), 'la bulle du magasin').toEqual([]);
  }, 20000);

  it('« Note supprimée » ne s\'affiche que si la note l\'est vraiment (note retirée du carnet ET bulle retirée)', async () => {
    const m = monter(carnetSolAvecMemo(), { ouvrir: ID_SOL });
    await attendre(100);
    await supprimerLaNoteDuMemo();
    const dit = /Note supprimée/.test(lu(document.body));
    expect(dit, '« Note supprimée · Annuler » se lit (le geste est annulable)').toBe(true);
    const notes = lireCarnets(m.magasin.lire() as never).find(c => c.id === ID_SOL)!.carnet.notes.map(n => n.id);
    expect(notes, 'la note est bien partie').not.toContain('N-MEMO');
    expect(bulleDuMemo(), 'et sa bulle aussi').toBeFalsy();
  }, 20000);

  it('RECHARGEMENT (Firestore simulé) — supprimée puis l\'écran démonté et remonté sur les documents gardés : la bulle ne revient pas', async () => {
    const fs = firestoreSimule(carnetSolAvecMemo());
    monter([], { ouvrir: ID_SOL, magasin: fs.magasin() });
    await attendre(100);
    expect(bulleDuMemo(), 'au départ').toBeTruthy();
    await supprimerLaNoteDuMemo();
    cleanup();
    monter([], { ouvrir: ID_SOL, magasin: fs.magasin() });
    await attendre(150);
    expect(lu(document.querySelector('.cn-ouvert')), 'le carnet rechargé est ouvert').toMatch(/matières premières et outils/);
    expect(bulleDuMemo(), `bulle après rechargement (écritures : ${fs.appels.join(', ')})`).toBeFalsy();
    expect(lu(document.querySelector('.cn-ouvert'))).not.toContain('le sol époxy du local a bien tenu');
  }, 30000);

  it('les AUTRES notes restent : Supprimer ne retire que la note touchée', async () => {
    monter(carnetSolAvecMemo(), { ouvrir: ID_SOL });
    await attendre(100);
    await supprimerLaNoteDuMemo();
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t).toContain('Époxy deux composants');
    expect(t).toContain('Plinthe à reprendre');
  }, 20000);

  it('ANNULER (composant) — la note et sa bulle reviennent', async () => {
    const m = monter(carnetSolAvecMemo(), { ouvrir: ID_SOL });
    await attendre(100);
    await supprimerLaNoteDuMemo();
    const annuler = boutonTexte(/^Annuler/);
    expect(annuler, 'le bouton Annuler de « Note supprimée »').toBeTruthy();
    fireEvent.click(annuler!);
    await attendre(150);
    expect(lireCarnets(m.magasin.lire() as never).find(c => c.id === ID_SOL)!.carnet.notes.map(n => n.id)).toContain('N-MEMO');
    expect(bulleDuMemo(), 'la bulle est revenue').toBeTruthy();
    expect(lu(document.body), 'plus de bandeau « Note supprimée »').not.toMatch(/Note supprimée/);
  }, 20000);

  it('ANNULER (écriture, Firestore simulé) — l\'inverse de la suppression rend la note, son message et la bulle', () => {
    const fs = firestoreSimule(carnetSolAvecMemo());
    const m = fs.magasin();
    const avant = JSON.stringify(m.lire());
    const r = supprimerNote(m.lire() as never, { carnetId: ID_SOL, noteId: 'N-MEMO' });
    if (!r.ok) throw new Error(r.raison);
    m.appliquer(r.ecritures);
    m.appliquer(r.inverse);
    expect(JSON.stringify(fs.magasin().lire()), 'les documents gardés reviennent à l\'identique').toBe(avant);
    expect(bullesDu(fs.magasin().lire() as never).length).toBe(1);
  });
});

/* =========================================================================================================== R79 : le problème (coût, jetons, options, ligne du résolu) */

const ID_V = 'ZZ-C69-VAPEUR';
const HOTTE = 'Hotte + extracteur au plafond';
/**
 * L'état relevé en ligne après c68-fix (cap/C6-options, D5-retenue, F0-resolu, E3) : un problème « Brasserie › Brassage › Vapeur », trois OPTIONS (la hotte à 200 CHF, le condenseur A à 690 CHF en stock,
 * le condenseur B à 540 CHF « plus en stock »), leurs articles liés, leurs phrases (« Piste : condenseur A, 690 CHF… ») et les jetons de montant qu'elles ont gardés.
 * `doublons` : chaque phrase porte AUSSI le jeton de montant que l'IA pose (origine « ia », sans option) à côté de celui de l'analyse locale (avec l'option) : le relevé en ligne.
 */
function vapeurC69(o: { doublons?: boolean } = {}): Item[] {
  const et = (carnetId: string, e: Record<string, unknown>) => ({ carnetId, origine: 'locale', ...e });
  const msg = (id: string, le: string, texte: string, etiquettes: Array<Record<string, unknown>>) => ({
    id, type: 'carnet-message', title: texte, status: 'done',
    carnetMessage: { texte, le, depuis: ID_V, rangement: 'ia', effets: [{ carnetId: ID_V, cible: 'note', id: `${id}-N` }], etiquettes: etiquettes.map(e => et(ID_V, e)) }
  });
  const dbl = (e: Record<string, unknown>): Array<Record<string, unknown>> => (o.doublons ? [e, { ...e, optionId: undefined, origine: 'ia' }] : [e]);
  return clone([
    { id: ID_V, type: 'carnet', title: 'ZZ TEST — c69 vapeur au brassage', status: 'idea',
      carnet: { version: 1, creeLe: nov(25, 2), phrase: 'ZZ TEST — c69 vapeur au brassage : trop de buée au plafond', criteres: [],
        facons: [
          { id: 'FH', nom: HOTTE, etat: 'ouverte', origine: 'ia', suivi: { etat: 'piste', historique: [{ etat: 'piste', le: nov(25, 3), origine: 'ia' }] } },
          { id: 'FA', nom: 'Condenseur A', etat: 'ouverte', origine: 'ia', suivi: { etat: 'piste', historique: [{ etat: 'piste', le: nov(25, 3), origine: 'ia' }] } },
          { id: 'FB', nom: 'Condenseur B', etat: 'ouverte', origine: 'ia', suivi: { etat: 'piste', historique: [{ etat: 'piste', le: nov(25, 3), origine: 'ia' }] } }],
        articles: [
          { id: 'AA', nom: 'Condenseur A', prixCentimes: 69000, devise: 'CHF', vendeur: 'Brouwland', dispo: 'en stock', lecture: 'lue', valeurs: {}, origine: 'vous', faconId: 'FA' },
          { id: 'AB', nom: 'Condenseur B', prixCentimes: 54000, devise: 'CHF', dispo: 'plus en stock', lecture: 'illisible', valeurs: {}, origine: 'vous', faconId: 'FB' }],
        notes: [{ id: 'M2-N', texte: 'Piste : condenseur A, 690 CHF chez Brouwland', genre: 'note', messageId: 'M2' }, { id: 'M3-N', texte: 'Hotte + extracteur au plafond, budget 200 CHF', genre: 'note', messageId: 'M3' },
          { id: 'M4-N', texte: 'Condenseur B, 540 CHF, plus en stock', genre: 'note', messageId: 'M4' }],
        photos: [], genre: { valeur: 'probleme', origine: 'ia' }, suivi: { etat: 'cherche', evenements: [] }, domaine: { valeur: 'brasserie', origine: 'ia' }, categorie: { chemin: ['Brassage', 'Vapeur'], origine: 'ia' } } },
    msg('M2', nov(25, 3), 'Piste : condenseur A, 690 CHF chez Brouwland', [{ sorte: 'piste', optionId: 'FA' }, ...dbl({ sorte: 'cout', montantCentimes: 69000, devise: 'CHF', optionId: 'FA' })]),
    msg('M3', nov(25, 4), 'Hotte + extracteur au plafond, budget 200 CHF', [{ sorte: 'piste', optionId: 'FH' }, ...dbl({ sorte: 'cout', montantCentimes: 20000, devise: 'CHF', optionId: 'FH' })]),
    msg('M4', nov(25, 5), 'Condenseur B, 540 CHF, plus en stock', [{ sorte: 'piste', optionId: 'FB' }, ...dbl({ sorte: 'cout', montantCentimes: 54000, devise: 'CHF', optionId: 'FB' })])
  ]) as unknown as Item[];
}
const appliquer = (items: Item[], r: { ok: boolean; ecritures?: unknown; raison?: string }): Item[] => { if (!r.ok) throw new Error(`refusé : ${r.raison}`); return appliquerEcritures(items as never, r.ecritures as never) as Item[]; };
const retenueHotte = (items: Item[]): Item[] => appliquer(items, retenirOption(items as never, { carnetId: ID_V, faconId: 'FH', le: nov(25, 9) }) as never);
const resolu = (items: Item[]): Item[] => appliquer(items, resoudre(items as never, { carnetId: ID_V, le: nov(25, 11), sorte: 'reparation' }) as never);
const tuile = (nom: RegExp) => [...document.querySelectorAll('.cnp-opt')].find(t => nom.test(t.getAttribute('aria-label') ?? ''));

describe('R79 · C69-3 (C68-2 en partie) : après « Retenir », le coût de la retenue reste en tête, et au Résolu', () => {
  it('la hotte retenue (200 CHF) : le coût en tête dit 200 CHF (ni la somme, ni le prix d\'une piste)', async () => {
    monter(retenueHotte(vapeurC69()), { ouvrir: ID_V });
    await attendre(120);
    const t = lu(document.querySelector('.cnp-total'));
    expect(t, `coût en tête : « ${t} » (le coût de la retenue doit y être)`).toMatch(/200\s?CHF/);
    expect(t).not.toMatch(/690|540|1\s?430/);
  }, 20000);
  it('Résolu avec la hotte retenue : le coût de la retenue (200 CHF) se lit', async () => {
    monter(resolu(retenueHotte(vapeurC69())), { ouvrir: ID_V });
    await attendre(120);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t, 'le Résolu est ouvert').toMatch(/Retenu : Hotte/);
    expect(t, `Résolu : « ${t.slice(0, 400)} »`).toMatch(/Hotte[^.]{0,60}200\s?CHF|200\s?CHF[^.]{0,60}Hotte/);
  }, 20000);
});

describe('R79 · C69-4 : un jeton par valeur sur les bulles du fil (jamais « 690 CHF 690 CHF »)', () => {
  const jetonsMontant = () => [...document.querySelectorAll('[data-message]')].map(b => ({ texte: lu(b.querySelector('p')), montants: [...b.querySelectorAll('.cnp-jeton')].map(j => lu(j)).filter(j => /\d\s?(CHF|EUR|€)/.test(j)) }));

  it('un message qui porte deux jetons de même montant (l\'analyse locale et l\'IA) n\'en montre qu\'un', async () => {
    monter(vapeurC69({ doublons: true }), { ouvrir: ID_V });
    await attendre(120);
    for (const b of jetonsMontant()) {
      expect(new Set(b.montants).size, `montants de « ${b.texte} » : ${JSON.stringify(b.montants)}`).toBe(b.montants.length);
      expect(b.montants.length, `un montant pour « ${b.texte} »`).toBe(1);
    }
  }, 20000);

  it('« Piste : condenseur A, 690 CHF chez Brouwland » tapé dans le problème (IA simulée) : « 690 CHF » une seule fois sur la bulle (garde-fou : déjà juste sur ce geste, le doublon ne naît que de la double étiquette ci-dessus)', async () => {
    const items = vapeurC69().filter(i => !['M2', 'M3', 'M4'].includes(i.id));
    const k = items[0].carnet as unknown as { notes: unknown[]; articles: unknown[]; facons: unknown[] };
    k.notes = []; k.articles = []; k.facons = [];
    monter(items, { ouvrir: ID_V, mode: 'simule' });
    await attendre(100);
    const champ = document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ, { target: { value: 'Piste : condenseur A, 690 CHF chez Brouwland' } });
    await attendre(30);
    fireEvent.keyDown(champ, { key: 'Enter' });
    await attendre(500);
    const bulle = jetonsMontant().find(b => /condenseur A/i.test(b.texte));
    expect(bulle, 'la bulle de la phrase est dans le fil').toBeTruthy();
    expect(bulle!.montants, `jetons de montant : ${JSON.stringify(bulle!.montants)}`).toEqual(['690 CHF']);
  }, 30000);
});

describe('R79 · C69-5 (C68-7 en partie) : l\'option porte son picto propre, son prix et sa disponibilité', () => {
  beforeAll(async () => { /* rien : chaque test monte son écran */ });
  const ouvrirOptions = async () => { monter(vapeurC69(), { ouvrir: ID_V }); await attendre(120); };

  it('un condenseur n\'a jamais le picto de la HOTTE (le picto vient du nom de l\'option, pas du titre « vapeur » du problème)', async () => {
    await ouvrirOptions();
    for (const nom of [/^Condenseur A/, /^Condenseur B/]) {
      const t = tuile(nom);
      expect(t, `la tuile ${nom}`).toBeTruthy();
      expect(t!.querySelector('[data-picto]')?.getAttribute('data-picto'), `picto de ${nom}`).not.toBe('hotte');
    }
    expect(tuile(/^Hotte/)!.querySelector('[data-picto]')?.getAttribute('data-picto'), 'la hotte garde le sien').toBe('hotte');
  }, 20000);
  it('chaque tuile dit son prix : 690 CHF, 540 CHF, 200 CHF', async () => {
    await ouvrirOptions();
    expect(lu(tuile(/^Condenseur A/)), 'condenseur A').toMatch(/690/);
    expect(lu(tuile(/^Condenseur B/)), 'condenseur B').toMatch(/540/);
    expect(lu(tuile(/^Hotte/)), 'hotte').toMatch(/200/);
  }, 20000);
  it('« plus en stock » du condenseur B se lit sur sa tuile (la disponibilité de son article)', async () => {
    await ouvrirOptions();
    expect(lu(tuile(/^Condenseur B/))).toMatch(/plus en stock/i);
    expect(lu(tuile(/^Condenseur A/)), 'A est en stock : pas « plus en stock »').not.toMatch(/plus en stock/i);
  }, 20000);
  it('au Résolu (hotte retenue) : les condenseurs « pas pris » n\'ont pas le picto de la hotte, et gardent leur prix', async () => {
    monter(resolu(retenueHotte(vapeurC69())), { ouvrir: ID_V });
    await attendre(120);
    const zone = document.querySelector('.cn-ouvert')!;
    const lignes = [...zone.querySelectorAll('li, div, section')].filter(e => /^Condenseur [AB]\s*pas pris/.test(lu(e)) || /^Condenseur [AB] pas pris/.test(lu(e)));
    expect(lignes.length, 'les lignes « Condenseur … pas pris » du Résolu').toBeGreaterThanOrEqual(2);
    for (const l of lignes) expect(l.querySelector('[data-picto="hotte"]'), `picto hotte sur « ${lu(l)} »`).toBeFalsy();
    const t = lu(zone);
    expect(t, 'le prix du condenseur A se lit encore').toMatch(/Condenseur A[^.]{0,40}690/);
  }, 20000);
});

describe('R79 · C69-6 (C68-4 en partie) : la ligne d\'un résolu dans la liste dit « retenu : <nom> · <coût> »', () => {
  it('filtre « résolus » : la ligne du problème résolu nomme la retenue (Hotte…) et son coût (200 CHF)', async () => {
    monter(resolu(retenueHotte(vapeurC69())));
    await attendre(120);
    fireEvent.click(document.querySelector('.cnl-case[data-etat="resolu"]')!);
    await attendre(60);
    const ligne = [...document.querySelectorAll('.cnl-pb')].find(l => /vapeur au brassage/.test(lu(l)));
    expect(ligne, 'la ligne du résolu').toBeTruthy();
    const t = lu(ligne);
    expect(t, `ligne : « ${t} »`).toMatch(/retenu\s*:?\s*Hotte/);
    expect(t, `ligne : « ${t} »`).toMatch(/200\s?CHF/);
  }, 20000);
});

/* =========================================================================================================== R80 : le reste */

describe('R80 · C69-7 (C68-13 en partie) : Réalisés compte les mêmes résolus que « résolus 2026 » (les anciens, archivés, aussi)', () => {
  /** Les 5 anciens résolus du relevé (F6) : des projets du Planning ARCHIVÉS (`carnet.archive`, état « résolu » déduit), plus un problème résolu aujourd'hui. */
  const avecAnciens = (): Item[] => {
    const ancien = (i: number): Item => ({ id: `ZZ-C69-ANC-${i}`, type: 'carnet', title: `ZZ TEST — c69 ancien projet ${i}`, status: 'idea',
      carnet: { version: 1, creeLe: '2026-02-01T08:00:00.000Z', phrase: `ancien ${i}`, criteres: [], facons: [], articles: [], notes: [], photos: [], archive: { le: `2026-0${3 + (i % 5)}-10T10:00:00.000Z`, raison: 'fait' } } }) as unknown as Item;
    return clone([...vapeurC69().slice(0, 1), ...[1, 2, 3, 4, 5].map(ancien)]) as Item[];
  };
  it('le coup d\'œil dit 6 résolus 2026 ; Réalisés (les problèmes résolus) en compte le MÊME nombre', () => {
    const items = resolu(avecAnciens());
    const coup = coupDOeil(lireCarnets(items as never, { archives: true }), 2026).resolus;
    expect(coup, 'résolus 2026 au coup d\'œil').toBe(6);
    expect(resolusRealises(items as never).length, 'Réalisés').toBe(coup);
  });
  it('les anciens résolus sont listés dans Réalisés (par leur titre)', () => {
    const t = resolusRealises(resolu(avecAnciens()) as never).map(r => r.titre).join(' | ');
    expect(t).toMatch(/ancien projet 1/);
    expect(t).toMatch(/ancien projet 5/);
  });
});

describe('R80 · C69-8 (C68-9 rouvert) : À faire — le coût d\'un projet du Planning vient de son critère « Budget … »', () => {
  /** Le relevé (G1, A4) : « Frigo + congel · au Planning », « Budget 400 CHF » écrit en CRITÈRE (Ce qui compte), la note du Planning dessous. */
  const projet = (): Item[] => clone([{ id: 'ZZ-C69-FRIGO', type: 'carnet', title: 'ZZ TEST — c69 Frigo + congel', status: 'idea',
    carnet: { version: 1, creeLe: '2026-11-01T12:00:00.000Z', phrase: 'frigo', criteres: [{ id: 'K-B', texte: 'Budget 400 CHF', origine: 'vous' }], facons: [], articles: [], photos: [],
      notes: [{ id: 'N-PL', texte: 'À faire du 01.12.2026 au 15.01.2027 (Planning, Structure)', genre: 'a-faire' }] } }]) as unknown as Item[];
  it('la ligne « Frigo + congel » porte son coût (400 CHF) à droite', async () => {
    monter(projet());
    await attendre(100);
    fireEvent.click(boutonTexte(/^À faire/)!);
    await attendre(80);
    const ligne = [...document.querySelectorAll('li.af-ligne')].find(l => /Frigo \+ congel/.test(lu(l)));
    expect(ligne, 'la ligne du projet').toBeTruthy();
    expect(lu(ligne), `ligne : « ${lu(ligne)} »`).toMatch(/400\s?CHF/);
  }, 20000);
});

describe('R80 · C69-9 : une tâche datée tapée dans le problème devient une tâche de « À faire »', () => {
  it('« appeler l\'électricien pour poser la hotte avant le 12 décembre » : une tâche écrite, datée de décembre, dans le carnet', async () => {
    const items = vapeurC69().filter(i => !['M2', 'M3', 'M4'].includes(i.id));
    const m = monter(items, { ouvrir: ID_V, mode: 'eteint' });
    await attendre(100);
    const champ = document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ, { target: { value: 'appeler l’électricien pour poser la hotte avant le 12 décembre' } });
    await attendre(30);
    fireEvent.keyDown(champ, { key: 'Enter' });
    await attendre(500);
    const taches = lireCarnets(m.magasin.lire() as never).find(c => c.id === ID_V)!.carnet.taches ?? [];
    const t = taches.find(x => /électricien/i.test(x.texte));
    expect(t, `tâches écrites : ${JSON.stringify(taches)} ; la phrase est rangée en « Note » seulement`).toBeTruthy();
    expect(t?.echeance ?? '', 'une échéance en décembre 2026 (« avant le 12 décembre »)').toMatch(/^2026-12/);
  }, 30000);
});

describe('R80 · C69-10 (C68-11 en partie) : l\'arbre — les carnets sans catégorie (Houblons citra, Chambre froide, Frigo + congel) sont repliés, pas à plat sous « Brasserie »', () => {
  const carnetPlat = (id: string, titre: string, extra: Record<string, unknown> = {}): Item => ({ id, type: 'carnet', title: titre, status: 'idea',
    carnet: { version: 1, creeLe: '2026-11-05T08:00:00.000Z', phrase: titre, criteres: [], facons: [], articles: [], notes: [], photos: [], domaine: { valeur: 'brasserie', origine: 'ia' }, ...extra } }) as unknown as Item;
  const art = (id: string, nom: string, prix: number) => ({ id, nom, prixCentimes: prix, devise: 'CHF', lecture: 'lue', valeurs: {}, origine: 'vous' });
  it('au repos, aucune ligne de ces carnets n\'est dépliée à plat dans le domaine', async () => {
    const items = clone([vapeurC69()[0], carnetPlat('ZZ-C69-HC', 'Houblons citra', { articles: [art('H1', 'Citra', 4000), art('H2', 'Citra 2', 8000)] }),
      carnetPlat('ZZ-C69-CF', 'Chambre froide', { articles: [art('C1', 'Froid 6 m³', 480000), art('C2', 'Froid 8 m³', 590000)] }),
      carnetPlat('ZZ-C69-FC', 'Frigo + congel', { criteres: [{ id: 'KB', texte: 'Budget 400 CHF', origine: 'vous' }], sortie: { planId: 'PLAN-FC', le: '2026-11-10T10:00:00.000Z' } }),
      carnetPlat('ZZ-C69-EM', 'Embouteillage — station complète (2027)', { criteres: [{ id: 'KE', texte: 'Budget 2 500 CHF', origine: 'vous' }] })]) as Item[];
    monter(items);
    await attendre(120);
    const plates = [...document.querySelectorAll('.cnl-pb')].filter(l => !l.closest('[hidden]')).map(l => lu(l)).filter(t => /Houblons citra|Chambre froide|Frigo \+ congel|Embouteillage/.test(t));
    expect(plates, `lignes dépliées à plat : ${JSON.stringify(plates)}`).toEqual([]);
  }, 20000);
});

describe('R80 · C69-11 (C67B-7 en partie) : Comparer côte à côte — le meilleur coché sur chaque ligne, pas de ligne « vendeur »', () => {
  /** Le relevé K3 : MotlerHops lu sans nom de vendeur (colonne « motlerhops.fr »), son Alpha en PLAGE « 10 % - 15 % » ; Brau 13,6 %. */
  const deuxVendeurs = () => {
    const c = pelletsTrois();
    const articles = c.carnet.articles.filter(a => a.id !== 'HM').map(a => (a.id === 'M1' ? { ...a, vendeur: undefined, domaine: 'motlerhops.fr', valeurs: { ...a.valeurs, Alpha: { valeur: '10 % - 15 %', origine: 'page' } } } : a));
    return { ...c, carnet: { ...c.carnet, articles } } as unknown as CarnetDoc;
  };
  const monterComparer = () => {
    poserQuantitePour(TITRE_PELLETS, 1);
    const c = deuxVendeurs();
    const nop = () => undefined;
    return render(<Comparer titre={c.title} statut="research" tableau={tableau(c) as never} articles={c.carnet.articles as never} onRetour={nop} onChoisir={nop} />).container;
  };
  const lignes = (r: Element) => [...r.querySelectorAll('tbody tr')].filter(tr => !(tr as HTMLElement).hidden);
  const libelle = (tr: Element) => lu(tr.querySelector('th') ?? tr).toLowerCase();
  it('MotlerHops (10 % - 15 %) et Brau (13,6 %) : la ligne Alpha porte un ✓', () => {
    const r = monterComparer();
    const tr = lignes(r).find(x => /alpha/.test(libelle(x)));
    expect(tr, 'la ligne Alpha').toBeTruthy();
    expect(tr!.querySelector('td.cn-meilleur'), `✓ sur Alpha : ${[...tr!.querySelectorAll('td')].map(lu).join(' | ')}`).toBeTruthy();
  });
  it('aucune ligne « Aucune valeur lue pour : vendeur » (le vendeur est dans l\'en-tête de colonne)', () => {
    const r = monterComparer();
    expect(lu(r), 'texte du comparateur').not.toMatch(/Aucune valeur lue pour\s*:[^.]*vendeur/i);
  });
});

/** Le geste Choisir MotlerHops, 1 kg (c67b) : la carte du plan écrit pour À venir. */
function monterPellets() {
  const autres = fixtureCarnets().filter(i => i.id !== ID_PELLETS);
  /* le relevé K8 : MotlerHops lu sans nom de vendeur, son adresse dit « motlerhops.fr » */
  const pel = pelletsC67b();
  const doc = { ...pel, carnet: { ...pel.carnet, articles: pel.carnet.articles.map(a => (a.id === 'M1' ? { ...a, vendeur: undefined, domaine: 'motlerhops.fr' } : a)) } };
  const magasin = magasinMemoire([doc as never, ...autres]);
  const ecrits: FinancialPlan[] = [];
  const r = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={{ async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } }}
    aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ouvrir={{ id: ID_PELLETS, at: 1 }} ecrirePlan={(pl: FinancialPlan) => { ecrits.push(pl); }} />);
  return { magasin, ecrits, ...r };
}
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const boutonSans = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
async function ouvrirFicheMotlerHops() {
  poserQuantitePour(TITRE_PELLETS, 1);
  const m = monterPellets();
  await attendre(60);
  fireEvent.click([...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''))!);
  await attendre(30);
  const feuille = document.querySelector('[role="dialog"][aria-modal="true"]')!;
  const carte = [...feuille.querySelectorAll('button')].find(b => /motlerhops/.test(sans(b.textContent ?? '')) && !/retirer|deplacer/.test(sans(b.getAttribute('aria-label') ?? '')));
  expect(carte, 'la carte MotlerHops de la feuille Articles').toBeTruthy();
  fireEvent.click(carte!);
  await attendre(30);
  const choisirFiche = boutonSans(/^choisir/, document.querySelector('.cn-fiche') ?? document);
  expect(choisirFiche, `boutons Choisir de la fiche : ${[...document.querySelectorAll('button')].map(x => sans(`${x.getAttribute('aria-label') ?? ''} ${x.textContent ?? ''}`)).filter(t => /choisir/.test(t)).join(' ; ')}`).toBeTruthy();
  fireEvent.click(choisirFiche!);
  await attendre(30);
  return m;
}

describe('R80 · C69-12 (C67B-2 en partie) : un achat venu d\'un Choisir dit « article · vendeur · quantité » dans À venir', () => {
  it('le plan écrit (À venir) porte le nom de l\'article ET le vendeur : « CITRA® (US) · MotlerHops · 1 kg »', async () => {
    const m = await ouvrirFicheMotlerHops();
    const confirmer = boutonSans(/^choisir/, document.querySelector('.cn-choisir')!);
    expect(confirmer, `boutons de la confirmation : ${[...document.querySelectorAll('.cn-choisir button')].map(x => lu(x)).join(' ; ')}`).toBeTruthy();
    fireEvent.click(confirmer!);
    await attendre(80);
    const plan = m.ecrits.at(-1)!;
    expect(plan, 'un plan écrit').toBeTruthy();
    expect(sans(plan.title), `titre du plan : « ${plan.title} »`).toMatch(/citra/);
    expect(sans(plan.title), `titre du plan : « ${plan.title} » (le vendeur)`).toMatch(/motlerhops/);
    expect(sans(plan.title), `titre du plan : « ${plan.title} » (la quantité)`).toMatch(/1 kg/);
  }, 30000);
});

describe('R80 · C69-13 (C67B-3 en partie) : « Ses autres valeurs » — les valeurs sous leur libellé, lisibles ; pas de colonne vide', () => {
  const poserFeuilles = () => {
    const st = document.createElement('style');
    st.setAttribute('data-c69', '');
    st.textContent = ['carnets.css', 'carnets-decider.css', 'fiche-article.css'].map(f => readFileSync(`src/ui/carnets/${f}`, 'utf8')).join('\n');
    document.head.appendChild(st);
  };
  afterEach(() => document.head.querySelectorAll('style[data-c69]').forEach(s => s.remove()));
  async function confirmation() {
    poserFeuilles();
    await ouvrirFicheMotlerHops();
    return document.querySelector('.cn-choisir')!;
  }
  it('une valeur longue (Arômes) n\'est pas une cellule voisine du libellé, dans une colonne étroite : elle est sous son libellé (autre ligne, ou cellule en bloc)', async () => {
    const ecran = await confirmation();
    const th = [...ecran.querySelectorAll('.cn-place th[scope="row"]')].find(x => /arômes/i.test(lu(x)));
    expect(th, 'la ligne « Arômes » de Ses autres valeurs').toBeTruthy();
    const tr = th!.parentElement!;
    const valeur = [...tr.querySelectorAll('td')].find(td => /agrumes/.test(lu(td)))
      ?? [...(tr.nextElementSibling?.querySelectorAll('td') ?? [])].find(td => /agrumes/.test(lu(td)));
    expect(valeur, 'la valeur des arômes').toBeTruthy();
    const cote = valeur!.parentElement === tr && getComputedStyle(valeur!).display === 'table-cell' && getComputedStyle(th!).display === 'table-cell';
    expect(cote, 'libellé et valeur longue sur la même ligne de tableau (la valeur écrasée en colonne étroite, un mot par ligne)').toBe(false);
  });
  it('la colonne « place parmi les n » n\'est pas écrite quand aucune de ses cellules ne dit rien', async () => {
    const ecran = await confirmation();
    const table = ecran.querySelector('.cn-place')!;
    const lignes = [...table.querySelectorAll('tbody tr')].filter(tr => tr.querySelector('th[scope="row"]'));
    const dernieres = lignes.map(tr => lu([...tr.querySelectorAll('td')].at(-1)));
    const tete = lu(table.querySelector('thead, caption'));
    if (dernieres.every(d => d === '' || /^[—–-]$/.test(d)) && lignes.length > 0) expect(tete, `en-tête : « ${tete} » alors que la colonne est vide`).not.toMatch(/place parmi/i);
    const vides = lignes.filter(tr => { const tds = [...tr.querySelectorAll('td')]; return tds.length >= 2 && lu(tds.at(-1)) === '' && !tr.classList.contains('cn-place-reglette'); });
    expect(vides.map(tr => lu(tr.querySelector('th'))), 'lignes dont la colonne « place » est vide (une cellule creuse à droite)').toEqual([]);
  });
});
