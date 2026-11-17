import { afterAll, describe, expect, it, vi } from 'vitest';

const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { AVIS, appelsSimules, creerRangement, retourDuRangement, type AppelsIA, type DependancesRangement, type EtatRangement } from '../../src/ui/carnets/rangement';
import type { CarnetPourIA, LigneCarnet, PageLue } from '../../src/domain/carnets/ia';
import type { ContexteRangerCarnet } from '../../functions/src/carnetIA';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

type Locale = { texte: string; origine: 'locale' };
const EVIER: CarnetPourIA = { id: 'c-evier', titre: 'ZZ TEST — Évier inox', notes: [{ id: 'n1', texte: 'Garder la place des seaux dessous' }] };

/** Un banc d'essai : magasin espionné, états notés dans l'ordre. */
function banc(options: Partial<DependancesRangement<Locale>> & { appels?: AppelsIA }) {
  const etapes: string[] = [];
  const ecrits = { local: [] as Array<{ texte: string; lignes: Locale[]; iaAttendue: boolean }>, ia: [] as Array<{ messageId: string; lignes: LigneCarnet[]; rangement: string }> };
  const r = creerRangement<Locale>({
    mode: 'simule', depuis: 'c-evier', carnets: () => [EVIER], enLigne: () => true,
    analyseLocale: (texte) => texte.split('\n').map((t) => ({ texte: t, origine: 'locale' as const })),
    ecrireLocal: (texte, lignes, { iaAttendue }) => { ecrits.local.push({ texte, lignes, iaAttendue }); return { messageId: `m${ecrits.local.length}` }; },
    ecrireIA: (messageId, lignes, rangement) => { ecrits.ia.push({ messageId, lignes, rangement }); },
    surEtat: (e: EtatRangement<Locale>) => { etapes.push(e.etape); },
    maintenant: () => new Date(2026, 10, 17),
    ...options
  });
  return { r, etapes, ecrits };
}

/** Un appel qu'on règle à la main. */
function differe<T>() {
  let resoudre!: (v: T) => void;
  const promesse = new Promise<T>((r) => { resoudre = r; });
  return { promesse, resoudre };
}

const repond = (data: unknown, ok = true): AppelsIA => ({
  ranger: vi.fn(async () => ({ ok, data, ...(ok ? {} : { error: 'panne' }) })),
  lire: vi.fn(async (url: string) => ({ url, domaine: 'x', statut: 'illisible' as const, luLe: 0 }))
});

