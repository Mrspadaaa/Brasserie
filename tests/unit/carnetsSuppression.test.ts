import { describe, expect, it } from 'vitest';
import { fixtureCarnets, fixturePlanRealise, fixturePlans, ID_EMBOUTEILLAGE, ID_EVIER, ID_FRIGO, ID_PLAN_EMBOUTEILLAGE, ID_PLAN_FRIGO } from '../../src/domain/carnets/fixture';
import { estRealise } from '../../src/domain/finance/upgradeRing';
import { filDe, lireCarnet, lireCarnets, lireMessage, type CarnetDoc } from '../../src/domain/carnets/modele';
import { archiverCarnet, detacherPlan, liensDe, liensQuiRetiennent, renommer, supprimerCarnet, verificationSuppression, type Resultat } from '../../src/domain/carnets/operations';
import { magasinMemoire } from '../../src/services/carnetsStore';
import type { CreativeItem } from '../../src/types';

const LE = '2026-11-17T10:00:00.000Z';
const ok = (r: Resultat) => { if (!r.ok) throw new Error(`refusé : ${r.raison}`); return r; };
const carnet = (items: readonly CreativeItem[], id: string): CarnetDoc => lireCarnet(items.find(i => i.id === id))!;
const ids = (r: Resultat) => (r.ok ? r.ecritures.map(w => (w.op === 'put' ? w.doc.id : w.id)) : []);

describe('liensQuiRetiennent (Suppression v2, D-47b)', () => {
  const F = fixtureCarnets();
  const R = fixturePlanRealise();
  it('0 sans sortie ; 0 si le plan manque', () => {
    expect(liensQuiRetiennent(carnet(F, ID_EVIER), fixturePlans())).toEqual([]);
    expect(liensQuiRetiennent(carnet(F, ID_FRIGO), [])).toEqual([]);
  });
  it('1 plan-a-venir / detacher sur un plan sans dépense payée', () => {
    expect(liensQuiRetiennent(carnet(F, ID_FRIGO), fixturePlans())).toEqual([{ sorte: 'plan-a-venir', planId: ID_PLAN_FRIGO, libelle: 'ZZ TEST — Frigo de garde pour fûts', reglage: 'detacher' }]);
  });
  it('1 plan-realise / archiver avec une dépense liée payée en entier (estRealise vrai)', () => {
    const plan = R.plans.find(p => p.id === ID_PLAN_EMBOUTEILLAGE)!;
    expect(estRealise(plan, R.transactions, R.payments)).toBe(true);
    const l = liensQuiRetiennent(carnet(R.items, ID_EMBOUTEILLAGE), R.plans, R.transactions, R.payments);
    expect(l).toEqual([{ sorte: 'plan-realise', planId: ID_PLAN_EMBOUTEILLAGE, libelle: 'ZZ TEST — Embouteillage', reglage: 'archiver' }]);
    /* le même plan sans paiement : à venir */
    expect(liensQuiRetiennent(carnet(R.items, ID_EMBOUTEILLAGE), R.plans, R.transactions, [])[0].sorte).toBe('plan-a-venir');
  });
  it('jamais de sorte stock ni facture', () => {
    const toutes = [liensQuiRetiennent(carnet(F, ID_FRIGO), fixturePlans()), liensQuiRetiennent(carnet(R.items, ID_EMBOUTEILLAGE), R.plans, R.transactions, R.payments)].flat();
    expect(toutes.map(l => l.sorte).filter(s => !['plan-a-venir', 'plan-realise'].includes(s))).toEqual([]);
    expect(JSON.stringify(toutes)).not.toMatch(/stock|facture/);
  });
  it('G36 : la vérification vient de la même liste', () => {
    expect(verificationSuppression([])).toBe('ni dans À venir, ni en commande');
  });
});

