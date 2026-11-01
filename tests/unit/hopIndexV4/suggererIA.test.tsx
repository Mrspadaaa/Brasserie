// @vitest-environment jsdom
// Voie ia3, puis ia5 (D132) : l'IA dans Suggérer, À LA DEMANDE, transport simulé : jamais d'appel Firebase ni Gemini. Rien n'est appelé à l'ouverture ;
// un toucher sur la puce fait un appel, un double toucher n'en fait pas un second ; l'ordre s'applique, la puce bascule sans nouvel appel ; l'échec,
// hors ligne ; la phrase au toucher d'une rangée ; les effets, doses et barres restent ceux du moteur.
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: { subscribe: () => () => {}, getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getBatches: () => [], getHopTastings: () => [], getHopKnowledge: () => [] },
}));

import EcranSuggererApp from '../../../src/ui/hopIndex/suggerer/EcranApp';
import { DELAI_CLIENT_MS, TAILLE_POOL, installerTransportSuggerer, momentIA, ordreValide, poolExAequo, type ReponseSuggerer, type TransportSuggerer } from '../../../src/ui/hopIndex/suggerer/ia';
import type { Objectif } from '../../../src/ui/hopIndex/suggerer/voies';
import type { Voie } from '../../../src/domain/hopIndex/v4';
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
  poserPorteEtape({ recipe: RECETTE, boilOg: 1.081, draftId: 'REC-IA3', onChange: () => {} }); poserVisee({ citrus: 2.5 });
});
afterEach(() => { cleanup(); installerTransportSuggerer(null); poserVisee(null); viderComparaison(); poserPorteEtape(null); vi.restoreAllMocks(); });

/** Un transport maîtrisé : on y lit la demande, on y répond quand on veut. */
function transportManuel() {
  const etat: { demandes: EntreeSuggerer[]; repondre: (r: ReponseSuggerer | Error) => void } = { demandes: [], repondre: () => {} };
  const t: TransportSuggerer = (d) => new Promise((ok, ko) => { etat.demandes.push(d); etat.repondre = (r) => (r instanceof Error ? ko(r) : ok(r)); });
  return { t, etat };
}
/** L'IA remonte le dernier des ex æquo en tête, puis rend les autres dans l'ordre du moteur : tous les candidats, une phrase chacun. */
const ordreIA = (d: EntreeSuggerer, phrases?: Record<string, string>): ReponseSuggerer => {
  const ids = d.candidats.map((c) => c.id), dernier = ids[ids.length - 1];
  const ordre = [dernier, ...ids.filter((k) => k !== dernier)];
  return { ok: true, ordre, phrases: phrases ?? Object.fromEntries(ordre.map((k) => [k, `Phrase de ${k}.`])), model: 'gemini-3.8-flash' };
};
const GROUPE = '[data-groupe="meme-0"]';
const monter = async () => {
  const r = render(<EcranSuggererApp onClose={() => {}} />);
  await waitFor(() => expect(r.container.querySelectorAll(`${GROUPE} [data-role="ligne-houblon"]`).length).toBeGreaterThanOrEqual(4), { timeout: 20000 });
  return r.container;
};
const rangees = (c: HTMLElement) => [...c.querySelectorAll(`${GROUPE} [data-role="ligne-houblon"]`)].map((li) => li.querySelector('[data-houblon]')!.getAttribute('data-houblon')!);
const puce = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-role="puce-ia"]');
const etatPuce = (c: HTMLElement) => puce(c)?.getAttribute('data-ia');
const attendre = async (action: () => void) => { await act(async () => { action(); await Promise.resolve(); await Promise.resolve(); }); };
/** Monte l'écran et attend la puce au repos (le pool est prêt). */
const monterAuRepos = async (t: TransportSuggerer) => { installerTransportSuggerer(t); const c = await monter(); await waitFor(() => expect(etatPuce(c)).toBe('repos'), { timeout: 20000 }); return c; };

