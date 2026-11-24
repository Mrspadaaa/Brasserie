// @vitest-environment jsdom
/**
 * Voie c52-tests (24.11) : les tests ROUGES des règles R12..R15 tirées du test en ligne du tour 52 (C50-4 rouvert, C52-1, C52-2, C52-3).
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c52-tests/DOSSIER.md), pas depuis le code actuel, avant tout
 * correctif : celui qui corrige n'écrit pas le test. Aucun réseau réel, aucun Gemini. Données : tests/fixtures/c52/caracteristiques.json
 * (trois genres d'articles réécrits à la main), la page de tests/fixtures/c48/, des prix et vendeurs fictifs ; aucune donnée personnelle.
 *
 * Aucun nom de composant ni de prop nouveau n'est supposé : les tests lisent ce que le brasseur voit (texte rendu, ordre des lignes, la
 * jauge). Limite : jsdom ne mesure rien ; R15 se lit donc dans le TEXTE de la ligne (un espace, un séparateur ou un saut de ligne entre le
 * vendeur et le prix : ce que lit aussi une aide de lecture), la mise en page à 390 px reste à voir en ligne.
 *
 * Pourquoi la correction de c50-fix (R9) n'a pas tenu en ligne : voir RESULTAT.md. En bref, `rangDeDecision` ne connaît que quatorze familles de
 * noms ; tout autre nom (« Hauteur de la porte », « Épaisseur du matériel », « Densité d'isolation », « Exécution »…) reçoit le même rang
 * inconnu et garde l'ORDRE DE LA PAGE, qui change d'un article à l'autre. Les tests de c50 n'employaient que des noms connus.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { lireLien } from '../../functions/src/lireLien';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { PrixPastille } from '../../src/ui/carnets/PrixPastille';
import { TableauCarnet, colonnesCarnet } from '../../src/ui/carnets/TableauCarnet';

afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const norm = (s: string) => s.normalize('NFKC').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const nop = () => undefined;
type Ligne = { nom: string; valeur: string; unite?: string };
const GENRES = JSON.parse(readFileSync('tests/fixtures/c52/caracteristiques.json', 'utf8')) as Record<'cellule' | 'carnet' | 'ks240l', Ligne[]>;

/** Les valeurs d'un article, telles que la lecture les range : un nombre avec son unité, un mot ou une mesure en texte (comme c50Regles). */
const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};
const val = (valeur: string | number, unite?: string): Valeur => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' }) as Valeur;

/** Les quatre façons dont deux pages du même vendeur rangent les mêmes lignes : l'ordre de la page ne dit rien de la décision. */
const PERMUTATIONS: Array<[string, <T>(l: T[]) => T[]]> = [
  ['inversée', l => [...l].reverse()],
  ['décalée de 7', l => [...l.slice(7), ...l.slice(0, 7)]],
  ['impairs puis pairs', l => [...l.filter((_, i) => i % 2 === 1), ...l.filter((_, i) => i % 2 === 0)]]
];

interface ArticleTest { id: string; nom: string; valeurs: Article['valeurs']; prix?: number; dispo?: string; vendeur?: string; pays?: string; devise?: string }
/** Un carnet de test : les articles lus (sans prix sauf `prix`), les critères donnés. */
function carnet(articles: ArticleTest[], criteres: Critere[] = [], titre = 'Chambre froide'): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: titre,
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo ?? 'en stock',
        ...(a.vendeur ? { vendeur: a.vendeur } : {}), ...(a.pays ? { pays: a.pays } : {}),
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

/** Les libellés de la grille de la fiche, dans l'ordre où le brasseur les lit (c50Regles : `dl dt`). */
const libellesDeFiche = (c: HTMLElement) => [...c.querySelectorAll('dl dt')].map(e => (e.textContent ?? '').trim());

/** Les textes d'un élément, un par feuille, séparés par une espace : « 520 / 50 L / CHF » se lit tel que posé, sans collage. */
function textesJoints(n: Node, sortie: string[] = []): string[] {
  if (n.nodeType === 3) { const t = (n.textContent ?? '').trim(); if (t) sortie.push(t); } else n.childNodes.forEach(f => textesJoints(f, sortie));
  return sortie;
}
const joint = (e: Element) => textesJoints(e).join(' ');

/* ======================================================================================================== R12 */

