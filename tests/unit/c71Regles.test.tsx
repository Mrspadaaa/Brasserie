// @vitest-environment jsdom
/**
 * Voie c71-tests (25.11) : les tests ROUGES des règles R84 à R86 tirées du test en ligne du tour 71 (voies/critique-71/RESULTAT.md ; BUGS.md C71-1 à C71-8, C70-4/5/6 en partie).
 * Écrits depuis les RÈGLES (voies/c71-tests/DOSSIER.md) et les maquettes choisies (maquettes2/v01 : liste, afaire, saisie, relecture, vapeur ; règle n° 1) avant tout correctif :
 * celui qui corrige n'écrit pas le test (L17). Aucun réseau, aucun Gemini (AiClient lève s'il est appelé).
 *
 *  - R84 (C71-1, B) : À faire range par la DATE RÉELLE, à plusieurs « maintenant » (début, milieu, fin de mois, décembre → janvier, 2027) : Cette semaine, Fin du mois (jusqu'au dernier jour du mois
 *    courant), Un jour (sans date, ou au-delà du mois : sa date est dite sur la ligne). Jamais un achat de 2027 ni une échéance du 12 décembre (vue le 25 novembre) sous « Fin du mois ».
 *    L'oracle est écrit ici à la main, en dates UTC, sans les helpers du domaine (ils sont ce qu'on teste). Écart de lecture toléré : le jour qui suit dimanche mais tient dans « 7 jours » peut
 *    se ranger dans Cette semaine ou dans Fin du mois (le DOSSIER dit « ≤ 7 jours », le domaine dit « jusqu'au dimanche »).
 *  - R85 : C70-4 (arbre : jamais « Autres » muet, aussi pour Local, Meuble, Papiers), C70-5 (la tâche datée n'est pas rangée sous « Fin du mois » : R84), C71-2 (aucune proposition d'un geste déjà
 *    fait), C71-3 (le « pourquoi » se tire des notes, raison d'écart comprise ; « non » sur l'essayé écarté), C71-5 (titre court), C71-6 (une seule carte « rangé pour toi », pas de bandeau
 *    « Carnet créé » avant OK), C71-7 (picto de la tuile d'option), C71-8 (la quantité choisie partout dans le carnet) : chacun par le composant (jsdom ne mesure aucune boîte).
 *  - R86 : une lecture de lien ne part jamais seule sans geste.
 * Réponses de l'IA : SIMULÉES, à la forme de la vraie réponse (tests/fixtures/c68/rangement-2.json, relevé en ligne le 25.11 ; les lignes inventées sont dites telles).
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS_SUIVI, MAINTENANT_SUIVI, fixtureSuivi } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { retenirOption } from '../../src/domain/carnets/suivi';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { AFaire } from '../../src/ui/carnets/AFaire';
import { questionPourquoi, ficheResolu } from '../../src/ui/carnets/filRegles';
import { pictoDe } from '../../src/ui/carnets/pictos';
import { titreCourt } from '../../src/domain/carnets/titreCourt';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ID_PELLETS, TITRE_PELLETS, pelletsTrois } from '../fixtures/c67b/pellets';
import { fixtureCarnets } from '../../src/domain/carnets/fixture';
import rangement2 from '../fixtures/c68/rangement-2.json';

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

/* =========================================================================================================== R84 */

