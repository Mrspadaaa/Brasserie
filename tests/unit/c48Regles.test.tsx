// @vitest-environment jsdom
/**
 * Voie c48-tests (24.11) : les tests ROUGES des règles R1..R5 tirées du test en ligne du carnet « Chambre froide » (tour 48, C48-1..6).
 * Écrits depuis les RÈGLES (work/missions/2026-11-23-reprise-soir/voies/c48-tests/DOSSIER.md), pas depuis le code actuel, avant tout correctif :
 * celui qui corrige n'écrit pas le test. Aucun réseau, aucun Gemini (IA simulée). Données : prix hors TVA 2 763,65 et 2 495,60 CHF,
 * 0 à 8 °C, volume 4,06 et 2,6 m³ ; aucune donnée personnelle.
 *
 * Contrat pour le correctif, seul nom que ces tests supposent : `onRelire` (fonction sans argument) sur FicheArticle et sur Comparer ;
 * le test ne regarde que le mot « Relire » dans le rendu.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { lirePage } from '../../functions/src/lireLien';
import { prioriserValeurs } from '../../functions/src/lienLibelles';
import { completerParIA, type AppelIA } from '../../functions/src/lienIA';
import type { PageLue } from '../../functions/src/carnetIA';
import { compromisDe, rangeParDetail, tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type Critere } from '../../src/domain/carnets/modele';
import { Comparer, colonnesComparer, texteCellule } from '../../src/ui/carnets/Comparer';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { TableauCarnet, colonnesCarnet, enteteCourt } from '../../src/ui/carnets/TableauCarnet';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { depuisIA } from '../../src/ui/carnets/lignesRegles';

afterEach(() => cleanup());

const lireFixture = (f: string) => readFileSync(`tests/fixtures/c48/${f}`, 'utf8');
const css = (f: string) => readFileSync(`src/ui/carnets/${f}`, 'utf8');
const norm = (s: string) => s.normalize('NFKC').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
/** Sans aucun espace ni signe : « 0 °C à 8 °C » et « 0°C à 8°C » se comparent. */
const serre = (s: string) => norm(s).replace(/\s+/g, '');

/* ------------------------------------------------------------------ les deux chambres froides du test en ligne */

const U1 = new URL('https://www.grossiste-exemple.test/fr-ch-chf/chambre-froide-1800-x-1500');
const v = (valeur: string | number, unite?: string) => ({ valeur, ...(unite ? { unite } : {}), origine: 'page' as const });
const lesDouze = (dim: string, dimInt: string): Article['valeurs'] => ({
  'Dimensions intérieures (L x P x H)': v(dimInt), 'Densité d\'isolation': v(42, 'kg/m³'), 'Mode de fonctionnement': v('Électricité'),
  'Largeur de la porte': v(700, 'mm'), Performance: v(550, 'Watt'), 'Exécution/équipement': v('avec groupe frigorifique'), Couleur: v('RAL 9002'),
  'Épaisseur du matériel': v(0.5, 'mm'), 'Épaisseur de l\'isolation': v(80, 'mm'), 'Matériau du produit': v('Tôle d\'acier galvanisée, peinte en plastique'),
  'Hauteur de la porte': v(1845, 'mm'), 'Dimensions du produit': v(dim)
});
const TITRE_1 = '1800 x 1500 mm - 4,06 m³ - groupe frigorifique inclus';
const TITRE_2 = '1500 x 1200 mm - 2,6 m³ - groupe frigorifique inclus';

