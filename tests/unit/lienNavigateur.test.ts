// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { domaineRacine, estDefi, lireAvecNavigateur, nomDeAdresse, type Lanceur, type NavigateurNav, type PageNav, type RequetePage } from '../../functions/src/lienNavigateur';

/** Un faux navigateur : aucune dépendance, aucun réseau. `reponse` décrit ce que la page rend. */
function faux(reponse: { statut: number; html: string; url?: string; entetes?: Record<string, string>; erreur?: string; lent?: boolean }) {
  const fermer = vi.fn(async () => undefined);
  const abandons: string[] = [];
  let gestionnaire: ((r: RequetePage) => void) | undefined;
  const page: PageNav = {
    setRequestInterception: async () => undefined,
    on: (_e, f) => { gestionnaire = f; },
    setUserAgent: vi.fn(async () => undefined),
    setExtraHTTPHeaders: async () => undefined,
    goto: async (url) => {
      if (reponse.lent) await new Promise((r) => setTimeout(r, 5000));
      if (reponse.erreur) throw new Error(reponse.erreur);
      void url;
      return { status: () => reponse.statut, headers: () => reponse.entetes ?? {} };
    },
    content: async () => reponse.html,
    url: () => reponse.url ?? 'https://boutique.example/produit',
  };
  const nav: NavigateurNav = { newPage: async () => page, userAgent: async () => 'Mozilla/5.0 HeadlessChrome/126.0 Safari/537.36', close: fermer };
  const lanceur: Lanceur = async () => nav;
  const requete = (url: string, type = 'document'): { r: RequetePage; abort: ReturnType<typeof vi.fn>; suite: ReturnType<typeof vi.fn> } => {
    const abort = vi.fn(async () => { abandons.push(url); }), suite = vi.fn(async () => undefined);
    return { r: { url: () => url, resourceType: () => type, isNavigationRequest: () => type === 'document', abort, continue: suite }, abort, suite };
  };
  return { lanceur, fermer, page, requete, envoyer: (r: RequetePage) => gestionnaire?.(r), abandons };
}

const FICHE = `<html><head><title>Fermenteur 30 l</title></head><body>${'<p>Fermenteur inox 30 l, 159,99 EUR</p>'.repeat(60)}</body></html>`;
const URL_BOUTIQUE = 'https://boutique.example/produit/fermenteur-30-l';

