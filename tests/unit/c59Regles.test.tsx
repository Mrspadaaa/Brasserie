// @vitest-environment jsdom
/**
 * Voie c59-tests (24.11) : les tests ROUGES des règles R35 à R38 tirées du test en ligne du tour 59 (voies/critique-59/RESULTAT.md ; BUGS.md C59-1 à C59-10,
 * C58-3, C58-4, C50-5 rouverts). Écrits depuis les RÈGLES (voies/c59-tests/DOSSIER.md), avant tout correctif : celui qui corrige n'écrit pas le test.
 * Aucun réseau réel, aucun Gemini (AiClient est simulé et jette s'il est appelé). Données : tests/fixtures/c59/carnets.json (marmite avec un frigo de
 * 242 L, houblons Citra des deux vendeurs, deux pages HTML reconstituées d'après le relevé du 24.11) et tests/fixtures/c58/carnets.json (chambre froide,
 * joint, tuyau) ; noms, prix et vendeurs fictifs, valeurs des captures.
 *
 *  - R35 (C59-1, BLOQUANT ; C58-3 rouvert) : « Relire » n'écrit QUE dans le carnet et l'article d'où il est touché ; jamais d'article déplacé d'un carnet
 *    à l'autre. Le geste est joué dans l'app (CarnetsVue) : deux carnets, un message échoué dans chacun, « Relire » touché dans l'un.
 *  - R36 (C59-4 BLOQUANT, C55-2 revenu) : un critère de carnet (« Marmite de brassage 50 L ») classe les articles par leur proximité au critère ; un article
 *    hors genre (le frigo) ou loin du critère (242 L) ne passe jamais 1er ; le compromis ne présente pas « 242 L au lieu de 50 L » comme un gain.
 *  - R37 (C59-6 BLOQUANT, LIEN-PRIX-JUSTE) : un prix lu sans quantité (« dès 0,10 », prix au gramme, variante minimale) n'est jamais comparé comme un prix
 *    d'article : soit le prix du conditionnement avec sa quantité, soit un prix au kilo dit comme tel ; sinon « prix ? » et pas de rang. Quatre lectures :
 *    le tableau (domaine), les écrans (Comparer, feuille Articles, fiche), la lecture de page (functions/src/lireLien), et un seul prix par article (C59-7).
 *  - R38 : les autres constats C59 et les rouverts : C58-4/C50-5/C59-3 (le compromis dit la perte, quelle que soit la forme de la valeur lue),
 *    C59-2 (IA en pause : la cause est dite, pas de relance en boucle), C59-5 (lien retour : le titre garde son ordre), C59-8 (« Alpha 13,6 % » en tête),
 *    C59-9 (arômes en français), C59-10 (la jauge ne touche pas « Veiller »).
 * Limites : jsdom ne mesure aucune boîte ; la cascade CSS est lue (postcss, @media évalués à 390 px, spécificité, ordre des feuilles) comme dans
 * c58Regles. Le rendu réel à 390 px reste à voir en ligne. Les deux pages HTML sont reconstituées (aucune page réelle n'est gardée au dépôt).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import postcss from 'postcss';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compromisDe, rangVisible, tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { lireCarnet, lireCarnets, type Article, type CarnetDoc, type Critere, type Valeur } from '../../src/domain/carnets/modele';
import { quantiteArticle } from '../../src/domain/carnets/prixUnitaire';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { Comparer } from '../../src/ui/carnets/Comparer';
import type { ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { FicheArticle } from '../../src/ui/carnets/FicheArticle';
import { FeuilleCartes } from '../../src/ui/carnets/FeuilleCartes';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { lireLien } from '../../functions/src/lireLien';
import { traduireValeurs } from '../../functions/src/lienLibelles';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

const nop = () => undefined;
/** Sans accent, apostrophes droites, en minuscules, espaces simples (insécables compris). */
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
type Ligne = { nom: string; valeur: string; unite?: string };
type Forme = 'nombre' | 'texte' | 'texte-unite';
interface ArticleFix {
  id: string; nom: string; vendeur: string; pays: string; dispo: string; prixCentimes: number; lignes: Ligne[];
  devise?: string; prixDes?: boolean; taxe?: 'ht' | 'ttc'; change?: { taux: number; date: string; source: 'BCE' };
}
interface CarnetFix { titre: string; critere?: { texte: string; nom: string; unite: string; sens: 'plus' | 'moins' }; articles: ArticleFix[] }
const F58 = JSON.parse(readFileSync('tests/fixtures/c58/carnets.json', 'utf8')) as { chambre: CarnetFix; joint: CarnetFix };
const F59 = JSON.parse(readFileSync('tests/fixtures/c59/carnets.json', 'utf8')) as {
  marmite: CarnetFix; houblons: CarnetFix; houblonsAvecQuantite: CarnetFix; pagesHtml: { brau: string; motler: string };
};
const FIX = { chambre: F58.chambre, joint: F58.joint, marmite: F59.marmite, houblons: F59.houblons, houblonsQ: F59.houblonsAvecQuantite };

