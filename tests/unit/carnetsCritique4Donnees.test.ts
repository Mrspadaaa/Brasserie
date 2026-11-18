/**
 * Critique 4, lot corr4-A (données et IA) : P4, P7, P8, P10/P23, P11, P15, P19, P20, P22, P40, P44.
 * IA simulée seulement (aucun appel Gemini) ; fixture « ZZ TEST — … ».
 */
import { describe, expect, it } from 'vitest';
import { analyserLigne, analyserTexte, genreLocal, prixTousDe } from '../../src/domain/carnets/analyseLocale';
import {
  CRITERE_CONDENSATION, fixtureCarnets, ID_EVIER, ID_EXTRACTION, ID_VENTILATION, ID_VENTILATION_CAVE, NOTE_COMME_CRITERE, NOTE_VRAC_BANC
} from '../../src/domain/carnets/fixture';
import { contexteModele, lireReponse, type CarnetPourIA, type LigneCarnet, type PageLue } from '../../src/domain/carnets/ia';
import { caracteristiquesLues, PAGES_BANC, pageSimulee, reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { lireCarnet, lireCarnets, lireMessage, prixLus, titreDePhrase, type CarnetDoc } from '../../src/domain/carnets/modele';
import { accepterProposition, ranger, remplacerRangement, type LigneARanger, type Resultat } from '../../src/domain/carnets/operations';
import { carnetProche } from '../../src/domain/carnets/rattacher';
import { assainirRangerCarnet, RANGER_CARNET, RANGER_CARNET_SCHEMA } from '../../functions/src/carnetIA';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const LE = '2026-11-18T10:00:00.000Z';
const pourIA = (c: CarnetDoc): CarnetPourIA => ({ id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons, articles: c.carnet.articles, notes: c.carnet.notes });

function simuler(texte: string, depuis: string | null, carnets: CarnetPourIA[] = lireCarnets(F).map(pourIA), pages: PageLue[] = []): LigneCarnet[] {
  const ctx = contexteModele(texte, new Date(LE), depuis, carnets, pages);
  return lireReponse(reponseSimulee(ctx), { texte, carnets, depuis, pages, origine: 'exemple' }) ?? [];
}
const ok = (r: Resultat) => { if (!r.ok) throw new Error(r.raison); return r; };
function appliquer(etat: readonly CreativeItem[], r: Resultat): CreativeItem[] {
  const o = ok(r);
  const parId = new Map(etat.map(d => [d.id, d]));
  for (const e of o.ecritures) { if (e.op === 'put') parId.set(e.doc.id, e.doc); else parId.delete(e.id); }
  return [...parId.values()];
}
const carnet = (etat: readonly CreativeItem[], id: string) => lireCarnet(etat.find(d => d.id === id))!;
const message = (id: string, texte: string, depuis: string) => ({ id, texte, le: LE, depuis, rangement: 'locale' as const });

describe('P40 : une devise avant le nombre ne compte que détachée d’un mot', () => {
  it('« moteur 189,90 CHF » se lit 189,90 CHF (pas « eur 189,90 ») ; les formes suisses restent lues', () => {
    expect(prixTousDe('moteur 189,90 CHF').map(p => ({ centimes: p.centimes, devise: p.devise, texte: p.texte }))).toEqual([{ centimes: 18990, devise: 'CHF', texte: '189,90 CHF' }]);
    const un = (t: string) => prixTousDe(t).map(p => [p.centimes, p.devise, p.texte]);
    expect(un('CHF 690.-')).toEqual([[69000, 'CHF', 'CHF 690.-']]);
    expect(un('EUR 120')).toEqual([[12000, 'EUR', 'EUR 120']]);
    expect(un('120 €')).toEqual([[12000, 'EUR', '120 €']]);
    expect(un('Fr. 45.50')).toEqual([[4550, 'CHF', 'Fr. 45.50']]);
    expect(un('prix:CHF 690')).toEqual([[69000, 'CHF', 'CHF 690']]);
    expect(prixTousDe('moteur 190')).toEqual([]);
  });
  it('prixLus délègue à prixTousDe (rustine retirée), mêmes plages', () => {
    for (const t of ['moteur 189,90 CHF', 'CHF 690.- la pompe', 'remplisseuse 190 €', 'ventilateur 189,90 CHF']) {
      expect(prixLus(t)).toEqual(prixTousDe(t).map(({ centimes, devise, debut, fin }) => ({ centimes, devise, debut, fin })));
    }
    expect(prixLus('ventilateur 189,90 CHF').map(p => [p.centimes, p.devise])).toEqual([[18990, 'CHF']]);
  });
});

describe('P4 (G5) : le critère est la partie mesurable, sans titre ni préfixe', () => {
  const PHRASE = 'ZZ TEST — Moulin à malt : 2 cylindres, 150 kg/h minimum';
  it('aperçu local : « Ce qui compte · 2 cylindres, 150 kg/h minimum » ; le titre « Moulin à malt » (préfixe de test gardé)', () => {
    const l = analyserTexte(PHRASE);
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ sorte: 'critere', texte: '2 cylindres, 150 kg/h minimum', phrase: PHRASE });
    expect(titreDePhrase(PHRASE)).toBe('ZZ TEST — Moulin à malt');
    // un libellé suivi d'autre chose qu'un critère reste dans le titre
    expect(titreDePhrase('ZZ TEST — Évier : robinet col de cygne')).toBe('ZZ TEST — Évier : robinet col de cygne');
    expect(titreDePhrase('Prochain brassage : jeudi, NEIPA')).toBe('Prochain brassage : jeudi, NEIPA');
  });
  it('IA simulée : une idée « Moulin à malt » (préfixe de test gardé au titre), le critère seul', () => {
    const l = simuler(PHRASE, null);
    const idee = l.find(x => x.sorte === 'idee')!, k = l.find(x => x.sorte === 'critere')!;
    expect(idee.titre?.replace(/^ZZ TEST — /, '')).toBe('Moulin à malt');
    /* critique 5, n° 4 : le critère est la mesure de la phrase (kg/h composé) ; « 2 cylindres » est une façon, jamais un critère */
    expect(k.texte).toBe('Débit : 150 kg/h minimum');
    expect(k.texte).not.toMatch(/ZZ TEST|Moulin/);
  });
});

