import { readdirSync, readFileSync } from 'node:fs';
import { afterAll, describe, expect, it, vi } from 'vitest';

// B3 : Vitest ne touche jamais AiClient.run (espion à 0 appel à la fin du fichier).
const passerelle = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => passerelle.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../src/services/aiClient';
import { aidesCarnet, modeDe, NOMS_AIDES } from '../../src/config/carnetIA';
import {
  contexteModele, liensDuTexte, lireReponse, nombresDe, resume, type CarnetPourIA, type LigneCarnet, type PageLue
} from '../../src/domain/carnets/ia';
import { REPONSE_HORS_SCHEMA, REPONSE_VIDE, pageSimulee, reponseSimulee } from '../../src/domain/carnets/iaSimulee';

const espion = vi.spyOn(AiClient, 'run');
afterAll(() => { expect(espion).toHaveBeenCalledTimes(0); expect(passerelle.call).toHaveBeenCalledTimes(0); });

const EVIER: CarnetPourIA = {
  id: 'c-evier', titre: 'ZZ TEST — Évier inox', majLe: 3,
  criteres: [{ texte: 'Un fût de 30 L couché entre dans le bac', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' } }],
  articles: [{ nom: 'Inox Riviera', valeurs: { 'fond de bac': { valeur: 38, unite: 'cm' } } }],
  notes: [
    { id: 'n-ferblantier', texte: 'Le ferblantier passe jeudi, 10 h' },
    { id: 'n-seaux', texte: 'Garder la place des seaux dessous' }
  ]
};
const VENTIL: CarnetPourIA = { id: 'c-ventil', titre: 'ZZ TEST — Ventilation de la salle', majLe: 2, criteres: [{ texte: 'plus de condensation au plafond' }], facons: [{ nom: 'Hotte inox + extracteur' }], notes: [] };
const CARNETS = [EVIER, VENTIL];
const garde = (brut: unknown, texte: string, extra: Partial<Parameters<typeof lireReponse>[1]> = {}) => lireReponse(brut, { texte, carnets: CARNETS, ...extra });
const une = (r: LigneCarnet[] | null) => { expect(r).not.toBeNull(); return r![0]; };

describe('mode et réglage des aides (B3, B7)', () => {
  it('modeDe : éteint sans valeur ; production seulement posée ; banc toujours simulé', () => {
    expect(modeDe(undefined, false, false)).toBe('eteint');
    expect(modeDe('production', false, false)).toBe('production');
    expect(modeDe('oui', false, false)).toBe('eteint');
    expect(modeDe('production', true, true)).toBe('simule');
    expect(modeDe(undefined, true, true, 'eteint')).toBe('eteint');
    expect(modeDe(undefined, true, false)).toBe('eteint');
  });

  it('aidesCarnet : toutes au banc, aucune en production ou éteint, la liste posée seule', () => {
    const toutes = (v: boolean) => Object.fromEntries(NOMS_AIDES.map((n) => [n, v]));
    expect(aidesCarnet('simule', {})).toEqual(toutes(true));
    expect(aidesCarnet('simule', {}, '0')).toEqual(toutes(false));
    expect(aidesCarnet('production', {})).toEqual(toutes(false));
    expect(aidesCarnet('eteint', {})).toEqual(toutes(false));
    expect(aidesCarnet('production', { VITE_CARNET_AIDES: 'doublon' })).toEqual({ ...toutes(false), doublon: true });
    expect(aidesCarnet('production', { VITE_CARNET_AIDES: 'doublon, regrouper inconnue' })).toEqual({ ...toutes(false), doublon: true, regrouper: true });
  });
});

describe('outils : nombres et liens', () => {
  it('nombresDe lit le format suisse', () => {
    expect(nombresDe("Évier 1'450.– livré")).toContain(1450);
    expect(nombresDe('1 450 CHF')).toContain(1450);
    expect(nombresDe('CHF 690.-, 12,50 le litre')).toEqual(expect.arrayContaining([690, 12.5]));
    expect(nombresDe('2 bacs de 38 cm')).toEqual(expect.arrayContaining([2, 38]));
  });
  it('liensDuTexte : schéma, www., domaine .ch nu, ponctuation finale retirée', () => {
    expect(liensDuTexte('voir https://pompe-inox.ch/p/12. et (www.galaxus.ch/fr/s1/product/9) puis plaque-froid.ch/echangeur, merci'))
      .toEqual(['https://pompe-inox.ch/p/12', 'https://www.galaxus.ch/fr/s1/product/9', 'https://plaque-froid.ch/echangeur']);
    expect(liensDuTexte('rien ici, 3.5 kg')).toEqual([]);
  });
  it('contexteModele : 30 carnets au plus, le carnet ouvert toujours dedans, valeurs avec unité', () => {
    const beaucoup = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, titre: `t${i}`, majLe: 100 - i }));
    const ctx = contexteModele('x', new Date(2026, 10, 17), 'c39', beaucoup);
    expect(ctx.carnets).toHaveLength(30);
    expect(ctx.carnets.some((c) => c.id === 'c39')).toBe(true);
    expect(ctx.saisie).toBe('2026-11-17');
    expect(contexteModele('x', new Date(2026, 10, 17), null, [EVIER]).carnets[0].articles).toEqual([{ nom: 'Inox Riviera', valeurs: { 'fond de bac': '38 cm' } }]);
  });
});