/** Comment une valeur lue est gardée : un nombre + son unité, la chaîne du nombre + son unité, ou tout dans la chaîne (« 2,6 m³ »). */
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
function carnetDe(f: CarnetFix, o: { critere?: Critere | false; forme?: Forme } = {}): CarnetDoc {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION)!)!;
  const criteres: Critere[] = o.critere === false ? [] : o.critere ? [o.critere]
    : f.critere ? [{ id: 'K1', texte: f.critere.texte, origine: 'vous', caracteristique: { nom: f.critere.nom, unite: f.critere.unite, sens: f.critere.sens } } as Critere] : [];
  return {
    ...base, title: f.titre,
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
const comparer = (c: CarnetDoc, o: { compromis?: string; critere?: boolean } = {}) =>
  render(<Comparer titre={c.title} statut="validated" tableau={tableau(c) as never} onRetour={nop}
    {...(o.compromis ? { compromis: o.compromis } : {})} {...(o.critere && c.carnet.criteres[0] ? { critere: c.carnet.criteres[0] as never } : {})} />).container;
const fiche = (c: CarnetDoc, i = 0) =>
  render(<FicheArticle article={contenu(c).articles[i]} carnet={contenu(c)} titreCarnet={c.title} onRetour={nop} onVeille={nop} />).container;
const feuille = (c: CarnetDoc) =>
  render(<FeuilleCartes carnet={contenu(c)} titre={c.title} tableau={tableau(c)! as never} aRelire={[]} onFermer={nop} onOuvrir={nop} />).container;

/** Le texte que le brasseur LIT : sans les parties cachées au regard (`.cn-cache`). */
function visible(e: Element): string {
  const copie = e.cloneNode(true) as Element;
  copie.querySelectorAll('.cn-cache').forEach(n => n.remove());
  return (copie.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
}
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const pause = () => new Promise(r => setTimeout(r, 5));
const pageMuette = (u: string) => ({ url: u, domaine: 'exemple.invalid', statut: 'illisible', luLe: 0 }) as never;

/* ---- la cascade CSS réelle à 390 px (même outil que c58Regles) ---- */

const LARGEUR_ECRAN = 390;
function mediaVraie(params: string): boolean {
  const groupes = params.match(/\([^)]*\)/g) ?? [];
  const largeurs = [...params.matchAll(/\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g)];
  if (!groupes.length || groupes.length !== largeurs.length) return false;
  return largeurs.every(m => (m[1] === 'min' ? LARGEUR_ECRAN >= Number(m[2]) : LARGEUR_ECRAN <= Number(m[2])));
}
interface Regle { selecteur: string; decl: Array<[string, string, boolean]>; ordre: number }
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
const specif = (sel: string) => specificite(sel.replace(/:where\([^)]*\)/g, ''));
function styleDe(el: Element, regles: Regle[]): Map<string, string> {
  const touches = regles.filter(r => { try { return el.matches(r.selecteur); } catch { return false; } })
    .sort((a, b) => specif(a.selecteur) - specif(b.selecteur) || a.ordre - b.ordre);
  const m = new Map<string, string>();
  const important = new Set<string>();
  const poser = (p: string, v: string, imp: boolean) => { if (imp || !important.has(p)) { m.set(p, v); if (imp) important.add(p); } };
  for (const r of touches) for (const [p, v, imp] of r.decl) poser(p, v, imp);
  return m;
}
const px = (v: string | undefined): number | null => { const m = /^(-?\d+(?:\.\d+)?)px$/.exec((v ?? '').trim()); return m ? Number(m[1]) : null; };

/* ======================================================================================================== R35 */

/**
 * R35 (C59-1, BLOQUANT ; C58-3 rouvert en ligne) : « Relire » touché dans le joint a repris les messages de la marmite et rangé leurs 2 articles DANS le joint ;
 * la marmite s'est vidée. Cause lue : `rangerMaintenant()` (CarnetsVue) reprend TOUS les messages gardés (`aReprendre`), et `reprendre` donne à l'IA le carnet
 * OUVERT d'à présent (`deps.depuis`), non celui du message. Le bandeau, lui, ne compte que ceux du carnet ouvert (`duCarnet`, C58-3) : le bouton fait donc
 * autre chose que ce qu'il annonce. Règle : « Relire » (et « Ranger maintenant », « Reprendre ») ne touche que les messages du carnet ouvert et ne range
 * rien dans un autre carnet ; un article reste dans le carnet où son message l'a posé.
 */