/* --- l'oracle des dates, en UTC, sans les helpers du domaine --- */
const JOUR_MS = 86400000;
const ms = (iso: string) => Date.parse(`${iso}T00:00:00.000Z`);
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const plus = (j: string, n: number) => iso(ms(j) + n * JOUR_MS);
const lundiDe = (j: string) => { const d = new Date(ms(j)).getUTCDay(); return plus(j, -((d + 6) % 7)); };
const dimancheDe = (j: string) => plus(lundiDe(j), 6);
const finDuMois = (j: string) => { const d = new Date(ms(j)); return iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** La date dite sur la ligne : le mois (ses 3 premières lettres, sans accent) et, si l'année n'est pas celle de « maintenant », l'année. */
const dateDite = (ligne: string, jour: string, maintenant: string): boolean => {
  const t = sans(ligne);
  const mois = sans(MOIS[Number(jour.slice(5, 7)) - 1]).slice(0, 3);
  const moisDit = new RegExp(`\\b${mois}`).test(t);
  const anneeDite = jour.slice(0, 4) === maintenant.slice(0, 4) || t.includes(jour.slice(0, 4));
  return moisDit && anneeDite;
};

type Sorte = 'sans-date' | 'cette-semaine' | 'mi-mois' | 'fin-du-mois' | 'mois-prochain' | 'dans-un-an';
interface Cas { sorte: Sorte; texte: string; echeance: string | null; precision: 'semaine' | 'mois' }
const casPour = (m: string): Cas[] => [
  { sorte: 'sans-date', texte: 'tache-sans-date', echeance: null, precision: 'semaine' },
  { sorte: 'cette-semaine', texte: 'tache-cette-semaine', echeance: lundiDe(m), precision: 'semaine' },
  { sorte: 'mi-mois', texte: 'tache-mi-mois', echeance: lundiDe(plus(m, 14)), precision: 'semaine' },
  { sorte: 'fin-du-mois', texte: 'tache-fin-du-mois', echeance: lundiDe(finDuMois(m)), precision: 'mois' },
  { sorte: 'mois-prochain', texte: 'tache-mois-prochain', echeance: lundiDe(plus(finDuMois(m), 12)), precision: 'semaine' },
  { sorte: 'dans-un-an', texte: 'tache-dans-un-an', echeance: lundiDe(plus(m, 200)), precision: 'semaine' }
];
const carnetDeTaches = (id: string, titre: string, taches: Array<{ id: string; texte: string; echeance: string | null; precision: 'semaine' | 'mois' }>, notes: string[] = []): CarnetDoc => {
  const item = { id, type: 'carnet', title: titre, status: 'idea', carnet: {
    version: 1, creeLe: '2026-11-05T08:00:00.000Z', phrase: titre, criteres: [], facons: [], articles: [], photos: [], genre: { valeur: 'achat', origine: 'ia' }, domaine: { valeur: 'brasserie', origine: 'ia' },
    notes: notes.map((texte, i) => ({ id: `${id}-N${i}`, texte, genre: 'note' })),
    taches: taches.map(t => ({ id: t.id, texte: t.texte, ...(t.echeance ? { echeance: t.echeance, precision: t.precision } : {}), origine: 'locale', creeeLe: '2026-11-05T08:00:00.000Z' }))
  } };
  return lireCarnets([item] as never, { archives: true })[0];
};
/** Rend À faire et lit, par tâche (son texte), le groupe où elle est et la ligne entière. */
function lireAFaire(carnets: CarnetDoc[], maintenant: string) {
  const { container } = render(<AFaire carnets={carnets} maintenant={`${maintenant}T12:00:00.000Z`} messages={[]} onCocher={() => {}} onOuvrir={() => {}} onEcheance={() => {}} />);
  const groupes: Array<{ titre: string; lignes: string[] }> = [...container.querySelectorAll('section.af-groupe')].map(s => ({ titre: lu(s.querySelector('h3')).replace(/\s*\d+\s*$/, ''), lignes: [...s.querySelectorAll('li')].map(li => lu(li)) }));
  const de = (texte: string) => { for (const g of groupes) { const l = g.lignes.find(x => x.includes(texte)); if (l) return { groupe: g.titre, ligne: l }; } return null; };
  return { groupes, de, titres: groupes.map(g => g.titre) };
}

const MAINTENANTS = [
  ['début de mois (lundi 2 nov.)', '2026-11-02'],
  ['milieu de mois (dimanche 15 nov.)', '2026-11-15'],
  ['le jour du test en ligne (mercredi 25 nov.)', '2026-11-25'],
  ['dernier jour du mois (lundi 30 nov.)', '2026-11-30'],
  ['décembre → janvier (mardi 29 déc.)', '2026-12-29'],
  ['fin janvier 2027 (dimanche 31 janv.)', '2027-01-31']
] as const;

describe.each(MAINTENANTS)('R84 · C71-1 (B) : À faire par la date réelle, « maintenant » = %s', (_nom, m) => {
  const cas = casPour(m);
  const carnets = () => [carnetDeTaches('ZZ-C71-AF', 'ZZ TEST — c71 achats datés', cas.map(c => ({ id: `ZZ-${c.sorte}`, texte: c.texte, echeance: c.echeance, precision: c.precision })))];
  const attendu = (c: Cas): string[] => {
    if (!c.echeance) return ['Un jour'];
    if (c.echeance > finDuMois(m)) return ['Un jour'];
    if (c.echeance <= dimancheDe(m)) return ['Cette semaine'];
    return c.echeance <= plus(m, 7) ? ['Cette semaine', 'Fin du mois'] : ['Fin du mois'];
  };
  it('chaque tâche est dans le groupe de sa date (sous « Fin du mois » : jamais après le dernier jour du mois courant)', () => {
    const l = lireAFaire(carnets(), m);
    const ecarts = cas.map(c => ({ c, vu: l.de(c.texte)?.groupe ?? 'introuvable' })).filter(x => !attendu(x.c).includes(x.vu))
      .map(x => `${x.c.sorte} (échéance ${x.c.echeance ?? 'aucune'}) : vue sous « ${x.vu} », attendu ${attendu(x.c).map(a => `« ${a} »`).join(' ou ')}`);
    expect(ecarts, `maintenant ${m}, fin du mois ${finDuMois(m)} ; groupes : ${JSON.stringify(l.groupes)}`).toEqual([]);
  });
  it('aucun quatrième groupe : seulement Cette semaine, Fin du mois, Un jour', () => {
    const l = lireAFaire(carnets(), m);
    expect(l.titres.filter(t => !['Cette semaine', 'Fin du mois', 'Un jour'].includes(t))).toEqual([]);
  });
  it('sous « Un jour », une tâche datée au-delà du mois dit sa date sur la ligne (mois, et année si elle change)', () => {
    const l = lireAFaire(carnets(), m);
    const loin = cas.filter(c => c.echeance && c.echeance > finDuMois(m));
    expect(loin.length, 'le jeu a des tâches au-delà du mois').toBeGreaterThan(0);
    const muettes = loin.map(c => ({ c, v: l.de(c.texte) })).filter(x => !x.v || !dateDite(x.v.ligne, x.c.echeance!, m))
      .map(x => `${x.c.sorte} (${x.c.echeance}) : « ${x.v?.ligne ?? 'introuvable'} »`);
    expect(muettes, `lignes sans leur date, maintenant ${m}`).toEqual([]);
  });
});

describe('R84 · C71-1 (B) : les lignes du test en ligne du 25 novembre 2026', () => {
  const M = '2026-11-25';
  const carnets = () => [
    carnetDeTaches('ZZ-C71-EL', 'ZZ TEST — c71 Installation électrique 27A (2027)', [{ id: 'ZZ-C71-T1', texte: 'Installation électrique 27A (2027)', echeance: '2027-05-03', precision: 'semaine' }]),
    carnetDeTaches('ZZ-C71-EM', 'ZZ TEST — c71 Embouteillage — station complète (2027)', [{ id: 'ZZ-C71-T2', texte: 'Embouteillage — station complète (2027)', echeance: '2027-03-29', precision: 'mois' }]),
    carnetDeTaches('ZZ-C71-EV', 'ZZ TEST — c71 2ème évier (2027)', [{ id: 'ZZ-C71-T3', texte: '2ème évier (2027)', echeance: '2027-01-04', precision: 'semaine' }]),
    carnetDeTaches('ZZ-C71-HO', 'ZZ TEST — c71 hotte', [{ id: 'ZZ-C71-T4', texte: 'appeler le chaudronnier pour poser la hotte avant le 12 décembre', echeance: '2026-12-07', precision: 'semaine' }]),
    carnetDeTaches('ZZ-C71-FR', 'ZZ TEST — c71 Frigo + congel', [], ['À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements)']),
    carnetDeTaches('ZZ-C71-CE', 'ZZ TEST — c71 cette semaine vraie', [{ id: 'ZZ-C71-T5', texte: 'rincer la cuve cette semaine', echeance: '2026-11-23', precision: 'semaine' }]),
    carnetDeTaches('ZZ-C71-FM', 'ZZ TEST — c71 fin novembre vraie', [{ id: 'ZZ-C71-T6', texte: 'commander le CO2 fin novembre', echeance: '2026-11-30', precision: 'mois' }])
  ];
  it.each([
    ['Installation électrique 27A (2027)', 'Un jour'],
    ['Embouteillage — station complète (2027)', 'Un jour'],
    ['2ème évier (2027)', 'Un jour'],
    ['appeler le chaudronnier pour poser la hotte avant le 12 décembre', 'Un jour']
  ])('« %s » (un achat de 2027, ou une échéance du 12 décembre) n\'est jamais sous « Fin du mois » de novembre : « %s »', (texte, groupe) => {
    const l = lireAFaire(carnets(), M);
    expect(l.de(texte)?.groupe, `groupes : ${JSON.stringify(l.groupes)}`).toBe(groupe);
  });
  it('« Frigo + congel » (daté mai 2027) n\'est pas sous « Cette semaine », et dit sa date', () => {
    const l = lireAFaire(carnets(), M);
    const f = l.de('Frigo + congel');
    expect(f, `groupes : ${JSON.stringify(l.groupes)}`).toBeTruthy();
    expect(f!.groupe, `ligne : ${f!.ligne}`).not.toBe('Cette semaine');
    expect(f!.groupe).not.toBe('Fin du mois');
    expect(f!.ligne, 'la date de mai 2027 dite').toMatch(/mai/i);
  });
  it('garde-fou : ce qui est vraiment de cette semaine et de fin novembre reste à sa place', () => {
    const l = lireAFaire(carnets(), M);
    expect(l.de('rincer la cuve cette semaine')?.groupe).toBe('Cette semaine');
    expect(l.de('commander le CO2 fin novembre')?.groupe).toBe('Fin du mois');
  });
});

/* =========================================================================================================== R85 */

describe('R85 · C71-4 (C70-4 en partie, maquette v01-liste) : l\'arbre dit la partie et les noms de chaque groupe replié, pour TOUS les domaines (Local, Meuble, Papiers, Brasserie)', () => {
  const plat = (id: string, titre: string, domaine: string, extra: Record<string, unknown> = {}): Item => ({ id, type: 'carnet', title: titre, status: 'idea',
    carnet: { version: 1, creeLe: '2026-11-05T08:00:00.000Z', phrase: titre, criteres: [], facons: [], articles: [], notes: [], photos: [], genre: { valeur: 'idee', origine: 'ia' }, domaine: { valeur: domaine, origine: 'ia' }, ...extra } }) as unknown as Item;
  /* des carnets de l'atelier sans catégorie posée, comme les 10 « Local », 3 « Meuble », 3 « Papiers » du test en ligne (titres inventés : l'anonymisation du relevé) */
  const items = () => clone([
    plat('ZZ-C71-L1', 'Porte du local de stockage', 'local'), plat('ZZ-C71-L2', 'Prise murale côté cuve', 'local'), plat('ZZ-C71-L3', 'Sol antidérapant devant l\'évier', 'local'),
    plat('ZZ-C71-M1', 'Étagère à fûts', 'meuble'), plat('ZZ-C71-M2', 'Table de travail inox', 'meuble'), plat('ZZ-C71-M3', 'Chariot de manutention', 'meuble'),
    plat('ZZ-C71-P1', 'Contrat d\'assurance', 'papiers'), plat('ZZ-C71-P2', 'Facture du moulin', 'papiers'), plat('ZZ-C71-P3', 'Décompte TVA trimestre', 'papiers'),
    plat('ZZ-C71-B1', 'Pompe de transfert', 'brasserie')
  ]) as Item[];
  const groupes = () => [...document.querySelectorAll('.cnl-domaine')].filter(s => !s.classList.contains('cnl-resolus') && !s.classList.contains('cnl-aranger'))
    .flatMap(s => [...s.querySelectorAll('.cnl-sd')].map(b => ({ domaine: s.getAttribute('data-domaine') ?? '', nom: lu(b.querySelector('b')), texte: lu(b), replie: b.getAttribute('aria-expanded') === 'false' })));
  it('aucun groupe replié ne s\'appelle « Autres » (sans partie), quel que soit le domaine', async () => {
    monter(items());
    await attendre(120);
    const g = groupes();
    expect(g.length, 'des groupes repliés').toBeGreaterThan(0);
    expect(g.filter(x => x.nom === 'Autres').map(x => `${x.domaine} : ${x.texte}`), `groupes : ${JSON.stringify(g)}`).toEqual([]);
  }, 20000);
  it('chaque groupe replié dit le nom d\'au moins un de ses carnets (« Chariot de manutention · Étagère à fûts »), pas seulement un nombre', async () => {
    monter(items());
    await attendre(120);
    const muets = groupes().filter(x => x.replie).filter(x => !/\p{L}{3,}.*\p{L}{3,}/u.test(x.texte.replace(x.nom, '').replace(/\d+/g, '')));
    expect(muets.map(x => `${x.domaine} : « ${x.texte} »`), 'groupes repliés sans le nom d\'aucun de leurs carnets').toEqual([]);
  }, 20000);
});

describe('R85 · C71-2 : aucune proposition d\'un geste déjà fait (« à retenir ? » d\'une option déjà retenue)', () => {
  it('« appeler le chaudronnier pour poser le condenseur avant le 12 décembre », le condenseur étant retenu : la réponse IA (SIMULÉE, forme de ia.ts : option + étiquette « retenu » + tâche) ne produit pas « à retenir ? »', async () => {
    const vapeur = fixtureSuivi().filter(i => i.id === IDS_SUIVI.vapeur) as Item[];
    const phrase = 'Appeler le chaudronnier pour poser le condenseur avant le 12 décembre';
    const m = monter(vapeur, { ouvrir: IDS_SUIVI.vapeur, appels: reponseIA([{ sorte: 'note', texte: phrase, genre: 'note', carnetId: IDS_SUIVI.vapeur, citation: phrase.toLowerCase(), option: 'Condenseur B', etiquette: 'retenu',
      tachePropose: { quand: 'semaine', echeance: '2026-12-07', precision: 'semaine', texte: 'Appeler le chaudronnier pour poser le condenseur' } }]) });
    await attendre(100);
    const retenue = carnetDe(m, IDS_SUIVI.vapeur).carnet.facons.find(f => f.etat === 'retenue' || /retenu/i.test(String(f.etat)));
    expect(retenue, 'le condenseur est déjà retenu dans le carnet de départ').toBeTruthy();
    await taper(phrase);
    const corps = lu(document.body);
    expect(corps, 'la tâche proposée est bien là (le geste a été joué)').toMatch(/tâche proposée/);
    expect(corps, 'la bulle « à retenir ? » d\'une option déjà retenue').not.toMatch(/à retenir \?/);
    expect(corps).not.toMatch(/Retenir Condenseur/i);
  }, 30000);
});

describe('R85 · C71-3 (maquette v01-relecture) : le « pourquoi » se tire de ses notes, raison d\'écart comprise ; « non » sur l\'essayé écarté', () => {
  const RAISON = 'bruyant et il ne sort pas la buée du plafond';
  /** Le carnet du test en ligne : condenseur retenu, ventilateur écarté avec sa raison écrite ; aucun message du fil (le brasseur a posé l'écart par le geste, pas par une phrase). */
  const carnetEcart = (): { item: Item; c: CarnetDoc } => {
    const item = clone(fixtureSuivi().find(i => i.id === IDS_SUIVI.vapeur)!) as unknown as { carnet: { facons: unknown[]; choix?: unknown } };
    item.carnet.facons = [
      { id: 'ZZ-C71-F1', nom: 'Condenseur de buées à eau froide', etat: 'retenue', origine: 'vous' },
      { id: 'ZZ-C71-F2', nom: 'Ventilateur', etat: 'ecartee', raison: RAISON, origine: 'vous' }
    ];
    delete item.carnet.choix;
    return { item: item as unknown as Item, c: lireCarnets([item] as never, { archives: true })[0] };
  };
  it('questionPourquoi : la raison écrite à l\'écart répond déjà « pourquoi » : la question n\'est pas posée', () => {
    const { c } = carnetEcart();
    expect(questionPourquoi(c, []), 'la question « Pourquoi Condenseur… plutôt que Ventilateur… ? Tes notes ne le disent pas »').toBeNull();
  });
  it('à l\'écran (le problème ouvert) : « Tes notes ne le disent pas » ne paraît pas sous une raison d\'écart écrite', async () => {
    const { item } = carnetEcart();
    monter([item], { ouvrir: IDS_SUIVI.vapeur });
    await attendre(120);
    expect(lu(document.body), 'la raison d\'écart est lue').toContain(RAISON);
    expect(lu(document.body)).not.toMatch(/Tes notes ne le disent pas/);
  }, 20000);
  it('le Relire (fiche d\'un résolu) : « pourquoi » reprend la raison d\'écart au lieu de « tes notes ne le disent pas »', () => {
    const { c } = carnetEcart();
    const f = ficheResolu(c, []);
    expect(JSON.stringify(f.pourquoi), 'pourquoi tiré de ses notes (raison d\'écart comprise)').toContain('bruyant');
  });
  it('le Relire : l\'essayé écarté dit « non » (« ventilateur (non) »)', () => {
    const { c } = carnetEcart();
    const f = ficheResolu(c, []);
    expect(f.essaye, `essayé : ${JSON.stringify(f.essaye)}`).toContain('ventilateur (non)');
  });
});

describe('R85 · C71-5 (maquette v01-saisie) : un titre court, jamais la phrase coupée au verbe', () => {
  const PHRASE = 'la condensation de l\'ébullition fait goutter de l\'eau dans le fermenteur ouvert juste à côté';
  const MOTS_OUTILS = /\b(fait|font|est|sont|a|ont|de|du|des|d|la|le|les|l|un|une|et|qui|que|dans|sur|pour|à|au|aux|goutter)$/i;
  it.each([['avec la marque de test', `ZZ TEST — c71 ${PHRASE}`], ['sans marque', PHRASE]])('titreCourt de la phrase du test en ligne (%s) : au plus 40 caractères (la maquette : « Écart réfractomètre et densimètre », 33), une idée finie', (_n, phrase) => {
    const corps = titreCourt(phrase).replace(/^ZZ TEST\s*[—–-]\s*(c71\s+)?/i, '');
    expect(corps.length, `titre : « ${corps} »`).toBeLessThanOrEqual(40);
    expect(corps, `titre : « ${corps} »`).not.toMatch(MOTS_OUTILS);
    expect(sans(corps), `titre : « ${corps} »`).toMatch(/condensation/);
  });
});

describe('R85 · C71-6 (maquette v01-saisie) : avant OK, la seule carte « rangé pour toi » dit le titre ; pas de second titre dans un bandeau « Carnet créé »', () => {
  it('une phrase neuve dans la liste (réponse IA rejouée : tests/fixtures/c68/rangement-2.json, « carnetNeuf ») : la carte est posée, et aucun bandeau « Carnet créé · phrase · titre tiré de votre phrase » ne la double', async () => {
    const r = rangement2 as unknown as { phrase: string; reponse: { result: { ok: boolean; data: unknown } } };
    const appels: AppelsIA = { async ranger() { return { ok: r.reponse.result.ok, data: r.reponse.result.data as never }; }, async lire() { throw new Error('aucun lien dans ces phrases'); } };
    monter([], { appels });
    await attendre(60);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: r.phrase } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(500);
    const carte = document.querySelector('[data-feuille-rangement] .cnl-carte-ia');
    expect(carte, `la carte « rangé pour toi » : ${lu(document.body).slice(0, 400)}`).toBeTruthy();
    const horsCarte = lu(document.body).replace(lu(carte), '');
    expect(horsCarte, 'bandeau haut avant OK').not.toMatch(/titre tiré de votre phrase/);
    expect(horsCarte, 'bandeau haut avant OK').not.toMatch(/Carnet créé/);
  }, 30000);
});

