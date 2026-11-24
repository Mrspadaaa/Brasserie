// @vitest-environment jsdom
/**
 * Voie c56-tests (24.11) : les tests ROUGES des règles R27 à R30 tirées du test en ligne du tour 56 (C56-1 à C56-6) et de la réponse C50-5.
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c56-tests/DOSSIER.md), avant tout correctif : celui qui corrige
 * n'écrit pas le test. Aucun réseau réel, aucun Gemini (AiClient est simulé et jette s'il est appelé). Données : tests/fixtures/c56/carnets.json
 * (réécrit à la main d'après les captures des tours 50 et 56) ; prix, noms et vendeurs fictifs.
 *
 * Les tests lisent ce que le brasseur voit : texte rendu SANS les parties cachées (`.cn-cache`), ordre des lignes, avis réellement affichés
 * après un vrai envoi (CarnetsVue). Limites : jsdom ne mesure aucune boîte.
 *  - R27 lit la CASCADE CSS réelle (postcss, @media évalués à 390 px, spécificité, ordre des feuilles) et un modèle de largeur (chasse moyenne
 *    de Source Sans 3 à 14 px : 6,4 px par signe, mesurée au banc le 17.11, comme c55Regles R23). Il cherche le TEXTE qui déborde ou qui se
 *    coupe, jamais la seule distance entre deux boîtes.
 *  - Le rendu réel à 390 px reste à voir en ligne.
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
import { Comparer, colonnesComparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import type { AppelsIA } from '../../src/ui/carnets/rangement';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Sans accent, apostrophes droites, en minuscules, espaces simples (insécables compris) : « L’IA n’a » → « l'ia n'a ». */
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix { id: string; nom: string; vendeur: string; pays: string; dispo: string; prixCentimes: number; lignes: Ligne[] }
interface CarnetFix { titre: string; critere?: { texte: string; nom: string; unite: string; sens: 'plus' | 'moins' }; articles: ArticleFix[] }
const FIX = JSON.parse(readFileSync('tests/fixtures/c56/carnets.json', 'utf8')) as { marmite: CarnetFix; cellule: CarnetFix; houblon: CarnetFix };

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};
function carnetDe(f: CarnetFix, o: { critere?: boolean; articles?: ArticleFix[]; sansPrix?: boolean } = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const criteres: Critere[] = f.critere && o.critere !== false
    ? [{ id: 'K1', texte: f.critere.texte, origine: 'vous', caracteristique: { nom: f.critere.nom, unite: f.critere.unite, sens: f.critere.sens } } as Critere] : [];
  return {
    ...base, title: f.titre,
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: (o.articles ?? f.articles).map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
        valeurs: valeursDe(a.lignes), ...(o.sansPrix ? {} : { prixCentimes: a.prixCentimes, devise: 'CHF', taxe: 'ht' as const })
      }) as Article)
    }
  } as CarnetDoc;
}
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;
const comparer = (c: CarnetDoc, compromis?: string) =>
  render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop} {...(compromis ? { compromis } : {})} />).container;
const fiche = (c: CarnetDoc, i = 0) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;

/** Le texte que le brasseur LIT : sans les parties cachées au regard (`.cn-cache`, pour le lecteur d'écran). */
function visible(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const pause = () => new Promise(r => setTimeout(r, 5));

/* ---- la cascade CSS réelle à 390 px (même outil que c55Regles R23 : @media à largeur seule évalués, spécificité, ordre des feuilles) ---- */

const LARGEUR_ECRAN = 390;
const CHASSE = 6.4;
function mediaVraie(params: string): boolean {
  const groupes = params.match(/\([^)]*\)/g) ?? [];
  const largeurs = [...params.matchAll(/\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g)];
  if (!groupes.length || groupes.length !== largeurs.length) return false;
  return largeurs.every(m => (m[1] === 'min' ? LARGEUR_ECRAN >= Number(m[2]) : LARGEUR_ECRAN <= Number(m[2])));
}
interface Regle { selecteur: string; decl: Array<[string, string, boolean]>; ordre: number }
/** Les règles des feuilles du Carnet, dans l'ordre où l'application les charge. */
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
/** `:where(...)` a une spécificité nulle : on le retire du calcul (les feuilles s'en servent pour les réinitialisations). */
const specif = (sel: string) => specificite(sel.replace(/:where\([^)]*\)/g, ''));
/** Le style d'un élément : les déclarations des règles qui le visent (`padding` développé ; `!important` gagne). */
function styleDe(el: Element, regles: Regle[]): Map<string, string> {
  const touches = regles.filter(r => { try { return el.matches(r.selecteur); } catch { return false; } })
    .sort((a, b) => specif(a.selecteur) - specif(b.selecteur) || a.ordre - b.ordre);
  const m = new Map<string, string>();
  const important = new Set<string>();
  const poser = (p: string, v: string, imp: boolean) => { if (imp || !important.has(p)) { m.set(p, v); if (imp) important.add(p); } };
  for (const r of touches) for (const [p, v, imp] of r.decl) {
    if (p === 'padding') {
      const x = v.trim().split(/\s+/);
      const [h, d, b, g] = x.length === 1 ? [x[0], x[0], x[0], x[0]] : x.length === 2 ? [x[0], x[1], x[0], x[1]] : x.length === 3 ? [x[0], x[1], x[2], x[1]] : x;
      poser('padding-top', h, imp); poser('padding-right', d, imp); poser('padding-bottom', b, imp); poser('padding-left', g, imp);
    } else if (p === 'margin') {
      const x = v.trim().split(/\s+/);
      const [h, d, b, g] = x.length === 1 ? [x[0], x[0], x[0], x[0]] : x.length === 2 ? [x[0], x[1], x[0], x[1]] : x.length === 3 ? [x[0], x[1], x[2], x[1]] : x;
      poser('margin-top', h, imp); poser('margin-right', d, imp); poser('margin-bottom', b, imp); poser('margin-left', g, imp);
    } else poser(p, v, imp);
  }
  return m;
}
const px = (v?: string): number => { const m = /^(-?\d+(?:\.\d+)?)(?:px)?$/.exec((v ?? '').trim()); return m ? Number(m[1]) : 0; };
const largeurTexte = (t: string, tailleFont = 14) => Math.ceil([...t].length * CHASSE * (tailleFont / 14));

