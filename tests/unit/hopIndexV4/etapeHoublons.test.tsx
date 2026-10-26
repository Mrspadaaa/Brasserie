// @vitest-environment jsdom
// Voie t12-ma-biere (#170) : l'étape 3 du wizard, drapeau hopV4 allumé, rend l'écran de la maquette (une seule copie, dans
// src/ui/hopIndex/maBiere/) sur la recette du brouillon, et chaque geste passe par la porte d'écriture du wizard (un patch
// de `hops`). Stockage simulé : aucune donnée réelle, aucun appel Gemini.
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EtapeHoublons from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import type { ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';
import type { MesuresEtape } from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import { ibuIncalculable } from '../../../src/ui/hopIndex/maBiere/Base';

const RECETTE = {
  id: 'REC-T12', name: 'Stout export', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;

afterEach(cleanup);

describe('étape Houblons v4 (T12)', () => {
  it('rend l\'écran choisi sur la recette du brouillon : bandeau, frise, carte, profil', async () => {
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T12" onChange={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="ma-biere"]')).not.toBeNull());
    expect(container.querySelector('[data-element="etape-bandeau"]')).toBeNull(); // t12c : le bandeau du wizard le remplace
    expect(container.querySelector('[data-role="ligne-houblon"]')?.textContent).toContain('Nugget');
    expect(container.querySelector('[data-role="moment-pouce"]')?.textContent).toBe('60′');
    expect(container.querySelector('[data-element="etape-profil"]')).not.toBeNull();
    // Aucun état d'attente : ni roue ni « chargement ».
    expect(container.textContent).not.toMatch(/chargement/i);
  });

  it('un geste écrit un patch de hops par la porte du wizard (dose +, puis retirer)', async () => {
    const changements: ChangementHoublonsV4[] = [];
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T12" onChange={(c) => changements.push(c)} />);
    await waitFor(() => expect(container.querySelector('[data-role="dose-plus"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="dose-plus"]')!);
    expect(changements).toHaveLength(1);
    expect(changements[0].draftId).toBe('REC-T12');
    expect(changements[0].patch.hops).toHaveLength(1);
    expect(changements[0].patch.hops[0].weightG).toBeGreaterThan(46);
    expect(changements[0].patch.hops[0].name).toBe('Nugget');
    fireEvent.click(container.querySelector('[data-role="retirer"]')!);
    expect(changements[1].patch.hops).toHaveLength(0);
  });

  it('un refus de la porte (brouillon en lecture seule) est dit, la recette reste celle du brouillon', async () => {
    const { container } = render(<EtapeHoublons recipe={RECETTE} boilOg={1.066} draftId="REC-T12" onChange={() => { throw new Error('Ce brouillon est conservé en lecture seule; aucun outil ne le remplace.'); }} />);
    await waitFor(() => expect(container.querySelector('[data-role="retirer"]')).not.toBeNull());
    fireEvent.click(container.querySelector('[data-role="retirer"]')!);
    expect(screen.getByRole('alert').textContent).toContain('lecture seule');
    expect(container.querySelector('[data-role="ligne-houblon"]')?.textContent).toContain('Nugget');
  });
});

describe('wizard (T12) : drapeau et une seule copie', () => {
  const racine = path.resolve(__dirname, '../../..');
  const wizard = fs.readFileSync(path.join(racine, 'src/pages/BrewWizard.tsx'), 'utf8');
  it('l\'étape 3 rend l\'écran v4 drapeau allumé et garde l\'atelier V5.5 drapeau éteint', () => {
    expect(wizard).toMatch(/step === 'houblons' && hopV4Actif && \(/);
    expect(wizard).toMatch(/step === 'houblons' && !hopV4Actif && \(/);
    expect(wizard).toMatch(/<HopV55RecipeStep /);
    expect(wizard).toMatch(/onChange=\{applyHopV4Change\}/);
  });
  it('l\'écran n\'a plus de copie dans la maquette', () => {
    const dossier = path.join(racine, 'prototypes/houblons-v4/parcours/src/ecrans/ma-biere');
    const restes = fs.existsSync(dossier) ? fs.readdirSync(dossier).filter((f) => /\.tsx?$/.test(f)) : [];
    expect(restes).toEqual([]);
  });
});

// Voie t12b-finitions (#170) : l'inconnu jamais à 0, l'en-tête réduit à l'étape 3, la rangée Retour/Suivant hors du coin
// du « + », la recette de la maquette pour `?dev-local&etape=houblons`, le champ protégé.
describe('étape Houblons v4 (T12b) : l\'inconnu s\'écrit « ? »', () => {
  const VIDE = { id: 'REC-VIDE', name: '', style: '16D', volumeL: 20, boilMin: 60, fermentables: [], hops: [] } as unknown as Recipe;
  const SANS_MALT = { ...VIDE, id: 'REC-SM', hops: [{ name: 'Citra', alpha: 12, weightG: 15, stage: 'boil', timeMin: 10 }] } as unknown as Recipe;
  // t12c : l'étape n'a plus de bandeau propre ; ses mesures vont au bandeau du wizard par onMesures. L'inconnu y reste « — »
  // avec sa raison (ibuIncalculable) ; jamais 0.
  const mesuresDe = async (recipe: Recipe, boilOg: number | null) => {
    let m: MesuresEtape | null = null;
    const { container } = render(<EtapeHoublons recipe={recipe} boilOg={boilOg} draftId={recipe.id} onChange={() => {}} onMesures={(x) => { m = x; }} />);
    await waitFor(() => expect(container.querySelector('[data-ecran="ma-biere"]')).not.toBeNull());
    await waitFor(() => expect(m).not.toBeNull());
    return { container, mesures: m! as MesuresEtape };
  };

  it('recette vide : ni « NaN » ni « IBU 0 » ; l\'IBU est dit incalculable avec sa raison (densité)', async () => {
    const { container, mesures } = await mesuresDe(VIDE, null);
    expect(ibuIncalculable(mesures)).toMatch(/densité/);
    expect(Number.isFinite(mesures.og)).toBe(false);
    expect(container.querySelector('[data-ecran="ma-biere"]')?.textContent).not.toMatch(/NaN/);
  });

  it('un houblon sans malts : le total d\'IBU reste incalculable (la carte dit « ? IBU »), jamais 0', async () => {
    const { container, mesures } = await mesuresDe(SANS_MALT, null);
    await waitFor(() => expect(container.querySelector('[data-role="ligne-houblon"]')).not.toBeNull());
    expect(ibuIncalculable(mesures)).toMatch(/densité/);
    expect(container.querySelector('[data-role="ligne-houblon"]')?.textContent).toMatch(/\?\s*IBU/);
    expect(container.textContent).not.toMatch(/NaN|IBU ?0\b/);
  });
  it('sans levure, la frise ne la dit pas « caractérisée »', async () => {
    const { container } = render(<EtapeHoublons recipe={VIDE} boilOg={null} draftId="REC-VIDE" onChange={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-role="pont-etape-levure"]')).not.toBeNull());
    expect(container.querySelector('[data-role="pont-etape-levure"]')?.textContent).not.toMatch(/caractérisée/);
  });

  it('la recette de la maquette se chiffre : IBU et OG 1,066', async () => {
    const { container, mesures } = await mesuresDe(RECETTE, 1.066);
    expect(ibuIncalculable(mesures)).toBeNull();
    expect(mesures.ibu.valeur).toBeGreaterThan(0);
    expect(mesures.og).toBeCloseTo(1.066, 3);
    await waitFor(() => expect(container.querySelector('[data-role="pont-etape-levure"]')).not.toBeNull());
    expect(container.querySelector('[data-role="pont-etape-levure"]')?.textContent).toMatch(/caractérisée/);
  });
});

describe('wizard (T12b) : en-tête, rangée de fin, banc local, champ protégé', () => {
  const racine = path.resolve(__dirname, '../../..');
  const lire = (f: string) => fs.readFileSync(path.join(racine, f), 'utf8');
  it('le même haut d\'écran aux sept étapes : WizardStepName partout, plus de repère « 3/7 » propre à l\'étape 3 (t12c)', () => {
    const w = lire('src/pages/BrewWizard.tsx');
    expect(w).not.toMatch(/data-role="repere-etape"/);
    expect(w).toMatch(/<WizardStepName steps=\{STEPS\} currentIndex=\{stepIndex\} \/>/);
    // « Abandonner » dans l'en-tête, et le bandeau Grain · OG · IBU · EBC aussi à l'étape 3.
    expect(w).toMatch(/data-role="abandonner-brouillon"/);
    expect(w).toMatch(/\$\{step === 'eau' \? 'hidden' : 'flex'\}/);
  });
  it('Retour et Suivant sont la rangée de fin de PageShell, qui laisse le coin du « + » flottant', () => {
    const w = lire('src/pages/BrewWizard.tsx');
    expect(w).toMatch(/endActions=\{stepActions\}/);
    const p = lire('src/pages/PageShell.tsx');
    expect(p).toMatch(/data-floating-actions-gap=\{endActions \? 'page-row' : 'page'\}/);
    expect(p).toMatch(/launcherPresent && !dockInHeader \? 'pr-16' : ''/);
  });
  it('le banc `?dev-local&etape=houblons` reste derrière import.meta.env.DEV et le compte dev-local', () => {
    const a = lire('src/App.tsx');
    const i = a.indexOf("q.get('etape') !== 'houblons'");
    expect(i).toBeGreaterThan(0);
    const avant = a.slice(Math.max(0, i - 400), i);
    expect(avant).toMatch(/if \(import\.meta\.env\.DEV\) \{\s*if \(!isDevLocal \|\| !isDataReady/);
  });
  it('le champ « Ajouter — houblon… » est le champ protégé de l\'app (Input), pas un <input> brut', () => {
    const a = lire('src/ui/hopIndex/maBiere/Ajouter.tsx');
    expect(a).toMatch(/<Input ref=\{champRef\}/);
    expect(a).not.toMatch(/<input\b/);
  });
});

describe('recette du banc local (T12b)', () => {
  it('est celle de sa maquette : Stout export 16D, 20 L, OG 1,066, Nugget 46 g à 60′, α 13 %', async () => {
    const { recetteApercuEtapeHoublons } = await import('../../../src/ui/hopIndex/maBiere/apercuDev');
    const r = recetteApercuEtapeHoublons() as unknown as Record<string, unknown> & { hops: Array<Record<string, unknown>> };
    expect([r.style, r.volumeL, r.ogTarget, r.colorEbc]).toEqual(['16D', 20, 1.066, 70]);
    expect(r.hops).toEqual([{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }]);
  });
});