describe('P7 : « buées au-dessus de la cuve, 1 200 m³/h » devient un critère mis en forme, fondu au critère débit', () => {
  const PHRASE = 'ZZ TEST — buées au-dessus de la cuve, 1 200 m³/h';
  it('IA simulée : « Capter les buées au-dessus de la cuve : 1 200 m³/h au moins », débit m³/h, plus', () => {
    const k = simuler(PHRASE, ID_VENTILATION).filter(x => x.sorte === 'critere');
    expect(k).toHaveLength(1);
    expect(k[0]).toMatchObject({ texte: 'Capter les buées au-dessus de la cuve : 1 200 m³/h au moins', caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } });
  });
  it('repli local : jamais la phrase brute (« Buées au-dessus de la cuve : 1 200 m³/h »)', () => {
    expect(analyserTexte(PHRASE)[0]).toMatchObject({ sorte: 'critere', texte: 'Buées au-dessus de la cuve : 1 200 m³/h' });
  });
  it('ranger : le critère « le débit » (exemple) est précisé, pas doublé ; l’IA reprend ; un rangement sans critère le remet', () => {
    const local = analyserTexte(PHRASE)[0];
    let etat = appliquer(F, ranger(F, { message: message('M-P7', PHRASE, ID_VENTILATION), lignes: [{ carnetId: ID_VENTILATION, sorte: 'critere', texte: local.texte, origine: 'locale' }] }));
    let k = carnet(etat, ID_VENTILATION).carnet.criteres;
    expect(k).toHaveLength(3);
    expect(k.find(x => x.id === 'ZZ-V-K3')).toMatchObject({ texte: 'Buées au-dessus de la cuve : 1 200 m³/h', origine: 'locale', messageId: 'M-P7' });
    expect(lireMessage(etat.find(d => d.id === 'M-P7'))!.carnetMessage.effets).toEqual([{ carnetId: ID_VENTILATION, cible: 'critere', id: 'ZZ-V-K3', fusion: { texte: 'le débit', origine: 'ia' } }]);
    const ia = simuler(PHRASE, ID_VENTILATION).find(x => x.sorte === 'critere')!;
    etat = appliquer(etat, remplacerRangement(etat, { messageId: 'M-P7', rangement: 'simulee', lignes: [{ carnetId: ID_VENTILATION, sorte: 'critere', texte: ia.texte, caracteristique: ia.caracteristique, origine: 'exemple' }] }));
    k = carnet(etat, ID_VENTILATION).carnet.criteres;
    expect(k).toHaveLength(3);
    expect(k.find(x => x.id === 'ZZ-V-K3')!.texte).toBe('Capter les buées au-dessus de la cuve : 1 200 m³/h au moins');
    // l'effet garde toujours le critère d'avant le message (« le débit »), pas la version locale
    expect(lireMessage(etat.find(d => d.id === 'M-P7'))!.carnetMessage.effets[0].fusion).toEqual({ texte: 'le débit', origine: 'ia' });
    etat = appliquer(etat, remplacerRangement(etat, { messageId: 'M-P7', rangement: 'simulee', lignes: [{ carnetId: ID_VENTILATION, sorte: 'note', texte: 'buées' }] }));
    expect(carnet(etat, ID_VENTILATION).carnet.criteres.find(x => x.id === 'ZZ-V-K3')).toMatchObject({ texte: 'le débit', origine: 'ia' });
    expect(carnet(etat, ID_VENTILATION).carnet.criteres.find(x => x.id === 'ZZ-V-K3')).not.toHaveProperty('messageId');
  });
  it('ses mots à lui (origine « vous ») ne sont jamais réécrits par une fusion', () => {
    const etat = appliquer(F, ranger(F, { message: message('M-P7b', 'tenir 3 °C', 'ZZ-CARNET-FRIGO'), lignes: [{ carnetId: 'ZZ-CARNET-FRIGO', sorte: 'critere', texte: 'tenir 3 °C', origine: 'locale' }] }));
    const k = carnet(etat, 'ZZ-CARNET-FRIGO').carnet.criteres;
    expect(k.find(x => x.id === 'ZZ-F-K1')!.texte).toBe('tenir 2 °C stable en été');
    expect(k).toHaveLength(3);
  });
});

