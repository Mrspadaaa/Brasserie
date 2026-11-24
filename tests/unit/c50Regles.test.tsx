// @vitest-environment jsdom
/**
 * Voie c50-tests (24.11) : les tests ROUGES des règles R6..R11 tirées du test en ligne du tour 50 (C50-1..4 et C50-6..9 ; C50-5 est hors voie).
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c50-tests/DOSSIER.md), pas depuis le code actuel, avant tout correctif :
 * celui qui corrige n'écrit pas le test. Aucun réseau, aucun Gemini. Données : deux chambres froides jumelles réécrites à la main
 * (tests/fixtures/c50/chambres-froides.json), une marmite, une cellule à 4 °C ; aucune donnée personnelle.
 *
 * Aucun nom de composant ni de prop nouveau n'est supposé : les tests lisent ce que le brasseur voit (texte rendu, ordre des lignes) ; seul
 * R11 lit des classes et du CSS, car jsdom ne mesure rien (voir « reste à voir en ligne » dans RESULTAT.md).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { prioriserValeurs, type Valeur as ValeurPage } from '../../functions/src/lienLibelles';
import { traduireValeurs } from '../../functions/src/lienLibelles';
import { compromisDe, tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { CarteArticle, CarteClassee, valeursLues } from '../../src/ui/carnets/CarteArticle';
import { Comparer, colonnesComparer, texteCellule } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { TableauCarnet, colonnesCarnet } from '../../src/ui/carnets/TableauCarnet';

afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const norm = (s: string) => s.normalize('NFKC').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const nop = () => undefined;
const PAGES = JSON.parse(readFileSync('tests/fixtures/c50/chambres-froides.json', 'utf8')) as Record<string, Array<{ nom: string; valeur: string; unite?: string }>>;

/** Les valeurs d'un article, telles que la lecture les range : un nombre avec son unité, un mot ou une mesure en texte. */
const valeursDe = (liste: Array<{ nom: string; valeur: string | number; unite?: string }>): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const nombre = typeof e.valeur === 'string' && e.unite && /^[\d,.]+$/.test(e.valeur) ? Number(e.valeur.replace(',', '.')) : e.valeur;
    sortie[e.nom] = { valeur: nombre, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' } as Valeur;
  }
  return sortie;
};

interface ArticleTest { id: string; nom: string; valeurs: Article['valeurs']; prix?: number; dispo?: string }
/** Un carnet de test : les articles lus (sans prix sauf `prix`), les critères donnés. */
function carnet(articles: ArticleTest[], criteres: Critere[] = []): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: 'Chambre froide',
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo ?? 'en stock',
        valeurs: a.valeurs, ...(a.prix !== undefined ? { prixCentimes: a.prix, devise: 'CHF', taxe: 'ht' as const } : {})
      }) as Article)
    }
  } as CarnetDoc;
}
const critere = (texte: string, nom: string, sens: 'plus' | 'moins' | 'texte' | 'oui-non', unite?: string): Critere =>
  ({ id: 'K1', texte, origine: 'vous', caracteristique: { nom, ...(unite ? { unite } : {}), sens } } as Critere);
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;

const fiche = (c: CarnetDoc, i = 0, plus: Record<string, unknown> = {}) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} {...plus} />).container;
const comparer = (c: CarnetDoc) =>
  render(<Comparer titre={c.title} statut="research" tableau={tableau(c)} critere={c.carnet.criteres[0] as never} onRetour={nop} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;
const tableauDuCarnet = (c: CarnetDoc) =>
  render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} sep={null} onOuvrir={nop} />).container;
const texte = (e: Element) => norm(e.textContent ?? '');

/** Les deux chambres froides jumelles du test, caractéristiques et ordre de la page (fixture). */
const jumelles = (criteres: Critere[] = []) => carnet([
  { id: 'CF1', nom: '1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus', valeurs: valeursDe(PAGES.j406) },
  { id: 'CF2', nom: '1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus', valeurs: valeursDe(PAGES.j26) }
], criteres);

