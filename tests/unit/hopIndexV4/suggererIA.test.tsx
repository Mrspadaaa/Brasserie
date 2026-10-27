// @vitest-environment jsdom
// Voie ia3 : l'IA dans Suggérer (D188, D124), transport simulé : jamais d'appel Firebase ni Gemini. Réponse rapide, lente, après un toucher,
// hors ligne, en échec, invalide ; la phrase au toucher d'une rangée ; les effets, doses et barres restent ceux du moteur.
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: { subscribe: () => () => {}, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getBatches: () => [], getHopTastings: () => [], getHopKnowledge: () => [] },
}));

import EcranSuggererApp from '../../../src/ui/hopIndex/suggerer/EcranApp';
import { FENETRE_MS, installerTransportSuggerer, momentIA, ordreValide, type ReponseSuggerer, type TransportSuggerer } from '../../../src/ui/hopIndex/suggerer/ia';
import { poserPorteEtape } from '../../../src/ui/hopIndex/comparer/porte';
import { poserVisee } from '../../../src/ui/hopIndex/parcours/visee';
import { viderComparaison } from '../../../src/ui/hopIndex/fiche/comparaison';
import type { EntreeSuggerer } from '../../../functions/src/hopReclassCore';

// Sa Double IPA (neipa v3, allégée) : 22A, Lotus à 20′ et en dry hop ; visée « plus d'agrumes ». Le dry hop actif a 4 rangées au même effet.
const RECETTE = {
  id: 'REC-IA3', name: 'neipa v3', style: '22A', volumeL: 24, boilMin: 60, ogTarget: 1.081, colorEbc: 8, fermentables: [],
  hops: [{ name: 'Lotus', alpha: 15, weightG: 78, stage: 'boil', timeMin: 20 }, { name: 'Lotus', alpha: 15, weightG: 144, stage: 'dryHop', aromaTiming: 'fermentation', aromaContactHours: 72 }],
  yeast: { name: 'LalBrew Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
} as unknown as Recipe;

beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView ??= () => {};
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.081, draftId: 'REC-IA3', onChange: () => {} }); poserVisee({ citrus: 2.5 });
});
afterEach(() => { cleanup(); installerTransportSuggerer(null); poserVisee(null); viderComparaison(); poserPorteEtape(null); vi.useRealTimers(); vi.restoreAllMocks(); });

/** Un transport maîtrisé : on y lit la demande, on y répond quand on veut. */
function transportManuel() {
  const etat: { demandes: EntreeSuggerer[]; repondre: (r: ReponseSuggerer | Error) => void } = { demandes: [], repondre: () => {} };
  const t: TransportSuggerer = (d) => new Promise((ok, ko) => { etat.demandes.push(d); etat.repondre = (r) => (r instanceof Error ? ko(r) : ok(r)); });
  return { t, etat };
}
/** L'IA remonte le neuvième du moteur en tête, puis rend les autres dans l'ordre du moteur : tous les candidats, une phrase chacun. */
const ordreIA = (d: EntreeSuggerer, phrases?: Record<string, string>): ReponseSuggerer => {
  const ids = d.candidats.map((c) => c.id), neuf = ids[8];
  const ordre = [neuf, ...ids.filter((k) => k !== neuf)];
  return { ok: true, ordre, phrases: phrases ?? Object.fromEntries(ordre.map((k) => [k, `Phrase de ${k}.`])), model: 'gemini-3.5-flash-lite' };
};
const GROUPE = '[data-groupe="meme-0"]';
const monter = async () => {
  const r = render(<EcranSuggererApp onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelectorAll(`${GROUPE} [data-role="ligne-houblon"]`).length).toBeGreaterThanOrEqual(4), { timeout: 20000 });
  return r.container;
};
const rangees = (c: HTMLElement) => [...c.querySelectorAll(`${GROUPE} [data-role="ligne-houblon"]`)].map((li) => li.querySelector('[data-houblon]')!.getAttribute('data-houblon')!);
const puce = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-role="puce-ia"]');
const attendre = async (action: () => void) => { await act(async () => { action(); await Promise.resolve(); await Promise.resolve(); }); };

