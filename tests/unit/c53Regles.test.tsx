// @vitest-environment jsdom
/**
 * Voie c53-tests (24.11) : les tests ROUGES des règles R16, R17, R18 tirées du test en ligne du tour 53 (C53-1 à C53-5).
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c53-tests/DOSSIER.md), avant tout correctif : celui qui corrige
 * n'écrit pas le test. Aucun réseau réel, aucun Gemini. Données : tests/fixtures/c53/houblons.json (deux houblons réécrits à la main),
 * tests/fixtures/c52/caracteristiques.json (la chambre froide, déjà là), des prix et des noms fictifs ; aucune donnée personnelle.
 *
 * Les tests lisent ce que le brasseur voit (texte rendu, ordre des lignes, étiquettes de la courbe) ; aucun nom de composant ni de prop
 * nouveau n'est supposé. Limite : jsdom ne mesure rien. R17 (« jamais coupé entre le nombre et l'unité ») se lit donc dans le DOM : un
 * espace insécable entre le nombre et l'unité, ou un `white-space: nowrap` posé (CSS de src/ui/carnets lue, ou style en ligne) sur l'élément qui
 * porte le prix ; R18 mesure les étiquettes avec une largeur de texte fixe (0,5 em par signe, ordre de grandeur d'une police sans empattement),
 * le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { trierParDecision } from '../../functions/src/lienFusion';
import { prioriserValeurs } from '../../functions/src/lienLibelles';
import { lireLien } from '../../functions/src/lireLien';
import { ajouterJours } from '../../src/domain/calendrier';
import { courbeCaisse, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import type { EscalierCaisse, Marche as MarcheCaisse } from '../../src/domain/finance/analyse';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { geometrie, obstaclesZero, placerNoms } from '../../src/ui/calendrier/entete/Courbe';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { PrixPastille } from '../../src/ui/carnets/PrixPastille';
import { TableauCarnet, colonnesCarnet } from '../../src/ui/carnets/TableauCarnet';
import { Escalier as EscalierCaisseVue } from '../../src/ui/finance/analyse/Escalier';
import { EscalierSvg, texteEtiquette, texteLot } from '../../src/ui/finance/previsions/EscalierSvg';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';

afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Sans accent, en minuscules, espaces simples (insécables compris) : « Bêta » → « beta ». */
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
const GENRES = JSON.parse(readFileSync('tests/fixtures/c52/caracteristiques.json', 'utf8')) as Record<'cellule' | 'carnet' | 'ks240l', Ligne[]>;
const HOUBLONS = JSON.parse(readFileSync('tests/fixtures/c53/houblons.json', 'utf8')) as Record<'citra' | 'mosaic', Ligne[]>;
delete (HOUBLONS as Record<string, unknown>)._source;
/** Comme la lecture en ligne l'a donné (carte du tour 53 : « Alpha 12,8 % ») : la valeur et son unité dans un seul texte, sans `unite`. */
const enTexte = (l: Ligne[]): Ligne[] => l.map(x => ({ nom: x.nom, valeur: x.unite ? `${x.valeur} ${x.unite}` : x.valeur }));

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};
const val = (valeur: string | number, unite?: string): Valeur => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' }) as Valeur;

/** Les façons dont deux pages du même vendeur rangent les mêmes lignes : l'ordre de la page ne dit rien de la décision. */
const PAGES: Array<[string, <T>(l: T[]) => T[]]> = [
  ['dans l\'ordre de la page', l => [...l]],
  ['inversée', l => [...l].reverse()],
  ['décalée de 7', l => [...l.slice(7), ...l.slice(0, 7)]],
  ['impairs puis pairs', l => [...l.filter((_, i) => i % 2 === 1), ...l.filter((_, i) => i % 2 === 0)]]
];

interface ArticleTest { id: string; nom: string; valeurs: Article['valeurs']; prix?: number; dispo?: string; vendeur?: string; devise?: string }
function carnet(articles: ArticleTest[], criteres: Critere[] = [], titre = 'Chambre froide'): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: titre,
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo ?? 'en stock',
        ...(a.vendeur ? { vendeur: a.vendeur } : {}),
        valeurs: a.valeurs, ...(a.prix !== undefined ? { prixCentimes: a.prix, devise: a.devise ?? 'CHF', taxe: 'ht' as const } : {})
      }) as Article)
    }
  } as CarnetDoc;
}
const critere = (texte: string, nom: string, sens: 'plus' | 'moins' | 'texte' | 'oui-non', unite?: string): Critere =>
  ({ id: 'K1', texte, origine: 'vous', caracteristique: { nom, ...(unite ? { unite } : {}), sens } } as Critere);
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;

const fiche = (c: CarnetDoc, i = 0, plus: Record<string, unknown> = {}) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} {...plus} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;
const tableauDuCarnet = (c: CarnetDoc) =>
  render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} sep={null} onOuvrir={nop} />).container;
