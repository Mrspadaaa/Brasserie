// @vitest-environment jsdom
/**
 * Voie c58-tests (24.11) : les tests ROUGES des règles R31 à R34 tirées du test en ligne du tour 58 (voies/critique-58/RESULTAT.md ; BUGS.md C58-1 à
 * C58-6, C56-3, C50-5, C55-2). Écrits depuis les RÈGLES (voies/c58-tests/DOSSIER.md), avant tout correctif : celui qui corrige n'écrit pas le test.
 * Aucun réseau réel, aucun Gemini (AiClient est simulé et jette s'il est appelé). Données : tests/fixtures/c58/carnets.json (chambre froide, joint,
 * tuyau) et tests/fixtures/c56/carnets.json (marmite, cellule, houblons) ; noms, prix et vendeurs fictifs, valeurs des captures.
 *
 *  - R31 (C58-2, BLOQUANT) : un nombre n'est jamais coupé ni restylé à l'intérieur (« 50 L », « 20 mm » : chiffres d'un seul tenant, même taille que
 *    le texte autour) ; nombre et unité insécables. Trois lectures : le BALISAGE (aucun élément ne s'ouvre au milieu d'un nombre : le texte du nombre
 *    est dans UN seul nœud), la CASCADE (taille de police réelle de chaque morceau, `!important` compris : `.cn-ouvert :is(span, …) { font-size: 14px
 *    !important }` de carnets.css l.730 rapetisse l'enveloppe `cn-nowrap` dans un titre de 18 px) et le TEXTE (pas d'espace ordinaire, hors `nowrap`,
 *    entre un nombre et son unité).
 *  - R32 (C50-5 rouvert ; C58-4) : le compromis dit ce qu'on GAGNE et ce qu'on PERD, avec ou sans critère.
 *  - R33 (C55-2 retombé ; C58-5) : un critère affiché (« 50 L ») classe les articles ; ce que l'aperçu promet est ce qui est créé.
 *  - R34 : les autres constats C58 : C58-1 (nombre et unité dans les NOMS d'articles, la recherche, le compromis), C58-3 (l'avis de reprise reste dans
 *    le carnet du message), C58-6 (le prix de la ligne Offre a une place fixe).
 * Limites : jsdom ne mesure aucune boîte ; la cascade CSS est lue (postcss, @media évalués à 390 px, spécificité, ordre des feuilles) comme dans
 * c56Regles. Le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import postcss from 'postcss';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compromisDe, tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { appelsSimules, type AppelsIA } from '../../src/ui/carnets/rangement';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Sans accent, apostrophes droites, en minuscules, espaces simples (insécables compris). */
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix { id: string; nom: string; vendeur: string; pays: string; dispo: string; prixCentimes: number; lignes: Ligne[] }
interface CarnetFix { titre: string; critere?: { texte: string; nom: string; unite: string; sens: 'plus' | 'moins' }; articles: ArticleFix[] }
const F56 = JSON.parse(readFileSync('tests/fixtures/c56/carnets.json', 'utf8')) as { marmite: CarnetFix; cellule: CarnetFix; houblon: CarnetFix };
const F58 = JSON.parse(readFileSync('tests/fixtures/c58/carnets.json', 'utf8')) as { chambre: CarnetFix; joint: CarnetFix; tuyau: CarnetFix };
const FIX = { ...F56, ...F58 };

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};
function carnetDe(f: CarnetFix, o: { critere?: boolean; criteres?: Critere[] } = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const criteres: Critere[] = o.criteres ?? (f.critere && o.critere !== false
    ? [{ id: 'K1', texte: f.critere.texte, origine: 'vous', caracteristique: { nom: f.critere.nom, unite: f.critere.unite, sens: f.critere.sens } } as Critere] : []);
  return {
    ...base, title: f.titre,
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: f.articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
        valeurs: valeursDe(a.lignes), prixCentimes: a.prixCentimes, devise: 'CHF', taxe: 'ht' as const
      }) as Article)
    }
  } as CarnetDoc;
}
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;
const comparer = (c: CarnetDoc, o: { compromis?: string; critere?: boolean } = {}) =>
  render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop}
    {...(o.compromis ? { compromis: o.compromis } : {})} {...(o.critere && c.carnet.criteres[0] ? { critere: c.carnet.criteres[0] as never } : {})} />).container;
const fiche = (c: CarnetDoc, i = 0) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;
const vueCarnets = (carnets: CarnetDoc[], appels?: AppelsIA, mode: 'simule' | 'eteint' = 'eteint') => {
  const magasin = magasinMemoire(carnets as never[]);
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={mode as never} {...(appels ? { appels } : {})}
    aides={aidesCarnet(mode as never, {})} ecrirePlan={() => {}} />);
  return magasin;
};

