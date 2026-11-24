// @vitest-environment jsdom
/**
 * Voie c64-tests (24.11) : les tests ROUGES des règles R47 à R50 tirées du test en ligne du tour 64 (voies/critique-64/RESULTAT.md ; BUGS.md C64-1 à C64-8, C61-5 et PX-1 rouverts).
 * Écrits depuis les RÈGLES (voies/c64-tests/DOSSIER.md), avant tout correctif : celui qui corrige n'écrit pas le test. Aucun réseau, aucun Gemini (AiClient simulé, il jette s'il est
 * appelé ; la réponse du modèle de lecture est simulée avec les valeurs que le test en ligne a observées). Pages : tests/fixtures/c64/ (la vraie page Brau- und Rauchshop lue le 23.11 ;
 * la vraie page hopfenmarkt du tour 25 rejouée avec les prix du Citra relevés le 24.11 ; une page MotlerHops sans tableau de caractéristiques) ; carnets : tests/fixtures/c64/carnets.json.
 *
 *  - R47 (C64-8, BLOQUANT, données réelles touchées) : un message tapé dans un carnet OUVERT reste dans ce carnet ; l'IA peut PROPOSER un autre carnet, jamais y écrire seule.
 *  - R48 (C64-1, BLOQUANT) : chaque prix lu est attaché à SON conditionnement (hopfenmarkt : 50 g = 3,60, 100 g = 6,70) ; le prix au kilo se calcule avec la bonne paire.
 *  - R49 (C64-2, BLOQUANT) : une boutique à paliers de quantité (Brau : 0,1044 CHF/g, 0,08 CHF/g dès 1 000 g) donne le prix du kilo AU PALIER (1 kg = 80 CHF).
 *  - R50 : C61-5 (jauge du 2e pleine et verte), un seul prix par article partout (≈3/≈4, 68,32/68,40), « Arômes et saveurs » = Arômes, « Pays de récolte » = Origine,
 *    « Caractéristiques absent » alors que lues, prix en EUR dans la liste, « Lecture de lien interrompue » pour une lecture finie ou d'un carnet disparu.
 * Normalisation : le texte lu ET l'attendu passent par la même fonction `sans` (NFKC, espaces insécables et fins réunis, apostrophes droites, accents et casse ôtés). Un nom propre
 * (un vendeur, « Brau- und Rauchshop ») n'est pas une valeur à traduire : il est retiré du texte avant toute recherche de langue.
 * Limites : jsdom ne mesure aucune boîte ; le rendu réel à 390 px reste à voir en ligne.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_FRIGO, ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireReponse, type CarnetPourIA } from '../../src/domain/carnets/ia';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { lireCarnet, lireCarnets, lireMessages, type Article, type CarnetDoc, type Critere, type MessageDoc, type Valeur } from '../../src/domain/carnets/modele';
import { appliquerEcritures, relireArticle } from '../../src/domain/carnets/operations';
import { prixParUnite, texteParUnite } from '../../src/domain/carnets/prixUnitaire';
import { pourIA } from '../../src/ui/carnets/lignesRegles';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { CarteArticle } from '../../src/ui/carnets/CarteArticle';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { CarnetV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { ListeCarnets } from '../../src/ui/carnets/ListeCarnets';
import { TableauCarnet } from '../../src/ui/carnets/TableauCarnet';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { completerParIA } from '../../functions/src/lienIA';
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
  conditionnement?: { valeur: number; unite: string }; prixUnite?: unknown; offres?: unknown[]; livraison?: unknown;
}
interface CarnetFix { titre: string; articles: ArticleFix[] }
const F64 = JSON.parse(readFileSync('tests/fixtures/c64/carnets.json', 'utf8')) as { solo: CarnetFix; duo: CarnetFix; hopfenmarkt: CarnetFix };
const F59 = JSON.parse(readFileSync('tests/fixtures/c59/carnets.json', 'utf8')) as { marmite: CarnetFix & { critere?: { texte: string; nom: string; unite: string; sens: 'plus' | 'moins' } } };
const page = (f: string) => gunzipSync(readFileSync(`tests/fixtures/c64/${f}`)).toString('utf8');
const HTML_HOP = page('hopfenmarkt-citra.html.gz');
const HTML_BRAU = page('brau-citra-136.html.gz');
const HTML_MOTLER = readFileSync('tests/fixtures/c64/motlerhops-sans-tableau.html', 'utf8');
const URL_HOP = 'https://hopfenmarkt.ch/produkt/hopfen/citra';
const URL_BRAU = 'https://www.brauundrauchshop.ch/citra-136-2';
const URL_MOTLER = 'https://www.motlerhops.example/citra-us';

const valeursDe = (liste: Ligne[]): Article['valeurs'] => {
  const sortie: Article['valeurs'] = {};
  for (const e of liste) {
    const numerique = !!e.unite && /^[\d,.]+$/.test(e.valeur);
    const v: Valeur = numerique ? { valeur: Number(e.valeur.replace(',', '.')), unite: e.unite, origine: 'page' } : { valeur: e.valeur, ...(e.unite ? { unite: e.unite } : {}), origine: 'page' };
    sortie[e.nom] = v;
  }
  return sortie;
};
function carnetDe(f: CarnetFix, o: { critere?: Critere; id?: string } = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  return {
    ...base, title: f.titre, ...(o.id ? { id: o.id } : {}),
    carnet: {
      ...base.carnet, criteres: o.critere ? [o.critere] : [], facons: [], notes: [], photos: [], choix: undefined, sortie: undefined, archive: undefined,
      articles: f.articles.map(a => ({
        id: a.id, nom: a.nom, domaine: 'boutique-exemple.test', url: `https://www.boutique-exemple.test/${a.id}`, lecture: 'lue', dispo: a.dispo, vendeur: a.vendeur, pays: a.pays,
        valeurs: valeursDe(a.lignes),
        ...(a.prixCentimes !== undefined ? { prixCentimes: a.prixCentimes, devise: a.devise ?? 'CHF', taxe: a.taxe ?? 'ht' } : {}),
        ...(a.change ? { change: a.change } : {}), ...(a.conditionnement ? { conditionnement: a.conditionnement } : {}),
        ...(a.prixUnite ? { prixUnite: a.prixUnite } : {}), ...(a.offres ? { offres: a.offres } : {}), ...(a.livraison ? { livraison: a.livraison } : {})
      }) as Article)
    }
  } as CarnetDoc;
}
const contenu = (c: CarnetDoc) => c.carnet as unknown as ContenuCarnetV;
const comparer = (c: CarnetDoc) => render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop} />).container;
const fiche = (c: CarnetDoc, i = 0) => render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} />).container;
const feuille = (c: CarnetDoc) => render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;
const tableauRendu = (c: CarnetDoc) => render(<TableauCarnet carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} sep={null} onOuvrir={nop} />).container;
const carte = (c: CarnetDoc, i = 0) => render(<CarteArticle article={contenu(c).articles[i] as never} />).container;
const liste = (c: CarnetDoc) => render(<ListeCarnets carnets={[c as unknown as CarnetV]} onOuvrir={nop} />).container;

/** Le texte que le brasseur LIT (sans `.cn-cache`), un espace entre deux éléments feuilles. */
function visible(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  const feuilles = [...copie.querySelectorAll('*')].filter(x => !x.children.length).map(x => x.textContent ?? '');
  return (feuilles.length ? feuilles.join(' ') : (copie.textContent ?? '')).replace(/[\s  ]+/g, ' ').trim();
}
function lu(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const pause = (ms = 5) => new Promise(r => setTimeout(r, ms));

/** Ce que l'app fait d'une page lue (« Relire » : `relireArticle`) : un article sans prix reçoit le prix, la quantité et le prix à l'unité de la page. */
function articleDePage(p: unknown): Article {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const doc = { ...base, carnet: { ...base.carnet, articles: [{ id: 'ZZ-C64', nom: (p as { nom?: string }).nom, url: 'https://www.boutique-exemple.test/c64', lecture: 'lue', valeurs: {} }] } } as unknown as CarnetDoc;
  const etat = [doc as never];
  const r = relireArticle(etat, { carnetId: doc.id, articleId: 'ZZ-C64', page: { statut: 'lue', luLe: 0, ...(p as object) } as never, le: '2026-11-24T10:00:00.000Z' });
  if (!r.ok) throw new Error(`relire refusé : ${r.raison}`);
  return lireCarnets(appliquerEcritures(etat, r.ecritures))[0].carnet.articles[0] as Article;
}

/* ======================================================================================================== R47 */

/**
 * R47 (C64-8) : « Achat prévu fin du mois. », tapé dans le carnet « ZZ trop de vapeur au brassage » (ici : Ventilation), a été rangé par l'IA dans un AUTRE carnet, réel (celui des achats).
 * Règle : un message tapé dans un carnet ouvert reste dans ce carnet ; l'IA peut PROPOSER un autre carnet, jamais y écrire seule.
 */
describe('R47 (C64-8) : un message tapé dans un carnet ouvert reste dans ce carnet', () => {
  const MSG = 'ZZ TEST — Achat prévu fin du mois.';
  /** La réponse du modèle du tour 64 : la note, rangée dans un autre carnet existant (ici « Frigo de garde pour fûts », à la place du carnet des achats). */
  const reponseAilleurs = { lignes: [{ sorte: 'note', genre: 'a-acheter', texte: 'Achat prévu fin du mois.', carnetId: ID_FRIGO, raisonCarnet: 'parle d\'un achat' }] };
  const notesDe = (magasin: ReturnType<typeof magasinMemoire>, id: string) => (lireCarnets(magasin.lire()).find(c => c.id === id)!.carnet.notes ?? []).map(n => n.texte);

  it('le garde de la réponse (lireReponse) : écrite dans Ventilation, la ligne ne porte pas l\'id d\'un autre carnet', () => {
    const carnets = pourIA(lireCarnets(fixtureCarnets())) as CarnetPourIA[];
    const lignes = lireReponse(reponseAilleurs, { texte: MSG, carnets, depuis: ID_VENTILATION, pages: [], origine: 'ia' })!;
    expect(lignes, 'réponse lue').toHaveLength(1);
    expect(lignes[0].carnetId, `la ligne est rangée dans ${lignes[0].carnetId} (autre que le carnet ouvert)`).not.toBe(ID_FRIGO);
    expect(lignes[0].carnetNeuf, 'ni un carnet neuf').toBeUndefined();
  });

  async function envoyerDansVentilation(ia: unknown) {
    const appels: AppelsIA = {
      async ranger() { await pause(); return { ok: true, data: ia }; },
      async lire() { throw new Error('aucun lien ici'); }
    };
    const magasin = magasinMemoire(fixtureCarnets() as never[]);
    const avantAutre = notesDe(magasin, ID_FRIGO);
    const avantAutreComplet = JSON.stringify(lireCarnets(magasin.lire()).find(c => c.id === ID_FRIGO));
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels}
      aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await attendre(30);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: MSG } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(900);
    return { magasin, avantAutre, avantAutreComplet };
  }

  it('chemin complet : envoi depuis Ventilation, l\'IA désigne le carnet « Frigo » : le Frigo n\'est pas écrit (ni note, ni critère, ni article)', async () => {
    const s = await envoyerDansVentilation(reponseAilleurs);
    const apres = lireCarnets(s.magasin.lire()).find(c => c.id === ID_FRIGO);
    expect(notesDe(s.magasin, ID_FRIGO), 'notes du Frigo').toEqual(s.avantAutre);
    expect(JSON.stringify(apres), 'le carnet « Frigo » entier').toBe(s.avantAutreComplet);
  }, 30000);

  it('chemin complet : le message reste dans Ventilation (sa note y est toujours, rien n\'est parti ailleurs)', async () => {
    const s = await envoyerDansVentilation(reponseAilleurs);
    const msg = lireMessages(s.magasin.lire()).find((m: MessageDoc) => /achat prevu fin du mois/.test(sans(m.carnetMessage.texte)));
    expect(msg, 'le message est gardé').toBeTruthy();
    const ailleurs = msg!.carnetMessage.effets.filter(e => e.carnetId !== ID_VENTILATION);
    expect(ailleurs, 'effets du message hors de Ventilation').toEqual([]);
    expect(notesDe(s.magasin, ID_VENTILATION).map(sans).some(t => /achat prevu fin du mois/.test(t)), 'la note est dans Ventilation').toBe(true);
  }, 30000);

  it('chemin complet, 2e forme de la réponse (la ligne dit aussi un carnet neuf) : le Frigo reste intact', async () => {
    const s = await envoyerDansVentilation({ lignes: [{ sorte: 'note', genre: 'a-acheter', texte: 'Achat prévu fin du mois.', carnetId: ID_FRIGO }, { sorte: 'idee', texte: 'Achat prévu fin du mois.', titre: 'Achats', carnetId: ID_FRIGO }] });
    expect(JSON.stringify(lireCarnets(s.magasin.lire()).find(c => c.id === ID_FRIGO)), 'le carnet « Frigo » entier').toBe(s.avantAutreComplet);
  }, 30000);

  it('garde-fou : la réponse simulée (« exemple ») d\'un message dans le carnet ouvert le range toujours dans ce carnet', async () => {
    const s = await envoyerDansVentilation(reponseSimulee({ texte: MSG, saisie: '2026-11-24T10:00:00.000Z', depuis: ID_VENTILATION, carnets: pourIA(lireCarnets(fixtureCarnets())), pages: [] } as never));
    expect(JSON.stringify(lireCarnets(s.magasin.lire()).find(c => c.id === ID_FRIGO)), 'le Frigo').toBe(s.avantAutreComplet);
  }, 30000);
});

