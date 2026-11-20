import { describe, expect, it } from 'vitest';
import taches from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { planMigration, idCarnetPlanning, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';
import { planEtats } from '../../scripts/planning-vers-carnet/etats';
import { ACHATS, planAtelier } from '../../scripts/planning-vers-carnet/atelier';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { lireCarnet, lireCarnets } from '../../src/domain/carnets/modele';
import { choseCreative, choseSansDate } from '../../src/domain/calendrier';
import { validateUpgrade } from '../../src/domain/finance/upgrades';
import { lireSuisse } from '../../src/domain/rangerNote';
import type { CreativeItem } from '../../src/types';

const LE = '2026-11-20T18:00:00.000Z';
const fixture = taches as TachePlanning[];
/* l'état en ligne au 20.11 : 19 idées portées, puis ses états (1 à 5 faites, 6 en cours, 7 à 11 pas encore) */
const portees = planMigration(fixture, new Set(), '2026-11-20T12:00:00.000Z').aEcrire.flatMap(c => c.docs);
const enLigne = appliquerEcritures(portees, planEtats(portees, '2026-11-20T17:00:00.000Z').ecritures);
/* la règle de la liste de Brassins › Atelier › Carnet (NoteCarnet, `libres`) */
const visiblesAtelier = (items: readonly CreativeItem[]) => items.filter(i => ['event', 'prospect', 'recipe-idea', 'pricing-test'].includes(i.type) && !(i.type === 'event' && i.status === 'done') && !(i as { archivedAt?: string }).archivedAt);

describe('Planning → Brassins › Atelier › Carnet et Matériel › À venir (« Mais et le carnet ??? », 20.11)', () => {
  const plan = planAtelier(fixture, enLigne, new Set(), LE);
  const apres = appliquerEcritures(enLigne, plan.carnet);

  it('les travaux et les jalons se voient dans le Carnet de l’Atelier, en « À faire », datés à leur échéance', () => {
    const vus = visiblesAtelier(plan.atelier);
    expect(vus.map(i => i.title)).toEqual([
      'Sol — matières premières + outils (peut faire en 2x)', 'Conformité — dossiers SAAV + SEn + assurances', 'Installation électrique 27A (2027)',
      '2ème évier (2027)', 'Jalon — Peut brasser au local (sans autorisation vente)', 'Jalon — Conformité complète — Peut vendre officiellement'
    ]);
    expect(vus.every(i => i.type === 'event' && i.status === 'todo')).toBe(true);
    const conformite = vus.find(i => i.title.startsWith('Conformité'))!;
    expect(lireSuisse(conformite.date)?.getFullYear()).toBe(2027);
    expect(conformite.date).toBe('31.12.2027');
    expect(conformite.estimatedCost).toBe(850);
    expect(vus.find(i => i.title.startsWith('Sol —'))!.notes).toBe('En cours au 20.11.2026');
    expect(plan.atelier.filter(i => i.status === 'done').map(i => i.id)).toEqual(['CR-PLANNING-T-06', 'CR-PLANNING-T-07', 'CR-PLANNING-T-08', 'CR-PLANNING-T-09', 'CR-PLANNING-T-10']);
  });

  it('les achats d’équipement vont dans Matériel › À venir, valides, liés à leur idée du Carnet', () => {
    expect(plan.plans.map(p => p.title)).toEqual(fixture.filter(t => ACHATS.includes(t.id)).map(t => t.description));
    for (const p of plan.plans) {
      expect(() => validateUpgrade(p)).not.toThrow();
      expect(p.status).toBe('draft');
      expect(p.upgrade?.sourceCarnetId).toBe(idCarnetPlanning(p.id.replace('PLAN-PLANNING-', '').replace(/^T-0/, 'T-')));
    }
    const frigo = plan.plans.find(p => p.title === 'Frigo + congel')!;
    expect([frigo.amountCents, frigo.date, frigo.fenetre]).toEqual([40000, '2027-05-01', { du: '2026-07-27', au: '2027-05-02' }]);
    for (const p of plan.plans) expect(lireCarnet(apres.find(d => d.id === p.upgrade!.sourceCarnetId))!.carnet.sortie?.planId).toBe(p.id);
  });

  it('garde les 12 380 CHF une seule fois : travaux en coût estimé, achats en À venir', () => {
    const total = plan.atelier.reduce((s, i) => s + (i.estimatedCost ?? 0), 0) + plan.plans.reduce((s, p) => s + p.amountCents / 100, 0);
    expect(total).toBe(12380);
  });

  it('au Calendrier : travaux à venir en barre d’Activités chiffrée, jalons dans « Sans date », achats par leur plan', () => {
    const elec = choseCreative(plan.atelier.find(i => i.id === 'CR-PLANNING-T-20')!)!;
    expect([elec.rangee, elec.debut, elec.fin, elec.centimes]).toEqual(['activites', '2027-04-26', '2027-07-04', -150000]);
    expect(plan.atelier.filter(i => i.title.startsWith('Jalon')).map(i => choseSansDate(i)?.titre)).toEqual(['Jalon — Peut brasser au local (sans autorisation vente)', 'Jalon — Conformité complète — Peut vendre officiellement']);
    expect(choseCreative(plan.atelier.find(i => i.id === 'CR-PLANNING-T-06')!)).toBeNull();
  });

  it('les idées des travaux quittent les Carnets d’idées (archivées, rien d’effacé) ; seules les 8 idées d’achat y restent', () => {
    expect(lireCarnets(apres).map(c => c.id).sort()).toEqual(ACHATS.map(idCarnetPlanning).sort());
    expect(lireCarnet(apres.find(d => d.id === idCarnetPlanning('T-20')))!.carnet.archive?.raison).toBe('Porté dans Brassins › Atelier › Carnet (À faire)');
  });

  it('est idempotent', () => {
    const ids = new Set([...plan.atelier.map(i => i.id), ...plan.plans.map(p => p.id)]);
    const relance = planAtelier(fixture, apres, ids, LE);
    expect([relance.atelier, relance.plans, relance.carnet]).toEqual([[], [], []]);
  });
});