describe('R35 (C59-1) : « Relire » n\'écrit que dans le carnet où il est touché', () => {
  const LIEN_MARMITE = 'https://www.grossiste-exemple.test/ks240l-c59';
  const MSG_MARMITE = `ZZ TEST — ${LIEN_MARMITE}`;
  const MSG_JOINT = 'ZZ TEST — joint torique 20 mm EPDM 4,50 CHF';
  const articlesDe = (magasin: ReturnType<typeof magasinMemoire>, titre: RegExp) =>
    (lireCarnets(magasin.lire(), { archives: true }).find(c => titre.test(c.title))?.carnet.articles ?? []) as Article[];

  async function sceneDeuxEchecs() {
    const etat = { panne: true };
    const textes: string[] = [];
    const appels: AppelsIA = {
      async ranger(contexte) { textes.push(contexte.texte ?? ''); await pause(); return etat.panne ? { ok: false, error: 'unavailable' } : { ok: true, data: reponseSimulee(contexte) }; },
      async lire(u) { await pause(); return pageMuette(u); }
    };
    /* deux carnets neufs, aux identifiants à eux (carnetDe reprend celui de la ventilation) */
    const marmite = { ...carnetDe(FIX.marmite), id: 'ZZ-C59-MARMITE' } as CarnetDoc;
    const joint = { ...carnetDe(FIX.joint), id: 'ZZ-C59-JOINT' } as CarnetDoc;
    (marmite.carnet.articles as unknown[]).length = 0; /* la marmite n'a que les articles de son message : un déplacement se voit */
    (joint.carnet.articles as unknown[]).length = 0;
    const magasin = magasinMemoire([...fixtureCarnets(), marmite, joint] as never[]);
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} ecrirePlan={() => {}} />);
    await attendre(30);
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
    const ecrire = async (texte: string) => {
      const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
      fireEvent.change(champ(), { target: { value: texte } });
      await attendre(40);
      fireEvent.keyDown(champ(), { key: 'Enter' });
      await attendre(1800); /* l'IA échoue, une reprise après 400 ms, puis l'avis */
    };
    await ouvrir(/marmite de brassage/i);
    await ecrire(MSG_MARMITE);
    await versListe();
    await ouvrir(/joint torique/i);
    await ecrire(MSG_JOINT);
    /* on quitte le carnet et on y revient : l'avis du dernier message (porté par son retour, qui ne survit pas) laisse le bandeau de reprise, celui du tour 59 */
    await versListe();
    await ouvrir(/joint torique/i);
    return { magasin, textes, etat, ouvrir, versListe };
  }
  const relire = () => [...document.querySelectorAll<HTMLElement>('[data-relire]')].filter(b => /^(Relire|Ranger maintenant)$/.test((b.textContent ?? '').trim()));

  it('dans le joint : « Relire » ne relance que le message du joint, jamais celui de la marmite (tour 59 : 3 messages repris, 2 articles déplacés)', async () => {
    const s = await sceneDeuxEchecs();
    expect(relire().length, 'le bouton « Relire » du joint est affiché').toBeGreaterThan(0);
    const avant = s.textes.length;
    s.etat.panne = false;
    fireEvent.click(relire()[0]);
    await attendre(1500);
    const relances = s.textes.slice(avant);
    expect(relances.length, 'au moins le message du joint est relancé').toBeGreaterThan(0);
    expect(relances.filter(t => t.includes('ks240l-c59')), 'messages de la marmite relancés depuis le joint').toEqual([]);
  }, 40000);

  it('dans le joint : après « Relire », l\'article du message de la marmite est toujours dans la marmite et n\'est pas dans le joint', async () => {
    const s = await sceneDeuxEchecs();
    expect(articlesDe(s.magasin, /marmite de brassage/i).some(a => a.url?.includes('ks240l-c59')), 'avant : l\'article du message est rangé (localement) dans la marmite').toBe(true);
    s.etat.panne = false;
    fireEvent.click(relire()[0]);
    await attendre(1500);
    expect(articlesDe(s.magasin, /joint torique/i).filter(a => a.url?.includes('ks240l-c59')), 'articles de la marmite rangés dans le joint').toEqual([]);
    expect(articlesDe(s.magasin, /marmite de brassage/i).filter(a => a.url?.includes('ks240l-c59')).length, 'l\'article reste dans la marmite').toBeGreaterThanOrEqual(1);
  }, 40000);

  it('le bouton fait ce que le bandeau dit : « 1 message » annoncé dans le joint, un seul message relancé', async () => {
    const s = await sceneDeuxEchecs();
    const bandeau = document.querySelector('.cnf-reprise, [data-sorte="reprise"]');
    const dit = /(\d+) message/.exec(sans(bandeau ? visible(bandeau) : ''));
    expect(dit, 'le bandeau de reprise est affiché dans le joint').toBeTruthy();
    const avant = s.textes.length;
    s.etat.panne = false;
    fireEvent.click(relire()[0]);
    await attendre(1500);
    const messagesDistincts = new Set(s.textes.slice(avant));
    expect(messagesDistincts.size, `le bandeau annonce ${dit![1]} message(s) ; messages relancés : ${JSON.stringify([...messagesDistincts])}`).toBe(Number(dit![1]));
  }, 40000);

  it('dans la marmite : « Relire » ne relance pas le message du joint, et l\'article du joint reste dans le joint', async () => {
    const s = await sceneDeuxEchecs();
    await s.versListe();
    await s.ouvrir(/marmite de brassage/i);
    expect(relire().length, 'le bouton « Relire » de la marmite est affiché').toBeGreaterThan(0);
    const avant = s.textes.length;
    s.etat.panne = false;
    fireEvent.click(relire()[0]);
    await attendre(1500);
    expect(s.textes.slice(avant).filter(t => /joint torique/.test(t)), 'messages du joint relancés depuis la marmite').toEqual([]);
    expect(articlesDe(s.magasin, /marmite de brassage/i).filter(a => /joint/i.test(a.nom ?? '')), 'articles du joint rangés dans la marmite').toEqual([]);
  }, 40000);
});