describe('Suggérer et l’IA à la demande : ce que la liste fait', () => {
  it('à l’ouverture et au repos : aucun appel ; la puce « classer par l’IA » est là, sur le groupe des ex æquo, et la liste est celle du moteur', async () => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t);
    await new Promise((ok) => setTimeout(ok, 600));
    expect(etat.demandes).toHaveLength(0);
    expect(puce(c)!.textContent).toBe('classer par l’IA'); expect(puce(c)!.hasAttribute('aria-pressed')).toBe(false);
    expect(c.querySelector('[data-role="puce-ia-place"]')).toBeNull();
    expect(rangees(c).length).toBeGreaterThanOrEqual(4);
    expect(puce(c)!.closest(GROUPE) ?? puce(c)!.closest('[data-groupe]')).not.toBeNull();
  }, 40000);

  it('un toucher sur la puce fait un appel : les ex æquo du moteur (3 à 12), le style, la recette, la visée, le moment', async () => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t); const montrees = rangees(c);
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    const d = etat.demandes[0];
    expect(d.mode).toBe('suggerer'); expect(d.style.code).toBe('22A'); expect(d.candidats.length).toBeGreaterThanOrEqual(3); expect(d.candidats.length).toBeLessThanOrEqual(12);
    // le pool commence par les rangées montrées du groupe « même effet » (dans l'ordre du moteur) : les ex æquo, pas les 30 premiers du moteur
    expect(d.candidats.slice(0, montrees.length).map((x) => x.id)).toEqual(montrees);
    // D195 (s3) : la bière saturée en agrumes (Lotus 78 g à 20′, 144 g au dry hop) n'est plus freinée par « plus d'agrumes » (la demande prime sur la bande) : le groupe de tête est le whirlpool, plus le dry hop.
    expect(d.demande.moment).toEqual({ type: 'whirlpool' });
    expect(d.demande.objectifs).toEqual([{ famille: 'agrumes', sens: 1, crans: expect.any(Number) }]);
    expect(d.recette.houblons).toContainEqual({ nom: 'Lotus', grammes: 144, moment: expect.stringContaining('dry hop') });
    expect(d.recette.houblons).toContainEqual({ nom: 'Lotus', grammes: 78, moment: '20′' });
    expect(new Set(d.candidats.map((x) => x.id)).size).toBe(d.candidats.length);
    expect(d.candidats.every((x) => x.fiche.nom && Array.isArray(x.fiche.mots))).toBe(true);
  }, 40000);

  it('pendant l’attente : la puce dit « l’IA classe… », garde sa place et sa taille (même texte de classe, même nœud), la liste ne bouge pas ; un double toucher ne fait pas un second appel', async () => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t); const avant = rangees(c); const noeud = puce(c)!;
    fireEvent.click(noeud); fireEvent.click(noeud);
    await waitFor(() => expect(etatPuce(c)).toBe('attente'));
    expect(puce(c)).toBe(noeud);                                              // le même bouton : ni remplacé ni déplacé
    expect(noeud.className).toBe('pq-sg-ia pq-sg-sur-axe'); expect(noeud.textContent).toBe('l’IA classe…'); expect(noeud.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(noeud);
    await new Promise((ok) => setTimeout(ok, 200));
    expect(etat.demandes).toHaveLength(1);
    expect(rangees(c)).toEqual(avant);
  }, 40000);

  it('l’ordre arrive et s’applique : la puce dit « classé par l’IA » ; un toucher rend l’ordre du moteur, un autre celui de l’IA, sans nouvel appel', async () => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t); const avant = rangees(c);
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    const d = etat.demandes[0];
    await attendre(() => etat.repondre(ordreIA(d)));
    await waitFor(() => expect(etatPuce(c)).toBe('appliquee'));
    const apres = rangees(c), ia = ordreIA(d).ordre!;
    expect(apres).toEqual(ia.slice(0, apres.length));
    expect(apres[0]).toBe(d.candidats[d.candidats.length - 1].id); expect(avant).not.toEqual(apres);
    expect(apres).toHaveLength(avant.length);                                 // autant de rangées : le groupe garde sa hauteur
    expect(puce(c)!.textContent).toBe('classé par l’IA'); expect(puce(c)!.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(puce(c)!);
    expect(rangees(c)).toEqual(avant); expect(etatPuce(c)).toBe('prete'); expect(puce(c)!.textContent).toBe('appliquer l’ordre IA');
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
    fireEvent.click(puce(c)!);
    expect(rangees(c)).toEqual(apres); expect(etatPuce(c)).toBe('appliquee');
    await new Promise((ok) => setTimeout(ok, 200));
    expect(etat.demandes).toHaveLength(1);                                    // aucun nouvel appel
  }, 40000);

  it('un toucher sur une rangée ouvre la phrase de l’IA (14 px), un second la ferme ; le moteur n’a aucune phrase', async () => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t);
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(etatPuce(c)).toBe('appliquee'));
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();            // fermée au repos
    const li = c.querySelector<HTMLElement>(`${GROUPE} [data-role="ligne-houblon"]`)!;
    const cle = li.querySelector('[data-houblon]')!.getAttribute('data-houblon')!;
    fireEvent.click(li);
    const p = c.querySelector<HTMLElement>('[data-role="phrase-ia"]')!;
    expect(p.textContent).toContain(`Phrase de ${cle}.`); expect(p.className).toContain('pq-sg-ia-phrase');
    fireEvent.click(li);
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
  }, 40000);

  it('les rangées de l’IA gardent les effets et la dose du moteur : un houblon à lui, le même nombre de lignes, aucune valeur de l’IA', async () => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t);
    const doseAvant = c.querySelector(`${GROUPE} h3`)!.textContent;
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(etatPuce(c)).toBe('appliquee'));
    const titre = c.querySelector(`${GROUPE} h3`)!.textContent!;
    expect(titre).toMatch(/whirlpool/); // D195 (s3) : le groupe de tête de la bière saturée est le whirlpool
    expect(doseAvant).toMatch(/48 g/);
    // chaque rangée : sa dose (celle du moteur) soit dans l'en-tête (même effet), soit sur la ligne (« 48 g ») ; jamais un nombre venu de l'IA
    const lignes = [...c.querySelectorAll(`${GROUPE} [data-role="ligne-houblon"]`)];
    for (const li of lignes) expect(li.querySelector('[data-role="barres-voie"]') || /même effet/.test(titre)).toBeTruthy();
  }, 40000);

  it('une réponse est gardée pour la séance : revenir à la même demande ne refacture pas', async () => {
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    let c = await monter(); await waitFor(() => expect(etatPuce(c)).toBe('repos'), { timeout: 20000 });
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(ordreIA(etat.demandes[0])));
    await waitFor(() => expect(etatPuce(c)).toBe('appliquee'));
    cleanup();                                                                 // on quitte l'écran, on y revient : même recette, même visée
    c = await monter(); await waitFor(() => expect(etatPuce(c)).toBe('repos'), { timeout: 20000 });
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etatPuce(c)).toBe('appliquee'));
    expect(etat.demandes).toHaveLength(1);
  }, 60000);
});

