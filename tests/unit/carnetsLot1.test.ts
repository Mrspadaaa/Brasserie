// Lot 1 du Carnet en ligne (LISTE.md, § Lot 1) : rangement par l'IA et lecture des liens. Gemini toujours simulé : aucun réseau, aucun
// appel à la passerelle (espion vérifié à la fin).
import { afterAll, describe, expect, it, vi } from 'vitest';

const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { AVIS, creerRangement, prixEcrits, type AppelsIA } from '../../src/ui/carnets/rangement';
import { critereTireDe, lireReponse, type CarnetPourIA, type LigneCarnet, type PageLue } from '../../src/domain/carnets/ia';
import { analyserTexte, type LigneLocale } from '../../src/domain/carnets/analyseLocale';
import { lireLien } from '../../functions/src/lireLien';
import { GEMINI_UNUSABLE_MESSAGES } from '../../functions/src/geminiResponse';
import { raisonNonLue, texteBandeau } from '../../src/ui/carnets/Bandeau';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

const LIEN = 'https://www.ggmgastro.com/fr-ch-chf/chambre-froide-1800-x-1500';
const PAGE_LUE: PageLue = {
  url: LIEN, domaine: 'ggmgastro.com', statut: 'lue', nom: 'Chambre froide 1800 x 1500 mm', prix: 2763.65, devise: 'CHF',
  photo: 'https://www.ggmgastro.com/img/chambre.jpg', luLe: 1
};
const OUVERT: CarnetPourIA = { id: 'c-ouvert', titre: 'ZZ TEST — système de brassage tout-en-un' };
const CHAMBRE: CarnetPourIA = { id: 'c-chambre', titre: 'Chambre froide', criteres: [{ texte: 'Volume utile', caracteristique: { nom: 'volume', unite: 'm³', sens: 'plus' } }] };

/** Le déroulé d'un envoi avec la vraie analyse locale ; les écritures sont notées dans l'ordre, avec l'état au moment de chacune. */
function banc(appels: AppelsIA, depuis: string | null = OUVERT.id) {
  const journal: string[] = [];
  const ia: Array<{ lignes: LigneCarnet[]; rangement: string }> = [];
  const r = creerRangement<LigneLocale>({
    mode: 'production', depuis, carnets: () => [OUVERT, CHAMBRE], enLigne: () => true, analyseLocale: analyserTexte, appels,
    ecrireLocal: () => { journal.push('local'); return { messageId: 'm1' }; },
    ecrireIA: (_id, lignes, rangement) => { journal.push(`ecrireIA:${rangement}`); ia.push({ lignes, rangement }); },
    surEtat: e => journal.push(e.etape)
  });
  return { r, journal, ia };
}
const appels = (ranger: AppelsIA['ranger'], page: PageLue = PAGE_LUE): AppelsIA => ({ ranger: vi.fn(ranger), lire: vi.fn(async () => page) });

describe('L-1 : la page lue n’est jamais perdue quand le rangement échoue', () => {
  it('panne du rangement après une lecture « lue » : l’article reçoit nom, prix et photo, puis l’échec est dit', async () => {
    const { r, journal, ia } = banc(appels(async () => ({ ok: false, error: 'panne' })));
    const fin = await r.envoyer(LIEN);
    expect(fin.etape).toBe('echec');
    expect(ia).toHaveLength(1);
    expect(ia[0].rangement).toBe('locale');
    const art = ia[0].lignes.find(l => l.sorte === 'article')!;
    expect(art.page).toMatchObject({ statut: 'lue', nom: 'Chambre froide 1800 x 1500 mm', photo: PAGE_LUE.photo });
    expect(art.prixCentimes).toBe(276365);
    expect(art.origine).toBe('locale');
    // l'écriture de repli d'abord (le retour local garde son Annuler), l'échec ensuite (son avis s'y pose)
    expect(journal.indexOf('ecrireIA:locale')).toBeLessThan(journal.lastIndexOf('echec'));
  });

  it('réponse illisible, exception ou délai : même repli', async () => {
    for (const ranger of [async () => ({ ok: true, data: { rien: 1 } }), async () => { throw new Error('réseau'); }]) {
      const { r, ia } = banc(appels(ranger));
      expect((await r.envoyer(`voir ${LIEN}`)).etape).toBe('echec');
      expect(ia[0]?.lignes.find(l => l.sorte === 'article')?.page?.statut).toBe('lue');
    }
    const lent = creerRangement<LigneLocale>({
      mode: 'production', depuis: OUVERT.id, carnets: () => [OUVERT], enLigne: () => true, analyseLocale: analyserTexte, delaiMs: 30,
      appels: appels(() => new Promise(() => undefined)), ecrireLocal: () => ({ messageId: 'm1' }), ecrireIA: (_i, l, m) => { ecrits.push({ l, m }); }
    });
    const ecrits: Array<{ l: LigneCarnet[]; m: string }> = [];
    const e = await lent.envoyer(LIEN);
    expect(e).toMatchObject({ etape: 'echec', avis: AVIS.delai });
    expect(ecrits[0]?.l.find(l => l.sorte === 'article')?.page?.statut).toBe('lue');
  });

  it('page non lue puis rangement en panne : l’article sort de « lecture… » (page non lue), rien d’inventé', async () => {
    const { r, ia } = banc(appels(async () => ({ ok: false }), { url: LIEN, domaine: 'ggmgastro.com', statut: 'bloquee', luLe: 1 }));
    await r.envoyer(LIEN);
    const art = ia[0].lignes.find(l => l.sorte === 'article')!;
    expect(art.page?.statut).toBe('bloquee');
    expect(art.prixCentimes).toBeUndefined();
  });

  it('sans lien : aucun repli, les effets locaux restent (comportement d’avant)', async () => {
    const { r, ia } = banc(appels(async () => ({ ok: false })));
    expect((await r.envoyer('vanne papillon en bas')).etape).toBe('echec');
    expect(ia).toHaveLength(0);
  });
});