/** Le texte que le brasseur LIT : sans les parties cachées au regard (`.cn-cache`). */
function visible(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const pause = () => new Promise(r => setTimeout(r, 5));
const pageMuette = (u: string) => ({ url: u, domaine: 'exemple.invalid', statut: 'illisible', luLe: 0 }) as never;
/** Les plus petits éléments dont le texte visible vérifie `re` (aucun enfant ne la vérifie seul). */
function minimaux(racine: ParentNode, re: RegExp): Element[] {
  const cand = [...racine.querySelectorAll('*')].filter(e => re.test(visible(e)));
  return cand.filter(e => !cand.some(o => o !== e && e.contains(o)));
}

/* ---- la cascade CSS réelle à 390 px (même outil que c56Regles) ---- */

const LARGEUR_ECRAN = 390;
function mediaVraie(params: string): boolean {
  const groupes = params.match(/\([^)]*\)/g) ?? [];
  const largeurs = [...params.matchAll(/\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g)];
  if (!groupes.length || groupes.length !== largeurs.length) return false;
  return largeurs.every(m => (m[1] === 'min' ? LARGEUR_ECRAN >= Number(m[2]) : LARGEUR_ECRAN <= Number(m[2])));
}
interface Regle { selecteur: string; decl: Array<[string, string, boolean]>; ordre: number }
function reglesDeCarnet(): Regle[] {
  const sortie: Regle[] = [];
  let ordre = 0;
  for (const f of ['carnets.css', 'carnets-fil.css', 'carnets-liste.css', 'carnets-decider.css', 'comparer-compact.css', 'fiche-article.css']) {
    const viser = (noeud: postcss.Container) => noeud.each(n => {
      if (n.type === 'rule') {
        const decl = (n.nodes ?? []).filter((d): d is postcss.Declaration => d.type === 'decl').map(d => [d.prop, d.value, !!d.important] as [string, string, boolean]);
        for (const sel of n.selectors) sortie.push({ selecteur: sel, decl, ordre: ordre++ });
      } else if (n.type === 'atrule' && n.name === 'media' && mediaVraie(n.params)) viser(n);
    });
    viser(postcss.parse(readFileSync(`src/ui/carnets/${f}`, 'utf8')));
  }
  return sortie;
}
function specificite(sel: string): number {
  const attributs = (sel.match(/\[[^\]]*\]/g) ?? []).length;
  const s = sel.replace(/\[[^\]]*\]/g, '');
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+/g) ?? []).length + (s.match(/:(?!:)[\w-]+/g) ?? []).length + attributs;
  const elements = (s.replace(/[.#:][\w-]+/g, '').match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return ids * 10000 + classes * 100 + elements;
}
const specif = (sel: string) => specificite(sel.replace(/:where\([^)]*\)/g, ''));
function styleDe(el: Element, regles: Regle[]): Map<string, string> {
  const touches = regles.filter(r => { try { return el.matches(r.selecteur); } catch { return false; } })
    .sort((a, b) => specif(a.selecteur) - specif(b.selecteur) || a.ordre - b.ordre);
  const m = new Map<string, string>();
  const important = new Set<string>();
  const poser = (p: string, v: string, imp: boolean) => { if (imp || !important.has(p)) { m.set(p, v); if (imp) important.add(p); } };
  for (const r of touches) for (const [p, v, imp] of r.decl) poser(p, v, imp);
  return m;
}
/** La taille de police réelle (px) d'un élément : sa déclaration (px, em, rem, %), sinon celle de son parent ; `<small>` : 0,83. */
function tailleDe(el: Element | null, regles: Regle[], memo = new Map<Element, number>()): number {
  if (!el || el === document.documentElement) return 16;
  const connu = memo.get(el);
  if (connu !== undefined) return connu;
  const parent = tailleDe(el.parentElement, regles, memo);
  const v = (styleDe(el, regles).get('font-size') ?? '').trim();
  let t = parent;
  let m: RegExpExecArray | null;
  if ((m = /^(\d+(?:\.\d+)?)px$/.exec(v))) t = Number(m[1]);
  else if ((m = /^(\d+(?:\.\d+)?)r?em$/.exec(v))) t = Number(m[1]) * (/rem$/.test(v) ? 16 : parent);
  else if ((m = /^(\d+(?:\.\d+)?)%$/.exec(v))) t = Number(m[1]) / 100 * parent;
  else if (v === 'smaller' || (!v && el.tagName === 'SMALL')) t = parent * 0.83;
  memo.set(el, t);
  return t;
}

/* ---- les nombres : balisage, taille, coupure possible ---- */

const UNITES = '(?:kg|mg|g|ml|cl|dl|l|L|mm|cm|m²|m³|m|°C|kW|kWh|W|V|CHF|€|bar)';
/** Un nombre entier : « 50 », « 2,6 », « 1 000 » (groupes de trois chiffres), « 2 697,74 ». */
const NOMBRE = String.raw`(?:\d{1,3}(?:[   ']\d{3})+(?![\d])(?:[.,]\d+)?|\d+(?:[.,]\d+)?)`;
const NOMBRE_UNITE = new RegExp(String.raw`${NOMBRE}(?:[\s  ]?${UNITES}(?![\p{L}²³/]))?`, 'gu');
const NOMBRE_ESPACE_UNITE = new RegExp(String.raw`(\d) (${UNITES})(?![\p{L}²³/])`, 'gu');

interface Texte { noeuds: Text[]; texte: string; debuts: number[]; noeudDe: (i: number) => Text }
function lireTexte(racine: Element): Texte {
  const noeuds: Text[] = [];
  const parcours = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  for (let n = parcours.nextNode(); n; n = parcours.nextNode()) {
    if ((n.parentElement as Element | null)?.closest('.cn-cache')) continue;
    noeuds.push(n as Text);
  }
  const texte = noeuds.map(n => n.data).join('');
  const debuts: number[] = [];
  noeuds.reduce((s, n) => { debuts.push(s); return s + n.data.length; }, 0);
  const noeudDe = (i: number) => { let k = 0; while (k + 1 < noeuds.length && debuts[k + 1] <= i) k++; return noeuds[k]; };
  return { noeuds, texte, debuts, noeudDe };
}
const extrait = (t: string, i: number, n: number) => `« ${t.slice(Math.max(0, i - 12), i + n + 6).replace(/\s+/g, ' ')} »`;

/** Les nombres dont les chiffres ne tiennent pas dans UN nœud de texte : un élément s'ouvre ou se ferme au milieu (« 5 | 0 L »). */
function nombresCoupes(racine: Element): string[] {
  const { texte, noeudDe } = lireTexte(racine);
  const trouves: string[] = [];
  for (const m of texte.matchAll(new RegExp(NOMBRE, 'gu'))) {
    const a = m.index!, b = a + m[0].length - 1;
    if (noeudDe(a) !== noeudDe(b)) trouves.push(`nombre coupé par le balisage ${extrait(texte, a, m[0].length)}`);
  }
  return [...new Set(trouves)];
}
/** Les « nombre + unité » dont un morceau n'a pas la taille de police de la racine (le titre, la ligne, la cellule). */
function nombresRestyles(racine: Element, regles: Regle[]): string[] {
  const { texte, noeuds, debuts } = lireTexte(racine);
  const memo = new Map<Element, number>();
  const reference = tailleDe(racine, regles, memo);
  const trouves: string[] = [];
  for (const m of texte.matchAll(NOMBRE_UNITE)) {
    const a = m.index!, b = a + m[0].length;
    const touches = noeuds.filter((n, k) => debuts[k] < b && debuts[k] + n.data.length > a);
    const tailles = [...new Set(touches.map(n => Math.round(tailleDe(n.parentElement, regles, memo) * 10) / 10))];
    if (tailles.some(t => t !== reference)) trouves.push(`${extrait(texte, a, m[0].length)} : tailles ${tailles.join(' et ')} px, le texte autour ${reference} px`);
  }
  return [...new Set(trouves)];
}
/** Les endroits où une espace ORDINAIRE sépare un nombre de son unité sans qu'un ancêtre `nowrap` les contienne tous deux (coupable en fin de ligne). */
function nombresSepares(racine: Element, regles: Regle[]): string[] {
  const { texte, noeudDe } = lireTexte(racine);
  const nowrap = (el: Element | null, a: Node, b: Node) => {
    for (let e = el; e && e !== racine.parentElement; e = e.parentElement) {
      if (styleDe(e, regles).get('white-space') === 'nowrap' && e.contains(a) && e.contains(b)) return true;
    }
    return false;
  };
  const trouves: string[] = [];
  for (const m of texte.matchAll(NOMBRE_ESPACE_UNITE)) {
    const i = m.index! + 1;
    const a = noeudDe(m.index!), esp = noeudDe(i), b = noeudDe(i + 1);
    if (nowrap(esp.parentElement, a, b)) continue;
    trouves.push(`espace ordinaire entre nombre et unité ${extrait(texte, m.index!, m[0].length)}`);
  }
  return [...new Set(trouves)];
}
const problemesNombres = (racine: Element, regles: Regle[]) => [...nombresCoupes(racine), ...nombresRestyles(racine, regles), ...nombresSepares(racine, regles)];

/* ======================================================================================================== R31 */

/**
 * R31 (C58-2, BLOQUANT ; régression du correctif de C56-3) : un nombre n'est JAMAIS coupé ni restylé à l'intérieur. « 50 L », « 20 mm », « 8 mm, 5 m »,
 * « 4 °C » : les chiffres d'un seul tenant, à la même taille que le texte autour ; le nombre et son unité ne se coupent pas entre eux.
 * Tour 58 : l'insécable de C56-3 n'enveloppait que le DERNIER chiffre (`insecable.tsx` : `(\d[ ]unité)`) : lien retour du Comparer « marmite de brassage
 * 5 » puis « 0 L » à l'écart ; titre « joint torique 20 mm » avec « 2 » à 18 px et « 0 mm » à 14 px (carnets.css l.730).
 * Endroits (grep `Insec`, `liesParNbsp`, `cn-nowrap`) : lien retour de Comparer (`.cn-retour`), titre du carnet ouvert (`h2.cn-titre`), fil d'Ariane de la
 * fiche, liste des carnets, critère du héros, « Classé par », valeurs des cellules de Comparer, Variantes de la fiche.
 * Les tests lisent le balisage rendu (un nombre = un seul nœud de texte), la taille de police de chaque morceau, et l'espace entre nombre et unité.
 */
describe('R31 : un nombre n\'est jamais coupé ni restylé à l\'intérieur (balisage, taille, texte)', () => {
  const regles = reglesDeCarnet();
  const TITRES: Array<[string, () => CarnetDoc]> = [
    ['« ZZ TEST — marmite de brassage 50 L »', () => carnetDe(FIX.marmite)],
    ['« ZZ TEST — joint torique 20 mm »', () => carnetDe(FIX.joint)],
    ['« ZZ TEST — tuyau silicone 8 mm, 5 m »', () => carnetDe(FIX.tuyau)],
    ['« ZZ TEST — cellule à 4 °C »', () => carnetDe(FIX.cellule)]
  ];

  it('l\'outil voit les trois défauts (garde-fou : « 5 | 0 L » coupé, « 2 » à 18 px puis « 0 mm » à 14 px, espace ordinaire ; un nombre entier ne l\'est pas)', () => {
    const e = document.createElement('div');
    e.innerHTML = '<h2 class="cn-ouvert-test" style="font-size:18px">joint 5<span class="cn-nowrap">0 L</span></h2><p>joint 20 mm</p><p>joint <span class="cn-nowrap">20 mm</span></p>';
    document.body.appendChild(e);
    expect(nombresCoupes(e.children[0]).length, 'nombre coupé par un élément').toBe(1);
    expect(nombresCoupes(e.children[1]).length, 'nombre entier').toBe(0);
    expect(nombresSepares(e.children[1], regles).length, 'espace ordinaire').toBe(1);
    expect(nombresSepares(e.children[2], regles).length, 'nowrap').toBe(0);
    e.remove();
    const h = document.createElement('div');
    h.innerHTML = '<div class="cn-ouvert"><h2 class="cn-titre">joint 20 <span class="cn-nowrap">mm</span></h2></div>';
    document.body.appendChild(h);
    expect(styleDe(h.querySelector('.cn-nowrap')!, regles).get('font-size'), 'carnets.css l.730 : `.cn-ouvert :is(span, …)` à 14 px !important').toBe('14px');
    h.remove();
  });

  for (const [nom, fabrique] of TITRES) {
    it(`lien retour de Comparer, ${nom} : le nombre reste entier, de la taille du lien, avec son unité`, () => {
      const c = comparer(fabrique());
      const retour = c.querySelector('.cn-retour')!;
      expect(problemesNombres(retour, regles), visible(retour)).toEqual([]);
    });
    it(`titre du carnet ouvert (h2), ${nom} : le nombre reste entier, de la taille du titre, avec son unité`, async () => {
      vueCarnets([fabrique()]);
      await attendre(60);
      const lien = [...document.querySelectorAll<HTMLElement>('button, a, [role="button"]')].find(e => /ZZ TEST/.test(e.textContent ?? ''));
      expect(lien, 'un toucher ouvre le carnet').toBeTruthy();
      fireEvent.click(lien!);
      await attendre(100);
      const titres = [...document.querySelectorAll('h1, h2')].filter(e => /ZZ TEST/.test(e.textContent ?? ''));
      expect(titres.length, 'le carnet ouvert dit son titre').toBeGreaterThan(0);
      for (const t of titres) expect(problemesNombres(t, regles), visible(t)).toEqual([]);
    });
    it(`fil d'Ariane de la fiche d'un article, ${nom} : le nombre reste entier, de la taille du fil`, () => {
      const f = fiche(fabrique(), 0);
      const fils = [...f.querySelectorAll('.cn-fil-court, .cn-fil-long')].filter(e => /\d/.test(visible(e)));
      expect(fils.length, 'le fil d\'Ariane dit le titre').toBeGreaterThan(0);
      for (const e of fils) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
    });
    it(`liste des carnets, ${nom} (garde-fou : le titre est UN nœud, à espace insécable) : le nombre reste entier, de la taille du titre`, async () => {
      vueCarnets([fabrique()]);
      await attendre(60);
      const titre = minimaux(document.body, /ZZ TEST/).filter(e => e.classList.contains('cn-carnet-titre'));
      expect(titre.length, 'le titre du carnet est dans la liste').toBeGreaterThan(0);
      for (const t of titre) expect(problemesNombres(t, regles), visible(t)).toEqual([]);
    });
  }

  it('fiche de la marmite, héros : « Volume utile : 50 L » reste entier, de la taille du critère', () => {
    const f = fiche(carnetDe(FIX.marmite), 1);
    const libelle = [...f.querySelectorAll('.cn-heros .cn-mut')].filter(e => /Volume utile/.test(visible(e)));
    expect(libelle.length, 'le héros dit son critère').toBeGreaterThan(0);
    for (const e of libelle) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('Comparer de la marmite : l\'en-tête « Classé par Volume utile : 50 L » reste entier, de la taille de l\'en-tête', () => {
    const c = comparer(carnetDe(FIX.marmite), { critere: true });
    const entete = minimaux(c, /Classé par.*Volume utile/);
    expect(entete.length, 'l\'en-tête « Classé par »').toBeGreaterThan(0);
    for (const e of entete) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('Comparer de la chambre froide : « 1500 x 1200 mm » et « 2,6 m³ » des cellules restent entiers, de la taille de la cellule', () => {
    const c = comparer(carnetDe(FIX.chambre));
    const cellules = [...c.querySelectorAll('.cn-tableau-comparer tbody td')].filter(e => /\d/.test(visible(e)));
    expect(cellules.length, 'des cellules chiffrées').toBeGreaterThan(0);
    for (const e of cellules) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('fiche d\'un houblon, « Variantes 50 g · 100 g (affichée) · 250 g · 500 g · 1 kg » : chaque nombre entier, avec son unité', () => {
    const f = fiche(carnetDe(FIX.houblon), 0);
    const dl = f.querySelector('dl.cn-carac')!;
    expect(visible(dl), 'la ligne Variantes est lue').toMatch(/Variantes/);
    expect(problemesNombres(dl, regles)).toEqual([]);
  });
  it('Comparer de deux houblons : la ligne Variantes garde chaque nombre entier, avec son unité', () => {
    const c = comparer(carnetDe(FIX.houblon));
    const t = c.querySelector('.cn-tableau-comparer')!;
    expect(visible(t), 'la ligne Variantes est lue').toMatch(/Variantes/);
    expect(problemesNombres(t, regles)).toEqual([]);
  });
});

/* ======================================================================================================== R32 */

/**
 * R32 (C50-5 rouvert ; C58-4 ; sa réponse « Oui » à « faut-il que le compromis dise ce qu'on gagne et ce qu'on perd ? ») : le compromis de Comparer dit
 * ce qu'on GAGNE (l'écart de prix) ET ce qu'on PERD (ce que l'autre article a de plus : volume, critère), avec ou sans critère. Tour 58 : « la 1re, la
 * moins chère : 289,77 CHF de moins que la 2e ; aucun critère ne les départage » ne dit jamais que la 2e a 4,06 m³ au lieu de 2,6 ; la marmite « 218 CHF de
 * moins que la 2e » ne dit rien de 50 L au lieu de 242 L ; la cellule « … 2 697,74 CHF, la moins chère, 289,77 CHF de moins que la 2e » non plus.
 * Les tests ne figent AUCUNE formulation : ils cherchent l'écart de prix et les valeurs qui distinguent les articles.
 * Endroits (grep `compromisDe`, `ecartPrixDit`, `recopieLeTableau`, `compromis`) : le calcul (`compromisDe`, comparer.ts) ; l'encadré de Comparer
 * (`recite`, Comparer.tsx : sans critère, une phrase qui reprend une valeur du tableau n'est pas montrée : c'est ELLE qui cache la perte). Tension à trancher
 * par le pilote : c48Regles R4 (sans critère, « ne recopie pas le tableau ») contre R32 (la perte est une valeur du tableau).
 */
describe('R32 : le compromis dit ce qu\'on gagne et ce qu\'on perd, avec ou sans critère', () => {
  const phraseDe = (c: CarnetDoc) => sans(compromisDe(tableau(c)) ?? '');
  const encartDe = (c: CarnetDoc, o: { compromis?: string } = {}) => comparer(c, { ...o, critere: true }).querySelector('.cn-compromis');

  it('chambre froide sans critère (son carnet du tour 58 : 2,6 m³ à 2 697,74 CHF, 4,06 m³ à 2 987,51 CHF) : le gain (289,77 CHF) et la perte (4,06 m³ au lieu de 2,6) sont dits', () => {
    const p = phraseDe(carnetDe(FIX.chambre));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).toMatch(/4,06/);
    expect(p, `« ${p} »`).toMatch(/\b2,6\b/);
  });
  it('cellule, critère « Température à 4 °C » (même température chez les deux, la 1re est la moins chère) : le gain (289,77) et la perte (4,06 m³ au lieu de 2,6) sont dits', () => {
    const p = phraseDe(carnetDe(FIX.cellule));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).toMatch(/4,06/);
    expect(p, `« ${p} »`).toMatch(/\b2,6\b/);
  });
  it('marmite sans critère (242 L à 302 CHF, 50 L à 520 CHF) : l\'écart de prix (218 CHF) et le volume qui distingue les deux (242 L, 50 L) sont dits', () => {
    const p = phraseDe(carnetDe(FIX.marmite, { critere: false }));
    expect(p, `« ${p} »`).toMatch(/\b218(?:,00)?\s?chf/);
    expect(p, `« ${p} »`).toMatch(/\b242\s?l\b/);
    expect(p, `« ${p} »`).toMatch(/\b50\s?l\b/);
  });
  it('chambre froide sans critère : le gain et la perte sont dits dans UNE seule phrase, avec un mot qui les oppose (« mais », « au lieu de », « contre », « en moins »)', () => {
    const p = phraseDe(carnetDe(FIX.chambre));
    expect(p, `« ${p} »`).toMatch(/\bmais\b|au lieu de|contre|en moins|de moins de|perd/);
  });
  it('Comparer rendu, chambre froide sans critère : l\'encadré « Compromis » est montré, avec le gain (289,77) et la perte (4,06 m³)', () => {
    const encart = encartDe(carnetDe(FIX.chambre));
    expect(encart, 'un encadré de compromis (sans critère, la phrase qui reprend le tableau n\'est pas montrée)').toBeTruthy();
    const t = sans(visible(encart!));
    expect(t, t).toMatch(/289,77/);
    expect(t, t).toMatch(/4,06/);
  });
  it('Comparer rendu, cellule avec critère : l\'encadré dit aussi la perte (4,06 m³), pas seulement le prix et la température', () => {
    const encart = encartDe(carnetDe(FIX.cellule));
    expect(encart, 'un encadré de compromis').toBeTruthy();
    const t = sans(visible(encart!));
    expect(t, t).toMatch(/289,77/);
    expect(t, t).toMatch(/4,06/);
  });
  it('Comparer rendu, un compromis d\'IA qui ne dit que le gain (« la 1re, la moins chère : 289,77 CHF de moins que la 2e ») : l\'écran dit aussi la perte (4,06 m³)', () => {
    const encart = encartDe(carnetDe(FIX.chambre), { compromis: 'la 1re, la moins chère : 289,77 CHF de moins que la 2e' });
    expect(encart, 'un encadré de compromis').toBeTruthy();
    expect(sans(visible(encart!)), visible(encart!)).toMatch(/4,06/);
  });
  it('garde-fou : deux articles de même volume, seul le prix diffère : l\'écart de prix est dit, aucune perte n\'est inventée', () => {
    const f = { ...FIX.chambre, articles: FIX.chambre.articles.map(a => ({ ...a, lignes: a.lignes.map(l => (l.nom === 'Volume' ? { ...l, valeur: '2,6' } : l)) })) };
    const p = phraseDe(carnetDe(f));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).not.toMatch(/4,06/);
  });
});

/* ======================================================================================================== R33 */

/**
 * R33 (C55-2 retombé ; C58-5) : un critère AFFICHÉ (« Critère : Marmite de brassage 50 L · calculé sur place ») classe les articles ; ce que l'aperçu
 * promet est ce qui est créé ET ce qui classe. Tour 55 : promis, non créé ; tour 56 : corrigé (« Volume utile : 50 L » classe) ; tour 58 : le critère est
 * AFFICHÉ, mais Comparer reste « Classé par Prix », le compromis dit « aucun critère ne les départage » et la jauge a disparu des fiches (au tour 56 :
 * classé par le volume). Cause probable : le critère de la phrase n'est pas une caractéristique que les articles portent (R30 : « un critère sans valeur
 * chez personne ne compte plus »), et rien ne le dit au brasseur. Règle : un critère qui porte une mesure (« 50 L »), s'il est affiché, a une
 * caractéristique que les articles portent, et classe ; sinon il n'est pas affiché comme un critère.
 * Endroits (grep `caracteristique`, `critereId`, `extraireCriteres`, `ecrireIA`, `ecrireLocal`) : le tableau (`tableau`, comparer.ts : colonne `critereId`) ;
 * la création par phrase (rangementCarnets.ts `ecrireLocal` / `ecrireIA`) ; la lecture du critère (analyseLocale.ts `extraireCriteres`).
 */
describe('R33 : un critère affiché classe les articles ; l\'aperçu promet ce qui est créé et ce qui classe', () => {
  const critereSeul = (c: CarnetDoc, k: Critere) => ({ ...c, carnet: { ...c.carnet, criteres: [k] } }) as CarnetDoc;
  const classante = (c: CarnetDoc) => {
    const t = tableau(c)!;
    const col = t.colonnes.find(x => x.critereId && x.sens !== 'texte');
    return { col, nbValeurs: col ? t.lignes.filter(l => l.cellules[col.nom] !== undefined).length : 0, noms: t.colonnes.map(x => `${x.nom}${x.critereId ? ' (critère)' : ''}`) };
  };
  const VARIANTES: Array<[string, Critere]> = [
    ['critère sans caractéristique (l\'idée seule : « Marmite de brassage 50 L »)', { id: 'K1', texte: 'Marmite de brassage 50 L', origine: 'ia' } as Critere],
    ['caractéristique du nom de la phrase (« Marmite de brassage », L)', { id: 'K1', texte: 'Marmite de brassage 50 L', origine: 'ia', caracteristique: { nom: 'Marmite de brassage', unite: 'L', sens: 'plus' } } as Critere],
    ['caractéristique « Volume » (les articles disent « Volume utile »)', { id: 'K1', texte: 'Volume de 50 L', origine: 'ia', caracteristique: { nom: 'Volume', unite: 'L', sens: 'plus' } } as Critere],
    ['caractéristique « Volume utile » (garde-fou : le nom exact des articles)', { id: 'K1', texte: 'Volume utile : 50 L', origine: 'vous', caracteristique: { nom: 'Volume utile', unite: 'L', sens: 'plus' } } as Critere]
  ];
  for (const [nom, k] of VARIANTES) {
    it(`marmite, ${nom} : le tableau est classé par ce critère (une colonne critère portée par les articles)`, () => {
      const c = critereSeul(carnetDe(FIX.marmite), k);
      const r = classante(c);
      expect(r.col, `colonnes : ${JSON.stringify(r.noms)}`).toBeTruthy();
      expect(r.nbValeurs, `articles qui portent « ${r.col?.nom} »`).toBeGreaterThanOrEqual(2);
    });
    it(`marmite, ${nom} : Comparer n'est pas « Classé par Prix » ; le compromis ne dit pas « aucun critère ne les départage »`, () => {
      const c = critereSeul(carnetDe(FIX.marmite), k);
      const racine = comparer(c, { critere: true });
      const tete = sans(visible(minimaux(racine, /Classé par/)[0] ?? racine));
      expect(tete, tete).not.toMatch(/classe par prix/);
      const p = sans(compromisDe(tableau(c)) ?? '');
      expect(p, `« ${p} »`).not.toMatch(/aucun critere ne les departage/);
    });
  }

  /* la création par phrase : le geste est joué dans l'app (CarnetsVue), IA simulée ou en échec, comme c55Regles R24 */
  const PHRASE = 'ZZ TEST — marmite de brassage 50 L';
  const iaQuiRend = (lignes: unknown[]): AppelsIA => ({ async ranger() { await pause(); return { ok: true, data: { lignes } }; }, async lire(u) { await pause(); return pageMuette(u); } });
  const COMPORTEMENTS: Record<string, { appels?: AppelsIA; mode: 'simule' | 'eteint' }> = {
    'IA simulée (extraireCriteres)': { appels: appelsSimules('normal', 5), mode: 'simule' },
    'IA qui ne rend que l\'idée': { appels: iaQuiRend([{ sorte: 'idee', texte: PHRASE, titre: 'Marmite de brassage 50 L' }]), mode: 'simule' },
    'IA qui rend le critère de la phrase sans caractéristique (tour 58 : « Marmite de brassage 50 L »)': {
      appels: iaQuiRend([{ sorte: 'idee', texte: PHRASE, titre: 'Marmite de brassage 50 L' }, { sorte: 'critere', texte: 'Marmite de brassage 50 L' }]), mode: 'simule' },
    'IA en échec (le rangement local reste)': { appels: { async ranger() { await pause(); return { ok: false, error: 'panne simulée' }; }, async lire(u) { return pageMuette(u); } }, mode: 'simule' },
    'IA éteinte (rangement local seul)': { mode: 'eteint' }
  };
  async function creerParPhrase(comportement: { appels?: AppelsIA; mode: 'simule' | 'eteint' }) {
    const magasin = magasinMemoire(fixtureCarnets());
    const avant = new Set(lireCarnets(magasin.lire(), { archives: true }).map(c => c.id));
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={comportement.mode as never}
      {...(comportement.appels ? { appels: comportement.appels } : {})} aides={aidesCarnet(comportement.mode as never, {})} ecrirePlan={() => {}} />);
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: PHRASE } });
    await attendre(60);
    const promesse = [...document.querySelectorAll('p')].map(p => visible(p)).find(t => /^Ce qui compte ·/.test(t))?.replace(/^Ce qui compte ·\s*/, '') ?? null;
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(320);
    const cree = lireCarnets(magasin.lire(), { archives: true }).find(c => !avant.has(c.id));
    return { promesse, cree };
  }
  for (const [nom, comportement] of Object.entries(COMPORTEMENTS)) {
    it(`phrase « ${PHRASE} », ${nom} : si l'aperçu promet un critère, les articles lus (« Volume utile », L) sont classés par lui`, async () => {
      const r = await creerParPhrase(comportement);
      expect(r.cree, 'un carnet est créé').toBeTruthy();
      expect(r.promesse, 'l\'aperçu annonce « Ce qui compte · … »').toBeTruthy();
      const c = r.cree!;
      const art = (id: string, nomA: string, centimes: number, litres: number) => ({ id, nom: nomA, lecture: 'lue', domaine: 'exemple.test', url: `https://exemple.test/${id}`, prixCentimes: centimes, devise: 'CHF', taxe: 'ht', valeurs: { 'Volume utile': { valeur: litres, unite: 'L', origine: 'page' } } });
      (c.carnet.articles as unknown as unknown[]).push(art('A1', 'Marmite inox 50 L', 52000, 50), art('A2', 'Frigo 242 L', 30200, 242));
      const textes = c.carnet.criteres.map(k => k.texte);
      expect(textes.length, `aperçu : « Ce qui compte · ${r.promesse} » ; critères créés : ${JSON.stringify(textes)}`).toBeGreaterThan(0);
      const rc = classante(c);
      expect(rc.col, `critères créés : ${JSON.stringify(textes)} ; colonnes : ${JSON.stringify(rc.noms)}`).toBeTruthy();
      expect(rc.nbValeurs, `articles qui portent « ${rc.col?.nom} »`).toBeGreaterThanOrEqual(2);
    });
  }
});