describe('R85 · C71-7 (maquette v01-vapeur) : la tuile d\'une piste « condenseur de buées à eau froide » n\'a pas le picto du frigo', () => {
  it('pictoDe : « eau froide » ne fait pas un frigo (ni « Condenseur de buées à eau froide », ni « condenseur à eau froide »)', () => {
    expect(pictoDe('Condenseur de buées à eau froide')).not.toBe('frigo');
    expect(pictoDe('condenseur à eau froide')).not.toBe('frigo');
  });
  it('garde-fou : une chambre froide, un frigo, une vitrine réfrigérée gardent le picto du frigo', () => {
    for (const nom of ['Chambre froide', 'Frigo + congel', 'Vitrine réfrigérée']) expect(pictoDe(nom), nom).toBe('frigo');
  });
  it('à l\'écran : la tuile de l\'option « Condenseur de buées à eau froide » porte un picto qui n\'est pas le frigo', async () => {
    const item = clone(fixtureSuivi().find(i => i.id === IDS_SUIVI.vapeur)!) as unknown as { carnet: { facons: unknown[]; choix?: unknown } };
    item.carnet.facons = [
      { id: 'ZZ-C71-F1', nom: 'Condenseur de buées à eau froide', etat: 'piste', origine: 'vous' },
      { id: 'ZZ-C71-F2', nom: 'Ventilateur', etat: 'piste', origine: 'vous' }
    ];
    monter([item as unknown as Item], { ouvrir: IDS_SUIVI.vapeur });
    await attendre(120);
    const tuile = [...document.querySelectorAll('.cnp-opt-vignette')].map(v => ({ picto: v.getAttribute('data-picto'), texte: lu(v.parentElement) })).find(x => /Condenseur de buées/i.test(x.texte));
    expect(tuile, `tuiles : ${JSON.stringify([...document.querySelectorAll('.cnp-opt-vignette')].map(v => [v.getAttribute('data-picto'), lu(v.parentElement).slice(0, 60)]))}`).toBeTruthy();
    expect(tuile!.picto, 'picto de la tuile').not.toBe('frigo');
  }, 20000);
});


