// @vitest-environment jsdom
/**
 * Port du carnet, critique 6, lot corr6-A (fil, note en vrac, IA simulée). Un test par point du lot (CRITIQUE-6.md) :
 * 1 n° 1 (note en vrac découpée : un carnet par objet) ; 2 n° 2 (le type annoncé est appliqué) ; 3 n° 3 (sa valeur remplace celle de
 * l'IA sur le même axe) ; 4 n° 4 et 5 (Retenir, Pourquoi) ; 5 n° 9 (D-35) ; 6 n° 11 (lien : promesse tenue, G20) ; 7 n° 12 (rang du lien) ;
 * 8 n° 13 (lien depuis la liste : le besoin en titre) ; 9 n° 14 (phrase citée une fois) ; 10 n° 24 (hors ligne) ; 11 n° 26 (titreCourt) ;
 * 12 n° 29 (puces « Va dans ») ; 13 n° 35 (0 et 1 carnet) ; 14 n° 31 (carnetProche) ; 15 décisions du pilote.
 * Fixture « ZZ TEST — … », magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CarnetsVue, depuisIA, rangDuLien } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules, planVrac, sorteVrac, type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet, type ModeCarnetIA } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_EVIER, ID_FRIGO, ID_VENTILATION, ID_VENTILATION_CAVE, NOTE_VRAC_BANC, PHRASE_DOUBLON } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { analyserTexte, decouper, prixTousDe } from '../../src/domain/carnets/analyseLocale';
import { aucunCarnetNEnParle, carnetProche, rattacher } from '../../src/domain/carnets/rattacher';
import { pageSimulee, reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { contexteModele, type CarnetPourIA } from '../../src/domain/carnets/ia';
import { tableau as tableauDe } from '../../src/domain/carnets/comparer';
import { texteBandeau } from '../../src/ui/carnets/Bandeau';
import { LigneRangee } from '../../src/ui/carnets/LigneRangee';
import { ChampCarnet, titreCourt, titreQuiTient } from '../../src/ui/carnets/ChampCarnet';
import { CadreArrivee } from '../../src/ui/carnets/CadreArrivee';

/** La forme compacte d'un carnet pour l'IA (comme `pourIA` de CarnetsVue). */
const pourIA = (cs: CarnetDoc[]): CarnetPourIA[] => cs.map(c => ({ id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons,
  articles: c.carnet.articles.map(a => ({ nom: a.nom, valeurs: a.valeurs })), notes: c.carnet.notes.map(n => ({ id: n.id, texte: n.texte })) }));

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...a: unknown[]) => run(...a) } }));

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); expect(run).not.toHaveBeenCalled(); });