describe('rangement : déroulé d\'un envoi (B5)', () => {
  it('apercu → en-cours → range : le message est écrit tout de suite, puis les effets de l\'IA le remplacent', async () => {
    const appels = repond({ lignes: [{ sorte: 'note', genre: 'a-faire', texte: 'Appeler le ferblantier' }] });
    const { r, etapes, ecrits } = banc({ appels });
    expect(r.taper('appeler le ferblantier').etape).toBe('apercu');
    const fin = await r.envoyer('appeler le ferblantier');
    expect(etapes).toEqual(['apercu', 'en-cours', 'range']);
    expect(ecrits.local).toEqual([{ texte: 'appeler le ferblantier', lignes: [{ texte: 'appeler le ferblantier', origine: 'locale' }], iaAttendue: true }]);
    expect(ecrits.ia).toHaveLength(1);
    expect(ecrits.ia[0]).toMatchObject({ messageId: 'm1', rangement: 'simulee' });
    expect(ecrits.ia[0].lignes[0]).toMatchObject({ texte: 'Appeler le ferblantier', carnetId: 'c-evier', origine: 'exemple' });
    expect(fin).toMatchObject({ etape: 'range', rangement: 'simulee' });
    // Le contexte envoyé est le contexte compact (texte, saisie, depuis, carnets).
    const ctx = (appels.ranger as ReturnType<typeof vi.fn>).mock.calls[0][0] as ContexteRangerCarnet;
    expect(ctx).toMatchObject({ texte: 'appeler le ferblantier', saisie: '2026-11-17', depuis: 'c-evier' });
    expect(ctx.carnets[0].notes).toEqual([{ id: 'n1', texte: 'Garder la place des seaux dessous' }]);
  });

  it('échec (panne) : les effets locaux restent, le message est gardé, l\'avis le dit', async () => {
    const { r, etapes, ecrits } = banc({ appels: repond(null, false) });
    const fin = await r.envoyer('une hotte ?');
    expect(etapes).toEqual(['en-cours', 'echec']);
    expect(fin).toMatchObject({ etape: 'echec', messageId: 'm1', avis: AVIS.panne });
    expect(ecrits.local).toHaveLength(1);
    expect(ecrits.ia).toHaveLength(0);
  });

  it('échec (réponse hors schéma ou vide) : repli local, avis « illisible »', async () => {
    for (const data of [{ effets: [] }, { lignes: [] }, 'x']) {
      const { r, ecrits } = banc({ appels: repond(data) });
      expect(await r.envoyer('x')).toMatchObject({ etape: 'echec', avis: AVIS.illisible });
      expect(ecrits.ia).toHaveLength(0);
    }
  });

  it('hors ligne : rangé sur l\'appareil, aucun appel, rien ne bouge au retour du réseau', async () => {
    const appels = repond({ lignes: [{ sorte: 'note', texte: 'x' }] });
    let reseau = false;
    const { r, etapes, ecrits } = banc({ appels, enLigne: () => reseau });
    expect(await r.envoyer('une note')).toMatchObject({ etape: 'hors-ligne', avis: AVIS.horsLigne });
    reseau = true;
    await new Promise((ok) => setTimeout(ok, 5));
    expect(etapes).toEqual(['hors-ligne']);
    expect(ecrits.local[0].iaAttendue).toBe(false);
    expect(appels.ranger).not.toHaveBeenCalled();
    expect(ecrits.ia).toHaveLength(0);
  });

  it('IA éteinte : rangement local seul, aucun appel', async () => {
    const appels = repond({ lignes: [{ sorte: 'note', texte: 'x' }] });
    const { r, ecrits } = banc({ appels, mode: 'eteint' });
    expect(await r.envoyer('une note')).toMatchObject({ etape: 'range', rangement: 'locale', lignes: null });
    expect(appels.ranger).not.toHaveBeenCalled();
    expect(appels.lire).not.toHaveBeenCalled();
    expect(ecrits.local[0].iaAttendue).toBe(false);
  });

  it('annuler pendant en-cours : l\'appel est coupé et rien de plus n\'est écrit, même si la réponse arrive après', async () => {
    const d = differe<{ ok: boolean; data?: unknown }>();
    let signalRecu: AbortSignal | undefined;
    const appels: AppelsIA = { ranger: vi.fn((_c, signal) => { signalRecu = signal; return d.promesse; }), lire: vi.fn() };
    const { r, etapes, ecrits } = banc({ appels });
    const envoi = r.envoyer('une hotte inox');
    await Promise.resolve(); await Promise.resolve();
    expect(r.etat().etape).toBe('en-cours');
    r.annuler();
    expect(await envoi).toMatchObject({ etape: 'annule', messageId: 'm1' });
    expect(signalRecu?.aborted).toBe(true);
    d.resoudre({ ok: true, data: { lignes: [{ sorte: 'note', texte: 'trop tard' }] } });
    await new Promise((ok) => setTimeout(ok, 5));
    expect(ecrits.ia).toHaveLength(0);
    expect(ecrits.local).toHaveLength(1);
    expect(etapes).toEqual(['en-cours', 'annule']);
    r.annuler(); // sans effet hors de en-cours
    expect(r.etat().etape).toBe('annule');
  });

  it('délai dépassé : échec, effets locaux gardés', async () => {
    const appels: AppelsIA = { ranger: vi.fn(() => new Promise(() => {})), lire: vi.fn() };
    const { r, ecrits } = banc({ appels, delaiMs: 20 });
    expect(await r.envoyer('x')).toMatchObject({ etape: 'echec', avis: AVIS.delai });
    expect(ecrits.ia).toHaveLength(0);
  });

  it('un lien : la page est lue d\'abord (état de lecture), puis son prix sert au garde', async () => {
    const page: PageLue = { url: 'https://pompe-inox.ch/p/12', domaine: 'pompe-inox.ch', statut: 'lue', nom: 'Pompe', prix: 690, devise: 'CHF', luLe: 1 };
    const etats: EtatRangement<Locale>[] = [];
    const appels: AppelsIA = {
      lire: vi.fn(async () => page),
      ranger: vi.fn(async (ctx: ContexteRangerCarnet) => ({ ok: true, data: { lignes: [{ sorte: 'article', texte: 'Pompe', url: ctx.pages![0].url, prix: 690 }] } }))
    };
    const { r, ecrits } = banc({ appels, surEtat: (e) => { etats.push(e); } });
    await r.envoyer('celle-ci https://pompe-inox.ch/p/12');
    expect(appels.lire).toHaveBeenCalledWith('https://pompe-inox.ch/p/12', expect.any(AbortSignal));
    expect(etats.filter((e) => e.etape === 'en-cours').map((e) => (e as { lecture?: unknown }).lecture)).toEqual([
      undefined, { url: 'https://pompe-inox.ch/p/12' }, { url: 'https://pompe-inox.ch/p/12', statut: 'lue' }
    ]);
    expect(ecrits.ia[0].lignes[0]).toMatchObject({ prixCentimes: 69000, prixSource: 'page', page });
  });

  it('banc complet avec la simulation par défaut : « exemple », sans passerelle', async () => {
    const { r, ecrits } = banc({ appels: appelsSimules('normal', 1) });
    await r.envoyer('2 bacs pour laver les fûts');
    const idee = ecrits.ia[0].lignes.find((l) => l.sorte === 'idee');
    expect(idee).toMatchObject({ titrePropose: 'ZZ TEST — Évier inox 2 bacs', origine: 'exemple' });
    const panne = banc({ appels: appelsSimules('echec', 1) });
    expect(await panne.r.envoyer('x')).toMatchObject({ etape: 'echec' });
  });

  it('mode simulé sans appels injectés : la simulation, jamais AiClient.run', async () => {
    vi.useFakeTimers();
    try {
      const { r } = banc({});
      const envoi = r.envoyer('une note');
      await vi.advanceTimersByTimeAsync(700);
      expect(await envoi).toMatchObject({ etape: 'range', rangement: 'simulee' });
    } finally { vi.useRealTimers(); }
    expect(espion).toHaveBeenCalledTimes(0);
  });

  it('un message vide n\'écrit rien ; un second envoi pendant en-cours est ignoré', async () => {
    const d = differe<{ ok: boolean; data?: unknown }>();
    const { r, ecrits } = banc({ appels: { ranger: () => d.promesse, lire: vi.fn() } });
    expect(await r.envoyer('   ')).toEqual({ etape: 'repos' });
    const premier = r.envoyer('a');
    await Promise.resolve(); await Promise.resolve();
    expect((await r.envoyer('b')).etape).toBe('en-cours');
    d.resoudre({ ok: false });
    await premier;
    expect(ecrits.local.map((m) => m.texte)).toEqual(['a']);
  });
});