const comparer = (c: CarnetDoc) =>
  render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop} />).container;

/** Les libellés de la grille de la fiche, dans l'ordre où le brasseur les lit. */
const libellesDeFiche = (c: HTMLElement) => [...c.querySelectorAll('dl dt')].map(e => (e.textContent ?? '').trim());
const indices = (n: string[], re: RegExp) => n.map((x, i) => (re.test(x) ? i : -1)).filter(i => i >= 0);
const colles = (idx: number[]) => idx.length > 0 && Math.max(...idx) - Math.min(...idx) + 1 === idx.length;

/* ======================================================================================================== R16 */

/**
 * R16 (C53-1, C53-2, C53-3) : les caractéristiques se rangent PAR GROUPES, comme un acheteur ou un brasseur les lit ; jamais par ordre
 * alphabétique à l'intérieur d'un groupe de mesures.
 *  - acides ensemble (alpha, bêta, cohumulone) puis huiles (totales, puis chaque huile par part DÉCROISSANTE) ;
 *  - dimensions ensemble (extérieures, intérieures, puis la porte : hauteur et largeur côte à côte) ;
 *  - énergie ensemble (puissance, consommation, tension), avant la couleur et la tôle ;
 *  - la carte (résumé) reprend la tête de la fiche d'un houblon : alpha, récolte, huiles totales, jamais une huile mineure.
 * Les endroits qui rangent des caractéristiques : la fiche (grille), le résumé de la carte, la lecture serveur (`lireLien`,
 * `prioriserValeurs`), l'ordre de décision (`trierParDecision`) et l'article déjà rangé (`lireCarnet`).
 * Récolte est la seule ligne tolérée entre les acides (elle n'est ni un acide ni une huile) ; sa place exacte n'est pas dictée.
 */
const ACIDE = /^(?:alpha|beta|cohumulone)\b/;
const HUILE_TOTALE = /^huiles? totales?\b/;
const HUILE = /^(?:myrcene|humulene|caryophyllene|farnesene)\b/;
const ordreAttenduDesHuiles = (lignes: Ligne[]) =>
  lignes.filter(l => HUILE.test(sans(l.nom))).sort((a, b) => Number(b.valeur.replace(',', '.')) - Number(a.valeur.replace(',', '.'))).map(l => sans(l.nom));

/** Une propriété de rangement à la fois, pour qu'un correctif ne cache pas l'autre : « combien et quels problèmes ? » */
type ProprieteHoublon = 'acides' | 'huiles';
type ProprieteChambre = 'dimensions' | 'porte' | 'energie';

/** Les libellés d'un houblon : les acides ensemble (avant les huiles), puis les huiles, la totale d'abord, chaque huile par part décroissante. */
function attendreHoublon(libelles: string[], lignes: Ligne[], quoi: readonly ProprieteHoublon[] = ['acides', 'huiles']) {
  const n = libelles.map(sans);
  const contexte = `ordre lu : ${n.join(' | ')}`;
  expect(n.length, contexte).toBeGreaterThan(8);
  const tot = n.findIndex(x => HUILE_TOTALE.test(x));
  expect(tot, contexte).toBeGreaterThanOrEqual(0);
  if (quoi.includes('acides')) {
    const acides = indices(n, ACIDE);
    expect(acides, `trois acides (alpha, bêta, cohumulone) ; ${contexte}`).toHaveLength(3);
    const entre = Array.from({ length: Math.max(...acides) - Math.min(...acides) + 1 }, (_, k) => Math.min(...acides) + k).filter(i => !acides.includes(i)).map(i => n[i]);
    expect(entre.every(x => /^recolte\b/.test(x)), `les acides ensemble, rien d'autre que la récolte entre eux ; ${contexte}`).toBe(true);
    expect(Math.max(...acides), `les acides avant les huiles ; ${contexte}`).toBeLessThan(tot);
  }
  if (quoi.includes('huiles')) {
    const attendu = ordreAttenduDesHuiles(lignes);
    const suite = n.slice(tot + 1, tot + 1 + attendu.length).map(x => x.split(' ')[0]);
    expect(suite, `après les huiles totales, chaque huile par part décroissante, sans rien d'autre au milieu ; ${contexte}`).toEqual(attendu);
  }
}

