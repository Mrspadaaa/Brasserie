import { describe, expect, it } from 'vitest';
import taches from '../../scripts/planning-vers-carnet/fixture-planning.json';
import { planMigration, idCarnetPlanning, type TachePlanning } from '../../scripts/planning-vers-carnet/correspondance';
import { planEtats } from '../../scripts/planning-vers-carnet/etats';
import { ACHATS, planAtelier } from '../../scripts/planning-vers-carnet/atelier';
import { planRetour, RAISON_PORT_ATELIER } from '../../scripts/planning-vers-carnet/retour';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { lireCarnet, lireCarnets } from '../../src/domain/carnets/modele';
import { iconesIdees } from '../../src/domain/calendrier';
import { validateUpgrade } from '../../src/domain/finance/upgrades';
import type { CreativeItem } from '../../src/types';

const LE = '2026-11-20T18:00:00.000Z';
const fixture = taches as TachePlanning[];
const TRAVAUX_OUVERTS = ['T-11', 'T-15', 'T-20', 'T-22', 'T-23', 'T-24'];
/* l'état en ligne au 20.11 : 19 idées portées, puis ses états (1 à 5 faites, 6 en cours, 7 à 11 pas encore) */
const portees = planMigration(fixture, new Set(), '2026-11-20T12:00:00.000Z').aEcrire.flatMap(c => c.docs);
const enLigne = appliquerEcritures(portees, planEtats(portees, '2026-11-20T17:00:00.000Z').ecritures);

describe('Planning → Matériel › À venir : les achats d’équipement, liés à leur idée du Carnet (20.11)', () => {
  const plan = planAtelier(fixture, enLigne, new Set(), LE);
  const apres = appliquerEcritures(enLigne, plan.carnet);

  it('8 achats dans À venir, valides, chacun lié à son idée (sortie) ; aucune autre écriture', () => {
    expect(plan.plans.map(p => p.title)).toEqual(fixture.filter(t => ACHATS.includes(t.id)).map(t => t.description));
    for (const p of plan.plans) {
      expect(() => validateUpgrade(p)).not.toThrow();
      expect(p.status).toBe('draft');
      expect(lireCarnet(apres.find(d => d.id === p.upgrade!.sourceCarnetId))!.carnet.sortie?.planId).toBe(p.id);
    }
    const frigo = plan.plans.find(p => p.title === 'Frigo + congel')!;
    expect([frigo.amountCents, frigo.date, frigo.fenetre]).toEqual([40000, '2027-05-01', { du: '2026-07-27', au: '2027-05-02' }]);
    expect(plan.carnet.every(w => w.op === 'put' && ACHATS.map(idCarnetPlanning).includes(w.doc.id))).toBe(true);
    expect(planAtelier(fixture, apres, new Set(plan.plans.map(p => p.id)), LE)).toEqual({ plans: [], carnet: [], lignes: [] });
  });
});

describe('Décision (a), 20.11 : le Carnet choisi (CarnetsVue) garde les projets ; l’ancien carnet de l’Atelier n’en a aucun', () => {
  /* l'état en ligne après le détour par l'Atelier (96e4b5e22) : 6 idées de travaux archivées, 11 « À faire » de l'ancien carnet */
  const detour: CreativeItem[] = enLigne.map(d => (TRAVAUX_OUVERTS.map(idCarnetPlanning).includes(d.id) ? { ...d, carnet: { ...d.carnet!, archive: { le: LE, raison: RAISON_PORT_ATELIER } } } : d));
  const anciens: CreativeItem[] = [6, 7, 8, 9, 10, 11, 15, 20, 22, 23, 24].map(n => ({ id: `CR-PLANNING-T-${String(n).padStart(2, '0')}`, type: 'event', title: `T-${n}`, status: 'todo' }));
  const retour = planRetour([...detour, ...anciens]);
  const apres = [...detour.map(d => retour.desarchiver.find(x => x.id === d.id) ?? d)];

  it('les 6 idées de travaux reviennent au Carnet : 14 projets (8 achats, 6 travaux et jalons), les 5 faites restent archivées', () => {
    expect(retour.desarchiver.map(d => d.id).sort()).toEqual(TRAVAUX_OUVERTS.map(idCarnetPlanning).sort());
    expect(lireCarnets(apres)).toHaveLength(14);
    expect(lireCarnets(detour)).toHaveLength(8);
    expect(['T-6', 'T-7', 'T-8', 'T-9', 'T-10'].every(t => !!lireCarnet(apres.find(d => d.id === idCarnetPlanning(t)))!.carnet.archive)).toBe(true);
  });

  it('les 11 « À faire » de l’ancien carnet sont retirés, rien d’autre', () => {
    expect(retour.retirer).toEqual(anciens.map(a => a.id).sort());
  });

  it('au Calendrier, les idées datées retrouvent leur ampoule, dates inchangées', () => {
    const avant = iconesIdees(detour).length, ensuite = iconesIdees(apres);
    expect(ensuite.length - avant).toBe(4);
    expect(ensuite.find(i => i.titre.startsWith('Installation électrique'))?.lundi).toBe('2027-04-26');
  });
});