describe('plan à venir : refusé, détacher, puis supprimer (aucune écriture hors de creativeItems)', () => {
  it('le parcours complet, sur le magasin espion', () => {
    const plans = fixturePlans();
    const plansAvant = JSON.stringify(plans);
    const m = magasinMemoire(fixtureCarnets());
    const refus = supprimerCarnet(m.lire(), { carnetId: ID_FRIGO, plans });
    expect(refus.ok).toBe(false);
    if (!refus.ok) { expect(refus.raison).toContain('1 lien le retient'); expect(refus.raison).toContain('ZZ TEST — Frigo de garde pour fûts'); }

    const d = ok(detacherPlan(m.lire(), { carnetId: ID_FRIGO, plans }));
    expect(ids(d)).toEqual([ID_FRIGO]);
    m.appliquer(d.ecritures);
    expect(carnet(m.lire(), ID_FRIGO).carnet.sortie).toBeUndefined();
    expect(liensQuiRetiennent(carnet(m.lire(), ID_FRIGO), plans)).toHaveLength(0);

    const s = ok(supprimerCarnet(m.lire(), { carnetId: ID_FRIGO, plans }));
    m.appliquer(s.ecritures, s.journal);
    expect(m.lire().find(i => i.id === ID_FRIGO)).toBeUndefined();
    expect(m.journal).toEqual([{ action: 'Suppression', entityId: ID_FRIGO, resume: 'Carnet d\'idées supprimé : ZZ TEST — Frigo de garde pour fûts' }]);
    /* espion : chaque écriture vise un document du carnet (idée ou message), jamais un plan */
    expect(m.ecritures.every(w => (w.op === 'put' ? ['carnet', 'carnet-message'].includes(w.doc.type) : !w.id.startsWith('ZZ-PLAN')))).toBe(true);
    expect(m.ecritures.some(w => (w.op === 'put' ? w.doc.id : w.id) === ID_PLAN_FRIGO)).toBe(false);
    expect(JSON.stringify(plans)).toBe(plansAvant);
  });

  it('la suppression retire articles, notes, façons, photos ; les messages restent, effet « carnet supprimé »', () => {
    const F = fixtureCarnets();
    const s = ok(supprimerCarnet(F, { carnetId: ID_EMBOUTEILLAGE, plans: [] }));
    const m = magasinMemoire(F); m.appliquer(s.ecritures);
    const apres = m.lire();
    expect(JSON.stringify(apres)).not.toContain('ZZ-B-A5');
    expect(apres.find(i => i.id === ID_EMBOUTEILLAGE)).toBeUndefined();
    const msg = lireMessage(apres.find(i => i.id === 'ZZ-MSG-B2'))!;
    expect(msg.carnetMessage.effets.every(e => e.carnetSupprime === true)).toBe(true);
    expect(msg.title).toBe('gravité 4 becs vu chez un collègue, pas mal');
    expect(filDe(apres, ID_EMBOUTEILLAGE).map(e => e.carnetSupprime)).toEqual([true, true, true]);
    /* A2 */
    m.appliquer(s.inverse);
    expect(m.lire()).toEqual(magasinMemoire(F).lire());
  });
});

