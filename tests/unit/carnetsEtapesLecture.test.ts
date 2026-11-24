/**
 * D448, IA-ETAPES-VISIBLES, T26-4 : les étapes de la lecture d'un lien (calcul des lignes, flux simulé, jeton et suivi sur l'appareil,
 * réouverture) et le lien mort qui ne laisse rien. Aucun réseau : la passerelle est simulée et ne doit jamais être appelée.
 */
import { afterAll, describe, expect, it, vi } from 'vitest';

const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { creerRangement, type AppelsIA, type DependancesRangement, type EtatRangement } from '../../src/ui/carnets/rangement';
import { compterEtapes, jetonValide, lignesEtapes, lireReponseLecture, nouveauJeton, PAGE_BLOQUEE_GOOGLE, suiviLocal, type LectureGardee, type SuiviLectures } from '../../src/domain/carnets/lecture';
import { lireLienSimule, pageSimulee } from '../../src/domain/carnets/iaSimulee';
import type { EtapeLien, PageLue } from '../../functions/src/carnetIA';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

const E = (nom: EtapeLien['nom'], statut: EtapeLien['statut'], detail?: string): EtapeLien => ({ nom, statut, ...(detail ? { detail } : {}) });

describe('lignesEtapes : ce que l’écran montre (v05, v06, v03)', () => {
  it('début : rien de dit, la page est en cours, les cinq autres à faire', () => {
    const l = lignesEtapes([]);
    expect(l.map(x => x.statut)).toEqual(['en-cours', 'a-faire', 'a-faire', 'a-faire', 'a-faire', 'a-faire']);
    expect(l.map(x => x.libelle)).toEqual(['Page', 'Données de la page', 'Prix, devise et frais', 'Photos', 'Caractéristiques', 'Contrôle']);
  });
  it('milieu : prix et devise font une ligne, la plus douteuse l’emporte ; la suivante est en cours', () => {
    const l = lignesEtapes([E('page', 'trouve', 'x.de'), E('donnees', 'trouve'), E('prix', 'trouve', '1690 EUR'), E('devise-frais', 'douteux', 'douane non indiquée')]);
    expect(l.find(x => x.cle === 'prix')).toMatchObject({ statut: 'douteux', detail: '1690 EUR · douane non indiquée' });
    expect(l.find(x => x.cle === 'photos')?.statut).toBe('en-cours');
    expect(compterEtapes(l)).toMatchObject({ trouves: 2, douteux: 1, faites: 3, total: 6 });
  });
  it('page bloquée lue par Google : « page bloquée, lue par Google », via Google ; l’étape sautée n’est pas lancée', () => {
    const l = lignesEtapes([E('page', 'absent', 'bloquee'), E('bloquee', 'trouve', 'lue par Google : nom'), E('prix', 'trouve')]);
    expect(l[0]).toMatchObject({ statut: 'trouve', detail: PAGE_BLOQUEE_GOOGLE, viaGoogle: true });
    expect(l.find(x => x.cle === 'donnees')?.statut).toBe('pas-lancee');
    expect(l.find(x => x.cle === 'photos')?.statut).toBe('en-cours');
    expect(lignesEtapes([E('page', 'absent', 'bloquee')], { enCours: 'bloquee' })[0]).toMatchObject({ statut: 'en-cours', viaGoogle: true });
  });
  it('lien mort : la page échoue, le reste n’est pas lancé (rien d’inventé), arrêté à 1 sur 6', () => {
    const l = lignesEtapes([E('page', 'absent', 'introuvable')], { fini: true });
    expect(l[0]).toMatchObject({ statut: 'echec' });
    expect(l.slice(1).every(x => x.statut === 'pas-lancee')).toBe(true);
    expect(compterEtapes(l).arreteA).toBe(1);
  });
  it('fin : une étape jamais dite est absente, jamais « en cours » ; l’IA forte se dit', () => {
    const l = lignesEtapes([E('page', 'trouve'), E('donnees', 'trouve')], { fini: true, escalade: true });
    expect(l.filter(x => x.statut === 'en-cours')).toHaveLength(0);
    expect(l.find(x => x.cle === 'photos')?.statut).toBe('absent');
    expect(l.find(x => x.cle === 'ia')).toMatchObject({ detail: 'IA plus forte' });
  });
});

