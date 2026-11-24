// @vitest-environment jsdom
/**
 * Voie c61-tests (24.11) : les tests ROUGES des règles R43 à R46 tirées du test en ligne du tour 61 (voies/critique-61/RESULTAT.md ; BUGS.md C61-1 à C61-6,
 * C59-6 et C59-8 rouverts). Écrits depuis les RÈGLES (voies/c61-tests/DOSSIER.md), avant tout correctif : celui qui corrige n'écrit pas le test.
 * Aucun réseau, aucun Gemini (AiClient simulé, jette s'il est appelé). Données : tests/fixtures/c61/carnets.json (le carnet « Houblons citra » du test, valeurs
 * des captures) et tests/fixtures/c59|c58 (marmite avec un frigo de 242 L, chambre froide) ; noms de vendeurs et prix fictifs.
 *
 *  - R43 (C61-1, C61-4, C59-6) : aucune surface du Carnet (liste, tableau, feuille Articles, Comparer, fiche, pastille, prix proposé à À venir, prix du choix qui
 *    part au Calendrier) ne montre un prix sans sa quantité ou son unité : « dès 0,10 CHF » (le gramme) et « ≈4 CHF » (le sachet de 50 g) se disent « ≈4 CHF les 50 g ·
 *    ≈80 CHF/kg » ou restent inconnus (« ? »). Jamais un nombre nu.
 *  - R44 (C61-2) : « Lecture de lien interrompue [Reprendre] » ne se montre QUE pour une lecture réellement interrompue (gardée, fermée avant la fin) : ni pendant une
 *    lecture vivante, ni après une lecture finie, ni à la réouverture ; regarder un carnet n'écrit rien (suite de LE-1).
 *  - R45 (C59-8 rouvert) : sur un houblon l'alpha s'appelle « Alpha » et passe en tête, quelle que soit la forme où la valeur est gardée (nombre + %, « 13,6 » + %,
 *    « 13,6 % » dans la chaîne) et quel que soit le nom que la page lui donne (nom de la variété, « Taux d'acides alpha »), sur la fiche, Comparer, la carte, la feuille
 *    Articles et le tableau.
 *  - R46 : C61-3 (Comparer de houblons : α puis arômes en tête, « ? » où la valeur manque, un seul nom de pays), C61-5 (critère à cible : jauge et vert sur l'écart
 *    à la cible), C61-6 (valeur d'une caractéristique en français).
 * Normalisation : le texte lu ET l'attendu passent par la même fonction `sans` (NFKC, espaces insécables et fins réunis, apostrophes droites, accents et casse ôtés).
 * Limites : jsdom ne mesure aucune boîte ; le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rangVisible, tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { lireCarnet, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { prixChoisiCentimes } from '../../src/domain/carnets/prixChoisi';
import { prixPropose } from '../../src/domain/carnets/prixPropose';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { CarnetV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { ListeCarnets } from '../../src/ui/carnets/ListeCarnets';
import { PrixPastille } from '../../src/ui/carnets/PrixPastille';
import { TableauCarnet, colonnesCarnet } from '../../src/ui/carnets/TableauCarnet';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { traduireValeurs } from '../../functions/src/lienLibelles';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Le MÊME filtre pour le texte lu et pour l'attendu : NFKC, espaces insécables réunis, apostrophes droites, sans accent, en minuscules. */
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
type Forme = 'nombre' | 'texte' | 'texte-unite';
interface ArticleFix {
  id: string; nom: string; vendeur: string; pays: string; dispo: string; prixCentimes: number; lignes: Ligne[];
  devise?: string; prixDes?: boolean; taxe?: 'ht' | 'ttc'; change?: { taux: number; date: string; source: 'BCE' };
}
interface CarnetFix { titre: string; critere?: { texte: string; nom: string; unite: string; sens: 'plus' | 'moins' }; articles: ArticleFix[] }
const F58 = JSON.parse(readFileSync('tests/fixtures/c58/carnets.json', 'utf8')) as { chambre: CarnetFix };
const F59 = JSON.parse(readFileSync('tests/fixtures/c59/carnets.json', 'utf8')) as { marmite: CarnetFix };
const F61 = JSON.parse(readFileSync('tests/fixtures/c61/carnets.json', 'utf8')) as {
  citra: CarnetFix; paysEquivalents: Array<[string, string]>; valeursAllemandes: Array<{ nom: string; valeur: string }>;
};