/* ======================================================================================================== R27 */

/**
 * R27 (C56-1, C56-2, C56-3 ; C52-3 vérifié à tort) : aucun texte du Carnet ne déborde de sa boîte ni n'est coupé par le bord d'une carte ;
 * un nombre n'est jamais séparé de son unité en fin de ligne (« 250 g », « 50 L » insécables).
 *
 * POURQUOI LA MESURE DE C52-3 A MENTI. Le tour 53 a « vérifié » « ggmgastro.com2 987,51 CHF » en mesurant les BOÎTES : le conteneur du vendeur
 * (`.cn-offre-corps .cn-sp`, `flex: 1; min-width: 0` de carnets.css l.20 et l.503) finit 10 px avant la boîte du prix, donc « séparés de 10 px ».
 * Mais ce conteneur peut RÉTRÉCIR sous son plus long mot (`min-width: 0`, `.cn-offre-corps` en `flex: 1 1 170px` moins le prix en `nowrap`
 * ≈ 65 px pour « ggmgastro.com » ≈ 91 px) et le mot, qui ne se coupe pas, déborde de sa boîte (overflow visible) sur le prix : la boîte
 * dit 10 px, le texte dit zéro. Une mesure de boîtes ne dit rien d'un texte qui sort de sa boîte : ces tests lisent la cascade (le conteneur
 * a-t-il le droit de rétrécir sans pouvoir couper ni passer à la ligne ?) et le texte (largeur de la légende contre la place de sa piste ;
 * espace ordinaire entre un nombre et son unité), jamais la seule distance entre deux boîtes.
 *
 * Endroits (grep `cn-nowrap`, `white-space`, `cn-piste`, `cn-offre`, `Piste`, `cn-retour`, `cn-titre`, `valeurTexte`) :
 *  - la ligne Offre de la fiche : vendeur · pays, disponibilité, prix (FicheArticle.tsx l.286-293 ; carnets.css l.20, l.498-503) ;
 *  - la légende de la jauge du héros de la fiche (`Piste`, carnets.css l.186-190, l.582, l.645-651) ;
 *  - un nombre et son unité dans : les valeurs de la grille « Caractéristiques » de la fiche (Variantes), les cartes de la feuille Articles,
 *    les cellules de Comparer, le critère du héros (« Volume utile : 50 L »), le titre du carnet partout où il se lit (lien retour de Comparer
 *    `.cn-retour`, fil d'Ariane de la fiche `.cn-fil-court`/`.cn-fil-long`, liste des carnets, carnet ouvert).
 * Garde-fous (déjà justes) : la carte classée met vendeur, disponibilité et prix dans trois blocs séparés ; la cellule de Comparer est une
 * cellule de table qui s'élargit.
 */
