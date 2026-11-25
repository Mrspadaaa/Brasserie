// @vitest-environment jsdom
/**
 * Voie c72-tests (25.11) : les tests ROUGES des règles R87 et R88 tirées du test en ligne du tour 72 (voies/critique-72/RESULTAT.md ; BUGS.md C72-1 à C72-6).
 * Écrits depuis les RÈGLES (voies/c72-tests/DOSSIER.md) et les maquettes choisies (maquettes2/v01 : vapeur, saisie ; règle n° 1) avant tout correctif :
 * celui qui corrige n'écrit pas le test (L17). Aucun réseau, aucun Gemini (AiClient lève s'il est appelé).
 *
 *  - R87 (C72-1, B, 3e retour : C67-4, C68-2) : le coût en tête d'un problème = la retenue s'il y en a une ; sinon la fourchette MIN-MAX des pistes ouvertes
 *    (180 et 450 -> « 180 à 450 CHF », jamais « 180 à 630 ») ; une option écartée sort du calcul AUSSITÔT (ventilateur écarté -> « 450 CHF ») ; une seule piste -> son prix seul.
 *    Testé par la FONCTION (`resumeJetons`, avec 1, 2, 3 pistes, une écartée, une retenue, une sans prix, trois FORMES de jetons dont une reconstituée du relevé) ET par le COMPOSANT
 *    (l'écran du problème : Je cherche, Décidé, Résolu) ; puis chaque SURFACE qui dit ce coût : l'en-tête (`.cnp-total`), la ligne de la liste, les jetons de la bulle, les tuiles
 *    d'option, la rubrique Quand, le Résolu ; et le GESTE (une phrase à deux pistes tapée dans le problème, repli local puis réponse de l'IA simulée).
 *  - R88 (m) : C72-2 (la veille d'une option écartée), C72-3 (À faire : l'ordre sous « Un jour »), C72-4 (la carte de l'article choisi : une seule quantité),
 *    C72-5 (« Comparer sur l'acides alpha »), C72-6 (« votre phrase » redit la première bulle) : chacun par le composant (jsdom ne mesure aucune boîte).
 *
 * Réponses de l'IA : SIMULÉES. La forme de la phrase à deux pistes est celle du relevé en ligne (cap/B1-pistes.txt : deux pistes, « 450 CHF » et « 180 CHF » sous la même bulle) ;
 * la RECONSTITUTION des jetons qui donnent « 180 à 630 » puis « 450 à 630 » est DÉDUITE (aucun jeton brut n'a été relevé) : voir `melange` ci-dessous, marquée telle.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { changerOption, resoudre, retenirOption } from '../../src/domain/carnets/suivi';
import { avecArticle, avecArticleTypo } from '../../src/domain/carnets/comparer';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { AFaire } from '../../src/ui/carnets/AFaire';
import { resumeJetons, type ResumeJetons } from '../../src/ui/carnets/filRegles';
import { valeurUtile } from '../../src/ui/carnets/listeRegles';
import { libelleProposee } from '../../src/ui/carnets/lignesRegles';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ID_PELLETS, TITRE_PELLETS, pelletsTrois } from '../fixtures/c67b/pellets';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof appliquerEcritures>[0][number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const LE = '2026-11-25T09:00:00.000Z';
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const nov = (jour: number, h = 12) => `2026-11-${String(jour).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00.000Z`;
const appelsHorsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };
const reponseIA = (lignes: Array<Record<string, unknown>>): AppelsIA => ({ async ranger() { return { ok: true, data: { lignes } }; }, async lire() { throw new Error('aucun lien dans ces phrases'); } });

interface Montage { appels?: AppelsIA; ouvrir?: string; plans?: FinancialPlan[] }
function monter(items: Item[], o: Montage = {}) {
  const magasin = magasinMemoire(items as never[]);
  const r = render(<CarnetsVue magasin={magasin} finances={{ plans: o.plans ?? [], transactions: [], payments: [] }} mode={'simule' as never}
    appels={o.appels ?? appelsHorsLigne} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never}
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
const appliquer = (items: Item[], r: { ok: boolean; ecritures?: unknown; raison?: string }): Item[] => {
  if (!r.ok) throw new Error(`opération refusée : ${r.raison}`);
  return appliquerEcritures(items as never, r.ecritures as never) as Item[];
};

/* =========================================================================================================== R87 : le problème « vapeur » à deux pistes */

const ID = 'ZZ-C72-VAPEUR';
const TITRE = 'ZZ TEST — c72 vapeur au brassage';
const PHRASE = 'ZZ TEST — c72 vapeur au brassage : la buée coule du plafond pendant l’ébullition, je cherche une solution';
const DEUX = 'ZZ TEST c72 : deux pistes, un condenseur de buées à eau froide à 450 CHF, ou un ventilateur extracteur mural à 180 CHF';
const NOMS = { FC: 'Condenseur de buées à eau froide', FV: 'Ventilateur extracteur mural', FT: 'Hotte à recyclage', FU: 'Humidificateur' } as const;
type Piste = keyof typeof NOMS;