/* ======================================================================================================== R48 */

/**
 * R48 (C64-1) : hopfenmarkt Citra : 50 g 3,60 · 100 g 6,70 · 250 g 15,95 · 500 g 31,35 · 1 kg 62,20 CHF (100 g affichée). L'app a dit « 6,70 CHF · 50 g · 134,00 CHF/kg » : le prix de 100 g avec la
 * quantité de 50 g. Règle : un prix lu est attaché à SON conditionnement ; le prix au kilo se calcule avec la bonne paire (6,70 / 100 g = 67 CHF/kg).
 */
describe('R48 (C64-1) : chaque prix est attaché à son conditionnement (hopfenmarkt Citra)', () => {
  const OFFRES = [[50, 3.6], [100, 6.7], [250, 15.95], [500, 31.35], [1000, 62.2]] as const;
  const enG = (c: { valeur: number; unite: string }) => (c.unite === 'kg' ? c.valeur * 1000 : c.valeur);
  const paire = (p: { prix?: number; conditionnement?: { valeur: number; unite: string } }) => (p.prix !== undefined && p.conditionnement ? OFFRES.some(([g, prix]) => g === enG(p.conditionnement!) && Math.abs(prix - p.prix!) < 0.006) : false);
  const lue = () => ({ ...(lirePage(HTML_HOP, new URL(URL_HOP), 1) as object), statut: 'lue', luLe: 0 }) as { prix?: number; devise?: string; conditionnement?: { valeur: number; unite: string }; offres?: Array<{ valeur: number; unite: string; prix: number }>; etapes?: unknown[] };
  const appel = (r: Record<string, unknown>) => (async () => ({ nom: null, taxe: null, prixDes: null, portSuisse: null, portGratuit: null, caracteristiques: [], ...r })) as never;

  it('la lecture de la page : le prix lu (6,70) dit sa quantité (100 g), jamais sans (le constat : la quantité manque)', () => {
    const p = lue();
    expect(p.prix, 'prix lu').toBe(6.7);
    expect(p.conditionnement, `la page affiche 100 g : sa quantité accompagne le prix ${p.prix}`).toEqual({ valeur: 100, unite: 'g' });
  });
  it('la lecture de la page : les cinq conditionnements publiés sont lus avec leur prix (50 g 3,60 … 1 kg 62,20)', () => {
    const o = (lue().offres ?? []).map(x => [enG(x), x.prix]);
    expect(o, JSON.stringify(lue().offres)).toEqual(OFFRES.map(([g, prix]) => [g, prix]));
  });
  it('la lecture par l\'IA qui rend le prix 6,70 avec 50 g (ce que le test en ligne a observé) : la paire n\'est jamais fausse', async () => {
    const r = await completerParIA(lue() as never, HTML_HOP, appel({ prix: 6.7, devise: 'CHF', quantite: 50, unite: 'g', parUnite: false }));
    const p = r as unknown as { prix?: number; conditionnement?: { valeur: number; unite: string } };
    expect(p.conditionnement === undefined || paire(p), `paire lue : ${p.prix} CHF pour ${JSON.stringify(p.conditionnement)} (50 g = 3,60 ; 100 g = 6,70)`).toBe(true);
    expect(p.conditionnement, 'jamais 6,70 pour 50 g').not.toEqual({ valeur: 50, unite: 'g' });
  });
  it('l\'article que « Relire » tire de cette page : son prix au kilo est celui de la bonne paire (6,70 / 100 g = 67 CHF/kg), ou inconnu', () => {
    const a = articleDePage(lue());
    const p = prixParUnite(a as never);
    expect(p === null ? 'inconnu' : `${p.centimes / 100} CHF/kg`, `article : ${a.prixCentimes} centimes, conditionnement ${JSON.stringify(a.conditionnement)}`).toBe('67 CHF/kg');
  });
  it('l\'article du carnet (6,70 CHF, ses conditionnements dits, « 50 g » posé à tort) : le CHF/kg ne vaut pas 134 (la paire 6,70 / 50 g)', () => {
    const a = contenu(carnetDe(F64.hopfenmarkt)).articles[0] as unknown as Article;
    const t = texteParUnite(a as never, a.prixCentimes, 'CHF');
    expect(t === null || /^67,00\sCHF\/kg$/.test(sans(t).replace(/\s/g, ' ')) || /^67,00 chf\/kg$/.test(sans(t)), `texte : ${t}`).toBe(true);
  });
  it('Comparer : la quantité à côté du prix et la ligne « Conditionnement » disent la même chose (jamais « 100 g » sous « 50 g »)', () => {
    const racine = comparer(carnetDe(F64.hopfenmarkt));
    const lignes = [...racine.querySelectorAll('tbody tr')].map(tr => ({ nom: sans(lu(tr.querySelector('th') ?? tr)), texte: sans(visible(tr)) }));
    const cond = lignes.find(l => /^conditionnement/.test(l.nom));
    const prix = lignes.find(l => /^prix/.test(l.nom));
    expect(prix, JSON.stringify(lignes.map(l => l.nom))).toBeTruthy();
    const qte = (t: string) => new Set([...t.matchAll(/(\d[\d,.]*)\s?(g|kg)\b/g)].map(m => (m[2] === 'kg' ? Number(m[1].replace(',', '.')) * 1000 : Number(m[1].replace(',', '.')))));
    if (cond) {
      const q1 = [...qte(prix!.texte)], q2 = [...qte(cond.texte)];
      expect(q1.filter(g => q2.includes(g)).length, `prix « ${prix!.texte} » ; conditionnement « ${cond.texte} »`).toBeGreaterThan(0);
    }
    /* la cellule d'hopfenmarkt (6,70 CHF TTC) : sa quantité est 100 g, son kilo 67 ; « 50 g · 134,00 CHF/kg » est la mauvaise paire */
    expect(prix!.texte, `ligne des prix : ${prix!.texte}`).not.toMatch(/6,70[^a-z]*50 ?g|134,00/);
    expect(prix!.texte, `ligne des prix : ${prix!.texte}`).toMatch(/67,00 chf\/kg/);
  });
});