describe('garde lireReponse (B2)', () => {
  it('hors schéma, vide, en panne, trop long : null (le repli local reste)', () => {
    for (const brut of [null, undefined, 'texte', 42, REPONSE_HORS_SCHEMA, REPONSE_VIDE, { lignes: 'x' }]) expect(garde(brut, 'pompe')).toBeNull();
    const treize = { lignes: Array.from({ length: 13 }, (_, i) => ({ sorte: 'note', texte: `n${i}` })) };
    expect(garde(treize, 'pompe')).toBeNull();
    expect(garde({ lignes: Array.from({ length: 12 }, (_, i) => ({ sorte: 'note', texte: `n${i}` })) }, 'pompe')).toHaveLength(12);
  });

  it('une sorte inconnue est refusée, les autres lignes restent ; toutes refusées : null', () => {
    const r = garde({ lignes: [{ sorte: 'tache', texte: 'x' }, { sorte: 'note', texte: 'garder' }] }, 'garder');
    expect(r).toEqual([{ sorte: 'note', texte: 'garder', origine: 'ia' }]);
    expect(garde({ lignes: [{ sorte: 'tache', texte: 'x' }] }, 'x')).toBeNull();
  });

  it('carnetId inconnu → carnetNeuf ; connu gardé ; sans carnet, le carnet ouvert', () => {
    expect(une(garde({ lignes: [{ sorte: 'critere', texte: 'Silencieux', carnetId: 'c-invente', titre: 'Hotte silencieuse' }] }, 'hotte silencieuse')))
      .toMatchObject({ carnetNeuf: 'Hotte silencieuse' });
    expect(une(garde({ lignes: [{ sorte: 'critere', texte: 'x', carnetId: 'c-invente' }] }, 'x')).carnetId).toBeUndefined();
    expect(une(garde({ lignes: [{ sorte: 'note', texte: 'x', carnetId: 'c-evier' }] }, 'x')).carnetId).toBe('c-evier');
    expect(une(garde({ lignes: [{ sorte: 'note', texte: 'x' }] }, 'x', { depuis: 'c-ventil' })).carnetId).toBe('c-ventil');
  });

  it('URL absente du texte retirée ; présente gardée (schéma et www. ignorés)', () => {
    const texte = 'celle-ci : pompe-inox.ch/p/12';
    const r = garde({ lignes: [
      { sorte: 'article', texte: 'Pompe', url: 'https://pompe-inox.ch/p/12' },
      { sorte: 'article', texte: 'Autre', url: 'https://inventee.ch/p/9' }
    ] }, texte)!;
    expect(r[0].url).toBe('https://pompe-inox.ch/p/12');
    expect(r[1].url).toBeUndefined();
  });

  it('prix absent du texte et de la page retiré ; écrit ou lu sur la page, gardé avec sa source', () => {
    const page: PageLue = { url: 'https://pompe-inox.ch/p/12', domaine: 'pompe-inox.ch', statut: 'lue', prix: 690, devise: 'CHF', luLe: 1 };
    const brut = (prix: number) => ({ lignes: [{ sorte: 'article', texte: 'Pompe', url: page.url, prix }] });
    expect(une(garde(brut(799), 'pompe-inox.ch/p/12')).prixCentimes).toBeUndefined();
    expect(une(garde(brut(690), 'pompe-inox.ch/p/12', { pages: [page] }))).toMatchObject({ prixCentimes: 69000, prixSource: 'page', devise: 'CHF', page });
    expect(une(garde({ lignes: [{ sorte: 'note', genre: 'a-acheter', texte: 'Évier', prix: 1450, devise: 'CHF' }] }, "évier 1'450.– chez Evier Pro"))).toMatchObject({ prixCentimes: 145000, prixSource: 'texte' });
    // Une page illisible ne prouve aucun prix.
    expect(une(garde(brut(690), 'pompe-inox.ch/p/12', { pages: [{ ...page, statut: 'illisible' }] })).prixCentimes).toBeUndefined();
  });

  it('quantité absente retirée ; inconnu jamais 0 ; textes rognés à 300', () => {
    const l = une(garde({ lignes: [{ sorte: 'critere', texte: 'y'.repeat(400), quantite: 60, unite: 'cm', prix: 0 }] }, 'bac de 38 cm'));
    expect(l.quantite).toBeUndefined();
    expect(l.unite).toBeUndefined();
    expect(l.prixCentimes).toBeUndefined();
    expect(l.texte).toHaveLength(300);
    expect(une(garde({ lignes: [{ sorte: 'critere', texte: 'fond', quantite: 38, unite: 'cm' }] }, 'fond de bac 38 cm minimum'))).toMatchObject({ quantite: 38, unite: 'cm' });
  });

  it('les achats en tête (D-128), le reste dans l\'ordre rendu', () => {
    const r = garde({ lignes: [
      { sorte: 'note', genre: 'question', texte: 'q' }, { sorte: 'note', genre: 'a-acheter', texte: 'a1' },
      { sorte: 'note', genre: 'conseil', texte: 'c' }, { sorte: 'article', texte: 'a2' }
    ] }, 'q a1 c a2')!;
    expect(r.map((l) => l.texte)).toEqual(['a1', 'a2', 'q', 'c']);
    expect(resume(r)).toEqual({ lignes: 4, carnets: 1, achats: 2 });
  });
});