/**
 * Les trois FORMES de jetons que la phrase à deux pistes peut laisser sous sa bulle :
 *  - `propre` : chaque coût vise sa piste (la forme que lit `resumeJetons`) ;
 *  - `sansOption` : le repli local avec DEUX options ne vise aucune option (`optionsLocales.size === 1 ? … : undefined`, rangementCarnets.ts) : les deux montants flottent ;
 *  - `melange` : DÉDUITE, jamais relevée en brut : « 180 à 630 », puis, le ventilateur écarté, « 450 à 630 » (B1-pistes, C4-ecartee), alors que les tuiles disent 450 et 180 et que la retenue dit 450 (C5-retenu),
 *    ne s'obtiennent que si les deux montants du repli local (450 + 180 = 630) visent une option que le carnet ne porte plus (`ZZ-FANTOME`), à côté des deux jetons de l'IA (FC 450, FV 180) :
 *    la 3e « option » compte pour une piste à 630. Reproduit chaque chiffre du relevé (630 ; 180 à 630 ; 450 à 630 ; retenu 450 ; tuiles 450 et 180). Le GESTE (describe « le GESTE ») le confirme
 *    sur le vrai code : le repli local pose les deux montants sur UNE seule option (`FACON-…`, une piste nommée comme la phrase), et, quand l'IA range la phrase, cette option n'existe plus dans le carnet.
 */
type Forme = 'propre' | 'sansOption' | 'melange';
const et = (e: Record<string, unknown>) => ({ carnetId: ID, origine: 'ia', ...e });
const jetonsDeux = (forme: Forme): Array<Record<string, unknown>> => {
  const pistes = [{ sorte: 'piste', optionId: 'FC' }, { sorte: 'piste', optionId: 'FV' }];
  if (forme === 'propre') return [...pistes, { sorte: 'cout', montantCentimes: 45000, devise: 'CHF', optionId: 'FC' }, { sorte: 'cout', montantCentimes: 18000, devise: 'CHF', optionId: 'FV' }];
  if (forme === 'sansOption') return [...pistes, { sorte: 'cout', montantCentimes: 45000, devise: 'CHF', origine: 'locale' }, { sorte: 'cout', montantCentimes: 18000, devise: 'CHF', origine: 'locale' }];
  /* les montants du repli local visent l'option que ce repli avait créée (`ZZ-FANTOME`, un id qu'aucune option du carnet ne porte plus quand l'IA a rangé les deux pistes) ; ceux de l'IA visent FC et FV */
  return [...pistes,
    { sorte: 'cout', montantCentimes: 45000, devise: 'CHF', optionId: 'ZZ-FANTOME', origine: 'locale' }, { sorte: 'cout', montantCentimes: 18000, devise: 'CHF', optionId: 'ZZ-FANTOME', origine: 'locale' },
    { sorte: 'cout', montantCentimes: 45000, devise: 'CHF', optionId: 'FC' }, { sorte: 'cout', montantCentimes: 18000, devise: 'CHF', optionId: 'FV' }];
};

interface Cas { forme?: Forme; pistes?: Piste[]; hotte?: boolean; humidificateur?: boolean; seule?: boolean; phrase?: string; genre?: string; domaine?: boolean }
/** Le problème « vapeur » du test en ligne : une phrase, puis la phrase à deux pistes (condenseur 450, ventilateur 180) ; `hotte` : une 3e piste à 120 CHF ; `humidificateur` : une piste SANS prix ; `seule` : le condenseur seul. */
function vapeur(o: Cas = {}): Item[] {
  const forme = o.forme ?? 'propre';
  const ids: Piste[] = o.seule ? ['FC'] : ['FC', 'FV', ...(o.hotte ? ['FT' as const] : []), ...(o.humidificateur ? ['FU' as const] : [])];
  const piste = (id: Piste) => ({ id, nom: NOMS[id], etat: 'ouverte', origine: 'ia', suivi: { etat: 'piste', historique: [{ etat: 'piste', le: nov(25, 3), origine: 'ia' }] } });
  const msg = (id: string, le: string, texte: string, etiquettes: Array<Record<string, unknown>>, effet = 'note') => ({
    id, type: 'carnet-message', title: texte, status: 'done',
    carnetMessage: { texte, le, depuis: ID, rangement: 'ia', effets: [{ carnetId: ID, cible: effet, id: `${id}-N` }], etiquettes: etiquettes.map(e => et(e)) }
  });
  const texteDeux = o.seule ? 'ZZ TEST c72 : un condenseur de buées à eau froide à 450 CHF' : DEUX;
  const jetons = o.seule ? [{ sorte: 'piste', optionId: 'FC' }, { sorte: 'cout', montantCentimes: 45000, devise: 'CHF', optionId: 'FC' }] : jetonsDeux(forme);
  const messages = [
    msg('ZZ-C72-M1', nov(25, 2), o.phrase ?? PHRASE, [{ sorte: 'constat' }]),
    msg('ZZ-C72-M2', nov(25, 3), texteDeux, jetons),
    ...(o.hotte ? [msg('ZZ-C72-M3', nov(25, 4), 'Hotte à recyclage, 120 CHF', [{ sorte: 'piste', optionId: 'FT' }, { sorte: 'cout', montantCentimes: 12000, devise: 'CHF', optionId: 'FT' }])] : []),
    ...(o.humidificateur ? [msg('ZZ-C72-M4', nov(25, 5), 'Humidificateur : à voir, pas de prix', [{ sorte: 'piste', optionId: 'FU' }])] : [])
  ];
  const carnet = { id: ID, type: 'carnet', title: TITRE, status: 'idea', carnet: {
    version: 1, creeLe: nov(25, 2), phrase: o.phrase ?? PHRASE, criteres: [], facons: ids.map(piste), articles: [],
    notes: messages.map(m => ({ id: `${m.id}-N`, texte: m.carnetMessage.texte, genre: 'note', messageId: m.id })), photos: [],
    genre: { valeur: o.genre ?? 'probleme', origine: 'ia' }, suivi: { etat: 'cherche', evenements: [] },
    ...(o.domaine ? { domaine: { valeur: 'brasserie', origine: 'ia' }, categorie: { chemin: ['Brassage', 'Vapeur'], origine: 'ia' } } : {})
  } };
  return clone([carnet, ...messages]) as unknown as Item[];
}
const ecarter = (items: Item[], faconId: Piste, raison?: string) => appliquer(items, changerOption(items as never, { carnetId: ID, faconId, vers: 'ecartee', ...(raison ? { raison } : {}), le: LE }) as never);
const retenir = (items: Item[], faconId: Piste) => appliquer(items, retenirOption(items as never, { carnetId: ID, faconId, le: LE }) as never);
const resumeDe = (items: Item[], retenueId?: string, ecartees: string[] = []): ResumeJetons | null => resumeJetons(lireMessages(items as never), ID, retenueId, new Set(ecartees));