/** Les libellés d'une chambre froide : dimensions ensemble (ext., int., puis la porte) ; hauteur et largeur de la porte côte à côte ; énergie ensemble avant la couleur et la tôle. */
function attendreChambre(libelles: string[], quoi: readonly ProprieteChambre[] = ['dimensions', 'porte', 'energie']) {
  const n = libelles.map(sans);
  const contexte = `ordre lu : ${n.join(' | ')}`;
  expect(n.length, contexte).toBeGreaterThan(10);
  if (quoi.includes('dimensions')) {
    const dims = indices(n, /^(?:dimensions|hauteur|largeur|profondeur|longueur)\b/);
    expect(colles(dims), `les dimensions ensemble ; ${contexte}`).toBe(true);
    const exterieures = indices(n, /^(?:dimensions ext|hauteur de l.unite|largeur de l.unite|profondeur de l.unite)/);
    const interieures = indices(n, /^dimensions int/);
    const porte = indices(n, /\bporte\b/);
    expect(exterieures.length, contexte).toBeGreaterThan(0);
    expect(interieures.length, contexte).toBeGreaterThan(0);
    expect(Math.max(...exterieures), `les extérieures avant les intérieures ; ${contexte}`).toBeLessThan(Math.min(...interieures));
    expect(Math.max(...interieures), `les intérieures avant la porte ; ${contexte}`).toBeLessThan(Math.min(...porte));
  }
  if (quoi.includes('porte')) {
    const porte = indices(n, /\bporte\b/);
    expect(porte, `hauteur et largeur de la porte ; ${contexte}`).toHaveLength(2);
    expect(Math.abs(porte[0] - porte[1]), `la hauteur et la largeur de la porte côte à côte ; ${contexte}`).toBe(1);
  }
  if (quoi.includes('energie')) {
    const energie = indices(n, /^(?:performance|puissance|consommation|tension|branchement)\b/);
    expect(energie.length, contexte).toBeGreaterThanOrEqual(2);
    expect(colles(energie), `la puissance et la tension ensemble ; ${contexte}`).toBe(true);
    const peau = indices(n, /^(?:couleur|materiau|epaisseur|densite)\b/);
    expect(peau.length, contexte).toBeGreaterThan(0);
    expect(Math.max(...energie), `l'énergie avant la couleur et la tôle ; ${contexte}`).toBeLessThan(Math.min(...peau));
  }
}
const PROPRIETES_HOUBLON: Array<[ProprieteHoublon, string]> = [['acides', 'les acides ensemble (alpha, bêta, cohumulone)'], ['huiles', 'les huiles par part décroissante']];
const PROPRIETES_CHAMBRE: Array<[ProprieteChambre, string]> = [['dimensions', 'dimensions ensemble'], ['porte', 'porte côte à côte'], ['energie', 'énergie ensemble avant la couleur et la tôle']];

