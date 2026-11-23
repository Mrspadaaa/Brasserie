/**
 * Critique 5, lot corr5-A (données et IA simulée) : n° 1, 2, 4, 6, 7, 21, 22, 23, 24, 27, 30 et le prix « 189,90 CHF ».
 * IA simulée seulement (aucun appel Gemini) ; fixture « ZZ TEST — … » ; pages HTML anonymisées de tests/fixtures/carnets.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { analyserTexte, extraireCriteres, prixTousDe, quantitesDe } from '../../src/domain/carnets/analyseLocale';
import {
  critereQuiTranche, colonnesDe, moinsBienPartout, moinsBienQue, rangeParDetail, tableau, texteMoinsBienQue
} from '../../src/domain/carnets/comparer';
import {
  CRITERE_BRUIT, fixtureCarnets, fixturePlans, ID_EVIER, ID_EXTRACTION, ID_PLAN_FRIGO, ID_VENTILATION, ID_VENTILATION_CAVE, NOTE_VRAC_DEUX_CARNETS, PHRASES_ESSAI
} from '../../src/domain/carnets/fixture';
import { contexteModele, critereTireDe, lireReponse, nombresDe, resume, type CarnetPourIA, type LigneCarnet, type PageLue } from '../../src/domain/carnets/ia';
import { lienACollerPour, lireLienSimule, reponseSimulee } from '../../src/domain/carnets/iaSimulee';
import { extraitLu, lireCarnet, lireCarnets, sourceDuCritere, titreNeufDe, type CarnetDoc } from '../../src/domain/carnets/modele';
import { creerCarnet, ranger, type LigneARanger, type Resultat } from '../../src/domain/carnets/operations';
import { carnetProche, categorieDe, rattacher } from '../../src/domain/carnets/rattacher';
import { planVrac, sorteVrac } from '../../src/ui/carnets/rangement';
import { lirePage } from '../../functions/src/lireLien';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const LE = '2026-11-18T10:00:00.000Z';
const pourIA = (c: CarnetDoc): CarnetPourIA => ({ id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons, articles: c.carnet.articles, notes: c.carnet.notes });
const CS = () => lireCarnets(F);

function simuler(texte: string, depuis: string | null, pages: PageLue[] = [], carnets: CarnetPourIA[] = CS().map(pourIA)): LigneCarnet[] {
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
const message = (id: string, texte: string, depuis: string) => ({ id, texte, le: LE, depuis, rangement: 'simulee' as const });
const V = () => carnet(F, ID_VENTILATION);
const nombresDeLignes = (l: readonly LigneCarnet[]) => l.flatMap(x => nombresDe([x.texte, x.titre ?? '', x.carnetNeuf ?? ''].join(' ')));

describe('(a) n° 4 : toute valeur rangée vient de la phrase tapée, jamais d’un exemple de maquette', () => {
  const PHRASE = 'Évier inox, fond de bac 38 cm minimum';
  it('« Évier inox, fond de bac 38 cm minimum » : aucun « 30 L », « 38 cm » gardé, caractéristique fond de bac (cm, plus)', () => {
    for (const depuis of [ID_EVIER, null]) {
      const l = simuler(PHRASE, depuis);
      expect(l.map(x => x.texte).join(' | ')).not.toMatch(/30\s?L|fût de 30/);
      const k = l.filter(x => x.sorte === 'critere');
      expect(k).toHaveLength(1);
      expect(k[0]).toMatchObject({ texte: 'Fond de bac 38 cm minimum', caracteristique: { nom: 'fond de bac', unite: 'cm', sens: 'plus' } });
      for (const n of nombresDeLignes(l)) expect(nombresDe(PHRASE)).toContain(n);
    }
  });
  it('une phrase sans nombre ne produit aucun nombre', () => {
    for (const p of ['frigo de garde pour fûts', 'pompe qui tient le chaud', 'évier pour laver les fûts couchés', 'buées au-dessus de la cuve', 'isobarique pour moins d’oxygène']) {
      const l = simuler(p, null);
      expect(l.length, p).toBeGreaterThan(0);
      expect(nombresDeLignes(l), p).toEqual([]);
    }
  });
  it('rangé dans Évier, « assez profond pour un fût » reste dans Ce qui compte (pas fondu dans le 38 cm)', () => {
    const k = simuler(PHRASE, ID_EVIER).find(x => x.sorte === 'critere')!;
    const lignes: LigneARanger[] = [{ carnetId: ID_EVIER, sorte: 'critere', texte: k.texte, caracteristique: k.caracteristique, origine: k.origine }];
    const etat = appliquer(F, ranger(F, { message: message('M-A1', PHRASE, ID_EVIER), lignes }));
    expect(carnet(etat, ID_EVIER).carnet.criteres.map(x => x.texte)).toEqual(['2 bacs', 'assez profond pour un fût', 'Fond de bac 38 cm minimum']);
  });
});

describe('(b) n° 2 et 24 : le critère est la caractéristique ; le titre n’est jamais un critère ; aucun double', () => {
  const MOULIN = 'ZZ TEST — Moulin à malt : 2 cylindres, 150 kg/h';
  it('« Moulin à malt : 2 cylindres, 150 kg/h » → débit ≥ 150 kg/h ; « 2 cylindres » en façon ; le titre absent des critères', () => {
    const l = simuler(MOULIN, null);
    const k = l.filter(x => x.sorte === 'critere');
    expect(k).toHaveLength(1);
    expect(k[0]).toMatchObject({ texte: 'Débit : 150 kg/h au moins', caracteristique: { nom: 'débit', unite: 'kg/h', sens: 'plus' } });
    expect(k.some(x => /moulin/i.test(x.texte))).toBe(false);
    expect(l.find(x => x.sorte === 'facon')).toMatchObject({ texte: '2 cylindres' });
    expect(l.find(x => x.sorte === 'idee')).toMatchObject({ titre: 'ZZ TEST — Moulin à malt' });
    expect(quantitesDe('150 kg/h')).toEqual([{ valeur: 150, unite: 'kg/h', texte: '150' }]);
  });
  it('extraireCriteres : chaque mesure de la phrase, sans double ; une phrase sans mesure → aucun critère', () => {
    expect(extraireCriteres('il faudrait au moins 1 500 m³/h, pas plus de 55 dB').criteres.map(k => [k.texte, k.caracteristique?.sens]))
      .toEqual([['Débit : 1 500 m³/h au moins', 'plus'], ['Bruit : 55 dB au plus', 'moins']]);
    expect(extraireCriteres('pompe qui tient 80 °C').criteres).toEqual([{ texte: 'Tient 80 °C', caracteristique: { nom: 'tient 80 °C', sens: 'oui-non' } }]);
    expect(extraireCriteres('frigo de garde pour fûts')).toEqual({ criteres: [], facons: [] });
    expect(simuler('frigo de garde pour fûts', null).filter(x => x.sorte === 'critere')).toEqual([]);
    const textes = simuler('ZZ TEST — buées au-dessus de la cuve, 1 200 m³/h', ID_VENTILATION).filter(x => x.sorte === 'critere').map(x => x.texte);
    expect(new Set(textes).size).toBe(textes.length);
  });
  it('n° 24 : créer « Tuyau silicone 8 mm, 5 m » : le critère local égal au titre n’est pas rangé ; « Ce qui compte » vide', () => {
    const texte = 'ZZ TEST — Tuyau silicone 8 mm, 5 m';
    const local = analyserTexte(texte)[0];
    expect(local.sorte).toBe('critere');
    const etat = appliquer(F, creerCarnet(F, { id: 'C-T', message: message('M-B1', texte, 'liste'), lignes: [{ carnetId: 'x', sorte: 'critere', texte: local.texte, origine: 'locale' }] }));
    expect(carnet(etat, 'C-T').carnet.criteres).toEqual([]);
    // la phrase entière, quand elle porte plus que son titre, n’est pas un critère non plus
    const etat2 = appliquer(F, creerCarnet(F, { id: 'C-M', message: message('M-B2', MOULIN, 'liste'), lignes: [{ carnetId: 'x', sorte: 'critere', texte: 'Moulin à malt : 2 cylindres, 150 kg/h', origine: 'locale' }] }));
    expect(carnet(etat2, 'C-M').carnet.criteres).toEqual([]);
    expect(carnet(etat2, 'C-M').title).toBe('ZZ TEST — Moulin à malt');
  });
  it('un prix écrit seul fait un article (le nom sans le prix), jamais un critère', () => {
    const l = simuler('ZZ TEST — Tuyau silicone 8 mm, 5 m, 189,90 CHF', null);
    expect(l.filter(x => x.sorte === 'critere')).toEqual([]);
    expect(l.find(x => x.sorte === 'article')).toMatchObject({ texte: 'Tuyau silicone 8 mm, 5 m', prixCentimes: 18990, devise: 'CHF' });
  });
});

describe('(c) n° 1 : chaque critère porte son origine réelle', () => {
  it('fixture : Ventilation « tient 80 °C » et « le débit » proposés par l’IA ; la condensation, de sa phrase ; Évier « 2 bacs » de sa phrase', () => {
    expect(V().carnet.criteres.map(k => [k.id, k.origine, sourceDuCritere(k)])).toEqual([['ZZ-V-K1', 'vous', 'phrase'], ['ZZ-V-K2', 'ia', 'ia'], ['ZZ-V-K3', 'ia', 'ia']]);
    expect(carnet(F, ID_EVIER).carnet.criteres.map(sourceDuCritere)).toEqual(['phrase', 'ia']);
  });
  it('le garde décide, réponse simulée comprise (toujours marquée « exemple ») : tiré de ses mots → phrase ; sinon → ia ; rangé tel quel', () => {
    const tire = simuler('ZZ TEST — buées au-dessus de la cuve, 1 200 m³/h', ID_VENTILATION).find(x => x.sorte === 'critere')!;
    expect(tire).toMatchObject({ source: 'phrase', origine: 'exemple' });
    expect(simuler('ZZ TEST — Moulin à malt : 2 cylindres, 150 kg/h', null).find(x => x.sorte === 'critere')!.source).toBe('phrase');
    const carnets = CS().map(pourIA);
    const brut = { lignes: [{ sorte: 'critere', texte: 'tient 80 °C', carnetId: ID_EVIER, caracteristique: { nom: 'tient 80 °C', sens: 'oui-non' } }, { sorte: 'critere', texte: 'le débit', carnetId: ID_EVIER, caracteristique: { nom: 'débit', unite: 'm³/h', sens: 'plus' } }] };
    const l = lireReponse(brut, { texte: 'buées au-dessus de la cuve', carnets, depuis: ID_EVIER, origine: 'exemple' })!;
    expect(l.map(x => [x.source, x.origine])).toEqual([['ia', 'exemple'], ['ia', 'exemple']]);
    const lignes: LigneARanger[] = l.map(x => ({ carnetId: ID_EVIER, sorte: 'critere', texte: x.texte, caracteristique: x.caracteristique, origine: x.origine, source: x.source }));
    const etat = appliquer(F, ranger(F, { message: message('M-C1', 'buées au-dessus de la cuve', ID_EVIER), lignes }));
    const ks = carnet(etat, ID_EVIER).carnet.criteres.filter(k => k.messageId === 'M-C1');
    expect(ks.map(k => [k.texte, sourceDuCritere(k)])).toEqual([['tient 80 °C', 'ia'], ['le débit', 'ia']]);
    expect(critereTireDe('Capter les buées au-dessus de la cuve', { nom: 'débit' }, 'buées au-dessus de la cuve')).toBe(true);
    expect(critereTireDe('Débit : 150 kg/h au moins', { nom: 'débit' }, 'moulin 150 kg/h')).toBe(true);
    expect(critereTireDe('Débit : 200 kg/h au moins', { nom: 'débit' }, 'moulin 150 kg/h')).toBe(false);
  });
});

describe('(d) n° 21 : critereQuiTranche vise une caractéristique manquante, jamais « capter la buée »', () => {
  it('Ventilation : les deux premiers ont tient 80 °C et le débit → rien à trancher (null)', () => {
    const t = critereQuiTranche(V());
    expect(t?.critere.texte ?? '').not.toMatch(/capter la buée/);
    expect(t).toBeNull();
  });
  it('une caractéristique inconnue des deux premiers est proposée ; un critère sans caractéristique ne l’est jamais', () => {
    const v = V();
    /* critique 6, n° 17 : le bruit n'est proposé que si un 3e article le porte (jamais un critère dont personne n'a la valeur) */
    const articles = v.carnet.articles.map((a, i) => i === 2 ? { ...a, valeurs: { ...(a.valeurs ?? {}), bruit: { valeur: 60, unite: 'dB', origine: 'vous' as const } } } : a);
    const avecBruit: CarnetDoc = { ...v, carnet: { ...v.carnet, articles, criteres: [...v.carnet.criteres, { id: 'K-BRUIT', texte: 'pas trop de bruit', caracteristique: { nom: 'bruit', unite: 'dB', sens: 'moins' }, origine: 'vous' }] } };
    const t = critereQuiTranche(avecBruit)!;
    expect(t.critere.id).toBe('K-BRUIT');
    expect(t.critere.caracteristique).toBeDefined();
  });
});

