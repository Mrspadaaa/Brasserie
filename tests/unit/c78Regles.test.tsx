// @vitest-environment jsdom
/**
 * Voie c78-tests (25.11) : les tests ROUGES des règles R107 à R109, écrits AVANT tout correctif (celui qui corrige n'écrit pas le test, L17).
 * Source : work/missions/2026-11-23-reprise-soir/voies/reel-78/RESULTAT.md (22 lignes rouvertes sur 29 alors que les tests de c77 étaient verts).
 *
 * POURQUOI LES TESTS DE c77 ÉTAIENT VERTS ALORS QUE L'ÉCRAN ÉTAIT FAUX (faux verts, leçon L28 : « une vraie pièce, champ par champ ») :
 *  1. Le carnet « Chambre froide » de c77 était CONSTRUIT : noms « Cellule froide 1800 x 1500 mm… » (le vrai nom de la page du vendeur est « 1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus »),
 *     un vendeur « Gastro Held » (le vrai n'a que son domaine, ggmgastro.com). Le nom court coupait donc sur « Cellule froide », jamais sur « 1500 x » ; le bouton Choisir de Comparer
 *     était nommé par ce vendeur inventé. Ici : tests/fixtures/c78/chambre-froide-releve.json, refait avec les noms, valeurs et prix lus en ligne (reel-78, captures C02-*).
 *  2. Des règles testées sur une chaîne exacte (« 2 697,74 » ≤ 2 fois) alors que l'écran dit le même prix sous une autre forme (« 2 698 » de la réglette) : ici le prix se compte sous toutes ses formes.
 *  3. Le test de « chasse fixe » tolérait chiffre + unité (« 2,6 m³ », « 230 V », « 2 697,74 CHF ») : c'est justement ce que le brasseur a vu en chasse fixe espacée.
 *  4. Les lignes de MISE EN PAGE (R73-8, R73-14, R73-18 en pixels, R77-6 coupé, R78-5 puces coupées) ne se mesurent pas dans jsdom : ici elles se prouvent par ce que le composant pose
 *     (élément insécable posé, règle CSS de coupe, appel de défilement), jamais par « c'est vert donc c'est bon ». Le rendu à 390 px reste à voir en ligne.
 *
 * Données : les VRAIS documents (tests/fixtures/c75/*.json, tels quels) ; c78/chambre-froide-releve.json (forme du c75, valeurs lues en ligne) ; les carnets datés ou à liens sont
 * construits à la forme exacte de embouteillage-planning.json (marqués simulés dans le test). Par le composant monté (CarnetsVue), un geste réel. Aucun réseau, aucun Gemini.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { nomAuTableau, poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: true, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

/** Les appels de défilement : sur quel élément, avec quelles options. */
const defilements: Array<{ el: Element; opts: unknown }> = [];
beforeEach(() => {
  defilements.length = 0;
  Element.prototype.scrollIntoView = function (this: Element, o?: unknown) { defilements.push({ el: this, opts: o }); } as never;
  localStorage.clear(); sessionStorage.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof magasinMemoire>[0][number];
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const mots = (e: Element | null | undefined) => sans(lu(e));
const horsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

interface Releve { carnet: Item & { id: string; title: string; carnet: Record<string, unknown> & { articles: Array<Record<string, unknown> & { nom?: string }> } }; messages: Item[]; articles?: unknown[]; plan: FinancialPlan | null }
const releve = (dossier: 'c75' | 'c78', nom: string): Releve => JSON.parse(readFileSync(`tests/fixtures/${dossier}/${nom}.json`, 'utf8')) as Releve;
const citra = () => releve('c75', 'houblons-citra');
const embouteillage = () => releve('c75', 'embouteillage-planning');
const chambre = () => releve('c78', 'chambre-froide-releve');
const zzMalt = () => releve('c75', 'zz-malt-pilsner');
const zzPompe = () => releve('c75', 'zz-pompe');

interface Montage { anciens?: unknown[]; ouvrir?: boolean; ecrire?: (p: FinancialPlan) => void; auj?: string; sansPoser?: boolean; plus?: Releve[]; items?: unknown[] }
function monter(d: Releve, o: Montage = {}) {
  if (!o.sansPoser) poserQuantitePour(d.carnet.title, 1);
  const tous = [d, ...(o.plus ?? [])];
  const magasin = magasinMemoire([...tous.flatMap(x => [x.carnet, ...x.messages]), ...((o.items ?? []) as Item[])] as never[]);
  const plans = tous.flatMap(x => (x.plan ? [x.plan] : []));
  const instant = () => new Date(o.auj ? `${o.auj}T12:00:00.000Z` : MAINTENANT_SUIVI);
  return render(
    <CarnetsVue magasin={magasin} finances={{ plans, transactions: [], payments: [] } as never} mode={'simule' as never} appels={horsLigne} aides={aidesCarnet('simule' as never, {})}
      maintenant={instant} ecrirePlan={((p: FinancialPlan) => o.ecrire?.(p)) as never} {...(o.anciens ? { anciens: o.anciens as never } : {})} {...(o.ouvrir === false ? {} : { ouvrir: { id: d.carnet.id, at: 1 } })} />
  );
}
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const rangs = () => [...document.querySelectorAll('button.cn-tab-ligne')] as HTMLElement[];
const ligneDe = (re: RegExp) => rangs().find(l => re.test(sans(lu(l))))!;
const MOTLER = /motler/;
const BRAU = /citra 13/;
const GRANDE = /1500 x/; // l'article « 1500 x 1200 mm - 2,6 m³ … » de Chambre froide, tel qu'il est au tableau
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
function ligneComparer(re: RegExp): { entete: string; cellules: HTMLElement[] } | null {
  for (const tr of document.querySelectorAll('table.cn-tableau-comparer tbody tr')) {
    const th = tr.querySelector('th[scope="row"]');
    if (th && re.test(sans(lu(th)))) return { entete: lu(th), cellules: [...tr.querySelectorAll('td')] as HTMLElement[] };
  }
  return null;
}
const entetesComparer = () => [...document.querySelectorAll('table.cn-tableau-comparer tbody tr th[scope="row"]')].map(t => lu(t));
const quandDuCarnet = () => [...document.querySelectorAll('button')].find(b => /^quand\b/.test(sans(lu(b)))) as HTMLElement | undefined;
const ouvrirQuand = async () => { const q = quandDuCarnet(); expect(q, 'le bouton Quand du carnet').toBeTruthy(); fireEvent.click(q!); await attendre(80); return document.querySelector('.cn-quand') as HTMLElement; };

/** Les éléments en chasse fixe (.cn-mono) dont le texte n'est pas fait de chiffres : une lettre (unité comprise : « m³ », « V », « CHF », « offre ↓ »). */
const monoAvecLettres = (racine: ParentNode = document) =>
  [...racine.querySelectorAll('.cn-mono')].map(e => lu(e)).filter(t => /[a-zà-ÿ]/i.test(t));

/** Les documents du carnet daté ou à liens : la FORME exacte de embouteillage-planning.json (simulé : dates et liens changés). */
const JOUR_MS = 86_400_000;
const ms = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const lundi = (j: string) => iso(ms(j) - ((new Date(ms(j)).getUTCDay() + 6) % 7) * JOUR_MS);
const fr = (j: string) => `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`;
function planningDu(du: string, au: string, titre: string): Releve {
  const o = JSON.parse(JSON.stringify(embouteillage()).split('Embouteillage — station complète (2027)').join(titre)) as Releve;
  const txt = JSON.stringify(o).split('01.05.2027').join(fr(du)).split('01.07.2027').join(fr(au));
  const r = JSON.parse(txt) as Releve;
  const plan = r.plan as unknown as Record<string, unknown> & { upgrade: Record<string, unknown> };
  plan.date = au; plan.fenetre = { du: lundi(du), au: iso(ms(lundi(au)) + 6 * JOUR_MS) };
  plan.upgrade = { ...plan.upgrade, datePrecision: 'day' };
  (r.carnet as unknown as Record<string, unknown>).date = lundi(du);
  return r;
}
function carnetDate(date: string, titre: string): Releve {
  const o = JSON.parse(JSON.stringify(embouteillage()).split('Embouteillage — station complète (2027)').join(titre)) as Releve;
  const carnet = o.carnet.carnet as Record<string, unknown>;
  o.plan = null;
  delete carnet.sortie;
  carnet.notes = []; carnet.criteres = [];
  carnet.domaine = { valeur: 'local', origine: 'vous' };
  carnet.categorie = { chemin: ['Bâtiment'], origine: 'vous' };
  o.messages = [];
  carnet.taches = [{ id: 'TACHE-c78-91', texte: titre, echeance: lundi(date), precision: 'semaine', creeeLe: '2026-09-03T11:40:33.460190Z', origine: 'locale' }];
  (o.carnet as unknown as Record<string, unknown>).date = date;
  (o.carnet as unknown as Record<string, unknown>).precision = 'semaine';
  return o;
}
/** Un carnet de liens collés, jamais lus (Frigo + congel, Armoire de rangement malte) : SIMULÉ, d'après reel-78 (« galaxus.ch », « digitec.ch », « brack.ch » ×2 collés le 23.11, ni Articles ni Comparer). */
function carnetLiens(titre: string, liens: string[]): Releve {
  const o = JSON.parse(JSON.stringify(chambre())) as Releve;
  o.carnet.title = titre; o.carnet.id = 'CARNET-c78-liens';
  (o.carnet.carnet as Record<string, unknown>).phrase = titre;
  o.carnet.carnet.articles = [];
  o.messages = liens.map((u, i) => ({ type: 'carnet-message', id: `MSG-c78-L${i}`, status: 'done', title: u,
    carnetMessage: { texte: u, le: `2026-11-23T10:0${i}:00.000Z`, depuis: 'liste', rangement: 'ia', effets: [{ carnetId: 'CARNET-c78-liens', cible: 'carnet', id: 'CARNET-c78-liens' }] } }) as never);
  return o;
}

/* ======================================================================================================== R107 : le nom court d'un article garde son nom lisible */

/**
 * R107 (R78-1, B, régression du tour 78) : au tableau de Chambre froide, les deux articles s'appellent « 1500 x » et « 1800 x » (nomAuTableau coupe à la première dimension de
 * « 1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus »). RÈGLE du nom court : retirer le bruit (dimensions, puissance, options), GARDER LA DÉSIGNATION ; jamais un fragment
 * qui finit par « x », « × », un tiret ou un nombre ; jamais plus de 40 signes ; deux articles différents ne portent pas le même nom court quand leurs noms entiers diffèrent.
 */
const NOMS_REELS: string[] = (() => {
  const noms: string[] = [];
  for (const d of [citra(), chambre(), embouteillage(), zzMalt(), zzPompe()]) for (const a of d.carnet.carnet.articles ?? []) if (a.nom) noms.push(a.nom);
  /* ses noms lus en ligne (reel-78 / tous-sortie.json C02, tour 78), tels que la page du vendeur les écrit */
  noms.push('1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus', '1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus');
  return [...new Set(noms)];
})();
const MOTS_UNITE = /^(?:mm|cm|dm|m|l|kw|w|watt|kg|g|m²|m³|x|×|chf|eur|inclus)$/i;
const mots4 = (t: string) => t.split(/[^A-Za-zÀ-ÿ®]+/).filter(m => m.length >= 4 && !MOTS_UNITE.test(m));

describe('R107 · nom court au tableau : la désignation reste lisible (jamais « 1500 x »)', () => {
  it.each(NOMS_REELS)('la fonction : « %s » garde un nom lisible', nom => {
    const court = nomAuTableau(nom);
    expect(court.length, `nom court : « ${court} » (${court.length} signes)`).toBeLessThanOrEqual(40);
    expect(court, `nom court : « ${court} » : un fragment terminé par « x », « × » ou un tiret`).not.toMatch(/(?:^|[\s\d])[x×*]\s*$|[-–—]\s*$/i);
    expect(court, `nom court : « ${court} » : un nombre ou une dimension seule`).not.toMatch(/^[\d\s.,x×*]+(?:mm|cm|m)?\s*$/i);
    expect(mots4(court).length, `nom court : « ${court} » : aucun mot de la désignation (nom entier « ${nom} »)`).toBeGreaterThan(0);
  });
  it('par le tableau monté de Chambre froide (vrais noms) : la ligne dit ce qu\'est l\'article', () => {
    monter(chambre());
    const noms = rangs().map(l => lu(l.querySelector('.cn-tab-nom .cn-nom-entier')));
    expect(noms.length, `tableau : ${rangs().map(lu).join(' | ')}`).toBe(2);
    for (const n of noms) {
      expect(n, `nom au tableau : « ${n} »`).not.toMatch(/(?:^|[\s\d])[x×*]\s*$/i);
      expect(mots4(n).length, `nom au tableau : « ${n} » : aucun mot de la désignation`).toBeGreaterThan(0);
    }
  });
  it('par le tableau monté : deux articles de noms entiers différents ne portent pas le même nom court', () => {
    monter(chambre());
    const noms = rangs().map(l => lu(l.querySelector('.cn-tab-nom .cn-nom-entier')));
    expect(new Set(noms).size, `tableau : « ${noms.join(' » et « ')} »`).toBe(noms.length);
  });
  it('par le tableau monté de Houblons citra : ses noms courts sont ceux de la page (aucune régression)', () => {
    monter(citra());
    const noms = rangs().map(l => lu(l.querySelector('.cn-tab-nom .cn-nom-entier')));
    expect(noms).toEqual(['CITRA® (US)', 'Citra 13.6%']);
  });
});

/* ======================================================================================================== R108 : les lignes R73/R75/R77 rouvertes par reel-78 */

describe('R108 · Chambre froide (vrai nom, vrai prix) : fiche, Choisir, Comparer', () => {
  it('R73-13 : le bouton « Choisir » de Comparer dit quel article (vert comme celui de la fiche, nommé par le vendeur, son domaine ou l\'article), aussi sans vendeur inscrit', async () => {
    monter(chambre()); await attendre(150); await ouvrirComparer();
    const b = bouton(/^choisir/)!;
    expect(b, 'bouton Choisir de Comparer').toBeTruthy();
    expect(b.className, `classes : « ${b.className} »`).toMatch(/cn-action-vert/);
    expect(sans(lu(b)), `bouton : « ${lu(b)} » : sans nom (ni ggmgastro, ni l'article)`).toMatch(/ggmgastro|2,6|1500|frigorifique|cellule/);
  });
  it('R73-9 : au Choisir de la 1re, le prix (2 697,74) se dit au plus deux fois, TOUTES formes comprises (2 697,74, 2 698, 2697)', async () => {
    monter(chambre()); await attendre(150);
    await ouvrirFiche(GRANDE);
    const ecran = await ouvrirChoisir();
    const t = mots(ecran);
    const formes = t.match(/2[ ']?69[78](?:,74)?/g) ?? [];
    expect(formes.length, `le prix dit ${formes.length} fois (${formes.join(' | ')}) : « ${t.slice(0, 900)} »`).toBeLessThanOrEqual(2);
  });
  it('R73-10 : au Choisir, le prix et sa devise sont dans UN élément insécable (« 2 697,74 CHF » ne passe pas à la ligne en gros)', async () => {
    monter(chambre()); await attendre(150);
    await ouvrirFiche(GRANDE);
    const ecran = await ouvrirChoisir();
    const gros = ecran.querySelector('.cn-prix-grand');
    expect(gros, 'le prix en gros du Choisir').toBeTruthy();
    const insecable = gros!.closest('.cn-nowrap') ?? (gros!.querySelector('.cn-nowrap') as Element | null) ?? ((gros as HTMLElement).style.whiteSpace === 'nowrap' ? gros : null);
    expect(insecable, `le prix en gros « ${lu(gros)} » n'est dans aucun élément insécable (.cn-nowrap) ; classes : ${(gros as HTMLElement).className}`).toBeTruthy();
    expect(lu(insecable), `l'élément insécable dit « ${lu(insecable)} »`).toMatch(/2[\s  ]697,74[\s  ]CHF/);
  });
  it('R73-10 : au Choisir, la carte de l\'autre article met son nom court (40 signes au plus), pas son nom entier sur 6 lignes', async () => {
    monter(chambre()); await attendre(150);
    await ouvrirFiche(GRANDE);
    const ecran = await ouvrirChoisir();
    const carte = ecran.querySelector('.cn-article');
    expect(carte, 'la carte de l\'autre article sous Choisir').toBeTruthy();
    const nom = lu(carte!.querySelector('.cn-article-nom, .cn-nom, b') ?? carte);
    const dit = mots4(lu(carte)).length > 0 && /1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus/.test(lu(carte));
    expect(dit, `la carte de l'autre article dit le nom ENTIER (68 signes) : « ${lu(carte)} » (nom : « ${nom} »)`).toBe(false);
  });
  it('R75-6 : au Choisir de la 1re, la chasse fixe ne porte que des chiffres : « 2,6 m³ », « 230 V », « 2 697,74 CHF » sont en police normale', async () => {
    monter(chambre()); await attendre(150);
    await ouvrirFiche(GRANDE);
    const ecran = await ouvrirChoisir();
    expect(monoAvecLettres(ecran), 'textes avec lettres (unité, mot) en chasse fixe (.cn-mono) au Choisir').toEqual([]);
  });
  it('R73-12 : un seul classement : le rang d\'un article est le même au tableau et dans « Prix au m³ · moins = mieux » (ou le second est sans rang)', () => {
    monter(chambre());
    const tableau = new Map<string, string>();
    for (const l of rangs()) { const v = lu(l).match(/(\d+(?:,\d+)?)\s*m³/); if (v) tableau.set(`${v[1]} m³`, lu(l.querySelector('.cn-rang'))); }
    const barres = [...document.querySelectorAll('.cn-barre, .cn-barres .cn-barre')].map(b => ({ nom: lu(b.querySelector('.cn-barre-nom')), rang: lu(b.querySelector('.cn-rang')) }));
    expect(barres.length, `le bloc « Prix au m³ » : ${lu(document.querySelector('.cn-bloc'))}`).toBeGreaterThan(0);
    const contraires = barres.filter(b => b.rang && tableau.has(b.nom) && tableau.get(b.nom) !== b.rang).map(b => `${b.nom} : rang ${tableau.get(b.nom)} au tableau, ${b.rang} dans les barres`);
    expect(contraires, 'deux « 1 » contraires sur le même écran').toEqual([]);
  });
  it('R75-3 : au tableau, le nom de l\'article tient sur deux lignes et dit la désignation (jamais « 1500 x »)', () => {
    monter(chambre());
    const noms = rangs().map(l => lu(l.querySelector('.cn-tab-nom .cn-nom-entier')));
    for (const n of noms) {
      expect(n.length, `nom au tableau : « ${n} »`).toBeLessThanOrEqual(40);
      expect(n, `nom au tableau : « ${n} »`).not.toMatch(/(?:^|[\s\d])[x×*]\s*$/i);
    }
  });
  it('R77-6 : sur la liste filtrée « je cherche », le prix « 2 697,74 CHF » est dans son propre élément (la coupe de fin de ligne ne le tronque pas)', async () => {
    monter(chambre(), { ouvrir: false }); await attendre(150);
    fireEvent.click(document.querySelector('.cnl-case[data-etat="cherche"]')!);
    await attendre(60);
    const ligne = document.querySelector('.cnl-pas:not(:empty)') as HTMLElement | null;
    const cible = [...document.querySelectorAll('.cnl-corps *')].filter(e => /2[\s  ]697,74/.test(e.textContent ?? '')).pop();
    expect(cible, 'un élément qui porte le prix').toBeTruthy();
    expect(lu(cible), `l'élément le plus petit qui porte le prix dit « ${lu(cible)} » (la ligne : « ${lu(ligne)} ») : le prix est noyé dans la phrase, la coupe « … » le tronque`).toMatch(/^2[\s  ]697,74(?:[\s  ]CHF)?$/);
    expect(cible!.className, `élément du prix : « ${(cible as HTMLElement).className} »`).toMatch(/nowrap|prix/);
  });
});

describe('R108 · Houblons citra (le vrai document) : fiche MotlerHops, Comparer', () => {
  it('R75-6 : sur la fiche MotlerHops, la chasse fixe ne porte que des chiffres : « offre ↓ », « ≈3,69 CHF » ne sont pas en chasse fixe', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(MOTLER);
    expect(monoAvecLettres(), 'textes avec lettres en chasse fixe sur la fiche').toEqual([]);
  });
  it('R75-6 : la phrase « Part dans À venir : … » (prose) ne porte aucun chiffre en chasse fixe', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(MOTLER);
    const p = [...document.querySelectorAll('p, div, span')].filter(e => /^part dans a venir/.test(mots(e)) && e.querySelectorAll('p, div').length === 0).pop();
    expect(p, 'la phrase « Part dans À venir »').toBeTruthy();
    expect(monoAvecLettres(p!).concat([...p!.querySelectorAll('.cn-mono')].map(e => lu(e))), 'chasse fixe dans la phrase').toEqual([]);
  });
  it('R75-6 : dans Comparer, la chasse fixe ne porte que des chiffres : « vendu par 50 g », « 50 g », « CHF », « ≈3,69 CHF » en police normale', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    expect(monoAvecLettres(), 'textes avec lettres en chasse fixe dans Comparer').toEqual([]);
  });
  it('R75-6 : la liste ouverte des anciennes notes ne met pas leur date en chasse fixe (« note · 20.11.2026 »)', async () => {
    const note = { id: 'CR-1763000000000', type: 'note', title: 'Ventilation', date: '20.11.2026' };
    monter(citra(), { ouvrir: false, anciens: [note] }); await attendre(150);
    const tete = document.querySelector('.cn-anciennes-tete') as HTMLElement | null;
    expect(tete, 'le bloc « Anciennes notes de l\'Atelier » de la liste').toBeTruthy();
    fireEvent.click(tete!); await attendre(40);
    const mono = [...document.querySelectorAll('.cn-anciennes-ligne .cn-mono')].map(e => lu(e));
    expect(mono, 'dates en chasse fixe dans les lignes des anciennes notes').toEqual([]);
  });
  it('R73-31 : « Anciennes notes de l\'Atelier » ne se lit pas sous À faire', async () => {
    const note = { id: 'CR-1763000000000', type: 'note', title: 'Ventilation', date: '20.11.2026' };
    monter(citra(), { ouvrir: false, anciens: [note] }); await attendre(150);
    expect(document.querySelector('.cn-anciennes'), 'au repos (Arbre), elles sont là : l\'endroit juste').toBeTruthy();
    const tab = bouton(/^a faire/)!;
    expect(tab, 'l\'onglet À faire').toBeTruthy();
    fireEvent.click(tab); await attendre(80);
    expect(document.querySelector('.cn-anciennes'), `À faire : « ${lu(document.querySelector('.cnl-corps') ?? document.body).slice(0, 300)} »`).toBeNull();
  });
  it('R73-31 : « Anciennes notes de l\'Atelier » ne se lit pas sous la cloche (veilles)', async () => {
    const note = { id: 'CR-1763000000000', type: 'note', title: 'Ventilation', date: '20.11.2026' };
    monter(citra(), { ouvrir: false, anciens: [note] }); await attendre(150);
    const tab = bouton(/veilles/)!;
    expect(tab, 'l\'onglet des veilles (cloche)').toBeTruthy();
    fireEvent.click(tab); await attendre(80);
    expect(document.querySelector('.cn-anciennes'), 'sous la cloche').toBeNull();
  });
  it('R77-7 : le nom du vendeur est le même au tableau, sur la fiche (titre du bouton), sur la carte sous le Choisir de l\'autre article et dans Comparer', async () => {
    monter(citra()); await attendre(150);
    const tableau = lu(ligneDe(BRAU).querySelector('.cn-tab-nom .cn-mut')).replace(/\s*·.*$/, '');
    await ouvrirFiche(BRAU);
    const fiche = mots(document.body);
    const ecran = await ouvrirChoisir();
    const bout = lu(bouton(/^choisir chez/, ecran) ?? bouton(/^choisir/, ecran));
    cleanup();
    monter(citra()); await attendre(150); await ouvrirFiche(MOTLER);
    const ecran2 = await ouvrirChoisir();
    const carteAutre = lu(ecran2.querySelector('.cn-article'));
    cleanup();
    monter(citra()); await attendre(150); await ouvrirComparer();
    const entete = lu(document.querySelectorAll('.cn-col-tete')[1]);
    const dits = { fiche: mots(document.body) && fiche, bouton: sans(bout), carte: sans(carteAutre), comparer: sans(entete) };
    const long = sans('Brau- und Rauchshop');
    const court = sans(tableau);
    const tous = Object.entries(dits).map(([k, v]) => [k, v.includes(long) ? 'long' : v.includes(court) ? 'court' : '?'] as const);
    const formes = new Set(tous.map(([, f]) => f));
    expect(formes.size, `tableau : « ${tableau} » ; ${tous.map(([k, f]) => `${k} : ${f}`).join(' ; ')} (bouton « ${bout} », carte « ${carteAutre} », Comparer « ${entete} »)`).toBe(1);
  });
});

describe('R108 · Quand, carnets longs, ouverture', () => {
  it('R73-15 : Houblons citra : toucher Quand AMÈNE la feuille ouverte à l\'écran (défilement vers elle)', async () => {
    monter(citra()); await attendre(150);
    defilements.length = 0;
    const feuille = await ouvrirQuand();
    expect(feuille, 'la feuille Quand ouverte').toBeTruthy();
    const vers = defilements.filter(d => feuille.contains(d.el) || d.el.contains(feuille) && d.el !== document.body);
    expect(vers.length, `appels de défilement : ${defilements.map(d => (d.el as HTMLElement).className || d.el.tagName).join(' ; ') || 'aucun'} ; la feuille Quand n'est pas amenée`).toBeGreaterThan(0);
  });
  it('R73-15 : Chambre froide (le plus long) : idem', async () => {
    monter(chambre()); await attendre(150);
    defilements.length = 0;
    const feuille = await ouvrirQuand();
    const vers = defilements.filter(d => feuille.contains(d.el));
    expect(vers.length, `appels de défilement : ${defilements.map(d => (d.el as HTMLElement).className || d.el.tagName).join(' ; ') || 'aucun'}`).toBeGreaterThan(0);
  });
  it('R73-18 : Chambre froide s\'ouvre en haut : titre et tableau amenés à l\'écran, jamais le bas du fil', async () => {
    const windowScrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    monter(chambre()); await attendre(200);
    const bas = defilements.filter(d => d.el.closest('.cn-notes, .cnp-fil, .cnp-b, [data-message]') && !d.el.closest('.cn-tab-ligne'));
    const haut = defilements.filter(d => /start/.test(JSON.stringify(d.opts ?? {})) && d.el.closest('.cn-carnet, .cn-ouvert, main, section') && !d.el.closest('.cn-notes, .cnp-b'));
    const enHaut = windowScrollTo.mock.calls.some(c => (typeof c[0] === 'object' ? (c[0] as ScrollToOptions).top === 0 : c[1] === 0));
    expect(bas.map(d => (d.el as HTMLElement).className), 'défilement vers le bas du fil à l\'ouverture').toEqual([]);
    expect(haut.length > 0 || enHaut, `à l'ouverture, rien n'amène le titre en haut : défilements ${defilements.map(d => `${(d.el as HTMLElement).className || d.el.tagName}:${JSON.stringify(d.opts)}`).join(' ; ') || 'aucun'}`).toBe(true);
    windowScrollTo.mockRestore();
  });
  it('R73-17 + R75-7 : les liens collés jamais lus (Frigo, armoire) disent « non lu » avec Relire, ou le produit : pas seulement « galaxus.ch »', async () => {
    const d = carnetLiens('Frigo + congel', ['https://www.galaxus.ch/fr/s1/product/frigo-1', 'https://www.digitec.ch/fr/s1/product/frigo-2', 'https://www.brack.ch/frigo-3', 'https://www.brack.ch/frigo-4']);
    monter(d, { sansPoser: true }); await attendre(200);
    const texte = lu(document.body);
    const domaines = [...texte.matchAll(/(galaxus|digitec|brack)\.ch/g)].length;
    expect(domaines, `fil : « ${texte.slice(0, 500)} »`).toBeGreaterThan(0);
    const dit = /non lu|à relire|a relire|relire|pas lu/i.test(texte) || /frigo-1|frigo 1|frigo/i.test(texte.replace(/frigo \+ congel/gi, ''));
    expect(dit, `ses liens ne disent que leur domaine : « ${texte.slice(0, 500)} » (ni « non lu · Relire », ni le produit)`).toBe(true);
  });
  it('R73-23 : Embouteillage (vrai document) : le fil ne redit ni le titre, ni le budget, ni les dates que la tête et Quand disent déjà', async () => {
    monter(embouteillage()); await attendre(150);
    const bulles = [...document.querySelectorAll('.cnp-b')].map(b => lu(b));
    expect(bulles.length, 'le fil a au moins une bulle').toBeGreaterThan(0);
    const quand = lu(quandDuCarnet());
    for (const b of bulles) {
      expect(b, `bulle : « ${b} » (Quand dit : « ${quand} »)`).not.toMatch(/Embouteillage — station/);
      expect(b, `bulle : « ${b} » redit le budget (déjà en tête)`).not.toMatch(/Budget du Planning/);
      expect(b, `bulle : « ${b} » redit les dates que Quand dit déjà (« ${quand} »)`).not.toMatch(/\d{2}\.\d{2}\.\d{4} au \d{2}\.\d{2}\.\d{4}/);
    }
  });
  it('R75-8 : Embouteillage : la date de Quand (1 mai 2027) et la date de la réglette (« S… ») sont la même semaine ; une seule forme', async () => {
    monter(embouteillage()); await attendre(150);
    const entete = lu(quandDuCarnet());
    const jour = entete.match(/(\d{1,2})\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+(20\d{2})/);
    expect(jour, `Quand : « ${entete} » : pas de date écrite en toutes lettres`).toBeTruthy();
    const mois = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'].indexOf(jour![2]);
    const d = `${jour![3]}-${String(mois + 1).padStart(2, '0')}-${jour![1].padStart(2, '0')}`;
    const jeudi = iso(ms(lundi(d)) + 3 * JOUR_MS);
    const sem = Math.floor((ms(jeudi) - Date.UTC(+jeudi.slice(0, 4), 0, 1)) / JOUR_MS / 7) + 1;
    await ouvrirQuand();
    const curseur = document.querySelector('.cn-quand [role="slider"]');
    const valeur = curseur?.getAttribute('aria-valuetext') ?? '';
    expect(valeur, `réglette : « ${valeur} » ; Quand : « ${entete} » (S${sem})`).toMatch(new RegExp(`^S${sem}\\b`));
  });
  it('R73-24 : un projet du Planning passé (Sol : 18.05 → 25.05.2026, vu le 24.11.2026) ne dit pas « passé » dans Quand et « Dans À venir » dans la tête : un seul état', async () => {
    /* Le document de Sol n'est dans aucune fixture (reel-78 : pastille « Idée · 3 sept. », bulle « En cours au 20.11.2026 », Quand « passé · S21 ») : construit à la forme d'Embouteillage, ses dates
       (SIMULÉ). Il reproduit le contraire que l'écran montre : Quand « passé · S22 » et la tête « Dans À venir ». Les mots « Idée » et « En cours » de Sol ne sont pas reproduits (données non lues). */
    monter(planningDu('2026-05-18', '2026-05-25', 'Sol — matières premières'), { auj: '2026-11-24' }); await attendre(150);
    const quand = lu(quandDuCarnet());
    const tete = lu(document.querySelector('.cn-carnet-tete, .cn-tete-carnet, header') ?? document.body);
    const etats = ['passé', 'dans à venir', 'à venir'].filter(m => sans(`${quand} ${lu(document.body)}`).includes(sans(m)));
    expect(sans(quand).includes('passe') && sans(lu(document.body)).includes('dans a venir'), `Quand : « ${quand} » ; l'écran dit aussi « Dans À venir » (états : ${etats.join(' + ')} ; tête : « ${tete.slice(0, 120)} »)`).toBe(false);
  });
});

/* ======================================================================================================== R109 : R78-2 à R78-7 */

describe('R109 · R78-2 : fiche MotlerHops, table « je prends » : le CHF/kg rendu est dans sa colonne', () => {
  it('la ligne cochée « 50 g » dit ≈73,8 dans la colonne « CHF/kg rendu » (pas « offre ↓ »)', async () => {
    monter(citra()); await attendre(150);
    await ouvrirFiche(MOTLER);
    const tr = [...document.querySelectorAll('.cn-prend-ligne')].find(r => /^50 g/.test(lu(r)) && /3,72/.test(lu(r)));
    expect(tr, `la ligne 50 g de la table « je prends » : ${lu(document.body).slice(0, 400)}`).toBeTruthy();
    expect(lu(tr), `ligne : « ${lu(tr)} »`).toMatch(/73[,.]8/);
    expect(lu(tr), `ligne : « ${lu(tr)} »`).not.toMatch(/offre\s*↓/);
  });
});

describe('R109 · R78-3 : Comparer Houblons : « vendu par » dit tous les conditionnements de la fiche', () => {
  it('MotlerHops : la fiche dit 50 g, 250 g et 500 g ; Comparer dit « 50 g à 500 g » (jamais « 50 g » seul)', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const l = ligneComparer(/vendu par/);
    expect(l, `lignes de Comparer : ${entetesComparer().join(' | ')}`).toBeTruthy();
    expect(lu(l!.cellules[0]), `vendu par : « ${lu(l!.cellules[0])} »`).toMatch(/50\s*g.*500\s*g/);
  });
});