/** Les déclarations CSS dont un sélecteur finit par la classe `cls` (le sélecteur qui vise l'élément, pas un de ses parents). */
const FICHIERS_CSS = ['carnets.css', 'carnets-decider.css', 'fiche-article.css', 'comparer-compact.css', 'carnets-fil.css'];
const blocs = FICHIERS_CSS.flatMap(f => [...readFileSync(`src/ui/carnets/${f}`, 'utf8').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1], decl: m[2] })));
const reglesDe = (cls: string): string[] => blocs.filter(b => b.sel.split(',').some(s => {
  const dernier = s.trim().split(/[\s>+~]+/).pop() ?? '';
  return new RegExp(`\\.${cls}(?![\\w-])`).test(dernier);
})).map(b => b.decl);
/** Les classes génériques (`cn-mut`, `cn-sp`…) portent des règles de contextes sans rapport : seules les classes propres de l'élément comptent. */
const GENERIQUES = new Set(['cn-mut', 'cn-sp', 'cn-lien', 'cn-mono', 'cn-ico', 'cn-encre', 'cn-vert', 'cn-att']);
const reglesDeElement = (e: Element): string[] => [...e.classList].filter(c => !GENERIQUES.has(c)).flatMap(reglesDe);
/** « pas : Induction » (les textes de plusieurs éléments se collent dans `textContent` : pas de \b devant). */
const PAS_DEUX_POINTS = /pas\s*:\s*\S/i;

/* ======================================================================================================== R6 */

/**
 * R6 : « Non publié : X » / « Aucune valeur lue pour : X » n'est JAMAIS dit quand X est présent parmi les caractéristiques lues, sous un
 * synonyme, une plage ou une autre unité. Les trois endroits qui le disent : la fiche (« Non publié par le vendeur », case « non publié »),
 * Comparer (« Aucune valeur lue pour »), la feuille Articles (« X : non publié », pastille « non publié »).
 */
interface CasLu { nom: string; critere: Critere; a: Array<{ nom: string; valeur: string | number; unite?: string }>; b: Array<{ nom: string; valeur: string | number; unite?: string }>; attendus: RegExp[] }
const CAS_LUS: CasLu[] = [
  {
    nom: 'température « de 0 °C » + « jusqu\'à 8 °C » pour le critère « Température à 4 °C »',
    critere: critere('Température à 4 °C', 'Température', 'moins', '°C'),
    a: [{ nom: 'Température de', valeur: '0 °C' }, { nom: 'Température jusqu\'à', valeur: '8 °C' }],
    b: [{ nom: 'Température de', valeur: '2 °C' }, { nom: 'Température à', valeur: '10 °C' }],
    attendus: [/8\s?°C/, /10\s?°C/]
  },
  {
    nom: 'température écrite en plage sous un autre nom (« Plage de température 0 à 8 °C »)',
    critere: critere('Température à 4 °C', 'Température', 'moins', '°C'),
    a: [{ nom: 'Plage de température', valeur: '0 à 8 °C' }],
    b: [{ nom: 'Plage de température', valeur: '2 à 10 °C' }],
    attendus: [/0\s?à\s?8\s?°C/, /2\s?à\s?10\s?°C/]
  },
  {
    nom: 'capacité 50 L = volume lu, unité écrite « l » minuscule',
    critere: critere('Capacité : 50 L', 'Capacité', 'plus', 'L'),
    a: [{ nom: 'Volume', valeur: 242, unite: 'l' }],
    b: [{ nom: 'Volume', valeur: 50, unite: 'L' }],
    attendus: [/242/, /\b50\b/]
  },
  {
    nom: 'volume lu en m³ pour un critère en litres',
    critere: critere('Volume', 'Volume', 'plus', 'L'),
    a: [{ nom: 'Volume', valeur: 4.06, unite: 'm³' }],
    b: [{ nom: 'Volume', valeur: 2.6, unite: 'm³' }],
    attendus: [/4[,.]?06|4\s?060/, /2[,.]?6|2\s?600/]
  }
];
const carnetLu = (cas: CasLu) => carnet([
  { id: 'A1', nom: 'Article A', valeurs: valeursDe(cas.a) }, { id: 'B1', nom: 'Article B', valeurs: valeursDe(cas.b) }
], [cas.critere]);