describe('(e) n° 22 : le critère qui range est nommé, et le premier sans valeur est dit', () => {
  it('Ventilation : « rangé par tient 80 °C ; « capter la buée » n’a pas de valeur mesurable »', () => {
    const r = rangeParDetail(V());
    expect(r.texte).toBe('tient 80 °C d\'abord, puis le débit, puis le prix');
    expect(r.critere).toEqual({ id: 'ZZ-V-K2', texte: 'tient 80 °C', nom: 'tient 80 °C' });
    expect(r.sansValeur).toEqual([{ id: 'ZZ-V-K1', texte: 'Moins de condensation au plafond : capter la buée', court: 'capter la buée' }]);
    expect(r.phrase).toBe('rangé par tient 80 °C ; « capter la buée » n\'a pas de valeur mesurable');
    expect(r.texte).toBe(tableau(V())!.rangePar);
  });
});

describe('(f) n° 23 : « moins bien que la 3e sur tout », jamais un « partout » faux', () => {
  it('Ventilation : la 4e (690 CHF, 80 °C inconnu) n’est pas « moins bien partout » ; la 3e la domine', () => {
    const t = tableau(V())!;
    const l4 = t.lignes.find(l => l.articleId === 'ZZ-V-A4')!;
    expect(l4.rang).toBe(4);
    expect(l4.moinsBienPartout).toBe(false);
    expect(l4.moinsBienQue).toBe(3);
    expect(texteMoinsBienQue(l4.moinsBienQue!)).toBe('moins bien que la 3e sur tout');
    const premiers = t.lignes.filter(l => l.rang !== null && l.rang < 3);
    for (const p of premiers) expect(p.prixCentimes!).toBeGreaterThan(l4.prixCentimes!);
    const enLice = t.lignes.filter(l => l.rang !== null).map(l => V().carnet.articles.find(a => a.id === l.articleId)!);
    expect(moinsBienQue(enLice[3], enLice, colonnesDe(V()))).toBe(3);
    expect(t.lignes.filter(l => l.rang !== null && l.rang < 4).every(l => l.moinsBienQue === undefined)).toBe(true);
  });
  it('« moins bien partout » reste quand il est vrai contre chacun', () => {
    const a = (id: string, debit: number, prix: number) => ({ id, nom: id, prixCentimes: prix, devise: 'CHF', lecture: 'lue' as const, valeurs: { débit: { valeur: debit, unite: 'm³/h', origine: 'exemple' as const } } });
    const arts = [a('X1', 2000, 1000), a('X2', 1800, 1100), a('X3', 1000, 1500)];
    const cols = [{ nom: 'débit', unite: 'm³/h', sens: 'plus' as const, critereId: 'k' }];
    expect(moinsBienPartout(arts[2], arts, cols)).toBe(true);
    expect(moinsBienQue(arts[2], arts, cols)).toBe(1);
    expect(moinsBienPartout(arts[1], arts, cols)).toBe(false);
  });
});