/** Ce que l'en-tête DIT, dans l'ordre de l'écran (`RangeeJetons`) : la retenue, sinon la fourchette, sinon un total ; rien si rien n'est chiffré. En centimes. */
function enTete(r: ResumeJetons | null): { min: number; max: number; par: string } | null {
  if (!r) return null;
  if (r.retenu) return { min: r.retenu.centimes, max: r.retenu.centimes, par: 'retenu' };
  if (r.fourchette) return { min: r.fourchette.min, max: r.fourchette.max, par: 'fourchette' };
  if (r.total) return { min: r.total.centimes, max: r.total.centimes, par: 'total (somme)' };
  return null;
}
const dit = (r: ResumeJetons | null) => JSON.stringify({ retenu: r?.retenu ?? null, fourchette: r?.fourchette ?? null, total: r?.total ?? null, enTete: enTete(r) });
const total = () => lu(document.querySelector('.cnp-total'));

describe.each<[Forme, string]>([
  ['propre', 'chaque coût vise sa piste'],
  ['sansOption', 'le repli local : les deux montants ne visent aucune option'],
  ['melange', 'jetons du repli local (option fantôme, 450 + 180 = 630) et de l\'IA ensemble ; reproduit par le geste, voir plus bas']
])('R87 · C72-1 (B) : la FONCTION du coût en tête, forme « %s » (%s)', (forme) => {
  it('deux pistes (450 et 180) : la fourchette 180 à 450, jamais 630 (la somme de deux solutions exclusives)', () => {
    const r = resumeDe(vapeur({ forme }));
    expect(enTete(r), `jetons lus : ${dit(r)}`).toEqual({ min: 18000, max: 45000, par: 'fourchette' });
  });
  it('le ventilateur écarté : il sort du calcul AUSSITÔT, il reste « 450 CHF » (une seule piste : son prix seul), jamais « 450 à 630 »', () => {
    const r = resumeDe(ecarter(vapeur({ forme }), 'FV', 'trop bruyant'), undefined, ['FV']);
    expect(enTete(r), `jetons lus : ${dit(r)}`).toEqual({ min: 45000, max: 45000, par: expect.any(String) });
  });
  it('le condenseur écarté : il reste « 180 CHF »', () => {
    const r = resumeDe(ecarter(vapeur({ forme }), 'FC', 'trop cher'), undefined, ['FC']);
    expect(enTete(r), `jetons lus : ${dit(r)}`).toEqual({ min: 18000, max: 18000, par: expect.any(String) });
  });
  it('le condenseur retenu : le coût en tête est la retenue, 450, jamais la somme ni le prix de l\'autre piste', () => {
    const r = resumeDe(retenir(vapeur({ forme }), 'FC'), 'FC');
    expect(enTete(r), `jetons lus : ${dit(r)}`).toEqual({ min: 45000, max: 45000, par: 'retenu' });
  });
  it('le ventilateur retenu : 180', () => {
    const r = resumeDe(retenir(vapeur({ forme }), 'FV'), 'FV');
    expect(enTete(r), `jetons lus : ${dit(r)}`).toEqual({ min: 18000, max: 18000, par: 'retenu' });
  });
  it('trois pistes (450, 180, 120) : 120 à 450 ; la 3e écartée, de nouveau 180 à 450', () => {
    const items = vapeur({ forme, hotte: true });
    const r3 = resumeDe(items);
    expect(enTete(r3), `trois pistes : ${dit(r3)}`).toEqual({ min: 12000, max: 45000, par: 'fourchette' });
    const r2 = resumeDe(ecarter(items, 'FT'), undefined, ['FT']);
    expect(enTete(r2), `la hotte écartée : ${dit(r2)}`).toEqual({ min: 18000, max: 45000, par: 'fourchette' });
  });
  it('une piste SANS prix (l\'humidificateur) ne compte pas : l\'inconnu n\'est jamais 0, la fourchette reste 180 à 450', () => {
    const r = resumeDe(vapeur({ forme, humidificateur: true }));
    expect(enTete(r), `jetons lus : ${dit(r)}`).toEqual({ min: 18000, max: 45000, par: 'fourchette' });
  });
});

