// @vitest-environment jsdom
// Voie t12c (25.10) : sa recette réelle donnait IBU « ? », EBC « ? » et « ? IBU » par ajout. Causes trouvées :
// (1) la conversion lisait un α de lot absent (0 : « non saisi ») comme « inconnu » (alphaLot null), alors que la plage de la
//     variété est connue : plus aucun IBU ; (2) l'EBC du brouillon (details.colorEbc, jamais posé) n'était pas lu des grains.
// Sans grain, l'OG est inconnue : « ? » reste juste, avec sa raison.
import fs from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RECETTE_SAAZ, RECETTE_SAAZ_SANS_GRAIN } from '../../fixtures/recetteSaazReelle';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EtapeHoublons, { type MesuresEtape } from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import { ibuIncalculable } from '../../../src/ui/hopIndex/maBiere/Base';
import MesuresWizard from '../../../src/ui/hopIndex/maBiere/MesuresWizard';
import { appliquerPatchHoublons, libelleIbu, toHopRecipe, versPatch, type ChangementHoublonsV4 } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { lireBiere } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { ajouter } from '../../../src/ui/hopIndex/parcours/operations';
import type { Recipe } from '../../../src/types';

afterEach(cleanup);

function monter(recipe: Recipe, boilOg: number | null, onChange: (c: ChangementHoublonsV4) => void = () => {}) {
  const dernier: { m: MesuresEtape | null } = { m: null };
  const rendu = render(<EtapeHoublons recipe={recipe} boilOg={boilOg} draftId={recipe.id} onChange={onChange} onMesures={(x) => { dernier.m = x; }} />);
  const relancer = (r: Recipe) => rendu.rerender(<EtapeHoublons recipe={r} boilOg={boilOg} draftId={r.id} onChange={onChange} onMesures={(x) => { dernier.m = x; }} />);
  return { ...rendu, dernier, relancer };
}

describe('étape Houblons : la recette réelle du brasseur (Saaz, α sans lot, 5 kg de grain)', () => {
  it('l\'IBU (en plage), l\'EBC et l\'IBU par ajout se chiffrent : jamais « ? » pour une donnée connue', async () => {
    const { container, dernier } = monter(RECETTE_SAAZ, 1.047);
    await waitFor(() => expect(dernier.m).not.toBeNull());
    const m = dernier.m!;
    expect(ibuIncalculable(m)).toBeNull();
    expect(m.ibu.valeur).toBeGreaterThan(0);
    expect(m.ibu.max).toBeGreaterThan(m.ibu.min);               // plage de la variété (α 3–4,5 et 2–5 %), pas un chiffre inventé
    expect(m.ibu.min).toBeLessThanOrEqual(m.ibu.valeur);
    expect(m.ibu.valeur).toBeLessThanOrEqual(m.ibu.max);
    expect(m.ebc).not.toBeNull();                               // EBC des grains (étape 2 : 7,9)
    expect(m.ebc!).toBeGreaterThan(3);
    expect(m.ebc!).toBeLessThan(15);
    await waitFor(() => expect(container.querySelectorAll('[data-role="ibu-ajout"]').length).toBe(2));
    for (const l of Array.from(container.querySelectorAll('[data-role="ligne-houblon"]'))) expect(l.textContent).not.toMatch(/\?\s*IBU/);
  });

  it('un geste (+ dose) remet l\'IBU à jour, et le patch écrit ne perd pas le lot absent', async () => {
    const seq: ChangementHoublonsV4[] = [];
    const { container, dernier, relancer } = monter(RECETTE_SAAZ, 1.047, (c) => seq.push(c));
    await waitFor(() => expect(container.querySelector('[data-role="dose-plus"]')).not.toBeNull());
    const avant = dernier.m!.ibu.valeur;
    expect(avant).toBeGreaterThan(0);
    fireEvent.click(container.querySelectorAll('[data-role="dose-plus"]')[1]);
    expect(seq).toHaveLength(1);
    await waitFor(() => expect(dernier.m!.ibu.valeur).toBeGreaterThan(avant));  // la recette locale du geste suit tout de suite
    expect(seq[0].patch.hops[1].alpha).toBe(0);                                   // α « non saisi » reste 0 (convention), jamais un α inventé
    relancer({ ...RECETTE_SAAZ, hops: seq[0].patch.hops } as Recipe);
    await waitFor(() => expect(dernier.m!.ibu.valeur).toBeGreaterThan(avant));
  });

  it('un autre moment (retrait d\'un ajout) fait baisser l\'IBU', async () => {
    const seq: ChangementHoublonsV4[] = [];
    const { container, dernier } = monter(RECETTE_SAAZ, 1.047, (c) => seq.push(c));
    await waitFor(() => expect(container.querySelector('[data-role="retirer"]')).not.toBeNull());
    const avant = dernier.m!.ibu.valeur;
    fireEvent.click(container.querySelectorAll('[data-role="retirer"]')[1]);
    await waitFor(() => expect(dernier.m!.ibu.valeur).toBeLessThan(avant));
  });
});