describe('réponse de lireLien, jeton, suivi sur l’appareil', () => {
  it('une page, un suivi en cours, un suivi fini qui porte sa page', () => {
    const page: PageLue = { url: 'u', domaine: 'd', statut: 'lue', luLe: 1 };
    expect(lireReponseLecture(page)).toEqual({ page });
    expect(lireReponseLecture({ statut: 'en-cours', etapes: [E('page', 'trouve')], enCours: 'ia' })).toEqual({ suivi: { statut: 'en-cours', etapes: [E('page', 'trouve')], enCours: 'ia' } });
    expect(lireReponseLecture({ statut: 'fini', etapes: [], page })).toEqual({ page });
    expect(lireReponseLecture(null)).toBeNull();
  });
  it('le jeton tiré par l’app respecte le format du serveur ; le suivi garde, liste et retire', () => {
    const j = nouveauJeton();
    expect(jetonValide(j)).toBe(true);
    expect(j).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
    const donnees = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => donnees.get(k) ?? null, setItem: (k: string, v: string) => { donnees.set(k, v); } });
    const s = suiviLocal('test.suivi.etapes');
    s.garder({ jeton: j, url: 'https://a.ch/x', messageId: 'm1', texte: 'https://a.ch/x', debut: Date.now() });
    expect(s.lister().map(x => x.jeton)).toEqual([j]);
    s.retirer(j);
    expect(s.lister()).toEqual([]);
    vi.unstubAllGlobals();
  });
});

describe('lireLienSimule : les étapes une à une, puis la reprise par le jeton', () => {
  it('dit les étapes au fil de l’eau, rend la page avec toutes ses étapes ; rappelée avec le même jeton, la page tout de suite', async () => {
    const vues: number[] = [];
    const url = 'https://exemple.invalid/hotte-douteuse';
    const jeton = nouveauJeton();
    const p = await lireLienSimule(url, { delaiMs: 80, jeton, surEtapes: e => vues.push(e.etapes.length) });
    expect(vues[0]).toBe(0);
    expect(vues.at(-1)).toBeGreaterThan(3);
    expect(new Set(vues).size).toBeGreaterThan(3);
    expect(p.etapes?.find(e => e.nom === 'devise-frais')?.statut).toBe('douteux');
    const t0 = Date.now();
    const encore = await lireLienSimule(url, { delaiMs: 5000, jeton });
    expect(Date.now() - t0).toBeLessThan(500);
    expect(encore.nom).toBe(p.nom);
    expect(pageSimulee('https://exemple.invalid/cuve-morte').statut).toBe('introuvable');
  });
});

/* ───── le déroulé : T26-4 et le suivi ───── */

type Locale = { texte: string };
function banc(options: Partial<DependancesRangement<Locale>>) {
  const etats: EtatRangement<Locale>[] = [];
  const r = creerRangement<Locale>({
    mode: 'simule', depuis: 'c1', carnets: () => [{ id: 'c1', titre: 'ZZ TEST — Ventilation' }], enLigne: () => true,
    analyseLocale: (texte) => [{ texte }],
    ecrireLocal: () => ({ messageId: 'm1' }),
    ecrireIA: vi.fn(),
    surEtat: (e) => { etats.push(e); },
    ...options
  });
  return { r, etats };
}
const MORT: PageLue = { url: 'https://brewtools.example/p/7712213', domaine: 'brewtools.example', statut: 'introuvable', luLe: 0, etapes: [E('page', 'absent', 'introuvable')] };

