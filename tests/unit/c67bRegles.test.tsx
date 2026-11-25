// @vitest-environment jsdom
/**
 * Voie c67b-tests (25.11) : les tests ROUGES des règles R63 à R69 tirées du test en ligne du tour 67, second passage (voies/critique-67b/RESULTAT.md ; BUGS.md C67B-1 à C67B-9,
 * C67-2, C67-5, C67-8, C66-4, C66-7, C65-4). Écrits depuis les RÈGLES (voies/c67b-tests/DOSSIER.md) et les maquettes choisies v01 (passes 2 et 3), avant tout correctif : celui qui
 * corrige n'écrit pas le test. Aucun réseau, aucun Gemini (AiClient lève s'il est appelé ; IA simulée `appelsSimules`). Données : tests/fixtures/c67b/ (carnet de pellets, sujets de
 * mémos), fixtures du suivi, phrases inventées (« ZZ TEST — »). Aucune donnée réelle.
 *
 *  - R63 (C67B-1, C66-4, C66-7, C65-4, C67B-8) : le prix choisi est celui de la QUANTITÉ cochée (1 kg ≈ 40 CHF) partout où il se dit (confirmation, carnet « Choisi », liste, À venir) ; un même
 *    sachet n'a qu'UN prix (celui de son prix au kilo). GESTE : CarnetsVue monté, fiche MotlerHops, « Choisir · MotlerHops, 1 kg », Choisir chez, retours.
 *  - R64 (C67B-2) : un achat choisi sans date arrive dans À venir sans date inventée, sous le nom de l'ARTICLE. Le Quand du carnet ne dit pas « vers févr. · prix ? ».
 *  - R65 (C67B-3) : la confirmation de Choisir tient dans 390 px, jugée PAR STRUCTURE (jsdom ne mesure aucune boîte) : aucune valeur de texte forcée sur une ligne (`white-space: nowrap`
 *    lu dans les feuilles de style réelles), chaque curseur dit son unité et son sens aux deux bornes.
 *  - R66 (C67B-4) : photo seule : la carte propose « Rattacher à … ? » vers un problème ouvert (Je cherche / Décidé, tous genres comme le coup d'œil), Oui · Nouveau problème · Laisser ; la photo
 *    rangée est montrée (défilée en vue). GESTES : la photo choisie et envoyée depuis la liste ; « Oui ».
 *  - R67 (C67B-5) : un mémo (fait accompli, pas une idée) se rattache au carnet existant du MÊME SUJET ; jamais un carnet « idée » neuf. 3 sujets neufs (pompe, levure, sonde), jamais le sol seul.
 *  - R68 (C67B-6) : un carnet rangé « problème » s'ouvre sur l'écran problème (Noté · Je cherche · Décidé · Résolu), jamais sur l'écran idée, tout de suite et après être sorti.
 *  - R69 : C67B-7 (Comparer : le meilleur coché sur « vendu par », pas de ligne « vendeur » qui redit l'en-tête) ; C67B-9 (› ouvre la fiche suivante en haut) ; C67-2 (tâche proposée) ;
 *    C67-8 (« Piste : … » dans un problème = une option, pas un article « lu sur la page ») ; C67-5 (Réalisés liste aussi les problèmes résolus).
 *
 * Limites : jsdom ne mesure aucune boîte : le débordement à 390 px se juge sur `white-space` calculé depuis les feuilles réelles (cascade par ordre de feuille, sans spécificité exacte) ; le rendu
 * réel reste à voir en ligne. Le vrai Gemini n'est pas appelé : R66 à R69 se jugent sur l'IA simulée (qui lit des mots) et sur le texte de la consigne ; le SENS réel du modèle reste à voir en ligne.
 * Un test qui passe déjà est marqué « garde-fou » avec sa raison.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDS_SUIVI, MAINTENANT_SUIVI, fixtureCarnets, fixtureSuivi, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets, type CarnetDoc } from '../../src/domain/carnets/modele';
import { choisir } from '../../src/domain/carnets/operations';
import { placesDe, tableau } from '../../src/domain/carnets/comparer';
import { aidesCarnet } from '../../src/config/carnetIA';
import { StorageService } from '../../src/services/storage';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { Reglette } from '../../src/ui/carnets/Choisir';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import { appelsSimules, type AppelsIA } from '../../src/ui/carnets/rangement';
import { propositionARanger } from '../../src/ui/carnets/afaireRegles';
import { poserQuantitePour } from '../../src/ui/carnets/tableauRegles';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ID_PELLETS, TITRE_PELLETS, pelletsC67b, pelletsTrois } from '../fixtures/c67b/pellets';
import { SUJETS_MEMO, itemSujet } from '../fixtures/c67b/sujets';

const JPEG_ENVOYE = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
vi.mock('../../src/ui/carnets/photo', async orig => ({ ...(await orig<typeof import('../../src/ui/carnets/photo')>()), reduirePhoto: async () => 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

interface Defilement { cible: Element; options?: unknown }
const defiles: Defilement[] = [];
const hauts: unknown[] = [];
beforeEach(() => {
  defiles.length = 0; hauts.length = 0;
  Element.prototype.scrollIntoView = function (this: Element, options?: unknown) { defiles.push({ cible: this, options }); } as never;
  window.scrollTo = ((...a: unknown[]) => { hauts.push(a); }) as never;
  Element.prototype.scrollTo = ((...a: unknown[]) => { hauts.push(a); }) as never;
  localStorage.clear(); sessionStorage.clear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); document.head.querySelectorAll('style[data-c67b]').forEach(s => s.remove()); });

/* ------------------------------------------------------------------------------------------------ outils */

