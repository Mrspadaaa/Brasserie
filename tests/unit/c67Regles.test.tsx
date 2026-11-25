// @vitest-environment jsdom
/**
 * Voie c67-tests (25.11) : les tests ROUGES des règles R56 à R62 tirées du test en ligne du tour 67 (voies/critique-67/RESULTAT.md ; BUGS.md C67-1 à C67-12).
 * Écrits depuis les RÈGLES (voies/c67-tests/DOSSIER.md) et la maquette choisie v01 de maquettes3 (règle n° 1, D451), avant tout correctif :
 * celui qui corrige n'écrit pas le test. Aucun réseau, aucun Gemini (AiClient lève s'il est appelé ; IA simulée `appelsSimules`). Données : `fixtureSuivi()` et
 * quelques phrases inventées (« ZZ TEST — »), aucune donnée réelle.
 *
 *  - R56 (C67-1) : chaque problème de la liste porte sa jauge (4 pastilles), son état en mot et son dernier pas. Le coup d'œil compte « je cherche » tous genres confondus :
 *    une ligne qu'il compte porte aussi sa jauge et son état.
 *  - R57 (C67-2) : « rangé pour toi » range un problème de MATÉRIEL au brassage en Brasserie › Brassage, genre problème, jamais « Local · idée ». Se tire du SENS : 5 phrases
 *    neuves au brassage (dont la vapeur de la maquette, jamais seule), 3 phrases de contrôle qui restent au Local, 3 idées qui ne deviennent pas des problèmes.
 *  - R58 (C67-3) : changer le genre d'un carnet ouvert (··· › Problème, Mémo) se voit AUSSITÔT ; GESTE : CarnetsVue monté, le carnet tout juste créé, sans sortir ni revenir.
 *  - R59 (C67-4) : le coût d'un problème ne somme pas des options ALTERNATIVES (condenseur A 690 ou B 540 : jamais ≈ 1 230).
 *  - R60 (C67-5) : le Résolu montre les options fermées avec leur raison (maquette v01-resolu : « Condenseur A pas pris », « Humidificateur non, 22 nov. »), son rangement complet et « ira dans Réalisés ».
 *  - R61 (C67-6) : dater une tâche (« Voir avec l'électricien ») ne crée JAMAIS d'achat dans À venir ; une tâche d'achat avec coût y va, à la date choisie. GESTE : À faire monté, « Quand ? ».
 *  - R62 (m) : C67-7 la raison d'un écart ne suit pas l'option retenue ; C67-8 un article plus en stock n'est jamais 1er ; C67-9 un toucher sur Veille = une bulle ;
 *    C67-10 la relecture dit « essayé » ; C67-12 le menu du domaine propose les sous-domaines.
 * Limites : jsdom ne mesure aucune boîte (la jauge se juge à ses 4 éléments `<i>`, le texte au contenu) ; le vrai Gemini n'est pas appelé : R57 se juge sur l'IA simulée, le repli
 * par les mots, et le texte de la consigne envoyée au modèle. Le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS_SUIVI, MAINTENANT_SUIVI, OPTIONS_VAPEUR, fixtureSuivi, ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, lireMessages, type Article, type CarnetDoc, type Tache } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { changerOption, resoudre, retenirOption, suiviDe } from '../../src/domain/carnets/suivi';
import { coupDOeil } from '../../src/domain/carnets/arbre';
import { filDe } from '../../src/domain/carnets/fil';
import { tableau } from '../../src/domain/carnets/comparer';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { aidesCarnet } from '../../src/config/carnetIA';
import { RANGER_CARNET } from '../../functions/src/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { domaineParMots } from '../../src/ui/carnets/domaineMots';
import { resumeJetons } from '../../src/ui/carnets/filRegles';
import { planDeLAchat } from '../../src/ui/carnets/afaireRegles';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

type Item = ReturnType<typeof fixtureSuivi>[number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const LE = '2026-11-24T12:00:00.000Z';
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();

interface Montage { appels?: ReturnType<typeof appelsSimules>; ouvrir?: string; ecrirePlan?: (p: unknown) => void }
function monter(items: Item[], o: Montage = {}) {
  const magasin = magasinMemoire(items as never[]);
  const r = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={o.appels ?? appelsSimules('normal', 5)}
    aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(o.ecrirePlan ?? (() => {})) as never} {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} />);
  return { magasin, ...r };
}
const appliquer = (items: Item[], r: { ok: boolean; ecritures?: unknown; raison?: string }): Item[] => {
  if (!r.ok) throw new Error(`opération refusée : ${r.raison}`);
  return appliquerEcritures(items as never, r.ecritures as never) as Item[];
};
const doc = (items: Item[], id: string): CarnetDoc => lireCarnets(items as never, { archives: true }).find(c => c.id === id)!;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const retouche = (items: Item[], id: string, f: (carnet: Record<string, unknown>) => void): Item[] => {
  const copie = clone(items) as unknown as Array<{ id: string; carnet?: Record<string, unknown> }>;
  const it = copie.find(x => x.id === id)!;
  f(it.carnet!);
  return copie as unknown as Item[];
};
const boutonTexte = (re: RegExp, racine: ParentNode = document): HTMLElement | undefined =>
  [...racine.querySelectorAll<HTMLElement>('button, [role="tab"], [role="menuitem"], [role="menuitemradio"]')].find(b => re.test(lu(b)) || re.test(b.getAttribute('aria-label') ?? ''));

/** Un message tapé sur la liste (champ du bas), IA simulée : la feuille « rangé pour toi » qui en sort, ou null. Le magasin ne garde qu'un carnet sans rapport (la fête). */
async function taperSurLaListe(phrase: string, items?: Item[]) {
  const base = items ?? fixtureSuivi().filter(i => i.id === IDS_SUIVI.fete);
  const m = monter(base);
  await attendre(40);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: phrase } });
  await attendre(40);
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(900);
  return { ...m, feuille: document.querySelector('[data-feuille-rangement]') };
}