describe('R85 · C71-8 : un carnet « Choisi » pour 1 kg dit la quantité choisie (1 kg, ≈40 CHF) sur la carte de l\'article, jamais « 50 g · ≈4 CHF »', () => {
  /** Le carnet du test en ligne après « Choisir · MotlerHops, 1 kg » : status « validated », choix portant `quantite` 1 kg et le prix du kilo (R54) ; un seul article resté (l'autre retiré, L2 du test en ligne) : sa carte est listée dans « Articles 1 », sans tableau. */
  const choisiUnKilo = (): Item[] => {
    const c = pelletsTrois();
    const doc = { ...c, status: 'validated', carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'M1'),
      choix: { articleId: 'M1', pourquoi: 'En stock, MotlerHops (FR).', ecartes: [], le: '2026-11-25T09:00:00.000Z', quantite: { kg: 1, libelle: '1 kg' }, prixCentimes: 4000, remplaces: [] } } };
    return [doc as never, ...fixtureCarnets().filter(i => i.id !== ID_PELLETS)] as Item[];
  };
  const cartes = () => [...document.querySelectorAll('.cn-article')].map(a => lu(a)).filter(t => /citra/i.test(t));
  it('la carte de l\'article choisi (Citra), dans la rubrique « Articles » du carnet ouvert', async () => {
    poserQuantitePour(TITRE_PELLETS, 1);
    monter(choisiUnKilo(), { ouvrir: ID_PELLETS });
    await attendre(120);
    expect(lu(document.body), 'le carnet dit « Choisi : … »').toMatch(/Choisi : /);
    const t = cartes();
    expect(t.length, `cartes de l'article : ${JSON.stringify(t)} ; page : ${lu(document.body).slice(0, 900)}`).toBeGreaterThan(0);
    for (const x of t) {
      expect(x, `carte : « ${x} »`).not.toMatch(/\b50 g\b/);
      expect(x, `carte : « ${x} »`).not.toMatch(/≈\s?4\s?CHF/);
      expect(x, `carte : « ${x} »`).toMatch(/1 kg/);
      expect(x, `carte : « ${x} »`).toMatch(/≈?\s?(3[5-9]|4[0-5])(?:[.,]\d+)?\s?CHF/);
    }
  }, 30000);
});