type Item = ReturnType<typeof fixtureSuivi>[number];
const MAINT = () => new Date(MAINTENANT_SUIVI);
const attendre = async (ms: number) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const lu = (e: Element | null | undefined): string => (e?.textContent ?? '').replace(/[\s  ]+/g, ' ').trim();
const sans = (s: string) => s.normalize('NFKC').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘ʼ]/g, "'").replace(/[\s  ]+/g, ' ').trim().toLowerCase();
const bouton = (re: RegExp, racine: ParentNode = document): HTMLButtonElement | undefined =>
  [...racine.querySelectorAll('button')].find(b => re.test(sans(`${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`))) as HTMLButtonElement | undefined;
const pasDeGemini: AppelsIA = { async ranger() { return { ok: false, error: 'aucune IA ici' }; }, async lire() { throw new Error('aucun lien ici'); } };
const sansPlans = { plans: [] as FinancialPlan[], transactions: [], payments: [] };

/* ================================================================================================== R63 / R64 : le geste Choisir MotlerHops 1 kg */

/** Le carnet de pellets (MotlerHops en euros, Hopfenmarkt en francs), ouvert. Le plan écrit se rend à la vue (`rerender`) comme le fait l'app (le plan existe alors dans À venir). */
function monterPellets(doc: { id: string } = pelletsC67b()) {
  const autres = fixtureCarnets().filter(i => i.id !== ID_PELLETS);
  const magasin = magasinMemoire([doc as never, ...autres]);
  const ecrits: FinancialPlan[] = [];
  const vue = (plans: FinancialPlan[]) => (
    <CarnetsVue magasin={magasin} finances={{ ...sansPlans, plans }} mode={'simule' as never} appels={pasDeGemini} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT}
      ouvrir={{ id: doc.id, at: 1 }} ecrirePlan={(pl: FinancialPlan) => { ecrits.push(pl); }} />
  );
  const r = render(vue([]));
  const rendrePlan = () => r.rerender(vue(ecrits.length ? [ecrits[ecrits.length - 1]] : []));
  return { magasin, ecrits, rendrePlan };
}
const carnetDe = (m: ReturnType<typeof magasinMemoire>, id = ID_PELLETS) => lireCarnets(m.lire()).find(c => c.id === id)!;