describe('R16 : les caractéristiques se rangent par groupes (acides, huiles, dimensions, énergie), jamais par ordre alphabétique dans un groupe', () => {
  for (const [genre, lignes] of Object.entries(HOUBLONS) as Array<[string, Ligne[]]>) {
    for (const [quoi, dit] of PROPRIETES_HOUBLON) {
      for (const [page, permuter] of PAGES) {
        it(`fiche d'un houblon (${genre}), page ${page} : ${dit}`, () => {
          const c = carnet([{ id: 'H1', nom: `Houblon ${genre}`, valeurs: valeursDe(permuter(lignes)) }], [], 'Houblons');
          attendreHoublon(libellesDeFiche(fiche(c)), lignes, [quoi]);
        });
      }
      it(`article déjà rangé (lireCarnet) · houblon ${genre} : la fiche dit ${dit}`, () => {
        const c = lireCarnet(carnet([{ id: 'H1', nom: `Houblon ${genre}`, valeurs: valeursDe([...lignes].reverse()) }], [], 'Houblons') as never)!;
        attendreHoublon(libellesDeFiche(fiche(c)), lignes, [quoi]);
      });
      it(`lecture serveur (prioriserValeurs) · houblon ${genre}, page inversée : ${dit}`, () => {
        attendreHoublon(prioriserValeurs([...lignes].reverse().map(l => ({ nom: l.nom, valeur: l.valeur, ...(l.unite ? { unite: l.unite } : {}) })) as never[]).map((v: { nom: string }) => v.nom), lignes, [quoi]);
      });
    }
    it(`résumé de la carte · houblon ${genre} : alpha, récolte, huiles totales, dans cet ordre ; aucune huile mineure`, () => {
      const c = carnet([{ id: 'H1', nom: `Houblon ${genre}`, valeurs: valeursDe(enTexte(lignes)) }], [], 'Houblons');
      const texte = sans(render(<CarteArticle article={contenu(c).articles[0]} onOuvrir={nop} />).container.textContent ?? '');
      const pos = ['alpha', 'recolte', 'huiles totales'].map(m => texte.indexOf(m));
      expect(pos.every(p => p >= 0), `alpha, récolte et huiles totales sont dits sur la carte : « ${texte} »`).toBe(true);
      expect(pos[0] < pos[1] && pos[1] < pos[2], `dans l'ordre alpha, récolte, huiles totales : « ${texte} »`).toBe(true);
      expect(texte, 'une huile qui ne sert pas à choisir').not.toMatch(/caryophyllene|farnesene/);
    });
    it(`résumé de la carte · houblon ${genre}, page inversée : le même résumé`, () => {
      const lu = (l: Ligne[]) => sans(render(<CarteArticle article={contenu(carnet([{ id: 'H1', nom: 'Houblon', valeurs: valeursDe(enTexte(l)) }], [], 'Houblons')).articles[0]} onOuvrir={nop} />).container.textContent ?? '');
      const a = lu(lignes);
      cleanup();
      expect(lu([...lignes].reverse())).toBe(a);
    });
  }

  for (const [page, permuter] of PAGES) {
    for (const [quoi, dit] of PROPRIETES_CHAMBRE) {
      it(`fiche d'une chambre froide, page ${page} : ${dit}`, () => {
        const c = carnet([{ id: 'C1', nom: 'Chambre froide', valeurs: valeursDe(permuter(GENRES.cellule)) }]);
        attendreChambre(libellesDeFiche(fiche(c)), [quoi]);
      });
    }
    it(`fiche d'une chambre froide déjà rangée (lireCarnet), page ${page} : mêmes groupes`, () => {
      const c = lireCarnet(carnet([{ id: 'C1', nom: 'Chambre froide', valeurs: valeursDe(permuter(GENRES.cellule)) }]) as never)!;
      attendreChambre(libellesDeFiche(fiche(c)));
    });
    it(`ordre de décision (trierParDecision), page ${page} : mêmes groupes pour une chambre froide`, () => {
      attendreChambre(trierParDecision(permuter(GENRES.cellule)).map(l => l.nom));
    });
    it(`lecture serveur (prioriserValeurs), page ${page} : mêmes groupes pour une chambre froide`, () => {
      attendreChambre(prioriserValeurs(permuter(GENRES.cellule).map(l => ({ nom: l.nom, valeur: l.valeur, ...(l.unite ? { unite: l.unite } : {}) })) as never[]).map((v: { nom: string }) => v.nom));
    });
  }

  /* Le chemin complet : la page HTML → lireLien (réseau simulé, sans IA) → les noms lus, dans l'ordre où la fiche les recevra. */
  const HTML = readFileSync('tests/fixtures/c48/chambre-froide-1800.html', 'utf8');
  const SPEC = /<section class="product-specs">[\s\S]*?<\/section>/.exec(HTML)![0];
  const pageAvec = (lignes: Ligne[]) => HTML.split(SPEC).join(
    `<section class="product-specs"><h2>Caractéristiques techniques</h2><ul>${lignes.map(l => `<li>${l.nom} : ${l.valeur}${l.unite ? ` ${l.unite}` : ''}</li>`).join('')}</ul></section>`
  );
  const URL_PAGE = 'https://www.grossiste-exemple.ch/fr-ch-chf/chambre-froide-1800-x-1500';
  async function lire(html: string) {
    const fetchPage = (async (entree: RequestInfo | URL) => {
      const url = String(entree);
      if (url.endsWith('/robots.txt')) return new Response('', { status: 404, headers: { 'content-type': 'text/plain' } });
      if (url === URL_PAGE) return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
      throw new Error(`réseau interdit dans les tests : ${url}`);
    }) as unknown as typeof fetch;
    return lireLien(URL_PAGE, { fetchPage, maintenant: 1, cours: null });
  }
  for (const [page, permuter] of PAGES) {
    for (const [quoi, dit] of PROPRIETES_CHAMBRE) {
      it(`lireLien · chambre froide, page ${page} : ${dit}, déjà rangé à la lecture`, async () => {
        const p = await lire(pageAvec(permuter(GENRES.cellule)));
        expect(p.statut).toBe('lue');
        attendreChambre((p.valeurs ?? []).map(v => v.nom), [quoi]);
      });
    }
  }
  for (const [quoi, dit] of PROPRIETES_HOUBLON) {
    it(`lireLien · houblon (page inversée) : ${dit}, déjà rangé à la lecture`, async () => {
      const p = await lire(pageAvec([...HOUBLONS.citra].reverse()));
      expect(p.statut).toBe('lue');
      attendreHoublon((p.valeurs ?? []).map(v => v.nom).filter(nom => HOUBLONS.citra.some(l => sans(l.nom) === sans(nom))), HOUBLONS.citra, [quoi]);
    });
  }
});

/* ======================================================================================================== R17 */