describe('R87 · C72-1 (B) : la FONCTION, une seule piste chiffrée', () => {
  it('une seule piste (le condenseur, 450 CHF) : son prix seul, 450 ; ni rien, ni 0', () => {
    const r = resumeDe(vapeur({ seule: true }));
    expect(enTete(r), `une seule piste : ${dit(r)}`).toEqual({ min: 45000, max: 45000, par: expect.any(String) });
  });
});

describe('R87 · C72-1 (B) : le COMPOSANT, l\'écran du problème (en-tête `.cnp-total`)', () => {
  it('Je cherche, deux pistes dites dans une seule phrase : « 180 à 450 CHF » (B1-pistes dit « 180 à 630 CHF »)', async () => {
    monter(vapeur({ forme: 'melange' }), { ouvrir: ID });
    await attendre(120);
    expect(lu(document.querySelector('.cn-ouvert')), 'le problème est ouvert').toMatch(/Condenseur de buées/);
    expect(total()).toMatch(/^180\D{1,6}450\s?CHF$/);
    expect(lu(document.querySelector('.cn-ouvert')), 'jamais la somme').not.toMatch(/630/);
  }, 20000);
  it('forme « sans option » (le repli local) : « 180 à 450 CHF », pas « ≈ 630 CHF »', async () => {
    monter(vapeur({ forme: 'sansOption' }), { ouvrir: ID });
    await attendre(120);
    expect(total()).toMatch(/^180\D{1,6}450\s?CHF$/);
    expect(lu(document.querySelector('.cn-ouvert'))).not.toMatch(/630/);
  }, 20000);
  it('forme propre : « 180 à 450 CHF » (garde : la forme que lit la fonction)', async () => {
    monter(vapeur({ forme: 'propre' }), { ouvrir: ID });
    await attendre(120);
    expect(total()).toMatch(/^180\D{1,6}450\s?CHF$/);
  }, 20000);
  it.each<[Forme]>([['propre'], ['sansOption'], ['melange']])('le ventilateur écarté (avec sa raison), forme « %s » : « 450 CHF » en tête, jamais « 450 à 630 » (C4-ecartee)', async (forme) => {
    monter(ecarter(vapeur({ forme }), 'FV', 'trop bruyant'), { ouvrir: ID });
    await attendre(120);
    expect(total(), 'le coût en tête d\'une seule piste restante').toMatch(/^(≈\s?)?450\s?CHF$/);
    expect(lu(document.querySelector('.cn-ouvert'))).not.toMatch(/630/);
  }, 20000);
  it('trois pistes (450, 180, 120) : « 120 à 450 CHF »', async () => {
    monter(vapeur({ forme: 'propre', hotte: true }), { ouvrir: ID });
    await attendre(120);
    expect(total()).toMatch(/^120\D{1,6}450\s?CHF$/);
  }, 20000);
  it('une piste sans prix : jamais « 0 CHF » ni « 0 à 450 » ; la fourchette reste 180 à 450', async () => {
    monter(vapeur({ forme: 'propre', humidificateur: true }), { ouvrir: ID });
    await attendre(120);
    expect(total()).toMatch(/^180\D{1,6}450\s?CHF$/);
    expect(lu(document.querySelector('.cn-ouvert'))).not.toMatch(/(^|\D)0\s?CHF/);
  }, 20000);
  it('une seule piste chiffrée : « 450 CHF » en tête', async () => {
    monter(vapeur({ seule: true }), { ouvrir: ID });
    await attendre(120);
    expect(total(), 'le prix de la seule piste').toMatch(/^(≈\s?)?450\s?CHF$/);
  }, 20000);
  it('Décidé (le condenseur retenu) : la rangée ne dit que la retenue, 450 CHF (C5-retenu)', async () => {
    monter(retenir(vapeur({ forme: 'melange' }), 'FC'), { ouvrir: ID });
    await attendre(120);
    expect(total()).toMatch(/^450\s?CHF$/);
    expect(lu(document.querySelector('.cn-ouvert'))).not.toMatch(/630|180\D{1,6}450/);
  }, 20000);
  it('Résolu avec le condenseur retenu : « Retenu : Condenseur… · 450 CHF », aucune somme', async () => {
    const items = appliquer(retenir(vapeur({ forme: 'melange' }), 'FC'), resoudre(retenir(vapeur({ forme: 'melange' }), 'FC') as never, { carnetId: ID, le: nov(25, 11), sorte: 'reparation' }) as never);
    monter(items, { ouvrir: ID });
    await attendre(120);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t, 'le Résolu est ouvert').toMatch(/Retenu : Condenseur/);
    expect(t, `Résolu : « ${t.slice(0, 400)} »`).toMatch(/Retenu : Condenseur[^.]{0,60}450\s?CHF/);
    expect(t).not.toMatch(/630/);
  }, 20000);
});