async function ouvrirFiche(vendeur: RegExp) {
  fireEvent.click([...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(b => /articles/i.test(b.textContent ?? ''))!);
  await attendre(30);
  const feuille = document.querySelector('[role="dialog"][aria-modal="true"]')!;
  const carte = [...feuille.querySelectorAll('button')].find(b => vendeur.test(sans(b.textContent ?? '')) && !/retirer|deplacer/.test(sans(b.getAttribute('aria-label') ?? '')));
  expect(carte, `la carte ${vendeur} de la feuille Articles`).toBeTruthy();
  fireEvent.click(carte!);
  await attendre(30);
}

/** Tout le geste du test en ligne : 1 kg coché, fiche MotlerHops, Choisir · MotlerHops, 1 kg, Choisir chez MotlerHops. Rend le prix du kilo que la fiche annonce (« ≈40 CHF rendu »). */
async function choisirMotlerHops1kg() {
  poserQuantitePour(TITRE_PELLETS, 1);
  const m = monterPellets();
  await attendre(60);
  await ouvrirFiche(/motlerhops/);
  const fiche = lu(document.querySelector('.cn-fiche'));
  const kilo = /≈\s?(\d+)\s?CHF rendu/.exec(fiche);
  expect(kilo, `la fiche annonce le kilo rendu : ${fiche.slice(0, 300)}`).toBeTruthy();
  const choisirFiche = bouton(/^choisir · motlerhops, 1 kg/);
  expect(choisirFiche, 'le bouton de la fiche dit la quantité cochée').toBeTruthy();
  fireEvent.click(choisirFiche!);
  await attendre(30);
  const confirmation = document.querySelector('.cn-choisir')!;
  expect(confirmation, 'l\'écran de confirmation').toBeTruthy();
  const texteConfirmation = lu(confirmation);
  fireEvent.click(bouton(/^choisir chez motlerhops/, confirmation)!);
  await attendre(80);
  return { ...m, kilo: Number(kilo![1]), texteConfirmation, fiche };
}

describe('R63 (C67B-1, C66-4, C66-7, C65-4) : le prix choisi est celui de la quantité cochée (1 kg ≈ 40 CHF) partout', () => {
  it('garde-fou (déjà juste, R54 : la confirmation dit 1 kg et le kilo de la fiche) : jamais le sachet de 50 g', async () => {
    const { kilo, texteConfirmation } = await choisirMotlerHops1kg();
    expect(kilo, 'le kilo rendu est de l\'ordre de 35 à 45 CHF (40,69 € le kilo)').toBeGreaterThan(35);
    expect(kilo).toBeLessThan(45);
    expect(texteConfirmation, texteConfirmation).toMatch(new RegExp(`${kilo}\\s?CHF`));
    expect(texteConfirmation, texteConfirmation).toMatch(/1 kg/);
    expect(texteConfirmation, texteConfirmation).not.toMatch(/≈\s?[34]\s?CHF/);
  });

  it('le plan écrit pour À venir porte le prix du kilo et sa quantité (garde-fou : déjà juste)', async () => {
    const { kilo, ecrits } = await choisirMotlerHops1kg();
    const plan = ecrits.at(-1);
    expect(plan, 'un plan À venir écrit').toBeTruthy();
    expect(plan!.amountCents, 'le kilo en centimes').toBe(kilo * 100);
    expect(plan!.notes).toBe('1 kg');
  });

  it('le carnet « Choisi » dit le kilo (« 1 kg · ≈40 CHF »), pas le sachet de 50 g (« ≈3 CHF · 50 g »)', async () => {
    const { kilo } = await choisirMotlerHops1kg();
    const choisi = lu(document.querySelector('.cn-choisi'));
    expect(choisi, 'le carnet est passé à « Choisi »').toMatch(/Choisi le/);
    expect(choisi, choisi).toMatch(new RegExp(`≈?\\s?${kilo}\\s?CHF`));
    expect(choisi, choisi).toMatch(/1 kg/);
    expect(choisi, `le sachet de 50 g n'est pas le prix choisi : ${choisi}`).not.toMatch(/50 g/);
    expect(choisi, choisi).not.toMatch(/≈\s?[34]\s?CHF/);
  });

  it('la liste des carnets dit le kilo du choix (« ≈40 CHF · 1 kg »), pas « ≈4 CHF les 50 g »', async () => {
    const { kilo, rendrePlan } = await choisirMotlerHops1kg();
    rendrePlan();
    await attendre(30);
    document.querySelector<HTMLElement>('.cn-retour')!.click();
    await attendre(60);
    document.querySelector<HTMLElement>('.cn-retour')?.click();
    await attendre(60);
    const lignes = [...document.querySelectorAll('button, li, a, article, div')].filter(e => lu(e).includes('pellets (c66)') && /CHF/.test(lu(e)) && lu(e).length < 200);
    expect(lignes.length, 'la ligne du carnet dans la liste, avec son prix').toBeGreaterThan(0);
    const ligne = lu(lignes.sort((a, b) => lu(a).length - lu(b).length)[0]);
    expect(ligne, ligne).toMatch(new RegExp(`${kilo}\\s?CHF`));
    expect(ligne, ligne).toMatch(/1 kg/);
    expect(ligne, ligne).not.toMatch(/les 50 g/);
  });

  describe('un même sachet n\'a qu\'UN prix (celui de son prix au kilo) : MotlerHops 3,72 € les 50 g, choisi sans quantité (depuis Comparer)', () => {
    const choisiSansQuantite = async () => {
      const d = pelletsC67b();
      const r = choisir([d as never], { carnetId: ID_PELLETS, articleId: 'M1', pourquoi: 'le moins cher', le: '2026-11-25T10:00:00.000Z' });
      if (!r.ok) throw new Error(r.raison);
      const doc = r.ecritures.filter(e => e.op === 'put').map(e => (e as { doc: { id: string } }).doc)[0];
      monterPellets(doc);
      await attendre(60);
      /* le carnet déjà choisi s'ouvre sur sa ligne « Choisi : … · Pourquoi » ; un toucher ouvre la page « Choisi » */
      const ligneChoisi = bouton(/^choisi :/);
      expect(ligneChoisi, `la ligne « Choisi » du carnet : ${lu(document.body).slice(0, 200)}`).toBeTruthy();
      fireEvent.click(ligneChoisi!);
      await attendre(60);
      expect(document.querySelector('.cn-choisi'), 'la page « Choisi »').toBeTruthy();
    };
    /** « ≈N CHF » du sachet et « X CHF/kg » d'un même texte : N doit être X pour le sachet (50 g = 1/20 de kilo), arrondi au franc. */
    const coherent = (t: string) => {
      const kg = /(\d+[.,]\d+)\s?CHF\s?\/\s?kg/.exec(t), sachet = /≈\s?(\d+)\s?CHF/.exec(t);
      expect(kg && sachet, `un sachet et son kilo dans « ${t} »`).toBeTruthy();
      expect(Number(sachet![1]), `« ${t} » : le sachet de 50 g n'est pas le 20e du kilo`).toBe(Math.round(Number(kg![1].replace(',', '.')) * 0.05));
    };
    it('le carnet « Choisi » : le prix du sachet est le 20e de son prix au kilo', async () => {
      await choisiSansQuantite();
      coherent(lu(document.querySelector('.cn-choisi')));
    });
    it('la liste dit le même sachet que le carnet « Choisi » (« ≈4 » des deux côtés, pas ≈3 dans l\'un)', async () => {
      await choisiSansQuantite();
      const sachetCarnet = /≈\s?(\d+)\s?CHF/.exec(lu(document.querySelector('.cn-choisi')));
      document.querySelector<HTMLElement>('.cn-retour')!.click();
      await attendre(60);
      document.querySelector<HTMLElement>('.cn-retour')?.click();
      await attendre(60);
      const lignes = [...document.querySelectorAll('button, li, a, article, div')].filter(e => lu(e).includes('pellets (c66)') && /les 50 g/.test(lu(e)) && lu(e).length < 200);
      expect(lignes.length, 'la ligne du carnet dans la liste').toBeGreaterThan(0);
      const sachetListe = /≈\s?(\d+)\s?CHF/.exec(lu(lignes.sort((a, b) => lu(a).length - lu(b).length)[0]));
      expect(sachetCarnet && sachetListe, 'un sachet dans chacun').toBeTruthy();
      expect(sachetListe![1], 'le carnet dit ≈' + sachetCarnet![1] + ', la liste ≈' + sachetListe![1]).toBe(sachetCarnet![1]);
    });
  });
});

describe('R64 (C67B-2) : un achat choisi sans date arrive dans À venir sans date inventée, sous le nom de l\'ARTICLE', () => {
  it('le plan écrit n\'a pas de date (« à dater »), pas le 1er du mois dans trois mois', async () => {
    const { ecrits } = await choisirMotlerHops1kg();
    const plan = ecrits.at(-1)!;
    expect(plan, 'un plan écrit').toBeTruthy();
    expect(plan.date, `date posée : « ${plan.date} » (jamais choisie par le brasseur)`).not.toMatch(/^\d{4}-\d{2}/);
  });

  it('le plan écrit porte le nom de l\'ARTICLE (CITRA® (US)), pas le titre du carnet (ZZ TEST — pellets)', async () => {
    const { ecrits } = await choisirMotlerHops1kg();
    const plan = ecrits.at(-1)!;
    expect(sans(plan.title), `titre du plan : « ${plan.title} »`).toMatch(/citra/);
    expect(sans(plan.title), `titre du plan : « ${plan.title} »`).not.toMatch(/pellets \(c66\)/);
  });

  it('le Quand du carnet ne dit pas « vers févr. · prix ? » (une date que personne n\'a donnée, un prix connu dit « à estimer »)', async () => {
    const { rendrePlan } = await choisirMotlerHops1kg();
    rendrePlan();
    await attendre(30);
    document.querySelector<HTMLElement>('.cn-retour')!.click();
    await attendre(60);
    const quand = lu(document.querySelector('.cn-ouvert') ?? document.body);
    expect(quand, quand).not.toMatch(/vers (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/i);
    expect(quand, quand).not.toMatch(/prix \?/);
  });

  it('À venir (Stocks › Matériel) : la carte du plan dit « Sans date » et le nom de l\'article, pas « Prévu en févr. 2027 »', async () => {
    const { ecrits } = await choisirMotlerHops1kg();
    cleanup();
    const plan = ecrits.at(-1)!;
    vi.spyOn(StorageService, 'getCreativeItems').mockReturnValue([pelletsC67b() as never]);
    const snap = StorageService.getCreativeItems;
    expect(snap).toBeTruthy();
    const { FinanceService } = await import('../../src/services/financeService');
    vi.spyOn(FinanceService, 'getPlans').mockReturnValue([plan] as never);
    const { container } = render(<UpgradeWorkspace vue="future" onVue={() => undefined} />);
    await attendre(30);
    const texte = lu(container);
    expect(texte, texte.slice(0, 400)).toMatch(/Sans date|Fixer la date/);
    expect(texte, texte.slice(0, 400)).not.toMatch(/Prévu en/);
    expect(sans(texte), texte.slice(0, 400)).toMatch(/citra/);
  });
});

/* ================================================================================================== R65 : la confirmation tient dans 390 px */

describe('R65 (C67B-3) : la confirmation de Choisir tient dans 390 px, jugée par structure', () => {
  const FEUILLES = ['carnets.css', 'carnets-decider.css', 'fiche-article.css'];
  const poserFeuilles = () => {
    const st = document.createElement('style');
    st.setAttribute('data-c67b', '');
    st.textContent = FEUILLES.map(f => readFileSync(`src/ui/carnets/${f}`, 'utf8')).join('\n');
    document.head.appendChild(st);
  };
  /** Le `white-space` qui s'applique à un élément : le plus proche, lui compris, qui en pose un (la propriété s'hérite). */
  const espaceDe = (el: Element, racine: Element): string => {
    for (let e: Element | null = el; e && e !== racine.parentElement; e = e.parentElement) {
      const v = getComputedStyle(e).whiteSpace;
      if (v) return v;
    }
    return 'normal';
  };
  async function confirmationOuverte() {
    poserFeuilles();
    poserQuantitePour(TITRE_PELLETS, 1);
    monterPellets();
    await attendre(60);
    await ouvrirFiche(/motlerhops/);
    fireEvent.click(bouton(/^choisir · motlerhops, 1 kg/)!);
    await attendre(30);
    return document.querySelector('.cn-choisir')!;
  }

  it('« Ses autres valeurs » : une valeur de texte longue (Arômes) n\'est pas forcée sur une ligne (nowrap élargit le tableau au-delà des 390 px)', async () => {
    const ecran = await confirmationOuverte();
    const cellule = [...ecran.querySelectorAll('td, dd, span, p, div')].filter(e => e.children.length === 0 && /agrumes, pamplemousse/.test(lu(e))).at(-1);
    expect(cellule, 'la valeur « agrumes, pamplemousse… » est dite').toBeTruthy();
    expect(espaceDe(cellule!, ecran), `white-space de « ${lu(cellule)} »`).not.toBe('nowrap');
  });

  it('chaque valeur de texte de plus de 14 signes se replie (aucune cellule de « Ses autres valeurs » en nowrap)', async () => {
    const ecran = await confirmationOuverte();
    const cellules = [...ecran.querySelectorAll('.cn-place td')].filter(td => lu(td).length > 14);
    expect(cellules.length, 'au moins une valeur longue').toBeGreaterThan(0);
    const forcees = cellules.filter(td => espaceDe(td, ecran) === 'nowrap').map(lu);
    expect(forcees, 'valeurs forcées sur une ligne').toEqual([]);
  });

  /** Les curseurs réels de l'app : prix des pellets (CHF/kg), débit et bruit de la ventilation (m³/h, dB). */
  const curseurs = () => {
    const sortie: { place: ReturnType<typeof placesDe>[number]; origine: string }[] = [];
    for (const [nom, doc] of [['pellets', pelletsC67b()], ['ventilation', lireCarnets(fixtureCarnets({ g8: true }) as never).find(c => c.id === ID_VENTILATION)!]] as const) {
      const t = tableau(doc.carnet as never);
      if (!t) continue;
      for (const l of t.lignes) for (const pl of placesDe(t, l.articleId)) if (pl.valeur !== undefined && pl.meilleure !== undefined && pl.pire !== undefined && pl.toutes) sortie.push({ place: pl, origine: `${nom}/${l.articleId}` });
    }
    return sortie;
  };
  it('chaque curseur (réglette) dit son unité et son sens à SES DEUX bornes (« ‹ moins cher · 67 CHF/kg » … « 68 CHF/kg »)', () => {
    const tous = curseurs();
    expect(tous.length, 'des curseurs à juger').toBeGreaterThanOrEqual(2);
    for (const { place, origine } of tous) {
      const { container } = render(<Reglette place={place} />);
      const bornes = [...container.querySelectorAll('.cn-reglette-bornes > span')].map(lu);
      expect(bornes.length, `deux bornes pour ${origine}/${place.nom}`).toBe(2);
      const unite = place.nom === 'prix' ? /CHF/ : new RegExp((place.unite ?? '').replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&'));
      for (const b of bornes) expect(b, `borne « ${b} » de ${origine}/${place.nom} : son unité`).toMatch(unite);
      expect(bornes[0], `borne gauche de ${origine}/${place.nom} : le sens`).toMatch(/mieux|moins cher|meilleur/);
      cleanup();
    }
  });
});

/* ================================================================================================== R66 : photo seule */

describe('R66 (C67B-4) : photo seule : « Rattacher à … ? » vers un problème ouvert ; la photo rangée est montrée', () => {
  const photoSeule = (items: Item[]) => items.filter(i => [IDS_SUIVI.photo, IDS_SUIVI.chambreFroide, IDS_SUIVI.fete].includes(i.id as never));
  const monterListe = (items: Item[]) => {
    const magasin = magasinMemoire(items as never[]);
    render(<CarnetsVue magasin={magasin} finances={sansPlans} mode={'simule' as never} appels={appelsSimules('normal', 5)} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never} />);
    return magasin;
  };

  it('propositionARanger : la photo seule se rattache à un carnet « Je cherche » / « Décidé » sans genre « problème » posé (le coup d\'œil les compte)', () => {
    const tous = lireCarnets(photoSeule(fixtureSuivi()) as never, { archives: true });
    const photo = tous.find(c => c.id === IDS_SUIVI.photo)!;
    const cherche = tous.filter(c => c.id !== IDS_SUIVI.photo);
    expect(cherche.length, 'des carnets ouverts dans le jeu').toBeGreaterThanOrEqual(1);
    const p = propositionARanger({ carnetId: photo.id, photo: 'data:image/jpeg;base64,xx', le: MAINTENANT_SUIVI }, tous, [], MAINT);
    expect(p.sorte, `proposition : ${JSON.stringify(p)} (le coup d'œil compte ${cherche.length} carnet(s) ouvert(s))`).toBe('rattacher');
  });

  it('la liste montée (une photo seule à ranger, deux carnets « je cherche ») : la carte dit « Rattacher à … ? » avec Oui, Nouveau problème, Laisser', async () => {
    monterListe(photoSeule(fixtureSuivi()));
    await attendre(60);
    const carte = document.querySelector('.af-carte')!;
    expect(carte, 'la carte de la photo seule').toBeTruthy();
    const t = lu(carte);
    expect(lu(document.querySelector('[class*="oeil"]')), 'le coup d\'œil compte des « je cherche »').toMatch(/[1-9]\s?je cherche/);
    expect(t, t).not.toMatch(/Aucun problème ouvert/);
    expect(t, t).toMatch(/Rattacher à .+ \?/);
    for (const mot of ['Oui', 'Nouveau problème', 'Laisser']) expect(bouton(new RegExp(`^${sans(mot)}$`), carte), `bouton « ${mot} »`).toBeTruthy();
  });

  it('« Oui » : la photo passe dans le carnet proposé (elle y est, et le magasin le dit)', async () => {
    const magasin = monterListe(photoSeule(fixtureSuivi()));
    await attendre(60);
    const oui = bouton(/^oui$/, document.querySelector('.af-carte') ?? document);
    expect(oui, 'le bouton Oui de la carte').toBeTruthy();
    fireEvent.click(oui!);
    await attendre(80);
    const avecPhoto = lireCarnets(magasin.lire() as never, { archives: true }).filter(c => c.id !== IDS_SUIVI.photo && c.carnet.photos.length > 0).map(c => c.id);
    expect(avecPhoto, 'un carnet ouvert a reçu la photo').not.toEqual([]);
  });

  const envoyerUnePhoto = async () => {
    const items = fixtureSuivi().filter(i => i.id !== IDS_SUIVI.photo);
    monterListe(items);
    await attendre(60);
    const entree = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(entree, { target: { files: [new File(['x'], 'p.jpg', { type: 'image/jpeg' })] } });
    await attendre(80);
    const envoi = [...document.querySelectorAll('button')].find(b => b.className.includes('cn-envoi-mot'));
    expect(envoi, 'le bouton d\'envoi de la photo jointe').toBeTruthy();
    fireEvent.click(envoi!);
    await attendre(150);
  };

  it('GESTE : une photo seule envoyée depuis la liste (8 problèmes ouverts) : la carte « Rattacher à … ? » est proposée', async () => {
    await envoyerUnePhoto();
    const t = lu(document.body);
    expect(t, t.slice(0, 500)).toMatch(/Rattacher à .+ \?/);
    expect(t, t.slice(0, 500)).not.toMatch(/Aucun problème ouvert où la ranger/);
  });

  it('GESTE : la photo rangée est montrée : l\'écran la fait défiler en vue (« Photo rangée ici » ne laisse pas la photo hors de vue)', async () => {
    await envoyerUnePhoto();
    const img = [...document.querySelectorAll('img')].find(i => i.getAttribute('src') === JPEG_ENVOYE);
    expect(img, 'la photo envoyée est à l\'écran').toBeTruthy();
    const enVue = defiles.some(d => d.cible.contains(img!) && !/end/.test(JSON.stringify(d.options ?? {})));
    expect(enVue, `défilements : ${defiles.map(d => `${d.cible.tagName}.${(d.cible as HTMLElement).className}`).join(' | ')}`).toBe(true);
  });
});

/* ================================================================================================== R67 : un mémo se rattache au carnet de son sujet */

describe('R67 (C67B-5) : un mémo (fait accompli) se rattache au carnet existant du même sujet ; jamais un carnet « idée » neuf', () => {
  async function taperMemo(phrase: string, sujets = SUJETS_MEMO) {
    const items = [...fixtureSuivi().filter(i => i.id === IDS_SUIVI.fete), ...sujets.map(itemSujet)] as Item[];
    const magasin = magasinMemoire(items as never[]);
    render(<CarnetsVue magasin={magasin} finances={sansPlans} mode={'simule' as never} appels={appelsSimules('normal', 5)} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never} />);
    await attendre(40);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: phrase } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(900);
    return { magasin, feuille: document.querySelector('[data-feuille-rangement]') };
  }

  /** Un bout du TITRE du carnet que le mémo ne recopie pas : s'il est dans la feuille, c'est que la feuille nomme ce carnet (pas qu'elle redit la phrase). */
  const MARQUE: Record<string, string> = { pompe: 'pompe de transfert', levure: 'stockage et repiquage', sonde: 'temperature de la cave' };
  for (const s of SUJETS_MEMO) {
    it(`sujet « ${s.sujet} » : le mémo va dans « ${s.titre} », pas dans un carnet idée neuf`, async () => {
      const { feuille } = await taperMemo(s.memo);
      expect(feuille, 'la feuille « rangé pour toi »').toBeTruthy();
      const t = lu(feuille);
      expect(t, `jamais « nouveau carnet · idée » : ${t}`).not.toMatch(/nouveau carnet/);
      expect(sans(t), `le carnet du sujet est nommé : ${t}`).toContain(MARQUE[s.sujet]);
    }, 20000);
  }

  it('garde-fou (déjà juste) : un mémo d\'un sujet sans carnet n\'est rattaché à aucun des autres sujets', async () => {
    const memo = 'ZZ TEST — c67b mémo : le fermenteur de 50 litres a très bien tenu la pression pendant toute la garde, rien à signaler';
    const { feuille } = await taperMemo(memo, SUJETS_MEMO);
    const t = sans(lu(feuille));
    for (const s of SUJETS_MEMO) expect(t, `rattaché à tort à « ${s.titre} » : ${t}`).not.toContain(MARQUE[s.sujet]);
  }, 20000);
});