/* ======================================================================================================== R36 */

/**
 * R36 (C59-4 BLOQUANT ; C55-2 revenu) : « Marmite de brassage 50 L » est une CIBLE. Tour 59 : le critère classe « plus grand d'abord » (sens « plus » donné à la
 * caractéristique créée), le frigo KS240L de 242 L est 1er, la marmite de 50 L « 2e sur 2 », et le compromis dit « le volume 242 L au lieu de 50 L » comme un gain.
 * Règle : un critère qui porte un nombre (« 50 L ») classe les articles par leur proximité au critère ; un article hors genre ou loin du critère ne passe jamais
 * 1er. Les tests acceptent les deux lectures du brasseur (« le plus proche de 50 L » ou « au moins 50 L, le plus petit d'abord ») : elles donnent la même 1re.
 */
describe('R36 (C59-4) : un critère « 50 L » classe par proximité ; le frigo de 242 L ne passe jamais 1er', () => {
  const critere = (o: Partial<Critere> & { caracteristique?: Critere['caracteristique'] } = {}): Critere =>
    ({ id: 'K1', texte: 'Marmite de brassage 50 L', origine: 'ia', ...o }) as Critere;
  const VARIANTES: Array<[string, Critere]> = [
    ['critère « Volume utile », sens « plus » (ce que l\'app crée : tour 59)', critere({ caracteristique: { nom: 'Volume utile', unite: 'L', sens: 'plus' } })],
    ['critère « Marmite de brassage » (nom de la phrase), sens « plus »', critere({ caracteristique: { nom: 'Marmite de brassage', unite: 'L', sens: 'plus' } })],
    ['critère « Volume utile », sens « moins »', critere({ caracteristique: { nom: 'Volume utile', unite: 'L', sens: 'moins' } })],
    ['critère sans caractéristique (l\'idée seule)', critere()]
  ];
  const sansFrigo50 = (c: CarnetDoc) => ({ ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id !== 'F50' && a.id !== 'W3') } }) as CarnetDoc;
  for (const [nom, k] of VARIANTES) {
    it(`marmite 50 L, frigo 242 L et marmite 60 L, ${nom} : la 1re est la marmite de 50 L (ni le frigo de 242 L, ni la marmite de 60 L)`, () => {
      const c = sansFrigo50(carnetDe(FIX.marmite, { critere: k }));
      const t = tableau(c)!;
      const rang = t.lignes.map(l => `${l.rang ?? '-'}:${l.nom}`);
      expect(t.lignes.find(l => l.rang === 1)?.nom, `rangs : ${JSON.stringify(rang)}`).toMatch(/Maischekessel/);
      expect(t.lignes.find(l => /KS240L/.test(l.nom))?.rang, `rangs : ${JSON.stringify(rang)}`).not.toBe(1);
    });
  }
  it('marmite 50 L et frigo 242 L seulement (la capture du tour 59) : la marmite est « 1re sur 2 », le frigo « 2e »', () => {
    const c = carnetDe(FIX.marmite, { critere: VARIANTES[0][1] });
    const deux = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'K1' || a.id === 'W1') } } as CarnetDoc;
    const t = tableau(deux)!;
    const rangs = Object.fromEntries(t.lignes.map(l => [l.articleId, l.rang]));
    expect(rangs, JSON.stringify(rangs)).toEqual({ W1: 1, K1: 2 });
  });
  it('hors genre : un frigo de 50 L pile et une marmite de 45 L : le frigo ne passe pas 1er (le critère parle d\'une marmite, la 1re est de la bonne famille)', () => {
    const c = carnetDe(FIX.marmite, { critere: VARIANTES[0][1] });
    const deux = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'F50' || a.id === 'W3') } } as CarnetDoc;
    const t = tableau(deux)!;
    expect(t.lignes.find(l => l.rang === 1)?.nom, JSON.stringify(t.lignes.map(l => `${l.rang}:${l.nom}`))).toMatch(/Marmite de brassage inox ZZ 45 L/);
  });
  it('le compromis ne présente pas « le volume 242 L au lieu de 50 L » comme un gain de la 1re', () => {
    const c = carnetDe(FIX.marmite, { critere: VARIANTES[0][1] });
    const deux = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'K1' || a.id === 'W1') } } as CarnetDoc;
    const phrase = compromisDe(tableau(deux)) ?? '';
    expect(sans(phrase), `« ${phrase} »`).not.toMatch(/^la 1re,.*242 l au lieu de 50 l/);
  });
  it('Comparer rendu : la colonne de la marmite de 50 L porte la pastille 1, celle du frigo la 2', () => {
    const c = carnetDe(FIX.marmite, { critere: VARIANTES[0][1] });
    const deux = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.filter(a => a.id === 'K1' || a.id === 'W1') } } as CarnetDoc;
    const racine = comparer(deux, { critere: true });
    const colonnes = [...racine.querySelectorAll('th[scope="col"]')].map(th => ({ nom: visible(th), rang: visible(th.querySelector('.cn-cmp-rang') ?? document.createElement('b')) }));
    const de = (re: RegExp) => colonnes.find(c => re.test(c.nom))?.rang;
    expect(colonnes.length, 'une colonne par article').toBeGreaterThanOrEqual(2);
    expect({ marmite: de(/Maischekessel/), frigo: de(/KS240L/) }, JSON.stringify(colonnes)).toEqual({ marmite: '1', frigo: '2' });
  });
});