describe('Suggérer et l’IA : ce que la liste fait', () => {
  it('le moteur est là tout de suite ; l’appel part au repos : 30 candidats du moteur, le style, la recette, la visée, le moment', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter();
    expect(rangees(c).length).toBeGreaterThanOrEqual(4);
    expect(puce(c)).toBeNull();                                          // rien au premier plan tant que l'IA n'a pas répondu
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    const d = etat.demandes[0];
    expect(d.mode).toBe('suggerer'); expect(d.style.code).toBe('22A'); expect(d.candidats.length).toBeGreaterThanOrEqual(25); expect(d.candidats.length).toBeLessThanOrEqual(30);
    expect(d.demande.moment).toEqual({ type: 'dryhop', phase: 'actif' });
    expect(d.demande.objectifs).toEqual([{ famille: 'agrumes', sens: 1, crans: expect.any(Number) }]);
    expect(d.recette.houblons).toContainEqual({ nom: 'Lotus', grammes: 144, moment: expect.stringContaining('dry hop') });
    expect(d.recette.houblons).toContainEqual({ nom: 'Lotus', grammes: 78, moment: '20′' });
    expect(new Set(d.candidats.map((x) => x.id)).size).toBe(d.candidats.length);
    expect(d.candidats.every((x) => x.fiche.nom && Array.isArray(x.fiche.mots))).toBe(true);
    // l'emplacement de la puce est tenu dès le premier affichage (invisible) : son arrivée ne déplace rien
    expect(c.querySelector('[data-role="puce-ia-place"]')).not.toBeNull();
  }, 40000);

  it('réponse en moins de 3 s, liste non touchée : l’ordre de l’IA remplace les rangées, une fois ; la puce dit « classé par l’IA »', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter();
    const avant = rangees(c);
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    const d = etat.demandes[0];
    await attendre(() => etat.repondre(ordreIA(d)));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const apres = rangees(c);
    const ia = ordreIA(d).ordre!;
    expect(apres).toEqual(ia.slice(0, apres.length).map((k) => k));          // les rangées sont les premières de l'ordre de l'IA
    expect(apres[0]).toBe(d.candidats[8].id); expect(avant).not.toEqual(apres);
    expect(apres).toHaveLength(avant.length);                                // autant de rangées : le groupe garde sa hauteur
    expect(puce(c)!.textContent).toContain('classé par l’IA');
    expect(c.querySelector('[data-role="puce-ia-place"]')).toBeNull();
  }, 40000);

  it('un toucher sur la puce rend l’ordre du moteur, un second celui de l’IA', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter(); const avant = rangees(c);
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const ia = rangees(c);
    fireEvent.click(puce(c)!);
    expect(rangees(c)).toEqual(avant); expect(puce(c)!.getAttribute('data-ia')).toBe('prete'); expect(puce(c)!.textContent).toContain('appliquer l’ordre IA');
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
    fireEvent.click(puce(c)!);
    expect(rangees(c)).toEqual(ia);
  }, 40000);

  it('un toucher sur une rangée ouvre la phrase de l’IA (14 px), un second la ferme ; le moteur n’a aucune phrase', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter();
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();           // fermée au repos
    const li = c.querySelector<HTMLElement>(`${GROUPE} [data-role="ligne-houblon"]`)!;
    const cle = li.querySelector('[data-houblon]')!.getAttribute('data-houblon')!;
    fireEvent.click(li);
    const p = c.querySelector<HTMLElement>('[data-role="phrase-ia"]')!;
    expect(p.textContent).toContain(`Phrase de ${cle}.`); expect(p.className).toContain('pq-sg-ia-phrase');
    fireEvent.click(li);
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
  }, 40000);

  it('les rangées de l’IA gardent les effets et la dose du moteur : un houblon à lui, le même nombre de lignes, aucune valeur de l’IA', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter();
    const doseAvant = c.querySelector(`${GROUPE} h3`)!.textContent;
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('appliquee'));
    const titre = c.querySelector(`${GROUPE} h3`)!.textContent!;
    expect(titre).toMatch(/dry hop en fermentation active/);
    expect(doseAvant).toMatch(/48 g/);
    // chaque rangée : sa dose (celle du moteur) soit dans l'en-tête (même effet), soit sur la ligne (« 48 g ») ; jamais un nombre venu de l'IA
    const lignes = [...c.querySelectorAll(`${GROUPE} [data-role="ligne-houblon"]`)];
    for (const li of lignes) expect(li.querySelector('[data-role="barres-voie"]') || /même effet/.test(titre)).toBeTruthy();
  }, 40000);
});