/* =========================================================================================================== R56 */

describe('R56 (C67-1) : chaque problème de la liste porte sa jauge (4 pastilles), son état en mot et son dernier pas', () => {
  const MOTS = ['Noté', 'Je cherche', 'Décidé', 'Résolu'];

  it('la liste montée (fixture du suivi) : chaque ligne de problème a 4 pastilles, un état en mot et un dernier pas', async () => {
    monter(fixtureSuivi());
    await attendre(60);
    const lignes = [...document.querySelectorAll('.cnl-pb[data-genre="probleme"]')];
    expect(lignes.length, 'des lignes de problème').toBeGreaterThanOrEqual(3);
    for (const l of lignes) {
      expect(l.querySelectorAll('.cnl-jauge i').length, `jauge de « ${lu(l)} »`).toBe(4);
      expect(MOTS, `état de « ${lu(l)} »`).toContain(lu(l.querySelector('.cnl-etat')));
      expect(lu(l.querySelector('.cnl-pas')).length, `dernier pas de « ${lu(l)} »`).toBeGreaterThan(2);
    }
  });

  it('le coup d\'œil « je cherche » compte des carnets de tout genre : chaque ligne qu\'il fait voir porte sa jauge et « Je cherche »', async () => {
    const items = fixtureSuivi();
    const tous = lireCarnets(items as never, { archives: true });
    const attendus = coupDOeil(tous, 2026).cherche;
    monter(items);
    await attendre(60);
    const case1 = boutonTexte(/je cherche/i, document.querySelector('.cnl-oeil, [class*="oeil"]') ?? document);
    expect(case1, 'la case « je cherche » du coup d\'œil').toBeTruthy();
    fireEvent.click(case1!);
    await attendre(30);
    const lignes = [...document.querySelectorAll('.cnl-corps .cnl-pb')];
    expect(lignes.length, 'autant de lignes que le coup d\'œil en compte').toBe(attendus);
    const sansJauge = lignes.filter(l => l.querySelectorAll('.cnl-jauge i').length !== 4 || lu(l.querySelector('.cnl-etat')) !== 'Je cherche').map(l => lu(l).slice(0, 60));
    expect(sansJauge, 'lignes comptées « je cherche » mais sans jauge ni état').toEqual([]);
  });
});

/* =========================================================================================================== R57 */

