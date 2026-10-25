// @vitest-environment jsdom
// Voie t9-paresseux (#167) : les outils houblons v4 forment un chunk à la demande, préchargé au repos, rien au démarrage.
// Ici : le chargement mémorisé, le programmateur de préchargement (conditions et ordre), la couche qui s'ouvre prête quand
// les outils sont déjà là, et la garde de structure (aucun import statique du moteur depuis le démarrage).
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { chargerOutils, outilsCharges, oublierOutils, type Outils } from '../../../src/ui/hopIndex/chargement';
import { programmerPrechargement, type EntreePrechargement } from '../../../src/ui/hopIndex/precharge';
import HopToolLayer from '../../../src/ui/hopIndex/HopToolLayer';

afterEach(() => { cleanup(); oublierOutils(); vi.restoreAllMocks(); });

const faux = { moteur: {} } as unknown as Outils;

describe('chargerOutils : un chargement, mémorisé ; un échec réseau n\'est pas gardé', () => {
  it('n\'importe qu\'une fois et rend les outils déjà là ensuite', async () => {
    const importer = vi.fn(async () => faux);
    expect(outilsCharges()).toBeNull();
    const [a, b] = await Promise.all([chargerOutils(importer), chargerOutils(importer)]);
    expect(a).toBe(faux); expect(b).toBe(faux);
    expect(importer).toHaveBeenCalledTimes(1);
    expect(outilsCharges()).toBe(faux);
    await chargerOutils(importer);
    expect(importer).toHaveBeenCalledTimes(1);
  });
  it('un échec n\'est pas mémorisé : l\'ouverture suivante réessaie', async () => {
    const importer = vi.fn<() => Promise<Outils>>().mockRejectedValueOnce(new Error('réseau')).mockResolvedValueOnce(faux);
    await expect(chargerOutils(importer)).rejects.toThrow('réseau');
    expect(outilsCharges()).toBeNull();
    await expect(chargerOutils(importer)).resolves.toBe(faux);
    expect(importer).toHaveBeenCalledTimes(2);
  });
});

/** Un environnement pilotable : on déclenche à la main le chargement de page, le repos et le retour du réseau. */
function environnement(sur: Partial<{ actif: boolean; enLigne: boolean; economie: boolean; chargee: boolean }> = {}) {
  const etat = { actif: true, enLigne: true, economie: false, chargee: true, ...sur };
  const files: Record<'charge' | 'repos' | 'enLigne', Array<() => void>> = { charge: [], repos: [], enLigne: [] };
  const charger = vi.fn(async () => undefined);
  const programmer = (f: Array<() => void>) => (g: () => void) => { f.push(g); return () => { const i = f.indexOf(g); if (i >= 0) f.splice(i, 1); }; };
  const entree: EntreePrechargement = {
    actif: etat.actif, enLigne: () => etat.enLigne, economieDonnees: () => etat.economie, pageChargee: () => etat.chargee,
    quandCharge: programmer(files.charge), auRepos: programmer(files.repos), quandEnLigne: programmer(files.enLigne), charger
  };
  const declencher = (k: keyof typeof files) => { const f = files[k].splice(0); f.forEach(g => g()); };
  return { etat, files, charger, entree, declencher };
}

describe('programmerPrechargement : au repos, en ligne, drapeau allumé, jamais sur le démarrage', () => {
  it('drapeau éteint : rien n\'est programmé ni chargé', () => {
    const e = environnement({ actif: false }); e.entree.actif = false;
    programmerPrechargement(e.entree);
    expect(e.files.repos).toHaveLength(0); expect(e.files.charge).toHaveLength(0); expect(e.charger).not.toHaveBeenCalled();
  });
  it('économie de données : rien', () => {
    const e = environnement({ economie: true });
    programmerPrechargement(e.entree);
    expect(e.files.repos).toHaveLength(0); expect(e.charger).not.toHaveBeenCalled();
  });
  it('allumé et en ligne : attend le repos, puis charge une seule fois (jamais tout de suite)', () => {
    const e = environnement();
    programmerPrechargement(e.entree);
    expect(e.charger).not.toHaveBeenCalled();           // pas sur le chemin du démarrage
    expect(e.files.repos).toHaveLength(1);
    e.declencher('repos');
    expect(e.charger).toHaveBeenCalledTimes(1);
    e.declencher('repos');
    expect(e.charger).toHaveBeenCalledTimes(1);
  });
  it('page pas encore chargée : attend la fin du chargement, puis le repos', () => {
    const e = environnement({ chargee: false });
    programmerPrechargement(e.entree);
    expect(e.files.repos).toHaveLength(0);
    e.etat.chargee = true; e.declencher('charge');
    expect(e.files.repos).toHaveLength(1); expect(e.charger).not.toHaveBeenCalled();
    e.declencher('repos');
    expect(e.charger).toHaveBeenCalledTimes(1);
  });
  it('hors ligne : rien tant que le réseau n\'est pas revenu', () => {
    const e = environnement({ enLigne: false });
    programmerPrechargement(e.entree);
    expect(e.files.repos).toHaveLength(0); expect(e.charger).not.toHaveBeenCalled();
    e.etat.enLigne = true; e.declencher('enLigne');
    e.declencher('repos');
    expect(e.charger).toHaveBeenCalledTimes(1);
  });
  it('réseau perdu entre l\'attente et le repos : on ne charge pas', () => {
    const e = environnement();
    programmerPrechargement(e.entree);
    e.etat.enLigne = false; e.declencher('repos');
    expect(e.charger).not.toHaveBeenCalled();
    expect(e.files.enLigne).toHaveLength(1);
  });
  it('démontage avant le repos : annulé', () => {
    const e = environnement();
    const annuler = programmerPrechargement(e.entree);
    annuler(); e.declencher('repos');
    expect(e.charger).not.toHaveBeenCalled();
  });
  it('un échec du chargement ne remonte pas (l\'ouverture d\'un outil réessaiera)', async () => {
    const e = environnement(); e.charger.mockRejectedValue(new Error('coupé'));
    programmerPrechargement(e.entree);
    e.declencher('repos');
    await Promise.resolve();
    expect(e.charger).toHaveBeenCalledTimes(1);
  });
});

