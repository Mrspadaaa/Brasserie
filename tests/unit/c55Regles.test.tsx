// @vitest-environment jsdom
/**
 * Voie c55-tests (24.11) : les tests ROUGES des règles R23 à R26 tirées du test en ligne du tour 55 (C55-1 à C55-4).
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c55-tests/DOSSIER.md), avant tout correctif : celui qui corrige
 * n'écrit pas le test. Aucun réseau réel, aucun Gemini (AiClient est simulé et jette s'il est appelé). Données : tests/fixtures/c55/comparer.json
 * (réécrit à la main d'après les captures du tour 55) et tests/fixtures/c54/chambre-froide.json ; prix, noms et vendeurs fictifs.
 *
 * Les tests lisent ce que le brasseur voit : texte rendu SANS les parties cachées (`.cn-cache`, lecteur d'écran), ordre des lignes,
 * critères réellement créés dans le magasin après un vrai envoi (CarnetsVue). Limites : jsdom ne mesure rien.
 *  - R23 lit la CASCADE CSS réelle (postcss, @media évalués à 390 px, spécificité, ordre des feuilles) : largeur maximale de la cellule des
 *    libellés, comparée à la largeur du mot le plus long. Largeur d'un mot : mesurée en ligne quand on la connaît (« Branchement » = 85 px,
 *    BUGS C55-1), sinon la chasse moyenne de Source Sans 3 à 14 px (6,4 px par signe, mesurée au banc le 17.11, Courbe.tsx `largeurTexte`).
 *    Elle ne dit PAS « coupe le mot » : c48Regles R2 interdit toute coupe au milieu d'un mot dans ces cellules (« Dimension / s ») ; la sortie
 *    est un libellé court entier ou une colonne assez large.
 *  - Le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import postcss from 'postcss';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { Reglette } from '../../src/ui/carnets/Choisir';
import { TableauCarnet } from '../../src/ui/carnets/TableauCarnet';
import { appelsSimules, type AppelsIA } from '../../src/ui/carnets/rangement';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Sans accent, en minuscules, espaces simples (insécables compris) : « Étape » → « etape ». */
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix { id: string; nom: string; vendeur: string; pays: string; dispo: string; prixCentimes: number; lignes: Ligne[] }
const FIX = JSON.parse(readFileSync('tests/fixtures/c55/comparer.json', 'utf8')) as { articles: ArticleFix[] };
const CELLULE_C54 = (JSON.parse(readFileSync('tests/fixtures/c54/chambre-froide.json', 'utf8')) as { cellule: Ligne[] }).cellule;

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};
const permutations: Array<[string, <T>(l: T[]) => T[]]> = [['dans l\'ordre de la page', l => [...l]], ['page inversée', l => [...l].reverse()]];

function carnetDe(articles: ArticleFix[], criteres: Critere[], titre = 'Chambre froide'): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: titre,
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
        valeurs: valeursDe(a.lignes), prixCentimes: a.prixCentimes, devise: 'CHF', taxe: 'ht' as const
      }) as Article)
    }
  } as CarnetDoc;
}
const critere = (texte: string, nom: string, sens: 'plus' | 'moins', unite: string): Critere =>
  ({ id: 'K1', texte, origine: 'vous', caracteristique: { nom, unite, sens } } as Critere);
const volumeM3 = () => [critere('Volume de 2 m³', 'Volume', 'plus', 'm³')];
const chambres = (permuter: <T>(l: T[]) => T[] = l => l, criteres: Critere[] = volumeM3()) =>
  carnetDe(FIX.articles.map(a => ({ ...a, lignes: permuter(a.lignes) })), criteres);
/** Le jeu du tour 54 (ses noms de page, des mots-clés), avec une offre par article : sert l'ordre des lignes. */
const cellulesC54 = (permuter: <T>(l: T[]) => T[]) => carnetDe([
  { ...FIX.articles[0], lignes: permuter(CELLULE_C54) },
  { ...FIX.articles[1], lignes: permuter(CELLULE_C54.map((l, i) => (/^\d+(?:,\d+)?$/.test(l.valeur) ? { ...l, valeur: String(Number(l.valeur.replace(',', '.')) + 1 + i % 3) } : l))) }
], []);
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;

const comparer = (c: CarnetDoc) => render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop} />).container;
const fiche = (c: CarnetDoc, i = 0) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;
const tableauDuCarnet = (c: CarnetDoc) =>
  render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} sep={null} onOuvrir={nop} />).container;