describe('R27 : aucun texte ne déborde de sa boîte ni n\'est coupé ; un nombre ne se sépare pas de son unité', () => {
  const regles = reglesDeCarnet();
  const marmite = () => carnetDe(FIX.marmite);

  it('l\'outil lit la cascade (garde-fou : `.cn-sp` est bien `min-width: 0`, la cause de C56-1)', () => {
    const racine = document.createElement('div');
    racine.innerHTML = '<div class="cn-offre"><span class="cn-offre-corps"><span class="cn-sp"><b>x</b></span></span></div>';
    document.body.appendChild(racine);
    const sp = racine.querySelector('.cn-sp')!;
    expect(styleDe(sp, regles).get('min-width'), 'min-width lu dans la cascade').toBe('0');
    racine.remove();
  });

  /* --- C56-1 : la ligne Offre de la fiche --- */
  for (const [nom, c] of [['marmite (2 offres de noms différents)', marmite()], ['cellule', carnetDe(FIX.cellule)]] as const) {
    it(`fiche, ligne Offre (${nom}) : le vendeur, qui ne se coupe pas, ne peut pas déborder sur le prix (passage à la ligne du prix, ou mot coupable)`, () => {
      const f = fiche(c, 0);
      document.body.appendChild(f);
      const corps = f.querySelector<HTMLElement>('.cn-offre-corps')!;
      const sp = corps.querySelector<HTMLElement>('.cn-sp')!;
      expect(sp, 'le conteneur du vendeur').toBeTruthy();
      const prixEl = f.querySelector('.cn-offre .cn-prix-mono');
      expect(prixEl, 'le prix est dans la ligne Offre').toBeTruthy();
      const spStyle = styleDe(sp, regles), corpsStyle = styleDe(corps, regles);
      const peutRetrecir = px(spStyle.get('min-width')) === 0;
      const coupable = /^(?:anywhere|break-word)$/.test(spStyle.get('overflow-wrap') ?? '') || /^(?:break-all|break-word)$/.test(spStyle.get('word-break') ?? '');
      /* le prix passe à la ligne : la ligne du vendeur et du prix peut se replier, ou le prix n'est plus dans la même ligne que le vendeur */
      const prixALaLigne = (corpsStyle.get('flex-wrap') ?? 'nowrap') === 'wrap' || !corps.contains(prixEl!);
      const motLong = visible(sp).split(/\s+/).sort((a, b) => b.length - a.length)[0];
      expect(!peutRetrecir || coupable || prixALaLigne,
        `« ${motLong} » (≈ ${largeurTexte(motLong)} px) dans un conteneur à min-width 0, sans coupure de mot (${spStyle.get('overflow-wrap') ?? 'overflow-wrap normal'}), ` +
        `sur une ligne qui ne passe pas à la ligne (flex-wrap : ${corpsStyle.get('flex-wrap') ?? 'nowrap'}) : le mot déborde sur le prix`).toBe(true);
      document.body.removeChild(f);
    });
  }

  it('fiche, ligne Offre : une espace sépare le vendeur, la disponibilité et le prix dans le texte (garde-fou de C52-3 : la boîte seule n\'y suffit pas)', () => {
    const c = carnetDe(FIX.cellule);
    const t = visible(fiche(c, 0).querySelector('.cn-offre-corps')!);
    expect(t, t).toMatch(/gastro-exemple\.com · DE en stock 2\s?697,74\s?CHF/);
  });

  /* --- C56-2 : la légende de la jauge --- */
  /** La place que la fiche laisse à la piste du héros à 390 px (cascade : marges de la page, rembourrage et écart du héros, marges de la piste). */
  function placeDeLaPiste(f: HTMLElement): { place: number; besoin: number; detail: string } {
    const page = f.querySelector<HTMLElement>('.cn-fiche') ?? f.firstElementChild as HTMLElement;
    const heros = f.querySelector<HTMLElement>('.cn-heros')!;
    const val = heros.querySelector<HTMLElement>('.cn-heros-val')!;
    const piste = heros.querySelector<HTMLElement>('.cn-piste')!;
    const legende = piste.querySelector<HTMLElement>('.cn-piste-legende')!;
    const ps = styleDe(page, regles), hs = styleDe(heros, regles), pis = styleDe(piste, regles), ls = styleDe(legende, regles);
    const enLigne = (hs.get('flex-direction') ?? 'column') === 'row';
    const caractere = px(ls.get('font-size')) || 14;
    /* la place du bloc valeur (flex: none) : sa ligne la plus large (libellé et place à 14 px, valeur en 28 px) */
    const largeursVal = [...val.children].map(e => {
      const t = visible(e);
      return e.classList.contains('cn-mesure-val') ? largeurTexte(t, 28) : largeurTexte(t, e.classList.contains('cn-mut') ? 14 : 14);
    });
    const largeurVal = enLigne ? Math.max(0, ...largeursVal) : 0;
    const place = LARGEUR_ECRAN - px(ps.get('padding-left')) - px(ps.get('padding-right')) - px(hs.get('padding-left')) - px(hs.get('padding-right'))
      - (enLigne ? largeurVal + px(hs.get('gap')) : 0) - px(pis.get('margin-left')) - px(pis.get('margin-right'));
    const bornes = [...legende.children].map(e => visible(e));
    const besoin = bornes.reduce((s, t) => s + largeurTexte(t, caractere), 0) + px(ls.get('gap'));
    return { place, besoin, detail: `légende « ${bornes.join(' | ')} » ≈ ${besoin} px dans une piste de ≈ ${place} px (valeur et place du héros : ≈ ${largeurVal} px)` };
  }
  for (const i of [0, 1]) {
    it(`fiche de la marmite n° ${i + 1} sur 2 (« Volume utile : 50 L ») : la légende de la jauge tient dans sa piste, ou passe à la ligne (« la plus haute d » coupé en ligne)`, () => {
      const f = fiche(marmite(), i);
      document.body.appendChild(f);
      const { place, besoin, detail } = placeDeLaPiste(f);
      const borne = styleDe(f.querySelector('.cn-piste-borne')!, regles);
      const legende = styleDe(f.querySelector('.cn-piste-legende')!, regles);
      const peutPasserALaLigne = (borne.get('white-space') ?? 'normal') !== 'nowrap' && (legende.get('flex-wrap') ?? 'nowrap') === 'wrap';
      expect(besoin <= place || peutPasserALaLigne, detail).toBe(true);
      document.body.removeChild(f);
    });
  }

  /* --- C56-3 : un nombre et son unité --- */
  const UNITES = '(?:kg|mg|g|ml|cl|dl|l|L|mm|cm|m²|m³|m|°C|kW|kWh|W|V|CHF|€|bar)';
  const NOMBRE_ESPACE_UNITE = new RegExp(`(\\d) (${UNITES})(?![\\p{L}²³/])`, 'gu');
  /* le texte des nœuds est mis bout à bout sans séparateur (« 50 L » puis « 2e sur 2 » donne « 50 L2e ») : un chiffre qui suit l'unité ne l'exclut pas */
  /** Les endroits d'un texte où une espace ORDINAIRE sépare un nombre de son unité sans qu'un ancêtre `nowrap` (qui les contient tous les deux) l'empêche de se couper. */
  function nombresSepares(racine: Element): string[] {
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
      trouves.push(`« ${texte.slice(Math.max(0, m.index! - 14), m.index! + m[0].length + 8).replace(/\s+/g, ' ')} »`);
    }
    return [...new Set(trouves)];
  }
  const houblon = () => carnetDe(FIX.houblon);

  it('l\'outil voit une coupure possible (garde-fou : « 250 g » avec une espace ordinaire est signalé, avec une insécable ou dans un `nowrap` il ne l\'est pas)', () => {
    const e = document.createElement('div');
    e.innerHTML = '<p>cinq 250 g</p><p>six 250 g</p><p><span class="cn-nowrap">sept 250 g</span></p>';
    document.body.appendChild(e);
    expect(nombresSepares(e.children[0]).length, 'espace ordinaire').toBe(1);
    expect(nombresSepares(e.children[1]).length, 'espace insécable').toBe(0);
    expect(nombresSepares(e.children[2]).length, 'nowrap').toBe(0);
    e.remove();
  });

  it('fiche d\'un houblon, « Caractéristiques » : « Variantes 50 g · 100 g (affichée) · 250 g · 500 g · 1 kg » ne coupe aucun nombre de son unité', () => {
    const f = fiche(houblon(), 0);
    document.body.appendChild(f);
    expect(visible(f), 'la ligne Variantes est lue').toMatch(/Variantes/);
    expect(nombresSepares(f.querySelector('dl.cn-carac')!)).toEqual([]);
    document.body.removeChild(f);
  });
  it('Comparer de deux houblons : la ligne Variantes ne coupe aucun nombre de son unité', () => {
    const c = comparer(houblon());
    document.body.appendChild(c);
    expect(visible(c.querySelector('.cn-tableau-comparer')!), 'la ligne Variantes est lue').toMatch(/Variantes/);
    expect(nombresSepares(c.querySelector('.cn-tableau-comparer')!)).toEqual([]);
    document.body.removeChild(c);
  });
  it('feuille Articles de deux houblons : aucun nombre n\'est coupé de son unité', () => {
    const c = feuille(houblon());
    document.body.appendChild(c);
    expect(nombresSepares(c)).toEqual([]);
    document.body.removeChild(c);
  });
  it('lien retour de Comparer : « ‹ ZZ TEST — marmite de brassage 50 L » garde « 50 L » ensemble', () => {
    const c = comparer(marmite());
    document.body.appendChild(c);
    expect(visible(c.querySelector('.cn-retour')!)).toMatch(/50\s?L/);
    expect(nombresSepares(c.querySelector('.cn-retour')!)).toEqual([]);
    document.body.removeChild(c);
  });
  it('fiche de la marmite : le fil d\'Ariane (« Articles · ZZ TEST — marmite de brassage 50 L ») et le critère du héros (« Volume utile : 50 L ») gardent « 50 L » ensemble', () => {
    const f = fiche(marmite(), 1);
    document.body.appendChild(f);
    expect(nombresSepares(f.querySelector('.cn-tete')!), 'fil d\'Ariane').toEqual([]);
    expect(nombresSepares(f.querySelector('.cn-heros')!), 'héros').toEqual([]);
    document.body.removeChild(f);
  });
  it('Comparer de la marmite : l\'en-tête « Classé par Volume utile : 50 L » garde « 50 L » ensemble', () => {
    const c = comparer(marmite());
    document.body.appendChild(c);
    expect(visible(c)).toMatch(/Classé par/);
    /* le plus petit élément qui porte « Classé par » et sa chaîne (« Volume utile : 50 L › Prix ») */
    const entete = [...c.querySelectorAll('*')].filter(e => /Classé par/.test(visible(e)) && /Prix/.test(visible(e))).sort((a, b) => visible(a).length - visible(b).length)[0];
    expect(entete, 'l\'en-tête « Classé par »').toBeTruthy();
    expect(visible(entete), 'l\'en-tête dit le critère').toMatch(/Volume utile/);
    expect(nombresSepares(entete)).toEqual([]);
    document.body.removeChild(c);
  });

  const listeDesCarnets = async () => {
    const magasin = magasinMemoire([marmite() as never]);
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'eteint' as never} aides={aidesCarnet('eteint' as never, {})} ecrirePlan={() => {}} />);
    await attendre(60);
    return magasin;
  };
  it('liste des carnets : le titre « ZZ TEST — marmite de brassage 50 L » garde « 50 L » ensemble', async () => {
    await listeDesCarnets();
    const titre = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /marmite de brassage/.test(e.textContent ?? ''));
    expect(titre.length, 'le titre du carnet est dans la liste').toBeGreaterThan(0);
    for (const t of titre) expect(nombresSepares(t), visible(t)).toEqual([]);
  });
  it('carnet ouvert : son titre garde « 50 L » ensemble', async () => {
    await listeDesCarnets();
    const lien = [...document.querySelectorAll<HTMLElement>('button, a, [role="button"]')].find(e => /marmite de brassage/.test(e.textContent ?? ''));
    expect(lien, 'un toucher ouvre le carnet').toBeTruthy();
    fireEvent.click(lien!);
    await attendre(80);
    const titres = [...document.querySelectorAll('h1, h2')].filter(e => /marmite de brassage/.test(e.textContent ?? ''));
    expect(titres.length, 'le carnet ouvert dit son titre').toBeGreaterThan(0);
    for (const t of titres) expect(nombresSepares(t), visible(t)).toEqual([]);
  });

  it('carte classée de la feuille Articles (garde-fou) : vendeur, disponibilité et prix sont trois blocs séparés (aucun ne peut toucher l\'autre)', () => {
    const c = feuille(carnetDe(FIX.cellule));
    const carte = c.querySelector('.cn-classee')!;
    expect(carte.querySelector('.cn-classee-tx')?.textContent, 'vendeur et dispo dans le bloc texte').toMatch(/gastro-exemple\.com.*en stock/);
    expect(carte.querySelector('.cn-classee-prix')?.textContent, 'prix dans son bloc').toMatch(/2\s?697,74/);
  });
});