describe('plan réalisé : archiver, détacher refusé', () => {
  const R = fixturePlanRealise();
  const fin = { plans: R.plans, transactions: R.transactions, payments: R.payments };
  it('detacherPlan refusé (« plan réalisé : archiver ») et n’écrit rien ; supprimerCarnet refusé', () => {
    const d = detacherPlan(R.items, { carnetId: ID_EMBOUTEILLAGE, ...fin });
    expect(d).toEqual({ ok: false, raison: 'plan réalisé : archiver' });
    expect(carnet(R.items, ID_EMBOUTEILLAGE).carnet.sortie?.planId).toBe(ID_PLAN_EMBOUTEILLAGE);
    expect(supprimerCarnet(R.items, { carnetId: ID_EMBOUTEILLAGE, ...fin }).ok).toBe(false);
  });
  it('archiverCarnet garde sortie et tout le contenu ; l’idée sort de lireCarnets ; son inverse l’y remet', () => {
    const m = magasinMemoire(R.items);
    const avant = m.lire();
    const a = ok(archiverCarnet(m.lire(), { carnetId: ID_EMBOUTEILLAGE, le: LE }));
    m.appliquer(a.ecritures, a.journal);
    const c = lireCarnet(m.lire().find(i => i.id === ID_EMBOUTEILLAGE))!;
    expect(c.carnet.archive).toEqual({ le: LE, raison: 'plan réalisé' });
    expect(c.carnet.sortie?.planId).toBe(ID_PLAN_EMBOUTEILLAGE);
    expect(c.carnet.articles).toHaveLength(6);
    expect(c.carnet.choix?.articleId).toBe('ZZ-B-A5');
    expect(lireCarnets(m.lire()).map(x => x.id)).not.toContain(ID_EMBOUTEILLAGE);
    expect(lireCarnets(m.lire(), { archives: true }).map(x => x.id)).toContain(ID_EMBOUTEILLAGE);
    m.appliquer(a.inverse);
    expect(m.lire()).toEqual(avant);
    expect(lireCarnets(m.lire()).map(x => x.id)).toContain(ID_EMBOUTEILLAGE);
  });
});

describe('liensDe, pastilles « lié à » (R47)', () => {
  const F = fixtureCarnets();
  const R = fixturePlanRealise();
  it('[] sans sortie ; a-venir avec son libellé ; realise ; supprime si le plan manque ; aucun montant', () => {
    expect(liensDe(carnet(F, ID_EVIER), fixturePlans())).toEqual([]);
    expect(liensDe(carnet(F, ID_FRIGO), fixturePlans())).toEqual([{ sorte: 'a-venir', id: ID_PLAN_FRIGO, libelle: 'ZZ TEST — Frigo de garde pour fûts', etat: 'present' }]);
    expect(liensDe(carnet(R.items, ID_EMBOUTEILLAGE), R.plans, R.transactions, R.payments)).toEqual([{ sorte: 'realise', id: ID_PLAN_EMBOUTEILLAGE, libelle: 'ZZ TEST — Embouteillage', etat: 'present' }]);
    const sansPlan = liensDe(carnet(F, ID_FRIGO), []);
    expect(sansPlan).toHaveLength(1);
    expect(sansPlan[0].etat).toBe('supprime');
    for (const l of [...liensDe(carnet(F, ID_FRIGO), fixturePlans()), ...sansPlan]) expect(Object.keys(l).sort()).toEqual(['etat', 'id', 'libelle', 'sorte']);
  });
});

describe('titrePropose (R46)', () => {
  const F = fixtureCarnets();
  const msg = F.find(i => i.id === 'ZZ-MSG-E1')!;
  it('lireMessage le lit ; l’ignore s’il est mal formé', () => {
    expect(lireMessage({ ...msg, carnetMessage: { ...msg.carnetMessage!, titrePropose: { carnetId: ID_EVIER, titre: 'Évier 2 bacs' } } })!.carnetMessage.titrePropose).toEqual({ carnetId: ID_EVIER, titre: 'Évier 2 bacs' });
    for (const mauvais of [{ carnetId: ID_EVIER }, { titre: 'x' }, 'Évier', { carnetId: '', titre: 'x' }, null]) {
      const m = lireMessage({ ...msg, carnetMessage: { ...msg.carnetMessage!, titrePropose: mauvais as never } });
      expect(m).not.toBeNull();
      expect(m!.carnetMessage.titrePropose).toBeUndefined();
    }
  });
  it('renommer garde avant et a son inverse (A2)', () => {
    const r = ok(renommer(F, { carnetId: ID_EVIER, titre: 'Évier 2 bacs' }));
    expect(r.avant).toBe('ZZ TEST — Évier inox');
    const m = magasinMemoire(F); const avant = m.lire();
    m.appliquer(r.ecritures); m.appliquer(r.inverse);
    expect(m.lire()).toEqual(avant);
  });
});