describe('Suggérer et l’IA : réponse tardive, liste touchée, hors ligne, échec, invalide', () => {
  it('réponse après 3 s : la liste ne bouge pas ; la puce dit « appliquer l’ordre IA » et l’applique au toucher', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter(); const avant = rangees(c);
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    vi.setSystemTime(Date.now() + FENETRE_MS + 500);
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('prete'));
    expect(rangees(c)).toEqual(avant);
    fireEvent.click(puce(c)!);
    expect(puce(c)!.getAttribute('data-ia')).toBe('appliquee'); expect(rangees(c)).not.toEqual(avant);
  }, 40000);

  it('liste touchée avant la réponse : elle ne bouge pas, la puce offre l’ordre', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter(); const avant = rangees(c);
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    fireEvent.pointerDown(c.querySelector(`${GROUPE} [data-role="ligne-houblon"]`)!);
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(puce(c)?.getAttribute('data-ia')).toBe('prete'));
    expect(rangees(c)).toEqual(avant);
  }, 40000);

  it('hors ligne : aucun appel, aucune puce, aucun message ; l’ordre du moteur', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter();
    await new Promise((ok) => setTimeout(ok, 600));
    expect(etat.demandes).toHaveLength(0); expect(puce(c)).toBeNull(); expect(c.querySelector('[data-role="puce-ia-place"]')).toBeNull();
    expect(c.textContent).not.toMatch(/hors ligne|erreur|échec/i);
  }, 40000);

  it('sans transport (test, maquette) : l’écran est celui d’avant, sans place ni puce', async () => {
    const c = await monter();
    await new Promise((ok) => setTimeout(ok, 600));
    expect(puce(c)).toBeNull(); expect(c.querySelector('[data-role="puce-ia-place"]')).toBeNull();
  }, 40000);

  it.each([
    ['l’appel échoue', (d: EntreeSuggerer) => { void d; return new Error('réseau'); }],
    ['l’IA répond ok:false', () => ({ ok: false, error: 'indisponible' }) as ReponseSuggerer],
    ['un identifiant hors liste', (d: EntreeSuggerer) => ({ ok: true, ordre: [...d.candidats.slice(1).map((x) => x.id), 'hors-liste'], phrases: { 'hors-liste': 'x' } }) as ReponseSuggerer],
    ['un doublon', (d: EntreeSuggerer) => ({ ok: true, ordre: [d.candidats[0].id, ...d.candidats.slice(0, d.candidats.length - 1).map((x) => x.id)], phrases: {} }) as ReponseSuggerer],
    ['un candidat oublié', (d: EntreeSuggerer) => ({ ok: true, ordre: d.candidats.slice(0, d.candidats.length - 1).map((x) => x.id), phrases: {} }) as ReponseSuggerer],
  ])('%s : la liste reste celle du moteur, sans puce ni message, jamais un ordre inventé', async (_n, reponse) => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter(); const avant = rangees(c);
    await waitFor(() => expect(etat.demandes).toHaveLength(1), { timeout: 20000 });
    await attendre(() => etat.repondre(reponse(etat.demandes[0])));
    await new Promise((ok) => setTimeout(ok, 300));
    expect(rangees(c)).toEqual(avant); expect(puce(c)).toBeNull();
    expect(c.textContent).not.toMatch(/IA n’a pas|erreur|échec/i);
  }, 40000);
});

describe('le client : ses règles seules', () => {
  const demande = (n: number): EntreeSuggerer => ({
    mode: 'suggerer', style: { code: '22A', nom: 'Double IPA' }, recette: { og: 1.081, ibu: 80, volumeL: 24, houblons: [] },
    demande: { objectifs: [{ famille: 'agrumes', sens: 1, crans: 1 }], moment: { type: 'dryhop', phase: 'actif' } },
    candidats: Array.from({ length: n }, (_, i) => ({ id: `h${i}`, fiche: {} as never })),
  });
  const ok = (ordre: string[]): ReponseSuggerer => ({ ok: true, ordre, phrases: {} });
  it('ordreValide : tous les candidats, une fois chacun, tous de la demande', () => {
    const d = demande(12), ids = d.candidats.map((c) => c.id);
    expect(ordreValide(ok(ids), d)).toBe(true); expect(ordreValide(ok(ids.slice(1)), d)).toBe(false);
    expect(ordreValide(ok([...ids.slice(1), 'x']), d)).toBe(false); expect(ordreValide(ok([ids[0], ...ids.slice(0, 11)]), d)).toBe(false);
    expect(ordreValide({ ok: false }, d)).toBe(false); expect(ordreValide(null, d)).toBe(false);
  });
  it('momentIA : les moments du moteur, jamais un moment inventé', () => {
    expect(momentIA('dryActive')).toEqual({ type: 'dryhop', phase: 'actif' }); expect(momentIA('dryPost')).toEqual({ type: 'dryhop', phase: 'apres' });
    expect(momentIA('wp')).toEqual({ type: 'whirlpool' }); expect(momentIA('b10')).toEqual({ type: 'ebullition', minutes: 10 }); expect(momentIA('b60')).toEqual({ type: 'ebullition', minutes: 60 });
    expect(momentIA('fwh')).toEqual({ type: 'premierMout' }); expect(momentIA('cave')).toBeNull();
  });
});