describe('P15 : « plus de condensation » veut dire n’en plus avoir', () => {
  it('fixture : K1 dit « Moins de condensation au plafond : capter la buée » ; sa phrase reste dans ZZ-MSG-V1', () => {
    const v = carnet(F, ID_VENTILATION);
    expect(v.carnet.criteres.find(k => k.id === 'ZZ-V-K1')!.texte).toBe(CRITERE_CONDENSATION);
    expect(lireMessage(F.find(d => d.id === 'ZZ-MSG-V1'))!.carnetMessage.texte).toContain('plus de condensation au plafond');
  });
  it('aucun critère de la fixture ni de l’IA simulée ne commence par « plus de condensation »', () => {
    const textes = lireCarnets(F).flatMap(c => c.carnet.criteres.map(k => k.texte));
    for (const p of ['ZZ TEST — rangement du frigo, plus de condensation au plafond', 'plus de condensation au plafond', 'trop de condensation au plafond, une hotte ?']) {
      for (const d of [null, ID_VENTILATION]) textes.push(...simuler(p, d).filter(x => x.sorte === 'critere').map(x => x.texte));
    }
    expect(textes.length).toBeGreaterThan(5);
    for (const t of textes) expect(t).not.toMatch(/^plus de condensation/i);
    expect(simuler('plus de condensation au plafond', ID_VENTILATION).find(x => x.sorte === 'critere')).toMatchObject({ caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } });
  });
  it('la consigne serveur le dit : « plus de X » qui dit une gêne → « Moins de / Pas de X »', () => {
    expect(RANGER_CARNET.system).toMatch(/« plus de X » qui dit une gêne/);
    expect(RANGER_CARNET.system).toMatch(/« Moins de X » ou\s+« Pas de X »/);
  });
});

