// @vitest-environment jsdom
/**
 * Voie c54-tests (24.11) : les tests ROUGES des règles R19 à R22 tirées du test en ligne du tour 54 (C53-4 rouvert, C54-1, C54-2, C54-3).
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c54-tests/DOSSIER.md), avant tout correctif : celui qui corrige
 * n'écrit pas le test. Aucun réseau réel, aucun Gemini. Données : tests/fixtures/c54/chambre-froide.json (réécrit à la main d'après
 * les captures du tour 54), des prix et des noms fictifs ; aucune donnée personnelle.
 *
 * Les tests lisent ce que le brasseur voit (texte rendu, ordre des lignes, étiquettes de la courbe, position des ronds d'une jauge) ;
 * aucun nom de composant ni de prop nouveau n'est supposé. Limite : jsdom ne mesure rien. « Rien n'est rogné au bord d'une cellule »
 * (R19) se lit donc dans le contenu de la cellule : seulement le prix, aucun prix unitaire ; R20 mesure les étiquettes avec la chasse
 * de `largeurTexte` hors navigateur, le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { trierParDecision } from '../../functions/src/lienFusion';
import { prioriserValeurs } from '../../functions/src/lienLibelles';
import { lireLien } from '../../functions/src/lireLien';
import { courbeCaisse, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { ajouterJours } from '../../src/domain/calendrier';
import { tableau, valeursLuesOrdonnees } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import type { EscalierCaisse, Marche as MarcheCaisse } from '../../src/domain/finance/analyse';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { geometrie, obstaclesZero, placerNoms } from '../../src/ui/calendrier/entete/Courbe';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { Reglette } from '../../src/ui/carnets/Choisir';
import { PrixPastille } from '../../src/ui/carnets/PrixPastille';
import { TableauCarnet } from '../../src/ui/carnets/TableauCarnet';
import { Escalier as EscalierCaisseVue } from '../../src/ui/finance/analyse/Escalier';
import { EscalierSvg, texteLotCourt } from '../../src/ui/finance/previsions/EscalierSvg';
import { construireEscalier } from '../../src/ui/finance/previsions/escalier';

afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Sans accent, en minuscules, espaces simples (insécables compris) : « Étape » → « etape ». */
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
const CHAMBRES = JSON.parse(readFileSync('tests/fixtures/c54/chambre-froide.json', 'utf8')) as Record<'cellule' | 'inconnus' | 'sansMotCle', Ligne[]>;

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
  ['inversée', l => [...l].reverse()]
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
const libellesDeFiche = (c: HTMLElement) => [...c.querySelectorAll('dl dt')].map(e => (e.textContent ?? '').trim());
const indices = (n: string[], re: RegExp) => n.map((x, i) => (re.test(x) ? i : -1)).filter(i => i >= 0);
const colles = (idx: number[]) => idx.length > 0 && Math.max(...idx) - Math.min(...idx) + 1 === idx.length;

/* ======================================================================================================== R19 */

/**
 * R19 (C53-4 rouvert) : dans la colonne prix du TABLEAU du carnet, seulement le prix (« 520 ») ; le prix unitaire (« 10,40 CHF/L ») reste
 * ENTIER dans Articles (pastille de prix), Comparer et la fiche, qui ont la place. Rien n'est rogné au bord d'une cellule : au tour 54,
 * « 50 L · 10,40 CHF/L » (69 px) débordait sa cellule (44 px, overflow hidden) et on lisait « 50 L · / 10,40 CH ».
 * Endroits : la colonne prix du tableau (`TableauCarnet`, cellules `__prix`) ; les endroits où le prix unitaire RESTE (feuille Articles, Comparer,
 * fiche) sont des garde-fous : ils ne doivent pas perdre leur prix unitaire en corrigeant le tableau.
 */