describe('T26-4 : un lien mort ne laisse rien', () => {
  it('statut « introuvable » dit ; l’article retiré (ni liste ni compte) ; aucun rangement, aucune suggestion', async () => {
    const appels: AppelsIA = { ranger: vi.fn(async () => ({ ok: true, data: { lignes: [] } })), lire: vi.fn(async () => MORT) };
    const retirerLien = vi.fn();
    const ecrireIA = vi.fn();
    const { r } = banc({ appels, retirerLien, ecrireIA });
    const fin = await r.envoyer(MORT.url);
    expect(fin).toMatchObject({ etape: 'echec', lecture: { statut: 'introuvable' } });
    expect(retirerLien).toHaveBeenCalledWith('m1');
    expect(appels.ranger).not.toHaveBeenCalled();
    expect(ecrireIA).not.toHaveBeenCalled();
  });
});

describe('IA-ETAPES-VISIBLES : le jeton gardé jusqu’à la fin, la réouverture le reprend', () => {
  const memoire = (): SuiviLectures & { l: LectureGardee[] } => {
    const l: LectureGardee[] = [];
    return { l, lister: () => [...l], garder: (x) => { const i = l.findIndex(y => y.jeton === x.jeton); if (i >= 0) l.splice(i, 1); l.push(x); }, retirer: (j) => { const i = l.findIndex(x => x.jeton === j); if (i >= 0) l.splice(i, 1); } };
  };
  it('les étapes reçues sont posées dans l’état en cours ; le jeton part avec la lecture, puis est oublié', async () => {
    const suivi = memoire();
    const vus: Array<readonly EtapeLien[] | undefined> = [];
    let jetonVu: string | undefined;
    const appels: AppelsIA = {
      ranger: vi.fn(async () => ({ ok: true, data: { lignes: [] } })),
      lire: vi.fn(async (url, _s, x) => { jetonVu = x?.jeton; expect(suivi.l).toHaveLength(1); x?.surEtapes?.({ etapes: [E('page', 'trouve')] }); return { url, domaine: 'a.ch', statut: 'lue' as const, luLe: 0, etapes: [E('page', 'trouve'), E('prix', 'trouve')] }; })
    };
    const { r } = banc({ appels, suivi, surEtat: (e) => { if (e.etape === 'en-cours') vus.push(e.lecture?.etapes); } });
    await r.envoyer('https://a.ch/hotte');
    expect(jetonValide(jetonVu)).toBe(true);
    expect(vus).toContainEqual([E('page', 'trouve')]);
    expect(suivi.l).toHaveLength(0);
  });
  it('réouverture : la lecture gardée repart avec SON jeton, marquée « retrouvée » ; un message disparu est oublié', async () => {
    const suivi = memoire();
    suivi.garder({ jeton: 'jetonGardeAvantFermeture1', url: 'https://a.ch/hotte', messageId: 'mA', texte: 'https://a.ch/hotte', debut: 1000 });
    suivi.garder({ jeton: 'jetonDUnMessageSupprime01', url: 'https://a.ch/x', messageId: 'mDisparu', texte: 'https://a.ch/x', debut: 1000 });
    const jetons: Array<string | undefined> = [];
    const appels: AppelsIA = { ranger: vi.fn(async () => ({ ok: true, data: { lignes: [] } })), lire: vi.fn(async (url, _s, x) => { jetons.push(x?.jeton); return { url, domaine: 'a.ch', statut: 'lue' as const, luLe: 0, etapes: [E('page', 'trouve')] }; }) };
    const { r, etats } = banc({ appels, suivi, messageExiste: (id) => id === 'mA' });
    await r.reprendreLectures();
    expect(jetons).toEqual(['jetonGardeAvantFermeture1']);
    expect(etats.at(-1)).toMatchObject({ messageId: 'mA', lecture: { reouverture: true, debut: 1000 } });
    expect(suivi.l).toHaveLength(0);
  });
});
