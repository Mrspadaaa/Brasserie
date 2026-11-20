// @vitest-environment jsdom
/* T3B-4 (TE-52), vu EN LIGNE le 20.11 : Stocks › Houblons › Sources (390) offrait 17 boutons à plat, dont « Ajouter HopDatabase »,
   « Ajouter hops-json », « Enregistrer le modèle expérimental modifiable ». Lecture étroite : le contenu des replis n'est plus monté tant qu'on ne l'ouvre pas
   (il n'existe plus dans l'arbre d'accessibilité), les gestes d'ajout sont rangés sous un seul repli, et leurs noms sont ceux d'un brasseur. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({ knowledge: [] as any[], mobile: true }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/useViewport', async importOriginal => ({ ...(await importOriginal<any>()), useMobileLayout: () => state.mobile }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => [], getHopLots: () => [], getHopKnowledge: () => state.knowledge, getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, importHopIndex: vi.fn(async () => 7), subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(),
} }));
import { HopKnowledgePanel } from '../../src/ui/hopIndex/HopKnowledgePanel';

afterEach(() => { cleanup(); state.knowledge = []; state.mobile = true; });

const boutons = () => screen.queryAllByRole('button').map(b => (b.textContent ?? '').trim());
/** Ouvre les replis un par un, dans l'ordre, comme un doigt : l'événement « toggle » monte le contenu. */
const ouvrir = (titre: RegExp) => {
  const summary = [...document.querySelectorAll('summary')].find(s => titre.test(s.textContent ?? ''))!;
  expect(summary, String(titre)).toBeTruthy();
  const d = summary.parentElement as HTMLDetailsElement;
  d.open = true; fireEvent(d, new Event('toggle'));
};

describe('T3B-4 — Sources et modèles : peu de gestes au repos, des mots de brasseur', () => {
  it('au repos (390), aucun bouton d’ajout n’est dans la page', () => {
    render(<HopKnowledgePanel />);
    expect(boutons().filter(t => /^(Ajouter|Enregistrer)/.test(t))).toEqual([]);
    expect(boutons().length).toBeLessThanOrEqual(3);
  });
  it('au repos (390), même avec des fiches enregistrées, pas une rangée de « Modifier »', () => {
    state.knowledge = Array.from({ length: 12 }, (_, i) => ({ id: `n${i}`, kind: 'note', name: `Note ${i}`, topics: [], summary: '', limitation: '', source: { title: 't', author: 'A', year: 2020, reference: '', kind: 'research' } }));
    render(<HopKnowledgePanel />);
    expect(boutons().filter(t => t === 'Modifier')).toEqual([]);
  });
  it('les gestes d’ajout sont sous un seul repli, et leurs noms ne sont plus des noms de dépôts', () => {
    render(<HopKnowledgePanel />);
    ouvrir(/Gérer les sources et les modèles/);
    ouvrir(/Ajouter des références, des études et des modèles/);
    for (const s of ['Étude disponible', 'Catalogue fabricant', 'Autres bases', 'Analyses de lots', 'Bibliothèque scientifique', 'Levures et conduites', 'Styles étendus', 'Modèle expérimental', 'Programmes de l’atelier']) ouvrir(new RegExp(s));
    const t = boutons().join(' | ');
    for (const mot of [/HopDatabase/, /hops-json/, /modèle expérimental modifiable/i, /^Enregistrer/m]) expect(t).not.toMatch(mot);
    expect(boutons()).toEqual(expect.arrayContaining(['Ajouter la base communautaire', 'Ajouter la liste de variétés libre', 'Ajouter les fiches Beer Maverick', 'Ajouter le modèle d’essai']));
  });
  it('le jargon (JSON, COA, HSI, DM303) n’est pas dit aux repliés ouverts non plus', () => {
    render(<HopKnowledgePanel />);
    ouvrir(/Gérer les sources et les modèles/);
    ouvrir(/Ajouter des références, des études et des modèles/);
    for (const s of ['Autres bases', 'Analyses de lots', 'Bibliothèque scientifique', 'Modèle expérimental', 'Programmes de l’atelier']) ouvrir(new RegExp(s));
    expect(document.body.textContent).not.toMatch(/JSON|\bCOA\b|\bHSI\b|DM303/);
  });
  it('à 1280 aussi (k2, point 5), les quatre gestes du haut sont sous « Gérer », pas à plat', () => {
    state.mobile = false;
    render(<HopKnowledgePanel />);
    expect(boutons().filter(t => /^Ajouter/.test(t))).toEqual([]);
    expect(document.body.textContent).not.toMatch(/Attributions et licences|Ce que l’appli sait des houblons/);
    ouvrir(/Gérer les sources et les modèles/);
    for (const nom of ['Ajouter les repères de base', 'Ajouter une levure', 'Ajouter un modèle', 'Ajouter les amertumes du houblon cru']) expect(screen.getByRole('button', { name: nom })).toBeInTheDocument();
  });
  it('« Gérer les sources et les modèles » a l’habillage des autres replis (k2, point 6), aux deux largeurs', () => {
    for (const mobile of [true, false]) {
      state.mobile = mobile; render(<HopKnowledgePanel />);
      const resumes = [...document.querySelectorAll('section > details > summary')] as HTMLElement[];
      const gerer = resumes.find(s => /Gérer les sources/.test(s.textContent ?? ''))!;
      expect(resumes.length).toBeGreaterThanOrEqual(4);
      for (const s of resumes) {
        expect(s.className, s.textContent ?? '').toMatch(/text-ebc-straw/);
        expect((s.parentElement as HTMLElement).className).toBe((gerer.parentElement as HTMLElement).className);
        expect(s.className).toBe(gerer.className);
      }
      cleanup();
    }
  });
  it('pas de jargon de dépôt ni de réglage interne, replis ouverts (k2, point 7)', () => {
    render(<HopKnowledgePanel />);
    ouvrir(/Gérer les sources et les modèles/);
    ouvrir(/Ajouter des références, des études et des modèles/);
    for (const s of ['Autres bases', 'Analyses de lots', 'Bibliothèque scientifique', 'Modèle expérimental', 'Programmes de l’atelier', 'Styles étendus']) ouvrir(new RegExp(s));
    expect(document.body.textContent).not.toMatch(/référentiel|GitHub|Les axes pèsent/i);
    expect(document.body.textContent).toMatch(/Sources et licences des bases/);
  });
  it('les phrases d’aide de « Gérer » sont lisibles en cave : pas en cave-400 (k2, point 9)', () => {
    render(<HopKnowledgePanel />);
    ouvrir(/Gérer les sources et les modèles/);
    const phrases = [...document.querySelectorAll('section > details')].find(d => /Gérer/.test(d.textContent ?? ''))!.querySelectorAll('p, a');
    expect(phrases.length).toBeGreaterThanOrEqual(3);
    for (const p of phrases) expect(p.className, p.textContent ?? '').not.toMatch(/text-cave-400/);
  });
  it('un ajout dit toujours ce qu’il a fait (BE-78)', async () => {
    render(<HopKnowledgePanel />);
    ouvrir(/Ajouter des références, des études et des modèles/);
    ouvrir(/Autres bases/);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la base communautaire' }));
    expect(await screen.findByText(/7 fiche\(s\) ajoutée\(s\)/)).toBeInTheDocument();
  });
});
