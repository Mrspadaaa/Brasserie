// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { lireLien } from '../../functions/src/lireLien';
import { lectureDeReponse, nomCoherent, pageLueParGoogle, type AppelPageBloquee, type LectureGoogle } from '../../functions/src/lienBloquee';
import { lireLienTache, type DocLecture, type MagasinLecture } from '../../functions/src/lecturesLiens';
import { geminiBody } from '../../functions/src/geminiBody';
import { observedGeminiCostDetails, quoteGeminiCost, URL_CONTEXT_RESERVED_INPUT_TOKENS } from '../../functions/src/geminiCosts';
import type { EtapeLien } from '../../functions/src/carnetIA';

// Page bloquée, lue par Google (url_context). Aucun réseau, aucun Gemini : les réponses sont des copies de RÉPONSES RÉELLES du banc
// (`tests/fixtures/carnets/google-bloquee`, 23.11, pages 6 brouwland, 7 brouwland FR, 14 braumarkt, 24 jumbo, 25 bauhaus).

interface Fixture { lien: string; brut: any }
const fixture = (n: number): Fixture => JSON.parse(readFileSync(new URL(`../fixtures/carnets/google-bloquee/lite-${n}.json`, import.meta.url), 'utf8'));
/** Ce que `aiTask` rend à `lireLien` : la réponse analysée par `callGemini` et la trace de l'outil. */
const google = (n: number): { lien: string; lecture: LectureGoogle } => {
  const f = fixture(n);
  return { lien: f.lien, lecture: lectureDeReponse(f.brut, JSON.parse(f.brut.candidates[0].content.parts[0].text)) };
};

const reponse = (corps: string, statut: number, entetes: Record<string, string> = {}) => new Response(corps, { status: statut, headers: { 'content-type': 'text/html', ...entetes } });
/** Un faux réseau : chaque demande est notée ; une adresse inconnue lève. */
function reseau(routes: Record<string, () => Response>) {
  const demandes: string[] = [];
  const fetchPage = vi.fn(async (entree: RequestInfo | URL) => {
    const url = String(entree); demandes.push(url);
    const r = routes[url]; if (!r) throw new Error(`réseau interdit dans les tests : ${url}`);
    return r();
  }) as unknown as typeof fetch;
  return { fetchPage, demandes };
}
const robotsLibre = (lien: string) => `${new URL(lien).origin}/robots.txt`;
/** Brouwland répond 403 avec `cf-mitigated: challenge` ; jumbo répond 403 simple. */
const bloquee = (lien: string, entetes: Record<string, string> = {}) => reseau({ [robotsLibre(lien)]: () => reponse('', 404), [lien]: () => reponse('<html><title>Un instant…</title></html>', 403, entetes) });
const COURS = async (d: string) => (d === 'EUR' ? { taux: 0.93, date: '2026-11-23' } : null);