/**
 * R17 (C53-4) : un prix unitaire (« 10,40 CHF/L ») ou un montant avec son unité n'est jamais coupé entre le nombre et l'unité, dans toute
 * colonne ou pastille du Carnet. jsdom ne mesure pas la mise en page : « jamais coupé » se lit dans le DOM, c'est-à-dire (a) un espace
 * insécable (U+00A0 ou U+202F) entre le nombre et l'unité, ou (b) un `white-space: nowrap` sur l'élément qui porte la ligne ou l'un de ses
 * ancêtres (CSS de src/ui/carnets lue, ou style en ligne). Même exigence pour la quantité qui précède (« 50 L · »).
 * Non testé volontairement : la pastille de prix empile « 520 » puis « CHF » (maquette B1, D419, choix du brasseur : règle n° 1).
 * Les endroits qui disent un prix unitaire : la colonne du tableau, la pastille de prix (feuille Articles, carte, fiche), le détail du
 * prix de la fiche, la ligne de prix de Comparer. Les valeurs de colonne (« 1845 mm », « 550 W ») sont déjà insécables (C48-6).
 */
/* La cascade de `white-space`, lue dans le CSS de src/ui/carnets : toutes les règles qui le posent, dans l'ordre des fichiers (la spécificité n'est
   pas calculée : la règle posée en dernier et qui vise l'élément gagne, un !important gagne sur le reste) ; les règles d'une @media (min-width: N px)
   au-delà de 390 px sont écartées. `white-space` s'hérite : on remonte jusqu'au premier ancêtre dont une règle le pose. */
