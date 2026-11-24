/**
 * Test en ligne du tour 28, côté app (voie fix28-app) : T28-1 le lien revient dans le carnet où il a été collé, T28-2 la barre repliée mène
 * à ce carnet, T28-3 Compléter ne laisse pas d'article « lecture… », T28-4 l'escalade se voit, T28-6 le prix se classe à la même quantité,
 * T28-10 la durée est le temps vécu, T28-11 le compte ne bouge pas avant la fin de la lecture, T28-15 le bandeau nomme le carnet, T28-17 un
 * lien déjà là est reconnu au collage. Règles de calcul et d'état seulement ; aucun réseau (la passerelle est simulée et jamais appelée).
 */
import { afterAll, describe, expect, it, vi } from 'vitest';

const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { creerRangement, type AppelsIA, type DependancesRangement, type EtatRangement } from '../../src/ui/carnets/rangement';
import type { LectureGardee, SuiviLectures } from '../../src/domain/carnets/lecture';
import { reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import type { PageLue } from '../../functions/src/carnetIA';
import { comptesCarnet, sansArticleEnLecture } from '../../src/domain/carnets/comptes';
import { tableau } from '../../src/domain/carnets/comparer';
import { ID_VENTILATION, fixtureCarnets } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc } from '../../src/domain/carnets/modele';
import { dimensionDuClassement, ecartDePrix, prixDeClassement, quantiteArticle, texteParUnite } from '../../src/domain/carnets/prixUnitaire';
import { appliquerEcritures, marquerIntrouvable } from '../../src/domain/carnets/operations';
import { bandeauNommantLeCarnet, boutonEscalader, carnetAOuvrirDepuisBarre } from '../../src/ui/carnets/lectureRegles';
import { texteBandeau } from '../../src/ui/carnets/Bandeau';
import { detailPrix } from '../../src/ui/carnets/PrixPastille';
import type { ArticleV } from '../../src/ui/carnets/EtatIA';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