/**
 * R12 (C50-4 rouvert au tour 52) : deux articles d'un même carnet listent leurs caractéristiques dans le MÊME ordre (le critère, puis ce qui
 * décide), quel que soit l'ordre de la page, même pour un nom que l'ordre de décision ne connaît pas. Les endroits qui listent des
 * caractéristiques : la fiche (grille), le résumé de la carte, la lecture serveur (lireLien) puis la fiche qui l'affiche, et la lecture d'un
 * article déjà enregistré (son carnet, lecture du 21.11 : l'article repasse par `lireCarnet`).
 */
describe('R12 : même ordre des caractéristiques pour deux articles du même genre, noms connus ou non, page lue ou déjà rangée', () => {
  for (const genre of ['cellule', 'carnet', 'ks240l'] as const) {
    for (const [nomPerm, permuter] of PERMUTATIONS) {
      for (const [nomCritere, criteres] of [['sans critère', [] as Critere[]], ['critère Volume', [critere('Volume', 'Volume', 'plus', genre === 'ks240l' ? 'L' : 'm³')]]] as const) {
        it(`fiche · ${genre}, page ${nomPerm}, ${nomCritere} : les deux fiches disent leurs libellés dans la même suite`, () => {
          const c = carnet([
            { id: 'A1', nom: 'Article A', valeurs: valeursDe(GENRES[genre]) },
            { id: 'A2', nom: 'Article B', valeurs: valeursDe(permuter(GENRES[genre])) }
          ], [...criteres]);
          const a = libellesDeFiche(fiche(c, 0));
          cleanup();
          const b = libellesDeFiche(fiche(c, 1));
          expect(a.length).toBeGreaterThan(6);
          expect(b, `1re : ${a.join(' | ')}`).toEqual(a);
        });
      }
      it(`résumé de la carte · ${genre}, page ${nomPerm} : les valeurs lues se disent dans le même ordre`, () => {
        const c = carnet([{ id: 'A1', nom: 'Article', valeurs: valeursDe(GENRES[genre]) }, { id: 'A2', nom: 'Article', valeurs: valeursDe(permuter(GENRES[genre])) }]);
        const [a1, a2] = contenu(c).articles;
        const t1 = norm(render(<CarteArticle article={a1} onOuvrir={nop} />).container.textContent ?? '');
        cleanup();
        const t2 = norm(render(<CarteArticle article={a2} onOuvrir={nop} />).container.textContent ?? '');
        expect(t2).toBe(t1);
      });
      it(`article déjà rangé (lireCarnet, lecture ancienne) · ${genre}, page ${nomPerm} : même suite à la fiche`, () => {
        const c = lireCarnet(carnet([
          { id: 'A1', nom: 'Article A', valeurs: valeursDe(GENRES[genre]) },
          { id: 'A2', nom: 'Article B', valeurs: valeursDe(permuter(GENRES[genre])) }
        ]) as never)!;
        const a = libellesDeFiche(fiche(c, 0));
        cleanup();
        const b = libellesDeFiche(fiche(c, 1));
        expect(a.length).toBeGreaterThan(6);
        expect(b, `1re : ${a.join(' | ')}`).toEqual(a);
      });
    }
  }

  /* Le chemin complet : la page HTML → lireLien (réseau simulé, sans IA) → l'article rangé → la fiche affichée. */
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
  for (const [nomPerm, permuter] of PERMUTATIONS) {
    it(`lireLien · deux pages du même vendeur, caractéristiques ${nomPerm} : les noms lus se suivent dans le même ordre`, async () => {
      const p1 = await lire(pageAvec(GENRES.cellule));
      const p2 = await lire(pageAvec(permuter(GENRES.cellule)));
      expect(p1.statut).toBe('lue');
      const n1 = (p1.valeurs ?? []).map(v => v.nom), n2 = (p2.valeurs ?? []).map(v => v.nom);
      expect(n1.length).toBeGreaterThan(10);
      /* le plafond de lecture peut ne pas garder les mêmes lignes : l'ORDRE se compare sur les noms que les deux pages gardent */
      const communs = n1.filter(n => n2.includes(n));
      expect(n2.filter(n => n1.includes(n)), `1re : ${n1.join(' | ')}`).toEqual(communs);
    });
    it(`lireLien puis fiche · caractéristiques ${nomPerm} : les deux fiches affichées disent leurs libellés dans la même suite`, async () => {
      const lues = [await lire(pageAvec(GENRES.cellule)), await lire(pageAvec(permuter(GENRES.cellule)))];
      const articles: ArticleTest[] = lues.map((p, i) => ({
        id: `L${i}`, nom: `Chambre ${i}`, valeurs: valeursDe((p.valeurs ?? []).map(v => ({ nom: v.nom, valeur: String(v.valeur), ...(v.unite ? { unite: v.unite } : {}) })))
      }));
      const c = carnet(articles);
      const a = libellesDeFiche(fiche(c, 0));
      cleanup();
      const b = libellesDeFiche(fiche(c, 1));
      const communs = a.filter(n => b.includes(n));
      expect(a.length).toBeGreaterThan(6);
      expect(b.filter(n => a.includes(n)), `1re : ${a.join(' | ')}`).toEqual(communs);
    });
  }
});