const PRIX_UNITAIRE = /\d[\d\s  '’.,]*\d\s*CHF\s*\/\s*(?:L|kg)/;
const marmites = () => carnet([
  { id: 'M1', nom: 'Marmite de brassage inox 50 L', valeurs: { Volume: val(50, 'L') }, prix: 52000 },
  { id: 'M2', nom: 'Marmite de brassage inox 80 L', valeurs: { Volume: val(80, 'L') }, prix: 79000 }
], [critere('Volume', 'Volume', 'plus', 'L')], 'Marmite');
const houblons = () => carnet([
  { id: 'H1', nom: 'Mosaic Pellets T90 100 g', valeurs: { 'Alpha acides': val(11.5, '%') }, prix: 725 },
  { id: 'H2', nom: 'Citra Pellets T90 1 kg', valeurs: { 'Alpha acides': val(12, '%') }, prix: 7250 }
], [critere('Alpha acides', 'Alpha acides', 'plus', '%')], 'Houblons');
const DEUX_GENRES = [['marmite (50 L, 520 CHF : 10,40 CHF/L)', marmites, '10,40'], ['houblon (1 kg, 72,50 CHF/kg)', houblons, '72,50']] as const;

/** Les cellules de la colonne prix du tableau : la dernière colonne (CHF), une cellule par ligne. */
function cellulesPrix(racine: HTMLElement): HTMLElement[] {
  const cellules = [...racine.querySelectorAll<HTMLElement>('[role="cell"][data-col]')];
  const colonne = Math.max(...cellules.map(c => Number(c.getAttribute('data-col'))));
  return cellules.filter(c => Number(c.getAttribute('data-col')) === colonne);
}
const texte = (e: Element) => (e.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();

describe('R19 : la colonne prix du tableau du carnet ne dit que le prix ; le prix unitaire reste entier ailleurs', () => {
  for (const [nom, fabrique, unitaire] of DEUX_GENRES) {
    it(`tableau du carnet · ${nom} : la colonne prix a une cellule par article, avec son prix (garde-fou)`, () => {
      const cellules = cellulesPrix(tableauDuCarnet(fabrique()));
      expect(cellules.length, 'une cellule de prix par article').toBe(2);
      for (const c of cellules) expect(texte(c), `cellule de prix : « ${texte(c)} »`).toMatch(/\d/);
    });
    it(`tableau du carnet · ${nom} : aucune cellule de prix ne dit le prix unitaire (« CHF/L », « CHF/kg »)`, () => {
      for (const c of cellulesPrix(tableauDuCarnet(fabrique()))) expect(texte(c), `cellule de prix : « ${texte(c)} »`).not.toMatch(/CHF\s*\/\s*(?:L|kg)/);
    });
    it(`tableau du carnet · ${nom} : aucune cellule de prix ne porte la quantité qui précède le prix unitaire (« 50 L · »)`, () => {
      for (const c of cellulesPrix(tableauDuCarnet(fabrique()))) expect(texte(c), `cellule de prix : « ${texte(c)} »`).not.toMatch(/·|\d\s*(?:L|kg|g|ml|cl|dl)\b/);
    });
    it(`tableau du carnet · ${nom} : la cellule de prix ne contient que le montant (chiffres, séparateurs, devise)`, () => {
      for (const c of cellulesPrix(tableauDuCarnet(fabrique()))) expect(texte(c), `cellule de prix : « ${texte(c)} »`).toMatch(/^[\d\s '’.,≈~€]+(?:CHF|EUR|€)?$/);
    });
    it(`feuille Articles · ${nom} : la pastille de prix garde le prix unitaire ENTIER (garde-fou, « ${unitaire} CHF/… »)`, () => {
      const t = texte(feuille(fabrique()));
      expect(t, `feuille : « ${t} »`).toMatch(PRIX_UNITAIRE);
      expect(t).toContain(unitaire);
    });
    it(`pastille de prix seule · ${nom} : prix unitaire entier (garde-fou)`, () => {
      const a = contenu(fabrique()).articles[1];
      expect(texte(render(<PrixPastille article={a} />).container)).toMatch(PRIX_UNITAIRE);
    });
    it(`Comparer · ${nom} : le prix unitaire entier (garde-fou)`, () => {
      expect(texte(comparer(fabrique()))).toMatch(PRIX_UNITAIRE);
    });
    it(`fiche d'article · ${nom} : le prix unitaire entier (garde-fou)`, () => {
      expect(texte(fiche(fabrique(), 1))).toMatch(PRIX_UNITAIRE);
    });
  }
});

/* ======================================================================================================== R20 */

/**
 * R20 (C54-1) : UNE fonction nomme une marche de courbe (« <nom> + 1 autre −159,95 ») ; l'en-tête du Calendrier et Finances › Prévisions
 * (et Analyse › Caisse) la partagent ; jamais « 2 mouvements » (ou « 2 sorties ») sans nom.
 * Endroits : Calendrier › courbe de l'en-tête (`placerNoms`, forme courte « N mouvements ») ; Prévisions (`texteLot`, forme courte
 * `texteLotCourt` « N sorties … » : même défaut, sans nom) ; Analyse › Caisse (`Escalier.tsx`). Un test de parité : le nom d'une marche se
 * lit de la même façon aux trois endroits.
 */
const LUNDI0 = '2026-11-23';
const jour = (semaine: number, plus: number) => ajouterJours(LUNDI0, semaine * 7 + plus);
const courbe = (mouvements: MouvementCaisse[]) => courbeCaisse({ depart: 114500, lundi0: LUNDI0, nbSemaines: 6, mouvements })!;
/** Le calendrier du tour 54 : le loyer du 02.12, deux achats le 08.12, un achat partiel le 13.12 ; 6 semaines, un tracé de 366 px (390 − marges). */
function placer(prefixe: string, noms: [string, string] = ['achat', 'achat rond'], largeur = 366) {
  const c = courbe([
    { id: 'loyer', jour: '2026-12-02', centimes: -62528, nom: 'Loyer de l’atelier' },
    { id: 'a', jour: '2026-12-08', centimes: -7995, nom: `${prefixe}${noms[0]}` },
    { id: 'b', jour: '2026-12-08', centimes: -8000, nom: `${prefixe}${noms[1]}` },
    { id: 'c', jour: '2026-12-13', centimes: -240, nom: 'achats' }
  ]);
  const g = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), 6, largeur, 88, 4, 70);
  const e = placerNoms(c.semaines, g, 8, obstaclesZero(g, largeur));
  // la marche du 08.12 (−159,95) ; le petit achat du 13.12 est dans la même semaine mais pas sur la même marche
  return { e, marche: e.filter(x => x.i === 2 && x.montant === '−159,95') };
}
const SEUL_LE_NOMBRE = /^\s*\d+\s+(?:mouvements?|sorties?|paiements?|op[ée]rations?|autres?)\b/i;
const NOMS_LONGS: Array<[string, [string, string]]> = [
  ['noms courts', ['achat', 'achat rond']],
  ['noms de matériel', ['Fermenteur conique inox 100 L', 'Pompe de transfert']],
  ['noms à rallonge', ['Remplacement de la cellule de refroidissement', 'Détendeur et filtre déshydrateur']]
];

describe('R20 : une marche de courbe se nomme « <nom> + 1 autre <montant> » ; jamais « 2 mouvements » sans nom', () => {
  for (const [dit, noms] of NOMS_LONGS) {
    for (const largeur of [366, 334, 300]) {
      it(`Calendrier, en-tête (${largeur} px), ${dit} : la marche du 08.12 porte un nom, jamais « 2 mouvements »`, () => {
        const { marche } = placer('ZZ TEST — ', noms, largeur);
        expect(marche, `étiquettes : ${marche.map(x => `${x.nom} ${x.montant}`).join(' | ')}`).toHaveLength(1);
        expect(marche[0].montant).toBe('−159,95');
        expect(marche[0].nom, `étiquette posée : « ${marche[0].nom} ${marche[0].montant} »`).not.toMatch(SEUL_LE_NOMBRE);
        expect(sans(marche[0].nom), `le nom de l'écriture la plus lourde se lit : « ${marche[0].nom} »`).toContain(sans(noms[0].split(' ')[0]));
      });
    }
  }
  it('Calendrier, en-tête : la marche nommée dit aussi « + 1 autre » dans sa forme posée, pas seulement dans son titre complet', () => {
    const { marche } = placer('ZZ TEST — ');
    expect(marche).toHaveLength(1);
    expect(marche[0].complet).toMatch(/achat rond \+ 1 autre$/);
    expect(marche[0].nom, `forme posée : « ${marche[0].nom} »`).toMatch(/\+ 1 autre|achat/);
  });
  it('Calendrier, en-tête : le titre complet et le nom posé disent le même nom (celui de l\'écriture la plus lourde)', () => {
    const { marche } = placer('ZZ TEST — ');
    expect(marche).toHaveLength(1);
    expect(marche[0].complet).toMatch(/^ZZ TEST — achat rond/);
    expect(marche[0].nom, `forme posée : « ${marche[0].nom} »`).toMatch(/achat/);
  });

  const sortie = (id: string, date: string, label: string, amountCents: number, plus: Partial<ForecastItem> = {}): ForecastItem =>
    ({ id, date, label, amountCents, direction: 'out', source: 'invoice', category: 'achats', ...plus });
  const lotDuJour = (prefixe: string, noms: [string, string] = ['achat', 'achat rond']): ForecastItem[] => [
    sortie('a1', '2026-12-08', `${prefixe}${noms[0]}`, 7995), sortie('a2', '2026-12-08', `${prefixe}${noms[1]}`, 8000)
  ];
  it('Prévisions : la forme courte d\'un lot (texteLotCourt) nomme l\'écriture la plus lourde, jamais « 2 sorties » seul', () => {
    const t = texteLotCourt(lotDuJour('ZZ TEST — '));
    expect(t).toMatch(/159,95/);
    expect(t, `forme courte : « ${t} »`).not.toMatch(SEUL_LE_NOMBRE);
    expect(sans(t), `forme courte : « ${t} »`).toContain('achat');
  });
  it('Prévisions : la forme courte d\'un lot, noms de matériel, nomme aussi l\'écriture la plus lourde', () => {
    const t = texteLotCourt(lotDuJour('', ['Fermenteur conique inox 100 L', 'Pompe de transfert']));
    expect(t, `forme courte : « ${t} »`).not.toMatch(SEUL_LE_NOMBRE);
    expect(sans(t), `forme courte : « ${t} »`).toMatch(/fermenteur|pompe/);
  });
  function bullesPrevisions(items: ForecastItem[], largeur = 390) {
    const e = construireEscalier({ departCents: 114500, items, debut: '2026-11-24', fin: '2027-02-22' });
    const { container } = render(<EscalierSvg e={e} largeur={largeur} asOf="2026-11-24" onEtiquette={nop} onRestes={nop} mesure={(t: string, corps: number) => Math.ceil([...t].length * corps * 0.5)} />);
    return [...container.querySelectorAll('g.prv-etq')].map(g => texte(g.querySelector('.prv-tx') ?? g));
  }
  for (const [dit, noms] of NOMS_LONGS) {
    it(`Prévisions, 390 px, ${dit} : la bulle du 08.12 dit un nom et −159,95, jamais « 2 sorties » seul`, () => {
      const bulles = bullesPrevisions(lotDuJour('ZZ TEST — ', noms));
      const b = bulles.find(x => /159,95/.test(x));
      expect(b, `bulles : ${bulles.join(' | ')}`).toBeDefined();
      expect(b!, `bulle : « ${b} »`).not.toMatch(SEUL_LE_NOMBRE);
      expect(sans(b!), `bulle : « ${b} »`).toContain(sans(noms[0].split(' ')[0]));
    });
  }

  /* La parité : le même nom de marche, aux trois endroits, pour les mêmes deux paiements du 08.12 */
  const marche = (id: string, date: string, cents: number, apres: number, libelle: string): MarcheCaisse =>
    ({ id, date, cents, apres, source: 'autres', libelle, txId: id, prevuCents: null, pasPrevu: false });
  const caisse = (prefixe: string): EscalierCaisse => ({
    du: '2026-11-24', au: '2027-02-22', depuis: null, connu: true, debutCents: 114500, finCents: 114500 - 7995 - 8000, ecartCents: -15995,
    marches: [marche('m1', '2026-12-08', -7995, 106505, `${prefixe}achat`), marche('m2', '2026-12-08', -8000, 98505, `${prefixe}achat rond`)],
    prevu: null, anDernier: { finCents: null, ecartCents: null, nombre: 0, points: [] }, pireBaisse: null, pasPrevu: [], incertains: []
  });
  const bullesAnalyse = (prefixe: string) => [...render(<EscalierCaisseVue esc={caisse(prefixe)} onTransaction={nop} onJournal={nop} />).container.querySelectorAll('.ana-et-t')].map(e => texte(e));
  it('Parité : Calendrier, Prévisions et Analyse › Caisse nomment la marche du 08.12 de la même façon (« ZZ TEST — achat rond + 1 autre »)', () => {
    const cal = placer('ZZ TEST — ').marche[0].complet!;
    const prev = bullesPrevisions(lotDuJour('ZZ TEST — ')).find(x => /159,95/.test(x));
    const ana = bullesAnalyse('ZZ TEST — ')[0];
    expect(cal).toBe('ZZ TEST — achat rond + 1 autre');
    expect(prev, 'Prévisions').toBeDefined();
    expect(sans(prev!), `Prévisions : « ${prev} »`).toContain(sans(cal));
    expect(sans(ana ?? ''), `Analyse › Caisse : « ${ana} »`).toContain(sans(cal));
  });
  it('Parité, trois écritures le même jour : « + 2 autres » aux trois endroits', () => {
    const c = courbe([
      { id: 'a', jour: '2026-12-08', centimes: -7995, nom: 'ZZ TEST — achat' }, { id: 'b', jour: '2026-12-08', centimes: -8000, nom: 'ZZ TEST — achat rond' },
      { id: 'c', jour: '2026-12-08', centimes: -3000, nom: 'ZZ TEST — achat petit' }
    ]);
    const g = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), 6, 366, 88, 4, 70);
    const cal = placerNoms(c.semaines, g, 8, obstaclesZero(g, 366)).filter(x => x.i === 2);
    expect(cal, 'Calendrier').toHaveLength(1);
    expect(cal[0].complet).toMatch(/\+ 2 autres$/);
    const prev = bullesPrevisions([sortie('a1', '2026-12-08', 'ZZ TEST — achat', 7995), sortie('a2', '2026-12-08', 'ZZ TEST — achat rond', 8000), sortie('a3', '2026-12-08', 'ZZ TEST — achat petit', 3000)]).find(x => /189,95/.test(x));
    expect(prev, 'Prévisions').toMatch(/\+ 2 autres/);
  });
});