/* ======================================================================================================== R34 */

/**
 * R34 : les autres constats du tour 58.
 *  - C58-1 : un nombre séparé de son unité en fin de ligne dans les NOMS d'articles (« 1500 x 1200 mm - 2,6 » / « m³ - groupe frigorifique inclus » dans le
 *    carnet et la feuille Articles, « 4,06 » / « m³ » dans la recherche) et dans le compromis (« 289,77 » / « CHF de moins que la 2e ») : R27 n'y a pas été porté.
 *    Règle : partout où un texte de l'utilisateur ou de l'IA s'affiche (noms, recherche, compromis), nombre et unité restent ensemble, chiffres entiers.
 *  - C58-3 : l'avis « L'IA n'a pas répondu : 1 message rangé tel quel [Relire] » s'affiche dans TOUS les carnets ouverts ensuite (bandeauxCarnet.tsx l.35 :
 *    `aReprendre` n'est pas filtré par le carnet ouvert). Règle : l'avis ne s'affiche que dans le carnet du message, ou dans la liste.
 *  - C58-6 : le prix de la ligne Offre de la fiche passe sous « en stock » mais flotte au milieu de la carte (chez ggmgastro) ; chez Galaxus il est sur la
 *    ligne du vendeur, à droite. Règle : le prix a une place fixe (à droite de la carte, ou sous le vendeur), quel que soit le vendeur.
 */
