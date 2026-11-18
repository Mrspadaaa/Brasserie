// @vitest-environment jsdom
/**
 * Le bandeau « Carnet créé » dit d'où vient le titre. Une phrase sur un autre objet, tapée dans un carnet ouvert, crée un carnet neuf par la
 * règle locale (`destinationDans`) : le bandeau ne prête jamais ce titre à l'IA. `ia` seulement quand l'IA a vraiment fourni le titre.
 * Fixture « ZZ TEST — … », magasin mémoire, IA simulée : aucun appel réel.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
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

describe('une phrase sur un autre objet : carnet neuf par la règle locale', () => {
  it('le bandeau dit « titre tiré de votre phrase », avant comme après la réponse de l’IA simulée, jamais « mis en forme par l’IA »', async () => {
    const magasin = magasinMemoire(fixtureCarnets());
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="simule"
      appels={appelsSimules('normal', 20)} aides={aidesCarnet('simule', {})} ouvrir={{ id: ID_VENTILATION, at: 1 }} ecrirePlan={() => {}} />);
    const champ = () => document.querySelector('.cn-champ textarea') as HTMLTextAreaElement;
    await attendre();
    const n0 = lireCarnets(magasin.lire()).length;
    fireEvent.change(champ(), { target: { value: 'tuyau silicone 8 mm, 5 m' } });
    /* le cadre annonce le carnet neuf « Tuyau silicone », tiré de la règle locale (destinationDans) */
    expect(document.querySelector('[data-cadre="texte"]')!.textContent).toContain('Nouveau carnet Tuyau silicone');
    await act(async () => { fireEvent.submit(champ().closest('form')!); });
    expect(lireCarnets(magasin.lire()).length).toBe(n0 + 1);
    await attendre(150);
    /* après la réponse de l'IA simulée : le carnet porte le titre de la règle locale, et le bandeau ne le prête pas à l'IA */
    expect(lireCarnets(magasin.lire()).some(c => c.title === 'Tuyau silicone')).toBe(true);
    const cite = document.querySelector('.cn-bandeau .cn-cite')?.textContent ?? '';
    expect(cite).toContain('titre tiré de votre phrase');
    expect(cite).not.toContain('mis en forme par l’IA');
    expect(document.body.textContent).not.toContain('mis en forme par l’IA');
  });
});