describe('L-3 : réponse coupée au plafond de sortie', () => {
  it('l’avis dit « L’IA a mis trop de temps », et la page lue tient (L-1)', async () => {
    const { r, ia } = banc(appels(async () => ({ ok: false, error: GEMINI_UNUSABLE_MESSAGES.truncated })));
    const e = await r.envoyer(LIEN);
    expect(e).toMatchObject({ etape: 'echec', avis: AVIS.delai });
    expect(ia[0].lignes.find(l => l.sorte === 'article')?.prixCentimes).toBe(276365);
  });
});

describe('L-2 : depuis la liste, un carnet existant n’est jamais écrit sans confirmation', () => {
  it('un critère rangé par l’IA dans Chambre froide depuis la liste reste là où l’aperçu l’annonçait ; Chambre froide est seulement suggérée', () => {
    const texte = 'ZZ TEST — M3 — cellule de garde 2,6 m3';
    const brut = { lignes: [
      { sorte: 'critere', texte: '2,6 m³', carnetId: CHAMBRE.id, caracteristique: { nom: 'volume', unite: 'm³', sens: 'plus' } },
      { sorte: 'idee', texte, carnetId: CHAMBRE.id, titrePropose: 'Cellule de garde' }
    ] };
    const lignes = lireReponse(brut, { texte, carnets: [OUVERT, CHAMBRE], depuis: null })!;
    expect(lignes.every(l => l.carnetId === undefined)).toBe(true);
    expect(lignes.every(l => l.carnetNeuf === undefined)).toBe(true);
    expect(lignes.find(l => l.sorte === 'critere')?.carnetSuggere).toBe(CHAMBRE.id);
    expect(lignes.some(l => l.titrePropose)).toBe(false);
  });

  it('depuis un carnet ouvert, le carnet rendu par l’IA fait toujours foi (inchangé)', () => {
    const lignes = lireReponse({ lignes: [{ sorte: 'note', texte: 'Isoler le sol', carnetId: CHAMBRE.id }] }, { texte: 'isoler le sol', carnets: [OUVERT, CHAMBRE], depuis: OUVERT.id })!;
    expect(lignes[0].carnetId).toBe(CHAMBRE.id);
  });
});

describe('L-5 : aucune ligne d’une note de trois lignes ne disparaît', () => {
  it('la ligne que l’IA rend en « idée » du carnet ouvert (jetée à l’écran) est gardée en note', () => {
    const texte = 'système 100 L en une fois\nVoir si existe en 230V sinon prévoir prise 400V\ncomparer avec Speidel';
    const brut = { lignes: [
      { sorte: 'idee', texte: 'système 100 L en une fois', carnetId: OUVERT.id },
      { sorte: 'note', texte: 'Voir si existe en 230V sinon prévoir prise 400V', carnetId: OUVERT.id },
      { sorte: 'note', texte: 'Comparer avec Speidel', carnetId: OUVERT.id }
    ] };
    const lignes = lireReponse(brut, { texte, carnets: [OUVERT], depuis: OUVERT.id })!;
    const notes = lignes.filter(l => l.sorte === 'note');
    expect(notes.map(n => n.texte)).toContain('système 100 L en une fois');
    expect(notes).toHaveLength(3);
  });

  it('une ligne que l’IA ne rend pas du tout est gardée ; une reformulation n’ajoute rien', () => {
    const texte = 'pompe 40 L/min\nvoir le prix chez Brouwland';
    const lignes = lireReponse({ lignes: [{ sorte: 'critere', texte: 'Débit de 40 L/min au moins', carnetId: OUVERT.id }] }, { texte, carnets: [OUVERT], depuis: OUVERT.id })!;
    expect(lignes.map(l => l.texte)).toEqual(['Débit de 40 L/min au moins', 'voir le prix chez Brouwland']);
  });
});

