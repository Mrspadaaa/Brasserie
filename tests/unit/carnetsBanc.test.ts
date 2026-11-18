/**
 * @vitest-environment jsdom
 * Banc du carnet (CRITIQUE-1, lot L3) : la fixture, la lecture simulée d'un lien et les paramètres d'entrée du banc ; et (corr. 2, L3)
 * le + volant de l'app monté au banc. Tout est simulé et marqué « exemple » ; aucun réseau.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { CarnetsPreview } from '../../src/design/CarnetsPreview';
import {
  ARTICLES_REDUITS, fixtureCarnets, fixturePlanRealise, fixturePlans, ID_EMBOUTEILLAGE, ID_FRIGO, ID_VENTILATION, PHRASE_DOUBLON,
  PHRASE_TITRE_PROPOSE, PREFIXE_BANC, TITRE_PROPOSE_VENTILATION
} from '../../src/domain/carnets/fixture';
import {
  cleUrl, DELAI_LECTURE_BANC, LIEN_COLLER_BANC, LIEN_ILLISIBLE_BANC, lireLienSimule, PAGES_BANC, pageSimulee, reponseSimulee
} from '../../src/domain/carnets/iaSimulee';
import { doublonsDe } from '../../src/domain/carnets/doublons';
import { tableau } from '../../src/domain/carnets/comparer';
import { lireReponse, liensDuTexte } from '../../src/domain/carnets/ia';
import { appelsBanc, departBanc, lireParametresBanc } from '../../src/design/CarnetsPreview';
import type { CarnetDoc, MessageDoc } from '../../src/domain/carnets/modele';
import type { ContexteRangerCarnet } from '../../functions/src/carnetIA';

const carnet = (id: string, articles?: number) => fixtureCarnets({ articles }).find(d => d.id === id) as unknown as CarnetDoc;
const messages = () => fixtureCarnets().filter(d => d.type === 'carnet-message') as unknown as MessageDoc[];
const ctxDe = (texte: string, depuis: string, pages: ContexteRangerCarnet['pages'] = []): ContexteRangerCarnet => ({
  texte, depuis, maintenant: '2026-11-17T08:00:00.000Z',
  carnets: (fixtureCarnets().filter(d => d.type === 'carnet') as unknown as CarnetDoc[]).map(c => ({
    id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons,
    articles: c.carnet.articles.map(a => ({ nom: a.nom, valeurs: a.valeurs })), notes: c.carnet.notes.map(n => ({ id: n.id, texte: n.texte }))
  })),
  pages
}) as unknown as ContexteRangerCarnet;

afterEach(() => { vi.useRealTimers(); });

describe('P4 — lecture simulée d’un lien (squelette g5:v03-10, carte g5:v06-10)', () => {
  it('prend 1,5 s par défaut : le squelette a le temps de se voir', async () => {
    vi.useFakeTimers();
    let lue = false;
    const p = lireLienSimule('https://exemple.invalid/hotte-140').then(page => { lue = true; return page; });
    await vi.advanceTimersByTimeAsync(DELAI_LECTURE_BANC - 1);
    expect(lue).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await p).statut).toBe('lue');
    expect(DELAI_LECTURE_BANC).toBe(1500);
  });

  it('rend tout de suite avec delaiMs 0 (tests), et s’arrête au ✕', async () => {
    expect((await lireLienSimule('https://exemple.invalid/hotte-140', { delaiMs: 0 })).nom).toBe('Hotte inox 140 cm + extracteur');
    const ctrl = new AbortController();
    const p = lireLienSimule('https://exemple.invalid/hotte-140', { delaiMs: 1000, signal: ctrl.signal });
    ctrl.abort(new DOMException('annulé', 'AbortError'));
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('les appels du banc lisent lentement (1,5 s ; 4 s en &ia=lent)', async () => {
    vi.useFakeTimers();
    let lue = false;
    void appelsBanc('normal').lire('https://exemple.invalid/v1', new AbortController().signal).then(() => { lue = true; });
    await vi.advanceTimersByTimeAsync(1499);
    expect(lue).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(lue).toBe(true);
    let lente = false;
    void appelsBanc('lent').lire('https://exemple.invalid/v1', new AbortController().signal).then(() => { lente = true; });
    await vi.advanceTimersByTimeAsync(3999);
    expect(lente).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(lente).toBe(true);
  });

  it('la table couvre chaque lien de la fixture et la puce « Coller : … » ; seul v5 reste illisible', () => {
    const urls = (fixtureCarnets().filter(d => d.type === 'carnet') as unknown as CarnetDoc[]).flatMap(c => c.carnet.articles.map(a => a.url!)).filter(Boolean);
    expect(urls.length).toBeGreaterThan(15);
    const illisibles = urls.filter(u => pageSimulee(u).statut !== 'lue');
    expect(illisibles).toEqual([LIEN_ILLISIBLE_BANC]);
    expect(pageSimulee(LIEN_COLLER_BANC)).toMatchObject({ statut: 'lue', nom: 'Échangeur à plaques 30 plaques', domaine: 'exemple.invalid' });
    for (const cle of Object.keys(PAGES_BANC)) expect(pageSimulee(`https://${cle}`).statut).toBe('lue');
    // Une page de la fixture rend ce que l'article porte, rien de plus (un booléen devient « oui » / « non »).
    expect(pageSimulee('https://exemple.invalid/v2/')).toMatchObject({ nom: 'Hotte murale 100 cm', prix: 1450, devise: 'CHF', vendeur: 'Gastro Lüftung' });
    expect(pageSimulee('https://exemple.invalid/v2').valeurs).toEqual(expect.arrayContaining([{ nom: 'tient 80 °C', valeur: 'oui' }, { nom: 'débit', valeur: '1200', unite: 'm³/h' }]));
    expect(pageSimulee('https://exemple.invalid/v2').dispo).toBeUndefined(); // « délai 4 semaines » n'est ni en stock ni en rupture
  });

  it('une adresse inconnue n’est jamais inventée ; les domaines déjà simulés restent lus', () => {
    expect(pageSimulee('https://exemple.test/ventilation').statut).toBe('illisible');
    expect(pageSimulee('https://exemple.invalid/inconnue').statut).toBe('illisible');
    expect(pageSimulee('pas une adresse').statut).toBe('refusee');
    expect(pageSimulee('https://pompe-inox.ch/p/12')).toMatchObject({ statut: 'lue', prix: 690 });
    expect(cleUrl('https://www.exemple.invalid/hotte-140/?ref=1')).toBe('exemple.invalid/hotte-140');
  });

  it('hotte-140 collée dans Ventilation : carte complète, « tient 80 °C : oui », sans veille allumée (R31)', () => {
    const url = 'https://exemple.invalid/hotte-140';
    const page = pageSimulee(url, 1);
    const texte = `celle-ci ${url}`;
    const brut = reponseSimulee(ctxDe(texte, ID_VENTILATION, [page]));
    const lignes = lireReponse(brut, { texte, carnets: ctxDe(texte, ID_VENTILATION).carnets as never, depuis: ID_VENTILATION, pages: [page], origine: 'exemple' })!;
    const art = lignes.find(l => l.sorte === 'article')!;
    expect(art).toMatchObject({ carnetId: ID_VENTILATION, url, prixCentimes: 198000, prixSource: 'page', vendeur: 'Inox Exemple' });
    expect(art.page?.valeurs).toEqual(expect.arrayContaining([{ nom: 'tient 80 °C', valeur: 'oui' }, { nom: 'débit', valeur: '2000', unite: 'm³/h' }]));
    expect(JSON.stringify(lignes)).not.toContain('veille');
    // Le critère « tient 80 °C » de Ventilation est un oui-non : la page donne « oui ».
    expect(carnet(ID_VENTILATION).carnet.criteres.find(k => k.caracteristique?.nom === 'tient 80 °C')?.caracteristique?.sens).toBe('oui-non');
  });

  it('chaque lien de la puce et de la liste reste dans le texte qui le porte', () => {
    expect(liensDuTexte(LIEN_COLLER_BANC)).toEqual([LIEN_COLLER_BANC]);
    expect(liensDuTexte('https://exemple.invalid/pompe-inox')).toEqual(['https://exemple.invalid/pompe-inox']);
  });
});

describe('P6 — écartés et carnet réduit à 1 ou 2 articles', () => {
  it('Ventilation a un article écarté, gardé à la fin avec sa raison (D-52, R06)', () => {
    const t = tableau(carnet(ID_VENTILATION).carnet)!;
    const derniere = t.lignes[t.lignes.length - 1];
    expect(derniere.articleId).toBe('ZZ-V-A6');
    expect(derniere.rang).toBeNull();
    expect(derniere.ecarte?.raison).toBe('Ventilateur de plafond écartée : brasse la buée sans la sortir');
    expect(t.lignes.filter(l => l.ecarte)).toHaveLength(1);
  });

  it('&articles=1 : un article, pas de tableau ; &articles=2 : le tableau naît (G20)', () => {
    const un = carnet(ID_VENTILATION, 1).carnet;
    expect(un.articles.map(a => a.id)).toEqual([ARTICLES_REDUITS[0]]);
    expect(tableau(un)).toBeNull();
    const deux = carnet(ID_VENTILATION, 2).carnet;
    expect(deux.articles.map(a => a.id)).toEqual([...ARTICLES_REDUITS]);
    expect(deux.facons.some(f => f.etat === 'ecartee')).toBe(false);
    const t = tableau(deux)!;
    expect(t.lignes).toHaveLength(2);
    expect(t.lignes.every(l => !l.ecarte)).toBe(true);
    expect(new Set(deux.articles.map(a => a.faconId)).size).toBe(2);
    // Le reste de la fixture ne bouge pas.
    expect(fixtureCarnets({ articles: 2 }).length).toBe(fixtureCarnets().length);
    expect(carnet(ID_VENTILATION, 3).carnet.articles).toHaveLength(6);
  });
});

describe('P7, P8, P15 — notes, titre proposé, doublon', () => {
  it('Ventilation porte au moins 2 notes, chacune liée à son message', () => {
    const v = carnet(ID_VENTILATION).carnet;
    expect(v.notes.length).toBeGreaterThanOrEqual(2);
    const ids = new Set(messages().map(m => m.id));
    for (const n of v.notes) expect(ids.has(n.messageId!)).toBe(true);
  });

  it('un message porte un titre proposé non appliqué sur Ventilation, avec sa phrase (G29, R46)', () => {
    const m = messages().find(x => x.carnetMessage.titrePropose?.carnetId === ID_VENTILATION && !x.carnetMessage.titrePropose.applique)!;
    expect(m.carnetMessage.texte).toBe(PHRASE_TITRE_PROPOSE);
    expect(m.carnetMessage.titrePropose!.titre).toBe(TITRE_PROPOSE_VENTILATION);
    expect(TITRE_PROPOSE_VENTILATION.startsWith(PREFIXE_BANC)).toBe(true);
    expect(TITRE_PROPOSE_VENTILATION.length).toBeLessThanOrEqual(60 + PREFIXE_BANC.length);
    expect(TITRE_PROPOSE_VENTILATION).not.toBe(carnet(ID_VENTILATION).title);
  });

  it('la phrase de doublon répète une note de Ventilation : doublons.ts et l’IA simulée la voient (G11)', () => {
    const v = carnet(ID_VENTILATION).carnet;
    expect(doublonsDe(PHRASE_DOUBLON, v.notes).map(d => d.noteId)).toEqual(['ZZ-V-N1']);
    const r = reponseSimulee(ctxDe(PHRASE_DOUBLON, ID_VENTILATION));
    expect(r?.lignes[0]).toMatchObject({ sorte: 'note', carnetId: ID_VENTILATION, doublonDe: 'ZZ-V-N1' });
  });

  it('aucune paire de notes de la fixture n’est un doublon involontaire', () => {
    for (const c of fixtureCarnets().filter(d => d.type === 'carnet') as unknown as CarnetDoc[]) {
      for (const n of c.carnet.notes) expect(doublonsDe(n.texte, c.carnet.notes.filter(x => x.id !== n.id))).toEqual([]);
    }
  });
});

describe('P7, P17 — plans et paramètres du banc', () => {
  it('un plan à venir (Frigo) et, en &realise=1, un plan réalisé (Embouteillage), chacun vers son carnet', () => {
    expect(fixturePlans().map(p => p.upgrade?.sourceCarnetId)).toEqual([ID_FRIGO]);
    const r = fixturePlanRealise();
    expect(r.plans.map(p => p.upgrade?.sourceCarnetId)).toEqual([ID_FRIGO, ID_EMBOUTEILLAGE]);
    expect(r.payments[0].amountCents).toBe(r.transactions[0].finance!.amountCents);
    for (const p of r.plans) expect(p.title.startsWith(PREFIXE_BANC)).toBe(true);
  });

  it.each([
    ['', { segment: 'carnets', realise: false }, undefined],
    ['?realise=1', { segment: 'realises', realise: true }, undefined],
    ['?lien-retient=a-venir', { segment: 'carnets', realise: false }, ID_FRIGO],
    ['?lien-retient=realise', { segment: 'carnets', realise: true }, ID_EMBOUTEILLAGE],
    ['?adr=1', { segment: 'carnets', realise: false }, ID_FRIGO],
    ['?articles=1', { segment: 'carnets', articles: 1 }, ID_VENTILATION],
    ['?articles=2&realise=1', { segment: 'carnets', articles: 2, realise: true }, ID_VENTILATION],
    ['?articles=7', { segment: 'carnets' }, undefined]
  ])('%s', (search, attendu, ouvrir) => {
    const p = lireParametresBanc(search);
    expect(p).toMatchObject(attendu);
    expect(p.ouvrir).toBe(ouvrir);
    if (!('articles' in attendu)) expect(p.articles).toBeUndefined();
  });

  it('departBanc : réduit Ventilation, garde le plan réalisé et l’Embouteillage envoyé', () => {
    const d = departBanc({ realise: true, articles: 2 });
    const v = d.items.find(x => x.id === ID_VENTILATION) as unknown as CarnetDoc;
    const e = d.items.find(x => x.id === ID_EMBOUTEILLAGE) as unknown as CarnetDoc;
    expect(v.carnet.articles).toHaveLength(2);
    expect(e.carnet.sortie?.planId).toBe('ZZ-PLAN-EMBOUTEILLAGE');
    expect(d.finances.plans).toHaveLength(2);
    expect(departBanc({ vide: true }).items).toEqual([]);
  });

  it('tout reste exemple : liens sur exemple.invalid, titres « ZZ TEST — », aucune relève de veille', () => {
    for (const c of fixtureCarnets().filter(d => d.type === 'carnet') as unknown as CarnetDoc[]) {
      expect(c.title.startsWith(PREFIXE_BANC)).toBe(true);
      for (const a of c.carnet.articles) {
        expect(a.origine).toBe('exemple');
        if (a.url) expect(new URL(a.url).hostname).toBe('exemple.invalid');
        expect(a.veille?.releveLe).toBeUndefined();
      }
    }
    for (const cle of Object.keys(PAGES_BANC)) expect(cle.startsWith('exemple.invalid/')).toBe(true);
  });
});

describe('d1280-5, m390-4b — le + volant de l’app est au banc (R28, p2:g05-1)', () => {
  afterEach(() => { cleanup(); history.replaceState(null, '', '/'); });

  it('le banc monte le + de l’app (FloatingActions, ancré à la barre d’onglets) et la barre d’onglets', async () => {
    history.replaceState(null, '', '/?preview=carnets');
    render(createElement(CarnetsPreview));
    const plus = await screen.findByRole('button', { name: 'Actions rapides' });
    expect(plus.closest('.floating-actions')?.getAttribute('data-floating-actions-anchor')).toBe('nav');
    expect(document.querySelector('.app-bottom-dock nav')).not.toBeNull();
  });

  it('sur Carnets, son menu dit « Sur Carnets · Nouvelle idée », qui met le focus dans le champ du bas', async () => {
    history.replaceState(null, '', '/?preview=carnets');
    render(createElement(CarnetsPreview));
    fireEvent.click(await screen.findByRole('button', { name: 'Actions rapides' }));
    const menu = screen.getByRole('menu', { name: 'Actions rapides' });
    expect(menu.textContent).toMatch(/Sur\s*Carnets/);
    const champ = screen.getByPlaceholderText('Une idée, un besoin…');
    expect(document.activeElement).not.toBe(champ);
    fireEvent.click(within(menu).getByRole('menuitem', { name: /Nouvelle idée/ }));
    await waitFor(() => expect(document.activeElement).toBe(champ));
  });
});