describe('garde des aides (B7, D-35, G29)', () => {
  it('doublonDe ou regrouperAvec citant une note inconnue : retirés ; connue : gardés', () => {
    const r = garde({ lignes: [
      { sorte: 'note', texte: 'a', doublonDe: 'n-inventee', regrouperAvec: ['n-seaux', 'n-inventee'] },
      { sorte: 'note', texte: 'b', doublonDe: 'n-seaux', regrouperAvec: ['n-ferblantier'] }
    ] }, 'a b')!;
    expect(r[0].doublonDe).toBeUndefined();
    expect(r[0].regrouperAvec).toBeUndefined();
    expect(r[1]).toMatchObject({ doublonDe: 'n-seaux', regrouperAvec: ['n-ferblantier'] });
  });

  it('commeCritere, doublonDe, regrouperAvec hors d\'une note : retirés', () => {
    const l = une(garde({ lignes: [{ sorte: 'critere', texte: 'x', commeCritere: true, doublonDe: 'n-seaux', regrouperAvec: ['n-seaux'] }] }, 'x'));
    expect(l.commeCritere).toBeUndefined();
    expect(l.doublonDe).toBeUndefined();
    expect(l.regrouperAvec).toBeUndefined();
    expect(une(garde({ lignes: [{ sorte: 'note', texte: 'x', commeCritere: true }] }, 'x')).commeCritere).toBe(true);
  });

  it('consequence : un nombre absent du carnet et du message la retire', () => {
    const brut = (consequence: string) => ({ lignes: [{ sorte: 'critere', texte: 'fond', carnetId: 'c-evier', consequence }] });
    expect(une(garde(brut('Inox Riviera (38 cm) ne passerait plus'), 'fond de bac 60 cm')).consequence).toBe('Inox Riviera (38 cm) ne passerait plus');
    expect(une(garde(brut('les articles sous 60 cm ne passeraient plus'), 'fond de bac 60 cm')).consequence).toBeDefined();
    expect(une(garde(brut('gain de 45 % sur le débit'), 'fond de bac 60 cm')).consequence).toBeUndefined();
    expect(une(garde({ lignes: [{ sorte: 'idee', texte: 'x', consequence: 'sans nombre' }] }, 'x')).consequence).toBeUndefined();
  });

  it('D-35 : un vendeur absent du texte et de la page lue est retiré', () => {
    const page: PageLue = { url: 'https://pompe-inox.ch/p/12', domaine: 'pompe-inox.ch', statut: 'lue', vendeur: 'Pompe Inox SA', luLe: 1 };
    const brut = (vendeur: string) => ({ lignes: [{ sorte: 'article', texte: 'Pompe', url: page.url, vendeur }] });
    expect(une(garde(brut('Galaxus'), 'pompe-inox.ch/p/12', { pages: [page] })).vendeur).toBeUndefined();
    expect(une(garde(brut('Pompe Inox SA'), 'pompe-inox.ch/p/12', { pages: [page] })).vendeur).toBe('Pompe Inox SA');
    expect(une(garde(brut('Brack'), 'vu chez Brack : pompe-inox.ch/p/12')).vendeur).toBe('Brack');
  });

  it('G29 : titrePropose retiré sur carnet inconnu, autre sorte, titre identique ou plus de 60 caractères', () => {
    const brut = (l: Record<string, unknown>) => ({ lignes: [{ sorte: 'idee', texte: '2 bacs pour laver les fûts', ...l }] });
    expect(une(garde(brut({ carnetId: 'c-evier', titrePropose: 'ZZ TEST — Évier inox 2 bacs' }), '2 bacs')).titrePropose).toBe('ZZ TEST — Évier inox 2 bacs');
    expect(une(garde(brut({ carnetId: 'c-invente', titrePropose: 'Évier 2 bacs' }), '2 bacs')).titrePropose).toBeUndefined();
    expect(une(garde(brut({ sorte: 'critere', carnetId: 'c-evier', titrePropose: 'Évier 2 bacs' }), '2 bacs')).titrePropose).toBeUndefined();
    expect(une(garde(brut({ carnetId: 'c-evier', titrePropose: 'zz test — evier  inox' }), '2 bacs')).titrePropose).toBeUndefined();
    expect(une(garde(brut({ carnetId: 'c-evier', titrePropose: 'É'.repeat(61) }), '2 bacs')).titrePropose).toBeUndefined();
  });
});