/* ======================================================================================================== R49 */

/**
 * R49 (C64-2) : Brau- und Rauchshop vend au gramme : 0,1044 CHF/g, 0,08 CHF/g dès 1 000 g. L'app a dit « 104,40 CHF · 1 kg » : le tarif de base. 1 kg y coûte 80 CHF (le palier). Règle : le prix du
 * kilo est celui du palier ; le palier se dit (« 80 CHF/kg dès 1 kg ») ; aucun conditionnement inventé.
 */
describe('R49 (C64-2) : une boutique à paliers de quantité donne le prix du kilo AU PALIER (Brau : 1 kg = 80 CHF)', () => {
  const lue = () => ({ ...(lirePage(HTML_BRAU, new URL(URL_BRAU), 1) as object), statut: 'lue', luLe: 0 }) as {
    prix?: number; conditionnement?: { valeur: number; unite: string }; prixUnite?: { prix: number; unite: string; paliers?: Array<{ des: number; prix: number }> }
  };
  it('la lecture de la page : le prix pour 1 kg est celui du palier (80 CHF), pas le tarif de base (104,40 CHF)', () => {
    const p = lue();
    const kg = p.prix !== undefined && p.conditionnement ? p.prix / (p.conditionnement.unite === 'kg' ? p.conditionnement.valeur : p.conditionnement.valeur / 1000) : undefined;
    expect(kg, `prix ${p.prix} CHF pour ${JSON.stringify(p.conditionnement)}`).toBe(80);
  });
  it('garde-fou : la lecture garde le prix à l\'unité (0,1044 CHF/g) et son palier (0,08 dès 1 000 g), pour les dire', () => {
    const p = lue();
    expect(p.prixUnite?.prix).toBe(0.1044);
    expect(p.prixUnite?.unite).toBe('g');
    expect(p.prixUnite?.paliers, 'paliers').toEqual([{ des: 1000, prix: 0.08 }]);
  });
  it('l\'article que « Relire » tire de cette page : son prix au kilo est 80 CHF/kg', () => {
    const a = articleDePage(lue());
    const p = prixParUnite(a as never);
    expect(p === null ? 'inconnu' : `${p.centimes / 100} CHF/kg`, `article : ${a.prixCentimes} centimes, ${JSON.stringify(a.conditionnement)}, ${JSON.stringify(a.prixUnite)}`).toBe('80 CHF/kg');
  });
  it('la fiche de cet article dit le palier (« 80 CHF/kg dès 1 kg »), le prix au gramme, et aucun conditionnement « 1 kg » inventé', () => {
    const a = articleDePage(lue());
    const base = carnetDe({ titre: 'ZZ TEST — Brau (c64)', articles: [{ id: 'B1', nom: 'Citra 13.6%', vendeur: 'Brau- und Rauchshop', pays: 'CH', dispo: 'en stock', lignes: [{ nom: 'Citra', valeur: '13,6', unite: '%' }] }] });
    (contenu(base).articles[0] as unknown as Article) = Object.assign(contenu(base).articles[0], a, { id: 'B1', valeurs: { ...(contenu(base).articles[0] as unknown as Article).valeurs, ...a.valeurs } }) as never;
    const t = sans(lu(fiche(base, 0)));
    expect(t, t.slice(0, 700)).toMatch(/0,1044\s?chf\s?\/\s?g/);
    expect(t, t.slice(0, 700)).toMatch(/80(?:,00)?\s?chf\s?\/\s?kg[^.]{0,25}des\s?(?:1\s?kg|1[\s']?000\s?g)/);
    expect(t, 'conditionnement « 1 kg » inventé pour une boutique qui vend au gramme').not.toMatch(/conditionnement\s*:?\s*1\s?kg/);
  });
  it('Comparer, deux articles au kilo (Brau à paliers, hopfenmarkt 100 g) : le prix au kilo de Brau est 80 et il passe devant le sachet à 134 de la mauvaise paire', () => {
    const brau = articleDePage(lue());
    const c = carnetDe(F64.hopfenmarkt);
    const contenuC = contenu(c);
    contenuC.articles[1] = Object.assign({}, contenuC.articles[1], { id: 'B1', nom: 'Citra 13.6%', vendeur: 'Brau- und Rauchshop' }, { ...brau, id: 'B1', valeurs: { Alpha: { valeur: 13.6, unite: '%', origine: 'page' } } }) as never;
    const l = tableau(c)!.lignes.map(x => ({ nom: x.nom, prixClasse: x.prixClasse }));
    const brauLigne = l.find(x => /citra 13\.6/i.test(x.nom ?? ''));
    expect(brauLigne?.prixClasse, JSON.stringify(l)).toBe(8000);
  });
});

/* ======================================================================================================== R50 */

describe('R50 (C61-5 rouvert) : un critère à cible : la jauge de la feuille Articles est pleine pour l\'article au plus près de la cible', () => {
  const cible = { id: 'K1', texte: 'Marmite de brassage 50 L', origine: 'ia', caracteristique: { nom: 'Volume utile', unite: 'L', sens: 'plus' } } as Critere;
  const deux = () => {
    const c = carnetDe(F59.marmite as unknown as CarnetFix, { critere: cible });
    return { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'K1' || a.id === 'W1') } } as CarnetDoc;
  };
  const plein = (racine: Element, re: RegExp) => {
    const carte = [...racine.querySelectorAll('.cn-classee')].find(x => re.test(x.textContent ?? ''));
    const w = (carte?.querySelector('.cn-reglette-plein') as HTMLElement | null)?.style.width ?? '';
    return /^\d+%$/.test(w) ? Number.parseInt(w, 10) : null;
  };
  it('la jauge de la marmite de 50 L (la 1re, la cible) est plus pleine que celle du frigo de 242 L : le repère de la cible ne remplace pas la jauge', () => {
    const racine = feuille(deux());
    const marmite = plein(racine, /Maischekessel/), frigo = plein(racine, /KS240L/);
    expect(marmite, `jauges : marmite ${marmite} %, frigo ${frigo} %`).not.toBeNull();
    expect(marmite!, `jauges : marmite ${marmite} %, frigo ${frigo} %`).toBeGreaterThan(frigo ?? -1);
  });
  it('la jauge du frigo de 242 L (très loin de 50 L) n\'est pas pleine (100 %)', () => {
    const frigo = plein(feuille(deux()), /KS240L/);
    expect(frigo, 'jauge du frigo').not.toBe(100);
  });
});

describe('R50 (C64-3) : un seul prix et un seul CHF/kg pour un article, sur toutes les surfaces', () => {
  const solo = () => carnetDe(F64.solo);
  const duo = () => carnetDe(F64.duo);
  const surfaces: Array<[string, () => string]> = [
    ['carte d\'article', () => visible(carte(solo()))],
    ['tableau', () => visible(tableauRendu(duo()))],
    ['feuille Articles', () => visible(feuille(duo()))],
    ['fiche', () => visible(fiche(duo(), 0))],
    ['Comparer', () => visible(comparer(duo()))]
  ];
  const approx = (t: string) => [...t.normalize('NFKC').replace(/[\s  ]+/g, ' ').matchAll(/≈\s?(\d+(?:[.,]\d+)?)(?!\d)/g)].map(m => m[1]);
  const parKilo = (t: string) => [...t.normalize('NFKC').replace(/[\s  ]+/g, ' ').matchAll(/(\d+[.,]\d{2})\s?CHF\s?\/\s?kg/g)].map(m => m[1]);
  it('le « ≈ N CHF » de CITRA® (US) est le même sur la carte, le tableau, la feuille, la fiche et Comparer (≈3 et ≈4 : non)', () => {
    const lues = surfaces.map(([nom, f]) => { cleanup(); return { nom, valeurs: approx(f()) }; });
    const toutes = new Set(lues.flatMap(l => l.valeurs));
    expect(toutes.size, `« ≈ » par surface : ${JSON.stringify(lues)}`).toBeLessThanOrEqual(1);
  });
  it('le CHF/kg de CITRA® (US) est le même partout (68,32 et 68,40 : non)', () => {
    const lues = surfaces.map(([nom, f]) => { cleanup(); return { nom, valeurs: parKilo(f()) }; });
    const toutes = new Set(lues.flatMap(l => l.valeurs));
    expect(toutes.size, `CHF/kg par surface : ${JSON.stringify(lues)}`).toBeLessThanOrEqual(1);
    expect(lues.filter(l => l.valeurs.length).length, `le CHF/kg est dit au moins deux fois : ${JSON.stringify(lues)}`).toBeGreaterThanOrEqual(2);
  });
  it('le CHF/kg dit est sur la base du prix montré : « ≈ N CHF » les 50 g donne N / 0,05 CHF/kg, à 10 CHF près', () => {
    const t = visible(tableauRendu(duo()));
    const a = approx(t)[0], k = parKilo(t)[0];
    expect(a, t.slice(0, 400)).toBeDefined();
    expect(k, t.slice(0, 400)).toBeDefined();
    const prixAffiche = Number(a.replace(',', '.')), kilo = Number(k.replace(',', '.'));
    /* l'arrondi du prix (≈3 pour 3,42) laisse jusqu'à 10 CHF/kg d'écart ; ce que la règle refuse, c'est « ≈4 » (80 CHF/kg) à côté de 68 CHF/kg */
    expect(Math.abs(prixAffiche / 0.05 - kilo), `« ≈${a} CHF » les 50 g et « ${k} CHF/kg »`).toBeLessThan(10);
  });
});

describe('R50 (C64-4) : « Arômes et saveurs » compte comme Arômes, « Pays de récolte » comme Origine', () => {
  it('fiche de CITRA® (US) : aucun « Non publié par le vendeur » ne cite Arômes ni Origine alors que la page les publie', () => {
    const t = sans(lu(fiche(carnetDe(F64.duo), 0)));
    const manque = /non publie[^.]*?:\s*([^.]*)$/.exec(t)?.[1] ?? '';
    expect(manque, t.slice(0, 700)).not.toMatch(/arome/);
    expect(manque, t.slice(0, 700)).not.toMatch(/origine/);
  });
  it('Comparer : les lignes Arômes et Origine ne disent « ? » pour personne (CITRA® (US) publie les deux, sous d\'autres mots)', () => {
    const racine = comparer(carnetDe(F64.duo));
    const lignes = [...racine.querySelectorAll('tbody tr')].map(tr => ({ nom: sans(lu(tr.querySelector('th') ?? tr)), cellules: [...tr.querySelectorAll('td')].map(td => sans(lu(td))) }));
    for (const re of [/^arome/, /^origine/]) {
      const l = lignes.find(x => re.test(x.nom));
      expect(l, `ligne ${re} : ${JSON.stringify(lignes.map(x => x.nom))}`).toBeTruthy();
      expect(l!.cellules.filter(x => x === '?' || /^\?/.test(x)), `cellules ${JSON.stringify(l!.cellules)}`).toEqual([]);
    }
  });
});

describe('R50 (C64-5) : l\'étape « Caractéristiques » dit ce qui a été lu, « absent » seulement si rien n\'a été lu', () => {
  const lue = () => ({ ...(lirePage(HTML_MOTLER, new URL(URL_MOTLER), 1) as object), statut: 'lue', luLe: 0 }) as { valeurs?: Array<{ nom: string }>; etapes?: Array<{ nom: string; statut: string; detail?: string }> };
  const reponse = {
    nom: null, prix: null, devise: null, taxe: null, prixDes: null, portSuisse: null, portGratuit: null,
    caracteristiques: [
      { nom: 'Alpha', valeur: '13 %' }, { nom: 'Arômes et saveurs', valeur: 'agrumes, pamplemousse, fruits tropicaux' }, { nom: 'Pays de récolte', valeur: 'USA' },
      { nom: 'Poids', valeur: '50 g' }, { nom: 'Huiles totales', valeur: '2,3 ml/100 g' }
    ]
  };
  it('après la lecture de l\'IA qui ajoute 5 caractéristiques, l\'étape « caract » n\'est plus « absent »', async () => {
    const r = await completerParIA(lue() as never, HTML_MOTLER, (async () => reponse) as never) as unknown as { valeurs?: unknown[]; etapes?: Array<{ nom: string; statut: string; detail?: string }> };
    expect(r.valeurs?.length ?? 0, 'les caractéristiques lues sont dans l\'article').toBeGreaterThanOrEqual(4);
    const caract = r.etapes?.find(e => e.nom === 'caract');
    expect(caract?.statut, `étape caract : ${JSON.stringify(caract)} ; toutes : ${JSON.stringify(r.etapes?.map(e => [e.nom, e.statut]))}`).not.toBe('absent');
    expect(caract?.detail ?? '', 'dit combien ont été lues').toMatch(/\d/);
  });
});

describe('R50 (C64-6) : la liste des carnets dit les prix dans la monnaie de comparaison (CHF), comme le carnet', () => {
  it('« ZZ pellets » (1 article en euros, cours posé) : la ligne de prix de la liste ne dit ni EUR ni €', () => {
    const p = liste(carnetDe(F64.solo)).querySelector('.cn-carnet-prix');
    const t = p ? visible(p) : '';
    expect(p, 'la liste dit un prix pour ce carnet').not.toBeNull();
    expect(t, t).not.toMatch(/\bEUR\b|€/);
    expect(t, t).toMatch(/CHF/);
  });
});

describe('R50 (C64-7) : « Lecture de lien interrompue : N à reprendre » ne parle que d\'une lecture réellement interrompue', () => {
  const LIEN = 'https://www.grossiste-exemple.test/citra-c64';
  const bandeau = () => !!document.querySelector('[data-sorte="reprise"]') || /lecture de lien interrompue/.test(sans(lu(document.body)));
  const appels: AppelsIA = { async ranger() { throw new Error('rien ne doit repartir seul'); }, async lire() { throw new Error('rien ne doit repartir seul'); } };
  const monter = (magasin: ReturnType<typeof magasinMemoire>) => render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never}
    appels={appels} aides={aidesCarnet('simule' as never, {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
  const garder = (l: Array<{ jeton: string; messageId: string; carnetId: string | null }>) => localStorage.setItem('affinee.carnets.lectures', JSON.stringify(l.map(x => ({ ...x, url: LIEN, texte: `ZZ TEST — ${LIEN}`, debut: Date.now() - 3600_000 }))));
  const message = (id: string, depuis: string, effets: MessageDoc['carnetMessage']['effets']): MessageDoc =>
    ({ id, type: 'carnet-message', title: `ZZ TEST — ${LIEN}`, status: 'done', carnetMessage: { texte: `ZZ TEST — ${LIEN}`, le: '2026-11-24T10:00:00.000Z', depuis, rangement: 'simulee', effets } }) as MessageDoc;

  it('une lecture FINIE (l\'article du message est « lu », il a son nom et son prix) dont le jeton est resté gardé : aucun bandeau, rien à reprendre', async () => {
    /* ZZ-V-A1 : « Hotte inox 120 cm + moteur », lue, prix posé (fixture de Ventilation) */
    const magasin = magasinMemoire([...fixtureCarnets(), message('ZZ-MSG-C64-FINI', ID_VENTILATION, [{ carnetId: ID_VENTILATION, cible: 'article', id: 'ZZ-V-A1' }])] as never[]);
    garder([{ jeton: 'jetonResteGarde0000000001', messageId: 'ZZ-MSG-C64-FINI', carnetId: ID_VENTILATION }]);
    monter(magasin);
    await attendre(1800);
    expect(bandeau(), `écran : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
    expect([...document.querySelectorAll('button')].filter(b => /^Reprendre$/.test((b.textContent ?? '').trim())), 'bouton « Reprendre » pour une lecture finie').toEqual([]);
  }, 30000);

  it('une lecture d\'un carnet qui n\'existe plus (supprimé, sur un autre appareil ou dans une autre session) : aucun bandeau', async () => {
    const magasin = magasinMemoire([...fixtureCarnets(), message('ZZ-MSG-C64-ORPHELIN', 'ZZ-CARNET-SUPPRIME-C64', [{ carnetId: 'ZZ-CARNET-SUPPRIME-C64', cible: 'article', id: 'ZZ-ART-SUPPRIME-C64' }])] as never[]);
    garder([{ jeton: 'jetonOrphelin000000000002', messageId: 'ZZ-MSG-C64-ORPHELIN', carnetId: 'ZZ-CARNET-SUPPRIME-C64' }, { jeton: 'jetonOrphelin000000000003', messageId: 'ZZ-MSG-C64-ABSENT', carnetId: 'ZZ-CARNET-SUPPRIME-C64' }]);
    monter(magasin);
    await attendre(1800);
    expect(bandeau(), `écran : ${sans(lu(document.body)).slice(0, 300)}`).toBe(false);
  }, 30000);

  it('garde-fou : une lecture réellement interrompue (message dont l\'article est resté « à lire ») se propose toujours, sans rien écrire', async () => {
    const attente = message('ZZ-MSG-C64-COUPE', ID_VENTILATION, []);
    const magasin = magasinMemoire([...fixtureCarnets(), attente] as never[]);
    garder([{ jeton: 'jetonVraimentCoupe00000004', messageId: 'ZZ-MSG-C64-COUPE', carnetId: ID_VENTILATION }]);
    monter(magasin);
    await attendre(1800);
    expect(sans(lu(document.body)), 'la lecture interrompue se dit').toMatch(/lecture de lien interrompue/);
    expect(magasin.ecritures, 'aucune écriture sans geste').toEqual([]);
  }, 30000);
});