/** Le texte que le brasseur LIT : sans les parties cachées au regard (`.cn-cache`, pour le lecteur d'écran) ni les `aria-hidden` d'icône. */
function visible(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
/** Le libellé d'une ligne de Comparer : sans l'unité grise, l'épingle ni le texte caché. */
function libelleDeLigne(th: Element): string {
  const copie = th.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache, .cn-mut, .cn-epingle').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
const lignesDe = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('.cn-tableau-comparer tbody tr')];
const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** L'unité `u` apparaît-elle comme un « mot » du texte (« 2,6 m³ », pas « mm » dans « mm² ») ? */
const ditUnite = (texte: string, u: string) => new RegExp(`(?:^|[\\s\\d])${echapper(u)}(?![\\p{L}\\d])`, 'u').test(texte);

/* ======================================================================================================== R23 */

/**
 * R23 (C55-1) : dans Comparer, un libellé de ligne ne déborde jamais sur sa valeur (« Branchement1N~/PE ») : il passe à la ligne entre deux
 * mots ou prend un libellé court entier ; toute colonne de libellés du Carnet. Tour 55 : « Branchement » (85 px) dans une colonne de 74 px
 * touche « 1N~/PE » (valeur d'un texte, alignée à gauche).
 * Endroits (grep `scope="row"`, `<dt>`, `.cn-tableau-comparer`) : le libellé de ligne de Comparer (`tbody th`, comparer-compact.css,
 * carnets-decider.css l.189 et l.224 : `max-width: 74px` à 390 px) ; la colonne des écartés de Comparer (`.cn-ecartes th`) ; la colonne
 * « Ses autres valeurs » de l'écran Choisir (`.cn-place th`) ; la liste « Caractéristiques » de la fiche (`.cn-carac dt`, libellé AU-DESSUS
 * de la valeur, pas en colonne). Les trois derniers sont des garde-fous (aucune largeur maximale : la table s'élargit).
 */
const LARGEUR_ECRAN = 390;
const MESURES_EN_LIGNE: Record<string, number> = { branchement: 85 };
const CHASSE = 6.4;
const largeurDuMot = (mot: string) => MESURES_EN_LIGNE[sans(mot)] ?? Math.ceil([...mot].length * CHASSE);

/** Les « @media » à largeur seule (min/max-width en px) sont évalués à 390 px ; tout autre @media est ignoré. */
function mediaVraie(params: string): boolean {
  const groupes = params.match(/\([^)]*\)/g) ?? [];
  const largeurs = [...params.matchAll(/\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g)];
  if (!groupes.length || groupes.length !== largeurs.length) return false;
  return largeurs.every(m => (m[1] === 'min' ? LARGEUR_ECRAN >= Number(m[2]) : LARGEUR_ECRAN <= Number(m[2])));
}
interface Regle { selecteur: string; decl: Array<[string, string, boolean]>; ordre: number }
/** Les règles des feuilles du Carnet, dans l'ordre où l'application les charge (carnets.css, puis carnets-decider.css, puis comparer-compact.css). */
function reglesDeCarnet(): Regle[] {
  const sortie: Regle[] = [];
  let ordre = 0;
  for (const f of ['carnets.css', 'carnets-decider.css', 'comparer-compact.css']) {
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
/** Le style d'un élément : les déclarations des règles qui le visent, par spécificité puis ordre (`padding` développé ; `!important` gagne). */
function styleDe(el: Element, regles: Regle[]): Map<string, string> {
  const touches = regles.filter(r => { try { return el.matches(r.selecteur); } catch { return false; } })
    .sort((a, b) => specificite(a.selecteur) - specificite(b.selecteur) || a.ordre - b.ordre);
  const m = new Map<string, string>();
  const important = new Set<string>();
  const poser = (p: string, v: string, imp: boolean) => { if (imp || !important.has(p)) { m.set(p, v); if (imp) important.add(p); } };
  for (const r of touches) for (const [p, v, imp] of r.decl) {
    if (p === 'padding') {
      const x = v.trim().split(/\s+/);
      const [h, d, b, g] = x.length === 1 ? [x[0], x[0], x[0], x[0]] : x.length === 2 ? [x[0], x[1], x[0], x[1]] : x.length === 3 ? [x[0], x[1], x[2], x[1]] : x;
      poser('padding-top', h, imp); poser('padding-right', d, imp); poser('padding-bottom', b, imp); poser('padding-left', g, imp);
    } else poser(p, v, imp);
  }
  return m;
}
const enPx = (v?: string): number | null => { const m = /^(-?\d+(?:\.\d+)?)px$/.exec((v ?? '').trim()); return m ? Number(m[1]) : null; };
/** La largeur que la cellule d'un libellé ne dépasse pas : `max-width` (relevée par `min-width` si celui-ci est plus grand) ; `Infinity` sans plafond. */
function largeurMaxDeCellule(el: Element, regles: Regle[]): number {
  const s = styleDe(el, regles);
  const max = enPx(s.get('max-width'));
  return max === null ? Infinity : Math.max(max, enPx(s.get('min-width')) ?? 0);
}
/** Les mots d'un libellé plus larges que leur cellule (« Branchement 85 px > 74 px »). */
function motsQuiDebordent(libelle: string, largeurCellule: number): string[] {
  return libelle.split(/[\s/]+/).filter(Boolean).filter(m => largeurDuMot(m) > largeurCellule).map(m => `${m} (${largeurDuMot(m)} px) > ${largeurCellule} px`);
}

describe('R23 : un libellé de ligne ne déborde jamais sur sa valeur (390 px)', () => {
  const regles = reglesDeCarnet();

  it('les feuilles du Carnet sont lues (garde-fou de l\'outil : la règle « max-width: 74px » du téléphone est vue)', () => {
    const racine = document.createElement('article');
    racine.className = 'cn-page cn-comparer';
    racine.innerHTML = '<table class="cn-tableau cn-tableau-comparer"><tbody><tr><th scope="row">x</th></tr></tbody></table>';
    document.body.appendChild(racine);
    const cellule = racine.querySelector('tbody th')!;
    expect(largeurMaxDeCellule(cellule, regles), 'largeur maximale lue dans la cascade').toBe(74);
    racine.remove();
  });

  for (const [nom, permuter] of permutations) {
    it(`Comparer (chambres de grossiste, ${nom}) : le plus long mot de chaque libellé de ligne tient dans sa cellule (« Branchement » 85 px)`, () => {
      const c = comparer(chambres(permuter));
      document.body.appendChild(c);
      const th = [...c.querySelectorAll<HTMLElement>('.cn-tableau-comparer tbody th[scope="row"]')];
      const libelles = th.map(libelleDeLigne);
      expect(libelles, 'la ligne « Branchement » est dans le tableau').toContain('Branchement');
      const debordent = th.flatMap(e => motsQuiDebordent(libelleDeLigne(e), largeurMaxDeCellule(e, regles)).map(x => `« ${libelleDeLigne(e)} » : ${x}`));
      expect(debordent, 'libellés qui touchent la valeur voisine').toEqual([]);
      document.body.removeChild(c);
    });
  }

  it('Comparer (jeu du tour 54, 17 noms de page ; plus exigeant : « refroidissement », « fonctionnement ») : aucun libellé de ligne ne déborde', () => {
    const c = comparer(cellulesC54(l => l));
    document.body.appendChild(c);
    const th = [...c.querySelectorAll<HTMLElement>('.cn-tableau-comparer tbody th[scope="row"]')];
    expect(th.length).toBeGreaterThan(8);
    const debordent = th.flatMap(e => motsQuiDebordent(libelleDeLigne(e), largeurMaxDeCellule(e, regles)).map(x => `« ${libelleDeLigne(e)} » : ${x}`));
    expect(debordent).toEqual([]);
    document.body.removeChild(c);
  });

  it('libellé qui prend un libellé court entier : aucune règle ne coupe un mot dans ces cellules (c48Regles R2 : jamais « Dimension / s »)', () => {
    const coupe = /^(?:break-word|anywhere)$/;
    const e = document.createElement('article');
    e.className = 'cn-page cn-comparer';
    e.innerHTML = '<table class="cn-tableau cn-tableau-comparer"><tbody><tr><th scope="row">x</th></tr></tbody></table>';
    document.body.appendChild(e);
    const s = styleDe(e.querySelector('tbody th')!, regles);
    expect(coupe.test(s.get('overflow-wrap') ?? ''), 'overflow-wrap').toBe(false);
    expect(/^(?:break-all|break-word)$/.test(s.get('word-break') ?? ''), 'word-break').toBe(false);
    expect(s.get('hyphens'), 'hyphens').not.toBe('auto');
    e.remove();
  });

  it('colonne des écartés de Comparer, de l\'écran Choisir (« Ses autres valeurs ») : aucun plafond de largeur sur un libellé (garde-fou : la table s\'élargit)', () => {
    const maquette = document.createElement('div');
    maquette.className = 'cn-page cn-comparer';
    maquette.innerHTML = '<table class="cn-ecartes"><tbody><tr><th scope="row">Branchement</th><td>x</td></tr></tbody></table>'
      + '<table class="cn-place"><tbody><tr><th scope="row">Branchement</th><td class="cn-mono">1N~/PE</td><td>x</td></tr></tbody></table>';
    document.body.appendChild(maquette);
    for (const th of maquette.querySelectorAll('th[scope="row"]')) {
      expect(motsQuiDebordent('Branchement', largeurMaxDeCellule(th, regles)), th.parentElement!.parentElement!.parentElement!.className).toEqual([]);
    }
    maquette.remove();
  });

  it('fiche d\'article, « Caractéristiques » : le libellé est au-dessus de sa valeur (dt et dd ne sont pas côte à côte)', () => {
    const c = fiche(chambres(), 0);
    const dl = c.querySelector('dl.cn-carac')!;
    expect(dl, 'la liste des caractéristiques').toBeTruthy();
    document.body.appendChild(c);
    const dt = dl.querySelector('dt')!;
    const ligne = dt.parentElement!;
    expect(styleDe(ligne, regles).get('display') ?? 'block', 'la paire dt/dd').not.toMatch(/flex|grid/);
    expect(styleDe(dt, regles).get('display') ?? 'block').toBe('block');
    document.body.removeChild(c);
  });
});

/* ======================================================================================================== R24 */

/**
 * R24 (C55-2) : ce que l'aperçu du rangement promet (« Ce qui compte · … », critère, ordre des articles) est exactement ce qui est créé ;
 * sinon l'aperçu ne le promet pas. Tour 55 : la phrase « ZZ TEST — marmite de brassage 50 L » annonce « Ce qui compte · Marmite de brassage
 * 50 L » ; le carnet créé n'a aucun critère (au tour 54, même phrase : « Volume de 50 L »). Le geste est joué dans l'app (CarnetsVue,
 * taper, Entrée) avec quatre réponses d'IA simulées (aucun Gemini) et l'IA éteinte.
 * Endroits (grep « ceQuiCompte », « memeTexte », « recopie ») : l'aperçu (`apercuCarnet.tsx`, ligne `critere`) ; l'écriture locale
 * (`rangementCarnets.ts` `ecrireLocal`, branche « créer » : IA éteinte ou en échec) ; le remplacement par la réponse de l'IA (`ecrireIA`, branche
 * `an.sorte === 'cree'`, filtre `recopie`) ; `creerCarnet`/`ranger` (operations.ts) ; la lecture du critère simulée (`extraireCriteres`,
 * iaSimulee.ts) ; la lecture serveur (functions/src/carnetIA.ts) n'est pas jouable sans Gemini : la réponse « idée seule » la représente.
 */
const PHRASE = 'ZZ TEST — marmite de brassage 50 L';
const PHRASE_SEUIL = 'ZZ TEST — marmite d\'au moins 50 L';
const pause = () => new Promise(r => setTimeout(r, 5));
const pageMuette = (u: string) => ({ url: u, domaine: 'exemple.invalid', statut: 'illisible', luLe: 0 }) as never;
const iaQuiRend = (lignes: unknown[]): AppelsIA => ({ async ranger() { await pause(); return { ok: true, data: { lignes } }; }, async lire(u) { await pause(); return pageMuette(u); } });
const COMPORTEMENTS: Record<string, { appels?: AppelsIA; mode: 'simule' | 'eteint' }> = {
  'IA simulée (extraireCriteres)': { appels: appelsSimules('normal', 5), mode: 'simule' },
  'IA qui ne rend que l\'idée (la réponse du tour 55)': { appels: iaQuiRend([{ sorte: 'idee', texte: PHRASE, titre: 'Marmite de brassage 50 L' }]), mode: 'simule' },
  'IA qui rend « Volume de 50 L » (la réponse du tour 54)': { appels: iaQuiRend([{ sorte: 'idee', texte: PHRASE, titre: 'Marmite de brassage' }, { sorte: 'critere', texte: 'Volume de 50 L', caracteristique: { nom: 'Volume', unite: 'L', sens: 'plus' } }]), mode: 'simule' },
  'IA en échec (le rangement local reste)': { appels: { async ranger() { await pause(); return { ok: false, error: 'panne simulée' }; }, async lire(u) { return pageMuette(u); } }, mode: 'simule' },
  'IA éteinte (rangement local seul)': { mode: 'eteint' }
};
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };

/** Tape la phrase dans la liste, lit ce que l'aperçu promet, envoie, puis lit les critères du carnet créé (et son tableau avec deux articles lus). */
async function creerParPhrase(phrase: string, comportement: { appels?: AppelsIA; mode: 'simule' | 'eteint' }) {
  const magasin = magasinMemoire(fixtureCarnets());
  const avant = new Set(lireCarnets(magasin.lire(), { archives: true }).map(c => c.id));
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={comportement.mode as never}
    {...(comportement.appels ? { appels: comportement.appels } : {})} aides={aidesCarnet(comportement.mode as never, {})} ecrirePlan={() => {}} />);
  await attendre(30);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  fireEvent.change(champ(), { target: { value: phrase } });
  await attendre(60);
  const promesse = [...document.querySelectorAll('p')].map(p => visible(p)).find(t => /^Ce qui compte ·/.test(t))?.replace(/^Ce qui compte ·\s*/, '') ?? null;
  fireEvent.keyDown(champ(), { key: 'Enter' });
  await attendre(320);
  const cree = lireCarnets(magasin.lire(), { archives: true }).find(c => !avant.has(c.id));
  const criteres = (cree?.carnet.criteres ?? []).map(k => ({ texte: k.texte, caracteristique: (k as { caracteristique?: { nom: string; unite?: string; sens: string } }).caracteristique }));
  return { promesse, cree, criteres, titre: cree?.title };
}
const porte50L = (t: string) => /(?:^|[^\d,.])50\s*L\b/.test(t);