/* ======================================================================================================== R28 */

/**
 * R28 (C56-4, C56-5) : le rangement par l'IA ne conclut pas « l'IA n'a pas répondu » avant son vrai délai (aiTask répond en ~3 s ; tour 56 :
 * l'échec dit à 1,5 s, puis Relire réussit en 3 s) ; un échec donne UN seul avis, avec son Relire (tour 56 : « L'IA n'a pas répondu : 1 message
 * rangé tel quel [Relire] » ET « L'IA n'a pas répondu : rangé sur place, rien n'est perdu. » l'une sous l'autre).
 * Le geste est joué dans l'app (CarnetsVue, taper, Entrée) avec des réponses d'IA simulées (aucun Gemini) sur la phrase du constat.
 * Endroits (grep « n'a pas répondu », « echec », `passerIA`, `EtatIA`) : le déroulé `passerIA` (rangement.ts : seul endroit qui décide
 * `echec`, panne ou délai) ; l'avis de l'aperçu (`EtatIA` etat « echec », EtatIA.tsx l.175, via apercuCarnet.tsx l.134) ; le bandeau de reprise
 * (bandeauxCarnet.tsx l.38-41, « L'IA n'a pas répondu : n message rangé tel quel [Relire] ») ; la ligne `AVIS_IA` (lignesRegles.ts l.21) ; le
 * bandeau de retour (`retour.avis`). Un seul de ces textes doit rester visible. Limite : aiTask réel et réseau ne se jouent pas ici (le test
 * dit ce que le brasseur voit pour une réponse fautive, lente ou en panne).
 */
