// @vitest-environment jsdom
/**
 * Paquet 1 des gênants du carnet (18.11, tests en ligne 1 à 3). Règle D383 : le rangement de l'IA fait foi. Gemini n'est jamais
 * appelé : les réponses sont rejouées (journal du test en ligne 3, `en-ligne-3/journal-ia.md`, et `tests/fixtures/carnets/en-ligne-2`).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { creerCarnet, ranger } from '../../src/domain/carnets/operations';
import { lireReponse, sansAccents, type PageLue } from '../../src/domain/carnets/ia';
import { VignetteObjet } from '../../src/ui/carnets/pictos';
import { SupprimerCarnet } from '../../src/ui/carnets/SupprimerCarnet';
import { choixBloque } from '../../src/ui/carnets/Comparer';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

const F2 = JSON.parse(readFileSync(join(__dirname, '../fixtures/carnets/en-ligne-2/reponses.json'), 'utf8')) as { envois: { n: number; texte: string; reponse: { lignes: Record<string, unknown>[] } }[] };
const VRAC = F2.envois.find(e => e.n === 1)!;
const TUYAU = F2.envois.find(e => e.n === 7)!;
const REFRACTO = 'il me faudrait aussi un réfractomètre pour mesurer la densité du moût';
/* test en ligne 3, envoi 2 : l'IA range un carnet neuf « Réfractomètre » (sorte idée) */
const REPONSES: Record<string, { lignes: Record<string, unknown>[] }> = {
  [VRAC.texte]: VRAC.reponse,
  [TUYAU.texte]: TUYAU.reponse,
  [REFRACTO]: { lignes: [{ sorte: 'idee', texte: 'Réfractomètre pour mesurer la densité du moût', titre: 'Réfractomètre', carnetNeuf: 'Réfractomètre' }] }
};

function rejeu(attente?: Promise<void>): AppelsIA {
  return {
    async ranger(ctx) {
      if (attente) await attente;
      const r = REPONSES[ctx.texte];
      if (!r) return { ok: false, error: 'hors fixture' };
      const vise = (v: unknown) => (typeof v === 'string' && v.startsWith('@') ? ctx.carnets.find(c => sansAccents(c.titre).includes(v.slice(1)))?.id ?? v : v);
      return { ok: true, data: { lignes: r.lignes.map(l => (l.carnetId ? { ...l, carnetId: vise(l.carnetId) } : { ...l })) } };
    },
    async lire(url) { return { url, domaine: '', statut: 'indisponible', luLe: 0 }; }
  };
}

const LE = '2026-11-18T18:10:00.000Z';
const POMPE = 'ZZ TEST — pompe de transfert moût chaud';
const FERM = 'ZZ TEST — Fermenteur conique inox 60 L';