describe('R87 · C72-1 (B) : chaque SURFACE qui dit un coût, une par test', () => {
  it('SURFACE jetons de la bulle : la bulle à deux pistes dit 450 CHF et 180 CHF, chacun une fois ; jamais un 630 sous la bulle', async () => {
    monter(vapeur({ forme: 'melange' }), { ouvrir: ID });
    await attendre(120);
    const bulle = [...document.querySelectorAll('.cnp-b')].find(b => /deux pistes/.test(lu(b)));
    expect(bulle, 'la bulle de la phrase à deux pistes').toBeTruthy();
    const t = lu(bulle).replace(DEUX, '');
    expect(t).not.toMatch(/630/);
    expect((t.match(/450\s?CHF/g) ?? []).length, `450 dit une fois : « ${t} »`).toBe(1);
    expect((t.match(/180\s?CHF/g) ?? []).length, `180 dit une fois : « ${t} »`).toBe(1);
  }, 20000);
  it('SURFACE tuiles d\'option : chaque piste dit SON prix (condenseur 450, ventilateur 180), jamais celui de l\'autre ni la somme', async () => {
    monter(vapeur({ forme: 'melange' }), { ouvrir: ID });
    await attendre(120);
    const tuile = (nom: RegExp) => [...document.querySelectorAll('.cnp-opt')].find(t => nom.test(t.getAttribute('aria-label') ?? '') || nom.test(lu(t)));
    const c = lu(tuile(/Condenseur/)), v = lu(tuile(/Ventilateur/));
    expect(c, `tuile du condenseur : « ${c} »`).toMatch(/450\s?CHF/);
    expect(c).not.toMatch(/180|630/);
    expect(v, `tuile du ventilateur : « ${v} »`).toMatch(/180\s?CHF/);
    expect(v).not.toMatch(/450|630/);
  }, 20000);
  it('SURFACE ligne de la liste : la ligne du problème ne dit jamais la somme 630', async () => {
    monter(vapeur({ forme: 'melange', domaine: true }));
    await attendre(150);
    const corps = lu(document.body);
    expect(corps, 'le problème est dans la liste').toMatch(/vapeur au brassage/);
    expect(corps, 'aucune somme de deux solutions exclusives dans la liste').not.toMatch(/630/);
  }, 20000);
  it('SURFACE ligne de la liste (la fonction `valeurUtile`) : rien de 630 ; le ventilateur écarté, rien de 630 non plus', () => {
    const items = vapeur({ forme: 'melange', domaine: true });
    const messages = lireMessages(items as never);
    const c = lireCarnets(items as never, { archives: true }).find(x => x.id === ID)!;
    expect(valeurUtile(c, MAINT(), messages) ?? '').not.toMatch(/630/);
    const items2 = ecarter(items, 'FV', 'trop bruyant');
    const c2 = lireCarnets(items2 as never, { archives: true }).find(x => x.id === ID)!;
    expect(valeurUtile(c2, MAINT(), lireMessages(items2 as never)) ?? '').not.toMatch(/630/);
  });
  it('SURFACE rubrique Quand : un carnet d\'achat à plusieurs prix dit le prix de CE qui est choisi, jamais une somme ni une fourchette (« 1 kg · ≈40 CHF »)', async () => {
    const c = pelletsTrois();
    const doc = { ...c, status: 'validated', carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'M1'),
      choix: { articleId: 'M1', pourquoi: 'En stock, MotlerHops.', ecartes: [], le: LE, quantite: { kg: 1, libelle: '1 kg' }, prixCentimes: 4000, remplaces: [] } } };
    poserQuantitePour(TITRE_PELLETS, 1);
    monter([doc as never, ...fixtureCarnets().filter(i => i.id !== ID_PELLETS)] as Item[], { ouvrir: ID_PELLETS });
    await attendre(120);
    const quand = lu(document.querySelector('[aria-label="Quand"]'));
    expect(quand, 'la rubrique Quand est là').toMatch(/Quand/);
    expect(quand, `Quand : « ${quand} »`).not.toMatch(/\d\s?à\s?\d|\d\s?-\s?\d|630/);
  }, 30000);
});