describe('Suggérer et l’IA à la demande : hors ligne, échec, invalide', () => {
  it('hors ligne : aucun appel, aucune puce, aucun message ; l’ordre du moteur', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { t, etat } = transportManuel(); installerTransportSuggerer(t);
    const c = await monter();
    await new Promise((ok) => setTimeout(ok, 600));
    expect(etat.demandes).toHaveLength(0); expect(puce(c)).toBeNull(); expect(c.querySelector('[data-role="puce-ia-place"]')).toBeNull();
    expect(c.textContent).not.toMatch(/hors ligne|erreur|échec|indisponible/i);
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
  ])('%s : la liste reste celle du moteur, la puce revient au repos et dit « IA indisponible », jamais un ordre inventé ; un toucher réessaie', async (_n, reponse) => {
    const { t, etat } = transportManuel();
    const c = await monterAuRepos(t); const avant = rangees(c);
    fireEvent.click(puce(c)!);
    await waitFor(() => expect(etat.demandes).toHaveLength(1));
    await attendre(() => etat.repondre(reponse(etat.demandes[0])));
    await waitFor(() => expect(etatPuce(c)).toBe('echec'));
    expect(rangees(c)).toEqual(avant); expect(puce(c)!.textContent).toBe('IA indisponible'); expect(puce(c)!.hasAttribute('aria-busy')).toBe(false);
    expect(c.textContent!.match(/IA indisponible/g)).toHaveLength(1);         // une seule fois
    expect(c.querySelector('[data-role="phrase-ia"]')).toBeNull();
    fireEvent.click(puce(c)!);                                                // le réessai part
    await waitFor(() => expect(etat.demandes).toHaveLength(2));
    expect(etatPuce(c)).toBe('attente');
  }, 40000);
});

describe('délais : une réponse lente est couverte', () => {
  it('le client attend plus que le serveur (20 s, voir hopReclasserIA.test.ts) et moins que la fonction (30 s)', () => {
    expect(DELAI_CLIENT_MS).toBeGreaterThan(20000); expect(DELAI_CLIENT_MS).toBeLessThan(30000);
  });
});

describe('le pool de l’IA : les ex æquo du moteur, jamais un houblon pris plus bas (D126)', () => {
  const voie = (cle: string, central: number, grammes = 48) => ({ actions: [{ hopKey: cle, grams: grammes, moment: 'dryActive' }], effect: { citrus: { established: true, central } } }) as unknown as Voie;
  const obj = [{ f: 'citrus', sens: 1, requis: 2.5, cran: 1 }] as unknown as Objectif[];
  it('les rangées du groupe d’abord, puis les suivantes au même effet et à la même dose ; un autre effet ou une autre dose n’entre jamais', () => {
    const rangees = [voie('a', 1), voie('b', 1), voie('c', 1)];
    const pool = [voie('a', 1), voie('x', 3), voie('d', 1), voie('y', 1, 60), voie('b', 1), voie('e', 1), voie('z', 0)];
    expect(poolExAequo(rangees, pool, obj).map((v) => v.actions[0].hopKey)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
  it('au plus TAILLE_POOL, dans l’ordre du moteur ; sans rangée, rien', () => {
    const rangees = [voie('r1', 1), voie('r2', 1), voie('r3', 1)];
    const pool = Array.from({ length: 40 }, (_, i) => voie(`p${i}`, 1));
    const p = poolExAequo(rangees, pool, obj);
    expect(p).toHaveLength(TAILLE_POOL); expect(p.slice(0, 3).map((v) => v.actions[0].hopKey)).toEqual(['r1', 'r2', 'r3']); expect(p[3].actions[0].hopKey).toBe('p0');
    expect(poolExAequo([], pool, obj)).toEqual([]);
  });
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