describe('R24 : ce que l\'aperçu promet est ce qui est créé', () => {
  for (const [nom, comportement] of Object.entries(COMPORTEMENTS)) {
    it(`${nom} : l'aperçu promet un critère, le carnet créé porte les 50 L de la phrase`, async () => {
      const r = await creerParPhrase(PHRASE, comportement);
      expect(r.cree, 'un carnet est créé').toBeTruthy();
      expect(r.promesse, 'l\'aperçu annonce « Ce qui compte · … »').toBeTruthy();
      const textes = r.criteres.map(k => k.texte);
      expect(textes.some(porte50L), `aperçu : « Ce qui compte · ${r.promesse} » ; critères créés : ${JSON.stringify(textes)}`).toBe(true);
    });
  }

  for (const nom of ['IA en échec (le rangement local reste)', 'IA éteinte (rangement local seul)']) {
    it(`${nom} : le critère créé est EXACTEMENT celui de l'aperçu (rien ne le reformule)`, async () => {
      const r = await creerParPhrase(PHRASE, COMPORTEMENTS[nom]);
      expect(r.promesse).toBeTruthy();
      const textes = r.criteres.map(k => sans(k.texte));
      expect(textes, `aperçu : « ${r.promesse} » ; créés : ${JSON.stringify(r.criteres.map(k => k.texte))}`).toContain(sans(r.promesse!));
    });
  }

  it('IA simulée : le critère créé se mesure (une caractéristique que les articles portent) : « Marmite de brassage » n\'est pas une caractéristique', async () => {
    const r = await creerParPhrase(PHRASE, COMPORTEMENTS['IA simulée (extraireCriteres)']);
    const k = r.criteres.find(x => porte50L(x.texte));
    expect(k, `critères : ${JSON.stringify(r.criteres)}`).toBeTruthy();
    expect(k!.caracteristique, 'une caractéristique de comparaison').toBeTruthy();
    const c = r.cree!;
    (c.carnet.articles as unknown as unknown[]).push(
      { id: 'A1', nom: 'Marmite inox 50 L', lecture: 'lue', domaine: 'exemple.test', url: 'https://exemple.test/a', prixCentimes: 52000, devise: 'CHF', taxe: 'ht', valeurs: { Volume: { valeur: 50, unite: 'L', origine: 'page' } } },
      { id: 'A2', nom: 'Frigo 242 L', lecture: 'lue', domaine: 'exemple.test', url: 'https://exemple.test/b', prixCentimes: 30200, devise: 'CHF', taxe: 'ht', valeurs: { Volume: { valeur: 242, unite: 'L', origine: 'page' } } });
    const t = tableau(c)!;
    const classante = t.colonnes.find(col => col.critereId && col.sens !== 'texte');
    expect(classante, `colonnes : ${JSON.stringify(t.colonnes.map(x => [x.nom, x.critereId ? 'critère' : '', x.sens]))}`).toBeTruthy();
    expect(t.lignes.filter(l => l.cellules[classante!.nom] !== undefined).length, `les articles portent la valeur « ${classante!.nom} »`).toBeGreaterThan(0);
  });

  for (const [nom, comportement] of Object.entries(COMPORTEMENTS)) {
    it(`${nom} : même règle, phrase à seuil (« marmite d'au moins 50 L ») : l'aperçu promet, le carnet créé porte les 50 L`, async () => {
      const r = await creerParPhrase(PHRASE_SEUIL, comportement);
      expect(r.promesse, 'l\'aperçu promet un critère').toBeTruthy();
      expect(r.criteres.map(k => k.texte).some(porte50L), `créés : ${JSON.stringify(r.criteres.map(k => k.texte))}`).toBe(true);
    });
  }

  it('une phrase sans mesure (« ZZ TEST — marmite de brassage ») : l\'aperçu ne promet aucun critère (garde-fou)', async () => {
    const r = await creerParPhrase('ZZ TEST — marmite de brassage', COMPORTEMENTS['IA éteinte (rangement local seul)']);
    expect(r.promesse).toBeNull();
    expect(r.criteres).toEqual([]);
  });
});

