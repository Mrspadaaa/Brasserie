// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { lireLien } from '../../functions/src/lireLien';
import { cumuler, jetonValide, lireLienTache, vueDe, LECTURE_PERIMEE_MS, type DocLecture, type MagasinLecture } from '../../functions/src/lecturesLiens';
import type { AppelIA, ReponseIA } from '../../functions/src/lienIA';
import type { EtapeLien, PageLue } from '../../functions/src/carnetIA';

// Aucun réseau, aucun Firestore, aucun Gemini réel : un faux magasin, un faux réseau, un AppelIA simulé (tests D446, L11).

const JETON = 'jeton-de-test-0123456789';
const URL_PAGE = 'https://boutique-exemple.ch/products/cuve-inox';

function magasinMemoire() {
  const docs = new Map<string, DocLecture>();
  const ecritures: Array<{ jeton: string; statut: string; noms: string[] }> = [];
  const magasin: MagasinLecture = {
    lire: async (j) => docs.get(j) ? structuredClone(docs.get(j)) : undefined,
    ecrire: async (j, d) => { docs.set(j, structuredClone(d)); ecritures.push({ jeton: j, statut: d.statut + (d.enCours ? `+${d.enCours}` : ''), noms: d.etapes.map((e) => e.nom) }); }
  };
  return { magasin, docs, ecritures };
}

const e = (nom: EtapeLien['nom'], statut: EtapeLien['statut'] = 'trouve', detail?: string): EtapeLien => ({ nom, statut, ...(detail ? { detail } : {}) });
const PAGE: PageLue = { url: URL_PAGE, domaine: 'boutique-exemple.ch', statut: 'lue', nom: 'Cuve inox 50 l', prix: 120, devise: 'CHF', luLe: 1, etapes: [e('page'), e('prix'), e('ia', 'trouve', 'lite ; ajouté : prix')] };