describe('(g) n° 27 : G35 ne propose qu’un carnet de même catégorie d’objet', () => {
  it('Ventilation ne propose pas l’extracteur CO₂ (autre catégorie) : null', () => {
    expect(categorieDe(V())).toBe('ventilation');
    expect(categorieDe(carnet(F, ID_EXTRACTION))).toBe('extracteur');
    const p = carnetProche(V(), CS());
    expect(p?.carnetId ?? null).not.toBe(ID_EXTRACTION);
    expect(p).toBeNull();
  });
  it('un carnet de même catégorie est proposé', () => {
    const cave = { ...carnet(F, ID_EXTRACTION), id: 'C-CAVE', title: 'ZZ TEST — Ventilation de la salle de fermentation' } as CarnetDoc;
    expect(carnetProche(V(), [...CS(), cave])?.carnetId).toBe('C-CAVE');
  });
});

describe('(h) n° 7 et 30 : note en vrac découpée ligne par ligne, 3 lignes · 2 carnets, carnet neuf mis en forme et en Idée', () => {
  it('la fixture la porte dans PHRASES_ESSAI', () => {
    expect(PHRASES_ESSAI.map(p => p.texte)).toContain(NOTE_VRAC_DEUX_CARNETS);
    expect(NOTE_VRAC_DEUX_CARNETS.split('\n')).toHaveLength(3);
  });
  it('planVrac (aperçu et envoi) : 3 lignes, 2 carnets, sortes distinctes, titre neuf « Moulin à malt »', () => {
    const cs = CS();
    const plan = planVrac(analyserTexte(NOTE_VRAC_DEUX_CARNETS), t => rattacher(t, cs));
    expect(plan.lignes).toHaveLength(3);
    expect(plan.carnets).toBe(2);
    expect(plan.decompte).toBe('3 lignes · 2 carnets');
    expect(new Set(plan.lignes.map(l => l.sorte))).toEqual(new Set(['achat', 'question', 'conseil']));
    expect(plan.lignes.find(l => l.sorte === 'achat')).toMatchObject({ carnetId: ID_EVIER, neuf: false });
    expect(plan.titreNeuf).toBe('Moulin à malt');
    expect(plan.lignes.filter(l => l.neuf).map(l => l.titre)).toEqual(['Moulin à malt', 'Moulin à malt']);
  });
  it('envoi : le carnet neuf naît une fois, titre en majuscule, état Idée ; chaque ligne dans son carnet', () => {
    const cs = CS();
    const lignes = analyserTexte(NOTE_VRAC_DEUX_CARNETS);
    const plan = planVrac(lignes, t => rattacher(t, cs));
    const neuf = { id: 'C-NEUF', titre: plan.titreNeuf! };
    const aRanger: LigneARanger[] = plan.lignes.map(x => ({ ...(x.carnetId ? { carnetId: x.carnetId } : { carnetNeuf: neuf }), sorte: 'note', texte: x.ligne.texte, genre: x.ligne.genre }) as LigneARanger);
    const r = ok(ranger(F, { message: message('M-H1', NOTE_VRAC_DEUX_CARNETS, 'liste'), lignes: aRanger }));
    expect(r.ok && r.avis).toBe('✓ 3 lignes rangées dans 2 carnets');
    const etat = appliquer(F, r);
    const c = carnet(etat, 'C-NEUF');
    expect(c.title).toBe('Moulin à malt');
    expect(c.title.charAt(0)).toBe(c.title.charAt(0).toUpperCase());
    expect(c.status).toBe('idea');
    expect(c.carnet.notes.map(n => n.genre).sort()).toEqual(['conseil', 'question']);
    expect(carnet(etat, ID_EVIER).carnet.notes.map(n => n.genre)).toEqual(['a-acheter']);
  });
  it('IA simulée : même découpe, trois sortes, un seul carnet neuf « ZZ TEST — Moulin à malt », décompte 3 · 2', () => {
    const l = simuler(NOTE_VRAC_DEUX_CARNETS, null);
    expect(l).toHaveLength(3);
    expect(resume(l)).toMatchObject({ lignes: 3, carnets: 2 });
    expect(new Set(l.map(x => sorteVrac(x)))).toEqual(new Set(['achat', 'question', 'conseil']));
    expect(l.find(x => x.genre === 'a-acheter')).toMatchObject({ carnetId: ID_EVIER, texte: 'Commander un robinet à pédale pour l’évier' });
    expect([...new Set(l.filter(x => x.carnetNeuf).map(x => x.carnetNeuf))]).toEqual(['ZZ TEST — Moulin à malt']);
  });
  it('titreNeufDe : nom d’objet, majuscule, sans verbe d’achat ni prix', () => {
    expect(titreNeufDe('ajouter le sel')).toBe('Ajouter le sel');
    expect(titreNeufDe('commander une gaine alu Ø 150 mm, 2 pièces')).toBe('Gaine alu Ø 150 mm');
    expect(titreNeufDe('ZZ TEST — tuyau silicone 8 mm à 189,90 CHF')).toBe('ZZ TEST — Tuyau silicone 8 mm');
  });
});

