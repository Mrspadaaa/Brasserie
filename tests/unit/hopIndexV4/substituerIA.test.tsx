// @vitest-environment jsdom
// Voie i2 : l'IA dans Substituer (D80), transport simulé : jamais d'appel Firebase ni Gemini. Réponse rapide, lente, après un
// toucher, hors ligne, en échec, invalide ; la phrase à un toucher de sa rangée ; les scores restent ceux du moteur.
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: { subscribe: () => () => {}, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getBatches: () => [], getHopTastings: () => [], getHopKnowledge: () => [] },
}));

import EcranSubstituerApp from '../../../src/ui/hopIndex/substituer/EcranApp';
import { FENETRE_MS, installerTransportIA, ordreValide, type ReponseIA, type TransportIA } from '../../../src/ui/hopIndex/substituer/ia';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserOuvreurCouche } from '../../../src/ui/hopIndex/ouvrirCouche';
import type { EntreeReclassement } from '../../../functions/src/hopReclassCore';

const RECETTE = {
  id: 'REC-I2', name: 'Pale du jeudi', style: '18B', volumeL: 20, boilMin: 60, ogTarget: 1.056, colorEbc: 20, fermentables: [],
  hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }, { name: 'Cascade', alpha: 6, weightG: 80, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const NUGGET = 'beermaverick-nugget';

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); poserPorteEtape({ recipe: RECETTE, boilOg: 1.056, draftId: 'REC-I2', onChange: () => {} }); });
afterEach(() => { cleanup(); installerTransportIA(null); vi.useRealTimers(); vi.restoreAllMocks(); poserPorteEtape(null); poserOuvreurCouche(null); });

/** Un transport maîtrisé : on y lit la demande, on y répond quand on veut. */
function transportManuel() {
  const etat: { demandes: EntreeReclassement[]; repondre: (r: ReponseIA | Error) => void } = { demandes: [], repondre: () => {} };
  const t: TransportIA = (d) => new Promise((ok, ko) => { etat.demandes.push(d); etat.repondre = (r) => (r instanceof Error ? ko(r) : ok(r)); });
  return { t, etat };
}
/** L'IA remonte le septième du moteur en tête, puis rend les autres dans l'ordre du moteur. */
const ordreIA = (d: EntreeReclassement): ReponseIA => {
  const ids = d.candidats.map((c) => c.id), sept = ids[6];
  const ordre = [sept, ...ids.filter((k) => k !== sept)].slice(0, 10);
  return { ok: true, ordre, phrases: Object.fromEntries(ordre.map((k) => [k, `Phrase de ${k}.`])), model: 'gemini-3.5-flash-lite' };
};
const monter = async () => {
  const r = render(<EcranSubstituerApp hopKey={NUGGET} onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelector('[data-ecran="substituer"] [data-remplacant]')).not.toBeNull(), { timeout: 8000 });
  return r.container;
};
const rangs = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-ecran="substituer"] [data-remplacant]')].map((e) => ({ cle: e.getAttribute('data-remplacant')!, min: e.getAttribute('data-min'), max: e.getAttribute('data-max') }));
const puce = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-role="puce-ia"]');
const attendre = async (action: () => void) => { await act(async () => { action(); await Promise.resolve(); await Promise.resolve(); }); };