describe('brouillon créé en jouant : sans grain, puis avec', () => {
  it('sans grain : l\'OG est inconnue, l\'IBU « ? » avec sa raison (densité), pas à cause de l\'α', async () => {
    const { dernier } = monter(RECETTE_SAAZ_SANS_GRAIN, null);
    await waitFor(() => expect(dernier.m).not.toBeNull());
    expect(ibuIncalculable(dernier.m!)).toMatch(/densité/);
    expect(dernier.m!.ebc).toBeNull();
  });
  it('avec des grains : le même Saaz (CZ) α 0 se chiffre à la plage de la variété', async () => {
    const avecGrains = { ...RECETTE_SAAZ_SANS_GRAIN, ogTarget: 1.05, fermentables: RECETTE_SAAZ.fermentables } as Recipe;
    const { dernier } = monter(avecGrains, 1.05);
    await waitFor(() => expect(dernier.m).not.toBeNull());
    expect(ibuIncalculable(dernier.m!)).toBeNull();
    expect(dernier.m!.ibu.valeur).toBeGreaterThan(0);
  });
  it('un houblon ajouté sans lot au stock (Nelson Sauvin, catalogue α 9,6 %) s\'écrit α 0 et se chiffre au catalogue, jamais « ? »', () => {
    const conv = toHopRecipe(RECETTE_SAAZ, { boilOg: 1.047 });
    const suivante = ajouter(conv.recette, { id: 'a9', hopKey: 'beermaverick-nelson-sauvin', moment: 'b10', minutes: 10, grams: 20 });
    expect(lireBiere(suivante).ibuParAjout.a9.ibu).not.toBeNull();
    const { patch } = versPatch({ ...conv, alphaDuStock: () => null }, suivante);
    expect(patch.hops[2].alpha).toBe(0);
    const relue = toHopRecipe(appliquerPatchHoublons(RECETTE_SAAZ, patch), { boilOg: 1.047 });
    expect(relue.recette.additions[2].alphaLot).toBeUndefined();
    const ibu = lireBiere(relue.recette).ibuParAjout.a3.ibu;
    expect(ibu).not.toBeNull();
    expect(ibu!.valeur).toBeGreaterThan(0);
  });
});

describe('bandeau du wizard : le même IBU aux étapes 2 et 3 (drapeau hopV4 allumé)', () => {
  it('MesuresWizard (étapes autres que Houblons) et l\'étape Houblons rendent le même IBU, écrit « ~ » avec sa plage', async () => {
    const etape = monter(RECETTE_SAAZ, 1.047);
    await waitFor(() => expect(etape.dernier.m).not.toBeNull());
    cleanup();
    let autre: MesuresEtape | null = null;
    render(<MesuresWizard recipe={RECETTE_SAAZ} boilOg={1.047} onMesures={(m) => { autre = m; }} />);
    await waitFor(() => expect(autre).not.toBeNull());
    expect((autre as unknown as MesuresEtape).ibu).toEqual(etape.dernier.m!.ibu);
    const l = libelleIbu(autre as unknown as MesuresEtape);
    expect(l.texte).toMatch(/^~\d+$/);
    expect(l.titre).toMatch(/^entre \d+ et \d+ IBU/);
  });
  it('un α de lot saisi : IBU sans « ~ » ; sans grain : « — » avec la raison, jamais 0', () => {
    const fixe = { og: 1.05, ibu: { valeur: 20.4, min: 20.4, max: 20.4, inconnus: [] } };
    expect(libelleIbu(fixe)).toMatchObject({ texte: '20', valeur: 20.4 });
    expect(libelleIbu(fixe).titre).toBeUndefined();
    const sansGrain = libelleIbu({ og: Number.NaN, ibu: { valeur: 0, min: 0, max: 0, inconnus: [] } });
    expect(sansGrain.texte).toBeNull();
    expect(sansGrain.titre).toMatch(/densité/);
  });
  it('le wizard monte MesuresWizard aux étapes autres que Houblons et lit ces mesures aux sept étapes', () => {
    const w = fs.readFileSync(path.resolve(__dirname, '../../../src/pages/BrewWizard.tsx'), 'utf8');
    expect(w).toMatch(/hopV4Actif && hasMetrics && step !== 'houblons' && <Suspense fallback=\{null\}><MesuresWizardV4/);
    expect(w).toMatch(/\{hopV4Actif && mesuresV4 \? <IbuEnPlage/);
    expect(w).not.toMatch(/step === 'houblons' && hopV4Actif && mesuresV4/);
  });
});