describe('P11, P22 : note en vrac typée, mise en forme, achats en tête (IA simulée et repli local)', () => {
  it('la note de g5:v01-16 (NOTE_VRAC_BANC) : à faire, question, à acheter ; l’achat d’abord ; sans préfixe', () => {
    const ia = simuler(NOTE_VRAC_BANC, null);
    expect(ia.map(l => l.genre)).toEqual(['a-acheter', 'a-faire', 'question']);
    expect(ia.map(l => l.texte)).toEqual(['Gaine alu Ø 150 mm, 2 pièces', 'Demander au ferblantier le diamètre d’évacuation de l’évier, jeudi', 'Hotte 120 cm trop large pour la salle ?']);
    expect(new Set(ia.map(l => l.carnetId))).toEqual(new Set([ID_EVIER, ID_VENTILATION]));
    const local = analyserTexte(NOTE_VRAC_BANC);
    expect(local.map(l => l.genre)).toEqual(['a-acheter', 'a-faire', 'question']);
    for (const l of [...ia, ...local]) expect(l.texte).not.toMatch(/^ZZ TEST/);
  });
  it('la note du rejeu (état 22) : chaque ligne reformulée, sans libellé de carnet, achats', () => {
    const ia = simuler('ZZ TEST — évier : 2 bacs inox de 40 cm\nventilation : hotte 120 cm au-dessus de la cuve\névier : robinet à pédale', null);
    expect(ia.map(l => [l.genre, l.texte])).toEqual([['a-acheter', '2 bacs inox de 40 cm'], ['a-acheter', 'Hotte 120 cm au-dessus de la cuve'], ['a-acheter', 'Robinet à pédale']]);
    expect(ia.map(l => l.carnetId)).toEqual([ID_EVIER, ID_VENTILATION, ID_EVIER]);
  });
  it('les tournures d’un geste passent à l’infinitif ; « note » en dernier recours', () => {
    const ia = simuler('faut appeler le ferblantier\npenser à commander les joints\nla salle fait 4 m de haut', ID_VENTILATION);
    expect(ia.map(l => [l.genre, l.texte])).toEqual([['a-acheter', 'Commander les joints'], ['a-faire', 'Appeler le ferblantier'], ['note', 'La salle fait 4 m de haut']]);
  });
  it('P22 : IA éteinte ou hors ligne, « filtre à air G4, 2 pièces » est un achat', () => {
    expect(genreLocal('filtre à air G4, 2 pièces')).toBe('a-acheter');
    expect(analyserTexte('ZZ TEST — filtre à air G4, 2 pièces')[0]).toMatchObject({ genre: 'a-acheter', sorte: 'note', texte: 'Filtre à air G4, 2 pièces' });
    expect(simuler('ZZ TEST — filtre à air G4, 2 pièces', ID_VENTILATION)[0]).toMatchObject({ genre: 'a-acheter', texte: 'Filtre à air G4, 2 pièces' });
  });
});

describe('P44 : la reformulation G9 garde le nombre de la phrase', () => {
  it('« fond de bac 38 cm minimum » garde son 38 cm et n’invente aucune mesure (critique 5, n° 4 : plus de « 30 L »)', () => {
    const k = simuler('fond de bac 38 cm minimum', ID_EVIER).find(x => x.sorte === 'critere')!;
    expect(k.texte).toBe('Fond de bac 38 cm minimum');
    expect(k.texte).toContain('38 cm');
    expect(k.texte).not.toMatch(/30 L/);
  });
});

describe('P8 : une page lue simulée dit chaque caractéristique avec sa valeur', () => {
  it('pages du banc : valeur non vide, unité pour un nombre, chaque nom une fois, vendeur, prix en CHF', () => {
    for (const [cle, p] of Object.entries(PAGES_BANC)) {
      expect(p.vendeur, cle).toBeTruthy();
      if (p.prix !== undefined) expect(p.devise, cle).toBe('CHF');
      const v = p.valeurs ?? [];
      expect(caracteristiquesLues(p), cle).toEqual(v);
      for (const x of v) if (/^\d/.test(x.valeur) && !/^(bacs|plaques)$/.test(x.nom)) expect(x.unite, `${cle} ${x.nom}`).toBeTruthy();
      expect(v.filter(x => /tient 80/.test(x.nom)).length, cle).toBeLessThanOrEqual(1);
    }
    expect(pageSimulee('https://exemple.invalid/hotte-140').valeurs).toContainEqual({ nom: 'débit', valeur: '2000', unite: 'm³/h' });
  });
  it('caracteristiquesLues retire une caractéristique sans valeur ou dite deux fois', () => {
    expect(caracteristiquesLues({ valeurs: [{ nom: 'débit', valeur: '' }, { nom: 'tient 80 °C', valeur: 'oui' }, { nom: 'Tient 80 °C', valeur: 'oui' }] })).toEqual([{ nom: 'tient 80 °C', valeur: 'oui' }]);
  });
});