/* ======================================================================================================== R37 */

/**
 * R37 (C59-6 BLOQUANT ; LIEN-PRIX-JUSTE, ses mots du 24.11 : « 0,10 le Citra ??? ») : le Citra de Brau- und Rauchshop est lu « dès 0,10 CHF » : c'est le prix d'UN
 * GRAMME (0,1044 CHF/g, 0,08 dès 1 000 g). Il est classé 1er, « moins cher », devant MotlerHops à 3,72 € : le prix du SACHET de 50 g. L'app compare un gramme à un
 * sachet. Règle : un prix lu sans quantité n'est jamais comparé comme un prix d'article. Soit le prix d'un conditionnement avec SA quantité (« 50 g »), soit un
 * prix au kilo dit comme tel ; sinon « prix ? » et pas de rang.
 * Forme acceptée d'un prix honnête, dans tous les tests : `prixClasse` absent, ou accompagné de `quantite` et `parUnite` ; un prix lu publié avec sa quantité
 * dans le nom de l'article (`quantiteArticle`) ; jamais un nombre nu pris pour un prix d'article.
 */
describe('R37 (C59-6) : un prix sans quantité ne se compare pas', () => {
  const houblons = () => carnetDe(FIX.houblons);
  const ligneDe = (t: NonNullable<ReturnType<typeof tableau>>, id: string) => t.lignes.find(l => l.articleId === id)!;

  it('tableau (Brau dès 0,10 CHF sans quantité, MotlerHops 3,72 €) : l\'article sans quantité ne passe pas 1er « moins cher »', () => {
    const t = tableau(houblons())!;
    const brau = ligneDe(t, 'H1');
    expect(rangVisible(t, brau), `rang visible de Brau : ${rangVisible(t, brau)} ; rangé par : ${t.rangePar}`).not.toBe(1);
  });
  it('tableau : le prix qui classe est absent, ou ramené à une quantité dite (CHF/kg) ; jamais 0,10 CHF contre 3,72 €', () => {
    const t = tableau(houblons())!;
    for (const id of ['H1', 'H2']) {
      const l = ligneDe(t, id);
      const honnete = l.prixClasse === undefined || (!!l.quantite && !!l.parUnite);
      expect(honnete, `${l.nom} : prixClasse ${l.prixClasse}, quantité ${l.quantite}, par unité ${l.parUnite}`).toBe(true);
    }
  });
  it('tableau : tant que les quantités sont inconnues, aucun des deux n\'est classé « 1er » par le prix (pas de rang sans base de comparaison)', () => {
    const t = tableau(houblons())!;
    const rangs = t.lignes.map(l => ({ nom: l.nom, rang: rangVisible(t, l), parUnite: l.parUnite }));
    const parPrixSeul = rangs.filter(r => r.rang !== null && !r.parUnite);
    expect(parPrixSeul, JSON.stringify(rangs)).toEqual([]);
  });
  it('garde-fou : le compromis ne dit pas « 0,10 CHF » ni « la moins chère » pour un prix sans quantité', () => {
    const phrase = compromisDe(tableau(houblons())) ?? '';
    expect(sans(phrase), `« ${phrase} »`).not.toMatch(/0[,.]10\b|la moins chere/);
  });
  it('garde-fou : quantités dites dans les noms (Citra 1 kg à 80 CHF, Citra US 50 g à 3,72 €) : comparés au kilo, MotlerHops (≈69 CHF/kg) devant Brau (80 CHF/kg)', () => {
    const t = tableau(carnetDe(FIX.houblonsQ))!;
    expect(ligneDe(t, 'Q2').parUnite, 'prix au kilo de MotlerHops').toMatch(/\/kg/);
    expect(t.lignes.find(l => l.rang === 1)?.articleId).toBe('Q2');
  });

  const surfaces: Array<[string, () => Element]> = [
    ['Comparer', () => comparer(houblons())],
    ['feuille Articles', () => feuille(houblons())],
    ['fiche de l\'article de Brau', () => fiche(houblons(), 0)]
  ];
  for (const [nom, rendre] of surfaces) {
    it(`${nom} : « 0,10 CHF » n'est jamais montré comme le prix de l'article (ni « dès 0,10 » sans unité ni quantité)`, () => {
      const t = visible(rendre());
      const nu = /0[,.]10\s?(?:CHF)?(?!\d)(?!\s?(?:\/|par|le|pro|au)\s?(?:g|kg|gramme))/i.exec(t);
      expect(nu?.[0], `texte : ${t.slice(Math.max(0, (nu?.index ?? 0) - 40), (nu?.index ?? 0) + 60)}`).toBeUndefined();
    });
  }
  /* la lecture de page : les deux pages reconstituées du relevé du 24.11 */
  const reseauDe = (html: string): typeof fetch => (async (input: string | URL | Request) => {
    const u = String(input instanceof Request ? input.url : input);
    if (u.endsWith('/robots.txt')) return new Response('', { status: 404 });
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
  }) as typeof fetch;
  const lire = (url: string, html: string) => lireLien(url, { fetchPage: reseauDe(html), maintenant: 1, cours: null });
  const honnetePrix = (p: { prix?: number; nom?: string; valeurs?: Array<{ nom: string; valeur: string; unite?: string }> }) => {
    if (p.prix === undefined) return true;
    if (quantiteArticle({ nom: p.nom ?? '' })) return true;
    return (p.valeurs ?? []).some(v => /^(conditionnement|quantit[eé]|contenu)$/i.test(v.nom) && /^\d+(?:[.,]\d+)?\s?(g|kg|ml|l)$/i.test(`${v.valeur}${v.unite ? ' ' + v.unite : ''}`.trim()));
  };
  it('page Brau- und Rauchshop (0,1044 CHF le gramme) : le prix lu n\'est pas le prix d\'un gramme pris pour celui de l\'article (quantité dite, sinon pas de prix)', async () => {
    const p = await lire('https://www.brauundrauchshop.ch/citra-136-2', F59.pagesHtml.brau);
    const x = p as unknown as { prix?: number; nom?: string; prixDes?: boolean; valeurs?: Array<{ nom: string; valeur: string; unite?: string }> };
    expect(honnetePrix(x), `prix ${x.prix}, nom « ${x.nom} », dès ${x.prixDes}`).toBe(true);
  });
  it('page MotlerHops (3,72 € = le sachet de 50 g ; 250 g et 500 g aussi) : le prix lu dit son conditionnement (50 g), sinon pas de prix', async () => {
    const p = await lire('https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us', F59.pagesHtml.motler);
    const x = p as unknown as { prix?: number; nom?: string; valeurs?: Array<{ nom: string; valeur: string; unite?: string }> };
    expect(honnetePrix(x), `prix ${x.prix}, nom « ${x.nom} »`).toBe(true);
  });
});