describe('étapes au fil de l\'eau : flux et document (IA-ETAPES-VISIBLES)', () => {
  it('chaque étape part dans le flux et s\'écrit dans le document avant la page finie ; l\'IA se dit « en cours » avant sa réponse', async () => {
    const { magasin, docs, ecritures } = magasinMemoire();
    const morceaux: Array<Record<string, unknown>> = [];
    const lire = async (_url: string, opts: Parameters<typeof lireLien>[1] = {}) => {
      opts.onEtape?.(e('page', 'trouve', 'boutique-exemple.ch'));
      opts.onEtape?.(e('prix', 'absent'));
      opts.onDebut?.('ia');
      opts.onEtape?.(e('ia', 'trouve', 'lite ; ajouté : prix'));
      return PAGE;
    };
    const sortie = await lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON }, magasin, lire, envoyer: (m) => { morceaux.push(structuredClone(m)); } });

    expect(sortie.data).toEqual(PAGE);
    // 1. le jeton arrive dans le tout premier envoi, sans étape : l'app peut le retrouver même si elle se ferme aussitôt
    expect(morceaux[0]).toEqual({ etape: 'lecture', jeton: JETON, etapes: [] });
    // 2. les étapes s'accumulent dans l'ordre de la lecture
    expect(morceaux.map((m) => (m.etapes as EtapeLien[]).map((x) => x.nom).join('>'))).toEqual(['', 'page', 'page>prix', 'page>prix', 'page>prix>ia']);
    // 3. « en cours » est dit avant la réponse de l'IA, puis retiré quand son étape arrive
    expect(morceaux[3]).toMatchObject({ enCours: 'ia' });
    expect(morceaux[4]).not.toHaveProperty('enCours');
    // 4. le document passe par « en cours » (étapes déjà là) avant « fini » ; la page gardée est celle rendue
    expect(ecritures.map((x) => x.statut)).toEqual(['en-cours', 'en-cours', 'en-cours', 'en-cours+ia', 'en-cours', 'fini']);
    expect(ecritures[2].noms).toEqual(['page', 'prix']);
    expect(docs.get(JETON)).toMatchObject({ uid: 'u1', url: URL_PAGE, statut: 'fini', page: PAGE });
    expect(docs.get(JETON)?.enCours).toBeUndefined();
  });

  it('sans flux (ancien client, appel sans SSE) : le final seul revient, le document est tout de même écrit ; sans jeton, le serveur en tire un', async () => {
    const { magasin, docs } = magasinMemoire();
    const sortie = await lireLienTache({ uid: 'u1', context: { url: URL_PAGE }, magasin, lire: async () => PAGE, nouveauJeton: () => 'jeton-serveur-0123456789' });
    expect(sortie).toMatchObject({ ok: true, data: PAGE, model: 'lecture' });
    expect(docs.get('jeton-serveur-0123456789')?.statut).toBe('fini');
  });

  it('app fermée en pleine lecture : la reprise rend les étapes déjà lues, puis la page quand elle est finie', async () => {
    const { magasin } = magasinMemoire();
    let finir!: () => void;
    const attente = new Promise<void>((r) => { finir = r; });
    const lire = async (_u: string, opts: Parameters<typeof lireLien>[1] = {}) => {
      opts.onEtape?.(e('page'));
      opts.onDebut?.('ia');
      await attente;
      opts.onEtape?.(e('ia', 'trouve', 'lite'));
      return PAGE;
    };
    const lecture = lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON }, magasin, lire });
    await new Promise((r) => setTimeout(r, 5));
    // « réouverture » : un autre appel, sans rien lancer
    const enCours = await lireLienTache({ uid: 'u1', context: { jeton: JETON, reprise: true }, magasin, lire: async () => { throw new Error('jamais relancée'); } });
    expect(enCours.data).toMatchObject({ statut: 'en-cours', jeton: JETON, enCours: 'ia', etapes: [e('page')] });
    finir(); await lecture;
    const fini = await lireLienTache({ uid: 'u1', context: { jeton: JETON, reprise: true }, magasin });
    expect(fini.data).toMatchObject({ statut: 'fini', page: PAGE });
    expect(fini.data).not.toHaveProperty('enCours');
  });

  it('reprise : un autre compte, un jeton inconnu ou mal formé ne voient rien ; une lecture plantée devient « echec »', async () => {
    const { magasin, docs } = magasinMemoire();
    docs.set(JETON, { uid: 'u1', url: URL_PAGE, statut: 'en-cours', etapes: [e('page')], creeLe: 0, majLe: 0 });
    const lire = async () => { throw new Error('jamais'); };
    expect((await lireLienTache({ uid: 'u2', context: { jeton: JETON, reprise: true }, magasin, lire })).data).toMatchObject({ statut: 'inconnue', etapes: [] });
    expect((await lireLienTache({ uid: 'u1', context: { jeton: 'x', reprise: true }, magasin, lire })).data).toMatchObject({ statut: 'inconnue' });
    expect((await lireLienTache({ uid: 'u1', context: { reprise: true }, magasin, lire })).data).toMatchObject({ statut: 'inconnue' });
    expect(vueDe(JETON, docs.get(JETON), 'u1', LECTURE_PERIMEE_MS + 1)).toMatchObject({ statut: 'echec', erreur: 'Lecture interrompue.', etapes: [e('page')] });
    expect(vueDe(JETON, docs.get(JETON), 'u1', 1000).statut).toBe('en-cours');
  });

  it('un jeton déjà fini rend la page gardée sans relire ni payer ; un jeton d\'un autre compte n\'est jamais repris', async () => {
    const { magasin, docs } = magasinMemoire();
    docs.set(JETON, { uid: 'u1', url: URL_PAGE, statut: 'fini', etapes: PAGE.etapes!, page: PAGE, creeLe: 0, majLe: 0 });
    const lire = vi.fn(async () => ({ ...PAGE, nom: 'Relue' }));
    expect((await lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON }, magasin, lire })).data).toEqual(PAGE);
    expect(lire).not.toHaveBeenCalled();
    const autre = await lireLienTache({ uid: 'u2', context: { url: URL_PAGE, jeton: JETON }, magasin, lire, nouveauJeton: () => 'jeton-neuf-0123456789ab' });
    expect(lire).toHaveBeenCalledTimes(1);
    expect(autre.data).toMatchObject({ nom: 'Relue' });
    expect(docs.get(JETON)?.uid).toBe('u1');
    expect(docs.get('jeton-neuf-0123456789ab')?.uid).toBe('u2');
  });

  it('une panne du suivi (Firestore, flux) n\'arrête jamais la lecture ; une lecture qui lève rend « echec », jamais une exception', async () => {
    const avertis: string[] = [];
    const cassé: MagasinLecture = { lire: async () => { throw new Error('hors ligne'); }, ecrire: async () => { throw new Error('hors ligne'); } };
    const ok = await lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON }, magasin: cassé, lire: async () => PAGE, envoyer: () => { throw new Error('flux coupé'); }, avertir: (m) => avertis.push(m) });
    expect(ok.data).toEqual(PAGE);
    expect(avertis.length).toBeGreaterThan(0);
    const { magasin, docs } = magasinMemoire();
    const ko = await lireLienTache({ uid: 'u1', context: { url: URL_PAGE, jeton: JETON }, magasin, lire: async () => { throw new Error('boum'); } });
    expect(ko.data).toMatchObject({ statut: 'echec', erreur: 'boum' });
    expect(docs.get(JETON)?.statut).toBe('echec');
  });

  it('cumuler remplace une étape redite à sa place ; jetonValide refuse tout ce qui n\'est pas un jeton', () => {
    expect(cumuler([e('page'), e('caract', 'absent')], e('caract', 'trouve', '5')).map((x) => `${x.nom}:${x.statut}`)).toEqual(['page:trouve', 'caract:trouve']);
    expect(jetonValide(JETON)).toBe(JETON);
    for (const mauvais of [undefined, '', 'court', 'a/b'.padEnd(20, 'x'), 'x'.repeat(65), 42]) expect(jetonValide(mauvais)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------------------------------------------

const robots = 'https://boutique-exemple.ch/robots.txt';
const json = 'https://boutique-exemple.ch/products/cuve-inox.js';
const pageShopify = (extra = '') => `<!doctype html><html><head><title>Cuve inox 50 l</title><link href="https://cdn.shopify.com/s/x.css">
<script type="application/ld+json">{"@type":"Product","name":"Cuve inox 50 l","offers":{"@type":"Offer","price":"120.00","priceCurrency":"CHF"}}</script></head>
<body><h1>Cuve inox 50 l</h1>${extra}</body></html>`;
const ficheShopify = JSON.stringify({ title: 'Cuve inox 50 l', description: '<ul><li>Volume : 50 l</li><li>Puissance : 3000 W</li><li>Hauteur : 120 cm</li><li>Poids : 12 kg</li></ul>', images: ['//cdn.shopify.com/s/cuve.jpg'], options: [] });
const reponse = (corps: string, type: string, statut = 200) => new Response(corps, { status: statut, headers: { 'content-type': type } });

function faussesRoutes(routes: Record<string, () => Response>) {
  const demandes: string[] = [];
  const fetchPage = (async (entree: RequestInfo | URL) => {
    const u = String(entree); demandes.push(u);
    const r = routes[u]; if (!r) throw new Error(`réseau interdit dans les tests : ${u}`);
    return r();
  }) as unknown as typeof fetch;
  return { fetchPage, demandes };
}

describe('marche plateforme (Shopify) : appelée quand la page laisse un manque, dans les règles du robot', () => {
  it('la fiche JSON de la boutique ajoute les mesures et la photo manquantes ; rien n\'est remplacé ; les étapes le disent', async () => {
    const { fetchPage, demandes } = faussesRoutes({ [robots]: () => reponse('', 'text/plain', 404), [URL_PAGE]: () => reponse(pageShopify(), 'text/html'), [json]: () => reponse(ficheShopify, 'application/json') });
    const vues: EtapeLien[] = [];
    const p = await lireLien(URL_PAGE, { fetchPage, maintenant: 1, cours: null, onEtape: (x) => vues.push(x) });
    expect(demandes).toEqual([robots, URL_PAGE, json]);
    expect(p).toMatchObject({ statut: 'lue', prix: 120, photo: 'https://cdn.shopify.com/s/cuve.jpg' });
    expect(p.valeurs?.map((v) => v.nom)).toEqual(expect.arrayContaining(['Volume', 'Puissance', 'Hauteur', 'Poids']));
    expect(p.etapes?.find((x) => x.nom === 'caract')).toMatchObject({ statut: 'trouve', detail: expect.stringContaining('fiche de la boutique') });
    // l'écran reçoit la correction de l'étape (même nom, nouveau détail)
    expect(vues.filter((x) => x.nom === 'caract').length).toBe(2);
  });

  it('robots.txt qui interdit la fiche JSON : elle n\'est jamais demandée ; page assez riche : aucun appel de plus ; JSON illisible : page inchangée', async () => {
    const interdit = faussesRoutes({ [robots]: () => reponse('User-agent: *\nDisallow: /products/*.js', 'text/plain'), [URL_PAGE]: () => reponse(pageShopify(), 'text/html') });
    const sans = await lireLien(URL_PAGE, { fetchPage: interdit.fetchPage, maintenant: 1, cours: null });
    expect(interdit.demandes).toEqual([robots, URL_PAGE]);
    expect(sans.statut).toBe('lue');

    const props = [['Volume', '50 l'], ['Puissance', '3000 W'], ['Hauteur', '120 cm'], ['Poids', '12 kg']].map(([name, value]) => ({ '@type': 'PropertyValue', name, value }));
    const riche = pageShopify().replace('"offers"', `"image":"https://boutique-exemple.ch/p.jpg","additionalProperty":${JSON.stringify(props)},"offers"`);
    const suffit = faussesRoutes({ [robots]: () => reponse('', 'text/plain', 404), [URL_PAGE]: () => reponse(riche, 'text/html') });
    await lireLien(URL_PAGE, { fetchPage: suffit.fetchPage, maintenant: 1, cours: null });
    expect(suffit.demandes).toEqual([robots, URL_PAGE]);

    const casse = faussesRoutes({ [robots]: () => reponse('', 'text/plain', 404), [URL_PAGE]: () => reponse(pageShopify(), 'text/html'), [json]: () => reponse('<html>pas du json</html>', 'application/json') });
    const inchangee = await lireLien(URL_PAGE, { fetchPage: casse.fetchPage, maintenant: 1, cours: null });
    expect(inchangee.valeurs).toEqual(sans.valeurs);
    expect(inchangee.photos).toEqual(sans.photos);
  });
});

// ---------------------------------------------------------------------------------------------------------------------------

const urlSansPrix = 'https://boutique-exemple.ch/pompe-transfert';
const pageSansPrix = `<!doctype html><html><head><title>Pompe de transfert inox</title></head><body><main><h1>Pompe de transfert inox</h1>
<p>Pompe de transfert en acier inoxydable pour le brassage, moteur silencieux, entrée et sortie en raccord Tri-Clamp, adaptée aux moûts et aux bières finies.</p>
<p>Prix : CHF 189.00 TTC. Débit 20 l/min, puissance 120 W, tension 230 V, poids 3.2 kg.</p></main></body></html>`;

describe('l\'IA en dernière marche : Flash-Lite d\'abord, Hydrogen en escalade, jamais sans garde (Gemini simulé)', () => {
  const lis = (appel: AppelIA) => lireLien(urlSansPrix, {
    fetchPage: faussesRoutes({ 'https://boutique-exemple.ch/robots.txt': () => reponse('', 'text/plain', 404), [urlSansPrix]: () => reponse(pageSansPrix, 'text/html') }).fetchPage,
    maintenant: 1, cours: null, ia: appel
  });

  it('Flash-Lite complète les caractéristiques écrites dans le texte : un seul appel, l\'étape « ia » les ajoute', async () => {
    /* D449 : quatre mesures écrites suffisent ; en dessous, Hydrogen relit (carnetsLiensModeles.test.ts) */
    const appel = vi.fn<AppelIA>(async (): Promise<ReponseIA> => ({ prix: 189, devise: 'CHF', taxe: 'ttc', caracteristiques: [{ nom: 'Débit', valeur: '20 l/min' }, { nom: 'Puissance', valeur: '120 W' }, { nom: 'Tension', valeur: '230 V' }, { nom: 'Poids', valeur: '3.2 kg' }] }));
    const debuts: string[] = [];
    const p = await lireLien(urlSansPrix, {
      fetchPage: faussesRoutes({ 'https://boutique-exemple.ch/robots.txt': () => reponse('', 'text/plain', 404), [urlSansPrix]: () => reponse(pageSansPrix, 'text/html') }).fetchPage,
      maintenant: 1, cours: null, ia: appel, onDebut: (n) => debuts.push(n)
    });
    expect(appel).toHaveBeenCalledTimes(1);
    expect(appel.mock.calls[0][0]).toBe('lite');
    expect(debuts).toEqual(['ia']);
    expect(p.valeurs?.some((v) => v.nom === 'Débit' && v.valeur === '20 l/min')).toBe(true);
    expect(p.etapes?.find((x) => x.nom === 'ia')).toMatchObject({ statut: 'trouve', detail: expect.stringContaining('caract') });
  });

  it('un prix inventé (absent du texte) est retiré par la garde, Hydrogen est appelé une fois, son prix écrit est gardé', async () => {
    const appel = vi.fn<AppelIA>(async (modele): Promise<ReponseIA> => modele === 'lite' ? { prix: 77, devise: 'CHF', caracteristiques: [] } : { prix: 189, devise: 'CHF', caracteristiques: [] });
    const p = await lis(appel);
    expect(appel.mock.calls.map((c) => c[0])).toEqual(['lite', 'fort']);
    expect(p.prix).toBe(189);
  });

  it('une panne (budget épuisé) ne s\'escalade pas et ne casse pas la lecture : la page reste, l\'étape « ia » dit absent', async () => {
    const appel = vi.fn<AppelIA>(async () => { throw new Error('Plafond mensuel IA atteint'); });
    const p = await lis(appel);
    expect(appel).toHaveBeenCalledTimes(1);
    expect(p.statut).toBe('lue');
    expect(p.prix).toBe(189); // celui de la page : l'IA ne remplace ni n'invente rien
    expect(p.etapes?.find((x) => x.nom === 'ia')).toMatchObject({ statut: 'absent', detail: expect.stringContaining('Plafond') });
  });

  it('sans appel d\'IA (clé absente) : aucune étape « ia », la lecture sans modèle reste entière', async () => {
    const p = await lireLien(urlSansPrix, {
      fetchPage: faussesRoutes({ 'https://boutique-exemple.ch/robots.txt': () => reponse('', 'text/plain', 404), [urlSansPrix]: () => reponse(pageSansPrix, 'text/html') }).fetchPage,
      maintenant: 1, cours: null
    });
    expect(p.statut).toBe('lue');
    expect(p.etapes?.some((x) => x.nom === 'ia')).toBe(false);
  });
});