describe('page bloquée lue par Google : les vraies réponses du banc', () => {
  it('brouwland (Cloudflare, page 6) : nom, prix 159,99 EUR TTC et 8 caractéristiques lus ; aucune photo ; conversion BCE ; une seule demande à Google', async () => {
    const { lien, lecture } = google(6);
    const { fetchPage, demandes } = bloquee(lien, { 'cf-mitigated': 'challenge' });
    const appel = vi.fn<AppelPageBloquee>(async () => lecture);
    const debuts: string[] = [], vues: EtapeLien[] = [];
    const p = await lireLien(lien, { fetchPage, maintenant: 1, cours: COURS, pageBloquee: appel, onDebut: (n) => debuts.push(n), onEtape: (e) => vues.push(e) });

    expect(demandes).toEqual([robotsLibre(lien), lien]); // la page elle-même n'est demandée qu'une fois, jamais contournée
    expect(appel).toHaveBeenCalledTimes(1);
    expect(appel.mock.calls[0][0]).toBe(lien);
    expect(p).toMatchObject({ statut: 'lue', nom: 'Brew Monk® stainless steel fermenter 30 l', prix: 159.99, devise: 'EUR', taxe: 'ttc', domaine: 'brouwland.com', change: { taux: 0.93, source: 'BCE' } });
    expect(p.valeurs).toHaveLength(8);
    expect(p.photo).toBeUndefined();
    expect(p.photos).toBeUndefined();
    expect(p.etapes?.find((e) => e.nom === 'bloquee')).toMatchObject({ statut: 'trouve', detail: expect.stringContaining('lue par Google') });
    expect(p.etapes?.find((e) => e.nom === 'photos')).toMatchObject({ statut: 'absent' });
    expect(p.etapes?.find((e) => e.nom === 'page')).toMatchObject({ statut: 'absent', detail: 'bloquee' });
    expect(debuts).toEqual(['bloquee']);
    expect(vues.map((e) => e.nom)).toEqual(['page', 'bloquee', 'prix', 'photos', 'caract']);
  });

  it('jumbo (403 simple, page 24) : 429 CHF lu, sans conversion ; les noms d\'adresse accentués (Spültischmischer, spueltischmischer) concordent', async () => {
    const { lien, lecture } = google(24);
    const p = await lireLien(lien, { fetchPage: bloquee(lien).fetchPage, maintenant: 1, cours: COURS, pageBloquee: async () => lecture });
    expect(p).toMatchObject({ statut: 'lue', nom: 'KWC Spültischmischer Domo mit ausziehbarer Brause', prix: 429, devise: 'CHF' });
    expect(p.change).toBeUndefined();
    expect(p.valeurs?.map((v) => v.nom)).toEqual(['Ausladung', 'Höhe']);
    expect(p.photo).toBeUndefined();
  });

  it('bauhaus (page 25) : l\'outil dit ERROR : rien n\'est lu, la page reste bloquée, l\'étape dit absent', async () => {
    const { lien, lecture } = google(25);
    const p = await lireLien(lien, { fetchPage: bloquee(lien).fetchPage, maintenant: 1, cours: COURS, pageBloquee: async () => lecture });
    expect(p).toMatchObject({ statut: 'bloquee', domaine: 'bauhaus.ch' });
    expect(p.nom).toBeUndefined(); expect(p.prix).toBeUndefined(); expect(p.valeurs).toBeUndefined();
    expect(p.etapes).toEqual([{ nom: 'page', statut: 'absent', detail: 'bloquee' }, { nom: 'bloquee', statut: 'absent', detail: 'Google n\'a pas pu lire la page' }]);
  });

  it('braumarkt (page 14) : l\'outil a lu une AUTRE adresse (erreur) : bloquée, absent ; brouwland FR (page 7) : l\'outil réussit sur la catégorie, pas sur la fiche : bloquée, absent', async () => {
    for (const n of [14, 7]) {
      const { lien, lecture } = google(n);
      const p = await lireLien(lien, { fetchPage: bloquee(lien).fetchPage, maintenant: 1, cours: COURS, pageBloquee: async () => lecture });
      expect(p.statut).toBe('bloquee');
      expect(p.prix).toBeUndefined(); expect(p.nom).toBeUndefined();
      expect(p.etapes?.find((e) => e.nom === 'bloquee')).toMatchObject({ statut: 'absent', detail: 'Google n\'a pas lu cette adresse' });
    }
  });

  it('Google en panne (budget, délai, réseau) : la page reste bloquée comme avant, jamais d\'exception, le motif est dit', async () => {
    const { lien } = google(6);
    const appel = vi.fn<AppelPageBloquee>(async () => { throw new Error('Plafond mensuel IA atteint'); });
    const p = await lireLien(lien, { fetchPage: bloquee(lien).fetchPage, maintenant: 1, cours: COURS, pageBloquee: appel });
    expect(p.statut).toBe('bloquee');
    expect(p.etapes?.find((e) => e.nom === 'bloquee')).toMatchObject({ statut: 'absent', detail: expect.stringContaining('Plafond mensuel IA atteint') });
  });
});