/* ======================================================================================================== R21 */

/**
 * R21 (C54-2) : les groupes de R16 se reconnaissent par MOTS-CLÉS, pas par une liste de noms exacts.
 *  - énergie : puissance, tension, branchement, étape, phase, consommation, kWh, W, V ;
 *  - froid : fluide, frigorigène, réfrigérant, quantité de frigorigène, refroidissement, température ;
 *  - dimensions : dimension, hauteur, largeur, profondeur, porte ;
 *  un nom inconnu va dans le groupe de son mot-clé, sinon après les groupes.
 * Tour 54 : « Étape 1N~/PE » (le branchement, monophasé avec neutre et terre) venait après la porte, loin de Performance et Tension ; « Quantité
 * de frigorigène 0,13 kg » après Exécution, loin de « Fluide frigorigène R290 » ; attendu : 1N~/PE à côté de 230 V et nommé « Branchement ».
 * Endroits qui rangent : la fiche (grille), l'article déjà rangé (`lireCarnet`), l'ordre de décision (`trierParDecision`), la lecture serveur
 * (`prioriserValeurs`, `lireLien`), les valeurs de la carte et de Comparer (`valeursLuesOrdonnees`).
 * Le froid se teste SANS la température : elle décide d'abord (C50-4) et reste en tête de la fiche.
 */
