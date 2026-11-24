// Voie carnet-q (23.11) : ses choix du Carnet, D435 (Q-1 A, Q-1b B, Q-2 C) et D437 (filtres par domaine, variante A).
import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlans, ID_FRIGO, ID_PLAN_FRIGO } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc } from '../../src/domain/carnets/modele';
import * as ops from '../../src/domain/carnets/operations';
import { dansDomaine, domaineDe as domaineBrut, puceDomaines as pucesBrutes, type CarnetPourDomaine, type DomaineCarnet } from '../../src/domain/carnets/domaines';
import { domaineParMots } from '../../src/ui/carnets/domaineMots';

const domaineDe = (c: CarnetPourDomaine) => domaineBrut(c, domaineParMots);
const puceDomaines = (cs: CarnetPourDomaine[]) => pucesBrutes(cs, domaineParMots);
import { chercherCarnet } from '../../src/domain/carnets/recherche';
import { prixPropose } from '../../src/domain/carnets/prixPropose';
import { lireReponse } from '../../src/domain/carnets/ia';
import type { FinancialPlan } from '../../src/domain/finance/types';
import type { CreativeItem } from '../../src/types';

const F = fixtureCarnets();
const doc = (id: string): CarnetDoc => lireCarnet(F.find(i => i.id === id))!;

/* La table de filtres-domaine/page.html : ses 19 carnets du Planning (titre, catégorie, fait) et Chambre froide. */
const TABLE: [string, string | null, DomaineCarnet][] = [
  ['Chambre froide', null, 'brasserie'],
  ['Achat brasserie : moulin à malt + bac etc.', 'Équipements', 'brasserie'],
  ['Frigo + congel', 'Équipements', 'brasserie'],
  ['Embouteillage — station complète (2027)', 'Équipements', 'brasserie'],
  ['Sol, murs & évacuation (béton, revêtement, peinture food-safe)', 'Structure', 'local'],
  ['Robinetterie & tuyaux raccords (fait par soi-même)', 'Plomberie', 'local'],
  ['Achat & installation évier principal + douchette', 'Plomberie', 'local'],
  ['Refaire évier — bloqué (attendre vis pieds)', 'Structure', 'local'],
  ['Sol — matières premières + outils (peut faire en 2x)', 'Structure', 'local'],
  ['Hotte recyclage', 'Équipements', 'local'],
  ['Extincteur', 'Sécurité', 'local'],
  ['Installation électrique 27A (2027)', 'Électricité', 'local'],
  ['2ème évier (2027)', 'Plomberie', 'local'],
  ['Jalon — Peut brasser au local (sans autorisation vente)', 'Jalon', 'local'],
  ['Rangement / étagères inox & déménagement', 'Structure', 'meuble'],
  ['Armoire de rangement malte', 'Équipements', 'meuble'],
  ['Armoire de rangement extérieur', 'Équipements', 'meuble'],
  ['Armoire de rangement toxique', 'Équipements', 'meuble'],
  ['Conformité — dossiers SAAV + SEn + assurances', 'Administratif', 'papiers'],
  ['Jalon — Conformité complète — Peut vendre officiellement', 'Jalon', 'papiers']
];
const carnetTable = ([titre, cat]: (typeof TABLE)[number], i: number) => ({
  id: cat ? `CARNET-PLANNING-T-${i}` : 'CARNET-1',
  title: titre,
  carnet: { phrase: titre, notes: cat === 'Jalon' ? [{ texte: 'Jalon du Planning, sans date' }] : cat ? [{ texte: `À faire du 01.08.2026 au 01.05.2027 (Planning, ${cat})` }] : [] }
});