const CSS_CARNETS = readdirSync('src/ui/carnets').filter(f => f.endsWith('.css')).sort().map(f => readFileSync(`src/ui/carnets/${f}`, 'utf8')).join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/@media[^{]*\(min-width:\s*(\d+)px\)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (bloc, largeur) => (Number(largeur) > 390 ? '' : bloc));
const REGLES_WHITE_SPACE: Array<{ sel: string; valeur: string; important: boolean }> = [];
for (const m of CSS_CARNETS.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const d = /white-space\s*:\s*([\w-]+)\s*(!important)?/.exec(m[2]);
  if (d) REGLES_WHITE_SPACE.push({ sel: m[1].replace(/@media[^{]*/, '').trim(), valeur: d[1], important: !!d[2] });
}
const vise = (e: Element, sel: string): boolean => { try { return e.matches(sel); } catch { return false; } };
const whiteSpaceDe = (el: Element): string => {
  for (let e: Element | null = el; e; e = e.parentElement) {
    const enLigne = (e as HTMLElement).style?.whiteSpace;
    if (enLigne) return enLigne;
    const regles = REGLES_WHITE_SPACE.filter(r => vise(e!, r.sel));
    if (regles.length) return (regles.filter(r => r.important).pop() ?? regles[regles.length - 1]).valeur;
  }
  return 'normal';
};
/** Vrai si la ligne ne se coupe nulle part (l'effet du `nowrap` qui reste en vigueur sur elle, une fois toutes les règles passées). */
const protege = (el: Element): boolean => whiteSpaceDe(el) === 'nowrap';
const PRIX_UNITAIRE = /\d[\d\s  '’.,]*\d\s*CHF\s*\/\s*(?:L|kg)/;
const QUANTITE_AVANT = /(\d+(?:[.,]\d+)?)([ \t]+)(L|kg|g|ml|cl|dl)(?=\s*·)/;
/** Les lignes de prix unitaire d'un rendu, et ce qui peut s'y couper ; une ligne dont le nombre et l'unité sont dans deux éléments est signalée. */
function prixUnitaires(racine: HTMLElement) {
  const feuilles = [...racine.querySelectorAll('*')].filter(e => e.children.length === 0 && PRIX_UNITAIRE.test(e.textContent ?? ''));
  const lignes = feuilles.map(el => {
    const texte = el.textContent ?? '';
    const prix = PRIX_UNITAIRE.exec(texte)![0];
    const qte = QUANTITE_AVANT.exec(texte);
    const garde = protege(el);
    const coupures: string[] = [];
    if (/[ \t\r\n]/.test(prix) && !garde) coupures.push(`« ${prix} » (espace ordinaire entre le nombre et l'unité, ligne non protégée)`);
    if (qte && !garde) coupures.push(`« ${qte[0]} » (la quantité se coupe de son unité)`);
    return { texte: texte.replace(/ /g, '·nbsp·'), coupures };
  });
  const coupeEnDeux = feuilles.length === 0 && PRIX_UNITAIRE.test([...racine.querySelectorAll('*')].map(e => (e.children.length ? '' : e.textContent ?? '')).join(' '));
  return { lignes, coupeEnDeux };
}
function attendrePrixUnitaireEntier(racine: HTMLElement, ou: string) {
  const { lignes, coupeEnDeux } = prixUnitaires(racine);
  expect(coupeEnDeux, `${ou} : le nombre et « CHF/L » sont dans deux éléments`).toBe(false);
  expect(lignes.length, `${ou} : un prix unitaire est dit (à contrôler)`).toBeGreaterThan(0);
  for (const l of lignes) expect(l.coupures, `${ou} : « ${l.texte} »`).toEqual([]);
}

const marmites = () => carnet([
  { id: 'M1', nom: 'Marmite de brassage inox 50 L', valeurs: { Volume: val(50, 'L') }, prix: 52000 },
  { id: 'M2', nom: 'Marmite de brassage inox 80 L', valeurs: { Volume: val(80, 'L') }, prix: 79000 }
], [critere('Volume', 'Volume', 'plus', 'L')], 'Marmite');
const houblons = () => carnet([
  { id: 'H1', nom: 'Mosaic Pellets T90 100 g', valeurs: { 'Alpha acides': val(11.5, '%') }, prix: 725 },
  { id: 'H2', nom: 'Citra Pellets T90 1 kg', valeurs: { 'Alpha acides': val(12, '%') }, prix: 7250 }
], [critere('Alpha acides', 'Alpha acides', 'plus', '%')], 'Houblons');

describe('R17 : un prix unitaire ou un montant avec son unité ne se coupe jamais entre le nombre et l\'unité', () => {
  for (const [nom, fabrique] of [['marmite (50 L, 520 CHF : 10,40 CHF/L)', marmites], ['houblon (1 kg, 72,50 CHF/kg)', houblons]] as const) {
    it(`colonne de prix du tableau du carnet · ${nom}`, () => {
      const c = fabrique();
      expect(colonnesCarnet(tableau(c)! as never).findIndex(k => k.cle === '__prix')).toBeGreaterThanOrEqual(0);
      /* D451 disparaît n° 7 : le tableau d'un carnet de houblons dit « CHF/kg » en tête de colonne et le prix au kilo dans la cellule ; le prix unitaire dit dans la ligne du nom n'y est plus */
      if (nom.startsWith('houblon')) { expect(tableauDuCarnet(c).textContent).toContain('CHF/kg'); return; }
      attendrePrixUnitaireEntier(tableauDuCarnet(c), 'tableau du carnet');
    });
    it(`pastille de prix seule (PrixPastille) · ${nom}`, () => {
      const a = contenu(fabrique()).articles[1];
      attendrePrixUnitaireEntier(render(<PrixPastille article={a} />).container, 'pastille de prix');
    });
    it(`pastille de prix de la feuille Articles (cartes classées) · ${nom}`, () => {
      attendrePrixUnitaireEntier(feuille(fabrique()), 'feuille Articles');
    });
    it(`ligne de détail du prix de la carte (detailPrix) · ${nom}`, () => {
      const a = contenu(fabrique()).articles[1];
      attendrePrixUnitaireEntier(render(<CarteArticle article={a} onOuvrir={nop} />).container, 'carte de l\'article');
    });
    it(`fiche d'article entière · ${nom}`, () => {
      attendrePrixUnitaireEntier(fiche(fabrique(), 1), 'fiche');
    });
    it(`ligne de prix de Comparer · ${nom}`, () => {
      attendrePrixUnitaireEntier(comparer(fabrique()), 'Comparer');
    });
  }
});

/* ======================================================================================================== R18 */

/**
 * R18 (C53-5) : sur la courbe de Finances › Prévisions (et toute courbe qui a des bulles d'événements), chaque marche notable porte une
 * étiquette avec son nom et son montant, posée sur SA marche ; deux événements le même jour : « <nom> + 1 autre −159,95 » comme au tour 52 ;
 * un préfixe n'est jamais doublé (« ZZ TEST — ZZ TEST — achat »).
 * Pourquoi l'étiquette du tour 52 a disparu au tour 53 (K51-1 est le correctif de la courbe du CALENDRIER, `Courbe.tsx` ; la bulle de
 * Prévisions du tour 52 venait de `texteLot`, PC-117) : aux deux tours le texte du lot dit « <plus gros nom> + 1 autre −159,95, 08.12 » ; au
 * tour 53 les libellés de test portaient le préfixe deux fois, le texte passe de 45 à 55 signes, ne tient plus dans les 334 px du tracé à
 * 390, et `placerEtiquettes` le jette dans `reste` : seul `compacts` (réservé aux projets de matériel) offre une forme plus courte, un lot n'en a
 * aucune. Le repli manque, et le préfixe doublé n'est jamais retiré. Les tests ci-dessous le rejouent à 390 px avec une largeur de texte fixe.
 */
/** Un préfixe répété, entier ou coupé après quelques signes (« ZZ TEST — ZZ TEST — achat », « ZZ TEST — ZZ T… »). */
const PREFIXE_DOUBLE = { test: (t: string): boolean => {
  const m = /^(\S[^—–]{2,30}?)\s[—–]\s(.*)$/.exec(t.trim());
  return !!m && m[2].startsWith(m[1].slice(0, Math.min(4, m[1].length)));
} };
const mesure05 = (texte: string, corps: number) => Math.ceil([...texte].length * corps * 0.5);
const sortie = (id: string, date: string, label: string, amountCents: number, plus: Partial<ForecastItem> = {}): ForecastItem =>
  ({ id, date, label, amountCents, direction: 'out', source: 'invoice', category: 'achats', ...plus });

/** L'état du test en ligne du tour 53 : départ 1 145, un loyer de 625,28 le 02.12, deux achats le 08.12 (79,95 et 80,00), un achat partiel de 2,40 le 13.12. */
const itemsTour53 = (prefixe: string): ForecastItem[] => [
  sortie('loyer', '2026-12-02', 'Loyer de l’atelier', 62528),
  sortie('a1', '2026-12-08', `${prefixe}achat`, 7995),
  sortie('a2', '2026-12-08', `${prefixe}achat rond`, 8000),
  sortie('a3', '2026-12-13', 'achats', 240, { partial: ['prix de la ligne'] })
];
function previsions(items: ForecastItem[]) {
  const e = construireEscalier({ departCents: 114500, items, debut: '2026-11-24', fin: '2027-02-22' });
  const restes: string[][] = [];
  const { container } = render(<EscalierSvg e={e} largeur={390} asOf="2026-11-24" onEtiquette={nop} onRestes={r => restes.push(r)} mesure={mesure05} />);
  const bulles = [...container.querySelectorAll('g.prv-etq')].map(g => ({
    texte: (g.querySelector('.prv-tx')?.textContent ?? '').trim(),
    x: Number(g.querySelector('circle.prv-pt')?.getAttribute('cx'))
  }));
  const xMarches = [...(container.querySelector('path.prv-step')?.getAttribute('d') ?? '').matchAll(/H([\d.]+) V/g)].map(m => Number(m[1]));
  return { bulles, xMarches, restes: restes.flat() };
}

describe('R18 : la marche notable porte une étiquette avec son nom et son montant, posée sur SA marche, un préfixe jamais doublé', () => {
  it('Prévisions, un seul préfixe (état du tour 52, garde-fou) : la marche du 08.12 dit « … + 1 autre −159,95, 08.12 »', () => {
    const { bulles } = previsions(itemsTour53('ZZ TEST — '));
    const b = bulles.find(x => /159,95/.test(x.texte));
    expect(b, `bulles : ${bulles.map(x => x.texte).join(' | ')}`).toBeDefined();
    expect(b!.texte).toMatch(/achat rond \+ 1 autre/);
    expect(b!.texte).toMatch(/08\.12/);
  });
  it('Prévisions, libellés de test plus longs (tour 53) : la marche du 08.12 garde son étiquette avec le montant −159,95', () => {
    const { bulles, restes } = previsions(itemsTour53('ZZ TEST — ZZ TEST — '));
    const b = bulles.find(x => /159,95/.test(x.texte));
    expect(b, `la marche de −159,95 n'a plus d'étiquette ; bulles : ${bulles.map(x => x.texte).join(' | ')} ; sans place : ${restes.join(', ')}`).toBeDefined();
    expect(b!.texte, 'la bulle dit un nom, pas seulement le montant').toMatch(/achat/);
    expect(b!.texte).toMatch(/08\.12/);
  });
  it('Prévisions, libellés de test plus longs : la bulle est posée sur SA marche (le point d\'ancrage est celui du 08.12)', () => {
    const { bulles, xMarches } = previsions(itemsTour53('ZZ TEST — ZZ TEST — '));
    const b = bulles.find(x => /159,95/.test(x.texte));
    expect(b, `bulles : ${bulles.map(x => x.texte).join(' | ')}`).toBeDefined();
    expect(xMarches).toHaveLength(3);
    expect(b!.x).toBeCloseTo(xMarches[1], 0);
  });
  it('Prévisions, libellés de test plus longs : chaque marche notable (loyer, achats du 08.12, achat partiel) a son étiquette', () => {
    const { bulles, restes } = previsions(itemsTour53('ZZ TEST — ZZ TEST — '));
    const dit = bulles.map(x => x.texte).join(' | ');
    expect(dit, `sans place : ${restes.join(', ')}`).toMatch(/625,28/);
    expect(dit, `sans place : ${restes.join(', ')}`).toMatch(/159,95/);
    expect(dit, `sans place : ${restes.join(', ')}`).toMatch(/2,40/);
  });
  it('Prévisions : le texte d\'une étiquette de lot (texteLot) ne double pas le préfixe (« ZZ TEST — ZZ TEST — achat rond + 1 autre »)', () => {
    const t = texteLot(itemsTour53('ZZ TEST — ZZ TEST — ').filter(i => i.date === '2026-12-08'));
    expect(t, 'le lot nomme sa plus grosse écriture et la somme').toMatch(/159,95/);
    expect(PREFIXE_DOUBLE.test(t), `étiquette : « ${t} »`).toBe(false);
  });
  it('Prévisions : le texte d\'une étiquette seule (un plan daté, nom entier) ne double pas non plus le préfixe', () => {
    const t = texteEtiquette(sortie('x', '2026-12-08', 'ZZ TEST — ZZ TEST — achat', 7995, { source: 'plan' }));
    expect(t).toMatch(/79,95/);
    expect(PREFIXE_DOUBLE.test(t), `étiquette : « ${t} »`).toBe(false);
  });
  it('Prévisions : un plan daté au préfixe simple garde son nom entier (garde-fou)', () => {
    const t = texteEtiquette(sortie('x', '2026-12-08', 'ZZ TEST — achat', 7995, { source: 'plan' }));
    expect(t).toMatch(/^ZZ TEST — achat /);
  });

  /* Courbe de l'en-tête du Calendrier (K51-1, `placerNoms`) : même règle */
  const LUNDI0 = '2026-11-16';
  const jour = (semaine: number, plus = 2) => ajouterJours(LUNDI0, semaine * 7 + plus);
  const courbe = (mouvements: MouvementCaisse[]) => courbeCaisse({ depart: 100000, lundi0: LUNDI0, nbSemaines: 6, mouvements })!;
  const placer = (mouvements: MouvementCaisse[]) => {
    const c = courbe(mouvements);
    const g = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), 6, 366, 88, 4, 70);
    return placerNoms(c.semaines, g, 8, obstaclesZero(g, 366));
  };
  const deux = (prefixe: string): MouvementCaisse[] => [
    { id: 'a', jour: jour(2), centimes: -7995, nom: `${prefixe}achat` },
    { id: 'b', jour: jour(2), centimes: -8000, nom: `${prefixe}achat rond` }
  ];
  it('Calendrier, courbe de l\'en-tête, libellés de test plus longs : la marche du 08.12 dit son nom, « + 1 autre » et −159,95 (garde-fou)', () => {
    const e = placer(deux('ZZ TEST — ZZ TEST — ')).filter(x => x.i === 2);
    expect(e).toHaveLength(1);
    expect(e[0].montant).toBe('−159,95');
    expect(e[0].complet).toMatch(/\+ 1 autre/);
  });
  it('Calendrier, courbe de l\'en-tête : un préfixe n\'est jamais doublé dans l\'étiquette', () => {
    const e = placer(deux('ZZ TEST — ZZ TEST — ')).filter(x => x.i === 2);
    expect(e).toHaveLength(1);
    expect(PREFIXE_DOUBLE.test(e[0].complet), `étiquette : « ${e[0].complet} »`).toBe(false);
  });

  /* Finances › Analyse › Caisse (`Escalier.tsx`) : une courbe à bulles d'événements aussi */
  const marche = (id: string, date: string, cents: number, apres: number, libelle: string): MarcheCaisse =>
    ({ id, date, cents, apres, source: 'autres', libelle, txId: id, prevuCents: null, pasPrevu: false });
  const caisse = (prefixe: string): EscalierCaisse => ({
    du: '2026-11-24', au: '2027-02-22', depuis: null, connu: true, debutCents: 114500, finCents: 114500 - 7995 - 8000, ecartCents: -15995,
    marches: [marche('m1', '2026-12-08', -7995, 106505, `${prefixe}achat`), marche('m2', '2026-12-08', -8000, 98505, `${prefixe}achat rond`)],
    prevu: null, anDernier: { finCents: null, ecartCents: null, nombre: 0, points: [] }, pireBaisse: null, pasPrevu: [], incertains: []
  });
  const bullesAnalyse = (prefixe: string) => [...render(<EscalierCaisseVue esc={caisse(prefixe)} onTransaction={nop} onJournal={nop} />).container.querySelectorAll('.ana-et-t')].map(e => (e.textContent ?? '').replace(/\s+/g, ' ').trim());
  it('Analyse › Caisse : l\'étiquette garde un nom reconnaissable de l\'écriture, pas seulement le préfixe (« ZZ TEST — ZZ T… »)', () => {
    const t = bullesAnalyse('ZZ TEST — ');
    expect(t.length).toBeGreaterThan(0);
    for (const x of t) expect(x, `étiquette : « ${x} »`).toMatch(/achat/);
  });
  it('Analyse › Caisse : deux paiements du même jour, une marche, une étiquette « <nom> + 1 autre −159,95 » (comme Prévisions)', () => {
    const t = bullesAnalyse('ZZ TEST — ');
    expect(t, `étiquettes : ${t.join(' | ')}`).toHaveLength(1);
    expect(t[0]).toMatch(/\+ 1 autre/);
    expect(t[0]).toMatch(/159,95/);
  });
  it('Analyse › Caisse : un préfixe n\'est jamais doublé dans une étiquette', () => {
    const t = bullesAnalyse('ZZ TEST — ZZ TEST — ');
    expect(t.length).toBeGreaterThan(0);
    for (const x of t) expect(PREFIXE_DOUBLE.test(x), `étiquette : « ${x} »`).toBe(false);
  });
});