const ENERGIE = /(?:puissance|performance|consommation|tension|branchement|etape|phase)/;
const FROID = /(?:fluide|frigorigene|refrigerant|refroidissement)/;
const DIMENSIONS = /(?:dimension|hauteur|largeur|profondeur|\bporte\b)/;
type Groupe = 'energie' | 'froid' | 'dimensions';
const GROUPES: Record<Groupe, RegExp> = { energie: ENERGIE, froid: FROID, dimensions: DIMENSIONS };

function groupe(libelles: string[], g: Groupe) {
  const n = libelles.map(sans);
  return { n, idx: indices(n, GROUPES[g]), contexte: `ordre lu : ${n.join(' | ')}` };
}
const attendreGroupeColle = (libelles: string[], g: Groupe, au_moins: number) => {
  const { idx, contexte } = groupe(libelles, g);
  expect(idx.length, `au moins ${au_moins} lignes de ${g} ; ${contexte}`).toBeGreaterThanOrEqual(au_moins);
  expect(colles(idx), `le groupe ${g} ensemble ; ${contexte}`).toBe(true);
};
const attendreVoisines = (libelles: string[], a: RegExp, b: RegExp, dit: string) => {
  const n = libelles.map(sans), ia = indices(n, a), ib = indices(n, b);
  expect(ia.length, `${dit} : première ligne trouvée ; ordre lu : ${n.join(' | ')}`).toBeGreaterThan(0);
  expect(ib.length, `${dit} : seconde ligne trouvée ; ordre lu : ${n.join(' | ')}`).toBeGreaterThan(0);
  expect(Math.min(...ia.flatMap(x => ib.map(y => Math.abs(x - y)))), `${dit} : côte à côte ; ordre lu : ${n.join(' | ')}`).toBe(1);
};