describe('D437 : le domaine de chaque carnet, tiré de sa catégorie du Planning (table de la page, telle quelle)', () => {
  it.each(TABLE.map((l, i) => [l[0], l[2], i] as const))('%s → %s', (_t, attendu, i) => {
    expect(domaineDe(carnetTable(TABLE[i], i))).toBe(attendu);
  });
  it('les puces : Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; Outils absent (aucun carnet)', () => {
    const p = puceDomaines(TABLE.map(carnetTable));
    expect(p.tous).toBe(20);
    expect(p.domaines).toEqual([{ d: 'local', n: 10 }, { d: 'brasserie', n: 4 }, { d: 'meuble', n: 4 }, { d: 'papiers', n: 2 }]);
  });
  it('posé par lui, il passe avant l’IA, la catégorie et les mots', () => {
    const c = carnetTable(TABLE[9], 9);
    expect(domaineDe({ ...c, carnet: { ...c.carnet, domaine: { valeur: 'brasserie', origine: 'ia' } } })).toBe('brasserie');
    expect(domaineDe({ ...c, carnet: { ...c.carnet, domaine: { valeur: 'outils', origine: 'vous' } } })).toBe('outils');
  });
  it('sans domaine : aucun filtre ne le cache', () => {
    const c = { id: 'X', title: 'Idée sans mot connu', carnet: { notes: [] } };
    expect(domaineDe(c)).toBeNull();
    expect(dansDomaine(c, 'papiers', domaineParMots)).toBe(true);
    expect(dansDomaine(carnetTable(TABLE[1], 1), 'papiers', domaineParMots)).toBe(false);
  });
  it('le document garde le domaine posé ; un domaine inconnu est ignoré', () => {
    const it0 = F.find(i => i.id === ID_FRIGO)!;
    const avec = { ...it0, carnet: { ...it0.carnet!, domaine: { valeur: 'meuble', origine: 'vous' } } } as CreativeItem;
    expect((lireCarnet(avec)!.carnet as { domaine?: unknown }).domaine).toEqual({ valeur: 'meuble', origine: 'vous' });
    const faux = { ...it0, carnet: { ...it0.carnet!, domaine: { valeur: 'jardin', origine: 'vous' } } } as CreativeItem;
    expect((lireCarnet(faux)!.carnet as { domaine?: unknown }).domaine).toBeUndefined();
  });
  it('poserDomaine : un toucher le change (origine « vous »), Annuler le rend', () => {
    const r = ops.poserDomaine(F, { carnetId: ID_FRIGO, domaine: 'local' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const apres = r.ecritures[0] as { op: 'put'; doc: CarnetDoc };
    expect(apres.doc.carnet.domaine).toEqual({ valeur: 'local', origine: 'vous' });
    expect((r.inverse[0] as { doc: CarnetDoc }).doc.carnet.domaine).toBeUndefined();
    expect(ops.poserDomaine(F, { carnetId: ID_FRIGO, domaine: 'jardin' as never }).ok).toBe(false);
  });
  it('l’IA pose le domaine d’un carnet neuf au rangement ; un domaine hors liste est retiré', () => {
    const ctx = { texte: 'une chambre froide pour les fûts', carnets: [], origine: 'ia' as const };
    const v = lireReponse({ lignes: [{ sorte: 'idee', texte: 'une chambre froide pour les fûts', carnetNeuf: 'Chambre froide', domaine: 'brasserie' }] }, ctx);
    expect(v![0].domaine).toBe('brasserie');
    const w = lireReponse({ lignes: [{ sorte: 'idee', texte: 'une chambre froide pour les fûts', carnetNeuf: 'Chambre froide', domaine: 'jardin' }] }, ctx);
    expect(w![0].domaine).toBeUndefined();
    const r = ops.ranger([], { message: { id: 'M1', texte: 'une chambre froide', le: '2026-11-23T10:00:00.000Z', depuis: 'liste', rangement: 'ia' }, lignes: [{ sorte: 'idee', carnetNeuf: { id: 'CARNET-N', titre: 'Chambre froide', domaine: 'brasserie' } } as never] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const neuf = r.ecritures.map(e => (e as { doc?: CarnetDoc }).doc).find(d => d?.id === 'CARNET-N')!;
    expect(neuf.carnet.domaine).toEqual({ valeur: 'brasserie', origine: 'ia' });
  });
});

describe('Q-2 C : la recherche fouille titres, articles et notes, et cite la ligne trouvée', () => {
  const c = (title: string, articles: string[] = [], notes: string[] = []) => ({ title, carnet: { articles: articles.map(nom => ({ nom })), notes: notes.map(texte => ({ texte })) } });
  it('« froide » trouve un titre, puis un article (cité, le mot repéré)', () => {
    expect(chercherCarnet(c('ZZ TEST — Chambre froide'), 'froide')).toEqual({ sorte: 'titre' });
    const t = chercherCarnet(c('ZZ TEST — Prix en euros', ['Chambre froide 1500 x 1200 mm']), 'froide')!;
    expect(t.sorte).toBe('article');
    expect(t.texte).toBe('Chambre froide 1500 x 1200 mm');
    expect(t.texte!.slice(t.debut, t.fin)).toBe('froide');
  });
  it('accents et majuscules ignorés ; une note trouvée est citée', () => {
    const t = chercherCarnet(c('Lavage', [], ['Prévoir un ÉVIER double pour les fûts']), 'evier')!;
    expect(t.sorte).toBe('note');
    expect(t.texte!.slice(t.debut, t.fin)).toBe('ÉVIER');
  });
  it('rien trouvé : null ; une note longue est rognée autour du mot', () => {
    expect(chercherCarnet(c('Hotte'), 'évier')).toBeNull();
    const long = `${'a'.repeat(80)} chambre froide ${'b'.repeat(80)}`;
    const t = chercherCarnet(c('X', [], [long]), 'froide')!;
    expect(t.texte!.length).toBeLessThanOrEqual(74);
    expect(t.texte!.slice(t.debut, t.fin)).toBe('froide');
  });
});

describe('Q-1 A : le choix fait le prix, un seul chiffre', () => {
  const avecPrix = (c: CarnetDoc): CreativeItem[] => F.map(i => (i.id === c.id ? ({ ...i, estimatedCost: 500 } as CreativeItem) : i));
  it('choisir un article à 4 900 CHF pose 4 900 comme prix du projet (l’estimé 500 est remplacé)', () => {
    const f = doc(ID_FRIGO);
    const etat = avecPrix(f).map(i => (i.id === f.id ? ({ ...i, carnet: { ...i.carnet!, articles: i.carnet!.articles.map((a, k) => (k === 0 ? { ...a, prixCentimes: 490000, devise: 'CHF' } : a)) } } as CreativeItem) : i));
    const a0 = lireCarnet(etat.find(i => i.id === f.id))!.carnet.articles[0];
    const r = ops.choisir(etat, { carnetId: f.id, articleId: a0.id, pourquoi: 'le plus grand', le: '2026-11-23T10:00:00.000Z' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((r.ecritures[0] as { doc: CarnetDoc }).doc.estimatedCost).toBe(4900);
  });
  it('un article en euros ne change pas l’estimé (pas de chiffre inventé)', () => {
    const f = doc(ID_FRIGO);
    const etat = avecPrix(f).map(i => (i.id === f.id ? ({ ...i, carnet: { ...i.carnet!, articles: i.carnet!.articles.map((a, k) => (k === 0 ? { ...a, prixCentimes: 490000, devise: 'EUR' } : a)) } } as CreativeItem) : i));
    const a0 = lireCarnet(etat.find(i => i.id === f.id))!.carnet.articles[0];
    const r = ops.choisir(etat, { carnetId: f.id, articleId: a0.id, pourquoi: '', le: '2026-11-23T10:00:00.000Z' });
    if (!r.ok) throw new Error('refus');
    expect((r.ecritures[0] as { doc: CarnetDoc }).doc.estimatedCost).toBe(500);
  });
  it('le plan déjà chiffré à 500 prend le prix du choix (À venir et Calendrier disent 4 900)', () => {
    const f = doc(ID_FRIGO);
    f.carnet.articles.find(x => x.id === f.carnet.choix!.articleId)!.prixCentimes = 490000;
    f.carnet.articles.find(x => x.id === f.carnet.choix!.articleId)!.devise = 'CHF';
    const plan = { ...fixturePlans().find(p => p.id === ID_PLAN_FRIGO)! } as FinancialPlan;
    const p0 = { ...plan, amountCents: 50000, upgrade: { ...plan.upgrade!, budgetKnown: true, purchaseCents: 50000, stage: 'research' as const } };
    const p = ops.planSuitChoix(p0, f);
    expect(p.amountCents).toBe(490000);
    expect(p.upgrade?.purchaseCents).toBe(490000);
    expect(ops.planSuitChoix(p, f)).toBe(p);
  });
});

describe('Q-1b B : « Prix estimé ? » propose en tête le budget du critère, ou le prix lu d’un lien', () => {
  const k = (criteres: string[], articles: { prixCentimes?: number; devise?: string; url?: string; lecture?: string }[] = []) => ({ carnet: { criteres: criteres.map(texte => ({ texte })), articles } });
  it('budget du critère : 400 CHF · budget', () => {
    expect(prixPropose(k(['Budget du Planning : 400 CHF']))).toEqual({ centimes: 40000, source: 'budget' });
  });
  it('un prix lu dans un lien passe devant le budget', () => {
    expect(prixPropose(k(['Budget du Planning : 400 CHF'], [{ prixCentimes: 276365, devise: 'CHF', url: 'https://x.invalid/a', lecture: 'lue' }]))).toEqual({ centimes: 276365, source: 'lu' });
  });
  it('rien : null (jamais un chiffre inventé) ; un prix en euros n’est pas proposé en CHF', () => {
    expect(prixPropose(k(['Silencieux']))).toBeNull();
    expect(prixPropose(k([], [{ prixCentimes: 10000, devise: 'EUR', url: 'https://x.invalid/b', lecture: 'lue' }]))).toBeNull();
  });
});