describe('IA simulée (B6, B7) : marquée « exemple »', () => {
  const simuler = (texte: string, depuis: string | null = null, carnets: CarnetPourIA[] = CARNETS) => {
    const ctx = contexteModele(texte, new Date(2026, 10, 17), depuis, carnets);
    const brut = reponseSimulee(ctx);
    expect(brut?.exemple).toBe(true);
    const lignes = lireReponse(brut, { texte, carnets, depuis, origine: 'exemple' });
    expect(lignes).not.toBeNull();
    expect(lignes!.every((l) => l.origine === 'exemple')).toBe(true);
    return lignes!;
  };
  const achatsEnTete = (l: LigneCarnet[]) => {
    const premierAutre = l.findIndex((x) => x.genre !== 'a-acheter' && x.sorte !== 'article');
    return premierAutre < 0 || l.slice(premierAutre).every((x) => x.genre !== 'a-acheter' && x.sorte !== 'article');
  };

  it('note « Sol local » (D-123) : lignes typées, achats en tête', () => {
    const l = simuler('Sol local\nRouleau qui pousse plutôt qui absorbe.\n\n2 couches, petit pinceau ou plus facile. Tout jetter...\n\nPlus gros seau ?\n\nPetit récipient pour transférer');
    expect(l.map((x) => x.genre)).toEqual(['a-acheter', 'a-acheter', 'conseil', 'question']);
    expect(achatsEnTete(l)).toBe(true);
    expect(l[0].carnetNeuf).toBe('Sol du local');
  });

  it('note « Ajoute » (D-124) : deux choses à faire, pas d\'achat', () => {
    const l = simuler("Ajoute\nPrévision prix pour prochains brassin + ajout aussi de combien l'estimation d'upgrade dans le dashboard principal");
    expect(l.map((x) => x.genre)).toEqual(['a-faire', 'a-faire']);
    expect(resume(l).achats).toBe(0);
  });

  it('note « À faire au prochain brassage » (D-126) : achats en tête, puis à faire et note', () => {
    const l = simuler('À faire au prochain brassage\nPrédictions de coûts\n\nCoûts et visu, tout est déjà payer\n\nHoublon\nLevures\n\nVolume');
    expect(l.map((x) => x.genre)).toEqual(['a-acheter', 'a-acheter', 'a-faire', 'note', 'a-faire']);
    expect(l.slice(0, 2).map((x) => x.texte)).toEqual(['Houblon', 'Levures']);
    expect(achatsEnTete(l)).toBe(true);
  });

  it('frigo, ventilation, évier : des caractéristiques différentes, venues de la réponse', () => {
    /* critique 6, n° 9 (D-35) : les caractéristiques proposées en puces (`propose`) ne sont pas des critères rangés */
    const k = (texte: string) => simuler(texte, null, []).flatMap((l) => (l.caracteristique && !l.propose ? [l.caracteristique.nom] : []));
    const frigo = k('un frigo pour garder les fûts au froid');
    const ventil = k('trop de condensation au plafond, une hotte ?');
    const evier = k('évier où un fût couché entre dans le bac');
    expect(frigo.length && ventil.length && evier.length).toBeTruthy();
    expect(new Set([...frigo, ...ventil, ...evier]).size).toBe(frigo.length + ventil.length + evier.length);
  });

  it('B6 : aucun gabarit par objet dans le code du carnet (hors iaSimulee.ts et fixture.ts)', () => {
    const dossier = new URL('../../src/domain/carnets/', import.meta.url);
    const fautifs = readdirSync(dossier).filter((f) => f.endsWith('.ts') && f !== 'iaSimulee.ts' && f !== 'fixture.ts')
      .filter((f) => /frigo|évier|ventil/.test(readFileSync(new URL(f, dossier), 'utf8')));
    expect(fautifs).toEqual([]);
  });

  it('aide doublon (G11, G33)', () => {
    const l = simuler("Place pour les seaux sous l'évier", 'c-evier');
    expect(l[0]).toMatchObject({ sorte: 'note', doublonDe: 'n-seaux', carnetId: 'c-evier' });
  });

  it('aide note → critère (G25)', () => {
    expect(simuler('il faut que ça tienne 80 °C', 'c-ventil')[0]).toMatchObject({ sorte: 'note', commeCritere: true });
  });

  it('aide conséquence (G26), sans nombre inventé', () => {
    const l = simuler('finalement fond de bac 60 cm', 'c-evier')[0];
    expect(l).toMatchObject({ sorte: 'critere', consequence: 'les articles sous 60 cm ne passeraient plus' });
  });

  it('aide regrouper (G27)', () => {
    expect(simuler('même visite : la douchette', 'c-evier')[0].regrouperAvec).toEqual(['n-ferblantier']);
  });

  it('G29 : « 2 bacs pour laver les fûts » sur le carnet Évier propose un titre', () => {
    const l = simuler('2 bacs pour laver les fûts', 'c-evier');
    const idee = l.find((x) => x.sorte === 'idee')!;
    expect(idee).toMatchObject({ carnetId: 'c-evier', titrePropose: 'ZZ TEST — Évier inox 2 bacs', origine: 'exemple' });
  });

  it('lien de la fixture : article avec le prix de la page simulée ; lien inconnu : rien d\'inventé', () => {
    const texte = 'pompe pour le transfert https://pompe-inox.ch/p/12';
    const page = pageSimulee('https://pompe-inox.ch/p/12', 1);
    const ctx = contexteModele(texte, new Date(2026, 10, 17), null, CARNETS, [page]);
    const l = lireReponse(reponseSimulee(ctx), { texte, carnets: CARNETS, pages: [page], origine: 'exemple' })!;
    expect(l[0]).toMatchObject({ sorte: 'article', url: 'https://pompe-inox.ch/p/12', prixCentimes: 69000, prixSource: 'page', vendeur: 'Pompe Inox' });
    expect(pageSimulee('https://inconnu-exemple.ch/x', 1)).toEqual({ url: 'https://inconnu-exemple.ch/x', domaine: 'inconnu-exemple.ch', statut: 'illisible', luLe: 1 });
  });
});