describe('R87 · C72-1 (B) : le GESTE — la phrase à deux pistes tapée dans le problème', () => {
  const carnetVide = (): Item[] => {
    const items = vapeur({ forme: 'propre', seule: true }).filter(i => i.id === ID) as Item[];
    const c = items[0] as unknown as { carnet: { facons: unknown[]; notes: unknown[] } };
    c.carnet.facons = []; c.carnet.notes = [];
    return items;
  };
  it('repli local (IA éteinte) : « deux pistes, … 450 CHF, ou … 180 CHF » : « 180 à 450 CHF » en tête, jamais « ≈ 630 CHF »', async () => {
    const m = monter(carnetVide(), { ouvrir: ID });
    await attendre(100);
    await taper(DEUX);
    const t = lu(document.querySelector('.cn-ouvert'));
    const etiquettes = lireMessages(m.magasin.lire() as never).flatMap(x => x.carnetMessage.etiquettes ?? []).filter(e => e.sorte === 'cout').map(e => `${e.montantCentimes}:${e.optionId ?? '-'}`);
    expect(t, `la phrase est rangée dans le problème : ${t.slice(0, 300)}`).toMatch(/deux pistes/);
    expect(total(), `coût en tête après le geste (options : ${JSON.stringify(carnetDe(m, ID).carnet.facons.map(f => f.nom))} ; jetons de coût : ${JSON.stringify(etiquettes)})`).toMatch(/^180\D{1,6}450\s?CHF$/);
    expect(t, 'jamais la somme de deux solutions exclusives').not.toMatch(/630/);
  }, 30000);
  it('réponse de l\'IA simulée (une ligne par piste : option + coût écrit) : « 180 à 450 CHF » en tête, jamais « 630 »', async () => {
    const appels = reponseIA([
      { sorte: 'note', texte: DEUX, genre: 'note', carnetId: ID, option: NOMS.FC, etiquette: 'cout', prixCentimes: 45000, prixSource: 'texte', citation: 'un condenseur de buées à eau froide à 450 CHF' },
      { sorte: 'note', texte: DEUX, genre: 'note', carnetId: ID, option: NOMS.FV, etiquette: 'cout', prixCentimes: 18000, prixSource: 'texte', citation: 'un ventilateur extracteur mural à 180 CHF' }
    ]);
    const m = monter(carnetVide(), { ouvrir: ID, appels });
    await attendre(100);
    await taper(DEUX);
    const t = lu(document.querySelector('.cn-ouvert'));
    const etiquettes = lireMessages(m.magasin.lire() as never).flatMap(x => x.carnetMessage.etiquettes ?? []).filter(e => e.sorte === 'cout').map(e => `${e.montantCentimes}:${e.optionId ?? '-'}`);
    expect(t, `la phrase est rangée : ${t.slice(0, 300)}`).toMatch(/deux pistes/);
    expect(total(), `coût en tête après la réponse de l'IA (options : ${JSON.stringify(carnetDe(m, ID).carnet.facons.map(f => f.nom))} ; jetons de coût : ${JSON.stringify(etiquettes)})`).toMatch(/^180\D{1,6}450\s?CHF$/);
    expect(t, 'jamais la somme').not.toMatch(/630/);
  }, 30000);
});

/* =========================================================================================================== R88 */

describe('R88 · C72-2 : la veille d\'une option ÉCARTÉE s\'arrête (ou se dit arrêtée)', () => {
  /** Le ventilateur mis en veille puis écarté avec sa raison (E1-tache). */
  const veilleEcartee = (): Item[] => {
    const items = vapeur({ forme: 'propre' });
    const enVeille = appliquer(items, changerOption(items as never, { carnetId: ID, faconId: 'FV', vers: 'veille', le: nov(25, 6) }) as never);
    return ecarter(enVeille, 'FV', 'trop bruyant');
  };
  const cartesVeille = () => [...document.querySelectorAll('[data-evenement="veille"]')].map(e => lu(e));
  it('garde : la veille demandée, le ventilateur encore en veille, se dit « veille demandée · … · pas encore relevée »', async () => {
    const items = vapeur({ forme: 'propre' });
    monter(appliquer(items, changerOption(items as never, { carnetId: ID, faconId: 'FV', vers: 'veille', le: nov(25, 6) }) as never), { ouvrir: ID });
    await attendre(120);
    expect(cartesVeille().join(' | '), 'la carte de veille demandée').toMatch(/veille demandée[^|]*Ventilateur/);
  }, 20000);
  it('le ventilateur écarté : plus de carte « veille demandée · Ventilateur · pas encore relevée » qui court encore (arrêtée, ou absente)', async () => {
    monter(veilleEcartee(), { ouvrir: ID });
    await attendre(120);
    const cartes = cartesVeille().filter(t => /Ventilateur/.test(t));
    const vivante = cartes.filter(t => /pas encore relevée/.test(t) && !/arrêt|stopp|terminé|plus de veille|sans veille/i.test(t));
    expect(vivante, `cartes de veille du ventilateur : ${JSON.stringify(cartes)}`).toEqual([]);
  }, 20000);
  it('le ventilateur écarté : le fil ne dit pas qu\'une veille est encore demandée pour lui (aucune « veille demandée » du ventilateur sans arrêt dit)', async () => {
    monter(veilleEcartee(), { ouvrir: ID });
    await attendre(120);
    const fil = lu(document.querySelector('.cn-ouvert'));
    const reste = /veille demandée\s*·\s*Ventilateur[^·]*?pas encore relevée/.test(fil) && !/(arrêt|stopp)/i.test(fil);
    expect(reste, `fil : « ${fil.slice(0, 700)} »`).toBe(false);
  }, 20000);
});

/* ---- C72-3 : À faire, l'ordre sous « Un jour » ---- */