/* ================================================================================================== R68 : le carnet « problème » s'ouvre sur l'écran problème */

describe('R68 (C67B-6) : un carnet rangé « problème » s\'ouvre sur l\'écran problème (Noté · Je cherche · Décidé · Résolu), jamais sur l\'écran idée', () => {
  const PROBLEMES = [
    'ZZ TEST — Fuite au robinet du lavage des fûts, de l’eau partout au sol de la salle',
    'ZZ TEST — La cuve d’ébullition est en panne, la résistance ne chauffe plus du tout'
  ];
  const MOTS = ['Noté', 'Je cherche', 'Décidé', 'Résolu'];
  async function rangerPuisOuvrir(phrase: string, motif: RegExp) {
    const magasin = magasinMemoire(fixtureSuivi().filter(i => i.id === IDS_SUIVI.fete) as never[]);
    render(<CarnetsVue magasin={magasin} finances={sansPlans} mode={'simule' as never} appels={appelsSimules('normal', 5)} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never} />);
    await attendre(40);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    fireEvent.change(champ(), { target: { value: phrase } });
    await attendre(40);
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(900);
    const feuille = document.querySelector('[data-feuille-rangement]')!;
    expect(lu(feuille), 'la carte dit « nouveau problème »').toMatch(/nouveau problème/);
    fireEvent.click(bouton(/^ok$/, feuille)!);
    await attendre(80);
    const ouvrir = async () => {
      const ligne = [...document.querySelectorAll<HTMLElement>('.cnl-pb')].find(l => motif.test(lu(l)));
      expect(ligne, 'la ligne du problème dans la liste').toBeTruthy();
      expect(ligne!.getAttribute('data-genre'), 'la liste le dit problème').toBe('probleme');
      fireEvent.click(ligne!);
      await attendre(80);
    };
    return { ouvrir };
  }
  const motsEtat = () => [...document.querySelectorAll('.cnp-etat-mot')].map(lu);

  for (const phrase of PROBLEMES) {
    it(`« ${phrase.slice(10, 62)}… » : le carnet ouvert depuis la liste montre la barre d'état du problème`, async () => {
      const { ouvrir } = await rangerPuisOuvrir(phrase, /fuite|cuve/i);
      await ouvrir();
      expect(document.querySelector('.cn-ouvert'), 'le carnet s\'ouvre').toBeTruthy();
      expect(motsEtat(), `l'écran ouvert : ${lu(document.querySelector('.cn-ouvert')).slice(0, 160)}`).toEqual(MOTS);
      expect(lu(document.querySelector('.cn-ouvert')), 'jamais l\'écran idée').not.toMatch(/Ensuite : l'IA cherche les façons|Articles · collez un lien/);
    }, 20000);
  }

  it('sorti puis revenu : toujours l\'écran du problème', async () => {
    const { ouvrir } = await rangerPuisOuvrir(PROBLEMES[0], /fuite/i);
    await ouvrir();
    document.querySelector<HTMLElement>('.cn-retour')!.click();
    await attendre(80);
    await ouvrir();
    expect(motsEtat(), `l'écran rouvert : ${lu(document.querySelector('.cn-ouvert')).slice(0, 160)}`).toEqual(MOTS);
  }, 20000);
});