describe('page bloquée : quand Google n\'est jamais appelé', () => {
  it('robots.txt refuse : statut robots, la page n\'est jamais demandée, aucun appel à Google', async () => {
    const { lien } = google(6);
    const { fetchPage, demandes } = reseau({ [robotsLibre(lien)]: () => new Response('User-agent: *\nDisallow: /', { status: 200, headers: { 'content-type': 'text/plain' } }) });
    const appel = vi.fn<AppelPageBloquee>(async () => google(6).lecture);
    const p = await lireLien(lien, { fetchPage, maintenant: 1, cours: COURS, pageBloquee: appel });
    expect(p.statut).toBe('robots');
    expect(demandes).toEqual([robotsLibre(lien)]);
    expect(appel).not.toHaveBeenCalled();
  });

  it('robots.txt en panne (5xx) : refus, aucun appel à Google ; page introuvable, domaine inexistant, page en erreur : aucun appel non plus', async () => {
    const lien = 'https://boutique-exemple.ch/products/cuve';
    const appel = vi.fn<AppelPageBloquee>(async () => google(6).lecture);
    const cinq = reseau({ [robotsLibre(lien)]: () => reponse('', 503) });
    expect((await lireLien(lien, { fetchPage: cinq.fetchPage, maintenant: 1, cours: null, pageBloquee: appel })).statut).toBe('robots');
    const erreur = reseau({ [robotsLibre(lien)]: () => reponse('', 404), [lien]: () => reponse('', 500) });
    expect((await lireLien(lien, { fetchPage: erreur.fetchPage, maintenant: 1, cours: null, pageBloquee: appel })).statut).toBe('indisponible');
    const dns = vi.fn(async () => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }); }) as unknown as typeof fetch;
    expect((await lireLien(lien, { fetchPage: dns, maintenant: 1, cours: null, pageBloquee: appel })).statut).toBe('introuvable');
    const refus = reseau({ [robotsLibre(lien)]: () => reponse('', 404), [lien]: () => reponse('', 301, { location: 'http://interne.local/x' }) });
    expect((await lireLien(lien, { fetchPage: refus.fetchPage, maintenant: 1, cours: null, pageBloquee: appel })).statut).toBe('refusee');
    expect(appel).not.toHaveBeenCalled();
  });

  it('une page lisible n\'appelle pas Google ; sans appel injecté (clé absente), la page bloquée reste bloquée comme avant', async () => {
    const lien = 'https://boutique-exemple.ch/products/cuve';
    const appel = vi.fn<AppelPageBloquee>(async () => google(6).lecture);
    const page = '<html><head><title>Cuve inox</title><script type="application/ld+json">{"@type":"Product","name":"Cuve inox 50 l","offers":{"@type":"Offer","price":120,"priceCurrency":"CHF"}}</script></head><body><h1>Cuve inox 50 l</h1></body></html>';
    const lisible = reseau({ [robotsLibre(lien)]: () => reponse('', 404), [lien]: () => reponse(page, 200) });
    expect((await lireLien(lien, { fetchPage: lisible.fetchPage, maintenant: 1, cours: null, pageBloquee: appel })).statut).toBe('lue');
    expect(appel).not.toHaveBeenCalled();

    const sans = await lireLien(lien, { fetchPage: bloquee(lien).fetchPage, maintenant: 1, cours: null });
    expect(sans).toEqual({ url: lien, domaine: 'boutique-exemple.ch', statut: 'bloquee', luLe: 1, etapes: [{ nom: 'page', statut: 'absent', detail: 'bloquee' }] });
  });
});