interface Options { prix?: boolean; volume?: boolean; critere?: boolean }
/** Le carnet du test : 2 articles lus, 12 caractéristiques chacun ; `prix` : lus (hors TVA) ; `volume` : une ligne Volume ; `critere` : « Volume » classe. */
function chambreFroide(o: Options = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const art = (id: string, nom: string, dim: string, dimInt: string, centimes: number, m3: number): Article => ({
    id, nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${id}`, lecture: 'lue', dispo: 'en stock',
    valeurs: { ...lesDouze(dim, dimInt), ...(o.volume ? { Volume: v(m3, 'm³') } : {}) },
    ...(o.prix ? { prixCentimes: centimes, devise: 'CHF', taxe: 'ht' as const } : {})
  });
  const criteres: Critere[] = o.critere ? [{ id: 'K1', texte: 'Volume', origine: 'vous', caracteristique: { nom: 'Volume', unite: 'm³', sens: 'plus' } }] : [];
  return {
    ...base, title: 'Chambre froide',
    carnet: { ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: [art('CF1', TITRE_1, '1800 x 1500 x 2010 mm', '1640 x 1340 x 1850 mm', 276365, 4.06), art('CF2', TITRE_2, '1500 x 1200 x 2010 mm', '1340 x 1040 x 1850 mm', 249560, 2.6)] }
  } as CarnetDoc;
}
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;
const comparer = (c: CarnetDoc, plus: Record<string, unknown> = {}) =>
  render(<Comparer titre={c.title} statut="research" tableau={tableau(c)} critere={c.carnet.criteres[0] as never} onRetour={() => undefined} {...plus} />).container;
const feuille = (c: CarnetDoc) => {
  const t = tableau(c)!;
  return render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={t as never} aRelire={[]} onFermer={() => undefined} onOuvrir={() => undefined} />).container;
};
/** Chaque valeur écrite dans une cellule du tableau de Comparer (3 caractères au moins), telle qu'on la lit. */
const valeursDuTableau = (c: CarnetDoc): string[] => {
  const t = tableau(c)!;
  return colonnesComparer(t).flatMap(col => t.lignes.map(l => texteCellule(l, col))).filter((x): x is string => !!x).map(norm).filter(x => x.length >= 3);
};
const repete = (phrase: string, c: CarnetDoc) => { const p = norm(phrase); return valeursDuTableau(c).filter(x => p.includes(x)); };

/* ======================================================================================================== R1 */

describe('R1 : un article dont la page publie un prix (même hors TVA) a un prix dans l\'app', () => {
  const prixBloc = /<div class="price-box">[\s\S]*?<\/div>/.exec(lireFixture('chambre-froide-1800.html'))![0];
  const html = lireFixture('chambre-froide-1800.html');
  const sansBloc = html.split(prixBloc).join('');
  const rempli = '<p>' + 'Livraison par transporteur sur palette, déchargement non compris, montage possible sur demande. '.repeat(10) + '</p>';

  it('page lue : le prix hors TVA sous le titre est lu, avec son TTC (déjà juste sur ce balisage : garde-fou)', () => {
    const p = lirePage(html, U1, 1);
    expect(p).toMatchObject({ prix: 2763.65, devise: 'CHF', taxe: 'ht', prixTTC: 2987.51 });
  });
  it('page lue : le prix écrit AVANT le titre (bandeau d\'achat au-dessus de la galerie) est lu', () => {
    const p = lirePage(sansBloc.split('<h1>').join(`${prixBloc}<h1>`), U1, 1);
    expect(p.prix).toBe(2763.65);
    expect(p.taxe).toBe('ht');
  });
  it('page lue : le prix écrit loin sous le titre (livraison, variantes entre les deux) est lu', () => {
    const p = lirePage(sansBloc.split('<div class="product-buy">').join(`${rempli}<div class="product-buy">${prixBloc}`), U1, 1);
    expect(p.prix).toBe(2763.65);
    expect(p.taxe).toBe('ht');
  });
  it('ligne rangée : le prix lu hors TVA devient le prix de l\'article, le TTC suit (déjà juste : garde-fou)', () => {
    const page = lirePage(html, U1, 1);
    const l = depuisIA({ id: 'L1', sorte: 'article', url: U1.href, page } as never, { carnetId: 'C1' } as never) as { prixCentimes?: number; taxe?: string; prixTTCCentimes?: number };
    expect(l).toMatchObject({ prixCentimes: 276365, taxe: 'ht', prixTTCCentimes: 298751 });
  });

  const lueSansPrix = (): CarnetDoc => chambreFroide();
  it('fiche : un article lu SANS prix propose « Relire » (geste du brasseur : rien ne part tout seul)', () => {
    const c = lueSansPrix();
    let appels = 0;
    const { container } = render(<FicheArticle article={contenu(c).articles[0]} carnet={contenu(c)} titreCarnet={c.title} onRetour={() => undefined} onVeille={() => undefined}
      onPrix={() => undefined} {...{ onRelire: () => { appels++; } }} />);
    expect(container.textContent).toMatch(/Relire/);
    expect(appels).toBe(0);
  });
  it('Comparer : le « prix ? » d\'un article lu propose « Relire » (geste du brasseur : rien ne part tout seul)', () => {
    let appels = 0;
    const c = comparer(lueSansPrix(), { onRelire: () => { appels++; } });
    expect(c.querySelector('.cn-hach')).not.toBeNull();
    expect(c.textContent).toMatch(/Relire/);
    expect(appels).toBe(0);
  });
  it('un article qui a son prix ne propose pas « Relire le prix » dans sa fiche', () => {
    const c = chambreFroide({ prix: true });
    const { container } = render(<FicheArticle article={contenu(c).articles[0]} carnet={contenu(c)} titreCarnet={c.title} onRetour={() => undefined} onVeille={() => undefined}
      onPrix={() => undefined} {...{ onRelire: () => undefined }} />);
    expect(container.textContent).toMatch(/2\s?763,65/);
    expect(container.textContent).not.toMatch(/Relire le prix/i);
  });
});

/* ======================================================================================================== R2 */

/**
 * Un en-tête « coupé au milieu d'un mot » : un jeton terminé par un point (ou par « … ») dont le début est un préfixe strict, d'au moins
 * 5 lettres, d'un mot du nom (« Dimensio. », « Performa. »). Les abréviations courtes (« Dim. », « int. ») et les mots entiers passent.
 */
const motsDe = (nom: string) => nom.toLowerCase().split(/[\s/()'’,]+/).filter(Boolean);
const coupeAuMilieu = (sortie: string, nom: string): string[] => {
  const mots = motsDe(nom);
  return sortie.toLowerCase().split(/\s+/).filter(Boolean).filter(j => {
    const sansFin = j.replace(/[.…]+$/, '');
    const marque = sansFin !== j;
    const prefixeStrict = mots.some(m => m.startsWith(sansFin) && m.length > sansFin.length);
    return prefixeStrict && sansFin.length >= (marque ? 5 : 3);
  });
};
const NOMS_DU_CARNET = ['Dimensions intérieures (L x P x H)', 'Dimensions du produit', 'Performance', 'Exécution/équipement', 'Mode de fonctionnement', 'Épaisseur de l\'isolation', 'Matériau du produit', 'Largeur de la porte'];
/** Les déclarations CSS des blocs dont le sélecteur contient `selecteur`. */
const declarations = (f: string, selecteur: string): string[] =>
  [...css(f).matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => m[1].includes(selecteur)).map(m => m[2]);
const MILIEU_DE_MOT = /overflow-wrap:\s*(?:break-word|anywhere)|word-break:\s*(?:break-all|break-word)|hyphens:\s*auto|text-overflow:\s*ellipsis/;

describe('R2 : un libellé de colonne ou de ligne n\'est jamais coupé au milieu d\'un mot (390 px)', () => {
  it('tableau du carnet, en-tête de colonne (enteteCourt) : mot entier ou libellé court entier, jamais « Dimensio. »', () => {
    for (const nom of NOMS_DU_CARNET) {
      const sortie = enteteCourt({ nom });
      expect(coupeAuMilieu(sortie, nom), `« ${sortie} » pour « ${nom} »`).toEqual([]);
      expect(sortie.length, nom).toBeGreaterThan(0);
    }
  });
  it('tableau du carnet rendu : aucun en-tête de colonne coupé (la colonne « Dimensions intérieures » du test)', () => {
    const c = chambreFroide();
    const t = tableau(c)!;
    const { container } = render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={t as never} aRelire={[]} sep={null} onOuvrir={() => undefined} />);
    const noms = colonnesCarnet(t as never).map(x => x.nom);
    const entetes = [...container.querySelectorAll('[role=columnheader]')].map(e => e.textContent ?? '').filter(x => !/rang/.test(x));
    expect(entetes.length).toBeGreaterThan(0);
    for (const e of entetes) for (const nom of noms) expect(coupeAuMilieu(e, nom), `« ${e} »`).toEqual([]);
  });
  it('Comparer, libellé de ligne (th « Dimensions intérieures », « Performance », « fonctionnement ») : aucune règle ne casse un mot', () => {
    const regles = [...declarations('carnets-decider.css', 'tbody th'), ...declarations('carnets.css', 'tbody th'), ...declarations('comparer-compact.css', 'tbody th')];
    expect(regles.length).toBeGreaterThan(0);
    for (const r of regles) expect(r, r).not.toMatch(MILIEU_DE_MOT);
  });
  it('Comparer rendu : un libellé de ligne ne se dit jamais en abrégé coupé (« Dimensio. »), mot entier ou libellé court entier', () => {
    const libelles = [...comparer(chambreFroide()).querySelectorAll('tbody th[scope=row]')].map(e => (e.textContent ?? '').trim());
    expect(libelles.some(l => /Dimensions/.test(l))).toBe(true);
    for (const l of libelles) for (const nom of NOMS_DU_CARNET) expect(coupeAuMilieu(l, nom), `« ${l} »`).toEqual([]);
  });
  it('feuille Articles, libellé de la caractéristique qui classe (.cn-classee-carac) : pas d\'ellipse au milieu d\'un mot', () => {
    const regles = declarations('carnets.css', '.cn-classee-carac');
    expect(regles.length).toBeGreaterThan(0);
    for (const r of regles) expect(r, r).not.toMatch(MILIEU_DE_MOT);
  });
  it('tableau du carnet, valeur d\'une cellule (« 1640 x 1340 x 1850 mm ») : sur une seule ligne, sans espace où la ligne se coupe', () => {
    const c = chambreFroide();
    const t = tableau(c)!;
    const { container } = render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={t as never} aRelire={[]} sep={null} onOuvrir={() => undefined} />);
    const cellules = [...container.querySelectorAll<HTMLElement>('[role=cell][data-col]')].filter(e => /1640|1340/.test(e.textContent ?? ''));
    expect(cellules.length).toBeGreaterThan(0);
    for (const cel of cellules) {
      const valeur = cel.querySelector('.cn-mono')!;
      const insecable = !/ /.test(valeur.textContent ?? '');
      const nowrap = /\bcn-nowrap\b/.test(valeur.className) || /white-space:\s*nowrap/.test(valeur.getAttribute('style') ?? '') || /\bcn-nowrap\b/.test(cel.className);
      expect(insecable || nowrap, `« ${valeur.textContent} »`).toBe(true);
    }
  });
});

/* ======================================================================================================== R3 */

const tete = (s: string) => norm(s).replace(/^classés?\s+par\s*(?:ce qui compte)?\s*:?\s*/, '');
const teteComparer = (c: HTMLElement) => norm(c.querySelector('.cn-chaine b')?.textContent ?? '');
const texteFeuille = (c: HTMLElement) => tete([...c.querySelectorAll('p')].map(p => p.textContent ?? '').find(t => /^\s*Classés?\s+par/.test(t)) ?? '');

describe('R3 : un seul classement des critères pour un carnet (Articles et Comparer disent le même critère en tête)', () => {
  it('sans critère ni prix lu (le carnet du test) : Comparer ne met pas « Prix ? » en tête quand Articles dit autre chose', () => {
    const c = chambreFroide();
    const cmp = teteComparer(comparer(c));
    const art = texteFeuille(feuille(c));
    expect(cmp.length).toBeGreaterThan(0);
    expect(art.length).toBeGreaterThan(0);
    expect(art.startsWith(cmp) || cmp.startsWith(art), `Comparer : « ${cmp} » ; Articles : « ${art} »`).toBe(true);
  });
  it('un critère « Volume » et les deux prix lus : même critère en tête dans Comparer et dans Articles', () => {
    const c = chambreFroide({ prix: true, volume: true, critere: true });
    const cmp = teteComparer(comparer(c));
    const art = texteFeuille(feuille(c));
    expect(art.startsWith(cmp) || cmp.startsWith(art), `Comparer : « ${cmp} » ; Articles : « ${art} »`).toBe(true);
  });
  it('un critère « Volume » : le critère de tête de Comparer est celui que le calcul du rang nomme (rangeParDetail)', () => {
    const c = chambreFroide({ prix: true, volume: true, critere: true });
    const d = rangeParDetail(c);
    expect(d.critere).toMatchObject({ nom: 'Volume' });
    const cmp = teteComparer(comparer(c));
    expect(cmp.includes('volume'), `Comparer : « ${cmp} » ; rang par « ${d.texte} »`).toBe(true);
  });
  it('tableau du carnet : la 1re colonne est celle du critère qui classe (déjà juste : garde-fou)', () => {
    const c = chambreFroide({ prix: true, volume: true, critere: true });
    expect(colonnesCarnet(tableau(c)! as never)[0].nom).toBe('Volume');
  });
});

/* ======================================================================================================== R4 */

describe('R4 : un encadré de synthèse (« Compromis ») ne répète aucune valeur déjà dans le tableau', () => {
  it('compromisDe, sans critère ni prix (le carnet du test) : il récite le tableau, il disparaît ou dit autre chose', () => {
    const c = chambreFroide();
    const phrase = compromisDe(tableau(c));
    expect(repete(phrase ?? '', c), `« ${phrase} »`).toEqual([]);
  });
  it('compromisDe, rangé par le prix seul (deux prix lus, aucun critère) : les prix et dimensions du tableau ne se redisent pas', () => {
    const c = chambreFroide({ prix: true });
    const phrase = compromisDe(tableau(c));
    expect(repete(phrase ?? '', c), `« ${phrase} »`).toEqual([]);
  });
  /* TEST ADAPTÉ par c48-fix (24.11), décision (b) du pilote (DOSSIER.md) : avec un critère, la phrase du compromis de sa maquette choisie g01-8
     (« la 2e, 1 450 CHF, soit 1 150 CHF de moins que la 1re ; le débit 1 200 m³/h au lieu de 1 800 m³/h ») reste telle quelle. L'ancien test exigeait
     qu'elle ne redise aucune valeur du tableau : caduc sur le cas avec critère (la règle « ne recopie pas » ne vaut que sans critère). */
  it('compromisDe, un critère « Volume » et deux prix : la phrase de la maquette g01-8 reste (la 2e, son prix, l\'écart, la valeur du critère)', () => {
    const c = chambreFroide({ prix: true, volume: true, critere: true });
    const phrase = compromisDe(tableau(c)) ?? '';
    expect(phrase, `« ${phrase} »`).toMatch(/^la 2e, 2\s?495,60 CHF, soit 268,05 CHF de moins que la 1re ; le volume 2,6 m³ au lieu de 4,06 m³$/);
  });
  const IA_RECITE = 'la 1re, prix non lu ; les dimensions intérieures 1640 x 1340 x 1850 mm contre 1340 x 1040 x 1850 mm ; les dimensions du produit 1800 x 1500 x 2010 mm contre 1500 x 1200 x 2010 mm';
  it('Comparer rendu avec un compromis de l\'IA qui récite le tableau : il n\'est pas montré', () => {
    const c = chambreFroide();
    const encart = comparer(c, { compromis: IA_RECITE }).querySelector('.cn-compromis');
    expect(repete(encart?.textContent ?? '', c), `« ${encart?.textContent} »`).toEqual([]);
  });
  it('Comparer rendu : un compromis qui dit ce que le tableau ne dit pas (gain, perte) reste affiché (garde-fou du correctif)', () => {
    const c = chambreFroide({ prix: true, volume: true });
    const dit = 'la 1re gagne un peu plus d\'un mètre cube de place, mais coûte plus cher';
    const encart = comparer(c, { compromis: dit }).querySelector('.cn-compromis');
    expect(encart?.textContent ?? '').toContain('gagne');
  });
});

/* ======================================================================================================== R5 */

const lire = (html: string) => lirePage(html, U1, 1);
const tout = (p: PageLue) => (p.valeurs ?? []).map(x => serre(`${x.nom} ${x.valeur} ${x.unite ?? ''}`));
const a = (s: string) => serre(s);

describe('R5 : les caractéristiques retenues mettent d\'abord ce qui décide, et n\'en perdent aucune parmi celles-ci', () => {
  it('lecture de la page : température 0 à 8 °C, volume 4,06 m³ (dit dans le titre), tension 230 V, R290 et air pulsé sont lus', () => {
    const p = lire(lireFixture('chambre-froide-1800.html'));
    const lignes = tout(p);
    expect(lignes.some(x => x.includes(a('0 °C à 8 °C'))), 'température').toBe(true);
    expect(lignes.some(x => x.includes(a('4,06 m³'))), 'volume').toBe(true);
    expect(lignes.some(x => x.includes(a('230 V'))), 'tension').toBe(true);
    expect(lignes.some(x => x.includes('r290')), 'fluide frigorigène').toBe(true);
    expect(lignes.some(x => x.includes(a('air pulsé'))), 'refroidissement').toBe(true);
  });
  it('lecture de la page : la température garde un nom de caractéristique, jamais une moitié de phrase (« Température de »)', () => {
    const p = lire(lireFixture('chambre-froide-1800.html'));
    const t = (p.valeurs ?? []).find(x => /temp[ée]rature/i.test(x.nom));
    expect(t, 'une ligne Température').toBeDefined();
    expect(t!.nom).not.toMatch(/\s(?:de|du|d')$/i);
  });
  it('lecture de la page : une page de 30 caractéristiques dont les essentielles viennent en dernier ne les perd pas (plafond de lecture)', () => {
    const html = lireFixture('chambre-froide-1800.html');
    const bruit = Array.from({ length: 24 }, (_, i) => `<li>Option ${String(i + 1).padStart(2, '0')} : ${101 + i} mm</li>`).join('');
    const decisives = ['Température de service : 0 °C à 8 °C', 'Volume : 4,06 m³', 'Tension : 230 V', 'Fluide frigorigène : R290', 'Refroidissement : air pulsé', 'Matériau du produit : Tôle d\'acier galvanisée']
      .map(l => `<li>${l}</li>`).join('');
    const spec = /<section class="product-specs">[\s\S]*?<\/section>/.exec(html)![0];
    const page = html.split(spec).join(`<section class="product-specs"><h2>Caractéristiques techniques</h2><ul>${bruit}${decisives}</ul></section>`);
    const lignes = tout(lire(page));
    for (const attendu of ['0 °C à 8 °C', '4,06 m³', '230 V', 'R290', 'air pulsé', 'Tôle d\'acier']) expect(lignes.some(x => x.includes(a(attendu))), attendu).toBe(true);
  });
  it('relecture par l\'IA : une caractéristique essentielle trouvée par l\'IA n\'est pas perdue quand la page en a déjà 24 (plafond de fusion)', async () => {
    const junk = Array.from({ length: 24 }, (_, i) => ({ nom: `Option ${String(i + 1).padStart(2, '0')}`, valeur: `${101 + i} mm` }));
    const page: PageLue = { url: U1.href, domaine: U1.hostname, statut: 'lue', nom: 'Chambre froide 1800 x 1500 mm', prix: 2763.65, devise: 'CHF', taxe: 'ht', valeurs: junk, etapes: [{ nom: 'page', statut: 'trouve' }], luLe: 0 };
    const html = `<!doctype html><html><body><main><h1>Chambre froide 1800 x 1500 mm</h1><p>Chambre froide positive à groupe frigorifique inclus, panneaux sandwich de 80 mm, porte à charnières. Prix : 2 763,65 CHF hors TVA. Température de service : 0 °C à 8 °C. Volume : 4,06 m³.</p></main></body></html>`;
    const appel: AppelIA = async () => ({ caracteristiques: [{ nom: 'Température de service', valeur: '0 °C à 8 °C' }] });
    const out = await completerParIA(page, html, appel, { escalade: true });
    expect(tout(out).some(x => x.includes(a('0 °C à 8 °C'))), 'température de l\'IA').toBe(true);
  });
  const dixSurVingtCinq = () => {
    const decisives = [
      { nom: 'Température de service', valeur: '0 °C à 8 °C' }, { nom: 'Volume', valeur: '4,06', unite: 'm³' }, { nom: 'Matériau du produit', valeur: 'Tôle d\'acier galvanisée' },
      { nom: 'Mode de fonctionnement', valeur: 'Électricité' }, { nom: 'Tension', valeur: '230', unite: 'V' }, { nom: 'Fluide frigorigène', valeur: 'R290' }, { nom: 'Refroidissement', valeur: 'air pulsé' }
    ];
    const autres = ['Densité d\'isolation', 'Couleur', 'Épaisseur du matériel', 'Épaisseur de l\'isolation', 'Largeur de la porte', 'Hauteur de la porte', 'Dimensions du produit', 'Dimensions intérieures',
      'Exécution/équipement', 'Poids', 'Garantie', 'Pieds', 'Éclairage', 'Serrure', 'Joint de porte', 'Charnières', 'Étagères', 'Thermomètre']
      .map((nom, i) => ({ nom, valeur: `${10 + i} mm` }));
    /* l'ordre de la page : les décisives sont dispersées, la plupart tout en bas */
    return [...autres.slice(0, 9), decisives[0], ...autres.slice(9, 14), decisives[1], decisives[2], decisives[3], ...autres.slice(14), decisives[4], decisives[5], decisives[6]];
  };
  it('on en garde 10 sur 25 : température, volume, matière, énergie, tension, fluide et refroidissement y sont tous', () => {
    const liste = dixSurVingtCinq();
    expect(liste.length).toBe(25);
    const garde = prioriserValeurs(liste).slice(0, 10).map(x => x.nom);
    for (const nom of ['Température de service', 'Volume', 'Matériau du produit', 'Mode de fonctionnement', 'Tension', 'Fluide frigorigène', 'Refroidissement']) expect(garde, nom).toContain(nom);
  });
  it('on en garde 10 sur 25 : la couleur et l\'épaisseur de tôle ne passent jamais devant la température ni le volume', () => {
    const ordre = prioriserValeurs(dixSurVingtCinq()).map(x => x.nom);
    for (const decisive of ['Température de service', 'Volume']) for (const accessoire of ['Couleur', 'Épaisseur du matériel']) expect(ordre.indexOf(decisive), `${decisive} avant ${accessoire}`).toBeLessThan(ordre.indexOf(accessoire));
  });
});