/* ================================================================================================== R69 */

describe('R69 · C67B-7 : Comparer côte à côte : le meilleur coché sur chaque ligne qui se classe ; pas de ligne qui redit l\'en-tête', () => {
  const monterComparer = () => {
    poserQuantitePour(TITRE_PELLETS, 1);
    const c = pelletsTrois();
    const nop = () => undefined;
    return render(<Comparer titre={c.title} statut="research" tableau={tableau(c) as never} articles={c.carnet.articles as never} onRetour={nop} onChoisir={nop} />).container;
  };
  const lignes = (r: Element) => [...r.querySelectorAll('tbody tr')].filter(tr => !(tr as HTMLElement).hidden);
  const libelle = (tr: Element) => sans(lu(tr.querySelector('th') ?? tr));

  it('garde-fou (déjà juste) : les lignes Prix et Alpha portent le ✓ de leur meilleur', () => {
    const r = monterComparer();
    for (const re of [/chf\/kg|prix/, /alpha/]) {
      const tr = lignes(r).find(x => re.test(libelle(x)));
      expect(tr, `ligne ${re}`).toBeTruthy();
      expect(tr!.querySelector('td.cn-meilleur'), `✓ sur la ligne ${re}`).toBeTruthy();
    }
  });
  it('« vendu par 1 g à 20 kg » (la plus large étendue de quantités) porte son ✓, pas seulement le prix', () => {
    const tr = lignes(monterComparer()).find(x => /vendu par/.test(libelle(x)));
    expect(tr, 'la ligne « vendu par »').toBeTruthy();
    const i = [...tr!.querySelectorAll('td')].findIndex(td => td.classList.contains('cn-meilleur'));
    expect(i, `✓ sur « vendu par » : ${[...tr!.querySelectorAll('td')].map(lu).join(' | ')}`).toBeGreaterThanOrEqual(0);
    expect(lu([...tr!.querySelectorAll('td')][i]), 'le meilleur est la plage la plus large').toMatch(/1 g à 20 kg/);
  });
  it('aucune ligne « vendeur » : l\'en-tête de chaque colonne dit déjà le vendeur', () => {
    const r = monterComparer();
    const vendeur = lignes(r).filter(x => /^vendeur$/.test(libelle(x))).map(libelle);
    expect(vendeur, 'la ligne vendeur redit l\'en-tête').toEqual([]);
  });
});

