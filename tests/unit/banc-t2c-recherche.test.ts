import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { creerEnv, envoyerSimule } from '../../scripts/banc-t2c-commun';
import { QUESTIONS, REQUETES, agregerRecherche, jouerRecherche, noterFournisseurs, noterReference, tableauRecherche } from '../../scripts/banc-t2c-recherche';

// Gemini toujours simulé : aucun réseau, aucune clé.
let work = '';
beforeEach(() => { work = mkdtempSync(path.join(tmpdir(), 't2c-rech-')); });
afterEach(() => { if (work && existsSync(work)) rmSync(work, { recursive: true, force: true }); });

describe('t2c — recherche web', () => {
  it('note les fiches : pertinente = variété, exacte = variété + conditionnement', () => {
    const citra = REQUETES.find(r => r.id === 'citra')!;
    const n = noterFournisseurs([{ name: 'Citra Hopfenpellets 100 g' }, { name: 'Citra 1 kg', packageLabel: '1 kg' }, { name: 'Cascade 100 g' }], citra);
    expect(n).toEqual({ pertinentes: 2, exactes: 1 });
    const us05 = REQUETES.find(r => r.id === 'us05')!;
    expect(noterFournisseurs([{ name: 'Fermentis Safale US-05 11,5 g' }], us05)).toEqual({ pertinentes: 1, exactes: 1 });
  });
  it('note la référence : domaine du fabricant dans le titre ou l’URL, faits clés dans le texte', () => {
    const q = QUESTIONS.find(r => r.id === 'us05-temp')!;
    expect(noterReference('Plage 18-26 °C selon Fermentis.', [{ title: 'fermentis.com', url: 'https://vertexaisearch.cloud.google.com/x' }, { title: 'autre.ch', url: 'https://autre.ch' }], q)).toEqual({ sourcesPrimaires: 1, faitCle: true });
    expect(noterReference('Entre 18 et 22 °C.', [], q)).toEqual({ sourcesPrimaires: 0, faitCle: false });
  });
  it('joue en simulé, écrit une sortie par recherche, ne rejoue pas, agrège et tabule', async () => {
    const env = creerEnv({ simuler: true, payant: false, plafondPasse: 1, journal: path.join(work, 'j.md') }, envoyerSimule());
    const options = { reglages: ['gemini-3.8-flash@low', 'gemini-4-hydrogen@low'], fournisseurs: ['citra'], references: ['us05-temp'], sortie: path.join(work, 'out') };
    const sorties = await jouerRecherche(options, env);
    expect(sorties).toHaveLength(4);
    expect(sorties.every(s => s.appels === 1)).toBe(true);
    expect(existsSync(path.join(work, 'out', '3-8-flash-low', 'fournisseurs-citra.json'))).toBe(true);
    const encore = await jouerRecherche(options, env);
    expect(encore).toHaveLength(4);
    expect(readFileSync(path.join(work, 'j.md'), 'utf8').match(/recherche-/g)?.length).toBe(4);
    const tableau = tableauRecherche(agregerRecherche(sorties));
    expect(tableau).toContain('Fournisseurs');
    expect(tableau).toContain('Référence fabricant');
  });
});

describe('t2c — banc du compagnon : voie et mode Approfondi', () => {
  it('lit --voie et --mode : plafonds du tour, journal du tour ; g2 reste inchangé par défaut', async () => {
    const { lireArgs } = await import('../../scripts/banc-compagnon');
    const defaut = lireArgs(['--cellule', 'prod']);
    expect([defaut.voie, defaut.mode, defaut.plafondMission, defaut.plafondG2]).toEqual(['g2', 'auto', 9.9, 4.2]);
    const tour = lireArgs(['--cellule', 'prod', '--voie', 't2c', '--mode', 'deep', '--plafond-mission', '99', '--plafond-g2', '9']);
    expect([tour.voie, tour.mode, tour.plafondMission, tour.plafondG2]).toEqual(['t2c', 'deep', 14.5, 4.5]);
    expect(tour.journal).toContain('journal-tour2.md');
    expect(() => lireArgs(['--cellule', 'prod', '--mode', 'lent'])).toThrow();
  });
  it('joue un cas en Approfondi (mode deep : relecture demandée) et journalise sous le préfixe de la voie', async () => {
    const { jouerCas, parseCellule, sommeJournal } = await import('../../scripts/banc-compagnon');
    const { cases } = await import('../../scripts/fixtures/brewerCases.mjs' as string);
    const journal = path.join(work, 'tour.md');
    const e = { journal, plafondMissionMicro: 14_500_000, plafondG2Micro: 4_500_000, plafondPasseMicro: 1_000_000, depensePasseMicro: 0, arret: {}, simule: false, voie: 't2c', mode: 'deep' as const, envoyer: envoyerSimule() };
    const r = await jouerCas((cases as any[]).find(c => c.id === 'power'), parseCellule('analysis=gemini-4-hydrogen@medium'), e);
    expect(r.ok).toBe(true);
    expect(r.appels.some(a => a.role === 'review')).toBe(true);
    expect(readFileSync(journal, 'utf8')).toContain('t2c:analysis');
    expect(sommeJournal(journal, 't2c')).toBeGreaterThan(0);
    expect(sommeJournal(journal, 'g2')).toBe(0);
  });
});