/** Chaque endroit rend la liste des libellés dans l'ordre où le brasseur les lit. */
type Endroit = [string, (l: Ligne[]) => string[] | Promise<string[]>];
const HTML = readFileSync('tests/fixtures/c48/chambre-froide-1800.html', 'utf8');
const SPEC = /<section class="product-specs">[\s\S]*?<\/section>/.exec(HTML)![0];
const URL_PAGE = 'https://www.grossiste-exemple.ch/fr-ch-chf/chambre-froide-1800-x-1500';
async function lireLignes(lignes: Ligne[]): Promise<string[]> {
  const html = HTML.split(SPEC).join(`<section class="product-specs"><h2>Caractéristiques techniques</h2><ul>${lignes.map(l => `<li>${l.nom} : ${l.valeur}${l.unite ? ` ${l.unite}` : ''}</li>`).join('')}</ul></section>`);
  const fetchPage = (async (entree: RequestInfo | URL) => {
    const url = String(entree);
    if (url.endsWith('/robots.txt')) return new Response('', { status: 404, headers: { 'content-type': 'text/plain' } });
    if (url === URL_PAGE) return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
    throw new Error(`réseau interdit dans les tests : ${url}`);
  }) as unknown as typeof fetch;
  const p = await lireLien(URL_PAGE, { fetchPage, maintenant: 1, cours: null });
  expect(p.statut).toBe('lue');
  return (p.valeurs ?? []).map(v => v.nom);
}
const ENDROITS: Endroit[] = [
  ['fiche d\'article (FicheArticle)', l => libellesDeFiche(fiche(carnet([{ id: 'C1', nom: 'Chambre froide', valeurs: valeursDe(l) }])))],
  ['article déjà rangé (lireCarnet → fiche)', l => libellesDeFiche(fiche(lireCarnet(carnet([{ id: 'C1', nom: 'Chambre froide', valeurs: valeursDe(l) }]) as never)!))],
  ['ordre de décision (trierParDecision)', l => trierParDecision(l).map(x => x.nom)],
  ['lecture serveur (prioriserValeurs)', l => prioriserValeurs(l.map(x => ({ nom: x.nom, valeur: x.valeur, ...(x.unite ? { unite: x.unite } : {}) })) as never[]).map((v: { nom: string }) => v.nom)],
  ['valeurs de la carte et de Comparer (valeursLuesOrdonnees)', l => Object.keys(valeursLuesOrdonnees({ valeurs: valeursDe(l) }))],
  ['lecture complète d\'une page (lireLien)', l => lireLignes(l)]
];