describe('R6 : « non publié » n\'est jamais dit d\'une caractéristique présente (synonyme, plage, autre unité)', () => {
  for (const cas of CAS_LUS) {
    describe(cas.nom, () => {
      it('fiche : ni « Non publié par le vendeur », ni case « non publié » pour ce critère', () => {
        for (const i of [0, 1]) {
          const t = texte(fiche(carnetLu(cas), i));
          expect(t, `article ${i + 1}`).not.toMatch(/non publi/);
          cleanup();
        }
      });
      it('Comparer : jamais « Aucune valeur lue pour » ce critère', () => {
        expect(texte(comparer(carnetLu(cas)))).not.toMatch(/aucune valeur lue/);
      });
      it('feuille Articles : jamais « non publié », et la valeur lue de chaque article se dit', () => {
        const t = texte(feuille(carnetLu(cas)));
        expect(t).not.toMatch(/non publi/);
        for (const attendu of cas.attendus) expect(t, String(attendu)).toMatch(attendu);
      });
    });
  }

  it('une seule vérité de « lu » : fiche, Comparer et feuille Articles disent la même chose du même critère (température 0 à 8 °C)', () => {
    const c = carnetLu(CAS_LUS[0]);
    const dit = (re: RegExp, e: Element) => re.test(texte(e));
    const trois = [dit(/non publi/, fiche(c, 0)), dit(/aucune valeur lue/, comparer(c)), dit(/non publi/, feuille(c))];
    expect(trois, 'fiche, Comparer, Articles').toEqual([false, false, false]);
  });
});

/* ======================================================================================================== R7 */

/** Les valeurs écrites dans la colonne du tableau du carnet, une par ligne (les articles). */
const colonneDuTableau = (c: CarnetDoc) => {
  const t = tableau(c)!;
  const col = colonnesCarnet(t as never).find(x => x.cle !== '__prix');
  return { col, valeurs: col ? t.lignes.map(l => texteCellule(l as never, col)) : [] };
};
const chipsDeLaFeuille = (c: HTMLElement) => [...c.querySelectorAll('.cn-chip-valeur')].map(e => norm(e.textContent ?? ''));

describe('R7 : la colonne du tableau et la ligne de la feuille Articles montrent le critère, sinon ce qui distingue ; jamais une valeur identique pour tous', () => {
  it('sans critère : la colonne du tableau du carnet distingue les articles (pas « Tension 230 V », identique aux deux)', () => {
    const { col, valeurs } = colonneDuTableau(jumelles());
    expect(col, 'une colonne de valeur').toBeDefined();
    expect(valeurs.every(v => v), JSON.stringify(valeurs)).toBe(true);
    expect(new Set(valeurs).size, `colonne « ${col?.nom} » : ${JSON.stringify(valeurs)}`).toBeGreaterThan(1);
  });
  it('sans critère : le tableau du carnet rendu ne répète pas la même valeur dans les deux lignes', () => {
    const lignes = [...tableauDuCarnet(jumelles()).querySelectorAll('[role=row]')].filter(r => r.querySelector('[role=cell][data-col]'));
    expect(lignes.length).toBeGreaterThan(1);
    const premieres = lignes.map(r => texte(r.querySelector('[role=cell][data-col="0"]')!));
    expect(new Set(premieres).size, JSON.stringify(premieres)).toBeGreaterThan(1);
  });
  it('sans critère : la feuille Articles montre une valeur qui distingue (pas la même sur chaque carte)', () => {
    const chips = chipsDeLaFeuille(feuille(jumelles()));
    expect(chips.length).toBe(2);
    expect(new Set(chips).size, JSON.stringify(chips)).toBeGreaterThan(1);
  });
  it('critère que personne n\'a lu (« Poids ») : même règle, la caractéristique qui distingue', () => {
    const c = jumelles([critere('Poids', 'Poids', 'moins', 'kg')]);
    const { valeurs } = colonneDuTableau(c);
    expect(new Set(valeurs).size, JSON.stringify(valeurs)).toBeGreaterThan(1);
    const chips = chipsDeLaFeuille(feuille(c));
    expect(new Set(chips).size, JSON.stringify(chips)).toBeGreaterThan(1);
  });
  it('critère « Température » lu sous « Température de » / « jusqu\'à » : la colonne du tableau est la température, avec une valeur pour chaque article', () => {
    const c = jumelles([critere('Température à 4 °C', 'Température', 'moins', '°C')]);
    const { col, valeurs } = colonneDuTableau(c);
    expect(col?.nom ?? '', 'colonne').toMatch(/temp/i);
    expect(valeurs.every(v => !!v && /\d/.test(v)), JSON.stringify(valeurs)).toBe(true);
  });
  it('critère « Température » : la feuille Articles dit la température (libellé et valeur), pas la tension', () => {
    const c = feuille(jumelles([critere('Température à 4 °C', 'Température', 'moins', '°C')]));
    const t = texte(c);
    expect(t).not.toMatch(/tension/);
    expect(t).toMatch(/temp/);
    expect(t).toMatch(/8\s?°c/);
  });
  it('critère lu sous son nom exact (« Volume » 4,06 et 2,6 m³) : la colonne est ce critère (déjà juste : garde-fou)', () => {
    const { col, valeurs } = colonneDuTableau(jumelles([critere('Volume', 'Volume', 'plus', 'm³')]));
    expect(col?.nom).toBe('Volume');
    expect(valeurs.every(v => !!v)).toBe(true);
  });
});