describe('R34 (C58-1) : nombre et unité ensemble dans les noms d\'articles, la recherche et le compromis', () => {
  const regles = reglesDeCarnet();
  const chambre = () => carnetDe(FIX.chambre);

  it('feuille Articles, la chambre froide : les noms « 1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus » gardent chaque nombre entier avec son unité', () => {
    const c = feuille(chambre());
    const noms = minimaux(c, /groupe frigorifique inclus/);
    expect(noms.length, 'les noms d\'articles sont dans la feuille').toBeGreaterThan(0);
    for (const e of noms) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('carnet ouvert, liste des articles de la chambre froide : les noms gardent chaque nombre entier avec son unité', async () => {
    vueCarnets([chambre()]);
    await attendre(60);
    fireEvent.click([...document.querySelectorAll<HTMLElement>('button, a, [role="button"]')].find(e => /Chambre froide/.test(e.textContent ?? ''))!);
    await attendre(120);
    const noms = minimaux(document.body, /groupe frigorifique inclus/);
    expect(noms.length, 'les noms d\'articles sont dans le carnet').toBeGreaterThan(0);
    for (const e of noms) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('Comparer, en-têtes de colonne de la chambre froide : le nom de l\'article garde chaque nombre entier avec son unité', () => {
    const c = comparer(chambre());
    const noms = minimaux(c.querySelector('.cn-tableau-comparer thead') ?? c, /groupe frigorifique inclus/);
    expect(noms.length, 'les noms sont dans l\'en-tête').toBeGreaterThan(0);
    for (const e of noms) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('recherche de la liste des carnets (« 4,06 ») : la ligne d\'article citée sous la carte garde chaque nombre entier avec son unité (« 4,06 m³ »)', async () => {
    vueCarnets([chambre()]);
    await attendre(60);
    const loupe = document.querySelector<HTMLElement>('button.cnd-loupe, button[aria-label="Chercher un carnet"]');
    expect(loupe, 'la loupe de recherche').toBeTruthy();
    fireEvent.click(loupe!);
    await attendre(30);
    const champ = document.querySelector('input[type="search"]') as HTMLInputElement | null;
    expect(champ, 'le champ de recherche').toBeTruthy();
    fireEvent.change(champ!, { target: { value: '4,06' } });
    await attendre(250);
    const trouves = [...document.querySelectorAll('.cnd-cite')];
    expect(trouves.length, 'la recherche cite la ligne de l\'article (« article : … 4,06 m³ … »)').toBeGreaterThan(0);
    for (const e of trouves) expect(problemesNombres(e, regles), visible(e)).toEqual([]);
  });
  it('compromis de la chambre froide : « 289,77 CHF de moins que la 2e » ne coupe ni le nombre ni son unité', () => {
    const encart = comparer(chambre(), { critere: true }).querySelector('.cn-compromis');
    expect(encart, 'un encadré de compromis').toBeTruthy();
    expect(problemesNombres(encart!, regles), visible(encart!)).toEqual([]);
  });
  it('compromis d\'une IA (texte passé tel quel : « 289,77 CHF de moins que la 2e, mais 4,06 m³ au lieu de 2,6 m³ ») : nombres entiers, unités liées', () => {
    const encart = comparer(chambre(), { compromis: 'la 1re, la moins chère : 289,77 CHF de moins que la 2e, mais 2,6 m³ au lieu de 4,06 m³', critere: true }).querySelector('.cn-compromis');
    expect(encart, 'un encadré de compromis').toBeTruthy();
    expect(problemesNombres(encart!, regles), visible(encart!)).toEqual([]);
  });
});

describe('R34 (C58-3) : l\'avis « L\'IA n\'a pas répondu » reste dans le carnet du message (ou dans la liste)', () => {
  const AVIS = /n'a pas repondu/;
  const avisVisibles = () => {
    const cand = [...document.querySelectorAll<HTMLElement>('[role="status"], [role="alert"], .cn-bandeau, .cn-etat, p, span')].filter(e => AVIS.test(sans(visible(e))));
    return cand.filter(e => !cand.some(o => o !== e && o.contains(e)));
  };
  const mort: AppelsIA = { async ranger() { await pause(); return { ok: false, error: 'unavailable' }; }, async lire(u) { await pause(); return pageMuette(u); } };

  it('un message échoué dans « ZZ TEST — joint torique 20 mm » : un AUTRE carnet ouvert ensuite ne montre pas l\'avis de reprise (tour 58 : « 1 message rangé tel quel [Relire] » dans tous les carnets)', async () => {
    const autre = carnetDe(FIX.marmite);
    const magasin = magasinMemoire([...fixtureCarnets(), autre] as never[]);
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={mort} aides={aidesCarnet('simule' as never, {})} ecrirePlan={() => {}} />);
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: 'ZZ TEST — joint torique 20 mm' } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    const t0 = Date.now();
    while (Date.now() - t0 < 9000 && avisVisibles().length === 0) await attendre(100);
    await attendre(9000);
    /* retour à la liste, puis on ouvre le carnet de la marmite (rien à voir avec le message échoué) */
    const retour = [...document.querySelectorAll<HTMLElement>('button, a')].find(b => /^(?:‹\s*)?(?:Carnets|Retour)\b/i.test((b.textContent ?? '').trim()) || b.classList.contains('cn-retour'));
    if (retour) { fireEvent.click(retour); await attendre(100); }
    const lien = [...document.querySelectorAll<HTMLElement>('button, a, [role="button"]')].find(e => /marmite de brassage/.test(e.textContent ?? ''));
    expect(lien, 'le carnet de la marmite est ouvrable').toBeTruthy();
    fireEvent.click(lien!);
    await attendre(150);
    const titres = [...document.querySelectorAll('h1, h2')].filter(e => /marmite de brassage/i.test(e.textContent ?? ''));
    expect(titres.length, 'le carnet de la marmite est ouvert').toBeGreaterThan(0);
    expect(avisVisibles().map(e => visible(e)), 'avis affichés dans le carnet de la marmite').toEqual([]);
  }, 40000);
});

describe('R34 (C58-6) : le prix de la ligne Offre a une place fixe', () => {
  const regles = reglesDeCarnet();
  /** La place du prix, lue dans la cascade : « droite » (marge automatique dans une ligne qui prend toute la largeur de la carte, ou sortie de la ligne du
   *  vendeur), « sous-vendeur » (sa propre ligne, flex-basis 100 %), ou « flotte » (marge automatique dans une ligne qui ne prend qu'une partie de la carte :
   *  le prix finit au milieu, séparé des gestes). */
  function placeDuPrix(c: CarnetDoc, i = 0): { place: 'droite' | 'sous-vendeur' | 'flotte'; detail: string } {
    const f = fiche(c, i);
    const offre = f.querySelector<HTMLElement>('.cn-offre')!;
    const prix = offre.querySelector<HTMLElement>('.cn-prix-mono')!;
    const corps = offre.querySelector<HTMLElement>('.cn-offre-corps')!;
    const ps = styleDe(prix, regles), cs = styleDe(corps, regles);
    const pleine = (s: Map<string, string>) => /^100%$/.test((s.get('width') ?? '').trim()) || /(?:^|\s)100%(?:\s|$)/.test((s.get('flex') ?? '').split(/\s+/).slice(2).join(' ')) || /^100%$/.test((s.get('flex-basis') ?? '').trim());
    const auto = /auto/.test(ps.get('margin-left') ?? '');
    const dansCorps = corps.contains(prix);
    const detail = `prix : marge gauche ${ps.get('margin-left') ?? '0'}, base ${ps.get('flex-basis') ?? ps.get('flex') ?? '—'} ; ligne du vendeur (.cn-offre-corps) : flex ${cs.get('flex') ?? '—'}, wrap ${cs.get('flex-wrap') ?? 'nowrap'}, dans la ligne : ${dansCorps}`;
    f.remove();
    if (!dansCorps && auto) return { place: 'droite', detail };
    if (dansCorps && pleine(ps) && !auto) return { place: 'sous-vendeur', detail };
    if (dansCorps && auto && pleine(cs)) return { place: 'droite', detail };
    return { place: 'flotte', detail };
  }
  const cas: Array<[string, () => CarnetDoc]> = [
    ['cellule (gastro-exemple.com, DE : le vendeur long du tour 58)', () => carnetDe(FIX.cellule)],
    ['marmite (Galaxus-exemple : le vendeur court)', () => carnetDe(FIX.marmite)],
    ['chambre froide (gastro-exemple.com, DE)', () => carnetDe(FIX.chambre)]
  ];
  for (const [nom, fabrique] of cas) {
    it(`fiche, ligne Offre, ${nom} : le prix est à droite de la carte ou sous le vendeur, jamais flottant au milieu`, () => {
      const r = placeDuPrix(fabrique());
      expect(r.place, r.detail).not.toBe('flotte');
    });
  }
});
