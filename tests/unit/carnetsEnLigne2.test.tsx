// @vitest-environment jsdom
/**
 * Test en ligne 2 du carnet (18.11) : l'IA range juste, l'app écrasait son résultat par la découpe locale. Règle : quand l'IA a répondu,
 * son rangement (carnet, sorte, critère) fait foi ; la découpe locale n'est qu'un aperçu en attendant, ou le repli hors ligne.
 * Chaque bloquant rejoue la réponse de Gemini du journal (tests/fixtures/carnets/en-ligne-2/reponses.json). Gemini n'est jamais appelé :
 * les appels sont injectés (`appels`), AiClient n'est pas touché.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import type { AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { creerCarnet } from '../../src/domain/carnets/operations';
import { sansAccents, type PageLue } from '../../src/domain/carnets/ia';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

interface Envoi { n: number; texte: string; pages?: { demandee: string; page: PageLue }[]; reponse: { lignes: Record<string, unknown>[] } }
const F = JSON.parse(readFileSync(join(__dirname, '../fixtures/carnets/en-ligne-2/reponses.json'), 'utf8')) as { envois: Envoi[] };
const envoi = (n: number) => F.envois.find(e => e.n === n)!;

/** Les appels du test en ligne 2, rejoués : la réponse journalisée du message, ses « @mot » remis sur les carnets du contexte. */
function rejeu(): AppelsIA & { textes: string[] } {
  const textes: string[] = [];
  return {
    textes,
    async ranger(ctx) {
      textes.push(ctx.texte);
      const e = F.envois.find(x => x.texte === ctx.texte);
      if (!e) return { ok: false, error: 'hors fixture' };
      const vise = (v: unknown) => (typeof v === 'string' && v.startsWith('@') ? ctx.carnets.find(c => sansAccents(c.titre).includes(v.slice(1)))?.id ?? v : v);
      return { ok: true, data: { lignes: e.reponse.lignes.map(l => (l.carnetId ? { ...l, carnetId: vise(l.carnetId) } : { ...l })) } };
    },
    async lire(url) {
      for (const e of F.envois) for (const p of e.pages ?? []) if (p.demandee === url) return { ...p.page };
      return { url, domaine: '', statut: 'indisponible', luLe: 0 };
    }
  };
}

const LE = '2026-11-18T14:10:00.000Z';
const TITRES = {
  pompe: 'ZZ TEST — pompe de transfert pour le moût chaud',
  hotte: "ZZ TEST — hotte d'extraction pour la salle de brassage",
  fermenteur: 'ZZ TEST — Fermenteur conique inox',
  quatreVingts: 'doit tenir 80 °C'
} as const;
type Cle = keyof typeof TITRES;