describe('(i) n° 6 : un lien collé dans un carnet ouvert y devient un article lu, avec ses caractéristiques', () => {
  const carnets = () => CS().map(pourIA);
  it('le lien de la critique (…/pompe-magnetique) collé dans Ventilation : aucun carnet neuf', async () => {
    const url = 'https://exemple.invalid/pompe-magnetique';
    const page = await lireLienSimule(url, { delaiMs: 0, luLe: 1 });
    const l = simuler(url, ID_VENTILATION, [page], carnets());
    expect(l.length).toBeGreaterThan(0);
    expect(l.every(x => x.carnetId === ID_VENTILATION && !x.carnetNeuf)).toBe(true);
    const a = l.find(x => x.sorte === 'article')!;
    expect(a.page?.valeurs?.map(v => v.nom)).toEqual(['débit', 'température max', 'tient 80 °C']);
  });
  it('la puce « Coller » de Ventilation : une hotte lue (nom, vendeur, prix, débit, tient 80 °C) ; l’article rangé dit « lu sur la page : … »', async () => {
    const url = lienACollerPour(V().title);
    const page = await lireLienSimule(url, { delaiMs: 0, luLe: 1 });
    const l = simuler(url, ID_VENTILATION, [page], carnets());
    const a = l.find(x => x.sorte === 'article')!;
    expect(a).toMatchObject({ carnetId: ID_VENTILATION, titre: 'Hotte inox 140 cm + extracteur', vendeur: 'Inox Exemple', prixCentimes: 198000, devise: 'CHF' });
    const valeurs = Object.fromEntries((a.page!.valeurs ?? []).map(v => [v.nom, { valeur: v.valeur, ...(v.unite ? { unite: v.unite } : {}), origine: 'page' as const }]));
    const ligne: LigneARanger = { carnetId: ID_VENTILATION, sorte: 'article', url: a.url, domaine: a.page!.domaine, nom: a.titre, prixCentimes: a.prixCentimes, devise: a.devise, vendeur: a.vendeur, lecture: 'lue', valeurs, origine: 'exemple' };
    const etat = appliquer(F, ranger(F, { message: message('M-I1', url, ID_VENTILATION), lignes: [ligne] }));
    expect(lireCarnets(etat)).toHaveLength(CS().length);
    const art = carnet(etat, ID_VENTILATION).carnet.articles.find(x => x.url === url)!;
    expect(extraitLu(art)).toBe('lu sur la page : nom, prix, débit, tient 80 °C');
  });
  it('page HTML (schema.org) lue puis collée dans Ventilation : nom, vendeur, prix, débit et °C ; rien d’inventé si la page ne le dit pas', () => {
    const html = (nom: string) => readFileSync(new URL(`../fixtures/carnets/${nom}`, import.meta.url), 'utf8');
    const url = 'https://boutique-exemple.ch/pompe-inox';
    const page = lirePage(html('produit-ldjson.html'), new URL(url), 1);
    const a = simuler(url, ID_VENTILATION, [page], carnets()).find(x => x.sorte === 'article')!;
    expect(a).toMatchObject({ carnetId: ID_VENTILATION, titre: 'Pompe de transfert inox', vendeur: 'Boutique Exemple', prixCentimes: 69000, devise: 'CHF' });
    expect(a.page?.valeurs).toEqual([{ nom: 'débit', valeur: '40', unite: 'L/min' }, { nom: 'température max', valeur: '90', unite: '°C' }]);
    const urlOg = 'https://exemple-sanitaire.ch/evier-inox-2-bacs';
    const og = lirePage(html('produit-og.html'), new URL(urlOg), 1);
    const b = simuler(urlOg, ID_VENTILATION, [og], carnets()).find(x => x.sorte === 'article')!;
    expect(b.carnetId).toBe(ID_VENTILATION);
    expect(b.prixCentimes).toBeUndefined();
    expect(b.page?.valeurs).toBeUndefined();
  });
});

