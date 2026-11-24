// @vitest-environment jsdom
/**
 * Voie c66-tests (25.11) : les tests ROUGES des règles R51 à R55 tirées du test en ligne du tour 66 (voies/critique-66/RESULTAT.md ; BUGS.md C66-1 à C66-8, C65-4 à C65-6 rouverts).
 * Écrits depuis les RÈGLES (voies/c66-tests/DOSSIER.md) et la maquette choisie v01 (work/missions/2026-11-24-carnet-personas/maquettes2/v01.html, règle n° 1), avant tout correctif :
 * celui qui corrige n'écrit pas le test. Aucun réseau, aucun Gemini (AiClient simulé, il jette s'il est appelé). Carnets : tests/fixtures/c66/carnets.json ; la page Brau est la vraie
 * page lue le 23.11 (tests/fixtures/c64), tirée par `relireArticle` comme le fait l'app.
 *
 *  - R51 (C66-1, B) : après Retirer (ou Déplacer) depuis la feuille Articles, l'Annuler est VISIBLE et touchable au-dessus de la feuille et rend l'article. GESTE : CarnetsVue monté.
 *  - R52 (C66-2, B) : un prix à paliers (Brau : 0,1044 CHF/g, 0,08 CHF/g dès 1 000 g) donne 80 CHF/kg sur la carte, au tableau, dans « Selon la quantité » et dans la fiche (« je prends »).
 *  - R53 (C66-3, C65-5, B) : un seul classement au kilo : rang, case verte, ✓, barres, compromis et bouton Choisir disent le même gagnant (le moins cher au kilo rendu : MotlerHops ≈40).
 *  - R54 (C66-4, B) : le bouton Choisir (fiche) annonce le prix du conditionnement COCHÉ (1 kg → 62,20), jamais celui d'un autre (6,70). GESTE : FicheArticle monté, le bouton est cliqué.
 *  - R55 (C66-5, B, règle n° 1) : Comparer suit v01 : lignes égales repliées en UNE ligne « identiques », ✓ du meilleur sur chaque ligne chiffrée qui diffère (α aussi, pas seulement le prix).
 *  - m (C65-4/C66-7, C65-6/C66-6, C66-8) : un seul prix du sachet (≈4, pas ≈3) ; une ligne par caractéristique, en français ; « rangé tel quel » = une note, jamais un critère.
 * Normalisation : le texte lu ET l'attendu passent par la même fonction `sans` (NFKC, espaces insécables et fins réunis, apostrophes droites, accents et casse ôtés).
 * Limites : jsdom ne mesure aucune boîte et ne charge aucune feuille de style : « visible au-dessus de la feuille » se juge sur la structure (R51), le ✓ sur la classe `cn-meilleur` que
 * carnets-decider.css habille (`td.cn-meilleur::before { content: "✓ " }`) ; le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, lireCarnets, lireMessages, type Article, type CarnetDoc, type Valeur } from '../../src/domain/carnets/modele';
import { appliquerEcritures, relireArticle } from '../../src/domain/carnets/operations';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { BlocsMatiere, TableauCarnet } from '../../src/ui/carnets/TableauCarnet';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import { lirePage } from '../../functions/src/lireLien';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
interface ArticleFix {
  id: string; nom: string; vendeur: string; pays: string; dispo: string; lignes: Ligne[];
  prixCentimes?: number; devise?: string; taxe?: 'ht' | 'ttc'; change?: { taux: number; date: string; source: 'BCE' };
  conditionnement?: { valeur: number; unite: string }; offres?: unknown[];
}
interface CarnetFix { titre: string; articles: ArticleFix[] }
const F66 = JSON.parse(readFileSync('tests/fixtures/c66/carnets.json', 'utf8')) as { pellets: CarnetFix; lienSimple: CarnetFix; doublons: CarnetFix };
const HTML_BRAU = gunzipSync(readFileSync('tests/fixtures/c64/brau-citra-136.html.gz')).toString('utf8');
const URL_BRAU = 'https://www.brauundrauchshop.ch/citra-136-2';

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const numerique = !!e.unite && /^[\d,.]+$/.test(e.valeur);
    const v: Valeur = numerique ? { valeur: Number(e.valeur.replace(',', '.')), unite: e.unite, origine: 'page' } : { valeur: e.valeur, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' };
    sortie[e.nom] = v;
  }
  return sortie;
};
const base = () => lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
function carnetDe(f: CarnetFix, id: string): CarnetDoc {
  const b = base();
  return {
    ...b, id, title: f.titre,
    carnet: {
      ...b.carnet, criteres: [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: f.articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'boutique-exemple.test', url: `https://www.boutique-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
        valeurs: valeursDe(a.lignes),
        ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes, devise: a.devise ?? 'CHF', taxe: a.taxe ?? 'ht' } : {}),
        ...(a.change ? { change: a.change } : {}), ...(a.conditionnement ? { conditionnement: a.conditionnement } : {}), ...(a.offres ? { offres: a.offres } : {})
      }) as Article)
    }
  } as CarnetDoc;
}

/** Ce que l'app fait de la page Brau lue (« Relire » : `relireArticle`) : l'article tel qu'il est gardé (prix à l'unité, paliers, quantité). */
function brauGarde(): Article {
  const b = base();
  const page = { ...(lirePage(HTML_BRAU, new URL(URL_BRAU), 1) as object), statut: 'lue', luLe: 0 };
  const doc = { ...b, carnet: { ...b.carnet, articles: [{ id: 'B1', nom: 'Citra 13.6%', url: URL_BRAU, lecture: 'lue', valeurs: {} }] } } as unknown as CarnetDoc;
  const etat = [doc as never];
  const r = relireArticle(etat, { carnetId: doc.id, articleId: 'B1', page: page as never, le: '2026-11-24T10:00:00.000Z' });
  if (!r.ok) throw new Error(`relire refusé : ${r.raison}`);
  return lireCarnets(appliquerEcritures(etat, r.ecritures))[0].carnet.articles[0] as Article;
}

