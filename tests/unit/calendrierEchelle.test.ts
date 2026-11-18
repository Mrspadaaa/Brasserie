import { describe, expect, it } from 'vitest';
import {
  aDesJours, cibleDuGlisse, colonnesDeLAxe, echelleApres, echelleEffective, lettreDuJour, peutDeplier, sensPincement, uniteColonne
} from '../../src/ui/calendrier/echelle';

/* D385 : l'axe en jours, semaines, mois. Semaines du lun. 16 nov. 2026 (S47) au lun. 21 déc. (S52) ; mois de nov. 2026 à févr. 2027. */
const SEM = [16, 23, 30].map(d => ({ debut: `2026-11-${d}`, numero: 47 + (d - 16) / 7 }))
  .concat([7, 14, 21].map((d, i) => ({ debut: `2026-12-${String(d).padStart(2, '0')}`, numero: 50 + i })));
const MOIS = [
  { debut: '2026-11-01', fin: '2026-11-30', court: 'nov.' },
  { debut: '2026-12-01', fin: '2026-12-31', court: 'déc.' },
  { debut: '2027-01-01', fin: '2027-01-31', court: 'janv.' }
];

describe('échelle de l’axe (D385)', () => {
  it('semaine par défaut ; jour seulement jusqu’à 3 semaines ; mois dès 3 mois ; l’An en mois', () => {
    expect(echelleEffective('semaine', 6, false)).toBe('semaine');
    expect(echelleEffective('jour', 2, false)).toBe('jour');
    expect(echelleEffective('jour', 13, false)).toBe('semaine');
    expect(echelleEffective('mois', 26, false)).toBe('mois');
    expect(echelleEffective('mois', 6, false)).toBe('semaine');
    expect(echelleEffective('semaine', 52, true)).toBe('mois');
  });

  it('les colonnes : 14 jours en Jour, 6 semaines en Semaine, les mois touchés en Mois', () => {
    const jours = colonnesDeLAxe({ echelle: 'jour', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 2 });
    expect(jours).toHaveLength(14);
    expect(jours[0]).toMatchObject({ debut: '2026-11-16', fin: '2026-11-16', etiquette: '16 nov.' });
    expect(jours.every(c => uniteColonne(c) === 'jour')).toBe(true);
    const sem = colonnesDeLAxe({ echelle: 'semaine', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 6 });
    expect(sem.map(c => c.etiquette)).toEqual(['S47', 'S48', 'S49', 'S50', 'S51', 'S52']);
    expect(aDesJours(sem)).toBe(false);
    const mois = colonnesDeLAxe({ echelle: 'mois', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 6 });
    expect(mois.map(c => c.etiquette)).toEqual(['nov.', 'déc.']);
    expect(uniteColonne(mois[0])).toBe('mois');
  });

  it('déplier une semaine : ses 7 jours sur place, les autres restent en semaines ; replier rend les 6 semaines', () => {
    const dep = colonnesDeLAxe({ echelle: 'semaine', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 6, deplie: '2026-11-23' });
    expect(dep).toHaveLength(12);
    expect(dep[0].etiquette).toBe('S47');
    expect(dep.slice(1, 8).map(c => c.debut)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']);
    expect(dep[8].etiquette).toBe('S49');
    const replie = colonnesDeLAxe({ echelle: 'semaine', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 6, deplie: null });
    expect(replie).toHaveLength(6);
    expect(lettreDuJour('2026-11-23')).toBe('L');
    expect(lettreDuJour('2026-11-29')).toBe('D');
  });

  it('une semaine se déplie si ses jours gardent 16 px : 6 sem. et 3 mois à 344 px, pas 6 mois', () => {
    expect(peutDeplier(344, 6)).toBe(true);
    expect(peutDeplier(344, 13)).toBe(true);
    expect(peutDeplier(344, 26)).toBe(false);
  });

  it('le glisser sur des jours vise un jour ; sur des semaines, garde le jour de la semaine', () => {
    const jours = colonnesDeLAxe({ echelle: 'jour', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 2 });
    expect(cibleDuGlisse(jours, 3, 2, '2026-11-19')).toEqual({ cible: '2026-11-21', jours: 2 });
    expect(cibleDuGlisse(jours, 3, -10, '2026-11-19')).toEqual({ cible: '2026-11-16', jours: -3 });
    const dep = colonnesDeLAxe({ echelle: 'semaine', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 6, deplie: '2026-11-16' });
    /* d'un jour (mer. 18) à la semaine S48 : son lundi */
    expect(cibleDuGlisse(dep, 2, 5, '2026-11-18')).toEqual({ cible: '2026-11-23', jours: 5 });
    const sem = colonnesDeLAxe({ echelle: 'semaine', semaines: SEM, mois: MOIS, du: '2026-11-16', nombre: 6 });
    expect(cibleDuGlisse(sem, 0, 1, '2026-11-18')).toEqual({ cible: '2026-11-25', jours: 7 });
  });

  it('pincer : un cran au-delà des seuils, rien entre les deux ; écarter va vers les jours, pincer vers les mois', () => {
    expect(sensPincement(100, 130)).toBe('ecarter');
    expect(sensPincement(100, 75)).toBe('pincer');
    expect(sensPincement(100, 110)).toBeNull();
    expect(sensPincement(0, 50)).toBeNull();
    expect(echelleApres('semaine', 'ecarter')).toBe('jour');
    expect(echelleApres('mois', 'ecarter')).toBe('semaine');
    expect(echelleApres('semaine', 'pincer')).toBe('mois');
    expect(echelleApres('jour', 'ecarter')).toBeNull();
    expect(echelleApres('mois', 'pincer')).toBeNull();
  });
});

describe('D385 : l’étiquette de la fenêtre de 2 semaines reste dans la courbe (banc du 18.11, « S47 – S48 » coupée hors de l’écran)', () => {
  it('cadre assez large : centrée dessous ; cadre étroit : une ligne à côté, à droite s’il y a la place, sinon à gauche', async () => {
    const { placeEtiquette } = await import('../../src/ui/calendrier/entete/Courbe');
    const large = placeEtiquette('S47 – S52', 0, 300, 366);
    expect(large.dehors).toBe(false);
    expect(large.l).toBeCloseTo(150 - large.w / 2);
    const etroit = placeEtiquette('S47 – S48', 0, 14, 366);
    expect(etroit).toMatchObject({ dehors: true, lignes: ['S47 – S48'], l: 18 });
    const auBout = placeEtiquette('S51 – S52', 352, 14, 366);
    expect(auBout.dehors).toBe(true);
    expect(auBout.l + auBout.w).toBeLessThanOrEqual(348);
    expect(auBout.l).toBeGreaterThanOrEqual(0);
  });
});