describe('R109 · R78-4 : Comparer Houblons : « N différents » ne compte pas une ligne identique', () => {
  it('les arômes sont les mêmes des deux côtés (l\'un suffixé « · variété ») : la ligne ne compte pas parmi les différents', async () => {
    monter(citra()); await attendre(150); await ouvrirComparer();
    const compte = lu(document.querySelector('.cn-cmp-tete, .cn-comparer, body')).match(/(\d+)\s+différents?/);
    expect(compte, 'le compteur « N différents »').toBeTruthy();
    const norme = (c: HTMLElement) => sans(lu(c)).replace(/\s*·\s*variete\s*$/, '');
    const lignes = [...document.querySelectorAll('table.cn-tableau-comparer tbody tr')].map(tr => [...tr.querySelectorAll('td')] as HTMLElement[]).filter(c => c.length >= 2);
    const reels = lignes.filter(c => norme(c[0]) !== norme(c[1])).length;
    expect(+compte![1], `« ${compte![0]} » ; lignes réellement différentes : ${reels} sur ${lignes.length} (Arômes : « ${lu(ligneComparer(/^aromes/)!.cellules[0])} » contre « ${lu(ligneComparer(/^aromes/)!.cellules[1])} »)`).toBe(reels);
  });
});

describe('R109 · R78-5 : liste filtrée : les quatre puces du coup d\'œil disent leur mot entier à 390 px', () => {
  const css = readFileSync('src/ui/carnets/carnets-liste.css', 'utf8');
  it('sous un filtre, les libellés (« je cherche », « décidés », « notés », « résolus 2026 ») sont entiers dans le DOM', async () => {
    monter(citra(), { ouvrir: false, plus: [embouteillage(), chambre()] }); await attendre(150);
    fireEvent.click(document.querySelector('.cnl-case[data-etat="cherche"]')!); await attendre(60);
    expect([...document.querySelectorAll('.cnl-case span')].map(e => lu(e))).toEqual(['je cherche', 'décidés', 'notés', 'résolus 2026']);
  });
  it('la coupe « … » ne tombe pas sur le libellé d\'une puce (le libellé ne se tronque pas : text-overflow: ellipsis absent de `.cnl-case span`)', () => {
    const regle = css.split('\n').find(l => /^\.cnl-case span\b/.test(l.trim())) ?? '';
    expect(regle, 'la règle `.cnl-case span`').toBeTruthy();
    expect(regle, `jsdom ne mesure pas : la règle de coupe est lue dans carnets-liste.css : « ${regle.trim()} »`).not.toMatch(/text-overflow:\s*ellipsis/);
  });
  it('les quatre puces tiennent à 390 px (estimation : 7 px par lettre de 14 px, 9 px par chiffre de 17 px, 24 px de marge et de croix) avec le filtre posé', async () => {
    monter(citra(), { ouvrir: false, plus: [embouteillage(), chambre()] }); await attendre(150);
    fireEvent.click(document.querySelector('.cnl-case[data-etat="cherche"]')!); await attendre(60);
    const largeurs = [...document.querySelectorAll('.cnl-case')].map(c => {
      const n = lu(c.querySelector('b')).length, m = lu(c.querySelector('span')).length;
      return n * 9 + m * 7 + 12 + 4 + (c.querySelector('.cnl-case-x') ? 18 : 0);
    });
    const total = largeurs.reduce((a, b) => a + b, 0) + 3 * 6;
    expect(total, `largeurs estimées ${largeurs.join(' + ')} px (+ 18) contre ≈358 px disponibles à 390`).toBeLessThanOrEqual(358);
  });
});