/* ======================================================================================================== R8 */

const noms = (liste: Array<{ nom: string }>) => liste.map(x => x.nom);
const GROUPES: Array<[string, RegExp]> = [
  ['type de refroidissement / refroidissement', /^(?:type de )?refroidissement$/i],
  ['fluide frigorigène / type de réfrigérant', /^(?:fluide frigorigène|type de réfrigérant|réfrigérant)$/i],
  ['tension / branchement électrique', /^(?:tension|branchement électrique|raccordement(?: électrique)?)$/i],
  ['température (de, jusqu\'à, à)', /^temp[ée]rature(?!\s+(?:ambiante|de stockage|de congélation))/i]
];

describe('R8 : une ligne par fait (synonymes fusionnés), une unité écrite une seule fois', () => {
  describe('à la lecture (traduireValeurs, nouvelles lectures)', () => {
    const lue = traduireValeurs(PAGES.j406 as ValeurPage[])!;
    for (const [nom, re] of GROUPES) {
      it(`« ${nom} » : une seule caractéristique`, () => {
        expect(noms(lue).filter(n => re.test(n)), noms(lue).join(' | ')).toHaveLength(1);
      });
    }
    it('température : la plage 0 à 8 °C en une valeur', () => {
      const t = lue.find(v => /^temp[ée]rature/i.test(v.nom));
      expect(`${t?.valeur ?? ''} ${t?.unite ?? ''}`).toMatch(/0\s?(?:°\s?C\s?)?(?:à|–|-)\s?8\s?°\s?C/);
    });
    it('température écrite « 0 » + « °C » en unité à part : toujours une plage', () => {
      const l = traduireValeurs([{ nom: 'Température de', valeur: '0', unite: '°C' }, { nom: 'Température à', valeur: '8', unite: '°C' }] as ValeurPage[])!;
      expect(l.filter(v => /^temp/i.test(v.nom))).toHaveLength(1);
      const t = l.find(v => /^temp/i.test(v.nom))!;
      expect(`${t.valeur} ${t.unite ?? ''}`).toMatch(/0\s?(?:°\s?C\s?)?(?:à|–|-)\s?8\s?°\s?C/);
    });
    it('deux synonymes qui disent deux choses différentes restent deux (« Tension 230 V » et « Branchement électrique 400 V » : rien ne se perd)', () => {
      const l = traduireValeurs([{ nom: 'Tension', valeur: '230 V' }, { nom: 'Branchement électrique', valeur: '400 V' }] as ValeurPage[])!;
      const dit = l.map(v => `${v.valeur} ${v.unite ?? ''}`).join(' ');
      expect(dit).toMatch(/230/);
      expect(dit).toMatch(/400/);
    });
  });

  describe('à l\'affichage (articles déjà rangés dans un carnet, lus avant le correctif)', () => {
    it('fiche : chaque fait se dit une fois (refroidissement, fluide, tension, température)', () => {
      const dt = [...fiche(jumelles()).querySelectorAll('dl dt')].map(e => (e.textContent ?? '').trim());
      for (const [nom, re] of GROUPES) expect(dt.filter(n => re.test(n)), `${nom} : ${dt.join(' | ')}`).toHaveLength(1);
    });
    it('Comparer : chaque fait se dit sur une seule ligne', () => {
      const th = [...comparer(jumelles()).querySelectorAll('tbody th[scope=row]')].map(e => (e.textContent ?? '').trim());
      for (const [nom, re] of GROUPES) expect(th.filter(n => re.test(n)), `${nom} : ${th.join(' | ')}`).toHaveLength(1);
    });
    it('Comparer : la température se lit « 0 à 8 °C » dans une cellule', () => {
      const c = comparer(jumelles());
      const ligne = [...c.querySelectorAll('tbody tr')].find(tr => /^temp/i.test(texte(tr.querySelector('th')!)));
      expect(ligne, 'ligne température').toBeDefined();
      expect(texte(ligne!)).toMatch(/0\s?(?:°\s?c\s?)?(?:à|–|-)\s?8\s?°\s?c/);
    });
  });

  describe('unité écrite une seule fois, en « L » : « 242 L », jamais « 242 l L » ni « l »', () => {
    const marmite = (a: { valeur: string | number; unite?: string }, b: { valeur: string | number; unite?: string }, prix = false) => carnet([
      { id: 'A1', nom: 'Marmite 242', valeurs: valeursDe([{ nom: 'Volume', ...a }]), ...(prix ? { prix: 30200 } : {}) },
      { id: 'B1', nom: 'Marmite 50', valeurs: valeursDe([{ nom: 'Volume', ...b }]), ...(prix ? { prix: 35000 } : {}) }
    ], [critere('Capacité : 50 L', 'Volume', 'plus', 'L')]);
    const UNITE_DOUBLE = /\b[lL]\s+[lL]\b/;
    const l_minuscule = /\d\s?l(?![a-zA-Zà-ÿ/])/;

    it('Comparer : la ligne Volume dit « 242 L » (pas « 242 l »), unité normalisée', () => {
      const c = comparer(marmite({ valeur: 242, unite: 'l' }, { valeur: 50, unite: 'L' }));
      const ligne = [...c.querySelectorAll('tbody tr')].find(tr => /volume|capacit/i.test(texte(tr.querySelector('th')!)));
      expect(ligne, 'ligne volume').toBeDefined();
      const t = (ligne!.textContent ?? '').replace(/[\s  ]+/g, ' ');
      expect(t, t).toMatch(/242\s?L/);
      expect(t, t).not.toMatch(l_minuscule);
      expect(t, t).not.toMatch(UNITE_DOUBLE);
    });
    it('Comparer : une valeur lue « 242 l » avec son unité dans le texte ne se double pas (« 242 l L »)', () => {
      const c = comparer(marmite({ valeur: '242 l' }, { valeur: '50 L' }));
      const ligne = [...c.querySelectorAll('tbody tr')].find(tr => /volume|capacit/i.test(texte(tr.querySelector('th')!)));
      const t = (ligne?.textContent ?? '').replace(/[\s  ]+/g, ' ');
      expect(t, t).not.toMatch(UNITE_DOUBLE);
      expect(t, t).not.toMatch(l_minuscule);
    });
    it('fiche : « 242 L » (la valeur de l\'article, unité normalisée, une fois)', () => {
      const t = (fiche(marmite({ valeur: 242, unite: 'l' }, { valeur: 50, unite: 'L' }), 0).textContent ?? '').replace(/[\s  ]+/g, ' ');
      expect(t, t).toMatch(/242\s?L/);
      expect(t, t).not.toMatch(l_minuscule);
      expect(t, t).not.toMatch(UNITE_DOUBLE);
    });
    it('tableau du carnet : colonne volume « 242 L » et « 50 L », une seule écriture de l\'unité', () => {
      const t = (tableauDuCarnet(marmite({ valeur: 242, unite: 'l' }, { valeur: 50, unite: 'L' })).textContent ?? '').replace(/[\s  ]+/g, ' ');
      expect(t, t).toMatch(/242\s?L/);
      expect(t, t).toMatch(/\b50\s?L/);
      expect(t, t).not.toMatch(l_minuscule);
      expect(t, t).not.toMatch(UNITE_DOUBLE);
    });
    it('feuille Articles : « 242 L » et « 50 L », pas de « l » minuscule', () => {
      const t = (feuille(marmite({ valeur: 242, unite: 'l' }, { valeur: 50, unite: 'L' })).textContent ?? '').replace(/[\s  ]+/g, ' ');
      expect(t, t).toMatch(/242\s?L/);
      expect(t, t).not.toMatch(l_minuscule);
      expect(t, t).not.toMatch(UNITE_DOUBLE);
    });
    it('compromis (compromisDe) : « 242 l L » n\'existe plus, sous les deux écritures de la valeur lue', () => {
      for (const a of [{ valeur: '242 l' }, { valeur: 242, unite: 'l' }]) {
        const c = marmite(a, { valeur: 50, unite: 'L' }, true);
        const phrase = compromisDe(tableau(c)) ?? '';
        expect(phrase, phrase).not.toMatch(UNITE_DOUBLE);
        expect(phrase, phrase).not.toMatch(l_minuscule);
      }
    });
    it('un texte de cellule (texteCellule) ne dit jamais l\'unité de la colonne en plus de celle de la valeur', () => {
      const t = tableau(marmite({ valeur: '242 l' }, { valeur: '50 L' }))!;
      const col = colonnesComparer(t).find(c => /volume|capacit/i.test(c.nom))!;
      for (const l of t.lignes) {
        const cellule = texteCellule(l as never, col) ?? '';
        const avecUnite = col.unite ? `${cellule} ${col.unite}` : cellule;
        expect(avecUnite, avecUnite).not.toMatch(UNITE_DOUBLE);
      }
    });
  });
});