function monter(titres: string[], o: { attente?: Promise<void>; note?: string } = {}) {
  const magasin = magasinMemoire([]);
  titres.forEach((titre, i) => {
    const r = creerCarnet(magasin.lire(), { id: `CARNET-${i}`, titre, message: { id: `MSG-${i}`, texte: titre, le: LE, depuis: 'liste', rangement: 'ia' } });
    if (!r.ok) throw new Error('semis');
    magasin.appliquer(r.ecritures);
  });
  if (o.note) {
    const r = ranger(magasin.lire(), { message: { id: 'MSG-note', texte: o.note, le: LE, depuis: 'CARNET-0', rangement: 'locale' }, lignes: [{ carnetId: 'CARNET-0', sorte: 'note', texte: o.note }] });
    if (!r.ok) throw new Error('note');
    magasin.appliquer(r.ecritures);
  }
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="production" appels={rejeu(o.attente)}
    aides={aidesCarnet('production', {})} maintenant={() => new Date(LE)} ecrirePlan={() => {}} />);
  const carnet = (mot: string) => lireCarnets(magasin.lire()).find(c => sansAccents(c.title).includes(sansAccents(mot)));
  return { magasin, carnet };
}
const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
const attendre = async (ms = 40) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const envoyer = async (texte: string) => {
  fireEvent.change(champ(), { target: { value: texte } });
  await act(async () => { fireEvent.submit(champ().closest('form')!); });
  await attendre();
};
const ouvrir = async (titre: string) => {
  const b = [...document.querySelectorAll('.cn-carnet-corps')].find(x => x.textContent?.includes(titre)) as HTMLButtonElement | undefined;
  if (!b) throw new Error(`carnet « ${titre} » absent de la liste`);
  await act(async () => { fireEvent.click(b); });
};
const titreAffiche = () => document.querySelector('.cn-titre')?.textContent ?? null;

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('paquet 1 : le carnet en ligne', () => {
  it('PCN-176/181 : le vendeur rendu par le modèle n’est gardé que s’il est un nom propre', () => {
    const page = (domaine: string, statut: PageLue['statut'] = 'lue'): PageLue => ({ url: `https://www.${domaine}/x`, domaine, statut, luLe: 0 });
    const vendeurDe = (texte: string, vendeur: string, p: PageLue) =>
      lireReponse({ lignes: [{ sorte: 'article', texte: 'Pompe magnétique inox', url: p.url, vendeur }] }, { texte, carnets: [], pages: [p] })?.[0]?.vendeur;
    const ricardo = 'https://www.ricardo.ch/fr/a/pompe-magnetique-inox-1287654321/';
    /* test en ligne 3, envois 6 et 7 : raisonnement, puis l'URL entière */
    expect(vendeurDe(`${ricardo} 145 CHF`, 'galaxus.ch (Darlac Ciseaux / Galaxus marketplace ou Galaxus, gardons le domaine', page('galaxus.ch'))).toBeUndefined();
    expect(vendeurDe(`pompe magnétique inox à 145 CHF ${ricardo}`, 'ricardo.ch/fr/a/pompe-magnetique-inox-1287654321/', page('ricardo.ch', 'indisponible'))).toBeUndefined();
    expect(vendeurDe('celui-ci à 289 CHF https://www.brouwland.com/fr/', 'Brouwland Brouwland Brouwland Brouwland Brouwland', page('brouwland.com'))).toBe('Brouwland');
    expect(vendeurDe('vue chez Galaxus à 189 CHF', 'Galaxus', page('galaxus.ch'))).toBe('Galaxus');
  });

  it('PCN-178/182 : le menu d’une note offre « Déplacer » vers un autre carnet', async () => {
    const { carnet } = monter([FERM, POMPE], { note: REFRACTO });
    await ouvrir(FERM);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Note : .*, actions$/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('menuitem', { name: /Déplacer/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(sansAccents('pompe de transfert'), 'i') })); });
    expect(carnet('Fermenteur')!.carnet.notes).toHaveLength(0);
    expect(carnet('pompe de transfert')!.carnet.notes.map(n => n.texte)).toContain(REFRACTO);
  });

  it('PCN-183 : une idée neuve écrite dans un carnet va dans le carnet neuf que l’IA nomme, pas en note brute', async () => {
    const { carnet } = monter([FERM]);
    await ouvrir(FERM);
    await envoyer(REFRACTO);
    expect(carnet('Fermenteur')!.carnet.notes.map(n => n.texte)).not.toContain(REFRACTO);
    expect(carnet('Réfractomètre'), 'carnet neuf de l’IA').toBeDefined();
  });

  it('PCN-184 : « tuyau silicone » écrit dans Pompe : l’écran ne quitte pas la pompe, et y revient après l’IA', async () => {
    let lacher!: () => void;
    const attente = new Promise<void>(r => { lacher = r; });
    const { carnet } = monter([FERM, POMPE], { attente });
    await ouvrir(POMPE);
    await envoyer(TUYAU.texte);
    expect(titreAffiche(), 'pendant l’attente, la pompe reste à l’écran : rien n’est « créé » sur une supposition').toBe(POMPE);
    expect(document.body.textContent).not.toMatch(/Carnet créé/);
    await act(async () => { lacher(); });
    await attendre();
    expect(carnet('pompe de transfert')!.carnet.notes.map(n => n.texte).join()).toMatch(/Tuyau silicone/i);
    expect(titreAffiche(), 'après l’IA, l’écran montre la pompe où la note est rangée').toBe(POMPE);
  });

  it('PCN-186 : chaque carnet né d’une note en vrac ne cite que ses lignes', async () => {
    const { carnet } = monter([]);
    await envoyer(VRAC.texte);
    const pompe = carnet('Pompe de transfert')!;
    const ferm = carnet('Fermenteur conique')!;
    expect(pompe.carnet.phrase).not.toMatch(/fermenteur/i);
    expect(pompe.carnet.phrase).toMatch(/pompe/i);
    expect(ferm.carnet.phrase).not.toMatch(/pompe/i);
    expect(ferm.carnet.phrase).toMatch(/vanne/i);
  });

  it('PCN-185 : une photo qui ne charge pas laisse place au picto', () => {
    const { container } = render(<VignetteObjet photo="https://exemple.invalid/x.jpg" mots={['pompe magnétique']} />);
    const img = container.querySelector('img')!;
    act(() => { fireEvent.error(img); });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.cn-vignette-vide')).not.toBeNull();
  });

  it('PCN-165 : un carnet avec un critère n’est pas « vide » à la suppression', () => {
    const contenu = { creeLe: LE, phrase: 'hotte', criteres: [{ id: 'K1', texte: '1 200 m³/h au moins', origine: 'ia' as const }], facons: [], articles: [], notes: [], photos: [] };
    render(<SupprimerCarnet titre="Hotte" contenu={contenu as never} liens={[]} onDetacher={() => {}} onArchiver={() => {}} onSupprimer={() => {}} onGarder={() => {}} />);
    expect(screen.queryByText(/Il est vide/)).toBeNull();
    expect(document.querySelector('.cn-supprimer')!.textContent).toMatch(/1 critère/);
  });

  it('PCN-162 : un article au prix connu se choisit même si sa page n’a pas été lue', () => {
    expect(choixBloque({ lecture: 'non-lue' as never, domaine: 'ricardo.ch', url: 'https://www.ricardo.ch/x', prixCentimes: 18900 })).toBeNull();
    expect(choixBloque({ lecture: 'non-lue' as never, domaine: 'ricardo.ch', url: 'https://www.ricardo.ch/x' })).not.toBeNull();
  });

  it('PCN-166 : la liste vide ne promet pas une veille qui ne relève rien', () => {
    monter([]);
    expect(document.body.textContent).not.toMatch(/on le surveille/);
  });

});