/** Comment une valeur lue est gardée : un nombre + son unité, la chaîne du nombre + son unité, ou tout dans la chaîne (« 13,6 % »). */
const valeursDe = (liste: Ligne[], forme: Forme): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const numerique = !!e.unite && /^[\d,.]+$/.test(e.valeur);
    let v: Valeur;
    if (numerique && forme === 'nombre') v = { valeur: Number(e.valeur.replace(',', '.')), unite: e.unite, origine: 'page' };
    else if (numerique && forme === 'texte') v = { valeur: e.valeur, unite: e.unite, origine: 'page' };
    else if (numerique) v = { valeur: `${e.valeur} ${e.unite}`, origine: 'page' };
    else v = { valeur: e.valeur, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' };
    sortie[e.nom] = v;
  }
  return sortie;
};
function carnetDe(f: CarnetFix, o: { critere?: Critere | false; forme?: Forme; id?: string } = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const criteres: Critere[] = o.critere === false ? [] : o.critere ? [o.critere]
    : f.critere ? [{ id: 'K1', texte: f.critere.texte, origine: 'vous', caracteristique: { nom: f.critere.nom, unite: f.critere.unite, sens: f.critere.sens } } as Critere] : [];
  return {
    ...base, title: f.titre, ...(o.id ? { id: o.id } : {}),
    carnet: {
      ...base.carnet, criteres, facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: f.articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'grossiste-exemple.test', url: `https://www.grossiste-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
        valeurs: valeursDe(a.lignes, o.forme ?? 'nombre'), prixCentimes: a.prixCentimes, devise: a.devise ?? 'CHF', taxe: a.taxe ?? ('ht' as const),
        ...(a.prixDes ? { prixDes: true as const } : {}), ...(a.change ? { change: a.change } : {})
      }) as Article)
    }
  } as CarnetDoc;
}
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;
const comparer = (c: CarnetDoc, o: { critere?: boolean } = {}) =>
  render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop}
    {...(o.critere && c.carnet.criteres[0] ? { critere: c.carnet.criteres[0] as never } : {})} />).container;
const fiche = (c: CarnetDoc, i = 0) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;
const tableauRendu = (c: CarnetDoc) =>
  render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} sep={null} onOuvrir={nop} />).container;
const liste = (c: CarnetDoc) => render(<ListeCarnets carnets={[c as unknown as CarnetV]} onOuvrir={nop} />).container;

/** Le texte que le brasseur LIT, sans les parties cachées au regard (`.cn-cache`) ; un espace entre deux éléments feuilles (« ≈4 » puis « CHF » ne se collent pas). */
function visible(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  const feuilles = [...copie.querySelectorAll('*')].filter(x => !x.children.length).map(x => x.textContent ?? '');
  return (feuilles.length ? feuilles.join(' ') : (copie.textContent ?? '')).replace(/[\s  ]+/g, ' ').trim();
}
/** Le texte tel qu'il se lit d'un trait (sans espace ajouté entre éléments). */
function lu(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const pause = (ms = 5) => new Promise(r => setTimeout(r, ms));

/* ======================================================================================================== R43 */

/**
 * R43 : un prix se dit avec sa quantité ou son unité. Un « prix » est un nombre suivi de CHF, EUR ou €. Il est « honnête » à l'écran quand, tout près de lui, la quantité
 * (« 50 g », « 1 kg ») ou l'unité (« /kg », « par 100 g ») est dite. Sinon la surface dit « ? » (ce n'est alors plus un prix : aucun nombre). Les tests lisent le texte
 * d'une surface (leaves séparées par un espace) ; la tolérance : la quantité à 40 signes avant ou 60 après le prix.
 */
const PRIX = /(?:≈\s?)?\d[\d  '’]*(?:[.,]\d{1,2})?\s?(?:CHF|EUR|€)/g;
const QUANTITE = /\d[\d,.]*\s?(?:g|kg|ml|cl|dl|l)\b|\/\s?(?:100\s?)?(?:kg|g|l)\b|(?:par|le|les|pour)\s+(?:\d+\s?)?(?:kg|g|l|100\s?g|sachet|gramme|kilo)\b/i;
function prixSansQuantite(texte: string): string[] {
  const t = texte.normalize('NFKC').replace(/[\s  ]+/g, ' ');
  const nus: string[] = [];
  for (const m of t.matchAll(PRIX)) {
    const i = m.index ?? 0;
    const fenetre = t.slice(Math.max(0, i - 40), i + m[0].length + 60);
    /* la quantité d'une ligne « Poids : 50 g, 250 g et 500 g » (une caractéristique, non l'unité du prix) ne compte pas */
    const sansPoids = fenetre.replace(/poids[^¦]{0,40}/gi, ' ');
    if (!QUANTITE.test(sansPoids)) nus.push(`« ${m[0].trim()} » (…${t.slice(Math.max(0, i - 25), i + m[0].length + 25)}…)`);
  }
  return nus;
}
/** Le même prix ne peut jamais valoir 0,10 CHF : le gramme n'est pas l'article. */
const GRAMME_NU = /(?<!\d)0[,.]10\s?(?:CHF|€|EUR)/;

describe('R43 (C61-1, C61-4, C59-6) : aucune surface du Carnet ne montre un prix sans sa quantité ou son unité', () => {
  const citra = () => carnetDe(F61.citra);

  const surfaces: Array<[string, () => string]> = [
    ['liste des carnets (le prix du carnet : « dès 0,10 CHF »)', () => { const p = liste(citra()).querySelector('.cn-carnet-prix'); return p ? visible(p) : ''; }],
    ['tableau du carnet', () => visible(tableauRendu(citra()))],
    ['feuille Articles (cartes et pastilles de prix)', () => visible(feuille(citra()))],
    ['Comparer (houblons)', () => visible(comparer(citra()))],
    ['fiche de Citra 13.6% (Brau- und Rauchshop)', () => visible(fiche(citra(), 0))],
    ['fiche de CITRA® (US) (MotlerHops)', () => visible(fiche(citra(), 1))]
  ];
  for (const [nom, texte] of surfaces) {
    it(`${nom} : jamais « 0,10 CHF » (le gramme pris pour l'article)`, () => {
      const t = texte();
      expect(GRAMME_NU.exec(t)?.[0], `texte : ${t.slice(0, 400)}`).toBeUndefined();
    });
    it(`${nom} : chaque prix dit sa quantité ou son unité (« ≈4 CHF les 50 g », « CHF/kg »), sinon il reste inconnu (« ? »)`, () => {
      const nus = prixSansQuantite(texte());
      expect(nus, `prix sans quantité : ${nus.join(' ; ')}`).toEqual([]);
    });
  }
  it('pastille de prix de l\'article de MotlerHops (3,72 € TTC, poids 50, 250 et 500 g) : la quantité se dit avec le prix', () => {
    const c = citra();
    const nus = prixSansQuantite(visible(render(<PrixPastille article={contenu(c).articles[1] as never} />).container));
    expect(nus, nus.join(' ; ')).toEqual([]);
  });
  it('la liste des carnets prend le prix du carnet ouvert (celui qui classe), ou rien : jamais le plancher d\'un prix sans quantité', () => {
    const t = tableau(citra())!;
    const classes = t.lignes.filter(l => l.prixClasse !== undefined).map(l => l.nom);
    const p = liste(citra()).querySelector('.cn-carnet-prix');
    /* aucun prix ne classe (les deux sont sans quantité) : la liste ne dit pas de prix ; sinon elle dit celui d'un article classé, avec sa quantité */
    if (!classes.length) expect(p ? lu(p) : '', 'aucun prix ne classe dans le carnet : la liste ne chiffre pas').toBe('');
    else expect(prixSansQuantite(visible(p!)), 'prix de la liste').toEqual([]);
  });
  it('garde-fou : un article vendu à la pièce (chambre froide, prix hors TVA) garde son prix dans la liste (la règle ne cache pas un prix honnête)', () => {
    const p = liste(carnetDe(F58.chambre)).querySelector('.cn-carnet-prix');
    expect(p, 'la liste dit le prix de la chambre froide').not.toBeNull();
    expect(sans(lu(p!)), lu(p!)).toMatch(/\d/);
  });

  /* À venir et Calendrier : le prix que le carnet propose ou envoie au plan vient du prix d'un article ; un plancher sans quantité n'est jamais proposé. */
  it('« Prix estimé ? » (propose à À venir) ne propose pas 0,10 CHF, le prix du gramme (prixPropose)', () => {
    const p = prixPropose(citra() as never);
    expect(p?.centimes, `proposé : ${JSON.stringify(p)}`).not.toBe(10);
    expect(p === null || p.centimes >= 100, `proposé : ${JSON.stringify(p)}`).toBe(true);
  });
  it('choisi, l\'article à « dès 0,10 CHF » ne donne pas 0,10 CHF au plan qui part à À venir et au Calendrier (prixChoisiCentimes)', () => {
    const c = citra();
    (c.carnet as { choix?: unknown }).choix = { articleId: 'H1', le: '2026-11-24T10:00:00.000Z', pourquoi: 'ZZ TEST', ecartes: [{ articleId: 'H2', raison: 'ZZ TEST' }], remplaces: [] };
    expect(prixChoisiCentimes(c), 'le plan prend un prix sans quantité').toBeUndefined();
  });
});