describe('P1, P2 : retourDuRangement suit les effets finaux du message, jamais l’écriture locale remplacée', () => {
  const e = (carnetId: string, cible: string) => ({ carnetId, cible });
  it('carnet né du message, depuis la liste : « Carnet créé » (R11)', () => {
    expect(retourDuRangement([e('neuf', 'carnet'), e('neuf', 'critere')], { depuis: null })).toEqual({ sorte: 'cree', carnetId: 'neuf' });
  });
  it('lien rangé par l’IA dans un carnet existant, depuis la liste : « Rangé dans … », jamais « Carnet créé » (état 20, G21)', () => {
    expect(retourDuRangement([e('c-ventil', 'article')], { depuis: null })).toEqual({ sorte: 'ailleurs', carnetId: 'c-ventil' });
  });
  it('tout dans le carnet ouvert : « Rangé ici » (R14) ; dans un autre : « Rangé dans … »', () => {
    expect(retourDuRangement([e('c-evier', 'note')], { depuis: 'c-evier' })).toEqual({ sorte: 'range', carnetId: 'c-evier' });
    expect(retourDuRangement([e('c-frigo', 'article')], { depuis: 'c-evier' })).toEqual({ sorte: 'ailleurs', carnetId: 'c-frigo' });
  });
  it('plusieurs carnets, ou note de plusieurs lignes depuis la liste : « n lignes rangées dans m carnets » (R19)', () => {
    expect(retourDuRangement([e('a', 'note'), e('b', 'note'), e('b', 'critere')], { depuis: null })).toEqual({ sorte: 'vrac', lignes: 3, carnets: 2 });
    expect(retourDuRangement([e('a', 'note'), e('a', 'note')], { depuis: null, plusieursLignes: true })).toEqual({ sorte: 'vrac', lignes: 2, carnets: 1 });
    /* une phrase d'une ligne, deux critères dans un carnet existant : rangé dans ce carnet, pas « vrac » */
    expect(retourDuRangement([e('a', 'critere'), e('a', 'critere')], { depuis: null })).toEqual({ sorte: 'ailleurs', carnetId: 'a' });
  });
  it('aucun effet : rien à annoncer', () => {
    expect(retourDuRangement([], { depuis: null })).toBeNull();
  });
});