describe('R28 : l\'échec du rangement par l\'IA (délai, un seul avis)', () => {
  const PHRASE = 'ZZ TEST — tuyau silicone 8 mm, 5 m';
  const pageMuette = (u: string) => ({ url: u, domaine: 'exemple.invalid', statut: 'illisible', luLe: 0 }) as never;
  const AVIS = /n'ia n'a pas repondu|n'a pas repondu/;

  /** Envoie la phrase depuis la liste (IA « simulée » pour le mode, appels injectés) et rend l'état de l'écran au fil du temps. */
  async function envoyer(appels: AppelsIA) {
    const magasin = magasinMemoire(fixtureCarnets());
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} ecrirePlan={() => {}} />);
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: PHRASE } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    return magasin;
  }
  /** Les avis « n'a pas répondu » visibles : les plus extérieurs seulement (un avis dans un conteneur déjà compté ne l'est pas deux fois). */
  const avisVisibles = () => {
    const cand = [...document.querySelectorAll<HTMLElement>('[role="status"], [role="alert"], .cn-bandeau, .cn-etat, .cn-retour-avis, p, span')]
      .filter(e => AVIS.test(sans(visible(e))));
    return cand.filter(e => !cand.some(o => o !== e && o.contains(e)));
  };
  /** Attend (jusqu'à `max` ms) un état stable : un avis visible ou le rangement fini. */
  async function jusquAuBout(max = 9000) {
    const t0 = Date.now();
    while (Date.now() - t0 < max) {
      await attendre(100);
      if (avisVisibles().length > 0) break;
    }
    await attendre(400);
  }
  const rangee = () => /tuyau silicone/.test(sans(document.body.textContent ?? ''));

  it('une panne qui ne dure qu\'un appel (réponse ok:false tout de suite, puis réponse normale) : aucun « n\'a pas répondu », le tuyau est rangé (reprise seule ou premier essai)', async () => {
    let appels = 0;
    const flou: AppelsIA = {
      async ranger(contexte) { appels++; await pause(); return appels === 1 ? { ok: false, error: 'unavailable' } : { ok: true, data: reponseSimulee(contexte) }; },
      async lire(u) { await pause(); return pageMuette(u); }
    };
    await envoyer(flou);
    await jusquAuBout(4000);
    expect(avisVisibles().map(e => visible(e)), `appels au rangement : ${appels}`).toEqual([]);
    expect(rangee(), 'le tuyau est dans l\'écran').toBe(true);
  });

  it('une réponse qui met 3 s (le vrai délai d\'aiTask) n\'est pas annoncée perdue à 1,6 s : l\'attente est dite « en cours », puis le rangement aboutit', async () => {
    const lent: AppelsIA = {
      async ranger(contexte) { await new Promise(r => setTimeout(r, 3000)); return { ok: true, data: reponseSimulee(contexte) }; },
      async lire(u) { await pause(); return pageMuette(u); }
    };
    await envoyer(lent);
    await attendre(1600);
    expect(avisVisibles().map(e => visible(e)), 'à 1,6 s').toEqual([]);
    await attendre(2200);
    expect(avisVisibles().map(e => visible(e)), 'à 3,8 s').toEqual([]);
  }, 12000);

  /** Le bandeau de retour (« carnet créé · Annuler », avec l'avis) s'éteint seul à 8 s (useNavigationCarnet.ts l.97) : l'avis durable prend la place. */
  const apresLeRetour = () => attendre(8800);

  it('une panne qui dure (toutes les réponses en échec) : à l\'écran, UN seul avis « n\'a pas répondu », jamais deux l\'un sous l\'autre (tour 56, après 8 s)', async () => {
    const mort: AppelsIA = { async ranger() { await pause(); return { ok: false, error: 'unavailable' }; }, async lire(u) { await pause(); return pageMuette(u); } };
    await envoyer(mort);
    await jusquAuBout(9000);
    const pendant = avisVisibles().map(e => visible(e));
    expect(pendant.length, `avis à l'écran dès l'échec : ${JSON.stringify(pendant)}`).toBe(1);
    await apresLeRetour();
    const avis = avisVisibles().map(e => visible(e));
    expect(avis.length, `avis à l'écran après le bandeau de retour : ${JSON.stringify(avis)}`).toBe(1);
  }, 25000);

  it('une panne qui dure : l\'avis unique porte son Relire (le geste de reprise est dans le même avis), dès l\'échec et après 8 s', async () => {
    const mort: AppelsIA = { async ranger() { await pause(); return { ok: false, error: 'unavailable' }; }, async lire(u) { await pause(); return pageMuette(u); } };
    await envoyer(mort);
    await jusquAuBout(9000);
    await apresLeRetour();
    const avis = avisVisibles();
    expect(avis.length, 'un avis').toBeGreaterThan(0);
    const avecRelire = avis.filter(e => [...e.querySelectorAll('button')].some(b => /relire/i.test(b.textContent ?? '')) || (e.closest('.cn-bandeau, [role="status"]')?.querySelector('button') && /relire/i.test(e.closest('.cn-bandeau, [role="status"]')!.textContent ?? '')));
    expect(avecRelire.length, `avis sans Relire : ${JSON.stringify(avis.map(e => visible(e.closest('.cn-bandeau, [role="status"]') ?? e)))}`).toBe(avis.length);
  }, 25000);

  it('Relire, touché après l\'échec (le service répond de nouveau) : le tuyau est rangé et plus aucun avis d\'échec ne reste', async () => {
    let panne = true;
    const apres: AppelsIA = {
      async ranger(contexte) { await pause(); return panne ? { ok: false, error: 'unavailable' } : { ok: true, data: reponseSimulee(contexte) }; },
      async lire(u) { await pause(); return pageMuette(u); }
    };
    await envoyer(apres);
    await jusquAuBout(9000);
    panne = false;
    const relire = [...document.querySelectorAll<HTMLElement>('button')].find(b => /^relire$/i.test((b.textContent ?? '').trim()));
    expect(relire, 'un bouton Relire est offert après l\'échec').toBeTruthy();
    fireEvent.click(relire!);
    await attendre(1500);
    expect(avisVisibles().map(e => visible(e)), 'après Relire').toEqual([]);
  }, 20000);
});