/* ======================================================================================================== R44 */

/**
 * R44 (C61-2, régression de LE-1) : tour 61 : trois liens lus jusqu'au bout (« Lu · 6 s · 6 étapes sur 6 »), et au-dessus du carnet « Lecture de lien interrompue : 1 à
 * reprendre [Reprendre] », qui revient à chaque réouverture. Reprendre relancerait une lecture IA déjà faite (coût, réécriture des articles). Règle : le bandeau ne parle
 * que d'une lecture réellement interrompue (fermée avant la fin) ; une lecture vivante ou finie ne l'appelle jamais ; regarder n'écrit rien.
 */
describe('R44 (C61-2) : « Lecture de lien interrompue » seulement pour une lecture réellement interrompue', () => {
  const LIEN = 'https://www.grossiste-exemple.test/ks240l-c61';
  const MSG = `ZZ TEST — ${LIEN}`;
  const bandeau = () => !!document.querySelector('[data-sorte="reprise"]') || /lecture de lien interrompue/.test(sans(lu(document.body)));
  const gardees = () => JSON.parse(localStorage.getItem('affinee.carnets.lectures') ?? '[]') as unknown[];

  function monter(magasin: ReturnType<typeof magasinMemoire>, appels: AppelsIA, ouvrir?: string) {
    return render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels}
      aides={aidesCarnet('simule' as never, {})} {...(ouvrir ? { ouvrir: { id: ouvrir, at: 1 } } : {})} />);
  }
  const ouvrir = async (re: RegExp) => {
    const lien = [...document.querySelectorAll<HTMLElement>('button, a, [role="button"]')].find(e => re.test(e.textContent ?? '') && !e.closest('.cn-champ'));
    expect(lien, `le carnet ${re} est ouvrable`).toBeTruthy();
    fireEvent.click(lien!);
    await attendre(150);
  };
  const versListe = async () => {
    const retour = [...document.querySelectorAll<HTMLElement>('button, a')].find(b => /^(?:‹\s*)?(?:Carnets|Retour)\b/i.test((b.textContent ?? '').trim()) || b.classList.contains('cn-retour'));
    if (retour) { fireEvent.click(retour); await attendre(150); }
  };

  /** Un lien lu jusqu'au bout, dans un carnet : l'IA répond, la page se lit (400 ms), tout finit bien. */
  async function lectureFinie() {
    let lectures = 0;
    const appels: AppelsIA = {
      async ranger(contexte) { await pause(); return { ok: true, data: reponseSimulee(contexte) }; },
      async lire(u) { lectures++; await pause(400); return { url: u, domaine: 'grossiste-exemple.test', statut: 'lue', nom: 'Kibernetik KS240L', luLe: Date.now() } as never; }
    };
    const marmite = { ...carnetDe(F59.marmite), id: 'ZZ-C61-MARMITE' } as CarnetDoc;
    (marmite.carnet.articles as unknown[]).length = 0;
    const magasin = magasinMemoire([...fixtureCarnets(), marmite] as never[]);
    monter(magasin, appels);
    await attendre(30);
    await ouvrir(/marmite de brassage/i);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: MSG } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    return { magasin, appels, lectures: () => lectures };
  }

  it('pendant la lecture (le jeton est gardé, la lecture est vivante) : aucun bandeau « interrompue »', async () => {
    const s = await lectureFinie();
    await attendre(200); /* la page se lit encore (400 ms) : la lecture vit */
    expect(gardees().length, 'la lecture vivante est gardée sur l\'appareil').toBeGreaterThan(0);
    expect(bandeau(), `écran : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    await attendre(2200);
    expect(s.lectures()).toBe(1);
  }, 30000);

  it('après la lecture finie : rien n\'est gardé et aucun bandeau « interrompue » ni « Reprendre »', async () => {
    await lectureFinie();
    await attendre(2600);
    expect(gardees(), 'une lecture finie n\'est plus gardée').toEqual([]);
    expect(bandeau(), `écran : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    expect([...document.querySelectorAll('button')].filter(b => /^Reprendre$/.test((b.textContent ?? '').trim())), 'bouton « Reprendre » sans lecture interrompue').toEqual([]);
  }, 30000);

  it('à la réouverture du carnet (on le quitte, on y revient) : toujours aucun bandeau', async () => {
    await lectureFinie();
    await attendre(2600);
    await versListe();
    await ouvrir(/marmite de brassage/i);
    await attendre(900);
    expect(bandeau(), `écran : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
  }, 30000);

  it('on quitte le carnet PENDANT la lecture (le test du tour 61 : trois carnets, des liens collés d\'affilée) : la lecture vit encore, aucun bandeau, ni plus tard à la réouverture', async () => {
    const s = await lectureFinie();
    await attendre(120);
    await versListe(); /* le carnet change : la lecture, elle, continue */
    await attendre(120);
    expect(bandeau(), `liste, lecture vivante : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    await attendre(2600);
    expect(s.lectures()).toBe(1);
    await ouvrir(/marmite de brassage/i);
    await attendre(900);
    expect(gardees(), 'une lecture finie n\'est plus gardée').toEqual([]);
    expect(bandeau(), `réouvert après la fin : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
  }, 30000);

  it('on quitte le carnet pendant la lecture, elle finit, on revient : le bandeau n\'est pas resté là (« ZZ marmite : 2 à reprendre » du tour 61, lectures « Lu · 6 s · 6 étapes sur 6 »)', async () => {
    const s = await lectureFinie();
    await attendre(120);
    await versListe();
    await attendre(2800); /* la lecture finit, la liste ne dit rien */
    expect(s.lectures()).toBe(1);
    expect(gardees(), 'une lecture finie n\'est plus gardée').toEqual([]);
    await ouvrir(/marmite de brassage/i);
    await attendre(900);
    expect(bandeau(), `réouvert après la fin : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
  }, 30000);

  it('un lien dans un carnet, puis un autre carnet ouvert pendant que la lecture tourne : le bandeau ne parle pas d\'une lecture vivante', async () => {
    const s = await lectureFinie();
    await attendre(120);
    await versListe();
    await ouvrir(/joint torique|ventilation|évier|frigo/i);
    await attendre(300);
    expect(bandeau(), `autre carnet, lecture vivante : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    await attendre(2600);
    expect(bandeau(), `autre carnet, lecture finie : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    expect(s.lectures()).toBe(1);
  }, 30000);

  it('la réponse de l\'IA arrive pendant que le jeton est encore gardé (le fil change, la lecture n\'est pas finie) : aucun bandeau', async () => {
    /* le carnet reste ouvert ; le magasin notifie ses écoutes à chaque écriture (message posé, articles rangés) pendant que le jeton est gardé : le fil change, la lecture vit */
    let lectures = 0;
    const appels: AppelsIA = {
      async ranger(contexte) { await pause(); return { ok: true, data: reponseSimulee(contexte) }; },
      async lire(u) { lectures++; await pause(100); return { url: u, domaine: 'grossiste-exemple.test', statut: 'lue', nom: 'Kibernetik KS240L', luLe: Date.now() } as never; }
    };
    const marmite = { ...carnetDe(F59.marmite), id: 'ZZ-C61-MARMITE' } as CarnetDoc;
    (marmite.carnet.articles as unknown[]).length = 0;
    const magasin = magasinMemoire([...fixtureCarnets(), marmite] as never[]);
    monter(magasin, appels, 'ZZ-C61-MARMITE');
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: MSG } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    for (let i = 0; i < 12; i++) {
      await attendre(150);
      expect(bandeau(), `à ${150 * (i + 1)} ms : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    }
    expect(lectures).toBe(1);
  }, 30000);

  it('après un remontage de la vue (l\'app rouverte) : toujours aucun bandeau, et regarder n\'écrit rien (suite de LE-1)', async () => {
    const s = await lectureFinie();
    await attendre(2600);
    cleanup();
    const avant = s.magasin.ecritures.length;
    monter(s.magasin, s.appels, 'ZZ-C61-MARMITE');
    await attendre(1800);
    expect(bandeau(), `écran : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    expect(s.magasin.ecritures.slice(avant), 'écritures sans geste à la réouverture').toEqual([]);
    expect(s.lectures(), 'la lecture déjà faite n\'est pas relancée').toBe(1);
  }, 30000);

  it('garde-fou (LE-1) : une lecture réellement interrompue (gardée, rien ne la mène) se propose, d\'un toucher, sans rien écrire', async () => {
    localStorage.setItem('affinee.carnets.lectures', JSON.stringify([{ jeton: 'jetonGardeAvantFermeture1', url: LIEN, messageId: 'ZZ-MSG-V2', texte: LIEN, debut: Date.now() - 3600_000, carnetId: ID_VENTILATION }]));
    const magasin = magasinMemoire(fixtureCarnets() as never[]);
    const appels: AppelsIA = { async ranger() { throw new Error('rien ne doit repartir seul'); }, async lire() { throw new Error('rien ne doit repartir seul'); } };
    monter(magasin, appels, ID_VENTILATION);
    await attendre(1800);
    expect(sans(lu(document.body)), 'la lecture interrompue se dit').toMatch(/lecture de lien interrompue/);
    expect(magasin.ecritures, 'aucune écriture sans geste').toEqual([]);
  }, 30000);
});

/* ======================================================================================================== R45 */

/**
 * R45 (C59-8 rouvert en ligne) : fiche « Citra 13.6% » : toujours « Citra 13,6 % » (pas « Alpha »), 2e après Arômes ; fiche CITRA® (US) : « Taux d'acides alpha 10 % - 15 % »
 * 3e, après Origine et Poids. Règle : sur un houblon l'alpha s'appelle « Alpha » et passe en tête, partout. Trois formes de valeur gardée (c58, c59) × deux noms de page.
 */
describe('R45 (C59-8) : sur un houblon, l\'alpha s\'appelle « Alpha » et passe en tête, sur toutes les surfaces', () => {
  const FORMES: Forme[] = ['nombre', 'texte', 'texte-unite'];
  const nomsDeCaracteristiques = (racine: Element): string[] =>
    [...racine.querySelectorAll('dt, th[scope="row"], .cn-carac-nom, [data-carac], .cn-case-nom')].map(e => sans(lu(e)));

  for (const forme of FORMES) {
    it(`fiche « Citra 13.6% », valeur gardée en « ${forme} » : « Alpha 13,6 % » et plus de caractéristique nommée « Citra »`, () => {
      const t = sans(lu(fiche(carnetDe(F61.citra, { forme }), 0)));
      expect(t, t.slice(0, 500)).toMatch(new RegExp(`${sans('Alpha')}\\s*:?\\s*13,6\\s?%`));
      expect(t, 'une caractéristique nommée comme la variété').not.toMatch(/citra\s*:?\s*13,6\s?%/);
    });
    it(`fiche « Citra 13.6% », valeur en « ${forme} » : « Alpha » vient avant « Arômes », « Origine » et le reste (l'α d'abord)`, () => {
      const t = sans(lu(fiche(carnetDe(F61.citra, { forme }), 0)));
      const alpha = t.search(/alpha\s*:?\s*13,6/);
      expect(alpha, t.slice(0, 500)).toBeGreaterThanOrEqual(0);
      for (const apres of ['aromes', 'origine', 'particulierement adapte']) {
        const i = t.search(new RegExp(apres));
        if (i >= 0) expect(alpha, `Alpha avant « ${apres} » : ${t.slice(0, 500)}`).toBeLessThan(i);
      }
    });
  }
  it('fiche CITRA® (US) : « Taux d\'acides alpha 10 % - 15 % » se dit « Alpha » et passe avant Origine et Poids', () => {
    const t = sans(lu(fiche(carnetDe(F61.citra), 1)));
    expect(t, t.slice(0, 500)).not.toMatch(/taux d'acides alpha/);
    const alpha = t.search(/alpha\s*:?\s*10\s?%\s?(?:-|–|à)\s?15\s?%/);
    expect(alpha, `« Alpha 10 % - 15 % » attendu : ${t.slice(0, 500)}`).toBeGreaterThanOrEqual(0);
    for (const apres of ['origine', 'poids']) expect(alpha, `Alpha avant « ${apres} » : ${t.slice(0, 500)}`).toBeLessThan(t.search(new RegExp(apres)));
  });
  it('Comparer : la ligne « Alpha » est la première des caractéristiques, et porte les deux valeurs (13,6 % et 10 % - 15 %)', () => {
    const racine = comparer(carnetDe(F61.citra));
    const lignes = [...racine.querySelectorAll('tbody tr')].map(tr => ({ nom: sans(lu(tr.querySelector('th') ?? tr)), texte: sans(lu(tr)) }));
    const rang = lignes.findIndex(l => /^alpha\b/.test(l.nom));
    expect(rang, `lignes : ${JSON.stringify(lignes.map(l => l.nom))}`).toBeGreaterThanOrEqual(0);
    expect(lignes[rang].texte, lignes[rang].texte).toMatch(/13,6/);
    expect(lignes[rang].texte, lignes[rang].texte).toMatch(/10\s?%?\s?(?:-|–|à)\s?15/);
    const autres = lignes.map((l, i) => ({ ...l, i })).filter(l => /^(origine|arome|poids|particulierement)/.test(l.nom));
    for (const l of autres) expect(rang, `Alpha avant « ${l.nom} »`).toBeLessThan(l.i);
  });
  it('carte d\'un houblon (CarteArticle) : « Alpha 13,6 % » se dit en tête des valeurs lues, le nom de la variété n\'y est plus une caractéristique', () => {
    for (const forme of FORMES) {
      cleanup();
      const c = carnetDe(F61.citra, { forme });
      const t = sans(lu(render(<CarteArticle article={contenu(c).articles[0] as never} />).container.querySelector('.cn-valeurs-lues') ?? document.createElement('i')));
      expect(t, `forme ${forme} : valeurs lues « ${t} »`).toMatch(/^alpha\s*:?\s*13,6/);
    }
  });
  it('carte d\'un houblon dont la page dit « Taux d\'acides alpha » (CITRA® (US)) : « Alpha 10 % - 15 % » en tête des valeurs lues', () => {
    const t = sans(lu(render(<CarteArticle article={contenu(carnetDe(F61.citra)).articles[1] as never} />).container.querySelector('.cn-valeurs-lues') ?? document.createElement('i')));
    expect(t, `valeurs lues « ${t} »`).toMatch(/^alpha\s*:?\s*10/);
  });
  it('feuille Articles et tableau : aucune caractéristique n\'est nommée « Citra » ; un critère « Alpha » trouve la valeur des deux articles', () => {
    const k = { id: 'K1', texte: 'Alpha le plus haut', origine: 'vous', caracteristique: { nom: 'Alpha', unite: '%', sens: 'plus' } } as Critere;
    for (const forme of FORMES) {
      cleanup();
      const c = carnetDe(F61.citra, { forme, critere: k });
      const t = tableau(c)!;
      expect(colonnesCarnet(t as never)[0].nom, `forme ${forme}`).toBe('Alpha');
      const cellules = [...tableauRendu(c).querySelectorAll<HTMLElement>('[role=cell][data-col]')].map(e => sans(lu(e)));
      expect(cellules.some(x => /13,6/.test(x)), `forme ${forme} : cellules ${JSON.stringify(cellules)}`).toBe(true);
      expect(cellules.some(x => /10/.test(x) && /15/.test(x)), `forme ${forme} : l'alpha de CITRA® (US) : cellules ${JSON.stringify(cellules)}`).toBe(true);
      cleanup();
      const f = sans(lu(feuille(c)));
      expect(f, `feuille, forme ${forme}`).not.toMatch(/citra\s*:\s*13,6/);
    }
  });
  it('garde-fou : un article qui n\'est pas un houblon n\'est pas touché (une ligne « Volume utile 50 L » reste « Volume utile »)', () => {
    const t = sans(lu(fiche(carnetDe(F59.marmite, { critere: false }), 1)));
    expect(t, t).toMatch(/volume utile/);
    expect(t, t).not.toMatch(/alpha/);
  });
});

/* ======================================================================================================== R46 */

describe('R46 (C61-3) : Comparer de houblons : α puis arômes en tête, « ? » où la valeur manque, un seul nom de pays', () => {
  const lignesDe = (racine: Element) => [...racine.querySelectorAll('tbody tr')].map(tr => ({
    nom: sans(lu(tr.querySelector('th') ?? tr)), cellules: [...tr.querySelectorAll('td')].map(td => sans(lu(td)))
  }));
  it('la ligne « Arômes » est la 2e caractéristique, juste après Alpha, et dit « ? » du côté de l\'article qui ne la publie pas (CITRA® (US))', () => {
    const l = lignesDe(comparer(carnetDe(F61.citra)));
    const noms = l.map(x => x.nom);
    const a = noms.findIndex(n => /^alpha\b/.test(n));
    const ar = noms.findIndex(n => /^arome/.test(n));
    expect(a, JSON.stringify(noms)).toBeGreaterThanOrEqual(0);
    expect(ar, JSON.stringify(noms)).toBeGreaterThanOrEqual(0);
    expect(ar, `Arômes juste après Alpha : ${JSON.stringify(noms)}`).toBe(a + 1);
    const cases = l[ar].cellules;
    expect(cases.some(x => /citron vert|mangue/.test(x)), `cellules ${JSON.stringify(cases)}`).toBe(true);
    expect(cases.some(x => /^\?/.test(x) || x === '?'), `« ? » du côté qui manque : ${JSON.stringify(cases)}`).toBe(true);
  });
  const lesPaires: Array<[string, string]> = F61.paysEquivalents;
  for (const [a, b] of lesPaires) {
    it(`« ${a} » d'un côté, « ${b} » de l'autre : le même pays ne s'écrit pas de deux façons dans la ligne Origine`, () => {
      const f: CarnetFix = JSON.parse(JSON.stringify(F61.citra));
      f.articles[0].lignes = f.articles[0].lignes.map(x => (x.nom === 'Origine' ? { ...x, valeur: a } : x));
      f.articles[1].lignes = f.articles[1].lignes.map(x => (x.nom === 'Origine' ? { ...x, valeur: b } : x));
      const origine = lignesDe(comparer(carnetDe(f))).find(x => /^origine\b/.test(x.nom));
      expect(origine, 'la ligne Origine').toBeTruthy();
      expect(origine!.cellules.length).toBeGreaterThanOrEqual(2);
      expect(new Set(origine!.cellules.map(x => sans(x))).size, `Origine : ${JSON.stringify(origine!.cellules)}`).toBe(1);
    });
  }
});

describe('R46 (C61-5) : un critère à cible (« Marmite de brassage 50 L ») : la jauge et le vert disent l\'écart à la cible', () => {
  const cible = { id: 'K1', texte: 'Marmite de brassage 50 L', origine: 'ia', caracteristique: { nom: 'Volume utile', unite: 'L', sens: 'plus' } } as Critere;
  const deux = () => {
    const c = carnetDe(F59.marmite, { critere: cible });
    return { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'K1' || a.id === 'W1') } } as CarnetDoc;
  };
  it('feuille Articles : la jauge de la marmite de 50 L (la cible) est plus pleine que celle du frigo de 242 L, ou la cible est repérée sur la jauge', () => {
    const racine = feuille(deux());
    const cartes = [...racine.querySelectorAll('.cn-classee')];
    const plein = (re: RegExp) => {
      const carte = cartes.find(x => re.test(x.textContent ?? ''));
      const w = (carte?.querySelector('.cn-reglette-plein') as HTMLElement | null)?.style.width ?? '';
      return /^\d+%$/.test(w) ? Number.parseInt(w, 10) : null;
    };
    const repere = racine.querySelector('.cn-reglette-cible, [data-cible]');
    const marmite = plein(/Maischekessel/), frigo = plein(/KS240L/);
    if (!repere) {
      expect(marmite, `jauges : marmite ${marmite} %, frigo ${frigo} %`).not.toBeNull();
      expect(marmite!, `jauges : marmite ${marmite} %, frigo ${frigo} %`).toBeGreaterThan(frigo ?? -1);
    }
  });
  it('Comparer : le vert de la ligne « Volume utile » n\'est pas sur 242 L (loin de la cible) ; s\'il y en a un, c\'est la marmite de 50 L', () => {
    const racine = comparer(deux(), { critere: true });
    const ligne = [...racine.querySelectorAll('tbody tr')].find(tr => /volume/.test(sans(lu(tr.querySelector('th') ?? tr))));
    expect(ligne, 'la ligne volume').toBeTruthy();
    const verts = [...ligne!.querySelectorAll('td.cn-meilleur')].map(td => sans(lu(td)));
    expect(verts.filter(x => /242/.test(x)), `cellules vertes : ${JSON.stringify(verts)}`).toEqual([]);
  });
  it('garde-fou : un critère sans cible (« Volume le plus grand ») garde le vert sur la plus grande valeur', () => {
    const k = { id: 'K1', texte: 'Volume le plus grand', origine: 'vous', caracteristique: { nom: 'Volume utile', unite: 'L', sens: 'plus' } } as Critere;
    const c = carnetDe(F59.marmite, { critere: k });
    const d = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'K1' || a.id === 'W1') } } as CarnetDoc;
    const ligne = [...comparer(d, { critere: true }).querySelectorAll('tbody tr')].find(tr => /volume/.test(sans(lu(tr.querySelector('th') ?? tr))));
    expect(ligne).toBeTruthy();
    expect([...ligne!.querySelectorAll('td.cn-meilleur')].map(td => sans(lu(td))).some(x => /242/.test(x))).toBe(true);
  });
});