describe('R69 · C67B-9 : › (article suivant) ouvre la fiche suivante en haut', () => {
  it('Choisir (en bas de la fiche MotlerHops), puis « Article suivant » : la page est ramenée en haut de la fiche', async () => {
    poserQuantitePour(TITRE_PELLETS, 1);
    monterPellets(pelletsTrois());
    await attendre(60);
    await ouvrirFiche(/motlerhops/);
    const avant = lu(document.querySelector('.cn-fiche'));
    const suivant = bouton(/article suivant/);
    expect(suivant, 'le bouton › de la fiche').toBeTruthy();
    defiles.length = 0; hauts.length = 0;
    fireEvent.click(suivant!);
    await attendre(60);
    const fiche = document.querySelector('.cn-fiche')!;
    expect(fiche, 'une fiche').toBeTruthy();
    expect(lu(fiche), 'c\'est bien l\'autre article').not.toBe(avant);
    const enHaut = hauts.some(a => a[0] === 0 && a[1] === 0 || (typeof a[0] === 'object' && a[0] !== null && (a[0] as { top?: number }).top === 0))
      || defiles.some(d => (d.cible === fiche || fiche.contains(d.cible) || d.cible.contains(fiche)) && !/end/.test(JSON.stringify(d.options ?? {})));
    expect(enHaut, `aucun retour en haut (défilements : ${defiles.length}, scrollTo : ${hauts.length})`).toBe(true);
  });
});