describe('R21 : les groupes énergie, froid, dimensions se reconnaissent par mots-clés ; un nom inconnu va dans le groupe de son mot-clé', () => {
  for (const [endroit, rendre] of ENDROITS) {
    for (const [page, permuter] of PAGES) {
      const ou = `${endroit}, page ${page}`;
      it(`${ou} · chambre froide lue en ligne : « Étape » (le branchement) à côté de « Tension » dans l'énergie`, async () => {
        attendreVoisines(await rendre(permuter(CHAMBRES.cellule)), /^(?:tension)\b/, /^(?:etape|branchement)\b/, 'Tension et Étape/Branchement');
      });
      it(`${ou} · chambre froide lue en ligne : l'énergie (performance, tension, étape) ensemble`, async () => {
        attendreGroupeColle(await rendre(permuter(CHAMBRES.cellule)), 'energie', 3);
      });
      it(`${ou} · chambre froide lue en ligne : « Quantité de frigorigène » à côté de « Fluide frigorigène »`, async () => {
        attendreVoisines(await rendre(permuter(CHAMBRES.cellule)), /^fluide frigorigene\b/, /^quantite de frigorigene\b/, 'Fluide et Quantité de frigorigène');
      });
      it(`${ou} · chambre froide lue en ligne : le froid (refroidissement, fluide, quantité) ensemble`, async () => {
        attendreGroupeColle(await rendre(permuter(CHAMBRES.cellule)), 'froid', 3);
      });
      it(`${ou} · chambre froide lue en ligne : les dimensions et la porte ensemble`, async () => {
        attendreGroupeColle(await rendre(permuter(CHAMBRES.cellule)), 'dimensions', 4);
      });
      it(`${ou} · noms jamais vus : « Phases d'alimentation » et « Consommation annuelle » vont avec « Tension » (mot-clé de l'énergie)`, async () => {
        attendreGroupeColle(await rendre(permuter(CHAMBRES.inconnus)), 'energie', 3);
      });
      it(`${ou} · noms jamais vus : « Charge de réfrigérant » va avec « Fluide frigorigène » (mot-clé du froid)`, async () => {
        attendreVoisines(await rendre(permuter(CHAMBRES.inconnus)), /^fluide frigorigene\b/, /^charge de refrigerant\b/, 'Fluide et Charge de réfrigérant');
      });
      it(`${ou} · noms jamais vus : les dimensions (produit, profondeur utile, porte) ensemble`, async () => {
        attendreGroupeColle(await rendre(permuter(CHAMBRES.inconnus)), 'dimensions', 4);
      });
      it(`${ou} · noms sans aucun mot-clé (« Charnières », « Éclairage ») : après les groupes, jamais au milieu`, async () => {
        // seuls les deux noms sans mot-clé sont inconnus ici : le test ne dépend d'aucune autre correction
        const connus = CHAMBRES.inconnus.filter(l => /^(?:tension|fluide frigorigene|hauteur de la porte|largeur de la porte|dimensions du produit|couleur)\b/.test(sans(l.nom)));
        const n = (await rendre(permuter([...connus, ...CHAMBRES.sansMotCle]))).map(sans);
        const apres = indices(n, /^(?:charnieres|eclairage)\b/);
        const groupes = [...indices(n, ENERGIE), ...indices(n, FROID), ...indices(n, DIMENSIONS)];
        expect(apres, `les deux noms sans mot-clé sont lus ; ordre lu : ${n.join(' | ')}`).toHaveLength(2);
        expect(Math.min(...apres), `après les groupes ; ordre lu : ${n.join(' | ')}`).toBeGreaterThan(Math.max(...groupes));
      });
      it(`${ou} · un nom inconnu dont la VALEUR est en W (« Régime nominal 400 W ») va avec l'énergie`, async () => {
        const l = [...CHAMBRES.cellule, { nom: 'Régime nominal', valeur: '400 W' }];
        const n = (await rendre(permuter(l))).map(sans);
        const energie = indices(n, /^(?:performance|tension|etape|branchement|regime nominal)\b/);
        expect(energie, `trois lignes d'énergie plus le régime ; ordre lu : ${n.join(' | ')}`).toHaveLength(4);
        expect(colles(energie), `l'énergie ensemble, régime nominal compris ; ordre lu : ${n.join(' | ')}`).toBe(true);
      });
    }
  }
  it('lecture d\'une page (lireLien) : « Étape 1N~/PE » est nommé « Branchement » (C54-2 : « et nommé Branchement »)', async () => {
    const n = (await lireLignes(CHAMBRES.cellule)).map(sans);
    expect(n.some(x => /^branchement\b/.test(x)), `noms lus : ${n.join(' | ')}`).toBe(true);
    expect(n.some(x => /^etape$/.test(x)), `« Étape » seul ne dit rien à un brasseur ; noms lus : ${n.join(' | ')}`).toBe(false);
  });
});