/* ======================================================================================================== R29 */

/**
 * R29 (C56-6) : dans Comparer, les lignes d'offre (prix, dispo, vendeur, pays) restent groupées, même quand une ligne classe le carnet par un
 * critère : la ligne du critère vient avant ou après l'offre, jamais au milieu. Tour 56 : prix, « température » / « volume L », dispo, vendeur
 * (`LIGNE_CRITERE = 1` entre `LIGNE_PRIX = 0` et `LIGNE_LIVRAISON = 2` dans comparer.ts l.545 ; `colonnesComparer`, Comparer.tsx l.55-66).
 * Endroits (grep `LIGNE_LIVRAISON`, `colonnesComparer`, `cn-tableau-comparer`) : l'ordre des colonnes (`colonnesComparer`, fonction pure) ; les
 * lignes rendues de Comparer (tbody) ; la fiche (la ligne Offre est UN bloc : vendeur, disponibilité, prix) et la carte de la feuille Articles
 * (trois blocs, vendeur et dispo, prix, puis le critère au pied) : gardes-fous, déjà justes.
 */
describe('R29 : les lignes d\'offre de Comparer restent groupées, même avec un critère qui classe', () => {
  const OFFRE = /^(prix|dispo|vendeur|pays)$/;
  const lignesRendues = (c: CarnetDoc) => {
    const racine = comparer(c);
    return [...racine.querySelectorAll<HTMLElement>('.cn-tableau-comparer tbody th[scope="row"]')].map(th => {
      const copie = th.cloneNode(true) as Element;
      copie.querySelectorAll('.cn-cache, .cn-mut, .cn-epingle').forEach(n => n.remove());
      return sans((copie.textContent ?? '').replace(/\s+/g, ' ').trim());
    });
  };
  const contigu = (libelles: string[]) => {
    const idx = libelles.map((l, i) => (OFFRE.test(l) ? i : -1)).filter(i => i >= 0);
    return { idx, ok: idx.length > 0 && idx[idx.length - 1] - idx[0] + 1 === idx.length };
  };
  const cas: Array<[string, () => CarnetDoc]> = [
    ['marmite, critère « Volume utile : 50 L » (plus)', () => carnetDe(FIX.marmite)],
    ['marmite, critère « moins » (le plus petit volume)', () => carnetDe({ ...FIX.marmite, critere: { ...FIX.marmite.critere!, sens: 'moins' } })],
    ['cellule, critère « Température à 4 °C »', () => carnetDe(FIX.cellule)],
    ['cellule, critère sur le volume (m³)', () => carnetDe({ ...FIX.cellule, critere: { texte: 'Volume de 2 m³', nom: 'Volume', unite: 'm³', sens: 'plus' } })]
  ];
  for (const [nom, fabrique] of cas) {
    it(`Comparer rendu (${nom}) : prix, dispo, vendeur sont des lignes voisines`, () => {
      const libelles = lignesRendues(fabrique());
      const { idx, ok } = contigu(libelles);
      expect(idx.length, `lignes d'offre trouvées dans ${JSON.stringify(libelles)}`).toBeGreaterThanOrEqual(3);
      expect(ok, `ordre des lignes : ${JSON.stringify(libelles)}`).toBe(true);
    });
    it(`colonnesComparer (${nom}) : les colonnes d'offre se suivent dans la liste`, () => {
      const t = tableau(fabrique())!;
      const noms = colonnesComparer(t).map(c => sans(c.nom));
      const { ok } = contigu(noms);
      expect(ok, `colonnes : ${JSON.stringify(noms)}`).toBe(true);
    });
  }
  it('la ligne qui classe suit l\'offre ou la précède : elle est juste avant « prix » ou juste après la dernière ligne d\'offre (pas ailleurs)', () => {
    const libelles = lignesRendues(carnetDe(FIX.marmite));
    const { idx } = contigu(libelles);
    const critere = libelles.findIndex(l => /volume utile/.test(l));
    expect(critere, `la ligne du critère est dans ${JSON.stringify(libelles)}`).toBeGreaterThanOrEqual(0);
    expect(critere === idx[0] - 1 || critere === idx[idx.length - 1] + 1, `ordre : ${JSON.stringify(libelles)}`).toBe(true);
  });
  it('sans critère (carnet classé par le prix, garde-fou) : prix, dispo, vendeur se suivent', () => {
    const libelles = lignesRendues(carnetDe(FIX.marmite, { critere: false }));
    expect(contigu(libelles).ok, JSON.stringify(libelles)).toBe(true);
  });
  it('fiche (garde-fou) : vendeur, disponibilité et prix sont UN seul bloc « Offre » ; la jauge du critère n\'y entre pas', () => {
    const f = fiche(carnetDe(FIX.marmite), 0);
    const offre = f.querySelector('.cn-offre')!;
    expect(visible(offre), visible(offre)).toMatch(/Galaxus-exemple.*en stock.*302\s?CHF/);
    expect(offre.querySelector('.cn-piste, .cn-heros'), 'le héros n\'est pas dans l\'offre').toBeNull();
  });
  it('carte de la feuille Articles (garde-fou) : vendeur, disponibilité et prix avant le critère du pied', () => {
    const c = feuille(carnetDe(FIX.marmite));
    const carte = c.querySelector('.cn-classee')!;
    const ordre = [...carte.querySelectorAll('.cn-classee-tx, .cn-classee-prix, .cn-classee-pied')].map(e => e.className);
    expect(ordre.findIndex(x => /prix/.test(x)), 'le prix précède le pied').toBeLessThan(ordre.findIndex(x => /pied/.test(x)));
  });
});