function monter(o: { delai?: number; ouvrir?: string; mode?: ModeCarnetIA; horsLigne?: boolean; appels?: AppelsIA; items?: unknown[] } = {}) {
  const magasin = magasinMemoire((o.items ?? fixtureCarnets()) as never);
  const props = { magasin, finances: { plans: [], transactions: [], payments: [] }, mode: o.mode ?? 'simule' as ModeCarnetIA,
    appels: o.appels ?? appelsSimules('normal', o.delai ?? 20), aides: aidesCarnet('simule', {}), ecrirePlan: () => {} };
  const vue = render(<CarnetsVue {...props} horsLigne={o.horsLigne} {...(o.ouvrir ? { ouvrir: { id: o.ouvrir, at: 1 } } : {})} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const carnets = () => lireCarnets(magasin.lire(), { archives: true });
  return { magasin, vue, champ, carnets, props };
}
const attendre = async (ms = 30) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const taper = (champ: () => HTMLTextAreaElement, txt: string) => fireEvent.change(champ(), { target: { value: txt } });
const soumettre = async (champ: () => HTMLTextAreaElement) => { await act(async () => { fireEvent.submit(champ().closest('form')!); }); };

/* Les trois notes en vrac du banc (vision 6) : 1280-17 (levure), 390-22 (phrases étiquetées sur une ligne), la note de la fixture. */
const NOTE_1280 = 'Ajoute : 2 sachets de levure\nSol local : 2 bacs\nProchain brassage mardi';
const NOTE_390 = 'Pour le bac : 2 bacs de lavage. Pour la hotte : tient 80 °C. Pour la pompe : 1 800 m³/h.';
const plan = (note: string) => { const cs = lireCarnets(fixtureCarnets() as never); return planVrac(analyserTexte(note), t => rattacher(t, cs)); };

describe('1 · n° 1 : la note en vrac se découpe ligne par ligne, un carnet par objet', () => {
  it('note 1280 : 3 lignes, 2 carnets ; la levure et le brassage hors de « Sol local », ensemble dans « Prochain brassin »', () => {
    const p = plan(NOTE_1280);
    expect(p.lignes.length).toBe(3);
    expect(p.carnets).toBe(2);
    expect(p.decompte).toBe('3 lignes · 2 carnets');
    const ou = (mot: RegExp) => p.lignes.find(l => mot.test(l.ligne.texte))!.titre;
    expect(ou(/levure/)).toBe('Prochain brassin');
    expect(ou(/brassage/)).toBe('Prochain brassin');
    expect(ou(/Sol local/)).toBe('Sol local');
    for (const l of p.lignes) expect(l.titre).not.toBe(NOTE_1280);
  });
  it('note 390 sur une ligne : découpée en 3 phrases ; « tient 80 °C » va au carnet de la hotte, jamais à un bac ; aucun titre = la note', () => {
    expect(decouper(NOTE_390)).toEqual(['Pour le bac : 2 bacs de lavage', 'Pour la hotte : tient 80 °C', 'Pour la pompe : 1 800 m³/h']);
    const p = plan(NOTE_390);
    expect(p.lignes.length).toBe(3);
    const hotte = p.lignes.find(l => /80/.test(l.ligne.texte))!;
    expect(hotte.carnetId).toBe('ZZ-CARNET-VENTILATION');
    expect(p.lignes.find(l => /pompe/i.test(l.ligne.texte))!.titre).toBe('Pompe');
    for (const l of p.lignes) expect(l.titre).not.toMatch(/Pour le bac|1 800/);
    for (const t of p.neufs) expect(t.length).toBeLessThan(40);
    expect(p.lignes.find(l => /bac/.test(l.ligne.texte))!.carnetId).toBe('ZZ-CARNET-EVIER');
    expect(new Set(p.lignes.map(l => l.titre)).size).toBe(p.carnets);
  });
  it('la note de la fixture : l’évier (« …, jeudi ») dans Évier inox, la hotte dans Ventilation ; la gaine, sans mot commun, dans « Gaine alu », jamais la note en titre', () => {
    const p = plan(NOTE_VRAC_BANC);
    const ou = (mot: RegExp) => p.lignes.find(l => mot.test(l.ligne.texte))!;
    expect(ou(/ferblantier/).carnetId).toBe('ZZ-CARNET-EVIER');
    expect(ou(/hotte/).carnetId).toBe('ZZ-CARNET-VENTILATION');
    expect(p.neufs).toEqual(['Gaine alu']);
    expect(p.carnets).toBe(3);
  });
  it('une phrase avec « Fr. 189,90 » ou « env. 30 L » n’est pas découpée', () => {
    expect(decouper('Ventilateur Fr. 189,90 chez Exemple')).toHaveLength(1);
    expect(decouper('Un fût env. 30 L couché. Il doit entrer dans le bac')).toHaveLength(1);
  });
  it('de bout en bout, depuis la liste : pendant « ✻ L’IA découpe votre note : 3 lignes, 2 carnets », après « ✓ 3 lignes rangées dans 2 carnets », « Texte d’origine »', async () => {
    const { magasin, champ, carnets } = monter({ delai: 300 });
    const n0 = carnets().length;
    taper(champ, NOTE_1280);
    expect(document.querySelector('.cn-vrac')?.textContent).toMatch(/3 lignes, 2 carnets/);
    await soumettre(champ);
    await attendre(40);
    expect(document.querySelector('.cn-vrac')!.textContent).toContain('L\'IA découpe votre note : 3 lignes, 2 carnets');
    await attendre(500);
    const apres = document.querySelector('.cn-vrac-apres')!;
    expect(apres.textContent).toContain('3 lignes rangées dans 2 carnets');
    expect(apres.querySelector('details.cn-origine summary')?.textContent).toContain('Texte d\'origine');
    const neufs = carnets().filter(c => !fixtureCarnets().some(f => (f as { id: string }).id === c.id));
    expect(carnets().length).toBe(n0 + 2);
    expect(neufs.map(c => c.title).sort()).toEqual(['Prochain brassin', 'Sol local']);
    const brassin = neufs.find(c => c.title === 'Prochain brassin')!;
    expect(brassin.carnet.notes.map(n => n.texte).join(' | ')).toMatch(/levure/);
    expect(neufs.find(c => c.title === 'Sol local')!.carnet.notes.map(n => n.texte).join(' ')).not.toMatch(/levure|brassage/i);
    /* la carte de « Sol local » cite sa ligne, jamais la note entière */
    expect(neufs.find(c => c.title === 'Sol local')!.carnet.phrase).toBe('Sol local : 2 bacs');
    expect(brassin.carnet.phrase).toMatch(/levure/);
    /* après (g5:v01-16) : la puce dit le carnet seul */
    const puces = [...apres.querySelectorAll('label.cn-puce > span:first-child')].map(e => e.textContent);
    expect(puces.sort()).toEqual(['Prochain brassin', 'Prochain brassin', 'Sol local']);
    const msg = lireMessages(magasin.lire()).find(m => m.carnetMessage.texte === NOTE_1280)!;
    expect(new Set(msg.carnetMessage.effets.filter(e => e.cible !== 'carnet').map(e => e.carnetId)).size).toBe(2);
  });
  it('de bout en bout, la note 390 sur une ligne : pas « Carnet créé », mais la découpe', async () => {
    const { champ } = monter({ delai: 40 });
    taper(champ, NOTE_390);
    expect(document.querySelector('.cn-vrac')?.textContent).toMatch(/3 lignes/);
    await soumettre(champ);
    await attendre(300);
    expect(document.querySelector('.cn-vrac-apres')?.textContent).toMatch(/3 lignes rangées dans \d carnets/);
    expect(document.body.textContent).not.toContain('Carnet créé');
  });
});

describe('2 · n° 2 : le type annoncé pendant est celui qui s’applique', () => {
  it('« Ajoute : 2 sachets de levure » est un achat, pendant (sorteVrac) comme après (IA simulée)', () => {
    const l = analyserTexte(NOTE_1280).find(x => /levure/.test(x.texte))!;
    expect(l.genre).toBe('a-acheter');
    expect(sorteVrac(l)).toBe('achat');
    const ctx = contexteModele(NOTE_1280, new Date('2026-11-18'), null, [], []);
    const r = reponseSimulee(ctx)!;
    expect(r.lignes.find(x => /levure/i.test(String(x.texte)))!.genre).toBe('a-acheter');
  });
  it('de bout en bout : la note en carnet porte le type annoncé, 1 achat et 2 notes, jamais 3 achats', async () => {
    const { champ, carnets } = monter({ delai: 40 });
    taper(champ, NOTE_1280);
    const pendant = [...document.querySelectorAll('.cn-vrac-ligne .cn-genre')].map(e => e.textContent?.trim());
    await soumettre(champ);
    await attendre(300);
    const apres = [...document.querySelectorAll('.cn-vrac-apres .cn-vrac-ligne .cn-genre')]
      .map(e => (e.textContent ?? '').replace(e.querySelector('select')?.textContent ?? '', '').replace('▾', '').trim());
    expect(apres.sort()).toEqual(pendant.sort());
    const genres = carnets().flatMap(c => c.carnet.notes.filter(n => /levure|bacs|brassage/i.test(n.texte)).map(n => n.genre));
    expect(genres.filter(g => g === 'a-acheter')).toHaveLength(1);
  });
});

describe('3 · n° 3 : sa valeur remplace, sur le même axe, le critère proposé par l’IA, en tête, avec Annuler', () => {
  it('Évier : « fond de bac 38 cm minimum » prend la place de « assez profond pour un fût » (IA, fond de bac en cm), en tête ; Annuler le rend', async () => {
    const { champ, carnets } = monter({ ouvrir: ID_EVIER, delai: 30 });
    const evier = () => carnets().find(c => c.id === ID_EVIER)!;
    expect(evier().carnet.criteres.some(k => k.texte === 'assez profond pour un fût')).toBe(true);
    taper(champ, 'fond de bac 38 cm minimum');
    await soumettre(champ);
    await attendre(200);
    const k = evier().carnet.criteres;
    expect(k[0].texte).toMatch(/38 cm/);
    expect(k.some(x => x.texte === 'assez profond pour un fût')).toBe(false);
    expect(k.filter(x => x.caracteristique?.nom === 'fond de bac' || /\bcm\b/.test(x.texte))).toHaveLength(1);
    const annuler = [...document.querySelectorAll('.cn-bandeau button')].find(b => /Annuler/.test(b.textContent ?? '')) as HTMLElement;
    await act(async () => { fireEvent.click(annuler); });
    expect(evier().carnet.criteres.some(x => x.texte === 'assez profond pour un fût')).toBe(true);
    expect(evier().carnet.criteres.some(x => /38 cm/.test(x.texte))).toBe(false);
  });
  it('l’IA simulée n’ajoute pas un 2e critère du même axe que le sien', () => {
    const cs = lireCarnets(fixtureCarnets() as never);
    const ctx = contexteModele('fond de bac 38 cm minimum', new Date('2026-11-18'), ID_EVIER, pourIA(cs), []);
    const k = reponseSimulee(ctx)!.lignes.filter(l => l.sorte === 'critere' && !l.propose);
    expect(k).toHaveLength(1);
  });
});

describe('4 · n° 4 et 5 : Retenir, Pourquoi, Comparer ouvrent leur écran', () => {
  it('« Retenir … » dans Ventilation ouvre Choisir (g05-11) sur cette façon ; « Comparer » ouvre Comparer', async () => {
    const { vue } = monter({ ouvrir: ID_VENTILATION });
    const retenir = [...document.querySelectorAll('button')].find(b => /^Retenir /.test(b.textContent ?? ''));
    expect(retenir).toBeTruthy();
    await act(async () => { fireEvent.click(retenir!); });
    expect(vue.container.querySelector('[data-vue]')?.getAttribute('data-vue')).toBe('choisir');
    cleanup();
    const v2 = monter({ ouvrir: ID_VENTILATION }).vue;
    const comparer = [...document.querySelectorAll('button')].find(b => /Comparer/.test(b.textContent ?? ''))!;
    await act(async () => { fireEvent.click(comparer); });
    expect(v2.container.querySelector('[data-vue]')?.getAttribute('data-vue')).toBe('comparer');
  });
  it('le choix revu du frigo : « Pourquoi › » ouvre la feuille du choix', async () => {
    const { vue } = monter({ ouvrir: ID_FRIGO });
    const pourquoi = [...document.querySelectorAll('button')].find(b => /Pourquoi/.test(b.textContent ?? ''));
    expect(pourquoi).toBeTruthy();
    await act(async () => { fireEvent.click(pourquoi!); });
    expect(vue.container.querySelector('[data-vue]')?.getAttribute('data-vue')).toBe('choisir');
  });
});

describe('5 · n° 9 (D-35) : un carnet neuf propose les caractéristiques de sa catégorie, en puces d’un toucher', () => {
  it('« un frigo pour garder les fûts au froid » : puces proposées (exemple), un toucher en range une ; aucun fournisseur inventé', async () => {
    const { champ, magasin, carnets } = monter({ items: [], delai: 20 });
    taper(champ, 'un frigo pour garder les fûts au froid');
    await soumettre(champ);
    await attendre(200);
    const neuf = carnets()[0];
    const msg = lireMessages(magasin.lire())[0];
    const props = msg.carnetMessage.propositions ?? [];
    expect(props.length).toBeGreaterThan(0);
    expect(props.every(p => p.carnetId === neuf.id && p.origine === 'exemple')).toBe(true);
    expect(neuf.carnet.articles.some(a => a.vendeur)).toBe(false);
    /* le bandeau « Carnet créé » parti (retour à la liste puis le carnet), les puces sont là */
    const retour = [...document.querySelectorAll('button')].find(b => /Carnets/.test(b.textContent ?? ''))!;
    await act(async () => { fireEvent.click(retour); });
    const carte = [...document.querySelectorAll('.cn-page button, .cn-page [role=button]')].find(b => /frigo/i.test(b.textContent ?? '')) as HTMLElement;
    await act(async () => { fireEvent.click(carte); });
    const groupe = document.querySelector('[aria-label="Proposé par l’IA"]')!;
    expect(groupe.textContent).toMatch(/Comparer sur/);
    expect(groupe.textContent).toContain('exemple');
    const n0 = carnets()[0].carnet.criteres.length;
    await act(async () => { fireEvent.click(groupe.querySelector('button.cn-puce-ia')!); });
    expect(carnets()[0].carnet.criteres.length).toBe(n0 + 1);
  });
});

describe('6 · n° 11 (D-137, G20) : la promesse du lien est tenue ; une 2e page fait naître le tableau', () => {
  it('hors ligne, le cadre ne promet pas « se lisent à l’envoi »', () => {
    const { champ } = monter({ ouvrir: ID_VENTILATION, horsLigne: true });
    taper(champ, 'https://exemple.invalid/hotte-2');
    expect(document.body.textContent).not.toContain('se lisent à l\'envoi');
    expect(document.body.textContent).toContain('page non lue');
  });
  it('les adresses du banc se lisent par famille : hotte-inox-80c, hotte-2 (2e page) ; /v5 reste illisible', () => {
    expect(pageSimulee('https://exemple.invalid/hotte-inox-80c').nom).toBe('Hotte inox 140 cm + extracteur');
    expect(pageSimulee('https://exemple.invalid/hotte-2')).toMatchObject({ statut: 'lue', nom: 'Hotte murale 100 cm' });
    expect(pageSimulee('https://exemple.invalid/pompe-2')).toMatchObject({ statut: 'lue', nom: 'Pompe magnétique 12 V' });
    expect(pageSimulee('https://exemple.invalid/v5').statut).toBe('illisible');
  });
  it('G20 : le carnet né d’un lien de pompe reçoit le 2e lien ; le tableau naît', async () => {
    const { champ, carnets } = monter({ items: [], delai: 10 });
    taper(champ, 'https://exemple.invalid/pompe-inox');
    await soumettre(champ);
    await attendre(600);
    const c = carnets()[0];
    await act(async () => { fireEvent.click([...document.querySelectorAll('.cn-page button, .cn-page [role=button]')].find(b => /Pompe/.test(b.textContent ?? '')) as HTMLElement ?? document.body); });
    taper(champ, 'https://exemple.invalid/pompe-2');
    await soumettre(champ);
    await attendre(600);
    const d = carnets().find(x => x.id === c.id)!;
    expect(d.carnet.articles.length).toBe(2);
    expect(tableauDe(d)).not.toBeNull();
  });
});

describe('7 · n° 12 (R26, G20) : le bandeau d’un lien rangé dit son rang', () => {
  it('rangDuLien : « 1re de sa façon, devant … » ou « 2e de sa façon, après … », lu sur tableau et placesDe', () => {
    const v = lireCarnets(fixtureCarnets() as never).find(c => c.id === ID_VENTILATION)!;
    const t = tableauDe(v)!;
    const enLice = t.lignes.filter(l => l.rang !== null);
    const dits = enLice.map(l => rangDuLien(t, l.articleId, v.carnet.articles));
    expect(dits.some(d => /^1re de sa façon, devant /.test(d ?? ''))).toBe(true);
    expect(dits.some(d => /^2e de sa façon, après /.test(d ?? ''))).toBe(true);
    expect(texteBandeau({ sorte: 'article', faconNom: 'Hotte + extracteur', rang: '1re de sa façon, devant Hotte inox 120 cm' }))
      .toBe('✓ Article rangé ici, dans Hotte + extracteur · 1re de sa façon, devant Hotte inox 120 cm');
    render(<LigneRangee sorte="article" rang="1re de sa façon, devant Hotte inox 120 cm" onAnnuler={() => {}}><p>carte</p></LigneRangee>);
    expect(document.querySelector('.cn-bandeau')!.textContent).toContain('1re de sa façon, devant Hotte inox 120 cm');
  });
});

describe('8 · n° 13 (D-7, D-13, R17, v06-10) : un lien collé depuis la liste ouvre le carnet du besoin', () => {
  it('« …/pompe-inox » : carnet « Pompe pour le moût », un critère proposé par l’IA, l’article « Pompe de transfert inox »', async () => {
    const { champ, carnets } = monter({ delai: 10 });
    const n0 = carnets().length;
    taper(champ, 'https://exemple.invalid/pompe-inox');
    await soumettre(champ);
    await attendre(600);
    expect(carnets().length).toBe(n0 + 1);
    const c = carnets().find(x => /Pompe/.test(x.title))!;
    expect(c.title).toBe('Pompe pour le moût');
    expect(c.carnet.criteres.map(k => k.texte)).toContain('Supporter le moût chaud');
    expect(c.carnet.criteres.find(k => k.texte === 'Supporter le moût chaud')!.source).toBe('ia');
    expect(c.carnet.articles[0].nom).toBe('Pompe de transfert inox');
  });
});

describe('9 · n° 14 (g5:v03-8, D-38) : sa phrase citée une seule fois entre Bandeau et LigneRangee', () => {
  it('LigneRangee : le bandeau « Rangé ici » ne cite pas la phrase ; la ligne la cite une fois', () => {
    render(<LigneRangee phrase="fond de bac 38 cm minimum" rangeSur="fond de bac, 38 cm au moins" onAnnuler={() => {}}><p>Fond de bac 38 cm minimum</p></LigneRangee>);
    const cites = [...document.querySelectorAll('.cn-cite')].filter(e => /fond de bac 38 cm minimum/.test(e.textContent ?? ''));
    expect(cites).toHaveLength(1);
    expect(document.querySelector('.cn-bandeau')!.textContent).not.toMatch(/fond de bac 38/);
  });
});

describe('10 · n° 24 (D-113, D-142) : hors ligne, un message court ; au retour du réseau, « Ranger maintenant »', () => {
  it('l’avis ne dit plus « ne le reprendra pas » ; en ligne, un toucher passe le message à l’IA', async () => {
    const o = monter({ ouvrir: ID_FRIGO, horsLigne: true, delai: 10 });
    taper(o.champ, 'filtre à air G4, 2 pièces');
    await soumettre(o.champ);
    await attendre(60);
    expect(document.body.textContent).toContain('Hors ligne : rangé sur l’appareil, tel quel');
    expect(document.body.textContent).not.toMatch(/ne le reprendra pas/);
    expect(document.body.textContent).not.toContain('Ranger maintenant');
    o.vue.rerender(<CarnetsVue {...o.props} horsLigne={false} ouvrir={{ id: ID_FRIGO, at: 1 }} />);
    const bouton = [...document.querySelectorAll('button')].find(b => b.textContent === 'Ranger maintenant')!;
    expect(bouton).toBeTruthy();
    await act(async () => { fireEvent.click(bouton); });
    await attendre(120);
    const msg = lireMessages(o.magasin.lire()).find(m => m.carnetMessage.texte === 'filtre à air G4, 2 pièces')!;
    expect(msg.carnetMessage.rangement).toBe('simulee');
    expect([...document.querySelectorAll('button')].some(b => b.textContent === 'Ranger maintenant')).toBe(false);
  });
});

describe('11 · n° 26 : coupe sur un mot, avec « … », partout', () => {
  it('titreCourt et titreQuiTient ne coupent jamais un mot ; la marque « ZZ TEST — » reste entière', () => {
    expect(titreCourt('Pompe de transfert inox', 12)).toBe('Pompe…');
    expect(titreCourt('ZZ TEST — Pompe de transfert inox', 12)).toBe('ZZ TEST — Pompe…');
    const huit = (s: string) => s.length * 8;
    for (const titre of ['Pompe de transfert inox', 'Frigo de garde pour fûts', 'ZZ TEST — Ventilation de la salle de brassage']) {
      for (const place of [120, 160, 200, 260]) {
        const t = titreQuiTient(titre, place, huit);
        const mots = t.replace(/…$/, '').split(' ');
        expect(titre.split(' ').slice(0, mots.length)).toEqual(mots);
        if (t !== titre) expect(t.endsWith('…')).toBe(true);
      }
    }
  });
});

describe('12 · n° 29 : les puces « Va dans » tiennent sur un rang', () => {
  it('la règle CSS garde un rang ; la puce porte le titre court, le titre entier en aria-label', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/ui/carnets/carnets-fil.css'), 'utf8');
    expect(css).toMatch(/\.cn-champ-zone \.cn-vadans \{[^}]*flex-wrap: nowrap/);
    render(<ChampCarnet valeur="x" onChange={() => {}} onEnvoyer={() => {}} vaDansCarnet={{ options: [{ id: 'a', libelle: 'ZZ TEST — Ventilation de la salle de brassage' }, { id: 'b', libelle: 'Ici' }], choisi: 'a', onChoisir: () => {} }} />);
    const puce = document.querySelector('.cnf-vadans-carnet .cn-puce')!;
    expect(puce.getAttribute('aria-label')).toBe('ZZ TEST — Ventilation de la salle de brassage');
    expect(puce.textContent).toBe('ZZ TEST — Ventilation…');
  });
});