/* ======================================================================================================== R22 */

/**
 * R22 (C54-3) : une jauge a le même sens partout (fiche, feuille Articles, Comparer) : petit à gauche, grand à droite ; « la plus haute »
 * toujours du même côté. Tour 54 : sur la fiche, la jauge de « Volume de 50 L » (critère « plus ») va de 242 (à gauche, « la plus haute des 2 »)
 * à 50 (à droite) ; sur la feuille Articles, la même jauge croît vers la droite (242 pleine, 50 courte).
 * Endroits (grep « left: » et « reglette », « piste ») : la jauge de la fiche (`Piste`, FicheArticle) ; la règle de la feuille Articles
 * (`cn-reglette-plein`, CarteClassee) ; la réglette de l'écran Choisir (`Reglette`, g05-11 : « ‹ mieux » à gauche, MAQUETTE CHOISIE) ;
 * Comparer n'a pas de jauge (ses cellules disent des chiffres, `cn-meilleur` marque le meilleur).
 */
const volumes = (sens: 'plus' | 'moins') => carnet([
  { id: 'V1', nom: 'Marmite de brassage inox 50 L', valeurs: { Volume: val(50, 'L') }, prix: 52000 },
  { id: 'V2', nom: 'Kibernetik KS240L', valeurs: { Volume: val(242, 'L') }, prix: 30200 }
], [critere('Volume de 50 L', 'Volume', sens, 'L')], 'Marmite');
const gauche = (e: Element) => Number((e as HTMLElement).style.left.replace('%', ''));
/** Les ronds de la jauge d'une fiche, dans l'ordre croissant des valeurs (le DOM les trie), avec leur position en % depuis la gauche. */
function rondsDeFiche(c: HTMLElement) { return [...c.querySelectorAll('.cn-piste-rond')].map(gauche); }
const bornesDeFiche = (c: HTMLElement) => [...c.querySelectorAll('.cn-piste-borne')].map(texte);