const TITRE = F66.pellets.titre;
const ID_PELLETS = 'ZZ-C66-PELLETS';
/** Le carnet de houblons du test en ligne : Hopfenmarkt, MotlerHops et Brau (tel que « Relire » l'a gardé). `egaux: 'deux'` : Forme ET Origine identiques ; `'un'` : seule Origine l'est (le cas du test en ligne). */
function pellets(o: { egaux?: 'deux' | 'un' } = {}): CarnetDoc {
  const c = carnetDe(F66.pellets, ID_PELLETS);
  const brau = brauGarde();
  const i = c.carnet.articles.findIndex(a => a.id === 'B1');
  const fixe = c.carnet.articles[i] as unknown as Article;
  const valeurs = { ...fixe.valeurs, ...brau.valeurs, ...(o.egaux === 'deux' ? { Forme: { valeur: 'Pellets', origine: 'page' } as Valeur } : {}) };
  (c.carnet.articles as unknown as Article[])[i] = { ...fixe, ...brau, id: 'B1', nom: 'Citra 13.6%', vendeur: fixe.vendeur, pays: fixe.pays, domaine: fixe.domaine, valeurs } as Article;
  return c;
}
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;
const art = (c: CarnetDoc, id: string) => contenu(c).articles.find(a => a.id === id)!;
const tab = (c: CarnetDoc) => tableau(c)! as never;

const montes = {
  comparer: (c: CarnetDoc, o: { onChoisir?: () => void } = {}) => render(<Comparer titre={c.title} statut="research" tableau={tab(c)} articles={contenu(c).articles as never} onRetour={nop} onChoisir={o.onChoisir ?? nop} />).container,
  fiche: (c: CarnetDoc, id: string, o: { onChoisir?: () => void } = {}) => render(<FicheArticle article={art(c, id)} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} onChoisir={o.onChoisir ?? nop} />).container,
  feuille: (c: CarnetDoc) => render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tab(c)} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container,
  tableau: (c: CarnetDoc) => render(<><TableauCarnet carnet={contenu(c)} titre={c.title} tableau={tab(c)} aRelire={[]} sep={null} onOuvrir={nop} /><BlocsMatiere articles={contenu(c).articles} titre={c.title} /></>).container,
  carte: (c: CarnetDoc, id: string) => render(<CarteArticle article={art(c, id) as never} variante="complete" />).container
};

const lu = (e: Element): string => {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
};
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const pause = (ms = 5) => new Promise(r => setTimeout(r, ms));

/** Quel article un texte désigne : par son nom ou son vendeur (le nom de la carte, de la ligne, de la colonne, de la phrase). */
function quel(t: string): 'HM' | 'M1' | 'B1' | '?' {
  const s = sans(t);
  if (/motler|citra\(r\)|citra\(c\)|citra® \(us\)|citra \(us\)/.test(s) || /citra.{0,3} \(us\)/.test(s)) return 'M1';
  if (/hopfenmarkt|hopfenpellets/.test(s)) return 'HM';
  if (/brau|citra 13[.,]6/.test(s)) return 'B1';
  return '?';
}
const NOMS = { HM: 'Hopfenmarkt (62 CHF/kg)', M1: 'MotlerHops (≈40 CHF/kg)', B1: 'Brau (80 CHF/kg)', '?': 'illisible' } as const;
const GAGNANT = 'M1';