/**
 * C59-7 (R37, une seule valeur) : le même article MotlerHops (3,72 €) est « ≈3 CHF » dans le tableau et l'Offre de la fiche, « ≈4 CHF rendu » dans la feuille
 * Articles et dans Comparer. Règle : un article, UN prix ; dit partout de la même façon.
 */
describe('R37 (C59-7) : un seul prix par article, dit partout pareil', () => {
  /** Le texte lu, un espace entre deux éléments (« ≈4 » puis « 3,72 € » ne se collent pas en « ≈43,72 »). */
  const separe = (e: Element) => [...e.querySelectorAll('*')].filter(x => !x.children.length && !x.closest('.cn-cache')).map(x => x.textContent ?? '').join(' ');
  const approx = (e: Element) => [...separe(e).matchAll(/≈\s?(\d+(?:[.,]\d+)?)/g)].map(m => m[1].replace(',', '.'));
  it('MotlerHops 3,72 € : « ≈ n CHF » est la même valeur dans Comparer, la feuille Articles et la fiche', () => {
    const c = carnetDe(FIX.houblons);
    const vues: Record<string, string[]> = { Comparer: approx(comparer(c)) };
    cleanup(); vues['feuille Articles'] = approx(feuille(c));
    cleanup(); vues['fiche'] = approx(fiche(c, 1));
    const toutes = new Set(Object.values(vues).flat());
    expect(toutes.size, `valeurs « ≈ » par écran : ${JSON.stringify(vues)}`).toBeLessThanOrEqual(1);
  });
});