describe('R109 · R78-6 : Quand ouvert : la réglette des mois dit l\'année hors de l\'année en cours et au passage d\'année', () => {
  const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  const indexMois = (t: string) => MOIS.findIndex(m => sans(t).startsWith(sans(m)));
  /** Pour chaque graduation de mois : son texte et l'année du mois (ancrée sur la date posée de la réglette, data-valeur), le texte devant la dire hors de l'année d'aujourd'hui. */
  function graduations(auj: string) {
    const frise = document.querySelector('.cn-quand-frise') as HTMLElement | null;
    const valeur = frise?.getAttribute('data-valeur') ?? auj;
    const petites = [...document.querySelectorAll('.cn-quand-frise .cal-f-duree-rep-mois small')].map(e => (e.textContent ?? '').trim());
    const idx = petites.map(indexMois);
    const k = Math.max(0, idx.findIndex(i => i === +valeur.slice(5, 7) - 1));
    const annees: number[] = []; annees[k] = +valeur.slice(0, 4);
    for (let j = k + 1; j < petites.length; j++) annees[j] = annees[j - 1] + (idx[j] < idx[j - 1] ? 1 : 0);
    for (let j = k - 1; j >= 0; j--) annees[j] = annees[j + 1] - (idx[j] > idx[j + 1] ? 1 : 0);
    return petites.map((t, j) => ({ t, annee: annees[j], saut: j > 0 && idx[j] < idx[j - 1] }));
  }
  const manque = (g: ReturnType<typeof graduations>, auj: string) => {
    const premiereHors = g.findIndex(x => x.annee !== +auj.slice(0, 4));
    return g.filter((x, j) => (j === premiereHors || x.saut) && x.annee !== +auj.slice(0, 4) && !new RegExp(String(x.annee)).test(x.t)).map(x => `« ${x.t} » (${x.annee})`);
  };
  it('Embouteillage (vrai document, 2027, vu en 2026) : « juin · juil. · août » : le premier mois dit 2027', async () => {
    monter(embouteillage(), { auj: '2026-11-24' }); await attendre(150); await ouvrirQuand();
    const g = graduations('2026-11-24');
    expect(g.length, 'la réglette a des mois').toBeGreaterThan(0);
    expect(manque(g, '2026-11-24'), `réglette : ${g.map(x => `${x.t} (${x.annee})`).join(' · ')}`).toEqual([]);
  });
  it('Frigo + congel (Planning 01.08.2026 → 01.05.2027, aujourd\'hui 24.11.2026) : « avr. · mai · juin » : le premier mois dit 2027', async () => {
    monter(planningDu('2026-08-01', '2027-05-01', 'Frigo + congel'), { auj: '2026-11-24' }); await attendre(150); await ouvrirQuand();
    const g = graduations('2026-11-24');
    expect(manque(g, '2026-11-24'), `réglette : ${g.map(x => `${x.t} (${x.annee})`).join(' · ')}`).toEqual([]);
  });
  it('Extincteur (passe d\'année : Planning 14.12.2026 → 31.12.2026 puis janvier) : « déc. · janv. · févr. » : janv. dit 2027', async () => {
    monter(planningDu('2026-12-21', '2027-01-10', 'Extincteur'), { auj: '2026-11-24' }); await attendre(150); await ouvrirQuand();
    const g = graduations('2026-11-24');
    expect(g.some(x => x.saut), `réglette sans passage d'année : ${g.map(x => `${x.t} (${x.annee})`).join(' · ')}`).toBe(true);
    expect(manque(g, '2026-11-24'), `réglette : ${g.map(x => `${x.t} (${x.annee})`).join(' · ')}`).toEqual([]);
  });
  it('garde : une date de l\'année en cours ne dit pas l\'année (« jamais l\'année partout »)', async () => {
    monter(carnetDate('2026-12-07', 'Changer les rails'), { auj: '2026-11-24', sansPoser: true }); await attendre(150); await ouvrirQuand();
    const g = graduations('2026-11-24').filter(x => x.annee === 2026);
    expect(g.filter(x => /2026/.test(x.t)).map(x => x.t), 'mois de 2026 qui disent 2026').toEqual([]);
  });
});