/* =========================================================================================================== R86 */

/* R86 : critique-71 (voies/critique-71/RESULTAT.md) NE relève PAS « une lecture de lien part seule » parmi ses 8 problèmes : il note seulement, en LEÇON PROPOSÉE, que coller deux liens a coûté
   3 appels aiTask. Ces 3 appels sont 2 lectures (une par lien, `appels.lire`) et 1 reprise de suivi du jeton, dans `appelsReels.lire` (un seul appel de plus, sur le 1er lien, voulu) : pas un défaut
   du DOSSIER, donc pas de test ROUGE. Deux gardes VERTS seulement, pour que la règle (« une lecture de lien ne part jamais seule sans geste ») tienne après les correctifs de R84/R85. */
describe('R86 (garde, déjà juste) : une lecture de lien ne part jamais seule ; un lien par lecture', () => {
  const PHRASE = 'ZZ TEST — c71 deux houblons https://exemple.invalid/citra-a et https://exemple.invalid/citra-b';
  it('taper ou coller deux liens SANS Entrée ne lance aucune lecture', async () => {
    const lus: string[] = [];
    const appels: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire(url) { lus.push(url); throw new Error('lecture interdite sans geste'); } };
    monter([], { appels });
    await attendre(60);
    fireEvent.change(document.querySelector('.cn-champ textarea') as HTMLTextAreaElement, { target: { value: PHRASE } });
    await attendre(800);
    expect(lus, 'lectures lancées sans geste').toEqual([]);
  }, 20000);
  it('Entrée avec deux liens : une lecture par lien, pas davantage', async () => {
    const lus: string[] = [];
    const appels: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire(url) { lus.push(url); return { url, domaine: 'exemple.invalid', statut: 'indisponible', luLe: Date.now() } as never; } };
    monter([], { appels });
    await attendre(60);
    await taper(PHRASE);
    expect(lus.length, `les liens sont bien lus par le geste : ${JSON.stringify(lus)}`).toBeGreaterThan(0);
    expect(lus.length, `lectures : ${JSON.stringify(lus)}`).toBeLessThanOrEqual(2);
    expect(new Set(lus).size, 'jamais deux fois le même lien').toBe(lus.length);
  }, 30000);
});