describe('lireAvecNavigateur', () => {
  it('rend le HTML d\'une fiche lue, et ferme le navigateur', async () => {
    const f = faux({ statut: 200, html: FICHE, url: URL_BOUTIQUE });
    const r = await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: f.lanceur });
    expect(r).toMatchObject({ ok: true, statut: 200, urlFinale: URL_BOUTIQUE });
    if (r.ok) expect(r.html).toContain('Fermenteur inox');
    await vi.waitFor(() => expect(f.fermer).toHaveBeenCalledTimes(1));
  });

  it('écrit « Chrome » et non « HeadlessChrome » dans l\'agent, rien d\'autre', async () => {
    const f = faux({ statut: 200, html: FICHE });
    await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: f.lanceur });
    expect(f.page.setUserAgent).toHaveBeenCalledWith('Mozilla/5.0 Chrome/126.0 Safari/537.36');
  });

  it('un défi Cloudflare (titre, ou 403 sans contenu) rend « bloquee » : jamais franchi', async () => {
    const defi = '<html><head><title>Just a moment...</title></head><body>Checking your browser</body></html>';
    expect(await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: faux({ statut: 403, html: defi }).lanceur })).toMatchObject({ ok: false, echec: 'bloquee' });
    expect(await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: faux({ statut: 200, html: defi }).lanceur })).toMatchObject({ ok: false, echec: 'bloquee' });
    expect(await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: faux({ statut: 403, html: '<html>non</html>' }).lanceur })).toMatchObject({ ok: false, echec: 'bloquee' });
    expect(await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: faux({ statut: 200, html: FICHE, entetes: { 'cf-mitigated': 'challenge' } }).lanceur })).toMatchObject({ ok: false, echec: 'bloquee' });
  });

  it('un renvoi en erreur vers un autre site (connexion) est une porte fermée, pas une fiche disparue', async () => {
    const r = await lireAvecNavigateur('https://www.jumbo.ch/de/p/5866824', 5000, { lanceur: faux({ statut: 404, html: '<html>' + 'x'.repeat(30_000) + '</html>', url: 'https://login.supercard.ch/cas/oidc/authorize' }).lanceur });
    expect(r).toMatchObject({ ok: false, echec: 'bloquee' });
  });

  it('404 sur le même site : introuvable ; 500 : indisponible', async () => {
    const grosse = '<html>' + 'x'.repeat(30_000) + '</html>';
    expect(await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: faux({ statut: 404, html: grosse, url: URL_BOUTIQUE }).lanceur })).toMatchObject({ ok: false, echec: 'introuvable' });
    expect(await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: faux({ statut: 500, html: grosse, url: URL_BOUTIQUE }).lanceur })).toMatchObject({ ok: false, echec: 'indisponible' });
  });

  it('refuse une adresse interne sans lancer le navigateur', async () => {
    const lanceur = vi.fn();
    expect(await lireAvecNavigateur('https://localhost/x', 5000, { lanceur })).toMatchObject({ ok: false, echec: 'indisponible', detail: 'adresse refusée' });
    expect(await lireAvecNavigateur('http://boutique.example/x', 5000, { lanceur })).toMatchObject({ ok: false });
    expect(lanceur).not.toHaveBeenCalled();
  });

  it('ne lève jamais : un lancement qui échoue (paquet absent, mémoire) rend « indisponible »', async () => {
    const r = await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: async () => { throw new Error('Cannot find module puppeteer-core'); } });
    expect(r).toMatchObject({ ok: false, echec: 'indisponible' });
  });

  it('le délai est dur et le navigateur est fermé quand même', async () => {
    const f = faux({ statut: 200, html: FICHE, lent: true });
    const t0 = Date.now();
    const r = await lireAvecNavigateur(URL_BOUTIQUE, 2000, { lanceur: f.lanceur });
    expect(r).toMatchObject({ ok: false, echec: 'delai' });
    expect(Date.now() - t0).toBeLessThan(4000);
  }, 10_000);

  it('coupe images, polices et styles, et toute navigation vers une adresse interne', async () => {
    const f = faux({ statut: 200, html: FICHE });
    await lireAvecNavigateur(URL_BOUTIQUE, 5000, { lanceur: f.lanceur });
    const image = f.requete('https://boutique.example/a.jpg', 'image');
    f.envoyer(image.r);
    const interne = f.requete('https://metadata.google.internal/computeMetadata/v1/', 'document');
    f.envoyer(interne.r);
    const script = f.requete('https://boutique.example/app.js', 'script');
    f.envoyer(script.r);
    const bon = f.requete('https://boutique.example/produit', 'document');
    f.envoyer(bon.r);
    expect(image.abort).toHaveBeenCalled();
    expect(interne.abort).toHaveBeenCalled();
    expect(script.suite).toHaveBeenCalled();
    expect(bon.suite).toHaveBeenCalled();
  });
});

describe('estDefi', () => {
  it('reconnaît les défis du banc (brouwland, braumarkt, bauhaus) et laisse passer une fiche', () => {
    expect(estDefi('<title>Just a moment...</title>', 403)).toBe(true);
    expect(estDefi('<title>Attention Required! | Cloudflare</title>', 403)).toBe(true);
    expect(estDefi('<title>Client Challenge</title>', 200)).toBe(true);
    expect(estDefi('<title>Sicherheitsprüfung</title>', 200)).toBe(true);
    expect(estDefi(FICHE, 200)).toBe(false);
    expect(estDefi('<title>Fermenteur</title><body>Just a moment of silence</body>' + 'x'.repeat(30_000), 200)).toBe(false);
  });
});

describe('nomDeAdresse', () => {
  it('tire un nom lisible de l\'adresse, sans identifiant', () => {
    expect(nomDeAdresse('https://www.hobbybrauerversand.de/Gaer-und-Lagerfass-Universal-15-Liter')).toBe('Gaer und Lagerfass Universal 15 Liter');
    expect(nomDeAdresse('https://brouwland.com/fr/cuves-de-fermentation/21565-easybrew-cuve-de-fermentation-30-l-en-inox-tc.html')).toBe('easybrew cuve de fermentation 30 l en inox tc');
    expect(nomDeAdresse('https://www.bauhaus.ch/de/p/marley-kellerablauf-13503267')).toBe('marley kellerablauf');
  });
  it('ne rend rien plutôt qu\'un nom inventé', () => {
    expect(nomDeAdresse('https://boutique.example/')).toBeUndefined();
    expect(nomDeAdresse('https://boutique.example/p/12345678')).toBeUndefined();
    expect(nomDeAdresse('pas une adresse')).toBeUndefined();
  });
});

describe('domaineRacine', () => {
  it('compare les sites', () => {
    expect(domaineRacine('https://www.jumbo.ch/de/p/1')).toBe('jumbo.ch');
    expect(domaineRacine('https://login.supercard.ch/x')).toBe('supercard.ch');
    expect(domaineRacine('n\'importe quoi')).toBe('');
  });
});