/* ======================================================================================================== R13 */

/**
 * R13 (C52-1) : la jauge à côté d'une valeur du critère est PLEINE quand le critère est tenu (une plage « 0 à 8 °C » tient « Température à
 * 4 °C » ; des dimensions qui tiennent), et un état distinct quand on ne sait pas ; jamais l'aspect d'une valeur nulle pour une valeur lue.
 * Le seul endroit qui dessine cette jauge à côté d'une valeur du critère : la carte classée de la feuille Articles (`.cn-reglette`, pied de
 * `CarteClassee`) ; la réglette de Choisir et la piste de la fiche ne se dessinent que pour une valeur chiffrée (`moi !== null`, `chiffree`).
 */
const jaugesDeFeuille = (c: HTMLElement) => [...c.querySelectorAll('.cn-classee:not(.cn-classee-relire)')].map(carte => ({
  nom: carte.querySelector('.cn-classee-tx b')?.textContent ?? '',
  pied: norm(carte.querySelector('.cn-classee-pied')?.textContent ?? ''),
  jauge: carte.querySelector('.cn-classee-pied .cn-reglette'),
  plein: carte.querySelector<HTMLElement>('.cn-classee-pied .cn-reglette-plein')?.style.width ?? null
}));
/** Une jauge « vide » : la piste grise sans rien dedans, sans état écrit : celle d'une valeur nulle. */
const jaugeVide = (j: Element | null) => !!j && j.children.length === 0 && ![...j.attributes].some(a => a.name.startsWith('data-')) && j.classList.length <= 1;
const decrire = (l: ReturnType<typeof jaugesDeFeuille>) => l.map(x => `${x.nom} [${x.pied}] jauge=${x.jauge ? x.jauge.outerHTML : 'aucune'}`).join('\n');