describe('13 · n° 35 : 0 et 1 carnet ont leur phrase', () => {
  it('aucunCarnetNEnParle, et le cadre « Créer · pendant » sur une liste vide', () => {
    expect(aucunCarnetNEnParle(0)).toBe('Aucun carnet encore');
    expect(aucunCarnetNEnParle(1)).toBe('Votre seul carnet n’en parle pas');
    expect(aucunCarnetNEnParle(3)).toBe('Aucun de vos 3 carnets n’en parle');
    const { champ } = monter({ items: [] });
    taper(champ, 'un moulin à malt');
    expect(document.body.textContent).not.toMatch(/vos 0 carnets/);
    expect(document.body.textContent).toContain('Aucun carnet encore');
  });
});

describe('14 · n° 31 : carnetProche ne propose pas un carnet d’un autre besoin', () => {
  it('Ventilation de la salle : jamais « Ventilation de la cave de garde » ; une 2e idée du même besoin, oui ; l’extracteur, jamais', () => {
    const FG = lireCarnets(fixtureCarnets({ g35: true }) as never);
    const salle = FG.find(c => c.id === ID_VENTILATION)!;
    const cave = FG.find(c => c.id === ID_VENTILATION_CAVE)!;
    expect(cave.title).toMatch(/cave de garde/);
    expect(carnetProche(salle, FG)).toBeNull();
    expect(carnetProche(cave, FG)).toBeNull();
    const meme = { ...cave, id: 'ZZ-2E-IDEE', title: 'ZZ TEST — Ventilation de la salle, 2e idée' } as typeof cave;
    expect(carnetProche(salle, [...FG, meme])?.carnetId).toBe('ZZ-2E-IDEE');
    expect(carnetProche(salle, [...FG, meme])?.carnetId).not.toBe('ZZ-CARNET-EXTRACTION');
  });
});