/** Problèmes de MATÉRIEL au brassage, formulés de façon neuve (aucun n'est la phrase de la maquette, aucun ne parle de vapeur). */
const BRASSAGE_NEUVES = [
  'ZZ TEST — La résistance de la cuve d’ébullition ne chauffe plus, le fusible a sauté pendant le brassage',
  'ZZ TEST — Fuite au raccord de la pompe pendant le transfert du moût vers le fermenteur',
  'ZZ TEST — Le thermomètre de la cuve d’empâtage est en panne, les paliers du brassage sont faux',
  'ZZ TEST — La hotte au-dessus de la cuve d’ébullition n’aspire plus, la salle de brassage se remplit de buée'
] as const;
const EXEMPLE_VAPEUR = 'ZZ TEST — c67 vapeur au brassage : trop de buée au plafond pendant l’ébullition, ça goutte sur le malt';
/** Des problèmes qui ne sont PAS du brassage : ils restent au Local (la règle ne range pas tout en Brasserie). */
const LOCAL_PROBLEMES = [
  'ZZ TEST — Fuite sous l’évier des toilettes, l’eau coule sur le sol du local',
  'ZZ TEST — La porte du local ne ferme plus, la serrure est cassée',
  'ZZ TEST — Panne de la prise du bureau, le disjoncteur saute dès qu’on branche le chargeur'
] as const;
/** Des idées et achats : ni un problème, ni une catégorie de matériel en panne. */
const IDEES = [
  'ZZ TEST — Acheter un deuxième fermenteur de 50 litres pour doubler les brassins',
  'ZZ TEST — Peut-être une cuve de brassage de 100 litres plus tard',
  'ZZ TEST — Une étiquette dorée pour la bière de Noël'
] as const;

const contexte = (texte: string) => ({ texte, saisie: '2026-11-24', depuis: null, carnets: [] });
const neuve = (texte: string) => {
  const r = reponseSimulee(contexte(texte) as never);
  const lignes = (r?.lignes ?? []) as Array<Record<string, unknown>>;
  return { lignes, ligne: lignes.find(l => l.carnetNeuf !== undefined) ?? lignes.find(l => l.sorte === 'idee'), probleme: lignes.some(l => l.genreCarnet === 'probleme') };
};

describe('R57 (C67-2) : « rangé pour toi » range un problème de matériel au brassage en Brasserie › Brassage, genre problème', () => {
  const brassage = [...BRASSAGE_NEUVES, EXEMPLE_VAPEUR];

  describe('le rangement simulé (le modèle de l\'app en mode simulé) lit le SENS, sur 5 phrases au brassage', () => {
    for (const phrase of brassage) {
      it(`« ${phrase.slice(10, 70)}… » : problème, domaine brasserie, chemin Brassage`, () => {
        const { ligne, probleme } = neuve(phrase);
        expect(ligne, 'un carnet neuf est proposé').toBeTruthy();
        expect(probleme, 'genre problème').toBe(true);
        expect(ligne!.domaine, 'domaine').toBe('brasserie');
        const chemin = ((ligne!.chemin ?? (neuve(phrase).lignes.find(l => Array.isArray(l.chemin))?.chemin)) ?? []) as string[];
        expect(chemin[0] ?? '', 'sous-domaine').toMatch(/^brassage$/i);
      });
    }
  });

  describe('contrôles : un problème du bâtiment reste au Local, une idée n\'est pas un problème', () => {
    for (const phrase of LOCAL_PROBLEMES) {
      it(`problème du local : « ${phrase.slice(10, 60)}… » ne va pas en Brasserie`, () => {
        const { ligne, probleme } = neuve(phrase);
        expect(ligne, 'un carnet neuf').toBeTruthy();
        expect(probleme, 'genre problème').toBe(true);
        expect(ligne!.domaine, 'domaine').toBe('local');
      });
    }
    for (const phrase of IDEES) {
      it(`idée : « ${phrase.slice(10, 60)}… » n'est pas un problème`, () => {
        expect(neuve(phrase).probleme).toBe(false);
      });
    }
  });

  describe('le repli par les mots (domaineParMots, sans IA) : la même règle de sens', () => {
    for (const phrase of brassage) {
      it(`« ${phrase.slice(10, 60)}… » : brasserie`, () => { expect(domaineParMots(phrase)).toBe('brasserie'); });
    }
    for (const phrase of LOCAL_PROBLEMES) {
      it(`« ${phrase.slice(10, 60)}… » : local`, () => { expect(domaineParMots(phrase)).toBe('local'); });
    }
  });

  it('la consigne envoyée au modèle donne « Brassage » comme sous-domaine de la Brasserie (il ne le devine pas des 5 mots du domaine)', () => {
    const consigne = sans(JSON.stringify(RANGER_CARNET));
    expect(consigne).toMatch(/brassage/);
  });

  describe('par le composant : la carte « rangé pour toi » (feuille de la liste) dit Brasserie › Brassage, nouveau problème, un titre court', () => {
    for (const phrase of brassage) {
      it(`« ${phrase.slice(10, 70)}… »`, async () => {
        const { feuille } = await taperSurLaListe(phrase);
        expect(feuille, 'la feuille « rangé pour toi » s\'ouvre').toBeTruthy();
        const t = lu(feuille);
        expect(t, 'catégorie').toMatch(/Brasserie › Brassage/);
        expect(t, 'genre').toMatch(/nouveau problème/);
        expect(t, 'jamais « Local · idée »').not.toMatch(/nouveau carnet · idée|Local/);
        const titre = lu(feuille!.querySelector('.cnl-t'));
        const phraseNue = sans(phrase.replace(/^ZZ TEST — /, ''));
        expect(sans(titre), 'le titre n\'est pas la phrase entière').not.toBe(phraseNue);
        expect(titre.length, 'un titre court').toBeLessThanOrEqual(60);
      }, 20000);
    }
  });
});

