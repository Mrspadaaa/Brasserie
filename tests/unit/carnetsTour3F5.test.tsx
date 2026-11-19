// @vitest-environment jsdom
/**
 * Carnet tour 3, voie f5 (critique v4) : un test par constat, rouge sur le code d'avant. n° 1 : « autre projet, sans rapport : un frigo
 * de garde pour 20 fûts » tapé dans la Ventilation s'annonçait « Ce qui compte : autre projet, sans rapport : … » du Frigo. n° 2 : la bulle
 * G8 coupée par « … » (2 lignes au plus). Fixture « ZZ TEST — … », magasin mémoire, IA rejouée : aucun appel réel.
 */
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue, sansAutreSujet } from '../../src/ui/carnets/CarnetsVue';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { type AppelsIA } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); });

const attendre = async (ms = 40) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };
const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
const PHRASE = 'autre projet, sans rapport : un frigo de garde pour 20 fûts';
/** L'IA rejouée range la phrase entière en critère du carnet visé (le pire cas : elle recopie la tête de renvoi). */
const iaCritere: AppelsIA = {
  async ranger(ctx) { return { ok: true, data: { lignes: [{ sorte: 'critere', texte: PHRASE, carnetId: ID_FRIGO ?? ctx.depuis }] } }; },
  async lire(url) { return { url, domaine: '', statut: 'indisponible', luLe: 0 }; }
};

describe('f5 n° 1 : la phrase de renvoi n’est jamais un critère', () => {
  it('sansAutreSujet retire la tête de renvoi, et seulement elle', () => {
    expect(sansAutreSujet(PHRASE)).toBe('un frigo de garde pour 20 fûts');
    expect(sansAutreSujet('ZZ TEST — rien à voir : évier 2 bacs')).toBe('évier 2 bacs');
    expect(sansAutreSujet('tient 80 °C')).toBeNull();
  });
  it('Ventilation : le cadre annonce une note du Frigo, sans « autre projet » ; l’envoi y range une note, aucun critère', async () => {
    const magasin = magasinMemoire(fixtureCarnets());
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" appels={iaCritere}
      aides={aidesCarnet('simule', {})} ecrirePlan={() => {}} ouvrir={{ id: ID_VENTILATION, at: 1 }} />);
    await attendre();
    fireEvent.focus(champ());
    fireEvent.change(champ(), { target: { value: PHRASE } });
    await attendre();
    const cadre = document.querySelector('.cn-cadre')?.textContent ?? '';
    expect(cadre).toMatch(/Frigo/);
    expect(cadre).not.toMatch(/autre projet/);
    expect(cadre).not.toMatch(/Ce qui compte/);
    const avant = lireCarnets(magasin.lire()).find(c => c.id === ID_FRIGO)!.carnet.criteres.length;
    fireEvent.keyDown(champ(), { key: 'Enter' });
    await attendre(300);
    const frigo = lireCarnets(magasin.lire()).find(c => c.id === ID_FRIGO)!.carnet;
    expect(frigo.criteres.length).toBe(avant);
    expect(frigo.criteres.some(k => /autre projet/.test(k.texte))).toBe(false);
    expect(frigo.notes.some(n => n.texte === 'un frigo de garde pour 20 fûts')).toBe(true);
    const ventil = lireCarnets(magasin.lire()).find(c => c.id === ID_VENTILATION)!.carnet;
    expect([...ventil.criteres.map(k => k.texte), ...ventil.notes.map(n => n.texte)].some(t => /frigo de garde/.test(t))).toBe(false);
  });
});

describe('f5 n° 2 : la bulle G8 dit les deux façons entières', () => {
  it('aucune coupe en « … » sur la bulle (ni line-clamp ni ellipsis)', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-fil.css'), 'utf8');
    const regle = css.split('}').find(r => r.includes('.cnf-aides-ligne > .cn-bulle > span:last-child')) ?? '';
    expect(regle).not.toBe('');
    expect(regle).not.toMatch(/line-clamp|ellipsis|nowrap/);
  });
});