describe('HopToolLayer : prête au premier rendu si les outils sont préchargés', () => {
  const route = { view: 'hopBeer' } as const;
  it('précharge : aucun état d\'attente', async () => {
    await chargerOutils();                                  // le vrai chunk (moteur v4)
    render(<HopToolLayer route={route} level={1} onClose={() => {}} />);
    const racine = document.querySelector('[data-hop-tool-layer]')!;
    expect(racine.getAttribute('data-hop-tool-moteur')).toBe('pret');
    expect(screen.getByText(/Moteur v4 chargé/)).toBeTruthy();
  });
  it('à froid : charge à l\'ouverture, puis prête', async () => {
    render(<HopToolLayer route={route} level={1} onClose={() => {}} />);
    await waitFor(() => expect(document.querySelector('[data-hop-tool-layer]')!.getAttribute('data-hop-tool-moteur')).toBe('pret'));
  });
});

describe('structure : le moteur v4 n\'entre jamais par un import statique du démarrage', () => {
  const lire = (p: string) => fs.readFileSync(path.resolve(p), 'utf8');
  const importsStatiques = (src: string) => [...src.matchAll(/^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm)].map(m => m[1] ?? m[2]);
  it.each(['src/App.tsx', 'src/ui/hopIndex/chargement.ts', 'src/ui/hopIndex/precharge.ts', 'src/ui/hopIndex/HopToolLayer.tsx', 'src/ui/hopIndex/devHook.ts', 'src/ui/hopIndex/flags.ts'])(
    '%s n\'importe statiquement ni outils ni le moteur v4', (f) => {
      const statiques = importsStatiques(lire(f));
      expect(statiques.filter(s => /hopIndex\/v4|\/outils$|^\.\/outils$|data\/hopV4/.test(s))).toEqual([]);
    });
  it('outils.ts est le seul point d\'entrée statique du moteur v4 dans src/ui/hopIndex/', () => {
    const fichiers = fs.readdirSync('src/ui/hopIndex').filter(f => /\.(ts|tsx)$/.test(f));
    // donneesApp (T8, #169) est pur : aucun import de valeur (le moteur n'y entre pas), donc sans effet sur le démarrage.
    const tirent = fichiers.filter(f => importsStatiques(lire(`src/ui/hopIndex/${f}`)).some(s => /domain\/hopIndex\/v4/.test(s) && !/v4\/donneesApp$/.test(s)));
    expect(tirent).toEqual(['outils.ts']);
  });
  it('donneesApp.ts (pur, importé par useHopData) n\'a aucun import de valeur : le moteur n\'y entre pas', () => {
    expect(importsStatiques(lire('src/domain/hopIndex/v4/donneesApp.ts'))).toEqual([]);
  });
  it('useHopData.ts n\'importe statiquement du moteur que donneesApp (les autres imports v4 sont des types)', () => {
    const v4 = importsStatiques(lire('src/ui/hopIndex/useHopData.ts')).filter(s => /domain\/hopIndex\/v4|data\/hopV4/.test(s));
    expect(v4).toEqual(['../../domain/hopIndex/v4/donneesApp']);
  });
  it('App.tsx ne déclenche le préchargement que derrière le drapeau lu en clair, en import dynamique', () => {
    const app = lire('src/App.tsx');
    expect(app).toMatch(/import\.meta\.env\.VITE_HOP_V4 !== 'on'/);
    expect(app).toMatch(/import\('\.\/ui\/hopIndex\/precharge'\)/);
  });
});