type Locale = { texte: string };
const memoire = (): SuiviLectures & { l: LectureGardee[] } => {
  const l: LectureGardee[] = [];
  return { l, lister: () => [...l], garder: (x) => { const i = l.findIndex(y => y.jeton === x.jeton); if (i >= 0) l.splice(i, 1); l.push(x); }, retirer: (j) => { const i = l.findIndex(x => x.jeton === j); if (i >= 0) l.splice(i, 1); } };
};
function banc(options: Partial<DependancesRangement<Locale>>) {
  const etats: EtatRangement<Locale>[] = [];
  const r = creerRangement<Locale>({
    mode: 'simule', depuis: 'ZZ', carnets: () => [{ id: 'ZZ', titre: 'ZZ TEST — tour 28' }, { id: 'ARMOIRE', titre: 'Armoire de rangement malte' }], enLigne: () => true,
    analyseLocale: (texte) => [{ texte }],
    ecrireLocal: () => ({ messageId: 'm1' }),
    ecrireIA: vi.fn(),
    surEtat: (e) => { etats.push(e); },
    ...options
  });
  return { r, etats };
}
const LUE = (url: string): PageLue => ({ url, domaine: 'landi.ch', statut: 'lue', luLe: 0, nom: 'Schwerlastregal', etapes: [{ nom: 'page', statut: 'trouve' }] });
const attendre = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('T28-1 : l’article va dans le carnet où le lien a été collé, même après un rechargement', () => {
  it('le suivi garde le carnet du collage avec le jeton', async () => {
    const suivi = memoire();
    let vu: LectureGardee | undefined;
    const appels: AppelsIA = {
      ranger: vi.fn(async (c) => ({ ok: true, data: reponseSimulee(c) })),
      lire: vi.fn(async (url) => { vu = suivi.l[0]; return LUE(url); })
    };
    const { r } = banc({ appels, suivi });
    await r.envoyer('https://landi.ch/regal');
    expect(vu).toMatchObject({ carnetId: 'ZZ' });
  });
  it('rechargée depuis la liste (aucun carnet ouvert), la lecture reprend avec le carnet gardé : l’IA le voit, l’écriture aussi', async () => {
    const suivi = memoire();
    suivi.garder({ jeton: 'jetonGardeAvantFermeture1', url: 'https://landi.ch/regal', messageId: 'mA', texte: 'https://landi.ch/regal', debut: 1000, carnetId: 'ZZ' });
    const ranger = vi.fn(async (c: Parameters<AppelsIA["ranger"]>[0]) => ({ ok: true, data: reponseSimulee(c) }));
    const appels: AppelsIA = { ranger, lire: vi.fn(async (url) => LUE(url)) };
    const ecrireIA = vi.fn();
    const { r } = banc({ appels, suivi, depuis: null, ecrireIA, messageExiste: () => true });
    await r.reprendreLectures();
    expect((ranger.mock.calls[0] as unknown[])[0]).toMatchObject({ depuis: 'ZZ' });
    expect(ecrireIA).toHaveBeenCalledWith('mA', expect.anything(), 'simulee', 'ZZ');
  });
  it('une lecture gardée avant ce correctif (sans carnet) prend le carnet du message', async () => {
    const suivi = memoire();
    suivi.garder({ jeton: 'jetonGardeAvantFermeture2', url: 'https://landi.ch/regal', messageId: 'mB', texte: 'https://landi.ch/regal', debut: 1000 });
    const ranger = vi.fn(async (c: Parameters<AppelsIA["ranger"]>[0]) => ({ ok: true, data: reponseSimulee(c) }));
    const { r } = banc({ appels: { ranger, lire: vi.fn(async (url) => LUE(url)) }, suivi, depuis: null, messageExiste: () => true, depuisDuMessage: () => 'ZZ' });
    await r.reprendreLectures();
    expect((ranger.mock.calls[0] as unknown[])[0]).toMatchObject({ depuis: 'ZZ' });
  });
  it('collé depuis la liste, le suivi garde « aucun carnet » (null), pas le carnet d’à présent', async () => {
    const suivi = memoire();
    let vu: LectureGardee | undefined;
    const appels: AppelsIA = { ranger: vi.fn(async (c) => ({ ok: true, data: reponseSimulee(c) })), lire: vi.fn(async (url) => { vu = suivi.l[0]; return LUE(url); }) };
    const { r } = banc({ appels, suivi, depuis: null });
    await r.envoyer('https://landi.ch/regal');
    expect(vu?.carnetId).toBeNull();
  });
});

describe('T28-2 : la barre repliée mène au carnet du lien, avec son nom', () => {
  it('depuis un autre carnet : le carnet du lien ; chez lui, ou sans carnet connu : on reste', () => {
    expect(carnetAOuvrirDepuisBarre('ZZ', 'SOL')).toBe('ZZ');
    expect(carnetAOuvrirDepuisBarre('ZZ', null)).toBe('ZZ');
    expect(carnetAOuvrirDepuisBarre('ZZ', 'ZZ')).toBeNull();
    expect(carnetAOuvrirDepuisBarre(undefined, 'SOL')).toBeNull();
  });
});