describe('la garde : rien n\'est cru sur la vraisemblance, seulement sur la trace de l\'outil', () => {
  const url = new URL('https://www.bauhaus.ch/de/p/marley-kellerablauf-13503267');
  const reussite = (adresse = url.href): LectureGoogle['lectures'] => [{ adresse, statut: 'URL_RETRIEVAL_STATUS_SUCCESS' }];
  const fiche = (r: Record<string, unknown>, l: Partial<LectureGoogle> = {}): LectureGoogle => ({ reponse: { type: 'fiche', caracteristiques: [], ...r }, lectures: reussite(), jetonsPage: 800, ...l });
  const lis = (l: LectureGoogle) => pageLueParGoogle(url, l, 1);

  it('la réponse « de mémoire » de google_search (aucune trace d\'outil, prix 24,55 faux au lieu de 31,95) est refusée telle quelle', () => {
    const memoire = lis(fiche({ nom: 'Marley Kellerablauf', prix: 24.55, devise: 'EUR' }, { lectures: [], jetonsPage: 0 }));
    expect(memoire.page).toBeNull();
    expect(memoire.etape).toMatchObject({ statut: 'absent', detail: 'Google n\'a pas lu cette adresse' });
    // l'outil dit SUCCESS mais n'a lu aucune page : pas une lecture
    expect(lis(fiche({ nom: 'Marley Kellerablauf', prix: 24.55, devise: 'EUR' }, { jetonsPage: 0 })).page).toBeNull();
    // une réponse sans trace du tout (champ absent de la réponse brute)
    expect(lectureDeReponse({ candidates: [{}], usageMetadata: {} }, { type: 'fiche' })).toEqual({ reponse: { type: 'fiche' }, lectures: [], jetonsPage: 0 });
  });

  it('type ≠ fiche (catégorie, introuvable, illisible), réponse qui n\'est pas un objet : rien n\'est gardé', () => {
    for (const type of ['categorie', 'introuvable', 'illisible']) {
      const s = lis(fiche({ type, nom: 'Marley Kellerablauf', prix: 31.95, devise: 'CHF' }));
      expect(s.page).toBeNull(); expect(s.etape.statut).toBe('absent');
    }
    expect(lis({ reponse: 'texte libre', lectures: reussite(), jetonsPage: 800 })).toMatchObject({ page: null, etape: { statut: 'absent', detail: 'réponse illisible' } });
    expect(lis({ reponse: null, lectures: reussite(), jetonsPage: 800 }).page).toBeNull();
  });

  it('l\'adresse lue : www, barre finale et ancre ne comptent pas ; un autre chemin ou un autre site, si', () => {
    expect(lis(fiche({ nom: 'Marley Kellerablauf', prix: 31.95, devise: 'CHF' }, { lectures: reussite('https://bauhaus.ch/de/p/marley-kellerablauf-13503267/') })).page).not.toBeNull();
    expect(lis(fiche({ nom: 'Marley Kellerablauf', prix: 31.95, devise: 'CHF' }, { lectures: reussite('https://www.bauhaus.ch/de/p/autre-produit-1') })).page).toBeNull();
    expect(lis(fiche({ nom: 'Marley Kellerablauf', prix: 31.95, devise: 'CHF' }, { lectures: reussite('https://www.bauhaus.de/de/p/marley-kellerablauf-13503267') })).page).toBeNull();
  });

  it('un prix sans devise, nul, négatif, à trois décimales ou texte est retiré (étape douteuse) ; le nom concordant reste', () => {
    for (const prix of [{ prix: 31.95 }, { prix: 31.95, devise: 'francs' }, { prix: 0, devise: 'CHF' }, { prix: -5, devise: 'CHF' }, { prix: 31.955, devise: 'CHF' }, { prix: '31.95', devise: 'CHF' }]) {
      const s = lis(fiche({ nom: 'Marley Kellerablauf DN 50', ...prix }));
      expect(s.page).toMatchObject({ statut: 'lue', nom: 'Marley Kellerablauf DN 50' });
      expect(s.page?.prix).toBeUndefined(); expect(s.page?.devise).toBeUndefined();
      expect(s.etape).toMatchObject({ statut: 'douteux', detail: expect.stringContaining('retiré : prix') });
    }
  });

  it('un nom sans rapport avec l\'adresse est retiré ; seul un prix valide garde alors la page', () => {
    const s = lis(fiche({ nom: 'Perceuse sans fil 18 V', prix: 31.95, devise: 'chf' }));
    expect(s.page?.nom).toBeUndefined();
    expect(s.page).toMatchObject({ statut: 'lue', prix: 31.95, devise: 'CHF' });
    expect(s.etape.statut).toBe('douteux');
    const rien = lis(fiche({ nom: 'Perceuse sans fil 18 V' }));
    expect(rien.page).toBeNull();
    expect(rien.etape).toMatchObject({ statut: 'douteux', detail: expect.stringContaining('nom sans rapport') });
  });

  it('une adresse sans mot (« /p/5866824 ») ne permet pas le contrôle du nom', () => {
    expect(nomCoherent('KWC Domo', new URL('https://www.jumbo.ch/p/5866824'))).toBe(true);
    expect(nomCoherent('Perceuse', new URL('https://exemple.ch/p/cuve-fermentation-30-l'))).toBe(false);
    expect(nomCoherent('Cuve de fermentation', new URL('https://exemple.ch/p/cuve-fermentation-30-l'))).toBe(true);
  });

  it('les caractéristiques : sans chiffre elles sont retirées, doublons et excédent coupés ; le HT et « dès » passent', () => {
    const caracteristiques = [{ nom: 'Volume', valeur: '30 l' }, { nom: 'volume', valeur: '32 l' }, { nom: 'Couleur', valeur: 'noir' }, { nom: '', valeur: '5 kg' }, ...Array.from({ length: 20 }, (_, i) => ({ nom: `Mesure ${i}`, valeur: `${i + 1} mm` }))];
    const s = lis(fiche({ nom: 'Marley Kellerablauf', prix: 31.95, devise: 'CHF', taxe: 'ht', prixDes: true, caracteristiques }));
    expect(s.page?.taxe).toBe('ht'); expect(s.page?.prixDes).toBe(true);
    expect(s.page?.valeurs?.length).toBeLessThanOrEqual(12);
    expect(s.page?.valeurs?.[0]).toEqual({ nom: 'Volume', valeur: '30 l' });
    expect(s.page?.valeurs?.some((v) => v.nom === 'Couleur')).toBe(false);
    expect(s.page?.valeurs?.filter((v) => v.nom.toLowerCase() === 'volume')).toHaveLength(1);
    expect(s.etape).toMatchObject({ statut: 'douteux', detail: expect.stringContaining('caract Couleur') });
  });

  it('une réponse sans rien de retiré : trouvé ; aucun champ absent n\'est rempli (ni 0, ni photo, ni vendeur)', () => {
    const s = lis(fiche({ nom: 'Marley Kellerablauf', prix: null, devise: null }));
    expect(s.etape.statut).toBe('trouve');
    expect(s.page).toMatchObject({ statut: 'lue', nom: 'Marley Kellerablauf' });
    expect(Object.keys(s.page ?? {})).not.toEqual(expect.arrayContaining(['prix', 'photo', 'photos', 'vendeur', 'dispo']));
    expect(s.page?.etapes?.find((e) => e.nom === 'prix')).toEqual({ nom: 'prix', statut: 'absent' });
  });
});