describe('R22 : une jauge a le même sens partout (petit à gauche, grand à droite) ; « la plus haute » du même côté', () => {
  for (const sens of ['plus', 'moins'] as const) {
    it(`fiche d'article · critère « ${sens} » : le rond de 242 est à DROITE du rond de 50`, () => {
      const ronds = rondsDeFiche(fiche(volumes(sens), 0));
      expect(ronds, 'un rond par article en lice').toHaveLength(2);
      expect(ronds[0], `positions des ronds (50 puis 242) : ${ronds.join(' | ')} %`).toBeLessThan(ronds[1]);
    });
    it(`fiche d'article · critère « ${sens} » : la borne de gauche dit 50, celle de droite dit 242`, () => {
      const b = bornesDeFiche(fiche(volumes(sens), 0));
      expect(b, `bornes : ${b.join(' | ')}`).toHaveLength(2);
      expect(b[0], `à gauche : ${b[0]}`).toMatch(/\b50\b/);
      expect(b[1], `à droite : ${b[1]}`).toMatch(/\b242\b/);
    });
    it(`fiche d'article · critère « ${sens} » : « la plus haute » est à droite, du côté du grand`, () => {
      const b = bornesDeFiche(fiche(volumes(sens), 0));
      const haute = b.findIndex(x => /plus haute/.test(x));
      if (haute >= 0) expect(haute, `bornes : ${b.join(' | ')}`).toBe(b.length - 1);
      const basse = b.findIndex(x => /plus basse/.test(x));
      if (basse >= 0) expect(basse, `bornes : ${b.join(' | ')}`).toBe(0);
    });
    it(`feuille Articles · critère « ${sens} » : la règle de 242 est plus pleine que celle de 50 (garde-fou)`, () => {
      const pleins = [...feuille(volumes(sens)).querySelectorAll<HTMLElement>('.cn-classee')].map(c => ({
        texte: texte(c), plein: parseFloat(c.querySelector<HTMLElement>('.cn-reglette-plein')?.style.width ?? 'NaN')
      }));
      const p242 = pleins.find(x => /242/.test(x.texte)), p50 = pleins.find(x => /\b50\b/.test(x.texte) && !/242/.test(x.texte));
      expect(p242 && p50, `cartes lues : ${pleins.map(x => `${x.plein} %`).join(' | ')}`).toBeTruthy();
      expect(p242!.plein, 'la grande valeur remplit plus').toBeGreaterThan(p50!.plein);
    });
  }
  /* L'écran Choisir (g05-11) : « ‹ mieux · 242 » à gauche, « 50 L » à droite, pour un critère « plus ». C'est une maquette choisie par le brasseur (règle n° 1) :
     le test est écrit, mais SAUTÉ tant que le pilote n'a pas tranché (DÉCISION À PRENDRE de RESULTAT.md) ; ni vert ni rouge, il ne dicte rien. */
  it.skip('écran Choisir (Reglette, g05-11) · critère « plus » : le rond de 242 est à DROITE du rond de 50 — à trancher (maquette choisie)', () => {
    const place = { nom: 'volume', libelle: 'Volume', texte: '50 L', valeur: 50, meilleure: 242, pire: 50, toutes: [242, 50], unite: 'L', sur: 2, rang: 2 };
    const c = render(<Reglette place={place as never} />).container;
    const ronds = [...c.querySelectorAll('.cn-reglette-piste i')].map(gauche);
    expect(ronds[0], `positions (242 puis 50 puis le choisi) : ${ronds.join(' | ')} %`).toBeGreaterThan(ronds[1]);
  });
});