function monter(seme: Cle[]) {
  const magasin = magasinMemoire([]);
  seme.forEach((cle, i) => {
    const r = creerCarnet(magasin.lire(), { id: `CARNET-${cle}`, titre: TITRES[cle], message: { id: `MSG-${cle}`, texte: TITRES[cle], le: LE, depuis: 'liste', rangement: 'ia' } });
    if (!r.ok) throw new Error(`semis ${i}`);
    magasin.appliquer(r.ecritures);
  });
  const appels = rejeu();
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="production" appels={appels}
    aides={aidesCarnet('production', {})} maintenant={() => new Date(LE)} ecrirePlan={() => {}} />);
  const carnets = () => lireCarnets(magasin.lire());
  const carnet = (mot: string) => carnets().find(c => sansAccents(c.title).includes(sansAccents(mot)));
  return { magasin, appels, carnets, carnet };
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

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('test en ligne 2 : le rangement de l’IA fait foi', () => {
  it('n° 1 : note en vrac, deux carnets de l’IA ; la vanne au fermenteur, la pompe garde son carnet, « double paroi » reste à faire', async () => {
    const { carnet, appels } = monter([]);
    await envoyer(envoi(1).texte);
    expect(appels.textes).toEqual([envoi(1).texte]);
    const ferm = carnet('Fermenteur conique inox 60 L');
    const pompe = carnet('Pompe de transfert');
    expect(ferm, 'carnet Fermenteur de l’IA').toBeDefined();
    expect(pompe, 'carnet Pompe annoncé puis disparu').toBeDefined();
    expect(ferm!.carnet.criteres.map(k => k.texte)).toContain('Vanne en bas pour la levure');
    const note = ferm!.carnet.notes.find(n => n.texte === "Vérifier s'il existe avec double paroi");
    expect(note?.genre).toBe('a-faire');
    expect(ferm!.carnet.criteres.map(k => k.texte)).not.toContain("Vérifier s'il existe avec double paroi");
    expect(carnet('Prochain brassin')).toBeUndefined();
    /* L05 : la marque des données de test suit les carnets neufs */
    expect(ferm!.title.startsWith('ZZ TEST — ')).toBe(true);
  });

  it('n° 2 : « doit tenir 80 °C » écrit dans Pompe va dans Pompe, même si un carnet porte ce titre', async () => {
    const { carnet } = monter(['pompe', 'quatreVingts']);
    await ouvrir(TITRES.pompe);
    await envoyer(envoi(5).texte);
    expect(carnet('pompe de transfert')!.carnet.criteres.map(k => k.texte)).toContain('Doit tenir 80 °C au moins');
    expect(carnet('doit tenir 80')!.carnet.criteres).toHaveLength(0);
  });

  it('n° 3 : « doit tenir 80 °C » depuis la liste va dans Pompe, aucun carnet titré par le critère', async () => {
    const { carnet, carnets } = monter(['pompe']);
    await envoyer(envoi(4).texte);
    expect(carnet('pompe de transfert')!.carnet.criteres.map(k => k.texte)).toContain('Doit tenir 80 °C au moins');
    expect(carnet('doit tenir 80')).toBeUndefined();
    expect(carnets()).toHaveLength(1);
  });

  it('n° 4 : « tuyau silicone 8 mm, 5 m » écrit dans Pompe reste dans Pompe, note à acheter, 5 m', async () => {
    const { carnet, carnets } = monter(['pompe']);
    await ouvrir(TITRES.pompe);
    await envoyer(envoi(7).texte);
    const note = carnet('pompe de transfert')!.carnet.notes.find(n => /tuyau silicone 8 mm, 5 m/i.test(n.texte));
    expect(note, 'la note est perdue').toBeDefined();
    expect(note!.genre).toBe('a-acheter');
    expect(carnets()).toHaveLength(1);
  });

  it('n° 5 : le prix écrit en CHF reste sur l’article quand l’IA ne le rend pas', async () => {
    const { carnet } = monter(['hotte', 'fermenteur']);
    await ouvrir(TITRES.hotte);
    await envoyer(envoi(10).texte);
    await envoyer(envoi(11).texte);
    const prix = carnet('hotte')!.carnet.articles.map(a => [a.prixCentimes, a.devise]);
    expect(prix).toEqual([[48900, 'CHF'], [32000, 'CHF']]);
    await act(async () => { fireEvent.click(document.querySelector('.cn-retour') as HTMLElement); });
    await ouvrir(TITRES.fermenteur);
    await envoyer(envoi(12).texte);
    expect(carnet('fermenteur')!.carnet.articles.map(a => a.prixCentimes)).toEqual([28900]);
  });

  it('n° 6 : au 2e lien, le 1er article garde son nom, aucun « lecture… » sans fin ; chacun s’ouvre', async () => {
    const { carnet } = monter(['hotte']);
    await ouvrir(TITRES.hotte);
    await envoyer(envoi(10).texte);
    await envoyer(envoi(11).texte);
    const arts = carnet('hotte')!.carnet.articles;
    expect(arts).toHaveLength(2);
    expect(arts.map(a => a.lecture)).not.toContain('a-lire');
    const page = document.querySelector('.cn-page')!.textContent ?? '';
    for (const a of arts) expect(page, `nom de ${a.url}`).toContain(a.nom!);
    expect(page).not.toMatch(/lecture…/);
    expect(page).not.toMatch(/Lien sans aperçu/);
  });

  it('n° 7 : deux articles à prix écrit : Comparer montre le tableau', async () => {
    monter(['hotte']);
    await ouvrir(TITRES.hotte);
    await envoyer(envoi(10).texte);
    await envoyer(envoi(11).texte);
    const lien = document.querySelector('.cn-comparer-lien') as HTMLButtonElement | null;
    expect(lien, 'lien Comparer').not.toBeNull();
    await act(async () => { fireEvent.click(lien!); });
    const page = document.querySelector('.cn-comparer')!.textContent ?? '';
    expect(page).not.toMatch(/Le tableau naît au 2e article/);
    expect(page).toMatch(/489/);
    expect(page).toMatch(/320/);
  });

  it('n° 8 : champ actif, la liste ne saute pas sous le doigt : le cadre Créer reste le temps du toucher', async () => {
    monter(['pompe', 'hotte']);
    await act(async () => { fireEvent.focus(champ()); });
    const cadre = () => document.querySelector('section[aria-label="Créer un carnet"]');
    expect(cadre()).not.toBeNull();
    await act(async () => { fireEvent.blur(champ()); });
    /* le toucher qui a pris le focus n'est pas fini : la liste n'a pas bougé */
    expect(cadre(), 'le cadre se replie avant le clic : la liste saute').not.toBeNull();
    await ouvrir(TITRES.hotte);
    expect(document.querySelector('.cn-titre')?.textContent).toContain('hotte');
  });

  it('n° 8 (suite) : sans toucher, le cadre se replie peu après la sortie du champ', async () => {
    monter(['pompe']);
    await act(async () => { fireEvent.focus(champ()); });
    await act(async () => { fireEvent.blur(champ()); });
    await attendre(450);
    expect(document.querySelector('section[aria-label="Créer un carnet"]')).toBeNull();
  });
});