describe('la tâche lireLien : l\'écran voit « en cours » puis l\'étape ; le document garde la page', () => {
  it('appelBloquee passe jusqu\'à lireLien ; enCours « bloquee » avant la réponse de Google, retiré à l\'étape', async () => {
    const docs = new Map<string, DocLecture>(), ecritures: string[] = [];
    const magasin: MagasinLecture = {
      lire: async (j) => docs.get(j),
      ecrire: async (j, d) => { docs.set(j, structuredClone(d)); ecritures.push(d.statut + (d.enCours ? `+${d.enCours}` : '')); }
    };
    const { lien, lecture } = google(6);
    const appelBloquee = vi.fn<AppelPageBloquee>(async () => lecture);
    const { fetchPage } = bloquee(lien, { 'cf-mitigated': 'challenge' });
    const morceaux: Array<Record<string, unknown>> = [];
    const sortie = await lireLienTache({
      uid: 'u1', context: { url: lien, jeton: 'jeton-de-test-0123456789' }, magasin, appelBloquee,
      lire: (u, o) => lireLien(u, { ...o, fetchPage, maintenant: 1, cours: null }),
      envoyer: (m) => { morceaux.push(structuredClone(m)); }
    });
    expect(appelBloquee).toHaveBeenCalledTimes(1);
    expect(sortie.data).toMatchObject({ statut: 'lue', prix: 159.99, devise: 'EUR' });
    expect(ecritures).toContain('en-cours+bloquee');
    expect(ecritures.at(-1)).toBe('fini');
    expect(morceaux.some((m) => m.enCours === 'bloquee')).toBe(true);
    const fini = docs.get('jeton-de-test-0123456789');
    expect(fini?.enCours).toBeUndefined();
    expect(fini?.etapes.find((e) => e.nom === 'bloquee')?.statut).toBe('trouve');
  });
});