describe('(j) prix : « 189,90 CHF » lu en CHF dans une phrase réelle (mesures, lien)', () => {
  const lu = (t: string) => prixTousDe(t).map(p => [p.centimes, p.devise]);
  it('CHF à la source ; EUR seulement s’il est écrit', () => {
    expect(lu('Ventilateur moteur EC 189,90 CHF')).toEqual([[18990, 'CHF']]);
    expect(lu('Tuyau silicone 8 mm, 5 m, 189,90 CHF')).toEqual([[18990, 'CHF']]);
    expect(lu('https://exemple.invalid/tuyau-8mm Tuyau silicone 8 mm, 5 m, 189,90 CHF')).toEqual([[18990, 'CHF']]);
    expect(lu('ZZ TEST — https://exemple.invalid/v1 hotte 120 cm, 1 800 m³/h, 189,90 CHF')).toEqual([[18990, 'CHF']]);
    expect(lu('Tuyau silicone 8 mm, 5 m, 189,90 EUR')).toEqual([[18990, 'EUR']]);
    expect(lu('Tuyau silicone 8 mm, 5 m, 189,90 €')).toEqual([[18990, 'EUR']]);
  });
  it('l’IA simulée range « Ventilateur moteur EC 189,90 CHF » dans Ventilation, 18 990 centimes en CHF', () => {
    const a = simuler('Ventilateur moteur EC 189,90 CHF', ID_VENTILATION).find(x => x.sorte === 'article')!;
    expect(a).toMatchObject({ carnetId: ID_VENTILATION, prixCentimes: 18990, devise: 'CHF', texte: 'Ventilateur moteur EC' });
  });
});