describe('R88 · C72-3 : À faire — sous « Un jour », le plus proche en tête (R84 : trié par date)', () => {
  const M = '2026-11-25';
  const carnetDeTaches = (id: string, titre: string, taches: Array<{ id: string; texte: string; echeance: string; precision: 'semaine' | 'mois' }>, notes: string[] = []): CarnetDoc => {
    const item = { id, type: 'carnet', title: titre, status: 'idea', carnet: {
      version: 1, creeLe: '2026-11-05T08:00:00.000Z', phrase: titre, criteres: [], facons: [], articles: [], photos: [], genre: { valeur: 'achat', origine: 'ia' }, domaine: { valeur: 'brasserie', origine: 'ia' },
      notes: notes.map((texte, i) => ({ id: `${id}-N${i}`, texte, genre: 'note' })),
      taches: taches.map(t => ({ id: t.id, texte: t.texte, echeance: t.echeance, precision: t.precision, origine: 'locale', creeeLe: '2026-11-05T08:00:00.000Z' }))
    } };
    return lireCarnets([item] as never, { archives: true })[0];
  };
  /* le relevé G1-afaire : Frigo + congel (jusqu'au 1 mai 2027), Extincteur (jusqu'au 31 déc.), la tâche « sem. du 7 déc. », puis avril 2027 */
  const carnets = () => [
    carnetDeTaches('ZZ-C72-FR', 'ZZ TEST — c72 Frigo + congel', [], ['À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements)']),
    carnetDeTaches('ZZ-C72-EX', 'ZZ TEST — c72 Extincteur', [], ['À faire du 01.09.2026 au 31.12.2026 (Planning, Sécurité)']),
    carnetDeTaches('ZZ-C72-HO', 'ZZ TEST — c72 hotte', [{ id: 'ZZ-C72-T1', texte: 'tache-sem-7-dec', echeance: '2026-12-07', precision: 'semaine' }]),
    carnetDeTaches('ZZ-C72-AV', 'ZZ TEST — c72 évier', [{ id: 'ZZ-C72-T2', texte: 'tache-avril-2027', echeance: '2027-04-05', precision: 'semaine' }])
  ];
  const lignesUnJour = () => {
    const { container } = render(<AFaire carnets={carnets()} maintenant={`${M}T12:00:00.000Z`} messages={[]} onCocher={() => {}} onOuvrir={() => {}} onEcheance={() => {}} />);
    const g = [...container.querySelectorAll('section.af-groupe')].find(s => /Un jour/.test(lu(s.querySelector('h3'))));
    return g ? [...g.querySelectorAll('li')].map(li => lu(li)) : [];
  };
  it('l\'ordre sous « Un jour » : la tâche du 7 déc., puis le 31 déc. (Extincteur), puis avril 2027, puis le 1 mai 2027 (Frigo + congel)', () => {
    const l = lignesUnJour();
    const rang = (re: RegExp) => l.findIndex(x => re.test(x));
    const attendu = [['tâche du 7 déc.', /tache-sem-7-dec/], ['Extincteur, jusqu\'au 31 déc.', /Extincteur/], ['tâche d\'avril 2027', /tache-avril-2027/], ['Frigo + congel, jusqu\'au 1 mai 2027', /Frigo \+ congel/]] as const;
    const rangs = attendu.map(([nom, re]) => ({ nom, i: rang(re) }));
    expect(rangs.filter(r => r.i < 0).map(r => r.nom), `lignes sous « Un jour » : ${JSON.stringify(l)}`).toEqual([]);
    expect(rangs.map(r => r.i), `ordre lu : ${JSON.stringify(l)}`).toEqual([...rangs.map(r => r.i)].sort((a, b) => a - b));
  });
  it('Frigo + congel (1 mai 2027) est la DERNIÈRE ligne sous « Un jour », pas la première', () => {
    const l = lignesUnJour();
    expect(l.length, `lignes : ${JSON.stringify(l)}`).toBeGreaterThanOrEqual(4);
    expect(l[l.length - 1], `ordre : ${JSON.stringify(l)}`).toMatch(/Frigo \+ congel/);
  });
});

/* ---- C72-4 : la carte de l'article choisi ne dit qu'une quantité ---- */

describe('R88 · C72-4 (C71-8 en partie) : la carte de l\'article choisi pour 1 kg ne redit pas « 50 g » sur sa ligne de valeurs', () => {
  /** Le carnet du test en ligne : « Choisir · MotlerHops, 1 kg » ; la page lue de l'article dit « Alpha 10 % - 15 % », « 50 g » (le sachet) et « Origine États-Unis » (cap/L2-retire.png). */
  const choisiUnKilo = (): Item[] => {
    const c = pelletsTrois();
    const m1 = c.carnet.articles.find(a => a.id === 'M1')!;
    const article = { ...m1, valeurs: { Alpha: { valeur: '10 - 15', unite: '%', origine: 'page' }, 'Poids net': { valeur: 50, unite: 'g', origine: 'page' }, Origine: { valeur: 'États-Unis', origine: 'page' } } };
    const doc = { ...c, status: 'validated', carnet: { ...c.carnet, articles: [article],
      choix: { articleId: 'M1', pourquoi: 'En stock, MotlerHops (FR).', ecartes: [], le: LE, quantite: { kg: 1, libelle: '1 kg' }, prixCentimes: 4000, remplaces: [] } } };
    return [doc as never, ...fixtureCarnets().filter(i => i.id !== ID_PELLETS)] as Item[];
  };
  it('la carte (Citra, MotlerHops) dit 1 kg et ≈40 CHF, et nulle part « 50 g »', async () => {
    poserQuantitePour(TITRE_PELLETS, 1);
    monter(choisiUnKilo(), { ouvrir: ID_PELLETS });
    await attendre(120);
    expect(lu(document.body), 'le carnet dit « Choisi : … »').toMatch(/Choisi : /);
    const cartes = [...document.querySelectorAll('.cn-article')].map(a => lu(a)).filter(t => /citra/i.test(t));
    expect(cartes.length, `cartes : ${JSON.stringify(cartes)}`).toBeGreaterThan(0);
    for (const x of cartes) {
      expect(x, `carte : « ${x} »`).toMatch(/1 kg/);
      expect(x, `deux quantités sur la même carte : « ${x} »`).not.toMatch(/\b50 g\b/);
    }
  }, 30000);
});