/* ======================================================================================================== R9 */

const libellesDeFiche = (c: HTMLElement) => [...c.querySelectorAll('dl dt')].map(e => (e.textContent ?? '').trim());
const DECIDE = /^(?:temp[ée]rature|volume|capacit)/i;
const SECONDAIRE = /^(?:couleur|performance|largeur de la porte|dimensions)/i;

describe('R9 : toutes les fiches d\'un même carnet listent les caractéristiques dans le même ordre (la décision d\'abord, pas l\'ordre de la page)', () => {
  it('deux jumelles dont la page n\'a pas le même ordre : même suite de libellés', () => {
    const c = jumelles();
    const a = libellesDeFiche(fiche(c, 0));
    cleanup();
    const b = libellesDeFiche(fiche(c, 1));
    expect(a.length).toBeGreaterThan(5);
    expect(b, `1re : ${a.join(' | ')}`).toEqual(a);
  });
  it('avec un critère « Volume » : même suite, et la température (ce qui décide) avant couleur, performance, porte, dimensions', () => {
    const c = jumelles([critere('Volume', 'Volume', 'plus', 'm³')]);
    const a = libellesDeFiche(fiche(c, 0));
    cleanup();
    const b = libellesDeFiche(fiche(c, 1));
    expect(b, `1re : ${a.join(' | ')}`).toEqual(a);
    for (const liste of [a, b]) {
      const dernierDecisif = Math.max(...liste.map((n, i) => (DECIDE.test(n) ? i : -1)));
      const premierSecondaire = liste.findIndex(n => SECONDAIRE.test(n));
      expect(dernierDecisif, liste.join(' | ')).toBeGreaterThanOrEqual(0);
      expect(dernierDecisif, liste.join(' | ')).toBeLessThan(premierSecondaire);
    }
  });
  it('avec un critère « Température » : le volume vient avant les caractéristiques secondaires, dans les deux fiches', () => {
    const c = jumelles([critere('Température à 4 °C', 'Température', 'moins', '°C')]);
    for (const i of [0, 1]) {
      const liste = libellesDeFiche(fiche(c, i));
      cleanup();
      const iVolume = liste.findIndex(n => /^volume/i.test(n));
      expect(iVolume, liste.join(' | ')).toBeGreaterThanOrEqual(0);
      expect(iVolume, liste.join(' | ')).toBeLessThan(liste.findIndex(n => SECONDAIRE.test(n)));
    }
  });
  it('à la lecture : deux pages du même genre rendent leurs caractéristiques dans le même ordre (prioriserValeurs)', () => {
    const a = noms(prioriserValeurs(PAGES.j406 as ValeurPage[]));
    const b = noms(prioriserValeurs(PAGES.j26 as ValeurPage[]));
    expect(b).toEqual(a);
  });
});