describe('T28-3 : Compléter sur un lien mort ne laisse jamais « lecture… »', () => {
  const carnet = (): CarnetDoc => {
    const b = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
    return { ...b, carnet: { ...b.carnet, articles: [{ id: 'AM', url: 'https://brewtools.example/p/7712213', domaine: 'brewtools.example', lecture: 'a-lire', valeurs: {}, messageId: 'M-MORT' }, ...b.carnet.articles] } };
  };
  it('l’article du lien mort devient « introuvable » (ni « a-lire » ni « en-cours »)', () => {
    const c = carnet();
    const r = marquerIntrouvable([c], { messageId: 'M-MORT' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const apres = appliquerEcritures([c], r.ecritures).find(d => d.id === c.id) as CarnetDoc;
    expect(apres.carnet.articles.find(a => a.id === 'AM')?.lecture).toBe('introuvable');
    expect(apres.carnet.articles.some(a => a.lecture === 'a-lire' || a.lecture === 'en-cours')).toBe(false);
  });
  it('un message sans article : refus, rien d’écrit', () => { expect(marquerIntrouvable([carnet()], { messageId: 'AUTRE' }).ok).toBe(false); });
});

describe('T28-4 : « Escalader » montre son attente, puis son résultat ; bouton éteint pendant', () => {
  it('le bouton : actif avant, éteint pendant la relecture, absent une fois la relecture finie', () => {
    expect(boutonEscalader('aucune')).toBe('actif');
    expect(boutonEscalader('en-cours')).toBe('attente');
    expect(boutonEscalader('finie')).toBe('absent');
  });
  it('la relecture pose un état « en cours » marqué escalade, puis le résultat (lien toujours mort : échec, escalade dite)', async () => {
    const MORT: PageLue = { url: 'https://brewtools.example/p/7', domaine: 'brewtools.example', statut: 'introuvable', luLe: 0, etapes: [{ nom: 'page', statut: 'absent', detail: 'introuvable' }] };
    const appels: AppelsIA = { ranger: vi.fn(async (c) => ({ ok: true, data: reponseSimulee(c) })), lire: vi.fn(async (_u, _s, x) => { expect(x?.escalade).toBe(true); await attendre(20); return MORT; }) };
    const { r, etats } = banc({ appels, retirerLien: vi.fn() });
    const fin = await r.escalader('m1', 'https://brewtools.example/p/7');
    const pendant = etats.filter(e => e.etape === 'en-cours' && e.lecture?.escalade);
    expect(pendant.length).toBeGreaterThan(0);
    expect(fin).toMatchObject({ etape: 'echec', lecture: { statut: 'introuvable', escalade: true } });
  });
});

describe('T28-6 : le prix se classe à la même quantité (CHF/kg)', () => {
  it('la quantité se lit dans le nom ; jamais devinée ni ambiguë', () => {
    expect(quantiteArticle({ nom: 'Citra 1 kg' })).toMatchObject({ dim: 'masse', base: 1, texte: '1 kg' });
    expect(quantiteArticle({ nom: 'Mosaic Pellets T90 100 g' })).toMatchObject({ dim: 'masse', base: 0.1, texte: '100 g' });
    expect(quantiteArticle({ nom: 'Moût 2,5 L' })).toMatchObject({ dim: 'volume', base: 2.5 });
    expect(quantiteArticle({ nom: 'Mosaic 5 x 100 g' })).toBeNull();
    expect(quantiteArticle({ nom: 'Dosage 20 g/L' })).toBeNull();
    expect(quantiteArticle({ nom: 'Citra' })).toBeNull();
    expect(quantiteArticle({})).toBeNull();
  });
  it('Mosaic 7,25 CHF / 100 g et Citra 72,50 CHF / 1 kg : le même prix au kilo, aucun ne devance l’autre', () => {
    const mosaic = { nom: 'Mosaic 100 g', prixCentimes: 725 }, citra = { nom: 'Citra 1 kg', prixCentimes: 7250 };
    expect(prixDeClassement(mosaic, 'masse')).toBeCloseTo(7250);
    expect(prixDeClassement(citra, 'masse')).toBeCloseTo(7250);
    expect(dimensionDuClassement([mosaic, citra])).toBe('masse');
    expect(Math.abs(ecartDePrix(mosaic, citra)!)).toBeLessThan(1e-6);
  });
  it('sans quantité, ou une seule offre avec : le prix tel quel (comme avant) ; un inconnu n’est jamais 0', () => {
    expect(dimensionDuClassement([{ nom: 'Citra', prixCentimes: 100 }, { nom: 'Mosaic', prixCentimes: 200 }])).toBeNull();
    expect(dimensionDuClassement([{ nom: 'Citra 1 kg', prixCentimes: 100 }, { nom: 'Mosaic', prixCentimes: 200 }])).toBeNull();
    expect(prixDeClassement({ nom: 'Mosaic', prixCentimes: 200 }, 'masse')).toBeNull();
    expect(ecartDePrix({ nom: 'Citra 1 kg', prixCentimes: 100 }, { nom: 'Mosaic', prixCentimes: 200 })).toBeNull();
    expect(ecartDePrix({ nom: 'A', prixCentimes: 100 }, { nom: 'B', prixCentimes: 250 })).toBe(150);
  });
  it('le tableau classe Citra 1 kg à 72,50 devant un Hallertau à 90 CHF/kg, malgré le petit prix de Mosaic 100 g à 9 CHF (= 90 CHF/kg)', () => {
    const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
    const art = (id: string, nom: string, prixCentimes: number): Article => ({ id, nom, lecture: 'lue', devise: 'CHF', prixCentimes, valeurs: {} });
    const c: CarnetDoc = { ...base, carnet: { ...base.carnet, criteres: [], facons: [], notes: [],
      articles: [art('M', 'Mosaic 100 g', 900), art('C', 'Citra 1 kg', 7250), art('H', 'Hallertau 500 g', 3000)] } };
    const t = tableau(c)!;
    const ordre = [...t.lignes].sort((a, b) => (a.rang ?? 99) - (b.rang ?? 99)).map(l => l.articleId);
    /* au kilo : Citra 72,50 < Hallertau 60,00 ? non : 60 < 72,50 < 90 */
    expect(ordre).toEqual(['H', 'C', 'M']);
  });
  it('la quantité se dit à côté du prix : « 1 kg · 72,50 CHF/kg »', () => {
    const a = { id: 'C', nom: 'Citra 1 kg', prixCentimes: 7250, devise: 'CHF', valeurs: {}, lecture: 'lue' } as unknown as ArticleV;
    expect(detailPrix(a)).toMatch(/^1 kg · 72,50 CHF\/kg/);
    expect(texteParUnite({ nom: 'Mosaic 100 g', prixCentimes: 725 }, 725, 'CHF')).toBe('72,50 CHF/kg');
    expect(detailPrix({ ...a, nom: 'Citra' } as ArticleV)).toBeNull();
  });
});

describe('T28-10 : la durée affichée est le temps vécu', () => {
  it('la fin de la lecture est celle du rangement (pages + IA), pas celle de la seule page lue', async () => {
    const appels: AppelsIA = {
      ranger: vi.fn(async (c) => { await attendre(120); return { ok: true, data: reponseSimulee(c) }; }),
      lire: vi.fn(async (url) => { await attendre(40); return LUE(url); })
    };
    const { r } = banc({ appels, suivi: memoire() });
    const fin = await r.envoyer('https://landi.ch/regal');
    if (fin.etape !== 'range' || !fin.lecture?.debut || !fin.lecture.fin) throw new Error('lecture attendue');
    expect(fin.lecture.fin - fin.lecture.debut).toBeGreaterThanOrEqual(150);
  });
  it('le début est le collage : avant l’écriture locale', async () => {
    let avantEcriture = 0;
    const appels: AppelsIA = { ranger: vi.fn(async (c) => ({ ok: true, data: reponseSimulee(c) })), lire: vi.fn(async (url) => LUE(url)) };
    const { r } = banc({ appels, ecrireLocal: async () => { await attendre(60); return { messageId: 'm1' }; } });
    avantEcriture = Date.now();
    const fin = await r.envoyer('https://landi.ch/regal');
    if (fin.etape !== 'range' || !fin.lecture?.debut || !fin.lecture.fin) throw new Error('lecture attendue');
    expect(fin.lecture.debut - avantEcriture).toBeLessThan(40);
    expect(fin.lecture.fin - fin.lecture.debut).toBeGreaterThanOrEqual(60);
  });
});

describe('T28-11 : le compte ne bouge pas avant la fin de la lecture', () => {
  const base = lireCarnet(fixtureCarnets().find(i => i.id === ID_VENTILATION))!;
  const avecLien = (): CarnetDoc => ({ ...base, carnet: { ...base.carnet, articles: [...base.carnet.articles, { id: 'NEUF', url: 'https://landi.ch/x', lecture: 'a-lire', valeurs: {}, messageId: 'M-EN-COURS' }] } });
  it('pendant la lecture, l’article attendu n’est ni compté ni montré ; à la fin, il l’est', () => {
    const c = avecLien();
    const avant = comptesCarnet(base.carnet).articles;
    expect(comptesCarnet(c.carnet).articles).toBe(avant + 1);
    const [pendant] = sansArticleEnLecture([c], 'M-EN-COURS');
    expect(comptesCarnet(pendant.carnet).articles).toBe(avant);
    expect(pendant.carnet.articles.some(a => a.id === 'NEUF')).toBe(false);
    const [fini] = sansArticleEnLecture([c], null);
    expect(comptesCarnet(fini.carnet).articles).toBe(avant + 1);
  });
  it('un article d’un autre message, ou déjà lu, reste compté', () => {
    const c = avecLien();
    const [x] = sansArticleEnLecture([c], 'AUTRE');
    expect(x).toBe(c);
    const lu: CarnetDoc = { ...c, carnet: { ...c.carnet, articles: c.carnet.articles.map(a => (a.id === 'NEUF' ? { ...a, lecture: 'lue' as const } : a)) } };
    expect(sansArticleEnLecture([lu], 'M-EN-COURS')[0].carnet.articles.some(a => a.id === 'NEUF')).toBe(true);
  });
});

describe('T28-15 : le bandeau nomme le carnet quand « ici » ne veut rien dire', () => {
  it('« Rangé ici » devient « Rangé dans <carnet> » ; « Déjà dans ce carnet » nomme le carnet', () => {
    expect(texteBandeau(bandeauNommantLeCarnet({ sorte: 'range' }, 'ZZ TEST — tour 28'))).toBe('Rangé dans ZZ TEST — tour 28, à l\'instant');
    expect(texteBandeau(bandeauNommantLeCarnet({ sorte: 'doublon' }, 'ZZ TEST — tour 28'))).toContain('« ZZ TEST — tour 28 »');
    expect(texteBandeau({ sorte: 'doublon' })).toBe('✓ Déjà dans ce carnet : rien de plus rangé');
  });
  it('sans nom de carnet connu, ou pour un bandeau sans « ici » : tel quel', () => {
    expect(bandeauNommantLeCarnet({ sorte: 'range' }, undefined)).toEqual({ sorte: 'range' });
    expect(bandeauNommantLeCarnet({ sorte: 'renomme', avant: 'x' }, 'ZZ')).toEqual({ sorte: 'renomme', avant: 'x' });
    expect(bandeauNommantLeCarnet({ sorte: 'lien', url: 'u', lu: false }, 'ZZ')).toEqual({ sorte: 'lien', url: 'u', lu: false });
  });
});

describe('T28-17 : un lien déjà dans le carnet est reconnu au collage, sans appel serveur', () => {
  it('aucune lecture, aucune IA : l’état est « rangé » (déjà là)', async () => {
    const appels: AppelsIA = { ranger: vi.fn(async (c) => ({ ok: true, data: reponseSimulee(c) })), lire: vi.fn(async (url) => LUE(url)) };
    const ecrireIA = vi.fn();
    const suivi = memoire();
    const { r } = banc({ appels, ecrireIA, suivi, ecrireLocal: () => ({ messageId: 'm1', dejaRange: true }) });
    const fin = await r.envoyer('https://landi.ch/regal');
    expect(fin).toMatchObject({ etape: 'range', dejaRange: true, rangement: 'locale' });
    expect(appels.lire).not.toHaveBeenCalled();
    expect(appels.ranger).not.toHaveBeenCalled();
    expect(ecrireIA).not.toHaveBeenCalled();
    expect(suivi.l).toHaveLength(0);
  });
  it('sans doublon, la lecture a lieu comme avant', async () => {
    const appels: AppelsIA = { ranger: vi.fn(async (c) => ({ ok: true, data: reponseSimulee(c) })), lire: vi.fn(async (url) => LUE(url)) };
    const { r } = banc({ appels });
    await r.envoyer('https://landi.ch/regal');
    expect(appels.lire).toHaveBeenCalledTimes(1);
  });
});