describe('(k) bis : G8 et G35 restent atteignables au banc, par option de fixture', () => {
  it('`g8` : Ventilation reçoit « pas trop de bruit » (dB), que G8 propose entre les deux façons', () => {
    const v = lireCarnet(fixtureCarnets({ g8: true }).find(d => d.id === ID_VENTILATION))!;
    const t = critereQuiTranche(v)!;
    expect(t.critere).toMatchObject({ id: 'ZZ-V-K4', texte: CRITERE_BRUIT, caracteristique: { nom: 'bruit', unite: 'dB' } });
    expect(t.entre).toEqual(['Hotte inox + extracteur', 'Extracteur mural seul']);
  });
  /* critique 6, n° 31 : « Ventilation de la cave de garde » répond à un autre besoin ; G35 se prouve sur une idée du même besoin
     (carnetsCritique6Fil, 14). La fixture `g35` reste à donner une 2e idée du même besoin (lot de la fixture). */
  it('`g35` : la 2e idée de ventilation, d’un autre besoin (cave de garde), n’est pas proposée ; jamais l’extracteur CO₂', () => {
    const cs = lireCarnets(fixtureCarnets({ g35: true }));
    expect(cs.some(c => c.id === ID_VENTILATION_CAVE)).toBe(true);
    /* tour 3, f4c (PCN-20) : la 2e idée du même besoin, seule proposée */
    expect(carnetProche(cs.find(c => c.id === ID_VENTILATION)!, cs)?.carnetId).toBe('ZZ-CARNET-VENTILATION-SALLE-2');
  });
});

describe('(k) les états de fixture du lot D restent', () => {
  it('carnet proche (D-131), plan lié (D-46), notes à modifier et supprimer (D-118, D-120)', () => {
    expect(rattacher('ventilation de la salle de brassage', CS())?.carnetId).toBe(ID_VENTILATION);
    expect(fixturePlans().map(p => p.id)).toEqual([ID_PLAN_FRIGO]);
    expect(V().carnet.notes.map(n => n.id)).toEqual(['ZZ-V-N1', 'ZZ-V-N2', 'ZZ-V-N3']);
    expect(PHRASES_ESSAI).toHaveLength(30);
  });
});
