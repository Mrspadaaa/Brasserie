// @vitest-environment jsdom
/**
 * Voie c74-tests (25.11) : les tests ROUGES des règles R89 et R91 tirées de ses plaintes du 25.11 (voies/c74-fix/DOSSIER.md ; DEFAUTS-RECURRENTS § CARNET-LISTE-COMPACTE ;
 * captures plaintes/2026-11-25-carnet-liste-compact.jpg et 2026-11-25-carnet-priorite.jpg). Écrits depuis les RÈGLES, avant tout correctif : celui qui corrige n'écrit pas le test (L17).
 * R90 (densité : 70 % de la hauteur utile aux lignes, 7 lignes sans défiler) n'est pas mesurable en jsdom (aucune boîte) : `scripts/controle-liste-compacte.mjs`, au navigateur.
 *
 *  - R89 (« quand j'ai un filtre je peux pas replier ») : dans la liste en arbre (CarnetsVue réel), toucher l'en-tête d'un DOMAINE puis d'un SOUS-DOMAINE replie ses lignes, le retoucher les rend ;
 *    avec un filtre du coup d'œil (« je cherche »), avec une recherche tapée, et sans filtre (garde). L'en-tête reste, avec `aria-expanded` ; le filtre reste actif ; un voisin n'est pas replié.
 *  - R91 (« pouvoir dépasser et classé en fonction de la priorité »; sa parole : « Pas du drag and drop ») : dans un sous-domaine, le menu ⋯ de la ligne offre « En tête », « Monter », « Descendre » ;
 *    l'ordre est SA priorité, enregistré dans le magasin (hors ligne compris), gardé au remontage ; un carnet jamais déplacé garde l'ordre actuel (plus récent d'abord) et passe après les classés.
 *    Aucun glisser. Le nom du champ de priorité n'est PAS imposé : le test passe par l'écriture au magasin puis par un remontage sur une copie sérialisée (ce que Firestore / Dexie rendraient).
 *
 * Contrat d'accès du menu ⋯ (le test ne dépend de rien d'autre) : la ligne reste un `button.cnl-pb` qui ouvre le carnet ; son bouton ⋯ est un autre bouton, dans le même bloc que cette ligne seule
 * (le premier ancêtre qui ne contient plus qu'une ligne), nommé par un `aria-label` (ou un texte) qui contient « ⋯ », « plus », « menu », « actions » ou « options » ; ses choix s'appellent
 * exactement « En tête », « Monter », « Descendre » (bouton ou `role=menuitem`) et se jouent d'un toucher. Au premier rang, « En tête » et « Monter » sont absents ou désactivés ; au dernier, « Descendre ».
 * Réponses de l'IA : aucune (jamais appelée). Aucun réseau.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAINTENANT_SUIVI, fixtureSuivi } from '../../src/domain/carnets/fixture';
import { aidesCarnet } from '../../src/config/carnetIA';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { TITRES_BRASSAGE, TITRES_FERMENTATION, TITRE_NEUF, carnetPlusRecent, fixtureBrassage } from '../fixtures/c74/brassage';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));
beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; localStorage.clear(); sessionStorage.clear(); });
afterEach(() => cleanup());

/* ------------------------------------------------------------------------------------------------ outils */

type Item = Parameters<typeof magasinMemoire>[0][number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const norm = (t: string | null | undefined): string => (t ?? '').replace(/[\s  ]+/g, ' ').trim();
const appelsHorsLigne: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };

function monter(items: Item[], o: { horsLigne?: boolean; magasin?: ReturnType<typeof magasinMemoire> } = {}) {
  const magasin = o.magasin ?? magasinMemoire(items as never[]);
  const r = render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode={'simule' as never}
    appels={appelsHorsLigne} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never} {...(o.horsLigne ? { horsLigne: true } : {})} />);
  return { magasin, ...r };
}
/** Le même magasin « rechargé » : une copie SÉRIALISÉE de ce qui a été écrit, comme Firestore ou Dexie le rendraient (aucun champ invisible n'y survit). */
const rechargee = (m: ReturnType<typeof magasinMemoire>) => magasinMemoire(JSON.parse(JSON.stringify(m.lire())) as never[]);