describe('Substituer et l’IA : ce que la liste fait', () => {
  it('la liste du moteur est là tout de suite, l’appel part à l’ouverture avec les 20 premiers du moteur', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    expect(rangs(c).length).toBeGreaterThanOrEqual(5);
    expect(puce(c)).toBeNull();                      // rien au premier plan tant que l'IA n'a pas répondu
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    const d = etat.demandes[0];
    expect(d.candidats).toHaveLength(20); expect(d.moment).toEqual({ type: 'ebullition', minutes: 60 });
    expect(d.original.nom).toBe('Nugget'); expect(d.candidats.every((x) => x.fiche.nom && x.id.startsWith('beermaverick-'))).toBe(true);
    expect(JSON.stringify(d)).not.toMatch(/stock|grams|dose/i);   // ni stock ni dose du brasseur ne partent
  });

  it('réponse en moins de 3 s, liste intacte : l’ordre de l’IA remplace la liste, une puce « classé par l’IA », scores du moteur', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    const avant = rangs(c);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    expect(puce(c)!.textContent).toMatch(/classé par l’IA/);
    const apres = rangs(c);
    expect(apres[0].cle).toBe(etat.demandes[0].candidats[6].id);   // le septième du moteur est maintenant premier
    expect(apres.map((r) => r.cle)).not.toEqual(avant.map((r) => r.cle));
    // Les scores affichés sont ceux du moteur : chaque remplaçant garde sa plage.
    for (const r of apres) { const a = avant.find((x) => x.cle === r.cle); if (a) expect([r.min, r.max]).toEqual([a.min, a.max]); }
  });

  it('un toucher sur la puce rend l’ordre du moteur, un second rend celui de l’IA', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter(); const avant = rangs(c).map((r) => r.cle);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const ia = rangs(c).map((r) => r.cle);
    fireEvent.click(puce(c)!);
    expect(rangs(c).map((r) => r.cle)).toEqual(avant); expect(puce(c)!.getAttribute('data-ia')).toBe('prete'); expect(puce(c)!.textContent).toMatch(/appliquer l’ordre IA/);
    fireEvent.click(puce(c)!);
    expect(rangs(c).map((r) => r.cle)).toEqual(ia); expect(puce(c)!.getAttribute('data-ia')).toBe('appliquee');
  });

  it('B1 : la puce vit dans la tête fixe, à droite du titre, jamais dans le flux de la page : son arrivée ne décale rien', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    const tete = c.querySelector('[data-page-titlebar]')!;
    expect(tete.querySelector('[data-role="puce-ia"]')).toBeNull();
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)).not.toBeNull());
    expect(tete.contains(puce(c))).toBe(true);
    expect(tete.querySelector('h1')!.nextElementSibling!.contains(puce(c))).toBe(true);   // juste après le titre
    expect(c.querySelector('.pq-substituer')!.contains(puce(c))).toBe(false);              // hors du flux de l'écran
    // La ligne des moments et ce qui la suit gardent leur place dans le flux : même structure avant et après.
    expect(c.querySelector('.pq-substituer')!.firstElementChild!.getAttribute('data-role')).toBe('puce-moment');
  });

  it('B2 : appliqué, le titre nomme le premier de la liste affichée et reprend sa phrase ; rendu, il rend le titre du moteur', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    const titre = () => c.querySelector('[data-role="reponse"] strong')!.textContent!;
    const titreMoteur = titre();
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const premier = c.querySelector('[data-ecran="substituer"] [data-remplacant]')!;
    const nom = premier.getAttribute('data-houblon-rang')!;
    expect(titre().startsWith(`${nom}, `)).toBe(true);
    expect(titre()).toMatch(new RegExp(`${premier.getAttribute('data-min')}`));
    expect(c.querySelector('[data-role="reponse-ia"]')!.textContent).toContain(`Phrase de ${premier.getAttribute('data-remplacant')}.`);
    fireEvent.click(puce(c)!);
    expect(titre()).toBe(titreMoteur); expect(c.querySelector('[data-role="reponse-ia"]')).toBeNull();
  });

  it('C3 : un rang gris devant chaque score quand l’ordre IA est appliqué, aucun sinon', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    expect(c.querySelectorAll('[data-role="rang-ia"]')).toHaveLength(0);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const rangsIA = [...c.querySelectorAll('[data-role="rang-ia"]')].map((e) => e.textContent);
    expect(rangsIA).toEqual(rangs(c).map((_, i) => String(i + 1)));
    fireEvent.click(puce(c)!);
    expect(c.querySelectorAll('[data-role="rang-ia"]')).toHaveLength(0);
  });

  it('réponse après 3 s : la liste ne bouge pas, « appliquer l’ordre IA », un toucher l’applique', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter(); const avant = rangs(c).map((r) => r.cle);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => { vi.setSystemTime(Date.now() + FENETRE_MS + 500); etat.repondre(ordreIA(etat.demandes[0])); });
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('prete'));
    expect(puce(c)!.textContent).toMatch(/appliquer l’ordre IA/);
    expect(rangs(c).map((r) => r.cle)).toEqual(avant);
    fireEvent.click(puce(c)!);
    expect(puce(c)!.getAttribute('data-ia')).toBe('appliquee'); expect(rangs(c)[0].cle).toBe(etat.demandes[0].candidats[6].id);
  });

  it('réponse rapide mais après un toucher sur la liste : la liste ne bouge pas, « appliquer l’ordre IA »', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter(); const avant = rangs(c).map((r) => r.cle);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    const ligne = c.querySelector<HTMLElement>('[data-remplacant]')!;
    fireEvent.pointerDown(ligne); fireEvent.pointerUp(ligne); fireEvent.click(ligne);
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)).not.toBeNull());
    expect(puce(c)!.getAttribute('data-ia')).toBe('prete'); expect(rangs(c).map((r) => r.cle)).toEqual(avant);
  });

  it('hors ligne : aucun appel, l’ordre du moteur, rien de dit', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    await act(async () => { await Promise.resolve(); });
    expect(etat.demandes).toHaveLength(0); expect(puce(c)).toBeNull();
    expect(c.textContent).not.toMatch(/IA|erreur|indisponible/);
  });

  it('un appel en échec : l’ordre du moteur, sans message ni puce', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter(); const avant = rangs(c).map((r) => r.cle);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(new Error('unavailable')));
    expect(puce(c)).toBeNull(); expect(rangs(c).map((r) => r.cle)).toEqual(avant);
    expect(c.textContent).not.toMatch(/erreur|indisponible|échec/i);
  });

  it('une réponse « ok » à l’ordre invalide (hors liste, double, trop courte) est ignorée : jamais un ordre inventé', async () => {
    for (const faute of ['horsListe', 'double', 'courte', 'sansPhrase'] as const) {
      installerTransportIA(null); const { t, etat } = transportManuel(); installerTransportIA(t);
      const c = await monter(); const avant = rangs(c).map((r) => r.cle);
      await waitFor(() => expect(etat.demandes).toHaveLength(1));
      const bonne = ordreIA(etat.demandes[0]);
      const r: ReponseIA = faute === 'horsListe' ? { ...bonne, ordre: [...bonne.ordre!.slice(0, 9), 'beermaverick-inconnu'] }
        : faute === 'double' ? { ...bonne, ordre: [bonne.ordre![0], ...bonne.ordre!.slice(0, 9)] }
        : faute === 'courte' ? { ...bonne, ordre: bonne.ordre!.slice(0, 9) }
        : { ...bonne, phrases: { ...bonne.phrases, [bonne.ordre![2]]: ' ' } };
      await attendre(() => etat.repondre(r));
      expect(puce(c), faute).toBeNull(); expect(rangs(c).map((x) => x.cle), faute).toEqual(avant);
      cleanup();
    }
  });

  it('la phrase de l’IA se lit dans le face à face, à un toucher de la rangée ; pas avant, pas sans l’ordre IA', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const k = rangs(c)[0].cle;
    fireEvent.pointerDown(c.querySelector(`[data-remplacant="${k}"]`)!); fireEvent.click(c.querySelector(`[data-remplacant="${k}"]`)!);
    const phrase = c.querySelector(`[data-role="phrase-ia"][data-houblon="${k}"]`);
    expect(phrase?.textContent).toContain(`Phrase de ${k}.`);
    fireEvent.click(puce(c)!);                       // l'ordre du moteur est rendu : la phrase part avec lui
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
  });

  it('l’écran ne parle ni de modèle ni de fournisseur', async () => {
    const { t, etat } = transportManuel(); installerTransportIA(t);
    const c = await monter();
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)).not.toBeNull());
    expect(c.textContent).not.toMatch(/gemini|google|flash|lite/i);
  });
});

describe('ordreValide', () => {
  const d = { candidats: Array.from({ length: 12 }, (_, i) => ({ id: `k${i}` })) } as unknown as EntreeReclassement;
  const dix = Array.from({ length: 10 }, (_, i) => `k${i}`);
  const phrases = Object.fromEntries(dix.map((k) => [k, 'ok']));
  it('exige dix clés distinctes de la demande, chacune avec sa phrase', () => {
    expect(ordreValide({ ok: true, ordre: dix, phrases }, d)).toBe(true);
    expect(ordreValide({ ok: false, ordre: dix, phrases }, d)).toBe(false);
    expect(ordreValide({ ok: true, ordre: [...dix.slice(0, 9), 'k11'], phrases }, d)).toBe(false);
    expect(ordreValide(null, d)).toBe(false);
  });
});