/* ======================================================================================================== R25 */

/**
 * R25 (C55-3) : toute valeur chiffrée affichée porte son unité (en-tête de Comparer, cellules, jauges), une seule fois. Tour 55 : l'en-tête de
 * chaque colonne dit « 242 » et « 50 » en gros, sans unité (la ligne dit « Volume L ») ; la cellule dit « 0 à 8 °C », son carnet « 2,6 m³ ».
 * Endroits (grep `cn-cmp-gros`, `cn-piste-borne`, `Reglette`, `texteCellule`) : l'en-tête de colonne de Comparer (`cn-cmp-gros`) ; les cellules
 * et le libellé de ligne de Comparer (l'unité une fois : dans le libellé OU dans la cellule) ; les bornes de la jauge de la fiche
 * (`Piste`) ; la règle de la feuille Articles (valeur de la carte) ; le tableau du carnet ; la réglette de l'écran Choisir (`Reglette`, g05-11).
 */
const PUR_NOMBRE = /^[<>≈~]?\s*[+−-]?\d[\d\s'’.,]*$/;

describe('R25 : toute valeur chiffrée porte son unité, une seule fois', () => {
  for (const [nom, criteres] of [['avec le critère « Volume de 2 m³ »', volumeM3()], ['sans critère (la colonne Volume en tête)', []]] as const) {
    it(`Comparer, en-tête de colonne, ${nom} : le grand chiffre dit son unité (« 2,6 m³ », « 6 m³ »)`, () => {
      const gros = [...comparer(chambres(l => l, [...criteres])).querySelectorAll('.cn-cmp-gros')].map(visible);
      expect(gros, 'un grand chiffre par colonne d\'article').toHaveLength(2);
      for (const g of gros) expect(g, `en-tête : « ${g} »`).toMatch(/\d\s*m³$/);
    });
  }
  it('Comparer, en-tête de colonne, volumes en litres (marmite 50 L, frigo 242 L) : « 50 L » et « 242 L »', () => {
    const c = carnetDe([
      { ...FIX.articles[0], nom: 'Marmite de brassage inox 50 L', lignes: [{ nom: 'Volume', valeur: '50', unite: 'L' }] },
      { ...FIX.articles[1], nom: 'Kibernetik KS240L', lignes: [{ nom: 'Volume', valeur: '242', unite: 'L' }] }
    ], [critere('Volume de 50 L', 'Volume', 'plus', 'L')], 'Marmite');
    const gros = [...comparer(c).querySelectorAll('.cn-cmp-gros')].map(visible);
    expect(gros.sort()).toEqual(['242 L', '50 L']);
  });

  for (const [nom, permuter] of permutations) {
    it(`Comparer, cellules (${nom}) : chaque nombre porte son unité, et une seule fois (dans le libellé de ligne OU dans la cellule)`, () => {
      const c = comparer(chambres(permuter));
      const fautes: string[] = [];
      for (const tr of lignesDe(c)) {
        const th = tr.querySelector('th')!;
        const unitesDuLibelle = [...th.querySelectorAll('.cn-mut')].map(e => visible(e)).filter(Boolean);
        for (const td of tr.querySelectorAll('td')) {
          const txt = visible(td);
          if (!/\d/.test(txt) || /^\?$/.test(txt)) continue;
          const dansCellule = !PUR_NOMBRE.test(txt);
          const dansLibelle = unitesDuLibelle.length > 0;
          if (dansCellule && dansLibelle && /^(?:mm|kg|m³|L|W|V|kWh|%)$/.test(unitesDuLibelle[0]) && ditUnite(txt, unitesDuLibelle[0])) fautes.push(`« ${libelleDeLigne(th)} » : l'unité ${unitesDuLibelle[0]} est dite deux fois (libellé et « ${txt} »)`);
          if (!dansCellule && !dansLibelle) fautes.push(`« ${libelleDeLigne(th)} » : « ${txt} » sans unité`);
        }
      }
      expect(fautes).toEqual([]);
    });
  }

  it('fiche d\'article, jauge de « Volume de 2 m³ » : chaque borne dit son unité (« 2,6 m³ », « 6 m³ la plus haute des 2 »)', () => {
    const bornes = [...fiche(chambres(), 0).querySelectorAll('.cn-piste-borne')].map(visible);
    expect(bornes, 'deux bornes').toHaveLength(2);
    for (const b of bornes) expect(b, `bornes : ${bornes.join(' | ')}`).toMatch(/\d\s*m³/);
  });
  it('fiche d\'article, jauge de « Volume de 50 L » (critère « moins ») : « 50 L » et « 242 L », une seule fois par borne', () => {
    const c = carnetDe([
      { ...FIX.articles[0], nom: 'Marmite de brassage inox 50 L', lignes: [{ nom: 'Volume', valeur: '50', unite: 'L' }] },
      { ...FIX.articles[1], nom: 'Kibernetik KS240L', lignes: [{ nom: 'Volume', valeur: '242', unite: 'L' }] }
    ], [critere('Volume de 50 L', 'Volume', 'moins', 'L')], 'Marmite');
    const bornes = [...fiche(c, 0).querySelectorAll('.cn-piste-borne')].map(visible);
    expect(bornes.join(' | ')).toMatch(/50 L/);
    expect(bornes.join(' | ')).toMatch(/242 L/);
    for (const b of bornes) expect((b.match(/\bL\b/g) ?? []).length, `borne « ${b} »`).toBe(1);
  });
  it('fiche d\'article, caractéristiques : « 2,6 m³ », « 0 à 8 °C », « 550 Watt » portent leur unité (garde-fou)', () => {
    const dd = [...fiche(chambres(), 0).querySelectorAll('dl.cn-carac dd')].map(visible);
    for (const v of dd) if (/\d/.test(v)) expect(v, `valeur « ${v} »`).not.toMatch(PUR_NOMBRE);
  });
  it('feuille Articles : la valeur qui classe porte son unité (« 6 m³ », garde-fou)', () => {
    const cartes = [...feuille(chambres()).querySelectorAll('.cn-classee')].map(visible);
    expect(cartes).toHaveLength(2);
    for (const t of cartes) expect(t, t).toMatch(/\d\s*m³/);
  });
  it('tableau du carnet : la valeur de la colonne Volume porte son unité, et l\'unité n\'est pas dite deux fois (en-tête ET chaque cellule)', () => {
    const c = tableauDuCarnet(chambres());
    const entetes = [...c.querySelectorAll('[role="columnheader"]')].map(visible);
    const colonne = entetes.findIndex(e => /Volume/.test(e));
    expect(colonne, `en-têtes : ${entetes.join(' | ')}`).toBeGreaterThanOrEqual(0);
    const enteteDit = ditUnite(entetes[colonne], 'm³');
    /* la 1re colonne d'en-tête est « rang · article » ; ses cellules n'ont pas de data-col : la colonne n d'en-tête est data-col n−1 */
    const cellules = [...c.querySelectorAll<HTMLElement>('[role="cell"][data-col]')].filter(e => e.getAttribute('data-col') === String(colonne - 1));
    expect(cellules.length, 'une cellule de volume par article').toBe(2);
    for (const cel of cellules) {
      const dansCellule = ditUnite(visible(cel), 'm³');
      expect(Number(enteteDit) + Number(dansCellule), `en-tête « ${entetes[colonne]} », cellule « ${visible(cel)} »`).toBe(1);
    }
  });

  /* L'écran Choisir (g05-11) est une MAQUETTE CHOISIE par le brasseur (règle n° 1) : sa réglette dit « ‹ mieux · 242 » (sans unité) à gauche
     et « 50 L » à droite. Le test est écrit, mais SAUTÉ tant que le pilote n'a pas tranché (comme R22 de c54Regles) : ni vert ni rouge. */
  it.skip('écran Choisir (Reglette, g05-11) : la borne « mieux » de gauche dit aussi son unité — à trancher (maquette choisie)', () => {
    const place = { nom: 'volume', libelle: 'Volume', texte: '50 L', valeur: 50, meilleure: 242, pire: 50, toutes: [242, 50], unite: 'L', sur: 2, rang: 2 };
    const bornes = [...render(<Reglette place={place as never} />).container.querySelectorAll('.cn-reglette-bornes span')].map(visible);
    for (const b of bornes) expect(b, `bornes : ${bornes.join(' | ')}`).toMatch(/\d\s*L/);
  });
});

/* ======================================================================================================== R26 */

/**
 * R26 (C55-4) : les lignes de Comparer suivent l'ordre de la fiche ; les lignes d'offre (prix, dispo, vendeur, pays) restent groupées
 * ensemble, en tête, jamais au milieu des caractéristiques. Tour 55 : « dispo » (et « vendeur » sur la cellule) rangés entre la largeur de la
 * porte et Température / Performance ; Comparer met les dimensions avant l'énergie, la fiche fait l'inverse.
 * Endroits (grep `groupeDeLigne`, `colonnesComparer`, `LIVRAISON`, `trierParDecision`) : l'ordre des lignes de Comparer
 * (`colonnesComparer`, Comparer.tsx, `groupeDeLigne`, comparer.ts l.545) ; la référence est la fiche (`FicheArticle`, `trierParDecision`,
 * functions/src/lienFusion.ts) ; la carte d'article (`CarteArticle`, `valeursLuesOrdonnees`, même ordre : garde-fou) ; le tableau du carnet
 * (`TableauCarnet`, une colonne de valeur : prix puis une mesure, pas de lignes d'offre au milieu : garde-fou).
 * La ligne qui classe (`.cn-ligne-critere`) garde sa place décidée (CRB-14) : elle est exclue de la comparaison avec la fiche.
 */
const OFFRE = /^(?:prix|dispo|disponibilite|vendeur|pays|livraison|delai)\b/;
const libellesDeFiche = (c: HTMLElement) => [...c.querySelectorAll('dl.cn-carac dt')].map(e => sans(visible(e)));

describe('R26 : les lignes de Comparer suivent l\'ordre de la fiche ; l\'offre reste groupée, en tête', () => {
  const jeux: Array<[string, (p: <T>(l: T[]) => T[]) => CarnetDoc]> = [
    ['chambres de grossiste, avec critère', p => chambres(p)],
    ['chambres de grossiste, sans critère', p => chambres(p, [])],
    ['jeu du tour 54 (noms de page)', p => cellulesC54(p)]
  ];
  for (const [jeu, fabrique] of jeux) for (const [nom, permuter] of permutations) {
    const lignes = () => lignesDe(comparer(fabrique(permuter))).map(tr => ({ nom: sans(libelleDeLigne(tr.querySelector('th')!)), critere: tr.classList.contains('cn-ligne-critere') }));

    it(`${jeu} (${nom}) : prix, dispo, vendeur et pays sont ensemble, en tête (la ligne qui classe mise à part)`, () => {
      const l = lignes().filter(x => !x.critere).map(x => x.nom);
      const offre = l.map((x, i) => (OFFRE.test(x) ? i : -1)).filter(i => i >= 0);
      expect(offre.length, `lignes : ${l.join(' | ')}`).toBeGreaterThanOrEqual(3);
      expect(offre, `lignes : ${l.join(' | ')}`).toEqual([...offre.keys()]);
    });

    it(`${jeu} (${nom}) : les caractéristiques suivent l'ordre de la fiche`, () => {
      const c = fabrique(permuter);
      const dansFiche = libellesDeFiche(fiche(c, 0));
      cleanup();
      const dansComparer = lignesDe(comparer(c)).filter(tr => !tr.classList.contains('cn-ligne-critere')).map(tr => sans(libelleDeLigne(tr.querySelector('th')!))).filter(x => !OFFRE.test(x));
      const communs = dansComparer.filter(x => dansFiche.includes(x));
      expect(communs.length, `fiche : ${dansFiche.join(' | ')}`).toBeGreaterThanOrEqual(6);
      expect(communs, `fiche : ${dansFiche.join(' | ')}`).toEqual(dansFiche.filter(x => communs.includes(x)));
    });
  }

  it('garde-fou : la carte d\'article (valeursLuesOrdonnees) suit aussi l\'ordre de la fiche, pour ne pas corriger Comparer à contre-sens', () => {
    const c = chambres();
    const dansFiche = libellesDeFiche(fiche(c, 0));
    expect(dansFiche.length).toBeGreaterThan(6);
    /* l'ordre de la fiche ne dépend pas de l'ordre de la page */
    cleanup();
    const inversee = libellesDeFiche(fiche(chambres(l => [...l].reverse()), 0));
    expect(inversee).toEqual(dansFiche);
  });
});