/** Une boîte est vue : elle est dans la page et aucun de ses ancêtres n'est caché (`hidden`, `aria-hidden`, `display: none`). jsdom ne charge aucune feuille de style : seuls ces drapeaux comptent. */
function visible(e: Element): boolean {
  for (let x: Element | null = e; x; x = x.parentElement) {
    if (x.hasAttribute('hidden') || x.getAttribute('aria-hidden') === 'true' || (x as HTMLElement).style?.display === 'none') return false;
  }
  return e.isConnected;
}
const titreDe = (ligne: Element): string => norm(ligne.querySelector('.cnl-t')?.textContent ?? ligne.textContent).replace(/^ZZ TEST — /, '');
const section = (domaine: string) => document.querySelector(`section.cnl-domaine[data-domaine="${domaine}"]`) as HTMLElement;
const lignesVisibles = (racine: ParentNode): HTMLElement[] => [...racine.querySelectorAll<HTMLElement>('button.cnl-pb')].filter(visible);
const enteteDomaine = (domaine: string) => section(domaine).querySelector('.cnl-dn') as HTMLElement;
const enteteSous = (domaine: string, nom: string): HTMLElement => {
  const e = [...section(domaine).querySelectorAll<HTMLElement>('button.cnl-sd')].find(b => norm(b.querySelector('b')?.textContent) === nom);
  if (!e) throw new Error(`pas de sous-domaine « ${nom} » sous ${domaine}`);
  return e;
};
/** L'élément qui porte `aria-expanded` pour cet en-tête (lui-même, son bouton, ou son ancêtre). */
const porteur = (entete: HTMLElement): Element | null => entete.closest('[aria-expanded]') ?? entete.querySelector('[aria-expanded]');
const etatOuvert = (entete: HTMLElement): string | null => porteur(entete)?.getAttribute('aria-expanded') ?? null;
const cible = (entete: HTMLElement): HTMLElement => (entete.matches('button') ? entete : entete.querySelector<HTMLElement>('button') ?? entete);
const toucher = (entete: HTMLElement) => fireEvent.click(cible(entete));

/** Les lignes (titres) d'un sous-domaine, dans l'ordre affiché, celles qu'on voit seulement. */
function ordreDe(domaine: string, nom: string): string[] {
  const enfants = [...section(domaine).children];
  const sorties: string[] = [];
  let dedans = false;
  for (const e of enfants) {
    const estSous = e.matches('button.cnl-sd') || !!e.querySelector(':scope > button.cnl-sd');
    if (estSous) { dedans = norm((e.matches('button.cnl-sd') ? e : e.querySelector('button.cnl-sd'))!.querySelector('b')?.textContent) === nom; continue; }
    if (!dedans) continue;
    if (e.matches('.cnl-dn')) continue;
    sorties.push(...lignesVisibles(e.matches('button.cnl-pb') ? e.parentElement! : e).filter(l => e.matches('button.cnl-pb') ? l === e : true).map(titreDe));
  }
  return sorties;
}
/** Ouvre le sous-domaine s'il est replié (le départ sans filtre : tout est replié). */
function ouvrirSous(domaine: string, nom: string) { const e = enteteSous(domaine, nom); if (etatOuvert(e) !== 'true') toucher(e); }

const filtre = (cle: 'cherche' | 'decide' | 'note' | 'resolu') => fireEvent.click(document.querySelector(`.cnl-case[data-etat="${cle}"]`)!);

/* =========================================================================================================== R89 : replier avec un filtre */