describe('R69 · C67-2 : un message qui dit un besoin propose une tâche (« Tâche proposée : … ») dans « rangé pour toi »', () => {
  const BESOINS = [
    'ZZ TEST — Il faut racheter des joints de rechange pour la pompe avant le prochain brassage',
    'ZZ TEST — Besoin de commander un nouveau tuyau pour le transfert vers le fermenteur',
    'ZZ TEST — Penser à acheter des bouchons de rechange pour les bonbonnes de fermentation'
  ];
  for (const phrase of BESOINS) {
    it(`« ${phrase.slice(10, 66)}… »`, async () => {
      const magasin = magasinMemoire(fixtureSuivi().filter(i => i.id === IDS_SUIVI.fete) as never[]);
      render(<CarnetsVue magasin={magasin} finances={sansPlans} mode={'simule' as never} appels={appelsSimules('normal', 5)} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT} ecrirePlan={(() => {}) as never} />);
      await attendre(40);
      const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
      fireEvent.change(champ(), { target: { value: phrase } });
      await attendre(40);
      fireEvent.keyDown(champ(), { key: 'Enter' });
      await attendre(900);
      const t = lu(document.querySelector('[data-feuille-rangement]'));
      expect(t, 'la feuille « rangé pour toi »').toBeTruthy();
      expect(t, t).toMatch(/Tâche proposée/i);
    }, 20000);
  }
});