describe('R109 · R78-7 : Quand ouvert, puces « Prix estimé ? » : espace des milliers', () => {
  it('« 1 000 CHF » et « 5 000 CHF », comme le carnet écrit « 1 500 CHF » (jamais « 1000 CHF »)', async () => {
    monter(carnetDate('2026-12-07', 'Changer les rails'), { auj: '2026-11-24', sansPoser: true }); await attendre(150); await ouvrirQuand();
    /* le texte BRUT : `lu` réunit toutes les espaces (U+202F comprise), il masquerait le défaut */
    const puces = [...document.querySelectorAll('.cn-quand .cn-puce')].map(e => (e.textContent ?? '').trim()).filter(t => /CHF/.test(t));
    expect(puces.length, `puces de prix : ${[...document.querySelectorAll('.cn-quand .cn-puce')].map(e => lu(e)).join(' | ')}`).toBeGreaterThan(0);
    /* « 1 000 » est écrit avec U+202F (espace fine insécable) : la capture C09-quand le montre SANS espace visible (« 1000 CHF »), alors que le carnet écrit « 1 500 CHF » avec une espace
       que l'œil voit : le test exige l'espace insécable ordinaire (U+00A0) ou l'espace, jamais U+202F, que la police de la puce rend à zéro. */
    const milliers = puces.filter(t => /\d[\s  ]?000(?!\d)/.test(t));
    expect(milliers.length, `puces de milliers : ${puces.join(' | ')}`).toBeGreaterThan(0);
    const fautives = milliers.filter(t => !/\d[  ]000(?!\d)/.test(t));
    expect(fautives.map(t => `« ${t} » : code de l'espace ${[...t].filter(c => /\s/.test(c)).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join(',') || 'aucune'}`), 'puces dont l\'espace des milliers est U+202F (invisible) ou absente').toEqual([]);
  });
});