describe('R89 — replier un domaine et un sous-domaine, avec ou sans filtre', () => {
  it('garde : sans filtre, le sous-domaine se déplie puis se replie d’un toucher sur son en-tête', () => {
    monter(fixtureBrassage());
    expect(etatOuvert(enteteSous('brasserie', 'Brassage'))).toBe('false');
    expect(ordreDe('brasserie', 'Brassage')).toEqual([]);
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(etatOuvert(enteteSous('brasserie', 'Brassage'))).toBe('true');
    expect(ordreDe('brasserie', 'Brassage')).toHaveLength(4);
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(etatOuvert(enteteSous('brasserie', 'Brassage'))).toBe('false');
    expect(ordreDe('brasserie', 'Brassage')).toEqual([]);
  });

  it('avec le filtre « je cherche » : toucher l’en-tête du sous-domaine replie ses lignes, le retoucher les rend ; le voisin et le filtre ne bougent pas', () => {
    monter(fixtureBrassage({ cherche: true }));
    filtre('cherche');
    expect(document.querySelector('.cnl-filtre')?.textContent).toMatch(/je cherche/);
    expect(ordreDe('brasserie', 'Brassage')).toHaveLength(4);
    expect(ordreDe('brasserie', 'Fermentation')).toHaveLength(2);
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(etatOuvert(enteteSous('brasserie', 'Brassage'))).toBe('false');
    expect(ordreDe('brasserie', 'Brassage')).toEqual([]);
    expect(ordreDe('brasserie', 'Fermentation')).toHaveLength(2); /* le voisin reste ouvert */
    expect(document.querySelector('.cnl-filtre')?.textContent).toMatch(/je cherche/); /* le filtre reste actif */
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(etatOuvert(enteteSous('brasserie', 'Brassage'))).toBe('true');
    expect(ordreDe('brasserie', 'Brassage')).toHaveLength(4);
  });

  it('avec une recherche tapée : le sous-domaine se replie aussi', () => {
    monter(fixtureBrassage());
    fireEvent.click(document.querySelector('.cnl-loupe')!);
    fireEvent.change(document.querySelector('input[type="search"]')!, { target: { value: 'zz test' } });
    expect(ordreDe('brasserie', 'Brassage')).toHaveLength(4);
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(etatOuvert(enteteSous('brasserie', 'Brassage'))).toBe('false');
    expect(ordreDe('brasserie', 'Brassage')).toEqual([]);
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(ordreDe('brasserie', 'Brassage')).toHaveLength(4);
  });

  it('avec le filtre « je cherche » : toucher l’en-tête de domaine replie TOUTES ses lignes (en-tête et compte restent), le retoucher les rend', () => {
    monter(fixtureSuivi() as Item[]);
    filtre('cherche');
    const avant = lignesVisibles(section('local')).map(titreDe);
    expect(avant.length).toBeGreaterThanOrEqual(2); /* le Fusible et l'Écoulement sont « je cherche » */
    toucher(enteteDomaine('local'));
    expect(etatOuvert(enteteDomaine('local'))).toBe('false');
    expect(lignesVisibles(section('local'))).toHaveLength(0);
    expect(enteteDomaine('local').textContent).toMatch(/Local/);
    expect(document.querySelector('.cnl-filtre')?.textContent).toMatch(/je cherche/);
    toucher(enteteDomaine('local'));
    expect(etatOuvert(enteteDomaine('local'))).toBe('true');
    expect(lignesVisibles(section('local')).map(titreDe)).toEqual(avant);
  });

  it('avec le filtre « je cherche » : replier un domaine ne replie pas l’autre', () => {
    monter(fixtureSuivi() as Item[]);
    filtre('cherche');
    const brasserie = lignesVisibles(section('brasserie')).length;
    expect(brasserie).toBeGreaterThan(0);
    toucher(enteteDomaine('local'));
    expect(lignesVisibles(section('local'))).toHaveLength(0);
    expect(lignesVisibles(section('brasserie'))).toHaveLength(brasserie);
  });

  it('sans filtre : l’en-tête de domaine replie et rend ses lignes de problèmes', () => {
    monter(fixtureSuivi() as Item[]);
    const avant = lignesVisibles(section('local')).map(titreDe);
    expect(avant).toHaveLength(4);
    toucher(enteteDomaine('local'));
    expect(etatOuvert(enteteDomaine('local'))).toBe('false');
    expect(lignesVisibles(section('local'))).toHaveLength(0);
    toucher(enteteDomaine('local'));
    expect(lignesVisibles(section('local')).map(titreDe)).toEqual(avant);
  });

  it('un domaine replié reste replié quand on touche une case du coup d’œil… puis qu’on la retire : la liste ne perd pas son repli de sous-domaine', () => {
    monter(fixtureBrassage({ cherche: true }));
    filtre('cherche');
    toucher(enteteSous('brasserie', 'Brassage'));
    expect(ordreDe('brasserie', 'Brassage')).toEqual([]);
    filtre('cherche'); /* retire le filtre */
    expect(document.querySelector('.cnl-filtre')).toBeNull();
    expect(ordreDe('brasserie', 'Brassage')).toEqual([]); /* son repli est gardé : il l'a demandé */
  });
});