/* ======================================================================================================== R38 */

describe('R38 (C58-4, C50-5, C59-3) : le compromis dit ce qu\'on perd, quelle que soit la forme de la valeur lue', () => {
  const FORMES: Array<[Forme, string]> = [
    ['nombre', 'un nombre et son unité (2,6 + m³)'],
    ['texte', 'la chaîne du nombre et son unité (« 2,6 » + m³)'],
    ['texte-unite', 'tout dans la chaîne (« 2,6 m³ »)']
  ];
  for (const [forme, dite] of FORMES) {
    it(`chambre froide sans critère, volume lu comme ${dite} : « …289,77 CHF de moins que la 2e » dit aussi 4,06 m³ au lieu de 2,6 m³`, () => {
      const c = carnetDe(FIX.chambre, { forme });
      const phrase = compromisDe(tableau(c)) ?? '';
      expect(phrase, `« ${phrase} »`).toMatch(/289,77/);
      expect(sans(phrase), `« ${phrase} »`).toMatch(/4,06 m³ au lieu de 2,6 m³|4,06 m3 au lieu de 2,6 m3/);
      expect(sans(phrase), `« ${phrase} »`).not.toMatch(/aucun critere ne les departage/);
    });
    it(`Comparer rendu (chambre froide sans critère, volume lu comme ${dite}) : l'encadré « Compromis » dit la perte`, () => {
      const c = carnetDe(FIX.chambre, { forme });
      const encart = comparer(c).querySelector('.cn-compromis');
      expect(sans(encart?.textContent ?? ''), `encadré : « ${encart?.textContent} »`).toMatch(/4,06 m³|4,06 m3/);
    });
  }
  it('cellule, critère « Température » identique chez les deux (son carnet ZZ) : le gain (289,77 CHF) et la perte (4,06 m³ au lieu de 2,6) sont dits', () => {
    const k = { id: 'K1', texte: 'Température à 4 °C', origine: 'vous', caracteristique: { nom: 'Température', unite: '°C', sens: 'plus' } } as Critere;
    for (const forme of ['nombre', 'texte-unite'] as const) {
      const c = carnetDe(FIX.chambre, { critere: k, forme });
      const phrase = compromisDe(tableau(c)) ?? '';
      expect(sans(phrase), `forme ${forme} : « ${phrase} »`).toMatch(/289,77/);
      expect(sans(phrase), `forme ${forme} : « ${phrase} »`).toMatch(/4,06 m³|4,06 m3/);
    }
  });
});

describe('R38 (C59-2) : IA en pause (plafond atteint) : la cause est dite, aucune relance en boucle', () => {
  const PLAFOND = 'le plafond de dépenses IA du projet est atteint. Vérifie le plafond mensuel dans la console AI Studio → Dépenses';
  async function unMessageSousPlafond() {
    let appelsFaits = 0;
    const appels: AppelsIA = { async ranger() { appelsFaits++; await pause(); return { ok: false, error: PLAFOND }; }, async lire(u) { await pause(); return pageMuette(u); } };
    const marmite = { ...carnetDe(FIX.marmite), id: 'ZZ-C59-MARMITE' } as CarnetDoc;
    const magasin = magasinMemoire([...fixtureCarnets(), marmite] as never[]);
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never} appels={appels} aides={aidesCarnet('simule' as never, {})} ecrirePlan={() => {}} />);
    await attendre(30);
    const lien = [...document.querySelectorAll<HTMLElement>('button, a, [role="button"]')].find(e => /marmite de brassage/i.test(e.textContent ?? '') && !e.closest('.cn-champ'));
    expect(lien, 'le carnet de la marmite est ouvrable').toBeTruthy();
    fireEvent.click(lien!);
    await attendre(150);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: 'ZZ TEST — soudure inox 50 L, à demander' } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(1800);
    return { appelsFaits: () => appelsFaits };
  }
  it('un message, l\'IA répond « plafond atteint » : un seul appel, pas de reprise après répit (les 12 à 15 appels refusés du tour 59)', async () => {
    const s = await unMessageSousPlafond();
    expect(s.appelsFaits(), 'appels à l\'IA pour un seul message').toBe(1);
  }, 20000);
  it('un message, l\'IA répond « plafond atteint » : l\'écran dit que l\'IA est en pause (la cause), pas seulement « n\'a pas répondu »', async () => {
    await unMessageSousPlafond();
    const ecran = sans(visible(document.body));
    expect(ecran, 'l\'écran dit la cause').toMatch(/en pause|plafond/);
  }, 20000);
});