describe('L-6 : un critère tiré de sa phrase le dit', () => {
  it('cas de M1-13', () => {
    expect(critereTireDe('Vanne papillon en bas', { nom: 'vanne papillon' }, 'doit tenir 2 bar, vanne papillon en bas')).toBe(true);
    expect(critereTireDe('Tenir 2 bar', { nom: 'pression' }, 'doit tenir 2 bar, vanne papillon en bas')).toBe(true);
    expect(critereTireDe('Budget max 400 CHF', { nom: 'budget', unite: 'CHF' }, 'fermenteur conique inox 30 L, budget 400 CHF')).toBe(true);
  });
  it('un critère repris d’un critère de sa phrase déjà dans le carnet reste « de votre phrase »', () => {
    const carnet: CarnetPourIA = { id: 'c-f', titre: 'Fermenteur', criteres: [{ texte: 'budget 400 CHF', origine: 'locale' }] };
    const [k] = lireReponse({ lignes: [{ sorte: 'critere', texte: 'Budget max 400 CHF', carnetId: 'c-f' }] }, { texte: 'doit tenir 2 bar', carnets: [carnet], depuis: 'c-f' })!;
    expect(k.source).toBe('phrase');
  });
  it('ce que l’IA ajoute de son cru reste « proposé par l’IA »', () => {
    expect(critereTireDe('le débit', { nom: 'débit' }, 'pompe de transfert inox')).toBe(false);
    expect(critereTireDe('Pression de service 6 bar', { nom: 'pression' }, 'doit tenir 2 bar')).toBe(false);
  });
});

describe('L-7 : un lien sans prix n’est jamais une note dont le texte est l’adresse', () => {
  it('la note prend le nom lu de la page ; le lien reste sur la ligne ; « conseil » devient note', () => {
    const url = 'https://fr.wikipedia.org/wiki/Pompe_centrifuge';
    const page: PageLue = { url, domaine: 'fr.wikipedia.org', statut: 'lue', nom: 'Pompe centrifuge — Wikipédia', luLe: 1 };
    const [n] = lireReponse({ lignes: [{ sorte: 'note', genre: 'conseil', texte: url, url }] }, { texte: url, carnets: [OUVERT], depuis: OUVERT.id, pages: [page] })!;
    expect(n.texte).toBe('Pompe centrifuge — Wikipédia (fr.wikipedia.org)');
    expect(n.url).toBe(url);
    expect(n.genre).toBe('note');
  });
});

describe('L-8 : un budget n’est pas le prix d’un article', () => {
  it('prixEcrits ne pose pas « budget 400 CHF » sur l’article sans prix de l’IA', () => {
    const texte = 'fermenteur conique inox 30 L, budget 400 CHF';
    const ia: LigneCarnet[] = [{ sorte: 'article', texte: 'Fermenteur conique inox 30 L', origine: 'ia' }];
    expect(prixEcrits(ia, analyserTexte(texte))[0].prixCentimes).toBeUndefined();
    expect(prixEcrits(ia, analyserTexte('fermenteur conique inox 30 L à 400 CHF'))[0].prixCentimes).toBe(40000);
  });
});

describe('L-4 : un lien non lu dit pourquoi ; un domaine inexistant n’est pas « robots »', () => {
  const page = 'https://boutique-exemple.ch/levure';
  const robots = 'https://boutique-exemple.ch/robots.txt';
  const reseau = (routes: Record<string, () => Response | Promise<Response>>) =>
    vi.fn(async (e: RequestInfo | URL) => { const r = routes[String(e)]; if (!r) throw new Error(`réseau interdit : ${String(e)}`); return r(); }) as unknown as typeof fetch;
  const dns = () => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }); };

  it('DNS introuvable → « introuvable » ; panne réseau → « indisponible » ; robots en 5xx reste un refus (RFC 9309)', async () => {
    expect((await lireLien('https://pompe-zz-test.invalid/p', { fetchPage: reseau({ 'https://pompe-zz-test.invalid/robots.txt': dns }) })).statut).toBe('introuvable');
    expect((await lireLien(page, { fetchPage: reseau({}) })).statut).toBe('indisponible');
    expect((await lireLien(page, { fetchPage: reseau({ [robots]: () => new Response('x', { status: 503 }) }) })).statut).toBe('robots');
  });

  it('page refusée au robot (403 Cloudflare, 429) → « bloquee »', async () => {
    const cf = () => new Response('<html>challenge</html>', { status: 403, headers: { 'content-type': 'text/html', 'cf-mitigated': 'challenge' } });
    expect((await lireLien(page, { fetchPage: reseau({ [robots]: () => new Response('User-agent: *\nAllow: /', { status: 200 }), [page]: cf }) })).statut).toBe('bloquee');
    expect((await lireLien(page, { fetchPage: reseau({ [robots]: () => new Response('', { status: 404 }), [page]: () => new Response('', { status: 429 }) }) })).statut).toBe('bloquee');
  });

  it('le bandeau dit la raison en mots', () => {
    expect(raisonNonLue('bloquee')).toMatch(/bloque/);
    expect(texteBandeau({ sorte: 'lien', url: page, lu: false, statut: 'introuvable' })).toBe('✓ Lien rangé ici · page non lue : adresse introuvable');
    expect(texteBandeau({ sorte: 'lien', url: page, lu: false })).toBe('✓ Lien rangé ici · page non lue');
  });
});