describe('R46 (C61-6) : la valeur d\'une caractéristique de houblon se dit en français', () => {
  const ALLEMAND = /\bund\b|amerikanische|englische/;
  for (const v of F61.valeursAllemandes) {
    it(`lecture serveur : « ${v.nom} : ${v.valeur} » : la VALEUR est traduite à la lecture (jamais gardée en allemand)`, () => {
      const sortie = traduireValeurs([v])!;
      const t = sans(sortie[0].valeur);
      expect(t, JSON.stringify(sortie)).not.toMatch(ALLEMAND);
    });
  }
  it('fiche : une valeur déjà gardée en allemand (« amerikanische Ales und IPA\'s ») se lit en français, comme les arômes (C59-9)', () => {
    const t = sans(lu(fiche(carnetDe(F61.citra), 0)));
    expect(t, t.slice(0, 600)).toMatch(/particulierement adapte pour/);
    /* le nom du vendeur (« Brau- und Rauchshop ») est un nom propre, pas une valeur à traduire */
    expect(t.split(sans('Brau- und Rauchshop')).join(' '), t.slice(0, 600)).not.toMatch(ALLEMAND);
  });
  it('fiche : la valeur dite en français est « ales et IPA américaines » (l\'attendu du brasseur, normalisé comme le texte : même `sans` des deux côtés)', () => {
    const t = sans(lu(fiche(carnetDe(F61.citra), 0)));
    expect(t, t.slice(0, 600)).toContain(sans('ales et IPA américaines'));
  });
});

/** Garde-fou de l'écriture du test : `rangVisible` reste importé (compte des rangs) ; aucun usage hors R43. */
void rangVisible;