/* =========================================================================================================== R58 */

describe('R58 (C67-3) : changer le genre d\'un carnet ouvert se voit aussitôt, sans sortir ni revenir', () => {
  /** Le geste du test en ligne : une phrase tapée sur la liste crée un carnet « idée » ; la feuille OK ; il s'ouvre ; ··· › <genre>. */
  async function ouvrirUneIdeeNeuve() {
    const { feuille } = await taperSurLaListe('ZZ TEST — Une tireuse à bière pour la fête du village');
    expect(feuille, 'la feuille de rangement').toBeTruthy();
    fireEvent.click(boutonTexte(/^OK$/, feuille!)!);
    await attendre(60);
    const ligne = [...document.querySelectorAll<HTMLElement>('.cnl-pb')].find(l => /tireuse/i.test(lu(l)));
    expect(ligne, 'la ligne du carnet neuf dans la liste').toBeTruthy();
    fireEvent.click(ligne!);
    await attendre(60);
    expect(document.querySelector('.cn-ouvert'), 'le carnet s\'ouvre').toBeTruthy();
  }
  const choisirGenre = async (re: RegExp) => {
    fireEvent.click(document.querySelector('button[aria-label="Plus"]')!);
    await attendre(20);
    fireEvent.click(boutonTexte(re, document.querySelector('.cn-menu')!)!);
    await attendre(60);
  };

  it('garde-fou (le harnais marche) : sur un carnet ancien, ··· › Problème montre la barre d\'état', async () => {
    monter(fixtureCarnets() as never, { ouvrir: ID_VENTILATION });
    await attendre(80);
    await choisirGenre(/^Problème$/);
    expect([...document.querySelectorAll('.cnp-etat-mot')].map(lu)).toEqual(['Noté', 'Je cherche', 'Décidé', 'Résolu']);
  }, 20000);

  it('··· › Problème : l\'écran du problème (Noté · Je cherche · Décidé · Résolu) est là tout de suite', async () => {
    await ouvrirUneIdeeNeuve();
    await choisirGenre(/^Problème$/);
    const mots = [...document.querySelectorAll('.cnp-etat-mot')].map(lu);
    expect(mots, 'la barre d\'état du problème, sans sortir du carnet').toEqual(['Noté', 'Je cherche', 'Décidé', 'Résolu']);
  }, 20000);

  it('puis un état : Je cherche est coché à l\'instant', async () => {
    await ouvrirUneIdeeNeuve();
    await choisirGenre(/^Problème$/);
    const cherche = boutonTexte(/^Je cherche$/);
    expect(cherche, 'le bouton « Je cherche »').toBeTruthy();
    fireEvent.click(cherche!);
    await attendre(60);
    expect(boutonTexte(/^Je cherche$/)?.getAttribute('aria-pressed')).toBe('true');
  }, 20000);

  it('··· › Mémo : la puce « mémo » remplace l\'en-tête de l\'idée tout de suite', async () => {
    await ouvrirUneIdeeNeuve();
    await choisirGenre(/^Mémo$/);
    expect(lu(document.querySelector('.cnp-genre')), 'la puce du genre').toMatch(/mémo/i);
  }, 20000);
});