describe('corr2-L1 : l’IA simulée garde « ZZ TEST — », découpe une note ligne par ligne, dit sa raison', () => {
  const simuler = (texte: string, depuis: string | null = null, carnets: CarnetPourIA[] = CARNETS) =>
    reponseSimulee(contexteModele(texte, new Date(2026, 10, 17), depuis, carnets))!.lignes as Array<Record<string, unknown>>;

  it('L4-7 : tout titre proposé (carnet neuf, titre d’idée, titre proposé G29) garde le préfixe de la phrase', () => {
    const l = simuler('ZZ TEST — chambre froide pour garder 6 fûts', null, [EVIER]);
    const titres = l.flatMap((x) => [x.carnetNeuf, x.sorte === 'idee' ? x.titre : undefined]).filter((t): t is string => typeof t === 'string');
    expect(titres.length).toBeGreaterThan(0);
    expect(titres.every((t) => t.startsWith('ZZ TEST — '))).toBe(true);
    expect(titres).toContain('ZZ TEST — Frigo pour les fûts');
    // G29 sur l'évier : le titre proposé garde le préfixe (une seule fois)
    const g29 = simuler('ZZ TEST — 2 bacs pour laver les fûts', 'c-evier').find((x) => x.titrePropose);
    expect(g29?.titrePropose).toBe('ZZ TEST — Évier inox 2 bacs');
    // « Ce qui compte, tiré de votre phrase » : ce que la phrase dit (la condensation), pas « garder au froid » qu'elle ne dit pas
    const k = simuler('ZZ TEST — rangement du frigo, plus de condensation au plafond', null, []).filter((x) => x.sorte === 'critere' && !x.propose).map((x) => x.texte);
    // P15 : « plus de condensation » dit une gêne ; le critère dit l'inverse
    expect(k).toEqual(['Moins de condensation au plafond : capter la buée']);
    // sans préfixe, rien n'est ajouté
    expect(simuler('chambre froide pour garder 6 fûts', null, [EVIER]).find((x) => x.sorte === 'idee')?.titre).toBe('Frigo pour les fûts');
  });

  it('m390-2 : une note de 3 lignes depuis la liste n’est pas prise par G29 ; chaque ligne a sa cible, un carnet neuf par objet (critique 6, n° 1)', () => {
    const l = simuler('ZZ TEST — 2 bacs pour laver les fûts ; ZZ TEST — ajouter le sel ; ZZ TEST — prochain brassage jeudi');
    expect(l).toHaveLength(3);
    expect(l.every((x) => x.sorte === 'note')).toBe(true);
    expect(l[0].carnetId).toBe('c-evier');
    expect(l[0].raisonCarnet).toBe('votre message parle de « bacs » : comme Évier inox');
    /* n° 30 : le titre du carnet neuf est mis en forme (majuscule) */
    expect(l[1].carnetNeuf).toBe('ZZ TEST — Ajouter le sel');
    /* critique 6, n° 1 : le jour de brassage va dans « Prochain brassin » (G23), pas dans le carnet de la ligne voisine */
    expect(l[2].carnetNeuf).toBe('ZZ TEST — Prochain brassin');
    // dans un carnet ouvert, toutes les lignes y vont (« ↓ va atterrir ici »)
    expect(simuler('hotte trop large ; acheter du sel', 'c-evier').every((x) => x.carnetId === 'c-evier')).toBe(true);
  });

  it('G21 : un lien collé depuis la liste, rangé dans un carnet connu, dit pourquoi ; un lien seul sans carnet ouvre un carnet au nom lu', () => {
    const hotte = simuler('https://exemple.invalid/hotte-140');
    expect(hotte[0]).toMatchObject({ sorte: 'article', carnetId: 'c-ventil', raisonCarnet: 'la page parle de « hotte » : comme Ventilation de la salle' });
    /* critique 6, n° 13 (D-7, D-13, R17, g5:v06-10) : le carnet né d'un lien porte le besoin, pas le nom du produit */
    const pompe = simuler('https://exemple.invalid/pompe-inox', null, [EVIER]);
    expect(pompe.every((x) => x.carnetNeuf === 'Pompe pour le moût')).toBe(true);
    expect(pompe.find((x) => x.sorte === 'article')?.titre).toBe('Pompe de transfert inox');
  });
});