describe('R13 : la jauge du critère est pleine quand il est tenu, distincte quand on ne sait pas, jamais celle d\'une valeur nulle', () => {
  const cellule4 = [critere('Température à 4 °C', 'Température', 'moins', '°C')];
  const deuxPlages = (a: Article['valeurs'], b: Article['valeurs']) => carnet([
    { id: 'T1', nom: 'Chambre froide 4,06 m³', valeurs: a, prix: 298751 },
    { id: 'T2', nom: 'Chambre froide 2,6 m³', valeurs: b, prix: 269774 }
  ], cellule4);

  it('« 0 à 8 °C » et « 2 à 10 °C » tiennent 4 °C : chaque carte a une jauge pleine (ou aucune), jamais la piste vide d\'une valeur nulle', () => {
    const l = jaugesDeFeuille(feuille(deuxPlages({ Température: val('0 à 8 °C') }, { Température: val('2 à 10 °C') })));
    expect(l).toHaveLength(2);
    for (const x of l) {
      expect(x.pied, decrire(l)).toMatch(/°c/);
      expect(jaugeVide(x.jauge), `jauge vide à côté d'une valeur qui tient le critère :\n${decrire(l)}`).toBe(false);
      if (x.jauge) expect(x.plein, decrire(l)).toBe('100%');
    }
  });
  it('la même plage lue en deux bornes (« Température de 0 °C », « Température jusqu\'à 8 °C », lecture ancienne) : jauge pleine ou aucune', () => {
    const bornes = (bas: string, haut: string) => ({ 'Température de': val(bas, '°C'), 'Température jusqu\'à': val(haut, '°C') }) as Article['valeurs'];
    const l = jaugesDeFeuille(feuille(deuxPlages(bornes('0', '8'), bornes('2', '10'))));
    expect(l).toHaveLength(2);
    for (const x of l) {
      expect(jaugeVide(x.jauge), `jauge vide :\n${decrire(l)}`).toBe(false);
      if (x.jauge) expect(x.plein, decrire(l)).toBe('100%');
    }
  });
  it('une plage qui ne tient pas le critère (« 10 à 20 °C » pour 4 °C) n\'a jamais une jauge pleine', () => {
    const l = jaugesDeFeuille(feuille(deuxPlages({ Température: val('10 à 20 °C') }, { Température: val('2 à 10 °C') })));
    const pas = l.find(x => x.nom.includes('4,06'))!;
    expect(pas.plein, decrire(l)).not.toBe('100%');
  });
  it('des dimensions lues (« 1640 x 1340 x 1850 mm ») sous un critère de dimensions : pas la piste vide d\'une valeur nulle', () => {
    const k = [critere('Dimensions intérieures 1500 x 1200 x 1800 mm au moins', 'Dimensions intérieures (L x P x H)', 'texte', 'mm')];
    const c = carnet([
      { id: 'D1', nom: 'Chambre froide 4,06 m³', valeurs: { 'Dimensions intérieures (L x P x H)': val('1640 x 1340 x 1850 mm') }, prix: 298751 },
      { id: 'D2', nom: 'Chambre froide 2,6 m³', valeurs: { 'Dimensions intérieures (L x P x H)': val('1340 x 1040 x 1850 mm') }, prix: 269774 }
    ], k);
    const l = jaugesDeFeuille(feuille(c));
    expect(l).toHaveLength(2);
    for (const x of l) expect(jaugeVide(x.jauge), `jauge vide à côté d'une valeur lue :\n${decrire(l)}`).toBe(false);
  });
  it('on ne sait pas (aucune température lue) : la jauge n\'a pas l\'aspect de celle d\'une valeur lue qui tient', () => {
    const l = jaugesDeFeuille(feuille(carnet([
      { id: 'T1', nom: 'Chambre froide 4,06 m³', valeurs: { Température: val('0 à 8 °C') }, prix: 298751 },
      { id: 'T2', nom: 'Chambre froide 2,6 m³', valeurs: { Tension: val('230 V') }, prix: 269774 }
    ], cellule4)));
    const lue = l.find(x => x.nom.includes('4,06'))!, inconnue = l.find(x => x.nom.includes('2,6'))!;
    expect(inconnue.pied, decrire(l)).toMatch(/non publi/);
    if (lue.jauge && inconnue.jauge) expect(inconnue.jauge.outerHTML, `lue et inconnue se ressemblent :\n${decrire(l)}`).not.toBe(lue.jauge.outerHTML);
  });
  it('garde-fou (déjà juste) : un volume chiffré (marmites de 50 et 242 L) remplit sa jauge à sa place', () => {
    const l = jaugesDeFeuille(feuille(carnet([
      { id: 'V1', nom: 'Marmite A', valeurs: { Volume: val(50, 'L') }, prix: 52000 },
      { id: 'V2', nom: 'Marmite B', valeurs: { Volume: val(242, 'L') }, prix: 79000 }
    ], [critere('Volume', 'Volume', 'plus', 'L')], 'Marmite')));
    expect(l.map(x => x.plein).sort()).toEqual(['0%', '100%']);
  });
});

/* ======================================================================================================== R14 */

/**
 * R14 (C52-2) : une pastille ou une colonne de prix montre le prix seul, ou un prix unitaire entier (« 10,40 CHF/L ») ; jamais une autre
 * grandeur glissée dans le prix (« 520 / 50 L / CHF »). Les endroits : la pastille de prix (feuille Articles), la colonne de prix du tableau
 * du carnet, la ligne Offre de la fiche ; le Comparer dit déjà « 50 L · 10,40 CHF/L » (non testé : rien à corriger).
 */