describe('R38 (C59-5) : le lien retour garde son titre d\'un seul tenant', () => {
  const regles = reglesDeCarnet();
  /** Les « éléments de flex » d'un conteneur : chaque enfant élément, et chaque suite de texte (un texte nu devient un élément anonyme). */
  function elementsFlex(el: Element): string[] {
    const items: string[] = [];
    let courant = '';
    const vider = () => { if (courant.trim()) items.push(courant.trim()); courant = ''; };
    for (const n of [...el.childNodes]) {
      if (n.nodeType === Node.TEXT_NODE) courant += (n as Text).data;
      else if ((n as Element).tagName?.toLowerCase() === 'svg') vider();
      else { vider(); if (visible(n as Element)) items.push(visible(n as Element)); }
    }
    vider();
    return items;
  }
  const retours: Array<[string, () => Element]> = [
    ['Comparer de la marmite', () => comparer(carnetDe(FIX.marmite))],
    ['Comparer du joint', () => comparer(carnetDe(FIX.joint))]
  ];
  for (const [nom, rendre] of retours) {
    it(`${nom} : si le lien retour est un conteneur flex, son titre n'est pas éclaté en plusieurs éléments côte à côte (« …brassage » / « 50 L »)`, () => {
      const racine = rendre();
      const liens = [...racine.querySelectorAll('.cn-retour')];
      if (!liens.length) return;
      for (const lien of liens) {
        const d = (styleDe(lien, regles).get('display') ?? '').trim();
        if (!/flex|grid/.test(d)) continue;
        const items = elementsFlex(lien);
        expect(items, `display: ${d} ; éléments flex du lien : ${JSON.stringify(items)}`).toHaveLength(1);
      }
    });
  }
});

describe('R38 (C59-8) : sur un houblon, l\'alpha s\'appelle « Alpha » et passe en tête', () => {
  it('fiche « Citra 13.6% » : la caractéristique « Citra : 13,6 % » devient « Alpha 13,6 % »', () => {
    const racine = fiche(carnetDe(FIX.houblons), 0);
    const t = visible(racine);
    expect(sans(t), t.slice(0, 600)).toMatch(/alpha\s*:?\s*13,6\s?%/);
    expect(sans(t), 'une caractéristique nommée comme la variété').not.toMatch(/citra\s*:?\s*13,6\s?%/);
  });
  it('fiche : « Alpha » vient avant les autres caractéristiques (Arômes, Origine) : l\'α avant le reste', () => {
    const t = sans(visible(fiche(carnetDe(FIX.houblons), 0)));
    const alpha = t.search(/alpha\s*:?\s*13,6/);
    const aromes = t.search(/aromes/);
    expect(alpha, t.slice(0, 600)).toBeGreaterThanOrEqual(0);
    expect(alpha, 'Alpha avant Arômes').toBeLessThan(aromes);
  });
});

describe('R38 (C59-9) : les arômes d\'un houblon se disent en français', () => {
  it('fiche « Citra 13.6% » : « Limette, Mango, tropische Früchte » devient « citron vert, mangue, fruits tropicaux »', () => {
    const t = sans(visible(fiche(carnetDe(FIX.houblons), 0)));
    expect(t, t.slice(0, 600)).not.toMatch(/tropische|mango\b|limette/);
    expect(t).toMatch(/fruits tropicaux/);
  });
  it('lecture serveur : « Aromen : Limette, Mango, tropische Früchte » est traduit à la lecture', () => {
    const v = traduireValeurs([{ nom: 'Aromen', valeur: 'Limette, Mango, tropische Früchte' }])!;
    expect(sans(v[0].valeur), JSON.stringify(v)).toMatch(/citron vert.*mangue.*fruits tropicaux/);
  });
});

describe('R38 (C59-10) : la jauge du critère ne touche pas « Veiller »', () => {
  it('feuille Articles : l\'écart horizontal entre la jauge et « Veiller » couvre le rond de la jauge qui déborde de sa piste', () => {
    const regles = reglesDeCarnet();
    const racine = feuille(carnetDe(FIX.marmite));
    const pied = racine.querySelector('.cn-classee-pied');
    const reglette = racine.querySelector('.cn-reglette');
    expect(pied && reglette, 'la feuille montre une jauge (la valeur du critère est chiffrée)').toBeTruthy();
    const gap = /^\s*(\S+)(?:\s+(\S+))?\s*$/.exec(styleDe(pied!, regles).get('gap') ?? '');
    const colonne = px(gap ? gap[2] ?? gap[1] : undefined) ?? px(styleDe(pied!, regles).get('column-gap')) ?? 0;
    const margeDroite = px(styleDe(reglette!, regles).get('margin-right')) ?? 0;
    const rond = racine.querySelector('.cn-reglette-rond');
    const demiRond = rond ? (px(styleDe(rond, regles).get('width')) ?? 16) / 2 : 8;
    expect(colonne + margeDroite, `écart ${colonne} + ${margeDroite} px ; le rond déborde de ${demiRond} px au bout de la piste : il reste ${colonne + margeDroite - demiRond} px de blanc`).toBeGreaterThanOrEqual(demiRond + 4);
  });
});