/* ======================================================================================================== R30 */

/**
 * R30 (C50-5, sa réponse « Oui » du 24.11 : « faut-il que le compromis de Comparer dise ce qu'on gagne et ce qu'on perd ? ») : le compromis de
 * Comparer dit ce qu'on gagne et ce qu'on perd entre les articles (écart de prix contre écart sur le critère, ou sur ce qui distingue les
 * articles ; ex. « +289,77 CHF pour 4,06 m³ au lieu de 2,6 »), avec ou sans critère ; il ne recopie pas seulement le tableau (tour 50 :
 * « la 1re, 2 697,74 CHF, la moins chère » ; « la 1re, le volume 242 L ; 302 CHF, la moins chère »).
 * Les tests ne figent AUCUNE formulation : ils cherchent l'écart de prix (« 289,77 », « 218 »), les valeurs qui distinguent les articles
 * (« 4,06 », « 50 L ») et un mot de différence (« de plus », « de moins », « au lieu de », « contre »).
 * Endroits (grep `compromisDe`, `compromis`) : le calcul (`compromisDe`, comparer.ts l.736-800 : quatre sorties : « la 2e, … de moins que la
 * 1re » quand un article moins cher tient les critères ; « la seule … » ; sans critère ; « la 1re, <critères> ; <prix>, la moins chère ») ;
 * l'encadré de Comparer (Comparer.tsx l.396-400, 518-524 : le calcul local, ou le compromis de l'IA passé en prop, jamais généré côté serveur :
 * grep `compromis` dans functions/src : aucun) ; rien d'autre ne dit de compromis (Choisir, fiche, feuille : aucun).
 * Le test caduc de c48Regles R4 (cas avec critère : la phrase de la maquette g01-8) est mis en .skip : sa réponse le remplace.
 */