/* =========================================================================================================== R59 */

/** Le problème de vapeur au moment où le test en ligne l'a vu : deux condenseurs, A 690 CHF et B 540 CHF, l'un OU l'autre, aucun retenu (Je cherche). */
const vapeurAlternatives = (): Item[] => retouche(fixtureSuivi(), IDS_SUIVI.vapeur, k => {
  const suivi = k.suivi as { etat: string; evenements: unknown[] };
  suivi.etat = 'cherche';
  for (const f of k.facons as Array<{ id: string; etat: string; suivi?: { etat: string } }>) if (f.id === OPTIONS_VAPEUR.condB) { f.etat = 'ouverte'; if (f.suivi) f.suivi.etat = 'piste'; }
  delete k.choix;
  k.taches = [];
});

describe('R59 (C67-4) : le coût d\'un problème ne somme pas des options alternatives', () => {
  const SOMME = 123000;

  it('le résumé des jetons du fil : jamais 690 + 540 = 1 230 CHF', () => {
    const items = vapeurAlternatives();
    const r = resumeJetons(lireMessages(items as never), IDS_SUIVI.vapeur);
    expect(r?.total?.centimes, 'total = somme de deux options alternatives').not.toBe(SOMME);
  });

  it('le problème monté (Je cherche, A 690 ou B 540) : jamais « 1 230 », et les deux prix se lisent (fourchette 540 à 690)', async () => {
    monter(vapeurAlternatives(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t, 'le problème est ouvert').toMatch(/Condenseur/);
    expect(t, 'jamais la somme').not.toMatch(/1\s?230/);
    expect(t, 'le prix de A').toMatch(/690/);
    expect(t, 'le prix de B').toMatch(/540/);
  }, 20000);

  it('décidé (B retenu à 540) : aucun montant ne somme A et B', async () => {
    monter(fixtureSuivi(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t).toMatch(/Condenseur B/);
    expect(t).not.toMatch(/1\s?230/);
  }, 20000);
});

/* =========================================================================================================== R60 */

const vapeurResolue = (): Item[] => appliquer(fixtureSuivi(), resoudre(fixtureSuivi() as never, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T09:00:00.000Z', sorte: 'reparation' }) as never);

/** Le test en ligne : le condenseur A écarté avec sa raison (le geste « Écarter » de l'app), puis Résolu. */
const avecRaisonDeA = (): Item[] => {
  const base = fixtureSuivi();
  const ecarte = appliquer(base, changerOption(base as never, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.condA, vers: 'ecartee', raison: 'trop petit pour la cuve', le: LE }) as never);
  return appliquer(ecarte, resoudre(ecarte as never, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T09:00:00.000Z', sorte: 'reparation' }) as never);
};

describe('R60 (C67-5) : le Résolu montre les options fermées avec leur raison (maquette v01-resolu)', () => {
  it('une option écartée avec sa raison (« trop petit pour la cuve ») : le Résolu la redit à côté de l\'option', async () => {
    monter(avecRaisonDeA(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    expect(lu(document.querySelector('.cn-ouvert')), 'Condenseur A et sa raison').toMatch(/Condenseur A.{0,30}trop petit pour la cuve/i);
  }, 20000);

  it('garde-fou : Condenseur A et Hotte + extracteur « pas pris », Humidificateur « non »', async () => {
    monter(vapeurResolue(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t, 'le Résolu est affiché').toMatch(/Résolu/);
    expect(t, 'Condenseur A, pas pris').toMatch(/Condenseur A.{0,12}pas pris/i);
    expect(t, 'Hotte + extracteur, pas pris').toMatch(/Hotte \+ extracteur.{0,12}pas pris/i);
    expect(t, 'Humidificateur, écarté, avec sa date').toMatch(/Humidificateur.{0,12}non/i);
  }, 20000);

  it('le rangement complet (« Rangé : Brasserie › Brassage › Vapeur ») et « ira dans Réalisés »', async () => {
    monter(vapeurResolue(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    const t = lu(document.querySelector('.cn-ouvert'));
    expect(t).toMatch(/Rangé : Brasserie › Brassage › Vapeur/);
    expect(t).toMatch(/ira dans Réalisés/i);
  }, 20000);
});

/* =========================================================================================================== R61 */

const ID_APPEL = 'ZZ-C67-T-APPEL';
/** La hotte est l'option retenue ; une tâche « Voir avec l'électricien pour la hotte » (un appel : aucun coût) lui est liée, sans date. */
const hotteRetenue = (): Item[] => retouche(fixtureSuivi(), IDS_SUIVI.vapeur, k => {
  for (const f of k.facons as Array<{ id: string; etat: string; suivi?: { etat: string } }>) {
    if (f.id === OPTIONS_VAPEUR.condB) { f.etat = 'ouverte'; if (f.suivi) f.suivi.etat = 'piste'; }
    if (f.id === OPTIONS_VAPEUR.hotte) { f.etat = 'retenue'; f.suivi = { etat: 'retenue' }; }
  }
  k.taches = [{ id: ID_APPEL, texte: 'Voir avec l’électricien pour la hotte', optionId: OPTIONS_VAPEUR.hotte, origine: 'exemple', creeeLe: '2026-11-22T10:00:00.000Z' }];
});
/** Le condenseur B est retenu ; « Acheter le condenseur B » (540 CHF) n'a pas encore de date. */
const achatSansDate = (): Item[] => retouche(fixtureSuivi(), IDS_SUIVI.vapeur, k => {
  k.taches = (k.taches as Array<Record<string, unknown>>).map(t => { const s = { ...t }; delete s.echeance; delete s.precision; return s; });
});

async function dater(items: Item[], texteTache: string, choix: RegExp) {
  const plans: Array<Record<string, unknown>> = [];
  const m = monter(items, { ecrirePlan: p => { plans.push(p as never); } });
  await attendre(60);
  fireEvent.click(boutonTexte(/^À faire/)!);
  await attendre(40);
  const ligne = [...document.querySelectorAll('li')].find(l => lu(l).includes(texteTache));
  expect(ligne, `la ligne « ${texteTache} » dans À faire`).toBeTruthy();
  fireEvent.contextMenu(ligne!.querySelector('.af-corps') ?? ligne!);
  await attendre(30);
  const puce = boutonTexte(choix, document.querySelector('[role="dialog"]') ?? document);
  expect(puce, 'la puce du « Quand ? »').toBeTruthy();
  fireEvent.click(puce!);
  await attendre(120);
  return { ...m, plans };
}

describe('R61 (C67-6) : dater une tâche ne crée jamais un achat dans À venir ; seule une tâche d\'achat avec un coût y va, à la date donnée', () => {
  it('règle pure : « Voir avec l\'électricien pour la hotte », option retenue, datée, sans coût : aucun plan d\'À venir', () => {
    const c = doc(hotteRetenue(), IDS_SUIVI.vapeur);
    const t = { ...(c.carnet.taches![0] as Tache), echeance: '2026-11-30', precision: 'mois' as const };
    expect(planDeLAchat(c, t, LE), 'un appel n\'est pas un achat').toBeNull();
  });

  it('règle pure : l\'achat « Acheter le condenseur B » (540 CHF) daté fin du mois : un plan à CETTE date, pas à celle d\'aujourd\'hui', () => {
    const c = doc(achatSansDate(), IDS_SUIVI.vapeur);
    const t = { ...(c.carnet.taches!.find(x => /condenseur B/.test(x.texte)) as Tache), echeance: '2026-11-30', precision: 'mois' as const };
    const plan = planDeLAchat(c, t, '2026-11-23T08:00:00.000Z');
    expect(plan, 'un achat avec coût et option retenue entre dans À venir').toBeTruthy();
    expect(plan!.date, 'à la date donnée').toBe('2026-11-30');
    expect(plan!.amountCents).toBe(54000);
  });

  it('GESTE : À faire › appui sur « Voir avec l\'électricien pour la hotte » › Quand › Fin du mois : rien n\'est écrit dans À venir', async () => {
    const { plans } = await dater(hotteRetenue(), 'Voir avec l’électricien pour la hotte', /Fin du mois/);
    expect(plans, 'aucun plan d\'achat pour un appel').toEqual([]);
  }, 20000);

  it('GESTE : l\'achat « Acheter le condenseur B » daté Fin du mois entre dans À venir le 30 nov. (pas « aujourd\'hui »)', async () => {
    const { plans } = await dater(achatSansDate(), 'Acheter le condenseur B', /Fin du mois/);
    expect(plans.length, 'un plan').toBe(1);
    expect(plans[0].date, 'à la fin du mois').toBe('2026-11-30');
    expect(plans[0].amountCents).toBe(54000);
  }, 20000);
});

/* =========================================================================================================== R62 */

/** Un problème comme l'app l'écrit : aucune catégorie posée, trois options, la hotte retenue, A et B jamais prises, puis Résolu. */
const resoluCommeEnLigne = (): Item[] => {
  let it = retouche(fixtureSuivi(), IDS_SUIVI.vapeur, k => {
    delete k.categorie; k.phrase = 'Trop de vapeur au brassage'; k.notes = [{ id: 'N1', texte: 'Trop de vapeur au brassage', genre: 'note', modifieeLe: '2026-11-03T10:00:00.000Z' }];
    k.suivi = { etat: 'cherche', evenements: [] };
    k.facons = [{ id: 'FH', nom: 'Hotte et extracteur au plafond', etat: 'ouverte', origine: 'vous' }, { id: 'FA', nom: 'Condenseur A', etat: 'ouverte', origine: 'vous' }, { id: 'FB', nom: 'Condenseur B', etat: 'ouverte', origine: 'vous' }];
    delete k.choix; k.taches = []; k.articles = [];
  });
  /* D-25.11 (c74c) : « essayé » ne dit que ce qui a été essayé ou écarté (C73-3 prime sur C67-10) : A est écarté par lui, B reste une simple piste et n'est PAS dit « essayé » */
  it = appliquer(it, changerOption(it as never, { carnetId: IDS_SUIVI.vapeur, faconId: 'FA', vers: 'ecartee', raison: 'trop petit pour la cuve', le: LE }) as never);
  it = appliquer(it, retenirOption(it as never, { carnetId: IDS_SUIVI.vapeur, faconId: 'FH', le: LE }) as never);
  return appliquer(it, resoudre(it as never, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T09:00:00.000Z', sorte: 'reparation' }) as never);
};

describe('R62 (m) : les écarts restants du tour 67', () => {
  it('C67-7 : une option écartée puis retenue ne garde pas sa raison d\'écart (elle ne devient pas la raison du oui)', () => {
    const base = fixtureSuivi();
    const apresEcart = appliquer(base, changerOption(base as never, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.hotte, vers: 'ecartee', raison: 'il faut refaire l’électricité', le: LE }) as never);
    expect(doc(apresEcart, IDS_SUIVI.vapeur).carnet.facons.find(f => f.id === OPTIONS_VAPEUR.hotte)?.raison, 'écartée : sa raison est dite').toBe('il faut refaire l’électricité');
    const apresRetenue = appliquer(apresEcart, retenirOption(apresEcart as never, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.hotte, le: LE }) as never);
    expect(doc(apresRetenue, IDS_SUIVI.vapeur).carnet.facons.find(f => f.id === OPTIONS_VAPEUR.hotte)?.raison, 'retenue : plus de raison d\'écart').toBeUndefined();
  });

  it('C67-8 : un article « plus disponible » (540) n\'est jamais 1er devant un article en stock (690)', () => {
    const b = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
    const art = (id: string, nom: string, centimes: number, dispo: string): Article => ({ id, nom, domaine: 'boutique-exemple.test', url: `https://www.boutique-exemple.test/${id}`, lecture: 'lue', dispo, valeurs: {}, prixCentimes: centimes, devise: 'CHF', taxe: 'ttc' }) as Article;
    const c = { ...b, title: 'Condenseur', carnet: { ...b.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: [art('CA', 'Condenseur A', 69000, 'en stock'), art('CB', 'Condenseur B', 54000, 'plus disponible')] } } as CarnetDoc;
    const lignes = tableau(c)!.lignes;
    const rangB = lignes.find(l => l.articleId === 'CB')!.rang;
    expect(rangB, 'B, plus en stock : pas en tête').not.toBe(1);
  });

  it('C67-9 : un toucher sur Veille (option Condenseur A) pose UNE bulle « veille demandée · Condenseur A » dans le fil', async () => {
    monter(fixtureSuivi(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    fireEvent.click(boutonTexte(/^Condenseur A, /)!);
    await attendre(30);
    fireEvent.click(boutonTexte(/^Veille$/, document.querySelector('.cnp-opt-gestes') ?? document)!);
    await attendre(120);
    const bulles = [...document.querySelectorAll('[data-evenement="veille"]')].filter(e => /Condenseur A/.test(lu(e)));
    expect(bulles.length, 'une seule bulle pour la veille de A').toBe(1);
  }, 20000);

  it('C67-9 (domaine) : poserVeille ne pose qu\'un seul événement de veille pour l\'option', () => {
    const base = fixtureSuivi();
    const r = appliquer(base, changerOption(base as never, { carnetId: IDS_SUIVI.vapeur, faconId: OPTIONS_VAPEUR.condA, vers: 'veille', le: LE }) as never);
    const c = doc(r, IDS_SUIVI.vapeur);
    const evenements = suiviDe(c).evenements.filter(e => e.sorte === 'veille' && e.optionId === OPTIONS_VAPEUR.condA && e.le === LE);
    expect(evenements.length).toBe(1);
    const fil = filDe(c, lireMessages(r as never));
    const entrees = fil.jours.flatMap(j => j.entrees).filter(e => e.sorte === 'evenement' && e.evenement.sorte === 'veille' && e.evenement.optionId === OPTIONS_VAPEUR.condA && e.le === LE);
    expect(entrees.length).toBe(1);
  });

  it('C67-10 : la relecture d\'un résolu dit ce qui a été essayé (maquette v01-relecture : problème, essayé, pris, pourquoi, durée)', async () => {
    monter(resoluCommeEnLigne());
    await attendre(80);
    fireEvent.click(document.querySelector('.cnl-dn-resolus')!);
    await attendre(80);
    const t = lu(document.body);
    expect(t, 'la relecture est ouverte').toMatch(/Autres résolus|Toujours le bon choix/i);
    expect(t, 'une ligne « essayé » : les options écartées').toMatch(/essayé.{0,40}Condenseur A/i);
    /* C73-3 (D-25.11) : une simple piste n'a jamais été essayée */
    const dtEssaye = [...document.querySelectorAll('dt')].find(e => /^essayé$/i.test(lu(e)));
    expect(lu(dtEssaye?.nextElementSibling), 'la ligne « essayé » dite').toMatch(/Condenseur A/i);
    expect(lu(dtEssaye?.nextElementSibling), 'B, simple piste, n\'est pas « essayé »').not.toMatch(/Condenseur B/i);
  }, 20000);

  it('C67-12 : le menu du domaine propose les sous-domaines (Brasserie › Brassage), pas seulement les cinq domaines', async () => {
    monter(fixtureSuivi(), { ouvrir: IDS_SUIVI.vapeur });
    await attendre(80);
    const pastille = document.querySelector<HTMLElement>('.cnd-pastille');
    expect(pastille, 'la pastille de catégorie').toBeTruthy();
    fireEvent.click(pastille!);
    await attendre(30);
    const menu = lu(document.querySelector('.cnd-menu'));
    expect(menu, 'le menu est ouvert').toMatch(/Brasserie/);
    expect(menu, 'avec son sous-domaine').toMatch(/Brassage/);
  }, 20000);
});