describe('R69 · C67-8 : « Piste : … » tapé dans un problème devient une OPTION du problème, jamais un article « lu sur la page »', () => {
  const PISTES: [string, RegExp][] = [
    ['Piste : déshumidificateur industriel, 890 CHF chez Brouwland', /d[ée]shumidificateur/i],
    ['Piste : sécheur d’air à roue, 1 250 CHF chez Brouwland', /s[ée]cheur/i]
  ];
  for (const [phrase, nom] of PISTES) {
    it(`« ${phrase.slice(0, 40)}… » : une option nommée, aucun article au nom de la phrase`, async () => {
      const magasin = magasinMemoire(fixtureSuivi().filter(i => [IDS_SUIVI.vapeur, IDS_SUIVI.fete].includes(i.id as never)) as never[]);
      render(<CarnetsVue magasin={magasin} finances={sansPlans} mode={'simule' as never} appels={appelsSimules('normal', 5)} aides={aidesCarnet('simule' as never, {})} maintenant={MAINT}
        ecrirePlan={(() => {}) as never} ouvrir={{ id: IDS_SUIVI.vapeur, at: 1 }} />);
      await attendre(60);
      const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
      fireEvent.change(champ(), { target: { value: phrase } });
      await attendre(40);
      fireEvent.keyDown(champ(), { key: 'Enter' });
      await attendre(900);
      const c = lireCarnets(magasin.lire() as never, { archives: true }).find(x => x.id === IDS_SUIVI.vapeur)!;
      expect(c.carnet.facons.map(f => f.nom).join(' | '), 'une option au nom de l\'objet').toMatch(nom);
      expect(c.carnet.articles.map(a => a.nom ?? '').filter(n => /^piste/i.test(n)), 'aucun article ne porte la phrase « Piste : … » en nom').toEqual([]);
      expect(lu(document.body), 'pas de « lu sur la page » sans page').not.toMatch(/lu sur la page : nom, prix[^|]{0,40}Piste/);
    }, 20000);
  }
});

describe('R69 · C67-5 : l\'onglet Réalisés liste aussi les problèmes résolus, pas seulement les plans payés', () => {
  it('Stocks › Matériel › Réalisés (6 carnets résolus dans le jeu du suivi) : les problèmes résolus y sont, avec leur titre', async () => {
    const items = fixtureSuivi().filter(i => (i as { type?: string }).type === 'carnet');
    vi.spyOn(StorageService, 'getCreativeItems').mockReturnValue(items as never);
    const resolus = lireCarnets(items as never, { archives: true }).filter(c => c.carnet.suivi?.etat === 'resolu' || !!c.carnet.archive);
    expect(resolus.length, 'des problèmes résolus dans le jeu').toBeGreaterThanOrEqual(2);
    const { container } = render(<UpgradeWorkspace vue="completed" onVue={() => undefined} />);
    await attendre(30);
    const t = sans(lu(container));
    const absents = resolus.map(c => c.title.replace(/^ZZ TEST\s*—\s*/, '')).filter(titre => !t.includes(sans(titre)));
    expect(absents, `Réalisés ne les liste pas : ${lu(container).slice(0, 200)}`).toEqual([]);
  });
});