/* ---- C72-5 : « Comparer sur l'acides alpha (%) » ---- */

describe('R88 · C72-5 : la puce « Comparer sur … » dit un français juste pour l\'alpha', () => {
  const ligne = (nom: string) => ({ sorte: 'critere', propose: true, texte: `Comparer sur ${nom}`, caracteristique: { nom, unite: '%', sens: 'plus-grand' }, origine: 'ia' }) as never;
  it.each([['acides alpha'], ['Acides alpha'], ['Taux d\'acides alpha'], ['Alpha']])('« Comparer sur … » pour la caractéristique « %s » : jamais « l\'acides », « le acides » ni « la acides »', (nom) => {
    const l = libelleProposee(ligne(nom));
    expect(l, `libellé : « ${l} »`).not.toMatch(/\b(l['’]|le |la )acides?\b/i);
  });
  it('« acides alpha » prend « les » ou se dit « l’alpha » : « Comparer sur l’alpha (%) » ou « sur les acides alpha »', () => {
    const l = libelleProposee(ligne('acides alpha'));
    expect(l, `libellé : « ${l} »`).toMatch(/Comparer sur (l['’]alpha|les acides alpha)/);
  });
  it('la fonction `avecArticle` : « acides alpha » reçoit « les » (un pluriel en -s), jamais « l\'acides »', () => {
    expect(avecArticle('acides alpha')).not.toMatch(/^l['’]/);
    expect(avecArticleTypo('Acides alpha')).not.toMatch(/^l['’]/);
  });
  it('garde : « l’oxygène » et « le débit » gardent leur article (le correctif ne casse pas les autres)', () => {
    expect(avecArticle('oxygène capté')).toBe('l\'oxygène capté');
    expect(avecArticle('débit')).toBe('le débit');
  });
});

/* ---- C72-6 : « votre phrase : « … » » redit la première bulle ---- */

describe('R88 · C72-6 : sur un carnet neuf, « votre phrase : « … » » ne redit pas la première bulle, juste dessous (maquette v01-vapeur : la bulle suffit)', () => {
  const lignesCitees = () => [...document.querySelectorAll('.cn-cite')].map(e => lu(e));
  it('problème neuf (vapeur) : la phrase est la première bulle du fil : aucune ligne « votre phrase : « … » »', async () => {
    monter(vapeur({ forme: 'propre' }), { ouvrir: ID });
    await attendre(120);
    expect(lu(document.querySelector('.cn-ouvert')), 'la première bulle dit la phrase').toContain('la buée coule du plafond');
    const cites = lignesCitees().filter(t => /votre phrase :/.test(t));
    expect(cites, `lignes « votre phrase » : ${JSON.stringify(cites)}`).toEqual([]);
  }, 20000);
  it('étiqueteuse (problème neuf, autre phrase) : aucune ligne « votre phrase : « … » »', async () => {
    monter(vapeur({ forme: 'propre', phrase: 'ZZ TEST — c72 l’étiqueteuse colle de travers depuis lundi, les étiquettes se froissent' }), { ouvrir: ID });
    await attendre(120);
    const cites = lignesCitees().filter(t => /votre phrase :/.test(t));
    expect(cites, `lignes « votre phrase » : ${JSON.stringify(cites)}`).toEqual([]);
  }, 20000);
  it('mémo (genre idée, joints graissés) : la phrase est la première bulle : aucune ligne « votre phrase : « … » »', async () => {
    monter(vapeur({ forme: 'propre', genre: 'idee', phrase: 'ZZ TEST — c72 mémo : joints du robinet de la cuve de garde graissés ce matin' }), { ouvrir: ID });
    await attendre(120);
    const cites = lignesCitees().filter(t => /votre phrase :/.test(t));
    expect(cites, `lignes « votre phrase » : ${JSON.stringify(cites)}`).toEqual([]);
  }, 20000);
  it('garde : la phrase du carnet n\'est jamais perdue (la première bulle la dit encore)', async () => {
    monter(vapeur({ forme: 'propre' }), { ouvrir: ID });
    await attendre(120);
    expect(lu(document.querySelector('.cn-ouvert'))).toContain('la buée coule du plafond');
  }, 20000);
});
