// @vitest-environment jsdom
/**
 * Le bandeau « Carnet créé » dit d'où vient le titre. Une phrase sur un autre objet, tapée dans un carnet ouvert, crée un carnet neuf par la
 * règle locale (`destinationDans`) : le bandeau ne prête jamais ce titre à l'IA. `ia` seulement quand l'IA a vraiment fourni le titre.
 * Fixture « ZZ TEST — … », magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { origineDuTitre } from '../../src/ui/carnets/Bandeau';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { appelsSimules } from '../../src/ui/carnets/rangement';
import { aidesCarnet } from '../../src/config/carnetIA';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/atelier/dictee', () => ({ useDictee: () => ({ disponible: false, ecoute: false, basculer: () => {} }) }));
const run = vi.fn();
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...a: unknown[]) => run(...a) } }));

beforeEach(() => { Element.prototype.scrollIntoView = function () {} as never; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); expect(run).not.toHaveBeenCalled(); });

const attendre = async (ms = 30) => { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); };

describe('origineDuTitre : qui a fourni le titre', () => {
  const base = { titreDePhrase: 'Tuyau silicone 8 mm, 5 m', lienSeul: false, nomLu: false };
  it('sa phrase (casse et accents ignorés) : phrase ; un lien seul : site ; le nom lu : page', () => {
    expect(origineDuTitre({ ...base, titre: 'tuyau silicone 8 MM, 5 m' })).toBe('phrase');
    expect(origineDuTitre({ ...base, titre: 'exemple.invalid', titreDePhrase: 'exemple.invalid', lienSeul: true })).toBe('site');
    expect(origineDuTitre({ ...base, titre: 'Hotte inox 120', nomLu: true })).toBe('page');
  });
  it('un titre autre que sa phrase, sans IA : la règle locale, jamais l’IA', () => {
    expect(origineDuTitre({ ...base, titre: 'Tuyau silicone' })).toBe('regle');
    expect(origineDuTitre({ ...base, titre: 'Tuyau silicone', titresIA: [] })).toBe('regle');
    expect(origineDuTitre({ ...base, titre: 'Tuyau silicone', titresIA: [undefined, 'Autre titre'] })).toBe('regle');
  });
  it('le titre fourni par l’IA : ia', () => {
    expect(origineDuTitre({ ...base, titre: 'Tuyau silicone', titresIA: [undefined, 'tuyau silicone'] })).toBe('ia');
  });
});

/** D383 : le rangement de l'IA fait foi ; la règle locale n'est qu'un aperçu en attendant, ou le repli hors ligne. */
function monter(o: { appels?: ReturnType<typeof appelsSimules>; horsLigne?: boolean } = {}) {
  const magasin = magasinMemoire(fixtureCarnets());
  render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule" horsLigne={o.horsLigne}
    appels={o.appels ?? appelsSimules('normal', 20)} aides={aidesCarnet('simule', {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} ecrirePlan={() => {}} />);
  const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
  const envoyer = async (t: string) => { fireEvent.change(champ(), { target: { value: t } }); await act(async () => { fireEvent.submit(champ().closest('form')!); }); };
  return { magasin, champ, envoyer, carnets: () => lireCarnets(magasin.lire()) };
}
const PHRASE = 'tuyau silicone 8 mm, 5 m';

describe('une phrase sur un autre objet, tapée dans un carnet ouvert (D383)', () => {
  it('l’aperçu local annonce un carnet neuf « Tuyau silicone » et le crée en attendant ; après la réponse de l’IA, son rangement fait foi : plus de carnet neuf, le critère dans Ventilation, un bandeau qui ne cite plus aucun titre', async () => {
    const { magasin, champ, envoyer, carnets } = monter();
    await attendre();
    const n0 = carnets().length;
    fireEvent.change(champ(), { target: { value: PHRASE } });
    expect(document.querySelector('[data-cadre="texte"]')!.textContent).toContain('Nouveau carnet Tuyau silicone');
    await envoyer(PHRASE);
    expect(carnets().length).toBe(n0 + 1);
    await attendre(150);
    /* la réponse de l'IA simulée range le critère dans Ventilation ; le carnet local, resté vide, a disparu */
    expect(carnets().length).toBe(n0);
    expect(carnets().some(c => c.title === 'Tuyau silicone')).toBe(false);
    expect(carnets().find(c => c.id === ID_VENTILATION)!.carnet.criteres.some(k => /Tuyau silicone 8 mm/.test(k.texte))).toBe(true);
    const bandeau = document.querySelector('.cn-bandeau[role="status"]')!;
    expect(bandeau.getAttribute('data-sorte')).not.toBe('cree');
    expect(bandeau.textContent).not.toContain('votre phrase en titre');
    expect(bandeau.textContent).not.toContain('Carnet créé');
    /* Annuler défait le rangement réel */
    await act(async () => { fireEvent.click(bandeau.querySelector('button')!); });
    expect(carnets().length).toBe(n0);
    expect(carnets().find(c => c.id === ID_VENTILATION)!.carnet.criteres.some(k => /Tuyau silicone 8 mm/.test(k.texte))).toBe(false);
    expect(magasin.lire().some(i => i.type === 'carnet-message' && i.title === PHRASE)).toBe(false);
  });

  it('hors ligne (l’IA ne répond pas) : l’aperçu local reste, carnet neuf titré par la phrase, « votre phrase en titre », jamais « mis en forme par l’IA »', async () => {
    const { envoyer, carnets } = monter({ appels: appelsSimules('echec', 20) });
    await attendre();
    const n0 = carnets().length;
    await envoyer(PHRASE);
    await attendre(150);
    expect(carnets().length).toBe(n0 + 1);
    expect(carnets().some(c => c.title === PHRASE)).toBe(true);
    const cite = document.querySelector('.cn-bandeau .cn-cite')?.textContent ?? '';
    expect(cite).toContain('votre phrase en titre');
    expect(document.body.textContent).not.toContain('mis en forme par l’IA');
  });

  it('hors ligne déclaré (props.horsLigne) : l’aperçu local reste de même, sans appel à l’IA', async () => {
    const appels = appelsSimules('normal', 20);
    const ranger = vi.spyOn(appels, 'ranger');
    const { envoyer, carnets } = monter({ appels, horsLigne: true });
    await attendre();
    const n0 = carnets().length;
    await envoyer(PHRASE);
    await attendre(150);
    expect(ranger).not.toHaveBeenCalled();
    expect(carnets().length).toBe(n0 + 1);
    expect(carnets().some(c => c.title === PHRASE)).toBe(true);
    expect(document.querySelector('.cn-bandeau .cn-cite')?.textContent ?? '').toContain('votre phrase en titre');
  });

  it('corrigé d’un toucher sur « Ici » : son choix reste, la phrase est rangée dans Ventilation même si l’IA veut un carnet neuf', async () => {
    const { champ, envoyer, carnets } = monter();
    await attendre();
    const n0 = carnets().length;
    fireEvent.change(champ(), { target: { value: PHRASE } });
    fireEvent.click(screen.getByRole('button', { name: 'Ici' }));
    await envoyer(PHRASE);
    await attendre(150);
    expect(carnets().length).toBe(n0);
    expect(carnets().find(c => c.id === ID_VENTILATION)!.carnet.criteres.some(k => /Tuyau silicone 8 mm/.test(k.texte))).toBe(true);
    expect(document.querySelector('.cn-bandeau[role="status"]')!.textContent).toMatch(/Rangé ici/);
  });
});