describe('15 · décisions du pilote', () => {
  it('prix en CHF sous toutes ses formes ; EUR seulement s’il est écrit', () => {
    for (const t of ['moteur 189,90 CHF', 'CHF 189.90', 'Fr. 189,90', '189,90.–', '189.90 Fr.']) {
      expect(prixTousDe(t)).toEqual([expect.objectContaining({ centimes: 18990, devise: 'CHF' })]);
    }
    expect(prixTousDe('189,90 €')[0]).toMatchObject({ centimes: 18990, devise: 'EUR' });
  });
  it('Garder à part, de bout en bout : la puce à 600 ms, le toucher la retire, l’envoi garde la note séparée, la phrase ne repropose pas', async () => {
    const { champ, magasin, carnets } = monter({ ouvrir: ID_VENTILATION, delai: 20 });
    taper(champ, PHRASE_DOUBLON);
    await attendre(600);
    const garder = [...document.querySelectorAll('button')].find(b => b.textContent === 'Garder à part')!;
    expect(garder).toBeTruthy();
    await act(async () => { fireEvent.click(garder); });
    expect([...document.querySelectorAll('button')].some(b => b.textContent === 'Garder à part')).toBe(false);
    await soumettre(champ);
    await attendre(200);
    const msg = lireMessages(magasin.lire()).find(m => m.carnetMessage.texte === PHRASE_DOUBLON)!;
    expect(msg.carnetMessage.gardeAPart).toBe(true);
    const notes = carnets().find(c => c.id === ID_VENTILATION)!.carnet.notes;
    expect(notes.some(n => n.fusionDe)).toBe(false);
    expect(notes.filter(n => /ferblantier/.test(n.texte)).length).toBeGreaterThanOrEqual(2);
    taper(champ, PHRASE_DOUBLON);
    await attendre(600);
    expect([...document.querySelectorAll('button')].some(b => b.textContent === 'Garder à part')).toBe(false);
    expect(document.body.textContent).not.toMatch(/seront fusionnées/);
  });
  it('Annuler une suppression de note : la note revient, « Note supprimée » part et ne revient pas', async () => {
    const { champ, carnets } = monter({ ouvrir: ID_VENTILATION });
    const n0 = carnets().find(c => c.id === ID_VENTILATION)!.carnet.notes.length;
    const actions = document.querySelector('button[aria-label^="Note : "]') as HTMLElement;
    await act(async () => { fireEvent.click(actions); });
    const supprimer = [...document.querySelectorAll('[role="menuitem"]')].find(b => /Supprimer/.test(b.textContent ?? '')) as HTMLElement;
    await act(async () => { fireEvent.click(supprimer); });
    expect(document.body.textContent).toContain('Note supprimée');
    const annuler = [...document.querySelectorAll('[data-sorte="note-supprimee"] button')][0] as HTMLElement;
    await act(async () => { fireEvent.click(annuler); });
    expect(carnets().find(c => c.id === ID_VENTILATION)!.carnet.notes.length).toBe(n0);
    expect(document.body.textContent).not.toContain('Note supprimée');
    taper(champ, 'x');
    taper(champ, '');
    await attendre(30);
    expect(document.body.textContent).not.toContain('Note supprimée');
  });
  it('le titre stocké, « ZZ TEST — » compris, passe tel quel aux écrans ; CarnetsVue n’a plus titreSansBanc', async () => {
    const src = readFileSync(resolve(process.cwd(), 'src/ui/carnets/CarnetsVue.tsx'), 'utf8');
    expect(src).not.toMatch(/titreSansBanc/);
    const { vue } = monter({ ouvrir: ID_VENTILATION });
    const comparer = [...document.querySelectorAll('button')].find(b => /Comparer/.test(b.textContent ?? ''))!;
    await act(async () => { fireEvent.click(comparer); });
    expect(vue.container.textContent).toContain('ZZ TEST — Ventilation');
  });
  it('la source du critère : depuisIA la passe, le cadre la lit (sourceDuCritere)', () => {
    const l = depuisIA({ sorte: 'critere', texte: 'Débit', origine: 'exemple', source: 'ia', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } } as never, { carnetId: 'c' });
    expect((l as { source?: string }).source).toBe('ia');
    const { container, rerender } = render(<CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Ce qui compte', texte: 'Débit', origine: 'ia', source: 'ia' }} onAnnuler={() => {}} />);
    expect(container.textContent).toContain('proposé par l’IA');
    rerender(<CadreArrivee cadre={{ sorte: 'texte', rubrique: 'Ce qui compte', texte: 'Débit', origine: 'ia', source: 'phrase' }} onAnnuler={() => {}} />);
    expect(container.textContent).toContain('tiré de votre phrase');
  });
});