/* ======================================================================================================== R51 */

/**
 * R51 (C66-1) : le geste, par CarnetsVue monté : le carnet s'ouvre, « Articles » ouvre la feuille, la carte MotlerHops glisse, Retirer. L'app a posé « Article retiré · CITRA® (US) · Annuler » derrière
 * la feuille (la feuille est un voile fixe au-dessus de la page) : invisible, et le toucher n'atteignait que le voile (il fermait la feuille). Règle : l'Annuler est au-dessus de la feuille
 * (dans la feuille, ou la feuille est fermée, ou le bandeau est monté hors de la page, au-dessus du voile), et le toucher rend l'article.
 * jsdom n'a ni empilement ni boîte : « au-dessus » se juge sur la structure ; la capture en ligne le confirmera.
 */
describe('R51 (C66-1) : après Retirer / Déplacer depuis la feuille Articles, Annuler est visible au-dessus de la feuille et rend l\'article', () => {
  async function ouvrirFeuille() {
    const doc = pellets();
    const autre = fixtureCarnets().filter(i => i.id !== ID_PELLETS);
    const magasin = magasinMemoire([doc as never, ...autre]);
    const appels: AppelsIA = { async ranger() { await pause(); return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_PELLETS, at: 1 }} />);
    await attendre(60);
    const pastille = [...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''));
    expect(pastille, 'la pastille « Articles » du carnet ouvert').toBeTruthy();
    fireEvent.click(pastille!);
    await attendre(30);
    expect(document.querySelector('[role="dialog"][aria-modal="true"]'), 'la feuille Articles est ouverte').toBeTruthy();
    return { magasin };
  }
  const articlesDe = (m: ReturnType<typeof magasinMemoire>) => lireCarnets(m.lire()).find(c => c.id === ID_PELLETS)!.carnet.articles.map(a => a.id).sort();
  const boutonSous = (re: RegExp, racine: ParentNode = document) => [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
  /** L'Annuler d'un retour « <phrase> · Annuler » : le bouton Annuler du bandeau, pas la croix d'un cadre. */
  const annulerDe = (phrase: RegExp) => [...document.querySelectorAll('button')].find(b => /^\s*annuler\s*$/i.test(b.textContent ?? '') && phrase.test(sans(b.parentElement?.textContent ?? ''))) as HTMLButtonElement | undefined;
  /** Au-dessus de la feuille : dans la feuille ; ou la feuille est fermée ; ou monté hors de la page du carnet (portail), donc hors du voile qui la recouvre. */
  const auDessusDeLaFeuille = (b: Element) => {
    const feuille = document.querySelector('[role="dialog"][aria-modal="true"]');
    return !feuille || feuille.contains(b) || !b.closest('article.cn-page');
  };

  it('Retirer la carte MotlerHops : l\'Annuler du bandeau « Article retiré » existe et se trouve au-dessus de la feuille', async () => {
    const { magasin } = await ouvrirFeuille();
    expect(articlesDe(magasin)).toEqual(['B1', 'HM', 'M1']);
    const retirer = boutonSous(/retirer l'article « citra® \(us\)/, document.querySelector('[role="dialog"]')!);
    expect(retirer, 'le bouton Retirer de la carte glissée').toBeTruthy();
    fireEvent.click(retirer!);
    await attendre(30);
    expect(articlesDe(magasin), 'l\'article est retiré').toEqual(['B1', 'HM']);
    const annuler = annulerDe(/article retire/);
    expect(annuler, '« Article retiré · … · Annuler » est monté').toBeTruthy();
    expect(auDessusDeLaFeuille(annuler!), 'l\'Annuler est derrière la feuille (dans la page, sous le voile) : invisible, intouchable').toBe(true);
  });

  it('Retirer puis toucher Annuler : l\'article revient (pas seulement la feuille qui se ferme)', async () => {
    const { magasin } = await ouvrirFeuille();
    fireEvent.click(boutonSous(/retirer l'article « citra® \(us\)/, document.querySelector('[role="dialog"]')!)!);
    await attendre(30);
    const annuler = annulerDe(/article retire/);
    expect(annuler, 'l\'Annuler existe').toBeTruthy();
    expect(auDessusDeLaFeuille(annuler!), 'et se touche au-dessus de la feuille').toBe(true);
    fireEvent.click(annuler!);
    await attendre(30);
    expect(articlesDe(magasin), 'l\'article revient').toEqual(['B1', 'HM', 'M1']);
  });

  it('Déplacer la carte vers un autre carnet : le retour « Rangé dans … · Annuler » est lui aussi au-dessus de la feuille et rend l\'article', async () => {
    const { magasin } = await ouvrirFeuille();
    const feuille = document.querySelector('[role="dialog"]')!;
    const deplacer = boutonSous(/deplacer l'article « citra® \(us\)/, feuille);
    expect(deplacer, 'le bouton Déplacer de la carte glissée').toBeTruthy();
    fireEvent.click(deplacer!);
    await attendre(20);
    const vers = [...document.querySelectorAll('[role="menuitem"]')].find(b => /dans/.test(sans(b.textContent ?? ''))) as HTMLElement | undefined;
    expect(vers, 'un carnet de destination est proposé').toBeTruthy();
    fireEvent.click(vers!);
    await attendre(30);
    expect(articlesDe(magasin), 'l\'article est parti').toEqual(['B1', 'HM']);
    const annuler = annulerDe(/range dans/);
    expect(annuler, '« Rangé dans … · Annuler » est monté').toBeTruthy();
    expect(auDessusDeLaFeuille(annuler!), 'l\'Annuler est derrière la feuille').toBe(true);
    fireEvent.click(annuler!);
    await attendre(30);
    expect(articlesDe(magasin), 'l\'article revient dans le carnet').toEqual(['B1', 'HM', 'M1']);
  });
});

/* ======================================================================================================== R52 */

/**
 * R52 (C66-2) : Brau vend au gramme (0,1044 CHF/g ; 0,08 CHF/g dès 1 000 g) : 1 kg y coûte 80 CHF. L'app a dit « ? » sur la carte, au tableau et dans « Selon la quantité » à 1 kg ; la fiche « je prends »
 * n'avait que 5 kg et 20 kg. Règle (v01) : 80 CHF/kg à 1 kg partout ; conditionnements au gramme, 1 kg, (5 kg, 20 kg).
 */
describe('R52 (C66-2) : un prix à paliers (Brau) donne 80 CHF/kg à 1 kg partout, jamais « ? »', () => {
  beforeEach(() => poserQuantitePour(TITRE, 1));
  const carteBrau = (racine: Element) => [...racine.querySelectorAll('.cn-carte-mat')].find(x => quel(x.textContent ?? '') === 'B1');

  it('la carte de la feuille Articles dit « 80 CHF/kg » pour Brau (pas « ? CHF/kg »)', () => {
    const carte = carteBrau(montes.feuille(pellets()));
    expect(carte, 'la carte Brau de la feuille').toBeTruthy();
    const t = sans(lu(carte!));
    expect(t, t).toMatch(/80\s?chf\/kg/);
    expect(t, t).not.toMatch(/\?\s?chf\/kg/);
  });
  it('le tableau dit 80 dans la colonne CHF/kg de la ligne Brau (pas « ? »)', () => {
    const racine = montes.tableau(pellets());
    const ligne = [...racine.querySelectorAll('.cn-tab-ligne')].find(x => quel(x.textContent ?? '') === 'B1');
    expect(ligne, 'la ligne Brau du tableau').toBeTruthy();
    const cellules = [...ligne!.querySelectorAll('[role="cell"][data-col]')];
    const kg = cellules[cellules.length - 1];
    expect(sans(lu(kg)), `cellules : ${cellules.map(c => lu(c)).join(' | ')}`).toBe('80');
  });
  it('« Selon la quantité » dit 80 pour Brau à 1 kg (pas « ? »)', () => {
    const racine = montes.tableau(pellets());
    const grille = racine.querySelector('.cn-quantite-grille');
    expect(grille, '« Selon la quantité »').toBeTruthy();
    const tetes = [...grille!.querySelectorAll('[role="columnheader"]')].slice(1).map(x => lu(x));
    const iBrau = tetes.findIndex(x => /brau/i.test(x));
    const cellules = [...grille!.children];
    const entetes = cellules.filter(x => x.getAttribute('role') === 'rowheader');
    const rangee = entetes.findIndex(x => sans(lu(x)) === '1 kg');
    expect(rangee, 'la ligne « 1 kg »').toBeGreaterThanOrEqual(0);
    const valeurs = cellules.filter(x => x.getAttribute('role') === 'cell').slice(rangee * tetes.length, (rangee + 1) * tetes.length).map(x => sans(lu(x)));
    expect(valeurs[iBrau], `à 1 kg : ${tetes.map((t, i) => `${t} ${valeurs[i]}`).join(' | ')}`).toBe('80');
  });
  it('la fiche de Brau (« je prends ») propose le gramme et 1 kg à 80 CHF/kg', () => {
    const racine = montes.fiche(pellets(), 'B1');
    const prend = racine.querySelector('.cn-prend');
    expect(prend, 'le tableau « je prends » de la fiche (un seul conditionnement : il n\'existe pas)').toBeTruthy();
    const lignes = [...prend!.querySelectorAll('.cn-prend-ligne')].map(x => sans(lu(x)));
    expect(lignes.some(x => /^au gramme/.test(x)), `lignes : ${lignes.join(' ¦ ')}`).toBe(true);
    expect(lignes.some(x => /^1 kg.*\b80\b/.test(x)), `lignes : ${lignes.join(' ¦ ')}`).toBe(true);
  });
});

/* ======================================================================================================== R53 */

/**
 * R53 (C66-3, C65-5) : à 1 kg, MotlerHops ≈40 CHF/kg < Hopfenmarkt 62 < Brau 80. Le test en ligne : le rang, la case verte du tableau, les colonnes de Comparer, le ✓ et le bouton Choisir
 * disaient Hopfenmarkt (le moins cher au prix brut) ; les barres et le compromis disaient MotlerHops. Règle : un seul classement, le moins cher au kilo rendu, partout.
 */
describe('R53 (C66-3, C65-5) : un seul classement au kilo pour tout le carnet : MotlerHops (≈40 CHF/kg) est le 1er partout', () => {
  beforeEach(() => poserQuantitePour(TITRE, 1));
  const parSurface: Array<[string, () => 'HM' | 'M1' | 'B1' | '?']> = [
    ['carte 1re de la feuille Articles', () => {
      const r = montes.feuille(pellets());
      return quel(r.querySelector('.cn-carte-mat .cn-rang-1')?.closest('.cn-carte-mat')?.textContent ?? '');
    }],
    ['rang 1 du tableau', () => {
      const r = montes.tableau(pellets());
      return quel(r.querySelector('.cn-tab-ligne .cn-rang-1')?.closest('.cn-tab-ligne')?.textContent ?? '');
    }],
    ['case verte de la colonne CHF/kg du tableau (C65-5)', () => {
      const r = montes.tableau(pellets());
      const lignes = [...r.querySelectorAll('.cn-tab-ligne')];
      const verte = lignes.find(l => { const cs = [...l.querySelectorAll('[role="cell"][data-col]')]; return cs.length > 0 && cs[cs.length - 1].classList.contains('cn-meilleur'); });
      return quel(verte?.textContent ?? '');
    }],
    ['ligne verte de « Selon la quantité » à 1 kg', () => {
      const r = montes.tableau(pellets());
      const grille = r.querySelector('.cn-quantite-grille')!;
      const tetes = [...grille.querySelectorAll('[role="columnheader"]')].slice(1).map(x => lu(x));
      const cellules = [...grille.children];
      const rangee = cellules.filter(x => x.getAttribute('role') === 'rowheader').findIndex(x => sans(lu(x)) === '1 kg');
      const cs = cellules.filter(x => x.getAttribute('role') === 'cell').slice(rangee * tetes.length, (rangee + 1) * tetes.length);
      const i = cs.findIndex(x => x.classList.contains('cn-meilleur'));
      return i < 0 ? '?' : quel(tetes[i]);
    }],
    ['colonne ① de Comparer (rang 1)', () => {
      const r = montes.comparer(pellets());
      return quel(r.querySelector('th .cn-cmp-rang-1')?.closest('th')?.textContent ?? '');
    }],
    ['barres « Prix au kilo » de Comparer (rang 1)', () => {
      const r = montes.comparer(pellets());
      return quel(r.querySelector('.cn-barres .cn-rang-1')?.parentElement?.textContent ?? '');
    }],
    ['✓ de la ligne CHF/kg de Comparer', () => {
      const r = montes.comparer(pellets());
      const tetes = [...r.querySelectorAll('thead th')].slice(1).map(x => lu(x));
      const ligne = [...r.querySelectorAll('tbody tr')].find(tr => /chf\/kg|prix/i.test(sans(tr.querySelector('th')?.textContent ?? '')));
      const cs = [...(ligne?.querySelectorAll('td') ?? [])];
      const i = cs.findIndex(x => x.classList.contains('cn-meilleur'));
      return i < 0 ? '?' : quel(tetes[i] ?? '');
    }],
    ['compromis de Comparer', () => quel(montes.comparer(pellets()).querySelector('.cn-compromis')?.textContent ?? '')],
    ['bouton « Choisir · … » de Comparer', () => {
      const b = [...montes.comparer(pellets()).querySelectorAll('button')].find(x => /^choisir/.test(sans(x.textContent ?? '')));
      return quel(b?.textContent ?? '');
    }]
  ];
  for (const [nom, gagnant] of parSurface) {
    it(`${nom} : MotlerHops`, () => {
      const g = gagnant();
      expect(NOMS[g], `la surface désigne ${NOMS[g]} ; le moins cher au kilo rendu est ${NOMS[GAGNANT]}`).toBe(NOMS[GAGNANT]);
    });
  }
  it('toutes les surfaces disent le même gagnant (un seul classement)', () => {
    const dits = parSurface.map(([nom, f]) => `${nom} → ${f()}`);
    const uniques = new Set(dits.map(d => d.split(' → ')[1]));
    expect(uniques.size, dits.join('\n')).toBe(1);
  });
});

/* ======================================================================================================== R54 */

/**
 * R54 (C66-4) : fiche hopfenmarkt, « je prends » coché 1 kg à 62,20. Le bloc Offre disait « 6,70 CHF » (le sachet de 100 g) et, sous « Choisir · Hopfenmarkt, 1 kg », « Part dans À venir :
 * Citra Hopfenpellets, Hopfenmarkt, 6,70 CHF » (une valeur qui ne se touche pas). Règle : le bouton Choisir annonce le prix du conditionnement COCHÉ ; le bloc Offre dit le même.
 */
describe('R54 (C66-4) : le bouton Choisir de la fiche annonce le prix du conditionnement coché (1 kg : 62,20), jamais celui d\'un autre (6,70)', () => {
  beforeEach(() => poserQuantitePour(TITRE, 1));
  const annonce = (racine: Element) => {
    const bouton = [...racine.querySelectorAll('button')].find(x => /^choisir/.test(sans(x.textContent ?? ''))) as HTMLButtonElement | undefined;
    return { bouton, phrase: sans(lu(bouton?.nextElementSibling ?? racine)) };
  };

  it('le bouton dit « Choisir · Hopfenmarkt, 1 kg » et se touche (le geste monte Choisir)', () => {
    const onChoisir = vi.fn();
    const { bouton } = annonce(montes.fiche(pellets(), 'HM', { onChoisir }));
    expect(sans(bouton?.textContent ?? '')).toBe('choisir · hopfenmarkt, 1 kg');
    fireEvent.click(bouton!);
    expect(onChoisir).toHaveBeenCalledTimes(1);
  });
  it('sous le bouton, « Part dans À venir » dit 62,20 (le conditionnement coché), pas 6,70', () => {
    const { phrase } = annonce(montes.fiche(pellets(), 'HM'));
    expect(phrase, phrase).toMatch(/part dans a venir/);
    expect(phrase, phrase).toMatch(/62,20/);
    expect(phrase, phrase).not.toMatch(/6,70/);
  });
  it('le bloc Offre dit 62,20 pour 1 kg (pas « 6,70 CHF » en gros)', () => {
    const offre = sans(lu(montes.fiche(pellets(), 'HM').querySelector('.cn-offres')!));
    expect(offre, offre).toMatch(/62,20/);
    expect(offre, offre).not.toMatch(/6,70/);
  });
  it('le tableau « je prends » coche 1 kg à 62,20 (garde-fou : la ligne cochée est la bonne)', () => {
    const coche = montes.fiche(pellets(), 'HM').querySelector('.cn-prend-ligne[aria-current]');
    expect(sans(lu(coche!)), 'ligne cochée').toMatch(/^1 kg.*62,20/);
  });
  it('à 5 kg, le conditionnement coché reste le sachet de 1 kg : Choisir annonce 62,20, pas 6,70', () => {
    poserQuantitePour(TITRE, 5);
    const { phrase } = annonce(montes.fiche(pellets(), 'HM'));
    expect(phrase, phrase).toMatch(/62,20/);
    expect(phrase, phrase).not.toMatch(/6,70/);
  });
  it('MotlerHops (en euros) à 1 kg : Choisir annonce le kilo (≈40 CHF, 40,69 €), jamais le sachet de 50 g (3,72 € ≈ 4)', () => {
    const { phrase } = annonce(montes.fiche(pellets(), 'M1'));
    expect(phrase, phrase).not.toMatch(/3,72|≈\s?4\s?(chf|€)/);
    expect(phrase, phrase).toMatch(/40|41/);
  });
});

/* ======================================================================================================== R55 */

/**
 * R55 (C66-5, règle n° 1, maquette v01 « comparer ») : « Côte à côte · le meilleur coché » : les lignes qui diffèrent d'abord, UNE ligne « identiques » (pellets · États-Unis) repliée, le meilleur
 * coché sur CHAQUE ligne qui diffère (CHF/kg ≈41, α du lot 13,6 %…), pas seulement le prix. Le test en ligne : « Origine États-Unis » ×3 en ligne, seul le prix portait le ✓, et une ligne
 * « Conditionnement g 100 / 50 / ? ».
 */
describe('R55 (C66-5) : Comparer suit v01 : égaux repliés en une ligne, le meilleur coché sur chaque ligne qui diffère', () => {
  beforeEach(() => poserQuantitePour(TITRE, 1));
  const lignesVisibles = (r: Element) => [...r.querySelectorAll('tbody tr')].filter(tr => !(tr as HTMLElement).hidden);
  const libelle = (tr: Element) => sans(lu(tr.querySelector('th') ?? tr));
  const identique = (tr: Element) => { const v = [...tr.querySelectorAll('td')].map(td => sans(lu(td))); return v.length > 1 && v.every(x => x && x === v[0]); };

  /* GARDE-FOU (déjà juste dans le code actuel : deux égaux et plus se replient) : le correctif de la ligne seule ne doit pas le défaire */
  it('deux lignes égales (Forme, Origine) : aucune n\'est affichée en clair (une ligne « identiques » les porte)', () => {
    const r = montes.comparer(pellets({ egaux: 'deux' }));
    const egales = lignesVisibles(r).filter(identique).map(libelle);
    expect(egales, `lignes égales encore visibles : ${egales.join(', ')}`).toEqual([]);
    expect(sans(lu(r.querySelector('tfoot') ?? r)), 'la ligne « identiques »').toMatch(/2 identiques/);
  });
  it('une seule ligne égale (Origine ×3, le cas du test en ligne) : elle se replie aussi dans « 1 identique », pas trois fois « États-Unis » en ligne', () => {
    const r = montes.comparer(pellets({ egaux: 'un' }));
    const egales = lignesVisibles(r).filter(identique).map(libelle);
    expect(egales, `lignes égales encore visibles : ${egales.join(', ')}`).toEqual([]);
    expect(sans(lu(r.querySelector('tfoot') ?? r)), 'la ligne « identiques »').toMatch(/1 identique/);
  });
  it('la ligne « identiques » dit ce qu\'elles ont en commun (pellets · États-Unis) : on ne perd pas la valeur', () => {
    const r = montes.comparer(pellets({ egaux: 'deux' }));
    const pied = sans(lu(r.querySelector('tfoot') ?? r));
    expect(pied, pied).toMatch(/pellets/);
    expect(pied, pied).toMatch(/etats-unis/);
  });
  const ligneDe = (r: Element, re: RegExp) => [...r.querySelectorAll('tbody tr')].find(tr => re.test(libelle(tr)));
  const meilleurDe = (r: Element, re: RegExp) => {
    const tetes = [...r.querySelectorAll('thead th')].slice(1).map(x => lu(x));
    const tr = ligneDe(r, re);
    const i = [...(tr?.querySelectorAll('td') ?? [])].findIndex(td => td.classList.contains('cn-meilleur'));
    return { tr, i, tete: i < 0 ? 'aucun ✓' : tetes[i] };
  };
  it('la ligne α : le meilleur (Brau 13,6 %) porte le ✓ (le prix n\'est pas la seule ligne cochée)', () => {
    const r = montes.comparer(pellets());
    const m = meilleurDe(r, /alpha|^α/);
    expect(m.tr, 'la ligne α existe').toBeTruthy();
    expect(quel(m.tete), `✓ sur : ${m.tete}`).toBe('B1');
  });
  it('la ligne CHF/kg : le meilleur (MotlerHops) porte le ✓ (garde-fou : le prix reste coché)', () => {
    const m = meilleurDe(montes.comparer(pellets()), /chf\/kg|prix/);
    expect(quel(m.tete), `✓ sur : ${m.tete}`).toBe('M1');
  });
  it('chaque ligne chiffrée qui diffère (CHF/kg, α) a son ✓ : au moins deux lignes cochées', () => {
    const r = montes.comparer(pellets());
    const cochees = lignesVisibles(r).filter(tr => tr.querySelector('td.cn-meilleur')).map(libelle);
    expect(cochees.length, `lignes cochées : ${cochees.join(', ')}`).toBeGreaterThanOrEqual(2);
  });
  it('aucune ligne « Conditionnement g » aux valeurs nues « 100 / 50 / ? » (v01 : « vendu par 50 g à 1 kg »)', () => {
    const c = pellets();
    (c.carnet.articles as unknown as Article[]).forEach(a => { (a.valeurs as Record<string, Valeur>)['Conditionnement'] = { valeur: a.id === 'HM' ? 100 : a.id === 'M1' ? 50 : '', unite: 'g', origine: 'page' } as Valeur; });
    delete (art(c, 'B1').valeurs as Record<string, Valeur>)['Conditionnement'];
    const r = montes.comparer(c);
    const ligne = [...r.querySelectorAll('tbody tr')].find(tr => /^conditionnement/.test(libelle(tr)));
    if (!ligne) return;
    const th = libelle(ligne), cellules = [...ligne.querySelectorAll('td')].map(td => sans(lu(td)));
    expect(th, `ligne : ${th} | ${cellules.join(' | ')}`).not.toMatch(/^conditionnement g$/);
    expect(cellules.some(x => /^(100|50)$/.test(x)), `ligne : ${th} | ${cellules.join(' | ')}`).toBe(false);
  });
});

/* ======================================================================================================== m */

describe('C65-4 / C66-7 : un seul prix du sachet pour MotlerHops (3,72 € les 50 g → ≈4 CHF rendu), la carte lue comme le reste', () => {
  const lienSimple = () => carnetDe(F66.lienSimple, 'ZZ-C66-LIEN');
  it('la carte de l\'article lu dit « ≈4 CHF » (pas « ≈3 CHF »), comme le tableau, Comparer et la fiche', () => {
    const t = sans(lu(montes.carte(lienSimple(), 'M1')));
    expect(t, t).toMatch(/≈\s?4\s?chf/);
    expect(t, t).not.toMatch(/≈\s?3\s?chf/);
  });
  it('le prix du sachet de la carte est celui de son prix au kilo (73,80 CHF/kg pour 50 g = 3,69 CHF, soit ≈4)', () => {
    const t = sans(lu(montes.carte(lienSimple(), 'M1')));
    const kg = /(\d+[.,]\d+)\s?chf\s?\/\s?kg/.exec(t);
    const sachet = /≈\s?(\d+)\s?chf/.exec(t);
    expect(kg && sachet, `carte : ${t}`).toBeTruthy();
    expect(Number(sachet![1]), `carte : ${t}`).toBe(Math.round(Number(kg![1].replace(',', '.')) * 0.05));
  });
});

describe('C65-6 / C66-6 : la fiche d\'un houblon dit une ligne par caractéristique, en français', () => {
  const carac = () => {
    const c = carnetDe(F66.doublons, 'ZZ-C66-FICHE');
    const r = montes.fiche(c, 'HM');
    return { r, dts: [...r.querySelectorAll('dl.cn-carac dt')].map(x => sans(lu(x))) };
  };
  const groupes: Array<[string, RegExp]> = [
    ['récolte', /recolte|ernte/], ['alpha', /alpha/], ['bêta', /beta/], ['forme', /^forme/], ['pays', /^pays/], ['conditionnement', /conditionnement|emballage/]
  ];
  for (const [nom, re] of groupes) {
    it(`« ${nom} » : une seule ligne dans Caractéristiques`, () => {
      const { dts } = carac();
      const dites = dts.filter(d => re.test(d));
      expect(dites.length, `lignes « ${nom} » : ${dites.join(' ¦ ')} (toutes : ${dts.join(' ¦ ')})`).toBeLessThanOrEqual(1);
    });
  }
  it('rien n\'est dit en allemand (« Ernte ») dans la fiche', () => {
    const { dts } = carac();
    expect(dts.filter(d => /^ernte$/.test(d)), `intitulés : ${dts.join(' ¦ ')}`).toEqual([]);
  });
});

describe('C66-8 : un message tapé dans un carnet ouvert, l\'IA sans réponse : « rangé tel quel » est une note du carnet, jamais un critère « Ce qui compte »', () => {
  const MSG = 'ZZ TEST — Collier de serrage 25 mm : en prendre dix pour les tuyaux';
  it('chemin complet : IA refusée, le message devient une note visible du carnet ouvert et n\'ajoute aucun critère', async () => {
    const appels: AppelsIA = { async ranger() { await pause(); return { ok: false, error: 'unavailable' }; }, async lire() { throw new Error('aucun lien ici'); } };
    const magasin = magasinMemoire(fixtureCarnets() as never[]);
    const avant = lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!.carnet;
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: MSG } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(900);
    const apres = lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!.carnet;
    const critereAjoute = apres.criteres.filter(k => !avant.criteres.some(x => x.id === k.id)).map(k => k.texte);
    const notes = (apres.notes ?? []).map(n => sans(n.texte));
    const message = lireMessages(magasin.lire()).find(m => /collier de serrage/.test(sans(m.carnetMessage.texte)));
    expect(message, 'le message est gardé').toBeTruthy();
    expect(critereAjoute, `critères ajoutés : ${critereAjoute.join(' ¦ ')}`).toEqual([]);
    expect(notes.some(n => /collier de serrage 25 mm/.test(n)), `notes : ${notes.join(' ¦ ')}`).toBe(true);
  }, 30000);
});