/* ======================================================================================================== R10 */

describe('R10 : une caractéristique oui/non s\'écrit « Induction : non », jamais « pas : Induction »', () => {
  const OK = /induction\s*:\s*non|pas d['’]induction|sans induction/i;
  for (const non of ['non', 'Non', ' non ']) {
    it(`valeursLues : « ${non} » sans unité (le résumé d'une carte)`, () => {
      const [dit] = valeursLues({ Induction: { valeur: non, origine: 'page' } });
      expect(dit, dit).not.toMatch(PAS_DEUX_POINTS);
      expect(dit, dit).toMatch(OK);
    });
  }
  it('valeursLues : le booléen false se dit « Induction : non » (déjà juste : garde-fou)', () => {
    expect(valeursLues({ Induction: { valeur: false, origine: 'page' } })[0]).toMatch(OK);
  });
  it('carte d\'article (résumé) : « Volume 50 L · Induction : non · Matière … », jamais « pas : »', () => {
    const a = {
      id: 'M1', nom: 'Marmite 50 L', domaine: 'grossiste-exemple.test', url: 'https://www.grossiste-exemple.test/m1', lecture: 'lue', dispo: 'en stock',
      valeurs: valeursDe([{ nom: 'Volume', valeur: 50, unite: 'L' }, { nom: 'Induction', valeur: 'non' }, { nom: 'Matière', valeur: 'Acier inox AISI 304' }])
    } as unknown as Article;
    const { container } = render(<CarteArticle article={a as never} onOuvrir={nop} />);
    const t = container.textContent ?? '';
    expect(t, t).not.toMatch(PAS_DEUX_POINTS);
    expect(t, t).toMatch(OK);
  });
  it('carte d\'article complète (lu sur la page + verdict) : même règle', () => {
    const a = {
      id: 'M1', nom: 'Marmite 50 L', domaine: 'grossiste-exemple.test', url: 'https://www.grossiste-exemple.test/m1', lecture: 'lue', dispo: 'en stock',
      valeurs: valeursDe([{ nom: 'Induction', valeur: 'non' }, { nom: 'Matière', valeur: 'Acier inox' }])
    } as unknown as Article;
    const { container } = render(<CarteArticle article={a as never} variante="complete" luSurPage={['nom', 'prix']} onOuvrir={nop} />);
    expect(container.textContent ?? '').not.toMatch(PAS_DEUX_POINTS);
  });
});

/* ======================================================================================================== R11 */

/** jsdom ne mesure rien : on lit la structure (classes, retour à la ligne permis, contrôle hors du libellé). La mise en page à 390 px reste à voir en ligne. */
const sansRetour = (e: Element): boolean =>
  !/ /.test((e.textContent ?? '').trim()) || reglesDeElement(e).some(d => /white-space:\s*nowrap/.test(d)) || /white-space:\s*nowrap/.test(e.getAttribute('style') ?? '');

describe('R11 : à 390 px, aucun contrôle poussé hors de l\'écran ; la ligne Offre garde disponibilité, prix et gestes lisibles', () => {
  describe('feuille Articles : « Veiller » et son interrupteur', () => {
    const LONG = 'Dimensions intérieures (L x P x H)';
    const carte = (valeur?: string) => render(<CarteClassee
      article={{ id: 'A1', nom: 'Chambre froide 1800', domaine: 'grossiste-exemple.test', lecture: 'lue', dispo: 'en stock', valeurs: valeur ? valeursDe([{ nom: LONG, valeur }]) : {} } as never}
      carac={{ nom: LONG, sens: 'texte' }} rang={1} onOuvrir={nop} onVeille={nop} />).container;

    for (const [etat, valeur] of [['valeur lue (« 1640 x 1340 x 1850 mm »)', '1640 x 1340 x 1850 mm'], ['sans valeur', undefined]] as const) {
      it(`${etat} : l'interrupteur n'est pas dans le libellé, et le pied peut passer à la ligne ou ses éléments rétrécir`, () => {
        const c = carte(valeur);
        const pied = c.querySelector('.cn-classee-pied')!;
        const bascule = pied.querySelector('[role=switch]')!;
        expect(bascule, 'interrupteur').not.toBeNull();
        expect(bascule.closest('.cn-classee-carac'), 'interrupteur hors du libellé').toBeNull();
        expect(texte(pied)).toMatch(/veiller/);
        const passeALaLigne = reglesDe('cn-classee-pied').some(d => /flex-wrap:\s*wrap/.test(d));
        const libelle = pied.querySelector('.cn-classee-carac');
        const valeurChip = pied.querySelector('.cn-chip-valeur');
        const rétrécit = (e: Element | null) => !e || (reglesDeElement(e).some(d => /min-width:\s*0/.test(d)) && !reglesDeElement(e).some(d => /white-space:\s*nowrap/.test(d)));
        expect(passeALaLigne || (rétrécit(libelle) && rétrécit(valeurChip)),
          'le pied « libellé · valeur · Veiller · interrupteur » doit pouvoir passer à la ligne (flex-wrap: wrap), ou son libellé et sa valeur rétrécir (min-width: 0, sans nowrap)').toBe(true);
      });
    }
    it('le libellé long peut passer à la ligne entre ses mots (déjà juste : garde-fou de C48-2)', () => {
      const lib = carte('1640 x 1340 x 1850 mm').querySelector('.cn-classee-carac')!;
      const regles = reglesDe('cn-classee-carac');
      expect(regles.length).toBeGreaterThan(0);
      expect(regles.some(d => /white-space:\s*nowrap/.test(d)), lib.className).toBe(false);
    });
  });

  describe('fiche, ligne Offre (article lu sans prix)', () => {
    const sansPrix = () => carnet([{ id: 'A1', nom: 'Chambre froide 1800', valeurs: valeursDe(PAGES.j406) }, { id: 'B1', nom: 'Chambre froide 1500', valeurs: valeursDe(PAGES.j26) }]);
    const variantes: Array<[string, Record<string, unknown>]> = [
      ['avec « Relire » et « Poser le prix »', { onRelire: nop, onPrix: nop }],
      ['sans « Relire » (« Poser le prix » seul)', { onPrix: nop }]
    ];
    for (const [nom, props] of variantes) {
      describe(nom, () => {
        const offre = () => fiche(sansPrix(), 0, props).querySelector('.cn-offre-moi')!;
        it('la disponibilité (« en stock ») tient sur une ligne : espace insécable ou white-space: nowrap', () => {
          const dispo = [...offre().querySelectorAll('.cn-offre-corps .cn-sp > span')].find(e => /stock/.test(e.textContent ?? ''));
          expect(dispo, 'disponibilité').toBeDefined();
          expect(sansRetour(dispo!), `« ${dispo!.textContent} » peut se couper (classes : ${dispo!.className})`).toBe(true);
        });
        it('« prix ? » ne se coupe pas en deux et ne reste pas seul sur sa ligne', () => {
          const prix = [...offre().querySelectorAll('span')].find(e => /^prix\s*\?$/.test((e.textContent ?? '').trim()));
          expect(prix, 'mention « prix ? »').toBeDefined();
          expect(sansRetour(prix!), `« ${prix!.textContent} » peut se couper`).toBe(true);
        });
        it('les gestes (Poser le prix, Relire, Ouvrir) sont groupés ensemble, ou la ligne peut passer à la ligne (jamais quatre colonnes tassées)', () => {
          const o = offre();
          const gestes = [...o.querySelectorAll('button, a')].filter(e => /Poser le prix|Relire|Ouvrir/.test(e.textContent ?? ''));
          expect(gestes.length).toBeGreaterThanOrEqual(2);
          const groupes = new Set(gestes.map(g => g.parentElement));
          const groupes_ok = groupes.size === 1 && ![...groupes][0]!.classList.contains('cn-offre');
          const passeALaLigne = reglesDeElement(o).some(d => /flex-wrap:\s*wrap/.test(d));
          expect(groupes_ok || passeALaLigne, `gestes : ${gestes.map(g => (g.textContent ?? '').trim()).join(' | ')}`).toBe(true);
        });
      });
    }
    it('un article qui a son prix : le prix et la disponibilité restent sur une ligne chacun (déjà juste : garde-fou)', () => {
      const c = carnet([{ id: 'A1', nom: 'Chambre froide 1800', valeurs: valeursDe(PAGES.j406), prix: 276365 }, { id: 'B1', nom: 'Chambre froide 1500', valeurs: valeursDe(PAGES.j26), prix: 249560 }]);
      const o = fiche(c, 0, { onPrix: nop }).querySelector('.cn-offre-moi')!;
      expect(texte(o)).toMatch(/2\s?763,65/);
      expect(texte(o)).toMatch(/en stock/);
    });
  });
});