describe('R30 : le compromis de Comparer dit ce qu\'on gagne et ce qu\'on perd', () => {
  const DIFFERENCE = /de plus|de moins|au lieu de|contre|plus cher|moins cher|en plus|en moins/;
  const phraseDe = (c: CarnetDoc) => compromisDe(tableau(c)) ?? '';
  const normalise = (s: string) => sans(s);

  it('cas du tour 50 « cellule » (critère « Température à 4 °C » qui ne départage pas : mêmes valeurs ; la 1re est la moins chère) : l\'écart de prix et le volume qui distingue sont dits', () => {
    const p = normalise(phraseDe(carnetDe(FIX.cellule)));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).toMatch(/4,06/);
    expect(p, `« ${p} »`).toMatch(DIFFERENCE);
  });
  it('cas du tour 50 « marmite » (critère « Volume utile : 50 L », la 1re : 242 L à 302 CHF, la 2e : 50 L à 520 CHF) : l\'écart de prix (218 CHF) et l\'écart du critère (242 L contre 50 L) sont dits', () => {
    const p = normalise(phraseDe(carnetDe(FIX.marmite)));
    expect(p, `« ${p} »`).toMatch(/\b218(?:,00)?\s?chf/);
    expect(p, `« ${p} »`).toMatch(/\b50\s?l\b/);
    expect(p, `« ${p} »`).toMatch(/\b242\s?l\b/);
    expect(p, `« ${p} »`).toMatch(DIFFERENCE);
  });
  it('un critère qui n\'a aucune valeur sur les articles (aucun ne porte « Température ») : la phrase de « sans critère », avec l\'écart de prix', () => {
    const sansValeur = { ...FIX.cellule, articles: FIX.cellule.articles.map(a => ({ ...a, lignes: a.lignes.filter(l => l.nom !== 'Température') })) };
    const p = normalise(phraseDe(carnetDe(sansValeur)));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).toMatch(DIFFERENCE);
  });
  it('sans critère (garde-fou, c48Regles R4 le contraint aussi) : l\'écart de prix est dit', () => {
    const p = normalise(phraseDe(carnetDe(FIX.cellule, { critere: false })));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).toMatch(DIFFERENCE);
  });
  it('un article moins cher qui perd sur le critère (garde-fou : la 1re, 4,06 m³ à 2 987,51 ; la 2e, 2,6 m³ à 2 697,74) : le gain (289,77 de moins) et la perte (2,6 au lieu de 4,06) sont dits', () => {
    const c = carnetDe({ ...FIX.cellule, critere: { texte: 'Volume de 2 m³', nom: 'Volume', unite: 'm³', sens: 'plus' } });
    const p = normalise(phraseDe(c));
    expect(p, `« ${p} »`).toMatch(/289,77/);
    expect(p, `« ${p} »`).toMatch(/2,6/);
    expect(p, `« ${p} »`).toMatch(/4,06/);
    expect(p, `« ${p} »`).toMatch(DIFFERENCE);
  });
  for (const [nom, fabrique] of [['marmite', () => carnetDe(FIX.marmite)], ['cellule', () => carnetDe(FIX.cellule)]] as const) {
    it(`Comparer rendu (${nom}) : l'encadré « Compromis » dit l'écart entre les deux prix, pas seulement le prix de la 1re`, () => {
      const c = fabrique();
      const t = tableau(c)!;
      const prix = t.lignes.map(l => l.prixCentimes!).sort((a, b) => a - b);
      const ecart = Math.round(prix[1] - prix[0]);
      const chaine = (ecart / 100).toFixed(2).replace('.', ',').replace(/,00$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ?');
      const encart = comparer(c).querySelector('.cn-compromis');
      expect(encart, 'un encadré de compromis').toBeTruthy();
      expect(sans(visible(encart!)), visible(encart!)).toMatch(new RegExp(chaine));
    });
  }
  it('le compromis d\'une IA qui recopie seulement le tableau (« la 1re, 2 697,74 CHF, la moins chère ») ne tient pas lieu de compromis : l\'écran dit l\'écart de prix', () => {
    const c = carnetDe(FIX.cellule);
    const encart = comparer(c, 'la 1re, 2 697,74 CHF, la moins chère').querySelector('.cn-compromis');
    expect(encart, 'un encadré de compromis').toBeTruthy();
    expect(sans(visible(encart!)), visible(encart!)).toMatch(/289,77/);
  });
});