/* =========================================================================================================== R91 : la priorité d'un carnet dans son sous-domaine */

/** Le bouton ⋯ de la ligne d'un titre (contrat en tête du fichier) ; `null` s'il n'y en a pas. */
function boutonMenu(titre: string): HTMLElement | null {
  const ligne = lignesVisibles(document).find(l => titreDe(l) === titre);
  if (!ligne) return null;
  let bloc: HTMLElement = ligne;
  for (let i = 0; i < 4 && bloc.parentElement && bloc.parentElement.querySelectorAll('button.cnl-pb').length === 1 && !bloc.parentElement.matches('section'); i += 1) bloc = bloc.parentElement;
  return [...bloc.querySelectorAll<HTMLElement>('button')].find(b => b !== ligne && !ligne.contains(b) && /⋯|…|\bplus\b|menu|actions|options/i.test(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`)) ?? null;
}
const choix = (libelle: string): HTMLElement | null => [...document.querySelectorAll<HTMLElement>('[role="menuitem"], button')].filter(visible).find(e => norm(e.textContent) === libelle) ?? null;
const actif = (e: HTMLElement | null): boolean => !!e && !(e as HTMLButtonElement).disabled && e.getAttribute('aria-disabled') !== 'true';
function jouer(titre: string, libelle: 'En tête' | 'Monter' | 'Descendre') {
  const m = boutonMenu(titre);
  if (!m) throw new Error(`pas de menu ⋯ sur la ligne « ${titre} »`);
  fireEvent.click(m);
  const c = choix(libelle);
  if (!actif(c)) throw new Error(`« ${libelle} » n’est pas jouable sur « ${titre} »`);
  fireEvent.click(c!);
}
const [A, B, C, D] = TITRES_BRASSAGE;
const NORMAL = [A, B, C, D];
const brassage = () => ordreDe('brasserie', 'Brassage');

describe('R91 — classer un sous-domaine par priorité (menu ⋯ : En tête, Monter, Descendre)', () => {
  it('garde : un carnet jamais déplacé garde l’ordre actuel (le plus récent d’abord), sans rien écrire', () => {
    const m = monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    expect(brassage()).toEqual(NORMAL);
    ouvrirSous('brasserie', 'Fermentation');
    expect(ordreDe('brasserie', 'Fermentation')).toEqual([...TITRES_FERMENTATION]);
    expect(m.magasin.ecritures).toHaveLength(0);
  });

  it('chaque ligne d’un sous-domaine porte un menu ⋯ avec En tête, Monter, Descendre', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    for (const titre of [B, C]) {
      const m = boutonMenu(titre);
      expect(m, `menu ⋯ de « ${titre} »`).not.toBeNull();
      fireEvent.click(m!);
      for (const l of ['En tête', 'Monter', 'Descendre']) expect(actif(choix(l)), `« ${l} » sur « ${titre} »`).toBe(true);
      fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    }
  });

  it('aux bouts : le premier ne peut ni monter ni passer en tête, le dernier ne peut pas descendre', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    const premier = boutonMenu(A);
    expect(premier).not.toBeNull();
    fireEvent.click(premier!);
    expect(actif(choix('Monter'))).toBe(false);
    expect(actif(choix('En tête'))).toBe(false);
    expect(actif(choix('Descendre'))).toBe(true);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    const dernier = boutonMenu(D);
    expect(dernier).not.toBeNull();
    fireEvent.click(dernier!);
    expect(actif(choix('Descendre'))).toBe(false);
    expect(actif(choix('Monter'))).toBe(true);
    expect(actif(choix('En tête'))).toBe(true);
  });

  it('« Descendre » sur la première ligne la passe sous la deuxième ; les autres gardent leur ordre', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(A, 'Descendre');
    expect(brassage()).toEqual([B, A, C, D]);
  });

  it('« Monter » sur la troisième ligne la passe devant la deuxième', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(C, 'Monter');
    expect(brassage()).toEqual([A, C, B, D]);
  });

  it('« En tête » sur la dernière ligne la met au premier rang ; les autres gardent leur ordre', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(D, 'En tête');
    expect(brassage()).toEqual([D, A, B, C]);
  });

  it('plusieurs gestes de suite : Houblons citra (1re) descend deux fois, puis Bac de trempage passe en tête', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(A, 'Descendre');
    jouer(A, 'Descendre');
    expect(brassage()).toEqual([B, C, A, D]);
    jouer(D, 'En tête');
    expect(brassage()).toEqual([D, B, C, A]);
  });

  it('un déplacement ne touche pas le sous-domaine voisin', () => {
    monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    ouvrirSous('brasserie', 'Fermentation');
    jouer(D, 'En tête');
    expect(brassage()).toEqual([D, A, B, C]);
    expect(ordreDe('brasserie', 'Fermentation')).toEqual([...TITRES_FERMENTATION]);
  });

  it('l’ordre est ENREGISTRÉ : le geste écrit au magasin, et une copie sérialisée du magasin remontée redonne le même ordre', () => {
    const m = monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(C, 'En tête');
    expect(brassage()).toEqual([C, A, B, D]);
    expect(m.magasin.ecritures.length, 'le déplacement doit écrire').toBeGreaterThan(0);
    cleanup();
    monter([], { magasin: rechargee(m.magasin) });
    ouvrirSous('brasserie', 'Brassage');
    expect(brassage()).toEqual([C, A, B, D]);
  });

  it('l’ordre est gardé quand la même liste se remonte sur le même magasin (rechargement de l’écran)', () => {
    const m = monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(B, 'Descendre');
    expect(brassage()).toEqual([A, C, B, D]);
    cleanup();
    monter([], { magasin: m.magasin });
    ouvrirSous('brasserie', 'Brassage');
    expect(brassage()).toEqual([A, C, B, D]);
  });

  it('hors ligne : le déplacement s’écrit sur l’appareil et se garde au remontage', () => {
    const m = monter(fixtureBrassage(), { horsLigne: true });
    ouvrirSous('brasserie', 'Brassage');
    jouer(D, 'Monter');
    expect(brassage()).toEqual([A, B, D, C]);
    expect(m.magasin.ecritures.length).toBeGreaterThan(0);
    cleanup();
    monter([], { magasin: rechargee(m.magasin), horsLigne: true });
    ouvrirSous('brasserie', 'Brassage');
    expect(brassage()).toEqual([A, B, D, C]);
  });

  it('un carnet jamais déplacé suit l’ordre actuel et passe APRÈS les carnets classés : un neuf, plus récent, vient après celui mis en tête', () => {
    const m = monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    jouer(C, 'En tête');
    expect(brassage()).toEqual([C, A, B, D]);
    cleanup();
    const apres = rechargee(m.magasin);
    apres.appliquer([{ op: 'put', doc: carnetPlusRecent() } as never]);
    monter([], { magasin: apres });
    ouvrirSous('brasserie', 'Brassage');
    expect(brassage()).toEqual([C, TITRE_NEUF, A, B, D]);
  });

  it('un carnet jamais déplacé n’a rien d’écrit à son sujet : déplacer D ne réécrit ni le titre ni la catégorie des autres', () => {
    const m = monter(fixtureBrassage());
    ouvrirSous('brasserie', 'Brassage');
    const avant = m.magasin.lire();
    jouer(D, 'En tête');
    const apres = m.magasin.lire();
    for (const a of avant) {
      const b = apres.find(x => x.id === a.id)!;
      expect(b.title).toBe(a.title);
      expect((b as never as { carnet: { categorie: unknown } }).carnet.categorie).toEqual((a as never as { carnet: { categorie: unknown } }).carnet.categorie);
    }
    expect(apres).toHaveLength(avant.length); /* aucun carnet créé ni perdu */
  });
});