describe('P10, P23 (D-35, D-24) : au 2e article lu, l’IA propose la caractéristique commune ; ranger ne l’écrit pas', () => {
  const pompe: CarnetPourIA = {
    id: 'ZZ-CARNET-POMPE', titre: 'ZZ TEST — Pompe de transfert inox', criteres: [], facons: [], notes: [],
    articles: [{ nom: 'Pompe de transfert inox', valeurs: { 'débit': { valeur: '40', unite: 'L/min' }, 'température max': { valeur: '90', unite: '°C' } } }]
  };
  const URL2 = 'https://exemple.invalid/pompe-magnetique';
  it('IA simulée : critère « Débit : le plus haut (L/min) », propose, débit L/min plus', () => {
    const l = simuler(URL2, null, [pompe], [pageSimulee(URL2, 1)]);
    const k = l.filter(x => x.sorte === 'critere');
    expect(k).toEqual([expect.objectContaining({ propose: true, carnetId: 'ZZ-CARNET-POMPE', texte: 'Débit : le plus haut (L/min)', caracteristique: { nom: 'débit', unite: 'L/min', sens: 'plus' } })]);
    expect(l.find(x => x.sorte === 'article')).toMatchObject({ carnetId: 'ZZ-CARNET-POMPE' });
    // un carnet qui a déjà un critère, ou un 1er article : rien de proposé
    expect(simuler(URL2, null, [{ ...pompe, criteres: [{ texte: 'tient 80 °C' }] }], [pageSimulee(URL2, 1)]).some(x => x.propose)).toBe(false);
    expect(simuler(URL2, null, [{ ...pompe, articles: [] }], [pageSimulee(URL2, 1)]).some(x => x.propose)).toBe(false);
  });
  it('garde : une proposition hors d’un critère d’un carnet connu, ou sans caractéristique, est retirée (jamais rangée)', () => {
    const ctx = { texte: 'x', carnets: [pompe], origine: 'exemple' as const };
    const brut = { lignes: [
      { sorte: 'critere', texte: 'Débit', propose: true, carnetId: 'ZZ-CARNET-POMPE', caracteristique: { nom: 'débit', unite: 'L/min', sens: 'plus' } },
      { sorte: 'critere', texte: 'Inconnu', propose: true, carnetId: 'ZZ-INCONNU', caracteristique: { nom: 'débit', sens: 'plus' } },
      { sorte: 'critere', texte: 'Sans caractéristique', propose: true, carnetId: 'ZZ-CARNET-POMPE' },
      { sorte: 'note', texte: 'Une note', propose: true, carnetId: 'ZZ-CARNET-POMPE' }
    ] };
    expect(lireReponse(brut, ctx)!.map(l => [l.texte, l.propose])).toEqual([['Débit', true]]);
  });
  it('ranger garde la proposition sur le message ; accepter la range comme une ligne ordinaire, annulable', () => {
    const etat = F;
    const lignes: LigneARanger[] = [
      { carnetId: ID_EVIER, sorte: 'note', texte: '2e évier vu' },
      { carnetId: ID_EVIER, sorte: 'critere', texte: 'Fond de bac : le plus haut (cm)', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' }, origine: 'exemple', propose: true }
    ];
    const r = ranger(etat, { message: message('M-P10', 'https://exemple.invalid/evier-sur-pieds', ID_EVIER), lignes });
    const apres = appliquer(etat, r);
    expect(carnet(apres, ID_EVIER).carnet.criteres).toEqual(carnet(F, ID_EVIER).carnet.criteres);
    expect(ok(r).avis).toBe('✓ Rangé ici');
    const m = lireMessage(apres.find(d => d.id === 'M-P10'))!;
    expect(m.carnetMessage.propositions).toEqual([{ carnetId: ID_EVIER, texte: 'Fond de bac : le plus haut (cm)', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' }, origine: 'exemple' }]);
    expect(m.carnetMessage.effets.map(e => e.cible)).toEqual(['note']);
    const acc = accepterProposition(apres, { messageId: 'M-P10', index: 0 });
    const fin = appliquer(apres, acc);
    // critique 5, n° 4 : « assez profond pour un fût » dit un usage, pas une caractéristique vague : il reste, la proposition s'ajoute
    expect(carnet(fin, ID_EVIER).carnet.criteres.find(k => k.id === 'ZZ-E-K2')!.texte).toBe('assez profond pour un fût');
    expect(carnet(fin, ID_EVIER).carnet.criteres.some(k => k.texte === 'Fond de bac : le plus haut (cm)')).toBe(true);
    const m2 = lireMessage(fin.find(d => d.id === 'M-P10'))!;
    expect(m2.carnetMessage.propositions).toBeUndefined();
    expect(m2.carnetMessage.effets.map(e => e.cible)).toEqual(['note', 'critere']);
    // Annuler : l'inverse remet l'état d'avant
    const annule = (() => { const o = ok(acc); const parId = new Map(fin.map(d => [d.id, d])); for (const e of o.inverse) { if (e.op === 'put') parId.set(e.doc.id, e.doc); else parId.delete(e.id); } return [...parId.values()]; })();
    expect(carnet(annule, ID_EVIER)).toEqual(carnet(apres, ID_EVIER));
    expect(accepterProposition(fin, { messageId: 'M-P10', index: 0 }).ok).toBe(false);
  });
  it('serveur : le schéma porte « propose », l’assainisseur le garde, la consigne le décrit', () => {
    const items = (RANGER_CARNET_SCHEMA as { properties: { lignes: { items: { properties: Record<string, unknown> } } } }).properties.lignes.items.properties;
    expect(items.propose).toEqual({ type: 'BOOLEAN', nullable: true });
    expect(assainirRangerCarnet({ lignes: [{ sorte: 'critere', texte: 'Débit', propose: true }] }).lignes[0]).toMatchObject({ propose: true });
    expect(RANGER_CARNET.system).toContain('« propose »');
  });
});

describe('P19, P20 : la fixture atteint G25 à G27 et G35', () => {
  it('P19 : Ventilation a une note qui ressemble à un critère (« il faudrait au moins 1 500 m³/h »)', () => {
    const n = carnet(F, ID_VENTILATION).carnet.notes.find(x => x.texte === NOTE_COMME_CRITERE)!;
    expect(n).toMatchObject({ id: 'ZZ-V-N3', genre: 'note', messageId: 'ZZ-MSG-V4' });
    expect(analyserLigne(n.texte).sorte).toBe('critere');
  });
  it('P20 : Ventilation a des articles en veille et un carnet proche (G35 « les déplacer dans … »)', () => {
    const v = carnet(F, ID_VENTILATION);
    expect(v.carnet.articles.some(a => a.veille?.active)).toBe(true);
    /* critique 5, n° 27 : G35 ne propose qu'un carnet de même catégorie ; l'extracteur CO₂ n'en est pas un (rien par défaut), l'option `g35` ajoute une 2e idée de ventilation */
    expect(carnetProche(v, lireCarnets(F))).toBeNull();
    const FG = fixtureCarnets({ g35: true });
    const p = carnetProche(carnet(FG, ID_VENTILATION), lireCarnets(FG));
    expect(p).not.toBeNull();
    expect(p!.carnetId).toBe(ID_VENTILATION_CAVE);
  });
  it('les ID d’avant ne changent pas ; le préfixe « ZZ TEST — » reste sur chaque carnet', () => {
    const ids = F.map(d => d.id);
    for (const id of ['ZZ-CARNET-VENTILATION', 'ZZ-CARNET-EVIER', 'ZZ-CARNET-EMBOUTEILLAGE', 'ZZ-CARNET-FRIGO', 'ZZ-CARNET-DENSIMETRE', 'ZZ-MSG-V1', 'ZZ-MSG-V2', 'ZZ-MSG-V3', 'ZZ-MSG-E1']) expect(ids).toContain(id);
    for (const c of lireCarnets(F)) expect(c.title.startsWith('ZZ TEST — ')).toBe(true);
    expect(carnet(F, ID_VENTILATION).carnet.criteres.map(k => k.id)).toEqual(['ZZ-V-K1', 'ZZ-V-K2', 'ZZ-V-K3']);
  });
});