describe('Gemini : corps, budget et règlement de l\'outil url_context', () => {
  const settings = { temperature: 0, thinkingLevel: 'minimal' } as const;
  const corps = (extra: Record<string, unknown> = {}) => geminiBody({ systemPrompt: 'S', userText: 'Adresse de la page : https://exemple.ch/p/x', schema: { type: 'OBJECT' }, settings, ...extra });

  it('le corps ne porte que l\'outil demandé : url_context seul pour une page bloquée, jamais google_search ; aucun outil par défaut', () => {
    expect((corps() as any).tools).toBeUndefined();
    expect((corps({ urlContext: true }) as any).tools).toEqual([{ url_context: {} }]);
    expect((corps({ grounded: true }) as any).tools).toEqual([{ googleSearch: {} }]);
  });

  it('le budget réserve les pages que l\'outil lira (120 000 jetons d\'entrée) ; une configuration non vérifiable est refusée', () => {
    const sans = quoteGeminiCost('gemini-3.5-flash-lite', corps());
    const avec = quoteGeminiCost('gemini-3.5-flash-lite', corps({ urlContext: true }));
    // la différence : la réserve, plus les quelques octets de la déclaration de l'outil dans le corps
    expect(avec.inputTokens - sans.inputTokens).toBeGreaterThanOrEqual(URL_CONTEXT_RESERVED_INPUT_TOKENS);
    expect(avec.inputTokens - sans.inputTokens).toBeLessThan(URL_CONTEXT_RESERVED_INPUT_TOKENS + 200);
    expect(avec.reservedMicroChf).toBeGreaterThan(sans.reservedMicroChf);
    expect(avec.searchQueriesReserved).toBe(0);
    expect(() => quoteGeminiCost('gemini-3.5-flash-lite', { ...corps(), tools: [{ url_context: { x: 1 } }] })).toThrow(/provision vérifiable/);
    expect(() => quoteGeminiCost('gemini-3.5-flash-lite', { ...corps(), tools: [{ url_context: {} }, { urlContext: {} }] })).toThrow(/provision vérifiable/);
    expect(() => quoteGeminiCost('gemini-3.5-flash-lite', { ...corps(), tools: [{ codeExecution: {} }] })).toThrow(/n’est pas couvert/);
  });

  it('le règlement compte les pages lues (toolUsePromptTokenCount) en entrée, pas en sortie : la réponse réelle de la page 6 coûte 0,0042 CHF', () => {
    const quote = quoteGeminiCost('gemini-3.5-flash-lite', corps({ urlContext: true }));
    const reel = observedGeminiCostDetails(quote, fixture(6).brut);
    // (289 + 7 542) × 0,30 + 407 × 2,50 USD par million, × 1,25 = 4 209 micro-CHF ; compté en sortie, 7 831 jetons à 2,50 auraient coûté 6 fois plus.
    expect(reel?.tokenMicroChf).toBe(4209);
    const sansOutil = { usageMetadata: { promptTokenCount: 289, candidatesTokenCount: 407, totalTokenCount: 696 } };
    expect(observedGeminiCostDetails(quote, sansOutil)?.tokenMicroChf).toBe(Math.ceil((289 * 300_000 + 407 * 2_500_000) * 5 / 4_000_000));
    expect(observedGeminiCostDetails(quote, { usageMetadata: { ...fixture(6).brut.usageMetadata, toolUsePromptTokenCount: -1 } })).toBeNull();
    // le règlement de la recherche ancrée ne change pas : ses jetons d'outil restent dans le total, au tarif de sortie, comme avant
    const recherche = quoteGeminiCost('gemini-3.5-flash-lite', corps({ grounded: true }));
    const usage = { promptTokenCount: 1000, toolUsePromptTokenCount: 9000, candidatesTokenCount: 10, totalTokenCount: 10010 };
    expect(observedGeminiCostDetails(recherche, { candidates: [{ groundingMetadata: { webSearchQueries: ['x'] } }], usageMetadata: usage })?.tokenMicroChf)
      .toBe(Math.ceil((1000 * 300_000 + 9010 * 2_500_000) * 5 / 4_000_000));
  });
});