const QUANTITE = /(?<![\d.,'’])\d+(?:[.,]\d+)?\s*(?:kg|g|ml|cl|dl|l)(?![a-zà-ÿ0-9²³/])/i;
/** « 50 L · 10,40 CHF/L » ou « 10,40 CHF/L » : un prix unitaire entier, la quantité qui l'explique à côté. */
const UNITAIRE = /(?:\d+(?:[.,]\d+)?\s*(?:kg|g|ml|cl|dl|l)\s*[·•]\s*)?\d[\d ' .,]*\s*chf\s*\/\s*(?:kg|l)\b/gi;
const quantiteGlissee = (t: string): string | null => QUANTITE.exec(norm(t).replace(UNITAIRE, ' '))?.[0] ?? null;

const marmites = () => carnet([
  { id: 'M1', nom: 'Marmite de brassage inox 50 L', valeurs: { Volume: val(50, 'L') }, prix: 52000 },
  { id: 'M2', nom: 'Marmite de brassage inox 80 L', valeurs: { Volume: val(80, 'L') }, prix: 79000 }
], [critere('Volume', 'Volume', 'plus', 'L')], 'Marmite');
const houblons = () => carnet([
  { id: 'H1', nom: 'Mosaic Pellets T90 100 g', valeurs: { 'Alpha acides': val(11.5, '%') }, prix: 725 },
  { id: 'H2', nom: 'Citra Pellets T90 1 kg', valeurs: { 'Alpha acides': val(12, '%') }, prix: 7250 }
], [critere('Alpha acides', 'Alpha acides', 'plus', '%')], 'Houblons');

describe('R14 : le prix se dit seul ou en prix unitaire entier, jamais avec une autre grandeur glissée dedans', () => {
  for (const [nom, fabrique] of [['marmite (50 L, 520 CHF)', marmites], ['houblon (100 g, 7,25 CHF)', houblons]] as const) {
    it(`pastille de prix de la feuille Articles · ${nom}`, () => {
      const pastilles = [...feuille(fabrique()).querySelectorAll('.cn-classee-prix')].map(e => joint(e));
      expect(pastilles).toHaveLength(2);
      for (const t of pastilles) expect(quantiteGlissee(t), `pastille : « ${t} »`).toBeNull();
    });
    it(`PrixPastille seule · ${nom}`, () => {
      for (const a of contenu(fabrique()).articles) {
        const t = joint(render(<PrixPastille article={a} />).container);
        cleanup();
        expect(quantiteGlissee(t), `pastille : « ${t} »`).toBeNull();
        expect(norm(t), `le prix et sa devise se suivent : « ${t} »`).toMatch(/\d\s*chf/);
      }
    });
    it(`colonne de prix du tableau du carnet · ${nom}`, () => {
      const c = fabrique();
      const ci = colonnesCarnet(tableau(c)! as never).findIndex(k => k.cle === '__prix');
      expect(ci).toBeGreaterThanOrEqual(0);
      const cellules = [...tableauDuCarnet(c).querySelectorAll(`[role="cell"][data-col="${ci}"]`)].map(e => joint(e));
      expect(cellules).toHaveLength(2);
      for (const t of cellules) expect(quantiteGlissee(t), `cellule du prix : « ${t} »`).toBeNull();
    });
    it(`ligne Offre de la fiche · ${nom}`, () => {
      const t = joint(fiche(fabrique(), 0).querySelector('.cn-offres')!);
      expect(quantiteGlissee(t), `offre : « ${t} »`).toBeNull();
    });
  }
});

/* ======================================================================================================== R15 */

/**
 * R15 (C52-3) : sur la ligne Offre d'une fiche, le vendeur et le prix sont séparés (espace, séparateur ou ligne) dans tous les états :
 * avec prix, sans prix, avec « Relire », avec disponibilité ou sans, avec un pays, avec plusieurs offres. Seul endroit : `FicheArticle`
 * (`.cn-offres`). On lit le texte de la ligne en comptant les éléments de bloc comme des sauts de ligne (jsdom ne mesure pas la mise en page).
 */
const BLOC = new Set(['DIV', 'P', 'LI', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DD', 'DT', 'TR', 'UL', 'OL', 'TABLE', 'SECTION']);
function aplati(n: Node): string {
  if (n.nodeType === 3) return n.textContent ?? '';
  const dedans = [...n.childNodes].map(aplati).join('');
  return BLOC.has((n as Element).tagName) ? `\n${dedans}\n` : dedans;
}
const SEPARE = /[\s·|—–•,;:/-]/;

/** Pour chaque offre de la fiche : le caractère qui suit le nom du vendeur et celui qui précède le prix dans le texte de la ligne. */
function jointures(c: HTMLElement) {
  return [...c.querySelectorAll('.cn-offre')].map(offre => {
    const vendeur = (offre.querySelector('b')?.textContent ?? '').trim();
    const prixEl = offre.querySelector('.cn-prix-mono') ?? [...offre.querySelectorAll('span')].find(s => (s.textContent ?? '').trim() === 'prix ?');
    const prix = (prixEl?.textContent ?? '').trim();
    const f = aplati(offre);
    const iV = f.indexOf(vendeur), iP = prix ? f.indexOf(prix) : -1;
    /* quand la disponibilité suit le vendeur (deux lignes d'une même colonne), c'est le prix qui doit se séparer d'elle ; sinon le prix suit le vendeur */
    const dispo = (offre.querySelector('.cn-sp > span')?.textContent ?? '').trim();
    const dispoSuit = !!dispo && iV >= 0 && f.slice(iV + vendeur.length).startsWith(dispo);
    return {
      vendeur, prix, ligne: f.replace(/\n/g, '⏎'),
      apresVendeur: iV >= 0 && !dispoSuit ? f[iV + vendeur.length] : undefined,
      avantPrix: iP > 0 ? f[iP - 1] : undefined
    };
  });
}
const toutSepare = (j: ReturnType<typeof jointures>) => {
  expect(j.length).toBeGreaterThan(0);
  for (const x of j) {
    expect(x.vendeur, `ligne : ${x.ligne}`).not.toBe('');
    expect(x.prix, `ligne : ${x.ligne}`).not.toBe('');
    if (x.apresVendeur !== undefined) expect(SEPARE.test(x.apresVendeur), `vendeur collé à ce qui le suit : ${x.ligne}`).toBe(true);
    if (x.avantPrix !== undefined) expect(SEPARE.test(x.avantPrix), `prix collé à ce qui le précède : ${x.ligne}`).toBe(true);
  }
};

describe('R15 : sur la ligne Offre, le vendeur et le prix ne se touchent jamais', () => {
  const une = (plus: Partial<ArticleTest>, geste: Record<string, unknown> = {}) =>
    fiche(carnet([{ id: 'O1', nom: 'Chambre froide 4,06 m³', valeurs: valeursDe(GENRES.cellule.slice(0, 6)), vendeur: 'grossiste-exemple.ch', ...plus }], []), 0, geste);

  it('avec prix et « en stock » (l\'état du test en ligne)', () => toutSepare(jointures(une({ prix: 298751 }))));
  it('avec prix, sans disponibilité', () => toutSepare(jointures(une({ prix: 298751, dispo: '' }))));
  it('avec prix, vendeur et pays', () => toutSepare(jointures(une({ prix: 298751, pays: 'CH' }))));
  it('avec prix et le geste « Modifier le prix » (onPrix)', () => toutSepare(jointures(une({ prix: 298751 }, { onPrix: nop }))));
  it('sans prix (« prix ? »), avec « en stock »', () => toutSepare(jointures(une({}))));
  it('sans prix, sans disponibilité', () => toutSepare(jointures(une({ dispo: '' }))));
  it('sans prix, avec « Relire » et « Poser le prix »', () => toutSepare(jointures(une({}, { onRelire: nop, onPrix: nop }))));
  it('sans prix, avec « Relire », sans disponibilité', () => toutSepare(jointures(une({ dispo: '' }, { onRelire: nop, onPrix: nop }))));
  it('plusieurs offres de la même machine (la sienne et celle d\'un autre vendeur) : chaque ligne', () => {
    const base = valeursDe(GENRES.cellule.slice(0, 6));
    const c = carnet([
      { id: 'O1', nom: 'Chambre froide 4,06 m³', valeurs: base, vendeur: 'grossiste-exemple.ch', prix: 298751 },
      { id: 'O2', nom: 'Chambre froide 4,06 m³', valeurs: base, vendeur: 'froid-exemple.ch', prix: 305000, dispo: 'sur commande' }
    ], []);
    const j = jointures(fiche(c, 0, { onOffre: nop }));
    expect(j).toHaveLength(2);
    toutSepare(j);
  });
});
